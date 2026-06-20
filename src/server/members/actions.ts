'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLog,
  classes,
  dojos,
  memberClassAssignments,
  members,
  promotions,
  rankDefinitions,
  ranks,
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { katakanaForFirstName } from '@/lib/katakana';
import { currentOrganizationId, requireRole } from '@/lib/rbac';
import {
  memberIdSchema,
  memberInputSchema,
  memberStatusUpdateSchema,
  memberTransferSchema,
  promoteMemberSchema,
  type MemberInput,
  type MemberStatusUpdateInput,
  type MemberTransferInput,
  type PromoteMemberInput,
} from './schemas';

export type MemberActionErrorCode =
  | 'generic'
  | 'noOrganizationContext'
  | 'validationFailed'
  | 'notFound'
  | 'invalidRank'
  | 'alreadyHighestRank'
  | 'invalidDojo'
  | 'invalidClass';

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: MemberActionErrorCode;
  fieldErrors?: Record<string, string[]>;
}

async function activeDojoInOrg(organizationId: string, dojoId: string) {
  const [dojo] = await db
    .select({ id: dojos.id })
    .from(dojos)
    .where(
      and(eq(dojos.id, dojoId), eq(dojos.organizationId, organizationId), isNull(dojos.deletedAt)),
    );
  return dojo ?? null;
}

export async function createMemberAction(
  input: MemberInput,
): Promise<ActionResult<{ id: string }>> {
  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin'], {
    organizationId: orgId,
  });

  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;
  const firstNameKatakana = v.firstNameKatakana ?? katakanaForFirstName(v.firstName);
  const auditAfter = { ...v, firstNameKatakana };
  const dojo = await activeDojoInOrg(orgId, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [row] = await db
    .insert(members)
    .values({
      organizationId: orgId,
      dojoId: dojo.id,
      firstName: v.firstName,
      firstNameKatakana,
      lastName: v.lastName,
      code: v.code,
      curp: v.curp,
      email: v.email,
      phone: v.phone,
      emergencyPhone: v.emergencyPhone,
      dateOfBirth: v.dateOfBirth,
      bloodType: v.bloodType,
      specialCareNotes: v.specialCareNotes,
      status: v.status,
      notes: v.notes,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    })
    .returning({ id: members.id });

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'member.create',
    entity: 'member',
    entityId: row!.id,
    after: auditAfter as unknown as Record<string, unknown>,
  });

  revalidatePath('/members');
  return { ok: true, data: { id: row!.id } };
}

export async function updateMemberAction(
  id: string,
  input: MemberInput,
): Promise<ActionResult<{ id: string }>> {
  if (!memberIdSchema.safeParse(id).success) {
    return { ok: false, error: 'notFound' };
  }

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin'], {
    organizationId: orgId,
  });

  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;
  const firstNameKatakana = v.firstNameKatakana ?? katakanaForFirstName(v.firstName);
  const auditAfter = { ...v, firstNameKatakana };
  const dojo = await activeDojoInOrg(orgId, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [before] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.deletedAt)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(members)
    .set({
      dojoId: dojo.id,
      firstName: v.firstName,
      firstNameKatakana: firstNameKatakana || null,
      lastName: v.lastName,
      code: v.code ?? null,
      curp: v.curp ?? null,
      email: v.email ?? null,
      phone: v.phone ?? null,
      emergencyPhone: v.emergencyPhone ?? null,
      dateOfBirth: v.dateOfBirth ?? null,
      bloodType: v.bloodType ?? null,
      specialCareNotes: v.specialCareNotes ?? null,
      status: v.status,
      notes: v.notes ?? null,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.deletedAt)));

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'member.update',
    entity: 'member',
    entityId: id,
    before: before as unknown as Record<string, unknown>,
    after: auditAfter as unknown as Record<string, unknown>,
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { ok: true, data: { id } };
}

export async function promoteMemberAction(
  id: string,
  input: PromoteMemberInput,
): Promise<ActionResult<{ id: string }>> {
  if (!memberIdSchema.safeParse(id).success) return { ok: false, error: 'notFound' };

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin', 'instructor'], {
    organizationId: orgId,
  });

  const parsed = promoteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.deletedAt)));
  if (!member) return { ok: false, error: 'notFound' };

  const [target] = await db
    .select({ id: rankDefinitions.id, level: rankDefinitions.level, name: rankDefinitions.name })
    .from(rankDefinitions)
    .where(
      and(
        eq(rankDefinitions.id, v.targetRankDefinitionId),
        eq(rankDefinitions.organizationId, orgId),
        isNull(rankDefinitions.deletedAt),
      ),
    );
  if (!target) return { ok: false, error: 'invalidRank' };

  const [current] = await db
    .select({ id: ranks.id, level: rankDefinitions.level })
    .from(ranks)
    .innerJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
    .where(and(eq(ranks.memberId, id), eq(ranks.isCurrent, sql`true`)));

  if (current && target.level <= current.level) {
    return { ok: false, error: 'alreadyHighestRank' };
  }

  const awardedAt = v.examDate ?? new Date().toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    await tx.update(ranks).set({ isCurrent: false }).where(eq(ranks.memberId, id));
    await tx.insert(ranks).values({
      memberId: id,
      rankDefinitionId: target.id,
      awardedAt,
      awardedBy: session.user.id,
      isCurrent: true,
      notes: v.notes,
    });
    await tx.insert(promotions).values({
      memberId: id,
      targetRankDefinitionId: target.id,
      status: 'approved',
      recommendedBy: session.user.id,
      approvedBy: session.user.id,
      examDate: awardedAt,
      score: v.score,
      notes: v.notes,
    });
    await tx.insert(auditLog).values({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: 'member.promote',
      entity: 'member',
      entityId: id,
      after: { ...v, targetRankDefinitionId: target.id, targetRankName: target.name },
    });
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { ok: true, data: { id } };
}

export async function updateMemberStatusAction(
  id: string,
  input: MemberStatusUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  if (!memberIdSchema.safeParse(id).success) return { ok: false, error: 'notFound' };

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin'], { organizationId: orgId });

  const parsed = memberStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const [before] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.deletedAt)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(members)
    .set({ status: v.status, updatedBy: session.user.id, updatedAt: new Date() })
    .where(eq(members.id, id));

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'member.status_update',
    entity: 'member',
    entityId: id,
    before: before as unknown as Record<string, unknown>,
    after: v,
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { ok: true, data: { id } };
}

export async function transferMemberDojoAction(
  id: string,
  input: MemberTransferInput,
): Promise<ActionResult<{ id: string }>> {
  if (!memberIdSchema.safeParse(id).success) return { ok: false, error: 'notFound' };

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin'], { organizationId: orgId });

  const parsed = memberTransferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const targetDojo = await activeDojoInOrg(orgId, v.targetDojoId);
  if (!targetDojo) return { ok: false, error: 'invalidDojo' };

  const [before] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.deletedAt)));
  if (!before) return { ok: false, error: 'notFound' };

  await db.transaction(async (tx) => {
    await tx
      .update(members)
      .set({ dojoId: targetDojo.id, updatedBy: session.user.id, updatedAt: new Date() })
      .where(eq(members.id, id));
    await tx
      .update(memberClassAssignments)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(memberClassAssignments.memberId, id),
          isNull(memberClassAssignments.endedAt),
          sql`EXISTS (
            SELECT 1
            FROM ${classes}
            WHERE ${classes.id} = ${memberClassAssignments.classId}
              AND ${classes.dojoId} <> ${targetDojo.id}
          )`,
        ),
      );
    await tx.insert(auditLog).values({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: 'member.transfer_dojo',
      entity: 'member',
      entityId: id,
      before: before as unknown as Record<string, unknown>,
      after: v,
    });
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { ok: true, data: { id } };
}

export async function softDeleteMemberAction(id: string): Promise<ActionResult> {
  if (!memberIdSchema.safeParse(id).success) {
    return { ok: false, error: 'notFound' };
  }

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin'], { organizationId: orgId });

  await db
    .update(members)
    .set({ deletedAt: new Date(), updatedBy: session.user.id })
    .where(and(eq(members.id, id), eq(members.organizationId, orgId)));

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'member.delete',
    entity: 'member',
    entityId: id,
  });

  revalidatePath('/members');
  return { ok: true };
}

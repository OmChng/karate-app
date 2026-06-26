'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLog,
  classes,
  memberClassAssignments,
  members,
  promotions,
  rankDefinitions,
  ranks,
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { katakanaForFirstName } from '@/lib/katakana';
import { getRoleAccessScope, requireRole, type RoleAccessScope } from '@/lib/rbac';
import { getActiveDojoForAccess } from '@/server/access';
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

function memberAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(members.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(members.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

function memberAccessFilters(scope: RoleAccessScope, id: string): SQL[] {
  const filters: SQL[] = [eq(members.id, id), isNull(members.deletedAt)];
  const accessFilter = memberAccessPredicate(scope);
  if (accessFilter) filters.push(accessFilter);
  return filters;
}

export async function createMemberAction(
  input: MemberInput,
): Promise<ActionResult<{ id: string }>> {
  const raw = await auth();
  const allowedRoles = ['organization_admin', 'dojo_admin'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

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
  const dojo = await getActiveDojoForAccess(accessScope, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [row] = await db
    .insert(members)
    .values({
      organizationId: dojo.organizationId,
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
    organizationId: dojo.organizationId,
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
  const allowedRoles = ['organization_admin', 'dojo_admin'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

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
  const dojo = await getActiveDojoForAccess(accessScope, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [before] = await db
    .select()
    .from(members)
    .where(and(...memberAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(members)
    .set({
      organizationId: dojo.organizationId,
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
    .where(and(...memberAccessFilters(accessScope, id)));

  await db.insert(auditLog).values({
    organizationId: dojo.organizationId,
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
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

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
    .select({ id: members.id, organizationId: members.organizationId })
    .from(members)
    .where(and(...memberAccessFilters(accessScope, id)));
  if (!member) return { ok: false, error: 'notFound' };

  const [target] = await db
    .select({ id: rankDefinitions.id, level: rankDefinitions.level, name: rankDefinitions.name })
    .from(rankDefinitions)
    .where(
      and(
        eq(rankDefinitions.id, v.targetRankDefinitionId),
        eq(rankDefinitions.organizationId, member.organizationId),
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
      organizationId: member.organizationId,
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
  const allowedRoles = ['organization_admin', 'dojo_admin'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

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
    .where(and(...memberAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(members)
    .set({ status: v.status, updatedBy: session.user.id, updatedAt: new Date() })
    .where(and(...memberAccessFilters(accessScope, id)));

  await db.insert(auditLog).values({
    organizationId: before.organizationId,
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
  const allowedRoles = ['organization_admin', 'dojo_admin'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const parsed = memberTransferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const targetDojo = await getActiveDojoForAccess(accessScope, v.targetDojoId);
  if (!targetDojo) return { ok: false, error: 'invalidDojo' };

  const [before] = await db
    .select()
    .from(members)
    .where(and(...memberAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db.transaction(async (tx) => {
    await tx
      .update(members)
      .set({
        organizationId: targetDojo.organizationId,
        dojoId: targetDojo.id,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(...memberAccessFilters(accessScope, id)));
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
              AND (
                ${classes.organizationId} <> ${targetDojo.organizationId}
                OR ${classes.dojoId} <> ${targetDojo.id}
              )
          )`,
        ),
      );
    await tx.insert(auditLog).values({
      organizationId: targetDojo.organizationId,
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
  const allowedRoles = ['organization_admin'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const [before] = await db
    .select()
    .from(members)
    .where(and(...memberAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(members)
    .set({ deletedAt: new Date(), updatedBy: session.user.id })
    .where(and(...memberAccessFilters(accessScope, id)));

  await db.insert(auditLog).values({
    organizationId: before.organizationId,
    actorUserId: session.user.id,
    action: 'member.delete',
    entity: 'member',
    entityId: id,
  });

  revalidatePath('/members');
  return { ok: true };
}

'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { auditLog, classes, dojos, memberClassAssignments, members } from '@/db/schema';
import { classDateFromTime } from '@/lib/class-schedule';
import { auth } from '@/lib/auth';
import { currentOrganizationId, requireRole } from '@/lib/rbac';
import {
  classAssignmentInputSchema,
  classIdSchema,
  classInputSchema,
  type ClassAssignmentInput,
  type ClassInput,
} from './schemas';

export type ClassActionErrorCode =
  | 'generic'
  | 'noOrganizationContext'
  | 'validationFailed'
  | 'notFound'
  | 'invalidDojo'
  | 'invalidClass'
  | 'invalidMember'
  | 'dojoMismatch';

export interface ClassActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: ClassActionErrorCode;
  fieldErrors?: Record<string, string[]>;
}

export async function createClassAction(
  input: ClassInput,
): Promise<ClassActionResult<{ id: string }>> {
  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin', 'instructor'], {
    organizationId: orgId,
  });

  const parsed = classInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const [dojo] = await db
    .select({ id: dojos.id })
    .from(dojos)
    .where(and(eq(dojos.id, v.dojoId), eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)));
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [row] = await db
    .insert(classes)
    .values({
      organizationId: orgId,
      dojoId: dojo.id,
      name: v.name,
      startsAt: classDateFromTime(v.startTime),
      endsAt: classDateFromTime(v.endTime),
      recurrenceRule: v.days.join(','),
      capacity: v.capacity,
      notes: v.notes,
    })
    .returning({ id: classes.id });

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'class.create',
    entity: 'class',
    entityId: row!.id,
    after: v as unknown as Record<string, unknown>,
  });

  revalidatePath('/classes');
  revalidatePath('/clases');
  return { ok: true, data: { id: row!.id } };
}

export async function assignMemberToClassAction(
  input: ClassAssignmentInput,
): Promise<ClassActionResult> {
  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin', 'instructor'], {
    organizationId: orgId,
  });

  const parsed = classAssignmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const [member] = await db
    .select({ id: members.id, dojoId: members.dojoId })
    .from(members)
    .where(
      and(eq(members.id, v.memberId), eq(members.organizationId, orgId), isNull(members.deletedAt)),
    );
  if (!member) return { ok: false, error: 'invalidMember' };

  const [classRow] = await db
    .select({ id: classes.id, dojoId: classes.dojoId })
    .from(classes)
    .where(
      and(eq(classes.id, v.classId), eq(classes.organizationId, orgId), isNull(classes.deletedAt)),
    );
  if (!classRow) return { ok: false, error: 'invalidClass' };
  if (classRow.dojoId !== member.dojoId) return { ok: false, error: 'dojoMismatch' };

  const existing = await db
    .select({ id: memberClassAssignments.id })
    .from(memberClassAssignments)
    .where(
      and(
        eq(memberClassAssignments.memberId, member.id),
        eq(memberClassAssignments.classId, classRow.id),
        isNull(memberClassAssignments.endedAt),
      ),
    );

  if (existing.length === 0) {
    await db.insert(memberClassAssignments).values({
      memberId: member.id,
      classId: classRow.id,
    });
  }

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'class.assign_member',
    entity: 'class',
    entityId: classRow.id,
    after: v,
  });

  revalidatePath('/classes');
  revalidatePath(`/classes/${classRow.id}`);
  revalidatePath(`/members/${member.id}`);
  return { ok: true };
}

export async function endMemberClassAssignmentAction(
  input: ClassAssignmentInput,
): Promise<ClassActionResult> {
  if (
    !classIdSchema.safeParse(input.classId).success ||
    !classIdSchema.safeParse(input.memberId).success
  ) {
    return { ok: false, error: 'validationFailed' };
  }

  const raw = await auth();
  const orgId = currentOrganizationId(raw);
  if (!orgId) return { ok: false, error: 'noOrganizationContext' };
  const session = requireRole(raw, ['organization_admin', 'dojo_admin', 'instructor'], {
    organizationId: orgId,
  });

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.id, input.memberId),
        eq(members.organizationId, orgId),
        isNull(members.deletedAt),
      ),
    );
  if (!member) return { ok: false, error: 'invalidMember' };

  const [classRow] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, input.classId), eq(classes.organizationId, orgId)));
  if (!classRow) return { ok: false, error: 'invalidClass' };

  await db
    .update(memberClassAssignments)
    .set({ endedAt: new Date() })
    .where(
      and(
        eq(memberClassAssignments.memberId, member.id),
        eq(memberClassAssignments.classId, classRow.id),
        isNull(memberClassAssignments.endedAt),
      ),
    );

  await db.insert(auditLog).values({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: 'class.unassign_member',
    entity: 'class',
    entityId: classRow.id,
    after: input,
  });

  revalidatePath('/classes');
  revalidatePath(`/classes/${classRow.id}`);
  revalidatePath(`/members/${member.id}`);
  return { ok: true };
}

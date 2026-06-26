'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { auditLog, classes, memberClassAssignments, members } from '@/db/schema';
import { classDateFromTime } from '@/lib/class-schedule';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, requireRole, type RoleAccessScope } from '@/lib/rbac';
import { getActiveDojoForAccess } from '@/server/access';
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

function classAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(classes.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(classes.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
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

function classAccessFilters(scope: RoleAccessScope, id: string): SQL[] {
  const filters: SQL[] = [eq(classes.id, id), isNull(classes.deletedAt)];
  const accessFilter = classAccessPredicate(scope);
  if (accessFilter) filters.push(accessFilter);
  return filters;
}

function memberAccessFilters(scope: RoleAccessScope, id: string): SQL[] {
  const filters: SQL[] = [eq(members.id, id), isNull(members.deletedAt)];
  const accessFilter = memberAccessPredicate(scope);
  if (accessFilter) filters.push(accessFilter);
  return filters;
}

export async function createClassAction(
  input: ClassInput,
): Promise<ClassActionResult<{ id: string }>> {
  const raw = await auth();
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const parsed = classInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const dojo = await getActiveDojoForAccess(accessScope, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [row] = await db
    .insert(classes)
    .values({
      organizationId: dojo.organizationId,
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
    organizationId: dojo.organizationId,
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

export async function updateClassAction(
  id: string,
  input: ClassInput,
): Promise<ClassActionResult<{ id: string }>> {
  if (!classIdSchema.safeParse(id).success) {
    return { ok: false, error: 'notFound' };
  }

  const raw = await auth();
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const parsed = classInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const v = parsed.data;

  const dojo = await getActiveDojoForAccess(accessScope, v.dojoId);
  if (!dojo) return { ok: false, error: 'invalidDojo' };

  const [before] = await db
    .select()
    .from(classes)
    .where(and(...classAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db
    .update(classes)
    .set({
      organizationId: dojo.organizationId,
      dojoId: dojo.id,
      name: v.name,
      startsAt: classDateFromTime(v.startTime),
      endsAt: classDateFromTime(v.endTime),
      recurrenceRule: v.days.join(','),
      capacity: v.capacity,
      notes: v.notes,
      updatedAt: new Date(),
    })
    .where(and(...classAccessFilters(accessScope, id)));

  await db.insert(auditLog).values({
    organizationId: dojo.organizationId,
    actorUserId: session.user.id,
    action: 'class.update',
    entity: 'class',
    entityId: id,
    before: before as unknown as Record<string, unknown>,
    after: v as unknown as Record<string, unknown>,
  });

  revalidatePath('/classes');
  revalidatePath('/clases');
  revalidatePath(`/classes/${id}`);
  revalidatePath(`/clases/${id}`);
  return { ok: true, data: { id } };
}

export async function softDeleteClassAction(id: string): Promise<ClassActionResult> {
  if (!classIdSchema.safeParse(id).success) {
    return { ok: false, error: 'notFound' };
  }

  const raw = await auth();
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const [before] = await db
    .select()
    .from(classes)
    .where(and(...classAccessFilters(accessScope, id)));
  if (!before) return { ok: false, error: 'notFound' };

  await db.transaction(async (tx) => {
    const endedAt = new Date();
    await tx
      .update(classes)
      .set({ deletedAt: endedAt, updatedAt: endedAt })
      .where(and(...classAccessFilters(accessScope, id)));
    await tx
      .update(memberClassAssignments)
      .set({ endedAt })
      .where(and(eq(memberClassAssignments.classId, id), isNull(memberClassAssignments.endedAt)));
    await tx.insert(auditLog).values({
      organizationId: before.organizationId,
      actorUserId: session.user.id,
      action: 'class.delete',
      entity: 'class',
      entityId: id,
      before: before as unknown as Record<string, unknown>,
    });
  });

  revalidatePath('/classes');
  revalidatePath('/clases');
  revalidatePath(`/classes/${id}`);
  revalidatePath(`/clases/${id}`);
  return { ok: true };
}

export async function assignMemberToClassAction(
  input: ClassAssignmentInput,
): Promise<ClassActionResult> {
  const raw = await auth();
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

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
    .select({ id: members.id, organizationId: members.organizationId, dojoId: members.dojoId })
    .from(members)
    .where(and(...memberAccessFilters(accessScope, v.memberId)));
  if (!member) return { ok: false, error: 'invalidMember' };

  const [classRow] = await db
    .select({ id: classes.id, organizationId: classes.organizationId, dojoId: classes.dojoId })
    .from(classes)
    .where(and(...classAccessFilters(accessScope, v.classId)));
  if (!classRow) return { ok: false, error: 'invalidClass' };
  if (classRow.organizationId !== member.organizationId || classRow.dojoId !== member.dojoId) {
    return { ok: false, error: 'dojoMismatch' };
  }

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
    organizationId: classRow.organizationId,
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
  const allowedRoles = ['organization_admin', 'dojo_admin', 'instructor'] as const;
  const session = requireRole(raw, allowedRoles);
  const accessScope = getRoleAccessScope(session, allowedRoles);

  const [member] = await db
    .select({ id: members.id, organizationId: members.organizationId, dojoId: members.dojoId })
    .from(members)
    .where(and(...memberAccessFilters(accessScope, input.memberId)));
  if (!member) return { ok: false, error: 'invalidMember' };

  const [classRow] = await db
    .select({ id: classes.id, organizationId: classes.organizationId, dojoId: classes.dojoId })
    .from(classes)
    .where(and(...classAccessFilters(accessScope, input.classId)));
  if (!classRow) return { ok: false, error: 'invalidClass' };
  if (classRow.organizationId !== member.organizationId || classRow.dojoId !== member.dojoId) {
    return { ok: false, error: 'dojoMismatch' };
  }

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
    organizationId: classRow.organizationId,
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

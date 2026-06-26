import { and, asc, count, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  classes,
  dojos,
  files,
  memberClassAssignments,
  members,
  rankDefinitions,
  ranks,
} from '@/db/schema';
import { formatClassSchedule } from '@/lib/class-schedule';
import type { RoleAccessScope } from '@/lib/rbac';
import { classIdSchema } from './schemas';

export interface ClassRow {
  id: string;
  name: string;
  dojoId: string;
  dojoName: string;
  scheduleLabel: string;
  capacity: number | null;
  activeMembers: number;
  status: string;
}

export interface ClassRosterMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarFileKey: string | null;
  currentRankName: string | null;
  currentRankColor: string | null;
  currentRankLevel: number | null;
  status: string;
}

export interface AssignableClassMember {
  id: string;
  firstName: string;
  lastName: string;
}

function orgScope(organizationId: string): RoleAccessScope {
  return { global: false, organizationIds: [organizationId], dojoIds: [] };
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

export async function listClassesForAccess(accessScope: RoleAccessScope): Promise<ClassRow[]> {
  const activeCounts = db
    .select({
      classId: memberClassAssignments.classId,
      activeMembers: count().as('active_members'),
    })
    .from(memberClassAssignments)
    .where(isNull(memberClassAssignments.endedAt))
    .groupBy(memberClassAssignments.classId)
    .as('active_counts');

  const filters: SQL[] = [isNull(classes.deletedAt)];
  const accessFilter = classAccessPredicate(accessScope);
  if (accessFilter) filters.push(accessFilter);

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      dojoId: classes.dojoId,
      dojoName: dojos.name,
      startsAt: classes.startsAt,
      endsAt: classes.endsAt,
      recurrenceRule: classes.recurrenceRule,
      capacity: classes.capacity,
      activeMembers: sql<number>`coalesce(${activeCounts.activeMembers}, 0)`,
      status: classes.status,
    })
    .from(classes)
    .innerJoin(dojos, eq(dojos.id, classes.dojoId))
    .leftJoin(activeCounts, eq(activeCounts.classId, classes.id))
    .where(and(...filters))
    .orderBy(asc(classes.startsAt), asc(classes.name));

  return rows.map((row) => ({
    ...row,
    activeMembers: Number(row.activeMembers ?? 0),
    scheduleLabel: formatClassSchedule(row),
  }));
}

export async function listClassesForOrg(organizationId: string): Promise<ClassRow[]> {
  return listClassesForAccess(orgScope(organizationId));
}

export async function getClassDetailForAccess(accessScope: RoleAccessScope, id: string) {
  if (!classIdSchema.safeParse(id).success) return null;

  const filters: SQL[] = [eq(classes.id, id), isNull(classes.deletedAt)];
  const accessFilter = classAccessPredicate(accessScope);
  if (accessFilter) filters.push(accessFilter);

  const [row] = await db
    .select({
      id: classes.id,
      organizationId: classes.organizationId,
      name: classes.name,
      dojoId: classes.dojoId,
      dojoName: dojos.name,
      startsAt: classes.startsAt,
      endsAt: classes.endsAt,
      recurrenceRule: classes.recurrenceRule,
      capacity: classes.capacity,
      status: classes.status,
      notes: classes.notes,
    })
    .from(classes)
    .innerJoin(dojos, eq(dojos.id, classes.dojoId))
    .where(and(...filters));

  if (!row) return null;

  const roster = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      avatarFileKey: files.key,
      currentRankName: rankDefinitions.name,
      currentRankColor: rankDefinitions.color,
      currentRankLevel: rankDefinitions.level,
      status: members.status,
    })
    .from(memberClassAssignments)
    .innerJoin(members, eq(members.id, memberClassAssignments.memberId))
    .leftJoin(files, eq(files.id, members.avatarFileId))
    .leftJoin(ranks, and(eq(ranks.memberId, members.id), eq(ranks.isCurrent, sql`true`)))
    .leftJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
    .where(
      and(
        eq(memberClassAssignments.classId, row.id),
        eq(members.organizationId, row.organizationId),
        isNull(memberClassAssignments.endedAt),
        isNull(members.deletedAt),
      ),
    )
    .orderBy(asc(members.lastName), asc(members.firstName));

  const assignedIds = new Set(roster.map((member) => member.id));
  const assignableMembers = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
    })
    .from(members)
    .where(
      and(
        eq(members.organizationId, row.organizationId),
        eq(members.dojoId, row.dojoId),
        isNull(members.deletedAt),
      ),
    )
    .orderBy(asc(members.lastName), asc(members.firstName));

  return {
    ...row,
    scheduleLabel: formatClassSchedule(row),
    roster,
    assignableMembers: assignableMembers.filter((member) => !assignedIds.has(member.id)),
  };
}

export async function getClassDetail(organizationId: string, id: string) {
  return getClassDetailForAccess(orgScope(organizationId), id);
}

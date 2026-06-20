import { and, asc, count, eq, isNull } from 'drizzle-orm';
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
import { classIdSchema } from './schemas';
import { sql } from 'drizzle-orm';

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

export async function listClassesForOrg(organizationId: string): Promise<ClassRow[]> {
  const activeCounts = db
    .select({
      classId: memberClassAssignments.classId,
      activeMembers: count().as('active_members'),
    })
    .from(memberClassAssignments)
    .where(isNull(memberClassAssignments.endedAt))
    .groupBy(memberClassAssignments.classId)
    .as('active_counts');

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
    .where(and(eq(classes.organizationId, organizationId), isNull(classes.deletedAt)))
    .orderBy(asc(classes.startsAt), asc(classes.name));

  return rows.map((row) => ({
    ...row,
    activeMembers: Number(row.activeMembers ?? 0),
    scheduleLabel: formatClassSchedule(row),
  }));
}

export async function getClassDetail(organizationId: string, id: string) {
  if (!classIdSchema.safeParse(id).success) return null;

  const [row] = await db
    .select({
      id: classes.id,
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
    .where(
      and(
        eq(classes.id, id),
        eq(classes.organizationId, organizationId),
        isNull(classes.deletedAt),
      ),
    );

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
        eq(members.organizationId, organizationId),
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

import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  attendance,
  blackBeltLeagueResults,
  classes,
  dojos,
  files,
  memberClassAssignments,
  members,
  rankDefinitions,
  ranks,
  promotions,
} from '@/db/schema';
import { formatClassSchedule } from '@/lib/class-schedule';
import {
  memberIdSchema,
  monthlyAbsenceTone,
  type AbsenceTone,
  type MemberListQuery,
  type MemberStatus,
} from './schemas';

export interface MemberRow {
  id: string;
  firstName: string;
  firstNameKatakana: string | null;
  lastName: string;
  code: string | null;
  dojoId: string;
  dojoName: string;
  status: MemberStatus;
  joinedAt: string;
  dateOfBirth: string | null;
  age: number | null;
  avatarFileKey: string | null;
  currentRankName: string | null;
  currentRankColor: string | null;
  currentRankLevel: number | null;
  assignedClassName: string | null;
  monthlyAbsences: number;
  absenceTone: AbsenceTone;
}

export interface MemberDetailClass {
  id: string;
  name: string;
  dojoName: string;
  scheduleLabel: string;
  status: string;
}

export interface MemberPromotionHistory {
  id: string;
  targetRankName: string;
  targetRankColor: string | null;
  status: string;
  examDate: string | null;
  score: string | null;
  notes: string | null;
}

export interface MemberBlackBeltLeagueResult {
  id: string;
  eventName: string;
  eventDate: string | null;
  category: string | null;
  result: string | null;
  score: string | null;
  notes: string | null;
}

export interface MemberRankOption {
  id: string;
  name: string;
  color: string | null;
  level: number;
}

export interface MemberAssignableClass {
  id: string;
  name: string;
  dojoName: string;
  scheduleLabel: string;
}

export function calculateAge(dateOfBirth: string | null, today = new Date()): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  const birthdayHasPassed =
    monthDelta > 0 || (monthDelta === 0 && today.getDate() >= birth.getDate());
  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : null;
}

function currentMonthStart(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
}

export async function listMembersForOrg(
  organizationId: string,
  q: MemberListQuery,
): Promise<{ rows: MemberRow[]; total: number }> {
  const offset = (q.page - 1) * q.pageSize;
  const monthStart = currentMonthStart();

  const filters = [eq(members.organizationId, organizationId), isNull(members.deletedAt)];
  if (q.status) filters.push(eq(members.status, q.status));
  if (q.dojoId) filters.push(eq(members.dojoId, q.dojoId));
  if (q.q && q.q.length > 0) {
    const pattern = `%${q.q}%`;
    const search = or(
      ilike(members.firstName, pattern),
      ilike(members.firstNameKatakana, pattern),
      ilike(members.lastName, pattern),
      ilike(members.code, pattern),
    );
    if (search) filters.push(search);
  }
  const where = and(...filters);

  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(members).where(where);

  const monthlyAbsenceCounts = db
    .select({
      memberId: attendance.memberId,
      monthlyAbsences: count().as('monthly_absences'),
    })
    .from(attendance)
    .where(and(eq(attendance.status, 'absent'), gte(attendance.markedAt, monthStart)))
    .groupBy(attendance.memberId)
    .as('monthly_absence_counts');
  const monthlyAbsencesExpr = sql<number>`coalesce(${monthlyAbsenceCounts.monthlyAbsences}, 0)`;
  const nameOrder =
    q.sortDir === 'desc'
      ? [desc(members.firstName), desc(members.lastName)]
      : [asc(members.firstName), asc(members.lastName)];
  const orderBy =
    q.sortBy === 'rank'
      ? [
          sql`${rankDefinitions.level} is null`,
          q.sortDir === 'desc' ? desc(rankDefinitions.level) : asc(rankDefinitions.level),
          ...nameOrder,
        ]
      : q.sortBy === 'age'
        ? [
            sql`${members.dateOfBirth} is null`,
            q.sortDir === 'desc' ? asc(members.dateOfBirth) : desc(members.dateOfBirth),
            ...nameOrder,
          ]
        : q.sortBy === 'absences'
          ? [
              q.sortDir === 'desc' ? desc(monthlyAbsencesExpr) : asc(monthlyAbsencesExpr),
              ...nameOrder,
            ]
          : nameOrder;

  const rowsQuery = db
    .select({
      id: members.id,
      firstName: members.firstName,
      firstNameKatakana: members.firstNameKatakana,
      lastName: members.lastName,
      code: members.code,
      dojoId: members.dojoId,
      dojoName: dojos.name,
      status: members.status,
      joinedAt: members.joinedAt,
      dateOfBirth: members.dateOfBirth,
      avatarFileKey: files.key,
      currentRankName: rankDefinitions.name,
      currentRankColor: rankDefinitions.color,
      currentRankLevel: rankDefinitions.level,
      monthlyAbsences: monthlyAbsencesExpr,
    })
    .from(members)
    .innerJoin(dojos, eq(dojos.id, members.dojoId))
    .leftJoin(files, eq(files.id, members.avatarFileId))
    .leftJoin(ranks, and(eq(ranks.memberId, members.id), eq(ranks.isCurrent, sql`true`)))
    .leftJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
    .leftJoin(monthlyAbsenceCounts, eq(monthlyAbsenceCounts.memberId, members.id))
    .where(where)
    .orderBy(...orderBy, asc(members.id));

  const rows = await rowsQuery.limit(q.pageSize).offset(offset);

  const memberIds = rows.map((row) => row.id);
  const classLabelsByMember = new Map<string, string[]>();
  if (memberIds.length > 0) {
    const classRows = await db
      .select({
        memberId: memberClassAssignments.memberId,
        startsAt: classes.startsAt,
        endsAt: classes.endsAt,
        recurrenceRule: classes.recurrenceRule,
      })
      .from(memberClassAssignments)
      .innerJoin(classes, eq(classes.id, memberClassAssignments.classId))
      .where(
        and(
          inArray(memberClassAssignments.memberId, memberIds),
          isNull(memberClassAssignments.endedAt),
          isNull(classes.deletedAt),
        ),
      )
      .orderBy(asc(classes.startsAt));

    for (const classRow of classRows) {
      const current = classLabelsByMember.get(classRow.memberId) ?? [];
      current.push(formatClassSchedule(classRow));
      classLabelsByMember.set(classRow.memberId, current);
    }
  }

  return {
    rows: rows.map((row) => {
      const monthlyAbsences = Number(row.monthlyAbsences ?? 0);
      return {
        ...row,
        assignedClassName: classLabelsByMember.get(row.id)?.join(' · ') ?? null,
        age: calculateAge(row.dateOfBirth),
        monthlyAbsences,
        absenceTone: monthlyAbsenceTone(monthlyAbsences),
      };
    }),
    total: Number(total ?? 0),
  };
}

export async function getMemberById(organizationId: string, id: string) {
  if (!memberIdSchema.safeParse(id).success) return null;

  const [row] = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      firstNameKatakana: members.firstNameKatakana,
      lastName: members.lastName,
      code: members.code,
      curp: members.curp,
      dojoId: members.dojoId,
      dojoName: dojos.name,
      email: members.email,
      phone: members.phone,
      emergencyPhone: members.emergencyPhone,
      status: members.status,
      joinedAt: members.joinedAt,
      dateOfBirth: members.dateOfBirth,
      bloodType: members.bloodType,
      specialCareNotes: members.specialCareNotes,
      notes: members.notes,
      avatarFileKey: files.key,
      currentRankName: rankDefinitions.name,
      currentRankColor: rankDefinitions.color,
      currentRankLevel: rankDefinitions.level,
      currentRankDefinitionId: rankDefinitions.id,
    })
    .from(members)
    .innerJoin(dojos, eq(dojos.id, members.dojoId))
    .leftJoin(files, eq(files.id, members.avatarFileId))
    .leftJoin(ranks, and(eq(ranks.memberId, members.id), eq(ranks.isCurrent, sql`true`)))
    .leftJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
    .where(
      and(
        eq(members.id, id),
        eq(members.organizationId, organizationId),
        isNull(members.deletedAt),
      ),
    );
  return row ?? null;
}

export async function getMemberDetailData(organizationId: string, id: string) {
  const member = await getMemberById(organizationId, id);
  if (!member) return null;

  const activeClasses = await db
    .select({
      id: classes.id,
      name: classes.name,
      dojoName: dojos.name,
      startsAt: classes.startsAt,
      endsAt: classes.endsAt,
      recurrenceRule: classes.recurrenceRule,
      status: classes.status,
    })
    .from(memberClassAssignments)
    .innerJoin(classes, eq(classes.id, memberClassAssignments.classId))
    .innerJoin(dojos, eq(dojos.id, classes.dojoId))
    .where(
      and(
        eq(memberClassAssignments.memberId, member.id),
        isNull(memberClassAssignments.endedAt),
        isNull(classes.deletedAt),
      ),
    )
    .orderBy(asc(classes.startsAt));

  const promotionRows = await db
    .select({
      id: promotions.id,
      targetRankName: rankDefinitions.name,
      targetRankColor: rankDefinitions.color,
      status: promotions.status,
      examDate: promotions.examDate,
      score: promotions.score,
      notes: promotions.notes,
    })
    .from(promotions)
    .innerJoin(rankDefinitions, eq(rankDefinitions.id, promotions.targetRankDefinitionId))
    .where(eq(promotions.memberId, member.id))
    .orderBy(desc(promotions.createdAt));

  const leagueRows = await db
    .select({
      id: blackBeltLeagueResults.id,
      eventName: blackBeltLeagueResults.eventName,
      eventDate: blackBeltLeagueResults.eventDate,
      category: blackBeltLeagueResults.category,
      result: blackBeltLeagueResults.result,
      score: blackBeltLeagueResults.score,
      notes: blackBeltLeagueResults.notes,
    })
    .from(blackBeltLeagueResults)
    .where(
      and(
        eq(blackBeltLeagueResults.memberId, member.id),
        eq(blackBeltLeagueResults.organizationId, organizationId),
      ),
    )
    .orderBy(desc(blackBeltLeagueResults.eventDate), desc(blackBeltLeagueResults.createdAt));

  const rankOptions = await db
    .select({
      id: rankDefinitions.id,
      name: rankDefinitions.name,
      color: rankDefinitions.color,
      level: rankDefinitions.level,
    })
    .from(rankDefinitions)
    .where(
      and(eq(rankDefinitions.organizationId, organizationId), isNull(rankDefinitions.deletedAt)),
    )
    .orderBy(asc(rankDefinitions.level));

  const allClasses = await db
    .select({
      id: classes.id,
      name: classes.name,
      dojoName: dojos.name,
      startsAt: classes.startsAt,
      endsAt: classes.endsAt,
      recurrenceRule: classes.recurrenceRule,
    })
    .from(classes)
    .innerJoin(dojos, eq(dojos.id, classes.dojoId))
    .where(
      and(
        eq(classes.organizationId, organizationId),
        eq(classes.dojoId, member.dojoId),
        isNull(classes.deletedAt),
      ),
    )
    .orderBy(asc(classes.startsAt), asc(classes.name));

  const assignedClassIds = new Set(activeClasses.map((classRow) => classRow.id));

  return {
    member: {
      ...member,
      age: calculateAge(member.dateOfBirth),
    },
    activeClasses: activeClasses.map(
      (classRow): MemberDetailClass => ({
        id: classRow.id,
        name: classRow.name,
        dojoName: classRow.dojoName,
        scheduleLabel: formatClassSchedule(classRow),
        status: classRow.status,
      }),
    ),
    promotions: promotionRows,
    blackBeltLeagueResults: leagueRows,
    rankOptions,
    assignableClasses: allClasses
      .filter((classRow) => !assignedClassIds.has(classRow.id))
      .map(
        (classRow): MemberAssignableClass => ({
          id: classRow.id,
          name: classRow.name,
          dojoName: classRow.dojoName,
          scheduleLabel: formatClassSchedule(classRow),
        }),
      ),
  };
}

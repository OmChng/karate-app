import { and, asc, count, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { classes, dojos, rooms } from '@/db/schema';
import { formatClassSchedule } from '@/lib/class-schedule';
import type { RoleAccessScope } from '@/lib/rbac';

export interface RoomRow {
  id: string;
  name: string;
  dojoId: string;
  dojoName: string;
  capacity: number | null;
  active: boolean;
  classCount: number;
}

export interface RoomClassRow {
  id: string;
  name: string;
  scheduleLabel: string;
  capacity: number | null;
  status: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function roomAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(rooms.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(rooms.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

export async function listRoomsForManagement(accessScope: RoleAccessScope): Promise<RoomRow[]> {
  const classCounts = db
    .select({
      roomId: classes.roomId,
      classCount: count().as('class_count'),
    })
    .from(classes)
    .where(and(isNull(classes.deletedAt), sql`${classes.roomId} is not null`))
    .groupBy(classes.roomId)
    .as('class_counts');

  const filters: SQL[] = [isNull(rooms.deletedAt)];
  const accessFilter = roomAccessPredicate(accessScope);
  if (accessFilter) filters.push(accessFilter);

  const rows = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      dojoId: rooms.dojoId,
      dojoName: dojos.name,
      capacity: rooms.capacity,
      active: rooms.active,
      classCount: sql<number>`coalesce(${classCounts.classCount}, 0)`,
    })
    .from(rooms)
    .innerJoin(dojos, eq(dojos.id, rooms.dojoId))
    .leftJoin(classCounts, eq(classCounts.roomId, rooms.id))
    .where(and(...filters))
    .orderBy(asc(dojos.name), asc(rooms.name));

  return rows.map((row) => ({ ...row, classCount: Number(row.classCount ?? 0) }));
}

export async function getRoomDetailForManagement(accessScope: RoleAccessScope, id: string) {
  if (!uuidPattern.test(id)) return null;

  const filters: SQL[] = [eq(rooms.id, id), isNull(rooms.deletedAt)];
  const accessFilter = roomAccessPredicate(accessScope);
  if (accessFilter) filters.push(accessFilter);

  const [room] = await db
    .select({
      id: rooms.id,
      organizationId: rooms.organizationId,
      name: rooms.name,
      dojoId: rooms.dojoId,
      dojoName: dojos.name,
      capacity: rooms.capacity,
      active: rooms.active,
      notes: rooms.notes,
    })
    .from(rooms)
    .innerJoin(dojos, eq(dojos.id, rooms.dojoId))
    .where(and(...filters))
    .limit(1);

  if (!room) return null;

  const classRows = await db
    .select({
      id: classes.id,
      name: classes.name,
      startsAt: classes.startsAt,
      endsAt: classes.endsAt,
      recurrenceRule: classes.recurrenceRule,
      capacity: classes.capacity,
      status: classes.status,
    })
    .from(classes)
    .where(and(eq(classes.roomId, room.id), isNull(classes.deletedAt)))
    .orderBy(asc(classes.startsAt), asc(classes.name));

  return {
    room,
    classes: classRows.map(
      (classRow): RoomClassRow => ({
        id: classRow.id,
        name: classRow.name,
        scheduleLabel: formatClassSchedule(classRow),
        capacity: classRow.capacity,
        status: classRow.status,
      }),
    ),
  };
}

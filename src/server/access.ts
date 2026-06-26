import { and, asc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/db/client';
import { dojos, rooms } from '@/db/schema';
import type { RoleAccessScope } from '@/lib/rbac';

export interface AccessibleDojo {
  id: string;
  organizationId: string;
  name: string;
}

export interface AccessibleRoom {
  id: string;
  organizationId: string;
  dojoId: string;
  dojoName: string;
  name: string;
  capacity: number | null;
}

function accessPredicateForColumns(
  scope: RoleAccessScope,
  columns: { organizationId: AnyPgColumn; dojoId: AnyPgColumn },
): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(columns.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(columns.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

function dojoAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  return accessPredicateForColumns(scope, {
    organizationId: dojos.organizationId,
    dojoId: dojos.id,
  });
}

function roomAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  return accessPredicateForColumns(scope, {
    organizationId: rooms.organizationId,
    dojoId: rooms.dojoId,
  });
}

export async function listDojosForAccess(scope: RoleAccessScope): Promise<AccessibleDojo[]> {
  const filters: SQL[] = [isNull(dojos.deletedAt)];
  const access = dojoAccessPredicate(scope);
  if (access) filters.push(access);

  return db
    .select({ id: dojos.id, organizationId: dojos.organizationId, name: dojos.name })
    .from(dojos)
    .where(and(...filters))
    .orderBy(asc(dojos.name));
}

export async function getActiveDojoForAccess(
  scope: RoleAccessScope,
  dojoId: string,
): Promise<AccessibleDojo | null> {
  const filters: SQL[] = [eq(dojos.id, dojoId), isNull(dojos.deletedAt)];
  const access = dojoAccessPredicate(scope);
  if (access) filters.push(access);

  const [dojo] = await db
    .select({ id: dojos.id, organizationId: dojos.organizationId, name: dojos.name })
    .from(dojos)
    .where(and(...filters))
    .limit(1);
  return dojo ?? null;
}

export async function listRoomsForAccess(scope: RoleAccessScope): Promise<AccessibleRoom[]> {
  const filters: SQL[] = [isNull(rooms.deletedAt), eq(rooms.active, true)];
  const access = roomAccessPredicate(scope);
  if (access) filters.push(access);

  return db
    .select({
      id: rooms.id,
      organizationId: rooms.organizationId,
      dojoId: rooms.dojoId,
      dojoName: dojos.name,
      name: rooms.name,
      capacity: rooms.capacity,
    })
    .from(rooms)
    .innerJoin(dojos, eq(dojos.id, rooms.dojoId))
    .where(and(...filters))
    .orderBy(asc(dojos.name), asc(rooms.name));
}

export async function getActiveRoomForAccess(
  scope: RoleAccessScope,
  roomId: string,
): Promise<AccessibleRoom | null> {
  const filters: SQL[] = [eq(rooms.id, roomId), isNull(rooms.deletedAt), eq(rooms.active, true)];
  const access = roomAccessPredicate(scope);
  if (access) filters.push(access);

  const [room] = await db
    .select({
      id: rooms.id,
      organizationId: rooms.organizationId,
      dojoId: rooms.dojoId,
      dojoName: dojos.name,
      name: rooms.name,
      capacity: rooms.capacity,
    })
    .from(rooms)
    .innerJoin(dojos, eq(dojos.id, rooms.dojoId))
    .where(and(...filters))
    .limit(1);
  return room ?? null;
}

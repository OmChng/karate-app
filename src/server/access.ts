import { and, asc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import type { RoleAccessScope } from '@/lib/rbac';

export interface AccessibleDojo {
  id: string;
  organizationId: string;
  name: string;
}

function dojoAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(dojos.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(dojos.id, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
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

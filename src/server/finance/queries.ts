import { and, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { payments } from '@/db/schema';
import type { RoleAccessScope } from '@/lib/rbac';

function paymentAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(payments.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(payments.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

export async function getMonthlyRevenueForAccess(accessScope: RoleAccessScope, today = new Date()) {
  const monthStart = new Date(today);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const filters: SQL[] = [
    sql`${payments.paidAt} >= ${monthStart.toISOString()}::timestamptz`,
    isNull(payments.deletedAt),
  ];
  const accessFilter = paymentAccessPredicate(accessScope);
  if (accessFilter) filters.push(accessFilter);

  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${payments.amount})::text, '0')` })
    .from(payments)
    .where(and(...filters));

  return Number(row?.total ?? 0);
}

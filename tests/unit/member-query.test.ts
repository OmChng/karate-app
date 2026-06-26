import { describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { RoleAccessScope } from '../../src/lib/rbac';
import type { MemberListQuery } from '../../src/server/members/schemas';

process.env.DATABASE_URL ??= 'postgres://postgres:postgres@localhost:5432/sensei_test';
process.env.AUTH_SECRET ??= 'test-secret-for-member-query-unit-test';

const DOJO = '00000000-0000-0000-0000-000000000002';

const baseQuery: MemberListQuery = {
  page: 1,
  pageSize: 20,
  q: undefined,
  status: undefined,
  dojoId: undefined,
  rankLevel: undefined,
  sortBy: 'name',
  sortDir: 'asc',
};

describe('buildMemberListWhere', () => {
  it('combines access scope before the explicit rank filter', async () => {
    const { buildMemberListWhere } = await import('../../src/server/members/queries');
    const accessScope: RoleAccessScope = {
      global: false,
      organizationIds: [],
      dojoIds: [DOJO],
    };
    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(
      buildMemberListWhere(accessScope, { ...baseQuery, rankLevel: 3 }),
    );

    expect(query.sql).toContain('"member"."deleted_at" is null');
    expect(query.sql).toContain('"member"."dojo_id" in ($1)');
    expect(query.sql).toContain('"rank_definition"."level" = $2');
    expect(query.params).toEqual([DOJO, 3]);
  });
});

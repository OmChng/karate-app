import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { members } from './members';
import { users } from './users';

export const rankDefinitions = pgTable(
  'rank_definition',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    level: integer('level').notNull(),
    minAge: integer('min_age'),
    minMonthsAtPrevious: integer('min_months_at_previous'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('rank_def_org_level_uq').on(t.organizationId, t.level),
    index('rank_def_org_idx').on(t.organizationId),
  ],
);

export const ranks = pgTable(
  'rank',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    rankDefinitionId: uuid('rank_definition_id')
      .notNull()
      .references(() => rankDefinitions.id, { onDelete: 'restrict' }),
    awardedAt: date('awarded_at').notNull(),
    awardedBy: uuid('awarded_by').references(() => users.id, { onDelete: 'set null' }),
    isCurrent: boolean('is_current').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rank_member_idx').on(t.memberId),
    uniqueIndex('rank_member_current_uq')
      .on(t.memberId)
      .where(sql`${t.isCurrent} = true`),
  ],
);

export type RankDefinition = typeof rankDefinitions.$inferSelect;
export type Rank = typeof ranks.$inferSelect;

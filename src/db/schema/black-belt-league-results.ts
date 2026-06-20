import { date, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { members } from './members';

export const blackBeltLeagueResults = pgTable(
  'black_belt_league_result',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    eventName: text('event_name').notNull(),
    eventDate: date('event_date'),
    category: text('category'),
    result: text('result'),
    score: numeric('score', { precision: 6, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('black_belt_league_result_org_idx').on(t.organizationId),
    index('black_belt_league_result_member_idx').on(t.memberId),
  ],
);

export type BlackBeltLeagueResult = typeof blackBeltLeagueResults.$inferSelect;
export type NewBlackBeltLeagueResult = typeof blackBeltLeagueResults.$inferInsert;

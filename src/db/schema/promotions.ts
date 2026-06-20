import { date, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { members } from './members';
import { rankDefinitions } from './ranks';
import { users } from './users';
import { promotionStatusEnum } from './enums';

export const promotions = pgTable(
  'promotion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    targetRankDefinitionId: uuid('target_rank_definition_id')
      .notNull()
      .references(() => rankDefinitions.id, { onDelete: 'restrict' }),
    status: promotionStatusEnum('status').notNull().default('recommended'),
    recommendedBy: uuid('recommended_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    examDate: date('exam_date'),
    score: numeric('score', { precision: 5, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('promotion_member_idx').on(t.memberId), index('promotion_status_idx').on(t.status)],
);

export type Promotion = typeof promotions.$inferSelect;

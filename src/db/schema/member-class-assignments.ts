import { sql } from 'drizzle-orm';
import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { members } from './members';

export const memberClassAssignments = pgTable(
  'member_class_assignment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('member_class_assignment_member_idx').on(t.memberId),
    index('member_class_assignment_class_idx').on(t.classId),
    uniqueIndex('member_class_assignment_active_member_class_uq')
      .on(t.memberId, t.classId)
      .where(sql`${t.endedAt} IS NULL`),
  ],
);

export type MemberClassAssignment = typeof memberClassAssignments.$inferSelect;
export type NewMemberClassAssignment = typeof memberClassAssignments.$inferInsert;

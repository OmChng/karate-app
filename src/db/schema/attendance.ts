import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { members } from './members';
import { users } from './users';
import { attendanceStatusEnum } from './enums';

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    markedBy: uuid('marked_by').references(() => users.id, { onDelete: 'set null' }),
    markedAt: timestamp('marked_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
  },
  (t) => [
    uniqueIndex('attendance_class_member_uq').on(t.classId, t.memberId),
    index('attendance_member_marked_idx').on(t.memberId, t.markedAt),
    index('attendance_class_status_idx').on(t.classId, t.status),
  ],
);

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

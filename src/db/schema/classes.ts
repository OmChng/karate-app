import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';
import { rooms } from './rooms';
import { users } from './users';
import { classInstructorRoleEnum, classStatusEnum } from './enums';

export const classes = pgTable(
  'class',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    dojoId: uuid('dojo_id')
      .notNull()
      .references(() => dojos.id, { onDelete: 'restrict' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    recurrenceRule: text('recurrence_rule'),
    capacity: integer('capacity'),
    rankMinLevel: integer('rank_min_level'),
    status: classStatusEnum('status').notNull().default('scheduled'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('class_org_dojo_starts_idx').on(t.organizationId, t.dojoId, t.startsAt),
    index('class_starts_idx').on(t.startsAt),
    index('class_room_idx').on(t.roomId),
  ],
);

export const classInstructors = pgTable(
  'class_instructor',
  {
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: classInstructorRoleEnum('role').notNull().default('instructor'),
  },
  (t) => [primaryKey({ columns: [t.classId, t.userId] })],
);

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { dojos } from './dojos';

export const rooms = pgTable(
  'room',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    dojoId: uuid('dojo_id')
      .notNull()
      .references(() => dojos.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    capacity: integer('capacity'),
    notes: text('notes'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('room_org_dojo_active_idx').on(t.organizationId, t.dojoId, t.active),
    index('room_dojo_idx').on(t.dojoId),
    uniqueIndex('room_dojo_name_active_uq')
      .on(t.dojoId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

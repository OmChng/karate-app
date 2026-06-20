import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';

export const events = pgTable(
  'event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    dojoId: uuid('dojo_id').references(() => dojos.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    location: text('location'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('event_org_starts_idx').on(t.organizationId, t.startsAt)],
);

export type Event = typeof events.$inferSelect;

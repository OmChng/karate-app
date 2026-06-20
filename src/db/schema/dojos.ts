import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const dojos = pgTable(
  'dojo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    parentDojoId: uuid('parent_dojo_id').references((): AnyPgColumn => dojos.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    code: text('code'),
    address: jsonb('address').default(sql`'{}'::jsonb`),
    timezone: text('timezone'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('dojo_org_active_idx').on(t.organizationId, t.active),
    index('dojo_org_idx').on(t.organizationId),
  ],
);

export type Dojo = typeof dojos.$inferSelect;
export type NewDojo = typeof dojos.$inferInsert;

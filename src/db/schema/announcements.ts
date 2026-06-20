import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';
import { users } from './users';

export const announcements = pgTable(
  'announcement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    dojoId: uuid('dojo_id').references(() => dojos.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    audienceRole: text('audience_role'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('announcement_org_published_idx').on(t.organizationId, t.publishedAt)],
);

export type Announcement = typeof announcements.$inferSelect;

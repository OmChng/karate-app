import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const files = pgTable(
  'file',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    key: text('key').notNull(),
    contentType: text('content_type'),
    sizeBytes: integer('size_bytes'),
    originalName: text('original_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('file_org_idx').on(t.organizationId)],
);

export type File = typeof files.$inferSelect;

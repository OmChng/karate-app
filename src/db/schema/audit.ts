import { sql } from 'drizzle-orm';
import { index, inet, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    before: jsonb('before').default(sql`'{}'::jsonb`),
    after: jsonb('after').default(sql`'{}'::jsonb`),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_org_created_idx').on(t.organizationId, t.createdAt),
    index('audit_entity_idx').on(t.entity, t.entityId),
  ],
);

export type AuditLog = typeof auditLog.$inferSelect;

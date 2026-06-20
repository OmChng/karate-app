import { boolean, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { members } from './members';

export const guardians = pgTable(
  'guardian',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    relationship: text('relationship'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('guardian_org_idx').on(t.organizationId)],
);

export const memberGuardians = pgTable(
  'member_guardian',
  {
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => guardians.id, { onDelete: 'cascade' }),
    relationship: text('relationship'),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.guardianId] })],
);

export type Guardian = typeof guardians.$inferSelect;
export type MemberGuardian = typeof memberGuardians.$inferSelect;

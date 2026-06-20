import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';
import { userRoleEnum } from './enums';

export const users = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email'),
    phone: text('phone'),
    passwordHash: text('password_hash'),
    name: text('name').notNull(),
    locale: text('locale').notNull().default('es-MX'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('user_email_uq').on(t.email), uniqueIndex('user_phone_uq').on(t.phone)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const userRoles = pgTable(
  'user_role_assignment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    dojoId: uuid('dojo_id').references(() => dojos.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('user_role_user_org_idx').on(t.userId, t.organizationId),
    uniqueIndex('user_role_unique').on(t.userId, t.organizationId, t.dojoId, t.role),
  ],
);

export type UserRoleAssignment = typeof userRoles.$inferSelect;
export type NewUserRoleAssignment = typeof userRoles.$inferInsert;

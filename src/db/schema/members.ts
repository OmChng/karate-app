import { sql } from 'drizzle-orm';
import { date, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';
import { users } from './users';
import { files } from './files';
import { memberStatusEnum } from './enums';

export const members = pgTable(
  'member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    dojoId: uuid('dojo_id')
      .notNull()
      .references(() => dojos.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    avatarFileId: uuid('avatar_file_id').references(() => files.id, { onDelete: 'set null' }),
    code: text('code'),
    firstName: text('first_name').notNull(),
    firstNameKatakana: text('first_name_katakana'),
    lastName: text('last_name').notNull(),
    curp: text('curp'),
    dateOfBirth: date('date_of_birth'),
    bloodType: text('blood_type'),
    specialCareNotes: text('special_care_notes'),
    emergencyPhone: text('emergency_phone'),
    gender: text('gender'),
    email: text('email'),
    phone: text('phone'),
    address: jsonb('address').default(sql`'{}'::jsonb`),
    status: memberStatusEnum('status').notNull().default('active'),
    joinedAt: date('joined_at')
      .notNull()
      .default(sql`current_date`),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('member_org_dojo_status_idx').on(t.organizationId, t.dojoId, t.status),
    index('member_org_name_idx').on(t.organizationId, t.lastName, t.firstName),
    index('member_org_active_idx')
      .on(t.organizationId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

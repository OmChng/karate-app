import { sql } from 'drizzle-orm';
import { check, date, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dojos } from './dojos';
import { members } from './members';
import { users } from './users';
import { paymentMethodEnum } from './enums';

export const payments = pgTable(
  'payment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    dojoId: uuid('dojo_id').references(() => dojos.id, { onDelete: 'set null' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('MXN'),
    method: paymentMethodEnum('method').notNull(),
    periodStart: date('period_start'),
    periodEnd: date('period_end'),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
    reference: text('reference'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('payment_org_paid_idx').on(t.organizationId, t.paidAt),
    index('payment_member_paid_idx').on(t.memberId, t.paidAt),
    check('payment_amount_nonneg', sql`${t.amount} >= 0`),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

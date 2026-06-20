import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'organization_admin',
  'dojo_admin',
  'instructor',
  'assistant_instructor',
  'finance_staff',
  'member',
  'parent',
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const memberStatusEnum = pgEnum('member_status', [
  'active',
  'temporary_leave',
  'permanent_leave',
  'recovery',
  'sick',
]);
export type MemberStatus = (typeof memberStatusEnum.enumValues)[number];

export const promotionStatusEnum = pgEnum('promotion_status', [
  'recommended',
  'approved',
  'rejected',
  'cancelled',
]);
export type PromotionStatus = (typeof promotionStatusEnum.enumValues)[number];

export const classStatusEnum = pgEnum('class_status', ['scheduled', 'completed', 'cancelled']);
export type ClassStatus = (typeof classStatusEnum.enumValues)[number];

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'late',
  'absent',
  'excused',
]);
export type AttendanceStatus = (typeof attendanceStatusEnum.enumValues)[number];

export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'transfer', 'card', 'other']);
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export const classInstructorRoleEnum = pgEnum('class_instructor_role', [
  'instructor',
  'assistant_instructor',
]);

import { z } from 'zod';
import { memberStatusEnum, type MemberStatus } from '@/db/schema/enums';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const decimalScoreRegex = /^\d{1,3}(?:\.\d{1,2})?$/;

export const memberPageSizeOptions = [20, 40, 60, 80, 100] as const;
export const memberSortKeys = ['name', 'rank', 'age', 'absences'] as const;
export const memberSortDirections = ['asc', 'desc'] as const;
export type MemberPageSize = (typeof memberPageSizeOptions)[number];
export type MemberSortKey = (typeof memberSortKeys)[number];
export type MemberSortDirection = (typeof memberSortDirections)[number];
export type AbsenceLevel = 'none' | 'warning' | 'warningStrong' | 'danger';
export type AbsenceTone = AbsenceLevel;

function isMemberPageSize(value: unknown): value is MemberPageSize {
  return memberPageSizeOptions.includes(value as never);
}

export function getAbsenceLevel(absences: number): AbsenceLevel {
  if (absences <= 0) return 'none';
  if (absences === 1) return 'warning';
  if (absences <= 4) return 'warningStrong';
  return 'danger';
}

export function monthlyAbsenceTone(absences: number): AbsenceTone {
  return getAbsenceLevel(absences);
}

export const memberInputSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(120, 'tooLong120'),
  firstNameKatakana: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(80, 'tooLong80').optional(),
  ),
  lastName: z.string().trim().min(1, 'required').max(120, 'tooLong120'),
  code: z.preprocess(emptyToUndefined, z.string().trim().max(40, 'tooLong40').optional()),
  curp: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .length(18, 'invalidCurp')
      .regex(curpRegex, 'invalidCurp')
      .optional(),
  ),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().toLowerCase().email('invalidEmail').optional(),
  ),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40, 'tooLong40').optional()),
  emergencyPhone: z.preprocess(emptyToUndefined, z.string().trim().max(40, 'tooLong40').optional()),
  dateOfBirth: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate')
      .optional(),
  ),
  bloodType: z.preprocess(emptyToUndefined, z.string().trim().max(10, 'tooLong10').optional()),
  specialCareNotes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, 'tooLong1000').optional(),
  ),
  dojoId: z.string().uuid('invalidDojo'),
  status: z
    .enum(memberStatusEnum.enumValues, {
      errorMap: () => ({ message: 'invalidStatus' }),
    })
    .default('active'),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000, 'tooLong2000').optional()),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

export const memberIdSchema = z.string().uuid();

export const promoteMemberSchema = z.object({
  targetRankDefinitionId: z.string().uuid('invalidRank'),
  examDate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate')
      .optional(),
  ),
  score: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(decimalScoreRegex, 'invalidScore').optional(),
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'tooLong1000').optional()),
});

export type PromoteMemberInput = z.infer<typeof promoteMemberSchema>;

export const memberStatusUpdateSchema = z.object({
  status: z.enum(['temporary_leave', 'permanent_leave', 'recovery', 'sick'], {
    errorMap: () => ({ message: 'invalidStatus' }),
  }),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'tooLong1000').optional()),
});

export type MemberStatusUpdateInput = z.infer<typeof memberStatusUpdateSchema>;

export const memberTransferSchema = z.object({
  targetDojoId: z.string().uuid('invalidDojo'),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'tooLong1000').optional()),
});

export type MemberTransferInput = z.infer<typeof memberTransferSchema>;

const memberPageSizeSchema = z.preprocess(
  (value) => {
    if (value === undefined) return 20;
    return Number(value);
  },
  z.custom<MemberPageSize>(isMemberPageSize, 'invalidPageSize'),
);

export const memberListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: memberPageSizeSchema.default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(memberStatusEnum.enumValues).optional(),
  dojoId: z.string().uuid().optional(),
  rankLevel: z.coerce.number().int().min(1).max(12).optional(),
  sortBy: z.enum(memberSortKeys).default('name'),
  sortDir: z.enum(memberSortDirections).default('asc'),
});

export type MemberListQuery = z.infer<typeof memberListQuerySchema>;
export type { MemberStatus };

import { z } from 'zod';
import { type ClassDayToken } from '@/lib/class-schedule';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const classDayTokens = [
  'L',
  'M',
  'Mi',
  'J',
  'V',
  'S',
  'D',
] as const satisfies readonly ClassDayToken[];

export const classInputSchema = z
  .object({
    name: z.string().trim().min(1, 'required').max(120, 'tooLong120'),
    dojoId: z.string().uuid('invalidDojo'),
    roomId: z.preprocess(emptyToUndefined, z.string().uuid('invalidRoom').optional()),
    days: z.array(z.enum(classDayTokens)).min(1, 'required'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'invalidTime'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'invalidTime'),
    capacity: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1, 'invalidCapacity').max(999, 'invalidCapacity').optional(),
    ),
    notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'tooLong1000').optional()),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: 'invalidTimeRange',
    path: ['endTime'],
  });

export type ClassInput = z.infer<typeof classInputSchema>;

export const classIdSchema = z.string().uuid();
export const classAssignmentInputSchema = z.object({
  memberId: z.string().uuid('invalidMember'),
  classId: z.string().uuid('invalidClass'),
});

export type ClassAssignmentInput = z.infer<typeof classAssignmentInputSchema>;

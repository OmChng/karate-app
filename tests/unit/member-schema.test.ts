import { describe, it, expect } from 'vitest';
import {
  getAbsenceLevel,
  memberInputSchema,
  memberListQuerySchema,
  monthlyAbsenceTone,
} from '../../src/server/members/schemas';
import { getAbsenceVariant, getStudentStatusVariant } from '../../src/lib/member-visual-state';
import { firstGivenName, katakanaForFirstName } from '../../src/lib/katakana';

const ok = {
  firstName: 'Luis',
  lastName: 'Hernández',
  dojoId: '00000000-0000-0000-0000-000000000002',
  status: 'active' as const,
};

describe('memberInputSchema', () => {
  it('accepts a minimal valid payload', () => {
    const r = memberInputSchema.safeParse(ok);
    expect(r.success).toBe(true);
  });

  it('accepts every supported member status', () => {
    for (const status of ['active', 'temporary_leave', 'permanent_leave', 'recovery', 'sick']) {
      const r = memberInputSchema.safeParse({ ...ok, status });
      expect(r.success, `Expected ${status} to be valid`).toBe(true);
    }
  });

  it('rejects empty first name', () => {
    const r = memberInputSchema.safeParse({ ...ok, firstName: '' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid dojoId', () => {
    const r = memberInputSchema.safeParse({ ...ok, dojoId: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects malformed date', () => {
    const r = memberInputSchema.safeParse({ ...ok, dateOfBirth: '17/06/2026' });
    expect(r.success).toBe(false);
  });

  it('accepts optional Mexican student profile fields', () => {
    const r = memberInputSchema.safeParse({
      ...ok,
      firstNameKatakana: 'ルイス',
      curp: 'HEHL140312HJCRRS09',
      bloodType: 'O+',
      emergencyPhone: '3311168541',
      specialCareNotes: 'Alergia registrada',
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid CURP values', () => {
    const r = memberInputSchema.safeParse({ ...ok, curp: 'CURP-INVALIDA' });
    expect(r.success).toBe(false);
  });

  it('turns empty strings into undefined for optional fields', () => {
    const r = memberInputSchema.safeParse({
      ...ok,
      code: '',
      firstNameKatakana: '',
      curp: '',
      email: '',
      phone: '',
      emergencyPhone: '',
      bloodType: '',
      specialCareNotes: '',
      notes: '',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.code).toBeUndefined();
      expect(r.data.firstNameKatakana).toBeUndefined();
      expect(r.data.curp).toBeUndefined();
      expect(r.data.email).toBeUndefined();
      expect(r.data.phone).toBeUndefined();
      expect(r.data.emergencyPhone).toBeUndefined();
      expect(r.data.bloodType).toBeUndefined();
      expect(r.data.specialCareNotes).toBeUndefined();
      expect(r.data.notes).toBeUndefined();
    }
  });
});

describe('memberListQuerySchema', () => {
  it('defaults to 20 members per page', () => {
    const r = memberListQuerySchema.parse({});
    expect(r.pageSize).toBe(20);
    expect(r.page).toBe(1);
    expect(r.sortBy).toBe('name');
    expect(r.sortDir).toBe('asc');
  });

  it('accepts configured page sizes', () => {
    for (const pageSize of ['20', '40', '60', '80', '100']) {
      const r = memberListQuerySchema.safeParse({ pageSize });
      expect(r.success, `Expected ${pageSize} to be valid`).toBe(true);
    }
  });

  it('rejects all page size', () => {
    const r = memberListQuerySchema.safeParse({ page: '3', pageSize: 'all' });
    expect(r.success).toBe(false);
  });

  it('rejects unsupported page sizes', () => {
    const r = memberListQuerySchema.safeParse({ pageSize: '30' });
    expect(r.success).toBe(false);
  });

  it('accepts supported sort options', () => {
    const r = memberListQuerySchema.safeParse({ sortBy: 'absences', sortDir: 'desc' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sortBy).toBe('absences');
      expect(r.data.sortDir).toBe('desc');
    }
  });

  it('parses explicit rank filters', () => {
    const r = memberListQuerySchema.safeParse({ rankLevel: '3' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rankLevel).toBe(3);
    }
  });

  it('rejects rank filters outside the catalog', () => {
    expect(memberListQuerySchema.safeParse({ rankLevel: '0' }).success).toBe(false);
    expect(memberListQuerySchema.safeParse({ rankLevel: '13' }).success).toBe(false);
  });

  it('rejects unsupported sort options', () => {
    const r = memberListQuerySchema.safeParse({ sortBy: 'dojo', sortDir: 'sideways' });
    expect(r.success).toBe(false);
  });
});

describe('absence visual state', () => {
  it('maps absence counts to the requested semantic levels', () => {
    expect(getAbsenceLevel(0)).toBe('none');
    expect(getAbsenceLevel(1)).toBe('warning');
    expect(getAbsenceLevel(2)).toBe('warningStrong');
    expect(getAbsenceLevel(4)).toBe('warningStrong');
    expect(getAbsenceLevel(5)).toBe('danger');
    expect(monthlyAbsenceTone(0)).toBe('none');
  });

  it('maps absence levels to badge variants', () => {
    expect(getAbsenceVariant('none')).toBe('good');
    expect(getAbsenceVariant('warning')).toBe('risk');
    expect(getAbsenceVariant('warningStrong')).toBe('riskStrong');
    expect(getAbsenceVariant('danger')).toBe('critical');
  });
});

describe('student status visual state', () => {
  it('keeps real student statuses semantic and colored', () => {
    expect(getStudentStatusVariant('active')).toBe('good');
    expect(getStudentStatusVariant('temporary_leave')).toBe('risk');
    expect(getStudentStatusVariant('permanent_leave')).toBe('critical');
    expect(getStudentStatusVariant('recovery')).toBe('special');
    expect(getStudentStatusVariant('sick')).toBe('riskStrong');
  });
});

describe('katakana helpers', () => {
  it('uses the first given name for generated katakana', () => {
    expect(firstGivenName('María Fernanda')).toBe('María');
    expect(katakanaForFirstName('María Fernanda')).toBe('マリア');
  });

  it('generates known Spanish first names in katakana', () => {
    expect(katakanaForFirstName('Fernanda')).toBe('フェルナンダ');
    expect(katakanaForFirstName('Sofía')).toBe('ソフィア');
    expect(katakanaForFirstName('Luis')).toBe('ルイス');
    expect(katakanaForFirstName('Héctor')).toBe('エクトル');
  });

  it('falls back to a deterministic katakana approximation for unknown names', () => {
    expect(katakanaForFirstName('Braulio')).toBe('ブラウリオ');
    expect(katakanaForFirstName('')).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  isEmailLike,
  normalizeEmail,
  normalizePhone,
} from '../../src/lib/utils';

describe('isEmailLike', () => {
  it('matches obvious emails', () => {
    expect(isEmailLike('a@b.co')).toBe(true);
    expect(isEmailLike('user.name+tag@example.com')).toBe(true);
  });
  it('rejects non-emails', () => {
    expect(isEmailLike('5512345678')).toBe(false);
    expect(isEmailLike('@nope')).toBe(false);
    expect(isEmailLike('')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@BAR.com ')).toBe('foo@bar.com');
  });
});

describe('normalizePhone', () => {
  it('strips formatting but keeps leading +', () => {
    expect(normalizePhone('+52 (33) 1234-5678')).toBe('+523312345678');
    expect(normalizePhone('33 1234 5678')).toBe('3312345678');
  });
});

describe('formatCurrency', () => {
  it('renders MXN by default', () => {
    const out = formatCurrency(600, 'MXN', 'es-MX');
    expect(out).toMatch(/600/);
    expect(out).toMatch(/\$/);
  });
});

describe('formatDate', () => {
  it('renders a date in the requested locale', () => {
    const out = formatDate('2026-06-17', 'es-MX');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

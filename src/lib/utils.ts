import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Lightweight phone normalization for v1. Strips formatting, keeps
 * leading '+'. For prod we'll swap in libphonenumber-js for E.164.
 */
export function normalizePhone(input: string): string {
  const cleaned = input.trim().replace(/[\s()-]/g, '');
  if (cleaned.startsWith('+')) return '+' + cleaned.slice(1).replace(/[^0-9]/g, '');
  return cleaned.replace(/[^0-9]/g, '');
}

export function isEmailLike(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function formatDate(date: Date | string, locale: string = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

export function formatCurrency(
  amount: number | string,
  currency: string = 'MXN',
  locale: string = 'es-MX',
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

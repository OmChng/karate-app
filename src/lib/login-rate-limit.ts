import { createHmac } from 'node:crypto';
import { and, count, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/db/client';
import { loginAttempts } from '@/db/schema';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
export const MAX_IDENTIFIER_FAILURES = 5;
export const MAX_IP_FAILURES = 20;

type HeaderReader = {
  get(name: string): string | null;
};

export type LoginAttemptReason = 'invalid_credentials' | 'rate_limited';

export interface LoginRateLimitSubject {
  identifierHash: string;
  ipHash: string;
}

export interface LoginRateLimitCheck {
  limited: boolean;
  identifierFailures: number;
  ipFailures: number;
  retryAfterSeconds: number;
  subject: LoginRateLimitSubject;
}

export function getClientIp(headers?: HeaderReader): string {
  const forwardedFor = headers?.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    forwardedFor ||
    headers?.get('x-real-ip')?.trim() ||
    headers?.get('cf-connecting-ip')?.trim() ||
    'unknown'
  );
}

export function isLoginRateLimitExceeded(counts: {
  identifierFailures: number;
  ipFailures: number;
}): boolean {
  return (
    counts.identifierFailures >= MAX_IDENTIFIER_FAILURES || counts.ipFailures >= MAX_IP_FAILURES
  );
}

function hashLoginValue(value: string): string {
  return createHmac('sha256', env.AUTH_SECRET).update(value).digest('hex');
}

function subjectFor(identifier: string, headers?: HeaderReader): LoginRateLimitSubject {
  return {
    identifierHash: hashLoginValue(identifier),
    ipHash: hashLoginValue(getClientIp(headers)),
  };
}

async function countFailedAttempts(
  column: typeof loginAttempts.identifierHash | typeof loginAttempts.ipHash,
  value: string,
  cutoff: Date,
): Promise<number> {
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.success, false),
        eq(column, value),
        gte(loginAttempts.createdAt, cutoff),
      ),
    );

  return Number(total ?? 0);
}

async function pruneOldLoginAttempts() {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, cutoff));
}

export async function checkLoginRateLimit(
  identifier: string,
  headers?: HeaderReader,
): Promise<LoginRateLimitCheck> {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const subject = subjectFor(identifier, headers);
  const [identifierFailures, ipFailures] = await Promise.all([
    countFailedAttempts(loginAttempts.identifierHash, subject.identifierHash, cutoff),
    countFailedAttempts(loginAttempts.ipHash, subject.ipHash, cutoff),
  ]);

  return {
    subject,
    identifierFailures,
    ipFailures,
    retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    limited: isLoginRateLimitExceeded({ identifierFailures, ipFailures }),
  };
}

export async function recordLoginFailure(
  subject: LoginRateLimitSubject,
  reason: LoginAttemptReason,
) {
  await db.insert(loginAttempts).values({
    identifierHash: subject.identifierHash,
    ipHash: subject.ipHash,
    success: false,
    reason,
  });
  await pruneOldLoginAttempts().catch((err) => {
    logger.warn({ err }, 'login: could not prune old attempts');
  });
}

export async function recordLoginSuccess(subject: LoginRateLimitSubject) {
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.success, false),
        eq(loginAttempts.identifierHash, subject.identifierHash),
      ),
    );
  await db.insert(loginAttempts).values({
    identifierHash: subject.identifierHash,
    ipHash: subject.ipHash,
    success: true,
  });
  await pruneOldLoginAttempts().catch((err) => {
    logger.warn({ err }, 'login: could not prune old attempts');
  });
}

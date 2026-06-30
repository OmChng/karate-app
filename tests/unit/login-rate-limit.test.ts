import { describe, expect, it, vi } from 'vitest';

async function loadModule() {
  vi.stubEnv('DATABASE_URL', 'postgresql://sensei:sensei@localhost:5432/sensei');
  vi.stubEnv('AUTH_SECRET', 'test-secret-for-login-rate-limit');
  return import('../../src/lib/login-rate-limit');
}

describe('login rate limiting helpers', () => {
  it('uses the first forwarded IP address', async () => {
    const { getClientIp } = await loadModule();
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.10, 10.0.0.2',
      'x-real-ip': '198.51.100.2',
    });

    expect(getClientIp(headers)).toBe('203.0.113.10');
  });

  it('falls back to alternate proxy headers', async () => {
    const { getClientIp } = await loadModule();
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.20' });

    expect(getClientIp(headers)).toBe('203.0.113.20');
  });

  it('limits by identifier or IP failure thresholds', async () => {
    const { isLoginRateLimitExceeded, MAX_IDENTIFIER_FAILURES, MAX_IP_FAILURES } =
      await loadModule();

    expect(
      isLoginRateLimitExceeded({
        identifierFailures: MAX_IDENTIFIER_FAILURES - 1,
        ipFailures: MAX_IP_FAILURES - 1,
      }),
    ).toBe(false);
    expect(
      isLoginRateLimitExceeded({
        identifierFailures: MAX_IDENTIFIER_FAILURES,
        ipFailures: 0,
      }),
    ).toBe(true);
    expect(
      isLoginRateLimitExceeded({
        identifierFailures: 0,
        ipFailures: MAX_IP_FAILURES,
      }),
    ).toBe(true);
  });
});

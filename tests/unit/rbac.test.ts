import { describe, it, expect } from 'vitest';
import type { Session } from 'next-auth';
import {
  ForbiddenError,
  UnauthenticatedError,
  currentOrganizationId,
  hasRole,
  requireRole,
} from '../../src/lib/rbac';

const ORG = '00000000-0000-0000-0000-000000000001';
const DOJO = '00000000-0000-0000-0000-000000000002';

function sessionWith(roles: Session['user']['roles']): Session {
  return {
    user: {
      id: 'u1',
      email: 'u@example.com',
      phone: null,
      name: 'Test',
      locale: 'es-MX',
      roles,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } as unknown as Session;
}

describe('hasRole', () => {
  it('returns false for unauthenticated', () => {
    expect(hasRole(null, ['organization_admin'])).toBe(false);
  });

  it('matches a direct role', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    expect(hasRole(s, ['organization_admin'], { organizationId: ORG })).toBe(true);
  });

  it('honors inheritance — organization_admin satisfies instructor', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    expect(hasRole(s, ['instructor'], { organizationId: ORG })).toBe(true);
  });

  it('blocks cross-org access', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    expect(hasRole(s, ['organization_admin'], { organizationId: 'other' })).toBe(false);
  });

  it('respects dojo scope when present', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'instructor' }]);
    expect(hasRole(s, ['instructor'], { organizationId: ORG, dojoId: DOJO })).toBe(true);
    expect(hasRole(s, ['instructor'], { organizationId: ORG, dojoId: 'other' })).toBe(false);
  });
});

describe('requireRole', () => {
  it('throws UnauthenticatedError without session', () => {
    expect(() => requireRole(null, ['organization_admin'])).toThrow(UnauthenticatedError);
  });

  it('throws ForbiddenError when role missing', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'member' }]);
    expect(() => requireRole(s, ['organization_admin'], { organizationId: ORG })).toThrow(
      ForbiddenError,
    );
  });

  it('passes when role present', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    expect(() => requireRole(s, ['organization_admin'], { organizationId: ORG })).not.toThrow();
  });
});

describe('currentOrganizationId', () => {
  it('returns null without roles', () => {
    expect(currentOrganizationId(null)).toBeNull();
  });
  it('returns the single org', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'member' }]);
    expect(currentOrganizationId(s)).toBe(ORG);
  });
});

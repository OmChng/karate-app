import { describe, it, expect } from 'vitest';
import type { Session } from 'next-auth';
import {
  ForbiddenError,
  UnauthenticatedError,
  canAccessFinance,
  currentOrganizationId,
  getRoleAccessScope,
  hasRole,
  isSuperAdmin,
  requireRole,
  scopeCanAccessDojo,
  scopeCanAccessOrganization,
} from '../../src/lib/rbac';

const ORG = '00000000-0000-0000-0000-000000000001';
const OTHER_ORG = '00000000-0000-0000-0000-000000000003';
const DOJO = '00000000-0000-0000-0000-000000000002';
const OTHER_DOJO = '00000000-0000-0000-0000-000000000004';

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

  it('lets super_admin bypass organization and dojo scopes', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'super_admin' }]);
    expect(isSuperAdmin(s)).toBe(true);
    expect(hasRole(s, ['organization_admin'], { organizationId: OTHER_ORG })).toBe(true);
    expect(hasRole(s, ['instructor'], { organizationId: OTHER_ORG, dojoId: OTHER_DOJO })).toBe(
      true,
    );
  });

  it('respects dojo scope when present', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'instructor' }]);
    expect(hasRole(s, ['instructor'], { organizationId: ORG, dojoId: DOJO })).toBe(true);
    expect(hasRole(s, ['instructor'], { organizationId: ORG, dojoId: 'other' })).toBe(false);
  });

  it('does not let dojo-scoped roles satisfy organization-wide checks', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'dojo_admin' }]);
    expect(hasRole(s, ['dojo_admin'], { organizationId: ORG })).toBe(false);
    expect(hasRole(s, ['dojo_admin'], { organizationId: ORG, dojoId: DOJO })).toBe(true);
    expect(hasRole(s, ['organization_admin'], { organizationId: ORG })).toBe(false);
  });

  it('lets organization_admin satisfy lower roles inside the organization', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    expect(hasRole(s, ['instructor'], { organizationId: ORG, dojoId: OTHER_DOJO })).toBe(true);
    expect(hasRole(s, ['dojo_admin'], { organizationId: ORG, dojoId: OTHER_DOJO })).toBe(true);
  });
});

describe('getRoleAccessScope', () => {
  it('returns global scope for super_admin', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'super_admin' }]);
    const scope = getRoleAccessScope(s, ['organization_admin']);
    expect(scope).toEqual({ global: true, organizationIds: [], dojoIds: [] });
    expect(scopeCanAccessOrganization(scope, OTHER_ORG)).toBe(true);
    expect(scopeCanAccessDojo(scope, { id: OTHER_DOJO, organizationId: OTHER_ORG })).toBe(true);
  });

  it('returns organization-wide scope for organization_admin', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]);
    const scope = getRoleAccessScope(s, ['dojo_admin']);
    expect(scope).toEqual({ global: false, organizationIds: [ORG], dojoIds: [] });
    expect(scopeCanAccessOrganization(scope, ORG)).toBe(true);
    expect(scopeCanAccessDojo(scope, { id: OTHER_DOJO, organizationId: ORG })).toBe(true);
    expect(scopeCanAccessDojo(scope, { id: OTHER_DOJO, organizationId: OTHER_ORG })).toBe(false);
  });

  it('returns assigned-dojo scope for dojo roles', () => {
    const s = sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'dojo_admin' }]);
    const scope = getRoleAccessScope(s, ['dojo_admin']);
    expect(scope).toEqual({ global: false, organizationIds: [], dojoIds: [DOJO] });
    expect(scopeCanAccessOrganization(scope, ORG)).toBe(false);
    expect(scopeCanAccessDojo(scope, { id: DOJO, organizationId: ORG })).toBe(true);
    expect(scopeCanAccessDojo(scope, { id: OTHER_DOJO, organizationId: ORG })).toBe(false);
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

describe('canAccessFinance', () => {
  it('allows super admins and organization admins only', () => {
    expect(
      canAccessFinance(sessionWith([{ organizationId: ORG, dojoId: null, role: 'super_admin' }])),
    ).toBe(true);
    expect(
      canAccessFinance(
        sessionWith([{ organizationId: ORG, dojoId: null, role: 'organization_admin' }]),
      ),
    ).toBe(true);
  });

  it('blocks dojo admins, instructors, and finance staff', () => {
    expect(
      canAccessFinance(sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'dojo_admin' }])),
    ).toBe(false);
    expect(
      canAccessFinance(sessionWith([{ organizationId: ORG, dojoId: DOJO, role: 'instructor' }])),
    ).toBe(false);
    expect(
      canAccessFinance(sessionWith([{ organizationId: ORG, dojoId: null, role: 'finance_staff' }])),
    ).toBe(false);
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

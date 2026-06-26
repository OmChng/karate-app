/**
 * Role-based access control helpers.
 *
 * Roles are assignments of (user, organization, dojo?, role). A request
 * is allowed if the session user has *any* assignment that matches the
 * requested role within the requested scope.
 */
import type { Session } from 'next-auth';
import type { UserRole } from '@/db/schema/enums';

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export interface AccessScope {
  organizationId?: string;
  dojoId?: string;
}

export interface RoleAccessScope {
  global: boolean;
  organizationIds: string[];
  dojoIds: string[];
}

/**
 * Implicit role hierarchy — listing one of these accepts any role
 * higher up the chain too.
 */
const ROLE_INHERITS: Partial<Record<UserRole, UserRole[]>> = {
  member: ['organization_admin', 'dojo_admin'],
  parent: ['organization_admin', 'dojo_admin'],
  assistant_instructor: ['organization_admin', 'dojo_admin', 'instructor'],
  instructor: ['organization_admin', 'dojo_admin'],
  dojo_admin: ['organization_admin'],
  finance_staff: ['organization_admin'],
  organization_admin: ['super_admin'],
};

const ORGANIZATION_WIDE_ROLES = new Set<UserRole>(['organization_admin', 'finance_staff']);
export const FINANCE_ACCESS_ROLES = ['organization_admin'] as const satisfies readonly UserRole[];

function expandRoles(roles: readonly UserRole[]): Set<UserRole> {
  const out = new Set<UserRole>();
  for (const r of roles) {
    out.add(r);
    for (const inh of ROLE_INHERITS[r] ?? []) out.add(inh);
  }
  out.add('super_admin');
  return out;
}

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.roles?.some((role) => role.role === 'super_admin') ?? false;
}

export function canAccessFinance(session: Session | null): boolean {
  return hasRole(session, FINANCE_ACCESS_ROLES);
}

export function hasRole(
  session: Session | null,
  allowed: readonly UserRole[],
  scope: AccessScope = {},
): boolean {
  if (!session?.user?.roles) return false;
  const accepted = expandRoles(allowed);
  return session.user.roles.some((r) => {
    if (!accepted.has(r.role)) return false;
    if (r.role === 'super_admin') return true;
    if (scope.organizationId && r.organizationId !== scope.organizationId) return false;
    if (scope.dojoId) {
      if (r.dojoId && r.dojoId !== scope.dojoId) return false;
      return true;
    }
    if (scope.organizationId && r.dojoId) return false;
    return true;
  });
}

export function getRoleAccessScope(
  session: Session | null,
  allowed: readonly UserRole[],
  scope: Pick<AccessScope, 'organizationId'> = {},
): RoleAccessScope {
  if (!session?.user?.roles) return { global: false, organizationIds: [], dojoIds: [] };

  const accepted = expandRoles(allowed);
  const organizationIds = new Set<string>();
  const dojoIds = new Set<string>();

  for (const role of session.user.roles) {
    if (!accepted.has(role.role)) continue;
    if (role.role === 'super_admin') return { global: true, organizationIds: [], dojoIds: [] };
    if (scope.organizationId && role.organizationId !== scope.organizationId) continue;

    if (role.dojoId) {
      dojoIds.add(role.dojoId);
      continue;
    }

    if (ORGANIZATION_WIDE_ROLES.has(role.role)) {
      organizationIds.add(role.organizationId);
    }
  }

  return {
    global: false,
    organizationIds: [...organizationIds],
    dojoIds: [...dojoIds],
  };
}

export function isRoleAccessScopeEmpty(scope: RoleAccessScope): boolean {
  return !scope.global && scope.organizationIds.length === 0 && scope.dojoIds.length === 0;
}

export function scopeCanAccessOrganization(
  scope: RoleAccessScope,
  organizationId: string,
): boolean {
  return scope.global || scope.organizationIds.includes(organizationId);
}

export function scopeCanAccessDojo(
  scope: RoleAccessScope,
  dojo: { id: string; organizationId: string },
): boolean {
  return (
    scope.global ||
    scope.organizationIds.includes(dojo.organizationId) ||
    scope.dojoIds.includes(dojo.id)
  );
}

export function requireSession(session: Session | null): asserts session is Session {
  if (!session?.user) throw new UnauthenticatedError();
}

export function requireRole(
  session: Session | null,
  allowed: readonly UserRole[],
  scope: AccessScope = {},
): Session {
  requireSession(session);
  if (!hasRole(session, allowed, scope)) {
    throw new ForbiddenError(
      `Required one of [${allowed.join(', ')}] in scope ${JSON.stringify(scope)}`,
    );
  }
  return session;
}

/**
 * The default organization for the current session.
 *  - If the user is a member of exactly one org, returns it.
 *  - Otherwise, the user must have set a current org elsewhere (TODO).
 */
export function currentOrganizationId(session: Session | null): string | null {
  if (!session?.user?.roles?.length) return null;
  const orgs = new Set(session.user.roles.map((r) => r.organizationId));
  if (orgs.size === 1) return [...orgs][0] ?? null;
  return [...orgs][0] ?? null;
}

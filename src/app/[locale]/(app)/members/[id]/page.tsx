import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty, scopeCanAccessDojo } from '@/lib/rbac';
import { listDojosForAccess } from '@/server/access';
import { getMemberByIdForAccess, getMemberDetailDataForAccess } from '@/server/members/queries';
import MemberDetailClient from './member-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'members.detail' });
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) {
    return { title: t('fallbackTitle') };
  }
  const m = await getMemberByIdForAccess(accessScope, id);
  if (!m) return { title: t('fallbackTitle') };
  return { title: `${m.firstName} ${m.lastName}` };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) {
    notFound();
  }
  const data = await getMemberDetailDataForAccess(accessScope, id);
  if (!data) notFound();

  const adminScope = getRoleAccessScope(session, ['organization_admin', 'dojo_admin']);
  const instructorScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  const memberDojo = { id: data.member.dojoId, organizationId: data.member.organizationId };
  const canManageMember = scopeCanAccessDojo(adminScope, memberDojo);
  const canManageClasses = scopeCanAccessDojo(instructorScope, memberDojo);
  const dojoOptions = await listDojosForAccess(adminScope);

  return (
    <MemberDetailClient
      member={data.member}
      dojos={dojoOptions}
      activeClasses={data.activeClasses}
      assignableClasses={data.assignableClasses}
      promotions={data.promotions}
      blackBeltLeagueResults={data.blackBeltLeagueResults}
      rankOptions={data.rankOptions}
      canEditMember={canManageMember}
      canTransferMember={canManageMember}
      canUpdateStatus={canManageMember}
      canPromote={canManageClasses}
      canManageClasses={canManageClasses}
    />
  );
}

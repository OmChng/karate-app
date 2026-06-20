import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { eq, isNull, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { currentOrganizationId, hasRole } from '@/lib/rbac';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import { getMemberById, getMemberDetailData } from '@/server/members/queries';
import MemberDetailClient from './member-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'members.detail' });
  const session = await auth();
  const orgId = currentOrganizationId(session);
  if (
    !orgId ||
    !hasRole(session, ['organization_admin', 'dojo_admin'], { organizationId: orgId })
  ) {
    return { title: t('fallbackTitle') };
  }
  const m = await getMemberById(orgId, id);
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
  const orgId = currentOrganizationId(session);
  if (
    !orgId ||
    !hasRole(session, ['organization_admin', 'dojo_admin'], { organizationId: orgId })
  ) {
    notFound();
  }
  const data = await getMemberDetailData(orgId, id);
  if (!data) notFound();

  const dojoOptions = await db
    .select({ id: dojos.id, name: dojos.name })
    .from(dojos)
    .where(and(eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)));

  return (
    <MemberDetailClient
      member={data.member}
      dojos={dojoOptions}
      activeClasses={data.activeClasses}
      assignableClasses={data.assignableClasses}
      promotions={data.promotions}
      blackBeltLeagueResults={data.blackBeltLeagueResults}
      rankOptions={data.rankOptions}
    />
  );
}

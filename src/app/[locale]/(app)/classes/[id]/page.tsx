import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import { currentOrganizationId } from '@/lib/rbac';
import { getClassDetail } from '@/server/classes/queries';
import ClassDetailClient from './class-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'classes.detail' });
  const session = await auth();
  const orgId = currentOrganizationId(session);
  if (!orgId) return { title: t('fallbackTitle') };
  const data = await getClassDetail(orgId, id);
  return { title: data?.name ?? t('fallbackTitle') };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const orgId = currentOrganizationId(session);
  if (!orgId) notFound();
  const data = await getClassDetail(orgId, id);
  if (!data) notFound();
  const dojoOptions = await db
    .select({ id: dojos.id, name: dojos.name })
    .from(dojos)
    .where(and(eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)));

  return (
    <ClassDetailClient
      classRow={data}
      dojos={dojoOptions}
      roster={data.roster}
      assignableMembers={data.assignableMembers}
    />
  );
}

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { listDojosForAccess, listRoomsForAccess } from '@/server/access';
import { getClassDetailForAccess } from '@/server/classes/queries';
import ClassDetailClient from './class-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'classes.detail' });
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) return { title: t('fallbackTitle') };
  const data = await getClassDetailForAccess(accessScope, id);
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
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) notFound();
  const data = await getClassDetailForAccess(accessScope, id);
  if (!data) notFound();
  const dojoOptions = await listDojosForAccess(accessScope);
  const roomOptions = await listRoomsForAccess(accessScope);

  return (
    <ClassDetailClient
      classRow={data}
      dojos={dojoOptions}
      rooms={roomOptions}
      roster={data.roster}
      assignableMembers={data.assignableMembers}
    />
  );
}

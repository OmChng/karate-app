import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { listDojosForAccess, listRoomsForAccess } from '@/server/access';
import { listClassesForAccess } from '@/server/classes/queries';
import ClassesClient from './classes-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'classes' });
  return { title: t('title') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) notFound();

  const classRows = await listClassesForAccess(accessScope);
  const dojoOptions = await listDojosForAccess(accessScope);
  const roomOptions = await listRoomsForAccess(accessScope);

  return <ClassesClient classes={classRows} dojos={dojoOptions} rooms={roomOptions} />;
}

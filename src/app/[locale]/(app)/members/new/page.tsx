import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { listDojosForAccess } from '@/server/access';
import MemberForm from '../member-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'members.form' });
  return { title: t('createTitle') };
}

export default async function NewMemberPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('members.form');
  const session = await auth();
  const accessScope = getRoleAccessScope(session, ['organization_admin', 'dojo_admin']);
  if (isRoleAccessScopeEmpty(accessScope)) {
    notFound();
  }

  const dojoOptions = await listDojosForAccess(accessScope);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('createTitle')}</h1>
      <MemberForm
        mode="create"
        dojos={dojoOptions}
        initial={{
          firstName: '',
          firstNameKatakana: '',
          lastName: '',
          code: '',
          curp: '',
          email: '',
          phone: '',
          emergencyPhone: '',
          dateOfBirth: '',
          bloodType: '',
          specialCareNotes: '',
          dojoId: dojoOptions[0]?.id ?? '',
          status: 'active',
          notes: '',
        }}
      />
    </div>
  );
}

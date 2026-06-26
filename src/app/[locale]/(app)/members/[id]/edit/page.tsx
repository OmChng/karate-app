import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { listDojosForAccess } from '@/server/access';
import { getMemberByIdForAccess } from '@/server/members/queries';
import MemberForm from '../../member-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'members.form' });
  return { title: t('editTitle') };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('members.form');
  const session = await auth();
  const accessScope = getRoleAccessScope(session, ['organization_admin', 'dojo_admin']);
  if (isRoleAccessScopeEmpty(accessScope)) {
    notFound();
  }

  const m = await getMemberByIdForAccess(accessScope, id);
  if (!m) notFound();

  const dojoOptions = await listDojosForAccess(accessScope);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('editTitle')}</h1>
      <MemberForm
        mode="edit"
        memberId={id}
        dojos={dojoOptions}
        initial={{
          firstName: m.firstName,
          firstNameKatakana: m.firstNameKatakana,
          lastName: m.lastName,
          code: m.code,
          curp: m.curp,
          email: m.email,
          phone: m.phone,
          emergencyPhone: m.emergencyPhone,
          dateOfBirth: m.dateOfBirth,
          bloodType: m.bloodType,
          specialCareNotes: m.specialCareNotes,
          dojoId: m.dojoId,
          status: m.status,
          notes: m.notes,
        }}
      />
    </div>
  );
}

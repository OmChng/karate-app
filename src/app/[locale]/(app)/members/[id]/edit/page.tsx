import { setRequestLocale, getTranslations } from 'next-intl/server';
import { and, eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { currentOrganizationId, hasRole } from '@/lib/rbac';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import { getMemberById } from '@/server/members/queries';
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
  const orgId = currentOrganizationId(session);
  if (
    !orgId ||
    !hasRole(session, ['organization_admin', 'dojo_admin'], { organizationId: orgId })
  ) {
    notFound();
  }

  const m = await getMemberById(orgId, id);
  if (!m) notFound();

  const dojoOptions = await db
    .select({ id: dojos.id, name: dojos.name })
    .from(dojos)
    .where(and(eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)));

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

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { and, eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { currentOrganizationId, hasRole } from '@/lib/rbac';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
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
  const orgId = currentOrganizationId(session);
  if (
    !orgId ||
    !hasRole(session, ['organization_admin', 'dojo_admin'], { organizationId: orgId })
  ) {
    notFound();
  }

  const dojoOptions = await db
    .select({ id: dojos.id, name: dojos.name })
    .from(dojos)
    .where(and(eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)));

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

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { currentOrganizationId } from '@/lib/rbac';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import { listClassesForOrg } from '@/server/classes/queries';
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
  const orgId = currentOrganizationId(session);
  const classRows = orgId ? await listClassesForOrg(orgId) : [];
  const dojoOptions = orgId
    ? await db
        .select({ id: dojos.id, name: dojos.name })
        .from(dojos)
        .where(and(eq(dojos.organizationId, orgId), isNull(dojos.deletedAt)))
    : [];

  return <ClassesClient classes={classRows} dojos={dojoOptions} />;
}

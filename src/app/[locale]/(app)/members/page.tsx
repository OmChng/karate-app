import { setRequestLocale, getTranslations } from 'next-intl/server';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { currentOrganizationId, hasRole } from '@/lib/rbac';
import { db } from '@/db/client';
import { dojos } from '@/db/schema';
import { listMembersForOrg } from '@/server/members/queries';
import { memberListQuerySchema, type MemberListQuery } from '@/server/members/schemas';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
} from '@/components/ui/table-styles';
import MembersTable from './members-table';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'members.list' });
  return { title: t('title') };
}

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('members.list');
  const tCommon = await getTranslations('common');
  const session = await auth();
  const orgId = currentOrganizationId(session);

  if (!orgId) {
    return <div>{tCommon('noOrganizationContext')}</div>;
  }
  if (!hasRole(session, ['organization_admin', 'dojo_admin'], { organizationId: orgId })) {
    notFound();
  }

  const raw = (await searchParams) ?? {};
  const parsed = memberListQuerySchema.safeParse({
    page: raw.page,
    pageSize: raw.pageSize,
    q: typeof raw.q === 'string' ? raw.q : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    dojoId: typeof raw.dojoId === 'string' ? raw.dojoId : undefined,
    sortBy: typeof raw.sortBy === 'string' ? raw.sortBy : undefined,
    sortDir: typeof raw.sortDir === 'string' ? raw.sortDir : undefined,
  });
  const fallbackQuery: MemberListQuery = {
    page: 1,
    pageSize: 20,
    q: undefined,
    status: undefined,
    dojoId: undefined,
    sortBy: 'name',
    sortDir: 'asc',
  };
  const query = parsed.success ? parsed.data : fallbackQuery;

  const { rows, total } = await listMembersForOrg(orgId, query);
  const dojoOptions = await db
    .select({ id: dojos.id, name: dojos.name })
    .from(dojos)
    .where(eq(dojos.organizationId, orgId));

  return (
    <section className={panelShellClass}>
      <div
        className={cn(
          panelHeaderVariants('accent'),
          'flex flex-wrap items-end justify-between gap-3',
        )}
      >
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className={panelHeaderDescriptionClass}>{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/members/transfers"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('transfers')}
          </Link>
          <Link
            href="/members/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('new')}
          </Link>
        </div>
      </div>

      <div className="p-4">
        <MembersTable rows={rows} total={total} query={query} dojos={dojoOptions} />
      </div>
    </section>
  );
}

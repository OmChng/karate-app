import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  FINANCE_ACCESS_ROLES,
  canAccessFinance,
  getRoleAccessScope,
  isRoleAccessScopeEmpty,
} from '@/lib/rbac';
import { formatCurrency } from '@/lib/utils';
import { MetricCard } from '@/components/ui/metric-card';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
  panelTitleClass,
} from '@/components/ui/table-styles';
import { getMonthlyRevenueForAccess } from '@/server/finance/queries';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'finance' });
  return { title: t('title') };
}

export default async function FinanceOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('finance');
  const session = await auth();
  if (!canAccessFinance(session)) notFound();

  const accessScope = getRoleAccessScope(session, FINANCE_ACCESS_ROLES);
  if (isRoleAccessScopeEmpty(accessScope)) notFound();

  const revenueMonth = await getMonthlyRevenueForAccess(accessScope);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('kpis.revenueMonth')}
          value={formatCurrency(revenueMonth, 'MXN', 'es-MX')}
          detail={t('kpis.revenueMonthDetail')}
          tone="good"
        />
      </section>

      <section className={panelShellClass}>
        <div className={panelHeaderVariants('accent')}>
          <h2 className={panelTitleClass}>{t('overview.title')}</h2>
          <p className={panelHeaderDescriptionClass}>{t('overview.subtitle')}</p>
        </div>
        <p className="p-4 text-sm leading-6 text-muted-foreground">{t('overview.body')}</p>
      </section>
    </div>
  );
}

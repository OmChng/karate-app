import FinanceModulePage from '@/components/legacy/finance-module-page';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <FinanceModulePage locale={locale} pageKey="payments" />;
}

import ModulePage from '@/components/legacy/module-page';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ModulePage locale={locale} pageKey="cashRegister" />;
}

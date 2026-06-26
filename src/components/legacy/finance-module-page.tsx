import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { canAccessFinance } from '@/lib/rbac';
import ModulePage from './module-page';

export default async function FinanceModulePage({
  locale,
  pageKey,
}: {
  locale: string;
  pageKey: string;
}) {
  const session = await auth();
  if (!canAccessFinance(session)) notFound();

  return <ModulePage locale={locale} pageKey={pageKey} />;
}

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound() {
  const t = useTranslations('common');
  return (
    <main
      id="main"
      className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16"
    >
      <h1 className="text-3xl font-bold">{t('notFound')}</h1>
      <p className="text-muted-foreground">{t('notFoundDescription')}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t('goHome')}
      </Link>
    </main>
  );
}

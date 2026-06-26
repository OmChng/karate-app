import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const PUBLIC_LOCALES = ['es', 'en'] as const;

export function PublicLanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations('publicHome.language');

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center overflow-hidden rounded-md border border-[#d1d5db] dark:border-white/20',
        className,
      )}
    >
      {PUBLIC_LOCALES.map((targetLocale) => {
        const active = locale === targetLocale;
        return (
          <Link
            key={targetLocale}
            href="/"
            locale={targetLocale}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center px-3 text-sm font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-white',
              active
                ? 'bg-[#10131a] text-white dark:bg-white dark:text-[#10131a]'
                : 'text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#10131a] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white',
            )}
          >
            {t(targetLocale)}
          </Link>
        );
      })}
    </div>
  );
}

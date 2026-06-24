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
        'inline-flex min-h-11 shrink-0 items-center overflow-hidden rounded-md border border-white/20',
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
              'inline-flex min-h-11 items-center px-3 text-sm font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              active
                ? 'bg-white text-[#10131a]'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            {t(targetLocale)}
          </Link>
        );
      })}
    </div>
  );
}

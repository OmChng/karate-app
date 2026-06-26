import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PublicLanguageSwitcher } from './public-language-switcher';

const FOOTER_LINKS = [
  { href: '#quienes-somos', key: 'about' },
  { href: '#academias', key: 'academies' },
  { href: '#programas', key: 'programs' },
  { href: '#noticias', key: 'news' },
  { href: '#contacto', key: 'contact' },
] as const;

export function PublicFooter() {
  const t = useTranslations('publicHome');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e5e7eb] bg-[#f7f8fa] py-8 text-[#10131a] dark:border-white/10 dark:bg-[#0b0f14] dark:text-white">
      <div className="container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">{t('brand.name')}</p>
          <p className="mt-2 text-sm text-[#6b7280] dark:text-white/60">
            {t('footer.copyright', { year })}
          </p>
        </div>
        <nav aria-label={t('footer.navLabel')} className="flex flex-wrap gap-2">
          {FOOTER_LINKS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-[#4b5563] transition-colors duration-fast ease-standard hover:bg-[#e5e7eb] hover:text-[#10131a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white/[0.68] dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white"
            >
              {t(`nav.${item.key}`)}
            </a>
          ))}
          <PublicLanguageSwitcher />
          <Link
            href="/login"
            locale="es"
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-[#10131a] transition-colors duration-fast ease-standard hover:bg-[#e5e7eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white"
          >
            {t('actions.login')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

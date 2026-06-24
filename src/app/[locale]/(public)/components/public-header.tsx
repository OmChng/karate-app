import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import ThemeToggleButton from '@/components/nav/theme-toggle-button';
import { InitialReveal } from '@/components/motion/reveal';
import { PublicLanguageSwitcher } from './public-language-switcher';

const NAV_ITEMS = [
  { href: '#quienes-somos', key: 'about' },
  { href: '#academias', key: 'academies' },
  { href: '#programas', key: 'programs' },
  { href: '#noticias', key: 'news' },
  { href: '#contacto', key: 'contact' },
] as const;

export function PublicHeader() {
  const t = useTranslations('publicHome');

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f14]/95 text-white backdrop-blur supports-[backdrop-filter]:bg-[#0b0f14]/[0.85]">
      <InitialReveal
        className="container grid gap-3 py-4 lg:flex lg:items-center lg:gap-4"
        y={-12}
        blur={0}
        duration={0.45}
      >
        <a
          href="#main"
          className="group flex min-h-11 min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-white"
          aria-label={t('brand.homeLabel')}
        >
          <span className="brand-mark h-10 w-10 shrink-0 rounded-md" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold uppercase tracking-[0.18em] text-white">
              {t('brand.name')}
            </span>
            <span className="block truncate text-xs text-white/60">{t('brand.tagline')}</span>
          </span>
        </a>
        <nav
          aria-label={t('nav.primaryLabel')}
          className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:ml-auto lg:justify-end lg:pb-0"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-white/[0.72] transition-colors duration-fast ease-standard hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t(`nav.${item.key}`)}
            </a>
          ))}
          <PublicLanguageSwitcher />
          <ThemeToggleButton className="border-white/20 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white" />
          <Link
            href="/login"
            locale="es"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t('actions.login')}
          </Link>
        </nav>
      </InitialReveal>
    </header>
  );
}

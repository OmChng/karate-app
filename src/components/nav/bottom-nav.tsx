'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { BOTTOM_NAV, isActive } from './nav-items';

/**
 * Phone-only fixed bottom tab bar. Hidden at md (768 px) and up where the
 * persistent labeled sidebar takes over.
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <nav
      aria-label={t('primary')}
      className="bottom-nav-surface fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-between px-1">
        {BOTTOM_NAV.map(({ href, key, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'my-1 flex h-14 flex-col items-center justify-center gap-1 rounded-md border-t-[3px] text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-periwinkle bg-primary font-semibold text-primary-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-purple-subtle/70 hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

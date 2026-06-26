'use client';

import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarSheetContent } from './sidebar';

/**
 * Hamburger button for phones (<md). The labeled sidebar at md+ replaces it.
 */
export function MobileNavTrigger({
  userName,
  canViewFinance = false,
}: {
  userName?: string | null;
  canViewFinance?: boolean;
}) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label={t('openMenu')}
        disabled={!hydrated}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-lg transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <SheetContent
        side="left"
        title={t('primary')}
        closeLabel={t('closeMenu')}
        className="sidebar-surface"
      >
        <div className="sidebar-header -m-4 mb-0 flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 pr-14">
          <div className="brand-mark h-7 w-7 rounded-md" aria-hidden />
          <span className="font-semibold tracking-tight">GOJU-KAN</span>
        </div>
        <SidebarSheetContent
          user={{ name: userName }}
          canViewFinance={canViewFinance}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

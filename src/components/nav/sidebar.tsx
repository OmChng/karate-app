'use client';

import { ChevronDown, PanelLeftClose, PanelLeftOpen, Receipt } from 'lucide-react';
import { Fragment, useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import FontSizeToggleButton from './font-size-toggle-button';
import { FINANCE_NAV, PRIMARY_NAV, isActive, type NavItem } from './nav-items';
import SignOutButton from './sign-out-button';
import { SlidingOverflowText } from './sliding-overflow-text';
import ThemeToggleButton from './theme-toggle-button';

type TextNavVariant = 'desktop' | 'sheet';
type SidebarUser = {
  name?: string | null;
};

const ACTIVE_LINK_CLASS = 'nav-link-active font-semibold';
const INACTIVE_LINK_CLASS = 'nav-link-inactive';
const ACTIVE_RAIL_CLASS = 'nav-rail-active';
const INACTIVE_RAIL_CLASS = 'nav-rail-inactive';
const SIDEBAR_COLLAPSED_KEY = 'sensei.sidebarCollapsed';

function financeIsActive(pathname: string) {
  return FINANCE_NAV.some(({ href }) => isActive(pathname, href));
}

function userInitials(name?: string | null) {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function SidebarUserIdentity({
  user,
  compact = false,
  open,
  controlsId,
  onToggle,
}: {
  user: SidebarUser;
  compact?: boolean;
  open: boolean;
  controlsId: string;
  onToggle: () => void;
}) {
  const t = useTranslations('nav');
  const name = user.name || t('unknownUser');

  if (compact) {
    return (
      <button
        type="button"
        className="sidebar-user-avatar flex h-11 w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-md border border-border text-sm font-semibold transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={name}
        aria-label={t('currentUser', { name })}
        aria-expanded={open}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        <span aria-hidden>{userInitials(name)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="sidebar-user-card flex min-h-14 w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-md border border-border p-3 text-left transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={t('currentUser', { name })}
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      <div
        className="sidebar-user-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-sm font-semibold"
        aria-hidden
      >
        {userInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="min-w-0 text-sm font-semibold text-white">
          <SlidingOverflowText>{name}</SlidingOverflowText>
        </p>
        <p className="truncate text-xs text-muted-foreground">{t('activeSession')}</p>
      </div>
      <ChevronDown
        className={cn(
          'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-fast ease-standard',
          open && 'rotate-180',
        )}
        aria-hidden
      />
    </button>
  );
}

function SidebarGlobalControls({
  user,
  collapsed = false,
  collapseLabel,
  onToggleCollapsed,
}: {
  user: SidebarUser;
  collapsed?: boolean;
  collapseLabel?: string;
  onToggleCollapsed?: () => void;
}) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const controlsId = useId();

  return (
    <div
      className={cn(
        'sidebar-control-panel flex min-w-0 max-w-full flex-col gap-2 overflow-hidden',
        collapsed ? 'p-1' : 'p-2',
      )}
    >
      <SidebarUserIdentity
        user={user}
        compact={collapsed}
        open={open}
        controlsId={controlsId}
        onToggle={() => setOpen((value) => !value)}
      />
      <div
        id={controlsId}
        className="sidebar-account-menu grid min-w-0 max-w-full gap-2 overflow-hidden"
        data-state={open ? 'open' : 'closed'}
        aria-hidden={!open}
      >
        <ThemeToggleButton
          showLabel={!collapsed}
          className={cn(
            'max-w-full border-border text-muted-foreground',
            collapsed ? 'w-full px-0' : 'w-full justify-start',
          )}
        />
        <FontSizeToggleButton
          showLabel={!collapsed}
          className={cn(
            'max-w-full border-border text-muted-foreground',
            collapsed ? 'w-full px-0' : 'w-full justify-start',
          )}
        />
        <SignOutButton
          label={t('signOut')}
          showLabel={!collapsed}
          className={cn(
            'max-w-full border-border text-muted-foreground',
            collapsed ? 'w-full px-0' : 'w-full justify-start',
          )}
        />
      </div>
      {collapseLabel && onToggleCollapsed && (
        <button
          type="button"
          title={collapseLabel}
          aria-label={collapseLabel}
          onClick={onToggleCollapsed}
          className={cn(
            'flex min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            !collapsed && 'justify-start',
            collapsed && 'px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
          {!collapsed && <span className="truncate">{collapseLabel}</span>}
        </button>
      )}
    </div>
  );
}

function TextNavLink({
  item,
  label,
  pathname,
  variant,
  nested = false,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  pathname: string;
  variant: TextNavVariant;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const base =
    variant === 'desktop'
      ? 'flex min-h-11 min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : 'flex min-h-12 min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-base transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(base, nested && 'pl-4', active ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS)}
      aria-current={active ? 'page' : undefined}
    >
      <item.Icon
        className={cn(
          variant === 'desktop' ? 'h-4 w-4' : 'h-5 w-5',
          'shrink-0',
          active && 'text-primary',
        )}
        aria-hidden
      />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function FinanceTextSection({
  variant,
  onNavigate,
}: {
  variant: TextNavVariant;
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const active = financeIsActive(pathname);
  const [expanded, setExpanded] = useState(active);
  const open = expanded || active;
  const buttonBase =
    variant === 'desktop'
      ? 'flex min-h-11 w-full min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : 'flex min-h-12 w-full min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-base transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setExpanded((value) => !value)}
        className={cn(buttonBase, active ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS)}
      >
        <Receipt
          className={cn(
            variant === 'desktop' ? 'h-4 w-4' : 'h-5 w-5',
            'shrink-0',
            active && 'text-primary',
          )}
          aria-hidden
        />
        <span className="min-w-0 truncate">{t('finances')}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 transition-transform duration-fast ease-standard',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open && (
        <ul className={cn('mt-1 flex flex-col gap-0.5', variant === 'desktop' ? 'pl-7' : 'pl-8')}>
          {FINANCE_NAV.map((item) => (
            <li key={item.key}>
              <TextNavLink
                item={item}
                label={t(item.key)}
                pathname={pathname}
                variant={variant}
                nested
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function TextNavItems({
  variant,
  onNavigate,
}: {
  variant: TextNavVariant;
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <>
      {PRIMARY_NAV.map((item) => (
        <Fragment key={item.key}>
          {item.key === 'settings' && (
            <FinanceTextSection variant={variant} onNavigate={onNavigate} />
          )}
          <li>
            <TextNavLink
              item={item}
              label={t(item.key)}
              pathname={pathname}
              variant={variant}
              onNavigate={onNavigate}
            />
          </li>
        </Fragment>
      ))}
    </>
  );
}

function FinanceRailSection() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const active = financeIsActive(pathname);
  const [expanded, setExpanded] = useState(active);
  const open = expanded || active;

  return (
    <li className="flex flex-col gap-1">
      <button
        type="button"
        title={t('finances')}
        aria-label={t('finances')}
        aria-expanded={open}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-md transition-colors duration-fast ease-standard',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active ? ACTIVE_RAIL_CLASS : INACTIVE_RAIL_CLASS,
        )}
      >
        <Receipt className={cn('h-5 w-5', active && 'text-primary')} aria-hidden />
      </button>
      {open && (
        <ul className="flex flex-col gap-1">
          {FINANCE_NAV.map(({ href, key, Icon }) => {
            const itemActive = isActive(pathname, href);
            const label = t(key);
            return (
              <li key={key}>
                <Link
                  href={href}
                  title={label}
                  aria-label={label}
                  aria-current={itemActive ? 'page' : undefined}
                  className={cn(
                    'flex h-11 w-full items-center justify-center rounded-md transition-colors duration-fast ease-standard',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    itemActive ? ACTIVE_RAIL_CLASS : INACTIVE_RAIL_CLASS,
                  )}
                >
                  <Icon className={cn('h-4 w-4', itemActive && 'text-primary')} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function RailNavItems() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <>
      {PRIMARY_NAV.map(({ href, key, Icon }) => {
        const active = isActive(pathname, href);
        const label = t(key);
        return (
          <Fragment key={key}>
            {key === 'settings' && <FinanceRailSection />}
            <li>
              <Link
                href={href}
                title={label}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-md transition-colors duration-fast ease-standard',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? ACTIVE_RAIL_CLASS : INACTIVE_RAIL_CLASS,
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'text-primary')} aria-hidden />
              </Link>
            </li>
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * Persistent labeled sidebar for tablet and desktop (>= md, 768 px).
 */
export function SidebarDesktop({ user }: { user: SidebarUser }) {
  const t = useTranslations('nav');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored) setCollapsed(stored === 'true');
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  const collapseLabel = collapsed ? t('expandMenu') : t('collapseMenu');

  return (
    <aside
      aria-label={t('primary')}
      className={cn(
        'sidebar-surface hidden h-dvh shrink-0 border-r transition-[width] duration-normal ease-out md:flex md:flex-col',
        'relative',
        collapsed ? 'md:w-16' : 'md:w-[13.5rem]',
      )}
    >
      <div
        className={cn(
          'sidebar-header flex h-14 shrink-0 items-center gap-2 border-b border-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="brand-mark h-7 w-7 rounded-md" aria-hidden />
        {!collapsed && <span className="font-semibold tracking-tight">GOJU-KAN</span>}
      </div>
      <nav data-sidebar-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        <ul className={cn('flex flex-col', collapsed ? 'gap-1' : 'gap-0.5')}>
          {collapsed ? <RailNavItems /> : <TextNavItems variant="desktop" />}
        </ul>
      </nav>
      <div className="sidebar-footer shrink-0 border-t border-border p-2">
        <SidebarGlobalControls
          user={user}
          collapsed={collapsed}
          collapseLabel={collapseLabel}
          onToggleCollapsed={toggleCollapsed}
        />
      </div>
    </aside>
  );
}

/**
 * Labeled content used inside the phone drawer (the `Sheet`).
 * Renders the same items as the desktop sidebar, full width.
 */
export function SidebarSheetContent({
  user,
  onNavigate,
}: {
  user: SidebarUser;
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  return (
    <>
      <nav
        data-sidebar-scroll
        aria-label={t('primary')}
        className="-mr-2 mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2"
      >
        <ul className="flex flex-col gap-1">
          <TextNavItems variant="sheet" onNavigate={onNavigate} />
        </ul>
      </nav>
      <div className="sidebar-footer -mx-1 shrink-0 border-t border-border pt-3">
        <SidebarGlobalControls user={user} />
      </div>
    </>
  );
}

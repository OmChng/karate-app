import {
  Award,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  MapPin,
  Receipt,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';

export type NavKey =
  | 'dashboard'
  | 'finances'
  | 'staff'
  | 'members'
  | 'clients'
  | 'rooms'
  | 'classes'
  | 'samples'
  | 'exams'
  | 'blackBelts'
  | 'plans'
  | 'reports'
  | 'cashRegister'
  | 'payments'
  | 'cutoff'
  | 'expenses'
  | 'inventory'
  | 'attendance'
  | 'ranks'
  | 'dojos'
  | 'instructors'
  | 'events'
  | 'announcements'
  | 'settings';

export type NavHref =
  | '/'
  | '/instructors'
  | '/members'
  | '/clients'
  | '/rooms'
  | '/classes'
  | '/samples'
  | '/exams'
  | '/black-belts'
  | '/plans'
  | '/reports'
  | '/cash-register'
  | '/payments'
  | '/cutoff'
  | '/expenses'
  | '/inventory'
  | '/attendance'
  | '/ranks'
  | '/dojos'
  | '/events'
  | '/announcements'
  | '/settings';

export interface NavItem {
  href: NavHref;
  key: NavKey;
  Icon: React.ComponentType<{ className?: string }>;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/instructors', key: 'staff', Icon: Trophy },
  { href: '/members', key: 'members', Icon: Users },
  { href: '/clients', key: 'clients', Icon: Users },
  { href: '/rooms', key: 'rooms', Icon: MapPin },
  { href: '/classes', key: 'classes', Icon: Calendar },
  { href: '/samples', key: 'samples', Icon: CheckSquare },
  { href: '/exams', key: 'exams', Icon: Award },
  { href: '/black-belts', key: 'blackBelts', Icon: Trophy },
  { href: '/settings', key: 'settings', Icon: Settings },
];

export const FINANCE_NAV: NavItem[] = [
  { href: '/plans', key: 'plans', Icon: Receipt },
  { href: '/reports', key: 'reports', Icon: Trophy },
  { href: '/cash-register', key: 'cashRegister', Icon: Receipt },
  { href: '/payments', key: 'payments', Icon: Receipt },
  { href: '/cutoff', key: 'cutoff', Icon: CheckSquare },
  { href: '/expenses', key: 'expenses', Icon: Receipt },
  { href: '/inventory', key: 'inventory', Icon: MapPin },
];

/**
 * Four destinations that get a phone bottom-nav tab.
 * Keep this list short — bottom nav is for the most-used routes only.
 */
export const BOTTOM_NAV: NavItem[] = [
  { href: '/', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/members', key: 'members', Icon: Users },
  { href: '/classes', key: 'classes', Icon: Calendar },
  { href: '/instructors', key: 'staff', Icon: Trophy },
];

export function isActive(pathname: string, href: NavHref): boolean {
  if (href === '/') return pathname === '/' || pathname === '' || /^\/(?:en|es)\/?$/.test(pathname);
  // strip leading locale segment for comparison
  const stripped = pathname.replace(/^\/(?:en|es)(?=\/|$)/, '') || '/';
  return stripped === href || stripped.startsWith(href + '/');
}

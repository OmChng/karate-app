import type { ComponentType } from 'react';
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
  | 'financeOverview'
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
  | '/app'
  | '/finances'
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
  Icon: ComponentType<{ className?: string }>;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/app', key: 'dashboard', Icon: LayoutDashboard },
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
  { href: '/finances', key: 'financeOverview', Icon: Receipt },
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
  { href: '/app', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/members', key: 'members', Icon: Users },
  { href: '/classes', key: 'classes', Icon: Calendar },
  { href: '/instructors', key: 'staff', Icon: Trophy },
];

const SPANISH_NAV_PATHS: Record<NavHref, string> = {
  '/app': '/app',
  '/finances': '/app/finanzas',
  '/instructors': '/app/personal',
  '/members': '/app/miembros',
  '/clients': '/app/clientes',
  '/rooms': '/app/salones',
  '/classes': '/app/clases',
  '/samples': '/app/pruebas',
  '/exams': '/app/examenes',
  '/black-belts': '/app/cintas-negras',
  '/plans': '/app/planes',
  '/reports': '/app/reporte',
  '/cash-register': '/app/cajas',
  '/payments': '/app/mensualidades',
  '/cutoff': '/app/corte',
  '/expenses': '/app/gastos',
  '/inventory': '/app/inventario',
  '/attendance': '/app/pase-de-lista',
  '/ranks': '/app/rangos',
  '/dojos': '/app/dojos',
  '/events': '/app/eventos',
  '/announcements': '/app/anuncios',
  '/settings': '/app/configuracion',
};

const ENGLISH_APP_NAV_PATHS: Record<NavHref, string> = {
  '/app': '/app',
  '/finances': '/app/finances',
  '/instructors': '/app/instructors',
  '/members': '/app/members',
  '/clients': '/app/clients',
  '/rooms': '/app/rooms',
  '/classes': '/app/classes',
  '/samples': '/app/samples',
  '/exams': '/app/exams',
  '/black-belts': '/app/black-belts',
  '/plans': '/app/plans',
  '/reports': '/app/reports',
  '/cash-register': '/app/cash-register',
  '/payments': '/app/payments',
  '/cutoff': '/app/cutoff',
  '/expenses': '/app/expenses',
  '/inventory': '/app/inventory',
  '/attendance': '/app/attendance',
  '/ranks': '/app/ranks',
  '/dojos': '/app/dojos',
  '/events': '/app/events',
  '/announcements': '/app/announcements',
  '/settings': '/app/settings',
};

export function isActive(pathname: string, href: NavHref): boolean {
  // strip leading locale segment for comparison
  const stripped = pathname.replace(/^\/(?:en|es)(?=\/|$)/, '') || '/';
  if (href === '/app') return stripped === '/app';
  const spanishPath = SPANISH_NAV_PATHS[href];
  const englishAppPath = ENGLISH_APP_NAV_PATHS[href];
  return [href, spanishPath, englishAppPath].some(
    (candidate) => stripped === candidate || stripped.startsWith(candidate + '/'),
  );
}

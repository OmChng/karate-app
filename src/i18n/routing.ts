import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Public website: Spanish and English. Management app: Spanish-only.
 *
 * - `defaultLocale: 'es'` means `/...` (no prefix) renders Spanish.
 * - `localeDetection: false` disables browser `Accept-Language` sniffing,
 *   so an English-speaking developer's browser does NOT silently route
 *   the customer to `/en/...`.
 * - `/en` is public-site only. Middleware keeps login and protected
 *   management routes on Spanish URLs.
 */
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/app': '/app',
    '/login': {
      es: '/iniciar-sesion',
      en: '/login',
    },
    '/instructors': {
      es: '/app/personal',
      en: '/app/instructors',
    },
    '/instructors/new': {
      es: '/app/personal/nuevo',
      en: '/app/instructors/new',
    },
    '/instructors/[id]': {
      es: '/app/personal/[id]',
      en: '/app/instructors/[id]',
    },
    '/members': {
      es: '/app/miembros',
      en: '/app/members',
    },
    '/members/new': {
      es: '/app/miembros/nuevo',
      en: '/app/members/new',
    },
    '/members/transfers': {
      es: '/app/miembros/transferencias',
      en: '/app/members/transfers',
    },
    '/members/[id]': {
      es: '/app/miembros/[id]',
      en: '/app/members/[id]',
    },
    '/members/[id]/edit': {
      es: '/app/miembros/[id]/editar',
      en: '/app/members/[id]/edit',
    },
    '/clients': {
      es: '/app/clientes',
      en: '/app/clients',
    },
    '/rooms': {
      es: '/app/salones',
      en: '/app/rooms',
    },
    '/rooms/[id]': {
      es: '/app/salones/[id]',
      en: '/app/rooms/[id]',
    },
    '/classes': {
      es: '/app/clases',
      en: '/app/classes',
    },
    '/classes/[id]': {
      es: '/app/clases/[id]',
      en: '/app/classes/[id]',
    },
    '/finances': {
      es: '/app/finanzas',
      en: '/app/finances',
    },
    '/samples': {
      es: '/app/pruebas',
      en: '/app/samples',
    },
    '/exams': {
      es: '/app/examenes',
      en: '/app/exams',
    },
    '/black-belts': {
      es: '/app/cintas-negras',
      en: '/app/black-belts',
    },
    '/plans': {
      es: '/app/planes',
      en: '/app/plans',
    },
    '/reports': {
      es: '/app/reporte',
      en: '/app/reports',
    },
    '/cash-register': {
      es: '/app/cajas',
      en: '/app/cash-register',
    },
    '/payments': {
      es: '/app/mensualidades',
      en: '/app/payments',
    },
    '/cutoff': {
      es: '/app/corte',
      en: '/app/cutoff',
    },
    '/expenses': {
      es: '/app/gastos',
      en: '/app/expenses',
    },
    '/inventory': {
      es: '/app/inventario',
      en: '/app/inventory',
    },
    '/attendance': {
      es: '/app/pase-de-lista',
      en: '/app/attendance',
    },
    '/ranks': {
      es: '/app/rangos',
      en: '/app/ranks',
    },
    '/dojos': {
      es: '/app/dojos',
      en: '/app/dojos',
    },
    '/events': {
      es: '/app/eventos',
      en: '/app/events',
    },
    '/announcements': {
      es: '/app/anuncios',
      en: '/app/announcements',
    },
    '/settings': {
      es: '/app/configuracion',
      en: '/app/settings',
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

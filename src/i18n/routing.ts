import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Spanish-only end-user UX. The audience is Mexican.
 *
 * - `defaultLocale: 'es'` means `/...` (no prefix) renders Spanish.
 * - `localeDetection: false` disables browser `Accept-Language` sniffing,
 *   so an English-speaking developer's browser does NOT silently route
 *   the customer to `/en/...`. English remains accessible only via an
 *   explicit `/en/...` URL — a maintainer escape hatch, not a public
 *   feature. Do not remove this flag without product approval.
 */
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/login': {
      es: '/iniciar-sesion',
      en: '/login',
    },
    '/instructors': {
      es: '/personal',
      en: '/instructors',
    },
    '/instructors/new': {
      es: '/personal/nuevo',
      en: '/instructors/new',
    },
    '/instructors/[id]': {
      es: '/personal/[id]',
      en: '/instructors/[id]',
    },
    '/members': {
      es: '/miembros',
      en: '/members',
    },
    '/members/new': {
      es: '/miembros/nuevo',
      en: '/members/new',
    },
    '/members/transfers': {
      es: '/miembros/transferencias',
      en: '/members/transfers',
    },
    '/members/[id]': {
      es: '/miembros/[id]',
      en: '/members/[id]',
    },
    '/members/[id]/edit': {
      es: '/miembros/[id]/editar',
      en: '/members/[id]/edit',
    },
    '/clients': {
      es: '/clientes',
      en: '/clients',
    },
    '/rooms': {
      es: '/salones',
      en: '/rooms',
    },
    '/rooms/[id]': {
      es: '/salones/[id]',
      en: '/rooms/[id]',
    },
    '/classes': {
      es: '/clases',
      en: '/classes',
    },
    '/classes/[id]': {
      es: '/clases/[id]',
      en: '/classes/[id]',
    },
    '/samples': {
      es: '/pruebas',
      en: '/samples',
    },
    '/exams': {
      es: '/examenes',
      en: '/exams',
    },
    '/black-belts': {
      es: '/cintas-negras',
      en: '/black-belts',
    },
    '/plans': {
      es: '/planes',
      en: '/plans',
    },
    '/reports': {
      es: '/reporte',
      en: '/reports',
    },
    '/cash-register': {
      es: '/cajas',
      en: '/cash-register',
    },
    '/payments': {
      es: '/mensualidades',
      en: '/payments',
    },
    '/cutoff': {
      es: '/corte',
      en: '/cutoff',
    },
    '/expenses': {
      es: '/gastos',
      en: '/expenses',
    },
    '/inventory': {
      es: '/inventario',
      en: '/inventory',
    },
    '/attendance': {
      es: '/pase-de-lista',
      en: '/attendance',
    },
    '/ranks': {
      es: '/rangos',
      en: '/ranks',
    },
    '/dojos': '/dojos',
    '/events': {
      es: '/eventos',
      en: '/events',
    },
    '/announcements': {
      es: '/anuncios',
      en: '/announcements',
    },
    '/settings': {
      es: '/configuracion',
      en: '/settings',
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const SPANISH_CANONICAL_ROUTES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/es\/app\/?$/, () => '/app'],
  [/^\/es\/login\/?$/, () => '/iniciar-sesion'],
  [/^\/es\/iniciar-sesion\/?$/, () => '/iniciar-sesion'],
  [/^\/login\/?$/, () => '/iniciar-sesion'],
  [/^\/instructors\/?$/, () => '/app/personal'],
  [/^\/personal\/?$/, () => '/app/personal'],
  [/^\/app\/instructors\/?$/, () => '/app/personal'],
  [/^\/instructors\/new\/?$/, () => '/app/personal/nuevo'],
  [/^\/personal\/nuevo\/?$/, () => '/app/personal/nuevo'],
  [/^\/app\/instructors\/new\/?$/, () => '/app/personal/nuevo'],
  [/^\/instructors\/([^/]+)\/?$/, (match) => `/app/personal/${match[1]}`],
  [/^\/personal\/([^/]+)\/?$/, (match) => `/app/personal/${match[1]}`],
  [/^\/app\/instructors\/([^/]+)\/?$/, (match) => `/app/personal/${match[1]}`],
  [/^\/(?:members|miembros)\/?$/, () => '/app/miembros'],
  [/^\/app\/members\/?$/, () => '/app/miembros'],
  [/^\/(?:members|miembros)\/new\/?$/, () => '/app/miembros/nuevo'],
  [/^\/miembros\/nuevo\/?$/, () => '/app/miembros/nuevo'],
  [/^\/app\/members\/new\/?$/, () => '/app/miembros/nuevo'],
  [/^\/(?:members|miembros)\/transfers\/?$/, () => '/app/miembros/transferencias'],
  [/^\/miembros\/transferencias\/?$/, () => '/app/miembros/transferencias'],
  [/^\/app\/members\/transfers\/?$/, () => '/app/miembros/transferencias'],
  [/^\/members\/([^/]+)\/edit\/?$/, (match) => `/app/miembros/${match[1]}/editar`],
  [/^\/app\/members\/([^/]+)\/edit\/?$/, (match) => `/app/miembros/${match[1]}/editar`],
  [/^\/miembros\/([^/]+)\/editar\/?$/, (match) => `/app/miembros/${match[1]}/editar`],
  [/^\/members\/([^/]+)\/?$/, (match) => `/app/miembros/${match[1]}`],
  [/^\/app\/members\/([^/]+)\/?$/, (match) => `/app/miembros/${match[1]}`],
  [/^\/miembros\/([^/]+)\/?$/, (match) => `/app/miembros/${match[1]}`],
  [/^\/(?:clients|clientes)\/?$/, () => '/app/clientes'],
  [/^\/app\/clients\/?$/, () => '/app/clientes'],
  [/^\/(?:rooms|salones)\/?$/, () => '/app/salones'],
  [/^\/app\/rooms\/?$/, () => '/app/salones'],
  [/^\/rooms\/([^/]+)\/?$/, (match) => `/app/salones/${match[1]}`],
  [/^\/app\/rooms\/([^/]+)\/?$/, (match) => `/app/salones/${match[1]}`],
  [/^\/salones\/([^/]+)\/?$/, (match) => `/app/salones/${match[1]}`],
  [/^\/(?:classes|clases)\/?$/, () => '/app/clases'],
  [/^\/app\/classes\/?$/, () => '/app/clases'],
  [/^\/classes\/([^/]+)\/?$/, (match) => `/app/clases/${match[1]}`],
  [/^\/app\/classes\/([^/]+)\/?$/, (match) => `/app/clases/${match[1]}`],
  [/^\/clases\/([^/]+)\/?$/, (match) => `/app/clases/${match[1]}`],
  [/^\/(?:finances|finanzas)\/?$/, () => '/app/finanzas'],
  [/^\/app\/finances\/?$/, () => '/app/finanzas'],
  [/^\/(?:samples|pruebas)\/?$/, () => '/app/pruebas'],
  [/^\/app\/samples\/?$/, () => '/app/pruebas'],
  [/^\/(?:exams|examenes)\/?$/, () => '/app/examenes'],
  [/^\/app\/exams\/?$/, () => '/app/examenes'],
  [/^\/(?:black-belts|cintas-negras)\/?$/, () => '/app/cintas-negras'],
  [/^\/app\/black-belts\/?$/, () => '/app/cintas-negras'],
  [/^\/(?:plans|planes)\/?$/, () => '/app/planes'],
  [/^\/app\/plans\/?$/, () => '/app/planes'],
  [/^\/(?:reports|reporte)\/?$/, () => '/app/reporte'],
  [/^\/app\/reports\/?$/, () => '/app/reporte'],
  [/^\/(?:cash-register|cajas)\/?$/, () => '/app/cajas'],
  [/^\/app\/cash-register\/?$/, () => '/app/cajas'],
  [/^\/(?:payments|mensualidades)\/?$/, () => '/app/mensualidades'],
  [/^\/app\/payments\/?$/, () => '/app/mensualidades'],
  [/^\/(?:cutoff|corte)\/?$/, () => '/app/corte'],
  [/^\/app\/cutoff\/?$/, () => '/app/corte'],
  [/^\/(?:expenses|gastos)\/?$/, () => '/app/gastos'],
  [/^\/app\/expenses\/?$/, () => '/app/gastos'],
  [/^\/(?:inventory|inventario)\/?$/, () => '/app/inventario'],
  [/^\/app\/inventory\/?$/, () => '/app/inventario'],
  [/^\/(?:attendance|pase-de-lista)\/?$/, () => '/app/pase-de-lista'],
  [/^\/app\/attendance\/?$/, () => '/app/pase-de-lista'],
  [/^\/(?:ranks|rangos)\/?$/, () => '/app/rangos'],
  [/^\/app\/ranks\/?$/, () => '/app/rangos'],
  [/^\/dojos\/?$/, () => '/app/dojos'],
  [/^\/(?:events|eventos)\/?$/, () => '/app/eventos'],
  [/^\/app\/events\/?$/, () => '/app/eventos'],
  [/^\/(?:announcements|anuncios)\/?$/, () => '/app/anuncios'],
  [/^\/app\/announcements\/?$/, () => '/app/anuncios'],
  [/^\/(?:settings|configuracion)\/?$/, () => '/app/configuracion'],
  [/^\/app\/settings\/?$/, () => '/app/configuracion'],
];

const PUBLIC_PATTERNS = [
  /^\/(?:es|en)?\/?$/,
  /^\/(?:es\/)?iniciar-sesion\/?$/,
  /^\/(?:es\/)?login\/?$/,
  /^\/(?:es|en)?\/?forgot-password\/?$/,
  /^\/api\/auth(?:\/.*)?$/,
  /^\/_next\//,
  /^\/favicon\.ico$/,
];

function redirectToPath(req: NextRequest, pathname: string, status = 308) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, status);
}

function spanishPathForEnglishLocalePath(pathname: string) {
  if (!pathname.startsWith('/en/')) return null;

  const unprefixedPathname = pathname.replace(/^\/en(?=\/)/, '') || '/';
  if (unprefixedPathname === '/') return null;
  if (/^\/iniciar-sesion\/?$/.test(unprefixedPathname)) return '/iniciar-sesion';

  const canonicalRoute = SPANISH_CANONICAL_ROUTES.find(([pattern]) =>
    pattern.test(unprefixedPathname),
  );
  if (!canonicalRoute) return unprefixedPathname;

  const [pattern, toPathname] = canonicalRoute;
  return toPathname(unprefixedPathname.match(pattern)!);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth.js routes must never be locale-prefixed; let them through untouched.
  if (/^\/api\/auth(?:\/.*)?$/.test(pathname)) {
    return NextResponse.next();
  }

  const spanishPath = spanishPathForEnglishLocalePath(pathname);
  if (spanishPath) {
    return redirectToPath(req, spanishPath);
  }

  const canonicalRoute = SPANISH_CANONICAL_ROUTES.find(([pattern]) => pattern.test(pathname));
  if (canonicalRoute) {
    const [pattern, toPathname] = canonicalRoute;
    return redirectToPath(req, toPathname(pathname.match(pattern)!));
  }

  if (PUBLIC_PATTERNS.some((re) => re.test(pathname))) {
    return intlMiddleware(req);
  }

  const sessionCookie =
    req.cookies.get('authjs.session-token') ?? req.cookies.get('__Secure-authjs.session-token');

  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/iniciar-sesion';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api/(?!auth)|_next/static|_next/image|.*\\..*).*)'],
};

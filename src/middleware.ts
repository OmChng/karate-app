import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const SPANISH_CANONICAL_ROUTES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/login\/?$/, () => '/iniciar-sesion'],
  [/^\/instructors\/?$/, () => '/personal'],
  [/^\/instructors\/new\/?$/, () => '/personal/nuevo'],
  [/^\/instructors\/([^/]+)\/?$/, (match) => `/personal/${match[1]}`],
  [/^\/members\/?$/, () => '/miembros'],
  [/^\/members\/new\/?$/, () => '/miembros/nuevo'],
  [/^\/members\/transfers\/?$/, () => '/miembros/transferencias'],
  [/^\/members\/([^/]+)\/edit\/?$/, (match) => `/miembros/${match[1]}/editar`],
  [/^\/members\/([^/]+)\/?$/, (match) => `/miembros/${match[1]}`],
  [/^\/clients\/?$/, () => '/clientes'],
  [/^\/rooms\/?$/, () => '/salones'],
  [/^\/rooms\/([^/]+)\/?$/, (match) => `/salones/${match[1]}`],
  [/^\/classes\/?$/, () => '/clases'],
  [/^\/classes\/([^/]+)\/?$/, (match) => `/clases/${match[1]}`],
  [/^\/samples\/?$/, () => '/pruebas'],
  [/^\/exams\/?$/, () => '/examenes'],
  [/^\/black-belts\/?$/, () => '/cintas-negras'],
  [/^\/plans\/?$/, () => '/planes'],
  [/^\/reports\/?$/, () => '/reporte'],
  [/^\/cash-register\/?$/, () => '/cajas'],
  [/^\/payments\/?$/, () => '/mensualidades'],
  [/^\/cutoff\/?$/, () => '/corte'],
  [/^\/expenses\/?$/, () => '/gastos'],
  [/^\/inventory\/?$/, () => '/inventario'],
  [/^\/attendance\/?$/, () => '/pase-de-lista'],
  [/^\/ranks\/?$/, () => '/rangos'],
  [/^\/events\/?$/, () => '/eventos'],
  [/^\/announcements\/?$/, () => '/anuncios'],
  [/^\/settings\/?$/, () => '/configuracion'],
];

const PUBLIC_PATTERNS = [
  /^\/(?:es\/)?iniciar-sesion\/?$/,
  /^\/(?:es|en)?\/?login\/?$/,
  /^\/(?:es|en)?\/?forgot-password\/?$/,
  /^\/api\/auth(?:\/.*)?$/,
  /^\/_next\//,
  /^\/favicon\.ico$/,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth.js routes must never be locale-prefixed; let them through untouched.
  if (/^\/api\/auth(?:\/.*)?$/.test(pathname)) {
    return NextResponse.next();
  }

  const canonicalRoute = SPANISH_CANONICAL_ROUTES.find(([pattern]) => pattern.test(pathname));
  if (canonicalRoute) {
    const [pattern, toPathname] = canonicalRoute;
    const url = req.nextUrl.clone();
    url.pathname = toPathname(pathname.match(pattern)!);
    return NextResponse.redirect(url, 308);
  }

  if (PUBLIC_PATTERNS.some((re) => re.test(pathname))) {
    return intlMiddleware(req);
  }

  const sessionCookie =
    req.cookies.get('authjs.session-token') ?? req.cookies.get('__Secure-authjs.session-token');

  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith('/en') ? '/en/login' : '/iniciar-sesion';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api/(?!auth)|_next/static|_next/image|.*\\..*).*)'],
};

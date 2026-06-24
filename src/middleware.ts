import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const SPANISH_CANONICAL_ROUTES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/es\/login\/?$/, () => '/iniciar-sesion'],
  [/^\/es\/iniciar-sesion\/?$/, () => '/iniciar-sesion'],
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

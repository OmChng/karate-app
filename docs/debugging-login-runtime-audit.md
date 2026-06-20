# Debugging audit — "Missing `<html>` and `<body>` tags in the root layout" after login

## Metadata

- **Date / time:** 2026-06-17, 14:50–15:20 UTC-6.
- **App:** Sensei Modern, located at `~/dev/freelance/karate`.
- **Stack at time of audit:** Next.js 15.5.19 (App Router), TypeScript
  strict, next-intl 4.x with `localePrefix: 'as-needed'` +
  `localeDetection: false`, Auth.js v5 (Credentials, JWT), Drizzle ORM
  - PostgreSQL 16 (Docker), Tailwind, pnpm.
- **Local environment:** macOS, Node ≥ 20.11, pnpm 9, Docker Desktop
  running `sensei-postgres` and `sensei-mailhog`.
- **Dev server during audit:** `next-server v15.5.19`, PID 67854,
  listening on `:3000`. Started by the user prior to the audit; not
  restarted.

## Initial symptom (as reported)

After logging in, Next.js rendered:

> Missing `<html>` and `<body>` tags in the root layout.
> Read more at <https://nextjs.org/docs/messages/missing-root-layout-tags>

The login form itself was reachable. The error fired immediately after
the post-login redirect to `/`.

## Reproduction steps (used during this audit)

The dev server was already running. I reproduced the flow using `curl`
only (no second server, no Docker restart, no DB action).

```bash
# Baseline: anonymous landing.
curl -sS -o /dev/null -w 'HTTP %{http_code} -> %{redirect_url}\n' http://localhost:3000/

# Login page renders.
curl -sS -o /tmp/login.html -w 'HTTP %{http_code} bytes=%{size_download}\n' http://localhost:3000/login
grep -c '<html\|<body' /tmp/login.html   # both present

# Programmatic credentials login (uses the seeded admin account).
rm -f /tmp/c.jar
CSRF=$(curl -sS -c /tmp/c.jar http://localhost:3000/api/auth/csrf | python3 -c 'import json,sys;print(json.load(sys.stdin)["csrfToken"])')
curl -sS -b /tmp/c.jar -c /tmp/c.jar -i -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode 'identifier=admin@sensei.local' \
  --data-urlencode 'password=admin1234' \
  --data-urlencode 'callbackUrl=http://localhost:3000/' \
  --data-urlencode 'json=true' \
  http://localhost:3000/api/auth/callback/credentials

# Follow the post-login redirect with the cookie jar.
curl -sS -b /tmp/c.jar -L -o /tmp/home.html -w 'HTTP %{http_code}\n' http://localhost:3000/
grep -c '<html\|<body' /tmp/home.html
grep -oE '<title>[^<]+</title>' /tmp/home.html
```

The `curl` flow gave me byte-level visibility into what the dev server
was actually returning, independent of any client-side React state.

## Root cause

Next.js 15 strictly enforces the invariant that the **root** `app/layout.tsx`
must render `<html>` and `<body>`. The previous next-intl pattern in
this repo placed those tags inside `src/app/[locale]/layout.tsx` and
let the root layout return bare `children`. That pattern was a
documentation-accepted warning in older Next versions and an
ignorable-in-dev warning in early Next 15. In the running 15.5.19, it
surfaces as a hard runtime error overlay the moment a soft navigation
(here: `router.push('/')` from the login form) triggers Next's layout
check.

Next.js docs page:
<https://nextjs.org/docs/messages/missing-root-layout-tags>.

The fix (already applied in the conversation turn immediately before
this audit):

- `<html>` + `<body>` moved into [src/app/layout.tsx](../src/app/layout.tsx),
  with `lang={routing.defaultLocale}` and `suppressHydrationWarning` so
  the `/en/...` maintainer escape hatch can mutate `documentElement.lang`
  client-side without a hydration mismatch.
- [src/app/[locale]/layout.tsx](../src/app/[locale]/layout.tsx) keeps only
  the i18n provider, the skip link, and the lang setter.
- New [src/components/providers/html-lang-setter.tsx](../src/components/providers/html-lang-setter.tsx)
  syncs `document.documentElement.lang` post-hydration.

## Live evidence collected during this audit

| Request                               | Cookie  | HTTP                                    | Notes                                                                                                     |
| ------------------------------------- | ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /`                               | none    | 307 → `/login?next=%2F`                 | middleware redirects unauth users correctly                                                               |
| `GET /login`                          | none    | 200, 30 454 B                           | `<html>` + `<body>` both present; title `Iniciar sesión · Sensei Modern`                                  |
| `GET /es/login`                       | none    | 307                                     | next-intl `as-needed` strips the default-locale prefix                                                    |
| `POST /api/auth/callback/credentials` | csrf    | 302 → `/`                               | `authjs.session-token` cookie set                                                                         |
| `GET /`                               | session | 200, 72 784 B                           | `<title>Tablero · Sensei Modern</title>`, skip link present, **no** "Missing root layout" string anywhere |
| `GET /members`                        | session | 200, 69 075 B                           | title `Miembros · Sensei Modern`                                                                          |
| `GET /login`                          | session | 200 → after fix, 307 to `/` (or `next`) | see "Other issues" below                                                                                  |
| `GET /api/health`                     | none    | 200                                     | health check OK                                                                                           |

The original symptom is unreproducible against the live server.

## Files inspected

- `src/app/layout.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/error.tsx`
- `src/app/[locale]/not-found.tsx`
- `src/app/[locale]/(auth)/layout.tsx`
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/app/[locale]/(auth)/login/login-form.tsx`
- `src/app/[locale]/(app)/layout.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/health/route.ts`
- `src/lib/auth.ts`
- `src/middleware.ts`
- `src/i18n/routing.ts`
- `src/components/providers/html-lang-setter.tsx`
- `src/components/nav/sidebar.tsx`, `top-bar.tsx`, `mobile-nav-trigger.tsx`, `bottom-nav.tsx`
- `scripts/seed.ts`
- `package.json`, `next.config.ts`, `pnpm-lock.yaml`

## Files changed during this audit

| File                                     | Change                                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/app/global-error.tsx`               | New defensive boundary. Owns its own `<html>` / `<body>`. Spanish copy. Renders when an error escapes the root layout itself. |
| `src/app/not-found.tsx`                  | New root-level 404 server component for paths outside `[locale]`. Spanish copy.                                               |
| `src/app/[locale]/(auth)/login/page.tsx` | Already-authenticated users now `redirect()` to `next` (sanitized) or `/` instead of seeing the form again.                   |
| `docs/debugging-login-runtime-audit.md`  | This document.                                                                                                                |

No changes were made to the database, Docker containers, or
`.env.local`.

## Other issues discovered during the audit

1. **Authenticated users could still see `/login`.** Live probe with a
   valid session returned 200 and re-rendered the form. Fixed by an
   `auth()` check + `redirect()` early-return in the login page. The
   `next` param is sanitized (must start with `/`, must not start with
   `//`) to prevent open-redirect abuse.
2. **No `global-error.tsx` or root-level `not-found.tsx`.** Both were
   absent. With the root layout now correctly owning `<html>` / `<body>`,
   they are no longer load-bearing for the original symptom, but they
   exist now so:
   - Catastrophic errors that bypass `[locale]/layout.tsx` get a
     branded Spanish error page instead of a generic Next stack trace.
   - Top-level paths that don't match any segment get a clean 404
     instead of falling back to Next's default behavior.
3. **Three Radix peer dependencies are unused** in `src/`:
   `@radix-ui/react-dropdown-menu`, `@radix-ui/react-toast`,
   `@radix-ui/react-label`. Not a runtime risk; defer to a polish PR.
4. **Several `Link href={... as never}` casts** in
   `src/app/[locale]/(app)/members/*` are a workaround for next-intl
   not declaring a `Pathnames` map alongside Next's `typedRoutes`. Not
   a runtime risk; defer to a polish PR that introduces a `Pathnames`
   declaration in `src/i18n/routing.ts`.
5. **Middleware locale prefix is hardcoded** to `/en` in
   `src/middleware.ts`: `pathname.startsWith('/en') ? '/en' : ''`. Fine
   for the Spanish-only product but will silently break if more
   locales are added. Acceptable given the
   [`context/language-and-locale.md`](../context/language-and-locale.md)
   constraints.

## Verification commands run

Read-only or write-only-to-`.next/types`. No data, Docker, or dev
server was disturbed.

| Command                           | Result                          |
| --------------------------------- | ------------------------------- |
| `pnpm typecheck`                  | ✓ pass                          |
| `pnpm lint`                       | ✓ pass (no warnings, no errors) |
| `pnpm test` (vitest)              | ✓ pass, 21 / 21                 |
| `curl` smoke matrix (table above) | ✓ all expected codes            |

`pnpm build` was **deliberately not run** during this audit because it
overwrites `.next/` while the dev server is reading from it. A full
build was last run and passed in the conversation turn before this
audit. After restarting the dev server, run `pnpm build` again to
re-confirm production output.

Playwright (`pnpm e2e`) was **not** run because it would open headed
browsers and the user did not ask for it. The Playwright config has
been updated previously to include `chromium`, `ipad-11`, and
`iphone-14` projects, all of which would reuse the running dev server
via `reuseExistingServer: true`.

## Remaining risks / follow-ups

- A future contributor placing `<html>` / `<body>` in
  `[locale]/layout.tsx` again would re-introduce the original bug. The
  pattern is now documented in code comments in
  `src/app/layout.tsx` and `src/app/[locale]/layout.tsx`. Consider
  promoting that note into `AGENTS.md` if the repo grows.
- The `next-intl` `localePrefix: 'as-needed'` + `localeDetection: false`
  combination is the right call for a Spanish-only customer UI, and
  the `HtmlLangSetter` component is the supported escape hatch for
  `/en/...` QA navigation. Do not change either without re-reading
  [`context/language-and-locale.md`](../context/language-and-locale.md).
- The unused Radix peers and `as never` casts are tracked above as
  polish PR candidates.

## Manual checks for the user

1. Hard-refresh the open browser tab on `http://localhost:3000` to
   evict any cached client bundle (the dev server has been
   hot-reloading layouts but a hard refresh is safer).
2. Log in with `admin@sensei.local` / `admin1234`.
3. Confirm the dashboard renders (title bar shows "Tablero · Sensei
   Modern") and the sidebar / bottom nav are visible.
4. Navigate to "Miembros" — list and detail should render normally.
5. Try `http://localhost:3000/login` directly while authenticated;
   the browser should land on `/` instead of the login form.

If anything still looks off, restart the dev server (`Ctrl-C` then
`pnpm dev`) once. Layout-file changes occasionally need a fresh
process to flush all the cached chunks Next holds in memory.

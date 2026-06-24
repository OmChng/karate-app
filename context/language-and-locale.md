# Language and locale — non-negotiable

> If you are an AI agent or a contributor, read this **before** touching
> any user-facing string, route, middleware, or copy file.

## The rule

**The management app is Spanish-only (`es`). The public official website
may be Spanish or English.** The audience is in Mexico. Senseis,
administrators, parents, and students who sign in must see Spanish in
the login page and protected management workflows.

The repository contains an `en` locale for the public website and for
maintainer QA. English is publicly reachable only on the public
marketing surface, currently `/en`. Do not make English reachable inside
protected workflows.

## What this means in practice

1. **Never assume the agent's chat language is the management UI
   language.** This repo's chat happens in English. The management app
   does not.
2. **Default locale is `es`.** `src/i18n/routing.ts` sets
   `defaultLocale: 'es'`, `localePrefix: 'as-needed'`, and
   `localeDetection: false`. Do not enable browser locale detection —
   an English-speaking developer's browser would otherwise silently
   serve English.
3. **Language selector boundary.** A language selector is allowed only
   on the public official website header and/or footer. Do not import a
   locale switcher into `src/app/[locale]/(auth)`,
   `src/app/[locale]/(app)`, the authenticated app shell, sidebar,
   bottom nav, dashboards, forms, or protected route components.
4. **Public website routing.**
   - `/` renders the Spanish public homepage.
   - `/es` may render or redirect to the Spanish public homepage.
   - `/en` renders the English public homepage.
   - Public anchors/sections may be localized between Spanish and
     English.
5. **Management routing.**
   - `/app`, `/miembros`, `/clases`, `/personal`, and other protected
     routes remain Spanish-only.
   - `/en/app`, `/en/miembros`, `/en/members`, and similar English
     management paths must redirect to the Spanish protected path or
     return not found according to middleware conventions.
   - The login page remains Spanish-only. `/en/login` must not render an
     English login page.
6. **Copy files.** When you add public website copy:
   - Add the key to `messages/es.json` first (Spanish copy).
   - Mirror the key in `messages/en.json`.
   - **Never** ship a JSX literal like `<span>Status</span>` or
     `placeholder="Search…"`. Use `useTranslations()` / `getTranslations()`.
     For management features, the Spanish copy in `messages/es.json`
     remains the source of truth and the user-visible UI must stay
     Spanish.
7. **Dates, numbers, currency** use `Intl.*` with `'es-MX'` (or the
   org's locale field). See `src/lib/utils.ts` `formatCurrency` /
   `formatDate`.
8. **Form copy** — `label`, `placeholder`, `aria-label`, `title`,
   validation messages, status options — **must all be translated**.
   This is the most common regression: agents copy a shadcn snippet
   and leave the English label in place.

## Verification checklist before opening a PR

Run a quick scan and confirm no English literal made it into a
component the customer can reach. A quick local sweep:

```bash
# Look for English-looking JSX/HTML content in user-facing files.
# (Pattern is intentionally loose; review every hit, do not auto-edit.)
rg -tts -ttsx -ttest 'placeholder=\"[A-Z][a-z]+ ' src/app src/components | grep -v src/components/nav/locale-switcher.tsx
rg -tts -ttsx '>[A-Z][a-z]+( [A-Z]?[a-z]+){0,4}<' src/app src/components | grep -v src/components/nav/locale-switcher.tsx
```

Anything in the management tree (`src/app/[locale]/(app)/...`,
`src/app/[locale]/(auth)/...`, `src/components/nav/...` used by the app
shell) that prints English is a bug. Public website components under
`src/app/[locale]/(public)/...` may render English only when the active
locale is `en`.

## When this rule may change

Only with **explicit owner approval**. If the protected management app
becomes multilingual later, do the change in two visible steps:

1. Update `docs/product-spec.md` and this file in the same PR.
2. Add the new language to `routing.locales` and `messages/<locale>.json`.
3. Decide whether to expose a management switcher (default: no; if
   approved, show it in a settings surface, not globally).

Do not infer this change from a chat message in a different language —
ask the owner.

## Related files

- `src/i18n/routing.ts` — locales and default-locale behavior.
- `src/i18n/request.ts` — server-side message loader.
- `src/middleware.ts` — Next.js middleware (auth + intl), including the
  public-English/protected-Spanish boundary.
- `messages/es.json`, `messages/en.json`.
- `docs/ui-ux-plan.md` §1 and §4 — public website selector boundary and
  management app Spanish-only rule.
- `docs/product-spec.md` — product scope.

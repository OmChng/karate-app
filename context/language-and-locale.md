# Language and locale — non-negotiable

> If you are an AI agent or a contributor, read this **before** touching
> any user-facing string, route, middleware, or copy file.

## The rule

**This product is Spanish-only for end users.** The audience is in
Mexico. Every screen a customer can reach must render in Spanish (`es`).

The repository contains an `en` locale, but it is a **maintainer-only
escape hatch** for QA. It is never advertised, never linked, and never
shown to end users.

## What this means in practice

1. **Never assume the agent's chat language is the product's UI
   language.** This repo's chat happens in English. The product does
   not.
2. **Default locale is `es`.** `src/i18n/routing.ts` sets
   `defaultLocale: 'es'`, `localePrefix: 'as-needed'`, and
   `localeDetection: false`. Do not enable browser locale detection —
   an English-speaking developer's browser would otherwise silently
   serve customers `/en/...`.
3. **No language switcher in the customer UI.** A
   `src/components/nav/locale-switcher.tsx` file exists but **must not
   be imported** by any user-facing layout, top bar, or footer. It
   remains in-tree solely so future product decisions (e.g. a
   settings-page toggle) can wire it back without re-implementing.
4. **All user-visible strings live in `messages/es.json`.** When you
   add a feature:
   - Add the key to `messages/es.json` first (Spanish copy).
   - Mirror the key in `messages/en.json` for parity, but treat it as
     secondary; the Spanish copy is the source of truth.
   - **Never** ship a JSX literal like `<span>Status</span>` or
     `placeholder="Search…"`. Use `useTranslations()` / `getTranslations()`.
5. **Dates, numbers, currency** use `Intl.*` with `'es-MX'` (or the
   org's locale field). See `src/lib/utils.ts` `formatCurrency` /
   `formatDate`.
6. **Form copy** — `label`, `placeholder`, `aria-label`, `title`,
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

Anything in the customer-facing tree (`src/app/[locale]/(app)/...`,
`src/app/[locale]/(auth)/...`, `src/components/...` minus the
locale-switcher file) that prints English is a bug.

## When this rule may change

Only with **explicit owner approval**. If the org expands to a
non-Spanish-speaking dojo, do the change in two visible steps:

1. Update `docs/product-spec.md` and this file in the same PR.
2. Add the new language to `routing.locales` and `messages/<locale>.json`.
3. Decide whether to expose a switcher (default: no; show it in
   `/settings/profile` only).

Do not infer this change from a chat message in a different language —
ask the owner.

## Related files

- `src/i18n/routing.ts` — the routing config with the explanatory
  block-comment for future agents.
- `src/i18n/request.ts` — server-side message loader.
- `src/middleware.ts` — Next.js middleware (auth + intl). Do not pass
  in custom locale detection.
- `messages/es.json`, `messages/en.json`.
- `docs/ui-ux-plan.md` §1 and §4 — Spanish-only emphasized at the
  design-system level.
- `docs/product-spec.md` — product scope.

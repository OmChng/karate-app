# AGENTS.md

Instructions every AI agent and contributor must follow when working on
**Sensei Modern** (this project).

## Hard rules — do not violate without explicit owner approval

1. **The management app is Spanish (`es`) only; the public website may
   be Spanish or English.**
   - The audience is Mexican. The login page, authenticated management
     routes, app shell, sidebar, bottom nav, dashboards, forms, and
     protected workflows must remain Spanish-only.
   - The public official website may expose a Spanish/English selector
     and may render public marketing content in `/en`.
   - Never add a language selector to the login page or authenticated
     management UI.
   - `src/i18n/routing.ts` sets `defaultLocale: 'es'` with
     `localeDetection: false`. Do not flip these.
   - Public website strings come from `messages/es.json` and
     `messages/en.json`; management strings come from `messages/es.json`
     via `useTranslations()` / `getTranslations()` — never JSX
     literals.
   - Full details and the verification checklist:
     [`context/language-and-locale.md`](context/language-and-locale.md).
   - The chat conversation may happen in English. **Do not infer
     management UI language from the chat language.**

2. **The product must work flawlessly on phone, tablet, and desktop —
   with tablet (iPad portrait, 768–834 px) as the primary teacher
   device.** See `docs/ui-ux-plan.md` §1, §4, §8. Touch targets ≥ 44 px;
   inputs `text-base` to prevent iOS zoom; `viewport-fit: cover` so the
   bottom nav clears iPhone home indicators.

3. **Never hardcode, commit, log, or store credentials.** Real secrets
   live only in `.env.local` (gitignored). Use `.env.example` for
   placeholders. Discovery scripts pull from env vars and never echo
   them.

4. **Treat the legacy app `sensei.gojukan.app` as production.** Don't
   mutate, message, or POST against it. The discovery script is
   read-only by design.

## Workspace conventions (inherited boilerplate, still in force)

- `inbox/` — raw material from the owner.
- `notes/` — working notes and intermediate thinking.
- `drafts/` — rough artifacts before they ship.
- `research/` — source notes, comparisons, summaries, discovery output.
- `outputs/` — final or polished deliverables.
- `context/` — project-specific persistent background (read first).
- `prompts/` — project-specific prompts.

## Expected workflow

1. Read `project.md` for the elevator pitch.
2. Read everything under `context/` for persistent background. The
   language rule in particular.
3. Read the relevant docs under `docs/` before touching architecture or
   the data model.
4. Process raw material from `inbox/` if any.
5. Capture intermediate reasoning in `notes/`.
6. Land polished work under `src/`, `docs/`, or `outputs/` as
   appropriate.

## Tech stack (don't change without proposing in a doc first)

- Next.js 15 App Router, TypeScript strict.
- PostgreSQL 16 + Drizzle ORM.
- Auth.js v5 (Credentials) + Argon2id + JWT sessions + RBAC.
- next-intl with `defaultLocale: 'es'`, `localeDetection: false`.
- Tailwind CSS + shadcn/ui (Radix-based).
- Vitest (unit) + Playwright (e2e, three projects: chromium,
  ipad-11, iphone-14).
- Docker Compose for Postgres + Mailhog locally.

## Before opening a PR

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

All four must be green. The Playwright projects are not required
locally but should pass in CI.

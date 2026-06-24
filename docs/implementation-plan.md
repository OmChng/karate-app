# Implementation plan — Sensei Modern

## 0. How to read this document

The plan is broken into **milestones**. Each milestone ships to `main`
behind a feature flag or as a small reviewable PR. Each task is sized so
Cursor can execute it in a single session.

| Status | Meaning                              |
| ------ | ------------------------------------ |
| ✅     | Shipped in this scaffold             |
| ⏳     | Next up                              |
| 🔒     | Blocked on a dependency or discovery |

## Milestone 0 — Discovery & analysis (this PR)

- ✅ Probe the legacy app's public surface, identify the template, stack,
  login flow, and likely route structure.
- ✅ Write the Phase 2–8 docs (`existing-app-analysis`,
  `performance-ux-analysis`, `product-spec`, `architecture`,
  `data-model`, `ui-ux-plan`, this file).
- ✅ Add a read-only Playwright discovery script
  (`scripts/discover.ts`).
- ⏳ Run discovery against the live legacy app and replace `[INFERRED]`
  sections with `[OBSERVED]` evidence.

## Milestone 1 — Foundation (this PR)

- ✅ Repo scaffolding: `package.json`, `tsconfig`, ESLint flat config,
  Prettier, `.editorconfig`, `.gitignore`, `.env.example`.
- ✅ Docker Compose: Postgres 16 + Mailhog. Dockerfile for the app.
- ✅ Next.js 15 App Router with strict TypeScript, Tailwind, shadcn/ui
  groundwork.
- ✅ Drizzle ORM, `drizzle.config.ts`, schema split per entity.
- ✅ Migrations script (`scripts/migrate.ts`) and seed script
  (`scripts/seed.ts`).
- ✅ Auth.js v5 with Credentials provider (email-or-phone), Argon2id
  hashing, DB sessions.
- ✅ RBAC helpers (`requireRole`, `withOrg`).
- ✅ Application shell: top bar, sidebar, breadcrumb, theme provider,
  404 + error boundaries.
- ✅ i18n with `next-intl`, Spanish + English message files, and a
  public-website-only language selector. The authenticated management
  shell remains Spanish-only.
- ✅ Members module end-to-end (list + detail + create + edit) as the
  reference layout.
- ✅ Vitest setup with sample unit tests (RBAC, phone/email
  normalization, member zod schema).
- ✅ Playwright config with one smoke spec.
- ✅ README with macOS + Windows + Docker setup.

## Milestone 2 — Dojos (next PR)

1. `dojo` schema migration (already shipped) → no-op if applied.
2. `src/db/queries/dojos.ts` with `listDojos`, `getDojo`, `createDojo`,
   `updateDojo`, `softDeleteDojo`.
3. Server actions `src/server/dojos/actions.ts` gated by
   `requireRole(['organization_admin'])`.
4. Pages: `/dojos` list, `/dojos/new`, `/dojos/[id]`,
   `/dojos/[id]/edit`.
5. Zod schemas + RHF form components.
6. Org switcher gains a "Default dojo" choice.
7. Audit log entries on every mutation.
8. Tests: unit + 1 Playwright spec ("admin creates dojo").

## Milestone 3 — Classes & instructors

1. `class`, `class_instructor` schema migration.
2. Weekly grid view (`/classes`) + create/edit forms.
3. Recurrence handling (RRULE → materialized occurrences on read).
4. Assign instructors UI (multi-select with role).
5. Rank prerequisite enforcement on attendance write.
6. Tests including a recurrence golden test.

## Milestone 4 — Attendance

1. `attendance` schema migration (already in v1).
2. `/attendance` route shows today's classes per instructor.
3. Class detail (`/classes/[id]`) shows the roster + roll-call UI.
4. Optimistic UI on present/late/absent/excused toggles.
5. Bulk "mark all present" with undo.
6. Audit log + server validation that user is assigned to the class.
7. Member detail "Attendance" tab queries `(member_id, date desc)`.
8. Tests: Playwright "instructor marks attendance" path, axe on the form.

## Milestone 5 — Ranks & promotions

1. `rank_definition`, `rank`, `promotion` schema migrations.
2. Org settings → "Ranks" page to manage the taxonomy (preseeded for
   Goju-Ryu).
3. Member detail "Ranks" tab shows history; "Promote" button creates a
   `promotion` row.
4. Promotion workflow inbox at `/promotions` for org/dojo admins.
5. Transactional approval: append `rank`, flip `is_current`, mark
   promotion approved — all in one Drizzle transaction.
6. Tests: model invariants (only one current rank per member).

## Milestone 6 — Payments

1. `payment` schema migration.
2. `/payments` ledger list with filters by dojo/member/period.
3. Member detail "Payments" tab.
4. CSV export.
5. Tests: numeric precision, currency formatting.

## Milestone 7 — Announcements & events

1. `announcement`, `event` schema migrations.
2. Compose UI (markdown / rich text limited).
3. Audience targeting (org / dojo / role).
4. Member dashboard widget shows the latest 3 announcements.
5. Email send via pg-boss queue.

## Milestone 8 — Reports

1. SQL-backed read models:
   - `attendance_pct_by_member_v` (materialized monthly).
   - `revenue_by_dojo_month_v`.
   - `overdue_payments_v`.
2. Reports page with date-range filters and CSV export.
3. Charts via Recharts (only on the reports page).

## Milestone 9 — Operational polish

1. Audit log viewer for org admin.
2. Session management (revoke session).
3. Password change + forced rotation hook.
4. Backup/restore docs.
5. OTLP exporter env wiring.
6. Lighthouse CI in pull-request checks.

## Milestone 10 — Migration from the legacy app

1. Run `pnpm discover:existing-app` against production.
2. Write `scripts/import-legacy.ts` keyed off the captured route/data
   shape.
3. Dry-run + diff report in `research/migration/`.
4. Real run with the org's go-live window.

## Risk register

| Risk                         | Likelihood | Impact | Mitigation                                                   |
| ---------------------------- | ---------- | ------ | ------------------------------------------------------------ |
| Drizzle migration footguns   | M          | M      | Migrations reviewed in PRs; staging env mirrors prod         |
| Spanish copy drift           | H          | L      | All copy in `messages/es.json`; copy-only PRs are reviewable |
| Belt taxonomy varies         | M          | M      | Per-org `rank_definition` table                              |
| Phone number formatting      | M          | L      | libphonenumber-js + canonical E.164                          |
| Payment provider scope creep | H          | H      | Out of v1                                                    |
| Multi-tenant data leak       | L          | H      | `withOrg` query helper + tests                               |

## Testing plan summary

| Layer          | Where                                      | What                                                          |
| -------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Unit           | `tests/unit/`                              | Pure functions: RBAC, zod schemas, normalizers                |
| Server actions | `tests/unit/` against in-memory or temp DB | Permission checks, audit log writes                           |
| E2E            | `tests/e2e/`                               | Login, members CRUD, attendance roll-call, promotion approval |
| A11y           | Playwright + axe-core (M4+)                | Per-route a11y assertions                                     |

## MVP acceptance criteria

See [`product-spec.md` §11](./product-spec.md#11-mvp-acceptance-criteria).

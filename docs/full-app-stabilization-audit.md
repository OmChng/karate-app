# Full App Stabilization Audit

## Session Metadata

- Date/time started: 2026-06-17 15:27 CST
- Last updated: 2026-06-19 13:50 CST
- Current branch: unavailable (`git branch --show-current` failed because this checkout is not a Git repository)
- Git status before changes: unavailable (`git status --short` failed because this checkout is not a Git repository)
- Package manager detected: pnpm (`packageManager: pnpm@9.15.0`, `pnpm-lock.yaml`)
- Next.js version: 15.5.19 installed (`package.json` declares `^15.1.0`)
- Runtime URL detected: `http://localhost:3000`
- Docker services observed: `sensei-postgres` on 5432 healthy; `sensei-mailhog` on 1025/8025 running
- Legacy discovery evidence: `research/discovery/raw/2026-06-18T04-59-11-398Z/` captured 60 authenticated pages from `sensei.gojukan.app`
- Latest follow-up: approved cyberpunk dark-first implementation using only `#D3381C`, `#FFFFFF`, `#B6BEE0`, `#613E9C`, black, and black/white-derived neutrals for the product UI. The pass preserved Spanish-only UI, light mode, katakana support, page motion, loading states, tablet/mobile usability, and non-destructive verification.

## 2026-06-19 Cyberpunk Dark-First Implementation Pass

### Scope

- Request: implement the approved dark-first, mobile-first, cyberpunk-inspired visual system and shell behavior.
- Approved palette: `#D3381C`, `#FFFFFF`, `#B6BEE0`, `#613E9C`, black, and black/white-derived neutrals only.
- Explicit constraint: no green, yellow, cyan, teal, orange, magenta, or other new hue families for UI/status semantics. Rank/belt colors are a separate domain-status system for the karate association and must keep their official belt colors.
- Runtime URL used: `http://localhost:3000`.
- Docker/database handling: no Docker service, database, migration state, seed data, or remote production data was reset or mutated.
- Aeonic check: no local Aeonic font files were found; the implementation kept the existing Inter/system fallback and documented that Aeonic was not added without licensed files.
- Product language: Spanish remained the customer-facing UI language.

### Root Cause

- The prior visual system still carried older brand tokens and semantic color assumptions, including green/yellow status mappings and a more traditional dashboard surface model.
- The shell did not fully enforce independent scrolling between navigation and main content.
- Page motion and loading primitives existed but needed stronger integration with the app shell and route verification.
- Some route smoke tests were parallelized in a way that made the App Router/RSC runtime appear unstable under concurrent authenticated crawls.

### Implementation Summary

- Rebuilt CSS variables and Tailwind aliases around the approved palette while keeping compatibility token names for existing components.
- Mapped operational variants to palette-compliant meanings:
  - `good` / `success`: periwinkle.
  - `risk` / `warning`: purple.
  - `critical` / `danger`: signal red.
  - `info`: periwinkle.
  - `special` / `accent`: purple.
- Updated sidebar behavior:
  - desktop/tablet sidebar uses `h-dvh`, fixed shell height, internal nav scroll, and independent main content scroll.
  - desktop sidebar can collapse into an icon rail with persisted local preference.
  - mobile uses an accessible off-canvas drawer with scroll containment.
- Updated app shell to prevent the sidebar from scrolling away with long pages.
- Updated table headers, row hover states, metric cards, status badges, absence badges, dashboard metrics, bottom navigation, and legacy module tone mapping to use palette-compliant shared variants.
- Preserved rank/belt visual indicators as official karate association status colors: white, white + yellow, yellow, orange, blue, green, soft brown, dark brown, and black. These are intentionally not normalized into the cyberpunk UI palette.
- Preserved katakana display with the Japanese-capable font stack through `text-katakana`.
- Replaced the page transition implementation with a safer keyed entry transition for App Router, keeping visible vertical motion without retaining stale RSC trees.
- Added/kept route-level loading primitives and ensured loading text remains in Spanish.
- Serialized Playwright smoke tests to avoid concurrent authenticated route crawls masking real stability with nondeterministic runtime noise.

### Files Changed

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/[locale]/(app)/layout.tsx`
- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(app)/classes/[id]/class-detail-client.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/motion/page-transition.tsx`
- `src/components/ui/metric-card.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/table-styles.ts`
- `src/components/ui/sheet.tsx`
- `src/components/legacy/module-page.tsx`
- `src/lib/member-visual-state.ts`
- `src/lib/rank-catalog.ts`
- `src/lib/rank-visuals.ts`
- `src/server/classes/queries.ts`
- `src/server/members/queries.ts`
- `messages/es.json`
- `messages/en.json`
- `tests/unit/member-schema.test.ts`
- `tests/e2e/smoke.spec.ts`
- `docs/full-app-stabilization-audit.md`

### Verification Results

- Static checks:
  - `pnpm typecheck`: passed.
  - `pnpm lint`: passed.
  - `pnpm test`: passed.
  - `pnpm build`: passed.
- Browser/runtime checks:
  - `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --project=chromium`: passed.
  - `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --project=ipad-11`: passed.
  - `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --project=iphone-14`: passed.
- Visual notes:
  - desktop dark dashboard, desktop dark alumnos, desktop light alumnos, collapsed desktop sidebar, tablet alumnos, and phone drawer were checked with screenshots.
  - No full-page horizontal overflow was observed at desktop, tablet, or phone widths.
  - The visible rank indicators on alumnos keep the official association belt colors; they are treated as domain data, not decorative UI tokens.

### Remaining Risks

- Aeonic could not be implemented until licensed local font files are provided.
- Collapsed sidebar preference is stored in `localStorage`; server-side/user-profile persistence remains a future enhancement.

## 2026-06-19 Red Surface Refinement Pass

### Scope

- Request: keep the red-sidebar brand identity, but make the large red surface deeper, calmer, more mature, and less visually aggressive.
- Additional requirement: avoid low-contrast colored text on colored surfaces, especially metric cards and semantic badges.
- Runtime URL used: `http://localhost:3000`, the already-running local app.
- Server/Docker handling: no duplicate dev server was started; no Docker/database service was stopped, rebuilt, wiped, reset, or reseeded.
- UI language: Spanish remained unchanged.

### Root Cause

- The prior dark-first pass used bright brand red `#D12128` as the full-height sidebar surface.
- `#D12128` works well for small actions and accents, but it creates too much visual pressure as a large navigation surface.
- Some colored components still used same-family colored text on same-family colored backgrounds, which passed in places but felt noisier than necessary.

### Red Scale Changes

- Added a mature red scale:
  - `brand-red-bright`: `#D12128`, still used for primary buttons, small accents, focus/highlight details, and active rails.
  - `brand-red-surface`: `#9F1C23`, used for the large sidebar surface.
  - `brand-red-deep`: `#7F151B`, used for sidebar depth and pressed/hover depth.
  - `brand-red-dark`: `#5F1115`, used for sidebar borders and dark red shadow/depth.
  - `brand-red-soft`: `#F3D0C8`, used for light red tinted surfaces that need ink text.
- Sidebar background now uses `brand-red-surface` into `brand-red-deep`, not bright `#D12128`.
- Primary buttons continue to use bright `#D12128`, but with white foreground because warm cream on bright red measured below WCAG AA for normal text.

### Foreground / Contrast Rules Applied

- Added explicit foreground tokens:
  - `ink-text`: `#111111` for light/tinted colored surfaces.
  - `cream-text`: `#FAE3AC` for deep red, deep navy, and dark editorial surfaces.
  - `white-text`: `#FFFFFF` for bright red primary actions.
- Light semantic badges and metric surfaces now use ink text.
- Dark semantic badges now use warm cream text on dark semantic backgrounds.
- Table headers remain deep navy with warm cream text.
- Sidebar inactive text uses warm cream variants on deep red; active nav uses ink text on warm cream.

### Metric Card Changes

- Metric cards remain semantically toned but no longer put green/amber/red text directly over green/amber/red fills.
- Light mode metric cards use a light semantic surface, matching border/accent, and ink text.
- Dark mode metric cards use an elevated charcoal surface with a semantic border/top accent and cream text.
- The numeric value now inherits the high-contrast foreground instead of forcing a same-family accent color.

### Runtime / Contrast Verification

- Generated `test-results/red-refinement-audit/contrast-audit.json` plus screenshots in `test-results/red-refinement-audit/`.
- Measured dark sidebar:
  - Background: `rgb(159, 28, 35)` (`#9F1C23`).
  - Text: `rgb(251, 235, 197)`.
  - Contrast: `6.68:1`.
- Active nav:
  - Background: `rgb(250, 227, 172)`.
  - Text: `rgb(17, 17, 17)`.
  - Contrast: `14.97:1`.
- Dark metric card:
  - Background: `rgb(29, 29, 27)`.
  - Text: `rgb(248, 232, 196)`.
  - Contrast: `13.93:1`.
- Dark table header:
  - Background: `rgb(1, 52, 79)`.
  - Text: `rgb(250, 227, 172)`.
  - Contrast: `10.37:1`.
- Dark success badge:
  - Background: `rgb(50, 68, 24)`.
  - Text: `rgb(250, 227, 172)`.
  - Contrast: `8.43:1`.
- Light success badge:
  - Background: `rgb(223, 239, 200)`.
  - Text: `rgb(17, 17, 17)`.
  - Contrast: `15.57:1`.
- Bright primary button:
  - Background: `rgb(209, 33, 40)`.
  - Text: `rgb(255, 255, 255)`.
  - Contrast: `5.30:1`.
- Visual screenshots reviewed: dark Inicio, dark Alumnos, dark Clientes, and light Inicio.

### Static / Browser Verification

| Command             | Result | Evidence                                                                                    |
| ------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | Pass   | `tsc --noEmit` clean                                                                        |
| `pnpm lint`         | Pass   | `eslint .` clean                                                                            |
| `pnpm test`         | Pass   | 5 files, 38 Vitest tests passed                                                             |
| `pnpm format:check` | Pass   | Prettier reported all matched files formatted                                               |
| `pnpm build`        | Pass   | Ran in temp copy excluding `.env`/`.env.local`; compiled 55 pages                           |
| Playwright smoke    | Pass   | `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --workers=1`: 12 passed, 9 expected skips |

### Files Changed In This Pass

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/metric-card.tsx`
- `tests/e2e/smoke.spec.ts`
- `docs/full-app-stabilization-audit.md`

### Remaining Recommendations

- Keep `#D12128` out of large surfaces; use it for buttons, rails, focus, and small brand moments.
- Continue validating foreground based on actual background depth: ink on light tints, cream/white on deep surfaces.
- Promote the contrast audit into a small permanent Playwright assertion if the client-winning visual system becomes a release gate.

## 2026-06-19 Dark-First Visual System Pass

### Scope

- Request: replace the weak/neutral visual result with a bold, memorable, dark-first GOJU-KAN / Sensei identity that can help win a client.
- Primary design direction: dark editorial base, strong brand-red left navigation, deep-navy table/system surfaces, warm-cream text/accent hierarchy, semantic green/amber/red operational states.
- Language constraint: customer-facing UI remains Spanish; no customer-facing English strings were introduced.
- Runtime URL used: `http://localhost:3000`, the already-running local app.
- Server/Docker handling: no duplicate dev server was started; no Docker/database service was stopped, rebuilt, wiped, reset, or reseeded.
- Git status: still unavailable because this checkout is not a Git repository.

### Root Cause

- The prior color pass made the UI too neutral: the palette existed in tokens but the product read as mostly grayscale with restrained accents.
- The sidebar active state was too subtle for a brand-critical navigation surface.
- Metric cards had enough semantic data but needed stronger, internally homogeneous tone treatments.
- Table headers were visually correct but not distinctive enough as GOJU-KAN system surfaces.
- Dark mode had to be treated as the primary designed experience rather than a variant of light mode.
- Reduced-motion support removed practical movement duration, but the initial page-transition animation name still appeared through cascade ordering; this was fixed with an explicit final reduced-motion override.
- Aeonic could not be enabled because no Aeonic files or approved local font assets were found outside ignored/generated/research directories; per owner follow-up, the Latin UI stack uses Inter instead.

### Design/System Changes

- Rebuilt semantic CSS variables in `src/app/globals.css` around:
  - `brand-red` / `primary`: `#D12128`
  - `deep-navy`: `#01344F`
  - `warm-cream`: `#FAE3AC`
  - `ink-black`: `#151515`
  - `charcoal`: `#1D1D1B`
  - `soft-gray`: `#8F8A80`
  - preserved semantic success, warning, danger, info, and accent scales.
- Made dark mode the default and primary theme in the early theme script and provider fallback.
- Preserved light mode with warm off-white surfaces and the same red sidebar identity.
- Converted the desktop sidebar, tablet rail, and mobile sheet to a strong red brand surface.
- Active navigation now uses warm-cream active background, deep-navy rail/border, and high contrast text.
- Bottom mobile nav now avoids red icons on red active backgrounds; active icons inherit the foreground color.
- Metric cards now use homogeneous tone variants (`neutral`, `brand`, `primary`, `success`, `warning`, `danger`, `info`, `accent`) so border, background, number, and accent come from the same family.
- Table headers now use a deep-navy branded treatment with warm-cream text through the shared table header variant.
- Student absence/status badges continue to use shared semantic variants:
  - `0 faltas` -> success green.
  - `1 falta` -> warning amber.
  - `2-4 faltas` -> strong warning amber.
  - `5+ faltas` -> danger red.
  - `Activo` -> success; `Baja temporal` -> warning; `Baja permanente` -> danger; `Recuperación` -> accent; `Enfermo` -> warning strong.
- Katakana text uses the dedicated Japanese font stack via `.text-katakana` / `font-japanese`.
- Latin UI text uses `--font-latin: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`; Aeonic is not used because no licensed Aeonic asset is available in this checkout and Inter is the requested fallback.
- Page motion remains scoped to the main content area with `PageTransition`; sidebar/topbar remain stable.
- `prefers-reduced-motion` now explicitly disables page-transition animation and translate movement.
- Existing loading components remain in place: `PageLoading`, `SectionLoading`, `InlineSpinner`, `ButtonSpinner`, `TableSkeleton`, `CardSkeleton`, `LoadingWithElapsedTime`.

### Files Changed In This Pass

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/components/providers/theme-script.ts`
- `src/components/providers/theme-provider.tsx`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/mobile-nav-trigger.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/nav/top-bar.tsx`
- `src/components/ui/metric-card.tsx`
- `src/components/ui/table-styles.ts`
- `src/components/legacy/module-page.tsx`
- `messages/es.json`
- `messages/en.json`
- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `src/app/[locale]/(app)/members/member-form.tsx`
- `tests/e2e/smoke.spec.ts`
- `docs/full-app-stabilization-audit.md`

### Static Verification

| Command             | Result | Evidence                                                                                    |
| ------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | Pass   | `tsc --noEmit` clean after final CSS/test changes                                           |
| `pnpm lint`         | Pass   | `eslint .` clean                                                                            |
| `pnpm test`         | Pass   | 5 files, 38 Vitest tests passed                                                             |
| `pnpm format:check` | Pass   | Prettier reported all matched files formatted                                               |
| `pnpm build`        | Pass   | Ran in temp copy excluding `.env`/`.env.local`; compiled 55 pages                           |
| Playwright smoke    | Pass   | `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --workers=1`: 12 passed, 9 expected skips |

### Runtime / Visual Verification

- Full browser smoke verified login, invalid login, protected redirect, theme toggle, large-text persistence, authenticated route crawl, seeded student detail/edit, desktop nav click crawl, iPad shell, and iPhone shell.
- Visual audit generated `test-results/dark-first-audit/visual-audit.json` and screenshots under `test-results/dark-first-audit/`.
- Dark visual sample:
  - Body background: `rgb(21, 21, 21)`.
  - Body text: `rgb(250, 227, 172)`.
  - Sidebar background: `rgb(209, 33, 40)`.
  - Active nav background: `rgb(250, 227, 172)`.
  - Table header background on Alumnos/Clientes: `rgb(1, 52, 79)`.
  - Success badge background on Alumnos: `rgb(50, 68, 24)`.
  - Warning badge background on Alumnos: `rgb(81, 60, 21)`.
- Light visual sample:
  - Body background: `rgb(248, 241, 227)`.
  - Body text: `rgb(21, 21, 21)`.
  - Sidebar remains red: `rgb(209, 33, 40)`.
  - Table headers remain deep navy with warm cream text.
- Katakana verification:
  - Student list shows `フェルナンダ`.
  - Detail heading shows `Victoria Navarro Vargas - ビクトリア`.
  - Computed katakana font stack: `"Hiragino Sans", "Yu Gothic", YuGothic, "Noto Sans JP", Meiryo, sans-serif`.
- Motion verification:
  - Normal navigation observed page transition states: `exit` and `enter`.
  - Reduced-motion context computed `animationName: none`, `animationDuration: 0s`, and `transform: none`.
- Responsive verification:
  - Browser probes checked `/`, `/miembros`, and `/clientes` at 360, 390, 430, 768, 834, 1024, 1180, and 1280 px.
  - No console errors and no accidental horizontal overflow were detected.
  - Manual screenshot inspection covered dark desktop Inicio/Alumnos/Clientes, light Inicio, dark mobile Alumnos, and dark tablet Alumnos.

### Remaining Risks / Recommendations

- Inter is the active Latin UI font. Aeonic remains unused unless the owner explicitly provides licensed local files and asks to switch away from Inter.
- The visual audit script was run as an ad hoc validation command; consider promoting the most important assertions into Playwright tests if this style must be guarded in CI.
- Keep rejecting hardcoded surface/text/status colors in component reviews. Use semantic tokens and shared variants only.
- Add a design review checklist for dark mode, tablet/mobile, `prefers-reduced-motion`, and semantic status color regressions.
- If table density grows substantially, add dedicated responsive table/card variants per module rather than per-page one-off CSS.

## App Structure Summary

- Router model: Next.js App Router.
- Active app directory: `src/app`.
- Pages Router: not present (`app/`, `pages/`, and `src/pages/` are absent outside `src/app`).
- Locale routing: `src/app/[locale]` with `next-intl`; default locale is Spanish (`es`) and locale prefix is as-needed.
- Customer-facing URLs are Spanish through `src/i18n/routing.ts`; source folder names and internal typed route keys remain in English for framework consistency.
- Route groups: `(auth)` for public auth pages and `(app)` for protected application pages.
- Middleware: `src/middleware.ts` combines auth-aware routing with next-intl routing.
- Auth: Auth.js v5 Credentials provider with JWT sessions and RBAC helpers.
- ORM/database: Drizzle ORM with PostgreSQL 16, migrations under `drizzle/`, schema under `src/db/schema/`.
- Tests: Vitest unit tests and Playwright E2E smoke tests with Chromium, iPad 11, and iPhone 14 projects.
- Legacy parity approach: the modern app now keeps the legacy product IA visible in Spanish while mapping legacy PHP surfaces to Next.js routes.

## Layout / Boundary Audit

- `src/app/layout.tsx` is the true root layout and includes `<html>` and `<body>`.
- `src/app/global-error.tsx` includes its own `<html>` and `<body>`, as required because it replaces the root layout.
- Nested layouts under `src/app/[locale]`, `(auth)`, and `(app)` do not duplicate document tags.
- Global CSS is imported only from `src/app/layout.tsx`.
- The original "Missing `<html>` and `<body>` tags in the root layout" issue was already fixed before this continuation and remains verified by successful `pnpm build`.

## Route Inventory

| Route                     | Source file                                               | Protected?    | Expected behavior                                                                                                                            | Runtime checked? | Status | Notes                                                                                                |
| ------------------------- | --------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `/`                       | `src/app/[locale]/(app)/page.tsx`                         | Yes           | Inicio dashboard for signed-in users                                                                                                         | Yes              | Pass   | Verified in Playwright route crawl and nav crawl                                                     |
| `/login`                  | `src/app/[locale]/(auth)/login/page.tsx`                  | No            | Spanish login form, invalid login fails safely, valid dev login works                                                                        | Yes              | Pass   | Verified on Chromium, iPad, and iPhone                                                               |
| `/miembros`               | `src/app/[locale]/(app)/members/page.tsx`                 | Yes           | Alumnos list with photo, rank, age, class schedule, monthly absences, status, and page-size controls                                         | Yes              | Pass   | Also verified unauthenticated redirect; internal route key is `/members`                             |
| `/members/new`            | `src/app/[locale]/(app)/members/new/page.tsx`             | Yes           | New member form renders                                                                                                                      | Yes              | Pass   | Verified in authenticated route crawl                                                                |
| `/miembros/[id]`          | `src/app/[locale]/(app)/members/[id]/page.tsx`            | Yes           | Integral student profile with photo, rank color, dojo, profile/medical/contact fields, classes, exams, black-belt league, and action buttons | Yes              | Pass   | Dev runtime returns a soft 200 for `/members/not-a-uuid`, but the visible not-found boundary renders |
| `/miembros/[id]/editar`   | `src/app/[locale]/(app)/members/[id]/edit/page.tsx`       | Yes           | Student edit form including CURP, blood type, special care, and emergency phone                                                              | Yes              | Pass   | Verified from seeded member link                                                                     |
| `/members/transfers`      | `src/app/[locale]/(app)/members/transfers/page.tsx`       | Yes           | Legacy transfer request workflow shell                                                                                                       | Yes              | Pass   | New legacy-parity route                                                                              |
| `/instructors`            | `src/app/[locale]/(app)/instructors/page.tsx`             | Yes           | Staff list module                                                                                                                            | Yes              | Pass   | New legacy-parity route                                                                              |
| `/instructors/new`        | `src/app/[locale]/(app)/instructors/new/page.tsx`         | Yes           | Staff creation shell                                                                                                                         | Yes              | Pass   | New legacy-parity route                                                                              |
| `/instructors/[id]`       | `src/app/[locale]/(app)/instructors/[id]/page.tsx`        | Yes           | Staff detail shell                                                                                                                           | Yes              | Pass   | Checked with `/instructors/demo`                                                                     |
| `/clients`                | `src/app/[locale]/(app)/clients/page.tsx`                 | Yes           | Clientes module                                                                                                                              | Yes              | Pass   | New legacy-parity route                                                                              |
| `/rooms`                  | `src/app/[locale]/(app)/rooms/page.tsx`                   | Yes           | Salones module                                                                                                                               | Yes              | Pass   | New legacy-parity route                                                                              |
| `/rooms/[id]`             | `src/app/[locale]/(app)/rooms/[id]/page.tsx`              | Yes           | Room detail shell                                                                                                                            | Yes              | Pass   | Checked with `/rooms/demo`                                                                           |
| `/clases`                 | `src/app/[locale]/(app)/classes/page.tsx`                 | Yes           | Data-backed class list and create-class sheet with `L Mi V 7-8 pm` style schedules                                                           | Yes              | Pass   | Replaced legacy shell with real class UI                                                             |
| `/clases/[id]`            | `src/app/[locale]/(app)/classes/[id]/page.tsx`            | Yes           | Data-backed class roster with assign/remove students                                                                                         | Yes              | Pass   | Checked via seeded UUID from `/clases`                                                               |
| `/attendance`             | `src/app/[locale]/(app)/attendance/page.tsx`              | Yes           | Pase de lista module                                                                                                                         | Yes              | Pass   | Replaced scaffold stub with legacy-parity module                                                     |
| `/samples`                | `src/app/[locale]/(app)/samples/page.tsx`                 | Yes           | Pruebas module                                                                                                                               | Yes              | Pass   | New legacy-parity route                                                                              |
| `/exams`                  | `src/app/[locale]/(app)/exams/page.tsx`                   | Yes           | Exámenes module                                                                                                                              | Yes              | Pass   | New legacy-parity route                                                                              |
| `/ranks`                  | `src/app/[locale]/(app)/ranks/page.tsx`                   | Yes           | Compatibility route for exams/ranks                                                                                                          | Build only       | Pass   | Built successfully; not in visible legacy nav                                                        |
| `/black-belts`            | `src/app/[locale]/(app)/black-belts/page.tsx`             | Yes           | Liga de Cintas Negras module                                                                                                                 | Yes              | Pass   | New legacy-parity route                                                                              |
| `/plans`                  | `src/app/[locale]/(app)/plans/page.tsx`                   | Yes           | Planes module                                                                                                                                | Yes              | Pass   | New legacy-parity route                                                                              |
| `/reports`                | `src/app/[locale]/(app)/reports/page.tsx`                 | Yes           | Reporte module                                                                                                                               | Yes              | Pass   | Nav label changed to legacy singular "Reporte"                                                       |
| `/cash-register`          | `src/app/[locale]/(app)/cash-register/page.tsx`           | Yes           | Cajas / capture student payment module                                                                                                       | Yes              | Pass   | New legacy-parity route                                                                              |
| `/payments`               | `src/app/[locale]/(app)/payments/page.tsx`                | Yes           | Mensualidades module                                                                                                                         | Yes              | Pass   | Replaced scaffold stub with legacy-parity module                                                     |
| `/cutoff`                 | `src/app/[locale]/(app)/cutoff/page.tsx`                  | Yes           | Corte module                                                                                                                                 | Yes              | Pass   | New legacy-parity route                                                                              |
| `/expenses`               | `src/app/[locale]/(app)/expenses/page.tsx`                | Yes           | Gastos module                                                                                                                                | Yes              | Pass   | New legacy-parity route                                                                              |
| `/inventory`              | `src/app/[locale]/(app)/inventory/page.tsx`               | Yes           | Inventario module                                                                                                                            | Yes              | Pass   | New legacy-parity route                                                                              |
| `/settings`               | `src/app/[locale]/(app)/settings/page.tsx`                | Yes           | Configurar mi Dojo module                                                                                                                    | Yes              | Pass   | Replaced scaffold stub with legacy-parity module                                                     |
| `/dojos`                  | `src/app/[locale]/(app)/dojos/page.tsx`                   | Yes           | Dojo module                                                                                                                                  | Yes              | Pass   | Retained compatibility route                                                                         |
| `/announcements`          | `src/app/[locale]/(app)/announcements/page.tsx`           | Yes           | Protected scaffold page                                                                                                                      | Yes              | Pass   | Unlinked from customer nav; checked in authenticated route crawl                                     |
| `/events`                 | `src/app/[locale]/(app)/events/page.tsx`                  | Yes           | Protected scaffold page                                                                                                                      | Yes              | Pass   | Unlinked from customer nav; checked in authenticated route crawl                                     |
| `/api/health`             | `src/app/api/health/route.ts`                             | No            | Returns health JSON and DB status                                                                                                            | Yes              | Pass   | `200 OK`, DB up                                                                                      |
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts`                 | Auth endpoint | Auth.js providers, CSRF, and credentials callback                                                                                            | Yes              | Pass   | Valid and invalid login paths exercised                                                              |
| Unknown paths             | `src/app/not-found.tsx`, `src/app/[locale]/not-found.tsx` | Mixed         | Spanish not-found screen                                                                                                                     | Yes              | Pass   | Checked through malformed member route                                                               |

## Legacy Route Mapping

| Legacy page                                                                            | Modern route         |
| -------------------------------------------------------------------------------------- | -------------------- |
| `welcome.php`, `dojoStart.php`, `dojoDashboard.php`                                    | `/`                  |
| `dojoStaffs.php`                                                                       | `/instructors`       |
| `dojoNewStaff.php`                                                                     | `/instructors/new`   |
| `dojoStaff.php?token=`                                                                 | `/instructors/[id]`  |
| `dojoStudents.php`, `dojoStudents.php?scope=Todos`, `dojoStudents.php?scope=Inactivos` | `/members`           |
| `dojoStudentTransferRequests.php`                                                      | `/members/transfers` |
| `dojoRooms.php`                                                                        | `/rooms`             |
| `dojoRoomDetail.php?id=`                                                               | `/rooms/[id]`        |
| `dojoClasses.php`                                                                      | `/classes`           |
| `dojoClass.php?id=`                                                                    | `/classes/[id]`      |
| `dojoSamples.php`                                                                      | `/samples`           |
| `dojoExam.php?token=`                                                                  | `/exams`             |
| `dojoLCN.php`                                                                          | `/black-belts`       |
| `dojoPlans.php`                                                                        | `/plans`             |
| `dojoIncomeReport.php`                                                                 | `/reports`           |
| `dojoCashRegister.php`, `dojoRegisters.php`                                            | `/cash-register`     |
| `dojoFinances.php`, `dojoAccounts.php`                                                 | `/payments`          |
| `dojoCutoff.php`                                                                       | `/cutoff`            |
| `dojoAp.php`                                                                           | `/expenses`          |
| `dojoInventory.php`                                                                    | `/inventory`         |
| `dojoConfig.php`                                                                       | `/settings`          |

## Static Checks Run

| Command                       | Result | Notes                                                                             |
| ----------------------------- | ------ | --------------------------------------------------------------------------------- |
| `pnpm typecheck`              | Pass   | `tsc --noEmit` clean after square-palette nav/theme updates                       |
| `pnpm lint`                   | Pass   | `eslint .` clean after touched source and test files                              |
| `pnpm test`                   | Pass   | 5 files, 36 Vitest tests passed                                                   |
| `pnpm build`                  | Pass   | Next production build compiled and generated 55 pages after square-palette update |
| `pnpm db:migrate`             | Pass   | Applied `0004_member_detail_classes_black_belt`; no reset or reseed was performed |
| `pnpm db:seed`                | Pass   | Seed idempotente ejecutado; crea/actualiza 12 alumnos demo `CTR-R01` a `CTR-R12`  |
| `pnpm exec drizzle-kit check` | Pass   | Read-only Drizzle schema/config check passed                                      |
| `pnpm format:check`           | Pass   | All matched files use Prettier code style after mechanical formatting cleanup     |

## Runtime Checks Run

- HTTP/runtime probes:
  - `/iniciar-sesion`: 200 OK.
  - `/api/health`: 200 OK with DB up.
  - `/miembros`: unauthenticated user redirects to `/iniciar-sesion?next=%2Fmiembros`.
  - `/demo/alumnos/ctr-r01.svg`: 200 OK, confirms local demo avatar assets are served by the running app.
  - `/iniciar-sesion`: 200 OK after restarting the Next dev process following `pnpm build`.
  - `/iniciar-sesion`: 200 OK after final post-build Next dev restart.
- Auth workflow:
  - Login form renders in Spanish.
  - Invalid login shows safe Spanish error without client runtime errors.
  - Valid local seeded admin login reaches `Inicio`.
  - Authenticated users can navigate away from login into protected pages.
- Browser automation:
  - `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test --workers=1`
  - Final result: 12 passed, 9 expected skips.
  - Chromium route crawl covered `/`, `/personal`, `/miembros`, `/clientes`, `/salones`, `/clases`, `/pruebas`, `/examenes`, `/cintas-negras`, `/planes`, `/reporte`, `/cajas`, `/mensualidades`, `/corte`, `/gastos`, `/inventario`, `/configuracion`, `/pase-de-lista`, `/anuncios`, `/dojos`, and `/eventos`.
  - Chromium nav crawl clicked every visible primary navigation item and verified destination headings.
  - Chromium dynamic member crawl verified seeded detail/edit routes, profile sections, action buttons, data-backed class detail, and malformed member not-found UI.
  - Targeted Chromium member-detail smoke verified `CTR-R07` shows "Liga de Cintas Negras" and `CTR-R01` hides it.
  - Targeted Chromium theme smoke verified square-palette CSS tokens, dark/light persistence, and large-text persistence after reload.
  - iPad 11 and iPhone 14 projects verified login, protected redirect, responsive navigation shells, and touch-sized theme/text/sign-out controls.

## Issues Found

- Git metadata is unavailable in this workspace.
- The original root layout issue was already fixed; the pass confirmed it rather than changing it again.
- The prior implementation did not expose the full legacy app surface; several observed legacy sections were missing or parked under generic scaffold pages.
- The visible IA still used scaffold labels such as "Reportes" instead of the legacy product label "Reporte".
- The E2E smoke test was too narrow and had timeouts/selectors that did not scale to the expanded route surface.
- The member dynamic test could accidentally select create/transfer links instead of seeded member links.
- The Gojukan rank catalog in the database/seed data did not match the requested grade labels and colors.
- The rank color indicator in the Alumnos table was too small for quick scanning on tablet/mobile.
- The responsive finance-menu smoke helper did not assert the expanded state before checking nested finance links on iPad.
- The student detail page was too shallow and did not expose the requested profile, class, exam, or black-belt league surfaces.
- The class module was still a legacy-parity shell and did not allow teachers to create classes or assign students.
- `member_class_assignment` allowed only one active class per student; the requested model needs multiple active classes per student.
- The database lacked CURP, blood type, special care, emergency phone, and black-belt league result storage.
- The local seed did not include one example student for every requested Gojukan rank and did not attach visible avatar assets.
- The student detail page showed "Liga de Cintas Negras" for every student, including lower kyu ranks where it should not appear.
- Running `next build` while `next dev` was active left the dev server with stale `.next` chunk references; Next dev had to be restarted after build to restore runtime checks.
- The previous visual theme used generic red/slate tokens rather than the requested red/white/gray/light-olive/black palette.
- The red/white/gray/light-olive/black palette made `secondary` surfaces read too informal because olive was used across nav active states, hovers, table headers, skeletons, avatars, and badges.
- The top bar did not offer a persistent large-text mode for older senseis.
- Next App Router dev runtime serves the authenticated malformed member not-found path as a soft 200 while rendering the correct not-found UI.
- `pnpm format:check` initially reported broad repository formatting drift; the affected files were formatted and the check now passes.

## Bugs Fixed / Stabilization Changes

- Confirmed root layout and global error document structure.
- Replaced the narrow route smoke test with a broader authenticated route crawl, desktop nav crawl, seeded dynamic member check, and responsive shell assertions.
- Added a shared legacy module page renderer so legacy-parity sections have consistent tablet-friendly layouts and message-backed Spanish UI.
- Added modern protected routes for staff, clients, rooms, room detail, class detail, samples, exams, black belts, plans, cash register, cutoff, expenses, inventory, staff create/detail, and student transfers.
- Reworked existing scaffold routes for classes, attendance, payments, reports, settings, dojos, and ranks to use the legacy-parity module renderer.
- Updated primary and bottom navigation to match the observed legacy IA and keep tablet/mobile navigation focused.
- Updated Spanish message catalogs for the legacy IA; English remains a QA escape hatch and is not linked from customer UI.
- Added a transfer link from the Alumnos list.
- Hardened the E2E member selector and route-crawl timeouts.
- Added a shared Gojukan rank catalog and migration for 12 requested rank levels, including the white/yellow split belt and distinct brown/marrón colors.
- Enlarged the Alumnos rank color circle from 10 px to 16 px, then 25% more to 20 px, and switched to `background` so solid colors and the white/yellow gradient render correctly.
- Added unit coverage for rank ordering/colors and E2E coverage for the `8°/7° Kyu` rank on `/miembros`.
- Hardened the responsive finance-menu smoke helper to wait for the `Finanzas` menu to expand before checking `Cajas`.
- Applied a mechanical Prettier cleanup to the drifted files reported by `pnpm format:check`.
- Added a full student profile page with photo/avatar, student name, rank color dot, dojo, profile/medical/contact fields, active classes, exams, black-belt league results, notes, and action buttons.
- Added direct promotion, dojo transfer, status/baja, class assignment, and class removal server actions with audit logging and path revalidation.
- Added real class list/create/detail screens and a shared schedule formatter that renders classes as `L Mi V 7-8 pm`.
- Added database support for student profile fields, multiple active class assignments, and black-belt league results.
- Expanded the local seed to create/update 12 deterministic demo students, one per Gojukan rank, with CURP, date of birth, blood type, special care notes, emergency phone, contact fields, rank assignment, class assignment, and avatar file metadata.
- Added local SVG demo avatars under `public/demo/alumnos/` and excluded only those static demo assets from Prettier's repository-wide check because this Prettier setup has no SVG parser configured.
- Added a rank-access helper and used it to show the member-detail "Liga de Cintas Negras" section only for rank levels 7-12: café, marrón, Shodan-Ho, Nidan-Ho, Sandan-Ho, and Yondan-Ho.
- Added unit and E2E coverage for the conditional black-belt league visibility.
- Replaced global light/dark theme tokens with the requested Japanese palette: red, white, gray, light olive, and black, while preserving semantic status colors.
- Added a persistent large-text preference stored in `sensei-font-size`, applied early by the theme script with the `large-text` class to avoid hydration flicker.
- Added a top-bar icon button for large text next to the theme toggle and kept all top-bar actions at 44 px touch targets.
- Added E2E coverage for theme persistence, large-text persistence, and responsive touch target checks for the new control.
- Replaced the informal olive-dominant surfaces with a neutral Japanese-inspired system: red `#BC212E` as primary, neutral grays for broad surfaces, turquoise `#21BCAF` as focus ring, purple `#6221BC` as controlled accent, and green `#7CBC21` kept out of base UI surfaces.
- Updated sidebar, tablet rail, and phone bottom-nav active states to use neutral fills plus a restrained red indicator instead of large colored blocks.
- Added E2E token assertions so the primary, secondary, and ring values are guarded against palette regression.

## Files Changed

- `.prettierignore`
- `docs/existing-app-analysis.md`
- `docs/full-app-stabilization-audit.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/debugging-login-runtime-audit.md`
- `docs/implementation-plan.md`
- `docs/performance-ux-analysis.md`
- `docs/product-spec.md`
- `docs/ui-ux-plan.md`
- `README.md`
- `messages/en.json`
- `messages/es.json`
- `drizzle.config.ts`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/0004_member_detail_classes_black_belt.sql`
- `src/app/[locale]/(app)/attendance/page.tsx`
- `src/app/[locale]/(app)/black-belts/page.tsx`
- `src/app/[locale]/(app)/cash-register/page.tsx`
- `src/app/[locale]/(app)/classes/[id]/page.tsx`
- `src/app/[locale]/(app)/classes/[id]/class-detail-client.tsx`
- `src/app/[locale]/(app)/classes/classes-client.tsx`
- `src/app/[locale]/(app)/classes/page.tsx`
- `src/app/[locale]/(app)/clients/page.tsx`
- `src/app/[locale]/(app)/cutoff/page.tsx`
- `src/app/[locale]/(app)/dojos/page.tsx`
- `src/app/[locale]/(app)/exams/page.tsx`
- `src/app/[locale]/(app)/expenses/page.tsx`
- `src/app/[locale]/(app)/instructors/[id]/page.tsx`
- `src/app/[locale]/(app)/instructors/new/page.tsx`
- `src/app/[locale]/(app)/instructors/page.tsx`
- `src/app/[locale]/(app)/inventory/page.tsx`
- `src/app/[locale]/(app)/layout.tsx`
- `src/app/[locale]/(app)/members/new/page.tsx`
- `src/app/[locale]/(app)/members/[id]/edit/page.tsx`
- `src/app/[locale]/(app)/members/[id]/page.tsx`
- `src/app/[locale]/(app)/members/page.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `src/app/[locale]/(app)/members/member-form.tsx`
- `src/app/[locale]/(app)/members/transfers/page.tsx`
- `src/app/[locale]/(app)/payments/page.tsx`
- `src/app/[locale]/(app)/plans/page.tsx`
- `src/app/[locale]/(app)/ranks/page.tsx`
- `src/app/[locale]/(app)/reports/page.tsx`
- `src/app/[locale]/(app)/rooms/[id]/page.tsx`
- `src/app/[locale]/(app)/rooms/page.tsx`
- `src/app/[locale]/(app)/samples/page.tsx`
- `src/app/[locale]/(app)/settings/page.tsx`
- `src/components/legacy/module-page.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/nav/font-size-toggle-button.tsx`
- `src/components/nav/nav-items.ts`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/top-bar.tsx`
- `src/components/providers/theme-provider.tsx`
- `src/components/providers/theme-script.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/db/schema/black-belt-league-results.ts`
- `src/db/schema/index.ts`
- `src/db/schema/member-class-assignments.ts`
- `src/db/schema/members.ts`
- `src/db/schema/organizations.ts`
- `src/db/schema/payments.ts`
- `src/db/schema/promotions.ts`
- `src/db/schema/users.ts`
- `src/lib/class-schedule.ts`
- `src/lib/rank-access.ts`
- `src/lib/rank-catalog.ts`
- `src/server/classes/actions.ts`
- `src/server/classes/queries.ts`
- `src/server/classes/schemas.ts`
- `src/server/members/actions.ts`
- `src/server/members/queries.ts`
- `src/server/members/schemas.ts`
- `scripts/seed.ts`
- `public/demo/alumnos/ctr-r01.svg`
- `public/demo/alumnos/ctr-r02.svg`
- `public/demo/alumnos/ctr-r03.svg`
- `public/demo/alumnos/ctr-r04.svg`
- `public/demo/alumnos/ctr-r05.svg`
- `public/demo/alumnos/ctr-r06.svg`
- `public/demo/alumnos/ctr-r07.svg`
- `public/demo/alumnos/ctr-r08.svg`
- `public/demo/alumnos/ctr-r09.svg`
- `public/demo/alumnos/ctr-r10.svg`
- `public/demo/alumnos/ctr-r11.svg`
- `public/demo/alumnos/ctr-r12.svg`
- `drizzle/0003_gojukan_rank_catalog.sql`
- `drizzle/meta/_journal.json`
- `tests/e2e/smoke.spec.ts`
- `tests/unit/class-schedule.test.ts`
- `tests/unit/member-schema.test.ts`
- `tests/unit/rank-catalog.test.ts`
- `tests/unit/rbac.test.ts`
- `tsconfig.json`

## Verification Results

- Static app stability: format check, typecheck, lint, unit tests, build, migration, and Drizzle check pass.
- Browser stability: expanded Playwright smoke suite passed across Chromium, iPad, and iPhone with 12 passed and 9 expected skips.
- Targeted browser stability: `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "seeded member detail"` passed after the visibility change.
- Targeted theme/browser stability: `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "theme toggle"` passed after build and dev-server restart, including palette token assertions.
- Responsive browser stability: `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=ipad-11 --project=iphone-14 -g "tablet and phone shells"` passed.
- Root layout: verified by source audit and successful production build.
- Legacy parity: primary observed legacy surfaces are now represented by modern protected routes and Spanish navigation labels.
- Database/data access: Drizzle check passes; the Gojukan rank catalog and student detail/class/black-belt migrations are applied; seeded member list/detail/edit and class detail reads work in Playwright; no reset or reseed was needed.
- Seed verification: read-only SQL confirmed exactly one `CTR-R%` demo student for each rank level 1-12 and one linked avatar for each of those students.
- API/server actions: health route works; auth route handles valid and invalid credentials; member dynamic malformed IDs no longer crash runtime.

## Design System / Dark Mode Follow-Up - 2026-06-18 23:12 CST

### Cause Root

- The requested square palette was present as raw/decorative `palette-*` CSS, but not integrated as semantic UI decisions.
- Multicolor bars and alternating card accents made the interface feel decorative rather than premium.
- Several status badges used light-only Tailwind colors such as `bg-emerald-100`, `bg-amber-100`, `bg-red-100`, and `bg-blue-100`, which degraded dark-mode contrast.
- Drawer and login interactions could be clicked before client hydration under parallel Playwright load, producing flaky mobile/auth checks.

### Changes Applied

- Replaced decorative palette utilities with semantic tokens in `src/app/globals.css` and `tailwind.config.ts`:
  - `success`, `warning`, `danger`, `info`, plus foreground/muted/border variants.
  - `motion-fast`, `motion-normal`, `motion-slow`, `ease-standard`, and `ease-out`.
- Added `src/components/ui/status-badge.tsx` as the shared badge/status variant component with `neutral`, `success`, `warning`, `danger`, `info`, and `accent`.
- Migrated Alumnos list, student detail, and legacy module badges/metrics from local pastel color classes to semantic variants.
- Removed multicolor decorative rules from login, dashboard, top bar, bottom nav, and module headers.
- Kept the brand mark restrained and primarily red, using `#BC212E` as identity/action rather than showing all four palette colors at once.
- Added page content motion through `src/app/[locale]/(app)/template.tsx`, using a subtle fade/6px translate.
- Reworked sheet/drawer animation to use opacity/transform transitions instead of unavailable `animate-in/out` classes.
- Added `prefers-reduced-motion` handling to reduce non-essential animation globally.
- Hardened mobile controls:
  - Mobile menu button is disabled until hydration so it cannot be tapped before React handlers exist.
  - Tablet rail exposes the finance group by default while preserving the collapsible group semantics.
  - Login tests now wait for hydrated/enabled fields before submitting.

### Files Changed In This Follow-Up

- `docs/full-app-stabilization-audit.md`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/legacy/module-page.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/nav/font-size-toggle-button.tsx`
- `src/components/nav/mobile-nav-trigger.tsx`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/sign-out-button.tsx`
- `src/components/nav/theme-toggle-button.tsx`
- `src/components/nav/top-bar.tsx`
- `src/app/[locale]/(app)/template.tsx`
- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `tests/e2e/smoke.spec.ts`

### Verification In This Follow-Up

- `pnpm format:check`: Pass.
- `pnpm typecheck`: Pass.
- `pnpm lint`: Pass.
- `pnpm test`: Pass, 5 files / 36 tests.
- `pnpm build`: Pass, production build generated 55 pages.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium`: Pass, 6 passed / 1 expected skip.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=ipad-11 --project=iphone-14 -g "tablet and phone shells"`: Pass, 2 passed.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts`: Pass, 12 passed / 9 expected skips.
- Post-build runtime recovery: `pnpm build` invalidated the active dev server `.next` chunks, causing a temporary 500 for `/iniciar-sesion`; the broken Next dev process on port 3000 was restarted, and `/iniciar-sesion` returned `200 OK` again.
- `/api/health`: `200 OK` after build and dev-server recovery.

### Remaining Design Risks

- Several legacy-parity pages are still shell screens; they now inherit the refined tokens, but their future data-backed versions should use the shared badge/status variants from the start.
- The product still has brand text literals in navigation inherited from earlier work; future cleanup should route those through messages if they remain user-visible.
- There is no automated contrast scanner yet; current coverage relies on semantic tokens plus browser smoke checks.

## Motion System Follow-Up - 2026-06-18 23:22 CST

### Cause Root

- Route-level motion was implemented as a simple template fade/translate, so it did not model the requested vertical swipe direction or keep old content alive briefly for a controlled exit.
- Motion values existed only as a small set of CSS variables and Tailwind durations; page distances, page duration, instant duration, and entry/exit intent were not centralized.
- The previous page transition wrapper lived in `template.tsx`, which was enough for a basic entry animation but did not explicitly keep sidebar/topbar stable while animating only the route content.

### Changes Applied

- Added `src/components/motion/page-transition.tsx` as a small client wrapper for App Router content transitions, without adding Framer Motion or another dependency.
- Wrapped only the protected app `main` content container in `PageTransition`; `SidebarRail`, `SidebarDesktop`, `TopBar`, `BottomNav`, theme toggle, large-text toggle, and sign-out controls remain outside the animated page surface.
- Replaced the template-level transition wrapper with a fragment so there is a single app-page motion owner.
- Added route-depth direction logic:
  - deeper routes use a subtle forward entry from below and exit upward.
  - shallower routes use the inverse direction.
  - lateral section changes use a neutral vertical shift.
- Added a 120 ms exit and 220 ms entry sequence using opacity and `translateY`.
- Added restrained stagger for direct page content groups only; it does not animate individual long table rows.
- Added `prefers-reduced-motion` support in the JS wrapper and CSS layer so reduced-motion users skip route swipe/translate and list-style entry animation.
- Expanded semantic motion tokens in CSS and Tailwind:
  - `motion-instant: 80ms`
  - `motion-fast: 120ms`
  - `motion-normal: 180ms`
  - `motion-page: 220ms`
  - `motion-slow: 260ms`
  - `motion-y-small: 4px`
  - `motion-y-medium: 8px`
  - `motion-y-page: 12px`
  - `motion-y-large: 16px`
  - `ease-standard`, `ease-out`, and `ease-in`
- Refined microinteractions for main-content buttons, links, inputs, selects, textareas, cards, rounded panels, and table rows with short color/border/opacity/transform transitions.
- Added Playwright assertions for motion tokens and the page transition scope.

### Files Changed In This Follow-Up

- `docs/full-app-stabilization-audit.md`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/motion/page-transition.tsx`
- `src/app/[locale]/(app)/layout.tsx`
- `src/app/[locale]/(app)/template.tsx`
- `tests/e2e/smoke.spec.ts`

### Verification In This Follow-Up

- `pnpm format:check`: Pass.
- `pnpm typecheck`: Pass.
- `pnpm lint`: Pass.
- `pnpm test`: Pass, 5 files / 36 tests.
- `pnpm build`: Pass, production build generated 55 pages. The dev server was stopped before build and restarted after build to avoid the known active `.next` chunk conflict.
- Dev server restored: `pnpm dev` is running at `http://localhost:3000`.
- `curl -I -s http://localhost:3000/iniciar-sesion`: `HTTP/1.1 200 OK`.
- `curl -I -s http://localhost:3000/api/health`: `HTTP/1.1 200 OK`.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "theme toggle"`: Pass, verifies theme persistence plus motion token and page-transition wrapper assertions.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "desktop primary navigation"`: Pass.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=ipad-11 --project=iphone-14 -g "tablet and phone shells"`: Pass, 2 passed.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts`: 11 passed / 9 expected skips / 1 transient Chromium network failure on `/dojos` while the dev server was compiling multiple routes concurrently.
- Evidence for that transient failure: the dev server remained running and later served `GET /dojos 200`; isolated retry with `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "authenticated primary routes"` passed.

### Remaining Motion Risks

- The exit timing constants in `PageTransition` intentionally mirror CSS token values in TypeScript; keeping JS timers and CSS durations aligned should be part of future motion-token reviews.
- True browser back/forward intent is approximated by route depth, not by router history stack position, to avoid fragile App Router interception.
- Full parallel Playwright smoke against a cold `next dev` server can still be noisy while several routes compile at once; isolated retry confirmed the affected route is stable.

## Visual System / Loading / Katakana Follow-Up - 2026-06-19 10:10 CST

### Cause Root

- The app had a partial token system but lacked the complete semantic `subtle`/`border` layer requested for primary, success, warning, danger, info, and accent.
- Faltas del mes still collapsed into only green/yellow/red and could not represent the requested `2-4` warning-strong range.
- Student status variants were duplicated locally and did not consistently communicate positive/operational/problem states.
- Katakana did not exist in the member data model, so the UI could not display it correctly without a fake transliteration layer.
- Loading feedback was limited to one route `loading.tsx` skeleton; internal pending actions had text changes but no consistent spinner or delayed long-load feedback.
- Table headers and mobile/sidebar active states were still using older neutral or `primary/10` treatments instead of the refined semantic palette.

### Changes Applied

- Added semantic color tokens and Tailwind colors:
  - `primary-subtle`, `primary-subtle-foreground`, `primary-border`
  - `success-subtle`, `warning-subtle`, `warning-strong`, `danger-subtle`, `info-subtle`, `accent-subtle` and matching foreground/border tokens.
- Extended shared status variants with `warningStrong`.
- Added `getAbsenceLevel`, `getAbsenceVariant`, and `getStudentStatusVariant`.
- Updated absence rules:
  - `0` faltas: success
  - `1` falta: warning
  - `2-4` faltas: warningStrong
  - `5+` faltas: danger
- Mapped real member statuses:
  - Activo: success
  - Baja temporal: warning
  - Baja permanente: danger
  - Recuperación: accent
  - Enfermo: warningStrong
- Added nullable `member.first_name_katakana` with migration `0005_member_katakana`.
- Updated queries, create/update actions, member forms, edit/create pages, and seed data to carry `firstNameKatakana`.
- List view now shows katakana under the student name with secondary hierarchy; detail view shows `Nombre completo - Katakana`.
- Added reusable loading components: `InlineSpinner`, `ButtonSpinner`, `PageLoading`, `SectionLoading`, `CardSkeleton`, `TableSkeleton`, and `LoadingWithElapsedTime`.
- Replaced app route loading skeleton with `PageLoading`.
- Added delayed loading feedback to member filters/pagination and spinner feedback to login, save, promote, transfer, baja, class assignment, and class removal actions.
- Added shared table style utilities and applied themed headers to Alumnos, Clases, student history tables, and legacy module tables.
- Refined sidebar and bottom nav active states with `primary-subtle`, `primary-border`, primary icons, and visible focus rings.
- Increased neutral page-transition travel to make lateral route changes perceptible while keeping sidebar/topbar stable.

### Files Changed In This Follow-Up

- `docs/full-app-stabilization-audit.md`
- `drizzle/0005_member_katakana.sql`
- `drizzle/meta/_journal.json`
- `messages/en.json`
- `messages/es.json`
- `scripts/seed.ts`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/db/schema/members.ts`
- `src/server/members/actions.ts`
- `src/server/members/queries.ts`
- `src/server/members/schemas.ts`
- `src/lib/member-visual-state.ts`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/loading.tsx`
- `src/components/ui/table-styles.ts`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/legacy/module-page.tsx`
- `src/app/[locale]/(auth)/login/login-form.tsx`
- `src/app/[locale]/(app)/loading.tsx`
- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(app)/classes/classes-client.tsx`
- `src/app/[locale]/(app)/classes/[id]/class-detail-client.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/app/[locale]/(app)/members/member-form.tsx`
- `src/app/[locale]/(app)/members/new/page.tsx`
- `src/app/[locale]/(app)/members/[id]/edit/page.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `tests/e2e/smoke.spec.ts`
- `tests/unit/member-schema.test.ts`

### Verification In This Follow-Up

- `pnpm typecheck`: Pass.
- `pnpm lint`: Pass.
- `pnpm test`: Pass, 5 files / 38 tests.
- `pnpm db:migrate`: Pass; applied nullable katakana migration without reset or reseed.
- Read-only DB verification: `CTR-R07` has `ビクトリア`; `CTR-R09` has `フェルナンダ`.
- `pnpm format:check`: Pass after formatting the touched class-detail file.
- `pnpm exec drizzle-kit check`: Pass.
- `pnpm build`: Pass in a temporary copy of the workspace to avoid corrupting the active `next dev` `.next` directory.
- Runtime probes against active dev server:
  - `/iniciar-sesion`: `200 OK`.
  - `/api/health`: `200 OK`.
  - `/miembros`: `307` to login when unauthenticated, expected.
- Targeted Playwright:
  - Theme/motion token smoke: Pass.
  - Seeded member detail/edit smoke: Pass; verifies katakana, semantic badge classes, and detail title.
  - iPad/iPhone shell smoke: Pass.
- Full Playwright smoke: Pass, 12 passed / 9 expected skips.

### Remaining Visual Risks

- The katakana field is now modeled and editable, but only demo seed names are prefilled; real imported members need a source/import workflow for katakana.
- `LoadingWithElapsedTime` is in place for internal pending states, but most server-rendered route loads still rely on App Router route-level `loading.tsx`; future data-heavy sections should add narrower Suspense boundaries.
- Some legacy-parity pages still use static shell data; they inherit the visual system but will need data-backed loading/error states when real CRUD is added.

## Visible Palette Regression Pass - 2026-06-19 12:16 CST

### Cause Root

- The previous refinement made the UI too neutral: several semantic subtles were technically present but too pale to read as product identity.
- Some new semantic Tailwind classes were not materializing reliably in the already-running `next dev` session, so table headers could compute to transparent until a server restart.
- Legacy module cards rendered `item.status` badges as `accent` unconditionally, so statuses such as `Activo` did not always map to success.
- The Alumnos page-size select and tablet-horizontal member links had touch targets below 44 px at some breakpoints.

### Changes Applied

- Strengthened light/dark semantic tokens for `primary`, `success`, `warning`, `warningStrong`, `danger`, `info`, and `accent`, including `subtle`, `foreground`, `border`, `hover`, and ring tokens.
- Added explicit semantic CSS utilities for the critical token classes used by nav active states, table headers, status badges, metric cards, primary hovers, and row hovers. This makes the running dev session robust without restarting it.
- Added reusable `MetricCard` with semantic tones so dashboard and legacy metrics use visible, meaningful color instead of neutral cards.
- Updated dashboard metrics:
  - Miembros activos: success
  - Clases hoy: info
  - Asistencia esta semana: primary
  - Ingresos del mes: success
- Updated legacy module metric heuristics so Clientes, Staff, Salones, Pruebas, Exámenes, Liga de Cintas Negras, Finanzas, and Configuración inherit semantic metric color.
- Updated Clientes metrics so `Con adeudo` and `Sin contacto` use warning and `Clientes activos` uses success.
- Strengthened sidebar, rail, and mobile bottom-nav active states with visible `primary-subtle`, a 3 px primary rail/top border, primary icons, and active font weight.
- Kept the sidebar restrained: no full red sidebar, no per-item rainbow colors, no decorative gradients.
- Ensured shared table headers use `primary-subtle` and `primary-border` by default, with visible dark-mode red depth.
- Reused `statusVariantForCell()` for legacy card statuses so `Activo` maps to success instead of accent.
- Kept Alumnos semantic badges:
  - `0 faltas`: success
  - `1 falta`: warning
  - `2-4 faltas`: warningStrong
  - `5+ faltas`: danger
  - `Activo`: success
- Preserved Alumnos katakana display and `nombres apellidos` Spanish ordering in the list and detail heading.
- Raised the Alumnos page-size select to `min-h-11`.
- Kept member detail links at `min-h-11` through desktop while removing the button-like border/padding only at `xl`, so desktop can look denser without dropping below the 44 px touch target.

### Files Changed In This Follow-Up

- `docs/full-app-stabilization-audit.md`
- `messages/es.json`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/metric-card.tsx`
- `src/components/ui/table-styles.ts`
- `src/components/nav/sidebar.tsx`
- `src/components/nav/bottom-nav.tsx`
- `src/components/legacy/module-page.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`
- `src/app/[locale]/not-found.tsx`
- `src/app/[locale]/error.tsx`
- `src/app/[locale]/(auth)/login/login-form.tsx`
- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(app)/members/page.tsx`
- `src/app/[locale]/(app)/members/members-table.tsx`
- `src/app/[locale]/(app)/members/member-form.tsx`
- `src/app/[locale]/(app)/members/[id]/member-detail-client.tsx`
- `src/app/[locale]/(app)/classes/classes-client.tsx`
- `src/app/[locale]/(app)/classes/[id]/class-detail-client.tsx`
- `tests/e2e/smoke.spec.ts`

### Visual Runtime Verification

- Runtime URL: `http://localhost:3000`; existing dev server reused.
- Visual screenshots saved under `test-results/visual-color-audit/` and final samples under `test-results/visual-color-audit/final-samples/`.
- Browser console/runtime errors during visual crawl: none.
- Desktop light/dark visual crawl checked:
  - Inicio
  - Staff
  - Alumnos
  - Detalle de alumno
  - Clientes
  - Salones
  - Clases
  - Pruebas
  - Exámenes
  - Liga de Cintas Negras
  - Finanzas / Cajas
  - Configuración
- All visual-crawl routes returned HTTP 200 and reported no horizontal overflow.
- Computed color evidence:
  - Light active nav: `rgb(244, 215, 217)` with primary rail `rgb(210, 86, 96)`.
  - Dark active nav: `rgb(77, 26, 30)` with primary rail `rgb(207, 42, 56)`.
  - Light table headers: `rgb(244, 215, 217)`.
  - Dark table headers: `rgb(77, 26, 30)`.
  - Clientes success metric border: green `rgb(133, 188, 56)` light / `rgb(133, 199, 41)` dark.
  - Clientes warning metric border: amber `rgb(218, 158, 47)` light / `rgb(208, 148, 37)` dark.
  - Exámenes/Liga accent metric border: purple `rgb(138, 86, 210)` light / `rgb(113, 43, 212)` dark.
  - Info metric border: turquoise `rgb(56, 188, 177)` light / `rgb(41, 199, 186)` dark.
  - Alumnos `Activo` and `0 faltas`: success backgrounds in light/dark.
- Motion sample during real `/` -> `/clientes` navigation:
  - `exit` state observed with forward direction and `translateY` moving up.
  - `enter` state observed with forward direction from `translateY(12px)` to `0`.
  - Sidebar/topbar stayed outside the page transition wrapper.
- Responsive validation checked Inicio, Alumnos, Clientes, and Configuración at 360, 390, 430, 768, 834, 1024, 1180, and 1280 px.
- Final Alumnos touch-target validation: minimum visible main control height was 44 px at every measured breakpoint; no horizontal overflow.

### Static And E2E Verification

- `pnpm format:check`: Pass.
- `pnpm typecheck`: Pass.
- `pnpm lint`: Pass.
- `pnpm test`: Pass, 5 files / 38 tests.
- `pnpm build`: Pass in a temporary copy with `.env` and `.env.local` excluded and `SKIP_ENV_VALIDATION=1`, so the active dev server `.next` directory was not touched.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium --workers=1`: Pass, 6 passed / 1 expected skip.
- `PLAYWRIGHT_NO_SERVER=1 pnpm exec playwright test tests/e2e/smoke.spec.ts --project=ipad-11 --project=iphone-14 --workers=1`: Pass, 6 passed / 8 expected skips.

### Remaining Visual Risks

- The legacy-parity pages are still static shells for several business workflows, so their semantic color is representative but future data-backed states need to keep using shared badge/metric variants.
- The explicit semantic utility layer intentionally mirrors Tailwind token names to protect the running dev server from JIT refresh gaps; future token additions should update Tailwind and this utility layer together.
- Full parallel Playwright against `next dev` can time out while compiling multiple routes at once; final serial Chromium and responsive runs passed.

## Remaining Risks

- Many legacy-parity pages outside students/classes are still functional shells, not yet full CRUD/data-backed replacements for the legacy PHP workflows.
- Black-belt league results are now modeled and displayed per student, but result creation/import UI is still a future workflow.
- The captured legacy app had linked tournaments returning 404, so no tournament route was added.
- The authenticated malformed member route renders the expected not-found UI but returns HTTP 200 in Next dev runtime.
- Demo avatars are local SVG illustrations for development data, not uploaded real student photographs.
- Architecture docs still contain some old roadmap assumptions that may not match the now-expanded legacy parity route map.

## Follow-Up Recommendations

- Replace remaining legacy-parity shells with data-backed workflows in priority order: cash register/mensualidades/corte, attendance, staff, rooms, plans, inventory.
- Keep discovery read-only against `sensei.gojukan.app`; do not mutate the production legacy app.
- Preserve Spanish-only customer UI and do not reintroduce a visible locale switcher.

# Existing app analysis — `sensei.gojukan.app`

> Status: authenticated discovery run on 2026-06-18 UTC / 2026-06-17 CST.
> The script captured 60 protected pages and saved screenshots + DOM + HAR to
> `research/discovery/raw/2026-06-18T04-59-11-398Z/` (gitignored). Sections below
> marked `[OBSERVED]` are taken directly from that capture. Anything
> still marked `[INFERRED]` is best-effort from the Velzon template
> pattern and should be confirmed manually by an admin user.

## Provenance

| Source                 | What it gave us                                                                  |
| ---------------------- | -------------------------------------------------------------------------------- |
| `GET /` (public login) | Branding, language, login form fields, asset toolchain                           |
| `HEAD /<paths>` probes | Existence of route file `students.php` (302 → `index.php?msg=expired`)           |
| Page source            | Template identity, observability stack                                           |
| User-provided context  | Domain (karate org), org name, locale, authenticated discovery credential source |

Raw evidence directory (gitignored):
`research/discovery/raw/2026-06-18T04-59-11-398Z/`.

## Tech stack of the legacy app (observed)

- **Server**: Apache (`Server: Apache` header), serves `.php` files directly
  with classic per-page URLs (`login.php`, `students.php`, …).
- **Frontend template**: [Velzon](https://themesbrand.com/velzon/) Bootstrap 5
  admin template (`data-layout="vertical"`, `auth-bg-cover`, the Velzon
  `assets/css/app.min.css` / `custom.min.css` pair, and `simplebar`,
  `lord-icon` libs). This is a popular off-the-shelf admin theme.
- **Auth**: Session-cookie based, `<form action="login.php" method="POST">`
  with `user` (email **or** phone) + `pass` + hidden CSRF `token`.
- **Observability**: New Relic Browser Agent inlined on the login page,
  indicating the operator collects RUM data.
- **Branding**: "Organización Gojukan", footer credits VirtualStrike.mx as
  the platform vendor. Description meta: "Gojukan Karate Do App".
- **Locale**: Spanish-MX UX (`Email o teléfono`, `Contraseña`, `Entrar`).

## Login flow (observed)

1. `GET /` → renders Velzon's split-screen login (`auth-bg-cover`).
2. User submits `user` + `pass` + CSRF `token` to `POST /login.php`.
3. On success, redirects to a session-protected page (likely the dashboard).
4. On session expiry, protected URLs (e.g. `/students.php`) return
   `302 → /index.php?msg=expired`. Confirmed via probe.

UX issues already visible at the login screen:

- No password-reset flow target — "¿Olvidaste tu contraseña?" links to `#`.
- Single-field "email or phone" can confuse users on autofill; modern UX
  would use a dedicated identifier with autocomplete attributes.
- Form is unbranded outside the Gojukan logo — no rate-limit or lockout
  signaling, no MFA option.

## Feature inventory `[OBSERVED]`

The discovery script logged in as the provided admin account and crawled
the protected app. The captured URL structure is **dojo-scoped**: every
operational page lives under a `dojo<Thing>.php` filename, which means
the app's mental model is "I am inside a dojo and operate on its
records". A dojo switcher appears in the sidebar (`sidebarDojoSelector`).

The following 25 distinct PHP endpoints were observed (after collapsing
hash-only navigation noise). Replacement recommendations point at the
matching module in the new app.

| Legacy page                                               | Purpose (inferred from name + screenshot DOM)    | New-app target                                 |
| --------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `welcome.php`                                             | Post-login landing / org-level entrypoint        | `/` (role-aware dashboard)                     |
| `dojoStart.php`                                           | Per-dojo home / index                            | dojo-scoped slice of `/`                       |
| `dojoDashboard.php`                                       | Per-dojo KPIs                                    | `/` (with dojo filter)                         |
| `dojoStudents.php` (+ `?scope=Todos`, `?scope=Inactivos`) | Student list with active/inactive/all filter     | `/members` with `status` filter                |
| `dojoStudentTransferRequests.php`                         | Inter-dojo student transfer workflow             | `/members` action + dedicated queue (post-MVP) |
| `dojoStaffs.php`                                          | Instructor / staff roster                        | `/instructors`                                 |
| `dojoStaff.php?token=`                                    | Staff detail / edit                              | `/instructors/[id]`                            |
| `dojoNewStaff.php`                                        | Create staff member                              | `/instructors/new`                             |
| `dojoClasses.php`                                         | Class catalog / schedule                         | `/classes`                                     |
| `dojoClass.php?id=`                                       | Class detail (roster + attendance)               | `/classes/[id]`                                |
| `dojoExam.php?token=`                                     | Belt exam / promotion record                     | `/promotions/[id]`                             |
| `dojoSamples.php`                                         | Pruebas / sample workflow                        | `/samples`                                     |
| `dojoRooms.php`                                           | Physical rooms in a dojo                         | `/rooms`                                       |
| `dojoRoomDetail.php?id=`                                  | Room detail                                      | `/rooms/[id]`                                  |
| `dojoPlans.php`                                           | Membership plans / pricing tiers                 | `/plans`                                       |
| `dojoInventory.php`                                       | Gi / equipment inventory                         | `/inventory`                                   |
| `dojoLCN.php`                                             | Liga de Cintas Negras                            | `/black-belts`                                 |
| `dojoCashRegister.php`                                    | Daily cash register / capture student payment    | `/cash-register`                               |
| `dojoFinances.php`                                        | Finance overview / monthly payments              | `/payments`                                    |
| `dojoIncomeReport.php`                                    | Revenue report                                   | `/reports`                                     |
| `dojoCutoff.php`                                          | Cash register cut-off / closeout (corte de caja) | `/cutoff`                                      |
| `dojoAccounts.php`                                        | Accounts ledger / monthly payment follow-up      | `/payments`                                    |
| `dojoAp.php`                                              | Expenses / accounts payable                      | `/expenses`                                    |
| `dojoRegisters.php`                                       | Cash register history                            | `/cash-register`                               |
| `dojoConfig.php`                                          | Per-dojo configuration                           | `/settings`                                    |

### Observations from the capture

- **No REST/GraphQL surface**: pages are server-rendered HTML; there is
  no `/api` namespace observable from authenticated nav.
- **Token-keyed deep links**: detail pages use `?token=` rather than
  numeric IDs (e.g. `dojoStaff.php?token=64c31f52cffbb`). This is a
  privacy-positive pattern (non-enumerable) the new app preserves by
  using UUIDv4 ids in the URL.
- **Hash-only sidebar items**: many sidebar links resolve to
  `#sidebarDojoSelector`, `#sidebarFinances`, `#!` — they are JS
  dropdown triggers, not real routes. Our crawler correctly visited
  them once but they should not appear in the new IA.
- **Inactive/Active scope filter** on students is built-in (we observed
  `?scope=Inactivos` and `?scope=Todos`). The new `members` list
  supports `status=active|paused|withdrawn`.
- **Page-level JS errors** observed during crawl ("Cannot read
  properties of null (reading 'addEventListener')") — these come from
  Velzon's JS expecting DOM elements that don't render in headless
  capture without an established session for every sub-resource.
  Real users likely don't see them but they show the legacy code is
  not defensive about DOM availability.
- **Financial focus** is large: ~10 of the 25 endpoints are
  payments/finance related (`Cash`, `Finances`, `Income`, `Cutoff`,
  `Accounts`, `Ap`, `Registers`, `Plans`, `Inventory`). The new app
  must take payments more seriously than the foundation suggests —
  this raises the priority of the Payments milestone in
  [`implementation-plan.md`](./implementation-plan.md).
- **Tournaments are linked but 404**: `dojoTournaments.php` appears in
  the sidebar but returns 404, suggesting the feature was renamed or
  removed. We will not implement it for v1.

## Modern parity snapshot `[IMPLEMENTED]`

The current Next.js app now exposes modern protected pages for the observed
legacy navigation and detail routes. These are intentionally Spanish-first
and tablet-friendly, with the visible labels matching the legacy app instead
of the earlier scaffold IA.

| Legacy surface          | Modern route          | Implementation status                              |
| ----------------------- | --------------------- | -------------------------------------------------- |
| Inicio / dojo dashboard | `/`                   | Implemented dashboard                              |
| Staff list              | `/instructors`        | Implemented legacy-parity module                   |
| Add staff               | `/instructors/new`    | Implemented legacy-parity form shell               |
| Staff detail            | `/instructors/[id]`   | Implemented legacy-parity detail shell             |
| Alumnos                 | `/members`            | Existing data-backed module retained and relabeled |
| New alumno              | `/members/new`        | Existing data-backed create form retained          |
| Transfer requests       | `/members/transfers`  | Implemented legacy-parity module                   |
| Clientes                | `/clients`            | Implemented legacy-parity module                   |
| Salones                 | `/rooms`              | Implemented legacy-parity module                   |
| Room detail             | `/rooms/[id]`         | Implemented legacy-parity detail shell             |
| Clases                  | `/classes`            | Implemented legacy-parity module                   |
| Class detail            | `/classes/[id]`       | Implemented legacy-parity detail shell             |
| Pruebas                 | `/samples`            | Implemented legacy-parity module                   |
| Examenes                | `/exams` and `/ranks` | Implemented legacy-parity module                   |
| Liga de Cintas Negras   | `/black-belts`        | Implemented legacy-parity module                   |
| Planes                  | `/plans`              | Implemented legacy-parity module                   |
| Reporte                 | `/reports`            | Implemented legacy-parity module                   |
| Cajas                   | `/cash-register`      | Implemented legacy-parity module                   |
| Mensualidades           | `/payments`           | Implemented legacy-parity module                   |
| Corte                   | `/cutoff`             | Implemented legacy-parity module                   |
| Gastos                  | `/expenses`           | Implemented legacy-parity module                   |
| Inventario              | `/inventory`          | Implemented legacy-parity module                   |
| Configurar mi Dojo      | `/settings`           | Implemented legacy-parity module                   |

Runtime verification for this parity snapshot is recorded in
[`full-app-stabilization-audit.md`](./full-app-stabilization-audit.md).

### Open questions surfaced by discovery

1. What does `dojoLCN.php` actually do? (Acronym we cannot expand.)
2. Are `dojoSamples.php` items shared across dojos or per-dojo?
3. Does student transfer (`dojoStudentTransferRequests.php`) require
   approval from both source and destination dojos?
4. Are there roles below `dojo_admin` that have access to only a subset
   of these pages? The crawler ran as the provided admin user so this
   is not observable.

## Roles / permissions clues `[INFERRED]`

The Velzon sidebar is typically gated by role. The Gojukan domain implies
at least:

- **Super admin** — operator of the platform (VirtualStrike.mx).
- **Organization admin** — Organización Gojukan central staff.
- **Dojo admin** — per-branch administrator.
- **Instructor / sensei** — runs classes, records attendance, recommends
  promotions.
- **Assistant instructor** — limited write scope.
- **Student / member** — can view own profile/attendance/payments.
- **Parent / guardian** — proxy view for a minor member.
- **Finance staff** — payment ledger access.

To be confirmed once we observe sidebar gating during authenticated walk.

## UX / performance observations from public surface

- **Asset weight at login**: ~74 KB HTML with inlined New Relic boot
  script. The Velzon template ships large pre-compiled CSS bundles
  (`bootstrap.min.css` + `icons.min.css` + `app.min.css` + `custom.min.css`).
  Multiple separate stylesheet requests on first paint.
- **No HTTP/3, no preconnect hints, no `font-display`** observed in the
  shipped HTML.
- **jQuery + Bootstrap bundle** patterns (typical of Velzon) mean every
  page reload runs a full bundle even when only a small chunk has changed.
- **Page-per-URL navigation** (no SPA / no streaming): every menu click is
  a full page reload, every form submit is a full POST + redirect. Modern
  apps eliminate this with RSC + server actions.

## Per-feature dossier template (filled in by `scripts/discover.ts`)

Each authenticated page captured will populate this template in a follow-up
revision:

```
### <feature name>
- Path: <url>
- Purpose: <one line>
- Main user actions: <list>
- Data shown: <fields/columns>
- Forms & fields: <input names + types>
- Validation behaviour: <observed>
- Role assumptions: <observed gating>
- Performance: <ttfb, asset sizes, n+1 markers if any>
- UX issues: <list>
- Replacement recommendation: <how the new app handles it>
```

## Next step

Replace the current static module shells with data-backed workflows in the
same order as the legacy operational importance: finance/cash register,
classes/attendance, staff, rooms, then inventory/plans. Do not reintroduce a
customer-facing language switcher; the Spanish IA above is the product IA.

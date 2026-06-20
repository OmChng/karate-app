# Performance & UX analysis — legacy `sensei.gojukan.app`

> Status: foundation pass. Observations from the public login surface and
> the Velzon template's known runtime characteristics. Lighthouse and HAR
> measurements per authenticated page will be added after
> `pnpm discover:existing-app` runs and produces `session.har`.

## Public surface findings

| Signal          | Observation                                                             | Why it matters                                                      |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Server          | Apache, HTTP/2, no `Server-Timing`                                      | No back-end visibility for operators                                |
| HTML weight     | ~74 KB single-doc login                                                 | Large for a login page; New Relic snippet alone is ~30 KB           |
| Stylesheets     | 4 separate `<link>` requests (bootstrap, icons, app, custom)            | Multiple round-trips before first paint                             |
| JS pattern      | jQuery + Bootstrap bundle + lord-icon + simplebar + New Relic SPA agent | Heavy hydrate; per-page reloads make this cost recur                |
| Fonts           | None preloaded; relies on system fallbacks                              | Mostly OK; consider `font-display: swap` once branding fonts arrive |
| Caching headers | Apache defaults (no per-page `Cache-Control`/`ETag` policy visible)     | No CDN-level caching strategy implied                               |
| HTTPS           | TLS via Cloudflare-like CDN (HTTP/2, fast TLS handshake)                | Good baseline                                                       |
| RUM             | New Relic Browser inlined                                               | Operator has telemetry — we should not regress                      |

## Likely problem areas (to confirm with HAR + Lighthouse)

### 1. Full-page reloads everywhere

Every menu click in a Velzon PHP admin re-downloads the layout, scripts,
sidebar HTML, and re-runs hydration. Repeated cost: ~100–300 ms baseline +
TLS + asset re-parse per navigation. Replacement uses Next.js App Router
with RSC — the sidebar is a layout component, never re-shipped on
navigation, and only the inner page re-renders (often streamed).

### 2. Data tables

Velzon's default tables ship the whole record set in one shot. For a
karate org with hundreds of members and tens of thousands of attendance
rows, this means slow page loads and unusable search.
**Replacement**: server-paginated, server-sorted, server-filtered tables;
indexed queries; debounced search; URL-state-driven filters; export to CSV.

### 3. Forms

PHP submit-then-redirect with no client-side validation gives long
correction loops. **Replacement**: React Hook Form + Zod, optimistic
client validation, server-action submit that returns field-level errors,
and a single round-trip on success.

### 4. Loading & error states

Per-page reload means no skeletons — users stare at a white screen
between clicks. **Replacement**: route segment `loading.tsx` + streaming
RSC + global error boundary with retry.

### 5. Mobile usability

Velzon's sidebar collapses but the dense tables are not mobile-first.
**Replacement**: mobile-first column priority, card layout on small
screens, sticky action bar, touch-sized hit targets, accessible date
inputs.

### 6. Accessibility

- The login page hides the password by default but uses a non-`button`
  toggle pattern (`<button class="btn btn-link">`) that needs ARIA states.
- "Forgot password" anchor is `href="#"` — a dead link is a screen-reader
  trap.
- No skip-to-content link, no announced page titles on PHP re-renders.

**Replacement**: shadcn/ui (Radix-based) primitives give us correct ARIA
out of the box; per-route `<title>` via Next.js `metadata` exports.

### 7. Auth UX

"Email or phone" in one field is fine but lacks `autocomplete="username"`
and `inputmode` hints. Replacement preserves the dual-identifier behavior
(matches user expectations from the legacy app) but adds the right
`autocomplete`, an explicit "use phone instead" toggle, password
strength meter on change, and rate-limit messaging.

## Concrete improvements we will adopt

| Lever               | Plan                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial paint       | RSC + edge runtime where possible; preconnect to DB host; avoid client bundles in marketing routes.                                                   |
| Bundle size         | Tree-shake icons (`lucide-react` per-import), no jQuery, no Bootstrap, route-level code-split.                                                        |
| Data tables         | Server pagination/sort/filter, virtualization beyond ~100 rows, URL-as-state.                                                                         |
| Forms               | RHF + Zod, server actions returning typed errors, optimistic UI for safe ops.                                                                         |
| Caching             | `revalidateTag` per entity (e.g. `members:org:<id>`); `cache: 'no-store'` only when needed.                                                           |
| DB performance      | Indexes for `(organization_id, dojo_id, status, created_at)`, partial index on `deleted_at IS NULL`, FK ON DELETE constraints, audit log append-only. |
| Asset optimization  | Next.js Image, `font-display: swap`, single design token CSS.                                                                                         |
| Mobile-first layout | Tailwind `container` + 1-col → 2-col grid; sticky bottom action bar on member detail.                                                                 |
| A11y                | Skip link, focus management on route change, axe-core integration test.                                                                               |
| Loading states      | `loading.tsx` per route; toast for async actions; skeletons for tables.                                                                               |
| Error states        | `error.tsx` per route with retry; structured server logging via pino.                                                                                 |

## After authenticated discovery runs

Add a section per slow / heavy page that includes:

- TTFB, FCP, LCP, CLS, TBT (Lighthouse mobile-throttled)
- Bytes transferred, request count, longest queue
- Heaviest single asset
- Recommendation specific to that page

Lighthouse JSON outputs will be saved to
`research/discovery/raw/<ts>/lighthouse/` (gitignored).

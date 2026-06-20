# UI / UX plan — Sensei Modern

## 1. Design principles

1. **Tablet-first, phone-ready, desktop-respectful**: the primary device
   for sensei in the dojo is an iPad in portrait (768–834 px). Every
   layout must look right at iPad portrait first, then scale down to
   360 px phones and up to 1280 px desktop without surprises.
2. **Calm density**: enough whitespace to scan, enough density to avoid
   pagination noise.
3. **One primary action per screen**: highlighted call-to-action
   (e.g., "Mark attendance"), everything else is secondary.
4. **Optimistic where safe**: mutations that can't damage data
   (toggles, sorts, status changes) update the UI immediately.
5. **Accessible by default**: every interactive control is keyboard-
   reachable, every form field is labeled, every async state is announced.
6. **Spanish-only end-user UX**: the audience is Mexican. The product
   never shows a language switcher to end users. English exists only as
   a maintainer escape hatch via `/en/...` and is not advertised in the
   UI. The HTML `lang` attribute is set from the route locale so screen
   readers stay correct.

## 2. Visual language

- **Color**: neutral slate base + a single accent (Gojukan red, e.g.
  `hsl(0 75% 45%)`) reserved for primary CTAs and brand. Status colors
  (success/warning/error) come from a small semantic palette mapped to
  Tailwind tokens.
- **Typography**: `Inter` (variable) as the default; mono for code/IDs.
  Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40.
- **Radius**: `0.5rem` default, `0.75rem` on cards, full on avatars.
- **Shadow**: minimal; cards use a 1px hairline border in light mode and
  a 1px outline in dark mode rather than drop shadow.
- **Density**: 8 px grid. Touch targets ≥ 44 px on mobile.

## 3. Information architecture

```
/
├── /login                           (public)
├── /forgot-password                 (public)
├── /                                (dashboard, role-aware)
├── /members                         (list)
│   ├── /members/new
│   └── /members/[id]
│       ├── /members/[id]/edit
│       ├── /members/[id]/attendance
│       ├── /members/[id]/ranks
│       └── /members/[id]/payments
├── /classes                         (weekly grid + list)
│   ├── /classes/new
│   └── /classes/[id]                (roster + attendance)
├── /attendance                      (today's classes shortlist)
├── /ranks                           (taxonomy)
├── /promotions                      (workflow inbox)
├── /dojos
├── /instructors
├── /payments
├── /events
├── /announcements
├── /reports
└── /settings
    ├── /settings/profile
    ├── /settings/organization
    └── /settings/audit
```

## 4. Navigation shell

The shell adapts at three breakpoints, derived from the actual devices
sensei use:

| Breakpoint                   | Typical device                                | Primary nav                                                                                                                                                 |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `< md` (< 768 px)            | Phones in portrait/landscape                  | Hamburger button in the top bar opens an overlay drawer (`Sheet`). A fixed 4-tab bottom nav (Dashboard / Members / Attendance / Classes) is always visible. |
| `md` to `< lg` (768–1023 px) | **iPad portrait & iPad 11"** (primary target) | Persistent labeled sidebar on the left. No bottom nav at this width; table-heavy lists stay in card mode until `lg` to preserve readable content.           |
| `≥ lg` (1024 px+)            | Desktop and iPad Pro landscape                | Persistent full sidebar with icons + labels. Dense tables can replace card lists.                                                                           |

- **Top bar**: hamburger (phones only), session info (left), sign-out
  (right). The locale `<select>` is intentionally removed — Spanish is
  the only customer-facing language.
- **Breadcrumbs**: shown on detail pages (v1.1).
- **Bottom nav (`< md` only)**: 4 most-used destinations, fixed to
  `bottom-0 inset-x-0` with `pb-[env(safe-area-inset-bottom)]` so iOS
  home indicators don't overlap.

## 5. Patterns

### Data tables

- Server-paginated; URL holds `?page=&pageSize=&sort=&q=&...filters`.
- Sticky header on scroll; sticky first column on horizontal scroll
  (mobile).
- Empty state: friendly illustration + the primary CTA ("Add member").
- Bulk actions in a sticky bottom bar that appears on selection.
- Default sort: most-recently-created first.

### Forms

- React Hook Form + Zod resolver.
- Inline field errors below each input, in red `text-destructive`.
- Submit button is disabled until form is dirty and valid; spinner during
  pending; toast on success.
- Long forms split into accordions, not multi-page wizards (back-button
  friendly).
- Date pickers and phone inputs use accessible native-first patterns.

### Loading / error / empty states

- Every route has `loading.tsx` (skeleton matching the layout).
- Every route segment has `error.tsx` with a Retry button.
- Tables: skeleton rows during initial load; row-level inline shimmer on
  re-fetch.
- Empty state copy is action-oriented ("Add your first member"), not
  apologetic ("No data").

### Toasts & banners

- Toasts for ephemeral confirmations ("Member created").
- Banner inside a card for persistent issues ("Payment overdue").
- Never both — pick the right channel.

### Search & filters

- Top-of-table search uses 300 ms debounce, server-side.
- Filters as a sheet on mobile, a popover on desktop.
- Active filters render as removable chips.

## 6. Members module (reference implementation for all future modules)

### Members list (`/members`)

- Top bar: search input, "New member" CTA (right).
- Filter row: dojo selector, status selector (active/paused/withdrawn),
  rank selector.
- Table columns (desktop): avatar, name, code, dojo, rank, joined, status.
- Mobile: card view with avatar, name, rank, status badge; tap goes to
  detail.

### Member detail (`/members/[id]`)

- Header: avatar, name, status badge, current rank, dojo, primary CTAs
  ("Edit", "Mark attendance", "Promote").
- Tabs: Overview / Attendance / Ranks / Payments / Guardians / Notes.
- Sidebar (desktop): quick facts (joined, age, contact). On mobile,
  this becomes a collapsible card at the top.

### New/Edit member

- Single form, grouped sections (Identity, Contact, Dojo, Guardians,
  Notes).
- Save as draft is **not** supported in v1 — the form is short and
  finishing-friendly.

## 7. Accessibility checklist

- All interactive elements reachable by Tab in document order.
- Focus visible (Tailwind `focus-visible:ring-2 ring-ring`).
- `<label>` for every form control.
- `<button>` for buttons, `<a>` for navigation. No clickable `<div>`.
- Form errors associated via `aria-describedby`.
- Toasts use `role="status"` (polite) or `role="alert"` (assertive).
- Tables use `<th scope="col">` and `<th scope="row">` where applicable.
- Color is never the only signal (status chips combine color + icon +
  text).
- Color-contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components.
- Skip-to-content link at the top of `(app)` layout.
- Page `<title>` set per route via `metadata` export.
- `axe-core` runs in Playwright tests (v1.1).

## 8. Responsive breakpoints

| Token      | Min width | Devices we test against                            | Shell                                                    |
| ---------- | --------- | -------------------------------------------------- | -------------------------------------------------------- |
| (base)     | 360 px    | iPhone SE, small Android phones                    | Hamburger + bottom nav, members rendered as cards        |
| sm         | 640 px    | Big phones in landscape                            | Same as base; forms become 2-column where useful         |
| md         | 768 px    | **iPad mini portrait**                             | Labeled sidebar appears; table-heavy lists stay as cards |
| (iPad 11") | 834 px    | **iPad Pro 11" portrait** — primary teacher device | Same as md; verified in Playwright project `ipad-11`     |
| lg         | 1024 px   | iPad landscape, small laptops                      | Dense tables can replace card lists                      |
| xl         | 1280 px   | Desktop                                            | Same as lg; dashboard cards reach 4-up                   |
| 2xl        | 1400 px   | Large desktop                                      | Same as xl                                               |

Playwright projects (`playwright.config.ts`): `chromium` (desktop),
`ipad-11` (834×1194, touch), `iphone-14` (390×844). The smoke spec runs
under all three so regressions in the responsive shell fail CI.

### Form ergonomics on touch

- Every input/select/textarea is `min-h-11` (44 px) — Apple HIG minimum.
- Every input uses `text-base` (16 px) so iOS Safari does **not** zoom
  on focus.
- `inputMode` is set per field (`email`, `tel`, `numeric`, `search`) so
  the on-screen keyboard matches expected input.
- Submit and cancel buttons are `min-h-11`. On phones the action row
  becomes a column with the primary button at the bottom for
  thumb-reach.

## 9. Components inventory (shadcn/ui, owned in repo)

Initial set we'll add to `src/components/ui/`:
`Button`, `Input`, `Label`, `Form`, `Select`, `Textarea`, `Checkbox`,
`Switch`, `RadioGroup`, `Dialog`, `Sheet`, `DropdownMenu`, `Popover`,
`Tooltip`, `Toast`, `Avatar`, `Badge`, `Card`, `Tabs`, `Table`,
`Pagination`, `Skeleton`, `Separator`, `Breadcrumb`, `Toolbar`.

## 10. Design tokens (Tailwind CSS variables)

Defined in `src/app/globals.css`:

```
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 0 75% 45%;            /* Gojukan red */
  --primary-foreground: 0 0% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 0 75% 45%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 47.4% 11.2%;
  --radius: 0.5rem;
}
.dark { ... }   /* mirror with inverted values */
```

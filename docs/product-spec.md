# Product specification — Sensei Modern

## 1. Vision

A fast, mobile-friendly platform that lets a karate organization run its
day-to-day operations: enroll students, schedule classes, record
attendance, track belt progression, collect fees, and broadcast
announcements — across multiple dojos, multiple roles, and a long
historical record.

The product replaces a Velzon-template PHP admin at `sensei.gojukan.app`
without losing any operator capability while dramatically improving speed,
mobile UX, and data integrity.

## 2. Primary users

| Persona              | Frequency | Devices                    | Top jobs                                    |
| -------------------- | --------- | -------------------------- | ------------------------------------------- |
| Organization admin   | Daily     | Desktop, occasional mobile | Manage roster, oversee dojos, run reports   |
| Dojo admin           | Daily     | Desktop + mobile           | Manage local roster, schedule, finances     |
| Instructor / Sensei  | Per class | Mobile primary             | Take attendance, recommend promotions       |
| Assistant instructor | Per class | Mobile primary             | Assist with attendance                      |
| Student / member     | Weekly    | Mobile primary             | View own attendance, payments, rank history |
| Parent / guardian    | Weekly    | Mobile                     | View child's progress, pay fees             |
| Finance staff        | Weekly    | Desktop                    | Reconcile payments, send overdue reminders  |
| Super admin          | Rare      | Desktop                    | Operator-level org provisioning             |

## 3. Role model (v1)

```
super_admin
  ├─ organization_admin
  │   ├─ dojo_admin
  │   │   ├─ instructor
  │   │   │   └─ assistant_instructor
  │   │   └─ finance_staff
  │   └─ finance_staff
  ├─ member
  └─ parent (linked to one or more members)
```

Roles are **assignments**, not types — a single user may be
`organization_admin` for Org A and `instructor` for Dojo X. Authorization
uses `(user_id, organization_id, dojo_id, role)` tuples.

## 4. Core workflows (MVP)

### A. Attendance roll-call (instructor, mobile)

1. Instructor opens today's class on phone.
2. Sees member list pre-sorted by belt + name.
3. Taps to mark Present / Late / Absent / Excused.
4. Optional class note.
5. Submit — server action persists rows + audit; UI shows confirmation
   chip. Offline-safe (queue + retry; v1.1).

### B. Enroll a new member (dojo admin, desktop)

1. Open Members → New.
2. Form: name, DOB, contact (email/phone), guardian(s) if minor, dojo,
   starting rank.
3. Submit — server validates, creates member + initial rank entry +
   audit log.
4. Confirmation toast with link to member detail.

### C. Promote a member (instructor recommends → admin approves)

1. Instructor opens member detail, taps "Recommend promotion".
2. Selects target rank + exam date + score.
3. Server creates a `promotion` row in state `recommended`.
4. Dojo/Org admin reviews queue, approves or rejects.
5. On approval: a new `rank` row is appended (history kept), member's
   current rank updated, member notified.

### D. Record payment (finance staff)

1. Open member detail → Payments tab.
2. Add payment: amount, method, period, notes.
3. Server creates payment row, updates member's balance view, audit log.
4. (v1.1) Receipts via email; auto-overdue reminders.

### E. Class schedule (dojo admin)

1. Classes view: weekly grid by dojo.
2. Drag to create / edit class blocks (or modal form on mobile).
3. Assign instructor(s), capacity, rank prerequisites.
4. Members visualize own upcoming classes on their dashboard.

### F. Announcement (org admin)

1. Compose: title, body, audience (whole org / one dojo / one role).
2. Schedule or publish now.
3. Members see in-app + email (opt-in).

## 5. MVP scope

In scope for **v1.0**:

- Auth (email-or-phone + password, password reset email, MFA-ready hooks)
- RBAC with org/dojo scoping
- Members CRUD + soft-delete + audit log
- Guardians linked to members
- Dojos CRUD
- Instructors (assign users to roles)
- Classes (weekly recurring, ad-hoc)
- Attendance roll-call
- Ranks (taxonomy) + Promotions (workflow)
- Payments ledger (manual entries, no PSP integration)
- Announcements (in-app + email)
- Basic dashboards (KPIs per role)
- Reports: attendance % by member/class, revenue by dojo/month, promotion history
- Spanish-MX primary, English secondary
- Cross-platform Docker dev setup
- Self-host friendly (no vendor lock-in)

## 6. Post-MVP (prioritized)

1. Payment provider integration (Stripe + a Mexican option such as
   Conekta or MercadoPago) — defer until org confirms PSP choice.
2. Offline-first attendance on mobile (Service Worker + IndexedDB queue).
3. PDF receipts + bulk certificates.
4. Tournaments (registration, brackets, scoring).
5. Event ticketing + RSVPs.
6. SMS / WhatsApp notifications.
7. Family/Household billing.
8. Mobile native shell via Capacitor / Expo for push.
9. Public org website + signup landing pages.
10. Data import wizard from the legacy PHP app.

## 7. Non-goals (v1)

- A public marketing site.
- Built-in chat / DMs (Slack-style).
- Video lesson hosting.
- A native mobile app (PWA only).
- Multi-currency. ISO-MXN only for v1 (multi-currency in v2).
- A custom rules engine for belts (use a config file per org).

## 8. Risks

| Risk                                                              | Impact                     | Mitigation                                                                                               |
| ----------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Legacy data shape differs from inferred model                     | Schema churn before launch | Run discovery script + write a one-time import job behind a feature flag                                 |
| Multiple orgs share one schema → leakage                          | Privacy bug                | Every query goes through a `withOrg(...)` helper that injects `organization_id`; row-level test fixtures |
| Phone-as-username collision                                       | Login confusion            | Normalize numbers via libphonenumber, store canonical E.164                                              |
| PSP integration scope creep                                       | Slips launch               | Out of v1; ledger only                                                                                   |
| New Relic in legacy implies operator expectation of observability | Need parity                | Ship pino + OTLP exporter scaffold in v1                                                                 |
| Coexistence with legacy during cut-over                           | Data drift                 | Pick a hard cut-over date; no two-way sync                                                               |

## 9. Assumptions

- The org runs primarily in Mexico, timezone `America/Mexico_City`,
  currency MXN.
- Members enter the system via dojo admins, not self-signup, in v1.
- Belts follow a Goju-Ryu ranking (white → yellow → orange → green →
  blue → purple → brown → black with dans). Encoded as data, not enums.
- An organization may operate multiple dojos but, in v1, a user belongs
  to one organization at a time.
- "Email or phone" identifier is preserved — operators are used to it.
- Minors require at least one linked guardian.

## 10. Open questions (carried into discovery)

- Does the legacy app store guardian relationships, or just a free-text
  emergency contact?
- Does the legacy app support multiple organizations, or one fixed
  Gojukan org?
- Does the legacy app support sub-dojos / nested locations?
- Are there any custom belt ranks or honorary titles to encode?
- Are payments tied to _enrollments_ (per-class) or _memberships_
  (monthly)?
- Are there workflow states for promotions, or is it instant?
- Are announcements email-out or in-app only?
- Is there an existing data export we can use for migration?

## 11. MVP acceptance criteria

Sensei Modern v1.0 is shippable when:

1. A dojo admin can sign in on mobile, take attendance for a 30-person
   class in under 90 seconds, and see the result in the org admin
   report within five seconds.
2. An org admin can create a dojo, an instructor user, and a class in
   under three minutes from a desktop.
3. A member can sign in and see own attendance history, rank history,
   and payment ledger on a 4G mobile in under three seconds to LCP.
4. All mutating server actions write an audit log entry with actor,
   org, dojo, entity, before/after diff, and timestamp.
5. Lighthouse mobile score ≥ 90 for Performance, Accessibility, Best
   Practices, SEO on every public route; ≥ 80 for any authenticated
   route.
6. `pnpm test` and `pnpm e2e` are both green in CI.
7. New developer can clone the repo and run `pnpm install && pnpm db:up
&& pnpm db:migrate && pnpm db:seed && pnpm dev` on macOS or Windows
   and reach `/login` in under five minutes.

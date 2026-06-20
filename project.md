# Project Brief — Sensei Modern

## Goal

Build a modern web platform that replaces the legacy karate
organization app at `https://sensei.gojukan.app/`. The replacement
keeps every existing capability (members, dojos, classes, attendance,
ranks, payments, announcements, reports) while improving performance,
UX, and the foundation for future features.

## Audience and language

**Mexican karate organizations.** Sensei (teachers), org admins, and
parents/guardians.

**The product UI is in Spanish (`es`) only.** This is non-negotiable.
The chat with the development AI may be in English; the product is
not. See [`AGENTS.md`](AGENTS.md) and
[`context/language-and-locale.md`](context/language-and-locale.md).

## Primary devices

Tablet-first design — sensei take attendance on an iPad in the dojo.
Phone-ready (sensei phones, parents' phones), desktop-respectful
(office use by admins).

Breakpoints in `docs/ui-ux-plan.md` §8.

## Constraints

- Cross-platform development on macOS and Windows. Docker Compose for
  local services.
- TypeScript strict mode. Linted, type-checked, tested before merge.
- Credentials never committed; `.env.local` is the only place they
  live.
- The legacy app is production; never mutate it.

## Desired outputs

- A working Next.js app under `src/`, deployable to Vercel or any
  Docker host, with a single command for local bring-up
  (`pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev`).
- The seven Phase 2–8 design documents under `docs/` kept up to date
  as the implementation evolves.
- A migration path from the legacy MySQL/PostgreSQL data into the new
  schema (planned, not yet built).

## Status snapshot

Foundation is in place: scaffolding, Docker, schema, auth, RBAC, i18n
(Spanish default), Members module end-to-end as a template. Remaining
modules and migration tracked in
[`docs/implementation-plan.md`](docs/implementation-plan.md).

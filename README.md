# Sensei Modern

A modern karate organization platform — replacement for the legacy
`sensei.gojukan.app`.

Built with Next.js 15 App Router (RSC + server actions), TypeScript
strict, Tailwind CSS, PostgreSQL 16 + Drizzle ORM, Auth.js v5, and
next-intl. Cross-platform via Docker Compose.

> Read the design first: [`docs/architecture.md`](docs/architecture.md),
> [`docs/data-model.md`](docs/data-model.md),
> [`docs/product-spec.md`](docs/product-spec.md).

## Prerequisites

| Tool           | Version                    | macOS                                                                                 | Windows                                                                           | Linux                          |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Node           | ≥ 20.11 LTS (24 also fine) | `brew install node`                                                                   | [nodejs.org installer](https://nodejs.org/) or `winget install OpenJS.NodeJS.LTS` | distro package                 |
| pnpm           | ≥ 9.x (via Corepack)       | `corepack enable pnpm`                                                                | `corepack enable pnpm` (PowerShell)                                               | `corepack enable pnpm`         |
| Docker Desktop | latest                     | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | same                                                                              | Docker Engine + Compose plugin |
| Git            | any                        | `brew install git`                                                                    | [git-scm.com](https://git-scm.com/)                                               | distro package                 |

## Quick start (macOS / Linux / Codespaces)

```bash
# 1) Enable pnpm
corepack enable pnpm

# 2) Install dependencies
pnpm install

# 3) Set up local env (real values stay in .env.local; .env.local is gitignored)
cp .env.example .env.local
AUTH_SECRET="$(openssl rand -base64 32)" perl -0pi -e 's|^AUTH_SECRET=.*|AUTH_SECRET=$ENV{AUTH_SECRET}|m' .env.local

# 4) Start Postgres + Mailhog
pnpm db:up

# 5) Apply committed migrations
pnpm db:migrate

# 6) Seed demo data
pnpm db:seed

# 7) Run the app
pnpm dev             # http://localhost:3000
```

Demo logins (created by `pnpm db:seed`):

- `admin@sensei.local` / `admin1234` — organization admin
- `sensei@sensei.local` / `sensei1234` — instructor

## Quick start (Windows / PowerShell)

```powershell
# 1) Enable pnpm
corepack enable pnpm

# 2) Install dependencies
pnpm install

# 3) Set up local env
Copy-Item .env.example .env.local
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
(Get-Content .env.local) -replace '^AUTH_SECRET=.*', "AUTH_SECRET=$secret" | Set-Content .env.local

# 4) Start Postgres + Mailhog (Docker Desktop must be running)
pnpm db:up

# 5) Migrate + seed
pnpm db:migrate
pnpm db:seed

# 6) Run
pnpm dev
```

If `pnpm` is not found after `corepack enable`, open a new PowerShell
window so the PATH refreshes.

## Quick start (Docker for everything)

To run the app inside Docker (production-style):

```bash
cp .env.example .env.local
# Set AUTH_SECRET in .env.local first.
docker compose --env-file .env.local --profile full up --build
# App: http://localhost:3000
# Mailhog UI: http://localhost:8025
```

## Common scripts

| Command                      | What it does                                                |
| ---------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                   | Run the app at http://localhost:3000                        |
| `pnpm build`                 | Production build                                            |
| `pnpm start`                 | Run the built app                                           |
| `pnpm lint`                  | ESLint flat config                                          |
| `pnpm typecheck`             | TypeScript strict check                                     |
| `pnpm format`                | Prettier write                                              |
| `pnpm test`                  | Vitest unit tests                                           |
| `pnpm e2e:install`           | Install Playwright browsers (one-time)                      |
| `pnpm e2e`                   | Playwright end-to-end (boots `pnpm dev` if needed)          |
| `pnpm db:up`                 | Start Postgres + Mailhog containers                         |
| `pnpm db:down`               | Stop containers                                             |
| `pnpm db:generate`           | Generate a new SQL migration after editing `src/db/schema/` |
| `pnpm db:migrate`            | Apply pending migrations                                    |
| `pnpm db:push`               | Push schema directly (dev shortcut, **not** for prod)       |
| `pnpm db:studio`             | Drizzle Studio UI for inspecting data                       |
| `pnpm db:seed`               | Idempotent demo seed (refuses to run in production)         |
| `pnpm discover:existing-app` | Read-only Playwright walk-through of the legacy app         |

## Environment variables

All variables are declared and validated in
[`src/lib/env.ts`](src/lib/env.ts). The template lives in `.env.example`.
Real secrets belong in `.env.local`, which is gitignored.

Required:

- `DATABASE_URL` — Postgres connection string.
- `AUTH_SECRET` — long random string. Generate with
  `openssl rand -base64 32` on macOS/Linux or the PowerShell snippet
  above on Windows.
- `APP_URL` — public URL of the app (default `http://localhost:3000`).

Optional, used by `pnpm discover:existing-app`:

- `SENSEI_APP_URL` (e.g. `https://sensei.gojukan.app/`)
- `SENSEI_APP_USER`, `SENSEI_APP_PASSWORD`

The discovery script never logs the credentials and never visits
URLs that look mutating; see [`scripts/discover.ts`](scripts/discover.ts).

## Project layout

```
/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (app)/        # protected app routes (sidebar shell)
│   │   │   ├── (auth)/       # public auth routes
│   │   │   └── layout.tsx    # locale layout (html/body)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── health/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx        # root layout (passes children through)
│   ├── components/           # nav, providers, presentational
│   ├── db/
│   │   ├── client.ts
│   │   └── schema/           # one file per entity
│   ├── server/               # server-only modules (queries, actions)
│   │   └── members/          # reference module copied by future modules
│   ├── lib/                  # env, auth, rbac, utils, logger
│   ├── i18n/                 # routing + request config for next-intl
│   └── middleware.ts         # auth + locale routing
├── messages/                 # es.json (primary), en.json
├── scripts/                  # migrate, seed, discover
├── tests/
│   ├── unit/                 # Vitest
│   └── e2e/                  # Playwright
├── docs/                     # all design + analysis documents
├── drizzle/                  # generated SQL migrations
├── docker-compose.yml
└── Dockerfile
```

## Troubleshooting

**`pnpm db:up` fails / port 5432 already in use.**
You probably have a local Postgres listening. Either stop it or change
`POSTGRES_PORT` in `.env.local` and `docker-compose.yml`.

**`AUTH_SECRET` errors at runtime.**
Generate a 32-byte secret and put it in `.env.local`:

- macOS/Linux: `openssl rand -base64 32`
- Windows PowerShell: see Quick start.

**`pnpm db:migrate` fails with `relation "..." already exists` after `pnpm db:generate`.**
First setup should apply committed migrations, not generate new ones. If
you accidentally generated a local migration during setup, remove only
those generated Drizzle files, restore the journal if Git shows it as
modified, then rerun the migration:

```bash
git status --short drizzle
rm -f drizzle/0006_*.sql drizzle/meta/0006_snapshot.json
git restore drizzle/meta/_journal.json
pnpm db:migrate
```

**`pnpm e2e` cannot launch Chromium.**
Run `pnpm e2e:install` once.

**`argon2` install fails on Windows.**
Make sure you have the latest Visual Studio Build Tools or use WSL.
Alternatively, swap to `@node-rs/argon2` in `package.json` (drop-in
replacement; see [issue tracker]).

**Discovery script (`pnpm discover:existing-app`) hangs at login.**
The legacy app uses an `<input name="user">` + `<input name="pass">`
form. If they renamed those, the script logs the URL and quits — open
the captured screenshots to see what the page looks like and update the
selectors in `scripts/discover.ts`.

**Drizzle migration fails saying the type already exists.**
Drop and recreate the dev DB:

```bash
pnpm db:down
docker volume rm sensei-modern_postgres-data
pnpm db:up && pnpm db:migrate
```

## What's implemented in this scaffold

- The complete Phase 2–8 analysis docs under [`docs/`](docs/).
- A read-only discovery script for the legacy app.
- Docker Compose with Postgres 16 + Mailhog. A production Dockerfile.
- Next.js 15 App Router (RSC) + TypeScript strict + Tailwind + shadcn
  groundwork.
- Auth.js v5 with Credentials (email or phone), Argon2id hashing,
  database sessions.
- RBAC helpers with role inheritance and org/dojo scope.
- Drizzle schema for all v1 entities + migration + idempotent seed.
- i18n with `next-intl`, **Spanish-only customer UI** (the audience is
  Mexican). The `en` locale exists as a maintainer escape hatch for QA
  only — no customer-facing language switcher. Browser locale detection
  is disabled. See [`context/language-and-locale.md`](context/language-and-locale.md).
- Members module **end-to-end** (list with search/filter/pagination,
  detail, create, edit) — the template every future module copies.
- Vitest unit tests for RBAC, utils, member schema.
- Playwright smoke spec.
- Cross-platform README.

## What's next

See [`docs/implementation-plan.md`](docs/implementation-plan.md) for the
prioritized milestone list — Dojos, Classes, Attendance, Ranks,
Promotions, Payments, Reports, then migration from the legacy app.

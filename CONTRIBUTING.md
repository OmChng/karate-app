# Contributing

Read [AGENTS.md](AGENTS.md), [project.md](project.md), and the files in
[context/](context/) before changing product behavior.

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Product Rules

- The management app, login page, authenticated shell, forms, and
  protected workflows are Spanish-only.
- The public website may expose Spanish and English content.
- Do not add a language selector to login or authenticated management
  routes.
- Keep tablet portrait layouts first-class; touch targets must be at
  least 44 px.
- Never commit secrets, local HAR captures, screenshots with private
  data, database dumps, or `.env.local`.

## Before a PR

```bash
pnpm audit --prod --audit-level low
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Also verify that `git status --short --ignored` does not show tracked
secret material or generated artifacts.

# Security

## Supported Scope

This repository is currently private and marked `UNLICENSED`. Treat all
production credentials, legacy discovery credentials, HAR captures,
screenshots, database dumps, and customer data as private.

## Reporting

Report suspected vulnerabilities to the repository owner privately. Do
not open a public issue containing secrets, customer data, exploit
details, or production URLs.

## Required Checks

Before sharing or pushing changes, run:

```bash
pnpm audit --prod --audit-level low
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Run a secret scan before the first shared remote or any public release:

```bash
gitleaks detect --source . --no-git --redact
```

Real secrets belong only in `.env.local` or the deployment secret store.
Keep `.env.example` placeholder-only.

# research/discovery

Raw artifacts captured by `pnpm discover:existing-app` live under
`research/discovery/raw/<timestamp>/`.

That directory is **gitignored** because the HAR/DOM dumps may contain
personally identifiable information from the production app
(`sensei.gojukan.app`).

Polished, redacted findings belong in
[../../docs/existing-app-analysis.md](../../docs/existing-app-analysis.md).

## How to refresh

1. Make sure `.env.local` has valid `SENSEI_APP_*` credentials.
2. Install Chromium (one-time):

   ```bash
   pnpm e2e:install
   ```

3. Run discovery:

   ```bash
   pnpm discover:existing-app
   ```

The script is strictly read-only:

- it only submits the login form,
- it skips URLs that look mutating (`/delete`, `/eliminar`, `?action=delete`, etc.),
- it stays same-origin,
- it caps at 60 pages and 20 s per page.

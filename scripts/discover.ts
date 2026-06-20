/**
 * Read-only discovery script for the legacy Sensei app.
 *
 * Logs in once with credentials from process.env, then walks every link in
 * the authenticated app, captures screenshots + DOM snapshots + HAR + a JSON
 * sitemap into research/discovery/raw/<timestamp>/.
 *
 * Guarantees:
 *  - Never logs credentials.
 *  - Never submits a form other than the login form.
 *  - Never visits URLs that look mutating (`/delete`, `/eliminar`,
 *    `?action=delete`, etc.).
 *  - Same-origin only.
 *
 * Run:    pnpm discover:existing-app
 * Output: research/discovery/raw/<ts>/{screenshots,dom,har,sitemap.json}
 */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local' });
loadDotenv();
import { chromium, type Page, type BrowserContext } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const APP_URL = process.env.SENSEI_APP_URL?.trim();
const USER = process.env.SENSEI_APP_USER?.trim();
const PASS = process.env.SENSEI_APP_PASSWORD?.trim();

if (!APP_URL || !USER || !PASS) {
  console.error(
    'Missing SENSEI_APP_URL / SENSEI_APP_USER / SENSEI_APP_PASSWORD. ' +
      'Copy .env.example to .env.local and fill in the values.',
  );
  process.exit(1);
}

// Patterns that suggest a mutating action — skip these URLs entirely.
const MUTATING_PATTERNS = [
  /\b(delete|eliminar|borrar|remove|destroy|drop)\b/i,
  /\b(create|crear|nuevo|new|add|agregar)\b/i,
  /\b(edit|editar|update|actualizar|modify|modificar)\b/i,
  /\b(logout|salir|cerrar[-_]?sesion|signout)\b/i,
  /action=(delete|remove|edit|update|create|add)/i,
  /\?do=(delete|remove|edit|update|create|add)/i,
];

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(process.cwd(), `research/discovery/raw/${ts}`);
const harPath = join(outDir, 'session.har');
const sitemapPath = join(outDir, 'sitemap.json');
const screenshotsDir = join(outDir, 'screenshots');
const domDir = join(outDir, 'dom');

interface VisitedPage {
  url: string;
  title: string;
  status: number;
  links: string[];
  forms: Array<{ action: string; method: string; fields: string[] }>;
  navItems: Array<{ text: string; href: string | null }>;
  capturedAt: string;
}

function isMutating(url: string): boolean {
  return MUTATING_PATTERNS.some((re) => re.test(url));
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 120) || 'index';
}

async function ensureDirs() {
  for (const d of [outDir, screenshotsDir, domDir]) {
    await mkdir(d, { recursive: true });
  }
}

async function login(page: Page): Promise<void> {
  process.stdout.write('Logging in to legacy app... ');
  await page.goto(APP_URL!, { waitUntil: 'domcontentloaded' });
  // Existing form: <input name="user"> and <input name="pass">
  await page.locator('input[name="user"]').fill(USER!);
  await page.locator('input[name="pass"]').fill(PASS!);
  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.locator('button[type="submit"]').click(),
  ]);
  // Detect login failure (still on index with an error)
  const url = page.url();
  if (/index\.php/.test(url) && /msg=/.test(url)) {
    throw new Error(`Login appears to have failed (redirected to ${url}).`);
  }
  console.log('ok');
}

async function snapshot(page: Page, url: string): Promise<VisitedPage | null> {
  let response;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  } catch (err) {
    console.warn(`  ! could not load ${url}: ${(err as Error).message}`);
    return null;
  }
  if (!response) return null;
  const status = response.status();
  if (status >= 400) {
    console.warn(`  ! ${status} for ${url}`);
    return null;
  }
  const title = await page.title();
  const finalUrl = page.url();
  const slug = sanitizeFilename(new URL(finalUrl).pathname.replace(/\//g, '_'));

  await page.screenshot({ path: join(screenshotsDir, `${slug}.png`), fullPage: true });
  const html = await page.content();
  await writeFile(join(domDir, `${slug}.html`), html, 'utf8');

  // Extract structural info without saving any input values.
  const links = await page.$$eval('a[href]', (els) =>
    Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).href))),
  );
  const forms = await page.$$eval('form', (els) =>
    els.map((f) => ({
      action: (f as HTMLFormElement).action || '',
      method: ((f as HTMLFormElement).method || 'get').toLowerCase(),
      fields: Array.from(f.querySelectorAll('input,select,textarea')).map((el) => {
        const name = (el as HTMLInputElement).name || '';
        const type = (el as HTMLInputElement).type || el.tagName.toLowerCase();
        return `${name}:${type}`;
      }),
    })),
  );
  const navItems = await page
    .$$eval('.navbar-nav a, .sidebar a, nav a, .menu a', (els) =>
      els.map((e) => ({
        text: (e.textContent || '').trim().slice(0, 80),
        href: (e as HTMLAnchorElement).getAttribute('href'),
      })),
    )
    .catch(() => [] as Array<{ text: string; href: string | null }>);

  return {
    url: finalUrl,
    title,
    status,
    links,
    forms,
    navItems,
    capturedAt: new Date().toISOString(),
  };
}

async function run() {
  await ensureDirs();
  console.log(`Output: ${outDir}`);

  const browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordHar: { path: harPath, mode: 'minimal' },
    locale: 'es-MX',
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.warn('  page error:', err.message));

  try {
    await login(page);

    const origin = new URL(APP_URL!).origin;
    const visited = new Map<string, VisitedPage>();
    const queue: string[] = [];

    // Seed with the post-login landing page.
    const start = page.url();
    queue.push(start);

    // Also probe the sidebar/menu we can see right now.
    const initialNav = await page
      .$$eval('a[href]', (els) => Array.from(els).map((e) => (e as HTMLAnchorElement).href))
      .catch(() => []);
    for (const h of initialNav) queue.push(h);

    const MAX_PAGES = 60;

    while (queue.length && visited.size < MAX_PAGES) {
      const next = queue.shift()!;
      if (!next || visited.has(next)) continue;
      if (!next.startsWith(origin)) continue;
      if (isMutating(next)) continue;
      if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|map)(\?|$)/i.test(next)) continue;

      console.log(`  -> ${next.replace(origin, '')}`);
      const snap = await snapshot(page, next);
      if (!snap) continue;
      visited.set(next, snap);
      for (const link of snap.links) {
        if (!visited.has(link) && link.startsWith(origin) && !isMutating(link)) {
          queue.push(link);
        }
      }
    }

    const sitemap = Array.from(visited.values()).sort((a, b) => a.url.localeCompare(b.url));
    await writeFile(sitemapPath, JSON.stringify(sitemap, null, 2), 'utf8');
    console.log(`\nDone. Pages captured: ${sitemap.length}`);
    console.log(`Sitemap: ${sitemapPath}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Discovery failed:', err.message);
  process.exitCode = 1;
});

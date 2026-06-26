import { expect, test, type Locator, type Page } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import postgres from 'postgres';

loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ quiet: true });

const admin = {
  identifier: 'superadmin@sensei.local',
  password: 'superadmin1234',
};

const bugambiliasAdmin = {
  identifier: 'admin.bugambilias@sensei.local',
  password: 'admin1234',
};

const primaryRoutes = [
  { href: '/app', heading: 'Inicio', link: 'Inicio' },
  { href: '/app/personal', heading: 'Staff', link: 'Staff' },
  { href: '/app/personal/nuevo', heading: 'Agregar staff' },
  { href: '/app/personal/demo', heading: 'Detalle de staff' },
  { href: '/app/miembros', heading: 'Alumnos', link: 'Alumnos' },
  { href: '/app/miembros/nuevo', heading: 'Nuevo alumno' },
  { href: '/app/miembros/transferencias', heading: 'Transferencias' },
  { href: '/app/clientes', heading: 'Clientes', link: 'Clientes' },
  { href: '/app/salones', heading: 'Salones', link: 'Salones' },
  { href: '/app/clases', heading: 'Clases', link: 'Clases' },
  { href: '/app/pruebas', heading: 'Pruebas', link: 'Pruebas' },
  { href: '/app/examenes', heading: 'Exámenes', link: 'Exámenes' },
  { href: '/app/cintas-negras', heading: 'Liga de Cintas Negras', link: 'Liga de Cintas Negras' },
  { href: '/app/finanzas', heading: 'Finanzas', link: 'Resumen' },
  { href: '/app/planes', heading: 'Planes', link: 'Planes' },
  { href: '/app/reporte', heading: 'Reporte', link: 'Reporte' },
  { href: '/app/cajas', heading: 'Capturar pago de alumno', link: 'Cajas' },
  { href: '/app/mensualidades', heading: 'Mensualidades', link: 'Mensualidades' },
  { href: '/app/corte', heading: 'Corte', link: 'Corte' },
  { href: '/app/gastos', heading: 'Gastos', link: 'Gastos' },
  { href: '/app/inventario', heading: 'Inventario', link: 'Inventario' },
  { href: '/app/configuracion', heading: 'Datos de contacto', link: 'Configuración' },
  { href: '/app/pase-de-lista', heading: 'Pase de lista' },
  { href: '/app/anuncios', heading: 'Anuncios' },
  { href: '/app/dojos', heading: 'Dojos' },
  { href: '/app/eventos', heading: 'Eventos' },
];

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    if (failure?.errorText === 'net::ERR_ABORTED') return;
    errors.push(`requestfailed: ${request.method()} ${request.url()} ${failure?.errorText ?? ''}`);
  });

  return errors;
}

async function expectDocumentOk(page: Page, href: string) {
  const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
  expect(response, `No response for ${href}`).not.toBeNull();
  expect(response!.status(), `${href} status`).toBeLessThan(400);
  return response!;
}

async function signIn(page: Page, credentials: { identifier: string; password: string }) {
  await expectDocumentOk(page, '/iniciar-sesion');
  const identifier = page.getByLabel('Email o teléfono');
  const password = page.getByLabel('Contraseña');
  await expect(identifier).toBeEnabled({ timeout: 15_000 });
  await expect(password).toBeEnabled({ timeout: 15_000 });
  await identifier.fill(credentials.identifier);
  await password.fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page).toHaveURL('/app');
}

async function signInAsAdmin(page: Page) {
  await signIn(page, admin);
}

async function getMemberHrefByCode(page: Page, code: string) {
  await expectDocumentOk(page, `/app/miembros?q=${encodeURIComponent(code)}&pageSize=100`);
  const row = page.getByRole('link', { name: /Ver detalle de / }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(/\/app\/miembros\/[0-9a-f-]+$/);
  return new URL(page.url()).pathname;
}

async function openFinanceMenu(scope: Page | Locator) {
  const financeButton = scope.getByRole('button', { name: 'Finanzas', exact: true }).first();
  const cashRegisterLink = scope.getByRole('link', { name: 'Cajas', exact: true }).first();

  await expect(financeButton).toBeVisible();
  await financeButton.scrollIntoViewIfNeeded();

  if ((await financeButton.getAttribute('aria-expanded')) !== 'true') {
    await financeButton.click();
  }

  await expect(financeButton).toHaveAttribute('aria-expanded', 'true');
  await expect(cashRegisterLink).toBeVisible();
}

async function expectTouchButton(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, 'Expected touch target to have layout').not.toBeNull();
  expect(box!.height, 'Expected touch target height >= 44px').toBeGreaterThanOrEqual(44);
  const radius = await locator.evaluate((node) => {
    const value = window.getComputedStyle(node).borderRadius;
    return Number.parseFloat(value);
  });
  expect(radius, 'Expected button-like rounded corners').toBeGreaterThan(0);
}

async function openAccountControls(scope: Page | Locator) {
  const accountButton = scope.getByRole('button', { name: /Usuario actual/ }).first();
  await expectTouchButton(accountButton);
  await accountButton.scrollIntoViewIfNeeded();
  if ((await accountButton.getAttribute('aria-expanded')) !== 'true') {
    await accountButton.click();
  }
  await expect(accountButton).toHaveAttribute('aria-expanded', 'true');
  await expectTouchButton(scope.getByRole('button', { name: /Cambiar a modo/ }).first());
  await expectTouchButton(scope.getByRole('button', { name: /texto grande/ }).first());
  await expectTouchButton(scope.getByRole('button', { name: 'Cerrar sesión' }).first());
}

async function cssToken(page: Page, name: string) {
  return page.locator('html').evaluate((node, tokenName) => {
    return window.getComputedStyle(node).getPropertyValue(tokenName).trim();
  }, name);
}

async function readSeedOperatingData() {
  const url = process.env.DATABASE_URL;
  expect(url, 'DATABASE_URL must be set for seeded data e2e checks').toBeTruthy();
  const sql = postgres(url!, { max: 1 });
  try {
    return await sql<
      {
        code: string;
        room_count: number;
        student_count: number;
        linked_member_count: number;
      }[]
    >`
      select
        d.code,
        count(distinct r.id)::int as room_count,
        count(distinct m.id)::int as student_count,
        count(distinct mg.member_id)::int as linked_member_count
      from dojo d
      left join room r on r.dojo_id = d.id and r.deleted_at is null
      left join member m on m.dojo_id = d.id and m.deleted_at is null and m.status = 'active'
      left join member_guardian mg on mg.member_id = m.id
      where d.code in ('BSA', 'BUG', 'AGU', 'SAG') and d.deleted_at is null
      group by d.code
      order by d.code
    `;
  } finally {
    await sql.end();
  }
}

test.describe('Smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test('public homepage supports Spanish and English routing', async ({ page }) => {
    await expectDocumentOk(page, '/');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Formación marcial con disciplina, comunidad y excelencia',
      }),
    ).toBeVisible();

    await expectDocumentOk(page, '/es');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Formación marcial con disciplina, comunidad y excelencia',
      }),
    ).toBeVisible();

    await expectDocumentOk(page, '/en');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Martial formation with discipline, community, and excellence',
      }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Official site navigation' })).toBeVisible();
  });

  test('public language selector switches only the public homepage locale', async ({ page }) => {
    await expectDocumentOk(page, '/es');

    const spanishNav = page.getByRole('navigation', { name: 'Navegación del sitio oficial' });
    const spanishSwitcher = spanishNav.getByRole('group', { name: 'Selector de idioma' });
    await expect(spanishSwitcher).toBeVisible();
    await expect(spanishSwitcher.getByRole('link', { name: 'Español' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await spanishSwitcher.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL('/en');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Martial formation with discipline, community, and excellence',
      }),
    ).toBeVisible();

    const englishNav = page.getByRole('navigation', { name: 'Official site navigation' });
    const englishSwitcher = englishNav.getByRole('group', { name: 'Language selector' });
    await expect(englishSwitcher).toBeVisible();
    await expect(englishSwitcher.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await englishSwitcher.getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Formación marcial con disciplina, comunidad y excelencia',
      }),
    ).toBeVisible();
  });

  test('public homepage renders unauthenticated and links to canonical login', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await expectDocumentOk(page, '/es');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Formación marcial con disciplina, comunidad y excelencia',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Quiénes somos' }).first()).toBeVisible();
    const publicNav = page.getByRole('navigation', { name: 'Navegación del sitio oficial' });
    const themeButton = page.getByRole('button', { name: /Cambiar a modo (oscuro|claro)/ });
    await expect(themeButton).toBeVisible();
    await expect(publicNav.getByRole('link', { name: 'Contacto' })).toBeVisible();
    await expect(publicNav.getByRole('link', { name: 'Ingresar al sistema' })).toBeVisible();
    await expect
      .poll(() =>
        publicNav.evaluate((nav) =>
          Array.from(nav.children).map((child) => {
            if (child.getAttribute('role') === 'group') {
              return Array.from(child.querySelectorAll('a'))
                .map((link) => link.textContent?.trim() ?? '')
                .join('/');
            }
            return child.textContent?.trim() ?? '';
          }),
        ),
      )
      .toEqual([
        'Quiénes somos',
        'Academias',
        'Programas',
        'Noticias',
        'Contacto',
        'Español/English',
        'Cambiar a modo oscuro',
        'Ingresar al sistema',
      ]);
    await expect(page.getByLabel('Tu dirección o código postal')).toBeVisible();
    const firstAcademyCard = page.locator('#academias article').first();
    await expect(
      firstAcademyCard.getByRole('heading', { level: 3, name: 'Las Águilas' }),
    ).toBeVisible();
    await expect(firstAcademyCard.getByText('Matriz')).toBeVisible();
    await expect(
      firstAcademyCard.getByText('Av. Sierra de Mazamitla 5733, Pinar de la Calma'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Bosques de Santa Anita' }),
    ).toBeVisible();
    await expect(
      page.getByText('Boulevard Bosques de Santa Anita 2355-28, San Agustín'),
    ).toBeVisible();
    await expect(page.getByText('Karate infantil')).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect
      .poll(() =>
        page.locator('.public-site').evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        }),
      )
      .toBe('rgb(11, 15, 20)');
    await expect
      .poll(() =>
        page
          .locator('#main > section')
          .first()
          .evaluate((node) => {
            return window.getComputedStyle(node).backgroundColor;
          }),
      )
      .toBe('rgb(11, 15, 20)');
    await expect
      .poll(() =>
        page.locator('#quienes-somos').evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        }),
      )
      .toBe('rgb(247, 248, 250)');
    await expect
      .poll(() =>
        page.locator('#programas').evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        }),
      )
      .toBe('rgb(16, 19, 26)');

    await page.waitForLoadState('networkidle');
    await themeButton.click();
    await expect(themeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect
      .poll(() =>
        page.locator('#quienes-somos').evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        }),
      )
      .toBe('rgb(16, 19, 26)');
    await expect
      .poll(() =>
        page
          .locator('#quienes-somos article')
          .first()
          .evaluate((node) => {
            return window.getComputedStyle(node).backgroundColor;
          }),
      )
      .toBe('rgb(23, 27, 36)');

    await page.getByRole('link', { name: 'Ingresar al sistema' }).first().click();
    await expect(page).toHaveURL(/\/iniciar-sesion$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Selector de idioma' })).toHaveCount(0);

    expect(runtimeErrors).toEqual([]);
  });

  test('login page renders and invalid login fails safely', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await expectDocumentOk(page, '/iniciar-sesion');
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('.brand-mark')).toBeVisible();
    await expect(page.locator('.palette-rule')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Selector de idioma' })).toHaveCount(0);
    await expect(page.getByLabel('Email o teléfono')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();

    const identifier = page.getByLabel('Email o teléfono');
    const password = page.getByLabel('Contraseña');
    await expect(identifier).toBeEnabled({ timeout: 15_000 });
    await expect(password).toBeEnabled({ timeout: 15_000 });
    await identifier.fill('nadie@sensei.local');
    await password.fill('incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Credenciales inválidas')).toBeVisible({ timeout: 15_000 });

    const englishLoginResponse = await page.goto('/en/login');
    expect(englishLoginResponse?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Selector de idioma' })).toHaveCount(0);

    expect(runtimeErrors).toEqual([]);
  });

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    const appResponse = await page.goto('/app');
    expect(appResponse?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion\?next=%2Fapp$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    const englishAppResponse = await page.goto('/en/app');
    expect(englishAppResponse?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion\?next=%2Fapp$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    const englishMembersResponse = await page.goto('/en/members');
    expect(englishMembersResponse?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion\?next=%2Fapp%2Fmiembros$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    const response = await page.goto('/miembros');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion\?next=%2Fapp%2Fmiembros$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
  });

  test('valid login redirects authenticated users to the management app', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Valid login redirect runs once on desktop.');

    await signInAsAdmin(page);
    await expect(page.getByRole('group', { name: 'Selector de idioma' })).toHaveCount(0);
  });

  test('old top-level management URLs redirect to canonical /app paths', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Canonical redirect check runs once.');

    await signInAsAdmin(page);
    const response = await page.goto('/miembros?q=CTR-R07&pageSize=100', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/app\/miembros\?q=CTR-R07&pageSize=100$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Alumnos' })).toBeVisible();
  });

  test('role scopes show the right seeded academies', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    test.skip(testInfo.project.name !== 'chromium', 'Scoped academy visibility runs once.');

    await signInAsAdmin(page);
    await expectDocumentOk(page, '/app/clases');
    for (const dojoName of [
      'Bosques de Santa Anita',
      'Bugambilias',
      'Las Águilas',
      'San Agustín',
    ]) {
      await expect(page.locator('tbody').getByText(dojoName).first()).toBeVisible();
    }
    await expectDocumentOk(page, '/app/miembros?q=BUG-001&pageSize=100');
    await expect(
      page.getByRole('link', { name: /Ver detalle de Aitana Bravo Medina/ }),
    ).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, bugambiliasAdmin);
    await expect(page.getByRole('button', { name: 'Finanzas', exact: true })).toHaveCount(0);
    const financeResponse = await page.goto('/app/finanzas', { waitUntil: 'domcontentloaded' });
    expect(financeResponse?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1, name: 'No encontrado' })).toBeVisible();

    await expectDocumentOk(page, '/app/clases');
    await expect(page.locator('tbody').getByText('Bugambilias').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Bosques de Santa Anita')).toHaveCount(0);

    await expectDocumentOk(page, '/app/miembros?q=BUG-001&pageSize=100');
    await expect(
      page.getByRole('link', { name: /Ver detalle de Aitana Bravo Medina/ }),
    ).toBeVisible();
    await expectDocumentOk(page, '/app/miembros?q=CTR-R07&pageSize=100');
    await expect(page.getByRole('link', { name: /Ver detalle de / })).toHaveCount(0);
  });

  test('dashboard rank distribution links to filtered students', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Dashboard rank filter check runs once.');

    await signInAsAdmin(page);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Distribución por grado' }),
    ).toBeVisible();
    const yellowRankSegment = page
      .getByRole('link', { name: /9° Kyu: .*% de los alumnos/ })
      .first();
    await expect(yellowRankSegment).toBeVisible();
    await yellowRankSegment.click();
    await expect(page).toHaveURL(/\/app\/miembros\?rankLevel=3&page=1$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Alumnos' })).toBeVisible();
  });

  test('seeded academies include rooms, students, and linked clients', async ({
    page: _page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Seeded DB check runs once.');

    const rows = await readSeedOperatingData();
    const byCode = new Map(rows.map((row) => [row.code, row]));

    expect(byCode.get('BSA')?.room_count).toBe(2);
    expect(byCode.get('BUG')?.room_count).toBe(1);
    expect(byCode.get('AGU')?.room_count).toBe(1);
    expect(byCode.get('SAG')?.room_count).toBe(1);

    for (const code of ['BSA', 'BUG', 'AGU', 'SAG']) {
      const row = byCode.get(code);
      expect(row?.student_count, `${code} student count`).toBeGreaterThanOrEqual(60);
      expect(row?.student_count, `${code} student count`).toBeLessThanOrEqual(100);
      expect(row?.linked_member_count, `${code} linked client count`).toBe(row?.student_count);
    }
  });

  test('theme toggle switches modes and persists after reload', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Theme persistence runs once on desktop.');

    await page.addInitScript(() => {
      if (!window.localStorage.getItem('sensei-theme')) {
        window.localStorage.setItem('sensei-theme', 'light');
      }
    });
    await signInAsAdmin(page);
    await page.evaluate(() => {
      window.localStorage.setItem('sensei-font-size', 'default');
      document.documentElement.classList.remove('large-text');
    });
    await expect.poll(() => cssToken(page, '--color-app-bg')).toBe('#f7f8fa');
    await expect.poll(() => cssToken(page, '--color-app-bg-warm')).toBe('#faf7f2');
    await expect.poll(() => cssToken(page, '--color-surface')).toBe('#ffffff');
    await expect.poll(() => cssToken(page, '--color-surface-secondary')).toBe('#f9fafb');
    await expect.poll(() => cssToken(page, '--color-surface-muted')).toBe('#f3f4f6');
    await expect.poll(() => cssToken(page, '--color-border')).toBe('#e5e7eb');
    await expect.poll(() => cssToken(page, '--color-border-strong')).toBe('#d1d5db');
    await expect.poll(() => cssToken(page, '--color-text')).toBe('#111827');
    await expect.poll(() => cssToken(page, '--color-text-secondary')).toBe('#4b5563');
    await expect.poll(() => cssToken(page, '--color-primary')).toBe('#e43d30');
    await expect.poll(() => cssToken(page, '--color-primary-hover')).toBe('#c7352a');
    await expect.poll(() => cssToken(page, '--color-primary-active')).toBe('#a92d24');
    await expect.poll(() => cssToken(page, '--color-primary-soft')).toBe('#fee4df');
    await expect.poll(() => cssToken(page, '--color-primary-subtle')).toBe('#fff1ee');
    await expect.poll(() => cssToken(page, '--color-sidebar-bg')).toBe('#10131a');
    await expect.poll(() => cssToken(page, '--color-sidebar-elevated')).toBe('#171b24');
    await expect.poll(() => cssToken(page, '--color-sidebar-border')).toBe('#2a2f3a');
    await expect.poll(() => cssToken(page, '--color-sidebar-active')).toBe('#e43d30');
    await expect.poll(() => cssToken(page, '--color-success')).toBe('#16803c');
    await expect.poll(() => cssToken(page, '--color-success-soft')).toBe('#e8f6ed');
    await expect.poll(() => cssToken(page, '--color-warning')).toBe('#b7791f');
    await expect.poll(() => cssToken(page, '--color-warning-soft')).toBe('#fff4d6');
    await expect.poll(() => cssToken(page, '--color-danger')).toBe('#dc2626');
    await expect.poll(() => cssToken(page, '--color-focus')).toBe('#2563eb');
    await expect.poll(() => cssToken(page, '--background')).toBe('220 23.1% 97.5%');
    await expect.poll(() => cssToken(page, '--card')).toBe('0 0% 100%');
    await expect.poll(() => cssToken(page, '--primary')).toBe('4.3 76.9% 54.1%');
    await expect.poll(() => cssToken(page, '--primary-foreground')).toBe('0 0% 100%');
    await expect.poll(() => cssToken(page, '--primary-subtle')).toBe('10.6 100% 96.7%');
    await expect.poll(() => cssToken(page, '--primary-subtle-foreground')).toBe('4.1 64.9% 40.2%');
    await expect.poll(() => cssToken(page, '--primary-border')).toBe('4.3 76.9% 54.1%');
    await expect.poll(() => cssToken(page, '--primary-hover')).toBe('4.2 65.1% 47.3%');
    await expect.poll(() => cssToken(page, '--primary-ring')).toBe('221.2 83.2% 53.3%');
    await expect.poll(() => cssToken(page, '--sidebar')).toBe('222 23.8% 8.2%');
    await expect.poll(() => cssToken(page, '--sidebar-end')).toBe('221.5 22% 11.6%');
    await expect.poll(() => cssToken(page, '--sidebar-border')).toBe('221.3 16% 19.6%');
    await expect.poll(() => cssToken(page, '--success')).toBe('141.5 70.7% 29.4%');
    await expect.poll(() => cssToken(page, '--success-subtle')).toBe('141.4 43.8% 93.7%');
    await expect.poll(() => cssToken(page, '--success-border')).toBe('138 39.2% 80%');
    await expect.poll(() => cssToken(page, '--info')).toBe('208.7 58.3% 22.5%');
    await expect.poll(() => cssToken(page, '--info-subtle')).toBe('210 50% 94.5%');
    await expect.poll(() => cssToken(page, '--danger')).toBe('0 72.2% 50.6%');
    await expect.poll(() => cssToken(page, '--danger-hover')).toBe('0 73.7% 41.8%');
    await expect.poll(() => cssToken(page, '--warning-strong')).toBe('35.5 71% 42%');
    await expect.poll(() => cssToken(page, '--accent')).toBe('208.7 58.3% 22.5%');
    await expect.poll(() => cssToken(page, '--accent-subtle')).toBe('210 50% 94.5%');
    await expect.poll(() => cssToken(page, '--secondary')).toBe('210 20% 98%');
    await expect.poll(() => cssToken(page, '--ring')).toBe('221.2 83.2% 53.3%');
    await expect.poll(() => cssToken(page, '--font-japanese')).toContain('Hiragino Sans');
    await expect.poll(() => cssToken(page, '--font-japanese')).toContain('Noto Sans JP');
    await expect.poll(() => cssToken(page, '--font-japanese')).toContain('Meiryo');
    await expect.poll(() => cssToken(page, '--motion-instant')).toBe('80ms');
    await expect.poll(() => cssToken(page, '--motion-page')).toBe('220ms');
    await expect.poll(() => cssToken(page, '--motion-y-page')).toBe('12px');
    await expect
      .poll(async () => (await cssToken(page, '--ease-in')).replaceAll(' ', ''))
      .toBe('cubic-bezier(0.4,0,1,1)');
    await expect(page.locator('.brand-mark:visible').first()).toBeVisible();
    await expect(page.locator('[data-motion-scope="page"]')).toBeVisible();
    await expect(page.locator('.palette-rule')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/large-text/);

    await openAccountControls(page);
    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect.poll(() => cssToken(page, '--background')).toBe('220.9 39.3% 11%');
    await expect.poll(() => cssToken(page, '--card')).toBe('221.5 22% 11.6%');
    await expect.poll(() => cssToken(page, '--secondary')).toBe('221.1 21.3% 17.5%');
    await expect.poll(() => cssToken(page, '--accent')).toBe('208.7 58.3% 22.5%');
    await expect.poll(() => cssToken(page, '--success-muted')).toBe('221.1 21.3% 17.5%');
    await expect.poll(() => cssToken(page, '--success-subtle')).toBe('141.4 43.8% 93.7%');
    await expect.poll(() => cssToken(page, '--info-muted')).toBe('221.1 21.3% 17.5%');
    await expect.poll(() => cssToken(page, '--primary-subtle')).toBe('10.6 100% 96.7%');
    await expect.poll(() => cssToken(page, '--primary-subtle-foreground')).toBe('4.1 64.9% 40.2%');
    await expect.poll(() => cssToken(page, '--primary-border')).toBe('4.3 76.9% 54.1%');
    await expect.poll(() => cssToken(page, '--ring')).toBe('221.2 83.2% 53.3%');
    await expect.poll(() => cssToken(page, '--danger-muted')).toBe('221.1 21.3% 17.5%');
    await expect.poll(() => cssToken(page, '--sidebar')).toBe('222 23.8% 8.2%');
    await expect.poll(() => cssToken(page, '--sidebar-end')).toBe('222 23.8% 8.2%');
    await expect(page.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible();

    await page.getByRole('button', { name: 'Activar texto grande' }).click();
    await expect(page.locator('html')).toHaveClass(/large-text/);
    await expect(page.getByRole('button', { name: 'Desactivar texto grande' })).toBeVisible();
    const largeFontSize = await page.locator('html').evaluate((node) => {
      return Number.parseFloat(window.getComputedStyle(node).fontSize);
    });
    expect(largeFontSize).toBeGreaterThanOrEqual(18);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/large-text/);
  });

  test('authenticated primary routes load without runtime errors', async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    test.skip(testInfo.project.name !== 'chromium', 'Full route crawl runs once on desktop.');
    const runtimeErrors = collectRuntimeErrors(page);

    await signInAsAdmin(page);

    for (const route of primaryRoutes) {
      await expectDocumentOk(page, route.href);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('seeded member detail and edit routes load', async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    test.skip(
      testInfo.project.name !== 'chromium',
      'Seeded dynamic route check runs once on desktop.',
    );
    const runtimeErrors = collectRuntimeErrors(page);

    await signInAsAdmin(page);
    await expectDocumentOk(page, '/app/miembros');
    await expect(page.getByRole('columnheader', { name: 'Alumno' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Grado' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Edad' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Clase' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Faltas del mes' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
    const pageSizeSelect = page.getByLabel('Alumnos por página');
    await expect(pageSizeSelect).toBeEnabled();
    await expect(pageSizeSelect).toContainText('20');
    await pageSizeSelect.click();
    await page.getByRole('menuitemradio', { name: '40' }).click();
    await expect(page).toHaveURL(/pageSize=40/);

    await expectDocumentOk(page, '/app/miembros?q=CTR-R07&pageSize=100');
    await expect(page.locator('tbody').getByText('3° Kyu').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Victoria Navarro Vargas').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Navarro Vargas, Victoria')).toHaveCount(0);
    await expect(page.locator('tbody').getByText('ビクトリア').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Activo').first()).toHaveClass(
      /bg-success-subtle/,
    );
    await expect(page.locator('tbody').getByText('0 faltas').first()).toHaveClass(
      /bg-success-subtle/,
    );

    const memberHref = await getMemberHrefByCode(page, 'CTR-R07');

    await expectDocumentOk(page, memberHref!);
    await expect(page.locator('main h1')).toHaveText('Victoria Navarro Vargas - ビクトリア');
    await expect(page.getByText('CURP')).toBeVisible();
    await expect(page.getByText('Tipo de sangre')).toBeVisible();
    await expect(page.getByText('Cuidados especiales')).toBeVisible();
    await expect(page.getByText('Teléfono de emergencia')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Promover' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transferir' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dar de baja' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Clases' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Exámenes' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Liga de Cintas Negras' }),
    ).toBeVisible();

    const beginnerMemberHref = await getMemberHrefByCode(page, 'CTR-R01');
    await expectDocumentOk(page, beginnerMemberHref);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Liga de Cintas Negras' }),
    ).toHaveCount(0);

    await expectDocumentOk(page, `${memberHref}/editar`);
    await expect(page.getByRole('heading', { level: 1, name: 'Editar alumno' })).toBeVisible();

    await expectDocumentOk(page, '/app/clases');
    await expect(page.getByRole('heading', { level: 1, name: 'Clases' })).toBeVisible();
    const classRow = page.getByRole('link', { name: /Ver detalle de clase / }).first();
    await expect(
      classRow,
      'Expected at least one seeded class row link on /app/clases',
    ).toBeVisible();
    await classRow.click();
    await expect(page).toHaveURL(/\/app\/clases\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Alumnos asignados' })).toBeVisible();

    const malformedResponse = await page.goto('/app/miembros/not-a-uuid', {
      waitUntil: 'domcontentloaded',
    });
    expect(malformedResponse?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1, name: 'No encontrado' })).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });

  test('desktop primary navigation clicks through implemented routes', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium', 'Desktop nav click crawl runs once.');
    const runtimeErrors = collectRuntimeErrors(page);

    await signInAsAdmin(page);
    await expect(page.getByRole('link', { name: 'Cajas', exact: true })).toHaveCount(0);
    await openFinanceMenu(page);

    for (const route of primaryRoutes.filter((route) => route.link)) {
      const link = page.getByRole('link', { name: route.link!, exact: true }).first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(route.href, { timeout: 15_000 });
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('tablet and phone shells expose the expected navigation controls', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'chromium',
      'Responsive shell check runs on iPad and iPhone projects.',
    );
    const runtimeErrors = collectRuntimeErrors(page);

    await signInAsAdmin(page);
    await expectDocumentOk(page, '/app/miembros');
    await expect(page.getByRole('heading', { level: 1, name: 'Alumnos' })).toBeVisible();

    if (testInfo.project.name === 'iphone-14') {
      const mobileCards = page.locator('main ul').filter({ hasText: 'Faltas del mes' }).first();
      await expect(mobileCards.getByText('Faltas del mes').first()).toBeVisible();
      await expect(mobileCards.getByText('Grado').first()).toBeVisible();
      await expectTouchButton(page.getByRole('button', { name: 'Abrir menú' }));
      await expectTouchButton(page.getByRole('link', { name: 'Inicio' }));
      await expectTouchButton(page.getByRole('link', { name: 'Staff' }));
      await expect(page.getByRole('link', { name: 'Cajas' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();
      await openAccountControls(page);
      await openFinanceMenu(page);
    } else {
      const sidebar = page.getByRole('complementary', { name: 'Navegación principal' });
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Inicio' })).toBeVisible();
      await expectTouchButton(sidebar.getByRole('link', { name: 'Alumnos' }));
      await expectTouchButton(page.getByRole('link', { name: /Ver detalle de / }).first());
      await openAccountControls(sidebar);
      await openFinanceMenu(sidebar);
    }

    expect(runtimeErrors).toEqual([]);
  });
});

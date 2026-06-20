import { expect, test, type Locator, type Page } from '@playwright/test';

const admin = {
  identifier: 'admin@sensei.local',
  password: 'admin1234',
};

const primaryRoutes = [
  { href: '/', heading: 'Inicio', link: 'Inicio' },
  { href: '/personal', heading: 'Staff', link: 'Staff' },
  { href: '/personal/nuevo', heading: 'Agregar staff' },
  { href: '/personal/demo', heading: 'Detalle de staff' },
  { href: '/miembros', heading: 'Alumnos', link: 'Alumnos' },
  { href: '/miembros/nuevo', heading: 'Nuevo alumno' },
  { href: '/miembros/transferencias', heading: 'Transferencias' },
  { href: '/clientes', heading: 'Clientes', link: 'Clientes' },
  { href: '/salones', heading: 'Salones', link: 'Salones' },
  { href: '/salones/demo', heading: 'Detalle de salón' },
  { href: '/clases', heading: 'Clases', link: 'Clases' },
  { href: '/pruebas', heading: 'Pruebas', link: 'Pruebas' },
  { href: '/examenes', heading: 'Exámenes', link: 'Exámenes' },
  { href: '/cintas-negras', heading: 'Liga de Cintas Negras', link: 'Liga de Cintas Negras' },
  { href: '/planes', heading: 'Planes', link: 'Planes' },
  { href: '/reporte', heading: 'Reporte', link: 'Reporte' },
  { href: '/cajas', heading: 'Capturar pago de alumno', link: 'Cajas' },
  { href: '/mensualidades', heading: 'Mensualidades', link: 'Mensualidades' },
  { href: '/corte', heading: 'Corte', link: 'Corte' },
  { href: '/gastos', heading: 'Gastos', link: 'Gastos' },
  { href: '/inventario', heading: 'Inventario', link: 'Inventario' },
  { href: '/configuracion', heading: 'Datos de contacto', link: 'Configuración' },
  { href: '/pase-de-lista', heading: 'Pase de lista' },
  { href: '/anuncios', heading: 'Anuncios' },
  { href: '/dojos', heading: 'Dojos' },
  { href: '/eventos', heading: 'Eventos' },
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

async function signInAsAdmin(page: Page) {
  await expectDocumentOk(page, '/iniciar-sesion');
  const identifier = page.getByLabel('Email o teléfono');
  const password = page.getByLabel('Contraseña');
  await expect(identifier).toBeEnabled({ timeout: 15_000 });
  await expect(password).toBeEnabled({ timeout: 15_000 });
  await identifier.fill(admin.identifier);
  await password.fill(admin.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible({
    timeout: 15_000,
  });
}

async function getMemberHrefByCode(page: Page, code: string) {
  await expectDocumentOk(page, `/miembros?q=${encodeURIComponent(code)}&pageSize=100`);
  const row = page.getByRole('link', { name: /Ver detalle de / }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(/\/miembros\/[0-9a-f-]+$/);
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

test.describe('Smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test('login page renders and invalid login fails safely', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await expectDocumentOk(page, '/iniciar-sesion');
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('.brand-mark')).toBeVisible();
    await expect(page.locator('.palette-rule')).toHaveCount(0);
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

    expect(runtimeErrors).toEqual([]);
  });

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    const response = await page.goto('/miembros');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/iniciar-sesion\?next=%2Fmiembros$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
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
    await expect.poll(() => cssToken(page, '--signal-red')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--periwinkle')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--purple')).toBe('262.3 43.1% 42.7%');
    await expect.poll(() => cssToken(page, '--primary')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--primary-foreground')).toBe('0 0% 100%');
    await expect.poll(() => cssToken(page, '--primary-subtle')).toBe('9.2 74% 93%');
    await expect.poll(() => cssToken(page, '--primary-subtle-foreground')).toBe('0 0% 5%');
    await expect.poll(() => cssToken(page, '--primary-border')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--primary-hover')).toBe('9.2 78% 40%');
    await expect.poll(() => cssToken(page, '--primary-ring')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--brand-red-bright')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--brand-red-surface')).toBe('9.2 70% 28%');
    await expect.poll(() => cssToken(page, '--brand-red-deep')).toBe('9.2 70% 28%');
    await expect.poll(() => cssToken(page, '--brand-red-dark')).toBe('9.2 72% 18%');
    await expect.poll(() => cssToken(page, '--brand-red-soft')).toBe('9.2 74% 93%');
    await expect.poll(() => cssToken(page, '--brand-red')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--brand-red-foreground')).toBe('0 0% 100%');
    await expect.poll(() => cssToken(page, '--sidebar')).toBe('0 0% 3%');
    await expect.poll(() => cssToken(page, '--sidebar-end')).toBe('0 0% 0%');
    await expect.poll(() => cssToken(page, '--sidebar-border')).toBe('0 0% 16%');
    await expect.poll(() => cssToken(page, '--deep-navy')).toBe('262.3 43.1% 42.7%');
    await expect.poll(() => cssToken(page, '--warm-cream')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--success')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--success-subtle')).toBe('228.6 50% 94%');
    await expect.poll(() => cssToken(page, '--info')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--info-subtle')).toBe('228.6 50% 94%');
    await expect.poll(() => cssToken(page, '--danger')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--warning-strong')).toBe('262.3 43.1% 42.7%');
    await expect.poll(() => cssToken(page, '--accent')).toBe('262.3 43.1% 42.7%');
    await expect.poll(() => cssToken(page, '--accent-subtle')).toBe('262.3 48% 93%');
    await expect.poll(() => cssToken(page, '--secondary')).toBe('228.6 50% 94%');
    await expect.poll(() => cssToken(page, '--ring')).toBe('9.2 76.6% 46.9%');
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

    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect.poll(() => cssToken(page, '--secondary')).toBe('0 0% 13%');
    await expect.poll(() => cssToken(page, '--accent')).toBe('262.3 43.1% 42.7%');
    await expect.poll(() => cssToken(page, '--success-muted')).toBe('228.6 30% 18%');
    await expect.poll(() => cssToken(page, '--success-subtle')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--info-muted')).toBe('228.6 30% 18%');
    await expect.poll(() => cssToken(page, '--primary-subtle')).toBe('9.2 70% 28%');
    await expect.poll(() => cssToken(page, '--primary-subtle-foreground')).toBe('0 0% 100%');
    await expect.poll(() => cssToken(page, '--primary-border')).toBe('9.2 76.6% 46.9%');
    await expect.poll(() => cssToken(page, '--ring')).toBe('228.6 40.4% 79.6%');
    await expect.poll(() => cssToken(page, '--danger-muted')).toBe('9.2 70% 28%');
    await expect.poll(() => cssToken(page, '--sidebar')).toBe('0 0% 3%');
    await expect.poll(() => cssToken(page, '--sidebar-end')).toBe('0 0% 0%');
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
    await expect(page.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Desactivar texto grande' })).toBeVisible();
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
    await expectDocumentOk(page, '/miembros');
    await expect(page.getByRole('columnheader', { name: 'Alumno' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Grado' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Edad' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Clase' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Faltas del mes' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
    await expect(page.locator('tbody').getByText('8°/7° Kyu').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Victoria Navarro Vargas').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Navarro Vargas, Victoria')).toHaveCount(0);
    await expect(page.locator('tbody').getByText('ビクトリア').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('Activo').first()).toHaveClass(
      /bg-success-subtle/,
    );
    await expect(page.locator('tbody').getByText('0 faltas').first()).toHaveClass(
      /bg-success-subtle/,
    );
    const pageSizeSelect = page.getByLabel('Alumnos por página');
    await expect(pageSizeSelect).toBeEnabled();
    await expect(pageSizeSelect).toHaveValue('20');
    await pageSizeSelect.selectOption('40');
    await expect(page).toHaveURL(/pageSize=40/);

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

    await expectDocumentOk(page, '/clases');
    await expect(page.getByRole('heading', { level: 1, name: 'Clases' })).toBeVisible();
    const classRow = page.getByRole('link', { name: /Ver detalle de clase / }).first();
    await expect(classRow, 'Expected at least one seeded class row link on /clases').toBeVisible();
    await classRow.click();
    await expect(page).toHaveURL(/\/clases\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Alumnos asignados' })).toBeVisible();

    const malformedResponse = await page.goto('/miembros/not-a-uuid', {
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
    await expectDocumentOk(page, '/miembros');
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

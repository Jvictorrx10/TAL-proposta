import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openSite(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.hero-scooter')).toBeVisible();
  await expect.poll(() => page.locator('.hero-scooter').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
}

async function fillInquiry(page: Page) {
  await page.getByLabel('Seu nome', { exact: true }).fill('Marina Costa');
  await page.getByLabel('Sua cidade e estado', { exact: true }).fill('Curitiba, PR');
  await page.getByLabel('Sua mensagem', { exact: false }).fill('Procuro uma elétrica para o trajeto de casa ao trabalho.');
}

for (const width of [1440, 768, 390]) {
  test(`page renders without overflow or broken images at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openSite(page);
    await expect(page).toHaveTitle('TAL — Mobilidade Elétrica');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu próximo movimento.');
    for (const id of ['modelos', 'assistencia', 'contato']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    for (const image of await page.locator('img').all()) {
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('home connects the named models to the dedicated catalogue without renaming the illustrative hero', async ({ page }) => {
  await openSite(page);
  await expect(page.locator('.hero-scooter')).toHaveAttribute('src', '/images/scooter-ivory.webp');
  await expect(page.getByRole('link', { name: 'Explorar N9e', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo\/n9e$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  await page.getByRole('button', { name: 'Consultar N9e', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Vamos conhecer o N9e?' })).toBeVisible();
  await expect(page.getByLabel('Sua consulta', { exact: true })).toHaveValue(/modelo N9e/);
});

test('named model links and gallery controls remain keyboard operable', async ({ page }) => {
  await openSite(page);
  await page.getByRole('link', { name: 'Explorar A8', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A8');
  const zoom = page.getByRole('button', { name: 'Aproximar imagem', exact: true });
  await zoom.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1.25');
});

test('assistance details open and its action sets the right inquiry', async ({ page }) => {
  await openSite(page);
  const maintenance = page.locator('.service-list details').filter({ hasText: 'Manutenção' });
  await maintenance.locator('summary').click();
  await expect(maintenance).toHaveAttribute('open', '');
  await expect(maintenance.locator('p')).toBeVisible();
  await page.getByRole('button', { name: 'Converse sobre assistência' }).click();
  await expect(page.getByLabel('O que você procura?')).toHaveValue('Assistência e serviços');
});

test('inquiry rejects whitespace-only names and cities', async ({ page }) => {
  await openSite(page);
  await page.getByLabel('Seu nome', { exact: true }).fill('   ');
  await page.getByLabel('Sua cidade e estado').fill('Curitiba, PR');
  await page.getByRole('button', { name: 'Preparar minha consulta' }).click();
  await expect(page.getByRole('alert')).toContainText('Preencha seu nome');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Seu nome', { exact: true })).toBeFocused();
});

test('prepared inquiry copies the actual message', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openSite(page);
  await fillInquiry(page);
  await page.getByRole('button', { name: 'Preparar minha consulta' }).click();
  await page.getByRole('button', { name: 'Copiar consulta' }).click();
  await expect(page.getByRole('status')).toContainText('Consulta copiada');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Marina Costa');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Marina Costa');
});

test('clipboard failure selects the text for manual copying', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Clipboard unavailable'); } } }));
  await openSite(page);
  await fillInquiry(page);
  await page.getByRole('button', { name: 'Preparar minha consulta' }).click();
  await page.getByRole('button', { name: 'Copiar consulta' }).click();
  await expect(page.getByRole('status')).toContainText('Selecionei a mensagem');
  const textarea = page.getByLabel('Sua consulta', { exact: true });
  await expect(textarea).toBeFocused();
  expect(await textarea.evaluate((element) => { const field = element as HTMLTextAreaElement; return field.selectionEnd - field.selectionStart === field.value.length; })).toBe(true);
});

test('prepared message can be downloaded', async ({ page }) => {
  await openSite(page);
  await fillInquiry(page);
  await page.getByRole('button', { name: 'Preparar minha consulta' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar mensagem' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('minha-consulta-tal.txt');
  expect(await download.failure()).toBeNull();
});

test('mobile menu closes on navigation and Escape, retaining focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSite(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('link', { name: 'Modelos' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toHaveCount(0);
  await expect(page).toHaveURL(/#modelos$/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('reduced motion keeps all sections usable and disables the moving scooter', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  await expect(page.locator('.motion-section')).toHaveCSS('height', /px$/);
  const firstTransform = await page.locator('.motion-scooter').evaluate((element) => getComputedStyle(element).transform);
  await page.locator('#assistencia').scrollIntoViewIfNeeded();
  expect(await page.locator('.motion-scooter').evaluate((element) => getComputedStyle(element).transform)).toBe(firstTransform);
  for (const selector of ['.hero-description', '.home-model-list', '.service-content', '.contact-form']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
  }
  await fillInquiry(page);
  await page.getByRole('button', { name: 'Preparar minha consulta' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('scrolling moves the scooter in the mobility chapter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSite(page);
  await page.locator('#mobilidade').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY, behavior: 'instant' }));
  await page.waitForTimeout(1400);
  const before = await page.locator('.motion-scooter').evaluate((element) => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'instant' }));
  await expect.poll(() => page.locator('.motion-scooter').evaluate((element) => getComputedStyle(element).transform)).not.toBe(before);
});

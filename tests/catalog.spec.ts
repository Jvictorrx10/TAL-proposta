import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page), 'uncaught browser errors').toEqual([]);
});

async function openCatalog(page: Page) {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { level: 1, name: 'Sua próxima elétrica.', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Explorar (N9e|A8|N9)$/ })).toHaveCount(3);
}

async function openProduct(page: Page, model = 'N9e') {
  await page.goto(`/catalogo/${model.toLowerCase()}`);
  await expect(page.getByRole('heading', { level: 1, name: model, exact: true })).toBeVisible();
}

test('catalog and every model open directly, reload, and support back/forward navigation', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo\/n9e$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  await page.goBack();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('link', { name: 'Explorar N9e', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  for (const model of ['A8', 'N9']) {
    await openProduct(page, model);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(model);
  }
});

test('invalid colors, unsupported views and unrelated personal parameters become a clean URL', async ({ page }) => {
  await page.goto('/catalogo/n9e?cor=nao-confirmada&vista=lateral&telefone=41999999999&email=pessoa%40exemplo.com&token=privado#segredo');
  await expect(page).toHaveURL(/\/catalogo\/n9e$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  await expect(page.getByRole('button', { name: 'Ver geral', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Consultar N9e', exact: true }).click();
  const inquiry = page.getByRole('dialog', { name: 'Vamos conhecer o N9e?' });
  const text = await inquiry.getByLabel('Sua consulta', { exact: true }).inputValue();
  expect(text).toContain(`${new URL(page.url()).origin}/catalogo/n9e`);
  expect(text).not.toMatch(/41999999999|pessoa@exemplo\.com|privado|segredo|nao-confirmada|vista=|cor=/);
  expect(await page.evaluate(() => localStorage.getItem('tal.catalog.v1'))).not.toMatch(/telefone|email|token|segredo/);
});

test('unknown model and unknown nested route show a recoverable not-found screen', async ({ page }) => {
  for (const route of ['/catalogo/modelo-inexistente', '/catalogo/n9e/nao-existe']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: 'Vamos por outro caminho.', exact: true })).toBeVisible();
    await expect(page.getByText('Não encontramos esse modelo.', { exact: false })).toBeVisible();
    await expect(page.locator('.product-detail')).toHaveCount(0);
    await page.getByRole('link', { name: 'Ver catálogo', exact: true }).click();
    await expect(page.getByRole('link', { name: /^Explorar (N9e|A8|N9)$/ })).toHaveCount(3);
  }
});

test('comparison requires two models, accepts three, supports removal and survives reload', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('button', { name: 'Comparar N9e', exact: true }).click();
  const dock = page.getByRole('complementary', { name: 'Seleção para comparar' });
  await expect(dock.getByRole('button', { name: 'Comparar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  await expect(dock.getByRole('button', { name: 'Comparar', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Comparar N9', exact: true }).click();
  await expect(dock.locator('.comparison-count')).toHaveText('3');
  await dock.getByRole('button', { name: 'Comparar', exact: true }).click();
  const comparison = page.getByRole('dialog', { name: 'Lado a lado.' });
  await expect(comparison.getByRole('table')).toBeVisible();
  for (const model of ['N9e', 'A8', 'N9']) {
    await expect(comparison.getByRole('link', { name: model, exact: true })).toBeVisible();
  }
  await expect(comparison).toContainText('Consulte a equipe');
  await comparison.getByRole('button', { name: 'Remover A8 da comparação', exact: true }).click();
  await expect(comparison.getByRole('link', { name: 'A8', exact: true })).toHaveCount(0);
  await comparison.getByRole('button', { name: 'Fechar comparação', exact: true }).click();
  await page.reload();
  await expect(dock.locator('.comparison-count')).toHaveText('2');
  await expect(page.getByRole('button', { name: 'Comparar N9e', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Comparar A8', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Comparar N9', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dock.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(dock).toHaveCount(0);
});

test('saved choices can be filtered with the keyboard and persist between product and catalog', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('button', { name: 'Salvar preferência N9e', exact: true }).click();
  const filter = page.getByRole('button', { name: 'Minhas escolhas (1)', exact: true });
  await filter.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Ver todos os modelos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /^Explorar (N9e|A8|N9)$/ })).toHaveCount(1);
  await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preferência salva', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Preferência salva', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await expect(page.getByRole('button', { name: 'Ver todos os modelos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /^Explorar (N9e|A8|N9)$/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Remover preferência N9e', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu próximo favorito.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver todos os modelos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Explorar modelos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Minhas escolhas (0)', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('link', { name: /^Explorar (N9e|A8|N9)$/ })).toHaveCount(3);
});

test('clearing an open comparison does not reopen its dialog when another model is selected', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('button', { name: 'Comparar N9e', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  const dock = page.getByRole('complementary', { name: 'Seleção para comparar' });
  await dock.getByRole('button', { name: 'Comparar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Lado a lado.' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Limpar comparação', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(dock).toHaveCount(0);
  await page.getByRole('button', { name: 'Comparar N9', exact: true }).click();
  await expect(dock.locator('.comparison-count')).toHaveText('1');
  await expect(dock.getByRole('button', { name: 'Comparar', exact: true })).toBeDisabled();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  await expect(dock.getByRole('button', { name: 'Comparar', exact: true })).toBeEnabled();
  await expect(dialog).toHaveCount(0);
  await dock.getByRole('button', { name: 'Comparar', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'N9', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'A8', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'N9e', exact: true })).toHaveCount(0);
});

test('repeated current-view and reset actions do not add browser history entries', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
  const initialHistoryLength = await page.evaluate(() => window.history.length);
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByRole('button', { name: 'Ver geral', exact: true }).click();
    await page.getByRole('button', { name: 'Aproximar imagem', exact: true }).click();
    await expect(page.locator('.studio-zoom-value')).toHaveText('125%');
    await page.getByRole('button', { name: 'Restaurar vista', exact: true }).click();
    await expect(page.locator('.studio-zoom-value')).toHaveText('100%');
  }
  expect(await page.evaluate(() => window.history.length)).toBe(initialHistoryLength);
  await expect(page).toHaveURL(/\/catalogo\/n9e$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('link', { name: 'Explorar N9e', exact: true })).toBeVisible();
});

test('closing product and nested comparison inquiries restores focus to their openers', async ({ page }) => {
  await openProduct(page);
  const productOpener = page.getByRole('button', { name: 'Consultar N9e', exact: true });
  await productOpener.focus();
  await page.keyboard.press('Enter');
  const productInquiry = page.getByRole('dialog', { name: 'Vamos conhecer o N9e?' });
  await expect(productInquiry).toBeVisible();
  await productInquiry.getByLabel('Sua consulta', { exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(productInquiry).toHaveCount(0);
  await expect(productOpener).toBeFocused();
  await productOpener.click();
  await productInquiry.getByRole('button', { name: 'Fechar consulta', exact: true }).click();
  await expect(productOpener).toBeFocused();
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await page.getByRole('button', { name: 'Comparar N9e', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  const compareOpener = page.getByRole('complementary', { name: 'Seleção para comparar' }).getByRole('button', { name: 'Comparar', exact: true });
  await compareOpener.click();
  const comparison = page.getByRole('dialog', { name: 'Lado a lado.' });
  const inquiryOpener = comparison.getByRole('button', { name: 'Consultar esta seleção', exact: true });
  await inquiryOpener.click();
  const nestedInquiry = page.getByRole('dialog', { name: 'Vamos comparar?' });
  await expect(nestedInquiry).toBeVisible();
  await nestedInquiry.getByRole('button', { name: 'Fechar consulta', exact: true }).click();
  await expect(nestedInquiry).toHaveCount(0);
  await expect(inquiryOpener).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(comparison).toHaveCount(0);
  await expect(compareOpener).toBeFocused();
});

test('corrupt saved JSON resets safely without preventing new choices', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tal.catalog.v1', '{invalid-json'));
  await openCatalog(page);
  await expect(page.getByRole('button', { name: 'Minhas escolhas (0)', exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Seleção para comparar' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar preferência A8', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Minhas escolhas (1)', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    try {
      const state = JSON.parse(localStorage.getItem('tal.catalog.v1') || 'null');
      return state?.favorites?.includes('a8') && state?.comparison?.includes('a8');
    } catch { return false; }
  })).toBe(true);
});

test('blocked localStorage still permits in-memory choices, comparison and product navigation', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() { throw new DOMException('Storage is blocked', 'SecurityError'); },
  }));
  await openCatalog(page);
  await page.getByRole('button', { name: 'Salvar preferência N9e', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar N9e', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  const dock = page.getByRole('complementary', { name: 'Seleção para comparar' });
  await expect(dock.getByRole('button', { name: 'Comparar', exact: true })).toBeEnabled();
  await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preferência salva', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Salvar preferência', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(dock).toHaveCount(0);
});

test('copies a clean product link and contextual product/comparison messages without invented sales data', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openProduct(page);
  const origin = new URL(page.url()).origin;
  await page.getByRole('button', { name: 'Copiar link', exact: true }).click();
  await expect(page.locator('.share-status')).toContainText('Link copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}/catalogo/n9e`);
  await page.getByRole('button', { name: 'Consultar N9e', exact: true }).click();
  const productInquiry = page.getByRole('dialog', { name: 'Vamos conhecer o N9e?' });
  const productMessage = await productInquiry.getByLabel('Sua consulta', { exact: true }).inputValue();
  expect(productMessage).toContain('modelo N9e');
  expect(productMessage).toContain(`${origin}/catalogo/n9e`);
  expect(productMessage).toContain('confirmar as cores');
  expect(productMessage).not.toMatch(/\bem estoque\b|pronta entrega|R\$|\d+\s*(?:km|watts|wh)\b|wa\.me|tel:/i);
  await productInquiry.getByRole('button', { name: 'Copiar consulta', exact: true }).click();
  await expect(productInquiry.getByRole('status')).toContainText('Consulta copiada');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(productMessage);
  await productInquiry.getByRole('button', { name: 'Fechar consulta', exact: true }).click();
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await page.getByRole('button', { name: 'Comparar N9e', exact: true }).click();
  await page.getByRole('button', { name: 'Comparar A8', exact: true }).click();
  await page.getByRole('complementary', { name: 'Seleção para comparar' }).getByRole('button', { name: 'Comparar', exact: true }).click();
  await page.getByRole('button', { name: 'Consultar esta seleção', exact: true }).click();
  const comparisonInquiry = page.getByRole('dialog', { name: 'Vamos comparar?' });
  const comparisonMessage = await comparisonInquiry.getByLabel('Sua consulta', { exact: true }).inputValue();
  expect(comparisonMessage).toContain('N9e, A8');
  expect(comparisonMessage).toContain(`${origin}/catalogo/n9e`);
  expect(comparisonMessage).toContain(`${origin}/catalogo/a8`);
  expect(comparisonMessage).not.toMatch(/\bem estoque\b|pronta entrega|R\$|\d+\s*(?:km|watts|wh)\b|wa\.me|tel:/i);
  await comparisonInquiry.getByRole('button', { name: 'Copiar consulta', exact: true }).click();
  await expect(comparisonInquiry.getByRole('status')).toContainText('Consulta copiada');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(comparisonMessage);
  await expect(page.locator('a[href^="tel:"], a[href*="wa.me/"]')).toHaveCount(0);
});

test('clipboard failures expose selectable clean link and inquiry text instead of blocking the user', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('Clipboard blocked'); } },
  }));
  await openProduct(page, 'A8');
  await page.getByRole('button', { name: 'Copiar link', exact: true }).click();
  const linkField = page.getByLabel('Link da sua escolha', { exact: true });
  await expect(linkField).toBeFocused();
  await expect(linkField).toHaveValue(`${new URL(page.url()).origin}/catalogo/a8`);
  expect(await linkField.evaluate(element => {
    const input = element as HTMLInputElement;
    return input.selectionStart === 0 && input.selectionEnd === input.value.length;
  })).toBe(true);
  await page.getByRole('button', { name: 'Consultar A8', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Vamos conhecer o A8?' });
  await dialog.getByRole('button', { name: 'Copiar consulta', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Selecionei a mensagem');
  const text = dialog.getByLabel('Sua consulta', { exact: true });
  await expect(text).toBeFocused();
  expect(await text.evaluate(element => {
    const field = element as HTMLTextAreaElement;
    return field.selectionStart === 0 && field.selectionEnd === field.value.length;
  })).toBe(true);
});

test('illustrative product studies load and zoom honestly without fake views, colors or 3D', async ({ page }) => {
  for (const model of ['N9e', 'A8', 'N9']) {
    await openProduct(page, model);
    const studio = page.getByRole('region', { name: `Estúdio de produto ${model}`, exact: true });
    const image = studio.locator('.studio-stage > img');
    await expect(image).toHaveAttribute('src', `/images/studies/${model.toLowerCase()}-profile.webp`);
    await expect(image).toHaveAttribute('alt', /Estudo visual ilustrativo/);
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await expect(studio.getByText('Estudo visual ilustrativo. O modelo real pode ter diferenças.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Cor:/ })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Vistas do produto', exact: true }).getByRole('button')).toHaveCount(1);
    await expect(page.locator('canvas, model-viewer')).toHaveCount(0);
    await expect(page.getByText(/360°|arraste para girar|visualização 3D/i)).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Aproximar imagem', exact: true }).click();
  await expect(page.locator('.studio-zoom-value')).toHaveText('125%');
  await page.getByRole('button', { name: 'Restaurar vista', exact: true }).click();
  await expect(page.locator('.studio-zoom-value')).toHaveText('100%');
  await page.getByRole('button', { name: 'Ampliar visualização', exact: true }).click();
  const enlarged = page.getByRole('dialog', { name: 'Visualização ampliada — N9', exact: true });
  await expect(enlarged).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(enlarged).not.toBeVisible();
});

test('N9e gallery loads small thumbnails first and fetches a full perspective only when selected', async ({ page }) => {
  const requestedImages: string[] = [];
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith('/images/studies/')) requestedImages.push(pathname);
  });
  await openProduct(page);
  const studio = page.getByRole('region', { name: 'Estúdio de produto N9e', exact: true });
  const stage = studio.locator(':scope > .studio-stage');
  const mainImage = stage.locator('img');
  const gallery = studio.getByRole('group', { name: 'Galeria do modelo', exact: true });
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.getByRole('button')).toHaveCount(3);
  const thumbnailPaths = [
    '/images/studies/n9e-profile-thumb.webp',
    '/images/studies/n9e-front-study-thumb.webp',
    '/images/studies/n9e-rear-study-thumb.webp',
  ];
  for (let index = 0; index < thumbnailPaths.length; index++) {
    const thumbnail = gallery.locator('img').nth(index);
    await expect(thumbnail).toHaveAttribute('src', thumbnailPaths[index]);
    await expect.poll(() => thumbnail.evaluate(element => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth === 240 && image.naturalHeight === 160;
    })).toBe(true);
  }
  await expect(mainImage).toHaveAttribute('src', '/images/studies/n9e-profile.webp');
  await expect.poll(() => mainImage.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(requestedImages).toContain('/images/studies/n9e-profile.webp');
  for (const thumbnailPath of thumbnailPaths) expect(requestedImages).toContain(thumbnailPath);
  expect(requestedImages).not.toContain('/images/studies/n9e-front-study.webp');
  expect(requestedImages).not.toContain('/images/studies/n9e-rear-study.webp');

  const closer = studio.getByRole('button', { name: 'Aproximar imagem', exact: true });
  for (let index = 0; index < 4; index++) await closer.click();
  await expect(stage).toHaveAttribute('data-zoom', '2');
  await expect(closer).toBeDisabled();
  const frontThumbnail = gallery.getByRole('button', { name: /^Ver imagem 2:/ });
  await frontThumbnail.click();
  await expect(mainImage).toHaveAttribute('src', '/images/studies/n9e-front-study.webp');
  await expect.poll(() => mainImage.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(requestedImages).toContain('/images/studies/n9e-front-study.webp');
  expect(requestedImages).not.toContain('/images/studies/n9e-rear-study.webp');
  await expect(frontThumbnail).toHaveAttribute('aria-pressed', 'true');
  await expect(stage).toHaveAttribute('data-zoom', '2');
  await expect(page).toHaveURL(/\/catalogo\/n9e$/);
  await studio.getByRole('button', { name: 'Restaurar vista', exact: true }).click();
  await expect(mainImage).toHaveAttribute('src', '/images/studies/n9e-profile.webp');
  await expect(stage).toHaveAttribute('data-zoom', '1');
  await expect(studio.getByRole('button', { name: 'Afastar imagem', exact: true })).toBeDisabled();
  await expect(gallery.getByRole('button', { name: /^Ver imagem 1:/ })).toHaveAttribute('aria-pressed', 'true');
});

test('a failed N9e thumbnail falls back to its viable full image without removing the gallery item', async ({ page }) => {
  let failedThumbnailRequests = 0;
  await page.route('**/images/studies/n9e-front-study-thumb.webp', route => {
    failedThumbnailRequests++;
    return route.abort('failed');
  });
  await openProduct(page);
  const studio = page.getByRole('region', { name: 'Estúdio de produto N9e', exact: true });
  const gallery = studio.getByRole('group', { name: 'Galeria do modelo', exact: true });
  await gallery.scrollIntoViewIfNeeded();
  const frontThumbnail = gallery.getByRole('button', { name: /^Ver imagem 2:/ });
  const thumbnailImage = frontThumbnail.locator('img');
  await expect(thumbnailImage).toHaveAttribute('src', '/images/studies/n9e-front-study.webp');
  await expect.poll(() => thumbnailImage.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
  expect(failedThumbnailRequests).toBeGreaterThan(0);
  await expect(gallery.getByRole('button')).toHaveCount(3);
  await expect(studio.locator('.studio-error')).toHaveCount(0);
  await expect(studio.locator(':scope > .studio-stage > img')).toHaveAttribute('src', '/images/studies/n9e-profile.webp');
  await frontThumbnail.click();
  const selectedImage = studio.locator(':scope > .studio-stage > img');
  await expect(selectedImage).toHaveAttribute('src', '/images/studies/n9e-front-study.webp');
  await expect.poll(() => selectedImage.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await expect(frontThumbnail).toHaveAttribute('aria-pressed', 'true');
  await expect(gallery.getByRole('button')).toHaveCount(3);
  await expect(studio.locator('.studio-error')).toHaveCount(0);
});

test('location and external contact use the confirmed Instagram and number 4134', async ({ page }) => {
  await openCatalog(page);
  await expect(page.locator('address')).toHaveText('Avenida Jacob Macanhan, 4134Pinhais, Paraná');
  const map = page.getByRole('link', { name: /^Como chegar/ });
  const mapAddress = new URL((await map.getAttribute('href'))!);
  expect(mapAddress.origin).toBe('https://www.google.com');
  expect(mapAddress.searchParams.get('query')).toBe('Avenida Jacob Macanhan, 4134, Pinhais, Paraná');
  await expect(map).toHaveAttribute('target', '_blank');
  await expect(map).toHaveAttribute('rel', /noopener/);
  const instagram = page.getByRole('link', { name: /^Instagram/ });
  await expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/tal_mobilidade/');
  await expect(instagram).toHaveAttribute('target', '_blank');
  await expect(instagram).toHaveAttribute('rel', /noopener/);
  await expect(page.locator('body')).not.toContainText('4133');
});

test('catalog, product, comparison and mobile menu remain usable without viewport overflow', async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openCatalog(page);
    await page.evaluate(() => document.fonts.ready);
    for (const target of ['.catalog-intro', '.product-grid', '.catalog-location']) {
      await page.locator(target).scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px ${target}`).toBe(true);
    }
    for (const model of ['N9e', 'A8', 'N9']) {
      const toggle = page.getByRole('button', { name: `Comparar ${model}`, exact: true });
      if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
    }
    const dock = page.getByRole('complementary', { name: 'Seleção para comparar' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px dock`).toBe(true);
    await dock.getByRole('button', { name: 'Comparar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Lado a lado.' });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await dialog.getByRole('button', { name: 'Limpar comparação', exact: true }).click();
    await expect(dock).toHaveCount(0);
    await page.getByRole('link', { name: 'Explorar N9e', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('N9e');
    await page.locator('.product-information').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px product`).toBe(true);
    if (width === 390) {
      await expect(page.getByRole('button', { name: 'Consultar modelo', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      const menu = page.getByRole('navigation', { name: 'Navegação móvel', exact: true });
      await expect(menu).toBeVisible();
      await menu.getByRole('link', { name: 'Catálogo', exact: true }).click();
      await expect(page).toHaveURL(/\/catalogo$/);
      await expect(menu).toHaveCount(0);
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    }
  }
});

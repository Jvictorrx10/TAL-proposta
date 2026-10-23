import { test, expect } from '@playwright/test';

const fixturePath = '/tests/fixtures/studio.html';

test('empty product has honest typography and no controls pretending to show unavailable media', async ({ page }) => {
  await page.goto(`${fixturePath}?scenario=empty`);
  await expect(page.getByText('As imagens deste modelo estão em preparação.')).toBeVisible();
  await expect(page.locator('.studio-model-name')).toContainText('N9e');
  await expect(page.locator('.studio-toolbar')).toHaveCount(0);
  await expect(page.locator('.studio-gallery')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Aproximar|Afastar|Restaurar|Ampliar|Ver painel|3D|rotação/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Contato fora do estúdio' })).toBeVisible();
});

test('gallery exposes verified matching-color images and available view buttons only', async ({ page }) => {
  await page.goto(fixturePath);
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture branco-geral: retângulo de teste');
  await expect(page.getByRole('group', { name: 'Galeria do modelo' }).getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Ver traseira', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver painel', exact: true }).click();
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture branco-painel: retângulo de teste');
  await expect(page.getByRole('button', { name: 'Ver painel', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Ver imagem 2: Fixture branco-lateral: retângulo de teste', exact: true }).click();
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture branco-lateral: retângulo de teste');
  await expect(page.getByRole('button', { name: 'Ver lateral', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.studio img[src*="nao-verificada"]')).toHaveCount(0);
});

test('image zoom stops at 2x and restore resets zoom and view while preserving color', async ({ page }) => {
  await page.goto(fixturePath);
  await page.getByRole('button', { name: 'Cor azul de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Ver lateral', exact: true }).click();
  const closer = page.getByRole('button', { name: 'Aproximar imagem', exact: true });
  for (let index = 0; index < 4; index++) await closer.click();
  await expect(closer).toBeDisabled();
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '2');
  await page.getByRole('button', { name: 'Afastar imagem', exact: true }).click();
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1.75');
  await page.getByRole('button', { name: 'Restaurar vista', exact: true }).click();
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1');
  await expect(page.getByLabel('Seleção da fixture')).toHaveText('{"colorId":"azul","view":"geral"}');
  await expect(page.getByRole('button', { name: 'Afastar imagem', exact: true })).toBeDisabled();
});

test('color changes preserve zoom and an existing view, falling back honestly when the new color lacks that view', async ({ page }) => {
  await page.goto(fixturePath);
  await page.getByRole('button', { name: 'Ver lateral', exact: true }).click();
  await page.getByRole('button', { name: 'Aproximar imagem', exact: true }).click();
  await page.getByRole('button', { name: 'Cor azul de teste', exact: true }).click();
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture azul-lateral: retângulo de teste');
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1.25');
  await expect(page.getByLabel('Seleção da fixture')).toHaveText('{"colorId":"azul","view":"lateral"}');
  await page.getByRole('button', { name: 'Cor branca de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Ver painel', exact: true }).click();
  await page.getByRole('button', { name: 'Cor azul de teste', exact: true }).click();
  await expect(page.getByLabel('Seleção da fixture')).toHaveText('{"colorId":"azul","view":"geral"}');
  await expect(page.getByRole('button', { name: 'Ver painel', exact: true })).toHaveCount(0);
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1.25');
});

test('enlarged native dialog closes with Escape and close button without losing selection or zoom', async ({ page }) => {
  await page.goto(fixturePath);
  await page.getByRole('button', { name: 'Ver lateral', exact: true }).click();
  await page.getByRole('button', { name: 'Aproximar imagem', exact: true }).click();
  await page.getByRole('button', { name: 'Ampliar visualização', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Visualização ampliada — N9e — fixture sem produto real' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('alt', 'Fixture branco-lateral: retângulo de teste');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Ampliar visualização', exact: true })).toBeFocused();
  await expect(page.locator('.studio > .studio-stage')).toHaveAttribute('data-zoom', '1.25');
  await expect(page.getByLabel('Seleção da fixture')).toHaveText('{"colorId":"branco","view":"lateral"}');
  await page.getByRole('button', { name: 'Ampliar visualização', exact: true }).click();
  await dialog.getByRole('button', { name: 'Fechar visualização', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Contato fora do estúdio' })).toBeVisible();
});

test('failed image falls back to another verified image and leaves external contact usable', async ({ page }) => {
  await page.goto(`${fixturePath}?scenario=failover`);
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture alternativa-valida: retângulo de teste');
  await expect(page.locator('.studio').getByRole('status')).toContainText('Você pode continuar pelas outras imagens.');
  await expect.poll(() => page.locator('.studio-stage > img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'Contato fora do estúdio' }).click();
  await expect(page).toHaveURL(/#contato-fixture$/);
});

test('total media failure shows honest empty state, removes controls, and supports keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${fixturePath}?scenario=failure`);
  await expect(page.getByText('As imagens deste modelo estão em preparação.')).toBeVisible();
  await expect(page.locator('.studio-toolbar')).toHaveCount(0);
  await expect(page.locator('.studio').getByRole('status')).toContainText('Não foi possível carregar as imagens.');
  const contact = page.getByRole('link', { name: 'Contato fora do estúdio' });
  await contact.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contato-fixture$/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('private illustrative media is explicitly labelled inline and in the dialog without inventing 3D views', async ({ page }) => {
  await page.goto(`${fixturePath}?scenario=illustrative`);
  await expect(page.locator('.studio-stage > img')).toHaveAttribute('alt', 'Fixture estudo-ilustrativo: retângulo de teste');
  await expect(page.locator('.studio > .studio-illustrative-note')).toHaveText('Estudo visual ilustrativo. O modelo real pode ter diferenças.');
  await expect(page.getByRole('button', { name: /3D|360|Ver painel|Ver lateral/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ampliar visualização', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Estudo visual ilustrativo. O modelo real pode ter diferenças.')).toBeVisible();
});

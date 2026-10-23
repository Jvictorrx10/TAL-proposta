import assert from 'node:assert/strict';
import test from 'node:test';
import { getProduct, products } from '../src/catalog/data.ts';
import { availableViews, configurationMessage, loadCatalogState, normalizeCatalogState, normalizeProductIds, normalizeSelection, parseSelection, productPath, safeRead, safeWrite, saveCatalogState } from '../src/catalog/state.ts';
import type { CatalogProduct, StorageLike } from '../src/catalog/types.ts';

function fixture(): CatalogProduct {
  return {
    ...products[0],
    colors: [{ id: 'branco', name: 'Branco', hex: '#fff', approved: true }, { id: 'azul-simulado', name: 'Azul simulado', hex: '#00f', approved: false }],
    media: [
      { id: 'front', kind: 'image', src: '/fixture/front.webp', alt: 'Frente da unidade de teste', view: 'frente', colorId: 'branco', verified: true },
      { id: 'panel', kind: 'image', src: '/fixture/panel.webp', alt: 'Painel sem validação', view: 'painel', verified: false },
    ],
  };
}

function memoryStorage(): StorageLike {
  const entries = new Map<string, string>();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); } };
}

test('catalogue contains only the three supplied product names, without fabricated assets or specifications', () => {
  assert.deepEqual(products.map((product) => product.id), ['n9e', 'a8', 'n9']);
  for (const product of products) {
    assert.deepEqual(product.media, []);
    assert.deepEqual(product.colors, []);
    assert.deepEqual(product.specifications, []);
    assert.deepEqual(product.variants, []);
    assert.deepEqual(product.hotspots, []);
    assert.equal(product.viewer, null);
    assert.equal(product.identityStatus, 'pending');
    assert.ok(product.sources.every((source) => source.status === 'reference-only'));
  }
  assert.equal(getProduct('n9-marrom'), undefined);
  assert.equal(getProduct('__proto__'), undefined);
  assert.equal(getProduct(null), undefined);
});

test('only verified media and approved viewer views make inspection controls available', () => {
  const product = fixture();
  assert.deepEqual(availableViews(products[0]), ['geral']);
  assert.deepEqual(availableViews(product), ['geral', 'frente']);
  product.viewer = { kind: 'model-viewer', src: '/fixture/model.glb', alt: 'Modelo de teste', approved: true, views: ['lateral', 'painel'], sourceId: 'fixture', dimensionsVerified: false };
  assert.deepEqual(availableViews(product), ['geral', 'frente', 'lateral', 'painel']);
});

test('selection rejects unknown, unavailable and unapproved states', () => {
  const product = fixture();
  assert.deepEqual(normalizeSelection(product, { colorId: 'branco', view: 'frente' }), { colorId: 'branco', view: 'frente' });
  assert.deepEqual(normalizeSelection(product, { colorId: 'azul-simulado', view: 'painel' }), { colorId: null, view: 'geral' });
  for (const invalid of [null, [], 'frente', { colorId: '__proto__', view: 'traseira' }]) {
    assert.deepEqual(normalizeSelection(product, invalid), { colorId: null, view: 'geral' });
  }
});

test('share path round-trips only valid configuration and ignores personal or unrelated parameters', () => {
  const product = fixture();
  const selection = parseSelection(product, new URLSearchParams('cor=branco&vista=frente&nome=Marina&cidade=Curitiba'));
  assert.deepEqual(selection, { colorId: 'branco', view: 'frente' });
  assert.equal(productPath(product, selection), '/catalogo/n9e?cor=branco&vista=frente');
  assert.deepEqual(parseSelection(product, new URLSearchParams('cor=unknown&vista=unknown')), { colorId: null, view: 'geral' });
  assert.equal(productPath(product, { colorId: null, view: 'geral' }), '/catalogo/n9e');
});

test('contact query includes chosen product and requests availability without leaking URL details', () => {
  const product = fixture();
  const message = configurationMessage(product, { colorId: 'branco', view: 'frente' }, 'https://user:password@example.test/old?nome=Marina&telefone=555#private');
  assert.match(message, /modelo N9e/);
  assert.match(message, /preferência de cor é Branco/);
  assert.match(message, /confirmar a disponibilidade/);
  assert.match(message, /https:\/\/example\.test\/catalogo\/n9e\?cor=branco&vista=frente/);
  assert.doesNotMatch(message, /Marina|555|password|user:|private|estoque garantido/);
  assert.doesNotMatch(configurationMessage(product, { colorId: null, view: 'geral' }, 'javascript:alert(1)'), /javascript:/);
  assert.doesNotThrow(() => configurationMessage(product, { colorId: null, view: 'geral' }, 'invalid url'));
});

test('storage access failures and invalid JSON return safe defaults', () => {
  const blocked: StorageLike = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(safeRead(blocked, 'test', 'default'), 'default');
  assert.equal(safeWrite(blocked, 'test', { value: 1 }), false);
  assert.equal(safeWrite(null, 'test', {}), false);
  const storage = memoryStorage();
  storage.setItem('bad', '{');
  assert.equal(safeRead(storage, 'bad', 'default'), 'default');
  storage.setItem('wrong-type', '[]');
  assert.equal(safeRead(storage, 'wrong-type', 'default', (value): value is string => typeof value === 'string'), 'default');
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  assert.equal(safeWrite(storage, 'test', circular), false);
});

test('saved state rejects removed IDs, duplicates, bad selections and unsafe scroll values', () => {
  const state = normalizeCatalogState({
    comparison: ['n9e', 'n9e', 'n9-marrom', 'a8', 'n9', 'extra'],
    favorites: ['n9', 'unknown'],
    selections: { n9e: { colorId: 'fake', view: 'painel' }, unknown: { colorId: 'fake' } },
    catalogScrollY: -1,
  });
  assert.deepEqual(state.comparison, ['n9e', 'a8', 'n9']);
  assert.deepEqual(state.favorites, ['n9']);
  assert.deepEqual(state.selections, { n9e: { colorId: null, view: 'geral' } });
  assert.equal(state.catalogScrollY, 0);
  assert.equal(normalizeCatalogState({ catalogScrollY: Infinity }).catalogScrollY, 0);
  assert.deepEqual(normalizeProductIds(['n9e', 'a8', 'n9'], 2), ['n9e', 'a8']);
  assert.deepEqual(normalizeProductIds(['n9e'], 0), []);
  assert.deepEqual(normalizeProductIds(['n9e'], -1), []);
});

test('catalogue state persists sanitized preferences and remains usable when storage is unavailable', () => {
  const storage = memoryStorage();
  assert.equal(saveCatalogState(storage, { showFavorites: true, comparison: ['a8'], favorites: ['n9'], selections: { a8: { view: 'geral', colorId: null } }, catalogScrollY: 400 }), true);
  assert.deepEqual(loadCatalogState(storage), { showFavorites: true, comparison: ['a8'], favorites: ['n9'], selections: { a8: { view: 'geral', colorId: null } }, catalogScrollY: 400 });
  assert.deepEqual(loadCatalogState(null), { showFavorites: false, comparison: [], favorites: [], selections: {}, catalogScrollY: 0 });
  assert.equal(normalizeCatalogState({ showFavorites: 'true' }).showFavorites, false);
});

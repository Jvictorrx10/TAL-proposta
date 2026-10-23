import { getProduct, products } from './data.ts';
import type { CatalogProduct, ProductId, ProductSelection, ProductViewId, SavedCatalogState, StorageLike } from './types.ts';

const viewOrder: ProductViewId[] = ['geral', 'frente', 'lateral', 'traseira', 'painel'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function availableViews(product: CatalogProduct): ProductViewId[] {
  const supported = new Set<ProductViewId>(['geral']);
  for (const media of product.media) {
    if (media.verified && media.src.trim()) supported.add(media.view);
  }
  if (product.viewer?.approved) {
    for (const view of product.viewer.views) supported.add(view);
  }
  return viewOrder.filter((view) => supported.has(view));
}

export function normalizeSelection(product: CatalogProduct, input: unknown): ProductSelection {
  const candidate = isRecord(input) ? input : {};
  const color = product.colors.find((option) => option.approved && option.id === candidate.colorId);
  const view = availableViews(product).find((option) => option === candidate.view) ?? 'geral';
  return { colorId: color?.id ?? null, view };
}

export function parseSelection(product: CatalogProduct, params: URLSearchParams): ProductSelection {
  return normalizeSelection(product, { colorId: params.get('cor'), view: params.get('vista') });
}

export function productPath(product: CatalogProduct, selection: ProductSelection): string {
  const normalized = normalizeSelection(product, selection);
  const params = new URLSearchParams();
  if (normalized.colorId) params.set('cor', normalized.colorId);
  if (normalized.view !== 'geral') params.set('vista', normalized.view);
  const query = params.toString();
  return `/catalogo/${product.id}${query ? `?${query}` : ''}`;
}

export function configurationMessage(product: CatalogProduct, selection: ProductSelection, url: string): string {
  const normalized = normalizeSelection(product, selection);
  const color = product.colors.find((option) => option.id === normalized.colorId);
  const lines = [`Olá, TAL! Tenho interesse em conhecer o modelo ${product.name}.`];
  if (color) lines.push(`Minha preferência de cor é ${color.name}. Gostaria de confirmar a disponibilidade dessa opção.`);
  else lines.push('Gostaria de confirmar as cores e opções disponíveis.');
  lines.push('Podem me contar mais sobre este modelo e as condições de atendimento?');
  try {
    const origin = new URL(url);
    if (origin.protocol === 'https:' || origin.protocol === 'http:') {
      // Rebuild the path and query from validated product state. Personal data,
      // credentials, unrelated query parameters and fragments are not copied.
      lines.push(`Minha configuração: ${origin.origin}${productPath(product, normalized)}`);
    }
  } catch {
    // A malformed share URL must not prevent the customer from copying a query.
  }
  return lines.join('\n\n');
}

export function safeRead<T>(storage: StorageLike | null | undefined, key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  try {
    const raw = storage?.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const value: unknown = JSON.parse(raw);
    if (validate && !validate(value)) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

export function safeWrite(storage: StorageLike | null | undefined, key: string, value: unknown): boolean {
  try {
    if (!storage) return false;
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return false;
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function normalizeProductIds(input: unknown, limit = 3): ProductId[] {
  if (!Array.isArray(input)) return [];
  const ids: ProductId[] = [];
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.min(3, Math.floor(limit))) : 3;
  for (const candidate of input) {
    const product = getProduct(candidate);
    if (product && !ids.includes(product.id) && ids.length < safeLimit) ids.push(product.id);
  }
  return ids;
}

export function normalizeCatalogState(input: unknown): SavedCatalogState {
  const candidate = isRecord(input) ? input : {};
  const selectionInput = isRecord(candidate.selections) ? candidate.selections : {};
  const selections: SavedCatalogState['selections'] = {};
  for (const product of products) {
    if (Object.hasOwn(selectionInput, product.id)) selections[product.id] = normalizeSelection(product, selectionInput[product.id]);
  }
  const catalogScrollY = typeof candidate.catalogScrollY === 'number' && Number.isFinite(candidate.catalogScrollY) ? Math.max(0, candidate.catalogScrollY) : 0;
  return {
    showFavorites: candidate.showFavorites === true,
    comparison: normalizeProductIds(candidate.comparison),
    favorites: normalizeProductIds(candidate.favorites),
    selections,
    catalogScrollY,
  };
}

export function loadCatalogState(storage: StorageLike | null | undefined, key = 'tal.catalog.v1'): SavedCatalogState {
  return normalizeCatalogState(safeRead<unknown>(storage, key, null));
}

export function saveCatalogState(storage: StorageLike | null | undefined, value: unknown, key = 'tal.catalog.v1'): boolean {
  return safeWrite(storage, key, normalizeCatalogState(value));
}

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loadCatalogState, normalizeCatalogState, normalizeSelection, saveCatalogState } from './state';
import type { CatalogProduct, ProductId, ProductSelection, SavedCatalogState } from './types';

function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function trackIntent(type: 'product_open' | 'color_select' | 'view_select' | 'comparison_select' | 'preference_save' | 'contact_prepare' | 'configuration_share', detail: { productId?: ProductId; colorId?: string | null; view?: string; count?: number } = {}) {
  // Local integration point only. No analytics requests or personal data.
  window.dispatchEvent(new CustomEvent('tal:intent', { detail: { type, ...detail } }));
}

type CatalogContextValue = {
  state: SavedCatalogState;
  toggleComparison: (id: ProductId) => void;
  clearComparison: () => void;
  toggleFavorite: (product: CatalogProduct, selection: ProductSelection) => void;
  rememberSelection: (product: CatalogProduct, selection: ProductSelection) => void;
  rememberScroll: (y: number) => void;
  setShowFavorites: (enabled: boolean) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => loadCatalogState(browserStorage()));
  useEffect(() => { saveCatalogState(browserStorage(), state); }, [state]);

  function toggleComparison(id: ProductId) {
    setState(previous => normalizeCatalogState({ ...previous, comparison: previous.comparison.includes(id) ? previous.comparison.filter(item => item !== id) : [...previous.comparison, id] }));
    trackIntent('comparison_select', { productId: id });
  }
  function toggleFavorite(product: CatalogProduct, selection: ProductSelection) {
    setState(previous => ({ ...previous, favorites: previous.favorites.includes(product.id) ? previous.favorites.filter(id => id !== product.id) : [...previous.favorites, product.id], selections: { ...previous.selections, [product.id]: normalizeSelection(product, selection) } }));
    trackIntent('preference_save', { productId: product.id });
  }
  function rememberSelection(product: CatalogProduct, selection: ProductSelection) {
    const value = normalizeSelection(product, selection);
    setState(previous => {
      const stored = previous.selections[product.id];
      if (stored?.colorId === value.colorId && stored?.view === value.view) return previous;
      return { ...previous, selections: { ...previous.selections, [product.id]: value } };
    });
  }
  function rememberScroll(y: number) { setState(previous => ({ ...previous, catalogScrollY: Math.max(0, y) })); }

  return <CatalogContext.Provider value={{ state, toggleComparison, clearComparison: () => setState(previous => ({ ...previous, comparison: [] })), toggleFavorite, rememberSelection, rememberScroll, setShowFavorites: enabled => setState(previous => ({ ...previous, showFavorites: enabled })) }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('CatalogProvider is required');
  return context;
}

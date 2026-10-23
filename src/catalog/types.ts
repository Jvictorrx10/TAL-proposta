export type ProductId = 'n9e' | 'a8' | 'n9';
export type ProductViewId = 'geral' | 'frente' | 'lateral' | 'traseira' | 'painel';

export type ProductMedia = {
  id: string;
  kind: 'image' | 'video';
  src: string;
  thumbnailSrc?: string;
  alt: string;
  view: ProductViewId;
  colorId?: string;
  verified: boolean;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  approved: boolean;
};

export type ProductSpecification = {
  label: string;
  value: string;
  unit?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  confirmed: boolean;
  colorIds: string[];
  specifications: ProductSpecification[];
};

export type ProductSource = {
  id: string;
  title: string;
  reference: string;
  kind: 'owner-reference' | 'manufacturer' | 'authorized-media';
  status: 'reference-only' | 'confirmed';
  notes: string;
};

export type ProductHotspot = {
  id: string;
  title: string;
  description: string;
  view: ProductViewId;
  position: string;
  normal: string;
  mediaId?: string;
  verified: boolean;
};

export type ApprovedProductViewer = {
  kind: 'model-viewer';
  src: string;
  poster?: string;
  alt: string;
  approved: true;
  views: ProductViewId[];
  sourceId: string;
  dimensionsVerified: boolean;
};

export type CatalogProduct = {
  id: ProductId;
  name: string;
  summary: string;
  description: string;
  observations: string[];
  media: ProductMedia[];
  colors: ProductColor[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  hotspots: ProductHotspot[];
  viewer: ApprovedProductViewer | null;
  identityStatus: 'pending' | 'confirmed';
  sources: ProductSource[];
};

export type ProductSelection = {
  colorId: string | null;
  view: ProductViewId;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type SavedCatalogState = {
  showFavorites: boolean;
  comparison: ProductId[];
  favorites: ProductId[];
  selections: Partial<Record<ProductId, ProductSelection>>;
  catalogScrollY: number;
};

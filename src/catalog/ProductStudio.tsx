import { useEffect, useId, useRef, useState } from 'react';
import type { CatalogProduct, ProductMedia, ProductSelection, ProductViewId } from './types.ts';

export type ProductStudioProps = {
  product: CatalogProduct;
  selection: ProductSelection;
  onSelectionChange: (selection: ProductSelection) => void;
  illustrativeMedia?: ProductMedia[];
};

const viewLabels: Record<ProductViewId, string> = {
  geral: 'Ver geral',
  frente: 'Ver frente',
  lateral: 'Ver lateral',
  traseira: 'Ver traseira',
  painel: 'Ver painel',
};

const viewOrder: ProductViewId[] = ['geral', 'frente', 'lateral', 'traseira', 'painel'];

function mediaKey(product: CatalogProduct, media: ProductMedia): string {
  return `${product.id}:${media.id}:${media.src}`;
}

export function ProductStudio({ product, selection, onSelectionChange, illustrativeMedia = [] }: ProductStudioProps) {
  const [zoom, setZoom] = useState(1);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [failedMedia, setFailedMedia] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogHeading = useId();
  const verifiedMedia = product.media.filter((media) => media.verified && media.src.trim()
    && (!media.colorId || media.colorId === selection.colorId)
    && !failedMedia.includes(mediaKey(product, media)));
  const studyMedia = illustrativeMedia.filter((media) => media.src.trim()
    && (!media.colorId || media.colorId === selection.colorId)
    && !failedMedia.includes(mediaKey(product, media)));
  const illustrative = verifiedMedia.length === 0 && studyMedia.length > 0;
  const eligibleMedia = verifiedMedia.length > 0 ? verifiedMedia : studyMedia;
  const views = viewOrder.filter((view) => view === 'geral' || eligibleMedia.some((media) => media.view === view));
  const matchingView = eligibleMedia.filter((media) => media.view === selection.view);
  const candidates = matchingView.length ? matchingView : eligibleMedia;
  const activeMedia = candidates.find((media) => media.id === activeMediaId) ?? candidates[0];

  useEffect(() => {
    setZoom(1);
    setActiveMediaId(null);
    setFailedMedia([]);
    setDialogOpen(false);
    dialog.current?.close();
  }, [product.id]);

  useEffect(() => {
    if (!views.includes(selection.view)) onSelectionChange({ ...selection, view: 'geral' });
  }, [views, selection, onSelectionChange]);

  function markFailed(media: ProductMedia) {
    const key = mediaKey(product, media);
    setFailedMedia((previous) => previous.includes(key) ? previous : [...previous, key]);
  }

  function changeView(view: ProductViewId) {
    setActiveMediaId(null);
    onSelectionChange({ ...selection, view });
  }

  function restoreView() {
    setZoom(1);
    setActiveMediaId(null);
    onSelectionChange({ ...selection, view: 'geral' });
  }

  function renderMedia(enlarged = false) {
    if (!activeMedia) return <div className="studio-placeholder">
      <span className="studio-model-name" aria-hidden="true">{product.name}</span>
      <p>As imagens deste modelo estão em preparação.</p>
    </div>;

    if (activeMedia.kind === 'video') return <video
      key={`${activeMedia.id}-${enlarged ? 'dialog' : 'inline'}`}
      className="studio-media studio-video"
      src={activeMedia.src}
      aria-label={activeMedia.alt}
      controls
      playsInline
      preload="metadata"
      onError={() => markFailed(activeMedia)}
    ><p>Seu navegador não conseguiu reproduzir este vídeo.</p></video>;

    return <img
      key={`${activeMedia.id}-${enlarged ? 'dialog' : 'inline'}`}
      className="studio-media studio-image"
      src={activeMedia.src}
      alt={activeMedia.alt}
      style={{ transform: `scale(${zoom})` }}
      onError={() => markFailed(activeMedia)}
    />;
  }

  return <section className="studio" aria-label={`Estúdio de produto ${product.name}`}>
    <div className="studio-stage" data-zoom={zoom} data-view={selection.view}>
      {renderMedia()}
    </div>

    {illustrative && <p className="studio-illustrative-note">Estudo visual ilustrativo. O modelo real pode ter diferenças.</p>}

    {failedMedia.length > 0 && <p className="studio-error" role="status">
      {activeMedia ? 'Uma imagem não pôde ser carregada. Você pode continuar pelas outras imagens.' : 'Não foi possível carregar as imagens. Você pode continuar consultando as informações do modelo.'}
    </p>}

    {activeMedia && <>
      <div className="studio-toolbar" aria-label="Controles de visualização">
        <div className="studio-views" role="group" aria-label="Vistas do produto">
          {views.map((view) => <button
            key={view}
            className="studio-view-button"
            type="button"
            aria-pressed={selection.view === view}
            onClick={() => changeView(view)}
          >{viewLabels[view]}</button>)}
        </div>
        {activeMedia.kind === 'image' && <div className="studio-zoom" role="group" aria-label="Aproximação da imagem">
          <button type="button" className="studio-zoom-button" aria-label="Afastar imagem" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.25))}>−</button>
          <span className="studio-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" className="studio-zoom-button" aria-label="Aproximar imagem" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))}>+</button>
        </div>}
        <button type="button" className="studio-reset" onClick={restoreView}>Restaurar vista</button>
        <button type="button" className="studio-expand" onClick={() => { setDialogOpen(true); dialog.current?.showModal(); }}>Ampliar visualização</button>
      </div>

      {eligibleMedia.length > 1 && <div className="studio-gallery" role="group" aria-label="Galeria do modelo">
        {eligibleMedia.map((media, index) => <button
          key={media.id}
          className="studio-thumbnail"
          type="button"
          aria-label={`Ver ${media.kind === 'image' ? 'imagem' : 'vídeo'} ${index + 1}: ${media.alt}`}
          aria-pressed={activeMedia.id === media.id}
          onClick={() => { setActiveMediaId(media.id); onSelectionChange({ ...selection, view: media.view }); }}
        >
          {media.kind === 'image' ? <img src={media.thumbnailSrc ?? media.src} alt="" loading="lazy" onError={(event) => { if (media.thumbnailSrc && event.currentTarget.getAttribute('src') === media.thumbnailSrc) event.currentTarget.src = media.src; else markFailed(media); }} /> : <span className="studio-video-label">Vídeo</span>}
          <span className="studio-thumbnail-caption">{media.kind === 'image' ? 'Imagem' : 'Vídeo'} {index + 1}</span>
        </button>)}
      </div>}
      <p className="studio-note">Explore as imagens disponíveis deste modelo.</p>
    </>}

    <dialog ref={dialog} className="studio-dialog" aria-labelledby={dialogHeading} onClose={() => setDialogOpen(false)}>
      <div className="studio-dialog-header"><h2 id={dialogHeading}>Visualização ampliada — {product.name}</h2><button type="button" className="studio-close" onClick={() => dialog.current?.close()}>Fechar visualização</button></div>
      {dialogOpen && <>
        <div className="studio-stage studio-stage-expanded" data-zoom={zoom} data-view={selection.view}>{renderMedia(true)}</div>
        {illustrative && <p className="studio-illustrative-note">Estudo visual ilustrativo. O modelo real pode ter diferenças.</p>}
      </>}
    </dialog>
  </section>;
}

export default ProductStudio;

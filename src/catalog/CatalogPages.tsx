import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Arrow, Brand, Lightning } from '../ui/Primitives';
import { products, getProduct } from './data';
import { configurationMessage, normalizeSelection, parseSelection, productPath } from './state';
import { trackIntent, useCatalog } from './context';
import type { CatalogProduct, ProductSelection } from './types';
import { ProductStudio } from './ProductStudio';
import { visualStudies } from './studies';

const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Avenida Jacob Macanhan, 4134, Pinhais, Paraná');
const instagram = 'https://www.instagram.com/tal_mobilidade/';

function CatalogHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menu = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.current?.querySelector('a')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus(); }
      if (event.key === 'Tab') {
        const items = [button.current, ...Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].filter(Boolean) as HTMLElement[];
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', keydown); };
  }, [open]);
  return <>
    <header className="site-header"><Link to="/" className="brand-link" aria-label="TAL — início"><Brand /></Link><nav className="desktop-nav" aria-label="Navegação principal"><Link to="/">Início</Link><Link to="/catalogo" aria-current="page">Catálogo</Link><Link to="/#assistencia">Assistência</Link></nav><Link to="/#contato" className="button button-dark header-cta">Fale com a TAL <Arrow /></Link><button ref={button} type="button" className={`menu-button ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls="catalog-mobile-menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}><span /><span /></button></header>
    {open && <nav ref={menu} id="catalog-mobile-menu" className="mobile-nav" aria-label="Navegação móvel"><Link to="/" onClick={() => setOpen(false)}>Início <Arrow /></Link><Link to="/catalogo" onClick={() => setOpen(false)}>Catálogo <Arrow /></Link><Link to="/#assistencia" onClick={() => setOpen(false)}>Assistência <Arrow /></Link><Link to="/#contato" onClick={() => setOpen(false)}>Contato <Arrow /></Link><span className="mobile-nav-note">TAL. Pinhais e região.</span></nav>}
  </>;
}

function LocationBlock() {
  return <section className="catalog-location" aria-labelledby="location-heading"><div><h2 id="location-heading">De Pinhais.<br />Para o seu caminho.</h2><p>Conheça a TAL e converse de perto sobre a sua próxima elétrica.</p></div><div className="location-address"><span className="location-symbol" aria-hidden="true"><Lightning /></span><address>Avenida Jacob Macanhan, 4134<br />Pinhais, Paraná</address><p>Consulte o horário com a equipe.</p><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="catalog-text-link">Como chegar <Arrow /><span className="sr-only">(abre em outra aba)</span></a></div></section>;
}

function CatalogFooter() {
  return <footer className="footer"><div className="footer-main"><Link to="/" aria-label="TAL — início"><Brand footer /></Link><p>Seu próximo<br />movimento é elétrico.</p><nav aria-label="Navegação do rodapé"><Link to="/catalogo">Catálogo</Link><Link to="/#assistencia">Assistência</Link><a href={instagram} target="_blank" rel="noopener noreferrer">Instagram<span className="sr-only"> (abre em outra aba)</span></a></nav></div><div className="footer-bottom"><span>TAL Mobilidade Elétrica · Pinhais</span><span>Prévia para revisão · Estudos visuais ilustrativos</span></div></footer>;
}

function CopyDialog({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const modal = ref.current;
    modal?.showModal();
    return () => {
      modal?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('Consulta copiada. Você já pode compartilhar a mensagem.'); }
    catch { field.current?.focus(); field.current?.select(); setStatus('Selecionei a mensagem. Use a opção Copiar do seu dispositivo.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'consulta-tal.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <dialog ref={ref} className="inquiry-dialog catalog-inquiry" aria-labelledby="catalog-inquiry-title" onCancel={onClose} onClick={event => { if (event.currentTarget === event.target) onClose(); }}><button className="dialog-close" type="button" aria-label="Fechar consulta" onClick={onClose}>×</button><Lightning className="dialog-lightning" /><h2 id="catalog-inquiry-title">{title}</h2><p>Leve sua escolha para a conversa com a TAL. A mensagem fica pronta para você copiar e compartilhar.</p><label htmlFor="catalog-inquiry-text">Sua consulta</label><textarea ref={field} id="catalog-inquiry-text" rows={8} value={text} readOnly /><div className="dialog-actions"><button type="button" className="button button-dark" onClick={copy}>Copiar consulta <Arrow /></button><button type="button" className="text-button" onClick={download}>Baixar mensagem</button></div><p className="copy-status" role="status">{status}</p><a href={instagram} className="catalog-text-link" target="_blank" rel="noopener noreferrer">Abrir Instagram da TAL <Arrow /><span className="sr-only">(abre em outra aba)</span></a></dialog>;
}

function Comparison({ onClose }: { onClose: () => void }) {
  const { state, toggleComparison, clearComparison } = useCatalog();
  const selected = state.comparison.map(id => getProduct(id)!).filter(Boolean);
  const ref = useRef<HTMLDialogElement>(null);
  const [inquiry, setInquiry] = useState(false);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const modal = ref.current;
    modal?.showModal();
    return () => {
      modal?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
    };
  }, []);
  const labels = [...new Set(selected.flatMap(product => product.specifications.map(item => item.label)))];
  const rows = labels.length ? labels : ['Autonomia', 'Bateria', 'Motorização'];
  const message = `Olá, TAL! Gostaria de conhecer e comparar os modelos ${selected.map(product => product.name).join(', ')}.\n\nPodem me ajudar a entender as versões, as cores e as características de cada um?\n\n` + selected.map(product => `${product.name}: ${window.location.origin}${productPath(product, state.selections[product.id] ?? { colorId: null, view: 'geral' })}`).join('\n');
  return <><dialog ref={ref} className="comparison-dialog" aria-labelledby="comparison-heading" onCancel={onClose} onClick={event => { if (event.currentTarget === event.target) onClose(); }}><div className="comparison-heading"><div><h2 id="comparison-heading">Lado a lado.</h2><p>Sua seleção, para uma conversa mais clara.</p></div><button type="button" className="dialog-close" aria-label="Fechar comparação" onClick={onClose}>×</button></div>
    {selected.length ? <><div className="comparison-scroll" tabIndex={0} role="region" aria-label="Tabela de comparação"><table><thead><tr><th scope="col">Modelo</th>{selected.map(product => <th scope="col" key={product.id}><Link to={productPath(product, state.selections[product.id] ?? { colorId: null, view: 'geral' })} onClick={onClose}>{product.name}</Link><button className="comparison-remove" type="button" aria-label={`Remover ${product.name} da comparação`} onClick={() => toggleComparison(product.id)}>Remover</button></th>)}</tr></thead><tbody><tr><th scope="row">Cores</th>{selected.map(product => <td key={product.id}>{product.colors.filter(color => color.approved).map(color => color.name).join(', ') || 'Consulte a equipe'}</td>)}</tr>{rows.map(label => <tr key={label}><th scope="row">{label}</th>{selected.map(product => { const spec = product.specifications.find(item => item.label === label); return <td key={product.id}>{spec ? `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}` : 'Consulte a equipe'}</td>; })}</tr>)}</tbody></table></div><p className="comparison-note">A TAL confirma a ficha técnica, as versões e as opções disponíveis de cada modelo.</p><div className="comparison-actions"><button className="button button-dark" type="button" onClick={() => { trackIntent('contact_prepare', { count: selected.length }); setInquiry(true); }}>Consultar esta seleção <Arrow /></button><button className="text-button" type="button" onClick={clearComparison}>Limpar comparação</button></div></> : <div className="catalog-empty"><p>Sua comparação está vazia.</p><button type="button" className="button button-dark" onClick={onClose}>Escolher modelos</button></div>}
  </dialog>{inquiry && <CopyDialog title="Vamos comparar?" text={message} onClose={() => setInquiry(false)} />}</>;
}

function ComparisonDock() {
  const { state, clearComparison } = useCatalog();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!state.comparison.length) setOpen(false); }, [state.comparison.length]);
  if (!state.comparison.length) return null;
  return <><aside className="comparison-dock" aria-label="Seleção para comparar"><div><span className="comparison-count">{state.comparison.length}</span><p>{state.comparison.map(id => getProduct(id)?.name).join(' + ')}<small>{state.comparison.length < 2 ? 'Escolha mais um modelo para comparar.' : 'Prontos para olhar lado a lado.'}</small></p></div><div><button className="dock-clear" type="button" onClick={clearComparison}>Limpar</button><button type="button" className="button button-light" disabled={state.comparison.length < 2} onClick={() => setOpen(true)}>Comparar <Arrow /></button></div></aside>{open && <Comparison onClose={() => setOpen(false)} />}</>;
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { state, toggleComparison, rememberScroll, toggleFavorite } = useCatalog();
  const selection = state.selections[product.id] ?? { colorId: null, view: 'geral' as const };
  const image = product.media.find(media => media.verified && media.kind === 'image');
  const study = visualStudies[product.id][0];
  return <article className="product-card"><Link to={productPath(product, selection)} className="product-card-image" onClick={() => rememberScroll(window.scrollY)} aria-label={`Explorar ${product.name}`}><span className="product-card-type" aria-hidden="true">{product.name}</span>{imageFailed ? <span className="product-card-unavailable">Imagens em preparação</span> : <img src={(image ?? study).src} alt={(image ?? study).alt} width="1536" height="1024" loading="lazy" onError={() => setImageFailed(true)} />}<span className="product-card-caption">{image ? 'Conheça de perto' : 'Estudo visual ilustrativo'}<Arrow /></span></Link><div className="product-card-heading"><h2><Link to={productPath(product, selection)} onClick={() => rememberScroll(window.scrollY)}>{product.name}</Link></h2><button type="button" className="favorite-button" aria-label={`${state.favorites.includes(product.id) ? 'Remover preferência' : 'Salvar preferência'} ${product.name}`} aria-pressed={state.favorites.includes(product.id)} onClick={() => toggleFavorite(product, selection)}><svg viewBox="0 0 24 24" fill={state.favorites.includes(product.id) ? 'currentColor' : 'none'} aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" stroke="currentColor" strokeWidth="1.5" /></svg></button></div><p>Consulte versões, cores e detalhes com a TAL.</p><div className="product-card-bottom"><span>Cores sob consulta</span><button type="button" className="compare-toggle" aria-label={`Comparar ${product.name}`} aria-pressed={state.comparison.includes(product.id)} onClick={() => toggleComparison(product.id)}><span aria-hidden="true">{state.comparison.includes(product.id) ? '✓' : '+'}</span>Comparar</button></div></article>;
}

function CatalogPage() {
  const { state, setShowFavorites: setOnlySaved } = useCatalog();
  const onlySaved = state.showFavorites;
  const displayed = onlySaved ? products.filter(product => state.favorites.includes(product.id)) : products;
  return <>
    <section className="catalog-intro catalog-container"><nav className="breadcrumbs" aria-label="Caminho"><Link to="/">Início</Link><span aria-hidden="true">/</span><span>Catálogo</span></nav><div className="catalog-intro-grid"><h1 tabIndex={-1}>Sua próxima<br />elétrica.</h1><div><p>N9e, A8 ou N9.<br />Conheça as possibilidades e converse com a TAL sobre o seu próximo caminho.</p><span>Pinhais, Curitiba e região.</span></div></div></section>
    <section className="catalog-grid-section catalog-container" aria-label="Modelos TAL"><div className="catalog-toolbar"><p>{displayed.length} {displayed.length === 1 ? 'modelo' : 'modelos'} para conhecer</p><button type="button" className="saved-filter" aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}>{onlySaved ? 'Ver todos os modelos' : `Minhas escolhas (${state.favorites.length})`}</button></div>{displayed.length ? <div className="product-grid">{displayed.map(product => <ProductCard product={product} key={product.id} />)}</div> : <div className="catalog-empty"><h2>Seu próximo favorito.</h2><p>Salve uma preferência em um modelo para encontrá-la aqui.</p><button className="button button-dark" type="button" onClick={() => setOnlySaved(false)}>Explorar modelos <Arrow /></button></div>}<p className="catalog-study-note">As imagens desta prévia são estudos visuais ilustrativos. O desenho, as cores e os detalhes dos modelos reais serão confirmados com a TAL.</p></section>
    <LocationBlock />
  </>;
}

function ProductPage() {
  const { slug } = useParams();
  const product = getProduct(slug);
  if (!product) return <CatalogNotFound />;
  return <ProductDetail product={product} key={product.id} />;
}

function ProductDetail({ product }: { product: CatalogProduct }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, rememberSelection, toggleFavorite, toggleComparison } = useCatalog();
  const selection = parseSelection(product, new URLSearchParams(location.search));
  const [shareStatus, setShareStatus] = useState('');
  const [shareFallback, setShareFallback] = useState(false);
  const [inquiry, setInquiry] = useState(false);
  const shareField = useRef<HTMLInputElement>(null);
  const canonical = productPath(product, selection);
  const configurationUrl = window.location.origin + canonical;
  const colors = product.colors.filter(color => color.approved);
  const saved = state.favorites.includes(product.id);

  useEffect(() => {
    if (location.pathname + location.search !== canonical) navigate(canonical, { replace: true, preventScrollReset: true });
    rememberSelection(product, selection);
  }, [product, location.pathname, location.search, canonical, navigate, rememberSelection, selection]);
  useEffect(() => { trackIntent('product_open', { productId: product.id }); }, [product.id]);
  useEffect(() => { if (shareFallback) { shareField.current?.focus(); shareField.current?.select(); } }, [shareFallback]);

  function changeSelection(value: ProductSelection) {
    const normalized = normalizeSelection(product, value);
    const target = productPath(product, normalized);
    if (target !== canonical) {
      navigate(target, { preventScrollReset: true });
      trackIntent(normalized.colorId !== selection.colorId ? 'color_select' : 'view_select', { productId: product.id, ...normalized });
    }
  }
  async function share() {
    trackIntent('configuration_share', { productId: product.id, ...selection });
    try { await navigator.clipboard.writeText(configurationUrl); setShareStatus('Link copiado. Compartilhe sua escolha.'); }
    catch { setShareFallback(true); setShareStatus('Selecione e copie o link abaixo.'); }
  }
  function contact() { trackIntent('contact_prepare', { productId: product.id, ...selection }); setInquiry(true); }

  return <>
    <div className="catalog-container"><nav className="breadcrumbs" aria-label="Caminho"><Link to="/">Início</Link><span aria-hidden="true">/</span><Link to="/catalogo" state={{ restoreCatalog: true }}>Catálogo</Link><span aria-hidden="true">/</span><span>{product.name}</span></nav></div>
    <section className="product-detail catalog-container" aria-labelledby="product-title"><div className="product-exploration"><ProductStudio product={product} selection={selection} onSelectionChange={changeSelection} illustrativeMedia={visualStudies[product.id]} /><div className="product-exploration-actions"><button type="button" className="catalog-text-link" onClick={() => toggleFavorite(product, selection)} aria-pressed={saved}>{saved ? 'Preferência salva' : 'Salvar preferência'}<svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" stroke="currentColor" strokeWidth="1.5" /></svg></button><button type="button" className="catalog-text-link" onClick={share}>Copiar link <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 15 6-6m-4-3 2-2a5 5 0 0 1 7 7l-2 2M6 11l-2 2a5 5 0 0 0 7 7l2-2" stroke="currentColor" strokeWidth="1.5" /></svg></button></div><p className="share-status" role="status">{shareStatus}</p>{shareFallback && <label className="share-field">Link da sua escolha<input ref={shareField} readOnly value={configurationUrl} /></label>}</div>
    <div className="product-information"><p className="product-locality">TAL Mobilidade Elétrica · Pinhais</p><h1 id="product-title" tabIndex={-1}>{product.name}</h1><p className="product-lead">Seu próximo caminho<br />pode começar aqui.</p><p className="product-description">{product.description}</p><div className="product-colors"><h2>Cores</h2>{colors.length ? <div className="color-options">{colors.map(color => <button key={color.id} type="button" aria-label={`Cor: ${color.name}`} aria-pressed={color.id === selection.colorId} onClick={() => changeSelection({ ...selection, colorId: color.id })}><span style={{ backgroundColor: color.hex }} aria-hidden="true" />{color.name}</button>)}</div> : <p>Consulte as cores disponíveis com a equipe.</p>}</div><div className="product-specifications"><h2>Para conhecer melhor</h2>{product.specifications.length ? <dl>{product.specifications.map(spec => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}{spec.unit ? ` ${spec.unit}` : ''}</dd></div>)}</dl> : <p>Converse com a TAL sobre a versão, a ficha técnica e as condições deste modelo.</p>}</div><button type="button" className="button button-dark product-contact" onClick={contact}>Consultar {product.name} <Arrow /></button><button type="button" className="product-compare-link" aria-pressed={state.comparison.includes(product.id)} onClick={() => toggleComparison(product.id)}>{state.comparison.includes(product.id) ? 'Adicionado à comparação' : 'Adicionar à comparação'}<span aria-hidden="true">{state.comparison.includes(product.id) ? '✓' : '+'}</span></button><p className="product-stock-note">Consulte disponibilidade e valores com a TAL.</p></div></section>
    <section className="product-next catalog-container"><div><h2>Seu jeito de ir.<br />Sua escolha.</h2><p>Compare a linha ou conheça a TAL em Pinhais.</p></div><Link className="button button-dark" to="/catalogo" state={{ restoreCatalog: true }}>Voltar ao catálogo <Arrow /></Link></section><LocationBlock />
    <div className="mobile-product-contact"><span>{product.name}<small>TAL em Pinhais</small></span><button type="button" className="button button-dark" onClick={contact}>Consultar modelo <Arrow /></button></div>
    {inquiry && <CopyDialog title={`Vamos conhecer o ${product.name}?`} text={configurationMessage(product, selection, configurationUrl)} onClose={() => setInquiry(false)} />}
  </>;
}

function CatalogNotFound() {
  return <section className="catalog-not-found catalog-container"><h1 tabIndex={-1}>Vamos por<br />outro caminho.</h1><p>Não encontramos esse modelo. Você pode conhecer a seleção da TAL no catálogo.</p><Link to="/catalogo" className="button button-dark">Ver catálogo <Arrow /></Link></section>;
}

function CatalogFrame({ children }: { children: ReactNode }) {
  const { state } = useCatalog();
  const location = useLocation();
  const isProduct = !!getProduct(location.pathname.split('/')[2]);
  return <div className={`site catalog-app ${state.comparison.length ? 'has-comparison' : ''} ${isProduct ? 'is-product-page' : ''}`}><a className="skip-link" href="#principal">Ir para o conteúdo</a><CatalogHeader /><main id="principal">{children}</main><CatalogFooter /><ComparisonDock /></div>;
}

export default function CatalogPages() {
  return <CatalogFrame><Routes><Route index element={<CatalogPage />} /><Route path=":slug" element={<ProductPage />} /><Route path="*" element={<CatalogNotFound />} /></Routes></CatalogFrame>;
}

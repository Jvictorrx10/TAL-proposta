import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HomePage from './HomePage';
import { CatalogProvider, useCatalog } from './catalog/context';
import { Brand } from './ui/Primitives';
import './catalog/catalog.css';

const CatalogPages = lazy(() => import('./catalog/CatalogPages'));

function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { state } = useCatalog();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef('');

  useLayoutEffect(() => {
    const path = location.pathname;
    const slug = path.split('/')[2];
    document.title = path === '/' ? 'TAL — Mobilidade Elétrica' : path === '/catalogo' ? 'Catálogo | TAL Mobilidade Elétrica' : slug ? `${slug === 'n9e' ? 'N9e' : slug.toUpperCase()} | TAL Mobilidade Elétrica` : 'Página não encontrada | TAL';
    const changedPage = previousPath.current !== path;
    previousPath.current = path;
    const frame = requestAnimationFrame(() => {
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        target?.scrollIntoView({ behavior: 'instant' });
      } else if (changedPage || navigationType === 'POP') {
        const restoreCatalog = path === '/catalogo' && (location.state as { restoreCatalog?: boolean } | null)?.restoreCatalog;
        window.scrollTo({ top: restoreCatalog ? state.catalogScrollY : navigationType === 'POP' ? positions.current.get(location.key) ?? 0 : 0, behavior: 'instant' });
      }
      if (changedPage && navigationType !== 'POP') document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
      ScrollTrigger.refresh();
    });
    return () => { cancelAnimationFrame(frame); positions.current.set(location.key, window.scrollY); };
  }, [location.key, location.pathname, location.hash, navigationType]);
  return null;
}

function App() {
  return <BrowserRouter><CatalogProvider><RouteEffects /><Suspense fallback={<div className="route-loading" role="status"><Brand /><p>Abrindo catálogo…</p></div>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/catalogo/*" element={<CatalogPages />} />
    <Route path="*" element={<main className="route-not-found"><Brand /><h1 tabIndex={-1}>Vamos por outro caminho.</h1><p>Esta página não foi encontrada.</p><Link className="button button-dark" to="/catalogo">Explorar catálogo</Link><Link to="/">Voltar ao início</Link></main>} />
  </Routes></Suspense></CatalogProvider></BrowserRouter>;
}

export default App;

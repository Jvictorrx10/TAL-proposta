import { Link } from 'react-router-dom';
import { products } from './data';
import { Arrow } from '../ui/Primitives';

export function HomeCatalogPreview() {
  return <section id="modelos" className="models section-space home-catalog" aria-labelledby="models-heading">
    <div className="section-top"><div><h2 id="models-heading" data-reveal>Encontre<br className="mobile-only" /> seu ritmo.</h2><p data-reveal>Conheça a linha e converse com a TAL.</p></div><Link className="catalog-text-link" to="/catalogo" data-reveal>Explorar catálogo <Arrow /></Link></div>
    <div className="home-model-list">{products.map(product => <Link to={`/catalogo/${product.id}`} className="home-model-link" key={product.id} data-reveal aria-label={`Explorar ${product.name}`}><span className="home-model-name">{product.name}</span><span>Conhecer o modelo <Arrow /></span></Link>)}</div>
    <p className="home-catalog-note" data-reveal>TAL em Pinhais. Uma conversa mais próxima do seu próximo movimento.</p>
  </section>;
}

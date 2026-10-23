import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductStudio } from '../../src/catalog/ProductStudio.tsx';
import { products } from '../../src/catalog/data.ts';
import type { CatalogProduct, ProductMedia, ProductSelection } from '../../src/catalog/types.ts';
import '../../src/styles.css';

// Synthetic rectangles used only by the Vite development test harness. They
// depict no vehicle and are not imported by the production entry point.
function rectangle(label: string, color: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${color}"/><text x="40" y="290" fill="black" font-size="28">TEST FIXTURE — ${label}</text><text x="40" y="340" fill="black" font-size="20">Retângulo sintético. Não representa uma moto.</text></svg>`)}`;
}

function image(id: string, view: ProductMedia['view'], colorId: string): ProductMedia {
  return { id, kind: 'image', src: rectangle(id, colorId === 'branco' ? '#eee' : '#b7d8f3'), alt: `Fixture ${id}: retângulo de teste`, view, colorId, verified: true };
}

const scenario = new URLSearchParams(window.location.search).get('scenario');
const fixtureMedia: ProductMedia[] = [
  image('branco-geral', 'geral', 'branco'),
  image('branco-lateral', 'lateral', 'branco'),
  image('branco-painel', 'painel', 'branco'),
  image('azul-geral', 'geral', 'azul'),
  image('azul-lateral', 'lateral', 'azul'),
  { ...image('nao-verificada', 'traseira', 'branco'), verified: false },
];

const product: CatalogProduct = {
  ...products[0],
  name: 'N9e — fixture sem produto real',
  colors: [{ id: 'branco', name: 'Branco de teste', hex: '#eee', approved: true }, { id: 'azul', name: 'Azul de teste', hex: '#b7d8f3', approved: true }],
  media: scenario === 'empty' || scenario === 'illustrative' ? [] : scenario === 'failover'
    ? [{ ...image('indisponivel', 'geral', 'branco'), src: '/tests/fixtures/imagem-inexistente.webp' }, image('alternativa-valida', 'geral', 'branco')]
    : scenario === 'failure' ? [{ ...image('indisponivel', 'geral', 'branco'), src: '/tests/fixtures/imagem-inexistente.webp' }]
    : fixtureMedia,
};

function Fixture() {
  const [selection, setSelection] = useState<ProductSelection>({ colorId: 'branco', view: 'geral' });
  return <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
    <h1>Teste de galeria com retângulos sintéticos</h1>
    <p>Esta página não representa os produtos da TAL e não integra a aplicação de produção.</p>
    <div role="group" aria-label="Cores da fixture">
      <button type="button" onClick={() => setSelection((previous) => ({ ...previous, colorId: 'branco' }))}>Cor branca de teste</button>
      <button type="button" onClick={() => setSelection((previous) => ({ ...previous, colorId: 'azul' }))}>Cor azul de teste</button>
    </div>
    <output aria-label="Seleção da fixture">{JSON.stringify(selection)}</output>
    <ProductStudio product={product} selection={selection} onSelectionChange={setSelection} illustrativeMedia={scenario === 'illustrative' ? [{ ...image('estudo-ilustrativo', 'geral', 'branco'), verified: false }] : undefined} />
    <a id="contato-fixture" href="#contato-fixture">Contato fora do estúdio</a>
    <style>{`.studio-stage { position: relative; min-height: 260px; max-height: 600px; overflow: hidden; display: grid; place-items: center; background: #ddd; } .studio-media { max-width: 100%; max-height: 450px; object-fit: contain; } .studio-toolbar { display: flex; gap: 12px; flex-wrap: wrap; } .studio-thumbnail { max-width: 120px; } .studio-thumbnail img { max-width: 100%; } .studio-gallery { display: flex; gap: 8px; } .studio-dialog { width: min(90vw,1000px); max-width: 1000px; padding: 24px; } button { margin: 4px; padding: 10px; } .studio-placeholder { padding: 48px; }`}</style>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);

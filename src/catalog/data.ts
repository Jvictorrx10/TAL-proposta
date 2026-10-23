import type { CatalogProduct, ProductSource } from './types.ts';

function identificationSource(notes: string): ProductSource[] {
  return [{
    id: 'tal-study-2026-10-16',
    title: 'Estudo de experiência do catálogo TAL',
    reference: 'TAL-estudo-experiencia-catalogo.md — seção 2',
    kind: 'owner-reference',
    status: 'reference-only',
    notes,
  }];
}

// Only identification references are available. The original concept images do
// not depict these products and must not be attached to these records.
export const products: CatalogProduct[] = [
  {
    id: 'n9e',
    name: 'N9e',
    summary: 'Conheça o N9e com a TAL.',
    description: 'Explore este modelo e converse com a equipe da TAL sobre a versão, os detalhes e as opções disponíveis.',
    observations: ['Nome informado pela TAL; fabricante e versão ainda precisam ser confirmados.', 'A referência mostra carenagem frontal larga, iluminação horizontal e para-brisa.', 'O texto “Autonomia 50/60” da captura não possui unidade ou condição verificadas e não constitui especificação.'],
    media: [],
    colors: [],
    specifications: [],
    variants: [],
    hotspots: [],
    viewer: null,
    identityStatus: 'pending',
    sources: identificationSource('Captura citada no estudo, para identificação. Não autorizada como imagem final de vitrine. Faltam fabricante, versão, imagens autorizadas e ficha técnica correspondente.'),
  },
  {
    id: 'a8',
    name: 'A8',
    summary: 'Conheça o A8 com a TAL.',
    description: 'Descubra o A8 e tire suas dúvidas com a equipe da TAL antes de escolher sua elétrica.',
    observations: ['Nome informado pela TAL para o modelo novo; fabricante e geração ainda precisam ser confirmados.', 'A referência mostra uma unidade azul, farol redondo e conjunto dianteiro exposto.', 'A cor observada na referência não confirma cores comercializadas ou estoque.'],
    media: [],
    colors: [],
    specifications: [],
    variants: [],
    hotspots: [],
    viewer: null,
    identityStatus: 'pending',
    sources: identificationSource('Captura citada no estudo, para identificação. O código A8 não identifica sozinho fabricante ou geração. Faltam imagens autorizadas e ficha técnica correspondente.'),
  },
  {
    id: 'n9',
    name: 'N9',
    summary: 'Conheça o N9 com a TAL.',
    description: 'Saiba mais sobre o N9 e consulte a TAL para conhecer as características e as condições deste modelo.',
    observations: ['Nome informado pela TAL; fabricante e versão ainda precisam ser confirmados.', 'A referência mostra uma unidade preta, grafismo N9 e detalhe laranja.', 'A unidade chamada “N9 marrom” ainda não foi identificada como cor ou versão deste produto.'],
    media: [],
    colors: [],
    specifications: [],
    variants: [],
    hotspots: [],
    viewer: null,
    identityStatus: 'pending',
    sources: identificationSource('Captura citada no estudo, para identificação. Anúncios de produtos também chamados N9 não confirmam a versão da TAL. Não transferir dados ou mídias desses anúncios.'),
  },
];

export function getProduct(id: unknown): CatalogProduct | undefined {
  return products.find((product) => product.id === id);
}

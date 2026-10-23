import type { ProductId, ProductMedia } from './types';

// Private review studies authorized by the owner after the initial briefing.
// These never become verified product media or evidence of stocked colours.
const studies: Record<ProductId, ProductMedia[]> = {
  n9e: [
    { id: 'n9e-study', kind: 'image', src: '/images/studies/n9e-profile.webp', alt: 'Estudo visual ilustrativo de scooter com carenagem larga, para-brisa e proteção frontal. O modelo real pode ter diferenças.', view: 'geral', verified: false },
    { id: 'n9e-study-front', kind: 'image', src: '/images/studies/n9e-front-study.webp', alt: 'Outra perspectiva do estudo visual ilustrativo, com destaque para o para-brisa e a proteção frontal. O modelo real pode ter diferenças.', view: 'geral', verified: false },
    { id: 'n9e-study-rear', kind: 'image', src: '/images/studies/n9e-rear-study.webp', alt: 'Perspectiva do estudo visual ilustrativo com destaque para banco, roda e lanterna traseira. O modelo real pode ter diferenças.', view: 'geral', verified: false },
  ],
  a8: [{ id: 'a8-study', kind: 'image', src: '/images/studies/a8-profile.webp', alt: 'Estudo visual ilustrativo de scooter azul com farol redondo e conjunto dianteiro exposto. O modelo real pode ter diferenças.', view: 'geral', verified: false }],
  n9: [{ id: 'n9-study', kind: 'image', src: '/images/studies/n9-profile.webp', alt: 'Estudo visual ilustrativo de scooter preta com detalhes laranja. O modelo real pode ter diferenças.', view: 'geral', verified: false }],
};

export const visualStudies: Record<ProductId, ProductMedia[]> = {
  n9e: studies.n9e.map(withThumbnail),
  a8: studies.a8.map(withThumbnail),
  n9: studies.n9.map(withThumbnail),
};

function withThumbnail(media: ProductMedia): ProductMedia {
  return { ...media, thumbnailSrc: media.src.replace('.webp', '-thumb.webp') };
}

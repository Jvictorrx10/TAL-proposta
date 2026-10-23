# Estudos visuais aproximados — prévia TAL

Estes cinco WebPs foram gerados com a ferramenta de imagens durante a atualização do catálogo em 16/10/2026. A direção visual usa as descrições e referências de identificação fornecidas pelo usuário, que autorizou uma aproximação para revisar a experiência antes de conversar com a loja.

**Não são fotografias dos produtos da TAL, renders de CAD oficial ou assets de fabricante.** Não confirmam desenho exato, versão, pintura comercializada, estoque, painel, mecanismos, dimensões ou funcionamento de qualquer modelo.

| Arquivo | Papel na prévia | Origem e limite |
|---|---|---|
| `n9e-profile.webp` | Estudo geral associado ao nome N9e. | Imagem gerada a partir da descrição de carenagem larga, para-brisa e proteção frontal; correspondência exata não validada. |
| `a8-profile.webp` | Estudo geral associado ao nome A8. | Imagem gerada a partir da descrição de unidade azul, farol redondo e conjunto dianteiro exposto; não identifica fabricante/geração nem confirma a cor disponível. |
| `n9-profile.webp` | Estudo geral associado ao nome N9. | Imagem gerada a partir da descrição de unidade preta e detalhes laranja; não confirma versão, peças ou identidade de fabricante. |
| `n9e-front-study.webp` | Estudo adicional de perspectiva para a galeria N9e. | Geração referenciada no estudo principal; PNG de origem `exec-d5057c1e-7f6a-4d24-9114-7f57c2b24a86.png`. Não prova fidelidade entre ângulos. |
| `n9e-rear-study.webp` | Estudo adicional de perspectiva para a galeria N9e. | Geração referenciada no estudo principal; PNG de origem `exec-54c8f37d-1ba5-4773-8d7e-223bb227b19c.png`. A traseira real e seus detalhes continuam sem validação. |

Os PNGs de geração ficam em `/workspace/generated_images` no ambiente de trabalho; os arquivos WebP são derivados locais para entrega web. A procedência documentada é geração nesta sessão, sem atribuição a um fabricante ou declaração de licença de fotos oficiais. A autorização recebida trata do uso desses estudos na prévia; não supre autorizações futuras para mídia de terceiros.

Cada imagem tem um derivado `*-thumb.webp` de 240×160 para a galeria. Essas cinco miniaturas reutilizam os mesmos estudos; não acrescentam vistas. O original grande é solicitado ao selecionar a imagem. Se a miniatura falhar, a galeria tenta o arquivo original.

## Integração

`src/catalog/studies.ts` mantém esses arquivos separados de `CatalogProduct.media`. Os registros são `verified: false`, sem cor comercial aprovada, e servem à prévia rotulada. O estúdio mostra **“Estudo visual ilustrativo. O modelo real pode ter diferenças.”** na apresentação e no dialog ampliado. O catálogo também informa que se trata de estudos.

As perspectivas são tratadas como imagens gerais de estudo, não como vistas técnicas verificadas. Não há sequência contínua, rotação 360°, malha GLB/GLTF ou cockpit real. As imagens geradas separadamente podem divergir em detalhes; não devem sustentar comparação técnica, identificação de mecanismos ou alegações de fidelidade multivista.

## Substituição futura

Antes de representar o catálogo real, confirmar fabricante, versão, cores e ficha técnica com a TAL, obter mídia autorizada e conferir correspondência. Registrar origem/autorização dos novos assets antes de marcá-los como verificados. Não reutilizar os conceitos antigos de scooter como se fossem N9e, A8 ou N9.

O hero e a assistência preservam as ilustrações anteriores, documentadas em [`../README.md`](../README.md). O logo usado no código continua sendo o SVG provisório anterior; estes estudos não substituem o vetor oficial pendente.

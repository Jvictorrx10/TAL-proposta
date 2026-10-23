# Atualização TAL — catálogo e exploração de produto

Registro da implementação iniciada em 16/10/2026 a partir de `TAL-estudo-experiencia-catalogo.md`, `TAL-prompt-atualizacao-Codex.txt` e dos esclarecimentos posteriores do usuário.

## Escopo e publicação

O resultado desta tarefa é uma prévia para revisão. Nenhum PDF foi alterado, nenhum commit foi enviado ao GitHub e nenhuma publicação foi realizada. A versão pública já existente permanece como estava antes desta atualização.

Após o briefing inicial, o usuário autorizou estudos visuais aproximados enquanto confirma os produtos com a loja. Essa autorização permite apresentar os estudos rotulados na prévia; não transforma as imagens em documentação dos modelos reais.

## Home e identidade preservadas

O código da home foi extraído para `src/HomePage.tsx`, preservando o hero, sua imagem ilustrativa anterior, os capítulos claros/escuros, os efeitos de entrada e rolagem GSAP/ScrollTrigger, os parallax e as fontes locais Archivo Black e Manrope. Os efeitos continuam limitados ao componente da home e são revertidos na desmontagem.

A mudança editorial concentra-se na entrada do catálogo: N9e, A8 e N9 substituem os antigos nomes de conceitos na seção de modelos e nas opções de interesse da consulta. Assistência, perguntas e preparação da mensagem permanecem disponíveis.

O componente `Brand` mantém o SVG provisório anterior. Ele não foi redesenhado nesta atualização. As fotos fornecidas ajudam a reconhecer a fachada, mas o arquivo vetorial oficial e a confirmação da tipografia da marca continuam pendentes.

As capturas anteriores da home estão em `before/home-desktop.png` e `before/home-mobile.png`. A comparação visual com `after/` preserva a composição em 1440×900 e 390×844. O bloco de animação `useLayoutEffect` foi comparado ao arquivo original e é idêntico; `src/styles.css` também permanece byte a byte igual. A imagem do hero ganhou um derivado responsivo de 960×640 (76.014 bytes, contra 174.594 do original) sem mudar seu desenho ou movimento.

## Jornada e arquitetura

| Área | Comportamento implementado |
|---|---|
| `/` | Home editorial com entradas para explorar o catálogo e os modelos. |
| `/catalogo` | Seleção de N9e, A8 e N9, favoritos, filtro de escolhas e seleção para comparação. |
| `/catalogo/n9e`, `/catalogo/a8`, `/catalogo/n9` | Página individual, galeria, informações disponíveis, preferência, compartilhamento e consulta contextual. |
| Modelo ou rota de catálogo inexistente | Estado recuperável com caminho de volta ao catálogo. |

React Router mantém a navegação sem substituir a arquitetura React/TypeScript/Vite. O catálogo é carregado separadamente da home. `vercel.json` fornece fallback para as rotas do catálogo; `preview-local.mjs` também atende essas rotas ao testar a compilação localmente e mantém arquivos ausentes como erro 404.

O catálogo separa dados, tipos, estado, contexto e apresentação. Os tipos incluem produtos, variantes, cores, especificações, mídia, fontes, hotspots e um visualizador 3D aprovado futuro. Os registros N9e/A8/N9 não receberam especificações, variantes ou cores comerciais inventadas. A unidade descrita como “N9 marrom” não foi cadastrada como quarto modelo.

## Escolhas, persistência e atendimento

- Comparação de até três modelos, com remoção e limpeza. Dados ainda não confirmados aparecem como “Consulte a equipe”, sem transformar ausência em zero.
- Favoritos, filtro “Minhas escolhas”, seleções e posição do catálogo preservados no próprio navegador. JSON inválido ou armazenamento bloqueado não impede a navegação e as escolhas da sessão.
- URL de configuração aceita somente modelo, cor aprovada e vista suportada. Parâmetros estranhos e dados pessoais não entram no link compartilhado nem na mensagem gerada.
- Cópia do link e consulta contextual com fallback de seleção manual e download de texto. O visitante não precisa cadastrar-se para explorar.
- Eventos de intenção preparados como eventos locais `tal:intent`, sem transmissão para analytics ou serviços externos e sem informações pessoais.

A consulta prepara uma mensagem; não abre pedido, conversa comercial ou agendamento automaticamente. O Instagram `tal_mobilidade` permanece como canal conhecido. Não foi criado WhatsApp ou telefone fictício.

O endereço **Avenida Jacob Macanhan, 4134, Pinhais, Paraná** foi confirmado pelo usuário. A página mostra esse endereço e um link de busca no Google Maps. O horário não foi inventado: a orientação é consultá-lo com a equipe.

## Galeria e limites visuais

`ProductStudio` aceita mídias reais verificadas e, separadamente, `illustrativeMedia` para os estudos autorizados da prévia. As mídias reais precisam corresponder à cor selecionada; não há filtro CSS para repintar imagem inteira. Os estudos não são inseridos como mídia verificada dos produtos.

Recursos de imagem implementados:

- Seleção entre as imagens disponíveis e botões para vistas realmente oferecidas pela mídia.
- Aproximação de 1× a 2×; restauração retorna à vista geral e a 1× sem alterar a cor.
- Mudança de cor preserva zoom e vista quando a nova cor possui mídia correspondente.
- Dialog nativo para ampliar, com saída por botão ou Escape e preservação da escolha.
- Falha de carregamento tenta outra mídia válida. Sem mídia utilizável, o estúdio apresenta o nome e a informação de imagens em preparação; os contatos e informações da página continuam acessíveis.
- Ausência de mídia não produz botões de zoom, painel, rotação ou 3D que fingem funcionar.

Os estudos mostram o aviso **“Estudo visual ilustrativo. O modelo real pode ter diferenças.”**, inclusive na visualização ampliada. As cinco imagens de estudo são arquivos 2D gerados. Variações de ângulo não comprovam consistência geométrica, materiais ou dimensões; não constituem uma sequência 360° nem permitem deduzir o painel real.

## 3D avaliado e ainda não ativado

Não foi encontrado ou validado um GLB/GLTF correspondente às unidades da TAL. Não há cockpit fiel, malha 3D, AR, abertura de banco, simulação de luzes ou rotação livre implementados. Nenhuma dependência de renderização 3D foi incluída no bundle.

`@google/model-viewer` foi avaliado como candidato apropriado para uma próxima etapa com GLB aprovado: permite controle de câmera, variantes de material e hotspots sem exigir dois motores de cena. A adoção depende de obter o modelo correto e conferir geometria, materiais, vistas e, para AR, dimensões e escala. A galeria HTML deve continuar disponível caso o visualizador futuro falhe.

## Origem dos assets e dados pendentes

Os cinco WebPs novos estão documentados em [`public/images/studies/README.md`](../../public/images/studies/README.md). Foram gerados nesta sessão a partir da direção de arte e das descrições fornecidas; não são fotos de estoque nem arquivos oficiais de fabricante. As imagens anteriores da home e da assistência continuam ilustrativas e possuem [registro próprio](../../public/images/README.md).

Para concluir a representação comercial, ainda são necessários:

1. Fabricante/importador, geração, versão e manual ou catálogo exato de cada produto.
2. Identificação da unidade marrom, sem assumir equivalência entre N9 e N9e.
3. Fotos autorizadas, vistas consistentes e detalhes reais de painel, banco, rodas, recarga e demais peças que serão destacados.
4. Cores aprovadas, ficha técnica com unidades e condições, valores, estoque e condições comerciais.
5. Telefone/canal comercial e horários oficiais da loja; vetor oficial e confirmação de aplicação da marca.

O recorte “Autonomia 50/60” não virou uma especificação: sua unidade, condições e versão não foram validadas. Nenhuma característica de anúncios de produtos com nomes parecidos foi transferida para o catálogo.

## Orçamento de mídia

Não há GLB/texturas 3D ativos; o orçamento de um modelo 3D será definido após obter os arquivos corretos. Para a galeria atual, adota-se até 250 KB por imagem grande e até 35 KB somados nas miniaturas do modelo ativo. Os estudos grandes têm 184.318–199.100 bytes; as três miniaturas N9e somam menos de 30 KB. Somente a imagem selecionada é solicitada em tamanho grande. As miniaturas usam 240×160 e têm fallback para o original quando necessário. A home não solicita os estudos do catálogo.

## Validação final

Comandos executados:

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

O harness de `tests/fixtures/studio.html` usa apenas retângulos SVG de teste, sem representar motos, e não é uma entrada da build de produção. A verificação cobre navegação direta/reload/histórico, parâmetros inválidos, comparação, preferência, armazenamento indisponível, clipboard e download, galeria, zoom, fechamento de dialog, falhas de imagem, teclado, movimento reduzido e tamanhos de tela distintos.

| Verificação | Registro final |
|---|---|
| Tipos e build | `npm run typecheck` e `npm run build` aprovados. |
| Testes unitários e servidor local | 20/20 aprovados: dados/seleção/privacidade/armazenamento e servidor local/rotas/arquivos/HEAD/erros. |
| Testes Playwright | Rodada completa 36/36; depois das miniaturas, 17 casos de catálogo + 8 de estúdio aprovados, incluindo 2 regressões novas. O caso de responsividade afetado por pausa do executor passou isoladamente com os mesmos timeouts. Total atual: 38 casos distintos (17 catálogo, 13 site, 8 estúdio). |
| Home antes/depois, desktop e celular | Composição e movimento preservados; capturas [desktop](after/home-desktop.png), [celular](after/home-mobile.png), [catálogo desktop](after/catalog-desktop.png), [catálogo celular](after/catalog-mobile.png), [produto desktop](after/product-desktop.png), [produto celular](after/product-mobile.png) e [galeria ampliada](after/gallery-desktop.png). |
| Peso da build e estudos | Entrada JS 399,25 KB (134,95 KB gzip); catálogo separado 26,89 KB (7,42 KB gzip); CSS 40,57 KB (8,59 KB gzip). `dist` aproximadamente 2,47 MB, incluindo imagens e fontes. Nenhum motor 3D no bundle. |
| Medições de laboratório | 3 execuções por rota, cache frio, 390×844, CPU 4×, latência 150 ms, download 1,6 Mb/s, texto gzip em proxy local. Home: LCP mediano 2,908 s; N9e: 3,408 s. CLS observado máximo 0,0001. Resultados completos em [performance.json](performance.json). |

As metas LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1 são referências de avaliação, não resultados afirmados neste documento. Uma medição de laboratório não substitui dados reais de usuários; não há promessa de desempenho ou aumento de vendas baseada apenas na inspeção visual.

### Método e limites de desempenho

O script reproduzível [measure.mjs](measure.mjs) inicia a build local, aplica compressão gzip aos textos e utiliza Chromium 154 com throttling via CDP. Cada navegação usa contexto novo, espera a imagem principal e as fontes e registra LCP/CLS antes dos cliques. A rodada final foi executada depois dos testes de interface, sem a suíte concorrente. Não mede a CDN da Vercel nem um telefone físico.

| Rota | LCP nas 3 execuções (ms) | Maior CLS observado | Maior amostra de duração de interação (ms) |
|---|---|---|---|
| Home | 3184 / 2908 / 2644 | 0,0001 | 168 |
| N9e | 3408 / 3352 / 3420 | 0,0001 | 72 |

O carregamento principal ainda excede a meta de 2,5 s nessas condições. A imagem responsiva e as miniaturas reduzem a transferência, mas a entrega não certifica essa meta. A duração de eventos dos cliques roteirizados não equivale a INP de usuários reais. O CLS registrado soma as mudanças sem interação recente durante uma sessão curta, não todo o uso em produção. Confirmar Core Web Vitals depois da publicação revisada e de medições em dispositivos reais.

Falhas de imagens, armazenamento e clipboard foram testadas. Falha de GLB, perda de contexto WebGL, painel 3D e AR não foram executados: esses recursos não existem nesta build. O fallback de rotas foi validado no servidor local; a configuração Vercel está preparada para a próxima publicação, que não foi feita nesta tarefa.

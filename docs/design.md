# TAL — protótipo web

O usuário autorizou a criação a partir do briefing registrado e das três imagens da marca. Este documento registra as decisões de implementação; não abre uma nova etapa de aprovação.

## Direção

O branco do logo TAL se transforma no corpo da moto ilustrativa; o preto frisado da fachada se transforma no capítulo de movimento e na assistência. A moto é o objeto dominante, com composição ampla e tipografia geométrica assertiva. A direção Taste Skill escolhida foi `hero-object`, por dar protagonismo ao produto. A paleta e a linguagem de letras da marca prevalecem sobre qualquer sorteio. O movimento de crossfade será combinado com deslocamento ao rolar, conforme o pedido do usuário.

As referências geradas com Image to Code orientam proporções, imagens e contraste. As referências automotivas de Awesome Design MD servem para composição, sem copiar outra identidade.

## Conteúdo e comportamento

- Hero: “Seu próximo movimento.”, moto em destaque, ação para explorar os modelos.
- Mobilidade: capítulo escuro com moto que desliza ao rolar, sem métricas comerciais inventadas.
- Modelos: seleção interativa de conceitos Urbana, Conforto e Versátil; imagens e descrições são demonstrativas. Seleção altera imagem, texto e interesse da consulta.
- Assistência: manutenção, revisões e acessórios, conforme o material fornecido, com detalhes expansíveis.
- Contato: nome, cidade/estado, interesse e mensagem; prepara uma consulta que pode ser copiada. Não promete envio a uma equipe sem backend ou contato confirmado.
- Dúvidas: esclarecimentos sobre consulta de modelos, atendimento de outras regiões e caráter ilustrativo das imagens.
- Navegação móvel acessível, foco visível, sem rolagem horizontal indevida. Movimento reduzido elimina deslocamentos e mantém o conteúdo visível.

## Limites reais

Não há catálogo, preços, telefone, endereço, cobertura de entrega ou fonte oficial confirmados. A imagem de produto é gerada para o protótipo. A marca angular será preservada visualmente em um SVG provisório baseado nas fotos, que poderá ser trocado por arquivo oficial. Não apresentar esse SVG como arquivo original. O site não inclui depoimentos ou números de vendas inventados.

## Implementação

React e TypeScript com Vite; GSAP para rolagem e entradas. Fontes locais para evitar requisições de fontes externas em produção. Ativos locais otimizados em WebP. Componentes de navegação, marca, seleção, assistência e consulta. O site pode ser publicado como arquivos estáticos; não contém um sistema de pedidos ou pagamento.

## Validação

Build e checagem TypeScript; navegador em 1440, 768 e 390px; teste de mudança de conceito, consulta, cópia/fallback, acordeões, menu móvel, foco, preferência de movimento reduzido, carregamento de imagens e erros de console. Inspeção visual das capturas e diagnóstico dos achados do Taste Skill. O formulário não deve alegar que uma consulta foi enviada.

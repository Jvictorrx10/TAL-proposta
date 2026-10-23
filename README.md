# TAL · Mobilidade Elétrica

Prévia responsiva da TAL Mobilidade Elétrica: home editorial com moto ligada à rolagem, catálogo N9e/A8/N9, páginas de modelo, comparação, preferências e consultas para copiar ou baixar.

Esta atualização está preparada para revisão local. Não foi enviada ao GitHub nem publicada; o site público existente não foi alterado nesta tarefa.

## O que esta versão oferece

- Home com composição, hero ilustrativo, movimentos GSAP, fontes e componente de marca preservados; a seção de modelos agora leva ao catálogo.
- Catálogo em `/catalogo` e páginas `/catalogo/n9e`, `/catalogo/a8` e `/catalogo/n9`, com acesso direto e atualização da página.
- Comparação de até três modelos, favoritos, filtro “Minhas escolhas” e restauração de preferências no próprio navegador. O site continua utilizável quando o armazenamento está bloqueado.
- Galeria com as imagens disponíveis, aproximação de até 2×, restauração e visualização ampliada. A infraestrutura aceita mídia real verificada; os estudos desta prévia ficam separados dela.
- Links de configuração limpos e consultas contextuais para copiar ou baixar. Não há envio de mensagem, pedido ou cadastro no servidor.
- Localização confirmada: **Avenida Jacob Macanhan, 4134, Pinhais, Paraná**, com link para o mapa. Telefone comercial e horários oficiais ainda não foram informados.

As imagens do catálogo são **estudos visuais aproximados, gerados com autorização do usuário**. Não são fotos dos produtos, comprovação de cores disponíveis ou representação fiel de peças e painel. A galeria é de imagens 2D; não há 3D, rotação 360°, cockpit interativo ou AR nesta versão.

## Executar

Use Node.js 24 e npm:

```bash
npm ci
npm run dev
```

O servidor de desenvolvimento usa a porta 5173. Para gerar a versão estática:

```bash
npm run build
npm run preview
```

O resultado compilado fica em `dist/`. `preview` usa a porta 4173. `vercel.json` contém os rewrites necessários para abrir as rotas do catálogo diretamente na hospedagem existente.

## Prévia local no Windows

Depois de baixar e extrair o projeto no seu computador, instale o Node.js 24 e execute `INICIAR-PREVIA.bat`. Se `dist/` ainda não existir, o iniciador instala as dependências e compila o site; essa primeira preparação precisa de internet. Depois ele serve a prévia na porta 4180. Abra `http://127.0.0.1:4180` no navegador e mantenha a janela do iniciador aberta.

Em macOS ou Linux, execute `npm ci`, `npm run build` e `node preview-local.mjs`. O servidor local atende também às rotas do catálogo. O endereço `127.0.0.1` sempre se refere ao computador em que o navegador está aberto; um servidor iniciado na nuvem não aparece automaticamente no seu computador.

Ao atualizar o código de uma pasta que já possui `dist/`, execute `npm run build` novamente para que a prévia mostre a nova versão.

## Verificação

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Os testes usam o Chromium de `/usr/bin/chromium` quando disponível. Em outro ambiente, instale o navegador com `npx playwright install chromium` ou informe `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

A suíte cobre desktop, tablet e celular; rotas diretas e histórico; URLs inválidas; comparação e preferências; galeria, zoom, falhas de mídia e dialog; consulta, clipboard e download; teclado e movimento reduzido. Os testes de galeria usam retângulos sintéticos em um harness de desenvolvimento, sem representar motos reais nem integrar o bundle de produção.

Resultados finais, capturas e limites das medições ficam em [Implementação do catálogo](docs/catalog-update/implementation.md).

## Conteúdo a confirmar antes do lançamento

- Obter o vetor oficial da marca. O componente `Brand` conserva o SVG provisório anterior, reconstruído a partir das fotos; esta atualização não redesenhou o logo nem mudou as fontes.
- Confirmar fabricante, versão e ficha técnica de N9e, A8 e N9; identificar a qual produto pertence a unidade marrom citada no estudo.
- Obter fotos ou arquivos 3D autorizados dos modelos corretos, incluindo múltiplos ângulos, painel e dimensões quando necessários. Substituir os estudos aproximados após conferência.
- Confirmar cores comercializadas, especificações, valores, estoque, atendimento e eventuais condições de entrega.
- Definir telefone comercial e horários oficiais; integrar o envio da consulta somente após confirmar o canal.

Não há alegações de autonomia, potência, estoque, prazo ou entrega nacional. O link de Instagram usa `tal_mobilidade`, identificador presente no material do usuário.

## Projeto e referências

React, TypeScript, Vite, React Router e GSAP. Fontes Manrope e Archivo Black hospedadas localmente; imagens WebP locais. Animações respeitam `prefers-reduced-motion`. Nenhum motor de renderização 3D foi adicionado.

- [Atualização do catálogo](docs/catalog-update/implementation.md)
- [Origem dos estudos visuais](public/images/studies/README.md)
- [Direção visual](docs/design.md)
- [Plano executado](docs/implementation-plan.md)
- [Validação e decisões visuais](docs/validation.md)
- [Captura desktop](docs/screenshots/desktop.png)
- [Captura mobile](docs/screenshots/mobile.png)
- [Origem dos ativos](public/images/README.md)

As skills baixadas ficam em `/workspace/shared/tal-tools` e são vinculadas em `.agents/skills` no ambiente de nuvem. Esses vínculos locais não fazem parte do código versionado. A configuração local `.npmrc` apenas direciona o cache para uma pasta gravável neste ambiente e também não é versionada.

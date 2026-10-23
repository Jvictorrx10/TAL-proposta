# Rotas do catálogo

O catálogo usa rotas da aplicação React: `/catalogo` e `/catalogo/:modelo`.
Ao abrir ou recarregar esses endereços diretamente, o servidor deve entregar
`index.html` para que a aplicação escolha a tela correta.

## Publicação na Vercel

O arquivo `vercel.json` contém rewrites específicos para `/catalogo` e suas
subrotas sem extensões. Parâmetros de consulta, como
`/catalogo/n9e?origem=instagram`, não impedem o carregamento da aplicação.
Os caminhos de arquivos ausentes, como `/assets/ausente.js` ou
`/catalogo/ausente.js`, e os caminhos fora do catálogo não recebem esse fallback.

Não é necessário cadastrar essas rotas manualmente na Vercel. A configuração
será aplicada quando os arquivos forem enviados e uma nova publicação ocorrer.
Este ajuste por si só não publica o projeto.

## Prévia local

Após `npm ci` e `npm run build`, execute:

```sh
node preview-local.mjs
```

Abra `http://127.0.0.1:4180/catalogo` ou um endereço de modelo. A porta pode ser
alterada pela variável `TAL_PREVIEW_PORT` (de 1024 a 65535). Os iniciadores locais
existentes continuam funcionando. Mantenha o terminal aberto durante a prévia.

A prévia mantém o acesso restrito ao computador local, usa os tipos MIME dos
arquivos estáticos, suporta GET/HEAD e rejeita tentativas de sair da pasta `dist`,
incluindo caminhos codificados e links simbólicos para arquivos externos.

## Validação

```sh
node --test tests/preview-server.test.mjs
```

Os testes usam uma pasta temporária e uma porta dinâmica atribuída pelo sistema.
Eles verificam home, catálogo, modelo e subrota com consulta, MIME de CSS/JS,
arquivos ausentes, HEAD, métodos inválidos, traversal, links simbólicos externos
e codificação de URL inválida, sem iniciar nem encerrar outras prévias locais.

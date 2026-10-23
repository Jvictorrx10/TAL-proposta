import http from 'node:http';
import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('./dist/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

export function createPreviewServer({ rootDirectory = defaultRoot } = {}) {
  const root = realpathSync(rootDirectory);
  const isInsideRoot = file => file === root || file.startsWith(root + path.sep);

  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    try {
      // Read the raw path before URL normalization can hide encoded ../ segments.
      const rawPath = req.url.split(/[?#]/, 1)[0];
      if (!rawPath.startsWith('/') || rawPath.startsWith('//')) {
        res.writeHead(400); return res.end('Requisição inválida');
      }
      const pathname = decodeURIComponent(rawPath);
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(segment => segment === '.' || segment === '..')) {
        res.writeHead(403); return res.end('Acesso negado');
      }
      let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!isInsideRoot(file)) {
        res.writeHead(403); return res.end('Acesso negado');
      }

      // Only extensionless catalog routes belong to the SPA. Missing assets
      // must remain 404s instead of receiving HTML with a misleading 200.
      const catalogRoute = pathname === '/catalogo' || (pathname.startsWith('/catalogo/') && !pathname.slice('/catalogo/'.length).includes('.'));
      if ((!existsSync(file) || !statSync(file).isFile()) && catalogRoute) {
        file = path.join(root, 'index.html');
      }
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404); return res.end('Arquivo não encontrado');
      }
      // A symlink inside dist must not expose files outside the build directory.
      if (!isInsideRoot(realpathSync(file))) {
        res.writeHead(403); return res.end('Acesso negado');
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': statSync(file).size });
      if (req.method === 'HEAD') return res.end();
      createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch {
      res.writeHead(400); res.end('Requisição inválida');
    }
  });
}

// Importing the server in tests never starts a listener or occupies preview ports.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.TAL_PREVIEW_PORT || 4180);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error('TAL_PREVIEW_PORT deve ser um número de 1024 a 65535.');
    process.exit(1);
  }
  if (!existsSync(path.join(defaultRoot, 'index.html'))) {
    console.error('A pasta dist não foi encontrada. Execute npm ci e npm run build.');
    process.exit(1);
  }
  const server = createPreviewServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `A porta ${port} já está ocupada. Feche a outra prévia ou configure TAL_PREVIEW_PORT.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`\nTAL — prévia local\nAbra no navegador: http://127.0.0.1:${port}\n\nMantenha este terminal aberto. Para encerrar, pressione Ctrl+C.\n`);
  });
}

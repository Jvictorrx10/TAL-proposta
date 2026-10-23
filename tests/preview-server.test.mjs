import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createPreviewServer } from '../preview-local.mjs';

const html = '<!doctype html><html lang="pt-BR"><body>TAL preview fixture</body></html>';
let server;
let fixture;
let port;

before(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'tal-preview-test-'));
  const buildDirectory = path.join(fixture, 'dist');
  await mkdir(path.join(buildDirectory, 'assets'), { recursive: true });
  await Promise.all([
    writeFile(path.join(buildDirectory, 'index.html'), html),
    writeFile(path.join(buildDirectory, 'assets', 'app.css'), 'body { color: black; }'),
    writeFile(path.join(buildDirectory, 'assets', 'app.js'), 'console.log("TAL");'),
    writeFile(path.join(fixture, 'private.txt'), 'outside-build-secret'),
  ]);
  await symlink(path.join(fixture, 'private.txt'), path.join(buildDirectory, 'leak.txt'));
  server = createPreviewServer({ rootDirectory: buildDirectory });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (fixture) await rm(fixture, { recursive: true, force: true });
});

// http.request preserves the raw path, unlike fetch which normalizes ../ first.
function request(requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: requestPath, method }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

for (const route of ['/', '/catalogo', '/catalogo/', '/catalogo/tal-one?origem=teste', '/catalogo/modelos/tal-one?utm_source=preview']) {
  test(`serves the SPA for ${route}`, async () => {
    const result = await request(route);
    assert.equal(result.status, 200);
    assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
    assert.equal(result.body, html);
  });
}

test('serves CSS and JavaScript with their own MIME types and preserves query strings', async () => {
  const css = await request('/assets/app.css?v=123');
  const js = await request('/assets/app.js?v=123');
  assert.equal(css.status, 200);
  assert.equal(css.headers['content-type'], 'text/css; charset=utf-8');
  assert.match(css.body, /color: black/);
  assert.equal(js.status, 200);
  assert.equal(js.headers['content-type'], 'text/javascript; charset=utf-8');
  assert.match(js.body, /console\.log/);
});

test('keeps missing assets, APIs and unrelated routes as 404 responses', async () => {
  for (const route of ['/assets/missing.js', '/catalogo/missing.js', '/catalogo/assets/missing.css?cache=1', '/catalogo/.env', '/api/missing', '/unrelated']) {
    const result = await request(route);
    assert.equal(result.status, 404, route);
    assert.notEqual(result.body, html, route);
  }
});

test('supports HEAD on deep links without sending the HTML body', async () => {
  const result = await request('/catalogo/tal-one?origem=head', 'HEAD');
  assert.equal(result.status, 200);
  assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
  assert.equal(Number(result.headers['content-length']), Buffer.byteLength(html));
  assert.equal(result.body, '');
});

test('rejects unsupported HTTP methods', async () => {
  const result = await request('/catalogo', 'POST');
  assert.equal(result.status, 405);
  assert.equal(result.headers.allow, 'GET, HEAD');
});

test('rejects traversal before raw or encoded paths can be normalized', async () => {
  for (const route of ['/../private.txt', '/%2e%2e/private.txt', '/catalogo/../../private.txt', '/catalogo/%2e%2e/%2e%2e/private.txt', '/catalogo/..%5c..%5cprivate.txt', '/catalogo/%00']) {
    const result = await request(route);
    assert.equal(result.status, 403, route);
    assert.doesNotMatch(result.body, /outside-build-secret/, route);
  }
});

test('does not expose files through symlinks outside the build directory', async () => {
  const result = await request('/leak.txt');
  assert.equal(result.status, 403);
  assert.doesNotMatch(result.body, /outside-build-secret/);
});

test('rejects malformed URL encoding', async () => {
  const result = await request('/catalogo/%E0%A4%A');
  assert.equal(result.status, 400);
});

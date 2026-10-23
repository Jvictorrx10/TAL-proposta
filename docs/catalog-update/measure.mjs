// Synthetic, cold-cache mobile checks. These are not field Core Web Vitals.
// Run after npm run build: node docs/catalog-update/measure.mjs
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import { createPreviewServer } from '../../preview-local.mjs';

const server = createPreviewServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const sourceOrigin = `http://127.0.0.1:${server.address().port}`;
// Local text compression approximates a CDN response; it does not measure Vercel.
const compressedServer = http.createServer((req, res) => {
  http.get(sourceOrigin + req.url, incoming => {
    const chunks = [];
    incoming.on('data', chunk => chunks.push(chunk));
    incoming.on('end', () => {
      const headers = { ...incoming.headers };
      let body = Buffer.concat(chunks);
      if (/text\/|javascript|json/.test(headers['content-type'] || '')) {
        body = gzipSync(body);
        headers['content-encoding'] = 'gzip';
      }
      headers['content-length'] = body.length;
      res.writeHead(incoming.statusCode, headers);
      res.end(body);
    });
  }).on('error', () => { res.writeHead(502); res.end(); });
});
compressedServer.listen(0, '127.0.0.1');
await once(compressedServer, 'listening');
const origin = `http://127.0.0.1:${compressedServer.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', headless: true });
const runs = [];
try {
  for (const route of ['/', '/catalogo/n9e']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__lab = { lcp: 0, lcpElement: '', cls: 0, interactionDurations: [] };
        new PerformanceObserver(list => { for (const entry of list.getEntries()) { window.__lab.lcp = entry.startTime; window.__lab.lcpElement = entry.element?.className || entry.element?.tagName || ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) window.__lab.interactionDurations.push(entry.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 60000 });
      const mainImage = page.locator(route === '/' ? '.hero-scooter' : '.studio-stage > img').first();
      await mainImage.waitFor({ state: 'visible' });
      await mainImage.evaluate(image => image.complete && image.naturalWidth > 0 ? Promise.resolve() : new Promise((resolve, reject) => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', reject, { once: true }); }));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      const initial = await page.evaluate(() => ({ ...window.__lab, resourceBytes: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0) }));
      if (route === '/') {
        await page.getByRole('button', { name: 'Abrir menu' }).click();
        await page.getByRole('button', { name: 'Fechar menu' }).click();
      } else {
        await page.getByRole('button', { name: 'Aproximar imagem', exact: true }).click();
        await page.getByRole('button', { name: 'Restaurar vista', exact: true }).click();
        await page.getByRole('button', { name: 'Ver imagem 2:', exact: false }).click();
        await page.getByRole('button', { name: 'Ampliar visualização', exact: true }).click();
        await page.getByRole('button', { name: 'Fechar visualização', exact: true }).click();
      }
      await page.waitForTimeout(500);
      const interactions = await page.evaluate(() => window.__lab.interactionDurations);
      const result = { route, run, lcpMs: Math.round(initial.lcp), lcpElement: initial.lcpElement, cls: Number(initial.cls.toFixed(4)), resourceBytes: initial.resourceBytes, eventTimingSamplesMs: interactions, maxSampledInteractionMs: interactions.length ? Math.max(...interactions) : null, errors };
      runs.push(result);
      console.log(JSON.stringify(result));
      await context.close();
    }
  }
  await writeFile(new URL('./performance.json', import.meta.url), JSON.stringify({ measuredAt: new Date().toISOString(), method: { browser: await browser.version(), viewport: '390x844', cpuSlowdown: 4, latencyMs: 150, downloadBytesPerSecond: 200000, uploadBytesPerSecond: 93750, cache: 'disabled; fresh context per run', textCompression: 'gzip via local proxy', runsPerRoute: 3, environment: 'local production build, synthetic Chromium, mobile viewport', limits: 'Not field data or real phone hardware. Event Timing samples from scripted clicks are not a validated INP. CLS is the sum of observed shifts before interaction, not a long-session field value. No active 3D asset exists.' }, runs }, null, 2) + '\n');
} finally {
  await browser.close();
  await new Promise(resolve => compressedServer.close(resolve));
  await new Promise(resolve => server.close(resolve));
}

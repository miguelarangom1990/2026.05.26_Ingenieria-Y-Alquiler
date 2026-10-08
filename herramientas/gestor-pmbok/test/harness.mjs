// Utilidades de prueba compartidas: abre gestor-pmbok.html en Chromium (Playwright),
// sirve la librería desde vendor/ y bloquea fuentes externas.
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = readFileSync(join(root, 'vendor/htm-preact-standalone.umd.js'), 'utf8');

export async function openApp({ width = 1360, height = 900, dark = false, file = 'gestor-pmbok.html', clearStorage = true } = {}) {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', locale: 'es-CO', timezoneId: 'America/Bogota' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/fonts\.(googleapis|gstatic)|net::ERR_FAILED|Failed to load resource/.test(t)) errors.push('console.error: ' + t); } });
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('htm@3.1.1') || url.includes('htm-preact')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: LIB });
    if (url.startsWith('file:')) return route.continue();
    return route.abort();
  });
  await page.goto(pathToFileURL(resolve(root, file)).href);
  if (clearStorage) { await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await page.reload(); }
  await page.waitForFunction(() => window.PM && window.PM.getState && window.PM.getState().mode !== 'loading', null, { timeout: 15000 });
  /* la pantalla también debe salir de «Conectando…» (no solo el estado interno) */
  await waitScreenReady(page);
  return { browser, context, page, errors };
}

export async function waitScreenReady(page, timeout = 15000) {
  await page.waitForFunction(() => { const h = document.querySelector('.view-host'); const f = document.querySelector('.rail-foot'); return !!h && !!f && !/Conectando/.test(h.textContent) && !/Conectando/.test(f.textContent); }, null, { timeout });
}

export async function createProject(page, meta = {}) {
  return page.evaluate(async (meta) => {
    const id = await PM.projectOps.create({ name: 'Proyecto de prueba', code: 'PRY-TEST-001', start: '2026-08-03', end: '2026-12-18', budget: 480000000, currency: 'COP', status: 'En ejecución', lifecycle: 'Predictivo', client: 'Cliente de prueba', manager: 'Director de prueba', sponsor: 'Patrocinador', ...meta });
    PM.selectProject(id, 'tablero');
    return id;
  }, meta);
}

export async function createExample(page, id = 'andamio') {
  return page.evaluate(async (id) => {
    if (!PM.examples || !PM.examples.length) return null;
    await PM.createExampleProject(id && PM.getExample(id) ? id : PM.examples[0].id);
    return PM.getState().projectId;
  }, id);
}

export async function gotoView(page, id) {
  await page.evaluate((id) => PM.navigate(id), id);
  await page.waitForTimeout(350);
}

export async function errorCards(page) {
  return page.$$eval('.error-card', (els) => els.map((e) => e.innerText.slice(0, 600)));
}

export async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

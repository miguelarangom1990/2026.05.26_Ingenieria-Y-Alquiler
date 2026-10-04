// Modo artefacto (db simulada): crea el proyecto de ejemplo, recorre todas las vistas, edita,
// recarga y verifica persistencia, límite de 64 suscripciones, descargas y modo de solo lectura.
// Uso: node test/dbmode.test.mjs --file <ruta.html>
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { installClaudeMock } from './dbmock.mjs';
import { root } from './harness.mjs';

const require = createRequire(import.meta.url);
let playwright; try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const file = resolve(root, fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html');
const LIB = readFileSync(resolve(root, 'vendor/htm-preact-standalone.umd.js'), 'utf8');
const results = []; const check = (name, ok, extra) => { results.push({ name, ok: !!ok, extra }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function session(opts) {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'es-CO', timezoneId: 'America/Bogota' });
  await installClaudeMock(context, opts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/*', (route) => { const u = route.request().url(); if (u.includes('htm@3.1.1')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: LIB }); if (u.startsWith('file:')) return route.continue(); return route.abort(); });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.PM && PM.getState && PM.getState().mode !== 'loading', null, { timeout: 15000 });
  return { browser, context, page, errors };
}

// 1) escritura
let { browser, page, errors } = await session({ canWrite: true, owner: true });
check('modo db activo', (await page.evaluate(() => PM.getState().mode)) === 'db');
check('identidad del visor', (await page.evaluate(() => PM.getState().meId)) === 'u_prueba');
await page.evaluate(() => PM.createExampleProject());
await page.waitForFunction(() => PM.getState().projectId && PM.getState().view === 'tablero', null, { timeout: 120000 });
const pid = await page.evaluate(() => PM.getState().projectId);
const writes = await page.evaluate(() => window.__mock.writes);
check('proyecto de ejemplo importado en db', writes > 40, writes);
const views = await page.evaluate(() => PM.views.map((v) => v.id));
for (const v of views) {
  const before = errors.length;
  await page.evaluate((v) => PM.navigate(v), v);
  await page.waitForTimeout(600);
  const cards = await page.$$eval('.error-card', (e) => e.length);
  check('vista ' + v + ' sin errores', !cards && errors.length === before, errors.slice(before).concat(cards ? ['error-card'] : []));
}
await page.evaluate(() => PM.openDocument('acta-constitucion')); await page.waitForTimeout(600);
await page.evaluate(() => PM.openDocument('registro-riesgos')); await page.waitForTimeout(600);
const maxSubs = await page.evaluate(() => window.__mock.maxSubs);
check('suscripciones simultáneas ≤ 64', maxSubs <= 64, maxSubs);
const mockErrs = await page.evaluate(() => window.__mock.errors);
check('sin errores del almacén simulado', !mockErrs.length, mockErrs);
// edición: estado del proyecto vía ficha + campo de un documento por la tabla de riesgos
await page.evaluate((pid) => PM.projectOps.update(pid, { client: 'Cliente modificado (prueba)' }), pid);
await page.evaluate(() => PM.navigate('riesgos-matriz')); await page.waitForTimeout(500);
const docPath = `projects/${pid}/docs/registro-riesgos`;
const n0 = await page.evaluate((p) => (window.__mock.store.get(p)?.fields?.riesgos || []).length, docPath);
check('registro de riesgos en db', n0 >= 8, n0);
// descarga
await page.evaluate(() => PM.exportProjectFile(PM.getState().projectId, { code: 'PRY-2026-014', name: 'Ejemplo' }));
await page.waitForTimeout(1500);
const dl = await page.evaluate(() => window.__mock.downloads);
check('exportación entregada a downloads', dl.length === 1 && dl[0].filename.endsWith('.json') && dl[0].size > 10000, dl);
const storeDump = await page.evaluate(() => JSON.stringify([...window.__mock.store.entries()]));
check('sin errores de consola (escritura)', !errors.length, errors.slice(0, 5));
await browser.close();

// 2) recarga con el mismo almacén → persistencia (nueva sesión sembrada con el volcado)
({ browser, page, errors } = await session({ canWrite: true }));
await page.evaluate((dump) => { for (const [k, v] of JSON.parse(dump)) window.__mock.store.set(k, v); }, storeDump);
await page.evaluate((pid) => PM.selectProject(pid, 'ficha'), pid);
await page.waitForTimeout(1200);
const client = await page.evaluate(() => document.body.innerText.includes('Cliente modificado (prueba)') || [...document.querySelectorAll('input')].some((i) => i.value === 'Cliente modificado (prueba)'));
check('persistencia de metadatos tras recarga', client);
await browser.close();

// 3) solo lectura
({ browser, page, errors } = await session({ canWrite: false }));
await page.evaluate((dump) => { for (const [k, v] of JSON.parse(dump)) window.__mock.store.set(k, v); }, storeDump);
check('solo lectura detectada', (await page.evaluate(() => PM.getState().canWrite)) === false);
await page.evaluate((pid) => PM.selectProject(pid, 'tablero'), pid);
const banner = await page.evaluate(() => document.body.innerText.includes('Solo lectura'));
check('aviso de solo lectura visible', banner);
for (const v of views) {
  const before = errors.length;
  await page.evaluate((v) => PM.navigate(v), v);
  await page.waitForTimeout(450);
  const cards = await page.$$eval('.error-card', (e) => e.length);
  const primaries = await page.$$eval('.view-host .btn-primary:not([disabled])', (els) => els.map((e) => e.textContent.trim()).filter((t) => /Agregar|Nuevo|Crear|Establecer|Registrar|Guardar|Importar/i.test(t)));
  check('solo lectura ' + v + ': sin errores ni acciones de edición', !cards && errors.length === before && !primaries.length, { errs: errors.slice(before), primaries });
}
const writesRO = await page.evaluate(() => window.__mock.writes);
check('solo lectura: ninguna escritura', writesRO === 0, writesRO);
await browser.close();

// 4) visor sin capacidades (db null): modo local
({ browser, page, errors } = await session({ disable: ['db', 'user', 'downloads', 'sample'] }));
check('sin db → modo local', (await page.evaluate(() => PM.getState().mode)) === 'local');
await browser.close();

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

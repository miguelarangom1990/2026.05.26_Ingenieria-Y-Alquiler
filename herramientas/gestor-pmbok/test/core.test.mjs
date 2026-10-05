// Pruebas de regresión del núcleo (00-core, 06-model, 08-shell, head.html, 99-boot): arranque, sincronización,
// almacenamiento local con varias pestañas, kit de UI (modal, menú, tabla), riel móvil, portafolio, importación.
// Uso: node test/core.test.mjs --file <ruta.html>
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { openApp, createProject, createExample, gotoView, errorCards, horizontalOverflow, waitScreenReady, root } from './harness.mjs';
import { installClaudeMock } from './dbmock.mjs';

const require = createRequire(import.meta.url);
let playwright; try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const file = fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html';
const LIB = readFileSync(resolve(root, 'vendor/htm-preact-standalone.umd.js'), 'utf8');
const results = [];
const check = (name, ok, extra) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };
const wait = (page, ms) => page.waitForTimeout(ms);
const toasts = (page) => page.$$eval('.toast', (els) => els.map((e) => e.innerText));

async function dbSession(opts, { width = 1360, height = 900 } = {}) {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width, height }, locale: 'es-CO', timezoneId: 'America/Bogota' });
  await installClaudeMock(context, opts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/*', (route) => { const u = route.request().url(); if (u.includes('htm@3.1.1')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: LIB }); if (u.startsWith('file:')) return route.continue(); return route.abort(); });
  await page.goto(pathToFileURL(resolve(root, file)).href);
  await page.waitForFunction(() => window.PM && PM.getState && PM.getState().mode !== 'loading', null, { timeout: 15000 });
  return { browser, context, page, errors };
}
const screenText = (page) => page.evaluate(() => ({ host: document.querySelector('.view-host').innerText, foot: document.querySelector('.rail-foot').innerText, banners: [...document.querySelectorAll('.banner')].map((b) => b.innerText) }));

/* ------------------------------------------------------------ 1. arranque (modo local, sin proyecto) */
{
  const { browser, page, errors } = await openApp({ file });
  await wait(page, 300);
  const t = await screenText(page);
  check('arranque local: el portafolio aparece sin clics', /Aún no hay proyectos/.test(t.host) && !/Conectando/.test(t.host), t.host.slice(0, 120));
  check('arranque local: pie del riel con el modo', /Datos solo en este navegador/.test(t.foot), t.foot.slice(0, 60));
  check('arranque local: aviso de modo local', t.banners.some((b) => /Modo local/.test(b)), t.banners);
  check('idioma de la página es-CO', (await page.evaluate(() => document.documentElement.lang)) === 'es-CO');
  /* ícono del botón principal del estado vacío con el color del botón */
  const ic = await page.evaluate(() => { const b = document.querySelector('.empty .btn-primary'); const i = b && b.querySelector('.icon'); return b && i ? [getComputedStyle(b).color, getComputedStyle(i).color] : null; });
  check('estado vacío: ícono del botón principal del color del botón', ic && ic[0] === ic[1], ic);
  /* importación de un archivo que no es JSON */
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.evaluate(() => PM.importProjectFile())]);
  await chooser.setFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('hola, esto no es json') });
  await wait(page, 400);
  const tt = await toasts(page);
  check('importar: archivo que no es JSON → mensaje en español', tt.some((x) => /no es un JSON válido/.test(x)) && !tt.some((x) => /Unexpected token|not valid JSON/.test(x)), tt);
  /* promesa rechazada sin manejar en escrituras fallidas */
  const before = errors.length;
  await page.evaluate(() => PM.store.update('projects/nope', { a: 1 }, { quiet: true }).catch(() => 'manejado'));
  await wait(page, 300);
  check('escritura fallida manejada: sin rechazo sin manejar', errors.length === before, errors.slice(before));
  /* touch sobre un proyecto inexistente: sin aviso ni error */
  await page.evaluate(() => PM.projectOps.touch('p_noexiste'));
  await wait(page, 300);
  check('touch de un proyecto eliminado: sin aviso de error', !(await toasts(page)).some((x) => /No se pudo guardar/.test(x)) && errors.length === before, await toasts(page));
  check('arranque local: sin errores de consola', !errors.length, errors.slice(0, 3));
  await browser.close();
}

/* ------------------------------------------------------------ 2. arranque en modo db (respuesta inmediata del visor) */
for (const canWrite of [true, false]) {
  const { browser, page, errors } = await dbSession({ canWrite });
  await waitScreenReady(page).catch(() => {});
  const t = await screenText(page);
  check(`arranque db (escritura ${canWrite}): portafolio sin clics`, /Proyectos/.test(t.host) && !/Conectando/.test(t.host + t.foot), t.host.slice(0, 80) + ' | ' + t.foot.slice(0, 40));
  if (!canWrite) check('arranque db solo lectura: aviso visible de entrada', t.banners.some((b) => /Solo lectura/.test(b)), t.banners);
  await browser.close();
}

/* ------------------------------------------------------------ 3. errores de suscripción (db): no se trata como «no existe» ni se sobrescribe */
{
  const { browser, page, errors } = await dbSession({ canWrite: true });
  const pid = await page.evaluate(async () => {
    const id = await PM.projectOps.create({ name: 'Proyecto sync', code: 'PRY-S', start: '2026-08-03', status: 'En ejecución' });
    const t = PM.templates['enunciado-alcance'];
    const body = PM.newDocBody(t, { name: 'Proyecto sync' }, { template: 'enunciado-alcance' });
    body.status = 'aprobado'; body.rev = '1'; body.fields = { ...body.fields, alcanceProducto: 'Texto aprobado' };
    await PM.store.set(PM.paths.doc(id, 'enunciado-alcance'), body);
    /* el siguiente onSnapshot del documento falla con «unavailable» (puente caído) */
    const db = await PM.caps.db; const orig = db.doc.bind(db); window.__failNext = new Set([PM.paths.doc(id, 'enunciado-alcance')]);
    db.doc = (path) => { const ref = orig(path); if (window.__failNext.has(path)) { window.__failNext.delete(path); return { ...ref, onSnapshot: (next, err) => { setTimeout(() => err({ code: 'unavailable', message: 'bridge' }), 10); return () => {}; } }; } return ref; };
    /* sonda: componente mínimo que usa PM.useDoc */
    const { html, render } = PM.lib;
    window.__probe = {};
    function Probe() { const r = PM.useDoc(PM.paths.doc(id, 'enunciado-alcance')); window.__probe = r; return null; }
    const host = document.createElement('div'); document.body.appendChild(host);
    window.__failNext.add(PM.paths.doc(id, 'enunciado-alcance'));
    render(html`<${Probe} />`, host);
    return id;
  });
  await wait(page, 200);
  const st1 = await page.evaluate(() => ({ loading: window.__probe.loading, exists: window.__probe.exists, error: window.__probe.error && window.__probe.error.code, issues: PM.getState().syncIssues }));
  check('suscripción con error: sigue cargando (no «no existe») y expone el error', st1.loading === true && st1.exists === false && st1.error === 'unavailable' && st1.issues > 0, st1);
  const banner = await page.evaluate(() => [...document.querySelectorAll('.banner')].some((b) => /No se pudo leer parte de los datos/.test(b.innerText)));
  check('suscripción con error: aviso de reintento visible', banner);
  await page.evaluate(() => window.__probe.saveNow({ template: 'enunciado-alcance', status: 'borrador', fields: { x: 1 } }));
  await wait(page, 300);
  const stored = await page.evaluate((pid) => window.__mock.store.get(PM.paths.doc(pid, 'enunciado-alcance')).status, pid);
  check('suscripción con error: un guardado no sobrescribe el documento', stored === 'aprobado', stored);
  check('suscripción con error: aviso de cambio no guardado', (await toasts(page)).some((x) => /no se guardó para no sobrescribir/.test(x)), await toasts(page));
  await page.waitForFunction(() => window.__probe && window.__probe.loading === false, null, { timeout: 8000 }).catch(() => {});
  const st2 = await page.evaluate(() => ({ loading: window.__probe.loading, exists: window.__probe.exists, status: window.__probe.data && window.__probe.data.status, issues: PM.getState().syncIssues }));
  check('suscripción con error: se reintenta sola y carga el documento', st2.loading === false && st2.exists && st2.status === 'aprobado' && st2.issues === 0, st2);
  /* el editor real tampoco muestra «Aún no creado» ante un error */
  await page.evaluate(async (pid) => { await PM.store.set(PM.paths.doc(pid, 'registro-supuestos'), PM.newDocBody(PM.templates['registro-supuestos'], null, { template: 'registro-supuestos', status: 'aprobado', rev: '0' })); window.__failNext.add(PM.paths.doc(pid, 'registro-supuestos')); }, pid);
  await page.evaluate((pid) => PM.selectProject(pid, 'tablero'), pid);
  await wait(page, 300);
  await page.evaluate(() => PM.openDocument('registro-supuestos'));
  await wait(page, 250);
  const ed = await page.evaluate(() => document.querySelector('.view-host').innerText);
  check('editor con error de suscripción: no dice que el documento no existe', !/todavía no existe|Aún no creado/.test(ed), ed.slice(0, 160));
  /* muchas suscripciones: se liberan las inactivas antes de llegar al límite de 64 */
  await page.evaluate(async (pid) => {
    const ids = PM.templateList.filter((t) => !t.multiple).map((t) => t.id).slice(0, 45);
    for (const id of ids) { PM.openDocument(id); await new Promise((r) => setTimeout(r, 120)); }
  }, pid);
  await wait(page, 2500);
  const subs = await page.evaluate(() => ({ max: window.__mock.maxSubs, errs: window.__mock.errors.filter((e) => /64/.test(e)), stats: PM.syncStats() }));
  check('recorrer 45 documentos seguidos: sin exceder 64 suscripciones', subs.max <= 64 && !subs.errs.length, subs);
  check('modo db: sin errores de consola', !errors.length, errors.slice(0, 3));
  await browser.close();
}

/* ------------------------------------------------------------ 4. modo local con dos pestañas: no se pierden ediciones de otros documentos */
{
  const { browser, context, page: A, errors } = await openApp({ file });
  const B = await context.newPage();
  B.on('pageerror', (e) => errors.push('pageerror B: ' + e.message));
  await B.route('**/*', (route) => { const u = route.request().url(); if (u.includes('htm@3.1.1')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: LIB }); if (u.startsWith('file:')) return route.continue(); return route.abort(); });
  await B.goto(pathToFileURL(resolve(root, file)).href);
  await B.waitForFunction(() => window.PM && PM.getState().mode === 'local');
  for (let i = 0; i < 6; i++) {
    await A.evaluate((i) => PM.store.set('projects/pA/tools/wbs', { nodes: Array.from({ length: i + 1 }, (_, k) => ({ id: 'n' + k, name: 'N' + k })) }), i);
    await wait(A, 60 + i * 20);
    await B.evaluate((i) => PM.store.set('projects/pA/docs/registro-riesgos', { template: 'registro-riesgos', fields: { n: i } }), i);
    await wait(A, 400);
  }
  await wait(A, 600);
  const persisted = await A.evaluate(() => { const m = JSON.parse(localStorage.getItem('pmbok-gestor.data.v1') || '{}'); return { wbs: (m['projects/pA/tools/wbs'] || {}).nodes?.length ?? null, risks: (m['projects/pA/docs/registro-riesgos'] || {}).fields?.n ?? null }; });
  const memA = await A.evaluate(async () => ({ wbs: (await PM.store.get('projects/pA/tools/wbs'))?.nodes?.length ?? null, risks: (await PM.store.get('projects/pA/docs/registro-riesgos'))?.fields?.n ?? null }));
  const memB = await B.evaluate(async () => ({ wbs: (await PM.store.get('projects/pA/tools/wbs'))?.nodes?.length ?? null, risks: (await PM.store.get('projects/pA/docs/registro-riesgos'))?.fields?.n ?? null }));
  check('dos pestañas: se conservan las ediciones de ambas (guardado)', persisted.wbs === 6 && persisted.risks === 5, persisted);
  check('dos pestañas: ambas ven los dos cambios', memA.wbs === 6 && memA.risks === 5 && memB.wbs === 6 && memB.risks === 5, { memA, memB });
  check('dos pestañas: sin errores', !errors.length, errors.slice(0, 3));
  await browser.close();
}

/* ------------------------------------------------------------ 5. kit de UI: modal, menú desplegable, tabla, formatos */
{
  const { browser, page, errors } = await openApp({ file });
  await createExample(page);
  await wait(page, 600);
  /* PM.promptText: foco en el campo, Enter acepta */
  const p = page.evaluate(() => PM.promptText({ title: 'Nombre de la línea base', label: 'Nombre' }));
  await wait(page, 250);
  check('promptText: foco inicial en el campo', await page.evaluate(() => document.activeElement && document.activeElement.id === 'pm-prompt'));
  await page.keyboard.type('LB2 prueba'); await page.keyboard.press('Enter');
  check('promptText: Enter acepta el texto', (await p) === 'LB2 prueba');
  /* Nuevo proyecto: foco en el nombre y Tab no sale del diálogo */
  await gotoView(page, 'portafolio');
  await page.evaluate(() => PM.openNewProject([]));
  await wait(page, 250);
  check('Nuevo proyecto: foco inicial en el nombre', await page.evaluate(() => document.activeElement && document.activeElement.id === 'pf-name'));
  let outside = 0;
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.modal')))) outside++; }
  await page.focus('#pf-name'); await page.keyboard.press('Shift+Tab');
  const backIn = await page.evaluate(() => !!document.activeElement.closest('.modal'));
  check('modal: Tab y Mayús+Tab no salen del diálogo', outside === 0 && backIn, { outside, backIn });
  await page.keyboard.press('Escape'); await wait(page, 150);
  check('modal: Escape cierra', (await page.$$('.modal')).length === 0);
  /* menú desplegable: ancho acotado y dentro de la pantalla */
  await page.locator('.port-table .port-c-act button').first().click();
  await wait(page, 150);
  const mb = await page.evaluate(() => { const m = document.querySelector('.menu[role="menu"]'); const r = m.getBoundingClientRect(); return { w: Math.round(r.width), right: Math.round(r.right), vw: innerWidth }; });
  check('menú desplegable: ancho ≈ 200 px y dentro de la pantalla', mb.w <= 260 && mb.right <= mb.vw, mb);
  await page.keyboard.press('Escape');
  /* tabla editable: filas nulas no rompen el editor; 200 filas abren rápido y una tecla redibuja una fila */
  const pid = await page.evaluate(() => PM.getState().projectId);
  await page.evaluate(async (pid) => {
    const path = PM.paths.doc(pid, 'registro-riesgos'); const d = PM.clone(await PM.store.get(path));
    d.status = 'borrador'; d.fields.riesgos = [null, ...d.fields.riesgos.slice(0, 2), 'x']; await PM.store.set(path, d);
  }, pid);
  await page.evaluate(() => PM.openDocument('registro-riesgos')); await wait(page, 600);
  check('tabla con filas nulas: el editor abre sin error', !(await errorCards(page)).length && (await page.$$eval('.view-host table tbody tr', (r) => r.length)) >= 2, await errorCards(page));
  await gotoView(page, 'riesgos-matriz'); await wait(page, 300);
  check('matriz de riesgos con filas nulas: sin error', !(await errorCards(page)).length, await errorCards(page));
  await page.evaluate(async (pid) => {
    const path = PM.paths.doc(pid, 'registro-riesgos'); const d = PM.clone(await PM.store.get(path)); const base = d.fields.riesgos.filter(Boolean).filter((r) => typeof r === 'object');
    d.fields.riesgos = Array.from({ length: 200 }, (_, i) => ({ ...base[i % base.length], id: 'R-' + String(i + 1).padStart(3, '0') })); await PM.store.set(path, d); PM.navigate('tablero');
  }, pid);
  await wait(page, 400);
  const t0 = Date.now();
  await page.evaluate(() => PM.openDocument('registro-riesgos'));
  await page.waitForFunction(() => document.querySelectorAll('.view-host textarea').length >= 600, null, { timeout: 30000 });
  const openMs = Date.now() - t0;
  check('registro de 200 riesgos: abre en menos de 3 s', openMs < 3000, openMs);
  const rowRenders = await page.evaluate(async () => {
    const ta = document.querySelectorAll('.view-host table tbody tr')[5].querySelector('textarea');
    await new Promise((r) => setTimeout(r, 300));
    PM.uiStats.rowRenders = 0;
    ta.focus(); ta.value += 'x'; ta.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1200));
    return PM.uiStats.rowRenders;
  });
  check('tabla: una tecla vuelve a dibujar solo su fila (también tras guardar)', rowRenders >= 1 && rowRenders <= 3, rowRenders);
  check('kit de UI: sin errores de consola', !errors.length, errors.slice(0, 3));
  await browser.close();
}

/* ------------------------------------------------------------ 6. contraste (tokens) en tema claro y oscuro */
for (const dark of [false, true]) {
  const { browser, page } = await openApp({ file, dark });
  const r = await page.evaluate(() => {
    const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = rgb.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const cr = (a, b) => { const x = lum(parse(a)), y = lum(parse(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const probe = (cls, inner) => { const el = document.createElement('span'); el.className = cls; el.textContent = 'Prueba'; document.body.appendChild(el); const cs = getComputedStyle(el); const out = [cs.color, cs.backgroundColor]; el.remove(); return out; };
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const faint = probe('faint')[0];
    const chip = probe('chip chip-signal');
    const toast = probe('toast crit');
    const danger = probe('btn btn-danger-solid');
    return { faintOnBg: cr(faint, bodyBg), chipSignal: cr(chip[0], chip[1]), toastCrit: cr(toast[0], toast[1]), dangerSolid: cr(danger[0], danger[1]) };
  });
  const min = Math.min(r.faintOnBg, r.chipSignal, r.toastCrit, r.dangerSolid);
  check(`contraste ${dark ? 'oscuro' : 'claro'}: texto tenue, chip señal, aviso de error y botón Eliminar ≥ 4,5:1`, min >= 4.5, r);
  await browser.close();
}

/* ------------------------------------------------------------ 7. móvil: riel, selector de proyecto y portafolio */
{
  const { browser, page, errors } = await openApp({ file, width: 400, height: 860 });
  await createExample(page); await wait(page, 500);
  await gotoView(page, 'portafolio'); await wait(page, 300);
  const port = await page.evaluate(() => { const t = document.querySelector('.port-table'); const w = document.querySelector('.port-wrap'); const row = t.querySelector('tbody tr'); const act = row.querySelector('.port-c-act button'); const r = act.getBoundingClientRect(); return { top: Math.round(row.getBoundingClientRect().top), sw: w.scrollWidth, cw: w.clientWidth, actVisible: r.right <= innerWidth && r.width > 0, chip: !!row.querySelector('.port-c-status .chip') && row.querySelector('.port-c-status').getBoundingClientRect().width > 0 }; });
  check('portafolio móvil: lista visible sin desplazar y como tarjetas', port.top < 860 && port.sw <= port.cw + 1 && port.actVisible && port.chip, port);
  check('portafolio móvil: sin desborde horizontal', (await horizontalOverflow(page)) <= 1);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ inRail: !!document.activeElement.closest('.rail'), label: document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim().slice(0, 30) }));
  check('móvil: con el riel cerrado, Tab no entra al menú oculto', !first.inRail, first);
  const menuBtn = page.locator('.topbar .topbar-menu');
  check('móvil: botón de menú con aria-expanded=false', (await menuBtn.getAttribute('aria-expanded')) === 'false');
  await menuBtn.click(); await wait(page, 300);
  const opened = await page.evaluate(() => ({ inRail: !!document.activeElement.closest('.rail'), expanded: document.querySelector('.topbar .topbar-menu').getAttribute('aria-expanded') }));
  check('móvil: al abrir el menú el foco entra al riel', opened.inRail && opened.expanded === 'true', opened);
  await page.keyboard.press('Escape'); await wait(page, 300);
  const closed = await page.evaluate(() => ({ navOpen: PM.getState().navOpen, onBtn: document.activeElement === document.querySelector('.topbar .topbar-menu') }));
  check('móvil: Escape cierra el menú y devuelve el foco', !closed.navOpen && closed.onBtn, closed);
  await browser.close();
}
{
  const { browser, page } = await openApp({ file });
  await createExample(page); await wait(page, 400);
  await page.focus('.switcher-btn'); await page.keyboard.press('ArrowDown'); await wait(page, 150);
  const inMenu = await page.evaluate(() => document.activeElement.getAttribute('role'));
  await page.keyboard.press('ArrowDown'); await wait(page, 50);
  const moved = await page.evaluate(() => document.activeElement.getAttribute('role'));
  await page.keyboard.press('Escape'); await wait(page, 150);
  const back = await page.evaluate(() => document.activeElement.classList.contains('switcher-btn') && !document.querySelector('.switcher .menu'));
  check('selector de proyecto: flechas entran y recorren la lista; Escape devuelve el foco', inMenu === 'menuitemradio' && /menuitem/.test(moved || '') && back, { inMenu, moved, back });
  await browser.close();
}

/* ------------------------------------------------------------ 8. datos de herramientas mal formados (importación) */
{
  const { browser, page, errors } = await openApp({ file });
  await createExample(page); await wait(page, 500);
  const pid = await page.evaluate(async () => {
    const data = await PM.projectOps.exportData(PM.getState().projectId);
    const tools = Object.fromEntries(data.collections.tools.map((t) => [t.id, t.data]));
    tools.schedule.tasks[1].deps = { ...(tools.schedule.tasks[1].deps[0] || { id: tools.schedule.tasks[0].id }) };
    tools.schedule.settings.extraHolidays = 'x';
    tools.schedule.tasks[2].resources = 'Cuadrilla';
    tools.costs.actuals = { a: 1 };
    const id = await PM.projectOps.importData(data, { rename: 'Importado dañado' });
    PM.selectProject(id, 'tablero');
    return id;
  });
  await wait(page, 600);
  const bad = [];
  for (const v of ['tablero', 'edt', 'cronograma', 'red', 'recursos', 'valor-ganado', 'lineas-base', 'ficha', 'raci', 'riesgos-matriz']) { await gotoView(page, v); await wait(page, 250); const c = await errorCards(page); if (c.length) bad.push(v + ': ' + c[0].slice(0, 160)); }
  check('importación con datos mal formados: las vistas abren sin error', !bad.length, bad);
  const fixed = await page.evaluate((pid) => PM.store.get(PM.paths.tool(pid, 'schedule')).then((s) => [Array.isArray(s.tasks[1].deps), Array.isArray(s.settings.extraHolidays), Array.isArray(s.tasks[2].resources)]), pid);
  check('importación: los datos de herramientas se guardan normalizados', fixed.every(Boolean), fixed);
  await browser.close();
}

/* ------------------------------------------------------------ 9. eliminar un proyecto con un «actualizado» pendiente */
{
  const { browser, page, errors } = await openApp({ file });
  const pid = await createProject(page);
  await wait(page, 300);
  await page.evaluate((pid) => { PM.touchProject(pid); return PM.projectOps.remove(pid); }, pid);
  await wait(page, 8700);
  const tt = await toasts(page);
  check('eliminar proyecto: el «actualizado» pendiente no muestra error', !tt.some((x) => /No se pudo guardar/.test(x)) && !errors.length, { tt, errors: errors.slice(0, 2) });
  await browser.close();
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

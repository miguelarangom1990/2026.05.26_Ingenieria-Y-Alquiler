// Pruebas de interacción de 45-agile-backlog: Backlog del producto y Tablero Kanban (§9.4).
// Uso: node test/agile-backlog.test.mjs --file <página con --include 45> [--shots dir]
// Cubre: indicadores, alta rápida, editor (crear, validar, editar, estado con historial), reordenar con botones,
// teclado y arrastre (una sola escritura), filtros, refinamiento, agrupación por épica, selección múltiple,
// exportación CSV, configuración ágil, tablero (WIP, confirmación, botones, teclado, «Mover a…», editor),
// traer del backlog, editor de columnas con reasignación, métricas de flujo, solo lectura, proyecto predictivo,
// 300 elementos, tema oscuro, 1920 px y 400 px sin desborde.
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const ok = (name, cond, info) => { results.push({ name, ok: !!cond, info }); console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond || info === undefined ? '' : '\n      ' + JSON.stringify(info).slice(0, 400))); };
async function step(name, fn) { try { await fn(); } catch (e) { ok(name + ' (excepción)', false, String(e && e.stack || e).split('\n').slice(0, 4).join(' | ')); } }
const sleep = (page, ms) => page.waitForTimeout(ms);

/* ---------------------------------------------------------------- datos de prueba */
async function seed(page, pid, extra = {}) {
  await page.evaluate(async ({ pid, extra }) => {
    const today = PM.date.today(), add = (n) => PM.date.add(today, n);
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [
      { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1 },
      { id: 'w2', parentId: null, name: 'Montaje en obra', order: 2, approach: 'predictivo' },
      { id: 'w3', parentId: null, name: 'Plataforma digital de alquiler', order: 3, approach: 'adaptativo' },
      { id: 'w4', parentId: 'w3', name: 'Portal de clientes', order: 1 },
    ] });
    await PM.store.set(PM.paths.tool(pid, 'agile'), { settings: { framework: extra.framework || 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, columns: [
      { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null }, { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 2 },
      { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 }, { id: 'terminado', name: 'Terminado', category: 'terminado', wip: null }], scopeChangeThreshold: 10 },
      releases: [{ id: 'r1', name: 'Release 1 · Inventario', status: 'en-curso', start: add(-30), end: add(30) }, { id: 'r2', name: 'Release 2 · Facturación', status: 'planeado' }],
      sprints: [{ id: 's1', name: 'Iteración 1', releaseId: 'r1', start: add(-28), end: add(-15), status: 'cerrado' }, { id: 's2', name: 'Iteración 2', releaseId: 'r1', start: add(-14), end: add(5), status: 'en-curso', goal: 'Reservas de equipos en línea' }] });
    if (extra.many) {
      const types = ['historia', 'historia', 'historia', 'defecto', 'tarea', 'mejora'];
      const cols = ['backlog', 'backlog', 'por-hacer', 'en-curso', 'en-revision', 'terminado'];
      for (let k = 0; k < extra.many; k++) {
        const st = cols[k % cols.length];
        await PM.store.set(PM.paths.backlogItem(pid, 'm' + k), { code: 'HU-' + String(k + 1).padStart(3, '0'), type: types[k % types.length], title: 'Elemento de carga ' + (k + 1), estimate: (k % 8) + 1, priority: PM.AGILE.PRIORITIES[k % 4], rank: (k + 1) * 1000, status: st, releaseId: k % 3 ? 'r1' : 'r2', sprintId: k % 2 ? 's2' : null, assignee: ['Analista', 'Desarrollador', 'Arquitecto', ''][k % 4], blocked: k % 37 === 0, acceptance: k % 5 ? 'Criterio' : '', createdAt: add(-40 + (k % 30)), doneDate: st === 'terminado' ? add(-(k % 20)) : null, history: [{ date: add(-40 + (k % 30)), status: 'backlog' }, { date: add(-30 + (k % 20)), status: 'en-curso' }, { date: add(-(k % 20)), status: st }] });
      }
      return;
    }
    const items = [
      { id: 'e1', code: 'EP-001', type: 'epica', title: 'Gestión de inventario de andamios', rank: 500, status: 'backlog' },
      { id: 'e2', code: 'EP-002', type: 'epica', title: 'Facturación electrónica', rank: 600, status: 'backlog' },
      { id: 'i1', code: 'HU-001', type: 'historia', title: 'Como almacenista quiero registrar entradas de equipos', estimate: 5, priority: 'Debe tener', value: 8, releaseId: 'r1', sprintId: 's1', epicId: 'e1', wbsId: 'w4', status: 'terminado', assignee: 'Equipo de desarrollo', acceptance: 'Dado…', createdAt: add(-40), doneDate: add(-20), history: [{ date: add(-40), status: 'backlog' }, { date: add(-27), status: 'por-hacer' }, { date: add(-25), status: 'en-curso' }, { date: add(-20), status: 'terminado' }], rank: 1000 },
      { id: 'i2', code: 'HU-002', type: 'historia', title: 'Como comercial quiero consultar disponibilidad', estimate: 3, priority: 'Debe tener', value: 7, releaseId: 'r1', sprintId: 's2', epicId: 'e1', wbsId: 'w4', status: 'en-curso', assignee: 'Analista', acceptance: 'x', createdAt: add(-30), history: [{ date: add(-30), status: 'backlog' }, { date: add(-14), status: 'por-hacer' }, { date: add(-3), status: 'en-curso' }], rank: 2000 },
      { id: 'i3', code: 'HU-003', type: 'historia', title: 'Reservar equipos desde el portal', estimate: 8, priority: 'Debería tener', releaseId: 'r1', sprintId: 's2', epicId: 'e1', status: 'en-curso', assignee: 'Desarrollador', blocked: true, blockedReason: 'Falta API del ERP', acceptance: 'x', createdAt: add(-30), history: [{ date: add(-30), status: 'backlog' }, { date: add(-6), status: 'en-curso' }], rank: 3000 },
      { id: 'i4', code: 'DF-001', type: 'defecto', title: 'Error al calcular días de alquiler', estimate: 2, priority: 'Debe tener', releaseId: 'r1', sprintId: 's2', status: 'en-revision', assignee: 'Analista', createdAt: add(-10), history: [{ date: add(-10), status: 'backlog' }, { date: add(-2), status: 'en-revision' }], rank: 4000 },
      { id: 'i5', code: 'HU-004', type: 'historia', title: 'Generar factura electrónica DIAN', estimate: null, priority: 'Debe tener', releaseId: 'r2', epicId: 'e2', status: 'backlog', createdAt: add(-5), rank: 5000 },
      { id: 'i6', code: 'HU-005', type: 'historia', title: 'Notificar cartera vencida', estimate: 5, priority: 'Podría tener', releaseId: 'r2', epicId: 'e2', status: 'backlog', createdAt: add(-5), rank: 6000 },
      { id: 'i7', code: 'TA-001', type: 'tarea', title: 'Configurar ambiente de pruebas', estimate: 1, priority: 'Debería tener', sprintId: 's2', status: 'por-hacer', createdAt: add(-5), acceptance: 'ok', rank: 7000 },
      { id: 'i8', code: 'IN-001', type: 'investigacion', title: 'Evaluar lector de códigos QR para bodega', estimate: 3, priority: 'Podría tener', status: 'backlog', createdAt: add(-3), rank: 8000 },
    ];
    for (const it of items) { const { id, ...b } = it; await PM.store.set(PM.paths.backlogItem(pid, id), b); }
  }, { pid, extra });
  await sleep(page, 300);
}
const readItems = (page, pid) => page.evaluate(async (pid) => Object.fromEntries((await PM.store.list(PM.paths.backlog(pid))).map((d) => [d.id, d.data])), pid);
const readAgile = (page, pid) => page.evaluate((pid) => PM.store.get(PM.paths.tool(pid, 'agile')), pid);
const order = (page) => page.$$eval('tr[data-agb-row]', (els) => els.map((e) => e.querySelector('.code-tag').textContent.trim()));
const spy = (page) => page.evaluate(() => {
  if (!window.__spyOn) { const orig = PM.store.set; window.__spyOn = true; PM.store.set = function (path, data, o) { if (/\/backlog\//.test(path)) (window.__sets = window.__sets || []).push(path.split('/').pop()); return orig.call(this, path, data, o); }; }
  window.__sets = [];
});
const sets = (page) => page.evaluate(() => window.__sets || []);
const activeLabel = (page) => page.evaluate(() => { const a = document.activeElement; return a ? a.getAttribute('aria-label') || a.textContent.trim() : null; });
const modalOpen = (page) => page.$('.modal[role="dialog"]').then(Boolean);
const tileText = (page, id) => page.$eval('[data-tile="' + id + '"]', (e) => e.innerText.replace(/\s+/g, ' '));
const today = (page) => page.evaluate(() => PM.date.today());

/* ================================================================= sesión 1: escritorio, tema claro */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  const pid = await createProject(page, { lifecycle: 'Híbrido' });
  await seed(page, pid);
  const T = await today(page);
  await gotoView(page, 'backlog');
  await page.waitForSelector('tr[data-agb-row]');

  await step('registro de vistas', async () => {
    const v = await page.evaluate(() => ['backlog', 'kanban'].map((id) => { const x = PM.getView(id); return x && [x.label, x.group, x.order, x.icon, x.when === PM.agile.when, x.unavailable === PM.AgileUnavailable]; }));
    ok('vistas backlog y kanban registradas (grupo, orden, ícono, when, unavailable)', JSON.stringify(v) === JSON.stringify([['Backlog del producto', 'agil', 10, 'backlog', true, true], ['Tablero Kanban', 'agil', 20, 'kanban', true, true]]), v);
    ok('funciones globales expuestas', await page.evaluate(() => typeof PM.agileSettingsDialog === 'function' && typeof PM.agileItemDialog === 'function'));
    ok('menú híbrido: backlog y tablero visibles', (await page.$$('.nav-item:has-text("Backlog del producto"), .nav-item:has-text("Tablero Kanban")')).length === 2);
  });

  await step('indicadores', async () => {
    ok('lista con 10 elementos en orden de rango', JSON.stringify(await order(page)) === JSON.stringify(['EP-001', 'EP-002', 'HU-001', 'HU-002', 'HU-003', 'DF-001', 'HU-004', 'HU-005', 'TA-001', 'IN-001']), await order(page));
    ok('indicador: elementos (sin épicas)', /Elementos \(sin épicas\) 8 1 terminado · 1 bloqueado · además 2 épicas/.test(await tileText(page, 'items')), await tileText(page, 'items'));
    const cnt = await page.$eval('[data-agb-count]', (e) => e.textContent.trim());
    ok('contador de la barra coherente con el indicador (aclara las épicas)', cnt === '10 elementos (incluye 2 épicas)', cnt);
    ok('indicador: total estimado con unidad', /27 pts/.test(await tileText(page, 'total')), await tileText(page, 'total'));
    ok('indicador: sin estimar', /Sin estimar 1/.test(await tileText(page, 'unest')));
    ok('indicador: sin criterios de aceptación', /aceptación 4/.test(await tileText(page, 'noacc')));
    const rel = await page.$eval('[data-agb-releases]', (e) => e.innerText.replace(/\s+/g, ' '));
    ok('total por release', /Release 1 · Inventario En curso · 4 elementos 18 pts 5 terminados/.test(rel) && /Release 2 · Facturación .*5 pts/.test(rel) && /Sin release 2 elementos 4 pts/.test(rel), rel);
    const ep = await page.$eval('[data-epic-progress="e1"]', (e) => e.innerText);
    ok('épica con avance (terminados / total de sus hijos)', /1 de 3 terminados \(33 %\) · 5 \/ 16 pts/.test(ep), ep);
    ok('fila muestra entregable EDT con código y distintivo ágil', /1\.3\.1 Portal de clientes Ágil/.test(await page.$eval('tr[data-agb-row="i1"] .agb-c-wbs', (e) => e.innerText.replace(/\s+/g, ' '))));
    ok('fila muestra bloqueado con texto', /Bloqueado Falta API del ERP/.test(await page.$eval('tr[data-agb-row="i3"]', (e) => e.innerText.replace(/\s+/g, ' '))));
    ok('nota: reordenar no requiere control de cambios', /no requiere control de cambios/.test(await page.innerText('.agb-page')));
  });

  await step('alta rápida', async () => {
    await page.fill('input[aria-label="Título de la nueva historia (alta rápida)"]', 'Cotizar alquiler en línea');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => [...document.querySelectorAll('tr[data-agb-row] .code-tag')].some((e) => e.textContent === 'HU-006'));
    const o = await order(page);
    ok('alta rápida: historia HU-006 al final', o[o.length - 1] === 'HU-006', o);
    await sleep(page, 200);
    const it = Object.values(await readItems(page, pid)).find((x) => x.code === 'HU-006');
    ok('alta rápida: guardada como historia en el backlog', it && it.type === 'historia' && it.status === 'backlog' && it.rank === 9000 && it.title === 'Cotizar alquiler en línea' && it.history.length === 1, it);
    ok('alta rápida: el campo queda vacío', (await page.inputValue('input[aria-label="Título de la nueva historia (alta rápida)"]')) === '');
  });

  await step('editor: crear', async () => {
    await page.click('.page-actions button:has-text("Nuevo elemento")');
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('editor: foco inicial en el título', await page.evaluate(() => document.activeElement && document.activeElement.id === 'agb-f-title'));
    await page.click('.modal-foot button:has-text("Agregar elemento")');
    ok('editor: título obligatorio', /Escribe el título del elemento/.test(await page.innerText('.modal')));
    await page.selectOption('#agb-f-type', 'defecto');
    ok('editor: código según el tipo', (await page.inputValue('#agb-f-code')) === 'DF-002');
    await page.fill('#agb-f-title', 'Fecha de devolución mal calculada en festivos');
    await page.fill('#agb-f-acc', 'Dado un festivo, cuando se calcula la devolución, entonces se omite');
    await page.fill('#agb-f-est', '3');
    await page.selectOption('#agb-f-prio', 'Debe tener');
    await page.selectOption('#agb-f-rel', 'r1');
    await page.selectOption('#agb-f-epic', 'e1');
    const groups = await page.$$eval('#agb-f-wbs optgroup', (gs) => gs.map((g) => [g.label, [...g.querySelectorAll('option')].map((o) => o.textContent)]));
    ok('editor: entregables adaptativos resaltados primero', groups[0][0] === 'Enfoque adaptativo (ágil)' && groups[0][1].some((t) => /Portal de clientes · Ágil/.test(t)) && groups[1][1].some((t) => /Montaje en obra/.test(t)), groups);
    await page.selectOption('#agb-f-wbs', 'w4');
    ok('editor: aviso del enfoque del entregable', /enfoque adaptativo/.test(await page.innerText('.modal')));
    await page.selectOption('#agb-f-sprint', 's2');
    ok('editor: aviso de alcance agregado a iteración en curso', /ya inició/.test(await page.innerText('.modal')));
    await page.click('.modal-foot button:has-text("Agregar elemento")');
    await page.waitForFunction(() => !document.querySelector('.modal [data-agb-editor]'));
    await sleep(page, 200);
    const it = Object.values(await readItems(page, pid)).find((x) => x.code === 'DF-002');
    ok('editor: elemento creado con todos los campos', it && it.type === 'defecto' && it.estimate === 3 && it.priority === 'Debe tener' && it.releaseId === 'r1' && it.epicId === 'e1' && it.wbsId === 'w4' && it.sprintId === 's2' && it.sprintAddedDate === T && /festivo/.test(it.acceptance) && it.rank === 10000, it);
  });

  await step('editor: editar y cambiar estado', async () => {
    await page.click('tr[data-agb-row="i6"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('editor: título de edición', /Editar HU-005/.test(await page.innerText('.modal-title')));
    await page.fill('#agb-f-est', '8');
    await page.check('.modal .check input[type="checkbox"]');
    await page.fill('#agb-f-reason', 'Esperando plantilla del cliente');
    await page.fill('#agb-f-tags', 'cartera, correo');
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await sleep(page, 300);
    const it = (await readItems(page, pid)).i6;
    ok('editor: cambios guardados', it.estimate === 8 && it.blocked === true && it.blockedReason === 'Esperando plantilla del cliente' && JSON.stringify(it.tags) === '["cartera","correo"]' && it.code === 'HU-005', it);
    await page.click('tr[data-agb-row="i8"] [data-act="open"]');
    await page.waitForSelector('#agb-f-status');
    await page.selectOption('#agb-f-status', 'terminado');
    ok('editor: aviso de fecha de terminación', /se registra la fecha de terminación/.test(await page.innerText('.modal')));
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await sleep(page, 300);
    const d = (await readItems(page, pid)).i8;
    ok('editor: estado con historial y fecha de terminación (withStatus)', d.status === 'terminado' && d.doneDate === T && d.history[d.history.length - 1].status === 'terminado', d);
  });

  await step('reordenar con botones', async () => {
    await spy(page);
    await page.click('button[aria-label="Subir HU-002"]');
    await sleep(page, 250);
    const o = await order(page);
    ok('subir: HU-002 queda antes de HU-001', o.indexOf('HU-002') === o.indexOf('HU-001') - 1, o);
    const s = await sets(page);
    ok('subir: guarda solo el elemento movido', JSON.stringify(s) === '["i2"]', s);
    ok('subir: rango entre vecinos', (await readItems(page, pid)).i2.rank === 800);
    ok('subir: el foco sigue en el botón', (await activeLabel(page)) === 'Subir HU-002', await activeLabel(page));
    await spy(page);
    await page.click('button[aria-label="Mover HU-005 al inicio del backlog"]');
    await sleep(page, 250);
    ok('al inicio: HU-005 primero', (await order(page))[0] === 'HU-005' && JSON.stringify(await sets(page)) === '["i6"]', [await order(page), await sets(page)]);
    await spy(page);
    await page.click('button[aria-label="Mover EP-001 al final del backlog"]');
    await sleep(page, 250);
    const o2 = await order(page);
    ok('al final: EP-001 último', o2[o2.length - 1] === 'EP-001' && JSON.stringify(await sets(page)) === '["e1"]', [o2, await sets(page)]);
    ok('al final: botón deshabilitado y foco en el asa', (await page.$eval('button[aria-label="Mover EP-001 al final del backlog"]', (b) => b.disabled)) && /^Reordenar EP-001/.test(await activeLabel(page)), await activeLabel(page));
    await page.click('button[aria-label="Bajar HU-005"]');
    await sleep(page, 250);
    ok('bajar: HU-005 en segunda posición', (await order(page))[1] === 'HU-005', await order(page));
  });

  await step('reordenar con teclado', async () => {
    await spy(page);
    const before = await order(page);
    await page.focus('button[aria-label^="Reordenar HU-004"]');
    await page.keyboard.press('ArrowUp');
    await sleep(page, 250);
    const o = await order(page);
    ok('flecha arriba sube una posición', o.indexOf('HU-004') === before.indexOf('HU-004') - 1, [before, o]);
    ok('teclado: el foco sigue en el asa', /^Reordenar HU-004/.test(await activeLabel(page)));
    await page.keyboard.press('Home');
    await sleep(page, 250);
    ok('Inicio lleva al primer lugar', (await order(page))[0] === 'HU-004', await order(page));
    await page.keyboard.press('ArrowDown');
    await sleep(page, 250);
    ok('flecha abajo baja una posición', (await order(page))[1] === 'HU-004', await order(page));
    await page.keyboard.press('End');
    await sleep(page, 250);
    const o2 = await order(page);
    ok('Fin lleva al último lugar', o2[o2.length - 1] === 'HU-004', o2);
    ok('teclado: una escritura por movimiento', (await sets(page)).length === 4 && (await sets(page)).every((x) => x === 'i5'), await sets(page));
    ok('anuncio accesible de la posición', /HU-004 quedó en la posición/.test(await page.innerText('[data-agb-live]')));
  });

  await step('arrastrar y soltar', async () => {
    await spy(page);
    const g = await page.$('tr[data-agb-row="i4"] [data-act="grip"]');
    const gb = await g.boundingBox();
    const t = await (await page.$('tr[data-agb-row="i1"]')).boundingBox();
    await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
    await page.mouse.down();
    for (let k = 1; k <= 8; k++) await page.mouse.move(gb.x + gb.width / 2, gb.y + (t.y + 4 - gb.y) * (k / 8));
    ok('arrastre: indicador de destino', !!(await page.$('tr.agb-drop-before[data-agb-row="i1"]')));
    await page.mouse.up();
    await sleep(page, 300);
    const o = await order(page);
    ok('arrastre: DF-001 queda antes de HU-001', o.indexOf('DF-001') === o.indexOf('HU-001') - 1, o);
    ok('arrastre: una sola escritura', JSON.stringify(await sets(page)) === '["i4"]', await sets(page));
  });

  await step('filtros', async () => {
    const vis = () => page.$$eval('tr[data-agb-row]', (els) => els.map((e) => e.querySelector('.code-tag').textContent).sort().join(','));
    await page.selectOption('select[aria-label="Filtrar por tipo"]', 'defecto');
    ok('filtro por tipo', (await vis()) === 'DF-001,DF-002', await vis());
    await page.selectOption('select[aria-label="Filtrar por tipo"]', '');
    await page.fill('input[aria-label="Buscar en el backlog"]', 'factura');
    ok('filtro por texto (sin tildes)', (await vis()) === 'EP-002,HU-004', await vis());
    await page.fill('input[aria-label="Buscar en el backlog"]', '');
    await page.selectOption('select[aria-label="Filtrar por release"]', 'r2');
    ok('filtro por release', (await vis()) === 'HU-004,HU-005', await vis());
    await page.selectOption('select[aria-label="Filtrar por release"]', '');
    await page.selectOption('select[aria-label="Filtrar por épica"]', 'e2');
    ok('filtro por épica (incluye la épica)', (await vis()) === 'EP-002,HU-004,HU-005', await vis());
    await page.selectOption('select[aria-label="Filtrar por épica"]', '__none');
    ok('filtro sin épica', (await vis()) === 'DF-001,HU-006,IN-001,TA-001', await vis());
    await page.selectOption('select[aria-label="Filtrar por épica"]', '');
    await page.selectOption('select[aria-label="Filtrar por estado"]', 'en-curso');
    ok('filtro por estado (columna)', (await vis()) === 'HU-002,HU-003', await vis());
    await page.selectOption('select[aria-label="Filtrar por estado"]', 'backlog');
    ok('filtro por estado (backlog del producto)', (await vis()) === 'DF-002,EP-001,EP-002,HU-004,HU-005,HU-006', await vis());
    await page.selectOption('select[aria-label="Filtrar por estado"]', '');
    await page.selectOption('select[aria-label="Filtrar por entregable de la EDT"]', 'w4');
    ok('filtro por entregable EDT', (await vis()) === 'DF-002,HU-001,HU-002', await vis());
    await page.selectOption('select[aria-label="Filtrar por entregable de la EDT"]', '');
    await page.click('button:has-text("Refinamiento")');
    ok('modo refinamiento: pendientes sin estimar o sin criterios (excluye terminados)', (await vis()) === 'DF-001,HU-004,HU-005,HU-006', await vis());
    ok('refinamiento: distintivos con texto', /Sin estimar/.test(await page.innerText('tr[data-agb-row="i5"]')) && /Sin criterios de aceptación/.test(await page.innerText('tr[data-agb-row="i5"]')));
    await page.fill('input[aria-label="Estimación de HU-004 (pts)"]', '5');
    await page.keyboard.press('Enter');
    await sleep(page, 300);
    ok('refinamiento: estimación en la tabla', (await readItems(page, pid)).i5.estimate === 5);
    await page.click('button:has-text("Limpiar filtros")');
    ok('limpiar filtros', (await page.$$('tr[data-agb-row]')).length === 12);
  });

  await step('agrupar por épica', async () => {
    await page.check('label.check:has-text("Agrupar por épica") input');
    const heads = await page.$$eval('tr.agb-group', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')));
    ok('grupos por épica (orden del backlog) con avance', heads.length === 3 && /^EP-002 .*0 de 2 terminados/.test(heads[0]) && /^EP-001 .*1 de 4 terminados · 5 \/ 19 pts/.test(heads[1]) && /Sin épica/.test(heads[2]), heads);
    ok('épicas como encabezados (no como filas)', !(await page.$('tr[data-agb-row="e1"]')));
    await spy(page);
    const before = await page.$$eval('tbody', (bs) => bs.map((b) => [...b.querySelectorAll('tr[data-agb-row] .code-tag')].map((x) => x.textContent)));
    const g0 = before.find((l) => l.includes('HU-002'));
    await page.click('button[aria-label="Bajar ' + g0[0] + '"]');
    await sleep(page, 250);
    const after = await page.$$eval('tbody', (bs) => bs.map((b) => [...b.querySelectorAll('tr[data-agb-row] .code-tag')].map((x) => x.textContent)));
    const g1 = after.find((l) => l.includes(g0[0]));
    ok('agrupado: bajar dentro del grupo', g1[1] === g0[0] && g1[0] === g0[1], [g0, g1]);
    await page.uncheck('label.check:has-text("Agrupar por épica") input');
  });

  await step('selección múltiple', async () => {
    await page.check('input[aria-label="Seleccionar HU-004"]');
    await page.check('input[aria-label="Seleccionar HU-005"]');
    ok('barra de acciones con conteo', /2 seleccionados/.test(await page.innerText('.agb-bulk')));
    await page.selectOption('select[aria-label="Asignar release a la selección"]', 'r1');
    await page.selectOption('select[aria-label="Asignar iteración a la selección"]', 's2');
    await page.selectOption('select[aria-label="Asignar prioridad a la selección"]', 'No en este release');
    await sleep(page, 300);
    const it = await readItems(page, pid);
    ok('asignar release, iteración y prioridad', ['i5', 'i6'].every((k) => it[k].releaseId === 'r1' && it[k].sprintId === 's2' && it[k].sprintAddedDate === T && it[k].priority === 'No en este release'), [it.i5, it.i6]);
    await page.click('.agb-bulk button:has-text("Quitar selección")');
    ok('quitar selección', !(await page.$('.agb-bulk')));
    await page.selectOption('select[aria-label="Filtrar por tipo"]', 'epica');
    await page.check('input[aria-label="Seleccionar todos los elementos visibles"]');
    ok('seleccionar todos los visibles', /2 seleccionados/.test(await page.innerText('.agb-bulk')));
    await page.uncheck('input[aria-label="Seleccionar EP-001"]');
    await page.selectOption('select[aria-label="Filtrar por tipo"]', '');
    await page.check('input[aria-label="Seleccionar HU-006"]');
    await page.click('.agb-bulk button:has-text("Eliminar")');
    await page.waitForSelector('.modal:has-text("Eliminar 2 elementos")');
    ok('eliminar: confirmación con efecto sobre los hijos', /2 elementos quedan sin épica/.test(await page.innerText('.modal')), await page.innerText('.modal'));
    await page.click('.modal-foot button:has-text("Cancelar")');
    ok('eliminar: cancelar no borra', Object.keys(await readItems(page, pid)).length === 12);
    await page.click('.agb-bulk button:has-text("Eliminar")');
    await page.click('.modal-foot button:has-text("Eliminar 2 elementos")');
    await sleep(page, 350);
    const it2 = await readItems(page, pid);
    ok('eliminar: elementos borrados y referencias limpias', !it2.e2 && !Object.values(it2).some((x) => x.code === 'HU-006') && it2.i5.epicId === null && it2.i6.epicId === null && Object.keys(it2).length === 10, Object.keys(it2));
    ok('eliminar: la tabla se actualiza', (await page.$$('tr[data-agb-row]')).length === 10);
  });

  await step('exportar CSV', async () => {
    await page.evaluate(() => { window.__dl = null; PM.download = async (name, data) => { window.__dl = { name, data }; return true; }; });
    await page.click('.page-actions button:has-text("Exportar CSV")');
    const dl = await page.evaluate(() => window.__dl);
    ok('CSV: nombre y encabezados', dl && /^backlog-pry-test-001\.csv$/.test(dl.name) && /Posición;Código;Tipo;Título;Descripción;Criterios de aceptación;Estimación \(pts\)/.test(dl.data), dl && [dl.name, dl.data.slice(0, 160)]);
    ok('CSV: filas en orden con estado y release', dl && dl.data.split('\r\n').length === 11 && /HU-002;Historia de usuario;Como comercial quiero consultar disponibilidad;;x;3;Debe tener;7;En curso;Release 1 · Inventario;Iteración 2/.test(dl.data), dl && dl.data.split('\r\n').slice(0, 4));
  });

  await step('configuración ágil', async () => {
    await page.click('.page-actions button:has-text("Configuración ágil")');
    await page.waitForSelector('[data-agb-settings]');
    await page.selectOption('#agb-s-unit', 'horas');
    ok('configuración: advierte que no convierte estimaciones', /no convierte las estimaciones/.test(await page.innerText('.modal')));
    await page.fill('#agb-s-len', '');
    await page.click('.modal-foot button:has-text("Guardar configuración")');
    ok('configuración: valida la duración', /1 a 60 días hábiles/.test(await page.innerText('.modal')));
    await page.fill('#agb-s-len', '15');
    await page.fill('#agb-s-thr', '12');
    await page.click('.modal-foot button:has-text("Guardar configuración")');
    await sleep(page, 400);
    const ag = await readAgile(page, pid);
    ok('configuración guardada sin perder columnas, releases ni iteraciones', ag.settings.estimationUnit === 'horas' && ag.settings.sprintLength === 15 && ag.settings.scopeChangeThreshold === 12 && ag.settings.columns.length === 4 && ag.releases.length === 2 && ag.sprints.length === 2, ag.settings);
    ok('unidad aplicada en los indicadores', / h /.test(' ' + (await tileText(page, 'total')) + ' '), await tileText(page, 'total'));
    ok('umbral aplicado en la nota', /más del 12 %/.test(await page.innerText('.agb-page')));
  });

  /* ---------------------------------------------------------------- tablero Kanban */
  await gotoView(page, 'kanban');
  await page.waitForSelector('[data-agk-col]');
  const count = (c) => page.$eval('[data-agk-count="' + c + '"]', (e) => e.textContent.trim());
  const colOf = (id) => page.evaluate((id) => { const c = document.querySelector('[data-agk-card="' + id + '"]'); return c ? c.closest('[data-agk-col]').dataset.agkCol : null; }, id);

  await step('tablero: filtro y columnas', async () => {
    ok('filtro por defecto: iteración en curso (Scrum con Kanban)', (await page.inputValue('#agk-f-sprint')) === 's2');
    ok('columnas en orden', JSON.stringify(await page.$$eval('[data-agk-col]', (e) => e.map((x) => x.dataset.agkCol))) === '["por-hacer","en-curso","en-revision","terminado"]');
    ok('conteo n / WIP', (await count('en-curso')) === '2 / 2' && (await count('por-hacer')) === '1' && (await count('en-revision')) === '1 / 2', [await count('por-hacer'), await count('en-curso'), await count('en-revision')]);
    ok('columna llena: aviso textual', /Límite WIP alcanzado/.test(await page.innerText('[data-agk-col="en-curso"]')));
    const card = await page.innerText('[data-agk-card="i3"]');
    ok('tarjeta: código, título, tipo, estimación, responsable, bloqueado y días', /HU-003/.test(card) && /Reservar equipos/.test(card) && /Historia/.test(card) && /8 h/.test(card) && /Desarrollador/.test(card) && /Bloqueado: Falta API del ERP/.test(card) && /6 días en la columna/.test(card), card);
    ok('información de la iteración', /Iteración 2/.test(await page.innerText('[data-agk-sprint]')) && /Quedan \d+ días? hábil/.test(await page.innerText('[data-agk-sprint]')));
  });

  await step('tablero: WIP y botones', async () => {
    await page.click('button[aria-label="Mover TA-001 a «En curso»"]');
    await page.waitForSelector('.modal:has-text("Límite WIP de «En curso»")');
    ok('columna llena pide confirmación (política WIP)', /2 de 2 elementos/.test(await page.innerText('.modal')));
    await page.click('.modal-foot button:has-text("Cancelar")');
    await sleep(page, 200);
    ok('cancelar no mueve', (await readItems(page, pid)).i7.status === 'por-hacer');
    await page.click('button[aria-label="Mover TA-001 a «En curso»"]');
    await page.click('.modal-foot button:has-text("Mover de todas formas")');
    await sleep(page, 300);
    const i7 = (await readItems(page, pid)).i7;
    ok('mover con confirmación: estado e historial', i7.status === 'en-curso' && i7.history[i7.history.length - 1].status === 'en-curso' && i7.history[i7.history.length - 1].date === T, i7);
    ok('WIP superado: conteo, estilo y texto', (await count('en-curso')) === '3 / 2' && (await page.$eval('[data-agk-col="en-curso"]', (e) => e.classList.contains('is-over'))) && /Límite WIP superado/.test(await page.innerText('[data-agk-col="en-curso"]')));
    ok('el foco sigue a la tarjeta movida', await page.evaluate(() => { const a = document.activeElement; return !!a && a.closest('[data-agk-card]') && a.closest('[data-agk-card]').dataset.agkCard === 'i7' && a.closest('[data-agk-col]').dataset.agkCol === 'en-curso'; }));
  });

  await step('tablero: teclado', async () => {
    await page.focus('[data-agk-card="i4"] .agk-card-title');
    await page.keyboard.press('ArrowRight');
    await sleep(page, 300);
    let i4 = (await readItems(page, pid)).i4;
    ok('flecha derecha: a «Terminado» registra doneDate', i4.status === 'terminado' && i4.doneDate === T && (await colOf('i4')) === 'terminado', i4);
    ok('teclado: el foco sigue en la tarjeta', await page.evaluate(() => document.activeElement && document.activeElement.closest('[data-agk-card="i4"]') && document.activeElement.classList.contains('agk-card-title')));
    await page.keyboard.press('ArrowLeft');
    await sleep(page, 300);
    i4 = (await readItems(page, pid)).i4;
    ok('flecha izquierda: reabre y borra doneDate', i4.status === 'en-revision' && i4.doneDate === null, i4);
    await page.keyboard.press('ArrowRight');
    await sleep(page, 300);
    ok('vuelve a terminado', (await readItems(page, pid)).i4.status === 'terminado');
    await page.focus('[data-agk-col="en-curso"] .agk-card-title');
    const first = await activeLabel(page);
    await page.keyboard.press('ArrowDown');
    ok('flecha abajo recorre la columna', (await activeLabel(page)) !== first && /^(HU|TA)-/.test(await activeLabel(page)), [first, await activeLabel(page)]);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('Enter abre el editor del backlog', /Editar (HU|TA)-/.test(await page.innerText('.modal-title')));
    await page.keyboard.press('Escape');
    await sleep(page, 150);
    ok('Escape cierra el editor', !(await modalOpen(page)));
  });

  await step('tablero: «Mover a…» y clic', async () => {
    await page.click('button[aria-label="Mover HU-002 a otra columna"]');
    await page.click('.menu [role="menuitem"]:has-text("Por hacer")');
    await sleep(page, 300);
    ok('«Mover a…» mueve a la columna elegida', (await readItems(page, pid)).i2.status === 'por-hacer' && (await colOf('i2')) === 'por-hacer');
    const box = await (await page.$('[data-agk-card="i3"] .agk-card-meta')).boundingBox();
    await page.mouse.click(box.x + 4, box.y + box.height / 2);
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('clic en la tarjeta abre el editor', /Editar HU-003/.test(await page.innerText('.modal-title')));
    await page.keyboard.press('Escape');
    await sleep(page, 150);
  });

  await step('tablero: arrastrar entre columnas', async () => {
    const c = await (await page.$('[data-agk-card="i7"] .agk-card-meta')).boundingBox();
    const t = await (await page.$('[data-agk-col="en-revision"] .agk-list')).boundingBox();
    await page.mouse.move(c.x + 10, c.y + 5);
    await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(c.x + 10 + (t.x + 30 - c.x - 10) * (k / 10), c.y + 5 + (t.y + 20 - c.y - 5) * (k / 10));
    ok('arrastre: columna destino resaltada y tarjeta flotante', (await page.$eval('[data-agk-col="en-revision"]', (e) => e.classList.contains('is-drop'))) && !!(await page.$('.agk-ghost')));
    await page.mouse.up();
    await sleep(page, 350);
    ok('arrastre: la tarjeta cambia de columna', (await readItems(page, pid)).i7.status === 'en-revision' && (await colOf('i7')) === 'en-revision' && !(await page.$('.agk-ghost')) && !(await modalOpen(page)));
  });

  await step('tablero: métricas de flujo', async () => {
    const cyc = await tileText(page, 'cycle'), lead = await tileText(page, 'lead'), thr = await tileText(page, 'thr'), bl = await tileText(page, 'blocked');
    ok('tiempo de ciclo (primer «en curso» → terminado, contando ambos días; PM.agile.flowTimes)', /3 días/.test(cyc), cyc);
    ok('tiempo de entrega (creación → terminado, contando ambos días)', /11 días/.test(lead), lead);
    ok('rendimiento de 4 semanas', /1 elemento/.test(thr) && /2 h/.test(thr), thr);
    ok('elementos bloqueados', /bloqueados 1/.test(bl), bl);
    await page.selectOption('#agk-f-sprint', '');
    await sleep(page, 200);
    ok('«Todo el flujo» incluye otras iteraciones', (await colOf('i1')) === 'terminado' && /3,3 días/.test(await tileText(page, 'cycle')), await tileText(page, 'cycle'));
    await page.selectOption('#agk-f-who', 'Analista');
    await sleep(page, 150);
    const cards = await page.$$eval('[data-agk-card]', (e) => e.map((x) => x.dataset.agkCard).sort().join(','));
    ok('filtro por responsable', cards === 'i2,i4', cards);
    ok('aviso del conteo con filtro de responsable', /también las que el filtro oculta/.test(await page.innerText('.agk-page')));
    await page.selectOption('#agk-f-who', '');
    await page.selectOption('#agk-f-rel', 'r2');
    ok('filtro por release', (await page.$$('[data-agk-card]')).length === 0);
    await page.selectOption('#agk-f-rel', '');
    await page.selectOption('#agk-f-sprint', 's2');
  });

  await step('traer del backlog', async () => {
    await page.click('.page-actions button:has-text("Traer del backlog")');
    await page.waitForSelector('.modal .agb-pick');
    const list = await page.$$eval('.modal .agb-pick-item', (e) => e.map((x) => x.querySelector('.code-tag').textContent));
    ok('lista los elementos en backlog de la iteración', JSON.stringify(list.sort()) === '["DF-002","HU-004","HU-005"]', list);
    await page.check('.modal .agb-pick-item:has-text("HU-004") input');
    await page.click('.modal-foot button:has-text("Pasar 1 a «Por hacer»")');
    await sleep(page, 300);
    const i5 = (await readItems(page, pid)).i5;
    ok('pasa a la primera columna con historial', i5.status === 'por-hacer' && i5.history[i5.history.length - 1].status === 'por-hacer' && (await colOf('i5')) === 'por-hacer', i5);
  });

  await step('editor de columnas', async () => {
    await page.click('.page-actions button:has-text("Editar columnas")');
    await page.waitForSelector('[data-agk-columns]');
    await page.fill('#agk-cn-en-revision', 'Revisión técnica');
    await page.fill('#agk-cw-por-hacer', '5');
    await page.click('.modal button:has-text("Agregar columna")');
    await sleep(page, 100);
    await page.keyboard.type('Pruebas');
    await page.click('button[aria-label="Subir la columna «Pruebas»"]');
    await page.click('button[aria-label="Eliminar la columna «Terminado»"]');
    ok('validación: debe quedar una columna «Terminado»', /al menos una columna en la categoría «Terminado»/.test(await page.innerText('.modal')) && (await page.$eval('.modal-foot button:has-text("Guardar columnas")', (b) => b.disabled)));
    await page.click('.modal [data-agk-removed] button:has-text("Restaurar columna")');
    ok('restaurar columna', !(await page.$('.modal [data-agk-removed]')) && !(await page.$eval('.modal-foot button:has-text("Guardar columnas")', (b) => b.disabled)));
    await page.click('button[aria-label="Eliminar la columna «En curso»"]');
    const note = await page.innerText('.modal [data-agk-removed]');
    ok('eliminar con elementos pide reasignar', /«En curso» tiene 1 elemento\./.test(note), note);
    await page.selectOption('.modal [data-agk-removed] select', { label: 'Pruebas' });
    await page.click('.modal-foot button:has-text("Guardar columnas")');
    await sleep(page, 400);
    const ag = await readAgile(page, pid);
    const cols = ag.settings.columns;
    const pr = cols.find((c) => c.name === 'Pruebas');
    ok('columnas guardadas (nombre, orden, WIP, categoría)', JSON.stringify(cols.map((c) => c.name)) === '["Por hacer","Revisión técnica","Pruebas","Terminado"]' && cols[0].wip === 5 && pr && pr.category === 'en-curso' && ag.settings.estimationUnit === 'horas', cols);
    const it = await readItems(page, pid);
    ok('elementos reasignados a la columna elegida', pr && it.i3.status === pr.id && it.i3.history[it.i3.history.length - 1].status === pr.id && !Object.values(it).some((x) => x.status === 'en-curso'), [it.i3.status]);
    ok('el tablero muestra las nuevas columnas', JSON.stringify(await page.$$eval('.agk-col-name', (e) => e.map((x) => x.textContent))) === '["Por hacer","Revisión técnica","Pruebas","Terminado"]');
  });

  if (shots) await page.screenshot({ path: join(shots, 'kanban-1360.png'), fullPage: true });
  ok('sesión de escritorio: sin errores de consola ni tarjetas de error', !errors.length && !(await errorCards(page)).length, errors);

  /* ---------------------------------------------------------------- solo lectura y proyecto predictivo */
  await step('solo lectura', async () => {
    await page.evaluate(() => PM.setState({ canWrite: false }));
    await gotoView(page, 'backlog');
    await page.waitForSelector('tr[data-agb-row]');
    ok('backlog solo lectura: sin edición', !(await page.$('.page-actions button:has-text("Nuevo elemento")')) && !(await page.$('input.agb-check')) && !(await page.$('[data-act="grip"]')) && !(await page.$('.agb-quick')) && /Modo de solo lectura/.test(await page.innerText('.agb-page')));
    await page.click('tr[data-agb-row="i1"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('editor en solo lectura', /Detalle de HU-001/.test(await page.innerText('.modal-title')) && (await page.$eval('#agb-f-title', (e) => e.disabled)) && !(await page.$('.modal-foot button:has-text("Guardar cambios")')) && !(await page.$('.modal-foot button:has-text("Eliminar")')));
    await page.keyboard.press('Escape');
    await page.click('.page-actions button:has-text("Configuración ágil")');
    await page.waitForSelector('[data-agb-settings]');
    ok('configuración en solo lectura', (await page.$eval('#agb-s-unit', (e) => e.disabled)) && !(await page.$('.modal-foot button:has-text("Guardar configuración")')));
    await page.keyboard.press('Escape');
    await gotoView(page, 'kanban');
    await page.waitForSelector('[data-agk-card]');
    ok('tablero solo lectura: sin mover ni editar columnas', !(await page.$('.agk-card-actions')) && !(await page.$('.page-actions button:has-text("Traer del backlog")')) && !(await page.$('.page-actions button:has-text("Editar columnas")')));
    await page.focus('[data-agk-card] .agk-card-title');
    const before = JSON.stringify(await readItems(page, pid));
    await page.keyboard.press('ArrowRight');
    await sleep(page, 250);
    ok('solo lectura: el teclado no mueve tarjetas', JSON.stringify(await readItems(page, pid)) === before);
    await page.evaluate(() => PM.setState({ canWrite: true }));
  });
  await step('proyecto predictivo', async () => {
    await createProject(page, { lifecycle: 'Predictivo', code: 'PRY-TEST-002', name: 'Proyecto predictivo' });
    await sleep(page, 400);
    ok('predictivo: vistas ágiles fuera del menú', !(await page.$('.nav-item:has-text("Backlog del producto")')));
    for (const v of ['backlog', 'kanban']) {
      await gotoView(page, v);
      ok('predictivo: aviso en ' + v, /Herramientas ágiles no activas/.test(await page.innerText('.view-host')) && !!(await page.$('button:has-text("Usar ciclo de vida híbrido")')));
    }
  });
  ok('sin errores al final de la sesión 1', !errors.length, errors);
  await browser.close();
}

/* ================================================================= sesión 1b: regresiones de la revisión */
/* datos importados con tipos inesperados, referencias huérfanas, épica que cambia de tipo, WIP con filtros, límite WIP
   inválido, historial de columnas eliminadas, restaurar columna, editor externo y fecha de corte */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  const pid = await createProject(page, { lifecycle: 'Híbrido' });
  await page.evaluate(async (pid) => {
    const today = PM.date.today(), add = (n) => PM.date.add(today, n);
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [{ id: 'w1', parentId: null, name: 'Plataforma', order: 1, approach: 'adaptativo' }] });
    await PM.store.set(PM.paths.tool(pid, 'agile'), { settings: { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, columns: [
      { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null }, { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 2 },
      { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 }, { id: 'terminado', name: 'Terminado', category: 'terminado', wip: -1 }], scopeChangeThreshold: 10 },
      releases: [{ id: 'r1', name: 'R1', status: 'en-curso' }, { id: 'r2', name: 'R2', status: 'planeado' }],
      sprints: [{ id: 's2', name: 'Iteración 2', releaseId: 'r1', start: add(-5), end: add(5), status: 'en-curso' }] });
    const items = [
      { id: 'e1', code: 'EP-001', type: 'epica', title: 'Épica uno', rank: 500, status: 'backlog' },
      { id: 'c1', code: 'HU-001', type: 'historia', title: 'Hija 1', rank: 1000, status: 'backlog', epicId: 'e1', estimate: 3, acceptance: 'x' },
      { id: 'c2', code: 'HU-002', type: 'historia', title: 'Hija 2', rank: 2000, status: 'backlog', epicId: 'e1', estimate: 3, acceptance: 'x' },
      { id: 'x1', code: 'HU-003', type: 'historia', title: 12345, description: 5, acceptance: 99, assignee: 42, blocked: true, blockedReason: 7, tags: 'obra, piloto', requirementId: 12, rank: 3000, status: 'backlog' },
      { id: 'o1', code: 'HU-004', type: 'historia', title: 'Con referencias huérfanas', releaseId: 'nada', sprintId: 'nada', epicId: 'nada', wbsId: 'nada', rank: 4000, status: 'backlog' },
      { id: 'k1', code: 'TA-001', type: 'tarea', title: 'En curso R1 sin iteración', rank: 5000, status: 'en-curso', releaseId: 'r1', createdAt: add(-4), history: [{ date: add(-3), status: 'en-curso' }] },
      { id: 'k2', code: 'TA-002', type: 'tarea', title: 'En curso R2', rank: 6000, status: 'en-curso', releaseId: 'r2', createdAt: add(-4), history: [{ date: add(-3), status: 'en-curso' }] },
      { id: 'k3', code: 'TA-003', type: 'tarea', title: 'Por hacer de la iteración', rank: 7000, status: 'por-hacer', releaseId: 'r1', sprintId: 's2', createdAt: add(-4), history: [{ date: add(-3), status: 'por-hacer' }] },
      { id: 'd1', code: 'HU-005', type: 'historia', title: 'Pasó por revisión', rank: 8000, status: 'terminado', createdAt: add(-10), doneDate: add(-1), history: [{ date: add(-10), status: 'backlog' }, { date: add(-6), status: 'en-revision' }, { date: add(-1), status: 'terminado' }] },
      { id: 'd3', code: 'HU-007', type: 'historia', title: 'Terminada antes del corte', rank: 9000, status: 'terminado', createdAt: add(-12), doneDate: add(-5), history: [{ date: add(-12), status: 'backlog' }, { date: add(-8), status: 'en-curso' }, { date: add(-5), status: 'terminado' }] },
    ];
    for (const it of items) { const { id, ...b } = it; await PM.store.set(PM.paths.backlogItem(pid, id), b); }
  }, pid);
  await sleep(page, 300);
  const yesterday = await page.evaluate(() => PM.date.add(PM.date.today(), -1));
  await gotoView(page, 'backlog');
  await page.waitForSelector('tr[data-agb-row]');

  await step('regresión: conteos coherentes', async () => {
    ok('regresión: indicador sin épicas y barra con épicas aclaradas', /Elementos \(sin épicas\) 9/.test(await tileText(page, 'items')) && (await page.$eval('[data-agb-count]', (e) => e.textContent.trim())) === '10 elementos (incluye 1 épica)', [await tileText(page, 'items'), await page.$eval('[data-agb-count]', (e) => e.textContent)]);
  });

  await step('regresión: seleccionar todos con agrupación por épica', async () => {
    await page.check('label.check:has-text("Agrupar por épica") input');
    const rows = await page.$$eval('tr[data-agb-row]', (els) => els.map((e) => e.dataset.agbRow));
    await page.check('input[aria-label="Seleccionar todos los elementos visibles"]');
    const txt = await page.$eval('[data-agb-selcount]', (e) => e.textContent.trim());
    ok('agrupado: «Seleccionar todos» solo marca las filas dibujadas (sin épicas)', !rows.includes('e1') && txt === rows.length + ' seleccionados', [rows, txt]);
    await page.click('.agb-bulk button:has-text("Eliminar")');
    await page.waitForSelector('.modal:has-text("Se eliminarán del backlog")');
    const body = await page.innerText('.modal');
    ok('agrupado: eliminar no alcanza la épica oculta', !/EP-001/.test(body) && /Eliminar 9 elementos/.test(body), body);
    await page.click('.modal-foot button:has-text("Cancelar")');
    await page.click('.agb-bulk button:has-text("Quitar selección")');
    await page.uncheck('label.check:has-text("Agrupar por épica") input');
    await page.check('input[aria-label="Seleccionar EP-001"]');
    await page.check('label.check:has-text("Agrupar por épica") input');
    const txt2 = await page.$eval('[data-agb-selcount]', (e) => e.textContent.trim());
    ok('selección oculta por la agrupación se indica', txt2 === '1 seleccionado (1 oculto por los filtros o la agrupación)', txt2);
    ok('casilla general sin marcar si lo seleccionado no está a la vista', !(await page.$eval('input[aria-label="Seleccionar todos los elementos visibles"]', (e) => e.checked || e.indeterminate)));
    await page.click('.agb-bulk button:has-text("Quitar selección")');
    await page.uncheck('label.check:has-text("Agrupar por épica") input');
  });

  await step('regresión: editor con datos importados (textos numéricos y etiquetas en texto)', async () => {
    await page.click('tr[data-agb-row="x1"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    const vals = await page.evaluate(() => ['agb-f-title', 'agb-f-who', 'agb-f-tags', 'agb-f-reason', 'agb-f-req', 'agb-f-acc'].map((id) => document.getElementById(id).value));
    ok('editor: muestra los valores convertidos a texto (incluidas las etiquetas en texto)', JSON.stringify(vals) === JSON.stringify(['12345', '42', 'obra, piloto', '7', '12', '99']), vals);
    const e0 = errors.length;
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await sleep(page, 350);
    const x1 = (await readItems(page, pid)).x1;
    ok('editor: guarda sin errores y normaliza los textos', !(await modalOpen(page)) && errors.length === e0 && x1.title === '12345' && x1.assignee === '42' && x1.blockedReason === '7' && x1.requirementId === '12' && x1.acceptance === '99' && JSON.stringify(x1.tags) === '["obra","piloto"]', [errors.slice(e0), x1]);
  });

  await step('regresión: referencias huérfanas visibles y removibles', async () => {
    await page.click('tr[data-agb-row="o1"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    const shown = await page.evaluate(() => ['agb-f-rel', 'agb-f-sprint', 'agb-f-epic', 'agb-f-wbs'].map((id) => { const el = document.getElementById(id); return [el.value, el.selectedOptions[0] ? el.selectedOptions[0].textContent : '']; }));
    ok('editor: las referencias inexistentes se muestran como «no encontrado»', shown.every(([v, t]) => v === 'nada' && /no encontrad/.test(t)), shown);
    const m = await page.innerText('.modal');
    ok('editor: avisos de referencias que ya no existen', /El release asignado ya no existe/.test(m) && /La iteración asignada ya no existe/.test(m) && /La épica asignada ya no existe/.test(m) && /El entregable asignado ya no existe/.test(m) && !/enfoque predictivo: su avance/.test(m), m.slice(0, 200));
    for (const id of ['#agb-f-rel', '#agb-f-sprint', '#agb-f-epic', '#agb-f-wbs']) await page.selectOption(id, '');
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await sleep(page, 350);
    const o1 = (await readItems(page, pid)).o1;
    ok('editor: elegir «Sin …» limpia las referencias huérfanas', o1.releaseId === null && o1.sprintId === null && o1.epicId === null && o1.wbsId === null, o1);
  });

  await step('regresión: épica que cambia de tipo', async () => {
    await page.click('tr[data-agb-row="e1"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    await page.selectOption('#agb-f-type', 'historia');
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await page.waitForSelector('.modal:has-text("dejará de ser una épica")');
    const body = await page.innerText('.modal:has-text("dejará de ser una épica")');
    ok('cambiar el tipo de una épica pide confirmación y nombra a sus hijos', /HU-001, HU-002/.test(body) && /quedarán sin épica/.test(body), body);
    await page.click('.modal:has-text("dejará de ser una épica") .modal-foot button:has-text("Cancelar")');
    await sleep(page, 200);
    let it = await readItems(page, pid);
    ok('cancelar: no cambia nada y el editor sigue abierto', it.e1.type === 'epica' && it.c1.epicId === 'e1' && !!(await page.$('.modal [data-agb-editor]')));
    await page.click('.modal-foot button:has-text("Guardar cambios")');
    await page.click('.modal-foot button:has-text("Cambiar a Historia de usuario")');
    await sleep(page, 400);
    it = await readItems(page, pid);
    ok('confirmar: cambia el tipo y los hijos quedan sin épica', it.e1.type === 'historia' && it.c1.epicId === null && it.c2.epicId === null && !(await modalOpen(page)), [it.e1.type, it.c1.epicId, it.c2.epicId]);
  });

  await step('regresión: editor externo (PM.agileItemDialog) con un modelo sin saveItem', async () => {
    await page.evaluate(() => PM.agileItemDialog({ agileItems: [], agile: PM.EMPTY.agile }, null, {}));
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('editor externo: código consecutivo con todos los elementos del proyecto', (await page.inputValue('#agb-f-code')) === 'HU-008', await page.inputValue('#agb-f-code'));
    await page.fill('#agb-f-title', 'Creado desde otra vista');
    await page.click('.modal-foot button:has-text("Agregar elemento")');
    await sleep(page, 400);
    const found = Object.values(await readItems(page, pid)).filter((x) => x.title === 'Creado desde otra vista');
    ok('editor externo: el elemento se guarda en el almacén', found.length === 1 && found[0].code === 'HU-008' && found[0].status === 'backlog', found);
    await page.evaluate(() => PM.agileItemDialog({}, { id: 'c1' }));
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('editor externo: abre un elemento existente', /Editar HU-001/.test(await page.innerText('.modal-title')));
    await page.keyboard.press('Escape');
    await sleep(page, 150);
  });

  await gotoView(page, 'kanban');
  await page.waitForSelector('[data-agk-col]');
  const count = (c) => page.$eval('[data-agk-count="' + c + '"]', (e) => e.textContent.trim());
  await step('regresión: WIP de todo el tablero con filtros', async () => {
    ok('filtro por defecto: iteración en curso', (await page.inputValue('#agk-f-sprint')) === 's2');
    const vis = await page.$eval('[data-agk-col="en-curso"] .agk-col-head', (e) => e.innerText.replace(/\s+/g, ' '));
    ok('el conteo WIP incluye las tarjetas sin iteración (2 / 2) y muestra las visibles aparte', (await count('en-curso')) === '2 / 2' && /0 visibles con el filtro/.test(vis) && /Límite WIP alcanzado/.test(vis), vis);
    ok('aviso: el WIP incluye lo que el filtro oculta', !!(await page.$('[data-agk-wipnote]')));
    await page.focus('[data-agk-card="k3"] .agk-card-title');
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector('.modal:has-text("Límite WIP de «En curso»")');
    ok('mover a una columna llena (por tarjetas ocultas) pide confirmación', /2 de 2 elementos en todo el tablero/.test(await page.innerText('.modal')));
    await page.click('.modal:has-text("Límite WIP de «En curso»") .modal-foot button:has-text("Cancelar")');
    await sleep(page, 200);
    ok('cancelar: la tarjeta no se mueve', (await readItems(page, pid)).k3.status === 'por-hacer');
    await page.selectOption('#agk-f-sprint', '');
    await page.selectOption('#agk-f-rel', 'r1');
    await sleep(page, 200);
    const h = await page.$eval('[data-agk-col="en-curso"] .agk-col-head', (e) => e.innerText.replace(/\s+/g, ' '));
    ok('filtro de release: el conteo WIP no cambia (2 / 2, 1 visible)', (await count('en-curso')) === '2 / 2' && /1 visible con el filtro/.test(h), h);
    await page.click('button[aria-label="Mover TA-003 a «En curso»"]');
    await page.waitForSelector('.modal:has-text("Límite WIP de «En curso»")');
    await page.click('.modal-foot button:has-text("Mover de todas formas")');
    await sleep(page, 300);
    ok('con el filtro de release, el límite superado se ve (3 / 2)', (await count('en-curso')) === '3 / 2' && !!(await page.$('[data-agk-wip="en-curso"]')));
    await page.selectOption('#agk-f-rel', '');
    await sleep(page, 150);
  });

  await step('regresión: límite WIP inválido de datos importados', async () => {
    const head = await page.$eval('[data-agk-col="terminado"] .agk-col-head', (e) => e.innerText.replace(/\s+/g, ' '));
    ok('WIP -1 se trata como «sin límite»', (await count('terminado')) === '2' && /sin límite WIP/.test(head) && !(await page.$('[data-agk-wip="terminado"]')), head);
  });

  await step('regresión: eliminar columna conserva el historial', async () => {
    await page.selectOption('#agk-f-sprint', '');
    await page.selectOption('#agk-f-rel', '');
    await sleep(page, 150);
    ok('tiempo de ciclo antes: 5 días (6 y 4)', /5 días/.test(await tileText(page, 'cycle')), await tileText(page, 'cycle'));
    await page.click('.page-actions button:has-text("Editar columnas")');
    await page.waitForSelector('[data-agk-columns]');
    await page.click('button[aria-label="Eliminar la columna «En revisión»"]');
    const note = await page.innerText('[data-agk-removed-col="en-revision"]');
    ok('aviso: la columna sin elementos tiene historial que pasa a una de la misma categoría', /no tiene elementos actualmente/.test(note) && /pasos de 1 elemento por «En revisión» quedan registrados en «En curso», de la misma categoría/.test(note), note);
    await page.click('button[aria-label="Eliminar la columna «Por hacer»"]');
    ok('al eliminar «Por hacer» falta una columna pendiente', /al menos una columna en la categoría «Pendiente»/.test(await page.innerText('.modal')));
    await page.click('button[aria-label="Restaurar la columna «Por hacer»"]');
    const order1 = await page.$$eval('.agk-colrow', (e) => e.map((x) => x.dataset.col));
    ok('restaurar devuelve la columna a su posición original', JSON.stringify(order1) === '["por-hacer","en-curso","terminado"]', order1);
    await page.click('.modal-foot button:has-text("Guardar columnas")');
    await sleep(page, 450);
    const ag = await readAgile(page, pid);
    const it = await readItems(page, pid);
    ok('columnas guardadas (WIP inválido normalizado)', JSON.stringify(ag.settings.columns.map((c) => [c.id, c.wip])) === '[["por-hacer",null],["en-curso",2],["terminado",null]]', ag.settings.columns);
    ok('historial reescrito a la columna de la misma categoría', !Object.values(it).some((x) => (x.history || []).some((e) => e && e.status === 'en-revision')) && it.d1.history.some((e) => e.status === 'en-curso') && it.d1.status === 'terminado' && it.d1.doneDate === yesterday, it.d1.history);
    ok('tiempo de ciclo después: sin cambios (5 días)', /5 días/.test(await tileText(page, 'cycle')), await tileText(page, 'cycle'));
    const cfd = await page.evaluate(async (pid) => { const ag = await PM.store.get(PM.paths.tool(pid, 'agile')); const st = PM.agile.settings(ag); const its = (await PM.store.list(PM.paths.backlog(pid))).map((d) => ({ ...d.data, id: d.id })).filter((x) => x.id === 'd1'); const d = PM.date.add(PM.date.today(), -3); return PM.calc.cfd({ items: its, settings: st, from: d, to: d })[0]; }, pid);
    ok('flujo acumulado: el paso por la columna eliminada sigue «en curso»', cfd && cfd['en-curso'] === 1 && cfd.nuevo === 0, cfd);
  });

  await step('regresión: métricas de flujo hasta la fecha de corte', async () => {
    ok('rendimiento con corte hoy: 2 elementos', /^Rendimiento \(últimas 4 semanas\) 2 elementos/.test(await tileText(page, 'thr')), await tileText(page, 'thr'));
    await page.evaluate(async (pid) => { await PM.projectOps.update(pid, { statusDate: PM.date.add(PM.date.today(), -3) }); }, pid);
    await sleep(page, 400);
    const thr = await tileText(page, 'thr'), cyc = await tileText(page, 'cycle');
    ok('con fecha de corte anterior: lo terminado después del corte no cuenta', /^Rendimiento \(últimas 4 semanas\) 1 elemento/.test(thr) && /al corte del/.test(thr), thr);
    ok('tiempo de ciclo al corte', /4 días/.test(cyc) && /al corte del/.test(cyc), cyc);
    await page.selectOption('#agk-f-sprint', 's2');
    await sleep(page, 200);
    ok('días restantes de la iteración desde la fecha de corte', /Quedan \d+ días hábiles/.test(await page.innerText('[data-agk-sprint]')), await page.innerText('[data-agk-sprint]'));
  });

  ok('regresiones: sin errores de consola ni tarjetas de error', !errors.length && !(await errorCards(page)).length, errors);
  await browser.close();
}

/* ================================================================= sesión 1c: filtros enviados por otras vistas y WIP del núcleo */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  const pid = await createProject(page, { lifecycle: 'Híbrido' });
  await seed(page, pid);
  const nav = async (view, params) => { await page.evaluate(({ view, params }) => PM.navigate(view, params), { view, params }); await sleep(page, 300); };
  const chips = () => page.$$eval('[data-agb-fchip]', (els) => els.map((e) => e.getAttribute('data-agb-fchip') + '=' + e.textContent.replace(/\s+/g, ' ').trim()));
  const countTxt = () => page.$eval('[data-agb-count]', (e) => e.textContent.trim());

  await step('backlog: filtros desde parámetros (EDT, releases, épica)', async () => {
    await nav('backlog', { wbs: 'w3' });
    await page.waitForSelector('tr[data-agb-row]');
    ok('params.wbs: filtra el entregable y lo que lo compone (1.3 y 1.3.1)', JSON.stringify(await order(page)) === JSON.stringify(['HU-001', 'HU-002']), await order(page));
    ok('params.wbs: el selector de entregable muestra el filtro', (await page.$eval('select[aria-label="Filtrar por entregable de la EDT"]', (e) => e.value)) === 'w3');
    ok('params.wbs: filtro visible con nombre y alcance', JSON.stringify(await chips()) === JSON.stringify(['wbs=Entregable:1.3 Plataforma digital de alquiler y lo que lo compone']), await chips());
    ok('params.wbs: contador «2 de 10»', (await countTxt()) === '2 de 10 elementos', await countTxt());
    ok('el distintivo del filtro tiene nombre accesible para quitarlo', (await page.$eval('[data-agb-fchip="wbs"]', (e) => e.getAttribute('aria-label'))) === 'Quitar el filtro entregable: 1.3 Plataforma digital de alquiler y lo que lo compone');
    await page.click('[data-agb-fchip="wbs"]'); await sleep(page, 150);
    ok('quitar el filtro desde su distintivo muestra todo el backlog', (await order(page)).length === 10 && !(await chips()).length && (await page.$eval('select[aria-label="Filtrar por entregable de la EDT"]', (e) => e.value)) === '', await order(page));
    /* con la vista ya abierta: cada navegación con filtro lo aplica (como desde Releases e iteraciones) */
    await nav('backlog', { release: 'r2' });
    ok('params.release con la vista abierta: elementos del release', JSON.stringify(await order(page)) === JSON.stringify(['HU-004', 'HU-005']), await order(page));
    ok('params.release: filtro visible', JSON.stringify(await chips()) === JSON.stringify(['release=Release:Release 2 · Facturación']), await chips());
    await nav('backlog', { epic: 'e1' });
    ok('params.epic: la épica y sus elementos (reemplaza el filtro anterior)', JSON.stringify(await order(page)) === JSON.stringify(['EP-001', 'HU-001', 'HU-002', 'HU-003']) && JSON.stringify(await chips()) === JSON.stringify(['epic=Épica:EP-001 Gestión de inventario de andamios']), [await order(page), await chips()]);
    await nav('backlog', {});
    ok('sin parámetros se conservan los filtros actuales', (await order(page)).length === 4 && (await chips()).length === 1, await chips());
    await page.getByRole('button', { name: 'Limpiar filtros' }).first().click(); await sleep(page, 150);
    ok('«Limpiar filtros» quita todos los distintivos', (await order(page)).length === 10 && !(await page.$('[data-agb-active]')), await chips());
    /* alta rápida con el filtro de la EDT: el elemento nace en ese entregable */
    await nav('backlog', { wbs: 'w4' });
    await page.fill('.agb-quick input', 'Consultar contratos desde el portal'); await page.keyboard.press('Enter'); await sleep(page, 400);
    const its = await readItems(page, pid);
    const nw = Object.values(its).find((x) => x.title === 'Consultar contratos desde el portal');
    ok('alta rápida con el filtro recibido: hereda el entregable', nw && nw.wbsId === 'w4', nw);
  });

  await step('tablero: parámetros de iteración y release', async () => {
    await nav('kanban', { release: 'r1' });
    await page.waitForSelector('[data-agk-board]');
    const vals = async () => page.evaluate(() => [document.getElementById('agk-f-sprint').value, document.getElementById('agk-f-rel').value]);
    ok('params.release: todo el flujo del release', JSON.stringify(await vals()) === JSON.stringify(['', 'r1']), await vals());
    const cards = () => page.$$eval('[data-agk-card]', (els) => els.map((e) => e.getAttribute('data-agk-card')).sort());
    ok('params.release: solo las tarjetas del release', JSON.stringify(await cards()) === JSON.stringify(['i1', 'i2', 'i3', 'i4']), await cards());
    await nav('kanban', { sprint: 's2' });
    ok('params.sprint con la vista abierta: la iteración pedida', JSON.stringify(await vals()) === JSON.stringify(['s2', '']) && JSON.stringify(await cards()) === JSON.stringify(['i2', 'i3', 'i4', 'i7']), [await vals(), await cards()]);
    /* conteo WIP = PM.agile.wipStatus del núcleo (la misma regla del tablero del proyecto) */
    const cmp = await page.evaluate(async (pid) => {
      const ag = await PM.store.get(PM.paths.tool(pid, 'agile'));
      const items = (await PM.store.list(PM.paths.backlog(pid))).map((d) => ({ id: d.id, ...d.data }));
      const core = PM.agile.wipStatus(PM.agile.settings(ag), items).map((w) => w.id + ':' + (w.wip ? w.count + ' / ' + w.wip : String(w.count)));
      const shown = [...document.querySelectorAll('[data-agk-count]')].map((e) => e.getAttribute('data-agk-count') + ':' + e.textContent.trim());
      return { core, shown };
    }, pid);
    ok('conteo WIP de cada columna igual a PM.agile.wipStatus', JSON.stringify(cmp.core) === JSON.stringify(cmp.shown), cmp);
    ok('columna en su límite: «Límite WIP alcanzado»', /Límite WIP alcanzado/.test(await page.innerText('[data-agk-col="en-curso"] .agk-col-head')));
  });

  await step('400 px: filtros aplicados sin desborde', async () => {
    await page.setViewportSize({ width: 400, height: 820 }); await sleep(page, 200);
    await nav('backlog', { wbs: 'w3', release: 'r1', epic: 'e1' });
    ok('400 px: tres filtros aplicados visibles', (await chips()).length === 3, await chips());
    ok('400 px: sin desborde horizontal con los filtros aplicados', (await horizontalOverflow(page)) <= 0, await horizontalOverflow(page));
    if (shots) await page.screenshot({ path: join(shots, 'backlog-filtros-400.png'), fullPage: false });
  });

  ok('filtros por parámetros: sin errores de consola ni tarjetas de error', !errors.length && !(await errorCards(page)).length, errors);
  await browser.close();
}

/* ================================================================= sesión 2: 300 elementos */
{
  const { browser, page, errors } = await openApp({ file, width: 1600, height: 900 });
  const pid = await createProject(page, { lifecycle: 'Adaptativo (ágil)' });
  await seed(page, pid, { many: 300, framework: 'kanban' });
  await gotoView(page, 'portafolio');
  /* espera con límite de 8 s (una espera infinita colgaría la prueba) */
  await page.evaluate(() => { window.waitFor = (cond) => new Promise((res, rej) => { const t0 = performance.now(); const tick = () => { if (cond()) return res(); if (performance.now() - t0 > 8000) return rej(new Error('Tiempo de espera agotado')); setTimeout(tick, 5); }; tick(); }); });
  const t1 = await page.evaluate(async () => {
    const t0 = performance.now(); PM.navigate('backlog');
    await waitFor(() => document.querySelectorAll('tr[data-agb-row]').length === 300);
    return performance.now() - t0;
  });
  ok('300 elementos: backlog completo en tiempo razonable (< 4 s): ' + Math.round(t1) + ' ms', t1 < 4000, t1);
  await spy(page);
  const t2 = await page.evaluate(async () => {
    const t0 = performance.now(); document.querySelector('button[aria-label="Subir HU-150"]').click();
    await waitFor(() => [...document.querySelectorAll('tr[data-agb-row] .code-tag')].map((e) => e.textContent).indexOf('HU-150') === 148);
    return performance.now() - t0;
  });
  ok('300 elementos: reordenar (< 1 s): ' + Math.round(t2) + ' ms', t2 < 1000, t2);
  ok('300 elementos: una sola escritura al reordenar', JSON.stringify(await sets(page)) === '["m149"]', await sets(page));
  const t3 = await page.evaluate(async () => {
    const inp = document.querySelector('input[aria-label="Buscar en el backlog"]');
    const t0 = performance.now(); inp.value = 'carga 12'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => document.querySelectorAll('tr[data-agb-row]').length < 300);
    return performance.now() - t0;
  });
  ok('300 elementos: filtrar por texto (< 1 s): ' + Math.round(t3) + ' ms', t3 < 1000 && (await page.$$('tr[data-agb-row]')).length === 11, [t3, (await page.$$('tr[data-agb-row]')).length]);
  const t4 = await page.evaluate(async () => {
    const t0 = performance.now(); PM.navigate('kanban');
    await waitFor(() => document.querySelectorAll('[data-agk-card]').length >= 150);
    return performance.now() - t0;
  });
  const nCards = await page.$$eval('[data-agk-card]', (e) => e.length);
  ok('300 elementos: tablero (Kanban: todo el flujo) en tiempo razonable (< 4 s): ' + Math.round(t4) + ' ms', t4 < 4000 && (await page.inputValue('#agk-f-sprint')) === '', t4);
  ok('300 elementos: «Terminado» muestra los 20 más recientes', nCards === 150 + 20 && /Mostrar los 50 terminados/.test(await page.innerText('[data-agk-col="terminado"]')), nCards);
  const t5 = await page.evaluate(async () => {
    const t0 = performance.now(); document.querySelector('[data-agk-card="m3"] [data-act="prev"]').click();
    await waitFor(() => { const c = document.querySelector('[data-agk-card="m3"]'); return c && c.closest('[data-agk-col]').dataset.agkCol === 'por-hacer'; });
    return performance.now() - t0;
  });
  ok('300 elementos: mover una tarjeta (< 1 s): ' + Math.round(t5) + ' ms', t5 < 1000, t5);
  ok('300 elementos: sin errores', !errors.length && !(await errorCards(page)).length, errors);
  await browser.close();
}

/* ================================================================= sesión 3: 400 px, tema oscuro y 1920 px */
for (const cfg of [{ width: 400, height: 860, dark: false, tag: 'm' }, { width: 400, height: 860, dark: true, tag: 'm-dark' }, { width: 1920, height: 1000, dark: true, tag: '1920-dark' }]) {
  const { browser, page, errors } = await openApp({ file, width: cfg.width, height: cfg.height, dark: cfg.dark });
  const pid = await createProject(page, { lifecycle: 'Híbrido' });
  await seed(page, pid);
  for (const v of ['backlog', 'kanban']) {
    await gotoView(page, v);
    await sleep(page, 300);
    const ov = await horizontalOverflow(page);
    ok(`${cfg.tag}: ${v} sin desborde horizontal (${ov}px)`, ov <= 1, ov);
    if (shots) await page.screenshot({ path: join(shots, `${v}-${cfg.tag}.png`), fullPage: true });
    if (cfg.width === 1920) {
      const w = await page.evaluate((v) => { const host = document.querySelector('.view-host'); const cs = getComputedStyle(host); const inner = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); const el = document.querySelector(v === 'backlog' ? '.agb-page .table-wrap' : '.agk-board'); return [Math.round(el.getBoundingClientRect().width), Math.round(inner)]; }, v);
      ok(`1920: ${v} usa todo el ancho (${w[0]} de ${w[1]} px)`, w[0] >= w[1] - 2, w);
    }
    if (cfg.dark && v === 'backlog') {
      const bg = await page.evaluate(() => [getComputedStyle(document.querySelector('.agb-tiles-card')).backgroundColor, getComputedStyle(document.body).backgroundColor]);
      ok(`${cfg.tag}: superficies con tokens del tema oscuro`, bg[0] === 'rgb(21, 28, 37)' && bg[1] === 'rgb(13, 18, 24)', bg);
    }
  }
  if (cfg.tag === 'm') {
    await gotoView(page, 'backlog');
    await page.click('tr[data-agb-row="i1"] [data-act="open"]');
    await page.waitForSelector('.modal [data-agb-editor]');
    ok('400 px: editor sin desborde', (await horizontalOverflow(page)) <= 1 && (await page.$eval('.modal', (m) => m.scrollWidth <= m.clientWidth + 1)));
    if (shots) await page.screenshot({ path: join(shots, 'editor-m.png') });
    await page.keyboard.press('Escape');
    await gotoView(page, 'kanban');
    await page.click('.page-actions button:has-text("Editar columnas")');
    await page.waitForSelector('[data-agk-columns]');
    ok('400 px: editor de columnas sin desborde', (await horizontalOverflow(page)) <= 1 && (await page.$eval('.modal', (m) => m.scrollWidth <= m.clientWidth + 1)));
    if (shots) await page.screenshot({ path: join(shots, 'columns-m.png') });
    await page.keyboard.press('Escape');
    const board = await page.$eval('.agk-board', (b) => [b.scrollWidth > b.clientWidth, getComputedStyle(b).overflowX]);
    ok('400 px: el tablero se desplaza dentro de su contenedor', board[0] && board[1] === 'auto', board);
  }
  ok(`${cfg.tag}: sin errores`, !errors.length && !(await errorCards(page)).length, errors);
  await browser.close();
}

/* ================================================================= estático: solo tokens de color, sin emojis */
{
  const src = readFileSync(join(root, 'src/45-agile-backlog.js'), 'utf8');
  const css = src.slice(src.indexOf('const CSS = `'), src.indexOf('`;', src.indexOf('const CSS = `')));
  ok('CSS solo con tokens (sin colores literales)', !/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(css));
  ok('sin emojis en el módulo', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(src));
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

// Integración ágil en la EDT (30-wbs) y en el cronograma (40-schedule), SPEC §9.1, §9.3 y §9.4 «Integraciones».
// Uso: node test/agile-c1.test.mjs --file <ruta.html> [--shots dir]
//   (la página debe incluir 30 y 40: node build.mjs --out /tmp/x.html --include 30,40)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let fails = 0, total = 0;
const check = (name, ok, info) => { total++; if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || info === undefined ? '' : '\n      ' + JSON.stringify(info))); };
const eq = (name, got, exp) => check(name, JSON.stringify(got) === JSON.stringify(exp), { got, exp });
const nb = (t) => String(t == null ? '' : t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const shot = async (page, name, full = true) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: full }); };

/* ------------------------------------------------------------------ datos de prueba (proyecto híbrido) */
const WBS = { nodes: [
  { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1, responsible: 'Director de proyecto' },
  { id: 'w11', parentId: 'w1', name: 'Planificación', order: 1, costEstimate: 8000000 },
  { id: 'w12', parentId: 'w1', name: 'Seguimiento y control', order: 2, costEstimate: 6000000 },
  { id: 'w2', parentId: null, name: 'Plataforma digital de alquiler', order: 2, approach: 'adaptativo' },
  { id: 'w21', parentId: 'w2', name: 'Módulo de inventario', order: 1, costEstimate: 90000000 },
  { id: 'w22', parentId: 'w2', name: 'Módulo de facturación', order: 2, costEstimate: 70000000 },
  { id: 'w3', parentId: null, name: 'Montaje en obra', order: 3 },
  { id: 'w31', parentId: 'w3', name: 'Montaje niveles 1 a 5', order: 1, costEstimate: 30000000 },
  { id: 'w32', parentId: 'w3', name: 'Montaje niveles 6 a 10', order: 2, costEstimate: 30000000 },
] };
const SCHEDULE = { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [
  { id: 't1', name: 'Plan del proyecto', wbsId: 'w11', duration: 5, milestone: false, start: '2026-08-03', deps: [], progress: 100, cost: 8000000, resources: [], actualStart: '2026-08-03', actualFinish: '2026-08-07' },
  { id: 't2', name: 'Desarrollo del inventario', wbsId: 'w21', releaseId: 'r1', duration: 40, milestone: false, start: '2026-08-03', deps: [], progress: 0, cost: 90000000, resources: [] },
  { id: 't3', name: 'Montaje niveles 1 a 5', wbsId: 'w31', duration: 20, milestone: false, start: '2026-08-10', deps: [], progress: 30, cost: 30000000, resources: [] },
  { id: 't4', name: 'Desarrollo de la facturación', wbsId: 'w22', duration: 30, milestone: false, start: '2026-09-28', deps: [{ id: 't2', type: 'FS', lag: 0 }], progress: 10, cost: 70000000, resources: [] },
  { id: 't5', name: 'Montaje niveles 6 a 10', wbsId: 'w32', duration: 15, milestone: false, start: null, deps: [{ id: 't3', type: 'FS', lag: 0 }], progress: 0, cost: 30000000, resources: [] },
] };
const AGILE = {
  settings: { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, scopeChangeThreshold: 10 },
  releases: [
    { id: 'r1', name: 'Release 1 · Inventario', goal: 'Inventario en bodega y obra', start: '2026-08-03', end: '2026-09-25', status: 'en-curso', budget: 90000000, plannedSprints: 4, wbsId: 'w21', taskId: null, baseline: null, notes: '' },
    { id: 'r2', name: 'Release 2 · Facturación', goal: '', start: '2026-09-28', end: '2026-11-20', status: 'planeado', budget: 70000000, plannedSprints: 3, wbsId: null, taskId: null, baseline: null, notes: '' },
  ],
  sprints: [
    { id: 's1', name: 'Iteración 1', releaseId: 'r1', goal: '', start: '2026-08-03', end: '2026-08-14', status: 'cerrado', capacity: 14, committed: 13, completed: 13, docs: {} },
    { id: 's2', name: 'Iteración 2', releaseId: 'r1', goal: '', start: '2026-08-18', end: '2026-08-31', status: 'cerrado', capacity: 14, committed: 13, completed: 13, docs: {} },
    { id: 's3', name: 'Iteración 3', releaseId: 'r1', goal: '', start: '2026-09-01', end: '2026-09-14', status: 'en-curso', capacity: 14, committed: 13, completed: null, docs: {} },
    { id: 's4', name: 'Iteración 4', releaseId: 'r2', goal: '', start: '2026-09-28', end: '2026-10-09', status: 'planeado', capacity: 14, committed: null, completed: null, docs: {} },
  ],
};
const item = (id, code, title, estimate, extra) => ({ code, type: 'historia', title, description: '', acceptance: 'Criterio', estimate, priority: 'Debe tener', rank: Number(code.slice(3)) * 1000, status: 'backlog', wbsId: 'w21', releaseId: 'r1', sprintId: null, epicId: null, assignee: '', blocked: false, tags: [], createdAt: '2026-07-28', doneDate: null, history: [{ date: '2026-07-28', status: 'backlog' }], id, ...extra });
/* r1: 13 de 34 pts terminados = 38,2 %; r2 (w22): 5 de 8 pts */
const ITEMS = [
  item('e1', 'EP-001', 'Inventario', null, { type: 'epica' }),
  item('i1', 'HU-001', 'Catálogo de equipos', 5, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-12' }),
  item('i2', 'HU-002', 'Ubicaciones de bodega', 3, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-14' }),
  item('i3', 'HU-003', 'Remisión de salida', 5, { sprintId: 's2', status: 'terminado', doneDate: '2026-08-28' }),
  item('i4', 'HU-004', 'Devolución parcial', 8, { sprintId: 's3', status: 'en-curso' }),
  item('i5', 'HU-005', 'Inspección de retorno', 5, { sprintId: 's3', status: 'por-hacer' }),
  item('i6', 'HU-006', 'Faltantes y daños', 8, {}),
  item('j1', 'HU-020', 'Factura electrónica', 5, { wbsId: 'w22', releaseId: 'r2', status: 'terminado', doneDate: '2026-09-30' }),
  item('j2', 'HU-021', 'Notas crédito', 3, { wbsId: 'w22', releaseId: 'r2' }),
  item('k1', 'HU-030', 'Elemento sin entregable', 2, { wbsId: null, releaseId: null }),
];

async function seed(page, meta = {}) {
  return page.evaluate(async ({ WBS, SCHEDULE, AGILE, ITEMS, meta }) => {
    const pid = await PM.projectOps.create({ name: 'Plataforma y montaje Torre 3', code: 'PRY-AG-001', start: '2026-08-03', end: '2026-12-18', budget: 300000000, currency: 'COP', status: 'En ejecución', lifecycle: 'Híbrido', statusDate: '2026-10-02', ...meta });
    await PM.store.set(PM.paths.tool(pid, 'wbs'), WBS);
    await PM.store.set(PM.paths.tool(pid, 'schedule'), SCHEDULE);
    await PM.store.set(PM.paths.tool(pid, 'agile'), AGILE);
    for (const it of ITEMS) { const { id, ...body } = it; await PM.store.set(PM.paths.backlogItem(pid, id), body); }
    /* la página de prueba (30,40) no incluye 46: vista mínima para comprobar la navegación con sus parámetros */
    if (!PM.getView('iteraciones')) PM.registerView({ id: 'iteraciones', label: 'Releases e iteraciones', group: 'agil', icon: 'sprint', order: 30, needsProject: true, component: ({ params }) => PM.lib.html`<div class="page" data-stub-iteraciones>${(params && params.release) || ''}</div>` });
    PM.selectProject(pid, 'tablero');
    return pid;
  }, { WBS, SCHEDULE, AGILE, ITEMS, meta });
}
const tool = (page, pid, id) => page.evaluate(({ pid, id }) => PM.store.get(PM.paths.tool(pid, id)), { pid, id });
const backlogItem = (page, pid, id) => page.evaluate(({ pid, id }) => PM.store.get(PM.paths.backlogItem(pid, id)), { pid, id });
const openRowMenu = async (page, code) => { await page.hover(`tr[data-code="${code}"] td:nth-child(3)`); await page.click(`button[aria-label="Acciones de ${code}"]`); await page.waitForSelector('.wbs-rowmenu'); };
const menuItems = (page) => page.$$eval('.wbs-rowmenu [role=menuitem]', (els) => els.map((e) => e.textContent.trim()));
const state = (page) => page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
const stubDownloads = (page) => page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data: String(data) }); return true; }; });

/* =============================================================== A. EDT: enfoque, distintivos, releases y backlog */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page);
    await gotoView(page, 'edt');
    await page.waitForSelector('tr[data-wbs-row]');

    /* --- distintivos: solo los entregables adaptativos (proyecto híbrido) --- */
    const badges = await page.$$eval('tr[data-wbs-row]', (trs) => trs.map((r) => { const b = r.querySelector('.wbs-ap'); return [r.dataset.code, b ? b.textContent.trim() + (b.classList.contains('is-inh') ? ':heredado' : '') : null]; }));
    eq('distintivo «Ágil» en la rama adaptativa (lleno en el inicio, punteado al heredar)', badges, [['1', null], ['1.1', null], ['1.1.1', null], ['1.1.2', null], ['1.2', 'Ágil'], ['1.2.1', 'Ágil:heredado'], ['1.2.2', 'Ágil:heredado'], ['1.3', null], ['1.3.1', null], ['1.3.2', null]]);
    check('el distintivo tiene icono y texto (no solo color)', await page.$eval('tr[data-code="1.2"] .wbs-ap', (b) => !!b.querySelector('svg.icon') && b.textContent.trim() === 'Ágil' && /adaptativo/.test(b.title)), null);
    await shot(page, 'edt-hibrido');

    /* --- diccionario lateral: enfoque heredado, backlog del elemento y de la rama, releases --- */
    await page.click('tr[data-code="1.2.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('selector «Enfoque de desarrollo» en el panel', await page.isVisible('aside.wbs-panel #wbs-f-approach'), null);
    eq('valor heredado (sin clave propia)', await page.$eval('#wbs-f-approach', (s) => s.value), '');
    eq('la opción heredada muestra el enfoque efectivo', await page.$eval('#wbs-f-approach', (s) => s.options[0].textContent.trim()), 'Heredado (Adaptativo (ágil))');
    const stats = nb(await page.textContent('aside.wbs-panel [data-wbs-backlog-stats]'));
    check('backlog del paquete: 6 elementos, 34 pts, 13 terminados (sin la épica)', /6 elementos/.test(stats) && /34 pts estimados/.test(stats) && /13 pts terminados/.test(stats) && /3 pendientes/.test(stats), stats);
    eq('avance del backlog 38,2 %', nb(await page.textContent('aside.wbs-panel [data-wbs-backlog-pct]')), '38,2 %');
    check('avance con medidor accesible', await page.$eval('aside.wbs-panel .wbs-agile .meter', (m) => m.getAttribute('role') === 'meter' && m.getAttribute('aria-valuenow') === '38' && /Avance del backlog/.test(m.getAttribute('aria-label'))), null);
    check('release del paquete listado', (await page.$$('aside.wbs-panel [data-wbs-release="r1"]')).length === 1, null);
    await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForTimeout(150);
    const stats2 = nb(await page.textContent('aside.wbs-panel [data-wbs-backlog-stats]'));
    check('backlog de la rama 1.2: 8 elementos y 42 pts (incluye los descendientes)', /8 elementos/.test(stats2) && /42 pts estimados/.test(stats2) && /18 pts terminados/.test(stats2), stats2);
    eq('enfoque propio de 1.2', await page.$eval('#wbs-f-approach', (s) => s.value), 'adaptativo');

    /* --- cambiar el enfoque con el teclado: 1.3 pasa a adaptativo y vuelve a heredado --- */
    await page.click('tr[data-code="1.3"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('1.3 sin sección de releases creables (predictivo)', !(await page.isVisible('aside.wbs-panel [data-wbs-create-release]')), null);
    await page.focus('#wbs-f-approach');
    await page.selectOption('#wbs-f-approach', 'adaptativo'); await page.waitForTimeout(900);
    let w = await tool(page, pid, 'wbs');
    eq('enfoque guardado en el nodo', w.nodes.find((n) => n.id === 'w3').approach, 'adaptativo');
    check('distintivo en 1.3 y heredado en 1.3.1', (await page.textContent('tr[data-code="1.3"] .wbs-ap')).trim() === 'Ágil' && await page.$eval('tr[data-code="1.3.1"] .wbs-ap', (b) => b.classList.contains('is-inh')), null);
    check('ahora ofrece «Crear release»', await page.isVisible('aside.wbs-panel [data-wbs-create-release]'), null);
    await page.selectOption('#wbs-f-approach', ''); await page.waitForTimeout(900);
    w = await tool(page, pid, 'wbs');
    check('«Heredado» quita la clave approach', !('approach' in w.nodes.find((n) => n.id === 'w3')), w.nodes.find((n) => n.id === 'w3'));
    check('sin distintivo al volver a heredado', (await page.$$('tr[data-code="1.3"] .wbs-ap')).length === 0, null);

    /* --- menú de fila: «Ver release» y «Crear release» --- */
    await openRowMenu(page, '1.2.1');
    check('1.2.1 ya tiene release: «Ver release»', (await menuItems(page)).includes('Ver release') && !(await menuItems(page)).includes('Crear release'), await menuItems(page));
    await page.keyboard.press('Escape');
    await openRowMenu(page, '1.1.1');
    check('paquete predictivo sin acciones de release', !(await menuItems(page)).some((x) => /release/i.test(x)), await menuItems(page));
    await page.keyboard.press('Escape');
    await openRowMenu(page, '1.2.2');
    check('1.2.2 sin release: «Crear release»', (await menuItems(page)).includes('Crear release'), await menuItems(page));
    await page.getByRole('menuitem', { name: 'Crear release' }).click(); await page.waitForTimeout(900);
    const ag = await tool(page, pid, 'agile');
    const nr = ag.releases.find((r) => r.wbsId === 'w22');
    check('release creado con el contrato del SPEC', nr && /^rel/.test(nr.id) && nr.name === 'Módulo de facturación' && nr.goal === '' && nr.status === 'planeado' && nr.plannedSprints === 0 && nr.taskId === null && nr.baseline === null && nr.notes === '', nr);
    eq('presupuesto = costo de las actividades del paquete', nr && nr.budget, 70000000);
    const rollT4 = await page.evaluate(async (pid) => { const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); const p = await PM.store.get(PM.paths.project(pid)); const r = PM.calc.computeSchedule(s, p.start).byId.get('t4'); return [r.startDate, r.finishDate]; }, pid);
    check('fechas del release = las de sus actividades', nr && nr.start === rollT4[0] && nr.end === rollT4[1], { rel: nr && [nr.start, nr.end], rollT4 });
    check('los releases existentes se conservan', ag.releases.length === 3 && ag.releases[0].id === 'r1' && ag.sprints.length === 4, ag.releases.map((r) => r.id));
    let st = await state(page);
    check('navega a iteraciones con el release', st.view === 'iteraciones' && st.params && st.params.release === nr.id, st);
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-wbs-row]');
    await openRowMenu(page, '1.2.2');
    check('ahora ofrece «Ver release»', (await menuItems(page)).includes('Ver release'), await menuItems(page));
    await page.getByRole('menuitem', { name: 'Ver release' }).click(); await page.waitForTimeout(200);
    st = await state(page);
    check('«Ver release» abre su release', st.view === 'iteraciones' && st.params.release === nr.id, st);
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-wbs-row]');

    /* --- panel: «Crear otro release» --- */
    await page.click('tr[data-code="1.2.2"] .wbs-code-btn'); await page.waitForTimeout(150);
    eq('botón «Crear otro release» cuando ya hay uno', nb(await page.textContent('aside.wbs-panel [data-wbs-create-release]')), 'Crear otro release');
    await page.click('aside.wbs-panel [data-wbs-create-release]'); await page.waitForTimeout(900);
    const ag2 = await tool(page, pid, 'agile');
    check('segundo release del entregable', ag2.releases.filter((r) => r.wbsId === 'w22').length === 2 && ag2.releases.some((r) => r.name === 'Módulo de facturación · release 2'), ag2.releases.map((r) => r.name));
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-wbs-row]');

    /* --- diagrama: distintivo con texto y en el nombre accesible --- */
    await page.getByRole('tab', { name: /Diagrama/ }).click(); await page.waitForTimeout(250);
    eq('diagrama: distintivos «Ágil»', await page.$$eval('.wbs-chart .wbs-dg-ap text', (t) => t.map((x) => x.textContent)), ['Ágil', 'Ágil', 'Ágil']);
    check('diagrama: el nombre accesible dice «ágil»', /\(ágil\)/.test(await page.$eval('g.wbs-dg-box[data-id="w2"]', (g) => g.getAttribute('aria-label'))), null);
    check('diagrama: leyenda del enfoque', /Enfoque adaptativo/.test(await page.textContent('.wbs-chart')) || /Enfoque adaptativo/.test(await page.textContent('section.card .legend')), null);
    const inBox = await page.$$eval('.wbs-chart g.wbs-dg-box', (gs) => gs.every((g) => { const tag = g.querySelector('.wbs-dg-ap'); if (!tag) return true; const r = g.querySelector('rect').getBBox(); const b = tag.getBBox(); const m = tag.transform.baseVal.consolidate().matrix; const code = g.querySelector('.wbs-dg-code').getBBox(); return m.e >= code.x + code.width && m.e + b.width <= r.width; }));
    check('diagrama: el distintivo cabe en la caja sin tapar el código', inBox, null);
    await shot(page, 'edt-diagrama');

    /* --- diccionario (tabla): columna de enfoque editable --- */
    await page.getByRole('tab', { name: /Diccionario/ }).click(); await page.waitForTimeout(200);
    check('columna «Enfoque de desarrollo»', await page.isVisible('th:has-text("Enfoque de desarrollo")'), null);
    const sel = 'tr[data-wbs-dict="w32"] select.wbs-dc-ap';
    eq('valor heredado en la tabla', await page.$eval(sel, (s) => [s.value, s.options[0].textContent.trim()]), ['', 'Heredado (Predictivo)']);
    await page.focus(sel); await page.selectOption(sel, 'adaptativo'); await page.waitForTimeout(900);
    w = await tool(page, pid, 'wbs');
    eq('enfoque editado desde la tabla', w.nodes.find((n) => n.id === 'w32').approach, 'adaptativo');
    await stubDownloads(page);
    await page.getByRole('button', { name: 'Exportar CSV' }).click(); await page.waitForTimeout(100);
    const csv = (await page.evaluate(() => window.__dl)).pop();
    check('CSV del diccionario con enfoque y backlog', csv && /Enfoque de desarrollo/.test(csv.data) && /Adaptativo \(ágil\) \(heredado\)/.test(csv.data) && /Estimación del backlog \(pts\)/.test(csv.data), csv && csv.data.split('\n')[0]);
    await page.selectOption(sel, ''); await page.waitForTimeout(700);
    await shot(page, 'edt-diccionario');

    /* --- solo lectura --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    check('lectura: tabla sin selector de enfoque', (await page.$$('select.wbs-dc-ap')).length === 0 && /Adaptativo \(ágil\)/.test(await page.textContent('tr[data-wbs-dict="w21"]')), null);
    await page.getByRole('tab', { name: /Árbol/ }).click(); await page.waitForTimeout(150);
    await openRowMenu(page, '1.2.1');
    eq('lectura: menú con diccionario y «Ver release»', await menuItems(page), ['Ver diccionario', 'Ver release']);
    await page.keyboard.press('Escape');
    await openRowMenu(page, '1.3.1');
    eq('lectura: sin «Crear release»', await menuItems(page), ['Ver diccionario']);
    await page.keyboard.press('Escape');
    await page.click('tr[data-code="1.2.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('lectura: panel sin selector ni «Crear release», con el enfoque en texto', !(await page.isVisible('#wbs-f-approach')) && !(await page.isVisible('[data-wbs-create-release]')) && /Adaptativo \(ágil\) \(heredado\)/.test(await page.textContent('aside.wbs-panel')), null);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(150);

    /* --- eliminar: limpia wbsId de releases y de elementos del backlog, con aviso --- */
    await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'Eliminar elemento' }).click();
    await page.waitForSelector('.modal');
    const confirmText = nb(await page.textContent('.modal'));
    check('confirmación avisa de los releases', /releases \(«Release 1 · Inventario», «Módulo de facturación», «Módulo de facturación · release 2»\) quedarán sin entregable/.test(confirmText), confirmText);
    check('confirmación avisa de los elementos del backlog', /9 elementos del backlog quedarán sin entregable/.test(confirmText) && /No se eliminan/.test(confirmText), confirmText);
    await page.click('.modal-foot >> text=Eliminar 3 elementos'); await page.waitForTimeout(1100);
    const ag3 = await tool(page, pid, 'agile');
    check('releases sin wbsId tras eliminar', ag3.releases.every((r) => r.wbsId === null) && ag3.releases.length === 4, ag3.releases.map((r) => [r.name, r.wbsId]));
    const i1 = await backlogItem(page, pid, 'i1'); const j1 = await backlogItem(page, pid, 'j1'); const k1 = await backlogItem(page, pid, 'k1');
    check('elementos del backlog sin wbsId y con su historial', i1.wbsId === null && j1.wbsId === null && i1.status === 'terminado' && i1.doneDate === '2026-08-12' && i1.history.length === 1 && k1.wbsId === null, [i1.wbsId, j1.wbsId, i1.status]);
    const sch = await tool(page, pid, 'schedule');
    check('actividades sin vínculo a la EDT y con su release', sch.tasks.find((t) => t.id === 't2').wbsId === null && sch.tasks.find((t) => t.id === 't2').releaseId === 'r1', sch.tasks.find((t) => t.id === 't2'));

    const cards = await errorCards(page);
    check('A: sin tarjetas de error', !cards.length, cards);
    check('A: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN A', e); }
  finally { await browser.close(); }
}

/* =============================================================== B. EDT: proyecto adaptativo y predictivo */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    /* adaptativo: todo es ágil; solo se marcan los entregables predictivos */
    await seed(page, { lifecycle: 'Adaptativo (ágil)', code: 'PRY-AG-002' });
    await page.evaluate(async () => { const pid = PM.getState().projectId; const w = await PM.store.get(PM.paths.tool(pid, 'wbs')); await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: w.nodes.map((n) => (n.id === 'w3' ? { ...n, approach: 'predictivo' } : n.id === 'w2' ? (({ approach, ...r }) => r)(n) : n)) }); });
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-wbs-row]');
    const badges = await page.$$eval('tr[data-wbs-row] .wbs-ap', (bs) => bs.map((b) => b.closest('tr').dataset.code + ':' + b.textContent.trim()));
    eq('adaptativo: solo los predictivos llevan distintivo', badges, ['1.3:Predictivo', '1.3.1:Predictivo', '1.3.2:Predictivo']);
    await openRowMenu(page, '1.1.1');
    check('adaptativo: cualquier paquete ágil ofrece «Crear release»', (await menuItems(page)).includes('Crear release'), await menuItems(page));
    await page.keyboard.press('Escape');
    await page.click('tr[data-code="1.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    eq('adaptativo: heredado del proyecto', await page.$eval('#wbs-f-approach', (s) => s.options[0].textContent.trim()), 'Heredado (Adaptativo (ágil))');
    await page.click('tr[data-code="1"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('resumen del proyecto con enfoque y backlog', /Adaptativo \(ágil\)/.test(await page.textContent('[data-wbs-agile-root]')) && /sin entregable/.test(await page.textContent('[data-wbs-agile-root]')), null);

    /* predictivo: sin selector ni distintivos ni releases (salvo nodos con enfoque propio) */
    await page.evaluate(async () => {
      const pid = await PM.projectOps.create({ name: 'Proyecto predictivo', code: 'PRY-AG-003', start: '2026-08-03', end: '2026-12-18', lifecycle: 'Predictivo' });
      await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [
        { id: 'p1', parentId: null, name: 'Ingeniería', order: 1 }, { id: 'p11', parentId: 'p1', name: 'Diseño', order: 1 }, { id: 'p12', parentId: 'p1', name: 'Memoria', order: 2 },
        { id: 'p2', parentId: null, name: 'Montaje', order: 2, approach: 'adaptativo' }, { id: 'p21', parentId: 'p2', name: 'Nivel 1', order: 1 }, { id: 'p22', parentId: 'p2', name: 'Nivel 2', order: 2 },
      ] });
      PM.selectProject(pid, 'edt');
    });
    await page.waitForTimeout(400); await page.waitForSelector('tr[data-wbs-row]');
    await page.click('tr[data-code="1.1.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('predictivo: sin selector de enfoque en un nodo sin enfoque propio', !(await page.isVisible('#wbs-f-approach')), null);
    await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForTimeout(150);
    check('predictivo: el nodo con enfoque propio conserva el selector', await page.isVisible('#wbs-f-approach'), null);
    await openRowMenu(page, '1.2.1');
    check('predictivo: sin «Crear release» (capa ágil inactiva)', !(await menuItems(page)).some((x) => /release/i.test(x)), await menuItems(page));
    await page.keyboard.press('Escape');
    check('predictivo: el distintivo marca el entregable adaptativo heredado', (await page.$$('tr[data-wbs-row] .wbs-ap')).length === 3, null);

    const cards = await errorCards(page);
    check('B: sin tarjetas de error', !cards.length, cards);
    check('B: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN B', e); }
  finally { await browser.close(); }
}

/* =============================================================== C. Cronograma: release vinculado, avance desde el backlog, iteraciones */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page);
    await page.evaluate(() => { PM.prefs.set('sched.tab', 'gantt'); PM.prefs.set('sched.group', false); PM.prefs.set('sched.cols', 'full'); });
    await gotoView(page, 'cronograma'); await page.waitForSelector('.sched-row[data-id="t2"]');
    const rowT2 = '.sched-grid .sched-row[data-id="t2"]';

    /* --- fila: distintivo del release y avance calculado (solo lectura) --- */
    check('icono del release en la fila vinculada', (await page.$$(rowT2 + ' .sched-rel[data-release="r1"] svg[role="img"]')).length === 1 && /Release vinculado: Release 1 · Inventario/.test(await page.$eval(rowT2 + ' .sched-rel title', (t) => t.textContent)), null);
    check('sin icono en filas no vinculadas', (await page.$$('.sched-grid .sched-row[data-id="t3"] .sched-rel')).length === 0, null);
    eq('avance calculado en la fila', nb(await page.textContent(rowT2 + ' [data-col="pct"]')), '38,2 %');
    check('la celda de avance no es editable', (await page.$$(rowT2 + ' [data-col="pct"] button')).length === 0 && /backlog del release «Release 1 · Inventario»/.test(await page.$eval(rowT2 + ' [data-col="pct"] .sched-cell', (c) => c.title)), null);
    await page.click(rowT2 + ' [data-col="pct"]'); await page.waitForTimeout(100);
    check('clic en la celda de avance no abre edición', (await page.$$(rowT2 + ' .sched-edit input')).length === 0, null);

    /* --- barra: iteraciones del release dentro de la barra --- */
    const iters = await page.$$eval('.sched-body g.sched-bar[data-id="t2"] .sched-iter', (gs) => gs.map((g) => [g.dataset.sprint, g.querySelector('title').textContent]));
    eq('marcas de las 3 iteraciones del release', iters.map((x) => x[0]), ['s1', 's2', 's3']);
    check('título con el nombre de la iteración', /^Iteración 2 · 18 ago – 31 ago 2026 · Release 1 · Inventario$/.test(nb(iters[1] && iters[1][1])), iters[1]);
    const geo = await page.$eval('.sched-body g.sched-bar[data-id="t2"]', (g) => { const main = g.querySelector('.sched-bar-main').getBBox(); return [...g.querySelectorAll('.sched-iter path')].map((p) => { const b = p.getBBox(); return b.x + b.width / 2 >= main.x - 1 && b.x + b.width / 2 <= main.x + main.width; }); });
    check('las marcas quedan dentro de la barra', geo.length === 3 && geo.every(Boolean), geo);
    check('la iteración de otro release no se marca en la barra', (await page.$$('.sched-body g.sched-bar[data-id="t4"] .sched-iter')).length === 0, null);
    check('leyenda: release vinculado e inicio de iteración', await page.isVisible('[data-legend="release"]') && await page.isVisible('[data-legend="iteration"]'), null);
    /* la barra empieza debajo de las columnas fijas: se apunta a la parte visible */
    const bb = await (await page.$('.sched-body g.sched-bar[data-id="t2"] .sched-bar-main')).boundingBox();
    const gridRight = await page.$eval('.sched-grid', (g) => g.getBoundingClientRect().right);
    await page.mouse.move(Math.min(bb.x + bb.width - 4, Math.max(bb.x + 8, gridRight + 12)), bb.y + bb.height / 2, { steps: 3 }); await page.waitForTimeout(150);
    const tipText = nb(await page.textContent('.sched-frame .chart-tip').catch(() => ''));
    check('tooltip con release, iteraciones y avance desde el backlog', /Release 1 · Inventario/.test(tipText) && /Iteración 1/.test(tipText) && /desde el backlog/.test(tipText), tipText.slice(0, 300));
    await shot(page, 'gantt-agil');

    /* --- exportación SVG sigue funcionando y conserva las marcas --- */
    await stubDownloads(page);
    await page.getByRole('button', { name: 'Descargar SVG' }).click(); await page.waitForTimeout(150);
    const dl = (await page.evaluate(() => window.__dl)).pop();
    check('SVG exportado con las marcas de iteración', dl && dl.name.endsWith('_gantt.svg') && dl.data.includes('Iteración 2') && dl.data.includes('inicio de las iteraciones'), dl && dl.name);
    await page.getByRole('button', { name: 'Exportar CSV' }).first().click(); await page.waitForTimeout(100);
    const csv = (await page.evaluate(() => window.__dl)).pop();
    check('CSV con la columna «Release vinculado»', csv && /Release vinculado/.test(csv.data) && /Release 1 · Inventario/.test(csv.data), csv && csv.data.split('\n')[0]);

    /* --- editor: release vinculado y avance calculado --- */
    await page.dblclick(rowT2 + ' [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    eq('editor: release vinculado', await page.$eval('#te-rel', (s) => s.value), 'r1');
    check('editor: % de avance deshabilitado con el valor calculado', await page.$eval('#te-pct', (i) => i.disabled && i.value === '38,2'), await page.$eval('#te-pct', (i) => [i.disabled, i.value]));
    check('editor: inicio real calculado (primera iteración iniciada) y deshabilitado', await page.$eval('#te-as', (i) => i.disabled && i.value === '2026-08-03'), await page.$eval('#te-as', (i) => [i.disabled, i.value]));
    check('editor: fin real deshabilitado', await page.$eval('#te-af', (i) => i.disabled && i.value === ''), null);
    const note = nb(await page.textContent('[data-agile-note]'));
    check('editor: «Avance calculado desde el backlog del release …: 38,2 %»', /Avance calculado desde el backlog del release «Release 1 · Inventario»: 38,2 %/.test(note) && /13 de 34 pts terminados/.test(note), note);
    /* guardar sin cambios no escribe el avance calculado en lo guardado */
    await page.fill('#te-name', 'Desarrollo del inventario (release 1)');
    await page.click('.modal-foot >> text=Guardar cambios'); await page.waitForTimeout(900);
    let sch = await tool(page, pid, 'schedule');
    let t2 = sch.tasks.find((t) => t.id === 't2');
    check('guardar conserva el avance y las fechas reales guardados', t2.progress === 0 && !t2.actualStart && !t2.actualFinish && t2.releaseId === 'r1' && t2.name === 'Desarrollo del inventario (release 1)', t2);

    /* --- vincular otra actividad al mismo release (con teclado): se quita el vínculo de la anterior --- */
    await page.dblclick('.sched-grid .sched-row[data-id="t4"] [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    eq('t4 sin release', await page.$eval('#te-rel', (s) => s.value), '');
    check('opción indica a qué actividad está vinculado el release', /vinculado a «Desarrollo del inventario \(release 1\)»/.test(await page.$eval('#te-rel option[value="r1"]', (o) => o.textContent)), null);
    await page.focus('#te-rel');
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
    if ((await page.$eval('#te-rel', (s) => s.value)) !== 'r1') await page.selectOption('#te-rel', 'r1');
    await page.waitForTimeout(100);
    check('t4: aviso de que se quita el vínculo de la otra actividad', /Al guardar se quita el vínculo de «Desarrollo del inventario \(release 1\)»/.test(nb(await page.textContent('.modal'))), null);
    check('t4: el avance pasa a calculado (deshabilitado)', await page.$eval('#te-pct', (i) => i.disabled && i.value === '38,2'), null);
    check('t4: la nota indica que se aplica al guardar', /Se aplica al guardar/.test(nb(await page.textContent('[data-agile-note]'))), null);
    await page.click('.modal-foot >> text=Guardar cambios'); await page.waitForTimeout(900);
    sch = await tool(page, pid, 'schedule');
    t2 = sch.tasks.find((t) => t.id === 't2'); const t4 = sch.tasks.find((t) => t.id === 't4');
    check('una actividad por release: t4 vinculada y t2 sin vínculo', t4.releaseId === 'r1' && t2.releaseId === null && t4.progress === 10, [t4.releaseId, t2.releaseId, t4.progress]);
    check('aviso al vincular menciona la actividad desvinculada', /Se quitó el vínculo de «Desarrollo del inventario \(release 1\)»/.test(nb(await page.textContent('.toasts'))), null);
    eq('fila t4 ahora calculada', nb(await page.textContent('.sched-grid .sched-row[data-id="t4"] [data-col="pct"]')), '38,2 %');
    check('fila t2 vuelve a ser editable', (await page.$$('.sched-grid .sched-row[data-id="t2"] [data-col="pct"] button.sched-cell')).length === 1, null);

    /* --- vínculo por release.taskId: desvincular limpia el release y conserva el último avance calculado --- */
    await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: a.releases.map((r) => (r.id === 'r2' ? { ...r, taskId: 't3' } : r)) }); }, pid);
    await page.waitForTimeout(300);
    eq('t3 vinculada por release.taskId: avance 62,5 % (5 de 8 pts)', nb(await page.textContent('.sched-grid .sched-row[data-id="t3"] [data-col="pct"]')), '62,5 %');
    await page.dblclick('.sched-grid .sched-row[data-id="t3"] [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    eq('t3: el editor muestra el release vinculado por release.taskId', await page.$eval('#te-rel', (s) => s.value), 'r2');
    await page.selectOption('#te-rel', ''); await page.waitForTimeout(100);
    check('t3: al desvincular, el avance se edita y parte del último calculado', await page.$eval('#te-pct', (i) => !i.disabled && i.value === '63'), await page.$eval('#te-pct', (i) => [i.disabled, i.value]));
    check('t3: sin nota de avance calculado', (await page.$$('[data-agile-note]')).length === 0, null);
    await page.click('.modal-foot >> text=Guardar cambios'); await page.waitForTimeout(900);
    sch = await tool(page, pid, 'schedule'); const ag = await tool(page, pid, 'agile');
    const t3 = sch.tasks.find((t) => t.id === 't3');
    check('t3 desvinculada: release.taskId limpio y avance conservado', ag.releases.find((r) => r.id === 'r2').taskId === null && t3.releaseId === null && t3.progress === 63, [ag.releases.find((r) => r.id === 'r2').taskId, t3.releaseId, t3.progress]);
    check('t3: fila sin icono de release', (await page.$$('.sched-grid .sched-row[data-id="t3"] .sched-rel')).length === 0, null);

    /* --- arrastrar una barra iniciada desde el backlog explica el motivo --- */
    const bar = await (await page.$('.sched-body g.sched-bar[data-id="t4"] .sched-bar-main')).boundingBox();
    await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2); await page.mouse.down();
    await page.mouse.move(bar.x + bar.width / 2 + 60, bar.y + bar.height / 2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
    check('mover una actividad iniciada en el backlog: aviso propio', /su inicio real se calcula desde las iteraciones/.test(nb(await page.textContent('body'))), null);

    /* --- pestaña Actividades --- */
    await page.getByRole('tab', { name: /Actividades/ }).click(); await page.waitForTimeout(200);
    check('actividades: icono y avance de solo lectura', (await page.$$('table.sched-tbl tr[data-id="t4"] .sched-rel')).length === 1 && (await page.$$('table.sched-tbl tr[data-id="t4"] button[aria-label^="% de avance"]')).length === 0 && /38,2 %/.test(await page.textContent('table.sched-tbl tr[data-id="t4"]')), null);
    await page.getByRole('tab', { name: /Gantt/ }).click(); await page.waitForTimeout(200);

    /* --- solo lectura --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    await page.dblclick('.sched-grid .sched-row[data-id="t4"] [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    check('lectura: selector de release deshabilitado', await page.$eval('#te-rel', (s) => s.disabled), null);
    await page.click('.modal-foot >> text=Cerrar'); await page.waitForTimeout(100);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(150);

    /* --- eliminar una actividad que representa un release limpia release.taskId --- */
    await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: a.releases.map((r) => (r.id === 'r2' ? { ...r, taskId: 't5' } : r)) }); }, pid);
    await page.waitForTimeout(300);
    await page.dblclick('.sched-grid .sched-row[data-id="t5"] [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    await page.click('.modal-foot button:has-text("Eliminar")');
    await page.waitForSelector('[data-confirm-release]');
    check('eliminar: la confirmación avisa del release que representa', /representa el release «Release 2 · Facturación»/.test(nb(await page.textContent('[data-confirm-release]'))), null);
    await page.getByRole('button', { name: 'Eliminar actividad' }).click(); await page.waitForTimeout(900);
    sch = await tool(page, pid, 'schedule'); const ag5 = await tool(page, pid, 'agile');
    check('eliminar: actividad eliminada y release sin actividad vinculada', !sch.tasks.some((t) => t.id === 't5') && ag5.releases.find((r) => r.id === 'r2').taskId === null && ag5.releases.length === 2, ag5.releases.map((r) => [r.id, r.taskId]));

    /* --- diagrama de red --- */
    await gotoView(page, 'red'); await page.waitForSelector('.sched-net svg');
    check('red: marca de release en el nodo vinculado', (await page.$$('.sched-net g.sched-net-node[data-id="t4"] .sched-net-rel[data-release="r1"]')).length === 1 && (await page.$$('.sched-net g.sched-net-node[data-id="t3"] .sched-net-rel')).length === 0, null);
    const relBox = await page.$eval('.sched-net g.sched-net-node[data-id="t4"]', (g) => { const r = g.querySelector('rect').getBBox(); const b = g.querySelector('.sched-net-rel').getBBox(); return b.x >= 0 && b.x + b.width <= r.width && b.y >= 0 && b.y + b.height <= r.height; });
    check('red: la marca queda dentro del nodo', relBox, null);
    await shot(page, 'red-agil');

    const cards = await errorCards(page);
    check('C: sin tarjetas de error', !cards.length, cards);
    check('C: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN C', e); }
  finally { await browser.close(); }
}

/* =============================================================== E. Regresiones de la revisión: cronograma */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page);
    /* la primera iteración iniciada de r1 es la 2 (18 ago): inicio real calculado de t2 = 2026-08-18; t2 sin restricción */
    await page.evaluate(async (pid) => {
      const a = await PM.store.get(PM.paths.tool(pid, 'agile'));
      await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, sprints: a.sprints.map((s) => (s.id === 's1' ? { ...s, status: 'planeado' } : s)) });
      const s = await PM.store.get(PM.paths.tool(pid, 'schedule'));
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { ...s, tasks: s.tasks.map((t) => (t.id === 't2' ? { ...t, start: null } : t)) });
      PM.prefs.set('sched.tab', 'gantt'); PM.prefs.set('sched.group', false); PM.prefs.set('sched.cols', 'full');
    }, pid);
    await gotoView(page, 'cronograma'); await page.waitForSelector('.sched-row[data-id="t2"]');
    const rowT2 = '.sched-grid .sched-row[data-id="t2"]';
    const toasts = async () => nb(await page.textContent('.toasts').catch(() => ''));
    const clearToasts = () => page.evaluate(() => document.querySelectorAll('.toasts > *').forEach((t) => t.remove()));
    eq('t2 empieza en su inicio real calculado (18/08/26)', nb(await page.textContent(rowT2 + ' [data-col="start"]')), '18/08/26');

    /* --- 1. «No comenzar antes de» anterior al inicio real calculado: aviso en la celda del Gantt --- */
    await page.click(rowT2 + ' [data-col="start"] button.sched-cell');
    await page.fill(rowT2 + ' [data-col="start"] input', '2026-08-10'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    let tt = await toasts();
    check('Gantt: aviso del inicio real calculado desde las iteraciones', /no el 10 ago 2026: la actividad ya inició \(inicio real 18 ago 2026, calculado desde las iteraciones del release vinculado\)/.test(tt) && /no cambia el inicio/.test(tt), tt);
    await page.waitForTimeout(500);
    let sch = await tool(page, pid, 'schedule');
    eq('Gantt: la restricción queda guardada', sch.tasks.find((t) => t.id === 't2').start, '2026-08-10');
    eq('Gantt: la barra sigue en el inicio real', nb(await page.textContent(rowT2 + ' [data-col="start"]')), '18/08/26');
    await clearToasts();

    /* --- pestaña Actividades --- */
    await page.getByRole('tab', { name: /Actividades/ }).click(); await page.waitForTimeout(200);
    await page.click('table.sched-tbl tr[data-id="t2"] button[aria-label^="No comenzar antes de"]');
    await page.fill('table.sched-tbl tr[data-id="t2"] .sched-edit input', '2026-08-11'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    tt = await toasts();
    check('Actividades: el mismo aviso', /no el 11 ago 2026: la actividad ya inició .*calculado desde las iteraciones/.test(tt), tt);
    await clearToasts();
    await page.getByRole('tab', { name: /Gantt/ }).click(); await page.waitForTimeout(200);

    /* --- editor: pista en el campo y aviso al guardar --- */
    await page.dblclick(rowT2 + ' [data-col="num"]'); await page.waitForSelector('.modal #te-start');
    check('editor: la restricción explica que la actividad ya inició', /ya inició según las iteraciones del release \(18 ago 2026\): esta restricción no cambia su inicio/.test(nb(await page.textContent('.modal'))), null);
    await page.fill('#te-start', '2026-08-12');
    await page.click('.modal-foot >> text=Guardar cambios'); await page.waitForTimeout(600);
    tt = await toasts();
    check('editor: aviso al guardar', /no el 12 ago 2026: la actividad ya inició .*calculado desde las iteraciones/.test(tt), tt);
    await clearToasts();

    /* --- inicio real guardado y restricción posterior: también se explica --- */
    const rowT1 = '.sched-grid .sched-row[data-id="t1"]';
    await page.click(rowT1 + ' [data-col="start"] button.sched-cell');
    await page.fill(rowT1 + ' [data-col="start"] input', '2026-08-20'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    tt = await toasts();
    check('inicio real guardado: aviso aunque la restricción sea posterior', /no el 20 ago 2026: la actividad tiene inicio real \(0?3 ago 2026\)\. Cambia el inicio real en el editor/.test(tt), tt);
    await clearToasts();

    /* --- 2. dos releases con la misma actividad: gana el último, como en el núcleo --- */
    await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: a.releases.map((r) => ({ ...r, taskId: 't3' })) }); }, pid);
    await page.waitForTimeout(350);
    const rowT3 = '.sched-grid .sched-row[data-id="t3"]';
    eq('misma actividad en dos releases: avance del último (62,5 %)', nb(await page.textContent(rowT3 + ' [data-col="pct"]')), '62,5 %');
    check('el icono nombra el mismo release que el avance', /Release vinculado: Release 2 · Facturación/.test(await page.$eval(rowT3 + ' .sched-rel title', (t) => t.textContent)), await page.$eval(rowT3 + ' .sched-rel title', (t) => t.textContent));
    await page.dblclick(rowT3 + ' [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    eq('el editor muestra el mismo release', await page.$eval('#te-rel', (s) => s.value), 'r2');
    check('la nota habla del mismo release', /backlog del release «Release 2 · Facturación»: 62,5 %/.test(nb(await page.textContent('[data-agile-note]'))), nb(await page.textContent('[data-agile-note]')));
    await page.click('.modal-foot >> text=Cancelar'); await page.waitForTimeout(150);

    /* --- 3. dos actividades con el mismo task.releaseId: el aviso se cumple al guardar --- */
    await page.evaluate(async (pid) => {
      const a = await PM.store.get(PM.paths.tool(pid, 'agile'));
      await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: a.releases.map((r) => ({ ...r, taskId: null })) });
      const s = await PM.store.get(PM.paths.tool(pid, 'schedule'));
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { ...s, tasks: s.tasks.map((t) => (t.id === 't4' ? { ...t, releaseId: 'r1' } : t)) });
    }, pid);
    await page.waitForTimeout(350);
    const rowT4 = '.sched-grid .sched-row[data-id="t4"]';
    eq('datos inconsistentes: las dos actividades toman el avance de r1', [nb(await page.textContent(rowT2 + ' [data-col="pct"]')), nb(await page.textContent(rowT4 + ' [data-col="pct"]'))], ['38,2 %', '38,2 %']);
    await page.dblclick(rowT2 + ' [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    check('editor de la primera actividad: avisa que quita el vínculo de la otra', /Al guardar se quita el vínculo de «Desarrollo de la facturación»: un release se representa con una sola actividad/.test(nb(await page.textContent('.modal'))), nb(await page.textContent('.modal .field-hint')));
    await page.click('.modal-foot >> text=Guardar cambios'); await page.waitForTimeout(800);
    sch = await tool(page, pid, 'schedule');
    check('al guardar se cumple: t2 con r1 y t4 sin vínculo (avance guardado intacto)', sch.tasks.find((t) => t.id === 't2').releaseId === 'r1' && sch.tasks.find((t) => t.id === 't4').releaseId === null && sch.tasks.find((t) => t.id === 't4').progress === 10, sch.tasks.map((t) => [t.id, t.releaseId, t.progress]));
    tt = await toasts();
    check('aviso: sigue representando el release y se quitó el vínculo de la otra', /sigue representando el release «Release 1 · Inventario»\. Se quitó el vínculo de «Desarrollo de la facturación»/.test(tt), tt);
    eq('t4 vuelve a registrar su avance en el cronograma', nb(await page.textContent(rowT4 + ' [data-col="pct"]')), '10 %');
    check('t4 sin icono de release', (await page.$$(rowT4 + ' .sched-rel')).length === 0, null);
    await clearToasts();

    /* --- 6. «Eliminar» de la barra del Gantt usa los datos ágiles vivos (cambios durante la confirmación) --- */
    await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: a.releases.map((r) => (r.id === 'r2' ? { ...r, taskId: 't5' } : r)) }); }, pid);
    await page.waitForTimeout(300);
    await page.click('.sched-grid .sched-row[data-id="t5"] [data-col="num"]'); await page.waitForTimeout(100);
    await page.locator('.sched-tools').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.waitForSelector('[data-confirm-release]');
    await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); await PM.store.set(PM.paths.tool(pid, 'agile'), { ...a, releases: [...a.releases, { id: 'r3', name: 'Release 3 · Reportes', goal: '', start: '2026-11-23', end: '2026-12-18', status: 'planeado', budget: 0, plannedSprints: 0, wbsId: null, taskId: null, baseline: null, notes: '' }] }); }, pid);
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Eliminar actividad' }).click(); await page.waitForTimeout(900);
    const agE = await tool(page, pid, 'agile'); sch = await tool(page, pid, 'schedule');
    check('Gantt: eliminar conserva el release creado durante la confirmación', agE.releases.length === 3 && agE.releases.some((r) => r.id === 'r3') && agE.releases.find((r) => r.id === 'r2').taskId === null && !sch.tasks.some((t) => t.id === 't5'), agE.releases.map((r) => [r.id, r.taskId]));

    /* --- 8. leyenda del diagrama de red --- */
    await gotoView(page, 'red'); await page.waitForSelector('.sched-net svg');
    check('red: la leyenda explica la marca de release', await page.isVisible('.legend [data-legend="release"]') && /Release vinculado \(avance desde el backlog\)/.test(nb(await page.textContent('.legend [data-legend="release"]'))) && (await page.$$('.legend [data-legend="release"] svg')).length === 1, null);

    const cards = await errorCards(page);
    check('E: sin tarjetas de error', !cards.length, cards);
    check('E: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN E', e); }
  finally { await browser.close(); }
}

/* =============================================================== F. Regresiones de la revisión: EDT */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    /* el backlog del proyecto se retiene sin cargar hasta liberarlo (como cuando llega después de la EDT en modo db) */
    await page.evaluate(() => {
      window.__hold = true; window.__held = [];
      const orig = PM.store.subCol;
      PM.store.subCol = function (path, next, err) {
        if (!/\/backlog$/.test(String(path))) return orig.call(this, path, next, err);
        return orig.call(this, path, (d) => { if (window.__hold) window.__held.push(() => next(d)); else next(d); }, err);
      };
    });
    const pid = await seed(page);
    await page.evaluate(async (pid) => {
      const w = await PM.store.get(PM.paths.tool(pid, 'wbs'));
      await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [
        ...w.nodes.map((n) => (n.id === 'w21' ? { ...n, approach: 'adaptativo' } : n)),
        { id: 'w211', parentId: 'w21', name: 'Bodega central', order: 1 },
        { id: 'w23', parentId: 'w2', name: '', order: 3 },
        { id: 'w24', parentId: 'w2', name: '', order: 4 },
      ] });
      await PM.store.set(PM.paths.backlogItem(pid, 'e2'), { code: 'EP-002', type: 'epica', title: 'Épica del entregable nuevo', estimate: null, priority: 'Debe tener', rank: 50, status: 'backlog', wbsId: 'w23', releaseId: null, sprintId: null, epicId: null, history: [], createdAt: '2026-08-01' });
      if (!PM.getView('backlog')) PM.registerView({ id: 'backlog', label: 'Backlog del producto', group: 'agil', icon: 'backlog', order: 10, needsProject: true, component: ({ params }) => PM.lib.html`<div class="page" data-stub-backlog>${(params && params.wbs) || ''}</div>` });
    }, pid);
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-code="1.2.4"]');
    const toasts = async () => nb(await page.textContent('.toasts').catch(() => ''));
    const codes = () => page.$$eval('tr[data-wbs-row]', (trs) => trs.map((r) => r.dataset.code));
    const rowIds = () => page.$$eval('tr[data-wbs-row]', (trs) => trs.map((r) => r.dataset.wbsRow));

    /* --- 4. enfoque propio igual al del padre: distintivo lleno, sin «heredado de» --- */
    const bInfo = await page.$$eval('tr[data-wbs-row]', (trs) => Object.fromEntries(trs.filter((r) => r.querySelector('.wbs-ap')).map((r) => { const b = r.querySelector('.wbs-ap'); return [r.dataset.code, [b.classList.contains('is-inh'), b.title]]; })));
    check('1.2.1 con enfoque propio: distintivo lleno y sin «heredado de»', bInfo['1.2.1'] && bInfo['1.2.1'][0] === false && !/heredado/.test(bInfo['1.2.1'][1]), bInfo['1.2.1']);
    check('1.2.1.1 hereda de 1.2.1 (el ancestro que fija el enfoque)', bInfo['1.2.1.1'] && bInfo['1.2.1.1'][0] === true && /heredado de 1\.2\.1$/.test(bInfo['1.2.1.1'][1]), bInfo['1.2.1.1']);
    check('1.2.2 sigue heredando de 1.2', bInfo['1.2.2'] && bInfo['1.2.2'][0] === true && /heredado de 1\.2$/.test(bInfo['1.2.2'][1]), bInfo['1.2.2']);
    await page.click('tr[data-code="1.2.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    eq('el selector del mismo nodo coincide (enfoque propio)', await page.$eval('#wbs-f-approach', (s) => s.value), 'adaptativo');

    /* --- 5. mientras carga el backlog no se elimina (la confirmación no podría avisar ni limpiar vínculos) --- */
    check('el backlog sigue cargando (retenido)', await page.evaluate(() => window.__held.length > 0), null);
    await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Eliminar elemento' }).click(); await page.waitForTimeout(300);
    check('eliminar mientras carga: aviso y sin confirmación', /Aún se están cargando el cronograma, los costos o los datos ágiles/.test(await toasts()) && (await page.$$('.modal')).length === 0, await toasts());
    check('eliminar mientras carga: la EDT no cambia', (await tool(page, pid, 'wbs')).nodes.length === 12, (await tool(page, pid, 'wbs')).nodes.length);
    await page.click('tr[data-wbs-row="w24"] [data-wbs-name]'); await page.waitForSelector('tr[data-wbs-row="w24"] [data-wbs-input]');
    await page.keyboard.press('Backspace'); await page.waitForTimeout(900);
    check('Retroceso mientras carga: el elemento vacío se conserva', (await rowIds()).includes('w24') && (await tool(page, pid, 'wbs')).nodes.some((n) => n.id === 'w24'), await codes());
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);

    /* liberar el backlog */
    await page.evaluate(() => { window.__hold = false; window.__held.splice(0).forEach((f) => f()); });
    await page.waitForTimeout(400);
    await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForSelector('aside.wbs-panel [data-wbs-backlog-stats]');

    /* --- 7. Retroceso no elimina un elemento vacío al que apunta una épica --- */
    await page.click('tr[data-wbs-row="w23"] [data-wbs-name]'); await page.waitForSelector('tr[data-wbs-row="w23"] [data-wbs-input]');
    await page.keyboard.press('Backspace'); await page.waitForTimeout(900);
    check('Retroceso: se conserva el elemento al que apunta una épica', (await rowIds()).includes('w23') && (await tool(page, pid, 'wbs')).nodes.some((n) => n.id === 'w23'), await rowIds());
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    if ((await rowIds()).includes('w24')) {
      await page.click('tr[data-wbs-row="w24"] [data-wbs-name]'); await page.waitForSelector('tr[data-wbs-row="w24"] [data-wbs-input]');
      await page.keyboard.press('Backspace'); await page.waitForTimeout(900);
    }
    check('Retroceso (control): elimina el elemento vacío sin vínculos', !(await rowIds()).includes('w24') && !(await tool(page, pid, 'wbs')).nodes.some((n) => n.id === 'w24'), await rowIds());

    /* eliminar 1.2.3 con el botón: avisa de la épica y le quita el entregable */
    await page.click('tr[data-wbs-row="w23"] .wbs-code-btn'); await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Eliminar elemento' }).click(); await page.waitForSelector('.modal [data-wbs-confirm-items]', { timeout: 5000 });
    check('eliminar ya cargado: la confirmación avisa de la épica', /1 elemento del backlog quedará sin entregable de la EDT \(EP-002\)/.test(nb(await page.textContent('.modal [data-wbs-confirm-items]'))), nb(await page.textContent('.modal')));
    await page.click('.modal-foot >> text=Eliminar elemento'); await page.waitForTimeout(900);
    const e2 = await backlogItem(page, pid, 'e2');
    check('la épica queda sin entregable (sin wbsId huérfano)', e2 && e2.wbsId === null && e2.type === 'epica', e2);

    /* --- 9. «Ir al backlog»: indica cómo ver solo el entregable --- */
    await page.click('tr[data-code="1.2.1"] .wbs-code-btn'); await page.waitForTimeout(150);
    const goTxt = nb(await page.textContent('aside.wbs-panel [data-wbs-goto-backlog] .xsmall'));
    check('«Ir al backlog» explica el filtro por entregable', goTxt === 'En el backlog, elige 1.2.1 en el filtro de entregables para ver solo sus elementos.', goTxt);
    await page.locator('aside.wbs-panel [data-wbs-goto-backlog]').getByRole('button', { name: 'Ir al backlog' }).click(); await page.waitForTimeout(250);
    const st = await state(page);
    check('«Ir al backlog» navega con el entregable', st.view === 'backlog' && st.params && st.params.wbs === 'w21', st);

    const cards = await errorCards(page);
    check('F: sin tarjetas de error', !cards.length, cards);
    check('F: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN F', e); }
  finally { await browser.close(); }
}

/* =============================================================== D. Tema oscuro, móvil 400 px, 1920 px y rendimiento (300+ elementos) */
for (const variant of [{ name: 'oscuro', dark: true, width: 1360 }, { name: 'movil', dark: false, width: 400 }, { name: 'ancho', dark: false, width: 1920 }]) {
  const { browser, page, errors } = await openApp({ file, width: variant.width, height: 900, dark: variant.dark });
  try {
    const pid = await seed(page);
    if (variant.name === 'ancho') {
      /* 320 elementos adicionales en el backlog del paquete 1.2.1 */
      await page.evaluate(async (pid) => { for (let k = 0; k < 320; k++) await PM.store.set(PM.paths.backlogItem(pid, 'x' + k), { code: 'HU-' + String(100 + k), type: k % 7 ? 'historia' : 'defecto', title: 'Elemento ' + k, estimate: (k % 5) + 1, priority: 'Podría tener', rank: 100000 + k, status: k % 3 ? 'backlog' : 'terminado', doneDate: k % 3 ? null : '2026-09-10', wbsId: k % 2 ? 'w21' : 'w22', releaseId: 'r1', sprintId: null, history: [], createdAt: '2026-08-01' }); }, pid);
    }
    await gotoView(page, 'edt'); await page.waitForSelector('tr[data-wbs-row]');
    if (variant.name === 'ancho') {
      const t0 = Date.now();
      await page.click('tr[data-code="1.2"] .wbs-code-btn'); await page.waitForSelector('aside.wbs-panel [data-wbs-backlog-stats]');
      const dt = Date.now() - t0;
      const s = nb(await page.textContent('aside.wbs-panel [data-wbs-backlog-stats]'));
      check('rendimiento: panel con 328 elementos en la rama en menos de 1,5 s', dt < 1500 && /328 elementos/.test(s), { dt, s });
      const t1 = Date.now();
      await page.selectOption('#wbs-f-approach', 'predictivo'); await page.waitForTimeout(50);
      await page.waitForFunction(() => !document.querySelector('tr[data-code="1.2"] .wbs-ap'));
      check('rendimiento: cambiar el enfoque con 330 elementos en menos de 1 s', Date.now() - t1 < 1000, Date.now() - t1);
      await page.selectOption('#wbs-f-approach', 'adaptativo'); await page.waitForTimeout(300);
      const pg = await page.evaluate(() => { const p = document.querySelector('.page'); return [p.getBoundingClientRect().width, document.documentElement.clientWidth]; });
      check('1920 px: la vista usa todo el ancho disponible', pg[0] > pg[1] - 420, pg);
    } else {
      await page.click('tr[data-code="1.2.1"] .wbs-code-btn'); await page.waitForTimeout(250);
    }
    await shot(page, 'edt-' + variant.name, variant.name !== 'ancho');
    check(variant.name + ': EDT sin desborde horizontal de la página', (await horizontalOverflow(page)) <= 0, await horizontalOverflow(page));
    if (variant.name === 'movil') {
      check('móvil: diccionario en modal con enfoque y backlog', await page.isVisible('.modal #wbs-f-approach-m') && await page.isVisible('.modal [data-wbs-backlog-stats]'), null);
      await page.click('.modal-foot >> text=Listo'); await page.waitForTimeout(150);
      for (const tab of ['Diccionario', 'Diagrama']) {
        await page.getByRole('tab', { name: new RegExp(tab) }).click(); await page.waitForTimeout(250);
        check('móvil: pestaña ' + tab + ' sin desborde horizontal de la página', (await horizontalOverflow(page)) <= 0, await horizontalOverflow(page));
        await shot(page, 'edt-movil-' + tab.toLowerCase());
      }
      await page.getByRole('tab', { name: /Árbol/ }).click(); await page.waitForTimeout(150);
    }
    if (variant.dark) {
      const colors = await page.$eval('tr[data-code="1.2"] .wbs-ap', (b) => { const cs = getComputedStyle(b); return [cs.color, cs.backgroundColor]; });
      check('oscuro: el distintivo usa tokens del tema', colors[0] !== colors[1] && colors[1] !== 'rgba(0, 0, 0, 0)', colors);
    }
    await page.evaluate(() => { PM.prefs.set('sched.tab', 'gantt'); });
    await gotoView(page, 'cronograma'); await page.waitForSelector('.sched-row[data-id="t2"]');
    await page.waitForTimeout(250);
    await shot(page, 'gantt-' + variant.name, variant.name !== 'ancho');
    check(variant.name + ': cronograma sin desborde horizontal de la página', (await horizontalOverflow(page)) <= 0, await horizontalOverflow(page));
    check(variant.name + ': iteraciones dibujadas', (await page.$$('.sched-body g.sched-bar[data-id="t2"] .sched-iter')).length === 3, null);
    await page.dblclick('.sched-grid .sched-row[data-id="t2"] [data-col="num"]'); await page.waitForSelector('.modal #te-rel');
    await shot(page, 'editor-' + variant.name, false);
    const modalOverflow = await page.$eval('.modal', (m) => m.scrollWidth - m.clientWidth);
    check(variant.name + ': editor sin desborde horizontal', modalOverflow <= 1, modalOverflow);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    const cards = await errorCards(page);
    check(variant.name + ': sin tarjetas de error', !cards.length, cards);
    check(variant.name + ': sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN D ' + variant.name, e); }
  finally { await browser.close(); }
}

console.log(`\n${total - fails}/${total} correctas`);
process.exit(fails ? 1 : 0);

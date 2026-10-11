// Integración ágil en el valor ganado (50-evm), la matriz RACI (70-matrices) y el tablero (80-dashboard),
// SPEC §9.3 y §9.4 «Integraciones».
// Uso: node test/agile-c2.test.mjs --file <ruta.html> [--shots dir]
//   (la página debe incluir 50, 70 y 80: node build.mjs --out /tmp/x.html --include 50,70,80)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

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
const elShot = async (page, sel, name) => { if (shots) await page.locator(sel).first().screenshot({ path: join(shots, name + '.png') }); };
async function section(name, fn) {
  try { await fn(); } catch (e) { fails++; total++; console.log('FAIL ' + name + ' (excepción)\n      ' + String((e && e.stack) || e).split('\n').slice(0, 6).join('\n      ')); }
}

/* ------------------------------------------------------------------ datos de prueba (proyecto híbrido, corte 8 sep 2026) */
const WBS = { nodes: [
  { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1 },
  { id: 'w11', parentId: 'w1', name: 'Planificación', order: 1 },
  { id: 'w2', parentId: null, name: 'Plataforma digital de alquiler', order: 2, approach: 'adaptativo' },
  { id: 'w21', parentId: 'w2', name: 'Módulo de inventario', order: 1 },
  { id: 'w22', parentId: 'w2', name: 'Módulo de facturación', order: 2 },
  { id: 'w3', parentId: null, name: 'Montaje en obra', order: 3 },
] };
const SCHEDULE = { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [
  { id: 't1', name: 'Plan del proyecto', wbsId: 'w11', duration: 5, milestone: false, start: '2026-08-03', deps: [], progress: 100, cost: 8000000, resources: [] },
  { id: 't2', name: 'Desarrollo del inventario', wbsId: 'w21', releaseId: 'r1', duration: 40, milestone: false, start: '2026-08-03', deps: [], progress: 0, cost: 90000000, resources: [] },
  { id: 't3', name: 'Montaje niveles 1 a 5', wbsId: 'w3', duration: 20, milestone: false, start: '2026-08-10', deps: [], progress: 30, cost: 30000000, resources: [] },
  { id: 't4', name: 'Desarrollo de la facturación', wbsId: 'w22', duration: 30, milestone: false, start: '2026-09-28', deps: [], progress: 0, cost: 70000000, resources: [] },
] };
const COSTS = { actuals: [
  { id: 'a1', date: '2026-08-20', amount: 30000000, taskId: null, wbsId: null, releaseId: 'r1', category: 'Mano de obra', description: 'Equipo de desarrollo agosto', document: 'NOM-08' },
  { id: 'a2', date: '2026-08-31', amount: 15000000, taskId: 't3', wbsId: 'w3', category: 'Mano de obra', description: 'Cuadrilla de montaje', document: 'NOM-08B' },
  { id: 'a3', date: '2026-09-02', amount: 10000000, taskId: 't2', wbsId: 'w21', category: 'Equipos', description: 'Licencias del inventario', document: 'FE-101' },
  { id: 'a4', date: '2026-09-05', amount: 5000000, taskId: null, wbsId: null, releaseId: 'r2', category: 'Otros', description: 'Asesoría de facturación electrónica', document: 'FE-102' },
], statusUpdates: [], reserves: { contingency: 0, management: 0 } };
const AGILE = {
  settings: { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, scopeChangeThreshold: 10, columns: [
    { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null }, { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 3 },
    { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 }, { id: 'terminado', name: 'Terminado', category: 'terminado', wip: null }] },
  releases: [
    { id: 'r1', name: 'Release 1 · Inventario', goal: 'Inventario en bodega y obra', start: '2026-08-03', end: '2026-09-25', status: 'en-curso', budget: 90000000, plannedSprints: 4, wbsId: 'w21', taskId: null,
      baseline: { date: '2026-07-31', points: 40, end: '2026-09-25', budget: 90000000, sprints: 4, changeRef: null }, notes: '' },
    { id: 'r2', name: 'Release 2 · Facturación', goal: 'Facturación electrónica', start: '2026-09-28', end: '2026-11-20', status: 'planeado', budget: 70000000, plannedSprints: 3, wbsId: null, taskId: null, baseline: null, notes: '' },
  ],
  sprints: [
    { id: 's1', name: 'Iteración 1', releaseId: 'r1', goal: 'Catálogo de equipos', start: '2026-08-03', end: '2026-08-14', status: 'cerrado', capacity: 10, committed: 8, completed: 8, docs: {} },
    { id: 's2', name: 'Iteración 2', releaseId: 'r1', goal: 'Remisiones de salida', start: '2026-08-18', end: '2026-08-31', status: 'cerrado', capacity: 10, committed: 8, completed: 5, docs: {} },
    { id: 's3', name: 'Iteración 3', releaseId: 'r1', goal: 'Devoluciones e inspección de retorno', start: '2026-09-01', end: '2026-09-14', status: 'en-curso', capacity: 24, committed: 23, completed: null, docs: {} },
    { id: 's4', name: 'Iteración 4', releaseId: 'r2', goal: '', start: '2026-09-28', end: '2026-10-09', status: 'planeado', capacity: 10, committed: null, completed: null, docs: {} },
  ],
};
const item = (id, code, title, estimate, extra) => ({ code, type: 'historia', title, description: '', acceptance: 'Criterio', estimate, priority: 'Debe tener', rank: Number(code.slice(3)) * 1000, status: 'backlog', wbsId: 'w21', releaseId: 'r1', sprintId: null, epicId: null, assignee: '', blocked: false, tags: [], createdAt: '2026-07-28', doneDate: null, history: [{ date: '2026-07-28', status: 'backlog' }], id, ...extra });
/* r1: 16 de 44 pts terminados (36,4 %); iteración 3: 23 pts, 3 terminados; 4 elementos en «En curso» (límite 3), 1 bloqueado */
const ITEMS = [
  item('e1', 'EP-001', 'Inventario', null, { type: 'epica' }),
  item('i1', 'HU-001', 'Catálogo de equipos', 5, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-12' }),
  item('i2', 'HU-002', 'Ubicaciones de bodega', 3, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-14' }),
  item('i3', 'HU-003', 'Remisión de salida', 5, { sprintId: 's2', status: 'terminado', doneDate: '2026-08-28' }),
  item('i4', 'HU-004', 'Devolución parcial', 8, { sprintId: 's3', status: 'en-curso' }),
  item('i5', 'HU-005', 'Inspección de retorno', 5, { sprintId: 's3', status: 'por-hacer' }),
  item('i6', 'HU-006', 'Faltantes y daños', 8, {}),
  item('i7', 'HU-007', 'Reporte de daños con fotos', 3, { sprintId: 's3', status: 'en-curso' }),
  item('i8', 'HU-008', 'Integración con la báscula de bodega', 2, { sprintId: 's3', status: 'en-curso', blocked: true, blockedReason: 'Falta el driver del proveedor' }),
  item('i9', 'HU-009', 'Alertas de vencimiento', 2, { sprintId: 's3', status: 'en-curso' }),
  item('i10', 'HU-010', 'Consulta de saldos por obra', 3, { sprintId: 's3', status: 'terminado', doneDate: '2026-09-03' }),
  item('j1', 'HU-020', 'Factura electrónica DIAN', 5, { wbsId: 'w22', releaseId: 'r2' }),
  item('j2', 'HU-021', 'Notas crédito', 3, { wbsId: 'w22', releaseId: 'r2' }),
];

const STUB_VIEWS = ['backlog', 'kanban', 'iteraciones', 'metricas-agiles'];
async function seed(page, meta = {}, opts = {}) {
  return page.evaluate(async ({ WBS, SCHEDULE, COSTS, AGILE, ITEMS, meta, opts, STUB_VIEWS }) => {
    const pid = await PM.projectOps.create({ name: 'Plataforma y montaje Torre 3', code: 'PRY-AG-002', start: '2026-08-03', end: '2026-12-18', budget: 300000000, currency: 'COP', status: 'En ejecución', lifecycle: 'Híbrido', statusDate: '2026-09-08', manager: 'Director de proyecto', sponsor: 'Gerencia General', ...meta });
    if (!opts.blank) {
      await PM.store.set(PM.paths.tool(pid, 'wbs'), WBS);
      await PM.store.set(PM.paths.tool(pid, 'schedule'), SCHEDULE);
      await PM.store.set(PM.paths.tool(pid, 'costs'), COSTS);
      await PM.store.set(PM.paths.tool(pid, 'agile'), opts.agile || AGILE);
      for (const it of opts.items || ITEMS) { const { id, ...body } = it; await PM.store.set(PM.paths.backlogItem(pid, id), body); }
    }
    /* la página de prueba (50,70,80) no incluye 45 ni 46: vistas mínimas para comprobar la navegación */
    for (const id of STUB_VIEWS) if (!PM.getView(id)) PM.registerView({ id, label: id, group: 'agil', icon: 'sprint', order: 90, needsProject: true, hidden: true, component: ({ params }) => PM.lib.html`<div class="page" data-stub=${id}>${JSON.stringify(params || {})}</div>` });
    PM.selectProject(pid, 'tablero');
    return pid;
  }, { WBS, SCHEDULE, COSTS, AGILE, ITEMS, meta, opts, STUB_VIEWS });
}
const tool = (page, pid, id) => page.evaluate(({ pid, id }) => PM.store.get(PM.paths.tool(pid, id)), { pid, id });
const state = (page) => page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
const stubDownloads = (page) => page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data: String(data) }); return true; }; });
const lastToast = (page) => page.evaluate(() => { const t = [...document.querySelectorAll('.toast')]; return t.length ? t[t.length - 1].textContent.trim() : ''; });
/* valores esperados con el núcleo (PM.calc / PM.agile) sobre los mismos datos */
const expectedEvm = (page, pid) => page.evaluate(async (pid) => {
  const agile = await PM.store.get(PM.paths.tool(pid, 'agile'));
  const costs = await PM.store.get(PM.paths.tool(pid, 'costs'));
  const wbs = await PM.store.get(PM.paths.tool(pid, 'wbs'));
  const list = await PM.store.list(PM.paths.backlog(pid));
  const items = list.map((d) => ({ ...d.data, id: d.id }));
  const tree = PM.calc.wbsTree(wbs.nodes);
  const settings = PM.agile.settings(agile);
  const out = {};
  for (const r of agile.releases) {
    const ac = PM.agile.releaseActualCost(r, costs, tree, '2026-09-08');
    const e = PM.calc.agileEvm({ release: r, sprints: agile.sprints, items, settings, actualCost: ac, statusDate: '2026-09-08' });
    out[r.id] = { bac: PM.fmt.moneyShort(e.bac, 'COP'), pv: PM.fmt.moneyShort(e.pv, 'COP'), ev: PM.fmt.moneyShort(e.ev, 'COP'), ac: PM.fmt.moneyShort(e.ac, 'COP'), spi: e.spi === null ? '—' : PM.fmt.idx(e.spi), cpi: e.cpi === null ? '—' : PM.fmt.idx(e.cpi), ppc: PM.fmt.pct(e.ppc, 1), apc: PM.fmt.pct(e.apc, 1), iter: e.sprintsElapsed + ' / ' + e.plannedSprints, raw: e };
  }
  return out;
}, pid);

/* =============================================================== A. valor ganado: release en costos reales y AgileEVM */
await section('A. valor ganado', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => PM.navigate('valor-ganado', { tab: 'reales' }));
    await page.waitForSelector('[data-role="actuals"] table');

    /* --- costos reales: columna «Release» --- */
    const heads = await page.$$eval('[data-role="actuals"] thead th', (ths) => ths.map((t) => t.textContent.trim()));
    check('costos reales: columna «Release» después de «Actividad»', heads[1] === 'Actividad' && heads[2] === 'Release', heads);
    eq('release de cada registro (selector)', await page.$$eval('[data-role="actuals"] tbody tr[data-actual] select[data-field="releaseId"]', (ss) => ss.map((s) => [s.closest('tr').dataset.actual, s.value])), [['a1', 'r1'], ['a2', ''], ['a3', ''], ['a4', 'r2']]);
    check('el selector tiene nombre accesible', await page.$eval('tr[data-actual="a2"] select[data-field="releaseId"]', (s) => /^Release — registro del/.test(s.getAttribute('aria-label'))), null);
    eq('opciones del selector', await page.$eval('tr[data-actual="a2"] select[data-field="releaseId"]', (s) => [...s.options].map((o) => o.textContent.trim())), ['Sin release', 'Release 1 · Inventario', 'Release 2 · Facturación']);
    /* imputar con el teclado: foco en el selector y flecha abajo */
    await page.focus('tr[data-actual="a2"] select[data-field="releaseId"]');
    await page.selectOption('tr[data-actual="a2"] select[data-field="releaseId"]', 'r2');
    await page.waitForTimeout(900);
    let costs = await tool(page, pid, 'costs');
    eq('release guardado en el registro (actual.releaseId)', costs.actuals.find((a) => a.id === 'a2').releaseId, 'r2');
    check('el resto del registro no cambia', costs.actuals.find((a) => a.id === 'a2').amount === 15000000 && costs.actuals.find((a) => a.id === 'a2').taskId === 't3', costs.actuals.find((a) => a.id === 'a2'));
    await page.selectOption('tr[data-actual="a2"] select[data-field="releaseId"]', '');
    await page.waitForTimeout(900);
    costs = await tool(page, pid, 'costs');
    eq('«Sin release» guarda null', costs.actuals.find((a) => a.id === 'a2').releaseId, null);
    /* filtro por release y alta con el filtro activo */
    await page.selectOption('[data-role="release-filter"]', 'r1');
    await page.waitForTimeout(150);
    eq('filtro por release', await page.$$eval('[data-role="actuals"] tbody tr[data-actual]', (trs) => trs.map((t) => t.dataset.actual)), ['a1']);
    await page.getByRole('button', { name: 'Agregar costo real' }).first().click();
    await page.waitForTimeout(900);
    costs = await tool(page, pid, 'costs');
    const added = costs.actuals.find((a) => !['a1', 'a2', 'a3', 'a4'].includes(a.id));
    check('alta con el filtro de un release: el registro nuevo queda imputado a ese release', added && added.releaseId === 'r1' && added.date === '2026-09-08', added);
    check('la fila nueva queda visible con el filtro y el foco en la descripción', await page.evaluate((id) => document.activeElement && document.activeElement.closest('tr') && document.activeElement.closest('tr').dataset.actual === id, added.id), null);
    await page.getByRole('button', { name: 'Quitar filtros' }).click();
    await page.click(`tr[data-actual="${added.id}"] button[aria-label^="Eliminar"]`);
    await page.waitForTimeout(800);
    check('el registro vacío se elimina sin confirmación', !(await tool(page, pid, 'costs')).actuals.some((a) => a.id === added.id), null);
    check('aviso de cómo se imputa el costo a un release', /imputa el costo a un release/.test(nb(await page.textContent('[data-role="release-hint"]'))), null);
    await stubDownloads(page);
    await page.locator('[data-role="actuals"]').getByRole('button', { name: 'Exportar CSV' }).first().click();
    await page.waitForTimeout(100);
    const csv = (await page.evaluate(() => window.__dl)).pop();
    check('CSV de costos reales con la columna Release', csv && /;Release;|,Release,/.test(csv.data.split('\n')[0]) && /Release 1 · Inventario/.test(csv.data), csv && csv.data.split('\n')[0]);
    await shot(page, 'evm-reales-release');

    /* --- solo lectura: el release en texto --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(200);
    check('lectura: sin selectores de release', (await page.$$('[data-role="actuals"] select[data-field="releaseId"]')).length === 0, null);
    eq('lectura: release en texto', nb(await page.textContent('tr[data-actual="a1"] td[data-field="releaseId"]')), 'Release 1 · Inventario');
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(200);

    /* --- pestaña «Valor ganado ágil» --- */
    const tabs = await page.$$eval('[role="tab"]', (ts) => ts.map((t) => t.textContent.trim()));
    check('pestaña «Valor ganado ágil» con el número de releases', tabs.some((t) => /^Valor ganado ágil\s*2$/.test(t)), tabs);
    await page.getByRole('tab', { name: /Valor ganado ágil/ }).click();
    await page.waitForSelector('[data-role="agile-evm-table"]');
    const exp = await expectedEvm(page, pid);
    const row = async (rid) => page.$eval(`[data-role="agile-evm-table"] tr[data-release="${rid}"]`, (tr) => Object.fromEntries([...tr.querySelectorAll('td[data-col]')].map((td) => [td.dataset.col, [...td.childNodes].map((n) => n.textContent).join(' ').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()])));
    const r1 = await row('r1');
    eq('r1: BAC, PV, EV y AC como PM.calc.agileEvm (AC con releaseActualCost)', [r1.bac, r1.pv, r1.ev, r1.ac].map(nb), [exp.r1.bac, exp.r1.pv, exp.r1.ev, exp.r1.ac].map(nb));
    eq('r1: PPC con iteraciones transcurridas / planeadas, y APC', [r1.ppc, r1.apc].map(nb), [nb(exp.r1.ppc) + ' 2 / 4 iter.', '36,4 %']);
    check('r1: PPC = 2 / 4 iteraciones', Math.abs(exp.r1.raw.ppc - 0.5) < 1e-9, exp.r1.raw.ppc);
    eq('r1: SPI y CPI', [r1.spi, r1.cpi].map(nb), [exp.r1.spi, exp.r1.cpi].map(nb));
    check('r1: AC = 30 M (release) + 10 M (actividad del entregable w21)', Math.round(exp.r1.raw.ac) === 40000000, exp.r1.raw.ac);
    const r2 = await row('r2');
    check('r2: sin iteraciones transcurridas (SPI —) y AC 5 M imputado', nb(r2.spi) === '—' && Math.round(exp.r2.raw.ac) === 5000000 && nb(r2.ac) === nb(exp.r2.ac), r2);
    check('alcance del release en la fila', /16 de 44 pts terminados/.test(nb(await page.textContent('tr[data-release="r1"] [data-role="release-scope"]'))), null);
    check('fila de totales', /Total de los releases/.test(await page.textContent('[data-role="agile-totals"]')), null);
    const tilesTxt = nb(await page.textContent('[data-role="agile-tiles"]'));
    check('indicadores totales (BAC 160 M)', /Presupuesto de los releases/.test(tilesTxt) && tilesTxt.includes(nb(await page.evaluate(() => PM.fmt.moneyShort(160000000, 'COP')))), tilesTxt);
    /* nota: la curva S ya incluye los releases vinculados; diferencia entre métodos */
    const incl = nb(await page.textContent('[data-note="incluido"]'));
    check('nota: la curva S ya incluye el release vinculado (agileDerived)', /ya incluye el avance de un release vinculado/.test(incl) && /Release 1 · Inventario/.test(incl) && /Desarrollo del inventario/.test(incl), incl);
    check('nota: release sin vincular', /Release 2 · Facturación/.test(nb(await page.textContent('[data-note="sin-vinculo"]'))), null);
    check('nota: diferencia entre métodos', /PPC = transcurridas \/ planeadas/.test(nb(await page.textContent('[data-note="metodos"]'))) && /fechas en el cronograma/.test(nb(await page.textContent('[data-note="metodos"]'))), null);
    check('nota: costos reales de los releases', /No sumes el AgileEVM/.test(nb(await page.textContent('[data-note="costos"]'))), null);
    /* vínculo con la curva S: la actividad t2 con el avance del backlog */
    const link = nb(await page.textContent('[data-role="agile-link-table"] tr[data-link="r1"]'));
    check('vínculo: actividad con avance desde el backlog (36,4 %)', /Desarrollo del inventario/.test(link) && /Avance desde el backlog/.test(link) && /36,4 %/.test(link), link);
    check('vínculo: r2 sin vincular', /Sin vincular/.test(nb(await page.textContent('[data-role="agile-link-table"] tr[data-link="r2"]'))), null);
    await page.getByRole('button', { name: 'Exportar CSV' }).first().click(); await page.waitForTimeout(100);
    const csv2 = (await page.evaluate(() => window.__dl)).pop();
    check('CSV del valor ganado ágil', csv2 && /valor-ganado-agil/.test(csv2.name) && /PPC \(%\)/.test(csv2.data) && /Total de los releases/.test(csv2.data), csv2 && csv2.name);
    /* valores completos */
    await page.getByRole('button', { name: 'Valores completos' }).click(); await page.waitForTimeout(150);
    check('valores completos en la tabla', /\$\s?90\.000\.000/.test(nb(await page.textContent('tr[data-release="r1"] td[data-col="bac"]'))), nb(await page.textContent('tr[data-release="r1"] td[data-col="bac"]')));
    await page.getByRole('button', { name: 'En millones' }).click(); await page.waitForTimeout(100);
    await shot(page, 'evm-agil');
    await elShot(page, '[data-role="agile-evm"]', 'el-evm-agil');

    /* --- curva S: aviso de actividades con avance del backlog --- */
    await page.getByRole('tab', { name: /^Curva S/ }).click(); await page.waitForTimeout(250);
    check('curva S: aviso del avance derivado del backlog', /1 actividad vinculada a un release/.test(nb(await page.textContent('[data-role="agile-derived-hint"]'))), null);
    await page.locator('[data-role="agile-derived-hint"]').getByRole('button', { name: 'Ver valor ganado ágil' }).click(); await page.waitForTimeout(200);
    check('el aviso abre la pestaña ágil', (await page.getAttribute('[role="tabpanel"]', 'data-tab')) === 'agil', null);

    /* --- avance: la actividad vinculada no se edita y el corte congela el avance del backlog --- */
    await page.getByRole('tab', { name: /^Avance/ }).click(); await page.waitForSelector('[data-role="progress-table"]');
    check('avance: actividad vinculada sin campo de %', (await page.$$('tr[data-task="t2"] input[data-field="progress"]')).length === 0 && /36,4 %/.test(nb(await page.textContent('tr[data-task="t2"]'))) && /Avance desde el backlog/.test(nb(await page.textContent('tr[data-task="t2"]'))), nb(await page.textContent('tr[data-task="t2"]')));
    check('avance: las demás actividades sí se editan', (await page.$$('tr[data-task="t3"] input[data-field="progress"]')).length === 1, null);
    await page.getByRole('button', { name: 'Registrar corte de avance' }).click(); await page.waitForTimeout(900);
    costs = await tool(page, pid, 'costs');
    const cut = costs.statusUpdates[costs.statusUpdates.length - 1];
    check('el corte guarda el avance efectivo de la actividad vinculada (36,4 %)', cut && cut.progress.t2 === 36.4 && cut.progress.t3 === 30, cut);
    const sch = await tool(page, pid, 'schedule');
    eq('el cronograma guardado no cambia (avance 0 de t2)', sch.tasks.find((t) => t.id === 't2').progress, 0);

    /* --- tema oscuro y móvil --- */
    await page.getByRole('tab', { name: /Valor ganado ágil/ }).click(); await page.waitForTimeout(200);
    eq('sin tarjetas de error', await errorCards(page), []);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

await section('A2. valor ganado: predictivo sin capa ágil', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page, { lifecycle: 'Predictivo' }, { agile: { settings: {}, releases: [], sprints: [] }, items: [] });
    await page.evaluate(() => PM.prefs.set('evm.tab', 'agil'));
    await page.evaluate(() => PM.navigate('valor-ganado'));
    await page.waitForSelector('[role="tabpanel"]');
    check('predictivo: sin pestaña ágil', !(await page.$$eval('[role="tab"]', (ts) => ts.some((t) => /Valor ganado ágil/.test(t.textContent)))), null);
    eq('predictivo: la preferencia «agil» vuelve a la curva S', await page.getAttribute('[role="tabpanel"]', 'data-tab'), 'curva');
    await page.getByRole('tab', { name: /Costos reales/ }).click(); await page.waitForTimeout(200);
    /* a4 conserva releaseId de datos anteriores: la columna aparece aunque el proyecto sea predictivo */
    const heads = await page.$$eval('[data-role="actuals"] thead th', (ths) => ths.map((t) => t.textContent.trim()));
    check('predictivo con registros que ya tienen release: columna visible', heads.includes('Release'), heads);
    await page.evaluate(async (pid) => { const c = await PM.store.get(PM.paths.tool(pid, 'costs')); await PM.store.set(PM.paths.tool(pid, 'costs'), { ...c, actuals: c.actuals.map(({ releaseId, ...a }) => a) }); }, pid);
    await page.waitForTimeout(500);
    const heads2 = await page.$$eval('[data-role="actuals"] thead th', (ths) => ths.map((t) => t.textContent.trim()));
    check('predictivo sin releases: sin columna «Release»', !heads2.includes('Release'), heads2);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

/* =============================================================== B. RACI: roles y eventos ágiles */
const raciData = (page, pid) => tool(page, pid, 'raci');
const raciCellMap = (raci) => {
  const roleName = Object.fromEntries((raci.roles || []).map((r) => [r.id, r.name]));
  return Object.fromEntries((raci.rows || []).map((r) => [r.activity, Object.fromEntries(Object.entries(r.cells || {}).map(([k, v]) => [roleName[k], v]))]));
};
await section('B. RACI', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page, {}, { blank: true });
    await gotoView(page, 'raci');
    await page.waitForSelector('.empty');
    check('matriz vacía: botones ágiles en el estado inicial', await page.getByRole('button', { name: 'Agregar roles ágiles' }).count() === 1 && await page.getByRole('button', { name: 'Agregar eventos ágiles' }).count() === 1, null);
    await page.getByRole('button', { name: 'Agregar roles ágiles' }).click();
    await page.waitForTimeout(800);
    let raci = await raciData(page, pid);
    eq('roles ágiles agregados (PM.AGILE.ROLES)', raci.roles.map((r) => r.name), ['Dueño del producto', 'Scrum Master / facilitador', 'Equipo de desarrollo']);
    check('aviso de roles agregados', /roles ágiles agregados/.test(await lastToast(page)), await lastToast(page));
    /* segunda vez: no duplica */
    await page.getByRole('button', { name: 'Agregar roles ágiles' }).click();
    await page.waitForTimeout(700);
    raci = await raciData(page, pid);
    check('sin duplicar roles', raci.roles.length === 3 && /ya están en la matriz/.test(await lastToast(page)), [raci.roles.length, await lastToast(page)]);
    /* rol «Director de proyecto» existente (se reutiliza) */
    await page.evaluate(async (pid) => { const r = await PM.store.get(PM.paths.tool(pid, 'raci')); await PM.store.set(PM.paths.tool(pid, 'raci'), { ...r, roles: [...r.roles, { id: 'rol-dp', name: 'Director de proyecto' }] }); }, pid);
    await page.waitForTimeout(400);

    /* --- eventos ágiles: modal con teclado --- */
    await page.getByRole('button', { name: 'Agregar eventos ágiles' }).click();
    await page.waitForSelector('.modal [data-role="agile-events"]');
    const evs = await page.$$eval('.modal [data-agile-event]', (ls) => ls.map((l) => l.dataset.agileEvent));
    eq('los 9 eventos ágiles', evs, ['Refinamiento del backlog', 'Priorización del backlog', 'Planificación de la iteración', 'Reunión diaria', 'Revisión de la iteración', 'Retrospectiva', 'Definición de terminado', 'Aceptación de historias de usuario', 'Planificación del release']);
    check('vista previa de la asignación con texto (no solo color)', /Dueño del producto/.test(nb(await page.textContent('.modal [data-agile-event="Priorización del backlog"]'))) && /Dueño del producto: Rinde cuentas/.test(nb(await page.textContent('.modal [data-agile-event="Priorización del backlog"] .sr-only'))), null);
    const otherLbl = nb(await page.textContent('.modal label.check'));
    check('ofrece agregar el patrocinador (el director ya está)', /el rol «Patrocinador»/.test(otherLbl), otherLbl);
    /* desmarcar «Reunión diaria» con el teclado */
    await page.focus('.modal [data-agile-event="Reunión diaria"] input');
    await page.keyboard.press('Space');
    check('botón con el número de eventos', await page.locator('.modal-foot').getByRole('button', { name: 'Agregar 8 eventos' }).count() === 1, null);
    await page.locator('.modal-foot').getByRole('button', { name: 'Agregar 8 eventos' }).click();
    await page.waitForTimeout(900);
    raci = await raciData(page, pid);
    eq('8 filas de eventos agregadas', raci.rows.map((r) => r.activity), ['Refinamiento del backlog', 'Priorización del backlog', 'Planificación de la iteración', 'Revisión de la iteración', 'Retrospectiva', 'Definición de terminado', 'Aceptación de historias de usuario', 'Planificación del release']);
    eq('roles: se agrega el patrocinador; el director se reutiliza', raci.roles.map((r) => r.name), ['Dueño del producto', 'Scrum Master / facilitador', 'Equipo de desarrollo', 'Director de proyecto', 'Patrocinador']);
    const cm = raciCellMap(raci);
    eq('priorización: dueño del producto A, facilitador R', cm['Priorización del backlog'], { 'Dueño del producto': 'A', 'Scrum Master / facilitador': 'R', 'Equipo de desarrollo': 'C', 'Director de proyecto': 'C' });
    eq('aceptación: dueño del producto A, equipo R', [cm['Aceptación de historias de usuario']['Dueño del producto'], cm['Aceptación de historias de usuario']['Equipo de desarrollo']], ['A', 'R']);
    eq('refinamiento: dueño del producto R (y rinde cuentas)', cm['Refinamiento del backlog']['Dueño del producto'], 'RA');
    eq('planificación de la iteración: equipo R', cm['Planificación de la iteración']['Equipo de desarrollo'], 'RA');
    eq('revisión: patrocinador I y director C', [cm['Revisión de la iteración'].Patrocinador, cm['Revisión de la iteración']['Director de proyecto']], ['I', 'C']);
    check('director de proyecto solo C o I', Object.values(cm).every((c) => !c['Director de proyecto'] || ['C', 'I'].includes(c['Director de proyecto'])), cm);
    /* regla de la matriz: un solo A y al menos un R por fila */
    const oneA = Object.values(cm).every((c) => Object.values(c).filter((v) => v === 'A' || v === 'RA').length === 1 && Object.values(c).some((v) => v === 'R' || v === 'RA'));
    check('cada fila: exactamente un A y al menos un R', oneA, cm);
    check('validación de la matriz sin observaciones', /Todas las filas tienen exactamente un A/.test(nb(await page.textContent('.page'))), null);
    eq('chips «Completa» en las 8 filas', await page.$$eval('.matrices-raci .chip-good', (c) => c.length), 8);
    await shot(page, 'raci-agil');

    /* --- segunda vez: solo la reunión diaria queda disponible --- */
    await page.getByRole('button', { name: 'Agregar eventos ágiles' }).click();
    await page.waitForSelector('.modal [data-role="agile-events"]');
    eq('eventos ya presentes marcados', await page.$$eval('.modal [data-agile-event].is-dup', (l) => l.length), 8);
    check('sin ofrecer roles que ya están', (await page.$$('.modal label.check')).length === 0, null);
    await page.locator('.modal-foot').getByRole('button', { name: 'Agregar 1 evento' }).click();
    await page.waitForTimeout(900);
    raci = await raciData(page, pid);
    check('9 filas sin duplicados', raci.rows.length === 9 && new Set(raci.rows.map((r) => r.activity)).size === 9, raci.rows.map((r) => r.activity));
    eq('reunión diaria: equipo R/A, facilitador R', [raciCellMap(raci)['Reunión diaria']['Equipo de desarrollo'], raciCellMap(raci)['Reunión diaria']['Scrum Master / facilitador']], ['RA', 'R']);
    await page.getByRole('button', { name: 'Agregar eventos ágiles' }).click();
    await page.waitForSelector('.modal [data-role="agile-events"]');
    check('todos presentes: el modal lo dice y solo ofrece cerrar', /Todos los eventos ágiles ya están en la matriz/.test(nb(await page.textContent('.modal'))) && await page.locator('.modal-foot button').count() === 1, null);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    check('Escape cierra el modal', (await page.$$('.modal')).length === 0, null);

    /* --- solo lectura: sin botones ágiles --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(200);
    check('lectura: sin botones ágiles', await page.getByRole('button', { name: 'Agregar roles ágiles' }).count() === 0 && await page.getByRole('button', { name: 'Agregar eventos ágiles' }).count() === 0, null);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(200);

    /* --- nombres habituales equivalentes: «Product Owner» y «Scrum Master» cuentan como presentes --- */
    const pid2 = await seed(page, { code: 'PRY-AG-003' }, { blank: true });
    await page.evaluate(async (pid) => { await PM.store.set(PM.paths.tool(pid, 'raci'), { roles: [{ id: 'x1', name: 'Product Owner' }, { id: 'x2', name: 'Scrum Master' }], rows: [{ id: 'y1', wbsId: null, activity: 'Retrospectiva', cells: {} }] }); }, pid2);
    await gotoView(page, 'raci'); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Agregar roles ágiles' }).click(); await page.waitForTimeout(800);
    raci = await raciData(page, pid2);
    eq('solo agrega el rol que falta', raci.roles.map((r) => r.name), ['Product Owner', 'Scrum Master', 'Equipo de desarrollo']);
    await page.getByRole('button', { name: 'Agregar eventos ágiles' }).click();
    await page.waitForSelector('.modal [data-role="agile-events"]');
    check('fila con el mismo nombre ya presente (no se duplica)', await page.$eval('.modal [data-agile-event="Retrospectiva"]', (l) => l.classList.contains('is-dup')), null);
    /* sin director ni patrocinador: desmarcar la casilla para no agregarlos */
    await page.locator('.modal label.check input').uncheck();
    await page.locator('.modal-foot').getByRole('button', { name: /^Agregar 8 eventos$/ }).click();
    await page.waitForTimeout(900);
    raci = await raciData(page, pid2);
    const cm2 = raciCellMap(raci);
    check('usa «Product Owner» como dueño del producto; sin director ni patrocinador', raci.roles.length === 3 && cm2['Priorización del backlog']['Product Owner'] === 'A' && cm2['Revisión de la iteración']['Scrum Master'] === 'R', cm2);
    check('la fila existente no cambia', raci.rows.filter((r) => r.activity === 'Retrospectiva').length === 1 && Object.keys(raci.rows.find((r) => r.id === 'y1').cells).length === 0, null);

    /* --- proyecto predictivo: sin botones ágiles --- */
    await seed(page, { code: 'PRY-PR-004', lifecycle: 'Predictivo' }, { blank: true });
    await gotoView(page, 'raci'); await page.waitForSelector('.empty');
    check('predictivo: sin botones ágiles', await page.getByRole('button', { name: 'Agregar roles ágiles' }).count() === 0, null);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

/* =============================================================== C. tablero: tarjeta ágil y ruta sugerida */
await section('C. tablero', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seed(page);
    await page.waitForSelector('[data-card="agile"]');
    const card = '[data-card="agile"]';
    eq('iteración actual', nb(await page.textContent(card + ' [data-agile-sprint-name]')), 'Iteración 3');
    check('objetivo de la iteración', /Devoluciones e inspección de retorno/.test(nb(await page.textContent(card + ' [data-agile="sprint"]'))), null);
    eq('días hábiles restantes (9, 10, 11 y 14 sep)', await page.getAttribute(card + ' [data-agile-left]', 'data-agile-left'), '4');
    check('burndown mínimo con ideal y restante', (await page.$$(card + ' svg[data-chart="burndown"] path[data-series="ideal"]')).length === 1 && (await page.$$(card + ' svg[data-chart="burndown"] path[data-series="restante"]')).length === 1, null);
    check('burndown accesible', /restan 20 pts/.test(await page.getAttribute(card + ' svg[data-chart="burndown"]', 'aria-label')), await page.getAttribute(card + ' svg[data-chart="burndown"]', 'aria-label'));
    eq('velocidad media (avg3) con unidad', nb(await page.textContent(card + ' [data-agile-velocity]')), '6,5 pts por iteración');
    eq('avance del release activo', nb(await page.textContent(card + ' [data-agile-progress]')), '16 pts de 44 pts');
    const exp = await expectedEvm(page, pid);
    eq('SPI y CPI ágiles del release activo', [nb(await page.textContent(card + ' [data-index="spi-agil"] .stat-value')), nb(await page.textContent(card + ' [data-index="cpi-agil"] .stat-value'))], [exp.r1.spi, exp.r1.cpi]);
    check('SPI ágil con texto, no solo color', /Atrasado|Al día|Adelantado/.test(nb(await page.textContent(card + ' [data-index="spi-agil"] .stat-sub'))), null);
    const fc = await page.evaluate(async (pid) => { const a = await PM.store.get(PM.paths.tool(pid, 'agile')); const list = await PM.store.list(PM.paths.backlog(pid)); const items = list.map((d) => ({ ...d.data, id: d.id })); const sch = await PM.store.get(PM.paths.tool(pid, 'schedule')); const cal = PM.calc.computeSchedule(sch, '2026-08-03').cal; return PM.calc.releaseForecast({ release: a.releases[0], sprints: a.sprints, items, settings: PM.agile.settings(a), cal, statusDate: '2026-09-08' }).finish; }, pid);
    check('pronóstico de terminación (PM.calc.releaseForecast)', (await page.getAttribute(card + ' [data-agile-forecast]', 'data-agile-forecast')) === fc && /después del fin del release/.test(nb(await page.textContent(card + ' [data-agile-forecast]'))), [fc, nb(await page.textContent(card + ' [data-agile-forecast]'))]);
    const wip = nb(await page.textContent(card + ' [data-agile-alert="wip"]'));
    check('alerta de WIP superado con texto', /Límite WIP superado en «En curso»: 4 elementos para un límite de 3/.test(wip), wip);
    const bl = nb(await page.textContent(card + ' [data-agile-alert="blocked"]'));
    check('alerta de elementos bloqueados', /1 elemento bloqueado: HU-008 Integración con la báscula/.test(bl), bl);
    check('alertas con icono y texto', await page.$eval(card + ' [data-agile-alert="wip"]', (li) => !!li.querySelector('svg.icon') && li.textContent.trim().length > 10), null);
    /* enlaces */
    for (const [label, view] of [['Backlog', 'backlog'], ['Kanban', 'kanban'], ['Iteraciones', 'iteraciones'], ['Métricas', 'metricas-agiles']]) {
      await page.locator(card + ' .dashboard-panel-actions').getByRole('button', { name: label, exact: true }).click();
      await page.waitForTimeout(150);
      check('enlace a ' + view, (await state(page)).view === view, await state(page));
      await gotoView(page, 'tablero'); await page.waitForSelector(card);
    }
    /* teclado: Tab llega al enlace del tablero Kanban de las alertas y Enter navega */
    await page.focus(card + ' [data-agile="alerts"] .dashboard-link');
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    eq('alerta → tablero Kanban con el teclado', (await state(page)).view, 'kanban');
    await gotoView(page, 'tablero'); await page.waitForSelector(card);
    await shot(page, 'tablero-agil');

    /* --- ruta sugerida híbrida --- */
    const btn = page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' });
    if (await btn.count()) await btn.click();
    await page.waitForSelector('.dashboard-step');
    const ids = await page.$$eval('.dashboard-step', (els) => els.map((e) => e.getAttribute('data-step')));
    eq('ruta híbrida: pasos ágiles después del alcance y en la ejecución', ids, ['acta', 'interesados', 'alcance', 'edt', 'enfoque', 'vision', 'backlog', 'terminado', 'releases', 'cronograma', 'presupuesto', 'riesgos', 'lineabase', 'linea-base-release', 'primera-iteracion', 'avance', 'revision-retro', 'informe', 'cambios', 'entregables', 'informe-final', 'acta-cierre']);
    const phases = await page.$$eval('[data-card="route"] [data-phase]', (els) => els.map((e) => e.getAttribute('data-phase') + ':' + e.querySelectorAll('.dashboard-step').length));
    eq('fases contiguas', phases, ['plan:14', 'control:8']);
    const st = await page.$$eval('.dashboard-step', (els) => Object.fromEntries(els.map((e) => [e.getAttribute('data-step'), e.getAttribute('data-state')])));
    eq('estados de los pasos ágiles detectados con los datos', ['enfoque', 'vision', 'backlog', 'terminado', 'releases', 'linea-base-release', 'primera-iteracion', 'revision-retro'].map((k) => st[k]), ['done', 'pending', 'done', 'pending', 'done', 'done', 'done', 'partial']);
    eq('enfoque: entregables adaptativos', nb(await page.textContent('.dashboard-step[data-step="enfoque"] .chip')), '1 entregable adaptativo');
    eq('backlog: elementos y estimación', nb(await page.textContent('.dashboard-step[data-step="backlog"] .chip')), '12 elementos · 52 pts');
    eq('línea base del release', nb(await page.textContent('.dashboard-step[data-step="linea-base-release"] .chip')), '1 de 2 releases con línea base');
    eq('revisión y retrospectiva', nb(await page.textContent('.dashboard-step[data-step="revision-retro"] .chip')), '0 de 2 iteraciones cerradas documentadas');
    check('chip del enfoque en la ruta', /Enfoque híbrido/.test(nb(await page.textContent('[data-card="route"] h3'))), null);
    /* documentos: visión, definición de terminado y revisión/retrospectiva de las iteraciones cerradas */
    await page.evaluate(async (pid) => {
      const mk = (template, fields) => ({ template, title: template, status: 'borrador', rev: null, fields, titleBlock: {}, createdAt: PM.nowIso(), updatedAt: PM.nowIso() });
      await PM.store.set(PM.paths.doc(pid, 'vision-producto'), mk('vision-producto', { producto: 'Plataforma' }));
      await PM.store.set(PM.paths.doc(pid, 'definicion-terminado'), mk('definicion-terminado', { definicionTerminado: ['Probado', 'Desplegado en pruebas'] }));
      for (const s of ['Iteración 1', 'Iteración 2']) {
        const k = s.slice(-1);
        await PM.store.set(PM.paths.doc(pid, 'acta-revision-sprint--r' + k), mk('acta-revision-sprint', { iteracion: s }));
        await PM.store.set(PM.paths.doc(pid, 'retrospectiva--t' + k), mk('retrospectiva', { iteracion: s }));
      }
    }, pid);
    await page.waitForTimeout(600);
    if (await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).count()) await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
    const st2 = await page.$$eval('.dashboard-step', (els) => Object.fromEntries(els.map((e) => [e.getAttribute('data-step'), e.getAttribute('data-state')])));
    eq('con los documentos: visión, terminado y revisión/retrospectiva hechos', [st2.vision, st2.terminado, st2['revision-retro']], ['done', 'done', 'done']);
    eq('definición de terminado con criterios', nb(await page.textContent('.dashboard-step[data-step="terminado"] .chip')), 'Borrador · 2 criterios');
    /* paso → vista */
    await page.click('.dashboard-step[data-step="releases"]'); await page.waitForTimeout(150);
    eq('paso «Plan de releases» abre iteraciones', (await state(page)).view, 'iteraciones');
    await gotoView(page, 'tablero'); await page.waitForSelector(card);
    eq('sin tarjetas de error', await errorCards(page), []);

    /* --- 1920 px: la tarjeta usa el ancho --- */
    await page.setViewportSize({ width: 1920, height: 1000 }); await page.waitForTimeout(300);
    const wide = await page.evaluate(() => { const c = document.querySelector('[data-card="agile"]').getBoundingClientRect(); const p = document.querySelector('.page').getBoundingClientRect(); return { c: Math.round(c.width), p: Math.round(p.width), cols: getComputedStyle(document.querySelector('.dashboard-agile-grid')).gridTemplateColumns.split(' ').filter((w) => parseFloat(w) > 0).length }; });
    check('1920 px: la tarjeta ágil ocupa el ancho de la página y reparte 4 columnas', wide.c >= wide.p - 70 && wide.cols === 4, wide);
    await shot(page, 'tablero-agil-1920', false);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

await section('C2. tablero: adaptativo, Kanban, vacío y predictivo', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    /* adaptativo: pasos predictivos esenciales + ágiles */
    await seed(page, { lifecycle: 'Adaptativo (ágil)', code: 'PRY-AD-005' }, { blank: true });
    await page.waitForSelector('[data-card="route"]');
    const ids = await page.$$eval('.dashboard-step', (els) => els.map((e) => e.getAttribute('data-step')));
    eq('ruta adaptativa', ids, ['acta', 'interesados', 'riesgos', 'plan-cambios', 'vision', 'backlog', 'terminado', 'releases', 'linea-base-release', 'primera-iteracion', 'revision-retro']);
    eq('fases de la ruta adaptativa', await page.$$eval('[data-card="route"] [data-phase] .label-caps', (els) => els.map((e) => e.textContent.trim())), ['Inicio y preparación del producto', 'Ejecución por iteraciones']);
    check('resumen de la ruta adaptativa', /preparar el backlog y los releases/.test(nb(await page.textContent('[data-route-summary]'))), nb(await page.textContent('[data-route-summary]')));
    check('tarjeta ágil vacía con acciones', (await page.$$('[data-card="agile"] [data-agile-empty]')).length === 1 && await page.locator('[data-card="agile"]').getByRole('button', { name: 'Crear el backlog' }).count() === 1, null);
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(200);
    check('lectura: la tarjeta vacía ofrece ver, no crear', await page.locator('[data-card="agile"]').getByRole('button', { name: 'Ver el backlog' }).count() === 1 && await page.locator('[data-card="agile"]').getByRole('button', { name: 'Crear el backlog' }).count() === 0, null);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(200);
    await page.locator('[data-card="agile"]').getByRole('button', { name: 'Crear el backlog' }).click(); await page.waitForTimeout(150);
    eq('«Crear el backlog» abre el backlog', (await state(page)).view, 'backlog');
    await gotoView(page, 'tablero');

    /* Kanban sin iteraciones: flujo continuo */
    const kan = { ...AGILE, settings: { ...AGILE.settings, framework: 'kanban' }, sprints: [] };
    const items = ITEMS.map((it) => ({ ...it, sprintId: null }));
    await seed(page, { code: 'PRY-KB-006' }, { agile: kan, items });
    await page.waitForSelector('[data-card="agile"] [data-agile="sprint"]');
    const flow = nb(await page.textContent('[data-card="agile"] [data-agile="sprint"]'));
    check('Kanban: flujo continuo con elementos en curso', /Flujo continuo/.test(flow) && /4 elementos en curso/.test(flow), flow);
    check('Kanban: WIP medido en todo el flujo', /Límite WIP superado en «En curso»/.test(nb(await page.textContent('[data-card="agile"] [data-agile="alerts"]'))), null);
    check('Kanban: velocidad sin iteraciones cerradas', /Aparece al cerrar la primera iteración/.test(nb(await page.textContent('[data-card="agile"] [data-agile="velocity"]'))), null);

    /* predictivo: sin tarjeta ágil y ruta sin cambios (14 pasos) */
    await seed(page, { lifecycle: 'Predictivo', code: 'PRY-PR-007' }, { blank: true });
    await page.waitForSelector('[data-card="route"]');
    check('predictivo: sin tarjeta ágil', (await page.$$('[data-card="agile"]')).length === 0, null);
    eq('predictivo: 14 pasos', await page.$$eval('.dashboard-step', (e) => e.length), 14);
    check('predictivo: sin chip de enfoque', !/Enfoque/.test(nb(await page.textContent('[data-card="route"] h3'))), null);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

/* =============================================================== E. rendimiento: backlog de 400 elementos */
await section('E. rendimiento', async () => {
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const many = [];
    for (let k = 0; k < 400; k++) {
      const sp = k < 60 ? 's1' : k < 120 ? 's2' : k < 180 ? 's3' : null;
      const done = sp && (sp !== 's3' || k % 3 === 0);
      many.push(item('m' + k, 'HU-' + String(100 + k).padStart(3, '0'), 'Historia de prueba ' + k, (k % 5) + 1, { sprintId: sp, releaseId: k % 4 === 3 ? 'r2' : 'r1', status: done ? 'terminado' : sp ? (k % 2 ? 'en-curso' : 'por-hacer') : 'backlog', doneDate: done ? (sp === 's1' ? '2026-08-12' : sp === 's2' ? '2026-08-27' : '2026-09-04') : null, blocked: k % 97 === 5 }));
    }
    await seed(page, { code: 'PRY-PF-008' }, { items: many });
    const t0 = Date.now();
    await page.waitForSelector('[data-card="agile"] [data-agile-velocity]', { timeout: 15000 });
    const tBoard = Date.now() - t0;
    check('tablero con 400 elementos: tarjeta ágil en menos de 4 s (' + tBoard + ' ms)', tBoard < 4000, tBoard);
    check('alertas con 400 elementos', /elementos bloqueados/.test(nb(await page.textContent('[data-card="agile"] [data-agile="alerts"]'))), null);
    const t1 = Date.now();
    await page.evaluate(() => PM.navigate('valor-ganado', { tab: 'agil' }));
    await page.waitForSelector('[data-role="agile-evm-table"]', { timeout: 15000 });
    const tEvm = Date.now() - t1;
    check('valor ganado ágil con 400 elementos en menos de 3 s (' + tEvm + ' ms)', tEvm < 3000, tEvm);
    /* un cambio de presentación no recalcula: cambiar el formato responde rápido */
    const t2 = Date.now();
    await page.getByRole('button', { name: 'Valores completos' }).click();
    await page.waitForFunction(() => /\d{3}\.\d{3}/.test(document.querySelector('tr[data-release="r1"] td[data-col="bac"]').textContent));
    const tFmt = Date.now() - t2;
    check('cambio de formato en menos de 800 ms (' + tFmt + ' ms)', tFmt < 800, tFmt);
    eq('sin errores de consola', errors, []);
  } finally { await browser.close(); }
});

/* =============================================================== D. tema oscuro y móvil (400 px) */
for (const mode of [{ dark: true, width: 1360, tag: 'oscuro' }, { dark: false, width: 400, tag: 'movil' }, { dark: true, width: 400, tag: 'movil-oscuro' }]) {
  await section('D. ' + mode.tag, async () => {
    const { browser, page, errors } = await openApp({ file, width: mode.width, height: 900, dark: mode.dark });
    try {
      await seed(page);
      await page.waitForSelector('[data-card="agile"]');
      eq(mode.tag + ': tablero sin desborde horizontal', await horizontalOverflow(page) <= 1, true);
      await shot(page, 'tablero-' + mode.tag);
      await elShot(page, '[data-card="agile"]', 'card-agile-' + mode.tag);
      await page.evaluate(() => PM.navigate('valor-ganado', { tab: 'agil' }));
      await page.waitForSelector('[data-role="agile-evm-table"]');
      eq(mode.tag + ': valor ganado ágil sin desborde', await horizontalOverflow(page) <= 1, true);
      if (mode.width <= 400) check(mode.tag + ': la tabla se desplaza dentro de su contenedor', await page.$eval('[data-role="agile-evm-table"]', (t) => { const w = t.closest('.table-wrap'); return w.scrollWidth > w.clientWidth && getComputedStyle(w).overflowX !== 'visible'; }), null);
      await shot(page, 'evm-agil-' + mode.tag);
      await elShot(page, '[data-role="agile-evm"]', 'el-evm-agil-' + mode.tag);
      await page.evaluate(() => PM.navigate('valor-ganado', { tab: 'reales' }));
      await page.waitForSelector('[data-role="actuals"] table');
      eq(mode.tag + ': costos reales sin desborde', await horizontalOverflow(page) <= 1, true);
      await gotoView(page, 'raci');
      await page.waitForSelector('.empty');
      await page.getByRole('button', { name: 'Agregar eventos ágiles' }).click();
      await page.waitForSelector('.modal [data-role="agile-events"]');
      eq(mode.tag + ': modal de eventos sin desborde', await horizontalOverflow(page) <= 1, true);
      await shot(page, 'raci-modal-' + mode.tag, false);
      await page.locator('.modal-foot').getByRole('button', { name: /^Agregar 9 eventos$/ }).click();
      await page.waitForTimeout(700);
      eq(mode.tag + ': RACI sin desborde', await horizontalOverflow(page) <= 1, true);
      await shot(page, 'raci-' + mode.tag);
      await elShot(page, '.matrices-raci', 'el-raci-' + mode.tag);
      eq(mode.tag + ': sin tarjetas de error', await errorCards(page), []);
      eq(mode.tag + ': sin errores de consola', errors, []);
    } finally { await browser.close(); }
  });
}

console.log('\n' + (total - fails) + '/' + total + ' verificaciones correctas' + (fails ? ' · ' + fails + ' fallidas' : ''));
process.exit(fails ? 1 : 0);

// Pruebas de interacción del módulo 50 (vista "valor-ganado": curva S, indicadores, costos reales,
// cortes de avance, presupuesto y desempeño por actividad).
// Uso: node test/evm.test.mjs [--file ruta.html] [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { openApp, createProject, gotoView, horizontalOverflow, errorCards, root } from './harness.mjs';
import { installClaudeMock } from './dbmock.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const norm = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------------------- datos de prueba */
async function seed(page, pid) {
  return page.evaluate(async (pid) => {
    const wbs = { nodes: [
      { id: 'w1', parentId: null, name: 'Ingeniería', order: 1 },
      { id: 'w11', parentId: 'w1', name: 'Diseño del andamio', order: 1 },
      { id: 'w12', parentId: 'w1', name: 'Planes de montaje', order: 2 },
      { id: 'w2', parentId: null, name: 'Montaje', order: 2 },
      { id: 'w21', parentId: 'w2', name: 'Niveles 1 a 5', order: 1 },
      { id: 'w22', parentId: 'w2', name: 'Niveles 6 a 10', order: 2 },
    ] };
    const schedule = { settings: { workweek: 6, holidaysCO: true, extraHolidays: [] }, tasks: [
      { id: 't1', name: 'Diseño y memoria de cálculo', wbsId: 'w11', duration: 10, deps: [], cost: 20000000, progress: 100 },
      { id: 't2', name: 'Plan de montaje y de rescate', wbsId: 'w12', duration: 5, deps: [{ id: 't1', type: 'FS', lag: 0 }], cost: 8000000, progress: 100 },
      { id: 't3', name: 'Montaje niveles 1 a 5', wbsId: 'w21', duration: 20, deps: [{ id: 't2', type: 'FS', lag: 0 }], cost: 60000000, progress: 100 },
      { id: 't4', name: 'Montaje niveles 6 a 10', wbsId: 'w22', duration: 20, deps: [{ id: 't3', type: 'FS', lag: 0 }], cost: 60000000, progress: 50 },
      { id: 't5', name: 'Inspección y certificación final', wbsId: 'w22', duration: 3, deps: [{ id: 't4', type: 'FS', lag: 0 }], cost: 4000000, progress: 0 },
      { id: 't6', name: 'Andamio certificado', wbsId: 'w22', duration: 0, milestone: true, deps: [{ id: 't5', type: 'FS', lag: 0 }], cost: 0, progress: 0 },
      { id: 't7', name: 'Dirección del proyecto', wbsId: null, duration: 60, deps: [], cost: 10000000, progress: 40 },
    ] };
    const costs = {
      actuals: [
        { id: 'a5', date: '2026-09-14', taskId: 't3', wbsId: 'w21', category: 'Mano de obra', description: 'Cuadrilla de montaje niveles 1 a 5', document: 'NOM-09A', amount: 40000000 },
        { id: 'a1', date: '2026-08-10', taskId: 't1', wbsId: 'w11', category: 'Mano de obra', description: 'Horas de ingeniería', document: 'NOM-08A', amount: 9000000 },
        { id: 'a2', date: '2026-08-20', taskId: 't1', wbsId: 'w11', category: 'Mano de obra', description: 'Saldo de horas de ingeniería', document: 'NOM-08B', amount: 12500000 },
        { id: 'a3', date: '2026-08-21', taskId: 't2', wbsId: 'w12', category: 'Mano de obra', description: 'Plan de montaje', document: 'NOM-08B', amount: 7000000 },
        { id: 'a4', date: '2026-09-05', taskId: 't3', wbsId: 'w21', category: 'Transporte', description: 'Fletes a obra', document: 'FE-7712', amount: 15000000 },
        { id: 'a6', date: '2026-09-30', taskId: 't4', wbsId: 'w22', category: 'Equipos', description: 'Malacate eléctrico', document: 'FE-2291', amount: 25000000 },
        { id: 'a7', date: '2026-09-30', taskId: null, wbsId: null, category: 'Otros', description: 'Póliza de responsabilidad civil', document: 'POL-01', amount: 1500000 },
        { id: 'a8', date: '2026-10-15', taskId: 't4', wbsId: 'w22', category: 'Mano de obra', description: 'Cuadrilla posterior al corte', document: 'NOM-10B', amount: 5000000 },
      ],
      statusUpdates: [
        { id: 'su1', date: '2026-08-21', progress: { t1: 100, t2: 100, t7: 10 }, note: 'Ingeniería terminada' },
        { id: 'su2', date: '2026-09-14', progress: { t3: 100, t4: 0, t7: 25 }, note: 'Niveles 1 a 5 terminados' },
      ],
      reserves: { contingency: 5000000, management: 2000000 },
    };
    await PM.store.set(PM.paths.tool(pid, 'wbs'), wbs);
    await PM.store.set(PM.paths.tool(pid, 'costs'), costs);
    const sched = PM.calc.computeSchedule(schedule, '2026-08-03');
    const snap = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched, wbs, costs });
    await PM.store.set(PM.paths.baseline(pid, 'bl0'), { number: 0, label: 'LB0', date: '2026-08-01', note: 'Línea base inicial', changeRef: null, byId: null, ...snap });
    /* cambio posterior a la línea base: la inspección cuesta más en el plan vigente */
    schedule.tasks[4].cost = 5000000;
    await PM.store.set(PM.paths.tool(pid, 'schedule'), schedule);
  }, pid);
}
const expected = (page, pid) => page.evaluate(async (pid) => {
  const project = await PM.store.get(PM.paths.project(pid));
  const schedule = await PM.store.get(PM.paths.tool(pid, 'schedule'));
  const costs = await PM.store.get(PM.paths.tool(pid, 'costs'));
  const docs = await PM.store.list(PM.paths.baselines(pid));
  const sched = PM.calc.computeSchedule(schedule, project.start);
  const bl = PM.calc.activeBaselines(docs);
  const e = PM.calc.evm({ sched, costBaseline: bl.cost, costs, statusDate: PM.statusDateOf(project) });
  const f = (v) => PM.fmt.money(v, 'COP');
  const bacNow = PM.sum(schedule.tasks, (t) => t.cost);
  const res = costs.reserves || {};
  return { pv: f(e.pv), ev: f(e.ev), ac: f(e.ac), bac: f(e.bac), spi: PM.fmt.idx(e.spi), cpi: PM.fmt.idx(e.cpi), eac: f(e.eac), seriesLen: e.series.length, statusDate: e.statusDate,
    raw: { pv: e.pv, ev: e.ev, ac: e.ac, spi: e.spi, cpi: e.cpi }, curBaseline: f(bacNow + (res.contingency || 0)), curTotal: f(bacNow + (res.contingency || 0) + (res.management || 0)), blBaseline: f(e.costBaseline),
    months: (() => { const out = []; let m = PM.date.startOfMonth(e.planStart); while (m <= e.planFinish) { out.push(m); m = PM.date.addMonths(m, 1); } return out.length; })() };
}, pid);
const stubDownloads = (page) => page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data: String(data) }); return true; }; });
const lastDownload = (page) => page.evaluate(() => (window.__dl || []).slice(-1)[0] || null);
const tab = async (page, label) => { await page.click(`[data-view="valor-ganado"] .tab:has-text("${label}")`); await page.waitForTimeout(250); };
const text = async (page, sel) => norm(await page.locator(sel).first().evaluate((e) => (e instanceof HTMLElement ? e.innerText : e.textContent)));
/* Campo numérico del núcleo (NumberInput): al enfocarlo muestra el valor crudo; se selecciona todo y se escribe como lo haría un usuario. */
const setNum = async (page, sel, value) => { await page.click(sel); await page.waitForTimeout(60); await page.keyboard.press('Control+A'); await page.keyboard.type(String(value)); await page.locator(sel).blur(); };
const stored = (page, pid, tool) => page.evaluate(({ pid, tool }) => PM.store.get(PM.paths.tool(pid, tool)), { pid, tool });

const { browser, page, errors } = await openApp({ file });
const shot = async (name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };
try {
  /* ---------- estado vacío */
  const emptyPid = await createProject(page, { name: 'Proyecto sin cronograma', code: 'PRY-TEST-000' });
  await page.waitForTimeout(300);
  await gotoView(page, 'valor-ganado');
  check('vacío: Empty con «Ir al cronograma»', await page.locator('.empty button:has-text("Ir al cronograma")').isVisible());
  check('vacío: aviso de que falta la línea base de costos', (await text(page, '[data-source]')).includes('Sin línea base de costos'));
  await tab(page, 'Avance');
  check('vacío: pestaña Avance pide crear actividades', (await text(page, '.empty')).includes('No hay actividades en el cronograma'));
  await tab(page, 'Costos reales');
  check('vacío: costos reales con acción «Agregar costo real»', await page.locator('.empty button:has-text("Agregar costo real")').isVisible());
  await tab(page, 'Curva S');

  /* ---------- proyecto con datos */
  const pid = await createProject(page, { start: '2026-08-03', statusDate: '2026-10-02', budget: 480000000 });
  await seed(page, pid);
  await page.waitForTimeout(300);
  await gotoView(page, 'valor-ganado');
  await page.waitForSelector('[data-chart="curva-s"]');
  await stubDownloads(page);
  let exp = await expected(page, pid);
  check('fuente: medido contra LB0', (await text(page, '[data-source]')).includes('Medido contra la línea base de costos LB0'));

  /* ---------- curva S */
  const d = await page.evaluate(() => ['pv', 'ev', 'ac'].map((k) => (document.querySelector(`[data-chart="curva-s"] path[data-series="${k}"]`) || {}).getAttribute?.('d') || ''));
  check('curva S: tres series (PV, EV, AC) dibujadas', d.every((x) => x.length > 10) && d[0].split('L').length > d[1].split('L').length, d.map((x) => x.length));
  check('curva S: línea de la fecha de corte', (await page.locator('[data-chart="curva-s"] [data-role="status-line"]').count()) === 1 && (await text(page, '[data-role="status-line"] text')) === 'Corte 02 oct');
  check('curva S: línea BAC y proyección al EAC', (await page.locator('[data-role="bac-line"]').count()) === 1 && (await page.locator('[data-role="eac-line"]').count()) === 1);
  check('curva S: etiquetas BAC y EAC sin superponerse', await page.evaluate(() => { const a = document.querySelector('[data-role="label-bac"]').getBBox(), b = document.querySelector('[data-role="label-eac"]').getBBox(); return a.y + a.height <= b.y + 0.5 || b.y + b.height <= a.y + 0.5; }));
  const legend = await text(page, '[data-role="legend"]');
  check('curva S: leyenda con PV, EV, AC, BAC, EAC y corte', ['Valor planificado (PV)', 'Valor ganado (EV)', 'Costo real (AC)', 'BAC', 'Proyección al EAC', 'Fecha de corte'].every((k) => legend.includes(k)), legend);
  const hit = await page.locator('[data-role="hit"]').boundingBox();
  await page.mouse.move(hit.x + hit.width * 0.35, hit.y + hit.height / 2);
  await page.waitForTimeout(150);
  const tipText = norm(await page.locator('.evm-chart .chart-tip').innerText().catch(() => ''));
  check('curva S: información al pasar el cursor (fecha, PV, EV, AC, SV, CV)', tipText.includes('Valor planificado (PV)') && tipText.includes('SV = EV − PV') && tipText.includes('CV = EV − AC') && /\d{4}/.test(tipText), tipText);
  check('curva S: cruceta visible', (await page.locator('[data-role="crosshair"]').count()) === 1);
  const tipOk = await page.evaluate(async ({ pid, tipText }) => {
    const project = await PM.store.get(PM.paths.project(pid)); const schedule = await PM.store.get(PM.paths.tool(pid, 'schedule'));
    const costs = await PM.store.get(PM.paths.tool(pid, 'costs')); const bl = PM.calc.activeBaselines(await PM.store.list(PM.paths.baselines(pid)));
    const e = PM.calc.evm({ sched: PM.calc.computeSchedule(schedule, project.start), costBaseline: bl.cost, costs, statusDate: PM.statusDateOf(project) });
    const t = tipText.replace(/\u00a0/g, ' ');
    const p = e.series.find((q) => t.includes(PM.fmt.date(q.date, 'long')));
    return !!p && t.includes(PM.fmt.moneyShort(p.pv, 'COP')) && (p.ev === null || t.includes(PM.fmt.moneyShort(p.ev, 'COP')));
  }, { pid, tipText });
  check('curva S: la información muestra los valores de la fecha más cercana de la serie', tipOk, tipText);
  const outOfBounds = await page.evaluate(() => { const svg = document.querySelector('[data-chart="curva-s"]'); const W = +svg.getAttribute('width'), H = +svg.getAttribute('height'); return [...svg.querySelectorAll('text')].filter((t) => { const b = t.getBBox(); return b.x < -0.5 || b.y < -0.5 || b.x + b.width > W + 0.5 || b.y + b.height > H + 0.5; }).map((t) => t.textContent); });
  check('curva S: todas las etiquetas dentro del gráfico', outOfBounds.length === 0, outOfBounds);
  const xOverlap = await page.evaluate(() => { const svg = document.querySelector('[data-chart="curva-s"]'); const bs = [...svg.querySelectorAll('text')].map((t) => ({ s: t.textContent, b: t.getBBox() })); const out = []; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i].b, b = bs[j].b; if (a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5) out.push(bs[i].s + ' / ' + bs[j].s); } return out; });
  check('curva S: ninguna etiqueta se superpone con otra', xOverlap.length === 0, xOverlap);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(100);
  check('curva S: la información se oculta al salir', (await page.locator('.evm-chart .chart-tip').count()) === 0);
  await page.focus('.evm-chart');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(100);
  check('curva S: navegación con teclado muestra la información', (await page.locator('.evm-chart .chart-tip').count()) === 1);
  await page.keyboard.press('Escape');
  const interp = await text(page, '[data-role="interpretation"]');
  check('interpretación con SPI y CPI', interp.includes('SPI ' + exp.spi) && interp.includes('CPI ' + exp.cpi) && interp.includes('atrasado'), interp.slice(0, 200));
  await page.click('button:has-text("Ver tabla")');
  check('Ver tabla: una fila por fecha de la serie', (await page.locator('[data-role="series-table"] tbody tr').count()) === exp.seriesLen, exp.seriesLen);
  check('Ver tabla: la tabla cabe sin desplazamiento lateral a 1360 px', await page.$eval('[data-role="series-table"] .table-wrap', (el) => el.scrollWidth <= el.clientWidth + 1));
  await page.click('[data-role="series-table"] button:has-text("Exportar CSV")');
  let dl = await lastDownload(page);
  check('Ver tabla: CSV de la serie', dl && dl.name === 'curva-s_pry-test-001.csv' && dl.data.includes('Fecha;PV (COP);EV (COP);AC (COP)'), dl && dl.name);
  await page.click('[data-role="curve-card"] button:has-text("Descargar SVG")');
  dl = await lastDownload(page);
  check('Descargar SVG', dl && dl.name.endsWith('.svg') && dl.data.includes('<svg') && dl.data.includes('data-series="pv"'), dl && dl.name);
  await shot('evm-curva');

  /* ---------- indicadores */
  await tab(page, 'Indicadores');
  const full = (id) => text(page, `[data-metric="${id}"] .evm-metric-full`);
  const val = (id) => text(page, `[data-metric="${id}"] .evm-metric-value`);
  check('indicadores: PV = PM.calc.evm', (await full('pv')) === exp.pv, [await full('pv'), exp.pv]);
  check('indicadores: EV = PM.calc.evm', (await full('ev')) === exp.ev, [await full('ev'), exp.ev]);
  check('indicadores: AC = PM.calc.evm (excluye el costo posterior al corte)', (await full('ac')) === exp.ac && exp.raw.ac === 110000000, [await full('ac'), exp.ac]);
  check('indicadores: BAC de la línea base', (await full('bac')) === exp.bac && exp.bac === '$ 162.000.000', exp.bac);
  check('indicadores: SPI y CPI', (await val('spi')) === exp.spi && (await val('cpi')) === exp.cpi, [await val('spi'), exp.spi, await val('cpi'), exp.cpi]);
  check('indicadores: EAC típica', (await full('eac')) === exp.eac, [await full('eac'), exp.eac]);
  check('indicadores: tono del SPI según indexTone', (await page.getAttribute('[data-metric="spi"]', 'data-tone')) === (await page.evaluate((v) => PM.calc.indexTone(v), exp.raw.spi)));
  check('indicadores: fórmulas visibles', (await text(page, '[data-metric="tcpi"] .evm-formula')) === 'TCPI = (BAC − EV) / (BAC − AC)');
  check('indicadores: fórmula del cronograma ganado sin redundancia', (await text(page, '[data-metric="es"] .evm-formula')) === 'ES = momento en que el PV igualaba el EV actual');
  check('indicadores: cronograma ganado y fin pronosticado', (await val('spiT')) !== '—' && /\d{4}/.test(await val('forecastFinish')));
  await shot('evm-indicadores');

  /* ---------- costos reales: agregar, editar, eliminar */
  await tab(page, 'Costos reales');
  const dates = await page.$$eval('[data-actual] [data-field="date"]', (els) => els.map((e) => e.value));
  check('costos reales: 8 registros ordenados por fecha', dates.length === 8 && dates.join() === [...dates].sort().join(), dates);
  check('costos reales: aviso de registro posterior al corte', (await text(page, '[data-actual="a8"]')).includes('Posterior al corte'));
  await page.click('[data-role="actuals"] .card-head button:has-text("Agregar costo real")');
  await page.waitForTimeout(150);
  const newId = await page.evaluate(() => { const el = document.activeElement; const row = el && el.closest('[data-actual]'); return row && el.dataset.field === 'description' ? row.dataset.actual : null; });
  check('agregar costo real: nueva fila con foco en la descripción', !!newId && (await page.locator('[data-actual]').count()) === 9, newId);
  await page.keyboard.type('Alquiler de malacate adicional');
  const nr = `[data-actual="${newId}"]`;
  await page.fill(`${nr} [data-field="date"]`, '2026-09-25');
  await page.locator(`${nr} [data-field="date"]`).blur();
  check('costos reales: la actividad se elige con una lista que aparece al editar', (await page.locator(`${nr} select[data-field="taskId"]`).count()) === 0);
  await page.click(`${nr} [data-role="task-btn"]`);
  await page.selectOption(`${nr} select[data-field="taskId"]`, 't4');
  await page.locator(`${nr} select[data-field="taskId"]`).blur();
  check('costos reales: la actividad elegida se muestra en la fila', (await text(page, `${nr} [data-role="task-btn"]`)).includes('Montaje niveles 6 a 10'));
  await page.selectOption(`${nr} [data-field="category"]`, 'Equipos');
  await page.fill(`${nr} [data-field="document"]`, 'FE-3001');
  await setNum(page, `${nr} [data-field="amount"]`, '3500000');
  await setNum(page, '[data-actual="a1"] [data-field="amount"]', '9500000');
  await page.click('[data-actual="a8"] button[aria-label*="Eliminar"]');
  await page.waitForSelector('.modal');
  check('eliminar costo: pide confirmación', (await text(page, '.modal')).includes('Cuadrilla posterior al corte'));
  await page.click('.modal button:has-text("Eliminar registro")');
  await page.waitForTimeout(1500);
  let costs = await stored(page, pid, 'costs');
  const added = costs.actuals.find((a) => a.id === newId);
  check('costos reales guardados (agregar, editar y eliminar)', costs.actuals.length === 8 && !costs.actuals.find((a) => a.id === 'a8') && costs.actuals.find((a) => a.id === 'a1').amount === 9500000
    && added && added.amount === 3500000 && added.taskId === 't4' && added.wbsId === 'w22' && added.category === 'Equipos' && added.description === 'Alquiler de malacate adicional' && added.date === '2026-09-25' && added.document === 'FE-3001', added);
  const rowsOrder = await page.$$eval('[data-actual]', (els) => els.map((e) => e.dataset.actual));
  check('costos reales: el registro nuevo queda en su lugar por fecha', rowsOrder.indexOf(newId) === rowsOrder.indexOf('a6') - 1, rowsOrder);
  check('costos reales: totales por categoría', (await text(page, '[data-role="by-category"]')).includes('Equipos'));
  await page.click('[data-role="actuals"] .card-head button:has-text("Exportar CSV")');
  dl = await lastDownload(page);
  check('costos reales: CSV', dl && dl.name === 'costos-reales_pry-test-001.csv' && dl.data.includes('Fecha;Actividad;Código EDT;Categoría;Descripción;Documento soporte;Valor (COP)') && dl.data.includes('Alquiler de malacate adicional'), dl && dl.data.slice(0, 120));
  await page.fill('[data-role="actuals"] input[type="search"]', 'malacate');
  await page.waitForTimeout(100);
  check('costos reales: filtro de búsqueda', (await page.locator('[data-actual]').count()) === 2);
  await page.fill('[data-role="actuals"] input[type="search"]', '');
  await page.click('[data-actual="a2"] [data-field="description"]');
  await page.keyboard.press('End');
  await page.keyboard.type(' (ajuste)');
  await page.waitForTimeout(1600);
  costs = await stored(page, pid, 'costs');
  check('costos reales: el texto se guarda al pausar la escritura, sin salir del campo', costs.actuals.find((a) => a.id === 'a2').description === 'Saldo de horas de ingeniería (ajuste)', costs.actuals.find((a) => a.id === 'a2').description);
  await page.locator('[data-actual="a2"] [data-field="description"]').blur();

  await page.reload();
  await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
  await gotoView(page, 'valor-ganado');
  await page.waitForSelector('[data-actual]');
  await stubDownloads(page);
  check('persistencia: pestaña recordada y costos tras recargar', (await page.locator('[data-actual]').count()) === 8 && (await page.inputValue(`[data-actual="${newId}"] [data-field="description"]`)) === 'Alquiler de malacate adicional');
  exp = await expected(page, pid);
  await tab(page, 'Indicadores');
  check('indicadores: AC actualizado tras editar costos', (await full('ac')) === exp.ac && exp.raw.ac === 114000000, [await full('ac'), exp.ac]);

  /* ---------- avance */
  await tab(page, 'Avance');
  check('avance: dos cortes registrados', (await page.locator('[data-cut]').count()) === 2);
  check('avance: EV del corte con presupuestos de la línea base', (await text(page, '[data-cut="su1"] [data-role="cut-ev"]')) === '$ 29.000.000', await text(page, '[data-cut="su1"] [data-role="cut-ev"]'));
  check('avance: fecha del corte por defecto = fecha de corte', (await page.inputValue('#evm-cut-date')) === '2026-10-02');
  await setNum(page, '[data-task="t4"] [data-field="progress"]', '70');
  await page.fill('#evm-cut-note', 'Corte de prueba');
  await page.click('button:has-text("Registrar corte de avance")');
  await page.waitForTimeout(200);
  check('avance: registrar corte agrega una fila', (await page.locator('[data-cut]').count()) === 3);
  await page.click('button:has-text("Registrar corte de avance")');
  await page.waitForSelector('.modal');
  check('avance: corte en la misma fecha pide reemplazar', (await text(page, '.modal')).includes('Ya hay un corte registrado'));
  await page.click('.modal button:has-text("Reemplazar corte")');
  await page.waitForTimeout(200);
  check('avance: el reemplazo no duplica cortes', (await page.locator('[data-cut]').count()) === 3);
  const su2Ev = await text(page, '[data-cut="su2"] [data-role="cut-ev"]');
  await page.click('[data-cut="su1"] button[aria-label^="Eliminar corte"]');
  await page.waitForSelector('.modal');
  await page.click('.modal button:has-text("Eliminar corte")');
  await page.waitForTimeout(1500);
  costs = await stored(page, pid, 'costs');
  const sch = await stored(page, pid, 'schedule');
  const last = costs.statusUpdates.find((u) => u.date === '2026-10-02');
  const su2 = costs.statusUpdates.find((u) => u.id === 'su2');
  /* cada corte guarda solo las actividades cuyo % cambió respecto al corte anterior (regresión: tools/costs > 256 KiB) */
  check('avance: cortes guardados (registrar, reemplazar, eliminar)', costs.statusUpdates.length === 2 && !costs.statusUpdates.find((u) => u.id === 'su1') && last && last.note === '' && costs.statusUpdates[1] === last, costs.statusUpdates.map((u) => u.date));
  check('avance: el corte nuevo guarda solo los cambios respecto al anterior', last && Object.keys(last.progress).length === 2 && last.progress.t4 === 70 && last.progress.t7 === 40, last && last.progress);
  check('avance: al eliminar un corte, el siguiente conserva el avance que registró', su2 && su2.progress.t1 === 100 && su2.progress.t2 === 100 && su2.progress.t3 === 100 && su2.progress.t7 === 25 && su2Ev === '$ 90.500.000' && (await text(page, '[data-cut="su2"] [data-role="cut-ev"]')) === su2Ev, [su2 && su2.progress, su2Ev]);
  check('avance: columna «Cambios» con las actividades que cambiaron', (await text(page, `[data-cut="${last && last.id}"] [data-role="cut-changes"]`)) === '2');
  check('avance: la explicación usa «fecha de corte» (sin «fecha de corte de control»)', !(await text(page, '[data-role="cuts"]')).includes('corte de control'));
  check('avance: % de avance guardado en el cronograma', sch.tasks.find((t) => t.id === 't4').progress === 70 && sch.tasks.find((t) => t.id === 't1').progress === 100);
  exp = await expected(page, pid);
  await tab(page, 'Indicadores');
  check('indicadores: EV actualizado con el nuevo avance', (await full('ev')) === exp.ev && Math.round(exp.raw.ev) === 20000000 + 8000000 + 60000000 + 42000000 + 4000000, [await full('ev'), exp.ev]);
  await shot('evm-avance');

  /* ---------- presupuesto */
  await tab(page, 'Presupuesto');
  check('presupuesto: línea base de costos vigente = BAC + contingencia', (await text(page, '[data-row="baseline"] [data-col="cur"]')) === exp.curBaseline && exp.curBaseline === '$ 168.000.000', [await text(page, '[data-row="baseline"] [data-col="cur"]'), exp.curBaseline]);
  check('presupuesto: columna de la línea base LB0', (await text(page, '[data-row="baseline"] [data-col="bl"]')) === '$ 167.000.000');
  check('presupuesto: aviso de diferencia con la línea base', (await text(page, '[data-role="ledger"]')).includes('difiere de la línea base LB0'));
  await setNum(page, '[data-field="contingency"]', '8000000');
  await setNum(page, '[data-field="management"]', '3500000');
  await page.waitForTimeout(200);
  check('presupuesto: editar reservas actualiza la línea base de costos', (await text(page, '[data-row="baseline"] [data-col="cur"]')) === '$ 171.000.000');
  check('presupuesto: y el presupuesto del proyecto', (await text(page, '[data-row="total"] [data-col="cur"]')) === '$ 174.500.000');
  check('presupuesto: comparación con el presupuesto aprobado', (await text(page, '[data-role="budget-compare"]')).includes('del presupuesto aprobado sin asignar'));
  check('presupuesto: cuentas de control nivel 1', (await page.locator('[data-account]').count()) === 3, await page.locator('[data-account]').count());
  const accRow = await text(page, '[data-row="accounts"]');
  check('presupuesto: la agregación no cuenta las actividades sin EDT como cuenta de control', accRow.includes('2 cuentas (EDT nivel 1)') && accRow.includes('1 actividad sin cuenta de control ($ 10.000.000)'), accRow);
  check('presupuesto: cita el gráfico 7-8 de la Guía del PMBOK®', (await text(page, '[data-role="ledger"] .card-head')).includes('gráfico 7-8'));
  check('terminología: «Exportar CSV» en todas las pestañas', (await page.locator('[data-view="valor-ganado"] button:has-text("Descargar CSV")').count()) === 0 && (await page.locator('[data-role="accounts"] button:has-text("Exportar CSV")').count()) === 1);
  await page.click('[data-role="accounts"] button:has-text("Nivel 2")');
  check('presupuesto: cuentas de control nivel 2', (await page.locator('[data-account]').count()) === 5, await page.locator('[data-account]').count());
  const fundRows = await page.locator('[data-role="funding-table"] tbody tr').count();
  const lastCum = norm(await page.locator('[data-role="funding-table"] tbody tr').last().locator('td').nth(2).innerText());
  check('presupuesto: requisitos de financiamiento por mes hasta el BAC', fundRows === exp.months && lastCum === exp.bac, [fundRows, exp.months, lastCum]);
  await page.locator('[data-role="funding"] .chart rect.evm-colhit').nth(1).hover();
  await page.waitForTimeout(100);
  check('presupuesto: información al pasar sobre una columna', norm(await page.locator('[data-role="funding"] .chart-tip').innerText().catch(() => '')).includes('Requerido en el mes'));
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1500);
  costs = await stored(page, pid, 'costs');
  check('presupuesto: reservas guardadas', costs.reserves.contingency === 8000000 && costs.reserves.management === 3500000, costs.reserves);
  await shot('evm-presupuesto');

  /* ---------- fecha de corte */
  await page.fill('#evm-status-date', '2026-09-15');
  await page.press('#evm-status-date', 'Enter');
  await page.waitForTimeout(500);
  const sd = await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid);
  check('fecha de corte guardada en el proyecto', sd === '2026-09-15', sd);
  await page.$eval('#evm-status-date', (el) => { el.focus(); el.value = '0002-09-15'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(900);
  const partial = { input: await page.inputValue('#evm-status-date'), stored: await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid) };
  check('fecha de corte: un año a medio escribir no se guarda ni se borra del campo', partial.input === '0002-09-15' && partial.stored === '2026-09-15', partial);
  await page.locator('#evm-status-date').blur();
  await page.waitForTimeout(150);
  check('fecha de corte: al salir con una fecha no válida se restaura la guardada', (await page.inputValue('#evm-status-date')) === '2026-09-15');
  exp = await expected(page, pid);
  await tab(page, 'Indicadores');
  check('indicadores recalculados con la nueva fecha de corte', (await full('pv')) === exp.pv && (await full('ac')) === exp.ac && exp.statusDate === '2026-09-15' && exp.raw.ac === 84000000, [await full('pv'), exp.pv, await full('ac'), exp.ac]);
  await page.click('[data-view="valor-ganado"] button:has-text("Usar hoy")');
  await page.waitForTimeout(400);
  const sd2 = await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid);
  check('«Usar hoy» fija la fecha de corte en hoy', sd2 === (await page.evaluate(() => PM.date.today())), sd2);
  await page.fill('#evm-status-date', '2026-10-02');
  await page.press('#evm-status-date', 'Enter');
  await page.waitForTimeout(400);

  /* ---------- por actividad */
  exp = await expected(page, pid);
  await tab(page, 'Por actividad');
  await page.click('[data-role="activities"] button:has-text("Valores completos")');
  check('por actividad: una fila por actividad más los costos sin actividad', (await page.locator('[data-activity]').count()) === 8);
  check('por actividad: totales = PM.calc.evm', (await text(page, '[data-role="totals"] [data-col="pv"]')) === exp.pv && (await text(page, '[data-role="totals"] [data-col="ev"]')) === exp.ev && (await text(page, '[data-role="totals"] [data-col="ac"]')) === exp.ac && (await text(page, '[data-role="totals"] [data-col="budget"]')) === exp.bac,
    [await text(page, '[data-role="totals"] [data-col="pv"]'), exp.pv]);
  const sum = await page.$$eval('[data-activity]', (rows) => rows.reduce((s, r) => s + Number(r.children[6].innerText.replace(/[^\d]/g, '') || 0), 0));
  check('por actividad: la suma de AC por actividad cuadra con el AC', sum === Math.round(exp.raw.ac), [sum, exp.raw.ac]);
  check('por actividad: SPI de la actividad con tono', (await page.locator('[data-activity="t4"] .chip').count()) >= 1);
  await page.click('[data-role="activity-table"] th button:has-text("CV")');
  const firstSorted = await page.$eval('[data-role="activity-table"] tbody tr', (r) => r.dataset.activity);
  check('por actividad: ordenar por CV (peor primero)', firstSorted === 't1', firstSorted);
  await page.click('[data-role="activities"] .card-head button:has-text("Exportar CSV")');
  dl = await lastDownload(page);
  check('por actividad: CSV', dl && dl.name === 'desempeno-por-actividad_pry-test-001.csv' && dl.data.includes('Total del proyecto') && dl.data.includes('Costos reales sin actividad asignada'), dl && dl.name);
  await page.click('[data-role="activities"] button:has-text("En millones")');
  await shot('evm-actividad');

  /* ---------- modo lectura */
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.waitForTimeout(150);
  await tab(page, 'Costos reales');
  check('lectura: costos reales sin campos ni botón de agregar', (await page.locator('[data-actual] input, [data-actual] select').count()) === 0 && (await page.locator('button:has-text("Agregar costo real")').count()) === 0 && (await page.locator('[data-actual]').count()) === 8);
  await tab(page, 'Avance');
  check('lectura: avance sin registrar corte ni editar %', (await page.locator('button:has-text("Registrar corte de avance")').count()) === 0 && (await page.locator('[data-field="progress"]').count()) === 0 && (await page.locator('[data-cut] button').count()) === 0);
  await tab(page, 'Presupuesto');
  check('lectura: reservas sin campos editables', (await page.locator('[data-field="contingency"]').count()) === 0);
  check('lectura: fecha de corte sin campo editable', (await page.locator('input#evm-status-date').count()) === 0 && (await page.locator('button:has-text("Usar hoy")').count()) === 0);
  await tab(page, 'Por actividad');
  check('lectura: por actividad sin campos editables', (await page.locator('[data-role="activities"] input:not([type="search"]), [data-role="activities"] select').count()) === 0);
  await tab(page, 'Indicadores');
  check('lectura: indicadores sin campos editables', (await page.locator('[data-role="indicators"] input, [data-role="indicators"] select').count()) === 0);
  await page.evaluate(() => PM.setState({ canWrite: true }));

  /* ---------- muchos registros: se muestran los 200 más recientes */
  await page.evaluate(async (pid) => {
    const c = await PM.store.get(PM.paths.tool(pid, 'costs'));
    const extra = []; for (let i = 0; i < 240; i++) extra.push({ id: 'bulk' + i, date: PM.date.add('2026-08-03', i % 25), taskId: 't1', wbsId: 'w11', category: 'Otros', description: 'Registro masivo ' + i, document: 'B-' + i, amount: 1000 });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { ...c, actuals: [...c.actuals, ...extra] });
  }, pid);
  await page.waitForTimeout(300);
  await tab(page, 'Costos reales');
  check('muchos registros: ventana con los 200 más recientes', (await page.locator('[data-actual]').count()) === 200 && (await page.locator('[data-role="more-actuals"]').isVisible()), await page.locator('[data-actual]').count());
  check('muchos registros: el total cubre todos los registros', (await text(page, '[data-role="actuals-total"]')) === (await page.evaluate(async (pid) => PM.fmt.money(PM.sum((await PM.store.get(PM.paths.tool(pid, 'costs'))).actuals, (a) => a.amount), 'COP'), pid)));
  await page.click('[data-role="more-actuals"] button:has-text("Mostrar todos")');
  check('muchos registros: «Mostrar todos»', (await page.locator('[data-actual]').count()) === 248);
  await tab(page, 'Curva S');

  check('sin tarjetas de error', (await errorCards(page)).length === 0);
  check('sin desborde horizontal (1360 px)', (await horizontalOverflow(page)) <= 1);
} catch (e) {
  check('excepción', false, String(e && e.stack || e).slice(0, 800));
}
check('sin errores de consola', errors.length === 0, errors.slice(0, 3));
await browser.close();

/* ---------- casos límite: proyecto terminado, plan corto, navegación por pestaña, sin presupuesto */
{
  const app = await openApp({ file });
  const p = app.page;
  try {
    const mk = (meta, tasks, costs, baseline) => p.evaluate(async ({ meta, tasks, costs, baseline }) => {
      const id = await PM.projectOps.create({ name: 'Caso límite', code: 'PRY-TEST-LIM', currency: 'COP', ...meta });
      const schedule = { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks };
      await PM.store.set(PM.paths.tool(id, 'schedule'), schedule);
      await PM.store.set(PM.paths.tool(id, 'costs'), costs);
      if (baseline) { const sched = PM.calc.computeSchedule(schedule, meta.start); await PM.store.set(PM.paths.baseline(id, 'b0'), { number: 0, label: 'LB0', date: meta.start, ...PM.calc.makeBaselineSnapshot({ includes: ['cost'], sched, wbs: { nodes: [] }, costs }) }); }
      PM.selectProject(id, 'valor-ganado');
      return id;
    }, { meta, tasks, costs, baseline });
    const T = (id, duration, cost, progress, deps = []) => ({ id, name: 'Actividad ' + id, wbsId: null, duration, cost, progress, deps: deps.map((d) => ({ id: d, type: 'FS', lag: 0 })) });
    const noCosts = { actuals: [], statusUpdates: [], reserves: { contingency: 0, management: 0 } };

    /* proyecto terminado: el cronograma ganado se mide hasta la terminación, no hasta la fecha de corte */
    await mk({ start: '2026-03-02', statusDate: '2026-09-30', budget: 3000000 }, [T('a', 10, 1000000, 100), T('b', 10, 2000000, 100, ['a'])], { ...noCosts, actuals: [{ id: 'x1', date: '2026-03-20', amount: 3000000, category: 'Equipos' }] }, true);
    await p.waitForSelector('[data-chart="curva-s"]');
    check('terminado: la interpretación da la fecha de terminación', norm(await p.locator('[data-note="es"]').innerText()).includes('terminó el 30 de marzo de 2026'), norm(await p.locator('[data-note="es"]').innerText()));
    check('terminado: aviso de EV en línea recta por falta de cortes', await p.locator('[data-role="no-cuts-hint"]').isVisible());
    await p.click('[data-role="no-cuts-hint"] button');
    await p.waitForTimeout(200);
    check('terminado: el aviso lleva a la pestaña Avance', (await p.getAttribute('[role="tabpanel"]', 'data-tab')) === 'avance');
    await p.click('[data-view="valor-ganado"] .tab:has-text("Indicadores")');
    await p.waitForTimeout(200);
    const spiT = norm(await p.locator('[data-metric="spiT"] .evm-metric-value').innerText());
    const fin = norm(await p.locator('[data-metric="forecastFinish"]').innerText());
    check('terminado: SPI(t) = PD / duración real (1,00) y «Fin del trabajo»', spiT === '1,00' && fin.includes('Fin del trabajo') && fin.includes('30 mar 2026'), [spiT, fin]);

    /* plan corto (menos de tres meses): marcas semanales en el eje x */
    await mk({ start: '2026-08-03', statusDate: '2026-08-20', budget: 0 }, [T('a', 12, 4000000, 50), T('b', 8, 2000000, 0, ['a'])], noCosts, false);
    await p.waitForTimeout(300);
    await p.click('[data-view="valor-ganado"] .tab:has-text("Curva S")');
    await p.waitForSelector('[data-chart="curva-s"]');
    const xl = await p.$$eval('[data-chart="curva-s"] text', (ts) => ts.map((t) => t.textContent).filter((x) => /^\d{2} [a-z]{3}$/.test(x)));
    check('plan corto: el eje x usa semanas (al menos 3 etiquetas)', xl.length >= 3, xl);
    check('sin línea base: botón «Establecer línea base»', (await p.locator('[data-source="schedule"] button:has-text("Establecer línea base")').count()) === 1);

    /* navegación con pestaña: PM.navigate('valor-ganado', {tab}) abre la pestaña aunque se repita */
    await p.evaluate(() => PM.navigate('valor-ganado', { tab: 'reales' }));
    await p.waitForTimeout(200);
    const t1 = await p.getAttribute('[role="tabpanel"]', 'data-tab');
    await p.click('[data-view="valor-ganado"] .tab:has-text("Curva S")');
    await p.evaluate(() => PM.navigate('valor-ganado', { tab: 'reales' }));
    await p.waitForTimeout(200);
    check('navegación: PM.navigate con {tab} abre la pestaña (también al repetirla)', t1 === 'reales' && (await p.getAttribute('[role="tabpanel"]', 'data-tab')) === 'reales');

    /* actividades sin presupuesto */
    await mk({ start: '2026-08-03', statusDate: '2026-08-20' }, [T('a', 5, 0, 0)], noCosts, false);
    await p.waitForTimeout(400);
    await p.click('[data-view="valor-ganado"] .tab:has-text("Curva S")');
    await p.waitForTimeout(150);
    check('sin presupuesto: Empty que pide asignar costos en el cronograma', await p.locator('.empty button:has-text("Asignar costos en el cronograma")').isVisible());
    await p.evaluate(() => PM.setState({ canWrite: false }));
    await p.waitForTimeout(150);
    check('sin presupuesto en modo lectura: el botón solo navega («Ir al cronograma»)', await p.locator('.empty button:has-text("Ir al cronograma")').isVisible());
    check('casos límite: sin errores', app.errors.length === 0 && (await errorCards(p)).length === 0, app.errors.slice(0, 3));
  } catch (e) {
    check('casos límite: excepción', false, String(e && e.stack || e).slice(0, 800));
  }
  await app.browser.close();
}

/* ---------- registro de costos grande (db simulada, límite de 256 KiB por documento)
   Regresión: con 300 actividades, cada corte guardaba el % de todas (≈ 5 KiB por corte); con unos 30 cortes y 500 costos
   reales tools/costs pasaba de 256 KiB y desde ahí ningún corte ni costo real se guardaba, aunque la vista los mostrara. */
{
  const require = createRequire(import.meta.url);
  let playwright; try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
  const LIB = readFileSync(resolve(root, 'vendor/htm-preact-standalone.umd.js'), 'utf8');
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'es-CO', timezoneId: 'America/Bogota' });
  await installClaudeMock(context, { canWrite: true, owner: true });
  const p = await context.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + (e.stack || e.message)));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route('**/*', (route) => { const u = route.request().url(); if (u.includes('htm@3.1.1') || u.includes('htm-preact')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: LIB }); if (u.startsWith('file:')) return route.continue(); return route.abort(); });
  try {
    await p.goto(pathToFileURL(resolve(root, file)).href);
    await p.waitForFunction(() => window.PM && PM.getState && PM.getState().mode === 'db', null, { timeout: 15000 });
    await p.evaluate(() => { window.__toasts = []; const t = PM.toast; PM.toast = (m, o) => { window.__toasts.push(String(m)); return t(m, o); }; });
    const pid = await p.evaluate(async () => {
      const id = await PM.projectOps.create({ name: 'Registro de costos grande', code: 'PRY-CAP', start: '2026-01-05', statusDate: '2026-10-02', currency: 'COP' });
      const tasks = []; for (let i = 0; i < 300; i++) tasks.push({ id: PM.uid('t'), name: 'Actividad ' + i, wbsId: null, duration: 10 + (i % 20), deps: [], start: PM.date.add('2026-01-05', Math.floor(i * 0.9)), cost: 1000000 + i * 1000, progress: 0 });
      const schedule = { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks };
      const sched = PM.calc.computeSchedule(schedule, '2026-01-05');
      /* 31 cortes semanales guardados a la manera anterior: el % de todas las actividades en cada corte */
      const cuts = []; let d = '2026-01-09';
      for (let k = 0; k < 31; k++) { const progress = {}; for (const t of sched.tasks) progress[t.id] = Math.round(PM.calc.plannedFraction(sched.cal, t.startDate, t.finishDate, false, d) * 1000) / 10; cuts.push({ id: PM.uid('su'), date: d, progress, note: '' }); d = PM.date.add(d, 7); }
      for (const t of tasks) t.progress = Math.min(100, cuts[30].progress[t.id] + 5);
      const actuals = []; for (let i = 0; i < 500; i++) actuals.push({ id: PM.uid('ac'), date: PM.date.add('2026-01-05', Math.floor(i / 2)), amount: 250000 + i, taskId: tasks[i % 300].id, wbsId: null, category: 'Mano de obra', description: 'Nómina de la cuadrilla de montaje, semana ' + i + ' (soporte)', document: 'NOM-' + String(i).padStart(5, '0') });
      let costs = { actuals, statusUpdates: cuts, reserves: { contingency: 0, management: 0 } };
      const size = (o) => new TextEncoder().encode(JSON.stringify(o)).length;
      while (size(costs) > 251.5 * 1024) costs = { ...costs, actuals: costs.actuals.slice(0, -1) };
      await PM.store.set(PM.paths.tool(id, 'schedule'), schedule);
      await PM.store.set(PM.paths.tool(id, 'costs'), costs);
      PM.selectProject(id, 'valor-ganado');
      return id;
    });
    const info = (pid) => p.evaluate((pid) => {
      const c = window.__mock.store.get('projects/' + pid + '/tools/costs'); const s = window.__mock.store.get('projects/' + pid + '/tools/schedule');
      const sched = PM.calc.computeSchedule(s, '2026-01-05');
      const e = PM.calc.evm({ sched, costBaseline: null, costs: c, statusDate: '2026-10-02' });
      return { bytes: new TextEncoder().encode(JSON.stringify(c)).length, cuts: c.statusUpdates.length, actuals: c.actuals.length, evPts: e.evPoints.map((x) => [x.date, Math.round(x.ev)]), keys: c.statusUpdates.reduce((n, u) => n + Object.keys(u.progress || {}).length, 0) };
    }, pid);
    const tabCount = async (label) => norm(await p.locator(`[data-view="valor-ganado"] .tab:has-text("${label}")`).innerText()).replace(label, '').trim();
    const before = await info(pid);
    await p.waitForSelector('[data-view="valor-ganado"] .tab');
    await p.click('[data-view="valor-ganado"] .tab:has-text("Avance")');
    await p.waitForSelector('#evm-cut-date');
    await p.click('button:has-text("Registrar corte de avance")');
    await p.waitForTimeout(1800);
    let after = await info(pid);
    let toasts = await p.evaluate(() => window.__toasts);
    check('costos grandes: el corte nuevo se guarda (antes se perdía con el documento a 251 KiB)', after.cuts === 32 && (await tabCount('Avance')) === '32' && !toasts.some((t) => /No se pudo guardar|No se guardó/.test(t)), { before: before.cuts, after: after.cuts, toasts });
    check('costos grandes: los cortes se guardan compactos (solo los cambios)', after.bytes < before.bytes * 0.75 && after.keys < before.keys / 2, { antes: Math.round(before.bytes / 1024) + ' KiB', despues: Math.round(after.bytes / 1024) + ' KiB', claves: [before.keys, after.keys] });
    check('costos grandes: el EV de cada corte anterior no cambia al compactar', JSON.stringify(after.evPts.slice(0, before.evPts.length - 1)) === JSON.stringify(before.evPts.slice(0, -1)), [before.evPts.length, after.evPts.length]);
    await p.click('[data-view="valor-ganado"] .tab:has-text("Costos reales")');
    await p.waitForTimeout(300);
    await p.click('[data-role="actuals"] .card-head button:has-text("Agregar costo real")');
    await p.waitForTimeout(1800);
    after = await info(pid);
    check('costos grandes: el costo real nuevo se guarda', after.actuals === before.actuals + 1 && (await tabCount('Costos reales')) === String(before.actuals + 1), [before.actuals, after.actuals]);
    check('costos grandes: sin aviso de capacidad mientras sobra espacio', (await p.locator('[data-role="costs-capacity"]').count()) === 0);

    /* cerca del límite: aviso; en el límite: la escritura no se aplica (sin filas fantasma) y se explica por qué */
    const fill = (target) => p.evaluate(async ({ pid, target }) => {
      const path = PM.paths.tool(pid, 'costs'); const c = await PM.store.get(path);
      const size = (o) => new TextEncoder().encode(JSON.stringify(o)).length;
      const actuals = [...c.actuals]; let i = 0;
      while (size({ ...c, actuals }) < target - 400) actuals.push({ id: 'fill' + i, date: '2026-09-' + String(1 + (i % 28)).padStart(2, '0'), amount: 1000, taskId: null, wbsId: null, category: 'Otros', description: 'Registro de relleno ' + i++, document: 'R-' + i });
      await PM.store.set(path, { ...c, actuals });
      return actuals.length;
    }, { pid, target });
    await fill(220 * 1024);
    await p.waitForTimeout(500);
    const warn = await p.locator('[data-role="costs-capacity"]');
    check('costos grandes: aviso al pasar de 200 KiB', (await warn.count()) === 1 && (await warn.getAttribute('data-tone')) === 'warn' && norm(await warn.innerText()).includes('de 256 KiB') && norm(await warn.innerText()).includes('cortes de avance. Exporta'), (await warn.count()) ? norm(await warn.innerText()) : null);
    const nFull = await fill(255.4 * 1024);
    await p.waitForTimeout(500);
    const rowsBefore = await tabCount('Costos reales');
    await p.evaluate(() => { window.__toasts = []; });
    await p.click('[data-role="actuals"] .card-head button:has-text("Agregar costo real")');
    await p.waitForTimeout(1500);
    after = await info(pid);
    toasts = await p.evaluate(() => window.__toasts);
    check('costos grandes: en el límite, «Agregar costo real» no deja una fila sin guardar', after.actuals === nFull && (await tabCount('Costos reales')) === rowsBefore, { stored: after.actuals, nFull, tab: await tabCount('Costos reales'), rowsBefore });
    check('costos grandes: en el límite, aviso claro (sin el error genérico de la plataforma)', toasts.length === 1 && toasts[0].includes('No se guardó el cambio') && toasts[0].includes('256 KiB'), toasts);
    check('costos grandes: aviso de registro lleno', (await p.getAttribute('[data-role="costs-capacity"]', 'data-tone')) === 'crit');
    await p.click('[data-view="valor-ganado"] .tab:has-text("Avance")');
    await p.waitForSelector('#evm-cut-date');
    await p.fill('#evm-cut-note', 'Corte que no cabe');
    await p.evaluate(() => { window.__toasts = []; });
    await p.click('button:has-text("Registrar corte de avance")');
    await p.waitForSelector('.modal');
    await p.click('.modal button:has-text("Reemplazar corte")');
    await p.waitForTimeout(1500);
    toasts = await p.evaluate(() => window.__toasts);
    const cutsNow = await info(pid);
    check('costos grandes: en el límite, el corte no se registra ni se anuncia como registrado', !toasts.some((t) => t.startsWith('Corte de avance registrado')) && toasts.some((t) => t.includes('No se guardó el cambio')) && (await p.inputValue('#evm-cut-note')) === 'Corte que no cabe' && cutsNow.cuts === 32, { toasts, cuts: cutsNow.cuts });
    check('costos grandes: sin errores', errs.length === 0 && (await errorCards(p)).length === 0 && !(await p.evaluate(() => window.__mock.errors)).length, errs.slice(0, 3));
  } catch (e) {
    check('costos grandes: excepción', false, String(e && e.stack || e).slice(0, 800));
  }
  await browser.close();
}

/* ---------- 400 px y tema oscuro */
for (const mode of [{ name: 'móvil 400 px', width: 400, height: 860, dark: false, tag: 'm' }, { name: 'tema oscuro', width: 1360, height: 900, dark: true, tag: 'dark' }]) {
  const app = await openApp({ file, width: mode.width, height: mode.height, dark: mode.dark });
  try {
    const pid = await createProject(app.page, { start: '2026-08-03', statusDate: '2026-10-02', budget: 480000000 });
    await seed(app.page, pid);
    await gotoView(app.page, 'valor-ganado');
    await app.page.waitForSelector('[data-chart="curva-s"]');
    let worst = 0;
    for (const label of ['Curva S', 'Indicadores', 'Costos reales', 'Avance', 'Presupuesto', 'Por actividad']) {
      await app.page.click(`[data-view="valor-ganado"] .tab:has-text("${label}")`);
      await app.page.waitForTimeout(300);
      worst = Math.max(worst, await horizontalOverflow(app.page));
      if (shots) await app.page.screenshot({ path: join(shots, `evm-${mode.tag}-${label.replace(/\s/g, '_')}.png`), fullPage: true });
    }
    check(mode.name + ': sin desborde horizontal en ninguna pestaña', worst <= 1, worst);
    if (mode.tag === 'm') {
      await app.page.click('[data-view="valor-ganado"] .tab:has-text("Curva S")');
      await app.page.waitForTimeout(250);
      const w = await app.page.evaluate(() => { const s = document.querySelector('[data-chart="curva-s"]'); return { svg: s.getBoundingClientRect().width, host: s.parentElement.clientWidth }; });
      check(mode.name + ': la curva S cabe en el ancho', w.svg <= w.host + 1, w);
    }
    check(mode.name + ': sin errores', app.errors.length === 0 && (await errorCards(app.page)).length === 0, app.errors.slice(0, 3));
  } catch (e) {
    check(mode.name + ': excepción', false, String(e && e.stack || e).slice(0, 600));
  }
  await app.browser.close();
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

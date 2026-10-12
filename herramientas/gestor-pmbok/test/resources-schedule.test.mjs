// Pruebas de interacción de la integración del catálogo de recursos con el cronograma (módulo 40, SPEC §10):
// vista «recursos» (pestañas Catálogo, Histograma y Consumo), editor de actividad (selector del catálogo, crear recurso,
// formas de costeo, comparación con la línea base), columnas de costo del Gantt y de Actividades, CSV, solo lectura,
// teclado, tema oscuro, 400 px y rendimiento con 320 recursos y 500 actividades.
// Uso: node test/resources-schedule.test.mjs --file <página con todos los módulos> [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, horizontalOverflow, errorCards } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 900))); };

const { browser, page, errors } = await openApp({ file });
const shot = async (name, opts = {}) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true, ...opts }); };
const sleep = (ms) => page.waitForTimeout(ms);
const money = (n) => '$ ' + new Intl.NumberFormat('es-CO').format(n);

/* ---------- datos: catálogo con tipos de trabajo y consumibles, actividades con las cuatro formas de costeo */
const CATALOG = {
  preset: 'general', types: [],
  items: [
    { id: 'r1', code: 'REC-001', name: 'Cuadrilla de montaje', typeId: 'humano', unit: 'cuadrilla', availability: 2, unitCost: 800000, planned: true, status: 'disponible', absences: [{ id: 'ab1', from: '2026-08-12', to: '2026-08-13', note: 'Capacitación en alturas' }] },
    { id: 'r2', code: 'REC-002', name: 'Camión grúa', typeId: 'maquinaria', unit: 'equipo', availability: 1, unitCost: 1500000, availableFrom: '2026-08-03', availableTo: '2026-08-21', planned: true, status: 'disponible', absences: [] },
    { id: 'r3', code: 'REC-003', name: 'Anclajes químicos', typeId: 'material', unit: 'unidad', availability: 80, unitCost: 25000, planned: true, status: 'disponible', absences: [] },
    { id: 'r4', code: 'REC-004', name: 'Concreto 3.000 psi', typeId: 'material', unit: 'm³', availability: null, unitCost: null, planned: true, status: 'planificado', absences: [] },
    { id: 'r5', code: 'REC-005', name: 'Ingeniero de diseño', typeId: 'humano', unit: 'persona', availability: 1, unitCost: 600000, planned: true, status: 'disponible', absences: [] },
  ],
};
const T = (id, name, duration, deps, extra = {}) => ({ id, name, wbsId: null, duration, milestone: duration === 0, start: null, deps, progress: 0, cost: 0, resources: [], responsible: '', actualStart: null, actualFinish: null, notes: '', ...extra });
const SCHEDULE = { settings: { workweek: 5, holidaysCO: true, extraHolidays: [], resourceLimits: { 'Topógrafo': 0.5 } }, tasks: [
  T('a', 'Diseño del andamio', 5, [], { cost: 2500000, resources: [{ resourceId: 'r5', name: 'Ingeniero de diseño', units: 1 }, { name: 'Topógrafo', units: 1 }] }),
  T('b', 'Montaje niveles 1–5', 10, [{ id: 'a', type: 'FS', lag: 0 }], { cost: 15000000, costMode: 'recursos', resources: [{ resourceId: 'r1', name: 'Cuadrilla de montaje', units: 2 }, { resourceId: 'r3', name: 'Anclajes químicos', units: 1, qty: 100 }] }),
  T('c', 'Izaje de piezas', 4, [{ id: 'a', type: 'FS', lag: 0 }], { cost: 4000000, costMode: 'mixto', costFixed: 1000000, costCategory: 'Equipos', resources: [{ resourceId: 'r2', name: 'Camión grúa', units: 1 }, { resourceId: 'r4', name: 'Concreto 3.000 psi', units: 1, qty: 12 }] }),
  T('d', 'Pintura de barandas', 3, [], { cost: 1000000, costMode: 'unitario', quantity: 120, qtyUnit: 'm²', unitPrice: 18500, costCategory: 'Subcontratos' }),
  T('e', 'Montaje adicional', 3, [{ id: 'b', type: 'FS', lag: 0 }], { cost: 900000, resources: [{ resourceId: 'r2', name: 'Camión grúa', units: 1 }] }),
] };
const BASELINE = { number: 0, label: 'LB0', date: '2026-08-01', includes: ['schedule', 'cost'], note: '', changeRef: null,
  schedule: { start: '2026-08-03', finish: '2026-08-28', tasks: [] },
  cost: { bac: 23400000, contingency: 1000000, management: 500000, tasks: [{ id: 'a', name: 'Diseño del andamio', cost: 2500000 }, { id: 'b', name: 'Montaje niveles 1–5', cost: 16000000 }, { id: 'c', name: 'Izaje de piezas', cost: 7000000 }, { id: 'd', name: 'Pintura de barandas', cost: 2220000 }] } };

try {
  const pid = await createProject(page, { start: '2026-08-03', end: '2026-09-30', statusDate: '2026-08-14' });
  await page.evaluate(async ({ pid, CATALOG, SCHEDULE, BASELINE }) => {
    await PM.store.set(PM.paths.tool(pid, 'resources'), CATALOG);
    await PM.store.set(PM.paths.tool(pid, 'schedule'), SCHEDULE);
    await PM.store.set(PM.paths.baseline(pid, 'b0'), BASELINE);
  }, { pid, CATALOG, SCHEDULE, BASELINE });
  const stored = async (tool = 'schedule', wait = 950) => { await sleep(wait); return page.evaluate(async ({ pid, tool }) => PM.store.get(PM.paths.tool(pid, tool)), { pid, tool }); };
  const effCost = (id) => page.evaluate(({ pid, id }) => { /* el costo efectivo del modelo: PM.res.applyCosts sobre lo guardado */ return PM.store.get(PM.paths.tool(pid, 'schedule')).then(async (s) => { const r = await PM.store.get(PM.paths.tool(pid, 'resources')); const e = PM.res.applyCosts(s, r); return (e.tasks.find((t) => t.id === id) || {}).cost; }); }, { pid, id });
  const tab = (name) => page.locator('.tabs .tab', { hasText: name });

  /* =============== vista Recursos: pestañas */
  await page.evaluate(() => { PM.prefs.set('rec.tab', null); });
  await gotoView(page, 'recursos');
  const tabNames = await page.$$eval('.tabs .tab', (els) => els.map((e) => e.textContent.replace(/\d+$/, '').trim()));
  check('recursos: pestañas Catálogo, Histograma y Consumo', JSON.stringify(tabNames) === JSON.stringify(['Catálogo', 'Histograma', 'Consumo']), tabNames);
  check('recursos: abre en «Catálogo» con PM.ResourceCatalog', (await tab('Catálogo').getAttribute('aria-selected')) === 'true' && (await page.locator('[data-rcat="1"]').count()) === 1);
  const counts = await page.$$eval('.tabs .tab .count', (els) => els.map((e) => e.textContent.trim()));
  check('recursos: conteos (6 en el catálogo con el virtual, 4 de trabajo, 2 consumibles)', JSON.stringify(counts) === JSON.stringify(['6', '4', '2']), counts);
  await shot('recursos-catalogo');

  /* --------------- Histograma */
  await tab('Histograma').click();
  await page.waitForSelector('.sched-reslist');
  const resRows = async () => page.$$eval('.sched-reslist tbody tr', (trs) => trs.map((tr) => ({ name: tr.getAttribute('data-res'), type: tr.getAttribute('data-type'), status: tr.lastElementChild.previousElementSibling.innerText.trim() })));
  let rr = await resRows();
  check('histograma: solo recursos de trabajo (sin consumibles)', rr.length === 4 && !rr.some((r) => /Anclajes|Concreto/.test(r.name)), rr);
  check('histograma: tipo de cada recurso del catálogo (y «Sin clasificar» para el nombre suelto)', rr.find((r) => r.name === 'Cuadrilla de montaje').type === 'humano' && rr.find((r) => r.name === 'Camión grúa').type === 'maquinaria' && rr.find((r) => r.name === 'Topógrafo').type === 'sin-clasificar', rr);
  check('histograma: sobreasignación por ausencia (cuadrilla), fuera del rango (grúa) y límite de datos de antes (topógrafo)', ['Cuadrilla de montaje', 'Camión grúa', 'Topógrafo'].every((n) => rr.find((r) => r.name === n).status === 'Sobreasignado') && rr.find((r) => r.name === 'Ingeniero de diseño').status === 'Dentro del límite', rr);
  const conf = await page.$$eval('.sched-conflicts tbody tr', (trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.trim())));
  const confOf = (n) => conf.filter((c) => c[1] === n);
  check('sobreasignaciones: cuadrilla 2 días (12 y 13 ago, ausencia) con disponible 0', confOf('Cuadrilla de montaje').length === 1 && confOf('Cuadrilla de montaje')[0][4] === '2' && confOf('Cuadrilla de montaje')[0][3].startsWith('0') && confOf('Cuadrilla de montaje')[0][5] === '12/08/2026', confOf('Cuadrilla de montaje'));
  check('sobreasignaciones: camión grúa 3 días después de su rango (26 a 28 ago)', confOf('Camión grúa').length === 1 && confOf('Camión grúa')[0][4] === '3' && confOf('Camión grúa')[0][5] === '26/08/2026' && confOf('Camión grúa')[0][6].includes('Montaje adicional'), confOf('Camión grúa'));
  check('disponibilidad del catálogo con rango y ausencias anotada', (await page.locator('.sched-reslist tr[data-res="Cuadrilla de montaje"] .sched-avsub').innerText()).includes('1 ausencia') && (await page.locator('.sched-reslist tr[data-res="Camión grúa"] .sched-avsub').innerText()).includes('Del 03 ago al'));
  /* un recurso: la línea de disponibilidad baja a 0 en la semana de la ausencia y la parte sobreasignada va en rojo */
  await page.locator('.sched-reslist tr[data-res="Cuadrilla de montaje"] button.sched-resbtn').click();
  await sleep(150);
  check('histograma de un recurso: botón con aria-pressed y periodo sobreasignado', (await page.locator('.sched-reslist tr[data-res="Cuadrilla de montaje"] button.sched-resbtn').getAttribute('aria-pressed')) === 'true' && (await page.locator('.sched-hist g[data-over="1"]').count()) === 1 && (await page.locator('.sched-hist path.sched-hist-avail').count()) === 1);
  const availPath = await page.getAttribute('.sched-hist path.sched-hist-avail', 'd');
  check('línea de disponibilidad escalonada (baja con la ausencia)', (availPath.match(/V/g) || []).length >= 2, availPath);
  await shot('recursos-histograma-uno');
  await page.locator('.sched-reslist tr[data-res="Cuadrilla de montaje"] button.sched-resbtn').click();
  /* filtro por tipo */
  await page.selectOption('select[aria-label="Filtrar por tipo de recurso"]', 'maquinaria');
  await sleep(150);
  rr = await resRows();
  check('filtro por tipo de recurso: solo «Maquinaria y equipo»', rr.length === 1 && rr[0].name === 'Camión grúa', rr);
  check('filtro por tipo: histograma, sobreasignaciones y matriz filtrados', (await page.locator('.sched-conflicts tbody tr').count()) === 1 && (await page.locator('.sched-matrix thead th.u').count()) === 1);
  const typeOpts = await page.$$eval('select[aria-label="Filtrar por tipo de recurso"] option', (os) => os.map((o) => o.textContent));
  check('filtro por tipo: solo tipos con recursos de trabajo asignados', JSON.stringify(typeOpts) === JSON.stringify(['Todos los tipos de recurso', 'Humano (personal)', 'Maquinaria y equipo', 'Sin clasificar']), typeOpts);
  await page.click('button:has-text("Quitar filtro")');
  await sleep(150);
  check('quitar el filtro', (await resRows()).length === 4);
  await shot('recursos-histograma');

  /* editar «Disponible»: se guarda en el catálogo (con Intro) */
  const cuadInput = page.locator('input[aria-label="Disponibilidad de Cuadrilla de montaje"]');
  await cuadInput.fill('3');
  await cuadInput.press('Enter');
  let res = await stored('resources');
  check('editar «Disponible» guarda la disponibilidad en el catálogo', res.items.find((x) => x.id === 'r1').availability === 3 && res.items.length === 5, res.items.map((x) => [x.name, x.availability]));
  /* un recurso virtual (solo nombre en el cronograma) se registra en el catálogo y el límite de antes deja de usarse */
  const topoInput = page.locator('input[aria-label="Disponibilidad de Topógrafo"]');
  await topoInput.fill('1');
  await topoInput.press('Tab');
  res = await stored('resources');
  let sch = await stored('schedule', 50);
  const topo = res.items.find((x) => x.name === 'Topógrafo');
  check('recurso virtual: se crea en el catálogo con código y la disponibilidad escrita', !!topo && topo.availability === 1 && /^REC-006$/.test(topo.code) && !String(topo.id).startsWith('v:') && res.items.length === 6, res.items.map((x) => [x.code, x.name, x.availability]));
  check('resourceLimits de datos de antes: se quita la clave del recurso ya registrado', !('Topógrafo' in (sch.settings.resourceLimits || {})), sch.settings.resourceLimits);
  await sleep(200);
  rr = await resRows();
  check('topógrafo deja de estar sobreasignado (1 por día disponible)', rr.find((r) => r.name === 'Topógrafo').status === 'Dentro del límite', rr);
  check('un solo registro del recurso aunque se confirme dos veces', (await stored('resources', 300)).items.filter((x) => x.name === 'Topógrafo').length === 1);

  /* --------------- Consumo */
  await tab('Consumo').click();
  await page.waitForSelector('.sched-cons-tbl');
  const consRows = await page.$$eval('.sched-cons-tbl tbody tr', (trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.trim())));
  const anc = consRows.find((r) => r[0].startsWith('Anclajes'));
  const con = consRows.find((r) => r[0].startsWith('Concreto'));
  check('consumo: anclajes 100 unidad × $ 25.000 = $ 2.500.000, existencia 80', anc && anc[2] === '100' && anc[3] === 'unidad' && anc[4] === money(25000) && anc[5] === money(2500000) && anc[6] === '80', anc);
  check('consumo: aviso de existencia insuficiente (faltan 20)', anc && anc[8].includes('Faltan 20 unidades') && (await page.locator('[data-cons-short="1"]').innerText()).includes('Anclajes químicos (faltan 20 unidades)'), anc);
  check('consumo: concreto 12 m³ sin costo unitario y sin existencia registrada', con && con[2] === '12' && con[3] === 'm³' && con[4].includes('Sin costo') && con[8].includes('Sin existencia'), con);
  check('consumo: actividades del consumible', anc[7].includes('Montaje niveles 1–5'));
  const distOf = async (name) => page.$$eval(`.sched-dist tbody tr[data-dist="${name}"] td`, (tds) => tds.slice(1).map((td) => td.innerText.trim()));
  await page.locator('.btn-group[aria-label="Periodo del consumo"] button', { hasText: 'Semana' }).click();
  await sleep(150);
  let dAnc = await distOf('Anclajes químicos');
  const weekHeads = await page.$$eval('.sched-dist thead th', (ths) => ths.map((th) => th.innerText.trim()));
  check('consumo por semana: 40 + 40 + 20 (repartido en los días hábiles; 17 ago festivo)', JSON.stringify(dAnc) === JSON.stringify(['40', '40', '20', '100']) && weekHeads.slice(1, 4).join('|') === '10 ago|17 ago|24 ago', { dAnc, weekHeads });
  check('consumo por semana: concreto 12 m³ en la semana del 10 ago', JSON.stringify(await distOf('Concreto 3.000 psi')) === JSON.stringify(['12', '—', '—', '12']));
  await page.locator('.btn-group[aria-label="Mostrar en la distribución"] button', { hasText: 'Costo' }).click();
  await sleep(150);
  dAnc = await distOf('Anclajes químicos');
  check('consumo en costo por semana: $ 1.000.000, $ 1.000.000 y $ 500.000', JSON.stringify(dAnc) === JSON.stringify([money(1000000), money(1000000), money(500000), money(2500000)]), dAnc);
  const footCons = await page.$$eval('.sched-dist tfoot td', (tds) => tds.map((td) => td.innerText.trim()));
  check('consumo en costo: totales por periodo', footCons[1] === money(1000000) && footCons[footCons.length - 1] === money(2500000), footCons);
  await page.locator('.btn-group[aria-label="Periodo del consumo"] button', { hasText: 'Mes' }).click();
  await sleep(150);
  dAnc = await distOf('Anclajes químicos');
  check('consumo por mes: todo en agosto', JSON.stringify(dAnc) === JSON.stringify([money(2500000), money(2500000)]), dAnc);
  check('consumo: gráfico de costo por periodo', (await page.locator('svg.sched-cons-svg g[data-period]').count()) === 1 && (await page.getAttribute('svg.sched-cons-svg g[data-period]', 'data-value')) === '2500000');
  await page.selectOption('select[aria-label="Consumible del gráfico"]', { label: 'Concreto 3.000 psi (cantidad)' });
  await sleep(150);
  check('consumo: gráfico de cantidad de un consumible', (await page.getAttribute('svg.sched-cons-svg', 'aria-label')).includes('Concreto') && (await page.getAttribute('svg.sched-cons-svg g[data-period]', 'data-value')) === '12');
  await page.locator('.btn-group[aria-label="Mostrar en la distribución"] button', { hasText: 'Cantidad' }).click();
  await page.locator('.btn-group[aria-label="Periodo del consumo"] button', { hasText: 'Semana' }).click();
  await shot('recursos-consumo');

  /* pestaña recordada y params.tab */
  await gotoView(page, 'tablero');
  await gotoView(page, 'recursos');
  check('recuerda la pestaña elegida (PM.prefs)', (await tab('Consumo').getAttribute('aria-selected')) === 'true');
  await page.evaluate(() => PM.navigate('recursos', { tab: 'histograma' }));
  await sleep(300);
  check('params.tab abre la pestaña pedida', (await tab('Histograma').getAttribute('aria-selected')) === 'true' && (await page.locator('.sched-reslist').count()) === 1);
} catch (e) {
  check('excepción', false, String(e && e.stack || e));
} finally {
  check('sin tarjetas de error', (await errorCards(page)).length === 0, await errorCards(page));
  check('sin errores de consola', errors.length === 0, errors);
  await browser.close();
}
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

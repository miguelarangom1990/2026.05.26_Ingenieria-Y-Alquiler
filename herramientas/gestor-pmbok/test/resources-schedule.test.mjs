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
/* captura de un elemento (p. ej. una sección del diálogo, que tiene su propio desplazamiento) */
const shotEl = async (name, selector) => { if (shots) { const el = page.locator(selector).last(); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: join(shots, name + '.png') }); } };
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

  /* =============== Cronograma: columna de costo (Actividades) con el costo efectivo y la forma de costeo */
  await page.evaluate(() => { PM.prefs.set('sched.tab', 'actividades'); });
  await gotoView(page, 'cronograma');
  await page.waitForSelector('.sched-tbl tbody tr[data-id="b"]');
  const costCell = (id) => page.locator(`.sched-tbl tbody tr[data-id="${id}"] td[data-col="cost"]`);
  const cellTxt = async (id) => (await costCell(id).innerText()).replace(/\s+/g, ' ').trim();
  check('actividades: por recursos = 2 × 10 d × $ 800.000 + 100 × $ 25.000 = $ 18.500.000 con distintivo «Rec.»', (await cellTxt('b')) === 'Rec. ' + money(18500000), await cellTxt('b'));
  check('actividades: mixto = $ 1.000.000 + 4 d × $ 1.500.000 = $ 7.000.000 con «Mixto»', (await cellTxt('c')) === 'Mixto ' + money(7000000), await cellTxt('c'));
  check('actividades: precios unitarios = 120 × $ 18.500 = $ 2.220.000 con «P. U.»', (await cellTxt('d')) === 'P. U. ' + money(2220000), await cellTxt('d'));
  check('actividades: precio global sin distintivo y editable en la celda (las de antes no cambian)', (await cellTxt('a')) === money(2500000) && (await costCell('a').locator('.sched-cm').count()) === 0 && (await costCell('a').locator('button[aria-label^="Costo, fila 1: "]').getAttribute('aria-label')).endsWith('Editar'));
  check('actividades: costo calculado no se edita en la celda (botón que abre el editor)', (await costCell('b').locator('button').getAttribute('aria-label')).includes('calculado por recursos. Abrir el editor'));
  check('actividades: recursos en texto (trabajo ×unidades, consumible con cantidad y unidad en plural)', (await page.locator('.sched-tbl tbody tr[data-id="b"] td.wrap').last().innerText()).includes('Anclajes químicos 100 unidades'), await page.locator('.sched-tbl tbody tr[data-id="b"] td.wrap').last().innerText());

  /* --------------- editor de una actividad calculada por recursos */
  await costCell('b').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  const modal = page.locator('.modal').last();
  const row1 = modal.locator('[data-res-row="1"]'), row2 = modal.locator('[data-res-row="2"]');
  check('editor: el recurso de la fila es el del catálogo (combobox)', (await row1.locator('input[role="combobox"]').inputValue()) === 'Cuadrilla de montaje' && (await row1.locator('input[role="combobox"]').getAttribute('aria-label')) === 'Recurso 1');
  check('editor: trabajo → «Unidades por día»; costo de la línea 2 × 10 × $ 800.000', (await row1.locator('input[aria-label="Unidades del recurso 1"]').inputValue()) === '2' && (await row1.locator('[data-line-cost]').getAttribute('data-line-cost')) === '16000000');
  check('editor: consumible → «Cantidad» con su unidad; costo de la línea 100 × $ 25.000', (await row2.locator('input[aria-label="Cantidad del recurso 2 (unidad)"]').inputValue()) === '100' && (await row2.locator('.sched-te-unit').innerText()) === 'unidad' && (await row2.locator('[data-line-cost]').getAttribute('data-line-cost')) === '2500000');
  check('editor: fórmula de la línea del consumible con la unidad en plural (100 unidades × $ 25.000)', (await row2.locator('[data-line-cost]').getAttribute('title')) === '100 unidades × ' + money(25000) + ' = ' + money(2500000), await row2.locator('[data-line-cost]').getAttribute('title'));
  check('editor: datos del recurso del catálogo (código, tipo, costo)', (await row1.locator('.sched-te-meta').innerText()).includes('REC-001 · Humano (personal) · Trabajo · cuadrilla · ' + money(800000) + ' por día'));
  check('editor: forma de costeo «Calculado por recursos» con su explicación', await modal.locator('[data-cost-choice="recursos"] input').isChecked() && (await modal.locator('[data-cost-choice="recursos"]').innerText()).includes('unidades por día × días × costo por unidad-día'));
  const bd = await modal.locator('[data-cost-breakdown] tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.trim())));
  check('editor: desglose (recurso, cantidad, unidad, costo unitario, subtotal)', JSON.stringify(bd) === JSON.stringify([['Cuadrilla de montaje', '20', 'días-recurso', money(800000) + ' por día', money(16000000)], ['Anclajes químicos', '100', 'unidad', money(25000), money(2500000)]]), bd);
  check('editor: total calculado $ 18.500.000', (await modal.locator('[data-cost-total]').getAttribute('data-cost-total')) === '18500000');
  const blTxt = (await modal.locator('[data-cost-baseline]').innerText()).replace(/\s+/g, ' ');
  check('editor: comparación con la línea base (LB0 $ 16.000.000 · actual $ 18.500.000, +$ 2.500.000)', blTxt.includes('Línea base LB0: ' + money(16000000) + ' · actual: ' + money(18500000) + ' (+' + money(2500000) + ', por encima de la línea base)') && blTxt.includes('solo cambia con un cambio aprobado'), blTxt);
  await shot('editor-recursos');
  await shotEl('editor-recursos-sec', '.modal [data-te-resources]');
  await shotEl('editor-costo-sec', '.modal [data-te-cost]');
  /* cambiar a mixto: parte fija + recursos */
  await modal.locator('[data-cost-choice="mixto"]').click();
  await modal.locator('#te-cost-fixed').fill('500000');
  check('editor mixto: $ 500.000 + $ 18.500.000 = $ 19.000.000', (await modal.locator('[data-cost-total]').getAttribute('data-cost-total')) === '19000000' && (await modal.locator('[data-cost-baseline]').getAttribute('data-cost-diff')) === '3000000');
  await modal.locator('#te-cat').selectOption('Mano de obra');
  await modal.locator('button:has-text("Guardar cambios")').click();
  await page.waitForSelector('.modal', { state: 'detached' });
  sch = await stored();
  let tb = sch.tasks.find((t) => t.id === 'b');
  check('guardar mixto: costMode, costFixed y categoría; el precio global guardado no cambia', tb.costMode === 'mixto' && tb.costFixed === 500000 && tb.costCategory === 'Mano de obra' && tb.cost === 15000000, tb);
  check('guardar: asignaciones con resourceId, unidades y cantidad', JSON.stringify(tb.resources) === JSON.stringify([{ resourceId: 'r1', name: 'Cuadrilla de montaje', units: 2 }, { resourceId: 'r3', name: 'Anclajes químicos', units: 1, qty: 100 }]), tb.resources);
  check('costo efectivo del modelo $ 19.000.000', (await effCost('b')) === 19000000 && (await cellTxt('b')) === 'Mixto ' + money(19000000), await cellTxt('b'));

  /* --------------- mixto con un recurso sin costo unitario: aviso */
  await costCell('c').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  check('editor mixto: aviso de recursos sin costo unitario', (await page.locator('.modal [data-cost-unpriced="1"]').innerText()).includes('Concreto 3.000 psi') && (await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total')) === '7000000');
  check('editor: línea sin costo unitario y acción para completarlo en el catálogo', (await page.locator('.modal [data-res-row="2"] [data-line-cost]').innerText()).includes('Sin costo') && (await page.locator('.modal [data-res-row="2"] button:has-text("Completar el costo en el catálogo")').count()) === 1);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });

  /* --------------- precios unitarios */
  await costCell('d').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  check('editor unitario: cantidad, unidad y precio unitario', (await page.locator('.modal #te-qty').inputValue()) === '120' && (await page.locator('.modal #te-qty-unit').inputValue()) === 'm²' && (await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total')) === '2220000');
  /* con el teclado: Tab hasta el precio y escribir reemplaza el valor (no se suma a «18.500») */
  await page.locator('.modal #te-qty-unit').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.type('20000');
  check('editor unitario: 120 m² × $ 20.000 = $ 2.400.000', (await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total')) === '2400000' && (await page.locator('.modal [data-cost-total]').innerText()).includes('120 m² × ' + money(20000)), [await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total'), await page.locator('.modal [data-cost-total]').innerText(), await page.locator('.modal #te-unit-price').inputValue()]);
  check('editor unitario: diferencia frente a la línea base (+$ 180.000)', (await page.locator('.modal [data-cost-baseline]').getAttribute('data-cost-diff')) === '180000');
  await shotEl('editor-unitario', '.modal [data-te-cost]');
  /* la unidad de la fórmula concuerda con la cantidad: «6 viajes», «1 viaje», «6 unidades» sin unidad escrita */
  const unitFormula = async () => (await page.locator('.modal [data-cost-total] .sub').innerText()).replace(/\s+/g, ' ').trim();
  await page.locator('.modal #te-qty-unit').fill('viaje');
  await page.locator('.modal #te-qty').fill('6');
  check('editor unitario: unidad en plural en la fórmula (6 viajes × $ 20.000)', (await unitFormula()) === '6 viajes × ' + money(20000) && (await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total')) === '120000', await unitFormula());
  await page.locator('.modal #te-qty').fill('1');
  check('editor unitario: unidad en singular con cantidad 1 (1 viaje × $ 20.000)', (await unitFormula()) === '1 viaje × ' + money(20000), await unitFormula());
  await page.locator('.modal #te-qty-unit').fill('');
  await page.locator('.modal #te-qty').fill('6');
  check('editor unitario: sin unidad escrita, «unidades» (6 unidades × $ 20.000)', (await unitFormula()) === '6 unidades × ' + money(20000), await unitFormula());
  await page.locator('.modal #te-qty-unit').fill('m²');
  await page.locator('.modal #te-qty').fill('120');
  check('editor unitario: los símbolos no cambian (120 m² × $ 20.000)', (await unitFormula()) === '120 m² × ' + money(20000) && (await page.locator('.modal [data-cost-total]').getAttribute('data-cost-total')) === '2400000', await unitFormula());
  await page.click('.modal button:has-text("Guardar cambios")');
  await page.waitForSelector('.modal', { state: 'detached' });
  check('guardar unitario: unitPrice y costo efectivo', (await stored()).tasks.find((t) => t.id === 'd').unitPrice === 20000 && (await effCost('d')) === 2400000);

  /* --------------- precio global: agregar recursos no cambia el costo; selector con teclado */
  await page.locator('.sched-tbl tbody tr[data-id="a"] button[aria-label="Editar Diseño del andamio"]').click();
  await page.waitForSelector('.modal [data-te-cost]');
  check('editor global: precio escrito a mano', await page.locator('.modal [data-cost-choice="global"] input').isChecked() && (await page.locator('.modal #te-cost').inputValue()) === '2.500.000');
  check('editor: recurso «sin clasificar» con acción para registrarlo', (await page.locator('.modal [data-res-row="2"] input[role="combobox"]').inputValue()) === 'Topógrafo' && (await page.locator('.modal [data-res-row="2"] .sched-te-meta').innerText()).includes('REC-006'));
  await page.click('.modal button:has-text("Agregar recurso")');
  await sleep(100);
  const pick3 = page.locator('.modal [data-res-row="3"] input[role="combobox"]');
  check('agregar recurso: el foco va al selector de la fila nueva', await pick3.evaluate((el) => el === document.activeElement));
  await page.keyboard.type('cuad');
  await sleep(100);
  check('selector: lista agrupada por tipo, filtrada al escribir', (await pick3.getAttribute('aria-expanded')) === 'true' && (await page.locator('.modal [role="listbox"] [role="group"]').count()) === 1 && (await page.locator('.modal [role="listbox"] .sched-pick-gh').first().textContent()).includes('Humano (personal)') && (await page.locator('.modal [role="listbox"] [role="option"][data-res-option]').count()) === 1, await page.locator('.modal [role="listbox"]').innerText());
  check('selector: opción activa anunciada con aria-activedescendant', !!(await pick3.getAttribute('aria-activedescendant')));
  await page.keyboard.press('Enter');
  check('selector: Intro elige el recurso del catálogo', (await pick3.inputValue()) === 'Cuadrilla de montaje' && (await pick3.getAttribute('aria-expanded')) === 'false');
  check('editor global: los recursos suman $ 7.000.000 (informativo) y el costo sigue en $ 2.500.000', (await page.locator('.modal [data-cost-info]').innerText()).includes(money(7000000)) && (await page.locator('.modal #te-cost').inputValue()) === '2.500.000' && (await page.locator('.modal [data-cost-total]').count()) === 0);
  /* teclado: flechas, Escape cierra solo la lista */
  await pick3.press('ArrowDown');
  await sleep(80);
  const nOpts = await page.locator('.modal [role="listbox"] [role="option"]').count();
  check('selector: con el recurso elegido, flecha abajo muestra todo el catálogo agrupado (6 recursos en 4 tipos)', nOpts === 6 && (await page.locator('.modal [role="listbox"] .sched-pick-gh').count()) === 4 && (await page.locator('.modal [role="listbox"] [aria-selected="true"]').innerText()).includes('Cuadrilla de montaje'), nOpts);
  await pick3.press('ArrowDown'); await pick3.press('ArrowDown');
  const actId = await pick3.getAttribute('aria-activedescendant');
  check('selector: flecha abajo mueve la opción activa', actId && actId.endsWith('-o2') && (await page.locator('#' + actId).getAttribute('class')).includes('is-active'), actId);
  await pick3.press('Escape');
  check('selector: Escape cierra la lista y no el diálogo', (await page.locator('.modal [role="listbox"]').count()) === 0 && (await page.locator('.modal').count()) === 1);
  await page.click('.modal button:has-text("Guardar cambios")');
  await page.waitForSelector('.modal', { state: 'detached' });
  sch = await stored();
  const ta = sch.tasks.find((t) => t.id === 'a');
  check('precio global: el costo no cambia al agregar recursos', ta.cost === 2500000 && !('costMode' in ta) && (await effCost('a')) === 2500000 && ta.resources.length === 3 && ta.resources[2].resourceId === 'r1', ta);
  check('el recurso registrado en el catálogo queda enlazado por resourceId', ta.resources[1].name === 'Topógrafo' && ta.resources[1].resourceId === (await stored('resources', 0)).items.find((x) => x.name === 'Topógrafo').id, ta.resources);

  /* --------------- crear recurso nuevo desde el editor (con línea base: pregunta si estaba en el plan) */
  await page.locator('.sched-tbl tbody tr[data-id="e"] button[aria-label="Editar Montaje adicional"]').click();
  await page.waitForSelector('.modal [data-te-cost]');
  await page.click('.modal button:has-text("Agregar recurso")');
  await sleep(100);
  const pick2 = page.locator('.modal [data-res-row="2"] input[role="combobox"]');
  await pick2.fill('Andamio multidireccional');
  await sleep(100);
  check('selector: nombre que no existe → «Crear recurso nuevo «…»…»', (await page.locator('.modal [data-res-create]').innerText()).includes('Crear recurso nuevo «Andamio multidireccional»') && (await page.locator('.modal [data-res-row="2"] [data-res-missing]').innerText()).includes('no está en el catálogo'));
  await pick2.press('End');
  await pick2.press('Enter');
  await page.waitForSelector('.modal [data-rcat-editor="1"]');
  check('crear recurso: PM.resourceDialog con el nombre escrito', (await page.locator('.modal #rce-name').inputValue()) === 'Andamio multidireccional');
  await page.locator('.modal [data-rcat-ask="1"] input[value="si"]').check();
  await page.locator('.modal #rce-cost').fill('50000');
  await page.locator('.modal button:has-text("Agregar recurso")').last().click();
  await page.waitForSelector('.modal [data-rcat-editor="1"]', { state: 'detached' });
  await sleep(150);
  check('crear recurso: queda elegido en la fila', (await pick2.inputValue()) === 'Andamio multidireccional' && (await page.locator('.modal [data-res-row="2"] .sched-te-meta').innerText()).includes('REC-007'));
  check('crear recurso: el foco vuelve a la cantidad de la fila', await page.locator('.modal [data-res-row="2"] input[aria-label="Unidades del recurso 2"]').evaluate((el) => el === document.activeElement));
  await page.locator('.modal input[aria-label="Unidades del recurso 2"]').fill('3');
  check('crear recurso: costo de la línea 3 × 3 d × $ 50.000 = $ 450.000', (await page.locator('.modal [data-res-row="2"] [data-line-cost]').getAttribute('data-line-cost')) === '450000');
  await page.click('.modal button:has-text("Guardar cambios")');
  await page.waitForSelector('.modal', { state: 'detached' });
  sch = await stored();
  res = await stored('resources', 0);
  const andamio = res.items.find((x) => x.name === 'Andamio multidireccional');
  const te = sch.tasks.find((t) => t.id === 'e');
  /* el catálogo se guarda compacto (PM.res.compact): «planificado» es el valor por defecto y puede no escribirse */
  check('crear recurso: guardado en el catálogo y asignado con resourceId', !!andamio && andamio.code === 'REC-007' && andamio.unitCost === 50000 && andamio.planned !== false && te.resources[1].resourceId === andamio.id && te.resources[1].units === 3, { andamio, r: te.resources });
  check('actividad global con recursos nuevos: su costo no cambia', te.cost === 900000 && (await effCost('e')) === 900000);

  /* --------------- consumible nuevo sin cantidad: pide la cantidad */
  await page.locator('.sched-tbl tbody tr[data-id="e"] button[aria-label="Editar Montaje adicional"]').click();
  await page.waitForSelector('.modal [data-te-cost]');
  await page.click('.modal button:has-text("Agregar recurso")');
  await sleep(100);
  const pick3e = page.locator('.modal [data-res-row="3"] input[role="combobox"]');
  await pick3e.fill('concreto');
  await pick3e.press('Enter');
  check('consumible elegido: el campo pasa a «Cantidad» (m³)', (await page.locator('.modal input[aria-label="Cantidad del recurso 3 (m³)"]').count()) === 1);
  await page.click('.modal button:has-text("Guardar cambios")');
  check('consumible sin cantidad: no guarda y explica qué falta', (await page.locator('.modal .sched-banner[role="alert"]').innerText()).includes('Escribe la cantidad de «Concreto 3.000 psi» (m³)'));
  await page.locator('.modal input[aria-label="Cantidad del recurso 3 (m³)"]').fill('4,5');
  await page.click('.modal button:has-text("Guardar cambios")');
  await page.waitForSelector('.modal', { state: 'detached' });
  check('consumible: cantidad guardada (qty)', (await stored()).tasks.find((t) => t.id === 'e').resources[2].qty === 4.5);

  /* --------------- CSV con forma de costeo y categoría */
  await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
  await page.click('button:has-text("Exportar CSV")');
  const csv = await page.evaluate(() => window.__dl[0]);
  const lines = csv.data.replace(/^﻿/, '').split('\r\n');
  const head = lines[0].split(';');
  const ix = (k) => head.indexOf(k);
  const rowB = lines.find((l) => l.includes('Montaje niveles 1–5')).split(';');
  const rowD = lines.find((l) => l.includes('Pintura de barandas')).split(';');
  check('CSV: columnas «Forma de costeo» y «Categoría de costo»', ix('Forma de costeo') === ix('Costo (COP)') + 1 && ix('Categoría de costo') === ix('Forma de costeo') + 1, head);
  check('CSV: costo efectivo, forma de costeo y categoría', rowB[ix('Costo (COP)')] === '19000000' && rowB[ix('Forma de costeo')] === 'Mixto (fijo + recursos)' && rowB[ix('Categoría de costo')] === 'Mano de obra' && rowD[ix('Forma de costeo')] === 'Precios unitarios' && rowD[ix('Categoría de costo')] === 'Subcontratos', { rowB, rowD });

  /* --------------- Gantt: columna de costo en pantallas anchas */
  await page.click('.tabs .tab:has-text("Gantt")');
  await page.waitForSelector('.sched-row[data-id="b"]');
  check('Gantt a 1360 px: sin columna de costo (no le quita espacio a la línea de tiempo)', (await page.locator('.sched-ghead > div').count()) === 8);
  await page.setViewportSize({ width: 1920, height: 1000 });
  await sleep(300);
  check('Gantt a 1920 px: columna de costo', (await page.locator('.sched-ghead > div').count()) === 9 && (await page.locator('.sched-ghead > div').last().innerText()) === 'Costo');
  check('Gantt: costo efectivo con distintivo (mixto) y precio global editable', (await page.locator('.sched-row[data-id="b"] [data-col="cost"]').innerText()).replace(/\s+/g, ' ').trim() === 'Mixto ' + money(19000000) && (await page.locator('.sched-row[data-id="a"] [data-col="cost"] button.sched-cell').getAttribute('aria-label')).startsWith('Costo, fila 1: ' + money(2500000)));
  const clippedCost = await page.$$eval('.sched-grid [data-col="cost"] .sched-txt, .sched-grid [data-col="cost"] .sched-ro', (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  check('Gantt: los costos (con su distintivo) no se recortan', clippedCost.length === 0, clippedCost);
  await page.locator('.sched-row[data-id="d"] [data-col="cost"] button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  check('Gantt: la celda de costo calculado abre el editor', (await page.locator('.modal [data-cost-choice="unitario"] input').isChecked()));
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });
  await shot('gantt-1920');
  const fullW = await page.evaluate(() => { const p = document.querySelector('.page'); const r = p.getBoundingClientRect(); return { w: r.width, vw: window.innerWidth }; });
  check('1920 px: la vista usa el ancho disponible', fullW.w > 1500, fullW);
  await page.setViewportSize({ width: 1360, height: 900 });

  /* --------------- solo lectura */
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.click('.tabs .tab:has-text("Actividades")');
  await costCell('b').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  check('solo lectura: el editor muestra el costo sin edición', (await page.locator('.modal input[role="combobox"]').first().isDisabled()) && (await page.locator('.modal [data-cost-choice="mixto"] input').isDisabled()) && (await page.locator('.modal button:has-text("Agregar recurso")').count()) === 0 && (await page.locator('.modal button:has-text("Guardar cambios")').count()) === 0 && (await page.locator('.modal button:has-text("Crear recurso nuevo")').count()) === 0);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.evaluate(() => PM.navigate('recursos', { tab: 'histograma' }));
  await page.waitForSelector('.sched-reslist');
  check('solo lectura: «Disponible» no se edita en el histograma', (await page.locator('input[aria-label^="Disponibilidad de"]').count()) === 0 && (await page.locator('.sched-reslist tr[data-res="Cuadrilla de montaje"]').innerText()).includes('3'));
  await page.evaluate(() => PM.setState({ canWrite: true }));

  /* --------------- tema oscuro y 400 px */
  await page.emulateMedia({ colorScheme: 'dark' });
  await sleep(200);
  await shot('recursos-histograma-oscuro');
  await page.click('.tabs .tab:has-text("Consumo")'); await sleep(200);
  await shot('recursos-consumo-oscuro');
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Actividades")');
  await costCell('b').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  await page.locator('.modal [data-res-row="1"] input[role="combobox"]').click();
  await sleep(100);
  await shotEl('editor-oscuro', '.modal [data-te-resources]');
  await shotEl('editor-oscuro-costo', '.modal [data-te-cost]');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 400, height: 860 });
  await gotoView(page, 'recursos');
  for (const name of ['Catálogo', 'Histograma', 'Consumo']) {
    await tab(name).click(); await sleep(250);
    const ov = await horizontalOverflow(page);
    check(`400 px sin desborde: recursos · ${name}`, ov <= 1, ov);
    await shot('recursos-400-' + name.toLowerCase());
  }
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Actividades")');
  await costCell('b').locator('button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  await page.locator('.modal [data-res-row="1"] input[role="combobox"]').click();
  await sleep(100);
  const modalOv = await page.evaluate(() => { const b = document.querySelector('.modal .modal-body'); return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, body: b.scrollWidth - b.clientWidth }; });
  check('400 px: el editor (con la lista abierta) no se desborda', modalOv.doc <= 1 && modalOv.body <= 1, modalOv);
  await shot('editor-400', { fullPage: false });
  await shotEl('editor-400-recursos', '.modal [data-te-resources]');
  await shotEl('editor-400-costo', '.modal [data-te-cost]');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.setViewportSize({ width: 1360, height: 900 });

  /* =============== rendimiento: 320 recursos y 500 actividades */
  const pidBig = await page.evaluate(async () => {
    const id = await PM.projectOps.create({ name: 'Proyecto grande de recursos', code: 'PRY-GR', start: '2026-01-05' });
    const types = ['humano', 'maquinaria', 'herramienta', 'material', 'transporte'];
    const items = Array.from({ length: 320 }, (_, k) => ({ id: 'q' + k, code: 'REC-' + String(k + 1).padStart(3, '0'), name: 'Recurso ' + (k + 1), typeId: types[k % 5], unit: k % 5 === 3 ? 'kg' : 'persona', availability: k % 5 === 3 ? 500 : 2, unitCost: 1000 * (k + 1), planned: k % 17 !== 0, absences: k % 7 ? [] : [{ id: 'x' + k, from: '2026-03-02', to: '2026-03-06' }] }));
    const tasks = Array.from({ length: 500 }, (_, t) => ({ id: 't' + t, name: 'Actividad ' + (t + 1), wbsId: null, duration: 1 + (t % 9), milestone: false, start: null, deps: t ? [{ id: 't' + (t - 1), type: 'SS', lag: t % 4 }] : [], progress: 0, cost: 100000, costMode: t % 3 ? 'recursos' : 'global', resources: [{ resourceId: 'q' + (t % 320), name: 'Recurso ' + ((t % 320) + 1), units: 1, qty: 3 }, { resourceId: 'q' + ((t * 7) % 320), name: 'Recurso ' + (((t * 7) % 320) + 1), units: 2, qty: 5 }], responsible: '', actualStart: null, actualFinish: null, notes: '' }));
    await PM.store.set(PM.paths.tool(id, 'resources'), { preset: 'general', types: [], items });
    await PM.store.set(PM.paths.tool(id, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks });
    PM.selectProject(id, 'portafolio');
    return id;
  });
  await sleep(400);
  let t0 = Date.now();
  await page.evaluate(() => PM.navigate('recursos', { tab: 'histograma' }));
  await page.waitForSelector('.sched-reslist tbody tr');
  const tHist = Date.now() - t0;
  check('320 recursos y 500 actividades: histograma en menos de 2 s', tHist < 2000, tHist);
  check('matriz limitada a 12 recursos con aviso', (await page.locator('.sched-matrix thead th.u').count()) === 12);
  t0 = Date.now();
  await page.selectOption('select[aria-label="Filtrar por tipo de recurso"]', 'maquinaria');
  await page.waitForFunction(() => document.querySelectorAll('.sched-reslist tbody tr').length === 64);
  const tFilter = Date.now() - t0;
  check('filtro por tipo con 256 recursos de trabajo: menos de 0,8 s', tFilter < 800, tFilter);
  t0 = Date.now();
  await tab('Consumo').click();
  await page.waitForSelector('.sched-cons-tbl tbody tr');
  const tCons = Date.now() - t0;
  check('consumo con 64 consumibles: menos de 1,5 s', tCons < 1500 && (await page.locator('.sched-cons-tbl tbody tr').count()) === 64, tCons);
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Actividades")');
  await page.waitForSelector('.sched-tbl tbody tr[data-id="t1"]');
  t0 = Date.now();
  await page.locator('.sched-tbl tbody tr[data-id="t1"] td[data-col="cost"] button').click();
  await page.waitForSelector('.modal [data-te-cost]');
  const tOpen = Date.now() - t0;
  check('editor de actividad con 320 recursos: abre en menos de 1 s', tOpen < 1000, tOpen);
  /* tiempo medido en la página: del evento de entrada a la lista dibujada (sin la latencia del controlador de pruebas) */
  const tPick = await page.evaluate(() => new Promise((res) => {
    const el = document.querySelector('.modal [data-res-row="1"] input[role="combobox"]'); el.focus();
    const t0 = performance.now(); el.value = 'Recurso 3'; el.dispatchEvent(new Event('input', { bubbles: true }));
    const tick = () => { const lb = document.querySelector('.modal [role="listbox"]'); if (lb) { void document.body.offsetHeight; res(performance.now() - t0); } else requestAnimationFrame(tick); };
    tick();
  }));
  const pickNames = await page.locator('.modal [role="listbox"] [role="option"][data-res-option]').evaluateAll((els) => els.map((e) => e.getAttribute('data-res-option')));
  check('selector con 320 recursos: filtra en menos de 0,2 s y solo muestra coincidencias', tPick < 200 && pickNames.length === 32 && pickNames.every((n) => /^Recurso 3\d*$/.test(n)), { tPick, n: pickNames.length, names: pickNames.slice(0, 40) });
  const activeName = await page.evaluate(() => { const el = document.querySelector('.modal [data-res-row="1"] input[role="combobox"]'); const o = document.getElementById(el.getAttribute('aria-activedescendant')); return o && o.getAttribute('data-res-option'); });
  await page.keyboard.press('Enter');
  check('selector: con el nombre exacto escrito, la opción activa es ese recurso e Intro lo elige', activeName === 'Recurso 3' && (await page.inputValue('.modal [data-res-row="1"] input[role="combobox"]')) === 'Recurso 3' && (await page.locator('.modal [data-res-row="1"] .sched-te-meta').innerText()).startsWith('REC-003'), activeName);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });
  void pidBig;
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

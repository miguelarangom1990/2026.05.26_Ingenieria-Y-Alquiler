// Pruebas de interacción del módulo 36-breakdowns: vista «Estructuras de desglose» (costos, riesgos y recursos) y el
// diagrama de árbol genérico PM.TreeDiagram (valores que cuadran, controles, plegado, teclado, zoom, disposición,
// tabla, exportación SVG/PNG/CSV, documento EDR, solo lectura, tema oscuro, 400 px, 1920 px y rendimiento).
// Uso: node test/breakdowns.test.mjs --file <ruta.html> [--shots dir] [--example andamio|medellin|erp] [--quick]
//   La página puede ser la aislada (node build.mjs --out x.html --include 36,12,13) o la completa; con la completa se
//   prueban además el proyecto de ejemplo y la apertura del registro de riesgos desde el diagrama.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, createExample, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
const exampleId = opt('--example') || 'andamio';
const quick = args.includes('--quick');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0, passed = 0;
async function step(name, fn) {
  try { await fn(); passed++; console.log('OK   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + '\n     ' + String((e && e.stack) || e).split('\n').slice(0, 5).join('\n     ')); }
}
const assert = (cond, msg, extra) => { if (!cond) throw new Error(msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 600) : '')); };
const near = (a, b, tol = 0.5) => Math.abs(Number(a) - Number(b)) <= tol;
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

const CBS = 'estructuras.cbs.diagram', RBR = 'estructuras.rbr.diagram', RBS = 'estructuras.rbs.diagram';
const readTree = (page, key) => page.$$eval(`[data-trd="${key}"] [role="treeitem"]`, (els) => els.map((e) => ({ uid: e.getAttribute('data-uid'), parent: e.getAttribute('data-parent'), value: Number(e.getAttribute('data-value')), kind: e.getAttribute('data-kind'), label: e.getAttribute('aria-label'), expanded: e.getAttribute('aria-expanded'), level: Number(e.getAttribute('aria-level')), tab: e.getAttribute('tabindex') })));
/* suma de los hijos visibles = valor del padre (métrica de dinero) */
const sumErrors = (nodes) => { const bad = []; for (const n of nodes) { const kids = nodes.filter((k) => k.parent === n.uid); if (!kids.length) continue; const s = kids.reduce((a, k) => a + k.value, 0); if (!near(s, n.value)) bad.push([n.uid, n.value, s]); } return bad; };
const byUid = (nodes, uid) => nodes.find((n) => n.uid === uid);
const node = (page, key, uid) => page.locator(`[data-trd="${key}"] [data-uid="${uid}"]`);
const stubDownloads = (page) => page.evaluate(() => {
  window.__dl = [];
  PM.caps.downloads = Promise.resolve({ save: async ({ filename, data }) => {
    const rec = { filename, type: null, size: 0, head: null, text: null };
    if (typeof data === 'string') { rec.text = data; rec.size = data.length; }
    else if (data instanceof Blob) { rec.type = data.type; rec.size = data.size; rec.head = [...new Uint8Array(await data.slice(0, 8).arrayBuffer())]; }
    window.__dl.push(rec); return { status: 'saved' };
  } });
});
const lastDownload = async (page, ext, timeout = 8000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { const d = await page.evaluate((ext) => (window.__dl || []).filter((x) => x.filename.endsWith(ext)).pop() || null, ext); if (d) return d; await page.waitForTimeout(100); }
  return null;
};
const openTab = async (page, tab) => { await page.evaluate((tab) => PM.navigate('estructuras', { tab }), tab); await page.waitForTimeout(600); };
const setCheck = async (page, scope, label, value) => { const c = page.locator(scope).getByLabel(label, { exact: true }); if ((await c.isChecked()) !== value) await c.click(); await page.waitForTimeout(250); };

/* ---------------------------------------------------------------- datos de prueba */
const WBS = [
  { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1 },
  { id: 'w11', parentId: 'w1', name: 'Planificación', order: 1 },
  { id: 'w12', parentId: 'w1', name: 'Seguimiento y control', order: 2 },
  { id: 'w2', parentId: null, name: 'Obra', order: 2 },
  { id: 'w21', parentId: 'w2', name: 'Montaje', order: 1 },
  { id: 'w211', parentId: 'w21', name: 'Montaje niveles 1 a 5', order: 1 },
  { id: 'w212', parentId: 'w21', name: 'Montaje niveles 6 a 10', order: 2 },
  { id: 'w22', parentId: 'w2', name: 'Desmontaje', order: 2 },
];
const RESOURCES = { preset: 'alquiler', types: [], items: [
  { id: 'r1', code: 'REC-001', name: 'Cuadrilla de montaje', typeId: 'personal', subtype: 'Cuadrillas', unit: 'cuadrilla', unitCost: 1000000, origin: 'Interno', planned: true, notes: 'Seis montadores certificados.' },
  { id: 'r2', code: 'REC-002', name: 'Supervisor de montaje', typeId: 'personal', subtype: 'Supervisión', unit: 'persona', unitCost: 400000, origin: 'Interno', planned: true },
  { id: 'r3', code: 'REC-003', name: 'Andamio multidireccional', typeId: 'equipo-alquiler', unit: 'día', unitCost: 500000, origin: 'Alquilado', planned: true, supplier: 'Proveedor de subarriendo' },
  { id: 'r4', code: 'REC-004', name: 'Grúa telescópica', typeId: 'izaje', unit: 'equipo', unitCost: 2000000, origin: 'Contratado', planned: false, reason: 'riesgo', riskId: 'R-002', reserveAmount: 20000000 },
  { id: 'r5', code: 'REC-005', name: 'Anclajes químicos', typeId: 'insumo', unit: 'unidad', unitCost: 20000, origin: 'Compra', planned: true },
  { id: 'r6', code: 'REC-006', name: 'Torquímetro', typeId: 'herramienta', unit: 'unidad', unitCost: 10000, origin: 'Interno', planned: true },
] };
const TASKS = [
  { id: 't1', name: 'Plan del proyecto', wbsId: 'w11', duration: 5, deps: [], cost: 3000000, costCategory: 'Indirectos', progress: 100 },
  { id: 't2', name: 'Informes de avance', wbsId: 'w12', duration: 10, deps: [{ id: 't1', type: 'FS', lag: 0 }], cost: 2000000, progress: 20 },
  { id: 't3', name: 'Montaje N1-5', wbsId: 'w211', duration: 10, deps: [{ id: 't1', type: 'FS', lag: 0 }], cost: 1, costMode: 'recursos', resources: [{ resourceId: 'r1', name: 'Cuadrilla de montaje', units: 1 }, { resourceId: 'r3', name: 'Andamio multidireccional', units: 1 }, { resourceId: 'r5', name: 'Anclajes químicos', units: 0, qty: 100 }] },
  { id: 't4', name: 'Montaje N6-10', wbsId: 'w212', duration: 10, deps: [{ id: 't3', type: 'FS', lag: 0 }], cost: 1, costMode: 'mixto', costFixed: 4000000, resources: [{ resourceId: 'r2', name: 'Supervisor de montaje', units: 1 }, { resourceId: 'r4', name: 'Grúa telescópica', units: 1 }] },
  { id: 't5', name: 'Desmontaje', wbsId: 'w22', duration: 5, deps: [{ id: 't4', type: 'FS', lag: 0 }], cost: 1, costMode: 'unitario', quantity: 1000, unitPrice: 6000, qtyUnit: 'm²' },
  { id: 't6', name: 'Gestión de compras', wbsId: null, duration: 1, deps: [], cost: 500000 },
  { id: 't7', name: 'Entrega final', wbsId: 'w22', duration: 0, milestone: true, deps: [{ id: 't5', type: 'FS', lag: 0 }], cost: 0 },
];
/* BAC = 3 + 2 + 17 + 28 + 6 + 0,5 = 56,5 M; reservas 4 M + 2 M → presupuesto 62,5 M */
const BASELINE = { number: 0, label: 'LB0', date: '2026-08-01T12:00:00.000Z', includes: ['scope', 'schedule', 'cost'], note: 'Línea base inicial', byId: null,
  schedule: { start: '2026-08-03', finish: '2026-09-30', tasks: [{ id: 't1', wbsId: 'w11' }, { id: 't2', wbsId: 'w12' }, { id: 't3', wbsId: 'w211' }, { id: 't4', wbsId: 'w212' }, { id: 't5', wbsId: 'w22' }] },
  cost: { bac: 51000000, contingency: 3000000, management: 1500000, tasks: [{ id: 't1', name: 'Plan del proyecto', cost: 3000000 }, { id: 't2', name: 'Informes de avance', cost: 2000000 }, { id: 't3', name: 'Montaje N1-5', cost: 15000000 }, { id: 't4', name: 'Montaje N6-10', cost: 25000000 }, { id: 't5', name: 'Desmontaje', cost: 6000000 }] } };
const PLAN_ROWS = [
  { id: 'p1', nivel1: 'Técnico', nivel2: 'Procesos de montaje', ejemplos: '', categoriaRegistro: 'Técnico' },
  { id: 'p2', nivel1: 'Externo', nivel2: 'Clima', ejemplos: '', categoriaRegistro: 'Externo' },
  { id: 'p3', nivel1: 'Externo', nivel2: 'Sitio y cliente', ejemplos: '', categoriaRegistro: 'Externo' },
  { id: 'p4', nivel1: 'De gestión', nivel2: 'Recursos', ejemplos: '', categoriaRegistro: 'De la organización' },
];
const rk = (id, descripcion, categoria, subcategoria, tipo, probabilidad, impacto, estado) => ({ id, descripcion, causa: '', efecto: '', categoria, subcategoria, tipo, probabilidad, impacto, propietario: 'Director de proyecto', estrategia: tipo === 'Oportunidad' ? 'Mejorar' : 'Mitigar', respuesta: '', disparador: '', reserva: 0, estado });
const RISKS = [
  rk('R-001', 'Lluvias que detienen el montaje en altura', 'Externo', 'Clima', 'Amenaza', 4, 4, 'Abierto'),
  rk('R-002', 'Grúa del cliente no disponible', 'Externo', 'Sitio y cliente', 'Amenaza', 3, 4, 'Abierto'),
  rk('R-003', 'Caída de un montador', 'Técnico', '', 'Amenaza', 2, 5, 'En seguimiento'),
  rk('R-004', 'Faltantes de piezas en bodega', 'De la organización', 'Recursos', 'Amenaza', 3, 3, 'Cerrado'),
  rk('R-005', 'Extensión del alquiler por el cliente', 'Externo', 'Sitio y cliente', 'Oportunidad', 3, 2, 'Abierto'),
];

async function seed(page, pid, { plan = true } = {}) {
  await page.evaluate(async ({ pid, WBS, RESOURCES, TASKS, BASELINE, PLAN_ROWS, RISKS, plan }) => {
    const project = { id: pid, ...(await PM.store.get(PM.paths.project(pid))) };
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: WBS });
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: TASKS });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [], statusUpdates: [], reserves: { contingency: 4000000, management: 2000000 } });
    await PM.store.set(PM.paths.tool(pid, 'resources'), RESOURCES);
    await PM.store.set(PM.paths.baseline(pid, 'lb0'), BASELINE);
    const doc = (tid, fields) => { const b = PM.newDocBody(PM.templates[tid], project, { template: tid }); b.fields = { ...b.fields, ...fields }; return b; };
    if (plan) await PM.store.set(PM.paths.doc(pid, 'plan-gestion-riesgos'), doc('plan-gestion-riesgos', { edrRiesgos: PLAN_ROWS }));
    await PM.store.set(PM.paths.doc(pid, 'registro-riesgos'), doc('registro-riesgos', { riesgos: RISKS }));
  }, { pid, WBS, RESOURCES, TASKS, BASELINE, PLAN_ROWS, RISKS, plan });
  await page.waitForTimeout(400);
}

/* ================================================================== escritorio, tema claro */
const { browser, page, errors } = await openApp({ file, width: 1440, height: 950 });
const isFull = await page.evaluate(() => typeof PM.openDocument === 'function' && !!PM.getView('documento'));
let pid = null;

await step('Registro de la vista: grupo planificación, orden 15, ícono propio y entrada del menú', async () => {
  const v = await page.evaluate(() => { const x = PM.getView('estructuras'); return x && { label: x.label, group: x.group, order: x.order, icon: x.icon, hasIcon: !!PM.ICONS[x.icon], tree: typeof PM.TreeDiagram }; });
  assert(v && v.label === 'Estructuras de desglose' && v.group === 'planificacion' && v.order === 15 && v.icon === 'breakdown' && v.hasIcon && v.tree === 'function', 'registro de la vista', v);
  pid = await createProject(page, { budget: 62500000 });
  await seed(page, pid);
  const item = page.locator('.nav-item', { hasText: 'Estructuras de desglose' });
  await item.click();
  await page.waitForTimeout(700);
  assert(await page.evaluate(() => PM.getState().view) === 'estructuras', 'el menú abre la vista');
  await page.getByRole('heading', { name: 'Estructuras de desglose' }).waitFor({ timeout: 5000 });
  assert(await page.locator('[role="tab"]').count() === 3, 'tres pestañas');
});

await step('Plantilla: columna opcional «Subcategoría (nivel 2)» después de la categoría en el registro de riesgos', async () => {
  const d = await page.evaluate(() => {
    const f = PM.templates['registro-riesgos'].sections.flatMap((s) => s.fields).find((x) => x.key === 'riesgos');
    const keys = f.columns.map((c) => c.key); const c = f.columns.find((x) => x.key === 'subcategoria');
    return { keys, type: c && c.type, label: c && c.label, hint: c && c.hint, ex: PM.templates['registro-riesgos'].example.riesgos.map((r) => r.subcategoria) };
  });
  assert(d.keys.indexOf('subcategoria') === d.keys.indexOf('categoria') + 1, 'subcategoria después de categoria', d.keys);
  assert(d.type === 'text' && d.label === 'Subcategoría (nivel 2)' && /estructura de desglose de los riesgos del plan de gestión de los riesgos/.test(d.hint), 'tipo, etiqueta y pista', d);
  for (const k of ['id', 'descripcion', 'causa', 'efecto', 'categoria', 'tipo', 'probabilidad', 'impacto', 'puntuacion', 'propietario', 'estrategia', 'respuesta', 'disparador', 'reserva', 'estado']) assert(d.keys.includes(k), 'conserva la columna fija ' + k);
  assert(d.ex.every((s) => typeof s === 'string' && s.length > 2), 'el ejemplo trae subcategorías', d.ex);
});

await step('Costos: presupuesto = BAC + reservas, línea base = contingencia + cuentas de control y suma de hijos = padre', async () => {
  await openTab(page, 'costos');
  const n = await readTree(page, CBS);
  const root = byUid(n, 'cbs');
  assert(root && near(root.value, 62500000), 'presupuesto 62,5 M', root);
  assert(near(byUid(n, 'cbs:gestion').value, 2000000) && near(byUid(n, 'cbs:lb').value, 60500000) && near(byUid(n, 'cbs:cont').value, 4000000), 'reservas y línea base', n.slice(0, 5));
  const acc = n.filter((x) => x.parent === 'cbs:lb' && x.uid !== 'cbs:cont');
  assert(near(acc.reduce((s, x) => s + x.value, 0), 56500000), 'cuentas de control = BAC 56,5 M', acc);
  assert(near(byUid(n, 'w:w1').value, 5000000) && near(byUid(n, 'w:w2').value, 51000000) && near(byUid(n, 'w:none').value, 500000), 'cuentas de nivel 1 (costos calculados por recursos, mixto y unitario)', acc);
  const bad = sumErrors(n); assert(!bad.length, 'suma de hijos = padre', bad);
  const stats = await page.locator('.brk-stats').innerText();
  assert(/\$ 62,5 M/.test(stats) && /\$ 11,9 M|\$ 2 M/.test(stats) && /\$ 56,5 M/.test(stats), 'indicadores', stats);
  assert(/Igual al presupuesto de la ficha/.test(stats), 'compara con el presupuesto de la ficha', stats);
  const note = await page.locator('.brk-note').first().innerText();
  assert(/Presupuesto del proyecto = reserva de gestión \+ línea base de costos/.test(note) && /Línea base de costos = reserva para contingencias \+ cuentas de control/.test(note), 'nota de los componentes del presupuesto', note);
  const tabs = await page.$$eval(`[data-trd="${CBS}"] [role="treeitem"][tabindex="0"]`, (els) => els.length);
  assert(tabs === 1, 'un solo elemento con tabindex 0 (foco itinerante)', tabs);
  const caption = await page.locator(`[data-trd="${CBS}"] text.trd-caption`).textContent();
  assert(/Estructura de desglose de costos · PRY-TEST-001 · Plan actual/.test(caption), 'rótulo del diagrama', caption);
  await shot(page, 'costos-claro');
});

await step('Costos: nivel de las cuentas de control, actividades, categoría de costo y línea base', async () => {
  const depth = page.getByLabel('Nivel de las cuentas de control');
  assert((await depth.locator('option').count()) === 3, 'niveles 1 a la profundidad de la EDT (3)');
  await depth.selectOption('2'); await page.waitForTimeout(400);
  let n = await readTree(page, CBS);
  const acc = n.filter((x) => x.parent === 'cbs:lb' && x.uid !== 'cbs:cont').map((x) => x.uid);
  assert(JSON.stringify(acc) === JSON.stringify(['w:w11', 'w:w12', 'w:w21', 'w:w22', 'w:none']), 'cuentas en el nivel 2', acc);
  assert(near(byUid(n, 'w:w21').value, 45000000) && n.filter((x) => x.parent === 'w:w21').length === 2, 'Montaje con dos paquetes de trabajo', n.filter((x) => x.parent === 'w:w21'));
  assert(!sumErrors(n).length, 'sumas en el nivel 2', sumErrors(n));
  await setCheck(page, '[data-brk="costos"]', 'Mostrar actividades', true);
  n = await readTree(page, CBS);
  const acts = n.filter((x) => x.uid.startsWith('a:'));
  assert(acts.length === 7 && acts.some((a) => /Montaje N6-10/.test(a.label) && near(a.value, 28000000)), 'actividades visibles con su costo', acts.map((a) => [a.uid, a.value]));
  assert(/Mixto/.test(byUid(n, 'a:t4').label), 'la actividad muestra su forma de costeo', byUid(n, 'a:t4').label);
  assert(!sumErrors(n).length, 'sumas con actividades', sumErrors(n));
  await page.locator('[data-brk="costos"]').getByRole('button', { name: 'Categoría de costo' }).click(); await page.waitForTimeout(400);
  n = await readTree(page, CBS);
  const cats = Object.fromEntries(n.filter((x) => x.parent === 'cbs:lb' && x.uid !== 'cbs:cont').map((x) => [x.uid, x.value]));
  const want = { 'c:izaje y transporte': 20000000, 'c:personal y cuadrillas': 14000000, 'c:sin categoría': 8500000, 'c:equipo de alquiler (andamios, formaletas)': 5000000, 'c:costo fijo': 4000000, 'c:indirectos': 3000000, 'c:insumos y repuestos': 2000000 };
  assert(Object.entries(want).every(([k, v]) => near(cats[k], v)), 'categorías de costo', cats);
  assert(await depth.isDisabled(), 'el nivel no aplica al agrupar por categoría');
  assert(!sumErrors(n).length && near(byUid(n, 'cbs').value, 62500000), 'sumas por categoría', sumErrors(n));
  await page.locator('[data-brk="costos"]').getByRole('button', { name: 'EDT', exact: true }).click();
  await setCheck(page, '[data-brk="costos"]', 'Mostrar actividades', false);
  await depth.selectOption('1');
  await page.locator('[data-brk="costos"]').getByRole('button', { name: 'Línea base LB0' }).click(); await page.waitForTimeout(400);
  n = await readTree(page, CBS);
  assert(near(byUid(n, 'cbs').value, 55500000) && near(byUid(n, 'cbs:cont').value, 3000000) && near(byUid(n, 'cbs:gestion').value, 1500000), 'línea base: 51 M + 3 M + 1,5 M', n.slice(0, 4));
  assert(near(byUid(n, 'w:w2').value, 46000000) && !byUid(n, 'w:none'), 'cuentas de la línea base', n.filter((x) => x.parent === 'cbs:lb'));
  assert(!sumErrors(n).length, 'sumas de la línea base', sumErrors(n));
  await page.locator('[data-brk="costos"]').getByRole('button', { name: 'Plan actual' }).click(); await page.waitForTimeout(400);
  assert(near(byUid(await readTree(page, CBS), 'cbs').value, 62500000), 'vuelve al plan actual');
});

await step('Plegado de ramas con el mouse (aria-expanded, «+N» y aviso de elementos ocultos)', async () => {
  const obra = node(page, CBS, 'w:w2');
  assert(await obra.getAttribute('aria-expanded') === 'true', 'Obra desplegada');
  const before = (await readTree(page, CBS)).length;
  await obra.click(); await page.waitForTimeout(300);
  const n = await readTree(page, CBS);
  assert(await obra.getAttribute('aria-expanded') === 'false' && n.length === before - 3 && !n.some((x) => x.parent === 'w:w2'), 'Obra plegada oculta sus 3 paquetes', n.length);
  assert((await obra.locator('.trd-pill text').textContent()).trim() === '+3', 'la píldora dice +3');
  assert(/3 elementos ocultos/.test(await obra.getAttribute('aria-label')), 'el nombre accesible avisa los ocultos');
  assert(/3 elementos ocultos en ramas plegadas/.test(await page.locator(`[data-trd="${CBS}"] .trd-hidden`).innerText()), 'aviso de ocultos');
  await page.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Desplegar todo' }).click(); await page.waitForTimeout(300);
  assert(await obra.getAttribute('aria-expanded') === 'true' && (await readTree(page, CBS)).length === before, 'Desplegar todo');
  await page.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Plegar al primer nivel' }).click(); await page.waitForTimeout(300);
  assert((await readTree(page, CBS)).every((x) => x.level <= 2), 'Plegar al primer nivel');
  await page.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Desplegar todo' }).click(); await page.waitForTimeout(300);
});

await step('Teclado: flechas entre nodos, Enter y Espacio pliegan, Inicio y Fin, foco visible', async () => {
  const active = () => page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-uid'));
  await page.locator(`[data-trd="${CBS}"] [role="treeitem"][tabindex="0"]`).focus();
  assert(await active(), 'el elemento con tabindex 0 recibe el foco');
  await page.keyboard.press('Home'); await page.waitForTimeout(150);
  assert(await active() === 'cbs', 'Inicio → raíz');
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
  const a1 = await active();
  assert(a1 === 'cbs:gestion' || a1 === 'cbs:lb', 'flecha abajo → un hijo de la raíz', a1);
  await page.keyboard.press(a1 === 'cbs:gestion' ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(150);
  const a2 = await active();
  assert(a2 !== a1 && (a2 === 'cbs:gestion' || a2 === 'cbs:lb'), 'flecha lateral → hermano', [a1, a2]);
  if (a2 !== 'cbs:lb') { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); }
  assert(await active() === 'cbs:lb', 'en la línea base');
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
  const a3 = await active();
  assert((await page.evaluate((u) => document.querySelector(`[data-uid="${u}"]`).getAttribute('data-parent'), a3)) === 'cbs:lb', 'flecha abajo → hijo de la línea base', a3);
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement.querySelector('.trd-ring')).stroke);
  assert(ring && ring !== 'none', 'anillo de foco visible', ring);
  assert(await page.$$eval(`[data-trd="${'estructuras.cbs.diagram'}"] [role="treeitem"][tabindex="0"]`, (els) => els.length === 1 && els[0] === document.activeElement), 'tabindex 0 sigue al foco');
  await page.evaluate(() => document.querySelector('[data-uid="w:w2"]').focus());
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  assert(await node(page, CBS, 'w:w2').getAttribute('aria-expanded') === 'false' && await active() === 'w:w2', 'Enter pliega y conserva el foco');
  await page.keyboard.press(' '); await page.waitForTimeout(250);
  assert(await node(page, CBS, 'w:w2').getAttribute('aria-expanded') === 'true', 'Espacio despliega');
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
  const kid = await active();
  assert(kid === 'w:w2:w211', 'flecha abajo → primer paquete de Obra', kid);
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(150);
  assert(await active() === 'w:w2', 'flecha arriba → padre (o el anterior de la pila)', await active());
  await page.keyboard.press('End'); await page.waitForTimeout(150);
  const last = await active(); const n = await readTree(page, CBS);
  assert(last === n[n.length - 1].uid, 'Fin → último elemento visible', last);
  await page.keyboard.press('Home'); await page.waitForTimeout(150);
  assert(await active() === 'cbs', 'Inicio → raíz');
  const sem = await page.evaluate(() => { const t = document.querySelector('[data-trd="estructuras.cbs.diagram"] svg[role="tree"]'); const g = t.querySelector('[data-uid="w:w2"]'); return { role: t.getAttribute('role'), label: t.getAttribute('aria-label'), level: g.getAttribute('aria-level'), set: g.getAttribute('aria-setsize'), pos: g.getAttribute('aria-posinset') }; });
  assert(sem.role === 'tree' && /Estructura de desglose de costos/.test(sem.label) && sem.level === '3' && Number(sem.set) === 4 && Number(sem.pos) >= 2, 'semántica tree/treeitem', sem);
  await shot(page, 'costos-teclado');
});

await step('Zoom (+, −, 100 %, ajustar) y disposición vertical u horizontal', async () => {
  const scope = page.locator(`[data-trd="${CBS}"]`);
  const zv = async () => Number((await scope.locator('[data-trd-zoom]').innerText()).replace(/\D/g, ''));
  await scope.getByRole('button', { name: 'Zoom al 100 %' }).click(); await page.waitForTimeout(200);
  assert(await zv() === 100, '100 %');
  const w100 = await scope.locator('svg[role="tree"]').evaluate((s) => [Number(s.getAttribute('width')), s.viewBox.baseVal.width]);
  assert(near(w100[0], w100[1], 1), 'a 100 % el SVG mide su tamaño natural', w100);
  await scope.getByRole('button', { name: 'Acercar' }).click(); await page.waitForTimeout(200);
  assert(await zv() === 125, 'acercar → 125 %', await zv());
  await scope.getByRole('button', { name: 'Alejar' }).click(); await scope.getByRole('button', { name: 'Alejar' }).click(); await page.waitForTimeout(200);
  assert(await zv() === 80, 'alejar dos veces → 80 %', await zv());
  await scope.getByRole('button', { name: 'Ajustar' }).click(); await page.waitForTimeout(200);
  assert(await scope.getByRole('button', { name: 'Ajustar' }).getAttribute('aria-pressed') === 'true', 'Ajustar activo');
  const fit = await page.evaluate((k) => { const c = document.querySelector(`[data-trd="${k}"] .trd-canvas`); const s = c.querySelector('svg[role="tree"]'); return { sw: Number(s.getAttribute('width')), cw: c.clientWidth }; }, CBS);
  assert(fit.sw <= fit.cw, 'ajustado al ancho del contenedor', fit);
  const rel = async () => page.evaluate((k) => { const r = document.querySelector(`[data-trd="${k}"] [data-uid="cbs"]`).getBoundingClientRect(); const c = document.querySelector(`[data-trd="${k}"] [data-uid="cbs:lb"]`).getBoundingClientRect(); return { rootRight: r.right, rootBottom: r.bottom, kidLeft: c.left, kidTop: c.top }; }, CBS);
  let p = await rel();
  assert(p.rootBottom < p.kidTop, 'vertical: raíz arriba', p);
  await scope.getByRole('button', { name: 'Horizontal' }).click(); await page.waitForTimeout(300);
  p = await rel();
  assert(p.rootRight < p.kidLeft, 'horizontal: raíz a la izquierda', p);
  assert(!sumErrors(await readTree(page, CBS)).length, 'mismos valores en horizontal');
  await shot(page, 'costos-horizontal');
  await scope.getByRole('button', { name: 'Vertical' }).click(); await page.waitForTimeout(300);
  assert(await page.evaluate(() => PM.prefs.get('estructuras.cbs.diagram.orient')) === 'v', 'la disposición se recuerda');
});

await step('Ver como tabla (sangría y valores) y descargar CSV', async () => {
  await stubDownloads(page);
  const scope = page.locator(`[data-trd="${CBS}"]`);
  await scope.getByRole('button', { name: 'Ver como tabla' }).click(); await page.waitForTimeout(300);
  assert(await scope.getByRole('button', { name: 'Ver como tabla' }).getAttribute('aria-pressed') === 'true', 'botón presionado');
  const rows = await scope.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => ({ uid: tr.getAttribute('data-uid'), pad: parseFloat(tr.querySelector('th').style.paddingLeft), name: tr.querySelector('th').innerText.trim(), val: tr.children[2].innerText.trim(), pct: tr.children[3].innerText.trim() })));
  const r = (u) => rows.find((x) => x.uid === u);
  assert(rows.length === 12 && r('cbs') && r('w:w2:w211'), 'todas las filas del árbol', rows.map((x) => x.uid));
  const money = await page.evaluate(() => [PM.fmt.money(62500000, 'COP'), PM.fmt.money(2000000, 'COP')]);
  assert(r('cbs').val === money[0] && r('cbs:gestion').val === money[1] && r('cbs:gestion').pct === '3,2 %', 'valores completos y porcentaje', [r('cbs'), r('cbs:gestion')]);
  assert(r('cbs').pad < r('cbs:lb').pad && r('cbs:lb').pad < r('w:w2').pad && r('w:w2').pad < r('w:w2:w211').pad, 'sangría por nivel', rows.map((x) => x.pad));
  assert(/^1\.2\.1\.1/.test(r('w:w2:w211').name), 'código EDT en la fila', r('w:w2:w211'));
  await scope.getByRole('button', { name: 'Descargar CSV' }).click();
  const csv = await lastDownload(page, '.csv');
  assert(csv && csv.filename === 'PRY-TEST-001_desglose-costos.csv' && /Nivel;Código;Elemento;Detalle;Valor \(COP\);% del total;Nivel o insignia/.test(csv.text) && /Reserva de gestión/.test(csv.text), 'CSV', csv && csv.text.slice(0, 200));
  await scope.getByRole('button', { name: 'Ver como tabla' }).click(); await page.waitForTimeout(300);
  assert(await scope.locator('svg[role="tree"]').count() === 1, 'vuelve al diagrama');
});

await step('Exportar SVG y PNG (descarga) con los colores del tema resueltos', async () => {
  await stubDownloads(page);
  const scope = page.locator(`[data-trd="${CBS}"]`);
  await scope.getByRole('button', { name: 'Descargar SVG' }).click();
  const svg = await lastDownload(page, '.svg');
  const want = await page.evaluate((k) => ({ accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), W: document.querySelector(`[data-trd="${k}"] svg[role="tree"]`).viewBox.baseVal.width }), CBS);
  assert(svg && svg.filename === 'PRY-TEST-001_desglose-costos.svg', 'nombre del archivo SVG', svg && svg.filename);
  assert(svg.text.startsWith('<?xml') && /<svg[^>]*width="\d+"/.test(svg.text) && !/var\(--/.test(svg.text) && !/class="/.test(svg.text), 'SVG autónomo sin variables CSS', svg.text.slice(0, 300));
  assert(new RegExp('width="' + want.W + '"').test(svg.text), 'SVG a tamaño natural (sin el zoom de pantalla)', want.W);
  const parsed = await page.evaluate((t) => { const d = new DOMParser().parseFromString(t, 'image/svg+xml'); const root = d.querySelector('[data-uid="cbs"] rect.trd-card, [data-uid="cbs"] rect:nth-of-type(2)'); const fills = [...d.querySelectorAll('rect')].map((r) => r.getAttribute('fill')); return { err: !!d.querySelector('parsererror'), title: (d.querySelector('title') || {}).textContent, texts: d.querySelectorAll('text').length, fills: [...new Set(fills)].slice(0, 30), rootFill: root && root.getAttribute('fill') }; }, svg.text);
  assert(!parsed.err && /Estructura de desglose de costos/.test(parsed.title) && parsed.texts > 20, 'SVG válido con título y textos', parsed);
  const accentRgb = await page.evaluate((c) => { const e = document.createElement('div'); e.style.color = c; document.body.appendChild(e); const v = getComputedStyle(e).color; e.remove(); return v; }, want.accent);
  assert(parsed.fills.includes(accentRgb), 'el color de acento del tema queda resuelto en el SVG', { fills: parsed.fills, accentRgb });
  await scope.getByRole('button', { name: 'Descargar PNG' }).click();
  const png = await lastDownload(page, '.png', 15000);
  assert(png && png.filename === 'PRY-TEST-001_desglose-costos.png' && png.type === 'image/png' && png.size > 5000, 'PNG descargado', png);
  assert(JSON.stringify(png.head) === JSON.stringify([137, 80, 78, 71, 13, 10, 26, 10]), 'firma PNG', png.head);
  /* sin la capacidad de descargas: la imagen se muestra para guardarla con el menú contextual */
  await page.evaluate(() => { PM.caps.downloads = Promise.resolve(null); });
  await scope.getByRole('button', { name: 'Descargar PNG' }).click();
  const dlg = page.getByRole('dialog', { name: 'Imagen PNG del diagrama' });
  await dlg.waitFor({ timeout: 10000 });
  assert(/^data:image\/png;base64,/.test(await dlg.locator('img').getAttribute('src')), 'vista previa PNG');
  await dlg.getByRole('button', { name: 'Cerrar' }).first().click();
  await page.waitForTimeout(200);
});

await step('Riesgos: plan de gestión de los riesgos, subcategoría del registro, filtros, leyenda y conteos', async () => {
  await openTab(page, 'riesgos');
  let n = await readTree(page, RBR);
  const leaf = (id) => byUid(n, 'k:' + id);
  const parentLabel = (id) => { const l = leaf(id); const p = l && byUid(n, l.parent); return p ? p.label.split(':')[0] : null; };
  assert(byUid(n, 'rbr').value === 5, 'raíz: 5 riesgos', byUid(n, 'rbr'));
  assert(parentLabel('R-001') === 'Clima' && byUid(n, leaf('R-001').parent).parent === 'n1:externo', 'R-001 en Externo › Clima (subcategoría)', parentLabel('R-001'));
  assert(parentLabel('R-002') === 'Sitio y cliente' && parentLabel('R-005') === 'Sitio y cliente', 'R-002 y R-005 en Sitio y cliente', [parentLabel('R-002'), parentLabel('R-005')]);
  assert(parentLabel('R-003') === 'Sin subcategoría' && byUid(n, leaf('R-003').parent).parent === 'n1:técnico', 'R-003 sin subcategoría → por su categoría', parentLabel('R-003'));
  assert(parentLabel('R-004') === 'Recursos', 'R-004 en De gestión › Recursos');
  assert(/Alto/.test(leaf('R-001').label) && /P×I 16/.test(leaf('R-001').label) && /Oportunidad/.test(leaf('R-005').label), 'nivel e insignia en texto', [leaf('R-001').label, leaf('R-005').label]);
  const count = (uid) => n.filter((x) => x.parent === uid).reduce((s, x) => s + (x.uid.startsWith('k:') ? 1 : x.value), 0);
  assert(n.filter((x) => !x.uid.startsWith('k:') && n.some((k) => k.parent === x.uid)).every((g) => count(g.uid) === g.value), 'conteo de cada grupo = riesgos que contiene');
  const tags = await page.locator(`[data-trd="${RBR}"] [data-uid="n1:externo"] text.trd-tag`).textContent();
  assert(tags === 'Máx.: Alto', 'la franja del grupo dice el nivel máximo', tags);
  const legend = await page.locator('.brk-levels').innerText();
  assert(/Bajo 1–4/.test(legend) && /Medio 5–9/.test(legend) && /Alto 10–19/.test(legend) && /Muy alto 20–25/.test(legend) && /Sin evaluar/.test(legend), 'leyenda de niveles con texto', legend);
  assert(/1 riesgo no tiene una subcategoría del plan/.test(await page.locator('[data-brk="riesgos"] .brk-note').first().innerText()), 'aviso de riesgos sin subcategoría');
  await shot(page, 'riesgos-claro');
  await setCheck(page, '[data-brk="riesgos"]', 'Ocultar riesgos cerrados', true);
  n = await readTree(page, RBR);
  assert(byUid(n, 'rbr').value === 4 && !byUid(n, 'k:R-004'), 'ocultar cerrados', byUid(n, 'rbr'));
  await page.locator('[data-brk="riesgos"]').getByRole('button', { name: 'Oportunidades' }).click(); await page.waitForTimeout(300);
  n = await readTree(page, RBR);
  assert(byUid(n, 'rbr').value === 1 && byUid(n, 'k:R-005'), 'solo oportunidades', n.filter((x) => x.uid.startsWith('k:')).map((x) => x.uid));
  await page.locator('[data-brk="riesgos"]').getByRole('button', { name: 'Amenazas' }).click(); await page.waitForTimeout(300);
  n = await readTree(page, RBR);
  assert(byUid(n, 'rbr').value === 3 && !byUid(n, 'k:R-005'), 'solo amenazas abiertas', byUid(n, 'rbr'));
  await page.locator('[data-brk="riesgos"]').getByRole('button', { name: 'Ambos' }).click();
  await setCheck(page, '[data-brk="riesgos"]', 'Ocultar riesgos cerrados', false);
  assert(byUid(await readTree(page, RBR), 'rbr').value === 5, 'sin filtros');
});

await step('Riesgos: clic o Enter en un riesgo abre el registro de riesgos', async () => {
  if (!isFull) {
    /* página aislada: sin editor de documentos, el diagrama avisa sin fallar */
    await node(page, RBR, 'k:R-001').click(); await page.waitForTimeout(300);
    assert(await page.evaluate(() => PM.getState().view) === 'estructuras', 'sin editor, la vista no cambia');
    return;
  }
  await node(page, RBR, 'k:R-001').click(); await page.waitForTimeout(700);
  let st = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
  assert(st.view === 'documento' && st.params.docId === 'registro-riesgos', 'clic abre el registro', st);
  await openTab(page, 'riesgos');
  await page.evaluate(() => document.querySelector('[data-uid="k:R-002"]').focus());
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  st = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
  assert(st.view === 'documento' && st.params.docId === 'registro-riesgos', 'Enter abre el registro', st);
  await openTab(page, 'riesgos');
});

await step('Riesgos sin plan de gestión de los riesgos: aviso y agrupación por la categoría del registro', async () => {
  await page.evaluate((pid) => PM.store.delete(PM.paths.doc(pid, 'plan-gestion-riesgos')), pid);
  await page.waitForTimeout(500);
  const note = await page.locator('[data-brk="riesgos"] .brk-note.is-warn').innerText();
  assert(/no tiene la estructura de desglose de los riesgos/.test(note) && /categoría del registro/.test(note), 'aviso', note);
  const n = await readTree(page, RBR);
  const l1 = n.filter((x) => x.parent === 'rbr').map((x) => x.label.split(':')[0]);
  assert(JSON.stringify(l1) === JSON.stringify(['Externo', 'Técnico', 'De la organización']), 'categorías del registro', l1);
  await page.evaluate(async ({ pid, PLAN_ROWS }) => { const project = { id: pid, ...(await PM.store.get(PM.paths.project(pid))) }; const b = PM.newDocBody(PM.templates['plan-gestion-riesgos'], project, { template: 'plan-gestion-riesgos' }); b.fields.edrRiesgos = PLAN_ROWS; await PM.store.set(PM.paths.doc(pid, 'plan-gestion-riesgos'), b); }, { pid, PLAN_ROWS });
  await page.waitForTimeout(500);
  assert(!(await page.locator('[data-brk="riesgos"] .brk-note.is-warn').count()), 'con el plan, sin aviso');
});

await step('Recursos: tipo → subtipo → recurso con costos que cuadran, no planificados y filtros', async () => {
  await openTab(page, 'recursos');
  let n = await readTree(page, RBS);
  assert(near(byUid(n, 'rbs').value, 41000000), 'costo de lo asignado 41 M', byUid(n, 'rbs'));
  assert(!sumErrors(n).length, 'suma de hijos = padre', sumErrors(n));
  const types = n.filter((x) => x.parent === 'rbs').map((x) => [x.uid, x.value]);
  assert(JSON.stringify(types) === JSON.stringify([['t:personal', 14000000], ['t:equipo-alquiler', 5000000], ['t:izaje', 20000000], ['t:herramienta', 0], ['t:insumo', 2000000]]), 'tipos del preset con su costo', types);
  assert(n.filter((x) => x.parent === 't:personal').map((x) => x.uid).join() === 't:personal:cuadrillas,t:personal:supervisión', 'subtipos (nivel 2)');
  const grua = byUid(n, 'r:r4');
  assert(/No planificado/.test(grua.label) && (await node(page, RBS, 'r:r4').locator('text.trd-tag').textContent()) === 'No planificado', 'insignia «No planificado» en texto', grua.label);
  const stats = await page.locator('[data-brk="recursos"] .brk-stats').innerText();
  assert(/No planificados\s*1/.test(stats) && /Sin asignar\s*1/.test(stats) && /\$ 41 M/.test(stats), 'indicadores de recursos', stats);
  await shot(page, 'recursos-claro');
  await setCheck(page, '[data-brk="recursos"]', 'Solo no planificados', true);
  n = await readTree(page, RBS);
  assert(n.filter((x) => x.kind === 'leaf').map((x) => x.uid).join() === 'r:r4' && near(byUid(n, 'rbs').value, 20000000), 'solo no planificados', n.map((x) => x.uid));
  assert(/100 %/.test(await node(page, RBS, 'r:r4').locator('text.trd-pct').textContent()), 'porcentaje sobre lo mostrado');
  await setCheck(page, '[data-brk="recursos"]', 'Solo no planificados', false);
  await setCheck(page, '[data-brk="recursos"]', 'Ocultar sin asignar', true);
  n = await readTree(page, RBS);
  assert(!byUid(n, 'r:r6') && !byUid(n, 't:herramienta') && near(byUid(n, 'rbs').value, 41000000) && !sumErrors(n).length, 'ocultar sin asignar', n.map((x) => x.uid));
  await setCheck(page, '[data-brk="recursos"]', 'Ocultar sin asignar', false);
});

await step('Recursos: «Actualizar el documento EDR» con confirmación (cancelar, crear, revisión nueva si está aprobado)', async () => {
  const get = () => page.evaluate(async (pid) => { await PM.store.flush(); return PM.store.get(PM.paths.doc(pid, 'estructura-desglose-recursos')); }, pid);
  assert(!(await get()), 'abrir la vista no escribe el documento');
  const btn = page.locator('[data-brk="recursos"]').getByRole('button', { name: 'Actualizar el documento EDR' });
  await btn.click();
  let dlg = page.getByRole('dialog', { name: 'Actualizar el documento EDR' });
  await dlg.waitFor();
  assert(/13 filas generadas/.test(await dlg.innerText()) && /5 tipos, 2 subtipos y 6 recursos/.test(await dlg.innerText()), 'resumen en la confirmación', await dlg.innerText());
  await dlg.getByRole('button', { name: 'Cancelar' }).click(); await page.waitForTimeout(400);
  assert(!(await get()), 'cancelar no escribe');
  await btn.click();
  dlg = page.getByRole('dialog', { name: 'Actualizar el documento EDR' });
  await dlg.getByRole('button', { name: 'Actualizar el documento' }).click();
  await page.waitForTimeout(1200);
  let doc = await get();
  const rows = doc && doc.fields.recursos;
  assert(rows && rows.length === 13, '13 filas', rows);
  const pick = rows.map((r) => [r.codigo, r.categoria, r.recurso, r.fuente || '', r.unidad || '', r.costoUnitario ?? null]);
  const want = [
    ['1', 'Personal', 'Personal y cuadrillas', '', '', null], ['1.1', 'Personal', 'Cuadrillas', '', '', null], ['1.1.1', 'Personal', 'Cuadrilla de montaje', 'Interno', 'cuadrilla', 1000000],
    ['1.2', 'Personal', 'Supervisión', '', '', null], ['1.2.1', 'Personal', 'Supervisor de montaje', 'Interno', 'persona', 400000],
    ['2', 'Equipos', 'Equipo de alquiler (andamios, formaletas)', '', '', null], ['2.1', 'Equipos', 'Andamio multidireccional', 'Subarriendo', 'día', 500000],
    ['3', 'Transporte', 'Izaje y transporte', '', '', null], ['3.1', 'Transporte', 'Grúa telescópica', 'Contratado', 'equipo', 2000000],
    ['4', 'Equipos', 'Herramienta', '', '', null], ['4.1', 'Equipos', 'Torquímetro', 'Interno', 'unidad', 10000],
    ['5', 'Materiales', 'Insumos y repuestos', '', '', null], ['5.1', 'Materiales', 'Anclajes químicos', 'Contratado', 'unidad', 20000],
  ];
  assert(JSON.stringify(pick) === JSON.stringify(want), 'códigos jerárquicos, categorías EDR y fuentes', pick);
  assert(rows.every((r) => r.id) && /No planificado \(Respuesta a un riesgo identificado\)/.test(rows[8].descripcion) && /Proveedor: Proveedor de subarriendo/.test(rows[6].descripcion), 'descripciones', rows.map((r) => r.descripcion));
  const opts = await page.evaluate(() => { const f = PM.templates['estructura-desglose-recursos'].sections.flatMap((s) => s.fields).find((x) => x.key === 'recursos'); return { cat: f.columns.find((c) => c.key === 'categoria').options, src: f.columns.find((c) => c.key === 'fuente').options }; });
  assert(rows.every((r) => !r.categoria || opts.cat.includes(r.categoria)) && rows.every((r) => !r.fuente || opts.src.includes(r.fuente)), 'valores dentro de las opciones de la plantilla');
  assert(doc.status === 'borrador', 'documento nuevo en borrador');
  /* documento aprobado: la actualización abre una revisión nueva como borrador */
  await page.evaluate(async (pid) => { const p = PM.paths.doc(pid, 'estructura-desglose-recursos'); const d = await PM.store.get(p); await PM.store.set(p, { ...d, status: 'aprobado', rev: '0', fields: { ...d.fields, recursos: d.fields.recursos.slice(0, 2) } }); }, pid);
  await page.waitForTimeout(500);
  await btn.click();
  dlg = page.getByRole('dialog', { name: 'Actualizar el documento EDR' });
  assert(/está aprobado \(revisión 0\): se abrirá la revisión 1A como borrador/.test(await dlg.innerText()), 'avisa la revisión nueva', await dlg.innerText());
  await dlg.getByRole('button', { name: 'Actualizar el documento' }).click();
  await page.waitForTimeout(1200);
  doc = await get();
  assert(doc.status === 'borrador' && doc.rev === '1A' && doc.fields.recursos.length === 13 && doc.titleBlock.fechaAprobacion === null, 'revisión 1A en borrador con la tabla nueva', { status: doc.status, rev: doc.rev, n: doc.fields.recursos.length });
});

await step('Modo solo lectura: sin acciones de escritura', async () => {
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.waitForTimeout(300);
  assert(!(await page.locator('[data-brk="recursos"]').getByRole('button', { name: 'Actualizar el documento EDR' }).count()), 'sin botón de actualizar');
  assert(await page.locator('[data-brk="recursos"]').getByRole('button', { name: 'Abrir el documento EDR' }).count() === 1, 'se puede abrir el documento');
  await page.evaluate(() => PM.setState({ canWrite: true }));
  await page.waitForTimeout(200);
});

await step('Sin errores en escritorio', async () => {
  const cards = await errorCards(page);
  assert(!cards.length, 'tarjetas de error', cards);
  assert(!errors.length, 'errores de consola', errors);
});
await browser.close();

/* ================================================================== tema oscuro, 400 px y 1920 px */
async function variant(name, opts, fn) {
  const v = await openApp({ file, ...opts });
  try {
    const p2 = await createProject(v.page, { budget: 62500000 });
    await seed(v.page, p2);
    await fn(v.page, v);
    const cards = await errorCards(v.page);
    assert(!cards.length && !v.errors.length, name + ': sin errores', [cards, v.errors]);
  } finally { await v.browser.close(); }
}
await step('Tema oscuro: tarjetas y franjas con los tokens del tema', async () => {
  await variant('oscuro', { dark: true, width: 1440, height: 950 }, async (pg) => {
    for (const tab of ['costos', 'riesgos', 'recursos']) { await openTab(pg, tab); await shot(pg, tab + '-oscuro'); }
    const c = await pg.evaluate(() => { const g = document.querySelector('[data-uid="t:izaje"]'); const card = g.querySelector('.trd-card'); const surf = getComputedStyle(document.body).getPropertyValue('--surface').trim(); const e = document.createElement('div'); e.style.color = surf; document.body.appendChild(e); const s = getComputedStyle(e).color; e.remove(); return { fill: getComputedStyle(card).fill, surface: s, name: getComputedStyle(g.querySelector('text.trd-name')).fill, scheme: getComputedStyle(document.documentElement).colorScheme }; });
    assert(c.scheme === 'dark' && c.fill === c.surface && c.name !== 'rgb(20, 28, 40)', 'colores del tema oscuro', c);
    await openTab(pg, 'riesgos');
    const t = await pg.evaluate(() => getComputedStyle(document.querySelector('[data-uid="k:R-001"] text.trd-tag')).fill);
    assert(t && t !== 'none', 'texto de la franja visible', t);
  });
});
await step('Móvil 400 px: sin desborde de la página; el diagrama se desplaza dentro de su contenedor', async () => {
  await variant('400 px', { width: 400, height: 860 }, async (pg) => {
    for (const tab of ['costos', 'riesgos', 'recursos']) {
      await openTab(pg, tab);
      const ov = await horizontalOverflow(pg);
      assert(ov <= 1, tab + ': desborde horizontal ' + ov + ' px');
      for (const tbl of [false, true]) {
        if (tbl) { await pg.getByRole('button', { name: 'Ver como tabla' }).click(); await pg.waitForTimeout(250); }
        assert(await horizontalOverflow(pg) <= 1, tab + (tbl ? ' (tabla)' : '') + ': sin desborde');
        if (tbl) { await pg.getByRole('button', { name: 'Ver como tabla' }).click(); await pg.waitForTimeout(250); }
      }
      await shot(pg, tab + '-movil');
    }
    await openTab(pg, 'costos');
    await pg.getByRole('button', { name: 'Zoom al 100 %' }).click(); await pg.waitForTimeout(200);
    const c = await pg.evaluate(() => { const el = document.querySelector('.trd-canvas'); return { sw: el.scrollWidth, cw: el.clientWidth, ow: getComputedStyle(el).overflowX }; });
    assert(c.sw > c.cw && c.ow === 'auto', 'el diagrama ancho se desplaza en su contenedor', c);
    assert(await horizontalOverflow(pg) <= 1, 'sin desborde a 100 %');
  });
});
await step('Escritorio ancho 1920 px: la vista usa todo el ancho', async () => {
  await variant('1920 px', { width: 1920, height: 1080 }, async (pg) => {
    await openTab(pg, 'costos');
    const w = await pg.evaluate(() => { const host = document.querySelector('.view-host').getBoundingClientRect(); const page = document.querySelector('.brk-page').getBoundingClientRect(); const c = document.querySelector('.trd-canvas').getBoundingClientRect(); return { host: host.right, page: page.width, right: page.right, canvas: c.width }; });
    assert(w.host - w.right <= 40 && w.canvas >= w.page - 2 && w.page > 1500, 'ancho completo', w);
    await shot(pg, 'costos-1920');
  });
});

/* ================================================================== rendimiento: 320 recursos y 500 actividades */
if (!quick) await step('Rendimiento: 320 recursos y 500 actividades sin bloqueos', async () => {
  await variant('rendimiento', { width: 1440, height: 950 }, async (pg) => {
    const p3 = await pg.evaluate(() => PM.getState().projectId);
    await pg.evaluate(async (pid) => {
      const nodes = []; for (let i = 1; i <= 8; i++) { nodes.push({ id: 'g' + i, parentId: null, name: 'Frente ' + i, order: i }); for (let j = 1; j <= 6; j++) nodes.push({ id: 'g' + i + '-' + j, parentId: 'g' + i, name: 'Paquete ' + i + '.' + j, order: j }); }
      const types = ['personal', 'equipo-alquiler', 'izaje', 'herramienta', 'servicio', 'insumo'];
      const items = Array.from({ length: 320 }, (_, k) => ({ id: 'q' + k, code: 'REC-' + String(k + 1).padStart(3, '0'), name: 'Recurso ' + (k + 1), typeId: types[k % 6], subtype: 'Grupo ' + (k % 5), unit: 'unidad', unitCost: 10000 + k * 100, origin: 'Interno', planned: k % 9 !== 0 }));
      const tasks = Array.from({ length: 500 }, (_, k) => ({ id: 'x' + k, name: 'Actividad ' + (k + 1), wbsId: 'g' + (1 + (k % 8)) + '-' + (1 + (k % 6)), duration: 1 + (k % 7), deps: k ? [{ id: 'x' + (k - 1), type: 'SS', lag: 0 }] : [], cost: 100000 + k, costMode: k % 2 ? 'recursos' : 'global', resources: [{ resourceId: 'q' + (k % 320), name: 'Recurso ' + ((k % 320) + 1), units: 1 }, { resourceId: 'q' + ((k * 7) % 320), name: 'Recurso ' + (((k * 7) % 320) + 1), units: 2 }] }));
      await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes });
      await PM.store.set(PM.paths.tool(pid, 'resources'), { preset: 'alquiler', types: [], items });
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks });
    }, p3);
    await pg.waitForTimeout(600);
    const timed = async (fn, sel) => { const t0 = Date.now(); await fn(); await pg.waitForSelector(sel, { timeout: 15000 }); return Date.now() - t0; };
    const tRes = await timed(() => openTab(pg, 'recursos'), `[data-trd="${RBS}"] [data-uid="rbs"]`);
    let n = await readTree(pg, RBS);
    assert(n.length <= 160 && n.some((x) => x.expanded === 'false'), 'ramas plegadas al abrir un árbol grande', n.length);
    const tExpand = await timed(() => pg.locator(`[data-trd="${RBS}"]`).getByRole('button', { name: 'Desplegar todo' }).click(), `[data-trd="${RBS}"] [data-uid="r:q319"]`);
    n = await readTree(pg, RBS);
    assert(n.filter((x) => x.kind === 'leaf').length === 320 && !sumErrors(n).length, '320 recursos visibles y sumas correctas', n.length);
    const t0 = Date.now();
    await pg.locator(`[data-trd="${RBS}"] [role="treeitem"][tabindex="0"]`).focus();
    for (let i = 0; i < 12; i++) await pg.keyboard.press(i % 3 === 2 ? 'ArrowRight' : 'ArrowDown');
    const tKeys = Date.now() - t0;
    await openTab(pg, 'costos');
    await setCheck(pg, '[data-brk="costos"]', 'Mostrar actividades', true);
    const tActs = await timed(() => pg.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Desplegar todo' }).click(), `[data-trd="${CBS}"] [data-uid="a:x499"]`);
    n = await readTree(pg, CBS);
    assert(n.filter((x) => x.uid.startsWith('a:')).length === 500 && !sumErrors(n).length, '500 actividades y sumas correctas', n.length);
    const tTable = await timed(() => pg.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Ver como tabla' }).click(), `[data-trd="${CBS}"] table tbody tr[data-uid="a:x499"]`);
    console.log(`     tiempos: recursos ${tRes} ms · desplegar 320 ${tExpand} ms · 12 flechas ${tKeys} ms · 500 actividades ${tActs} ms · tabla ${tTable} ms`);
    assert(tRes < 4000 && tExpand < 4000 && tKeys < 3000 && tActs < 5000 && tTable < 4000, 'tiempos razonables', { tRes, tExpand, tKeys, tActs, tTable });
    await pg.locator(`[data-trd="${CBS}"]`).getByRole('button', { name: 'Ver como tabla' }).click();
  });
});

/* ================================================================== proyecto de ejemplo (página completa) */
await step('Proyecto de ejemplo: presupuesto = BAC + reservas y riesgos ubicados por subcategoría', async () => {
  const v = await openApp({ file, width: 1440, height: 950 });
  try {
    const ok = await v.page.evaluate(() => !!(PM.examples && PM.examples.length));
    if (!ok) { console.log('     (página sin proyectos de ejemplo: se omite)'); return; }
    await createExample(v.page, exampleId);
    await v.page.waitForTimeout(1200);
    await openTab(v.page, 'costos');
    const exp = await v.page.evaluate(async () => {
      const pid = PM.getState().projectId;
      const costs = (await PM.store.get(PM.paths.tool(pid, 'costs'))) || {}; const res = costs.reserves || {};
      const project = await PM.store.get(PM.paths.project(pid));
      return { reserves: PM.num(res.contingency) + PM.num(res.management), budget: PM.num(project.budget) };
    });
    const n = await readTree(v.page, CBS);
    const acc = n.filter((x) => x.parent === 'cbs:lb' && x.uid !== 'cbs:cont').reduce((s, x) => s + x.value, 0);
    assert(near(byUid(n, 'cbs').value, acc + exp.reserves, 1), 'presupuesto = cuentas de control + reservas', { root: byUid(n, 'cbs').value, acc, res: exp.reserves });
    assert(!sumErrors(n).length, 'suma de hijos = padre', sumErrors(n));
    if (exampleId === 'andamio') assert(near(byUid(n, 'cbs').value, exp.budget, 1000), 'coincide con el presupuesto aprobado del ejemplo', [byUid(n, 'cbs').value, exp.budget]);
    await shot(v.page, 'ejemplo-' + exampleId + '-costos');
    await openTab(v.page, 'riesgos');
    const r = await readTree(v.page, RBR);
    const leaves = r.filter((x) => x.uid.startsWith('k:'));
    assert(leaves.length > 0 && byUid(r, 'rbr').value === leaves.length, 'riesgos del registro', leaves.length);
    if (exampleId === 'andamio') {
      const p = byUid(r, byUid(r, 'k:R-001').parent);
      assert(p && /^Clima:/.test(p.label), 'R-001 en la subcategoría Clima del plan', p && p.label);
      assert(!(await v.page.locator('[data-brk="riesgos"] .brk-note').count()), 'todos los riesgos del ejemplo tienen subcategoría del plan');
    }
    await shot(v.page, 'ejemplo-' + exampleId + '-riesgos');
    await openTab(v.page, 'recursos');
    const rb = await readTree(v.page, RBS);
    assert(rb.length > 1 && !sumErrors(rb).length, 'recursos del ejemplo', rb.length);
    await shot(v.page, 'ejemplo-' + exampleId + '-recursos');
    assert(!(await errorCards(v.page)).length && !v.errors.length, 'sin errores', v.errors);
  } finally { await v.browser.close(); }
});

console.log(`\n${passed}/${passed + failures} pasos correctos`);
process.exit(failures ? 1 : 0);

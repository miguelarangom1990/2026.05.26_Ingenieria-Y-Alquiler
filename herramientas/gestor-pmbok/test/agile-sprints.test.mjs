// Pruebas de interacción del módulo 46-agile-sprints (vistas «iteraciones» y «metricas-agiles», SPEC §9.4–§9.6).
// Uso: node test/agile-sprints.test.mjs --file <ruta.html> [--shots dir]
// La página debe incluir 46 y las plantillas 12 y 13 (solicitud y registro de cambios, registro de lecciones):
//   node build.mjs --out /tmp/x.html --include 46,12,13
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const results = [];
async function step(name, fn) {
  try { await fn(); results.push('OK   ' + name); console.log('OK   ' + name); }
  catch (e) { failures++; results.push('FAIL ' + name); console.log('FAIL ' + name + '\n     ' + String((e && e.stack) || e).split('\n').slice(0, 5).join('\n     ')); if (onFail) { try { await onFail(); } catch (x) { /* página cerrada */ } } }
}
const nb = (t) => String(t).replace(/[\u00a0\u202f]/g, ' ');
let onFail = null;
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg + ' — esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a)); };

/* ------------------------------------------------------------------ datos de prueba */
const SEED = {
  wbs: { nodes: [
    { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1, approach: 'predictivo' },
    { id: 'w2', parentId: null, name: 'Plataforma digital de alquiler', order: 2, approach: 'adaptativo' },
    { id: 'w21', parentId: 'w2', name: 'Módulo de inventario', order: 1 },
    { id: 'w3', parentId: null, name: 'Montaje en obra', order: 3, approach: 'predictivo' },
  ] },
  schedule: { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [
    { id: 't1', name: 'Plan del proyecto', wbsId: 'w1', duration: 5, milestone: false, start: '2026-08-03', deps: [], progress: 100, cost: 10000000, resources: [] },
    { id: 't2', name: 'Desarrollo de la plataforma (release 1)', wbsId: 'w2', duration: 40, milestone: false, start: '2026-08-03', deps: [], progress: 0, cost: 120000000, resources: [] },
    { id: 't3', name: 'Montaje de andamios', wbsId: 'w3', duration: 20, milestone: false, start: '2026-08-10', deps: [], progress: 30, cost: 60000000, resources: [] },
    { id: 't4', name: 'Facturación electrónica', wbsId: 'w2', duration: 30, milestone: false, start: '2026-09-28', deps: [], progress: 0, cost: 80000000, resources: [] },
  ] },
  costs: { actuals: [
    { id: 'a1', date: '2026-08-20', amount: 30000000, releaseId: 'r1', category: 'Mano de obra', description: 'Equipo de desarrollo agosto' },
    { id: 'a2', date: '2026-08-31', amount: 15000000, taskId: 't3', description: 'Cuadrilla' },
  ], statusUpdates: [], reserves: { contingency: 0, management: 0 } },
  agile: {
    settings: { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, scopeChangeThreshold: 10, columns: [
      { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null }, { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 3 },
      { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 }, { id: 'terminado', name: 'Terminado', category: 'terminado', wip: null }] },
    releases: [
      { id: 'r1', name: 'Release 1 · Inventario y alquiler', goal: 'Controlar el inventario de andamios y formaletas en bodega y en obra.', start: '2026-08-03', end: '2026-09-25', status: 'en-curso', budget: 120000000, plannedSprints: 4, wbsId: 'w2', taskId: 't2',
        baseline: { date: '2026-07-31', points: 40, end: '2026-09-25', budget: 120000000, sprints: 4, changeRef: null }, notes: '' },
      { id: 'r2', name: 'Release 2 · Facturación', goal: 'Facturación electrónica y cartera.', start: '2026-09-28', end: '2026-11-20', status: 'planeado', budget: 80000000, plannedSprints: 4, wbsId: null, taskId: null, baseline: null, notes: '' },
    ],
    sprints: [
      { id: 's1', name: 'Iteración 1', releaseId: 'r1', goal: 'Catálogo de equipos', start: '2026-08-03', end: '2026-08-14', status: 'cerrado', capacity: 14, committed: 13, completed: 11, docs: {} },
      { id: 's2', name: 'Iteración 2', releaseId: 'r1', goal: 'Remisiones de salida', start: '2026-08-18', end: '2026-08-31', status: 'cerrado', capacity: 14, committed: 12, completed: 12, docs: {} },
      { id: 's3', name: 'Iteración 3', releaseId: 'r1', goal: 'Devoluciones e inspección', start: '2026-09-01', end: '2026-09-14', status: 'en-curso', capacity: 14, committed: 14, completed: null, docs: {} },
    ],
  },
};
const H = (pairs) => pairs.map(([date, status]) => ({ date, status }));
const it = (id, code, title, estimate, extra) => ({ id, code, type: 'historia', title, description: '', acceptance: 'Criterio de aceptación', estimate, priority: 'Debe tener', rank: Number(code.slice(3)) * 1000, status: 'backlog', wbsId: 'w2', releaseId: 'r1', sprintId: null, epicId: null, assignee: '', blocked: false, tags: [], createdAt: '2026-07-28', doneDate: null, history: H([['2026-07-28', 'backlog']]), ...extra });
const ITEMS = [
  it('e1', 'EP-001', 'Inventario', null, { type: 'epica' }),
  it('i1', 'HU-001', 'Catálogo de equipos', 5, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-07', history: H([['2026-07-28', 'backlog'], ['2026-08-03', 'por-hacer'], ['2026-08-04', 'en-curso'], ['2026-08-07', 'terminado']]) }),
  it('i2', 'HU-002', 'Fichas técnicas', 3, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-12', history: H([['2026-07-28', 'backlog'], ['2026-08-03', 'por-hacer'], ['2026-08-10', 'en-curso'], ['2026-08-12', 'terminado']]) }),
  it('i3', 'HU-003', 'Ubicaciones de bodega', 3, { sprintId: 's1', status: 'terminado', doneDate: '2026-08-14', history: H([['2026-07-28', 'backlog'], ['2026-08-03', 'por-hacer'], ['2026-08-11', 'en-curso'], ['2026-08-14', 'terminado']]) }),
  it('i4', 'HU-004', 'Remisión de salida', 5, { sprintId: 's2', status: 'terminado', doneDate: '2026-08-24', history: H([['2026-07-28', 'backlog'], ['2026-08-18', 'por-hacer'], ['2026-08-19', 'en-curso'], ['2026-08-24', 'terminado']]) }),
  it('i5', 'HU-005', 'Firma del transportador', 4, { sprintId: 's2', status: 'terminado', doneDate: '2026-08-27', history: H([['2026-07-28', 'backlog'], ['2026-08-18', 'por-hacer'], ['2026-08-21', 'en-curso'], ['2026-08-27', 'terminado']]) }),
  it('i6', 'HU-006', 'Consulta de saldos por obra', 3, { sprintId: 's2', status: 'terminado', doneDate: '2026-08-31', history: H([['2026-07-28', 'backlog'], ['2026-08-18', 'por-hacer'], ['2026-08-25', 'en-curso'], ['2026-08-31', 'terminado']]) }),
  it('i7', 'HU-007', 'Devolución parcial', 5, { sprintId: 's3', status: 'terminado', doneDate: '2026-09-03', history: H([['2026-07-28', 'backlog'], ['2026-09-01', 'por-hacer'], ['2026-09-02', 'en-curso'], ['2026-09-03', 'terminado']]) }),
  it('i8', 'HU-008', 'Inspección de retorno', 5, { sprintId: 's3', status: 'en-curso', history: H([['2026-07-28', 'backlog'], ['2026-09-01', 'por-hacer'], ['2026-09-03', 'en-curso']]) }),
  it('i9', 'HU-009', 'Faltantes y daños', 4, { sprintId: 's3', status: 'por-hacer', history: H([['2026-07-28', 'backlog'], ['2026-09-01', 'por-hacer']]) }),
  it('i10', 'HU-010', 'Alertas de vencimiento', 5, { createdAt: '2026-08-20', history: H([['2026-08-20', 'backlog']]) }),
  it('i11', 'HU-011', 'Tablero de ocupación', 2, {}),
  it('i12', 'DF-001', 'Error en saldo negativo', 2, { type: 'defecto', rank: 500 }),
  it('i13', 'HU-012', 'Exportar remisiones', null, {}),
  it('i14', 'HU-013', 'Ajuste de inventario', 3, { createdAt: '2026-08-25', history: H([['2026-08-25', 'backlog']]) }),
  it('j1', 'HU-020', 'Factura electrónica DIAN', 8, { releaseId: 'r2' }),
  it('j2', 'HU-021', 'Notas crédito', 5, { releaseId: 'r2' }),
  it('j3', 'HU-022', 'Cartera por edades', 5, { releaseId: 'r2' }),
  it('j4', 'HU-023', 'Recordatorios de pago', 3, { releaseId: 'r2' }),
  it('j5', 'HU-024', 'Conciliación bancaria', 8, { releaseId: 'r2' }),
];
const CHANGES = [
  { id: 'CC-001', fecha: '2026-08-10', solicitante: 'Cliente', descripcion: 'Cambio previo', tipo: 'Actualización', estado: 'Aprobada' },
  { id: 'CC-002', fecha: '2026-08-20', solicitante: 'Cliente', descripcion: 'Otro cambio', tipo: 'Acción correctiva', estado: 'Rechazada' },
];
/* Plantillas mínimas con las claves de §9.5 (si 14-templates-agile no está en la página). */
const STUB_TEMPLATES = [
  { id: 'planificacion-sprint', name: 'Planificación de la iteración', abbr: 'PIT', area: 'integracion', group: 'ejecucion', process: '4.3', kind: 'acta', multiple: true, purpose: 'x', tips: [], sections: [{ id: 's', title: 'S', fields: [
    { key: 'iteracion', label: 'Iteración', type: 'text' }, { key: 'release', label: 'Release', type: 'text' }, { key: 'fechaInicio', label: 'Inicio', type: 'date' }, { key: 'fechaFin', label: 'Fin', type: 'date' },
    { key: 'objetivo', label: 'Objetivo', type: 'textarea' }, { key: 'capacidad', label: 'Capacidad', type: 'number' }, { key: 'velocidadReferencia', label: 'Velocidad', type: 'number' }, { key: 'compromiso', label: 'Compromiso', type: 'number' },
    { key: 'elementos', label: 'Elementos', type: 'table', columns: [{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'titulo', label: 'Título', type: 'text' }, { key: 'tipo', label: 'Tipo', type: 'text' }, { key: 'estimacion', label: 'Estimación', type: 'number' }, { key: 'responsable', label: 'Responsable', type: 'text' }, { key: 'criterios', label: 'Criterios', type: 'textarea' }] },
    { key: 'riesgos', label: 'Riesgos', type: 'textarea' }, { key: 'participantes', label: 'Participantes', type: 'list' }] }] },
  { id: 'acta-revision-sprint', name: 'Acta de revisión de la iteración', abbr: 'ARI', area: 'alcance', group: 'monitoreo', process: '5.5', kind: 'acta', multiple: true, purpose: 'x', tips: [], sections: [{ id: 's', title: 'S', fields: [
    { key: 'iteracion', label: 'Iteración', type: 'text' }, { key: 'fecha', label: 'Fecha', type: 'date' }, { key: 'objetivo', label: 'Objetivo', type: 'textarea' }, { key: 'objetivoCumplido', label: 'Cumplido', type: 'select', options: ['Sí', 'Parcialmente', 'No'] },
    { key: 'comprometido', label: 'Comprometido', type: 'number' }, { key: 'terminado', label: 'Terminado', type: 'number' },
    { key: 'elementos', label: 'Elementos', type: 'table', columns: [{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'titulo', label: 'Título', type: 'text' }, { key: 'estimacion', label: 'Estimación', type: 'number' }, { key: 'resultado', label: 'Resultado', type: 'select', options: ['Aceptado', 'Rechazado', 'No terminado'] }, { key: 'observaciones', label: 'Obs.', type: 'text' }] },
    { key: 'retroalimentacion', label: 'Retro', type: 'textarea' }, { key: 'cambiosBacklog', label: 'Cambios', type: 'textarea' }, { key: 'asistentes', label: 'Asistentes', type: 'list' }] }] },
  { id: 'retrospectiva', name: 'Retrospectiva de la iteración', abbr: 'RET', area: 'integracion', group: 'ejecucion', process: '4.4', kind: 'acta', multiple: true, purpose: 'x', tips: [], sections: [{ id: 's', title: 'S', fields: [
    { key: 'iteracion', label: 'Iteración', type: 'text' }, { key: 'fecha', label: 'Fecha', type: 'date' }, { key: 'formato', label: 'Formato', type: 'select', options: ['Bien, mejorar y acciones', 'Empezar, dejar y continuar', '4L'] },
    { key: 'queFueBien', label: 'Bien', type: 'list' }, { key: 'queMejorar', label: 'Mejorar', type: 'list' },
    { key: 'acciones', label: 'Acciones', type: 'table', columns: [{ key: 'accion', label: 'Acción', type: 'text' }, { key: 'responsable', label: 'Responsable', type: 'text' }, { key: 'fechaObjetivo', label: 'Fecha', type: 'date' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'En curso', 'Hecha'] }] },
    { key: 'lecciones', label: 'Lecciones', type: 'table', columns: [{ key: 'situacion', label: 'Situación', type: 'textarea' }, { key: 'impacto', label: 'Impacto', type: 'select', options: ['Positivo', 'Negativo'] }, { key: 'recomendacion', label: 'Recomendación', type: 'textarea' }] }] }] },
];

async function seed(page, pid, { items = ITEMS, agile = SEED.agile } = {}) {
  await page.evaluate(async ({ pid, seed, items, agile, changes }) => {
    await PM.store.set(PM.paths.tool(pid, 'wbs'), seed.wbs);
    await PM.store.set(PM.paths.tool(pid, 'schedule'), seed.schedule);
    await PM.store.set(PM.paths.tool(pid, 'costs'), seed.costs);
    await PM.store.set(PM.paths.tool(pid, 'agile'), agile);
    for (const x of items) { const { id, ...body } = x; await PM.store.set(PM.paths.backlogItem(pid, id), body); }
    const body = PM.newDocBody(PM.templates['registro-cambios'], null, { template: 'registro-cambios' }); body.fields.cambios = changes;
    await PM.store.set(PM.paths.doc(pid, 'registro-cambios'), body);
  }, { pid, seed: SEED, items, agile, changes: CHANGES });
}
async function newApp(opts = {}) {
  const app = await openApp({ file, ...opts });
  const pid = await createProject(app.page, { lifecycle: 'Híbrido', statusDate: '2026-09-04', ...(opts.meta || {}) });
  if (opts.seed !== false) await seed(app.page, pid, opts.seedOpts || {});
  await app.page.waitForTimeout(150);
  return { ...app, pid };
}
const getAgile = (page, pid) => page.evaluate((pid) => PM.store.get(PM.paths.tool(pid, 'agile')), pid);
const getItem = (page, pid, id) => page.evaluate(({ pid, id }) => PM.store.get(PM.paths.backlogItem(pid, id)), { pid, id });
const getDoc = (page, pid, id) => page.evaluate(({ pid, id }) => PM.store.get(PM.paths.doc(pid, id)), { pid, id });
const listDocs = (page, pid) => page.evaluate((pid) => PM.store.list(PM.paths.docs(pid)), pid);
async function until(page, fn, msg, ms = 5000) {
  const t0 = Date.now(); let last;
  while (Date.now() - t0 < ms) { last = await fn(); if (last) return last; await page.waitForTimeout(80); }
  throw new Error('tiempo agotado: ' + msg);
}
const rel = (a, id) => a.releases.find((r) => r.id === id);
const spr = (a, id) => a.sprints.find((s) => s.id === id);
const dialog = (page) => page.locator('.modal[role="dialog"]').last();
async function setRegistryState(page, pid, code, estado) {
  await page.evaluate(async ({ pid, code, estado }) => {
    const d = PM.clone(await PM.store.get(PM.paths.doc(pid, 'registro-cambios')));
    d.fields.cambios = d.fields.cambios.map((r) => (r.id === code ? { ...r, estado, fechaDecision: '2026-09-08', decisor: 'Comité de control de cambios' } : r));
    await PM.store.set(PM.paths.doc(pid, 'registro-cambios'), d);
  }, { pid, code, estado });
}

/* ================================================================== sesión principal (escritorio, tema claro) */
{
  const { browser, page, errors, pid } = await newApp({ width: 1360, height: 950 });
  onFail = async () => { for (let k = 0; k < 3; k++) { if (!(await page.locator('.modal-backdrop').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
  try {
    await step('Menú: las vistas ágiles aparecen con ciclo de vida híbrido', async () => {
      const labels = await page.$$eval('.nav-item', (els) => els.map((e) => e.textContent.trim()));
      assert(labels.some((l) => /Releases e iteraciones/.test(l)), 'falta «Releases e iteraciones» en el menú: ' + labels.join(' | '));
      assert(labels.some((l) => /Métricas ágiles/.test(l)), 'falta «Métricas ágiles» en el menú');
      const reg = await page.evaluate(() => ['iteraciones', 'metricas-agiles'].map((id) => { const v = PM.getView(id); return [v.group, v.order, v.icon, v.when === PM.agile.when, v.unavailable === PM.AgileUnavailable]; }));
      eq(reg, [['agil', 30, 'sprint', true, true], ['agil', 40, 'burndown', true, true]], 'registro de las vistas');
    });

    await gotoView(page, 'iteraciones');
    await page.waitForTimeout(400);
    await step('Releases: lista, selección por defecto y resumen del release', async () => {
      eq(await page.locator('.ags-rel[data-release-id]').count(), 2, 'tarjetas de release');
      eq(await page.getAttribute('.ags-rel[data-release-id="r1"]', 'aria-pressed'), 'true', 'r1 seleccionado (tiene la iteración en curso)');
      const det = await page.locator('[data-role="release-detail"]').innerText().then(nb);
      assert(/Release 1 · Inventario y alquiler/.test(det), 'detalle del release');
      assert(/57\s*%/.test(det) && /28 pts de 49 pts/.test(det), 'avance del release: ' + det.slice(0, 400));
      assert(/1\.2/.test(det) && /Plataforma digital de alquiler/.test(det) && /Adaptativo/.test(det), 'entregable de la EDT con su enfoque');
      assert(/Desarrollo de la plataforma/.test(det) && /calculado desde el backlog/.test(det), 'actividad vinculada');
      assert(/Pronóstico de terminación/.test(det) && /28 sep 2026/.test(det), 'pronóstico');
      assert(/Sin línea base/.test(await page.locator('.ags-rel[data-release-id="r2"]').innerText().then(nb)), 'r2 sin línea base (baseline null)');
    });

    await step('Control de cambios: la variación de alcance supera el umbral y muestra el detalle', async () => {
      const t = await page.locator('[data-role="change-needed"]').innerText().then(nb);
      assert(/nivel 2/.test(t), 'título del aviso');
      assert(/49 pts frente a 40 pts/.test(t) && /\+22,5\s*%/.test(t) && /supera el umbral de ±10\s*%/.test(t), 'detalle del alcance: ' + t);
      assert(/Fecha de fin: sin cambio/.test(t) && /Presupuesto: sin cambio/.test(t), 'fecha y presupuesto sin cambio');
      assert(/Requiere control de cambios/.test(await page.locator('.ags-rel[data-release-id="r1"]').innerText().then(nb)), 'distintivo en la tarjeta');
    });

    await step('Registrar solicitud de cambio: crea el documento prellenado, la fila CC-003 y el vínculo del release', async () => {
      await page.click('[data-role="change-register"]');
      const dlg = dialog(page);
      assert(/CC-003/.test(await dlg.innerText().then(nb)), 'el diálogo propone el siguiente código CC-003');
      await dlg.getByRole('button', { name: 'Registrar solicitud' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && rel(x, 'r1').pendingChange && rel(x, 'r1').pendingChange.code ? x : null; }, 'pendingChange');
      const pc = rel(a, 'r1').pendingChange;
      eq(pc.code, 'CC-003', 'código de la solicitud');
      assert(/^solicitud-cambio--/.test(pc.docId), 'docId de la solicitud: ' + pc.docId);
      const doc = await getDoc(page, pid, pc.docId);
      assert(doc && doc.template === 'solicitud-cambio', 'documento de solicitud creado');
      const f = doc.fields;
      eq([f.codigoCambio, f.solicitante, f.tipoCambio, f.decision, f.diasCronograma, f.valorCosto], ['CC-003', 'Dueño del producto', 'Actualización', 'Registrada', 0, 0], 'campos de control');
      assert(/^\d{4}-\d{2}-\d{2}$/.test(f.fechaSolicitud), 'fecha de la solicitud');
      assert(/49 pts frente a 40 pts/.test(f.impactoAlcance) && /HU-010/.test(f.impactoAlcance) && /HU-013/.test(f.impactoAlcance), 'impacto en el alcance con los elementos agregados: ' + f.impactoAlcance);
      assert(f.descripcionCambio.length > 40 && f.justificacion.length > 40, 'descripción y justificación');
      assert(Array.isArray(f.elementosAfectados) && f.elementosAfectados.some((x) => /Línea base del release/.test(x)) && f.elementosAfectados.some((x) => /Desarrollo de la plataforma/.test(x)), 'elementos afectados');
      const reg = await until(page, async () => { const d = await getDoc(page, pid, 'registro-cambios'); return d && d.fields.cambios.length === 3 ? d : null; }, 'fila en el registro');
      const row = reg.fields.cambios[2];
      eq([row.id, row.solicitante, row.tipo, row.estado, row.impactoCronograma, row.impactoCosto], ['CC-003', 'Dueño del producto', 'Actualización', 'Registrada', 0, 0], 'fila del registro de cambios');
      assert(row.descripcion && row.impactoAlcance && /^\d{4}-/.test(row.fecha), 'descripción, impacto y fecha en la fila');
      await page.waitForSelector('[data-role="change-pending"]');
      assert(/CC-003/.test(await page.locator('[data-role="change-pending"]').innerText().then(nb)), 'aviso de solicitud en trámite');
    });

    await step('Solicitud aprobada en el registro: «Actualizar línea base del release» con changeRef', async () => {
      await setRegistryState(page, pid, 'CC-003', 'Aprobada');
      await page.waitForSelector('[data-role="change-approved"]');
      assert(/aprobada/i.test(await page.locator('[data-role="change-approved"]').innerText().then(nb)), 'aviso de aprobación');
      await page.getByRole('button', { name: 'Actualizar línea base del release' }).click();
      await dialog(page).getByRole('button', { name: 'Actualizar línea base' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && rel(x, 'r1').baseline.changeRef === 'CC-003' ? x : null; }, 'línea base actualizada');
      const b = rel(a, 'r1').baseline;
      eq([b.points, b.end, b.budget, b.sprints, b.date, rel(a, 'r1').pendingChange], [49, '2026-09-25', 120000000, 4, '2026-09-04', null], 'nueva línea base');
      await page.waitForSelector('[data-role="change-level1"]');
      assert(/actualizada con CC-003/.test(await page.locator('[data-role="baseline-summary"]').innerText().then(nb)), 'resumen de la línea base con la referencia');
    });

    await step('Editar release (validación) y cambio de fecha → solicitud rechazada', async () => {
      await page.getByRole('button', { name: 'Editar release' }).click();
      const dlg = dialog(page);
      await dlg.locator('#ags-rel-name').fill('');
      await dlg.getByRole('button', { name: 'Guardar release' }).click();
      assert(/Escribe el nombre del release/.test(await dlg.innerText().then(nb)), 'error de nombre vacío');
      await dlg.locator('#ags-rel-name').fill('Release 1 · Inventario y alquiler');
      await dlg.locator('#ags-rel-end').fill('2026-10-02');
      await dlg.getByRole('button', { name: 'Guardar release' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); return x && rel(x, 'r1').end === '2026-10-02'; }, 'fin del release');
      await page.waitForSelector('[data-role="change-needed"]');
      const t = await page.locator('[data-role="change-needed"]').innerText().then(nb);
      assert(/Fecha de fin: del 25 sep 2026 al 02 oct 2026/.test(t) && /5 días hábiles/.test(t), 'cambio de fecha detectado: ' + t);
      await page.click('[data-role="change-register"]');
      await dialog(page).getByRole('button', { name: 'Registrar solicitud' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && rel(x, 'r1').pendingChange && rel(x, 'r1').pendingChange.code === 'CC-004' ? x : null; }, 'CC-004');
      const doc = await getDoc(page, pid, rel(a, 'r1').pendingChange.docId);
      eq([doc.fields.diasCronograma, doc.fields.valorCosto], [5, 0], 'días hábiles del cambio de fecha');
      await until(page, async () => { const d = await getDoc(page, pid, 'registro-cambios'); return d.fields.cambios.some((r) => r.id === 'CC-004' && r.impactoCronograma === 5); }, 'fila CC-004');
      await setRegistryState(page, pid, 'CC-004', 'Rechazada');
      await page.waitForSelector('[data-role="change-rejected"]');
      const rt = await page.locator('[data-role="change-rejected"]').innerText().then(nb);
      assert(/rechazada/i.test(rt) && /no cambia/.test(rt), 'aviso de rechazo: ' + rt);
      await page.getByRole('button', { name: 'Descartar aviso' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); return x && !rel(x, 'r1').pendingChange; }, 'aviso descartado');
      await page.waitForSelector('[data-role="change-needed"]');
    });

    await step('Crear release: validación, entregable adaptativo y actividad libre', async () => {
      await page.click('[data-role="release-new"]');
      const dlg = dialog(page);
      await dlg.getByRole('button', { name: 'Crear release' }).click();
      assert(/Escribe el nombre del release/.test(await dlg.innerText().then(nb)), 'nombre requerido');
      const groups = await dlg.locator('#ags-rel-wbs optgroup').evaluateAll((gs) => gs.map((g) => [g.label, [...g.querySelectorAll('option')].map((o) => o.value)]));
      eq(groups, [['Entregables adaptativos', ['w2', 'w21']], ['Otros entregables (predictivos)', ['w1', 'w3']]], 'entregables agrupados por enfoque');
      const tasks = await dlg.locator('#ags-rel-task option').evaluateAll((os) => os.map((o) => o.value));
      assert(!tasks.includes('t2') && tasks.includes('t4') && tasks.includes('t1'), 'la actividad de r1 no se ofrece: ' + tasks);
      await dlg.locator('#ags-rel-name').fill('Release 3 · Mantenimiento');
      await dlg.locator('#ags-rel-start').fill('2026-11-23');
      await dlg.locator('#ags-rel-end').fill('2027-01-29');
      await dlg.locator('#ags-rel-budget').fill('50000000');
      await dlg.locator('#ags-rel-sprints').fill('3');
      await dlg.locator('#ags-rel-wbs').selectOption('w21');
      await dlg.locator('#ags-rel-task').selectOption('t4');
      await dlg.locator('#ags-rel-name').press('Enter');
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && x.releases.length === 3 ? x : null; }, 'release creado');
      const r3 = a.releases[2];
      eq([r3.name, r3.start, r3.end, r3.budget, r3.plannedSprints, r3.wbsId, r3.taskId, r3.status, hasNoBaseline(r3)], ['Release 3 · Mantenimiento', '2026-11-23', '2027-01-29', 50000000, 3, 'w21', 't4', 'planeado', true], 'datos del release');
      await page.waitForSelector(`.ags-rel[data-release-id="${r3.id}"][aria-pressed="true"]`);
      await page.getByRole('button', { name: 'Editar release' }).click();
      await dialog(page).locator('#ags-rel-name').fill('Release 3 · Mantenimiento y tablero');
      await dialog(page).getByRole('button', { name: 'Guardar release' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); return x && x.releases[2].name === 'Release 3 · Mantenimiento y tablero'; }, 'release renombrado');
    });
    function hasNoBaseline(r) { const b = r.baseline; return b == null || (typeof b === 'object' && !b.date && !b.points); }

    let r3id, r3sprints;
    await step('Generar iteraciones según las planeadas: fechas contiguas en el calendario del proyecto', async () => {
      await page.click('[data-role="sprint-generate"]');
      const dlg = dialog(page);
      eq(await dlg.locator('tbody tr').count(), 3, 'vista previa de 3 iteraciones');
      await dlg.getByRole('button', { name: 'Generar 3 iteraciones' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && x.sprints.length === 6 ? x : null; }, '3 iteraciones nuevas');
      r3id = a.releases[2].id;
      r3sprints = a.sprints.filter((s) => s.releaseId === r3id);
      eq(r3sprints.map((s) => s.name), ['Iteración 4', 'Iteración 5', 'Iteración 6'], 'nombres consecutivos');
      eq(r3sprints[0].start, '2026-11-23', 'la primera empieza con el release (después de la última iteración del proyecto)');
      const ok = await page.evaluate((list) => { const cal = PM.cal.make({ workweek: 5, holidaysCO: true }, '2026-08-03'); return list.map((s, i) => [s.status, s.end === cal.addWork(s.start, 9), i === 0 || s.start === cal.addWork(PM.date.add(list[i - 1].end, 1), 0), cal.countWork(s.start, s.end)]); }, r3sprints);
      eq(ok, [['planeado', true, true, 10], ['planeado', true, true, 10], ['planeado', true, true, 10]], 'duración de 10 días hábiles y continuidad (festivos de Colombia)');
      eq(r3sprints[1].start, '2026-12-07', 'la segunda empieza el lunes siguiente');
      eq(r3sprints[1].end, '2026-12-21', 'el 8 de diciembre (festivo) no cuenta');
    });

    await step('Agregar, editar y eliminar una iteración', async () => {
      await page.click('[data-role="sprint-add"]');
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && x.sprints.length === 7 ? x : null; }, 'iteración agregada');
      const s7 = a.sprints[6];
      eq([s7.name, s7.releaseId, s7.start], ['Iteración 7', r3id, await page.evaluate((e) => PM.cal.make({ workweek: 5, holidaysCO: true }, '2026-08-03').addWork(PM.date.add(e, 1), 0), r3sprints[2].end)], 'nombre, release e inicio');
      await page.locator(`tr[data-sprint-id="${s7.id}"]`).getByRole('button', { name: 'Editar Iteración 7' }).click();
      const dlg = dialog(page);
      await dlg.locator('#ags-sp-name').fill('Iteración 7 (refuerzo)');
      await dlg.locator('#ags-sp-cap').fill('12');
      await dlg.locator('#ags-sp-end').fill('2026-01-01');
      await dlg.getByRole('button', { name: 'Guardar iteración' }).click();
      assert(/igual o posterior/.test(await dlg.innerText().then(nb)), 'valida que el fin no sea anterior al inicio');
      await dlg.locator('#ags-sp-end').fill(s7.end);
      await dlg.getByRole('button', { name: 'Guardar iteración' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); const s = spr(x, s7.id); return s && s.name === 'Iteración 7 (refuerzo)' && s.capacity === 12; }, 'iteración editada');
      await page.locator(`tr[data-sprint-id="${s7.id}"]`).getByRole('button', { name: 'Eliminar Iteración 7 (refuerzo)' }).click();
      await dialog(page).getByRole('button', { name: 'Eliminar iteración' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); return x && x.sprints.length === 6; }, 'iteración eliminada');
    });

    await step('Eliminar release con sus iteraciones: limpia elementos, actividades y costos', async () => {
      await page.evaluate(async ({ pid, r3, sp }) => {
        await PM.store.set(PM.paths.backlogItem(pid, 'k1'), { code: 'HU-030', type: 'historia', title: 'Tablero gerencial', estimate: 3, rank: 90000, status: 'backlog', releaseId: r3, sprintId: sp, createdAt: '2026-09-01', history: [] });
        const c = PM.clone(await PM.store.get(PM.paths.tool(pid, 'costs'))); c.actuals.push({ id: 'a3', date: '2026-09-02', amount: 1000, releaseId: r3 }); await PM.store.set(PM.paths.tool(pid, 'costs'), c);
        const s = PM.clone(await PM.store.get(PM.paths.tool(pid, 'schedule'))); s.tasks[3].releaseId = r3; await PM.store.set(PM.paths.tool(pid, 'schedule'), s);
      }, { pid, r3: r3id, sp: r3sprints[0].id });
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Más acciones de Release 3/ }).click();
      await page.getByRole('menuitem', { name: 'Eliminar release' }).click();
      const dlg = dialog(page);
      await dlg.getByText('Eliminarlas también').click();
      await dlg.getByRole('button', { name: 'Eliminar release' }).click();
      await until(page, async () => { const x = await getAgile(page, pid); return x && x.releases.length === 2 && x.sprints.length === 3; }, 'release y sus iteraciones eliminados');
      const k1 = await until(page, async () => { const x = await getItem(page, pid, 'k1'); return x && x.releaseId === null ? x : null; }, 'elemento sin release');
      eq([k1.releaseId, k1.sprintId], [null, null], 'referencias del elemento');
      const refs = await page.evaluate(async (pid) => { const c = await PM.store.get(PM.paths.tool(pid, 'costs')); const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); return [c.actuals.find((a) => a.id === 'a3').releaseId, s.tasks[3].releaseId]; }, pid);
      eq(refs, [null, null], 'costos y actividad sin el release eliminado');
      await page.evaluate((pid) => PM.store.delete(PM.paths.backlogItem(pid, 'k1')), pid);
    });

    let r2s;
    await step('Fijar línea base del release 2 (estado comprometido)', async () => {
      await page.click('.ags-rel[data-release-id="r2"]');
      await page.locator('[data-role="release-detail"]').getByRole('button', { name: 'Fijar línea base del release' }).first().click();
      await dialog(page).getByRole('button', { name: 'Fijar línea base' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && rel(x, 'r2').baseline && rel(x, 'r2').baseline.points ? x : null; }, 'línea base de r2');
      const r2 = rel(a, 'r2');
      eq([r2.baseline.points, r2.baseline.end, r2.baseline.budget, r2.baseline.sprints, r2.baseline.changeRef, r2.baseline.date, r2.status], [29, '2026-11-20', 80000000, 4, null, '2026-09-04', 'comprometido'], 'línea base del release 2');
      await page.waitForSelector('[data-role="change-level1"]');
    });

    await step('Planificar: capacidad, objetivo, agregar con teclado, llenar hasta la capacidad y quitar', async () => {
      await page.click('[data-role="sprint-add"]');
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && x.sprints.some((s) => s.releaseId === 'r2') ? x : null; }, 'iteración de r2');
      r2s = a.sprints.find((s) => s.releaseId === 'r2');
      eq([r2s.name, r2s.start, r2s.end], ['Iteración 4', '2026-09-28', '2026-10-09'], 'iteración de r2 con las fechas del release');
      await page.waitForSelector(`[data-role="planner"][data-sprint-id="${r2s.id}"]`);
      await page.fill(`#ags-cap-${r2s.id}`, '20');
      await page.press(`#ags-cap-${r2s.id}`, 'Tab');
      await page.fill(`#ags-goal-${r2s.id}`, 'Emitir la primera factura electrónica');
      await page.press(`#ags-goal-${r2s.id}`, 'Tab');
      await until(page, async () => { const x = await getAgile(page, pid); const s = spr(x, r2s.id); return s.capacity === 20 && s.goal === 'Emitir la primera factura electrónica'; }, 'capacidad y objetivo guardados');
      const add = page.locator('[data-role="candidates"] tr[data-item-id="j1"] button');
      await add.focus();
      await page.keyboard.press('Enter');
      await until(page, async () => (await getItem(page, pid, 'j1')).sprintId === r2s.id, 'j1 agregado con teclado');
      await page.waitForFunction(() => { const a = document.activeElement; const tr = a && a.closest('[data-role="candidates"] tr[data-item-id]'); return tr && tr.dataset.itemId === 'j2'; }, null, { timeout: 4000 });
      await page.locator('[data-role="candidates"] tr[data-item-id="j2"]').getByRole('button', { name: /Agregar HU-021/ }).click();
      await until(page, async () => (await getItem(page, pid, 'j2')).sprintId === r2s.id, 'j2 agregado');
      await page.waitForFunction(() => /Compromiso: 13\s*pts/.test(document.querySelector('[data-role="commitment"]').innerText));
      await page.getByRole('button', { name: 'Llenar hasta la capacidad' }).click();
      await until(page, async () => (await getItem(page, pid, 'j3')).sprintId === r2s.id, 'j3 agregado al llenar');
      eq((await getItem(page, pid, 'j4')).sprintId, null, 'j4 no cabe');
      await page.locator('[data-role="sprint-items"] tr[data-item-id="j2"]').getByRole('button', { name: /Quitar HU-021/ }).click();
      await until(page, async () => (await getItem(page, pid, 'j2')).sprintId === null, 'j2 quitado');
      await page.waitForFunction(() => /Compromiso: 13\s*pts/.test(document.querySelector('[data-role="commitment"]').innerText));
      eq((await getItem(page, pid, 'j2')).status, 'backlog', 'un elemento quitado antes de iniciar sigue en el backlog');
      await page.fill(`#ags-cap-${r2s.id}`, '10');
      await page.press(`#ags-cap-${r2s.id}`, 'Enter');
      await page.waitForSelector('[data-role="over-capacity"]');
      assert(/Supera la capacidad en 3 pts/.test(await page.locator('[data-role="over-capacity"]').innerText().then(nb)), 'aviso textual de sobrecapacidad');
      await page.fill(`#ags-cap-${r2s.id}`, '20');
      await page.press(`#ags-cap-${r2s.id}`, 'Enter');
      await page.waitForSelector('[data-role="over-capacity"]', { state: 'detached' });
    });

    await step('Solo una iteración en curso: iniciar queda deshabilitado con explicación', async () => {
      assert(await page.locator('[data-role="sprint-start"]').isDisabled(), 'botón deshabilitado');
      assert(/Ya hay una iteración en curso \(Iteración 3\)/.test(await page.locator('[data-role="start-hint"]').innerText().then(nb)), 'explicación visible');
    });

    await step('Cerrar iteración: completed, lo no terminado vuelve al backlog y doneDate se conserva', async () => {
      await page.click('.ags-rel[data-release-id="r1"]');
      await page.waitForSelector('[data-role="planner"][data-sprint-id="s3"]');
      await page.click('[data-role="sprint-close"]');
      const dlg = dialog(page);
      assert(/5 pts/.test(await dlg.innerText().then(nb)) && /14 pts/.test(await dlg.innerText().then(nb)), 'resumen del cierre');
      await dlg.getByRole('button', { name: 'Cerrar iteración' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && spr(x, 's3').status === 'cerrado' ? x : null; }, 's3 cerrada');
      eq([spr(a, 's3').completed, spr(a, 's3').committed], [5, 14], 'terminado y comprometido');
      const i8 = await until(page, async () => { const x = await getItem(page, pid, 'i8'); return x.sprintId === null ? x : null; }, 'i8 devuelto');
      const i9 = await getItem(page, pid, 'i9'), i7 = await getItem(page, pid, 'i7');
      eq([i8.status, i8.history[i8.history.length - 1].status, i8.doneDate, i9.status, i9.sprintId], ['backlog', 'backlog', null, 'backlog', null], 'pendientes al backlog con historial');
      eq([i7.status, i7.sprintId, i7.doneDate], ['terminado', 's3', '2026-09-03'], 'terminado conserva iteración y fecha');
      eq(spr(a, 's3').unfinished.map((u) => [u.code, u.estimate]), [['HU-008', 5], ['HU-009', 4]], 'registro de lo no terminado al cierre');
      await page.waitForSelector('[data-role="unfinished"]');
      assert(/HU-008, HU-009/.test(await page.locator('[data-role="unfinished"]').innerText().then(nb)), 'nota de lo no terminado');
    });

    await step('Iniciar iteración: committed, elementos a la primera columna y release en curso', async () => {
      await page.click('.ags-rel[data-release-id="r2"]');
      await page.waitForSelector(`[data-role="planner"][data-sprint-id="${r2s.id}"]`);
      await page.click('[data-role="sprint-start"]');
      await dialog(page).getByRole('button', { name: 'Iniciar iteración' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && spr(x, r2s.id).status === 'en-curso' ? x : null; }, 'iteración iniciada');
      eq([spr(a, r2s.id).committed, rel(a, 'r2').status], [13, 'en-curso'], 'compromiso fijo y estado del release');
      const j1 = await until(page, async () => { const x = await getItem(page, pid, 'j1'); return x.status === 'por-hacer' ? x : null; }, 'j1 por hacer');
      eq([j1.history[j1.history.length - 1].status, j1.sprintAddedDate || null], ['por-hacer', null], 'historial y sin fecha de ingreso tardío');
      await page.locator('[data-role="candidates"] tr[data-item-id="j4"]').getByRole('button', { name: /Agregar HU-023/ }).click();
      const j4 = await until(page, async () => { const x = await getItem(page, pid, 'j4'); return x.sprintId === r2s.id ? x : null; }, 'j4 agregado tras el inicio');
      eq([j4.sprintAddedDate, j4.status], [await page.evaluate(() => PM.date.today()), 'por-hacer'], 'ingreso tardío registrado');
      eq(spr(await getAgile(page, pid), r2s.id).committed, 13, 'el compromiso no cambia al agregar después del inicio');
    });

    let nextId;
    await step('Cerrar pasando lo pendiente a una nueva iteración', async () => {
      await page.evaluate(async (pid) => { const x = await PM.store.get(PM.paths.backlogItem(pid, 'j1')); const st = PM.agile.settings(await PM.store.get(PM.paths.tool(pid, 'agile'))); await PM.store.set(PM.paths.backlogItem(pid, 'j1'), PM.agile.withStatus(st, x, 'terminado', '2026-10-05')); }, pid);
      await page.waitForTimeout(200);
      await page.click('[data-role="sprint-close"]');
      const dlg = dialog(page);
      await dlg.getByText(/Pasarlos a una nueva iteración/).click();
      await dlg.getByRole('button', { name: 'Cerrar iteración' }).click();
      const a = await until(page, async () => { const x = await getAgile(page, pid); return x && spr(x, r2s.id).status === 'cerrado' && x.sprints.length === 5 ? x : null; }, 'cierre con iteración nueva');
      const next = a.sprints.find((s) => s.releaseId === 'r2' && s.id !== r2s.id);
      nextId = next.id;
      eq([spr(a, r2s.id).completed, spr(a, r2s.id).committed, next.name, next.status, next.start], [8, 13, 'Iteración 5', 'planeado', '2026-10-13'], 'iteración cerrada y siguiente creada (12 oct festivo)');
      const j3 = await until(page, async () => { const x = await getItem(page, pid, 'j3'); return x.sprintId === nextId ? x : null; }, 'j3 pasa a la siguiente');
      const j4 = await getItem(page, pid, 'j4'), j1 = await getItem(page, pid, 'j1');
      eq([j3.status, j4.sprintId, j4.sprintAddedDate, j1.doneDate, j1.sprintId], ['por-hacer', nextId, null, '2026-10-05', r2s.id], 'pendientes movidos y terminado conservado');
    });

    await step('Documentos: sin plantillas ágiles el botón se deshabilita con explicación', async () => {
      await page.evaluate((sid) => PM.navigate('iteraciones', { release: 'r2', sprint: sid }), r2s.id);
      await page.waitForSelector(`[data-role="planner"][data-sprint-id="${r2s.id}"]`);
      const hasAgileTpl = await page.evaluate(() => !!PM.templates['planificacion-sprint']);
      if (!hasAgileTpl) {
        eq(await page.locator('[data-role="doc-unavailable"]').count(), 3, 'explicación en las tres plantillas');
        assert(await page.locator('[data-doc-kind="planificacion"] button').isDisabled(), 'botón deshabilitado');
      }
    });

    await step('Documentos de la iteración prellenados y lecciones aprendidas sin duplicar', async () => {
      await page.evaluate((tpls) => { if (!PM.templates['planificacion-sprint']) PM.registerTemplates(tpls); }, STUB_TEMPLATES);
      await page.evaluate((sid) => { PM.navigate('metricas-agiles'); PM.navigate('iteraciones', { release: 'r2', sprint: sid }); }, r2s.id);
      await page.waitForSelector(`[data-role="planner"][data-sprint-id="${r2s.id}"] [data-doc-kind="planificacion"] button:not([disabled])`);
      await page.locator('[data-doc-kind="planificacion"]').getByRole('button', { name: 'Crear y abrir' }).click();
      const st = await until(page, async () => { const s = await page.evaluate(() => PM.getState()); return s.view === 'documento' ? s : null; }, 'abre el documento');
      assert(/^planificacion-sprint--/.test(st.params.docId), 'docId de la planificación');
      const plan = await getDoc(page, pid, st.params.docId);
      const f = plan.fields;
      eq([f.iteracion, f.release, f.fechaInicio, f.fechaFin, f.objetivo, f.capacidad, f.compromiso, f.elementos.map((e) => e.codigo)], ['Iteración 4', 'Release 2 · Facturación', '2026-09-28', '2026-10-09', 'Emitir la primera factura electrónica', 20, 13, ['HU-020', 'HU-022', 'HU-023']], 'campos de la planificación');
      assert(f.velocidadReferencia > 0 && Array.isArray(f.participantes) && f.participantes.length === 3 && f.elementos[0].tipo === 'Historia de usuario' && f.elementos[0].estimacion === 8, 'velocidad, participantes y fila de elemento');
      await until(page, async () => { const x = await getAgile(page, pid); return spr(x, r2s.id).docs && spr(x, r2s.id).docs.planificacion === st.params.docId; }, 'docId guardado en la iteración');
      await page.evaluate((sid) => PM.navigate('iteraciones', { release: 'r2', sprint: sid }), r2s.id);
      await page.locator('[data-doc-kind="revision"]').getByRole('button', { name: 'Crear y abrir' }).click();
      const st2 = await until(page, async () => { const s = await page.evaluate(() => PM.getState()); return s.view === 'documento' && /^acta-revision-sprint--/.test(s.params.docId || '') ? s : null; }, 'abre el acta de revisión');
      const rev = await getDoc(page, pid, st2.params.docId);
      eq([rev.fields.objetivoCumplido, rev.fields.comprometido, rev.fields.terminado, rev.fields.elementos.map((e) => [e.codigo, e.resultado])], ['Parcialmente', 13, 8, [['HU-020', 'Aceptado'], ['HU-022', 'No terminado'], ['HU-023', 'No terminado']]], 'acta de revisión con lo no terminado');
      await page.evaluate((sid) => PM.navigate('iteraciones', { release: 'r2', sprint: sid }), r2s.id);
      await page.locator('[data-doc-kind="retrospectiva"]').getByRole('button', { name: 'Crear y abrir' }).click();
      const st3 = await until(page, async () => { const s = await page.evaluate(() => PM.getState()); return s.view === 'documento' && /^retrospectiva--/.test(s.params.docId || '') ? s : null; }, 'abre la retrospectiva');
      const retroId = st3.params.docId;
      await page.evaluate(async ({ pid, id }) => {
        const d = PM.clone(await PM.store.get(PM.paths.doc(pid, id)));
        d.fields.lecciones = [{ id: 'l1', situacion: 'La DIAN cambió el anexo técnico durante la iteración', impacto: 'Negativo', recomendacion: 'Revisar el anexo técnico vigente en el refinamiento' }, { id: 'l2', situacion: 'Las pruebas con el proveedor tecnológico fueron rápidas', impacto: 'Positivo', recomendacion: 'Mantener el ambiente de pruebas compartido' }];
        await PM.store.set(PM.paths.doc(pid, id), d);
      }, { pid, id: retroId });
      const retro = await getDoc(page, pid, retroId);
      eq([retro.fields.iteracion, retro.fields.formato], ['Iteración 4', 'Bien, mejorar y acciones'], 'retrospectiva prellenada');
      await page.evaluate((sid) => PM.navigate('iteraciones', { release: 'r2', sprint: sid }), r2s.id);
      await page.waitForSelector('[data-role="lessons-send"]:not([disabled])');
      await page.click('[data-role="lessons-send"]');
      const reg = await until(page, async () => { const d = await getDoc(page, pid, 'registro-lecciones'); return d && d.fields.lecciones && d.fields.lecciones.length === 2 ? d : null; }, 'lecciones enviadas');
      eq(reg.fields.lecciones.map((r) => [r.id, r.area, r.impacto, r.registradoPor]), [['LA-001', 'Integración', 'Negativo', 'Retrospectiva Iteración 4'], ['LA-002', 'Integración', 'Positivo', 'Retrospectiva Iteración 4']], 'filas del registro de lecciones');
      await page.waitForFunction(() => /2 de 2 lecciones enviadas/.test(document.querySelector('[data-role="sprint-docs"]').innerText));
      await page.click('[data-role="lessons-send"]');
      await page.waitForTimeout(900);
      eq((await getDoc(page, pid, 'registro-lecciones')).fields.lecciones.length, 2, 'no se duplican al enviar de nuevo');
      const docs = (await getAgile(page, pid)).sprints.find((s) => s.id === r2s.id).docs;
      eq(Object.keys(docs).sort(), ['planificacion', 'retrospectiva', 'revision'], 'docIds guardados en la iteración');
      assert(await page.locator('[data-doc-kind="planificacion"]').getByRole('button', { name: 'Abrir' }).count() === 1, 'el documento creado se ofrece para abrir');
    });

    await step('Métricas: los ocho gráficos tienen datos, resumen accesible y tabla', async () => {
      await page.evaluate(() => PM.navigate('metricas-agiles', { release: 'r1', sprint: 's3' }));
      await page.waitForSelector('svg[data-chart="burndown"]');
      const charts = await page.$$eval('svg[data-chart]', (els) => els.map((e) => [e.dataset.chart, e.getAttribute('role'), (e.getAttribute('aria-label') || '').length > 20]));
      eq(charts.map((c) => c[0]), ['burndown', 'burnup', 'velocity', 'cfd', 'cycle-time', 'throughput', 'forecast', 'agile-evm'], 'gráficos presentes');
      assert(charts.every((c) => c[1] === 'img' && c[2]), 'role="img" y aria-label con resumen');
      const data = await page.evaluate(() => ({
        rem: document.querySelector('svg[data-chart="burndown"] path[data-series="remaining"]').getAttribute('d').length,
        ideal: document.querySelector('svg[data-chart="burndown"] path[data-series="ideal"]').getAttribute('d').length,
        scope: document.querySelector('svg[data-chart="burnup"] path[data-series="scope"]').getAttribute('d').length,
        base: !!document.querySelector('svg[data-chart="burnup"] [data-role="baseline"]'),
        bars: document.querySelectorAll('svg[data-chart="velocity"] path[data-series="completed"]').length,
        avg: !!document.querySelector('svg[data-chart="velocity"] [data-role="average"]'),
        cfd: document.querySelectorAll('svg[data-chart="cfd"] [data-series]').length,
        lanes: [...document.querySelectorAll('svg[data-chart="forecast"] [data-lane]')].map((e) => e.dataset.lane),
        evm: document.querySelectorAll('svg[data-chart="agile-evm"] [data-series]').length,
        dots: document.querySelectorAll('svg[data-chart="cycle-time"] circle[data-point]').length,
        weeks: document.querySelectorAll('svg[data-chart="throughput"] path[data-week]').length,
        aria: document.querySelector('svg[data-chart="burndown"]').getAttribute('aria-label'),
      }));
      assert(data.rem > 10 && data.ideal > 10 && data.scope > 10 && data.base, 'series del burndown y el burnup: ' + JSON.stringify(data));
      eq([data.bars, data.avg, data.cfd, data.evm, data.dots], [3, true, 4, 4, 7], 'barras de velocidad, capas del flujo, barras AgileEVM y puntos del tiempo de ciclo');
      assert(data.lanes.includes('fc') || data.lanes.includes('plan'), 'carriles del pronóstico: ' + data.lanes);
      assert(data.weeks >= 4, 'semanas de rendimiento');
      assert(/Burndown de Iteración 3/.test(nb(data.aria)) && /quedan 9 pts de un alcance de 14 pts/.test(nb(data.aria)) && /compromiso inicial 14 pts/.test(nb(data.aria)), 'el burndown de la iteración cerrada conserva lo no terminado: ' + data.aria);
      await page.locator('[data-chart-card="burndown"] [data-role="toggle-data"]').click();
      eq(await page.locator('[data-chart-card="burndown"] [data-role="chart-data"] tbody tr').count(), 11, 'tabla del burndown (día 0 + 10 días hábiles)');
      eq(await page.getAttribute('[data-chart-card="burndown"] [data-role="toggle-data"]', 'aria-expanded'), 'true', 'aria-expanded');
      await page.locator('[data-chart-card="burndown"] .ags-chart').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForSelector('[data-chart-card="burndown"] .chart-tip');
      assert(/Restante/.test(await page.locator('[data-chart-card="burndown"] .chart-tip').innerText().then(nb)), 'tooltip con el teclado');
      await page.keyboard.press('Escape');
      const evm = await page.locator('[data-role="evm-tiles"]').innerText().then(nb);
      assert(/\$ 120 M/.test(evm) && /SPI/.test(evm) && /CPI/.test(evm) && /EAC/.test(evm) && /VAC/.test(evm), 'indicadores AgileEVM');
      const cmp = await page.locator('[data-role="evm-compare"]').innerText().then(nb);
      assert(/Proyecto \(valor ganado\)/.test(cmp) && /Actividad vinculada/.test(cmp), 'comparación con el proyecto y la actividad');
      const ac = await page.evaluate(() => [...document.querySelectorAll('[data-role="evm-tiles"] .stat')].find((s) => /AC \(costo real\)/.test(s.innerText)).innerText);
      assert(/\$ 30 M/.test(ac), 'AC del release desde los costos reales: ' + ac);
      await page.locator('#ags-m-rel').selectOption('r2');
      await page.waitForFunction(() => /Release 2/.test(document.querySelector('[data-chart-card="burnup"] .h3').textContent));
      assert(/Iteración 4|Iteración 5/.test(await page.locator('[data-chart-card="burndown"] .h3').innerText().then(nb)), 'la iteración se ajusta al release');
      eq(await errorCards(page), [], 'tarjetas de error');
    });

    await step('Solo lectura: sin acciones de edición', async () => {
      await page.evaluate(() => PM.setState({ canWrite: false }));
      await page.evaluate(() => PM.navigate('iteraciones', { release: 'r2' }));
      await page.waitForSelector('[data-role="release-detail"]');
      eq(await page.locator('[data-role="release-new"]').count(), 0, 'sin «Nuevo release»');
      eq(await page.getByRole('button', { name: 'Editar release' }).count(), 0, 'sin «Editar release»');
      eq(await page.locator('[data-role="sprint-add"]').count(), 0, 'sin «Agregar iteración»');
      assert(/Solo lectura/.test(await page.locator('.page-head').innerText().then(nb)), 'distintivo de solo lectura');
      const capDisabled = await page.locator('[data-role="planner"] input.num').first().isDisabled();
      assert(capDisabled, 'capacidad deshabilitada');
      eq(await page.locator('[data-role="candidates"] button:has-text("Agregar")').count(), 0, 'sin botones para agregar');
      await page.evaluate(() => PM.setState({ canWrite: true }));
    });

    await step('Kanban: las iteraciones son opcionales y se explica', async () => {
      await page.evaluate(async (pid) => { const a = PM.clone(await PM.store.get(PM.paths.tool(pid, 'agile'))); a.settings.framework = 'kanban'; await PM.store.set(PM.paths.tool(pid, 'agile'), a); }, pid);
      await page.waitForSelector('[data-role="kanban-note"]');
      assert(/opcionales/.test(await page.locator('[data-role="kanban-note"]').innerText().then(nb)), 'nota de Kanban');
    });

    await step('params.release selecciona el release indicado', async () => {
      await page.evaluate(() => PM.navigate('iteraciones', { release: 'r1' }));
      await page.waitForSelector('.ags-rel[data-release-id="r1"][aria-pressed="true"]');
      await page.evaluate(() => PM.navigate('iteraciones', { release: 'r2' }));
      await page.waitForSelector('.ags-rel[data-release-id="r2"][aria-pressed="true"]');
    });

    await step('Configuración ágil: el botón aparece solo si existe PM.agileSettingsDialog', async () => {
      const has = await page.evaluate(() => typeof PM.agileSettingsDialog === 'function');
      eq(await page.locator('[data-role="agile-settings"]').count(), has ? 1 : 0, 'botón de configuración');
      if (!has) {
        await page.evaluate(() => { window.__called = 0; PM.agileSettingsDialog = () => { window.__called++; }; PM.navigate('metricas-agiles'); PM.navigate('iteraciones'); });
        await page.click('[data-role="agile-settings"]');
        eq(await page.evaluate(() => window.__called), 1, 'llama a PM.agileSettingsDialog');
        await page.evaluate(() => { delete PM.agileSettingsDialog; });
      }
    });

    await step('Sin errores de consola ni tarjetas de error', async () => {
      eq(await errorCards(page), [], 'tarjetas de error');
      eq(errors, [], 'errores de consola');
    });
  } finally { await browser.close(); }
}

/* ================================================================== proyecto predictivo */
{
  const { browser, page, errors } = await newApp({ meta: { lifecycle: 'Predictivo' }, seed: false });
  try {
    await step('Proyecto predictivo: vistas ocultas en el menú y aviso con «Usar ciclo de vida híbrido»', async () => {
      const labels = await page.$$eval('.nav-item', (els) => els.map((e) => e.textContent.trim()));
      assert(!labels.some((l) => /Releases e iteraciones|Métricas ágiles/.test(l)), 'no deben aparecer en el menú');
      await gotoView(page, 'iteraciones');
      assert(/Herramientas ágiles no activas/.test(await page.locator('.view-host').innerText().then(nb)), 'aviso de vista no disponible');
      await page.getByRole('button', { name: 'Usar ciclo de vida híbrido' }).click();
      await page.waitForSelector('[data-view="iteraciones"]');
      assert(/Aún no hay releases/.test(await page.locator('.view-host').innerText().then(nb)), 'estado vacío útil');
      await gotoView(page, 'metricas-agiles');
      assert(/Aún no hay datos para las métricas/.test(await page.locator('.view-host').innerText().then(nb)), 'métricas vacías con explicación');
      eq(errors, [], 'errores de consola');
    });
  } finally { await browser.close(); }
}

/* ================================================================== móvil (400 px), tema oscuro y escritorio ancho */
for (const cfg of [{ tag: 'móvil 400 px', width: 400, height: 860 }, { tag: 'tema oscuro', width: 1360, height: 900, dark: true }, { tag: 'escritorio 1920 px', width: 1920, height: 1000 }]) {
  const { browser, page, errors } = await newApp({ width: cfg.width, height: cfg.height, dark: cfg.dark });
  try {
    for (const view of ['iteraciones', 'metricas-agiles']) {
      await step(`${cfg.tag}: ${view} sin desborde horizontal ni errores`, async () => {
        await gotoView(page, view);
        await page.waitForTimeout(500);
        eq(await errorCards(page), [], 'tarjetas de error');
        const ov = await horizontalOverflow(page);
        assert(ov <= 1, 'desborde horizontal de ' + ov + ' px');
        if (shots) await page.screenshot({ path: join(shots, `${view}-${cfg.width}${cfg.dark ? '-dark' : ''}.png`), fullPage: true });
      });
    }
    if (cfg.width === 400) {
      await step('móvil 400 px: el editor de release y la planificación caben en la pantalla', async () => {
        await gotoView(page, 'iteraciones');
        await page.click('[data-role="release-new"]');
        const box = await dialog(page).boundingBox();
        assert(box.x >= 0 && box.x + box.width <= 401, 'el diálogo cabe: ' + JSON.stringify(box));
        await dialog(page).getByRole('button', { name: 'Cancelar' }).click();
        const sw = await page.locator('[data-role="planner"]').evaluate((el) => el.scrollWidth - el.clientWidth);
        assert(sw <= 1, 'la tarjeta de planificación no se desborda (las tablas se desplazan dentro)');
        assert((await horizontalOverflow(page)) <= 1, 'sin desborde');
      });
    }
    if (cfg.dark) {
      await step('tema oscuro: colores de los gráficos desde tokens', async () => {
        await gotoView(page, 'metricas-agiles');
        const fill = await page.evaluate(() => getComputedStyle(document.querySelector('svg[data-chart="velocity"] path[data-series="completed"]')).fill);
        const s1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--s1').trim());
        assert(fill && fill !== 'none', 'relleno de barras: ' + fill + ' (s1 ' + s1 + ')');
        const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.card')).backgroundColor);
        assert(/rgb\(21, 28, 37\)/.test(bg), 'tarjetas con superficie oscura: ' + bg);
      });
    }
    if (cfg.width === 1920) {
      await step('escritorio 1920 px: las vistas usan todo el ancho y las métricas van en varias columnas', async () => {
        await gotoView(page, 'iteraciones');
        const w = await page.evaluate(() => { const h = document.querySelector('.view-host'); const cs = getComputedStyle(h); return [document.querySelector('.ags-layout').getBoundingClientRect().width, h.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)]; });
        assert(Math.abs(w[0] - w[1]) <= 2, 'releases e iteraciones a todo el ancho: ' + w);
        await gotoView(page, 'metricas-agiles');
        const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.ags-charts')).gridTemplateColumns.split(' ').length);
        assert(cols >= 2, 'columnas de gráficos: ' + cols);
        const gap = await page.evaluate(() => { const svg = document.querySelector('svg[data-chart="burnup"]'); const c = svg.closest('.chart'); return c.clientWidth - svg.getBoundingClientRect().width; });
        assert(gap <= 2, 'el gráfico ocupa el ancho de su tarjeta: ' + gap);
      });
    }
    await step(`${cfg.tag}: sin errores de consola`, async () => eq(errors, [], 'errores de consola'));
  } finally { await browser.close(); }
}

/* ================================================================== rendimiento con 320 elementos */
{
  const many = [...ITEMS];
  for (let k = 0; k < 320; k++) {
    const done = k % 3 === 0;
    many.push(it('p' + k, 'HU-' + String(100 + k).padStart(3, '0'), 'Elemento de carga ' + k, (k % 5) + 1, {
      releaseId: k % 2 ? 'r1' : 'r2', createdAt: '2026-07-' + String(1 + (k % 28)).padStart(2, '0'),
      ...(done ? { status: 'terminado', sprintId: ['s1', 's2', 's3'][k % 3], doneDate: '2026-08-' + String(3 + (k % 25)).padStart(2, '0'), history: H([['2026-07-28', 'backlog'], ['2026-08-03', 'en-curso'], ['2026-08-' + String(3 + (k % 25)).padStart(2, '0'), 'terminado']]) } : {}),
    }));
  }
  const { browser, page, errors, pid } = await newApp({ width: 1360, height: 900, seedOpts: { items: many } });
  try {
    await step('Rendimiento: 340 elementos — vistas en menos de 2,5 s y agregar un elemento rápido', async () => {
      await page.waitForFunction(() => true);
      let t0 = Date.now();
      await page.evaluate(() => PM.navigate('iteraciones', { release: 'r1' }));
      await page.waitForSelector('[data-role="planner"][data-sprint-id="s3"] [data-role="candidates"] tr[data-item-id]');
      const tIt = Date.now() - t0;
      assert(tIt < 2500, 'iteraciones: ' + tIt + ' ms');
      eq(await page.locator('[data-role="candidates"] tbody tr').count(), 60, 'candidatos limitados a 60 con «Mostrar»');
      assert(/Mostrar los \d+ candidatos/.test(await page.locator('[data-role="candidates"]').innerText().then(nb)), 'botón para mostrar todos');
      await page.fill('[data-role="candidates"] input[type="search"]', 'carga 15');
      const n = await page.locator('[data-role="candidates"] tbody tr').count();
      assert(n >= 1 && n <= 12, 'búsqueda de candidatos: ' + n);
      await page.fill('[data-role="candidates"] input[type="search"]', '');
      const first = page.locator('[data-role="candidates"] tbody tr').first();
      const fid = await first.getAttribute('data-item-id');
      t0 = Date.now();
      await first.locator('button').click();
      await page.waitForSelector(`[data-role="sprint-items"] tr[data-item-id="${fid}"]`);
      const tAdd = Date.now() - t0;
      assert(tAdd < 1500, 'agregar un elemento: ' + tAdd + ' ms');
      t0 = Date.now();
      await page.evaluate(() => PM.navigate('metricas-agiles', { release: 'r1' }));
      await page.waitForSelector('svg[data-chart="cycle-time"] circle[data-point]');
      const tMe = Date.now() - t0;
      assert(tMe < 2500, 'métricas: ' + tMe + ' ms');
      console.log('     tiempos: iteraciones ' + tIt + ' ms, agregar ' + tAdd + ' ms, métricas ' + tMe + ' ms');
      eq(errors, [], 'errores de consola');
      void pid;
    });
  } finally { await browser.close(); }
}

console.log('\n' + (failures ? failures + ' prueba(s) fallaron de ' + results.length + '.' : 'Todas las pruebas pasaron (' + results.length + ').'));
process.exit(failures ? 1 : 0);

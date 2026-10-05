// Prueba de interacción del módulo 80-dashboard (vistas tablero, lineas-base y ficha).
// Uso: node test/dashboard.test.mjs [--file ruta.html] [--shots dir]
//   Sin --file construye una página aislada (núcleo + 80) en un directorio temporal.
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
let file = opt('--file');
if (!file) {
  const dir = mkdtempSync(join(tmpdir(), 'dashboard-test-'));
  file = join(dir, 'dashboard.html');
  execFileSync('node', [join(root, 'build.mjs'), '--out', file, '--include', '80'], { stdio: 'ignore' });
}
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let fails = 0, passes = 0;
const check = (name, cond, extra) => { if (cond) { passes++; console.log('ok   ' + name); } else { fails++; console.log('FAIL ' + name + (extra !== undefined ? '\n      ' + JSON.stringify(extra) : '')); } };
const wait = (page, ms) => page.waitForTimeout(ms);

const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
const shot = async (name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

try {
  /* ------------------------------------------------------------ 1. proyecto vacío */
  const pid = await createProject(page, { name: 'Andamio multidireccional Torre 2', code: 'PRY-2026-014', start: '2026-08-03', end: '2026-12-18' });
  await wait(page, 600);
  check('tablero: ruta sugerida destacada en proyecto vacío', await page.locator('[data-card="route"][data-prominent="true"]').count() === 1);
  check('tablero: 14 pasos pendientes en proyecto vacío (planificación + monitoreo y cierre)', await page.locator('.dashboard-step[data-state="pending"]').count() === 14);
  const phaseCounts = await page.$$eval('[data-card="route"] [data-phase]', (els) => els.map((e) => e.getAttribute('data-phase') + ':' + e.querySelectorAll('.dashboard-step').length));
  check('ruta sugerida: dos fases (8 de planificación, 6 de monitoreo, control y cierre)', JSON.stringify(phaseCounts) === '["plan:8","control:6"]', phaseCounts);
  const lastSteps = await page.$$eval('[data-phase="control"] .dashboard-step', (els) => els.map((e) => e.getAttribute('data-step')));
  check('ruta sugerida: la ruta termina en el cierre (informe final y acta de cierre)', JSON.stringify(lastSteps) === '["avance","informe","cambios","entregables","informe-final","acta-cierre"]', lastSteps);
  check('tablero: sin sugerencia de estado en un proyecto sin línea base', await page.locator('[data-status-hint]').count() === 0);
  check('tablero: KPI avance sin datos muestra —', (await page.locator('[data-kpi="avance"] .stat-value').innerText()).trim() === '—');
  check('tablero: KPI enlaza a crear cronograma', await page.locator('[data-kpi="avance"] .dashboard-link', { hasText: 'Crear cronograma' }).count() === 1);
  check('tablero: curva S vacía explica qué falta', await page.locator('[data-card="scurve"] .dashboard-blank').count() === 1);
  check('tablero: líneas base vacías', await page.locator('[data-card="baselines"] .chip', { hasText: 'Sin línea base' }).count() === 3);
  check('tablero: registros sin crear ofrecen crearlos', await page.locator('[data-card="incidents"]').getByRole('button', { name: 'Crear registro de incidentes' }).count() === 1 && await page.locator('[data-card="changes"]').getByRole('button', { name: 'Crear registro de cambios' }).count() === 1);
  await shot('01-tablero-vacio');
  /* enlaces de los indicadores y de la ruta sugerida */
  await page.locator('[data-kpi="avance"] .dashboard-link').click();
  check('KPI: «Crear cronograma» navega al cronograma', (await page.evaluate(() => PM.getState().view)) === 'cronograma');
  await gotoView(page, 'tablero');
  await page.locator('.dashboard-step[data-step="edt"]').click();
  check('ruta sugerida: el paso EDT abre la EDT', (await page.evaluate(() => PM.getState().view)) === 'edt');
  await gotoView(page, 'tablero');
  await page.locator('.dashboard-step[data-step="acta"]').click();
  const actaNav = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params, hasOpen: typeof PM.openDocument === 'function' }));
  check('ruta sugerida: el acta abre el documento (o la lista si no hay editor)', actaNav.hasOpen ? actaNav.view === 'documento' && actaNav.params.docId === 'acta-constitucion' : actaNav.view === 'documentos', actaNav);
  await gotoView(page, 'tablero');
  /* establecer línea base sin planificación: advertencias y cancelar no guarda */
  await page.locator('[data-card="baselines"]').getByRole('button', { name: 'Establecer línea base' }).click();
  await wait(page, 300);
  const warnItems = await page.locator('.modal .dashboard-note.warn li').count();
  check('modal sin planificación: 3 advertencias (EDT, cronograma, costos)', warnItems === 3, warnItems);
  await page.locator('.modal input[name="bl-cost"]').uncheck();
  check('modal: desmarcar costos marca la vista previa como no incluida', (await page.locator('.modal [data-preview="cost"]').getAttribute('data-off')) === 'true' && await page.locator('.modal .dashboard-note.warn li').count() === 2);
  await page.locator('.modal').getByRole('button', { name: 'Cancelar' }).click();
  await wait(page, 200);
  check('modal cancelado: no se guarda ninguna línea base', (await page.evaluate((pid) => PM.store.list(PM.paths.baselines(pid)), pid)).length === 0);

  /* ------------------------------------------------------------ 2. datos de prueba */
  const today = await page.evaluate(() => PM.date.today());
  await page.evaluate(async (pid) => {
    PM.registerTemplates([
      { id: 'acta-constitucion', name: 'Acta de constitución del proyecto', area: 'integracion', group: 'inicio', sections: [] },
      { id: 'registro-incidentes', name: 'Registro de incidentes', area: 'integracion', group: 'ejecucion', sections: [] },
      { id: 'registro-cambios', name: 'Registro de cambios', area: 'integracion', group: 'monitoreo', sections: [] },
      { id: 'enunciado-alcance', name: 'Enunciado del alcance del proyecto', area: 'alcance', group: 'planificacion', sections: [{ id: 's1', title: 'Alcance', fields: [{ key: 'descripcionAlcance', label: 'Descripción del alcance del producto', type: 'textarea' }, { key: 'exclusiones', label: 'Exclusiones', type: 'textarea' }] }] },
      { id: 'registro-riesgos', name: 'Registro de riesgos', area: 'riesgos', group: 'planificacion', sections: [] },
      { id: 'registro-interesados', name: 'Registro de interesados', area: 'interesados', group: 'inicio', sections: [] },
    ]);
    const P = PM.paths;
    const nodes = [
      { id: 'n1', parentId: null, name: 'Gestión del proyecto', order: 1 },
      { id: 'n2', parentId: null, name: 'Ingeniería', order: 2 },
      { id: 'n3', parentId: null, name: 'Suministro y logística', order: 3 },
      { id: 'n4', parentId: null, name: 'Montaje', order: 4 },
      { id: 'n41', parentId: 'n4', name: 'Montaje niveles 1–5', order: 1 },
      { id: 'n42', parentId: 'n4', name: 'Montaje niveles 6–10', order: 2 },
      { id: 'n43', parentId: 'n4', name: 'Montaje niveles 11–15', order: 3 },
      { id: 'n5', parentId: null, name: 'Desmontaje y retiro', order: 5 },
    ];
    const fs = (id) => [{ id, type: 'FS', lag: 0 }];
    const tasks = [
      { id: 't1', name: 'Levantamiento y diseño del andamio', wbsId: 'n2', duration: 10, deps: [], cost: 20e6, progress: 100 },
      { id: 'm1', name: 'Ingeniería aprobada', wbsId: 'n2', duration: 0, milestone: true, deps: fs('t1'), progress: 100 },
      { id: 't2', name: 'Alistamiento e inspección en bodega', wbsId: 'n3', duration: 8, deps: fs('t1'), cost: 25e6, progress: 100 },
      { id: 't3', name: 'Transporte a obra', wbsId: 'n3', duration: 3, deps: fs('t2'), cost: 15e6, progress: 100 },
      { id: 't4', name: 'Montaje niveles 1–5', wbsId: 'n41', duration: 15, deps: fs('t3'), cost: 90e6, progress: 100 },
      { id: 't5', name: 'Montaje niveles 6–10', wbsId: 'n42', duration: 15, deps: fs('t4'), cost: 90e6, progress: 60 },
      { id: 'm2', name: 'Andamio certificado niveles 1–10', wbsId: 'n42', duration: 0, milestone: true, deps: fs('t5'), progress: 0 },
      { id: 't6', name: 'Montaje niveles 11–15', wbsId: 'n43', duration: 15, deps: fs('t5'), cost: 90e6, progress: 0 },
      { id: 'm3', name: 'Entrega del andamio completo', wbsId: 'n43', duration: 0, milestone: true, deps: fs('t6'), progress: 0 },
      { id: 't7', name: 'Alquiler y mantenimiento en obra', wbsId: 'n1', duration: 12, deps: fs('m3'), cost: 60e6, progress: 0 },
      { id: 't8', name: 'Desmontaje y retiro', wbsId: 'n5', duration: 10, deps: fs('t7'), cost: 50e6, progress: 0 },
      { id: 'm4', name: 'Acta de entrega y cierre', wbsId: 'n1', duration: 0, milestone: true, deps: fs('t8'), progress: 0 },
      { id: 't9', name: 'Dirección y control del proyecto', wbsId: 'n1', duration: 30, deps: [], cost: 12e6, progress: 50 },
    ];
    await PM.store.set(P.tool(pid, 'wbs'), { nodes });
    await PM.store.set(P.tool(pid, 'schedule'), { settings: { workweek: 6, holidaysCO: true, extraHolidays: ['2026-12-24'] }, tasks });
    await PM.store.set(P.tool(pid, 'costs'), {
      actuals: [{ id: 'a1', date: '2026-08-20', amount: 22e6, taskId: 't1' }, { id: 'a2', date: '2026-09-05', amount: 45e6, taskId: 't2' }, { id: 'a3', date: '2026-09-30', amount: 150e6, taskId: 't4' }],
      statusUpdates: [{ id: 's1', date: '2026-08-22', progress: { t1: 100, t2: 30 } }, { id: 's2', date: '2026-09-12', progress: { t2: 100, t3: 100, t4: 40 } }],
      reserves: { contingency: 22.6e6, management: 11.9e6 },
    });
    const doc = (template, title, status, fields) => ({ template, title, status, rev: status === 'aprobado' ? '0' : 'A', fields, titleBlock: {}, createdAt: PM.nowIso(), updatedAt: PM.nowIso() });
    await PM.store.set(P.doc(pid, 'registro-riesgos'), doc('registro-riesgos', 'Registro de riesgos', 'revision', { riesgos: [
      { id: 'R-001', descripcion: 'Lluvias intensas detienen el montaje', probabilidad: 4, impacto: 3, tipo: 'Amenaza', propietario: 'Residente de obra', estado: 'Abierto' },
      { id: 'R-002', descripcion: 'Accidente en trabajo en alturas', probabilidad: 2, impacto: 5, tipo: 'Amenaza', propietario: 'Coordinador SST', estado: 'En seguimiento' },
      { id: 'R-003', descripcion: 'Faltantes de piezas en bodega', probabilidad: 3, impacto: 3, tipo: 'Amenaza', estado: 'Abierto' },
      { id: 'R-004', descripcion: 'Cambio del cliente en la secuencia de obra', probabilidad: 3, impacto: 4, tipo: 'Amenaza', estado: 'Abierto' },
      { id: 'R-005', descripcion: 'Retraso en pagos del cliente', probabilidad: 5, impacto: 5, tipo: 'Amenaza', estado: 'Cerrado' },
      { id: 'R-006', descripcion: 'Restricción de circulación de carga en Bogotá', probabilidad: 2, impacto: 2, tipo: 'Amenaza', estado: 'Abierto' },
      { id: 'R-007', descripcion: 'Disponibilidad de grúa del cliente', probabilidad: 1, impacto: 3, tipo: 'Amenaza', estado: 'Abierto' },
      { id: 'R-008', descripcion: 'Reutilizar formaleta de otra obra', probabilidad: 3, impacto: 2, tipo: 'Oportunidad', estado: 'Abierto' },
      { id: 'R-009', descripcion: 'Daño de equipo en obra por impacto de maquinaria', probabilidad: 5, impacto: 4, tipo: 'Amenaza', estado: 'Materializado' },
    ] }));
    await PM.store.set(P.doc(pid, 'registro-incidentes'), doc('registro-incidentes', 'Registro de incidentes', 'borrador', { incidentes: [
      { id: 'INC-001', fecha: '2026-09-20', descripcion: 'Piezas dañadas en el lote de transporte 3', prioridad: 'Media', responsable: 'Almacén', fechaObjetivo: '2026-10-10', estado: 'En curso' },
      { id: 'INC-002', fecha: '2026-09-25', descripcion: 'Interventoría exige plan de rescate actualizado', prioridad: 'Alta', responsable: 'Coordinador SST', fechaObjetivo: '2026-09-30', estado: 'Abierto' },
      { id: 'INC-003', fecha: '2026-08-25', descripcion: 'Acceso vehicular bloqueado', prioridad: 'Baja', estado: 'Cerrado' },
    ] }));
    await PM.store.set(P.doc(pid, 'registro-cambios'), doc('registro-cambios', 'Registro de cambios', 'aprobado', { cambios: [
      { id: 'CC-001', fecha: '2026-09-02', solicitante: 'Director de obra del cliente', descripcion: 'Plataforma adicional de descargue en el nivel 8', tipo: 'Actualización', impactoCronograma: 4, impactoCosto: 18e6, estado: 'Aprobada', fechaDecision: '2026-09-09' },
      { id: 'CC-002', fecha: '2026-09-20', solicitante: 'Interventoría', descripcion: 'Malla de protección adicional en fachada norte', impactoCosto: 6e6, estado: 'Registrada' },
      { id: 'CC-003', fecha: '2026-09-28', solicitante: 'Residente de obra', descripcion: 'Cambiar la secuencia de montaje de la torre de acceso', impactoCronograma: 2, estado: 'En análisis' },
      { id: 'CC-004', fecha: '2026-08-28', descripcion: 'Retirar la marquesina perimetral', estado: 'Rechazada' },
    ] }));
    await PM.projectOps.update(pid, { statusDate: '2026-10-02', client: 'Constructora Modelo S.A.S. (ficticia)', manager: 'Director de proyecto', sponsor: 'Gerencia General' });
  }, pid);
  await gotoView(page, 'ficha');
  await gotoView(page, 'tablero');
  await wait(page, 500);

  /* ------------------------------------------------------------ 3. tablero con datos */
  const expected = await page.evaluate(async (pid) => {
    const project = await PM.store.get(PM.paths.project(pid));
    const schedule = await PM.store.get(PM.paths.tool(pid, 'schedule'));
    const costs = await PM.store.get(PM.paths.tool(pid, 'costs'));
    const sched = PM.calc.computeSchedule(schedule, project.start);
    const e = PM.calc.evm({ sched, costBaseline: null, costs, statusDate: project.statusDate });
    return { spi: PM.fmt.idx(e.spi), cpi: PM.fmt.idx(e.cpi), avance: PM.fmt.pct(e.pctComplete, 1), eac: PM.fmt.moneyShort(e.eac, 'COP'), fin: PM.fmt.date(e.forecastFinish || sched.finish), bac: e.bac };
  }, pid);
  const kpi = async (sel) => (await page.locator(sel).first().innerText()).trim();
  check('KPI avance = EV/BAC', (await kpi('[data-kpi="avance"] .stat-value')) === expected.avance, [await kpi('[data-kpi="avance"] .stat-value'), expected.avance]);
  check('KPI SPI', (await kpi('[data-index="spi"] .stat-value')) === expected.spi, [await kpi('[data-index="spi"] .stat-value'), expected.spi]);
  check('KPI CPI', (await kpi('[data-index="cpi"] .stat-value')) === expected.cpi, [await kpi('[data-index="cpi"] .stat-value'), expected.cpi]);
  check('KPI EAC', (await kpi('[data-kpi="eac"] .stat-value')) === expected.eac, [await kpi('[data-kpi="eac"] .stat-value'), expected.eac]);
  check('KPI fin pronosticado', (await kpi('[data-kpi="fin"] .stat-value')) === expected.fin, [await kpi('[data-kpi="fin"] .stat-value'), expected.fin]);
  check('KPI días hábiles restantes numérico', /^\d+$/.test(await page.locator('[data-kpi="fin"] [data-remaining]').getAttribute('data-remaining')));
  check('KPI avance con medidor real vs planificado', await page.locator('[data-kpi="avance"] .dashboard-meter-plan').count() === 1);
  check('curva S: 3 series dibujadas', await page.locator('[data-card="scurve"] svg path[data-series]').count() === 3);
  const hit = page.locator('[data-card="scurve"] .dashboard-hit');
  const hb = await hit.boundingBox();
  await page.mouse.move(hb.x + hb.width * 0.4, hb.y + hb.height / 2);
  await wait(page, 150);
  check('curva S: tooltip al pasar el cursor', (await page.locator('[data-card="scurve"] .chart-tip').innerText()).includes('Valor planificado (PV)'));
  if (shots) await page.locator('[data-card="scurve"]').screenshot({ path: join(shots, '02b-curva-s-tooltip.png') });
  check('curva S: marcador de corte', await page.locator('[data-card="scurve"] svg text', { hasText: 'Corte' }).count() === 1);
  /* el recuadro de información no se sale del gráfico aunque el cursor esté al pie */
  await hit.scrollIntoViewIfNeeded();
  const hb2 = await hit.boundingBox();
  await page.mouse.move(hb2.x + hb2.width * 0.3, hb2.y + hb2.height - 4);
  await wait(page, 150);
  const tipBox = await page.locator('[data-card="scurve"] .chart-tip').boundingBox();
  const chartBox = await page.locator('[data-card="scurve"] .chart').boundingBox();
  check('curva S: información visible dentro del gráfico', tipBox && tipBox.y + tipBox.height <= chartBox.y + chartBox.height + 1, { tipBox, chartBox });
  const clipped = await page.$$eval('[data-card="scurve"] svg text', (els) => els.filter((e) => { const b = e.getBBox(); const w = +e.ownerSVGElement.getAttribute('width'); return b.x < 0 || b.x + b.width > w + 0.5; }).map((e) => e.textContent));
  check('curva S: etiquetas de los ejes sin recortar', clipped.length === 0, clipped);
  await page.mouse.move(5, 5);
  const msIds = await page.$$eval('[data-milestone]', (els) => els.map((e) => e.getAttribute('data-milestone')));
  check('hitos: próximos pendientes en orden', JSON.stringify(msIds) === JSON.stringify(['m2', 'm3', 'm4']), msIds);
  check('hitos: subtítulo con cumplidos', (await page.locator('[data-card="milestones"] .dashboard-panel-head').innerText()).includes('1 de 4 hitos cumplidos'));
  const riskIds = await page.$$eval('[data-risk]', (els) => els.map((e) => e.getAttribute('data-risk')));
  check('riesgos: top 5 por P×I sin cerrados ni materializados', JSON.stringify(riskIds) === JSON.stringify(['R-001', 'R-004', 'R-002', 'R-003', 'R-008']), riskIds);
  check('riesgos: un riesgo «Materializado» no cuenta como abierto (mismo criterio que la matriz)', !riskIds.includes('R-009') && (await kpi('[data-card="risks"] [data-count]')) === '7' && (await page.locator('[data-card="risks"] .dashboard-panel-head').innerText()).includes('7 abiertos · 3 de nivel alto'), await page.locator('[data-card="risks"] .dashboard-panel-head').innerText());
  check('riesgos: enlace a los restantes', (await page.locator('[data-card="risks"]').innerText()).includes('Ver los 2 riesgos abiertos restantes'));
  check('incidentes abiertos = 2', (await kpi('[data-card="incidents"] [data-count]')) === '2');
  const incIds = await page.$$eval('[data-incident]', (els) => els.map((e) => e.getAttribute('data-incident')));
  check('incidentes: prioridad alta primero', JSON.stringify(incIds) === JSON.stringify(['INC-002', 'INC-001']), incIds);
  check('incidentes: vencido marcado', (await page.locator('[data-incident="INC-002"]').innerText()).includes('Vencido'));
  check('cambios pendientes = 2', (await kpi('[data-card="changes"] [data-count]')) === '2');
  check('cambios: subtítulo con aprobadas', (await page.locator('[data-card="changes"] .dashboard-panel-head').innerText()).includes('1 aprobada en total'));
  /* conteos esperados según el catálogo cargado (plantillas de prueba o reales) y los documentos sembrados */
  const expDocs = await page.evaluate(() => {
    const st = { 'registro-riesgos': 'wip', 'registro-incidentes': 'wip', 'registro-cambios': 'ok' };
    const c = (f) => { const l = PM.templateList.filter(f); const r = { ok: 0, wip: 0, none: 0, total: l.length }; for (const t of l) r[st[t.id] || 'none']++; return r; };
    return { integ: c((t) => t.area === 'integracion'), plan: c((t) => t.group === 'planificacion') };
  });
  const docInt = await page.locator('[data-docrow="integracion"]').getAttribute('aria-label');
  const ei = expDocs.integ;
  check('documentación: conteo del área de integración (singular concordado)', ei.ok === 1 && ei.wip === 1 && docInt.includes('1 aprobado, ' + ei.wip + ' en elaboración y ' + ei.none + ' sin iniciar, de ' + ei.total + ' documentos') && !docInt.includes('1 aprobados'), [docInt, ei]);
  const docPlan = await page.locator('[data-docrow="planificacion"]').getAttribute('aria-label');
  check('documentación: plural con cero aprobados', /: 0 aprobados, /.test(docPlan), docPlan);
  check('documentación: conteo del grupo de planificación', (await page.locator('[data-docrow="planificacion"] .dashboard-docrow-count').innerText()).trim() === expDocs.plan.ok + '/' + expDocs.plan.total);
  check('ruta sugerida: plegada al haber datos', await page.locator('[data-card="route"][data-prominent="false"]').count() === 1 && await page.locator('.dashboard-step').count() === 0);
  await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
  const states = await page.$$eval('.dashboard-step', (els) => Object.fromEntries(els.map((e) => [e.getAttribute('data-step'), e.getAttribute('data-state')])));
  check('ruta sugerida: estados calculados', JSON.stringify(states) === JSON.stringify({ acta: 'pending', interesados: 'pending', alcance: 'pending', edt: 'done', cronograma: 'done', presupuesto: 'done', riesgos: 'done', lineabase: 'pending', avance: 'done', informe: 'pending', cambios: 'partial', entregables: 'pending', 'informe-final': 'pending', 'acta-cierre': 'pending' }), states);
  check('ruta sugerida: control de cambios con solicitudes pendientes de decisión', (await page.locator('.dashboard-step[data-step="cambios"] .chip').innerText()).trim() === '2 pendientes de decisión');
  check('ruta sugerida: no se declara completa', !(await page.locator('[data-route-summary]').innerText()).includes('Completaste'));
  check('ruta sugerida: siguiente paso = acta', (await page.locator('.dashboard-step[data-next="true"]').getAttribute('data-step')) === 'acta');
  check('cajetín: cliente', (await page.locator('.dashboard-tb').innerText()).includes('Constructora Modelo S.A.S. (ficticia)'));
  check('cajetín: fecha de corte', (await page.locator('.dashboard-tb input[type="date"]').inputValue()) === '2026-10-02');
  const finText = await page.locator('[data-kpi="fin"]').innerText();
  check('KPI fin: variación sin doble signo', /\d+ días hábiles de (adelanto|atraso)/.test(finText) && !/[−+]\d+ días hábiles de/.test(finText), finText);
  check('KPI: tonos semánticos de SPI y CPI', (await page.locator('[data-index="spi"] .stat-value').getAttribute('style')).includes('var(--crit)') && (await page.locator('[data-index="cpi"] .stat-value').getAttribute('style')).includes('var(--warn)'));
  check('KPI: lectura del CPI < 0,98 = «Por encima del presupuesto» (como la vista de valor ganado)', (await kpi('[data-index="cpi"] .stat-sub')) === 'Por encima del presupuesto' && (await kpi('[data-index="spi"] .stat-sub')) === 'Atrasado');
  const strokes = await page.$$eval('[data-card="scurve"] svg path[data-series]', (els) => Object.fromEntries(els.map((e) => [e.getAttribute('data-series'), e.style.stroke])));
  check('curva S: colores de la vista de valor ganado (PV --s1, EV --s3, AC --s2)', strokes.pv === 'var(--s1)' && strokes.ev === 'var(--s3)' && strokes.ac === 'var(--s2)', strokes);
  const legendKeys = await page.$$eval('[data-card="scurve"] .legend .legend-line', (els) => els.map((e) => e.style.background));
  check('curva S: la leyenda usa los mismos colores', JSON.stringify(legendKeys) === JSON.stringify(['var(--s1)', 'var(--s3)', 'var(--s2)']), legendKeys);
  if (await page.evaluate(() => !!PM.getView('valor-ganado'))) {
    await gotoView(page, 'valor-ganado');
    await wait(page, 400);
    const evmStrokes = await page.$$eval('svg path[data-series]', (els) => Object.fromEntries(els.filter((e) => ['pv', 'ev', 'ac'].includes(e.getAttribute('data-series'))).map((e) => [e.getAttribute('data-series'), e.style.stroke])));
    check('curva S: mismos colores que la vista «Curva S y valor ganado»', ['pv', 'ev', 'ac'].every((k) => evmStrokes[k] && evmStrokes[k] === strokes[k]), { evmStrokes, strokes });
    await gotoView(page, 'tablero');
  }
  await shot('02-tablero');
  /* documentación: una fila de área abre la lista filtrada */
  await page.locator('[data-docrow="riesgos"]').click();
  const docNav = await page.evaluate(() => ({ view: PM.getState().view, area: PM.getState().params.area }));
  check('documentación: el área abre Documentos filtrado', docNav.view === 'documentos' && docNav.area === 'riesgos', docNav);
  await gotoView(page, 'tablero');
  /* hito vencido al mover la fecha de corte */
  await page.evaluate((pid) => PM.projectOps.update(pid, { statusDate: '2026-10-20' }), pid);
  await wait(page, 300);
  check('hitos: vencido después de la fecha de corte', (await page.locator('[data-milestone="m2"]').innerText()).includes('Vencido'));
  await page.evaluate((pid) => PM.projectOps.update(pid, { statusDate: '2026-10-02' }), pid);
  await wait(page, 300);
  check('hitos: no vencido en la fecha de corte original', !(await page.locator('[data-milestone="m2"]').innerText()).includes('Vencido'));
  /* borrar la fecha del control la restablece sin guardar */
  await page.locator('.dashboard-tb input[type="date"]').fill('');
  await page.locator('.dashboard-tb input[type="date"]').blur();
  await wait(page, 300);
  check('cajetín: fecha vacía se restablece', (await page.locator('.dashboard-tb input[type="date"]').inputValue()) === '2026-10-02' && (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid)) === '2026-10-02');

  /* fecha de corte desde el cajetín */
  await page.locator('.dashboard-tb input[type="date"]').fill('2026-09-15');
  await page.locator('.dashboard-tb input[type="date"]').blur();
  await wait(page, 400);
  check('cajetín: fecha de corte guardada', (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid)) === '2026-09-15');
  await page.locator('.dashboard-tb').getByRole('button', { name: 'Usar hoy' }).click();
  await wait(page, 400);
  check('cajetín: «Usar hoy» fija la fecha de hoy', (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.statusDate), pid)) === today);
  await page.evaluate((pid) => PM.projectOps.update(pid, { statusDate: '2026-10-02' }), pid);
  await wait(page, 300);

  /* ------------------------------------------------------------ 4. líneas base */
  await gotoView(page, 'lineas-base');
  check('líneas base: estado vacío explicado', await page.locator('.empty-title', { hasText: 'Aún no hay líneas base' }).count() === 1);
  check('líneas base: estado de la planificación', await page.locator('[data-card="readiness"]').count() === 1);
  await shot('03-lineas-base-vacio');
  await page.getByRole('button', { name: 'Establecer línea base' }).first().click();
  await wait(page, 300);
  const modal = page.locator('.modal');
  check('modal LB0 abierto', (await modal.locator('.modal-title').innerText()).includes('LB0'));
  check('modal: vista previa del cronograma', (await modal.locator('[data-preview="schedule"]').innerText()).includes('9 actividades y 4 hitos'));
  check('modal: vista previa del alcance', (await modal.locator('[data-preview="scope"]').innerText()).includes('8 elementos de la EDT (7 paquetes de trabajo)'));
  check('modal: vista previa de costos', (await modal.locator('[data-preview="cost"]').innerText()).includes('$ 452.000.000'));
  check('modal LB0: sin advertencia de solicitud de cambio', await modal.locator('[data-warn="change"]').count() === 0);
  await modal.locator('#bl-note').fill('Plan aprobado por el patrocinador en el comité de arranque');
  await shot('04-modal-lb0');
  await modal.getByRole('button', { name: 'Establecer LB0' }).click();
  await wait(page, 600);
  const bl0 = await page.evaluate((pid) => PM.store.list(PM.paths.baselines(pid)), pid);
  const b0 = bl0[0] && bl0[0].data;
  check('LB0 guardada (1 documento)', bl0.length === 1, bl0.length);
  check('LB0: forma del documento', b0 && b0.number === 0 && b0.label === 'LB0' && b0.date === today && JSON.stringify(b0.includes) === '["scope","schedule","cost"]' && b0.note === 'Plan aprobado por el patrocinador en el comité de arranque' && b0.changeRef === null && 'byId' in b0, b0 && { number: b0.number, label: b0.label, date: b0.date, includes: b0.includes, note: b0.note, changeRef: b0.changeRef });
  check('LB0: instantánea de cronograma', b0 && b0.schedule && b0.schedule.tasks.length === 13 && /^\d{4}-\d{2}-\d{2}$/.test(b0.schedule.finish));
  check('LB0: instantánea de costos', b0 && b0.cost && b0.cost.bac === expected.bac && b0.cost.contingency === 22.6e6 && b0.cost.management === 11.9e6, b0 && b0.cost && b0.cost.bac);
  check('LB0: instantánea de alcance', b0 && b0.scope && b0.scope.wbs.length === 8 && b0.scope.scopeStatement === null);
  check('líneas base: fila LB0 vigente', (await page.locator('tr[data-bl="LB0"]').innerText()).includes('Vigente'));
  check('líneas base: detalle LB0 visible', await page.locator('[data-card="baseline-detail"][data-bl="LB0"]').count() === 1);
  check('comparación: fin sin variación', (await kpi('[data-compare="schedule"] [data-summary="finish"] .dashboard-summary-v')) === '0');

  /* cambio en el cronograma, costos y EDT → variaciones */
  await page.evaluate(async (pid) => {
    const s = PM.clone(await PM.store.get(PM.paths.tool(pid, 'schedule')));
    s.tasks.find((t) => t.id === 't4').duration = 20;
    s.tasks.find((t) => t.id === 't6').cost = 100e6;
    s.tasks.push({ id: 't10', name: 'Plataforma adicional de descargue', wbsId: 'n42', duration: 3, deps: [{ id: 't4', type: 'FS', lag: 0 }], cost: 18e6, progress: 0 });
    await PM.store.set(PM.paths.tool(pid, 'schedule'), s);
    const w = PM.clone(await PM.store.get(PM.paths.tool(pid, 'wbs')));
    w.nodes.find((n) => n.id === 'n2').name = 'Ingeniería y diseño';
    w.nodes.push({ id: 'n44', parentId: 'n4', name: 'Plataformas de descargue', order: 4 });
    await PM.store.set(PM.paths.tool(pid, 'wbs'), w);
  }, pid);
  await wait(page, 500);
  check('comparación: fin del proyecto +5', (await kpi('[data-compare="schedule"] [data-summary="finish"] .dashboard-summary-v')) === '+5');
  check('comparación: t4 fin +5', (await kpi('tr[data-task="t4"] [data-var="finish"]')) === '+5');
  check('comparación: t4 inicio 0', (await kpi('tr[data-task="t4"] [data-var="start"]')) === '0');
  check('comparación: t5 desplazada +5', (await kpi('tr[data-task="t5"] [data-var="start"]')) === '+5');
  check('comparación: actividad nueva', (await page.locator('tr[data-task="t10"]').getAttribute('data-kind')) === 'new');
  const schedHead = await page.locator('[data-compare="schedule"] thead').innerText();
  check('comparación del cronograma: columnas «Inicio vigente» y «Fin vigente» (no «actual», que se confunde con «real»)', schedHead.includes('Inicio vigente') && schedHead.includes('Fin vigente') && !/actual/i.test(schedHead), schedHead);
  await page.locator('[data-compare="schedule"]').getByText('Solo actividades con variación o cambios').click();
  const varRows = await page.locator('[data-compare="schedule"] tbody tr').count();
  check('comparación: filtro solo con variación', varRows > 0 && varRows < 14 && await page.locator('tr[data-task="t1"]').count() === 0, varRows);
  await shot('05-comparacion-cronograma');
  await page.locator('[data-card="baseline-detail"]').getByRole('tab', { name: 'Costos' }).click();
  check('comparación de costos: variación del BAC', (await kpi('[data-summary="bac-var"] .dashboard-summary-v')) === '+$ 28 M', await kpi('[data-summary="bac-var"] .dashboard-summary-v'));
  check('comparación de costos: t6 +10 M', (await page.locator('tr[data-task="t6"]').innerText()).includes('+$ 10 M'));
  const costHead = await page.locator('[data-compare="cost"] thead').innerText();
  const costSummary = await page.locator('[data-compare="cost"] .dashboard-summary').innerText();
  check('comparación de costos: «Presupuesto vigente», nunca «Costo actual» (falso amigo del AC)', costHead.includes('Presupuesto vigente') && !/costo actual/i.test(costHead) && /BAC vigente \(suma de actividades\)/i.test(costSummary) && !/actual/i.test(costSummary), { costHead, costSummary });
  await page.locator('[data-card="baseline-detail"]').getByRole('tab', { name: 'Alcance' }).click();
  check('comparación de alcance: 1 agregado', (await kpi('[data-summary="added"] .dashboard-summary-v')) === '1' && await page.locator('[data-added="n44"]').count() === 1);
  check('comparación de alcance: renombrado', await page.locator('[data-renamed="n2"]').count() === 1);
  await shot('06-comparacion-alcance');
  /* actividad y elemento de la EDT eliminados después de LB0 */
  await page.evaluate(async (pid) => {
    const s = PM.clone(await PM.store.get(PM.paths.tool(pid, 'schedule')));
    s.tasks = s.tasks.filter((t) => t.id !== 't9');
    await PM.store.set(PM.paths.tool(pid, 'schedule'), s);
    const w = PM.clone(await PM.store.get(PM.paths.tool(pid, 'wbs')));
    w.nodes = w.nodes.filter((n) => n.id !== 'n43');
    await PM.store.set(PM.paths.tool(pid, 'wbs'), w);
  }, pid);
  await wait(page, 400);
  check('comparación de alcance: elemento eliminado', await page.locator('[data-removed="n43"]').count() === 1 && (await kpi('[data-summary="removed"] .dashboard-summary-v')) === '1');
  await page.locator('[data-card="baseline-detail"]').getByRole('tab', { name: 'Cronograma' }).click();
  check('comparación: actividad eliminada', (await page.locator('tr[data-task="t9"]').getAttribute('data-kind')) === 'removed' && (await kpi('[data-summary="changes"] .dashboard-summary-v')) === '1 / 1');
  check('comparación: unidad de la variación indicada', (await page.locator('[data-compare="schedule"]').innerText()).includes('días hábiles según el calendario del proyecto'));
  await page.locator('[data-card="baseline-detail"]').getByRole('tab', { name: 'Costos' }).click();
  check('comparación de costos: actividad eliminada resta su costo', (await page.locator('tr[data-task="t9"]').innerText()).includes('−$ 12 M'));

  /* LB1 con solicitud de cambio */
  await page.getByRole('button', { name: 'Establecer línea base' }).first().click();
  await wait(page, 300);
  check('modal LB1: advertencia sin solicitud de cambio', await modal.locator('[data-warn="change"]').count() === 1);
  await modal.locator('#bl-change').selectOption('CC-001');
  await wait(page, 100);
  check('modal LB1: advertencia desaparece al elegir CC-001', await modal.locator('[data-warn="change"]').count() === 0);
  check('modal LB1: detalle del cambio', (await modal.locator('[data-change-detail]').innerText()).includes('Plataforma adicional de descargue'));
  await modal.getByRole('button', { name: 'Establecer LB1' }).click();
  await wait(page, 600);
  const bls = await page.evaluate((pid) => PM.store.list(PM.paths.baselines(pid)), pid);
  const b1 = bls.map((b) => b.data).find((b) => b.number === 1);
  check('LB1 guardada con changeRef', bls.length === 2 && b1 && b1.label === 'LB1' && b1.changeRef === 'CC-001', bls.map((b) => [b.data.label, b.data.changeRef]));
  const rowsOrder = await page.$$eval('tr[data-bl]', (els) => els.map((e) => e.getAttribute('data-bl')));
  check('historial: más reciente primero', JSON.stringify(rowsOrder) === '["LB1","LB0"]', rowsOrder);
  check('historial: LB1 vigente y enlaza CC-001', (await page.locator('tr[data-bl="LB1"]').innerText()).includes('CC-001'));
  check('vigentes: cronograma en LB1', (await page.locator('[data-active="schedule"]').innerText()).includes('LB1'));
  /* «Comparar» desplaza hasta el detalle: suave, salvo que el sistema pida reducir el movimiento */
  await page.evaluate(() => { window.__sv = []; const orig = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (o) { window.__sv.push(o && typeof o === 'object' ? o.behavior : String(o)); return orig.call(this, o); }; });
  await page.locator('tr[data-bl="LB0"]').getByRole('button', { name: 'Comparar' }).click();
  await wait(page, 120);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('tr[data-bl="LB1"]').getByRole('button', { name: 'Comparar' }).click();
  await wait(page, 120);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const sv = await page.evaluate(() => window.__sv);
  check('Comparar: desplazamiento suave normal y sin animación con «reducir movimiento»', JSON.stringify(sv) === '["smooth","auto"]', sv);
  await shot('07-lineas-base');

  /* eliminar LB1 */
  await page.getByRole('button', { name: 'Eliminar LB1' }).click();
  await wait(page, 200);
  check('confirmación explica consecuencias', (await modal.innerText()).includes('pasará a regir LB0'));
  await modal.getByRole('button', { name: 'Eliminar línea base' }).click();
  await wait(page, 500);
  const after = await page.evaluate((pid) => PM.store.list(PM.paths.baselines(pid)), pid);
  check('LB1 eliminada', after.length === 1 && after[0].data.label === 'LB0');
  check('historial con una fila', await page.locator('tr[data-bl]').count() === 1);

  /* tablero refleja la línea base */
  await gotoView(page, 'tablero');
  check('tablero: chip LB0 en las tres partes', await page.locator('[data-card="baselines"] .chip', { hasText: 'LB0' }).count() === 3);
  const m2Text = await page.locator('[data-milestone="m2"]').innerText();
  check('tablero: hito con variación «frente a» LB0', (m2Text.includes('+5 d frente a LB0') || m2Text.includes('+8 d frente a LB0')) && !m2Text.includes(' vs '), m2Text);
  check('tablero: fin pronosticado contra LB0', (await page.locator('[data-kpi="fin"]').innerText()).includes('Fin LB0'));
  /* sugerencia de estado: con línea base y estado «En planificación» */
  check('estado: sin sugerencia si ya está «En ejecución»', await page.locator('[data-status-hint]').count() === 0);
  await page.evaluate((pid) => PM.projectOps.update(pid, { status: 'En planificación' }), pid);
  await wait(page, 300);
  check('estado: con LB0 sugiere pasar a «En ejecución»', await page.locator('[data-status-hint="En ejecución"]').count() === 1 && (await page.locator('[data-status-hint]').innerText()).includes('La línea base LB0 ya está establecida'));
  await page.locator('[data-status-hint]').getByRole('button', { name: 'Cambiar a «En ejecución»' }).click();
  await wait(page, 400);
  check('estado: el botón actualiza el estado del proyecto', (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.status), pid)) === 'En ejecución' && await page.locator('[data-status-hint]').count() === 0);
  await page.evaluate((pid) => PM.projectOps.update(pid, { status: 'En planificación' }), pid);
  await wait(page, 300);
  await page.locator('[data-status-hint]').getByRole('button', { name: 'Ahora no' }).click();
  await wait(page, 150);
  check('estado: «Ahora no» oculta la sugerencia sin cambiar el estado', await page.locator('[data-status-hint]').count() === 0 && (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)).then((p) => p.status), pid)) === 'En planificación');
  await page.evaluate((pid) => PM.projectOps.update(pid, { status: 'En ejecución' }), pid);
  await wait(page, 200);
  /* cierre: acta de cierre en elaboración y luego aprobada con trabajo, riesgos e incidentes abiertos */
  await page.evaluate(async (pid) => {
    PM.registerTemplates([{ id: 'acta-cierre', name: 'Acta de cierre y aceptación final', area: 'integracion', group: 'cierre', sections: [] }]);
    await PM.store.set(PM.paths.doc(pid, 'acta-cierre'), { template: 'acta-cierre', title: 'Acta de cierre', status: 'borrador', rev: 'A', fields: {}, titleBlock: {}, createdAt: PM.nowIso(), updatedAt: PM.nowIso() });
  }, pid);
  await wait(page, 400);
  if (await page.locator('.dashboard-step').count() === 0) await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
  const closeNote = await page.locator('[data-step-note="acta-cierre"]').innerText().catch(() => '');
  check('cierre: el paso del acta advierte lo que falta antes de aprobarla', closeNote.startsWith('Antes de aprobarla:') && /actividades sin terminar/.test(closeNote) && closeNote.includes('7 riesgos abiertos') && closeNote.includes('2 incidentes abiertos'), closeNote);
  check('cierre: con el acta en elaboración sugiere «En cierre»', await page.locator('[data-status-hint="En cierre"]').count() === 1);
  await page.evaluate(async (pid) => { const d = PM.clone(await PM.store.get(PM.paths.doc(pid, 'acta-cierre'))); d.status = 'aprobado'; d.rev = '0'; await PM.store.set(PM.paths.doc(pid, 'acta-cierre'), d); }, pid);
  await wait(page, 400);
  const actaStep = await page.locator('.dashboard-step[data-step="acta-cierre"]');
  check('cierre: un acta aprobada con pendientes no completa la ruta', (await actaStep.getAttribute('data-state')) === 'partial' && (await actaStep.locator('.chip').innerText()).trim() === 'Aprobada con pendientes' && (await page.locator('[data-step-note="acta-cierre"]').innerText()).startsWith('Se aprobó con pendientes:') && !(await page.locator('[data-route-summary]').innerText()).includes('Completaste'));
  check('cierre: con el acta aprobada sugiere «Cerrado»', await page.locator('[data-status-hint="Cerrado"]').count() === 1);
  await page.evaluate(async (pid) => { await PM.store.delete(PM.paths.doc(pid, 'acta-cierre')); }, pid);
  await wait(page, 300);

  /* ------------------------------------------------------------ 5. ficha */
  await gotoView(page, 'ficha');
  check('ficha: formulario con datos', (await page.locator('#pf-name').inputValue()) === 'Andamio multidireccional Torre 2');
  await page.locator('#pf-client').fill('Constructora Altavista S.A.S. (ficticia)');
  await page.locator('#pf-loc').fill('Bogotá D.C., obra Edificio Altavista');
  await page.locator('#pf-lc').selectOption('Híbrido');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await wait(page, 300);
  check('ficha: aviso de guardado', (await page.locator('.toasts').innerText()).includes('Cambios guardados'));
  await page.locator('[data-card="status-date"] input[type="date"]').fill('2026-09-30');
  await page.locator('[data-card="status-date"] input[type="date"]').blur();
  check('ficha: calendario L-S', (await kpi('[data-cal="workweek"]')) === 'Lunes a sábado');
  check('ficha: modo de almacenamiento', await page.locator('[data-storage="local"]').count() === 1);
  const backupTitle = (await page.locator('[data-card="backup"] .h3').innerText()).trim();
  const backupBtns = await page.locator('[data-card="backup"] button').allInnerTexts();
  const dangerBtns = await page.locator('[data-card="danger"] button').allInnerTexts();
  check('ficha: respaldo y eliminación separados, sin «Zona de riesgo»', backupTitle === 'Respaldo y copia' && backupBtns.map((t) => t.trim()).join('|') === 'Exportar (.json)|Duplicar proyecto' && dangerBtns.map((t) => t.trim()).join('|') === 'Eliminar proyecto' && (await page.locator('[data-card="danger"] .h3').innerText()).trim() === 'Eliminar proyecto' && !(await page.locator('.page').innerText()).includes('Zona de riesgo'), { backupTitle, backupBtns, dangerBtns });
  await shot('08-ficha');
  await wait(page, 1600);
  await page.reload();
  await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
  await gotoView(page, 'ficha');
  await wait(page, 400);
  check('persistencia: cliente', (await page.locator('#pf-client').inputValue()) === 'Constructora Altavista S.A.S. (ficticia)');
  check('persistencia: ubicación', (await page.locator('#pf-loc').inputValue()) === 'Bogotá D.C., obra Edificio Altavista');
  check('persistencia: ciclo de vida', (await page.locator('#pf-lc').inputValue()) === 'Híbrido');
  check('persistencia: fecha de corte', (await page.locator('[data-card="status-date"] input[type="date"]').inputValue()) === '2026-09-30');
  await gotoView(page, 'lineas-base');
  check('persistencia: LB0 tras recargar', await page.locator('tr[data-bl="LB0"]').count() === 1);
  await gotoView(page, 'tablero');
  check('persistencia: cajetín actualizado', (await page.locator('.dashboard-tb').innerText()).includes('Constructora Altavista'));

  /* exportar */
  await gotoView(page, 'ficha');
  await page.getByRole('button', { name: 'Exportar (.json)' }).click();
  await wait(page, 600);
  check('exportar: ofrece el contenido JSON', (await page.locator('.modal textarea').inputValue()).includes('"format": "gestor-pmbok"'));
  await page.locator('.modal').getByRole('button', { name: 'Cerrar' }).click();

  /* ------------------------------------------------------------ 6. solo lectura */
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await wait(page, 200);
  check('solo lectura ficha: sin formulario', await page.locator('#pf-name').count() === 0 && await page.locator('[data-readonly-meta]').count() === 1);
  check('solo lectura ficha: sin duplicar ni eliminar', await page.getByRole('button', { name: 'Eliminar proyecto' }).count() === 0 && await page.getByRole('button', { name: 'Duplicar proyecto' }).count() === 0 && await page.locator('[data-card="danger"]').count() === 0 && (await page.locator('[data-card="backup"] .h3').innerText()).trim() === 'Exportar');
  check('solo lectura ficha: fecha de corte sin control', await page.locator('[data-card="status-date"] input').count() === 0);
  await shot('09-ficha-lectura');
  await gotoView(page, 'lineas-base');
  check('solo lectura líneas base: sin establecer ni eliminar', await page.getByRole('button', { name: 'Establecer línea base' }).count() === 0 && await page.getByRole('button', { name: 'Eliminar LB0' }).count() === 0);
  await gotoView(page, 'tablero');
  check('solo lectura tablero: sin controles de edición', await page.getByRole('button', { name: 'Establecer línea base' }).count() === 0 && await page.locator('.dashboard-tb input').count() === 0);
  check('solo lectura tablero: «Ver ficha» en lugar de «Editar ficha»', await page.getByRole('button', { name: 'Ver ficha' }).count() === 1 && await page.getByRole('button', { name: 'Editar ficha' }).count() === 0);
  if (await page.locator('.dashboard-step').count() === 0) await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
  await page.locator('.dashboard-step[data-step="lineabase"]').click();
  await wait(page, 300);
  check('solo lectura: el paso «Línea base» navega sin abrir el formulario', (await page.evaluate(() => PM.getState().view)) === 'lineas-base' && await page.locator('.modal').count() === 0);
  await gotoView(page, 'tablero');
  await page.evaluate(() => PM.setState({ canWrite: true }));
  await wait(page, 200);

  /* ------------------------------------------------------------ 7. 400 px y tema oscuro */
  await page.setViewportSize({ width: 400, height: 860 });
  for (const v of ['tablero', 'lineas-base', 'ficha']) {
    await gotoView(page, v);
    if (v === 'tablero') await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
    const ov = await horizontalOverflow(page);
    check('400 px sin desborde: ' + v, ov <= 1, ov);
    await shot('10-' + v + '-m');
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const v of ['tablero', 'lineas-base']) { await gotoView(page, v); await shot('11-' + v + '-dark-m'); }
  await page.setViewportSize({ width: 1360, height: 900 });
  for (const v of ['tablero', 'lineas-base', 'ficha']) { await gotoView(page, v); await shot('12-' + v + '-dark'); }
  await page.emulateMedia({ colorScheme: 'light' });

  /* ------------------------------------------------------------ 8. duplicar y eliminar */
  await gotoView(page, 'ficha');
  await page.getByRole('button', { name: 'Duplicar proyecto' }).click();
  await wait(page, 200);
  await page.locator('.modal').getByRole('button', { name: 'Duplicar proyecto' }).click();
  await page.waitForFunction((pid) => PM.getState().projectId && PM.getState().projectId !== pid, pid, { timeout: 10000 });
  await wait(page, 500);
  const dup = await page.evaluate(async () => { const id = PM.getState().projectId; const p = await PM.store.get(PM.paths.project(id)); const b = await PM.store.list(PM.paths.baselines(id)); return { id, name: p.name, view: PM.getState().view, baselines: b.length }; });
  check('duplicar: nueva copia seleccionada con sus líneas base', dup.name === 'Andamio multidireccional Torre 2 (copia)' && dup.view === 'ficha' && dup.baselines === 1, dup);
  await page.getByRole('button', { name: 'Eliminar proyecto' }).click();
  await wait(page, 200);
  await page.locator('.modal').getByRole('button', { name: 'Eliminar proyecto' }).click();
  await wait(page, 800);
  const left = await page.evaluate(() => PM.store.list('projects').then((l) => l.map((x) => x.id)));
  check('eliminar: la copia desaparece y vuelve al portafolio', left.length === 1 && left[0] === pid && (await page.evaluate(() => PM.getState().view)) === 'portafolio', left);

  /* ------------------------------------------------------------ 9. sin costos, sin avance y moneda USD */
  const pid2 = await createProject(page, { name: 'Proyecto sin costos', code: 'PRY-TEST-002', currency: 'USD', budget: 1500, end: '2026-12-18' });
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true }, tasks: [
      { id: 'a', name: 'Diseño', duration: 10, deps: [], progress: 100 },
      { id: 'b', name: 'Montaje', duration: 10, deps: [{ id: 'a', type: 'FS', lag: 0 }], progress: 20 },
    ] });
    await PM.projectOps.update(pid, { statusDate: '2026-08-21' });
  }, pid2);
  await gotoView(page, 'tablero');
  await wait(page, 400);
  check('sin costos: avance ponderado por duración', (await page.locator('[data-kpi="avance"]').innerText()).includes('Ponderado por duración') && (await kpi('[data-kpi="avance"] .stat-value')) === '60 %');
  check('sin costos: EAC explica que el BAC es cero y enlaza al cronograma', (await page.locator('[data-kpi="eac"]').innerText()).includes('el BAC es cero') && await page.locator('[data-kpi="eac"] .dashboard-link', { hasText: 'Asignar costos' }).count() === 1);
  check('sin costos: curva S explica qué falta', (await page.locator('[data-card="scurve"]').innerText()).includes('tienen costo'));
  /* fecha de corte posterior al fin calculado con trabajo pendiente */
  await page.evaluate((pid) => PM.projectOps.update(pid, { statusDate: '2026-09-30' }), pid2);
  await wait(page, 300);
  check('fin calculado vencido con trabajo pendiente: aviso', (await page.locator('[data-kpi="fin"]').innerText()).includes('ya vencido') && await page.locator('[data-kpi="fin"] [data-remaining]').count() === 0);
  /* costos pequeños en USD y costos reales sin avance */
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true }, tasks: [
      { id: 'a', name: 'Diseño', duration: 10, deps: [], cost: 600, progress: 0 },
      { id: 'b', name: 'Montaje', duration: 10, deps: [{ id: 'a', type: 'FS', lag: 0 }], cost: 650, progress: 0 },
    ] });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [{ id: 'x', date: '2026-08-05', amount: 300 }], statusUpdates: [], reserves: { contingency: 0, management: 0 } });
    await PM.projectOps.update(pid, { statusDate: '2026-08-10' });
  }, pid2);
  await wait(page, 400);
  check('costos reales sin avance: EAC explica que falta el avance', (await page.locator('[data-kpi="eac"]').innerText()).includes('ningún avance registrado'), await page.locator('[data-kpi="eac"]').innerText());
  const usdLabels = await page.$$eval('[data-card="scurve"] svg text', (els) => els.map((e) => { const b = e.getBBox(); return { t: e.textContent, x: b.x, r: b.x + b.width, w: +e.ownerSVGElement.getAttribute('width') }; }));
  check('USD: etiquetas de los ejes en dólares y sin recortar', usdLabels.some((l) => l.t.startsWith('US$')) && usdLabels.every((l) => l.x >= 0 && l.r <= l.w + 0.5), usdLabels);
  await shot('13-tablero-usd');
  /* la ficha no abre el teclado al entrar (sin foco inicial en el nombre) */
  await gotoView(page, 'ficha');
  await wait(page, 300);
  check('ficha: sin foco automático en el formulario', (await page.evaluate(() => document.activeElement && document.activeElement.id)) !== 'pf-name');
  await page.locator('#pf-name').click();
  check('ficha: el nombre se puede enfocar al hacer clic', (await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'pf-name');

  /* ------------------------------------------------------------ 10. lectura de SPI y CPI cerca de 1 */
  const pid3 = await createProject(page, { name: 'Proyecto índices', code: 'PRY-TEST-003', start: '2026-09-01', end: '2026-10-30' });
  const setIdx = (progress, ac) => page.evaluate(async ({ pid, progress, ac }) => {
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [{ id: 't1', name: 'Actividad A', duration: 40, deps: [], progress, cost: 1000000 }] });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [{ id: 'a1', date: '2026-09-15', amount: ac, taskId: 't1' }], statusUpdates: [], reserves: { contingency: 0, management: 0 } });
    await PM.projectOps.update(pid, { statusDate: '2026-09-30' });
  }, { pid: pid3, progress, ac });
  const idxRead = async () => ({ spi: await kpi('[data-index="spi"] .stat-value'), spiWord: await kpi('[data-index="spi"] .stat-sub'), cpi: await kpi('[data-index="cpi"] .stat-value'), cpiWord: await kpi('[data-index="cpi"] .stat-sub'), cpiStyle: await page.locator('[data-index="cpi"] .stat-value').getAttribute('style'), spiStyle: await page.locator('[data-index="spi"] .stat-value').getAttribute('style') });
  await setIdx(51, 512000);
  await gotoView(page, 'tablero');
  await wait(page, 400);
  let ir = await idxRead();
  check('índices: CPI 0,996 se lee «Dentro del presupuesto» en verde (no «Sobre el presupuesto»)', ir.cpi === '1,00' && ir.cpiWord === 'Dentro del presupuesto' && ir.cpiStyle.includes('var(--good)'), ir);
  check('índices: sin la expresión ambigua «Sobre el presupuesto»', !(await page.locator('[data-kpi="indices"]').innerText()).includes('Sobre el presupuesto'));
  await setIdx(55, 552700);
  await wait(page, 400);
  ir = await idxRead();
  const spiV = parseFloat(ir.spi.replace(',', '.'));
  check('índices: SPI entre 0,98 y 1,02 se lee «Al día»', spiV >= 0.98 && spiV <= 1.02 && ir.spiWord === 'Al día' && ir.spiStyle.includes('var(--good)'), ir);
  await setIdx(90, 500000);
  await wait(page, 400);
  ir = await idxRead();
  check('índices: por encima de 1,02 se lee «Adelantado» y «Por debajo del presupuesto»', ir.spiWord === 'Adelantado' && ir.cpiWord === 'Por debajo del presupuesto', ir);

  /* ------------------------------------------------------------ 11. proyecto de ejemplo (página completa) */
  if (await page.evaluate(() => !!(PM.exampleBuilders && PM.exampleBuilders.length))) {
    await page.evaluate(() => PM.createExampleProject());
    await page.waitForFunction(() => PM.getState().view === 'tablero', null, { timeout: 30000 });
    await wait(page, 1200);
    const exp = await page.evaluate(async () => {
      const pid = PM.getState().projectId;
      const d = await PM.store.get(PM.paths.doc(pid, 'registro-riesgos'));
      const rows = (d && d.fields && d.fields.riesgos) || [];
      const open = rows.filter((r) => r && (String(r.descripcion || '').trim() || String(r.id || '').trim()) && !/^(cerrado|materializado)$/i.test(String(r.estado || '').trim()));
      return { open: open.length, materialized: rows.filter((r) => /^materializado$/i.test(String(r.estado || '').trim())).map((r) => r.id) };
    });
    const exRisks = await page.$$eval('[data-risk]', (els) => els.map((e) => e.getAttribute('data-risk')));
    check('ejemplo: riesgos abiertos con el criterio de la matriz (sin materializados)', (await kpi('[data-card="risks"] [data-count]')) === String(exp.open) && exp.materialized.every((id) => !exRisks.includes(id)), { exp, exRisks });
    const summary = await page.locator('[data-route-summary]').innerText();
    check('ejemplo: con la planificación completa la ruta sigue con monitoreo y cierre', summary.includes('planificación completa') && !summary.includes('Completaste') && /de 14 pasos/.test(summary), summary);
    await page.locator('[data-card="route"]').getByRole('button', { name: 'Mostrar pasos' }).click();
    check('ejemplo: siguiente paso en la fase de monitoreo y control', (await page.locator('.dashboard-step[data-next="true"]').getAttribute('data-step')) === 'informe');
    check('ejemplo: entregables aceptados contados del registro', /^\d+ de \d+ aceptados$/.test((await page.locator('.dashboard-step[data-step="entregables"] .chip').innerText()).trim()));
    const exIdx = await idxRead();
    check('ejemplo: CPI 0,97 se lee «Por encima del presupuesto»', exIdx.cpi === '0,97' && exIdx.cpiWord === 'Por encima del presupuesto', exIdx);
    check('ejemplo: sin sugerencia de estado (en ejecución, sin cierre)', await page.locator('[data-status-hint]').count() === 0);
    await shot('14-tablero-ejemplo-ruta');
    const ovEx = await horizontalOverflow(page);
    check('ejemplo: sin desborde horizontal', ovEx <= 1, ovEx);
  }

  const cards = await errorCards(page);
  check('sin tarjetas de error', cards.length === 0, cards);
} catch (e) {
  fails++; console.log('EXCEPTION', e);
} finally {
  check('sin errores de consola', errors.length === 0, errors);
  await browser.close();
}
console.log(`\n${passes}/${passes + fails} verificaciones correctas`);
process.exit(fails ? 1 : 0);

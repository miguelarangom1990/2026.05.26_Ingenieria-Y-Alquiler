// Pruebas de la capa ágil del núcleo (07-agile-core): configuración, estados, burndown, velocidad, burnup,
// pronóstico, AgileEVM, flujo acumulado, variación del release y avance de releases en el cronograma.
// Uso: node test/agile-core.test.mjs [--file gestor-pmbok.html]
import { openApp, createProject, gotoView } from './harness.mjs';
const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const { browser, page, errors } = await openApp({ file: fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html' });
const results = await page.evaluate(() => {
  const out = []; const eq = (name, got, exp) => out.push({ name, ok: JSON.stringify(got) === JSON.stringify(exp), got, exp });
  const A = PM.agile, C = PM.calc;
  // Enfoque según el ciclo de vida
  eq('modo por ciclo de vida', ['Predictivo', 'Adaptativo (ágil)', 'Híbrido', 'Iterativo', 'Incremental', undefined].map((lc) => A.mode({ lifecycle: lc })), ['predictivo', 'adaptativo', 'hibrido', 'hibrido', 'hibrido', 'predictivo']);
  eq('habilitado', [A.enabled({ lifecycle: 'Predictivo' }), A.enabled({ lifecycle: 'Híbrido' }), A.enabled(null)], [false, true, false]);
  // Configuración por defecto y columnas inválidas
  const st = A.settings(null);
  eq('configuración por defecto', [st.framework, st.estimationUnit, st.sprintLength, st.columns.length, st.scopeChangeThreshold], ['scrum-kanban', 'puntos', 10, 4, 10]);
  eq('columnas sin «terminado» → por defecto', A.settings({ settings: { columns: [{ id: 'x', name: 'X', category: 'pendiente' }] } }).columns.length, 4);
  eq('unidad horas', [A.unitShort(A.settings({ settings: { estimationUnit: 'horas' } })), A.unitShort(st)], ['h', 'pts']);
  eq('categorías', [A.category(st, 'backlog'), A.category(st, null), A.category(st, 'por-hacer'), A.category(st, 'en-revision'), A.category(st, 'terminado'), A.category(st, 'xx')], ['nuevo', 'nuevo', 'pendiente', 'en-curso', 'terminado', 'nuevo']);
  // Códigos y nuevos elementos
  eq('siguiente código', [A.nextCode([{ code: 'HU-002' }, { code: 'HU-010' }, { code: 'DF-001' }], 'historia'), A.nextCode([], 'defecto'), A.nextCode(null, 'epica')], ['HU-011', 'DF-001', 'EP-001']);
  const ni = A.newItem([{ code: 'HU-001', rank: 3000 }], { title: 'Nueva' });
  eq('nuevo elemento', [ni.code, ni.type, ni.rank, ni.status, ni.title, ni.history.length], ['HU-002', 'historia', 4000, 'backlog', 'Nueva', 1]);
  // Cambio de estado con historial y fecha de terminación
  let it = { code: 'HU-001', status: 'por-hacer', history: [] };
  it = A.withStatus(st, it, 'en-curso', '2026-08-04');
  it = A.withStatus(st, it, 'terminado', '2026-08-06');
  eq('terminado registra fecha', [it.status, it.doneDate, it.history.length], ['terminado', '2026-08-06', 2]);
  eq('mover dentro de terminado conserva la fecha', A.withStatus(st, it, 'terminado', '2026-08-09').doneDate, '2026-08-06');
  eq('reabrir borra la fecha', A.withStatus(st, it, 'en-curso', '2026-08-10').doneDate, null);
  eq('historial limitado a 60', A.withStatus(st, { history: Array.from({ length: 70 }, () => ({ date: '2026-01-01', status: 'x' })) }, 'por-hacer', '2026-08-01').history.length, 60);
  eq('rango entre vecinos', [A.rankBetween({ rank: 1000 }, { rank: 2000 }), A.rankBetween(null, { rank: 1000 }), A.rankBetween({ rank: 5000 }, null), A.rankBetween(null, null)], [1500, 0, 6000, 1000]);
  eq('orden por rango', A.sortByRank([{ code: 'B', rank: 2 }, { code: 'A', rank: 2 }, { code: 'C', rank: 1 }]).map((x) => x.code), ['C', 'A', 'B']);

  // Datos de un release con 3 iteraciones de 2 semanas (calendario L-V sin festivos)
  const cal = PM.cal.make({ workweek: 5, holidaysCO: false }, '2026-08-03');
  const settings = A.settings({ settings: { sprintLength: 10 } });
  const release = { id: 'r1', name: 'Release 1', budget: 300, plannedSprints: 3, baseline: { points: 30, end: '2026-09-11', budget: 300 }, end: '2026-09-11', taskId: 't-rel' };
  const sprints = [
    { id: 's2', name: 'Iteración 2', releaseId: 'r1', start: '2026-08-17', end: '2026-08-28', status: 'en-curso', committed: 12 },
    { id: 's1', name: 'Iteración 1', releaseId: 'r1', start: '2026-08-03', end: '2026-08-14', status: 'cerrado', committed: 10, completed: 8 },
    { id: 's3', name: 'Iteración 3', releaseId: 'r1', start: '2026-08-31', end: '2026-09-11', status: 'planeado' },
  ];
  const items = [
    { id: 'e1', type: 'epica', estimate: 99, releaseId: 'r1', status: 'backlog' },
    { id: 'a', type: 'historia', estimate: 5, releaseId: 'r1', sprintId: 's1', status: 'terminado', doneDate: '2026-08-07', createdAt: '2026-07-20' },
    { id: 'b', type: 'historia', estimate: 3, releaseId: 'r1', sprintId: 's1', status: 'terminado', doneDate: '2026-08-13', createdAt: '2026-07-20' },
    { id: 'c', type: 'historia', estimate: 5, releaseId: 'r1', sprintId: 's2', status: 'terminado', doneDate: '2026-08-19', createdAt: '2026-07-20' },
    { id: 'd', type: 'defecto', estimate: 2, releaseId: 'r1', sprintId: 's2', status: 'en-curso', createdAt: '2026-07-20' },
    { id: 'f', type: 'historia', estimate: 5, releaseId: 'r1', sprintId: 's2', status: 'por-hacer', createdAt: '2026-07-20', sprintAddedDate: '2026-08-20' },
    { id: 'g', type: 'historia', estimate: 8, releaseId: 'r1', status: 'backlog', createdAt: '2026-07-20' },
    { id: 'h', type: 'historia', estimate: 6, releaseId: 'r1', status: 'backlog', createdAt: '2026-08-18' },
  ];
  // Iteraciones del release ordenadas por inicio
  eq('iteraciones del release', C.sprintsOfRelease(sprints, 'r1').map((s) => s.id), ['s1', 's2', 's3']);
  // Burndown de la iteración 2 al 2026-08-21
  const bd = C.sprintBurndown({ sprint: sprints[0], items, settings, cal, statusDate: '2026-08-21' });
  eq('burndown: totales', [bd.total, bd.done, bd.remaining, bd.committed, bd.days.length], [12, 5, 7, 12, 11]);
  eq('burndown: día 0 y primer día', [bd.days[0].date, bd.days[0].remaining, bd.days[1].date, bd.days[1].remaining], ['2026-08-14', 7, '2026-08-17', 7]);
  eq('burndown: alcance agregado el 20 y terminado el 19', [bd.days[3].date, bd.days[3].remaining, bd.days[4].scope, bd.days[4].remaining], ['2026-08-19', 2, 12, 7]);
  eq('burndown: futuro sin datos, ideal a cero', [bd.days[6].remaining, bd.days[10].ideal], [null, 0]);
  // Velocidad
  const v = C.velocity({ sprints, items, settings });
  eq('velocidad: filas', v.rows.map((r) => [r.id, r.committed, r.completed]), [['s1', 10, 8], ['s2', 12, 5], ['s3', 0, 0]]);
  eq('velocidad: promedio de cerradas', [v.closed, v.avg3, v.min3, v.max3], [1, 8, 8, 8]);
  // Avance y burnup
  const pr = C.releaseProgress({ release, items, settings });
  eq('avance del release (sin épicas)', [pr.total, pr.done, pr.remaining, Math.round(pr.pct * 1000) / 1000, pr.count, pr.lastDone], [34, 13, 21, 0.382, 7, '2026-08-19']);
  const bu = C.releaseBurnup({ release, sprints, items, settings, statusDate: '2026-08-21' });
  eq('burnup: puntos', bu.points.map((p) => [p.label, p.scope, p.done]), [['Inicio', 28, 0], ['Iteración 1', 28, 8], ['Iteración 2', null, null], ['Iteración 3', null, null]]);
  eq('burnup: línea base', bu.baselinePoints, 30);
  // Pronóstico: 21 restantes / 8 por iteración = 3 iteraciones desde el 17-ago (después del cierre de la 1)
  const fc = C.releaseForecast({ release, sprints, items, settings, cal, statusDate: '2026-08-21' });
  eq('pronóstico', [fc.velocity, fc.sprintsNeeded, fc.finish], [8, 3, '2026-09-25']);
  eq('pronóstico sin velocidad', C.releaseForecast({ release, sprints: [], items, settings, cal }).sprintsNeeded, null);
  eq('pronóstico terminado', C.releaseForecast({ release, sprints, items: items.map((x) => ({ ...x, status: 'terminado', doneDate: '2026-08-20' })), settings, cal }).sprintsNeeded, 0);
  // AgileEVM al 2026-08-21: 1 de 3 iteraciones transcurridas; 13/34 terminado
  const ae = C.agileEvm({ release, sprints, items, settings, actualCost: 120, statusDate: '2026-08-21' });
  const r3 = (x) => Math.round(x * 1000) / 1000;
  eq('AgileEVM', [ae.bac, ae.plannedSprints, ae.sprintsElapsed, r3(ae.ppc), r3(ae.apc), r3(ae.pv), r3(ae.ev), ae.ac, r3(ae.spi), r3(ae.cpi), r3(ae.eac)], [300, 3, 1, 0.333, 0.382, 100, 114.706, 120, 1.147, 0.956, 313.846]);
  eq('AgileEVM sin costo real', [C.agileEvm({ release, sprints, items, settings, actualCost: 0, statusDate: '2026-08-21' }).cpi], [null]);
  // AgileEVM con línea base: iteraciones y BAC de la línea base (agregar iteraciones no mejora el SPI)
  const relB = { ...release, plannedSprints: 5, budget: 400, baseline: { ...release.baseline, sprints: 3, budget: 300 } };
  const aeB = C.agileEvm({ release: relB, sprints, items, settings, actualCost: 120, statusDate: '2026-08-21' });
  eq('AgileEVM con línea base', [aeB.plannedSprints, aeB.bac, r3(aeB.ppc), aeB.fromBaseline], [3, 300, 0.333, true]);
  eq('AgileEVM sin línea base usa lo actual', (({ plannedSprints, bac, fromBaseline }) => [plannedSprints, bac, fromBaseline])(C.agileEvm({ release: { ...relB, baseline: null }, sprints, items, settings, statusDate: '2026-08-21' })), [5, 400, false]);
  eq('AgileEVM: PPC no pasa de 1', C.agileEvm({ release: relB, sprints, items, settings, statusDate: '2027-01-01' }).ppc, 1);
  // Pronóstico de un release que aún no empieza: desde su inicio, no desde el corte
  const relFut = { id: 'r2', start: '2026-10-05' };
  const fut = C.releaseForecast({ release: relFut, sprints: [...sprints, { id: 's9', releaseId: 'r2', start: '2026-10-05', end: '2026-10-16', status: 'planeado' }], items: [...items, { id: 'z1', type: 'historia', estimate: 8, releaseId: 'r2', status: 'backlog' }], settings, cal, statusDate: '2026-08-21' });
  eq('pronóstico de release futuro desde su inicio', [fut.sprintsNeeded, fut.finish], [1, '2026-10-16']);
  // Variación con iteraciones: más iteraciones que la línea base o después del fin
  const rvS = C.releaseVariance({ release: { ...release, baseline: { ...release.baseline, sprints: 3 } }, items, settings, sprints: [...sprints, { id: 's4', releaseId: 'r1', start: '2026-09-14', end: '2026-09-25' }] });
  eq('variación por iteraciones', [rvS.sprintChange, rvS.sprintsAfterEnd, rvS.needsChangeControl], [1, ['s4'], true]);
  // Variación frente a la línea base: 34 vs 30 = +13,3 % > 10 % → control de cambios
  const rv = C.releaseVariance({ release, items, settings });
  eq('variación del release', [rv.hasBaseline, r3(rv.scopePct), rv.dateChange, rv.budgetChange, rv.needsChangeControl], [true, 0.133, 0, 0, true]);
  eq('variación dentro del umbral', C.releaseVariance({ release: { ...release, baseline: { points: 33, end: '2026-09-11', budget: 300 } }, items, settings }).needsChangeControl, false);
  eq('variación sin línea base', C.releaseVariance({ release: { id: 'r1' }, items, settings }).hasBaseline, false);
  eq('línea base vacía o nula no cuenta', [C.releaseVariance({ release: { id: 'r1', budget: 5, baseline: {} }, items, settings }).needsChangeControl, A.hasBaseline({ baseline: null }), A.hasBaseline({ baseline: { points: 0 } }), A.hasBaseline(release)], [undefined, false, true, true]);
  eq('normalizar: línea base nula se conserva', PM.normalizeTool('agile', { releases: [{ id: 'r', baseline: null }] }).releases[0].baseline, null);
  eq('release activo', [A.activeRelease([{ id: 'a', status: 'cerrado' }, { id: 'b', status: 'planeado' }], []).id, A.activeRelease([{ id: 'a', status: 'en-curso' }, { id: 'b' }], [{ status: 'en-curso', releaseId: 'b' }]).id, A.activeRelease([], [])], ['b', 'b', null]);
  eq('orden de iteraciones', A.sortSprints([{ id: 'x', start: '2026-02-01' }, null, { id: 'y', start: '2026-01-01' }]).map((s) => s.id), ['y', 'x']);
  // Costos reales de varios releases sin duplicar y WIP
  const rc = A.releaseCosts([{ id: 'r1', taskId: 'tA' }, { id: 'r2', taskId: 'tA' }, { id: 'r3' }], { actuals: [{ amount: 10, taskId: 'tA', date: '2026-08-01' }, { amount: 5, releaseId: 'r3', date: '2026-08-02' }, { amount: 7, releaseId: 'r1', date: '2026-08-03' }, { amount: 99, releaseId: 'r1', date: '2026-12-01' }, null] }, null, '2026-09-01');
  eq('costos de releases sin duplicar', [rc.total, rc.byRelease.get('r1'), rc.byRelease.get('r2'), rc.byRelease.get('r3'), rc.shared.length], [22, { ac: 7, shared: 0 }, { ac: 10, shared: 0 }, { ac: 5, shared: 0 }, 0]);
  const rc2 = A.releaseCosts([{ id: 'r1', taskId: 'tA' }, { id: 'r2', taskId: 'tA' }], { actuals: [{ amount: 10, taskId: 'tA' }] }, null, null);
  eq('costo compartido entre releases sin marcas', [rc2.total, rc2.byRelease.get('r1'), rc2.shared.length], [10, { ac: 10, shared: 10 }, 1]);
  eq('costo del release: con registros explícitos solo cuentan esos', A.releaseActualCost({ id: 'r1', taskId: 'tA' }, { actuals: [{ amount: 10, taskId: 'tA' }, { amount: 7, releaseId: 'r1' }] }, null, null), 7);
  eq('costo del release: implícitos por actividad desde el inicio del release', A.releaseActualCost({ id: 'r1', taskId: 'tA', start: '2026-08-01' }, { actuals: [{ amount: 10, taskId: 'tA', date: '2026-07-31' }, { amount: 4, taskId: 'tA', date: '2026-08-01' }, { amount: 3, taskId: 'tB', date: '2026-08-02' }] }, null, null), 4);
  eq('costo del release por EDT y descendientes', A.releaseActualCost({ id: 'r9', wbsId: 'n1' }, { actuals: [{ amount: 2, wbsId: 'n2' }, { amount: 5, wbsId: 'n1' }, { amount: 1, wbsId: 'zz' }] }, { descendants: () => ['n2'] }, null), 7);
  eq('límite WIP', [A.wipLimit({ wip: 3 }), A.wipLimit({ wip: '2.6' }), A.wipLimit({ wip: -1 }), A.wipLimit({ wip: null }), A.wipLimit(null)], [3, 3, null, null, null]);
  const ws = A.wipStatus(settings, [{ status: 'en-curso' }, { status: 'en-curso' }, { status: 'en-curso' }, { status: 'en-curso', type: 'epica' }, { status: 'en-revision' }, null]);
  eq('estado WIP', ws.filter((c) => c.wip).map((c) => [c.id, c.count, c.over, c.full]), [['en-curso', 3, false, true], ['en-revision', 1, false, false]]);
  // Tiempos de flujo y vínculo inverso
  eq('tiempos de flujo', A.flowTimes({ status: 'terminado', doneDate: '2026-08-07', createdAt: '2026-08-01', history: [{ date: '2026-08-01', status: 'backlog' }, { date: '2026-08-03', status: 'por-hacer' }, { date: '2026-08-04', status: 'en-curso' }, { date: '2026-08-07', status: 'terminado' }] }, settings), { start: '2026-08-04', doneDate: '2026-08-07', cycle: 4, lead: 7 });
  eq('tiempos de flujo: sin historial y sin terminar', [A.flowTimes({ status: 'terminado', doneDate: '2026-08-07' }, settings).cycle, A.flowTimes({ status: 'en-curso' }, settings)], [1, null]);
  eq('vínculo inverso release → actividad', [...A.releaseTasks([{ id: 'a' }, { id: 'b', releaseId: 'r2' }], { releases: [{ id: 'r1', taskId: 'a' }, { id: 'r2' }] })], [['r1', 'a'], ['r2', 'b']]);
  // Flujo acumulado
  const hist = [
    { id: 'x1', type: 'historia', createdAt: '2026-08-01', status: 'terminado', history: [{ date: '2026-08-01', status: 'backlog' }, { date: '2026-08-03', status: 'por-hacer' }, { date: '2026-08-04', status: 'en-curso' }, { date: '2026-08-05', status: 'terminado' }] },
    { id: 'x2', type: 'historia', createdAt: '2026-08-04', status: 'en-curso', history: [{ date: '2026-08-04', status: 'backlog' }, { date: '2026-08-05', status: 'en-curso' }] },
  ];
  const cfd = C.cfd({ items: hist, settings, from: '2026-08-02', to: '2026-08-05' });
  eq('flujo acumulado', cfd.map((r) => [r.date, r.nuevo, r.pendiente, r['en-curso'], r.terminado]), [['2026-08-02', 1, 0, 0, 0], ['2026-08-03', 0, 1, 0, 0], ['2026-08-04', 1, 0, 1, 0], ['2026-08-05', 0, 0, 1, 1]]);
  eq('flujo acumulado: muestreo semanal en rangos largos', C.cfd({ items: hist, settings, from: '2026-01-01', to: '2026-12-31' }).length, 53);
  // Enfoque por entregable de la EDT (heredado)
  const tree = C.wbsTree([{ id: 'n1', name: 'Proyecto', parentId: null }, { id: 'n2', name: 'Obra', parentId: 'n1', approach: 'predictivo' }, { id: 'n3', name: 'Software', parentId: 'n1', approach: 'adaptativo' }, { id: 'n4', name: 'Módulo', parentId: 'n3' }]);
  const ap = C.wbsApproach(tree, { lifecycle: 'Híbrido' });
  eq('enfoque por entregable', ['n1', 'n2', 'n3', 'n4'].map((k) => ap.get(k)), ['predictivo', 'predictivo', 'adaptativo', 'adaptativo']);
  eq('enfoque por defecto en proyecto ágil', C.wbsApproach(C.wbsTree([{ id: 'a', name: 'A' }]), { lifecycle: 'Adaptativo (ágil)' }).get('a'), 'adaptativo');
  // Avance del release aplicado al cronograma (sin modificar lo guardado)
  const schedule = PM.deepFreeze({ settings: { workweek: 5, holidaysCO: false }, tasks: [{ id: 't-rel', name: 'Release 1', duration: 30, deps: [], progress: 0 }, { id: 't2', name: 'Otra', duration: 5, deps: [], progress: 40 }] });
  const agileData = { settings: {}, releases: [release], sprints };
  const applied = A.applyToSchedule(schedule, agileData, items);
  const t1 = applied.tasks[0];
  eq('cronograma: avance derivado', [t1.progress, t1.actualStart, t1.agileDerived, t1.releaseId, applied.tasks[1] === schedule.tasks[1]], [38.2, '2026-08-03', true, 'r1', true]);
  eq('cronograma: original intacto', schedule.tasks[0].progress, 0);
  const allDone = A.applyToSchedule(schedule, agileData, items.map((x) => ({ ...x, status: 'terminado', doneDate: x.doneDate || '2026-09-10' })));
  eq('cronograma: release terminado fija fin real', [allDone.tasks[0].progress, allDone.tasks[0].actualFinish], [100, '2026-09-10']);
  const dup = A.applyToSchedule({ tasks: [{ id: 'x1', duration: 5, releaseId: 'r1', progress: 0 }, { id: 'x2', duration: 5, releaseId: 'r1', progress: 0 }, { id: 't-rel', duration: 5, progress: 0 }] }, agileData, items);
  eq('cronograma: un release se aplica a una sola actividad', dup.tasks.map((t) => !!t.agileDerived), [false, false, true]);
  const dup2 = A.applyToSchedule({ tasks: [{ id: 'x1', duration: 5, releaseId: 'r1' }, { id: 'x2', duration: 5, releaseId: 'r1' }] }, { releases: [{ ...release, taskId: null }], sprints }, items);
  eq('cronograma: sin taskId gana la primera actividad', dup2.tasks.map((t) => !!t.agileDerived), [true, false]);
  eq('vínculos: dos releases en la misma actividad, gana el último', A.linksOf([{ id: 'a' }], { releases: [{ id: 'r1', taskId: 'a' }, { id: 'r2', taskId: 'a' }] }).get('a').id, 'r2');
  // Fin pronosticado por velocidad: computeSchedule lo usa como duración restante al actualizar a la fecha de corte
  const withFc = A.applyToSchedule(schedule, agileData, items, { statusDate: '2026-08-21' });
  eq('cronograma: fin pronosticado por velocidad', withFc.tasks[0].forecastFinish, '2026-09-25');
  const fcSched = C.computeSchedule(withFc, '2026-08-03', '2026-08-21');
  eq('CPM al corte usa el fin pronosticado del release', fcSched.byId.get('t-rel').finishDate, '2026-09-25');
  eq('sin fecha de corte no hay pronóstico', A.applyToSchedule(schedule, agileData, items).tasks[0].forecastFinish, undefined);
  eq('cronograma sin releases: misma referencia', A.applyToSchedule(schedule, { releases: [] }, items) === schedule, true);
  // Datos mal formados no lanzan excepciones
  let bad = null;
  try {
    C.velocity({ sprints: 'x', items: null, settings: null });
    C.releaseProgress({ release: {}, items: [null, 3, 'x'] });
    C.cfd({ items: [{ history: 'x' }], from: 'x', to: 'y' });
    A.applyToSchedule({ tasks: [null] }, { releases: [{ id: 'r', taskId: 'z' }], sprints: null }, null);
    A.settings({ settings: { columns: 'x', sprintLength: 'abc' } });
    PM.normalizeTool('agile', { settings: { columns: { a: 1 } }, releases: { x: 1 }, sprints: [null, { id: 's' }] });
  } catch (e) { bad = String(e && e.message); }
  eq('mal formado: sin excepciones', bad, null);
  const na = PM.normalizeTool('agile', { settings: { columns: { a: 1 } }, releases: { x: 1 }, sprints: [null, { id: 's' }] });
  eq('normalizar herramienta ágil', [na.settings.columns, na.releases, na.sprints.length], [[], [], 1]);
  // Menú: grupo ágil e iconos
  eq('grupo ágil después de planificación', PM.GROUPS.map((g) => g.id).slice(2, 4), ['planificacion', 'agil']);
  eq('iconos ágiles', ['backlog', 'kanban', 'sprint', 'burndown', 'release'].every((k) => !!PM.ICONS[k]), true);
  return out;
});

// Integración: vista condicionada al ciclo de vida y avance del release en el modelo del proyecto
const ui = [];
const ok = (name, cond, info) => ui.push({ name, ok: !!cond, got: info });
await page.evaluate(() => {
  const { html } = PM.lib;
  function Probe() {
    const m = PM.useAgileModel();
    const t = m.sched.byId && m.sched.byId.get('t-rel');
    return html`<div id="probe" data-progress=${t ? t.progress : ''} data-items=${m.items.length} data-mode=${m.mode} data-loading=${m.loading ? '1' : '0'}>probe</div>`;
  }
  PM.registerView({ id: 'prueba-agil', label: 'Prueba ágil', group: 'agil', icon: 'sprint', order: 999, when: PM.agile.when, unavailable: PM.AgileUnavailable, component: Probe });
});
const pid = await createProject(page, { lifecycle: 'Predictivo' });
await page.waitForTimeout(400);
ok('predictivo: grupo ágil oculto en el menú', !(await page.$('.nav-item[aria-label="Prueba ágil"], .nav-item:has-text("Prueba ágil")')));
await gotoView(page, 'prueba-agil');
ok('predictivo: mensaje de herramientas no activas', /Herramientas ágiles no activas/.test(await page.innerText('.view-host')));
await page.click('button:has-text("Usar ciclo de vida híbrido")');
await page.waitForTimeout(600);
ok('híbrido: ciclo de vida actualizado', (await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)), pid)).lifecycle === 'Híbrido');
ok('híbrido: grupo ágil visible', !!(await page.$('.nav-item:has-text("Prueba ágil")')));
ok('híbrido: etiqueta del grupo', /Ágil \(Scrum y Kanban\)/i.test(await page.innerText('.rail')));
await page.evaluate(async (pid) => {
  await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: false }, tasks: [{ id: 't-rel', name: 'Release 1', duration: 20, deps: [], progress: 0 }] });
  await PM.store.set(PM.paths.tool(pid, 'agile'), { settings: {}, releases: [{ id: 'r1', name: 'R1', taskId: 't-rel' }], sprints: [{ id: 's1', releaseId: 'r1', start: '2026-08-03', end: '2026-08-14', status: 'en-curso' }] });
  await PM.store.set(PM.paths.backlogItem(pid, 'i1'), { code: 'HU-001', type: 'historia', estimate: 3, releaseId: 'r1', status: 'terminado', doneDate: '2026-08-05' });
  await PM.store.set(PM.paths.backlogItem(pid, 'i2'), { code: 'HU-002', type: 'historia', estimate: 1, releaseId: 'r1', status: 'por-hacer' });
}, pid);
await page.waitForTimeout(900);
const probe = await page.evaluate(() => { const e = document.getElementById('probe'); return e ? { ...e.dataset } : null; });
ok('modelo: avance del release en el cronograma calculado', probe && probe.progress === '75' && probe.items === '2' && probe.mode === 'hibrido', probe);
const exported = await page.evaluate((pid) => PM.projectOps.exportData(pid), pid);
ok('exportación incluye el backlog', exported.collections.backlog && exported.collections.backlog.length === 2, exported.collections.backlog && exported.collections.backlog.length);

let fails = 0;
for (const r of [...results, ...ui]) { if (!r.ok) fails++; console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : `\n      obtenido: ${JSON.stringify(r.got)}` + ('exp' in r ? `\n      esperado: ${JSON.stringify(r.exp)}` : ''))); }
if (errors.length) { console.log(errors); fails++; }
await browser.close();
console.log(`\n${results.length + ui.length - fails}/${results.length + ui.length} correctas`);
process.exit(fails ? 1 : 0);

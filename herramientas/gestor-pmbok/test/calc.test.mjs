// Pruebas de cálculos compartidos (calendario, CPM, EDT, EVM, revisiones). Uso: node test/calc.test.mjs
import { openApp } from './harness.mjs';
const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const { browser, page, errors } = await openApp({ file: fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html' });
const results = await page.evaluate(() => {
  const out = []; const eq = (name, got, exp) => out.push({ name, ok: JSON.stringify(got) === JSON.stringify(exp), got, exp });
  const D = PM.date;
  // Festivos 2026 Colombia
  const h26 = D.holidaysCO(2026).map((x) => x.date);
  eq('festivos 2026 cantidad', h26.length, 18);
  eq('festivos 2026', h26, ['2026-01-01','2026-01-12','2026-03-23','2026-04-02','2026-04-03','2026-05-01','2026-05-18','2026-06-08','2026-06-15','2026-06-29','2026-07-20','2026-08-07','2026-08-17','2026-10-12','2026-11-02','2026-11-16','2026-12-08','2026-12-25']);
  eq('pascua 2027', D.easter(2027), '2027-03-28');
  // Calendario L-V con festivos, ancla lunes 3 ago 2026
  const cal = PM.cal.make({ workweek: 5, holidaysCO: true }, '2026-08-03');
  eq('dateOf 0', cal.dateOf(0), '2026-08-03');
  eq('dateOf 4 (vie 7 ago festivo)', cal.dateOf(4), '2026-08-10');
  eq('indexOf sáb', cal.indexOf('2026-08-08'), 4);
  eq('indexOf antes ancla', cal.indexOf('2026-07-31'), -1);
  eq('dateOf -1', cal.dateOf(-1), '2026-07-31');
  eq('countWork semana con festivo', cal.countWork('2026-08-03', '2026-08-09'), 4);
  // CPM
  const sched = { settings: { workweek: 5, holidaysCO: false }, tasks: [
    { id: 'a', name: 'A', duration: 5, deps: [], cost: 100 },
    { id: 'b', name: 'B', duration: 3, deps: [{ id: 'a', type: 'FS', lag: 0 }], cost: 60 },
    { id: 'c', name: 'C', duration: 2, deps: [{ id: 'a', type: 'FS', lag: 0 }], cost: 40 },
    { id: 'm', name: 'Hito', duration: 0, milestone: true, deps: [{ id: 'b', type: 'FS' }, { id: 'c', type: 'FS' }] },
    { id: 'd', name: 'D', duration: 2, deps: [{ id: 'a', type: 'SS', lag: 2 }] },
  ] };
  const r = PM.calc.computeSchedule(sched, '2026-08-03');
  const t = (id) => r.byId.get(id);
  eq('A fechas', [t('a').startDate, t('a').finishDate], ['2026-08-03', '2026-08-07']);
  eq('B fechas', [t('b').startDate, t('b').finishDate], ['2026-08-10', '2026-08-12']);
  eq('C holgura', t('c').tf, 1);
  eq('crítica', [...r.criticalIds].sort(), ['a', 'b', 'm']);
  eq('hito fecha = fin de B', t('m').startDate, '2026-08-12');
  eq('D SS+2', t('d').startDate, '2026-08-05');
  eq('fin proyecto', r.finish, '2026-08-12');
  // ciclo
  const cyc = PM.calc.computeSchedule({ tasks: [{ id: 'x', duration: 1, deps: [{ id: 'y' }] }, { id: 'y', duration: 1, deps: [{ id: 'x' }] }] }, '2026-08-03');
  eq('ciclo detectado', cyc.errors.length, 1);
  // EDT
  const tree = PM.calc.wbsTree([{ id: 'n1', parentId: null, name: 'Gestión', order: 1 }, { id: 'n2', parentId: null, name: 'Montaje', order: 2 }, { id: 'n3', parentId: 'n2', name: 'Nivel 1', order: 1 }]);
  eq('códigos EDT', [tree.codes.get('n1'), tree.codes.get('n2'), tree.codes.get('n3')], ['1.1', '1.2', '1.2.1']);
  eq('hojas', [...tree.leaves].sort(), ['n1', 'n3']);
  // EVM sin línea base: estado al cierre del día 7 ago (A completa)
  const s2 = PM.calc.computeSchedule({ settings: { workweek: 5, holidaysCO: false }, tasks: [{ id: 'a', duration: 5, cost: 100, progress: 100 }, { id: 'b', duration: 5, cost: 100, progress: 20, deps: [{ id: 'a' }] }] }, '2026-08-03');
  const e = PM.calc.evm({ sched: s2, costBaseline: null, costs: { actuals: [{ date: '2026-08-05', amount: 90 }, { date: '2026-08-10', amount: 40 }] }, statusDate: '2026-08-11' });
  eq('BAC', e.bac, 200);
  eq('PV al 11 ago', Math.round(e.pv), 140);
  eq('EV', e.ev, 120);
  eq('AC', e.ac, 130);
  eq('SPI', +e.spi.toFixed(3), 0.857);
  eq('CPI', +e.cpi.toFixed(3), 0.923);
  // Revisiones
  eq('revs', [PM.calc.nextDraftRev(null), PM.calc.nextDraftRev('A'), PM.calc.approvedRev('B'), PM.calc.nextDraftRev('0'), PM.calc.nextDraftRev('1A'), PM.calc.approvedRev('1B'), PM.calc.approvedRev('1')], ['A', 'B', '0', '1A', '1B', '1', '2']);
  // EDT con ciclo (datos importados corruptos): códigos únicos y consolidado sin desbordar la pila
  const cyc2 = PM.calc.wbsTree([{ id: 'a', parentId: 'b', name: 'A' }, { id: 'b', parentId: 'a', name: 'B' }, { id: 'c', parentId: null, name: 'C', order: 1 }]);
  const cc = [cyc2.codes.get('a'), cyc2.codes.get('b'), cyc2.codes.get('c')];
  eq('EDT ciclo: códigos únicos', new Set(cc).size, 3);
  eq('EDT ciclo: consolidado', PM.calc.rollupWbs(cyc2, { tasks: [] }).size, 3);
  // PV acumulado equivale a la fracción planificada
  const s3 = PM.calc.computeSchedule({ settings: { workweek: 6, holidaysCO: true }, tasks: [{ id: 'a', duration: 7, cost: 700 }, { id: 'b', duration: 4, cost: 400, deps: [{ id: 'a', type: 'SS', lag: 2 }] }, { id: 'm', duration: 0, milestone: true, cost: 50, deps: [{ id: 'b' }] }] }, '2026-08-03');
  const e3 = PM.calc.evm({ sched: s3, costBaseline: null, costs: {}, statusDate: '2026-08-06' });
  const ref = (d) => s3.tasks.reduce((acc, t) => acc + t.cost * PM.calc.plannedFraction(s3.cal, t.startDate, t.finishDate, t.milestone, d), 0);
  eq('PV acumulado = fracción planificada', ['2026-08-03', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-12', '2026-08-20'].map((d) => Math.round(e3.pvAt(d) * 1000)), ['2026-08-03', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-12', '2026-08-20'].map((d) => Math.round(ref(d) * 1000)));
  // Cronograma ganado con el trabajo concluido a tiempo: SPI(t) = 1
  const s4 = PM.calc.computeSchedule({ settings: { workweek: 5, holidaysCO: false }, tasks: [{ id: 'a', duration: 5, cost: 100, progress: 100 }] }, '2026-08-03');
  const e4 = PM.calc.evm({ sched: s4, costBaseline: null, costs: {}, statusDate: '2026-09-30' });
  eq('SPI(t) concluido', +e4.spiT.toFixed(2), 1);
  eq('riesgo', [PM.calc.riskLevel(4).label, PM.calc.riskLevel(9).label, PM.calc.riskLevel(12).label, PM.calc.riskLevel(25).label], ['Bajo', 'Medio', 'Alto', 'Muy alto']);
  // Actualización a la fecha de corte (6.6): sin statusDate no cambia nada; con statusDate el trabajo pendiente no queda en el pasado
  const base5 = { settings: { workweek: 5, holidaysCO: false }, tasks: [
    { id: 'a', duration: 10, progress: 50 },                                   // iniciada, atrasada
    { id: 'b', duration: 3, progress: 0, deps: [{ id: 'a' }] },                 // sucesora
    { id: 'c', duration: 2, progress: 0 },                                      // no iniciada, debió empezar el 3 ago
    { id: 'm', duration: 0, milestone: true, deps: [{ id: 'c' }] },             // hito no alcanzado
    { id: 'z', duration: 5, progress: 100 },                                    // terminada
  ] };
  const p0 = PM.calc.computeSchedule(base5, '2026-08-03');
  const p1 = PM.calc.computeSchedule(base5, '2026-08-03', '2026-08-21');
  eq('corte: sin fecha de corte no se reprograma', [p0.byId.get('a').finishDate, p0.byId.get('c').startDate, p0.finish, p0.rescheduledIds.size], ['2026-08-14', '2026-08-03', '2026-08-19', 0]);
  eq('corte: restante de la iniciada desde el día siguiente al corte', [p1.byId.get('a').startDate, p1.byId.get('a').finishDate, p1.byId.get('a').remaining, p1.byId.get('a').duration], ['2026-08-03', '2026-08-28', 5, 10]);
  eq('corte: la sucesora se mueve con ella', p1.byId.get('b').startDate, '2026-08-31');
  eq('corte: no iniciada empieza después del corte', [p1.byId.get('c').startDate, p1.byId.get('c').finishDate], ['2026-08-24', '2026-08-25']);
  eq('corte: hito no alcanzado después del corte', p1.byId.get('m').startDate, '2026-08-25');
  eq('corte: terminada sin cambios', [p1.byId.get('z').startDate, p1.byId.get('z').finishDate, p1.byId.get('z').rescheduled], ['2026-08-03', '2026-08-07', false]);
  eq('corte: fin y ruta crítica pronosticados', [p1.finish, [...p1.criticalIds].sort()], ['2026-09-02', ['a', 'b']]);
  eq('corte: anterior al inicio no cambia nada', PM.calc.computeSchedule(base5, '2026-08-03', '2026-07-01').finish, p0.finish);
  // Datos mal formados (importados o editados a mano): no deben lanzar excepciones
  let bad = null;
  try {
    const s5 = PM.calc.computeSchedule({ settings: { workweek: 6, extraHolidays: '2026-08-05' }, tasks: [{ id: 'a', duration: 2 }, { id: 'b', duration: 1, deps: { id: 'a', type: 'FS', lag: 0 } }, null, 'x'] }, '2026-08-03');
    eq('mal formado: dependencia como objeto', s5.byId.get('b').startDate, '2026-08-06');
    eq('mal formado: festivo extra como texto', s5.cal.isWork('2026-08-05'), false);
    PM.calc.computeSchedule({ settings: 'x', tasks: { a: 1 } }, '2026-08-03');
    PM.calc.wbsTree({ n1: { id: 'n1' } }); PM.calc.wbsTree([null, 'x', { id: 'ok', name: 'Ok' }]);
    PM.calc.evm({ sched: PM.calc.computeSchedule(base5, '2026-08-03'), costBaseline: { cost: { tasks: [null, { id: 'a', cost: 5 }] } }, costs: { actuals: { a: 1 }, statusUpdates: 'x' }, statusDate: '2026-08-10' });
    PM.calc.activeBaselines([null, { id: 'x', data: { number: 0, includes: 'schedule' } }]);
  } catch (e) { bad = String(e && e.message); }
  eq('mal formado: sin excepciones', bad, null);
  // Normalización de herramientas: lo válido conserva la identidad; lo mal formado se corrige
  const okSched = PM.deepFreeze({ settings: { workweek: 5, extraHolidays: [] }, tasks: [{ id: 'a', deps: [], resources: [] }] });
  eq('normalizar: datos válidos sin copia', PM.normalizeTool('schedule', okSched) === okSched, true);
  const nb = PM.normalizeTool('schedule', { settings: { extraHolidays: '2026-08-07', resourceLimits: 3 }, tasks: [{ id: 'a', deps: { id: 'b' }, resources: 'Cuadrilla' }, null, 7] });
  eq('normalizar: cronograma corregido', [nb.settings.extraHolidays, nb.settings.resourceLimits, nb.tasks.length, nb.tasks[0].deps, nb.tasks[0].resources], [['2026-08-07'], {}, 1, [{ id: 'b' }], [{ name: 'Cuadrilla', units: 1 }]]);
  eq('normalizar: EDT y costos', [PM.normalizeTool('wbs', { nodes: { a: 1 } }).nodes, PM.normalizeTool('costs', { actuals: { a: 1 }, statusUpdates: [{ progress: 'x' }] })], [[], { actuals: [], statusUpdates: [{ progress: {} }], reserves: {} }]);
  // Formatos: signo menos tipográfico y millones con un decimal
  eq('formato: signo menos', [PM.fmt.num(-1.5, 1), PM.fmt.fixed(-3, 0), PM.fmt.num(-0.0001, 0), PM.fmt.money(-5), PM.fmt.moneyShort(-13400000)], ['−1,5', '−3', '0', '−$ 5', '−$ 13,4 M']);
  eq('formato: millones con un decimal', [PM.fmt.moneyShort(486500000), PM.fmt.moneyShort(452000000), PM.fmt.moneyShort(1234567890)], ['$ 486,5 M', '$ 452 M', '$ 1.235 M']);
  // Estructuras compartidas: lo que no cambió conserva su identidad
  const prev = PM.deepFreeze({ fields: { rows: [{ id: 'r1', a: 1 }, { id: 'r2', a: 2 }] }, t: 'x' });
  const nx = PM.reconcile(prev, JSON.parse(JSON.stringify({ fields: { rows: [{ id: 'r2', a: 2 }, { id: 'r1', a: 9 }] }, t: 'x' })));
  eq('reconciliar: fila sin cambios reutilizada (por id)', [nx.fields.rows[0] === prev.fields.rows[1], nx.fields.rows[1] === prev.fields.rows[0], nx.fields.rows[1].a], [true, false, 9]);
  eq('reconciliar: igual devuelve el anterior', PM.reconcile(prev, JSON.parse(JSON.stringify(prev))) === prev, true);
  return out;
});
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : `\n      obtenido: ${JSON.stringify(r.got)}\n      esperado: ${JSON.stringify(r.exp)}`)); }
if (errors.length) console.log(errors);
await browser.close();
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

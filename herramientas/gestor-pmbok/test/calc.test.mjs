// Pruebas de cálculos compartidos (calendario, CPM, EDT, EVM, revisiones). Uso: node test/calc.test.mjs
import { openApp } from './harness.mjs';
const { browser, page, errors } = await openApp();
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
  eq('riesgo', [PM.calc.riskLevel(4).label, PM.calc.riskLevel(9).label, PM.calc.riskLevel(12).label, PM.calc.riskLevel(25).label], ['Bajo', 'Medio', 'Alto', 'Muy alto']);
  return out;
});
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : `\n      obtenido: ${JSON.stringify(r.got)}\n      esperado: ${JSON.stringify(r.exp)}`)); }
if (errors.length) console.log(errors);
await browser.close();
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

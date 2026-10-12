// Pruebas del núcleo de recursos (09-resources-core): catálogo, costos de actividades, capacidad del equipo,
// estructuras de desglose (costos, riesgos, recursos) y registro de solicitudes de cambio.
// Uso: node test/resources-core.test.mjs [--file gestor-pmbok.html]
import { openApp, createProject } from './harness.mjs';
const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const { browser, page, errors } = await openApp({ file: fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html' });
const results = await page.evaluate(() => {
  const out = []; const eq = (name, got, exp) => out.push({ name, ok: JSON.stringify(got) === JSON.stringify(exp), got, exp });
  const R = PM.res, C = PM.calc;
  // Tipos: preset por defecto, preset elegido y tipos propios
  eq('tipos por defecto (general)', R.types(null).map((t) => t.id).slice(0, 4), ['humano', 'maquinaria', 'herramienta', 'material']);
  eq('preset de construcción', R.types({ preset: 'construccion' }).find((t) => t.id === 'material').kind, 'consumible');
  eq('tipos propios sin repetidos', R.types({ types: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }, { id: 'b', name: 'B', kind: 'consumible' }, null] }).map((t) => [t.id, t.kind]), [['a', 'trabajo'], ['b', 'consumible']]);
  eq('códigos consecutivos', [R.nextCode([{ code: 'REC-004' }, { code: 'X' }]), R.nextCode([])], ['REC-005', 'REC-001']);
  // Catálogo: guardados + virtuales (nombres de asignaciones) con disponibilidad de resourceLimits
  const data = { preset: 'construccion', items: [
    { id: 'r1', code: 'REC-001', name: 'Cuadrilla de montaje', typeId: 'mano-obra', unit: 'cuadrilla', availability: 2, unitCost: 1000 },
    { id: 'r2', code: 'REC-002', name: 'Concreto', typeId: 'material', unit: 'm³', unitCost: 500 },
    { id: 'r3', code: 'REC-003', name: 'Grúa', typeId: 'maquinaria', unit: 'equipo', unitCost: 300, planned: false, reason: 'riesgo' },
    { id: 'r1', name: 'Duplicado' }, { id: 'rx', name: '  ' },
  ] };
  const schedule = { settings: { workweek: 5, holidaysCO: false, resourceLimits: { 'Operario de bodega': 4, 'grúa': 1 } }, tasks: [
    { id: 'a', name: 'A', duration: 5, deps: [], cost: 9999, costMode: 'recursos', resources: [{ resourceId: 'r1', name: 'Cuadrilla de montaje', units: 2 }, { name: 'concreto', units: 3, qty: 12 }] },
    { id: 'b', name: 'B', duration: 4, deps: [{ id: 'a', type: 'FS' }], cost: 700, costMode: 'mixto', costFixed: 100, resources: [{ name: 'Grúa', units: 1 }, { name: 'Operario de bodega', units: 2 }] },
    { id: 'c', name: 'C', duration: 3, deps: [], cost: 450, resources: [{ name: 'Cuadrilla de montaje', units: 1 }] },
    { id: 'd', name: 'D', duration: 2, deps: [], cost: 1, costMode: 'unitario', quantity: 40, unitPrice: 25, qtyUnit: 'm²' },
    { id: 'm', name: 'Hito', duration: 0, milestone: true, deps: [], resources: [{ name: 'Cuadrilla de montaje', units: 3 }] },
  ] };
  const cat = R.catalog(data, schedule);
  eq('catálogo: guardados y virtuales', cat.items.map((i) => [i.id, i.name, !!i.virtual]), [['r1', 'Cuadrilla de montaje', false], ['r2', 'Concreto', false], ['r3', 'Grúa', false], ['v:operario de bodega', 'Operario de bodega', true]]);
  eq('catálogo: disponibilidad desde resourceLimits', [cat.byId.get('v:operario de bodega').availability, cat.byId.get('r3').availability, cat.byId.get('r1').availability], [4, 1, 2]);
  eq('resolver por id y por nombre', [cat.resolve({ resourceId: 'r2' }).name, cat.resolve({ name: ' CONCRETO ' }).id, cat.resolve({ name: 'nada' })], ['Concreto', 'r2', null]);
  eq('clase de recurso', [cat.kindOf(cat.byId.get('r2')), cat.kindOf(cat.byId.get('r1')), cat.kindOf(cat.byId.get('v:operario de bodega'))], ['consumible', 'trabajo', 'trabajo']);
  // Costos por forma de costeo
  const tc = (id) => R.taskCost(schedule.tasks.find((t) => t.id === id), cat);
  const a = tc('a');
  eq('recursos: trabajo (2 × 5 días × 1.000) + consumible (12 m³ × 500)', [a.mode, a.total, a.lines.map((l) => [l.kind, l.qty, l.cost])], ['recursos', 16000, [['trabajo', 10, 10000], ['consumible', 12, 6000]]]);
  const b = tc('b');
  eq('mixto: fijo + recursos (un recurso sin costo)', [b.total, b.fixed, b.resourcesTotal, b.unpriced], [100 + 1200, 100, 1200, 1]);
  eq('precio global no cambia con recursos', tc('c').total, 450);
  eq('precios unitarios', [tc('d').total, tc('d').unitario.unit], [1000, 'm²']);
  eq('hito: sin costo de recursos', R.taskCost({ costMode: 'recursos', milestone: true, duration: 0, resources: [{ name: 'Cuadrilla de montaje', units: 3 }] }, cat).total, 0);
  eq('consumible sin cantidad: unidades × días', R.assignment(cat, { duration: 4 }, { name: 'Concreto', units: 2 }).qty, 8);
  // Aplicar al cronograma: solo cambian las actividades calculadas; lo guardado no se toca
  const frozen = PM.deepFreeze(JSON.parse(JSON.stringify(schedule)));
  const applied = R.applyCosts(frozen, data);
  eq('aplicar costos', applied.tasks.map((t) => [t.id, t.cost, !!t.costComputed]), [['a', 16000, true], ['b', 1300, true], ['c', 450, false], ['d', 1000, true], ['m', undefined, false]]);
  eq('aplicar costos: global conserva la referencia', [applied.tasks[2] === frozen.tasks[2], frozen.tasks[0].cost, applied.tasks[0].costManual], [true, 9999, 9999]);
  eq('sin actividades calculadas: misma referencia', R.applyCosts({ tasks: [{ id: 'x', cost: 5 }] }, data).tasks[0].cost, 5);
  // Reparto por categoría de costo
  eq('reparto por categorías (tipos de recurso)', R.costSplit(schedule.tasks[0], cat).map((s) => [s.category, s.value]), [['Mano de obra', 10000], ['Materiales', 6000]]);
  eq('reparto proporcional a otro total', R.costSplit(schedule.tasks[0], cat, 8000).map((s) => Math.round(s.value)), [5000, 3000]);
  eq('reparto de una actividad global', R.costSplit({ cost: 450, costCategory: 'Subcontratos' }, cat).map((s) => [s.category, s.value]), [['Subcontratos', 450]]);
  // Disponibilidad diaria
  const it = { availability: 3, availableFrom: '2026-08-03', availableTo: '2026-08-31', absences: [{ from: '2026-08-10', to: '2026-08-12' }] };
  eq('disponibilidad diaria', ['2026-08-01', '2026-08-04', '2026-08-11', '2026-09-01'].map((d) => R.availableOn(it, d)), [0, 3, 0, 0]);
  // Capacidad del equipo ágil
  const cal = PM.cal.make({ workweek: 5, holidaysCO: false }, '2026-08-03');
  const team = { items: [
    { id: 'p1', name: 'Consultora', typeId: 'humano', agileTeam: true, dedication: 100, hoursPerDay: 8 },
    { id: 'p2', name: 'Desarrollador', typeId: 'humano', agileTeam: true, dedication: 50, hoursPerDay: 8, absences: [{ from: '2026-08-05', to: '2026-08-06' }] },
    { id: 'p3', name: 'Fuera del equipo', typeId: 'humano', agileTeam: false },
  ] };
  const cap = R.teamCapacity({ data: team, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'puntos' }, velocity: { avg3: 30 } });
  eq('capacidad: días-persona, normal, proporción y sugerida', [cap.members.length, cap.personDays, cap.normal, Math.round(cap.ratio * 1000) / 1000, cap.suggested, cap.hours], [2, 14, 15, 0.933, 28, 112]);
  eq('capacidad en horas', R.teamCapacity({ data: team, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'horas' }, velocity: null }).suggested, 112);
  eq('capacidad: ausencias por miembro y días hábiles', [cap.workdays, cap.members.map((x) => x.absentDays)], [10, [0, 2]]);
  eq('capacidad sin equipo', R.teamCapacity({ data: { items: [] }, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: {} }).suggested, null);
  eq('capacidad: referencia habitual sin iteraciones cerradas', [cap.reference.kind, cap.reference.personDays], ['habitual', 15]);
  // quien entra después de la iteración no cuenta en la habitual; quien entra a mitad cuenta completo (sus días fuera de rango reducen la disponibilidad)
  const late = { items: [...team.items, { id: 'p4', name: 'Entra después', typeId: 'humano', agileTeam: true, dedication: 100, availableFrom: '2026-08-20' }, { id: 'p5', name: 'Entra a mitad', typeId: 'humano', agileTeam: true, dedication: 100, availableFrom: '2026-08-10' }] };
  const capL = R.teamCapacity({ data: late, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'puntos' }, velocity: { avg3: 30 } });
  eq('capacidad: fuera del rango de disponibilidad no cuenta en la habitual', [capL.personDays, capL.normal, capL.members.map((x) => x.normal), capL.members.map((x) => x.absentDays), capL.members.map((x) => x.inRangeDays), capL.suggested], [19, 25, [10, 5, 0, 10], [0, 2, 0, 0], [10, 10, 0, 5], 22.8]);
  // referencia de la velocidad: días-persona promedio de las iteraciones cerradas del promedio (≤ 3 últimas)
  const velRows = { avg3: 30, rows: [
    { id: 'a0', status: 'cerrado', start: '2026-07-06', end: '2026-07-17' },
    { id: 'a1', status: 'cerrado', start: '2026-07-20', end: '2026-07-24' },
    { id: 'a2', status: 'cerrado', start: '2026-07-27', end: '2026-07-31' },
    { id: 'a3', status: 'cerrado', start: '2026-07-20', end: '2026-07-31' },
    { id: 'a4', status: 'en-curso', start: '2026-08-03', end: '2026-08-14' },
  ] };
  const capV = R.teamCapacity({ data: late, schedule: { tasks: [] }, sprint: { id: 'a4', start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'puntos' }, velocity: velRows });
  eq('capacidad: referencia de las iteraciones cerradas de la velocidad', [capV.reference.kind, capV.reference.sprints.map((x) => [x.id, x.personDays]), capV.reference.personDays, Math.round(capV.ratio * 1000) / 1000, capV.suggested], ['velocidad', [['a1', 7.5], ['a2', 7.5], ['a3', 15]], 10, 1.9, 57]);
  const released = { items: [...team.items, { id: 'p6', name: 'Liberada', typeId: 'humano', agileTeam: true, dedication: 100, status: 'liberado', availableTo: '2026-07-31' }] };
  const capR = R.teamCapacity({ data: released, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'puntos' }, velocity: { avg3: 30, rows: [{ id: 'a3', status: 'cerrado', start: '2026-07-20', end: '2026-07-31' }] } });
  eq('capacidad: quien fue liberado cuenta en la referencia, no en la iteración', [capR.members.length, capR.personDays, capR.reference.personDays, capR.suggested], [2, 14, 25, 16.8]);
  // un no planificado sin «Disponible desde» empieza en su fecha de alta: no cuenta en las iteraciones cerradas anteriores
  const joined = { items: [...team.items, { id: 'p7', name: 'Refuerzo', typeId: 'humano', agileTeam: true, dedication: 100, planned: false, reason: 'rendimiento', addedDate: '2026-08-01' }] };
  const capJ = R.teamCapacity({ data: joined, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10, estimationUnit: 'puntos' }, velocity: { avg3: 30, rows: [{ id: 'a3', status: 'cerrado', start: '2026-07-20', end: '2026-07-31' }] } });
  eq('capacidad: el refuerzo sube la sugerida (no cuenta antes de su alta)', [capJ.personDays, capJ.reference.personDays, capJ.suggested], [24, 15, 48]);
  eq('capacidad: iteración cerrada sin fechas → referencia habitual', R.teamCapacity({ data: team, schedule: { tasks: [] }, sprint: { start: '2026-08-03', end: '2026-08-14' }, cal, settings: { sprintLength: 10 }, velocity: { avg3: 30, rows: [{ id: 'x', status: 'cerrado', start: null, end: null }] } }).reference.kind, 'habitual');
  // Estructura de desglose de recursos
  const sched = C.computeSchedule(R.applyCosts(schedule, data), '2026-08-03');
  const rbs = R.rbsTree({ data, schedule, sched });
  eq('EDR de recursos: tipos', rbs.children.map((n) => [n.label, n.value]), [['Mano de obra', 13000], ['Maquinaria y equipo', 1200], ['Materiales', 6000], ['Sin clasificar', 0]]);
  const grua = rbs.children[1].children[0];
  eq('EDR de recursos: recurso no planificado', [grua.label, grua.badge, grua.tone, grua.sub], ['Grúa', 'No planificado', 'warn', '4 días-recurso · 1 actividad']);
  eq('EDR de recursos: total y porcentaje', [rbs.value, Math.round(rbs.children[0].pct * 1000) / 1000], [20200, 0.644]);
  // Estructura de desglose de costos
  const tree = C.wbsTree([{ id: 'w1', name: 'Gestión', order: 1 }, { id: 'w2', name: 'Obra', order: 2 }, { id: 'w21', parentId: 'w2', name: 'Montaje', order: 1 }, { id: 'w22', parentId: 'w2', name: 'Desmontaje', order: 2 }]);
  const sch2 = { settings: { workweek: 5, holidaysCO: false }, tasks: [
    { id: 't1', name: 'Dirección', duration: 10, cost: 100, wbsId: 'w1', deps: [] }, { id: 't2', name: 'Montaje N1', duration: 5, cost: 300, wbsId: 'w21', deps: [] },
    { id: 't3', name: 'Montaje N2', duration: 5, cost: 200, wbsId: 'w21', deps: [] }, { id: 't4', name: 'Desmontaje', duration: 5, cost: 250, wbsId: 'w22', deps: [] },
    { id: 't5', name: 'Suelta', duration: 1, cost: 50, deps: [] },
  ] };
  const s2 = C.computeSchedule(sch2, '2026-08-03');
  const cbs = R.cbsTree({ tree, sched: s2, schedule: sch2, data: null, reserves: { contingency: 90, management: 10 }, controlDepth: 1 });
  eq('EDC: presupuesto, reservas y línea base', [cbs.value, cbs.children.map((n) => [n.label, n.value])], [1000, [['Reserva de gestión', 10], ['Línea base de costos', 990]]]);
  const lb = cbs.children[1];
  eq('EDC: cuentas de control', lb.children.map((n) => [n.label, n.value, n.code]), [['Reserva para contingencias', 90, undefined], ['Gestión', 100, '1.1'], ['Obra', 750, '1.2'], ['Sin entregable de la EDT', 50, undefined]]);
  eq('EDC: paquetes de trabajo', lb.children[2].children.map((n) => [n.label, n.value, n.code]), [['Montaje', 500, '1.2.1'], ['Desmontaje', 250, '1.2.2']]);
  eq('EDC: porcentaje del presupuesto', Math.round(lb.children[2].pct * 100), 75);
  eq('EDC: con actividades', R.cbsTree({ tree, sched: s2, schedule: sch2, reserves: {}, showActivities: true }).children[1].children[2].children[0].children.map((n) => n.label), ['Montaje N1', 'Montaje N2']);
  eq('EDC: cuenta de control en el nivel 2', R.cbsTree({ tree, sched: s2, schedule: sch2, reserves: {}, controlDepth: 2 }).children[1].children.map((n) => n.label), ['Reserva para contingencias', 'Gestión', 'Montaje', 'Desmontaje', 'Sin entregable de la EDT']);
  const bl = { label: 'LB0', cost: { tasks: [{ id: 't1', cost: 80 }, { id: 't2', cost: 400 }], contingency: 50, management: 5 }, schedule: { tasks: [{ id: 't1', wbsId: 'w1' }, { id: 't2', wbsId: 'w21' }] } };
  const cbsB = R.cbsTree({ tree, sched: s2, schedule: sch2, baseline: bl, reserves: { contingency: 90 }, source: 'baseline' });
  eq('EDC desde la línea base', [cbsB.value, cbsB.children[1].sub, cbsB.children[1].children.map((n) => n.value)], [535, 'LB0', [50, 80, 400]]);
  const cbsC = R.cbsTree({ tree, sched, schedule, data, reserves: {}, by: 'categoria' });
  eq('EDC por categoría de costo', cbsC.children[1].children.filter((n) => n.kind === 'group').map((n) => [n.label, n.value]), [['Mano de obra', 10000], ['Materiales', 6000], ['Sin categoría', 1450], ['Equipos', 1200], ['Otros', 100]]);
  eq('EDC por categoría: solo categorías de costo, sin grupos en 0', cbsC.children[1].children.filter((n) => n.kind === 'group').every((n) => [...PM.RES.COST_CATEGORIES, 'Sin categoría'].includes(n.label) && n.value > 0), true);
  eq('categoría de costo de un tipo', [R.costCategoryOf({ edr: 'Personal' }), R.costCategoryOf({ edr: 'Servicios', costCategory: 'Subcontratos' }), R.costCategoryOf({ edr: 'Equipos', costCategory: 'Inventada' }), R.costCategoryOf(null), R.costCategoryOf(R.types({ preset: 'construccion' }).find((t) => t.id === 'subcontrato'))], ['Mano de obra', 'Subcontratos', 'Equipos', 'Otros', 'Subcontratos']);
  // Plural de las unidades
  eq('unidades en plural', [PM.RES.unitN(1, 'hora'), PM.RES.unitN(0, 'hora'), PM.RES.unitN(4, 'unidad'), PM.RES.unitN(2, 'galón'), PM.RES.unitN(3, 'm³'), PM.RES.unitN(2, 'usuario-mes'), PM.RES.unitN(5, 'kit'), PM.RES.unitN(2, 'bolsa de cemento'), PM.RES.unitN(2, 'contenedor'), PM.RES.unitN(2, 'kg'), PM.RES.unitN(2, '')], ['hora', 'horas', 'unidades', 'galones', 'm³', 'usuarios-mes', 'kits', 'bolsas de cemento', 'contenedores', 'kg', '']);
  eq('EDR de recursos: consumible en plural', rbs.children[2].children[0].sub, '12 m³ · 1 actividad');
  // Reserva para contingencias en el plan vigente (§10.3): disponible = total − consumido; lo no asignado, cuenta aparte
  const dataR = { preset: 'construccion', items: [
    { id: 'q1', name: 'Grúa adicional', typeId: 'maquinaria', unitCost: 100, planned: false, reason: 'riesgo', reserveAmount: 30 },
    { id: 'q2', name: 'Bombeo', typeId: 'subcontrato', unitCost: 10, planned: false, reason: 'riesgo', reserveAmount: 20 },
    { id: 'q3', name: 'Cambio', typeId: 'material', unitCost: 1, planned: false, reason: 'cambio-alcance' },
  ] };
  const sch3 = { settings: { workweek: 5, holidaysCO: false }, tasks: [
    { id: 't1', name: 'Dirección', duration: 10, cost: 100, wbsId: 'w1', deps: [] },
    { id: 't2', name: 'Montaje', duration: 2, cost: 0, costMode: 'recursos', wbsId: 'w21', deps: [], resources: [{ resourceId: 'q1', name: 'Grúa adicional', units: 1 }] },
    { id: 't3', name: 'Global', duration: 2, cost: 40, wbsId: 'w22', deps: [], resources: [{ resourceId: 'q2', name: 'Bombeo', units: 1 }] },
  ] };
  const ru = R.reserveUse({ data: dataR, schedule: R.applyCosts(sch3, dataR), contingency: 90 });
  eq('uso de la reserva: total, consumido, disponible, asignado y sin actividad', [ru.total, ru.consumed, ru.available, ru.assigned, ru.unassigned, ru.items.map((x) => [x.item.id, x.amount, x.assigned, x.unassigned])], [90, 50, 40, 30, 20, [['q1', 30, 200, 0], ['q2', 20, 0, 20]]]);
  const s3 = C.computeSchedule(R.applyCosts(sch3, dataR), '2026-08-03');
  const cbsR = R.cbsTree({ tree, sched: s3, schedule: sch3, data: dataR, reserves: { contingency: 90, management: 10 } });
  const lbR = cbsR.children[1];
  eq('EDC del plan: reserva disponible y respuestas sin actividad', [cbsR.value, lbR.value, lbR.children.filter((n) => n.kind === 'reserve').map((n) => [n.id, n.value]), lbR.children[0].reserveTotal, lbR.children[0].reserveConsumed], [10 + 100 + 200 + 40 + 20 + 40, 400, [['cbs:cont', 40], ['cbs:riesgos', 20]], 90, 50]);
  eq('EDC de una línea base: la reserva aprobada sin cambios', R.cbsTree({ tree, sched: s3, schedule: sch3, data: dataR, baseline: bl, reserves: { contingency: 90 }, source: 'baseline' }).children[1].children[0].value, 50);
  eq('EDC sin consumo: la reserva completa', R.cbsTree({ tree, sched: s2, schedule: sch2, data: null, reserves: { contingency: 90 } }).children[1].children.filter((n) => n.kind === 'reserve').map((n) => n.value), [90]);
  // Estructura de desglose de los riesgos
  const planRows = [{ nivel1: 'Técnico', nivel2: 'Procesos técnicos y tecnología', categoriaRegistro: 'Técnico' }, { nivel1: 'Externo', nivel2: 'Clima y medio ambiente', categoriaRegistro: 'Externo' }, { nivel1: 'Externo', nivel2: 'Legislación y regulaciones', categoriaRegistro: 'Externo' }];
  const risks = [
    { id: 'R-001', descripcion: 'Lluvias', categoria: 'Externo', subcategoria: 'Clima y medio ambiente', probabilidad: 4, impacto: 4, tipo: 'Amenaza', estado: 'Abierto' },
    { id: 'R-002', descripcion: 'Falla del anclaje', categoria: 'Técnico', probabilidad: 2, impacto: 5 },
    { id: 'R-003', descripcion: 'Descuento por volumen', categoria: 'De la organización', probabilidad: 3, impacto: 2, tipo: 'Oportunidad' },
    null,
  ];
  const rt = R.riskTree({ planRows, risks });
  eq('EDR de riesgos: niveles y conteos', rt.children.map((n) => [n.label, n.value, n.children.map((c) => [c.label, c.value])]), [['Técnico', 1, [['Procesos técnicos y tecnología', 0], ['Sin subcategoría', 1]]], ['Externo', 1, [['Clima y medio ambiente', 1], ['Legislación y regulaciones', 0]]], ['De la organización', 1, [['Sin subcategoría', 1]]]]);
  const r1 = rt.children[1].children[0].children[0];
  eq('EDR de riesgos: hoja con nivel y texto', [r1.label, r1.value, r1.level, r1.tone, r1.sub], ['R-001 · Lluvias', 16, 'Alto', 'signal', 'Amenaza · P×I 16 (Alto) · Abierto']);
  eq('EDR de riesgos: tono del grupo = máximo', [rt.children[1].level, rt.value], ['Alto', 3]);
  eq('EDR de riesgos: prefiere el nivel 1 con el mismo nombre', R.riskTree({ planRows: [{ nivel1: 'Comercial', nivel2: 'Proveedores', categoriaRegistro: 'Externo' }, { nivel1: 'Externo', nivel2: 'Clima', categoriaRegistro: 'Externo' }], risks: [{ id: 'X', categoria: 'Externo', probabilidad: 1, impacto: 1 }] }).children.map((n) => [n.label, n.value]), [['Comercial', 0], ['Externo', 1]]);
  eq('EDR de riesgos sin plan: por categoría del registro', R.riskTree({ planRows: [], risks }).children.map((n) => n.label), ['Externo', 'Técnico', 'De la organización']);
  eq('EDR de riesgos: oportunidad marcada', rt.children[2].children[0].children[0].badge, 'Oportunidad');
  // las oportunidades no dan el nivel ni el tono de alerta del grupo
  const rtO = R.riskTree({ planRows, risks: [{ id: 'O-1', descripcion: 'Precio', categoria: 'Externo', subcategoria: 'Clima y medio ambiente', probabilidad: 5, impacto: 5, tipo: 'Oportunidad' }, { id: 'A-1', descripcion: 'Lluvia', categoria: 'Externo', subcategoria: 'Clima y medio ambiente', probabilidad: 1, impacto: 2, tipo: 'Amenaza' }] });
  const gO = rtO.children.find((n) => n.label === 'Externo');
  eq('EDR de riesgos: oportunidades aparte', [gO.value, gO.threats, gO.opportunities, gO.max, gO.level, gO.children[0].children.map((c) => [c.code, c.tone, c.opportunity])], [2, 1, 1, 2, PM.calc.riskLevel(2).label, [['O-1', 'good', true], ['A-1', PM.calc.riskLevel(2).tone, false]]]);
  // Robustez: costo unitario negativo, asignación solo con resourceId, fechas imposibles y recurso compacto
  eq('costo unitario negativo → 0', R.assignment(R.catalog({ items: [{ id: 'n', name: 'Neg', unitCost: -50 }] }, null), { duration: 2 }, { resourceId: 'n', units: 1 }).cost, 0);
  eq('asignación con resourceId y sin nombre: cuenta en el costo de la actividad', R.taskCost({ costMode: 'recursos', duration: 2, resources: [{ resourceId: 'r1', units: 1 }, { resourceId: 'nada', units: 1 }] }, cat).total, 2000);
  eq('fechas imposibles no son válidas', ['2026-13-45', '2026-02-29', '2028-02-29', '2026-04-31', '2026-00-10', '2026-12-31', '1900-02-29', '2000-02-29'].map((d) => PM.date.valid(d)), [false, false, true, false, false, true, false, true]);
  eq('recurso compacto: sin vacíos ni valores por omisión', R.compact({ ...R.newItem([], { name: 'Grúa', typeId: 'maquinaria', unitCost: 300, planned: false, reason: 'riesgo' }), id: 'g1', code: 'REC-009', addedDate: '2026-08-01', virtual: true }), { id: 'g1', code: 'REC-009', name: 'Grúa', typeId: 'maquinaria', unitCost: 300, planned: false, addedDate: '2026-08-01', reason: 'riesgo' });
  eq('recurso compacto: el catálogo lo rellena igual', (() => { const full = R.newItem([], { id: 'g2', name: 'Andamio', unitCost: 5 }); const a = R.catalog({ items: [full] }, null).items[0], b = R.catalog({ items: [R.compact(full)] }, null).items[0]; return ['unit', 'origin', 'status', 'planned', 'dedication', 'hoursPerDay', 'agileTeam', 'availability', 'unitCost'].every((k) => a[k] === b[k]); })(), true);
  // Datos mal formados
  let bad = null;
  try {
    R.catalog({ items: 'x', types: { a: 1 } }, { tasks: [null, { resources: 'x' }, { resources: [null, { name: 3 }] }], settings: { resourceLimits: 'x' } });
    R.taskCost({ costMode: 'recursos', resources: [null, 'x', { name: 'z', units: 'abc' }] }, null);
    R.rbsTree({ data: null, schedule: null, sched: null }); R.cbsTree({}); R.riskTree({}); R.teamCapacity({});
    R.applyCosts({ tasks: [{ costMode: 'mixto' }] }, { items: [null] });
  } catch (e) { bad = String(e && e.stack); }
  eq('mal formado: sin excepciones', bad, null);
  const nt = PM.normalizeTool('resources', { types: { a: 1 }, items: [null, { id: 'x', name: 'X', absences: 'y' }] });
  const usage = R.usage(cat, schedule.tasks);
  eq('uso por recurso', [usage.get('r1').count, usage.get('r1').qty, usage.get('r1').cost, usage.get('r2').qty], [3, 13, 13000, 12]);
  eq('normalizar herramienta de recursos', [nt.types, nt.items.length, nt.items[0].absences], [[], 1, []]);
  return out;
});

// Integración: modelo del proyecto (costos calculados en el cronograma y el valor ganado), ayudante de guardado y control de cambios
const ui = [];
const ok = (name, cond, info) => ui.push({ name, ok: !!cond, got: info });
const pid = await createProject(page, { lifecycle: 'Predictivo', start: '2026-08-03' });
await page.evaluate(() => {
  const { html } = PM.lib;
  function Probe() {
    const m = PM.useResourceModel();
    const t = m.sched.byId && m.sched.byId.get('a');
    window.__probe = m;
    return html`<div id="probe" data-cost=${t ? t.cost : ''} data-bac=${m.evm ? m.evm.bac : ''} data-items=${m.catalog ? m.catalog.items.length : ''}>probe</div>`;
  }
  PM.registerView({ id: 'prueba-recursos', label: 'Prueba recursos', group: 'analisis', order: 999, component: Probe });
});
await page.evaluate(async (pid) => {
  await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: false }, tasks: [
    { id: 'a', name: 'A', duration: 5, deps: [], cost: 100, costMode: 'recursos', resources: [{ name: 'Cuadrilla', units: 2 }] },
    { id: 'b', name: 'B', duration: 5, deps: [], cost: 300, resources: [{ name: 'Cuadrilla', units: 1 }] },
  ] });
  await PM.store.set(PM.paths.tool(pid, 'resources'), { preset: 'alquiler', types: [], items: [{ id: 'r1', code: 'REC-001', name: 'Cuadrilla', typeId: 'personal', unitCost: 40 }] });
}, pid);
await page.evaluate(() => PM.navigate('prueba-recursos'));
await page.waitForTimeout(900);
let probe = await page.evaluate(() => { const e = document.getElementById('probe'); return e ? { ...e.dataset } : null; });
ok('modelo: costo calculado por recursos en el cronograma (2 × 5 × 40)', probe && probe.cost === '400' && probe.bac === '700', probe);
const saved = await page.evaluate(async () => { const m = window.__probe; const v = m.catalog.items.find((x) => x.name === 'Cuadrilla'); const x = await m.saveItem({ ...v, unitCost: 50 }); await new Promise((r) => setTimeout(r, 1000)); await PM.store.flush(); return { x, doc: await PM.store.get(PM.paths.tool(PM.getState().projectId, 'resources')) }; });
ok('guardar un recurso del catálogo', saved.doc.items.length === 1 && saved.doc.items[0].unitCost === 50 && saved.x.id === 'r1', saved.doc.items);
const big = await page.evaluate(async () => { const m = window.__probe; const v = m.catalog.items.find((x) => x.name === 'Cuadrilla'); try { await m.saveItem({ ...v, notes: 'x'.repeat(300 * 1024) }); return 'guardado'; } catch (e) { return String(e.message); } });
ok('un catálogo más grande que un registro no se guarda (y se avisa)', big === 'catálogo demasiado grande', big);
await page.waitForTimeout(500);
probe = await page.evaluate(() => ({ ...document.getElementById('probe').dataset }));
ok('el costo calculado se actualiza al cambiar la tarifa', probe.cost === '500', probe);
const virt = await page.evaluate(async (pid) => {
  await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: false }, tasks: [{ id: 'a', name: 'A', duration: 5, deps: [], cost: 100, resources: [{ name: 'Montacargas', units: 1 }] }] });
  await new Promise((r) => setTimeout(r, 400));
  const m = window.__probe; const v = m.catalog.items.find((x) => x.name === 'Montacargas');
  const x = await m.saveItem({ ...v, typeId: 'izaje' }); await new Promise((r) => setTimeout(r, 1000)); await PM.store.flush();
  return { virtual: !!v.virtual, x, doc: await PM.store.get(PM.paths.tool(pid, 'resources')) };
}, pid);
ok('un recurso virtual se guarda con id y código nuevos al editarlo', virt.virtual && /^rec/.test(virt.x.id) && virt.x.code === 'REC-002' && virt.doc.items.length === 2 && !('virtual' in virt.doc.items[1]), virt);
const chained = await page.evaluate(async (pid) => {
  const m = window.__probe;
  await m.saveItem({ name: 'Uno', typeId: 'personal' }); await m.saveItem({ name: 'Dos', typeId: 'personal' });
  const many = await m.saveItems([{ name: 'Tres' }, { name: 'Cuatro' }]);
  await new Promise((r) => setTimeout(r, 1000)); await PM.store.flush();
  const doc = await PM.store.get(PM.paths.tool(pid, 'resources'));
  return { names: doc.items.map((i) => i.name), codes: many.map((x) => x.code) };
}, pid);
ok('escrituras seguidas no se pisan (saveItem y saveItems)', ['Uno', 'Dos', 'Tres', 'Cuatro'].every((n) => chained.names.includes(n)) && chained.codes.length === 2 && chained.codes[0] !== chained.codes[1], chained);
const cc = await page.evaluate(async (pid) => {
  const project = await PM.store.get(PM.paths.project(pid));
  const a = await PM.changeControl.register({ pid, project: { id: pid, ...project }, description: 'Grúa adicional', justification: 'Cambio de método', scope: 'Izaje', days: 2, cost: 1500, affected: ['Línea base de costos'], requester: 'Residente de obra' });
  const b = await PM.changeControl.register({ pid, project: { id: pid, ...project }, description: 'Otro', cost: 10 });
  const reg = await PM.store.get(PM.paths.doc(pid, 'registro-cambios'));
  const doc = await PM.store.get(PM.paths.doc(pid, a.docId));
  return { a, b, rows: reg.fields.cambios.map((r) => [r.id, r.estado, r.impactoCosto, r.impactoCronograma]), doc: [doc.template, doc.fields.codigoCambio, doc.fields.decision, doc.fields.valorCosto, doc.fields.solicitante] };
}, pid);
ok('control de cambios: solicitud y fila del registro', cc.a.code === 'CC-001' && cc.b.code === 'CC-002' && JSON.stringify(cc.rows) === JSON.stringify([['CC-001', 'Registrada', 1500, 2], ['CC-002', 'Registrada', 10, 0]]) && JSON.stringify(cc.doc) === JSON.stringify(['solicitud-cambio', 'CC-001', 'Registrada', 1500, 'Residente de obra']), cc);
const exported = await page.evaluate((pid) => PM.projectOps.exportData(pid), pid);
ok('exportación incluye el catálogo de recursos', exported.collections.tools.some((t) => t.id === 'resources'), exported.collections.tools.map((t) => t.id));

let fails = 0;
for (const r of [...results, ...ui]) { if (!r.ok) fails++; console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : `\n      obtenido: ${JSON.stringify(r.got)}` + ('exp' in r ? `\n      esperado: ${JSON.stringify(r.exp)}` : ''))); }
if (errors.length) { console.log(errors); fails++; }
await browser.close();
console.log(`\n${results.length + ui.length - fails}/${results.length + ui.length} correctas`);
process.exit(fails ? 1 : 0);

// Capa ágil del ejemplo «Edificio Atalaya del Occidente» (src/96-example-medellin-agile.js, enfoque híbrido, SPEC §9.7).
// Uso: node test/example-medellin-agile.test.mjs [--file <página.html>] [--shots dir]
//   Sin --file construye una página completa (todos los módulos) en el directorio temporal.
//   1) Valor ganado del proyecto idéntico con y sin la capa ágil (PV, EV, AC, SPI, CPI, EAC, serie de la curva S) e igual
//      a las cifras del informe de septiembre; costos divididos sin cambiar los totales por fecha ni por actividad.
//   2) Enfoque por entregable de la EDT, configuración ágil, release, iteraciones (20 días hábiles del calendario del
//      proyecto), backlog (35 a 50 elementos con historial coherente), métricas con datos y RACI con roles y eventos ágiles.
//   3) Documentos ágiles (claves de 14-templates-agile), textos del enfoque híbrido en 92 y 93 y lecciones de la
//      retrospectiva en el registro de lecciones aprendidas.
//   4) Ejemplo creado desde la app: vistas ágiles, EDT, RACI, valor ganado ágil y tablero sin errores (1360 px y 400 px oscuro).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { openApp, root, errorCards, horizontalOverflow, gotoView } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });
let file = opt('--file');
if (!file) {
  const dir = join(tmpdir(), 'gestor-pmbok-medellin-agile-test'); mkdirSync(dir, { recursive: true });
  file = join(dir, 'app.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file], { stdio: 'pipe' });
}
file = resolve(file);

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const report = (res) => {
  for (const c of res.checks) { if (c.ok) passes++; else { failures++; console.log('  FALLA: ' + c.msg + (c.extra !== undefined ? ' → ' + JSON.stringify(c.extra).slice(0, 700) : '')); } }
  console.log(`  ${res.checks.filter((c) => c.ok).length}/${res.checks.length} verificaciones`);
};

/* Cifras del informe de desempeño de septiembre de 2026 (92-example-medellin-docs-a.js, EV_ROWS) */
const EXPECT = { bac: 139576e6, pv: 48807248308, ev: 46871360000, ac: 48593020000, cut: '2026-09-30' };

/* ------------------------------------------------------------------ 1–3) datos del constructor */
async function validateData(page) {
  return page.evaluate(async (X) => {
    const out = { checks: [], info: {} };
    const ok = (cond, msg, extra) => out.checks.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date;
    const CUT = X.cut;
    const ex = PM.getExample('medellin');
    ok(PM.exampleAgile && typeof PM.exampleAgile.medellin === 'function', 'PM.exampleAgile.medellin expuesto por 96-example-medellin-agile.js');
    const data = ex.build({ today: D.today() });
    ok(JSON.stringify(data) === JSON.stringify(ex.build({ today: '2031-01-01' })), 'el constructor sigue siendo determinista con la capa ágil');
    /* versión sin la capa ágil: mismo constructor sin PM.exampleAgile */
    const keep = PM.exampleAgile;
    PM.exampleAgile = {};
    let base;
    try { base = ex.build({ today: D.today() }); } finally { PM.exampleAgile = keep; }
    const layer = PM.exampleAgile.medellin({});
    const F = layer.facts;
    const tool = (d, id) => (d.collections.tools.find((t) => t.id === id) || {}).data;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    /* ---------------- 1) valor ganado idéntico */
    const evmOf = (d) => {
      const actives = PM.calc.activeBaselines(d.collections.baselines.map((b) => ({ id: b.id, data: b.data })));
      const agile = tool(d, 'agile');
      const items = (d.collections.backlog || []).map((x) => ({ ...x.data, id: x.id }));
      /* como useProjectModel: el avance ágil se aplica al cronograma antes del CPM */
      const eff = agile ? PM.agile.applyToSchedule(tool(d, 'schedule'), agile, items) : tool(d, 'schedule');
      const sched = PM.calc.computeSchedule(eff, d.project.start);
      const fc = PM.calc.computeSchedule(eff, d.project.start, d.project.statusDate);
      const e = PM.calc.evm({ sched, costBaseline: actives.cost, costs: tool(d, 'costs'), statusDate: d.project.statusDate });
      const pick = {}; for (const k of ['bac', 'pv', 'ev', 'ac', 'sv', 'cv', 'spi', 'cpi', 'eac', 'eacAtypical', 'eacComposite', 'etc', 'vac', 'tcpi', 'pctPlanned', 'pctComplete', 'pctSpent', 'spiT', 'forecastFinish', 'totalBudget']) pick[k] = e[k];
      return { e: pick, series: e.series, finish: fc.finish, critical: [...fc.criticalIds].sort(), eff };
    };
    const A = evmOf(data), B = evmOf(base);
    ok(same(A.e, B.e), 'valor ganado del proyecto idéntico con y sin la capa ágil (BAC, PV, EV, AC, SPI, CPI, EAC, TCPI…)', { con: A.e, sin: B.e });
    ok(same(A.series, B.series), 'curva S (PV, EV y AC por fecha) idéntica con y sin la capa ágil');
    ok(A.finish === B.finish && same(A.critical, B.critical), 'fin pronosticado y ruta crítica idénticos', [A.finish, B.finish]);
    ok(A.eff === tool(data, 'schedule'), 'el avance ágil no modifica el cronograma (ningún release vinculado a una actividad)');
    ok(A.e.bac === X.bac && Math.round(A.e.pv) === X.pv && Math.round(A.e.ev) === X.ev && Math.round(A.e.ac) === X.ac, 'BAC, PV, EV y AC al corte iguales a los del informe de septiembre', A.e);
    ok(A.e.spi.toFixed(2) === '0.96' && A.e.cpi.toFixed(2) === '0.96' && Math.round(A.e.eac / 1e6) === 144703, 'SPI 0,96, CPI 0,96 y EAC de COP 144.703 M sin cambio', [A.e.spi, A.e.cpi, A.e.eac]);
    out.info.evm = A.e;
    for (const id of ['schedule', 'quality']) ok(same(tool(data, id), tool(base, id)), 'herramienta ' + id + ' sin cambios');
    ok(same(data.collections.baselines, base.collections.baselines), 'líneas base LB0 y LB1 sin cambios');
    ok(same(data.collections.flows, base.collections.flows), 'diagramas de flujo sin cambios');
    const cA = tool(data, 'costs'), cB = tool(base, 'costs');
    ok(same(cA.statusUpdates, cB.statusUpdates) && same(cA.reserves, cB.reserves), 'cortes de avance y reservas sin cambios');
    const sumBy = (list, key) => { const m = {}; for (const a of list) m[a[key]] = (m[a[key]] || 0) + a.amount; return m; };
    ok(same(sumBy(cA.actuals, 'date'), sumBy(cB.actuals, 'date')) && same(sumBy(cA.actuals, 'taskId'), sumBy(cB.actuals, 'taskId')) && same(sumBy(cA.actuals, 'wbsId'), sumBy(cB.actuals, 'wbsId')) && same(sumBy(cA.actuals, 'category'), sumBy(cB.actuals, 'category')), 'costos reales: totales por fecha, actividad, paquete y categoría sin cambios');
    const tagged = cA.actuals.filter((a) => a.releaseId);
    const months = Object.keys(F.digital);
    ok(cA.actuals.length === cB.actuals.length + months.length && tagged.length === months.length, 'un registro de C02 por mes (marzo a septiembre de 2026) dividido en dos', [cA.actuals.length, cB.actuals.length, tagged.length]);
    ok(new Set(cA.actuals.map((a) => a.id)).size === cA.actuals.length, 'ids únicos de los costos reales');
    const splitOk = cB.actuals.filter((a) => a.taskId === 'C02' && months.includes(a.date.slice(0, 7))).every((orig) => {
      const parts = cA.actuals.filter((a) => a.id === orig.id || a.id === orig.id + '-d');
      return parts.length === 2 && parts.every((p) => p.date === orig.date && p.taskId === 'C02' && p.wbsId === orig.wbsId && p.category === orig.category && p.document === orig.document && p.amount > 0) && parts[0].amount + parts[1].amount === orig.amount && parts.filter((p) => p.releaseId === F.releaseId).length === 1 && parts.find((p) => p.releaseId).amount === F.digital[orig.date.slice(0, 7)];
    });
    ok(splitOk, 'cada división: mismo día, misma actividad, paquete, categoría y documento, misma suma; la parte digital con el release');
    ok(tagged.every((a) => a.taskId === 'C02' && a.releaseId === F.releaseId && a.date <= CUT), 'solo la parte digital de C02 lleva el release, hasta el corte');

    /* ---------------- 2) enfoque, configuración, release e iteraciones */
    ok(data.project.lifecycle === 'Híbrido' && PM.agile.mode(data.project) === 'hibrido' && PM.agile.enabled(data.project), 'proyecto híbrido con la capa ágil activa', data.project.lifecycle);
    ok(base.project.lifecycle === 'Predictivo', 'sin la capa ágil el ejemplo sigue siendo predictivo');
    ok(/Ciclo de vida híbrido/.test(data.project.description) && /1\.4\.2/.test(data.project.description), 'la descripción del proyecto explica el enfoque híbrido');
    const nodes = tool(data, 'wbs').nodes, nodesB = tool(base, 'wbs').nodes;
    const tree = PM.calc.wbsTree(nodes);
    const ap = PM.calc.wbsApproach(tree, data.project);
    ok(nodes.find((n) => n.id === 'w142').approach === 'adaptativo' && nodes.filter((n) => n.approach).length === 1, 'solo el paquete 1.4.2 «Mercadeo y publicidad» declara enfoque adaptativo');
    ok(ap.get('w142') === 'adaptativo' && nodes.filter((n) => n.id !== 'w142').every((n) => ap.get(n.id) === 'predictivo'), 'el resto de la EDT hereda el enfoque predictivo');
    ok(nodes.every((n) => { const b = nodesB.find((x) => x.id === n.id); return n.id === 'w142' ? b.costEstimate === n.costEstimate && b.name === n.name : same(n, b); }), 'EDT sin otros cambios (costos, nombres y diccionario)');
    ok(/Enfoque adaptativo desde marzo de 2026/.test(nodes.find((n) => n.id === 'w142').notes), 'notas del paquete 1.4.2 con el enfoque adaptativo');
    const agile = tool(data, 'agile');
    const st = PM.agile.settings(agile);
    ok(same(agile.settings, st) || (st.framework === agile.settings.framework && st.columns.length === agile.settings.columns.length), 'configuración ágil válida para PM.agile.settings');
    ok(st.framework === 'scrum-kanban' && st.estimationUnit === 'puntos' && st.sprintLength === 20 && st.scopeChangeThreshold === 10, 'Scrum con tablero Kanban, puntos, iteraciones de 20 días hábiles y umbral de 10 %', st);
    ok(st.columns.map((c) => [c.name, c.category, c.wip].join('|')).join(';') === 'Por hacer|pendiente|;En producción|en-curso|4;Aprobación comercial y legal|en-curso|3;Publicado|terminado|', 'columnas «Por hacer», «En producción» (WIP 4), «Aprobación comercial y legal» (WIP 3) y «Publicado»', st.columns);
    ok(agile.releases.length === 1, 'un release');
    const rel = agile.releases[0];
    const c02 = tool(data, 'schedule').tasks.find((t) => t.id === 'C02');
    ok(rel.name === 'Canales digitales de venta — etapa 2' && rel.taskId === null && rel.wbsId === F.releaseWbs && rel.status === 'en-curso', 'release «Canales digitales de venta — etapa 2» sin actividad del cronograma', { taskId: rel.taskId, wbsId: rel.wbsId, status: rel.status });
    ok(PM.agile.linksOf(tool(data, 'schedule').tasks, agile).size === 0 && !tool(data, 'schedule').tasks.some((t) => t.releaseId), 'ninguna actividad del cronograma representa el release (C02 sigue por nivel de esfuerzo)');
    ok(c02.cost === 1459e6 && rel.budget === F.budget && rel.budget > 0 && rel.budget < c02.cost, 'presupuesto del release (COP 245 M) dentro del rubro de publicidad y mercadeo de C02 (COP 1.459 M) sin agregar costo', [rel.budget, c02.cost]);
    ok(/nivel de esfuerzo/.test(rel.notes) && /no aumenta el BAC/.test(rel.notes) && /nivel 1/.test(rel.notes) && /sin solicitud de cambio/.test(rel.notes), 'las notas del release explican el vínculo con C02, el presupuesto y el cambio de nivel 1');
    ok(PM.agile.hasBaseline(rel) && rel.baseline.date <= rel.start && rel.baseline.points === F.basePoints && rel.baseline.end === rel.end && rel.baseline.budget === rel.budget && rel.baseline.sprints === rel.plannedSprints && rel.baseline.changeRef === null, 'línea base del release comprometida al inicio (213 pts, fin, presupuesto y 12 iteraciones)', rel.baseline);
    const cal = PM.cal.make(tool(data, 'schedule').settings, data.project.start);
    const sprints = PM.agile.sortSprints(agile.sprints);
    ok(sprints.length === 12 && rel.plannedSprints === 12 && sprints.every((s) => s.releaseId === rel.id), 'doce iteraciones del release', sprints.length);
    ok(sprints[0].start === rel.start && sprints[0].start.slice(0, 7) === '2026-03' && sprints[sprints.length - 1].end === rel.end, 'iteraciones de marzo a diciembre de 2026 (inicio y fin del release)');
    ok(sprints.every((s) => cal.isWork(s.start) && cal.isWork(s.end) && cal.countWork(s.start, s.end) === st.sprintLength), 'cada iteración tiene 20 días hábiles del calendario del proyecto (lunes a sábado con festivos de Colombia)', sprints.map((s) => s.name + ' ' + cal.countWork(s.start, s.end)));
    ok(sprints.every((s, i) => i === 0 || s.start === cal.addWork(sprints[i - 1].end, 1)), 'cada iteración empieza el día hábil siguiente a la anterior');
    ok(sprints.every((s) => (s.end < CUT ? s.status === 'cerrado' : s.start <= CUT ? s.status === 'en-curso' : s.status === 'planeado')), 'cerradas las terminadas antes del corte, en curso la del corte y planeadas las siguientes', sprints.map((s) => s.name + ' ' + s.status));
    ok(sprints.filter((s) => s.status === 'en-curso').length === 1 && sprints.every((s, i) => s.name === 'Iteración ' + (i + 1)), 'una sola iteración en curso; nombres consecutivos');

    /* ---------------- backlog */
    const items = data.collections.backlog.map((x) => ({ ...x.data, id: x.id }));
    const byId = new Map(items.map((i) => [i.id, i]));
    const countable = items.filter(PM.agile.countable);
    const epics = items.filter((i) => i.type === 'epica');
    ok(items.length >= 35 && items.length <= 50, 'backlog de 35 a 50 elementos', items.length);
    ok(new Set(items.map((i) => i.code)).size === items.length && items.every((i) => new RegExp('^' + PM.AGILE.CODE_PREFIX[i.type] + '-\\d{3}$').test(i.code)), 'códigos únicos con el prefijo de su tipo');
    const ITEM_KEYS = ['code', 'type', 'title', 'description', 'acceptance', 'estimate', 'priority', 'rank', 'status', 'wbsId', 'releaseId', 'sprintId', 'epicId', 'assignee', 'blocked', 'tags', 'createdAt', 'doneDate', 'history'];
    ok(items.every((i) => ITEM_KEYS.every((k) => k in i) && PM.AGILE.ITEM_TYPES.some((t) => t.value === i.type) && PM.AGILE.PRIORITIES.includes(i.priority) && (i.value === undefined || i.value === null || (i.value >= 1 && i.value <= 10))), 'forma de Item (SPEC §9.2)', items.find((i) => !ITEM_KEYS.every((k) => k in i)));
    const EPIC_RE = [/^Sitio web y páginas por tipología \(VIS y No VIS\)/, /recorrido virtual 360°/i, /CRM y embudo de ventas con calificación de prospectos/, /Pauta digital y medición del costo por prospecto y por venta/, /Simulador de crédito y subsidios para vivienda VIS/, /Separación en línea con el encargo fiduciario/, /Contenidos de avance de obra para compradores/];
    ok(epics.length === 7 && EPIC_RE.every((re) => epics.some((e) => re.test(e.title))), 'siete épicas de los canales digitales de venta', epics.map((e) => e.title));
    ok(countable.every((i) => i.epicId && byId.get(i.epicId) && byId.get(i.epicId).type === 'epica'), 'cada elemento pertenece a una épica');
    ok(items.every((i) => i.wbsId === 'w142'), 'todos los elementos son del paquete adaptativo 1.4.2');
    ok(countable.filter((i) => !i.releaseId).every((i) => i.priority === 'No en este release') && countable.some((i) => !i.releaseId), 'los elementos fuera del release están marcados «No en este release»');
    const inRel = countable.filter((i) => i.releaseId === rel.id);
    ok(inRel.every((i) => PM.isNum(i.estimate) && i.estimate > 0 && String(i.acceptance).length > 40), 'cada elemento del release está estimado y tiene criterios de aceptación');
    ok(countable.some((i) => !PM.isNum(i.estimate) && !i.acceptance), 'hay elementos por refinar (sin estimación ni criterios)');
    const accAll = countable.map((i) => i.acceptance).join(' ');
    ok(/Ley 1480 de 2011/.test(accAll) && /Ley 1581 de 2012/.test(accAll) && /Imágenes de referencia/.test(accAll) && /autorización previa, expresa e informada/i.test(accAll), 'criterios de publicidad de vivienda (Ley 1480 de 2011) y de datos personales (Ley 1581 de 2012)');
    const sprintById = new Map(sprints.map((s) => [s.id, s]));
    const histProblems = [];
    for (const i of items) {
      const h = i.history;
      if (!Array.isArray(h) || !h.length) { histProblems.push(i.code + ': sin historial'); continue; }
      if (h[0].date !== i.createdAt || h[0].status !== 'backlog') histProblems.push(i.code + ': el historial no empieza en el backlog el día de creación');
      if (h.some((x, k) => !D.valid(x.date) || (k && x.date < h[k - 1].date))) histProblems.push(i.code + ': fechas fuera de orden');
      if (h[h.length - 1].status !== i.status) histProblems.push(i.code + ': el último estado del historial no es el actual');
      if (h.some((x) => x.date > CUT)) histProblems.push(i.code + ': historial posterior al corte');
      if (h.some((x) => x.status !== 'backlog' && !st.columns.some((c) => c.id === x.status))) histProblems.push(i.code + ': estado desconocido');
      const done = PM.agile.isDone(st, i);
      if (done !== !!i.doneDate || (done && h[h.length - 1].date !== i.doneDate)) histProblems.push(i.code + ': fecha de terminación incoherente');
      if (i.sprintId) {
        const s = sprintById.get(i.sprintId);
        if (!s) { histProblems.push(i.code + ': iteración inexistente'); continue; }
        if (done && !(i.doneDate >= s.start && i.doneDate <= s.end && cal.isWork(i.doneDate))) histProblems.push(i.code + ': terminado fuera de su iteración');
        if (s.status === 'planeado' && i.status !== 'por-hacer') histProblems.push(i.code + ': iteración planeada con trabajo iniciado');
        if (i.sprintAddedDate && !(i.sprintAddedDate > s.start && i.sprintAddedDate <= CUT && s.status === 'en-curso')) histProblems.push(i.code + ': ingreso a la iteración incoherente');
        if (s.status === 'cerrado' && !done) histProblems.push(i.code + ': iteración cerrada con trabajo sin terminar');
      } else if (i.status !== 'backlog' && i.type !== 'epica') histProblems.push(i.code + ': en el tablero sin iteración');
    }
    ok(!histProblems.length, 'historial de estados coherente con las iteraciones y el corte', histProblems.slice(0, 8));
    /* comprometido y terminado de cada iteración cerrada = sus elementos */
    const est = (list) => list.reduce((s, i) => s + PM.agile.estimate(i), 0);
    const sprintProblems = [];
    for (const s of sprints) {
      const list = countable.filter((i) => i.sprintId === s.id);
      if (s.status === 'cerrado') {
        const unfinished = (s.unfinished || []).map((u) => byId.get(u.id));
        if (unfinished.some((u) => !u)) sprintProblems.push(s.name + ': elemento no terminado inexistente');
        if (s.completed !== est(list.filter((i) => PM.agile.isDone(st, i)))) sprintProblems.push(s.name + ': terminado ' + s.completed + ' ≠ ' + est(list));
        if (s.committed !== s.completed + est(unfinished.filter(Boolean))) sprintProblems.push(s.name + ': comprometido incoherente');
        if (unfinished.some((u) => u && sprintById.get(u.sprintId).start <= s.start)) sprintProblems.push(s.name + ': lo no terminado no pasó a una iteración posterior');
      } else if (s.status === 'en-curso') {
        if (s.committed !== est(list.filter((i) => !i.sprintAddedDate))) sprintProblems.push(s.name + ': compromiso ≠ elementos al iniciar');
      } else if (s.committed !== null || s.completed !== null) sprintProblems.push(s.name + ': planeada con compromiso');
    }
    ok(!sprintProblems.length, 'comprometido y terminado de cada iteración iguales a sus elementos (los no terminados pasan a la siguiente)', sprintProblems);

    /* ---------------- métricas con datos */
    const prog = PM.calc.releaseProgress({ release: rel, items, settings: st });
    ok(prog.total === 232 && prog.done === 150 && prog.count >= 35, 'avance del release: 150 de 232 puntos', prog);
    const vel = PM.calc.velocity({ sprints, items, settings: st });
    ok(vel.closed === 8 && Math.abs(vel.avg3 - 56 / 3) < 1e-9 && vel.min3 === 16 && vel.max3 === 21, 'velocidad: 8 iteraciones cerradas, promedio de las últimas tres 18,7 pts (16 a 21)', vel);
    const bu = PM.calc.releaseBurnup({ release: rel, sprints, items, settings: st, statusDate: CUT });
    ok(bu.baselinePoints === 213 && bu.points[0].scope === 213 && bu.points.filter((p) => !p.future).length === 9 && bu.points.filter((p) => !p.future).every((p, k, arr) => !k || (p.scope >= arr[k - 1].scope && p.done >= arr[k - 1].done)), 'burnup: alcance inicial = línea base (213) y alcance y terminado crecientes en las 8 iteraciones cerradas', bu.points);
    const vr = PM.calc.releaseVariance({ release: rel, items, settings: st });
    ok(vr.hasBaseline && vr.scopePct > 0.05 && vr.scopePct <= 0.1 && vr.dateChange === 0 && vr.budgetChange === 0 && !vr.needsChangeControl, 'crecimiento de alcance dentro del umbral (+8,9 %) sin cambio de fecha ni presupuesto: no requiere solicitud de cambio', vr);
    const added = inRel.filter((i) => i.createdAt > rel.baseline.date);
    ok(added.length === 5 && est(added) === prog.total - rel.baseline.points, 'el crecimiento son los elementos agregados después de la línea base', added.map((i) => i.code));
    const fc = PM.calc.releaseForecast({ release: rel, sprints, items, settings: st, cal, statusDate: CUT });
    ok(fc.finish === '2027-01-19' && fc.sprintsNeeded === 5 && fc.finishBest === rel.end, 'pronóstico: 5 iteraciones más; fin probable el 19 de enero de 2027 (optimista en la fecha planeada)', fc);
    const ac = PM.agile.releaseActualCost(rel, cA, tree, CUT);
    const digitalSum = Object.values(F.digital).reduce((a, b) => a + b, 0);
    ok(ac === digitalSum && ac === tagged.reduce((s, a) => s + a.amount, 0), 'costo real del release = parte digital marcada de C02 (COP 164,9 M)', [ac, digitalSum]);
    const rc = PM.agile.releaseCosts(agile.releases, cA, tree, CUT);
    ok(rc.total === ac && rc.shared.length === 0, 'costos de los releases sin registros compartidos');
    const ev = PM.calc.agileEvm({ release: rel, sprints, items, settings: st, actualCost: ac, statusDate: CUT });
    ok(ev.sprintsElapsed === 8 && ev.plannedSprints === 12 && ev.spi > 0.9 && ev.spi < 1 && ev.cpi > 0.9 && ev.cpi < 1 && ev.eac > rel.budget, 'AgileEVM: 8 de 12 iteraciones, SPI y CPI entre 0,9 y 1 (atrasado y sobre el presupuesto)', { spi: ev.spi, cpi: ev.cpi, eac: ev.eac });
    out.info.agileEvm = { pv: ev.pv, ev: ev.ev, ac: ev.ac, spi: ev.spi, cpi: ev.cpi, eac: ev.eac };
    const cur = sprints.find((s) => s.status === 'en-curso');
    const bd = PM.calc.sprintBurndown({ sprint: cur, items, settings: st, cal, statusDate: CUT });
    const past = bd.days.filter((d) => d.remaining !== null);
    ok(bd.committed === cur.committed && bd.total > bd.committed && bd.done > 0 && past.length > 5 && bd.days.some((d) => d.remaining === null), 'burndown de la iteración en curso con datos hasta el corte y alcance agregado (CC-004)', { total: bd.total, done: bd.done, committed: bd.committed });
    const cfd = PM.calc.cfd({ items, settings: st, from: rel.start, to: CUT });
    const lastCfd = cfd[cfd.length - 1];
    ok(cfd.length > 20 && lastCfd.terminado === countable.filter((i) => PM.agile.isDone(st, i) && i.doneDate <= lastCfd.date).length && lastCfd['en-curso'] > 0, 'flujo acumulado con datos desde el inicio del release', { n: cfd.length, last: lastCfd });
    const wip = PM.agile.wipStatus(st, items);
    ok(!wip.some((w) => w.over) && wip.find((w) => w.id === 'en-produccion').count > 0 && wip.find((w) => w.id === 'aprobacion').count > 0, 'trabajo en curso dentro de los límites WIP', wip.map((w) => w.name + ' ' + w.count + '/' + (w.wip || '∞')));
    ok(items.filter((i) => i.blocked).length === 1 && items.filter((i) => i.blocked).every((i) => i.blockedReason && i.status === 'en-produccion' && i.sprintId === cur.id), 'un elemento bloqueado con su causa en la iteración en curso');

    /* ---------------- RACI */
    const raci = tool(data, 'raci'), raciB = tool(base, 'raci');
    const ag = raci.rows.filter((r) => /^rc-ag-/.test(r.id));
    ok(F.raciRoles.every((r) => raci.roles.some((x) => x.id === r.id && x.name === r.name)) && raciB.roles.every((r) => raci.roles.some((x) => x.id === r.id && x.name === r.name)), 'roles existentes más los tres roles ágiles');
    const slug = (s) => PM.slug(s);
    ok(slug(F.raciRoles[0].name).startsWith('dueno-del-producto') && /(^|-)scrum-master(-|$)/.test(slug(F.raciRoles[1].name)) && slug(F.raciRoles[2].name).startsWith('equipo-de-desarrollo') && /gerente comercial/.test(F.raciRoles[0].name) && /coordinador de mercadeo digital/.test(F.raciRoles[1].name) && /agencia digital y analista de CRM/.test(F.raciRoles[2].name), 'roles ágiles reconocibles por la vista RACI y mapeados a los roles del ejemplo');
    ok(ag.length === 10 && ag.every((r) => r.wbsId === 'w142') && F.raciEvents.every((n) => ag.some((r) => r.activity === n)), 'diez filas de eventos ágiles del paquete 1.4.2', ag.map((r) => r.activity));
    ok(ag.every((r) => Object.values(r.cells).filter((v) => v === 'A' || v === 'RA').length === 1 && Object.values(r.cells).some((v) => v === 'R' || v === 'RA') && Object.keys(r.cells).every((k) => raci.roles.some((x) => x.id === k))), 'eventos con exactamente una A, al menos una R y roles existentes');
    ok(raciB.rows.every((r) => { const n = raci.rows.find((x) => x.id === r.id); if (!n) return false; if (r.wbsId !== 'w142') return same(n, r); return Object.entries(r.cells).every(([k, v]) => n.cells[k] === v) && n.cells['rol-dt'] === 'R'; }), 'filas existentes sin cambios (en 1.4.2 solo se agrega el equipo)');
    const iW = raci.rows.findIndex((r) => r.wbsId === 'w142' && !/^rc-ag-/.test(r.id));
    ok(raci.rows.slice(iW + 1, iW + 11).every((r) => /^rc-ag-/.test(r.id)), 'los eventos ágiles quedan después de la fila de 1.4.2');

    /* ---------------- 3) documentos ágiles */
    const src = PM.exampleDocs.medellin;
    const AG = ['vision-producto', 'definicion-terminado', 'plan-release', 'planificacion-sprint', 'acta-revision-sprint', 'retrospectiva'];
    ok(AG.every((k) => PM.templates[k] && PM.templates[k].agile && src[k]), 'entradas de las seis plantillas ágiles en PM.exampleDocs.medellin');
    const docs = data.collections.docs;
    const docIds = new Set(docs.map((d) => d.id));
    const fieldsOf = (t) => { const m = new Map(); for (const s of t.sections) for (const f of s.fields) m.set(f.key, f); return m; };
    const optVals = (o) => (o || []).map((x) => String(typeof x === 'object' ? x.value : x));
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && D.valid(v);
    const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|TODO/;
    /* hechos con la fecha en que se conocieron: un documento aprobado no los cita antes */
    const FACTS = [['CC-003', '2026-05-12'], ['CC-004', '2026-09-21'], ['CC-005', '2026-09-28'], ['INC-004', '2026-05-07'], ['INC-005', '2026-08-12'], ['INC-006', '2026-07-20'], ['INC-007', '2026-09-15'], ['R-014', '2026-08-01'], ...items.map((i) => [i.code, i.createdAt])];
    const problems = [];
    const p = (id, m) => problems.push(id + ': ' + m);
    const checkFields = (id, t, fields) => {
      const defs = fieldsOf(t);
      for (const [k, v] of Object.entries(fields)) {
        const f = defs.get(k);
        if (!f) { p(id, 'clave desconocida ' + k); continue; }
        if (v === null || v === undefined || v === '') continue;
        if (f.type === 'text' || f.type === 'textarea') { if (typeof v !== 'string' || BAD.test(v)) p(id, k + ' texto inválido'); }
        else if (f.type === 'number') { if (typeof v !== 'number' || !Number.isFinite(v) || (f.min !== undefined && v < f.min) || (f.max !== undefined && v > f.max)) p(id, k + ' número inválido'); }
        else if (f.type === 'date') { if (!isDate(v)) p(id, k + ' fecha inválida'); }
        else if (f.type === 'select') { if (!optVals(f.options).includes(String(v))) p(id, k + ' fuera de las opciones: ' + v); }
        else if (f.type === 'list') { if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string' || !x.trim() || BAD.test(x))) p(id, k + ' lista inválida'); }
        else if (f.type === 'table') {
          if (!Array.isArray(v) || !v.length) { p(id, k + ' tabla vacía'); continue; }
          const cols = new Map(f.columns.map((c) => [c.key, c]));
          const seen = new Set();
          v.forEach((row, i) => {
            if (!row.id || seen.has(row.id)) p(id, k + '[' + i + '] sin id único'); seen.add(row.id);
            for (const [ck, cv] of Object.entries(row)) {
              if (ck === 'id') continue;
              const c = cols.get(ck);
              if (!c) { p(id, k + '[' + i + '] columna desconocida ' + ck); continue; }
              if (c.type === 'calc') { p(id, k + '[' + i + '] guarda la columna calculada ' + ck); continue; }
              if (cv === null || cv === undefined || cv === '') continue;
              if ((c.type === 'number' || c.type === 'money') && (typeof cv !== 'number' || !Number.isFinite(cv))) p(id, k + '.' + ck + ' número inválido');
              if (c.type === 'date' && !isDate(cv)) p(id, k + '.' + ck + ' fecha inválida');
              if (c.type === 'select' && !optVals(c.options).includes(String(cv))) p(id, k + '.' + ck + ' fuera de las opciones: ' + cv);
              if ((c.type === 'text' || c.type === 'textarea') && (typeof cv !== 'string' || BAD.test(cv))) p(id, k + '.' + ck + ' texto inválido');
            }
            for (const c of f.columns) if (c.type === 'calc') { try { const x = c.calc(row, v, { currency: 'COP', rows: v, index: i }); if (typeof x === 'number' && !Number.isFinite(x)) p(id, k + '.' + c.key + ' cálculo inválido'); } catch (e) { p(id, k + '.' + c.key + ' cálculo falla'); } }
          });
        }
      }
      const req = [...defs.values()].filter((f) => f.required && (fields[f.key] === undefined || fields[f.key] === '' || (Array.isArray(fields[f.key]) && !fields[f.key].length)));
      if (req.length) p(id, 'faltan campos obligatorios: ' + req.map((f) => f.key).join(', '));
    };
    const anachro = (id, date, fields) => { const s = JSON.stringify(fields); for (const [tok, d] of FACTS) if (d > date && s.includes(tok)) p(id, 'aprobado el ' + date + ' cita ' + tok + ' (' + d + ')'); };
    let nDocs = 0;
    for (const k of AG) {
      const t = PM.templates[k], e = src[k];
      const list = t.multiple ? e.instances.map((x) => ({ id: k + '--' + x.key, e: x })) : [{ id: k, e }];
      for (const { id, e: x } of list) {
        nDocs++;
        if (!docIds.has(id)) p(id, 'no se creó en el proyecto');
        if (!['aprobado', 'revision', 'borrador'].includes(x.status) || !isDate(x.date) || x.date > CUT) p(id, 'estado o fecha inválidos');
        if (x.status === 'aprobado' && !/^\d+$/.test(x.rev)) p(id, 'aprobado sin revisión numérica');
        if (x.titleBlock && x.titleBlock.elaboro && x.titleBlock.elaboro === x.titleBlock.aprobo) p(id, 'lo elabora y lo aprueba el mismo rol');
        checkFields(id, t, x.fields);
        if (x.status === 'aprobado') anachro(id, x.date, x.fields);
        let prev = '';
        for (const r of x.revs || []) {
          if (!isDate(r.date) || r.date < prev || r.date > x.date) p(id, 'revisión ' + r.rev + ' fuera de orden'); prev = r.date;
          if (r.fields) { checkFields(id + '#' + r.rev, t, r.fields); anachro(id + '#' + r.rev, r.date, r.fields); }
        }
        if (x.revs && x.status === 'aprobado') { const last = x.revs[x.revs.length - 1]; if (last.rev !== x.rev || last.date !== x.date) p(id, 'la última revisión no es la vigente'); }
      }
    }
    ok(!problems.length, 'documentos ágiles conformes con sus plantillas, sin hechos posteriores a su fecha (' + nDocs + ' documentos)', problems.slice(0, 12));
    const s8 = sprints[7], s9 = sprints[8];
    ok(same(Object.keys(s8.docs).sort(), ['planificacion', 'retrospectiva', 'revision']) && Object.values(s8.docs).every((id) => docIds.has(id)) && Object.values(s9.docs).every((id) => docIds.has(id)), 'la iteración 8 (última cerrada) enlaza su planificación, revisión y retrospectiva; la 9, su planificación', [s8.docs, s9.docs]);
    const docOf = (id) => docs.find((d) => d.id === id).data.fields;
    const pl8 = docOf(s8.docs.planificacion), rv8 = docOf(s8.docs.revision), rt8 = docOf(s8.docs.retrospectiva), pl9 = docOf(s9.docs.planificacion);
    ok(pl8.iteracion === s8.name && pl8.fechaInicio === s8.start && pl8.fechaFin === s8.end && pl8.compromiso === s8.committed && pl8.capacidad === s8.capacity && est(pl8.elementos.map((r) => ({ estimate: r.estimacion }))) === s8.committed, 'planificación de la iteración 8 coherente con la iteración (fechas, capacidad y compromiso)');
    ok(pl9.compromiso === s9.committed && pl9.fechaInicio === s9.start && pl9.elementos.every((r) => byId.get('bl-' + r.codigo.toLowerCase()).sprintId === s9.id), 'planificación de la iteración 9 con los elementos comprometidos');
    ok(rv8.comprometido === s8.committed && rv8.terminado === s8.completed && rv8.fecha === s8.end && rv8.elementos.every((r) => { const it = byId.get('bl-' + r.codigo.toLowerCase()); return it.sprintId === s8.id && (r.resultado === 'Aceptado') === PM.agile.isDone(st, it); }), 'revisión de la iteración 8 con lo comprometido, lo terminado y el resultado de cada elemento');
    ok(/229 puntos frente a 213/.test(rv8.cambiosBacklog) && /nivel 1/.test(rv8.cambiosBacklog) && /19 de enero de 2027/.test(rv8.estadoRelease), 'la revisión explica el crecimiento dentro del umbral (nivel 1) y el pronóstico del release');
    ok(rt8.fecha === s8.end && rt8.lecciones.length >= 1 && rt8.acciones.length >= 1, 'retrospectiva de la iteración 8 con acciones y lecciones');
    const reg = docs.find((d) => d.id === 'registro-lecciones').data.fields.lecciones;
    ok(rt8.lecciones.every((l) => reg.some((r) => r.situacion === l.situacion && r.recomendacion === l.recomendacion && r.impacto === l.impacto && r.area === 'Integración' && r.fecha === s8.end && r.registradoPor === 'Retrospectiva ' + s8.name && /^LA-\d{2}$/.test(r.id))), 'lecciones de la retrospectiva enviadas al registro de lecciones aprendidas (como «Enviar a lecciones aprendidas»)');
    /* (las lecciones se agregan al cargar 96, en PM.exampleDocs: también están en la versión sin la capa del constructor) */
    const fromRetro = reg.filter((r) => /^Retrospectiva /.test(r.registradoPor));
    const nums = reg.map((r) => Number(r.id.slice(3)));
    ok(fromRetro.length === rt8.lecciones.length && reg.slice(-fromRetro.length).every((r) => fromRetro.includes(r)) && nums.every((n, i) => n === i + 1), 'el registro conserva sus lecciones (LA-01 a LA-10) y agrega al final solo las de la retrospectiva, con códigos consecutivos', reg.map((r) => r.id + ' ' + r.registradoPor));
    const pr = docOf('plan-release'), prRow = pr.releases[0];
    ok(pr.duracionIteracion === st.sprintLength && pr.unidadEstimacion === 'Puntos de historia' && prRow.release === rel.name && prRow.fechaInicio === rel.start && prRow.fechaFin === rel.end && prRow.iteraciones === rel.plannedSprints && prRow.puntos === rel.baseline.points && prRow.presupuesto === rel.budget, 'plan de releases coherente con el release y su línea base');
    ok(pr.supuestos.some((x) => /no se vincula a una actividad del cronograma/.test(x) && /nivel de esfuerzo/.test(x)), 'el plan de releases explica por qué el release no se vincula a una actividad');
    const dlt = docOf('definicion-terminado');
    ok(dlt.columnasTablero.map((r) => r.columna + '|' + (r.wip || '')).join(';') === st.columns.map((c) => c.name + '|' + (c.wip || '')).join(';'), 'definición de terminado con las columnas y límites WIP del tablero');
    ok(dlt.definicionTerminado.some((x) => /aprobación legal del abogado del proyecto/.test(x)) && dlt.definicionTerminado.some((x) => /Ley 1480 de 2011/.test(x)) && dlt.definicionTerminado.some((x) => /Ley 1581 de 2012/.test(x)), 'definición de terminado con aprobación legal de piezas, Ley 1480 y Ley 1581');
    ok(/Gerente comercial/.test(docOf('vision-producto').duenoProducto), 'visión del producto con el gerente comercial como dueño del producto');

    /* ---------------- textos del enfoque híbrido (92 y 93) */
    const pd = src['plan-direccion'];
    const rev0 = pd.revs.find((r) => r.rev === '0').fields;
    ok(pd.fields.cicloVida === 'Híbrido' && /adaptativo/.test(pd.fields.enfoqueDesarrollo) && /1\.4\.2/.test(pd.fields.enfoqueDesarrollo) && /nivel de esfuerzo/.test(pd.fields.enfoqueDesarrollo), 'plan para la dirección rev. 1: ciclo de vida híbrido con el paquete 1.4.2 adaptativo');
    ok(rev0.cicloVida === 'Predictivo' && !/adaptativo|ágil/i.test(JSON.stringify(rev0)), 'plan para la dirección rev. 0 (LB0, 2025): predictivo, sin el enfoque adaptativo posterior');
    ok(/10 de febrero de 2026/.test(pd.fields.enfoqueDesarrollo) && '2026-02-10' < pd.date && pd.date === '2026-03-13', 'la decisión de la junta (10 de febrero de 2026) es anterior a la rev. 1 del plan (13 de marzo de 2026)');
    const com = src['registro-comunicaciones'].fields.comunicaciones;
    const dec = com.find((c) => c.fecha === '2026-02-10');
    ok(dec && /enfoque adaptativo/.test(dec.asunto) && /1\.4\.2/.test(dec.asunto) && com.every((c, i) => c.id === 'COM-' + String(i + 1).padStart(3, '0')) && com.every((c, i) => !i || c.fecha >= com[i - 1].fecha), 'registro de comunicaciones: decisión de la junta del 10 de febrero de 2026, en orden y con códigos consecutivos', dec);
    const arranque = src['acta-reunion'].instances.find((x) => x.key === 'ej1').fields.decisiones;
    ok(arranque.some((d) => /ciclo de vida predictivo por etapas/.test(d.decision)), 'el acta de arranque (enero de 2025) conserva la decisión predictiva de su fecha');
    out.info.docs = docs.length;
    out.info.items = items.length;
    return out;
  }, EXPECT);
}

/* ------------------------------------------------------------------ ejecución */
section('Valor ganado idéntico, capa ágil y documentos');
{
  const { browser, page, errors } = await openApp({ file });
  try {
    const res = await validateData(page);
    report(res);
    if (res.info.evm) console.log(`  Proyecto: PV ${(res.info.evm.pv / 1e6).toFixed(0)} M · EV ${(res.info.evm.ev / 1e6).toFixed(0)} M · AC ${(res.info.evm.ac / 1e6).toFixed(0)} M · SPI ${res.info.evm.spi.toFixed(3)} · CPI ${res.info.evm.cpi.toFixed(3)}`);
    if (res.info.agileEvm) console.log(`  Release: PV ${(res.info.agileEvm.pv / 1e6).toFixed(1)} M · EV ${(res.info.agileEvm.ev / 1e6).toFixed(1)} M · AC ${(res.info.agileEvm.ac / 1e6).toFixed(1)} M · SPI ${res.info.agileEvm.spi.toFixed(3)} · CPI ${res.info.agileEvm.cpi.toFixed(3)} · ${res.info.items} elementos · ${res.info.docs} documentos`);
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
}

for (const [label, opts] of [['escritorio (1360 px)', { width: 1360, height: 900 }], ['móvil oscuro (400 px)', { width: 400, height: 860, dark: true }]]) {
  section('Vistas con el ejemplo híbrido — ' + label);
  const before = { passes, failures };
  const { browser, page, errors } = await openApp({ file, ...opts });
  try {
    const pid = await page.evaluate(() => PM.createExampleProject('medellin'));
    check(!!pid, 'ejemplo creado');
    await page.waitForTimeout(700);
    const stored = await page.evaluate(async () => {
      const pid = PM.getState().projectId;
      const p = await PM.store.get(PM.paths.project(pid));
      const backlog = await PM.store.list(PM.paths.backlog(pid));
      const agile = await PM.store.get(PM.paths.tool(pid, 'agile'));
      const menu = PM.views.filter((v) => v.group === 'agil' && (!v.when || v.when(p))).map((v) => v.id);
      return { lifecycle: p.lifecycle, backlog: backlog.length, releases: agile && agile.releases.length, sprints: agile && agile.sprints.length, menu };
    });
    check(stored.lifecycle === 'Híbrido' && stored.backlog >= 35 && stored.releases === 1 && stored.sprints === 12, 'proyecto importado con backlog, release e iteraciones', stored);
    check(['backlog', 'kanban', 'iteraciones', 'metricas-agiles'].every((v) => stored.menu.includes(v)), 'las vistas ágiles aparecen en el menú', stored.menu);
    const VIEWS = [
      ['backlog', /Canales digitales de venta — etapa 2/],
      ['kanban', /Aprobación comercial y legal/],
      ['iteraciones', /Iteración 9/],
      ['metricas-agiles', /Valor ganado ágil/],
      ['edt', /Mercadeo y publicidad/],
      ['raci', /Dueño del producto \(gerente comercial\)/],
      ['tablero', /Iteración 9/],
    ];
    for (const [id, re] of VIEWS) {
      const n0 = errors.length;
      await gotoView(page, id);
      await page.waitForTimeout(600);
      const txt = await page.$eval('.view-host', (el) => el.innerText);
      const cards = await errorCards(page);
      const ov = await horizontalOverflow(page);
      const fresh = errors.slice(n0);
      check(!cards.length && !fresh.length && ov <= 1 && re.test(txt) && !/\bundefined\b|\bNaN\b|\[object Object\]/.test(txt), 'vista ' + id + ' con datos, sin errores ni desborde' + (ov > 1 ? ' (desborde ' + ov + ' px)' : ''), { cards, fresh: fresh.slice(0, 2), match: re.test(txt) });
      if (shots) await page.screenshot({ path: join(shots, 'agil-' + id + (opts.width < 900 ? '-m' : '') + '.png'), fullPage: true });
    }
    /* valor ganado ágil del release frente al del proyecto */
    {
      const n0 = errors.length;
      await page.evaluate(() => PM.navigate('valor-ganado', { tab: 'agil' }));
      await page.waitForTimeout(700);
      const txt = await page.$eval('.view-host', (el) => el.innerText);
      check(/Canales digitales de venta — etapa 2/.test(txt) && !(await errorCards(page)).length && errors.length === n0 && (await horizontalOverflow(page)) <= 1, 'pestaña «Valor ganado ágil» con el release, sin errores');
      if (shots) await page.screenshot({ path: join(shots, 'agil-valor-ganado' + (opts.width < 900 ? '-m' : '') + '.png'), fullPage: true });
    }
    /* documentos ágiles en el editor */
    for (const docId of ['vision-producto', 'definicion-terminado', 'plan-release', 'planificacion-sprint--it8', 'acta-revision-sprint--it8', 'retrospectiva--it8', 'planificacion-sprint--it9']) {
      const n0 = errors.length;
      await page.evaluate((id) => PM.openDocument(id), docId);
      try { await page.waitForSelector(`.page[data-doc-id="${docId}"] .title-block`, { timeout: 8000 }); } catch (e) { check(false, docId + ': el editor no abrió'); continue; }
      await page.waitForTimeout(250);
      const txt = await page.$eval('.view-host', (el) => el.innerText);
      check(!(await errorCards(page)).length && errors.length === n0 && txt.length > 800 && !/\bundefined\b|\bNaN\b|\[object Object\]/.test(txt) && (await horizontalOverflow(page)) <= 1, 'documento ' + docId + ' abre en el editor con su contenido');
    }
    /* la vista RACI reconoce los roles y los eventos ágiles del ejemplo (no ofrece duplicarlos) */
    if (opts.width >= 900) {
      await gotoView(page, 'raci');
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Agregar eventos ágiles' }).first().click();
      await page.waitForSelector('[data-role="agile-events"]', { timeout: 5000 });
      const modal = await page.$eval('[data-role="agile-events"]', (el) => el.innerText);
      check(/Todos los eventos ágiles ya están en la matriz/.test(modal) && !/También se agregarán los roles ágiles/.test(modal), 'RACI: los eventos y roles ágiles del ejemplo se reconocen como presentes', modal.slice(0, 300));
      await page.keyboard.press('Escape');
    }
    check(errors.length === 0, 'sin errores de consola', errors.slice(0, 3));
  } finally { await browser.close(); }
  console.log(`  ${passes - before.passes}/${passes - before.passes + failures - before.failures} verificaciones`);
}

console.log(`\n${failures ? 'FALLÓ' : 'OK'}: ${passes} verificaciones correctas, ${failures} fallidas.`);
process.exit(failures ? 1 : 0);

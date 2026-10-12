// Prueba del proyecto de ejemplo ágil «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
// (src/94-example-erp.js y src/95-example-erp-docs.js, SPEC §9.7).
// Uso: node test/example-erp.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye núcleo + módulos de vistas y plantillas + 94 y 95 (sin los otros ejemplos).
//   1) Constructor, importación y estructura: EDT con enfoques, cronograma, releases, iteraciones, backlog, costos, RACI.
//   2) Cifras de los documentos frente a los cálculos de la aplicación (PM.calc.*, PM.agile.*), con datos leídos del almacenamiento,
//      y cifras y referencias de docs/ejemplo-erp/supuestos-y-fuentes.md. Cada iteración cerrada (1 a 6) tiene acta de revisión
//      y retrospectiva vinculadas, y toda cita a una revisión o retrospectiva (backlog y documentos) tiene su acta.
//   3) Vistas: crea el ejemplo con el selector, revisa métricas ágiles (burndown, burnup, velocidad 31/32/30/26, AgileEVM),
//      tablero Kanban (WIP y bloqueado), curva S con el avance de los releases y recorre todas las vistas sin tarjetas de error.
//   4) Sin --quick: tema oscuro y 400 px en las vistas ágiles y el tablero (sin desborde de página).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openApp, createExample, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const quick = args.includes('--quick');
const shots = opt('--shots');
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-example-erp-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '10,12,13,14,20,30,40,45,46,50,60,70,80,94,95'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 500) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
/* textos de la pantalla con espacios normales (los formatos usan espacios de no separación) */
const norm = (s) => String(s).replace(/[\u00a0\u202f]/g, ' ');

/* ============================================================== 1 y 2: datos y documentos (en la página) */
async function validateInPage(page) {
  return page.evaluate(async () => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, F = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const round1 = (v) => Math.round(v * 10) / 10;
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);

    /* ---------- constructor */
    const exm = PM.getExample('erp');
    ok(exm && exm.icon === 'sprint' && /ERP/.test(exm.name) && Array.isArray(exm.summary), 'ejemplo «erp» registrado con icono sprint', exm && { id: exm.id, icon: exm.icon });
    if (!exm) return out;
    const ex = exm.build({ today: D.today() });
    const ex2 = exm.build({ today: '2030-01-01' });
    ok(JSON.stringify(ex) === JSON.stringify(ex2), 'el constructor es determinista (no depende de hoy ni de valores aleatorios)');
    ok(ex.format === 'gestor-pmbok' && ex.version === 1 && ['docs', 'tools', 'baselines', 'flows', 'backlog'].every((k) => Array.isArray(ex.collections[k])), 'formato de exportación con docs, tools, baselines, flows y backlog');
    const sizes = [];
    for (const [name, list] of Object.entries(ex.collections)) for (const it of list) { sizes.push([name + '/' + it.id, new TextEncoder().encode(JSON.stringify(it.data)).length]); for (const r of it.revs || []) sizes.push([name + '/' + it.id + '/revs/' + r.id, new TextEncoder().encode(JSON.stringify(r.data)).length]); }
    ok(sizes.every(([, n]) => n <= 256 * 1024), 'cada documento pesa máximo 256 KiB', sizes.filter(([, n]) => n > 256 * 1024));

    /* ---------- importación y lectura del almacenamiento */
    const pid = await PM.projectOps.importData(ex);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    const expectMeta = { name: 'EJEMPLO · Implementación del ERP de Ingeniería y Alquiler', code: 'PRY-2026-021', sponsor: 'Gerencia General', start: '2026-05-04', end: '2027-01-29', statusDate: '2026-10-09', currency: 'COP', status: 'En ejecución', lifecycle: 'Adaptativo (ágil)' };
    for (const [k, v] of Object.entries(expectMeta)) ok(meta && meta[k] === v, 'metadato ' + k, meta && meta[k]);
    ok(A.mode(meta) === 'adaptativo' && A.enabled(meta), 'ciclo de vida adaptativo: capa ágil activa');
    ok(/Bogotá/.test(meta.location) && /ejemplo/i.test(meta.description) && /ficticio/.test(meta.description), 'ubicación y descripción identificadas como ejemplo');
    const wbs = await P('/tools/wbs'), schedule = await P('/tools/schedule'), costs = await P('/tools/costs'), raci = await P('/tools/raci'), agile = await P('/tools/agile');
    const items = (await PM.store.list(PM.paths.backlog(pid))).map((d) => ({ ...d.data, id: d.id }));
    const docs = await PM.store.list(PM.paths.docs(pid));
    const docOf = (id) => { const d = docs.find((x) => x.id === id); return d ? d.data : null; };
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    ok(wbs && schedule && costs && raci && agile && items.length && docs.length && blDocs.length, 'herramientas, backlog, documentos y líneas base guardados');

    /* ---------- modelo calculado igual que PM.useProjectModel / PM.useAgileModel */
    const st = A.settings(agile);
    const tree = C.wbsTree(wbs.nodes);
    const eff = A.applyToSchedule(schedule, agile, items);
    const sched = C.computeSchedule(eff, meta.start);
    const fcs = C.computeSchedule(eff, meta.start, meta.statusDate);
    const bls = C.activeBaselines(blDocs);
    const evm = C.evm({ sched, costBaseline: bls.cost, costs, statusDate: meta.statusDate });
    const cut = meta.statusDate;
    const sprints = A.sortSprints(agile.sprints);
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const R1 = rel('rel-1'), R2 = rel('rel-2'), R3 = rel('rel-3');
    const prog = (r) => C.releaseProgress({ release: r, items, settings: st });
    const vel = C.velocity({ sprints, items, settings: st });

    /* ---------- EDT: entregables predictivos y releases adaptativos */
    const ap = C.wbsApproach(tree, meta);
    const l1 = wbs.nodes.filter((n) => !n.parentId);
    ok(l1.length === 9 && wbs.nodes.length >= 25 && wbs.nodes.length <= 40, 'EDT con 9 entregables de nivel 1 y unas 30 partidas', [l1.length, wbs.nodes.length]);
    ok(['w2', 'w3', 'w4', 'w5'].every((id) => tree.byId.get(id).approach === 'predictivo') && /Selección y contratación/.test(tree.byId.get('w2').name) && /Infraestructura y licenciamiento/.test(tree.byId.get('w3').name) && /Migración de datos/.test(tree.byId.get('w4').name) && /Capacitación/.test(tree.byId.get('w5').name), 'selección, infraestructura, migración y capacitación son predictivos explícitos');
    ok(['w6', 'w7', 'w8'].every((id) => ap.get(id) === 'adaptativo' && tree.leaves.has(id)), 'los tres releases son entregables adaptativos (hojas de la EDT)');
    ok(ap.get('w1') === 'adaptativo' && ap.get('w21') === 'predictivo' && ap.get('w43') === 'predictivo', 'enfoque heredado: gestión adaptativa por el proyecto; paquetes predictivos por su entregable', [ap.get('w1'), ap.get('w21'), ap.get('w43')]);
    const NK = ['id', 'parentId', 'name', 'order', 'description', 'responsible', 'deliverable', 'acceptance', 'costEstimate', 'notes', 'kind'];
    ok(wbs.nodes.every((n) => NK.every((k) => k in n) && n.description.length > 20 && n.deliverable && n.acceptance), 'diccionario de la EDT completo');

    /* ---------- cronograma */
    const tasks = schedule.tasks;
    ok(schedule.settings.workweek === 5 && schedule.settings.holidaysCO === true, 'calendario L-V con festivos de Colombia');
    ok(sched.errors.length === 0 && sched.start === '2026-05-04' && sched.finish === '2027-01-29', 'CPM sin errores: 4 de mayo de 2026 a 29 de enero de 2027', [sched.errors, sched.start, sched.finish]);
    const tids = new Set(tasks.map((t) => t.id));
    ok(tasks.every((t) => t.wbsId && tree.leaves.has(t.wbsId) && t.deps.every((d) => tids.has(d.id))), 'actividades en paquetes de trabajo y dependencias válidas');
    const links = A.linksOf(tasks, agile);
    ok(links.size === 3 && links.get('t25') === R1 && links.get('t26') === R2 && links.get('t27') === R3, 'cada release vinculado a su actividad (release.taskId y task.releaseId)', [...links.keys()]);
    ok([R1, R2, R3].every((r) => tasks.find((t) => t.id === r.taskId).releaseId === r.id && tasks.find((t) => t.id === r.taskId).wbsId === r.wbsId), 'actividad y entregable de la EDT de cada release coinciden');
    ok([['t25', '2026-07-13', '2026-09-09'], ['t26', '2026-09-10', '2026-11-06'], ['t27', '2026-11-09', '2026-12-22']].every(([id, s, f]) => { const t = C.computeSchedule({ ...schedule, tasks: tasks.map((x) => ({ ...x, progress: 0, actualStart: null, actualFinish: null })) }, meta.start).byId.get(id); return t.startDate === s && t.finishDate === f; }), 'fechas planificadas de los releases = fechas de los releases');
    ok(tasks.filter((t) => t.progress > 0).every((t) => t.actualStart && t.actualStart <= cut) && tasks.every((t) => !t.actualFinish || t.actualFinish <= cut), 'avance y fechas reales solo hasta el corte');

    /* ---------- configuración ágil, releases e iteraciones */
    ok(st.framework === 'scrum-kanban' && st.estimationUnit === 'puntos' && st.sprintLength === 10 && st.scopeChangeThreshold === 10, 'Scrum con Kanban, puntos, 10 días hábiles, umbral 10 %');
    const uat = st.columns.find((c) => c.id === 'pruebas-usuario');
    ok(st.columns.length === 5 && uat && uat.name === 'Pruebas de usuario' && uat.category === 'en-curso' && A.wipLimit(uat) === 2 && PM.AGILE.DEFAULT_COLUMNS.every((d) => st.columns.some((c) => c.id === d.id && c.name === d.name && (c.wip ?? null) === d.wip)), 'columnas por defecto más «Pruebas de usuario» (en curso, WIP 2)', st.columns.map((c) => c.id));
    ok(agile.releases.length === 3 && sum(agile.releases, (r) => r.budget) === 278e6 && R1.budget === 96e6 && R2.budget === 104e6 && R3.budget === 78e6, 'tres releases con presupuesto de COP 278 millones (96, 104 y 78)');
    ok(R1.status === 'cerrado' && R2.status === 'en-curso' && R3.status === 'planeado' && [R1, R2, R3].map((r) => r.plannedSprints).join() === '4,4,3', 'estados y iteraciones planeadas de los releases');
    ok(A.hasBaseline(R1) && R1.baseline.changeRef === 'CC-001' && R1.baseline.points === 118 && R1.baseline.date === '2026-08-13', 'línea base del release 1 actualizada con el CC-001', R1.baseline);
    ok(A.hasBaseline(R2) && R2.baseline.points === 112 && R2.baseline.changeRef === null && R2.baseline.end === R2.end && R2.baseline.budget === R2.budget, 'línea base del release 2: 112 puntos', R2.baseline);
    ok(!A.hasBaseline(R3), 'release 3 planeado sin línea base');
    const v1 = C.releaseVariance({ release: R1, items, settings: st }), v2 = C.releaseVariance({ release: R2, items, settings: st });
    ok(!v1.needsChangeControl && Math.abs(v2.scopePct - 8 / 112) < 1e-9 && !v2.needsChangeControl, 'release 2 en +7,1 % (nivel 1, sin control formal); release 1 sin variación', [v2.scopePct, v2.needsChangeControl]);
    const cal = sched.cal;
    ok(sprints.length === 11 && sprints.every((s, i) => cal.isWork(s.start) && cal.isWork(s.end) && cal.countWork(s.start, s.end) === 10 && (!i || s.start === cal.addWork(sprints[i - 1].end, 1))), 'once iteraciones encadenadas de 10 días hábiles con festivos de Colombia', sprints.map((s) => s.start + '…' + s.end));
    ok(sprints[0].start === '2026-07-13' && sprints[5].start === '2026-09-24' && sprints[5].end === '2026-10-07' && sprints[6].start === '2026-10-08' && sprints[6].end === '2026-10-22' && sprints[10].end === '2026-12-22', 'fechas de las iteraciones 1, 6, 7 y 11 iguales a las de las plantillas');
    ok(sprints.map((s) => s.status).join() === 'cerrado,cerrado,cerrado,cerrado,cerrado,cerrado,en-curso,planeado,planeado,planeado,planeado', 'iteraciones 1–6 cerradas, 7 en curso y 8–11 planeadas');
    for (const r of [R1, R2, R3]) { const rs = C.sprintsOfRelease(sprints, r.id); ok(rs.length === r.plannedSprints && rs[0].start === r.start && rs[rs.length - 1].end === r.end, 'iteraciones del ' + r.name.split(':')[0] + ' dentro de sus fechas'); }

    /* ---------- backlog */
    const countable = items.filter(A.countable);
    ok(items.length >= 80 && items.length <= 110, 'backlog de 80 a 110 elementos', items.length);
    const types = new Set(items.map((i) => i.type));
    ok(['epica', 'historia', 'tarea', 'defecto', 'mejora', 'investigacion'].every((t) => types.has(t)), 'épicas, historias, tareas, defectos, mejoras e investigaciones');
    ok(new Set(items.map((i) => i.code)).size === items.length, 'códigos únicos');
    const FIB = [1, 2, 3, 5, 8, 13];
    ok(countable.every((i) => i.estimate === null || FIB.includes(i.estimate)), 'estimaciones en Fibonacci');
    ok(countable.filter((i) => i.estimate === null).length >= 3, 'elementos sin estimar para refinamiento', countable.filter((i) => i.estimate === null).map((i) => i.code));
    ok(items.every((i) => PM.AGILE.PRIORITIES.includes(i.priority)), 'prioridades MoSCoW');
    ok(countable.filter((i) => i.estimate !== null).every((i) => String(i.acceptance || '').length > 30), 'criterios de aceptación en todos los elementos estimados');
    ok(items.filter((i) => i.type === 'historia' && i.estimate !== null).every((i) => /^Como /.test(i.description) || /Pedido|Defecto/.test(i.description)), 'historias redactadas «Como … quiero … para …»');
    ok(items.filter((i) => i.type === 'historia').some((i) => /^Dado /.test(i.acceptance)), 'criterios en formato Dado/Cuando/Entonces');
    const epics = new Set(items.filter((i) => i.type === 'epica').map((i) => i.id));
    ok(epics.size === 8 && items.filter((i) => i.epicId).every((i) => epics.has(i.epicId)), 'ocho épicas y elementos agrupados por épica');
    /* numeración consecutiva por tipo en el orden de creación */
    const byPrefix = {};
    for (const i of items) { const m = /^([A-Z]+)-(\d{3})$/.exec(i.code); (byPrefix[m[1]] = byPrefix[m[1]] || []).push([Number(m[2]), i.createdAt]); }
    const mono = Object.entries(byPrefix).filter(([, l]) => { l.sort((a, b) => a[0] - b[0]); return l.some((x, k) => x[0] !== k + 1 || (k && x[1] < l[k - 1][1])); }).map(([p]) => p);
    ok(!mono.length, 'códigos consecutivos por tipo según la fecha de creación', mono);
    /* historial coherente: inicia en el backlog al crearse, fechas no decrecientes hasta el corte, termina en el estado actual */
    const histBad = items.filter((i) => { const h = i.history || []; return !h.length || h[0].date !== i.createdAt || h[0].status !== 'backlog' || h.some((x, k) => (k && x.date < h[k - 1].date) || x.date > cut) || h[h.length - 1].status !== i.status; }).map((i) => i.code);
    ok(!histBad.length, 'historial de estados coherente con las fechas', histBad);
    const doneBad = countable.filter((i) => A.isDone(st, i)).filter((i) => { const s = sprints.find((x) => x.id === i.sprintId); return !D.valid(i.doneDate) || !s || i.doneDate < s.start || i.doneDate > s.end || i.doneDate > cut; }).map((i) => i.code);
    ok(!doneBad.length, 'cada elemento terminado tiene doneDate dentro de su iteración', doneBad);
    ok(countable.filter((i) => !A.isDone(st, i)).every((i) => !i.doneDate), 'los elementos sin terminar no tienen doneDate');
    ok(items.filter((i) => i.releaseId === R2.id && i.createdAt > R2.baseline.date).map((i) => i.code).sort().join() === 'HU-041,ME-009' && items.filter((i) => i.releaseId === R1.id && i.createdAt > '2026-07-10').length === 5, 'elementos agregados después de las líneas base (cambio de alcance)');

    /* ---------- velocidad, burndown y burnup */
    const closed = vel.rows.filter((r) => r.status === 'cerrado');
    ok(closed.map((r) => r.completed).join() === '24,31,31,32,30,26', 'velocidad de las iteraciones 1 a 6: 24, 31, 31, 32, 30 y 26', closed.map((r) => r.completed));
    ok(closed.slice(2).map((r) => r.completed).join() === '31,32,30,26' && Math.abs(vel.avg3 - 88 / 3) < 1e-9, 'iteraciones 3 a 6: 31, 32, 30 y 26; promedio de las últimas tres 29,3', vel.avg3);
    const velBad = sprints.filter((s) => s.status === 'cerrado').filter((s) => {
      const done = sum(countable.filter((i) => i.sprintId === s.id && A.isDone(st, i)), A.estimate);
      const pending = sum(s.unfinished || [], (u) => u.estimate || 0);
      return done !== s.completed || done + pending !== s.committed;
    }).map((s) => s.name);
    ok(!velBad.length, 'comprometido = terminado + no terminado y terminado = Σ elementos aceptados en cada iteración cerrada', velBad);
    const it7 = sprints.find((s) => s.status === 'en-curso');
    const bd = C.sprintBurndown({ sprint: it7, items, settings: st, cal, statusDate: cut });
    ok(bd.committed === 31 && bd.total === 33 && bd.done === 2 && bd.remaining === 31 && bd.days.length === 11 && bd.days.filter((d) => d.remaining !== null).length === 3, 'burndown de la iteración 7 con datos hasta el corte (31 comprometidos, DF-009 agregado y terminado)', { c: bd.committed, t: bd.total, d: bd.done });
    const it6 = sprints[5];
    const withUnf = [...items, ...it6.unfinished.map((u) => ({ id: u.id + '@', code: u.code, type: 'historia', estimate: u.estimate, status: 'backlog', sprintId: it6.id, sprintAddedDate: null }))];
    const bd6 = C.sprintBurndown({ sprint: it6, items: withUnf, settings: st, cal, statusDate: cut });
    ok(bd6.total === 31 && bd6.done === 26 && bd6.days[bd6.days.length - 1].remaining === 5, 'burndown de la iteración 6 cerrada: 31 comprometidos, 26 terminados, 5 sin terminar (HU-033)');
    const bu1 = C.releaseBurnup({ release: R1, sprints, items, settings: st, statusDate: cut });
    const bu2 = C.releaseBurnup({ release: R2, sprints, items, settings: st, statusDate: cut });
    ok(bu1.points.map((p) => p.scope + '/' + p.done).join() === '102/0,102/24,118/55,118/86,118/118', 'burnup del release 1: 102 → 118 puntos (CC-001) y 118 terminados', bu1.points.map((p) => p.scope + '/' + p.done));
    ok(bu2.points.filter((p) => !p.future).map((p) => p.scope + '/' + p.done).join() === '112/0,112/30,120/56' && bu2.baselinePoints === 112, 'burnup del release 2: 112 → 120 puntos y 56 terminados', bu2.points);
    const cfd = C.cfd({ items, settings: st, from: '2026-07-01', to: cut });
    const lastCfd = cfd[cfd.length - 1];
    ok(cfd.length > 50 && lastCfd.terminado === countable.filter((i) => A.isDone(st, i)).length && lastCfd['en-curso'] === 4 && lastCfd.pendiente === 3 && cfd.some((r) => r.pendiente > 0 && r['en-curso'] > 0), 'diagrama de flujo acumulado con todas las categorías', lastCfd);

    /* ---------- WIP y bloqueados */
    const wip = A.wipStatus(st, items);
    const enCurso = wip.find((w) => w.id === 'en-curso');
    ok(enCurso.full && !enCurso.over && enCurso.count === 3 && wip.every((w) => !w.over), 'columna «En curso» en su límite WIP (3 de 3) sin superarlo', wip.map((w) => w.id + ':' + w.count + '/' + w.wip));
    const blocked = items.filter((i) => i.blocked);
    ok(blocked.length === 1 && blocked[0].sprintId === it7.id && blocked[0].blockedReason.length > 30, 'un elemento bloqueado en la iteración en curso con su motivo', blocked.map((i) => i.code));

    /* ---------- AgileEVM y costos de los releases */
    const ac = (r) => A.releaseActualCost(r, costs, tree, cut);
    const e1 = C.agileEvm({ release: R1, sprints, items, settings: st, actualCost: ac(R1), statusDate: cut });
    const e2 = C.agileEvm({ release: R2, sprints, items, settings: st, actualCost: ac(R2), statusDate: cut });
    const e3 = C.agileEvm({ release: R3, sprints, items, settings: st, actualCost: ac(R3), statusDate: cut });
    ok(e1.ppc === 1 && e1.apc === 1 && e1.spi === 1 && e1.ac === 97.8e6 && e1.cpi > 0.97 && e1.cpi < 0.99, 'AgileEVM del release 1: terminado, SPI 1,00, CPI 0,98', [e1.spi, e1.cpi, e1.ac]);
    ok(e2.ppc === 0.5 && Math.abs(e2.apc - 56 / 120) < 1e-12 && e2.pv === 52e6 && Math.abs(e2.ev - 104e6 * 56 / 120) < 1 && e2.ac === 52.5e6 && F.idx(e2.spi) === '0,93' && F.idx(e2.cpi) === '0,92', 'AgileEVM del release 2: PPC 50 %, APC 46,7 %, SPI 0,93, CPI 0,92', [e2.ppc, e2.apc, e2.spi, e2.cpi]);
    ok(e3.pv === 0 && e3.ev === 0 && e3.ac === 0 && e3.plannedSprints === 3, 'AgileEVM del release 3 sin iteraciones transcurridas');
    ok(A.releaseCosts(agile.releases, costs, tree, cut).total === 150.3e6 && costs.actuals.filter((a) => a.releaseId).length === 15, 'costos reales imputados a los releases (releaseId): COP 150,3 millones');
    ok(costs.actuals.every((a) => a.date <= cut && a.amount > 0 && Number.isInteger(a.amount) && (!a.taskId || tids.has(a.taskId))), 'costos reales en pesos enteros hasta la fecha de corte');

    /* ---------- avance de los releases en el cronograma y en la curva S */
    const tb = (id) => sched.byId.get(id);
    ok(tb('t25').progress === 100 && tb('t25').actualStart === '2026-07-13' && tb('t25').actualFinish === '2026-09-09' && tb('t26').progress === 46.7 && tb('t27').progress === 0 && tb('t25').agileDerived && tb('t26').agileDerived, 'releases en el cronograma: 100 % y 46,7 % calculados desde el backlog', [tb('t25').progress, tb('t26').progress]);
    ok(['t25', 't26', 't27'].every((id) => tasks.find((t) => t.id === id).progress === tb(id).progress), 'el avance guardado de las actividades de los releases coincide con el derivado del backlog');
    const planCost = (id) => bls.cost.cost.tasks.find((t) => t.id === id).cost;
    const evNoAgile = C.evm({ sched: C.computeSchedule({ ...schedule, tasks: tasks.map((t) => (['t25', 't26', 't27'].includes(t.id) ? { ...t, progress: 0 } : t)) }, meta.start), costBaseline: bls.cost, costs, statusDate: cut }).ev;
    ok(Math.abs(evm.ev - evNoAgile - (planCost('t25') + planCost('t26') * 0.467)) < 1, 'la curva S incluye el valor ganado de los releases (EV del release 1 y 46,7 % del release 2)', [evm.ev, evNoAgile]);
    ok(evm.fromBaseline && evm.bac === 601.3e6 && meta.budget === evm.bac + costs.reserves.contingency + costs.reserves.management && meta.budget === 680e6, 'BAC de COP 601,3 millones y presupuesto de COP 680 millones con reservas', [evm.bac, meta.budget]);
    ok(evm.spi > 0.95 && evm.spi < 0.99 && evm.cpi > 0.96 && evm.cpi < 1, 'SPI y CPI realistas (levemente atrasado y con sobrecosto)', [evm.spi, evm.cpi]);
    const lb0 = blDocs.find((b) => b.data.label === 'LB0');
    ok(blDocs.length === 1 && lb0 && lb0.data.date === '2026-07-10' && lb0.data.includes.join() === 'scope,schedule,cost' && lb0.data.schedule.finish === '2027-01-29' && lb0.data.cost.bac === evm.bac && lb0.data.scope.wbs.length === wbs.nodes.length, 'LB0 del 10 de julio con alcance, cronograma y costos');
    ok(costs.statusUpdates.length === 5 && costs.statusUpdates.every((u) => u.date < cut) && evm.series.filter((p) => p.ev !== null).length > 10, 'cortes de avance mensuales para la serie del valor ganado');

    /* ---------- catálogo de recursos (SPEC §10): tipos, asignaciones, formas de costeo, equipo Scrum y capacidad sugerida */
    const resources = await P('/tools/resources');
    ok(resources && resources.preset === 'ti' && resources.types.length === PM.RES.PRESETS.ti.types.length && resources.items.length >= 24, 'catálogo de recursos con los tipos del preset «Tecnología y sistemas»', resources && { preset: resources.preset, n: resources.items.length });
    const cat = PM.res.catalog(resources, schedule);
    const typeIds = new Set(cat.types.map((t) => t.id));
    const RSTATUS = PM.RES.STATUS.map((x) => x.value);
    ok(resources.items.every((it) => typeIds.has(it.typeId) && /^REC-\d{3}$/.test(it.code) && it.unit && it.subtype && PM.RES.ORIGINS.includes(it.origin) && RSTATUS.includes(it.status) && PM.isNum(it.unitCost) && it.notes) && new Set(resources.items.map((i) => i.code)).size === resources.items.length, 'recursos con tipo, subtipo, código único, unidad, costo unitario, origen y estado');
    const asg = tasks.flatMap((t) => (t.resources || []).map((a) => ({ t, a, it: cat.resolve(a) })));
    ok(asg.length > 60 && asg.every((x) => x.it && !x.it.virtual && x.a.resourceId === x.it.id && x.a.name === x.it.name && typeIds.has(x.it.typeId) && (cat.kindOf(x.it) === 'trabajo' ? x.a.units > 0 : x.a.qty > 0)), 'cada asignación resuelve a un recurso del catálogo con tipo (mismo nombre y resourceId), con unidades o cantidad', asg.filter((x) => !x.it || x.a.resourceId !== x.it.id).map((x) => x.t.id + ' ' + x.a.name));
    ok(Object.entries(schedule.settings.resourceLimits).every(([n, v]) => { const it = cat.byKey.get(PM.res.key(n)); return it && it.availability === v; }), 'disponibilidad del catálogo = límites de recursos del cronograma');
    const modes = tasks.filter((t) => (t.costMode || 'global') !== 'global');
    const tc26 = PM.res.taskCost(tasks.find((t) => t.id === 't26'), cat);
    ok(modes.map((t) => t.id + ':' + t.costMode).join() === 't26:mixto,t34:recursos' && modes.every((t) => PM.res.taskCost(t, cat).total === t.cost) && tc26.fixed === 8e6 && tc26.resourcesTotal === 96e6, 'formas de costeo: release 2 mixto (bolsa fija de COP 8,0 millones + equipo de COP 96,0 millones) y estabilización por recursos (COP 22,62 millones), con el mismo costo; las demás a precio global', modes.map((t) => [t.id, t.costMode, PM.res.taskCost(t, cat).total, t.cost]));
    ok(['t25', 't27'].every((id) => { const t = tasks.find((x) => x.id === id); return PM.res.taskCost({ ...t, costMode: 'mixto', costFixed: id === 't27' ? 6e6 : 0 }, cat).total === t.cost; }), 'las tarifas del equipo cuadran también con los releases 1 y 3 (cuatro y tres iteraciones de COP 24,0 millones)');
    ok(PM.sum(asg.filter((x) => x.t.id === 't12'), (x) => x.a.qty * x.it.unitCost) === tasks.find((t) => t.id === 't12').cost && PM.sum(asg.filter((x) => x.t.id === 't14' && cat.kindOf(x.it) === 'consumible'), (x) => x.a.qty * x.it.unitCost) === tasks.find((t) => t.id === 't14').cost, 'suscripción (210 y 105 usuarios-mes) y equipos de bodega del catálogo = presupuesto de t12 y t14');
    const effR = PM.res.applyCosts(PM.agile.applyToSchedule(schedule, agile, items, { statusDate: cut }), resources);
    const evmR = C.evm({ sched: C.computeSchedule(effR, meta.start), costBaseline: bls.cost, costs, statusDate: cut });
    const EVM_EXPECTED = { bac: 601300000, pv: 355730917.5906963, ev: 345763200, ac: 352120000, spi: 0.9719796140908811, cpi: 0.9819470635010792, eac: 612354802.3618476 };
    const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
    ok(Object.entries(EVM_EXPECTED).every(([k, v]) => near(evm[k], v) && near(evmR[k], v)), 'valor ganado idéntico al esperado (BAC, PV, EV, AC, SPI, CPI y EAC), también con las formas de costeo aplicadas como en useProjectModel', Object.keys(EVM_EXPECTED).map((k) => [k, evm[k], evmR[k]]));
    const teamR = resources.items.filter((i) => i.agileTeam);
    ok(teamR.map((i) => i.name + ':' + i.dedication).join('|') === ['Consultor funcional ERP:100', 'Desarrollador ERP:100', 'Desarrollador de integraciones:50', 'Analista de pruebas:50', 'Analista de TI:100'].join('|') && teamR.every((i) => i.hoursPerDay === 8) && resources.items.filter((i) => !i.agileTeam && /Scrum Master|Dueño del producto/.test(i.name)).length === 2, 'equipo Scrum del catálogo: cinco personas, dos al 50 % (4 personas equivalentes); el Scrum Master y el dueño del producto no suman capacidad', teamR.map((i) => [i.name, i.dedication]));
    const capOf = (sid) => PM.res.teamCapacity({ data: resources, schedule, sprint: sprints.find((x) => x.id === sid), cal, settings: st, velocity: vel });
    const c5 = capOf('spr-05'), c6 = capOf('spr-06'), c7 = capOf('spr-07'), c8 = capOf('spr-08');
    ok(c5.personDays === 37 && c6.personDays === 38 && c7.personDays === 40 && c7.normal === 40, 'días-persona de las iteraciones 5, 6 y 7: 37 (incapacidad), 38 (vacaciones del analista de TI) y 40 (el festivo del 12 de octubre no es día de la iteración), como en las planificaciones', [c5.personDays, c6.personDays, c7.personDays]);
    ok(c8.personDays === 37.5 && c8.reference.kind === 'velocidad' && Math.abs(c8.reference.personDays - 115 / 3) < 1e-9 && c8.suggested === 28.7 && c7.suggested === 30.6 && c8.members.find((m) => m.name === 'Analista de pruebas').absentDays === 5, 'capacidad sugerida frente a los días-persona de las iteraciones 5 a 7 de la velocidad media (38,3 en promedio): 30,6 puntos en la iteración 7 (equipo completo) y 28,7 en la 8 por las vacaciones del analista de pruebas (37,5 días-persona)', [c7.suggested, c8.suggested, c8.personDays, c8.reference]);
    const unplR = resources.items.filter((i) => i.planned === false);
    ok(unplR.map((i) => i.reason).sort().join() === 'rendimiento,todo-costo' && unplR.every((i) => !PM.isNum(i.reserveAmount) && !i.changeRef && !PM.RES.REASONS.find((r) => r.value === i.reason).baseline), 'no planificados: tabletas de prueba del implementador (por su cuenta, INC-001) y horas extra del ensayo de corte (acción correctiva); ninguno usa la reserva para contingencias ni cambia la línea base', unplR.map((i) => [i.name, i.reason]));
    /* ---------- estructura de desglose de los riesgos: plan de gestión de los riesgos y subcategorías del registro */
    {
      const pgri = docOf('plan-gestion-riesgos');
      const planRows = (pgri && pgri.fields.edrRiesgos) || [];
      const n2 = new Set(planRows.map((r) => PM.res.key(r.nivel2)));
      const rrows = docOf('registro-riesgos').fields.riesgos;
      const rrevs = (await PM.store.list(PM.paths.revs(pid, 'registro-riesgos'))).map((r) => r.data);
      ok(pgri && pgri.status === 'aprobado' && pgri.rev === '0' && pgri.titleBlock.fechaAprobacion === '2026-07-10', 'plan de gestión de los riesgos aprobado con la LB0 (10 de julio)', pgri && pgri.titleBlock);
      ok(planRows.length === 8 && new Set(planRows.map((r) => r.nivel1)).size === 4 && planRows.every((r) => ['Técnico', 'De gestión', 'Comercial', 'Externo'].includes(r.nivel1) && r.ejemplos && ['Técnico', 'Externo', 'De la organización', 'Dirección de proyectos'].includes(r.categoriaRegistro)), 'estructura de desglose de los riesgos del ERP: 8 subcategorías en las 4 categorías');
      ok(rrows.every((k) => n2.has(PM.res.key(k.subcategoria))) && rrevs.every((rv) => rv.fields.riesgos.every((k) => n2.has(PM.res.key(k.subcategoria)))), 'cada riesgo del registro (y de sus revisiones) con una subcategoría del plan', rrows.filter((k) => !n2.has(PM.res.key(k.subcategoria))).map((k) => k.id));
      const rbr = PM.res.riskTree({ planRows, risks: rrows });
      const leaves = []; const walk = (n, path) => { if (n.kind === 'leaf') leaves.push(path.join(' › ')); n.children.forEach((c) => walk(c, path.concat(n.label))); };
      walk(rbr, []);
      ok(leaves.length === rrows.length && leaves.every((p) => p.split(' › ').length === 3 && !/Sin subcategoría|Sin categoría/.test(p)), 'estructura de desglose de los riesgos completa (categoría → subcategoría → riesgo)', leaves);
      ok(has(pgri.fields.financiamiento, F.moneyShort(costs.reserves.contingency)) && has(pgri.fields.financiamiento, F.moneyShort(costs.reserves.management)), 'plan de gestión de los riesgos: reservas para contingencias y de gestión del presupuesto');
    }

    /* ---------- RACI con roles y eventos ágiles */
    const roleNames = raci.roles.map((r) => r.name);
    ok(PM.AGILE.ROLES.every((n) => roleNames.includes(n)) && roleNames.includes('Patrocinador') && roleNames.includes('Director de proyecto'), 'RACI con los roles ágiles, patrocinador y director', roleNames);
    const evRows = raci.rows.filter((r) => !r.wbsId).map((r) => r.activity);
    ok(['Refinamiento del backlog', 'Planificación de la iteración', 'Revisión de la iteración', 'Retrospectiva', 'Priorización del backlog', 'Definición de terminado'].every((n) => evRows.includes(n)), 'filas de eventos ágiles en la RACI', evRows);
    const raciBad = raci.rows.filter((r) => { const v = Object.values(r.cells); return v.filter((x) => x.includes('A')).length !== 1 || !v.some((x) => x.includes('R')); }).map((r) => r.activity);
    ok(!raciBad.length, 'cada fila de la RACI con exactamente una A y al menos una R', raciBad);

    /* ---------- documentos: claves, estados y revisiones */
    const EXPECT_DOCS = ['acta-constitucion', 'registro-interesados', 'registro-riesgos', 'plan-gestion-riesgos', 'plan-gestion-cambios', 'vision-producto', 'definicion-terminado', 'plan-release', 'planificacion-sprint--it6', 'planificacion-sprint--it7', ...[1, 2, 3, 4, 5, 6].flatMap((n) => ['acta-revision-sprint--it' + n, 'retrospectiva--it' + n]), 'registro-incidentes', 'registro-lecciones', 'registro-cambios', 'solicitud-cambio--cc001', 'informe-desempeno--corte-2026-10-09'];
    ok(EXPECT_DOCS.every((id) => docOf(id)), 'documentos PMBOK y ágiles del ejemplo', EXPECT_DOCS.filter((id) => !docOf(id)));
    const keyBad = [];
    for (const d of docs) { const t = PM.templates[d.data.template]; const keys = t.sections.flatMap((s) => s.fields.map((x) => x.key)); const miss = keys.filter((k) => !(k in d.data.fields)); if (miss.length) keyBad.push(d.id + ': ' + miss.join(',')); }
    ok(!keyBad.length, 'cada documento tiene todas las claves de su plantilla (PM.newDocBody)', keyBad);
    const revsOf = async (id) => (await PM.store.list(PM.paths.revs(pid, id))).map((r) => r.data);
    const statusBad = [];
    const codeDates = Object.fromEntries(items.map((i) => [i.code, i.createdAt]));
    Object.assign(codeDates, { 'CC-001': '2026-08-13', 'INC-001': '2026-07-22', 'INC-002': '2026-09-30', 'INC-003': '2026-10-05', 'INC-004': '2026-10-09', 'R-008': '2026-10-08' });
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    for (const d of docs) {
      const b = d.data, tb2 = b.titleBlock || {};
      const revs = await revsOf(d.id);
      const upd = String(b.updatedAt).slice(0, 10);
      if (b.status === 'aprobado' && (!D.valid(tb2.fechaAprobacion) || tb2.fechaAprobacion > cut || !cal.isWork(tb2.fechaAprobacion) || tb2.fechaAprobacion !== upd)) statusBad.push(d.id + ' fecha de aprobación ' + tb2.fechaAprobacion);
      if (b.status !== 'aprobado' && tb2.fechaAprobacion) statusBad.push(d.id + ' sin aprobar con fecha de aprobación');
      if (revs.some((r) => String(r.date).slice(0, 10) > upd)) statusBad.push(d.id + ' revisión posterior al documento');
      if (b.status === 'aprobado') { const late = lateCodes(b.fields, tb2.fechaAprobacion); if (late.length) statusBad.push(d.id + ' cita hechos posteriores: ' + late); }
      for (const r of revs) if (r.status === 'aprobado') { const late = lateCodes(r.fields, String(r.date).slice(0, 10)); if (late.length) statusBad.push(d.id + ' rev ' + r.rev + ' cita hechos posteriores: ' + late); }
      if (/^[0-9]+$/.test(String(b.rev)) !== (b.status === 'aprobado')) statusBad.push(d.id + ' revisión ' + b.rev + ' no corresponde al estado ' + b.status);
    }
    ok(!statusBad.length, 'estados, revisiones y fechas de los documentos coherentes (ninguno aprobado cita hechos posteriores)', statusBad);
    ok(docs.filter((d) => PM.templates[d.data.template].multiple).every((d) => d.data.seq >= 1 && /-\d{2}$/.test(d.data.titleBlock.codigo)), 'instancias múltiples numeradas');
    const sd = agile.sprints.find((s) => s.id === 'spr-06').docs;
    ok(sd.planificacion === 'planificacion-sprint--it6' && sd.revision === 'acta-revision-sprint--it6' && sd.retrospectiva === 'retrospectiva--it6' && docOf(sd.planificacion) && agile.sprints.find((s) => s.id === 'spr-05').docs.revision === 'acta-revision-sprint--it5' && agile.sprints.find((s) => s.id === 'spr-07').docs.planificacion === 'planificacion-sprint--it7', 'documentos vinculados a sus iteraciones');
    /* regresión: cada iteración cerrada tiene acta de revisión y retrospectiva aprobadas y vinculadas (la ruta del tablero
       cuenta «N de N iteraciones cerradas documentadas») */
    const closedSprints = sprints.filter((s) => s.status === 'cerrado');
    const undocumented = closedSprints.filter((s) => ['revision', 'retrospectiva'].some((k) => { const d = s.docs && s.docs[k] ? docOf(s.docs[k]) : null; return !d || d.status !== 'aprobado' || d.template !== (k === 'revision' ? 'acta-revision-sprint' : 'retrospectiva') || d.fields.iteracion !== s.name; })).map((s) => s.name);
    ok(closedSprints.length === 6 && !undocumented.length, 'las 6 iteraciones cerradas tienen acta de revisión y retrospectiva aprobadas y vinculadas', undocumented);
    ok(docs.filter((d) => d.data.template === 'acta-revision-sprint').every((d) => { const s = sprints.find((x) => x.name === d.data.fields.iteracion); return s && s.docs.revision === d.id; }) && docs.filter((d) => d.data.template === 'retrospectiva').every((d) => { const s = sprints.find((x) => x.name === d.data.fields.iteracion); return s && s.docs.retrospectiva === d.id; }), 'cada acta de revisión y retrospectiva está vinculada a su iteración');
    /* regresión: toda cita a la revisión o la retrospectiva de una iteración (backlog y documentos) tiene su acta, y el acta de
       revisión menciona los elementos que nacieron en ella */
    const citeRe = /(revisión|retrospectiva) de la iteración (\d+)/g;
    const citeBad = [];
    const citeTexts = [...items.map((i) => [i.code, i.description + ' ' + i.acceptance]), ...docs.map((d) => [d.id, strings(d.data.fields).join(' ')])];
    for (const [who, txt] of citeTexts) for (const m of String(txt).matchAll(citeRe)) {
      const s = sprints.find((x) => x.name === 'Iteración ' + m[2]);
      const d = s && s.docs[m[1] === 'revisión' ? 'revision' : 'retrospectiva'];
      if (!d || !docOf(d)) citeBad.push(who + ' → ' + m[0]);
    }
    ok(!citeBad.length, 'las revisiones y retrospectivas citadas en el backlog y los documentos tienen acta', citeBad);
    const bornBad = items.filter((i) => /revisión de la iteración \d+/.test(i.description)).filter((i) => { const n = /revisión de la iteración (\d+)/.exec(i.description)[1]; const s = sprints.find((x) => x.name === 'Iteración ' + n); const d = s && docOf(s.docs.revision); return !d || !strings(d.fields).some((t) => t.includes(i.code)); }).map((i) => i.code);
    ok(!bornBad.length && items.filter((i) => /revisión de la iteración [1-3]\b/.test(i.description)).length >= 5, 'cada acta de revisión menciona los elementos que nacieron en ella (DF-001, ME-001, ME-002, DF-002, ME-003, HU-041)', bornBad);

    /* ---------- cifras de los documentos frente a los cálculos */
    const asOf = (at) => {
      const its = items.filter((i) => i.createdAt <= at).map((i) => { let s = 'backlog'; for (const h of i.history) if (h.date <= at) s = h.status; return { ...i, status: s, doneDate: A.category(st, s) === 'terminado' ? i.doneDate : null }; });
      const sps = sprints.map((s) => (s.end <= at ? s : { ...s, status: s.start <= at ? 'en-curso' : 'planeado', completed: null }));
      return { its, sps, vel: C.velocity({ sprints: sps, items: its, settings: st }) };
    };
    /* planificación de la iteración 6 (24 de septiembre) */
    const p6 = docOf('planificacion-sprint--it6').fields;
    const at6 = asOf('2026-09-23');
    ok(p6.iteracion === it6.name && p6.fechaInicio === it6.start && p6.fechaFin === it6.end && p6.release === R2.name && p6.capacidad === it6.capacity && p6.compromiso === it6.committed && p6.velocidadReferencia === round1(at6.vel.avg3), 'planificación de la iteración 6: fechas, capacidad, compromiso 31 y velocidad de referencia 31', [p6.velocidadReferencia, at6.vel.avg3]);
    const it6codes = [...countable.filter((i) => i.sprintId === it6.id).map((i) => i.code), ...it6.unfinished.map((u) => u.code)].sort();
    ok(JSON.stringify(p6.elementos.map((r) => r.codigo).sort()) === JSON.stringify(it6codes) && sum(p6.elementos, (r) => r.estimacion) === it6.committed && p6.elementos.every((r) => { const i = items.find((x) => x.code === r.codigo); return i.estimate === r.estimacion && i.assignee === r.responsable; }), 'elementos de la planificación 6 = elementos de la iteración (estimación y responsable)');
    /* planificación de la iteración 7 (8 de octubre) */
    const p7 = docOf('planificacion-sprint--it7').fields;
    const at7 = asOf('2026-10-07');
    const it7start = countable.filter((i) => i.sprintId === it7.id && !i.sprintAddedDate);
    ok(p7.compromiso === it7.committed && it7.committed === sum(it7start, A.estimate) && p7.capacidad === it7.capacity && p7.velocidadReferencia === round1(at7.vel.avg3) && p7.velocidadReferencia === 29.3 && has(p7.riesgos, F.num(at7.vel.avg3, 1)), 'planificación de la iteración 7: compromiso 31, capacidad 32 y velocidad de referencia 29,3', [p7.compromiso, p7.velocidadReferencia]);
    ok(JSON.stringify(p7.elementos.map((r) => r.codigo).sort()) === JSON.stringify(it7start.map((i) => i.code).sort()) && sum(p7.elementos, (r) => r.estimacion) === p7.compromiso, 'elementos de la planificación 7 = elementos comprometidos al iniciar');
    /* revisiones de las iteraciones 1 a 6 */
    for (const s of closedSprints) {
      const r = docOf(s.docs.revision).fields;
      const accepted = r.elementos.filter((x) => x.resultado === 'Aceptado');
      ok(r.iteracion === s.name && r.fecha === s.end && r.comprometido === s.committed && r.terminado === s.completed && sum(accepted, (x) => x.estimacion) === s.completed && sum(r.elementos, (x) => x.estimacion) === s.committed, 'acta de revisión de la ' + s.name.toLowerCase() + ': comprometido ' + s.committed + ' y terminado ' + s.completed);
      const doneCodes = countable.filter((i) => i.sprintId === s.id && A.isDone(st, i)).map((i) => i.code).sort();
      ok(JSON.stringify(accepted.map((x) => x.codigo).sort()) === JSON.stringify(doneCodes) && r.elementos.filter((x) => x.resultado !== 'Aceptado').map((x) => x.codigo).join() === (s.unfinished || []).map((u) => u.code).join(), 'resultados de la revisión de la ' + s.name.toLowerCase() + ' = elementos terminados y no terminados');
    }
    const r6 = docOf('acta-revision-sprint--it6').fields;
    const r2at7 = C.releaseProgress({ release: R2, items: at7.its, settings: st });
    ok(has(r6.estadoRelease, r2at7.done + ' de ' + r2at7.total + ' puntos') && has(r6.estadoRelease, '(' + F.pct(r2at7.pct) + ')') && has(r6.estadoRelease, 'Faltan ' + r2at7.remaining + ' puntos') && has(r6.estadoRelease, F.num(at7.vel.avg3, 1) + ' puntos'), 'acta de revisión 6: 56 de 120 puntos (47 %), faltan 64 y velocidad 29,3', r6.estadoRelease);
    ok(has(r6.cambiosBacklog, v2.baselinePoints + ' a ' + v2.total + ' puntos (+' + F.num(v2.scopePct * 100, 1) + ' %)') && /HU-041/.test(r6.cambiosBacklog) && /ME-009/.test(r6.cambiosBacklog), 'acta de revisión 6: cambio de alcance 112 → 120 (+7,1 %) igual a la variación del release');
    const fc7 = C.releaseForecast({ release: R2, sprints: at7.sps, items: at7.its, settings: st, cal, statusDate: '2026-10-07' });
    ok(fc7.sprintsNeeded === 3 && /una iteración más/.test(r6.estadoRelease), 'acta de revisión 6: el pronóstico pide una iteración más que las dos que quedan', fc7.sprintsNeeded);
    const r5 = docOf('acta-revision-sprint--it5').fields;
    const at5 = asOf('2026-09-23');
    const r2at5 = C.releaseProgress({ release: R2, items: at5.its, settings: st });
    const fc5 = C.releaseForecast({ release: R2, sprints: at5.sps, items: at5.its, settings: st, cal, statusDate: '2026-09-23' });
    ok(has(r5.estadoRelease, r2at5.done + ' de ' + r2at5.total + ' puntos terminados (' + F.pct(r2at5.pct) + ')') && has(r5.estadoRelease, F.num(at5.vel.avg3, 0) + ' puntos en las tres últimas') && has(r5.estadoRelease, F.date(fc5.finish, 'long')) && fc5.finish === R2.end, 'acta de revisión 5: 30 de 112 puntos, velocidad 31 y pronóstico al 6 de noviembre', r5.estadoRelease);
    /* revisiones de las iteraciones 1 a 4 (release 1): avance, velocidad y pronóstico a la fecha de cada revisión */
    for (const s of closedSprints.slice(0, 4)) {
      const r = docOf(s.docs.revision).fields;
      const at = asOf(s.end);
      const rp = C.releaseProgress({ release: R1, items: at.its, settings: st });
      const fc = C.releaseForecast({ release: R1, sprints: at.sps, items: at.its, settings: st, cal, statusDate: s.end });
      const head = s === sprints[1]
        ? (() => { const before = C.releaseProgress({ release: R1, items: asOf(D.add(s.end, -1)).its, settings: st }); return has(r.estadoRelease, rp.done + ' de ' + before.total + ' puntos terminados (' + F.pct(rp.done / before.total) + ')') && has(r.estadoRelease, 'faltarían ' + rp.remaining + ' puntos') && has(r.cambiosBacklog, before.total + ' a ' + rp.total + ' puntos'); })()
        : has(r.estadoRelease, rp.done + ' de ' + rp.total + ' puntos terminados (' + F.pct(rp.pct) + ')');
      const fcOk = rp.remaining === 0 ? fc.sprintsNeeded === 0 : has(r.estadoRelease, F.date(fc.finish, 'long'));
      const velOk = has(r.estadoRelease, F.num(at.vel.avg3, Number.isInteger(at.vel.avg3) ? 0 : 1) + ' puntos');
      ok(head && fcOk && velOk && r.objetivo === s.goal, 'acta de revisión de la ' + s.name.toLowerCase() + ': avance del release 1, velocidad y pronóstico a la fecha de la revisión', r.estadoRelease);
    }
    const r1d = docs.find((d) => d.id === sprints[0].docs.revision).data;
    ok(r1d.titleBlock.fechaAprobacion === D.add(sprints[0].end, 1) && r1d.fields.fecha === sprints[0].end && /DF-001/.test(r1d.fields.cambiosBacklog), 'acta de revisión de la iteración 1: revisión del 27 de julio aprobada el 28 con DF-001 registrado');
    ok(/HU-006/.test(docOf(sprints[2].docs.revision).fields.estadoRelease) && /HU-014/.test(docOf(sprints[2].docs.revision).fields.estadoRelease) && /CC-001/.test(docOf(sprints[2].docs.revision).fields.estadoRelease), 'acta de revisión de la iteración 3: elementos «Debería tener» por diferir según la condición del CC-001');
    /* retrospectivas → registro de lecciones */
    const lec = docOf('registro-lecciones').fields.lecciones;
    for (const s of closedSprints) {
      const rt = docOf(s.docs.retrospectiva).fields;
      ok(rt.iteracion === s.name && rt.fecha === s.end && rt.lecciones.length >= (s.end >= '2026-09-23' ? 2 : 1) && rt.lecciones.every((l) => lec.some((x) => x.situacion === l.situacion && x.recomendacion === l.recomendacion && x.impacto === l.impacto && x.fecha === rt.fecha && x.area === 'Integración' && x.registradoPor === 'Retrospectiva ' + s.name)), 'lecciones de la retrospectiva de la ' + s.name.toLowerCase() + ' enviadas al registro de lecciones');
      ok(rt.acciones.every((a) => a.fechaObjetivo > s.end && a.fechaObjetivo <= sprints[sprints.indexOf(s) + 1].end), 'acciones de la retrospectiva de la ' + s.name.toLowerCase() + ' con fecha en la iteración siguiente');
    }
    ok(lec.every((l, k) => l.id === 'LA-' + String(k + 1).padStart(3, '0')) && lec.every((l, k) => !k || l.fecha >= lec[k - 1].fecha), 'lecciones LA-### en orden de fecha');
    const retroFollow = closedSprints.slice(1).filter((s) => !new RegExp('^Acciones de la ' + sprints[sprints.indexOf(s) - 1].name.toLowerCase() + ':').test(docOf(s.docs.retrospectiva).fields.seguimientoAnteriores)).map((s) => s.name);
    ok(!retroFollow.length && /^Primera retrospectiva/.test(docOf(sprints[0].docs.retrospectiva).fields.seguimientoAnteriores), 'cada retrospectiva revisa las acciones de la anterior', retroFollow);
    ok(lec.some((l) => l.registradoPor === 'Retrospectiva Iteración 3' && /Pruebas de usuario/.test(l.recomendacion) && /DF-001/.test(l.situacion) && /DF-002/.test(l.situacion)), 'la lección de la retrospectiva 3 («Pruebas de usuario») sale de su acta y cita los defectos que la originaron');
    /* plan de releases, definición de terminado y visión */
    const pr = docOf('plan-release').fields;
    ok(pr.releases.length === 3 && pr.releases.every((x, k) => { const r = [R1, R2, R3][k]; return x.release === r.name && x.fechaInicio === r.start && x.fechaFin === r.end && x.iteraciones === r.plannedSprints && x.presupuesto === r.budget; }) && pr.duracionIteracion === st.sprintLength, 'plan de releases: nombres, fechas, iteraciones y presupuestos de los releases');
    ok(pr.releases[0].puntos === prog(R1).total && pr.releases[0].puntos === R1.baseline.points && pr.releases[1].puntos === R2.baseline.points && pr.releases[2].puntos === prog(R3).total, 'plan de releases: 118, 112 (línea base del release 2) y 88 puntos', pr.releases.map((x) => x.puntos));
    const prRevs = await revsOf('plan-release');
    const pr0 = prRevs.find((r) => r.rev === '0').fields.releases[0].puntos;
    ok(pr0 === 102 && pr0 === sum(countable.filter((i) => i.releaseId === R1.id && i.createdAt <= '2026-07-10'), A.estimate), 'plan de releases rev. 0: release 1 con 102 puntos (línea base inicial)', pr0);
    const dt = docOf('definicion-terminado').fields;
    ok(dt.columnasTablero.length === st.columns.length && dt.columnasTablero.every((c, k) => c.columna === st.columns[k].name && (c.wip ?? null) === (st.columns[k].wip ?? null)), 'definición de terminado: columnas y límites WIP iguales a los del tablero');
    ok(dt.fechaAcuerdo === sprints[2].end, 'definición de terminado acordada en la retrospectiva de la iteración 3');
    ok(docOf('vision-producto').fields.restricciones.some((x) => x.includes('COP 278 millones') && x.includes('COP 680 millones')), 'visión del producto: presupuesto de los releases y del proyecto');
    /* control de cambios: CC-001 */
    const cc = docOf('solicitud-cambio--cc001').fields;
    const cr = docOf('registro-cambios').fields.cambios;
    ok(cc.codigoCambio === 'CC-001' && cc.decision === 'Aprobada' && cc.fechaDecision === R1.baseline.date && cc.nivelAutoridad === 'Nivel 2' && cr.length === 1 && cr[0].id === 'CC-001' && cr[0].estado === 'Aprobada' && cr[0].fechaDecision === cc.fechaDecision, 'CC-001 aprobado y referenciado en la línea base del release 1');
    const pct1 = F.num((R1.baseline.points - 102) / 102 * 100, 1);
    ok(has(cc.impactoAlcance, R1.baseline.points + ' puntos frente a 102') && has(cc.impactoAlcance, '+' + pct1 + ' %') && has(cr[0].impactoAlcance, '+' + pct1 + ' %') && cc.diasCronograma === 0 && cc.valorCosto === 0, 'CC-001: +15,7 % de alcance sin cambio de fecha ni presupuesto');
    /* acta, riesgos e informe de desempeño */
    const acta = docOf('acta-constitucion').fields;
    ok(acta.presupuesto === meta.budget && has(acta.recursosFinancieros, F.moneyShort(evm.bac)) && has(acta.recursosFinancieros, F.moneyShort(costs.reserves.contingency)) && has(acta.recursosFinancieros, F.moneyShort(costs.reserves.management)), 'acta de constitución: presupuesto, BAC y reservas');
    const rr = docOf('registro-riesgos').fields.riesgos;
    ok(sum(rr, (r) => r.reserva) === costs.reserves.contingency && ['datos maestros', 'usuarios clave', 'resistirse', 'DIAN', 'implementador', 'cierre mensual'].every((k) => rr.some((r) => r.descripcion.includes(k))), 'registro de riesgos: riesgos del ERP y reservas que suman la reserva para contingencias');
    const inf = docOf('informe-desempeno--corte-2026-10-09').fields;
    ok(inf.fechaCorte === cut && inf.avancePlanificado === round1(evm.pctPlanned * 100) && inf.avanceReal === round1(evm.pctComplete * 100), 'informe: avance planificado y real = PV/BAC y EV/BAC', [inf.avancePlanificado, inf.avanceReal]);
    const lastVg = inf.valorGanado[inf.valorGanado.length - 1];
    ok(lastVg.corte === cut && lastVg.bac === evm.bac && lastVg.pv === Math.round(evm.pv) && lastVg.ev === Math.round(evm.ev) && lastVg.ac === Math.round(evm.ac), 'informe: PV, EV y AC al corte = valor ganado del proyecto', lastVg);
    ok(inf.valorGanado.every((r) => r.pv === Math.round(evm.pvAt(r.corte)) && r.ev === Math.round(evm.evAt(r.corte)) && r.ac === Math.round(evm.acAt(r.corte))), 'informe: cortes anteriores = serie del valor ganado');
    const fcR2 = C.releaseForecast({ release: R2, sprints, items, settings: st, cal, statusDate: cut });
    ok(has(inf.resumen, 'SPI ' + F.idx(evm.spi)) && has(inf.resumen, 'CPI ' + F.idx(evm.cpi)) && has(inf.resumen, prog(R2).done + ' de ' + prog(R2).total + ' puntos') && has(inf.resumen, F.date(fcR2.finish, 'long')) && has(inf.resumen, F.moneyShort(evm.eac)) && has(inf.resumen, F.num(fcR2.velocity, 0) + ' puntos por iteración'), 'informe: resumen con SPI, CPI, avance y pronóstico del release 2 y EAC', inf.resumen);
    ok(has(inf.analisisVariacion, 'SPI ' + F.idx(e2.spi)) && has(inf.analisisVariacion, 'CPI ' + F.idx(e2.cpi)) && has(inf.analisisVariacion, 'EAC ' + F.moneyShort(e2.eac)) && has(inf.analisisVariacion, 'SV de ' + F.moneyShort(evm.sv)) && has(inf.analisisVariacion, 'CV de ' + F.moneyShort(evm.cv)), 'informe: análisis con SV, CV y AgileEVM del release 2');
    ok(Math.abs(inf.eacAdoptado - evm.eac) <= 1e5 && inf.fechaFinPronosticada === fcs.finish, 'informe: EAC adoptado y fin pronosticado', [inf.eacAdoptado, inf.fechaFinPronosticada]);
    const lb0t = (id) => lb0.data.schedule.tasks.find((t) => t.id === id);
    const h2 = inf.hitos.find((h) => /Release 2/.test(h.hito));
    ok(h2.fechaBase === lb0t('t31').start && h2.fechaPronostico === fcs.byId.get('t31').startDate && inf.hitos.find((h) => /Release 1/.test(h.hito)).fechaPronostico === '2026-09-10', 'informe: hitos con fechas de la LB0 y del cronograma actualizado al corte');
    ok(has(inf.incidentesRelevantes, '(' + enCurso.count + ' de ' + enCurso.wip + ')') && has(inf.incidentesRelevantes, bd.remaining + ' de ' + bd.total + ' puntos') && /TA-011/.test(inf.incidentesRelevantes), 'informe: WIP, bloqueado y burndown de la iteración 7');
    ok(has(inf.cambiosPeriodo, '+' + F.num(v2.scopePct * 100, 1) + ' %'), 'informe: cambio de alcance de nivel 1 del release 2');
    return out;
  });
}

/* ============================================================== ejecución */
section('Datos, cálculos y documentos del ejemplo (' + file + ')');
{
  const app = await openApp({ file });
  try {
    const res = await validateInPage(app.page);
    for (const r of res) check(r.ok, r.msg, r.extra);
    check(!app.errors.length, 'sin errores de consola al construir e importar', app.errors);
    /* docs/ejemplo-erp/supuestos-y-fuentes.md: cifras calculadas por la aplicación y referencias */
    const mdPath = join(root, 'docs/ejemplo-erp/supuestos-y-fuentes.md');
    if (check(existsSync(mdPath), 'existe docs/ejemplo-erp/supuestos-y-fuentes.md')) {
      const md = readFileSync(mdPath, 'utf8');
      const want = await app.page.evaluate(() => {
        const F = PM.getExample('erp').facts();
        const p = (s) => String(s).replace(/[  ]/g, ' ');
        /* millones con un decimal fijo (el documento escribe «680,0 M», «52,0 M») */
        const m1 = (v) => (v / 1e6).toFixed(1).replace('.', ',').replace('-', '−');
        const E = F.evm, R2 = F.releases['rel-2'];
        const closed = F.velocity.rows.filter((r) => r.status === 'cerrado').map((r) => r.completed);
        return [
          'BAC ' + m1(E.bac) + ' M · PV ' + m1(E.pv) + ' M · EV ' + m1(E.ev) + ' M · AC ' + m1(E.ac) + ' M',
          'SPI ' + p(PM.fmt.idx(E.spi)) + ' · CPI ' + p(PM.fmt.idx(E.cpi)) + ' · TCPI ' + p(PM.fmt.idx(E.tcpi)),
          'EAC ' + m1(E.eac) + ' M', 'VAC ' + m1(E.vac) + ' M',
          p(PM.fmt.num(E.pctComplete * 100, 1)) + ' % real frente a ' + p(PM.fmt.num(E.pctPlanned * 100, 1)) + ' % planificado',
          '**COP ' + m1(F.budget) + ' M** = BAC de las actividades ' + m1(F.bac) + ' M + reserva para contingencias ' + m1(F.reserves.contingency) + ' M + reserva de gestión ' + m1(F.reserves.management) + ' M',
          closed.slice(0, -1).join(', ') + ' y ' + closed[closed.length - 1] + ' puntos en las iteraciones 1 a 6',
          'promedio de las tres últimas ' + p(PM.fmt.num(F.velocity.avg3, 1)),
          R2.prog.done + ' de ' + R2.prog.total + ' puntos (' + p(PM.fmt.num(R2.prog.pct * 100, 1)) + ' %)',
          'PV ' + m1(R2.evm.pv) + ' M, EV ' + m1(R2.evm.ev) + ' M, AC ' + m1(R2.evm.ac) + ' M, SPI ' + p(PM.fmt.idx(R2.evm.spi)) + ', CPI ' + p(PM.fmt.idx(R2.evm.cpi)) + ', EAC ' + m1(R2.evm.eac) + ' M',
          'terminaría el ' + p(PM.fmt.date(R2.forecast.finish, 'long')),
          'COP ' + m1(F.releaseCostsTotal) + ' M', '| **Total** | **' + (F.evm.ac / 1e6).toFixed(2).replace('.', ',') + '** |',
          F.counts.items + ' elementos (' + F.counts.epics + ' épicas', F.counts.unestimated + ' elementos sin estimar',
        ];
      });
      const missing = want.filter((s) => !md.includes(s));
      check(!missing.length, 'supuestos y fuentes: cifras iguales a las calculadas por la aplicación', missing);
      const refs = ['https://ecosire.com/es/blog/erp-cost-calculator-how-to-use', 'https://innowise.com/es/blog/erp-implementation-cost/', 'https://softland.com/co/?p=19127'];
      check(refs.every((u) => md.includes(u)) && /supuestos del ejemplo/i.test(md) && /proveedores/.test(md), 'supuestos y fuentes: cita las tres referencias como guías de proveedores y aclara que las cifras son supuestos');
    }
  } finally { await app.browser.close(); }
}

section('Vistas con el ejemplo creado desde el selector');
{
  const app = await openApp({ file, width: 1360, height: 900 });
  const { page, errors } = app;
  try {
    /* el selector de ejemplos muestra el del ERP (con un solo ejemplo registrado, la página lo crea sin selector) */
    const nExamples = await page.evaluate(() => PM.examples.length);
    await page.evaluate(() => { PM.createExampleProject(); });
    if (nExamples > 1) {
      await page.waitForSelector('.example-card', { timeout: 8000 });
      const cards = await page.$$eval('.example-card', (els) => els.map((e) => e.getAttribute('aria-label')));
      check(cards.some((c) => /ERP/.test(c)), 'el selector de ejemplos ofrece el ERP', cards);
      await page.click('.example-card[aria-label*="ERP"]');
    }
    await page.waitForFunction(() => PM.getState().projectId && PM.getState().view === 'tablero', null, { timeout: 20000 });
    await page.waitForTimeout(900);
    const pid = await page.evaluate(() => PM.getState().projectId);
    const meta = await page.evaluate((pid) => PM.store.get(PM.paths.project(pid)), pid);
    check(meta && meta.code === 'PRY-2026-021', 'proyecto del ERP creado y abierto en el tablero', meta && meta.code);
    if (shots) await page.screenshot({ path: shots + '/tablero.png', fullPage: true });
    const board = norm(await page.evaluate(() => document.querySelector('.page').innerText));
    check(/Iteración 7/.test(board) && /Release 2/.test(board) && /29,3/.test(board), 'tablero: tarjeta ágil con la iteración 7, el release 2 y la velocidad 29,3');
    /* regresión: la ruta sugerida da por documentadas la revisión y la retrospectiva de las 6 iteraciones cerradas */
    const showSteps = page.locator('[data-card="route"] button', { hasText: 'Mostrar pasos' });
    if (await showSteps.count()) { await showSteps.first().click(); await page.waitForTimeout(300); }
    const revStep = await page.evaluate(() => { const b = document.querySelector('[data-step="revision-retro"]'); return b ? { state: b.getAttribute('data-state'), text: b.innerText } : null; });
    check(revStep && revStep.state === 'done' && /6 de 6 iteraciones cerradas documentadas/.test(norm(revStep.text)), 'ruta sugerida: revisión y retrospectiva de las 6 iteraciones cerradas documentadas', revStep);

    /* métricas ágiles */
    await gotoView(page, 'metricas-agiles');
    await page.waitForSelector('[data-chart-card="burndown"] svg[data-chart]', { timeout: 8000 });
    const charts = await page.evaluate(() => ['burndown', 'burnup', 'velocity', 'cfd', 'forecast', 'agile-evm', 'cycle-time', 'throughput'].map((id) => { const c = document.querySelector('[data-chart-card="' + id + '"]'); return [id, !!c && !c.querySelector('[data-role="chart-empty"]') && !!c.querySelector('svg')]; }));
    check(charts.every(([, okc]) => okc), 'métricas ágiles: burndown, burnup, velocidad, flujo acumulado, pronóstico, AgileEVM, ciclo y rendimiento con datos', charts.filter(([, okc]) => !okc));
    const sub = await page.evaluate(() => ({ bd: document.querySelector('[data-chart-card="burndown"] .card-head').innerText, bu: document.querySelector('[data-chart-card="burnup"] .card-head').innerText }));
    sub.bd = norm(sub.bd); sub.bu = norm(sub.bu);
    check(/Iteración 7/.test(sub.bd) && /quedan 31 pts/.test(sub.bd) && /56 pts de 120 pts/.test(sub.bu) && /línea base 112 pts/.test(sub.bu), 'burndown de la iteración 7 (quedan 31) y burnup del release 2 (56 de 120, línea base 112)', sub);
    /* velocidad de todo el proyecto: tabla de datos */
    await page.locator('[data-role="metrics-filters"] button', { hasText: 'Todo el proyecto' }).click();
    await page.waitForTimeout(250);
    await page.locator('[data-chart-card="velocity"] [data-role="toggle-data"]').click();
    await page.waitForTimeout(250);
    const velRows = (await page.$$eval('[data-chart-card="velocity"] .ags-data tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())))).map((r) => r.map(norm));
    const term = velRows.filter((r) => /Cerrad/.test(r[1])).map((r) => r[5]);
    check(term.join('|').replace(/\s*pts/g, '') === '24|31|31|32|30|26', 'tabla de velocidad: 24, 31, 31, 32, 30 y 26 en las iteraciones cerradas', velRows.map((r) => r.join(' / ')));
    const evmTxt = norm(await page.evaluate(() => document.querySelector('[data-chart-card="agile-evm"]').innerText));
    check(/0,93/.test(evmTxt) && /0,92/.test(evmTxt) && /46,7\s?%/.test(evmTxt), 'AgileEVM del release 2 en la vista (SPI 0,93, CPI 0,92, APC 46,7 %)');
    if (shots) await page.screenshot({ path: shots + '/metricas-agiles.png', fullPage: true });

    /* tablero Kanban: WIP y bloqueado */
    await gotoView(page, 'kanban');
    await page.waitForTimeout(400);
    const kb = norm(await page.evaluate(() => document.querySelector('.page').innerText));
    check(/Límite WIP alcanzado/.test(kb) && /3\s*\/\s*3/.test(kb) && /Bloqueado/.test(kb) && /TA-011/.test(kb), 'Kanban: «En curso» en su límite WIP (3 / 3) y TA-011 bloqueado con motivo');
    if (shots) await page.screenshot({ path: shots + '/kanban.png', fullPage: true });

    /* curva S: avance de los releases */
    await gotoView(page, 'valor-ganado');
    await page.waitForTimeout(500);
    const vg = norm(await page.evaluate(() => document.querySelector('.page').innerText));
    check(/3 actividades vinculadas a releases/.test(vg) && /345,8 M/.test(vg) && /601,3 M/.test(vg), 'curva S: incluye el avance de las 3 actividades de los releases (EV $ 345,8 M de BAC $ 601,3 M)');
    await page.locator('.tabs button, [role="tab"]', { hasText: 'Valor ganado ágil' }).first().click();
    await page.waitForTimeout(400);
    const vga = norm(await page.evaluate(() => document.querySelector('.page').innerText));
    check(/Release 1/.test(vga) && /Release 2/.test(vga) && /Release 3/.test(vga) && /0,93/.test(vga), 'valor ganado ágil por release en la vista de valor ganado');

    /* releases e iteraciones */
    await gotoView(page, 'iteraciones');
    await page.waitForTimeout(400);
    const itTxt = norm(await page.evaluate(() => document.querySelector('.page').innerText));
    check(/118 pts de 118 pts/.test(itTxt) && /56 pts de 120 pts/.test(itTxt) && /Cambios dentro del release \(nivel 1\)/.test(itTxt), 'releases e iteraciones: avance de los releases y control de cambios de nivel 1 en el release 2');
    await page.locator('[data-release-id="rel-1"]').first().click();
    await page.waitForTimeout(300);
    const bl1 = norm(await page.evaluate(() => (document.querySelector('[data-role="baseline-summary"]') || {}).textContent || ''));
    check(/CC-001/.test(bl1) && /118 pts/.test(bl1), 'release 1: línea base actualizada con el CC-001', bl1);
    /* regresión: la iteración 1 muestra su acta de revisión y su retrospectiva aprobadas y su lección ya enviada al registro */
    await page.locator('tr[data-sprint-id="spr-01"] button.ags-link').first().click();
    await page.waitForTimeout(300);
    const sd1 = norm(await page.evaluate(() => (document.querySelector('[data-role="sprint-docs"]') || {}).innerText || ''));
    check(/Acta de revisión de la iteración — Iteración 1 · Aprobado/.test(sd1) && /Retrospectiva de la iteración — Iteración 1 · Aprobado/.test(sd1) && /1 de 1 lección enviada/.test(sd1), 'iteración 1: acta de revisión y retrospectiva aprobadas y lección enviada al registro', sd1);

    /* capacidad sugerida de la iteración 8 con el equipo Scrum del catálogo de recursos (clic y detalle con el teclado) */
    await page.locator('[data-release-id="rel-2"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('tr[data-sprint-id="spr-08"] button.ags-link').first().click();
    const capSel = '[data-role="planner"][data-sprint-id="spr-08"] [data-role="capacity-suggestion"]';
    await page.waitForSelector(capSel, { timeout: 8000 });
    const capTxt = norm(await page.locator(capSel).innerText()).replace(/\s+/g, ' ');
    check(/Capacidad sugerida: 28,7 pts/.test(capTxt) && /5 miembros del equipo/.test(capTxt) && /37,5 de 38,3 días-persona en promedio de las últimas 3 iteraciones cerradas/.test(capTxt) && /Ausencias: Analista de pruebas \(5 días hábiles\)/.test(capTxt) && /Capacidad registrada: 32 pts/.test(capTxt), 'iteración 8: capacidad sugerida de 28,7 pts por las vacaciones del analista de pruebas (37,5 días-persona frente a 38,3 en promedio de las iteraciones de la velocidad)', capTxt.slice(0, 600));
    await page.locator(capSel + ' [data-role="capacity-detail-toggle"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector(capSel + ' [data-role="capacity-members"]', { timeout: 5000 });
    const capRows = await page.$$eval(capSel + ' [data-role="capacity-members"] tbody tr', (trs) => trs.map((tr) => [tr.getAttribute('data-member'), ...[...tr.querySelectorAll('td')].map((td) => td.textContent.trim())]));
    const apRow = capRows.find((r) => r[0] === 'rec-ap');
    check(capRows.length === 5 && apRow && /^50\s%$/.test(apRow[2]) && apRow[3] === '2,5' && /^5\sdías hábiles$/.test(apRow[5]), 'detalle: cinco miembros; el analista de pruebas al 50 % con 2,5 días-persona', capRows);
    if (shots) await page.screenshot({ path: shots + '/capacidad-iteracion-8.png', fullPage: false });
    /* catálogo de recursos: el equipo Scrum filtrado por tipo */
    await page.evaluate(() => PM.navigate('recursos', { tab: 'catalogo' }));
    await page.waitForSelector('[data-rcat="1"] [data-tile="total"]', { timeout: 10000 });
    check(norm(await page.locator('[data-tile="total"] .rcat-tile-value').innerText()) === '26' && norm(await page.locator('[data-tile="no-planificados"] .rcat-tile-value').innerText()) === '2', 'catálogo del ERP: 26 recursos y 2 no planificados');
    await page.getByLabel('Filtrar por tipo').selectOption('consultoria');
    await page.waitForTimeout(300);
    const cons = await page.$$eval('[data-rcat-row]', (els) => els.map((e) => e.getAttribute('data-rcat-row')));
    check(cons.length === 9 && cons.includes('Consultor funcional ERP') && cons.includes('Analista de pruebas'), 'filtro «Consultoría y servicios»: implementador y asesores externos', cons);

    /* todas las vistas sin tarjetas de error */
    const views = await page.evaluate(() => PM.views.map((v) => v.id));
    const bad = [];
    for (const v of views) {
      const before = errors.length;
      await gotoView(page, v);
      await page.waitForTimeout(250);
      const cardsErr = await errorCards(page);
      const ov = await horizontalOverflow(page);
      if (cardsErr.length || errors.length > before || ov > 1) bad.push({ v, cards: cardsErr.length, err: errors.slice(before).join(' | ').slice(0, 200), ov });
    }
    check(!bad.length, 'todas las vistas (' + views.length + ') sin tarjetas de error, errores de consola ni desborde', bad);
    await page.evaluate(() => PM.openDocument('informe-desempeno--corte-2026-10-09'));
    await page.waitForSelector('.page[data-doc-id] [data-section]', { timeout: 8000 });
    check(!(await errorCards(page)).length, 'el informe de desempeño abre en el editor');
    check(!errors.length, 'sin errores de consola en las vistas', errors);
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Vistas ágiles en ' + variant.name);
    const app = await openApp({ file, width: variant.width, height: 900, dark: variant.dark });
    try {
      const pid = await createExample(app.page, 'erp');
      await app.page.waitForTimeout(700);
      check(!!pid, 'ejemplo creado');
      const bad = [];
      for (const v of ['tablero', 'backlog', 'kanban', 'iteraciones', 'metricas-agiles', 'valor-ganado', 'edt', 'cronograma', 'raci']) {
        await gotoView(app.page, v);
        await app.page.waitForTimeout(300);
        const ov = await horizontalOverflow(app.page);
        const cardsErr = await errorCards(app.page);
        const w = variant.width === 1920 ? await app.page.evaluate(() => document.querySelector('.page').getBoundingClientRect().width) : null;
        if (ov > 1 || cardsErr.length || (w !== null && w < 1400)) bad.push({ v, ov, cards: cardsErr.length, w });
        if (shots && (v === 'kanban' || v === 'metricas-agiles')) await app.page.screenshot({ path: shots + '/' + v + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: true });
      }
      check(!bad.length, 'sin desborde ni tarjetas de error' + (variant.width === 1920 ? ' y a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

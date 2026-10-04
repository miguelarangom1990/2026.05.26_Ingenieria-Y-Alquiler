// Prueba del proyecto de ejemplo (src/90-example.js).
// Uso: node test/example.test.mjs [--out dir] [--shots dir]
//   1) Construye una página aislada (núcleo + 90) y valida el constructor, la importación y los cálculos.
//   2) Crea el ejemplo desde el estado vacío del portafolio (botón «Crear proyecto de ejemplo») y verifica persistencia.
//   3) Ejecuta test/smoke.mjs sobre esa página.
//   4) Si existen plantillas (12-, 13-), construye núcleo + plantillas + 90 y valida los documentos y revisiones.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openApp, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-example-test');
const shots = opt('--shots');
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 400) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
/* smoke.mjs con un reintento si el arranque del navegador excede el tiempo (máquina cargada). */
const smoke = (file) => {
  let r = spawnSync(process.execPath, [join(root, 'test/smoke.mjs'), '--file', file], { encoding: 'utf8' });
  if (r.status !== 0 && /TimeoutError/.test(r.stderr)) r = spawnSync(process.execPath, [join(root, 'test/smoke.mjs'), '--file', file], { encoding: 'utf8' });
  return r;
};
const build = (name, include) => {
  const file = join(outDir, name);
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', include], { stdio: 'pipe' });
  return file;
};

/* Validación completa en la página: constructor → importData → lectura del almacenamiento → cálculos. */
async function validateInPage(page) {
  return page.evaluate(async () => {
    const out = { checks: [] };
    const ok = (cond, msg, extra) => out.checks.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date;
    ok(PM.exampleBuilders.length === 1, 'hay exactamente un constructor de ejemplo registrado', PM.exampleBuilders.length);
    const ex = PM.exampleBuilders[0]({ today: PM.date.today() });
    const ex2 = PM.exampleBuilders[0]({ today: '2030-01-01' });
    ok(JSON.stringify(ex) === JSON.stringify(ex2), 'el constructor es determinista (no depende de hoy ni de valores aleatorios)');
    ok(ex.format === 'gestor-pmbok' && ex.version === 1, 'formato de exportación');
    const sizes = [];
    for (const [name, items] of Object.entries(ex.collections)) for (const it of items) { sizes.push([name + '/' + it.id, new TextEncoder().encode(JSON.stringify(it.data)).length]); for (const r of it.revs || []) sizes.push([name + '/' + it.id + '/revs/' + r.id, new TextEncoder().encode(JSON.stringify(r.data)).length]); }
    ok(sizes.every(([, n]) => n <= 256 * 1024), 'cada documento pesa máximo 256 KiB', sizes.filter(([, n]) => n > 256 * 1024));
    out.totalKB = Math.round(sizes.reduce((s, [, n]) => s + n, 0) / 1024);
    out.writes = sizes.length + 1;

    const pid = await PM.projectOps.importData(ex);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    const expectMeta = { name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista', code: 'PRY-2026-014', client: 'Constructora Modelo S.A.S. (ficticia)', sponsor: 'Gerencia General', manager: 'Director de proyecto', start: '2026-08-03', end: '2026-12-18', statusDate: '2026-10-02', budget: 486500000, currency: 'COP', status: 'En ejecución', lifecycle: 'Predictivo' };
    for (const [k, v] of Object.entries(expectMeta)) ok(meta && meta[k] === v, 'metadato ' + k, meta && meta[k]);
    ok(meta && String(meta.location || '').includes('Bogotá') && String(meta.description || '').length > 60, 'ubicación y descripción');
    ok(PM.PROJECT_STATUS.includes(meta.status) && PM.LIFECYCLES.includes(meta.lifecycle), 'estado y ciclo de vida válidos');

    /* EDT */
    const wbs = await P('/tools/wbs');
    const nodes = (wbs && wbs.nodes) || [];
    const ids = new Set(nodes.map((n) => n.id));
    const l1 = nodes.filter((n) => !n.parentId);
    ok(l1.length === 6 && l1.map((n) => n.name).join('|') === 'Gestión del proyecto|Ingeniería|Suministro y logística|Montaje|Certificación y operación|Desmontaje y retiro', 'EDT: seis entregables de nivel 1 de SPEC §8', l1.map((n) => n.name));
    ok(nodes.length >= 25 && nodes.length <= 35, 'EDT con unas 30 partidas', nodes.length);
    ok(l1.every((n) => { const c = nodes.filter((x) => x.parentId === n.id).length; return c >= 2 && c <= 5; }), 'cada entregable tiene de 2 a 5 paquetes de trabajo');
    const NK = ['id', 'parentId', 'name', 'order', 'description', 'responsible', 'deliverable', 'acceptance', 'costEstimate', 'notes', 'kind'];
    ok(nodes.every((n) => NK.every((k) => k in n) && String(n.description).length > 20 && n.responsible && n.deliverable && n.acceptance), 'diccionario de la EDT completo', nodes.find((n) => !NK.every((k) => k in n)));
    ok(nodes.every((n) => !n.parentId || ids.has(n.parentId)), 'padres de la EDT existen');
    const tree = PM.calc.wbsTree(nodes);
    ok(tree.codes.get('w144') === '1.4.4' && tree.codes.get('w11') === '1.1', 'códigos de la EDT', [tree.codes.get('w144'), tree.codes.get('w11')]);

    /* Cronograma */
    const schedule = await P('/tools/schedule');
    const tasks = (schedule && schedule.tasks) || [];
    ok(schedule.settings.workweek === 6 && schedule.settings.holidaysCO === true && Array.isArray(schedule.settings.extraHolidays), 'calendario L-S con festivos de Colombia');
    ok(schedule.settings.resourceLimits && schedule.settings.resourceLimits['Cuadrilla de montaje'] === 8 && schedule.settings.resourceLimits['Camión grúa'] === 1, 'límites de recursos', schedule.settings.resourceLimits);
    ok(tasks.length >= 35 && tasks.length <= 45, 'unas 40 actividades', tasks.length);
    const TK = ['id', 'name', 'wbsId', 'duration', 'milestone', 'start', 'deps', 'progress', 'cost', 'resources', 'responsible', 'actualStart', 'actualFinish', 'notes'];
    ok(tasks.every((t) => TK.every((k) => k in t)), 'forma de Task (SPEC §3)', tasks.find((t) => !TK.every((k) => k in t)));
    ok(tasks.every((t) => t.wbsId && ids.has(t.wbsId)), 'toda actividad apunta a un nodo existente de la EDT', tasks.filter((t) => !ids.has(t.wbsId)).map((t) => t.id));
    ok(tasks.every((t) => tree.leaves.has(t.wbsId)), 'las actividades cuelgan de paquetes de trabajo');
    const tids = new Set(tasks.map((t) => t.id));
    ok(tasks.every((t) => t.deps.every((d) => tids.has(d.id) && ['FS', 'SS', 'FF', 'SF'].includes(d.type) && Number.isFinite(d.lag))), 'toda dependencia apunta a una actividad existente');
    const deps = tasks.flatMap((t) => t.deps);
    ok(deps.filter((d) => d.type === 'FF').length === 1 && deps.filter((d) => d.type === 'SS' && d.lag > 0).length >= 3 && deps.filter((d) => d.type === 'FS').length > deps.length / 2, 'mayoría FS, varias SS con desfase y una FF');
    const ms = tasks.filter((t) => t.milestone);
    for (const re of [/^Acta de constitución aprobada/, /^Diseño aprobado/, /^Andamio certificado niveles 1 a 5/, /^Certificación final/, /^Entrega al cliente/, /^Cierre del proyecto/]) ok(ms.some((t) => re.test(t.name) && t.duration === 0), 'hito ' + re.source);
    ok(tasks.every((t) => t.resources.every((r) => r.name && r.units > 0)), 'recursos con nombre y unidades');
    const sched = PM.calc.computeSchedule(schedule, meta.start);
    ok(sched.errors.length === 0, 'sin ciclos ni errores en el CPM', sched.errors);
    ok(sched.finish >= '2026-12-10' && sched.finish <= '2026-12-24', 'fin calculado entre el 10 y el 24 de diciembre', sched.finish);
    ok(sched.start === '2026-08-03', 'inicio calculado el 3 de agosto', sched.start);
    const bac = PM.sum(tasks, (t) => t.cost);
    ok(bac >= 445e6 && bac <= 460e6, 'suma de costos de actividades entre 445 y 460 M', bac);
    const st = meta.statusDate;
    const byId = sched.byId;
    ok(['t08', 't13', 't15', 't18'].every((id) => byId.get(id).progress === 100 && D.valid(byId.get(id).actualFinish) && byId.get(id).actualFinish <= st), 'ingeniería, logística y niveles 1 a 5 terminados con fechas reales');
    ok(byId.get('t19').progress >= 55 && byId.get('t19').progress <= 65 && byId.get('t19').actualStart <= st && !byId.get('t19').actualFinish, 'niveles 6 a 10 en curso (~60 %)', byId.get('t19').progress);
    ok(tasks.filter((t) => t.progress > 0).every((t) => D.valid(t.actualStart) ? t.actualStart <= st : t.milestone), 'avance solo en actividades iniciadas antes del corte');
    ok(tasks.filter((t) => t.progress === 0).every((t) => !t.actualStart && byId.get(t.id).startDate > st), 'actividades sin avance empiezan después del corte', tasks.filter((t) => t.progress === 0 && byId.get(t.id).startDate <= st).map((t) => t.id));
    const alq = byId.get('t30');
    const expPct = 100 * sched.cal.countWork(alq.startDate, st) / alq.duration;
    ok(Math.abs(alq.progress - expPct) <= 2, 'avance del alquiler proporcional al tiempo', [alq.progress, expPct]);

    /* Líneas base */
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    const lb0 = blDocs.find((b) => b.data.label === 'LB0'), lb1 = blDocs.find((b) => b.data.label === 'LB1');
    ok(lb0 && lb0.data.number === 0 && lb0.data.date === '2026-08-07' && lb0.data.includes.join() === 'scope,schedule,cost' && lb0.data.byId === null, 'LB0', lb0 && { ...lb0.data, scope: undefined, schedule: undefined, cost: undefined });
    ok(lb1 && lb1.data.number === 1 && lb1.data.date === '2026-09-14' && lb1.data.includes.join() === 'schedule,cost' && lb1.data.changeRef === 'CC-002' && /Plataforma adicional de descargue en piso 8/.test(lb1.data.note), 'LB1 con CC-002', lb1 && lb1.data.note);
    ok(lb0.data.scope && lb0.data.scope.wbs.length === nodes.length, 'LB0 incluye la EDT');
    ok(!lb0.data.schedule.tasks.some((t) => t.id === 't21') && lb1.data.schedule.tasks.some((t) => t.id === 't21'), 'la plataforma (CC-002) solo está en LB1');
    ok(lb1.data.cost.bac - lb0.data.cost.bac === 9800000, 'LB1 = LB0 + 9,8 M', lb1.data.cost.bac - lb0.data.cost.bac);
    ok(lb1.data.cost.bac === bac && lb1.data.cost.contingency === 22600000 && lb0.data.cost.contingency === 32400000, 'BAC y reservas de las líneas base');
    ok(lb0.data.schedule.finish === '2026-12-18' && lb1.data.schedule.finish === '2026-12-18', 'las dos líneas base terminan el 18 de diciembre', [lb0.data.schedule.finish, lb1.data.schedule.finish]);
    /* recalcular LB1 a partir del plan para confirmar que la instantánea sale de computeSchedule */
    const lb1t = lb1.data.schedule.tasks.find((t) => t.id === 't19');
    ok(lb1t.duration === 18 && lb1t.start === '2026-09-19' && lb1t.finish === '2026-10-09', 'niveles 6 a 10 en LB1: 18 días del 19 de sep al 9 de oct', lb1t);
    const actives = PM.calc.activeBaselines(blDocs);
    ok(actives.cost && actives.cost.label === 'LB1' && actives.scope && actives.scope.label === 'LB0', 'línea base activa de costos LB1 y de alcance LB0');

    /* Costos y valor ganado */
    const costs = await P('/tools/costs');
    const CATS = ['Mano de obra', 'Equipos', 'Materiales', 'Transporte', 'Subcontratos', 'Otros'];
    ok(costs.actuals.length >= 20 && costs.actuals.length <= 40, 'unos 25 costos reales', costs.actuals.length);
    ok(costs.actuals.every((a) => a.id && D.valid(a.date) && a.date <= st && a.amount > 0 && tids.has(a.taskId) && a.wbsId === byId.get(a.taskId).wbsId && CATS.includes(a.category) && a.description && /^(FE|OC|NOM|ALQ)-/.test(a.document)), 'costos reales completos y hasta el corte', costs.actuals.find((a) => !(a.date <= st && tids.has(a.taskId))));
    ok(costs.actuals.every((a) => byId.get(a.taskId).actualStart && a.date >= byId.get(a.taskId).actualStart), 'cada costo real es posterior al inicio real de su actividad');
    ok(costs.statusUpdates.map((u) => u.date).join() === '2026-08-14,2026-08-28,2026-09-11,2026-09-25', 'cortes quincenales');
    ok(costs.statusUpdates.every((u) => Object.keys(u.progress).every((k) => tids.has(k))), 'los cortes apuntan a actividades existentes');
    let prev = {}; let mono = true;
    for (const u of costs.statusUpdates) { for (const [k, v] of Object.entries(u.progress)) { if ((prev[k] || 0) > v) mono = false; prev[k] = v; } }
    for (const [k, v] of Object.entries(prev)) if (byId.get(k).progress < v) mono = false;
    ok(mono, 'el avance de los cortes nunca retrocede');
    ok(costs.reserves.contingency === 22600000 && costs.reserves.management === 11900000, 'reservas');
    const evm = PM.calc.evm({ sched, costBaseline: actives.cost, costs, statusDate: st });
    out.evm = { pv: evm.pv, ev: evm.ev, ac: evm.ac, spi: evm.spi, cpi: evm.cpi, eac: evm.eac, forecastFinish: evm.forecastFinish };
    ok(evm.fromBaseline && evm.bac === lb1.data.cost.bac, 'valor ganado con la línea base LB1');
    ok(evm.spi >= 0.90 && evm.spi <= 0.96, 'SPI entre 0,90 y 0,96', evm.spi);
    ok(evm.cpi >= 0.95 && evm.cpi <= 0.99, 'CPI entre 0,95 y 0,99', evm.cpi);
    ok(meta.budget === lb1.data.cost.bac + lb1.data.cost.contingency + lb1.data.cost.management, 'presupuesto = BAC + reservas', meta.budget);

    /* RACI */
    const raci = await P('/tools/raci');
    ok(raci.roles.length === 8 && raci.roles.map((r) => r.name).includes('Interventoría del cliente'), 'roles de la RACI');
    const roleIds = new Set(raci.roles.map((r) => r.id));
    ok(raci.rows.length >= 20 && raci.rows.every((r) => ids.has(r.wbsId) && r.activity), 'filas de la RACI ligadas a la EDT');
    ok(raci.rows.every((r) => Object.values(r.cells).filter((v) => v === 'A' || v === 'RA').length === 1), 'exactamente una A por fila', raci.rows.filter((r) => Object.values(r.cells).filter((v) => v === 'A' || v === 'RA').length !== 1).map((r) => r.wbsId));
    ok(raci.rows.every((r) => Object.values(r.cells).some((v) => v === 'R' || v === 'RA')), 'al menos una R por fila');
    ok(raci.rows.every((r) => Object.keys(r.cells).every((k) => roleIds.has(k)) && Object.values(r.cells).every((v) => ['R', 'A', 'C', 'I', 'RA'].includes(v))), 'celdas válidas');

    /* Calidad */
    const q = await P('/tools/quality');
    const ish = q.ishikawa[0];
    ok(q.ishikawa.length === 1 && ish.name === 'Retraso en el montaje de los niveles 6 a 10' && ish.effect, 'Ishikawa del retraso');
    ok(ish.categories.map((c) => c.name).join() === 'Mano de obra,Método,Maquinaria,Materiales,Medición,Medio ambiente', 'categorías 6M');
    ok(ish.categories.every((c) => c.id && c.causes.length >= 1 && c.causes.every((x) => x.id && x.text && Array.isArray(x.sub) && x.sub.every((s) => s.id && s.text))), 'causas y subcausas');
    ok(q.pareto.length === 2 && q.pareto[0].source === 'manual' && q.pareto[0].items.length >= 5 && q.pareto[0].items.every((x) => x.id && x.cause && x.count > 0) && /inspección de retorno/i.test(q.pareto[0].name), 'Pareto manual');
    ok(q.pareto[1].source === 'mediciones' && q.pareto[1].name === 'No conformidades en inspecciones de montaje' && q.pareto[1].items.length === 0, 'Pareto desde mediciones');
    const ctl = q.control && q.control[0];
    ok(ctl && ctl.name === 'Verticalidad de montantes' && ctl.unit === 'mm/m' && ctl.usl === 3 && ctl.lsl === -3, 'serie de control');
    const vals = ctl.points.map((p) => p.value); const n = vals.length; const mean = vals.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
    const outs = vals.filter((v) => v > mean + 3 * sd || v < mean - 3 * sd);
    ok(n >= 18 && n <= 22 && outs.length === 1 && outs[0] <= ctl.usl, 'unos 20 puntos con uno fuera de control y dentro de especificación', { n, outs });
    ok(ctl.points.every((p) => p.id && D.valid(p.date) && p.date <= st && sched.cal.isWork(p.date)), 'mediciones en días hábiles hasta el corte');

    /* Flujogramas */
    const flows = await PM.store.list(PM.paths.flows(pid));
    ok(flows.length === 2, 'dos diagramas de flujo');
    const f1 = flows.find((f) => f.data.name === 'Control integrado de cambios (4.6)'), f2 = flows.find((f) => f.data.name === 'Recepción e inspección de equipo en obra');
    ok(f1 && f2, 'nombres de los diagramas');
    ok(f1.data.lanes.map((l) => l.name).join() === 'Solicitante,Director de proyecto,Comité de control de cambios', 'carriles del control de cambios');
    const TYPES = ['terminal', 'process', 'decision', 'document', 'data', 'subprocess', 'connector', 'note'];
    for (const f of flows) {
      const d = f.data; const nid = new Set(d.nodes.map((x) => x.id));
      ok(d.nodes.every((x) => TYPES.includes(x.type) && x.text && x.w > 0 && x.h > 0), f.id + ': tipos de nodo válidos');
      ok(d.nodes.every((x) => [x.x, x.y, x.w, x.h].every((v) => v % 8 === 0)), f.id + ': nodos en retícula de 8 px');
      ok(d.edges.every((e) => nid.has(e.from) && nid.has(e.to) && e.from !== e.to), f.id + ': conectores entre nodos existentes');
      ok(new Set(d.edges.map((e) => e.id)).size === d.edges.length && nid.size === d.nodes.length, f.id + ': ids únicos');
      let overlap = null;
      for (let i = 0; i < d.nodes.length; i++) for (let j = i + 1; j < d.nodes.length; j++) { const a = d.nodes[i], b = d.nodes[j]; if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) overlap = [a.id, b.id]; }
      ok(!overlap, f.id + ': nodos sin superposición', overlap);
      const decisions = d.nodes.filter((x) => x.type === 'decision');
      ok(decisions.every((x) => { const ls = d.edges.filter((e) => e.from === x.id).map((e) => e.label).sort().join(); return ls === 'No,Sí'; }), f.id + ': decisiones con salidas Sí y No');
      ok(d.nodes.filter((x) => x.type !== 'note').every((x) => d.edges.some((e) => e.from === x.id || e.to === x.id)), f.id + ': ningún paso suelto');
      if (d.lanes.length) {
        let y = 0; const bands = d.lanes.map((l) => { const b = [y, y + (l.h || 176)]; y = b[1]; return b; });
        ok(d.nodes.every((x) => bands.some(([a, b]) => x.y >= a && x.y + x.h <= b)), f.id + ': cada nodo dentro de un carril');
        ok(d.nodes.every((x) => x.x >= 160), f.id + ': nodos a la derecha de los rótulos de carril');
      }
    }

    /* Documentos */
    const docs = await PM.store.list(PM.paths.docs(pid));
    const tplWithEx = PM.templateList.filter((t) => t.example && t.group !== 'cierre');
    out.templates = PM.templateList.length; out.docs = docs.length;
    ok(docs.length === tplWithEx.length, 'un documento por plantilla con ejemplo (sin las de cierre)', [docs.length, tplWithEx.length]);
    if (PM.templateList.length) {
      for (const t of tplWithEx) {
        const id = t.multiple ? t.id + '--ej1' : t.id;
        const d = docs.find((x) => x.id === id);
        if (!ok(d, 'documento ' + id)) continue;
        const b = d.data;
        ok(b.template === t.id && b.titleBlock.codigo === 'PRY-2026-014-' + t.abbr + (t.multiple ? '-01' : '') && b.titleBlock.elaboro && b.titleBlock.reviso && b.titleBlock.aprobo, id + ': cajetín', b.titleBlock);
        ok(Object.keys(t.example).every((k) => JSON.stringify(b.fields[k]) === JSON.stringify(t.example[k])), id + ': campos del ejemplo');
        ok(PM.DOC_STATUS.some((s) => s.id === b.status) && (b.status === 'aprobado' ? /^\d+$/.test(b.rev) && D.valid(b.titleBlock.fechaAprobacion) : /^[A-Z]$/.test(b.rev) && !b.titleBlock.fechaAprobacion), id + ': estado y revisión coherentes', [b.status, b.rev, b.titleBlock.fechaAprobacion]);
        if (t.group === 'inicio' || t.group === 'planificacion') ok(b.status === 'aprobado', id + ': aprobado (inicio/planificación)');
        if (t.multiple) ok(b.title.startsWith(t.name + ' — ') && b.seq === 1, id + ': título de la instancia', b.title);
        else ok(b.title === t.name, id + ': título');
      }
      if (PM.templates['acta-constitucion']) {
        const revs = await PM.store.list(PM.paths.revs(pid, 'acta-constitucion'));
        ok(revs.map((r) => r.data.rev).sort().join() === '0,A,B' && revs.every((r) => r.data.fields && r.data.titleBlock && r.data.date && r.data.byId === null), 'revisiones A, B y 0 del acta', revs.map((r) => r.data.rev));
      }
      if (PM.templates['registro-riesgos']) {
        const revs = await PM.store.list(PM.paths.revs(pid, 'registro-riesgos'));
        ok(revs.map((r) => r.data.rev).sort().join() === '0,1', 'revisiones 0 y 1 del registro de riesgos', revs.map((r) => r.data.rev));
        ok(docs.find((x) => x.id === 'registro-riesgos').data.rev === '1', 'registro de riesgos en rev. 1');
      }
      for (const id of ['plan-direccion', 'registro-interesados']) if (PM.templates[id]) { const b = docs.find((x) => x.id === id).data; ok(b.rev === '1' && b.titleBlock.fechaAprobacion >= '2026-09-14', id + ': rev. 1 aprobada después de la LB1', b.titleBlock.fechaAprobacion); }
      const scope = docs.find((x) => x.id === 'enunciado-alcance');
      if (scope) ok(JSON.stringify(lb0.data.scope.scopeStatement) === JSON.stringify(scope.data.fields), 'el enunciado del alcance de la LB0 coincide con el documento');
    }
    out.pid = pid;
    return out;
  });
}

function report(label, res) {
  section(label);
  for (const c of res.checks) { if (c.ok) passes++; else { failures++; console.log('  FALLA: ' + c.msg + (c.extra !== undefined ? ' → ' + JSON.stringify(c.extra).slice(0, 500) : '')); } }
  console.log(`  ${res.checks.filter((c) => c.ok).length}/${res.checks.length} verificaciones · plantillas ${res.templates} · documentos ${res.docs} · ${res.writes} escrituras · ${res.totalKB} KB`);
  if (res.evm) console.log(`  PV ${(res.evm.pv / 1e6).toFixed(1)} M · EV ${(res.evm.ev / 1e6).toFixed(1)} M · AC ${(res.evm.ac / 1e6).toFixed(1)} M · SPI ${res.evm.spi.toFixed(3)} · CPI ${res.evm.cpi.toFixed(3)} · EAC ${(res.evm.eac / 1e6).toFixed(1)} M · fin pronosticado ${res.evm.forecastFinish}`);
}

/* ------------------------------------------------------------------ 1) núcleo + 90 */
const file90 = build('example-90.html', '90');
{
  const { browser, page, errors } = await openApp({ file: file90 });
  try {
    const res = await validateInPage(page);
    report('Constructor, importación y cálculos (núcleo + 90)', res);
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
}

/* ------------------------------------------------------------------ 2) botón del portafolio + persistencia */
section('Portafolio vacío → «Crear proyecto de ejemplo» → recarga');
{
  const before = { passes, failures };
  const { browser, page, errors } = await openApp({ file: file90 });
  try {
    await page.evaluate(() => PM.navigate('portafolio'));
    const btn = page.getByRole('button', { name: 'Crear proyecto de ejemplo' });
    await btn.waitFor({ timeout: 5000 });
    check(await page.locator('.empty').count() === 1, 'el portafolio muestra el estado vacío');
    if (shots) await page.screenshot({ path: join(shots, 'portafolio-vacio.png') });
    await btn.click();
    await page.waitForFunction(() => !!PM.getState().projectId, null, { timeout: 15000 });
    await page.getByText('Proyecto de ejemplo creado.').waitFor({ timeout: 5000 });
    check(true, 'aviso «Proyecto de ejemplo creado.»');
    const pid = await page.evaluate(() => PM.getState().projectId);
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading', null, { timeout: 15000 });
    const after = await page.evaluate(async (pid) => {
      const projects = await PM.store.list('projects');
      const sched = await PM.store.get(PM.paths.tool(pid, 'schedule'));
      const bl = await PM.store.list(PM.paths.baselines(pid));
      const flows = await PM.store.list(PM.paths.flows(pid));
      return { n: projects.length, name: projects[0] && projects[0].data.name, sel: PM.getState().projectId, tasks: sched && sched.tasks.length, bl: bl.length, flows: flows.length };
    }, pid);
    check(after.n === 1 && /^EJEMPLO · /.test(after.name), 'el proyecto de ejemplo persiste tras recargar', after);
    check(after.sel === pid && after.tasks >= 35 && after.bl === 2 && after.flows === 2, 'herramientas, líneas base y flujos persisten', after);
    await page.evaluate(() => PM.navigate('portafolio'));
    await page.waitForTimeout(300);
    check(await page.getByText('PRY-2026-014').first().isVisible(), 'el portafolio lista el código del ejemplo');
    if (shots) await page.screenshot({ path: join(shots, 'portafolio-con-ejemplo.png') });
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
  console.log(`  ${passes - before.passes}/${passes - before.passes + failures - before.failures} verificaciones`);
}

/* ------------------------------------------------------------------ 3) prueba de humo */
section('Prueba de humo (test/smoke.mjs)');
{
  const r = smoke(file90);
  process.stdout.write(r.stdout.split('\n').map((l) => (l ? '  ' + l : l)).join('\n'));
  check(r.status === 0, 'smoke.mjs termina sin errores', r.stderr);
}

/* ------------------------------------------------------------------ 4) con plantillas */
const tplPrefixes = ['12', '13'].filter((p) => readdirSync(join(root, 'src')).some((f) => f.startsWith(p + '-') && f.endsWith('.js')));
if (!tplPrefixes.length) console.log('\n• Plantillas: no existen 12-/13- todavía; se omite la verificación de documentos.');
else {
  const fileT = build('example-tpl.html', [...tplPrefixes, '90'].join(','));
  const { browser, page, errors } = await openApp({ file: fileT });
  try {
    const res = await validateInPage(page);
    report('Con plantillas (' + tplPrefixes.join(', ') + ')', res);
    check(res.docs > 0, 'se crearon documentos a partir de las plantillas', res.docs);
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
  const r = smoke(fileT);
  section('Prueba de humo con plantillas');
  process.stdout.write(r.stdout.split('\n').map((l) => (l ? '  ' + l : l)).join('\n'));
  check(r.status === 0, 'smoke.mjs con plantillas termina sin errores', r.stderr);
}

console.log(`\n${failures ? 'FALLÓ' : 'OK'}: ${passes} verificaciones correctas, ${failures} fallidas.`);
process.exit(failures ? 1 : 0);

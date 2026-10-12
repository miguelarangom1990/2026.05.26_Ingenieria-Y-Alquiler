// Prueba de los documentos del equipo del ejemplo ágil del ERP (src/97-example-erp-docs-equipo.js): acta de constitución del
// equipo, plan de involucramiento de los interesados, documentos de prueba y evaluación, y planificación de las iteraciones 1 a 5.
// Uso: node test/example-erp-docs-equipo.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y este módulo (sin los de otros grupos).
//   1) Datos (ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código, estado y
//      revisiones; todas las claves de su plantilla con contenido y opciones válidas; cada cifra igual a la que calcula la
//      aplicación (elementos, compromiso, capacidad y velocidad de cada iteración con PM.calc y PM.agile; días-persona con
//      PM.res.teamCapacity; fechas de la LB0 y del cronograma; criterios de la EDT y del backlog; niveles del registro de
//      interesados a la misma fecha; resultados del release 1); ninguna fecha pasa la fecha de corte ni la del documento, y las
//      versiones aprobadas no citan hechos posteriores a su fecha (fechas con año o sin él, códigos del backlog y, en los
//      criterios de las planificaciones, verbos en pasado).
//   2) Interacción: en el portafolio vacío llega con Tab a «Crear proyecto de ejemplo» y a la tarjeta del ERP y los activa
//      con Enter; abre «Documentos» con el riel, revisa la lista maestra (código, estado, revisión y enfoque), filtra por
//      enfoque con el teclado, abre los documentos de prueba con Tab y Enter y una planificación con el teclado; en
//      «Releases e iteraciones», la iteración 1 abre su planificación (PIT-01) sin crear otra.
//   3) Sin --quick: los nueve documentos en el editor en tema oscuro, a 400 px (claro y oscuro) y a 1920 px, sin desborde de
//      página ni tarjetas de error.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openApp, createExample, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const quick = args.includes('--quick');
const shots = opt('--shots');
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-erp-equipo-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp-equipo.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '1,2,3,4,5,6,7,8,90,91,92,93,94,95,96,97-example-erp-docs-equipo'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 900) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const PLANS = [1, 2, 3, 4, 5].map((n) => 'planificacion-sprint--it' + n);
/* texto visible del editor más los valores de sus campos (innerText no incluye lo escrito en inputs y áreas de texto) */
const editorText = async (page, id) => norm(await page.evaluate((id) => { const el = document.querySelector('.page[data-doc-id="' + id + '"]'); return el ? el.innerText + '\n' + [...el.querySelectorAll('input, textarea')].map((x) => x.value).join('\n') : ''; }, id));
const MINE = ['acta-constitucion-equipo', 'plan-involucramiento-interesados', 'documentos-prueba', ...PLANS];

/* ============================================================== 1: datos y cifras (en la página) */
async function validateInPage(page) {
  return page.evaluate(async ({ MINE, PLANS }) => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, Fm = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const dl = (iso) => plain(Fm.date(iso, 'long'));
    const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
    const n1 = (v) => plain(Fm.num(v, 1));
    /* «del 21 al 27 de julio» o «del 27 de agosto al 7 de septiembre» (mismo formato del módulo) */
    const range = (a, b) => { const A1 = dlShort(a), B1 = dlShort(b); const m = (x) => x.replace(/^\d+ de /, ''); return m(A1) === m(B1) && a.slice(0, 4) === b.slice(0, 4) ? 'del ' + A1.split(' ')[0] + ' al ' + B1 : 'del ' + A1 + ' al ' + B1; };
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const round1 = (v) => Math.round(v * 10) / 10;
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const text = (fields) => strings(fields).join(' \n ');
    const empty = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
    const pctIn = (txt) => { const m = /(\d+(?:,\d+)?)\s*%/.exec(plain(txt || '')); return m ? m[1] + ' %' : ''; };
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    /* fechas largas con año citadas en un texto («10 de septiembre de 2026») */
    const longDates = (txt) => [...plain(txt).matchAll(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (20\d\d)\b/g)].map((m) => m[3] + '-' + String(MONTHS.indexOf(m[2]) + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0'));
    /* fechas sin año («2 de octubre»): de mayo a diciembre son de 2026 y de enero a abril, de 2027 (el proyecto va del 4 de mayo de 2026 al 29 de enero de 2027) */
    const shortDates = (txt) => [...plain(txt).matchAll(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b(?! de 20\d\d)/g)].map((m) => { const mo = MONTHS.indexOf(m[2]) + 1; return (mo >= 5 ? '2026' : '2027') + '-' + String(mo).padStart(2, '0') + '-' + m[1].padStart(2, '0'); });
    /* verbos en pretérito («entregó», «validó», «fueron validadas»): los criterios de aceptación de una planificación no los
       usan. Tras «que lo/la/los/las» el pretérito describe el caso genérico («la devolución que los originó»), no un hecho. */
    const preterite = (txt) => [...plain(txt).matchAll(/(?:^|[^\p{L}])(\p{L}+ó|fue|fueron)(?=[^\p{L}]|$)/gu)].filter((m) => !/\bque (?:lo|la|los|las) $/.test(plain(txt).slice(0, m.index + m[0].length - m[1].length))).map((m) => m[1]);

    /* ---------- construcción e importación */
    const exm = PM.getExample('erp');
    ok(!!exm && PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts) && PM.exampleDocs.erpParts.length >= 1 && PM.exampleDocs.erpEquipo, 'módulo del equipo registrado en PM.exampleDocs.erpParts');
    if (!exm) return out;
    const ex = exm.build({});
    ok(JSON.stringify(ex) === JSON.stringify(exm.build({ today: '2030-01-01' })), 'el constructor sigue siendo determinista con el módulo del equipo');
    const sizes = ex.collections.docs.flatMap((d) => [[d.id, new TextEncoder().encode(JSON.stringify(d.data)).length], ...(d.revs || []).map((r) => [d.id + '/' + r.id, new TextEncoder().encode(JSON.stringify(r.data)).length])]).filter(([id]) => MINE.some((m) => id.startsWith(m)));
    ok(sizes.length >= MINE.length && sizes.every(([, n]) => n <= 256 * 1024), 'cada documento y revisión pesa máximo 256 KiB', sizes.filter(([, n]) => n > 256 * 1024));
    const pid = await PM.projectOps.importData(ex);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    const wbs = await P('/tools/wbs'), schedule = await P('/tools/schedule'), agile = await P('/tools/agile'), resources = await P('/tools/resources');
    const items = (await PM.store.list(PM.paths.backlog(pid))).map((d) => ({ ...d.data, id: d.id }));
    const docs = await PM.store.list(PM.paths.docs(pid));
    const docOf = (id) => { const d = docs.find((x) => x.id === id); return d ? d.data : null; };
    const revsOf = async (id) => (await PM.store.list(PM.paths.revs(pid, id))).map((r) => r.data).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    const cut = meta.statusDate;
    const cal = PM.cal.make(schedule.settings, meta.start);
    const tree = C.wbsTree(wbs.nodes);
    const node = (id) => tree.byId.get(id);
    const LB = blDocs.map((b) => b.data).find((b) => b.number === 0);
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id);
    const task = (id) => schedule.tasks.find((t) => t.id === id);
    const st = A.settings(agile);
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const R2 = rel('rel-2');
    const sprints = A.sortSprints(agile.sprints);
    const item = (code) => items.find((i) => i.code === code);
    const TYPE_LABEL = Object.fromEntries(PM.AGILE.ITEM_TYPES.map((t) => [t.value, t.label]));
    const tplKeys = (id) => PM.templates[id].sections.flatMap((s) => s.fields.map((f) => f.key));
    const optsOf = (tid, field, key) => { const f = PM.templates[tid].sections.flatMap((s) => s.fields).find((x) => x.key === field); return key ? f.columns.find((c) => c.key === key).options : f.options; };
    /* estado del backlog a una fecha (como F.releaseAt y F.velocityAt de 94) */
    const statusOn = (it, at) => { let s = PM.AGILE.BACKLOG; for (const h of it.history || []) if (h.date <= at) s = h.status; return s; };
    const itemsAt = (at) => items.filter((it) => !D.valid(it.createdAt) || it.createdAt <= at).map((it) => { const s = statusOn(it, at); return { ...it, status: s, doneDate: A.category(st, s) === 'terminado' ? it.doneDate : null }; });
    const sprintsAt = (at) => sprints.map((s) => (s.end <= at ? s : { ...s, status: s.start <= at ? 'en-curso' : 'planeado', completed: null, committed: s.start <= at ? s.committed : null }));
    const velAt = (at) => C.velocity({ sprints: sprintsAt(at), items: itemsAt(at), settings: st });
    /* fecha de cada hecho citable: elementos del backlog, cambios, incidentes y riesgos nuevos */
    const inc = docOf('registro-incidentes').fields.incidentes;
    const codeDates = Object.fromEntries(items.map((i) => [i.code, i.createdAt]));
    Object.assign(codeDates, { 'CC-001': rel('rel-1').baseline.date, 'R-008': docOf('registro-riesgos').updatedAt.slice(0, 10) }, Object.fromEntries(inc.map((r) => [r.id, r.fecha])));
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    const unknownCodes = (fields) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => !codeDates[c] && !/^R-00\d$/.test(c));
    const golive1 = task('t29').actualFinish;
    const reg = docOf('registro-interesados');
    const regDate = String(reg.updatedAt).slice(0, 10);
    const dod = docOf('definicion-terminado');
    const s = (n) => sprints[n - 1];
    const SPEC = {
      'acta-constitucion-equipo': { status: 'aprobado', rev: '1', date: s(3).end, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', s(3).end]] },
      'plan-involucramiento-interesados': { status: 'aprobado', rev: '1', date: regDate, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', regDate]] },
      'documentos-prueba': { status: 'revision', rev: '2A', date: cut, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', dod.titleBlock.fechaAprobacion]] },
    };
    PLANS.forEach((id, i) => { SPEC[id] = { status: 'aprobado', rev: '0', date: s(i + 1).start, revs: [], abbr: 'PIT-0' + (i + 1) }; });
    /* fechas planificadas que un documento aprobado puede citar aunque sean posteriores (no son hechos) */
    const planned = new Set([...LB.schedule.tasks.flatMap((t) => [t.start, t.finish]), ...sprints.flatMap((x) => [x.start, x.end]), ...agile.releases.flatMap((r) => [r.start, r.end]), meta.end]);
    /* también son fechas planificadas los días hábiles de la capacitación del release 2 de la LB0 (el plan de involucramiento
       cita los que quedan fuera del cierre mensual de noviembre) */
    for (let d = lbT('t23').start; d <= lbT('t23').finish; d = D.add(d, 1)) if (cal.isWork(d)) planned.add(d);

    /* ---------- existencia, código, estado, revisiones, claves y fechas */
    const V = {};
    for (const id of MINE) {
      const d = docOf(id);
      if (!ok(d, 'existe el documento ' + id)) continue;
      const tid = d.template, sp = SPEC[id], tb = d.titleBlock || {}, upd = String(d.updatedAt).slice(0, 10);
      const revs = await revsOf(id);
      V[id] = { tid, cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock, note: r.note || '' })) };
      ok(tb.codigo === meta.code + '-' + (sp.abbr || PM.templates[tid].abbr), id + ': código ' + meta.code + '-' + (sp.abbr || PM.templates[tid].abbr), tb.codigo);
      ok(d.status === sp.status && d.rev === sp.rev && upd === sp.date, id + ': estado ' + sp.status + ', revisión ' + sp.rev + ' del ' + sp.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd && tb.aprobo : !tb.fechaAprobacion) && tb.elaboro && tb.reviso && String(d.createdAt).slice(0, 10) <= upd, id + ': cajetín, creación y fecha de aprobación coherentes (día hábil, hasta el corte)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(sp.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && (r.status !== 'aprobado' || r.titleBlock.fechaAprobacion === r.date)), id + ': historial de revisiones', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      const keys = tplKeys(tid);
      const versions = [V[id].cur, ...V[id].revs];
      const missing = versions.flatMap((v, k) => keys.filter((key) => empty(v.fields[key])).map((key) => (k ? 'rev ' + V[id].revs[k - 1].rev : 'vigente') + '.' + key));
      ok(!missing.length, id + ': todas las claves de la plantilla con contenido (vigente y revisiones)', missing);
      const isoBad = versions.flatMap((v) => strings(v.fields).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && (!D.valid(x) || x > (planned.has(x) ? meta.end : v.date))));
      ok(!isoBad.length, id + ': las fechas de los campos no pasan la fecha del documento (salvo fechas planificadas)', isoBad);
      const late = versions.map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': ninguna versión cita hechos del backlog, cambios o incidentes posteriores a su fecha', late);
      const lateDates = versions.map((v) => [v.date, [...longDates(text(v.fields)), ...shortDates(text(v.fields))].filter((x) => x > v.date && !planned.has(x) && !cal.holidayName(x) && !(x === task('t16').actualFinish && v.date >= lbT('t16').finish))]).filter(([, l]) => l.length);
      ok(!lateDates.length, id + ': las fechas citadas en el texto, con año o sin él, no pasan la fecha de cada versión (salvo fechas planificadas y festivos)', lateDates);
      ok(!unknownCodes(versions.map((v) => v.fields)).length, id + ': todos los códigos citados existen en el backlog, el registro de incidentes o el de cambios', unknownCodes(versions.map((v) => v.fields)));
      ok(!/\bundefined\b|\bNaN\b|\[object/.test(text(versions.map((v) => v.fields))), id + ': sin textos «undefined», «NaN» ni objetos sin formato');
    }
    if (Object.keys(V).length !== MINE.length) return out;
    const revF = (id, r) => V[id].revs.find((x) => x.rev === r).fields;

    /* ---------- planificación de las iteraciones 1 a 5 */
    /* criterios que el backlog precisó después de planificar: lo que no puede aparecer (drop) y lo que se conserva (keep) */
    const CRIT_AT_PLAN = {
      'IN-001': { drop: ['serial para la maquinaria', 'cantidad por referencia para andamio'], keep: ['Comparación de las dos formas de manejo', 'aceptada por el dueño del producto'] },
      'HU-002': { drop: ['fueron validadas'], keep: ['cada referencia pertenece a una sola familia', 'gerente comercial', 'cinco familias'] },
      'HU-029': { drop: ['validó'], keep: ['IVA de 19 %', 'retención en la fuente de 4 %', 'cinco casos tributarios'] },
      'TA-010': { drop: ['entregó', '2 de octubre', 'archivo de septiembre'], keep: ['archivo de recaudos del banco', '100 % de los pagos identificados por NIT y referencia'] },
    };
    ok(Object.keys(CRIT_AT_PLAN).every((c) => PLANS.some((pid) => V[pid].cur.fields.elementos.some((r) => r.codigo === c))) && Object.entries(CRIT_AT_PLAN).every(([c, ch]) => ch.drop.some((t) => has(item(c).acceptance, t))), 'los cuatro elementos con criterios precisados después están en alguna planificación y su texto vigente en el backlog trae esos hechos');
    const planRelease = PM.templates['plan-release'].example;
    const known = (a) => PM.exampleDocs.erpEquipo.knownAtPlanning(a);
    const resKnown = { ...resources, items: resources.items.map((x) => ({ ...x, absences: (x.absences || []).filter(known) })) };
    const team = resources.items.filter((x) => x.agileTeam);
    for (const [i, id] of PLANS.entries()) {
      const sp = s(i + 1), f = V[id].cur.fields;
      const prev = D.add(sp.start, -1);
      const vel = velAt(prev);
      const closed = vel.rows.filter((r) => r.status === 'cerrado');
      const ref = closed.length ? round1(vel.avg3) : planRelease.velocidadSupuesta;
      ok(f.iteracion === sp.name && f.release === rel(sp.releaseId).name && f.fechaInicio === sp.start && f.fechaFin === sp.end && f.objetivo === sp.goal, id + ': iteración, release, fechas y objetivo de «Releases e iteraciones»', [f.iteracion, f.release, f.fechaInicio, f.fechaFin]);
      ok(f.capacidad === sp.capacity && f.compromiso === sp.committed && f.velocidadReferencia === ref, id + ': capacidad ' + sp.capacity + ', compromiso ' + sp.committed + ' y velocidad de referencia ' + ref + (closed.length ? ' (promedio de las cerradas al día anterior)' : ' (supuesta del plan de releases)'), [f.capacidad, f.compromiso, f.velocidadReferencia]);
      const own = items.filter((x) => A.countable(x) && x.sprintId === sp.id && !(x.sprintAddedDate && x.sprintAddedDate > sp.start));
      const unf = (sp.unfinished || []).map((u) => items.find((x) => x.id === u.id)).filter((x) => x && !own.includes(x));
      const want = [...own, ...unf].sort((a, b) => a.rank - b.rank);
      ok(JSON.stringify(f.elementos.map((r) => r.codigo)) === JSON.stringify(want.map((x) => x.code)) && sum(f.elementos, (r) => r.estimacion) === sp.committed, id + ': elementos comprometidos al iniciar (los de la iteración y sus no terminados, en el orden del backlog) suman el compromiso', [f.elementos.map((r) => r.codigo), want.map((x) => x.code)]);
      ok(f.elementos.every((r) => { const x = item(r.codigo); return x.title === r.titulo && x.estimate === r.estimacion && x.assignee === r.responsable && TYPE_LABEL[x.type] === r.tipo && optsOf('planificacion-sprint', 'elementos', 'tipo').includes(r.tipo); }), id + ': título, tipo, estimación y responsable de cada elemento iguales al backlog');
      /* criterios: los del backlog, salvo los que se precisaron después de planificar, que van como estaban ese día */
      const critBad = f.elementos.filter((r) => { const x = item(r.codigo), ch = CRIT_AT_PLAN[r.codigo]; if (!ch || sp.start >= (x.doneDate || cut)) return r.criterios !== x.acceptance; return r.criterios.split('\n').length !== x.acceptance.split('\n').length || ch.drop.some((t) => has(r.criterios, t)) || !ch.keep.every((t) => has(r.criterios, t)); });
      ok(!critBad.length, id + ': criterios de cada elemento iguales al backlog, salvo los precisados después de la planificación (IN-001, HU-002, HU-029 y TA-010), que van sin esos hechos', critBad.map((r) => [r.codigo, r.criterios]));
      const past = f.elementos.flatMap((r) => preterite(r.criterios).map((w) => r.codigo + ': ' + w));
      ok(!past.length, id + ': los criterios de aceptación no citan hechos en pasado (posteriores a la planificación)', past);
      ok(f.elementos.every((r) => item(r.codigo).createdAt <= sp.start), id + ': ningún elemento se creó después de la planificación');
      const cap = PM.res.teamCapacity({ data: resKnown, schedule, sprint: sp, cal, settings: st, velocity: vel });
      const hol = []; for (let d = sp.start; d <= sp.end; d = D.add(d, 1)) if (cal.holidayName(d)) hol.push(d);
      ok(has(f.notasCapacidad, Fm.num(cap.personDays) + ' días-persona') && cap.personDays === cap.normal && has(f.notasCapacidad, team.length === 5 ? 'Cinco personas' : String(team.length)) && hol.every((h) => has(f.notasCapacidad, dlShort(h))) && has(f.notasCapacidad, closed.length ? n1(ref) + ' puntos' : String(ref) + ' puntos'), id + ': cálculo de la capacidad con los días-persona del catálogo (' + cap.personDays + '), los festivos de la iteración y la velocidad de referencia', f.notasCapacidad);
      ok(f.participantes.length >= 3 && has(f.participantes[0], 'Dueño del producto') && f.participantes.some((p) => /Scrum Master/.test(p)) && f.participantes.some((p) => /Desarrolladores \(cinco personas\)/.test(p)), id + ': participantes: dueño del producto, Scrum Master y desarrolladores');
      ok(sp.docs && sp.docs.planificacion === id, id + ': la iteración la tiene vinculada como su planificación (SPRINT_DOCS de 94), así «Releases e iteraciones» la abre y no ofrece crear otra', sp.docs);
      ok(cal.isWork(sp.start) && V[id].cur.date === sp.start, id + ': aprobada el primer día de la iteración (día hábil)');
    }
    {
      const cc1Req = items.find((x) => x.type === 'epica' && (x.tags || []).includes('CC-001')).createdAt;
      const f1 = V[PLANS[0]].cur.fields, f3 = V[PLANS[2]].cur.fields, f4 = V[PLANS[3]].cur.fields, f5 = V[PLANS[4]].cur.fields;
      const s3 = s(3), s4 = s(4), s5 = s(5);
      ok(f1.velocidadReferencia === 30 && has(f1.notasCapacidad, 'plan de releases') && f1.compromiso < f1.capacidad, 'iteración 1: sin iteraciones cerradas usa la velocidad supuesta del plan de releases (30) y compromete menos que la capacidad');
      ok(has(f1.riesgos, (/de (\d+) referencias/.exec(item('TA-002').acceptance) || [])[1] + ' referencias') && has(f1.riesgos, range(lbT('t21').start, lbT('t21').finish)) && has(f1.riesgos, 'EDT ' + tree.codes.get('w41')), 'iteración 1: depuración (EDT), carga de prueba de TA-002 y formación de usuarios clave de la LB0');
      ok(s3.committed - s3.capacity === 1 && has(f3.notasCapacidad, 'un punto más que la capacidad') && f3.elementos.some((r) => r.codigo === 'HU-006') && item('HU-006').priority === 'Debería tener', 'iteración 3: compromiso 34 frente a capacidad 33, con HU-006 («Debería tener») como la primera que sale');
      const epic8 = items.find((x) => x.type === 'epica' && x.createdAt === cc1Req);
      const bas3 = items.filter((x) => x.type === 'historia' && x.createdAt === cc1Req && x.releaseId === 'rel-1').sort((a, b) => a.rank - b.rank).map((x) => x.code);
      ok(has(f3.riesgos, 'sus historias (épica ' + epic8.code + ': ' + bas3.slice(0, -1).join(', ') + ' y ' + bas3[bas3.length - 1] + ')'), 'iteración 3: la épica ' + epic8.code + ' se nombra como épica, no como historia', f3.riesgos);
      ok(!/CC-001/.test(text(f3)) && has(f3.riesgos, dl(cc1Req)) && cc1Req < s3.start && rel('rel-1').baseline.date > s3.start && has(f3.riesgos, dl(task('t16').actualFinish)) && has(f3.riesgos, ['', 'un', 'dos', 'tres', 'cuatro'][cal.countWork(lbT('t16').finish, task('t16').actualFinish) - 1] + ' días hábiles después'), 'iteración 3 (12 de agosto): la solicitud de las básculas sigue en análisis (sin citar el CC-001, aprobado el 13) y la depuración termina tres días hábiles después de la LB0');
      const bas = items.filter((x) => x.type === 'historia' && x.createdAt === cc1Req && x.releaseId === 'rel-1');
      ok(bas.every((x) => f4.elementos.some((r) => r.codigo === x.code)) && has(f4.notasCapacidad, sum(bas, (x) => x.estimate) + ' puntos') && has(f4.riesgos, 'HU-006 y HU-014 (' + (item('HU-006').estimate + item('HU-014').estimate) + ' puntos') && has(f4.riesgos, dl(lbT('t29').start)) && has(f4.riesgos, range(lbT('t17').start, lbT('t17').finish)) && has(f4.riesgos, range(lbT('t22').start, lbT('t22').finish)), 'iteración 4: historias de las básculas (CC-001), elementos diferibles, conteo físico y salida a producción de la LB0');
      const df5 = f5.elementos.filter((r) => r.codigo.startsWith('DF-'));
      ok(has(f5.riesgos, R2.baseline.points + ' puntos') && R2.baseline.date === s5.start && has(f5.riesgos, sum(df5, (r) => r.estimacion) + ' puntos') && df5.every((r) => has(f5.riesgos, r.codigo)) && has(f5.riesgos, dl(task('t15').actualFinish)) && golive1 === s5.start, 'iteración 5: línea base del release 2 (' + R2.baseline.points + ' puntos) comprometida ese día, salida del release 1 el mismo día, defectos del release 1 y ambiente de habilitación');
      ok(!/incapacidad/i.test(text(f5)) && has(f5.notasCapacidad, 'sin ausencias previstas') && PM.res.teamCapacity({ data: resources, schedule, sprint: s5, cal, settings: st, velocity: velAt(D.add(s5.start, -1)) }).personDays < 40, 'iteración 5: la incapacidad médica del desarrollador ERP no se conocía al planificar (40 días-persona previstos; 37 reales)');
      ok(has(f4.notasCapacidad, 'iteraciones 2 y 3 terminaron ' + s(2).completed + ' puntos cada una') && s(2).completed === s(3).completed, 'iteración 4: compromiso explicado con las iteraciones 2 y 3, como en el acta de revisión de la iteración 3');
      /* regresión (revisión cruzada): al planificar la iteración 2 las tabletas importadas ya estaban instaladas (con retraso frente
         a la LB0, INC-001); las tabletas de prueba del implementador cubren su configuración, no su llegada */
      const f2 = V[PLANS[1]].cur.fields, t14f = task('t14').actualFinish;
      ok(t14f < s(2).start && t14f > lbT('t14').finish && has(f2.riesgos, 'instalados el ' + dl(t14f)) && /INC-001/.test(f2.riesgos) && /tabletas de prueba del implementador/.test(f2.riesgos) && !/por el retraso de las tabletas importadas/.test(f2.riesgos), 'iteración 2: equipos de bodega instalados antes de la iteración (con el retraso de INC-001) y tabletas de prueba mientras se configuran', f2.riesgos);
      const p6 = docOf('planificacion-sprint--it6'), p7 = docOf('planificacion-sprint--it7');
      ok(p6 && p7 && p6.titleBlock.codigo === meta.code + '-PIT-06' && p7.titleBlock.codigo === meta.code + '-PIT-07' && p6.seq === 6 && p7.seq === 7, 'las planificaciones de las iteraciones 6 y 7 (95) siguen con los consecutivos 06 y 07', [p6 && p6.titleBlock.codigo, p7 && p7.titleBlock.codigo]);
    }

    /* ---------- acta de constitución del equipo */
    {
      const id = 'acta-constitucion-equipo', f = V[id].cur.fields, f0 = revF(id, '0');
      const cat = (key) => resources.items.find((x) => x.id === 'rec-' + key);
      const raci = await P('/tools/raci');
      const planRaci = raci && raci.rows.find((r) => r.activity === 'Planificación de la iteración');
      const dodPolicies = dod.fields.politicasFlujo || [];
      const orgOf = (r) => (r.origin === 'Interno' ? 'Ingeniería y Alquiler S.A.S.' : r.supplier + ' (contratista)');
      const want = [['Dueño del producto (Gerente administrativo y financiero)', cat('po')], [cat('sm').name, cat('sm')], ...team.map((x) => [x.name, x]), [cat('lim').name, cat('lim')]];
      for (const [v, name] of [[f, 'rev. 1'], [f0, 'rev. 0']]) {
        ok(JSON.stringify(v.firmantes.map((r) => [r.rol, r.organizacion])) === JSON.stringify(want.map(([rol, r]) => [rol, orgOf(r)])) && v.firmantes.every((r) => r.fecha === LB.date), 'acta del equipo (' + name + '): firman el dueño del producto, el Scrum Master, los ' + team.length + ' desarrolladores del catálogo y el líder del implementador, con su organización, el día de la LB0');
        ok(v.valores.length === 4 && /objetivo de la iteración/.test(v.valores[0]) && /tablero/.test(v.valores[1]) && /implementador/.test(v.valores[2]) && /facturación/.test(v.valores[3]), 'acta del equipo (' + name + '): los cuatro valores');
        const T = PM.exampleDocs.erpEquipo.TIMEBOX;
        ok(has(v.pautasReuniones, T.diaria + ' minutos') && has(v.pautasReuniones, 'máximo ' + T.planificacion + ' horas') && has(v.pautasReuniones, '(' + T.revision + ' horas)') && has(v.pautasReuniones, n1(T.retrospectiva) + ' horas') && T.planificacion === 8 * st.sprintLength / 20 && T.revision === 4 * st.sprintLength / 20 && T.retrospectiva === 3 * st.sprintLength / 20, 'acta del equipo (' + name + '): duración de los eventos proporcional a la Guía de Scrum para iteraciones de ' + st.sprintLength + ' días hábiles');
        ok(/R-005/.test(text(v.acuerdos)) && docOf('registro-riesgos').fields.riesgos.some((r) => r.id === 'R-005') && /definición de listo y de terminado/.test(text(v.acuerdos)) && !/\d+ en «En curso»/.test(text(v)), 'acta del equipo (' + name + '): respuesta a R-005 y remisión a la definición de terminado sin repetir los límites WIP');
        ok(has(v.vigencia, dl(LB.date)) && has(v.vigencia, dl(meta.end)), 'acta del equipo (' + name + '): vigencia de la LB0 al cierre del proyecto');
        /* toma de decisiones según la RACI del proyecto (planificación: desarrolladores RA, dueño del producto C) y la Guía de Scrum 2020 */
        ok(planRaci && /A/.test(planRaci.cells['rol-dt'] || '') && !/A/.test(planRaci.cells['rol-po'] || '') && has(v.tomaDecisiones, 'los desarrolladores seleccionan con él los elementos de la iteración') && !/dueño del producto decide[^.]*alcance de cada iteración/.test(v.tomaDecisiones), 'acta del equipo (' + name + '): los desarrolladores seleccionan los elementos de la iteración y el dueño del producto ordena el backlog y acepta, como en la RACI', v.tomaDecisiones);
        ok(!/según lo que establece ese contrato/.test(v.resolucionConflictos) && has(v.resolucionConflictos, 'acuerdo de este equipo'), 'acta del equipo (' + name + '): la regla de dos días hábiles es un acuerdo del equipo, no una cláusula del contrato de implementación', v.resolucionConflictos);
        const repeated = v.acuerdos.filter((a) => !/esta acta no los repite/.test(a) && dodPolicies.some((pol) => has(a, pol.split(/[:;]/)[0])));
        ok(!repeated.length, 'acta del equipo (' + name + '): ningún acuerdo repite una política del tablero de la definición de terminado', repeated);
      }
      const cites = [...text(f.acuerdos).matchAll(/retrospectiva de la iteración (\d+)/g)].map((m) => Number(m[1]));
      ok([1, 2, 3].every((n) => cites.includes(n)) && cites.every((n) => { const r = docOf('retrospectiva--it' + n); return r && r.fields.fecha <= V[id].cur.date; }) && !/retrospectiva/.test(text(f0.acuerdos)), 'acta del equipo: la rev. 1 recoge los acuerdos de las retrospectivas 1 a 3 (todas anteriores o del mismo día); la rev. 0 no cita retrospectivas', cites);
      ok(f.acuerdos.length === f0.acuerdos.length + 4, 'acta del equipo: la rev. 1 agrega cuatro acuerdos a la rev. 0');
      ok(f.acuerdos.some((a) => /retrospectiva de la iteración 3/.test(a) && /reunión diaria/.test(a) && /definición de terminado rev\. 1/.test(a)) && dod.rev === '1' && String(dod.titleBlock.fechaAprobacion) <= V[id].cur.date, 'acta del equipo: el acuerdo de la retrospectiva 3 es de conducta (pruebas de usuario coordinadas en la reunión diaria) y remite a la definición de terminado rev. 1, aprobada antes o el mismo día');
    }

    /* ---------- plan de involucramiento de los interesados */
    {
      const id = 'plan-involucramiento-interesados', f = V[id].cur.fields, f0 = revF(id, '0');
      const regRevs = await revsOf('registro-interesados');
      const reg1 = regRevs.find((r) => r.rev === '1');
      ok(String(reg1.date).slice(0, 10) === LB.date && reg.rev === '2' && regDate === V[id].cur.date, 'plan de involucramiento: rev. 0 con el registro de interesados rev. 1 (LB0) y rev. 1 con su rev. 2 (' + regDate + ')');
      const NIV = optsOf(id, 'involucramiento', 'nivelActual'), FR = optsOf(id, 'involucramiento', 'frecuencia');
      for (const [v, regRows, name] of [[f, reg.fields.interesados, 'rev. 1'], [f0, reg1.fields.interesados, 'rev. 0']]) {
        ok(JSON.stringify(v.involucramiento.map((r) => [r.interesado, r.nivelActual, r.nivelDeseado])) === JSON.stringify(regRows.map((r) => [r.nombre, r.nivelActual, r.nivelDeseado])), 'plan de involucramiento (' + name + '): un renglón por interesado del registro, con su nivel actual y deseado a la misma fecha', v.involucramiento.map((r) => [r.interesado, r.nivelActual, r.nivelDeseado]));
        ok(v.involucramiento.every((r) => NIV.includes(r.nivelActual) && NIV.includes(r.nivelDeseado) && FR.includes(r.frecuencia) && r.estrategia.length > 40 && r.responsable), 'plan de involucramiento (' + name + '): niveles y frecuencias de la plantilla, estrategia y responsable en cada renglón');
        const gaps = v.involucramiento.filter((r) => NIV.indexOf(r.nivelActual) === NIV.indexOf(r.nivelDeseado));
        ok(gaps.every((r) => /^Mantener/.test(r.estrategia)), 'plan de involucramiento (' + name + '): quien ya está en el nivel deseado tiene estrategia de «Mantener»', gaps.map((r) => r.interesado));
        const bod = v.involucramiento.find((r) => r.interesado === 'Personal de bodega y conductores');
        const r003 = docOf('registro-riesgos').fields.riesgos.find((r) => r.id === 'R-003');
        ok(bod && has(bod.estrategia, 'R-003') && has(bod.estrategia, 'más de ' + pctIn(r003.disparador)) && /dos semanas/.test(bod.estrategia) && /formatos en papel/.test(bod.estrategia), 'plan de involucramiento (' + name + '): bodega con capacitación, acompañamiento, retiro del papel y el disparador de R-003 (' + pctIn(r003.disparador) + ')');
      }
      ok(f0.involucramiento.find((r) => r.interesado === 'Jefe de almacén').nivelActual === 'Reticente' && f.involucramiento.find((r) => r.interesado === 'Jefe de almacén').nivelActual === 'Neutral' && /Pasó a neutral/.test(f.involucramiento.find((r) => r.interesado === 'Jefe de almacén').estrategia) && !/Pasó a neutral/.test(text(f0)), 'plan de involucramiento: almacén y bodega pasan de reticentes a neutrales en la rev. 1, después de la salida del release 1');
      const t23 = lbT('t23');
      /* cierre mensual: cinco primeros días hábiles del mes; facturación, cartera y contabilidad no se capacitan en él (plan de gestión de las comunicaciones) */
      let c0 = D.startOfMonth(t23.finish); while (!cal.isWork(c0)) c0 = D.add(c0, 1);
      const novClose = [0, 1, 2, 3, 4].map((k) => cal.addWork(c0, k));
      const t23Days = []; for (let d = t23.start; d <= t23.finish; d = D.add(d, 1)) if (cal.isWork(d)) t23Days.push(d);
      const finDays = t23Days.filter((d) => !novClose.includes(d));
      const finTxt = finDays.map((d, i) => 'el ' + (i < finDays.length - 1 && finDays[i + 1].slice(0, 7) === d.slice(0, 7) ? String(+d.slice(8)) : dlShort(d))).join(', ').replace(/, (el [^,]+)$/, ' y $1');
      const facRow = f.involucramiento.find((r) => r.interesado === 'Jefe de facturación y cartera');
      ok(t23Days.some((d) => novClose.includes(d)) && finDays.length >= 1 && finDays.every((d) => d < novClose[0]) && has(facRow.estrategia, finTxt + ', los días de la ventana') && has(facRow.estrategia, range(novClose[0], novClose[4])) && has(f.requisitosFase, finTxt + ', los días de la ventana') && has(f.requisitosFase, 'cierre mensual de noviembre (' + range(novClose[0], novClose[4]) + ')'), 'plan de involucramiento (rev. 1): facturación, cartera y contabilidad se capacitan ' + finTxt + ', fuera del cierre mensual de noviembre (' + range(novClose[0], novClose[4]) + '), como exige el plan de gestión de las comunicaciones', [facRow.estrategia, f.requisitosFase]);
      ok(!has(facRow.estrategia, '(' + range(t23.start, t23.finish) + ').') && !has(f.requisitosFase, 'capacitación (' + range(t23.start, t23.finish) + ')'), 'plan de involucramiento (rev. 1): la ventana completa de la LB0 ya no se presenta como fechas de capacitación de facturación, cartera y contabilidad');
      const pgc = docOf('plan-gestion-comunicaciones');
      if (pgc) ok(/capacitaciones de facturación, cartera y contabilidad/.test(pgc.fields.restricciones || ''), 'el plan de gestión de las comunicaciones trae la restricción de capacitación en el cierre mensual que cita el plan de involucramiento');
      ok(has(f.requisitosFase, range(t23.start, t23.finish)) && has(f.requisitosFase, dl(lbT('t31').start)) && has(f.impactoCambio, dl(golive1)) && has(f0.requisitosFase, dl(lbT('t29').start)) && has(f0.requisitosFase, range(lbT('t21').start, lbT('t21').finish)) && has(f0.requisitosFase, range(lbT('t22').start, lbT('t22').finish)), 'plan de involucramiento: fechas de la capacitación del release 2, de las salidas y de la formación de usuarios clave de la LB0', [f.requisitosFase, f0.requisitosFase]);
      ok(/plan de gestión de las comunicaciones/.test(f.informacionDistribuir) && /registro de interesados/.test(f.actualizacion), 'plan de involucramiento: remite a la matriz del plan de gestión de las comunicaciones y se actualiza con el registro de interesados');
    }

    /* ---------- documentos de prueba y evaluación */
    {
      const id = 'documentos-prueba', f = V[id].cur.fields, f0 = revF(id, '0'), f1 = revF(id, '1');
      const TP = optsOf(id, 'pruebas', 'tipo'), FR = optsOf(id, 'pruebas', 'frecuencia');
      for (const [v, n, nv, name] of [[f, 13, 18, 'rev. 2A'], [f1, 10, 12, 'rev. 1'], [f0, 8, 10, 'rev. 0']]) {
        ok(v.pruebas.length === n && v.pruebas.every((r, i) => r.codigo === 'PR-' + String(i + 1).padStart(2, '0') && TP.includes(r.tipo) && FR.includes(r.frecuencia) && r.documento && r.entregable && r.criterio && r.responsable && r.evidencia), 'documentos de prueba (' + name + '): ' + n + ' documentos con código consecutivo, tipo y frecuencia de la plantilla', v.pruebas.map((r) => [r.codigo, r.tipo, r.frecuencia]));
        ok(v.itemsVerificacion.length === nv && v.itemsVerificacion.every((r) => r.item && r.criterio && r.referencia) && !/andamio|anclaje|plataforma/i.test(text(v.itemsVerificacion)), 'documentos de prueba (' + name + '): lista de verificación del ERP (' + nv + ' ítems), no la del andamio de la plantilla');
        ok(v.pruebas.slice(0, 8).every((r, i) => r.documento === f.pruebas[i].documento), 'documentos de prueba (' + name + '): los documentos conservan su código entre revisiones');
      }
      const row = (doc) => f.pruebas.find((r) => r.documento.startsWith(doc));
      ok(row('Conciliación del inventario').criterio === node('w42').acceptance && row('Conciliación de los saldos').criterio === node('w43').acceptance && row('Verificación de las hojas').criterio === node('w44').acceptance && row('Prueba de aceptación del release').criterio.startsWith(node('w6').acceptance) && row('Pruebas de habilitación').criterio.startsWith(node('w7').acceptance) && row('Ensayo de corte').criterio.startsWith(node('w9').acceptance.split(';')[0]), 'documentos de prueba: criterios de aceptación iguales a los del diccionario de la EDT (1.4.2, 1.4.3, 1.4.4, 1.6, 1.7 y 1.9)');
      const it4 = C.sprintsOfRelease(sprints, 'rel-1').slice(-1)[0], it6 = sprints.filter((x) => x.status === 'cerrado').slice(-1)[0];
      const uatDf = items.filter((x) => x.type === 'defecto' && /prueba de aceptación del release 1/i.test(x.description)).map((x) => x.code).sort();
      ok(has(row('Prueba de aceptación del release').evidencia, 'firmada el ' + dl(it4.end)) && uatDf.length === 4 && uatDf.every((c) => has(row('Prueba de aceptación del release').evidencia, c)) && uatDf.every((c) => item(c).releaseId === 'rel-2'), 'documentos de prueba: prueba de aceptación del release 1 firmada el día de su última revisión con los defectos menores del backlog (' + uatDf.join(', ') + ')');
      const ta8 = item('TA-008');
      ok(has(row('Ensayo de corte').evidencia, dl(ta8.doneDate)) && has(row('Ensayo de corte').evidencia, pctIn(task('t17').notes)) && has(row('Conciliación del inventario').evidencia, pctIn(task('t17').notes)) && pctIn(task('t17').notes) === '0,4 %' && pctIn(node('w42').acceptance) === '0,5 %' && has(row('Ensayo de corte').evidencia, dl(golive1)), 'documentos de prueba: ensayo de corte (TA-008) y conciliación del inventario con el 0,4 % del cronograma frente a la meta de 0,5 % de la EDT');
      const acc = items.filter((x) => A.countable(x) && A.isDone(st, x) && x.doneDate && x.doneDate <= it6.end);
      const pts = sum(sprints.filter((x) => x.status === 'cerrado'), (x) => x.completed);
      ok(has(f.pruebas[0].evidencia, acc.length + ' elementos aceptados (' + pts + ' puntos)') && pts === sum(acc, (x) => x.estimate), 'documentos de prueba: ' + acc.length + ' elementos aceptados (' + pts + ' puntos, la suma de las velocidades) en las iteraciones cerradas', f.pruebas[0].evidencia);
      const uat = items.filter((x) => (x.history || []).some((h) => h.status === 'pruebas-usuario' && h.date <= cut));
      const uatRow = f.pruebas.find((r) => /Pruebas de usuario/.test(r.documento));
      ok(has(uatRow.evidencia, uat.length + ' elementos pasaron por la columna y ' + uat.filter((x) => A.isDone(st, x)).length + ' fueron aceptados') && uat.every((x) => x.history.find((h) => h.status === 'pruebas-usuario').date >= sprints[3].start), 'documentos de prueba: elementos que pasaron por «Pruebas de usuario» (desde la iteración 4) y aceptados, contados en el historial del backlog');
      const scale = f.pruebas.find((r) => /básculas/.test(r.documento));
      ok(has(scale.criterio, 'supera ' + pctIn(item('HU-040').acceptance)) && has(scale.evidencia, 'DF-006') && item('DF-006').sprintId === sprints[4].id && !/dos bodegas/.test(f1.pruebas.find((r) => /básculas/.test(r.documento)).criterio), 'documentos de prueba: integración con las básculas con el umbral de HU-040 (' + pctIn(item('HU-040').acceptance) + '); la rev. 2A agrega la prueba con las dos bodegas después de DF-006');
      const dian = f.pruebas.find((r) => /Pruebas de habilitación/.test(r.documento));
      ok(has(dian.evidencia, 'HU-032') && item('HU-032').doneDate <= it6.end && has(dian.evidencia, dl(it6.end)) && !A.isDone(st, item('HU-033')), 'documentos de prueba: primera factura aceptada (HU-032) y HU-033 rechazada en la revisión de la iteración 6');
      const n = (/Las (\d+) reglas/.exec(item('ME-009').acceptance) || [])[1];
      ok(n && has(f.pruebas.find((r) => /anexo técnico/.test(r.documento)).evidencia, 'las ' + n + ' reglas'), 'documentos de prueba: las ' + n + ' reglas de rechazo de IN-004 (criterios de ME-009)');
      const i4 = inc.find((r) => r.id === 'INC-004'), i3 = inc.find((r) => r.id === 'INC-003');
      ok(has(f.pruebas.find((r) => /carril de urgencia/.test(r.documento)).evidencia, dl(i4.fecha)) && item('DF-009').doneDate === i4.fecha && has(row('Conciliación de los saldos').evidencia, i3.id) && item('TA-011').blocked, 'documentos de prueba: DF-009 verificado en producción (INC-004) y conciliación de cartera pendiente (INC-003, TA-011 bloqueada)');
      const note1 = V[id].revs.find((r) => r.rev === '1').note;
      ok(/^Retrospectiva de la iteración 3 \(prueba con datos migrados y columna «Pruebas de usuario»\) y prueba de la integración con las básculas del CC-001\.$/.test(note1), 'documentos de prueba: la nota de la rev. 1 atribuye las básculas al CC-001, no a la retrospectiva de la iteración 3', note1);
      ok(!/Al corte|Pendiente|firmada el/.test(text(f0.pruebas) + text(f1.pruebas)) && /CC-001/.test(text(f1)) && !/CC-001/.test(text(f0)), 'documentos de prueba: las revisiones 0 y 1 no tienen resultados; la integración con las básculas entra en la rev. 1 (CC-001 aprobado antes)');
      ok(/interno/.test(f.aprobacionCliente) && /revisoría fiscal/.test(f.aprobacionCliente) && /dueño del producto/.test(f.aprobacionCliente) && has(f.archivo, meta.code), 'documentos de prueba: validación por los roles del proyecto interno (sin cliente ni interventoría) y archivo del proyecto');
    }

    /* ---------- enfoque de la metodología */
    ok(PM.docApproach && PM.docApproach('planificacion-sprint').id === 'adaptativo' && ['acta-constitucion-equipo', 'plan-involucramiento-interesados', 'documentos-prueba'].every((tid) => PM.docApproach(tid).id === 'ambos'), 'la planificación es del enfoque ágil y los otros tres documentos de ambos enfoques (11-doc-approach)');
    return out;
  }, { MINE, PLANS });
}

/* ============================================================== ejecución */
section('Datos y cifras de los documentos del equipo (' + file + ')');
{
  const app = await openApp({ file });
  try {
    const res = await validateInPage(app.page);
    for (const r of res) check(r.ok, r.msg, r.extra);
    check(!app.errors.length, 'sin errores de consola al construir e importar', app.errors);
  } finally { await app.browser.close(); }
}

section('Interacción: selector de ejemplos, lista de documentos, filtro de enfoque y teclado');
{
  const app = await openApp({ file, width: 1360, height: 900 });
  const { page, errors } = app;
  try {
    /* portafolio vacío: Tab hasta «Crear proyecto de ejemplo» y Enter; en el selector, Tab hasta la tarjeta del ERP y Enter */
    const n = await page.evaluate(() => PM.examples.length);
    check(n > 1 && (await page.evaluate(() => PM.getState().view)) === 'portafolio', 'la aplicación abre en el portafolio con varios ejemplos disponibles', n);
    const focusByTab = async (test, arg, max = 60) => { for (let k = 0; k < max; k++) { await page.keyboard.press('Tab'); if (await page.evaluate(test, arg)) return true; } return false; };
    const onCreate = await focusByTab(() => { const a = document.activeElement; return !!a && a.tagName === 'BUTTON' && a.textContent.trim() === 'Crear proyecto de ejemplo'; });
    check(onCreate, 'con Tab el foco llega al botón «Crear proyecto de ejemplo» del portafolio');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.example-card', { timeout: 8000 });
    check(await page.locator('.example-card[aria-label*="ERP"]').count() === 1, 'el selector ofrece el ejemplo del ERP');
    const onCard = await focusByTab(() => { const a = document.activeElement; return !!a && a.classList.contains('example-card') && /ERP/.test(a.getAttribute('aria-label') || ''); }, null, 20);
    check(onCard, 'con Tab el foco llega a la tarjeta del ejemplo del ERP en el selector');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => PM.getState().projectId && PM.getState().view === 'tablero', null, { timeout: 25000 });
    await page.waitForTimeout(700);
    const code = await page.evaluate(async () => (await PM.store.get(PM.paths.project(PM.getState().projectId))).code);
    check(code === 'PRY-2026-021', 'ejemplo del ERP creado desde el selector con el teclado', code);
    /* riel: «Documentos» */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForFunction(() => PM.getState().view === 'documentos', null, { timeout: 8000 });
    await page.waitForSelector('tr[data-doc]', { timeout: 10000 });
    const rowsInfo = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => ({ key: tr.getAttribute('data-doc'), ap: tr.getAttribute('data-approach'), code: (tr.querySelector('.docs-c-code') || {}).textContent || '', status: (tr.querySelector('.docs-c-status') || {}).textContent || '', rev: (tr.querySelector('.docs-c-rev') || {}).textContent || '' })));
    const want = { 'acta-constitucion-equipo': ['ACE', 'Aprobado', '1', 'ambos'], 'plan-involucramiento-interesados': ['PIIN', 'Aprobado', '1', 'ambos'], 'documentos-prueba': ['DPE', 'En revisión', '2A', 'ambos'] };
    PLANS.forEach((k, i) => { want[k] = ['PIT-0' + (i + 1), 'Aprobado', '0', 'adaptativo']; });
    const rowBad = Object.entries(want).filter(([key, [ab, stt, rv, ap]]) => { const r = rowsInfo.find((x) => x.key === key); return !r || norm(r.code).trim() !== 'PRY-2026-021-' + ab || !norm(r.status).includes(stt) || !norm(r.rev).trim().endsWith(rv) || (r.ap !== null && r.ap !== ap); });
    check(!rowBad.length, 'lista maestra: los nueve documentos con código, estado, revisión y enfoque', rowBad.map(([k]) => [k, rowsInfo.find((x) => x.key === k)]));
    const parent = await page.evaluate(() => { const tr = document.querySelector('tr.docs-parent[data-tid="planificacion-sprint"]'); return tr ? tr.textContent : ''; });
    check(/7 documentos/.test(norm(parent)), 'lista maestra: la fila de «Planificación de la iteración» agrupa las siete planificaciones', parent.slice(0, 200));
    if (shots) await page.screenshot({ path: shots + '/documentos.png', fullPage: false });
    /* filtro «Enfoque de la metodología» con el teclado (lista nativa) */
    const apSel = page.getByLabel('Filtrar por enfoque de la metodología');
    check(await apSel.count() === 1, 'existe el filtro «Enfoque de la metodología» en la lista maestra');
    if (await apSel.count()) {
      await apSel.focus();
      for (let k = 0; k < 6 && (await apSel.inputValue()) !== 'adaptativo'; k++) await page.keyboard.press('ArrowDown');
      check((await apSel.inputValue()) === 'adaptativo', 'el filtro de enfoque llega a «ágil o adaptativo» con las flechas del teclado');
      await page.waitForTimeout(400);
      const vis = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => tr.getAttribute('data-doc')));
      check(PLANS.every((k) => vis.includes(k)) && !vis.includes('documentos-prueba') && !vis.includes('acta-constitucion-equipo'), 'filtrado por enfoque ágil: aparecen las planificaciones y no los documentos de ambos enfoques', vis.filter((k) => /planificacion|prueba|equipo/.test(k)));
      for (let k = 0; k < 6 && (await apSel.inputValue()) !== 'ambos'; k++) await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(400);
      const vis2 = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => tr.getAttribute('data-doc')));
      check(['acta-constitucion-equipo', 'plan-involucramiento-interesados', 'documentos-prueba'].every((k) => vis2.includes(k)) && !vis2.some((k) => k.startsWith('planificacion-sprint')), 'filtrado por «ambos enfoques»: aparecen el acta del equipo, el plan de involucramiento y los documentos de prueba', vis2.filter((k) => /planificacion|prueba|equipo|involucramiento/.test(k)));
      if (shots) await page.screenshot({ path: shots + '/documentos-ambos.png', fullPage: false });
      for (let k = 0; k < 8 && (await apSel.inputValue()) !== ''; k++) await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }
    /* teclado: buscar y abrir los documentos de prueba con Tab y Enter */
    const search = page.getByLabel('Buscar documentos');
    await search.click();
    await page.keyboard.type('prueba y evaluación');
    await page.waitForTimeout(400);
    let reached = false;
    for (let k = 0; k < 40 && !reached; k++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && a.textContent.trim() === 'Documentos de prueba y evaluación'; });
    }
    check(reached, 'con Tab el foco llega al enlace «Documentos de prueba y evaluación» de la lista filtrada');
    const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; });
    check(ring, 'el enlace enfocado muestra el foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="documentos-prueba"] [data-section]', { timeout: 10000 });
    const dpe = await editorText(page, 'documentos-prueba');
    check(/PRY-2026-021-DPE/.test(dpe) && /Prueba de aceptación del release \(UAT\)/.test(dpe) && /Lista de chequeo del anexo técnico/.test(dpe) && /En revisión/.test(dpe) && !/[Aa]ndamio/.test(dpe), 'los documentos de prueba abren con Enter en el editor (código, pruebas del ERP, lista del anexo técnico, estado)');
    check(!(await errorCards(page)).length, 'los documentos de prueba abren sin tarjetas de error');
    if (shots) await page.screenshot({ path: shots + '/documentos-prueba.png', fullPage: true });
    /* planificación de la iteración 3: buscar y abrir con el teclado */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 8000 });
    await page.getByLabel('Buscar documentos').fill('');
    await page.getByLabel('Buscar documentos').click();
    await page.keyboard.type('Iteración 3');
    await page.waitForTimeout(400);
    const link = page.locator('tr[data-doc="planificacion-sprint--it3"] .docs-link');
    check(await link.count() === 1, 'la búsqueda «Iteración 3» encuentra su planificación');
    await link.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="planificacion-sprint--it3"] [data-section]', { timeout: 10000 });
    const p3 = await editorText(page, 'planificacion-sprint--it3');
    check(/PRY-2026-021-PIT-03/.test(p3) && /HU-006/.test(p3) && /HU-012/.test(p3) && /un punto más que la capacidad/.test(p3) && /Aprobado/.test(p3), 'la planificación de la iteración 3 abre con Enter (código, elementos y compromiso por encima de la capacidad)');
    if (shots) await page.screenshot({ path: shots + '/planificacion-it3.png', fullPage: true });
    /* «Releases e iteraciones»: la iteración 1 abre su planificación (PIT-01) y no ofrece crear otra */
    const countPlans = () => page.evaluate(async () => (await PM.store.list(PM.paths.docs(PM.getState().projectId))).filter((d) => d.id.startsWith('planificacion-sprint')).length);
    const plansBefore = await countPlans();
    await page.locator('button.nav-item', { hasText: 'Releases e iteraciones' }).first().click();
    await page.waitForFunction(() => PM.getState().view === 'iteraciones', null, { timeout: 8000 });
    await page.locator('[data-release-id="rel-1"]').first().click();
    await page.waitForSelector('tr[data-sprint-id="spr-01"] button.ags-link', { timeout: 8000 });
    await page.locator('tr[data-sprint-id="spr-01"] button.ags-link').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-role="sprint-docs"] [data-doc-kind="planificacion"]', { timeout: 8000 });
    const card = page.locator('[data-role="sprint-docs"] [data-doc-kind="planificacion"]');
    const cardTxt = norm(await card.innerText());
    const linked = /Planificación de la iteración — Iteración 1 · Aprobado/.test(cardTxt) && !/Crear y abrir/.test(cardTxt);
    check(linked, 'iteración 1: la tarjeta «Planificación de la iteración» muestra PIT-01 aprobada con «Abrir», no «Crear y abrir» (requiere la planificación en SPRINT_DOCS de 94)', cardTxt);
    if (linked) {
      await card.locator('button', { hasText: 'Abrir' }).focus();
      await page.keyboard.press('Enter');
      await page.waitForSelector('.page[data-doc-id="planificacion-sprint--it1"] [data-section]', { timeout: 10000 });
      const p1 = await editorText(page, 'planificacion-sprint--it1');
      check(/PRY-2026-021-PIT-01/.test(p1) && /IN-001/.test(p1), 'Enter en «Abrir» abre la planificación de la iteración 1 (PIT-01)');
    }
    check(await countPlans() === plansBefore, 'abrir la planificación desde la iteración no crea otra planificación', [plansBefore, await countPlans()]);
    check(!(await errorCards(page)).length && !errors.length, 'sin tarjetas de error ni errores de consola', errors);
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Documentos del equipo en ' + variant.name);
    const app = await openApp({ file, width: variant.width, height: 900, dark: variant.dark });
    try {
      const pid = await createExample(app.page, 'erp');
      await app.page.waitForTimeout(600);
      check(!!pid, 'ejemplo creado');
      const bad = [];
      for (const id of MINE) {
        await app.page.evaluate((id) => PM.openDocument(id), id);
        await app.page.waitForSelector('.page[data-doc-id="' + id + '"] [data-section]', { timeout: 10000 });
        await app.page.waitForTimeout(250);
        const ov = await horizontalOverflow(app.page);
        const cardsErr = await errorCards(app.page);
        const w = variant.width === 1920 ? await app.page.evaluate(() => document.querySelector('.page').getBoundingClientRect().width) : null;
        if (ov > 1 || cardsErr.length || (w !== null && w < 1400)) bad.push({ id, ov, cards: cardsErr.length, w });
        if (shots && ['documentos-prueba', 'acta-constitucion-equipo', 'plan-involucramiento-interesados', PLANS[4]].includes(id)) await app.page.screenshot({ path: shots + '/' + id + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: false });
      }
      await gotoView(app.page, 'documentos');
      await app.page.waitForTimeout(300);
      const ovList = await horizontalOverflow(app.page);
      if (ovList > 1) bad.push({ id: 'documentos', ov: ovList });
      check(!bad.length, 'editor de los nueve documentos y lista sin desborde de página ni tarjetas de error' + (variant.width === 1920 ? ', a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

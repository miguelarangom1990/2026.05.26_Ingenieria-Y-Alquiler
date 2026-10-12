// Prueba de los documentos de comunicaciones del ejemplo ágil del ERP (src/97-example-erp-docs-comunicaciones.js): plan de
// gestión de las comunicaciones, registro de comunicaciones del proyecto y actas de reunión (comités y reuniones con decisiones).
// Uso: node test/example-erp-docs-comunicaciones.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y este módulo (sin los de otros grupos).
//   1) Datos (con el ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código, estado y
//      revisiones; todas las claves de su plantilla con contenido y opciones válidas; cada cifra igual a la que calcula la aplicación
//      (LB0, releases y velocidad con PM.calc y PM.agile, costo real de los releases, catálogo de recursos, cronograma) o a la de los
//      documentos de 95 (incidentes, riesgos, solicitud de cambio, informe de desempeño); calendario de reuniones coherente (comité
//      el jueves anterior a cada corte quincenal y periodo del informe de 95 sin traslape); restricciones del plan que cuadran con
//      el cronograma (ninguna salida real o planificada en el cierre mensual ni en el anual); ninguna fecha de un hecho pasa la
//      fecha de corte ni la del documento, y los documentos aprobados (y sus revisiones) no citan hechos posteriores a su fecha
//      (ni por código ni por fechas escritas en el texto que no sean planes conocidos a esa fecha); toda revisión aprobada tiene
//      aprobador en el cajetín. Revisión cruzada (con los otros módulos 97 si están cargados): criterios de la evaluación iguales
//      a los del documento de criterios, revisión del caso de negocio al cierre del release 1 registrada en su fecha, sesión
//      ordinaria del 24 de septiembre en el acta de octubre y reclamo con crédito de servicio.
//   2) Interacción: pulsa «Crear proyecto de ejemplo» con el teclado (Tab y Enter), elige el ERP en el selector con Tab y Enter,
//      abre «Documentos» con el riel, revisa la lista maestra (código, estado, revisión y enfoque), abre el plan de gestión de las
//      comunicaciones con Tab y Enter y llega con Tab al acta del CC-001 para abrirla con Enter.
//   3) Sin --quick: los ocho documentos en el editor en tema oscuro, a 400 px (claro y oscuro) y a 1920 px, sin desborde de página
//      ni tarjetas de error.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openApp, createExample, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const quick = args.includes('--quick');
const shots = opt('--shots');
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-erp-comunicaciones-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp-comunicaciones.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '1,2,3,4,5,6,7,8,90,91,92,93,94,95,96,97-example-erp-docs-comunicaciones'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const ACTAS = ['arranque', 'seleccion', 'lb0', 'cc001', 'salida-r1', 'comite-2026-10-08'].map((k) => 'acta-reunion--' + k);
const MINE = ['plan-gestion-comunicaciones', 'registro-comunicaciones', ...ACTAS];

/* ============================================================== 1: datos y cifras (en la página) */
async function validateInPage(page) {
  return page.evaluate(async ({ MINE, ACTAS }) => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, Fm = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const ms = (v) => plain(Fm.moneyShort(v, 'COP'));
    const dl = (iso) => plain(Fm.date(iso, 'long'));
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const text = (fields) => strings(fields).join(' \n ');
    const empty = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

    /* ---------- construcción e importación */
    const exm = PM.getExample('erp');
    ok(!!exm && PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts) && PM.exampleDocs.erpParts.length >= 1 && PM.exampleDocs.erpComunicaciones, 'módulo de comunicaciones registrado en PM.exampleDocs.erpParts');
    if (!exm) return out;
    const ex = exm.build({});
    ok(JSON.stringify(ex) === JSON.stringify(exm.build({ today: '2030-01-01' })), 'el constructor sigue siendo determinista con el módulo de comunicaciones');
    const pid = await PM.projectOps.importData(ex);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    const wbs = await P('/tools/wbs'), schedule = await P('/tools/schedule'), costs = await P('/tools/costs'), agile = await P('/tools/agile'), resources = await P('/tools/resources');
    const items = (await PM.store.list(PM.paths.backlog(pid))).map((d) => ({ ...d.data, id: d.id }));
    const docs = await PM.store.list(PM.paths.docs(pid));
    const docOf = (id) => { const d = docs.find((x) => x.id === id); return d ? d.data : null; };
    const revsOf = async (id) => (await PM.store.list(PM.paths.revs(pid, id))).map((r) => r.data).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    const cut = meta.statusDate;
    const cal = PM.cal.make(schedule.settings, meta.start);
    const tree = C.wbsTree(wbs.nodes);
    const LB = blDocs.map((b) => b.data).find((b) => b.number === 0);
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id);
    const task = (id) => schedule.tasks.find((t) => t.id === id);
    const st = A.settings(agile);
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const R1 = rel('rel-1'), R2 = rel('rel-2');
    const sprints = A.sortSprints(agile.sprints);
    const cat = (key) => resources.items.find((x) => x.id === 'rec-' + key);
    const item = (code) => items.find((i) => i.code === code);
    const tplKeys = (id) => PM.templates[id].sections.flatMap((s) => s.fields.map((f) => f.key));
    const optsOf = (tid, field, key) => { const f = PM.templates[tid].sections.flatMap((s) => s.fields).find((x) => x.key === field); return key ? f.columns.find((c) => c.key === key).options : f.options; };
    /* estado del backlog a una fecha (como F.releaseAt y F.velocityAt de 94) */
    const statusOn = (it, at) => { let s = PM.AGILE.BACKLOG; for (const h of it.history || []) if (h.date <= at) s = h.status; return s; };
    const itemsAt = (at) => items.filter((it) => !D.valid(it.createdAt) || it.createdAt <= at).map((it) => { const s = statusOn(it, at); return { ...it, status: s, doneDate: A.category(st, s) === 'terminado' ? it.doneDate : null }; });
    const sprintsAt = (at) => sprints.map((s) => (s.end <= at ? s : { ...s, status: s.start <= at ? 'en-curso' : 'planeado', completed: null, committed: s.start <= at ? s.committed : null }));
    const relAt = (id, at) => C.releaseProgress({ release: { id }, items: itemsAt(at), settings: st });
    const velAt = (at) => C.velocity({ sprints: sprintsAt(at), items: itemsAt(at), settings: st });
    /* fecha de cada hecho citable: elementos del backlog, cambios, incidentes y R-008 */
    const inc = docOf('registro-incidentes').fields.incidentes;
    const codeDates = Object.fromEntries(items.map((i) => [i.code, i.createdAt]));
    Object.assign(codeDates, { 'CC-001': R1.baseline.date, 'R-008': docOf('registro-riesgos').updatedAt.slice(0, 10) }, Object.fromEntries(inc.map((r) => [r.id, r.fecha])));
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    /* fechas escritas en el texto («9 de septiembre de 2026», «25 de mayo»: sin año se toma 2026) */
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const pad2 = (n) => String(n).padStart(2, '0');
    const datesIn = (txt) => { const out = []; const re = /\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?: de (20\d\d))?/g; const t = plain(txt); let m; while ((m = re.exec(t))) out.push((m[3] || '2026') + '-' + pad2(MONTHS.indexOf(m[2]) + 1) + '-' + pad2(+m[1])); return out; };
    /* cinco primeros días hábiles del mes (cierre mensual) y último día hábil del mes */
    const closeOf = (iso) => { const out = []; let d = D.startOfMonth(iso); while (out.length < 5) { if (cal.isWork(d)) out.push(d); d = D.add(d, 1); } return out; };
    const lastWorkOfMonth = (iso) => { let d = D.add(D.startOfMonth(D.add(D.startOfMonth(iso), 40)), -1); while (!cal.isWork(d)) d = D.add(d, -1); return d; };
    const golive1 = task('t29').actualFinish;
    const review = cal.addWork(golive1, 1);
    const informe = docs.find((d) => d.data.template === 'informe-desempeno').data;
    const lastCut = informe.fields.fechaCorte;
    const nInf = Number(/(\d+)/.exec(informe.fields.numeroInforme)[1]);
    const cuts = Array.from({ length: nInf }, (_, i) => D.add(lastCut, -14 * (nInf - 1 - i)));
    const it4 = C.sprintsOfRelease(sprints, 'rel-1').slice(-1)[0];
    const it6 = sprints.filter((s) => s.status === 'cerrado').slice(-1)[0];
    const comite = D.add(lastCut, -1);
    const approval = (d) => cal.addWork(d, 2);
    const meetings = { arranque: task('t02').actualFinish, seleccion: task('t09').actualFinish, lb0: LB.date, cc001: R1.baseline.date, 'salida-r1': it4.end, 'comite-2026-10-08': comite };
    const comites = [];
    for (let d = comite; d >= D.add(meetings.arranque, 14); d = D.add(d, -14)) comites.unshift(d);
    for (let d = D.add(comite, 14); d <= meta.end; d = D.add(d, 14)) comites.push(d);
    /* fechas que un documento puede nombrar antes de que ocurran porque son planes conocidos a su fecha (cada una con la
       fecha desde la que se conoce): LB0 (y el plan preliminar del arranque), hitos del acta de constitución, plan de
       releases, iteraciones y releases (desde la LB0), calendario de comités (desde el arranque) e informes (desde la LB0),
       último día de cada cierre mensual, fechas objetivo de los incidentes (desde su registro) y la decisión de R-008 */
    const planned = new Map();
    const addP = (from, ...ds) => ds.forEach((d) => { if (!d) return; const k = String(d).slice(0, 10); if (!planned.has(k) || planned.get(k) > from) planned.set(k, from); });
    LB.schedule.tasks.forEach((t) => addP(meta.start, t.start, t.finish)); addP(meta.start, LB.schedule.start, LB.schedule.finish);
    (await revsOf('acta-constitucion')).forEach((r) => (r.fields.hitos || []).forEach((h) => addP(String(r.date).slice(0, 10), h.fecha)));
    (await revsOf('plan-release')).forEach((r) => (r.fields && r.fields.releases ? r.fields.releases : []).forEach((x) => addP(String(r.date).slice(0, 10), x.fechaInicio, x.fechaFin)));
    sprints.forEach((x) => addP(LB.date, x.start, x.end)); agile.releases.forEach((r) => { addP(LB.date, r.start, r.end); if (r.baseline) addP(r.baseline.date || LB.date, r.baseline.end); });
    comites.forEach((d) => addP(meetings.arranque, d)); cuts.forEach((c) => addP(LB.date, c, cal.addWork(c, 1)));
    for (let m = D.startOfMonth(meta.start); m <= meta.end; m = D.startOfMonth(D.add(m, 40))) addP(meta.start, closeOf(m)[4]);
    inc.forEach((r) => addP(r.fecha, r.fechaObjetivo));
    addP(docOf('registro-riesgos').updatedAt.slice(0, 10), ...datesIn(((docOf('registro-riesgos').fields.riesgos.find((r) => r.id === 'R-008') || {}).respuesta) || ''));
    const isPlanned = (d, at) => planned.has(d) && planned.get(d) <= at;
    /* lo que un acta fija hacia adelante: fechas de sus decisiones y compromisos, próxima reunión y plazo de observaciones
       (y el pronóstico del release 2 en el acta de octubre) */
    const fcOct = C.releaseForecast({ release: R2, sprints: sprintsAt(it6.end), items: itemsAt(it6.end), settings: st, cal, statusDate: it6.end });
    const ownPlans = (f) => new Set([...(f.compromisos || []).map((c) => c.fecha), ...datesIn(strings(f.decisiones || []).join(' ')), f.proximaFecha, f.fecha ? cal.addWork(f.fecha, 2) : null, f.fecha === comite ? fcOct.finish : null].filter(Boolean));
    const lateDates = (fields, date) => { const own = ownPlans(fields); return [...new Set(strings(fields).flatMap(datesIn))].filter((d) => d > date && !isPlanned(d, date) && !own.has(d)); };
    const SPEC = {
      'plan-gestion-comunicaciones': { status: 'aprobado', rev: '1', date: review, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', review]] },
      'registro-comunicaciones': { status: 'revision', rev: '2A', date: cut, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', review]] },
    };
    ACTAS.forEach((id, i) => { const m = meetings[id.replace('acta-reunion--', '')]; SPEC[id] = i < 5 ? { status: 'aprobado', rev: '0', date: approval(m), revs: [], abbr: 'AREU-' + String(i + 1).padStart(2, '0'), meeting: m } : { status: 'revision', rev: 'A', date: m, revs: [], abbr: 'AREU-06', meeting: m }; });

    /* ---------- existencia, código, estado, revisiones, claves y fechas */
    const V = {};
    for (const id of MINE) {
      const d = docOf(id);
      if (!ok(d, 'existe el documento ' + id)) continue;
      const tid = d.template, s = SPEC[id], tb = d.titleBlock || {}, upd = String(d.updatedAt).slice(0, 10);
      const revs = await revsOf(id);
      V[id] = { tid, cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock, note: r.note || '' })) };
      ok(tb.codigo === meta.code + '-' + (s.abbr || PM.templates[tid].abbr), id + ': código ' + meta.code + '-' + (s.abbr || PM.templates[tid].abbr), tb.codigo);
      ok(d.status === s.status && d.rev === s.rev && upd === s.date, id + ': estado ' + s.status + ', revisión ' + s.rev + ' del ' + s.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd : !tb.fechaAprobacion) && tb.elaboro && tb.reviso && tb.aprobo, id + ': cajetín y fecha de aprobación coherentes (día hábil, hasta el corte; aprobador definido aunque esté en revisión)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(s.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && (r.status !== 'aprobado' || r.titleBlock.fechaAprobacion === r.date)), id + ': historial de revisiones', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      const noApprover = V[id].revs.filter((r) => r.status === 'aprobado' && !(r.titleBlock && r.titleBlock.aprobo)).map((r) => r.rev);
      ok(!noApprover.length, id + ': toda revisión aprobada tiene aprobador en el cajetín', noApprover);
      const keys = tplKeys(tid);
      const versions = [V[id].cur, ...V[id].revs];
      const missing = versions.flatMap((v, k) => keys.filter((key) => empty(v.fields[key])).map((key) => (k ? 'rev ' + V[id].revs[k - 1].rev : 'vigente') + '.' + key));
      ok(!missing.length, id + ': todas las claves de la plantilla con contenido (vigente y revisiones)', missing);
      const isoBad = versions.flatMap((v) => strings(v.fields).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && (!D.valid(x) || x < '2026-04-01' || x > meta.end)));
      ok(!isoBad.length, id + ': fechas de los campos entre abril de 2026 y el fin del proyecto', isoBad);
      const late = versions.filter((v) => v.status === 'aprobado' || id === ACTAS[5]).map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': las versiones aprobadas no citan hechos posteriores a su fecha', late);
      const lateD = versions.filter((v) => v.status === 'aprobado' || id === ACTAS[5]).map((v) => [v.date, lateDates(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!lateD.length, id + ': las versiones aprobadas solo nombran fechas posteriores a la suya si son planes conocidos a esa fecha', lateD);
    }
    if (Object.keys(V).length !== MINE.length) return out;
    const revF = (id, r) => V[id].revs.find((x) => x.rev === r).fields;

    /* ---------- plan de gestión de las comunicaciones */
    {
      const f = V['plan-gestion-comunicaciones'].cur.fields, f0 = revF('plan-gestion-comunicaciones', '0');
      for (const [v, name] of [[f, 'rev. 1'], [f0, 'rev. 0']]) {
        const badOpt = v.matriz.filter((r) => !optsOf('plan-gestion-comunicaciones', 'matriz', 'medio').includes(r.medio) || !optsOf('plan-gestion-comunicaciones', 'matriz', 'metodo').includes(r.metodo) || !optsOf('plan-gestion-comunicaciones', 'matriz', 'frecuencia').includes(r.frecuencia) || [r.informacion, r.proposito, r.emisor, r.receptores, r.formato, r.responsable].some(empty));
        ok(!badOpt.length, 'plan (' + name + '): matriz completa con medio, método y frecuencia de la plantilla', badOpt.map((r) => r.informacion));
        ok(v.escalamiento.every((e) => e.nivel && e.situacion && e.escalaA && e.plazo) && v.glosario.every((g) => g.termino && g.definicion), 'plan (' + name + '): escalamiento y glosario completos');
        /* cada interesado del registro de interesados tiene su canal en la matriz */
        const who = { 'Gerencia General': /Gerencia General/, 'Gerente administrativo y financiero': /[Dd]ueño del producto/, 'Jefe de la PMO': /[Dd]irector de proyecto/, 'Coordinador logístico': /coordinador logístico/i, 'Jefe de almacén': /jefe de almacén/i, 'Personal de bodega y conductores': /personal de bodega/i, 'Jefe de facturación y cartera': /jefe de facturación y cartera/i, 'Jefe de mantenimiento': /jefe de mantenimiento/i, 'Gerente comercial': /gerente comercial/i, 'Jefe de TI': /jefe de TI/i, 'Contador': /contador/i, 'Revisor fiscal': /revisor fiscal/i, 'Gerente de proyecto del implementador': /implementador/i, 'Gerente de cuenta del fabricante del ERP': /fabricante/i, 'Proveedor tecnológico de facturación electrónica': /proveedor tecnológico/i, 'DIAN': /DIAN/ };
        const st0 = docOf('registro-interesados').fields.interesados;
        const uncovered = st0.filter((s) => !who[s.nombre] || !v.matriz.some((r) => who[s.nombre].test(r.receptores) || who[s.nombre].test(r.emisor))).map((s) => s.nombre);
        ok(!uncovered.length && st0.length === Object.keys(who).length, 'plan (' + name + '): cada interesado del registro de interesados tiene su canal en la matriz', uncovered);
      }
      const keysOf = (v) => v.matriz.map((r) => r.informacion);
      const added = keysOf(f).filter((k) => !keysOf(f0).includes(k));
      ok(f.matriz.length === f0.matriz.length + 1 && added.length === 1 && /defectos e incidentes de producción/.test(added[0]), 'plan rev. 1: agrega el reporte de defectos e incidentes de producción', added);
      /* lo que ya estaba aprobado el día de la LB0 (plan de gestión de cambios y registro de riesgos rev. 0) va desde la rev. 0 */
      const umE = docOf('plan-gestion-cambios').fields.umbrales.find((u) => u.nivel === 'Emergencia');
      const r003 = (await revsOf('registro-riesgos')).find((r) => r.rev === '0').fields.riesgos.find((r) => r.id === 'R-003');
      const paper = ((/más de \d+(?:,\d+)? ?%/i.exec(plain(r003.disparador)) || [''])[0]).toLowerCase();
      const em = (v) => v.escalamiento.find((e) => e.nivel === 'Emergencia');
      ok(umE && /acompañamiento en sitio/.test(r003.respuesta) && paper && [f0, f].every((v) => em(v) && em(v).situacion === umE.criterio && /carril de urgencia/.test(em(v).escalaA) && has(em(v).plazo, umE.plazoDias + ' día') && v.glosario.some((g) => g.termino === 'Carril de urgencia') && v.matriz.some((r) => /Acompañamiento en sitio/.test(r.informacion) && /R-003/.test(r.formato) && /reporte semanal/.test(r.formato) && has(r.formato, paper))), 'plan rev. 0 y rev. 1: escalamiento de emergencia y carril de urgencia del plan de gestión de cambios, y acompañamiento en sitio con el disparador de R-003 (registro de riesgos rev. 0)', [em(f0), paper]);
      const ch0 = f0.escalamiento.find((e) => e.nivel === 'Cambios');
      ok(ch0 && /niveles 1 a 3/.test(ch0.situacion) && /emergencias/.test(ch0.situacion), 'plan rev. 0: la fila de cambios remite la emergencia a su propia fila');
      ok(!/producción del release 1|mesa de ayuda de TI|Defecto de producción/.test(text(f0)) && /mesa de ayuda de TI/.test(text(f)) && f.glosario.some((g) => g.termino === 'Defecto de producción'), 'plan: la mesa de ayuda de TI para los defectos de producción llega con la rev. 1 (después de la salida del release 1)');
      const note1 = V['plan-gestion-comunicaciones'].revs.find((r) => r.rev === '1').note;
      ok(/mesa de ayuda de TI/.test(note1) && !/escalamiento de emergencia|acompañamiento en sitio después/i.test(note1), 'plan rev. 1: la nota solo describe lo que es nuevo después de la salida del release 1', note1);
      /* restricciones frente al cronograma: ninguna salida real o planificada en el cierre mensual ni en el anual */
      const r3 = lbT('t32').start;
      const goLives = [task('t29').actualFinish, lbT('t29').start, lbT('t31').start, lbT('t33').start, task('t30').start, task('t32').start, ...informe.fields.hitos.filter((h) => /en producción/.test(h.hito)).flatMap((h) => [h.fechaBase, h.fechaPronostico])].filter(Boolean);
      const inClose = goLives.filter((d) => closeOf(d).includes(d));
      ok(goLives.length >= 6 && !inClose.length && r3.slice(5, 7) === '01' && r3 > closeOf(r3)[4] && [f0, f].every((v) => /ni durante el cierre anual/.test(v.restricciones) && !/antes del cierre anual/.test(v.restricciones) && has(v.restricciones, dl(r3))), 'plan: restricción de salidas = cronograma (ninguna salida real o planificada en el cierre mensual; el release 3 después del cierre anual)', { inClose, r3 });
      /* motivo de los avisos en cartelera: la red inalámbrica de los patios se instala en julio (EDT 1.3.2) */
      ok(!/conexión limitada/.test(text(f0) + text(f)) && [f0, f].every((v) => /no trabajan con correo corporativo/.test(v.restricciones)) && has(f0.restricciones, dl(lbT('t14').finish)) && lbT('t14').finish > LB.date && !/se instala/.test(f.restricciones) && task('t14').actualFinish < V['plan-gestion-comunicaciones'].cur.date, 'plan: motivo de los avisos en cartelera coherente con la red inalámbrica (planificada en la rev. 0, instalada antes de la rev. 1)');
      const mailToYard = [f0, f].flatMap((v) => v.matriz.filter((r) => r.medio === 'Correo electrónico' && /personal de bodega/i.test(r.receptores) && !/cartelera/.test(r.receptores + r.formato)).map((r) => r.informacion));
      ok(!mailToYard.length, 'plan: lo que va por correo al personal de bodega y a los conductores tiene copia en las carteleras', mailToYard);
      ok(has(f.requisitos, dl(golive1)), 'plan rev. 1: cita la salida a producción del release 1', golive1);
      const inf = f0.matriz.find((r) => /Informe de desempeño/.test(r.informacion));
      ok(inf && /valor ganado se calcula a la fecha de corte de cada informe/.test(inf.formato) && /cortes de avance que guarda el gestor son mensuales \(último día hábil de cada mes\)/.test(inf.formato) && costs.statusUpdates.length >= 3 && costs.statusUpdates.every((u) => u.date === lastWorkOfMonth(u.date)), 'plan: el valor ganado de cada informe quincenal se calcula a su corte y los cortes de avance guardados son mensuales (último día hábil)', costs.statusUpdates.map((u) => u.date));
      /* el periodo del informe de 95 empieza el día siguiente al corte del informe anterior (sin traslape ni hueco) */
      { let next = D.add(cuts[nInf - 2], 1); while (!cal.isWork(next)) next = D.add(next, 1);
        ok(informe.fields.periodoInicio > cuts[nInf - 2] && informe.fields.periodoInicio <= next, 'calendario: el periodo del informe n.º ' + nInf + ' (95) empieza después del corte del n.º ' + (nInf - 1) + ' (' + cuts[nInf - 2] + ') y a más tardar el ' + next, { periodoInicio: informe.fields.periodoInicio, corteAnterior: cuts[nInf - 2] }); }
      ok(inf && has(inf.formato, dl(cuts[0])) && cuts[0] > LB.date && D.add(cuts[0], -14) <= LB.date && cuts.every((c) => cal.isWork(c) && D.dow(c) === 5) && has(inf.receptores.replace(/; /g, ', ').replace(/, comité/, ' y comité'), informe.fields.destinatarios), 'plan: informe quincenal con corte cada dos viernes desde el primero después de la LB0 y destinatarios del informe de desempeño', [cuts[0], inf && inf.formato]);
      const um = Object.fromEntries(docOf('plan-gestion-cambios').fields.umbrales.map((u) => [u.nivel, u.plazoDias]));
      const ch = f.escalamiento.find((e) => e.nivel === 'Cambios');
      ok(ch && has(ch.plazo, 'De ' + um['Nivel 1'] + ' a ' + um['Nivel 3'] + ' días hábiles'), 'plan: plazos de los cambios = umbrales del plan de gestión de cambios', ch);
      const t = (id) => task(id);
      ok(has(f.recursos, ms(t('t04').cost)) && has(f.recursos, ms(t('t35').cost)) && has(f.recursos, ms(t('t20').cost)) && has(f.recursos, ms(t('t22').cost + t('t23').cost + t('t24').cost)) && has(f.recursos, 'EDT ' + tree.codes.get(t('t20').wbsId)) && has(f.recursos, '(' + cat('dir').dedication + ' %') && has(f.recursos, '(' + cat('sm').dedication + ' %)'), 'plan: recursos con los costos del cronograma (EDT 1.1.3, 1.5.1 y 1.5.3) y la dedicación del catálogo de recursos');
      const pr = docOf('plan-release').fields.supuestos;
      ok(pr.some((x) => /dos horas diarias/.test(x)) && /dos horas diarias/.test(f.restricciones) && /cinco primeros días hábiles/.test(f.restricciones), 'plan: restricciones coherentes con los supuestos del plan de releases');
      const pdir = docOf('plan-direccion');
      if (pdir) ok(pdir.fields.planesSubsidiarios.some((p) => /comunicaciones/.test(p.plan) && p.estado === 'Aprobado'), 'el plan para la dirección (si está cargado) da por aprobado este plan');
    }

    /* ---------- actas de reunión */
    const actaF = (k) => V['acta-reunion--' + k].cur.fields;
    {
      for (const id of ACTAS) {
        const f = V[id].cur.fields, s = SPEC[id], k = id.replace('acta-reunion--', '');
        ok(f.fecha === s.meeting && cal.isWork(f.fecha) && f.fecha <= V[id].cur.date && f.numero === s.abbr.slice(-2), k + ': fecha de la reunión (día hábil, no posterior al acta) y número del acta', [f.fecha, s.meeting, f.numero]);
        ok(optsOf('acta-reunion', 'modalidad').includes(f.modalidad) && optsOf('acta-reunion', 'tipoReunion').includes(f.tipoReunion) && f.asistentes.every((a) => a.rol && a.organizacion && optsOf('acta-reunion', 'asistentes', 'asistencia').includes(a.asistencia)), k + ': modalidad, tipo de reunión y asistencia de la plantilla');
        ok(/^\d{2}:\d{2}$/.test(f.horaInicio) && /^\d{2}:\d{2}$/.test(f.horaFin) && f.horaInicio < f.horaFin, k + ': horas de inicio y fin', [f.horaInicio, f.horaFin]);
        ok(f.decisiones.length >= 3 && f.decisiones.every((x) => x.decision && x.tema && x.aprobadaPor), k + ': decisiones con tema y aprobador');
        const badC = f.compromisos.filter((c) => !c.compromiso || !c.responsable || !cal.isWork(c.fecha) || !optsOf('acta-reunion', 'compromisos', 'estado').includes(c.estado) || c.estado !== (c.fecha <= V[id].cur.date ? 'Cumplido' : 'Pendiente'));
        ok(f.compromisos.length >= 4 && !badC.length, k + ': compromisos con responsable y fecha hábil; cumplidos solo los vencidos a la fecha del acta', badC);
        ok(f.proximaFecha > f.fecha && comites.includes(f.proximaFecha) && has(f.observaciones, dl(f.proximaFecha)), k + ': próxima reunión = siguiente comité quincenal', f.proximaFecha);
      }
      ok(comites.includes(meetings.cc001) && comites.includes(comite) && !comites.includes(meetings.lb0) && comite === docOf('registro-riesgos').updatedAt.slice(0, 10), 'calendario: el CC-001 se decidió en un comité quincenal ordinario, la LB0 en una sesión extraordinaria y el comité de octubre es el de la rev. 2 del registro de riesgos', [meetings.cc001, meetings.lb0, comite]);
      ok(meetings.arranque === (await revsOf('registro-interesados')).find((r) => r.rev === '0').date.slice(0, 10) && cal.addWork(meetings['salida-r1'], 1) === golive1, 'calendario: arranque con la emisión del registro de interesados y comité de salida el día hábil anterior a la salida del release 1');
      ok(actaF('salida-r1').proximaFecha === D.add(golive1, 14) && comites.includes(golive1), 'calendario: el comité ordinario del día de la salida se aplaza al siguiente');

      /* arranque: acta de constitución rev. 0 y fechas de la selección (LB0) */
      const a1 = actaF('arranque');
      const actaRev0 = (await revsOf('acta-constitucion')).find((r) => r.rev === '0').fields;
      ok(has(a1.desarrollo, ms(actaRev0.presupuesto)) && actaRev0.hitos.every((h) => has(a1.desarrollo, dl(h.fecha))) && ['t07', 't08', 't09'].every((id, i) => has(a1.desarrollo, plain(Fm.date([lbT('t07').finish, lbT('t08').start, lbT('t09').finish][i], 'long')).replace(/ de 20\d\d$/, ''))) && has(a1.desarrollo, dl(lbT('t11').start)) && has(a1.desarrollo, '(seis en total)') && cat('uc').availability === 6, 'arranque: presupuesto e hitos del acta de constitución rev. 0, calendario de la selección y usuarios clave del catálogo');
      ok(has(text(a1.decisiones), dl(a1.proximaFecha)), 'arranque: la primera sesión del comité quincenal es la próxima reunión');
      const comSel = a1.decisiones.find((x) => /comité de selección/.test(x.decision));
      ok(comSel && /\(director, dueño del producto, jefe de TI y contador, con el consultor de selección como secretario técnico sin voto\)/.test(comSel.decision), 'arranque: el comité de selección lo forman el director, el dueño del producto, el jefe de TI y el contador; el consultor de selección es secretario técnico sin voto', comSel);
      const pga = docOf('plan-gestion-adquisiciones');
      if (pga) ok(/secretario técnico, sin voto/.test(text(pga.fields)), 'el plan de gestión de las adquisiciones (si está cargado) da la misma composición del comité de selección');
      /* selección: sin puntajes ni valores de los contratos */
      const a2 = actaF('seleccion');
      ok(/Criterios de selección y evaluación de ofertas/.test(a2.desarrollo) && !/\d+ puntos|\d+,\d+ %|ponderación de/.test(text(a2)) && has(a2.desarrollo, ms(actaRev0.presupuesto)), 'selección: cita los criterios por su nombre sin inventar puntajes ni valores de los contratos');
      /* LB0 */
      const a3 = actaF('lb0');
      const pr0 = (await revsOf('plan-release')).find((r) => r.rev === '0').fields;
      ok([LB.cost.bac, LB.cost.contingency, LB.cost.management, LB.cost.bac + LB.cost.contingency].every((x) => has(a3.desarrollo, ms(x))) && LB.cost.bac + LB.cost.contingency + LB.cost.management === meta.budget && has(a3.desarrollo, ms(meta.budget)) && has(a3.desarrollo, dl(LB.schedule.finish)), 'LB0: BAC, reservas, línea base de costos y presupuesto de la línea base guardada', a3.desarrollo);
      ok(pr0.releases.every((r) => has(a3.desarrollo, r.puntos + ' puntos') && has(a3.desarrollo, ms(r.presupuesto))) && pr0.releases[0].puntos === relAt('rel-1', LB.date).total && has(text(a3.decisiones), sprints.length + ' iteraciones de ' + st.sprintLength + ' días'), 'LB0: releases del plan de releases rev. 0 (puntos del backlog a esa fecha) e iteraciones');
      const rr0 = (await revsOf('registro-riesgos')).find((r) => r.rev === '0').fields.riesgos;
      ok(has(a3.desarrollo, ms(sum(rr0, (r) => r.reserva))) && sum(rr0, (r) => r.reserva) === LB.cost.contingency, 'LB0: reserva del registro de riesgos rev. 0 = contingencia de la LB0');
      /* CC-001 */
      const a4 = actaF('cc001');
      const p0 = relAt('rel-1', D.add(R1.baseline.date, -2)), pReq = relAt('rel-1', item('HU-038').createdAt);
      const v2 = velAt(item('HU-038').createdAt).rows.filter((r) => r.status === 'cerrado').map((r) => r.completed);
      const remaining = R1.baseline.points - pReq.done;
      const pct = (R1.baseline.points - pr0.releases[0].puntos) / pr0.releases[0].puntos;
      ok(has(a4.desarrollo, pReq.done + ' de ' + relAt('rel-1', D.add(item('HU-038').createdAt, -1)).total + ' puntos') && has(a4.desarrollo, v2.join(' y ') + ' puntos') && has(a4.desarrollo, remaining + ' puntos para las iteraciones 3 y 4') && has(a4.desarrollo, '+' + plain(Fm.num(pct * 100, 1)) + ' %') && p0.total <= pReq.total, 'CC-001: avance, velocidad, puntos que faltan y variación calculados con el backlog', a4.desarrollo);
      const sol = docOf('solicitud-cambio--cc001').fields;
      ok(sol.alternativas.every((x) => has(a4.desarrollo, x.alternativa.slice(3, 20).toLowerCase())) && has(a4.desarrollo, ms(sol.alternativas.find((x) => x.costo).costo)) && sol.decision === 'Aprobada' && sol.fechaDecision === meetings.cc001 && has(a4.decisiones[0].decision, R1.baseline.points + ' puntos') && has(a4.decisiones[0].decision, ms(R1.baseline.budget)) && has(a4.decisiones[0].decision, dl(R1.baseline.end)), 'CC-001: alternativas y decisión iguales a la solicitud de cambio y a la línea base del release');
      const pr1 = (await revsOf('plan-release')).find((r) => r.rev === '1');
      ok(pr1 && pr1.date.slice(0, 10) === meetings.cc001 && pr1.titleBlock.aprobo === 'Gerencia General' && a4.asistentes.some((x) => x.rol === 'Gerencia General' && x.asistencia === 'Asistió') && a4.decisiones.some((x) => /revisión 1 del plan de releases y del plan para la dirección del proyecto/.test(x.decision) && x.aprobadaPor === 'Gerencia General' && has(x.decision, R1.baseline.points + ' puntos') && /LB0\) no cambia/.test(x.decision)) && a4.compromisos.some((x) => /revisión 1 del plan de releases/.test(x.compromiso) && x.fecha === meetings.cc001), 'CC-001: el acta registra la aprobación de la rev. 1 del plan de releases (95) y del plan para la dirección por la Gerencia General, presente en el comité', pr1 && [pr1.date, pr1.titleBlock.aprobo]);
      const pdir1 = docOf('plan-direccion') ? (await revsOf('plan-direccion')).find((r) => r.rev === '1') : null;
      if (docOf('plan-direccion')) ok(pdir1 && pdir1.date.slice(0, 10) === meetings.cc001, 'el plan para la dirección (si está cargado) tiene su rev. 1 en la fecha del CC-001', pdir1 && pdir1.date);
      const t16Late = cal.countWork(D.add(lbT('t16').finish, 1), task('t16').actualFinish);
      ok(/tres días hábiles/.test(a4.desarrollo) && t16Late === 3 && has(a4.desarrollo, /(\d+) %/.exec(task('t16').notes)[1] + ' %'), 'CC-001: atraso de la depuración frente a la LB0 y referencias sin peso');
      /* salida del release 1 */
      const a5 = actaF('salida-r1');
      const s4 = relAt('rel-1', it4.end);
      const r1ac = A.releaseActualCost(R1, costs, tree, it4.end);
      ok(has(a5.desarrollo, s4.done + ' de ' + s4.total + ' puntos') && s4.done === s4.total && has(a5.desarrollo, ms(r1ac)) && has(a5.desarrollo, 'CPI ' + plain(Fm.idx((R1.budget * s4.pct) / r1ac))) && has(a5.desarrollo, /(\d+,\d+)\s*%/.exec(task('t17').notes)[1] + ' %'), 'salida del release 1: puntos, costo real y CPI del release (AgileEVM) y diferencia del inventario migrado');
      const dfs = (a5.desarrollo.match(/DF-\d{3}/g) || []);
      ok(dfs.length >= 4 && dfs.every((c) => item(c).createdAt <= meetings['salida-r1'] && item(c).releaseId === 'rel-2'), 'salida del release 1: defectos que pasan al release 2, ya registrados', dfs);
      const close = []; { let d = D.startOfMonth(golive1); while (close.length < 5) { if (cal.isWork(d)) close.push(d); d = D.add(d, 1); } }
      ok(golive1 > close[4] && has(a5.desarrollo, 'al ' + plain(Fm.date(close[4], 'long')).replace(/ de 20\d\d$/, '')), 'salida del release 1: después del cierre mensual (cinco primeros días hábiles)');
      ok(has(text(a5.decisiones), dl(cal.addWork(golive1, 10))), 'salida del release 1: acompañamiento en sitio de dos semanas (diez días hábiles)');
      /* comité de octubre */
      const a6 = actaF('comite-2026-10-08');
      const r2 = relAt('rel-2', it6.end), v6 = velAt(it6.end);
      const fc = C.releaseForecast({ release: R2, sprints: sprintsAt(it6.end), items: itemsAt(it6.end), settings: st, cal, statusDate: it6.end });
      ok(has(a6.desarrollo, r2.done + ' de ' + r2.total + ' puntos') && has(a6.desarrollo, plain(Fm.num(v6.avg3, 1)) + ' puntos') && has(a6.desarrollo, dl(fc.finish)) && has(a6.desarrollo, ms(A.releaseActualCost(R2, costs, tree, it6.end))) && has(a6.desarrollo, R2.baseline.points + ' a ' + r2.total + ' puntos'), 'comité de octubre: avance, velocidad, pronóstico y costo real del release 2 al cierre de la iteración 6', a6.desarrollo);
      const rr = docOf('registro-riesgos').fields.riesgos, rr1 = (await revsOf('registro-riesgos')).find((r) => r.rev === '1').fields.riesgos;
      const before = Object.fromEntries(rr1.map((r) => [r.id, r.reserva]));
      const changed = rr.filter((r) => r.id in before && before[r.id] !== r.reserva);
      ok(changed.length && changed.every((r) => has(a6.desarrollo, r.id + ' (de ' + ms(before[r.id]) + ' a ' + ms(r.reserva) + ')')) && has(a6.desarrollo, ms(rr.find((r) => r.id === 'R-008').reserva)) && sum(rr, (r) => r.reserva) === sum(rr1, (r) => r.reserva) && has(a6.desarrollo, ms(sum(rr, (r) => r.reserva))), 'comité de octubre: redistribución de la reserva igual a las revisiones 1 y 2 del registro de riesgos, sin aumentar el total');
      ok(['INC-002', 'INC-003'].every((c) => { const r = inc.find((x) => x.id === c); return has(a6.desarrollo, c + ' (' + plain(Fm.date(r.fecha, 'long')).replace(/ de 20\d\d$/, '') + ')') && has(a6.desarrollo, dl(r.fechaObjetivo)); }) && !/INC-004|DF-009/.test(text(a6)), 'comité de octubre: incidentes abiertos del registro de incidentes, sin hechos del 9 de octubre');
      ok(informe.fields.proximosPasos.every((p) => a6.compromisos.some((c) => c.compromiso === p.accion && c.responsable === p.responsable && c.fecha === p.fecha)), 'comité de octubre: sus compromisos son los próximos pasos del informe de desempeño del 9 de octubre');
      const t23 = lbT('t23');
      ok(/el 29 y el 30 de octubre/.test(text(a6.decisiones)) && t23.start === '2026-10-29' && cal.isWork('2026-10-30') && !cal.isWork('2026-11-02'), 'comité de octubre: capacitación de facturación y cartera antes del cierre de noviembre');
      const novClose = closeOf(t23.finish);
      /* regresión (revisión cruzada): el comité de selección cita todos los criterios del documento de criterios (si está cargado; si
         no, los cinco del ejemplo); el comité de octubre recoge la revisión del caso de negocio al cierre del release 1 y la sesión
         ordinaria que aprobó la rev. 2 del plan de releases (sin acta propia, en el informe quincenal siguiente) y pide en el reclamo
         el crédito de servicio que prevé el acuerdo de nivel de servicio */
      const csp = docOf('criterios-seleccion-proveedores');
      const critNames = csp ? csp.fields.criterios.map((c) => c.criterio.charAt(0).toLowerCase() + c.criterio.slice(1)) : null;
      ok(csp ? critNames.every((n) => has(a2.desarrollo, n)) : (a2.desarrollo.split('\n')[2].match(/;/g) || []).length === 4, 'selección: la evaluación ponderada nombra todos los criterios del documento de criterios de selección', critNames);
      const pr2 = (await revsOf('plan-release')).find((r) => r.rev === '2');
      const sep = String(pr2.date).slice(0, 10);
      ok(comites.includes(sep) && sep > golive1 && cuts.includes(D.add(sep, 1)) && has(a6.desarrollo.split('\n')[0], 'sesión ordinaria del ' + dl(sep)) && has(a6.desarrollo.split('\n')[0], 'informe quincenal n.º ' + (cuts.indexOf(D.add(sep, 1)) + 1)) && has(a6.desarrollo.split('\n')[0], dl(review)) && /caso de negocio/.test(a6.desarrollo.split('\n')[0]), 'comité de octubre: recoge la revisión al cierre del release 1 y la sesión ordinaria que aprobó la rev. 2 del plan de releases', a6.desarrollo.split('\n')[0]);
      ok(a6.decisiones.some((x) => /reclamo formal/.test(x.decision) && /crédito de servicio/.test(x.decision) && /aviso automático/.test(x.decision)), 'comité de octubre: el reclamo pide aviso automático y el crédito de servicio del acuerdo de nivel de servicio');
      ok(has(a6.desarrollo, 'coincide con el cierre mensual (del ' + (+novClose[0].slice(8)) + ' al ' + plain(Fm.date(novClose[4], 'long')).replace(/ de 20\d\d$/, '') + ')') && !/corre el cierre mensual/.test(a6.desarrollo) && novClose[4] === '2026-11-09' && lbT('t30').start > novClose[4], 'comité de octubre: el cierre de noviembre va del 3 al 9 de noviembre (con el festivo del 2) y el release 2 sale después', [novClose, a6.desarrollo.split('\n')[5]]);
    }

    /* ---------- registro de comunicaciones */
    {
      const versions = [['rev. 2A', V['registro-comunicaciones'].cur], ...V['registro-comunicaciones'].revs.map((r) => ['rev. ' + r.rev, r])];
      const cur = versions[0][1].fields.comunicaciones;
      for (const [name, v] of versions) {
        const list = v.fields.comunicaciones;
        ok(list.every((c, i) => c.id === 'COM-' + String(i + 1).padStart(3, '0')) && list.every((c, i) => !i || list[i - 1].fecha <= c.fecha), 'registro (' + name + '): códigos consecutivos en orden de fecha');
        ok(list.every((c, i) => cur[i] && cur[i].id === c.id && cur[i].asunto === c.asunto && cur[i].fecha === c.fecha), 'registro (' + name + '): las revisiones son el inicio del registro vigente (mismos códigos)');
        const bad = list.filter((c) => !cal.isWork(c.fecha) || c.fecha > v.date || !optsOf('registro-comunicaciones', 'comunicaciones', 'tipo').includes(c.tipo) || !optsOf('registro-comunicaciones', 'comunicaciones', 'medio').includes(c.medio) || !optsOf('registro-comunicaciones', 'comunicaciones', 'estado').includes(c.estado) || !c.asunto || !c.emisor || !c.receptores
          || (c.estado === 'Respondida' ? !c.requiereRespuesta || !c.fechaRespuesta || c.fechaRespuesta < c.fecha || c.fechaRespuesta > v.date : c.fechaRespuesta)
          || (c.estado === 'Pendiente de respuesta' && !c.requiereRespuesta)).map((c) => c.id + ' ' + c.fecha + ' ' + c.estado);
        ok(!bad.length, 'registro (' + name + '): fechas hábiles hasta la del registro, opciones de la plantilla y respuestas coherentes', bad);
      }
      ok(cur.length >= 25 && cur.some((c) => c.estado === 'Pendiente de respuesta') && cur.every((c) => c.fecha <= cut), 'registro: al día con la fecha de corte, con comunicaciones pendientes de respuesta', cur.length);
      const byRef = (ref) => cur.filter((c) => c.referencia === ref);
      /* actas: una comunicación por acta, con su código y la fecha de la reunión */
      for (const id of ACTAS) {
        const d = docOf(id), r = byRef(d.titleBlock.codigo).find((c) => c.tipo === 'Acta');
        ok(r && r.fecha === d.fields.fecha && r.estado === (d.status === 'aprobado' ? 'Archivada' : 'Enviada'), 'registro: acta ' + d.titleBlock.codigo + ' enviada el día de la reunión', r);
      }
      /* informes quincenales: cortes cada dos viernes hasta el del informe de desempeño */
      const infRows = cur.filter((c) => c.tipo === 'Informe');
      ok(infRows.length === nInf && infRows.every((c, i) => c.referencia === 'Informe quincenal n.º ' + (i + 1) && has(c.asunto, dl(cuts[i])) && (i < nInf - 1 ? c.fecha === cal.addWork(cuts[i], 1) : c.fecha === lastCut && c.estado === 'Pendiente de respuesta')) && lastCut === cut, 'registro: informes quincenales n.º 1 a ' + nInf + ' emitidos el día hábil siguiente a cada corte; el último, en revisión', infRows.map((c) => [c.fecha, c.referencia]));
      /* fechas del cronograma, del CC-001 y de los incidentes */
      const find = (re) => cur.find((c) => re.test(c.asunto));
      const want = [
        [/Solicitud de propuestas/, task('t08').actualStart, task('t08').actualFinish], [/Invitación a los tres finalistas/, task('t08').actualFinish, task('t09').actualStart],
        [/Notificación de adjudicación/, task('t10').actualStart], [/contratos de suscripción y de implementación firmados/, task('t11').actualFinish], [/Orden de compra/, task('t14').actualStart],
        [/Solicitud de cambio CC-001/, item('HU-038').createdAt, R1.baseline.date], [/Decisión del CC-001/, R1.baseline.date], [/Solicitud de las credenciales/, task('t15').actualStart, task('t15').actualFinish],
        [/Entrega de las credenciales/, task('t15').actualFinish], [/inventario de la bodega principal conciliado/, cal.addWork(task('t17').actualFinish, 1), it4.end], [/^Salida a producción del release 1/, it4.end],
        [/tabletas robustas llegan/, inc.find((r) => r.id === 'INC-001').fecha, inc.find((r) => r.id === 'INC-001').fecha], [/auxiliar de cartera/, inc.find((r) => r.id === 'INC-003').fecha], [/caída del ambiente de habilitación/, comite],
      ];
      const wrong = want.filter(([re, f, r]) => { const c = find(re); return !c || c.fecha !== f || (r ? c.fechaRespuesta !== r : c.fechaRespuesta); }).map(([re]) => String(re));
      ok(!wrong.length, 'registro: fechas de las comunicaciones = cronograma, CC-001 e incidentes', wrong);
      const oc = find(/Orden de compra/);
      ok(['tab', 'lec', 'imp'].every((k) => { const q = task('t14').resources.find((a) => a.resourceId === 'rec-' + k).qty; return q && has(oc.asunto, ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis'][q] + ' '); }) && oc.receptores === cat('tab').supplier, 'registro: orden de compra con las cantidades y el proveedor del catálogo de recursos');
      ok(find(/caída del ambiente/).referencia === 'INC-002' && find(/auxiliar de cartera/).referencia === 'INC-003' && ['INC-002', 'INC-003'].every((c) => byRef(c).every((x) => x.estado === 'Pendiente de respuesta')), 'registro: reclamo al proveedor tecnológico y requerimiento a contabilidad pendientes de respuesta');
      ok(!/Pruebas de usuario|reunión diaria|retrospectiva/i.test(text(cur.map((c) => c.asunto))), 'registro: solo comunicaciones formales (sin la coordinación del equipo Scrum)');
      ok(/comunicaciones formales del proyecto: las que van a terceros o vienen de ellos .* y las de gobierno del proyecto \(actas de los comités, informes quincenales, solicitudes y decisiones de cambio, comunicados de salida y requerimientos formales entre áreas\)/.test(V['registro-comunicaciones'].cur.fields.archivo), 'registro: el archivo define el alcance (comunicaciones formales con terceros y de gobierno del proyecto)');
      const yardMail = cur.filter((c) => c.medio === 'Correo electrónico' && /personal de bodega/i.test(c.receptores) && !/cartelera/.test(c.receptores)).map((c) => c.id);
      ok(!yardMail.length, 'registro: lo que va por correo al personal de bodega y a los conductores tiene copia en las carteleras', yardMail);
      const r0 = V['registro-comunicaciones'].revs.find((r) => r.rev === '0').fields;
      ok(r0.comunicaciones.every((c) => c.fecha <= LB.date) && !/defectos de producción/.test(r0.archivo) && /defectos de producción/.test(V['registro-comunicaciones'].cur.fields.archivo), 'registro rev. 0: solo comunicaciones hasta la LB0');
      /* regresión (revisión cruzada): tipo y medio coherentes (un correo va por correo electrónico); la decisión de la revisión al cierre
         del release 1 queda registrada con la rev. 1 del caso de negocio (si el módulo de integración está cargado, en la misma fecha)
         y el reclamo al proveedor tecnológico pide el crédito de servicio */
      const mailBad = cur.filter((c) => c.tipo === 'Correo' && c.medio !== 'Correo electrónico').map((c) => c.id + ' ' + c.medio);
      ok(!mailBad.length, 'registro: los correos van por correo electrónico', mailBad);
      const cnegCom = find(/^Resultado de la revisión del caso de negocio al cierre del release 1/);
      const cneg = docOf('caso-negocio');
      const cneg1 = cneg ? (await revsOf('caso-negocio')).find((r) => r.rev === '1') : null;
      ok(cnegCom && cnegCom.fecha === review && cnegCom.emisor === 'Gerencia General' && /rev\. 1$/.test(cnegCom.referencia) && (!cneg || (cnegCom.referencia === cneg.titleBlock.codigo + ' rev. 1' && cneg1 && String(cneg1.date).slice(0, 10) === review)) && /revisión al cierre de cada release, en la revisión del caso de negocio/.test(V['registro-comunicaciones'].cur.fields.archivo), 'registro: la decisión de la revisión al cierre del release 1 (caso de negocio rev. 1) está registrada en su fecha', cnegCom);
      ok(/crédito de servicio/.test(find(/caída del ambiente de habilitación/).asunto), 'registro: el reclamo al proveedor tecnológico pide aviso automático y crédito de servicio', find(/caída del ambiente de habilitación/).asunto);
    }
    ok(['plan-gestion-comunicaciones', 'registro-comunicaciones', 'acta-reunion'].every((id) => PM.docApproach && PM.docApproach(id) && PM.docApproach(id).id === 'ambos'), 'las tres plantillas son de «Ambos enfoques» (11-doc-approach)');
    return out;
  }, { MINE, ACTAS });
}

/* ============================================================== ejecución */
section('Datos y cifras de los documentos de comunicaciones (' + file + ')');
{
  const app = await openApp({ file });
  try {
    const res = await validateInPage(app.page);
    for (const r of res) check(r.ok, r.msg, r.extra);
    check(!app.errors.length, 'sin errores de consola al construir e importar', app.errors);
  } finally { await app.browser.close(); }
}

section('Interacción: selector de ejemplos, lista de documentos y teclado');
{
  const app = await openApp({ file, width: 1360, height: 900 });
  const { page, errors } = app;
  try {
    /* Tab hasta un elemento que cumpla la condición (devuelve si llegó) */
    const tabTo = async (pred, arg, max = 60) => {
      for (let k = 0; k < max; k++) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(pred, arg)) return true;
      }
      return false;
    };
    const n = await page.evaluate(() => PM.examples.length);
    /* portafolio vacío: el botón «Crear proyecto de ejemplo» con Tab y Enter */
    await page.getByRole('button', { name: 'Crear proyecto de ejemplo' }).first().waitFor({ timeout: 8000 });
    const onCreate = await tabTo(() => { const a = document.activeElement; return !!a && a.tagName === 'BUTTON' && a.textContent.trim() === 'Crear proyecto de ejemplo'; });
    check(onCreate, 'con Tab el foco llega al botón «Crear proyecto de ejemplo» del portafolio');
    await page.keyboard.press('Enter');
    if (n > 1) {
      await page.waitForSelector('.example-card', { timeout: 8000 });
      const card = page.locator('.example-card[aria-label*="ERP"]');
      check(await card.count() === 1, 'el selector ofrece el ejemplo del ERP');
      const onCard = await tabTo(() => { const a = document.activeElement; return !!a && a.classList.contains('example-card') && /ERP/.test(a.getAttribute('aria-label') || ''); }, null, 20);
      check(onCard, 'con Tab el foco llega a la tarjeta del ejemplo del ERP en el selector');
      await page.keyboard.press('Enter');
    }
    await page.waitForFunction(() => PM.getState().projectId && PM.getState().view === 'tablero', null, { timeout: 25000 });
    await page.waitForTimeout(700);
    const code = await page.evaluate(async () => (await PM.store.get(PM.paths.project(PM.getState().projectId))).code);
    check(code === 'PRY-2026-021', 'ejemplo del ERP creado desde el selector', code);
    /* riel: «Documentos» */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForFunction(() => PM.getState().view === 'documentos', null, { timeout: 8000 });
    await page.waitForSelector('tr[data-doc]', { timeout: 10000 });
    const rowsInfo = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => ({ key: tr.getAttribute('data-doc'), ap: tr.getAttribute('data-approach'), name: (tr.querySelector('.docs-link') || {}).textContent || '', code: (tr.querySelector('.docs-c-code') || {}).textContent || '', status: (tr.querySelector('.docs-c-status') || {}).textContent || '', rev: (tr.querySelector('.docs-c-rev') || {}).textContent || '' })));
    const want = { 'plan-gestion-comunicaciones': ['PGCM', 'Aprobado', '1'], 'registro-comunicaciones': ['RCOM', 'En revisión', '2A'] };
    ['arranque', 'seleccion', 'lb0', 'cc001', 'salida-r1'].forEach((k, i) => { want['acta-reunion--' + k] = ['AREU-0' + (i + 1), 'Aprobado', '0']; });
    want['acta-reunion--comite-2026-10-08'] = ['AREU-06', 'En revisión', 'A'];
    const rowBad = Object.entries(want).filter(([key, [ab, stt, rv]]) => { const r = rowsInfo.find((x) => x.key === key); return !r || norm(r.code).trim() !== 'PRY-2026-021-' + ab || !norm(r.status).includes(stt) || !norm(r.rev).trim().endsWith(rv) || (r.ap !== null && r.ap !== 'ambos'); });
    check(!rowBad.length, 'lista maestra: los ocho documentos con código, estado y revisión (y enfoque «ambos» si la columna existe)', rowBad.map(([k]) => [k, rowsInfo.find((x) => x.key === k)]));
    const parent = await page.evaluate(() => { const tr = document.querySelector('tr.docs-parent[data-tid="acta-reunion"]'); return tr ? tr.textContent : ''; });
    check(/6 documentos/.test(norm(parent)), 'lista maestra: la fila de «Acta de reunión» agrupa las seis actas', parent.slice(0, 200));
    if (shots) await page.screenshot({ path: shots + '/documentos.png', fullPage: false });
    /* teclado: buscar y abrir el plan con Tab y Enter */
    const search = page.getByLabel('Buscar documentos');
    await search.click();
    await page.keyboard.type('comunicaciones');
    await page.waitForTimeout(400);
    let reached = false;
    for (let k = 0; k < 40 && !reached; k++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && a.textContent.trim() === 'Plan de gestión de las comunicaciones'; });
    }
    check(reached, 'con Tab el foco llega al enlace «Plan de gestión de las comunicaciones» de la lista filtrada');
    const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; });
    check(ring, 'el enlace enfocado muestra el foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="plan-gestion-comunicaciones"] [data-section]', { timeout: 10000 });
    const plan = norm(await page.locator('.page[data-doc-id="plan-gestion-comunicaciones"]').innerText());
    check(/PRY-2026-021-PGCM/.test(plan) && /Matriz de comunicaciones/.test(plan) && /Comité quincenal de seguimiento/.test(plan) && /Reporte de defectos e incidentes de producción/.test(plan) && /Aprobado/.test(plan), 'el plan abre con Enter en el editor (código, matriz con el comité y el canal de producción, estado)');
    check(!(await errorCards(page)).length, 'el plan abre sin tarjetas de error');
    if (shots) await page.screenshot({ path: shots + '/plan-comunicaciones.png', fullPage: true });
    /* acta del CC-001: abrir desde la lista con el teclado */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 8000 });
    await page.getByLabel('Buscar documentos').fill('');
    await page.getByLabel('Buscar documentos').click();
    await page.keyboard.type('CC-001');
    await page.waitForTimeout(400);
    const link = page.locator('tr[data-doc="acta-reunion--cc001"] .docs-link');
    check(await link.count() === 1, 'la búsqueda «CC-001» encuentra el acta del comité de control de cambios');
    const onActa = await tabTo(() => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && !!a.closest('tr[data-doc="acta-reunion--cc001"]'); });
    check(onActa, 'con Tab el foco llega desde la búsqueda al enlace del acta del CC-001');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="acta-reunion--cc001"] [data-section]', { timeout: 10000 });
    const acta = norm(await page.locator('.page[data-doc-id="acta-reunion--cc001"]').innerText());
    check(/PRY-2026-021-AREU-04/.test(acta) && /Aprobar el CC-001 con la alternativa A/.test(acta) && /Comité de control de cambios/.test(acta) && /Compromisos/.test(acta), 'el acta del CC-001 abre con Enter (código, decisión y compromisos)');
    check(!(await errorCards(page)).length && !errors.length, 'sin tarjetas de error ni errores de consola', errors);
    if (shots) await page.screenshot({ path: shots + '/acta-cc001.png', fullPage: true });
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Documentos de comunicaciones en ' + variant.name);
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
        if (shots && (id === 'registro-comunicaciones' || id === 'plan-gestion-comunicaciones' || id === ACTAS[5])) await app.page.screenshot({ path: shots + '/' + id + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: false });
      }
      await gotoView(app.page, 'documentos');
      await app.page.waitForTimeout(300);
      const ovList = await horizontalOverflow(app.page);
      if (ovList > 1) bad.push({ id: 'documentos', ov: ovList });
      check(!bad.length, 'editor de los ocho documentos y lista sin desborde de página ni tarjetas de error' + (variant.width === 1920 ? ', a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

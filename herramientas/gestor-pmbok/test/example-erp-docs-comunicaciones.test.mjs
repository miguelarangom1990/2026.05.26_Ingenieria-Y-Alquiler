// Prueba de los documentos de comunicaciones del ejemplo ágil del ERP (src/97-example-erp-docs-comunicaciones.js): plan de
// gestión de las comunicaciones, registro de comunicaciones del proyecto y actas de reunión (comités y reuniones con decisiones).
// Uso: node test/example-erp-docs-comunicaciones.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y este módulo (sin los de otros grupos).
//   1) Datos (con el ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código, estado y
//      revisiones; todas las claves de su plantilla con contenido y opciones válidas; cada cifra igual a la que calcula la aplicación
//      (LB0, releases y velocidad con PM.calc y PM.agile, costo real de los releases, catálogo de recursos, cronograma) o a la de los
//      documentos de 95 (incidentes, riesgos, solicitud de cambio, informe de desempeño); calendario de reuniones coherente (comité
//      el jueves anterior a cada corte quincenal); ninguna fecha de un hecho pasa la fecha de corte ni la del documento, y los
//      documentos aprobados (y sus revisiones) no citan hechos posteriores a su fecha.
//   2) Interacción: crea el ejemplo desde el selector con el teclado, abre «Documentos» con el riel, revisa la lista maestra (código,
//      estado, revisión y enfoque), abre el plan de gestión de las comunicaciones con Tab y Enter y abre un acta con el teclado.
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
      V[id] = { tid, cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock })) };
      ok(tb.codigo === meta.code + '-' + (s.abbr || PM.templates[tid].abbr), id + ': código ' + meta.code + '-' + (s.abbr || PM.templates[tid].abbr), tb.codigo);
      ok(d.status === s.status && d.rev === s.rev && upd === s.date, id + ': estado ' + s.status + ', revisión ' + s.rev + ' del ' + s.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd && tb.aprobo : !tb.fechaAprobacion) && tb.elaboro && tb.reviso, id + ': cajetín y fecha de aprobación coherentes (día hábil, hasta el corte)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(s.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && (r.status !== 'aprobado' || r.titleBlock.fechaAprobacion === r.date)), id + ': historial de revisiones', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      const keys = tplKeys(tid);
      const versions = [V[id].cur, ...V[id].revs];
      const missing = versions.flatMap((v, k) => keys.filter((key) => empty(v.fields[key])).map((key) => (k ? 'rev ' + V[id].revs[k - 1].rev : 'vigente') + '.' + key));
      ok(!missing.length, id + ': todas las claves de la plantilla con contenido (vigente y revisiones)', missing);
      const isoBad = versions.flatMap((v) => strings(v.fields).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && (!D.valid(x) || x < '2026-04-01' || x > meta.end)));
      ok(!isoBad.length, id + ': fechas de los campos entre abril de 2026 y el fin del proyecto', isoBad);
      const late = versions.filter((v) => v.status === 'aprobado' || id === ACTAS[5]).map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': las versiones aprobadas no citan hechos posteriores a su fecha', late);
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
      ok(f.matriz.length === f0.matriz.length + 2 && added.length === 2 && added.some((k) => /defectos e incidentes de producción/.test(k)) && added.some((k) => /Acompañamiento en sitio/.test(k)), 'plan rev. 1: agrega el reporte de defectos de producción y el acompañamiento en sitio', added);
      ok(f.escalamiento.some((e) => e.nivel === 'Emergencia') && !f0.escalamiento.some((e) => e.nivel === 'Emergencia') && !/producción del release 1|mesa de ayuda de TI|R-003/.test(text(f0)), 'plan: la emergencia de producción y la mesa de ayuda de TI llegan con la rev. 1 (después de la salida del release 1)');
      ok(has(f.requisitos, dl(golive1)), 'plan rev. 1: cita la salida a producción del release 1', golive1);
      const inf = f0.matriz.find((r) => /Informe de desempeño/.test(r.informacion));
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
      const comites = [];
      for (let d = comite; d >= D.add(meetings.arranque, 14); d = D.add(d, -14)) comites.unshift(d);
      for (let d = D.add(comite, 14); d <= meta.end; d = D.add(d, 14)) comites.push(d);
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
      const r0 = V['registro-comunicaciones'].revs.find((r) => r.rev === '0').fields;
      ok(r0.comunicaciones.every((c) => c.fecha <= LB.date) && !/defectos de producción/.test(r0.archivo) && /defectos de producción/.test(V['registro-comunicaciones'].cur.fields.archivo), 'registro rev. 0: solo comunicaciones hasta la LB0');
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
    const n = await page.evaluate(() => PM.examples.length);
    await page.evaluate(() => { PM.createExampleProject(); });
    if (n > 1) {
      await page.waitForSelector('.example-card', { timeout: 8000 });
      const card = page.locator('.example-card[aria-label*="ERP"]');
      check(await card.count() === 1, 'el selector ofrece el ejemplo del ERP');
      await card.focus();
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
    await link.first().focus();
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

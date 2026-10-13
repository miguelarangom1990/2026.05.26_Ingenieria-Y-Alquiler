// Prueba de los documentos de negocio del ejemplo ágil del ERP (src/97-example-erp-docs-negocio.js): evaluación de
// necesidades, acuerdo con el cliente (acuerdo interno o memorando de entendimiento) e informe de realización de los
// beneficios (seguimiento programado para después del cierre).
// Uso: node test/example-erp-docs-negocio.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y los cinco módulos 97 (este módulo
//   necesita los documentos del de integración: caso de negocio, plan de gestión de los beneficios y financiamiento).
//   1) Datos (con el ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código,
//      estado, revisión y fechas; las cifras salen del caso de negocio, del plan de gestión de los beneficios, de la visión
//      del producto, del acta de constitución, de la LB0, del catálogo de recursos y del calendario del proyecto; los
//      documentos aprobados no citan hechos posteriores a su fecha y cada referencia a otro documento lleva la revisión
//      vigente a esa fecha; el informe de beneficios no tiene resultados (estado «Pendiente») y su medición es posterior
//      al cierre.
//   2) Interacción: crea el ejemplo desde el selector, abre «Documentos» con el riel, busca y abre el informe de
//      beneficios con el teclado (Tab y Enter, foco visible), escribe un resultado y revisa el avance calculado; abre el
//      acuerdo con el teclado (acumulados del otrosí) y la evaluación (brechas calculadas).
//   3) Sin --quick: los tres documentos en el editor en tema oscuro, a 400 px (claro y oscuro) y a 1920 px, sin desborde
//      de página ni tarjetas de error.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openApp, createExample, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const quick = args.includes('--quick');
const shots = opt('--shots');
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-erp-negocio-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp-negocio.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '1,2,3,4,5,6,7,8,90,91,92,93,94,95,96,97'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const IRB = 'informe-beneficios--seguimiento-1';
const MINE = ['evaluacion-necesidades', 'acuerdo-cliente', IRB];

/* ============================================================== 1: datos y cifras (en la página) */
async function validateInPage(page) {
  return page.evaluate(async ({ MINE, IRB }) => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, Fm = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const ms = (v) => plain(Fm.moneyShort(v, 'COP'));
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const dl = (iso) => plain(Fm.date(iso, 'long'));
    const r100k = (v) => Math.round(v / 1e5) * 1e5;
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const text = (fields) => strings(fields).join(' \n ');
    const empty = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
    const num = (s) => { const m = /(\d+(?:,\d+)?)/.exec(plain(s || '')); return m ? Number(m[1].replace(',', '.')) : null; };

    /* ---------- construcción e importación */
    const exm = PM.getExample('erp');
    ok(!!exm && PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts) && PM.exampleDocs.erpParts.length >= 2 && PM.exampleDocs.erpNegocio && PM.exampleDocs.erpIntegracion, 'módulo de documentos de negocio registrado en PM.exampleDocs.erpParts (con el de integración)');
    if (!exm || !PM.exampleDocs.erpNegocio) return out;
    const SUP = PM.exampleDocs.erpNegocio.SUP;
    const ex = exm.build({});
    ok(JSON.stringify(ex) === JSON.stringify(exm.build({ today: '2030-01-01' })), 'el constructor sigue siendo determinista con el módulo de negocio');
    const pid = await PM.projectOps.importData(ex);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    const schedule = await P('/tools/schedule'), agile = await P('/tools/agile'), resources = await P('/tools/resources');
    const docs = await PM.store.list(PM.paths.docs(pid));
    const docOf = (id) => { const d = docs.find((x) => x.id === id); return d ? d.data : null; };
    const revsOf = async (id) => (await PM.store.list(PM.paths.revs(pid, id))).map((r) => r.data).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    const cut = meta.statusDate;
    const cal = PM.cal.make(schedule.settings, meta.start);
    const LB = blDocs.map((b) => b.data).find((b) => b.number === 0);
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id);
    const task = (id) => schedule.tasks.find((t) => t.id === id);
    const R1 = agile.releases.find((r) => r.id === 'rel-1');
    const cat = (key) => resources.items.find((x) => x.id === 'rec-' + key);
    const tpl = (id) => PM.templates[id];
    const fieldDef = (tid, key) => tpl(tid).sections.flatMap((s) => s.fields).find((f) => f.key === key);
    const col = (tid, field, key) => fieldDef(tid, field).columns.find((c) => c.key === key);
    const optsOf = (tid, field, key) => (key ? col(tid, field, key).options : fieldDef(tid, field).options);
    const tplKeys = (id) => tpl(id).sections.flatMap((s) => s.fields.map((f) => f.key));
    const codeDates = Object.fromEntries((await PM.store.list(PM.paths.backlog(pid))).map((d) => [d.data.code, d.data.createdAt]));
    Object.assign(codeDates, { 'CC-001': R1.baseline.date, 'INC-001': '2026-07-22', 'INC-002': '2026-09-30', 'INC-003': '2026-10-05', 'INC-004': '2026-10-09', 'R-008': '2026-10-08' });
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    const golive1 = task('t29').actualFinish;
    const review1 = cal.addWork(golive1, 1);
    const allRevs = async (tid) => { const d = docOf(tid); return d ? [...(await revsOf(tid)).map((r) => [r.rev, r.status, String(r.date).slice(0, 10), r.fields]), [d.rev, d.status, String(d.updatedAt).slice(0, 10), d.fields]] : []; };
    const fieldsRev = async (tid, rv) => { const l = await allRevs(tid); const x = l.find((r) => String(r[0]) === String(rv)); return x ? x[3] : null; };

    const SPEC = {
      'evaluacion-necesidades': { status: 'aprobado', rev: '0', date: SUP.decision, revs: [] },
      'acuerdo-cliente': { status: 'aprobado', rev: '1', date: LB.date, revs: [['0', 'aprobado', meta.start], ['1', 'aprobado', LB.date]] },
      [IRB]: { status: 'borrador', rev: 'A', date: review1, revs: [] },
    };

    /* ---------- existencia, código, estado, revisiones, cajetín y claves */
    const V = {};
    for (const id of MINE) {
      const d = docOf(id);
      if (!ok(d, 'existe el documento ' + id)) continue;
      const tid = id.replace(/--.*$/, '');
      const s = SPEC[id], tb = d.titleBlock || {}, upd = String(d.updatedAt).slice(0, 10);
      const revs = await revsOf(id);
      V[id] = { cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock })), doc: d };
      const wantCode = meta.code + '-' + tpl(tid).abbr + (tpl(tid).multiple ? '-01' : '');
      ok(d.template === tid && tb.codigo === wantCode, id + ': código ' + wantCode, tb.codigo);
      ok(d.status === s.status && d.rev === s.rev && upd === s.date, id + ': estado ' + s.status + ', revisión ' + s.rev + ' del ' + s.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd : !tb.fechaAprobacion) && tb.aprobo === 'Gerencia General' && tb.elaboro && tb.reviso, id + ': cajetín coherente (día hábil hasta el corte; aprueba la Gerencia General; sin fecha de aprobación si no está aprobado)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(s.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && r.titleBlock.aprobo && r.titleBlock.fechaAprobacion === r.date), id + ': historial de revisiones con quien aprobó cada una', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      ok(tplKeys(tid).every((k) => k in d.fields) && V[id].revs.every((r) => tplKeys(tid).every((k) => k in r.fields)), id + ': todas las claves de la plantilla (vigente y revisiones)');
      const late = [V[id].cur, ...V[id].revs].map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': ninguna versión cita hechos posteriores a su fecha', late);
    }
    if (Object.keys(V).length !== MINE.length) return out;

    /* referencias «PRY-…-ABBR rev. N» a otros documentos: existen aprobadas a la fecha de la versión y son la última a esa fecha */
    const abbr = Object.fromEntries(Object.entries(PM.templates).map(([id, t]) => [t.abbr, id]));
    const refCheck = async (fields, at) => {
      const bad = [];
      for (const m of text(fields).matchAll(new RegExp(meta.code + '-([A-Z]+)(?: rev\\. (\\d+))?', 'g'))) {
        const tid = abbr[m[1]];
        if (!tid) { bad.push('sin plantilla ' + m[0]); continue; }
        const all = await allRevs(tid);
        if (!all.length) continue; /* documento de un módulo que la página no carga */
        if (!all.some(([rv, st, dt]) => (m[2] === undefined || String(rv) === m[2]) && st === 'aprobado' && dt <= at)) bad.push(at + ' → ' + m[0] + ' (no aprobado a esa fecha)');
        if (m[2] !== undefined && all.some(([rv, st, dt]) => /^\d+$/.test(String(rv)) && st === 'aprobado' && dt <= at && Number(rv) > Number(m[2]))) bad.push(at + ' → ' + m[0] + ' (ya había una revisión posterior)');
      }
      return bad;
    };

    /* ---------- datos que se cruzan */
    const caso = docOf('caso-negocio'), caso0 = await fieldsRev('caso-negocio', '0');
    const pben = docOf('plan-gestion-beneficios'), pben0 = await fieldsRev('plan-gestion-beneficios', '0');
    const acta = docOf('acta-constitucion'), acta0 = await fieldsRev('acta-constitucion', '0');
    const vis = docOf('vision-producto').fields.metricasExito;
    const B = PM.exampleDocs.erpIntegracion.BEN;
    ok(caso && caso0 && pben && pben0 && acta && acta0 && vis && vis.length === 5, 'el ejemplo trae el caso de negocio, el plan de beneficios, el acta y la visión que citan los documentos de negocio');

    /* ---------- evaluación de necesidades */
    {
      const f = V['evaluacion-necesidades'].cur.fields, d = V['evaluacion-necesidades'].doc;
      ok(f.fechaEvaluacion === SUP.evaluacion && f.fechaDecision === SUP.decision && String(d.createdAt).slice(0, 10) === f.fechaEvaluacion && f.fechaEvaluacion <= f.fechaDecision && cal.isWork(f.fechaEvaluacion) && cal.isWork(f.fechaDecision), 'evaluación: elaborada y decidida en días hábiles (creación = fecha de la evaluación; aprobación = decisión)', [f.fechaEvaluacion, f.fechaDecision]);
      ok(f.fechaDecision < caso0.fechaCaso && caso0.fechaCaso < meta.start && f.fechaEvaluacion >= '2026-04-01', 'evaluación: anterior al caso de negocio rev. 0 (' + caso0.fechaCaso + ') y al inicio del proyecto', [f.fechaDecision, caso0.fechaCaso, meta.start]);
      ok(f.decision === 'Elaborar el caso de negocio' && optsOf('evaluacion-necesidades', 'decision').includes(f.decision) && optsOf('evaluacion-necesidades', 'origen').includes(f.origen), 'evaluación: decisión de elaborar el caso de negocio y origen de la plantilla');
      ok(f.nombre === meta.name && f.patrocinador === meta.sponsor, 'evaluación: necesidad con el nombre del proyecto y el patrocinador de la ficha');
      /* brechas: los valores son los criterios de éxito del caso de negocio rev. 0 (estimaciones previas al descubrimiento) */
      const crit = (re) => plain(caso0.criteriosExito.find((s) => re.test(plain(s))) || '');
      const pair = (s) => { const m = /: de (?:cerca de )?(\d+(?:,\d+)?)[^]*? a (\d+(?:,\d+)?)/.exec(s); return m ? [num(m[1]), num(m[2])] : [null, null]; };
      const want = { 'Cierre mensual de facturación de alquileres': pair(crit(/^Cierre mensual/)), 'Inventario por bodega y obra': pair(crit(/^Diferencia entre el inventario/)), 'Utilización del andamio multidireccional': pair(crit(/^Utilización/)), Cartera: pair(crit(/^Cartera vencida/)), 'Factura electrónica': [null, num(crit(/^Facturas electrónicas/))] };
      const br = Object.fromEntries(f.brechas.map((r) => [r.aspecto, r]));
      const brBad = Object.entries(want).filter(([k, [a, b]]) => !br[k] || br[k].valorActual !== a || br[k].valorDeseado !== b || b === null).map(([k]) => [k, br[k] && [br[k].valorActual, br[k].valorDeseado], want[k]]);
      ok(!brBad.length, 'evaluación: brechas medibles con los valores de los criterios del caso de negocio rev. 0 (5 → 1 días, 4 % → 0,5 %, 62 % → 75 %, 18 % → 10 %, rechazos < 1 %)', brBad);
      ok(br['Utilización del andamio multidireccional'].valorActual === Math.round(B.utilBase * 100) && br['Utilización del andamio multidireccional'].valorDeseado === Math.round(B.utilMeta * 100) && br.Cartera.valorActual === Math.round(B.carteraBase * 100) && br.Cartera.valorDeseado === Math.round(B.carteraMeta * 100), 'evaluación: utilización y cartera iguales a las bases del caso de negocio (BEN)');
      /* las mismas estimaciones son las líneas base de la rev. 0 del plan de gestión de los beneficios */
      const lb0 = pben0.beneficios.slice(0, 5).map((b) => plain(b.lineaBase));
      ok([['Cierre mensual de facturación de alquileres', 0], ['Inventario por bodega y obra', 2], ['Utilización del andamio multidireccional', 3], ['Cartera', 4]].every(([k, i]) => has(lb0[i], plain(Fm.num(br[k].valorActual, 1)) + (i ? ' %' : ' días'))), 'evaluación: los valores actuales coinciden con las líneas base de la rev. 0 del plan de gestión de los beneficios', lb0);
      /* regresión: la diferencia de inventario se mide en el descubrimiento y la utilización en julio (plan rev. 0 y visión) */
      const when = (s) => (/se mide en ([^)]+)\)/.exec(plain(s)) || [])[1];
      const wInv = when(lb0[2]), wUtil = when(lb0[3]);
      ok(wInv === 'el descubrimiento' && wUtil === 'julio' && has(f.recomendacion, 'la diferencia de inventario se medirá en ' + wInv) && has(f.recomendacion, 'la utilización, con el inventario de ' + wUtil) && !/utilización se medirán? en el descubrimiento/.test(plain(f.recomendacion)) && has(br['Utilización del andamio multidireccional'].actual, 'inventario de ' + wUtil) && /julio/.test(vis[3].lineaBase), 'evaluación: la recomendación mide la diferencia de inventario en el descubrimiento y la utilización con el inventario de julio, como el plan de beneficios rev. 0 y la visión', [lb0[2], lb0[3], f.recomendacion]);
      const brecha = col('evaluacion-necesidades', 'brechas', 'brecha').calc;
      ok(f.brechas.every((r) => brecha(r, f.brechas) === (r.valorActual === null || r.valorDeseado === null ? null : Math.round((r.valorDeseado - r.valorActual) * 100) / 100)) && brecha(br['Inventario por bodega y obra'], f.brechas) === -3.5 && brecha(br['Utilización del andamio multidireccional'], f.brechas) === 13, 'evaluación: brecha calculada = valor deseado − valor actual (−3,5 en inventario, 13 en utilización)');
      /* opciones: las del caso de negocio rev. 0, todas pasan al caso; la recomendada atiende la necesidad */
      const op0 = caso0.opciones;
      ok(JSON.stringify(f.opciones.map((o) => o.opcion)) === JSON.stringify(op0.map((o) => o.opcion)) && f.opciones.every((o) => o.pasaCaso === true && optsOf('evaluacion-necesidades', 'opciones', 'atiende').includes(o.atiende)), 'evaluación: las cuatro opciones del caso de negocio, todas pasan al caso', f.opciones.map((o) => o.opcion));
      ok(f.opciones[op0.findIndex((o) => o.recomendada)].atiende === 'Sí' && f.opciones[0].atiende === 'No', 'evaluación: la opción que el caso recomienda atiende la necesidad y «no hacer nada» no');
      /* afectados: roles del registro de interesados rev. 0 (más los clientes de alquiler, externos) */
      const st0 = (await fieldsRev('registro-interesados', '0')).interesados.map((x) => x.nombre);
      const afBad = f.afectados.filter((a) => !/^Clientes/.test(a.interesado) && !st0.some((n) => a.interesado.startsWith(n))).map((a) => a.interesado);
      ok(!afBad.length && f.afectados.every((a) => optsOf('evaluacion-necesidades', 'afectados', 'grado').includes(a.grado)), 'evaluación: interesados afectados del registro de interesados rev. 0, con grado de la plantilla', afBad);
      /* supuestos y restricciones: los del registro de supuestos rev. 0 (S-04 a S-06) */
      const sup0 = (await fieldsRev('registro-supuestos', '0')).supuestos;
      const keys = [['S-04', 'anexo técnico vigente de la DIAN'], ['S-05', 'cinco primeros días hábiles'], ['S-06', 'contabilidad y la revisoría fiscal']];
      ok(keys.every(([sid, k]) => has(sup0.find((s) => s.id === sid).descripcion, k) && f.supuestosRestricciones.some((x) => has(x, k))), 'evaluación: supuestos y restricciones que pasan al registro de supuestos (S-04 a S-06)');
      ok(!/LB0|CC-\d|R-\d{3}|680|implementador contratado|contratos firmados/.test(text(f)), 'evaluación: no cita la LB0, el presupuesto aprobado, los contratos ni el registro de riesgos (posteriores)');
      ok(['problema', 'recomendacion', 'brechas', 'causas', 'afectados', 'opciones', 'criteriosEvaluacion', 'supuestosRestricciones'].every((k) => !empty(f[k])), 'evaluación: campos principales con contenido');
    }

    /* ---------- acuerdo interno (acuerdo con el cliente) */
    {
      const f = V['acuerdo-cliente'].cur.fields, f0 = V['acuerdo-cliente'].revs[0].fields;
      for (const [v, name] of [[f, 'vigente'], [f0, 'rev. 0']]) {
        ok(v.tipoAcuerdo === 'Acuerdo interno o memorando de entendimiento' && v.modalidadPrecio === 'Presupuesto interno asignado' && v.baseValor === 'No aplica (acuerdo interno)' && optsOf('acuerdo-cliente', 'tipoAcuerdo').includes(v.tipoAcuerdo), 'acuerdo (' + name + '): acuerdo interno con presupuesto interno asignado (proyecto interno)');
        ok(v.valorInicial === acta0.presupuesto && v.anticipoPct === 0 && v.anticipoValor === 0 && v.retencionPct === 0 && Array.isArray(v.polizas) && !v.polizas.length && /no se exigen pólizas/.test(v.otrasClausulas), 'acuerdo (' + name + '): valor inicial = presupuesto preliminar del acta rev. 0 (' + ms(acta0.presupuesto) + '); sin anticipo, retención ni pólizas', [v.valorInicial, v.polizas]);
        ok(v.fechaFirma === meta.start && v.fechaInicio === meta.start && v.fechaTerminacion === meta.end && has(v.plazo, plain(Fm.num(D.diff(meta.start, meta.end) + 1, 0)) + ' días calendario') && has(v.plazo, plain(Fm.num(cal.countWork(meta.start, meta.end), 0)) + ' días hábiles'), 'acuerdo (' + name + '): firmado con el acta, del inicio al fin del proyecto, plazo en días calendario y hábiles calculado', v.plazo);
        const po = cat('po'), uc = cat('uc');
        const ob = text(v.obligaciones.map((o) => o.obligacion));
        /* regresión: las áreas con usuario clave son las del catálogo (seis personas, sin contabilidad); contabilidad
           participa con el contador (rec-con) y la firma el gerente administrativo y financiero */
        const areasUc = (/usuario clave de (.+?) \(/.exec(plain(uc.notes)) || [])[1];
        ok(areasUc && !/contabilidad/.test(areasUc) && cat('con') && has(v.objeto, '—' + areasUc + '—') && has(v.objeto, 'contabilidad, por medio del contador') && has(v.contratista, '(' + areasUc + ') y contabilidad') && has(ob, '(' + areasUc + ': seis en total)') && !/cartera, y contabilidad/.test(plain(text(v))), 'acuerdo (' + name + '): áreas usuarias con usuario clave iguales a las del catálogo de recursos (' + areasUc + '); contabilidad, con el contador', [v.objeto, v.contratista]);
        const sig0 = v.firmas.filter((x) => x.fecha === meta.start);
        ok(sig0.some((x) => x.nombre === 'Jefe de facturación y cartera') && sig0.some((x) => x.nombre === 'Gerente administrativo y financiero' && /contabilidad/.test(x.rol)) && has(v.responsableContratista, 'el de facturación y cartera, por esas dos áreas') && has(v.responsableContratista, 'por contabilidad') && sig0.length === 9, 'acuerdo (' + name + '): las firmas siguen la regla del responsable (jefe de cada área, el de facturación y cartera por esas dos, y el gerente administrativo y financiero por contabilidad)', sig0.map((x) => x.rol + ': ' + x.nombre));
        ok(has(ob, (po.dedication ?? 100) + ' % de su jornada') && has(ob, 'dos horas diarias') && (po.dedication ?? 100) / 100 * (po.hoursPerDay || 8) === 2 && has(ob, ': seis en total)') && uc.availability === 6 && has(ob, plain(Fm.money(uc.unitCost, 'COP')) + ' por día') && has(ob, 'jefe de la PMO al ' + (cat('dir').dedication ?? 100) + ' %') && has(ob, 'Scrum Master al ' + (cat('sm').dedication ?? 100) + ' %'), 'acuerdo (' + name + '): dedicación del dueño del producto, de los usuarios clave, del director y del Scrum Master según el catálogo de recursos');
        ok(['Contratante o patrocinador', 'Contratista o área ejecutora', 'Ambas partes'].every((p) => v.obligaciones.some((o) => o.parte === p)) && v.obligaciones.every((o) => optsOf('acuerdo-cliente', 'obligaciones', 'parte').includes(o.parte) && o.responsable && o.clausula), 'acuerdo (' + name + '): obligaciones de las dos partes y conjuntas, con cláusula y responsable');
        ok(v.firmas.every((x) => x.fecha <= (name === 'vigente' ? LB.date : meta.start) && x.rol && x.nombre) && v.firmas.filter((x) => x.fecha === meta.start).length >= 8, 'acuerdo (' + name + '): firmas de la Gerencia General y de las áreas con fecha hasta la de la versión', v.firmas.map((x) => x.rol + ' ' + x.fecha));
      }
      /* modificaciones: el otrosí No. 1 de la LB0 lleva el valor al presupuesto aprobado; el plazo no cambia */
      const mods = f.modificaciones, accV = col('acuerdo-cliente', 'modificaciones', 'valorAcumulado').calc, accP = col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado').calc;
      ok(!f0.modificaciones.length && mods.length === 1 && mods[0].fecha === LB.date && mods[0].estado === 'Firmada' && optsOf('acuerdo-cliente', 'modificaciones', 'tipo').includes(mods[0].tipo) && optsOf('acuerdo-cliente', 'modificaciones', 'estado').includes(mods[0].estado), 'acuerdo: la rev. 0 no tiene modificaciones y la rev. 1 tiene el otrosí No. 1 firmado con la LB0', mods);
      ok(mods[0].efectoValor === meta.budget - acta0.presupuesto && f.valorInicial + accV(mods[0], mods) === meta.budget && meta.budget === acta.fields.presupuesto && accP(mods[0], mods) === 0 && mods[0].efectoPlazo === D.diff(acta0.fechaFin, acta.fields.fechaFin), 'acuerdo: valor inicial + adiciones acumuladas (columna calculada, ' + ms(meta.budget - acta0.presupuesto) + ') = presupuesto aprobado del acta rev. 1 (' + ms(meta.budget) + '), sin prórroga');
      ok([LB.cost.bac, LB.cost.contingency, LB.cost.management, meta.budget, acta0.presupuesto].every((x) => has(mods[0].objeto, ms(x))), 'acuerdo: el otrosí cita el BAC y las reservas de la LB0', mods[0].objeto);
      /* regresión: la regla dice que firman el otrosí quienes firman el acuerdo; el otrosí No. 1 lo firman los nueve de la rev. 0 */
      const who = (list, at) => list.filter((x) => x.fecha === at).map((x) => x.nombre).sort();
      ok(who(f.firmas, LB.date).length === 9 && JSON.stringify(who(f.firmas, LB.date)) === JSON.stringify(who(f0.firmas, meta.start)) && JSON.stringify(who(f.firmas, meta.start)) === JSON.stringify(who(f0.firmas, meta.start)) && f.firmas.filter((x) => x.fecha === LB.date).every((x) => / \(otrosí No\. 1\)$/.test(x.rol)) && f.firmas.length === 18 && [f, f0].every((v) => has(v.controlModificaciones, 'las firman como otrosí quienes firman este acuerdo')), 'acuerdo: el otrosí No. 1 (presupuesto y aceptación de los tres releases) lo firman con la LB0 los mismos nueve firmantes de la rev. 0, como exige la regla de modificación', f.firmas.map((x) => x.rol + ' ' + x.fecha));
      /* decisión sobre el CC-001: nivel 2, sin cambio de presupuesto ni de fecha del release; no modifica el acuerdo */
      const cc1 = docOf('solicitud-cambio--cc001');
      const u = (n) => docOf('plan-gestion-cambios').fields.umbrales.find((x) => x.nivel === 'Nivel ' + n);
      const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1).replace(/\.\s*$/, '');
      ok(cc1 && cc1.fields.nivelAutoridad === 'Nivel 2' && R1.baseline.changeRef === 'CC-001' && R1.baseline.budget === lbT(R1.taskId).cost && R1.baseline.end === lbT(R1.taskId).finish && !mods.some((m) => /CC-001/.test(m.solicitudCambio)), 'acuerdo: el CC-001 (nivel 2, sin cambiar presupuesto ni fecha del release 1) no genera una modificación del acuerdo', [cc1 && cc1.fields.nivelAutoridad, R1.baseline]);
      ok([1, 2, 3].every((n) => has(f.controlModificaciones, lc(u(n).criterio))) && /nivel 3 del plan de gestión de cambios/.test(f.controlModificaciones) && /no modifican este acuerdo/.test(f.controlModificaciones), 'acuerdo rev. 1: la regla de modificación usa los niveles del plan de gestión de cambios (solo el nivel 3 o la dedicación requieren otrosí)', f.controlModificaciones);
      /* forma de pago: tramos de los requisitos de financiamiento rev. 0 (= línea base de costos) y reserva de gestión */
      const rf0 = await fieldsRev('requisitos-financiamiento', '0');
      const tr = rf0.periodos.filter((p) => p.financiamiento > 0);
      ok(sum(tr, (p) => p.financiamiento) === LB.cost.bac + LB.cost.contingency && has(f.formaPago, ms(sum(tr, (p) => p.financiamiento))) && has(f.formaPago, 'en cuatro tramos') && tr.length === 4 && has(f.formaPago, ms(LB.cost.management)), 'acuerdo rev. 1: forma de pago con los tramos del financiamiento (' + ms(LB.cost.bac + LB.cost.contingency) + ') y la reserva de gestión');
      ok(!/LB0|680|tramos que suman|otrosí No|CC-\d|R-\d{3}/.test(text(f0)) && !has(text(f0), ms(meta.budget)), 'acuerdo rev. 0: no cita la LB0, el presupuesto aprobado ni el otrosí');
      /* condiciones de aceptación: las del acta de cada versión con las salidas a producción de sus hitos */
      const hitos = (a) => a.hitos.filter((h) => /^Release \d en producción$/.test(h.hito));
      ok(hitos(acta.fields).length === 3 && hitos(acta.fields).every((h) => has(f.condicionesAceptacion, dl(h.fecha))) && hitos(acta0).length === 1 && has(f0.condicionesAceptacion, dl(hitos(acta0)[0].fecha)) && !has(f0.condicionesAceptacion, dl(hitos(acta.fields)[1].fecha)) && has(f.condicionesAceptacion, acta.fields.requisitosAprobacion), 'acuerdo: criterios de aceptación de cada release con las salidas a producción del acta (rev. 0: solo el release 1)');
      /* número del memorando distinto de los contratos del registro de contratos y acuerdos (si el módulo está cargado) */
      const radq = docOf('registro-adquisiciones');
      const nums = radq ? [...new Set(text(radq.fields).match(/\b(?:CT|OS|OC)-\d{4}-\d{3}\b/g) || [])] : [];
      ok(f.numeroAcuerdo === SUP.memorando + meta.code && !nums.includes(f.numeroAcuerdo) && (!radq || nums.length >= 5), 'acuerdo: número del memorando (' + f.numeroAcuerdo + ') distinto de los contratos del registro (' + nums.length + ')', nums);
      /* referencias a otros documentos con la revisión vigente a la fecha de cada versión */
      const bad = [...(await refCheck(f, LB.date)), ...(await refCheck(f0, meta.start))];
      ok(!bad.length && /PDP rev\. 0/.test(text(f.documentosContractuales)) && /PBEN rev\. 1/.test(text(f.documentosContractuales)) && /CNEG rev\. 0/.test(text(f0.documentosContractuales)), 'acuerdo: cada documento citado está aprobado a la fecha de la versión y es su última revisión', bad);
    }

    /* ---------- informe de realización de los beneficios (seguimiento programado) */
    {
      const d = V[IRB].doc, f = d.fields;
      const firstWorkNext = (m) => cal.dateOf(cal.indexOf(D.addMonths(m, 1)));
      const m1 = D.addMonths(D.startOfMonth(meta.end), 1), m2 = D.addMonths(m1, 1);
      const at1 = cal.addWork(firstWorkNext(m1), 5), at2 = cal.addWork(firstWorkNext(m2), 5);
      ok(d.title === 'Seguimiento de beneficios n.º 1 — programado para el ' + dl(f.fechaMedicion) && String(d.createdAt).slice(0, 10) === review1 && review1 <= cut, 'informe: título «Seguimiento de beneficios n.º 1 — programado para…», borrador creado con la revisión del caso al cierre del release 1 (' + review1 + ')', d.title);
      ok(f.periodoDesde === m1 && f.periodoHasta === D.add(m2, -1) && f.fechaMedicion === at1 && f.fechaMedicion > meta.end && cal.isWork(f.fechaMedicion) && cal.countWork(firstWorkNext(m1), D.add(f.fechaMedicion, -1)) === 5, 'informe: mide el primer mes completo después del cierre (' + m1 + ') al terminar su cierre contable (sexto día hábil del mes siguiente: ' + at1 + ')', [f.periodoDesde, f.periodoHasta, f.fechaMedicion]);
      const carteraMeta = vis[4].fecha;
      ok(f.proximaMedicion === at2 && carteraMeta >= m2 && carteraMeta < D.addMonths(m2, 1) && has(pben.fields.transicion, dl(carteraMeta)) && has(f.alcanceProximaMedicion, dl(carteraMeta)), 'informe: la próxima medición (' + at2 + ') cubre el mes de la meta de cartera, la última de la medición mensual del plan de beneficios', [f.proximaMedicion, carteraMeta]);
      ok(f.duenoBeneficios === pben.fields.responsableBeneficios && f.proyecto === meta.name, 'informe: dueño de los beneficios del plan de gestión de los beneficios');
      /* sin resultados inventados */
      const avance = col('informe-beneficios', 'beneficios', 'avance').calc;
      ok(f.beneficios.every((b) => b.estado === 'Pendiente' && b.resultado === null && avance(b, f.beneficios) === null) && !f.noPrevistos.length && empty(f.desviaciones) && f.conclusionCaso === 'Aún no se puede concluir' && optsOf('informe-beneficios', 'conclusionCaso').includes(f.conclusionCaso), 'informe: todos los beneficios «Pendiente», sin resultado ni avance, sin beneficios no previstos ni desviaciones, y conclusión «Aún no se puede concluir»');
      ok(f.acciones.every((a) => optsOf('informe-beneficios', 'acciones', 'estado').includes(a.estado) && a.fechaObjetivo > d.updatedAt.slice(0, 10) && a.responsable) && f.acciones.some((a) => a.fechaObjetivo === carteraMeta) && f.acciones.some((a) => a.fechaObjetivo === at2), 'informe: acciones de la transición del plan de beneficios con responsable y fecha futura');
      /* beneficios: los del plan de gestión de los beneficios (vigente) en su orden, más el beneficio bruto del caso */
      const pb = pben.fields.beneficios;
      ok(f.beneficios.length === pb.length + 1 && pb.every((b, i) => f.beneficios[i].beneficio === b.beneficio && f.beneficios[i].indicador === b.metrica), 'informe: un beneficio por fila del plan de gestión de los beneficios (mismo nombre e indicador) más el del caso de negocio', f.beneficios.map((b) => b.beneficio));
      const visLb = (m) => num(/^\d/.test(m.lineaBase) ? m.lineaBase : '');
      const visBad = vis.map((m, i) => [m, f.beneficios[i]]).filter(([m, b]) => !b || b.lineaBase !== visLb(m) || b.meta !== (visLb(m) === null ? null : num(m.meta)) || b.fechaMeta !== m.fecha || !b.unidad).map(([m, b]) => [m.metrica, b && [b.lineaBase, b.meta, b.fechaMeta]]);
      ok(!visBad.length && f.beneficios[1].lineaBase === null, 'informe: las cinco métricas de la visión con su línea base, meta y fecha meta (sin línea base numérica en los rechazos de la DIAN)', visBad);
      /* regresión: rechazos de la DIAN, meta tope sin línea base → sin meta en la tabla (el avance no se calcula) y el tope en el comentario */
      const rech = f.beneficios[1];
      ok(rech.meta === null && has(rech.comentario, 'menos de ' + plain(Fm.num(num(vis[1].meta), 0)) + ' %') && [2, 0.4, 1].every((r) => avance({ ...rech, resultado: r }, f.beneficios) === null), 'informe: los rechazos de la DIAN no tienen meta numérica en la tabla (con 2 % o 0,4 % el avance no muestra 200 % ni 40 %) y el tope va en el comentario', [rech.meta, rech.comentario]);
      ok(f.beneficios.filter((b) => b.lineaBase === null && b.meta !== null).every((b) => b.meta === 100 && /^% de las /.test(b.unidad)), 'informe: sin línea base solo hay meta en las de «toda» (100 % desde 0 %), donde el avance desde 0 tiene sentido');
      const byName = (re) => f.beneficios.find((b) => re.test(b.beneficio));
      const planOf = (re) => pb.find((b) => re.test(b.beneficio));
      const fuga = r100k(B.ingresos * B.fuga), tiempo = r100k(B.diasPersona * cat('uc').unitCost);
      const util = r100k(B.m2 * (B.utilMeta - B.utilBase) * B.tarifa * 12 * B.atribucion * B.margen), cart = r100k(B.cartera * (B.carteraBase - B.carteraMeta) * B.tasa);
      const annual = fuga + util + cart + tiempo;
      const fullYear = B.years[B.rampa.findIndex((x) => x >= 1)];
      const fr = byName(/[Ff]acturación recuperada/), ti = byName(/[Tt]iempo administrativo/), mt = byName(/[Mm]antenimiento preventivo/), tot = f.beneficios[f.beneficios.length - 1];
      ok(fr.meta === fuga && fr.lineaBase === 0 && fr.fechaMeta === fullYear + '-12-31' && has(planOf(/[Ff]acturación recuperada/).meta, ms(fuga)) && has(fr.comentario, ms(fuga * B.rampa[0])), 'informe: facturación recuperada con la meta del caso a plena adopción (' + ms(fuga) + ', ' + fullYear + ') y el ' + Math.round(B.rampa[0] * 100) + ' % del primer año');
      ok(ti.meta === B.diasPersona && ti.lineaBase === 0 && ti.fechaMeta === fullYear + '-12-31' && has(planOf(/[Tt]iempo administrativo/).meta, plain(Fm.num(B.diasPersona, 0)) + ' días-persona') && has(ti.comentario, ms(tiempo)), 'informe: tiempo administrativo liberado (' + B.diasPersona + ' días-persona, ' + ms(tiempo) + ' al año)');
      ok(mt.meta === num(planOf(/[Mm]antenimiento preventivo/).meta) && has(planOf(/[Mm]antenimiento preventivo/).meta, dl(mt.fechaMeta)), 'informe: mantenimiento preventivo con la meta y la fecha del plan (' + mt.fechaMeta + ')');
      const neto = caso.fields.valorContrato - caso.fields.costoEstimado;
      ok(tot.meta === annual && tot.lineaBase === 0 && has(caso.fields.supuestosCaso, ms(annual)) && [fuga, util, cart, tiempo].every((x) => has(tot.comentario, ms(x))) && has(tot.comentario, ms(neto)) && has(caso.fields.recomendacion, ms(neto)) && has(tot.comentario, ms(annual * B.rampa[0])), 'informe: beneficio bruto anual del caso de negocio (' + ms(annual) + ') con sus cuatro componentes y el beneficio neto a tres años (' + ms(neto) + ')');
      /* regresión: la unidad del cobro con soporte es el universo de la meta del plan (devoluciones con diferencia de peso > 3 %) */
      const cobro = byName(/Cobro con soporte/), cobroMeta = plain(planOf(/Cobro con soporte/).meta);
      const universo = (/^Toda devolución( con .*?%)/.exec(cobroMeta) || [])[1];
      ok(universo && cobro.meta === 100 && cobro.unidad === '% de las devoluciones' + universo && has(cobro.unidad, 'diferencia de peso mayor a 3 %'), 'informe: la unidad del cobro con soporte es la de la meta del plan («' + cobro.unidad + '»)', [cobro.unidad, cobroMeta]);
      /* regresión: las acciones son de sostenimiento, posteriores al cierre; la de adopción con los responsables del acuerdo */
      const adop = V['acuerdo-cliente'].cur.fields.obligaciones.find((o) => o.clausula === 'Adopción');
      const acAdop = f.acciones.find((a) => /hojas de cálculo/.test(a.accion));
      ok(f.acciones.every((a) => a.fechaObjetivo > meta.end && !/al salir cada release/.test(a.accion)) && acAdop && adop && acAdop.responsable === adop.responsable && acAdop.fechaObjetivo === f.fechaMedicion && /^Verificar/.test(acAdop.accion), 'informe: acciones posteriores al cierre; la de adopción verifica en cada medición con los responsables de la obligación de adopción del acuerdo («' + (adop && adop.responsable) + '»)', f.acciones.map((a) => [a.accion.slice(0, 50), a.responsable, a.fechaObjetivo]));
      const intang = pb.filter((b) => b.tipo === 'Intangible').map((b) => f.beneficios[pb.indexOf(b)]);
      ok(intang.length === 2 && intang.every((b) => b.lineaBase === null && D.valid(b.fechaMeta) && b.fechaMeta <= meta.end) && intang.some((b) => b.fechaMeta === lbT('t33').start), 'informe: los beneficios intangibles se verifican (sin línea base numérica), uno al salir el último release (' + lbT('t33').start + ')');
      ok(f.beneficios.every((b) => optsOf('informe-beneficios', 'beneficios', 'estado').includes(b.estado) && b.comentario && /^Responsable: /.test(b.comentario)), 'informe: cada beneficio con su responsable en el comentario');
      const mig = /(\d+,\d+)\s*%/.exec(task('t17').notes)[1];
      ok(has(f.beneficios[2].comentario, mig + ' %') && has(pben.fields.mecanismoMedicion, mig + ' %'), 'informe: la primera medición del inventario (' + mig + ' % en la migración) solo se cita como comentario, igual que en el plan de beneficios rev. 2');
      const bad = await refCheck(f, d.updatedAt.slice(0, 10));
      ok(!bad.length && /PBEN rev\. 2/.test(f.fuentes) && /CNEG rev\. 1/.test(tot.comentario), 'informe: cita el plan de beneficios rev. 2 y el caso de negocio rev. 1, vigentes a su fecha', bad);
    }
    ok(['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].every((id) => PM.docApproach && PM.docApproach(id) && PM.docApproach(id).id === 'ambos'), 'los tres documentos de negocio son de «Ambos enfoques» (11-doc-approach)');
    ok(!docs.some((x) => x.id.startsWith('informe-beneficios') && x.id !== IRB), 'el ERP tiene un solo informe de beneficios (el seguimiento programado)');
    return out;
  }, { MINE, IRB });
}

/* ============================================================== ejecución */
section('Datos y cifras de los documentos de negocio (' + file + ')');
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
  const plainTxt = async (sel) => norm(await page.locator(sel).innerText());
  const openFromList = async (query, linkText) => {
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForFunction(() => PM.getState().view === 'documentos', null, { timeout: 8000 });
    await page.waitForSelector('tr[data-doc]', { timeout: 10000 });
    const search = page.getByLabel('Buscar documentos');
    await search.fill('');
    await search.click();
    await page.keyboard.type(query);
    await page.waitForTimeout(400);
    let reached = false;
    for (let k = 0; k < 40 && !reached; k++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate((t) => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && a.textContent.trim().replace(/[  ]/g, ' ') === t; }, linkText);
    }
    const ring = reached && await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; });
    return { reached, ring };
  };
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
    check(code === 'PRY-2026-021', 'ejemplo del ERP creado desde el selector con el teclado', code);

    /* lista maestra: los tres documentos con código, estado y revisión */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 10000 });
    const rowsInfo = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => ({ key: tr.getAttribute('data-doc'), name: (tr.querySelector('.docs-link') || {}).textContent || '', code: (tr.querySelector('.docs-c-code') || {}).textContent || '', status: (tr.querySelector('.docs-c-status') || {}).textContent || '', rev: (tr.querySelector('.docs-c-rev') || {}).textContent || '' })));
    const want = { 'evaluacion-necesidades': ['PRY-2026-021-EVN', 'Aprobado', '0'], 'acuerdo-cliente': ['PRY-2026-021-ACU', 'Aprobado', '1'], [IRB]: ['PRY-2026-021-IRB-01', 'Borrador', 'A'] };
    const rowBad = Object.entries(want).filter(([key, [cd, stt, rv]]) => { const r = rowsInfo.find((x) => x.key === key); return !r || norm(r.code).trim() !== cd || !norm(r.status).includes(stt) || !norm(r.rev).trim().endsWith(rv); });
    check(!rowBad.length, 'lista maestra: evaluación (EVN, aprobada, rev. 0), acuerdo (ACU, aprobado, rev. 1) e informe de beneficios (IRB-01, borrador, rev. A)', rowBad.map(([k]) => [k, rowsInfo.find((x) => x.key === k)]));
    const order = rowsInfo.map((r) => r.key);
    check(order.indexOf('evaluacion-necesidades') < order.indexOf('caso-negocio') && order.indexOf('acuerdo-cliente') < order.indexOf('acta-constitucion') && order.indexOf(IRB) > order.indexOf('caso-negocio'), 'lista maestra: la evaluación antes del caso de negocio y el acuerdo antes del acta', order.filter((k) => /evaluacion|caso|acuerdo|acta-const|beneficios/.test(k)));
    if (shots) await page.screenshot({ path: shots + '/documentos.png', fullPage: false });

    /* informe de beneficios: buscar, Tab hasta el enlace del seguimiento y abrir con Enter */
    const irbTitle = await page.evaluate(async (id) => (await PM.store.get(PM.paths.doc(PM.getState().projectId, id))).title, IRB);
    let r = await openFromList('beneficios', norm(irbTitle));
    check(r.reached, 'con Tab el foco llega al enlace del seguimiento de beneficios («' + norm(irbTitle) + '»)');
    check(r.ring, 'el enlace enfocado muestra el foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="' + IRB + '"] [data-section]', { timeout: 10000 });
    let txt = await plainTxt('.page[data-doc-id="' + IRB + '"]');
    check(/PRY-2026-021-IRB-01/.test(txt) && /Borrador/.test(txt) && /Avance hacia la meta/.test(txt) && /programado/.test(txt), 'el informe abre con Enter en el editor (código, borrador, tabla con el avance)');
    const bn = page.locator('.page[data-doc-id="' + IRB + '"] [data-field="beneficios"]');
    const nRows = await bn.locator('tbody tr').count();
    const estados = await bn.evaluate((el) => [...el.querySelectorAll('tbody tr')].map((tr) => { const s = tr.querySelector('select[aria-label^="Estado"]'); return s ? s.value : null; }));
    check(nRows === 11 && estados.every((x) => x === 'Pendiente'), 'el informe muestra los once beneficios en estado «Pendiente» (texto en la lista, no solo color)', estados);
    const calc0 = await bn.evaluate((el) => [...el.querySelectorAll('tbody tr')].map((tr) => (tr.querySelector('td.col-calc') || {}).textContent.trim()));
    check(calc0.every((x) => x === '—'), 'sin resultados, el avance hacia la meta queda vacío', calc0);
    /* escribir un resultado con el teclado: cierre de facturación en 2 días (línea base 5, meta 1) → avance 75 % */
    const res1 = bn.locator('[aria-label="Resultado — fila 1"]');
    await res1.focus();
    await page.keyboard.type('2');
    await page.keyboard.press('Tab');
    const av = norm(await bn.locator('tbody tr').first().locator('td.col-calc').textContent()).trim();
    check(av === '75 %', 'al escribir el resultado (2 días) el avance se calcula en la tabla: (2 − 5) ÷ (1 − 5) = 75 %', av);
    /* regresión: en los rechazos de la DIAN (sin línea base ni meta en la tabla) un resultado de 2 % no muestra 200 % */
    const res2 = bn.locator('[aria-label="Resultado — fila 2"]');
    await res2.focus();
    await page.keyboard.type('2');
    await page.keyboard.press('Tab');
    const av2 = norm(await bn.locator('tbody tr').nth(1).locator('td.col-calc').textContent()).trim();
    check(av2 === '—', 'rechazos de la DIAN: con un resultado de 2 % el avance queda vacío (no muestra 200 %)', av2);
    await page.waitForTimeout(1800);
    const saved = await page.evaluate(async (id) => (await PM.store.get(PM.paths.doc(PM.getState().projectId, id))).fields.beneficios[0], IRB);
    check(saved && saved.resultado === 2 && !('avance' in saved) && saved.id === 'be-01', 'el resultado se guarda como número en su fila (sin guardar la columna calculada)', saved);
    check(!(await errorCards(page)).length, 'el informe abre y se edita sin tarjetas de error');
    if (shots) await page.screenshot({ path: shots + '/informe-beneficios.png', fullPage: true });

    /* acuerdo interno: abrir con el teclado; el otrosí No. 1 muestra los acumulados calculados */
    r = await openFromList('acuerdo', 'Acuerdo con el cliente');
    check(r.reached && r.ring, 'con Tab el foco llega al enlace «Acuerdo con el cliente» con foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="acuerdo-cliente"] [data-section]', { timeout: 10000 });
    txt = await plainTxt('.page[data-doc-id="acuerdo-cliente"]');
    check(/PRY-2026-021-ACU/.test(txt) && /Aprobado/.test(txt) && /Acuerdo interno o memorando de entendimiento/.test(txt) && /MDE-PRY-2026-021/.test(txt), 'el acuerdo abre aprobado como acuerdo interno con su número');
    const modCells = await page.evaluate(() => [...document.querySelectorAll('.page[data-doc-id="acuerdo-cliente"] [data-field="modificaciones"] tbody tr')].map((tr) => [...tr.querySelectorAll('td.col-calc')].map((td) => td.textContent.replace(/[  ]/g, ' ').trim())));
    check(JSON.stringify(modCells) === JSON.stringify([['−$ 20.000.000', '0 días']]), 'otrosí No. 1: adiciones acumuladas −$ 20.000.000 (680 − 700 millones) y prórrogas de 0 días', modCells);
    const firmasN = await page.locator('.page[data-doc-id="acuerdo-cliente"] [data-field="firmas"] tbody tr').count();
    check(firmasN === 18, 'el acuerdo muestra las nueve firmas de la rev. 0 y las nueve del otrosí No. 1', firmasN);
    if (shots) await page.screenshot({ path: shots + '/acuerdo-cliente.png', fullPage: true });

    /* evaluación de necesidades: brechas calculadas */
    r = await openFromList('necesidades', 'Evaluación de necesidades');
    check(r.reached, 'con Tab el foco llega al enlace «Evaluación de necesidades»');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="evaluacion-necesidades"] [data-section]', { timeout: 10000 });
    const brCells = await page.evaluate(() => [...document.querySelectorAll('.page[data-doc-id="evaluacion-necesidades"] [data-field="brechas"] tbody tr')].map((tr) => (tr.querySelector('td.col-calc') || {}).textContent.replace(/[  ]/g, ' ').trim()));
    check(JSON.stringify(brCells) === JSON.stringify(['−4', '—', '−3,5', '13', '−8', '—']), 'evaluación: brechas calculadas en la tabla (−4 días, −3,5 %, 13 %, −8 %)', brCells);
    check(!(await errorCards(page)).length && !errors.length, 'sin tarjetas de error ni errores de consola', errors);
    if (shots) await page.screenshot({ path: shots + '/evaluacion-necesidades.png', fullPage: true });
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Documentos de negocio en ' + variant.name);
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
        const info = await app.page.evaluate(() => ({ w: document.querySelector('.page').getBoundingClientRect().width, bg: getComputedStyle(document.body).backgroundColor }));
        if (ov > 1 || cardsErr.length || (variant.width === 1920 && info.w < 1400) || (variant.dark && info.bg === 'rgb(255, 255, 255)')) bad.push({ id, ov, cards: cardsErr.length, w: info.w, bg: info.bg });
        if (shots) await app.page.screenshot({ path: shots + '/' + id + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: false });
      }
      await gotoView(app.page, 'documentos');
      await app.page.waitForTimeout(300);
      const ovList = await horizontalOverflow(app.page);
      if (ovList > 1) bad.push({ id: 'documentos', ov: ovList });
      check(!bad.length, 'editor de los tres documentos y lista sin desborde de página ni tarjetas de error' + (variant.dark ? ', con el fondo del tema oscuro' : '') + (variant.width === 1920 ? ', a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

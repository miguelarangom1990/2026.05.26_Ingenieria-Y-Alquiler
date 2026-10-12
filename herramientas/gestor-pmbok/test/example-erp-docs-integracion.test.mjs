// Prueba de los documentos de integración del ejemplo ágil del ERP (src/97-example-erp-docs-integracion.js): caso de negocio,
// plan de gestión de los beneficios, registro de supuestos, plan para la dirección del proyecto y requisitos de financiamiento.
// Uso: node test/example-erp-docs-integracion.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y este módulo (sin los de otros grupos).
//   1) Datos (con el ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código, estado
//      y revisiones; todas las claves de su plantilla con contenido; cada cifra igual a la que calcula la aplicación (LB0 y valor
//      ganado con PM.calc, AgileEVM y releases con PM.agile, catálogo de recursos); fechas dentro del proyecto; los documentos y
//      revisiones aprobados no citan hechos posteriores a su fecha.
//   2) Interacción: crea el ejemplo desde el selector, abre «Documentos» con el riel, busca y abre el caso de negocio con el
//      teclado (Tab y Enter), abre los requisitos de financiamiento (tabla con la holgura calculada) y, en el registro de
//      supuestos, abre con el teclado el historial y la rev. 0 (cajetín con quien aprobó).
//   3) Sin --quick: los cinco documentos en el editor en tema oscuro, a 400 px (claro y oscuro) y a 1920 px, sin desborde de
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
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-erp-integracion-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp-integracion.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '1,2,3,4,5,6,7,8,90,91,92,93,94,95,96,97-example-erp-docs-integracion'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const MINE = ['caso-negocio', 'plan-gestion-beneficios', 'registro-supuestos', 'plan-direccion', 'requisitos-financiamiento'];

/* ============================================================== 1: datos y cifras (en la página) */
async function validateInPage(page) {
  return page.evaluate(async (MINE) => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, Fm = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const ms = (v) => plain(Fm.moneyShort(v, 'COP'));
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const round1 = (v) => Math.round(v * 10) / 10;
    const r100k = (v) => Math.round(v / 1e5) * 1e5;
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const text = (fields) => strings(fields).join(' \n ');
    const empty = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

    /* ---------- construcción e importación */
    const exm = PM.getExample('erp');
    ok(!!exm && PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts) && PM.exampleDocs.erpParts.length >= 1 && PM.exampleDocs.erpIntegracion, 'módulo de integración registrado en PM.exampleDocs.erpParts');
    if (!exm) return out;
    const ex = exm.build({});
    ok(JSON.stringify(ex) === JSON.stringify(exm.build({ today: '2030-01-01' })), 'el constructor sigue siendo determinista con el módulo de integración');
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
    const R1 = rel('rel-1');
    const sprints = A.sortSprints(agile.sprints);
    const eff = A.applyToSchedule(schedule, agile, items);
    const sched = C.computeSchedule(eff, meta.start);
    const evm = C.evm({ sched, costBaseline: C.activeBaselines(blDocs).cost, costs, statusDate: cut });
    const cat = (key) => resources.items.find((x) => x.id === 'rec-' + key);
    const tplKeys = (id) => PM.templates[id].sections.flatMap((s) => s.fields.map((f) => f.key));
    const col = (tid, field, key) => PM.templates[tid].sections.flatMap((s) => s.fields).find((f) => f.key === field).columns.find((c) => c.key === key);
    const optsOf = (tid, field, key) => { const f = PM.templates[tid].sections.flatMap((s) => s.fields).find((x) => x.key === field); return key ? f.columns.find((c) => c.key === key).options : f.options; };
    /* fecha de cada hecho citable (como test/example-erp.test.mjs): elementos del backlog, cambios, incidentes y R-008 */
    const codeDates = Object.fromEntries(items.map((i) => [i.code, i.createdAt]));
    Object.assign(codeDates, { 'CC-001': R1.baseline.date, 'INC-001': '2026-07-22', 'INC-002': '2026-09-30', 'INC-003': '2026-10-05', 'INC-004': '2026-10-09', 'R-008': '2026-10-08' });
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    const golive1 = task('t29').actualFinish;
    const review1 = cal.addWork(golive1, 1);
    const prel2 = String(((await revsOf('plan-release')).find((r) => r.rev === '2') || {}).date || '').slice(0, 10);
    ok(prel2 && prel2 > golive1, 'el plan de releases tiene su rev. 2 después de la salida del release 1 (95)', prel2);
    const SPEC = {
      'caso-negocio': { status: 'aprobado', rev: '1', date: review1, revs: [['0', 'aprobado', meta.start], ['1', 'aprobado', review1]] },
      'plan-gestion-beneficios': { status: 'aprobado', rev: '2', date: review1, revs: [['0', 'aprobado', meta.start], ['1', 'aprobado', LB.date], ['2', 'aprobado', review1]] },
      'registro-supuestos': { status: 'revision', rev: '2A', date: '2026-10-08', revs: [['0', 'aprobado', '2026-05-05'], ['1', 'aprobado', LB.date]] },
      'plan-direccion': { status: 'aprobado', rev: '2', date: prel2, revs: [['0', 'aprobado', LB.date], ['1', 'aprobado', R1.baseline.date], ['2', 'aprobado', prel2]] },
      'requisitos-financiamiento': { status: 'revision', rev: '1A', date: cut, revs: [['0', 'aprobado', LB.date]] },
    };

    /* ---------- existencia, código, estado, revisiones, claves y fechas */
    const V = {};
    for (const id of MINE) {
      const d = docOf(id);
      if (!ok(d, 'existe el documento ' + id)) continue;
      const s = SPEC[id], tb = d.titleBlock || {}, upd = String(d.updatedAt).slice(0, 10);
      const revs = await revsOf(id);
      V[id] = { cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock })) };
      ok(d.template === id && tb.codigo === meta.code + '-' + PM.templates[id].abbr, id + ': código ' + meta.code + '-' + PM.templates[id].abbr, tb.codigo);
      ok(d.status === s.status && d.rev === s.rev && upd === s.date, id + ': estado ' + s.status + ', revisión ' + s.rev + ' del ' + s.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd : !tb.fechaAprobacion) && tb.aprobo && tb.elaboro && tb.reviso, id + ': cajetín y fecha de aprobación coherentes (día hábil, hasta el corte; aprobador también en los documentos en revisión)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(s.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && (r.status !== 'aprobado' || r.titleBlock.fechaAprobacion === r.date)), id + ': historial de revisiones', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      ok(V[id].revs.every((r) => r.status !== 'aprobado' || (r.titleBlock.aprobo && r.titleBlock.aprobo.trim())), id + ': cada revisión aprobada muestra quién la aprobó en el cajetín (no «Aprobó: —»)', V[id].revs.map((r) => [r.rev, r.titleBlock.aprobo]));
      const keys = tplKeys(id);
      const versions = [V[id].cur, ...V[id].revs];
      const missing = versions.flatMap((v, k) => keys.filter((key) => empty(v.fields[key])).map((key) => (k ? 'rev ' + V[id].revs[k - 1].rev : 'vigente') + '.' + key));
      ok(!missing.length, id + ': todas las claves de la plantilla con contenido (vigente y revisiones)', missing);
      /* fechas ISO de los campos dentro del proyecto */
      const isoBad = versions.flatMap((v) => strings(v.fields).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && (!D.valid(x) || x < '2026-04-01' || x > meta.end)));
      ok(!isoBad.length, id + ': fechas de los campos entre abril de 2026 y el fin del proyecto', isoBad);
      /* los aprobados no citan hechos posteriores a su fecha */
      const late = versions.filter((v) => v.status === 'aprobado').map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': las versiones aprobadas no citan hechos posteriores a su fecha', late);
    }
    if (Object.keys(V).length !== MINE.length) return out;
    const rev = (id, r) => V[id].revs.find((x) => x.rev === r).fields;

    /* ---------- caso de negocio */
    {
      const f = V['caso-negocio'].cur.fields, f0 = rev('caso-negocio', '0');
      const actaRev0 = (await revsOf('acta-constitucion')).find((r) => r.rev === '0');
      const neto = col('caso-negocio', 'opciones', 'neto').calc;
      const B = PM.exampleDocs.erpIntegracion.BEN;
      const comp = [r100k(B.ingresos * B.fuga), r100k(B.m2 * (B.utilMeta - B.utilBase) * B.tarifa * 12 * B.atribucion * B.margen), r100k(B.cartera * (B.carteraBase - B.carteraMeta) * B.tasa), r100k(B.diasPersona * cat('uc').unitCost)];
      const annual = sum(comp, (x) => x);
      const gross3 = r100k(annual * sum(B.rampa, (x) => x));
      const t12 = task('t12');
      const subMonths = (() => { let n = 0; for (let m = D.startOfMonth(lbT('t12').start); m <= lbT('t12').finish; m = D.addMonths(m, 1)) n++; return n; })();
      const subMonthly = sum(t12.resources, (a) => (a.qty / subMonths) * resources.items.find((x) => x.id === a.resourceId).unitCost);
      for (const [v, budget, monthly, name] of [[f, meta.budget, subMonthly, 'vigente'], [f0, actaRev0.fields.presupuesto, B.suscripcionEstimada, 'rev. 0']]) {
        const rec = v.opciones.filter((o) => o.recomendada);
        ok(v.costoEstimado === budget && rec.length === 1 && rec[0].costo === budget && rec[0].ingreso === v.valorContrato, 'caso de negocio (' + name + '): costo = presupuesto ' + (name === 'rev. 0' ? 'preliminar del acta rev. 0' : 'aprobado') + ' y valor = beneficio de la alternativa recomendada', [v.costoEstimado, budget]);
        ok(v.opciones.every((o) => neto(o, v.opciones) === o.ingreso - o.costo) && v.margenEsperado === round1(((v.valorContrato - v.costoEstimado) / v.valorContrato) * 100), 'caso de negocio (' + name + '): beneficio neto (columna calculada) y margen = neto ÷ beneficio', v.margenEsperado);
        ok(rec[0].ingreso === gross3 - monthly * 12 * B.years.length && Math.max(...v.opciones.map((o) => o.ingreso - o.costo)) === rec[0].ingreso - rec[0].costo, 'caso de negocio (' + name + '): beneficio a tres años = beneficios supuestos − suscripción, y la recomendada tiene el mayor beneficio neto', [rec[0].ingreso, gross3, monthly]);
        ok(has(v.supuestosCaso, ms(annual)) && comp.every((c) => has(v.supuestosCaso, ms(c))), 'caso de negocio (' + name + '): las bases del cálculo citan cada beneficio anual', comp.map(ms));
      }
      ok(sum(t12.resources, (a) => a.qty * resources.items.find((x) => x.id === a.resourceId).unitCost) === t12.cost && has(f.supuestosCaso, plain(Fm.money(subMonthly, 'COP'))), 'caso de negocio: suscripción mensual del catálogo de recursos (' + plain(Fm.money(subMonthly, 'COP')) + ')');
      const r1ac = A.releaseActualCost(R1, costs, tree, review1);
      const r1p = C.releaseProgress({ release: R1, items: items.filter((i) => i.createdAt <= review1), settings: st });
      const mig = /(\d+,\d+)\s*%/.exec(task('t17').notes)[1];
      ok(f.fechaCaso === review1 && f0.fechaCaso < meta.start && cal.isWork(f0.fechaCaso), 'caso de negocio: fecha de elaboración de cada revisión', [f.fechaCaso, f0.fechaCaso]);
      ok(has(f.recomendacion, ms(r1ac)) && has(f.recomendacion, ms(R1.budget)) && has(f.recomendacion, r1p.done + ' de ' + r1p.total + ' puntos') && has(f.recomendacion, mig + ' %') && has(f.recomendacion, Fm.date(golive1, 'long')) && has(f.recomendacion, 'CPI ' + Fm.idx((R1.budget * r1p.pct) / r1ac)), 'caso de negocio rev. 1: revisión al cierre del release 1 con su costo real, puntos, CPI y migración del inventario', f.recomendacion);
      const vis = docOf('vision-producto').fields.metricasExito;
      ok(vis.every((m) => f.criteriosExito.some((c) => has(c, m.metrica) && has(c, m.meta.toLowerCase()) && has(c, Fm.date(m.fecha, 'long')))), 'caso de negocio rev. 1: criterios de éxito = métricas de la visión del producto');
      const t0 = text(f0);
      ok(!/680|LB0|CC-001|R-00\d|básculas/.test(t0) && !has(t0, ms(meta.budget)), 'caso de negocio rev. 0: no cita el presupuesto aprobado, la LB0, los riesgos registrados ni el CC-001');
      /* regresiones de la auditoría: línea base no numérica, momentos de pago y total de usuarios calculado */
      ok(!f.criteriosExito.some((c) => /: de (?!\d)/.test(plain(c))) && f.criteriosExito.some((c) => /línea base, sin integración/.test(plain(c))), 'caso de negocio rev. 1: criterios con línea base no numérica redactados aparte (sin «de sin integración»)', f.criteriosExito);
      ok(!/mes vencido|al cierre de cada iteración|contra entrega|un tramo por release/.test(f.flujoCaja) && /registro de contratos y acuerdos/.test(f.flujoCaja), 'caso de negocio rev. 1: el flujo de caja remite a las condiciones de los contratos sin fijar momentos de pago', f.flujoCaja);
      const users = sum(t12.resources, (a) => a.qty / subMonths);
      ok(Number.isInteger(users) && has(f.supuestosCaso, users + ' usuarios') && has(f0.supuestosCaso, users + ' usuarios') && f.opciones.some((o) => o.recomendada && has(o.descripcion, users + ' usuarios')), 'caso de negocio: total de usuarios = suma de las líneas de la suscripción (t12 y catálogo)', users);
    }

    /* ---------- plan de gestión de los beneficios */
    {
      const f = V['plan-gestion-beneficios'].cur.fields, f1 = rev('plan-gestion-beneficios', '1'), f0 = rev('plan-gestion-beneficios', '0');
      const vis = docOf('vision-producto').fields.metricasExito;
      const plazo = (iso) => (iso <= meta.end ? 'Corto plazo (durante el proyecto)' : 'Mediano plazo (hasta 1 año)');
      for (const [v, name] of [[f, 'vigente'], [f1, 'rev. 1']]) {
        ok(vis.every((m, i) => { const b = v.beneficios[i]; return b && b.metrica === m.metrica && b.lineaBase === m.lineaBase && has(b.meta, m.meta) && has(b.meta, Fm.date(m.fecha, 'long')) && b.plazo === plazo(m.fecha) && b.responsable; }), 'beneficios (' + name + '): las cinco métricas de la visión con su línea base, meta, fecha, plazo y dueño');
      }
      ok(vis.every((m, i) => f0.beneficios[i].metrica === m.metrica && f0.beneficios[i].lineaBase !== m.lineaBase), 'beneficios rev. 0: líneas base estimadas antes de medirlas en el descubrimiento');
      ok(f.beneficios.every((b) => optsOf('plan-gestion-beneficios', 'beneficios', 'tipo').includes(b.tipo) && optsOf('plan-gestion-beneficios', 'beneficios', 'plazo').includes(b.plazo)) && f.beneficios.some((b) => b.tipo === 'Intangible') && optsOf('plan-gestion-beneficios', 'frecuenciaMedicion').includes(f.frecuenciaMedicion), 'beneficios: tipos, plazos y frecuencia de la plantilla, con beneficios intangibles');
      const mig = /(\d+,\d+)\s*%/.exec(task('t17').notes)[1];
      ok(has(f.mecanismoMedicion, mig + ' %') && has(f.mecanismoMedicion, Fm.date(review1, 'long')) && !/\d+,\d+ %/.test(f1.mecanismoMedicion), 'beneficios rev. 2: primera medición al cierre del release 1 (migración del inventario)');
      ok(!/CC-001|báscula/.test(text(f1)) && !/CC-001|báscula|R-00\d/.test(text(f0)) && /CC-001/.test(text(f)), 'beneficios: la revisión 1 (10 de julio) no cita el CC-001 y la 0 no cita riesgos registrados');
      ok(has(f.transicion, Fm.date(meta.end, 'long')) && has(f.transicion, Fm.date(vis[4].fecha, 'long')), 'beneficios: transición a la operación hasta la meta de cartera');
      /* beneficios monetarios del caso de negocio: filas tangibles a largo plazo y seguimiento hasta el horizonte del caso */
      const B = PM.exampleDocs.erpIntegracion.BEN;
      const comp = [r100k(B.ingresos * B.fuga), r100k(B.m2 * (B.utilMeta - B.utilBase) * B.tarifa * 12 * B.atribucion * B.margen), r100k(B.cartera * (B.carteraBase - B.carteraMeta) * B.tasa), r100k(B.diasPersona * cat('uc').unitCost)];
      for (const [v, name] of [[f, 'vigente'], [f1, 'rev. 1'], [f0, 'rev. 0']]) {
        const long = v.beneficios.filter((b) => b.plazo === 'Largo plazo (más de 1 año)');
        ok(long.some((b) => b.tipo === 'Tangible' && /[Ff]acturación recuperada/.test(b.beneficio) && has(b.meta, ms(comp[0])) && has(b.lineaBase, B.baseYear) && b.responsable) && long.some((b) => b.tipo === 'Tangible' && has(b.meta, Fm.num(B.diasPersona, 0) + ' días-persona') && has(b.meta, ms(comp[3])) && b.responsable), 'beneficios (' + name + '): facturación recuperada y tiempo liberado del caso de negocio, a largo plazo y con dueño', long.map((b) => b.beneficio));
        /* la utilización se mide desde un release que sale antes de la fecha de su meta */
        const mec = plain(v.mecanismoMedicion);
        const utilRel = [1, 2, 3].find((n) => new RegExp('release ' + n + ', [^;]*utilización').test(mec));
        ok(utilRel && lbT(['t29', 't31', 't33'][utilRel - 1]).start <= vis[3].fecha, 'beneficios (' + name + '): la utilización se mide desde el release ' + utilRel + ', que sale antes de su meta (' + Fm.date(vis[3].fecha, 'long') + ')', mec);
      }
      ok(has(f.transicion, B.years[B.years.length - 1]) && has(f.transicion, ms(sum(comp, (x) => x))), 'beneficios: los beneficios monetarios se siguen hasta el horizonte del caso de negocio', f.transicion);
    }

    /* ---------- registro de supuestos */
    {
      const versions = [['vigente', V['registro-supuestos'].cur], ...V['registro-supuestos'].revs.map((r) => ['rev. ' + r.rev, r])];
      const counts = versions.map(([, v]) => v.fields.supuestos.length);
      ok(JSON.stringify(counts) === '[14,7,13]', 'supuestos: 7 en la emisión inicial, 13 con la LB0 y 14 al corte', counts);
      for (const [name, v] of versions) {
        const list = v.fields.supuestos;
        ok(list.every((s, k) => s.id === 'S-' + String(k + 1).padStart(2, '0')), 'supuestos (' + name + '): códigos consecutivos S-01…');
        ok(list.every((s) => optsOf('registro-supuestos', 'supuestos', 'tipo').includes(s.tipo) && optsOf('registro-supuestos', 'supuestos', 'estado').includes(s.estado) && optsOf('registro-supuestos', 'supuestos', 'categoria').includes(s.categoria) && s.responsable && s.descripcion.length > 30), 'supuestos (' + name + '): tipo, estado y categoría de la plantilla');
        const bad = list.filter((s) => !D.valid(s.fechaValidacion) || (s.estado === 'Por validar' ? s.fechaValidacion < v.date || s.fechaValidacion > meta.end : s.fechaValidacion > v.date || !cal.isWork(s.fechaValidacion))).map((s) => s.id + ' ' + s.estado + ' ' + s.fechaValidacion);
        ok(!bad.length, 'supuestos (' + name + '): validados y descartados con fecha hábil hasta la del registro; por validar con fecha prevista posterior', bad);
      }
      const S = Object.fromEntries(V['registro-supuestos'].cur.fields.supuestos.map((s) => [s.id, s]));
      ok(S['S-08'].estado === 'Descartado' && S['S-08'].fechaValidacion === task('t16').actualFinish && has(S['S-08'].descripcion, String(cal.countWork(D.add(lbT('t16').finish, 1), task('t16').actualFinish)) + ' días hábiles más') && has(S['S-08'].descripcion, lbT('t16').duration + ' días hábiles'), 'supuestos: depuración de datos descartada con el atraso real frente a la LB0');
      ok(S['S-09'].estado === 'Validado' && S['S-09'].fechaValidacion === task('t15').actualFinish && S['S-03'].estado === 'Descartado' && S['S-03'].fechaValidacion === task('t14').actualFinish && has(S['S-03'].descripcion, ms(sum(costs.actuals.filter((a) => a.taskId === 't14'), (a) => a.amount) - task('t14').cost)), 'supuestos: ambiente de habilitación validado y tasa de cambio descartada con el sobrecosto real de los equipos');
      const subMonthsS = (() => { let n = 0; for (let m = D.startOfMonth(lbT('t12').start); m <= lbT('t12').finish; m = D.addMonths(m, 1)) n++; return n; })();
      ok(has(S['S-12'].descripcion, sum(task('t12').resources, (a) => a.qty / subMonthsS) + ' usuarios'), 'supuestos: S-12 con el total de usuarios de la suscripción (suma de sus líneas)', S['S-12'].descripcion);
      ok(S['S-14'].fechaValidacion === R1.baseline.date && S['S-12'].fechaValidacion === task('t11').actualFinish && S['S-13'].fechaValidacion === task('t11').actualFinish, 'supuestos: básculas validadas con el CC-001 y restricciones de los contratos del 30 de junio');
      ok(S['S-10'].estado === 'Por validar' && S['S-10'].fechaValidacion === sprints.find((s) => s.status === 'en-curso').end && /R-008/.test(S['S-10'].descripcion) && S['S-11'].estado === 'Por validar' && /INC-003/.test(S['S-11'].descripcion), 'supuestos: velocidad (R-008) y auxiliar de cartera (INC-003) por validar al corte');
      ok(['S-07'].every((k) => [meta.budget, LB.cost.bac, LB.cost.contingency, LB.cost.management].every((x) => has(S[k].descripcion, ms(x)))) && /700 millones/.test(versions[1][1].fields.supuestos[6].descripcion), 'supuestos: restricción de presupuesto con el BAC y las reservas de la LB0 (y el preliminar en la rev. 0)');
      const pr = docOf('plan-release').fields.supuestos;
      const keys = ['dos horas diarias', 'ambiente de habilitación', 'usuarios clave participan', '28 y 32 puntos', 'cinco primeros días hábiles'];
      ok(pr.length === keys.length && keys.every((k) => V['registro-supuestos'].cur.fields.supuestos.some((s) => s.descripcion.includes(k))), 'supuestos: coinciden con los supuestos del plan de releases');
      ok(!/IN-003/.test(text(versions[1][1].fields)) && /IN-003/.test(text(versions[2][1].fields)), 'supuestos: la investigación IN-003 se cita desde la revisión del 10 de julio (no en la de mayo)');
    }

    /* ---------- plan para la dirección del proyecto */
    {
      const f = V['plan-direccion'].cur.fields, f0 = rev('plan-direccion', '0');
      ok(f.cicloVida === meta.lifecycle && f.presupuestoTotal === meta.budget, 'plan para la dirección: ciclo de vida y presupuesto del proyecto');
      const want = [lbT('t11').start, lbT('t03').finish, lbT('t29').start, lbT('t31').start, lbT('t33').start, lbT('t06').start];
      ok(JSON.stringify(f.fases.map((x) => x.fechaPrevista)) === JSON.stringify(want) && want[want.length - 1] === meta.end, 'plan para la dirección: fases con las fechas de la LB0 (contratos, LB0, tres salidas a producción y cierre)', f.fases.map((x) => x.fechaPrevista));
      ok(['rel-1', 'rel-2', 'rel-3'].every((r, i) => f.fases[2 + i].fase.startsWith(rel(r).name) && has(f.fases[2 + i].entregables, 'EDT ' + tree.codes.get(rel(r).wbsId))), 'plan para la dirección: una fase por release con su entregable de la EDT');
      const lbRows = Object.fromEntries(f.lineasBase.map((r) => [r.lineaBase, r]));
      ok(f.lineasBase.length === 4 && f.lineasBase.every((r) => r.version === 'LB0' && r.fechaAprobacion === LB.date && optsOf('plan-direccion', 'lineasBase', 'lineaBase').includes(r.lineaBase)), 'plan para la dirección: líneas base de alcance, cronograma, costos y medición del desempeño (LB0)');
      ok(has(lbRows.Costos.contenido, ms(LB.cost.bac)) && has(lbRows.Costos.contenido, ms(LB.cost.contingency)) && has(lbRows.Costos.contenido, ms(LB.cost.bac + LB.cost.contingency)) && has(lbRows.Costos.observaciones, ms(LB.cost.management)) && has(lbRows.Costos.observaciones, ms(sum(agile.releases, (r) => r.budget))), 'plan para la dirección: línea base de costos = BAC + contingencia de la LB0');
      ok(has(lbRows.Cronograma.contenido, Fm.date(LB.schedule.start, 'long')) && has(lbRows.Cronograma.contenido, Fm.date(LB.schedule.finish, 'long')), 'plan para la dirección: fechas de la línea base del cronograma');
      const r1base0 = (await revsOf('plan-release')).find((r) => r.rev === '0').fields.releases[0].puntos;
      ok(has(f0.lineasBase[0].contenido, r1base0 + ' puntos') && !/CC-001|118/.test(text(f0)) && has(lbRows.Alcance.contenido, R1.baseline.points + ' puntos') && /CC-001/.test(lbRows.Alcance.observaciones), 'plan para la dirección: release 1 con ' + r1base0 + ' puntos en la rev. 0 y ' + R1.baseline.points + ' con el CC-001 después');
      /* rev. 1 (CC-001) y rev. 2 (después del cierre del release 1, con la línea base del release 2) */
      const f1 = rev('plan-direccion', '1'), R2 = rel('rel-2');
      ok(has(f1.lineasBase[0].contenido, R1.baseline.points + ' puntos') && /CC-001/.test(f1.lineasBase[0].observaciones) && !has(text(f1), R2.baseline.points + ' puntos'), 'plan para la dirección rev. 1 (CC-001): release 1 con ' + R1.baseline.points + ' puntos, sin la línea base del release 2');
      const r2sprint = sprints.find((x) => x.start === R2.baseline.date);
      ok(r2sprint && has(lbRows.Alcance.contenido, R2.baseline.points + ' puntos') && has(lbRows.Alcance.contenido, r2sprint.name.toLowerCase()) && has(lbRows.Alcance.contenido, Fm.date(R2.baseline.date, 'long')) && has(f.mantenimientoPlan, 'Revisión 2 (' + Fm.date(prel2, 'long') + ')'), 'plan para la dirección rev. 2: línea base del release 2 (' + R2.baseline.points + ' puntos) y revisión después del cierre del release 1', lbRows.Alcance.contenido);
      ok(V['plan-direccion'].cur.date >= golive1 && /después del cierre de cada release/.test(f.mantenimientoPlan) && /Gerencia General/.test(V['plan-direccion'].revs.find((r) => r.rev === '2').titleBlock.aprobo), 'plan para la dirección: la versión vigente es posterior al cierre del release 1, como manda su regla de mantenimiento');
      ok(f.planesSubsidiarios.length >= 12 && f.planesSubsidiarios.every((p) => optsOf('plan-direccion', 'planesSubsidiarios', 'estado').includes(p.estado) && p.referencia && p.responsable && p.resumen), 'plan para la dirección: planes subsidiarios con estado, referencia, responsable y resumen');
      /* las referencias a documentos del ejemplo existen con esa revisión, aprobada a la fecha de la versión del plan */
      const abbr = Object.fromEntries(Object.entries(PM.templates).map(([id, t]) => [t.abbr, id]));
      const refBad = [], stale = [];
      for (const v of [V['plan-direccion'].cur, ...V['plan-direccion'].revs]) {
        for (const p of v.fields.planesSubsidiarios) for (const m of p.referencia.matchAll(new RegExp(meta.code + '-([A-Z]+)(?: rev\\. (\\d+))?', 'g'))) {
          const tid = abbr[m[1]];
          if (!tid) { refBad.push('sin plantilla ' + m[0]); continue; }
          const d = docOf(tid);
          if (!d) continue; /* documento de otro módulo que esta página no carga */
          /* con revisión: esa revisión aprobada a la fecha del plan; sin revisión (documentos de otros grupos): alguna versión
             aprobada a esa fecha, porque el plan los da por aprobados */
          const all = [...(await revsOf(tid)).map((r) => [r.rev, r.status, String(r.date).slice(0, 10)]), [d.rev, d.status, String(d.updatedAt).slice(0, 10)]];
          if (!all.some(([rv, sts, dt]) => (m[2] === undefined || rv === m[2]) && sts === 'aprobado' && dt <= v.date)) refBad.push(v.date + ' → ' + m[0]);
          /* con revisión: es la última emisión aprobada a la fecha de esa versión del plan */
          const later = m[2] === undefined ? [] : all.filter(([rv, sts, dt]) => /^\d+$/.test(String(rv)) && sts === 'aprobado' && dt <= v.date && Number(rv) > Number(m[2]));
          if (later.length) stale.push(v.date + ' → ' + m[0] + ' (ya existía la rev. ' + later.map((x) => x[0]).join(', ') + ')');
        }
      }
      ok(!refBad.length, 'plan para la dirección: cada documento citado (si su módulo está cargado) está aprobado a la fecha del plan', refBad);
      ok(!stale.length, 'plan para la dirección: cada versión cita la última revisión aprobada a su fecha', stale);
    }

    /* ---------- requisitos de financiamiento */
    {
      const f = V['requisitos-financiamiento'].cur.fields, f0 = rev('requisitos-financiamiento', '0');
      ok(f.presupuestoTotal === meta.budget && f.lineaBaseCostos === LB.cost.bac + LB.cost.contingency && f.reservaGestion === LB.cost.management && f.lineaBaseCostos + f.reservaGestion === meta.budget, 'financiamiento: presupuesto = línea base de costos (BAC + contingencia de la LB0) + reserva de gestión');
      const months = []; for (let m = D.startOfMonth(LB.schedule.start); m <= LB.schedule.finish; m = D.addMonths(m, 1)) months.push(m);
      const monthEnd = (m) => D.add(D.addMonths(m, 1), -1);
      const P2 = f.periodos;
      ok(P2.length === months.length && P2.every((p, i) => p.periodo === PM.fmt.date(months[i], 'monthLong').replace(/^./, (c) => c.toUpperCase()) && p.fecha === cal.dateOf(cal.indexOf(months[i])) && cal.isWork(p.fecha)), 'financiamiento: un periodo por mes de la LB0 con su primer día hábil', P2.map((p) => p.periodo + ' ' + p.fecha));
      const cum = months.map((m) => r100k(evm.pvAt(monthEnd(m))));
      ok(P2.every((p, i) => p.egresos === cum[i] - (i ? cum[i - 1] : 0)) && sum(P2, (p) => p.egresos) === LB.cost.bac, 'financiamiento: egresos = valor planificado mensual de la LB0 (curva S) y suman el BAC', P2.map((p) => p.egresos));
      const firstRisk = D.startOfMonth(lbT('t14').start);
      ok(sum(P2, (p) => p.contingencia) === LB.cost.contingency && P2.every((p, i) => p.contingencia >= 0 && (months[i] >= firstRisk || p.contingencia === 0)), 'financiamiento: contingencia mensual (riesgos del registro) que suma la reserva para contingencias y empieza con las actividades expuestas');
      /* reparto por riesgo recalculado: registro de riesgos rev. 0 y actividades de cada riesgo */
      const RT = PM.exampleDocs.erpIntegracion.RISK_TASKS;
      const rr0 = (await revsOf('registro-riesgos')).find((r) => r.rev === '0').fields.riesgos.filter((r) => r.reserva > 0);
      const raw = months.map(() => 0);
      for (const r of rr0) {
        const w = months.map((m, i) => sum(RT[r.id] || [], (tid) => { const t = lbT(tid); const fr = (at) => C.plannedFraction(cal, t.start, t.finish, t.milestone, at); return t.cost * (fr(monthEnd(m)) - (i ? fr(monthEnd(months[i - 1])) : 0)); }));
        const tot = sum(w, (x) => x); w.forEach((x, i) => { raw[i] += (r.reserva * x) / tot; });
      }
      let acc = 0; const cumC = raw.map((x) => r100k((acc += x)));
      ok(sum(rr0, (r) => r.reserva) === LB.cost.contingency && rr0.every((r) => RT[r.id]) && P2.every((p, i) => p.contingencia === cumC[i] - (i ? cumC[i - 1] : 0)), 'financiamiento: contingencia de cada mes = reserva de cada riesgo (rev. 0 del registro) por el valor planificado de sus actividades', P2.map((p) => p.contingencia));
      const gap = col('requisitos-financiamiento', 'periodos', 'holgura').calc;
      const gaps = P2.map((p) => gap(p, P2));
      ok(gaps.every((g) => g >= 0) && gaps[gaps.length - 1] === 0 && sum(P2, (p) => p.financiamiento) === f.lineaBaseCostos && P2.filter((p) => p.financiamiento > 0).length === 4, 'financiamiento: cuatro tramos que suman la línea base de costos; holgura acumulada (columna calculada) nunca negativa y en cero al final', gaps);
      ok(P2.every((p) => optsOf('requisitos-financiamiento', 'periodos', 'fuente').includes(p.fuente)), 'financiamiento: fuentes de la plantilla');
      const tramoIdx = P2.map((p, i) => (p.financiamiento > 0 ? i : -1)).filter((i) => i >= 0);
      const tramoMonths = tramoIdx.map((i) => months[i]);
      /* liberación de cada tramo: acta, firma de los contratos y revisión del caso al cierre de los releases 1 y 2 (día hábil
         siguiente a la salida a producción, según la LB0); cada tramo cubre desde el mes siguiente a su liberación */
      const sign = task('t11').actualFinish;
      const gates = [meta.start, sign, cal.addWork(lbT('t29').start, 1), cal.addWork(lbT('t31').start, 1)];
      ok(tramoMonths[0] === months[0] && gates.slice(1).every((g, k) => tramoMonths[k + 1] === D.addMonths(D.startOfMonth(g), 1)), 'financiamiento: tramos desde el acta y desde el mes siguiente a la firma de los contratos y a la revisión del caso al cierre de los releases 1 y 2', tramoMonths);
      ok(gates.every((g, k) => g <= P2[tramoIdx[k]].fecha) && review1 <= P2[tramoIdx[2]].fecha && V['caso-negocio'].cur.date <= P2[tramoIdx[2]].fecha, 'financiamiento: cada tramo se libera a más tardar en la fecha requerida de su ventana (sin días sin financiar)', gates.map((g, k) => [g, P2[tramoIdx[k]].fecha]));
      /* el texto de cada tramo cita su monto, su liberación y el alcance real de su ventana (iteraciones y releases) */
      const segs = plain(f.fuentes).split(/(?=Tramo \d \()/).slice(1);
      const segs0 = plain(f0.fuentes).split(/(?=Tramo \d \()/).slice(1);
      ok(segs.length === 4 && segs0.length === 4, 'financiamiento: un párrafo por tramo en las fuentes (rev. 0 y 1A)', [segs.length, segs0.length]);
      const cites = (seg) => {
        const full = new Set(), fin = new Set(), ini = new Set();
        for (const m of seg.matchAll(/iteraciones (\d+) a (\d+)/g)) for (let x = +m[1]; x <= +m[2]; x++) full.add(x);
        for (const m of seg.matchAll(/las iteraciones ((?:\d+, )*\d+ y \d+)/g)) m[1].split(/, | y /).forEach((x) => full.add(+x));
        for (const m of seg.matchAll(/(final|inicio) de la iteración (\d+)/g)) (m[1] === 'final' ? fin : ini).add(+m[2]);
        for (const m of seg.matchAll(/(?<!(?:final|inicio) de )la iteración (\d+)/g)) full.add(+m[1]);
        return { full, fin, ini };
      };
      const segBad = [];
      segs.forEach((seg, k) => {
        const a = k ? months[tramoIdx[k]] : LB.schedule.start, b = monthEnd(months[(k < 3 ? tramoIdx[k + 1] : months.length) - 1]);
        if (!has(seg, ms(P2[tramoIdx[k]].financiamiento)) || !has(segs0[k], ms(P2[tramoIdx[k]].financiamiento))) segBad.push(k + 1 + ': monto');
        const c = cites(seg);
        const over = sprints.filter((x) => x.start <= b && x.end >= a);
        for (const x of over) {
          const n = +x.name.replace('Iteración ', '');
          if (!(x.start < a ? c.fin.has(n) : x.end > b ? c.ini.has(n) : c.full.has(n))) segBad.push(k + 1 + ': ' + x.name);
        }
        if (c.full.size + c.fin.size + c.ini.size !== over.length) segBad.push(k + 1 + ': iteraciones de más ' + JSON.stringify([[...c.full], [...c.fin], [...c.ini]]));
        const iterParts = seg.split(/; /).filter((x) => /iteraci/.test(x));
        ['rel-1', 'rel-2', 'rel-3'].forEach((rid, j) => {
          const t = lbT(rel(rid).taskId);
          const pv = t.cost * (C.plannedFraction(cal, t.start, t.finish, t.milestone, b) - C.plannedFraction(cal, t.start, t.finish, t.milestone, D.add(a, -1)));
          const cited = iterParts.some((x) => new RegExp('\\brelease ' + (j + 1) + '\\b').test(x));
          if ((pv > 0) !== cited) segBad.push(k + 1 + ': ' + rid + ' con valor planificado ' + Math.round(pv));
        });
      });
      ok(!segBad.length, 'financiamiento: el alcance escrito de cada tramo coincide con las iteraciones y los releases de su ventana', segBad);
      ok(has(segs[1], 'al firmar los contratos (' + Fm.date(sign, 'long') + ')') && has(segs[2], Fm.date(review1, 'long')) && has(segs0[2], 'prevista para el ' + Fm.date(gates[2], 'long')) && has(segs[3], 'prevista para el ' + Fm.date(gates[3], 'long')) && !/un tramo por release|uno por release/.test(f.fuentes + f0.fuentes), 'financiamiento: cada tramo dice cuándo se libera (contratos, revisión del release 1 ya hecha al corte, revisión del release 2 prevista)');
      /* el caso de negocio rev. 1 libera el tramo 3 desde su ventana y reconoce que el release 2 arrancó con el tramo 2 */
      const rec = plain(V['caso-negocio'].cur.fields.recomendacion);
      ok(has(rec, 'tramo 3 del financiamiento (' + ms(P2[tramoIdx[2]].financiamiento)) && has(rec, Fm.date(rel('rel-2').start, 'long') + ' con el tramo 2, que cubre hasta el ' + Fm.date(monthEnd(months[tramoIdx[2] - 1]), 'long')) && /el resto del release 2 y el inicio del release 3/.test(rec), 'caso de negocio rev. 1: el tramo 3 cubre desde el mes siguiente a la revisión y el release 2 arrancó con el tramo 2', rec);
      for (const [v, name] of [[f, 'rev. 1A'], [f0, 'rev. 0']]) ok(!/mes vencido|al cierre de cada iteración|contra entrega|como los programa/.test(v.condicionesPago) && /valor planificado de la LB0/.test(v.condicionesPago) && /registro de contratos y acuerdos/.test(v.condicionesPago), 'financiamiento (' + name + '): los egresos son el devengo de la LB0 y los momentos de pago quedan en los contratos', v.condicionesPago);
      /* condiciones de pago con el catálogo de recursos y los releases */
      const implFee = sum(['cf', 'de', 'di', 'ap'], (k) => cat(k).unitCost * (cat(k).dedication ?? 100) / 100 * st.sprintLength);
      ok(has(f.condicionesPago, ms(implFee)) && has(f.condicionesPago, ms(task('t26').costFixed)) && has(f.condicionesPago, ms(rel('rel-3').budget - rel('rel-3').plannedSprints * (implFee + cat('at').unitCost * st.sprintLength))), 'financiamiento: pagos al implementador (precio fijo por iteración y bolsas) desde el catálogo y los releases');
      /* revisión en curso: real frente al plan al corte */
      ok(has(f.conciliacionLimite, ms(evm.ac)) && has(f.conciliacionLimite, ms(evm.pv)) && has(f.riesgosFinanciamiento, ms(evm.eac)) && has(f.riesgosFinanciamiento, ms(evm.vac)) && has(f.riesgosFinanciamiento, ms(evm.bac)), 'financiamiento rev. 1A: costo real, valor planificado, EAC y VAC al corte');
      const acM = (m) => sum(costs.actuals.filter((a) => a.date >= m && a.date <= monthEnd(m) && a.date <= cut), (a) => a.amount);
      ok(months.filter((m) => monthEnd(m) <= cut).every((m) => has(f.conciliacionLimite, ms(acM(m)))), 'financiamiento rev. 1A: costo real de cada mes cerrado');
      ok(!/costo real|EAC|VAC/.test(text(f0)) && !has(text(f0), ms(evm.ac)), 'financiamiento rev. 0 (10 de julio): no cita costos reales ni pronósticos');
      /* bolsa del conector: consumo frente a la bolsa de la LB0 y al avance del release 2, no un riesgo ya materializado */
      const conn = sum(costs.actuals.filter((a) => a.releaseId === 'rel-2' && /conector/.test(a.description) && a.date <= cut), (a) => a.amount);
      const r2p = C.releaseProgress({ release: rel('rel-2'), items, settings: st });
      const bolsa = task('t26').costFixed;
      ok(conn > 0 && conn < bolsa && has(f.riesgosFinanciamiento, ms(conn) + ' de la bolsa de ' + ms(bolsa)) && has(f.riesgosFinanciamiento, Fm.pct(r2p.pct, 1)) && has(f.riesgosFinanciamiento, r2p.done + ' de ' + r2p.total + ' puntos') && has(f.riesgosFinanciamiento, ms(conn - bolsa * r2p.pct)) && has(f.riesgosFinanciamiento, ms(conn / r2p.pct)) && !/Materializad[oa]s?:[^.]*conector/.test(f.riesgosFinanciamiento), 'financiamiento rev. 1A: el consumo del conector se compara con su bolsa y con el avance del release 2 (no se presenta como materializado)', f.riesgosFinanciamiento);
    }
    ok(MINE.every((id) => PM.docApproach && PM.docApproach(id) && PM.docApproach(id).id === 'ambos'), 'los cinco documentos son de «Ambos enfoques» (11-doc-approach)');
    return out;
  }, MINE);
}

/* ============================================================== ejecución */
section('Datos y cifras de los documentos de integración (' + file + ')');
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
    const want = { 'Caso de negocio': ['CNEG', 'Aprobado', '1'], 'Plan de gestión de los beneficios': ['PBEN', 'Aprobado', '2'], 'Registro de supuestos': ['RSUP', 'En revisión', '2A'], 'Plan para la dirección del proyecto': ['PDP', 'Aprobado', '2'], 'Requisitos de financiamiento del proyecto': ['RFI', 'En revisión', '1A'] };
    const rowBad = Object.entries(want).filter(([name, [ab, stt, rv]]) => { const r = rowsInfo.find((x) => norm(x.name).trim() === name); return !r || !norm(r.code).includes('PRY-2026-021-' + ab) || !norm(r.status).includes(stt) || !norm(r.rev).trim().endsWith(rv) || (r.ap !== null && r.ap !== 'ambos'); });
    check(!rowBad.length, 'lista maestra: los cinco documentos con código, estado y revisión (y enfoque «ambos» si la columna existe)', rowBad.map(([n]) => [n, rowsInfo.find((x) => norm(x.name).trim() === n)]));
    if (shots) await page.screenshot({ path: shots + '/documentos.png', fullPage: false });
    /* teclado: buscar y abrir el caso de negocio con Tab y Enter */
    const search = page.getByLabel('Buscar documentos');
    await search.click();
    await page.keyboard.type('Caso de negocio');
    await page.waitForTimeout(400);
    let reached = false;
    for (let k = 0; k < 40 && !reached; k++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && a.textContent.trim() === 'Caso de negocio'; });
    }
    check(reached, 'con Tab el foco llega al enlace «Caso de negocio» de la lista filtrada');
    const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; });
    check(ring, 'el enlace enfocado muestra el foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="caso-negocio"] [data-section]', { timeout: 10000 });
    const caso = norm(await page.locator('.page[data-doc-id="caso-negocio"]').innerText());
    check(/PRY-2026-021-CNEG/.test(caso) && /Alternativas evaluadas/.test(caso) && /Aprobado/.test(caso), 'el caso de negocio abre con Enter en el editor (código, estado y alternativas)');
    /* el documento aprobado se muestra bloqueado (solo lectura): el contenido está en el texto de la página */
    check(/ERP de mercado medio en la nube/.test(caso) && /Revisión al cierre del release 1/.test(caso) && /Crear nueva revisión/.test(caso), 'el editor muestra la alternativa recomendada, la revisión al cierre del release 1 y el bloqueo del aprobado');
    check(!(await errorCards(page)).length, 'el caso de negocio abre sin tarjetas de error');
    if (shots) await page.screenshot({ path: shots + '/caso-negocio.png', fullPage: true });
    /* requisitos de financiamiento: abrir desde la lista con el teclado y revisar la tabla calculada */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 8000 });
    await page.getByLabel('Buscar documentos').fill('');
    await page.getByLabel('Buscar documentos').click();
    await page.keyboard.type('financiamiento');
    await page.waitForTimeout(400);
    const link = page.locator('tr[data-doc] .docs-link', { hasText: 'Requisitos de financiamiento del proyecto' });
    await link.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="requisitos-financiamiento"] [data-section]', { timeout: 10000 });
    const fin = norm(await page.locator('.page[data-doc-id="requisitos-financiamiento"]').innerText());
    check(/PRY-2026-021-RFI/.test(fin) && /En revisión/.test(fin) && /Holgura acumulada/.test(fin), 'los requisitos de financiamiento abren con la tabla del flujo y su holgura');
    const finRows = await page.evaluate(() => { const t = [...document.querySelectorAll('.page[data-doc-id="requisitos-financiamiento"] table')].find((x) => /Holgura acumulada/.test(x.textContent)); return t ? t.querySelectorAll('tbody tr').length : 0; });
    check(finRows >= 9, 'tabla de financiamiento con un periodo por mes (mayo de 2026 a enero de 2027)', finRows);
    check(!(await errorCards(page)).length && !errors.length, 'sin tarjetas de error ni errores de consola', errors);
    if (shots) await page.screenshot({ path: shots + '/requisitos-financiamiento.png', fullPage: true });
    /* registro de supuestos: historial y rev. 0 con el teclado; el cajetín de la revisión aprobada muestra quién aprobó */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 8000 });
    await page.getByLabel('Buscar documentos').fill('');
    await page.getByLabel('Buscar documentos').click();
    await page.keyboard.type('supuestos');
    await page.waitForTimeout(400);
    await page.locator('tr[data-doc] .docs-link', { hasText: 'Registro de supuestos' }).first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="registro-supuestos"] [data-section]', { timeout: 10000 });
    const tbNow = await page.evaluate(() => { const c = [...document.querySelectorAll('.page[data-doc-id="registro-supuestos"] .title-block > div')].find((d) => /^Aprobó/.test((d.querySelector('.tb-k') || {}).textContent || '')); if (!c) return null; const inp = c.querySelector('input'); return inp ? inp.value : (c.querySelector('.tb-v') || {}).textContent; });
    check(tbNow === 'Gerencia General', 'registro de supuestos en revisión: el cajetín dice a quién le toca aprobar', tbNow);
    const histBtn = page.getByRole('button', { name: /^Historial/ });
    await histBtn.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.docs-hist tr[data-rev="0"]', { timeout: 8000 });
    await page.locator('.docs-hist tr[data-rev="0"] button', { hasText: 'Ver' }).first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.docs-snap .title-block', { timeout: 8000 });
    const snapTb = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.docs-snap .title-block > div')].map((d) => [(d.querySelector('.tb-k') || {}).textContent, (d.querySelector('.tb-v') || {}).textContent])));
    check(snapTb['Aprobó'] === 'Gerencia General' && /2026/.test(snapTb['Fecha de aprobación'] || ''), 'registro de supuestos rev. 0 (historial → Ver, con el teclado): el cajetín muestra quién aprobó y la fecha de aprobación', snapTb);
    if (shots) await page.screenshot({ path: shots + '/supuestos-rev0.png', fullPage: false });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    check(!(await errorCards(page)).length && !errors.length, 'historial sin tarjetas de error ni errores de consola', errors);
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Documentos de integración en ' + variant.name);
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
        if (shots && (id === 'requisitos-financiamiento' || id === 'plan-direccion')) await app.page.screenshot({ path: shots + '/' + id + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: false });
      }
      await gotoView(app.page, 'documentos');
      await app.page.waitForTimeout(300);
      const ovList = await horizontalOverflow(app.page);
      if (ovList > 1) bad.push({ id: 'documentos', ov: ovList });
      check(!bad.length, 'editor de los cinco documentos y lista sin desborde de página ni tarjetas de error' + (variant.width === 1920 ? ', a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

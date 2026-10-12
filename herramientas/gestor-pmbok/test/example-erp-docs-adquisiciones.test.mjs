// Prueba de los documentos de adquisiciones del ejemplo ágil del ERP (src/97-example-erp-docs-adquisiciones.js): plan de gestión
// de las adquisiciones, estrategia, análisis de hacer o comprar, enunciados del trabajo (SOW), criterios de selección, registro de
// contratos y seguimiento de contratos.
// Uso: node test/example-erp-docs-adquisiciones.test.mjs [--file página.html] [--out dir] [--shots dir] [--quick]
//   Sin --file construye el núcleo, las vistas y plantillas, los ejemplos (90–96) y este módulo (sin los de otros grupos).
//   1) Datos (con el ejemplo construido con PM.getExample('erp').build e importado): cada documento existe con su código, estado y
//      revisiones; todas las claves de su plantilla con contenido y las listas con valores de la plantilla; cada cifra igual a la
//      que calcula la aplicación (LB0, catálogo de recursos, costos reales por proveedor, velocidad y AgileEVM con PM.calc y
//      PM.agile); ninguna fecha de un hecho pasa la fecha de corte ni la del documento o revisión que lo cita; los documentos y
//      revisiones aprobados no citan hechos posteriores a su fecha; coherencia con el acta, los registros de riesgos, incidentes y
//      lecciones y el informe de desempeño. Regresiones de la auditoría: precio de la suscripción solo desde la rev. 1 del análisis
//      de hacer o comprar; requisito habilitante del contrato por iteraciones; ajuste por tasa de cambio de la red (como el informe
//      de desempeño); órdenes de servicio fuera del valor fijo y con pólizas ampliadas; excepción de la póliza de cumplimiento de
//      la orden de compra; liquidación con la evaluación final, ya pagados; capacitación por grupos y conciliación de la formación
//      y la capacitación; facturación al cierre de la iteración o de la actividad; cajetines de las revisiones aprobadas.
//      Revisión cruzada: órdenes de servicio por encima del límite del director (estabilización) a la Gerencia General; capacitación
//      dentro de las horas de su orden; tabletas instaladas antes de la iteración 2; reclamo formal al proveedor tecnológico igual
//      al del registro de comunicaciones (si está cargado).
//   2) Interacción: crea el ejemplo desde el selector con el teclado, abre «Documentos» con el riel, filtra por enfoque si la
//      lista lo ofrece, busca y abre con el teclado el registro de contratos y el enunciado del trabajo de la implementación, y
//      revisa las columnas calculadas de los criterios de selección y del seguimiento de contratos.
//   3) Sin --quick: los diez documentos en el editor en tema oscuro, a 400 px (claro y oscuro) y a 1920 px, sin desborde de página
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
const outDir = opt('--out') || join(tmpdir(), 'gestor-pmbok-erp-adquisiciones-test-' + process.pid);
mkdirSync(outDir, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });

let file = opt('--file');
if (!file) {
  file = join(outDir, 'erp-adquisiciones.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file, '--include', '1,2,3,4,5,6,7,8,90,91,92,93,94,95,96,97-example-erp-docs-adquisiciones'], { stdio: 'pipe' });
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const MINE = ['plan-gestion-adquisiciones', 'estrategia-adquisiciones', 'decisiones-hacer-comprar', 'enunciado-trabajo-adquisicion', 'criterios-seleccion-proveedores', 'registro-adquisiciones', 'control-adquisiciones'];
const SOWS = ['sow-equipos', 'sow-implementacion', 'sow-suscripcion', 'sow-facturacion'];
const DOC_IDS = [...MINE.filter((t) => t !== 'enunciado-trabajo-adquisicion'), ...SOWS.map((k) => 'enunciado-trabajo-adquisicion--' + k)];

/* ============================================================== 1: datos y cifras (en la página) */
async function validateInPage(page) {
  return page.evaluate(async ({ MINE, SOWS, DOC_IDS }) => {
    const out = [];
    const ok = (cond, msg, extra) => out.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date, A = PM.agile, C = PM.calc, Fm = PM.fmt;
    const plain = (s) => String(s).replace(/[  ]/g, ' ');
    const ms = (v) => plain(Fm.moneyShort(v, 'COP'));
    const money = (v) => plain(Fm.money(v, 'COP'));
    const n1 = (v) => plain(Fm.num(v, 1));
    const ix = (v) => plain(Fm.idx(v));
    const has = (txt, sub) => plain(txt).includes(plain(sub));
    const round1 = (v) => Math.round(v * 10) / 10;
    const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
    const strings = (v, acc = []) => { if (typeof v === 'string') acc.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, acc)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc)); return acc; };
    const text = (fields) => strings(fields).join(' \n ');
    const empty = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

    /* ---------- construcción e importación */
    const exm = PM.getExample('erp');
    const SUP = PM.exampleDocs && PM.exampleDocs.erpAdquisiciones && PM.exampleDocs.erpAdquisiciones.SUP;
    ok(!!exm && PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts) && PM.exampleDocs.erpParts.length >= 1 && SUP, 'módulo de adquisiciones registrado en PM.exampleDocs.erpParts');
    if (!exm || !SUP) return out;
    const ex = exm.build({});
    ok(JSON.stringify(ex) === JSON.stringify(exm.build({ today: '2030-01-01' })), 'el constructor sigue siendo determinista con el módulo de adquisiciones');
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
    const sprints = A.sortSprints(agile.sprints);
    const cat = PM.res.catalog(resources, schedule);
    const item = (k) => cat.byId.get('rec-' + k);
    const tplKeys = (id) => PM.templates[id].sections.flatMap((s) => s.fields.map((f) => f.key));
    const fieldDef = (tid, key) => PM.templates[tid].sections.flatMap((s) => s.fields).find((f) => f.key === key);
    const col = (tid, field, key) => fieldDef(tid, field).columns.find((c) => c.key === key);
    const optsOf = (tid, field, key) => { const f = fieldDef(tid, field); return key ? f.columns.find((c) => c.key === key).options : f.options; };
    const resCost = (k) => sum(schedule.tasks, (t) => sum((t.resources || []).filter((a) => a.resourceId === 'rec-' + k), (a) => PM.res.assignment(cat, t, a).cost));
    const resQty = (k) => sum(schedule.tasks, (t) => sum((t.resources || []).filter((a) => a.resourceId === 'rec-' + k), (a) => PM.res.assignment(cat, t, a).qty));
    /* fecha de cada hecho citable (como test/example-erp.test.mjs) */
    const codeDates = Object.fromEntries(items.map((i) => [i.code, i.createdAt]));
    Object.assign(codeDates, { 'CC-001': rel('rel-1').baseline.date, 'INC-001': '2026-07-22', 'INC-002': '2026-09-30', 'INC-003': '2026-10-05', 'INC-004': '2026-10-09', 'R-008': '2026-10-08' });
    const lateCodes = (fields, date) => [...new Set(strings(fields).flatMap((s) => s.match(/\b(?:HU|TA|DF|IN|ME|EP|CC|INC|R)-\d{3}\b/g) || []))].filter((c) => codeDates[c] && codeDates[c] > date);
    /* actas citadas: «revisión/retrospectiva de la iteración N» solo con acta */
    const citeRe = /(revisión|retrospectiva) de la iteración (\d+)/g;

    /* ---------- fechas esperadas (LB0 y calendario) */
    const disc = lbT('t07').finish, rfp = lbT('t08').start, evalD = lbT('t09').finish, sign = lbT('t11').start;
    const eqSol = cal.addWork(lbT('t14').start, -10), feSol = cal.addWork(lbT('t15').start, -10), reg1 = lbT('t15').start;
    const c0 = cal.addWork(task('t29').actualFinish, 1);
    ok(disc < rfp && rfp < evalD && evalD < sign && sign < LB.date, 'secuencia: descubrimiento, solicitud de propuestas, evaluación, firma y LB0', [disc, rfp, evalD, sign, LB.date]);
    const SPEC = {
      'plan-gestion-adquisiciones': { status: 'aprobado', rev: '1', date: LB.date, revs: [['0', 'aprobado', disc], ['1', 'aprobado', LB.date]] },
      'estrategia-adquisiciones': { status: 'aprobado', rev: '0', date: disc, revs: [] },
      'decisiones-hacer-comprar': { status: 'aprobado', rev: '1', date: LB.date, revs: [['0', 'aprobado', disc], ['1', 'aprobado', LB.date]] },
      /* consecutivo por fecha de creación (94): implementación y suscripción del 21 de mayo, equipos y facturación después */
      'enunciado-trabajo-adquisicion--sow-equipos': { status: 'aprobado', rev: '0', date: eqSol, revs: [], seq: 3 },
      'enunciado-trabajo-adquisicion--sow-implementacion': { status: 'aprobado', rev: '1', date: sign, revs: [['0', 'aprobado', rfp], ['1', 'aprobado', sign]], seq: 1 },
      'enunciado-trabajo-adquisicion--sow-suscripcion': { status: 'aprobado', rev: '1', date: sign, revs: [['0', 'aprobado', rfp], ['1', 'aprobado', sign]], seq: 2 },
      'enunciado-trabajo-adquisicion--sow-facturacion': { status: 'aprobado', rev: '0', date: feSol, revs: [], seq: 4 },
      'criterios-seleccion-proveedores': { status: 'aprobado', rev: '1', date: evalD, revs: [['0', 'aprobado', rfp], ['1', 'aprobado', evalD]] },
      'registro-adquisiciones': { status: 'revision', rev: '2A', date: cut, revs: [['0', 'aprobado', sign], ['1', 'aprobado', reg1]] },
      'control-adquisiciones': { status: 'revision', rev: '1A', date: cut, revs: [['0', 'aprobado', c0]] },
    };

    /* ---------- existencia, código, estado, revisiones, claves y fechas */
    const V = {};
    for (const id of DOC_IDS) {
      const d = docOf(id);
      if (!ok(d, 'existe el documento ' + id)) continue;
      const s = SPEC[id], tb = d.titleBlock || {}, upd = String(d.updatedAt).slice(0, 10);
      const tid = d.template;
      const revs = await revsOf(id);
      V[id] = { tid, cur: { date: upd, status: d.status, fields: d.fields }, revs: revs.map((r) => ({ rev: r.rev, status: r.status, date: String(r.date).slice(0, 10), fields: r.fields, titleBlock: r.titleBlock })) };
      const code = meta.code + '-' + PM.templates[tid].abbr + (s.seq ? '-' + String(s.seq).padStart(2, '0') : '');
      ok(MINE.includes(tid) && tb.codigo === code, id + ': código ' + code, tb.codigo);
      ok(d.status === s.status && d.rev === s.rev && upd === s.date, id + ': estado ' + s.status + ', revisión ' + s.rev + ' del ' + s.date, [d.status, d.rev, upd]);
      ok(cal.isWork(upd) && upd <= cut && (d.status === 'aprobado' ? tb.fechaAprobacion === upd && tb.aprobo : !tb.fechaAprobacion) && tb.elaboro && tb.reviso && String(d.createdAt).slice(0, 10) <= upd, id + ': cajetín y fechas coherentes (día hábil, hasta el corte)', tb);
      ok(JSON.stringify(V[id].revs.map((r) => [r.rev, r.status, r.date])) === JSON.stringify(s.revs) && V[id].revs.every((r) => cal.isWork(r.date) && r.date <= upd && r.titleBlock && (r.status !== 'aprobado' || r.titleBlock.fechaAprobacion === r.date)), id + ': historial de revisiones', V[id].revs.map((r) => [r.rev, r.status, r.date]));
      const keys = tplKeys(tid);
      const versions = [V[id].cur, ...V[id].revs];
      const missing = versions.flatMap((v, k) => keys.filter((key) => empty(v.fields[key])).map((key) => (k ? 'rev ' + V[id].revs[k - 1].rev : 'vigente') + '.' + key));
      ok(!missing.length, id + ': todas las claves de la plantilla con contenido (vigente y revisiones)', missing);
      /* listas con los valores de la plantilla (selects de campos y de columnas) */
      const badOpt = [];
      for (const v of versions) for (const f of PM.templates[tid].sections.flatMap((x) => x.fields)) {
        if (f.type === 'select' && v.fields[f.key] && !f.options.map((o) => (typeof o === 'object' ? o.value : o)).includes(v.fields[f.key])) badOpt.push(f.key + '=' + v.fields[f.key]);
        if (f.type === 'table') for (const c of (f.columns || []).filter((c) => c.type === 'select')) for (const r of v.fields[f.key] || []) if (r[c.key] && !c.options.map((o) => (typeof o === 'object' ? o.value : o)).includes(r[c.key])) badOpt.push(f.key + '.' + c.key + '=' + r[c.key]);
      }
      ok(!badOpt.length, id + ': listas desplegables con valores de la plantilla', badOpt);
      /* fechas ISO de los campos: entre abril de 2026 y el fin del servicio anual de facturación electrónica (agosto de 2027) */
      const isoBad = versions.flatMap((v) => strings(v.fields).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && (!D.valid(x) || x < '2026-04-01' || x > '2027-08-31')));
      ok(!isoBad.length, id + ': fechas de los campos dentro del horizonte de los contratos', isoBad);
      /* los aprobados no citan hechos posteriores a su fecha; las actas citadas existen */
      const late = versions.filter((v) => v.status === 'aprobado').map((v) => [v.date, lateCodes(v.fields, v.date)]).filter(([, l]) => l.length);
      ok(!late.length, id + ': las versiones aprobadas no citan hechos posteriores a su fecha', late);
      const cites = versions.flatMap((v) => [...text(v.fields).matchAll(citeRe)].map((m) => [v.date, m[1], Number(m[2])])).filter(([date, kind, n]) => { const s2 = sprints.find((x) => x.name === 'Iteración ' + n); const dd = s2 && s2.docs[kind === 'revisión' ? 'revision' : 'retrospectiva']; return !dd || !docOf(dd) || s2.end > date; });
      ok(!cites.length, id + ': las revisiones y retrospectivas citadas tienen acta anterior al documento', cites);
    }
    if (Object.keys(V).length !== DOC_IDS.length) return out;
    const cur = (id) => V[id].cur.fields;
    const rev = (id, r) => V[id].revs.find((x) => x.rev === r).fields;

    /* ---------- valores del catálogo de recursos, el cronograma y los releases */
    const team = cat.items.filter((it) => it.supplier === 'Socio implementador' && it.agileTeam);
    const implFee = sum(team, (it) => it.unitCost * (it.dedication ?? 100) / 100 * st.sprintLength);
    const implHours = sum(team, (it) => (it.dedication ?? 100) / 100 * 8 * st.sprintLength);
    const rate = item('cf').unitCost / 8, rateLider = item('lim').unitCost / 8;
    const analyst = item('at').unitCost * st.sprintLength;
    const bolsa2 = task('t26').costFixed, bolsa3 = rel('rel-3').budget - rel('rel-3').plannedSprints * (implFee + analyst);
    const nSprints = sprints.length;
    const implValue = nSprints * implFee + bolsa2 + bolsa3;
    let subMonths = 0; for (let m = D.startOfMonth(lbT('t12').start); m <= lbT('t12').finish; m = D.addMonths(m, 1)) subMonths++;
    const subValue = resCost('suc') + resCost('sul');
    const subMonthly = subValue / subMonths;
    ok(implFee === 19.8e6 && implHours === 240 && rate === 82500 && bolsa2 === 8e6 && bolsa3 === 6e6 && implValue === 231.8e6, 'implementador: ' + ms(implFee) + ' por iteración de 240 horas, bolsas de ' + ms(bolsa2) + ' y ' + ms(bolsa3), [implFee, implHours, rate, bolsa2, bolsa3]);
    ok(subValue === lbT('t12').cost && subMonths === 7 && Math.round(subMonthly) === 11040000, 'suscripción: valor del contrato = costo de t12 en la LB0 (siete meses)', [subValue, lbT('t12').cost, subMonths]);
    const limite = docOf('acta-constitucion').fields.limiteGasto;

    /* ---------- plan de gestión de las adquisiciones */
    {
      const f = cur('plan-gestion-adquisiciones'), f0 = rev('plan-gestion-adquisiciones', '0');
      const cr = f.cronogramaAdquisiciones;
      const row = (re) => cr.find((r) => re.test(r.adquisicion));
      const impl = row(/^Implementación/), sub = row(/^Suscripción/), fe = row(/^Proveedor tecnológico/), eq = row(/^Equipos/), jur = row(/^Asesoría/), cgc = row(/gestión del cambio/), sel = row(/^Consultor de selección/);
      ok(impl.solicitudOfertas === rfp && impl.adjudicacion === lbT('t10').start && impl.inicio === lbT('t13').start && impl.fin === meta.end && sub.inicio === lbT('t12').start && sub.fin === D.endOfMonth(lbT('t12').finish), 'plan: suscripción e implementación con la solicitud, la adjudicación y los inicios de la LB0', [impl, sub]);
      ok(fe.inicio === lbT('t15').start && fe.fin === lbT('t15').finish && fe.adjudicacion < fe.inicio && eq.inicio === lbT('t14').start && eq.fin === lbT('t14').finish && jur.inicio === lbT('t10').start && jur.fin === lbT('t10').finish && cgc.inicio === lbT('t20').start && sel.fin === lbT('t09').finish, 'plan: proveedor tecnológico, equipos, asesoría jurídica, gestión del cambio y consultor de selección con sus actividades de la LB0');
      ok(cr.every((r) => r.solicitudOfertas <= r.adjudicacion && r.adjudicacion <= r.inicio && r.inicio <= r.fin && cal.isWork(r.solicitudOfertas) && cal.isWork(r.adjudicacion)) && JSON.stringify(cr) === JSON.stringify(f0.cronogramaAdquisiciones), 'plan: cronograma ordenado en días hábiles e igual en las revisiones 0 y 1');
      ok(f.rolesAdquisiciones.some((r) => r.rol === 'Gerencia General' && has(r.limite, ms(limite))) && f.rolesAdquisiciones.some((r) => /^Director de proyecto/.test(r.rol) && has(r.limite, ms(limite))), 'plan: límites de aprobación con el límite de gasto del acta de constitución (' + ms(limite) + ')');
      const vSup = docOf('plan-release').fields.velocidadSupuesta;
      ok(f.metricasProveedor.some((m) => has(m.metrica, '(' + vSup + ' puntos)') && m.meta === '≥ ' + Math.round(vSup * 0.9) + ' puntos') && !/\d+ puntos/.test(text(f0.metricasProveedor)), 'plan: métrica de velocidad con la velocidad supuesta del plan de releases (rev. 1, no en la rev. 0)', f.metricasProveedor);
      ok(has(f.estimacionesIndependientes, money(SUP.tarifaReferencia)) && has(f.estimacionesIndependientes, ms(nSprints * implHours * SUP.tarifaReferencia)) && has(f.estimacionesIndependientes, money(rate)) && !has(text(f0), money(rate)) && !/CT-2026|OS-2026|OC-2026/.test(text(f0)), 'plan: estimación independiente; la tarifa negociada y los contratos solo desde la rev. 1');
      ok(/capacidad/.test(f.coordinacion) && /definición de terminado/.test(f.coordinacion) && /otrosí/.test(f.coordinacion) && has(f.coordinacion, PM.fmt.date(rel('rel-2').start, 'long')), 'plan: contrato por capacidad, definición de terminado como condición de entrega y coordinación con el release 2');
    }

    /* ---------- estrategia */
    {
      const f = cur('estrategia-adquisiciones');
      const impl = f.estrategias.find((r) => /^Implementación/.test(r.adquisicion));
      ok(impl && impl.tipoContrato === 'Precio fijo cerrado (FFP)' && /240 horas/.test(impl.adquisicion) && f.estrategias.some((r) => /Bolsas/.test(r.adquisicion) && r.tipoContrato === 'Tiempo y materiales (T&M)') && f.estrategias.some((r) => /Equipos/.test(r.adquisicion) && /FP-EPA/.test(r.tipoContrato)), 'estrategia: implementación por iteraciones de precio fijo, bolsas en T&M y equipos con ajuste por tasa de cambio');
      ok(f.fases.length === 5 && /enero de 2027/.test(f.fases[4].fase) && /transferencia de conocimiento/i.test(f.seguimiento) && !/\$/.test(text(f)), 'estrategia: cinco fases hasta la estabilización, transferencia de conocimiento y sin precios (aprobada antes de las propuestas)');
      /* regresión (revisión cruzada): la orden de servicio de la estabilización (208 horas a la tarifa del contrato) supera el límite de
         gasto del director; la estrategia, el plan y el registro de contratos la dejan a la Gerencia General, no al director */
      const hrs = f.estrategias.find((r) => /por horas/.test(r.adquisicion));
      const estab = sum(task('t34').resources.filter((a) => { const it = cat.resolve(a); return it && it.supplier === 'Socio implementador'; }), (a) => PM.res.assignment(cat, task('t34'), a).qty * 8) * rate;
      const gg = cur('plan-gestion-adquisiciones').rolesAdquisiciones.find((r) => r.rol === 'Gerencia General');
      const implReg = cur('registro-adquisiciones').contratos.find((c) => c.numero === SUP.num.impl);
      ok(estab > limite && hrs && !/dentro del presupuesto de su actividad y del límite de gasto del director/.test(hrs.justificacion) && /la Gerencia General, las que lo superan/.test(hrs.justificacion) && /órdenes de servicio que superan el límite del director/.test(gg.responsabilidad) && has(implReg.observaciones, 'La orden de la estabilización (208 horas, ' + ms(estab) + ') supera el límite de gasto del director'), 'estrategia, plan y registro: las órdenes de servicio por encima de ' + ms(limite) + ' (la estabilización, ' + ms(estab) + ') las aprueba la Gerencia General', [hrs && hrs.justificacion, gg && gg.responsabilidad]);
    }

    /* ---------- análisis de hacer o comprar */
    {
      const f = cur('decisiones-hacer-comprar'), f0 = rev('decisiones-hacer-comprar', '0');
      const diff = col('decisiones-hacer-comprar', 'analisis', 'diferencia').calc;
      const row = (v, re) => v.analisis.find((r) => re.test(r.item));
      const H = SUP.hacer;
      ok(row(f, /^Plataforma/).costoComprar === Math.round(subMonthly * 36) && row(f, /^Facturación/).costoComprar === 3 * item('fe').unitCost && row(f, /^Equipos/).costoComprar === resCost('tab') + resCost('lec') + resCost('imp') && row(f, /^Red/).costoComprar === resCost('red') && row(f, /gestión del cambio/).costoComprar === resCost('cgc'), 'hacer o comprar: costos de comprar desde el catálogo de recursos (suscripción 36 meses, paquete anual, equipos, red y consultor)');
      ok(row(f, /^Depuración/).costoHacer === tree.byId.get('w4').costEstimate && tree.byId.get('w4').costEstimate === sum(['t16', 't17', 't18', 't19'], (id) => lbT(id).cost) && row(f, /gestión del cambio/).costoHacer === H.cambioDias * item('sm').unitCost && row(f, /^Red/).costoHacer === H.redMateriales + H.redDiasTI * item('jti').unitCost, 'hacer o comprar: costos de hacer desde la EDT (migración = LB0 de t16 a t19) y el catálogo (PMO y jefe de TI)');
      ok(row(f, /^Implementación/).costoComprar === implValue && row(f0, /^Implementación/).costoComprar === nSprints * implHours * SUP.tarifaReferencia && row(f, /^Implementación/).costoHacer === Math.round(implHours / 80 * analyst * Math.ceil(nSprints * H.curva) + H.reclutamiento), 'hacer o comprar: implementación contratada (rev. 1) frente a la estimación independiente (rev. 0) y al equipo propio');
      const incoherent = [f, f0].flatMap((v) => v.analisis.filter((r) => { const d = diff(r); return r.decision === 'Hacer' ? !(d < 0) : !(d > 0); }).map((r) => r.item));
      ok(!incoherent.length, 'hacer o comprar: cada decisión coincide con la diferencia calculada por la plantilla (hacer cuando cuesta menos; comprar o mixto cuando la opción externa cuesta menos)', incoherent);
      ok(has(f.conclusion, ms(implValue)) && has(f.conclusion, ms(implValue - nSprints * implHours * SUP.tarifaReferencia)) && !has(text(f0), ms(implValue)), 'hacer o comprar: la conclusión de la rev. 1 compara lo contratado con la estimación del 25 de mayo');
      /* regresión: la rev. 0 (25 de mayo, antes de la solicitud de propuestas) no conoce el precio por usuario adjudicado */
      ok(row(f0, /^Plataforma/).costoComprar === 36 * SUP.suscripcionReferencia && has(row(f0, /^Plataforma/).opcionComprar, ms(SUP.suscripcionReferencia)) && !has(text(f0), money(subMonthly)) && !has(text(f0), money(item('suc').unitCost)) && !/CT-2026/.test(text(f0)) && has(row(f, /^Plataforma/).opcionComprar, money(subMonthly)) && has(row(f, /^Plataforma/).opcionComprar, SUP.num.sub), 'hacer o comprar rev. 0: suscripción con la referencia de mercado del caso de negocio; el precio por usuario solo desde la rev. 1 (contrato)', row(f0, /^Plataforma/));
      ok([f, f0].every((v) => /alternativa D del caso de negocio \(ERP con servidores propios y desarrollos a la medida\)/.test(row(v, /^Plataforma/).factores) && /solo la plataforma/.test(row(v, /^Plataforma/).factores) && !/desarrollo propio/.test(row(v, /^Plataforma/).factores)), 'hacer o comprar: cita la alternativa D del caso de negocio por su nombre y aclara que la fila costea solo la plataforma');
    }

    /* ---------- enunciados del trabajo */
    {
      const impl = cur('enunciado-trabajo-adquisicion--sow-implementacion'), impl0 = rev('enunciado-trabajo-adquisicion--sow-implementacion', '0');
      const ent = (v, re) => v.entregables.find((r) => re.test(r.entregable));
      const hoursOf = (tid) => { const t = task(tid); return sum((t.resources || []).filter((a) => { const it = cat.resolve(a); return it && it.supplier === 'Socio implementador'; }), (a) => PM.res.assignment(cat, t, a).qty * 8); };
      ok(['rel-1', 'rel-2', 'rel-3'].every((id) => { const r = ent(impl, new RegExp('release ' + id.slice(-1) + ':')); return r && r.cantidad === rel(id).plannedSprints && r.fecha === rel(id).end; }), 'SOW implementación: iteraciones por release y fechas de fin de los releases');
      ok(ent(impl, /^Formación/).cantidad === hoursOf('t21') && hoursOf('t21') === 40 && ent(impl, /^Estabilización/).cantidad === hoursOf('t34') && hoursOf('t34') === 208 && ent(impl, /^Estabilización/).fecha === lbT('t34').finish, 'SOW implementación: horas de formación (40) y estabilización (208) desde las asignaciones del cronograma');
      /* regresión: la capacitación se contrata por grupos (la orden de cada release fija las horas) y la formación incluye sus materiales,
         como facturan FE-5133 («seis grupos») y FE-5110 («40 horas y materiales») */
      const WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
      const fCap = costs.actuals.find((a) => a.taskId === 't22' && /^Implementador/.test(a.description));
      const fForm = costs.actuals.find((a) => a.taskId === 't21' && /^Implementador/.test(a.description));
      const capE = ent(impl, /^Capacitación/), formE = ent(impl, /^Formación/);
      ok(capE.cantidad === 3 * SUP.gruposCapacitacion && capE.unidad === 'grupo' && new RegExp(WORDS[SUP.gruposCapacitacion] + ' grupos', 'i').test(capE.especificacion) && /fija las horas por grupo/.test(capE.especificacion) && fCap && new RegExp(WORDS[SUP.gruposCapacitacion] + ' grupos').test(fCap.description) && /materiales del curso/.test(formE.especificacion) && fForm && new RegExp('\\(' + hoursOf('t21') + ' horas\\) y materiales').test(fForm.description), 'SOW implementación: capacitación por grupos (' + SUP.gruposCapacitacion + ' por release) y formación con sus materiales, coherentes con las facturas FE-5133 y FE-5110', [capE, formE]);
      /* regresión (revisión cruzada): la formación no fija un número de áreas que contradiga el acta de arranque (un usuario clave por
         área, seis en el catálogo) */
      ok(!/cinco áreas|seis áreas/.test(formE.especificacion) && /usuarios clave/i.test(formE.especificacion), 'SOW implementación: la formación de usuarios clave no fija un número de áreas', formE.especificacion);
      /* regresión: facturación de bolsas y servicios por horas como en los costos reales (al cierre de la iteración o de la actividad),
         y todos los paquetes de la EDT facturados por horas en el SOW (el taller de planificación de releases incluido) */
      const plan1 = cur('plan-gestion-adquisiciones'), plan0 = rev('plan-gestion-adquisiciones', '0');
      ok([impl.formaPago, impl0.formaPago, plan1.moneda, plan0.moneda].every((x) => !/consumo mensual/.test(x) && /al cierre de cada iteración/.test(x) && /al terminar cada actividad/.test(x)), 'SOW implementación y plan: bolsas al cierre de cada iteración y servicios por horas al terminar cada actividad (sin «consumo mensual»)');
      const hourlyAll = costs.actuals.filter((a) => /^Implementador/.test(a.description) && !/precio fijo por iteración|horas adicionales del conector/.test(a.description));
      const wc = (id) => tree.codes.get(id);
      const pk = impl.paqueteEdt;
      const uncovered = hourlyAll.filter((a) => { const code = wc(task(a.taskId).wbsId); return !pk.split(/[^\d.]+/).filter(Boolean).some((c) => code === c || code.startsWith(c + '.')); }).map((a) => a.document + ' ' + wc(task(a.taskId).wbsId));
      ok(!uncovered.length && /taller de planificación de releases/.test(impl.descripcionTrabajo) && ent(impl, /^Taller de planificación/) && ent(impl, /^Taller de planificación/).fecha === lbT('t03').finish, 'SOW implementación: cada servicio por horas facturado está en sus paquetes de la EDT y en su descripción (taller de planificación de releases)', uncovered);
      ok(has(impl.formaPago, ms(implFee)) && has(impl.formaPago, money(rate)) && has(impl.formaPago, money(rateLider)) && has(impl.descripcionTrabajo, ms(bolsa2)) && has(impl.descripcionTrabajo, ms(bolsa3)) && impl.periodoInicio === lbT('t13').start && impl.periodoFin === meta.end, 'SOW implementación (anexo del contrato): precio por iteración, tarifas, bolsas y vigencia');
      ok(!has(text(impl0), ms(implFee)) && !has(text(impl0), money(rate)) && !/CT-2026/.test(text(impl0)) && /solicitud de propuestas/.test(impl0.antecedentes), 'SOW implementación rev. 0: emitido con la solicitud de propuestas, sin precios negociados');
      ok(/definición de terminado/.test(impl.calidad) && /rechazada/.test(impl.calidad) && impl.exclusiones.some((x) => /Nómina/.test(x)) && impl.exclusiones.some((x) => /estabilización/.test(x)), 'SOW implementación: definición de terminado como condición de entrega, historias rechazadas sin costo y exclusiones de la visión');
      const sub = cur('enunciado-trabajo-adquisicion--sow-suscripcion'), sub0 = rev('enunciado-trabajo-adquisicion--sow-suscripcion', '0');
      ok([sub, sub0].every((v) => v.polizas.length === 1 && /^No se exigen pólizas/.test(v.polizas[0]) && /formato abierto/.test(v.especificaciones)) && /formato abierto/.test(cur('registro-adquisiciones').clausulas), 'SOW suscripción: «Pólizas exigidas» solo trae pólizas; la devolución de los datos va en las especificaciones y en las cláusulas');
      ok(ent(sub, /completos/).cantidad === resQty('suc') / subMonths && ent(sub, /limitados/).cantidad === resQty('sul') / subMonths && has(sub.formaPago, money(subMonthly)) && has(sub.formaPago, money(item('suc').unitCost)) && sub.periodoInicio === lbT('t12').start, 'SOW suscripción: 30 usuarios completos y 15 limitados, valor mensual del catálogo');
      const fe = cur('enunciado-trabajo-adquisicion--sow-facturacion');
      ok(ent(fe, /^Paquete/).cantidad === 6000 && /6\.000 documentos/.test(item('fe').name) && has(fe.formaPago, ms(item('fe').unitCost)) && fe.periodoInicio === lbT('t15').start && ent(fe, /^Credenciales/).fecha === cal.addWork(rel('rel-2').start, -1) && task('t15').actualFinish <= ent(fe, /^Credenciales/).fecha, 'SOW facturación electrónica: paquete anual del catálogo y credenciales antes del release 2 (entregadas a tiempo)');
      const eq = cur('enunciado-trabajo-adquisicion--sow-equipos');
      ok(['tab', 'lec', 'imp'].every((k, i) => eq.entregables[i].cantidad === resQty(k)) && eq.periodoInicio === lbT('t14').start && eq.periodoFin === lbT('t14').finish && /alturas/.test(eq.sst) && /30 días/.test(eq.calidad), 'SOW equipos: cantidades de t14, plazo de la LB0, trabajo en alturas y cambio de modelo en 30 días');
    }

    /* ---------- criterios de selección */
    {
      const f = cur('criterios-seleccion-proveedores'), f0 = rev('criterios-seleccion-proveedores', '0');
      ok(sum(f.criterios, (r) => r.peso) === 100 && JSON.stringify(f.criterios.map((r) => [r.criterio, r.peso])) === JSON.stringify(f0.criterios.map((r) => [r.criterio, r.peso])), 'criterios: pesos que suman 100 %, fijados en la rev. 0 (antes de abrir las ofertas)');
      ok(f0.criterios.every((r) => r.puntajeA === null && r.puntajeB === null && r.puntajeC === null) && /pendiente/i.test(f0.resultado), 'criterios rev. 0: sin puntajes (evaluación pendiente)');
      const tcoB = Math.round(subMonthly * 36) + nSprints * implFee;
      const tco = { A: tcoB * SUP.ofertas.A, B: tcoB, C: tcoB * SUP.ofertas.C };
      const min = Math.min(tco.A, tco.B, tco.C);
      const costRow = f.criterios.find((r) => /Costo total/.test(r.criterio));
      ok(['A', 'B', 'C'].every((k) => costRow['puntaje' + k] === Math.round(100 * min / tco[k])), 'criterios: puntaje de costo proporcional al costo total a tres años (suscripción 36 meses + once iteraciones)', costRow);
      const tot = Object.fromEntries(['A', 'B', 'C'].map((k) => [k, sum(f.criterios, (r) => col('criterios-seleccion-proveedores', 'criterios', 'ponderado' + k).calc(r, f.criterios))]));
      const win = ['A', 'B', 'C'].sort((a, b) => tot[b] - tot[a])[0];
      ok(['A', 'B', 'C'].every((k) => has(f.resultado, 'oferente ' + k + ' ' + n1(tot[k]))) && has(f.resultado, ms(tco.B)) && win === 'B' && /^Oferente B/.test(f.seleccionado), 'criterios: totales ponderados de la plantilla en el resultado; gana el oferente B', tot);
      /* regresión: un requisito habilitante (cumple o no cumple) no puede contradecir la descripción de un finalista hábil */
      const habIter = f.requisitosHabilitantes.some((x) => /contrato por iteraciones/.test(x));
      ok(habIter && /cumplieron los requisitos habilitantes/.test(f.resultado) && /aceptó el contrato por iteraciones/.test(f.resultado) && !/sin iteraciones/.test(text(f)) && !/entregas por fases\)/.test(f.proveedorA), 'criterios: el oferente A aceptó el contrato por iteraciones (requisito habilitante) y solo pierde puntos en el criterio ponderado', [f.proveedorA, f.resultado]);
      const lecc = docOf('registro-lecciones').fields.lecciones.find((l) => l.area === 'Adquisiciones');
      ok(lecc && lecc.fecha === evalD && /presentaciones comerciales ocultaban/.test(lecc.situacion) && /presentaciones comerciales ocultaban/.test(f.resultado), 'criterios: coherente con la lección aprendida de las demostraciones (registro de lecciones)');
    }

    /* ---------- registro de contratos */
    const by = (re) => (a) => re.test(a.description);
    const MATCH = { sel: by(/^Consultor de selección/), jur: by(/^Asesoría jurídica/), sub: by(/^Suscripción del ERP/), impl: by(/^Implementador/), cgc: by(/^Consultor de gestión del cambio/), eq: (a) => a.category === 'Equipos', red: by(/^Red inalámbrica/), fe: by(/^Proveedor tecnológico/) };
    const NUM = SUP.num;
    const actualsOf = (k, at) => costs.actuals.filter((a) => a.date <= at && MATCH[k](a));
    const tot = (list) => sum(list, (a) => a.amount);
    {
      const unmatched = costs.actuals.filter((a) => !['Mano de obra', 'Otros'].includes(a.category)).filter((a) => Object.values(MATCH).filter((m) => m(a)).length !== 1).map((a) => a.document);
      ok(!unmatched.length, 'registro: cada costo real de servicios, licencias, equipos y subcontratos pertenece a un solo contrato', unmatched);
      const f = cur('registro-adquisiciones'), f0 = rev('registro-adquisiciones', '0'), f1 = rev('registro-adquisiciones', '1');
      const ct = (v, k) => v.contratos.find((r) => r.numero === NUM[k]);
      ok(f.contratos.length === 8 && f1.contratos.length === 8 && f0.contratos.length === 5 && !ct(f0, 'fe') && !ct(f0, 'eq') && !ct(f0, 'red') && lbT('t14').start > sign, 'registro: ocho contratos; las órdenes de equipos y red (emitidas al iniciar t14) y el contrato del proveedor tecnológico desde la rev. 1');
      const want = { sel: item('csel').unitCost * resQty('csel'), jur: resCost('jur'), sub: subValue, impl: implValue, cgc: resCost('cgc'), eq: tot(actualsOf('eq', cut)), red: tot(actualsOf('red', cut)), fe: resCost('fe') };
      const badVal = Object.entries(want).filter(([k, v]) => !ct(f, k) || ct(f, k).valor !== v);
      ok(!badVal.length, 'registro: valores de los contratos desde el catálogo, el cronograma y los releases (equipos y red: valor final facturado)', badVal.map(([k, v]) => [k, v, ct(f, k) && ct(f, k).valor]));
      ok(want.sel === 25.74e6 && want.jur === tot(actualsOf('jur', cut)) && want.cgc === tot(actualsOf('cgc', cut)) && want.fe === tot(actualsOf('fe', cut)) && has(ct(f, 'eq').observaciones, money(resCost('tab') + resCost('lec') + resCost('imp'))) && has(ct(f, 'red').observaciones, money(resCost('red'))) && ['valor', 'fechaInicio', 'fechaFin', 'tipoContrato', 'polizaCumplimiento', 'polizaCalidad'].every((x) => ct(f1, 'eq')[x] === ct(f, 'eq')[x]), 'registro: precio fijo igual a lo facturado (jurídica, gestión del cambio, proveedor tecnológico); equipos y red con su valor de la orden (catálogo) y el final facturado');
      ok(has(ct(f, 'eq').observaciones, 'USD ' + plain(Fm.num((resCost('tab') + resCost('lec') + resCost('imp')) / SUP.trm, 0))) && has(ct(f, 'red').observaciones, money(tot(actualsOf('red', cut)) - resCost('red'))) && has(ct(f, 'sel').observaciones, money(tot(actualsOf('sel', cut)))), 'registro: ajuste por tasa de cambio de los equipos y de la red y liquidación del consultor desde los costos reales');
      /* regresión: la diferencia de la red es ajuste por tasa de cambio (como el informe de desempeño de 95 explica el CV de t14), no una adición */
      const inf = docOf('informe-desempeno--corte-2026-10-09').fields.analisisVariacion;
      const strat = cur('estrategia-adquisiciones').estrategias.find((r) => /^Red/.test(r.adquisicion));
      const ctlRed = cur('control-adquisiciones').seguimiento.find((r) => r.contrato.startsWith(NUM.red + ' '));
      ok(/equipos de bodega por la tasa de cambio/.test(inf) && /FP-EPA/.test(ct(f, 'red').tipoContrato) && /FP-EPA/.test(strat.tipoContrato) && /tasa de cambio/.test(ct(f, 'red').observaciones) && /tasa de cambio/.test(ctlRed.observaciones) && ![ct(f, 'red').observaciones, ctlRed.observaciones].some((x) => /adición|adicional/.test(x)) && /puntos de acceso/.test(cur('enunciado-trabajo-adquisicion--sow-equipos').formaPago), 'registro y seguimiento: el mayor valor de la red es el ajuste por tasa de cambio de los puntos de acceso (FP-EPA), coherente con el informe de desempeño', [ct(f, 'red').observaciones, ctlRed.observaciones]);
      /* regresión: condiciones de la orden de compra iguales a las del SOW de equipos */
      const sowEq = cur('enunciado-trabajo-adquisicion--sow-equipos');
      ok(/pago a 30 días contra entrega a satisfacción/.test(ct(f, 'eq').observaciones) && /tasa de cambio de la fecha de la factura/.test(ct(f, 'eq').observaciones) && !/nacionalización|pago contra entrega/.test(ct(f, 'eq').observaciones) && /pago a 30 días contra entrega a satisfacción/.test(sowEq.formaPago) && /tasa de cambio de la fecha de la factura/.test(sowEq.formaPago), 'registro: la orden de compra repite las condiciones de pago y de tasa de cambio del SOW de equipos', ct(f, 'eq').observaciones);
      /* regresión: pólizas de cumplimiento según el plan (más del límite de gasto o trabajo en sitio), con sus excepciones explícitas */
      const plan = cur('plan-gestion-adquisiciones');
      const noBond = f.contratos.filter((r) => r.valor > limite && r.polizaCumplimiento !== 'Aprobada').filter((r) => !(r.numero === NUM.sub || r.numero === NUM.fe) && !(/^OC-/.test(r.numero) && /Excepción: las órdenes de compra de bienes que se pagan después del recibo a satisfacción/.test(plan.garantias) && /contra entrega a satisfacción/.test(r.observaciones)));
      ok(!noBond.length && /Sin póliza de cumplimiento/.test(sowEq.polizas[0]) && /Servicios en la nube \(suscripción y proveedor tecnológico\)/.test(plan.garantias), 'registro: todo contrato de más de ' + ms(limite) + ' tiene póliza de cumplimiento o una excepción del plan (nube; bienes pagados después del recibo)', noBond.map((r) => r.numero));
      /* regresión: valor del contrato del implementador = valor fijo (iteraciones y bolsas); las órdenes de servicio, aparte y con pólizas ampliadas */
      const sowI = cur('enunciado-trabajo-adquisicion--sow-implementacion');
      ok(/no suman al valor fijo/.test(ct(f, 'impl').observaciones) && /amplía las pólizas/.test(ct(f, 'impl').observaciones) && sowI.polizas.every((x) => /cada orden de servicio/.test(x)) && /no suman al valor fijo/.test(sowI.descripcionTrabajo) && /amplía sus pólizas/.test(plan.garantias), 'registro: el valor del implementador es el fijo (iteraciones y bolsas); cada orden de servicio por horas amplía las pólizas');
      /* regresión: liquidados solo después de su pago y de la evaluación final del proveedor (rev. 0 del seguimiento) */
      const DONE = ['sel', 'jur', 'cgc', 'eq', 'red'];
      const c0doc = V['control-adquisiciones'].revs.find((r) => r.rev === '0').date;
      const lastPay = (k) => D.add(actualsOf(k, cut).reduce((m, a) => (a.date > m ? a.date : m), ''), SUP.pagoDias);
      ok(c0doc === c0 && DONE.every((k) => ct(f1, k).estado === 'Terminado' && ct(f, k).estado === 'Liquidado' && lastPay(k) <= c0 && has(ct(f, k).observaciones, PM.fmt.date(c0, 'long'))) && ![f0, f1].some((v) => v.contratos.some((r) => r.estado === 'Liquidado')) && DONE.some((k) => lastPay(k) > reg1), 'registro: los contratos terminados se liquidan con la evaluación final del ' + c0 + ' (después de su pago); en la rev. 1 siguen «Terminado»', DONE.map((k) => [k, ct(f1, k).estado, ct(f, k).estado, lastPay(k)]));
      /* regresión: cajetines de las revisiones aprobadas con quien aprobó, y revisor vigente (no un recurso liberado) */
      const released = new Set(cat.items.filter((it) => it.status === 'liberado').map((it) => it.name));
      ok(['registro-adquisiciones', 'control-adquisiciones'].every((id) => V[id].revs.every((r) => r.status !== 'aprobado' || (r.titleBlock.aprobo && r.titleBlock.fechaAprobacion === r.date)) && !released.has(docOf(id).titleBlock.reviso) && docOf(id).titleBlock.reviso !== 'Asesor jurídico'), 'registro y seguimiento: las revisiones aprobadas tienen «Aprobó» y el revisor es un rol vigente', ['registro-adquisiciones', 'control-adquisiciones'].map((id) => [docOf(id).titleBlock, V[id].revs.map((r) => r.titleBlock.aprobo)]));
      const implAt = actualsOf('impl', cut);
      const hourly = implAt.filter((a) => !/precio fijo por iteración|horas adicionales del conector/.test(a.description));
      ok(has(ct(f, 'impl').observaciones, ms(tot(hourly))) && has(ct(f, 'impl').observaciones, ms(tot(implAt.filter((a) => /horas adicionales del conector/.test(a.description))))) && has(ct(f, 'sub').observaciones, money(tot(actualsOf('sub', cut)))), 'registro: órdenes por horas, bolsa del conector y facturas de la suscripción al corte (valor exacto, como el valor mensual)');
      const stateOk = (v, date) => v.contratos.every((r) => (!['En ejecución', 'Terminado', 'Liquidado'].includes(r.estado) || r.fechaInicio <= date) && (!['Terminado', 'Liquidado'].includes(r.estado) || r.fechaFin <= date));
      ok(stateOk(f, cut) && stateOk(f1, reg1) && stateOk(f0, sign) && ct(f0, 'impl').estado === 'Firmado' && ct(f, 'impl').estado === 'En ejecución' && ct(f, 'eq').estado === 'Liquidado' && ct(f1, 'eq').fechaFin <= reg1 && ct(f1, 'fe').estado === 'Firmado' && ct(f, 'fe').estado === 'En ejecución', 'registro: estados coherentes con las fechas de cada revisión');
      const r005 = docOf('registro-riesgos').fields.riesgos.find((r) => r.id === 'R-005');
      ok(/5 días hábiles/.test(r005.respuesta) && /cinco días hábiles/.test(f.clausulas) && /R-005/.test(f.clausulas) && !/R-005/.test(f0.clausulas), 'registro: cláusula de reemplazo de personal igual a la respuesta del riesgo R-005');
    }

    /* ---------- seguimiento de contratos */
    {
      const f = cur('control-adquisiciones'), f0 = rev('control-adquisiciones', '0');
      const ret = SUP.retencion, payDays = SUP.pagoDias;
      const accepted = (rid, at) => { const r = rel(rid); return r.status === 'cerrado' && r.end <= at; };
      const retOf = (a, at) => (/precio fijo por iteración/.test(a.description) && a.releaseId && !accepted(a.releaseId, at) ? ret : 0);
      const paid = (list, at) => Math.round(sum(list.filter((a) => D.add(a.date, payDays) <= at), (a) => a.amount * (1 - retOf(a, at))));
      const held = (list, at) => Math.round(sum(list, (a) => a.amount * retOf(a, at)));
      const closedBy = (at) => sprints.filter((s) => s.status === 'cerrado' && s.end <= at).length;
      /* las filas del implementador: iteraciones y bolsas (comparables con el valor fijo del contrato) y órdenes de servicio por horas */
      const isFixed = (a) => /precio fijo por iteración|horas adicionales del conector/.test(a.description);
      const isOS = (r) => /órdenes de servicio por horas/i.test(r.contrato);
      const listOf = (k, r) => (k !== 'impl' ? actualsOf(k, r.fechaCorte) : actualsOf('impl', r.fechaCorte).filter((a) => (isOS(r) ? !isFixed(a) : isFixed(a))));
      /* actividades con servicios por horas del SOW: taller de planificación de releases (t03), ambientes (t13), migración (1.4),
         formación y capacitación (1.5.2 y 1.5.3), salidas y estabilización (1.9) */
      const inPkg = (t, w) => { const c = tree.codes.get(t.wbsId), r0 = tree.codes.get(w); return c === r0 || c.startsWith(r0 + '.'); };
      const osTasks = schedule.tasks.filter((t) => !t.milestone && !t.loe && !t.releaseId && (t.id === 't03' || t.id === 't13' || ['w4', 'w52', 'w53', 'w9'].some((w) => inPkg(t, w))));
      for (const [v, at, name] of [[f, cut, 'corte'], [f0, c0, 'rev. 0']]) {
        const bad = [];
        for (const k of Object.keys(MATCH)) {
          const rs = v.seguimiento.filter((x) => x.contrato.startsWith(NUM[k] + ' '));
          if (!rs.length || (k === 'impl' && rs.length !== 2)) { bad.push(k + ': filas ' + rs.length); continue; }
          if (sum(rs, (r) => r.valorEjecutado) !== tot(actualsOf(k, rs[0].fechaCorte))) bad.push(k + ': las filas no suman lo facturado');
          for (const r of rs) {
            const list = listOf(k, r);
            /* fecha de corte: la de la revisión; en los liquidados, la de la liquidación (evaluación final de la rev. 0) */
            const wantCut = r.avance === 100 ? c0 : at;
            if (r.fechaCorte !== wantCut) bad.push(k + ': fecha de corte ' + r.fechaCorte + ' ≠ ' + wantCut);
            if (r.valorEjecutado !== tot(list)) bad.push(k + ': ejecutado ' + r.valorEjecutado + ' ≠ ' + tot(list));
            if (r.valorPagado !== paid(list, r.fechaCorte)) bad.push(k + ': pagado ' + r.valorPagado + ' ≠ ' + paid(list, r.fechaCorte));
            if (r.retencion !== held(list, r.fechaCorte)) bad.push(k + ': retención ' + r.retencion + ' ≠ ' + held(list, r.fechaCorte));
            if (r.avance === 100 && r.valorPagado !== r.valorEjecutado) bad.push(k + ': liquidado sin pagar todo a su fecha de corte');
            if ([r.plazo, r.calidad, r.sst].some((x) => x !== null && !(Number.isInteger(x) && x >= 1 && x <= 5)) || r.plazo === null || r.calidad === null) bad.push(k + ': calificación');
          }
        }
        const implRow = v.seguimiento.find((x) => x.contrato.startsWith(NUM.impl) && !isOS(x));
        const osRow = v.seguimiento.find((x) => x.contrato.startsWith(NUM.impl) && isOS(x));
        const subRow = v.seguimiento.find((x) => x.contrato.startsWith(NUM.sub));
        ok(implRow && osRow && subRow, 'seguimiento (' + name + '): filas del implementador (iteraciones y bolsas; órdenes de servicio) y de la suscripción', bad);
        if (!implRow || !osRow || !subRow) continue;
        if (implRow.avance !== round1(closedBy(at) / nSprints * 100)) bad.push('avance del implementador ' + implRow.avance);
        if (!has(implRow.observaciones, plain(Fm.pct(implRow.valorEjecutado / implValue, 1)) + ' del valor fijo del contrato (' + ms(implValue) + ')')) bad.push('implementador: ejecutado frente al valor fijo');
        const osDone = osTasks.filter((t) => t.actualFinish && t.actualFinish <= at).length;
        if (osRow.avance !== round1(osDone / osTasks.length * 100) || !has(osRow.observaciones, '(' + osDone + ' de ' + osTasks.length + ')')) bad.push('avance de las órdenes de servicio ' + osRow.avance);
        if (subRow.avance !== round1(actualsOf('sub', at).length / subMonths * 100)) bad.push('avance de la suscripción ' + subRow.avance);
        ok(!bad.length, 'seguimiento (' + name + '): ejecutado, pagado a ' + payDays + ' días y retención del ' + ret * 100 + ' % desde los costos reales a la fecha de corte de cada fila; avance y calificaciones', bad);
        /* regresión: conciliación de la formación y de la capacitación con el SOW y con las asignaciones del cronograma */
        const fForm = actualsOf('impl', at).find((a) => a.taskId === 't21'), fCap = actualsOf('impl', at).find((a) => a.taskId === 't22');
        const hForm = 40, hCap = sum((task('t22').resources || []).filter((a) => { const it = cat.resolve(a); return it && it.supplier === 'Socio implementador'; }), (a) => PM.res.assignment(cat, task('t22'), a).qty * 8);
        ok(fForm && fCap && has(osRow.observaciones, fForm.document + ') incluyó las ' + hForm + ' horas (' + ms(hForm * rate) + ') y los materiales del curso (' + ms(fForm.amount - hForm * rate) + ')') && has(osRow.observaciones, fCap.document + ', seis grupos) se facturó por ' + ms(fCap.amount) + ': ' + n1(fCap.amount / rate) + ' horas') && has(osRow.observaciones, 'frente a las ' + hCap + ' de la asignación del cronograma'), 'seguimiento (' + name + '): las órdenes de la formación y de la capacitación se concilian con el SOW y el cronograma (materiales y mayor consumo)', osRow.observaciones);
        /* regresión (revisión cruzada): el SOW manda que la orden de cada release fije las horas por grupo; la del release 1 las fijó y
           la factura cabe en ellas (no «faltaba fijarlas») */
        const ordHours = SUP.gruposCapacitacion * SUP.horasGrupo;
        ok(fCap && fCap.amount / rate <= ordHours && has(osRow.observaciones, 'dentro de las ' + ordHours + ' de su orden de servicio') && !/pidió fijar las horas por grupo/.test(osRow.observaciones), 'seguimiento (' + name + '): la capacitación del release 1 se factura dentro de las horas de su orden de servicio, como exige el SOW', osRow.observaciones);
      }
      const implRow = f.seguimiento.find((x) => x.contrato.startsWith(NUM.impl));
      const liqTxt = new RegExp('Liquidados el ' + plain(PM.fmt.date(c0, 'long')) + ', con la evaluación final: ');
      ok(liqTxt.test(plain(f.cierre)) && /Liquidados con esta evaluación: /.test(f0.cierre) && /pago de todas sus facturas/.test(f.cierre), 'seguimiento: el cierre fecha la liquidación de los contratos terminados con la evaluación final de la rev. 0');
      ok(implRow.retencion === Math.round(ret * tot(actualsOf('impl', cut).filter((a) => a.releaseId === 'rel-2' && /precio fijo por iteración/.test(a.description)))) && implRow.retencion > 0 && f0.seguimiento.find((x) => x.contrato.startsWith(NUM.impl)).retencion === 0, 'seguimiento: retención de las iteraciones del release 2 (el release 1 ya aceptado la liberó)');
      const vel = C.velocity({ sprints, items, settings: st });
      const closedVel = vel.rows.filter((r) => r.status === 'cerrado').map((r) => r.completed);
      const r2 = rel('rel-2'), r1 = rel('rel-1');
      const r2evm = C.agileEvm({ release: r2, sprints, items, settings: st, actualCost: A.releaseActualCost(r2, costs, tree, cut), statusDate: cut });
      const r1ac = A.releaseActualCost(r1, costs, tree, c0);
      ok(has(implRow.observaciones, closedVel.slice(0, -1).join(', ') + ' y ' + closedVel[closedVel.length - 1] + ' puntos') && has(implRow.observaciones, 'CPI de ' + ix(r2evm.cpi)) && has(implRow.observaciones, 'CPI del release ' + ix(r1.budget / r1ac)) && /HU-033/.test(implRow.observaciones), 'seguimiento: velocidades, AgileEVM de los releases y HU-033 rechazada, calculados con la aplicación', implRow.observaciones);
      const avg = col('control-adquisiciones', 'seguimiento', 'calificacion').calc;
      ok(f.seguimiento.every((r) => { const a = avg(r, f.seguimiento); const xs = [r.plazo, r.calidad, r.sst].filter((x) => x !== null); return Math.abs(a - sum(xs, (x) => x) / xs.length) < 0.06; }), 'seguimiento: calificación calculada por la plantilla (promedio de plazo, calidad y SST)');
      const inc = docOf('registro-incidentes').fields.incidentes;
      const inc2 = inc.find((x) => x.id === 'INC-002'), inc1 = inc.find((x) => x.id === 'INC-001');
      const rc = (v, k) => v.reclamaciones.find((x) => x.contrato === NUM[k]);
      const paso = docOf('informe-desempeno--corte-2026-10-09').fields.proximosPasos.find((p) => /aviso automático/.test(p.accion));
      ok(rc(f, 'fe') && rc(f, 'fe').fecha === inc2.fecha && rc(f, 'fe').estado === 'En negociación' && has(rc(f, 'fe').solucion, PM.fmt.date(paso.fecha, 'long')) && rc(f, 'eq').fecha === inc1.fecha && rc(f, 'eq').estado === 'Resuelta' && !rc(f0, 'fe') && rc(f0, 'eq'), 'seguimiento: reclamaciones con las fechas de INC-001 e INC-002 y el próximo paso del informe de desempeño; la del proveedor tecnológico no está en la rev. 0');
      ok(f.reclamaciones.every((x) => x.fecha <= cut) && f0.reclamaciones.every((x) => x.fecha <= c0), 'seguimiento: ninguna reclamación posterior a su revisión');
      /* regresión (revisión cruzada): las tabletas se instalaron antes de la iteración 2 (no «mientras llegaban» en ella) y el reclamo
         formal al proveedor tecnológico es el del comité quincenal (jueves anterior al corte del informe), con el crédito de servicio */
      const t14f = task('t14').actualFinish, it2s = sprints[1].start;
      const reclamo = D.add(docOf('informe-desempeno--corte-2026-10-09').fields.fechaCorte, -1);
      ok(t14f < it2s && has(rc(f, 'eq').solucion, PM.fmt.date(t14f, 'long')) && /antes de la iteración 2/.test(rc(f, 'eq').solucion) && !/mientras llegaban/.test(text(cur('registro-adquisiciones'))) && has(rc(f, 'fe').solucion, PM.fmt.date(reclamo, 'long') + ' se le envió el reclamo formal') && /crédito de servicio/.test(rc(f, 'fe').solucion), 'seguimiento: tabletas instaladas antes de la iteración 2 y reclamo formal al proveedor tecnológico del ' + reclamo + ' con aviso automático y crédito de servicio', [rc(f, 'eq').solucion, rc(f, 'fe').solucion]);
      const regCom = docOf('registro-comunicaciones');
      if (regCom) { const c = regCom.fields.comunicaciones.find((x) => x.referencia === 'INC-002'); ok(c && c.fecha === reclamo && /crédito de servicio/.test(c.asunto), 'seguimiento y registro de comunicaciones (si está cargado): el mismo reclamo formal, con la misma fecha y el crédito de servicio', c); }
    }
    ok(MINE.every((id) => PM.docApproach && PM.docApproach(id) && PM.docApproach(id).id === 'ambos'), 'los siete documentos de adquisiciones son de «Ambos enfoques» (11-doc-approach)');
    return out;
  }, { MINE, SOWS, DOC_IDS });
}

/* ============================================================== ejecución */
section('Datos y cifras de los documentos de adquisiciones (' + file + ')');
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
  const focusLink = async (name, max = 50) => {
    for (let k = 0; k < max; k++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate((name) => { const a = document.activeElement; return !!a && a.classList.contains('docs-link') && a.textContent.trim() === name; }, name)) return true;
    }
    return false;
  };
  /* texto del editor con los valores de los campos (los documentos en revisión se editan: sus valores están en controles) */
  const docText = (id) => page.evaluate((id) => { const root = document.querySelector('.page[data-doc-id="' + id + '"]'); if (!root) return ''; const vals = [...root.querySelectorAll('input, textarea, select')].map((e) => (e.tagName === 'SELECT' ? (e.selectedOptions[0] || {}).textContent || '' : e.value)); return root.innerText + '\n' + vals.join('\n'); }, id).then(norm);
  const valueOf = (id, label) => page.evaluate(({ id, label }) => { const el = [...document.querySelectorAll('.page[data-doc-id="' + id + '"] input, .page[data-doc-id="' + id + '"] textarea, .page[data-doc-id="' + id + '"] select')].find((e) => e.getAttribute('aria-label') === label); return el ? el.value : null; }, { id, label });
  const ringOk = () => page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; });
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
    /* riel: «Documentos» */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForFunction(() => PM.getState().view === 'documentos', null, { timeout: 8000 });
    await page.waitForSelector('tr[data-doc]', { timeout: 10000 });
    /* filtro «Enfoque de la metodología» (si la lista lo ofrece): «Ambos enfoques» deja ver los siete documentos */
    const apSel = page.getByLabel('Filtrar por enfoque de la metodología');
    if (await apSel.count()) {
      await apSel.focus();
      await apSel.selectOption('ambos');
      await page.waitForTimeout(400);
      const aps = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc], tr.docs-parent')].map((tr) => tr.getAttribute('data-approach')));
      check(aps.length > 0 && aps.every((a) => a === 'ambos'), 'filtro por enfoque «Ambos enfoques»: todas las filas son de ambos enfoques', [...new Set(aps)]);
    }
    const rowsInfo = await page.evaluate(() => [...document.querySelectorAll('tr[data-doc]')].map((tr) => ({ key: tr.getAttribute('data-doc'), ap: tr.getAttribute('data-approach'), name: (tr.querySelector('.docs-link') || {}).textContent || '', code: (tr.querySelector('.docs-c-code') || {}).textContent || '', status: (tr.querySelector('.docs-c-status') || {}).textContent || '', rev: (tr.querySelector('.docs-c-rev') || {}).textContent || '' })));
    const want = {
      'plan-gestion-adquisiciones': ['PGAD', 'Aprobado', '1'], 'estrategia-adquisiciones': ['EADQ', 'Aprobado', '0'], 'decisiones-hacer-comprar': ['HOC', 'Aprobado', '1'],
      'criterios-seleccion-proveedores': ['CSP', 'Aprobado', '1'], 'registro-adquisiciones': ['RADQ', 'En revisión', '2A'], 'control-adquisiciones': ['CADQ', 'En revisión', '1A'],
      /* consecutivo por fecha de creación de cada enunciado (94 ordena las instancias así): implementación y suscripción
         del 21 de mayo, equipos del 10 de junio y facturación electrónica del 28 de julio */
      'enunciado-trabajo-adquisicion--sow-implementacion': ['SOW-01', 'Aprobado', '1'], 'enunciado-trabajo-adquisicion--sow-suscripcion': ['SOW-02', 'Aprobado', '1'],
      'enunciado-trabajo-adquisicion--sow-equipos': ['SOW-03', 'Aprobado', '0'], 'enunciado-trabajo-adquisicion--sow-facturacion': ['SOW-04', 'Aprobado', '0'],
    };
    const rowBad = Object.entries(want).filter(([key, [ab, stt, rv]]) => { const r = rowsInfo.find((x) => x.key === key); return !r || !norm(r.code).includes('PRY-2026-021-' + ab) || !norm(r.status).includes(stt) || !norm(r.rev).trim().endsWith(rv) || (r.ap !== null && r.ap !== 'ambos'); });
    check(!rowBad.length, 'lista maestra: los diez documentos con código, estado y revisión (y enfoque «ambos» si la columna existe)', rowBad.map(([k]) => [k, rowsInfo.find((x) => x.key === k)]));
    if (shots) await page.screenshot({ path: shots + '/documentos.png', fullPage: false });
    /* teclado: buscar y abrir el registro de contratos con Tab y Enter */
    const search = page.getByLabel('Buscar documentos');
    await search.click();
    await page.keyboard.type('contratos');
    await page.waitForTimeout(400);
    check(await focusLink('Registro de contratos y acuerdos'), 'con Tab el foco llega al enlace «Registro de contratos y acuerdos» de la lista filtrada');
    check(await ringOk(), 'el enlace enfocado muestra el foco visible');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="registro-adquisiciones"] [data-section]', { timeout: 10000 });
    const reg = await docText('registro-adquisiciones');
    const implRow = (await page.evaluate(() => [...document.querySelectorAll('.page[data-doc-id="registro-adquisiciones"] input')].find((e) => e.value === 'CT-2026-008').getAttribute('aria-label'))).replace(/^.*— /, '');
    check(/PRY-2026-021-RADQ/.test(reg) && /En revisión/.test(reg) && /Socio implementador/.test(reg) && /FP-EPA/.test(reg) && (await valueOf('registro-adquisiciones', 'Valor — ' + implRow)) === '231.800.000' && (await valueOf('registro-adquisiciones', 'Estado — ' + implRow)) === 'En ejecución', 'el registro de contratos abre con Enter: código, estado, contrato del implementador con su valor ($ 231.800.000) y orden de compra FP-EPA', implRow);
    check(!(await errorCards(page)).length, 'el registro de contratos abre sin tarjetas de error');
    if (shots) await page.screenshot({ path: shots + '/registro-adquisiciones.png', fullPage: true });
    /* enunciado del trabajo de la implementación: instancia de una plantilla múltiple, con el teclado */
    await page.locator('button.nav-item', { hasText: 'Documentos' }).first().click();
    await page.waitForSelector('tr[data-doc]', { timeout: 8000 });
    await page.getByLabel('Buscar documentos').fill('');
    await page.getByLabel('Buscar documentos').click();
    await page.keyboard.type('Enunciado del trabajo');
    await page.waitForTimeout(400);
    const sowName = 'Enunciado del trabajo — Implementación del ERP por iteraciones de precio fijo';
    check(await focusLink(sowName), 'con Tab el foco llega al enunciado del trabajo de la implementación');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="enunciado-trabajo-adquisicion--sow-implementacion"] [data-section]', { timeout: 10000 });
    const sow = norm(await page.locator('.page[data-doc-id="enunciado-trabajo-adquisicion--sow-implementacion"]').innerText());
    check(/PRY-2026-021-SOW-01/.test(sow) && /240 horas por iteración/.test(sow) && /Aprobado/.test(sow) && /definición de terminado/.test(sow) && /Crear nueva revisión/.test(sow), 'el enunciado del trabajo abre con Enter: equipo de 240 horas, definición de terminado y bloqueo del aprobado');
    if (shots) await page.screenshot({ path: shots + '/sow-implementacion.png', fullPage: true });
    /* columnas calculadas en el editor: ponderados de los criterios y calificación del seguimiento */
    await page.evaluate(() => PM.openDocument('criterios-seleccion-proveedores'));
    await page.waitForSelector('.page[data-doc-id="criterios-seleccion-proveedores"] [data-section]', { timeout: 10000 });
    const crit = norm(await page.locator('.page[data-doc-id="criterios-seleccion-proveedores"]').innerText());
    check(/Ponderado B/.test(crit) && /32,2/.test(crit) && /90,2/.test(crit) && /Oferente B/.test(crit), 'criterios de selección: ponderados calculados por la plantilla (35 % × 92 = 32,2) y total del oferente B');
    await page.evaluate(() => PM.openDocument('control-adquisiciones'));
    await page.waitForSelector('.page[data-doc-id="control-adquisiciones"] [data-section]', { timeout: 10000 });
    const ctl = await docText('control-adquisiciones');
    const calif = await page.evaluate(() => { const t = [...document.querySelectorAll('.page[data-doc-id="control-adquisiciones"] table')].find((x) => /Calificación/.test(x.textContent)); const r = t && t.querySelector('tbody tr'); return r ? r.textContent : ''; });
    check(/PRY-2026-021-CADQ/.test(ctl) && /4,3/.test(norm(calif)) && /En negociación/.test(ctl) && (await valueOf('control-adquisiciones', 'Retención en garantía — fila 1')) === '1.980.000', 'seguimiento de contratos: calificación promedio del implementador calculada (4,3), reclamación en negociación y retención de $ 1.980.000', calif.slice(0, 200));
    if (shots) await page.screenshot({ path: shots + '/control-adquisiciones.png', fullPage: true });
    check(!(await errorCards(page)).length && !errors.length, 'sin tarjetas de error ni errores de consola', errors);
  } finally { await app.browser.close(); }
}

if (!quick) {
  for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: '400 px' }, { dark: true, width: 400, name: '400 px oscuro' }, { dark: false, width: 1920, name: '1920 px' }]) {
    section('Documentos de adquisiciones en ' + variant.name);
    const app = await openApp({ file, width: variant.width, height: 900, dark: variant.dark });
    try {
      const pid = await createExample(app.page, 'erp');
      await app.page.waitForTimeout(600);
      check(!!pid, 'ejemplo creado');
      const bad = [];
      for (const id of DOC_IDS) {
        await app.page.evaluate((id) => PM.openDocument(id), id);
        await app.page.waitForSelector('.page[data-doc-id="' + id + '"] [data-section]', { timeout: 10000 });
        await app.page.waitForTimeout(250);
        const ov = await horizontalOverflow(app.page);
        const cardsErr = await errorCards(app.page);
        const w = variant.width === 1920 ? await app.page.evaluate(() => document.querySelector('.page').getBoundingClientRect().width) : null;
        if (ov > 1 || cardsErr.length || (w !== null && w < 1400)) bad.push({ id, ov, cards: cardsErr.length, w });
        if (shots && (id === 'registro-adquisiciones' || id === 'control-adquisiciones' || id === 'criterios-seleccion-proveedores')) await app.page.screenshot({ path: shots + '/' + id + '-' + variant.name.replace(/\W+/g, '-') + '.png', fullPage: false });
      }
      await gotoView(app.page, 'documentos');
      await app.page.waitForTimeout(300);
      const ovList = await horizontalOverflow(app.page);
      if (ovList > 1) bad.push({ id: 'documentos', ov: ovList });
      check(!bad.length, 'editor de los diez documentos y lista sin desborde de página ni tarjetas de error' + (variant.width === 1920 ? ', a todo el ancho' : ''), bad);
      check(!app.errors.length, 'sin errores de consola', app.errors);
    } finally { await app.browser.close(); }
  }
}

console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

// Prueba del proyecto de ejemplo «Edificio Atalaya del Occidente» (src/91-example-medellin.js).
// Uso: node test/example-medellin.test.mjs [--file <página.html>] [--model <model.json>] [--shots dir]
//   Sin --file construye una página completa (todos los módulos) en el directorio temporal.
//   --model: model.json del ejemplo; si se pasa, las cifras de la prueba se contrastan con él.
//   1) Constructor: forma de los datos, ids, EDT, cronograma (CPM), costos y razones realistas, líneas base,
//      valor ganado, RACI, calidad y diagramas de flujo, después de importarlo con PM.projectOps.importData.
//   2) Documentos: contrato de PM.exampleDocs.medellin con entradas de prueba (singleton, múltiple y revisiones).
//   3) Selector de ejemplos del portafolio («Crear proyecto de ejemplo» → tarjeta de Medellín).
//   4) Todas las vistas con el ejemplo, sin tarjetas de error ni errores de consola (1360 px y 400 px).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { openApp, root, errorCards, horizontalOverflow, gotoView } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });
let file = opt('--file');
if (!file) {
  const dir = join(tmpdir(), 'gestor-pmbok-medellin-test'); mkdirSync(dir, { recursive: true });
  file = join(dir, 'app.html');
  execFileSync(process.execPath, [join(root, 'build.mjs'), '--out', file], { stdio: 'pipe' });
}
file = resolve(file);

/* Cifras del modelo (millones de COP salvo indicación); con --model se verifican contra model.json. */
const M = 1e6;
const EXPECT = {
  ventas: 162122 * M, lote: 15000 * M, vip: 3000 * M, directosLb0: 94080 * M, directos: 94510 * M, indirectos: 20062 * M, financieros: 7004 * M,
  bacLb0: 139146 * M, bac: 139576 * M, bacVigente: 140176 * M, costoTotal: 141939 * M, contLb0: 2793 * M, contLb1: 2363 * M, contVigente: 1763 * M, gestion: 1400 * M, presupuesto: 143339 * M,
  e1: 47024 * M, e2: 47486 * M, areaVendible: 24736, areaConstruida: 39385, start: '2025-01-13', end: '2029-03-28', forecastEnd: '2029-06-29', statusDate: '2026-09-30',
  lb0Date: '2025-04-22', lb1Date: '2026-03-13',
  rangos: { loteSobreVentasPct: [3, 15], directosSobreVentasPct: [52, 62], indirectosSobreVentasPct: [11, 16], financierosSobreVentasPct: [3, 8], utilidadSobreVentasPct: [8, 15], directosPorM2Construido: [1900000, 2600000], directosPorM2Vendible: [3000000, 4500000], spi: [0.92, 1.0], cpi: [0.95, 1.02] },
};
let model = null;
const modelPath = opt('--model');
if (modelPath) {
  if (!existsSync(modelPath)) { console.error('No existe ' + modelPath); process.exit(2); }
  model = JSON.parse(readFileSync(modelPath, 'utf8'));
}

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; return true; } failures++; console.log('  FALLA: ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 500) : '')); return false; };
const section = (t) => console.log('\n• ' + t);
const report = (res) => {
  for (const c of res.checks) { if (c.ok) passes++; else { failures++; console.log('  FALLA: ' + c.msg + (c.extra !== undefined ? ' → ' + JSON.stringify(c.extra).slice(0, 600) : '')); } }
  console.log(`  ${res.checks.filter((c) => c.ok).length}/${res.checks.length} verificaciones`);
};

/* ------------------------------------------------------------------ 0) cifras contra model.json */
if (model) {
  section('Cifras de la prueba contra model.json');
  const p = model.presupuesto;
  check(p.lb0.bac === EXPECT.bacLb0 && p.lb1.bac === EXPECT.bac && p.vigente.bac === EXPECT.bacVigente, 'BAC de LB0, LB1 y vigente', [p.lb0.bac, p.lb1.bac, p.vigente.bac]);
  check(p.lb0.contingencia === EXPECT.contLb0 && p.lb1.contingencia === EXPECT.contLb1 && p.vigente.contingenciaDisponible === EXPECT.contVigente && p.lb1.gestion === EXPECT.gestion, 'reservas');
  check(p.lb1.lineaBaseCostos === EXPECT.costoTotal && p.lb1.presupuestoTotal === EXPECT.presupuesto && model.pyg.lb1.costoTotal === EXPECT.costoTotal, 'línea base de costos = costo total de la factibilidad');
  check(model.lote.precio_lote === EXPECT.lote && model.producto.ventasPorTipo.total === EXPECT.ventas, 'lote y ventas');
  check(model.proyecto.inicio === EXPECT.start && model.proyecto.finLineaBase === EXPECT.end && model.proyecto.finPronosticado === EXPECT.forecastEnd && model.proyecto.fechaCorte === EXPECT.statusDate, 'fechas del proyecto');
  for (const [k, v] of Object.entries(model.indicadores.rangosRealistas)) check(JSON.stringify(v) === JSON.stringify(EXPECT.rangos[k]), 'rango ' + k);
  check(model.costosDirectos.porEtapaLb1.E1 === EXPECT.e1 && model.costosDirectos.porEtapaLb1.E2 === EXPECT.e2, 'directos por etapa');
  check(model.costosDirectos.capitulos.some((c) => c.id === 'hon') && model.costosDirectos.honorariosConstructor && model.costosDirectos.honorariosConstructor.tasaSobreReembolsables === 0.05, 'capítulo de honorarios del constructor en el modelo');
  EXPECT.modelChapters = model.costosDirectos.capitulos.map((c) => [c.id, c.valorLb1]);
  EXPECT.modelEvm = [model.valorGanado.pv, model.valorGanado.ev, model.valorGanado.ac];
  console.log(`  ${passes} verificaciones`);
}

/* ------------------------------------------------------------------ 1) constructor e importación */
async function validateInPage(page, expect) {
  return page.evaluate(async (X) => {
    const out = { checks: [] };
    const ok = (cond, msg, extra) => out.checks.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const D = PM.date;
    const ex = PM.getExample('medellin');
    ok(ex && ex.icon === 'portfolio' && ex.name === 'Edificio residencial en Medellín' && /\S/.test(ex.description || '') && Array.isArray(ex.summary) && ex.summary.length === 3, 'registro del ejemplo (id, icono, nombre, descripción, tres chips)', ex && { ...ex, build: undefined, facts: undefined });
    ok(PM.getExample('andamio'), 'el ejemplo del andamio sigue registrado');
    const data = ex.build({ today: PM.date.today() });
    ok(JSON.stringify(data) === JSON.stringify(ex.build({ today: '2031-01-01' })), 'el constructor es determinista');
    ok(data.format === 'gestor-pmbok' && data.version === 1 && data.project && data.collections, 'formato de exportación');
    ok(['docs', 'tools', 'baselines', 'flows'].every((k) => Array.isArray(data.collections[k])), 'colecciones docs, tools, baselines y flows');
    const sizes = [];
    for (const [name, items] of Object.entries(data.collections)) for (const it of items) { sizes.push([name + '/' + it.id, new TextEncoder().encode(JSON.stringify(it.data)).length]); for (const r of it.revs || []) sizes.push([name + '/' + it.id + '/revs/' + r.id, new TextEncoder().encode(JSON.stringify(r.data)).length]); }
    ok(sizes.every(([, n]) => n <= 200 * 1024), 'cada documento pesa menos de 200 KiB (límite 256)', sizes.filter(([, n]) => n > 200 * 1024));
    const f = ex.facts();
    ok(f.lagWarnings.length === 0, 'sin desfases negativos al derivar las dependencias', f.lagWarnings);

    const pid = await PM.projectOps.importData(data);
    const P = (p) => PM.store.get(PM.paths.project(pid) + p);
    const meta = await PM.store.get(PM.paths.project(pid));
    ok(/^EJEMPLO · /.test(meta.name) && /Medellín/.test(meta.name) && meta.code === 'PRY-2025-003', 'nombre y código', [meta.name, meta.code]);
    ok(/\(ficticia\)/.test(meta.client) && meta.sponsor === 'Junta directiva del promotor' && meta.manager === 'Gerente de proyecto', 'cliente ficticio, patrocinador y gerente por rol');
    ok(meta.start === X.start && meta.end === X.end && meta.statusDate === X.statusDate && meta.currency === 'COP', 'fechas y moneda', [meta.start, meta.end, meta.statusDate]);
    ok(meta.status === 'En ejecución' && PM.PROJECT_STATUS.includes(meta.status) && PM.LIFECYCLES.includes(meta.lifecycle), 'estado y ciclo de vida');
    ok(meta.budget === X.presupuesto, 'presupuesto = línea base de costos + reserva de gestión', meta.budget);
    ok(/Medellín/.test(meta.location) && /50\.000 m²/.test(meta.description) && /Acuerdo 48 de 2014/.test(meta.description), 'ubicación y descripción con lote y norma');

    /* EDT */
    const wbs = await P('/tools/wbs');
    const nodes = wbs.nodes;
    const ids = new Set(nodes.map((n) => n.id));
    ok(ids.size === nodes.length, 'ids únicos en la EDT');
    const l1 = nodes.filter((n) => !n.parentId).sort((a, b) => a.order - b.order);
    ok(l1.map((n) => n.name).join('|') === 'Gerencia del proyecto|Estructuración técnica, legal y financiera|Diseños y licencias|Comercialización y ventas|Construcción|Entrega, escrituración y cierre', 'seis entregables de nivel 1', l1.map((n) => n.name));
    ok(nodes.length >= 40 && nodes.length <= 70, 'EDT de 40 a 70 elementos', nodes.length);
    const NK = ['id', 'parentId', 'name', 'order', 'description', 'responsible', 'deliverable', 'acceptance', 'costEstimate', 'notes', 'kind'];
    ok(nodes.every((n) => NK.every((k) => k in n) && String(n.description).length > 30 && n.responsible && n.deliverable && n.acceptance && ['entregable', 'cuenta-control', 'paquete'].includes(n.kind)), 'diccionario de la EDT completo', nodes.find((n) => !(NK.every((k) => k in n) && String(n.description).length > 30)));
    ok(nodes.every((n) => !n.parentId || ids.has(n.parentId)), 'padres de la EDT existen');
    const tree = PM.calc.wbsTree(nodes);
    ok(nodes.every((n) => (tree.leaves.has(n.id) ? n.kind === 'paquete' && n.costEstimate >= 0 : n.kind !== 'paquete' && n.costEstimate === null)), 'paquetes en las hojas con costo estimado');

    /* cronograma */
    const schedule = await P('/tools/schedule');
    const tasks = schedule.tasks;
    ok(schedule.settings.workweek === 6 && schedule.settings.holidaysCO === true && Array.isArray(schedule.settings.extraHolidays) && Object.keys(schedule.settings.resourceLimits || {}).length >= 10, 'calendario L-S con festivos y límites de recursos');
    ok(tasks.length >= 100 && tasks.length <= 160, 'de 100 a 160 actividades', tasks.length);
    const tids = new Set(tasks.map((t) => t.id));
    ok(tids.size === tasks.length, 'ids únicos de actividades');
    const TK = ['id', 'name', 'wbsId', 'duration', 'milestone', 'start', 'deps', 'progress', 'cost', 'resources', 'responsible', 'actualStart', 'actualFinish', 'notes'];
    ok(tasks.every((t) => TK.every((k) => k in t)), 'forma de Task (SPEC §3)', tasks.find((t) => !TK.every((k) => k in t)));
    ok(tasks.every((t) => t.wbsId && ids.has(t.wbsId) && tree.leaves.has(t.wbsId)), 'toda actividad cuelga de un paquete de trabajo existente', tasks.filter((t) => !tree.leaves.has(t.wbsId)).map((t) => t.id));
    ok(tasks.every((t) => t.deps.every((d) => tids.has(d.id) && d.id !== t.id && ['FS', 'SS', 'FF', 'SF'].includes(d.type) && Number.isInteger(d.lag))), 'toda dependencia apunta a una actividad existente');
    ok(tasks.every((t) => t.responsible && t.resources.every((r) => r.name && r.units > 0 && schedule.settings.resourceLimits[r.name])), 'responsables y recursos con límite definido');
    /* ningún recurso supera su límite diario, ni en el plan ni en el pronóstico al corte (vista Recursos sin sobreasignaciones) */
    for (const [lbl, sd] of [['plan vigente', undefined], ['pronóstico al corte', meta.statusDate]]) {
      const s = PM.calc.computeSchedule(schedule, meta.start, sd);
      const daily = new Map(); const over = [];
      for (const t of s.tasks) { if (t.milestone || t.duration <= 0) continue; for (const r of t.resources || []) for (let i = t.es; i < t.ef; i++) { const k = r.name + '|' + s.cal.dateOf(i); daily.set(k, (daily.get(k) || 0) + r.units); } }
      for (const [k, v] of daily) { const n = k.split('|')[0]; if (v > schedule.settings.resourceLimits[n] + 1e-9) over.push(k + ' = ' + v); }
      ok(!over.length, 'sin sobreasignación de recursos (' + lbl + ')', over.slice(0, 5));
    }
    const types = new Set(tasks.flatMap((t) => t.deps.map((d) => d.type)));
    ok(['FS', 'SS', 'FF'].every((x) => types.has(x)) && tasks.some((t) => t.deps.some((d) => d.lag > 0)), 'dependencias FS, SS y FF con desfases');
    const ms = tasks.filter((t) => t.milestone);
    for (const re of [/^Promesa de compraventa del lote/, /^Escritura del lote/, /^Factibilidad aprobada/, /^Licencia de urbanización y construcción ejecutoriada/, /^Lanzamiento de la etapa 1/, /^Punto de equilibrio de la etapa 1/, /^Giro de los recursos del encargo/, /^Acta de inicio de obra de la etapa 1/, /^Fin de la estructura del bloque A/, /^Fin de la estructura del bloque D/, /^Certificado técnico de ocupación de la etapa 1/, /^Certificado técnico de ocupación de la etapa 2/, /^Fideicomiso y crédito constructor liquidados/, /^Acta de cierre del proyecto/]) ok(ms.some((t) => re.test(t.name) && t.duration === 0), 'hito ' + re.source);
    ok(tasks.some((t) => /^Entregas de vivienda de la etapa 1/.test(t.name)) && tasks.some((t) => /^Entregas de vivienda de la etapa 2/.test(t.name)), 'entregas de vivienda por etapa');
    const sched = PM.calc.computeSchedule(schedule, meta.start);
    const fc = PM.calc.computeSchedule(schedule, meta.start, meta.statusDate);
    ok(sched.errors.length === 0 && fc.errors.length === 0, 'sin ciclos ni errores en el CPM', sched.errors);
    ok(sched.start === X.start, 'inicio calculado', sched.start);
    ok(fc.finish === X.forecastEnd && sched.finish === X.forecastEnd, 'fin pronosticado al corte = ' + X.forecastEnd, [sched.finish, fc.finish]);
    ok(fc.criticalIds.size > 5 && [...fc.criticalIds].every((id) => !/^G0[56]$/.test(id)), 'ruta crítica sin esfuerzos de nivel', [...fc.criticalIds]);
    const st = meta.statusDate;
    ok(tasks.filter((t) => t.progress >= 100).every((t) => D.valid(t.actualStart) && D.valid(t.actualFinish) && t.actualFinish <= st), 'actividades terminadas con fechas reales hasta el corte');
    ok(tasks.filter((t) => t.progress > 0 && t.progress < 100).every((t) => !t.milestone && D.valid(t.actualStart) && t.actualStart <= st && !t.actualFinish), 'actividades en curso con inicio real y sin fin real');
    ok(tasks.filter((t) => t.progress === 0).every((t) => !t.actualStart && sched.byId.get(t.id).startDate > st), 'las actividades sin avance empiezan después del corte', tasks.filter((t) => t.progress === 0 && sched.byId.get(t.id).startDate <= st).map((t) => t.id));
    const byName = (re) => tasks.find((t) => re.test(t.name));
    ok(['Debida diligencia', 'Factibilidad técnica', 'Proyecto arquitectónico', 'Diseño estructural', 'Trámite de la licencia', 'Preventas de la etapa 1', 'Preliminares de la etapa 1', 'Movimiento de tierras, contención', 'Pilas pre-excavadas de la etapa 1', 'Estructura de la plataforma de parqueaderos de la etapa 1'].every((s) => byName(new RegExp('^' + s)).progress === 100), 'estructuración, diseños, licencia, preventas de la etapa 1 y cimentación terminadas');
    ok(byName(/^Estructura del bloque A/).progress === 75 && byName(/^Estructura del bloque B/).progress > 0 && byName(/^Estructura del bloque B/).progress < 50, 'estructura del bloque A al 75 % y bloque B en curso');
    ok(tasks.filter((t) => /etapa 2/.test(t.name) && /^(Pilas|Estructura|Movimiento)/.test(t.name)).every((t) => t.progress === 0), 'obra de la etapa 2 sin iniciar');

    /* costos */
    const fact = Object.fromEntries(f.tasks.map((t) => [t.id, t]));
    const sum = (list) => list.reduce((s, t) => s + t.cost, 0);
    const byK = (k) => tasks.filter((t) => fact[t.id].k === k);
    ok(sum(tasks) === X.bacVigente, 'suma de los costos de las actividades = BAC vigente', sum(tasks));
    ok(Math.abs(sum(tasks) - X.bac) / X.bac <= 0.005, 'BAC vigente dentro de ±0,5 % del BAC de la LB1 (costo total sin utilidad ni reservas)');
    ok(sum(byK('lote')) === X.lote && byK('lote').length === 2, 'costo del lote = COP 15.000 millones (promesa y escritura)', sum(byK('lote')));
    ok(sum(byK('vip')) === X.vip, 'compensación VIP', sum(byK('vip')));
    ok(sum(byK('ind')) === X.indirectos && sum(byK('fin')) === X.financieros, 'indirectos y financieros', [sum(byK('ind')), sum(byK('fin'))]);
    const dirLb1 = byK('dir').filter((t) => fact[t.id].inLb1);
    ok(sum(dirLb1) === X.directos && sum(byK('dir')) === X.directos + (X.contLb1 - X.contVigente), 'directos de la LB1 y vigentes (con la contención del CC-003)', [sum(dirLb1), sum(byK('dir'))]);
    ok(sum(dirLb1.filter((t) => fact[t.id].st === 'E1')) === X.e1 && sum(dirLb1.filter((t) => fact[t.id].st === 'E2')) === X.e2, 'directos por etapa', [sum(dirLb1.filter((t) => fact[t.id].st === 'E1')), sum(dirLb1.filter((t) => fact[t.id].st === 'E2'))]);
    /* capítulos: cada actividad de obra lleva su reparto; la suma por capítulo es el presupuesto del capítulo */
    const capSum = {};
    for (const t of dirLb1) { const cap = fact[t.id].cap; ok(cap && Object.values(cap).reduce((a, b) => a + b, 0) * 1e6 === t.cost, t.id + ': reparto por capítulos = costo'); for (const [c, v] of Object.entries(cap || {})) capSum[c] = (capSum[c] || 0) + v; }
    ok(f.chapters.every((c) => capSum[c.id] === c.value), 'suma por capítulo = presupuesto del capítulo', f.chapters.filter((c) => capSum[c.id] !== c.value).map((c) => [c.id, c.value, capSum[c.id]]));
    const shares = f.chapters.map((c) => (100 * c.value) / (X.directos / 1e6));
    ok(Math.abs(shares.reduce((a, b) => a + b, 0) - 100) < 1e-9 && f.chapters.find((c) => c.id === 'est').value / (X.directos / 1e6) > 0.2, 'participaciones de los capítulos suman 100 % (estructura > 20 %)');
    ok(f.indirects.reduce((s, i) => s + i.value, 0) * 1e6 === X.indirectos, 'rubros de indirectos suman el total');
    if (X.modelChapters) ok(X.modelChapters.length === f.chapters.length && X.modelChapters.every(([id, v]) => f.chapters.some((c) => c.id === id && c.value * 1e6 === v)), 'capítulos iguales a los de model.json', X.modelChapters);
    /* administración delegada: honorarios del constructor del 5 % sobre los reembolsables, dentro de cada actividad de obra */
    const chap = Object.fromEntries(f.chapters.map((c) => [c.id, c.value]));
    const dirM = X.directos / 1e6;
    ok(chap.hon && chap.hon / dirM >= 0.04 && chap.hon / dirM <= 0.065, 'capítulo de honorarios del constructor entre 4 y 6,5 % de los directos', chap.hon);
    ok((chap.adm + chap.hon) / dirM >= 0.09 && (chap.adm + chap.hon) / dirM <= 0.14, 'administración de obra más honorarios entre 9 y 14 % de los directos', [chap.adm, chap.hon]);
    const feeBad = dirLb1.filter((t) => { const cap = fact[t.id].cap || {}; const reimb = Object.entries(cap).filter(([k]) => k !== 'hon').reduce((a, [, v]) => a + v, 0); return !(cap.hon > 0 && Math.abs(cap.hon - 0.05 * reimb) <= 1); });
    ok(!feeBad.length, 'cada actividad de obra lleva el 5 % de honorarios sobre su costo reembolsable', feeBad.map((t) => [t.id, fact[t.id].cap]));
    /* gastos de cierre de la compra del lote: impuesto de registro (1 %), derechos de registro y notaría */
    const e07 = fact.E07;
    ok(e07 && e07.cost * 1e6 >= 0.012 * X.lote && e07.cost * 1e6 <= 0.025 * X.lote, 'registro de la compra del lote entre 1,2 y 2,5 % del precio (impuesto de registro del 1 % más derechos y notaría)', e07 && e07.cost);
    ok(f.indirects.find((i) => i.id === 'not').value === ['E07', 'C12', 'C13', 'Z03'].reduce((s, id) => s + (fact[id].capSplit ? fact[id].capSplit.not : fact[id].cost), 0), 'rubro de notariado y registro = E07 + C12 + C13 + Z03');
    /* trámite para anunciar y enajenar vivienda antes de las preventas */
    const enaj = tasks.find((t) => /anunciar y enajenar/.test(t.name));
    ok(enaj && /Ley 962 de 2005, art\. 71/.test(enaj.notes) && D.valid(enaj.actualFinish) && enaj.actualFinish < tasks.find((t) => /^Lanzamiento de la etapa 1/.test(t.name)).actualStart, 'radicación de documentos para anunciar y enajenar (Ley 962 de 2005) antes del lanzamiento', enaj && [enaj.name, enaj.actualFinish]);
    /* razones realistas */
    const R = X.rangos;
    const ratios = {
      loteSobreVentasPct: (100 * X.lote) / X.ventas, directosSobreVentasPct: (100 * X.directos) / X.ventas, indirectosSobreVentasPct: (100 * (X.indirectos + X.contLb1)) / X.ventas,
      financierosSobreVentasPct: (100 * X.financieros) / X.ventas, utilidadSobreVentasPct: (100 * (X.ventas - X.costoTotal)) / X.ventas,
      directosPorM2Construido: X.directos / X.areaConstruida, directosPorM2Vendible: X.directos / X.areaVendible,
    };
    for (const [k, v] of Object.entries(ratios)) ok(v >= R[k][0] && v <= R[k][1], 'razón ' + k + ' dentro del rango realista ' + R[k].join('–'), v);
    ok(X.costoTotal === X.lote + X.vip + X.directos + X.indirectos + X.contLb1 + X.financieros && X.bac + X.contLb1 === X.costoTotal, 'costo total = lote + VIP + directos + indirectos + imprevistos + financieros = BAC + contingencias');

    /* líneas base */
    const blDocs = await PM.store.list(PM.paths.baselines(pid));
    const lb0 = blDocs.find((b) => b.data.label === 'LB0'), lb1 = blDocs.find((b) => b.data.label === 'LB1');
    ok(blDocs.length === 2 && lb0 && lb1, 'dos líneas base');
    ok(lb0.data.number === 0 && lb0.data.date === X.lb0Date && lb0.data.includes.join() === 'scope,schedule,cost' && lb0.data.changeRef === null && lb0.data.byId === null, 'LB0 con la decisión de inversión');
    ok(lb1.data.number === 1 && lb1.data.date === X.lb1Date && lb1.data.includes.join() === 'scope,schedule,cost' && lb1.data.changeRef === 'CC-002' && /mitigación vial/i.test(lb1.data.note), 'LB1 con el CC-002');
    ok(lb0.data.cost.bac === X.bacLb0 && lb1.data.cost.bac === X.bac, 'BAC de las líneas base', [lb0.data.cost.bac, lb1.data.cost.bac]);
    ok(lb0.data.cost.contingency === X.contLb0 && lb1.data.cost.contingency === X.contLb1 && lb0.data.cost.management === X.gestion && lb1.data.cost.management === X.gestion, 'reservas de las líneas base');
    ok(lb0.data.cost.bac + lb0.data.cost.contingency === X.costoTotal && lb1.data.cost.bac + lb1.data.cost.contingency === X.costoTotal, 'línea base de costos = costo total en LB0 y LB1');
    ok(lb0.data.schedule.start === X.start && lb0.data.schedule.finish === X.end && lb1.data.schedule.finish === X.end, 'inicio y fin de las líneas base', [lb0.data.schedule.finish, lb1.data.schedule.finish]);
    ok(lb0.data.scope && lb0.data.scope.wbs.length === nodes.length && lb1.data.scope.wbs.length === nodes.length && [lb0, lb1].every((b) => b.data.scope.wbs.every((n) => !n.notes)), 'EDT en las líneas base, sin notas de seguimiento');
    const mit = (b) => b.data.scope.wbs.find((n) => n.id === 'w1531');
    ok(!/mitigación/i.test(mit(lb0).description) && /mitigación/i.test(mit(lb1).description), 'diccionario de 1.5.3.1 sin la mitigación vial en LB0 y con ella en LB1');
    ok(!lb0.data.schedule.tasks.some((t) => t.id === 'U02') && lb1.data.schedule.tasks.some((t) => t.id === 'U02') && !lb1.data.schedule.tasks.some((t) => t.id === 'K03C'), 'la mitigación vial entra en la LB1; la contención del CC-003 no está en ninguna línea base');
    /* la LB1 sale del CPM con las dependencias vigentes; ambas con duraciones en días hábiles */
    const idx = (d) => sched.cal.indexOf(d);
    for (const bl of [lb0, lb1]) {
      const bad = [];
      const bt = new Map(bl.data.schedule.tasks.map((t) => [t.id, t]));
      for (const t of bl.data.schedule.tasks) {
        if (!t.milestone && sched.cal.countWork(t.start, t.finish) !== t.duration) bad.push(t.id + ' duración');
        if (bl.data.label !== 'LB1') continue;
        for (const d of tasks.find((x) => x.id === t.id).deps) {
          const p = bt.get(d.id); if (!p) continue;
          if (p.milestone && p.start === X.start) continue;
          const ps = idx(p.start) + (p.milestone ? 1 : 0), pf = idx(p.finish) + 1, ts = idx(t.start) + (t.milestone ? 1 : 0), tf = idx(t.finish) + 1;
          if ((d.type === 'FS' && ts < pf + d.lag) || (d.type === 'SS' && ts < ps + d.lag) || (d.type === 'FF' && tf < pf + d.lag)) bad.push(t.id + ' ' + d.type + ' ' + d.id);
        }
      }
      ok(!bad.length, bl.data.label + ': cronograma coherente con el CPM', bad);
    }
    const b1 = new Map(lb1.data.schedule.tasks.map((t) => [t.id, t])), b0 = new Map(lb0.data.schedule.tasks.map((t) => [t.id, t]));
    ok(b0.get('K01').start === '2026-02-16' && b1.get('K01').start === '2026-03-16' && b1.get('C05').start === '2026-02-27' && b1.get('D13').start === '2025-12-15', 'reprogramación de la etapa 1 en la LB1 (inicio de obra del 16 de febrero al 16 de marzo de 2026)');
    const actives = PM.calc.activeBaselines(blDocs);
    ok(actives.cost.label === 'LB1' && actives.schedule.label === 'LB1' && actives.scope.label === 'LB1', 'líneas base activas: LB1');
    /* la LB0 (22 de abril de 2025) no cita hechos posteriores: Resolución 0194 de 2025 (23 de abril de 2025) ni el contrato CT-015 (13 de marzo de 2026) */
    const lb0Text = JSON.stringify([lb0.data.schedule.tasks.map((t) => t.name), lb0.data.scope]);
    ok(!/Resolución 0194 de 2025|CT-01[1-9]|CT-02\d|CC-00\d|INC-0\d\d/.test(lb0Text) && b0.get('D08').name === 'Diseño bioclimático (Resolución 0549 de 2015) y paisajístico' && /0194 de 2025/.test(b1.get('D08').name), 'LB0 sin hechos posteriores a su fecha (D08 con la Resolución 0549 de 2015; la 0194 de 2025 desde la LB1)', lb0Text.match(/Resolución 0194 de 2025|CT-0\d\d|CC-00\d|INC-0\d\d/g));

    /* costos reales, cortes y valor ganado */
    const costs = await P('/tools/costs');
    const CATS = ['Mano de obra', 'Equipos', 'Materiales', 'Transporte', 'Subcontratos', 'Otros'];
    ok(costs.actuals.length >= 100 && costs.actuals.length <= 600, 'costos reales mensuales', costs.actuals.length);
    ok(new Set(costs.actuals.map((a) => a.id)).size === costs.actuals.length, 'ids únicos de costos reales');
    ok(costs.actuals.every((a) => D.valid(a.date) && a.date <= st && a.amount > 0 && tids.has(a.taskId) && a.wbsId === tasks.find((t) => t.id === a.taskId).wbsId && CATS.includes(a.category) && a.description && /^[A-Z]{2,4}-/.test(a.document)), 'costos reales completos, con documento y hasta el corte', costs.actuals.find((a) => !(a.date <= st && tids.has(a.taskId) && CATS.includes(a.category))));
    ok(costs.actuals.every((a) => { const t = tasks.find((x) => x.id === a.taskId); return t.actualStart && a.date >= D.startOfMonth(t.actualStart) && t.progress > 0; }), 'cada costo real corresponde a una actividad iniciada');
    const acLote = costs.actuals.filter((a) => fact[a.taskId].k === 'lote').reduce((s, a) => s + a.amount, 0);
    ok(acLote === X.lote, 'costo real del lote = COP 15.000 millones', acLote);
    ok(costs.statusUpdates.length >= 20 && costs.statusUpdates[0].date === '2025-01-31' && costs.statusUpdates[costs.statusUpdates.length - 1].date === st, 'cortes mensuales desde enero de 2025 hasta el corte', costs.statusUpdates.map((u) => u.date));
    let prev = {}; let mono = true;
    for (const u of costs.statusUpdates) { for (const [k, v] of Object.entries(u.progress)) { if (!tids.has(k) || (prev[k] || 0) > v) mono = false; prev[k] = v; } }
    ok(mono && tasks.every((t) => (prev[t.id] || 0) === t.progress), 'el avance de los cortes nunca retrocede y el último corte es el avance actual');
    ok(costs.reserves.contingency === X.contVigente && costs.reserves.management === X.gestion, 'reservas vigentes');
    const lastNote = costs.statusUpdates[costs.statusUpdates.length - 1].note || '';
    ok(/bloque A en el piso 6 \(75 %\) y bloque B en el piso 3 \(36 %\)/.test(lastNote) && tasks.find((t) => t.id === 'K07').progress === 75 && tasks.find((t) => t.id === 'K09').progress === 36, 'nota del corte de septiembre con el avance de la estructura del cronograma (bloque A 75 %, bloque B 36 %)', lastNote);
    const evm = PM.calc.evm({ sched, costBaseline: actives.cost, costs, statusDate: st });
    out.evm = { pv: evm.pv, ev: evm.ev, ac: evm.ac, spi: evm.spi, cpi: evm.cpi, eac: evm.eac };
    if (X.modelEvm) ok(Math.round(evm.pv) === X.modelEvm[0] && Math.round(evm.ev) === X.modelEvm[1] && Math.round(evm.ac) === X.modelEvm[2], 'PV, EV y AC al corte iguales a los de model.json', [evm.pv, evm.ev, evm.ac, X.modelEvm]);
    ok(evm.fromBaseline && evm.bac === X.bac, 'valor ganado con la línea base LB1');
    ok(evm.spi >= R.spi[0] && evm.spi <= R.spi[1], 'SPI dentro de ' + R.spi.join('–'), evm.spi);
    ok(evm.cpi >= R.cpi[0] && evm.cpi <= R.cpi[1], 'CPI dentro de ' + R.cpi.join('–'), evm.cpi);
    ok(evm.ac > 0.3 * X.bac && evm.ac < 0.4 * X.bac, 'costo real acumulado entre 30 y 40 % del BAC', evm.ac);

    /* RACI */
    const raci = await P('/tools/raci');
    const roleNames = raci.roles.map((r) => r.name);
    for (const n of ['Junta directiva / promotor', 'Gerente de proyecto', 'Estructurador financiero', 'Gerente comercial', 'Arquitecto diseñador', 'Ingeniero estructural', 'Constructor / director de obra', 'Interventoría / supervisión técnica independiente', 'Fiduciaria', 'Banco (crédito constructor)', 'Curaduría urbana']) ok(roleNames.includes(n), 'rol de la RACI: ' + n);
    const roleIds = new Set(raci.roles.map((r) => r.id));
    const l12 = nodes.filter((n) => (tree.depth.get(n.id) || 9) <= 2);
    ok(l12.every((n) => raci.rows.some((r) => r.wbsId === n.id)) && raci.rows.every((r) => ids.has(r.wbsId) && r.activity), 'una fila por entregable de nivel 1 y 2', l12.filter((n) => !raci.rows.some((r) => r.wbsId === n.id)).map((n) => n.id));
    ok(raci.rows.every((r) => Object.values(r.cells).filter((v) => v === 'A' || v === 'RA').length === 1), 'exactamente una A por fila', raci.rows.filter((r) => Object.values(r.cells).filter((v) => v === 'A' || v === 'RA').length !== 1).map((r) => r.wbsId));
    ok(raci.rows.every((r) => Object.values(r.cells).some((v) => v === 'R' || v === 'RA')), 'al menos una R por fila');
    ok(raci.rows.every((r) => Object.keys(r.cells).every((k) => roleIds.has(k)) && Object.values(r.cells).every((v) => ['R', 'A', 'C', 'I', 'RA'].includes(v))), 'celdas válidas');

    /* calidad */
    const q = await P('/tools/quality');
    const ish = q.ishikawa[0];
    ok(q.ishikawa.length === 1 && /movimiento de tierras/i.test(ish.name) && ish.effect && ish.categories.map((c) => c.name).join() === 'Mano de obra,Método,Maquinaria,Materiales,Medición,Medio ambiente', 'Ishikawa 6M del atraso de tierras y cimentación');
    ok(ish.categories.every((c) => c.id && c.causes.length >= 1 && c.causes.every((x) => x.id && x.text && Array.isArray(x.sub))), 'causas del Ishikawa');
    ok(!/23,7/.test(JSON.stringify(ish)) && /salario mínimo de 2026 \(\+23 %\)/.test(JSON.stringify(ish)), 'alza del salario mínimo de 2026: +23 % (1.423.500 → 1.750.905, Decreto 1469 de 2025)');
    ok(/caso/.test(q.pareto[0].name) && !/^Días/.test(q.pareto[0].name), 'el Pareto manual cuenta casos (jornadas perdidas), como lo rotula la vista', q.pareto[0].name);
    ok(q.pareto.length === 2 && q.pareto[0].source === 'manual' && q.pareto[0].items.length >= 5 && q.pareto[0].items.every((x) => x.id && x.cause && x.count > 0) && q.pareto[1].source === 'mediciones' && q.pareto[1].items.length === 0, 'Pareto manual y Pareto desde las mediciones');
    const ctl = q.control[0];
    ok(ctl && /Resistencia del concreto a 28 días/.test(ctl.name) && ctl.unit === 'MPa' && ctl.lsl === 24.5 && ctl.target > 28, 'gráfico de control de resistencia del concreto (f\'c 28 MPa; LIE = f\'c − 3,5)');
    const vals = ctl.points.map((p) => p.value); const n = vals.length; const mean = vals.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
    const outs = vals.filter((v) => v > mean + 3 * sd || v < mean - 3 * sd);
    ok(n >= 22 && n <= 28 && outs.length === 1 && outs[0] >= ctl.lsl, 'unos 25 ensayos con uno fuera de control y dentro de especificación', { n, outs, mean, sd });
    ok(ctl.points.every((p) => p.id && D.valid(p.date) && p.date <= st && sched.cal.isWork(p.date)), 'ensayos en días hábiles hasta el corte');

    /* diagramas de flujo */
    const flows = await PM.store.list(PM.paths.flows(pid));
    const names = flows.map((x) => x.data.name).sort();
    ok(flows.length === 3 && names.join('|') === ['Control integrado de cambios (4.6)', 'Liberación de recursos de la fiducia y desembolsos del crédito constructor', 'Venta y escrituración con encargo fiduciario'].sort().join('|'), 'tres diagramas de flujo', names);
    const TYPES = ['terminal', 'process', 'decision', 'document', 'data', 'subprocess', 'connector', 'note'];
    const ventas = flows.find((x) => /Venta y escrituración/.test(x.data.name));
    ok(ventas && ['separ', 'SARLAFT', 'ncargo', 'romesa', 'cuotas', 'unto de equilibrio', 'rédito', 'scritura', 'ntrega'].every((w) => ventas.data.nodes.some((nd) => nd.text.includes(w))), 'flujo de ventas: separación → SARLAFT → encargo → promesa → cuotas → punto de equilibrio → crédito → escritura → entrega');
    for (const fl of flows) {
      const d = fl.data; const nid = new Set(d.nodes.map((x) => x.id));
      ok(d.lanes.length >= 3 && d.description, fl.id + ': carriles y descripción');
      ok(d.nodes.every((x) => TYPES.includes(x.type) && x.text && x.w > 0 && x.h > 0), fl.id + ': tipos de nodo válidos');
      ok(d.nodes.every((x) => [x.x, x.y, x.w, x.h].every((v) => v % 8 === 0)), fl.id + ': retícula de 8 px', d.nodes.filter((x) => ![x.x, x.y, x.w, x.h].every((v) => v % 8 === 0)).map((x) => x.id));
      ok(d.edges.every((e) => nid.has(e.from) && nid.has(e.to) && e.from !== e.to), fl.id + ': flechas entre nodos existentes');
      ok(new Set(d.edges.map((e) => e.id)).size === d.edges.length && nid.size === d.nodes.length, fl.id + ': ids únicos');
      let overlap = null;
      for (let i = 0; i < d.nodes.length; i++) for (let j = i + 1; j < d.nodes.length; j++) { const a = d.nodes[i], b = d.nodes[j]; if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) overlap = [a.id, b.id]; }
      ok(!overlap, fl.id + ': nodos sin superposición', overlap);
      ok(d.nodes.filter((x) => x.type === 'decision').every((x) => d.edges.filter((e) => e.from === x.id).map((e) => e.label).sort().join() === 'No,Sí'), fl.id + ': decisiones con salidas Sí y No');
      const real = d.nodes.filter((x) => x.type !== 'note');
      const starts = real.filter((x) => x.type === 'terminal' && !d.edges.some((e) => e.to === x.id));
      const ends = real.filter((x) => x.type === 'terminal' && !d.edges.some((e) => e.from === x.id));
      ok(starts.length === 1 && ends.length === 1, fl.id + ': un inicio y un fin');
      if (starts.length === 1 && ends.length === 1) {
        const reach = (from, dir) => { const seen = new Set([from]); const stack = [from]; while (stack.length) { const c = stack.pop(); for (const e of d.edges) { const [a, b] = dir ? [e.from, e.to] : [e.to, e.from]; if (a === c && !seen.has(b)) { seen.add(b); stack.push(b); } } } return seen; };
        const fwd = reach(starts[0].id, true), back = reach(ends[0].id, false);
        ok(real.every((x) => fwd.has(x.id) && back.has(x.id)), fl.id + ': todo paso es alcanzable y lleva al fin', real.filter((x) => !fwd.has(x.id) || !back.has(x.id)).map((x) => x.id));
      }
      let y = 0; const bands = d.lanes.map((l) => { const b = [y, y + (l.h || 176)]; y = b[1]; return b; });
      ok(d.nodes.every((x) => bands.some(([a, b]) => x.y >= a && x.y + x.h <= b) && x.x >= 160), fl.id + ': cada nodo dentro de un carril y a la derecha de los rótulos', d.nodes.filter((x) => !bands.some(([a, b]) => x.y >= a && x.y + x.h <= b)).map((x) => x.id));
    }

    /* documentos: los que haya en PM.exampleDocs.medellin con plantilla existente */
    const docs = await PM.store.list(PM.paths.docs(pid));
    const src = (PM.exampleDocs && PM.exampleDocs.medellin) || {};
    const expected = Object.keys(src).filter((k) => PM.templates[k]).reduce((s, k) => s + (PM.templates[k].multiple ? ((src[k].instances || []).filter((x) => x && x.key).length) : 1), 0);
    ok(docs.length === expected, 'un documento por entrada de PM.exampleDocs.medellin con plantilla', [docs.length, expected]);
    ok(docs.every((d) => d.data.template && PM.templates[d.data.template] && d.data.titleBlock.codigo.startsWith('PRY-2025-003-' + PM.templates[d.data.template].abbr)), 'cajetín con el código del proyecto y la abreviatura de la plantilla');
    out.docs = docs.length;
    out.pid = pid;
    return out;
  }, expect);
}

/* ------------------------------------------------------------------ 2) contrato de los documentos con entradas de prueba */
async function validateDocsContract(page) {
  return page.evaluate(async () => {
    const out = { checks: [] };
    const ok = (cond, msg, extra) => out.checks.push({ ok: !!cond, msg, extra: cond ? undefined : extra });
    const keep = PM.exampleDocs;
    const single = PM.templateList.find((t) => !t.multiple && t.sections && t.sections.some((s) => s.fields.some((f) => f.type === 'table')));
    const multi = PM.templateList.find((t) => t.multiple);
    if (!single || !multi) { ok(false, 'hay plantillas singleton y múltiples'); return out; }
    const fieldsOf = (t) => { const f = {}; for (const s of t.sections) for (const fl of s.fields) { if (fl.type === 'text' || fl.type === 'textarea') { f[fl.key] = 'Texto de prueba de ' + fl.key; break; } } return f; };
    PM.exampleDocs = { medellin: {
      [single.id]: { status: 'aprobado', rev: '1', date: '2026-03-13', titleBlock: { elaboro: 'Gerente de proyecto', reviso: 'Estructurador financiero', aprobo: 'Junta directiva del promotor' }, fields: fieldsOf(single), revs: [{ rev: 'A', status: 'borrador', date: '2025-04-10', note: 'Borrador.' }, { rev: '0', status: 'aprobado', date: '2025-04-22', note: 'Emisión con la LB0.', fields: { x: 1 } }, { rev: '1', status: 'aprobado', date: '2026-03-13', note: 'Actualizado con la LB1.' }] },
      [multi.id]: { instances: [{ key: 'ej1', title: multi.name + ' — prueba 1', status: 'aprobado', rev: '0', date: '2026-05-19', fields: fieldsOf(multi) }, { key: 'ej2', title: multi.name + ' — prueba 2', status: 'revision', rev: 'A', date: '2026-09-30', fields: fieldsOf(multi) }] },
      'plantilla-inexistente': { status: 'aprobado', rev: '0', date: '2025-01-13', fields: {} },
    } };
    try {
      const data = PM.getExample('medellin').build({ today: PM.date.today() });
      ok(JSON.stringify(data) === JSON.stringify(PM.getExample('medellin').build({ today: '2031-01-01' })), 'el constructor sigue siendo determinista con documentos');
      const docs = data.collections.docs;
      ok(docs.length === 3, 'se omite la plantilla inexistente; singleton y dos instancias', docs.map((d) => d.id));
      const s = docs.find((d) => d.id === single.id);
      ok(s && s.data.template === single.id && s.data.title === single.name && s.data.status === 'aprobado' && s.data.rev === '1', 'documento singleton con estado, revisión y título');
      ok(s && s.data.titleBlock.codigo === 'PRY-2025-003-' + single.abbr && s.data.titleBlock.aprobo === 'Junta directiva del promotor' && s.data.titleBlock.fechaAprobacion === '2026-03-13', 'cajetín del singleton', s && s.data.titleBlock);
      ok(s && s.data.updatedAt === '2026-03-13T15:00:00.000Z' && s.data.createdAt === '2025-04-10T15:00:00.000Z', 'creado y actualizado según la entrada y sus revisiones', s && [s.data.createdAt, s.data.updatedAt]);
      ok(s && s.revs.map((r) => r.id).join() === 'rev-A,rev-0,rev-1' && s.revs[1].data.fields.x === 1 && s.revs[0].data.fields[Object.keys(fieldsOf(single))[0]] && s.revs[0].data.titleBlock.fechaAprobacion === null && s.revs[1].data.titleBlock.fechaAprobacion === '2025-04-22', 'revisiones con sus campos o los de la entrada');
      ok(s && Object.keys(fieldsOf(single)).every((k) => s.data.fields[k] === fieldsOf(single)[k]), 'campos de la entrada');
      const tableKeys = single.sections.flatMap((x) => x.fields).filter((fl) => fl.type === 'table' && fl.defaultRows).map((fl) => fl.key);
      ok(s && tableKeys.every((k) => s.data.fields[k].every((r, i) => r.id === k + '-' + (i + 1))), 'filas iniciales con ids fijos');
      const m1 = docs.find((d) => d.id === multi.id + '--ej1'), m2 = docs.find((d) => d.id === multi.id + '--ej2');
      ok(m1 && m2 && m1.data.title === multi.name + ' — prueba 1' && m1.data.seq === 1 && m2.data.seq === 2 && m1.data.titleBlock.codigo === 'PRY-2025-003-' + multi.abbr + '-01' && m2.data.titleBlock.codigo === 'PRY-2025-003-' + multi.abbr + '-02', 'instancias de la plantilla múltiple');
      ok(m2 && m2.data.status === 'revision' && m2.data.titleBlock.fechaAprobacion === null, 'instancia en revisión sin fecha de aprobación');
      const pid = await PM.projectOps.importData(data);
      const revs = await PM.store.list(PM.paths.revs(pid, single.id));
      ok(revs.length === 3, 'las revisiones se importan', revs.length);
      await PM.projectOps.remove(pid);
    } finally { PM.exampleDocs = keep; }
    return out;
  });
}

/* ------------------------------------------------------------------ ejecución */
section('Constructor, importación y cálculos');
{
  const { browser, page, errors } = await openApp({ file });
  try {
    const res = await validateInPage(page, EXPECT);
    report(res);
    if (res.evm) console.log(`  PV ${(res.evm.pv / M).toFixed(0)} M · EV ${(res.evm.ev / M).toFixed(0)} M · AC ${(res.evm.ac / M).toFixed(0)} M · SPI ${res.evm.spi.toFixed(3)} · CPI ${res.evm.cpi.toFixed(3)} · EAC ${(res.evm.eac / M).toFixed(0)} M · documentos ${res.docs}`);
    section('Contrato de PM.exampleDocs.medellin (entradas de prueba)');
    report(await validateDocsContract(page));
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
}

section('Portafolio vacío → «Crear proyecto de ejemplo» → tarjeta de Medellín');
{
  const before = { passes, failures };
  const { browser, page, errors } = await openApp({ file });
  try {
    await page.evaluate(() => PM.navigate('portafolio'));
    await page.getByRole('button', { name: 'Crear proyecto de ejemplo' }).first().click();
    const card = page.getByRole('button', { name: /^Crear: Edificio residencial en Medellín/ });
    await card.waitFor({ timeout: 5000 });
    check(await page.getByText('COP 143.339 M').count() >= 1, 'la tarjeta muestra los chips del resumen');
    if (shots) await page.screenshot({ path: join(shots, 'selector-ejemplos.png') });
    await card.click();
    await page.waitForFunction(() => !!PM.getState().projectId, null, { timeout: 20000 });
    await page.getByText('Proyecto de ejemplo creado.').waitFor({ timeout: 10000 });
    const info = await page.evaluate(async () => { const pid = PM.getState().projectId; const p = await PM.store.get(PM.paths.project(pid)); const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); return { name: p.name, n: s.tasks.length, view: PM.getState().view }; });
    check(/^EJEMPLO · Edificio Atalaya del Occidente/.test(info.name) && info.n >= 100 && info.view === 'tablero', 'proyecto creado desde el selector y abierto en el tablero', info);
    const pid2 = await page.evaluate(() => PM.createExampleProject('medellin'));
    check(!!pid2, 'PM.createExampleProject(\'medellin\') crea el ejemplo sin selector');
    check(errors.length === 0, 'sin errores de consola', errors);
  } finally { await browser.close(); }
  console.log(`  ${passes - before.passes}/${passes - before.passes + failures - before.failures} verificaciones`);
}

for (const [label, opts] of [['escritorio (1360 px)', { width: 1360, height: 900 }], ['móvil (400 px)', { width: 400, height: 860 }]]) {
  section('Todas las vistas con el ejemplo — ' + label);
  const before = { passes, failures };
  const { browser, page, errors } = await openApp({ file, ...opts });
  try {
    const pid = await page.evaluate(() => PM.createExampleProject('medellin'));
    check(!!pid, 'ejemplo creado');
    await page.waitForTimeout(600);
    const views = await page.evaluate(() => PM.views.filter((v) => !v.hidden || v.id === 'documento').map((v) => v.id));
    for (const id of views) {
      const n0 = errors.length;
      if (id === 'documento') { const first = await page.evaluate(async () => { const pid = PM.getState().projectId; const d = await PM.store.list(PM.paths.docs(pid)); return d.length ? d[0].id : null; }); if (!first) continue; await page.evaluate((docId) => PM.openDocument(docId), first); await page.waitForTimeout(500); }
      else await gotoView(page, id);
      await page.waitForTimeout(450);
      const cards = await errorCards(page);
      const ov = await horizontalOverflow(page);
      const fresh = errors.slice(n0);
      check(!cards.length && !fresh.length && ov <= 1, 'vista ' + id + ' sin errores' + (ov > 1 ? ' (desborde ' + ov + ' px)' : ''), { cards, fresh: fresh.slice(0, 2) });
      /* la fecha del cronograma ganado (28 abr 2029) se rotula como tal; el fin pronosticado del proyecto es el de la red (29 jun 2029) */
      if (id === 'valor-ganado' && opts.width >= 900) {
        const es = await page.locator('[data-note="es"]').first().innerText().catch(() => '');
        check(/fin pronosticada por cronograma ganado es el 28 de abril de 2029/.test(es.replace(/\s+/g, ' ')), 'interpretación del valor ganado: la fecha de 28 de abril de 2029 se rotula «por cronograma ganado»', es);
        await page.click('[data-view="valor-ganado"] .tab:has-text("Indicadores")');
        await page.waitForSelector('[data-metric="forecastFinish"]');
        const card = (await page.locator('[data-metric="forecastFinish"]').innerText()).replace(/\s+/g, ' ');
        check(/Fin pronosticado por cronograma ganado/.test(card) && /28 abr 2029/.test(card), 'indicadores: la tarjeta del 28 abr 2029 se llama «Fin pronosticado por cronograma ganado» (el fin de la red es el 29 jun 2029)', card);
      }
      if (shots) await page.screenshot({ path: join(shots, `${id}${opts.width < 900 ? '-m' : ''}.png`), fullPage: false });
    }
  } finally { await browser.close(); }
  console.log(`  ${passes - before.passes}/${passes - before.passes + failures - before.failures} verificaciones`);
}

console.log(`\n${failures ? 'FALLÓ' : 'OK'}: ${passes} verificaciones correctas, ${failures} fallidas.`);
process.exit(failures ? 1 : 0);

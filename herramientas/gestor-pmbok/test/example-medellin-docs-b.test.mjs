// Contenido de los documentos del ejemplo «medellin», parte b (src/93-example-medellin-docs-b.js):
// plantillas de Costos, Calidad, Recursos, Comunicaciones, Riesgos, Adquisiciones e Interesados.
// Uso: node test/example-medellin-docs-b.test.mjs --file <ruta.html> [--shots dir] [--quick]
//  1. Cada plantilla de 13-templates-b tiene su entrada en PM.exampleDocs.medellin, con la forma del contrato
//     (estado, revisión, fecha, cajetín, revisiones emitidas, instancias en las plantillas múltiples).
//  2. Los campos coinciden con la plantilla: claves conocidas, tipos, opciones de las listas, filas con id
//     único y solo columnas de la plantilla, tablas fijas de SPEC §5 con sus claves, fechas válidas, números
//     como números, columnas calculadas que se evalúan sin errores (también en las revisiones emitidas).
//  3. Coherencia con el modelo (model.json): BAC, reservas, VME, holgura del financiamiento, causas de las
//     no conformidades, y ningún documento aprobado cita hechos posteriores a su fecha de aprobación.
//  4. Se crea el ejemplo y se abre cada documento en el editor (y sus revisiones emitidas): sin tarjetas de
//     error, sin errores de consola y sin «undefined», «NaN» ni «[object Object]» en el texto.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, errorCards } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
const quick = args.includes('--quick');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; console.log('  ok   ' + msg); } else { failures++; console.log('  FAIL ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 1500) : '')); } };
const step = (name) => console.log('\n# ' + name);

const AREAS_B = ['costos', 'calidad', 'recursos', 'comunicaciones', 'riesgos', 'adquisiciones', 'interesados'];
const CUT = '2026-09-30';
/* Primera fecha en que existe cada hecho citado (model.json): un documento aprobado antes no puede citarlo. */
const FACTS = {
  'CC-001': '2025-09-15', 'CC-002': '2026-01-19', 'CC-003': '2026-05-12', 'CC-004': '2026-09-21', 'CC-005': '2026-09-28',
  'INC-001': '2025-10-06', 'INC-002': '2025-11-24', 'INC-003': '2026-02-02', 'INC-004': '2026-05-07', 'INC-005': '2026-08-12', 'INC-006': '2026-07-20', 'INC-007': '2026-09-15', 'INC-011': '2026-09-25',
  'R-013': '2026-07-20', 'R-014': '2026-08-01', 'LB1': '2026-03-10',
  'CT-006': '2025-05-12', 'CT-007': '2025-07-14', 'CT-009': '2025-05-05', 'CT-010': '2025-05-05', 'CT-011': '2025-04-30', 'CT-012': '2025-05-19', 'CT-013': '2025-05-19',
  'CT-014': '2026-02-13', 'CT-015': '2026-03-13', 'CT-016': '2026-03-13', 'CT-017': '2026-03-13', 'CT-018': '2026-03-09', 'CT-019': '2026-03-27', 'CT-020': '2026-05-19',
  'CT-021': '2026-04-28', 'CT-022': '2026-06-10', 'CT-023': '2026-04-28', 'CT-024': '2026-04-28', 'CT-025': '2026-04-28',
  'cuarto de curado': '2026-08-12', 'deslizamiento del': '2026-05-07', 'el deslizamiento': '2026-05-07', 'pantalla anclada': '2026-05-07',
  'Resolución 0194 de 2025': '2025-04-23', /* publicada en el Diario Oficial el 23 de abril de 2025 */
};
/* Causas de las no conformidades (model.json → calidad.noConformidades) */
const NC_CAUSES = { 'Vibrado insuficiente': 3, 'Formaleta mal aplomada': 2, 'Curado deficiente de cilindros en obra': 1, 'Panelas de separación faltantes': 2, 'Unión mal soldada': 1 };

const { browser, page, errors } = await openApp({ file });
try {
  /* ---------------------------------------------------------------- 1–3. contrato, campos y coherencia */
  step('Entradas de PM.exampleDocs.medellin para las plantillas de 13-templates-b');
  const res = await page.evaluate(({ AREAS_B, CUT, FACTS, NC_CAUSES }) => {
    const out = { ids: [], missing: [], problems: [], items: [], anachronisms: [], totals: {} };
    const all = Object.values(PM.templates);
    const tpls = all.filter((t) => AREAS_B.includes(t.area));
    const src = (PM.exampleDocs && PM.exampleDocs.medellin) || {};
    const D = PM.date;
    const STATUS = ['aprobado', 'revision', 'borrador'];
    const REV = /^(\d+|[A-Z]|\d+[A-Z])$/;
    const FIXED = {
      'registro-riesgos.riesgos': ['id', 'descripcion', 'causa', 'efecto', 'categoria', 'tipo', 'probabilidad', 'impacto', 'propietario', 'estrategia', 'respuesta', 'disparador', 'reserva', 'estado'],
      'registro-interesados.interesados': ['nombre', 'cargo', 'organizacion', 'rol', 'contacto', 'requisitos', 'expectativas', 'poder', 'interes', 'influencia', 'clasificacion', 'actitud', 'nivelActual', 'nivelDeseado'],
      'mediciones-control-calidad.mediciones': ['fecha', 'entregable', 'metrica', 'resultado', 'conforme', 'causa', 'accion'],
    };
    const optVals = (opts) => (opts || []).map((o) => (o && typeof o === 'object' ? o.value : o));
    const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
    const bad = (where, msg) => out.problems.push(where + ': ' + msg);
    const BADTXT = /undefined|NaN|\[object Object\]/;
    const checkScalar = (where, type, v, f) => {
      if (v === null || v === undefined) return;
      if (type === 'text' || type === 'textarea') { if (typeof v !== 'string') bad(where, 'se esperaba texto'); else if (BADTXT.test(v)) bad(where, 'texto con valor inválido'); }
      else if (type === 'number' || type === 'money' || type === 'pct') {
        if (!isNum(v)) bad(where, 'se esperaba número, hay ' + JSON.stringify(v));
        else { if (f.min !== undefined && f.min !== null && v < f.min) bad(where, 'menor que el mínimo ' + f.min); if (f.max !== undefined && f.max !== null && v > f.max) bad(where, 'mayor que el máximo ' + f.max); if (type === 'pct' && (v < 0 || v > 100)) bad(where, 'porcentaje fuera de 0–100'); }
      } else if (type === 'date') { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !D.valid(v)) bad(where, 'fecha inválida ' + JSON.stringify(v)); }
      else if (type === 'select') { if (!optVals(f.options).includes(v)) bad(where, 'opción fuera de la lista: ' + JSON.stringify(v)); }
      else if (type === 'check') { if (typeof v !== 'boolean') bad(where, 'se esperaba booleano'); }
      else if (type === 'list') { if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim())) bad(where, 'se esperaba lista de textos'); }
    };
    const fieldsOf = (t) => (t.sections || []).flatMap((s) => s.fields || []);
    const checkFields = (tid, where, fields) => {
      const t = PM.templates[tid];
      const defs = Object.fromEntries(fieldsOf(t).map((f) => [f.key, f]));
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) { bad(where, 'fields no es un objeto'); return; }
      for (const [k, v] of Object.entries(fields)) {
        const f = defs[k];
        if (!f) { bad(where, 'clave desconocida «' + k + '»'); continue; }
        if (f.type !== 'table') { checkScalar(where + '.' + k, f.type, v, f); continue; }
        if (!Array.isArray(v)) { bad(where + '.' + k, 'se esperaba una tabla'); continue; }
        const cols = Object.fromEntries((f.columns || []).map((c) => [c.key, c]));
        const ids = new Set();
        v.forEach((row, i) => {
          const w = where + '.' + k + '[' + i + ']';
          if (!row || typeof row !== 'object') { bad(w, 'fila no es objeto'); return; }
          if (typeof row.id !== 'string' || !row.id) bad(w, 'fila sin id de texto');
          else if (ids.has(row.id)) bad(w, 'id repetido ' + row.id); else ids.add(row.id);
          for (const [ck, cv] of Object.entries(row)) {
            if (ck === 'id' && !cols.id) continue;
            const c = cols[ck];
            if (!c) { bad(w, 'columna desconocida «' + ck + '»'); continue; }
            if (c.type === 'calc') { bad(w, 'guarda un valor en la columna calculada «' + ck + '»'); continue; }
            checkScalar(w + '.' + ck, c.type, cv, c);
          }
          for (const c of f.columns || []) if (c.type === 'calc') {
            try {
              const x = c.calc(row, v, { currency: 'COP', rows: v, index: i });
              if (typeof x === 'number' && !Number.isFinite(x)) bad(w, 'cálculo ' + c.key + ' no finito');
              const txt = c.format ? c.format(x, row, { currency: 'COP', rows: v, index: i }) : String(x);
              if (BADTXT.test(String(txt))) bad(w, 'formato de ' + c.key + ' inválido: ' + txt);
            } catch (e) { bad(w, 'cálculo ' + c.key + ' lanza: ' + e.message); }
          }
        });
        const fx = FIXED[tid + '.' + k];
        if (fx) v.forEach((row, i) => { const miss = fx.filter((key) => !(key in row)); if (miss.length) bad(where + '.' + k + '[' + i + ']', 'faltan claves fijas de SPEC §5: ' + miss.join(', ')); });
      }
    };
    const textOf = (x) => (x === null || x === undefined ? '' : typeof x === 'string' ? x : Array.isArray(x) ? x.map(textOf).join(' ') : typeof x === 'object' ? Object.values(x).map(textOf).join(' ') : '');
    const anachro = (where, date, text) => { for (const [tok, d] of Object.entries(FACTS)) if (d > date && text.includes(tok)) out.anachronisms.push(where + ' (' + date + ') cita ' + tok + ' (' + d + ')'); };
    for (const t of tpls) {
      out.ids.push(t.id);
      const e = src[t.id];
      if (!e) { out.missing.push(t.id); continue; }
      const items = t.multiple ? (Array.isArray(e.instances) ? e.instances : []) : [e];
      if (t.multiple) {
        if (!items.length || items.length > 3) bad(t.id, 'se esperaban de 1 a 3 instancias');
        if (e.fields) bad(t.id, 'las plantillas múltiples no llevan fields en el nivel superior');
        const keys = new Set();
        items.forEach((x) => { if (!x.key || keys.has(x.key)) bad(t.id, 'instancia sin key única'); keys.add(x.key); if (!x.title || typeof x.title !== 'string') bad(t.id, 'instancia sin título'); });
      }
      for (const it of items) {
        const where = t.id + (t.multiple ? '--' + it.key : '');
        if (!STATUS.includes(it.status)) bad(where, 'estado inválido ' + it.status);
        if (typeof it.rev !== 'string' || !REV.test(it.rev)) bad(where, 'revisión inválida ' + it.rev);
        if (!D.valid(it.date) || it.date > CUT) bad(where, 'fecha inválida o posterior al corte: ' + it.date);
        if (it.status === 'aprobado' && !/^\d+$/.test(it.rev)) bad(where, 'un documento aprobado lleva revisión numérica');
        if (it.status !== 'aprobado' && /^\d+$/.test(it.rev)) bad(where, 'un documento en revisión o borrador lleva revisión con letra');
        if (it.titleBlock) for (const k of Object.keys(it.titleBlock)) if (!['elaboro', 'reviso', 'aprobo', 'fechaAprobacion'].includes(k)) bad(where, 'clave de cajetín desconocida ' + k);
        checkFields(t.id, where, it.fields);
        const filled = fieldsOf(t).filter((f) => it.fields && it.fields[f.key] !== undefined && it.fields[f.key] !== '' && !(Array.isArray(it.fields[f.key]) && !it.fields[f.key].length)).length;
        out.items.push({ id: where, template: t.id, status: it.status, rev: it.rev, date: it.date, filled, total: fieldsOf(t).length, revs: (it.revs || []).length });
        if (it.status === 'aprobado') anachro(where, it.date, textOf(it.fields));
        (it.revs || []).forEach((r, i) => {
          const w = where + '#rev' + (r.rev || i);
          if (typeof r.rev !== 'string' || !REV.test(r.rev)) bad(w, 'revisión inválida');
          if (!D.valid(r.date) || r.date > it.date) bad(w, 'fecha de revisión inválida o posterior al documento: ' + r.date);
          if (r.status && !STATUS.includes(r.status)) bad(w, 'estado inválido');
          if (!r.note || typeof r.note !== 'string') bad(w, 'revisión sin nota');
          if (r.fields) checkFields(t.id, w, r.fields);
          if ((r.status || 'aprobado') === 'aprobado') anachro(w, r.date, textOf(r.fields || (r.date === it.date ? it.fields : {})) + ' ' + (r.note || ''));
        });
        const revsSorted = (it.revs || []).map((r) => r.date).join('|') === (it.revs || []).map((r) => r.date).sort().join('|');
        if (!revsSorted) bad(where, 'revisiones fuera de orden cronológico');
      }
    }
    /* coherencia con el modelo */
    const colOf = (tid, fk, ck) => fieldsOf(PM.templates[tid]).find((f) => f.key === fk).columns.find((c) => c.key === ck);
    const sumCalc = (tid, fk, ck, rows) => rows.reduce((s, r, i) => s + (colOf(tid, fk, ck).calc(r, rows, { index: i }) || 0), 0);
    const lastCalc = (tid, fk, ck, rows) => colOf(tid, fk, ck).calc(rows[rows.length - 1], rows, { index: rows.length - 1 });
    const minCalc = (tid, fk, ck, rows) => Math.min(...rows.map((r, i) => colOf(tid, fk, ck).calc(r, rows, { index: i })));
    const eco = src['estimacion-costos'];
    out.totals.ecoBac = [sumCalc('estimacion-costos', 'estimaciones', 'total', eco.fields.estimaciones), sumCalc('estimacion-costos', 'estimaciones', 'total', eco.revs[0].fields.estimaciones)];
    out.totals.ecoConLinea = [sumCalc('estimacion-costos', 'estimaciones', 'totalContingencia', eco.fields.estimaciones), sumCalc('estimacion-costos', 'estimaciones', 'totalContingencia', eco.revs[0].fields.estimaciones)];
    const pgco = src['plan-gestion-costos'];
    out.totals.cuentas = [pgco.fields.cuentasControl.reduce((s, r) => s + r.presupuesto, 0), pgco.revs[0].fields.cuentasControl.reduce((s, r) => s + r.presupuesto, 0)];
    out.totals.reservas = [pgco.fields.reservaContingencia, pgco.fields.reservaGestion, pgco.revs[0].fields.reservaContingencia];
    const rfi = src['requisitos-financiamiento'];
    out.totals.holgura = [rfi.fields, rfi.revs[0].fields].map((f) => [lastCalc('requisitos-financiamiento', 'periodos', 'holgura', f.periodos), minCalc('requisitos-financiamiento', 'periodos', 'holgura', f.periodos), lastCalc('requisitos-financiamiento', 'periodos', 'acumuladoLineaBase', f.periodos)]);
    out.totals.rfi = [rfi.fields.presupuestoTotal, rfi.fields.lineaBaseCostos, rfi.fields.reservaGestion];
    const rr = src['registro-riesgos'];
    out.totals.riesgos = [rr.fields, ...rr.revs.map((r) => r.fields)].map((f) => ({ n: f.riesgos.length, reserva: f.riesgos.filter((r) => r.tipo === 'Amenaza').reduce((s, r) => s + (r.reserva || 0), 0), fit: f.riesgos.map((r) => colOf('registro-riesgos', 'riesgos', 'coherenciaEstrategia').calc(r, f.riesgos)).filter((x) => x !== 'Coherente').length }));
    const aq = src['analisis-cuantitativo'];
    out.totals.vme = [aq.fields, ...aq.revs.map((r) => r.fields)].map((f) => ({ amenazas: lastCalc('analisis-cuantitativo', 'riesgos', 'vmeAmenazas', f.riesgos), oportunidades: lastCalc('analisis-cuantitativo', 'riesgos', 'vmeOportunidades', f.riesgos), reserva: f.reservaRecomendada }));
    const ir = src['informe-riesgos'].fields;
    out.totals.informeRiesgos = [ir.reservaContingencia, ir.reservaUtilizada];
    const med = src['mediciones-control-calidad'].fields.mediciones;
    const nc = {}; med.filter((m) => m.conforme === 'No').forEach((m) => { nc[m.causa] = (nc[m.causa] || 0) + 1; });
    out.totals.nc = { got: nc, want: NC_CAUSES };
    out.totals.ncSinCausa = med.filter((m) => m.conforme === 'No' && !String(m.causa || '').trim()).length;
    out.totals.interesados = src['registro-interesados'].fields.interesados.length;
    const csp = src['criterios-seleccion-proveedores'].fields.criterios;
    out.totals.csp = { peso: csp.reduce((s, r) => s + r.peso, 0), A: sumCalc('criterios-seleccion-proveedores', 'criterios', 'ponderadoA', csp), B: sumCalc('criterios-seleccion-proveedores', 'criterios', 'ponderadoB', csp), C: sumCalc('criterios-seleccion-proveedores', 'criterios', 'ponderadoC', csp) };
    out.totals.contratos = src['registro-adquisiciones'].fields.contratos.map((c) => c.numero).join(',');
    out.totals.cuentas2 = Object.fromEntries(pgco.fields.cuentasControl.map((r) => [r.cuenta, r.presupuesto]));
    /* impacto (1–5) del registro frente a la escala de costo del plan (1 < 100 M; 2 100–300; 3 300–700; 4 700–1.500; 5 > 1.500), con el impacto del análisis cuantitativo */
    const lvl = (v) => { const m = v / 1e6; const a = m < 100 ? [1] : m === 100 ? [1, 2] : m < 300 ? [2] : m === 300 ? [2, 3] : m < 700 ? [3] : m === 700 ? [3, 4] : m < 1500 ? [4] : m === 1500 ? [4, 5] : [5]; return a; };
    const scaleOff = [];
    const pairs = [[rr.fields, aq.fields], [rr.revs[0].fields, aq.revs[0].fields], [rr.revs[1].fields, aq.revs[1].fields]];
    pairs.forEach(([rf, af], k) => af.riesgos.forEach((a) => { const id = a.riesgo.slice(0, 5); const r = rf.riesgos.find((x) => x.id === id); if (r && !lvl(a.impacto).includes(r.impacto)) scaleOff.push(['corte', 'LB0', 'LB1'][k] + ' ' + id + ': impacto ' + r.impacto + ' con COP ' + a.impacto / 1e6 + ' M'); }));
    out.totals.scaleOff = scaleOff;
    out.totals.r014 = (() => { const r = rr.fields.riesgos.find((x) => x.id === 'R-014'); const a = aq.fields.riesgos.find((x) => x.riesgo.startsWith('R-014')); return { p: r.probabilidad, i: r.impacto, estrategia: r.estrategia, impacto: a.impacto, prob: a.probabilidad }; })();
    /* textos: cifras superadas y cajetines */
    const allText = Object.entries(src).filter(([tid]) => tpls.some((t) => t.id === tid)).map(([, e]) => textOf(e)).join(' ');
    out.totals.stale = ['2.560 millones', '16.617', '10,09 %', '23,7 %', 'sin ajuste por inflación', '1.024 millones', 'unos COP 1.060 millones', 'administración de obra 6,5 %', '14.057', '8,67 %', '2.155 millones', 'reponer COP 600 millones', 'reposición de COP 600 millones', 'unos COP 1.600 millones', 'sigue vigente para la etapa 2', '18 viviendas al mes'].filter((t) => allText.includes(t));
    /* amenazas abiertas con la regla de la app (70-matrices y 80-dashboard): sin «Cerrado» ni «Materializado» */
    out.totals.abiertas = rr.fields.riesgos.filter((r) => r.tipo === 'Amenaza' && !['Cerrado', 'Materializado'].includes(r.estado)).reduce((s, r) => s + (r.reserva || 0), 0);
    out.totals.r004 = (() => { const r = rr.fields.riesgos.find((x) => x.id === 'R-004'); return [r.estado, r.reserva, aq.fields.riesgos.some((a) => a.riesgo.startsWith('R-004'))]; })();
    /* asignaciones (rev. A al corte): fechas pronosticadas; los roles del promotor hasta el fin pronosticado de G05/G06 */
    out.totals.asig = src['asignaciones-recursos'].fields.equipo.filter((r) => /Promotora/.test(r.organizacion)).map((r) => r.rol + '|' + r.hasta);
    /* reunión de arranque: las 416 viviendas del acta de constitución */
    out.totals.arranque = (src['acta-reunion'].instances.find((x) => x.key === 'ej1') || { fields: {} }).fields.agenda || [];
    /* estimación de costos: la columna de contingencia muestra el porcentaje guardado (2,5 % y 2,75 %) */
    const ecoCol = PM.templates['estimacion-costos'].sections.flatMap((s) => s.fields).find((f) => f.key === 'estimaciones').columns.find((c) => c.key === 'contingencia');
    const ecoDoc = src['estimacion-costos'];
    out.totals.contingencia = [ecoDoc.fields.estimaciones, ...ecoDoc.revs.filter((r) => r.fields).map((r) => r.fields.estimaciones)].map((rows) => [...new Set(rows.filter((r) => r.contingencia).map((r) => ecoCol.format ? ecoCol.format(r.contingencia, r) : PM.fmt.pct100(r.contingencia)))].join(' / '));
    out.totals.subcontratos = Object.fromEntries(src['registro-adquisiciones'].fields.contratos.filter((c) => /^CT-0(19|2[0-5])$/.test(c.id)).map((c) => [c.id, c.valor / 1e6]));
    out.totals.forecast = ['14.377 millones', '8,87 %', '1.603 millones', 'art. 850', 'COP 2.043 millones', 'faltan COP 280 millones', 'faltan unos COP 1.835 millones'].filter((t) => !allText.includes(t));
    const sameRole = [];
    for (const t of tpls) { const e = src[t.id]; if (!e) continue; for (const it of (t.multiple ? e.instances || [] : [e])) { const tb = it.titleBlock || {}; if (tb.aprobo && tb.elaboro === tb.aprobo) sameRole.push(t.id + (t.multiple ? '--' + it.key : '')); } }
    out.totals.sameRole = sameRole;
    out.totals.fechaPrecios = [eco.fields.fechaPrecios, eco.revs[0].fields.fechaPrecios];
    /* columnas de texto de una línea con valores cortos (se leen completos en el editor) */
    const long = [];
    const chk = (tid, fk, ck, max) => { const e = src[tid]; [e.fields, ...(e.revs || []).map((r) => r.fields).filter(Boolean)].forEach((f) => (f[fk] || []).forEach((r) => { if (String(r[ck] || '').length > max) long.push(tid + '.' + ck + ': ' + r[ck]); })); };
    chk('analisis-cuantitativo', 'riesgos', 'riesgo', 36); chk('informe-riesgos', 'principales', 'riesgo', 38); chk('control-adquisiciones', 'seguimiento', 'contrato', 30); chk('evaluacion-desempeno-equipo', 'evaluaciones', 'equipo', 26);
    out.totals.long = long;
    return out;
  }, { AREAS_B, CUT, FACTS, NC_CAUSES });

  const M = 1e6;
  check(res.ids.length === 30, 'hay 30 plantillas de la parte b (Costos a Interesados)', res.ids.length);
  check(!res.missing.length, 'cada plantilla de la parte b tiene su entrada', res.missing);
  check(!res.problems.length, 'campos, tablas, opciones, fechas y cálculos conformes con las plantillas (' + res.items.length + ' documentos y sus revisiones)', res.problems.slice(0, 25));
  check(!res.anachronisms.length, 'ningún documento o revisión aprobada cita hechos posteriores a su fecha', res.anachronisms.slice(0, 20));
  const thin = res.items.filter((x) => x.filled < Math.ceil(x.total * 0.8));
  check(!thin.length, 'cada documento llena al menos el 80 % de sus campos', thin.map((x) => x.id + ' ' + x.filled + '/' + x.total));
  const apr = res.items.filter((x) => x.status === 'aprobado').length, rev = res.items.filter((x) => x.status === 'revision').length;
  console.log('  ·    ' + res.items.length + ' documentos: ' + apr + ' aprobados, ' + rev + ' en revisión; ' + res.items.reduce((s, x) => s + x.revs, 0) + ' revisiones emitidas');

  step('Coherencia con el modelo del ejemplo');
  const T = res.totals;
  check(T.ecoBac[0] === 139576 * M && T.ecoBac[1] === 139146 * M, 'estimaciones de costos: BAC de COP 139.576 M (LB1) y 139.146 M (LB0)', T.ecoBac);
  check(Math.abs(T.ecoConLinea[0] - 141939 * M) < 1 * M && Math.abs(T.ecoConLinea[1] - 141939 * M) < 1 * M, 'BAC + contingencia ≈ línea base de costos de COP 141.939 M en las dos revisiones', T.ecoConLinea);
  check(T.cuentas[0] === 139576 * M && T.cuentas[1] === 139146 * M, 'cuentas de control suman el BAC de cada línea base', T.cuentas);
  check(T.reservas[0] === 2363 * M && T.reservas[1] === 1400 * M && T.reservas[2] === 2793 * M, 'reservas: contingencia 2.363 M (LB1) y 2.793 M (LB0); gestión 1.400 M', T.reservas);
  check(T.holgura.every(([last, min, lb]) => last === 44183 * M && min >= 0 && Math.abs(lb - 141939 * M) < 1), 'financiamiento: holgura nunca negativa y excedente final de COP 44.183 M (aporte + utilidad)', T.holgura);
  check(T.rfi[0] === 143339 * M && T.rfi[1] === 141939 * M && T.rfi[2] === 1400 * M, 'requisitos de financiamiento con el presupuesto total, la línea base de costos y la reserva de gestión del modelo', T.rfi);
  check(T.riesgos[0].n === 14 && T.riesgos[0].reserva === 2043 * M && T.riesgos[1].reserva === 2793 * M && T.riesgos[2].reserva === 2363 * M, 'registro de riesgos: 14 riesgos al corte; reservas de las amenazas = VME (2.043 al corte / 2.793 LB0 / 2.363 LB1 M)', T.riesgos);
  check(T.abiertas === 2043 * M && T.r004.join() === 'Materializado,,false', 'al corte: amenazas abiertas (sin «Cerrado» ni «Materializado», regla de la app) con VME de 2.043 M; R-004 materializado sin reserva (se usó en el CC-003) y fuera del análisis cuantitativo', [T.abiertas, T.r004]);
  check(JSON.stringify(T.subcontratos) === JSON.stringify({ 'CT-019': 2723, 'CT-020': 571, 'CT-021': 3452, 'CT-022': 4758, 'CT-023': 3714, 'CT-024': 2476, 'CT-025': 5105 }), 'subcontratos CT-019 a CT-025 al costo reembolsable (sin los honorarios del 5 % del constructor)', T.subcontratos);
  check(T.asig.join(',') === 'Gerente de proyecto|2029-06-28,Estructurador financiero|2029-06-28,Gerente comercial|2029-03-15,Abogado del proyecto|2029-06-28,Contador del proyecto|2029-06-28', 'asignaciones al corte: roles del promotor hasta el fin pronosticado (G05/G06 el 28 de junio de 2029; gerente comercial con C13)', T.asig);
  check(T.arranque.some((x) => /416 viviendas \(104 VIS y 312 No VIS\)/.test(x)) && !T.arranque.some((x) => /400 a 500/.test(x)), 'reunión de arranque: objetivos con las 416 viviendas del acta de constitución', T.arranque);
  check(T.contingencia.join(' ; ') === '2,5 % ; 3 % / 2,75 %', 'estimación de costos: la columna «Contingencia (%)» muestra 2,5 % (LB1) y 3 % / 2,75 % (LB0)', T.contingencia);
  check(T.riesgos.every((x) => x.fit === 0), 'todas las estrategias son coherentes con el tipo de riesgo', T.riesgos);
  check(T.vme[0].amenazas === -2043 * M && Math.abs(T.vme[0].oportunidades - 641.2 * M) < 1 && T.vme[0].reserva === 2043 * M, 'análisis cuantitativo al corte: VME de amenazas abiertas −2.043 M, oportunidades +641,2 M (R-014: 40 % de COP 1.603 M), reserva recomendada 2.043 M', T.vme[0]);
  check(!T.scaleOff.length, 'el impacto (1–5) de cada riesgo del registro corresponde a la escala de costo del plan con el impacto del análisis cuantitativo (corte, LB0 y LB1)', T.scaleOff);
  check(T.r014.p === 3 && T.r014.i === 5 && T.r014.estrategia === 'Mejorar' && T.r014.impacto === 1603 * M && T.r014.prob === 40, 'R-014: oportunidad de COP 1.603 M sobre las 130 viviendas por vender (P 3 × I 5, estrategia mejorar)', T.r014);
  check(!T.stale.length, 'sin cifras superadas (ventas +2.560 M, utilidad de 16.617 / 14.057 M o 10,09 / 8,67 %, SMMLV +23,7 %, precios sin ajuste, préstamo de 1.060 M, capítulos sin honorarios, CC-005 de 600 M, velocidad única de 18 al mes)', T.stale);
  check(!T.forecast.length, 'pronóstico con ventas de la línea base (utilidad de COP 14.377 M, 8,87 %; faltan 1.835 M para el 10 %), VME de las amenazas abiertas de 2.043 M (faltan 280 M), R-014 de COP 1.603 M y devolución del IVA de las VIS (art. 850 E.T.)', T.forecast);
  check(T.cuentas2['CC-1.2'] === 26291 * M && T.cuentas2['CC-1.4'] === 5770 * M && T.cuentas2['CC-1.5.1'] === 37009 * M, 'cuentas de control por paquete iguales al modelo (1.2 = 26.291 M con el registro del lote; 1.4 = 5.770 M)', T.cuentas2);
  check(T.fechaPrecios[0] === '2026-03-13' && T.fechaPrecios[1] === '2025-03-31', 'estimación de costos en pesos corrientes: precios base de la LB1 (13-mar-2026) y de la LB0 (31-mar-2025)', T.fechaPrecios);
  check(!T.sameRole.length, 'ningún documento lo elabora y lo aprueba el mismo rol', T.sameRole);
  check(!T.long.length, 'columnas de texto de una línea con valores cortos (riesgos, contratos y equipos)', T.long);
  check(T.vme[1].amenazas === -2793 * M && T.vme[1].reserva === 2793 * M && T.vme[2].amenazas === -2363 * M && T.vme[2].reserva === 2363 * M, 'análisis cuantitativo de la LB0 (2.793 M) y de la LB1 (2.363 M)', T.vme.slice(1));
  check(T.informeRiesgos[0] === 2363 * M && T.informeRiesgos[1] === 600 * M, 'informe de riesgos: reserva de 2.363 M con 600 M usados (CC-003)', T.informeRiesgos);
  check(JSON.stringify(Object.entries(T.nc.got).sort()) === JSON.stringify(Object.entries(T.nc.want).sort()) && T.ncSinCausa === 0, 'no conformidades por causa iguales a las del modelo (Pareto desde mediciones)', T.nc);
  check(T.interesados === 17, 'registro de interesados con los 17 interesados del modelo', T.interesados);
  check(T.csp.peso === 100 && T.csp.A > T.csp.B && T.csp.A > T.csp.C, 'criterios de selección: pesos suman 100 % y gana el oferente A (constructor seleccionado)', T.csp);
  check(T.contratos === Array.from({ length: 25 }, (_, i) => 'CT-' + String(i + 1).padStart(3, '0')).join(','), 'registro de contratos con CT-001 a CT-025 del modelo', T.contratos);

  /* ---------------------------------------------------------------- 4. documentos en el editor */
  step('Documentos del ejemplo en el editor');
  const pid = await page.evaluate(() => PM.createExampleProject('medellin'));
  check(!!pid, 'ejemplo «medellin» creado');
  await page.waitForTimeout(800);
  const stored = await page.evaluate(async (ids) => {
    const pid = PM.getState().projectId;
    const docs = await PM.store.list(PM.paths.docs(pid));
    return docs.filter((d) => ids.includes(d.data.template)).map((d) => ({ id: d.id, status: d.data.status, rev: d.data.rev, title: d.data.title }));
  }, res.ids);
  check(stored.length === res.items.length, 'un documento guardado por entrada (' + res.items.length + ')', [stored.length, res.items.length]);
  const ids = res.items.map((x) => x.id);
  const RICH = ['estimacion-costos', 'registro-riesgos', 'requisitos-financiamiento', 'registro-adquisiciones', 'plan-gestion-calidad'];
  const badText = [], cardsSeen = [], histProblems = [];
  for (const id of ids) {
    const n0 = errors.length;
    await page.evaluate((docId) => PM.openDocument(docId), id);
    try {
      await page.waitForSelector('.page[data-doc-id="' + id + '"] .title-block', { timeout: 10000 });
    } catch (e) { check(false, id + ': el editor no abrió'); continue; }
    await page.waitForTimeout(250);
    const txt = await page.$eval('.view-host', (el) => el.innerText);
    const m = txt.match(/undefined|NaN|\[object Object\]/);
    if (m) badText.push(id + ': «' + m[0] + '» … ' + txt.slice(Math.max(0, m.index - 80), m.index + 40).replace(/\s+/g, ' '));
    const cards = await errorCards(page);
    if (cards.length) cardsSeen.push(id + ': ' + cards[0].slice(0, 200));
    const fresh = errors.slice(n0);
    if (fresh.length) cardsSeen.push(id + ': ' + fresh[0].slice(0, 200));
    if (shots && RICH.includes(id)) { await page.screenshot({ path: join(shots, id + '.png'), fullPage: true }); }
    const item = res.items.find((x) => x.id === id);
    if (item.revs && !quick) {
      await page.getByRole('button', { name: /Historial/ }).first().click();
      await page.waitForSelector('.docs-hist tbody tr', { timeout: 8000 });
      const nRows = await page.locator('.docs-hist tbody tr').count();
      if (nRows < item.revs) histProblems.push(id + ': ' + nRows + ' revisiones en el historial, se esperaban ' + item.revs);
      for (let i = 0; i < nRows; i++) {
        await page.locator('.docs-hist tbody tr').nth(i).getByRole('button', { name: 'Ver' }).click();
        await page.waitForTimeout(250);
        const modals = page.locator('[role="dialog"]');
        const mtxt = await modals.last().innerText();
        const mm = mtxt.match(/undefined|NaN|\[object Object\]/);
        if (mm) histProblems.push(id + ' (revisión ' + (i + 1) + '): «' + mm[0] + '»');
        const c2 = await errorCards(page);
        if (c2.length) histProblems.push(id + ' (revisión ' + (i + 1) + '): tarjeta de error');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
  }
  check(!cardsSeen.length, 'los ' + ids.length + ' documentos abren sin tarjetas de error ni errores de consola', cardsSeen.slice(0, 10));
  check(!badText.length, 'sin «undefined», «NaN» ni «[object Object]» en el texto de los documentos', badText.slice(0, 10));
  if (!quick) check(!histProblems.length, 'el historial muestra las revisiones emitidas y cada instantánea se lee sin errores', histProblems.slice(0, 10));
  check(!errors.length, 'sin errores de consola en toda la prueba', errors.slice(0, 5));
} finally {
  await browser.close();
}
console.log(`\n${failures ? 'FALLÓ' : 'OK'}: ${passes} verificaciones correctas, ${failures} fallidas.`);
process.exit(failures ? 1 : 0);

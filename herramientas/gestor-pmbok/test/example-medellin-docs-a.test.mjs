// Valida el contenido de los documentos del ejemplo «medellin» para las plantillas de 12-templates-a.js
// (src/92-example-medellin-docs-a.js): contrato de PM.exampleDocs.medellin contra PM.templates, coherencia con el
// modelo del ejemplo (cambios, incidentes, líneas base, valor ganado) y render de cada documento en el editor.
// Uso: node test/example-medellin-docs-a.test.mjs --file <ruta.html> [--shots dir] [--dark]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, errorCards } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
const dark = args.includes('--dark');

const PART_A = ['caso-negocio', 'plan-gestion-beneficios', 'acta-constitucion', 'registro-supuestos', 'plan-direccion', 'plan-gestion-cambios', 'plan-gestion-configuracion', 'entregables', 'registro-incidentes', 'registro-lecciones', 'informe-desempeno', 'solicitud-cambio', 'registro-cambios', 'informe-final', 'acta-cierre', 'plan-gestion-alcance', 'plan-gestion-requisitos', 'documentacion-requisitos', 'matriz-trazabilidad', 'enunciado-alcance', 'acta-aceptacion-entregable', 'plan-gestion-cronograma', 'estimaciones-duracion'];
/* El cierre no ha empezado al corte (2026-09-30): sin informe final ni acta de cierre. */
const OMITTED = ['informe-final', 'acta-cierre'];
const FIXED = {
  'registro-cambios': ['cambios', ['id', 'fecha', 'solicitante', 'descripcion', 'tipo', 'impactoAlcance', 'impactoCronograma', 'impactoCosto', 'estado', 'fechaDecision', 'decisor']],
  'registro-incidentes': ['incidentes', ['id', 'fecha', 'descripcion', 'tipo', 'prioridad', 'responsable', 'fechaObjetivo', 'estado', 'solucion']],
  'registro-lecciones': ['lecciones', ['id', 'fecha', 'area', 'situacion', 'impacto', 'recomendacion', 'registradoPor']],
  'entregables': ['entregables', ['id', 'entregable', 'paqueteEdt', 'criterios', 'fechaPrevista', 'fechaEntrega', 'estado', 'aceptadoPor']],
  'registro-supuestos': ['supuestos', ['id', 'tipo', 'descripcion', 'categoria', 'responsable', 'fechaValidacion', 'estado']],
};
const CODE_RE = { 'registro-cambios': /^CC-\d{3}$/, 'registro-incidentes': /^INC-\d{3}$/, 'registro-lecciones': /^LA-\d{2}$/, 'entregables': /^ENT-\d{2}$/, 'registro-supuestos': /^S-\d{2}$/ };
/* Campos que pueden quedar vacíos a propósito (documento, instancia o plantilla: lista de claves). */
const MAY_BE_EMPTY = { 'solicitud-cambio--ej3': ['fechaDecision'] };
/* Hechos con la fecha en que se conocieron: un documento aprobado (o una revisión emitida) no los cita antes. */
const FACTS = [
  ['CC-001', '2025-09-15'], ['CC-002', '2026-01-19'], ['CC-003', '2026-05-12'], ['CC-004', '2026-09-21'], ['CC-005', '2026-09-28'],
  ['INC-001', '2025-10-06'], ['INC-002', '2025-11-24'], ['INC-003', '2026-02-02'], ['INC-004', '2026-05-07'], ['INC-005', '2026-08-12'],
  ['INC-006', '2026-07-20'], ['INC-007', '2026-09-15'], ['INC-008', '2026-04-21'], ['INC-009', '2026-06-10'], ['INC-010', '2026-08-28'], ['INC-011', '2026-09-18'],
  ['AAE-02', '2026-08-28'], ['AAE-03', '2026-09-25'], ['R-013', '2026-07-20'], ['R-014', '2026-09-15'],
  ['Resolución 0194 de 2025', '2025-04-23'], ['deslizamiento', '2026-05-07'], ['pantalla anclada', '2026-05-12'], ['Decreto 1469 de 2025', '2025-12-30'],
];
const CUT = '2026-09-30';

let failures = 0;
const fail = (m) => { failures++; console.log('FAIL ' + m); };
const ok = (c, m, extra) => { if (c) console.log('  ok ' + m); else fail(m + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 600) : '')); };

const { browser, page, errors } = await openApp({ file, width: 1440, height: 1000, dark });
try {
  /* ------------------------------------------------------------ 1) contrato de las entradas */
  console.log('1) Contrato de PM.exampleDocs.medellin (parte a)');
  const rep = await page.evaluate(({ PART_A, OMITTED, FIXED, CODE_RE_SRC, MAY_BE_EMPTY, FACTS, CUT }) => {
    const problems = [];
    const p = (id, m) => problems.push(id + ': ' + m);
    const CODE_RE = Object.fromEntries(Object.entries(CODE_RE_SRC).map(([k, v]) => [k, new RegExp(v)]));
    const src = (PM.exampleDocs && PM.exampleDocs.medellin) || {};
    const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bTODO\b|\bXXX\b|[Ll]orem ipsum|\bnull\b/;
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && PM.date.valid(v);
    const optVals = (opts) => (opts || []).map((o) => String(typeof o === 'object' ? o.value : o));
    const fieldsOf = (t) => { const m = new Map(); for (const s of t.sections || []) for (const f of s.fields || []) m.set(f.key, f); return m; };
    const textOk = (id, where, v) => { if (typeof v !== 'string' || !v.trim()) p(id, where + ' texto vacío o no es texto'); else if (BAD.test(v)) p(id, where + ' contiene texto prohibido: ' + v.match(BAD)[0]); };
    let stats = { docs: 0, fields: 0, rows: 0, revs: 0 };

    function checkCell(id, where, c, v, rows, row, i) {
      if (c.type === 'calc') { if (row && Object.prototype.hasOwnProperty.call(row, c.key)) p(id, where + '.' + c.key + ' no debe guardarse (columna calculada)'); return; }
      if (v === undefined || v === null || v === '') return;
      if (c.type === 'text' || c.type === 'textarea') textOk(id, where + '.' + c.key, v);
      else if (c.type === 'number' || c.type === 'money' || c.type === 'pct') { if (typeof v !== 'number' || !Number.isFinite(v)) p(id, where + '.' + c.key + ' debe ser número'); }
      else if (c.type === 'date') { if (!isDate(v)) p(id, where + '.' + c.key + ' fecha inválida: ' + v); }
      else if (c.type === 'select') { if (!optVals(c.options).includes(String(v))) p(id, where + '.' + c.key + ' fuera de las opciones: ' + v); }
      else if (c.type === 'check') { if (typeof v !== 'boolean') p(id, where + '.' + c.key + ' debe ser booleano'); }
    }
    function checkFields(id, t, fields, where, mayBeEmpty) {
      const keys = fieldsOf(t);
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) { p(id, where + ': fields debe ser un objeto'); return; }
      for (const [k, f] of keys) {
        if (!(k in fields) && !(mayBeEmpty || []).includes(k)) p(id, where + ': falta el campo ' + k);
      }
      for (const [k, v] of Object.entries(fields)) {
        const f = keys.get(k);
        if (!f) { p(id, where + ': clave desconocida ' + k); continue; }
        stats.fields++;
        const w = where + '.' + k;
        if (f.type === 'text' || f.type === 'textarea') textOk(id, w, v);
        else if (f.type === 'number' || f.type === 'money' || f.type === 'pct') {
          if (typeof v !== 'number' || !Number.isFinite(v)) p(id, w + ' debe ser número');
          else if (f.type === 'pct' && (v < (f.min ?? 0) || v > (f.max ?? 100))) p(id, w + ' fuera de rango');
        } else if (f.type === 'date') { if (!isDate(v)) p(id, w + ' fecha inválida: ' + v); }
        else if (f.type === 'select') { if (!optVals(f.options).includes(String(v))) p(id, w + ' fuera de las opciones: ' + v); }
        else if (f.type === 'check') { if (typeof v !== 'boolean') p(id, w + ' debe ser booleano'); }
        else if (f.type === 'list') {
          if (!Array.isArray(v) || !v.length) p(id, w + ' debe ser una lista con elementos');
          else v.forEach((x, i) => textOk(id, w + '[' + i + ']', x));
        } else if (f.type === 'table') {
          if (!Array.isArray(v) || !v.length) { p(id, w + ' debe ser una tabla con filas'); continue; }
          const cols = new Map((f.columns || []).map((c) => [c.key, c]));
          const ids = new Set();
          v.forEach((row, i) => {
            stats.rows++;
            const rw = w + '[' + i + ']';
            if (!row || typeof row !== 'object' || Array.isArray(row)) { p(id, rw + ' no es un objeto'); return; }
            if (typeof row.id !== 'string' || !row.id) p(id, rw + ' sin id de texto');
            else if (ids.has(row.id)) p(id, rw + ' id repetido ' + row.id); else ids.add(row.id);
            for (const rk of Object.keys(row)) if (rk !== 'id' && !cols.has(rk)) p(id, rw + ': columna desconocida ' + rk);
            for (const c of cols.values()) {
              checkCell(id, rw, c, row[c.key], v, row, i);
              if (c.type === 'calc') {
                try {
                  const out = c.calc(row, v, { currency: 'COP', rows: v, index: i });
                  if (typeof out === 'number' && !Number.isFinite(out)) p(id, rw + '.' + c.key + ' calcula un número inválido');
                  if (typeof out === 'string' && /NaN|undefined/.test(out)) p(id, rw + '.' + c.key + ' calcula texto inválido: ' + out);
                  if (c.format) { const s = String(c.format(out, row, { currency: 'COP', rows: v, index: i })); if (/NaN|undefined|\[object/.test(s)) p(id, rw + '.' + c.key + ' formato inválido: ' + s); }
                } catch (e) { p(id, rw + '.' + c.key + ' calc falla: ' + e.message); }
              }
            }
          });
          const base = id.split('--')[0];
          if (FIXED[base] && FIXED[base][0] === k) {
            const allowed = new Set(FIXED[base][1]);
            for (const row of v) for (const rk of Object.keys(row)) if (!allowed.has(rk)) p(id, w + ': clave fuera de la tabla fija ' + rk);
            for (const row of v) if (CODE_RE[base] && !CODE_RE[base].test(row.id)) p(id, w + ': código con formato inesperado ' + row.id);
          }
        } else p(id, w + ' tipo de campo no soportado ' + f.type);
      }
    }
    const factsIn = (obj) => { const s = JSON.stringify(obj); return FACTS.filter(([tok]) => s.includes(tok)); };
    function checkDated(id, where, status, date, fields) {
      if (status !== 'aprobado') { if (date > CUT) p(id, where + ' posterior al corte'); }
      for (const [tok, d] of factsIn(fields)) if (d > date) p(id, where + ' (' + status + ' ' + date + ') cita «' + tok + '», conocido el ' + d);
    }
    function checkEntry(id, t, e, where, mayBeEmpty) {
      stats.docs++;
      if (!['aprobado', 'revision', 'borrador'].includes(e.status)) p(id, where + ' estado inválido ' + e.status);
      if (typeof e.rev !== 'string') p(id, where + ' rev debe ser texto');
      else if (e.status === 'aprobado' ? !/^\d+$/.test(e.rev) : !/^(\d+)?[A-Z]$/.test(e.rev)) p(id, where + ' revisión ' + e.rev + ' no coincide con el estado ' + e.status);
      if (!isDate(e.date)) p(id, where + ' fecha inválida ' + e.date);
      else if (e.date > CUT) p(id, where + ' fecha posterior al corte ' + e.date);
      if (e.titleBlock) {
        for (const [k, v] of Object.entries(e.titleBlock)) {
          if (!['elaboro', 'reviso', 'aprobo', 'fechaAprobacion'].includes(k)) p(id, where + ' titleBlock con clave desconocida ' + k);
          else if (k === 'fechaAprobacion' ? !(v === null || isDate(v)) : typeof v !== 'string') p(id, where + ' titleBlock.' + k + ' inválido');
        }
      }
      checkFields(id, t, e.fields, where, mayBeEmpty);
      checkDated(id, where, e.status, e.date, e.fields);
      if (e.revs !== undefined) {
        if (!Array.isArray(e.revs) || !e.revs.length) { p(id, where + ' revs debe ser una lista'); return; }
        let prev = '';
        e.revs.forEach((r, i) => {
          stats.revs++;
          const rw = where + '.revs[' + i + ']';
          if (!isDate(r.date)) p(id, rw + ' fecha inválida'); else { if (r.date < prev) p(id, rw + ' fuera de orden'); prev = r.date; if (r.date > e.date) p(id, rw + ' posterior a la entrada'); }
          if (!['aprobado', 'revision', 'borrador'].includes(r.status)) p(id, rw + ' estado inválido');
          if (r.status === 'aprobado' && !/^\d+$/.test(String(r.rev))) p(id, rw + ' revisión aprobada sin número');
          textOk(id, rw + '.note', r.note);
          if (r.fields) checkFields(id, t, r.fields, rw, mayBeEmpty);
          checkDated(id, rw, r.status, r.date, r.fields || e.fields);
        });
        const last = e.revs[e.revs.length - 1];
        if (e.status === 'aprobado' && !(last.rev === e.rev && last.date === e.date)) p(id, where + ' la última revisión emitida debe ser la vigente (' + e.rev + ', ' + e.date + ')');
        if (e.status !== 'aprobado' && /^\d+$/.test(String(last.rev)) && !e.rev.startsWith(String(Number(last.rev) + 1))) p(id, where + ' el borrador ' + e.rev + ' no sigue a la revisión ' + last.rev);
      } else if (e.status === 'aprobado' && e.rev !== '0') p(id, where + ' revisión ' + e.rev + ' aprobada sin historial de revisiones');
      /* un borrador B, C… (o 1B…) supone emisiones anteriores: la letra previa debe estar en el historial */
      const lm = e.status !== 'aprobado' && /^(\d*)([A-Z])$/.exec(String(e.rev));
      if (lm && lm[2] > 'A') {
        const prevRev = lm[1] + String.fromCharCode(lm[2].charCodeAt(0) - 1);
        if (!(e.revs || []).some((r) => String(r.rev) === prevRev)) p(id, where + ' revisión ' + e.rev + ' sin la emisión ' + prevRev + ' en el historial');
      }
    }

    const missing = PART_A.filter((id) => !OMITTED.includes(id) && !src[id]);
    for (const id of missing) p(id, 'sin entrada en PM.exampleDocs.medellin');
    for (const id of OMITTED) if (src[id]) p(id, 'no debe existir al corte (cierre no iniciado)');
    for (const id of PART_A) {
      const t = PM.templates[id];
      const e = src[id];
      if (!e) continue;
      if (!t) { p(id, 'plantilla no registrada'); continue; }
      if (t.multiple) {
        if (e.fields !== undefined) p(id, 'plantilla múltiple con fields de nivel superior');
        if (!Array.isArray(e.instances) || e.instances.length < 1 || e.instances.length > 3) { p(id, 'se esperan 1 a 3 instancias'); continue; }
        const keys = new Set();
        e.instances.forEach((x, i) => {
          if (!x.key || keys.has(x.key)) p(id, 'instancia ' + i + ' sin key única'); keys.add(x.key);
          textOk(id, 'instancia ' + x.key + '.title', x.title);
          checkEntry(id + '--' + x.key, t, x, 'instancia ' + x.key, MAY_BE_EMPTY[id + '--' + x.key]);
        });
      } else {
        if (e.instances !== undefined) p(id, 'plantilla singleton con instancias');
        checkEntry(id, t, e, 'entrada', MAY_BE_EMPTY[id]);
      }
    }
    return { problems, stats, count: PART_A.filter((id) => src[id]).length };
  }, { PART_A, OMITTED, FIXED, CODE_RE_SRC: Object.fromEntries(Object.entries(CODE_RE).map(([k, v]) => [k, v.source])), MAY_BE_EMPTY, FACTS, CUT });
  for (const x of rep.problems) fail(x);
  ok(rep.problems.length === 0, `${rep.count} plantillas con contenido (${PART_A.length - OMITTED.length} esperadas) · ${rep.stats.docs} documentos · ${rep.stats.fields} campos · ${rep.stats.rows} filas · ${rep.stats.revs} revisiones emitidas`);

  /* ------------------------------------------------------------ 2) coherencia con el modelo del ejemplo */
  console.log('2) Coherencia con el modelo (cambios, incidentes, alcance, valor ganado)');
  const sem = await page.evaluate((PART_A) => {
    const src = PM.exampleDocs.medellin;
    const out = {};
    const ch = src['registro-cambios'].fields.cambios;
    out.cambios = ch.map((r) => [r.id, r.estado, r.impactoCosto, r.fechaDecision || null].join('|'));
    const inc = src['registro-incidentes'].fields.incidentes;
    out.incModel = inc.filter((r) => /^INC-00[1-7]$/.test(r.id)).map((r) => r.id + '|' + r.estado);
    out.incOpen = inc.filter((r) => !['Resuelto', 'Cerrado'].includes(r.estado)).map((r) => r.id);
    /* solicitudes ↔ registro (mismos pares que el editor: 20-docs CR_KEY_MAP) */
    const MAP = [['fecha', 'fechaSolicitud'], ['solicitante', 'solicitante'], ['tipo', 'tipoCambio'], ['impactoCronograma', 'diasCronograma'], ['impactoCosto', 'valorCosto'], ['estado', 'decision'], ['fechaDecision', 'fechaDecision'], ['decisor', 'decisor']];
    out.crDiffs = [];
    for (const x of src['solicitud-cambio'].instances) {
      const r = ch.find((c) => c.id === x.fields.codigoCambio);
      if (!r) { out.crDiffs.push(x.fields.codigoCambio + ': sin fila en el registro'); continue; }
      for (const [a, b] of MAP) if ((r[a] ?? '') !== (x.fields[b] ?? '')) out.crDiffs.push(x.fields.codigoCambio + '.' + a + ': ' + r[a] + ' ≠ ' + x.fields[b]);
    }
    const ea = src['enunciado-alcance'];
    const rev0 = ea.revs.find((r) => r.rev === '0');
    out.scope0 = JSON.stringify(rev0.fields).includes('Mitigación vial') || /mitigación vial/i.test(JSON.stringify(rev0.fields.entregablesAlcance));
    out.scope1 = /mitigación vial/i.test(JSON.stringify(ea.fields.entregablesAlcance));
    out.scopeDates = [rev0.date, ea.date];
    const inf = src['informe-desempeno'].instances.find((x) => x.fields.fechaCorte === '2026-09-30');
    const last = inf && inf.fields.valorGanado[inf.fields.valorGanado.length - 1];
    out.ev = last ? [last.bac, last.pv, last.ev, last.ac] : null;
    out.eac = inf && inf.fields.eacAdoptado;
    out.finPron = inf && inf.fields.fechaFinPronosticada;
    out.tbl = PM.templates['informe-desempeno'].sections.flatMap((s) => s.fields).find((f) => f.key === 'valorGanado');
    const spiCol = out.tbl.columns.find((c) => c.key === 'spi'), cpiCol = out.tbl.columns.find((c) => c.key === 'cpi');
    out.idx = last ? [spiCol.calc(last), cpiCol.calc(last)] : null;
    delete out.tbl;
    const sup = src['registro-supuestos'].fields.supuestos;
    out.sup = sup.filter((r) => /^S-(0[1-9]|1[0-2])$/.test(r.id)).map((r) => r.id + '|' + r.estado).join(',');
    out.plan = [src['plan-direccion'].rev, src['plan-direccion'].date, src['plan-direccion'].revs.map((r) => r.rev + '@' + r.date).join(',')];
    /* pronóstico al corte: ventas sostenidas (el alza del CC-004 no se incluye), utilidad 14.057 (8,67 %) en rojo */
    const f2 = inf ? inf.fields : {};
    out.forecast = {
      estado: f2.estadoGeneral,
      text: [f2.resumen, f2.analisisVariacion, f2.cambiosPeriodo, ...(f2.decisionesRequeridas || [])].join(' '),
    };
    const all = JSON.stringify(PART_A.filter((k) => src[k]).map((k) => src[k]));
    out.stale = ['16.617', '10,09 %', '2.560', '164.682', '+23,7 %'].filter((tok) => all.includes(tok));
    out.cc004 = (ch.find((r) => r.id === 'CC-004') || {}).impactoAlcance || '';
    const cn = src['caso-negocio'].fields;
    out.margin = [cn.margenEsperado, Math.round((cn.valorContrato - cn.costoEstimado) / cn.valorContrato * 10000) / 100];
    out.s04 = (sup.find((r) => r.id === 'S-04') || {}).descripcion || '';
    const req = src['documentacion-requisitos'].fields.requisitos;
    out.rq06 = (req.find((r) => r.id === 'RQ-06') || {}).requisito || '';
    out.rq02 = (req.find((r) => r.id === 'RQ-02') || {}).requisito || '';
    out.inc005 = (inc.find((r) => r.id === 'INC-005') || {}).descripcion || '';
    return out;
  }, PART_A);
  ok(sem.cambios.join(';') === 'CC-001|Rechazada|0|2025-09-30;CC-002|Aprobada|430000000|2026-03-10;CC-003|Aprobada|600000000|2026-05-19;CC-004|Aprobada|0|2026-09-25;CC-005|En análisis|600000000|', 'registro de cambios igual al modelo (CC-001 a CC-005)', sem.cambios);
  ok(sem.incModel.join(',') === 'INC-001|Cerrado,INC-002|Cerrado,INC-003|Cerrado,INC-004|Cerrado,INC-005|Resuelto,INC-006|En curso,INC-007|En curso', 'incidentes INC-001 a INC-007 con los estados del modelo', sem.incModel);
  ok(sem.incOpen.join(',') === 'INC-006,INC-007', 'incidentes abiertos al corte: INC-006 e INC-007', sem.incOpen);
  ok(sem.crDiffs.length === 0, 'cada solicitud de cambio coincide con su fila del registro (sin aviso «difiere» en el editor)', sem.crDiffs);
  ok(!sem.scope0 && sem.scope1 && sem.scopeDates.join() === '2025-04-22,2026-03-13', 'enunciado del alcance: rev. 0 (LB0) sin mitigación vial y rev. 1 (LB1) con ella', sem);
  ok(sem.ev && sem.ev.join() === '139576000000,48604248308,46668360000,48390020000' && sem.eac === 148065000000 && sem.finPron === '2029-06-29', 'informe de septiembre con el valor ganado, la EAC y el fin del modelo', sem);
  ok(sem.idx && sem.idx[0] === 0.96 && sem.idx[1] === 0.96, 'SPI y CPI calculados por la plantilla (0,96 y 0,96)', sem.idx);
  ok(sem.sup === 'S-01|Validado,S-02|Validado,S-03|Validado,S-04|Descartado,S-05|Descartado,S-06|Validado,S-07|Validado,S-08|Validado,S-09|Validado,S-10|Validado,S-11|Por validar,S-12|Por validar', 'supuestos S-01 a S-12 con los estados del modelo', sem.sup);
  ok(sem.plan.join('|') === '1|2026-03-13|0@2025-04-22,1@2026-03-13', 'plan para la dirección: rev. 0 con la LB0 y rev. 1 con la LB1', sem.plan);
  ok(/^Rojo/.test(sem.forecast.estado || '') && /14\.057/.test(sem.forecast.text) && /8,67 %/.test(sem.forecast.text) && /162\.122/.test(sem.forecast.text) && /1\.603/.test(sem.forecast.text), 'informe de septiembre: ventas sostenidas, utilidad de COP 14.057 millones (8,67 %) en rojo y alza del CC-004 fuera del pronóstico (hasta COP 1.603 millones)', sem.forecast);
  ok(sem.stale.length === 0, 'sin cifras retiradas (utilidad 16.617, 10,09 %, +2.560 sobre todas las viviendas, ventas 164.682, SMMLV +23,7 %)', sem.stale);
  ok(/1\.603/.test(sem.cc004) && /130 viviendas por vender/.test(sem.cc004), 'CC-004 en el registro: el alza aplica solo a las 130 viviendas por vender y no entra al pronóstico', sem.cc004);
  ok(sem.margin[0] === sem.margin[1], 'caso de negocio: margen esperado = (ingreso − costo estimado) ÷ ingreso', sem.margin);
  ok(/23 viviendas al mes/.test(sem.s04) && /14 al mes/.test(sem.s04) && /19,5 al mes frente a 23/.test(sem.s04), 'S-04: velocidad por etapa (23 al mes en el lanzamiento de la etapa 1 y 14 en la etapa 2)', sem.s04);
  ok(/Macroproyecto de Borde/.test(sem.rq06) && /50 %/.test(sem.rq06) && /39 VIP/.test(sem.rq06), 'RQ-06: obligación VIP con al menos 50 % dentro del Macroproyecto de Borde (art. 326)', sem.rq06);
  ok(/estudio abierto/.test(sem.rq02) && /art\. 370/.test(sem.rq02), 'RQ-02: estudio abierto que no computa como alcoba (art. 370)', sem.rq02);
  ok(/límite inferior de control del gráfico \(27,7 MPa\)/.test(sem.inc005) && /24,5 MPa/.test(sem.inc005), 'INC-005: f\'c, límite inferior de control y mínimo individual distinguidos', sem.inc005);

  /* ------------------------------------------------------------ 3) proyecto creado y documentos en el editor */
  console.log('3) Proyecto de ejemplo y documentos en el editor');
  const created = await page.evaluate(async (PART_A) => {
    const pid = await PM.createExampleProject('medellin');
    const id = pid || PM.getState().projectId;
    const docs = await PM.store.list(PM.paths.docs(id));
    const mine = docs.filter((d) => PART_A.includes(d.data.template)).map((d) => ({ id: d.id, rev: d.data.rev, status: d.data.status, template: d.data.template }));
    const bl = await PM.store.list(PM.paths.baselines(id));
    const scope = Object.fromEntries(bl.map((b) => [b.data.label, JSON.stringify((b.data.scope && b.data.scope.scopeStatement) || null)]));
    const revs = {};
    for (const d of mine) { const r = await PM.store.list(PM.paths.revs(id, d.id)); if (r.length) revs[d.id] = r.map((x) => x.data.rev).sort().join(','); }
    const created = Object.fromEntries(docs.filter((d) => PART_A.includes(d.data.template)).map((d) => [d.id, String(d.data.createdAt || '').slice(0, 10)]));
    return { pid: id, mine, scope, revs, created };
  }, PART_A);
  ok(created.pid && created.mine.length === 26, 'documentos de la parte a creados en el proyecto: ' + created.mine.length + ' (21 plantillas, 26 documentos)', created.mine.map((d) => d.id));
  ok(/Mitigación vial/.test(created.scope.LB1 || '') && created.scope.LB0 && created.scope.LB0 !== 'null' && !/Mitigación vial/.test(created.scope.LB0), 'línea base del alcance: LB0 con el enunciado rev. 0 y LB1 con el rev. 1', Object.keys(created.scope));
  ok(created.revs['enunciado-alcance'] === '0,1' && created.revs['registro-supuestos'] === '0,1' && created.revs['matriz-trazabilidad'] === '0,1', 'revisiones emitidas importadas', created.revs);
  ok(created.revs['entregables'] === 'A,B' && created.revs['registro-incidentes'] === 'A,B' && created.revs['registro-cambios'] === 'A,B' && created.revs['registro-lecciones'] === 'A', 'registros vivos con sus emisiones anteriores (A, B)', created.revs);
  ok(created.created['entregables'] === '2025-12-19' && created.created['registro-cambios'] === '2025-09-30' && created.created['registro-incidentes'] === '2025-12-19' && created.created['registro-lecciones'] === '2026-03-13', 'registros vivos creados en la fecha de su primera emisión', created.created);

  if (shots) mkdirSync(shots, { recursive: true });
  const BAD = /\bundefined\b|\bNaN\b|\[object Object\]/;
  const rendered = [];
  for (const d of created.mine) {
    const before = errors.length;
    await page.evaluate((id) => PM.openDocument(id), d.id);
    try {
      await page.waitForSelector(`.page[data-doc-id="${d.id}"] .docs-rev[data-rev="${d.rev}"]`, { timeout: 8000 });
      await page.waitForTimeout(250);
    } catch (e) { fail(d.id + ': el editor no mostró la revisión ' + d.rev); continue; }
    const info = await page.evaluate((id) => {
      const host = document.querySelector('.view-host') || document.body;
      const txt = host.innerText;
      const inputs = [...host.querySelectorAll('input, textarea, select')].map((el) => el.value || '').join('\n');
      return { txt, inputs, len: txt.length, fields: host.querySelectorAll('[data-field]').length, chip: (document.querySelector('.docs-bar-info') || {}).innerText || '', regLink: (document.querySelector('[data-callout="registro-cambios"]') || {}).dataset ? document.querySelector('[data-callout="registro-cambios"]') && document.querySelector('[data-callout="registro-cambios"]').dataset.link : null };
    }, d.id);
    const cards = await errorCards(page);
    const bad = (info.txt + '\n' + info.inputs).match(BAD);
    const newErrors = errors.slice(before);
    if (cards.length) fail(d.id + ': tarjeta de error ' + cards[0].slice(0, 200));
    if (bad) fail(d.id + ': texto inválido en el documento «' + bad[0] + '»');
    if (newErrors.length) fail(d.id + ': errores de consola ' + newErrors.join(' | ').slice(0, 300));
    if (d.template === 'solicitud-cambio' && info.regLink !== 'ok') fail(d.id + ': la solicitud no coincide con el registro de cambios (' + info.regLink + ')');
    rendered.push({ id: d.id, len: info.len, fields: info.fields });
    if (shots) await page.screenshot({ path: join(shots, d.id + (dark ? '-dark' : '') + '.png'), fullPage: true });
  }
  ok(rendered.length === created.mine.length && rendered.every((r) => r.fields > 0 && r.len > 800), 'cada documento abre en el editor con su contenido (' + rendered.length + ' documentos)', rendered.filter((r) => !(r.fields > 0 && r.len > 800)));
  ok(errors.length === 0, 'sin errores de consola', errors.slice(0, 5));
} catch (e) {
  fail('excepción: ' + (e.stack || e.message));
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} fallas` : '\nTodo en orden');
process.exit(failures ? 1 : 0);

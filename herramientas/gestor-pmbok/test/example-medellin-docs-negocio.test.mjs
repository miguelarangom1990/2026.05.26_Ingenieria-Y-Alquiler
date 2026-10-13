// Valida los documentos de negocio del ejemplo «medellin» para las plantillas de 15-templates-negocio.js
// (src/98-example-medellin-docs-negocio.js): contrato de PM.exampleDocs.medellin contra PM.templates, cifras iguales a
// los datos del ejemplo (caso de negocio, plan de gestión de los beneficios, acta de constitución, registro de cambios,
// modelo), fechas coherentes con la cronología, documentos en el proyecto creado, interacción real (selector de
// ejemplos → Documentos → abrir con el teclado) y revisión en tema oscuro y a 400 px.
// Regresiones de la auditoría: la forma de pago no bloquea «el resto del presupuesto» antes de la decisión de inversión
// (hay costos reales fuera de la fase de estructuración); la decisión de inversión no es un otrosí ni origina una
// revisión; la fiduciaria no figura entre quienes otorgan pólizas; el acta del 10-01-2025 (viernes) es extraordinaria y
// sigue la numeración JD-AAAA-MME; la afectación de los compradores no es tautológica.
// Uso: node test/example-medellin-docs-negocio.test.mjs --file <ruta.html> [--shots dir]
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, root, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const IDS = ['evaluacion-necesidades', 'acuerdo-cliente'];
/* Posterior al cierre: el proyecto no ha cerrado al corte (2026-09-30). */
const OMITTED = ['informe-beneficios'];
/* Tablas que pueden quedar vacías en una revisión emitida (documento@revisión: claves). */
const MAY_BE_EMPTY = { 'acuerdo-cliente@0': ['modificaciones'] };
/* Fechas planificadas (no son hechos): pueden pasar la fecha de corte. Las demás fechas (firmas, decisiones, modificaciones,
   aprobaciones, emisiones) no. */
const PLANNED = ['fechaTerminacion'];
/* Hechos con la fecha en que se conocieron: un documento aprobado (o una revisión emitida) no los cita antes. */
const FACTS = [
  ['CC-001', '2025-09-15'], ['CC-002', '2026-01-19'], ['CC-003', '2026-05-12'], ['CC-004', '2026-09-21'], ['CC-005', '2026-09-28'],
  ['CT-0', '2025-01-14'], ['Fiduciaria Andina', '2025-04-25'], ['Fideicomiso Atalaya', '2025-04-30'], ['Banco Comercial del Valle', '2026-02-13'],
  ['acta de constitución', '2025-01-13'], ['LB0', '2025-04-22'], ['LB1', '2026-03-13'], ['acta de junta de abril de 2025', '2025-04-22'], ['orden de cambio No. 1', '2026-03-10'],
  ['JD-2025-01E', '2025-01-10'],
  ['mitigación vial', '2025-12-15'], ['16 de marzo de 2026', '2026-01-19'], ['deslizamiento', '2026-05-07'], ['Decreto 1469 de 2025', '2025-12-30'], ['Resolución 0194 de 2025', '2025-04-23'],
  /* cifras de diseño que salen de la prefactibilidad del caso de negocio (10 de enero de 2025) */
  ['416 viviendas', '2025-01-10'], ['104 VIS', '2025-01-10'], ['COP 24.000 millones', '2025-01-10'], ['143.339', '2025-01-10'],
];
const MODEL_MD = join(root, 'docs/ejemplo-medellin/modelo-del-proyecto.md');
const modelText = existsSync(MODEL_MD) ? readFileSync(MODEL_MD, 'utf8') : '';

let failures = 0;
const fail = (m) => { failures++; console.log('FAIL ' + m); };
const ok = (c, m, extra) => { if (c) console.log('  ok ' + m); else fail(m + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 700) : '')); };
const plain = (t) => String(t || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------------ 1–3) contrato, cifras y fechas (en la página) */
{
  const { browser, page, errors } = await openApp({ file, width: 1440, height: 1000 });
  try {
    console.log('1) Contrato de PM.exampleDocs.medellin (documentos de negocio)');
    const rep = await page.evaluate(({ IDS, OMITTED, MAY_BE_EMPTY, FACTS, PLANNED }) => {
      const problems = [];
      const p = (id, m) => problems.push(id + ': ' + m);
      const src = (PM.exampleDocs && PM.exampleDocs.medellin) || {};
      const CUT = PM.getExample('medellin').facts().statusDate;
      const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bTODO\b|\bXXX\b|[Ll]orem ipsum|\bnull\b/;
      const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && PM.date.valid(v);
      const optVals = (opts) => (opts || []).map((o) => String(typeof o === 'object' ? o.value : o));
      const fieldsOf = (t) => { const m = new Map(); for (const s of t.sections || []) for (const f of s.fields || []) m.set(f.key, f); return m; };
      const textOk = (id, where, v) => { if (typeof v !== 'string' || !v.trim()) p(id, where + ' texto vacío o no es texto'); else if (BAD.test(v)) p(id, where + ' contiene texto prohibido: ' + v.match(BAD)[0]); };
      const stats = { docs: 0, fields: 0, rows: 0, revs: 0 };
      function checkCell(id, where, c, v, row) {
        if (c.type === 'calc') { if (row && Object.prototype.hasOwnProperty.call(row, c.key)) p(id, where + '.' + c.key + ' no debe guardarse (columna calculada)'); return; }
        if (v === undefined || v === null || v === '') return;
        if (c.type === 'text' || c.type === 'textarea') textOk(id, where + '.' + c.key, v);
        else if (c.type === 'number' || c.type === 'money' || c.type === 'pct') { if (typeof v !== 'number' || !Number.isFinite(v)) p(id, where + '.' + c.key + ' debe ser número'); }
        else if (c.type === 'date') { if (!isDate(v)) p(id, where + '.' + c.key + ' fecha inválida: ' + v); else if (v > CUT) p(id, where + '.' + c.key + ' posterior al corte'); }
        else if (c.type === 'select') { if (!optVals(c.options).includes(String(v))) p(id, where + '.' + c.key + ' fuera de las opciones: ' + v); }
        else if (c.type === 'check') { if (typeof v !== 'boolean') p(id, where + '.' + c.key + ' debe ser booleano'); }
      }
      function checkFields(id, t, fields, where, mayBeEmpty) {
        const keys = fieldsOf(t);
        if (!fields || typeof fields !== 'object' || Array.isArray(fields)) { p(id, where + ': fields debe ser un objeto'); return; }
        for (const k of keys.keys()) if (!(k in fields)) p(id, where + ': falta el campo ' + k);
        for (const [k, v] of Object.entries(fields)) {
          const f = keys.get(k);
          if (!f) { p(id, where + ': clave desconocida ' + k); continue; }
          stats.fields++;
          const w = where + '.' + k;
          if (f.type === 'text' || f.type === 'textarea') textOk(id, w, v);
          else if (f.type === 'number' || f.type === 'money' || f.type === 'pct') {
            if (typeof v !== 'number' || !Number.isFinite(v)) p(id, w + ' debe ser número');
            else if (f.type === 'pct' && (v < (f.min ?? 0) || v > (f.max ?? 100))) p(id, w + ' fuera de rango');
          } else if (f.type === 'date') { if (!isDate(v)) p(id, w + ' fecha inválida: ' + v); else if (v > CUT && !PLANNED.includes(k)) p(id, w + ' posterior al corte'); }
          else if (f.type === 'select') { if (!optVals(f.options).includes(String(v))) p(id, w + ' fuera de las opciones: ' + v); }
          else if (f.type === 'list') { if (!Array.isArray(v) || !v.length) p(id, w + ' debe ser una lista con elementos'); else v.forEach((x, i) => textOk(id, w + '[' + i + ']', x)); }
          else if (f.type === 'table') {
            if (!Array.isArray(v)) { p(id, w + ' debe ser una tabla'); continue; }
            if (!v.length && !(mayBeEmpty || []).includes(k)) { p(id, w + ' debe tener filas'); continue; }
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
                checkCell(id, rw, c, row[c.key], row);
                if (c.type === 'calc') {
                  try {
                    const out = c.calc(row, v, { currency: 'COP', rows: v, index: i });
                    if (typeof out === 'number' && !Number.isFinite(out)) p(id, rw + '.' + c.key + ' calcula un número inválido');
                    if (c.format) { const s = String(c.format(out, row, { currency: 'COP' })); if (/NaN|undefined|\[object/.test(s)) p(id, rw + '.' + c.key + ' formato inválido: ' + s); }
                  } catch (e) { p(id, rw + '.' + c.key + ' calc falla: ' + e.message); }
                }
              }
            });
          } else p(id, w + ' tipo de campo no soportado ' + f.type);
        }
      }
      const lc = (o) => JSON.stringify(o).toLowerCase();
      function checkDated(id, where, date, fields) {
        const s = lc(fields);
        for (const [tok, d] of FACTS) if (s.includes(tok.toLowerCase()) && d > date) p(id, where + ' (' + date + ') cita «' + tok + '», conocido el ' + d);
      }
      for (const id of IDS) {
        const t = PM.templates[id];
        const e = src[id];
        if (!t) { p(id, 'plantilla no registrada'); continue; }
        if (!e) { p(id, 'sin entrada en PM.exampleDocs.medellin'); continue; }
        if (t.multiple || e.instances !== undefined) p(id, 'debe ser una plantilla única con una entrada');
        stats.docs++;
        if (e.status !== 'aprobado') p(id, 'debe estar aprobado (documento de negocio emitido)');
        if (typeof e.rev !== 'string' || !/^\d+$/.test(e.rev)) p(id, 'revisión aprobada sin número: ' + e.rev);
        if (!isDate(e.date) || e.date > CUT) p(id, 'fecha inválida o posterior al corte: ' + e.date);
        for (const [k, v] of Object.entries(e.titleBlock || {})) {
          if (!['elaboro', 'reviso', 'aprobo', 'fechaAprobacion'].includes(k)) p(id, 'titleBlock con clave desconocida ' + k);
          else if (k === 'fechaAprobacion' ? !(v === null || isDate(v)) : typeof v !== 'string' || !v) p(id, 'titleBlock.' + k + ' inválido');
        }
        checkFields(id, t, e.fields, 'entrada', MAY_BE_EMPTY[id + '@' + e.rev]);
        checkDated(id, 'entrada', e.date, e.fields);
        if (e.revs !== undefined) {
          if (!Array.isArray(e.revs) || !e.revs.length) { p(id, 'revs debe ser una lista'); continue; }
          let prev = '';
          e.revs.forEach((r, i) => {
            stats.revs++;
            const rw = 'revs[' + i + ']';
            if (!isDate(r.date)) p(id, rw + ' fecha inválida'); else { if (r.date <= prev) p(id, rw + ' fuera de orden'); prev = r.date; if (r.date > e.date) p(id, rw + ' posterior a la entrada'); }
            if (r.status !== 'aprobado' || String(r.rev) !== String(i)) p(id, rw + ' debe ser la revisión aprobada ' + i);
            textOk(id, rw + '.note', r.note);
            if (r.fields) checkFields(id, t, r.fields, rw, MAY_BE_EMPTY[id + '@' + r.rev]);
            checkDated(id, rw, r.date, r.fields || e.fields);
          });
          const last = e.revs[e.revs.length - 1];
          if (!(last.rev === e.rev && last.date === e.date)) p(id, 'la última revisión emitida debe ser la vigente (' + e.rev + ', ' + e.date + ')');
        } else if (e.rev !== '0') p(id, 'revisión ' + e.rev + ' sin historial de revisiones');
      }
      for (const id of OMITTED) if (src[id]) p(id, 'no debe existir al corte (el proyecto no ha cerrado)');
      return { problems, stats };
    }, { IDS, OMITTED, MAY_BE_EMPTY, FACTS, PLANNED });
    for (const x of rep.problems) fail(x);
    ok(rep.problems.length === 0, `${IDS.length} documentos de negocio · ${rep.stats.fields} campos · ${rep.stats.rows} filas · ${rep.stats.revs} revisiones emitidas; sin informe de realización de los beneficios (proyecto sin cerrar)`);

    console.log('2) Cifras iguales a los datos del ejemplo');
    const c = await page.evaluate(({ modelText }) => {
      const ex = PM.getExample('medellin');
      const F = ex.facts();
      const built = ex.build({ today: PM.date.today() });
      const project = built.project;
      const src = PM.exampleDocs.medellin;
      const caso = src['caso-negocio'].fields, acta = src['acta-constitucion'].fields, pb = src['plan-gestion-beneficios'].fields;
      const cambios = src['registro-cambios'].fields.cambios;
      const ev = src['evaluacion-necesidades'].fields, ac = src['acuerdo-cliente'].fields;
      const col = (tid, field, key) => PM.templates[tid].sections.flatMap((s) => s.fields).find((f) => f.key === field).columns.find((x) => x.key === key);
      const out = {};
      const dias = PM.date.diff(project.start, project.end) + 1;
      out.valor = [ac.valorInicial, project.budget, acta.presupuesto, caso.costoEstimado, F.budget.presupuesto * 1e6];
      out.fechas = [ac.fechaInicio, project.start, acta.fechaInicio, F.start, ac.fechaTerminacion, project.end, acta.fechaFin, F.end];
      out.plazo = { dias, txt: ac.plazo, chip: ex.summary.join(' · ') };
      out.plazoOk = ac.plazo.startsWith(PM.fmt.num(dias, 0) + ' días calendario') && /4,2 años/.test(ac.plazo) && ex.summary.includes('4,2 años');
      out.interno = [ac.tipoAcuerdo, ac.modalidadPrecio, ac.baseValor, ac.anticipoPct, ac.anticipoValor, ac.retencionPct];
      out.polizas = ac.polizas.map((r) => [r.id, r.estado, r.valorBase ?? null, r.porcentaje ?? null].join('|'));
      out.contratante = ac.contratante.startsWith(project.client);
      /* modificaciones: efectos, acumulados calculados por la plantilla y relación con el registro de cambios */
      const vAc = col('acuerdo-cliente', 'modificaciones', 'valorAcumulado'), pAc = col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado');
      out.mods = ac.modificaciones.map((r) => [r.numero, r.tipo, r.fecha, r.solicitudCambio || '', r.efectoValor, r.efectoPlazo, vAc.calc(r, ac.modificaciones), pAc.calc(r, ac.modificaciones), r.estado].join('|'));
      const cc2 = cambios.find((x) => x.id === 'CC-002') || {};
      const oc = ac.modificaciones.find((r) => r.solicitudCambio === 'CC-002') || {};
      out.cc002 = { reg: [cc2.estado, cc2.fechaDecision, cc2.impactoCosto], oc: [oc.estado, oc.fecha], txt: oc.objeto };
      out.cc002Ok = cc2.estado === 'Aprobada' && oc.estado === 'Firmada' && oc.fecha === cc2.fechaDecision && oc.objeto.includes('COP ' + PM.fmt.num(cc2.impactoCosto / 1e6, 0) + ' millones') && /mitigación vial/i.test(cc2.descripcion) && oc.objeto.includes(PM.fmt.num(project.budget / 1e6, 0));
      /* hallazgo 2: la decisión de inversión cumple una condición pactada; no es un otrosí ni una fila de modificaciones.
         Cada modificación sale de una solicitud aprobada del registro de cambios, con la fecha de su decisión. */
      const com = src['registro-comunicaciones'].fields.comunicaciones;
      const com2 = com.find((x) => x.id === 'COM-002') || {};
      const acTxt = (f) => JSON.stringify(f);
      const allFields = [ac, ...src['acuerdo-cliente'].revs.map((r) => r.fields || ac)];
      out.decision = { com2: [com2.fecha, com2.referencia], tipos: ac.modificaciones.map((r) => r.tipo), docs: ac.documentosContractuales.filter((x) => /decisión de inversión/.test(x)) };
      out.decisionOk = com2.fecha === F.lb0Date && /decisión de inversión/.test(com2.asunto) && !!com2.referencia
        && ac.modificaciones.every((r) => r.tipo !== 'Otrosí' && !!r.solicitudCambio && cambios.some((x) => x.id === r.solicitudCambio && x.estado === 'Aprobada' && x.fechaDecision === r.fecha))
        && allFields.every((f) => !/otrosí No\.|Otrosí/.test(acTxt(f.modificaciones)) && !/otrosí/i.test(f.controlModificaciones))
        && out.decision.docs.length === 1 && out.decision.docs[0].toLowerCase().includes(com2.referencia.toLowerCase()) && out.decision.docs[0].includes('22 de abril de 2025')
        && /decisión de inversión[^.]*se registran en el acta de la junta y tampoco lo modifican/.test(ac.controlModificaciones);
      /* hallazgo 1: antes de la decisión de inversión hay costos reales fuera de la fase de estructuración (E01 a E04: debida
         diligencia, arras, mercado y factibilidad), así que el acuerdo no puede bloquear «el resto del presupuesto»; el
         gerente contrata con los límites del acta (contratos de más de COP 1.000 millones con aprobación de la junta). */
      const tools = built.collections.tools;
      const actuals = tools.find((t) => t.id === 'costs').data.actuals;
      const tasks = tools.find((t) => t.id === 'schedule').data.tasks;
      const pre = actuals.filter((a) => a.date < F.lb0Date && !/^E0[1-4]$/.test(a.taskId));
      const contratos = src['registro-adquisiciones'].fields.contratos;
      const ctv = (n) => (contratos.find((x) => x.numero === n) || {}).valor || 0;
      const limTok = (acta.responsabilidadAutoridad.match(/contratos de más de (COP [\d.]+ millones)/) || [])[1] || '';
      const e06 = tasks.find((t) => t.id === 'E06') || {};
      const allTxt = allFields.map((f) => acTxt(f)).join(' ') + ' ' + src['acuerdo-cliente'].revs.map((r) => r.note).join(' ');
      out.fase = { preLb0: Math.round(pre.reduce((s, a) => s + a.amount, 0) / 1e6), tareas: [...new Set(pre.map((a) => a.taskId))].sort(), estructuracion: (ctv('CT-001') + ctv('CT-002') + ctv('CT-003')) / 1e6, limTok, ct004: [ctv('CT-004') / 1e6, (contratos.find((x) => x.numero === 'CT-004') || {}).fechaInicio] };
      out.faseOk = out.fase.preLb0 > 0 && out.fase.estructuracion === 420 && !/resto del presupuesto|libera el resto/i.test(allTxt)
        && !!limTok && ac.formaPago.includes('los contratos de más de ' + limTok + ' requieren aprobación de la junta')
        && out.fase.ct004[0] > 1000 && out.fase.ct004[1] < F.lb0Date
        && /dentro del presupuesto asignado/.test(ac.formaPago) && /inicio de los diseños/.test(ac.formaPago)
        && /COP 12\.000 millones/.test(e06.name || '') && ac.formaPago.includes('80 % del lote con la escritura (COP 12.000 millones)');
      out.fuentes = ['420 millones', '3.000 millones', '24.000 millones', '56.000 millones'].map((tok) => ac.formaPago.includes(tok) && (JSON.stringify(acta).includes(tok) || JSON.stringify(caso).includes(tok)));
      out.limiteGerente = ac.controlModificaciones.includes('COP ' + PM.fmt.num(acta.limiteGasto / 1e6, 0) + ' millones');
      /* hallazgo 3: la fiduciaria (CT-011, pólizas «No aplica», entidad vigilada) no está entre quienes otorgan pólizas */
      const pol = (n) => { const x = contratos.find((y) => y.numero === n) || {}; return [x.polizaCumplimiento, x.polizaCalidad, x.polizaRce]; };
      const otorgan = (ac.multas.match(/los ([^:;.]*) otorgan pólizas/) || [])[1] || '';
      out.polizasTerceros = { otorgan, ct011: pol('CT-011'), ct012: pol('CT-012'), ct015: pol('CT-015') };
      out.polizasTercerosOk = pol('CT-011').every((v) => v === 'No aplica') && /vigilada por la Superintendencia Financiera/.test((contratos.find((y) => y.numero === 'CT-011') || {}).observaciones || '')
        && !!otorgan && !/fiduciaria/.test(otorgan) && /comercializadora/.test(otorgan) && /constructor/.test(otorgan)
        && pol('CT-012').includes('Aprobada') && pol('CT-015').includes('Aprobada')
        && /la fiduciaria es una entidad vigilada por la Superintendencia Financiera y su contrato no las exige/.test(ac.multas)
        && !/\([^)]*fiduciaria[^)]*\)/.test(ac.multas) && !/se exigen a los contratistas en sus contratos/.test(ac.otrasClausulas);
      /* evaluación: brechas con las líneas base y metas del plan de gestión de los beneficios; opciones del caso de negocio */
      const bCol = col('evaluacion-necesidades', 'brechas', 'brecha');
      out.brechas = ev.brechas.map((r) => bCol.calc(r));
      const pbTxt = JSON.stringify(pb);
      out.brechasPb = ev.brechas.filter((r) => typeof r.valorActual === 'number' && r.valorActual % 1 !== 0).every((r) => pbTxt.includes(PM.fmt.num(r.valorActual, 1)) && pbTxt.includes(PM.fmt.num(r.valorDeseado, 1)));
      out.opciones = ev.opciones.map((r) => r.opcion);
      out.casoOpciones = caso.opciones.map((r) => r.opcion);
      out.opcionesOk = out.opciones[0] === out.casoOpciones[0] && out.opciones[1] === out.casoOpciones[1] && out.opciones[2].startsWith('Hacer más: desarrollo integral') && out.casoOpciones[2].startsWith('Hacer más: desarrollo integral') && ev.opciones.every((r) => r.pasaCaso === true) && out.casoOpciones.some((o) => /una sola etapa/.test(o)) && /una y en dos etapas/.test(ev.recomendacion);
      out.objetivosOk = caso.alineacion.startsWith(ev.objetivosOrganizacion);
      /* hallazgo 5: la afectación de los compradores dice cómo los afecta la necesidad, con hechos del caso de negocio */
      const comp = ev.afectados.find((r) => /compradores potenciales/.test(r.interesado)) || {};
      out.compradores = comp.afectacion;
      out.compradoresOk = !/^Demanda/.test(comp.afectacion || '') && ['obliga a productos de mayor precio', 'segmento con mayor demanda del occidente de la ciudad'].every((t) => caso.necesidad.includes(t) && (comp.afectacion || '').includes(t));
      out.lote = [/50\.000 m²/.test(ev.problema) && /COP 15\.000 millones/.test(ev.problema) && /COP 300\.000\/m²/.test(ev.problema), /50\.000 m²/.test(caso.necesidad) && /COP 15\.000 millones/.test(caso.necesidad)];
      /* toda cifra de los textos está en los datos del ejemplo (documentos 92/93, ficha del proyecto, modelo) o es el plazo calculado */
      const mine = new Set(['evaluacion-necesidades', 'acuerdo-cliente']);
      const corpus = JSON.stringify(Object.entries(src).filter(([k]) => !mine.has(k)).map(([, v]) => v)) + ' ' + project.description + ' ' + ex.summary.join(' ') + ' ' + modelText;
      const texts = [];
      const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
      for (const id of mine) { walk(src[id].fields); (src[id].revs || []).forEach((r) => { walk(r.fields || {}); walk(r.note); }); }
      const allowed = new Set([PM.fmt.num(dias, 0)]);
      const missing = new Set();
      for (const t of texts) {
        const s = t.replace(/\b(19|20)\d{2}\b/g, ' ');
        for (const m of s.matchAll(/\d+(?:[.,]\d+)*/g)) { const tok = m[0]; if (!allowed.has(tok) && !corpus.includes(tok)) missing.add(tok); }
      }
      out.missing = [...missing];
      return out;
    }, { modelText });
    ok(c.valor.every((v) => v === 143339e6), 'acuerdo: presupuesto asignado = presupuesto del proyecto = acta de constitución = costo estimado del caso de negocio (COP 143.339 millones)', c.valor);
    ok(c.fechas.slice(0, 4).every((d) => d === '2025-01-13') && c.fechas.slice(4).every((d) => d === '2029-03-28'), 'acuerdo: inicio y terminación iguales a los del proyecto y del acta de constitución', c.fechas);
    ok(c.plazoOk && c.plazo.dias === 1536, 'acuerdo: plazo de ' + c.plazo.dias + ' días calendario calculado con PM.date (unos 4,2 años, como el resumen del ejemplo)', c.plazo);
    ok(JSON.stringify(c.interno) === JSON.stringify(['Acuerdo interno o memorando de entendimiento', 'Presupuesto interno asignado', 'No aplica (acuerdo interno)', 0, 0, 0]) && c.contratante, 'acuerdo interno de la junta con la gerencia del proyecto: presupuesto interno, sin anticipo ni retención; contratante = cliente del proyecto (el promotor)', c.interno);
    ok(c.polizas.join(',') === 'poliza-1|No aplica||,poliza-2|No aplica||,poliza-3|No aplica||', 'pólizas: los tres amparos por defecto marcados «No aplica» (acuerdo interno)', c.polizas);
    ok(JSON.stringify(c.mods) === JSON.stringify(['Orden de cambio No. 1|Orden de cambio|2026-03-10|CC-002|0|0|0|0|Firmada']), 'modificaciones: solo la orden de cambio No. 1 (CC-002), sin efecto en el valor ni en el plazo (acumulados calculados en 0)', c.mods);
    ok(c.cc002Ok, 'orden de cambio No. 1 = CC-002 del registro de cambios (aprobado el 10 de marzo de 2026, COP 430 millones de la reserva para contingencias, presupuesto sin cambio)', c.cc002);
    ok(c.decisionOk, 'la decisión de inversión (COM-002, acta de junta de abril de 2025) cumple una condición pactada: no es otrosí ni modificación; entra a los documentos del acuerdo y el control de modificaciones lo dice', c.decision);
    ok(c.faseOk, 'forma de pago: COP 420 millones (CT-001 a CT-003) más la gerencia, la gestión y el inicio de los diseños dentro del presupuesto, con el límite de contratación del acta; sin bloquear «el resto del presupuesto» (COP ' + c.fase.preLb0 + ' millones reales fuera de E01 a E04 antes de la LB0)', c.fase);
    ok(c.polizasTercerosOk, 'multas y garantías: otorgan pólizas los consultores, la comercializadora y el constructor; la fiduciaria (CT-011, «No aplica») no', c.polizasTerceros);
    ok(c.compradoresOk, 'evaluación: la afectación de los compradores dice cómo los afecta la necesidad, con hechos del caso de negocio', c.compradores);
    ok(c.fuentes.every(Boolean) && c.limiteGerente, 'forma de pago y control de modificaciones con las cifras del acta y del caso de negocio (420, 3.000, 24.000 y 56.000 millones; límite del gerente de 300 millones)', c.fuentes);
    ok(JSON.stringify(c.brechas) === JSON.stringify([1, null, 1, 0.2, -0.8]) && c.brechasPb, 'evaluación: brechas calculadas por la plantilla con las líneas base y metas del plan de gestión de los beneficios (4,1 → 4,3 y 2,3 → 1,5)', c.brechas);
    ok(c.opcionesOk, 'evaluación: opciones del caso de negocio (no hacer nada, súper lotes y desarrollo integral en una o dos etapas), todas pasan al caso', [c.opciones, c.casoOpciones]);
    ok(c.objetivosOk && c.lote.every(Boolean), 'evaluación: objetivos del plan estratégico y datos del lote iguales a los del caso de negocio', c.lote);
    ok(c.missing.length === 0, 'toda cifra de los textos está en los datos del ejemplo o es el plazo calculado', c.missing);

    console.log('3) Fechas coherentes con la cronología del proyecto');
    const d = await page.evaluate(() => {
      const F = PM.getExample('medellin').facts();
      const src = PM.exampleDocs.medellin;
      const caso = src['caso-negocio'], acta = src['acta-constitucion'];
      const ev = src['evaluacion-necesidades'], ac = src['acuerdo-cliente'];
      const dow = (s) => new Date(s + 'T12:00:00Z').getUTCDay();
      const day = (s) => Number(s.slice(8, 10));
      const out = {};
      out.ev = [ev.fields.fechaEvaluacion, ev.fields.fechaDecision, ev.date, caso.date, ev.rev, ev.revs === undefined];
      out.evOk = ev.fields.fechaEvaluacion < ev.fields.fechaDecision && ev.fields.fechaDecision === ev.date && ev.date < caso.date && ev.fields.decision === 'Elaborar el caso de negocio' && ev.rev === '0' && ev.revs === undefined && ev.titleBlock.aprobo === caso.titleBlock.aprobo;
      /* la junta sesiona el segundo martes de cada mes */
      out.sesion = [ev.fields.fechaDecision, dow(ev.fields.fechaDecision), day(ev.fields.fechaDecision)];
      out.sesionOk = dow(ev.fields.fechaDecision) === 2 && day(ev.fields.fechaDecision) >= 8 && day(ev.fields.fechaDecision) <= 14;
      const firma = ac.fields.fechaFirma;
      out.ac = { firma, firmas: ac.fields.firmas.map((r) => r.fecha), revs: ac.revs.map((r) => r.rev + '@' + r.date), caso: caso.date, acta: acta.date, lb0: F.lb0Date, lb1: F.lb1Date };
      out.acOk = firma === ac.revs[0].date && ac.fields.firmas.every((r) => r.fecha === firma) && caso.date <= firma && firma <= acta.date
        && ac.revs.map((r) => r.date).join() === [firma, F.lb1Date].join() && ac.date === F.lb1Date && ac.rev === '1' && ac.date <= F.statusDate
        && !ac.revs.some((r) => r.date === F.lb0Date);
      /* hallazgo 4: el acta que origina el acuerdo usa la numeración de las actas de junta (JD-AAAA-MM y «E» si es
         extraordinaria, como JD-2026-09E del registro de comunicaciones) y dice si la sesión fue ordinaria (segundo martes)
         o extraordinaria según la fecha de la firma */
      const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const m = ac.fields.numeroAcuerdo.match(/^Acta JD-(\d{4})-(\d{2})(E?) — sesión (ordinaria|extraordinaria) de la junta directiva del (\d{1,2}) de ([a-z]+) de (\d{4}) \(ficticia\)$/);
      const segundoMartes = (s) => dow(s) === 2 && day(s) >= 8 && day(s) <= 14;
      const conv = src['registro-comunicaciones'].fields.comunicaciones.filter((x) => /^Acta JD-\d{4}-\d{2}E$/.test(x.referencia || ''));
      out.acta = { num: ac.fields.numeroAcuerdo, firma, dow: dow(firma), conv: conv.map((x) => x.referencia + ' · ' + x.fecha) };
      out.actaOk = !!m && [m[7], String(MESES.indexOf(m[6]) + 1).padStart(2, '0'), m[5].padStart(2, '0')].join('-') === firma && m[1] === firma.slice(0, 4) && m[2] === firma.slice(5, 7)
        && (segundoMartes(firma) ? m[3] === '' && m[4] === 'ordinaria' : m[3] === 'E' && m[4] === 'extraordinaria')
        && conv.length > 0 && conv.every((x) => /^Sesión extraordinaria/.test(x.asunto) && x.referencia.slice(5, 15) === 'JD-' + x.fecha.slice(0, 4) + '-' + x.fecha.slice(5, 7))
        && ac.revs.every((r) => ((r.fields || ac.fields).documentosContractuales[0] || '').startsWith('Acta JD-' + m[1] + '-' + m[2] + m[3] + ' (sesión ' + m[4] + ' de la junta directiva del ' + m[5] + ' de ' + m[6] + ' de ' + m[7] + ')'))
        && /sesión extraordinaria \(Acta JD-/.test(ac.revs[0].note);
      /* cada revisión trae las modificaciones firmadas hasta su fecha, y ninguna posterior */
      const revFields = ac.revs.map((r) => r.fields || ac.fields);
      out.modsPorRev = revFields.map((f) => f.modificaciones.map((m) => m.fecha).join(','));
      out.modsOk = revFields.every((f, i) => f.modificaciones.length === i && f.modificaciones.every((m) => m.fecha <= ac.revs[i].date && (i === 0 || m.fecha > ac.revs[i - 1].date || revFields[i - 1].modificaciones.some((x) => JSON.stringify(x) === JSON.stringify(m)))));
      /* documentos del acuerdo: el acta de constitución entra desde la rev. 1, y el plan con la LB1 en la rev. 2 */
      out.docsRev = revFields.map((f) => [f.documentosContractuales.some((x) => /Acta de constitución/.test(x)), f.documentosContractuales.some((x) => /LB1/.test(x))]);
      return out;
    });
    ok(d.evOk, 'evaluación: presentada el 6 y decidida el 10 de diciembre de 2024, antes del caso de negocio (10 de enero de 2025); rev. 0 aprobada por la junta, sin reemisiones', d.ev);
    ok(d.sesionOk, 'evaluación: la decisión cae en la sesión ordinaria de la junta (segundo martes del mes)', d.sesion);
    ok(d.acOk, 'acuerdo: firmado con la aprobación del caso de negocio y antes del acta de constitución; rev. 0 (firma) y rev. 1 vigente (LB1, orden de cambio No. 1), anterior al corte; la decisión de inversión no origina revisión', d.ac);
    ok(d.actaOk, 'acuerdo: el acta del ' + d.acta.firma + ' (día ' + d.acta.dow + ' de la semana, no es el segundo martes) es extraordinaria y usa la numeración JD-AAAA-MME de las actas de junta', d.acta);
    ok(d.modsOk && d.modsPorRev.join(';') === ';2026-03-10', 'acuerdo: cada revisión trae solo las modificaciones firmadas hasta su fecha', d.modsPorRev);
    ok(JSON.stringify(d.docsRev) === JSON.stringify([[false, false], [true, true]]), 'acuerdo: los documentos contractuales siguen la cronología (acta de constitución y plan con la LB1 desde la rev. 1)', d.docsRev);
    ok(errors.length === 0, 'sin errores de consola', errors.slice(0, 5));
  } catch (e) {
    fail('excepción: ' + (e.stack || e.message));
  } finally { await browser.close(); }
}

/* ------------------------------------------------------------------ 4) proyecto creado y documentos en el editor */
{
  const { browser, page, errors } = await openApp({ file, width: 1440, height: 1000 });
  try {
    console.log('4) Proyecto de ejemplo: documentos guardados y abiertos en el editor');
    const created = await page.evaluate(async () => {
      const pid = await PM.createExampleProject('medellin');
      const id = pid || PM.getState().projectId;
      const docs = await PM.store.list(PM.paths.docs(id));
      const mine = docs.filter((d) => ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].includes(d.data.template)).map((d) => ({ id: d.id, template: d.data.template, rev: d.data.rev, status: d.data.status, code: d.data.titleBlock.codigo, approved: d.data.titleBlock.fechaAprobacion, created: String(d.data.createdAt).slice(0, 10) }));
      const revs = {};
      for (const d of mine) revs[d.id] = (await PM.store.list(PM.paths.revs(id, d.id))).map((x) => x.data.rev).sort().join(',');
      return { pid: id, mine, revs };
    });
    const by = Object.fromEntries(created.mine.map((d) => [d.id, d]));
    ok(created.mine.length === 2 && !created.mine.some((d) => d.template === 'informe-beneficios'), 'el proyecto tiene la evaluación de necesidades y el acuerdo, y no el informe de beneficios', created.mine.map((d) => d.id));
    const e = by['evaluacion-necesidades'] || {}, a = by['acuerdo-cliente'] || {};
    ok(e.code === 'PRY-2025-003-EVN' && e.status === 'aprobado' && e.rev === '0' && e.approved === '2024-12-10' && e.created === '2024-12-10' && created.revs['evaluacion-necesidades'] === '', 'evaluación: PRY-2025-003-EVN, aprobada en rev. 0 el 10 de diciembre de 2024', e);
    ok(a.code === 'PRY-2025-003-ACU' && a.status === 'aprobado' && a.rev === '1' && a.approved === '2026-03-13' && a.created === '2025-01-10' && created.revs['acuerdo-cliente'] === '0,1', 'acuerdo: PRY-2025-003-ACU, aprobado en rev. 1 (13 de marzo de 2026), creado con la rev. 0 (10 de enero de 2025) y con las revisiones 0 y 1', [a, created.revs['acuerdo-cliente']]);
    const BAD = /\bundefined\b|\bNaN\b|\[object Object\]/;
    for (const d of created.mine) {
      const before = errors.length;
      await page.evaluate((id) => PM.openDocument(id), d.id);
      await page.waitForSelector(`.page[data-doc-id="${d.id}"] .docs-rev[data-rev="${d.rev}"]`, { timeout: 8000 });
      await page.waitForTimeout(300);
      const info = await page.evaluate(() => {
        const host = document.querySelector('.view-host') || document.body;
        return { txt: host.innerText, inputs: [...host.querySelectorAll('input, textarea, select')].map((el) => el.value || '').join('\n'), fields: host.querySelectorAll('[data-field]').length };
      });
      const cards = await errorCards(page);
      const bad = (info.txt + '\n' + info.inputs).match(BAD);
      ok(!cards.length && !bad && errors.length === before && info.fields > 10 && info.txt.length > 3000, d.id + ': abre en el editor con su contenido, sin tarjetas de error ni texto inválido', { cards, bad, errors: errors.slice(before), fields: info.fields });
    }
  } catch (e) {
    fail('excepción: ' + (e.stack || e.message));
  } finally { await browser.close(); }
}

/* ------------------------------------------------------------------ 5) interacción real: selector → Documentos → teclado */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  const stateOf = () => page.evaluate(() => { const s = PM.getState(); return { view: s.view, params: s.params || {} }; });
  /* avanza con Tab hasta el elemento que cumple el selector (máximo n pasos) */
  const tabTo = async (selector, n = 40) => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate((sel) => !!document.activeElement && document.activeElement.matches(sel), selector)) return i + 1;
    }
    return 0;
  };
  const ringOf = () => page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.boxShadow !== 'none' || (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0); });
  try {
    console.log('5) Interacción: selector de ejemplos, Documentos y apertura con el teclado');
    await page.evaluate(() => PM.navigate('portafolio'));
    await page.getByRole('button', { name: 'Crear proyecto de ejemplo' }).first().click();
    const card = page.getByRole('button', { name: /^Crear: Edificio residencial en Medellín/ });
    await card.waitFor({ timeout: 5000 });
    await card.click();
    await page.waitForFunction(() => !!PM.getState().projectId, null, { timeout: 30000 });
    await page.getByText('Proyecto de ejemplo creado.').waitFor({ timeout: 15000 });
    ok((await stateOf()).view === 'tablero', 'el ejemplo de Medellín se crea desde el selector del portafolio');

    /* Documentos desde el riel, con el teclado */
    const navDocs = page.locator('.rail .nav-item', { hasText: /^\s*Documentos\s*$/ });
    await navDocs.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('tr[data-doc="acuerdo-cliente"]', { timeout: 10000 });
    ok((await stateOf()).view === 'documentos', 'Enter en «Documentos» del riel abre la lista maestra');
    const rowInfo = await page.evaluate(() => Object.fromEntries(['evaluacion-necesidades', 'acuerdo-cliente'].map((id) => { const tr = document.querySelector('tr[data-doc="' + id + '"]'); const rv = tr && tr.querySelector('td.docs-c-rev'); return [id, tr ? tr.innerText.replace(/\s+/g, ' ') + ' | rev=' + (rv ? rv.textContent.replace(/\s+/g, ' ').trim() : '') : '']; })));
    ok(/PRY-2025-003-EVN/.test(rowInfo['evaluacion-necesidades']) && /Aprobado/.test(rowInfo['evaluacion-necesidades']) && /\| rev=(Rev\. )?0$/.test(rowInfo['evaluacion-necesidades']) && /PRY-2025-003-ACU/.test(rowInfo['acuerdo-cliente']) && /Aprobado/.test(rowInfo['acuerdo-cliente']) && /\| rev=(Rev\. )?1$/.test(rowInfo['acuerdo-cliente']), 'la lista muestra la evaluación (rev. 0) y el acuerdo (rev. 1) con su código, su estado en texto y su revisión', rowInfo);
    const order = await page.$$eval('section[data-area="integracion"] tbody tr', (els) => els.map((e) => e.getAttribute('data-doc') || e.getAttribute('data-tid')).slice(0, 5));
    ok(JSON.stringify(order) === JSON.stringify(['evaluacion-necesidades', 'caso-negocio', 'plan-gestion-beneficios', 'acuerdo-cliente', 'acta-constitucion']), 'en Integración (4.1) la evaluación precede al caso de negocio y el acuerdo va antes del acta de constitución', order);

    /* buscar «acuerdo», llegar con Tab al nombre del documento y abrirlo con Enter */
    await page.getByLabel('Buscar documentos').focus();
    await page.keyboard.type('acuerdo');
    await page.waitForTimeout(400);
    const visible = await page.$$eval('section[data-area] tbody tr[data-doc]', (els) => els.map((e) => e.getAttribute('data-doc')));
    ok(visible.includes('acuerdo-cliente') && !visible.includes('evaluacion-necesidades'), 'la búsqueda «acuerdo» filtra la lista', visible);
    const steps = await tabTo('tr[data-doc="acuerdo-cliente"] .docs-link');
    ok(steps > 0 && await ringOf(), 'Tab llega al nombre del acuerdo con el anillo de foco visible (' + steps + ' pasos)');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="acuerdo-cliente"] .docs-rev[data-rev="1"]', { timeout: 8000 });
    let st = await stateOf();
    ok(st.view === 'documento' && st.params.docId === 'acuerdo-cliente', 'Enter abre el acuerdo con el cliente', st);
    await page.waitForTimeout(300);
    const acu = await page.evaluate(() => ({
      bar: (document.querySelector('.docs-bar') || {}).textContent || '',
      tipo: (document.querySelector('#docs-f-tipoAcuerdo') || {}).value || (document.querySelector('[data-field="tipoAcuerdo"]') || {}).textContent || '',
      mod: [...document.querySelectorAll('[data-field="modificaciones"] tbody tr')].map((tr) => [...tr.querySelectorAll('td.col-calc')].map((td) => td.textContent.replace(/[  ]/g, ' ').trim())),
      pol: [...document.querySelectorAll('[data-field="polizas"] tbody tr')].map((tr) => /No aplica/.test(tr.textContent)),
    }));
    ok(/Aprobado/.test(acu.bar) && /Revisión 1/.test(acu.bar) && /PRY-2025-003-ACU/.test(acu.bar) && /Acuerdo interno o memorando de entendimiento/.test(acu.tipo), 'el acuerdo abre aprobado en la revisión 1, como acuerdo interno', acu.bar.slice(0, 200));
    ok(JSON.stringify(acu.mod) === JSON.stringify([['$ 0', '0 días']]) && acu.pol.length === 3 && acu.pol.every(Boolean), 'el editor muestra la orden de cambio No. 1 con sus acumulados ($ 0 y 0 días) y las pólizas «No aplica»', acu);
    if (shots) await page.screenshot({ path: join(shots, 'medellin-acuerdo.png'), fullPage: true });

    /* volver a Documentos con el teclado y abrir la evaluación con el botón «Abrir» de su fila */
    await navDocs.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('tr[data-doc="evaluacion-necesidades"]', { timeout: 10000 });
    await page.getByLabel('Buscar documentos').focus();
    await page.keyboard.type('evaluación de necesidades');
    await page.waitForTimeout(400);
    const s1 = await tabTo('tr[data-doc="evaluacion-necesidades"] .docs-link');
    await page.keyboard.press('Tab');
    const onOpen = await page.evaluate(() => (document.activeElement && document.activeElement.getAttribute('aria-label')) || '');
    ok(s1 > 0 && onOpen === 'Abrir: Evaluación de necesidades' && await ringOf(), 'Tab pasa del nombre al botón «Abrir» de la misma fila, con foco visible', onOpen);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.page[data-doc-id="evaluacion-necesidades"] .docs-rev[data-rev="0"]', { timeout: 8000 });
    st = await stateOf();
    await page.waitForTimeout(300);
    const evn = await page.evaluate(() => ({
      bar: (document.querySelector('.docs-bar') || {}).textContent || '',
      br: [...document.querySelectorAll('[data-field="brechas"] tbody tr')].map((tr) => (tr.querySelector('td.col-calc') || {}).textContent.replace(/[  ]/g, ' ').trim()),
      op: document.querySelectorAll('[data-field="opciones"] tbody tr').length,
    }));
    ok(st.view === 'documento' && st.params.docId === 'evaluacion-necesidades' && /Aprobado/.test(evn.bar) && /PRY-2025-003-EVN/.test(evn.bar), 'Enter en «Abrir» abre la evaluación de necesidades aprobada', st);
    ok(JSON.stringify(evn.br) === JSON.stringify(['1', '—', '1', '0,2', '−0,8']) && evn.op === 3, 'el editor calcula las brechas (1, —, 1, 0,2 y −0,8) y muestra las tres opciones', evn);
    if (shots) await page.screenshot({ path: join(shots, 'medellin-evaluacion.png'), fullPage: true });
    ok(!(await errorCards(page)).length && errors.length === 0, 'sin tarjetas de error ni errores de consola', errors.slice(0, 5));
  } catch (e) {
    fail('excepción: ' + (e.stack || e.message));
  } finally { await browser.close(); }
}

/* ------------------------------------------------------------------ 6) tema oscuro y móvil de 400 px */
for (const cfg of [{ tag: 'oscuro', dark: true, width: 1360 }, { tag: '400 px', dark: false, width: 400 }]) {
  const { browser, page, errors } = await openApp({ file, width: cfg.width, height: 900, dark: cfg.dark });
  try {
    console.log('6) Documentos de negocio (' + cfg.tag + ')');
    await page.evaluate(() => PM.createExampleProject('medellin'));
    await page.waitForFunction(() => !!PM.getState().projectId, null, { timeout: 30000 });
    await page.waitForTimeout(600);
    for (const [id, rev, code] of [['evaluacion-necesidades', '0', 'EVN'], ['acuerdo-cliente', '1', 'ACU']]) {
      await page.evaluate((x) => PM.openDocument(x), id);
      await page.waitForSelector(`.page[data-doc-id="${id}"] .docs-rev[data-rev="${rev}"]`, { timeout: 8000 });
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => ({ bar: (document.querySelector('.docs-bar') || {}).textContent || '', bg: getComputedStyle(document.body).backgroundColor }));
      const ov = await horizontalOverflow(page);
      ok(/Aprobado/.test(info.bar) && info.bar.includes('PRY-2025-003-' + code), id + ': abre aprobado con su código (' + cfg.tag + ')', plain(info.bar).slice(0, 160));
      ok(ov <= 1, id + ': sin desborde horizontal de la página (' + cfg.tag + ', ' + ov + ' px)');
      if (cfg.dark) ok(info.bg !== 'rgb(255, 255, 255)', id + ': fondo del tema oscuro (' + info.bg + ')');
      if (shots) await page.screenshot({ path: join(shots, 'medellin-' + id + '-' + cfg.tag.replace(/\s/g, '') + '.png'), fullPage: true });
    }
    ok(!(await errorCards(page)).length && errors.length === 0, 'sin tarjetas de error ni errores de consola (' + cfg.tag + ')', errors.slice(0, 5));
  } catch (e) {
    fail('excepción: ' + (e.stack || e.message));
  } finally { await browser.close(); }
}

console.log(failures ? `\n${failures} fallas` : '\nTodo en orden');
process.exit(failures ? 1 : 0);

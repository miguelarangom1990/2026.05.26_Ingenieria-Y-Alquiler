// Valida las plantillas registradas contra SPEC.md §5–§6 y §9.5 (plantillas ágiles).
// Uso: node test/templates.test.mjs --file <ruta.html> [--set a|b|agile|negocio|all] [--shots dir]
// Con --set negocio o all, además prueba los documentos de negocio (15-templates-negocio.js): claves estables de campos y
// columnas, cálculos de las tablas, enfoque «ambos», enlaces en el mapa de procesos (4.1 y 4.7) y edición real con clics
// y teclado (claro, oscuro y 400 px).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, createExample, gotoView, errorCards, horizontalOverflow } from './harness.mjs';
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const set = opt('--set') || 'all';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const CATALOG = {
  a: ['caso-negocio','plan-gestion-beneficios','acta-constitucion','registro-supuestos','plan-direccion','plan-gestion-cambios','plan-gestion-configuracion','entregables','registro-incidentes','registro-lecciones','informe-desempeno','solicitud-cambio','registro-cambios','informe-final','acta-cierre','plan-gestion-alcance','plan-gestion-requisitos','documentacion-requisitos','matriz-trazabilidad','enunciado-alcance','acta-aceptacion-entregable','plan-gestion-cronograma','estimaciones-duracion'],
  agile: ['vision-producto','definicion-terminado','plan-release','planificacion-sprint','acta-revision-sprint','retrospectiva'],
  negocio: ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'],
  b: ['plan-gestion-costos','estimacion-costos','requisitos-financiamiento','plan-gestion-calidad','metricas-calidad','documentos-prueba','informe-calidad','mediciones-control-calidad','plan-gestion-recursos','acta-constitucion-equipo','requisitos-recursos','estructura-desglose-recursos','asignaciones-recursos','evaluacion-desempeno-equipo','plan-gestion-comunicaciones','registro-comunicaciones','acta-reunion','plan-gestion-riesgos','registro-riesgos','informe-riesgos','analisis-cuantitativo','plan-gestion-adquisiciones','estrategia-adquisiciones','decisiones-hacer-comprar','enunciado-trabajo-adquisicion','criterios-seleccion-proveedores','registro-adquisiciones','control-adquisiciones','registro-interesados','plan-involucramiento-interesados'],
};
const MULTIPLE = ['informe-desempeno','solicitud-cambio','acta-aceptacion-entregable','informe-calidad','acta-reunion','enunciado-trabajo-adquisicion','planificacion-sprint','acta-revision-sprint','retrospectiva','informe-beneficios'];
const FIXED = {
  'registro-riesgos': ['riesgos', ['id','descripcion','causa','efecto','categoria','tipo','probabilidad','impacto','puntuacion','propietario','estrategia','respuesta','disparador','reserva','estado']],
  'registro-interesados': ['interesados', ['nombre','cargo','organizacion','rol','contacto','requisitos','expectativas','poder','interes','influencia','clasificacion','actitud','nivelActual','nivelDeseado']],
  'registro-cambios': ['cambios', ['id','fecha','solicitante','descripcion','tipo','impactoAlcance','impactoCronograma','impactoCosto','estado','fechaDecision','decisor']],
  'registro-incidentes': ['incidentes', ['id','fecha','descripcion','tipo','prioridad','responsable','fechaObjetivo','estado','solucion']],
  'registro-lecciones': ['lecciones', ['id','fecha','area','situacion','impacto','recomendacion','registradoPor']],
  'entregables': ['entregables', ['id','entregable','paqueteEdt','criterios','fechaPrevista','fechaEntrega','estado','aceptadoPor']],
  'mediciones-control-calidad': ['mediciones', ['fecha','entregable','metrica','resultado','conforme','causa','accion']],
  'registro-supuestos': ['supuestos', ['id','tipo','descripcion','categoria','responsable','fechaValidacion','estado']],
  // SPEC §9.5
  'vision-producto': ['metricasExito', ['metrica','lineaBase','meta','fecha']],
  'plan-release': ['releases', ['release','objetivo','fechaInicio','fechaFin','iteraciones','puntos','presupuesto','alcance']],
  'planificacion-sprint': ['elementos', ['codigo','titulo','tipo','estimacion','responsable','criterios']],
  'acta-revision-sprint': ['elementos', ['codigo','titulo','estimacion','resultado','observaciones']],
  'retrospectiva': ['acciones', ['accion','responsable','fechaObjetivo','estado']],
};
const ids = set === 'a' ? CATALOG.a : set === 'b' ? CATALOG.b : set === 'agile' ? CATALOG.agile : set === 'negocio' ? CATALOG.negocio : [...CATALOG.a, ...CATALOG.b, ...CATALOG.agile, ...CATALOG.negocio];
const { browser, page, errors } = await openApp({ file });
const report = await page.evaluate(({ ids, MULTIPLE, FIXED }) => {
  const problems = []; const p = (id, msg) => problems.push(id + ': ' + msg);
  const AREAS = ['integracion','alcance','cronograma','costos','calidad','recursos','comunicaciones','riesgos','adquisiciones','interesados'];
  const GROUPS = ['inicio','planificacion','ejecucion','monitoreo','cierre'];
  const KINDS = ['acta','plan','registro','informe','documento','formato'];
  const FT = ['text','textarea','number','money','pct','date','select','list','table','check'];
  const CT = ['text','textarea','number','money','pct','date','select','calc','check'];
  let fieldCount = 0;
  for (const id of ids) {
    const t = PM.templates[id];
    if (!t) { p(id, 'NO REGISTRADA'); continue; }
    for (const k of ['name','abbr','area','group','process','kind','purpose']) if (!t[k]) p(id, 'falta ' + k);
    if (!AREAS.includes(t.area)) p(id, 'área inválida ' + t.area);
    if (!GROUPS.includes(t.group)) p(id, 'grupo inválido ' + t.group);
    if (!KINDS.includes(t.kind)) p(id, 'kind inválido ' + t.kind);
    if (!!t.multiple !== MULTIPLE.includes(id)) p(id, 'multiple debe ser ' + MULTIPLE.includes(id));
    if (!Array.isArray(t.tips) || t.tips.length < 2) p(id, 'tips: se esperan 2–4');
    if (!Array.isArray(t.sections) || !t.sections.length) { p(id, 'sin secciones'); continue; }
    const keys = new Map();
    for (const s of t.sections) {
      if (!s.id || !s.title) p(id, 'sección sin id/título');
      for (const f of s.fields || []) {
        fieldCount++;
        if (!f.key || !f.label) p(id, 'campo sin key/label en ' + s.title);
        if (keys.has(f.key)) p(id, 'key duplicada ' + f.key);
        keys.set(f.key, f);
        if (!FT.includes(f.type)) p(id, f.key + ': tipo inválido ' + f.type);
        if (f.type === 'select' && (!Array.isArray(f.options) || !f.options.length)) p(id, f.key + ': select sin options');
        if (f.type === 'table') {
          if (!Array.isArray(f.columns) || !f.columns.length) p(id, f.key + ': tabla sin columnas');
          const ck = new Set();
          for (const c of f.columns || []) {
            if (!c.key || !c.label) p(id, f.key + ': columna sin key/label');
            if (ck.has(c.key)) p(id, f.key + ': columna duplicada ' + c.key); ck.add(c.key);
            if (!CT.includes(c.type)) p(id, f.key + '.' + c.key + ': tipo inválido ' + c.type);
            if (c.type === 'select' && (!Array.isArray(c.options) || !c.options.length)) p(id, f.key + '.' + c.key + ': select sin options');
            if (c.type === 'calc' && typeof c.calc !== 'function') p(id, f.key + '.' + c.key + ': calc sin función');
          }
        }
      }
    }
    if (FIXED[id]) {
      const [fk, cols] = FIXED[id]; const f = keys.get(fk);
      if (!f || f.type !== 'table') p(id, 'falta tabla fija ' + fk);
      else { const have = f.columns.map((c) => c.key); for (const c of cols) if (!have.includes(c)) p(id, fk + ': falta columna ' + c); }
    }
    if (!t.example || typeof t.example !== 'object') { p(id, 'sin example'); continue; }
    for (const [k, v] of Object.entries(t.example)) {
      const f = keys.get(k);
      if (!f) { p(id, 'example: clave desconocida ' + k); continue; }
      if (f.type === 'table') {
        if (!Array.isArray(v)) { p(id, 'example.' + k + ' debe ser arreglo'); continue; }
        v.forEach((row, i) => {
          if (!row.id) p(id, 'example.' + k + '[' + i + '] sin id');
          for (const rk of Object.keys(row)) if (rk !== 'id' && !f.columns.find((c) => c.key === rk)) p(id, 'example.' + k + '[' + i + ']: columna desconocida ' + rk);
          for (const c of f.columns) {
            if (c.type === 'calc') { try { c.calc(row, v); } catch (e) { p(id, 'calc ' + c.key + ' falla: ' + e.message); } }
            if (c.type === 'select' && row[c.key] !== undefined && row[c.key] !== '' && !c.options.map((o) => String(typeof o === 'object' ? o.value : o)).includes(String(row[c.key]))) p(id, 'example.' + k + '[' + i + '].' + c.key + ' valor fuera de options: ' + row[c.key]);
            if ((c.type === 'number' || c.type === 'money' || c.type === 'pct') && row[c.key] !== undefined && row[c.key] !== null && typeof row[c.key] !== 'number') p(id, 'example.' + k + '[' + i + '].' + c.key + ' debe ser número');
            if (c.type === 'date' && row[c.key] && !PM.date.valid(row[c.key])) p(id, 'example.' + k + '[' + i + '].' + c.key + ' fecha inválida');
          }
        });
      } else if (f.type === 'list') { if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) p(id, 'example.' + k + ' debe ser arreglo de cadenas'); }
      else if (f.type === 'number' || f.type === 'money' || f.type === 'pct') { if (typeof v !== 'number') p(id, 'example.' + k + ' debe ser número'); }
      else if (f.type === 'date') { if (!PM.date.valid(v)) p(id, 'example.' + k + ' fecha inválida'); }
      else if (f.type === 'check') { if (typeof v !== 'boolean') p(id, 'example.' + k + ' debe ser booleano'); }
      else if (f.type === 'select') { if (!f.options.map((o) => String(typeof o === 'object' ? o.value : o)).includes(String(v))) p(id, 'example.' + k + ' fuera de options: ' + v); }
      else if (typeof v !== 'string') p(id, 'example.' + k + ' debe ser texto');
    }
    const filled = Object.keys(t.example).length;
    if (filled < Math.min(4, keys.size)) p(id, 'example muy incompleto (' + filled + '/' + keys.size + ' campos)');
  }
  const extra = Object.keys(PM.templates).filter((k) => !ids.includes(k));
  return { problems, count: ids.filter((i) => PM.templates[i]).length, fieldCount, extra };
}, { ids, MULTIPLE, FIXED });
for (const x of report.problems) console.log('FAIL ' + x);
if (errors.length) { console.log(errors.join('\n')); }
console.log(`\nPlantillas: ${report.count}/${ids.length} registradas · ${report.fieldCount} campos · ${report.problems.length} problemas${report.extra.length ? ' · fuera del conjunto: ' + report.extra.join(', ') : ''}`);
let failures = report.problems.length + errors.length;

/* ================================================================ documentos de negocio (15-templates-negocio.js) */
const runNegocio = (set === 'all' || set === 'negocio') && await page.evaluate(() => !!(PM.templates['evaluacion-necesidades'] && PM.templates['acuerdo-cliente'] && PM.templates['informe-beneficios']));
if (!runNegocio) { await browser.close(); process.exit(failures ? 1 : 0); }
const check = (cond, msg, extra) => { if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 600) : '')); } };
const step = (name) => console.log('\n# ' + name);
const shot = async (pg, name) => { if (shots) await pg.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

/* Claves estables (las diligencian los ejemplos de Medellín y del ERP): campo → columnas (tablas) o tipo. */
const STABLE = {
  'evaluacion-necesidades': {
    nombre: 'text', origen: 'select', solicitante: 'text', patrocinador: 'text', responsableAnalisis: 'text', fechaEvaluacion: 'date',
    problema: 'textarea', objetivosOrganizacion: 'textarea', urgencia: 'textarea',
    brechas: ['aspecto', 'actual', 'deseada', 'indicador', 'valorActual', 'valorDeseado', 'brecha'], causas: 'list',
    afectados: ['interesado', 'afectacion', 'expectativa', 'grado'],
    opciones: ['opcion', 'descripcion', 'atiende', 'ventajas', 'desventajas', 'pasaCaso'],
    recomendacion: 'textarea', criteriosEvaluacion: 'list', supuestosRestricciones: 'list', decision: 'select', fechaDecision: 'date',
  },
  'acuerdo-cliente': {
    tipoAcuerdo: 'select', numeroAcuerdo: 'text', objeto: 'textarea', contratante: 'text', contratista: 'text', modalidadPrecio: 'select',
    fechaFirma: 'date', fechaInicio: 'date', fechaTerminacion: 'date', plazo: 'text',
    valorInicial: 'money', baseValor: 'select', anticipoPct: 'pct', anticipoValor: 'money', retencionPct: 'pct', formaPago: 'textarea',
    polizas: ['amparo', 'valorBase', 'porcentaje', 'valorAsegurado', 'vigencia', 'fechaAprobacion', 'estado'],
    obligaciones: ['parte', 'obligacion', 'clausula', 'responsable'],
    supervision: 'text', responsableContratista: 'text', condicionesAceptacion: 'textarea', multas: 'textarea', suspensionTerminacion: 'textarea', otrasClausulas: 'textarea',
    documentosContractuales: 'list',
    modificaciones: ['numero', 'tipo', 'fecha', 'objeto', 'solicitudCambio', 'efectoValor', 'efectoPlazo', 'valorAcumulado', 'plazoAcumulado', 'estado'],
    controlModificaciones: 'textarea', firmas: ['rol', 'nombre', 'fecha'],
  },
  'informe-beneficios': {
    proyecto: 'text', numeroInforme: 'text', fechaMedicion: 'date', periodoDesde: 'date', periodoHasta: 'date', duenoBeneficios: 'text', fuentes: 'textarea',
    beneficios: ['beneficio', 'indicador', 'unidad', 'lineaBase', 'meta', 'fechaMeta', 'resultado', 'avance', 'estado', 'comentario'],
    noPrevistos: 'list', desviaciones: 'textarea',
    acciones: ['accion', 'responsable', 'fechaObjetivo', 'estado'],
    conclusionCaso: 'select', conclusion: 'textarea', proximaMedicion: 'date', alcanceProximaMedicion: 'textarea',
  },
};
step('Documentos de negocio: definición, claves estables, cálculos, enfoque y base de conocimiento');
const def = await page.evaluate((STABLE) => {
  const out = {};
  const fieldsOf = (id) => PM.templates[id].sections.flatMap((s) => s.fields);
  const f = (id, key) => fieldsOf(id).find((x) => x.key === key);
  const col = (id, key, ck) => (f(id, key).columns || []).find((c) => c.key === ck);
  out.meta = ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].map((id) => { const t = PM.templates[id]; return [id, t.name, t.abbr, t.area, t.group, t.process, t.kind, !!t.multiple, (t.processes || []).join(',')]; });
  out.keys = Object.fromEntries(Object.entries(STABLE).map(([id, spec]) => {
    const got = {};
    for (const x of fieldsOf(id)) got[x.key] = x.type === 'table' ? x.columns.map((c) => c.key) : x.type;
    return [id, JSON.stringify(got) === JSON.stringify(spec) ? 'ok' : JSON.stringify(got)];
  }));
  /* los textos de ayuda dicen lo mismo que el cálculo y citan bien la Guía */
  out.hints = {
    origen: f('evaluacion-necesidades', 'origen').hint,
    mods: [f('acuerdo-cliente', 'modificaciones').hint, col('acuerdo-cliente', 'modificaciones', 'valorAcumulado').hint, col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado').hint],
  };
  out.selects = {
    estadoBeneficio: col('informe-beneficios', 'beneficios', 'estado').options,
    estadoModificacion: col('acuerdo-cliente', 'modificaciones', 'estado').options,
    tipoAcuerdo: f('acuerdo-cliente', 'tipoAcuerdo').options,
    tipoModificacion: col('acuerdo-cliente', 'modificaciones', 'tipo').options,
  };
  /* cálculos de las tablas (filas sueltas y en orden) */
  const brecha = col('evaluacion-necesidades', 'brechas', 'brecha').calc;
  const aseg = col('acuerdo-cliente', 'polizas', 'valorAsegurado').calc;
  const vAc = col('acuerdo-cliente', 'modificaciones', 'valorAcumulado').calc, pAc = col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado').calc;
  const av = col('informe-beneficios', 'beneficios', 'avance').calc;
  const mods = [
    { id: 'm1', efectoValor: 12600000, efectoPlazo: 0, estado: 'Firmada' },
    { id: 'm2', efectoValor: 14600000, efectoPlazo: 21, estado: 'En trámite' },
    { id: 'm3', efectoValor: -2000000, efectoPlazo: 10, estado: 'Firmada' },
    { id: 'm4', efectoValor: 5000000, efectoPlazo: 5, estado: 'Rechazada' },
    { id: 'm5', efectoValor: 1000000, efectoPlazo: null },
  ];
  out.calc = {
    brecha: [brecha({ valorActual: 62, valorDeseado: 75 }), brecha({ valorActual: 90, valorDeseado: 100 }), brecha({ valorActual: 10, valorDeseado: 2 }), brecha({ valorActual: null, valorDeseado: 5 }), brecha({})],
    asegurado: [aseg({ valorBase: 598000000, porcentaje: 20 }), aseg({ valorBase: 119600000, porcentaje: 100 }), aseg({ valorBase: 598000000, porcentaje: 5 }), aseg({ valorBase: 1000, porcentaje: null })],
    valorAcumulado: mods.map((r) => vAc(r, mods)), plazoAcumulado: mods.map((r) => pAc(r, mods)),
    /* una copia de la fila (mismo id) también encuentra su posición */
    copia: vAc({ ...mods[2] }, mods),
    avance: [av({ lineaBase: 0, meta: 598000000, resultado: 610600000 }), av({ lineaBase: 62, meta: 75, resultado: 78 }), av({ lineaBase: null, meta: 18, resultado: 24 }), av({ lineaBase: 10, meta: 2, resultado: 4 }), av({ lineaBase: 0, meta: 0, resultado: 0 }), av({ lineaBase: 0, meta: 0, resultado: 2 }), av({ lineaBase: 0, meta: 1, resultado: null })],
    formatos: [col('acuerdo-cliente', 'modificaciones', 'valorAcumulado').format(12600000, {}, { currency: 'COP' }), col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado').format(21), col('acuerdo-cliente', 'modificaciones', 'plazoAcumulado').format(1), col('informe-beneficios', 'beneficios', 'avance').format(1.2308), col('evaluacion-necesidades', 'brechas', 'brecha').format(13), col('acuerdo-cliente', 'polizas', 'valorAsegurado').format(null)],
  };
  /* filas por defecto con id fijo */
  out.defaults = ['evaluacion-necesidades:opciones', 'acuerdo-cliente:polizas'].map((k) => { const [id, key] = k.split(':'); return f(id, key).defaultRows.map((r) => r.id + '=' + (r.opcion || r.amparo)); });
  const body = PM.newDocBody(PM.templates['acuerdo-cliente'], { client: 'Cliente X', start: '2026-01-05', end: '2026-06-30' });
  out.newBody = { contratante: body.fields.contratante, inicio: body.fields.fechaInicio, fin: body.fields.fechaTerminacion, polizas: body.fields.polizas.map((r) => r.id) };
  /* enfoque */
  out.ap = ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].map((id) => { const a = PM.docApproach(id); const m = PM.DOC_APPROACH[id]; return [id, a && a.id, m && m.why.length <= 200, m && m.replacement.length <= 160, m && /[.]$/.test(m.why) && /[.]$/.test(m.replacement)]; });
  const tally = { predictivo: 0, adaptativo: 0, ambos: 0, sin: 0 };
  for (const t of PM.templateList) { const a = PM.docApproach(t); tally[a ? a.id : 'sin']++; }
  out.tally = [PM.templateList.length, tally];
  /* orden de registro (la lista maestra desempata por él dentro del mismo proceso) */
  const order = PM.templateList.map((t) => t.id);
  out.order = [order.indexOf('evaluacion-necesidades') < order.indexOf('caso-negocio'), order.indexOf('plan-gestion-beneficios') < order.indexOf('acuerdo-cliente') && order.indexOf('acuerdo-cliente') < order.indexOf('acta-constitucion'), order.indexOf('informe-beneficios') === order.indexOf('acta-cierre') + 1];
  /* base de conocimiento */
  const K = PM.KB;
  if (K) {
    const p41 = K.process('4.1'), p47 = K.process('4.7');
    out.kb = {
      in41: p41.inputsDocs.filter((d) => ['evaluacion-necesidades', 'caso-negocio', 'plan-gestion-beneficios', 'acuerdo-cliente'].includes(d)),
      in41txt: p41.inputs.slice(0, 2),
      out47: p47.outputs.filter((o) => o.doc === 'informe-beneficios').map((o) => ({ ...o })),
      acuerdos: K.processesForDoc('acuerdo-cliente', 'input').map((p) => p.code),
      upd46: K.process('4.6').outputs.filter((o) => o.doc === 'acuerdo-cliente').map((o) => ({ ...o })),
      orphans: ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].flatMap((id) => (PM.templates[id].processes || []).filter((c) => !K.processesForDoc(id).some((p) => p.code === c)).map((c) => id + '@' + c)),
      catalog: ['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios'].map((id) => { const d = K.doc(id); return d && [d.process, d.area, d.group, d.kind, d.multiple]; }),
      catOrder: K.docs.map((d) => d.id).slice(0, 6),
      gloss: ['Evaluación de necesidades', 'Acuerdos', 'Realización de los beneficios'].map((t) => { const g = K.term(t); return g && [g.term, g.doc, g.area]; }),
      formula: (K.term('Realización de los beneficios') || {}).formula || '',
    };
  }
  /* ejemplos: cifras derivadas de las otras plantillas del ejemplo */
  const ex = (id) => PM.templates[id].example;
  const caso = ex('caso-negocio'), acie = ex('acta-cierre'), ifin = ex('informe-final'), acu = ex('acuerdo-cliente'), irb = ex('informe-beneficios'), ev = ex('evaluacion-necesidades'), pben = ex('plan-gestion-beneficios');
  const row = (id) => irb.beneficios.find((r) => r.id === id);
  const modCol = (k) => col('acuerdo-cliente', 'modificaciones', k).calc;
  const m1 = (acu.modificaciones || [])[0] || {};
  const cc2 = PM.templates['solicitud-cambio'] ? ex('solicitud-cambio') : null;
  const pbenRow = (id) => pben.beneficios.find((r) => r.id === id) || {};
  const ifinSat = (ifin.cumplimiento || []).find((r) => /Satisfacción del cliente/.test(r.dimension)) || {};
  out.exMods = {
    una: acu.modificaciones.length === 1 && m1.numero === 'Orden de cambio No. 1' && m1.tipo === 'Orden de cambio' && m1.estado === 'Firmada' && m1.solicitudCambio === 'CC-002',
    valor: m1.efectoValor === acie.valorFinal - caso.valorContrato && m1.efectoValor === 12600000 && /orden de cambio No\. 1 por \$ 12\.600\.000/.test(acie.liquidacion),
    plazo: m1.efectoPlazo === 0 && (!cc2 || /no mueve la fecha de fin/.test(cc2.impactoCronograma)),
    fecha: !!cc2 && m1.fecha >= cc2.fechaDecision && m1.fecha <= '2026-10-02',
    poliza: /póliza de cumplimiento/.test(m1.objeto) && (!cc2 || /póliza de cumplimiento/.test(cc2.impactoOtros)),
    acumulados: [modCol('valorAcumulado')(m1, acu.modificaciones), modCol('plazoAcumulado')(m1, acu.modificaciones)],
  };
  out.exIrb = {
    /* los cuatro primeros beneficios usan el indicador del plan de gestión de los beneficios */
    indicadores: ['r1', 'r2', 'r3', 'r4'].map((id) => String(pbenRow(id).metrica || '').startsWith(row(id).indicador) && pbenRow(id).beneficio === row(id).beneficio),
    certificacion: row('r4') && row('r4').indicador === pbenRow('r4').metrica && row('r4').resultado === null && row('r4').estado === 'Pendiente' && /4,6 \/ 5/.test(row('r4').comentario) && row('r4').fechaMeta === PM.date.addMonths(acie.fechaCierre, 12),
    encuesta: (() => { const r = irb.beneficios.find((x) => /encuesta de cierre/i.test(x.indicador)); return !!r && r.meta === 4.5 && caso.criteriosExito.some((c) => /4,5 \/ 5 en la encuesta de cierre/.test(c)) && r.resultado === 4.6 && /4,6 \/ 5/.test(ifinSat.resultado) && r.estado === 'Logrado' && r.fechaMeta === acie.fechaCierre; })(),
    /* el estado no contradice el avance: sin resultado → Pendiente; avance ≥ 100 % → Logrado; avance < 100 % → no «Logrado» */
    coherencia: irb.beneficios.filter((r) => { const a = av(r, irb.beneficios); return r.resultado === null || r.resultado === undefined ? r.estado !== 'Pendiente' : a >= 1 ? r.estado !== 'Logrado' : r.estado === 'Logrado'; }).map((r) => r.id),
  };
  out.ex = {
    valor: acu.valorInicial === caso.valorContrato,
    anticipo: acu.anticipoValor === Math.round(acu.valorInicial * acu.anticipoPct / 100) && /20 %/.test(caso.flujoCaja) && acu.anticipoPct === 20,
    retencion: acu.retencionPct === 5 && /retención en garantía del 5 %/.test(caso.flujoCaja),
    plazo: acu.plazo.startsWith((PM.date.diff(acu.fechaInicio, acu.fechaTerminacion) + 1) + ' días calendario'),
    polizas: acu.polizas.map((r) => aseg(r, acu.polizas)),
    numero: /CS-2026-031/.test(acu.numeroAcuerdo) && acie.contrato.includes('CS-2026-031'),
    fechas: [ev.fechaEvaluacion < caso.fechaCaso, ev.fechaDecision <= caso.fechaCaso, acu.fechaFirma <= '2026-07-31', acu.firmas.every((r) => r.fecha === acu.fechaFirma), acu.polizas.every((r) => r.fechaAprobacion >= acu.fechaFirma && r.fechaAprobacion <= acu.fechaInicio), acu.fechaInicio === ex('acta-constitucion').fechaInicio && acu.fechaTerminacion === ex('acta-constitucion').fechaFin],
    brechaUtil: ev.brechas.find((r) => /inventario/.test(r.aspecto)).valorActual === 62 && /62 %/.test(pben.beneficios.find((r) => r.id === 'r2').lineaBase) && /75 %/.test(pben.beneficios.find((r) => r.id === 'r2').meta),
    opciones: ev.opciones.map((r) => r.opcion).join('|') === caso.opciones.map((r) => r.opcion).join('|'),
    irb: [row('r1').meta === caso.valorContrato, row('r1').resultado === acie.valorFinal, row('r5').resultado === Math.round((acie.valorFinal - ifin.costoFinal) / acie.valorFinal * 1000) / 10, /24,0 %/.test(ifin.beneficiosLogrados), /78 %/.test(ifin.beneficiosLogrados) && row('r2').resultado === 78, irb.fechaMedicion > acie.fechaCierre, irb.beneficios.every((r) => ['Logrado', 'Parcial', 'No logrado', 'Pendiente'].includes(r.estado))],
    avance: irb.beneficios.map((r) => av(r, irb.beneficios)),
  };
  return out;
}, STABLE);
check(JSON.stringify(def.meta) === JSON.stringify([
  ['evaluacion-necesidades', 'Evaluación de necesidades', 'EVN', 'integracion', 'inicio', '4.1', 'documento', false, '4.1'],
  ['acuerdo-cliente', 'Acuerdo con el cliente', 'ACU', 'integracion', 'inicio', '4.1', 'documento', false, '4.1,4.6'],
  ['informe-beneficios', 'Informe de realización de los beneficios', 'IRB', 'integracion', 'cierre', '4.7', 'informe', true, '4.7'],
]), 'id, nombre, abreviatura, área, grupo, proceso, tipo y múltiple de las tres plantillas', def.meta);
for (const [id, v] of Object.entries(def.keys)) check(v === 'ok', id + ': claves de campos y columnas estables (con su tipo)', v);
check(JSON.stringify(def.selects.estadoBeneficio) === JSON.stringify(['Logrado', 'Parcial', 'No logrado', 'Pendiente']) && JSON.stringify(def.selects.estadoModificacion) === JSON.stringify(['En trámite', 'Firmada', 'Rechazada']) && def.selects.tipoAcuerdo.includes('Acuerdo interno o memorando de entendimiento') && ['Otrosí', 'Adición en valor', 'Prórroga del plazo'].every((x) => def.selects.tipoModificacion.includes(x)), 'opciones: estados del beneficio y de la modificación, acuerdo interno y otrosíes, adiciones y prórrogas', def.selects);
check(/\(1\.2\.1, contexto de inicio del proyecto\)/.test(def.hints.origen) && !/1\.2\.6/.test(def.hints.origen), 'el origen de la necesidad cita la Guía en 1.2.1 (contexto de inicio del proyecto)', def.hints.origen);
check(def.hints.mods.every((h) => /en trámite/.test(h) && /rechazadas/.test(h) && !/solo las firmadas|modificaciones firmadas hasta/.test(h)) && /sin estado|no tienen estado/.test(def.hints.mods[0]), 'los textos de ayuda de las modificaciones dicen lo que suma el cálculo (firmadas y sin estado; no en trámite ni rechazadas)', def.hints.mods);
check(JSON.stringify(def.calc.brecha) === JSON.stringify([13, 10, -8, null, null]), 'brecha = valor deseado − valor actual (vacía sin los dos valores)', def.calc.brecha);
check(JSON.stringify(def.calc.asegurado) === JSON.stringify([119600000, 119600000, 29900000, null]), 'valor asegurado = valor base × porcentaje', def.calc.asegurado);
check(JSON.stringify(def.calc.valorAcumulado) === JSON.stringify([12600000, 12600000, 10600000, 10600000, 11600000]) && def.calc.copia === 10600000, 'adiciones acumuladas: suman las firmadas y las sin estado (no las en trámite ni las rechazadas) en el orden de la tabla', def.calc.valorAcumulado);
check(JSON.stringify(def.calc.plazoAcumulado) === JSON.stringify([0, 0, 10, 10, 10]), 'prórrogas acumuladas: mismas reglas que las adiciones', def.calc.plazoAcumulado);
check(JSON.stringify(def.calc.avance) === JSON.stringify([1.0211, 1.2308, 1.3333, 0.75, 1, 0, null]), 'avance hacia la meta = (resultado − línea base) ÷ (meta − línea base), también para metas que bajan o se mantienen', def.calc.avance);
check(/^\$\s?12\.600\.000$/.test(def.calc.formatos[0].replace(/ | /g, ' ')) && def.calc.formatos[1] === '21 días' && def.calc.formatos[2] === '1 día' && def.calc.formatos[3].replace(/ | /g, ' ') === '123 %' && def.calc.formatos[4] === '13' && def.calc.formatos[5] === '—', 'formatos de las columnas calculadas (moneda, días, %, brecha y vacío)', def.calc.formatos);
check(JSON.stringify(def.defaults) === JSON.stringify([['opcion-1=No hacer nada', 'opcion-2=Hacer lo mínimo', 'opcion-3=Hacer más (solución completa)'], ['poliza-1=Cumplimiento', 'poliza-2=Pago de salarios, prestaciones sociales e indemnizaciones laborales', 'poliza-3=Responsabilidad civil extracontractual']]), 'filas por defecto con id fijo (opciones y pólizas)', def.defaults);
check(def.newBody.contratante === 'Cliente X' && def.newBody.inicio === '2026-01-05' && def.newBody.fin === '2026-06-30' && JSON.stringify(def.newBody.polizas) === JSON.stringify(['poliza-1', 'poliza-2', 'poliza-3']), 'un acuerdo nuevo toma cliente y fechas de la ficha y conserva los ids de las pólizas', def.newBody);
check(def.ap.every(([, a, w, r, dot]) => a === 'ambos' && w && r && dot), 'las tres son de «Ambos enfoques», con porqué ≤ 200 y reemplazo ≤ 160 caracteres', def.ap);
check(def.tally[0] === 62 && JSON.stringify(def.tally[1]) === JSON.stringify({ predictivo: 25, adaptativo: 6, ambos: 31, sin: 0 }), '62 plantillas: 25 predictivas, 6 ágiles y 31 de ambos enfoques', def.tally);
check(def.order.every(Boolean), 'orden de registro: evaluación antes del caso de negocio, acuerdo antes del acta e informe de beneficios después del acta de cierre', def.order);
if (def.kb) {
  check(JSON.stringify(def.kb.in41) === JSON.stringify(['evaluacion-necesidades', 'caso-negocio', 'plan-gestion-beneficios', 'acuerdo-cliente']) && /evaluación de necesidades/.test(def.kb.in41txt[0]) && /^Acuerdos \(contrato/.test(def.kb.in41txt[1]), '4.1: la evaluación de necesidades precede a los documentos de negocio y «Acuerdos» enlaza con el acuerdo con el cliente', def.kb);
  check(def.kb.out47.length === 1 && def.kb.out47[0].afterClose === true && !def.kb.out47[0].label && !def.kb.out47[0].update, '4.7: el informe de realización de los beneficios es salida posterior al cierre (sin etiqueta de la Guía)', def.kb.out47);
  check(JSON.stringify(def.kb.acuerdos) === JSON.stringify(['4.1', '4.5', '4.7', '5.2', '6.5', '7.3', '11.2', '13.1', '13.2']), 'el acuerdo con el cliente es entrada donde la Guía lista «Acuerdos» y el contrato aporta información (también 6.5, 11.2 y 13.2)', def.kb.acuerdos);
  check(def.kb.upd46.length === 1 && def.kb.upd46[0].update === true && !def.kb.upd46[0].label, '4.6 actualiza el acuerdo con el cliente (modificaciones), sin atribuirlo a la Guía', def.kb.upd46);
  check(!def.kb.orphans.length, 'cada proceso que declaran las tres plantillas las referencia en la base de conocimiento', def.kb.orphans);
  check(JSON.stringify(def.kb.catalog) === JSON.stringify([['4.1', 'integracion', 'inicio', 'documento', false], ['4.1', 'integracion', 'inicio', 'documento', false], ['4.7', 'integracion', 'cierre', 'informe', true]]) && JSON.stringify(def.kb.catOrder) === JSON.stringify(['evaluacion-necesidades', 'caso-negocio', 'plan-gestion-beneficios', 'acuerdo-cliente', 'acta-constitucion', 'registro-supuestos']), 'catálogo canónico: proceso, área, grupo, tipo y orden', def.kb);
  check(def.kb.gloss.every((g) => g && g[2] === 'integracion') && JSON.stringify(def.kb.gloss.map((g) => g[1])) === JSON.stringify(['evaluacion-necesidades', 'acuerdo-cliente', 'informe-beneficios']) && /\(resultado − línea base\) \/ \(meta − línea base\)/.test(def.kb.formula), 'glosario: evaluación de necesidades, acuerdos y realización de los beneficios, con su plantilla y la fórmula del avance', def.kb.gloss);
}
const exOk = def.ex;
check(exOk.valor && exOk.anticipo && exOk.retencion && exOk.plazo && exOk.numero, 'acuerdo del ejemplo: valor, anticipo (20 %), retención (5 %), plazo calculado y número de contrato cuadran con el caso de negocio y el acta de cierre', exOk);
check(JSON.stringify(exOk.polizas) === JSON.stringify([119600000, 119600000, 29900000, 119600000]), 'pólizas del ejemplo: anticipo 100 %, cumplimiento 20 %, salarios 5 % y responsabilidad civil 20 %', exOk.polizas);
check(exOk.fechas.every(Boolean), 'fechas del ejemplo: evaluación antes del caso de negocio; firma, pólizas y plazo coherentes con el acta de constitución', exOk.fechas);
check(exOk.brechaUtil && exOk.opciones, 'evaluación del ejemplo: la brecha de utilización y las opciones son las del plan de beneficios y del caso de negocio', exOk);
check(exOk.irb.every(Boolean), 'informe de beneficios del ejemplo: ingreso, margen y utilización salen del caso de negocio, del informe final y del acta de cierre; medición posterior al cierre', exOk.irb);
check(JSON.stringify(exOk.avance) === JSON.stringify([1.0211, 1.2308, null, null, 1.3333, 1, 1.0222]), 'avance de los beneficios del ejemplo', exOk.avance);
const xm = def.exMods;
check(xm.una && xm.valor && xm.plazo && xm.fecha && xm.poliza, 'acuerdo del ejemplo: orden de cambio No. 1 del CC-002 firmada ($ 12,6 M del acta de cierre, sin prórroga, ajuste de la póliza de cumplimiento, fechada entre la aprobación del cambio y el corte)', xm);
check(JSON.stringify(xm.acumulados) === JSON.stringify([12600000, 0]), 'acuerdo del ejemplo: adiciones acumuladas $ 12,6 M y prórrogas 0', xm.acumulados);
const xi = def.exIrb;
check(xi.indicadores.every(Boolean), 'informe de beneficios: los beneficios del plan conservan su nombre y su indicador', xi.indicadores);
check(xi.certificacion, 'informe de beneficios: la certificación de buen servicio usa el indicador del plan, sin resultado y «Pendiente», con meta a mediano plazo (un año después del cierre)');
check(xi.encuesta, 'informe de beneficios: la encuesta de cierre (4,6 / 5 del informe final) es fila propia, criterio de éxito del caso de negocio (≥ 4,5), «Logrado»');
check(!xi.coherencia.length, 'informe de beneficios: el estado de cada fila no contradice su avance', xi.coherencia);
await browser.close();

/* ---------------------------------------------------------------- interacción real: mapa de procesos y editor */
const stateOf = (pg) => pg.evaluate(() => { const s = PM.getState(); return { view: s.view, params: s.params || {} }; });
const plain = (t) => String(t || '').replace(/ | /g, ' ');
{
  const app = await openApp({ file, width: 1360, height: 900 });
  const p = app.page;
  try {
    const hasMap = await p.evaluate(() => !!(PM.KB && PM.getView && PM.getView('procesos') && PM.getView('documento')));
    if (!hasMap) console.log('\n# Interacción: omitida (la página no incluye la base de conocimiento o la vista de documentos)');
    else {
      await createProject(p, { client: 'Cliente de prueba S.A.S.' });
      await p.waitForTimeout(400);

      step('Mapa de procesos: 4.1 (entradas) y 4.7 (salida posterior al cierre), con el teclado');
      await gotoView(p, 'procesos');
      await p.focus('.docs-proc[data-code="4.1"]');
      await p.keyboard.press('Enter');
      await p.waitForSelector('.modal');
      const m41 = await p.evaluate(() => ({ title: document.querySelector('.modal-title').textContent, ins: [...document.querySelectorAll('.modal [data-input-doc]')].map((e) => e.dataset.inputDoc), txt: document.querySelector('.modal .docs-io').textContent }));
      check(/4\.1/.test(m41.title) && JSON.stringify(m41.ins) === JSON.stringify(['evaluacion-necesidades', 'caso-negocio', 'plan-gestion-beneficios', 'acuerdo-cliente']), '4.1 lista como entradas la evaluación de necesidades, el caso de negocio, el plan de beneficios y el acuerdo con el cliente', m41.ins);
      check(/precedidos por la evaluación de necesidades/.test(m41.txt) && /Acuerdos \(contrato, orden de compra o de servicio, o acuerdo interno\)/.test(m41.txt), 'las entradas de texto nombran la evaluación de necesidades y los acuerdos', m41.txt.slice(0, 300));
      const link = p.locator('.modal [data-input-doc="acuerdo-cliente"] button', { hasText: 'Acuerdo con el cliente' });
      await link.focus();
      const ring = await link.evaluate((el) => getComputedStyle(el).boxShadow !== 'none' || getComputedStyle(el).outlineStyle !== 'none');
      check(ring, 'el enlace de la entrada muestra el foco del teclado');
      await p.keyboard.press('Enter');
      await p.waitForTimeout(500);
      let st = await stateOf(p);
      check(st.view === 'documento' && st.params.docId === 'acuerdo-cliente' && await p.locator('.modal').count() === 0, 'Enter en la entrada abre el acuerdo con el cliente', st);
      await gotoView(p, 'procesos');
      /* proyecto cerrado (informe final y acta de cierre aprobados): el informe de beneficios es posterior al cierre y no
         debe impedir que 4.7 y el grupo Cierre lleguen al 100 % (lo mide 20-docs.js con la marca afterClose de 10-pmbok.js) */
      await p.evaluate(async () => {
        const pid = PM.getState().projectId, project = await PM.store.get(PM.paths.project(pid));
        for (const id of ['informe-final', 'acta-cierre']) {
          const body = PM.newDocBody(PM.templates[id], project, { status: 'aprobado', rev: '0', titleBlock: { fechaAprobacion: '2026-12-22' } });
          await PM.store.set(PM.paths.doc(pid, id), { ...body, status: 'aprobado', rev: '0' });
        }
      });
      await p.waitForTimeout(500);
      const closed = await p.evaluate(() => ({ card: (document.querySelector('.docs-proc[data-code="4.7"] .docs-proc-meta') || {}).textContent || '', group: (document.querySelector('.docs-gbtn[data-group="cierre"] .docs-gbtn-sub') || {}).textContent || '' }));
      /* lista maestra: la fila madre del informe lleva «Posterior al cierre» (no «Sin iniciar»), no suma en «Documentos»
         ni aparece con el filtro «Sin iniciar» */
      await gotoView(p, 'documentos');
      const ml = await p.evaluate(() => {
        const tr = document.querySelector('tr.docs-parent[data-tid="informe-beneficios"]');
        const stat = [...document.querySelectorAll('.stat, [class*="stat"]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).find((t) => /^Documentos/.test(t)) || '';
        return { status: tr ? tr.querySelector('.docs-c-status').textContent.trim() : null, title: tr ? (tr.querySelector('.docs-c-status [title]') || {}).title || '' : '', stat };
      });
      const nCount = await p.evaluate(async () => {
        const pid = PM.getState().projectId; const docs = await PM.store.list(PM.paths.docs(pid));
        const by = {}; for (const d of docs) { const t = (d.data && d.data.template) || d.id.split('--')[0]; (by[t] = by[t] || []).push(d.data); }
        const tpls = PM.countedTemplates(await PM.store.get(PM.paths.project(pid)), by);
        return tpls.reduce((n, t) => n + (t.multiple && by[t.id] ? by[t.id].length : 1), 0);
      });
      check(ml.status === 'Posterior al cierre' && /después de cerrar/.test(ml.title) && ml.stat.startsWith('Documentos ' + nCount + ' '), 'lista maestra: el informe de beneficios muestra «Posterior al cierre» y no suma en los documentos (' + nCount + ')', ml);
      await gotoView(p, 'procesos');
      await p.evaluate(() => PM.navigate('documentos', { status: 'sin' }));
      await p.waitForTimeout(400);
      check(await p.locator('tr.docs-parent[data-tid="informe-beneficios"]').count() === 0 && await p.locator('tr.docs-parent').count() > 0, 'lista maestra: el filtro «Sin iniciar» no lista el informe posterior al cierre');
      await gotoView(p, 'procesos');
      await p.click('.docs-proc[data-code="4.7"]');
      await p.waitForSelector('.modal');
      const row47 = p.locator('.modal .docs-out-row[data-doc="informe-beneficios"]');
      const r47 = await row47.evaluate((el) => ({ txt: el.textContent, guide: /Salida de la Guía/.test(el.textContent), after: [...el.querySelectorAll('.chip, [class*="chip"]')].map((c) => [c.textContent.trim(), c.getAttribute('title') || '']).find(([t]) => /Posterior al cierre/.test(t)) || null }));
      check(/Informe de realización de los beneficios/.test(r47.txt) && !r47.guide, '4.7 muestra el informe de realización de los beneficios como salida, sin atribuirlo a la Guía', r47);
      check(/\b2\/2$/.test(closed.card.trim()) && /2\/2 documentos aprobados/.test(closed.group), 'proyecto cerrado: 4.7 y el grupo Cierre llegan al 100 % sin el informe de beneficios (posterior al cierre)', closed);
      check(!!r47.after && r47.after[1].length > 10, '4.7: el informe de beneficios lleva el distintivo de texto «Posterior al cierre» con su explicación', r47.after);
      await row47.locator('button', { hasText: 'Nuevo' }).click();
      await p.waitForTimeout(500);
      st = await stateOf(p);
      check(st.view === 'documento' && (st.params.template === 'informe-beneficios' || String(st.params.docId || '').startsWith('informe-beneficios--')) && /Informe de realización de los beneficios/.test(await p.locator('.view-host').innerText()), '«Nuevo» abre un informe de beneficios nuevo (plantilla múltiple)', st);

      step('Editor: acuerdo con el cliente (modificaciones y pólizas)');
      await p.evaluate(() => PM.openDocument('acuerdo-cliente'));
      await p.waitForTimeout(500);
      check(await p.inputValue('#docs-f-contratante') === 'Cliente de prueba S.A.S.', 'el contratante sale de la ficha del proyecto');
      await p.selectOption('#docs-f-tipoAcuerdo', 'Acuerdo interno o memorando de entendimiento');
      await p.fill('#docs-f-valorInicial', '100000000');
      await p.keyboard.press('Tab');
      const mod = p.locator('[data-field="modificaciones"]');
      const addMod = mod.locator('button', { hasText: 'Agregar modificación' });
      await addMod.focus();
      check(await addMod.evaluate((el) => getComputedStyle(el).boxShadow !== 'none'), 'el botón «Agregar modificación» muestra el anillo de foco');
      await p.keyboard.press('Enter');
      await mod.locator('[aria-label="Número — fila 1"]').fill('Otrosí 1');
      await mod.locator('[aria-label="Tipo — fila 1"]').selectOption('Adición y prórroga');
      await mod.locator('[aria-label="Fecha — fila 1"]').fill('2026-09-15');
      await mod.locator('[aria-label="Efecto en el valor — fila 1"]').fill('12600000');
      await mod.locator('[aria-label="Efecto en el plazo (días) — fila 1"]').fill('21');
      await mod.locator('[aria-label="Estado — fila 1"]').selectOption('Firmada');
      await addMod.click();
      await mod.locator('[aria-label="Efecto en el valor — fila 2"]').fill('5000000');
      await mod.locator('[aria-label="Efecto en el plazo (días) — fila 2"]').fill('10');
      await mod.locator('[aria-label="Estado — fila 2"]').selectOption('En trámite');
      await p.keyboard.press('Tab');
      const calcCells = async () => mod.evaluate((el) => [...el.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td.col-calc')].map((td) => td.textContent.replace(/ | /g, ' ').trim())));
      let cells = await calcCells();
      check(JSON.stringify(cells) === JSON.stringify([['$ 12.600.000', '21 días'], ['$ 12.600.000', '21 días']]), 'acumulados en la tabla: la modificación en trámite no suma', cells);
      await mod.locator('[aria-label="Estado — fila 2"]').selectOption('Firmada');
      cells = await calcCells();
      check(JSON.stringify(cells) === JSON.stringify([['$ 12.600.000', '21 días'], ['$ 17.600.000', '31 días']]), 'al firmarla, la segunda modificación suma al valor y al plazo', cells);
      await mod.locator('button[aria-label="Subir fila"]').nth(1).click();
      cells = await calcCells();
      check(JSON.stringify(cells) === JSON.stringify([['$ 5.000.000', '10 días'], ['$ 17.600.000', '31 días']]), 'al reordenar, los acumulados siguen el orden de la tabla', cells);
      const pol = p.locator('[data-field="polizas"]');
      check(await pol.locator('tbody tr').count() === 3, 'la tabla de pólizas trae tres amparos por defecto');
      await pol.locator('[aria-label="Valor base — fila 1"]').fill('100000000');
      await pol.locator('[aria-label="Porcentaje — fila 1"]').fill('20');
      await p.keyboard.press('Tab');
      const aseg = plain(await pol.locator('tbody tr').first().locator('td.col-calc').textContent()).trim();
      check(aseg === '$ 20.000.000', 'valor asegurado = valor base × porcentaje en la tabla (' + aseg + ')');
      await p.waitForTimeout(1800);
      const saved = await p.evaluate(() => PM.store.get(PM.paths.doc(PM.getState().projectId, 'acuerdo-cliente')));
      check(saved && saved.fields.tipoAcuerdo === 'Acuerdo interno o memorando de entendimiento' && saved.fields.valorInicial === 100000000 && saved.fields.modificaciones.length === 2 && saved.fields.modificaciones.every((r) => r.id) && saved.fields.modificaciones[1].efectoValor === 12600000 && saved.fields.modificaciones[1].efectoPlazo === 21 && saved.fields.polizas.map((r) => r.id).join() === 'poliza-1,poliza-2,poliza-3' && saved.fields.polizas[0].porcentaje === 20 && !('valorAsegurado' in saved.fields.polizas[0]) && !('valorAcumulado' in saved.fields.modificaciones[0]), 'se guarda con ids de fila, números convertidos y sin guardar las columnas calculadas', saved && saved.fields.modificaciones);
      await shot(p, 'acuerdo-claro');

      step('Editor: evaluación de necesidades e informe de beneficios');
      await p.evaluate(() => PM.openDocument('evaluacion-necesidades'));
      await p.waitForTimeout(500);
      const br = p.locator('[data-field="brechas"]');
      await br.locator('button', { hasText: 'Agregar aspecto' }).click();
      await br.locator('[aria-label="Aspecto o capacidad — fila 1"]').fill('Utilización del inventario');
      await br.locator('[aria-label="Valor actual — fila 1"]').fill('62');
      await br.locator('[aria-label="Valor deseado — fila 1"]').fill('75');
      await p.keyboard.press('Tab');
      check(plain(await br.locator('tbody tr').first().locator('td.col-calc').textContent()).trim() === '13', 'la brecha se calcula en la tabla (75 − 62 = 13)');
      check(await p.locator('[data-field="opciones"] tbody tr').count() === 3, 'las opciones traen no hacer nada, hacer lo mínimo y hacer más');
      await p.evaluate(() => PM.openDocument('informe-beneficios'));
      await p.waitForTimeout(500);
      const bn = p.locator('[data-field="beneficios"]');
      await bn.locator('button', { hasText: 'Agregar beneficio' }).click();
      await bn.locator('[aria-label="Línea base — fila 1"]').fill('62');
      await bn.locator('[aria-label="Meta — fila 1"]').fill('75');
      await bn.locator('[aria-label="Resultado — fila 1"]').fill('78');
      await bn.locator('[aria-label="Estado — fila 1"]').selectOption('Logrado');
      await p.keyboard.press('Tab');
      check(plain(await bn.locator('tbody tr').first().locator('td.col-calc').textContent()).trim() === '123 %', 'el avance hacia la meta se calcula en la tabla (123 %)');
      check(JSON.stringify(await bn.locator('[aria-label="Estado — fila 1"] option').allTextContents()) === JSON.stringify(['', 'Logrado', 'Parcial', 'No logrado', 'Pendiente']), 'el estado del beneficio es una lista con texto (no solo color)');
      check(!(await errorCards(p)).length && !app.errors.length, 'sin tarjetas de error ni errores de consola (claro)', app.errors);
    }
  } catch (e) { failures++; console.log('EXCEPCIÓN', e); } finally { await app.browser.close(); }
}

/* ---------------------------------------------------------------- ejemplo del andamio: tema oscuro y móvil de 400 px */
for (const cfg of [{ tag: 'oscuro', dark: true, width: 1360 }, { tag: '400 px', dark: false, width: 400 }]) {
  const app = await openApp({ file, width: cfg.width, height: 900, dark: cfg.dark });
  const p = app.page;
  try {
    const hasEx = await p.evaluate(() => !!(PM.getExample && PM.getExample('andamio') && PM.getView && PM.getView('documento')));
    if (!hasEx) { console.log('\n# ' + cfg.tag + ': omitida (sin el ejemplo del andamio)'); continue; }
    step('Ejemplo del andamio (' + cfg.tag + '): evaluación de necesidades y acuerdo con el cliente');
    await createExample(p, 'andamio');
    await p.waitForTimeout(800);
    for (const id of ['evaluacion-necesidades', 'acuerdo-cliente']) {
      await p.evaluate((id) => PM.openDocument(id), id);
      await p.waitForTimeout(700);
      const info = await p.evaluate(() => ({ bar: (document.querySelector('.docs-bar') || {}).textContent || '', bg: getComputedStyle(document.body).backgroundColor, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      check(/Aprobado/.test(info.bar) && /PRY-2026-014-(EVN|ACU)/.test(info.bar), id + ': abre aprobado con su código (' + cfg.tag + ')', info.bar.slice(0, 200));
      check(info.ov <= 1, id + ': sin desborde horizontal de la página (' + cfg.tag + ', ' + info.ov + ' px)');
      if (cfg.dark) check(info.bg !== 'rgb(255, 255, 255)', id + ': fondo del tema oscuro (' + info.bg + ')');
      await shot(p, id + '-' + cfg.tag.replace(/\s/g, ''));
    }
    const pol = await p.evaluate(() => [...document.querySelectorAll('[data-field="polizas"] tbody tr')].map((tr) => (tr.querySelector('td.col-calc') || {}).textContent));
    check(pol.length === 4 && pol.every((t) => /\$/.test(t || '')), 'el acuerdo del ejemplo muestra el valor asegurado de las cuatro pólizas (' + cfg.tag + ')', pol);
    const modsUi = await p.evaluate(() => ({ rev: (document.querySelector('.docs-rev') || {}).textContent, rows: [...document.querySelectorAll('[data-field="modificaciones"] tbody tr')].map((tr) => [...tr.querySelectorAll('td.col-calc')].map((td) => td.textContent.replace(/ | /g, ' ').trim())) }));
    check(modsUi.rev === '1' && JSON.stringify(modsUi.rows) === JSON.stringify([['$ 12.600.000', '0 días']]), 'el acuerdo del ejemplo va en rev. 1 con la orden de cambio No. 1: adiciones $ 12.600.000 y 0 días de prórroga (' + cfg.tag + ')', modsUi);
    check(!(await errorCards(p)).length && !app.errors.length, 'sin tarjetas de error ni errores de consola (' + cfg.tag + ')', app.errors);
  } catch (e) { failures++; console.log('EXCEPCIÓN', e); } finally { await app.browser.close(); }
}
console.log(`\n${failures ? failures + ' fallas' : 'Sin fallas'}`);
process.exit(failures ? 1 : 0);

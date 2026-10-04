// Valida la base de conocimiento PMBOK (PM.KB, src/10-pmbok.js) contra SPEC.md §4 y §6.
// Uso: node test/kb.test.mjs [--file ruta.html]
import { openApp } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';

// SPEC §6 — ids canónicos de documentos
const CANON_DOCS = ['caso-negocio', 'plan-gestion-beneficios', 'acta-constitucion', 'registro-supuestos', 'plan-direccion', 'plan-gestion-cambios', 'plan-gestion-configuracion', 'entregables', 'registro-incidentes', 'registro-lecciones', 'informe-desempeno', 'solicitud-cambio', 'registro-cambios', 'informe-final', 'acta-cierre', 'plan-gestion-alcance', 'plan-gestion-requisitos', 'documentacion-requisitos', 'matriz-trazabilidad', 'enunciado-alcance', 'acta-aceptacion-entregable', 'plan-gestion-cronograma', 'estimaciones-duracion', 'plan-gestion-costos', 'estimacion-costos', 'requisitos-financiamiento', 'plan-gestion-calidad', 'metricas-calidad', 'documentos-prueba', 'informe-calidad', 'mediciones-control-calidad', 'plan-gestion-recursos', 'acta-constitucion-equipo', 'requisitos-recursos', 'estructura-desglose-recursos', 'asignaciones-recursos', 'evaluacion-desempeno-equipo', 'plan-gestion-comunicaciones', 'registro-comunicaciones', 'acta-reunion', 'plan-gestion-riesgos', 'registro-riesgos', 'informe-riesgos', 'analisis-cuantitativo', 'plan-gestion-adquisiciones', 'estrategia-adquisiciones', 'decisiones-hacer-comprar', 'enunciado-trabajo-adquisicion', 'criterios-seleccion-proveedores', 'registro-adquisiciones', 'control-adquisiciones', 'registro-interesados', 'plan-involucramiento-interesados'];
const MULTIPLE = ['informe-desempeno', 'solicitud-cambio', 'acta-aceptacion-entregable', 'informe-calidad', 'acta-reunion', 'enunciado-trabajo-adquisicion'];
// SPEC §4 — ids de vistas
const VIEWS = ['tablero', 'procesos', 'documentos', 'documento', 'lineas-base', 'ficha', 'edt', 'cronograma', 'red', 'recursos', 'valor-ganado', 'raci', 'riesgos-matriz', 'interesados-matriz', 'calidad', 'flujogramas'];

const AREAS = [
  ['integracion', 4, 'Gestión de la Integración del Proyecto', 7], ['alcance', 5, 'Gestión del Alcance del Proyecto', 6],
  ['cronograma', 6, 'Gestión del Cronograma del Proyecto', 6], ['costos', 7, 'Gestión de los Costos del Proyecto', 4],
  ['calidad', 8, 'Gestión de la Calidad del Proyecto', 3], ['recursos', 9, 'Gestión de los Recursos del Proyecto', 6],
  ['comunicaciones', 10, 'Gestión de las Comunicaciones del Proyecto', 3], ['riesgos', 11, 'Gestión de los Riesgos del Proyecto', 7],
  ['adquisiciones', 12, 'Gestión de las Adquisiciones del Proyecto', 3], ['interesados', 13, 'Gestión de los Interesados del Proyecto', 4],
];
const GROUPS = [['inicio', 'Inicio', 2], ['planificacion', 'Planificación', 24], ['ejecucion', 'Ejecución', 10], ['monitoreo', 'Monitoreo y Control', 12], ['cierre', 'Cierre', 1]];

// Guía del PMBOK® 6.ª ed. — nombre oficial y grupo de cada proceso
const PROCS = {
  '4.1': ['Desarrollar el Acta de Constitución del Proyecto', 'inicio'], '4.2': ['Desarrollar el Plan para la Dirección del Proyecto', 'planificacion'],
  '4.3': ['Dirigir y Gestionar el Trabajo del Proyecto', 'ejecucion'], '4.4': ['Gestionar el Conocimiento del Proyecto', 'ejecucion'],
  '4.5': ['Monitorear y Controlar el Trabajo del Proyecto', 'monitoreo'], '4.6': ['Realizar el Control Integrado de Cambios', 'monitoreo'],
  '4.7': ['Cerrar el Proyecto o Fase', 'cierre'],
  '5.1': ['Planificar la Gestión del Alcance', 'planificacion'], '5.2': ['Recopilar Requisitos', 'planificacion'], '5.3': ['Definir el Alcance', 'planificacion'],
  '5.4': ['Crear la EDT/WBS', 'planificacion'], '5.5': ['Validar el Alcance', 'monitoreo'], '5.6': ['Controlar el Alcance', 'monitoreo'],
  '6.1': ['Planificar la Gestión del Cronograma', 'planificacion'], '6.2': ['Definir las Actividades', 'planificacion'], '6.3': ['Secuenciar las Actividades', 'planificacion'],
  '6.4': ['Estimar la Duración de las Actividades', 'planificacion'], '6.5': ['Desarrollar el Cronograma', 'planificacion'], '6.6': ['Controlar el Cronograma', 'monitoreo'],
  '7.1': ['Planificar la Gestión de los Costos', 'planificacion'], '7.2': ['Estimar los Costos', 'planificacion'], '7.3': ['Determinar el Presupuesto', 'planificacion'],
  '7.4': ['Controlar los Costos', 'monitoreo'],
  '8.1': ['Planificar la Gestión de la Calidad', 'planificacion'], '8.2': ['Gestionar la Calidad', 'ejecucion'], '8.3': ['Controlar la Calidad', 'monitoreo'],
  '9.1': ['Planificar la Gestión de Recursos', 'planificacion'], '9.2': ['Estimar los Recursos de las Actividades', 'planificacion'], '9.3': ['Adquirir Recursos', 'ejecucion'],
  '9.4': ['Desarrollar el Equipo', 'ejecucion'], '9.5': ['Dirigir al Equipo', 'ejecucion'], '9.6': ['Controlar los Recursos', 'monitoreo'],
  '10.1': ['Planificar la Gestión de las Comunicaciones', 'planificacion'], '10.2': ['Gestionar las Comunicaciones', 'ejecucion'], '10.3': ['Monitorear las Comunicaciones', 'monitoreo'],
  '11.1': ['Planificar la Gestión de los Riesgos', 'planificacion'], '11.2': ['Identificar los Riesgos', 'planificacion'], '11.3': ['Realizar el Análisis Cualitativo de Riesgos', 'planificacion'],
  '11.4': ['Realizar el Análisis Cuantitativo de Riesgos', 'planificacion'], '11.5': ['Planificar la Respuesta a los Riesgos', 'planificacion'], '11.6': ['Implementar la Respuesta a los Riesgos', 'ejecucion'],
  '11.7': ['Monitorear los Riesgos', 'monitoreo'],
  '12.1': ['Planificar la Gestión de las Adquisiciones', 'planificacion'], '12.2': ['Efectuar las Adquisiciones', 'ejecucion'], '12.3': ['Controlar las Adquisiciones', 'monitoreo'],
  '13.1': ['Identificar a los Interesados', 'inicio'], '13.2': ['Planificar el Involucramiento de los Interesados', 'planificacion'],
  '13.3': ['Gestionar la Participación de los Interesados', 'ejecucion'], '13.4': ['Monitorear el Involucramiento de los Interesados', 'monitoreo'],
};

// Correspondencia mínima proceso → documentos / vistas / líneas base (encargo del módulo)
const MAP = {
  '4.1': { docs: ['acta-constitucion', 'registro-supuestos'], inputsDocs: ['caso-negocio', 'plan-gestion-beneficios'] },
  '4.2': { docs: ['plan-direccion', 'plan-gestion-cambios', 'plan-gestion-configuracion'] },
  '4.3': { docs: ['entregables', 'registro-incidentes', 'solicitud-cambio'] },
  '4.4': { docs: ['registro-lecciones'], inputsDocs: ['criterios-seleccion-proveedores'] },
  '4.5': { docs: ['informe-desempeno', 'solicitud-cambio'] },
  '4.6': { docs: ['solicitud-cambio', 'registro-cambios'], views: ['lineas-base'] },
  '4.7': { docs: ['informe-final', 'acta-cierre'] },
  '5.1': { docs: ['plan-gestion-alcance', 'plan-gestion-requisitos'] },
  '5.2': { docs: ['documentacion-requisitos', 'matriz-trazabilidad'] },
  '5.3': { docs: ['enunciado-alcance'] },
  '5.4': { views: ['edt'], baselines: ['scope'] },
  '5.5': { docs: ['acta-aceptacion-entregable', 'entregables', 'solicitud-cambio'] },
  '5.6': { docs: ['solicitud-cambio'] },
  '6.1': { docs: ['plan-gestion-cronograma'] },
  '6.2': { views: ['cronograma'], docs: ['solicitud-cambio'] },
  '6.3': { views: ['red'] },
  '6.4': { docs: ['estimaciones-duracion'] },
  '6.5': { views: ['cronograma'], baselines: ['schedule'], docs: ['solicitud-cambio'] },
  '6.6': { views: ['cronograma', 'valor-ganado'], docs: ['solicitud-cambio'] },
  '7.1': { docs: ['plan-gestion-costos'] },
  '7.2': { docs: ['estimacion-costos'] },
  '7.3': { baselines: ['cost'], views: ['valor-ganado'], docs: ['requisitos-financiamiento'] },
  '7.4': { views: ['valor-ganado'], docs: ['informe-desempeno', 'solicitud-cambio'] },
  '8.1': { docs: ['plan-gestion-calidad', 'metricas-calidad'] },
  '8.2': { docs: ['informe-calidad', 'documentos-prueba', 'solicitud-cambio'], views: ['calidad'] },
  '8.3': { docs: ['mediciones-control-calidad', 'entregables', 'solicitud-cambio'], views: ['calidad'] },
  '9.1': { docs: ['plan-gestion-recursos', 'acta-constitucion-equipo'], views: ['raci'] },
  '9.2': { docs: ['requisitos-recursos', 'estructura-desglose-recursos'], views: ['recursos'] },
  '9.3': { docs: ['asignaciones-recursos', 'solicitud-cambio'] },
  '9.4': { docs: ['evaluacion-desempeno-equipo', 'solicitud-cambio'] },
  '9.5': { docs: ['registro-incidentes', 'registro-lecciones', 'solicitud-cambio'], views: ['recursos'] },
  '9.6': { docs: ['registro-incidentes', 'registro-lecciones', 'solicitud-cambio'], views: ['recursos'] },
  '10.1': { docs: ['plan-gestion-comunicaciones'] },
  '10.2': { docs: ['registro-comunicaciones', 'acta-reunion'] },
  '10.3': { docs: ['informe-desempeno', 'solicitud-cambio'] },
  '11.1': { docs: ['plan-gestion-riesgos'] },
  '11.2': { docs: ['registro-riesgos', 'informe-riesgos'] },
  '11.3': { docs: ['registro-riesgos'], views: ['riesgos-matriz'] },
  '11.4': { docs: ['analisis-cuantitativo', 'informe-riesgos'] },
  '11.5': { docs: ['registro-riesgos', 'solicitud-cambio'] },
  '11.6': { docs: ['registro-riesgos', 'solicitud-cambio'] },
  '11.7': { docs: ['registro-riesgos', 'solicitud-cambio'] },
  '12.1': { docs: ['plan-gestion-adquisiciones', 'estrategia-adquisiciones', 'decisiones-hacer-comprar', 'enunciado-trabajo-adquisicion', 'criterios-seleccion-proveedores', 'solicitud-cambio'] },
  '12.2': { docs: ['registro-adquisiciones', 'solicitud-cambio'] },
  '12.3': { docs: ['control-adquisiciones', 'solicitud-cambio'] },
  '13.1': { docs: ['registro-interesados', 'solicitud-cambio'], views: ['interesados-matriz'] },
  '13.2': { docs: ['plan-involucramiento-interesados'], views: ['interesados-matriz'] },
  '13.3': { docs: ['registro-incidentes', 'registro-interesados', 'solicitud-cambio'] },
  '13.4': { docs: ['registro-incidentes', 'registro-interesados', 'solicitud-cambio'] },
};
// Procesos que, según la Guía, NO tienen solicitudes de cambio como salida
const NO_CR = ['4.1', '4.2', '4.4', '4.7', '5.1', '5.2', '5.3', '5.4', '6.1', '6.3', '6.4', '7.1', '7.2', '7.3', '8.1', '9.1', '9.2', '10.1', '10.2', '11.1', '11.2', '11.3', '11.4', '13.2'];

const REQUIRED_TERMS = ['Estructura de desglose del trabajo', 'Paquete de trabajo', 'Cuenta de control', 'Diccionario de la EDT/WBS', 'Línea base', 'Línea base para la medición del desempeño', 'Ruta crítica', 'Holgura total', 'Holgura libre', 'Adelanto', 'Retraso', 'Relación final a inicio', 'Relación inicio a inicio', 'Relación final a final', 'Relación inicio a final', 'Método de la ruta crítica', 'Estimación por tres valores', 'Compresión del cronograma', 'Intensificación', 'Ejecución rápida', 'Nivelación de recursos', 'Valor planificado', 'Valor ganado', 'Costo real', 'Variación del cronograma', 'Variación del costo', 'Índice de desempeño del cronograma', 'Índice de desempeño del costo', 'Estimación a la conclusión', 'Estimación hasta la conclusión', 'Variación a la conclusión', 'Índice de desempeño del trabajo por completar', 'Cronograma ganado', 'Reserva para contingencias', 'Reserva de gestión', 'Presupuesto hasta la conclusión', 'Matriz RACI', 'Matriz de probabilidad e impacto', 'Valor monetario esperado', 'Análisis de Pareto', 'Diagrama de Ishikawa', 'Gráfico de control', 'Solicitud de cambio', 'Comité de control de cambios', 'Control integrado de cambios', 'Interesado', 'Matriz de evaluación del involucramiento de los interesados', 'Acta de constitución del proyecto', 'Enunciado del alcance del proyecto'];

const { browser, page, errors } = await openApp({ file });
const results = await page.evaluate(({ CANON_DOCS, MULTIPLE, VIEWS, AREAS, GROUPS, PROCS, MAP, NO_CR, REQUIRED_TERMS }) => {
  const out = [];
  const ok = (name, cond, detail) => out.push({ name, ok: !!cond, detail: cond ? '' : detail });
  const eq = (name, got, exp) => ok(name, JSON.stringify(got) === JSON.stringify(exp), 'obtenido ' + JSON.stringify(got) + ' · esperado ' + JSON.stringify(exp));
  const KB = PM.KB;
  if (!KB) { ok('PM.KB definido', false, 'PM.KB no existe'); return out; }
  const codes = (list) => list.map((p) => p.code);
  const BAD_TEXT = /\b(TODO|TBD|FIXME|XXX)\b|lorem|ipsum/;

  // ---------- áreas
  eq('10 áreas', KB.areas.length, 10);
  eq('ids y números de área', KB.areas.map((a) => [a.id, a.num]), AREAS.map((a) => [a[0], a[1]]));
  for (const [id, , name] of AREAS) {
    const a = KB.area(id);
    ok('área ' + id + ': nombre oficial', a && a.name === name, a && a.name);
    ok('área ' + id + ': short, descripción (2 frases) y pregunta clave', a && a.short && a.description && (a.description.match(/\.\s|\.$/g) || []).length >= 2 && a.keyQuestion && /^¿.+\?$/.test(a.keyQuestion), JSON.stringify(a));
  }
  // ---------- grupos
  eq('5 grupos', KB.groups.map((g) => [g.id, g.name]), GROUPS.map((g) => [g[0], g[1]]));
  for (const g of KB.groups) ok('grupo ' + g.id + ': color y descripción', g.color === 'var(--g-' + g.id + ')' && g.description, JSON.stringify(g));

  // ---------- procesos
  eq('49 procesos', KB.processes.length, 49);
  const all = codes(KB.processes);
  eq('códigos únicos', new Set(all).size, 49);
  eq('códigos esperados', [...all].sort(), Object.keys(PROCS).sort());
  eq('arreglo en orden numérico', all, [...all].sort(KB.compareCodes));
  for (const [id, num, , n] of AREAS) eq('área ' + id + ': ' + n + ' procesos', KB.processes.filter((p) => p.area === id).length, n);
  for (const [id, , n] of GROUPS) eq('grupo ' + id + ': ' + n + ' procesos', KB.processes.filter((p) => p.group === id).length, n);
  const viewRefs = [], docRefs = [];
  for (const p of KB.processes) {
    const [name, group] = PROCS[p.code] || [];
    const fails = [];
    if (p.name !== name) fails.push('nombre "' + p.name + '" ≠ "' + name + '"');
    if (p.group !== group) fails.push('grupo ' + p.group + ' ≠ ' + group);
    const a = KB.area(p.area);
    if (!a) fails.push('área inválida ' + p.area);
    else if (+p.code.split('.')[0] !== a.num) fails.push('código no coincide con el capítulo del área');
    if (!KB.FREQUENCY[p.frequency]) fails.push('frecuencia inválida ' + p.frequency);
    if (!p.description || p.description.length < 80 || !/Beneficio clave:/.test(p.description)) fails.push('descripción incompleta');
    for (const k of ['inputs', 'tools', 'outputs']) if (!Array.isArray(p[k]) || !p[k].length) fails.push(k + ' vacío');
    for (const s of [...(p.inputs || []), ...(p.tools || [])]) if (typeof s !== 'string' || !s.trim()) fails.push('entrada/herramienta no es texto');
    if (!Array.isArray(p.inputsDocs) || !Array.isArray(p.toolViews)) fails.push('inputsDocs/toolViews deben ser arreglos');
    for (const o of p.outputs || []) {
      const kinds = ['doc', 'view', 'baseline', 'text'].filter((k) => o[k] !== undefined);
      if (kinds.length !== 1) fails.push('salida ambigua ' + JSON.stringify(o));
      if (o.doc) docRefs.push([p.code, o.doc]);
      if (o.view) { viewRefs.push([p.code, o.view]); if (!o.label) fails.push('salida de vista sin label'); }
      if (o.baseline && (!['scope', 'schedule', 'cost'].includes(o.baseline) || !o.label)) fails.push('línea base inválida ' + JSON.stringify(o));
      if (o.text !== undefined && (typeof o.text !== 'string' || !o.text.trim())) fails.push('texto vacío');
      if (o.update !== undefined && typeof o.update !== 'boolean') fails.push('update debe ser booleano');
    }
    for (const d of p.inputsDocs || []) docRefs.push([p.code, d]);
    for (const v of p.toolViews || []) viewRefs.push([p.code, v]);
    const txt = JSON.stringify(p);
    if (BAD_TEXT.test(txt)) fails.push('texto provisional');
    ok('proceso ' + p.code + ' ' + p.name, !fails.length, fails.join('; '));
  }
  // ---------- referencias
  const badDocs = docRefs.filter(([, d]) => !CANON_DOCS.includes(d));
  ok('todos los documentos referenciados son canónicos', !badDocs.length, JSON.stringify(badDocs));
  const referenced = new Set(docRefs.map(([, d]) => d));
  const missing = CANON_DOCS.filter((d) => !referenced.has(d));
  ok('cada documento canónico aparece al menos una vez', !missing.length, 'faltan ' + missing.join(', '));
  const outputDocs = new Set(KB.processes.flatMap((p) => p.outputs.filter((o) => o.doc).map((o) => o.doc)));
  const notOutput = CANON_DOCS.filter((d) => !outputDocs.has(d) && !['caso-negocio', 'plan-gestion-beneficios'].includes(d));
  ok('cada documento canónico (salvo entradas de 4.1) es salida de algún proceso', !notOutput.length, notOutput.join(', '));
  const glossViews = KB.glossary.filter((g) => g.view).map((g) => ['glosario', g.view]);
  const badViews = [...viewRefs, ...glossViews].filter(([, v]) => !VIEWS.includes(v));
  ok('todas las vistas referenciadas existen en SPEC §4', !badViews.length, JSON.stringify(badViews));
  for (const [code, m] of Object.entries(MAP)) {
    const p = KB.process(code); const fails = [];
    for (const d of m.docs || []) if (!p.outputs.some((o) => o.doc === d)) fails.push('salida doc ' + d);
    for (const d of m.inputsDocs || []) if (!p.inputsDocs.includes(d)) fails.push('entrada doc ' + d);
    for (const v of m.views || []) if (!p.outputs.some((o) => o.view === v)) fails.push('salida vista ' + v);
    for (const b of m.baselines || []) if (!p.outputs.some((o) => o.baseline === b)) fails.push('línea base ' + b);
    ok('correspondencia ' + code, !fails.length, 'falta: ' + fails.join(', '));
  }
  const crIn = KB.processes.filter((p) => p.outputs.some((o) => o.doc === 'solicitud-cambio')).map((p) => p.code);
  eq('solicitudes de cambio solo donde la Guía las lista', crIn.filter((c) => NO_CR.includes(c)), []);
  eq('procesos con solicitudes de cambio como salida', crIn.length, 49 - NO_CR.length);
  const p81 = KB.process('8.1');
  ok('8.1: diagramas de flujo como técnica y flujogramas como herramienta (no salida)', p81.tools.some((t) => /diagramas de flujo/.test(t)) && p81.toolViews.includes('flujogramas') && !p81.outputs.some((o) => o.view === 'flujogramas'), JSON.stringify(p81.toolViews));
  ok('ninguna salida apunta a flujogramas', !KB.processes.some((p) => p.outputs.some((o) => o.view === 'flujogramas')), '');
  ok('ninguna salida apunta a vistas de navegación', !KB.processes.some((p) => p.outputs.some((o) => ['procesos', 'documentos', 'documento', 'ficha'].includes(o.view))), '');

  // ---------- catálogo de documentos
  eq('catálogo docs = SPEC §6', KB.docs.map((d) => d.id), CANON_DOCS);
  eq('catálogo: múltiples', KB.docs.filter((d) => d.multiple).map((d) => d.id).sort(), [...MULTIPLE].sort());
  ok('catálogo: proceso, área y grupo válidos', KB.docs.every((d) => KB.process(d.process) && KB.area(d.area) && KB.group(d.group) && KB.process(d.process).area === d.area), JSON.stringify(KB.docs.filter((d) => !KB.process(d.process) || KB.process(d.process).area !== d.area)));
  ok('catálogo: el proceso de origen lista el documento', KB.docs.every((d) => KB.processesForDoc(d.id).some((p) => p.code === d.process)), JSON.stringify(KB.docs.filter((d) => !KB.processesForDoc(d.id).some((p) => p.code === d.process)).map((d) => d.id)));

  // ---------- helpers
  eq('area()', KB.area('alcance') && [KB.area('alcance').num, KB.area('alcance').short], [5, 'Alcance']);
  eq('area() inexistente', KB.area('x'), null);
  eq('group()', KB.group('monitoreo') && KB.group('monitoreo').name, 'Monitoreo y Control');
  eq('process()', KB.process('5.4') && KB.process('5.4').name, 'Crear la EDT/WBS');
  eq('process() numérico', KB.process(10.2) && KB.process(10.2).name, 'Gestionar las Comunicaciones');
  eq('process() inexistente', KB.process('14.1'), null);
  eq('processesBy(riesgos, planificacion)', codes(KB.processesBy('riesgos', 'planificacion')), ['11.1', '11.2', '11.3', '11.4', '11.5']);
  eq('processesBy(null, inicio) orden numérico', codes(KB.processesBy(null, 'inicio')), ['4.1', '13.1']);
  eq('processesBy(integracion)', codes(KB.processesBy('integracion')), ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7']);
  const plan = codes(KB.processesBy(null, 'planificacion'));
  eq('processesBy(null, planificacion) 9.x antes de 10.x', plan.indexOf('9.2') < plan.indexOf('10.1') && plan.indexOf('6.5') < plan.indexOf('7.1'), true);
  eq('processesBy() sin filtros', KB.processesBy().length, 49);
  eq('processesForDoc(registro-riesgos, produces)', codes(KB.processesForDoc('registro-riesgos', 'produces')).filter((c) => c.startsWith('11.')), ['11.2', '11.3', '11.5', '11.6', '11.7']);
  eq('processesForDoc(registro-riesgos, output)', codes(KB.processesForDoc('registro-riesgos', 'output')), ['11.2']);
  ok('processesForDoc(registro-riesgos) incluye 11.2–11.7', ['11.2', '11.3', '11.4', '11.5', '11.6', '11.7'].every((c) => codes(KB.processesForDoc('registro-riesgos')).includes(c)), codes(KB.processesForDoc('registro-riesgos')).join(','));
  ok('processesForDoc(caso-negocio) incluye 4.1 como entrada', codes(KB.processesForDoc('caso-negocio', 'input')).includes('4.1'), '');
  eq('processesForDoc(entregables, produces)', codes(KB.processesForDoc('entregables', 'produces')), ['4.3', '5.5', '8.3']);
  eq('processesForDoc(acta-constitucion, output)', codes(KB.processesForDoc('acta-constitucion', 'output')), ['4.1']);
  eq('processesForDoc(id inexistente)', KB.processesForDoc('no-existe'), []);
  const sorted = codes(KB.processesForDoc('registro-lecciones'));
  eq('processesForDoc ordenado', sorted, [...sorted].sort(KB.compareCodes));
  const o54 = KB.outputsOf('5.4');
  ok('outputsOf(5.4): vista edt y línea base del alcance', o54.some((o) => o.view === 'edt') && o54.some((o) => o.baseline === 'scope'), JSON.stringify(o54));
  eq('outputsOf(inexistente)', KB.outputsOf('99.9'), []);
  eq('docIds() = catálogo canónico', [...KB.docIds()].sort(), [...CANON_DOCS].sort());
  ok('viewIds() ⊂ SPEC §4', KB.viewIds().every((v) => VIEWS.includes(v)), KB.viewIds().join(','));
  ok('processesForView(red) incluye 6.3', codes(KB.processesForView('red')).includes('6.3'), '');
  ok('processesForView(flujogramas) incluye 8.1', codes(KB.processesForView('flujogramas')).includes('8.1'), '');
  eq('matrix(): 10 × 5 y 49 procesos', [KB.matrix().length, KB.matrix().every((r) => r.cells.length === 5), KB.matrix().reduce((s, r) => s + r.cells.reduce((t, c) => t + c.processes.length, 0), 0)], [10, true, 49]);
  eq('outputLabel(baseline)', KB.outputLabel({ baseline: 'cost' }), 'Línea base de costos');
  eq('outputLabel(doc sin plantilla)', KB.outputLabel({ doc: 'registro-riesgos' }), 'Registro de riesgos');
  eq('outputLabel(label)', KB.outputLabel({ doc: 'solicitud-cambio', label: 'Solicitudes de cambio' }), 'Solicitudes de cambio');
  eq('processLabel', KB.processLabel('13.4'), '13.4 Monitorear el Involucramiento de los Interesados');
  eq('docRoles(entregables)', KB.docRoles('entregables').filter((r) => r.roles.includes('output')).map((r) => r.code), ['4.3']);
  try { KB.process('4.1').name = 'x'; } catch (e) { /* modo estricto */ }
  ok('procesos de solo lectura', Object.isFrozen(KB.process('4.1')) && Object.isFrozen(KB.process('4.1').outputs) && KB.process('4.1').name === 'Desarrollar el Acta de Constitución del Proyecto', '');

  // ---------- PMBOK 7
  eq('8 dominios', KB.domains.map((d) => d.name), ['Interesados', 'Equipo', 'Enfoque de desarrollo y ciclo de vida', 'Planificación', 'Trabajo del proyecto', 'Entrega', 'Medición', 'Incertidumbre']);
  ok('dominios: descripción y áreas relacionadas válidas', KB.domains.every((d) => d.id && d.description && d.relatedAreas.length && d.relatedAreas.every((a) => KB.area(a))), '');
  eq('12 principios', KB.principles.map((p) => p.num), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  eq('principios: redacción oficial', KB.principles.map((p) => p.name), ['Ser un administrador diligente, respetuoso y cuidadoso', 'Crear un entorno colaborativo del equipo del proyecto', 'Involucrarse eficazmente con los interesados', 'Enfocarse en el valor', 'Reconocer, evaluar y responder a las interacciones del sistema', 'Demostrar comportamientos de liderazgo', 'Adaptar en función del contexto', 'Incorporar la calidad en los procesos y los entregables', 'Navegar en la complejidad', 'Optimizar las respuestas a los riesgos', 'Adoptar la adaptabilidad y la resiliencia', 'Permitir el cambio para lograr el estado futuro previsto']);
  ok('principios con nombre y descripción', KB.principles.every((p) => p.name && p.description), '');

  // ---------- glosario
  ok('glosario ≥ 45 términos', KB.glossary.length >= 45, KB.glossary.length);
  eq('glosario: términos únicos', new Set(KB.glossary.map((g) => g.term)).size, KB.glossary.length);
  ok('glosario: definiciones completas', KB.glossary.every((g) => g.term && g.definition && g.definition.length > 40 && (!g.area || KB.area(g.area))), JSON.stringify(KB.glossary.filter((g) => !g.definition || g.definition.length <= 40).map((g) => g.term)));
  const missingTerms = REQUIRED_TERMS.filter((t) => !KB.glossary.some((g) => g.term === t));
  ok('glosario: términos requeridos', !missingTerms.length, missingTerms.join(', '));
  const f = (t) => (KB.glossary.find((g) => g.term === t) || {}).formula || '';
  ok('fórmulas EAC', f('Estimación a la conclusión').includes('BAC / CPI') && f('Estimación a la conclusión').includes('AC + (BAC − EV)') && f('Estimación a la conclusión').includes('(CPI × SPI)'), f('Estimación a la conclusión'));
  ok('fórmulas SV/CV/SPI/CPI/ETC/VAC/TCPI', f('Variación del cronograma') === 'SV = EV − PV' && f('Variación del costo') === 'CV = EV − AC' && f('Índice de desempeño del cronograma') === 'SPI = EV / PV' && f('Índice de desempeño del costo') === 'CPI = EV / AC' && f('Estimación hasta la conclusión') === 'ETC = EAC − AC' && f('Variación a la conclusión') === 'VAC = BAC − EAC' && f('Índice de desempeño del trabajo por completar').includes('(BAC − EV) / (BAC − AC)'), '');
  ok('fórmulas de holgura (total y libre con varias sucesoras)', f('Holgura total').includes('LS − ES') && f('Holgura libre').includes('mín.'), f('Holgura libre'));
  ok('fórmula PERT y triangular', f('Estimación por tres valores').includes('(tO + 4·tM + tP) / 6') && f('Estimación por tres valores').includes('(tO + tM + tP) / 3'), f('Estimación por tres valores'));
  ok('relaciones con notación en español', ['FC', 'CC', 'CF'].every((n) => KB.glossary.some((g) => g.abbr && g.abbr.includes(n))), '');
  eq('term() por sigla', KB.term('cpi') && KB.term('cpi').term, 'Índice de desempeño del costo');
  eq('term() sin tildes', KB.term('linea base') && KB.term('linea base').term, 'Línea base');
  eq('term() por sigla compuesta', KB.term('wbs') && KB.term('wbs').term, 'Estructura de desglose del trabajo');
  ok('searchGlossary(holgura)', KB.searchGlossary('holgura').slice(0, 2).every((g) => /Holgura/.test(g.term)), KB.searchGlossary('holgura').map((g) => g.term).join(','));
  eq('searchGlossary vacío = todo', KB.searchGlossary('').length, KB.glossary.length);
  ok('sin texto provisional', !BAD_TEXT.test(JSON.stringify([KB.areas, KB.groups, KB.domains, KB.principles, KB.glossary])), '');
  return out;
}, { CANON_DOCS, MULTIPLE, VIEWS, AREAS, GROUPS, PROCS, MAP, NO_CR, REQUIRED_TERMS });

let fails = 0;
for (const r of results) { if (!r.ok) fails++; if (!r.ok || args.includes('--verbose')) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.detail)); }
if (errors.length) { console.log('\nErrores de página:\n' + errors.join('\n')); }
await browser.close();
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails || errors.length ? 1 : 0);

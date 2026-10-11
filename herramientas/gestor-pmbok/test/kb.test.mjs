// Valida la base de conocimiento PMBOK (PM.KB, src/10-pmbok.js) contra SPEC.md §4, §6 y §9 (capa ágil).
// Uso: node test/kb.test.mjs [--file ruta.html]
import { openApp } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';

// SPEC §6 — ids canónicos de documentos
const CANON_DOCS = ['caso-negocio', 'plan-gestion-beneficios', 'acta-constitucion', 'registro-supuestos', 'plan-direccion', 'plan-gestion-cambios', 'plan-gestion-configuracion', 'entregables', 'registro-incidentes', 'registro-lecciones', 'informe-desempeno', 'solicitud-cambio', 'registro-cambios', 'informe-final', 'acta-cierre', 'plan-gestion-alcance', 'plan-gestion-requisitos', 'documentacion-requisitos', 'matriz-trazabilidad', 'enunciado-alcance', 'acta-aceptacion-entregable', 'plan-gestion-cronograma', 'estimaciones-duracion', 'plan-gestion-costos', 'estimacion-costos', 'requisitos-financiamiento', 'plan-gestion-calidad', 'metricas-calidad', 'documentos-prueba', 'informe-calidad', 'mediciones-control-calidad', 'plan-gestion-recursos', 'acta-constitucion-equipo', 'requisitos-recursos', 'estructura-desglose-recursos', 'asignaciones-recursos', 'evaluacion-desempeno-equipo', 'plan-gestion-comunicaciones', 'registro-comunicaciones', 'acta-reunion', 'plan-gestion-riesgos', 'registro-riesgos', 'informe-riesgos', 'analisis-cuantitativo', 'plan-gestion-adquisiciones', 'estrategia-adquisiciones', 'decisiones-hacer-comprar', 'enunciado-trabajo-adquisicion', 'criterios-seleccion-proveedores', 'registro-adquisiciones', 'control-adquisiciones', 'registro-interesados', 'plan-involucramiento-interesados'];
// SPEC §9.5 — plantillas ágiles (al final del catálogo)
const AGILE_DOCS = ['vision-producto', 'definicion-terminado', 'plan-release', 'planificacion-sprint', 'acta-revision-sprint', 'retrospectiva'];
CANON_DOCS.push(...AGILE_DOCS);
const MULTIPLE = ['informe-desempeno', 'solicitud-cambio', 'acta-aceptacion-entregable', 'informe-calidad', 'acta-reunion', 'enunciado-trabajo-adquisicion', 'planificacion-sprint', 'acta-revision-sprint', 'retrospectiva'];
// SPEC §9.5 — proceso, área, grupo y kind de las plantillas ágiles
const AGILE_CATALOG = {
  'vision-producto': ['5.2', 'alcance', 'inicio', 'documento'], 'definicion-terminado': ['8.1', 'calidad', 'planificacion', 'documento'],
  'plan-release': ['6.5', 'cronograma', 'planificacion', 'plan'], 'planificacion-sprint': ['4.3', 'integracion', 'ejecucion', 'acta'],
  'acta-revision-sprint': ['5.5', 'alcance', 'monitoreo', 'acta'], retrospectiva: ['4.4', 'integracion', 'ejecucion', 'acta'],
};
// SPEC §4 y §9.4 — ids de vistas
const AGILE_VIEWS = ['backlog', 'kanban', 'iteraciones', 'metricas-agiles'];
const VIEWS = ['tablero', 'procesos', 'documentos', 'documento', 'lineas-base', 'ficha', 'edt', 'cronograma', 'red', 'recursos', 'valor-ganado', 'raci', 'riesgos-matriz', 'interesados-matriz', 'calidad', 'flujogramas', ...AGILE_VIEWS];
// Vistas ágiles como herramientas de sus procesos (encargo de la capa ágil; 6.6 Controlar el Cronograma)
const AGILE_TOOLVIEWS = { backlog: ['5.2', '5.3', '5.4'], kanban: ['4.3', '6.6'], iteraciones: ['6.5', '6.6', '4.6'], 'metricas-agiles': ['4.5', '6.6', '7.4'] };

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
  '4.3': { docs: ['entregables', 'registro-incidentes', 'solicitud-cambio', 'planificacion-sprint'] },
  '4.4': { docs: ['registro-lecciones', 'retrospectiva'], inputsDocs: ['criterios-seleccion-proveedores'] },
  '4.5': { docs: ['informe-desempeno', 'solicitud-cambio'] },
  '4.6': { docs: ['solicitud-cambio', 'registro-cambios'], views: ['lineas-base'] },
  '4.7': { docs: ['informe-final', 'acta-cierre'] },
  '5.1': { docs: ['plan-gestion-alcance', 'plan-gestion-requisitos'] },
  '5.2': { docs: ['documentacion-requisitos', 'matriz-trazabilidad', 'vision-producto'] },
  '5.3': { docs: ['enunciado-alcance'] },
  '5.4': { views: ['edt'], baselines: ['scope'] },
  '5.5': { docs: ['acta-aceptacion-entregable', 'entregables', 'solicitud-cambio', 'acta-revision-sprint'] },
  '5.6': { docs: ['solicitud-cambio'] },
  '6.1': { docs: ['plan-gestion-cronograma'] },
  '6.2': { views: ['cronograma'], docs: ['solicitud-cambio'] },
  '6.3': { views: ['red'] },
  '6.4': { docs: ['estimaciones-duracion'] },
  '6.5': { views: ['cronograma'], baselines: ['schedule'], docs: ['solicitud-cambio', 'plan-release'] },
  '6.6': { views: ['cronograma', 'valor-ganado'], docs: ['solicitud-cambio'] },
  '7.1': { docs: ['plan-gestion-costos'] },
  '7.2': { docs: ['estimacion-costos'] },
  '7.3': { baselines: ['cost'], views: ['valor-ganado'], docs: ['requisitos-financiamiento'] },
  '7.4': { views: ['valor-ganado'], docs: ['informe-desempeno', 'solicitud-cambio'] },
  '8.1': { docs: ['plan-gestion-calidad', 'metricas-calidad', 'definicion-terminado'] },
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

const AGILE_TERMS = ['Backlog del producto', 'Historia de usuario', 'Épica', 'Iteración', 'Velocidad', 'Diagrama de trabajo pendiente', 'Diagrama de trabajo completado', 'Límite WIP', 'Definición de listo', 'Definición de terminado', 'Priorización MoSCoW', 'Puntos de historia', 'Valor ganado ágil', 'Release', 'Retrospectiva', 'Dueño del producto', 'Scrum Master', 'Tiempo de ciclo', 'Diagrama de flujo acumulado', 'Enfoque híbrido'];
const REQUIRED_TERMS = ['Estructura de desglose del trabajo', 'Paquete de trabajo', 'Cuenta de control', 'Diccionario de la EDT/WBS', 'Línea base', 'Línea base para la medición del desempeño', 'Ruta crítica', 'Holgura total', 'Holgura libre', 'Adelanto', 'Retraso', 'Relación final a inicio', 'Relación inicio a inicio', 'Relación final a final', 'Relación inicio a final', 'Método de la ruta crítica', 'Estimación por tres valores', 'Compresión del cronograma', 'Intensificación', 'Ejecución rápida', 'Nivelación de recursos', 'Valor planificado', 'Valor ganado', 'Costo real', 'Variación del cronograma', 'Variación del costo', 'Índice de desempeño del cronograma', 'Índice de desempeño del costo', 'Estimación a la conclusión', 'Estimación hasta la conclusión', 'Variación a la conclusión', 'Índice de desempeño del trabajo por completar', 'Cronograma ganado', 'Reserva para contingencias', 'Reserva de gestión', 'Presupuesto hasta la conclusión', 'Matriz RACI', 'Matriz de probabilidad e impacto', 'Valor monetario esperado', 'Análisis de Pareto', 'Diagrama de Ishikawa', 'Gráfico de control', 'Solicitud de cambio', 'Comité de control de cambios', 'Control integrado de cambios', 'Interesado', 'Matriz de evaluación del involucramiento de los interesados', 'Acta de constitución del proyecto', 'Enunciado del alcance del proyecto'];

const { browser, page, errors } = await openApp({ file });
const results = await page.evaluate(({ CANON_DOCS, MULTIPLE, VIEWS, AREAS, GROUPS, PROCS, MAP, NO_CR, REQUIRED_TERMS, AGILE_DOCS, AGILE_CATALOG, AGILE_VIEWS, AGILE_TOOLVIEWS, AGILE_TERMS }) => {
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
  eq('catálogo docs = SPEC §6 + §9.5', KB.docs.map((d) => d.id), CANON_DOCS);
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

  // ---------- capa ágil y enfoque híbrido (SPEC §9)
  eq('catálogo: documentos ágiles marcados', KB.docs.filter((d) => d.agile).map((d) => d.id), AGILE_DOCS);
  eq('agileDocs()', KB.agileDocs(), AGILE_DOCS);
  for (const [id, [proc, area, group, kind]] of Object.entries(AGILE_CATALOG)) {
    const d = KB.doc(id);
    eq('catálogo ágil ' + id + ': proceso, área, grupo y kind (§9.5)', d && [d.process, d.area, d.group, d.kind], [proc, area, group, kind]);
    const p = KB.process(proc);
    ok(id + ': salida (no actualización) de ' + proc + ' marcada como ágil', p.outputs.some((o) => o.doc === id && !o.update && o.agile === true), JSON.stringify(p.outputs.filter((o) => o.doc === id)));
    eq(id + ': solo ' + proc + ' lo crea', KB.processesForDoc(id, 'output').map((x) => x.code), [proc]);
  }
  ok('las salidas ágiles solo apuntan a documentos ágiles', KB.processes.every((p) => p.outputs.every((o) => !o.agile || AGILE_DOCS.includes(o.doc))), '');
  ok('ningún documento ágil es salida sin la marca ágil', KB.processes.every((p) => p.outputs.every((o) => !AGILE_DOCS.includes(o.doc) || o.agile === true)), '');
  eq('plan de releases: lo actualiza 6.6', KB.processesForDoc('plan-release', 'update').map((x) => x.code), ['6.6']);
  eq('definición de terminado: la actualiza 8.2 y la usan 5.5 y 8.3', [KB.processesForDoc('definicion-terminado', 'update').map((x) => x.code), KB.processesForDoc('definicion-terminado', 'input').map((x) => x.code).filter((c) => ['5.5', '8.3'].includes(c))], [['8.2'], ['5.5', '8.3']]);
  ok('visión del producto: entrada de 5.3', KB.process('5.3').inputsDocs.includes('vision-producto'), '');
  for (const [v, codes] of Object.entries(AGILE_TOOLVIEWS)) {
    const got = KB.processesForView(v).map((p) => p.code);
    ok('vista ' + v + ' como herramienta de ' + codes.join(', '), codes.every((c) => KB.process(c).toolViews.includes(v)), got.join(','));
    ok('vista ' + v + ' no es salida de ningún proceso', !KB.processes.some((p) => p.outputs.some((o) => o.view === v)), '');
  }
  eq('AGILE_VIEWS', [...KB.AGILE_VIEWS], AGILE_VIEWS);
  ok('etiquetas de las vistas ágiles', AGILE_VIEWS.every((v) => KB.VIEW_LABELS[v]) && KB.VIEW_LABELS['metricas-agiles'] === 'Métricas ágiles' && KB.VIEW_LABELS.backlog === 'Backlog del producto', JSON.stringify(KB.VIEW_LABELS));
  ok('viewIds() incluye las 4 vistas ágiles', AGILE_VIEWS.every((v) => KB.viewIds().includes(v)), KB.viewIds().join(','));
  for (const a of KB.areas) {
    const ag = a.agile; const fails = [];
    if (!ag) { ok('área ' + a.id + ': consideraciones ágiles', false, 'falta agile'); continue; }
    if (!ag.summary || (ag.summary.match(/\.\s|\.$/g) || []).length < 3 || ag.summary.length < 250) fails.push('resumen corto (≥ 3 frases)');
    if (!Array.isArray(ag.practices) || ag.practices.length < 3 || ag.practices.some((x) => typeof x !== 'string' || x.length < 30)) fails.push('prácticas (≥ 3)');
    if (!Array.isArray(ag.views) || !ag.views.length || !ag.views.every((v) => AGILE_VIEWS.includes(v))) fails.push('vistas ágiles inválidas ' + JSON.stringify(ag.views));
    if (!Array.isArray(ag.docs) || !ag.docs.length || !ag.docs.every((d) => CANON_DOCS.includes(d))) fails.push('documentos inválidos ' + JSON.stringify(ag.docs));
    if (KB.agileFor(a.id) !== ag) fails.push('agileFor() no devuelve el mismo objeto');
    if (!Object.isFrozen(ag) || !Object.isFrozen(ag.practices)) fails.push('no está congelado');
    ok('área ' + a.id + ': consideraciones para entornos ágiles/adaptativos', !fails.length, fails.join('; '));
  }
  /* Regresión: los resúmenes son síntesis propias para el gestor, no traducciones de la Guía frase por frase. */
  const COPIED = [/alta variabilidad/i, /por definición/i, /documento vivo/i, /acuerdo marco/i, /anexos? o suplementos?/i, /riesgo compartido/i, /creación conjunta/i,
    /especialistas generalistas/i, /justo a tiempo/i, /decisiones colaborativas/i, /dedican menos tiempo/i, /cálculos detallados de costos/i, /lotes pequeños/i,
    /varios niveles de gestión/i, /expertos en su trabajo/i, /ciclos cortos para hacer el trabajo/i, /puntos de control frecuentes/i, /mismo espacio, físico o virtual/i];
  for (const a of KB.areas) {
    const hits = COPIED.filter((re) => re.test(a.agile.summary)).map(String);
    ok('área ' + a.id + ': resumen ágil con redacción propia (sin frases traducidas de la Guía)', !hits.length, hits.join(', '));
  }
  ok('consideraciones ágiles: síntesis propia con referencia general a la Guía (capítulo del área)', KB.areas.every((a) => /^Síntesis propia/.test(a.agile.source) && a.agile.source.includes('capítulo ' + a.num + ' ') && a.agile.source.includes('Guía del PMBOK® 6.ª ed.')), KB.areas.map((a) => a.agile.source).join(' | '));
  ok('consideraciones ágiles: cada resumen remite a algo que se hace en el gestor', KB.areas.every((a) => /backlog|release|iteraci|tablero|definición de terminado|RACI|registro de|plan de comunicaciones|AgileEVM|EDT/i.test(a.agile.summary)), '');
  eq('agileFor(inexistente)', KB.agileFor('x'), null);
  eq('resúmenes ágiles distintos', new Set(KB.areas.map((a) => a.agile && a.agile.summary)).size, 10);
  ok('todas las áreas sugieren al menos un documento ágil', KB.areas.every((a) => a.agile.docs.some((d) => AGILE_DOCS.includes(d))), '');
  const missingAgile = AGILE_TERMS.filter((t) => !KB.glossary.some((g) => g.term === t));
  ok('glosario: términos ágiles requeridos', !missingAgile.length, missingAgile.join(', '));
  ok('glosario: términos ágiles con área y vista ágil o documento', AGILE_TERMS.every((t) => { const g = KB.glossary.find((x) => x.term === t); return g && KB.area(g.area) && (AGILE_VIEWS.includes(g.view) || AGILE_DOCS.includes(g.doc)); }), '');
  ok('glosario: documentos relacionados existentes', KB.glossary.filter((g) => g.doc).every((g) => CANON_DOCS.includes(g.doc)), JSON.stringify(KB.glossary.filter((g) => g.doc && !CANON_DOCS.includes(g.doc)).map((g) => g.term)));
  eq('term(sprint)', KB.term('sprint') && KB.term('sprint').term, 'Iteración');
  eq('term(wip)', KB.term('wip') && KB.term('wip').term, 'Límite WIP');
  eq('term(dod)', KB.term('dod') && KB.term('dod').term, 'Definición de terminado');
  eq('term(burndown)', KB.term('burndown') && KB.term('burndown').term, 'Diagrama de trabajo pendiente');
  eq('term(agileevm)', KB.term('agileevm') && KB.term('agileevm').term, 'Valor ganado ágil');
  eq('term(enfoque hibrido) sin tildes', KB.term('enfoque hibrido') && KB.term('enfoque hibrido').term, 'Enfoque híbrido');
  ok('fórmula AgileEVM (PPC, APC, PV, EV)', /PPC = iteraciones transcurridas \/ iteraciones planeadas/.test(f('Valor ganado ágil')) && f('Valor ganado ágil').includes('PV = BAC × PPC') && f('Valor ganado ágil').includes('EV = BAC × APC'), f('Valor ganado ágil'));
  ok('fórmula de velocidad (promedio de 3) y ley de Little', f('Velocidad').includes('n = 3') && f('Límite WIP').includes('Ley de Little'), '');
  ok('searchGlossary(kanban) encuentra el tablero', KB.searchGlossary('kanban').some((g) => g.term === 'Tablero Kanban'), KB.searchGlossary('kanban').map((g) => g.term).join(','));
  ok('sin texto provisional en la capa ágil', !BAD_TEXT.test(JSON.stringify([KB.areas.map((a) => a.agile), KB.glossary.filter((g) => AGILE_TERMS.includes(g.term))])), '');
  return out;
}, { CANON_DOCS, MULTIPLE, VIEWS, AREAS, GROUPS, PROCS, MAP, NO_CR, REQUIRED_TERMS, AGILE_DOCS, AGILE_CATALOG, AGILE_VIEWS, AGILE_TOOLVIEWS, AGILE_TERMS });

let fails = 0;
for (const r of results) { if (!r.ok) fails++; if (!r.ok || args.includes('--verbose')) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.detail)); }
if (errors.length) { console.log('\nErrores de página:\n' + errors.join('\n')); }
await browser.close();
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails || errors.length ? 1 : 0);

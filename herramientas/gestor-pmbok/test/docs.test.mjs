// Prueba de interacción del módulo 20-docs (mapa de procesos, lista maestra y editor de documentos).
// Inyecta una base de conocimiento y plantillas de prueba para no depender de 10/12/13.
// Uso: node test/docs.test.mjs --file <ruta.html> [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (cond, msg) => { if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg); } };
const step = (name) => console.log('\n# ' + name);
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

/* ---------------------------------------------------------------- datos de prueba (se ejecuta en la página) */
function installStubs() {
  const AREAS = [['integracion', 4, 'Gestión de la Integración del Proyecto', 'Integración'], ['alcance', 5, 'Gestión del Alcance del Proyecto', 'Alcance'], ['cronograma', 6, 'Gestión del Cronograma del Proyecto', 'Cronograma'], ['costos', 7, 'Gestión de los Costos del Proyecto', 'Costos'], ['calidad', 8, 'Gestión de la Calidad del Proyecto', 'Calidad'], ['recursos', 9, 'Gestión de los Recursos del Proyecto', 'Recursos'], ['comunicaciones', 10, 'Gestión de las Comunicaciones del Proyecto', 'Comunicaciones'], ['riesgos', 11, 'Gestión de los Riesgos del Proyecto', 'Riesgos'], ['adquisiciones', 12, 'Gestión de las Adquisiciones del Proyecto', 'Adquisiciones'], ['interesados', 13, 'Gestión de los Interesados del Proyecto', 'Interesados']];
  const GROUPS = [['inicio', 'Inicio'], ['planificacion', 'Planificación'], ['ejecucion', 'Ejecución'], ['monitoreo', 'Monitoreo y Control'], ['cierre', 'Cierre']];
  const P = [
    ['4.1', 'Desarrollar el Acta de Constitución del Proyecto', 'integracion', 'inicio'], ['4.2', 'Desarrollar el Plan para la Dirección del Proyecto', 'integracion', 'planificacion'], ['4.3', 'Dirigir y Gestionar el Trabajo del Proyecto', 'integracion', 'ejecucion'], ['4.4', 'Gestionar el Conocimiento del Proyecto', 'integracion', 'ejecucion'], ['4.5', 'Monitorear y Controlar el Trabajo del Proyecto', 'integracion', 'monitoreo'], ['4.6', 'Realizar el Control Integrado de Cambios', 'integracion', 'monitoreo'], ['4.7', 'Cerrar el Proyecto o Fase', 'integracion', 'cierre'],
    ['5.1', 'Planificar la Gestión del Alcance', 'alcance', 'planificacion'], ['5.2', 'Recopilar Requisitos', 'alcance', 'planificacion'], ['5.3', 'Definir el Alcance', 'alcance', 'planificacion'], ['5.4', 'Crear la EDT/WBS', 'alcance', 'planificacion'], ['5.5', 'Validar el Alcance', 'alcance', 'monitoreo'], ['5.6', 'Controlar el Alcance', 'alcance', 'monitoreo'],
    ['6.1', 'Planificar la Gestión del Cronograma', 'cronograma', 'planificacion'], ['6.2', 'Definir las Actividades', 'cronograma', 'planificacion'], ['6.3', 'Secuenciar las Actividades', 'cronograma', 'planificacion'], ['6.4', 'Estimar la Duración de las Actividades', 'cronograma', 'planificacion'], ['6.5', 'Desarrollar el Cronograma', 'cronograma', 'planificacion'], ['6.6', 'Controlar el Cronograma', 'cronograma', 'monitoreo'],
    ['7.1', 'Planificar la Gestión de los Costos', 'costos', 'planificacion'], ['7.2', 'Estimar los Costos', 'costos', 'planificacion'], ['7.3', 'Determinar el Presupuesto', 'costos', 'planificacion'], ['7.4', 'Controlar los Costos', 'costos', 'monitoreo'],
    ['8.1', 'Planificar la Gestión de la Calidad', 'calidad', 'planificacion'], ['8.2', 'Gestionar la Calidad', 'calidad', 'ejecucion'], ['8.3', 'Controlar la Calidad', 'calidad', 'monitoreo'],
    ['9.1', 'Planificar la Gestión de los Recursos', 'recursos', 'planificacion'], ['9.2', 'Estimar los Recursos de las Actividades', 'recursos', 'planificacion'], ['9.3', 'Adquirir Recursos', 'recursos', 'ejecucion'], ['9.4', 'Desarrollar el Equipo', 'recursos', 'ejecucion'], ['9.5', 'Dirigir al Equipo', 'recursos', 'ejecucion'], ['9.6', 'Controlar los Recursos', 'recursos', 'monitoreo'],
    ['10.1', 'Planificar la Gestión de las Comunicaciones', 'comunicaciones', 'planificacion'], ['10.2', 'Gestionar las Comunicaciones', 'comunicaciones', 'ejecucion'], ['10.3', 'Monitorear las Comunicaciones', 'comunicaciones', 'monitoreo'],
    ['11.1', 'Planificar la Gestión de los Riesgos', 'riesgos', 'planificacion'], ['11.2', 'Identificar los Riesgos', 'riesgos', 'planificacion'], ['11.3', 'Realizar el Análisis Cualitativo de Riesgos', 'riesgos', 'planificacion'], ['11.4', 'Realizar el Análisis Cuantitativo de Riesgos', 'riesgos', 'planificacion'], ['11.5', 'Planificar la Respuesta a los Riesgos', 'riesgos', 'planificacion'], ['11.6', 'Implementar la Respuesta a los Riesgos', 'riesgos', 'ejecucion'], ['11.7', 'Monitorear los Riesgos', 'riesgos', 'monitoreo'],
    ['12.1', 'Planificar la Gestión de las Adquisiciones', 'adquisiciones', 'planificacion'], ['12.2', 'Efectuar las Adquisiciones', 'adquisiciones', 'ejecucion'], ['12.3', 'Controlar las Adquisiciones', 'adquisiciones', 'monitoreo'],
    ['13.1', 'Identificar a los Interesados', 'interesados', 'inicio'], ['13.2', 'Planificar el Involucramiento de los Interesados', 'interesados', 'planificacion'], ['13.3', 'Gestionar la Participación de los Interesados', 'interesados', 'ejecucion'], ['13.4', 'Monitorear el Involucramiento de los Interesados', 'interesados', 'monitoreo'],
  ];
  const OUT = {
    '4.1': [{ doc: 'acta-constitucion' }, { doc: 'registro-supuestos' }],
    '5.3': [{ doc: 'enunciado-alcance' }, { text: 'Actualizaciones a los documentos del proyecto' }],
    '5.4': [{ view: 'edt', label: 'EDT y diccionario de la EDT' }, { baseline: 'scope', label: 'Línea base del alcance' }],
    '10.2': [{ doc: 'acta-reunion', label: 'Comunicaciones del proyecto' }, { text: 'Actualizaciones al plan para la dirección del proyecto' }],
    '4.7': [{ doc: 'acta-constitucion', update: true }, { text: 'Transferencia del producto final' }],
  };
  const processes = P.map(([code, name, area, group]) => ({
    code, name, area, group, description: 'Proceso de prueba ' + code + ': ' + name + '.',
    inputs: ['Plan para la dirección del proyecto', 'Factores ambientales de la empresa'], tools: ['Juicio de expertos', 'Reuniones'],
    outputs: OUT[code] || [{ text: 'Actualizaciones a los documentos del proyecto' }], inputsDocs: code === '5.3' ? ['acta-constitucion'] : [], toolViews: [],
  }));
  const KB = {
    areas: AREAS.map(([id, num, name, short]) => ({ id, num, name, short, description: '' })),
    groups: GROUPS.map(([id, name]) => ({ id, name, description: '', color: 'var(--g-' + id + ')' })),
    processes, glossary: [],
    area: (id) => KB.areas.find((a) => a.id === id) || null,
    group: (id) => KB.groups.find((g) => g.id === id) || null,
    process: (code) => processes.find((p) => p.code === code) || null,
    processesBy: (a, g) => processes.filter((p) => (!a || p.area === a) && (!g || p.group === g)),
    processesForDoc: (d) => processes.filter((p) => p.outputs.some((o) => o.doc === d)),
    outputsOf: (c) => (KB.process(c) || { outputs: [] }).outputs,
  };
  PM.KB = KB;
  /* Vistas de destino mínimas para las salidas de tipo herramienta y línea base (solo si el módulo real no está). */
  for (const [id, label] of [['edt', 'EDT'], ['lineas-base', 'Líneas base']]) {
    if (!PM.getView(id)) PM.registerView({ id, label, group: 'planificacion', icon: 'wbs', order: 90, component: () => PM.html`<div class="page" data-stub-view=${id}>${label}</div>` });
  }
  PM.registerTemplates([
    {
      id: 'acta-constitucion', name: 'Acta de constitución del proyecto', abbr: 'ACT', area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'], kind: 'acta', multiple: false,
      purpose: 'Autoriza formalmente el proyecto y da al director la autoridad para usar recursos.',
      tips: ['Redacta objetivos medibles.', 'Incluye los hitos acordados con el cliente.'],
      sections: [
        { id: 'general', title: 'Información general', fields: [
          { key: 'nombreProyecto', label: 'Nombre del proyecto', type: 'text', from: 'project.name' },
          { key: 'codigoInterno', label: 'Código interno del cliente', type: 'text' },
          { key: 'presupuesto', label: 'Presupuesto aprobado', type: 'money', from: 'project.budget' },
          { key: 'fechaInicio', label: 'Fecha de inicio', type: 'date', from: 'project.start' },
          { key: 'duracionSemanas', label: 'Duración estimada (semanas)', type: 'number' },
          { key: 'avanceMinimo', label: 'Avance mínimo para facturar', type: 'pct' },
          { key: 'nivelRiesgo', label: 'Nivel de riesgo', type: 'select', options: ['Bajo', 'Medio', 'Alto'] },
          { key: 'requiereInterventoria', label: 'Requiere interventoría', type: 'check' },
          { key: 'proposito', label: 'Propósito o justificación', type: 'textarea', required: true, hint: 'Por qué se hace el proyecto.' },
        ] },
        { id: 'objetivos', title: 'Objetivos y requisitos', fields: [
          { key: 'objetivos', label: 'Objetivos medibles', type: 'list', placeholder: 'Objetivo…' },
          { key: 'requisitos', label: 'Requisitos de alto nivel', type: 'textarea' },
        ] },
        { id: 'hitos', title: 'Resumen de hitos', fields: [
          { key: 'hitos', label: 'Hitos', type: 'table', columns: [
            { key: 'id', label: 'ID', type: 'text', width: 70 },
            { key: 'hito', label: 'Hito', type: 'text', width: 200 },
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'costo', label: 'Costo', type: 'money' },
            { key: 'dias', label: 'Días', type: 'number' },
            { key: 'total', label: 'Días ×2', type: 'calc', calc: (r) => (Number(r.dias) || 0) * 2, format: (v) => v + ' d' },
            { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Cumplido'] },
          ] },
        ] },
      ],
      example: { hitos: [{ id: 'H-001', hito: 'Ejemplo', fecha: '2026-08-10', costo: 0, dias: 1, estado: 'Pendiente' }] },
    },
    {
      id: 'acta-reunion', name: 'Acta de reunión', abbr: 'AR', area: 'comunicaciones', group: 'ejecucion', process: '10.2', processes: ['10.2'], kind: 'acta', multiple: true,
      purpose: 'Registra los temas tratados y los compromisos de una reunión del proyecto.', tips: ['Asigna un responsable y una fecha a cada compromiso.', 'Envía el acta en las 24 horas siguientes.'],
      sections: [{ id: 'reunion', title: 'Reunión', fields: [
        { key: 'fecha', label: 'Fecha', type: 'date' },
        { key: 'asistentes', label: 'Asistentes', type: 'list' },
        { key: 'temas', label: 'Temas tratados', type: 'textarea' },
        { key: 'compromisos', label: 'Compromisos', type: 'table', columns: [{ key: 'id', label: 'ID', type: 'text' }, { key: 'compromiso', label: 'Compromiso', type: 'textarea' }, { key: 'responsable', label: 'Responsable', type: 'text' }, { key: 'fecha', label: 'Fecha límite', type: 'date' }] },
      ] }],
      example: { compromisos: [{ id: 'C-01', compromiso: 'Ejemplo', responsable: 'Director de proyecto', fecha: '2026-08-12' }] },
    },
    {
      id: 'enunciado-alcance', name: 'Enunciado del alcance del proyecto', abbr: 'EA', area: 'alcance', group: 'planificacion', process: '5.3', processes: ['5.3'], kind: 'documento', multiple: false,
      purpose: 'Describe el alcance, los entregables, los supuestos y las restricciones del proyecto.', tips: ['Lista las exclusiones explícitas.', 'Define criterios de aceptación verificables.'],
      sections: [{ id: 'alcance', title: 'Alcance', fields: [
        { key: 'descripcion', label: 'Descripción del alcance del producto', type: 'textarea' },
        { key: 'entregables', label: 'Entregables', type: 'list' },
        { key: 'exclusiones', label: 'Exclusiones', type: 'textarea' },
      ] }],
      example: { descripcion: 'Ejemplo' },
    },
  ]);
}

const pidOf = (page) => page.evaluate(() => PM.getState().projectId);
const getDoc = (page, id) => page.evaluate((id) => PM.store.get(PM.paths.doc(PM.getState().projectId, id)), id);
const listDocs = (page) => page.evaluate(() => PM.store.list(PM.paths.docs(PM.getState().projectId)));
const listRevs = (page, id) => page.evaluate((id) => PM.store.list(PM.paths.revs(PM.getState().projectId, id)), id);
const stateOf = (page) => page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
const overflowOk = async (page, where) => { const ov = await horizontalOverflow(page); check(ov <= 1, 'sin desborde horizontal en ' + where + (ov > 1 ? ' (' + ov + ' px)' : '')); };
const noErrorCards = async (page, where) => { const c = await errorCards(page); check(!c.length, 'sin tarjetas de error en ' + where + (c.length ? ': ' + c[0].slice(0, 300) : '')); };
const barBtn = (page, text) => page.locator('.docs-bar button', { hasText: text });
const footBtn = (page, text) => page.locator('.modal-foot button', { hasText: text }).last();
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
async function ready(page) { await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading', null, { timeout: 15000 }); }

const PROPOSITO = 'Suministrar y montar el andamio multidireccional de la Torre 2 con certificación de trabajo en alturas.';

/* ================================================================ escritorio 1360 px */
const app = await openApp({ file, width: 1360, height: 900 });
const { page, errors } = app;
try {
  await page.evaluate(installStubs);
  await createProject(page);
  await page.waitForTimeout(300);

  step('Mapa de procesos (1360 px)');
  await gotoView(page, 'procesos');
  check(await page.locator('.docs-matrix').count() === 1, 'se muestra la matriz');
  check(await page.locator('.docs-matrix .docs-proc').count() === 49, '49 procesos en la matriz');
  check(await page.locator('.docs-matrix .docs-ma').count() === 10, '10 áreas de conocimiento');
  check((await page.locator('.docs-proc[data-code="4.1"] .docs-proc-meta').innerText()).includes('0/2'), '4.1 muestra 0/2 documentos');
  const swatches = await page.$$eval('.docs-mh[data-group] .docs-sw', (els) => els.map((e) => getComputedStyle(e).backgroundColor));
  check(swatches.length === 5 && swatches.every((c) => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'), 'encabezados de grupo con muestra de color (' + swatches.join(' | ') + ')');
  check((await page.locator('.docs-proc[data-code="4.7"] .docs-proc-meta').innerText()).includes('Actualiza documentos existentes'), 'un proceso que solo actualiza documentos no muestra medidor');
  await page.click('.docs-gbtn[data-group="inicio"]');
  check(await page.locator('.docs-matrix .docs-proc.is-dim').count() === 47, 'resaltar Inicio atenúa los otros 47 procesos');
  await page.click('.docs-gbtn[data-group="inicio"]');
  check(await page.locator('.docs-matrix .docs-proc.is-dim').count() === 0, 'quitar resaltado');
  await page.fill('input[aria-label="Buscar procesos"]', 'acta de reunion');
  check(await page.locator('.docs-matrix .docs-proc.is-hit').count() === 1, 'buscar por documento de salida (sin tildes) encuentra 10.2');
  await page.fill('input[aria-label="Buscar procesos"]', 'zzz-sin-resultado');
  check(await page.locator('.empty', { hasText: 'Ningún proceso coincide' }).count() === 1, 'búsqueda sin resultados muestra un estado vacío');
  await page.locator('.empty button', { hasText: 'Limpiar búsqueda' }).click();
  check(await page.inputValue('input[aria-label="Buscar procesos"]') === '' && await page.locator('.docs-matrix .docs-proc').count() === 49, 'Limpiar búsqueda restablece el mapa');
  await overflowOk(page, 'mapa de procesos');
  await page.focus('.docs-proc[data-code="5.4"]');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.modal');
  check((await page.locator('.modal-title').innerText()).includes('5.4'), 'el proceso se abre con el teclado (Enter)');
  await page.locator('.modal button', { hasText: 'Abrir herramienta' }).click();
  await page.waitForTimeout(300);
  check((await stateOf(page)).view === 'edt' && await page.locator('.modal').count() === 0, 'salida de herramienta navega a la vista (edt)');
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="5.4"]');
  await page.locator('.modal button', { hasText: 'Ver líneas base' }).click();
  await page.waitForTimeout(300);
  check((await stateOf(page)).view === 'lineas-base', 'salida de línea base navega a Líneas base');
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="4.7"]');
  await page.waitForSelector('.modal');
  check(await page.locator('.modal .docs-out-row[data-doc="acta-constitucion"] .chip', { hasText: 'Actualiza' }).count() === 1, 'la salida que actualiza un documento lleva la etiqueta Actualiza');
  await page.waitForTimeout(150); // el modal del núcleo registra Escape en un efecto posterior al pintado
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check(await page.locator('.modal').count() === 0, 'Escape cierra el detalle del proceso');
  await page.locator('.btn-group button', { hasText: 'Lista' }).click();
  check(await page.locator('.docs-acc').count() === 10 && await page.locator('.docs-matrix').count() === 0, 'la vista Lista se puede elegir en escritorio');
  await page.reload();
  await ready(page);
  await page.evaluate(installStubs);
  await gotoView(page, 'procesos');
  check(await page.locator('.docs-acc').count() === 10, 'la preferencia Matriz/Lista se conserva al recargar');
  await page.locator('.btn-group button', { hasText: 'Matriz' }).click();
  check(await page.locator('.docs-matrix').count() === 1, 'volver a la matriz');
  await shot(page, 'procesos');
  await page.click('.docs-proc[data-code="4.1"]');
  await page.waitForSelector('.modal');
  const modalText = await page.locator('.modal').innerText();
  check(['Entradas', 'Herramientas y técnicas', 'Salidas', 'Juicio de expertos'].every((s) => modalText.includes(s)), 'detalle del proceso con entradas, herramientas y salidas');
  check(await page.locator('.modal .docs-out-row[data-doc="acta-constitucion"] button', { hasText: 'Crear' }).count() === 1, 'salida documental con botón Crear');
  await shot(page, 'procesos-detalle');
  await page.click('.modal .docs-out-row[data-doc="acta-constitucion"] button:has-text("Crear")');
  await page.waitForTimeout(300);
  let st = await stateOf(page);
  check(st.view === 'documento' && st.params.docId === 'acta-constitucion', 'Crear abre el editor del documento');
  check(await page.locator('.modal').count() === 0, 'el modal se cerró al navegar');
  check(await getDoc(page, 'acta-constitucion') === null, 'abrir el editor no escribe en el almacenamiento');

  step('Lista maestra: crear un documento único');
  await gotoView(page, 'documentos');
  const row = page.locator('tr[data-doc="acta-constitucion"]');
  const rowText = await row.innerText();
  check(rowText.includes('Sin iniciar') && rowText.includes('PRY-TEST-001-ACT'), 'fila del acta con código y estado Sin iniciar');
  await overflowOk(page, 'lista maestra');
  await row.locator('button', { hasText: 'Crear' }).click();
  await page.waitForTimeout(300);
  check(await page.locator('[data-callout="nuevo"]').count() === 1, 'aviso de documento aún no creado');
  check((await page.locator('[data-field="nombreProyecto"]').innerText()).includes('Tomado de la ficha del proyecto'), 'campo prellenado desde la ficha del proyecto');
  check(await page.inputValue('#docs-f-nombreProyecto') === 'Proyecto de prueba', 'valor prellenado: nombre del proyecto');

  step('Campos obligatorios y datos de la ficha');
  await barBtn(page, 'Enviar a revisión').click();
  check(await page.locator('.modal [data-callout="faltantes"]').count() === 1 && (await page.locator('.modal [data-callout="faltantes"]').innerText()).includes('Propósito o justificación'), 'enviar a revisión advierte los campos obligatorios vacíos');
  await footBtn(page, 'Cancelar').click();
  await barBtn(page, 'Aprobar y emitir').click();
  await page.waitForSelector('.modal [data-missing]');
  check((await page.getAttribute('.modal [data-missing]', 'data-missing')) === 'proposito' && (await page.locator('.modal-title').innerText()).includes('Faltan campos obligatorios'), 'aprobar se bloquea si falta un campo obligatorio');
  await footBtn(page, 'Ir al primer campo').click();
  await page.waitForTimeout(200);
  check(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'docs-f-proposito', 'Ir al primer campo enfoca el campo faltante');
  check(await getDoc(page, 'acta-constitucion') === null && await page.locator('.modal').count() === 0, 'la validación no crea el documento');
  await page.fill('#docs-f-nombreProyecto', 'Nombre editado a mano');
  const useBtn = page.locator('[data-field="nombreProyecto"] button', { hasText: 'Usar dato de la ficha' });
  check(await useBtn.count() === 1, 'si el valor difiere de la ficha se ofrece usar el dato de la ficha');
  await useBtn.click();
  check(await page.inputValue('#docs-f-nombreProyecto') === 'Proyecto de prueba' && (await page.locator('[data-field="nombreProyecto"]').innerText()).includes('Tomado de la ficha del proyecto'), 'Usar dato de la ficha restablece el valor');

  step('Edición de campos');
  await page.fill('#docs-f-proposito', PROPOSITO);
  await page.fill('#docs-f-codigoInterno', 'CLI-778');
  await page.selectOption('#docs-f-nivelRiesgo', 'Alto');
  await page.check('#docs-f-requiereInterventoria');
  await page.fill('#docs-f-duracionSemanas', '20');
  await page.fill('#docs-f-avanceMinimo', '35,5');
  await page.locator('#docs-f-avanceMinimo').blur();
  await page.fill('#docs-tb-elaboro', 'Director de proyecto');
  const lst = page.locator('[data-field="objetivos"]');
  await lst.locator('button', { hasText: 'Agregar elemento' }).click();
  await page.keyboard.type('Objetivo uno');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Objetivo dos');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Objetivo tres');
  await lst.locator('button[aria-label="Subir elemento 3"]').click();
  await lst.locator('button[aria-label="Quitar elemento 1"]').click();
  await lst.locator('textarea').nth(1).fill('Objetivo dos editado');
  await lst.locator('button', { hasText: 'Agregar elemento' }).click();
  check(await lst.locator('textarea').count() === 3, 'Agregar elemento añade una línea vacía');
  await page.keyboard.press('Backspace');
  check(await lst.locator('textarea').count() === 2 && await page.evaluate(() => document.activeElement && document.activeElement.value) === 'Objetivo dos editado', 'Retroceso en un elemento vacío lo quita y enfoca el anterior');
  const tbl = page.locator('[data-field="hitos"]');
  await tbl.locator('button', { hasText: 'Agregar fila' }).click();
  await tbl.locator('[aria-label="Hito — fila 1"]').fill('Entrega de ingeniería');
  await tbl.locator('[aria-label="Fecha — fila 1"]').fill('2026-09-01');
  await tbl.locator('[aria-label="Costo — fila 1"]').fill('1500000');
  await tbl.locator('[aria-label="Días — fila 1"]').fill('10');
  await tbl.locator('[aria-label="Estado — fila 1"]').selectOption('Cumplido');
  await tbl.locator('button', { hasText: 'Agregar fila' }).click();
  await tbl.locator('[aria-label="Hito — fila 2"]').fill('Montaje niveles 1–5');
  check((await tbl.innerText()).includes('20 d'), 'columna calculada muestra Días ×2');
  await page.waitForTimeout(1500);
  let d = await getDoc(page, 'acta-constitucion');
  check(!!d, 'el documento se creó con la primera edición');
  check(d && d.fields.proposito === PROPOSITO && d.fields.codigoInterno === 'CLI-778', 'texto y área de texto guardados');
  check(d && d.fields.nivelRiesgo === 'Alto' && d.fields.requiereInterventoria === true && d.fields.duracionSemanas === 20 && d.fields.avanceMinimo === 35.5, 'selección, casilla, número y porcentaje guardados');
  check(d && JSON.stringify(d.fields.objetivos) === JSON.stringify(['Objetivo tres', 'Objetivo dos editado']), 'lista: agregar, reordenar, quitar y editar (' + JSON.stringify(d && d.fields.objetivos) + ')');
  check(d && d.fields.hitos.length === 2 && d.fields.hitos[0].id === 'H-001' && d.fields.hitos[1].id === 'H-002', 'tabla con códigos de fila H-001 y H-002');
  check(d && d.fields.hitos[0].costo === 1500000 && d.fields.hitos[0].fecha === '2026-09-01' && d.fields.hitos[0].estado === 'Cumplido', 'celdas de la tabla guardadas');
  check(d && d.fields.nombreProyecto === 'Proyecto de prueba' && d.fields.presupuesto === 480000000, 'campos tomados de la ficha guardados al crear');
  check(d && d.status === 'borrador' && d.rev === null && d.titleBlock.codigo === 'PRY-TEST-001-ACT' && d.titleBlock.elaboro === 'Director de proyecto', 'estado inicial, código y cajetín');
  check(d && d.updatedBy === null && typeof d.createdAt === 'string' && d.titleBlock && 'fechaAprobacion' in d.titleBlock && 'reviso' in d.titleBlock && 'aprobo' in d.titleBlock, 'forma del documento según SPEC §5');
  const side = page.locator('aside[aria-label="Información del documento"]');
  check((await side.locator('details summary').innerText()).includes('También lo actualiza 1 proceso') && await side.locator('[data-process="4.7"]').count() === 1 && await side.locator('[data-process="4.1"]').count() === 1, 'panel lateral: proceso que crea y procesos que actualizan');
  check(d && d.updatedAt && d.template === 'acta-constitucion', 'updatedAt y plantilla registrados');
  check((await page.locator('.docs-bar').innerText()).includes('Guardado'), 'indicador de guardado');
  await overflowOk(page, 'editor');
  await noErrorCards(page, 'editor');
  await shot(page, 'documento');

  step('Persistencia tras recargar');
  await page.reload();
  await ready(page);
  st = await stateOf(page);
  check(st.view === 'documento', 'la vista documento se restaura al recargar');
  await page.evaluate(installStubs);
  await page.evaluate(() => PM.navigate('documento', {}));
  await page.waitForTimeout(500);
  check(await page.inputValue('#docs-f-proposito') === PROPOSITO, 'el propósito persiste (último documento abierto)');
  check(await page.inputValue('#docs-tb-elaboro') === 'Director de proyecto', 'el cajetín persiste');
  check(await page.locator('[data-field="objetivos"] textarea').nth(0).inputValue() === 'Objetivo tres', 'la lista persiste');
  check(await page.locator('[data-field="hitos"] [aria-label="Hito — fila 2"]').inputValue() === 'Montaje niveles 1–5', 'la tabla persiste');

  step('Flujo de revisiones A → 0 → 1A → 1');
  await barBtn(page, 'Emitir borrador A').click();
  await page.fill('#docs-issue-note', 'Primera emisión para comentarios internos.');
  await footBtn(page, 'Emitir borrador A').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, 'acta-constitucion');
  check(d.rev === 'A' && d.status === 'borrador', 'borrador A emitido');
  check((await listRevs(page, 'acta-constitucion')).length === 1, 'instantánea de la revisión A');
  await barBtn(page, 'Enviar a revisión').click();
  await footBtn(page, 'Enviar a revisión').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, 'acta-constitucion');
  check(d.rev === 'A' && d.status === 'revision', 'revisión A en revisión');
  await barBtn(page, 'Aprobar y emitir').click();
  await page.fill('#docs-issue-ap', 'Gerencia General');
  await footBtn(page, 'Aprobar y emitir').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, 'acta-constitucion');
  check(d.rev === '0' && d.status === 'aprobado' && d.titleBlock.fechaAprobacion === today() && d.titleBlock.aprobo === 'Gerencia General', 'revisión 0 aprobada con fecha y aprobador');
  check(await page.locator('#docs-f-proposito').count() === 0 && await page.locator('[data-callout="aprobado"]').count() === 1, 'documento aprobado en solo lectura');
  check(await page.locator('#docs-tb-elaboro').count() === 0, 'cajetín bloqueado');
  check(!(await page.locator('.docs-bar').innerText()).includes('Guardado automático'), 'un documento bloqueado no anuncia guardado automático');
  check(/01\u00a0sep\u00a02026/.test(await page.locator('[data-field="hitos"]').innerText()), 'fechas de tabla en lectura sin partirse');
  const snapA = (await listRevs(page, 'acta-constitucion')).map((x) => x.data).find((x) => x.status === 'aprobado');
  check(snapA && ['rev', 'status', 'date', 'byId', 'note', 'fields', 'titleBlock', 'title'].every((k) => k in snapA) && snapA.titleBlock.codigo === 'PRY-TEST-001-ACT', 'instantánea con la forma de SPEC §5');
  await shot(page, 'documento-aprobado');
  await barBtn(page, 'Crear nueva revisión (1A)').click();
  await footBtn(page, 'Crear revisión 1A').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, 'acta-constitucion');
  check(d.rev === '1A' && d.status === 'borrador' && !d.titleBlock.fechaAprobacion, 'nueva revisión 1A desbloqueada');
  await page.fill('#docs-f-proposito', 'Propósito ajustado en la revisión 1A.');
  await page.waitForTimeout(900);
  await barBtn(page, 'Aprobar y emitir').click();
  await footBtn(page, 'Aprobar y emitir').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, 'acta-constitucion');
  check(d.rev === '1' && d.status === 'aprobado', 'revisión 1 aprobada');
  const revs = (await listRevs(page, 'acta-constitucion')).map((x) => x.data).sort((a, b) => a.date.localeCompare(b.date));
  check(revs.map((x) => x.rev + ':' + x.status).join(',') === 'A:borrador,A:revision,0:aprobado,1:aprobado', 'historial con 4 instantáneas (' + revs.map((x) => x.rev + ':' + x.status).join(',') + ')');
  check(revs[0].note === 'Primera emisión para comentarios internos.' && revs[2].fields.proposito === PROPOSITO, 'instantáneas con nota y contenido');

  step('Historial: ver y restaurar');
  await barBtn(page, 'Crear nueva revisión (2A)').click();
  await footBtn(page, 'Crear revisión 2A').click();
  await page.waitForTimeout(400);
  await page.fill('#docs-f-proposito', 'Contenido temporal que se descartará.');
  await page.waitForTimeout(900);
  await page.locator('.page-actions button', { hasText: 'Historial' }).click();
  await page.waitForSelector('.docs-hist');
  check(await page.locator('.docs-hist tbody tr').count() === 4, 'historial lista 4 revisiones');
  await shot(page, 'historial');
  await page.locator('.docs-hist tr[data-rev="0"] button', { hasText: 'Ver' }).click();
  await page.waitForTimeout(300);
  check((await page.locator('.modal').last().innerText()).includes(PROPOSITO), 'Ver muestra el contenido de la revisión 0');
  await footBtn(page, 'Cerrar').click();
  await page.locator('.docs-hist tr[data-rev="0"] button', { hasText: 'Restaurar este contenido' }).click();
  await footBtn(page, 'Restaurar contenido').click();
  await page.waitForTimeout(800);
  d = await getDoc(page, 'acta-constitucion');
  check(d.fields.proposito === PROPOSITO && d.rev === '2A' && d.status === 'borrador', 'contenido de la revisión 0 restaurado en el borrador 2A');
  check(await page.inputValue('#docs-f-proposito') === PROPOSITO, 'el editor muestra el contenido restaurado');

  step('Exportar Markdown y HTML');
  await page.evaluate(() => { window.__dl = []; PM.download = async (n, data) => { window.__dl.push({ n, data }); return true; }; });
  await page.locator('button[aria-label="Exportar documento"]').click();
  await page.locator('.menu-item', { hasText: 'Markdown' }).click();
  await page.locator('button[aria-label="Exportar documento"]').click();
  await page.locator('.menu-item', { hasText: 'HTML' }).click();
  const dls = await page.evaluate(() => window.__dl);
  check(dls[0] && dls[0].n === 'PRY-TEST-001-ACT_Rev2A.md' && dls[0].data.includes('# Acta de constitución del proyecto') && dls[0].data.includes('| Código del documento | PRY-TEST-001-ACT |') && dls[0].data.includes('| H-001 | Entrega de ingeniería'), 'Markdown con cajetín y tabla (' + (dls[0] && dls[0].n) + ')');
  check(dls[1] && dls[1].n === 'PRY-TEST-001-ACT_Rev2A.html' && dls[1].data.startsWith('<!doctype html>') && dls[1].data.includes('class="tb"') && dls[1].data.includes('Entrega de ingeniería'), 'HTML autónomo con cajetín (' + (dls[1] && dls[1].n) + ')');

  step('Redactar con Claude');
  await page.evaluate(() => {
    PM.ai.available = async () => true;
    PM.ai.json = async (prompt, opts) => {
      window.__prompt = prompt;
      if (opts && opts.onText) opts.onText({ text: '{"requisitos": "Requisitos', delta: '' });
      await new Promise((r) => setTimeout(r, 250));
      return { requisitos: 'Requisitos propuestos por Claude.', objetivos: ['Objetivo IA 1', 'Objetivo IA 2'], hitos: [{ hito: 'Hito IA', fecha: '2026-10-15', costo: '2.500.000', dias: '5', total: 99 }], nivelRiesgo: 'medio', desconocido: 42 };
    };
  });
  await gotoView(page, 'documentos');
  await page.evaluate(() => PM.openDocument('acta-constitucion'));
  await page.waitForTimeout(400);
  const aiBtn = page.locator('.page-actions button', { hasText: 'Redactar con Claude' });
  check(await aiBtn.count() === 1, 'botón Redactar con Claude visible cuando hay disponibilidad');
  await aiBtn.click();
  await page.locator('.modal button', { hasText: 'Ninguno' }).click();
  for (const k of ['requisitos', 'objetivos', 'hitos', 'nivelRiesgo']) await page.check('input[data-ai-pick="' + k + '"]');
  await shot(page, 'ai-seleccion');
  await footBtn(page, 'Redactar propuesta').click();
  await page.waitForSelector('.docs-ai-item', { timeout: 5000 });
  check(await page.locator('.docs-ai-item').count() === 4, 'vista previa de 4 campos (clave desconocida ignorada)');
  const prompt = await page.evaluate(() => window.__prompt);
  check(prompt.includes('Proyecto de prueba') && prompt.includes('`hitos`') && prompt.includes('ÚNICAMENTE con un objeto JSON') && prompt.includes('Redacta el contenido de estos campos: nivelRiesgo, objetivos, requisitos, hitos'), 'el prompt incluye proyecto, estructura, formato y campos');
  await shot(page, 'ai-revision');
  await footBtn(page, 'Aplicar selección (4)').click();
  await page.waitForTimeout(1200);
  d = await getDoc(page, 'acta-constitucion');
  check(d.fields.requisitos === 'Requisitos propuestos por Claude.' && JSON.stringify(d.fields.objetivos) === '["Objetivo IA 1","Objetivo IA 2"]' && d.fields.nivelRiesgo === 'Medio', 'texto, lista y selección aplicados con tipos correctos');
  const lastH = d.fields.hitos[d.fields.hitos.length - 1];
  check(d.fields.hitos.length === 3 && lastH.id === 'H-003' && lastH.costo === 2500000 && lastH.dias === 5 && !('total' in lastH), 'filas agregadas con id y números convertidos (' + JSON.stringify(lastH) + ')');
  check(!('desconocido' in d.fields), 'claves desconocidas ignoradas');
  await page.evaluate(() => { PM.ai.json = (p, opts) => new Promise((res, rej) => { opts.signal.addEventListener('abort', () => rej({ code: 'cancelled' })); }); });
  await aiBtn.click();
  check(await page.locator('.modal-foot button', { hasText: 'Redactar propuesta' }).isDisabled(), 'sin campos vacíos no hay selección por defecto');
  await page.check('input[data-ai-pick="requisitos"]');
  await footBtn(page, 'Redactar propuesta').click();
  await page.waitForTimeout(200);
  check((await page.locator('.modal').innerText()).includes('Pensando…'), 'muestra Pensando… mientras espera');
  await footBtn(page, 'Detener').click();
  await page.waitForTimeout(200);
  check((await page.locator('.modal').innerText()).includes('Solicitud detenida'), 'Detener cancela la solicitud');
  await page.evaluate(() => { PM.ai.json = async () => { throw { code: 'not_granted' }; }; });
  await footBtn(page, 'Redactar propuesta').click();
  await page.waitForTimeout(300);
  check((await page.locator('.modal').innerText()).includes('No se autorizó usar Claude'), 'error not_granted explicado');
  await footBtn(page, 'Cancelar').click();
  await page.waitForTimeout(200);
  check(await aiBtn.count() === 0, 'la función se oculta tras not_granted');

  step('Documentos múltiples');
  await gotoView(page, 'documentos');
  await page.locator('tr[data-tid="acta-reunion"] button', { hasText: 'Nuevo' }).click();
  await page.waitForTimeout(400);
  check(await page.inputValue('.docs-title-input') === 'Acta de reunión 01', 'título por defecto con consecutivo');
  check((await page.locator('.docs-bar').innerText()).includes('PRY-TEST-001-AR-01'), 'código con consecutivo -01');
  check((await listDocs(page)).filter((x) => x.id.startsWith('acta-reunion--')).length === 0, 'la instancia no existe hasta editarla');
  await page.fill('.docs-title-input', 'Reunión de arranque con el cliente');
  await page.waitForTimeout(1200);
  let inst = (await listDocs(page)).filter((x) => x.id.startsWith('acta-reunion--'));
  check(inst.length === 1 && inst[0].data.title === 'Reunión de arranque con el cliente' && inst[0].data.seq === 1, 'instancia creada al editar el título');
  await page.click('.docs-title-input');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  check(await page.inputValue('.docs-title-input') === '', 'borrar todo el título deja el campo vacío mientras se edita');
  await page.keyboard.type('Arranque');
  check(await page.inputValue('.docs-title-input') === 'Arranque', 'se escribe el nuevo título sin restos del anterior');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  inst = (await listDocs(page)).filter((x) => x.id.startsWith('acta-reunion--'));
  check(await page.inputValue('.docs-title-input') === 'Acta de reunión 01' && inst[0].data.title === 'Acta de reunión 01', 'un título vacío vuelve al título por defecto');
  await page.fill('.docs-title-input', 'Reunión de arranque con el cliente');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await gotoView(page, 'documentos');
  await page.locator('tr[data-tid="acta-reunion"] button', { hasText: 'Nuevo' }).click();
  await page.waitForTimeout(400);
  check(await page.inputValue('.docs-title-input') === 'Acta de reunión 02', 'segunda instancia con consecutivo 02');
  await page.locator('[data-callout="nuevo"] button', { hasText: 'Crear documento' }).click();
  await page.waitForTimeout(600);
  inst = (await listDocs(page)).filter((x) => x.id.startsWith('acta-reunion--'));
  check(inst.length === 2 && inst.some((x) => x.data.seq === 2), 'segunda instancia creada con Crear documento');
  await page.locator('.docs-bar button', { hasText: 'Emitir borrador A' }).click();
  await footBtn(page, 'Emitir borrador A').click();
  await page.waitForTimeout(500);
  const second = inst.find((x) => x.data.seq === 2).id;
  check((await listRevs(page, second)).length === 1, 'revisión emitida en la segunda instancia');
  await barBtn(page, 'Enviar a revisión').click();
  await footBtn(page, 'Enviar a revisión').click();
  await page.waitForTimeout(400);
  await barBtn(page, 'Emitir borrador B').click();
  await page.fill('#docs-issue-note', 'Comentarios del cliente incorporados.');
  await footBtn(page, 'Emitir borrador B').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, second);
  check(d.rev === 'B' && d.status === 'borrador', 'desde revisión se emite el borrador B');
  await page.locator('button[aria-label="Más acciones del documento"]').click();
  await page.locator('.menu-item', { hasText: 'Marcar como obsoleto' }).click();
  await footBtn(page, 'Marcar como obsoleto').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, second);
  check(d.status === 'obsoleto' && d.rev === 'B', 'documento marcado como obsoleto (conserva la revisión)');
  check(await page.locator('.docs-title-input').count() === 0 && await page.locator('[data-field] textarea').count() === 0 && (await page.locator('.page').innerText()).includes('Documento obsoleto'), 'un documento obsoleto queda en solo lectura con aviso');
  await barBtn(page, 'Crear nueva revisión (C)').click();
  await footBtn(page, 'Crear revisión C').click();
  await page.waitForTimeout(500);
  d = await getDoc(page, second);
  check(d.status === 'borrador' && d.rev === 'C' && await page.locator('.docs-title-input').count() === 1, 'reactivar con una nueva revisión (C)');
  check((await listRevs(page, second)).map((x) => x.data.rev + ':' + x.data.status).sort().join(',') === 'A:borrador,A:revision,B:borrador,B:obsoleto', 'historial de la instancia con 4 emisiones');
  await gotoView(page, 'documentos');
  const instRows = page.locator('tr.docs-inst');
  check(await instRows.count() === 2, 'la lista muestra las dos instancias');
  check((await page.locator('tr[data-doc="' + inst.find((x) => x.data.seq === 1).id + '"]').innerText()).includes('PRY-TEST-001-AR-01'), 'código de la primera instancia');
  await shot(page, 'documentos');

  step('Exportar lista maestra (CSV) y filtros');
  await page.evaluate(() => { window.__dl = []; });
  await page.locator('.page-actions button', { hasText: 'Exportar lista (CSV)' }).click();
  await page.waitForTimeout(200);
  const csv = (await page.evaluate(() => window.__dl))[0];
  check(csv && csv.n === 'PRY-TEST-001_lista-maestra.csv', 'nombre del archivo CSV (' + (csv && csv.n) + ')');
  check(csv && csv.data.includes('PRY-TEST-001-ACT;') && csv.data.includes('PRY-TEST-001-AR-01;Reunión de arranque con el cliente') && csv.data.includes('Código;Documento'), 'contenido del CSV');
  await page.selectOption('select[aria-label="Filtrar por estado"]', 'borrador');
  const visibleRows = await page.locator('tbody tr').count();
  check(visibleRows >= 3 && (await page.locator('tr[data-doc="acta-constitucion"]').count()) === 1, 'filtro por estado borrador');
  await page.selectOption('select[aria-label="Filtrar por estado"]', 'aprobado');
  check(await page.locator('.empty').count() === 1, 'estado vacío cuando ningún documento coincide');
  await page.locator('button', { hasText: 'Limpiar filtros' }).first().click();
  await page.fill('input[aria-label="Buscar documentos"]', 'arranque');
  check(await page.locator('tr.docs-inst').count() === 1 && await page.locator('tr[data-tid="acta-reunion"]').count() === 1, 'la búsqueda encuentra la instancia y su plantilla');
  await page.fill('input[aria-label="Buscar documentos"]', '');

  step('Eliminar documento');
  await page.evaluate((id) => PM.openDocument(id), second);
  await page.waitForTimeout(400);
  await page.locator('button[aria-label="Más acciones del documento"]').click();
  await page.locator('.menu-item', { hasText: 'Eliminar documento' }).click();
  await footBtn(page, 'Eliminar documento').click();
  await page.waitForTimeout(800);
  st = await stateOf(page);
  check(st.view === 'documentos', 'vuelve a la lista tras eliminar');
  check(await getDoc(page, second) === null && (await listRevs(page, second)).length === 0, 'documento y revisiones eliminados');

  step('Documento con plantilla no disponible');
  await page.evaluate(() => PM.store.set(PM.paths.doc(PM.getState().projectId, 'plantilla-retirada'), { template: 'plantilla-retirada', title: 'Formato retirado', status: 'aprobado', rev: '0', fields: { observaciones: 'Texto guardado', items: [{ id: 'r_x1', nombre: 'Uno', cantidad: 2 }] }, titleBlock: {}, updatedAt: new Date().toISOString() }));
  await gotoView(page, 'documentos');
  check(await page.locator('section[data-area="otros"] tr[data-doc="plantilla-retirada"]').count() === 1, 'documento huérfano listado aparte');
  await page.evaluate(() => PM.openDocument('plantilla-retirada'));
  await page.waitForTimeout(400);
  const orphan = await page.locator('.page').innerText();
  check(orphan.includes('no está disponible') && orphan.includes('Texto guardado') && orphan.includes('Uno'), 'se muestran los datos guardados con aviso');
  await noErrorCards(page, 'documento huérfano');

  step('Modo de solo lectura');
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.evaluate(() => PM.openDocument('acta-constitucion'));
  await page.waitForTimeout(400);
  check(await page.locator('[data-field] input, [data-field] textarea, [data-field] select').count() === 0, 'sin controles de edición');
  check(await page.locator('.docs-bar button').count() === 0, 'sin acciones de flujo');
  check(await page.locator('button[aria-label="Exportar documento"]').count() === 1, 'exportar sigue disponible');
  await gotoView(page, 'documentos');
  check(await page.locator('tr[data-doc="enunciado-alcance"] button', { hasText: 'Ver plantilla' }).count() === 1 && await page.locator('button', { hasText: 'Nuevo' }).count() === 0, 'lista sin acciones de creación');
  await page.evaluate(() => PM.openDocument('enunciado-alcance'));
  await page.waitForTimeout(300);
  check(await page.locator('[data-callout="nuevo"]').count() === 0 && (await page.locator('.page').innerText()).includes('modo de consulta'), 'plantilla vacía en modo de consulta');
  check(await getDoc(page, 'enunciado-alcance') === null, 'consultar no crea el documento');
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="5.3"]');
  await page.waitForSelector('.modal');
  check(await page.locator('.modal .docs-out-row[data-doc="enunciado-alcance"] button', { hasText: 'Ver plantilla' }).count() === 1 && await page.locator('.modal button', { hasText: 'Crear' }).count() === 0, 'detalle del proceso en solo lectura: Ver plantilla en lugar de Crear');
  await footBtn(page, 'Cerrar').click();
  await page.evaluate(() => PM.setState({ canWrite: true }));

  step('Línea base y documentos relacionados');
  await page.evaluate(() => PM.openDocument('enunciado-alcance'));
  await page.waitForTimeout(300);
  check((await page.locator('aside[aria-label="Información del documento"]').innerText()).includes('Documento de línea base'), 'nota de control integrado de cambios');
  check(await page.locator('aside[aria-label="Información del documento"] [data-related="acta-constitucion"]').count() === 1, 'documento relacionado (entrada del proceso 5.3)');
  await page.locator('aside[aria-label="Información del documento"] .docs-rel-item', { hasText: '5.3' }).click();
  await page.waitForTimeout(400);
  st = await stateOf(page);
  check(st.view === 'procesos' && await page.locator('.modal').count() === 1, 'el proceso abre su detalle en el mapa');
  await footBtn(page, 'Cerrar').click();
  check((await page.locator('.docs-proc[data-code="4.1"] .docs-proc-meta').innerText()).includes('0/2'), 'mapa: el acta en borrador no cuenta como aprobada');

  step('Sin base de conocimiento');
  await page.evaluate(() => { window.__kb = PM.KB; PM.KB = undefined; });
  await gotoView(page, 'documentos');
  await gotoView(page, 'procesos');
  check((await page.locator('.empty').innerText()).includes('base de conocimiento'), 'mapa explica que falta la base de conocimiento');
  await page.evaluate(() => { PM.KB = window.__kb; });
  await noErrorCards(page, 'fin escritorio');
  check(!errors.length, 'sin errores de consola (escritorio)' + (errors.length ? ': ' + errors.join(' | ').slice(0, 600) : ''));
} catch (e) {
  failures++; console.log('EXCEPCIÓN', e);
} finally {
  await app.browser.close();
}

/* ================================================================ tema oscuro */
{
  const dk = await openApp({ file, width: 1360, height: 900, dark: true });
  try {
    step('Tema oscuro');
    await dk.page.evaluate(installStubs);
    await createProject(dk.page);
    await dk.page.waitForTimeout(300);
    await gotoView(dk.page, 'procesos');
    await shot(dk.page, 'procesos-dark');
    await dk.page.evaluate(() => PM.openDocument('acta-constitucion'));
    await dk.page.waitForTimeout(300);
    await dk.page.fill('#docs-f-proposito', PROPOSITO);
    await dk.page.locator('[data-field="hitos"] button', { hasText: 'Agregar fila' }).click();
    await dk.page.waitForTimeout(800);
    await shot(dk.page, 'documento-dark');
    await gotoView(dk.page, 'documentos');
    await shot(dk.page, 'documentos-dark');
    await noErrorCards(dk.page, 'tema oscuro');
    check(!dk.errors.length, 'sin errores de consola (oscuro)' + (dk.errors.length ? ': ' + dk.errors.join(' | ').slice(0, 600) : ''));
  } catch (e) { failures++; console.log('EXCEPCIÓN', e); } finally { await dk.browser.close(); }
}

/* ================================================================ móvil 400 px */
{
  const mb = await openApp({ file, width: 400, height: 860 });
  const p = mb.page;
  try {
    step('Móvil 400 px');
    await p.evaluate(installStubs);
    await createProject(p);
    await p.waitForTimeout(300);
    await gotoView(p, 'procesos');
    check(await p.locator('.docs-matrix').count() === 0 && await p.locator('.docs-acc').count() === 10, 'lista por áreas en lugar de la matriz');
    await overflowOk(p, 'mapa móvil');
    await p.locator('.docs-acc[data-area="integracion"] .docs-acc-head').click();
    check(await p.locator('.docs-acc[data-area="integracion"] .docs-proc').count() === 7, 'el área abre sus 7 procesos');
    await shot(p, 'procesos-m');
    await p.click('.docs-proc[data-code="4.1"]');
    await p.waitForSelector('.modal');
    await overflowOk(p, 'detalle de proceso móvil');
    await shot(p, 'procesos-detalle-m');
    await footBtn(p, 'Cerrar').click();
    await p.locator('.btn-group button', { hasText: 'Matriz' }).click();
    check(await p.locator('.docs-matrix').count() === 1, 'la matriz sigue disponible a demanda');
    await overflowOk(p, 'matriz en móvil (desplazamiento interno)');
    await gotoView(p, 'documentos');
    await overflowOk(p, 'lista maestra móvil');
    await shot(p, 'documentos-m');
    await p.evaluate(() => PM.openDocument('acta-constitucion'));
    await p.waitForTimeout(300);
    await p.fill('#docs-f-proposito', PROPOSITO);
    await p.locator('[data-field="objetivos"] button', { hasText: 'Agregar elemento' }).click();
    await p.keyboard.type('Objetivo en móvil');
    await p.locator('[data-field="hitos"] button', { hasText: 'Agregar fila' }).click();
    await p.waitForTimeout(900);
    await overflowOk(p, 'editor móvil');
    await shot(p, 'documento-m');
    await p.locator('button[aria-label="Exportar documento"]').click();
    await overflowOk(p, 'menú exportar móvil');
    await shot(p, 'documento-m-menu');
    await p.keyboard.press('Escape');
    await p.locator('.docs-bar button', { hasText: 'Emitir borrador A' }).click();
    await p.fill('#docs-issue-note', 'Primera emisión desde el teléfono, con una nota larga para comprobar que el historial se lee bien en pantallas angostas.');
    await footBtn(p, 'Emitir borrador A').click();
    await p.waitForTimeout(500);
    await p.locator('.page-actions button', { hasText: 'Historial' }).click();
    await p.waitForSelector('.docs-hist');
    const histBox = await p.locator('.docs-hist tbody tr').first().boundingBox();
    check(histBox && histBox.width <= 400 && (await p.locator('.docs-hist tbody tr').first().innerText()).includes('Emitió'), 'historial en tarjetas en móvil');
    await overflowOk(p, 'historial móvil');
    await shot(p, 'historial-m');
    await footBtn(p, 'Cerrar').click();
    await gotoView(p, 'documentos');
    check((await p.locator('tr[data-doc="acta-constitucion"] .docs-c-rev').innerText()).includes('Rev. A'), 'en la lista móvil la revisión lleva su etiqueta');
    await noErrorCards(p, 'móvil');
    check(!mb.errors.length, 'sin errores de consola (móvil)' + (mb.errors.length ? ': ' + mb.errors.join(' | ').slice(0, 600) : ''));
  } catch (e) { failures++; console.log('EXCEPCIÓN', e); } finally { await mb.browser.close(); }
}

console.log('\n' + (failures ? failures + ' verificaciones fallidas' : 'Todas las verificaciones pasaron'));
process.exit(failures ? 1 : 0);

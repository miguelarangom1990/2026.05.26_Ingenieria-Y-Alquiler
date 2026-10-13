/* ==========================================================================
   15-templates-negocio.js — documentos de negocio que rodean al proyecto
   (Guía del PMBOK® 6.ª ed., 1.2.6, y Guía de práctica del análisis de negocio
   del PMI), complementan el caso de negocio y el plan de gestión de los
   beneficios (12-templates-a.js):
   - ANTES: evaluación de necesidades (antecedente del caso de negocio) y
     acuerdo con el cliente (contrato, orden o acuerdo interno: la entrada
     «Acuerdos» del proceso 4.1).
   - DESPUÉS: informe de realización de los beneficios (lo emite el dueño de
     los beneficios después del cierre, en cada medición; múltiple).
   Contrato: SPEC.md §5–§6. Las claves de campos y columnas son estables (los
   ejemplos de Medellín y del ERP las diligencian).
   Los ejemplos describen el proyecto del andamio (SPEC.md §8): la evaluación
   y el acuerdo se generan en el ejemplo (90) con su emisión inicial anterior
   o igual a la del acta de constitución. El acuerdo registra la orden de
   cambio No. 1 (CC-002, septiembre): el ejemplo emite la rev. 0 sin ella y la
   rev. 1 después de la orden. El informe de beneficios ilustra un
   seguimiento posterior al cierre y no se genera (grupo «cierre»).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || typeof PM.registerTemplates !== 'function') return;

  /* ------------------------------------------------------------------ opciones */
  /* Evaluación de necesidades. Origen: los cuatro factores que dan lugar a los proyectos según la Guía del PMBOK® 6.ª ed.,
     1.2.1 (contexto de inicio del proyecto); la evaluación precede al caso de negocio (1.2.6.1). */
  const ORIGEN_NECESIDAD = [
    'Cumplir un requisito legal, normativo o social',
    'Atender la solicitud o necesidad de un cliente o interesado',
    'Implementar o cambiar una estrategia de negocio o tecnológica',
    'Crear, mejorar o reparar un producto, proceso o servicio',
  ];
  const ATIENDE = ['Sí', 'Parcialmente', 'No'];
  const GRADO = ['Alto', 'Medio', 'Bajo'];
  const DECISION_EVALUACION = ['Elaborar el caso de negocio', 'Ampliar el análisis', 'Descartar la necesidad'];
  // Acuerdo con el cliente
  const TIPO_ACUERDO = ['Contrato', 'Orden de compra', 'Orden de servicio', 'Aceptación de oferta', 'Convenio', 'Acuerdo interno o memorando de entendimiento'];
  const MODALIDAD_PRECIO = ['Precio global fijo', 'Precios unitarios', 'Tarifas por periodo (alquiler o servicio)', 'Administración delegada', 'Costo reembolsable más honorarios', 'Tiempo y materiales con tope', 'Mixto', 'Presupuesto interno asignado'];
  const BASE_VALOR = ['Antes de IVA', 'IVA incluido', 'No aplica (acuerdo interno)'];
  const AMPAROS = [
    'Buen manejo y correcta inversión del anticipo',
    'Cumplimiento',
    'Pago de salarios, prestaciones sociales e indemnizaciones laborales',
    'Responsabilidad civil extracontractual',
    'Calidad del servicio',
    'Calidad y correcto funcionamiento de los bienes',
    'Estabilidad y calidad de la obra',
    'Otra garantía',
  ];
  const ESTADO_POLIZA = ['Pendiente', 'Aprobada', 'Vencida', 'No aplica'];
  const PARTES = ['Contratista o área ejecutora', 'Contratante o patrocinador', 'Ambas partes'];
  const TIPO_MODIFICACION = ['Otrosí', 'Adición en valor', 'Prórroga del plazo', 'Adición y prórroga', 'Orden de cambio', 'Suspensión', 'Reanudación', 'Cesión', 'Terminación anticipada'];
  const ESTADO_MODIFICACION = ['En trámite', 'Firmada', 'Rechazada'];
  // Informe de realización de los beneficios
  const ESTADO_BENEFICIO = ['Logrado', 'Parcial', 'No logrado', 'Pendiente'];
  const ESTADO_ACCION = ['Pendiente', 'En curso', 'Cumplida'];
  const CONCLUSION_CASO = ['Se cumplió', 'Se cumple parcialmente', 'No se cumplió', 'Aún no se puede concluir'];

  /* ------------------------------------------------------------------ cálculos de columnas (puros, toleran vacíos) */
  const numOrNull = (v) => {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const round = (x, d) => { const f = Math.pow(10, d === undefined ? 2 : d); return Math.round(x * f) / f; };
  const get = (row, key) => (row && typeof row === 'object' ? row[key] : undefined);
  const indexIn = (row, rows) => {
    if (!Array.isArray(rows)) return -1;
    let i = rows.indexOf(row);
    if (i < 0 && row && row.id) i = rows.findIndex((r) => r && r.id === row.id);
    return i;
  };
  /* Acumulado en el orden de la tabla: suma fn(fila) desde la primera fila hasta la actual. */
  const cumulative = (fn) => (row, rows) => {
    const i = indexIn(row, rows);
    const upto = i < 0 ? [row] : rows.slice(0, i + 1);
    let any = false, s = 0;
    for (const r of upto) { const x = fn(r); if (x !== null) { any = true; s += x; } }
    return any ? round(s) : null;
  };

  // Evaluación de necesidades: brecha = valor deseado − valor actual (en la unidad del indicador)
  const calcBrecha = (row) => {
    const a = numOrNull(get(row, 'valorActual')), d = numOrNull(get(row, 'valorDeseado'));
    return a === null || d === null ? null : round(d - a, 2);
  };
  // Acuerdo: valor asegurado = valor base × porcentaje
  const calcAsegurado = (row) => {
    const b = numOrNull(get(row, 'valorBase')), p = numOrNull(get(row, 'porcentaje'));
    return b === null || p === null ? null : Math.round((b * p) / 100);
  };
  /* Acuerdo: suman las modificaciones firmadas y las que no tienen estado; no suman las que están en trámite ni las
     rechazadas (los textos de ayuda de la tabla lo dicen igual). */
  const vigente = (row) => !['en trámite', 'rechazada'].includes(String(get(row, 'estado') || '').trim().toLowerCase());
  const calcValorAcumulado = cumulative((row) => (vigente(row) ? numOrNull(get(row, 'efectoValor')) : null));
  const calcPlazoAcumulado = cumulative((row) => (vigente(row) ? numOrNull(get(row, 'efectoPlazo')) : null));
  /* Informe de beneficios: avance hacia la meta desde la línea base (fracción; 1 = meta cumplida).
     Sin línea base se toma 0. Sirve para metas que suben o bajan; si la meta es mantener el valor
     de la línea base, da 1 cuando el resultado lo iguala y 0 si no. */
  const calcAvanceBeneficio = (row) => {
    const r = numOrNull(get(row, 'resultado')), m = numOrNull(get(row, 'meta'));
    if (r === null || m === null) return null;
    const b = numOrNull(get(row, 'lineaBase')) || 0;
    if (m === b) return r === m ? 1 : 0;
    return round((r - b) / (m - b), 4);
  };

  /* ------------------------------------------------------------------ formatos */
  const cur = (ctx) => (ctx && ctx.currency) || (typeof PM.currentCurrency === 'function' ? PM.currentCurrency() : 'COP');
  const fmtMoney = (v, row, ctx) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.money(v, cur(ctx)));
  const fmtNum1 = (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.num(v, 1));
  const fmtDays = (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.num(v, 0) + (Math.abs(v) === 1 ? ' día' : ' días'));
  const fmtAvance = (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.pct(v, 0));

  /* ------------------------------------------------------------------ proyecto de ejemplo (SPEC §8) */
  const EX = {
    name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista',
    client: 'Constructora Modelo S.A.S. (ficticia)',
    sponsor: 'Gerencia General',
    start: '2026-08-03',
    end: '2026-12-18',
  };
  /* Cifras que vienen de otras plantillas del ejemplo (caso de negocio, informe final y acta de cierre). */
  const exOf = (id) => (PM.templates && PM.templates[id] && PM.templates[id].example) || {};
  const pick = (v, dflt) => (typeof v === 'number' && Number.isFinite(v) ? v : dflt);
  const VALOR_CONTRATO = pick(exOf('caso-negocio').valorContrato, 598000000);
  const VALOR_FINAL = pick(exOf('acta-cierre').valorFinal, 610600000);
  const COSTO_FINAL = pick(exOf('informe-final').costoFinal, 464300000);
  const MARGEN_FINAL = round(((VALOR_FINAL - COSTO_FINAL) / VALOR_FINAL) * 100, 1);
  const ANTICIPO_PCT = 20;
  const ANTICIPO = Math.round((VALOR_CONTRATO * ANTICIPO_PCT) / 100);
  const PLAZO_DIAS = PM.date && typeof PM.date.diff === 'function' ? PM.date.diff(EX.start, EX.end) + 1 : 138;
  /* Orden de cambio No. 1 del contrato (CC-002, plataforma de descargue del piso 8): el acta de cierre liquida el valor
     final como el contrato inicial más esta orden. No mueve la fecha de terminación (la solicitud de cambio usa la
     holgura de la ruta de accesos y protecciones). */
  const ORDEN_CAMBIO_1 = VALOR_FINAL - VALOR_CONTRATO;
  /* Beneficios de mediano plazo del plan de gestión de los beneficios: «hasta 1 año» después del cierre. */
  const FECHA_CIERRE = typeof exOf('acta-cierre').fechaCierre === 'string' ? exOf('acta-cierre').fechaCierre : '2026-12-22';
  const FIN_MEDIANO_PLAZO = PM.date && typeof PM.date.addMonths === 'function' ? PM.date.addMonths(FECHA_CIERRE, 12) : '2027-12-22';

  /* Columnas de firmas (mismas claves que las actas de 12-templates-a.js) */
  const firmasColumns = () => [
    { key: 'rol', label: 'Rol', type: 'text', width: 200, hint: 'Parte o rol con el que firma (contratante, contratista, patrocinador, área ejecutora).' },
    { key: 'nombre', label: 'Nombre o cargo', type: 'text', width: 220 },
    { key: 'fecha', label: 'Fecha', type: 'date' },
  ];

  const templates = [
    /* ================================================================== ANTES · 4.1 (antecedente del caso de negocio) */
    {
      id: 'evaluacion-necesidades',
      name: 'Evaluación de necesidades',
      abbr: 'EVN',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'],
      kind: 'documento', multiple: false,
      purpose: 'Analiza, antes de que exista el proyecto, el problema o la oportunidad del negocio: la situación actual frente a la deseada, sus causas, los interesados afectados y las opciones de alto nivel. Su recomendación decide si se elabora el caso de negocio.',
      tips: [
        'Describe el problema, no la solución: «el cliente necesita andamio certificado para su fachada» es una necesidad; «montar 15 niveles de andamio» ya es una solución.',
        'Mide la situación actual con datos (utilización del inventario, capacidad de montaje, piezas disponibles): esas cifras serán la línea base del plan de gestión de los beneficios.',
        'Incluye siempre la opción de no hacer nada y deja escrito si cada opción pasa o no al caso de negocio.',
        'Consulta a los afectados antes de recomendar: cliente, interventoría, almacén, SST y montaje ven riesgos distintos.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación',
          fields: [
            { key: 'nombre', label: 'Necesidad u oportunidad', type: 'text', from: 'project.name', required: true, hint: 'Nombre corto de la iniciativa; si se aprueba, suele convertirse en el nombre del proyecto.' },
            { key: 'origen', label: 'Origen de la necesidad', type: 'select', options: ORIGEN_NECESIDAD, hint: 'Qué la motiva, según la Guía del PMBOK® (1.2.1, contexto de inicio del proyecto): requisito legal, solicitud de un interesado, estrategia, o crear o mejorar un producto o servicio.' },
            { key: 'solicitante', label: 'Quién plantea la necesidad', type: 'text', hint: 'Cliente, área o interesado que la presenta.' },
            { key: 'patrocinador', label: 'Patrocinador', type: 'text', from: 'project.sponsor', hint: 'Quién decide si se elabora el caso de negocio.' },
            { key: 'responsableAnalisis', label: 'Responsable del análisis', type: 'text', hint: 'Rol que elabora la evaluación (analista de negocio, gerencia comercial, director designado).' },
            { key: 'fechaEvaluacion', label: 'Fecha de la evaluación', type: 'date', required: true, hint: 'Fecha en que se presenta la evaluación al patrocinador.' },
          ],
        },
        {
          id: 'necesidad', title: 'Problema u oportunidad',
          fields: [
            { key: 'problema', label: 'Enunciado del problema u oportunidad', type: 'textarea', required: true, hint: 'Qué pasa hoy, a quién afecta y qué se pierde si no se actúa. Escríbelo sin proponer todavía una solución.' },
            { key: 'objetivosOrganizacion', label: 'Metas y objetivos de la organización relacionados', type: 'textarea', hint: 'Objetivos estratégicos a los que contribuiría atender la necesidad.' },
            { key: 'urgencia', label: 'Urgencia y ventana de oportunidad', type: 'textarea', hint: 'Por qué actuar ahora: fechas del cliente, temporada, vigencia de una norma, plazo para ofertar.' },
          ],
        },
        {
          id: 'situacion', title: 'Situación actual y deseada',
          description: 'Compara cómo está hoy la organización (o el cliente) con cómo debería estar. Si la brecha se puede medir, registra el indicador con su valor actual y el deseado: la brecha se calcula sola y luego sirve de línea base para el plan de gestión de los beneficios.',
          fields: [
            {
              key: 'brechas', label: 'Análisis de brechas', type: 'table', addLabel: 'Agregar aspecto',
              hint: 'Un aspecto por fila: procesos, personas y competencias, equipos, información o capacidades del negocio.',
              columns: [
                { key: 'aspecto', label: 'Aspecto o capacidad', type: 'text', width: 180 },
                { key: 'actual', label: 'Situación actual', type: 'textarea', width: 220 },
                { key: 'deseada', label: 'Situación deseada', type: 'textarea', width: 220 },
                { key: 'indicador', label: 'Indicador', type: 'text', width: 170 },
                { key: 'valorActual', label: 'Valor actual', type: 'number', width: 100 },
                { key: 'valorDeseado', label: 'Valor deseado', type: 'number', width: 100 },
                { key: 'brecha', label: 'Brecha', type: 'calc', calc: calcBrecha, format: fmtNum1, hint: 'Valor deseado − valor actual, en la unidad del indicador.' },
              ],
            },
            { key: 'causas', label: 'Causas principales', type: 'list', hint: 'Por qué existe la brecha (análisis de causa raíz, cinco porqués o diagrama de Ishikawa).' },
            {
              key: 'afectados', label: 'Interesados afectados', type: 'table', addLabel: 'Agregar interesado',
              hint: 'Quiénes sufren el problema o se benefician de resolverlo, y qué esperan; el detalle irá al registro de interesados.',
              columns: [
                { key: 'interesado', label: 'Interesado', type: 'text', width: 200 },
                { key: 'afectacion', label: 'Cómo lo afecta la necesidad', type: 'textarea', width: 260 },
                { key: 'expectativa', label: 'Qué espera de la solución', type: 'textarea', width: 240 },
                { key: 'grado', label: 'Grado de afectación', type: 'select', options: GRADO },
              ],
            },
          ],
        },
        {
          id: 'opciones', title: 'Opciones de alto nivel',
          description: 'Opciones generales para atender la necesidad, sin diseñarlas todavía. Incluye no hacer nada; el caso de negocio compara en detalle las que pasan.',
          fields: [
            {
              key: 'opciones', label: 'Opciones', type: 'table', addLabel: 'Agregar opción',
              hint: 'Una fila por opción, con lo que resuelve, sus ventajas y desventajas, y si pasa al caso de negocio.',
              columns: [
                { key: 'opcion', label: 'Opción', type: 'text', width: 180 },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 240 },
                { key: 'atiende', label: '¿Atiende la necesidad?', type: 'select', options: ATIENDE },
                { key: 'ventajas', label: 'Ventajas', type: 'textarea', width: 200 },
                { key: 'desventajas', label: 'Desventajas y riesgos', type: 'textarea', width: 220 },
                { key: 'pasaCaso', label: 'Pasa al caso de negocio', type: 'check' },
              ],
              defaultRows: [
                { id: 'opcion-1', opcion: 'No hacer nada' },
                { id: 'opcion-2', opcion: 'Hacer lo mínimo' },
                { id: 'opcion-3', opcion: 'Hacer más (solución completa)' },
              ],
            },
          ],
        },
        {
          id: 'recomendacion', title: 'Recomendación y decisión',
          fields: [
            { key: 'recomendacion', label: 'Recomendación', type: 'textarea', required: true, hint: 'Si se elabora el caso de negocio, con qué opciones y qué hay que confirmar antes (inventario, capacidad, condiciones del cliente).' },
            { key: 'criteriosEvaluacion', label: 'Criterios para comparar las opciones en el caso de negocio', type: 'list', hint: 'Con qué se decidirá: cumplimiento normativo, margen, flujo de caja, riesgo, aporte a la estrategia.' },
            { key: 'supuestosRestricciones', label: 'Supuestos y restricciones identificados', type: 'list', hint: 'Condiciones que se dan por ciertas o que limitan las opciones; pasan al registro de supuestos.' },
            { key: 'decision', label: 'Decisión del patrocinador', type: 'select', options: DECISION_EVALUACION },
            { key: 'fechaDecision', label: 'Fecha de la decisión', type: 'date' },
          ],
        },
      ],
      example: {
        nombre: EX.name,
        origen: 'Atender la solicitud o necesidad de un cliente o interesado',
        solicitante: 'Director de obra del cliente (Constructora Modelo S.A.S., ficticia)',
        patrocinador: EX.sponsor,
        responsableAnalisis: 'Director de proyecto (designado para la oferta) con el ingeniero de diseño',
        fechaEvaluacion: '2026-07-10',
        problema: 'Constructora Modelo S.A.S. (ficticia) debe ejecutar entre agosto y diciembre de 2026 la fachada de la Torre 2 del Edificio Altavista (15 pisos), y su contrato con la interventoría exige trabajo en alturas conforme a la Resolución 4272 de 2021, con andamio diseñado, inspeccionado y certificado por persona competente. El cliente pidió una solución que incluya ingeniería, montaje y certificación, y no solo el alquiler del equipo. Para la empresa es la oportunidad de ocupar el inventario de andamio multidireccional que queda libre en el segundo semestre.',
        objetivosOrganizacion: 'Objetivo estratégico 2026: crecer 15 % los ingresos por servicios integrales de andamios (ingeniería, montaje y certificación) frente al alquiler simple. Plan estratégico 2026–2028: elevar la utilización del inventario propio de andamio multidireccional y conservar a los clientes constructores recurrentes.',
        urgencia: 'El cliente necesita definir el proveedor en julio para tener el primer frente de andamio montado en la segunda quincena de septiembre. Si la empresa no oferta, el inventario queda ocioso en el segundo semestre y el cliente contrata con otro proveedor.',
        brechas: [
          { id: 'r1', aspecto: 'Utilización del inventario de andamio multidireccional', actual: 'El 62 % de los m² disponibles está alquilado (julio de 2026); cerca de 4.800 m² quedarán ociosos en el segundo semestre.', deseada: 'Inventario ocupado en al menos 75 % entre septiembre y noviembre de 2026.', indicador: 'm² alquilados ÷ m² disponibles (%)', valorActual: 62, valorDeseado: 75 },
          { id: 'r2', aspecto: 'Servicio integral con este cliente', actual: 'Solo alquiler simple: ningún contrato de ingeniería, montaje y certificación con el cliente.', deseada: 'Un contrato de servicio integral en ejecución que abra la puerta a la Torre 3 del mismo proyecto.', indicador: 'Contratos integrales con el cliente', valorActual: 0, valorDeseado: 1 },
          { id: 'r3', aspecto: 'Capacidad de montaje y supervisión', actual: 'Ingeniero de diseño y cuadrillas de montadores certificados disponibles, con un supervisor de montaje libre para el segundo semestre.', deseada: 'Dos frentes de montaje en paralelo, cada uno con su supervisor.', indicador: 'Supervisores de montaje disponibles', valorActual: 1, valorDeseado: 2 },
          { id: 'r4', aspecto: 'Piezas para la Torre 2', actual: 'Almacén confirmó en bodega cerca del 90 % de las piezas requeridas; faltan diagonales y plataformas.', deseada: 'El 100 % de las piezas disponible antes del despacho, con el faltante cubierto por un proveedor aliado.', indicador: 'Piezas disponibles (%)', valorActual: 90, valorDeseado: 100 },
          { id: 'r5', aspecto: 'Trabajo en alturas certificado', actual: 'El cliente no tiene ingeniería de andamios ni inspección por persona competente para la fachada.', deseada: 'Andamio diseñado con memoria de cálculo, montado por etapas e inspeccionado por persona competente conforme a la Resolución 4272 de 2021.', indicador: '', valorActual: null, valorDeseado: null },
        ],
        causas: [
          'El contrato del cliente con la interventoría exige trabajo en alturas certificado conforme a la Resolución 4272 de 2021.',
          'La fachada de la Torre 2 (mampostería, pañete y pintura) empieza en agosto y requiere andamio en las fachadas norte, oriente y occidente.',
          'Sin nuevos contratos, cerca de 4.800 m² de andamio multidireccional quedarán sin ocupar en el segundo semestre.',
        ],
        afectados: [
          { id: 'r1', interesado: 'Director de obra del cliente', afectacion: 'Sin andamio certificado no puede iniciar la fachada ni cumplir su programa de obra.', expectativa: 'Andamio disponible por etapas para no frenar la fachada.', grado: 'Alto' },
          { id: 'r2', interesado: 'Interventoría del cliente', afectacion: 'Debe aprobar el diseño y liberar cada nivel antes de su uso.', expectativa: 'Cumplimiento normativo, memoria de cálculo aprobada y liberación de niveles por persona competente.', grado: 'Alto' },
          { id: 'r3', interesado: 'Gerencia General', afectacion: 'Responde por el crecimiento de los servicios integrales y por la utilización del inventario.', expectativa: 'Margen del contrato y relación de largo plazo con el cliente.', grado: 'Alto' },
          { id: 'r4', interesado: 'Almacén y Coordinador logístico', afectacion: 'Deben reservar el inventario y cubrir el faltante de piezas.', expectativa: 'Disponibilidad de piezas, despachos y retorno sin faltantes.', grado: 'Medio' },
          { id: 'r5', interesado: 'Coordinador SST (HSE)', afectacion: 'El servicio integral suma cinco meses de trabajo en alturas continuo.', expectativa: 'Trabajo en alturas sin accidentes y registros del SG-SST al día.', grado: 'Alto' },
        ],
        opciones: [
          { id: 'r1', opcion: 'No hacer nada (no ofertar)', descripcion: 'No presentar oferta y mantener el inventario disponible para alquileres simples.', atiende: 'No', ventajas: 'Sin inversión ni exposición adicional al trabajo en alturas.', desventajas: 'Pérdida de un cliente recurrente e inventario ocioso en el segundo semestre.', pasaCaso: true },
          { id: 'r2', opcion: 'Hacer lo mínimo (solo alquiler)', descripcion: 'Alquilar el equipo puesto en obra; el cliente asume montaje, certificación y desmontaje.', atiende: 'Parcialmente', ventajas: 'Menor costo y menor exposición de la empresa al trabajo en alturas.', desventajas: 'No responde por sí sola a la exigencia de la interventoría sobre certificación y control del trabajo en alturas; más daños y pérdidas de piezas con montaje de terceros.', pasaCaso: true },
          { id: 'r3', opcion: 'Hacer más (solución integral)', descripcion: 'Ingeniería, suministro, montaje por etapas, certificación, mantenimiento en obra, desmontaje y retiro.', atiende: 'Sí', ventajas: 'Atiende la exigencia de la interventoría y ocupa el inventario con un servicio de más valor.', desventajas: 'Mayor exposición al trabajo en alturas; dependencia de la grúa del cliente; lluvias de temporada.', pasaCaso: true },
        ],
        recomendacion: 'Elaborar el caso de negocio con las tres opciones y presentarlo a la Gerencia General antes de ofertar. Antes de cerrarlo hay que confirmar el costo de un supervisor de montaje adicional y del subarriendo de diagonales y plataformas, y las condiciones de pago del cliente (anticipo, actas de obra y retención en garantía).',
        criteriosEvaluacion: [
          'Cumplimiento de la exigencia de la interventoría sobre trabajo en alturas (Resolución 4272 de 2021).',
          'Margen bruto con el costo completo y las reservas.',
          'Flujo de caja: anticipo, plazo de pago y retención en garantía.',
          'Riesgos de seguridad y salud en el trabajo y de cronograma (lluvias y grúa del cliente).',
          'Aporte a la utilización del inventario y a la relación con el cliente.',
        ],
        supuestosRestricciones: [
          'El inventario confirmado por almacén el 10 de julio de 2026 se reserva para el proyecto.',
          'La grúa y el montacargas de la obra los aporta el cliente.',
          'Los despachos se hacen en los horarios permitidos a vehículos de carga en Bogotá.',
          'Plataformas con carga de servicio de 200 kg/m² en todos los niveles.',
        ],
        decision: 'Elaborar el caso de negocio',
        fechaDecision: '2026-07-13',
      },
    },

    /* ================================================================== ANTES · 4.1 (entrada «Acuerdos») */
    {
      id: 'acuerdo-cliente',
      name: 'Acuerdo con el cliente',
      abbr: 'ACU',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1', '4.6'],
      kind: 'documento', multiple: false,
      purpose: 'Resume el contrato, la orden de compra o de servicio, o el acuerdo interno que origina el proyecto: partes, objeto, valor, forma de pago, plazo, garantías, obligaciones, condiciones de aceptación y sanciones, con el control de sus modificaciones (otrosíes, adiciones y prórrogas). Es la entrada «Acuerdos» del acta de constitución.',
      tips: [
        'Firma el acuerdo y aprueba las pólizas antes del acta de inicio: el anticipo y la movilización dependen de ellas.',
        'Lleva al acta de constitución lo que el acuerdo fija (fechas, valor, hitos de pago y entregables); el acta no puede contradecirlo.',
        'Toda modificación de valor, plazo o alcance pasa por el control integrado de cambios (4.6) y se formaliza con otrosí u orden de cambio firmada y con el ajuste de las pólizas.',
        'En un proyecto interno usa un acuerdo o memorando de entendimiento entre el patrocinador y las áreas: presupuesto asignado, responsables, entregables y criterios de aceptación; las pólizas no aplican.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación del acuerdo',
          fields: [
            { key: 'tipoAcuerdo', label: 'Tipo de acuerdo', type: 'select', options: TIPO_ACUERDO, required: true, hint: 'Con un cliente externo suele ser un contrato o una orden; en un proyecto interno, un acuerdo o memorando de entendimiento.' },
            { key: 'numeroAcuerdo', label: 'Número o referencia', type: 'text', hint: 'Número del contrato, de la orden o del acuerdo interno.' },
            { key: 'objeto', label: 'Objeto', type: 'textarea', required: true, hint: 'Qué se obliga a hacer o entregar el contratista o el área ejecutora, tal como lo dice el acuerdo.' },
            { key: 'contratante', label: 'Contratante o área solicitante', type: 'text', from: 'project.client', hint: 'Cliente externo o, en un proyecto interno, el área o el patrocinador que encarga el trabajo.' },
            { key: 'contratista', label: 'Contratista o área ejecutora', type: 'text', hint: 'Quien ejecuta: la empresa (razón social) o el área interna responsable.' },
            { key: 'modalidadPrecio', label: 'Modalidad de precio', type: 'select', options: MODALIDAD_PRECIO, hint: 'Cómo se paga el trabajo; en un proyecto interno, «Presupuesto interno asignado».' },
            { key: 'fechaFirma', label: 'Fecha de firma', type: 'date', hint: 'Fecha en que firman las dos partes (o se acepta la orden).' },
            { key: 'fechaInicio', label: 'Fecha de inicio', type: 'date', from: 'project.start', hint: 'Fecha del acta de inicio u orden de iniciar.' },
            { key: 'fechaTerminacion', label: 'Fecha de terminación pactada', type: 'date', from: 'project.end', hint: 'Fecha de terminación del plazo, sin prórrogas.' },
            { key: 'plazo', label: 'Plazo', type: 'text', hint: 'Duración pactada y cómo se cuenta (días calendario o hábiles, desde el acta de inicio).' },
          ],
        },
        {
          id: 'valor', title: 'Valor y forma de pago',
          fields: [
            { key: 'valorInicial', label: 'Valor inicial', type: 'money', required: true, hint: 'Valor pactado al firmar, sin modificaciones. Las adiciones van en la tabla de modificaciones.' },
            { key: 'baseValor', label: 'Base del valor', type: 'select', options: BASE_VALOR, hint: 'Si el valor incluye o no el IVA (o si es un presupuesto interno).' },
            { key: 'anticipoPct', label: 'Anticipo (%)', type: 'pct', min: 0, max: 100, hint: 'Porcentaje del valor inicial que se gira por anticipado; 0 si no hay anticipo.' },
            { key: 'anticipoValor', label: 'Valor del anticipo', type: 'money', hint: 'Valor inicial × porcentaje del anticipo.' },
            { key: 'retencionPct', label: 'Retención en garantía (%)', type: 'pct', min: 0, max: 100, hint: 'Porcentaje de cada pago que retiene el contratante hasta la liquidación.' },
            { key: 'formaPago', label: 'Forma de pago', type: 'textarea', hint: 'Hitos o periodicidad de facturación, documentos para pagar (actas, factura electrónica), plazo de pago, amortización del anticipo y devolución de la retención.' },
          ],
        },
        {
          id: 'garantias', title: 'Garantías y pólizas',
          description: 'El valor asegurado se calcula con el valor base (del contrato o del anticipo) y el porcentaje exigido.',
          fields: [
            {
              key: 'polizas', label: 'Pólizas exigidas', type: 'table', addLabel: 'Agregar póliza',
              hint: 'Una fila por amparo, con su base, porcentaje, vigencia y estado de aprobación por el contratante.',
              columns: [
                { key: 'amparo', label: 'Amparo', type: 'select', options: AMPAROS, width: 260 },
                { key: 'valorBase', label: 'Valor base', type: 'money', width: 140 },
                { key: 'porcentaje', label: 'Porcentaje', type: 'pct', width: 90 },
                { key: 'valorAsegurado', label: 'Valor asegurado', type: 'calc', calc: calcAsegurado, format: fmtMoney, hint: 'Valor base × porcentaje.' },
                { key: 'vigencia', label: 'Vigencia', type: 'text', width: 220 },
                { key: 'fechaAprobacion', label: 'Aprobación', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_POLIZA },
              ],
              defaultRows: [
                { id: 'poliza-1', amparo: 'Cumplimiento' },
                { id: 'poliza-2', amparo: 'Pago de salarios, prestaciones sociales e indemnizaciones laborales' },
                { id: 'poliza-3', amparo: 'Responsabilidad civil extracontractual' },
              ],
            },
          ],
        },
        {
          id: 'obligaciones', title: 'Obligaciones, aceptación y sanciones',
          fields: [
            {
              key: 'obligaciones', label: 'Obligaciones de las partes', type: 'table', addLabel: 'Agregar obligación',
              hint: 'Las obligaciones principales de cada parte, con la cláusula que las fija y el rol que responde por ellas.',
              columns: [
                { key: 'parte', label: 'Parte', type: 'select', options: PARTES, width: 200 },
                { key: 'obligacion', label: 'Obligación', type: 'textarea', width: 300 },
                { key: 'clausula', label: 'Cláusula o anexo', type: 'text', width: 140 },
                { key: 'responsable', label: 'Responsable (rol)', type: 'text', width: 180 },
              ],
            },
            { key: 'supervision', label: 'Supervisor o interventor', type: 'text', hint: 'Quién vigila el cumplimiento por el contratante y aprueba actas y pagos.' },
            { key: 'responsableContratista', label: 'Responsable por el contratista o el área ejecutora', type: 'text', hint: 'Quién administra el acuerdo por quien ejecuta y quién firma como representante.' },
            { key: 'condicionesAceptacion', label: 'Condiciones de entrega y aceptación', type: 'textarea', hint: 'Cómo se entregan y aceptan los entregables: documentos, pruebas, quién firma y cuándo se liquida.' },
            { key: 'multas', label: 'Multas y cláusula penal', type: 'textarea', hint: 'Causales, porcentajes, topes y exclusiones (hechos del contratante, fuerza mayor).' },
            { key: 'suspensionTerminacion', label: 'Suspensión y terminación anticipada', type: 'textarea', hint: 'Cuándo se puede suspender o terminar el acuerdo y con qué procedimiento.' },
            { key: 'otrasClausulas', label: 'Otras cláusulas relevantes', type: 'textarea', hint: 'Indemnidad, confidencialidad, propiedad de los diseños, cesión, solución de controversias.' },
          ],
        },
        {
          id: 'documentos', title: 'Documentos contractuales y modificaciones',
          fields: [
            { key: 'documentosContractuales', label: 'Documentos del acuerdo (en orden de prelación)', type: 'list', hint: 'Contrato, pliego o términos de referencia, oferta, anexos, pólizas y actas; el primero prevalece si hay contradicción.' },
            {
              key: 'modificaciones', label: 'Modificaciones (otrosíes, adiciones y prórrogas)', type: 'table', addLabel: 'Agregar modificación',
              hint: 'Una fila por modificación, en orden de fecha. Los acumulados suman las firmadas y las que aún no tienen estado; no suman las que están en trámite ni las rechazadas.',
              columns: [
                { key: 'numero', label: 'Número', type: 'text', width: 110 },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_MODIFICACION, width: 170 },
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'objeto', label: 'Objeto', type: 'textarea', width: 260 },
                { key: 'solicitudCambio', label: 'Solicitud de cambio', type: 'text', width: 110, hint: 'Código del registro de cambios (CC-###) que la originó.' },
                { key: 'efectoValor', label: 'Efecto en el valor', type: 'money', width: 140, hint: 'Positivo si adiciona valor; negativo si lo reduce.' },
                { key: 'efectoPlazo', label: 'Efecto en el plazo (días)', type: 'number', width: 110, hint: 'Días calendario que se prorroga (positivo) o reduce (negativo) el plazo.' },
                { key: 'valorAcumulado', label: 'Adiciones acumuladas', type: 'calc', calc: calcValorAcumulado, format: fmtMoney, hint: 'Suma del efecto en el valor hasta esta fila, sin las modificaciones en trámite ni las rechazadas.' },
                { key: 'plazoAcumulado', label: 'Prórrogas acumuladas', type: 'calc', calc: calcPlazoAcumulado, format: fmtDays, hint: 'Suma del efecto en el plazo hasta esta fila, sin las modificaciones en trámite ni las rechazadas.' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_MODIFICACION },
              ],
            },
            { key: 'controlModificaciones', label: 'Cómo se modifica el acuerdo', type: 'textarea', hint: 'Quién solicita, quién aprueba (comité de control de cambios), quién firma y cómo se ajustan las pólizas.' },
          ],
        },
        {
          id: 'firmas', title: 'Firmas',
          fields: [
            { key: 'firmas', label: 'Firmas', type: 'table', addLabel: 'Agregar firma', hint: 'Firman los representantes de las partes; en un acuerdo interno, el patrocinador y los jefes de las áreas.', columns: firmasColumns() },
          ],
        },
      ],
      example: {
        tipoAcuerdo: 'Contrato',
        numeroAcuerdo: 'CS-2026-031 (ficticio)',
        objeto: 'Ingeniería, suministro, montaje por etapas, inspección y certificación, alquiler con mantenimiento en obra, desmontaje y retiro del andamio multidireccional para las fachadas norte, oriente y occidente de la Torre 2 (15 pisos) del Edificio Altavista (ficticio), Bogotá D.C., conforme al pliego técnico del contratante.',
        contratante: EX.client,
        contratista: 'Ingeniería y Alquiler S.A.S.',
        modalidadPrecio: 'Precio global fijo',
        fechaFirma: '2026-07-27',
        fechaInicio: EX.start,
        fechaTerminacion: EX.end,
        plazo: PLAZO_DIAS + ' días calendario contados desde el acta de inicio (del 3 de agosto al 18 de diciembre de 2026).',
        valorInicial: VALOR_CONTRATO,
        baseValor: 'Antes de IVA',
        anticipoPct: ANTICIPO_PCT,
        anticipoValor: ANTICIPO,
        retencionPct: 5,
        formaPago: 'Anticipo del 20 % contra la aprobación de las pólizas, amortizado en las actas de corte en la misma proporción. Actas de corte mensuales de alquiler y montaje aprobadas por la interventoría; factura electrónica radicada dentro de los 3 días hábiles siguientes a la aprobación del acta y pago a 30 días desde la radicación. De cada pago se retiene el 5 % en garantía, que se devuelve con el acta de liquidación. Los faltantes y daños de la inspección de retorno se facturan según la tarifa de la oferta.',
        polizas: [
          { id: 'r1', amparo: 'Buen manejo y correcta inversión del anticipo', valorBase: ANTICIPO, porcentaje: 100, vigencia: 'Plazo del contrato y cuatro meses más', fechaAprobacion: '2026-07-29', estado: 'Aprobada' },
          { id: 'r2', amparo: 'Cumplimiento', valorBase: VALOR_CONTRATO, porcentaje: 20, vigencia: 'Plazo del contrato y seis meses más', fechaAprobacion: '2026-07-29', estado: 'Aprobada' },
          { id: 'r3', amparo: 'Pago de salarios, prestaciones sociales e indemnizaciones laborales', valorBase: VALOR_CONTRATO, porcentaje: 5, vigencia: 'Plazo del contrato y tres años más', fechaAprobacion: '2026-07-29', estado: 'Aprobada' },
          { id: 'r4', amparo: 'Responsabilidad civil extracontractual', valorBase: VALOR_CONTRATO, porcentaje: 20, vigencia: 'Del 3 de agosto al 31 de diciembre de 2026', fechaAprobacion: '2026-07-29', estado: 'Aprobada' },
        ],
        obligaciones: [
          { id: 'r1', parte: 'Contratista o área ejecutora', obligacion: 'Diseñar, suministrar, montar por etapas, certificar, mantener, desmontar y retirar el andamio conforme al pliego técnico y a la Resolución 4272 de 2021.', clausula: 'Primera y anexo 1', responsable: 'Director de proyecto' },
          { id: 'r2', parte: 'Contratista o área ejecutora', obligacion: 'Entregar la memoria de cálculo firmada por ingeniero civil con matrícula vigente y los planos de montaje para aprobación de la interventoría antes de montar.', clausula: 'Anexo 1', responsable: 'Ingeniero de diseño' },
          { id: 'r3', parte: 'Contratista o área ejecutora', obligacion: 'Trabajar con personal certificado en alturas, afiliado y al día en seguridad social, y entregar las planillas de aportes con cada acta de corte.', clausula: 'Séptima', responsable: 'Coordinador SST (HSE)' },
          { id: 'r4', parte: 'Contratante o patrocinador', obligacion: 'Entregar por etapas el frente de fachada despejado y la zona de acopio demarcada.', clausula: 'Octava', responsable: 'Director de obra del cliente' },
          { id: 'r5', parte: 'Contratante o patrocinador', obligacion: 'Disponer la grúa y el montacargas de la obra para izar el material desde el nivel 6, según la programación del comité de obra.', clausula: 'Octava', responsable: 'Director de obra del cliente' },
          { id: 'r6', parte: 'Contratante o patrocinador', obligacion: 'Custodiar el equipo en obra fuera de la jornada y responder por los faltantes y daños según la tarifa de la oferta.', clausula: 'Novena', responsable: 'Director de obra del cliente' },
          { id: 'r7', parte: 'Contratante o patrocinador', obligacion: 'Pagar el anticipo y las actas de corte aprobadas en los plazos de la forma de pago.', clausula: 'Cuarta', responsable: 'Director de obra del cliente' },
          { id: 'r8', parte: 'Ambas partes', obligacion: 'Asistir al comité de obra semanal y firmar las actas de aceptación de cada etapa, con el visto bueno de la interventoría.', clausula: 'Sexta', responsable: 'Director de proyecto y director de obra del cliente' },
        ],
        supervision: 'Interventoría del cliente (supervisión técnica: aprueba el diseño, libera los niveles y aprueba las actas de corte); el director de obra del cliente administra el contrato.',
        responsableContratista: 'Director de proyecto; firma como representante legal la Gerencia General.',
        condicionesAceptacion: 'Cada etapa (niveles 1 a 5, 6 a 10 y 11 a 15 con accesos y protecciones) se entrega con la lista de chequeo aprobada y la tarjeta verde de la persona competente, y se acepta con acta firmada por el director de obra del cliente con el visto bueno de la interventoría. La ingeniería se acepta con la aprobación de la memoria de cálculo por la interventoría. Al terminar, el frente se entrega libre de equipo, la inspección de retorno define los faltantes y daños, y el contrato se cierra con el acta de liquidación.',
        multas: 'Multa del 0,1 % del valor del contrato por cada día hábil de retraso atribuible al contratista en un hito contractual, después de cinco días hábiles de tolerancia, con tope del 10 %. Los retrasos por lluvia o por falta de grúa o de frente despejado del contratante no causan multa. Cláusula penal pecuniaria del 20 % del valor del contrato por incumplimiento grave, amparada por la póliza de cumplimiento.',
        suspensionTerminacion: 'El contratista puede suspender el servicio si el contratante incumple los pagos por más de 60 días. La interventoría puede suspender el frente por condiciones inseguras. El contratante puede terminar el contrato por incumplimiento grave de los requisitos de seguridad y salud en el trabajo, previo requerimiento escrito.',
        otrasClausulas: 'Indemnidad del contratante frente a reclamaciones laborales del personal del contratista. Los diseños y la memoria de cálculo son del contratista y se entregan para uso exclusivo en la obra. Las controversias se resuelven por arreglo directo y, si no hay acuerdo, por conciliación en un centro de conciliación de Bogotá.',
        documentosContractuales: [
          'Contrato de servicios CS-2026-031 (ficticio) y sus modificaciones',
          'Pliego técnico del contratante (anexo 1)',
          'Oferta técnica y económica del contratista, con la tarifa de faltantes y daños (anexo 2)',
          'Programa de hitos contractuales (anexo 3)',
          'Pólizas aprobadas por el contratante',
          'Acta de inicio',
        ],
        /* La orden de cambio es posterior a la emisión inicial: el ejemplo (90) emite la rev. 0 sin esta fila (antes del
           CC-002) y la rev. 1 después de la orden. */
        modificaciones: [
          { id: 'r1', numero: 'Orden de cambio No. 1', tipo: 'Orden de cambio', fecha: '2026-09-14', objeto: 'Diseño, suministro, montaje, inspección y desmontaje de una plataforma voladiza de descargue en el piso 8, integrada al andamio, para recibir el material de fachada izado con la grúa del contratante. No cambia la fecha de terminación. El contratista amplía el valor asegurado de la póliza de cumplimiento en el 20 % del valor de la orden.', solicitudCambio: 'CC-002', efectoValor: ORDEN_CAMBIO_1, efectoPlazo: 0, estado: 'Firmada' },
        ],
        controlModificaciones: 'Las modificaciones de valor, plazo o alcance se tramitan con solicitud de cambio, se deciden en el comité de control de cambios ampliado (Gerencia General y director de obra del cliente) y se formalizan con orden de cambio u otrosí firmado por los representantes legales, con el ajuste del valor asegurado de las pólizas.',
        firmas: [
          { id: 'r1', rol: 'Contratante', nombre: 'Representante legal de Constructora Modelo S.A.S. (ficticia)', fecha: '2026-07-27' },
          { id: 'r2', rol: 'Contratista', nombre: 'Gerencia General (representante legal de Ingeniería y Alquiler S.A.S.)', fecha: '2026-07-27' },
        ],
      },
    },

    /* ================================================================== DESPUÉS · 4.7 (posterior al cierre) */
    {
      id: 'informe-beneficios',
      name: 'Informe de realización de los beneficios',
      abbr: 'IRB',
      area: 'integracion', group: 'cierre', process: '4.7', processes: ['4.7'],
      kind: 'informe', multiple: true,
      purpose: 'Compara, después del cierre del proyecto, los beneficios logrados con los prometidos en el caso de negocio y en el plan de gestión de los beneficios. Lo emite el dueño de los beneficios en cada medición, hasta que todos se logren o se descarten.',
      tips: [
        'Usa los mismos indicadores, líneas base y metas del plan de gestión de los beneficios; si alguno cambia, explica por qué en las desviaciones.',
        'Lo elabora la organización, no el equipo del proyecto: el dueño de los beneficios (una gerencia) lo emite en las fechas del plan.',
        'Registra también los beneficios no previstos y los efectos negativos; ambos sirven para el próximo caso de negocio.',
        'Cierra cada medición con una conclusión sobre el caso de negocio y la fecha de la próxima medición.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación de la medición',
          fields: [
            { key: 'proyecto', label: 'Proyecto', type: 'text', from: 'project.name', required: true, hint: 'Proyecto (o programa) cuyos beneficios se miden.' },
            { key: 'numeroInforme', label: 'Número del seguimiento', type: 'text', hint: 'Consecutivo y periodo, p. ej. «Seguimiento No. 1 — enero de 2027».' },
            { key: 'fechaMedicion', label: 'Fecha de la medición', type: 'date', required: true, hint: 'Fecha de corte de los datos del informe.' },
            { key: 'periodoDesde', label: 'Periodo medido desde', type: 'date' },
            { key: 'periodoHasta', label: 'Periodo medido hasta', type: 'date' },
            { key: 'duenoBeneficios', label: 'Dueño de los beneficios', type: 'text', hint: 'Gerencia que responde por los beneficios después del cierre, según el plan de gestión de los beneficios.' },
            { key: 'fuentes', label: 'Fuentes de la medición', type: 'textarea', hint: 'De dónde salen los datos: contabilidad, informes de operación, encuestas, informe final del proyecto.' },
          ],
        },
        {
          id: 'beneficios', title: 'Beneficios previstos frente a los logrados',
          description: 'Una fila por beneficio del plan de gestión de los beneficios y por criterio de éxito del caso de negocio. El avance mide cuánto de la distancia entre la línea base y la meta se recorrió: 100 % es la meta cumplida.',
          fields: [
            {
              key: 'beneficios', label: 'Beneficios', type: 'table', addLabel: 'Agregar beneficio',
              hint: 'Registra la línea base, la meta y el resultado en la misma unidad. Un beneficio sin resultado todavía queda «Pendiente».',
              columns: [
                { key: 'beneficio', label: 'Beneficio', type: 'textarea', width: 220 },
                { key: 'indicador', label: 'Indicador', type: 'text', width: 190 },
                { key: 'unidad', label: 'Unidad', type: 'text', width: 90 },
                { key: 'lineaBase', label: 'Línea base', type: 'number', width: 110 },
                { key: 'meta', label: 'Meta', type: 'number', width: 110 },
                { key: 'fechaMeta', label: 'Fecha meta', type: 'date' },
                { key: 'resultado', label: 'Resultado', type: 'number', width: 110 },
                { key: 'avance', label: 'Avance hacia la meta', type: 'calc', calc: calcAvanceBeneficio, format: fmtAvance, hint: '(Resultado − línea base) ÷ (meta − línea base). Sin línea base se toma 0.' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_BENEFICIO },
                { key: 'comentario', label: 'Comentario', type: 'textarea', width: 240 },
              ],
            },
            { key: 'noPrevistos', label: 'Beneficios no previstos y efectos negativos', type: 'list', hint: 'Lo que el caso de negocio no anticipó, bueno o malo.' },
            { key: 'desviaciones', label: 'Desviaciones y causas', type: 'textarea', hint: 'Por qué un beneficio no se logró, se logró en parte o se adelantó; qué parte depende de la operación y qué del proyecto.' },
          ],
        },
        {
          id: 'sostenimiento', title: 'Sostenimiento y conclusión',
          fields: [
            {
              key: 'acciones', label: 'Acciones para lograr o sostener los beneficios', type: 'table', addLabel: 'Agregar acción',
              hint: 'Qué hará la organización para lograr los beneficios pendientes o sostener los logrados.',
              columns: [
                { key: 'accion', label: 'Acción', type: 'textarea', width: 280 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 180 },
                { key: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_ACCION },
              ],
            },
            { key: 'conclusionCaso', label: '¿Se cumple el caso de negocio?', type: 'select', options: CONCLUSION_CASO },
            { key: 'conclusion', label: 'Conclusión sobre el caso de negocio', type: 'textarea', required: true, hint: 'Si la inversión valió la pena frente a lo prometido y qué falta por confirmar.' },
            { key: 'proximaMedicion', label: 'Próxima medición', type: 'date' },
            { key: 'alcanceProximaMedicion', label: 'Qué se medirá en la próxima medición', type: 'textarea' },
          ],
        },
      ],
      /* Seguimiento posterior al cierre del andamio: las cifras salen del caso de negocio, del plan de gestión de los
         beneficios, del informe final y del acta de cierre (12-templates-a.js). No se genera en el ejemplo (grupo «cierre»). */
      example: {
        proyecto: EX.name,
        numeroInforme: 'Seguimiento No. 1 — enero de 2027',
        fechaMedicion: '2027-01-29',
        periodoDesde: EX.start,
        periodoHasta: '2026-12-31',
        duenoBeneficios: 'Gerencia General; la Gerencia Comercial sigue el beneficio de cliente recurrente.',
        fuentes: 'Informe final y acta de cierre del proyecto (22 de diciembre de 2026), facturación del sistema contable, informe mensual de almacén y encuesta de satisfacción de cierre del cliente.',
        beneficios: [
          { id: 'r1', beneficio: 'Ingreso por servicio integral de andamios', indicador: 'Ingreso facturado antes de IVA', unidad: 'COP', lineaBase: 0, meta: VALOR_CONTRATO, fechaMeta: EX.end, resultado: VALOR_FINAL, estado: 'Logrado', comentario: 'Valor final del contrato: $ 598 M iniciales más la orden de cambio No. 1 por $ 12,6 M, facturado al 100 % (acta de cierre).' },
          { id: 'r2', beneficio: 'Mayor utilización del inventario de andamio multidireccional', indicador: 'm² alquilados ÷ m² disponibles', unidad: '%', lineaBase: 62, meta: 75, fechaMeta: '2026-11-30', resultado: 78, estado: 'Logrado', comentario: 'La utilización llegó a 78 % en octubre de 2026 (informe final), por encima de la meta de 75 % del plan.' },
          { id: 'r3', beneficio: 'Cliente recurrente', indicador: 'Invitaciones a ofertar nuevas torres', unidad: 'invitaciones', lineaBase: 0, meta: 1, fechaMeta: '2027-06-30', resultado: null, estado: 'Pendiente', comentario: 'Se mide al terminar el primer semestre de 2027; la Gerencia Comercial lo reporta en el informe trimestral de ventas.' },
          { id: 'r4', beneficio: 'Referencia comercial en trabajo seguro en alturas', indicador: 'Certificación de buen servicio emitida por el cliente', unidad: 'certificaciones', lineaBase: 0, meta: 1, fechaMeta: FIN_MEDIANO_PLAZO, resultado: null, estado: 'Pendiente', comentario: 'El plan pide la certificación con calificación ≥ 4,5 / 5 a mediano plazo (hasta un año después del cierre). El cliente aún no la emite; la encuesta de cierre dio 4,6 / 5 (fila de satisfacción del cliente).' },
          { id: 'r5', beneficio: 'Margen bruto del contrato (criterio de éxito del caso de negocio)', indicador: 'Margen bruto real al liquidar', unidad: '%', lineaBase: null, meta: 18, fechaMeta: FECHA_CIERRE, resultado: MARGEN_FINAL, estado: 'Logrado', comentario: 'Ingreso de $ 610,6 M y costo final de $ 464,3 M (informe final): margen de 24,0 % frente al mínimo de 18 % del caso de negocio.' },
          { id: 'r6', beneficio: 'Cero accidentes con incapacidad en trabajo en alturas (criterio de éxito del caso de negocio)', indicador: 'Accidentes con incapacidad', unidad: 'accidentes', lineaBase: 0, meta: 0, fechaMeta: EX.end, resultado: 0, estado: 'Logrado', comentario: 'Cero accidentes; un casi accidente (caída de una abrazadera sin lesionados) investigado y cerrado (informe final).' },
          { id: 'r7', beneficio: 'Satisfacción del cliente (criterio de éxito del caso de negocio)', indicador: 'Calificación del cliente en la encuesta de cierre', unidad: 'puntos sobre 5', lineaBase: null, meta: 4.5, fechaMeta: FECHA_CIERRE, resultado: 4.6, estado: 'Logrado', comentario: 'Calificación de 4,6 / 5 en la encuesta de cierre (informe final), por encima del mínimo de 4,5 del caso de negocio.' },
        ],
        noPrevistos: [
          'La orden de cambio No. 1 (plataforma de descargue del piso 8) agregó $ 12,6 M de ingreso que el caso de negocio no preveía y un servicio que la empresa ofrecerá como opción estándar en fachadas de más de 10 pisos.',
          'Efecto negativo: el desmontaje terminó el 15 de diciembre, tres días después de lo planificado, lo que retrasó la disponibilidad del equipo para otros contratos.',
        ],
        desviaciones: 'El ingreso y la utilización del inventario superaron la meta. La certificación escrita de buen servicio aún no se ha recibido, aunque la encuesta de cierre dio 4,6 / 5. El montaje completo terminó 4 días hábiles después de lo planificado y el cierre 3 días hábiles después, por la baja disponibilidad de la grúa del cliente y cinco días de lluvia; el atraso no afectó los beneficios económicos.',
        acciones: [
          { id: 'r1', accion: 'Solicitar al cliente la certificación de buen servicio con la calificación de la encuesta de cierre.', responsable: 'Gerencia Comercial', fechaObjetivo: '2027-02-26', estado: 'Pendiente' },
          { id: 'r2', accion: 'Hacer seguimiento a la invitación para ofertar la Torre 3 y preparar la oferta con las lecciones del proyecto (ventana diaria de grúa garantizada y jornada extendida para la temporada de lluvias).', responsable: 'Gerencia Comercial', fechaObjetivo: '2027-06-30', estado: 'En curso' },
          { id: 'r3', accion: 'Incluir la plataforma de descargue como opción estándar en las ofertas de fachadas de más de 10 pisos.', responsable: 'Gerencia Comercial con el ingeniero de diseño', fechaObjetivo: '2027-03-31', estado: 'Pendiente' },
          { id: 'r4', accion: 'Seguir la utilización del inventario de andamio multidireccional en el informe mensual de almacén y compararla con la meta de 75 %.', responsable: 'Almacén', fechaObjetivo: '2027-04-30', estado: 'En curso' },
        ],
        conclusionCaso: 'Se cumple parcialmente',
        conclusion: 'El caso de negocio se cumple en lo económico, en seguridad y en la satisfacción del cliente: ingreso de $ 610,6 M frente a $ 598 M previstos, margen de 24,0 % frente al mínimo de 18 %, utilización del inventario de 78 %, cero accidentes con incapacidad y encuesta de cierre de 4,6 / 5. Quedan pendientes la invitación a ofertar la Torre 3 y la certificación escrita de buen servicio, que se evaluarán en la próxima medición.',
        proximaMedicion: '2027-04-30',
        alcanceProximaMedicion: 'Estado de la invitación a la Torre 3, certificación de buen servicio y utilización del inventario en el primer trimestre de 2027.',
      },
    },
  ];

  PM.registerTemplates(templates);

  /* Orden del catálogo (SPEC §6): la lista maestra ordena por área, grupo y proceso y, dentro del mismo proceso, por
     orden de registro. Se ubican junto a sus documentos hermanos: la evaluación de necesidades antes del caso de negocio,
     el acuerdo con el cliente después del plan de gestión de los beneficios y el informe de beneficios después del acta
     de cierre. Si la plantilla de referencia no está cargada, quedan al final. */
  const place = (id, anchor, after) => {
    const list = PM.templateList;
    const from = list.findIndex((t) => t && t.id === id);
    if (from < 0 || !list.some((t) => t && t.id === anchor)) return;
    const [t] = list.splice(from, 1);
    const at = list.findIndex((x) => x && x.id === anchor);
    list.splice(after ? at + 1 : at, 0, t);
  };
  place('evaluacion-necesidades', 'caso-negocio', false);
  place('acuerdo-cliente', 'plan-gestion-beneficios', true);
  place('informe-beneficios', 'acta-cierre', true);
})();

/* ==========================================================================
   10-pmbok.js — base de conocimiento PMBOK (PM.KB).
   Fuente: Guía de los Fundamentos para la Dirección de Proyectos (Guía del
   PMBOK®), 6.ª edición: 10 áreas de conocimiento, 5 grupos de procesos y 49
   procesos con sus entradas, herramientas y técnicas y salidas (ITTO).
   Referencia cruzada a la 7.ª edición: 8 dominios de desempeño y 12 principios.

   Contratos (ver SPEC.md §4 y §6):
   - processes[i] = {code, name, area, group, frequency, description, inputs:[texto],
       tools:[texto], outputs:[Output], inputsDocs:[docId], toolViews:[viewId]}
   - Output = {doc, label?, update?}   documento canónico; update:true = el proceso
                                       actualiza un documento creado en otro proceso;
                                       label = nombre de la salida en la Guía cuando
                                       difiere del nombre de la plantilla
            | {view, label}            herramienta de la aplicación que materializa la salida
            | {baseline, label}        'scope' | 'schedule' | 'cost'
            | {text}                   salida sin documento propio en la aplicación
   - toolViews: herramientas de la aplicación que apoyan las técnicas del proceso
     (p. ej. 8.1 «diagramas de flujo» → flujogramas). No son salidas.
   No registra vistas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;

  /* ---------------------------------------------------------------- utilidades locales */
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const codeParts = (c) => String(c || '').split('.').map((x) => parseInt(x, 10) || 0);
  const compareCodes = (a, b) => { const x = codeParts(a), y = codeParts(b); return (x[0] - y[0]) || ((x[1] || 0) - (y[1] || 0)); };
  const freeze = (o) => (PM && PM.deepFreeze ? PM.deepFreeze(o) : o);

  /* Constructores de salidas */
  const doc = (id, label) => (label ? { doc: id, label } : { doc: id });
  const upd = (id, label) => (label ? { doc: id, update: true, label } : { doc: id, update: true });
  const view = (id, label) => ({ view: id, label });
  const base = (id, label) => ({ baseline: id, label });
  const txt = (text) => ({ text });
  const CR = () => doc('solicitud-cambio', 'Solicitudes de cambio');
  const WPI = () => txt('Información de desempeño del trabajo');
  const PMPU = (d) => txt('Actualizaciones al plan para la dirección del proyecto' + (d ? ' (' + d + ')' : ''));
  const PDU = (d) => txt('Actualizaciones a los documentos del proyecto' + (d ? ' (' + d + ')' : ''));
  const OPAU = () => txt('Actualizaciones a los activos de los procesos de la organización');
  const EEFU = () => txt('Actualizaciones a los factores ambientales de la empresa');

  /* Entradas y técnicas recurrentes */
  const EEF = 'Factores ambientales de la empresa';
  const OPA = 'Activos de los procesos de la organización';
  const JE = 'Juicio de expertos';
  const REU = 'Reuniones';
  const PMIS = 'Sistema de información para la dirección de proyectos (PMIS)';
  const CHARTER = 'Acta de constitución del proyecto';
  const BIZ = 'Documentos de negocio (caso de negocio, plan de gestión de los beneficios)';
  const WPD = 'Datos de desempeño del trabajo';
  const WPR = 'Informes de desempeño del trabajo';

  /* ---------------------------------------------------------------- áreas de conocimiento */
  const areas = [
    { id: 'integracion', num: 4, icon: 'layers', name: 'Gestión de la Integración del Proyecto', short: 'Integración',
      description: 'Incluye los procesos y actividades para identificar, definir, combinar, unificar y coordinar los diversos procesos y actividades de dirección de proyectos dentro de los grupos de procesos. Es responsabilidad indelegable del director del proyecto: integra las decisiones de todas las áreas en un solo plan y controla los cambios de manera integrada.',
      keyQuestion: '¿Cómo se coordinan todas las áreas en un solo plan y se controlan los cambios?' },
    { id: 'alcance', num: 5, icon: 'wbs', name: 'Gestión del Alcance del Proyecto', short: 'Alcance',
      description: 'Incluye los procesos requeridos para garantizar que el proyecto incluya todo el trabajo requerido, y únicamente el trabajo requerido, para completarlo con éxito. Se ocupa de definir y controlar qué se incluye y qué no se incluye en el proyecto.',
      keyQuestion: '¿Qué trabajo se incluye en el proyecto y qué queda por fuera?' },
    { id: 'cronograma', num: 6, icon: 'gantt', name: 'Gestión del Cronograma del Proyecto', short: 'Cronograma',
      description: 'Incluye los procesos requeridos para administrar la finalización del proyecto a tiempo. Abarca desde la definición y secuenciación de actividades hasta el desarrollo y control del modelo de programación.',
      keyQuestion: '¿Cuándo se ejecuta cada actividad y cuándo termina el proyecto?' },
    { id: 'costos', num: 7, icon: 'money', name: 'Gestión de los Costos del Proyecto', short: 'Costos',
      description: 'Incluye los procesos involucrados en planificar, estimar, presupuestar, financiar, obtener financiamiento, gestionar y controlar los costos de modo que se complete el proyecto dentro del presupuesto aprobado. El desempeño de costos se mide frente a la línea base de costos con la técnica del valor ganado.',
      keyQuestion: '¿Cuánto cuesta el proyecto y cómo va el gasto frente al presupuesto?' },
    { id: 'calidad', num: 8, icon: 'quality', name: 'Gestión de la Calidad del Proyecto', short: 'Calidad',
      description: 'Incluye los procesos para incorporar la política de calidad de la organización en cuanto a la planificación, gestión y control de los requisitos de calidad del proyecto y del producto, a fin de satisfacer los objetivos de los interesados. También apoya la mejora continua de los procesos de la organización.',
      keyQuestion: '¿Qué requisitos de calidad se deben cumplir y cómo se verifica su cumplimiento?' },
    { id: 'recursos', num: 9, icon: 'resources', name: 'Gestión de los Recursos del Proyecto', short: 'Recursos',
      description: 'Incluye los procesos para identificar, adquirir y gestionar los recursos necesarios para la conclusión exitosa del proyecto. Ayuda a garantizar que los recursos físicos y el equipo del proyecto estén disponibles en el momento y el lugar adecuados.',
      keyQuestion: '¿Qué personas, equipos y materiales se necesitan, cuándo y cómo se gestionan?' },
    { id: 'comunicaciones', num: 10, icon: 'send', name: 'Gestión de las Comunicaciones del Proyecto', short: 'Comunicaciones',
      description: 'Incluye los procesos requeridos para garantizar que la planificación, recopilación, creación, distribución, almacenamiento, recuperación, gestión, control, monitoreo y disposición final de la información del proyecto sean oportunos y adecuados. Busca un intercambio de información eficaz entre el proyecto y sus interesados.',
      keyQuestion: '¿Quién necesita qué información, cuándo, por qué medio y en qué formato?' },
    { id: 'riesgos', num: 11, icon: 'risk', name: 'Gestión de los Riesgos del Proyecto', short: 'Riesgos',
      description: 'Incluye los procesos para llevar a cabo la planificación de la gestión, identificación, análisis, planificación de respuesta, implementación de respuesta y monitoreo de los riesgos del proyecto. Busca aumentar la probabilidad o el impacto de los riesgos positivos y disminuir la probabilidad o el impacto de los riesgos negativos.',
      keyQuestion: '¿Qué eventos inciertos pueden afectar los objetivos y cómo se responde a ellos?' },
    { id: 'adquisiciones', num: 12, icon: 'portfolio', name: 'Gestión de las Adquisiciones del Proyecto', short: 'Adquisiciones',
      description: 'Incluye los procesos necesarios para comprar o adquirir productos, servicios o resultados que es preciso obtener fuera del equipo del proyecto. Abarca la gestión y el control de contratos, órdenes de compra y otros acuerdos con proveedores.',
      keyQuestion: '¿Qué se compra o subcontrata, con quién y bajo qué tipo de contrato?' },
    { id: 'interesados', num: 13, icon: 'stakeholders', name: 'Gestión de los Interesados del Proyecto', short: 'Interesados',
      description: 'Incluye los procesos requeridos para identificar a las personas, grupos u organizaciones que pueden afectar o ser afectados por el proyecto, analizar sus expectativas y su impacto, y desarrollar estrategias de gestión adecuadas. Busca lograr la participación eficaz de los interesados en las decisiones y en la ejecución del proyecto.',
      keyQuestion: '¿Quién se ve afectado por el proyecto y cómo se logra su participación?' },
  ];

  /* ---------------------------------------------------------------- grupos de procesos */
  const groups = [
    { id: 'inicio', num: 1, name: 'Inicio', color: 'var(--g-inicio)',
      description: 'Procesos realizados para definir un nuevo proyecto o una nueva fase de un proyecto existente al obtener la autorización para iniciarlo.' },
    { id: 'planificacion', num: 2, name: 'Planificación', color: 'var(--g-planificacion)',
      description: 'Procesos requeridos para establecer el alcance del proyecto, refinar los objetivos y definir la línea de acción necesaria para alcanzarlos.' },
    { id: 'ejecucion', num: 3, name: 'Ejecución', color: 'var(--g-ejecucion)',
      description: 'Procesos realizados para completar el trabajo definido en el plan para la dirección del proyecto a fin de satisfacer sus requisitos.' },
    { id: 'monitoreo', num: 4, name: 'Monitoreo y Control', color: 'var(--g-monitoreo)',
      description: 'Procesos requeridos para hacer seguimiento, analizar y regular el progreso y el desempeño del proyecto, identificar las áreas que requieren cambios en el plan e iniciar los cambios correspondientes.' },
    { id: 'cierre', num: 5, name: 'Cierre', color: 'var(--g-cierre)',
      description: 'Procesos llevados a cabo para completar o cerrar formalmente el proyecto, una fase o un contrato.' },
  ];

  /* Frecuencia con que se ejecuta cada proceso según la Guía */
  const FREQUENCY = {
    unica: 'Una única vez o en puntos predefinidos del proyecto',
    periodica: 'Periódicamente a lo largo del proyecto, según sea necesario',
    continua: 'A lo largo de todo el proyecto',
  };

  /* ---------------------------------------------------------------- procesos (49) */
  const P = (code, name, area, group, frequency, description, def) => ({ code, name, area, group, frequency, description, inputs: def.inputs, tools: def.tools, outputs: def.outputs, inputsDocs: def.inputsDocs || [], toolViews: def.toolViews || [] });

  const processes = [
    /* ===================== 4. Integración ===================== */
    P('4.1', 'Desarrollar el Acta de Constitución del Proyecto', 'integracion', 'inicio', 'unica',
      'Desarrolla el documento que autoriza formalmente la existencia del proyecto y confiere al director del proyecto la autoridad para aplicar recursos de la organización a sus actividades. Beneficio clave: vincula el proyecto con los objetivos estratégicos de la organización, crea un registro formal del proyecto y muestra el compromiso de la organización con él.', {
        inputs: [BIZ, 'Acuerdos', EEF, OPA],
        tools: [JE, 'Recopilación de datos (tormenta de ideas, grupos focales, entrevistas)', 'Habilidades interpersonales y de equipo (gestión de conflictos, facilitación, gestión de reuniones)', REU],
        outputs: [doc('acta-constitucion'), doc('registro-supuestos')],
        inputsDocs: ['caso-negocio', 'plan-gestion-beneficios'],
      }),
    P('4.2', 'Desarrollar el Plan para la Dirección del Proyecto', 'integracion', 'planificacion', 'unica',
      'Define, prepara y coordina todos los componentes del plan (planes de gestión, líneas base y planes adicionales) y los consolida en un plan integral para la dirección del proyecto. Beneficio clave: produce un documento integral que define la base de todo el trabajo del proyecto y el modo en que se realizará.', {
        inputs: [CHARTER, 'Salidas de otros procesos (planes de gestión subsidiarios y líneas base)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (tormenta de ideas, listas de verificación, grupos focales, entrevistas)', 'Habilidades interpersonales y de equipo (gestión de conflictos, facilitación, gestión de reuniones)', REU],
        outputs: [doc('plan-direccion'), doc('plan-gestion-cambios'), doc('plan-gestion-configuracion'), view('lineas-base', 'Líneas base del alcance, del cronograma y de costos (componentes del plan)')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-alcance', 'plan-gestion-requisitos', 'plan-gestion-cronograma', 'plan-gestion-costos', 'plan-gestion-calidad', 'plan-gestion-recursos', 'plan-gestion-comunicaciones', 'plan-gestion-riesgos', 'plan-gestion-adquisiciones', 'plan-involucramiento-interesados'],
        toolViews: ['flujogramas'],
      }),
    P('4.3', 'Dirigir y Gestionar el Trabajo del Proyecto', 'integracion', 'ejecucion', 'continua',
      'Lidera y lleva a cabo el trabajo definido en el plan para la dirección del proyecto e implementa los cambios aprobados para alcanzar los objetivos del proyecto. Beneficio clave: proporciona la gestión general del trabajo y de los entregables, lo que mejora la probabilidad de éxito del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (cualquier componente)', 'Documentos del proyecto (registro de cambios, registro de lecciones aprendidas, lista de hitos, comunicaciones del proyecto, cronograma del proyecto, matriz de trazabilidad de requisitos, registro de riesgos, informe de riesgos)', 'Solicitudes de cambio aprobadas', EEF, OPA],
        tools: [JE, PMIS, REU],
        outputs: [doc('entregables', 'Entregables'), txt(WPD), doc('registro-incidentes'), CR(), PMPU('cualquier componente'),
          PDU('lista de actividades, registro de supuestos, registro de lecciones aprendidas, documentación de requisitos, registro de riesgos, registro de interesados'),
          upd('registro-supuestos'), upd('registro-lecciones'), upd('documentacion-requisitos'), upd('registro-riesgos'), upd('registro-interesados'), OPAU()],
        inputsDocs: ['plan-direccion', 'registro-cambios', 'registro-lecciones', 'registro-comunicaciones', 'matriz-trazabilidad', 'registro-riesgos', 'informe-riesgos', 'solicitud-cambio'],
        toolViews: ['cronograma', 'edt'],
      }),
    P('4.4', 'Gestionar el Conocimiento del Proyecto', 'integracion', 'ejecucion', 'continua',
      'Utiliza el conocimiento existente y crea nuevo conocimiento para alcanzar los objetivos del proyecto y contribuir al aprendizaje organizacional. Beneficio clave: aprovecha el conocimiento previo de la organización para mejorar los resultados del proyecto y deja disponible el conocimiento creado para las operaciones y los proyectos futuros.', {
        inputs: ['Plan para la dirección del proyecto (todos los componentes)', 'Documentos del proyecto (registro de lecciones aprendidas, asignaciones del equipo del proyecto, estructura de desglose de recursos, criterios de selección de proveedores, registro de interesados)', 'Entregables', EEF, OPA],
        tools: [JE, 'Gestión del conocimiento', 'Gestión de la información', 'Habilidades interpersonales y de equipo (escucha activa, facilitación, liderazgo, trabajo en red, conciencia política)'],
        outputs: [doc('registro-lecciones', 'Registro de lecciones aprendidas'), PMPU('cualquier componente'), OPAU()],
        inputsDocs: ['plan-direccion', 'registro-lecciones', 'asignaciones-recursos', 'estructura-desglose-recursos', 'criterios-seleccion-proveedores', 'registro-interesados', 'entregables'],
      }),
    P('4.5', 'Monitorear y Controlar el Trabajo del Proyecto', 'integracion', 'monitoreo', 'continua',
      'Hace seguimiento, revisa e informa el avance general del proyecto para cumplir con los objetivos de desempeño definidos en el plan para la dirección del proyecto. Beneficio clave: permite a los interesados comprender el estado actual del proyecto, las medidas adoptadas y las proyecciones del presupuesto, el cronograma y el alcance.', {
        inputs: ['Plan para la dirección del proyecto (cualquier componente)', 'Documentos del proyecto (registro de supuestos, base de las estimaciones, pronósticos de costos, registro de incidentes, registro de lecciones aprendidas, lista de hitos, informes de calidad, registro de riesgos, informe de riesgos, pronósticos del cronograma)', 'Información de desempeño del trabajo', 'Acuerdos', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de alternativas, análisis costo-beneficio, análisis del valor ganado, análisis de causa raíz, análisis de tendencias, análisis de variación)', 'Toma de decisiones (votación)', REU],
        outputs: [doc('informe-desempeno', 'Informes de desempeño del trabajo'), CR(), PMPU('cualquier componente'),
          PDU('pronósticos de costos, registro de incidentes, registro de lecciones aprendidas, registro de riesgos, pronósticos del cronograma'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos')],
        inputsDocs: ['plan-direccion', 'registro-supuestos', 'estimacion-costos', 'registro-incidentes', 'registro-lecciones', 'informe-calidad', 'registro-riesgos', 'informe-riesgos'],
        toolViews: ['tablero', 'valor-ganado'],
      }),
    P('4.6', 'Realizar el Control Integrado de Cambios', 'integracion', 'monitoreo', 'continua',
      'Revisa todas las solicitudes de cambio; aprueba y gestiona los cambios a entregables, documentos del proyecto, activos de la organización y plan para la dirección del proyecto, y comunica las decisiones. Beneficio clave: permite considerar los cambios documentados de manera integrada y reduce el riesgo de los cambios hechos sin tener en cuenta los objetivos o planes generales del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de cambios, plan de gestión de la configuración, línea base del alcance, línea base del cronograma, línea base de costos)', 'Documentos del proyecto (base de las estimaciones, matriz de trazabilidad de requisitos, informe de riesgos)', WPR, 'Solicitudes de cambio', EEF, OPA],
        tools: [JE, 'Herramientas de control de cambios', 'Análisis de datos (análisis de alternativas, análisis costo-beneficio)', 'Toma de decisiones (votación, toma de decisiones autocrática, análisis de decisiones con múltiples criterios)', REU],
        outputs: [doc('solicitud-cambio', 'Solicitudes de cambio aprobadas'), PMPU('cualquier componente'), view('lineas-base', 'Líneas base actualizadas por los cambios aprobados'), PDU('registro de cambios'), doc('registro-cambios')],
        inputsDocs: ['plan-gestion-cambios', 'plan-gestion-configuracion', 'estimacion-costos', 'matriz-trazabilidad', 'informe-riesgos', 'informe-desempeno', 'solicitud-cambio'],
        toolViews: ['lineas-base'],
      }),
    P('4.7', 'Cerrar el Proyecto o Fase', 'integracion', 'cierre', 'unica',
      'Finaliza todas las actividades del proyecto, de una fase o de un contrato. Beneficio clave: archiva la información del proyecto o fase, documenta el trabajo completado y libera los recursos de la organización para nuevos esfuerzos.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (todos los componentes)', 'Documentos del proyecto (registro de supuestos, base de las estimaciones, registro de cambios, registro de incidentes, registro de lecciones aprendidas, lista de hitos, comunicaciones del proyecto, mediciones de control de calidad, informes de calidad, documentación de requisitos, registro de riesgos, informe de riesgos)', 'Entregables aceptados', BIZ, 'Acuerdos', 'Documentación de las adquisiciones', OPA],
        tools: [JE, 'Análisis de datos (análisis de documentos, análisis de regresión, análisis de tendencias, análisis de variación)', REU],
        outputs: [doc('acta-cierre', 'Transferencia del producto, servicio o resultado final'), doc('informe-final', 'Informe final'), PDU('registro de lecciones aprendidas'), upd('registro-lecciones'), OPAU()],
        inputsDocs: ['acta-constitucion', 'plan-direccion', 'registro-supuestos', 'registro-cambios', 'registro-incidentes', 'registro-lecciones', 'registro-comunicaciones', 'mediciones-control-calidad', 'informe-calidad', 'documentacion-requisitos', 'registro-riesgos', 'informe-riesgos', 'acta-aceptacion-entregable', 'caso-negocio', 'plan-gestion-beneficios', 'registro-adquisiciones'],
      }),

    /* ===================== 5. Alcance ===================== */
    P('5.1', 'Planificar la Gestión del Alcance', 'alcance', 'planificacion', 'unica',
      'Crea un plan de gestión del alcance que documenta cómo serán definidos, validados y controlados el alcance del proyecto y del producto. Beneficio clave: proporciona guía y dirección sobre cómo se gestionará el alcance a lo largo del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión de la calidad, descripción del ciclo de vida del proyecto, enfoque de desarrollo)', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de alternativas)', REU],
        outputs: [doc('plan-gestion-alcance'), doc('plan-gestion-requisitos')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-calidad'],
      }),
    P('5.2', 'Recopilar Requisitos', 'alcance', 'planificacion', 'unica',
      'Determina, documenta y gestiona las necesidades y los requisitos de los interesados para cumplir con los objetivos del proyecto. Beneficio clave: proporciona la base para definir el alcance del producto y el alcance del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión del alcance, plan de gestión de los requisitos, plan de involucramiento de los interesados)', 'Documentos del proyecto (registro de supuestos, registro de lecciones aprendidas, registro de interesados)', 'Documentos de negocio (caso de negocio)', 'Acuerdos', EEF, OPA],
        tools: [JE, 'Recopilación de datos (tormenta de ideas, entrevistas, grupos focales, cuestionarios y encuestas, estudios comparativos)', 'Análisis de datos (análisis de documentos)', 'Toma de decisiones (votación, análisis de decisiones con múltiples criterios)', 'Representación de datos (diagramas de afinidad, mapeo mental)', 'Habilidades interpersonales y de equipo (técnica de grupo nominal, observación/conversación, facilitación)', 'Diagrama de contexto', 'Prototipos'],
        outputs: [doc('documentacion-requisitos'), doc('matriz-trazabilidad')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-alcance', 'plan-gestion-requisitos', 'plan-involucramiento-interesados', 'registro-supuestos', 'registro-lecciones', 'registro-interesados', 'caso-negocio'],
      }),
    P('5.3', 'Definir el Alcance', 'alcance', 'planificacion', 'unica',
      'Desarrolla una descripción detallada del proyecto y del producto. Beneficio clave: describe los límites del producto, servicio o resultado y los criterios para su aceptación.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión del alcance)', 'Documentos del proyecto (registro de supuestos, documentación de requisitos, registro de riesgos)', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de alternativas)', 'Toma de decisiones (análisis de decisiones con múltiples criterios)', 'Habilidades interpersonales y de equipo (facilitación)', 'Análisis del producto'],
        outputs: [doc('enunciado-alcance'), PDU('registro de supuestos, documentación de requisitos, matriz de trazabilidad de requisitos, registro de interesados'),
          upd('registro-supuestos'), upd('documentacion-requisitos'), upd('matriz-trazabilidad'), upd('registro-interesados')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-alcance', 'registro-supuestos', 'documentacion-requisitos', 'registro-riesgos'],
      }),
    P('5.4', 'Crear la EDT/WBS', 'alcance', 'planificacion', 'unica',
      'Subdivide los entregables y el trabajo del proyecto en componentes más pequeños y más fáciles de manejar. Beneficio clave: proporciona un marco de referencia de lo que se debe entregar.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del alcance)', 'Documentos del proyecto (enunciado del alcance del proyecto, documentación de requisitos)', EEF, OPA],
        tools: [JE, 'Descomposición'],
        outputs: [base('scope', 'Línea base del alcance'), view('edt', 'EDT/WBS y diccionario de la EDT/WBS'), PDU('registro de supuestos, documentación de requisitos'), upd('registro-supuestos'), upd('documentacion-requisitos')],
        inputsDocs: ['plan-gestion-alcance', 'enunciado-alcance', 'documentacion-requisitos'],
        toolViews: ['edt'],
      }),
    P('5.5', 'Validar el Alcance', 'alcance', 'monitoreo', 'periodica',
      'Formaliza la aceptación de los entregables del proyecto que se hayan completado. Beneficio clave: aporta objetividad al proceso de aceptación y aumenta la probabilidad de aceptación final del producto, servicio o resultado al validar cada entregable.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del alcance, plan de gestión de los requisitos, línea base del alcance)', 'Documentos del proyecto (registro de lecciones aprendidas, informes de calidad, documentación de requisitos, matriz de trazabilidad de requisitos)', 'Entregables verificados', WPD],
        tools: ['Inspección', 'Toma de decisiones (votación)'],
        outputs: [doc('acta-aceptacion-entregable', 'Entregables aceptados'), upd('entregables', 'Registro de entregables (estado de aceptación)'), WPI(), CR(),
          PDU('registro de lecciones aprendidas, documentación de requisitos, matriz de trazabilidad de requisitos'), upd('registro-lecciones'), upd('documentacion-requisitos'), upd('matriz-trazabilidad')],
        inputsDocs: ['plan-gestion-alcance', 'plan-gestion-requisitos', 'registro-lecciones', 'informe-calidad', 'documentacion-requisitos', 'matriz-trazabilidad', 'entregables'],
        toolViews: ['edt'],
      }),
    P('5.6', 'Controlar el Alcance', 'alcance', 'monitoreo', 'continua',
      'Monitorea el estado del alcance del proyecto y del producto, y gestiona cambios a la línea base del alcance. Beneficio clave: mantiene la línea base del alcance a lo largo del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del alcance, plan de gestión de los requisitos, plan de gestión de cambios, plan de gestión de la configuración, línea base del alcance, línea base para la medición del desempeño)', 'Documentos del proyecto (registro de lecciones aprendidas, documentación de requisitos, matriz de trazabilidad de requisitos)', WPD, OPA],
        tools: ['Análisis de datos (análisis de variación, análisis de tendencias)'],
        outputs: [WPI(), CR(), PMPU('plan de gestión del alcance, línea base del alcance, línea base del cronograma, línea base de costos, línea base para la medición del desempeño'),
          PDU('registro de lecciones aprendidas, documentación de requisitos, matriz de trazabilidad de requisitos'), upd('registro-lecciones'), upd('documentacion-requisitos'), upd('matriz-trazabilidad')],
        inputsDocs: ['plan-gestion-alcance', 'plan-gestion-requisitos', 'plan-gestion-cambios', 'plan-gestion-configuracion', 'registro-lecciones', 'documentacion-requisitos', 'matriz-trazabilidad'],
        toolViews: ['edt', 'lineas-base'],
      }),

    /* ===================== 6. Cronograma ===================== */
    P('6.1', 'Planificar la Gestión del Cronograma', 'cronograma', 'planificacion', 'unica',
      'Establece las políticas, los procedimientos y la documentación para planificar, desarrollar, gestionar, ejecutar y controlar el cronograma del proyecto. Beneficio clave: proporciona guía y dirección sobre cómo se gestionará el cronograma a lo largo del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión del alcance, enfoque de desarrollo)', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de alternativas)', REU],
        outputs: [doc('plan-gestion-cronograma')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-alcance'],
      }),
    P('6.2', 'Definir las Actividades', 'cronograma', 'planificacion', 'continua',
      'Identifica y documenta las acciones específicas que se deben realizar para elaborar los entregables del proyecto. Beneficio clave: descompone los paquetes de trabajo en actividades del cronograma que sirven de base para estimar, programar, ejecutar, monitorear y controlar el trabajo.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del cronograma, línea base del alcance)', EEF, OPA],
        tools: [JE, 'Descomposición', 'Planificación gradual', REU],
        outputs: [view('cronograma', 'Lista de actividades'), view('cronograma', 'Atributos de las actividades'), view('cronograma', 'Lista de hitos'), CR(), PMPU('línea base del cronograma, línea base de costos')],
        inputsDocs: ['plan-gestion-cronograma'],
        toolViews: ['edt', 'cronograma'],
      }),
    P('6.3', 'Secuenciar las Actividades', 'cronograma', 'planificacion', 'continua',
      'Identifica y documenta las relaciones entre las actividades del proyecto. Beneficio clave: define la secuencia lógica de trabajo que permite obtener la máxima eficiencia teniendo en cuenta todas las restricciones del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del cronograma, línea base del alcance)', 'Documentos del proyecto (atributos de las actividades, lista de actividades, registro de supuestos, lista de hitos)', EEF, OPA],
        tools: ['Método de diagramación por precedencia (PDM)', 'Determinación e integración de las dependencias', 'Adelantos y retrasos', PMIS],
        outputs: [view('red', 'Diagramas de red del cronograma del proyecto'), PDU('atributos de las actividades, lista de actividades, registro de supuestos, lista de hitos'), upd('registro-supuestos')],
        inputsDocs: ['plan-gestion-cronograma', 'registro-supuestos'],
        toolViews: ['red', 'cronograma'],
      }),
    P('6.4', 'Estimar la Duración de las Actividades', 'cronograma', 'planificacion', 'continua',
      'Estima la cantidad de períodos de trabajo necesarios para finalizar las actividades individuales con los recursos estimados. Beneficio clave: proporciona la cantidad de tiempo que tomará finalizar cada actividad.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del cronograma, línea base del alcance)', 'Documentos del proyecto (atributos de las actividades, lista de actividades, registro de supuestos, registro de lecciones aprendidas, lista de hitos, asignaciones del equipo del proyecto, estructura de desglose de recursos, calendarios de recursos, requisitos de recursos, registro de riesgos)', EEF, OPA],
        tools: [JE, 'Estimación análoga', 'Estimación paramétrica', 'Estimación por tres valores', 'Estimación ascendente', 'Análisis de datos (análisis de alternativas, análisis de reservas)', 'Toma de decisiones', REU],
        outputs: [doc('estimaciones-duracion', 'Estimaciones de la duración y base de las estimaciones'), PDU('atributos de las actividades, registro de supuestos, registro de lecciones aprendidas'), upd('registro-supuestos'), upd('registro-lecciones')],
        inputsDocs: ['plan-gestion-cronograma', 'registro-supuestos', 'registro-lecciones', 'asignaciones-recursos', 'estructura-desglose-recursos', 'requisitos-recursos', 'registro-riesgos'],
        toolViews: ['cronograma'],
      }),
    P('6.5', 'Desarrollar el Cronograma', 'cronograma', 'planificacion', 'continua',
      'Analiza secuencias de actividades, duraciones, requisitos de recursos y restricciones del cronograma para crear el modelo de programación del proyecto. Beneficio clave: genera un modelo de programación con fechas planificadas para completar las actividades, base para la ejecución, el monitoreo y el control.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del cronograma, línea base del alcance)', 'Documentos del proyecto (atributos de las actividades, lista de actividades, registro de supuestos, base de las estimaciones, estimaciones de la duración, registro de lecciones aprendidas, lista de hitos, diagramas de red del cronograma del proyecto, asignaciones del equipo del proyecto, calendarios de recursos, requisitos de recursos, registro de riesgos)', 'Acuerdos', EEF, OPA],
        tools: ['Análisis de la red del cronograma', 'Método de la ruta crítica', 'Optimización de recursos (nivelación de recursos, equilibrio de recursos)', 'Análisis de datos (análisis de escenarios «¿qué pasa si…?», simulación)', 'Adelantos y retrasos', 'Compresión del cronograma (intensificación, ejecución rápida)', PMIS, 'Planificación ágil de liberaciones'],
        outputs: [base('schedule', 'Línea base del cronograma'), view('cronograma', 'Cronograma del proyecto (diagrama de Gantt)'), view('cronograma', 'Datos del cronograma'), view('cronograma', 'Calendarios del proyecto'), CR(),
          PMPU('plan de gestión del cronograma, línea base de costos'),
          PDU('atributos de las actividades, registro de supuestos, estimaciones de la duración, registro de lecciones aprendidas, requisitos de recursos, registro de riesgos'),
          upd('registro-supuestos'), upd('estimaciones-duracion'), upd('registro-lecciones'), upd('requisitos-recursos'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-cronograma', 'registro-supuestos', 'estimaciones-duracion', 'registro-lecciones', 'asignaciones-recursos', 'requisitos-recursos', 'registro-riesgos'],
        toolViews: ['cronograma', 'red', 'recursos'],
      }),
    P('6.6', 'Controlar el Cronograma', 'cronograma', 'monitoreo', 'continua',
      'Monitorea el estado del proyecto para actualizar el cronograma y gestionar cambios a la línea base del cronograma. Beneficio clave: mantiene la línea base del cronograma a lo largo del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del cronograma, línea base del cronograma, línea base del alcance, línea base para la medición del desempeño)', 'Documentos del proyecto (registro de lecciones aprendidas, calendarios del proyecto, cronograma del proyecto, calendarios de recursos, datos del cronograma)', WPD, OPA],
        tools: ['Análisis de datos (análisis del valor ganado, diagrama de trabajo pendiente de la iteración, revisiones del desempeño, análisis de tendencias, análisis de variación, análisis de escenarios «¿qué pasa si…?»)', 'Método de la ruta crítica', PMIS, 'Optimización de recursos', 'Adelantos y retrasos', 'Compresión del cronograma'],
        outputs: [WPI(), view('valor-ganado', 'Pronósticos del cronograma'), view('cronograma', 'Cronograma del proyecto actualizado frente a la línea base'), CR(),
          PMPU('plan de gestión del cronograma, línea base del cronograma, línea base de costos, línea base para la medición del desempeño'),
          PDU('registro de supuestos, base de las estimaciones, registro de lecciones aprendidas, cronograma del proyecto, calendarios de recursos, registro de riesgos, datos del cronograma'),
          upd('registro-supuestos'), upd('registro-lecciones'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-cronograma', 'registro-lecciones'],
        toolViews: ['cronograma', 'valor-ganado', 'lineas-base'],
      }),

    /* ===================== 7. Costos ===================== */
    P('7.1', 'Planificar la Gestión de los Costos', 'costos', 'planificacion', 'unica',
      'Define cómo se han de estimar, presupuestar, gestionar, monitorear y controlar los costos del proyecto. Beneficio clave: proporciona guía y dirección sobre cómo se gestionarán los costos a lo largo del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión del cronograma, plan de gestión de los riesgos)', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de alternativas)', REU],
        outputs: [doc('plan-gestion-costos')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-cronograma', 'plan-gestion-riesgos'],
      }),
    P('7.2', 'Estimar los Costos', 'costos', 'planificacion', 'periodica',
      'Desarrolla una aproximación de los recursos monetarios necesarios para completar el trabajo del proyecto. Beneficio clave: determina los recursos monetarios requeridos para el proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los costos, plan de gestión de la calidad, línea base del alcance)', 'Documentos del proyecto (registro de lecciones aprendidas, cronograma del proyecto, requisitos de recursos, registro de riesgos)', EEF, OPA],
        tools: [JE, 'Estimación análoga', 'Estimación paramétrica', 'Estimación ascendente', 'Estimación por tres valores', 'Análisis de datos (análisis de alternativas, análisis de reservas, costo de la calidad)', PMIS, 'Toma de decisiones (votación)'],
        outputs: [doc('estimacion-costos', 'Estimaciones de costos y base de las estimaciones'), PDU('registro de supuestos, registro de lecciones aprendidas, registro de riesgos'), upd('registro-supuestos'), upd('registro-lecciones'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-costos', 'plan-gestion-calidad', 'registro-lecciones', 'requisitos-recursos', 'registro-riesgos'],
        toolViews: ['edt'],
      }),
    P('7.3', 'Determinar el Presupuesto', 'costos', 'planificacion', 'unica',
      'Suma los costos estimados de las actividades individuales o de los paquetes de trabajo para establecer una línea base de costos autorizada. Beneficio clave: determina la línea base de costos con respecto a la cual se puede monitorear y controlar el desempeño del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los costos, plan de gestión de los recursos, línea base del alcance)', 'Documentos del proyecto (base de las estimaciones, estimaciones de costos, cronograma del proyecto, registro de riesgos)', BIZ, 'Acuerdos', EEF, OPA],
        tools: [JE, 'Agregación de costos', 'Análisis de datos (análisis de reservas)', 'Revisión de información histórica', 'Conciliación del límite de financiamiento', 'Financiamiento'],
        outputs: [base('cost', 'Línea base de costos'), view('valor-ganado', 'Curva S de la línea base de costos'), doc('requisitos-financiamiento'),
          PDU('estimaciones de costos, cronograma del proyecto, registro de riesgos'), upd('estimacion-costos'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-costos', 'plan-gestion-recursos', 'estimacion-costos', 'registro-riesgos', 'caso-negocio', 'plan-gestion-beneficios'],
        toolViews: ['valor-ganado', 'lineas-base'],
      }),
    P('7.4', 'Controlar los Costos', 'costos', 'monitoreo', 'continua',
      'Monitorea el estado del proyecto para actualizar los costos y gestionar cambios a la línea base de costos. Beneficio clave: mantiene la línea base de costos a lo largo del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los costos, línea base de costos, línea base para la medición del desempeño)', 'Documentos del proyecto (registro de lecciones aprendidas)', 'Requisitos de financiamiento del proyecto', WPD, OPA],
        tools: [JE, 'Análisis de datos (análisis del valor ganado, análisis de variación, análisis de tendencias, análisis de reservas)', 'Índice de desempeño del trabajo por completar (TCPI)', PMIS],
        outputs: [doc('informe-desempeno', 'Información de desempeño del trabajo (valor ganado)'), view('valor-ganado', 'Pronósticos de costos (EAC, ETC, VAC)'), CR(),
          PMPU('plan de gestión de los costos, línea base de costos, línea base para la medición del desempeño'),
          PDU('registro de supuestos, base de las estimaciones, estimaciones de costos, registro de lecciones aprendidas, registro de riesgos'),
          upd('registro-supuestos'), upd('estimacion-costos'), upd('registro-lecciones'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-costos', 'registro-lecciones', 'requisitos-financiamiento'],
        toolViews: ['valor-ganado'],
      }),

    /* ===================== 8. Calidad ===================== */
    P('8.1', 'Planificar la Gestión de la Calidad', 'calidad', 'planificacion', 'unica',
      'Identifica los requisitos o estándares de calidad del proyecto y sus entregables, y documenta cómo el proyecto demostrará su cumplimiento. Beneficio clave: proporciona guía y dirección sobre cómo se gestionará y verificará la calidad a lo largo del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión de los requisitos, plan de gestión de los riesgos, plan de involucramiento de los interesados, línea base del alcance)', 'Documentos del proyecto (registro de supuestos, documentación de requisitos, matriz de trazabilidad de requisitos, registro de riesgos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (estudios comparativos, tormenta de ideas, entrevistas)', 'Análisis de datos (análisis costo-beneficio, costo de la calidad)', 'Toma de decisiones (análisis de decisiones con múltiples criterios)', 'Representación de datos (diagramas de flujo, modelo lógico de datos, diagramas matriciales, mapeo mental)', 'Planificación de pruebas e inspección', REU],
        outputs: [doc('plan-gestion-calidad'), doc('metricas-calidad'), PMPU('plan de gestión de los riesgos, línea base del alcance'),
          PDU('registro de lecciones aprendidas, matriz de trazabilidad de requisitos, registro de riesgos, registro de interesados'),
          upd('registro-lecciones'), upd('matriz-trazabilidad'), upd('registro-riesgos'), upd('registro-interesados')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-requisitos', 'plan-gestion-riesgos', 'plan-involucramiento-interesados', 'registro-supuestos', 'documentacion-requisitos', 'matriz-trazabilidad', 'registro-riesgos', 'registro-interesados'],
        toolViews: ['flujogramas'],
      }),
    P('8.2', 'Gestionar la Calidad', 'calidad', 'ejecucion', 'continua',
      'Convierte el plan de gestión de la calidad en actividades de calidad ejecutables que incorporan al proyecto las políticas de calidad de la organización. Beneficio clave: incrementa la probabilidad de cumplir con los objetivos de calidad e identifica los procesos ineficaces y las causas de la calidad deficiente.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de la calidad)', 'Documentos del proyecto (registro de lecciones aprendidas, mediciones de control de calidad, métricas de calidad, informe de riesgos)', OPA],
        tools: ['Recopilación de datos (listas de verificación)', 'Análisis de datos (análisis de alternativas, análisis de documentos, análisis de procesos, análisis de causa raíz)', 'Toma de decisiones (análisis de decisiones con múltiples criterios)', 'Representación de datos (diagramas de afinidad, diagramas de causa y efecto, diagramas de flujo, histogramas, diagramas matriciales, diagramas de dispersión)', 'Auditorías', 'Diseño para X', 'Resolución de problemas', 'Métodos de mejora de la calidad'],
        outputs: [doc('informe-calidad', 'Informes de calidad'), doc('documentos-prueba'), view('calidad', 'Análisis de causa raíz (diagramas de Ishikawa y de Pareto)'), CR(),
          PMPU('plan de gestión de la calidad, línea base del alcance, línea base del cronograma, línea base de costos'),
          PDU('registro de incidentes, registro de lecciones aprendidas, registro de riesgos'), upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-calidad', 'registro-lecciones', 'mediciones-control-calidad', 'metricas-calidad', 'informe-riesgos'],
        toolViews: ['calidad', 'flujogramas'],
      }),
    P('8.3', 'Controlar la Calidad', 'calidad', 'monitoreo', 'continua',
      'Monitorea y registra los resultados de las actividades de gestión de la calidad para evaluar el desempeño y asegurar que las salidas del proyecto sean completas, correctas y satisfagan las expectativas del cliente. Beneficio clave: verifica que los entregables cumplen los requisitos especificados por los interesados clave para su aceptación final.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de la calidad)', 'Documentos del proyecto (registro de lecciones aprendidas, métricas de calidad, documentos de prueba y evaluación)', 'Solicitudes de cambio aprobadas', 'Entregables', WPD, EEF, OPA],
        tools: ['Recopilación de datos (listas de verificación, hojas de verificación, muestreo estadístico, cuestionarios y encuestas)', 'Análisis de datos (revisiones del desempeño, análisis de causa raíz)', 'Inspección', 'Pruebas/evaluaciones de productos', 'Representación de datos (diagramas de causa y efecto, gráficos de control, histogramas, diagramas de dispersión)', REU],
        outputs: [doc('mediciones-control-calidad'), upd('entregables', 'Entregables verificados'), view('calidad', 'Análisis de causa raíz de los defectos (Ishikawa y Pareto)'), WPI(), CR(),
          PMPU('plan de gestión de la calidad'),
          PDU('registro de incidentes, registro de lecciones aprendidas, registro de riesgos, documentos de prueba y evaluación'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos'), upd('documentos-prueba')],
        inputsDocs: ['plan-gestion-calidad', 'registro-lecciones', 'metricas-calidad', 'documentos-prueba', 'solicitud-cambio', 'entregables'],
        toolViews: ['calidad'],
      }),

    /* ===================== 9. Recursos ===================== */
    P('9.1', 'Planificar la Gestión de Recursos', 'recursos', 'planificacion', 'unica',
      'Define cómo estimar, adquirir, gestionar y utilizar los recursos físicos y los recursos del equipo. Beneficio clave: establece el enfoque y el nivel de esfuerzo de gestión necesarios según el tipo y la complejidad del proyecto.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión de la calidad, línea base del alcance)', 'Documentos del proyecto (cronograma del proyecto, documentación de requisitos, registro de riesgos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Representación de datos (diagramas jerárquicos, matriz de asignación de responsabilidades, formatos tipo texto)', 'Teoría organizacional', REU],
        outputs: [doc('plan-gestion-recursos'), doc('acta-constitucion-equipo'), view('raci', 'Matriz de asignación de responsabilidades (RACI)'),
          PDU('registro de supuestos, registro de riesgos'), upd('registro-supuestos'), upd('registro-riesgos')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-calidad', 'documentacion-requisitos', 'registro-riesgos', 'registro-interesados'],
        toolViews: ['raci', 'edt'],
      }),
    P('9.2', 'Estimar los Recursos de las Actividades', 'recursos', 'planificacion', 'periodica',
      'Estima los recursos del equipo y el tipo y las cantidades de materiales, equipamiento y suministros necesarios para ejecutar el trabajo del proyecto. Beneficio clave: identifica el tipo, la cantidad y las características de los recursos necesarios para completar el proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, línea base del alcance)', 'Documentos del proyecto (atributos de las actividades, lista de actividades, registro de supuestos, estimaciones de costos, calendarios de recursos, registro de riesgos)', EEF, OPA],
        tools: [JE, 'Estimación ascendente', 'Estimación análoga', 'Estimación paramétrica', 'Análisis de datos (análisis de alternativas)', PMIS, REU],
        outputs: [doc('requisitos-recursos', 'Requisitos de recursos y base de las estimaciones'), doc('estructura-desglose-recursos'), view('recursos', 'Requisitos de recursos por actividad (histograma de recursos)'),
          PDU('atributos de las actividades, registro de supuestos, registro de lecciones aprendidas'), upd('registro-supuestos'), upd('registro-lecciones')],
        inputsDocs: ['plan-gestion-recursos', 'registro-supuestos', 'estimacion-costos', 'registro-riesgos'],
        toolViews: ['recursos', 'cronograma'],
      }),
    P('9.3', 'Adquirir Recursos', 'recursos', 'ejecucion', 'periodica',
      'Obtiene los miembros del equipo, las instalaciones, el equipamiento, los materiales, los suministros y otros recursos necesarios para completar el trabajo del proyecto. Beneficio clave: describe y guía la selección de recursos y los asigna a sus respectivas actividades.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de las adquisiciones, línea base de costos)', 'Documentos del proyecto (cronograma del proyecto, calendarios de recursos, requisitos de recursos, registro de interesados)', EEF, OPA],
        tools: ['Toma de decisiones (análisis de decisiones con múltiples criterios)', 'Habilidades interpersonales y de equipo (negociación)', 'Asignación previa', 'Equipos virtuales'],
        outputs: [doc('asignaciones-recursos', 'Asignaciones de recursos físicos y asignaciones del equipo del proyecto'), txt('Calendarios de recursos'), CR(),
          PMPU('plan de gestión de los recursos, línea base de costos'),
          PDU('registro de lecciones aprendidas, cronograma del proyecto, estructura de desglose de recursos, requisitos de recursos, registro de riesgos, registro de interesados'),
          upd('registro-lecciones'), upd('estructura-desglose-recursos'), upd('requisitos-recursos'), upd('registro-riesgos'), upd('registro-interesados'), EEFU(), OPAU()],
        inputsDocs: ['plan-gestion-recursos', 'plan-gestion-adquisiciones', 'requisitos-recursos', 'registro-interesados'],
        toolViews: ['recursos'],
      }),
    P('9.4', 'Desarrollar el Equipo', 'recursos', 'ejecucion', 'continua',
      'Mejora las competencias, la interacción entre los miembros del equipo y el ambiente general del equipo para lograr un mejor desempeño del proyecto. Beneficio clave: mejora el trabajo en equipo, las habilidades y la motivación de las personas, reduce la rotación de personal y mejora el desempeño general del proyecto.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos)', 'Documentos del proyecto (registro de lecciones aprendidas, cronograma del proyecto, asignaciones del equipo del proyecto, calendarios de recursos, acta de constitución del equipo)', EEF, OPA],
        tools: ['Coubicación', 'Equipos virtuales', 'Tecnología de la comunicación', 'Habilidades interpersonales y de equipo (gestión de conflictos, influencia, motivación, negociación, desarrollo del espíritu de equipo)', 'Reconocimiento y recompensas', 'Capacitación', 'Evaluaciones individuales y de equipo', REU],
        outputs: [doc('evaluacion-desempeno-equipo'), CR(), PMPU('plan de gestión de los recursos'),
          PDU('registro de lecciones aprendidas, cronograma del proyecto, asignaciones del equipo del proyecto, calendarios de recursos, acta de constitución del equipo'),
          upd('registro-lecciones'), upd('asignaciones-recursos'), upd('acta-constitucion-equipo'), EEFU(), OPAU()],
        inputsDocs: ['plan-gestion-recursos', 'registro-lecciones', 'asignaciones-recursos', 'acta-constitucion-equipo'],
      }),
    P('9.5', 'Dirigir al Equipo', 'recursos', 'ejecucion', 'continua',
      'Hace seguimiento del desempeño de los miembros del equipo, proporciona retroalimentación, resuelve problemas y gestiona cambios en el equipo para optimizar el desempeño del proyecto. Beneficio clave: influye en el comportamiento del equipo, gestiona los conflictos y resuelve los problemas.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos)', 'Documentos del proyecto (registro de incidentes, registro de lecciones aprendidas, asignaciones del equipo del proyecto, acta de constitución del equipo)', WPR, 'Evaluaciones de desempeño del equipo', EEF, OPA],
        tools: ['Habilidades interpersonales y de equipo (gestión de conflictos, toma de decisiones, inteligencia emocional, influencia, liderazgo)', PMIS],
        outputs: [CR(), PMPU('plan de gestión de los recursos, línea base del cronograma, línea base de costos'),
          PDU('registro de incidentes, registro de lecciones aprendidas, asignaciones del equipo del proyecto'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('asignaciones-recursos'), view('recursos', 'Carga y asignaciones del equipo del proyecto (actualización)'), EEFU()],
        inputsDocs: ['plan-gestion-recursos', 'registro-incidentes', 'registro-lecciones', 'asignaciones-recursos', 'acta-constitucion-equipo', 'informe-desempeno', 'evaluacion-desempeno-equipo'],
        toolViews: ['recursos'],
      }),
    P('9.6', 'Controlar los Recursos', 'recursos', 'monitoreo', 'continua',
      'Asegura que los recursos físicos asignados y adjudicados al proyecto estén disponibles tal como se planificó, monitorea su utilización planificada frente a la real y aplica acciones correctivas según sea necesario. Beneficio clave: los recursos asignados están disponibles en el momento y el lugar adecuados, y se liberan cuando ya no se necesitan.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos)', 'Documentos del proyecto (registro de incidentes, registro de lecciones aprendidas, asignaciones de recursos físicos, cronograma del proyecto, estructura de desglose de recursos, requisitos de recursos, registro de riesgos)', WPD, 'Acuerdos', OPA],
        tools: ['Análisis de datos (análisis de alternativas, análisis costo-beneficio, revisiones del desempeño, análisis de tendencias)', 'Resolución de problemas', 'Habilidades interpersonales y de equipo (negociación, influencia)', PMIS],
        outputs: [WPI(), view('recursos', 'Utilización planificada frente a la real de los recursos'), CR(),
          PMPU('plan de gestión de los recursos, línea base del cronograma, línea base de costos'),
          PDU('registro de supuestos, registro de incidentes, registro de lecciones aprendidas, asignaciones de recursos físicos, estructura de desglose de recursos, registro de riesgos'),
          upd('registro-supuestos'), upd('registro-incidentes'), upd('registro-lecciones'), upd('asignaciones-recursos'), upd('estructura-desglose-recursos'), upd('registro-riesgos')],
        inputsDocs: ['plan-gestion-recursos', 'registro-incidentes', 'registro-lecciones', 'asignaciones-recursos', 'estructura-desglose-recursos', 'requisitos-recursos', 'registro-riesgos', 'registro-adquisiciones'],
        toolViews: ['recursos'],
      }),

    /* ===================== 10. Comunicaciones ===================== */
    P('10.1', 'Planificar la Gestión de las Comunicaciones', 'comunicaciones', 'planificacion', 'periodica',
      'Desarrolla un enfoque y un plan apropiados para las actividades de comunicación del proyecto, con base en las necesidades de información de cada interesado o grupo, los activos de la organización y las necesidades del proyecto. Beneficio clave: documenta un enfoque para involucrar a los interesados de manera eficaz y eficiente, presentando información relevante de forma oportuna.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión de los recursos, plan de involucramiento de los interesados)', 'Documentos del proyecto (documentación de requisitos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Análisis de requisitos de comunicación', 'Tecnología de la comunicación', 'Modelos de comunicación', 'Métodos de comunicación', 'Habilidades interpersonales y de equipo (evaluación de estilos de comunicación, conciencia política, conciencia cultural)', 'Representación de datos (matriz de evaluación del involucramiento de los interesados)', REU],
        outputs: [doc('plan-gestion-comunicaciones'), PMPU('plan de involucramiento de los interesados'), PDU('cronograma del proyecto, registro de interesados'), upd('registro-interesados')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-recursos', 'plan-involucramiento-interesados', 'documentacion-requisitos', 'registro-interesados'],
        toolViews: ['interesados-matriz'],
      }),
    P('10.2', 'Gestionar las Comunicaciones', 'comunicaciones', 'ejecucion', 'continua',
      'Garantiza que la recopilación, creación, distribución, almacenamiento, recuperación, gestión, monitoreo y disposición final de la información del proyecto sean oportunos y adecuados. Beneficio clave: permite un flujo de información eficaz y eficiente entre el equipo del proyecto y los interesados.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de las comunicaciones, plan de involucramiento de los interesados)', 'Documentos del proyecto (registro de cambios, registro de incidentes, registro de lecciones aprendidas, informe de calidad, informe de riesgos, registro de interesados)', WPR, EEF, OPA],
        tools: ['Tecnología de la comunicación', 'Métodos de comunicación', 'Habilidades de comunicación (competencia comunicativa, retroalimentación, comunicación no verbal, presentaciones)', PMIS, 'Informes del proyecto', 'Habilidades interpersonales y de equipo (escucha activa, gestión de conflictos, conciencia cultural, gestión de reuniones, trabajo en red, conciencia política)', REU],
        outputs: [doc('registro-comunicaciones', 'Comunicaciones del proyecto'), doc('acta-reunion', 'Actas de reunión (comunicaciones del proyecto)'),
          PMPU('plan de gestión de las comunicaciones, plan de involucramiento de los interesados'),
          PDU('registro de incidentes, cronograma del proyecto, registro de lecciones aprendidas, registro de riesgos, registro de interesados'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos'), upd('registro-interesados'), OPAU()],
        inputsDocs: ['plan-gestion-recursos', 'plan-gestion-comunicaciones', 'plan-involucramiento-interesados', 'registro-cambios', 'registro-incidentes', 'registro-lecciones', 'informe-calidad', 'informe-riesgos', 'registro-interesados', 'informe-desempeno'],
      }),
    P('10.3', 'Monitorear las Comunicaciones', 'comunicaciones', 'monitoreo', 'continua',
      'Asegura que se satisfagan las necesidades de información del proyecto y de sus interesados. Beneficio clave: logra el flujo óptimo de información definido en el plan de gestión de las comunicaciones y en el plan de involucramiento de los interesados.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de las comunicaciones, plan de involucramiento de los interesados)', 'Documentos del proyecto (registro de incidentes, registro de lecciones aprendidas, comunicaciones del proyecto)', WPD, EEF, OPA],
        tools: [JE, PMIS, 'Representación de datos (matriz de evaluación del involucramiento de los interesados)', 'Habilidades interpersonales y de equipo (observación/conversación)', REU],
        outputs: [doc('informe-desempeno', 'Información de desempeño del trabajo (comunicaciones)'), CR(),
          PMPU('plan de gestión de las comunicaciones, plan de involucramiento de los interesados'),
          PDU('registro de incidentes, registro de lecciones aprendidas, registro de interesados'), upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-interesados')],
        inputsDocs: ['plan-gestion-recursos', 'plan-gestion-comunicaciones', 'plan-involucramiento-interesados', 'registro-incidentes', 'registro-lecciones', 'registro-comunicaciones'],
        toolViews: ['interesados-matriz'],
      }),

    /* ===================== 11. Riesgos ===================== */
    P('11.1', 'Planificar la Gestión de los Riesgos', 'riesgos', 'planificacion', 'unica',
      'Define cómo realizar las actividades de gestión de riesgos del proyecto. Beneficio clave: asegura que el grado, el tipo y la visibilidad de la gestión de riesgos sean proporcionales tanto a los riesgos como a la importancia del proyecto para la organización y los demás interesados.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (todos los componentes)', 'Documentos del proyecto (registro de interesados)', EEF, OPA],
        tools: [JE, 'Análisis de datos (análisis de interesados)', REU],
        outputs: [doc('plan-gestion-riesgos')],
        inputsDocs: ['acta-constitucion', 'registro-interesados'],
      }),
    P('11.2', 'Identificar los Riesgos', 'riesgos', 'planificacion', 'continua',
      'Identifica los riesgos individuales del proyecto y las fuentes de riesgo general, y documenta sus características. Beneficio clave: documenta los riesgos individuales existentes y las fuentes del riesgo general del proyecto, y reúne información para que el equipo pueda responder de manera apropiada.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los requisitos, plan de gestión del cronograma, plan de gestión de los costos, plan de gestión de la calidad, plan de gestión de los recursos, plan de gestión de los riesgos, línea base del alcance, línea base del cronograma, línea base de costos)', 'Documentos del proyecto (registro de supuestos, estimaciones de costos, estimaciones de la duración, registro de incidentes, registro de lecciones aprendidas, documentación de requisitos, requisitos de recursos, registro de interesados)', 'Acuerdos', 'Documentación de las adquisiciones', EEF, OPA],
        tools: [JE, 'Recopilación de datos (tormenta de ideas, listas de verificación, entrevistas)', 'Análisis de datos (análisis de causa raíz, análisis de supuestos y restricciones, análisis FODA, análisis de documentos)', 'Habilidades interpersonales y de equipo (facilitación)', 'Listas rápidas', REU],
        outputs: [doc('registro-riesgos'), doc('informe-riesgos'), PDU('registro de supuestos, registro de incidentes, registro de lecciones aprendidas'), upd('registro-supuestos'), upd('registro-incidentes'), upd('registro-lecciones')],
        inputsDocs: ['plan-gestion-requisitos', 'plan-gestion-cronograma', 'plan-gestion-costos', 'plan-gestion-calidad', 'plan-gestion-recursos', 'plan-gestion-riesgos', 'registro-supuestos', 'estimacion-costos', 'estimaciones-duracion', 'registro-incidentes', 'registro-lecciones', 'documentacion-requisitos', 'requisitos-recursos', 'registro-interesados', 'registro-adquisiciones'],
      }),
    P('11.3', 'Realizar el Análisis Cualitativo de Riesgos', 'riesgos', 'planificacion', 'continua',
      'Prioriza los riesgos individuales del proyecto para análisis o acción posterior, evaluando su probabilidad de ocurrencia e impacto, así como otras características. Beneficio clave: concentra los esfuerzos en los riesgos de alta prioridad.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los riesgos)', 'Documentos del proyecto (registro de supuestos, registro de riesgos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (entrevistas)', 'Análisis de datos (evaluación de la calidad de los datos sobre riesgos, evaluación de probabilidad e impacto de los riesgos, evaluación de otros parámetros de riesgo)', 'Habilidades interpersonales y de equipo (facilitación)', 'Categorización de riesgos', 'Representación de datos (matriz de probabilidad e impacto, gráficos jerárquicos)', REU],
        outputs: [upd('registro-riesgos', 'Registro de riesgos (probabilidad, impacto y prioridad)'), view('riesgos-matriz', 'Matriz de probabilidad e impacto'),
          PDU('registro de supuestos, registro de incidentes, registro de riesgos, informe de riesgos'), upd('registro-supuestos'), upd('registro-incidentes'), upd('informe-riesgos')],
        inputsDocs: ['plan-gestion-riesgos', 'registro-supuestos', 'registro-riesgos', 'registro-interesados'],
        toolViews: ['riesgos-matriz'],
      }),
    P('11.4', 'Realizar el Análisis Cuantitativo de Riesgos', 'riesgos', 'planificacion', 'continua',
      'Analiza numéricamente el efecto combinado de los riesgos individuales identificados y otras fuentes de incertidumbre sobre los objetivos generales del proyecto. Beneficio clave: cuantifica la exposición al riesgo general del proyecto y aporta información cuantitativa adicional para la planificación de la respuesta a los riesgos.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los riesgos, línea base del alcance, línea base del cronograma, línea base de costos)', 'Documentos del proyecto (registro de supuestos, base de las estimaciones, estimaciones de costos, pronósticos de costos, estimaciones de la duración, lista de hitos, requisitos de recursos, registro de riesgos, informe de riesgos, pronósticos del cronograma)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (entrevistas)', 'Habilidades interpersonales y de equipo (facilitación)', 'Representaciones de la incertidumbre', 'Análisis de datos (simulaciones, análisis de sensibilidad, análisis mediante árbol de decisiones, diagramas de influencias)'],
        outputs: [doc('analisis-cuantitativo', 'Análisis cuantitativo de riesgos (valor monetario esperado y reservas)'), PDU('informe de riesgos'), upd('informe-riesgos')],
        inputsDocs: ['plan-gestion-riesgos', 'registro-supuestos', 'estimacion-costos', 'estimaciones-duracion', 'requisitos-recursos', 'registro-riesgos', 'informe-riesgos'],
      }),
    P('11.5', 'Planificar la Respuesta a los Riesgos', 'riesgos', 'planificacion', 'continua',
      'Desarrolla opciones, selecciona estrategias y acuerda acciones para abordar la exposición general al riesgo del proyecto y tratar los riesgos individuales. Beneficio clave: identifica las formas adecuadas de abordar el riesgo general y los riesgos individuales, asigna recursos e inserta actividades en los documentos y en el plan para la dirección del proyecto según sea necesario.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de los riesgos, línea base de costos)', 'Documentos del proyecto (registro de lecciones aprendidas, cronograma del proyecto, asignaciones del equipo del proyecto, calendarios de recursos, registro de riesgos, informe de riesgos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (entrevistas)', 'Habilidades interpersonales y de equipo (facilitación)', 'Estrategias para amenazas (escalar, evitar, transferir, mitigar, aceptar)', 'Estrategias para oportunidades (escalar, explotar, compartir, mejorar, aceptar)', 'Estrategias de respuesta a contingencias', 'Estrategias para el riesgo general del proyecto', 'Análisis de datos (análisis de alternativas, análisis costo-beneficio)', 'Toma de decisiones (análisis de decisiones con múltiples criterios)'],
        outputs: [upd('registro-riesgos', 'Registro de riesgos (estrategias, respuestas acordadas y propietarios)'), CR(),
          PMPU('plan de gestión del cronograma, plan de gestión de los costos, plan de gestión de la calidad, plan de gestión de los recursos, plan de gestión de las adquisiciones, línea base del alcance, línea base del cronograma, línea base de costos'),
          PDU('registro de supuestos, pronósticos de costos, registro de lecciones aprendidas, cronograma del proyecto, asignaciones del equipo del proyecto, registro de riesgos, informe de riesgos'),
          upd('registro-supuestos'), upd('registro-lecciones'), upd('asignaciones-recursos'), upd('informe-riesgos')],
        inputsDocs: ['plan-gestion-recursos', 'plan-gestion-riesgos', 'registro-lecciones', 'asignaciones-recursos', 'registro-riesgos', 'informe-riesgos', 'registro-interesados'],
        toolViews: ['riesgos-matriz'],
      }),
    P('11.6', 'Implementar la Respuesta a los Riesgos', 'riesgos', 'ejecucion', 'continua',
      'Implementa los planes acordados de respuesta a los riesgos. Beneficio clave: asegura que las respuestas acordadas se ejecuten tal como se planificaron, para abordar la exposición al riesgo general del proyecto, minimizar las amenazas individuales y maximizar las oportunidades individuales.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los riesgos)', 'Documentos del proyecto (registro de lecciones aprendidas, registro de riesgos, informe de riesgos)', OPA],
        tools: [JE, 'Habilidades interpersonales y de equipo (influencia)', PMIS],
        outputs: [CR(), PDU('registro de incidentes, registro de lecciones aprendidas, asignaciones del equipo del proyecto, registro de riesgos, informe de riesgos'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('asignaciones-recursos'), upd('registro-riesgos'), upd('informe-riesgos')],
        inputsDocs: ['plan-gestion-riesgos', 'registro-lecciones', 'registro-riesgos', 'informe-riesgos'],
      }),
    P('11.7', 'Monitorear los Riesgos', 'riesgos', 'monitoreo', 'continua',
      'Monitorea la implementación de los planes acordados de respuesta, hace seguimiento a los riesgos identificados, identifica y analiza nuevos riesgos y evalúa la efectividad del proceso de gestión de riesgos a lo largo del proyecto. Beneficio clave: permite que las decisiones del proyecto se basen en información actual sobre la exposición al riesgo general y los riesgos individuales.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los riesgos)', 'Documentos del proyecto (registro de incidentes, registro de lecciones aprendidas, registro de riesgos, informe de riesgos)', WPD, WPR],
        tools: ['Análisis de datos (análisis técnico del desempeño, análisis de reservas)', 'Auditorías', REU],
        outputs: [WPI(), CR(), PMPU('cualquier componente'),
          PDU('registro de supuestos, registro de incidentes, registro de lecciones aprendidas, registro de riesgos, informe de riesgos'),
          upd('registro-supuestos'), upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos'), upd('informe-riesgos'), OPAU()],
        inputsDocs: ['plan-gestion-riesgos', 'registro-incidentes', 'registro-lecciones', 'registro-riesgos', 'informe-riesgos', 'informe-desempeno'],
        toolViews: ['riesgos-matriz'],
      }),

    /* ===================== 12. Adquisiciones ===================== */
    P('12.1', 'Planificar la Gestión de las Adquisiciones', 'adquisiciones', 'planificacion', 'unica',
      'Documenta las decisiones de adquisiciones del proyecto, especifica el enfoque e identifica a los proveedores potenciales. Beneficio clave: determina si es preciso adquirir bienes y servicios fuera del proyecto y, en ese caso, qué adquirir, de qué manera y cuándo.', {
        inputs: [CHARTER, BIZ, 'Plan para la dirección del proyecto (plan de gestión del alcance, plan de gestión de la calidad, plan de gestión de los recursos, línea base del alcance)', 'Documentos del proyecto (lista de hitos, asignaciones del equipo del proyecto, documentación de requisitos, matriz de trazabilidad de requisitos, requisitos de recursos, registro de riesgos, registro de interesados)', EEF, OPA],
        tools: [JE, 'Recopilación de datos (estudio de mercado)', 'Análisis de datos (análisis de hacer o comprar)', 'Análisis de selección de proveedores', REU],
        outputs: [doc('plan-gestion-adquisiciones'), doc('estrategia-adquisiciones'), txt('Documentos de las licitaciones'),
          doc('enunciado-trabajo-adquisicion', 'Enunciados del trabajo relativo a adquisiciones'), doc('criterios-seleccion-proveedores', 'Criterios de selección de proveedores'),
          doc('decisiones-hacer-comprar', 'Decisiones de hacer o comprar'), txt('Estimaciones independientes de costos'), CR(),
          PDU('registro de lecciones aprendidas, lista de hitos, documentación de requisitos, matriz de trazabilidad de requisitos, registro de riesgos, registro de interesados'),
          upd('registro-lecciones'), upd('documentacion-requisitos'), upd('matriz-trazabilidad'), upd('registro-riesgos'), upd('registro-interesados'), OPAU()],
        inputsDocs: ['acta-constitucion', 'caso-negocio', 'plan-gestion-beneficios', 'plan-gestion-alcance', 'plan-gestion-calidad', 'plan-gestion-recursos', 'asignaciones-recursos', 'documentacion-requisitos', 'matriz-trazabilidad', 'requisitos-recursos', 'registro-riesgos', 'registro-interesados'],
      }),
    P('12.2', 'Efectuar las Adquisiciones', 'adquisiciones', 'ejecucion', 'periodica',
      'Obtiene respuestas de los vendedores, selecciona un vendedor y adjudica un contrato. Beneficio clave: selecciona un vendedor calificado e implementa el acuerdo legal para la entrega.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión del alcance, plan de gestión de los requisitos, plan de gestión de las comunicaciones, plan de gestión de los riesgos, plan de gestión de las adquisiciones, plan de gestión de la configuración, línea base de costos)', 'Documentos del proyecto (registro de lecciones aprendidas, cronograma del proyecto, documentación de requisitos, registro de riesgos, registro de interesados)', 'Documentación de las adquisiciones (documentos de las licitaciones, enunciado del trabajo, estimaciones independientes de costos, criterios de selección de proveedores)', 'Propuestas de los vendedores', EEF, OPA],
        tools: [JE, 'Publicidad', 'Conferencias de oferentes', 'Análisis de datos (evaluación de propuestas)', 'Habilidades interpersonales y de equipo (negociación)'],
        outputs: [doc('registro-adquisiciones', 'Vendedores seleccionados y acuerdos'), CR(),
          PMPU('plan de gestión de los requisitos, plan de gestión de la calidad, plan de gestión de las comunicaciones, plan de gestión de los riesgos, plan de gestión de las adquisiciones, línea base del alcance, línea base del cronograma, línea base de costos'),
          PDU('registro de lecciones aprendidas, documentación de requisitos, matriz de trazabilidad de requisitos, calendarios de recursos, registro de riesgos, registro de interesados'),
          upd('registro-lecciones'), upd('documentacion-requisitos'), upd('matriz-trazabilidad'), upd('registro-riesgos'), upd('registro-interesados'), OPAU()],
        inputsDocs: ['plan-gestion-alcance', 'plan-gestion-requisitos', 'plan-gestion-comunicaciones', 'plan-gestion-riesgos', 'plan-gestion-adquisiciones', 'plan-gestion-configuracion', 'registro-lecciones', 'documentacion-requisitos', 'registro-riesgos', 'registro-interesados', 'enunciado-trabajo-adquisicion', 'criterios-seleccion-proveedores'],
      }),
    P('12.3', 'Controlar las Adquisiciones', 'adquisiciones', 'monitoreo', 'continua',
      'Gestiona las relaciones de adquisiciones, monitorea la ejecución de los contratos, efectúa cambios y correcciones según corresponda y cierra los contratos. Beneficio clave: garantiza que el desempeño tanto del vendedor como del comprador satisfaga los requisitos del proyecto según los términos del acuerdo legal.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los requisitos, plan de gestión de los riesgos, plan de gestión de las adquisiciones, plan de gestión de cambios, línea base del cronograma)', 'Documentos del proyecto (registro de supuestos, registro de lecciones aprendidas, lista de hitos, informes de calidad, documentación de requisitos, matriz de trazabilidad de requisitos, registro de riesgos, registro de interesados)', 'Acuerdos', 'Documentación de las adquisiciones', 'Solicitudes de cambio aprobadas', WPD, EEF, OPA],
        tools: [JE, 'Administración de reclamaciones', 'Análisis de datos (revisiones del desempeño, análisis del valor ganado, análisis de tendencias)', 'Inspección', 'Auditorías'],
        outputs: [txt('Adquisiciones cerradas'), doc('control-adquisiciones', 'Información de desempeño del trabajo de los contratos'), upd('registro-adquisiciones', 'Actualizaciones a la documentación de las adquisiciones'), CR(),
          PMPU('plan de gestión de los riesgos, plan de gestión de las adquisiciones, línea base del cronograma, línea base de costos'),
          PDU('registro de lecciones aprendidas, requisitos de recursos, matriz de trazabilidad de requisitos, registro de riesgos, registro de interesados'),
          upd('registro-lecciones'), upd('requisitos-recursos'), upd('matriz-trazabilidad'), upd('registro-riesgos'), upd('registro-interesados'), OPAU()],
        inputsDocs: ['plan-gestion-requisitos', 'plan-gestion-riesgos', 'plan-gestion-adquisiciones', 'plan-gestion-cambios', 'registro-supuestos', 'registro-lecciones', 'informe-calidad', 'documentacion-requisitos', 'matriz-trazabilidad', 'registro-riesgos', 'registro-interesados', 'registro-adquisiciones', 'enunciado-trabajo-adquisicion', 'solicitud-cambio'],
        toolViews: ['valor-ganado'],
      }),

    /* ===================== 13. Interesados ===================== */
    P('13.1', 'Identificar a los Interesados', 'interesados', 'inicio', 'periodica',
      'Identifica periódicamente a los interesados del proyecto y analiza y documenta información relevante sobre sus intereses, participación, interdependencias, influencia e impacto potencial en el éxito del proyecto. Beneficio clave: permite al equipo identificar el enfoque adecuado para involucrar a cada interesado o grupo de interesados.', {
        inputs: [CHARTER, BIZ, 'Plan para la dirección del proyecto (plan de gestión de las comunicaciones, plan de involucramiento de los interesados)', 'Documentos del proyecto (registro de cambios, registro de incidentes, documentación de requisitos)', 'Acuerdos', EEF, OPA],
        tools: [JE, 'Recopilación de datos (cuestionarios y encuestas, tormenta de ideas)', 'Análisis de datos (análisis de interesados, análisis de documentos)', 'Representación de datos (mapeo/representación de interesados)', REU],
        outputs: [doc('registro-interesados'), view('interesados-matriz', 'Mapeo/representación de interesados (poder e interés)'), CR(),
          PMPU('plan de gestión de los requisitos, plan de gestión de las comunicaciones, plan de gestión de los riesgos, plan de involucramiento de los interesados'),
          PDU('registro de supuestos, registro de incidentes, registro de riesgos'), upd('registro-supuestos'), upd('registro-incidentes'), upd('registro-riesgos')],
        inputsDocs: ['acta-constitucion', 'caso-negocio', 'plan-gestion-beneficios', 'plan-gestion-comunicaciones', 'plan-involucramiento-interesados', 'registro-cambios', 'registro-incidentes', 'documentacion-requisitos'],
        toolViews: ['interesados-matriz'],
      }),
    P('13.2', 'Planificar el Involucramiento de los Interesados', 'interesados', 'planificacion', 'periodica',
      'Desarrolla enfoques para involucrar a los interesados del proyecto con base en sus necesidades, expectativas, intereses e impacto potencial en el proyecto. Beneficio clave: proporciona un plan factible para interactuar de manera eficaz con los interesados.', {
        inputs: [CHARTER, 'Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de las comunicaciones, plan de gestión de los riesgos)', 'Documentos del proyecto (registro de supuestos, registro de cambios, registro de incidentes, cronograma del proyecto, registro de riesgos, registro de interesados)', 'Acuerdos', EEF, OPA],
        tools: [JE, 'Recopilación de datos (estudios comparativos)', 'Análisis de datos (análisis de supuestos y restricciones, análisis de causa raíz)', 'Toma de decisiones (priorización/clasificación)', 'Representación de datos (mapeo mental, matriz de evaluación del involucramiento de los interesados)', REU],
        outputs: [doc('plan-involucramiento-interesados'), view('interesados-matriz', 'Matriz de evaluación del involucramiento de los interesados')],
        inputsDocs: ['acta-constitucion', 'plan-gestion-recursos', 'plan-gestion-comunicaciones', 'plan-gestion-riesgos', 'registro-supuestos', 'registro-cambios', 'registro-incidentes', 'registro-riesgos', 'registro-interesados'],
        toolViews: ['interesados-matriz'],
      }),
    P('13.3', 'Gestionar la Participación de los Interesados', 'interesados', 'ejecucion', 'continua',
      'Comunica y trabaja con los interesados para satisfacer sus necesidades y expectativas, abordar los incidentes y fomentar su participación adecuada. Beneficio clave: permite al director del proyecto incrementar el apoyo y minimizar la resistencia por parte de los interesados.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de las comunicaciones, plan de gestión de los riesgos, plan de involucramiento de los interesados, plan de gestión de cambios)', 'Documentos del proyecto (registro de cambios, registro de incidentes, registro de lecciones aprendidas, registro de interesados)', EEF, OPA],
        tools: [JE, 'Habilidades de comunicación (retroalimentación)', 'Habilidades interpersonales y de equipo (gestión de conflictos, conciencia cultural, negociación, observación/conversación, conciencia política)', 'Reglas básicas', REU],
        outputs: [CR(), PMPU('plan de gestión de las comunicaciones, plan de involucramiento de los interesados'),
          PDU('registro de cambios, registro de incidentes, registro de lecciones aprendidas, registro de interesados'),
          upd('registro-cambios'), upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-interesados')],
        inputsDocs: ['plan-gestion-comunicaciones', 'plan-gestion-riesgos', 'plan-involucramiento-interesados', 'plan-gestion-cambios', 'registro-cambios', 'registro-incidentes', 'registro-lecciones', 'registro-interesados'],
        toolViews: ['interesados-matriz'],
      }),
    P('13.4', 'Monitorear el Involucramiento de los Interesados', 'interesados', 'monitoreo', 'continua',
      'Monitorea las relaciones de los interesados del proyecto y adapta las estrategias para involucrarlos mediante la modificación de los planes y estrategias de involucramiento. Beneficio clave: mantiene o incrementa la eficiencia y la eficacia de las actividades de participación a medida que el proyecto evoluciona y su entorno cambia.', {
        inputs: ['Plan para la dirección del proyecto (plan de gestión de los recursos, plan de gestión de las comunicaciones, plan de involucramiento de los interesados)', 'Documentos del proyecto (registro de incidentes, registro de lecciones aprendidas, comunicaciones del proyecto, registro de riesgos, registro de interesados)', WPD, EEF, OPA],
        tools: ['Análisis de datos (análisis de alternativas, análisis de causa raíz, análisis de interesados)', 'Toma de decisiones (análisis de decisiones con múltiples criterios, votación)', 'Representación de datos (matriz de evaluación del involucramiento de los interesados)', 'Habilidades de comunicación (retroalimentación, presentaciones)', 'Habilidades interpersonales y de equipo (escucha activa, conciencia cultural, liderazgo, trabajo en red, conciencia política)', REU],
        outputs: [WPI(), CR(), PMPU('plan de gestión de los recursos, plan de gestión de las comunicaciones, plan de involucramiento de los interesados'),
          PDU('registro de incidentes, registro de lecciones aprendidas, registro de riesgos, registro de interesados'),
          upd('registro-incidentes'), upd('registro-lecciones'), upd('registro-riesgos'), upd('registro-interesados')],
        inputsDocs: ['plan-gestion-recursos', 'plan-gestion-comunicaciones', 'plan-involucramiento-interesados', 'registro-incidentes', 'registro-lecciones', 'registro-comunicaciones', 'registro-riesgos', 'registro-interesados'],
        toolViews: ['interesados-matriz'],
      }),
  ].sort((a, b) => compareCodes(a.code, b.code));

  /* ---------------------------------------------------------------- catálogo canónico de documentos (SPEC §6) */
  const docs = [
    ['caso-negocio', 'Caso de negocio', '4.1', 'integracion', 'inicio', 'documento'],
    ['plan-gestion-beneficios', 'Plan de gestión de los beneficios', '4.1', 'integracion', 'inicio', 'plan'],
    ['acta-constitucion', 'Acta de constitución del proyecto', '4.1', 'integracion', 'inicio', 'acta'],
    ['registro-supuestos', 'Registro de supuestos', '4.1', 'integracion', 'inicio', 'registro'],
    ['plan-direccion', 'Plan para la dirección del proyecto', '4.2', 'integracion', 'planificacion', 'plan'],
    ['plan-gestion-cambios', 'Plan de gestión de cambios', '4.2', 'integracion', 'planificacion', 'plan'],
    ['plan-gestion-configuracion', 'Plan de gestión de la configuración', '4.2', 'integracion', 'planificacion', 'plan'],
    ['entregables', 'Registro de entregables', '4.3', 'integracion', 'ejecucion', 'registro'],
    ['registro-incidentes', 'Registro de incidentes', '4.3', 'integracion', 'ejecucion', 'registro'],
    ['registro-lecciones', 'Registro de lecciones aprendidas', '4.4', 'integracion', 'ejecucion', 'registro'],
    ['informe-desempeno', 'Informe de desempeño del trabajo', '4.5', 'integracion', 'monitoreo', 'informe', true],
    ['solicitud-cambio', 'Solicitud de cambio', '4.6', 'integracion', 'monitoreo', 'formato', true],
    ['registro-cambios', 'Registro de cambios', '4.6', 'integracion', 'monitoreo', 'registro'],
    ['informe-final', 'Informe final del proyecto', '4.7', 'integracion', 'cierre', 'informe'],
    ['acta-cierre', 'Acta de cierre y aceptación final', '4.7', 'integracion', 'cierre', 'acta'],
    ['plan-gestion-alcance', 'Plan de gestión del alcance', '5.1', 'alcance', 'planificacion', 'plan'],
    ['plan-gestion-requisitos', 'Plan de gestión de los requisitos', '5.1', 'alcance', 'planificacion', 'plan'],
    ['documentacion-requisitos', 'Documentación de requisitos', '5.2', 'alcance', 'planificacion', 'registro'],
    ['matriz-trazabilidad', 'Matriz de trazabilidad de requisitos', '5.2', 'alcance', 'planificacion', 'registro'],
    ['enunciado-alcance', 'Enunciado del alcance del proyecto', '5.3', 'alcance', 'planificacion', 'documento'],
    ['acta-aceptacion-entregable', 'Acta de aceptación de entregables', '5.5', 'alcance', 'monitoreo', 'acta', true],
    ['plan-gestion-cronograma', 'Plan de gestión del cronograma', '6.1', 'cronograma', 'planificacion', 'plan'],
    ['estimaciones-duracion', 'Estimaciones de duración (tres valores / PERT)', '6.4', 'cronograma', 'planificacion', 'registro'],
    ['plan-gestion-costos', 'Plan de gestión de los costos', '7.1', 'costos', 'planificacion', 'plan'],
    ['estimacion-costos', 'Estimaciones de costos y base de las estimaciones', '7.2', 'costos', 'planificacion', 'registro'],
    ['requisitos-financiamiento', 'Requisitos de financiamiento del proyecto', '7.3', 'costos', 'planificacion', 'documento'],
    ['plan-gestion-calidad', 'Plan de gestión de la calidad', '8.1', 'calidad', 'planificacion', 'plan'],
    ['metricas-calidad', 'Métricas de calidad', '8.1', 'calidad', 'planificacion', 'registro'],
    ['documentos-prueba', 'Documentos de prueba y evaluación', '8.2', 'calidad', 'ejecucion', 'registro'],
    ['informe-calidad', 'Informe de calidad', '8.2', 'calidad', 'ejecucion', 'informe', true],
    ['mediciones-control-calidad', 'Mediciones de control de calidad', '8.3', 'calidad', 'monitoreo', 'registro'],
    ['plan-gestion-recursos', 'Plan de gestión de los recursos', '9.1', 'recursos', 'planificacion', 'plan'],
    ['acta-constitucion-equipo', 'Acta de constitución del equipo', '9.1', 'recursos', 'planificacion', 'documento'],
    ['requisitos-recursos', 'Requisitos de recursos', '9.2', 'recursos', 'planificacion', 'registro'],
    ['estructura-desglose-recursos', 'Estructura de desglose de recursos (EDR)', '9.2', 'recursos', 'planificacion', 'registro'],
    ['asignaciones-recursos', 'Asignaciones de recursos físicos y del equipo', '9.3', 'recursos', 'ejecucion', 'registro'],
    ['evaluacion-desempeno-equipo', 'Evaluaciones de desempeño del equipo', '9.4', 'recursos', 'ejecucion', 'registro'],
    ['plan-gestion-comunicaciones', 'Plan de gestión de las comunicaciones', '10.1', 'comunicaciones', 'planificacion', 'plan'],
    ['registro-comunicaciones', 'Registro de comunicaciones del proyecto', '10.2', 'comunicaciones', 'ejecucion', 'registro'],
    ['acta-reunion', 'Acta de reunión', '10.2', 'comunicaciones', 'ejecucion', 'acta', true],
    ['plan-gestion-riesgos', 'Plan de gestión de los riesgos', '11.1', 'riesgos', 'planificacion', 'plan'],
    ['registro-riesgos', 'Registro de riesgos', '11.2', 'riesgos', 'planificacion', 'registro'],
    ['informe-riesgos', 'Informe de riesgos', '11.2', 'riesgos', 'planificacion', 'informe'],
    ['analisis-cuantitativo', 'Análisis cuantitativo (valor monetario esperado)', '11.4', 'riesgos', 'planificacion', 'registro'],
    ['plan-gestion-adquisiciones', 'Plan de gestión de las adquisiciones', '12.1', 'adquisiciones', 'planificacion', 'plan'],
    ['estrategia-adquisiciones', 'Estrategia de las adquisiciones', '12.1', 'adquisiciones', 'planificacion', 'documento'],
    ['decisiones-hacer-comprar', 'Análisis de hacer o comprar', '12.1', 'adquisiciones', 'planificacion', 'registro'],
    ['enunciado-trabajo-adquisicion', 'Enunciado del trabajo de la adquisición (SOW)', '12.1', 'adquisiciones', 'planificacion', 'documento', true],
    ['criterios-seleccion-proveedores', 'Criterios de selección y evaluación de ofertas', '12.1', 'adquisiciones', 'planificacion', 'registro'],
    ['registro-adquisiciones', 'Registro de contratos y acuerdos', '12.2', 'adquisiciones', 'ejecucion', 'registro'],
    ['control-adquisiciones', 'Seguimiento de contratos y desempeño de proveedores', '12.3', 'adquisiciones', 'monitoreo', 'registro'],
    ['registro-interesados', 'Registro de interesados', '13.1', 'interesados', 'inicio', 'registro'],
    ['plan-involucramiento-interesados', 'Plan de involucramiento de los interesados', '13.2', 'interesados', 'planificacion', 'plan'],
  ].map(([id, name, process, area, group, kind, multiple]) => ({ id, name, process, area, group, kind, multiple: !!multiple }));

  /* Vistas de la aplicación (SPEC §4) y líneas base */
  const VIEW_LABELS = {
    tablero: 'Tablero del proyecto', procesos: 'Mapa de procesos', documentos: 'Documentos', documento: 'Documento', 'lineas-base': 'Líneas base', ficha: 'Ficha del proyecto',
    edt: 'EDT', cronograma: 'Cronograma (Gantt)', red: 'Diagrama de red', recursos: 'Recursos', 'valor-ganado': 'Curva S y valor ganado',
    raci: 'Matriz RACI', 'riesgos-matriz': 'Probabilidad e impacto', 'interesados-matriz': 'Interesados', calidad: 'Ishikawa y Pareto', flujogramas: 'Diagramas de flujo',
  };
  const BASELINES = { scope: 'Línea base del alcance', schedule: 'Línea base del cronograma', cost: 'Línea base de costos' };

  /* ---------------------------------------------------------------- PMBOK 7: dominios de desempeño y principios */
  const domains = [
    { id: 'interesados', num: 1, name: 'Interesados',
      description: 'Aborda las actividades y funciones asociadas con los interesados: identificarlos, comprenderlos, analizarlos, priorizarlos e involucrarlos de forma productiva a lo largo del proyecto.',
      relatedAreas: ['interesados', 'comunicaciones'] },
    { id: 'equipo', num: 2, name: 'Equipo',
      description: 'Aborda las actividades y funciones asociadas con las personas responsables de producir los entregables del proyecto: liderazgo, cultura del equipo y desarrollo de un equipo de alto desempeño.',
      relatedAreas: ['recursos'] },
    { id: 'enfoque', num: 3, name: 'Enfoque de desarrollo y ciclo de vida',
      description: 'Aborda las actividades y funciones asociadas con el enfoque de desarrollo (predictivo, adaptativo o híbrido), la cadencia de las entregas y las fases del ciclo de vida del proyecto.',
      relatedAreas: ['integracion', 'alcance', 'cronograma'] },
    { id: 'planificacion', num: 4, name: 'Planificación',
      description: 'Aborda las actividades y funciones asociadas con la organización y coordinación iniciales, continuas y en evolución, necesarias para entregar los entregables y los resultados del proyecto.',
      relatedAreas: ['integracion', 'alcance', 'cronograma', 'costos', 'recursos', 'comunicaciones', 'adquisiciones'] },
    { id: 'trabajo', num: 5, name: 'Trabajo del proyecto',
      description: 'Aborda las actividades y funciones asociadas con el establecimiento de los procesos del proyecto, la gestión de los recursos físicos y de las adquisiciones, y la promoción de un ambiente de aprendizaje.',
      relatedAreas: ['integracion', 'recursos', 'comunicaciones', 'adquisiciones'] },
    { id: 'entrega', num: 6, name: 'Entrega',
      description: 'Aborda las actividades y funciones asociadas con la entrega del alcance y la calidad que el proyecto se propuso lograr, para producir los beneficios y el valor esperados.',
      relatedAreas: ['alcance', 'calidad', 'integracion'] },
    { id: 'medicion', num: 7, name: 'Medición',
      description: 'Aborda las actividades y funciones asociadas con la evaluación del desempeño del proyecto y la adopción de las acciones adecuadas para mantener un desempeño aceptable.',
      relatedAreas: ['integracion', 'cronograma', 'costos', 'calidad'] },
    { id: 'incertidumbre', num: 8, name: 'Incertidumbre',
      description: 'Aborda las actividades y funciones asociadas con el riesgo y la incertidumbre, incluidas la ambigüedad, la complejidad y la volatilidad, tanto en amenazas como en oportunidades.',
      relatedAreas: ['riesgos'] },
  ];

  const principles = [
    { num: 1, name: 'Ser un administrador diligente, respetuoso y cuidadoso', description: 'Actuar con integridad, cuidado, confiabilidad y cumplimiento, considerando los impactos financieros, sociales y ambientales del proyecto.' },
    { num: 2, name: 'Crear un entorno colaborativo del equipo del proyecto', description: 'Los equipos rinden más cuando trabajan con acuerdos, estructuras y procesos claros, y con responsabilidades compartidas.' },
    { num: 3, name: 'Involucrarse eficazmente con los interesados', description: 'Involucrar a los interesados de manera proactiva y en la medida necesaria para contribuir al éxito del proyecto y a su satisfacción.' },
    { num: 4, name: 'Enfocarse en el valor', description: 'Evaluar y ajustar continuamente la alineación del proyecto con los objetivos de negocio y con los beneficios y el valor previstos.' },
    { num: 5, name: 'Reconocer, evaluar y responder a las interacciones del sistema', description: 'Ver el proyecto como un sistema de componentes interdependientes y responder a sus interacciones internas y externas.' },
    { num: 6, name: 'Demostrar comportamientos de liderazgo', description: 'Adaptar el estilo de liderazgo a cada situación para motivar, influir, orientar y aprender, sin importar el cargo.' },
    { num: 7, name: 'Adaptar en función del contexto', description: 'Diseñar el enfoque de desarrollo según el contexto, los objetivos, los interesados, la gobernanza y el entorno del proyecto: lo suficiente, sin excesos.' },
    { num: 8, name: 'Incorporar la calidad en los procesos y los entregables', description: 'Mantener el foco en la calidad para producir entregables que cumplan los objetivos del proyecto y las necesidades de los interesados.' },
    { num: 9, name: 'Navegar en la complejidad', description: 'Evaluar y navegar de manera continua la complejidad del proyecto para que los enfoques y los planes permitan avanzar con éxito.' },
    { num: 10, name: 'Optimizar las respuestas a los riesgos', description: 'Evaluar continuamente la exposición al riesgo, tanto oportunidades como amenazas, para maximizar los impactos positivos y minimizar los negativos.' },
    { num: 11, name: 'Adoptar la adaptabilidad y la resiliencia', description: 'Incorporar adaptabilidad y resiliencia en los enfoques de la organización y del equipo para absorber el cambio y recuperarse de los contratiempos.' },
    { num: 12, name: 'Permitir el cambio para lograr el estado futuro previsto', description: 'Preparar a las personas afectadas para adoptar y sostener el cambio, de modo que se pase del estado actual al estado futuro previsto.' },
  ];

  /* ---------------------------------------------------------------- glosario */
  const glossary = [
    /* Alcance */
    { term: 'Estructura de desglose del trabajo', abbr: 'EDT/WBS', area: 'alcance', view: 'edt',
      definition: 'Descomposición jerárquica del alcance total del trabajo que debe realizar el equipo del proyecto para cumplir con los objetivos y crear los entregables requeridos. Cada nivel descendente define el trabajo con más detalle y se aplica la regla del 100 %: cada nivel contiene todo el trabajo de sus componentes inferiores.' },
    { term: 'Paquete de trabajo', area: 'alcance', view: 'edt',
      definition: 'Trabajo definido en el nivel más bajo de la EDT/WBS para el cual se estiman y gestionan el costo y la duración. En el proceso Definir las Actividades se descompone en actividades del cronograma.' },
    { term: 'Cuenta de control', area: 'alcance', view: 'edt',
      definition: 'Punto de control de gestión donde se integran el alcance, el presupuesto, el costo real y el cronograma, y se comparan con el valor ganado para medir el desempeño. Puede incluir uno o más paquetes de trabajo, y cada paquete de trabajo pertenece a una sola cuenta de control.' },
    { term: 'Diccionario de la EDT/WBS', area: 'alcance', view: 'edt',
      definition: 'Documento que proporciona información detallada sobre los entregables, las actividades y la programación de cada componente de la EDT/WBS: descripción del trabajo, responsable, criterios de aceptación, hitos, recursos y estimaciones de costo.' },
    { term: 'Enunciado del alcance del proyecto', area: 'alcance',
      definition: 'Descripción del alcance del proyecto, de los entregables principales, de los supuestos, de las restricciones y de las exclusiones. Junto con la EDT/WBS y su diccionario forma la línea base del alcance.' },
    { term: 'Entregable', area: 'alcance',
      definition: 'Cualquier producto, resultado o capacidad único y verificable para ejecutar un servicio, que se produce para completar un proceso, una fase o un proyecto.' },
    /* Integración */
    { term: 'Acta de constitución del proyecto', area: 'integracion',
      definition: 'Documento emitido por el iniciador o patrocinador del proyecto que autoriza formalmente su existencia y confiere al director del proyecto la autoridad para aplicar los recursos de la organización a las actividades del proyecto.' },
    { term: 'Plan para la dirección del proyecto', area: 'integracion',
      definition: 'Documento que describe el modo en que el proyecto será ejecutado, monitoreado y controlado, y cerrado. Integra los planes de gestión subsidiarios, las líneas base y otros componentes adicionales.' },
    { term: 'Línea base', area: 'integracion', view: 'lineas-base',
      definition: 'Versión aprobada de un producto de trabajo que solo puede cambiarse mediante procedimientos formales de control de cambios y que se usa como base de comparación con los resultados reales. En el proyecto se establecen las líneas base del alcance, del cronograma y de costos.' },
    { term: 'Línea base del alcance', area: 'alcance', view: 'lineas-base',
      definition: 'Versión aprobada del enunciado del alcance, de la EDT/WBS y de su diccionario, que solo puede cambiarse mediante procedimientos formales de control de cambios.',
      formula: 'Línea base del alcance = enunciado del alcance + EDT/WBS + diccionario de la EDT/WBS' },
    { term: 'Línea base del cronograma', area: 'cronograma', view: 'lineas-base',
      definition: 'Versión aprobada del modelo de programación, con fechas de inicio y finalización de línea base, que solo puede cambiarse mediante procedimientos formales de control de cambios y se usa para compararla con los resultados reales.' },
    { term: 'Línea base de costos', area: 'costos', view: 'valor-ganado',
      definition: 'Versión aprobada del presupuesto del proyecto distribuido en el tiempo, sin incluir la reserva de gestión, que solo puede cambiarse mediante procedimientos formales de control de cambios. Se representa como una curva S.',
      formula: 'Línea base de costos = estimaciones de costos de los paquetes de trabajo + reserva para contingencias' },
    { term: 'Línea base para la medición del desempeño', abbr: 'PMB', area: 'integracion', view: 'lineas-base',
      definition: 'Líneas base del alcance, del cronograma y de costos integradas, que se usan como referencia para gestionar, medir y controlar la ejecución del proyecto y para el análisis del valor ganado.' },
    { term: 'Datos, información e informes de desempeño del trabajo', area: 'integracion', view: 'tablero',
      definition: 'Los datos son las observaciones y mediciones en bruto recopiladas durante la ejecución; la información son esos datos analizados en contexto frente a la línea base; los informes son la representación de esa información para comunicarla y tomar decisiones.' },
    { term: 'Solicitud de cambio', area: 'integracion',
      definition: 'Propuesta formal para modificar un documento, un entregable o una línea base. Puede ser una acción correctiva, una acción preventiva, una reparación de defecto o una actualización.' },
    { term: 'Comité de control de cambios', abbr: 'CCB', area: 'integracion',
      definition: 'Grupo formalmente constituido, responsable de revisar, evaluar, aprobar, aplazar o rechazar los cambios en el proyecto, y de registrar y comunicar dichas decisiones.' },
    { term: 'Control integrado de cambios', area: 'integracion', view: 'lineas-base',
      definition: 'Proceso de revisar todas las solicitudes de cambio; aprobar y gestionar los cambios a entregables, documentos del proyecto, activos de los procesos de la organización y plan para la dirección del proyecto; y comunicar las decisiones. Toda modificación de una línea base pasa por este proceso.' },
    { term: 'Incidente', area: 'integracion',
      definition: 'Condición o situación actual que puede tener un impacto en los objetivos del proyecto. A diferencia del riesgo, el incidente ya está ocurriendo y se gestiona en el registro de incidentes.' },
    { term: 'Lecciones aprendidas', area: 'integracion',
      definition: 'Conocimiento adquirido durante un proyecto que muestra cómo se abordaron, o cómo deberían abordarse en el futuro, los eventos del proyecto, con el fin de mejorar el desempeño futuro.' },
    /* Cronograma */
    { term: 'Hito', area: 'cronograma', view: 'cronograma',
      definition: 'Punto o evento significativo dentro del proyecto. Tiene duración cero y marca la finalización de entregables o fases, o compromisos contractuales.' },
    { term: 'Diagrama de Gantt', area: 'cronograma', view: 'cronograma',
      definition: 'Diagrama de barras con información del cronograma: las actividades se listan en el eje vertical, las fechas en el eje horizontal y las duraciones se representan como barras horizontales ubicadas según sus fechas de inicio y finalización.' },
    { term: 'Diagrama de red del cronograma', area: 'cronograma', view: 'red',
      definition: 'Representación gráfica de las relaciones lógicas, también llamadas dependencias, entre las actividades del cronograma del proyecto.' },
    { term: 'Método de diagramación por precedencia', abbr: 'PDM', area: 'cronograma', view: 'red',
      definition: 'Técnica para construir un modelo de programación en el que las actividades se representan con nodos y se vinculan mediante una o más relaciones lógicas que indican la secuencia en que deben ejecutarse.' },
    { term: 'Relación final a inicio', abbr: 'FS · FC', area: 'cronograma', view: 'red',
      definition: 'Relación lógica en la cual una actividad sucesora no puede comenzar hasta que haya finalizado una actividad predecesora. Es la relación más común; en la notación de las herramientas en español se escribe FC (fin a comienzo).' },
    { term: 'Relación inicio a inicio', abbr: 'SS · CC', area: 'cronograma', view: 'red',
      definition: 'Relación lógica en la cual una actividad sucesora no puede comenzar hasta que haya comenzado una actividad predecesora. En la notación en español se escribe CC (comienzo a comienzo).' },
    { term: 'Relación final a final', abbr: 'FF', area: 'cronograma', view: 'red',
      definition: 'Relación lógica en la cual una actividad sucesora no puede finalizar hasta que haya finalizado una actividad predecesora. En la notación en español también se escribe FF (fin a fin).' },
    { term: 'Relación inicio a final', abbr: 'SF · CF', area: 'cronograma', view: 'red',
      definition: 'Relación lógica en la cual una actividad sucesora no puede finalizar hasta que haya comenzado una actividad predecesora. Es la relación menos usada; en la notación en español se escribe CF (comienzo a fin).' },
    { term: 'Adelanto', area: 'cronograma', view: 'red',
      definition: 'Cantidad de tiempo en que una actividad sucesora se puede anticipar con respecto a una actividad predecesora. Se registra como un retraso negativo; por ejemplo, FS − 3 días indica que la sucesora empieza 3 días antes de que termine la predecesora.' },
    { term: 'Retraso', area: 'cronograma', view: 'red',
      definition: 'Cantidad de tiempo en que una actividad sucesora se retrasa con respecto a una actividad predecesora; por ejemplo, FS + 2 días indica que la sucesora empieza 2 días después de que termine la predecesora.' },
    { term: 'Ruta crítica', area: 'cronograma', view: 'cronograma',
      definition: 'Secuencia de actividades que representa el camino más largo a través del proyecto y determina la menor duración posible. Normalmente sus actividades tienen holgura total cero: un retraso en cualquiera de ellas retrasa la finalización del proyecto.' },
    { term: 'Método de la ruta crítica', abbr: 'CPM', area: 'cronograma', view: 'red',
      definition: 'Método utilizado para estimar la duración mínima del proyecto y determinar el nivel de flexibilidad en la programación de las rutas de red lógicas. Calcula las fechas de inicio y finalización tempranas con un recorrido hacia adelante y las tardías con un recorrido hacia atrás.',
      formula: 'Recorrido hacia adelante: EF = ES + duración · Recorrido hacia atrás: LS = LF − duración (convención de inicio en el día 0)' },
    { term: 'Holgura total', area: 'cronograma', view: 'red',
      definition: 'Cantidad de tiempo que una actividad puede retrasarse o extenderse respecto de su fecha de inicio temprana sin retrasar la fecha de finalización del proyecto ni violar una restricción del cronograma.',
      formula: 'Holgura total = LS − ES = LF − EF' },
    { term: 'Holgura libre', area: 'cronograma', view: 'red',
      definition: 'Cantidad de tiempo que una actividad puede retrasarse sin retrasar la fecha de inicio temprana de ninguna sucesora ni violar una restricción del cronograma.',
      formula: 'Holgura libre = mín. (ES de las sucesoras) − EF de la actividad (relaciones FS sin retraso, convención de inicio en el día 0)' },
    { term: 'Estimación por tres valores', abbr: 'PERT', area: 'cronograma',
      definition: 'Técnica para estimar duraciones o costos cuando hay incertidumbre, promediando las estimaciones optimista (tO), más probable (tM) y pesimista (tP). La distribución beta (PERT) da más peso al valor más probable; la triangular los pondera por igual.',
      formula: 'Beta (PERT): tE = (tO + 4·tM + tP) / 6 · Triangular: tE = (tO + tM + tP) / 3 · Desviación estándar (beta): σ = (tP − tO) / 6' },
    { term: 'Estimación análoga', area: 'cronograma',
      definition: 'Técnica para estimar la duración o el costo de una actividad o proyecto con datos históricos de una actividad o proyecto similar. Es rápida y económica, pero menos exacta.' },
    { term: 'Estimación paramétrica', area: 'cronograma',
      definition: 'Técnica que usa una relación estadística entre datos históricos y otras variables para calcular la duración o el costo; por ejemplo, metros cuadrados de andamio montados por cuadrilla por día.',
      formula: 'Duración = cantidad de trabajo ÷ rendimiento · Costo = cantidad × costo unitario' },
    { term: 'Estimación ascendente', area: 'costos',
      definition: 'Método para estimar la duración o el costo del proyecto sumando las estimaciones de los componentes de nivel inferior de la EDT/WBS.' },
    { term: 'Compresión del cronograma', area: 'cronograma', view: 'cronograma',
      definition: 'Técnicas para acortar la duración del cronograma sin reducir el alcance del proyecto. Incluye la intensificación y la ejecución rápida.' },
    { term: 'Intensificación', area: 'cronograma', view: 'cronograma',
      definition: 'Técnica de compresión del cronograma que acorta la duración con el menor incremento de costo, agregando recursos a las actividades de la ruta crítica: horas extra, recursos adicionales o pago por entrega acelerada. Solo funciona en actividades cuya duración se reduce al agregar recursos.' },
    { term: 'Ejecución rápida', area: 'cronograma', view: 'cronograma',
      definition: 'Técnica de compresión del cronograma en la que actividades o fases que normalmente se realizan en secuencia se llevan a cabo en paralelo, al menos durante una parte de su duración. Puede aumentar el riesgo y el retrabajo.' },
    { term: 'Nivelación de recursos', area: 'recursos', view: 'recursos',
      definition: 'Técnica de optimización de recursos en la que las fechas de inicio y finalización se ajustan según las restricciones de recursos para equilibrar la demanda con la oferta disponible. Puede modificar la ruta crítica y alargar el proyecto.' },
    { term: 'Equilibrio de recursos', area: 'recursos', view: 'recursos',
      definition: 'Técnica de optimización de recursos que ajusta las actividades dentro de su holgura libre y total para que la demanda de recursos no supere ciertos límites. No modifica la ruta crítica ni la fecha de finalización.' },
    /* Costos y valor ganado */
    { term: 'Presupuesto hasta la conclusión', abbr: 'BAC', area: 'costos', view: 'valor-ganado',
      definition: 'Suma de todos los presupuestos establecidos para el trabajo que se va a realizar. Equivale al valor planificado total del proyecto.',
      formula: 'BAC = Σ presupuestos de las actividades o paquetes de trabajo' },
    { term: 'Valor planificado', abbr: 'PV', area: 'costos', view: 'valor-ganado',
      definition: 'Presupuesto autorizado que se ha asignado al trabajo programado hasta una fecha determinada.',
      formula: 'PV = Σ (presupuesto de cada actividad × % planificado a la fecha de corte)' },
    { term: 'Valor ganado', abbr: 'EV', area: 'costos', view: 'valor-ganado',
      definition: 'Medida del trabajo realizado, expresada en términos del presupuesto autorizado para dicho trabajo.',
      formula: 'EV = Σ (presupuesto de cada actividad × % completado)' },
    { term: 'Costo real', abbr: 'AC', area: 'costos', view: 'valor-ganado',
      definition: 'Costo incurrido por el trabajo llevado a cabo en una actividad durante un período de tiempo específico.',
      formula: 'AC = Σ costos reales registrados hasta la fecha de corte' },
    { term: 'Variación del cronograma', abbr: 'SV', area: 'costos', view: 'valor-ganado',
      definition: 'Medida del desempeño del cronograma expresada como la diferencia entre el valor ganado y el valor planificado. Si es negativa, el proyecto está atrasado; si es positiva, adelantado.',
      formula: 'SV = EV − PV' },
    { term: 'Variación del costo', abbr: 'CV', area: 'costos', view: 'valor-ganado',
      definition: 'Monto del déficit o superávit presupuestario en un momento dado. Si es negativa hay sobrecosto; si es positiva, el trabajo ha costado menos de lo presupuestado.',
      formula: 'CV = EV − AC' },
    { term: 'Índice de desempeño del cronograma', abbr: 'SPI', area: 'costos', view: 'valor-ganado',
      definition: 'Medida de la eficiencia del cronograma. Un SPI menor que 1 indica que se ha completado menos trabajo del planificado; mayor que 1, más trabajo del planificado.',
      formula: 'SPI = EV / PV' },
    { term: 'Índice de desempeño del costo', abbr: 'CPI', area: 'costos', view: 'valor-ganado',
      definition: 'Medida de la eficiencia en costos de los recursos presupuestados. Un CPI menor que 1 indica sobrecosto; mayor que 1, que el trabajo cuesta menos de lo planificado. Es el índice más importante del valor ganado.',
      formula: 'CPI = EV / AC' },
    { term: 'Estimación a la conclusión', abbr: 'EAC', area: 'costos', view: 'valor-ganado',
      definition: 'Costo total previsto para completar todo el trabajo, igual al costo real a la fecha más la estimación hasta la conclusión. La fórmula depende del supuesto sobre el desempeño futuro.',
      formula: 'EAC = BAC / CPI (desempeño típico) · EAC = AC + (BAC − EV) (variación atípica) · EAC = AC + (BAC − EV) / (CPI × SPI) (considera costo y cronograma) · EAC = AC + ETC ascendente' },
    { term: 'Estimación hasta la conclusión', abbr: 'ETC', area: 'costos', view: 'valor-ganado',
      definition: 'Costo previsto para terminar todo el trabajo restante del proyecto.',
      formula: 'ETC = EAC − AC' },
    { term: 'Variación a la conclusión', abbr: 'VAC', area: 'costos', view: 'valor-ganado',
      definition: 'Proyección del monto del déficit o superávit presupuestario al final del proyecto.',
      formula: 'VAC = BAC − EAC' },
    { term: 'Índice de desempeño del trabajo por completar', abbr: 'TCPI', area: 'costos', view: 'valor-ganado',
      definition: 'Desempeño del costo que debe lograrse con los recursos restantes para cumplir una meta de gestión. Un TCPI mayor que 1 significa que el trabajo restante debe hacerse con más eficiencia que la planificada.',
      formula: 'TCPI = (BAC − EV) / (BAC − AC) · con EAC aprobado: TCPI = (BAC − EV) / (EAC − AC)' },
    { term: 'Cronograma ganado', abbr: 'ES · SPI(t)', area: 'cronograma', view: 'valor-ganado',
      definition: 'Extensión del valor ganado que mide el desempeño del cronograma en unidades de tiempo. El cronograma ganado (ES) es el momento en que el valor planificado igualaba el valor ganado actual, y se compara con el tiempo real transcurrido (AT).',
      formula: 'SV(t) = ES − AT · SPI(t) = ES / AT · Duración pronosticada ≈ duración planificada / SPI(t)' },
    { term: 'Curva S', area: 'costos', view: 'valor-ganado',
      definition: 'Representación gráfica de los costos acumulados (PV, EV y AC) a lo largo del tiempo. Toma forma de S porque el gasto es lento al inicio, se acelera durante la ejecución y se desacelera al cierre.' },
    { term: 'Reserva para contingencias', area: 'costos', view: 'valor-ganado',
      definition: 'Tiempo o dinero asignado en la línea base del cronograma o de costos para riesgos identificados y aceptados, las «incógnitas conocidas». Forma parte de la línea base de costos y la administra el director del proyecto.' },
    { term: 'Reserva de gestión', area: 'costos', view: 'valor-ganado',
      definition: 'Monto del presupuesto o del cronograma retenido fuera de la línea base para fines de control de gestión y reservado para trabajo imprevisto dentro del alcance, las «incógnitas desconocidas». No forma parte de la línea base de costos; usarla requiere un cambio aprobado.',
      formula: 'Presupuesto del proyecto = línea base de costos + reserva de gestión' },
    /* Calidad */
    { term: 'Costo de la calidad', abbr: 'COQ', area: 'calidad',
      definition: 'Todos los costos incurridos durante la vida del producto por la inversión en prevenir el incumplimiento de los requisitos, evaluar la conformidad y no cumplir los requisitos (retrabajo, desperdicio, garantías).',
      formula: 'COQ = costo de la conformidad (prevención + evaluación) + costo de la no conformidad (fallas internas + fallas externas)' },
    { term: 'Análisis de Pareto', area: 'calidad', view: 'calidad',
      definition: 'Histograma ordenado por frecuencia que muestra cuántos defectos genera cada causa identificada. Ayuda a concentrar las acciones correctivas en las pocas causas que originan la mayoría de los problemas (regla 80/20).',
      formula: '% acumulado de la causa i = Σ frecuencias hasta la causa i / total de ocurrencias' },
    { term: 'Diagrama de Ishikawa', area: 'calidad', view: 'calidad',
      definition: 'Diagrama de causa y efecto, también llamado de espina de pescado, que descompone un efecto no deseado en sus posibles causas agrupadas por categorías (por ejemplo: método, mano de obra, materiales, maquinaria, medición y medio ambiente) para llegar a la causa raíz.' },
    { term: 'Gráfico de control', area: 'calidad',
      definition: 'Representación gráfica de los datos de un proceso a lo largo del tiempo, comparados con límites de control establecidos y con una línea central. Permite determinar si el proceso es estable; por ejemplo, siete puntos consecutivos del mismo lado de la media indican una causa especial.',
      formula: 'Límites de control = media ± 3σ' },
    /* Recursos */
    { term: 'Matriz RACI', area: 'recursos', view: 'raci',
      definition: 'Matriz de asignación de responsabilidades que relaciona actividades o entregables con roles mediante cuatro estados: R (responsable de ejecutar), A (persona que rinde cuentas y aprueba), C (consultado) e I (informado). Cada actividad debe tener una sola A.' },
    { term: 'Estructura de desglose de recursos', abbr: 'EDR/RBS', area: 'recursos',
      definition: 'Representación jerárquica de los recursos del proyecto por categoría y tipo: mano de obra, equipos, materiales y suministros.' },
    /* Riesgos */
    { term: 'Riesgo', area: 'riesgos', view: 'riesgos-matriz',
      definition: 'Evento o condición incierta que, si se produce, tiene un efecto positivo (oportunidad) o negativo (amenaza) en uno o más de los objetivos del proyecto.' },
    { term: 'Matriz de probabilidad e impacto', area: 'riesgos', view: 'riesgos-matriz',
      definition: 'Cuadrícula que relaciona la probabilidad de ocurrencia de cada riesgo con su impacto sobre los objetivos del proyecto en caso de que ocurra, para clasificarlo y priorizarlo.',
      formula: 'Puntuación = probabilidad × impacto (escala 1–5): 1–4 bajo, 5–9 medio, 10–19 alto, 20–25 muy alto' },
    { term: 'Valor monetario esperado', abbr: 'EMV', area: 'riesgos',
      definition: 'Concepto estadístico que calcula el resultado promedio cuando el futuro incluye escenarios que pueden ocurrir o no. Se usa en el análisis cuantitativo y en los árboles de decisión, por ejemplo para dimensionar la reserva para contingencias.',
      formula: 'EMV = Σ (probabilidad × impacto monetario); amenazas con signo negativo y oportunidades con signo positivo' },
    /* Interesados */
    { term: 'Interesado', area: 'interesados', view: 'interesados-matriz',
      definition: 'Individuo, grupo u organización que puede afectar, verse afectado, o percibirse a sí mismo como afectado por una decisión, actividad o resultado del proyecto.' },
    { term: 'Matriz de evaluación del involucramiento de los interesados', area: 'interesados', view: 'interesados-matriz',
      definition: 'Matriz que compara el nivel de involucramiento actual (C) y deseado (D) de cada interesado en cinco niveles: desconocedor, reticente, neutral, partidario y líder. Las brechas indican dónde se requieren acciones de comunicación e involucramiento.' },
  ];

  /* ---------------------------------------------------------------- índices */
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const procByCode = new Map(processes.map((p) => [p.code, p]));
  const docById = new Map(docs.map((d) => [d.id, d]));

  const roleOf = (p, docId) => {
    const outs = p.outputs.filter((o) => o.doc === docId);
    return { output: outs.some((o) => !o.update), update: outs.some((o) => o.update), input: p.inputsDocs.includes(docId) };
  };

  const KB = {
    edition: '6.ª edición',
    source: 'Guía de los Fundamentos para la Dirección de Proyectos (Guía del PMBOK®), 6.ª edición. Dominios y principios: 7.ª edición.',
    areas, groups, processes, domains, principles, glossary, docs,
    FREQUENCY, VIEW_LABELS, BASELINES,
    compareCodes,

    area: (id) => areaById.get(id) || null,
    group: (id) => groupById.get(id) || null,
    process: (code) => procByCode.get(String(code)) || null,
    /* Procesos filtrados por área y/o grupo (cualquiera puede omitirse), en orden numérico de código. */
    processesBy(areaId, groupId) {
      return processes.filter((p) => (!areaId || p.area === areaId) && (!groupId || p.group === groupId)).sort((a, b) => compareCodes(a.code, b.code));
    },
    /* Matriz áreas × grupos: [{area, cells:[{group, processes}]}] */
    matrix() {
      return areas.map((a) => ({ area: a, cells: groups.map((g) => ({ group: g, processes: KB.processesBy(a.id, g.id) })) }));
    },
    /* Procesos que listan el documento como salida o entrada.
       role: 'output' (lo crea) | 'update' (lo actualiza) | 'produces' (crea o actualiza) | 'input' | 'all' (por defecto). */
    processesForDoc(docId, role) {
      return processes.filter((p) => {
        const r = roleOf(p, docId);
        if (!role || role === 'all') return r.output || r.update || r.input;
        if (role === 'produces') return r.output || r.update;
        return !!r[role];
      });
    },
    /* Roles del documento en cada proceso: [{code, process, roles:['output'|'update'|'input']}] */
    docRoles(docId) {
      const out = [];
      for (const p of processes) { const r = roleOf(p, docId); const roles = ['output', 'update', 'input'].filter((k) => r[k]); if (roles.length) out.push({ code: p.code, process: p, roles }); }
      return out;
    },
    /* Procesos cuya salida o herramienta de apoyo es la vista indicada. */
    processesForView(viewId) {
      return processes.filter((p) => p.outputs.some((o) => o.view === viewId) || p.toolViews.includes(viewId));
    },
    outputsOf: (code) => { const p = procByCode.get(String(code)); return p ? p.outputs.slice() : []; },
    /* Todos los ids de documentos canónicos referenciados (salidas y entradas), en orden de primera aparición. */
    docIds() {
      const seen = new Set();
      for (const p of processes) { for (const o of p.outputs) if (o.doc) seen.add(o.doc); for (const d of p.inputsDocs) seen.add(d); }
      return [...seen];
    },
    viewIds() {
      const seen = new Set();
      for (const p of processes) { for (const o of p.outputs) if (o.view) seen.add(o.view); for (const v of p.toolViews) seen.add(v); }
      for (const g of glossary) if (g.view) seen.add(g.view);
      return [...seen];
    },
    doc: (id) => docById.get(id) || null,
    /* Nombre visible de un documento: plantilla registrada o catálogo canónico. */
    docName(id) { const t = PM && PM.templates && PM.templates[id]; return (t && t.name) || (docById.get(id) || {}).name || id; },
    viewLabel(id) { const v = PM && PM.getView ? PM.getView(id) : null; return (v && v.label) || VIEW_LABELS[id] || id; },
    /* Texto visible de una salida (Output). */
    outputLabel(o) {
      if (!o) return '';
      if (o.label) return o.label;
      if (o.doc) return KB.docName(o.doc);
      if (o.baseline) return BASELINES[o.baseline] || o.baseline;
      if (o.view) return KB.viewLabel(o.view);
      return o.text || '';
    },
    processLabel(code) { const p = procByCode.get(String(code)); return p ? p.code + ' ' + p.name : String(code || ''); },
    /* Glosario: búsqueda por término, sigla o definición (sin distinguir tildes ni mayúsculas). */
    term(q) {
      const n = norm(q).trim(); if (!n) return null;
      return glossary.find((g) => norm(g.term) === n) || glossary.find((g) => g.abbr && norm(g.abbr).split(/\s*[·/]\s*/).includes(n)) || null;
    },
    searchGlossary(q) {
      const n = norm(q).trim(); if (!n) return glossary.slice();
      const score = (g) => (norm(g.term).startsWith(n) ? 0 : norm(g.term).includes(n) ? 1 : g.abbr && norm(g.abbr).includes(n) ? 2 : norm(g.definition).includes(n) || (g.formula && norm(g.formula).includes(n)) ? 3 : 9);
      return glossary.map((g) => [score(g), g]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || a[1].term.localeCompare(b[1].term, 'es')).map(([, g]) => g);
    },
  };

  /* Los datos son de solo lectura: se congelan los elementos (los arreglos de nivel superior quedan libres). */
  for (const list of [areas, groups, processes, domains, principles, glossary, docs]) list.forEach(freeze);
  freeze(FREQUENCY); freeze(VIEW_LABELS); freeze(BASELINES);

  PM.KB = KB;
})();

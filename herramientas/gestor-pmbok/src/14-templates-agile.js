/* ==========================================================================
   14-templates-agile.js — plantillas de la capa ágil (Scrum y Kanban) y del
   enfoque híbrido: visión del producto, definición de listo y de terminado,
   plan de releases, planificación, revisión y retrospectiva de la iteración.
   Contrato: SPEC.md §5 (estructura de plantillas) y §9.5 (ids, procesos y
   claves fijas que leen o prellenan las vistas ágiles de 45/46).
   Referencias: Guía de Scrum 2020, Guía de prácticas ágiles (PMI y Agile
   Alliance), Guía del PMBOK® 6.ª ed. (consideraciones para entornos ágiles/
   adaptativos) y 7.ª ed. (enfoques de desarrollo y ciclo de vida).
   Los ejemplos describen el proyecto ficticio «EJEMPLO · Implementación del
   ERP de Ingeniería y Alquiler» (SPEC §9.7): Scrum con tablero Kanban,
   iteraciones de dos semanas, estimación en puntos de historia y tres
   releases (inventario y alquiler; facturación electrónica y cartera;
   mantenimiento y tablero gerencial). Se usan roles, no nombres de personas.
   Las plantillas llevan `agile: true` y `exampleProject: 'erp'` para que los
   constructores de ejemplos y las listas puedan distinguirlas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.registerTemplates) return;

  /* ================================================================== constructores de campos */
  const field = (type, base) => (key, label, extra) => Object.assign({ key, label, type }, base || {}, extra || {});
  const text = field('text');
  const area = field('textarea', { rows: 3 });
  const number = field('number');
  const date = field('date');
  const list = field('list');
  const select = (key, label, options, extra) => Object.assign({ key, label, type: 'select', options }, extra || {});
  const table = (key, label, columns, extra) => Object.assign({ key, label, type: 'table', columns }, extra || {});
  const section = (id, title, fields, description) => (description ? { id, title, description, fields } : { id, title, fields });

  /* columnas de tabla */
  const col = (key, label, type, extra) => Object.assign({ key, label, type }, extra || {});
  const cText = (key, label, extra) => col(key, label, 'text', Object.assign({ width: 160 }, extra));
  const cCode = (key, label, extra) => col(key, label, 'text', Object.assign({ width: 90 }, extra));
  const cArea = (key, label, extra) => col(key, label, 'textarea', Object.assign({ width: 240 }, extra));
  const cNum = (key, label, extra) => col(key, label, 'number', Object.assign({ width: 96 }, extra));
  const cMoney = (key, label, extra) => col(key, label, 'money', Object.assign({ width: 140 }, extra));
  const cDate = (key, label, extra) => col(key, label, 'date', Object.assign({ width: 130 }, extra));
  const cSelect = (key, label, options, extra) => col(key, label, 'select', Object.assign({ options, width: 150 }, extra));
  const cCalc = (key, label, calc, format, extra) => col(key, label, 'calc', Object.assign({ calc, format }, extra));

  /* ================================================================== opciones (SPEC §9.5) */
  const ITEM_TYPE_LABELS = ((PM.AGILE && PM.AGILE.ITEM_TYPES) || [
    { label: 'Épica' }, { label: 'Historia de usuario' }, { label: 'Tarea' }, { label: 'Defecto' }, { label: 'Mejora' }, { label: 'Investigación (spike)' },
  ]).map((t) => t.label);
  const OBJETIVO_CUMPLIDO = ['Sí', 'Parcialmente', 'No'];
  const RESULTADO_REVISION = ['Aceptado', 'Rechazado', 'No terminado'];
  const FORMATO_RETRO = ['Bien, mejorar y acciones', 'Empezar, dejar y continuar', '4L'];
  const ESTADO_ACCION = ['Pendiente', 'En curso', 'Hecha'];
  const IMPACTO_LECCION = ['Positivo', 'Negativo'];
  const UNIDAD_ESTIMACION = ['Puntos de historia', 'Horas'];
  const CATEGORIA_COLUMNA = ['Por hacer', 'En curso', 'Terminado'];

  /* ================================================================== cálculos de columnas (puros, toleran vacíos) */
  const val = (v) => {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
    const x = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(x) ? x : null;
  };
  const round = (x, d) => { const f = Math.pow(10, d); return Math.round(x * f) / f; };
  /* Puntos (u horas) por iteración de un release: alcance ÷ iteraciones. */
  const calcPorIteracion = (row) => { const p = val(row && row.puntos), n = val(row && row.iteraciones); return p === null || n === null || n <= 0 ? null : round(p / n, 1); };
  /* Costo por punto del release: presupuesto ÷ alcance (referencia para el valor ganado ágil). */
  const calcCostoPunto = (row) => { const b = val(row && row.presupuesto), p = val(row && row.puntos); return b === null || p === null || p <= 0 ? null : Math.round(b / p); };
  const fmtNum1 = (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.num(v, 1));
  const fmtMoney = (v, row, ctx) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.money(v, (ctx && ctx.currency) || (PM.currentCurrency ? PM.currentCurrency() : 'COP')));

  /* ================================================================== proyecto de ejemplo (SPEC §9.7) */
  const ERP = {
    producto: 'EJEMPLO · ERP de Ingeniería y Alquiler',
    po: 'Dueño del producto (Dirección administrativa y financiera)',
    r1: 'Release 1: inventario y alquiler de equipos',
    r2: 'Release 2: facturación electrónica y cartera',
    r3: 'Release 3: mantenimiento y tablero gerencial',
    it6: 'Iteración 6',
    objetivoIt6: 'Emitir la factura electrónica mensual de alquiler validada por la DIAN en el ambiente de habilitación, a partir de las actas de entrega y devolución del release 1.',
  };

  const templates = [
    /* ================================================================== 5.2 · VISIÓN DEL PRODUCTO */
    {
      id: 'vision-producto',
      name: 'Visión del producto',
      abbr: 'VIS',
      area: 'alcance', group: 'inicio', process: '5.2', processes: ['5.2'],
      kind: 'documento', multiple: false, agile: true, exampleProject: 'erp',
      purpose: 'Describe para quién es el producto, qué necesidad resuelve y en qué se diferencia, junto con los objetivos de negocio y las métricas que dirán si vale la pena. Es la referencia del dueño del producto para priorizar el backlog mientras el alcance detallado todavía se descubre.',
      tips: [
        'Escríbela en una página: si no cabe, todavía no hay acuerdo sobre el producto. El detalle va en el backlog, no aquí.',
        'Mide resultados, no entregables: «facturar el alquiler el mismo día del corte» dice más que «implementar el módulo de facturación».',
        'Revísala con el patrocinador al cerrar cada release; si cambian la necesidad o los usuarios objetivo, ajusta primero la visión y después el orden del backlog.',
        'Las restricciones no negociables (normativa, fechas legales, integraciones obligatorias) se vuelven elementos «Debe tener» del backlog desde el primer release.',
      ],
      sections: [
        section('producto', 'Producto y responsables', [
          text('producto', 'Producto', { required: true, hint: 'Nombre corto con el que el equipo y los usuarios conocerán el producto o la solución.' }),
          text('patrocinador', 'Patrocinador', { from: 'project.sponsor', hint: 'Quién respalda la inversión y decide si el producto continúa.' }),
          text('duenoProducto', 'Dueño del producto', { hint: 'Rol que ordena el backlog y acepta los incrementos: una sola persona con autoridad para decidir, no un comité.' }),
          text('horizonte', 'Horizonte de la visión', { hint: 'Período que cubre esta visión, por ejemplo «julio a diciembre de 2026, tres releases».' }),
        ]),
        section('declaracion', 'Declaración de la visión', [
          area('paraQuien', 'Para (usuarios o clientes objetivo)', { rows: 2, required: true, hint: 'Personas, áreas o clientes que usarán el producto o se beneficiarán de él.' }),
          area('necesidad', 'Que (necesidad u oportunidad)', { required: true, hint: 'Problema que tienen hoy o la oportunidad que no aprovechan, con datos si los hay.' }),
          text('categoria', 'El producto es un (categoría)', { hint: 'Tipo de producto: sistema, servicio, aplicación, proceso…' }),
          area('beneficioClave', 'Que (beneficio clave)', { hint: 'La razón principal para adoptarlo: qué cambia para el usuario.' }),
          area('alternativas', 'A diferencia de (alternativa actual o competencia)', { rows: 2, hint: 'Lo que usan hoy o la opción con la que se compara.' }),
          area('diferenciador', 'Nuestro producto (diferenciador principal)', { hint: 'Lo que lo hace mejor que la alternativa, dicho en términos del usuario.' }),
          area('declaracion', 'Declaración completa', { rows: 4, hint: 'Une las partes anteriores en un párrafo de dos a cuatro líneas para presentarlo en la planificación y en la revisión de cada release.' }),
        ], 'Completa la frase «Para… que… el… es un… que… A diferencia de… nuestro producto…»: cada campo es una parte de la declaración.'),
        section('objetivos', 'Objetivos de negocio y métricas de éxito', [
          list('objetivosNegocio', 'Objetivos de negocio', { hint: 'Resultados medibles que la organización espera del producto; el backlog se prioriza según su aporte a estos objetivos.' }),
          table('metricasExito', 'Métricas de éxito', [
            cText('metrica', 'Métrica', { width: 240 }),
            cText('lineaBase', 'Línea base', { width: 150, hint: 'Valor actual, medido antes de empezar.' }),
            cText('meta', 'Meta', { width: 150 }),
            cDate('fecha', 'Fecha de la meta'),
          ], { addLabel: 'Agregar métrica', hint: 'Cada métrica con su valor actual, la meta y la fecha en que se espera alcanzarla.' }),
        ]),
        section('personas', 'Usuarios y personas', [
          table('personas', 'Personas (perfiles de usuario)', [
            cText('persona', 'Persona o rol', { width: 180 }),
            cArea('descripcion', 'Descripción', { width: 240 }),
            cArea('necesidades', 'Necesidades y frustraciones', { width: 260 }),
          ], { addLabel: 'Agregar persona', hint: 'Perfiles representativos de los usuarios: quiénes son, cómo trabajan y qué necesitan del producto.' }),
        ]),
        section('limites', 'Primer incremento y restricciones', [
          area('productoMinimo', 'Primer incremento valioso (producto mínimo viable)', { hint: 'El menor conjunto de funcionalidades que ya entrega valor y permite aprender de los usuarios reales.' }),
          list('fueraAlcance', 'Fuera del alcance de esta visión', { hint: 'Lo que el producto no hará en este horizonte, para evitar expectativas equivocadas.' }),
          list('restricciones', 'Restricciones', { hint: 'Condiciones que el producto debe respetar: normativa, presupuesto, fechas, tecnología o integraciones obligatorias.' }),
        ]),
      ],
      example: {
        producto: ERP.producto,
        patrocinador: 'Gerencia General',
        duenoProducto: ERP.po,
        horizonte: 'Julio a diciembre de 2026: tres releases de iteraciones de dos semanas.',
        paraQuien: 'Las áreas comercial, de logística, almacén, mantenimiento, facturación y cartera, y la Gerencia General de Ingeniería y Alquiler S.A.S.',
        necesidad: 'Hoy controlan los equipos en alquiler, las remisiones de entrega y devolución y la facturación en hojas de cálculo y sistemas separados: el corte mensual de alquileres tarda hasta cinco días hábiles, el inventario de la bodega no coincide con el de las obras y la cartera se conoce con una semana de retraso.',
        categoria: 'Sistema integrado de gestión empresarial (ERP) en la nube, parametrizado para el alquiler de equipos de construcción.',
        beneficioClave: 'Lleva la trazabilidad de cada equipo (bodega, obra y mantenimiento), calcula el alquiler desde las actas de entrega y devolución, emite la factura electrónica validada por la DIAN y mantiene la cartera al día en una sola fuente de datos.',
        alternativas: 'Las hojas de cálculo actuales y el software contable, que registra la factura al final del mes sin conocer el estado de los equipos.',
        diferenciador: 'Factura el alquiler el mismo día del corte sin digitar dos veces y muestra a la gerencia la utilización del inventario, la cartera por edades y los equipos en mantenimiento en un tablero actualizado cada día.',
        declaracion: 'Para las áreas de logística, almacén, mantenimiento, facturación y cartera y para la Gerencia General de Ingeniería y Alquiler, que hoy controlan los equipos y facturan el alquiler en hojas de cálculo con cortes de cinco días, el ERP de Ingeniería y Alquiler es un sistema integrado de gestión en la nube que lleva la trazabilidad de cada equipo, calcula el alquiler desde las actas y emite la factura electrónica validada por la DIAN. A diferencia de las hojas de cálculo y del software contable actual, nuestro producto factura el mismo día del corte y muestra en un tablero diario la utilización del inventario y la cartera.',
        objetivosNegocio: [
          'Reducir el cierre mensual de facturación de alquileres de 5 días hábiles a 1.',
          'Emitir todas las facturas de alquiler y venta como facturas electrónicas validadas por la DIAN, con menos de 1 % de rechazos.',
          'Aumentar la utilización del inventario de andamio multidireccional de 62 % a 75 % con disponibilidad en línea por bodega y obra.',
          'Bajar la cartera vencida a más de 60 días de 18 % a 10 % de la cartera total.',
          'Programar el mantenimiento preventivo de los equipos por ciclos de alquiler y cobrar al cliente los daños documentados en la devolución.',
        ],
        metricasExito: [
          { id: 'r1', metrica: 'Días hábiles para el cierre mensual de facturación de alquileres', lineaBase: '5 días', meta: '1 día', fecha: '2026-12-31' },
          { id: 'r2', metrica: 'Facturas electrónicas rechazadas por la DIAN', lineaBase: 'Sin integración (facturación manual en el portal del proveedor)', meta: 'Menos de 1 % de las emitidas', fecha: '2026-11-30' },
          { id: 'r3', metrica: 'Diferencia entre inventario físico y sistema en el conteo de bodega', lineaBase: '3,8 % de las piezas', meta: '0,5 % o menos', fecha: '2026-09-30' },
          { id: 'r4', metrica: 'Utilización del inventario de andamio multidireccional (m² alquilados ÷ m² disponibles)', lineaBase: '62 % (julio de 2026)', meta: '75 % o más', fecha: '2026-12-31' },
          { id: 'r5', metrica: 'Cartera vencida a más de 60 días sobre la cartera total', lineaBase: '18 %', meta: '10 % o menos', fecha: '2027-03-31' },
        ],
        personas: [
          { id: 'r1', persona: 'Coordinador logístico', descripcion: 'Programa los despachos y las devoluciones de equipos a las obras; trabaja entre la bodega y el celular.', necesidades: 'Saber qué equipos hay disponibles por bodega, generar la remisión y el acta de entrega en el sitio y ver las devoluciones pendientes por obra.' },
          { id: 'r2', persona: 'Auxiliar de facturación y cartera', descripcion: 'Liquida el alquiler mensual de cada obra, emite las facturas y gestiona el recaudo.', necesidades: 'Prefactura calculada desde las actas, factura electrónica validada en minutos y cartera por edades con alertas de vencimiento.' },
          { id: 'r3', persona: 'Jefe de mantenimiento', descripcion: 'Recibe los equipos devueltos, clasifica los daños y programa las reparaciones.', necesidades: 'Historial por equipo, órdenes de trabajo, cobro de daños al cliente y bloqueo de equipos no aptos para despacho.' },
          { id: 'r4', persona: 'Gerencia General', descripcion: 'Decide inversiones en inventario, tarifas y crédito a clientes.', necesidades: 'Tablero diario de utilización del inventario, ingresos por línea de negocio, cartera y equipos en mantenimiento.' },
        ],
        productoMinimo: 'Release 1: catálogo e inventario de equipos por bodega y obra, remisiones y actas de entrega y devolución, y cálculo del alquiler por días calendario. Reemplaza la hoja de cálculo de control de equipos en la bodega principal desde septiembre de 2026.',
        fueraAlcance: [
          'Nómina y gestión humana (se mantiene el sistema actual).',
          'Costeo de los proyectos de montaje (se evaluará en 2027).',
          'Portal de autoservicio para clientes.',
        ],
        restricciones: [
          'Facturación electrónica conforme al anexo técnico vigente de la DIAN, a través del proveedor tecnológico autorizado que contrató la empresa.',
          'Migración de saldos de inventario y cartera conciliada y aprobada por contabilidad y revisoría fiscal antes de cada salida a producción.',
          'Presupuesto aprobado de COP 278 millones para licencias, parametrización, integraciones y capacitación en 2026.',
          'Ninguna salida a producción durante el cierre mensual (primeros cinco días hábiles de cada mes).',
        ],
      },
    },

    /* ================================================================== 8.1 · DEFINICIÓN DE LISTO Y DE TERMINADO */
    {
      id: 'definicion-terminado',
      name: 'Definición de listo y de terminado',
      abbr: 'DLT',
      area: 'calidad', group: 'planificacion', process: '8.1', processes: ['8.1', '8.2'],
      kind: 'documento', multiple: false, agile: true, exampleProject: 'erp',
      purpose: 'Acuerda las condiciones para que un elemento del backlog entre a una iteración (definición de listo) y para que se considere terminado (definición de terminado), los criterios para liberar un release y las políticas explícitas del tablero Kanban. Es el estándar de calidad del equipo ágil (8.1) y se mejora en cada retrospectiva (8.2).',
      tips: [
        'La definición de terminado aplica a todo el trabajo; los criterios de aceptación son propios de cada historia. Un elemento está terminado solo si cumple ambos.',
        'Pocas reglas verificables valen más que una lista larga: cada punto debe poder comprobarse con un sí o un no en la revisión de la iteración.',
        'Endurécela de forma gradual: cuando una retrospectiva detecte defectos que se escaparon, agrega el control que los habría detectado.',
        'Publica las políticas del tablero junto a sus columnas y respeta los límites WIP: con una columna llena, el equipo ayuda a terminar antes de empezar algo nuevo.',
      ],
      sections: [
        section('acuerdo', 'Alcance del acuerdo', [
          area('aplicaA', 'A qué trabajo aplica', { hint: 'Tipos de elementos (historias, tareas, defectos, mejoras) y productos (software, configuración, documentos, capacitación) cubiertos.' }),
          text('acordadaPor', 'Acordada por', { hint: 'Roles que la acordaron: equipo de desarrollo, dueño del producto y Scrum Master o facilitador.' }),
          date('fechaAcuerdo', 'Fecha de la versión vigente'),
          area('revisionAcuerdo', 'Cuándo y cómo se revisa', { rows: 2, hint: 'Normalmente en cada retrospectiva; los cambios se registran en una nueva revisión de este documento.' }),
        ]),
        section('listo', 'Definición de listo', [
          list('definicionListo', 'Un elemento está listo para entrar a una iteración cuando…', {
            hint: 'Condiciones que el dueño del producto y el equipo verifican en el refinamiento antes de la planificación.',
            default: [
              'Está redactado como historia de usuario (rol, necesidad y beneficio) o como tarea técnica con su propósito.',
              'Tiene criterios de aceptación escritos y entendidos por el equipo.',
              'Está estimado por el equipo y cabe en una iteración.',
              'Sus dependencias están identificadas y no tiene bloqueos conocidos.',
              'Está priorizado por el dueño del producto (MoSCoW) y su valor de negocio es claro.',
            ],
          }),
        ], 'Guía de prácticas ágiles: evita comprometer trabajo ambiguo que luego se bloquea dentro de la iteración.'),
        section('terminado', 'Definición de terminado', [
          list('definicionTerminado', 'Un elemento está terminado cuando…', {
            required: true,
            hint: 'Guía de Scrum 2020: descripción formal del estado del incremento cuando cumple las medidas de calidad del producto. Lo que no la cumple no se presenta en la revisión ni cuenta en la velocidad.',
            default: [
              'Cumple todos sus criterios de aceptación.',
              'Fue revisado por otro miembro del equipo.',
              'Pasó las pruebas funcionales y de regresión de lo afectado, sin defectos críticos abiertos.',
              'Su documentación de usuario y de configuración está actualizada.',
              'Fue aceptado por el dueño del producto en la revisión de la iteración.',
            ],
          }),
        ]),
        section('release', 'Criterios para liberar un release', [
          list('criteriosRelease', 'Un release se libera a producción cuando…', { hint: 'Condiciones adicionales a la definición de terminado para entregar al cliente o a producción: pruebas de aceptación, migración, capacitación, aprobaciones.' }),
        ]),
        section('flujo', 'Políticas explícitas del tablero', [
          list('politicasFlujo', 'Políticas del flujo de trabajo', {
            hint: 'Reglas del método Kanban: límites WIP, cuándo un elemento pasa de una columna a otra, cómo se tratan los bloqueos y las urgencias.',
            default: [
              'Un elemento entra a «En curso» solo si cumple la definición de listo.',
              'Se respeta el límite WIP de cada columna: si está llena, se termina antes de empezar algo nuevo.',
              'Los elementos bloqueados se marcan con la causa y se tratan en la reunión diaria.',
              'Un elemento pasa a «Terminado» cuando cumple la definición de terminado; el dueño del producto lo acepta o lo rechaza en la revisión.',
            ],
          }),
          table('columnasTablero', 'Columnas del tablero', [
            cText('columna', 'Columna', { width: 140 }),
            cSelect('categoria', 'Categoría', CATEGORIA_COLUMNA, { width: 130 }),
            cNum('wip', 'Límite WIP', { min: 1, width: 90, hint: 'Máximo de elementos simultáneos en la columna; vacío = sin límite.' }),
            cArea('criterioEntrada', 'Criterio de entrada', { width: 220 }),
            cArea('criterioSalida', 'Criterio de salida', { width: 220 }),
          ], {
            addLabel: 'Agregar columna',
            hint: 'Documenta las columnas configuradas en el tablero Kanban del proyecto con sus límites y criterios de paso.',
            defaultRows: [
              { columna: 'Por hacer', categoria: 'Por hacer', criterioEntrada: 'Elemento de la iteración que cumple la definición de listo.', criterioSalida: 'Un miembro del equipo lo toma y hay cupo en «En curso».' },
              { columna: 'En curso', categoria: 'En curso', wip: 3, criterioEntrada: 'Tiene responsable y hay cupo en la columna.', criterioSalida: 'Trabajo completo y pruebas del responsable hechas.' },
              { columna: 'En revisión', categoria: 'En curso', wip: 2, criterioEntrada: 'Listo para revisión de pares y pruebas funcionales.', criterioSalida: 'Cumple la definición de terminado.' },
              { columna: 'Terminado', categoria: 'Terminado', criterioEntrada: 'Cumple la definición de terminado.', criterioSalida: 'Aceptado o rechazado por el dueño del producto en la revisión.' },
            ],
          }),
        ]),
      ],
      example: {
        aplicaA: 'Todas las historias, tareas, defectos y mejoras del backlog del ERP: parametrización, integraciones, migración de datos, reportes y capacitación. Las épicas se dan por terminadas cuando lo están todos sus elementos.',
        acordadaPor: 'Equipo de desarrollo, dueño del producto y Scrum Master / facilitador',
        fechaAcuerdo: '2026-08-21',
        revisionAcuerdo: 'Se revisa en cada retrospectiva; los cambios se acuerdan por consenso del equipo con el dueño del producto y se emiten como nueva revisión. La versión vigente es el ajuste de la retrospectiva de la iteración 3 (21 de agosto de 2026), que agregó la prueba con datos migrados.',
        definicionListo: [
          'Historia redactada como «Como <rol> quiero <necesidad> para <beneficio>», con el proceso de negocio afectado (inventario, alquiler, facturación, cartera o mantenimiento).',
          'Criterios de aceptación con ejemplos de datos reales (equipo, obra, fechas y valores) validados por el usuario clave del área.',
          'Estimada por el equipo en puntos de historia (planning poker) y de 8 puntos o menos; si es mayor, se divide.',
          'Reglas tributarias y contables confirmadas por contabilidad cuando la historia afecta la facturación o la cartera.',
          'Dependencias con el proveedor tecnológico de facturación electrónica identificadas y con fecha acordada.',
        ],
        definicionTerminado: [
          'Cumple todos sus criterios de aceptación y se demostró con datos de prueba de la empresa.',
          'La parametrización o el código fue revisado por otro miembro del equipo y quedó en el control de versiones de configuración.',
          'Pasó las pruebas funcionales y de regresión del proceso afectado en el ambiente de pruebas, sin defectos críticos ni altos abiertos.',
          'Se probó con los datos migrados de la bodega principal (desde la iteración 4).',
          'Las facturas que genera fueron validadas por la DIAN en el ambiente de habilitación (historias de facturación electrónica).',
          'El manual de usuario y la guía rápida del rol están actualizados.',
          'El dueño del producto lo aceptó en la revisión de la iteración.',
        ],
        criteriosRelease: [
          'Todas las historias «Debe tener» del release están terminadas y aceptadas.',
          'Los usuarios clave de las áreas del release firmaron la prueba de aceptación (UAT).',
          'La migración de saldos (inventario o cartera) está conciliada y aprobada por contabilidad y revisoría fiscal.',
          'Los usuarios están capacitados y con acceso, y el plan de reversión se probó.',
          'La salida a producción está programada después del cierre mensual y aprobada por el comité de control de cambios.',
        ],
        politicasFlujo: [
          'Solo entran a «En curso» elementos de la iteración actual que cumplen la definición de listo, o defectos críticos de producción.',
          'Límites WIP: 3 elementos en «En curso» y 2 en «En revisión»; con una columna llena, el equipo ayuda a terminar antes de tomar trabajo nuevo.',
          'Un elemento bloqueado se marca con la causa el mismo día; si sigue bloqueado al día siguiente, el Scrum Master lo escala.',
          'Los defectos críticos de producción tienen carril de urgencia y pueden superar el límite WIP una vez por iteración, con aviso al dueño del producto.',
          'Un elemento pasa a «Terminado» cuando cumple la definición de terminado; el dueño del producto lo acepta o lo rechaza en la revisión.',
        ],
        columnasTablero: [
          { id: 'r1', columna: 'Por hacer', categoria: 'Por hacer', criterioEntrada: 'Historia de la iteración actual que cumple la definición de listo.', criterioSalida: 'Un miembro del equipo la toma y hay cupo en «En curso».' },
          { id: 'r2', columna: 'En curso', categoria: 'En curso', wip: 3, criterioEntrada: 'Tiene responsable y hay cupo en la columna.', criterioSalida: 'Parametrización o desarrollo completo y pruebas del responsable hechas en el ambiente de pruebas.' },
          { id: 'r3', columna: 'En revisión', categoria: 'En curso', wip: 2, criterioEntrada: 'Lista para revisión de pares y pruebas funcionales del analista de pruebas.', criterioSalida: 'Cumple la definición de terminado.' },
          { id: 'r4', columna: 'Terminado', categoria: 'Terminado', criterioEntrada: 'Cumple la definición de terminado.', criterioSalida: 'Aceptada o rechazada por el dueño del producto en la revisión de la iteración.' },
        ],
      },
    },

    /* ================================================================== 6.5 · PLAN DE RELEASES */
    {
      id: 'plan-release',
      name: 'Plan de releases (hoja de ruta del producto)',
      abbr: 'PREL',
      area: 'cronograma', group: 'planificacion', process: '6.5', processes: ['6.5', '6.6'],
      kind: 'plan', multiple: false, agile: true, exampleProject: 'erp',
      purpose: 'Distribuye el backlog del producto en releases con objetivo, fechas, iteraciones, alcance estimado y presupuesto, a partir de la velocidad supuesta del equipo. Es la planificación ágil de liberaciones (6.5) y la referencia de la línea base de cada release comprometido para el control de cambios en dos niveles (6.6 y 4.6).',
      tips: [
        'Planifica con rangos: con la velocidad supuesta calcula cuántas iteraciones caben y deja margen; actualízala con el promedio real de las últimas tres iteraciones cerradas.',
        'Compromete en firme solo el release siguiente; los posteriores son una hoja de ruta que se ajusta al cerrar cada release.',
        'Cada release debe entregar un proceso de negocio completo que el usuario pueda usar, no una capa técnica.',
        'En proyectos híbridos, vincula cada release con su entregable de la EDT y su actividad del cronograma: así su avance entra a la ruta crítica, a la curva S y al valor ganado del proyecto.',
      ],
      sections: [
        section('base', 'Visión y supuestos de planificación', [
          area('visionResumen', 'Resumen de la visión del producto', { rows: 3, hint: 'Dos o tres líneas tomadas de la visión del producto: para quién, qué necesidad y qué resultado se espera.' }),
          select('unidadEstimacion', 'Unidad de estimación', UNIDAD_ESTIMACION, { hint: 'Debe coincidir con la configurada en el backlog del proyecto.' }),
          number('velocidadSupuesta', 'Velocidad supuesta (por iteración)', { min: 0, hint: 'Trabajo que el equipo termina por iteración. Al inicio sale de experiencias similares; después, del promedio de las últimas tres iteraciones cerradas.' }),
          number('duracionIteracion', 'Duración de la iteración (días hábiles)', { min: 1, max: 40, hint: 'Iteraciones de duración fija; diez días hábiles equivalen a dos semanas.' }),
          area('capacidadEquipo', 'Equipo y capacidad', { hint: 'Composición del equipo, dedicación y origen de la velocidad supuesta.' }),
        ]),
        section('releases', 'Releases', [
          table('releases', 'Releases planificados', [
            cText('release', 'Release', { width: 200 }),
            cArea('objetivo', 'Objetivo', { width: 240 }),
            cDate('fechaInicio', 'Inicio'),
            cDate('fechaFin', 'Fin'),
            cNum('iteraciones', 'Iteraciones', { min: 0, width: 90 }),
            cNum('puntos', 'Alcance estimado', { min: 0, width: 100, hint: 'Puntos de historia (u horas) del backlog asignado al release.' }),
            cCalc('porIteracion', 'Por iteración', calcPorIteracion, fmtNum1, { hint: 'Alcance estimado ÷ iteraciones. Compáralo con la velocidad supuesta.' }),
            cMoney('presupuesto', 'Presupuesto (BAC del release)'),
            cCalc('costoPunto', 'Costo por punto', calcCostoPunto, fmtMoney, { hint: 'Presupuesto ÷ alcance estimado: referencia para el valor ganado ágil del release.' }),
            cArea('alcance', 'Alcance (épicas y funcionalidades)', { width: 280 }),
          ], { addLabel: 'Agregar release', hint: 'Un release por fila, en orden de entrega. El alcance se expresa como épicas o funcionalidades; el detalle está en el backlog.' }),
        ]),
        section('supuestos', 'Supuestos, riesgos y replanificación', [
          list('supuestos', 'Supuestos del plan', { hint: 'Condiciones que se dan por ciertas al planificar: disponibilidad del equipo y de los usuarios clave, proveedores, ambientes.' }),
          list('riesgosPlan', 'Riesgos del plan', { hint: 'Eventos que pueden cambiar la velocidad, el alcance o las fechas; regístralos también en el registro de riesgos.' }),
          area('criteriosReplanificacion', 'Replanificación y control de cambios', { rows: 4, hint: 'Cuándo se revisa la hoja de ruta y qué cambios requieren solicitud de cambio (umbral de alcance, fecha o presupuesto del release comprometido).' }),
        ]),
      ],
      example: {
        visionResumen: 'Implementar el ERP de Ingeniería y Alquiler (ejemplo) para controlar cada equipo desde la bodega hasta la obra, facturar el alquiler el mismo día del corte con factura electrónica validada por la DIAN y dar a la gerencia un tablero diario de utilización y cartera.',
        unidadEstimacion: 'Puntos de historia',
        velocidadSupuesta: 30,
        duracionIteracion: 10,
        capacidadEquipo: 'Equipo de cinco personas con dedicación completa (consultor funcional ERP, desarrollador ERP, desarrollador de integraciones, analista de datos y analista de pruebas), Scrum Master con dedicación de 50 % y dueño del producto con dos horas diarias. La velocidad supuesta de 30 puntos por iteración viene de una implementación similar del proveedor del ERP; desde la iteración 4 se reemplaza por el promedio de las últimas tres iteraciones cerradas.',
        releases: [
          { id: 'r1', release: ERP.r1, objetivo: 'Controlar en el ERP cada equipo por bodega, obra y estado, y calcular el alquiler desde las actas de entrega y devolución.', fechaInicio: '2026-07-13', fechaFin: '2026-09-04', iteraciones: 4, puntos: 118, presupuesto: 96000000, alcance: 'Catálogo de equipos y piezas; inventario por bodega y obra; remisiones y actas de entrega y devolución; cálculo del alquiler por días calendario; migración del inventario de la bodega principal.' },
          { id: 'r2', release: ERP.r2, objetivo: 'Facturar el alquiler el mismo día del corte con factura electrónica validada por la DIAN y llevar la cartera por edades.', fechaInicio: '2026-09-07', fechaFin: '2026-10-30', iteraciones: 4, puntos: 112, presupuesto: 104000000, alcance: 'Prefactura mensual desde las actas; integración con el proveedor tecnológico de facturación electrónica; notas crédito y débito; recaudo y cartera por edades; migración de saldos de cartera.' },
          { id: 'r3', release: ERP.r3, objetivo: 'Programar y costear el mantenimiento de los equipos y dar a la gerencia indicadores diarios de utilización, ingresos y cartera.', fechaInicio: '2026-11-03', fechaFin: '2026-12-11', iteraciones: 3, puntos: 88, presupuesto: 78000000, alcance: 'Órdenes de mantenimiento preventivo y correctivo; cobro de daños al cliente; bloqueo de equipos no aptos para despacho; tablero gerencial de utilización del inventario, ingresos y cartera.' },
        ],
        supuestos: [
          'El dueño del producto dedica al menos dos horas diarias a refinar y aceptar historias.',
          'El proveedor tecnológico de facturación electrónica entrega el ambiente de habilitación antes del 7 de septiembre de 2026.',
          'Los usuarios clave participan en la revisión de cada iteración y en las pruebas de aceptación de cada release.',
          'La velocidad del equipo se estabiliza entre 28 y 32 puntos desde la iteración 3.',
        ],
        riesgosPlan: [
          'Rechazos de la DIAN en el ambiente de habilitación que alarguen el release 2.',
          'Calidad de los datos de inventario y cartera para la migración.',
          'Rotación de personas clave del equipo o del proveedor del ERP.',
          'Salidas a producción que coincidan con el cierre mensual de facturación.',
        ],
        criteriosReplanificacion: 'La hoja de ruta se revisa al cerrar cada release y cuando el pronóstico por velocidad mueve el fin de un release más de una iteración. Dentro de un release comprometido, el dueño del producto puede reordenar, dividir o cambiar historias sin trámite formal mientras el alcance total se mantenga dentro de ±10 % de su línea base y no cambien la fecha ni el presupuesto. Si se supera ese umbral, o si cambian la fecha o el presupuesto, se registra una solicitud de cambio (4.6) y, aprobada, se fija una nueva línea base del release.',
      },
    },

    /* ================================================================== 4.3 · PLANIFICACIÓN DE LA ITERACIÓN */
    {
      id: 'planificacion-sprint',
      name: 'Planificación de la iteración',
      abbr: 'PIT',
      area: 'integracion', group: 'ejecucion', process: '4.3', processes: ['4.3'],
      kind: 'acta', multiple: true, agile: true, exampleProject: 'erp',
      purpose: 'Registra el acuerdo de la planificación de la iteración: objetivo, capacidad del equipo, velocidad de referencia, elementos del backlog seleccionados con su estimación y responsable, riesgos y participantes. Es el compromiso de trabajo del equipo para la iteración (4.3).',
      tips: [
        'Empieza por el objetivo de la iteración y luego elige los elementos que lo cumplen, no al revés.',
        'Calcula la capacidad descontando festivos, vacaciones y dedicación parcial, y compromete cerca de la velocidad promedio de las últimas tres iteraciones, no de la mejor.',
        'Todo elemento seleccionado debe cumplir la definición de listo; si no, se refina antes de comprometerlo.',
        'Desde «Releases e iteraciones» puedes crear este documento prellenado con los elementos de la iteración.',
      ],
      sections: [
        section('datos', 'Datos de la iteración', [
          text('iteracion', 'Iteración', { required: true, placeholder: 'Iteración 1', hint: 'Nombre de la iteración tal como aparece en «Releases e iteraciones».' }),
          text('release', 'Release', { hint: 'Release al que aporta la iteración.' }),
          date('fechaInicio', 'Fecha de inicio'),
          date('fechaFin', 'Fecha de fin'),
          area('objetivo', 'Objetivo de la iteración', { rows: 2, required: true, hint: 'Un solo objetivo, verificable en la revisión, que da sentido a los elementos seleccionados (Guía de Scrum 2020).' }),
        ]),
        section('capacidad', 'Capacidad y compromiso', [
          number('capacidad', 'Capacidad del equipo', { min: 0, hint: 'Trabajo que el equipo puede asumir en esta iteración, en la unidad de estimación del proyecto (puntos u horas), según su disponibilidad real.' }),
          number('velocidadReferencia', 'Velocidad de referencia', { min: 0, hint: 'Promedio de lo terminado en las últimas tres iteraciones cerradas.' }),
          number('compromiso', 'Compromiso', { min: 0, hint: 'Suma de las estimaciones de los elementos seleccionados; se fija al iniciar la iteración. No debería superar la capacidad.' }),
          area('notasCapacidad', 'Cálculo de la capacidad', { rows: 2, hint: 'Personas, días disponibles, ausencias y festivos con los que se calculó la capacidad.' }),
        ]),
        section('elementos', 'Elementos seleccionados del backlog', [
          table('elementos', 'Elementos de la iteración', [
            cCode('codigo', 'Código', { placeholder: 'HU-001' }),
            cArea('titulo', 'Título', { width: 260 }),
            cSelect('tipo', 'Tipo', ITEM_TYPE_LABELS, { width: 160 }),
            cNum('estimacion', 'Estimación', { min: 0, width: 90 }),
            cText('responsable', 'Responsable', { width: 170 }),
            cArea('criterios', 'Criterios de aceptación', { width: 280 }),
          ], { addLabel: 'Agregar elemento del backlog', hint: 'En orden de prioridad. La suma de las estimaciones es el compromiso de la iteración.' }),
        ]),
        section('riesgos', 'Riesgos, dependencias y participantes', [
          area('riesgos', 'Riesgos, dependencias e impedimentos', { rows: 3, hint: 'Lo que puede impedir cumplir el objetivo y cómo se responde: dependencias externas, ausencias, ambientes, elementos bloqueados.' }),
          list('participantes', 'Participantes', { hint: 'Roles que asistieron a la planificación.' }),
        ]),
      ],
      example: {
        iteracion: ERP.it6,
        release: ERP.r2,
        fechaInicio: '2026-09-21',
        fechaFin: '2026-10-02',
        objetivo: ERP.objetivoIt6,
        capacidad: 31,
        velocidadReferencia: 31,
        compromiso: 31,
        notasCapacidad: 'Cinco personas × 10 días hábiles = 50 días-persona, menos 2 días de vacaciones del analista de datos = 48 días-persona (la iteración 5 tuvo 46 y terminó 30 puntos). Al mismo ritmo, la capacidad es de unos 31 puntos. Velocidad de referencia: promedio de las iteraciones 3, 4 y 5 (31, 32 y 30 puntos).',
        elementos: [
          { id: 'r1', codigo: 'HU-031', titulo: 'Generar la prefactura mensual de alquiler desde las actas de entrega y devolución', tipo: 'Historia de usuario', estimacion: 8, responsable: 'Consultor funcional ERP', criterios: 'Liquida los días calendario por equipo y obra con la tarifa del contrato; el auxiliar de facturación puede ajustar y aprobar antes de facturar.' },
          { id: 'r2', codigo: 'HU-032', titulo: 'Enviar la factura electrónica al proveedor tecnológico y registrar el CUFE y la respuesta de la DIAN', tipo: 'Historia de usuario', estimacion: 8, responsable: 'Desarrollador de integraciones', criterios: 'Factura aceptada por la DIAN en habilitación; CUFE y estado guardados en el ERP; los rechazos se muestran con su causa.' },
          { id: 'r3', codigo: 'HU-033', titulo: 'Generar la representación gráfica de la factura y enviarla al cliente por correo', tipo: 'Historia de usuario', estimacion: 5, responsable: 'Desarrollador de integraciones', criterios: 'PDF con CUFE y código QR; envío con el XML adjunto al correo de facturación del cliente.' },
          { id: 'r4', codigo: 'HU-034', titulo: 'Registrar notas crédito por devoluciones anticipadas de equipos', tipo: 'Historia de usuario', estimacion: 5, responsable: 'Consultor funcional ERP', criterios: 'Nota crédito electrónica que referencia la factura y ajusta la cartera del cliente.' },
          { id: 'r5', codigo: 'DF-007', titulo: 'Corregir el cálculo de días de alquiler cuando la devolución cae en festivo', tipo: 'Defecto', estimacion: 2, responsable: 'Desarrollador ERP', criterios: 'Cuenta días calendario, festivos incluidos, según el contrato; se verifica con una devolución en día festivo.' },
          { id: 'r6', codigo: 'IN-004', titulo: 'Investigar las reglas de rechazo de la DIAN más frecuentes en habilitación', tipo: 'Investigación (spike)', estimacion: 3, responsable: 'Analista de pruebas', criterios: 'Reglas y casos de prueba documentados; decisión sobre las validaciones previas que hará el ERP.' },
        ],
        riesgos: 'El ambiente de habilitación del proveedor tecnológico estuvo inestable en la iteración 5: si falla más de un día, se adelantan HU-031, DF-007 e IN-004, que no dependen de él. Dependencia: la numeración de facturación para el ambiente de pruebas debe estar habilitada antes del 23 de septiembre. Las vacaciones del analista de datos (24 y 25 de septiembre) las cubre el consultor funcional.',
        participantes: [ERP.po, 'Scrum Master / facilitador', 'Equipo de desarrollo (cinco personas)', 'Usuario clave de facturación y cartera (invitado)'],
      },
    },

    /* ================================================================== 5.5 · ACTA DE REVISIÓN DE LA ITERACIÓN */
    {
      id: 'acta-revision-sprint',
      name: 'Acta de revisión de la iteración',
      abbr: 'ARI',
      area: 'alcance', group: 'monitoreo', process: '5.5', processes: ['5.5'],
      kind: 'acta', multiple: true, agile: true, exampleProject: 'erp',
      purpose: 'Deja constancia de la revisión de la iteración: el incremento demostrado, los elementos aceptados o rechazados por el dueño del producto, la retroalimentación de los interesados y los cambios al backlog. Es la validación del alcance (5.5) en un enfoque ágil.',
      tips: [
        'Demuestra el producto funcionando con datos reales, no presentaciones: los interesados deben poder usarlo.',
        'Un elemento que no cumple la definición de terminado no se presenta como terminado: queda «No terminado» y vuelve al backlog.',
        'Convierte la retroalimentación en cambios concretos al backlog (nuevas historias, cambios de prioridad), no en comentarios sueltos.',
        'Revisa el avance y el pronóstico del release: si el alcance supera el umbral de su línea base o cambia su fecha, inicia el control de cambios (4.6).',
      ],
      sections: [
        section('datos', 'Datos de la revisión', [
          text('iteracion', 'Iteración', { required: true, placeholder: 'Iteración 1' }),
          date('fecha', 'Fecha de la revisión', { required: true }),
          area('objetivo', 'Objetivo de la iteración', { rows: 2 }),
          select('objetivoCumplido', '¿Se cumplió el objetivo?', OBJETIVO_CUMPLIDO),
          number('comprometido', 'Comprometido', { min: 0, hint: 'Trabajo comprometido al iniciar la iteración (puntos u horas).' }),
          number('terminado', 'Terminado y aceptado', { min: 0, hint: 'Suma de las estimaciones de los elementos aceptados: es la velocidad de la iteración.' }),
          area('incremento', 'Incremento demostrado', { rows: 3, hint: 'Qué se mostró funcionando y con qué datos.' }),
        ]),
        section('elementos', 'Resultado por elemento', [
          table('elementos', 'Elementos revisados', [
            cCode('codigo', 'Código', { placeholder: 'HU-001' }),
            cArea('titulo', 'Título', { width: 260 }),
            cNum('estimacion', 'Estimación', { min: 0, width: 90 }),
            cSelect('resultado', 'Resultado', RESULTADO_REVISION, { width: 140, hint: 'Aceptado: cumple la definición de terminado y sus criterios. Rechazado: se presentó y no se aceptó. No terminado: no se alcanzó a terminar.' }),
            cArea('observaciones', 'Observaciones', { width: 300 }),
          ], { addLabel: 'Agregar elemento revisado', hint: 'Todos los elementos comprometidos, con la decisión del dueño del producto.' }),
        ]),
        section('retro', 'Retroalimentación y cambios', [
          area('retroalimentacion', 'Retroalimentación de los interesados', { rows: 3 }),
          area('cambiosBacklog', 'Cambios al backlog del producto', { rows: 3, hint: 'Elementos nuevos, retirados o repriorizados y su efecto en el alcance del release frente a su línea base.' }),
          area('estadoRelease', 'Avance y pronóstico del release', { rows: 3, hint: 'Trabajo terminado frente al alcance del release, velocidad promedio y fecha probable de terminación.' }),
          list('asistentes', 'Asistentes', { hint: 'Roles del equipo Scrum e interesados invitados.' }),
        ]),
      ],
      example: {
        iteracion: ERP.it6,
        fecha: '2026-10-02',
        objetivo: ERP.objetivoIt6,
        objetivoCumplido: 'Parcialmente',
        comprometido: 31,
        terminado: 26,
        incremento: 'Con los datos de septiembre de la obra Edificio Altavista (ficticia) se demostraron la prefactura mensual calculada desde las actas, el envío al proveedor tecnológico, la factura aceptada por la DIAN en habilitación con su CUFE y la nota crédito por devolución anticipada. La factura todavía no se envía al cliente con su representación gráfica completa.',
        elementos: [
          { id: 'r1', codigo: 'HU-031', titulo: 'Generar la prefactura mensual de alquiler desde las actas de entrega y devolución', estimacion: 8, resultado: 'Aceptado', observaciones: 'El usuario clave de facturación pidió ver el detalle por equipo en la prefactura (nueva historia HU-041).' },
          { id: 'r2', codigo: 'HU-032', titulo: 'Enviar la factura electrónica al proveedor tecnológico y registrar el CUFE y la respuesta de la DIAN', estimacion: 8, resultado: 'Aceptado', observaciones: 'Los rechazos por NIT del adquirente se muestran con su causa.' },
          { id: 'r3', codigo: 'HU-033', titulo: 'Generar la representación gráfica de la factura y enviarla al cliente por correo', estimacion: 5, resultado: 'Rechazado', observaciones: 'La representación gráfica no incluye el código QR exigido; vuelve al backlog como «Debe tener» para la iteración 7.' },
          { id: 'r4', codigo: 'HU-034', titulo: 'Registrar notas crédito por devoluciones anticipadas de equipos', estimacion: 5, resultado: 'Aceptado', observaciones: '' },
          { id: 'r5', codigo: 'DF-007', titulo: 'Corregir el cálculo de días de alquiler cuando la devolución cae en festivo', estimacion: 2, resultado: 'Aceptado', observaciones: 'Verificado con la devolución del 17 de agosto (festivo).' },
          { id: 'r6', codigo: 'IN-004', titulo: 'Investigar las reglas de rechazo de la DIAN más frecuentes en habilitación', estimacion: 3, resultado: 'Aceptado', observaciones: 'Se documentaron 12 reglas de rechazo; las validaciones previas pasan al backlog como ME-009.' },
        ],
        retroalimentacion: 'El dueño del producto y el usuario clave de facturación confirmaron que la prefactura reduce el corte de alquileres a un día. Cartera pidió ver la factura en el estado de cuenta del cliente el mismo día de su emisión. La Gerencia General pidió asegurar el envío automático al cliente antes del primer cierre en producción, en noviembre.',
        cambiosBacklog: 'Nuevos elementos: HU-041, detalle por equipo en la prefactura (5 puntos, «Debería tener»), y ME-009, validaciones previas de NIT, numeración y correo del adquirente (3 puntos, «Debe tener»). HU-033 vuelve al backlog como «Debe tener» para la iteración 7. El alcance del release 2 pasa de 112 a 120 puntos (+7,1 %), dentro del umbral de ±10 % de su línea base: no requiere solicitud de cambio.',
        estadoRelease: 'Release 2: 56 de 120 puntos terminados (47 %) después de 2 de sus 4 iteraciones. Faltan 64 puntos para las iteraciones 7 y 8 (32 por iteración) frente a una velocidad promedio de 29,3 puntos en las tres últimas. El dueño del producto propuso diferir al release 3 historias «Podría tener» por 8 puntos para conservar la fecha del 30 de octubre; si se mantuviera el alcance, el release necesitaría una iteración más, lo que cambia su fecha y exige una solicitud de cambio.',
        asistentes: [ERP.po, 'Scrum Master / facilitador', 'Equipo de desarrollo (cinco personas)', 'Usuario clave de facturación y cartera', 'Jefe de cartera', 'Gerencia General (patrocinador)'],
      },
    },

    /* ================================================================== 4.4 · RETROSPECTIVA DE LA ITERACIÓN */
    {
      id: 'retrospectiva',
      name: 'Retrospectiva de la iteración',
      abbr: 'RET',
      area: 'integracion', group: 'ejecucion', process: '4.4', processes: ['4.4'],
      kind: 'acta', multiple: true, agile: true, exampleProject: 'erp',
      purpose: 'Registra la reflexión del equipo al final de la iteración sobre personas, interacciones, procesos, herramientas y definición de terminado: qué funcionó, qué mejorar, las acciones de mejora con responsable y fecha, y las lecciones que pasan al registro de lecciones aprendidas (4.4).',
      tips: [
        'Revisa primero las acciones de la retrospectiva anterior: si no se cumplieron, elige menos y más concretas.',
        'Una a tres acciones con responsable y fecha valen más que una lista larga; lleva la más importante al backlog de la siguiente iteración.',
        'Habla de hechos y del proceso, no de personas; el facilitador cuida que todos participen.',
        'Desde «Releases e iteraciones» puedes enviar las lecciones de esta retrospectiva al registro de lecciones aprendidas del proyecto.',
      ],
      sections: [
        section('datos', 'Datos de la retrospectiva', [
          text('iteracion', 'Iteración', { required: true, placeholder: 'Iteración 1' }),
          date('fecha', 'Fecha', { required: true }),
          select('formato', 'Formato', FORMATO_RETRO, { hint: 'Bien, mejorar y acciones; Empezar, dejar y continuar; o 4L (me gustó, aprendí, faltó, anhelo).' }),
          text('facilitador', 'Facilitador', { hint: 'Normalmente el Scrum Master; puede rotar entre los miembros del equipo.' }),
          number('satisfaccion', 'Satisfacción del equipo (1–5)', { min: 1, max: 5, hint: 'Promedio de la votación anónima del equipo: 1 = muy insatisfecho, 5 = muy satisfecho.' }),
          area('seguimientoAnteriores', 'Seguimiento a las acciones de la retrospectiva anterior', { rows: 3 }),
        ]),
        section('reflexion', 'Reflexión del equipo', [
          list('queFueBien', 'Qué funcionó bien', { hint: 'En «Empezar, dejar y continuar» corresponde a «Continuar»; en 4L, a «Me gustó».' }),
          list('queMejorar', 'Qué mejorar', { hint: 'En «Empezar, dejar y continuar» corresponde a «Dejar de hacer»; en 4L, a «Faltó».' }),
          list('propuestas', 'Ideas para probar', { hint: 'En «Empezar, dejar y continuar» corresponde a «Empezar»; en 4L, a «Anhelo».' }),
          list('aprendizajes', 'Lo aprendido', { hint: 'Formato 4L: lo que el equipo aprendió en la iteración.' }),
        ], 'Usa las listas que correspondan al formato elegido; las que no apliquen pueden quedar vacías.'),
        section('acciones', 'Acciones de mejora', [
          table('acciones', 'Acciones', [
            cArea('accion', 'Acción', { width: 300 }),
            cText('responsable', 'Responsable', { width: 180 }),
            cDate('fechaObjetivo', 'Fecha objetivo'),
            cSelect('estado', 'Estado', ESTADO_ACCION, { width: 120, default: 'Pendiente' }),
          ], { addLabel: 'Agregar acción', hint: 'Acciones concretas y verificables, con responsable y fecha; se revisan al inicio de la siguiente retrospectiva.' }),
        ]),
        section('lecciones', 'Lecciones aprendidas', [
          table('lecciones', 'Lecciones', [
            cArea('situacion', 'Situación', { width: 300 }),
            cSelect('impacto', 'Impacto', IMPACTO_LECCION, { width: 120 }),
            cArea('recomendacion', 'Recomendación', { width: 300 }),
          ], { addLabel: 'Agregar lección', hint: 'Lo que vale la pena conservar para otras iteraciones y proyectos. Se copian al registro de lecciones aprendidas con área «Integración».' }),
        ]),
      ],
      example: {
        iteracion: ERP.it6,
        fecha: '2026-10-02',
        formato: 'Bien, mejorar y acciones',
        facilitador: 'Scrum Master / facilitador',
        satisfaccion: 3.8,
        seguimientoAnteriores: 'Acciones de la iteración 5: (1) ambiente de pruebas con datos migrados — hecha; (2) refinamiento con contabilidad antes de cada historia de facturación — hecha, evitó dos devoluciones; (3) monitoreo diario del ambiente del proveedor tecnológico — en curso: el proveedor todavía no publica el estado de su servicio.',
        queFueBien: [
          'La prefactura con datos reales convenció al usuario clave de facturación en la primera demostración.',
          'El refinamiento con contabilidad antes de cada historia de facturación evitó retrabajo en las reglas tributarias.',
          'La investigación IN-004 dejó casos de prueba que sirven para todas las historias de facturación.',
        ],
        queMejorar: [
          'HU-033 se presentó sin verificar el código QR contra el anexo técnico: la definición de terminado no lo exigía.',
          'El ambiente de habilitación del proveedor falló dos días y el equipo se enteró en la reunión diaria, no antes.',
          'Hubo tres historias a la vez en «En curso» y la revisión de pares se acumuló al final de la iteración.',
        ],
        acciones: [
          { id: 'r1', accion: 'Agregar a la definición de terminado la verificación de la representación gráfica con la lista de chequeo del anexo técnico vigente de la DIAN.', responsable: 'Analista de pruebas', fechaObjetivo: '2026-10-05', estado: 'Pendiente' },
          { id: 'r2', accion: 'Pedir al proveedor tecnológico aviso automático de caídas del ambiente de habilitación y revisar su estado al iniciar cada día.', responsable: 'Scrum Master / facilitador', fechaObjetivo: '2026-10-09', estado: 'En curso' },
          { id: 'r3', accion: 'Hacer la revisión de pares a mitad de la iteración (día 5) y respetar el límite WIP de 2 en «En revisión».', responsable: 'Equipo de desarrollo', fechaObjetivo: '2026-10-09', estado: 'Pendiente' },
        ],
        lecciones: [
          { id: 'r1', situacion: 'Una historia de facturación electrónica se presentó como terminada sin el código QR exigido y fue rechazada en la revisión de la iteración 6.', impacto: 'Negativo', recomendacion: 'Incluir en la definición de terminado una lista de chequeo del anexo técnico vigente de la DIAN para toda historia que genere documentos electrónicos.' },
          { id: 'r2', situacion: 'Refinar las historias de facturación con contabilidad antes de la planificación evitó devoluciones por reglas tributarias.', impacto: 'Positivo', recomendacion: 'Programar una sesión de refinamiento con contabilidad dos días antes de cada planificación que incluya historias de facturación o cartera.' },
          { id: 'r3', situacion: 'La caída del ambiente del proveedor tecnológico se conoció tarde y costó dos días de trabajo de integración.', impacto: 'Negativo', recomendacion: 'Acordar con los proveedores de servicios en la nube un canal de aviso de incidentes y planificar historias sin esa dependencia como alternativa.' },
        ],
      },
    },
  ];

  PM.registerTemplates(templates);
})();

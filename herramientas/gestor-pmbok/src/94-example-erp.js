/* ==========================================================================
   94-example-erp.js — proyecto de ejemplo ágil (SPEC.md §9.7):
   «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler» (PRY-2026-021).
   Proyecto interno con ciclo de vida Adaptativo (ágil): Scrum con tablero
   Kanban, iteraciones de diez días hábiles (calendario L-V con festivos de
   Colombia) y tres releases (inventario y alquiler de equipos; facturación
   electrónica y cartera; mantenimiento y tablero gerencial). Los entregables
   de preparación (selección y contratación, infraestructura y licenciamiento,
   migración de datos, capacitación y salidas en vivo) son predictivos en la
   EDT; cada release es un entregable adaptativo vinculado a una actividad del
   cronograma (release.taskId y task.releaseId), de modo que su avance sale
   del backlog y entra a la curva S y al valor ganado del proyecto.
   Devuelve el formato de exportación que consume PM.projectOps.importData:
   {format:'gestor-pmbok', version:1, project, collections:{docs, tools,
   baselines, flows, backlog}}. Todo es determinista (ids fijos, sin azar ni
   fecha del sistema). La línea base LB0 sale de PM.calc.computeSchedule y
   PM.calc.makeBaselineSnapshot sobre el plan sin avance.
   Las cifras que citan los documentos (95-example-erp-docs.js) se calculan
   aquí con las mismas funciones de la aplicación (PM.calc.*, PM.agile.*) y se
   entregan al módulo de documentos como «hechos» (facts).
   Fecha de corte: viernes 9 de octubre de 2026 (día 2 de la iteración 7).
   Catálogo de recursos (herramienta «resources», SPEC §10): equipo Scrum con
   dedicación y ausencias (capacidad sugerida de las iteraciones), implementador,
   licencias y equipos; t26 se costea de forma mixta y t34 por recursos, con
   el mismo costo presupuestado.
   Supuestos de costos y fuentes: docs/ejemplo-erp/supuestos-y-fuentes.md.
   Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || typeof PM.registerExample !== 'function' || !PM.agile || !PM.calc || typeof PM.calc.agileEvm !== 'function') return;
  const D = PM.date;
  const M = 1e6;
  /* millones a pesos enteros (evita 8.2 * 1e6 = 8199999,999…) */
  const mm = (x) => Math.round(x * M);

  /* ---------------------------------------------------------------- datos generales */
  const CODE = 'PRY-2026-021';
  const START = '2026-05-04';
  const END = '2027-01-29';
  const STATUS_DATE = '2026-10-09';
  const LB0_DATE = '2026-07-10';
  const CC1_DATE = '2026-08-13';
  const CC1_REQUEST = '2026-08-11';
  const SETTINGS = { workweek: 5, holidaysCO: true, extraHolidays: [] };
  /* presupuesto aprobado: BAC de las actividades COP 601,3 M + reserva para contingencias 60,0 M (≈10 % del BAC) +
     reserva de gestión 18,7 M (≈3 %) = COP 680,0 M (≈ USD 170.000 a COP 4.000 por dólar; supuestos en docs/ejemplo-erp) */
  const RESERVES = { contingency: mm(60), management: mm(18.7) };
  const BUDGET = mm(680);
  const META = {
    name: 'EJEMPLO · Implementación del ERP de Ingeniería y Alquiler',
    code: CODE,
    client: 'Ingeniería y Alquiler S.A.S. (proyecto interno)',
    sponsor: 'Gerencia General',
    manager: 'Director de proyecto (jefe de la PMO)',
    start: START,
    end: END,
    statusDate: STATUS_DATE,
    budget: BUDGET,
    currency: 'COP',
    status: 'En ejecución',
    lifecycle: 'Adaptativo (ágil)',
    location: 'Bogotá D.C. — sede administrativa, bodega principal (Bogotá) y bodega de Funza (Cundinamarca)',
    description: 'Proyecto de ejemplo con datos ficticios. Implementación de un ERP de mercado medio en la nube con un socio implementador para Ingeniería y Alquiler S.A.S.: inventario y alquiler de equipos (contratos, despachos, devoluciones y disponibilidad por bodega), facturación electrónica DIAN y cartera, mantenimiento de equipos y tablero gerencial. Incluye la selección y contratación del ERP, la infraestructura y el licenciamiento, la migración de datos maestros, la integración con el proveedor tecnológico de facturación electrónica, la capacitación y la gestión del cambio, tres salidas en vivo por release y la estabilización (hypercare) en enero de 2027. Scrum con tablero Kanban e iteraciones de diez días hábiles.',
    createdAt: '2026-05-04T13:00:00.000Z',
    createdBy: null,
  };

  /* ---------------------------------------------------------------- roles y recursos */
  const R = {
    pat: 'Gerencia General', dir: 'Director de proyecto (jefe de la PMO)', sm: 'Scrum Master / facilitador', po: 'Dueño del producto',
    cf: 'Consultor funcional ERP', de: 'Desarrollador ERP', di: 'Desarrollador de integraciones', ap: 'Analista de pruebas', at: 'Analista de TI',
    uc: 'Usuarios clave', alm: 'Personal de bodega', csel: 'Consultor de selección (independiente)', cgc: 'Consultor de gestión del cambio',
    jti: 'Jefe de TI', con: 'Contabilidad', jur: 'Asesor jurídico', ins: 'Instructor del implementador', lim: 'Líder del implementador',
  };
  const RESOURCE_LIMITS = {
    [R.dir]: 1, [R.sm]: 1, [R.po]: 1, [R.cf]: 1, [R.de]: 1, [R.di]: 1, [R.ap]: 1, [R.at]: 1, [R.uc]: 6, [R.alm]: 8,
    [R.csel]: 1, [R.cgc]: 1, [R.jti]: 1, [R.con]: 1, [R.jur]: 1, [R.ins]: 1, [R.lim]: 1,
  };

  /* ---------------------------------------------------------------- EDT y diccionario
     [id, padre, nombre, tipo, enfoque ('' = heredado), responsable, descripción, entregable, criterios de aceptación] */
  const WBS = [
    ['w1', null, 'Gestión del proyecto', 'entregable', '', R.dir,
      'Dirección integrada del proyecto: constitución, plan para la dirección del proyecto y plan de releases, facilitación ágil (Scrum Master), seguimiento con valor ganado y AgileEVM, control integrado de cambios en dos niveles y cierre.',
      'Plan para la dirección del proyecto, plan de releases, informes de desempeño y acta de cierre',
      'Documentos aprobados por la Gerencia General; informes emitidos dentro de los dos días hábiles siguientes a cada corte.'],
    ['w11', 'w1', 'Inicio y constitución', 'paquete', '', R.dir,
      'Acta de constitución, identificación de interesados y reunión de arranque con las áreas usuarias.',
      'Acta de constitución aprobada y registro de interesados', 'Acta firmada por la Gerencia General; registro revisado por el dueño del producto.'],
    ['w12', 'w1', 'Planificación del proyecto y de los releases', 'paquete', '', R.dir,
      'Plan para la dirección del proyecto con el enfoque híbrido de entrega, plan de releases, plan de gestión de cambios en dos niveles y línea base LB0.',
      'Plan para la dirección del proyecto, plan de releases y LB0', 'Aprobación de la Gerencia General y LB0 establecida antes de la iteración 1.'],
    ['w13', 'w1', 'Seguimiento, control y facilitación ágil', 'paquete', '', R.dir,
      'Facilitación de los eventos de Scrum, comités quincenales, valor ganado del proyecto y AgileEVM por release, control integrado de cambios y gestión de riesgos.',
      'Informes de desempeño, actas de revisión y retrospectivas, registro de cambios', 'Informe quincenal entregado al patrocinador; impedimentos escalados en menos de un día hábil.'],
    ['w14', 'w1', 'Cierre del proyecto', 'paquete', '', R.dir,
      'Informe final, registro de lecciones aprendidas consolidado, transferencia al soporte de TI y acta de cierre.',
      'Informe final y acta de cierre', 'Acta firmada por la Gerencia General y el dueño del producto.'],
    ['w2', null, 'Selección y contratación del ERP y del implementador', 'entregable', 'predictivo', R.dir,
      'Descubrimiento de procesos, requisitos de alto nivel, solicitud de propuestas, demostraciones guiadas con guiones de negocio, evaluación ponderada y contratos de suscripción e implementación.',
      'ERP y socio implementador seleccionados y contratados', 'Contratos firmados dentro del presupuesto aprobado y matriz de evaluación aprobada por la Gerencia General.'],
    ['w21', 'w2', 'Descubrimiento y requisitos de alto nivel', 'paquete', '', R.po,
      'Talleres con las áreas de comercial, logística, almacén, mantenimiento, facturación, cartera y contabilidad; mapa de procesos actual y requisitos de alto nivel.',
      'Mapa de procesos y requisitos de alto nivel', 'Requisitos validados por los usuarios clave de cada área.'],
    ['w22', 'w2', 'Solicitud de propuestas, demostraciones y evaluación', 'paquete', '', R.dir,
      'Solicitud de propuestas a cinco fabricantes e implementadores, demostraciones guiadas con guiones de negocio de alquiler y evaluación ponderada (funcionalidad, costo total a tres años, trabajo por iteraciones, experiencia y soporte).',
      'Matriz de evaluación y recomendación', 'Tres demostraciones con los mismos guiones y evaluación firmada por el comité de selección.'],
    ['w23', 'w2', 'Negociación y contratos', 'paquete', '', R.dir,
      'Negociación del contrato de suscripción del ERP y del contrato de implementación por iteraciones de precio fijo, con acuerdos de nivel de servicio.',
      'Contratos firmados', 'Contratos revisados por el asesor jurídico y firmados por la Gerencia General.'],
    ['w3', null, 'Infraestructura y licenciamiento', 'entregable', 'predictivo', R.jti,
      'Suscripción del ERP en la nube, ambientes de pruebas y producción, usuarios y perfiles, equipos de bodega (tabletas, lectores e impresoras), red inalámbrica de bodegas y contrato con el proveedor tecnológico de facturación electrónica.',
      'Plataforma, equipos y servicios listos para las iteraciones y las salidas en vivo', 'Ambientes disponibles antes de la iteración 1; equipos de bodega instalados antes de la iteración 2; habilitación de facturación antes del release 2.'],
    ['w31', 'w3', 'Suscripción, ambientes y seguridad', 'paquete', '', R.jti,
      'Suscripción de 45 usuarios (30 completos y 15 limitados) de julio de 2026 a enero de 2027, ambientes de pruebas y producción, usuarios, perfiles y respaldo.',
      'Ambientes y usuarios habilitados', 'Acceso verificado por perfil; respaldo diario configurado.'],
    ['w32', 'w3', 'Equipos de bodega y conectividad', 'paquete', '', R.jti,
      'Cuatro tabletas robustas, seis lectores de código de barras, dos impresoras de etiquetas y red inalámbrica en las bodegas principal y de Funza.',
      'Equipos instalados y red inalámbrica operativa', 'Cobertura inalámbrica en patios y estanterías; lectura de etiquetas verificada en las dos bodegas.'],
    ['w33', 'w3', 'Proveedor tecnológico de facturación electrónica', 'paquete', '', R.jti,
      'Contrato con el proveedor tecnológico autorizado por la DIAN, paquete anual de documentos y ambiente de habilitación.',
      'Ambiente de habilitación disponible', 'Credenciales y certificado de firma entregados antes del 10 de septiembre de 2026.'],
    ['w4', null, 'Migración de datos', 'entregable', 'predictivo', R.po,
      'Depuración de los datos maestros y migración por release: inventario de la bodega principal (release 1), saldos de cartera (release 2) y hojas de vida de equipos (release 3), con conciliación aprobada por contabilidad y revisoría fiscal.',
      'Datos migrados y conciliados en producción', 'Diferencias de inventario de 0,5 % o menos y saldos de cartera iguales al auxiliar contable.'],
    ['w41', 'w4', 'Depuración de datos maestros', 'paquete', '', R.po,
      'Depuración de equipos, piezas, clientes, obras y tarifas: duplicados, referencias sin peso y clientes sin datos tributarios.',
      'Datos maestros depurados', 'Cero duplicados y campos obligatorios completos en las plantillas de carga.'],
    ['w42', 'w4', 'Migración del inventario', 'paquete', '', R.po,
      'Conteo físico de la bodega principal, carga de saldos por bodega y obra y conciliación.',
      'Inventario migrado y conciliado', 'Diferencia con el conteo físico de 0,5 % o menos de las piezas.'],
    ['w43', 'w4', 'Migración de saldos de cartera', 'paquete', '', R.con,
      'Carga de las facturas abiertas por cliente con sus vencimientos y conciliación con el auxiliar de cartera a la fecha de corte.',
      'Saldos de cartera migrados y conciliados', 'Saldo por cliente igual al auxiliar contable; aprobación de contabilidad y revisoría fiscal.'],
    ['w44', 'w4', 'Migración de hojas de vida de equipos', 'paquete', '', R.po,
      'Carga de las hojas de vida, inspecciones vigentes y planes de mantenimiento de los equipos serializados.',
      'Hojas de vida migradas', 'Cada equipo serializado con su última inspección y su plan de mantenimiento.'],
    ['w5', null, 'Capacitación y gestión del cambio', 'entregable', 'predictivo', R.dir,
      'Plan de gestión del cambio y comunicaciones, red de usuarios clave, formación de usuarios clave y capacitación de usuarios finales antes de cada salida en vivo.',
      'Usuarios capacitados y preparados para cada release', '90 % de los usuarios de cada release capacitados y evaluados antes de su salida en vivo.'],
    ['w51', 'w5', 'Gestión del cambio y comunicaciones', 'paquete', '', R.dir,
      'Análisis de impacto por área, red de usuarios clave, plan de comunicaciones y seguimiento de la adopción.',
      'Plan de gestión del cambio', 'Plan aprobado por el dueño del producto y comunicado a las áreas.'],
    ['w52', 'w5', 'Formación de usuarios clave', 'paquete', '', R.dir,
      'Formación de los usuarios clave en el ERP estándar antes de la iteración 2 para que participen en el refinamiento y en las pruebas.',
      'Usuarios clave formados', 'Evaluación aprobada por los usuarios clave de las áreas usuarias.'],
    ['w53', 'w5', 'Capacitación de usuarios finales por release', 'paquete', '', R.po,
      'Capacitación por rol y guías rápidas antes de cada salida en vivo.',
      'Usuarios finales capacitados por release', 'Asistencia y evaluación registradas antes de cada salida en vivo.'],
    ['w6', null, 'Release 1 · Inventario y alquiler de equipos', 'entregable', 'adaptativo', R.po,
      'Incremento del producto por iteraciones (1 a 4): catálogo e inventario por bodega y obra, despachos y devoluciones con actas, contratos y liquidación del alquiler, e integración con las básculas de despacho (CC-001).',
      'Release 1 aceptado por el dueño del producto', 'Historias «Debe tener» terminadas y aceptadas; prueba de aceptación firmada por los usuarios clave.'],
    ['w7', null, 'Release 2 · Facturación electrónica y cartera', 'entregable', 'adaptativo', R.po,
      'Incremento del producto por iteraciones (5 a 8): base tributaria, prefactura desde las actas, factura electrónica con el proveedor tecnológico, notas crédito y débito, recaudo y cartera por edades.',
      'Release 2 aceptado por el dueño del producto', 'Facturas validadas por la DIAN en habilitación; prueba de aceptación firmada por facturación, cartera y contabilidad.'],
    ['w8', null, 'Release 3 · Mantenimiento y tablero gerencial', 'entregable', 'adaptativo', R.po,
      'Incremento del producto por iteraciones (9 a 11): hojas de vida, inspecciones, mantenimiento correctivo y preventivo con costos, y tablero gerencial de utilización, ingresos y cartera.',
      'Release 3 aceptado por el dueño del producto', 'Historias «Debe tener» terminadas y aceptadas; tablero validado por la Gerencia General.'],
    ['w9', null, 'Salidas en vivo y estabilización', 'entregable', 'predictivo', R.jti,
      'Plan de corte, ensayo y salida a producción de cada release fuera del cierre mensual, y estabilización (hypercare) con el implementador antes de pasar al soporte.',
      'Releases en producción y solución estabilizada', 'Cada salida con plan de reversión probado; cero incidentes críticos abiertos al final de la estabilización.'],
    ['w91', 'w9', 'Salida en vivo del release 1', 'paquete', '', R.jti,
      'Corte del inventario, carga de saldos y salida a producción del release 1.', 'Release 1 en producción', 'Inventario cargado y conciliado; primera remisión emitida en producción.'],
    ['w92', 'w9', 'Salida en vivo del release 2', 'paquete', '', R.jti,
      'Corte de cartera, carga de saldos y salida a producción del release 2 después del cierre mensual de noviembre.', 'Release 2 en producción', 'Primera factura electrónica validada por la DIAN en producción.'],
    ['w93', 'w9', 'Salida en vivo del release 3', 'paquete', '', R.jti,
      'Carga de hojas de vida y salida a producción del release 3 después del cierre anual.', 'Release 3 en producción', 'Primera orden de mantenimiento y tablero gerencial en producción.'],
    ['w94', 'w9', 'Estabilización (hypercare) y transición al soporte', 'paquete', '', R.jti,
      'Acompañamiento intensivo del implementador durante trece días hábiles, atención de incidentes y transferencia al soporte de TI.', 'Solución estabilizada y soporte transferido', 'Cero incidentes críticos abiertos y acta de transferencia firmada por el jefe de TI.'],
  ];

  /* ---------------------------------------------------------------- cronograma
     Plan con avance al 9 de octubre de 2026. start: restricción «no comenzar antes de». loe: esfuerzo de nivel (avance
     proporcional al tiempo transcurrido; la duración se calcula con el calendario hasta el fin del proyecto). Las
     actividades de los releases toman su avance del backlog (PM.agile.applyToSchedule); el avance guardado coincide. */
  const FS = (id, lag) => ({ id, type: 'FS', lag: lag || 0 });
  const SS = (id, lag) => ({ id, type: 'SS', lag: lag || 0 });
  const FF = (id, lag) => ({ id, type: 'FF', lag: lag || 0 });
  /* ---------------------------------------------------------------- catálogo de recursos (SPEC §10)
     Un recurso por cada nombre de las asignaciones del cronograma (mismo nombre; las asignaciones llevan resourceId). Costo
     unitario por día hábil (calendario de lunes a viernes) o por unidad de medida (consumibles). El equipo del implementador
     cobra COP 82.500 por hora: consultor funcional, desarrollador ERP y la mitad del desarrollador de integraciones y del
     analista de pruebas suman las 240 horas por iteración del precio fijo (COP 19,8 millones); el analista de TI interno cuesta
     COP 4,2 millones por iteración. Por eso las actividades de los releases y de la estabilización cuadran con sus recursos:
     t26 se calcula de forma mixta (bolsa fija de COP 8,0 millones del conector más el equipo) y t34 por recursos (208 horas
     del implementador y trece días del analista de TI). El tiempo del dueño del producto no se imputa al proyecto.
     Equipo Scrum (agileTeam): las cinco personas del equipo de desarrollo, dos al 50 % («4 personas equivalentes × 10 días
     hábiles = 40 días-persona»), con las ausencias de las planificaciones: incapacidad del desarrollador ERP en la iteración 5
     (37 días-persona), vacaciones del analista de TI en la iteración 6 (38) y vacaciones del analista de pruebas en la
     iteración 8 (37,5), que la capacidad sugerida de esa iteración refleja. Tipos del preset «Tecnología y sistemas». */
  const TEAM_ABS = {
    de: [{ id: 'aus-de-1', from: '2026-09-15', to: '2026-09-17', note: 'Incapacidad médica (iteración 5)' }],
    at: [{ id: 'aus-at-1', from: '2026-10-01', to: '2026-10-02', note: 'Vacaciones (iteración 6)' }],
    ap: [{ id: 'aus-ap-1', from: '2026-10-26', to: '2026-10-30', note: 'Vacaciones (iteración 8)' }],
  };
  const IMPL = 'Socio implementador';
  const IMPL_CT = 'Contrato de implementación por iteraciones de precio fijo';
  /* [clave, nombre, tipo, subtipo, unidad, disponibilidad, costo unitario, origen, extra] */
  const CATALOG = [
    ['dir', R.dir, 'personas', 'Dirección y PMO', 'persona', 1, 628600, 'Interno', { dedication: 25, notes: 'Jefe de la PMO al 25 %: COP 3,3 millones al mes (COP 13,2 millones a tiempo completo ÷ 21 días hábiles).' }],
    ['sm', R.sm, 'personas', 'Equipo Scrum', 'persona', 1, 360000, 'Interno', { dedication: 50, notes: 'Facilitador al 50 %: COP 1,8 millones por iteración de 10 días hábiles (COP 360.000 por día a tiempo completo). No cuenta en la capacidad del equipo de desarrollo.' }],
    ['po', R.po, 'personas', 'Equipo Scrum', 'persona', 1, 0, 'Interno', { dedication: 25, notes: 'Gerente administrativo y financiero al 25 %: su tiempo es gasto de operación y no se imputa al presupuesto del proyecto (costo unitario 0).' }],
    ['cf', R.cf, 'consultoria', 'Equipo del implementador', 'persona', 1, 660000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, agileTeam: true, notes: '8 horas × COP 82.500. Dedicación completa al equipo Scrum.' }],
    ['de', R.de, 'consultoria', 'Equipo del implementador', 'persona', 1, 660000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, agileTeam: true, absences: TEAM_ABS.de, notes: '8 horas × COP 82.500. Incapacidad médica del 15 al 17 de septiembre (iteración 5: 37 días-persona).' }],
    ['di', R.di, 'consultoria', 'Equipo del implementador', 'persona', 1, 660000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, agileTeam: true, dedication: 50, notes: '8 horas × COP 82.500, al 50 % en el equipo Scrum (conector con el proveedor tecnológico de facturación electrónica y básculas).' }],
    ['ap', R.ap, 'consultoria', 'Equipo del implementador', 'persona', 1, 660000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, agileTeam: true, dedication: 50, absences: TEAM_ABS.ap, notes: '8 horas × COP 82.500, al 50 %. Vacaciones del 26 al 30 de octubre (iteración 8).' }],
    ['at', R.at, 'personas', 'Equipo Scrum', 'persona', 1, 420000, 'Interno', { agileTeam: true, absences: TEAM_ABS.at, notes: 'COP 4,2 millones por iteración de 10 días hábiles. Vacaciones el 1 y el 2 de octubre (iteración 6: 38 días-persona).' }],
    ['uc', R.uc, 'personas', 'Áreas usuarias', 'persona', 6, 180000, 'Interno', { notes: 'Costo promedio por día de un usuario clave de comercial, logística, almacén, mantenimiento, facturación y cartera (horas internas).' }],
    ['alm', R.alm, 'personas', 'Áreas usuarias', 'persona', 8, 120000, 'Interno', { notes: 'Auxiliares de bodega de las bodegas principal y de Funza (horas internas; el conteo físico se pagó con horas extra).' }],
    ['con', R.con, 'personas', 'Áreas usuarias', 'persona', 1, 250000, 'Interno', { notes: 'Contador de la empresa: conciliaciones de inventario y de cartera y aprobación de los saldos migrados.' }],
    ['jti', R.jti, 'personas', 'Tecnología (TI)', 'persona', 1, 650000, 'Interno', { notes: 'Responsable de infraestructura, seguridad, equipos de bodega y transferencia al soporte.' }],
    ['csel', R.csel, 'consultoria', 'Asesores externos', 'persona', 1, 780000, 'Contratado', { supplier: 'Consultor de selección de ERP (independiente)', status: 'liberado', notes: 'Descubrimiento, solicitud de propuestas y evaluación de ofertas (mayo y junio de 2026).' }],
    ['cgc', R.cgc, 'consultoria', 'Asesores externos', 'persona', 1, 1300000, 'Contratado', { supplier: 'Consultor de gestión del cambio', status: 'liberado', notes: 'Plan de gestión del cambio, red de usuarios clave y comunicaciones (julio de 2026).' }],
    ['jur', R.jur, 'consultoria', 'Asesores externos', 'persona', 1, 1080000, 'Contratado', { supplier: 'Firma de abogados', status: 'liberado', notes: 'Revisión de los contratos de suscripción e implementación (junio de 2026).' }],
    ['ins', R.ins, 'consultoria', 'Equipo del implementador', 'persona', 1, 660000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, notes: '8 horas × COP 82.500: formación de usuarios clave y capacitación de usuarios finales de cada release.' }],
    ['lim', R.lim, 'consultoria', 'Equipo del implementador', 'persona', 1, 760000, 'Contratado', { supplier: IMPL, contract: IMPL_CT, notes: '8 horas × COP 95.000: ambientes, perfiles y salidas a producción.' }],
    ['suc', 'Suscripción del ERP: usuario completo', 'licencias', 'Suscripción del ERP', 'usuario-mes', null, 320000, 'Contratado', { supplier: 'Fabricante del ERP', contract: 'Contrato de suscripción', notes: '30 usuarios completos de julio de 2026 a enero de 2027 (siete meses).' }],
    ['sul', 'Suscripción del ERP: usuario limitado', 'licencias', 'Suscripción del ERP', 'usuario-mes', null, 96000, 'Contratado', { supplier: 'Fabricante del ERP', contract: 'Contrato de suscripción', notes: '15 usuarios limitados de julio de 2026 a enero de 2027 (siete meses).' }],
    ['fe', 'Paquete anual de facturación electrónica (6.000 documentos)', 'licencias', 'Facturación electrónica', 'paquete', null, 4200000, 'Contratado', { supplier: 'Proveedor tecnológico autorizado por la DIAN', status: 'liberado', notes: 'Habilitación y paquete anual de 6.000 documentos electrónicos.' }],
    ['tab', 'Tableta robusta para bodega', 'equipos', 'Equipos de bodega', 'unidad', null, 2800000, 'Compra', { supplier: 'Distribuidor de equipos de cómputo', status: 'liberado', notes: 'Con funda y lápiz. Importadas: llegaron dos días hábiles tarde (INC-001) y la tasa de cambio las encareció.' }],
    ['lec', 'Lector de código de barras inalámbrico', 'equipos', 'Equipos de bodega', 'unidad', null, 1100000, 'Compra', { supplier: 'Distribuidor de equipos de cómputo', status: 'liberado', notes: 'Seis lectores para despachos, devoluciones y conteos.' }],
    ['imp', 'Impresora de etiquetas', 'equipos', 'Equipos de bodega', 'unidad', null, 1600000, 'Compra', { supplier: 'Distribuidor de equipos de cómputo', status: 'liberado', notes: 'Una por bodega para las etiquetas de los equipos serializados.' }],
    ['red', 'Red inalámbrica de bodegas (puntos de acceso e instalación)', 'infraestructura', 'Conectividad de bodegas', 'global', null, 7000000, 'Contratado', { supplier: 'Integrador de redes', status: 'liberado', notes: 'Cobertura en patios y estanterías de las bodegas principal y de Funza.' }],
    /* no planificados */
    ['tpr', 'Tabletas de prueba del implementador', 'equipos', 'Equipos de bodega', 'unidad', 4, 0, 'Contratado', { kind: 'trabajo', planned: false, reason: 'todo-costo', supplier: IMPL, status: 'liberado', addedDate: '2026-07-22', notes: 'Mientras se configuraban las tabletas importadas, que llegaron dos días hábiles tarde (INC-001), el equipo usó las tabletas de prueba del implementador en la iteración 2, a su costo dentro del precio fijo: sin costo para el proyecto.' }],
    ['hex', 'Horas extra del equipo (ensayo de corte del release 1)', 'personas', 'Equipo Scrum', 'hora', null, 45000, 'Interno', { kind: 'consumible', planned: false, reason: 'rendimiento', status: 'liberado', addedDate: '2026-09-03', notes: 'Horas extra del ensayo de corte de la iteración 4 (COP 1,8 millones, nómina de septiembre): mayor costo del release 1 registrado como variación (CPI del release 0,98); no cambia la línea base.' }],
  ];
  const RES_ID = Object.fromEntries(CATALOG.map(([key, name]) => [name, 'rec-' + key]));
  const qty = (key, q) => { const c = CATALOG.find((x) => x[0] === key); return { resourceId: 'rec-' + key, name: c[1], units: 0, qty: q }; };
  const resourcesData = () => ({
    preset: 'ti',
    types: PM.RES && PM.RES.PRESETS && PM.RES.PRESETS.ti ? PM.clone(PM.RES.PRESETS.ti.types) : [],
    items: CATALOG.map(([key, name, typeId, subtype, unit, availability, unitCost, origin, x], i) => ({
      id: 'rec-' + key, code: 'REC-' + String(i + 1).padStart(3, '0'), name, typeId, subtype, ...(x.kind ? { kind: x.kind } : {}),
      unit, availability, availableFrom: x.availableFrom || null, availableTo: x.availableTo || null, unitCost,
      origin, supplier: x.supplier || '', contract: x.contract || '', responsible: x.responsible || '', status: x.status || 'disponible',
      planned: x.planned !== false, addedDate: x.addedDate || START, reason: x.reason || null, riskId: null, reserveAmount: null, changeRef: null,
      agileTeam: !!x.agileTeam, dedication: x.dedication === undefined ? 100 : x.dedication, hoursPerDay: 8,
      absences: (x.absences || []).map((a) => ({ ...a })), notes: x.notes || '',
    })),
  });

  const res = (...pairs) => pairs.map(([name, units]) => ({ resourceId: RES_ID[name] || null, name, units }));
  const TEAM = res([R.cf, 1], [R.de, 1], [R.di, 0.5], [R.ap, 0.5], [R.at, 1], [R.po, 0.25]);
  const TASKS = [
    { id: 't01', name: 'Acta de constitución aprobada', wbsId: 'w11', duration: 0, milestone: true, deps: [], cost: 0, responsible: R.pat, done: ['2026-05-04', '2026-05-04'], notes: 'Aprobada por la Gerencia General con un presupuesto preliminar; actualizada con los contratos y la LB0 el 10 de julio.' },
    { id: 't02', name: 'Registro de interesados y reunión de arranque', wbsId: 'w11', duration: 2, deps: [FS('t01')], cost: mm(1.4), resources: res([R.dir, 0.5]), responsible: R.dir, done: ['2026-05-04', '2026-05-05'] },
    { id: 't07', name: 'Descubrimiento: procesos actuales y requisitos de alto nivel', wbsId: 'w21', duration: 15, deps: [FS('t01')], cost: mm(14.5), resources: res([R.csel, 1], [R.uc, 3], [R.po, 0.5]), responsible: R.po, done: ['2026-05-04', '2026-05-25'] },
    { id: 't08', name: 'Solicitud de propuestas a cinco fabricantes e implementadores', wbsId: 'w22', duration: 10, deps: [FS('t07')], cost: mm(4.8), resources: res([R.csel, 1], [R.jti, 0.5]), responsible: R.dir, done: ['2026-05-26', '2026-06-09'] },
    { id: 't09', name: 'Demostraciones guiadas y evaluación de ofertas', wbsId: 'w22', duration: 8, deps: [FS('t08')], cost: mm(7.6), resources: res([R.csel, 1], [R.uc, 4], [R.po, 0.5], [R.jti, 0.5]), responsible: R.dir, done: ['2026-06-10', '2026-06-22'], notes: 'Tres finalistas con los mismos guiones de negocio (pedido, despacho, devolución, liquidación y factura).' },
    { id: 't10', name: 'Negociación y firma de los contratos de suscripción e implementación', wbsId: 'w23', duration: 5, deps: [FS('t09')], cost: mm(5.2), resources: res([R.jur, 1], [R.dir, 0.5]), responsible: R.dir, done: ['2026-06-23', '2026-06-30'] },
    { id: 't11', name: 'Contratos firmados con el fabricante y el socio implementador', wbsId: 'w23', duration: 0, milestone: true, deps: [FS('t10')], cost: 0, responsible: R.pat, done: ['2026-06-30', '2026-06-30'] },
    { id: 't03', name: 'Plan para la dirección del proyecto, plan de releases y línea base LB0', wbsId: 'w12', duration: 8, deps: [FS('t11')], cost: mm(6.5), resources: res([R.dir, 0.5], [R.po, 0.25]), responsible: R.dir, done: ['2026-07-01', '2026-07-10'], notes: 'LB0 aprobada por la Gerencia General el 10 de julio de 2026.' },
    { id: 't04', name: 'Dirección del proyecto y comités (esfuerzo de nivel)', wbsId: 'w13', loe: true, deps: [SS('t01')], cost: mm(29.7), resources: res([R.dir, 0.25]), responsible: R.dir, actualStart: '2026-05-04', notes: 'Esfuerzo de nivel: el avance es proporcional al tiempo transcurrido. Jefe de la PMO al 25 % de mayo de 2026 a enero de 2027.' },
    { id: 't35', name: 'Facilitación ágil: Scrum Master de las iteraciones 1 a 11 (esfuerzo de nivel)', wbsId: 'w13', loe: true, deps: [SS('t25')], cost: mm(19.8), resources: res([R.sm, 0.5]), responsible: R.sm, actualStart: '2026-07-13', notes: 'Esfuerzo de nivel: Scrum Master al 50 % durante las once iteraciones (COP 1,8 millones por iteración).' },
    { id: 't12', name: 'Suscripción del ERP en la nube (julio de 2026 a enero de 2027)', wbsId: 'w31', loe: true, deps: [FS('t11')], cost: mm(77.28), resources: [qty('suc', 210), qty('sul', 105)], responsible: R.jti, actualStart: '2026-07-01', notes: '45 usuarios: 30 completos a COP 320.000 y 15 limitados a COP 96.000 por mes (COP 11,04 millones mensuales, facturación mensual vencida). Desde febrero de 2027 pasa al presupuesto de operación de TI.' },
    { id: 't13', name: 'Aprovisionamiento de ambientes, usuarios, perfiles y seguridad', wbsId: 'w31', duration: 5, deps: [FS('t11')], cost: mm(3.1), resources: res([R.lim, 1], [R.jti, 0.5]), responsible: R.jti, done: ['2026-07-01', '2026-07-07'] },
    { id: 't14', name: 'Tabletas, lectores de código de barras, impresoras de etiquetas y red inalámbrica de bodegas', wbsId: 'w32', duration: 15, deps: [FS('t11')], cost: mm(28), resources: [...res([R.jti, 0.5]), qty('tab', 4), qty('lec', 6), qty('imp', 2), qty('red', 1)], responsible: R.jti, done: ['2026-07-01', '2026-07-24'], notes: 'Las tabletas llegaron dos días hábiles tarde; la tasa de cambio encareció los equipos importados.' },
    { id: 't15', name: 'Contrato y habilitación con el proveedor tecnológico de facturación electrónica', wbsId: 'w33', duration: 10, start: '2026-08-18', deps: [FS('t11')], cost: mm(4.2), resources: [...res([R.jti, 0.5], [R.con, 0.5]), qty('fe', 1)], responsible: R.jti, done: ['2026-08-18', '2026-08-31'] },
    { id: 't16', name: 'Depuración de datos maestros: equipos, piezas, clientes, obras y tarifas', wbsId: 'w41', duration: 20, deps: [FS('t03')], cost: mm(12.6), resources: res([R.uc, 2], [R.alm, 2]), responsible: R.po, done: ['2026-07-13', '2026-08-14'], notes: 'Tres días hábiles más de lo previsto: 14 % de las referencias sin peso unitario y clientes duplicados (riesgo R-001).' },
    { id: 't17', name: 'Conteo físico y migración del inventario de la bodega principal', wbsId: 'w42', duration: 8, start: '2026-08-27', deps: [FS('t16')], cost: mm(14.8), resources: res([R.alm, 6], [R.uc, 1]), responsible: R.po, done: ['2026-08-27', '2026-09-07'], notes: 'Diferencia final de 0,4 % de las piezas frente al conteo físico.' },
    { id: 't18', name: 'Migración y conciliación de saldos de cartera', wbsId: 'w43', duration: 15, start: '2026-10-01', deps: [FS('t16')], cost: mm(8.4), resources: res([R.con, 1], [R.uc, 1]), responsible: R.con, progress: 30, actualStart: '2026-10-01', notes: 'En espera del auxiliar de cartera conciliado a 30 de septiembre (ver TA-011, bloqueado en la iteración 7).' },
    { id: 't19', name: 'Migración de hojas de vida y planes de mantenimiento de equipos', wbsId: 'w44', duration: 10, start: '2026-11-24', deps: [FS('t16')], cost: mm(7.2), resources: res([R.uc, 1], [R.alm, 1]), responsible: R.po },
    { id: 't20', name: 'Plan de gestión del cambio, red de usuarios clave y comunicaciones', wbsId: 'w51', duration: 5, deps: [FS('t11')], cost: mm(6.8), resources: res([R.cgc, 1]), responsible: R.dir, done: ['2026-07-01', '2026-07-07'] },
    { id: 't21', name: 'Formación de usuarios clave en el ERP', wbsId: 'w52', duration: 5, start: '2026-07-21', deps: [FS('t13')], cost: mm(9.6), resources: res([R.ins, 1], [R.uc, 4]), responsible: R.dir, done: ['2026-07-21', '2026-07-27'] },
    { id: 't22', name: 'Capacitación de usuarios finales del release 1', wbsId: 'w53', duration: 6, start: '2026-09-01', deps: [FS('t21')], cost: mm(8.2), resources: res([R.ins, 1]), responsible: R.po, done: ['2026-09-01', '2026-09-08'] },
    { id: 't23', name: 'Capacitación de usuarios finales del release 2', wbsId: 'w53', duration: 6, start: '2026-10-29', deps: [FS('t22')], cost: mm(7.4), resources: res([R.ins, 1]), responsible: R.po },
    { id: 't24', name: 'Capacitación de usuarios finales del release 3', wbsId: 'w53', duration: 6, start: '2026-12-14', deps: [FS('t23')], cost: mm(6.6), resources: res([R.ins, 1]), responsible: R.po },
    { id: 't25', name: 'Release 1: inventario y alquiler de equipos (iteraciones 1 a 4)', wbsId: 'w6', releaseId: 'rel-1', duration: 40, deps: [FS('t03')], cost: mm(96), resources: TEAM, responsible: R.po, notes: 'Avance calculado desde el backlog del release 1 (terminado ÷ alcance).' },
    { id: 't26', name: 'Release 2: facturación electrónica y cartera (iteraciones 5 a 8)', wbsId: 'w7', releaseId: 'rel-2', duration: 40, deps: [FS('t25')], cost: mm(104), costMode: 'mixto', costFixed: mm(8), resources: TEAM, responsible: R.po, notes: 'Avance calculado desde el backlog del release 2 (terminado ÷ alcance). Costo mixto: bolsa fija de COP 8,0 millones de horas del implementador para el conector más el equipo (40 días hábiles × COP 2,4 millones = COP 96,0 millones).' },
    { id: 't27', name: 'Release 3: mantenimiento y tablero gerencial (iteraciones 9 a 11)', wbsId: 'w8', releaseId: 'rel-3', duration: 30, deps: [FS('t26')], cost: mm(78), resources: TEAM, responsible: R.po, notes: 'Avance calculado desde el backlog del release 3 (terminado ÷ alcance).' },
    { id: 't28', name: 'Corte y salida a producción del release 1', wbsId: 'w91', duration: 1, deps: [FS('t25'), FS('t17'), FS('t22')], cost: mm(4.6), resources: res([R.lim, 1], [R.jti, 1], [R.alm, 2]), responsible: R.jti, done: ['2026-09-10', '2026-09-10'] },
    { id: 't29', name: 'Release 1 en producción', wbsId: 'w91', duration: 0, milestone: true, deps: [FS('t28')], cost: 0, responsible: R.po, done: ['2026-09-10', '2026-09-10'] },
    { id: 't30', name: 'Corte y salida a producción del release 2', wbsId: 'w92', duration: 1, start: '2026-11-10', deps: [FS('t26'), FS('t18'), FS('t23')], cost: mm(4.6), resources: res([R.lim, 1], [R.jti, 1], [R.con, 1]), responsible: R.jti, notes: 'Después de los cinco primeros días hábiles de noviembre (cierre mensual).' },
    { id: 't31', name: 'Release 2 en producción', wbsId: 'w92', duration: 0, milestone: true, deps: [FS('t30')], cost: 0, responsible: R.po },
    { id: 't32', name: 'Corte y salida a producción del release 3', wbsId: 'w93', duration: 1, start: '2027-01-12', deps: [FS('t27'), FS('t19'), FS('t24')], cost: mm(4.6), resources: res([R.lim, 1], [R.jti, 1], [R.alm, 2]), responsible: R.jti, notes: 'Después del cierre anual y de los cinco primeros días hábiles de enero de 2027.' },
    { id: 't33', name: 'Release 3 en producción', wbsId: 'w93', duration: 0, milestone: true, deps: [FS('t32')], cost: 0, responsible: R.po },
    { id: 't34', name: 'Estabilización (hypercare) y transición al soporte', wbsId: 'w94', duration: 13, deps: [FS('t32')], cost: mm(22.62), costMode: 'recursos', resources: res([R.cf, 1], [R.de, 1], [R.at, 1]), responsible: R.jti, notes: 'Consultor funcional y desarrollador ERP del implementador (208 horas a COP 82.500) y analista de TI durante trece días hábiles. Costo calculado por recursos.' },
    { id: 't05', name: 'Informe final, lecciones aprendidas y acta de cierre', wbsId: 'w14', duration: 3, deps: [FF('t34')], cost: mm(3.2), resources: res([R.dir, 0.5]), responsible: R.dir },
    { id: 't06', name: 'Cierre del proyecto', wbsId: 'w14', duration: 0, milestone: true, deps: [FS('t05'), FS('t34')], cost: 0, responsible: R.pat },
  ];
  /* Categoría de costo (SPEC §10.1, PM.RES.COST_CATEGORIES) de cada actividad con presupuesto, para la estructura de desglose
     de costos por categoría: tiempo del personal interno (dirección, facilitación, migración y conciliaciones) → Mano de obra;
     consultores externos, implementador (iteraciones de precio fijo, capacitación y salidas en vivo), suscripción del ERP y
     proveedor de facturación electrónica → Servicios; tabletas, lectores, impresoras y red de bodegas → Equipos. En t26
     (mixta) es la categoría de la bolsa fija del implementador; en t34 (por recursos) cada línea va por el tipo del recurso.
     Es un dato opcional: no cambia el costo ni el valor ganado. */
  const COST_CAT = {
    t02: 'Mano de obra', t03: 'Mano de obra', t04: 'Mano de obra', t35: 'Mano de obra', t05: 'Mano de obra',
    t16: 'Mano de obra', t17: 'Mano de obra', t18: 'Mano de obra', t19: 'Mano de obra',
    t07: 'Servicios', t08: 'Servicios', t09: 'Servicios', t10: 'Servicios', t12: 'Servicios', t13: 'Servicios', t15: 'Servicios', t20: 'Servicios',
    t21: 'Servicios', t22: 'Servicios', t23: 'Servicios', t24: 'Servicios', t25: 'Servicios', t26: 'Servicios', t27: 'Servicios',
    t28: 'Servicios', t30: 'Servicios', t32: 'Servicios', t34: 'Servicios',
    t14: 'Equipos',
  };

  /* ---------------------------------------------------------------- capa ágil: configuración, releases e iteraciones */
  const COLUMNS = [
    { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null },
    { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 3 },
    { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 },
    { id: 'pruebas-usuario', name: 'Pruebas de usuario', category: 'en-curso', wip: 2 },
    { id: 'terminado', name: 'Terminado', category: 'terminado', wip: null },
  ];
  /* la columna «Pruebas de usuario» se agregó en la retrospectiva de la iteración 3 (26 de agosto; acta retrospectiva--it3) */
  const UAT_FROM = '2026-08-27';
  const AGILE_SETTINGS = { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, columns: COLUMNS, scopeChangeThreshold: 10 };
  const REL = {
    r1: { id: 'rel-1', name: 'Release 1: inventario y alquiler de equipos', goal: 'Controlar en el ERP cada equipo por bodega, obra y estado, y calcular el alquiler desde las actas de entrega y devolución.', start: '2026-07-13', end: '2026-09-09', status: 'cerrado', budget: mm(96), plannedSprints: 4, wbsId: 'w6', taskId: 't25',
      baseline: { date: CC1_DATE, points: 118, end: '2026-09-09', budget: mm(96), sprints: 4, changeRef: 'CC-001' },
      notes: 'Línea base inicial del 10 de julio de 2026: 102 puntos. Actualizada el 13 de agosto con el CC-001 (integración con las básculas de despacho, +13 puntos; sin cambio de fecha ni de presupuesto). En producción desde el 10 de septiembre de 2026. Presupuesto: cuatro iteraciones de COP 24,0 millones (implementador a precio fijo, COP 19,8 millones, y analista de TI, COP 4,2 millones).' },
    r2: { id: 'rel-2', name: 'Release 2: facturación electrónica y cartera', goal: 'Facturar el alquiler el mismo día del corte con factura electrónica validada por la DIAN y llevar la cartera por edades.', start: '2026-09-10', end: '2026-11-06', status: 'en-curso', budget: mm(104), plannedSprints: 4, wbsId: 'w7', taskId: 't26',
      baseline: { date: '2026-09-10', points: 112, end: '2026-11-06', budget: mm(104), sprints: 4, changeRef: null },
      notes: 'Comprometido el 10 de septiembre de 2026 (planificación de la iteración 5). Salida a producción programada para el 10 de noviembre, después del cierre mensual. Presupuesto: cuatro iteraciones de COP 24,0 millones más una bolsa de COP 8,0 millones de horas del implementador para el conector con el proveedor tecnológico de facturación electrónica.' },
    r3: { id: 'rel-3', name: 'Release 3: mantenimiento y tablero gerencial', goal: 'Programar y costear el mantenimiento de los equipos y dar a la gerencia indicadores diarios de utilización, ingresos y cartera.', start: '2026-11-09', end: '2026-12-22', status: 'planeado', budget: mm(78), plannedSprints: 3, wbsId: 'w8', taskId: 't27',
      baseline: null,
      notes: 'Hoja de ruta: se compromete con línea base en la planificación de la iteración 9. Salida a producción el 12 de enero de 2027, después del cierre anual. Presupuesto: tres iteraciones de COP 24,0 millones más una bolsa de COP 6,0 millones de horas del implementador para el modelo de datos del tablero gerencial.' },
  };
  /* [id, nombre, release, inicio, fin, estado, capacidad, comprometido, terminado, objetivo] */
  const SPRINTS = [
    ['spr-01', 'Iteración 1', 'r1', '2026-07-13', '2026-07-27', 'cerrado', 30, 27, 24, 'Tener el catálogo de equipos y la consulta de disponibilidad por bodega con datos reales de la bodega principal.'],
    ['spr-02', 'Iteración 2', 'r1', '2026-07-28', '2026-08-11', 'cerrado', 31, 31, 31, 'Despachar desde el ERP: remisión generada desde el pedido y acta de entrega firmada en la tableta.'],
    ['spr-03', 'Iteración 3', 'r1', '2026-08-12', '2026-08-26', 'cerrado', 33, 34, 31, 'Registrar las devoluciones con conteo por estado y los contratos de alquiler con sus tarifas.'],
    ['spr-04', 'Iteración 4', 'r1', '2026-08-27', '2026-09-09', 'cerrado', 32, 32, 32, 'Liquidar el alquiler desde las actas, integrar las básculas de despacho y ensayar la migración del inventario de la bodega principal.'],
    ['spr-05', 'Iteración 5', 'r2', '2026-09-10', '2026-09-23', 'cerrado', 32, 32, 30, 'Dejar lista la base tributaria de la facturación y conectar el ERP con el ambiente de habilitación del proveedor tecnológico.'],
    ['spr-06', 'Iteración 6', 'r2', '2026-09-24', '2026-10-07', 'cerrado', 31, 31, 26, 'Emitir la factura electrónica mensual de alquiler validada por la DIAN en el ambiente de habilitación, a partir de las actas de entrega y devolución del release 1.'],
    ['spr-07', 'Iteración 7', 'r2', '2026-10-08', '2026-10-22', 'en-curso', 32, 31, null, 'Enviar la factura al cliente con su representación gráfica completa y empezar la cartera: recaudos y cartera por edades.'],
    ['spr-08', 'Iteración 8', 'r2', '2026-10-23', '2026-11-06', 'planeado', 32, null, null, 'Cerrar la cartera del release 2: estado de cuenta, bloqueo por mora, acuerdos de pago y migración de saldos conciliada.'],
    ['spr-09', 'Iteración 9', 'r3', '2026-11-09', '2026-11-23', 'planeado', 30, null, null, 'Hojas de vida de los equipos e inspección de seguridad antes del despacho.'],
    ['spr-10', 'Iteración 10', 'r3', '2026-11-24', '2026-12-07', 'planeado', 30, null, null, 'Mantenimiento correctivo y preventivo con costos por equipo.'],
    ['spr-11', 'Iteración 11', 'r3', '2026-12-09', '2026-12-22', 'planeado', 28, null, null, 'Tablero gerencial de utilización del inventario, ingresos y cartera.'],
  ];
  const SPRINT_BY_KEY = Object.fromEntries(SPRINTS.map((s) => [s[0], s]));
  /* documentos de cada iteración (los crean 95-example-erp-docs.js y 97-example-erp-docs-equipo.js con estos ids): acta
     de revisión y retrospectiva de cada iteración cerrada (1 a 6) y planificación de las iteraciones 1 a 7 (la 1 a la 5
     en 97-example-erp-docs-equipo.js; la 6 y la 7 en 95) */
  const SPRINT_DOCS = {
    'spr-01': { planificacion: 'planificacion-sprint--it1', revision: 'acta-revision-sprint--it1', retrospectiva: 'retrospectiva--it1' },
    'spr-02': { planificacion: 'planificacion-sprint--it2', revision: 'acta-revision-sprint--it2', retrospectiva: 'retrospectiva--it2' },
    'spr-03': { planificacion: 'planificacion-sprint--it3', revision: 'acta-revision-sprint--it3', retrospectiva: 'retrospectiva--it3' },
    'spr-04': { planificacion: 'planificacion-sprint--it4', revision: 'acta-revision-sprint--it4', retrospectiva: 'retrospectiva--it4' },
    'spr-05': { planificacion: 'planificacion-sprint--it5', revision: 'acta-revision-sprint--it5', retrospectiva: 'retrospectiva--it5' },
    'spr-06': { planificacion: 'planificacion-sprint--it6', revision: 'acta-revision-sprint--it6', retrospectiva: 'retrospectiva--it6' },
    'spr-07': { planificacion: 'planificacion-sprint--it7' },
  };

  /* ---------------------------------------------------------------- backlog del producto
     Cada fila: [código, tipo, release, iteración, épica, estimación, prioridad, valor, responsable, creado, terminado,
     título, descripción, criterios de aceptación, extra]. Los códigos son consecutivos por tipo en el orden de creación.
     terminado: fecha de terminación (doneDate) o null. extra: {status, path, blocked, blockedReason, tags, added, rolled}. */
  const CF = R.cf, DE = R.de, DI = R.di, AP = R.ap, AT = R.at;
  const MUST = 'Debe tener', SHOULD = 'Debería tener', COULD = 'Podría tener', WONT = 'No en este release';
  const EPICS = [
    ['EP-001', 'r1', 'Catálogo e inventario de equipos', '2026-07-01', 'Catálogo único de equipos y piezas, inventario por bodega, obra y estado, y disponibilidad en línea.'],
    ['EP-002', 'r1', 'Despachos y devoluciones', '2026-07-01', 'Remisiones, actas de entrega firmadas en obra, devoluciones con conteo por estado y traslados entre bodegas.'],
    ['EP-003', 'r1', 'Contratos de alquiler y liquidación', '2026-07-01', 'Contratos con tarifas y condiciones, listas de precios y liquidación del alquiler por días calendario.'],
    ['EP-004', 'r2', 'Facturación electrónica', '2026-07-01', 'Base tributaria, prefactura desde las actas, factura electrónica validada por la DIAN, representación gráfica y notas crédito.'],
    ['EP-005', 'r2', 'Cartera y recaudo', '2026-07-01', 'Recaudos, cartera por edades, estado de cuenta, bloqueo por mora y acuerdos de pago.'],
    ['EP-006', 'r3', 'Mantenimiento de equipos', '2026-07-01', 'Hojas de vida, inspecciones, órdenes de trabajo correctivas y preventivas, y costos de mantenimiento por equipo.'],
    ['EP-007', 'r3', 'Tablero gerencial', '2026-07-01', 'Indicadores diarios de utilización del inventario, ingresos por línea de negocio y cartera.'],
    ['EP-008', 'r1', 'Integración con las básculas de despacho', CC1_REQUEST, 'Peso de báscula en despachos y devoluciones y alerta de faltantes por diferencia de peso (CC-001).'],
  ];
  const ITEMS = [
    /* ===== release 1 · iteración 1 */
    ['IN-001', 'investigacion', 'r1', 'spr-01', 'EP-001', 2, MUST, 6, CF, '2026-07-02', '2026-07-15',
      'Investigar el manejo de equipos serializados (maquinaria) frente a equipos a granel (andamio y formaleta)', 'Definir cómo se controlan en el ERP las máquinas (una por serial) y las piezas de andamio, formaleta y puntales (cantidades por referencia).',
      '- Comparación de las dos formas de manejo en el ERP con un ejemplo real de cada familia.\n- Decisión documentada y aceptada por el dueño del producto: serial para la maquinaria y cantidad por referencia para andamio, formaleta y puntales.'],
    ['TA-001', 'tarea', 'r1', 'spr-01', 'EP-001', 3, MUST, 8, AT, '2026-07-02', '2026-07-16',
      'Configurar las bodegas, ubicaciones y obras en la estructura de inventario del ERP', 'Estructura de bodegas y ubicaciones sobre la que se registran los saldos de inventario.',
      '- Bodega principal (Bogotá) y bodega de Funza creadas con sus ubicaciones de estantería y patio.\n- Cada obra activa existe como ubicación del cliente para el inventario en obra.\n- Estructura validada por el jefe de almacén.'],
    ['HU-002', 'historia', 'r1', 'spr-01', 'EP-001', 3, MUST, 7, CF, '2026-07-02', '2026-07-21',
      'Clasificar los equipos por familia con su unidad de alquiler', 'Como coordinador logístico quiero clasificar los equipos por familia (andamio multidireccional, andamio tubular, formaleta, puntales y maquinaria) para consultar la disponibilidad y las tarifas por familia.',
      'Dado el catálogo de equipos, cuando se consulta por familia, entonces cada referencia pertenece a una sola familia con su unidad de alquiler (pieza, m² o día de máquina).\nLas cinco familias y sus unidades fueron validadas por el gerente comercial.'],
    ['HU-001', 'historia', 'r1', 'spr-01', 'EP-001', 5, MUST, 9, CF, '2026-07-02', '2026-07-22',
      'Registrar el catálogo de equipos y piezas con código, referencia, peso unitario y valor de reposición', 'Como jefe de almacén quiero un catálogo único de equipos y piezas para que bodega, logística y facturación usen las mismas referencias.',
      'Dado un equipo nuevo, cuando el jefe de almacén lo registra con código, referencia, familia, unidad, peso unitario y valor de reposición, entonces queda disponible para remisiones y contratos.\nDado un código que ya existe, cuando se intenta registrar de nuevo, entonces el ERP lo rechaza e indica la referencia duplicada.'],
    ['TA-002', 'tarea', 'r1', 'spr-01', 'EP-001', 3, MUST, 7, AT, '2026-07-02', '2026-07-23',
      'Preparar las plantillas de carga y las validaciones del catálogo de equipos', 'Plantillas para cargar el catálogo depurado (migración de datos maestros).',
      '- Plantilla con columnas obligatorias y listas de familias y unidades.\n- Validaciones de código duplicado, peso mayor que cero y valor de reposición.\n- Carga de prueba de 200 referencias sin errores.', { tags: ['migración'] }],
    ['HU-003', 'historia', 'r1', 'spr-01', 'EP-001', 8, MUST, 10, DE, '2026-07-02', '2026-07-27',
      'Consultar la disponibilidad de equipos por bodega, obra y estado', 'Como coordinador logístico quiero ver en línea cuántas piezas de cada referencia hay disponibles por bodega, en obra y en mantenimiento para comprometer despachos sin llamar a la bodega.',
      'Dado un pedido de 400 m² de andamio multidireccional, cuando el coordinador consulta la referencia, entonces ve las cantidades disponibles, en obra, en tránsito y en mantenimiento por bodega.\nDado un despacho confirmado, cuando se actualiza la consulta, entonces la disponibilidad descuenta las piezas despachadas en menos de un minuto.'],
    ['HU-004', 'historia', 'r1', 'spr-02', 'EP-001', 3, MUST, 8, CF, '2026-07-02', '2026-07-30',
      'Registrar los clientes y sus obras con dirección de entrega, contactos y condiciones de crédito', 'Como asesor comercial quiero registrar cada obra del cliente con su dirección y sus contactos para despachar y facturar a la obra correcta.',
      'Dado un cliente con NIT válido, cuando se crea una obra, entonces queda con dirección de entrega, contacto de obra, contacto de facturación y cupo de crédito.\nUn cliente puede tener varias obras activas y cada remisión pertenece a una sola obra.', { rolled: 'spr-01', start: '2026-07-24' }],
    /* ===== release 1 · iteración 2 */
    ['TA-003', 'tarea', 'r1', 'spr-02', 'EP-002', 2, MUST, 6, CF, '2026-07-03', '2026-07-29',
      'Configurar la numeración de remisiones y actas por bodega', 'Consecutivos y formatos impresos de los documentos de despacho, devolución y traslado.',
      '- Consecutivos independientes de remisión de despacho, acta de entrega, devolución y traslado por bodega.\n- Formatos impresos con los datos de la empresa aprobados por logística.'],
    ['IN-002', 'investigacion', 'r1', 'spr-02', 'EP-002', 2, SHOULD, 5, AT, '2026-07-03', '2026-07-31',
      'Evaluar los lectores de código de barras y las tabletas para la bodega', 'Prueba de campo de los equipos de bodega antes de la compra definitiva.',
      '- Prueba de dos modelos de lector y dos de tableta con el ERP en la bodega principal.\n- Recomendación con costo, autonomía de batería y resistencia, aprobada por el jefe de TI.'],
    ['DF-001', 'defecto', 'r1', 'spr-02', 'EP-001', 3, MUST, 8, DE, '2026-07-28', '2026-08-04',
      'La disponibilidad no descuenta las piezas en tránsito entre bodegas', 'Defecto encontrado en la revisión de la iteración 1 con un traslado de prueba de 120 montantes.',
      'Dado un traslado en tránsito de la bodega principal a Funza, cuando se consulta la disponibilidad, entonces las piezas aparecen «en tránsito» y no disponibles en ninguna de las dos bodegas.\nSe verifica con el traslado de prueba de 120 montantes de la revisión de la iteración 1.'],
    ['TA-004', 'tarea', 'r1', 'spr-02', 'EP-002', 5, MUST, 8, DE, '2026-07-03', '2026-08-05',
      'Configurar los movimientos de inventario de despacho, devolución y traslado entre bodega y obra', 'Tipos de movimiento que afectan los saldos de bodega y de obra.',
      '- Cada tipo de movimiento afecta la bodega de origen y la obra o bodega de destino.\n- Un movimiento anulado revierte los saldos.\n- Prueba con un despacho, una devolución parcial y un traslado en el ambiente de pruebas.'],
    ['HU-007', 'historia', 'r1', 'spr-02', 'EP-002', 8, MUST, 10, CF, '2026-07-03', '2026-08-06',
      'Generar la remisión de despacho desde el pedido de alquiler con las piezas por paquete', 'Como coordinador logístico quiero generar la remisión desde el pedido para no volver a digitar las piezas y despachar lo que el cliente pidió.',
      'Dado un pedido aprobado, cuando el coordinador genera la remisión, entonces lista las piezas por paquete con cantidades, peso y obra de destino.\nDado que una referencia no tiene disponibilidad suficiente, cuando se genera la remisión, entonces el ERP avisa la cantidad faltante y no permite confirmarla.'],
    ['HU-005', 'historia', 'r1', 'spr-02', 'EP-001', 3, SHOULD, 6, DE, '2026-07-02', '2026-08-10',
      'Imprimir la etiqueta con código de barras de cada equipo serializado', 'Como auxiliar de bodega quiero imprimir la etiqueta con código de barras de cada máquina para leerla con el lector al despachar y al recibir.',
      'Dado un equipo serializado, cuando el auxiliar imprime la etiqueta, entonces sale con el código de barras, la referencia y el serial en la impresora de etiquetas de la bodega.\nEl lector de la tableta identifica el equipo al leer la etiqueta.'],
    ['HU-008', 'historia', 'r1', 'spr-02', 'EP-002', 5, MUST, 9, DE, '2026-07-03', '2026-08-11',
      'Registrar el acta de entrega en obra con la firma del cliente desde la tableta', 'Como conductor de despacho quiero registrar la entrega en la obra con la firma del residente del cliente para que la fecha de inicio del alquiler quede soportada.',
      'Dado una remisión despachada, cuando el residente de obra firma en la tableta, entonces el acta queda con fecha y hora, firma, fotos y cantidades recibidas.\nSin conexión, el acta se guarda en la tableta y se sincroniza al recuperar la señal.'],
    /* ===== release 1 · iteración 3 */
    ['TA-007', 'tarea', 'r1', 'spr-03', 'EP-001', 1, MUST, 5, AT, '2026-07-06', '2026-08-13',
      'Ajustar los permisos de los perfiles de bodega y logística', 'Perfiles con permisos mínimos para la operación de bodega.',
      '- Perfiles de auxiliar de bodega, jefe de almacén y coordinador logístico con permisos mínimos.\n- Prueba con un usuario de cada perfil sin accesos indebidos a costos ni a facturación.'],
    ['HU-010', 'historia', 'r1', 'spr-03', 'EP-002', 3, SHOULD, 5, DE, '2026-07-03', '2026-08-14',
      'Trasladar equipos entre bodegas con remisión de traslado', 'Como jefe de almacén quiero trasladar equipos entre la bodega principal y la de Funza con un documento para saber siempre dónde están.',
      'Dado un traslado de la bodega principal a Funza, cuando se confirma la remisión de traslado, entonces las piezas quedan en tránsito hasta su recepción en destino.\nAl recibir, el saldo de destino aumenta y cualquier diferencia se reporta como novedad.'],
    ['TA-005', 'tarea', 'r1', 'spr-03', 'EP-001', 3, MUST, 7, AT, '2026-07-06', '2026-08-19',
      'Preparar la plantilla de carga de saldos de inventario por bodega y obra', 'Plantilla para la migración del inventario (entregable 1.4.2).',
      '- Plantilla con el saldo por referencia, bodega u obra y estado.\n- Validación contra el catálogo (sin referencias inexistentes).\n- Carga de prueba de la bodega de Funza conciliada con su conteo físico.', { tags: ['migración'] }],
    ['HU-009', 'historia', 'r1', 'spr-03', 'EP-002', 8, MUST, 10, CF, '2026-07-03', '2026-08-20',
      'Registrar la devolución en bodega con conteo por pieza y estado', 'Como auxiliar de bodega quiero registrar la devolución contando cada referencia como buena, para reparación o para baja para que el inventario y el cobro de daños sean exactos.',
      'Dado una devolución de la obra, cuando el auxiliar cuenta las piezas, entonces registra por referencia las cantidades buenas, para reparación y para baja.\nLas cantidades devueltas no pueden superar el saldo de la obra.\nLa fecha de la devolución cierra los días de alquiler de esas piezas.'],
    ['TA-006', 'tarea', 'r1', 'spr-03', 'EP-003', 3, MUST, 7, CF, '2026-07-06', '2026-08-21',
      'Parametrizar las listas de precios de alquiler por familia y por cliente', 'Listas de precios que usan los contratos y la liquidación.',
      '- Lista general por familia y listas especiales por cliente con vigencia.\n- Tarifas de julio de 2026 cargadas y revisadas por el gerente comercial.'],
    ['HU-011', 'historia', 'r1', 'spr-03', 'EP-002', 5, MUST, 8, CF, '2026-07-03', '2026-08-24',
      'Registrar los faltantes y daños de la devolución para cobrarlos al cliente', 'Como coordinador logístico quiero valorar los faltantes y los daños de cada devolución para cobrarlos con soporte.',
      'Dado una devolución con faltantes o piezas dañadas, cuando se cierra el conteo, entonces el ERP valora los faltantes al valor de reposición y los daños con la tabla de reparaciones.\nLa liquidación queda pendiente de aprobación del coordinador logístico antes de facturarse.'],
    ['HU-012', 'historia', 'r1', 'spr-03', 'EP-003', 8, MUST, 9, CF, '2026-07-06', '2026-08-25',
      'Registrar el contrato de alquiler con tarifas por equipo, mínimo de días y condiciones de cobro', 'Como asesor comercial quiero registrar el contrato de alquiler de cada obra para que la liquidación use las tarifas y condiciones pactadas.',
      'Dado un cliente con obra, cuando se registra el contrato, entonces incluye tarifas por referencia, mínimo de días, cobro de transporte, montaje y desmontaje y fecha de corte mensual.\nUn pedido de alquiler solo se aprueba si la obra tiene contrato vigente.'],
    ['HU-006', 'historia', 'r1', 'spr-04', 'EP-001', 3, SHOULD, 6, DE, '2026-07-02', '2026-08-28',
      'Consultar el kárdex de cada equipo con sus movimientos entre bodegas y obras', 'Como jefe de almacén quiero ver la historia de movimientos de cada referencia para conciliar diferencias de inventario.',
      'Dado una referencia, cuando se consulta el kárdex entre dos fechas, entonces muestra cada despacho, devolución y traslado con documento, obra, cantidad y saldo.\nEl saldo final coincide con la consulta de disponibilidad.', { rolled: 'spr-03', start: '2026-08-24' }],
    /* ===== release 1 · iteración 4 (con la integración de básculas del CC-001) */
    ['HU-038', 'historia', 'r1', 'spr-04', 'EP-008', 3, MUST, 7, DE, CC1_REQUEST, '2026-08-31',
      'Calcular el peso teórico de la remisión desde el catálogo de piezas', 'Como auxiliar de bodega quiero conocer el peso teórico de cada remisión para compararlo con el peso de la báscula.',
      'Dado una remisión con sus piezas, cuando se confirma, entonces muestra el peso teórico total con el peso unitario del catálogo.\nEl peso se recalcula si cambian las cantidades antes de despachar.', { tags: ['CC-001'] }],
    ['HU-039', 'historia', 'r1', 'spr-04', 'EP-008', 5, MUST, 8, DI, CC1_REQUEST, '2026-09-02',
      'Capturar el peso de la báscula en la remisión de despacho y en la devolución', 'Como auxiliar de bodega quiero que el peso del vehículo cargado se registre directamente desde la báscula para no transcribirlo.',
      'Dado un vehículo en la báscula de la bodega principal o de Funza, cuando el auxiliar pulsa «Capturar peso», entonces el ERP registra el peso bruto, la tara y el peso neto en la remisión.\nSi la báscula no responde, se permite el registro manual con la foto del tiquete y queda marcado.', { tags: ['CC-001'] }],
    ['HU-013', 'historia', 'r1', 'spr-04', 'EP-003', 8, MUST, 10, DE, '2026-07-06', '2026-09-03',
      'Calcular el alquiler por días calendario desde las actas de entrega y devolución', 'Como auxiliar de facturación quiero que el ERP calcule los días de alquiler de cada pieza desde las actas para no liquidar a mano en hojas de cálculo.',
      'Dado 300 m² entregados el 3 de agosto y 120 m² devueltos el 17 de agosto, cuando se liquida agosto, entonces cobra 29 días (del 3 al 31 de agosto) de los 180 m² que siguen en obra y 15 días (del 3 al 17 de agosto) de los 120 m² devueltos.\nEl mínimo de días del contrato se aplica a las piezas devueltas antes de cumplirlo.'],
    ['HU-014', 'historia', 'r1', 'spr-04', 'EP-003', 3, SHOULD, 7, CF, '2026-07-06', '2026-09-04',
      'Consultar los equipos en obra por cliente para el corte de alquiler', 'Como auxiliar de facturación quiero ver los equipos que siguen en cada obra a la fecha de corte para revisar la liquidación antes de facturar.',
      'Dado la fecha de corte mensual, cuando se consulta por cliente, entonces lista por obra las referencias, cantidades y fecha de entrega de los equipos que siguen en obra.\nEl total coincide con el saldo de la obra en el kárdex.'],
    ['TA-008', 'tarea', 'r1', 'spr-04', 'EP-001', 5, MUST, 9, AT, '2026-07-06', '2026-09-07',
      'Ensayar la carga del inventario migrado de la bodega principal en el ambiente de pruebas', 'Ensayo de la migración antes del corte del release 1.',
      '- Carga completa de los saldos de la bodega principal en el ambiente de pruebas.\n- Diferencia con el conteo físico de 0,5 % o menos de las piezas.\n- Tiempos y pasos documentados en el plan de corte del release 1.', { tags: ['migración'] }],
    ['HU-040', 'historia', 'r1', 'spr-04', 'EP-008', 5, MUST, 9, DE, CC1_REQUEST, '2026-09-09',
      'Alertar la diferencia entre el peso de la devolución y el peso teórico', 'Como jefe de almacén quiero una alerta cuando el peso devuelto no coincide con el teórico para contar por pieza solo cuando hace falta.',
      'Dado una devolución con peso neto de báscula, cuando la diferencia con el peso teórico supera 3 %, entonces el ERP alerta al jefe de almacén y exige el conteo por pieza antes de cerrar la devolución.\nLa diferencia y la decisión quedan en el historial de la devolución.', { tags: ['CC-001'] }],
    /* ===== release 2 · iteración 5 */
    ['DF-002', 'defecto', 'r2', 'spr-05', 'EP-001', 1, SHOULD, 4, DE, '2026-08-26', '2026-09-11',
      'La etiqueta de código de barras sale cortada en la impresora de la bodega de Funza', 'Encontrado en la revisión de la iteración 3; se programa en el release 2 por no impedir la salida del release 1.',
      'Dado la impresora de etiquetas de Funza, cuando se imprime la etiqueta de un equipo, entonces el código de barras sale completo y el lector lo identifica al primer intento.'],
    ['DF-004', 'defecto', 'r2', 'spr-05', 'EP-002', 1, SHOULD, 4, CF, '2026-09-03', '2026-09-11',
      'El acta de entrega no imprime el nombre del residente que firma', 'Encontrado en la prueba de aceptación del release 1.',
      'Dado un acta de entrega firmada, cuando se imprime o se envía en PDF, entonces muestra el nombre, el cargo y la firma del residente de obra.'],
    ['HU-027', 'historia', 'r2', 'spr-05', 'EP-004', 3, MUST, 8, CF, '2026-07-07', '2026-09-14',
      'Registrar los datos tributarios de los clientes', 'Como auxiliar de facturación quiero registrar NIT, responsabilidades fiscales y correo de facturación de cada cliente para que la factura electrónica no sea rechazada por datos del adquirente.',
      'Dado un cliente, cuando se completan NIT con dígito de verificación, tipo de persona, responsabilidades fiscales y correo de facturación, entonces el cliente queda habilitado para facturar.\nUn cliente sin estos datos no puede recibir facturas.'],
    ['TA-009', 'tarea', 'r2', 'spr-05', 'EP-004', 3, MUST, 8, DI, '2026-07-07', '2026-09-15',
      'Configurar el ambiente de habilitación y el certificado de firma con el proveedor tecnológico', 'Conexión técnica con el proveedor tecnológico de facturación electrónica.',
      '- Credenciales del ambiente de habilitación y certificado de firma digital instalados.\n- Envío de un documento de prueba con respuesta del proveedor tecnológico.\n- Procedimiento de renovación del certificado documentado.', { tags: ['DIAN'] }],
    ['DF-003', 'defecto', 'r2', 'spr-05', 'EP-001', 2, MUST, 6, DE, '2026-09-02', '2026-09-15',
      'El kárdex no muestra las devoluciones anuladas', 'Encontrado en la prueba de aceptación del release 1.',
      'Dado una devolución anulada, cuando se consulta el kárdex, entonces aparecen la devolución y su anulación con el saldo correcto después de cada movimiento.'],
    ['HU-028', 'historia', 'r2', 'spr-05', 'EP-004', 3, MUST, 8, CF, '2026-07-07', '2026-09-16',
      'Configurar la resolución de facturación y la numeración por tipo de documento', 'Como contador quiero que cada documento electrónico use su prefijo y rango autorizado para cumplir la resolución de facturación.',
      'Dado la resolución de facturación vigente, cuando se configura en el ERP, entonces factura, nota crédito y nota débito usan su prefijo y rango autorizado.\nEl ERP avisa cuando quedan menos de 500 números o 30 días de vigencia.', { tags: ['DIAN'] }],
    ['IN-003', 'investigacion', 'r2', 'spr-05', 'EP-004', 3, MUST, 7, DI, '2026-07-07', '2026-09-16',
      'Investigar la API del proveedor tecnológico de facturación electrónica', 'Conocer los servicios del proveedor tecnológico antes de construir la integración.',
      '- Métodos de autenticación, envío, consulta de estado y descarga de la representación gráfica probados con la documentación del proveedor.\n- Decisión sobre envío en línea o por lotes acordada con el dueño del producto.', { tags: ['DIAN'] }],
    ['DF-005', 'defecto', 'r2', 'spr-05', 'EP-002', 2, MUST, 6, DE, '2026-09-07', '2026-09-17',
      'El traslado entre bodegas permite confirmar la recepción dos veces', 'Encontrado en la prueba de aceptación del release 1.',
      'Dado un traslado ya recibido, cuando se intenta confirmar de nuevo la recepción, entonces el ERP lo impide y el saldo de destino no cambia.'],
    ['DF-006', 'defecto', 'r2', 'spr-05', 'EP-008', 2, MUST, 7, DI, '2026-09-08', '2026-09-18',
      'La báscula de Funza envía el peso con coma decimal y el ERP lo lee como entero', 'Encontrado en el ensayo de corte del release 1.',
      'Dado un peso de 12.450,5 kg en la báscula de Funza, cuando se captura en la remisión, entonces el ERP registra 12.450,5 kg.\nSe verifica con las básculas de las dos bodegas.', { tags: ['CC-001'] }],
    ['HU-029', 'historia', 'r2', 'spr-05', 'EP-004', 5, MUST, 9, CF, '2026-07-07', '2026-09-21',
      'Calcular IVA, retenciones y autorretenciones en las facturas de alquiler y de venta', 'Como contador quiero que la factura calcule los impuestos de cada concepto para no corregir a mano antes de enviarla.',
      'Dado una factura de alquiler de bienes muebles, cuando se liquida, entonces aplica IVA de 19 % e informa la retención en la fuente de 4 % que practicará el cliente agente de retención.\nContabilidad validó cinco casos tributarios antes de aceptar la historia.', { tags: ['DIAN'] }],
    ['HU-030', 'historia', 'r2', 'spr-05', 'EP-004', 5, SHOULD, 7, DE, '2026-07-07', '2026-09-23',
      'Facturar la venta de equipos, repuestos y cobros por daños', 'Como auxiliar de facturación quiero facturar ventas y cobros por daños con el mismo proceso del alquiler.',
      'Dado una liquidación de daños aprobada o una venta de repuestos, cuando se factura, entonces la factura usa el código de producto y la cuenta contable de cada concepto.\nLos cobros por daños referencian la devolución que los originó.'],
    /* ===== release 2 · iteración 6 (ejemplo de las plantillas ágiles) */
    ['IN-004', 'investigacion', 'r2', 'spr-06', 'EP-004', 3, MUST, 7, AP, '2026-09-09', '2026-09-28',
      'Investigar las reglas de rechazo de la DIAN más frecuentes en habilitación', 'Preparar las validaciones del ERP antes de enviar documentos al proveedor tecnológico.',
      '- Reglas de rechazo y casos de prueba documentados.\n- Decisión sobre las validaciones previas que hará el ERP.', { tags: ['DIAN'] }],
    ['DF-007', 'defecto', 'r2', 'spr-06', 'EP-003', 2, MUST, 7, DE, '2026-09-08', '2026-09-29',
      'Corregir el cálculo de días de alquiler cuando la devolución cae en festivo', 'Encontrado en la prueba de aceptación del release 1 con la devolución del 17 de agosto (festivo).',
      'Cuenta días calendario, festivos incluidos, según el contrato; se verifica con una devolución en día festivo.'],
    ['HU-034', 'historia', 'r2', 'spr-06', 'EP-004', 5, MUST, 8, CF, '2026-07-07', '2026-10-02',
      'Registrar notas crédito por devoluciones anticipadas de equipos', 'Como auxiliar de facturación quiero emitir la nota crédito cuando el cliente devuelve antes del corte para ajustar la factura sin anularla.',
      'Nota crédito electrónica que referencia la factura y ajusta la cartera del cliente.', { tags: ['DIAN'] }],
    ['HU-031', 'historia', 'r2', 'spr-06', 'EP-004', 8, MUST, 10, CF, '2026-07-07', '2026-10-05',
      'Generar la prefactura mensual de alquiler desde las actas de entrega y devolución', 'Como auxiliar de facturación quiero la prefactura de cada obra calculada desde las actas para cerrar el corte de alquileres en un día.',
      'Liquida los días calendario por equipo y obra con la tarifa del contrato; el auxiliar de facturación puede ajustar y aprobar antes de facturar.'],
    ['HU-032', 'historia', 'r2', 'spr-06', 'EP-004', 8, MUST, 10, DI, '2026-07-07', '2026-10-07',
      'Enviar la factura electrónica al proveedor tecnológico y registrar el CUFE y la respuesta de la DIAN', 'Como auxiliar de facturación quiero enviar la factura desde el ERP y ver su validación para no usar el portal del proveedor.',
      'Factura aceptada por la DIAN en habilitación; CUFE y estado guardados en el ERP; los rechazos se muestran con su causa.', { tags: ['DIAN'] }],
    /* HU-033: presentada como terminada el 6 de octubre y rechazada en la revisión del 7 (sin el código QR exigido) */
    ['HU-033', 'historia', 'r2', 'spr-07', 'EP-004', 5, MUST, 9, DI, '2026-07-07', null,
      'Generar la representación gráfica de la factura y enviarla al cliente por correo', 'Como auxiliar de facturación quiero que el cliente reciba el PDF y el XML de la factura en su correo de facturación sin enviarlos a mano.',
      'PDF con CUFE y código QR; envío con el XML adjunto al correo de facturación del cliente.\nVerificada con la lista de chequeo del anexo técnico vigente de la DIAN (acción de la retrospectiva de la iteración 6).',
      { tags: ['DIAN'], path: [['2026-07-07', 'backlog'], ['2026-09-24', 'por-hacer'], ['2026-09-29', 'en-curso'], ['2026-10-02', 'en-revision'], ['2026-10-05', 'pruebas-usuario'], ['2026-10-06', 'terminado'], ['2026-10-07', 'por-hacer'], ['2026-10-08', 'en-curso'], ['2026-10-09', 'en-revision']] }],
    /* ===== release 2 · iteración 7 (en curso al corte) */
    ['ME-009', 'mejora', 'r2', 'spr-07', 'EP-004', 3, MUST, 8, DI, '2026-10-07', null,
      'Validar NIT, numeración y correo del adquirente antes de enviar la factura', 'Resultado de IN-004: el ERP valida antes de enviar para evitar los rechazos más frecuentes de la DIAN.',
      'Dado una factura con NIT sin dígito de verificación, numeración vencida o correo vacío, cuando se intenta enviar, entonces el ERP la detiene y explica qué corregir.\nLas 12 reglas de rechazo documentadas en IN-004 tienen un caso de prueba.',
      { tags: ['DIAN'], path: [['2026-10-07', 'backlog'], ['2026-10-08', 'por-hacer'], ['2026-10-08', 'en-curso']] }],
    ['HU-021', 'historia', 'r2', 'spr-07', 'EP-005', 8, MUST, 9, CF, '2026-07-07', null,
      'Registrar los recaudos y aplicarlos a las facturas del cliente', 'Como auxiliar de cartera quiero aplicar cada pago a las facturas que cancela para conocer el saldo real del cliente el mismo día.',
      'Dado un pago de COP 18.400.000 de un cliente con tres facturas abiertas, cuando el auxiliar lo aplica, entonces cancela las facturas en el orden indicado y deja el saldo a favor o pendiente.\nLas retenciones practicadas por el cliente se registran con su certificado.',
      { path: [['2026-07-07', 'backlog'], ['2026-10-08', 'por-hacer'], ['2026-10-08', 'en-curso']] }],
    ['HU-022', 'historia', 'r2', 'spr-07', 'EP-005', 5, MUST, 9, DE, '2026-07-07', null,
      'Consultar la cartera por edades por cliente y por obra', 'Como jefe de cartera quiero ver la cartera por edades (corriente, 1–30, 31–60, 61–90 y más de 90 días) para priorizar el cobro.',
      'Dado la fecha de corte, cuando se consulta la cartera, entonces muestra por cliente y por obra el saldo en cada rango de edad y el total.\nEl total coincide con el saldo de la cuenta de clientes en contabilidad.',
      { path: [['2026-07-07', 'backlog'], ['2026-10-08', 'por-hacer'], ['2026-10-09', 'en-curso']] }],
    ['TA-011', 'tarea', 'r2', 'spr-07', 'EP-005', 5, MUST, 9, AT, '2026-07-07', null,
      'Preparar la plantilla y las validaciones de la migración de saldos de cartera', 'Plantilla para la migración de saldos de cartera (entregable 1.4.3).',
      '- Plantilla con las facturas abiertas por cliente, obra, fecha de emisión y vencimiento.\n- Validación de saldos contra el auxiliar de cartera de contabilidad.\n- Ensayo de carga en el ambiente de pruebas sin diferencias.',
      { tags: ['migración'], blocked: true, blockedReason: 'Contabilidad no ha entregado el auxiliar de cartera conciliado a 30 de septiembre; fecha comprometida: 13 de octubre.', path: [['2026-07-07', 'backlog'], ['2026-10-08', 'por-hacer']] }],
    ['HU-024', 'historia', 'r2', 'spr-07', 'EP-005', 3, SHOULD, 6, CF, '2026-07-07', null,
      'Registrar notas débito por cargos adicionales de transporte y daños', 'Como auxiliar de facturación quiero emitir notas débito electrónicas por cargos posteriores a la factura.',
      'Dado un cargo de transporte adicional aprobado, cuando se emite la nota débito, entonces referencia la factura original, se valida con la DIAN y aumenta el saldo del cliente.',
      { tags: ['DIAN'], path: [['2026-07-07', 'backlog'], ['2026-10-08', 'por-hacer']] }],
    /* soporte de producción del release 1 (sin release): carril de urgencia */
    ['DF-008', 'defecto', null, 'spr-07', 'EP-001', 2, MUST, 7, DE, '2026-09-16', null,
      'La consulta de disponibilidad no refleja las devoluciones registradas desde la tableta sin conexión', 'Defecto de producción del release 1, reportado por la bodega de Funza.',
      'Dado una devolución registrada sin conexión, cuando la tableta sincroniza, entonces la disponibilidad se actualiza en menos de un minuto.\nSe verifica con tres devoluciones sin conexión en la bodega de Funza.',
      { tags: ['producción'], path: [['2026-09-16', 'backlog'], ['2026-10-08', 'por-hacer']] }],
    ['DF-009', 'defecto', null, 'spr-07', 'EP-001', 2, MUST, 8, DE, STATUS_DATE, STATUS_DATE,
      'El traslado entre bodegas no descuenta las piezas reservadas para despacho', 'Defecto crítico de producción reportado la mañana del 9 de octubre: se atendió por el carril de urgencia de la iteración 7.',
      'Dado piezas reservadas para una remisión, cuando se intenta trasladarlas a otra bodega, entonces el ERP lo impide e indica la remisión que las reserva.',
      { tags: ['producción', 'urgente'], added: STATUS_DATE, path: [[STATUS_DATE, 'backlog'], [STATUS_DATE, 'en-curso'], [STATUS_DATE, 'en-revision'], [STATUS_DATE, 'terminado']] }],
    /* ===== release 2 · iteración 8 (planeada) y sin iteración */
    ['HU-023', 'historia', 'r2', 'spr-08', 'EP-005', 5, MUST, 8, DE, '2026-07-07', null,
      'Generar el estado de cuenta del cliente con facturas, abonos y saldos', 'Como jefe de cartera quiero enviar al cliente su estado de cuenta desde el ERP para conciliar antes de cobrar.',
      'Dado un cliente, cuando se genera el estado de cuenta a una fecha, entonces lista facturas, notas, abonos y saldo por obra, y se envía en PDF al correo de facturación.'],
    ['HU-025', 'historia', 'r2', 'spr-08', 'EP-005', 5, MUST, 8, DE, '2026-07-07', null,
      'Bloquear despachos a clientes con cartera vencida a más de 60 días', 'Como gerente administrativo y financiero quiero que el ERP bloquee nuevos despachos a clientes morosos para no aumentar la cartera vencida.',
      'Dado un cliente con facturas vencidas a más de 60 días, cuando se genera un pedido de alquiler, entonces el ERP lo bloquea y solo el jefe de cartera puede autorizarlo con una justificación.'],
    ['HU-026', 'historia', 'r2', 'spr-08', 'EP-005', 5, SHOULD, 6, CF, '2026-07-07', null,
      'Registrar acuerdos de pago y compromisos de la gestión de cobro', 'Como auxiliar de cartera quiero registrar los compromisos de pago de cada cliente para hacerles seguimiento.',
      'Dado un cliente con cartera vencida, cuando se registra un acuerdo de pago, entonces queda con cuotas, fechas y responsable, y el ERP alerta el día del vencimiento de cada cuota.'],
    ['TA-010', 'tarea', 'r2', 'spr-08', 'EP-005', 2, MUST, 6, DI, '2026-07-07', null,
      'Configurar el formato del archivo de recaudo del banco', 'Lectura del archivo de recaudos para aplicar los pagos (HU-021).',
      '- Lectura del archivo de recaudos del banco en el formato que entregó el banco el 2 de octubre.\n- Prueba con el archivo de septiembre: 100 % de los pagos identificados por NIT y referencia.',
      { path: [['2026-07-07', 'backlog'], ['2026-09-10', 'por-hacer'], ['2026-09-21', 'en-curso'], ['2026-09-23', 'backlog']], unfinishedIn: 'spr-05' }],
    ['ME-003', 'mejora', 'r2', 'spr-08', 'EP-004', 3, SHOULD, 6, CF, '2026-08-26', null,
      'Filtrar la prefactura por obra y por centro de costos del cliente', 'Pedido de facturación en la revisión de la iteración 3.',
      'Dado un cliente con varias obras, cuando se genera la prefactura, entonces se puede filtrar y totalizar por obra y por centro de costos del cliente.'],
    ['ME-004', 'mejora', 'r2', 'spr-08', 'EP-002', 2, SHOULD, 5, DE, '2026-09-02', null,
      'Mostrar en la remisión el saldo de equipos del cliente en obra', 'Pedido de logística en la prueba de aceptación del release 1.',
      'Dado una remisión de despacho, cuando se imprime, entonces muestra el saldo de equipos de ese cliente en la obra después del despacho.'],
    ['HU-041', 'historia', 'r2', 'spr-08', 'EP-004', 5, SHOULD, 7, CF, '2026-10-07', null,
      'Mostrar el detalle por equipo en la prefactura', 'Pedido del usuario clave de facturación en la revisión de la iteración 6.',
      'Dado una prefactura mensual, cuando el auxiliar la revisa, entonces ve por equipo los días cobrados, la tarifa y el valor, y puede exportar el detalle.'],
    ['ME-005', 'mejora', 'r2', null, 'EP-005', 3, COULD, 4, DE, '2026-09-08', null,
      'Exportar la cartera por edades a hoja de cálculo con filtros por vendedor', 'Pedido de cartera en el refinamiento del release 2.',
      'Dado la consulta de cartera por edades, cuando se filtra por vendedor y se exporta, entonces el archivo trae los mismos totales de la consulta.'],
    ['ME-006', 'mejora', 'r2', null, 'EP-005', 5, COULD, 5, DI, '2026-09-08', null,
      'Enviar recordatorio automático de pago cinco días antes del vencimiento', 'Pedido de cartera en el refinamiento del release 2.',
      'Dado una factura que vence en cinco días, cuando corre el proceso diario, entonces el cliente recibe un correo con la factura y el valor por pagar, y queda registrado en la gestión de cobro.'],
    /* ===== release 3 (planeado, sin línea base) */
    ['HU-015', 'historia', 'r3', null, 'EP-006', 8, MUST, 9, CF, '2026-07-06', null,
      'Registrar la hoja de vida de cada equipo con inspecciones, reparaciones y certificaciones', 'Como jefe de mantenimiento quiero la historia de cada equipo para decidir si se repara, se certifica o se da de baja.',
      'Dado un equipo serializado, cuando se consulta su hoja de vida, entonces muestra inspecciones, reparaciones, repuestos, horas de uso, certificaciones y obras donde estuvo.'],
    ['HU-016', 'historia', 'r3', null, 'EP-006', 8, MUST, 9, CF, '2026-07-06', null,
      'Generar órdenes de trabajo de mantenimiento correctivo desde la devolución', 'Como jefe de mantenimiento quiero que las piezas «para reparación» de cada devolución generen la orden de trabajo para no perder el control de lo que entra al taller.',
      'Dado una devolución con piezas para reparación, cuando se cierra el conteo, entonces se crea una orden de trabajo por referencia con cantidades y fotos.\nLas piezas en reparación no aparecen disponibles para despacho.'],
    ['HU-017', 'historia', 'r3', null, 'EP-006', 8, MUST, 8, DE, '2026-07-06', null,
      'Programar el mantenimiento preventivo por ciclos de alquiler y horas de uso', 'Como jefe de mantenimiento quiero programar el preventivo de cada máquina por horas de uso o ciclos de alquiler para evitar fallas en obra.',
      'Dado una máquina con plan de mantenimiento cada 250 horas, cuando acumula 250 horas desde el último preventivo, entonces el ERP genera la orden preventiva y la máquina queda reservada para el taller.'],
    ['HU-018', 'historia', 'r3', null, 'EP-006', 5, MUST, 8, DE, '2026-07-06', null,
      'Registrar la inspección de seguridad del equipo antes del despacho con lista de chequeo', 'Como auxiliar de bodega quiero registrar la inspección de salida en la tableta para despachar solo equipos aptos.',
      'Dado un equipo por despachar, cuando el auxiliar completa la lista de chequeo en la tableta, entonces queda la inspección con fecha, responsable y fotos de los hallazgos.'],
    ['HU-019', 'historia', 'r3', null, 'EP-006', 5, MUST, 9, DE, '2026-07-06', null,
      'Bloquear el despacho de equipos no aptos o con inspección vencida', 'Como coordinador SST quiero que el ERP impida despachar equipos no aptos para no exponer a los trabajadores de la obra.',
      'Dado un equipo con inspección vencida o calificado «no apto», cuando se incluye en una remisión, entonces el ERP lo rechaza e indica la causa.'],
    ['HU-020', 'historia', 'r3', null, 'EP-006', 5, SHOULD, 7, CF, '2026-07-06', null,
      'Costear el mantenimiento por equipo con repuestos y mano de obra', 'Como gerente administrativo y financiero quiero conocer el costo de mantenimiento de cada equipo para decidir tarifas y reposiciones.',
      'Dado una orden de trabajo cerrada, cuando se consulta el costo del equipo, entonces suma los repuestos consumidos y las horas de taller valoradas.'],
    ['HU-035', 'historia', 'r3', null, 'EP-007', 8, MUST, 10, CF, '2026-07-08', null,
      'Ver la utilización del inventario por familia, bodega y obra en el tablero gerencial', 'Como Gerencia General quiero ver cada día la utilización del inventario para decidir compras y tarifas.',
      'Dado el cierre del día, cuando la gerencia abre el tablero, entonces ve la utilización por familia (m² alquilados ÷ m² disponibles), por bodega y por obra, con la tendencia de los últimos 90 días.'],
    ['HU-036', 'historia', 'r3', null, 'EP-007', 5, MUST, 9, CF, '2026-07-08', null,
      'Ver los ingresos de alquiler y venta por línea de negocio y por cliente', 'Como Gerencia General quiero ver los ingresos del mes por línea de negocio para seguir el presupuesto comercial.',
      'Dado el mes en curso, cuando se consulta el tablero, entonces muestra los ingresos facturados por línea (andamio, formaleta, maquinaria, montaje y ventas) y por cliente, comparados con el presupuesto.'],
    ['HU-037', 'historia', 'r3', null, 'EP-007', 5, SHOULD, 8, DE, '2026-07-08', null,
      'Ver la cartera por edades y los equipos en mantenimiento en el tablero gerencial', 'Como Gerencia General quiero ver la cartera vencida y los equipos fuera de servicio en el mismo tablero.',
      'Dado el cierre del día, cuando se abre el tablero, entonces muestra la cartera por edades con los diez clientes de mayor saldo vencido y los equipos en mantenimiento por familia.'],
    ['TA-012', 'tarea', 'r3', null, 'EP-006', 5, MUST, 7, AT, '2026-07-07', null,
      'Preparar la plantilla de carga de hojas de vida y planes de mantenimiento', 'Plantilla para la migración de hojas de vida (entregable 1.4.4).',
      '- Plantilla con equipo, serial, última inspección, horas de uso y plan de mantenimiento.\n- Validación contra el catálogo de equipos serializados.', { tags: ['migración'] }],
    ['TA-013', 'tarea', 'r3', null, 'EP-007', 8, MUST, 8, AT, '2026-07-08', null,
      'Construir el modelo de datos y los indicadores del tablero gerencial', 'Base de datos de indicadores con actualización diaria.',
      '- Definición de cada indicador aprobada por la Gerencia General.\n- Actualización diaria automática antes de las 7:00.\n- Cifras conciliadas con los reportes del ERP del mismo día.'],
    ['TA-014', 'tarea', 'r3', null, 'EP-006', 5, SHOULD, 6, CF, '2026-07-08', null,
      'Configurar el almacén de repuestos y la valoración de consumos de mantenimiento', 'Repuestos del taller con su costo para las órdenes de trabajo.',
      '- Almacén de repuestos del taller con las referencias vigentes.\n- Consumo valorado al costo promedio en cada orden de trabajo.'],
    ['ME-001', 'mejora', 'r3', null, 'EP-006', 5, SHOULD, 6, DE, '2026-07-27', null,
      'Adjuntar fotos de las piezas dañadas al registro de la devolución', 'Pedido de almacén en la revisión de la iteración 1; se asigna al release de mantenimiento.',
      'Dado una pieza calificada «para reparación» o «para baja», cuando se registra la devolución, entonces se pueden adjuntar hasta cinco fotos que quedan en la hoja de vida y en el cobro de daños.'],
    ['ME-007', 'mejora', 'r3', null, 'EP-006', 5, COULD, 5, DI, '2026-09-15', null,
      'Alertar por correo al jefe de mantenimiento cuando un equipo complete su ciclo de alquiler', 'Pedido de mantenimiento después de la salida a producción del release 1.',
      'Dado un equipo que cumple su número de ciclos de alquiler, cuando se registra la devolución, entonces el jefe de mantenimiento recibe un correo con el equipo y su hoja de vida.'],
    ['IN-005', 'investigacion', 'r3', null, 'EP-007', 3, MUST, 7, AT, '2026-09-24', null,
      'Evaluar los reportes nativos del ERP frente a una herramienta de inteligencia de negocios para el tablero gerencial', 'Decidir la herramienta del tablero antes de planificar el release 3.',
      '- Prototipo del indicador de utilización en las dos opciones.\n- Comparación de costo, tiempo de actualización y facilidad de uso; decisión del dueño del producto.'],
    ['ME-010', 'mejora', 'r3', null, 'EP-006', null, COULD, null, '', '2026-10-09', null,
      'Registrar la firma del conductor del cliente en el acta de devolución desde la tableta', 'Pedido de la bodega de Funza; pendiente de refinamiento (sin criterios de aceptación ni estimación).', ''],
    /* ===== backlog del producto sin release */
    ['ME-002', 'mejora', null, null, 'EP-002', 5, WONT, 4, '', '2026-08-11', null,
      'Agrupar la remisión por paquetes de montaje (torre y nivel)', 'Pedido de logística en la revisión de la iteración 2; fuera de los tres releases.',
      'Dado un pedido para una torre de andamio, cuando se genera la remisión, entonces agrupa las piezas por torre y nivel de montaje.'],
    ['ME-008', 'mejora', null, null, 'EP-001', 8, WONT, 5, '', '2026-09-29', null,
      'Consultar la disponibilidad de equipos desde el celular del asesor comercial', 'Pedido del área comercial; se evaluará después de la estabilización.',
      'Dado un asesor comercial en visita a obra, cuando consulta una referencia en el celular, entonces ve la disponibilidad por bodega con la misma regla de la consulta del ERP.'],
    ['HU-042', 'historia', null, null, null, null, COULD, null, '', '2026-10-08', null,
      'Consultar la ubicación de la maquinaria en obra desde la plataforma de rastreo satelital', 'Pedido de la Gerencia General en la planificación de la iteración 7; pendiente de refinamiento.', ''],
    ['IN-006', 'investigacion', null, null, null, null, COULD, null, '', '2026-10-08', null,
      'Investigar la integración con la plataforma de rastreo satelital de la maquinaria', 'Prerrequisito de HU-042; pendiente de estimar.', ''],
    ['HU-043', 'historia', null, null, null, null, WONT, null, '', STATUS_DATE, null,
      'Liquidar la comisión de los asesores comerciales sobre el alquiler facturado', 'Pedido del área comercial; la nómina está fuera del alcance de la visión del producto.', ''],
  ];

  /* ---------------------------------------------------------------- costos reales hasta el corte
     [fecha, actividad, categoría, descripción, documento, valor] */
  const ACTUALS = [
    ['2026-05-05', 't02', 'Mano de obra', 'Reunión de arranque e identificación de interesados (horas internas)', 'NOM-2026-05', 1350000],
    ['2026-05-29', 't07', 'Servicios profesionales', 'Consultor de selección: talleres de descubrimiento y requisitos de alto nivel', 'FE-1182', 11860000],
    ['2026-05-29', 't07', 'Mano de obra', 'Usuarios clave en los talleres de descubrimiento (horas internas de mayo)', 'NOM-2026-05', 3240000],
    ['2026-06-10', 't08', 'Servicios profesionales', 'Consultor de selección: solicitud de propuestas y respuestas a los oferentes', 'FE-1207', 4920000],
    ['2026-06-23', 't09', 'Servicios profesionales', 'Consultor de selección: guiones de demostración y evaluación de ofertas', 'FE-1231', 6180000],
    ['2026-06-23', 't09', 'Mano de obra', 'Usuarios clave en las demostraciones guiadas (horas internas)', 'NOM-2026-06', 1950000],
    ['2026-06-30', 't10', 'Servicios profesionales', 'Asesoría jurídica: revisión de los contratos de suscripción e implementación', 'FE-0388', 5400000],
    ['2026-05-29', 't04', 'Mano de obra', 'Dirección del proyecto: mayo (jefe de la PMO al 25 %)', 'NOM-2026-05', 3300000],
    ['2026-06-30', 't04', 'Mano de obra', 'Dirección del proyecto: junio (jefe de la PMO al 25 %)', 'NOM-2026-06', 3300000],
    ['2026-07-07', 't13', 'Servicios profesionales', 'Implementador: aprovisionamiento de ambientes, usuarios y perfiles', 'FE-5101', 3100000],
    ['2026-07-07', 't20', 'Servicios profesionales', 'Consultor de gestión del cambio: plan, red de usuarios clave y comunicaciones', 'FE-0412', 6500000],
    ['2026-07-10', 't03', 'Mano de obra', 'Plan para la dirección del proyecto, plan de releases y LB0 (horas internas)', 'NOM-2026-07', 4300000],
    ['2026-07-10', 't03', 'Servicios profesionales', 'Implementador: taller de planificación de releases y estimación del backlog', 'FE-5102', 2400000],
    ['2026-07-24', 't14', 'Equipos', 'Cuatro tabletas robustas con funda y lápiz para las bodegas', 'FC-2291', 12480000],
    ['2026-07-24', 't14', 'Equipos', 'Seis lectores de código de barras inalámbricos y dos impresoras de etiquetas', 'FC-2292', 10350000],
    ['2026-07-24', 't14', 'Subcontratos', 'Red inalámbrica de las bodegas principal y de Funza (puntos de acceso e instalación)', 'FE-0917', 7420000],
    ['2026-07-27', 't21', 'Servicios profesionales', 'Implementador: formación de usuarios clave (40 horas) y materiales', 'FE-5110', 7800000],
    ['2026-07-27', 't21', 'Mano de obra', 'Usuarios clave en formación (horas internas)', 'NOM-2026-07', 2150000],
    ['2026-07-31', 't12', 'Licencias', 'Suscripción del ERP: julio de 2026 (45 usuarios)', 'FE-88231', 11040000],
    ['2026-07-31', 't04', 'Mano de obra', 'Dirección del proyecto: julio (jefe de la PMO al 25 %)', 'NOM-2026-07', 3300000],
    ['2026-08-14', 't16', 'Mano de obra', 'Depuración de datos maestros (usuarios clave y personal de bodega, horas internas)', 'NOM-2026-08', 6900000],
    ['2026-08-14', 't16', 'Servicios profesionales', 'Implementador: revisión de calidad de datos y reglas de depuración', 'FE-5120', 8600000],
    ['2026-08-31', 't15', 'Licencias', 'Proveedor tecnológico de facturación electrónica: habilitación y paquete anual de 6.000 documentos', 'FE-3377', 4200000],
    ['2026-08-31', 't12', 'Licencias', 'Suscripción del ERP: agosto de 2026 (45 usuarios)', 'FE-88412', 11040000],
    ['2026-08-31', 't04', 'Mano de obra', 'Dirección del proyecto: agosto (jefe de la PMO al 25 %)', 'NOM-2026-08', 3300000],
    ['2026-09-07', 't17', 'Mano de obra', 'Conteo físico de la bodega principal (personal de bodega, horas extra)', 'NOM-2026-09', 7950000],
    ['2026-09-07', 't17', 'Servicios profesionales', 'Implementador: carga y conciliación del inventario migrado', 'FE-5131', 6400000],
    ['2026-09-08', 't22', 'Servicios profesionales', 'Implementador: capacitación de usuarios finales del release 1 (seis grupos)', 'FE-5133', 5900000],
    ['2026-09-08', 't22', 'Otros', 'Salas, refrigerios y guías rápidas impresas para la capacitación del release 1', 'FE-2210', 1150000],
    ['2026-09-08', 't22', 'Mano de obra', 'Horas de los usuarios finales en capacitación', 'NOM-2026-09', 1600000],
    ['2026-09-10', 't28', 'Servicios profesionales', 'Implementador: corte y acompañamiento de la salida a producción del release 1', 'FE-5134', 3600000],
    ['2026-09-10', 't28', 'Mano de obra', 'Horas extra de bodega y TI en el corte del release 1', 'NOM-2026-09', 1300000],
    ['2026-09-30', 't12', 'Licencias', 'Suscripción del ERP: septiembre de 2026 (45 usuarios)', 'FE-88597', 11040000],
    ['2026-09-30', 't04', 'Mano de obra', 'Dirección del proyecto: septiembre (jefe de la PMO al 25 %)', 'NOM-2026-09', 3300000],
    ['2026-10-07', 't18', 'Servicios profesionales', 'Implementador: plantilla de saldos de cartera y primer ensayo de carga', 'FE-5142', 2400000],
  ];
  /* costos de los releases: equipo del implementador a precio fijo por iteración (240 horas a COP 82.500) y analista de TI
     interno; se registran al cierre de cada iteración con el release (AgileEVM). [iteración, extra, descripción del extra] */
  const SPRINT_COSTS = [
    ['spr-01', 0, ''], ['spr-02', 0, ''], ['spr-03', 0, ''],
    ['spr-04', 1800000, 'Horas extra del equipo en el ensayo de corte del release 1'],
    ['spr-05', 3000000, 'Implementador: horas adicionales del conector con el proveedor tecnológico'],
    ['spr-06', 1500000, 'Implementador: horas adicionales del conector con el proveedor tecnológico'],
  ];
  const IMPL_FEE = mm(19.8), ANALYST = mm(4.2), SCRUM_MASTER = mm(1.8);

  /* ---------------------------------------------------------------- matriz RACI */
  const RACI_ROLES = [
    ['rol-pat', 'Patrocinador'], ['rol-dir', 'Director de proyecto'], ['rol-po', 'Dueño del producto'], ['rol-sm', 'Scrum Master / facilitador'],
    ['rol-dt', 'Desarrolladores (equipo Scrum)'], ['rol-imp', 'Líder del implementador'], ['rol-uc', 'Usuarios clave'], ['rol-ti', 'Jefe de TI'], ['rol-con', 'Contabilidad y revisoría fiscal'],
  ];
  /* celdas en el orden de RACI_ROLES; '' = sin asignación (una sola A por fila) */
  const RACI = {
    w1: ['A', 'R', 'C', 'R', 'I', 'C', 'I', 'I', 'I'],
    w11: ['A', 'R', 'C', '', '', 'I', 'I', 'C', ''],
    w12: ['A', 'R', 'C', 'R', 'C', 'C', 'I', 'C', 'I'],
    w13: ['I', 'A', 'C', 'R', 'C', 'C', 'I', 'I', ''],
    w14: ['A', 'R', 'C', 'C', 'I', 'C', 'I', 'I', 'C'],
    w2: ['A', 'R', 'R', '', '', '', 'C', 'C', 'C'],
    w21: ['I', 'A', 'R', '', '', '', 'R', 'C', 'C'],
    w22: ['I', 'A', 'R', '', '', '', 'C', 'R', 'C'],
    w23: ['A', 'R', 'C', '', '', '', '', 'C', 'C'],
    w3: ['I', 'A', 'C', '', 'C', 'R', '', 'R', ''],
    w31: ['', 'I', '', '', 'C', 'R', '', 'A', ''],
    w32: ['', 'I', '', '', '', '', 'C', 'RA', ''],
    w33: ['', 'I', 'C', '', 'R', 'C', '', 'A', 'C'],
    w4: ['I', 'A', 'R', '', 'R', 'C', 'R', 'C', 'C'],
    w41: ['', 'I', 'A', '', 'R', 'C', 'R', '', 'C'],
    w42: ['', 'I', 'A', '', 'R', 'C', 'R', '', 'C'],
    w43: ['', 'I', 'A', '', 'R', 'C', 'C', '', 'R'],
    w44: ['', 'I', 'A', '', 'R', 'C', 'R', '', ''],
    w5: ['I', 'A', 'C', 'C', '', 'R', 'R', '', ''],
    w51: ['I', 'A', 'C', 'R', '', 'C', 'C', '', ''],
    w52: ['', 'A', 'C', 'C', '', 'R', 'R', '', ''],
    w53: ['', 'C', 'A', 'C', '', 'R', 'R', '', ''],
    w6: ['I', 'C', 'A', 'R', 'R', 'C', 'C', 'I', ''],
    w7: ['I', 'C', 'A', 'R', 'R', 'C', 'C', 'I', 'C'],
    w8: ['I', 'C', 'A', 'R', 'R', 'C', 'C', 'I', ''],
    w9: ['I', 'A', 'C', '', 'R', 'R', 'C', 'R', 'C'],
    w91: ['I', 'C', 'A', '', 'R', 'R', 'C', 'R', ''],
    w92: ['I', 'C', 'A', '', 'R', 'R', 'C', 'R', 'C'],
    w93: ['I', 'C', 'A', '', 'R', 'R', 'C', 'R', ''],
    w94: ['I', 'A', 'C', '', 'R', 'R', 'C', 'R', ''],
  };
  /* eventos ágiles con la asignación típica de 70-matrices (Guía de Scrum 2020 y Guía de prácticas ágiles) */
  const AGILE_EVENTS = [
    ['Refinamiento del backlog', { 'rol-po': 'RA', 'rol-sm': 'C', 'rol-dt': 'C', 'rol-dir': 'I', 'rol-uc': 'C' }],
    ['Priorización del backlog', { 'rol-po': 'RA', 'rol-sm': 'C', 'rol-dt': 'C', 'rol-dir': 'C' }],
    ['Planificación de la iteración', { 'rol-po': 'C', 'rol-sm': 'R', 'rol-dt': 'RA', 'rol-dir': 'I' }],
    ['Reunión diaria', { 'rol-sm': 'R', 'rol-dt': 'RA', 'rol-dir': 'I' }],
    ['Revisión de la iteración', { 'rol-po': 'A', 'rol-sm': 'R', 'rol-dt': 'R', 'rol-dir': 'C', 'rol-pat': 'I', 'rol-uc': 'C' }],
    ['Retrospectiva', { 'rol-po': 'C', 'rol-sm': 'RA', 'rol-dt': 'R', 'rol-dir': 'I' }],
    ['Definición de terminado', { 'rol-po': 'A', 'rol-sm': 'C', 'rol-dt': 'R', 'rol-dir': 'C' }],
    ['Aceptación de historias de usuario', { 'rol-po': 'A', 'rol-sm': 'I', 'rol-dt': 'R', 'rol-dir': 'I', 'rol-uc': 'C' }],
    ['Planificación del release', { 'rol-po': 'A', 'rol-sm': 'R', 'rol-dt': 'R', 'rol-dir': 'C', 'rol-pat': 'I' }],
  ];

  /* ================================================================ construcción */
  const cal = PM.cal.make(SETTINGS, START);
  const isoMax = (a, b) => (a > b ? a : b);
  const pad = (n) => String(n).padStart(3, '0');

  /* duración de los esfuerzos de nivel: desde su inicio hasta el fin del proyecto */
  const LOE = { t04: [START, END], t12: ['2026-07-01', END], t35: ['2026-07-13', '2026-12-22'] };
  const durationOf = (t) => (t.loe ? cal.countWork(LOE[t.id][0], LOE[t.id][1]) : t.duration);
  const loeProgress = (t, at) => { const n = durationOf(t); const s = LOE[t.id][0]; return at < s ? 0 : Math.min(100, Math.round((cal.countWork(s, at) / n) * 100)); };

  /* ---------- elementos del backlog con su historial (flujo acumulado, burndown, burnup, velocidad) */
  const sprintOf = (key) => { const s = SPRINT_BY_KEY[key]; return s ? { id: s[0], name: s[1], rel: s[2], start: s[3], end: s[4], status: s[5] } : null; };
  const ESTDAYS = { 1: 1, 2: 1, 3: 2, 5: 3, 8: 5, 13: 7 };
  /* recorrido por las columnas de un elemento terminado en su iteración */
  function autoPath(code, type, est, created, sprint, done, opts) {
    const path = [[created, 'backlog']];
    const planned = opts.rolled ? sprintOf(opts.rolled).start : sprint.start;
    path.push([isoMax(planned, created), 'por-hacer']);
    const work = opts.start || isoMax(planned, cal.addWork(done, -(ESTDAYS[est] || 2)));
    path.push([work, 'en-curso']);
    const uat = done >= UAT_FROM && (type === 'historia' || type === 'mejora');
    const rev = isoMax(work, cal.addWork(done, uat ? -2 : -1));
    path.push([rev, 'en-revision']);
    if (uat) path.push([isoMax(rev, cal.addWork(done, -1)), 'pruebas-usuario']);
    path.push([done, 'terminado']);
    return path;
  }
  function itemsData() {
    const ids = new Map();
    const idOf = (code) => code.toLowerCase();
    const out = [];
    let rank = 0;
    /* épicas */
    const epicDone = {};
    for (const row of ITEMS) {
      const epic = row[4]; if (!epic) continue;
      const e = (epicDone[epic] = epicDone[epic] || { all: true, last: null });
      if (!row[10]) e.all = false; else e.last = !e.last || row[10] > e.last ? row[10] : e.last;
    }
    for (const [code, relKey, title, created, description] of EPICS) {
      const e = epicDone[code] || { all: false };
      const history = [{ date: created, status: 'backlog' }];
      if (e.all && e.last) history.push({ date: e.last, status: 'terminado' });
      ids.set(code, idOf(code));
      out.push({
        id: idOf(code), code, type: 'epica', title, description, acceptance: '', estimate: null, priority: MUST, value: null, rank: (rank += 1000),
        status: e.all ? 'terminado' : 'backlog', wbsId: REL[relKey].wbsId, releaseId: REL[relKey].id, sprintId: null, epicId: null, assignee: R.po,
        blocked: false, blockedReason: '', tags: code === 'EP-008' ? ['CC-001'] : [], createdAt: created, doneDate: e.all ? e.last : null, sprintAddedDate: null, history,
      });
    }
    for (const row of ITEMS) {
      const [code, type, relKey, sprintKey, epic, est, priority, value, assignee, created, done, title, description, acceptance, extra] = row;
      const opts = extra || {};
      const sprint = sprintKey ? sprintOf(sprintKey) : null;
      let path;
      if (opts.path) path = opts.path;
      else if (done && sprint) path = autoPath(code, type, est, created, sprint, done, opts);
      else path = [[created, 'backlog']];
      const status = path[path.length - 1][1];
      out.push({
        id: idOf(code), code, type, title, description, acceptance, estimate: est, priority, value, rank: (rank += 1000), status,
        wbsId: relKey ? REL[relKey].wbsId : null, releaseId: relKey ? REL[relKey].id : null, sprintId: sprint ? sprint.id : null,
        epicId: epic ? ids.get(epic) || null : null, assignee: assignee || '', blocked: !!opts.blocked, blockedReason: opts.blockedReason || '',
        tags: [...(opts.tags || [])], createdAt: created, doneDate: status === 'terminado' ? done : null, sprintAddedDate: opts.added || null,
        history: path.map(([date, st]) => ({ date, status: st })),
      });
    }
    return out;
  }

  /* ---------- releases e iteraciones */
  function agileData(items) {
    const byId = new Map(items.map((it) => [it.id, it]));
    /* elementos que no se terminaron en una iteración cerrada (sprint.unfinished, como lo registra «Cerrar iteración») */
    const unfinished = {};
    for (const row of ITEMS) {
      const opts = row[14] || {};
      const from = opts.rolled || opts.unfinishedIn;
      if (from) (unfinished[from] = unfinished[from] || []).push(row[0]);
    }
    unfinished['spr-06'] = ['HU-033'];
    const releases = ['r1', 'r2', 'r3'].map((k) => PM.clone(REL[k]));
    const sprints = SPRINTS.map(([id, name, relKey, start, end, status, capacity, committed, completed, goal]) => ({
      id, name, releaseId: REL[relKey].id, goal, start, end, status, capacity, committed, completed,
      docs: { ...(SPRINT_DOCS[id] || {}) }, notes: '',
      ...(unfinished[id] ? { unfinished: unfinished[id].map((code) => { const it = byId.get(code.toLowerCase()); return { id: it.id, code: it.code, title: it.title, estimate: it.estimate, sprintAddedDate: null }; }) } : {}),
    }));
    sprints.find((s) => s.id === 'spr-05').notes = 'TA-010 volvió al backlog del producto al cerrar: el banco no había entregado el formato del archivo de recaudo.';
    sprints.find((s) => s.id === 'spr-06').notes = 'HU-033 rechazada en la revisión (representación gráfica sin el código QR); pasó a la iteración 7.';
    sprints.find((s) => s.id === 'spr-07').notes = 'DF-009 entró el 9 de octubre por el carril de urgencia (defecto crítico de producción).';
    return { settings: PM.clone(AGILE_SETTINGS), releases, sprints };
  }

  /* ---------- cronograma */
  const taskOut = (t, variant, items, agile) => {
    const plan = variant === 'plan';
    let progress = 0, actualStart = null, actualFinish = null;
    if (!plan) {
      if (t.done) { progress = 100; actualStart = t.done[0]; actualFinish = t.done[1]; }
      else if (t.loe) { progress = loeProgress(t, STATUS_DATE); actualStart = t.actualStart || null; }
      else if (t.releaseId) {
        /* avance guardado = avance derivado del backlog al corte (PM.agile.applyToSchedule) */
        const r = agile.releases.find((x) => x.id === t.releaseId);
        const prog = PM.calc.releaseProgress({ release: r, items, settings: PM.agile.settings(agile) });
        progress = Math.round(prog.pct * 1000) / 10;
        const started = PM.calc.sprintsOfRelease(agile.sprints, r.id).find((s) => s.status === 'en-curso' || s.status === 'cerrado');
        actualStart = started ? started.start : null;
        actualFinish = progress >= 100 ? prog.lastDone : null;
      } else { progress = t.progress || 0; actualStart = t.actualStart || null; }
    }
    const out = {
      id: t.id, name: t.name, wbsId: t.wbsId, duration: durationOf(t), milestone: !!t.milestone, start: t.start || null,
      deps: t.deps.map((d) => ({ ...d })), progress, cost: t.cost,
      ...(t.costMode ? { costMode: t.costMode } : {}), ...(t.costMode === 'mixto' ? { costFixed: t.costFixed } : {}),
      ...(COST_CAT[t.id] ? { costCategory: COST_CAT[t.id] } : {}),
      resources: (t.resources || []).map((r) => ({ ...r })),
      responsible: t.responsible || '', actualStart, actualFinish, notes: plan ? '' : t.notes || '',
    };
    if (t.releaseId) out.releaseId = t.releaseId;
    return out;
  };
  const scheduleData = (variant, items, agile) => ({
    settings: { ...SETTINGS, extraHolidays: [], resourceLimits: { ...RESOURCE_LIMITS } },
    tasks: TASKS.map((t) => taskOut(t, variant, items, agile)),
  });

  /* ---------- EDT */
  const wbsNodes = (tasks, plan) => {
    const costByWbs = {};
    for (const t of tasks) if (t.wbsId) costByWbs[t.wbsId] = (costByWbs[t.wbsId] || 0) + (Number(t.cost) || 0);
    const order = {};
    const kids = {};
    for (const w of WBS) if (w[1]) (kids[w[1]] = kids[w[1]] || []).push(w[0]);
    const roll = (id) => (kids[id] ? kids[id].reduce((s, k) => s + roll(k), 0) : costByWbs[id] || 0);
    return WBS.map(([id, parentId, name, kind, approach, responsible, description, deliverable, acceptance]) => {
      const k = parentId || 'root'; order[k] = (order[k] || 0) + 1;
      const node = { id, parentId, name, order: order[k], kind, description, responsible, deliverable, acceptance, costEstimate: roll(id), notes: '' };
      if (approach) node.approach = approach;
      if (!plan && id === 'w6') node.notes = 'Alcance ampliado con el CC-001 (integración con las básculas de despacho), aprobado el 13 de agosto de 2026.';
      if (!plan && id === 'w43') node.notes = 'Atrasado al corte: falta el auxiliar de cartera conciliado (TA-011 bloqueado).';
      return node;
    });
  };

  /* ---------- costos reales y cortes de avance */
  function costsData(items, agile) {
    const taskWbs = Object.fromEntries(TASKS.map((t) => [t.id, t.wbsId]));
    const rows = ACTUALS.map(([date, taskId, category, description, document, amount]) => ({ date, amount, taskId, wbsId: taskWbs[taskId] || null, category, description, document }));
    for (const [sid, extra, extraText] of SPRINT_COSTS) {
      const s = sprintOf(sid); const r = REL[s.rel]; const n = s.name.replace('Iteración ', '');
      rows.push({ date: s.end, amount: IMPL_FEE, taskId: r.taskId, wbsId: r.wbsId, releaseId: r.id, category: 'Servicios profesionales', description: 'Implementador: ' + s.name.toLowerCase() + ' (precio fijo por iteración, 240 horas)', document: 'FE-52' + pad(Number(n)) });
      rows.push({ date: s.end, amount: ANALYST, taskId: r.taskId, wbsId: r.wbsId, releaseId: r.id, category: 'Mano de obra', description: 'Analista de TI en la ' + s.name.toLowerCase() + ' (dedicación completa)', document: 'NOM-IT' + pad(Number(n)) });
      rows.push({ date: s.end, amount: SCRUM_MASTER, taskId: 't35', wbsId: 'w13', category: 'Mano de obra', description: 'Scrum Master / facilitador en la ' + s.name.toLowerCase() + ' (50 %)', document: 'NOM-SM' + pad(Number(n)) });
      if (extra) rows.push({ date: s.end, amount: extra, taskId: r.taskId, wbsId: r.wbsId, releaseId: r.id, category: extraText.startsWith('Horas') ? 'Mano de obra' : 'Servicios profesionales', description: extraText + ' (' + s.name.toLowerCase() + ')', document: extraText.startsWith('Horas') ? 'NOM-2026-09' : 'FE-53' + pad(Number(n)) });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date) || String(a.document).localeCompare(String(b.document)));
    const actuals = rows.map((r, i) => {
      const o = { id: 'ac' + String(i + 1).padStart(2, '0'), date: r.date, amount: r.amount, taskId: r.taskId, wbsId: r.wbsId, category: r.category, description: r.description, document: r.document };
      if (r.releaseId) o.releaseId = r.releaseId;
      return o;
    });
    /* cortes mensuales de avance: actividades predictivas por sus fechas reales, esfuerzos de nivel por tiempo y releases
       por su backlog a la fecha (terminado ÷ alcance a esa fecha) */
    const st = PM.agile.settings(agile);
    const relPctAt = (r, at) => {
      const list = items.filter((it) => PM.agile.countable(it) && it.releaseId === r.id && (!D.valid(it.createdAt) || it.createdAt <= at));
      const total = list.reduce((s, it) => s + PM.agile.estimate(it), 0);
      const done = list.filter((it) => PM.agile.isDone(st, it) && it.doneDate && it.doneDate <= at).reduce((s, it) => s + PM.agile.estimate(it), 0);
      return total ? Math.round((done / total) * 1000) / 10 : 0;
    };
    const progAt = (t, at) => {
      if (t.loe) return loeProgress(t, at);
      if (t.releaseId) return relPctAt(agile.releases.find((x) => x.id === t.releaseId), at);
      if (t.done) { const [a, b] = t.done; if (b <= at) return 100; if (a > at) return 0; return Math.round((cal.countWork(a, at) / Math.max(1, durationOf(t))) * 100); }
      return 0;
    };
    const CUTS = [
      ['su1', '2026-05-29', 'Corte de mayo: descubrimiento terminado; solicitud de propuestas en curso.'],
      ['su2', '2026-06-30', 'Corte de junio: contratos firmados el 30 de junio; inicia la planificación de releases.'],
      ['su3', '2026-07-31', 'Corte de julio: LB0 aprobada el 10 de julio; iteración 1 cerrada con 24 de 27 puntos; equipos de bodega instalados.'],
      ['su4', '2026-08-31', 'Corte de agosto: CC-001 aprobado el 13 de agosto (básculas, +13 puntos en el release 1); iteraciones 2 y 3 cerradas.'],
      ['su5', '2026-09-30', 'Corte de septiembre: release 1 en producción el 10 de septiembre; iteración 5 cerrada con 30 de 32 puntos.'],
    ];
    const statusUpdates = CUTS.map(([id, date, note]) => {
      const progress = {};
      for (const t of TASKS) { if (t.milestone) continue; const p = progAt(t, date); if (p > 0) progress[t.id] = p; }
      return { id, date, progress, note };
    });
    return { actuals, statusUpdates, reserves: { ...RESERVES } };
  }

  /* ---------- matriz RACI */
  const raciData = () => {
    const names = Object.fromEntries(WBS.map((w) => [w[0], w[2]]));
    const rows = WBS.filter((w) => RACI[w[0]]).map((w) => {
      const cells = {};
      RACI[w[0]].forEach((v, i) => { if (v) cells[RACI_ROLES[i][0]] = v; });
      return { id: 'rc-' + w[0], wbsId: w[0], activity: names[w[0]], cells };
    });
    AGILE_EVENTS.forEach(([name, cells], i) => rows.push({ id: 'rc-ev' + (i + 1), wbsId: null, activity: name, cells: { ...cells } }));
    return { roles: RACI_ROLES.map(([id, name]) => ({ id, name })), rows };
  };

  /* ---------- línea base LB0 (plan sin avance, antes del CC-001: el CC-001 no cambió fecha ni costo del proyecto) */
  function baselinesData(items, agile) {
    const plan = scheduleData('plan', items, agile);
    const sched = PM.calc.computeSchedule(plan, START);
    const snap = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched, wbs: { nodes: wbsNodes(plan.tasks, true) }, costs: { reserves: { ...RESERVES } }, scopeStatement: null });
    return [{ id: 'lb0', data: { number: 0, label: 'LB0', date: LB0_DATE, includes: ['scope', 'schedule', 'cost'], note: 'Línea base inicial aprobada por la Gerencia General con el plan para la dirección del proyecto y el plan de releases (contratos firmados el 30 de junio de 2026).', changeRef: null, byId: null, ...snap } }];
  }

  /* ---------- hechos calculados con la aplicación (cifras de los documentos y de las pruebas) */
  function computeFacts(data) {
    const { schedule, wbs, costs, agile, items, baselines } = data;
    const settings = PM.agile.settings(agile);
    const eff = PM.agile.applyToSchedule(schedule, agile, items);
    const sched = PM.calc.computeSchedule(eff, START);
    const forecast = PM.calc.computeSchedule(eff, START, STATUS_DATE);
    const tree = PM.calc.wbsTree(wbs.nodes);
    const bl = PM.calc.activeBaselines(baselines);
    const evm = PM.calc.evm({ sched, costBaseline: bl.cost, costs, statusDate: STATUS_DATE });
    const sprints = PM.agile.sortSprints(agile.sprints);
    const vel = PM.calc.velocity({ sprints, items, settings });
    const relOut = {};
    for (const r of agile.releases) {
      const ac = PM.agile.releaseActualCost(r, costs, tree, STATUS_DATE);
      relOut[r.id] = {
        prog: PM.calc.releaseProgress({ release: r, items, settings }),
        evm: PM.calc.agileEvm({ release: r, sprints, items, settings, actualCost: ac, statusDate: STATUS_DATE }),
        forecast: PM.calc.releaseForecast({ release: r, sprints, items, settings, cal: sched.cal, statusDate: STATUS_DATE }),
        variance: PM.calc.releaseVariance({ release: r, items, settings }),
        burnup: PM.calc.releaseBurnup({ release: r, sprints, items, settings, statusDate: STATUS_DATE }),
      };
    }
    const relCosts = PM.agile.releaseCosts(agile.releases, costs, tree, STATUS_DATE);
    const current = sprints.find((s) => s.status === 'en-curso') || null;
    const burndown = current ? PM.calc.sprintBurndown({ sprint: current, items, settings, cal: sched.cal, statusDate: STATUS_DATE }) : null;
    const wip = PM.agile.wipStatus(settings, items);
    /* cifras a una fecha pasada (revisiones y planificaciones): elementos creados hasta esa fecha con el estado de su
       historial a esa fecha, e iteraciones cerradas hasta ella (las demás, en curso o planeadas) */
    const statusOn = (it, at) => { let s = PM.AGILE.BACKLOG; for (const h of it.history || []) if (h.date <= at) s = h.status; return s; };
    const itemsAt = (at) => items.filter((it) => !D.valid(it.createdAt) || it.createdAt <= at).map((it) => {
      const s = statusOn(it, at);
      return { ...it, status: s, doneDate: PM.agile.category(settings, s) === 'terminado' ? it.doneDate : null };
    });
    const sprintsAt = (at) => sprints.map((s) => (s.end <= at ? s : { ...s, status: s.start <= at ? 'en-curso' : 'planeado', completed: null, committed: s.start <= at ? s.committed : null }));
    const releaseAt = (relId, at) => PM.calc.releaseProgress({ release: { id: relId }, items: itemsAt(at), settings });
    const velocityAt = (at) => PM.calc.velocity({ sprints: sprintsAt(at), items: itemsAt(at), settings });
    const forecastAt = (relId, at) => PM.calc.releaseForecast({ release: agile.releases.find((r) => r.id === relId), sprints: sprintsAt(at), items: itemsAt(at), settings, cal: sched.cal, statusDate: at });
    const sprintSum = (sid, pred) => items.filter((it) => PM.agile.countable(it) && it.sprintId === sid && (!pred || pred(it))).reduce((s, it) => s + PM.agile.estimate(it), 0);
    /* valor ganado por corte (la serie del valor ganado usa los cortes de avance guardados) */
    const evmRows = ['2026-07-31', '2026-08-31', '2026-09-30', STATUS_DATE].map((d) => ({ corte: d, bac: evm.bac, pv: Math.round(evm.pvAt(d)), ev: Math.round(evm.evAt(d)), ac: Math.round(evm.acAt(d)) }));
    /* valor ganado por actividad al corte (plan de la LB0) */
    const planTasks = bl.cost && bl.cost.cost ? bl.cost.cost.tasks : [];
    const taskEvm = {};
    for (const p of planTasks) {
      const t = sched.byId.get(p.id);
      const pv = p.cost * PM.calc.plannedFraction(sched.cal, p.start, p.finish, p.milestone, STATUS_DATE);
      const ev = p.cost * (t ? t.progress : 0) / 100;
      const ac = costs.actuals.filter((a) => a.taskId === p.id && a.date <= STATUS_DATE).reduce((s, a) => s + a.amount, 0);
      taskEvm[p.id] = { pv, ev, ac, cost: p.cost };
    }
    const wbsLevel1 = wbs.nodes.filter((n) => !n.parentId).map((n) => ({ id: n.id, name: n.name, cost: n.costEstimate, approach: n.approach || null }));
    const milestones = {};
    for (const t of forecast.tasks) if (t.milestone) milestones[t.id] = { name: t.name, plan: (bl.schedule && bl.schedule.schedule ? (bl.schedule.schedule.tasks.find((x) => x.id === t.id) || {}).start : null), forecast: t.startDate, actual: t.actualFinish || null };
    return {
      code: CODE, start: START, end: END, statusDate: STATUS_DATE, lb0Date: LB0_DATE, cc1Date: CC1_DATE, cc1Request: CC1_REQUEST, budget: BUDGET, reserves: { ...RESERVES },
      bac: evm.bac, evm: { bac: evm.bac, pv: evm.pv, ev: evm.ev, ac: evm.ac, sv: evm.sv, cv: evm.cv, spi: evm.spi, cpi: evm.cpi, eac: evm.eac, etc: evm.etc, vac: evm.vac, tcpi: evm.tcpi, eacAtypical: evm.eacAtypical, pctPlanned: evm.pctPlanned, pctComplete: evm.pctComplete, forecastFinish: evm.forecastFinish, spiT: evm.spiT },
      schedFinish: sched.finish, forecastFinish: forecast.finish, milestones,
      taskProgress: Object.fromEntries(sched.tasks.map((t) => [t.id, t.progress])),
      velocity: { rows: vel.rows.map((r) => ({ ...r })), avg3: vel.avg3, avgAll: vel.avgAll, min3: vel.min3, max3: vel.max3, closed: vel.closed },
      releases: relOut, releaseCostsTotal: relCosts.total,
      burndown, currentSprint: current ? current.id : null, wip,
      evmRows, taskEvm, wbsLevel1,
      items: items.map((it) => ({ id: it.id, code: it.code, type: it.type, title: it.title, acceptance: it.acceptance, estimate: it.estimate, priority: it.priority, assignee: it.assignee, status: it.status, sprintId: it.sprintId, releaseId: it.releaseId, createdAt: it.createdAt, doneDate: it.doneDate, rank: it.rank, blocked: it.blocked, blockedReason: it.blockedReason })),
      releaseNames: Object.fromEntries(agile.releases.map((r) => [r.id, r.name])),
      sprintsList: sprints.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end, status: s.status, capacity: s.capacity, committed: s.committed, completed: s.completed, goal: s.goal, releaseId: s.releaseId, unfinished: s.unfinished || [] })),
      releaseAt, velocityAt, forecastAt, sprintSum,
      counts: { items: items.length, epics: items.filter((i) => i.type === 'epica').length, unestimated: items.filter((i) => i.type !== 'epica' && i.estimate === null).length },
    };
  }

  /* ---------- documentos (contenido en 95-example-erp-docs.js: PM.exampleDocs.erp(F) → {plantilla: entrada}; y en los
     módulos 97-example-erp-docs-*.js, que se registran en PM.exampleDocs.erpParts con la misma firma (F, ctx), donde
     ctx = {R, CODE, STATUS_DATE, data}: data trae schedule, wbs, costs, agile, items, baselines y resources) */
  const ts = (date, hhmm) => date + 'T' + (hhmm || '21:00') + ':00.000Z';
  function docsData(project, F, data) {
    const parts = [PM.exampleDocs && PM.exampleDocs.erp, ...((PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts)) ? PM.exampleDocs.erpParts : [])].filter((f) => typeof f === 'function');
    const ctx = { R, CODE, STATUS_DATE, data: { ...(data || {}), resources: resourcesData() } };
    /* una plantilla única la aporta un solo módulo (la primera entrada gana); las múltiples suman las instancias de todos
       los módulos (sin repetir la clave) y se ordenan por fecha de creación (o de la primera revisión, o de emisión), así
       el consecutivo del código sigue el orden en que se emitió cada documento */
    const src = {};
    for (const fn of parts) {
      const part = fn(F, ctx) || {};
      for (const k of Object.keys(part)) {
        const t = PM.templates && PM.templates[k];
        if (t && t.multiple && src[k] && Array.isArray(src[k].instances) && part[k] && Array.isArray(part[k].instances)) {
          const keys = new Set(src[k].instances.map((e) => e && e.key));
          src[k] = { ...src[k], instances: [...src[k].instances, ...part[k].instances.filter((e) => e && !keys.has(e.key))] };
        } else if (!(k in src)) src[k] = part[k];
      }
    }
    for (const k of Object.keys(src)) {
      const born = (e) => { if (!e) return ''; if (D.valid(e.created)) return e.created; const rd = (Array.isArray(e.revs) ? e.revs : []).map((r) => r && r.date).filter(D.valid).sort()[0]; return rd || (D.valid(e.date) ? e.date : ''); };
      if (src[k] && Array.isArray(src[k].instances)) src[k] = { ...src[k], instances: src[k].instances.map((e, i) => [e, i]).sort((a, b) => born(a[0]).localeCompare(born(b[0])) || a[1] - b[1]).map((x) => x[0]) };
    }
    const out = [];
    for (const templateId of Object.keys(src)) {
      const t = PM.templates && PM.templates[templateId];
      const entry = src[templateId];
      if (!t || !entry || typeof entry !== 'object') continue;
      const list = t.multiple ? (Array.isArray(entry.instances) ? entry.instances : []) : [entry];
      list.forEach((e, i) => {
        if (!e || (t.multiple && !e.key)) return;
        const id = t.multiple ? templateId + '--' + e.key : templateId;
        const seq = i + 1;
        const title = t.multiple ? e.title || t.name + ' — ' + seq : t.name;
        const status = e.status || 'borrador';
        const date = D.valid(e.date) ? e.date : STATUS_DATE;
        const tbIn = e.titleBlock || {};
        const titleBlock = {
          codigo: CODE + '-' + (t.abbr || 'DOC') + (t.multiple ? '-' + String(seq).padStart(2, '0') : ''),
          elaboro: tbIn.elaboro || R.dir, reviso: tbIn.reviso || R.po,
          aprobo: tbIn.aprobo || (status === 'aprobado' ? R.pat : ''),
          fechaAprobacion: status === 'aprobado' ? date : null,
        };
        const fields = PM.clone(e.fields || {});
        /* las claves que la entrada no trae toman el valor inicial de la plantilla (con ids fijos) */
        for (const [k, v] of Object.entries(PM.newDocBody(t, project, {}).fields || {})) {
          if (k in fields) continue;
          fields[k] = Array.isArray(v) ? v.map((r, j) => (r && typeof r === 'object' ? { ...r, id: k + '-' + (j + 1) } : r)) : v;
        }
        const revs = (Array.isArray(e.revs) ? e.revs : []).filter((r) => r && D.valid(r.date)).map((r) => ({
          id: 'rev-' + String(r.rev),
          /* una revisión aprobada lleva quien la aprobó (r.aprobo, o el del cajetín vigente, o la Gerencia General) aunque la
             emisión vigente esté en revisión y su cajetín no tenga «Aprobó» */
          data: { rev: r.rev, status: r.status || 'aprobado', date: ts(r.date), byId: null, note: r.note || '', fields: PM.clone(r.fields || fields), titleBlock: { ...titleBlock, aprobo: r.aprobo || titleBlock.aprobo || ((r.status || 'aprobado') === 'aprobado' ? R.pat : ''), fechaAprobacion: (r.status || 'aprobado') === 'aprobado' ? r.date : null }, title },
        }));
        const created = D.valid(e.created) ? e.created : revs.length ? D.min(date, ...revs.map((r) => r.data.date.slice(0, 10))) : date;
        const body = PM.newDocBody(t, project, { title, status, rev: e.rev !== undefined ? e.rev : null, titleBlock, createdAt: ts(created, '13:00'), updatedAt: ts(date), createdBy: null, updatedBy: null });
        body.fields = fields;
        if (t.multiple) body.seq = seq;
        out.push({ id, data: body, revs });
      });
    }
    return out;
  }

  /* ---------------------------------------------------------------- constructor */
  function buildData() {
    const items = itemsData();
    const agile = agileData(items);
    const schedule = scheduleData('current', items, agile);
    const wbs = { nodes: wbsNodes(schedule.tasks, false) };
    const costs = costsData(items, agile);
    const baselines = baselinesData(items, agile);
    return { items, agile, schedule, wbs, costs, baselines };
  }
  function buildExample() {
    const project = { ...META };
    const data = buildData();
    const F = computeFacts(data);
    const docs = docsData(project, F, data);
    return {
      format: 'gestor-pmbok',
      version: 1,
      project,
      collections: {
        docs,
        tools: [
          { id: 'wbs', data: data.wbs },
          { id: 'schedule', data: data.schedule },
          { id: 'costs', data: data.costs },
          { id: 'raci', data: raciData() },
          { id: 'agile', data: data.agile },
          { id: 'resources', data: resourcesData() },
        ],
        baselines: data.baselines,
        flows: [],
        backlog: data.items.map(({ id, ...body }) => ({ id, data: body })),
      },
    };
  }

  /* Datos internos para pruebas y documentación (no se guardan en el proyecto). */
  const facts = () => {
    const data = buildData();
    const F = computeFacts(data);
    return { ...F, releaseAt: undefined, velocityAt: undefined, forecastAt: undefined, sprintSum: undefined, sprints: data.agile.sprints.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end, status: s.status, committed: s.committed, completed: s.completed })), uatFrom: UAT_FROM };
  };

  PM.registerExample({
    id: 'erp', icon: 'sprint',
    name: 'Implementación del ERP (ágil)',
    description: 'Proyecto interno adaptativo: ERP de mercado medio con un socio implementador, Scrum con tablero Kanban, tres releases (inventario y alquiler, facturación electrónica y cartera, mantenimiento y tablero gerencial) y entregables predictivos de selección, infraestructura, migración y capacitación.',
    summary: ['Proyecto interno de TI', 'Adaptativo (ágil)', '9 meses', 'COP 680 M'],
    build: () => buildExample(),
    facts,
  });
})();

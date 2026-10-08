/* ==========================================================================
   90-example.js — constructor del proyecto de ejemplo (SPEC.md §8).
   Devuelve el formato de exportación que consume PM.projectOps.importData:
   {format:'gestor-pmbok', version:1, project, collections:{docs, tools,
   baselines, flows}}. Todo es determinista (ids fijos, sin azar): dos
   construcciones dan el mismo resultado. Las líneas base LB0 y LB1 se
   calculan aquí con PM.calc.computeSchedule y PM.calc.makeBaselineSnapshot.
   Los documentos salen de los ejemplos de las plantillas; su estado, revisión
   y fecha de aprobación se ajustan para que ningún documento aprobado cite
   hechos posteriores (incidentes, cambios, LB1) y sus revisiones anteriores
   se derivan quitando esos hechos.
   Se usan roles, no nombres de personas; el proyecto y el cliente son
   ficticios y se identifican como ejemplo.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || typeof PM.registerExample !== 'function') return;
  const D = PM.date;

  /* ---------------------------------------------------------------- datos generales */
  const CODE = 'PRY-2026-014';
  const START = '2026-08-03';
  const END = '2026-12-18';
  const STATUS_DATE = '2026-10-02';
  const META = {
    name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista',
    code: CODE,
    client: 'Constructora Modelo S.A.S. (ficticia)',
    sponsor: 'Gerencia General',
    manager: 'Director de proyecto',
    start: START,
    end: END,
    statusDate: STATUS_DATE,
    budget: 486500000,
    currency: 'COP',
    status: 'En ejecución',
    lifecycle: 'Predictivo',
    location: 'Bogotá D.C. — obra Edificio Altavista (ficticia), Torre 2 de 15 pisos',
    description: 'Proyecto de ejemplo con datos ficticios. Ingeniería, suministro, montaje por etapas, inspección y certificación, alquiler con mantenimiento en obra, desmontaje y retiro de andamio multidireccional para la fachada de la Torre 2 (15 pisos) del Edificio Altavista (ficticio), Bogotá D.C.',
    createdAt: '2026-07-27T13:00:00.000Z',
    createdBy: null,
  };
  const RESERVES_LB0 = { contingency: 32400000, management: 11900000 };
  const RESERVES = { contingency: 22600000, management: 11900000 };

  const R = {
    dir: 'Director de proyecto', ing: 'Ingeniero de diseño', res: 'Residente de obra', sst: 'Coordinador SST (HSE)',
    log: 'Coordinador logístico', sup: 'Supervisor de montaje', top: 'Topógrafo', ope: 'Operarios de bodega',
    cua: 'Cuadrilla de montaje', cam: 'Camión grúa', mon: 'Montacargas de bodega', ins: 'Persona competente (inspector)',
    and: 'Andamio multidireccional Torre 2 (juego)',
  };

  /* ---------------------------------------------------------------- EDT y diccionario */
  /* [id, parentId, nombre, tipo, responsable, descripción, entregable, criterios de aceptación, notas] */
  const WBS = [
    ['w11', null, 'Gestión del proyecto', 'entregable', R.dir,
      'Dirección integrada del proyecto según la Guía del PMBOK®: constitución, planificación, seguimiento y control, control integrado de cambios y cierre.',
      'Plan para la dirección del proyecto, informes de desempeño y acta de cierre',
      'Documentos aprobados por el patrocinador y actas firmadas por el cliente.', ''],
    ['w111', 'w11', 'Inicio y constitución', 'paquete', R.dir,
      'Acta de constitución, identificación y análisis de interesados y reunión de arranque con el cliente y la interventoría.',
      'Acta de constitución aprobada y registro de interesados',
      'Acta firmada por el patrocinador y el director de proyecto; registro de interesados revisado.', ''],
    ['w112', 'w11', 'Planificación del proyecto', 'paquete', R.dir,
      'Plan para la dirección del proyecto con sus planes subsidiarios, líneas base del alcance, del cronograma y de costos, y programa de protección contra caídas.',
      'Plan para la dirección del proyecto y líneas base aprobadas',
      'Aprobación de la Gerencia General y establecimiento de la línea base LB0.', ''],
    ['w113', 'w11', 'Seguimiento y control', 'paquete', R.dir,
      'Comités de obra semanales, medición del avance, valor ganado, informes de desempeño quincenales y control integrado de cambios.',
      'Informes de desempeño del trabajo, actas de comité y registro de cambios',
      'Informe entregado al patrocinador y al cliente dentro de los tres días hábiles siguientes a cada corte.', ''],
    ['w114', 'w11', 'Cierre del proyecto', 'paquete', R.dir,
      'Acta de cierre y aceptación final, facturación final, liquidación del contrato, informe final y registro de lecciones aprendidas.',
      'Acta de cierre firmada e informe final',
      'Acta firmada por el cliente y el patrocinador; paz y salvo de equipo y de cartera.', ''],
    ['w12', null, 'Ingeniería', 'entregable', R.ing,
      'Diseño del sistema de andamio multidireccional para las fachadas norte, oriente y occidente de la Torre 2, con su memoria de cálculo, planos de montaje y planes de trabajo seguro.',
      'Paquete de ingeniería aprobado por la interventoría',
      'Comunicación de aprobación de la interventoría sin observaciones abiertas.', ''],
    ['w121', 'w12', 'Levantamiento topográfico y de fachada', 'paquete', R.ing,
      'Levantamiento de ejes, niveles de losa, voladizos y obstáculos de fachada; ensayo de arrancamiento de anclajes en losa.',
      'Plano de levantamiento y reporte del ensayo de anclajes',
      'Plano firmado por el topógrafo; resultado del ensayo de arrancamiento de al menos 1,5 veces la carga de diseño del anclaje.', ''],
    ['w122', 'w12', 'Diseño, planos de montaje y memoria de cálculo', 'paquete', R.ing,
      'Modulación del andamio, verificación estructural de montantes, anclajes y bases, planos de montaje por etapa y lista de piezas.',
      'Planos de montaje rev. 0, memoria de cálculo y lista de piezas',
      'Memoria firmada por ingeniero civil con matrícula vigente; plataformas para 200 kg/m²; aprobación de la interventoría.', ''],
    ['w123', 'w12', 'Plan de montaje, rescate e izaje', 'paquete', R.ing,
      'Procedimiento de montaje y desmontaje por etapas, plan de rescate en alturas y plan de izaje coordinado con la grúa del cliente.',
      'Plan de montaje y desmontaje, plan de rescate y plan de izaje',
      'Revisados por el coordinador SST y aprobados por el director de proyecto conforme a la Resolución 4272 de 2021.', ''],
    ['w13', null, 'Suministro y logística', 'entregable', R.log,
      'Alistamiento del equipo en bodega, inspección de salida, transporte a obra y recepción con remisiones firmadas.',
      'Equipo completo recibido en obra',
      'Remisiones firmadas por el residente de obra sin faltantes ni piezas no conformes.', ''],
    ['w131', 'w13', 'Alistamiento y clasificación en bodega', 'paquete', R.log,
      'Separación, limpieza y clasificación de montantes, largueros, diagonales, plataformas, bases y rodapiés según la lista de piezas; armado de paquetes por etapa.',
      'Paquetes de equipo por etapa listos para despacho',
      'Conteo físico igual a la lista de piezas de ingeniería.', ''],
    ['w132', 'w13', 'Inspección de salida y remisiones', 'paquete', R.log,
      'Inspección visual de cada pieza antes del despacho (deformaciones, soldaduras y corrosión) y emisión de remisiones.',
      'Remisiones y registro de inspección de salida',
      'El 100 % de las piezas despachadas con inspección de salida conforme.', ''],
    ['w133', 'w13', 'Transporte a obra', 'paquete', R.log,
      'Seis viajes nocturnos en tractomula contratada, dentro del horario permitido para vehículos de carga en Bogotá.',
      'Equipo entregado en obra',
      'Viajes realizados en el horario permitido, sin novedades de tránsito ni daños en el cargue.', ''],
    ['w134', 'w13', 'Recepción e inspección en obra', 'paquete', R.res,
      'Descargue en la zona demarcada, verificación de cantidades contra la remisión e inspección visual de recepción.',
      'Remisiones firmadas y acta de recepción',
      'Cantidades conformes con la remisión; novedades reportadas el mismo día.', ''],
    ['w14', null, 'Montaje', 'entregable', R.res,
      'Montaje del andamio por etapas con torre de escaleras, anclajes, plataformas, accesos y protecciones perimetrales.',
      'Andamio de 15 niveles montado y liberado por etapas',
      'Lista de chequeo aprobada y tarjeta verde por nivel; acta de aceptación por etapa.', ''],
    ['w141', 'w14', 'Montaje niveles 1 a 5', 'paquete', R.sup,
      'Bases regulables, montantes, largueros, diagonales, plataformas, anclajes y torre de escaleras de los niveles 1 a 5.',
      'Niveles 1 a 5 montados',
      'Lista de chequeo de montaje sin pendientes y verticalidad de montantes de máximo 3 mm/m.', ''],
    ['w142', 'w14', 'Montaje niveles 6 a 10', 'paquete', R.sup,
      'Montantes, largueros, diagonales, plataformas, anclajes y torre de escaleras de los niveles 6 a 10, con izaje de material mediante la grúa del cliente.',
      'Niveles 6 a 10 montados',
      'Lista de chequeo de montaje sin pendientes y verticalidad de montantes de máximo 3 mm/m.',
      'Atraso por disponibilidad de la grúa del cliente (INC-003); ver el diagrama de Ishikawa en Calidad.'],
    ['w143', 'w14', 'Montaje niveles 11 a 15', 'paquete', R.sup,
      'Montantes, largueros, diagonales, plataformas, anclajes cada dos niveles y torre de escaleras de los niveles 11 a 15, con exposición a viento.',
      'Niveles 11 a 15 montados',
      'Lista de chequeo de montaje sin pendientes y verticalidad de montantes de máximo 3 mm/m.', ''],
    ['w144', 'w14', 'Accesos y protecciones', 'paquete', R.sup,
      'Pasarelas de acceso a losas, marquesina peatonal, plataforma adicional de descargue en el piso 8 (CC-002), malla de cerramiento, rodapiés y barandas definitivas.',
      'Accesos y protecciones perimetrales completos, con la plataforma de descargue del piso 8',
      'Inspección aprobada por el coordinador SST y por la interventoría; prueba de carga de la plataforma de descargue antes de habilitarla.', '',
      /* diccionario aprobado en la LB0, antes del CC-002 */
      { description: 'Pasarelas de acceso a losas, marquesina peatonal, malla de cerramiento, rodapiés y barandas definitivas.', deliverable: 'Accesos y protecciones perimetrales completos', acceptance: 'Inspección aprobada por el coordinador SST y por la interventoría.' }],
    ['w15', null, 'Certificación y operación', 'entregable', R.dir,
      'Inspección y certificación por persona competente, alquiler del equipo en obra, mantenimiento e inspecciones periódicas.',
      'Andamio certificado y en operación segura',
      'Certificado de inspección vigente y registros de inspección semanal sin hallazgos abiertos.', ''],
    ['w151', 'w15', 'Inspección y certificación por persona competente', 'paquete', R.sst,
      'Inspección y liberación por etapa y certificación del andamio completo por persona competente en trabajo en alturas.',
      'Tarjetas verdes por nivel y certificado de inspección',
      'Certificado firmado por persona competente según la Resolución 4272 de 2021.', ''],
    ['w152', 'w15', 'Alquiler del equipo en obra', 'paquete', R.dir,
      'Permanencia del equipo en obra desde la recepción hasta el final del desmontaje; base de la facturación mensual de alquiler.',
      'Equipo disponible en obra y cortes de alquiler mensuales',
      'Corte de alquiler conciliado y firmado por el cliente cada mes.', ''],
    ['w153', 'w15', 'Mantenimiento e inspecciones periódicas', 'paquete', R.res,
      'Inspecciones semanales, ajustes, reposición de piezas e inducción al personal del cliente en el uso seguro del andamio.',
      'Registros de inspección semanal y de inducción',
      'Ningún hallazgo crítico abierto por más de 24 horas.', ''],
    ['w16', null, 'Desmontaje y retiro', 'entregable', R.res,
      'Desmontaje de arriba hacia abajo, transporte de retorno, inspección de retorno y liquidación de faltantes y daños.',
      'Frente libre de equipo y equipo de regreso en bodega',
      'Acta de entrega del frente firmada por el cliente y acta de inspección de retorno.', ''],
    ['w161', 'w16', 'Desmontaje', 'paquete', R.sup,
      'Desmontaje por niveles del 15 al 1 con retiro de anclajes y resane de perforaciones.',
      'Frente de fachada libre de equipo',
      'Acta de entrega del frente libre firmada por el director de obra del cliente.', ''],
    ['w162', 'w16', 'Transporte de retorno', 'paquete', R.log,
      'Cargue y transporte del equipo a bodega con remisiones de devolución.',
      'Equipo en bodega con remisiones de devolución',
      'Remisiones de devolución firmadas por obra y por almacén.', ''],
    ['w163', 'w16', 'Inspección de retorno', 'paquete', R.log,
      'Conteo, limpieza e inspección de cada pieza devuelta; clasificación en conforme, para reparación o para baja.',
      'Acta de inspección de retorno',
      'Conteo conciliado con las remisiones de despacho y de devolución.', ''],
    ['w164', 'w16', 'Liquidación de faltantes y daños', 'paquete', R.dir,
      'Valoración de faltantes y de piezas dañadas atribuibles al cliente y conciliación para la factura final.',
      'Liquidación de faltantes y daños aceptada por el cliente',
      'Liquidación firmada por el cliente y por la interventoría.', ''],
  ];

  /* ---------------------------------------------------------------- cronograma
     Plan vigente (después del CC-002) con avance al 2 de octubre de 2026.
     base: valores del plan aprobado cuando difieren del vigente (re-estimaciones posteriores a LB1).
     lb0: false → la actividad no existía antes del CC-002. */
  const FS = (id, lag) => ({ id, type: 'FS', lag: lag || 0 });
  const SS = (id, lag) => ({ id, type: 'SS', lag: lag || 0 });
  const FF = (id, lag) => ({ id, type: 'FF', lag: lag || 0 });
  const res = (...pairs) => pairs.map(([name, units]) => ({ name, units }));
  const TASKS = [
    { id: 't01', name: 'Acta de constitución aprobada', wbsId: 'w111', duration: 0, milestone: true, deps: [], cost: 0, resources: [], responsible: 'Gerencia General', progress: 100, notes: 'Firmada el 3 de agosto por el patrocinador y el director de proyecto.' },
    { id: 't02', name: 'Registro de interesados y reunión de arranque', wbsId: 'w111', duration: 2, deps: [FS('t01')], cost: 1400000, resources: res([R.dir, 0.5]), responsible: R.dir, progress: 100, actualStart: '2026-08-03', actualFinish: '2026-08-04' },
    { id: 't03', name: 'Plan para la dirección del proyecto y líneas base', wbsId: 'w112', duration: 4, deps: [FS('t01')], cost: 5600000, resources: res([R.dir, 0.5]), responsible: R.dir, progress: 100, actualStart: '2026-08-03', actualFinish: '2026-08-06', notes: 'Plan y línea base LB0 aprobados por la Gerencia General el 6 de agosto (el 7 es festivo).' },
    { id: 't04', name: 'Programa de protección contra caídas y certificación del personal', wbsId: 'w112', duration: 3, deps: [SS('t03', 1)], cost: 2600000, resources: res([R.sst, 1]), responsible: R.sst, progress: 100, actualStart: '2026-08-04', actualFinish: '2026-08-06' },
    { id: 't05', name: 'Seguimiento y control: comités de obra, informes y control de cambios', wbsId: 'w113', duration: 106, base: { duration: 103 }, deps: [SS('t03', 5), FS('t02')], cost: 24800000, resources: res([R.dir, 0.5]), responsible: R.dir, progress: 43, actualStart: '2026-08-10', notes: 'Esfuerzo de nivel: el avance es proporcional al tiempo transcurrido.' },
    { id: 't06', name: 'Levantamiento topográfico y de fachada', wbsId: 'w121', duration: 4, deps: [FS('t01')], cost: 3600000, resources: res([R.top, 2]), responsible: R.ing, progress: 100, actualStart: '2026-08-03', actualFinish: '2026-08-06' },
    { id: 't07', name: 'Ensayo de arrancamiento de anclajes en losa', wbsId: 'w121', duration: 1, deps: [FS('t06', 2)], cost: 1900000, resources: [], responsible: R.ing, progress: 100, actualStart: '2026-08-11', actualFinish: '2026-08-11', notes: 'Laboratorio subcontratado; resultado conforme.' },
    { id: 't08', name: 'Diseño, planos de montaje y memoria de cálculo', wbsId: 'w122', duration: 9, deps: [FS('t06')], cost: 14200000, resources: res([R.ing, 1]), responsible: R.ing, progress: 100, actualStart: '2026-08-08', actualFinish: '2026-08-19' },
    { id: 't09', name: 'Revisión del diseño con la interventoría y ajustes', wbsId: 'w122', duration: 2, deps: [FS('t08'), FS('t07')], cost: 1800000, resources: res([R.ing, 1]), responsible: R.ing, progress: 100, actualStart: '2026-08-20', actualFinish: '2026-08-21' },
    { id: 't10', name: 'Diseño aprobado por la interventoría', wbsId: 'w122', duration: 0, milestone: true, deps: [FS('t09'), FS('t11'), FS('t12')], cost: 0, resources: [], responsible: R.ing, progress: 100, actualStart: '2026-08-21', actualFinish: '2026-08-21' },
    { id: 't11', name: 'Plan de montaje y desmontaje y plan de rescate', wbsId: 'w123', duration: 4, deps: [SS('t08', 5)], cost: 4400000, resources: res([R.sst, 1]), responsible: R.ing, progress: 100, actualStart: '2026-08-14', actualFinish: '2026-08-19' },
    { id: 't12', name: 'Plan de izaje con la grúa del cliente', wbsId: 'w123', duration: 2, deps: [SS('t11', 2)], cost: 2200000, resources: res([R.sup, 1]), responsible: R.ing, progress: 100, actualStart: '2026-08-18', actualFinish: '2026-08-19' },
    { id: 't13', name: 'Alistamiento y clasificación de piezas en bodega', wbsId: 'w131', duration: 5, deps: [SS('t08', 7)], cost: 9800000, resources: res([R.ope, 4], [R.mon, 1]), responsible: R.log, progress: 100, actualStart: '2026-08-18', actualFinish: '2026-08-22', notes: 'INC-001: faltaron 180 diagonales de 2,57 m; se subarrendaron.' },
    { id: 't14', name: 'Inspección de salida y remisiones', wbsId: 'w132', duration: 2, deps: [FS('t13')], cost: 2600000, resources: res([R.ope, 2], [R.mon, 1]), responsible: R.log, progress: 100, actualStart: '2026-08-24', actualFinish: '2026-08-25' },
    { id: 't15', name: 'Transporte a obra (seis viajes nocturnos)', wbsId: 'w133', duration: 3, deps: [FS('t14'), FS('t10')], cost: 11400000, resources: [], responsible: R.log, progress: 100, actualStart: '2026-08-26', actualFinish: '2026-08-28', notes: 'Tractomulas contratadas con el transportador (ver el enunciado del trabajo de la adquisición). Diagonales subarrendadas recibidas el 27 de agosto.' },
    { id: 't16', name: 'Recepción, descargue e inspección en obra', wbsId: 'w134', duration: 3, deps: [SS('t15', 1)], cost: 3600000, resources: res([R.res, 1], [R.cua, 4], [R.cam, 1]), responsible: R.res, progress: 100, actualStart: '2026-08-27', actualFinish: '2026-08-29' },
    { id: 't17', name: 'Equipo despachado completo a obra', wbsId: 'w134', duration: 0, milestone: true, deps: [FS('t15'), FS('t16')], cost: 0, resources: [], responsible: R.log, progress: 100, actualStart: '2026-08-29', actualFinish: '2026-08-29' },
    { id: 't18', name: 'Montaje niveles 1 a 5 (con torre de escaleras y anclajes)', wbsId: 'w141', duration: 17, deps: [FS('t17'), FS('t04'), FS('t10')], cost: 58500000, resources: res([R.cua, 6], [R.sup, 1]), responsible: R.sup, progress: 100, actualStart: '2026-08-31', actualFinish: '2026-09-19', notes: 'Lluvias del 8 y 9 de septiembre (INC-002): un día hábil de atraso, recuperado en parte con jornada extendida.' },
    { id: 't19', name: 'Montaje niveles 6 a 10', wbsId: 'w142', duration: 22, base: { duration: 18 }, deps: [FS('t18')], cost: 62000000, resources: res([R.cua, 6], [R.sup, 1]), responsible: R.sup, progress: 60, actualStart: '2026-09-21', notes: 'Grúa del cliente disponible 2,5 horas diarias frente a 4 horas previstas (INC-003). Duración re-estimada de 18 a 22 días hábiles.' },
    { id: 't20', name: 'Montaje niveles 11 a 15', wbsId: 'w143', duration: 16, base: { duration: 18, resources: res([R.cua, 6], [R.sup, 1]) }, deps: [FS('t19')], cost: 60400000, resources: res([R.cua, 8], [R.sup, 1]), responsible: R.sup, progress: 0, notes: 'Refuerzo de dos montadores para recuperar el atraso: duración re-estimada de 18 a 16 días hábiles.' },
    { id: 't21', name: 'Plataforma de descargue en piso 8 (CC-002)', wbsId: 'w144', duration: 4, lb0: false, start: '2026-10-05', base: { start: null }, deps: [SS('t19', 7)], cost: 9800000, resources: res([R.cua, 2], [R.sup, 1]), responsible: R.sup, progress: 0, notes: 'Agregada por el CC-002, aprobado el 11 de septiembre. Reprogramada para iniciar el 5 de octubre porque el montaje del piso 8 se atrasó.' },
    { id: 't22', name: 'Pasarelas de acceso a losas y marquesina peatonal', wbsId: 'w144', duration: 4, deps: [SS('t20', 10)], cost: 9600000, resources: res([R.cua, 2], [R.sup, 1]), responsible: R.sup, progress: 0, notes: 'Con el refuerzo de los niveles 11 a 15 la cuadrilla queda sobreasignada en estos días: nivelar antes del 20 de octubre.' },
    { id: 't23', name: 'Malla de cerramiento, rodapiés y barandas definitivas', wbsId: 'w144', duration: 5, deps: [FS('t20')], cost: 13200000, resources: res([R.cua, 6], [R.sup, 1]), responsible: R.sup, progress: 0 },
    { id: 't24', name: 'Inspección y liberación niveles 1 a 5', wbsId: 'w151', duration: 1, deps: [FS('t18')], cost: 1600000, resources: res([R.ins, 1]), responsible: R.sst, progress: 100, actualStart: '2026-09-21', actualFinish: '2026-09-21' },
    { id: 't25', name: 'Andamio certificado niveles 1 a 5', wbsId: 'w151', duration: 0, milestone: true, deps: [FS('t24')], cost: 0, resources: [], responsible: R.sst, progress: 100, actualStart: '2026-09-21', actualFinish: '2026-09-21', notes: 'Etapa 1 aceptada por el cliente con el acta parcial No. 2.' },
    { id: 't26', name: 'Inspección y liberación niveles 6 a 10', wbsId: 'w151', duration: 1, deps: [FS('t19')], cost: 1600000, resources: res([R.ins, 1]), responsible: R.sst, progress: 0 },
    { id: 't27', name: 'Andamio certificado niveles 6 a 10', wbsId: 'w151', duration: 0, milestone: true, deps: [FS('t26')], cost: 0, resources: [], responsible: R.sst, progress: 0 },
    { id: 't28', name: 'Inspección final y certificación del andamio completo', wbsId: 'w151', duration: 4, deps: [FS('t23'), FS('t22'), FS('t21'), FS('t27')], cost: 6400000, resources: res([R.ins, 1], [R.sst, 1]), responsible: R.sst, progress: 0 },
    { id: 't29', name: 'Certificación final del andamio completo', wbsId: 'w151', duration: 0, milestone: true, deps: [FS('t28')], cost: 0, resources: [], responsible: R.sst, progress: 0 },
    { id: 't30', name: 'Alquiler del andamio en obra', wbsId: 'w152', duration: 92, base: { duration: 89 }, deps: [SS('t16'), FF('t33')], cost: 62900000, resources: res([R.and, 1]), responsible: R.dir, progress: 35, actualStart: '2026-08-27', notes: 'Termina con el desmontaje. El avance es proporcional al tiempo en obra; el alquiler se factura por mes vencido.' },
    { id: 't31', name: 'Inducción en uso seguro del andamio al personal del cliente', wbsId: 'w153', duration: 1, deps: [FS('t25')], cost: 1200000, resources: res([R.sst, 1]), responsible: R.sst, progress: 100, actualStart: '2026-09-22', actualFinish: '2026-09-22' },
    { id: 't32', name: 'Inspecciones semanales y mantenimiento en obra', wbsId: 'w153', duration: 58, base: { duration: 55 }, deps: [FS('t25')], cost: 13600000, resources: res([R.res, 0.5]), responsible: R.res, progress: 19, actualStart: '2026-09-21', notes: 'Esfuerzo de nivel hasta el inicio del desmontaje.' },
    { id: 't33', name: 'Desmontaje del andamio (niveles 15 a 1)', wbsId: 'w161', duration: 13, deps: [FS('t29', 11)], cost: 39500000, resources: res([R.cua, 8], [R.sup, 1]), responsible: R.sup, progress: 0, notes: 'Inicia once días hábiles después de la certificación final, cuando el cliente termina los trabajos de fachada.' },
    { id: 't34', name: 'Entrega al cliente del frente libre de equipo', wbsId: 'w161', duration: 0, milestone: true, deps: [FS('t33')], cost: 0, resources: [], responsible: R.res, progress: 0 },
    { id: 't35', name: 'Transporte de retorno a bodega', wbsId: 'w162', duration: 3, deps: [FS('t33')], cost: 11400000, resources: res([R.cam, 1]), responsible: R.log, progress: 0, notes: 'Cargue en obra con camión grúa; tractomulas contratadas con el transportador.' },
    { id: 't36', name: 'Inspección de retorno y clasificación de piezas', wbsId: 'w163', duration: 3, deps: [SS('t35', 1)], cost: 4600000, resources: res([R.ope, 4], [R.mon, 1]), responsible: R.log, progress: 0 },
    { id: 't37', name: 'Liquidación de faltantes y daños con el cliente', wbsId: 'w164', duration: 1, deps: [FS('t36')], cost: 1600000, resources: res([R.dir, 0.5], [R.log, 0.5]), responsible: R.dir, progress: 0 },
    { id: 't38', name: 'Acta de cierre, facturación final y lecciones aprendidas', wbsId: 'w114', duration: 3, deps: [SS('t36', 1)], cost: 4200000, resources: res([R.dir, 0.5]), responsible: R.dir, progress: 0 },
    { id: 't39', name: 'Cierre del proyecto', wbsId: 'w114', duration: 0, milestone: true, deps: [FS('t38'), FS('t37'), FS('t34')], cost: 0, resources: [], responsible: 'Gerencia General', progress: 0 },
  ];
  const RESOURCE_LIMITS = {
    [R.cua]: 8, [R.sup]: 2, [R.cam]: 1, [R.mon]: 1, [R.ope]: 4, [R.ing]: 1, [R.top]: 2, [R.sst]: 1,
    [R.ins]: 1, [R.dir]: 1, [R.res]: 1, [R.log]: 1, [R.and]: 1,
  };

  /* Actividad completa (forma de SPEC §3). */
  const taskOut = (t, variant) => {
    const b = variant === 'plan' ? t.base || {} : {};
    const pick = (k, d) => (k in b ? b[k] : t[k] !== undefined ? t[k] : d);
    const plan = variant === 'plan';
    return {
      id: t.id, name: t.name, wbsId: t.wbsId || null,
      duration: pick('duration', 0), milestone: !!t.milestone,
      start: pick('start', null),
      deps: t.deps.map((d) => ({ ...d })),
      progress: plan ? 0 : t.progress || 0,
      cost: t.cost,
      resources: pick('resources', []).map((r) => ({ ...r })),
      responsible: t.responsible || '',
      actualStart: plan ? null : t.actualStart || null,
      actualFinish: plan ? null : t.actualFinish || null,
      notes: t.notes || '',
    };
  };
  const scheduleSettings = () => ({ workweek: 6, holidaysCO: true, extraHolidays: [], resourceLimits: { ...RESOURCE_LIMITS } });
  /* plan: 'current' (vigente con avance), 'lb1' (aprobado tras el CC-002) o 'lb0' (aprobado inicial) */
  const scheduleData = (plan) => ({
    settings: scheduleSettings(),
    tasks: TASKS.filter((t) => plan !== 'lb0' || t.lb0 !== false).map((t) => taskOut(t, plan === 'current' ? 'current' : 'plan')),
  });

  /* plan 'lb0': diccionario aprobado antes del CC-002. Las notas de seguimiento no forman parte de las líneas base. */
  const wbsNodes = (tasks, plan) => {
    const costByWbs = {};
    for (const t of tasks) if (t.wbsId) costByWbs[t.wbsId] = (costByWbs[t.wbsId] || 0) + (Number(t.cost) || 0);
    const order = {};
    return WBS.map(([id, parentId, name, kind, responsible, description, deliverable, acceptance, notes, lb0]) => {
      const k = parentId || 'root'; order[k] = (order[k] || 0) + 1;
      const node = { id, parentId, name, order: order[k], kind, description, responsible, deliverable, acceptance, costEstimate: parentId ? costByWbs[id] || 0 : null, notes: plan ? '' : notes || '' };
      return plan === 'lb0' && lb0 ? { ...node, ...lb0 } : node;
    });
  };

  /* ---------------------------------------------------------------- costos reales y cortes */
  const ACTUALS = [
    ['2026-08-04', 't02', 'Mano de obra', 'Reunión de arranque e identificación de interesados (horas de dirección)', 'NOM-2026-08A', 1380000],
    ['2026-08-06', 't03', 'Mano de obra', 'Elaboración del plan para la dirección del proyecto y de las líneas base', 'NOM-2026-08A', 5450000],
    ['2026-08-06', 't06', 'Subcontratos', 'Levantamiento topográfico y de fachada (topografía subcontratada)', 'FE-4817', 3690000],
    ['2026-08-08', 't04', 'Otros', 'Exámenes médicos ocupacionales y certificación de trabajo en alturas del personal', 'FE-3305', 2760000],
    ['2026-08-11', 't07', 'Subcontratos', 'Ensayo de arrancamiento de anclajes en losa (laboratorio)', 'FE-1290', 1980000],
    ['2026-08-15', 't08', 'Mano de obra', 'Diseño y memoria de cálculo: horas de ingeniería de la primera quincena de agosto', 'NOM-2026-08A', 7900000],
    ['2026-08-15', 't05', 'Mano de obra', 'Dirección del proyecto y comités: primera quincena de agosto', 'NOM-2026-08A', 1550000],
    ['2026-08-19', 't11', 'Mano de obra', 'Plan de montaje y desmontaje y plan de rescate en alturas', 'NOM-2026-08B', 4310000],
    ['2026-08-19', 't12', 'Mano de obra', 'Plan de izaje con la grúa del cliente', 'NOM-2026-08B', 2140000],
    ['2026-08-21', 't08', 'Mano de obra', 'Diseño y planos de montaje: saldo de horas de ingeniería', 'NOM-2026-08B', 6720000],
    ['2026-08-21', 't09', 'Mano de obra', 'Revisión del diseño con la interventoría y ajustes a planos', 'NOM-2026-08B', 1720000],
    ['2026-08-22', 't13', 'Mano de obra', 'Alistamiento, limpieza y clasificación de piezas en bodega', 'NOM-2026-08B', 9640000],
    ['2026-08-25', 't14', 'Mano de obra', 'Inspección de salida y emisión de remisiones', 'NOM-2026-08B', 2580000],
    ['2026-08-27', 't13', 'Equipos', 'Subarriendo de 180 diagonales de 2,57 m (INC-001)', 'OC-031', 3880000],
    ['2026-08-28', 't15', 'Transporte', 'Fletes a obra: seis viajes nocturnos en tractomula (transportador contratado)', 'FE-7712', 11980000],
    ['2026-08-29', 't16', 'Mano de obra', 'Recepción, descargue e inspección de equipo en obra', 'NOM-2026-08B', 3720000],
    ['2026-08-31', 't05', 'Mano de obra', 'Dirección del proyecto y comités: segunda quincena de agosto', 'NOM-2026-08B', 2950000],
    ['2026-08-31', 't30', 'Equipos', 'Alquiler interno del andamio en obra: agosto (del 27 al 31)', 'ALQ-2026-08', 2910000],
    ['2026-09-01', 't18', 'Materiales', 'Anclajes químicos, tornillería y amarres para los niveles 1 a 5', 'OC-034', 6450000],
    ['2026-09-02', 't18', 'Otros', 'Líneas de vida, arneses de repuesto y elementos de protección personal', 'OC-035', 3100000],
    ['2026-09-05', 't18', 'Mano de obra', 'Cuadrilla de montaje niveles 1 a 5: semana del 31 de agosto', 'NOM-2026-09S1', 14700000],
    ['2026-09-12', 't18', 'Mano de obra', 'Cuadrilla de montaje niveles 1 a 5: semana del 7 de septiembre (dos días de lluvia)', 'NOM-2026-09S2', 13100000],
    ['2026-09-15', 't05', 'Mano de obra', 'Dirección del proyecto y comités: primera quincena de septiembre', 'NOM-2026-09A', 3100000],
    ['2026-09-19', 't18', 'Mano de obra', 'Cuadrilla de montaje niveles 1 a 5: semana del 14 de septiembre', 'NOM-2026-09S3', 14800000],
    ['2026-09-19', 't18', 'Mano de obra', 'Horas extra por jornada extendida después de las lluvias (INC-002)', 'NOM-2026-09S3', 3150000],
    ['2026-09-19', 't18', 'Equipos', 'Malacate eléctrico y herramienta de montaje (31 de agosto al 19 de septiembre)', 'FE-2240', 4600000],
    ['2026-09-21', 't24', 'Subcontratos', 'Inspección y liberación de los niveles 1 a 5 por persona competente', 'FE-0562', 1600000],
    ['2026-09-22', 't31', 'Otros', 'Inducción en uso seguro del andamio al personal del cliente', 'FE-0571', 1080000],
    ['2026-09-22', 't19', 'Materiales', 'Anclajes y tornillería para los niveles 6 a 10', 'OC-038', 4900000],
    ['2026-09-26', 't19', 'Mano de obra', 'Cuadrilla de montaje niveles 6 a 10: semana del 21 de septiembre', 'NOM-2026-09S4', 14400000],
    ['2026-09-30', 't19', 'Equipos', 'Malacate eléctrico y herramienta de montaje (21 al 30 de septiembre)', 'FE-2291', 2300000],
    ['2026-09-30', 't30', 'Equipos', 'Alquiler interno del andamio en obra: septiembre', 'ALQ-2026-09', 17480000],
    ['2026-09-30', 't05', 'Mano de obra', 'Dirección del proyecto y comités: segunda quincena de septiembre', 'NOM-2026-09B', 3100000],
    ['2026-09-30', 't32', 'Mano de obra', 'Inspecciones semanales y mantenimiento en obra: septiembre', 'NOM-2026-09B', 2450000],
    ['2026-10-02', 't19', 'Mano de obra', 'Cuadrilla de montaje niveles 6 a 10: semana del 28 de septiembre, con horas extra de recuperación', 'NOM-2026-10S1', 17200000],
  ];
  const STATUS_UPDATES = [
    ['su1', '2026-08-14', { t01: 100, t02: 100, t03: 100, t04: 100, t06: 100, t07: 100, t08: 60, t11: 20, t05: 5 },
      'Corte 1: ingeniería en curso; el diseño avanza según lo previsto.'],
    ['su2', '2026-08-28', { t08: 100, t09: 100, t10: 100, t11: 100, t12: 100, t13: 100, t14: 100, t15: 100, t16: 65, t30: 2, t05: 15 },
      'Corte 2: diseño aprobado el 21 de agosto; despachos en curso con subarriendo de diagonales (INC-001).'],
    ['su3', '2026-09-11', { t16: 100, t17: 100, t18: 50, t30: 15, t05: 26 },
      'Corte 3: montaje de los niveles 1 a 5 afectado por las lluvias del 8 y 9 de septiembre (INC-002). CC-002 aprobado.'],
    ['su4', '2026-09-25', { t18: 100, t24: 100, t25: 100, t31: 100, t19: 30, t30: 28, t32: 9, t05: 38 },
      'Corte 4: etapa 1 certificada y aceptada el 21 de septiembre; montaje de los niveles 6 a 10 limitado por la grúa del cliente (INC-003).'],
  ];
  const taskWbs = Object.fromEntries(TASKS.map((t) => [t.id, t.wbsId]));
  const costsData = () => ({
    actuals: ACTUALS.map(([date, taskId, category, description, document, amount], i) => ({ id: 'ac' + String(i + 1).padStart(2, '0'), date, amount, taskId, wbsId: taskWbs[taskId] || null, category, description, document })),
    statusUpdates: STATUS_UPDATES.map(([id, date, progress, note]) => ({ id, date, progress: { ...progress }, note })),
    reserves: { ...RESERVES },
  });

  /* ---------------------------------------------------------------- matriz RACI */
  const RACI_ROLES = [
    ['rol-pat', 'Patrocinador'], ['rol-dir', 'Director de proyecto'], ['rol-ing', 'Ingeniero de diseño'], ['rol-res', 'Residente de obra'],
    ['rol-sst', 'Coordinador SST (HSE)'], ['rol-log', 'Coordinador logístico'], ['rol-sup', 'Supervisor de montaje'], ['rol-int', 'Interventoría del cliente'],
  ];
  /* Celdas en el orden de RACI_ROLES; '' = sin asignación. */
  const RACI = {
    w11: ['A', 'R', 'I', 'C', 'C', 'I', 'I', 'I'],
    w111: ['A', 'R', '', 'I', '', '', '', 'I'],
    w112: ['A', 'R', 'C', 'C', 'C', 'C', 'C', ''],
    w113: ['I', 'A', '', 'R', 'C', 'C', 'C', 'I'],
    w114: ['A', 'R', '', 'C', '', 'C', '', 'C'],
    w12: ['', 'A', 'R', 'C', 'C', '', '', 'C'],
    w121: ['', 'I', 'A', 'R', '', '', '', 'I'],
    w122: ['', 'A', 'R', '', '', '', 'C', 'C'],
    w123: ['', 'A', 'R', '', 'R', '', 'C', 'I'],
    w13: ['', 'A', '', 'I', '', 'R', 'C', ''],
    w131: ['', '', '', 'I', '', 'RA', 'C', ''],
    w132: ['', '', 'C', '', '', 'A', 'R', ''],
    w133: ['', '', '', 'I', 'C', 'RA', '', ''],
    w134: ['', '', '', 'A', '', 'C', 'R', 'I'],
    w14: ['', 'A', 'C', 'R', 'C', '', 'R', 'I'],
    w141: ['', '', 'C', 'A', 'C', '', 'R', 'I'],
    w142: ['', '', 'C', 'A', 'C', '', 'R', 'I'],
    w143: ['', '', 'C', 'A', 'C', '', 'R', 'I'],
    w144: ['I', '', 'C', 'A', 'C', '', 'R', 'C'],
    w15: ['', 'A', '', 'R', 'R', '', '', 'C'],
    w151: ['', 'A', 'C', 'C', 'R', '', '', 'I'],
    w152: ['I', 'A', '', 'R', '', 'C', '', ''],
    w153: ['', '', '', 'A', 'R', '', 'R', 'I'],
    w16: ['', 'A', '', 'R', 'C', 'C', 'R', 'I'],
    w161: ['', '', '', 'A', 'C', '', 'R', 'I'],
    w162: ['', '', '', 'C', 'C', 'RA', '', ''],
    w163: ['', 'I', '', '', '', 'A', 'R', ''],
    w164: ['I', 'A', '', 'C', '', 'R', '', 'C'],
  };
  const raciData = () => {
    const names = Object.fromEntries(WBS.map((w) => [w[0], w[2]]));
    return {
      roles: RACI_ROLES.map(([id, name]) => ({ id, name })),
      rows: WBS.filter((w) => RACI[w[0]]).map((w) => {
        const cells = {};
        RACI[w[0]].forEach((v, i) => { if (v) cells[RACI_ROLES[i][0]] = v; });
        return { id: 'rc-' + w[0], wbsId: w[0], activity: names[w[0]], cells };
      }),
    };
  };

  /* ---------------------------------------------------------------- calidad */
  const ISHIKAWA = [
    ['Mano de obra', [
      ['Dos montadores nuevos sin experiencia en niveles altos', ['Rotación de personal al terminar la etapa 1', 'Curva de aprendizaje del sistema multidireccional']],
      ['Cuadrilla esperando material izado', ['Tiempo muerto de 1,5 horas diarias en promedio']],
    ]],
    ['Método', [
      ['Secuencia de izaje no coordinada con el programa de la grúa', ['Plan de izaje sin ventana fija de grúa', 'Cambios diarios en las prioridades de izaje de la obra']],
      ['Paquetes de material sin preclasificar por nivel', ['Despachos armados por tipo de pieza y no por nivel']],
    ]],
    ['Maquinaria', [
      ['Grúa torre del cliente disponible 2,5 horas diarias frente a 4 horas previstas', ['Prioridad a los vaciados de concreto', 'Mantenimiento no programado de la grúa']],
      ['Malacate de apoyo con capacidad limitada', ['Carga máxima de 200 kg por izada']],
    ]],
    ['Materiales', [
      ['Diagonales subarrendadas de otra referencia', ['Faltante en bodega (INC-001)', 'Requieren adaptadores en las rosetas']],
      ['Piezas deformadas detectadas en obra', ['Inspección de salida por muestreo en el último despacho']],
    ]],
    ['Medición', [
      ['Avance medido por niveles completos y no por módulos', ['El atraso se detectó una semana tarde']],
      ['Liberaciones programadas al final de cada etapa', []],
    ]],
    ['Medio ambiente', [
      ['Lluvias de septiembre y octubre', ['Dos días de suspensión total', 'Tardes con tormenta eléctrica']],
      ['Viento fuerte por encima del nivel 8 en las tardes', ['Suspensión del izaje con viento mayor a 40 km/h']],
    ]],
  ];
  const PARETO_RETORNO = [
    ['Piezas con mortero o concreto adherido', 64], ['Diagonales dobladas', 46], ['Plataformas con ganchos deformados', 38],
    ['Bases regulables con la rosca dañada', 29], ['Faltantes (pérdida en obra)', 21], ['Largueros con la cuña dañada', 12],
    ['Rodapiés partidos', 9], ['Montantes con la roseta deformada', 6],
  ];
  /* Verticalidad de montantes (mm/m): una medición por inspección; la muestra 14 está fuera de control. */
  const VERTICALIDAD = [
    ['2026-09-01', 0.4], ['2026-09-03', -0.2], ['2026-09-05', 0.6], ['2026-09-07', 0.3], ['2026-09-10', -0.1],
    ['2026-09-12', 0.5], ['2026-09-14', 0.8], ['2026-09-15', 0.2], ['2026-09-17', 0.0], ['2026-09-18', 0.4],
    ['2026-09-19', 0.6], ['2026-09-22', 0.3], ['2026-09-23', -0.3], ['2026-09-24', 2.6], ['2026-09-25', 0.5],
    ['2026-09-26', 0.1], ['2026-09-28', 0.4], ['2026-09-29', 0.7], ['2026-09-30', 0.2], ['2026-10-01', 0.3],
  ];
  const qualityData = () => ({
    ishikawa: [{
      id: 'ish-1',
      name: 'Retraso en el montaje de los niveles 6 a 10',
      effect: 'Montaje de los niveles 6 a 10 con 60 % de avance al 2 de octubre frente a 67 % planificado',
      categories: ISHIKAWA.map(([name, causes], ci) => ({
        id: 'ish-1-c' + (ci + 1), name,
        causes: causes.map(([text, subs], ki) => ({ id: 'ish-1-c' + (ci + 1) + '-' + (ki + 1), text, sub: subs.map((s, si) => ({ id: 'ish-1-c' + (ci + 1) + '-' + (ki + 1) + '-' + (si + 1), text: s })) })),
      })),
    }],
    pareto: [
      { id: 'par-1', name: 'Novedades en inspección de retorno (histórico de obras de 2025)', source: 'manual', items: PARETO_RETORNO.map(([cause, count], i) => ({ id: 'par-1-' + (i + 1), cause, count })) },
      { id: 'par-2', name: 'No conformidades en inspecciones de montaje', source: 'mediciones', items: [] },
    ],
    control: [{
      id: 'ctl-1', name: 'Verticalidad de montantes', unit: 'mm/m', target: 0, lsl: -3, usl: 3,
      points: VERTICALIDAD.map(([date, value], i) => ({ id: 'ctl-1-' + String(i + 1).padStart(2, '0'), date, value })),
    }],
  });

  /* ---------------------------------------------------------------- diagramas de flujo */
  const node = (id, type, x, y, w, h, text) => ({ id, type, x, y, w, h, text });
  const edge = (id, from, to, label) => ({ id, from, to, label: label || '' });
  const flowsData = () => [
    {
      id: 'flujo-cambios',
      data: {
        name: 'Control integrado de cambios (4.6)',
        description: 'Proceso 4.6 Realizar el control integrado de cambios del proyecto: de la solicitud a la actualización de las líneas base y la comunicación de la decisión. El director aprueba los cambios de nivel 1 dentro de su autoridad; los de nivel 2 y 3, y los que el director no aprueba, los decide el comité de control de cambios.',
        lanes: [{ id: 'ln-sol', name: 'Solicitante', h: 176 }, { id: 'ln-dir', name: 'Director de proyecto', h: 176 }, { id: 'ln-ccb', name: 'Comité de control de cambios', h: 192 }],
        nodes: [
          node('c-ini', 'terminal', 176, 64, 160, 48, 'Necesidad de cambio identificada'),
          node('c-sol', 'document', 384, 48, 160, 80, 'Diligenciar la solicitud de cambio'),
          node('c-reg', 'process', 384, 232, 160, 64, 'Registrar en el registro de cambios'),
          node('c-imp', 'process', 592, 224, 160, 80, 'Analizar el impacto en alcance, cronograma, costos y riesgos'),
          node('c-niv', 'decision', 800, 208, 176, 112, '¿Es de nivel 1 y lo aprueba el director?'),
          node('c-ccb', 'decision', 1008, 392, 176, 112, '¿Lo aprueba el comité?'),
          node('c-act', 'process', 1240, 224, 160, 80, 'Actualizar el plan, las líneas base y el registro'),
          node('c-rec', 'process', 1240, 416, 160, 64, 'Registrar el rechazo y su justificación'),
          node('c-com', 'process', 1448, 232, 160, 64, 'Comunicar la decisión a los interesados'),
          node('c-fin', 'terminal', 1448, 64, 160, 48, 'Fin: decisión comunicada'),
          node('c-nota', 'note', 176, 384, 288, 112, 'Nivel 1: sin efecto en hitos ni en el alcance del contrato y costo de hasta COP 4,9 millones (1 % del presupuesto). Los niveles 2 y 3 siempre van al comité.'),
        ],
        edges: [
          edge('ce1', 'c-ini', 'c-sol'), edge('ce2', 'c-sol', 'c-reg'), edge('ce3', 'c-reg', 'c-imp'), edge('ce4', 'c-imp', 'c-niv'),
          edge('ce5', 'c-niv', 'c-act', 'Sí'), edge('ce6', 'c-niv', 'c-ccb', 'No'), edge('ce7', 'c-ccb', 'c-act', 'Sí'), edge('ce8', 'c-ccb', 'c-rec', 'No'),
          edge('ce9', 'c-act', 'c-com'), edge('ce10', 'c-rec', 'c-com'), edge('ce11', 'c-com', 'c-fin'),
        ],
        createdAt: '2026-08-06T20:00:00.000Z',
        updatedAt: '2026-09-14T20:00:00.000Z',
      },
    },
    {
      id: 'flujo-recepcion',
      data: {
        name: 'Recepción e inspección de equipo en obra',
        description: 'Recepción de andamio y accesorios en obra: verificación contra la remisión, inspección visual y tratamiento de faltantes y de piezas no conformes antes del montaje.',
        lanes: [],
        nodes: [
          node('r-ini', 'terminal', 160, 32, 176, 48, 'Llegada del vehículo a obra con la remisión'),
          node('r-doc', 'process', 160, 128, 176, 64, 'Verificar remisión, permiso de carga y horario'),
          node('r-des', 'process', 160, 232, 176, 64, 'Descargar con camión grúa en la zona demarcada'),
          node('r-con', 'process', 160, 336, 176, 64, 'Contar las piezas contra la remisión'),
          node('r-cmp', 'decision', 168, 440, 160, 96, '¿Cantidades completas?'),
          node('r-fal', 'document', 416, 448, 192, 80, 'Reportar faltantes al coordinador logístico'),
          node('r-ins', 'process', 160, 584, 176, 64, 'Inspección visual: deformaciones, soldaduras y corrosión'),
          node('r-cnf', 'decision', 168, 688, 160, 96, '¿Equipo conforme?'),
          node('r-nov', 'document', 416, 696, 192, 80, 'Reportar la novedad con registro fotográfico'),
          node('r-sep', 'process', 416, 832, 192, 64, 'Separar piezas no conformes para devolución a bodega'),
          node('r-alm', 'process', 160, 832, 176, 64, 'Almacenar en obra y firmar la remisión'),
          node('r-inv', 'data', 160, 936, 176, 64, 'Actualizar el inventario de equipo en obra'),
          node('r-fin', 'terminal', 160, 1040, 176, 48, 'Equipo disponible para montaje'),
          node('r-nota', 'note', 416, 224, 192, 80, 'Ninguna pieza se monta sin inspección de recepción (Resolución 4272 de 2021).'),
        ],
        edges: [
          edge('re1', 'r-ini', 'r-doc'), edge('re2', 'r-doc', 'r-des'), edge('re3', 'r-des', 'r-con'), edge('re4', 'r-con', 'r-cmp'),
          edge('re5', 'r-cmp', 'r-ins', 'Sí'), edge('re6', 'r-cmp', 'r-fal', 'No'), edge('re7', 'r-fal', 'r-ins'),
          edge('re8', 'r-ins', 'r-cnf'), edge('re9', 'r-cnf', 'r-alm', 'Sí'), edge('re10', 'r-cnf', 'r-nov', 'No'),
          edge('re11', 'r-nov', 'r-sep'), edge('re12', 'r-sep', 'r-alm', 'Piezas conformes'), edge('re13', 'r-alm', 'r-inv'), edge('re14', 'r-inv', 'r-fin'),
        ],
        createdAt: '2026-08-20T20:00:00.000Z',
        updatedAt: '2026-08-26T20:00:00.000Z',
      },
    },
  ];

  /* ---------------------------------------------------------------- documentos */
  const ts = (date, hhmm) => date + 'T' + (hhmm || '21:00') + ':00.000Z';
  const REVISO_BY_AREA = {
    integracion: R.res, alcance: R.ing, cronograma: R.res, costos: 'Facturación y cartera', calidad: R.res,
    recursos: R.sup, comunicaciones: R.res, riesgos: R.sst, adquisiciones: R.log, interesados: R.res,
  };
  const ELABORO = { 'registro-incidentes': R.res, 'registro-comunicaciones': R.res, 'mediciones-control-calidad': R.sup, 'documentos-prueba': R.sup, 'asignaciones-recursos': R.res };
  /* Sufijo del título de una instancia (plantillas múltiples), tomado de los campos del ejemplo. */
  const monthYear = (iso) => (PM.date.valid(iso) ? PM.MONTHS_LONG[+iso.slice(5, 7) - 1] + ' ' + iso.slice(0, 4) : null);
  const monthInText = (txt) => { const m = new RegExp('(' + PM.MONTHS_LONG.join('|') + ')(?: de)? (\\d{4})', 'i').exec(String(txt || '')); return m ? m[1].toLowerCase() + ' ' + m[2] : null; };
  const shorten = (txt, n) => { const t = String(txt || '').trim().replace(/[.;:]$/, ''); if (t.length <= n) return t; const cut = t.slice(0, n); return cut.slice(0, Math.max(cut.lastIndexOf(' '), 20)) + '…'; };
  const INSTANCE_SUFFIX = {
    'informe-desempeno': (ex) => monthInText(ex.numeroInforme) || monthYear(ex.periodoInicio),
    'informe-calidad': (ex) => monthYear(ex.periodoDesde || ex.fecha),
    'solicitud-cambio': (ex) => (ex.codigoCambio ? ex.codigoCambio + (/plataforma[^.]*piso 8/i.test(ex.descripcionCambio || '') ? ' Plataforma de descargue en piso 8' : '') : null),
    'acta-aceptacion-entregable': (ex) => (ex.numeroActa ? ex.numeroActa + (/niveles 1 a 5/.test(JSON.stringify(ex.entregablesPresentados || '')) ? ' (niveles 1 a 5)' : '') : null),
    'acta-reunion': (ex) => (ex.tipoReunion ? ex.tipoReunion + (ex.numero ? ' No. ' + ex.numero : '') + (PM.date.valid(ex.fecha) ? ' — ' + PM.fmt.date(ex.fecha, 'long') : '') : null),
    'enunciado-trabajo-adquisicion': (ex) => (ex.adquisicion ? shorten(String(ex.adquisicion).split(' entre ')[0], 64) : null),
  };
  /* Plan de estado y revisiones por plantilla (grupo de procesos y casos particulares).
     fixed: registro con fecha propia (acta, solicitud): no se reemite. history: [rev, estado, fecha, nota, variante]. */
  /* LB0 se aprueba al terminar la planificación (jueves 6 de agosto; el 7 es festivo, Batalla de Boyacá).
     LB1 se establece el lunes siguiente a la aprobación del CC-002 (viernes 11 de septiembre). */
  const LB0_DATE = '2026-08-06';
  const LB1_DATE = '2026-09-14';
  const SPECIAL = {
    'caso-negocio': { status: 'aprobado', rev: '0', date: '2026-07-24' },
    'plan-gestion-beneficios': { status: 'aprobado', rev: '0', date: '2026-07-24' },
    'acta-constitucion': {
      status: 'aprobado', rev: '0', date: '2026-08-03',
      history: [['A', 'borrador', '2026-07-28', 'Primer borrador para revisión del patrocinador.', 'draft'], ['B', 'revision', '2026-07-31', 'Ajustes de la Gerencia General: reservas y límite de gasto del director.', 'review'], ['0', 'aprobado', '2026-08-03', 'Emisión aprobada y firmada por el patrocinador.']],
    },
    'registro-supuestos': { status: 'aprobado', rev: '0', date: '2026-08-04' },
    'registro-interesados': { status: 'aprobado', rev: '1', date: '2026-09-15', history: [['0', 'aprobado', '2026-08-04', 'Emisión inicial aprobada.', 'before'], ['1', 'aprobado', '2026-09-15', null]] },
    'plan-direccion': { status: 'aprobado', rev: '1', date: LB1_DATE, history: [['0', 'aprobado', LB0_DATE, 'Emisión aprobada con la línea base LB0.', 'before'], ['1', 'aprobado', LB1_DATE, 'Actualizado con la línea base LB1 (CC-002).']] },
    'registro-riesgos': { status: 'aprobado', rev: '1', date: '2026-09-15', history: [['0', 'aprobado', '2026-08-06', 'Emisión inicial con el plan para la dirección del proyecto.', 'before'], ['1', 'aprobado', '2026-09-15', 'Reevaluación quincenal: riesgos de grúa, pagos y extensión del alquiler actualizados; respuestas ajustadas tras el CC-002.']] },
    'entregables': { status: 'revision', rev: 'B' },
    'registro-incidentes': { status: 'revision', rev: 'B' },
    'registro-lecciones': { status: 'borrador', rev: 'A' },
    'registro-cambios': { status: 'revision', rev: 'B' },
    'informe-desempeno': { status: 'revision', rev: 'A' },
    'solicitud-cambio': { status: 'aprobado', rev: '0', date: '2026-09-11', aprobo: 'Comité de control de cambios', fixed: true },
    'acta-aceptacion-entregable': { status: 'aprobado', rev: '0', date: '2026-09-21', aprobo: 'Director de obra del cliente', fixed: true },
    'acta-reunion': { status: 'aprobado', rev: '0', date: '2026-09-29', dateField: 'fecha', aprobo: R.dir, fixed: true },
    'evaluacion-desempeno-equipo': { status: 'borrador', rev: 'A' },
    'control-adquisiciones': { status: 'borrador', rev: 'A' },
  };
  const docPlan = (t, ex) => {
    const sp = SPECIAL[t.id];
    if (sp) return sp.dateField && D.valid(ex[sp.dateField]) && ex[sp.dateField] <= STATUS_DATE ? { ...sp, date: ex[sp.dateField] } : sp;
    if (t.group === 'inicio') return { status: 'aprobado', rev: '0', date: '2026-08-03' };
    if (t.group === 'planificacion') return { status: 'aprobado', rev: '0', date: '2026-08-06' };
    if (t.kind === 'acta' || t.kind === 'formato') return { status: 'aprobado', rev: '0', date: '2026-10-01', aprobo: R.dir, fixed: true };
    if (t.kind === 'registro') return { status: 'revision', rev: 'B' };
    if (t.kind === 'informe') return { status: 'revision', rev: 'A' };
    return { status: 'borrador', rev: 'A' };
  };

  /* ---------------------------------------------------------------- hechos fechados que cita el contenido
     Un documento aprobado no puede citar hechos posteriores a su aprobación (incidentes, cambios, la LB1 o la
     plataforma del CC-002). Las fechas salen de los registros de incidentes y de cambios de las plantillas;
     si no están, de esta tabla. */
  const EVENTS_DEFAULT = { 'INC-001': '2026-08-25', 'INC-002': '2026-09-08', 'INC-003': '2026-09-15', 'INC-004': '2026-09-24', 'INC-005': '2026-09-30', 'CC-001': '2026-08-19', 'CC-002': '2026-09-11', 'CC-003': '2026-09-29' };
  const eventDates = () => {
    const out = { ...EVENTS_DEFAULT };
    const ex = (id) => (PM.templates && PM.templates[id] && PM.templates[id].example) || {};
    for (const r of ex('registro-incidentes').incidentes || []) if (r && /^INC-\d{3}$/.test(r.id) && D.valid(r.fecha)) out[r.id] = r.fecha;
    for (const r of ex('registro-cambios').cambios || []) if (r && /^CC-\d{3}$/.test(r.id)) { const d = D.valid(r.fechaDecision) ? r.fechaDecision : r.fecha; if (D.valid(d)) out[r.id] = d; }
    return out;
  };
  const GENERIC_LB = /LB0, LB1|LB1, LB2/g;
  const CODE_RE = /\b(?:INC|CC)-\d{3}\b/g;
  const CC002_TEXT = /plataforma (?:adicional |voladiza )?de descargue|prueba de carga de la plataforma/i;
  const evDate = (code, ev) => ev[code === 'LB1' ? 'CC-002' : code] || null;
  const mentionsIn = (s, ev) => {
    const txt = String(s).replace(GENERIC_LB, '');
    const out = (txt.match(CODE_RE) || []).filter((c) => ev[c]);
    if (/\bLB1\b/.test(txt) && ev['CC-002']) out.push('LB1');
    if (CC002_TEXT.test(txt) && ev['CC-002']) out.push('CC-002');
    return out;
  };
  const stringsOf = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach((x) => stringsOf(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => stringsOf(x, out)); return out; };
  const MONTH_NUM = Object.fromEntries(PM.MONTHS_LONG.map((m, i) => [m, String(i + 1).padStart(2, '0')]));
  /* Última fecha ya transcurrida al corte que aparece en el texto (ISO o «19 de septiembre»). */
  const lastPastDate = (fields) => {
    let max = null;
    for (const s of stringsOf(fields)) {
      for (const d of s.match(/\b20\d\d-\d\d-\d\d\b/g) || []) if (D.valid(d) && d <= STATUS_DATE && (!max || d > max)) max = d;
      for (const m of s.matchAll(new RegExp('\\b(\\d{1,2}) de (' + PM.MONTHS_LONG.join('|') + ')(?: de (\\d{4}))?', 'gi'))) {
        const d = (m[3] || '2026') + '-' + MONTH_NUM[m[2].toLowerCase()] + '-' + m[1].padStart(2, '0');
        if (D.valid(d) && d <= STATUS_DATE && (!max || d > max)) max = d;
      }
    }
    return max;
  };
  /* Siguiente día hábil de oficina (lunes a viernes, sin festivos de Colombia) después de iso. */
  const nextBusinessDay = (iso) => {
    let d = D.add(iso, 1);
    for (let i = 0; i < 15; i++) { const w = D.dow(d); if (w !== 0 && w !== 6 && !D.holidaysCO(+d.slice(0, 4)).some((h) => h.date === d)) return d; d = D.add(d, 1); }
    return d;
  };
  const codeLabel = (c) => (c === 'LB1' ? 'la LB1' : 'el ' + c);
  const listEs = (items) => (items.length <= 1 ? items.join('') : items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1]);
  /* Si un documento aprobado cita hechos posteriores a su aprobación, se reemite (rev. siguiente) después del último. */
  const reissue = (p, fields, ev) => {
    if (p.status !== 'aprobado' || p.fixed || !D.valid(p.date)) return p;
    const codes = [...new Set(stringsOf(fields).flatMap((s) => mentionsIn(s, ev)))];
    const late = codes.filter((c) => evDate(c, ev) > p.date).sort((a, b) => evDate(a, ev).localeCompare(evDate(b, ev)) || a.localeCompare(b));
    if (!late.length) return p;
    const lastFact = D.max(...late.map((c) => evDate(c, ev)), lastPastDate(fields));
    const at = D.min(nextBusinessDay(lastFact), STATUS_DATE);
    if (p.history && p.history.length) {
      /* la emisión vigente se mueve después del último hecho citado */
      const history = p.history.map((h, i) => (i === p.history.length - 1 ? [h[0], h[1], at, h[3], h[4]] : h));
      return { ...p, date: at, history };
    }
    const rev = PM.calc.approvedRev(p.rev);
    return { ...p, rev, date: at, history: [[p.rev, 'aprobado', p.date, 'Emisión inicial aprobada.', 'before'], [rev, 'aprobado', at, null]] };
  };
  /* Nota de una emisión sin nota propia: los hechos citados posteriores a la emisión anterior. */
  const autoNote = (fields, ev, since) => {
    const codes = [...new Set(stringsOf(fields).flatMap((s) => mentionsIn(s, ev)))].filter((c) => !since || evDate(c, ev) > since);
    codes.sort((a, b) => evDate(a, ev).localeCompare(evDate(b, ev)) || a.localeCompare(b));
    return codes.length ? 'Actualizado tras ' + listEs(codes.map(codeLabel)) + '.' : 'Emisión actualizada.';
  };

  /* Contenido de una revisión anterior: sin los hechos posteriores a su fecha (cutoff). Antes del CC-002 rigen
     la LB0, el BAC de $ 442,2 M y la reserva para contingencias de $ 32,4 M. */
  const BEFORE_CC002 = [[/\$ 452,0 M/g, '$ 442,2 M'], [/\$ 22,6 M/g, '$ 32,4 M'], [/COP 22,6 millones/g, 'COP 32,4 millones']];
  /* separa oraciones y cláusulas de una enumeración con punto y coma (el signo queda con su segmento) */
  const SEGMENT_SPLIT = /((?<=[.:])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])|(?<=;)\s+)/;
  const capitalize = (t) => t.replace(/^([a-záéíóúñ])/, (c) => c.toUpperCase()).replace(/([.:]\s+)([a-záéíóúñ])/g, (m, a, c) => a + c.toUpperCase());
  const olderText = (s, cutoff, ev) => {
    if (typeof s !== 'string') return s;
    const isLate = (x) => mentionsIn(x, ev).some((c) => evDate(c, ev) > cutoff);
    let x = s;
    if (cutoff < ev['CC-002']) {
      x = x.replace(/(LB0, )?\bLB1\b(, LB2)?/g, (m, a, b) => (a || b ? m : 'LB0'));
      x = BEFORE_CC002.reduce((acc, [re, to]) => acc.replace(re, to), x);
    }
    if (!isLate(x)) return x;
    /* 1) referencias entre paréntesis; 2) la plataforma del CC-002 dentro de una enumeración; 3) oraciones */
    x = x.replace(/\s*\([^()]*\)/g, (m) => (isLate(m) ? '' : m));
    if (cutoff < ev['CC-002']) {
      x = x.replace(/, ([^,;()]+?) y (?:la )?plataforma (?:adicional |voladiza )?de descargue(?: (?:en|del) (?:el )?piso 8)?/gi, ' y $1')
        .replace(/ y (?:la )?plataforma (?:adicional |voladiza )?de descargue(?: (?:en|del) (?:el )?piso 8)?/gi, '')
        .replace(/, prueba de carga de la plataforma(?: de descargue)?/gi, '');
    }
    const src = x.split('\n');
    const lines = src.map((line) => {
      if (!isLate(line)) return line;
      const parts = line.split(SEGMENT_SPLIT);
      const kept = [];
      for (let i = 0; i < parts.length; i += 2) if (!isLate(parts[i])) kept.push(parts[i]);
      return capitalize(kept.join(' ').trim().replace(/[;:,]$/, '.'));
    });
    /* se quitan las líneas que quedaron vacías; se conservan las que ya eran separadores */
    return lines.filter((line, i) => line.trim() || !src[i].trim()).join('\n').trim();
  };
  const isEventCode = (v, cutoff, ev) => typeof v === 'string' && /^(?:INC|CC)-\d{3}$/.test(v.trim()) && evDate(v.trim(), ev) > cutoff;
  const beforeChange = (fields, cutoff, ev) => {
    const out = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!Array.isArray(v)) { out[k] = olderText(v, cutoff, ev); continue; }
      out[k] = [];
      for (const row of v) {
        if (typeof row === 'string') { const s2 = olderText(row, cutoff, ev); if (s2 || !row) out[k].push(s2); continue; }
        if (!row || typeof row !== 'object') { out[k].push(row); continue; }
        /* la fila es un hecho posterior (p. ej. CC-003) o su texto principal solo describe hechos posteriores */
        if (Object.values(row).some((rv) => isEventCode(rv, cutoff, ev))) continue;
        const r2 = {};
        for (const [rk, rv] of Object.entries(row)) r2[rk] = olderText(rv, cutoff, ev);
        const primary = Object.keys(row).find((rk) => rk !== 'id' && typeof row[rk] === 'string' && row[rk].length >= 15);
        if (primary && !String(r2[primary]).trim()) continue;
        if (r2.version === 'LB0' && 'fechaAprobacion' in r2) r2.fechaAprobacion = LB0_DATE;
        out[k].push(r2);
      }
    }
    return out;
  };
  const draftOf = (fields, kind) => {
    const out = PM.clone(fields);
    if (Array.isArray(out.firmas)) out.firmas = [];
    if (kind === 'draft' && typeof out.limiteGasto === 'number') out.limiteGasto = Math.round(out.limiteGasto * 2 / 3 / 1e6) * 1e6;
    return out;
  };
  const SUFFIX_KEYS = ['numeroInforme', 'numeroActa', 'codigoCambio', 'numero', 'titulo', 'tema', 'asunto', 'reunion', 'nombreReunion', 'objeto', 'periodo'];
  const instanceSuffix = (t, ex) => {
    const known = INSTANCE_SUFFIX[t.id] && INSTANCE_SUFFIX[t.id](ex);
    if (known) return known;
    for (const k of SUFFIX_KEYS) { const v = ex[k]; if (typeof v === 'string' && v.trim() && v.length <= 80) return v.trim(); }
    for (const s of t.sections || []) for (const f of s.fields || []) if (f.type === 'date' && PM.date.valid(ex[f.key])) return PM.fmt.date(ex[f.key], 'long');
    return 'ejemplo 1';
  };

  function docsData(project) {
    const list = (PM.templateList || []).filter((t) => t && t.id && t.example && typeof t.example === 'object' && t.group !== 'cierre');
    const ev = eventDates();
    const out = [];
    for (const t of list) {
      const ex = PM.clone(t.example);
      const multiple = !!t.multiple;
      const id = multiple ? t.id + '--ej1' : t.id;
      const title = multiple ? t.name + ' — ' + instanceSuffix(t, ex) : t.name;
      /* campos: el ejemplo de la plantilla; las claves que no trae toman el valor inicial (con ids fijos) */
      const fields = ex;
      for (const [k, v] of Object.entries(PM.newDocBody(t, project, {}).fields || {})) {
        if (k in fields) continue;
        fields[k] = Array.isArray(v) ? v.map((r, i) => (r && typeof r === 'object' ? { ...r, id: k + '-' + (i + 1) } : r)) : v;
      }
      const p = reissue(docPlan(t, ex), fields, ev);
      const history = (p.history || []).map((h, i, arr) => (h[3] ? h : [h[0], h[1], h[2], autoNote(fields, ev, i ? arr[i - 1][2] : null), h[4]]));
      const approved = p.status === 'aprobado';
      const titleBlock = {
        codigo: CODE + '-' + (t.abbr || 'DOC') + (multiple ? '-01' : ''),
        elaboro: ELABORO[t.id] || R.dir,
        reviso: REVISO_BY_AREA[t.area] || R.res,
        aprobo: p.aprobo || 'Gerencia General',
        fechaAprobacion: approved ? p.date : null,
      };
      const created = history.length ? history[0][2] : approved ? p.date : '2026-09-18';
      const updated = history.length ? history[history.length - 1][2] : approved ? p.date : STATUS_DATE;
      const body = PM.newDocBody(t, project, { title, status: p.status, rev: p.rev, titleBlock, createdAt: ts(created, '13:00'), updatedAt: ts(updated), createdBy: null, updatedBy: null });
      body.fields = fields;
      if (multiple) body.seq = 1;
      const revs = history.map(([rev, status, date, note, variant]) => {
        const f = variant === 'before' ? beforeChange(fields, date, ev) : variant === 'draft' || variant === 'review' ? draftOf(fields, variant) : PM.clone(fields);
        const tb = { ...titleBlock, fechaAprobacion: status === 'aprobado' ? date : null };
        return { id: 'rev-' + rev, data: { rev, status, date: ts(date), byId: null, note, fields: f, titleBlock: tb, title } };
      });
      out.push({ id, data: body, revs });
    }
    return out;
  }
  /* Contenido aprobado vigente en una fecha: la última emisión aprobada (documento o revisión) hasta esa fecha. */
  const approvedFieldsAt = (doc, date) => {
    if (!doc) return null;
    const cands = [{ date: doc.data.titleBlock && doc.data.titleBlock.fechaAprobacion, status: doc.data.status, fields: doc.data.fields, cur: 1 }]
      .concat((doc.revs || []).map((r) => ({ date: String(r.data.date || '').slice(0, 10), status: r.data.status, fields: r.data.fields, cur: 0 })))
      .filter((c) => c.status === 'aprobado' && D.valid(c.date) && c.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date) || b.cur - a.cur);
    return cands.length ? PM.clone(cands[0].fields) : null;
  };

  /* ---------------------------------------------------------------- líneas base
     LB0: plan original (sin la plataforma del CC-002 y con las duraciones aprobadas en agosto).
     LB1: plan con el CC-002. El cambio agrega un entregable al alcance (plataforma de descargue, REQ-011), así que
     actualiza las tres líneas base. Ambas instantáneas salen de computeSchedule sobre el plan sin avance. */
  function baselinesData(scopeDoc) {
    const plan = (which) => {
      const data = scheduleData(which);
      return { data, sched: PM.calc.computeSchedule(data, START) };
    };
    const lb0 = plan('lb0');
    const lb1 = plan('lb1');
    const snap0 = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched: lb0.sched, wbs: { nodes: wbsNodes(lb0.data.tasks, 'lb0') }, costs: { reserves: { ...RESERVES_LB0 } }, scopeStatement: approvedFieldsAt(scopeDoc, LB0_DATE) });
    const snap1 = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched: lb1.sched, wbs: { nodes: wbsNodes(lb1.data.tasks, 'lb1') }, costs: { reserves: { ...RESERVES } }, scopeStatement: approvedFieldsAt(scopeDoc, LB1_DATE) });
    return [
      { id: 'lb0', data: { number: 0, label: 'LB0', date: LB0_DATE, includes: ['scope', 'schedule', 'cost'], note: 'Línea base inicial aprobada por la Gerencia General con el plan para la dirección del proyecto (rev. 0).', changeRef: null, byId: null, ...snap0 } },
      { id: 'lb1', data: { number: 1, label: 'LB1', date: LB1_DATE, includes: ['scope', 'schedule', 'cost'], note: 'Plataforma adicional de descargue en piso 8 (+4 días, +COP 9.800.000)', changeRef: 'CC-002', byId: null, ...snap1 } },
    ];
  }

  /* ---------------------------------------------------------------- constructor */
  function buildExample() {
    const project = { ...META };
    const schedule = scheduleData('current');
    const docs = docsData(project);
    return {
      format: 'gestor-pmbok',
      version: 1,
      project,
      collections: {
        docs,
        tools: [
          { id: 'wbs', data: { nodes: wbsNodes(schedule.tasks) } },
          { id: 'schedule', data: schedule },
          { id: 'costs', data: costsData() },
          { id: 'raci', data: raciData() },
          { id: 'quality', data: qualityData() },
        ],
        baselines: baselinesData(docs.find((d) => d.id === 'enunciado-alcance') || null),
        flows: flowsData(),
      },
    };
  }

  PM.registerExample({
    id: 'andamio', icon: 'wbs',
    name: 'Alquiler y montaje de andamio',
    description: 'Suministro, montaje, certificación y desmontaje de un andamio multidireccional para la fachada de una torre de 15 pisos en Bogotá.',
    summary: ['Servicios de obra', '5 meses', 'COP 486,5 M'],
    build: () => buildExample(),
  });
})();

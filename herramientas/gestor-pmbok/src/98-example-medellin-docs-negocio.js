/* ==========================================================================
   98-example-medellin-docs-negocio.js — documentos de negocio del ejemplo
   «Edificio Atalaya del Occidente» (Medellín) para las plantillas de
   15-templates-negocio.js. Se agregan a PM.exampleDocs.medellin con
   Object.assign, como 92 y 93; el constructor 91-example-medellin.js convierte
   cada entrada en un documento (estado, revisión, cajetín y revisiones).

   - Evaluación de necesidades (ANTES del proyecto): la elabora el
     estructurador financiero y la junta directiva decide, en su sesión
     ordinaria del segundo martes de diciembre de 2024 (10 de diciembre),
     elaborar el caso de negocio que aprueba el 10 de enero de 2025.
   - Acuerdo con el cliente: el promotor desarrolla el proyecto para sí mismo
     (el cliente del proyecto es el propio promotor), así que el instrumento que
     lo origina no es un contrato con un tercero sino la decisión de la junta
     directiva que aprueba el caso de negocio y encarga el proyecto a la gerencia
     del proyecto (acta JD-2025-01E: sesión extraordinaria del viernes 10 de
     enero de 2025; la ordinaria de enero era el martes 14): un acuerdo interno
     con el presupuesto del acta de constitución (COP 143.339 millones), sin
     anticipo, retención ni pólizas. La fiducia, el encargo de preventas, el
     crédito y la construcción son contratos derivados (registro de
     adquisiciones, 93).
     Revisiones: rev. 0 con la decisión de la junta (10 de enero de 2025) y
     rev. 1 con la orden de cambio No. 1 del CC-002 (aprobado el 10 de marzo de
     2026; LB1 del 13 de marzo de 2026), que no cambia el presupuesto ni el fin
     del proyecto. La decisión de inversión (22 de abril de 2025, acta de junta
     de abril de 2025) cumple una condición que el acuerdo ya pactaba: no es una
     modificación, no va en la tabla de modificaciones ni origina una revisión;
     la factibilidad aprobada entra a los documentos del acuerdo en la rev. 1.
     Antes de esa decisión el gerente ejecuta, además de los COP 420 millones
     de la fase de estructuración, la gerencia, la gestión administrativa y el
     inicio de los diseños dentro del presupuesto asignado (costos reales del
     ejemplo y registro de adquisiciones, CT-004 desde el 3 de marzo de 2025).
   - Informe de realización de los beneficios: no se diligencia; el proyecto
     no ha cerrado al corte (30 de septiembre de 2026).

   Cifras: las del caso de negocio, el plan de gestión de los beneficios y el
   acta de constitución (92) y del modelo del ejemplo; el plazo en días sale
   de PM.date. Los documentos aprobados no citan hechos posteriores a su
   fecha. Empresas y cifras ficticias; personas por su rol.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM) return;

  const M = 1e6;
  const cp = (x) => JSON.parse(JSON.stringify(x));
  /* filas de tabla con id fijo */
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));

  const R = {
    jun: 'Junta directiva del promotor', ger: 'Gerente de proyecto', est: 'Estructurador financiero', com: 'Gerente comercial',
    abo: 'Abogado del proyecto', ctd: 'Contador del proyecto',
  };
  const P = {
    name: 'EJEMPLO · Edificio Atalaya del Occidente — Medellín',
    client: 'Promotora Modelo Occidente S.A.S. (ficticia)',
    sponsor: R.jun,
    start: '2025-01-13',
    end: '2029-03-28',
    budget: 143339 * M,
  };
  /* Fechas del ejemplo (modelo, §10 y §21) */
  const EVALUACION = '2024-12-06';   /* presentación de la evaluación a la junta */
  const DECISION_EVN = '2024-12-10'; /* sesión ordinaria de la junta (segundo martes de diciembre de 2024) */
  const CASO = '2025-01-10';         /* caso de negocio y plan de gestión de los beneficios aprobados */
  /* La decisión de inversión y la LB0 (22 de abril de 2025) no originan una revisión del acuerdo (ver ORDEN_CAMBIO_1). */
  const CC002 = '2026-03-10';        /* CC-002 aprobado por la junta */
  const LB1 = '2026-03-13';          /* LB1 */

  /* Plazo del acuerdo en días calendario, del inicio al fin del proyecto (ambos incluidos), con el calendario de la aplicación. */
  const PLAZO_DIAS = PM.date && typeof PM.date.diff === 'function' ? PM.date.diff(P.start, P.end) + 1 : 1536;
  const fmtInt = (n) => (PM.fmt && typeof PM.fmt.num === 'function' ? PM.fmt.num(n, 0) : String(n));

  /* ================================================================== ANTES · 4.1 Evaluación de necesidades */
  const evaluacionNecesidades = {
    status: 'aprobado', rev: '0', date: DECISION_EVN,
    titleBlock: { elaboro: R.est, reviso: R.com, aprobo: R.jun },
    fields: {
      nombre: P.name,
      origen: 'Implementar o cambiar una estrategia de negocio o tecnológica',
      solicitante: 'Gerente general del promotor, en la revisión del portafolio para el plan estratégico 2025-2028',
      patrocinador: P.sponsor,
      responsableAnalisis: 'Estructurador financiero, con el gerente comercial (mercado y producto)',
      fechaEvaluacion: EVALUACION,
      problema: 'La Promotora Modelo Occidente S.A.S. (ficticia) no tiene proyectos en preventas para 2025 y 2026 y su banco de tierras en el Valle de Aburrá está agotado. Sin un proyecto nuevo, el equipo de gerencia, estructuración financiera y ventas queda subutilizado y el promotor incumple su meta de mantener al menos un proyecto en preventas y uno en construcción cada año. En suelo urbano consolidado del occidente de Medellín un lote para el mismo número de viviendas cuesta varias veces más por metro cuadrado y obliga a productos de mayor precio, fuera del segmento de estrato 3, el de mayor demanda del occidente de la ciudad. Al promotor le ofrecen un lote de 50.000 m² en el borde urbano occidental (zona 4), en suelo de expansión con tratamiento de Desarrollo (DE) y plan parcial adoptado, por COP 15.000 millones (COP 300.000/m² bruto).',
      objetivosOrganizacion: 'Plan estratégico 2025-2028 del promotor: (1) mantener al menos un proyecto en preventas y uno en construcción cada año; (2) margen antes de impuestos de al menos 12 % de las ventas en No VIS y 8 % en VIS; (3) al menos 25 % de las unidades en VIS, para atender la demanda con subsidio de las cajas de compensación; (4) retorno del capital aportado de al menos 14 % efectivo anual antes de impuestos.',
      urgencia: 'Para tener un proyecto en preventas en el segundo semestre de 2025 hay que asegurar el lote en el primer trimestre (promesa de compraventa con arras) y radicar la licencia durante 2025. La norma de referencia del lote es la del Acuerdo 48 de 2014 y la revisión de mediano plazo del POT puede cambiarla. Si el promotor no decide, el lote puede venderse a otro desarrollador y el vacío de preventas se extiende más allá de 2026.',
      brechas: rows('evn-br', [
        { aspecto: 'Proyectos en preventas', actual: 'Ningún proyecto en preventas para 2025 y 2026.', deseada: 'Al menos un proyecto en preventas y uno en construcción cada año (plan estratégico 2025-2028).', indicador: 'Proyectos en preventas por año', valorActual: 0, valorDeseado: 1 },
        { aspecto: 'Banco de tierras', actual: 'Sin lote para un proyecto nuevo en el Valle de Aburrá; el suelo consolidado del occidente cuesta varias veces más por m² y lleva a productos de mayor precio.', deseada: 'Un lote con norma para vivienda VIS y No VIS de estrato 3, a un precio que permita el margen del plan estratégico.', indicador: '', valorActual: null, valorDeseado: null },
        { aspecto: 'Capacidad para desarrollar suelo de expansión', actual: 'El promotor tiene experiencia en VIS en el Valle de Aburrá, pero no ha desarrollado suelo de expansión con cargas de plan parcial: no existe un procedimiento de unidad de actuación, reparto de cargas y compensación VIP.', deseada: 'Procedimiento documentado y aplicado en un proyecto, con lecciones aprendidas para el siguiente lote.', indicador: 'Procedimientos documentados de unidad de actuación, cargas y compensación VIP', valorActual: 0, valorDeseado: 1 },
        { aspecto: 'Satisfacción de los compradores', actual: 'Promedio de 4,1 / 5 en la encuesta de entrega de los dos últimos proyectos del promotor.', deseada: 'Al menos 4,3 / 5 y 60 % de compradores que recomiendan el proyecto.', indicador: 'Calificación de la encuesta de entrega (escala 1 a 5)', valorActual: 4.1, valorDeseado: 4.3 },
        { aspecto: 'Calidad de la construcción entregada', actual: 'Promedio histórico de 2,3 solicitudes de posventa por vivienda en el primer año.', deseada: 'Como máximo 1,5 solicitudes por vivienda, todas atendidas en los plazos del procedimiento de posventas (Ley 1480 de 2011).', indicador: 'Solicitudes de posventa por vivienda en el primer año', valorActual: 2.3, valorDeseado: 1.5 },
      ]),
      causas: [
        'El banco de tierras del promotor en el Valle de Aburrá está agotado: no hay lote para lanzar preventas en 2025 y 2026.',
        'En suelo urbano consolidado del occidente un lote para el mismo número de viviendas cuesta varias veces más por m² y obliga a productos de mayor precio, fuera del estrato 3.',
        'El suelo disponible en el borde occidental es de expansión: exige ceder vías y espacio público, construir redes, estabilizar laderas y gestionar la unidad de actuación y el reparto de cargas del plan parcial, una capacidad que el promotor todavía no tiene.',
      ],
      afectados: rows('evn-af', [
        { interesado: R.jun, afectacion: 'Sin un proyecto nuevo no cumple el plan estratégico 2025-2028 ni obtiene el margen y el retorno esperados del capital.', expectativa: 'Margen antes de impuestos de al menos 12 % en No VIS y 8 % en VIS, retorno del aporte de al menos 14 % efectivo anual y exposición de capital acotada.', grado: 'Alto' },
        { interesado: 'Equipo de gerencia, estructuración financiera y ventas del promotor', afectacion: 'Queda subutilizado sin proyectos en preventas en 2025 y 2026.', expectativa: 'Un proyecto que ocupe al equipo desde 2025 y abra la línea de suelo de expansión.', grado: 'Alto' },
        { interesado: 'Hogares de estrato 3 del occidente de Medellín (compradores potenciales)', afectacion: 'Son el segmento con mayor demanda del occidente de la ciudad, pero en suelo urbano consolidado el costo del lote obliga a productos de mayor precio, fuera de su segmento: la vivienda VIS y No VIS a su alcance depende de que se desarrolle suelo nuevo, como el de expansión.', expectativa: 'Vivienda VIS con subsidio de caja de compensación o crédito VIS, entregada a tiempo y con calidad.', grado: 'Medio' },
        { interesado: 'Distrito de Medellín (DAP) y comunidad vecina', afectacion: 'El suelo de expansión sin desarrollar no aporta vías, espacio público ni equipamiento al sector.', expectativa: 'Cesiones, vías y redes del plan parcial; control de ruido, polvo y tránsito de volquetas durante la obra.', grado: 'Medio' },
        { interesado: 'Fiduciaria y banco del crédito constructor (por seleccionar)', afectacion: 'Administrarían y financiarían los recursos de un proyecto nuevo.', expectativa: 'Preventas suficientes y condiciones de giro verificables.', grado: 'Bajo' },
      ]),
      opciones: rows('evn-op', [
        { opcion: 'No hacer nada (no comprar el lote)', descripcion: 'Desistir de la oferta y esperar una oportunidad en suelo urbano consolidado.', atiende: 'No', ventajas: 'Sin inversión ni exposición del capital del promotor.', desventajas: 'Ningún proyecto en preventas en 2025 y 2026; equipo subutilizado; el suelo consolidado del occidente cuesta varias veces más por m² y reduce la participación de la VIS.', pasaCaso: true },
        { opcion: 'Hacer lo mínimo: urbanizar y vender súper lotes', descripcion: 'Comprar el lote, gestionar la unidad de actuación, ejecutar las cargas urbanísticas y vender el área útil a otros constructores.', atiende: 'Parcialmente', ventajas: 'Menor plazo y menor exposición comercial que desarrollar vivienda.', desventajas: 'Pocos compradores para súper lotes en el borde; la obligación VIS no se traslada y castiga el precio del suelo; el promotor financia las cargas sin preventas ni crédito constructor y sigue sin proyecto en preventas.', pasaCaso: true },
        { opcion: 'Hacer más: desarrollo integral del lote', descripcion: 'Comprar el lote y desarrollar, vender y construir vivienda VIS y No VIS en propiedad horizontal, con preventas por encargo fiduciario. Con la norma de referencia (100 viviendas/ha) caben hasta 500 viviendas; el caso de negocio compara el desarrollo en una sola etapa y en dos.', atiende: 'Sí', ventajas: 'Llena el vacío de preventas, aporta vivienda VIS al portafolio y crea la capacidad de desarrollar suelo de expansión.', desventajas: 'Mayor capital y plazo; riesgos de velocidad de ventas, tasas de interés, costos de construcción, taludes en ladera y trámites con la curaduría, la Secretaría de Movilidad y EPM.', pasaCaso: true },
      ]),
      recomendacion: 'Elaborar el caso de negocio con las tres opciones, y con el desarrollo integral en una y en dos etapas, y presentarlo a la junta en enero de 2025, antes de comprometer recursos con el propietario del lote. Antes de decidir la compra hay que tener: (1) estudio de títulos, avalúo comercial y levantamiento topográfico del lote; (2) la norma confirmada con la ficha normativa del DAP y la curaduría; (3) una estimación de las cargas del plan parcial y de la compensación de la obligación VIP con el ISVIMED; (4) un estudio de mercado del occidente de Medellín. Se recomienda solicitar desde ya ofertas para el estudio de títulos, el avalúo y el estudio de mercado.',
      criteriosEvaluacion: [
        'Margen antes de impuestos: al menos 12 % de las ventas en No VIS y 8 % en VIS.',
        'Retorno del capital aportado: al menos 14 % efectivo anual antes de impuestos.',
        'Participación de la VIS: al menos 25 % de las unidades.',
        'Exposición máxima del capital del promotor y pico de caja.',
        'Riesgo comercial: velocidad de ventas necesaria para alcanzar el punto de equilibrio de las preventas.',
        'Riesgos técnicos y regulatorios: taludes en ladera, cargas del plan parcial y trámite de la licencia.',
      ],
      supuestosRestricciones: [
        'Norma de referencia del polígono Z4_DE_1 del Acuerdo 48 de 2014 (100 viviendas/ha, índice de construcción de 0,6 sobre área bruta y 8 pisos), por verificar con la ficha normativa del DAP y la curaduría.',
        'Plan parcial adoptado: el promotor no lo formula ni lo modifica.',
        'Restricción: el lote se paga con aporte de capital del promotor, sin crédito.',
        'Restricción: las preventas se hacen por encargo fiduciario según la Circular Básica Jurídica de la Superintendencia Financiera, y la obra de cada etapa solo empieza con su punto de equilibrio.',
        'Precio de la VIS por debajo del tope de 150 SMMLV del año de escrituración (Ley 2294 de 2023, art. 293).',
      ],
      decision: 'Elaborar el caso de negocio',
      fechaDecision: DECISION_EVN,
    },
  };

  /* ================================================================== ANTES · 4.1 Acuerdo (interno) que origina el proyecto */
  const POLIZAS = [
    { id: 'poliza-1', amparo: 'Cumplimiento', estado: 'No aplica' },
    { id: 'poliza-2', amparo: 'Pago de salarios, prestaciones sociales e indemnizaciones laborales', estado: 'No aplica' },
    { id: 'poliza-3', amparo: 'Responsabilidad civil extracontractual', estado: 'No aplica' },
  ];
  const OBLIGACIONES = rows('acu-ob', [
    { parte: 'Contratista o área ejecutora', obligacion: 'Estructurar, vender, construir y entregar el proyecto según la alternativa aprobada en el caso de negocio, dentro del presupuesto y del plazo de este acuerdo.', clausula: 'Primera', responsable: R.ger },
    { parte: 'Contratista o área ejecutora', obligacion: 'Contratar el estudio de títulos, el avalúo comercial y el levantamiento topográfico del lote antes de firmar la promesa de compraventa y pagar las arras del 20 % (COP 3.000 millones).', clausula: 'Segunda', responsable: R.abo },
    { parte: 'Contratista o área ejecutora', obligacion: 'Presentar a la junta la factibilidad técnica, legal y financiera, con el estudio de mercado y el plan para la dirección del proyecto, antes de pagar el 80 % del lote con la escritura.', clausula: 'Segunda', responsable: R.est },
    { parte: 'Contratista o área ejecutora', obligacion: 'Hacer las preventas por encargo fiduciario y manejar los recursos del proyecto en un patrimonio autónomo administrado por una fiduciaria vigilada por la Superintendencia Financiera, con el SAGRILAFT del promotor al día.', clausula: 'Tercera', responsable: R.est },
    { parte: 'Contratista o área ejecutora', obligacion: 'Informar cada mes a la junta (segundo martes) el avance, las ventas, el flujo de caja, los riesgos y los cambios, y someter a su aprobación lo que exceda la autoridad del gerente.', clausula: 'Quinta', responsable: R.ger },
    { parte: 'Contratante o patrocinador', obligacion: 'Aportar el capital del promotor (COP 24.000 millones) para el lote, la compensación VIP y los gastos preoperativos, según el flujo de caja de la factibilidad.', clausula: 'Cuarta', responsable: R.jun },
    { parte: 'Contratante o patrocinador', obligacion: 'Asignar al gerente de proyecto con dedicación completa y al equipo del promotor: estructurador financiero (50 %), gerente comercial (100 %), abogado del proyecto (25 %) y contador del proyecto (50 %).', clausula: 'Cuarta', responsable: R.jun },
    { parte: 'Contratante o patrocinador', obligacion: 'Decidir sobre la factibilidad (decisión de inversión), las líneas base, los cambios fuera de la autoridad del gerente, el uso de la reserva de gestión y el inicio de cada etapa constructiva.', clausula: 'Cuarta', responsable: R.jun },
    { parte: 'Ambas partes', obligacion: 'Revisar en la sesión mensual de la junta el desempeño frente a los criterios de éxito del caso de negocio: utilidad antes de impuestos de al menos 12 % de las ventas, punto de equilibrio de cada etapa en el plazo y certificado técnico de ocupación de cada etapa.', clausula: 'Quinta', responsable: 'Junta directiva del promotor y gerente de proyecto' },
  ]);
  /* La decisión de inversión (LB0) no es una modificación: cumple la condición de las cláusulas Segunda y Cuarta. La única
     modificación del acuerdo al corte es la orden de cambio No. 1 (CC-002), que agrega obras al objeto. */
  const ORDEN_CAMBIO_1 = {
    numero: 'Orden de cambio No. 1', tipo: 'Orden de cambio', fecha: CC002,
    objeto: 'Incorpora al objeto las obras de mitigación vial exigidas en la licencia (bahía de acceso, carril de desaceleración y semaforización sobre la vía colectora), con cargo a la reserva para contingencias (COP 430 millones), y reprograma el inicio de obra de la etapa 1 al 16 de marzo de 2026, con la línea base LB1. El presupuesto de COP 143.339 millones y el fin del proyecto (28 de marzo de 2029) no cambian.',
    solicitudCambio: 'CC-002', efectoValor: 0, efectoPlazo: 0, estado: 'Firmada',
  };
  const MODIFICACIONES = rows('acu-mo', [ORDEN_CAMBIO_1]);
  /* Acta de la sesión que origina el acuerdo: el 10 de enero de 2025 fue viernes y la sesión ordinaria de enero era el
     segundo martes (14 de enero), así que es extraordinaria; numeración de las actas de junta del ejemplo (JD-AAAA-MM y
     «E» para las extraordinarias, como el acta JD-2026-09E de 93). */
  const ACTA_JD = 'Acta JD-2025-01E';
  const DOCS_REV0 = [
    ACTA_JD + ' (sesión extraordinaria de la junta directiva del 10 de enero de 2025), que aprueba el caso de negocio y encarga el proyecto (este acuerdo), y sus modificaciones.',
    'Caso de negocio y plan de gestión de los beneficios aprobados el 10 de enero de 2025.',
    'Evaluación de necesidades decidida por la junta el 10 de diciembre de 2024.',
    'Plan estratégico 2025-2028 del promotor.',
  ];
  const DOCS_REV1 = [
    ACTA_JD + ' (sesión extraordinaria de la junta directiva del 10 de enero de 2025), que aprueba el caso de negocio y encarga el proyecto (este acuerdo), con la orden de cambio No. 1.',
    'Acta de constitución del proyecto (13 de enero de 2025).',
    DOCS_REV0[1],
    'Factibilidad técnica, legal y financiera aprobada en la decisión de inversión (acta de junta de abril de 2025, sesión del 22 de abril de 2025), con la que se cumple la condición de las cláusulas Segunda y Cuarta.',
    'Plan para la dirección del proyecto vigente, con la línea base LB1 (13 de marzo de 2026).',
    DOCS_REV0[2],
    DOCS_REV0[3],
  ];
  const acuerdoFields = {
    tipoAcuerdo: 'Acuerdo interno o memorando de entendimiento',
    numeroAcuerdo: ACTA_JD + ' — sesión extraordinaria de la junta directiva del 10 de enero de 2025 (ficticia)',
    objeto: 'La junta directiva encarga a la gerencia del proyecto estructurar, vender, construir y entregar el Edificio Atalaya del Occidente en el lote de 50.000 m² del borde urbano occidental de Medellín, según la alternativa aprobada en el caso de negocio: 416 viviendas (104 VIS y 312 No VIS) en cuatro bloques de 8 pisos sobre una plataforma de parqueaderos, vendidas y construidas en dos etapas con encargo fiduciario y punto de equilibrio del 75 % por etapa, con las cargas urbanísticas del plan parcial, hasta liquidar el fideicomiso y el crédito constructor.',
    contratante: P.client + ', por decisión de su junta directiva (patrocinador)',
    contratista: 'Gerencia del proyecto de ' + P.client + ': gerente de proyecto, con el estructurador financiero, el gerente comercial, el abogado y el contador del proyecto',
    modalidadPrecio: 'Presupuesto interno asignado',
    fechaFirma: CASO,
    fechaInicio: P.start,
    fechaTerminacion: P.end,
    plazo: fmtInt(PLAZO_DIAS) + ' días calendario (unos 4,2 años): del 13 de enero de 2025 (inicio del proyecto) al 28 de marzo de 2029 (cierre del proyecto, a más tardar).',
    valorInicial: P.budget,
    baseValor: 'No aplica (acuerdo interno)',
    anticipoPct: 0,
    anticipoValor: 0,
    retencionPct: 0,
    formaPago: 'No hay pagos entre las partes: el gerente ejecuta el presupuesto asignado por fases y con sus límites de contratación (los contratos de más de COP 1.000 millones requieren aprobación de la junta). Fase de estructuración: la junta autoriza hasta COP 420 millones para la debida diligencia, el estudio de mercado y la factibilidad, y las arras del lote (COP 3.000 millones) sujetas al estudio de títulos; la gerencia, la gestión administrativa, la unidad de actuación urbanística y el inicio de los diseños se ejecutan dentro del presupuesto asignado. La decisión de inversión (factibilidad aprobada por la junta) autoriza pagar el 80 % del lote con la escritura (COP 12.000 millones) y contratar la fiducia mercantil y el encargo fiduciario de preventas. Fuentes: aporte de capital del promotor de COP 24.000 millones para el lote, la compensación VIP y los gastos preoperativos; cuotas iniciales de los compradores en el encargo fiduciario, liberadas al patrimonio autónomo con el punto de equilibrio de cada etapa; crédito constructor de COP 56.000 millones, y saldos de precio a la escrituración. El gerente ordena los pagos (a través de la fiduciaria desde que se constituya el patrimonio autónomo) y presenta cada mes a la junta la ejecución del presupuesto.',
    polizas: cp(POLIZAS),
    obligaciones: cp(OBLIGACIONES),
    supervision: 'Junta directiva del promotor: recibe el informe mensual del gerente (segundo martes), aprueba los entregables de decisión y actúa como comité de control de cambios; la revisoría fiscal del promotor audita la ejecución del presupuesto.',
    responsableContratista: 'Gerente de proyecto; firma como representante legal del promotor el gerente general.',
    condicionesAceptacion: 'La junta acepta con acta los entregables de decisión: la factibilidad y la línea base (decisión de inversión), cada nueva línea base, el inicio de cada etapa constructiva y el cierre. Una etapa queda aprobada para construir cuando la fiduciaria certifica su punto de equilibrio y el banco aprueba el crédito constructor. Los entregables técnicos los acepta el gerente con la verificación de la supervisión técnica independiente (Ley 1796 de 2016), y los regulatorios con el acto administrativo en firme. El encargo termina con el acta de cierre, después de liquidar el fideicomiso y el crédito constructor.',
    multas: 'No aplican: en un acuerdo interno no hay multas ni cláusula penal entre las partes. Las desviaciones se controlan con el informe mensual a la junta y el escalamiento de riesgos y cambios; las multas, la cláusula penal y las garantías se pactan en cada contrato con terceros, según su objeto: los consultores, la comercializadora y el constructor otorgan pólizas; la fiduciaria es una entidad vigilada por la Superintendencia Financiera y su contrato no las exige.',
    suspensionTerminacion: 'La junta puede suspender o terminar el encargo de forma anticipada si la factibilidad da un margen antes de impuestos menor de 12 % de las ventas, si el estudio de títulos tiene observaciones insalvables (la promesa de compraventa debe incluir una condición resolutoria, para que solo se pierdan los costos de la debida diligencia) o si una etapa no alcanza su punto de equilibrio en el plazo del encargo fiduciario (la fiduciaria devuelve a los compradores sus aportes con rendimientos).',
    otrasClausulas: 'Confidencialidad de la información del lote, de la factibilidad y de los precios hasta el lanzamiento. Los estudios, los diseños y la marca comercial del proyecto son del promotor. Las pólizas no aplican entre las partes: se exigen en los contratos con terceros que las requieren y, para la construcción, se suma el amparo patrimonial de la Ley 1796 de 2016. Las diferencias entre las áreas las resuelve la junta directiva.',
    documentosContractuales: DOCS_REV1.slice(),
    modificaciones: cp(MODIFICACIONES),
    controlModificaciones: 'Las modificaciones del objeto, del presupuesto o del plazo las aprueba la junta directiva como comité de control de cambios, con la solicitud de cambio y el análisis de impacto del gerente, y se formalizan con una orden de cambio numerada, firmada por el presidente de la junta y el gerente general (representante legal). Los cambios dentro de la autoridad del gerente (sin efecto en hitos ni en la utilidad y de hasta COP 300 millones con cargo a la reserva para contingencias) no modifican el acuerdo. Las decisiones que este acuerdo ya prevé (la decisión de inversión y el inicio de cada etapa constructiva) se registran en el acta de la junta y tampoco lo modifican.',
    firmas: rows('acu-fi', [
      { rol: 'Patrocinador', nombre: 'Presidente de la junta directiva del promotor', fecha: CASO },
      { rol: 'Representante legal del promotor', nombre: 'Gerente general del promotor', fecha: CASO },
      { rol: 'Área ejecutora', nombre: R.ger, fecha: CASO },
    ]),
  };
  const acuerdoCliente = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.abo, reviso: R.ger, aprobo: R.jun },
    fields: acuerdoFields,
    revs: [
      { rev: '0', status: 'aprobado', date: CASO, note: 'Emisión inicial: la junta, en sesión extraordinaria (' + ACTA_JD + '), aprueba el caso de negocio y encarga el proyecto a la gerencia del proyecto.', fields: { ...cp(acuerdoFields), documentosContractuales: DOCS_REV0.slice(), modificaciones: [] } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Orden de cambio No. 1 (CC-002) con la LB1: mitigación vial con cargo a la reserva para contingencias; presupuesto y fin del proyecto sin cambio. Entran a los documentos del acuerdo el acta de constitución, la factibilidad aprobada en la decisión de inversión (condición ya pactada, que no modifica el acuerdo) y el plan con la LB1.' },
    ],
  };

  PM.exampleDocs = PM.exampleDocs || {};
  PM.exampleDocs.medellin = Object.assign(PM.exampleDocs.medellin || {}, {
    'evaluacion-necesidades': evaluacionNecesidades,
    'acuerdo-cliente': acuerdoCliente,
    /* informe-beneficios: posterior al cierre; el proyecto no ha cerrado al corte (2026-09-30), no se crea */
  });
})();

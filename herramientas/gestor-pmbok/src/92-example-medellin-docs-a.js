/* ==========================================================================
   92-example-medellin-docs-a.js — contenido de los documentos del ejemplo
   «Edificio Atalaya del Occidente» (Medellín) para las plantillas de
   Integración (cap. 4), Alcance (cap. 5) y Cronograma (cap. 6) registradas en
   12-templates-a.js. El constructor 91-example-medellin.js convierte cada
   entrada en un documento (estado, revisión, cajetín y revisiones emitidas).

   Fuente única de cifras, fechas, roles y códigos: el modelo del ejemplo
   (model.json): lote de 50.000 m² por COP 15.000 millones, 416 viviendas,
   ventas de COP 162.122 millones, costo total de COP 141.939 millones, LB0 del
   22 de abril de 2025, LB1 del 13 de marzo de 2026 (CC-002) y corte del 30 de
   septiembre de 2026. Los documentos aprobados no citan hechos posteriores a
   su fecha de aprobación. Empresas y cifras ficticias; personas por su rol.
   Informe final y acta de cierre: no iniciados al corte (se omiten).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM) return;

  const M = 1e6;
  const cp = (x) => JSON.parse(JSON.stringify(x));
  /* filas de tabla con id fijo (las tablas con columna «id» de código ya lo traen) */
  const rows = (prefix, list) => list.map((r, i) => (r.id ? { ...r } : { id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  /* copia de filas con cambios por id (para las revisiones emitidas) */
  const patchRows = (list, patches, drop) => list.filter((r) => !(drop || []).includes(r.id)).map((r) => (patches[r.id] ? { ...r, ...patches[r.id] } : { ...r }));

  const R = {
    jun: 'Junta directiva del promotor', ger: 'Gerente de proyecto', est: 'Estructurador financiero', com: 'Gerente comercial',
    arq: 'Arquitecto diseñador', ies: 'Ingeniero estructural', con: 'Director de obra (constructor)', sup: 'Supervisión técnica independiente',
    int: 'Interventoría del banco y la fiduciaria', fid: 'Fiduciaria', ban: 'Banco (crédito constructor)', abo: 'Abogado del proyecto',
    ctd: 'Contador del proyecto', res: 'Residente de obra', ins: 'Inspector de calidad',
  };
  const EMP = {
    pro: 'Promotora Modelo Occidente S.A.S. (ficticia)',
    fdc: 'Fideicomiso Atalaya del Occidente (ficticio)',
    fid: 'Fiduciaria Andina S.A. (ficticia)',
    ban: 'Banco Comercial del Valle S.A. (ficticio)',
    con: 'Constructora Laderas S.A.S. (ficticia)',
    com: 'Ventas Inmobiliarias Medellín S.A.S. (ficticia)',
    arq: 'Taller de Arquitectura Ladera S.A.S. (ficticia)',
    est: 'Ingeniería Estructural Andes S.A.S. (ficticia)',
    sup: 'Supervisión Técnica Independiente S.A.S. (ficticia)',
    int: 'Interventorías Financieras S.A.S. (ficticia)',
    geo: 'Geoestructuras Ancladas S.A.S. (ficticia)',
    pil: 'Pilotes y Cimentaciones del Valle S.A.S. (ficticia)',
  };
  const P = {
    name: 'EJEMPLO · Edificio Atalaya del Occidente — Medellín',
    code: 'PRY-2025-003',
    client: EMP.pro,
    sponsor: R.jun,
    manager: R.ger,
    start: '2025-01-13',
    end: '2029-03-28',
    budget: 143339 * M,
  };
  const LB0 = '2025-04-22';
  const LB1 = '2026-03-13';
  const CUT = '2026-09-30';

  /* ================================================================== INICIO */

  /* ------------------------------------------------------------ 4.1 Caso de negocio */
  const casoNegocio = {
    status: 'aprobado', rev: '0', date: '2025-01-10',
    titleBlock: { elaboro: R.est, reviso: R.ger, aprobo: R.jun },
    fields: {
      nombre: P.name,
      cliente: P.client,
      patrocinador: P.sponsor,
      fechaCaso: '2025-01-10',
      necesidad: 'La Promotora Modelo Occidente S.A.S. (ficticia) no tiene proyectos en preventas para 2025 y 2026 y necesita reponer su banco de tierras en el Valle de Aburrá. Se ofrece un lote de 50.000 m² en el borde urbano occidental de Medellín (zona 4), en suelo de expansión con tratamiento de Desarrollo (DE) y plan parcial adoptado, por COP 15.000 millones (COP 300.000/m² bruto; COP 384.615/m² neto urbanizable). En suelo urbano consolidado un lote para el mismo número de viviendas cuesta varias veces más por metro cuadrado y obliga a productos de mayor precio. El suelo de expansión exige ceder vías y espacio público, construir redes y estabilizar laderas, pero permite desarrollar vivienda VIS y No VIS para estrato 3, el segmento con mayor demanda del occidente de la ciudad.',
      alineacion: 'Plan estratégico 2025-2028 del promotor: (1) mantener al menos un proyecto en preventas y uno en construcción cada año; (2) margen antes de impuestos de al menos 12 % de las ventas en No VIS y 8 % en VIS; (3) al menos 25 % de las unidades en VIS, para atender la demanda con subsidio de las cajas de compensación; (4) retorno del capital aportado de al menos 14 % efectivo anual antes de impuestos. El proyecto propuesto tiene 25 % de VIS (104 de 416 viviendas), margen de 12,45 % (11,59 % si se consumiera la reserva de gestión) y un retorno antes de impuestos de 84,1 % sobre el aporte en unos 4,5 años (≈ 14,5 % efectivo anual).',
      brecha: 'El promotor tiene equipo de gerencia, estructuración financiera y ventas, relación con fiduciarias y bancos y experiencia en VIS en el Valle de Aburrá, pero no ha desarrollado suelo de expansión con cargas de plan parcial. Para cerrar la brecha se requiere: (1) debida diligencia del lote (títulos, avalúo y topografía) y confirmación de la norma con la ficha normativa del Departamento Administrativo de Planeación (DAP) y la curaduría; (2) gestión de la unidad de actuación urbanística, del reparto de cargas y de la compensación de la obligación VIP con el ISVIMED; (3) capital de COP 24.000 millones para el lote, la compensación VIP y los gastos preoperativos; (4) un constructor por administración delegada con experiencia en muros de concreto vaciados con formaleta industrializada y obras en ladera.',
      opciones: rows('cn-op', [
        { opcion: 'No hacer nada (no comprar el lote)', descripcion: 'Desistir de la oferta y esperar una oportunidad en suelo urbano consolidado.', costo: 0, ingreso: 0, riesgos: 'Ningún proyecto en preventas en 2025 y 2026; equipo de gerencia y ventas subutilizado; el suelo consolidado del occidente cuesta varias veces más por m² y reduce la participación de VIS.', recomendada: false },
        { opcion: 'Hacer lo mínimo: urbanizar y vender súper lotes', descripcion: 'Comprar el lote, gestionar la unidad de actuación, ejecutar las cargas urbanísticas (vías, redes, parque y equipamiento) y vender los 27.000 m² de área útil a otros constructores a COP 1,40 millones/m². Costo: lote COP 15.000 millones, compensación VIP COP 3.000 millones, cargas COP 12.373 millones y estudios, licencia de urbanización, gerencia y financieros COP 2.600 millones.', costo: 32973 * M, ingreso: 37800 * M, riesgos: 'Pocos compradores para súper lotes en el borde; la obligación VIS no se traslada y castiga el precio del suelo; el promotor financia las cargas sin preventas ni crédito constructor.', recomendada: false },
        { opcion: 'Hacer más: desarrollo integral en dos etapas', descripcion: 'Comprar el lote y desarrollar una edificación en propiedad horizontal con 416 viviendas (104 VIS y 312 No VIS) en cuatro bloques de 8 pisos sobre una plataforma de parqueaderos, vendida y construida en dos etapas de 208 viviendas con encargo fiduciario y punto de equilibrio del 75 % por etapa.', costo: 141939 * M, ingreso: 162122 * M, riesgos: 'Velocidad de ventas y disponibilidad de subsidios; alza de tasas de interés y de costos de construcción; estabilidad de taludes en ladera; exigencias de la curaduría, la Secretaría de Movilidad y EPM.', recomendada: true },
        { opcion: 'Desarrollo integral en una sola etapa', descripcion: 'Las 416 viviendas a la vez, con un solo punto de equilibrio (312 viviendas) y el crédito constructor completo de COP 56.000 millones desde el inicio de la obra. Los costos financieros suben unos COP 2.900 millones por el mayor saldo promedio del crédito.', costo: 144839 * M, ingreso: 162122 * M, riesgos: 'Punto de equilibrio de 312 viviendas: unos 14 meses de preventas aun al ritmo de lanzamiento de 23 ventas al mes, frente a unos 7 meses por etapa; mayor exposición a las tasas y mayor pico de caja.', recomendada: false },
      ]),
      valorContrato: 162122 * M,
      costoEstimado: 143339 * M,
      margenEsperado: 11.59,
      flujoCaja: 'Fuentes: (1) aporte del promotor de COP 24.000 millones para el lote (20 % en la promesa y 80 % en la escritura), la compensación VIP (COP 3.000 millones) y los estudios, diseños, licencias y sala de ventas; (2) cuotas iniciales de los compradores por COP 45.995 millones (20 % en VIS y 30 % en No VIS, en cuotas mensuales hasta dos meses antes de la entrega), consignadas en el encargo fiduciario y liberadas al patrimonio autónomo solo al cumplirse el punto de equilibrio de cada etapa (75 % de las viviendas, licencia ejecutoriada, lote libre de gravámenes y crédito constructor aprobado); (3) crédito constructor de COP 56.000 millones (COP 30.000 millones para la etapa 1 y COP 26.000 millones para la etapa 2; 59 % de los costos directos) a IBR 3M + 4,5 puntos, desembolsado contra avance verificado por la interventoría del banco; (4) saldos de precio por COP 116.127 millones con crédito hipotecario, leasing habitacional o subsidio a la escrituración, que amortizan el crédito constructor por subrogación. La exposición máxima del promotor es su aporte; la utilidad se libera al liquidar el fideicomiso.',
      recomendacion: 'Aprobar la alternativa 3 (desarrollo integral en dos etapas) y constituir el proyecto. Es la alternativa con mayor utilidad: COP 20.183 millones antes de impuestos (12,45 % de las ventas y 14,22 % sobre el costo total con la reserva para contingencias; 11,59 % de las ventas si se consumiera también la reserva de gestión de COP 1.400 millones, como se muestra en el margen esperado), con la exposición de capital acotada a COP 24.000 millones y el riesgo comercial repartido en dos puntos de equilibrio de 156 viviendas. Condiciones para continuar: (1) estudio de títulos sin observaciones y avalúo comercial que soporte el precio antes de firmar la promesa y pagar las arras del 20 % (COP 3.000 millones); (2) norma confirmada con la ficha normativa del DAP y la curaduría; (3) factibilidad técnica, legal y financiera aprobada por la junta directiva antes de pagar el 80 % del lote con la escritura.',
      criteriosExito: [
        'Utilidad antes de impuestos de al menos 12 % de las ventas al liquidar el fideicomiso.',
        'Retorno del aporte de COP 24.000 millones con rentabilidad antes de impuestos de al menos 80 % (≈ 14,5 % efectivo anual).',
        'Punto de equilibrio de cada etapa (156 de 208 viviendas) dentro de los plazos de la línea base.',
        'Certificado técnico de ocupación de cada etapa y 416 viviendas entregadas sin reclamaciones estructurales.',
        'Cesiones y obras de urbanismo recibidas por el Distrito y zonas comunes entregadas a la copropiedad.',
      ],
      riesgosAltoNivel: [
        'Velocidad de ventas inferior a la planificada (23 viviendas al mes en el lanzamiento de la etapa 1 y 14 en la etapa 2) o desistimientos superiores al 5 %.',
        'Alza de las tasas de interés del crédito constructor y de los créditos hipotecarios.',
        'Aumento de los costos de mano de obra y materiales (salario mínimo, acero y concreto).',
        'Lluvias e inestabilidad de taludes en un lote de ladera.',
        'Exigencias adicionales o demoras de la curaduría, la Secretaría de Movilidad o EPM.',
        'Cambios normativos: topes de precio de la VIS y revisión de mediano plazo del POT.',
      ],
      supuestosCaso: 'Norma de referencia del polígono Z4_DE_1 del Acuerdo 48 de 2014 (100 viviendas/ha e índice de construcción de 0,6 sobre área bruta, 8 pisos), por verificar con la ficha normativa; suelo de protección de 7.000 m² y afectación vial de 4.000 m² (área neta urbanizable de 39.000 m²) y área útil de 27.000 m²; 416 viviendas: 104 VIS de 50 m² con precio pactado en pesos por debajo del tope de 150 SMMLV del año de escrituración (estimado en COP 254 millones), 168 No VIS de 58 m² y 144 No VIS de 68 m² a COP 6,5 a 6,6 millones/m² promedio, y 203 parqueaderos a COP 38 millones; velocidad de ventas de 23 viviendas al mes en el lanzamiento de la etapa 1 (con las 104 VIS) y de 14 al mes en la etapa 2 (18 en promedio en las dos ventanas de preventas) y 5 % de desistimientos; costo directo de torre de COP 2,20 millones/m² construido (Construdata con prima del Valle de Aburrá); crédito constructor a IBR 3M + 4,5 puntos (13,6 % N.T.V.); impuesto de renta del 35 %.',
    },
  };

  /* ------------------------------------------------------------ 4.1 Plan de gestión de los beneficios */
  const planBeneficios = {
    status: 'aprobado', rev: '0', date: '2025-01-10',
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: {
      objetivoEstrategico: 'Mantener un proyecto en preventas y uno en construcción cada año con margen antes de impuestos de al menos 12 % (plan estratégico 2025-2028 del promotor).',
      alineacionEstrategica: 'El proyecto llena el vacío de preventas de 2025 y 2026 y aporta 416 viviendas al portafolio 2025-2029. Consolida la línea VIS del promotor (25 % de las unidades), abre una nueva capacidad: desarrollar suelo de expansión con plan parcial, reparto de cargas y compensación VIP, y deja una marca comercial («Atalaya del Occidente») en el borde occidental, donde hay más suelo de Desarrollo disponible.',
      beneficios: rows('pb-be', [
        { beneficio: 'Utilidad del proyecto para el promotor.', tipo: 'Tangible', metrica: 'Utilidad antes de impuestos / ventas', lineaBase: 'Sin proyecto: COP 0', meta: '≥ 12 % de las ventas (COP 20.183 millones en la prefactibilidad)', plazo: 'Largo plazo (más de 1 año)', responsable: R.jun },
        { beneficio: 'Rentabilidad del capital aportado.', tipo: 'Tangible', metrica: 'Utilidad antes de impuestos / aporte del promotor', lineaBase: 'Aporte previsto: COP 24.000 millones', meta: '≥ 80 % en el horizonte del proyecto (≈ 14,5 % efectivo anual)', plazo: 'Largo plazo (más de 1 año)', responsable: R.est },
        { beneficio: 'Hogares con vivienda VIS propia.', tipo: 'Tangible', metrica: 'Viviendas VIS entregadas y escrituradas', lineaBase: '0', meta: '104 viviendas VIS; al menos 50 % con subsidio de caja o crédito VIS', plazo: 'Largo plazo (más de 1 año)', responsable: R.com },
        { beneficio: 'Satisfacción de los compradores y reputación de la marca.', tipo: 'Intangible', metrica: 'Calificación de la encuesta de entrega (escala 1 a 5) y compradores que recomiendan el proyecto', lineaBase: 'Promedio de los dos últimos proyectos del promotor: 4,1', meta: '≥ 4,3 / 5 y ≥ 60 % de recomendación', plazo: 'Mediano plazo (hasta 1 año)', responsable: R.com },
        { beneficio: 'Calidad de la construcción entregada.', tipo: 'Tangible', metrica: 'Solicitudes de posventa por vivienda en el primer año', lineaBase: 'Promedio histórico del promotor: 2,3', meta: '≤ 1,5 por vivienda; 100 % atendidas en los plazos del procedimiento de posventas (Ley 1480 de 2011)', plazo: 'Mediano plazo (hasta 1 año)', responsable: R.ger },
        { beneficio: 'Ciudad: espacio público, vías y equipamiento para el sector.', tipo: 'Intangible', metrica: 'Cesiones y obras de urbanismo recibidas por el Distrito', lineaBase: 'Lote sin urbanizar', meta: '9.000 m² de cesión, vía colectora, redes y 416 m² de equipamiento recibidos', plazo: 'Largo plazo (más de 1 año)', responsable: R.ger },
        { beneficio: 'Capacidad para desarrollar suelo de expansión.', tipo: 'Intangible', metrica: 'Procedimiento documentado de unidad de actuación, cargas y compensación VIP', lineaBase: 'No existe en el promotor', meta: 'Procedimiento y lecciones aprendidas aplicados en el siguiente lote', plazo: 'Mediano plazo (hasta 1 año)', responsable: R.ger },
      ]),
      responsableBeneficios: 'Junta directiva del promotor (dueña de los beneficios); la gerencia general del promotor los mide después del cierre del proyecto.',
      frecuenciaMedicion: 'Trimestral',
      mecanismoMedicion: 'Modelo financiero del proyecto conciliado con la contabilidad del fideicomiso cada trimestre; informe mensual de ventas y recaudos de la fiduciaria; encuesta de satisfacción en la entrega y a los 12 meses; registro de posventas por vivienda; actas de recibo de cesiones y obras del Distrito y de EPM. La utilidad final se mide con el acta de liquidación del fideicomiso y la rentabilidad con el flujo real de aportes y restituciones al promotor.',
      transicion: 'Al entregar cada etapa, la atención de posventas pasa al área de servicio al cliente del promotor, que responde por la garantía legal (Ley 1480 de 2011) durante su vigencia; las zonas comunes se entregan a la copropiedad con la administración provisional (Ley 675 de 2001); las cesiones y las obras de urbanismo se entregan al Distrito con escrituras y actas de recibo; la utilidad se restituye al promotor al liquidar el fideicomiso. La medición de beneficios de largo plazo continúa en el comité de inversiones del promotor.',
      supuestosBeneficios: [
        'Ventas a los precios promedio de la prefactibilidad: VIS por debajo del tope de 150 SMMLV y No VIS a COP 6,5 a 6,6 millones/m².',
        'Subsidios de caja de compensación y programas de vivienda disponibles para los compradores VIS.',
        'Costos directos según Construdata con actualización por el ICOCED.',
        'Tasas del crédito constructor cercanas a IBR 3M + 4,5 puntos.',
      ],
      riesgosBeneficios: [
        'Compresión del margen por alza de tasas de interés o del salario mínimo.',
        'Retraso del certificado técnico de ocupación que posterga la escrituración y la liberación de la utilidad.',
        'Reclamaciones de posventa por defectos constructivos que afecten la reputación del promotor.',
        'Menor disponibilidad de subsidios que reduzca la demanda VIS.',
      ],
    },
  };

  /* ------------------------------------------------------------ 4.1 Acta de constitución */
  const actaConstitucion = {
    status: 'aprobado', rev: '0', date: '2025-01-13',
    titleBlock: { elaboro: R.ger, reviso: R.abo, aprobo: R.jun },
    fields: {
      nombreProyecto: P.name,
      codigoProyecto: P.code,
      cliente: P.client,
      patrocinador: P.sponsor,
      fechaInicio: P.start,
      fechaFin: P.end,
      proposito: 'Desarrollar, vender, construir y entregar el Edificio Atalaya del Occidente en un lote de 50.000 m² del borde urbano occidental de Medellín, con 416 viviendas VIS y No VIS para estrato 3, cumpliendo la norma urbanística del plan parcial y la normativa técnica, y obtener una utilidad antes de impuestos de al menos 12 % de las ventas para el promotor.',
      objetivos: rows('ac-ob', [
        { dimension: 'Alcance', objetivo: 'Entregar 416 viviendas (104 VIS y 312 No VIS), parqueaderos y zonas comunes en una edificación en propiedad horizontal, con las cargas urbanísticas del plan parcial.', criterioExito: 'Certificado técnico de ocupación de cada etapa; actas de entrega de las 416 viviendas; cesiones y obras recibidas por el Distrito.', evalua: R.jun },
        { dimension: 'Cronograma', objetivo: 'Cerrar el proyecto a más tardar el 28 de marzo de 2029, con entregas de la etapa 1 desde el segundo semestre de 2027.', criterioExito: 'Acta de cierre aprobada en la fecha; hitos de punto de equilibrio y certificado técnico de ocupación con desviación ≤ 20 días hábiles.', evalua: R.jun },
        { dimension: 'Costo', objetivo: 'Ejecutar el proyecto dentro de la línea base de costos que apruebe la junta con la factibilidad (referencia de la prefactibilidad: COP 141.939 millones con la reserva para contingencias).', criterioExito: 'Costo final ≤ línea base de costos; uso de la reserva de gestión solo con aprobación de la junta.', evalua: R.est },
        { dimension: 'Costo', objetivo: 'Obtener una utilidad antes de impuestos de al menos 12 % de las ventas.', criterioExito: 'Utilidad en la liquidación del fideicomiso ≥ 12 % de las ventas escrituradas.', evalua: R.jun },
        { dimension: 'Calidad', objetivo: 'Construir conforme con la licencia, la NSR-10 y los diseños revisados, con supervisión técnica independiente (Ley 1796 de 2016).', criterioExito: 'Ninguna no conformidad mayor abierta al expedir el certificado técnico de ocupación; ensayos de concreto conformes con la NSR-10 (C.5.6).', evalua: R.sup },
        { dimension: 'Seguridad y salud en el trabajo', objetivo: 'Cero accidentes mortales o con incapacidad permanente, con el SG-SST del constructor y la Resolución 4272 de 2021 en trabajo en alturas.', criterioExito: 'Índice de frecuencia ≤ 2 accidentes por 200.000 horas hombre; auditoría trimestral de SST ≥ 90 %.', evalua: R.ger },
        { dimension: 'Satisfacción del cliente', objetivo: 'Compradores satisfechos con la entrega y la posventa.', criterioExito: 'Encuesta de entrega ≥ 4,3 / 5; solicitudes de posventa atendidas en los plazos del procedimiento (Ley 1480 de 2011).', evalua: R.com },
      ]),
      descripcion: 'Desarrollo inmobiliario integral en un lote de 50.000 m² comprado por COP 15.000 millones en suelo de expansión del borde occidental de Medellín (tratamiento de Desarrollo, plan parcial adoptado): debida diligencia y compra del lote; gestión de la unidad de actuación urbanística, del reparto de cargas y de la compensación de la obligación VIP; estudio de mercado y factibilidad; diseños y licencia de urbanización y construcción; fiducia de administración y pagos, encargo de preventas y crédito constructor; comercialización en dos etapas; construcción por administración delegada de una plataforma de parqueaderos con cuatro bloques de 8 pisos (416 viviendas) y del urbanismo y las cargas del plan parcial; entrega, escrituración y posventa; entrega de zonas comunes a la copropiedad y de cesiones al Distrito; liquidación del fideicomiso.',
      limites: 'Inicia con la aprobación de esta acta (13 de enero de 2025) y termina con el acta de cierre, después de liquidar el encargo fiduciario, el patrimonio autónomo y el crédito constructor. Incluye las cargas urbanísticas que el reparto asigne al lote. Excluye: la formulación o modificación del plan parcial (se supone adoptado), los créditos hipotecarios y subsidios de los compradores (los otorgan bancos y cajas), la administración definitiva de la copropiedad, la operación del equipamiento público y las reformas que pidan los compradores después de la entrega.',
      entregablesClave: [
        'Lote escriturado y registrado a nombre del fideicomiso, libre de gravámenes.',
        'Factibilidad técnica, legal y financiera aprobada (decisión de inversión) y línea base del proyecto.',
        'Reparto de cargas aprobado y obligación VIP compensada.',
        'Licencia de urbanización y construcción ejecutoriada y permisos ambientales.',
        'Fideicomiso, encargo de preventas y créditos constructores contratados.',
        'Punto de equilibrio declarado por la fiduciaria en cada etapa.',
        'Edificación terminada con certificado técnico de ocupación por etapa (Ley 1796 de 2016).',
        '416 viviendas entregadas y escrituradas; zonas comunes entregadas a la copropiedad.',
        'Cesiones y obras de urbanismo recibidas por el Distrito.',
        'Fideicomiso liquidado e informe final del proyecto.',
      ],
      requisitosAltoNivel: [
        'Norma del polígono y del plan parcial (Acuerdo 48 de 2014): densidad ≤ 100 viviendas/ha e índice de construcción ≤ 0,6 sobre área bruta, 8 pisos, cesión ≥ 18 % del área bruta y 1 m² de equipamiento construido por vivienda.',
        'Al menos 20 % de las viviendas no VIP como VIS, en el mismo proyecto, y la obligación VIP cumplida según el art. 326 del Acuerdo 48 de 2014: en el Macroproyecto de Borde Urbano Rural, al menos 50 % dentro del macroproyecto y hasta 50 % trasladable fuera de él con derechos fiduciarios del ISVIMED.',
        'Diseño y construcción sismorresistente (Ley 400 de 1997 y NSR-10), con revisión independiente de los diseños estructurales y supervisión técnica independiente (Ley 1796 de 2016).',
        'Licencias según el Decreto 1077 de 2015; instalaciones según RETIE, RETILAP, RITEL y las normas de EPM; metas de ahorro de agua y energía de la Resolución 0549 de 2015 de MinVivienda.',
        'Preventas por encargo fiduciario según la Circular Básica Jurídica de la Superintendencia Financiera, con SARLAFT de la fiduciaria y SAGRILAFT del promotor.',
        'Régimen de propiedad horizontal (Ley 675 de 2001) y garantía legal a los compradores (Ley 1480 de 2011).',
      ],
      riesgoGeneral: 'Medio-alto. El proyecto depende de tres variables externas: la velocidad de ventas (y con ella los puntos de equilibrio), las tasas de interés y los costos de construcción. Además, el lote está en ladera (taludes y retiro de quebrada) y requiere trámites con la curaduría, la Secretaría de Movilidad, EPM y el Área Metropolitana del Valle de Aburrá. La estructura por etapas con encargo fiduciario limita la exposición: la obra de cada etapa solo empieza con el punto de equilibrio y el crédito aprobado. La factibilidad dimensionará la reserva para contingencias con el valor monetario esperado de las amenazas.',
      hitos: rows('ac-hi', [
        { hito: 'Acta de constitución aprobada', fecha: '2025-01-13', criterio: 'Acta firmada por la junta directiva.' },
        { hito: 'Promesa de compraventa del lote y arras del 20 % (COP 3.000 millones)', fecha: '2025-02-28', criterio: 'Promesa firmada con estudio de títulos sin observaciones y avalúo comercial.' },
        { hito: 'Factibilidad aprobada (decisión de inversión) y línea base del proyecto', fecha: '2025-04-22', criterio: 'Acta de la junta con la factibilidad y el plan para la dirección del proyecto aprobados.' },
        { hito: 'Escritura del lote (pago del 80 %) y aporte al patrimonio autónomo', fecha: '2025-04-30', criterio: 'Escritura otorgada y certificado de tradición a nombre del fideicomiso.' },
        { hito: 'Lanzamiento de la etapa 1', fecha: '2025-07-07', criterio: 'Sala de ventas abierta y encargo fiduciario de preventas firmado.' },
        { hito: 'Licencia radicada en legal y debida forma', fecha: '2025-08-04', criterio: 'Constancia de radicación de la curaduría.' },
        { hito: 'Licencia de urbanización y construcción ejecutoriada', fecha: '2025-12-01', criterio: 'Resolución en firme.' },
        { hito: 'Punto de equilibrio de la etapa 1', fecha: '2026-01-30', criterio: 'Certificación de la fiduciaria (156 de 208 viviendas y demás condiciones de giro).' },
        { hito: 'Acta de inicio de obra de la etapa 1', fecha: '2026-02-16', criterio: 'Acta firmada por el gerente de proyecto, el constructor y la supervisión técnica.' },
        { hito: 'Punto de equilibrio de la etapa 2', fecha: '2027-01-29', criterio: 'Certificación de la fiduciaria.' },
        { hito: 'Certificado técnico de ocupación de la etapa 1', fecha: '2027-06-30', criterio: 'Certificado expedido por el supervisor técnico independiente y protocolizado.' },
        { hito: 'Certificado técnico de ocupación de la etapa 2', fecha: '2028-07-14', criterio: 'Certificado expedido y protocolizado.' },
        { hito: 'Acta de cierre del proyecto', fecha: '2029-03-28', criterio: 'Fideicomiso y crédito liquidados; acta aprobada por la junta.' },
      ]),
      presupuesto: P.budget,
      recursosFinancieros: 'Presupuesto de la prefactibilidad, que se confirmará con la factibilidad y la línea base: costo total de COP 141.939 millones (lote COP 15.000 millones; compensación VIP COP 3.000 millones; costos directos COP 94.080 millones; costos indirectos COP 20.062 millones; costos financieros COP 7.004 millones; reserva para contingencias COP 2.793 millones) más una reserva de gestión de COP 1.400 millones: presupuesto del proyecto de COP 143.339 millones. Fuentes: aporte del promotor de COP 24.000 millones, cuotas iniciales en el encargo fiduciario, crédito constructor de COP 56.000 millones y saldos de precio a la escrituración. Con esta acta la junta autoriza hasta COP 420 millones para la debida diligencia, el estudio de mercado y la factibilidad, y las arras del lote (COP 3.000 millones) sujetas al estudio de títulos.',
      interesadosClave: rows('ac-in', [
        { interesado: R.jun, rol: 'Patrocinador; comité de control de cambios', interes: 'Margen ≥ 12 % y retorno del aporte de COP 24.000 millones.' },
        { interesado: R.ger, rol: 'Director del proyecto', interes: 'Cumplir alcance, plazo y costo con el equipo y los contratistas.' },
        { interesado: 'Fiduciaria (por seleccionar)', rol: 'Administra el encargo de preventas y el patrimonio autónomo', interes: 'Condiciones de giro verificables y SARLAFT al día.' },
        { interesado: 'Banco del crédito constructor (por seleccionar)', rol: 'Financiador', interes: 'Avance verificado, preventas suficientes y garantías.' },
        { interesado: 'Curaduría urbana de Medellín', rol: 'Expide la licencia de urbanización y construcción', interes: 'Solicitud completa y conforme con la norma.' },
        { interesado: 'Departamento Administrativo de Planeación (DAP)', rol: 'Unidad de actuación, reparto de cargas y cesiones', interes: 'Cumplimiento de las cargas y cesiones del plan parcial.' },
        { interesado: 'Secretaría de Movilidad', rol: 'Estudio de movilidad y plan de manejo de tránsito', interes: 'Accesos seguros y mitigación del impacto vial.' },
        { interesado: 'EPM', rol: 'Factibilidad, diseños y conexiones de servicios públicos', interes: 'Redes diseñadas y construidas según sus normas.' },
        { interesado: 'Área Metropolitana del Valle de Aburrá', rol: 'Autoridad ambiental urbana', interes: 'Permisos de aprovechamiento forestal y ocupación de cauce; manejo de RCD (Resolución 1257 de 2021).' },
        { interesado: 'ISVIMED', rol: 'Recibe la compensación de la obligación VIP', interes: 'Pago de los derechos fiduciarios.' },
        { interesado: 'Compradores', rol: 'Clientes (416 hogares)', interes: 'Entrega a tiempo, calidad y aprobación del crédito o subsidio.' },
        { interesado: 'Comunidad vecina y Junta de Acción Comunal', rol: 'Vecinos del lote', interes: 'Control de ruido, polvo y tránsito de volquetas.' },
      ]),
      requisitosAprobacion: 'La junta directiva aprueba la factibilidad y la línea base (decisión de inversión), cada nueva línea base, los cambios fuera de la autoridad del gerente, el inicio de cada etapa constructiva y el cierre. Una etapa se considera aprobada para construir cuando la fiduciaria certifica el punto de equilibrio y el banco aprueba el crédito constructor. Los entregables técnicos los acepta el gerente con la verificación de la supervisión técnica independiente; los regulatorios, con el acto administrativo en firme.',
      criteriosSalida: 'Cierre normal: viviendas entregadas y escrituradas, zonas comunes y cesiones recibidas, crédito constructor pagado, fideicomiso liquidado y acta de cierre aprobada por la junta. Cierre anticipado: si la factibilidad da un margen menor de 12 %, si el estudio de títulos tiene observaciones insalvables (la promesa incluye condición resolutoria y se pierden solo los costos de la debida diligencia) o si una etapa no alcanza el punto de equilibrio en el plazo del encargo (la fiduciaria devuelve a los compradores sus aportes con rendimientos).',
      director: P.manager,
      responsabilidadAutoridad: 'El gerente de proyecto dirige el proyecto de principio a fin y preside el comité de gerencia. Puede: seleccionar y contratar consultores y contratistas dentro del presupuesto aprobado (los contratos de más de COP 1.500 millones requieren aprobación de la junta); administrar el presupuesto de las actividades; ordenar pagos a través de la fiduciaria; aprobar cambios sin efecto en hitos ni en la utilidad de hasta COP 300 millones con cargo a la reserva para contingencias. Requiere aprobación de la junta para: nuevas líneas base, uso de la reserva de gestión, cambios de producto, de precios de lista o de licencia, e inicio de cada etapa constructiva. Informa cada mes a la junta (segundo martes).',
      limiteGasto: 300 * M,
      firmas: rows('ac-fi', [
        { rol: 'Patrocinador', nombre: 'Presidente de la junta directiva del promotor', fecha: '2025-01-13' },
        { rol: 'Representante legal del promotor', nombre: 'Gerente general del promotor', fecha: '2025-01-13' },
        { rol: 'Director del proyecto', nombre: R.ger, fecha: '2025-01-13' },
      ]),
    },
  };

  /* ------------------------------------------------------------ 4.1 Registro de supuestos (vivo; rev. 2A en revisión) */
  const SUPUESTOS = [
    { id: 'S-01', tipo: 'Supuesto', descripcion: 'El lote está en un polígono de expansión con tratamiento de Desarrollo (DE) y plan parcial adoptado, con norma equivalente al polígono Z4_DE_1 del Acuerdo 48 de 2014: 100 viviendas/ha e índice de construcción de 0,6 sobre área bruta, 8 pisos e índice de ocupación de 45 % del área neta. Se verifica con la ficha normativa del DAP y la curaduría.', categoria: 'Regulatorio', responsable: R.arq, fechaValidacion: '2025-03-14', estado: 'Validado' },
    { id: 'S-02', tipo: 'Supuesto', descripcion: 'Suelo de protección de 7.000 m² (retiro de quebrada de 15 m y pendientes mayores de 45 %) y afectación vial de 4.000 m² (vía colectora de 16 m): área neta urbanizable de 39.000 m² y área útil de 27.000 m² después de la cesión de 9.000 m² y 3.000 m² de vías locales.', categoria: 'Técnico', responsable: R.arq, fechaValidacion: '2025-03-14', estado: 'Validado' },
    { id: 'S-03', tipo: 'Supuesto', descripcion: 'Habitantes por vivienda: 2,9 (circular del DAP con la Encuesta de Calidad de Vida). La cesión por habitantes (5 m² × 2,9 × 416 = 6.032 m²) es menor que el mínimo del 18 % del área bruta, que rige (9.000 m²).', categoria: 'Regulatorio', responsable: R.arq, fechaValidacion: '2025-03-14', estado: 'Validado' },
    { id: 'S-04', tipo: 'Supuesto', descripcion: 'Velocidad de ventas de 23 viviendas al mes en el lanzamiento de la etapa 1 (con las 104 VIS) y de 14 al mes en la etapa 2 (18 en promedio en las dos ventanas de preventas) y desistimientos del 5 %. Descartado: la etapa 1 vendió 19,5 al mes frente a 23 planificadas (punto de equilibrio cuatro semanas tarde) y la etapa 2 vende 11 al mes frente a 14; nueve desistimientos en 2026, revendidos.', categoria: 'Cliente y obra', responsable: R.com, fechaValidacion: '2026-03-31', estado: 'Descartado' },
    { id: 'S-05', tipo: 'Supuesto', descripcion: 'Crédito constructor a IBR 3M + 4,5 puntos con IBR cercano a 9,1 % (13,6 % N.T.V.). Descartado: el margen se mantuvo, pero la tasa de política monetaria subió en 2026 y el crédito liquida al 16,5 % N.T.V. en septiembre de 2026.', categoria: 'Costos', responsable: R.est, fechaValidacion: '2026-02-13', estado: 'Descartado' },
    { id: 'S-06', tipo: 'Supuesto', descripcion: 'Costo directo de torre de COP 2,20 millones/m² construido (Construdata 2025 actualizado con el ICOCED y prima del Valle de Aburrá); plataforma a COP 1,65 millones/m² y zonas comunes a COP 2,40 millones/m². Validado con el presupuesto del constructor para la LB1.', categoria: 'Costos', responsable: R.con, fechaValidacion: '2026-03-13', estado: 'Validado' },
    { id: 'S-07', tipo: 'Supuesto', descripcion: 'Precio VIS pactado en pesos (COP 254 millones) por debajo del tope de 150 SMMLV (Ley 2294 de 2023, art. 293): COP 262.635.750 con el SMMLV de 2026 (Decreto 1469 de 2025).', categoria: 'Regulatorio', responsable: R.est, fechaValidacion: '2026-01-02', estado: 'Validado' },
    { id: 'S-08', tipo: 'Restricción', descripcion: 'Punto de equilibrio de cada etapa: 75 % de las viviendas vinculadas al encargo (156 de 208), licencia ejecutoriada, lote en el patrimonio autónomo libre de gravámenes, crédito constructor aprobado y presupuesto validado por la fiduciaria, antes de girar recursos.', categoria: 'Contractual', responsable: R.fid, fechaValidacion: '2025-06-13', estado: 'Validado' },
    { id: 'S-09', tipo: 'Restricción', descripcion: 'Altura máxima de 8 pisos e índice de construcción de 0,6 sobre área bruta (30.000 m²); el proyecto usa 27.415 m² (0,548).', categoria: 'Regulatorio', responsable: R.arq, fechaValidacion: '2025-12-15', estado: 'Validado' },
    { id: 'S-10', tipo: 'Restricción', descripcion: 'Lote de COP 15.000 millones pagado con aporte del promotor: 20 % con la promesa (arras) y 80 % con la escritura, sin crédito.', categoria: 'Costos', responsable: R.jun, fechaValidacion: '2025-04-30', estado: 'Validado' },
    { id: 'S-11', tipo: 'Supuesto', descripcion: 'La excavación de la etapa 2 se programa fuera de la temporada de lluvias (se evitan abril-mayo y octubre-noviembre), con drenajes provisionales antes de abrir los cortes.', categoria: 'Clima y entorno', responsable: R.con, fechaValidacion: '2027-02-15', estado: 'Por validar' },
    { id: 'S-12', tipo: 'Supuesto', descripcion: 'El factor municipal de las expensas de curaduría, la tarifa de ICA (Acuerdo 093 de 2023) y la resolución vigente del RETIE se confirman en cada trámite; el presupuesto usa la tarifa de ICA de 5 por mil y la delineación urbana de 0,3 %.', categoria: 'Regulatorio', responsable: R.est, fechaValidacion: '2026-12-15', estado: 'Por validar' },
    { id: 'S-13', tipo: 'Restricción', descripcion: 'Los desembolsos del crédito constructor se hacen solo contra avance de obra verificado por la interventoría del banco y la fiduciaria; el aporte del promotor y los recaudos liberados se usan primero.', categoria: 'Contractual', responsable: R.est, fechaValidacion: '2026-02-13', estado: 'Validado' },
    { id: 'S-14', tipo: 'Restricción', descripcion: 'Ninguna vivienda se ocupa ni se escritura sin el certificado técnico de ocupación de su etapa, expedido por el supervisor técnico independiente y protocolizado (Ley 1796 de 2016).', categoria: 'Regulatorio', responsable: R.ger, fechaValidacion: '2025-04-22', estado: 'Validado' },
    { id: 'S-15', tipo: 'Supuesto', descripcion: 'Lista de precios No VIS con incrementos de 0,6 % mensual (≈ 7,4 % anual). Por validar: el índice de precios de vivienda nueva del municipio de Medellín en estratos bajos (1 a 3) baja 1,92 % anual (DANE, IPVN del II trimestre de 2026) y la etapa 2 vende 11 al mes; la lista de la etapa 2 sube 3 % desde el 1 de octubre de 2026 (CC-004) y se valida con la absorción de octubre y noviembre. El pronóstico de ventas no incluye esa alza.', categoria: 'Cliente y obra', responsable: R.com, fechaValidacion: '2026-11-30', estado: 'Por validar' },
    { id: 'S-16', tipo: 'Supuesto', descripcion: 'Rendimiento de la estructura industrializada de 8,5 días hábiles por piso y bloque con un juego de formaleta y cuadrillas estables. Descartado: rotación de oficiales tras el alza del salario mínimo de 2026 (INC-006); el bloque A avanza a 11 días por piso.', categoria: 'Recursos', responsable: R.con, fechaValidacion: '2026-09-30', estado: 'Descartado' },
  ];
  const supRev0 = SUPUESTOS.filter((r) => ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-07', 'S-08', 'S-09', 'S-10', 'S-14'].includes(r.id)).map((r) => ({
    ...r,
    estado: 'Por validar',
    descripcion: ({
      'S-04': 'Velocidad de ventas de 23 viviendas al mes en el lanzamiento de la etapa 1 (con las 104 VIS) y de 14 al mes en la etapa 2 (18 en promedio en las dos ventanas de preventas) y desistimientos del 5 %.',
      'S-05': 'Crédito constructor a IBR 3M + 4,5 puntos con IBR cercano a 9,1 % (13,6 % N.T.V.).',
      'S-06': 'Costo directo de torre de COP 2,20 millones/m² construido (Construdata 2025 actualizado con el ICOCED y prima del Valle de Aburrá); plataforma a COP 1,65 millones/m² y zonas comunes a COP 2,40 millones/m².',
      'S-07': 'Precio VIS pactado en pesos por debajo del tope de 150 SMMLV del año de escrituración (Ley 2294 de 2023, art. 293).',
      'S-09': 'Altura máxima de 8 pisos e índice de construcción de 0,6 sobre área bruta (30.000 m²).',
    })[r.id] || r.descripcion,
  }));
  const supRev1 = SUPUESTOS.filter((r) => !['S-15', 'S-16'].includes(r.id)).map((r) => ({
    ...r,
    ...({
      'S-04': { estado: 'Por validar', descripcion: 'Velocidad de ventas de 23 viviendas al mes en el lanzamiento de la etapa 1 (con las 104 VIS) y de 14 al mes en la etapa 2 (18 en promedio en las dos ventanas de preventas) y desistimientos del 5 %. La etapa 1 vendió 19,5 al mes frente a 23 planificadas (punto de equilibrio cuatro semanas tarde); se valida con las ventas de la etapa 2 al 31 de marzo de 2026.' },
      'S-05': { descripcion: 'Crédito constructor a IBR 3M + 4,5 puntos con IBR cercano a 9,1 % (13,6 % N.T.V.). Descartado: el banco aprobó el margen, pero el IBR subió con la tasa de política monetaria de 2026.' },
    })[r.id],
  }));
  const registroSupuestos = {
    status: 'revision', rev: '2A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.arq, aprobo: R.jun },
    fields: {
      supuestos: SUPUESTOS,
      criterioValidacion: 'Cada supuesto y restricción tiene un responsable y una fecha de validación ligada a un hito: la ficha normativa y el reparto de cargas validan la norma; la licencia ejecutoriada valida las áreas; la aprobación del crédito valida la tasa; las ventas mensuales validan la velocidad. Un supuesto descartado se convierte en riesgo o incidente y se analiza su efecto en las líneas base en el comité de gerencia; si exige cambiar una línea base, se tramita una solicitud de cambio. El registro se emite con cada línea base (rev. 0 con el acta de constitución, rev. 1 con la LB1) y se actualiza cada mes.',
      frecuenciaRevision: 'Mensual',
    },
    revs: [
      { rev: '0', status: 'aprobado', date: '2025-01-13', note: 'Emisión inicial con el acta de constitución.', fields: { supuestos: supRev0, criterioValidacion: 'Cada supuesto y restricción tiene un responsable y una fecha de validación ligada a un hito: la ficha normativa y el reparto de cargas validan la norma; la licencia ejecutoriada valida las áreas; la aprobación del crédito valida la tasa; las ventas mensuales validan la velocidad. Un supuesto descartado se convierte en riesgo o incidente y se analiza en el comité de gerencia.', frecuenciaRevision: 'Mensual' } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizado con la LB1 (CC-002): supuestos de norma, áreas, precio VIS y costos validados; tasa del crédito descartada; nuevos supuestos de excavación en temporada seca, tarifas municipales y desembolsos.', fields: { supuestos: supRev1, criterioValidacion: 'Cada supuesto y restricción tiene un responsable y una fecha de validación ligada a un hito. Un supuesto descartado se convierte en riesgo o incidente; si exige cambiar una línea base, se tramita una solicitud de cambio. El registro se emite con cada línea base y se actualiza cada mes.', frecuenciaRevision: 'Mensual' } },
    ],
  };

  /* ================================================================== PLANIFICACIÓN · INTEGRACIÓN */

  /* ------------------------------------------------------------ 4.2 Plan para la dirección del proyecto (rev. 1 con la LB1) */
  const FASES_LB1 = [
    { fase: 'Estructuración técnica, legal y financiera (1.2)', entregables: 'Lote escriturado y registrado en el patrimonio autónomo; estudio de mercado; factibilidad; reparto de cargas y obligación VIP compensada; fiducia mercantil y encargo de preventas.', criterioSalida: 'Decisión de inversión de la junta (factibilidad con margen ≥ 12 %); certificado de tradición libre de gravámenes a nombre del fideicomiso; certificados del ISVIMED por 78 VIP equivalentes (39 dentro del Macroproyecto de Borde y 39 trasladadas fuera de él).', fechaPrevista: '2025-07-18' },
    { fase: 'Diseños y licencias (1.3)', entregables: 'Proyecto arquitectónico, estudio geotécnico, diseño estructural con revisión independiente, diseños técnicos y bioclimático; estudio de movilidad; diseños de redes aprobados por EPM; licencia de urbanización y construcción; permisos ambientales; diseños de detalle de la etapa 1.', criterioSalida: 'Licencia en firme, permisos ambientales expedidos y diseños de detalle de la etapa 1 aprobados por el director de obra y la supervisión técnica antes del acta de inicio.', fechaPrevista: '2026-03-13' },
    { fase: 'Preventas y punto de equilibrio de la etapa 1 (1.4.3)', entregables: 'Sala de ventas y apartamento modelo; lanzamiento; 156 viviendas vinculadas al encargo; punto de equilibrio; giro de los recursos al patrimonio autónomo.', criterioSalida: 'Certificación de la fiduciaria del cumplimiento de las condiciones de giro (75 % de la etapa, licencia ejecutoriada, lote libre de gravámenes y crédito aprobado).', fechaPrevista: '2026-03-06' },
    { fase: 'Construcción de la etapa 1 (1.5.1) y urbanismo de la fase 1', entregables: 'Bloques A y B (208 viviendas), 50 % de la plataforma de parqueaderos, vía colectora, mitigación vial, redes de EPM de la fase 1, retiro de la quebrada y parque de cesión de la etapa 1.', criterioSalida: 'Certificado técnico de ocupación de la etapa 1 protocolizado; redes recibidas por EPM; certificaciones RETIE y RITEL; mitigación vial recibida por la Secretaría de Movilidad.', fechaPrevista: '2027-07-28' },
    { fase: 'Preventas y punto de equilibrio de la etapa 2 (1.4.4)', entregables: '156 viviendas de la etapa 2 vinculadas; crédito constructor de COP 26.000 millones aprobado; giro al patrimonio autónomo.', criterioSalida: 'Certificación de la fiduciaria y carta de aprobación del banco.', fechaPrevista: '2027-02-05' },
    { fase: 'Construcción de la etapa 2 (1.5.2) y urbanismo de la fase 2', entregables: 'Bloques C y D (208 viviendas), 50 % restante de la plataforma, vías locales, redes de la fase 2, parque de cesión y equipamiento público de 416 m².', criterioSalida: 'Certificado técnico de ocupación de la etapa 2 protocolizado y obras de urbanismo listas para entregar al Distrito.', fechaPrevista: '2028-07-14' },
    { fase: 'Entrega, escrituración y cierre (1.6)', entregables: 'Entregas y escrituras de las 416 viviendas con subrogación; reglamento de propiedad horizontal; entrega de zonas comunes y de cesiones; liquidación del encargo, del patrimonio autónomo y del crédito; informe final.', criterioSalida: 'Actas de entrega firmadas, fideicomiso liquidado y acta de cierre aprobada por la junta directiva.', fechaPrevista: P.end },
  ];
  const FASES_LB0 = patchRows(rows('pd-fa', FASES_LB1), {
    'pd-fa-01': { fechaPrevista: '2025-06-27' },
    'pd-fa-02': { fechaPrevista: '2026-02-13' },
    'pd-fa-03': { fechaPrevista: '2026-02-06' },
    'pd-fa-04': { fechaPrevista: '2027-06-30', entregables: 'Bloques A y B (208 viviendas), 50 % de la plataforma de parqueaderos, vía colectora, redes de EPM de la fase 1, retiro de la quebrada y parque de cesión de la etapa 1.', criterioSalida: 'Certificado técnico de ocupación de la etapa 1 protocolizado; redes recibidas por EPM; certificaciones RETIE y RITEL.' },
  });
  const PLANES_SUB = [
    { plan: 'Plan de gestión del alcance', estado: 'Aprobado', referencia: 'PRY-2025-003-PALC', responsable: R.ger, resumen: 'EDT orientada a entregables de 50 elementos y 4 niveles; línea base del alcance = enunciado aprobado + EDT + diccionario; aceptación por acta o acto administrativo en firme. Actualizado con la LB1 (obligaciones de la licencia como fuente de alcance).' },
    { plan: 'Plan de gestión de los requisitos', estado: 'Aprobado', referencia: 'PRY-2025-003-PREQ', responsable: R.arq, resumen: 'Requisitos de norma, mercado, fiduciaria y banco con código RQ-##, prioridad y trazabilidad hasta la verificación (licencia, ensayos, certificados).' },
    { plan: 'Plan de gestión del cronograma', estado: 'Aprobado', referencia: 'PRY-2025-003-PCRO', responsable: R.ger, resumen: 'CPM en días hábiles de lunes a sábado con festivos de Colombia; cronograma maestro en el Gestor y programa detallado del constructor integrado; cortes mensuales. Actualizado con la LB1.' },
    { plan: 'Plan de gestión de los costos', estado: 'Aprobado', referencia: 'PRY-2025-003-PGCO', responsable: R.est, resumen: 'BAC = costo total sin utilidad ni reservas; reserva para contingencias dentro de la línea base de costos y reserva de gestión fuera; valor ganado mensual por grupos de costo. Actualizado con la LB1.' },
    { plan: 'Plan de gestión de la calidad', estado: 'Aprobado', referencia: 'PRY-2025-003-PGCA', responsable: R.ger, resumen: 'Plan de calidad del constructor, liberación por piso de la supervisión técnica independiente, ensayos de concreto, acero, integridad de pilas y pruebas de redes; métricas de resistencia, plomo, recubrimiento y pendientes por vivienda.' },
    { plan: 'Plan de gestión de los recursos', estado: 'Aprobado', referencia: 'PRY-2025-003-PGR', responsable: R.ger, resumen: 'Equipo del promotor y consultores; cuadrillas, formaleta y grúas a cargo del constructor con límites por recurso en el cronograma.' },
    { plan: 'Plan de gestión de las comunicaciones', estado: 'Aprobado', referencia: 'PRY-2025-003-PGCM', responsable: R.ger, resumen: 'Informe mensual a la junta, comité de gerencia, comité de obra semanal, comité fiduciario mensual, boletín bimestral a compradores y mesa vecinal mensual.' },
    { plan: 'Plan de gestión de los riesgos', estado: 'Aprobado', referencia: 'PRY-2025-003-PGRI', responsable: R.ger, resumen: 'Matriz 5 × 5 con impacto en costo; reserva para contingencias = valor monetario esperado de las amenazas; revisión mensual. Actualizado con la LB1.' },
    { plan: 'Plan de gestión de las adquisiciones', estado: 'Aprobado', referencia: 'PRY-2025-003-PGAD', responsable: R.ger, resumen: 'Consultorías a precio fijo, fiducia y comercialización por comisión, construcción por administración delegada con subcontratos por precios unitarios.' },
    { plan: 'Plan de involucramiento de los interesados', estado: 'Aprobado', referencia: 'PRY-2025-003-PIIN', responsable: R.ger, resumen: 'Estrategias por interesado: autoridades (radicación temprana y seguimiento semanal), financiadores (información verificable), compradores y comunidad vecina.' },
    { plan: 'Plan de gestión de cambios', estado: 'Aprobado', referencia: 'PRY-2025-003-PCAM', responsable: R.ger, resumen: 'La junta directiva actúa como comité de control de cambios; el gerente decide hasta COP 300 millones con cargo a la contingencia; no objeción de fiduciaria y banco para cambios del presupuesto validado.' },
    { plan: 'Plan de gestión de la configuración', estado: 'Aprobado', referencia: 'PRY-2025-003-PCFG', responsable: R.ger, resumen: 'Códigos y revisiones de documentos, planos y líneas base; repositorio único; verificación mensual de la configuración.' },
  ];
  const LINEAS_BASE_LB0 = [
    { lineaBase: 'Alcance', contenido: 'Enunciado del alcance rev. 0, EDT de 50 elementos y diccionario de la EDT.', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Aprobada por la junta directiva con la factibilidad (decisión de inversión).' },
    { lineaBase: 'Cronograma', contenido: 'Cronograma maestro de 149 actividades e hitos: inicio el 13 de enero de 2025 y cierre el 28 de marzo de 2029 (el 30 de marzo de 2029 es Viernes Santo).', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Acta de inicio de obra de la etapa 1 el 16 de febrero de 2026.' },
    { lineaBase: 'Costos', contenido: 'BAC de COP 139.146 millones (lote, compensación VIP, directos, indirectos y financieros) + reserva para contingencias de COP 2.793 millones = COP 141.939 millones, distribuidos en el tiempo.', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Reserva de gestión de COP 1.400 millones fuera de la línea base; presupuesto del proyecto de COP 143.339 millones.' },
    { lineaBase: 'Medición del desempeño', contenido: 'Integración de alcance, cronograma y costos de la LB0 para el valor ganado con cortes mensuales.', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Valor ganado sobre todo el BAC y por grupos de costo.' },
  ];
  const LINEAS_BASE_LB1 = [
    ...LINEAS_BASE_LB0.map((r) => ({ ...r, observaciones: 'Reemplazada por la LB1 el 13 de marzo de 2026 (CC-002).' })),
    { lineaBase: 'Alcance', contenido: 'Enunciado del alcance rev. 1 (incluye la mitigación vial exigida en la licencia), EDT de 50 elementos y diccionario.', version: 'LB1', fechaAprobacion: LB1, observaciones: 'Vigente. CC-002 aprobado por la junta el 10 de marzo de 2026.' },
    { lineaBase: 'Cronograma', contenido: 'Cronograma maestro de 150 actividades e hitos (nueva actividad U02, mitigación vial); acta de inicio de obra de la etapa 1 el 16 de marzo de 2026 (+4 semanas); cierre el 28 de marzo de 2029 sin cambio.', version: 'LB1', fechaAprobacion: LB1, observaciones: 'Vigente. La etapa 1 se corre cuatro semanas; la etapa 2 y el fin del proyecto no cambian.' },
    { lineaBase: 'Costos', contenido: 'BAC de COP 139.576 millones (+COP 430 millones de mitigación vial) + reserva para contingencias de COP 2.363 millones = COP 141.939 millones.', version: 'LB1', fechaAprobacion: LB1, observaciones: 'Vigente. La línea base de costos y el presupuesto del proyecto (COP 143.339 millones) no cambian.' },
    { lineaBase: 'Medición del desempeño', contenido: 'Integración de alcance, cronograma y costos de la LB1 para el valor ganado con cortes mensuales.', version: 'LB1', fechaAprobacion: LB1, observaciones: 'Vigente desde el corte de marzo de 2026.' },
  ];
  const REVISIONES_PD = [
    { revision: 'Reunión de arranque', momento: 'Del 13 al 24 de enero de 2025, con el registro de interesados', participantes: 'Junta directiva, gerente de proyecto, estructurador financiero, gerente comercial, abogado del proyecto y arquitecto diseñador.', proposito: 'Presentar el acta de constitución, los objetivos, los hitos, los roles y las reglas de trabajo; acordar el plan de la estructuración.' },
    { revision: 'Junta directiva (patrocinador y comité de control de cambios)', momento: 'Mensual, segundo martes', participantes: 'Junta directiva, gerente de proyecto y estructurador financiero; invitados según el orden del día.', proposito: 'Aprobar el informe de desempeño; decidir cambios de nivel 2 y 3, nuevas líneas base y el paso de fase.' },
    { revision: 'Comité de gerencia', momento: 'Mensual, primer martes', participantes: 'Gerente de proyecto, estructurador financiero, gerente comercial, arquitecto diseñador y director de obra (desde la contratación del constructor).', proposito: 'Revisar avance, valor ganado, ventas, flujo de caja, riesgos, incidentes y cambios; preparar el informe para la junta.' },
    { revision: 'Comité de obra', momento: 'Semanal, lunes (desde el acta de inicio de obra)', participantes: 'Director de obra, residentes, coordinador SST, inspector de calidad, supervisión técnica independiente y gerente de proyecto.', proposito: 'Programa de la semana, calidad y liberaciones, SST, subcontratistas, compras y restricciones.' },
    { revision: 'Comité fiduciario', momento: 'Mensual, día 10', participantes: 'Fiduciaria, banco, interventoría del banco y la fiduciaria, estructurador financiero y gerente de proyecto.', proposito: 'Acta de avance de obra, certificaciones de giro y desembolsos, flujo de caja y conciliación del fideicomiso.' },
    { revision: 'Revisiones de fase (puntos de decisión)', momento: 'Decisión de inversión, punto de equilibrio y acta de inicio de cada etapa, certificado técnico de ocupación de cada etapa', participantes: 'Junta directiva y gerente de proyecto, con los responsables de la fase.', proposito: 'Verificar los criterios de salida y autorizar la fase siguiente.' },
    { revision: 'Revisión de cierre', momento: 'Al liquidar el fideicomiso y el crédito constructor', participantes: 'Junta directiva, gerente de proyecto, estructurador financiero y fiduciaria.', proposito: 'Confirmar la aceptación final, el resultado económico, el informe final y las lecciones aprendidas.' },
  ];
  const planDireccionFields = {
    cicloVida: 'Predictivo',
    enfoqueDesarrollo: 'Predictivo por etapas con puntos de decisión. El alcance del producto queda definido por la licencia de urbanización y construcción, por lo que se planifica todo el proyecto desde la factibilidad; la ejecución se divide en fases con criterios de salida (estructuración, diseños y licencias, preventas por etapa, construcción por etapa, entrega y cierre). La obra de cada etapa solo comienza cuando la fiduciaria declara su punto de equilibrio y el banco aprueba el crédito. La etapa 2 se detalla con planificación gradual: su programa de obra se afina con el del constructor antes de su punto de equilibrio.',
    fases: rows('pd-fa', FASES_LB1),
    adaptacion: 'Se adapta la Guía del PMBOK® 6.ª edición a un desarrollo inmobiliario con fiducia: (1) la junta directiva del promotor es patrocinador y comité de control de cambios; (2) el BAC es el costo total del proyecto sin utilidad ni reservas (lote, compensación VIP, directos, indirectos y financieros), y la línea base de costos incluye la reserva para contingencias; (3) el valor ganado se mide sobre todo el BAC y por grupos de costo, porque el lote y la compensación VIP diluyen los índices globales; (4) el cronograma maestro integra en el nivel de paquete el programa detallado del constructor; (5) las adquisiciones de obra se delegan al constructor por administración delegada, con aprobación del gerente para subcontratos de más de COP 500 millones; (6) la calidad del producto se apoya en el plan de calidad del constructor, la supervisión técnica independiente y la interventoría del banco y la fiduciaria.',
    procesosSimplificados: [
      'Gestión de la calidad del producto: el proyecto conserva las métricas, la verificación y la aceptación; el control de calidad en obra es del constructor y la liberación por piso, de la supervisión técnica independiente.',
      'Gestión de los recursos físicos de obra (cuadrillas, formaleta, grúas): la administra el constructor; el cronograma maestro controla los límites por recurso.',
      'Adquisiciones de obra: subcontratos y compras por administración delegada con la política de compras del constructor y la aprobación del gerente sobre COP 500 millones.',
      'Comunicaciones con compradores: a cargo de la comercializadora con formatos aprobados por el gerente comercial.',
      'Lecciones aprendidas: captura al cierre de cada fase, de cada incidente de prioridad alta y de cada cambio aprobado.',
    ],
    planesSubsidiarios: rows('pd-ps', PLANES_SUB),
    lineasBase: rows('pd-lb', LINEAS_BASE_LB1),
    presupuestoTotal: P.budget,
    umbralesVariacion: 'Cronograma: SPI y SPI(t) ≥ 0,95 en verde, 0,90 a 0,94 en amarillo y menos de 0,90 en rojo; los hitos de control (punto de equilibrio, crédito, acta de inicio, certificado técnico de ocupación y entregas) con desviación pronosticada de más de 20 días hábiles exigen plan de recuperación o solicitud de cambio. Costo: CPI ≥ 0,97 en verde, 0,93 a 0,96 en amarillo y menos de 0,93 en rojo; una EAC que supere la línea base de costos en más de 1 % del BAC (≈ COP 1.400 millones) o un margen pronosticado menor de 11 % de las ventas se escalan a la junta. Ventas: velocidad menor de 80 % del plan durante dos meses. Reserva para contingencias: consumo de más de 50 % antes de terminar la estructura de la etapa 1.',
    revisiones: rows('pd-rv', REVISIONES_PD),
    mantenimientoPlan: 'El gerente de proyecto mantiene el plan y lo actualiza solo por control integrado de cambios: un cambio aprobado que modifica una línea base genera una nueva línea base numerada (LB0, LB1…) y una nueva revisión del plan y de los planes subsidiarios afectados. Rev. 0 aprobada el 22 de abril de 2025 con la LB0; rev. 1 aprobada el 13 de marzo de 2026 con la LB1 (CC-002: mitigación vial y reprogramación de la etapa 1). Los planes subsidiarios se revisan al menos en cada punto de decisión.',
  };
  const planDireccion = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: planDireccionFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la factibilidad y la línea base LB0 (decisión de inversión).', fields: { ...cp(planDireccionFields), fases: FASES_LB0, lineasBase: rows('pd-lb', LINEAS_BASE_LB0), planesSubsidiarios: rows('pd-ps', PLANES_SUB.map((r) => ({ ...r, resumen: r.resumen.replace(/ Actualizado con la LB1[^.]*\./, '') }))), mantenimientoPlan: 'El gerente de proyecto mantiene el plan y lo actualiza solo por control integrado de cambios: un cambio aprobado que modifica una línea base genera una nueva línea base numerada (LB1, LB2…) y una nueva revisión del plan y de los planes subsidiarios afectados. Los planes subsidiarios se revisan al menos en cada punto de decisión.' } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizado con la línea base LB1 (CC-002): mitigación vial y acta de inicio de obra de la etapa 1 el 16 de marzo de 2026.' },
    ],
  };

  /* ------------------------------------------------------------ 4.2 Plan de gestión de cambios */
  const planCambios = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.ger, reviso: R.abo, aprobo: R.jun },
    fields: {
      enfoqueCambios: 'Todo cambio a las líneas base (alcance, cronograma y costos), al producto (mezcla, áreas o especificaciones), a los precios de lista o a las condiciones de venta, a las reservas o a los contratos principales pasa por el proceso 4.6 Realizar el control integrado de cambios. La junta directiva del promotor actúa como comité de control de cambios (CCB) y el gerente de proyecto decide los cambios menores dentro de su autoridad. Los cambios que modifican el presupuesto validado por la fiduciaria o el banco requieren su no objeción antes de actualizar las líneas base; los que modifican la licencia requieren trámite ante la curaduría (Decreto 1077 de 2015) y, si afectan a compradores con promesa firmada, su aceptación por escrito (Ley 1480 de 2011).',
      definicionCambio: 'Es cambio: modificar el alcance o un entregable; mover un hito de control (punto de equilibrio, crédito, acta de inicio, certificado técnico de ocupación, entregas o cierre); usar la reserva para contingencias o la de gestión; modificar la mezcla de producto, las áreas o las especificaciones; cambiar precios de lista o condiciones de venta; modificar un contrato principal (fiducia, crédito, constructor, comercialización). No es cambio: mover actividades dentro de su holgura sin afectar hitos de control; reasignar recursos entre actividades del mismo paquete sin variar su total; las compras y subcontratos dentro del presupuesto del constructor; corregir errores de digitación; ejecutar la respuesta planificada de un riesgo con costo menor de COP 300 millones (se registra e informa en el comité).',
      ccb: rows('pc-cc', [
        { rol: 'Presidente del comité', integrante: 'Presidente de la junta directiva del promotor', responsabilidad: 'Convoca y preside; decide los cambios de nivel 2 y 3 y aprueba las nuevas líneas base.' },
        { rol: 'Secretario técnico', integrante: R.ger, responsabilidad: 'Registra y analiza las solicitudes con su impacto integrado; presenta alternativas y recomendación; decide los cambios de nivel 1.' },
        { rol: 'Asesor financiero', integrante: R.est, responsabilidad: 'Impacto en flujo de caja, crédito constructor, fiducia, tributos y utilidad pronosticada.' },
        { rol: 'Asesor comercial', integrante: R.com, responsabilidad: 'Impacto en ventas, promesas firmadas, compradores y precios.' },
        { rol: 'Asesor técnico', integrante: 'Arquitecto diseñador y, desde la contratación de la obra, director de obra (constructor)', responsabilidad: 'Impacto técnico, en la licencia y en el programa de obra.' },
        { rol: 'No objeción', integrante: 'Fiduciaria e interventoría del banco y la fiduciaria', responsabilidad: 'Se pronuncian sobre cambios del presupuesto validado, de las condiciones de giro o del flujo de desembolsos.' },
        { rol: 'Concepto técnico', integrante: R.sup, responsabilidad: 'Concepto sobre cambios estructurales o de diseño durante la construcción (Ley 1796 de 2016).' },
      ]),
      frecuenciaCcb: 'Mensual',
      umbrales: rows('pc-um', [
        { nivel: 'Nivel 1', criterio: 'Sin efecto en hitos de control ni en la utilidad pronosticada; costo hasta COP 300 millones con cargo a la reserva para contingencias; no modifica el producto ni la licencia.', aprobador: R.ger, plazoDias: 3 },
        { nivel: 'Nivel 2', criterio: 'Costo de más de COP 300 millones con cargo a la reserva para contingencias; desplazamiento de un hito de control de hasta 20 días hábiles; cambio de precios de lista o de condiciones de venta.', aprobador: 'Junta directiva del promotor (CCB), en sesión ordinaria o extraordinaria', plazoDias: 10 },
        { nivel: 'Nivel 3', criterio: 'Nueva línea base; uso de la reserva de gestión; cambio de alcance, de mezcla de producto, de licencia o de la fecha de fin; cambio del presupuesto validado por la fiduciaria o el banco.', aprobador: 'Junta directiva del promotor (CCB) con no objeción de la fiduciaria y el banco', plazoDias: 15 },
        { nivel: 'Emergencia', criterio: 'Condición insegura o riesgo inminente para personas, vecinos o la estabilidad de la obra (taludes, excavaciones, estructuras provisionales).', aprobador: 'Director de obra (constructor) o gerente de proyecto; la junta lo ratifica en 5 días hábiles', plazoDias: 1 },
      ]),
      pasos: rows('pc-pa', [
        { paso: '1. Registrar', actividad: 'Diligenciar la solicitud de cambio (PRY-2025-003-SCAM) con descripción, justificación y soportes; asignar el código CC-### en el registro de cambios.', responsable: 'Solicitante y gerente de proyecto', plazo: '2 días hábiles' },
        { paso: '2. Analizar el impacto integrado', actividad: 'Evaluar alcance, cronograma (CPM con el cronograma maestro), costos, flujo de caja y utilidad, calidad, riesgos, licencia, compradores y contratos; proponer alternativas, incluida la de no hacer el cambio.', responsable: 'Gerente de proyecto con el estructurador financiero, el gerente comercial y el asesor técnico', plazo: '5 días hábiles' },
        { paso: '3. Obtener no objeciones', actividad: 'Pedir la no objeción de la fiduciaria, el banco o la interventoría cuando cambia el presupuesto validado o las condiciones de giro, y el concepto de la supervisión técnica si el cambio es estructural.', responsable: R.est, plazo: '5 días hábiles' },
        { paso: '4. Decidir', actividad: 'Aprobar, rechazar o diferir según el nivel de autoridad; registrar la decisión y sus condiciones en el acta y en el registro de cambios.', responsable: 'Aprobador según el nivel', plazo: 'Según el nivel' },
        { paso: '5. Actualizar', actividad: 'Actualizar la línea base (nueva LB numerada si aplica), el cronograma, el presupuesto, las reservas y los documentos afectados; emitir sus nuevas revisiones.', responsable: R.ger, plazo: '3 días hábiles' },
        { paso: '6. Comunicar', actividad: 'Informar al solicitante, al constructor, a la fiduciaria, al banco y, si aplica, a los compradores afectados.', responsable: R.ger, plazo: '2 días hábiles' },
        { paso: '7. Verificar', actividad: 'Comprobar en el comité de obra o de gerencia que el cambio se implementó como se aprobó y cerrar la solicitud.', responsable: 'Gerente de proyecto e interventoría del banco y la fiduciaria', plazo: 'Al implementar' },
      ]),
      cambiosEmergencia: 'Ante una condición insegura (inestabilidad de un talud, falla de una excavación o de una estructura provisional) el director de obra o el gerente ordenan de inmediato las medidas para proteger a las personas y la obra, con el concepto del geotecnista o del ingeniero estructural cuando aplique. En las 48 horas siguientes se registra la solicitud de cambio con el costo y el efecto en el cronograma, y la junta la ratifica en un máximo de 5 días hábiles; el costo se carga a la reserva para contingencias. La emergencia no autoriza trabajo distinto del necesario para controlar la condición.',
      herramientasCambios: 'Formato de solicitud de cambio (PRY-2025-003-SCAM), registro de cambios (PRY-2025-003-RCAM), cronograma maestro, curva S y valor ganado del Gestor para el análisis de impacto, modelo financiero del proyecto para la utilidad y el flujo de caja, y líneas base numeradas (LB0, LB1…) que citan el cambio que las origina.',
      comunicacionCambios: 'La decisión se comunica por escrito al solicitante en los 2 días hábiles siguientes; se informa en el siguiente comité de gerencia y en el informe mensual de desempeño. Los cambios que afectan el presupuesto validado se envían a la fiduciaria y al banco con el acta de la junta. Los que afectan a compradores (fechas de entrega, especificaciones o condiciones de venta) se comunican por la comercializadora con un otrosí a la promesa cuando aplique.',
    },
  };

  /* ------------------------------------------------------------ 4.2 Plan de gestión de la configuración */
  const planConfiguracion = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.ger, reviso: R.arq, aprobo: R.jun },
    fields: {
      objetivoConfiguracion: 'Asegurar que todos usen la versión vigente de los documentos de gestión, las líneas base, los planos y los contratos; que cada cambio quede trazado hasta la solicitud que lo originó, y que la edificación construida corresponda a los planos aprobados en la licencia y a sus modificaciones. En un proyecto con licencia, supervisión técnica independiente y entregas a 416 compradores, la configuración es la base del certificado técnico de ocupación, del reglamento de propiedad horizontal y de la atención de posventas.',
      responsableConfiguracion: 'Gerente de proyecto; el arquitecto diseñador coordina la configuración de planos y diseños, y el director de obra la de planos récord.',
      repositorio: 'Gestor de Proyectos PMBOK (documentos y líneas base) y repositorio documental del promotor «PRY-2025-003» (planos en PDF y DWG, contratos y actas)',
      elementos: rows('pf-el', [
        { elemento: 'Acta de constitución del proyecto', tipo: 'Documento de gestión', codigo: 'PRY-2025-003-ACT', responsable: R.ger, control: 'Control de cambios formal' },
        { elemento: 'Plan para la dirección del proyecto y planes subsidiarios', tipo: 'Documento de gestión', codigo: 'PRY-2025-003-PDP (y PALC, PCRO, PGCO, PGRI…)', responsable: R.ger, control: 'Control de cambios formal' },
        { elemento: 'Línea base del alcance (enunciado, EDT y diccionario)', tipo: 'Línea base', codigo: 'LB0 · PRY-2025-003-EALC', responsable: R.ger, control: 'Control de cambios formal' },
        { elemento: 'Cronograma maestro y línea base del cronograma', tipo: 'Línea base', codigo: 'LB0 · cronograma del Gestor', responsable: R.ger, control: 'Control de cambios formal' },
        { elemento: 'Presupuesto, reservas y línea base de costos', tipo: 'Línea base', codigo: 'LB0 · PRY-2025-003-ECO', responsable: R.est, control: 'Control de cambios formal' },
        { elemento: 'Modelo financiero y flujo de caja de la factibilidad', tipo: 'Documento de gestión', codigo: 'ATA-FIN-MOD', responsable: R.est, control: 'Control de cambios formal' },
        { elemento: 'Cuadro de áreas y mezcla de producto', tipo: 'Plano o diseño', codigo: 'ATA-ARQ-CA', responsable: R.arq, control: 'Control de cambios formal' },
        { elemento: 'Planos arquitectónicos de licencia y de construcción', tipo: 'Plano o diseño', codigo: 'ATA-ARQ-<etapa>-###', responsable: R.arq, control: 'Control de cambios formal' },
        { elemento: 'Estudio geotécnico, memorias y planos estructurales', tipo: 'Plano o diseño', codigo: 'ATA-GEO-### · ATA-EST-<etapa>-###', responsable: R.ies, control: 'Control de cambios formal' },
        { elemento: 'Diseños técnicos (hidrosanitario, gas, red contra incendio, eléctrico, iluminación y telecomunicaciones)', tipo: 'Plano o diseño', codigo: 'ATA-HID/GAS/RCI/ELE/RIT-<etapa>-###', responsable: R.arq, control: 'Control de cambios formal' },
        { elemento: 'Diseños de urbanismo, vías y redes externas', tipo: 'Plano o diseño', codigo: 'ATA-URB-###', responsable: R.arq, control: 'Control de cambios formal' },
        { elemento: 'Lista de precios y condiciones de venta', tipo: 'Documento de gestión', codigo: 'ATA-COM-LP-<etapa>', responsable: R.com, control: 'Control de cambios formal' },
        { elemento: 'Contratos principales (fiducia, encargo, crédito, constructor, consultores) y otrosíes', tipo: 'Documento de gestión', codigo: 'CT-###', responsable: R.abo, control: 'Control de versiones' },
        { elemento: 'Procedimientos de obra (liberación por piso, entregas, posventas)', tipo: 'Procedimiento', codigo: 'ATA-PRO-##', responsable: R.con, control: 'Control de versiones' },
        { elemento: 'Actas de comité, informes de desempeño y registros', tipo: 'Registro', codigo: 'PRY-2025-003-<abreviatura>', responsable: R.ger, control: 'Solo registro' },
        { elemento: 'Actas de entrega de viviendas y zonas comunes', tipo: 'Registro', codigo: 'ATA-ENT-<bloque>-<apartamento>', responsable: R.con, control: 'Solo registro' },
      ]),
      convencionCodigos: 'Documentos de gestión: PRY-2025-003-<abreviatura de la plantilla> (por ejemplo PRY-2025-003-PDP); los documentos múltiples agregan un consecutivo (-01, -02…). Planos y diseños: ATA-<disciplina>-<etapa>-<número> con disciplinas ARQ, GEO, EST, HID, GAS, RCI, ELE, RIT, URB y BIO, y etapa E1, E2 o G (general). Contratos: CT-### en orden de firma. Líneas base: LB0, LB1… con referencia al cambio que las origina.',
      convencionRevisiones: 'Borradores A, B, C…; emisión aprobada 0; las emisiones siguientes 1, 2… Tras una emisión, los borradores toman el número de la siguiente emisión y una letra (1A, 1B…). Los planos para licencia se emiten con «L» y los de construcción con «C» antes de la revisión (por ejemplo ATA-EST-E1-012 rev. C1). Cada emisión indica qué cambió y la solicitud de cambio que la originó.',
      aprobacionVersiones: 'Elabora el responsable del elemento, revisa el gerente de proyecto o el coordinador de diseños (planos) y aprueba la junta directiva (acta, plan, líneas base) o el gerente (demás documentos). Los planos estructurales de construcción requieren la constancia de la revisión independiente (Ley 1796 de 2016) y su versión vigente se entrega a la supervisión técnica. Ningún plano se usa en obra sin el sello «Aprobado para construcción».',
      contabilidadEstado: 'El Gestor registra el estado de cada documento (borrador, en revisión, aprobado u obsoleto), su revisión y la fecha de aprobación, y conserva las revisiones emitidas. La lista maestra de planos indica para cada plano su revisión vigente, su fecha y la solicitud de cambio asociada; el director de obra mantiene los planos récord por etapa.',
      frecuenciaAuditoria: 'Mensual',
      auditorias: 'Cada mes, antes del comité de gerencia, el gerente verifica que las líneas base del Gestor coinciden con los documentos aprobados y que los cambios aprobados están reflejados. En obra, el inspector de calidad verifica cada semana que los planos en uso son los vigentes. Antes de cada certificado técnico de ocupación se audita la correspondencia entre planos aprobados, planos récord y lo construido, con la supervisión técnica independiente.',
    },
  };

  /* ================================================================== PLANIFICACIÓN · ALCANCE */

  /* ------------------------------------------------------------ 5.1 Plan de gestión del alcance (rev. 1 con la LB1) */
  const planAlcanceFields = {
    procesoEnunciado: 'El gerente de proyecto elabora el enunciado del alcance a partir del acta de constitución, el caso de negocio, la factibilidad y la norma del lote, con el arquitecto diseñador (producto), el estructurador financiero (estructura fiduciaria y financiera) y el gerente comercial (mezcla y condiciones de venta). El borrador se revisa en el comité de gerencia y la junta lo aprueba con la factibilidad. El enunciado se actualiza solo por control de cambios; las obligaciones que imponga la licencia de urbanización y construcción (conceptos de Movilidad, EPM y autoridad ambiental) se incorporan como alcance por solicitud de cambio.',
    fuentesAlcance: [
      'Acta de constitución (13 de enero de 2025) y caso de negocio.',
      'Factibilidad técnica, legal y financiera aprobada el 22 de abril de 2025.',
      'Norma del polígono Z4_DE_1 (Acuerdo 48 de 2014) y decreto de adopción del plan parcial.',
      'Reparto de cargas y beneficios de la unidad de actuación urbanística.',
      'Estudio de mercado del occidente de Medellín (mezcla de producto y precios).',
      'Condiciones de la fiduciaria para el punto de equilibrio y del banco para el crédito constructor.',
      'Licencia de urbanización y construcción y sus obligaciones (conceptos de la Secretaría de Movilidad, EPM y el Área Metropolitana del Valle de Aburrá).',
    ],
    procesoEdt: 'EDT orientada a entregables, construida por descomposición en el taller de planificación de marzo de 2025: seis entregables de nivel 2 (1.1 Gerencia, 1.2 Estructuración, 1.3 Diseños y licencias, 1.4 Comercialización y ventas, 1.5 Construcción, 1.6 Entrega, escrituración y cierre). La construcción se divide en cuentas de control por etapa (1.5.1 bloques A y B; 1.5.2 bloques C y D) y para el urbanismo y las cargas del plan parcial (1.5.3); la administración de obra, la supervisión técnica y la interventoría forman un paquete propio (1.5.4). La EDT tiene 50 elementos; el cronograma maestro asigna cada actividad a un paquete.',
    criterioPaquete: 'Un paquete de trabajo tiene un solo responsable, un entregable verificable con criterio de aceptación, costo estimado en el presupuesto y duración entre dos semanas y seis meses. Se exceptúan las actividades de nivel de esfuerzo (gerencia, gestión administrativa, fiducia, administración de obra, supervisión técnica e interventoría), que se planifican como paquetes de duración igual a la de la fase que soportan.',
    nivelesEdt: 4,
    diccionario: 'Para cada elemento: código, nombre, tipo (entregable, cuenta de control o paquete), responsable, descripción del trabajo, entregable, criterio de aceptación, costo estimado vigente, actividades del cronograma asociadas, contratos que lo ejecutan y normas aplicables. El diccionario vive en la vista EDT del Gestor.',
    aprobacionLineaBase: 'La línea base del alcance (enunciado del alcance aprobado, EDT y diccionario) la aprueba la junta directiva con la factibilidad: LB0 el 22 de abril de 2025 (enunciado rev. 0) y LB1 el 13 de marzo de 2026 con el CC-002 (enunciado rev. 1, que incorpora las obras de mitigación vial exigidas en la licencia).',
    mantenimientoLineaBase: 'Solo se modifica con un cambio aprobado de nivel 3 según el plan de gestión de cambios: el gerente actualiza el enunciado, la EDT y el diccionario, emite la nueva revisión del enunciado y establece una nueva línea base numerada (LB1, LB2…) que cita el cambio que la origina. Las obras adicionales cargadas a la reserva para contingencias sin cambiar el producto (por ejemplo, contenciones de emergencia) se registran como actividades nuevas del paquete afectado sin modificar la línea base.',
    procesoAceptacion: 'Cada entregable se verifica internamente antes de presentarlo: el responsable del paquete revisa contra el criterio de aceptación del diccionario; la supervisión técnica independiente libera la estructura por piso y la interventoría del banco verifica el avance. El gerente de proyecto acepta con un acta de aceptación de entregables (PRY-2025-003-AAE) que registra la evidencia, el resultado y los pendientes. Los entregables regulatorios se aceptan con el acto administrativo en firme (licencia, permisos, certificado técnico de ocupación) y los comerciales con la certificación de la fiduciaria. Los compradores aceptan su vivienda con el acta de entrega; la copropiedad, las zonas comunes, y el Distrito, las cesiones.',
    responsablesAceptacion: rows('pa-ra', [
      { tipoEntregable: 'Estudios, factibilidad y plan para la dirección', verifica: R.ger, acepta: R.jun, documento: 'Acta de la sesión de la junta directiva' },
      { tipoEntregable: 'Lote y saneamiento', verifica: R.abo, acepta: R.ger, documento: 'Certificado de tradición y libertad a nombre del fideicomiso' },
      { tipoEntregable: 'Diseños y licencia', verifica: 'Arquitecto diseñador (coordinación) e ingeniero estructural', acepta: R.ger, documento: 'Acta de aceptación de entregables y resolución de licencia en firme' },
      { tipoEntregable: 'Preventas y punto de equilibrio', verifica: R.com, acepta: 'Fiduciaria (certifica) y gerente de proyecto', documento: 'Certificación de cumplimiento de las condiciones de giro' },
      { tipoEntregable: 'Estructura por piso', verifica: 'Director de obra (constructor) e inspector de calidad', acepta: R.sup, documento: 'Liberación por piso' },
      { tipoEntregable: 'Paquetes de obra por etapa', verifica: 'Director de obra (constructor) y supervisión técnica independiente', acepta: R.ger, documento: 'Acta de aceptación de entregables' },
      { tipoEntregable: 'Edificación por etapa', verifica: 'Director de obra (constructor) y gerente de proyecto', acepta: R.sup, documento: 'Certificado técnico de ocupación protocolizado (Ley 1796 de 2016)' },
      { tipoEntregable: 'Urbanismo, mitigación vial y cesiones', verifica: R.con, acepta: 'Distrito (Secretaría de Infraestructura Física, Secretaría de Movilidad y DAP) y EPM', documento: 'Actas de recibo y escrituras de cesión' },
      { tipoEntregable: 'Viviendas', verifica: 'Director de obra (constructor) en la inspección previa', acepta: 'Comprador', documento: 'Acta de entrega de la vivienda' },
      { tipoEntregable: 'Zonas comunes', verifica: R.ger, acepta: 'Consejo de administración de la copropiedad', documento: 'Acta de entrega de zonas comunes (Ley 675 de 2001)' },
    ]),
    controlAlcance: 'El gerente compara cada mes el trabajo ejecutado con la línea base del alcance en el comité de gerencia y en el comité de obra. Toda solicitud de comprador, autoridad o contratista que agregue trabajo pasa por el registro de cambios; ninguna obra adicional se ejecuta sin orden escrita del gerente. Las exigencias de autoridades (curaduría, Movilidad, EPM, autoridad ambiental) se analizan en cuanto se conocen para tramitar el cambio antes de que afecten la obra. Los cambios de producto en etapas con promesas firmadas requieren además la aceptación de los compradores afectados.',
  };
  const planAlcance = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.arq, aprobo: R.jun },
    fields: planAlcanceFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la LB0.', fields: { ...cp(planAlcanceFields), fuentesAlcance: planAlcanceFields.fuentesAlcance.slice(0, 6), aprobacionLineaBase: 'La línea base del alcance (enunciado del alcance aprobado, EDT y diccionario) la aprueba la junta directiva con la factibilidad: LB0 el 22 de abril de 2025 (enunciado rev. 0).', responsablesAceptacion: rows('pa-ra', planAlcanceFields.responsablesAceptacion.map(({ id, ...r }) => (r.tipoEntregable.startsWith('Urbanismo') ? { ...r, tipoEntregable: 'Urbanismo y cesiones', acepta: 'Distrito (Secretaría de Infraestructura Física y DAP) y EPM' } : r))) } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizado con la LB1 (CC-002): obligaciones de la licencia como fuente de alcance y recibo de la mitigación vial por la Secretaría de Movilidad.' },
    ],
  };

  /* ------------------------------------------------------------ 5.1 Plan de gestión de los requisitos */
  const planRequisitos = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.arq, reviso: R.ger, aprobo: R.jun },
    fields: {
      tecnicasRecopilacion: [
        'Estudio de mercado: encuestas a hogares interesados, oferta comparable en Robledo, Pajarito y Calasanz y entrevistas con salas de ventas.',
        'Análisis de la norma: ficha normativa, decreto del plan parcial y Acuerdo 48 de 2014.',
        'Talleres de diseño con el arquitecto, los ingenieros y el gerente comercial.',
        'Entrevistas con la fiduciaria, el banco, EPM, la Secretaría de Movilidad y la curaduría.',
        'Revisión de posventas y quejas de los proyectos anteriores del promotor.',
        'Requisitos de crédito VIS y de los subsidios de cajas de compensación.',
      ],
      actividadesRequisitos: 'El arquitecto diseñador consolida los requisitos del producto y el gerente de proyecto los del proyecto en la documentación de requisitos (PRY-2025-003-DREQ), con código RQ-##, categoría, fuente, prioridad y criterio de aceptación. La matriz de trazabilidad (PRY-2025-003-MTR) liga cada requisito con su paquete de la EDT, su diseño y su verificación. Se revisan en cada entrega de diseño (esquema básico, anteproyecto, proyecto y diseños de detalle) y antes de radicar la licencia; el estado de la matriz se informa en el comité de gerencia mensual.',
      responsableRequisitos: 'Arquitecto diseñador (requisitos del producto) y gerente de proyecto (requisitos del proyecto)',
      criteriosPriorizacion: rows('pr-cp', [
        { nivel: 'Alta', criterio: 'Obligatorio por norma (POT, NSR-10, Ley 1796 de 2016, reglamentos técnicos), por la licencia o por los contratos de fiducia y crédito, o condición para el punto de equilibrio; sin él no se acepta el entregable.' },
        { nivel: 'Media', criterio: 'Necesario para vender al precio de la factibilidad o para la satisfacción del comprador (áreas, dotación, zonas comunes); se puede negociar la forma de cumplirlo.' },
        { nivel: 'Baja', criterio: 'Deseable; se atiende si no afecta el costo directo por m², el plazo ni el índice de construcción.' },
      ]),
      procesoPriorizacion: 'El arquitecto propone la prioridad y el gerente la confirma en el comité de gerencia; los conflictos entre requisitos de mercado y norma se resuelven siempre a favor de la norma. Los requisitos de prioridad media o baja que suban el costo directo en más de COP 300 millones o afecten el índice de construcción se llevan a la junta con su efecto en la utilidad.',
      atributosTrazabilidad: ['Código (RQ-##)', 'Categoría', 'Fuente (norma, interesado o contrato)', 'Prioridad', 'Paquete de la EDT', 'Entregable', 'Plano o documento de diseño', 'Método de verificación', 'Responsable', 'Estado'],
      estructuraTrazabilidad: 'Necesidad del negocio u obligación normativa → requisito (RQ-##) → paquete de la EDT → plano o documento de diseño → verificación (revisión de la curaduría, ensayo, inspección, certificado) → aceptación del entregable. Cada requisito de norma se liga además a la licencia o al acto administrativo que lo verifica.',
      cambiosRequisitos: 'Un requisito nuevo o modificado se trata como solicitud de cambio cuando afecta la línea base del alcance, el cuadro de áreas o la licencia. Los requisitos que agregue la licencia o una autoridad entran por solicitud de cambio y una nueva revisión de la documentación de requisitos y de la matriz. Los requisitos de compradores individuales (reformas) no modifican la documentación de requisitos del proyecto.',
      metricasProducto: rows('pr-mp', [
        { metrica: 'Índice de construcción', umbral: '≤ 0,6 sobre área bruta (≤ 30.000 m²)', metodo: 'Cuadro de áreas revisado por la curaduría (Acuerdo 48 de 2014, art. 284).' },
        { metrica: 'Número de viviendas', umbral: '≤ 422 (500 menos 78 VIP compensadas) y ≥ 85 VIS', metodo: 'Cuadro de áreas de la licencia.' },
        { metrica: 'Áreas privadas por tipo', umbral: 'A 50 m², B 58 m², C 68 m² (± 1 %); mínimos del art. 370', metodo: 'Planos de licencia y medición en la entrega.' },
        { metrica: 'Parqueaderos', umbral: 'Dentro de los máximos del estrato 3 (arts. 364, 367 y 368)', metodo: 'Cuadro de parqueaderos y estudio de movilidad.' },
        { metrica: "Resistencia del concreto (f'c = 28 MPa)", umbral: "Promedio de 3 ensayos ≥ f'c y ningún ensayo < f'c − 3,5 MPa", metodo: 'Cilindros NTC 550 y NTC 673 (NSR-10 C.5.6.3.3).' },
        { metrica: 'Ahorro de agua y energía', umbral: 'Metas de la Resolución 0549 de 2015 de MinVivienda para Medellín', metodo: 'Memoria del diseño bioclimático y verificación de aparatos en obra.' },
        { metrica: 'Instalaciones eléctricas y de telecomunicaciones', umbral: 'Conformidad RETIE, RETILAP y RITEL', metodo: 'Dictamen de inspección por organismo acreditado.' },
        { metrica: 'Pendientes por vivienda en la inspección previa', umbral: '≤ 3 pendientes menores y ninguno mayor', metodo: 'Lista de chequeo de entrega por vivienda.' },
      ]),
    },
  };

  /* ------------------------------------------------------------ 5.2 Requisitos (documentación y matriz de trazabilidad) */
  /* est: estado en la rev. 1 de la documentación (13 de marzo de 2026); corte: estado en la matriz al 30 de septiembre de 2026 */
  const REQ = [
    { codigo: 'RQ-01', tipo: 'Del negocio', prioridad: 'Alta', requisito: 'Utilidad antes de impuestos de al menos 12 % de las ventas y retorno del aporte del promotor de COP 24.000 millones.', fuente: 'Junta directiva (caso de negocio)', criterioAceptacion: 'Factibilidad aprobada con 12,45 %; pronóstico mensual ≥ 12 % (si baja de 11 % se escala a la junta).', est: 'Aprobado',
      origen: 'Caso de negocio', paqueteEdt: '1.2.2', entregable: 'Modelo financiero', diseno: 'ATA-FIN-MOD', verificacion: 'Pronóstico mensual del modelo financiero; liquidación del fideicomiso.', corte: 'En implementación' },
    { codigo: 'RQ-02', tipo: 'De la solución: funcional', prioridad: 'Alta', requisito: 'Mezcla de 416 viviendas: 104 tipo A (VIS) de 50 m² con 2 alcobas, estudio abierto y 2 baños; 168 tipo B de 58 m² con 2 alcobas, estudio abierto y 2 baños; 144 tipo C de 68 m² con 3 alcobas y 2 baños; 24.736 m² vendibles. El estudio no tiene puerta y mide menos de 7,8 m², por lo que no computa como alcoba: los tipos A y B cumplen el mínimo de 45 m² para 2 alcobas y el tipo C el de 60 m² para 3 alcobas (Acuerdo 48 de 2014, art. 370).', fuente: 'Estudio de mercado del occidente de Medellín', criterioAceptacion: 'Cuadro de áreas aprobado en la licencia; áreas privadas medidas en la entrega con tolerancia de ± 1 %.', est: 'Verificado',
      origen: 'Estudio de mercado', paqueteEdt: '1.3.1', entregable: 'Cuadro de áreas', diseno: 'ATA-ARQ-CA', verificacion: 'Licencia ejecutoriada el 15 de diciembre de 2025; medición de áreas en la entrega.', verif0: 'Revisión de la curaduría; medición de áreas en la entrega.', corte: 'Verificado' },
    { codigo: 'RQ-03', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Densidad ≤ 100 viviendas/ha sobre área bruta (máximo 500; 422 después de compensar 78 VIP) e índice de construcción ≤ 0,6 sobre área bruta (30.000 m²).', fuente: 'Acuerdo 48 de 2014, arts. 280 y 284 (polígono Z4_DE_1)', criterioAceptacion: 'Cuadro de áreas aprobado en la licencia: 416 viviendas y 27.415 m² en el índice (0,548).', est: 'Verificado',
      origen: 'Norma del lote (POT)', paqueteEdt: '1.3.1', entregable: 'Cuadro de áreas', diseno: 'ATA-ARQ-CA', verificacion: 'Revisión de la curaduría; licencia ejecutoriada.', verif0: 'Revisión de la curaduría al expedir la licencia.', corte: 'Verificado' },
    { codigo: 'RQ-04', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Altura máxima de 8 pisos; índice de ocupación ≤ 45 % del área neta; zona verde privada de uso común ≥ 10 % del área neta (2.700 m²).', fuente: 'Acuerdo 48 de 2014, arts. 280, 282 y 321', criterioAceptacion: 'Licencia con huella de 7.600 m² (28,1 %) y 3.400 m² de zona verde privada.', est: 'Verificado',
      origen: 'Norma del lote (POT)', paqueteEdt: '1.3.1 / 1.5.3.4', entregable: 'Proyecto arquitectónico', diseno: 'ATA-ARQ-G-001', verificacion: 'Licencia; recibo de zonas comunes por la copropiedad.', verif0: 'Revisión de la curaduría; recibo de zonas comunes.', corte: 'Verificado' },
    { codigo: 'RQ-05', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Cesión de 9.000 m² para espacio público y equipamiento (18 % del área bruta) con parque adecuado; 416 m² de equipamiento construido; vía colectora de 16 m (4.000 m²) y 3.000 m² de vías locales.', fuente: 'Acuerdo 48 de 2014, arts. 280, 308 y 310; reparto de cargas del plan parcial', criterioAceptacion: 'Actas de recibo de la Secretaría de Infraestructura Física y del DAP y escrituras de cesión registradas.', est: 'Aprobado',
      origen: 'Reparto de cargas', paqueteEdt: '1.5.3 / 1.6.3', entregable: 'Cesiones y vías', diseno: 'ATA-URB-001 a 040', verificacion: 'Actas de recibo del Distrito y escrituras de cesión.', corte: 'En implementación' },
    { codigo: 'RQ-06', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Obligación VIP del 20 % del suelo neto urbanizable (7.800 m², 78 VIP equivalentes). En el Macroproyecto de Borde Urbano Rural el art. 326 exige cumplir al menos el 50 % dentro del macroproyecto: 39 VIP (3.900 m²) se cumplen dentro de él con derechos fiduciarios del ISVIMED vinculados a un proyecto VIP del mismo macroproyecto (COP 1.500 millones) y 39 VIP (3.900 m²) se trasladan fuera de él con derechos fiduciarios del ISVIMED, en el orden de prioridad del numeral 2 (COP 1.500 millones). La ubicación del lote en ese macroproyecto y la distribución son supuestos del ejemplo que en un lote real se verifican con el DAP, el ISVIMED y el decreto del plan parcial. Al menos 20 % de las viviendas restantes como VIS (85) dentro del mismo proyecto, porque la VIS no se traslada; el proyecto tiene 104.', fuente: 'Acuerdo 48 de 2014, arts. 324 a 326; decreto de adopción del plan parcial; Decreto 1077 de 2015', criterioAceptacion: 'Certificados del ISVIMED por 78 VIP (39 dentro del Macroproyecto de Borde y 39 trasladadas; COP 3.000 millones) y 104 VIS en el cuadro de áreas.', est: 'Verificado',
      origen: 'Obligación VIS y VIP', paqueteEdt: '1.2.3', entregable: 'Compensación VIP', diseno: 'Reparto de cargas', verificacion: 'Certificados del ISVIMED del 18 de julio de 2025.', verif0: 'Certificados del ISVIMED; cuadro de áreas.', corte: 'Verificado' },
    { codigo: 'RQ-07', tipo: 'De calidad', prioridad: 'Alta', requisito: 'Diseño y construcción sismorresistentes según la NSR-10 (amenaza sísmica intermedia, Aa = 0,15 y Av = 0,20) con muros de concreto vaciados; revisión independiente de los diseños estructurales y supervisión técnica independiente.', fuente: 'Ley 400 de 1997; NSR-10; Ley 1796 de 2016 y Decreto 1203 de 2017', criterioAceptacion: "Memorias firmadas con constancia de revisión independiente; liberación por piso; f'c = 28 MPa conforme (NSR-10 C.5.6); certificado técnico de ocupación.", est: 'Aprobado',
      origen: 'Seguridad estructural', paqueteEdt: '1.5.1.2 / 1.5.2.2', entregable: 'Estructura', diseno: 'ATA-EST-E1 / E2', verificacion: 'Cilindros NTC 550 y NTC 673; liberación por piso de la supervisión técnica; certificado técnico de ocupación.', corte: 'En implementación' },
    { codigo: 'RQ-08', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Parqueaderos dentro de los máximos del estrato 3: 203 privados No VIS, 26 VIS de uso asignado, 52 de visitantes (10 para personas con movilidad reducida), 104 de motos y 60 de bicicletas (281 celdas de carro); estudio de movilidad aprobado por superar 150 celdas.', fuente: 'Acuerdo 48 de 2014, arts. 364, 367 y 368; Secretaría de Movilidad', criterioAceptacion: 'Concepto de la Secretaría de Movilidad y cuadro de parqueaderos de la licencia.', est: 'Verificado',
      origen: 'Norma de parqueaderos', paqueteEdt: '1.3.4', entregable: 'Estudio de movilidad', diseno: 'ATA-ARQ-PQ-001', verificacion: 'Concepto de la Secretaría de Movilidad de octubre de 2025.', corte: 'Verificado' },
    { codigo: 'RQ-09', tipo: 'De los interesados', prioridad: 'Alta', requisito: 'Obras de mitigación vial exigidas en la licencia: bahía de acceso, carril de desaceleración y semaforización sobre la vía colectora.', fuente: 'Licencia de urbanización y construcción (concepto de la Secretaría de Movilidad); CC-002', criterioAceptacion: 'Acta de recibo de la Secretaría de Movilidad y de la Secretaría de Infraestructura Física antes de radicar el certificado técnico de ocupación de la etapa 1.', est: 'Aprobado',
      origen: 'Licencia (Movilidad)', paqueteEdt: '1.5.3.1 (U02)', entregable: 'Mitigación vial', diseno: 'ATA-URB-MV-001 a 006', verificacion: 'Acta de recibo de la Secretaría de Movilidad.', corte: 'Aprobado' },
    { codigo: 'RQ-10', tipo: 'De la solución: no funcional', prioridad: 'Alta', requisito: 'Redes de acueducto, alcantarillado, energía y gas según las normas de diseño y construcción de EPM, con tanque de almacenamiento y bombeo por la presión disponible en el punto de conexión.', fuente: 'EPM (factibilidad de servicios y aprobación de diseños)', criterioAceptacion: 'Aprobación de los diseños por EPM y acta de recibo de redes con pruebas de presión conformes.', est: 'Aprobado',
      origen: 'Servicios públicos (EPM)', paqueteEdt: '1.3.4 / 1.5.3.2', entregable: 'Redes externas', diseno: 'ATA-URB-RED-001 a 018', verificacion: 'Aprobación de diseños de EPM del 23 de enero de 2026; acta de recibo de EPM.', verif0: 'Aprobación de diseños y acta de recibo de EPM.', corte: 'En implementación' },
    { codigo: 'RQ-11', tipo: 'De la solución: no funcional', prioridad: 'Alta', requisito: 'Ahorro de agua y energía según la Resolución 0194 de 2025 de MinVivienda (metas obligatorias en VIS), con diseño bioclimático.', fuente: 'Resolución 0194 de 2025 de MinVivienda (sustituyó a la Resolución 0549 de 2015)', criterioAceptacion: 'Memoria de cumplimiento firmada por el diseñador bioclimático y verificación de aparatos y luminarias en la entrega.', est: 'Aprobado',
      origen: 'Construcción sostenible', paqueteEdt: '1.3.3', entregable: 'Diseño bioclimático', diseno: 'ATA-BIO-G-001', verificacion: 'Memoria de cumplimiento; inspección de aparatos sanitarios y luminarias.', corte: 'Aprobado' },
    { codigo: 'RQ-12', tipo: 'De calidad', prioridad: 'Alta', requisito: 'Instalaciones eléctricas, de iluminación y de telecomunicaciones con certificación de conformidad RETIE, RETILAP y RITEL.', fuente: 'RETIE (MinEnergía), RETILAP (Resolución 180540 de 2010) y RITEL (Resolución CRC 5050 de 2016, título 8)', criterioAceptacion: 'Dictámenes de inspección de un organismo acreditado antes de la energización definitiva y de la entrega.', est: 'Aprobado',
      origen: 'Reglamentos técnicos', paqueteEdt: '1.5.1.6 / 1.5.2.6', entregable: 'Certificaciones', diseno: 'ATA-ELE · ATA-RIT', verificacion: 'Dictamen de inspección por organismo acreditado.', corte: 'Aprobado' },
    { codigo: 'RQ-13', tipo: 'Del proyecto', prioridad: 'Alta', requisito: 'Preventas por encargo fiduciario con punto de equilibrio del 75 % por etapa (156 de 208 viviendas), licencia ejecutoriada, lote libre de gravámenes en el patrimonio autónomo y crédito constructor aprobado antes de girar recursos; SARLAFT de la fiduciaria en la vinculación de cada comprador.', fuente: 'Circular Básica Jurídica de la Superintendencia Financiera (CE 029 de 2014), parte II, título II, capítulo I; contrato de encargo fiduciario', criterioAceptacion: 'Certificación de la fiduciaria del cumplimiento de las condiciones de giro de cada etapa.', est: 'Verificado',
      origen: 'Protección al comprador', paqueteEdt: '1.4.3 / 1.4.4', entregable: 'Punto de equilibrio', diseno: 'Encargo (CT-011)', verificacion: 'Certificación de la fiduciaria: etapa 1 el 27 de febrero de 2026; etapa 2 pendiente (78 de 156 viviendas al corte).', verif1: 'Certificación de la fiduciaria: etapa 1 el 27 de febrero de 2026; etapa 2 pendiente.', verif0: 'Certificación de la fiduciaria por etapa.', corte: 'En implementación' },
    { codigo: 'RQ-14', tipo: 'Del negocio', prioridad: 'Alta', requisito: 'Precio de las 104 VIS pactado en pesos (COP 254 millones) y por debajo del tope de 150 SMMLV en la escrituración.', fuente: 'Ley 2294 de 2023, art. 293; Decreto 1469 de 2025 (SMMLV 2026)', criterioAceptacion: 'Precio ≤ COP 262.635.750 con el SMMLV de 2026; revisión con el SMMLV del año de cada escritura.', est: 'Verificado',
      origen: 'Crédito VIS y subsidios', paqueteEdt: '1.4.6', entregable: 'Escrituras VIS', diseno: 'ATA-COM-LP-E1', verificacion: 'Revisión del tope en cada escritura.', corte: 'Verificado' },
    { codigo: 'RQ-15', tipo: 'De la solución: funcional', prioridad: 'Media', requisito: 'Zonas comunes de 1.100 m² (portería, salón social, gimnasio y cuartos técnicos), 8 ascensores (dos por bloque), planta eléctrica de emergencia, bombeo y detección de incendio.', fuente: 'Estudio de mercado; NSR-10, títulos J y K', criterioAceptacion: 'Pruebas de funcionamiento de equipos e inventario de dotación entregado a la administración provisional.', est: 'Aprobado',
      origen: 'Estudio de mercado', paqueteEdt: '1.5.1.6 / 1.5.2.6', entregable: 'Zonas comunes', diseno: 'ATA-ARQ-ZC', verificacion: 'Pruebas de ascensores, bombeo y planta; inventario de dotación.', corte: 'Aprobado' },
    { codigo: 'RQ-16', tipo: 'De transición y preparación', prioridad: 'Alta', requisito: 'Reglamento de propiedad horizontal escriturado y registrado antes de la primera escritura de venta; manual del propietario y procedimiento de posventas con la garantía legal.', fuente: 'Ley 675 de 2001; Ley 1480 de 2011', criterioAceptacion: 'Reglamento inscrito en el folio de matrícula; manual entregado con cada vivienda; procedimiento de posventas aprobado.', est: 'Aprobado',
      origen: 'Transición a la PH', paqueteEdt: '1.6.2 / 1.6.4', entregable: 'Reglamento de PH', diseno: 'Minuta del reglamento', verificacion: 'Certificado de tradición con el reglamento inscrito.', corte: 'Aprobado' },
    { codigo: 'RQ-17', tipo: 'Del proyecto', prioridad: 'Alta', requisito: 'Restauración y protección del retiro de la quebrada (15 m); permisos de aprovechamiento forestal y de ocupación de cauce; manejo de residuos de construcción y demolición.', fuente: 'Área Metropolitana del Valle de Aburrá; Resolución 1257 de 2021 de MinAmbiente; Acuerdo 48 de 2014', criterioAceptacion: 'Permisos expedidos; informes de cumplimiento; certificados de disposición de RCD en sitios autorizados.', est: 'Aprobado',
      origen: 'Autoridad ambiental', paqueteEdt: '1.3.5 / 1.5.3.3', entregable: 'Permisos y retiro', diseno: 'ATA-URB-RQ-001', verificacion: 'Permisos del 30 de enero de 2026; restauración terminada el 26 de septiembre de 2026; informes mensuales de RCD.', verif1: 'Permisos del 30 de enero de 2026; informes mensuales de RCD.', verif0: 'Permisos ambientales; informes de cumplimiento y de RCD.', corte: 'Verificado' },
    { codigo: 'RQ-18', tipo: 'De transición y preparación', prioridad: 'Alta', requisito: 'Entrega por etapas: ninguna vivienda se ocupa ni se escritura sin el certificado técnico de ocupación de su etapa protocolizado; inspección previa con no más de 3 pendientes menores por vivienda.', fuente: 'Ley 1796 de 2016; política de entregas del promotor', criterioAceptacion: 'Certificado técnico de ocupación protocolizado; acta de entrega firmada por el comprador.', est: 'Aprobado',
      origen: 'Seguridad de ocupantes', paqueteEdt: '1.5.1.6 / 1.6.1', entregable: 'Actas de entrega', diseno: 'ATA-PRO-03', verificacion: 'Lista de chequeo por vivienda.', corte: 'Aprobado' },
  ];
  const reqDoc = (list) => list.map((q) => ({ id: q.codigo, codigo: q.codigo, requisito: q.requisito, tipo: q.tipo, fuente: q.fuente, prioridad: q.prioridad, criterioAceptacion: q.criterioAceptacion, estado: q.est }));
  const REQ0_PATCH = {
    'RQ-02': { estado: 'Aprobado' },
    'RQ-03': { estado: 'Aprobado', criterioAceptacion: 'Cuadro de áreas con no más de 422 viviendas y no más de 30.000 m² en el índice, aprobado en la licencia.' },
    'RQ-04': { estado: 'Aprobado', criterioAceptacion: 'Huella ≤ 45 % del área neta y zona verde privada ≥ 2.700 m² en la licencia.' },
    'RQ-06': { estado: 'Aprobado', criterioAceptacion: 'Certificados del ISVIMED por 78 VIP (COP 3.000 millones: al menos 50 % dentro del Macroproyecto de Borde y el resto trasladado fuera de él) y al menos 85 VIS en el cuadro de áreas.' },
    'RQ-08': { estado: 'Aprobado', requisito: 'Parqueaderos dentro de los máximos del estrato 3 (privados 1 por vivienda, visitantes 1 por cada 4, motos y bicicletas); estudio de movilidad si se superan 150 celdas.', criterioAceptacion: 'Cuadro de parqueaderos de la licencia y concepto de la Secretaría de Movilidad.' },
    'RQ-10': { requisito: 'Redes de acueducto, alcantarillado, energía y gas según las normas de diseño y construcción de EPM y la factibilidad de servicios.' },
    'RQ-11': { requisito: 'Ahorro de agua y energía según la Resolución 0549 de 2015 de MinVivienda, con diseño bioclimático.', fuente: 'Resolución 0549 de 2015 de MinVivienda' },
    'RQ-13': { estado: 'Aprobado' },
    'RQ-14': { estado: 'Aprobado', requisito: 'Precio de las 104 VIS pactado en pesos y por debajo del tope de 150 SMMLV del año de escrituración.', fuente: 'Ley 2294 de 2023, art. 293', criterioAceptacion: 'Precio ≤ 150 SMMLV del año de cada escritura.' },
  };
  const NORMATIVA = [
    'Ley 388 de 1997 y Decreto 1077 de 2015 (planes parciales, licencias urbanísticas, VIS y VIP).',
    'Acuerdo 48 de 2014, POT de Medellín (polígono Z4_DE_1: arts. 280, 282, 284, 308, 310, 321, 324 a 326 y 364 a 370).',
    'Ley 400 de 1997 y Reglamento NSR-10 (Decreto 926 de 2010, modificado por el Decreto 945 de 2017).',
    'Ley 1796 de 2016 y Decreto 1203 de 2017 (revisión independiente, supervisión técnica independiente y certificado técnico de ocupación).',
    'Resolución 0194 de 2025 de MinVivienda (construcción sostenible), que sustituyó a la Resolución 0549 de 2015.',
    'RETIE (MinEnergía; resolución vigente a la fecha de los diseños), RETILAP (Resolución 180540 de 2010) y RITEL (Resolución CRC 5050 de 2016, título 8).',
    'Normas de diseño y construcción de redes de EPM.',
    'Ley 675 de 2001 (propiedad horizontal).',
    'Ley 1480 de 2011 (Estatuto del Consumidor: garantía legal de inmuebles nuevos).',
    'Circular Básica Jurídica de la Superintendencia Financiera (CE 029 de 2014), parte II, título II, capítulo I (preventas y encargos fiduciarios); SARLAFT de la fiduciaria y SAGRILAFT del promotor.',
    'Ley 2294 de 2023, art. 293 (tope de la VIS en 150 SMMLV) y Decreto 1469 de 2025 (SMMLV de 2026).',
    'Resolución 1257 de 2021 de MinAmbiente (residuos de construcción y demolición) y Resolución 4272 de 2021 (trabajo en alturas).',
  ];
  const docRequisitosFields = {
    objetivosNegocio: 'Vender y entregar 416 viviendas de estrato 3 (25 % VIS) con utilidad antes de impuestos de al menos 12 % de las ventas, cumpliendo la norma del plan parcial y la normativa técnica, con preventas protegidas por encargo fiduciario y entregas solo con certificado técnico de ocupación. Los requisitos traducen esos objetivos en condiciones verificables del producto (áreas, mezcla, dotación, desempeño), de la norma (aprovechamientos, cesiones, VIS y VIP, sismorresistencia, reglamentos técnicos) y del proyecto (fiducia, financiación y entrega).',
    normativa: NORMATIVA,
    requisitos: reqDoc(REQ),
    supuestosRequisitos: 'La norma del polígono Z4_DE_1 y del plan parcial es la vigente al radicar la licencia (4 de agosto de 2025) y la licencia ejecutoriada fija los aprovechamientos hasta su vencimiento, aunque se adopte la revisión del POT. Los parámetros que dependen de la ficha normativa del lote (densidad, índice de construcción, altura y ocupación) se verificaron con la curaduría y el DAP. Restricciones: cuadro de áreas ≤ 30.000 m² en el índice; mezcla con al menos 85 VIS; costo directo de torre del orden de COP 2,20 millones/m² construido.',
    dependencias: 'RQ-03, RQ-04 y RQ-08 dependen del cuadro de áreas y del estudio de movilidad, que se cerraron antes de radicar la licencia. RQ-09 depende de la licencia (concepto de Movilidad) y condiciona el certificado técnico de ocupación de la etapa 1. RQ-10 depende de la factibilidad y de la aprobación de diseños de EPM (tanque y bombeo). RQ-13 condiciona el inicio de la obra de cada etapa. RQ-16 y RQ-18 condicionan la primera escritura de venta.',
  };
  const docRequisitos = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.arq, reviso: R.ger, aprobo: R.jun },
    fields: docRequisitosFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la factibilidad y la LB0.', fields: {
        ...cp(docRequisitosFields),
        normativa: NORMATIVA.map((n) => (n.startsWith('Resolución 0194') ? 'Resolución 0549 de 2015 de MinVivienda (ahorro de agua y energía en edificaciones).' : n.startsWith('Ley 2294') ? 'Ley 2294 de 2023, art. 293 (tope de la VIS en 150 SMMLV).' : n)),
        requisitos: patchRows(reqDoc(REQ), REQ0_PATCH, ['RQ-09']),
        supuestosRequisitos: 'La norma del polígono Z4_DE_1 y del plan parcial es la vigente al radicar la licencia y la licencia ejecutoriada fija los aprovechamientos hasta su vencimiento. Los parámetros que dependen de la ficha normativa del lote (densidad, índice de construcción, altura y ocupación) se verifican con la curaduría y el DAP antes de radicar. Restricciones: cuadro de áreas ≤ 30.000 m² en el índice; mezcla con al menos 85 VIS; costo directo de torre del orden de COP 2,20 millones/m² construido.',
        dependencias: 'RQ-03, RQ-04 y RQ-08 dependen del cuadro de áreas y del estudio de movilidad, que deben cerrarse antes de radicar la licencia. RQ-10 depende de la factibilidad de servicios de EPM. RQ-13 condiciona el inicio de la obra de cada etapa. RQ-16 y RQ-18 condicionan la primera escritura de venta.',
      } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizada con la LB1 (CC-002): nuevo requisito RQ-09 (mitigación vial exigida en la licencia); requisitos de norma, mezcla, VIS y punto de equilibrio de la etapa 1 verificados; Resolución 0194 de 2025 en lugar de la 0549 de 2015.' },
    ],
  };

  const reqMatriz = (list, estadoKey, verifKey) => list.map((q) => ({ id: q.codigo, codigoRequisito: q.codigo, requisito: q.requisito, origen: q.origen, paqueteEdt: q.paqueteEdt, entregable: q.entregable, diseno: q.diseno, verificacion: (verifKey && q[verifKey]) || q.verificacion, estado: estadoKey ? q[estadoKey] : 'Aprobado' }));
  const matrizTrazabilidad = {
    status: 'revision', rev: '2A', date: CUT,
    titleBlock: { elaboro: R.arq, reviso: R.ger, aprobo: R.jun },
    fields: {
      matriz: reqMatriz(REQ, 'corte'),
      responsableMatriz: 'Arquitecto diseñador (coordinación de diseños) con el gerente de proyecto',
      fechaActualizacion: CUT,
      notasMatriz: 'Actualizada al corte del 30 de septiembre de 2026. Requisitos verificados: norma y mezcla (licencia ejecutoriada el 15 de diciembre de 2025), obligación VIP (ISVIMED), estudio de movilidad, precio VIS y retiro de la quebrada (restauración terminada el 26 de septiembre). En implementación: estructura (bloque A en el piso 6 de 8 con liberación por piso; INC-005 resuelto con núcleos conformes), redes de EPM de la fase 1 (47 %), cargas urbanísticas y punto de equilibrio de la etapa 2 (78 de 156 viviendas). RQ-01 está en riesgo: el pronóstico de utilidad al corte es 8,67 % de las ventas frente al 12 % exigido (umbral rojo: 10 %); se informa a la junta con el informe de desempeño de septiembre y un plan de recuperación del margen. RQ-09 (mitigación vial) empieza el 5 de octubre de 2026.',
    },
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la LB0.', fields: { matriz: reqMatriz(REQ.filter((q) => q.codigo !== 'RQ-09').map((q) => ({ ...q, ...(REQ0_PATCH[q.codigo] && REQ0_PATCH[q.codigo].requisito ? { requisito: REQ0_PATCH[q.codigo].requisito } : {}), ...(q.codigo === 'RQ-08' ? { verificacion: 'Concepto de la Secretaría de Movilidad.' } : {}) })), null, 'verif0'), responsableMatriz: 'Arquitecto diseñador (coordinación de diseños) con el gerente de proyecto', fechaActualizacion: LB0, notasMatriz: 'Emisión inicial: todos los requisitos aprobados y por implementar; la verificación de norma y mezcla se hará con la licencia.' } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizada con la LB1 (CC-002): RQ-09 (mitigación vial) y estados al inicio de la obra de la etapa 1.', fields: { matriz: reqMatriz(REQ, 'est', 'verif1'), responsableMatriz: 'Arquitecto diseñador (coordinación de diseños) con el gerente de proyecto', fechaActualizacion: LB1, notasMatriz: 'Al inicio de la obra de la etapa 1: requisitos de norma, mezcla, VIP, movilidad, precio VIS y punto de equilibrio de la etapa 1 verificados; RQ-09 (mitigación vial) incorporado por el CC-002.' } },
    ],
  };

  /* ------------------------------------------------------------ 5.3 Enunciado del alcance (rev. 0 sin mitigación vial para la LB0; rev. 1 con ella para la LB1) */
  const ENT_ALCANCE = [
    { entregable: '1.1 Gerencia del proyecto', descripcion: 'Plan para la dirección del proyecto, líneas base, informes mensuales de desempeño, actas de comité y registros de riesgos, incidentes y cambios.', criterioAceptacion: 'Plan aprobado por la junta directiva; informes entregados a la junta, la fiduciaria y el banco dentro de los 5 días hábiles siguientes a cada corte.' },
    { entregable: '1.2.1 Lote saneado en el patrimonio autónomo', descripcion: 'Estudio de títulos, avalúo y levantamiento topográfico; promesa, escritura y registro; englobe y certificado de tradición a nombre del fideicomiso.', criterioAceptacion: 'Estudio de títulos sin observaciones; certificado de tradición libre de gravámenes y limitaciones.' },
    { entregable: '1.2.2 Factibilidad aprobada', descripcion: 'Estudio de mercado del occidente de Medellín y factibilidad técnica, legal y financiera con el modelo financiero del proyecto.', criterioAceptacion: 'Margen antes de impuestos ≥ 12 % de las ventas y decisión de inversión de la junta.' },
    { entregable: '1.2.3 Gestión urbanística', descripcion: 'Unidad de actuación urbanística, reparto de cargas y beneficios con el DAP y cumplimiento de la obligación VIP con derechos fiduciarios del ISVIMED: al menos el 50 % dentro del Macroproyecto de Borde y el resto trasladado fuera de él (Acuerdo 48 de 2014, art. 326).', criterioAceptacion: 'Concepto favorable del DAP; certificados del ISVIMED por 78 VIP equivalentes (39 dentro del macroproyecto y 39 trasladadas).' },
    { entregable: '1.2.4 Estructura fiduciaria y financiación', descripcion: 'Fiducia mercantil inmobiliaria de administración y pagos, encargo fiduciario de preventas y créditos constructores de COP 30.000 millones (etapa 1) y COP 26.000 millones (etapa 2).', criterioAceptacion: 'Contratos firmados; cartas de aprobación del banco; costos financieros dentro del presupuesto.' },
    { entregable: '1.3 Diseños y licencias', descripcion: 'Proyecto arquitectónico y cuadro de áreas; estudio geotécnico y diseño estructural NSR-10 con revisión independiente; diseños técnicos y bioclimático; estudio de movilidad; diseños de redes aprobados por EPM; licencia de urbanización y construcción; permisos ambientales; diseños de detalle por etapa.', criterioAceptacion: 'Licencia en firme; memorias firmadas por profesionales con matrícula vigente y constancia de la revisión independiente; planos aprobados para construcción por el director de obra y la supervisión técnica.' },
    { entregable: '1.4 Comercialización y ventas', descripcion: 'Sala de ventas y apartamento modelo, plan de mercadeo, preventas y punto de equilibrio por etapa, venta del inventario, escrituración y subrogación de los créditos.', criterioAceptacion: 'Punto de equilibrio certificado por la fiduciaria en cada etapa; 416 viviendas y 203 parqueaderos escriturados; paz y salvo del banco por cada unidad liberada.' },
    { entregable: '1.5.1 Construcción de la etapa 1', descripcion: 'Preliminares, movimiento de tierras y cimentación; estructura del 50 % de la plataforma y de los bloques A y B (208 viviendas); mampostería, instalaciones, cubiertas, fachadas, acabados y equipos especiales.', criterioAceptacion: 'Certificado técnico de ocupación de la etapa 1 (Ley 1796 de 2016); certificaciones RETIE y RITEL; redes internas probadas.' },
    { entregable: '1.5.2 Construcción de la etapa 2', descripcion: 'Lo mismo para el 50 % restante de la plataforma y los bloques C y D (208 viviendas).', criterioAceptacion: 'Certificado técnico de ocupación de la etapa 2; certificaciones RETIE y RITEL.' },
    { entregable: '1.5.3 Urbanismo y cargas del plan parcial', descripcion: 'Vía colectora y andenes, vías locales, redes externas de acueducto, alcantarillado, energía y gas, parque de cesión de 9.000 m², equipamiento público de 416 m², restauración del retiro de la quebrada, urbanismo interno, paisajismo y dotación de zonas comunes.', criterioAceptacion: 'Recibo de la Secretaría de Infraestructura Física, del DAP y de EPM; inventario de dotación entregado a la administración provisional.' },
    { entregable: '1.5.3.1 Mitigación vial exigida en la licencia', descripcion: 'Bahía de acceso, carril de desaceleración y semaforización sobre la vía colectora, según el concepto de la Secretaría de Movilidad incorporado en la licencia (CC-002).', criterioAceptacion: 'Acta de recibo de la Secretaría de Movilidad y de la Secretaría de Infraestructura Física antes de radicar el certificado técnico de ocupación de la etapa 1.' },
    { entregable: '1.5.4 Administración de obra, supervisión técnica e interventoría', descripcion: 'Administración delegada de la obra con SST y gastos generales, servicios provisionales, supervisión técnica independiente y interventoría del banco y la fiduciaria.', criterioAceptacion: 'Informes mensuales de supervisión técnica e interventoría sin hallazgos abiertos de más de 30 días.' },
    { entregable: '1.6 Entrega, escrituración y cierre', descripcion: 'Entrega de las 416 viviendas, reglamento de propiedad horizontal, administración provisional y entrega de zonas comunes, entrega de cesiones al Distrito, posventas, liquidación del encargo, del patrimonio autónomo y del crédito, e informe final.', criterioAceptacion: 'Actas de entrega firmadas; acta de entrega de zonas comunes; actas de recibo de cesiones; acta de liquidación de la fiduciaria; acta de cierre aprobada por la junta.' },
  ];
  const enunciadoFields = {
    descripcionProducto: 'Edificio Atalaya del Occidente: una edificación en propiedad horizontal sobre un área útil de 27.000 m² en el borde occidental de Medellín, con una plataforma de parqueaderos en semisótano y sótano parcial (8.600 m²) que soporta cuatro bloques de 8 pisos (A a D) con 13 apartamentos por piso. Son 416 viviendas: 104 VIS tipo A de 50 m² (2 alcobas y estudio abierto) en el bloque A y, en los bloques B, C y D, 168 tipo B de 58 m² (2 alcobas y estudio abierto) y 144 tipo C de 68 m² (3 alcobas); el estudio no tiene puerta y mide menos de 7,8 m², por lo que no computa como alcoba (Acuerdo 48 de 2014, art. 370); 24.736 m² vendibles y 39.385 m² construidos. Zonas comunes de 1.100 m² (portería, salón social, gimnasio y cuartos técnicos), 3.400 m² de zona verde privada, 8 ascensores y 281 celdas de carro (203 privadas No VIS, 26 VIS de uso asignado y 52 de visitantes, 10 de ellas para personas con movilidad reducida), 104 de motos y 60 de bicicletas. Estructura de muros de concreto vaciados con formaleta industrializada sobre pilas pre-excavadas y zapatas (NSR-10, amenaza sísmica intermedia). Incluye las cargas del plan parcial: vía colectora (4.000 m²), vías locales (3.000 m²), redes externas de EPM, parque de cesión de 9.000 m², equipamiento público de 416 m² y restauración del retiro de la quebrada.',
    alcanceProyecto: 'Todo el trabajo para llevar el lote a 416 viviendas entregadas y escrituradas y el fideicomiso liquidado: gerencia del proyecto; compra y saneamiento del lote; estudio de mercado y factibilidad; gestión de la unidad de actuación, del reparto de cargas y de la compensación VIP; estructura fiduciaria y créditos constructores; diseños, estudios, licencia de urbanización y construcción y permisos ambientales; comercialización, preventas por etapa, escrituración y subrogación; construcción por administración delegada de la etapa 1 (bloques A y B) y de la etapa 2 (bloques C y D) con el urbanismo y las cargas del plan parcial, incluidas las obras de mitigación vial exigidas en la licencia (bahía de acceso, carril de desaceleración y semaforización); supervisión técnica independiente e interventoría; entregas, propiedad horizontal, zonas comunes, cesiones al Distrito, posventas y liquidación.',
    entregablesAlcance: rows('ea-en', ENT_ALCANCE),
    criteriosGenerales: 'Un entregable se acepta cuando cumple su criterio de aceptación y el de los requisitos que lo trazan (PRY-2025-003-MTR), con la evidencia archivada: acto administrativo en firme para los regulatorios, certificación de la fiduciaria para los comerciales, liberación de la supervisión técnica independiente y acta de aceptación del gerente para los de obra, y acta firmada por el comprador, la copropiedad o el Distrito para las entregas. Ningún entregable de obra se acepta con no conformidades mayores abiertas.',
    exclusiones: [
      'Formulación, ajuste o modificación del plan parcial (se supone adoptado).',
      'Créditos hipotecarios, leasing y subsidios de los compradores (los tramitan los compradores con bancos y cajas; el proyecto los acompaña).',
      'Reformas o acabados especiales pedidos por compradores; se tramitan aparte y no afectan el programa.',
      'Muebles, electrodomésticos y cortinas de las viviendas; solo se entregan la cocina integral y los equipos especificados.',
      'Administración definitiva de la copropiedad después de la entrega de zonas comunes.',
      'Operación y mantenimiento del parque de cesión y del equipamiento público después de su recibo por el Distrito.',
      'Obras fuera del lote no exigidas en el reparto de cargas ni en la licencia.',
    ],
    supuestosAlcance: [
      'Plan parcial adoptado con la norma del polígono Z4_DE_1; ficha normativa confirmada con el DAP y la curaduría.',
      'Licencia de urbanización y construcción en un mismo acto, con desarrollo por etapas.',
      'Punto de equilibrio de cada etapa antes de iniciar su obra.',
      'Factibilidad de servicios de EPM con capacidad para las 416 viviendas.',
      'La mitigación vial se construye dentro del contrato de urbanismo y antes del certificado técnico de ocupación de la etapa 1.',
    ],
    restriccionesAlcance: [
      'Densidad ≤ 100 viviendas/ha e índice de construcción ≤ 0,6 sobre área bruta; 8 pisos.',
      'Obligación VIP compensada y al menos 85 VIS.',
      'Presupuesto del proyecto de COP 143.339 millones.',
      'Cierre a más tardar el 28 de marzo de 2029.',
      'Ocupación y escrituración solo con certificado técnico de ocupación (Ley 1796 de 2016).',
    ],
  };
  const enunciadoRev0 = {
    ...cp(enunciadoFields),
    alcanceProyecto: 'Todo el trabajo para llevar el lote a 416 viviendas entregadas y escrituradas y el fideicomiso liquidado: gerencia del proyecto; compra y saneamiento del lote; estudio de mercado y factibilidad; gestión de la unidad de actuación, del reparto de cargas y de la compensación VIP; estructura fiduciaria y créditos constructores; diseños, estudios, licencia de urbanización y construcción y permisos ambientales; comercialización, preventas por etapa, escrituración y subrogación; construcción por administración delegada de la etapa 1 (bloques A y B) y de la etapa 2 (bloques C y D) con el urbanismo y las cargas del plan parcial; supervisión técnica independiente e interventoría; entregas, propiedad horizontal, zonas comunes, cesiones al Distrito, posventas y liquidación.',
    entregablesAlcance: rows('ea-en', ENT_ALCANCE.filter((r) => !r.entregable.startsWith('1.5.3.1'))),
    exclusiones: enunciadoFields.exclusiones.map((x) => (x.startsWith('Obras fuera del lote') ? 'Obras viales fuera del lote no exigidas en el reparto de cargas.' : x)),
    supuestosAlcance: enunciadoFields.supuestosAlcance.slice(0, 4),
  };
  const enunciadoAlcance = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.arq, aprobo: R.jun },
    fields: enunciadoFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la factibilidad; base de la línea base del alcance LB0.', fields: enunciadoRev0 },
      { rev: '1', status: 'aprobado', date: LB1, note: 'CC-002: se incorporan las obras de mitigación vial exigidas en la licencia (bahía de acceso, carril de desaceleración y semaforización); base de la LB1.' },
    ],
  };

  /* ------------------------------------------------------------ 5.5 Actas de aceptación de entregables */
  const actasAceptacion = {
    instances: [
      {
        key: 'ej1', title: 'Acta de aceptación AAE-01 — Licencia de urbanización y construcción ejecutoriada',
        status: 'aprobado', rev: '0', date: '2025-12-19',
        titleBlock: { elaboro: R.arq, reviso: R.ies, aprobo: R.ger },
        fields: {
          numeroActa: 'AAE-01',
          fechaActa: '2025-12-19',
          proyectoActa: P.name,
          clienteActa: P.client,
          lugar: 'Oficina del promotor, Medellín',
          entregablesPresentados: rows('a1-en', [
            { entregable: 'Resolución de licencia de urbanización y construcción en firme (ejecutoriada el 15 de diciembre de 2025), con desarrollo por etapas.', paqueteEdt: '1.3.5', criterio: 'Acto administrativo en firme, conforme con el cuadro de áreas radicado y la norma del polígono.', resultado: 'Conforme', evidencia: 'Resolución y constancia de ejecutoria de la curaduría.' },
            { entregable: 'Planos arquitectónicos y de urbanismo aprobados y sellados por la curaduría, con cuadro de áreas: 416 viviendas y 27.415 m² en el índice de construcción (0,548).', paqueteEdt: '1.3.1', criterio: 'Densidad ≤ 100 viviendas/ha, índice de construcción ≤ 0,6, 8 pisos y ocupación ≤ 45 % (RQ-03 y RQ-04).', resultado: 'Conforme', evidencia: 'Planos sellados ATA-ARQ-L y ATA-URB-L; cuadro de áreas ATA-ARQ-CA.' },
            { entregable: 'Estudio geotécnico, memorias y planos estructurales con constancia de la revisión independiente (Ley 1796 de 2016).', paqueteEdt: '1.3.2', criterio: 'Firmados por profesionales con matrícula vigente; observaciones de la curaduría a la memoria atendidas (INC-001).', resultado: 'Conforme', evidencia: 'Memorias ATA-EST, constancia del revisor independiente y respuesta al acta de observaciones.' },
            { entregable: 'Estudio de movilidad (281 celdas) con concepto de la Secretaría de Movilidad.', paqueteEdt: '1.3.4', criterio: 'Concepto favorable incorporado en la licencia.', resultado: 'Conforme con observaciones', evidencia: 'Concepto de la Secretaría de Movilidad de octubre de 2025: exige bahía de acceso, carril de desaceleración y semaforización sobre la vía colectora, no incluidos en el alcance.' },
          ]),
          decisionAceptacion: 'Aceptado con observaciones',
          observacionesActa: 'Se acepta la licencia como entregable del paquete 1.3.5. Quedó en firme el 15 de diciembre de 2025, dos semanas después de la fecha de la LB0 (1 de diciembre), por el acta de observaciones de la curaduría del 6 de octubre (INC-001): ajustes al cuadro de áreas, a la memoria estructural y al concepto de movilidad, radicados el 28 de noviembre. La licencia impone obras de mitigación vial que no están en el alcance ni en el presupuesto: se tramitará una solicitud de cambio con cargo a la reserva para contingencias. Vigencia de la licencia según el Decreto 1077 de 2015 (48 meses prorrogables por 12 cuando la urbanización y la construcción se otorgan en un mismo acto): cubre las dos etapas del programa.',
          pendientes: rows('a1-pe', [
            { accion: 'Radicar la solicitud de cambio por las obras de mitigación vial (bahía de acceso, carril de desaceleración y semaforización) y la reprogramación de la etapa 1.', responsable: R.ger, fechaLimite: '2026-01-19' },
            { accion: 'Obtener la aprobación de EPM de los diseños de acueducto ajustados con tanque y bombeo (INC-002).', responsable: R.arq, fechaLimite: '2026-01-23' },
            { accion: 'Obtener los permisos de aprovechamiento forestal y de ocupación de cauce del Área Metropolitana del Valle de Aburrá.', responsable: R.arq, fechaLimite: '2026-01-30' },
            { accion: 'Entregar los diseños de detalle y planos de taller de la etapa 1 aprobados para construcción.', responsable: R.arq, fechaLimite: '2026-03-13' },
          ]),
          firmasActa: rows('a1-fi', [
            { rol: 'Acepta (promotor)', nombre: R.ger, fecha: '2025-12-19' },
            { rol: 'Entrega (diseño y trámite)', nombre: 'Arquitecto diseñador — ' + EMP.arq, fecha: '2025-12-19' },
            { rol: 'Entrega (estructura)', nombre: 'Ingeniero estructural — ' + EMP.est, fecha: '2025-12-19' },
          ]),
        },
      },
      {
        key: 'ej2', title: 'Acta de aceptación AAE-02 — Movimiento de tierras, contención y cimentación de la etapa 1',
        status: 'aprobado', rev: '0', date: '2026-08-28',
        titleBlock: { elaboro: R.con, reviso: R.sup, aprobo: R.ger },
        fields: {
          numeroActa: 'AAE-02',
          fechaActa: '2026-08-28',
          proyectoActa: P.name,
          clienteActa: P.client,
          lugar: 'Campamento de obra, Medellín',
          entregablesPresentados: rows('a2-en', [
            { entregable: 'Terreno conformado y taludes estabilizados de la etapa 1 (actividad K03, terminada el 17 de julio de 2026).', paqueteEdt: '1.5.1.1', criterio: 'Recibo topográfico de cotas de explanación y concepto del geotecnista sobre la estabilidad de los taludes.', resultado: 'Conforme', evidencia: 'Levantamiento topográfico de recibo e informe del geotecnista del proyecto.' },
            { entregable: 'Pantalla anclada de 60 m y drenajes del talud oriental (actividad K03C, CC-003, terminada el 11 de julio de 2026).', paqueteEdt: '1.5.1.1', criterio: 'Prueba de aceptación del 100 % de los anclajes; desplazamiento acumulado de los inclinómetros por debajo de la alerta de 10 mm; liberación de la supervisión técnica.', resultado: 'Conforme', evidencia: 'Registros de tensionamiento, lecturas diarias de inclinómetros y liberación de la supervisión técnica independiente.' },
            { entregable: 'Pilas pre-excavadas de los bloques A y B y de la plataforma (actividad K04, terminada el 11 de julio de 2026).', paqueteEdt: '1.5.1.1', criterio: 'Ensayo de integridad (PIT) sin anomalías en el 100 % de las pilas; resistencia del concreto conforme.', resultado: 'Conforme', evidencia: 'Informe de ensayos de integridad e informes del laboratorio de materiales.' },
            { entregable: 'Zapatas, dados y vigas de amarre de la etapa 1 (actividad K05, terminada el 21 de agosto de 2026).', paqueteEdt: '1.5.1.1', criterio: 'Resistencia del concreto conforme; recubrimiento ≥ 40 mm en elementos en contacto con el suelo (NSR-10 C.7.7); liberación de la supervisión técnica.', resultado: 'Conforme con observaciones', evidencia: 'Hormigueros en vigas de amarre del eje 4 (no conformidad del 19 de junio de 2026) reparados con mortero de reparación según el procedimiento aprobado por el ingeniero estructural; liberación posterior de la supervisión.' },
          ]),
          decisionAceptacion: 'Aceptado con observaciones',
          observacionesActa: 'El paquete 1.5.1.1 se recibe tres semanas después de la LB1 por el deslizamiento del talud oriental del 7 de mayo de 2026 (INC-004) y la contención adicional del CC-003 (COP 600 millones de la reserva para contingencias). La cimentación terminó el 21 de agosto frente al 6 de agosto de la LB1. Las observaciones no afectan la seguridad estructural; los pendientes no impiden continuar con la estructura de la plataforma y de los bloques.',
          pendientes: rows('a2-pe', [
            { accion: 'Entregar el informe final del geotecnista con las lecturas de los inclinómetros de los 60 días siguientes a la terminación de la pantalla.', responsable: R.con, fechaLimite: '2026-10-15' },
            { accion: 'Entregar los planos récord de cimentación y de la pantalla anclada de la etapa 1.', responsable: R.con, fechaLimite: '2026-10-30' },
            { accion: 'Mantener la lectura diaria de inclinómetros durante la temporada de lluvias de octubre y noviembre.', responsable: R.con, fechaLimite: '2026-11-30' },
          ]),
          firmasActa: rows('a2-fi', [
            { rol: 'Acepta (promotor)', nombre: R.ger, fecha: '2026-08-28' },
            { rol: 'Entrega (constructor)', nombre: 'Director de obra — ' + EMP.con, fecha: '2026-08-28' },
            { rol: 'Supervisión técnica independiente', nombre: 'Supervisor técnico — ' + EMP.sup, fecha: '2026-08-28' },
            { rol: 'Interventoría del banco y la fiduciaria', nombre: 'Interventor — ' + EMP.int, fecha: '2026-08-28' },
          ]),
        },
      },
      {
        key: 'ej3', title: 'Acta de aceptación AAE-03 — Estructura de la plataforma de parqueaderos de la etapa 1',
        status: 'aprobado', rev: '0', date: '2026-09-25',
        titleBlock: { elaboro: R.con, reviso: R.sup, aprobo: R.ger },
        fields: {
          numeroActa: 'AAE-03',
          fechaActa: '2026-09-25',
          proyectoActa: P.name,
          clienteActa: P.client,
          lugar: 'Campamento de obra, Medellín',
          entregablesPresentados: rows('a3-en', [
            { entregable: 'Muros, columnas y losas del semisótano y del sótano parcial de la etapa 1 (actividad K06, terminada el 18 de septiembre de 2026).', paqueteEdt: '1.5.1.2', criterio: "Liberación por nivel de la supervisión técnica; f'c = 28 MPa conforme (NSR-10 C.5.6.3.3); recubrimiento y plomo dentro de tolerancia.", resultado: 'Conforme', evidencia: 'Liberaciones por nivel, informes de cilindros del laboratorio y registros del inspector de calidad.' },
            { entregable: 'Rampas vehiculares, escaleras y juntas de dilatación de la plataforma de la etapa 1.', paqueteEdt: '1.5.1.2', criterio: 'Geometría según planos aprobados para construcción; juntas selladas.', resultado: 'Conforme con observaciones', evidencia: 'Juntas de dilatación entre ejes 6 y 7 sin sello; fisuras de retracción menores en la losa del nivel −1 (eje C).' },
            { entregable: 'Arranques de muros de los bloques A y B sobre la plataforma.', paqueteEdt: '1.5.1.2', criterio: 'Aceros de arranque y traslapos según planos estructurales; liberación de la supervisión técnica.', resultado: 'Conforme', evidencia: 'Liberación de la supervisión técnica independiente y registro fotográfico.' },
          ]),
          decisionAceptacion: 'Aceptado con observaciones',
          observacionesActa: 'La estructura de la plataforma de la etapa 1 terminó el 18 de septiembre frente al 4 de septiembre de la LB1 (dos semanas tarde por la cimentación). Los ensayos de cilindros del periodo promedian cerca de 33 MPa, igual a la resistencia media requerida; el único resultado bajo (25,1 MPa en el piso 3 del bloque A, INC-005) no corresponde a la plataforma y se resolvió con núcleos conformes. Las observaciones son de terminación y no afectan la capacidad estructural.',
          pendientes: rows('a3-pe', [
            { accion: 'Sellar las juntas de dilatación entre los ejes 6 y 7 con el sello especificado.', responsable: R.con, fechaLimite: '2026-10-16' },
            { accion: 'Inyectar las fisuras de retracción de la losa del nivel −1 (eje C) con el procedimiento aprobado por el ingeniero estructural.', responsable: R.con, fechaLimite: '2026-10-09' },
            { accion: 'Entregar los planos récord de la plataforma de la etapa 1.', responsable: R.con, fechaLimite: '2026-10-30' },
          ]),
          firmasActa: rows('a3-fi', [
            { rol: 'Acepta (promotor)', nombre: R.ger, fecha: '2026-09-25' },
            { rol: 'Entrega (constructor)', nombre: 'Director de obra — ' + EMP.con, fecha: '2026-09-25' },
            { rol: 'Supervisión técnica independiente', nombre: 'Supervisor técnico — ' + EMP.sup, fecha: '2026-09-25' },
          ]),
        },
      },
    ],
  };

  /* ================================================================== PLANIFICACIÓN · CRONOGRAMA */

  /* ------------------------------------------------------------ 6.1 Plan de gestión del cronograma (rev. 1 con la LB1) */
  const REGLAS_MEDICION = [
    { tipoActividad: 'Hitos (actas, licencia, punto de equilibrio, crédito, certificado técnico de ocupación)', metodo: 'Fórmula fija 0/100', criterio: 'Cumplido solo con el documento firmado o el acto administrativo en firme.' },
    { tipoActividad: 'Estudios, diseños y trámites', metodo: 'Hitos ponderados', criterio: 'Esquema básico 20 %, anteproyecto 30 %, proyecto o radicación 30 %, aprobación 20 %.' },
    { tipoActividad: 'Preventas y venta del inventario', metodo: 'Unidades completadas', criterio: 'Viviendas vinculadas al encargo fiduciario, netas de desistimientos, frente a la meta del tramo.' },
    { tipoActividad: 'Movimiento de tierras', metodo: 'Unidades completadas', criterio: 'Metros cúbicos excavados y retirados según el levantamiento topográfico, frente al volumen de diseño.' },
    { tipoActividad: 'Pilas y cimentación', metodo: 'Unidades completadas', criterio: 'Pilas fundidas con ensayo de integridad conforme; zapatas y vigas liberadas por la supervisión técnica.' },
    { tipoActividad: 'Estructura de la plataforma y de los bloques', metodo: 'Unidades completadas', criterio: 'Pisos (o niveles de la plataforma) vaciados y liberados por la supervisión técnica sobre el total: 8 pisos por bloque.' },
    { tipoActividad: 'Mampostería, instalaciones, cubiertas, fachadas y acabados', metodo: 'Porcentaje completado', criterio: 'Avance medido por piso y por actividad con las cantidades del presupuesto del constructor, validado por la interventoría en el acta mensual.' },
    { tipoActividad: 'Urbanismo, vías y redes externas', metodo: 'Porcentaje completado', criterio: 'Cantidades ejecutadas del contrato de urbanismo (metros lineales de red y metros cuadrados de vía) frente a las de diseño.' },
    { tipoActividad: 'Gerencia, administración de obra, fiducia, gestión administrativa', metodo: 'Nivel de esfuerzo', criterio: 'El valor ganado es igual al valor planificado del periodo.' },
    { tipoActividad: 'Supervisión técnica e interventoría', metodo: 'Esfuerzo prorrateado', criterio: 'Avance igual al de la obra de la etapa que supervisan.' },
    { tipoActividad: 'Intereses y comisiones del crédito constructor', metodo: 'Esfuerzo prorrateado', criterio: 'Proporcional a los desembolsos y al saldo del crédito de cada tramo.' },
  ];
  const UMBRALES_CRONO = [
    { indicador: 'Índice de desempeño del cronograma (SPI) del proyecto', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: análisis de causas en el comité de gerencia. Rojo: plan de recuperación y aviso a la junta.' },
    { indicador: 'SPI de los costos directos de cada etapa', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Revisar con el constructor rendimientos, cuadrillas y turnos; el índice global se diluye por el lote y la compensación VIP ejecutados.' },
    { indicador: 'Desviación de hitos de control (punto de equilibrio, crédito, acta de inicio, certificado técnico de ocupación, entregas)', verde: '0 a 5 días hábiles', amarillo: '6 a 20 días hábiles', rojo: '> 20 días hábiles', accion: 'Rojo: plan de recuperación aprobado por la junta o solicitud de cambio.' },
    { indicador: 'Rendimiento de la estructura (días hábiles por piso y bloque)', verde: '≤ 8,5', amarillo: '8,6 a 10', rojo: '> 10', accion: 'Ajustar cuadrillas, turnos o juegos de formaleta con el constructor.' },
    { indicador: 'Velocidad de ventas frente al plan', verde: '≥ 90 %', amarillo: '80 % a 89 %', rojo: '< 80 % durante dos meses', accion: 'Plan comercial correctivo con el gerente comercial; si persiste, solicitud de cambio de precios o condiciones.' },
    { indicador: 'Holgura total de la ruta crítica', verde: '≥ 10 días hábiles', amarillo: '1 a 9 días hábiles', rojo: '≤ 0 días hábiles', accion: 'Revisar la secuencia y los recursos; evaluar ejecución rápida o intensificación.' },
  ];
  const planCronogramaFields = {
    metodologia: 'Método de la ruta crítica (CPM)',
    herramienta: 'Gestor de Proyectos PMBOK (cronograma maestro, diagrama de red, recursos y valor ganado); el programa detallado de obra del constructor (por piso y frente) se integra en el cronograma maestro en el nivel de paquete',
    calendario: 'Lunes a sábado',
    festivosColombia: true,
    unidadMedida: 'Días hábiles',
    nivelExactitud: '± 5 días hábiles en hitos de obra; ± 20 días hábiles en hitos comerciales y de trámites',
    enlaceEdt: 'Cada actividad del cronograma maestro pertenece a un paquete de trabajo de la EDT; el cronograma usa los códigos de la EDT y los identificadores por frente (G gerencia, E estructuración y financiación, D diseños, C comercial, K obra de la etapa 1, L obra de la etapa 2, U urbanismo, S servicios y supervisión, P pólizas, Z entrega y cierre). Las cuentas de control son 1.5.1 (etapa 1), 1.5.2 (etapa 2) y 1.5.3 (urbanismo); los paquetes de gerencia y estructuración se controlan directamente con el gerente.',
    frecuenciaActualizacion: 'Mensual',
    mantenimientoModelo: 'Corte mensual el último día del mes: el gerente registra avances y fechas reales; el director de obra entrega el avance físico validado por la interventoría del banco y la fiduciaria; el gerente comercial entrega las ventas netas certificadas por la fiduciaria. El cronograma se reprograma a la fecha de corte (lo no iniciado no empieza antes del día siguiente) para pronosticar hitos y fin. Durante la obra, el comité de obra de cada lunes actualiza el programa semanal del constructor. La línea base solo cambia por control integrado de cambios (LB0 del 22 de abril de 2025; LB1 del 13 de marzo de 2026).',
    umbralesCronograma: rows('pk-um', UMBRALES_CRONO),
    reglasMedicion: rows('pk-rm', REGLAS_MEDICION),
    formatosInformes: 'Informe mensual de desempeño (PRY-2025-003-IDT) con hitos de línea base frente a reales o pronosticados, curva S de valor planificado, ganado y real, índices SPI, SPI(t) y CPI globales y por grupo de costo, ruta crítica pronosticada y acciones. Programa de obra semanal y avance por piso en el comité de obra; acta mensual de avance de obra para la fiduciaria y el banco; boletín bimestral de avance para los compradores.',
  };
  const planCronograma = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.con, aprobo: R.jun },
    fields: planCronogramaFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la LB0.', fields: {
        ...cp(planCronogramaFields),
        herramienta: 'Gestor de Proyectos PMBOK (cronograma maestro, diagrama de red, recursos y valor ganado); el programa detallado de obra del constructor se integrará al contratar la obra',
        mantenimientoModelo: 'Corte mensual el último día del mes: el gerente registra avances y fechas reales con los responsables de cada frente; el gerente comercial entrega las ventas netas certificadas por la fiduciaria. El cronograma se reprograma a la fecha de corte para pronosticar hitos y fin. Al contratar la obra, el programa del constructor se integra en el nivel de paquete. La línea base solo cambia por control integrado de cambios.',
        umbralesCronograma: rows('pk-um', UMBRALES_CRONO.filter((r) => !r.indicador.startsWith('Rendimiento'))),
      } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizado con la LB1 (CC-002): programa de obra del constructor integrado, comité de obra semanal y umbral de rendimiento de la estructura por piso.' },
    ],
  };

  /* ------------------------------------------------------------ 6.4 Estimaciones de duración (rev. 1 con el programa del constructor) */
  const EST_LB1 = [
    { codigo: 'K02', actividad: 'Preliminares de la etapa 1: cerramiento, campamento, topografía y plan de manejo de tránsito', paqueteEdt: '1.5.1.1', optimista: 15, masProbable: 19, pesimista: 23, base: 'Programa del constructor; campamento modular y cerramiento de 900 m en obras similares de 3 a 4 semanas.' },
    { codigo: 'K03', actividad: 'Movimiento de tierras, contención y estabilización de taludes de la etapa 1', paqueteEdt: '1.5.1.1', optimista: 60, masProbable: 70, pesimista: 86, base: 'Volumen de corte del estudio geotécnico con dos frentes de excavadora y 14 volquetas; pesimista con 15 días de lluvia en abril y mayo.' },
    { codigo: 'K04', actividad: 'Pilas pre-excavadas de la etapa 1 (bloques A y B y plataforma)', paqueteEdt: '1.5.1.1', optimista: 42, masProbable: 48, pesimista: 60, base: 'Número de pilas del diseño estructural a 3 pilas por día con un equipo de perforación; pesimista con roca o agua en el fondo.' },
    { codigo: 'K05', actividad: 'Zapatas, dados y vigas de amarre de la etapa 1', paqueteEdt: '1.5.1.1', optimista: 46, masProbable: 53, pesimista: 66, base: 'Dos cuadrillas de cimentación; rendimientos históricos del constructor.' },
    { codigo: 'K06', actividad: 'Estructura de la plataforma de parqueaderos de la etapa 1', paqueteEdt: '1.5.1.2', optimista: 56, masProbable: 65, pesimista: 80, base: '4.300 m² de plataforma en dos niveles por sectores de 700 m²; ciclo de 10 a 11 días por sector.' },
    { codigo: 'K07', actividad: 'Estructura del bloque A (8 pisos, muros vaciados con formaleta industrializada)', paqueteEdt: '1.5.1.2', optimista: 56, masProbable: 66, pesimista: 82, base: '8 pisos con un juego de formaleta: 7 días por piso (O), 8,25 días (M) y 10 días más 2 días de ajuste del primer ciclo (P).' },
    { codigo: 'K09', actividad: 'Estructura del bloque B (8 pisos, muros vaciados con formaleta industrializada)', paqueteEdt: '1.5.1.2', optimista: 58, masProbable: 68, pesimista: 84, base: 'Bloque B de 7.815 m² (25 % más área por piso que el A); mismo sistema y segundo juego de formaleta.' },
    { codigo: 'K11', actividad: 'Mampostería del bloque A', paqueteEdt: '1.5.1.3', optimista: 66, masProbable: 78, pesimista: 96, base: 'Muros divisorios no estructurales piso a piso detrás de la estructura; rendimiento de 12 m² por oficial al día.' },
    { codigo: 'K12', actividad: 'Instalaciones hidrosanitarias, de gas y red contra incendio del bloque A', paqueteEdt: '1.5.1.3', optimista: 80, masProbable: 93, pesimista: 112, base: 'Subcontrato de redes por piso con pruebas hidrostáticas de 150 psi durante 2 horas.' },
    { codigo: 'K28', actividad: 'Equipos especiales de la etapa 1: ascensores, bombeo, planta eléctrica y detección de incendio', paqueteEdt: '1.5.1.6', optimista: 74, masProbable: 86, pesimista: 110, base: 'Plazo de importación de ascensores de 16 semanas desde la orden de compra; montaje de 4 ascensores en 6 semanas.' },
    { codigo: 'K29', actividad: 'Aseo general, pruebas, recibo de redes de EPM y certificaciones RETIE y RITEL de la etapa 1', paqueteEdt: '1.5.1.6', optimista: 36, masProbable: 42, pesimista: 54, base: 'Agenda de EPM y del organismo de inspección; pesimista con observaciones que exigen una segunda visita.' },
    { codigo: 'C07', actividad: 'Preventas de la etapa 2 hasta el 60 % (125 de 208 viviendas)', paqueteEdt: '1.4.4', optimista: 180, masProbable: 216, pesimista: 264, base: '125 viviendas a 14 ventas al mes (M), 17 (O) y 11 (P).' },
    { codigo: 'C08', actividad: 'Preventas de la etapa 2 del 60 % al 75 % (31 viviendas)', paqueteEdt: '1.4.4', optimista: 40, masProbable: 48, pesimista: 62, base: '31 viviendas al ritmo de cierre de la etapa 1 (feria de vivienda con cajas y bancos).' },
    { codigo: 'E18', actividad: 'Trámite del crédito constructor de la etapa 2 (estudio, avalúo y aprobación)', paqueteEdt: '1.2.4', optimista: 30, masProbable: 35, pesimista: 46, base: 'Experiencia del crédito de la etapa 1 con el mismo banco (carpeta y avalúo actualizados).' },
    { codigo: 'L03', actividad: 'Movimiento de tierras y contención de la etapa 2', paqueteEdt: '1.5.2.1', optimista: 46, masProbable: 54, pesimista: 74, base: 'Menor volumen que la etapa 1; programado fuera de la temporada de lluvias (supuesto S-11).' },
    { codigo: 'L07', actividad: 'Estructura del bloque C (8 pisos)', paqueteEdt: '1.5.2.2', optimista: 56, masProbable: 65, pesimista: 80, base: 'Mismo sistema y cuadrillas de la etapa 1 con la curva de aprendizaje ganada.' },
    { codigo: 'Z01', actividad: 'Entregas de vivienda de la etapa 1 (208 unidades)', paqueteEdt: '1.6.1', optimista: 64, masProbable: 75, pesimista: 92, base: '3 entregas diarias con inspección previa; pesimista con 20 % de reprogramaciones por pendientes.' },
    { codigo: 'C12', actividad: 'Escrituración y subrogación de créditos de la etapa 1', paqueteEdt: '1.4.6', optimista: 100, masProbable: 120, pesimista: 152, base: 'Capacidad de la notaría y de los bancos hipotecarios: 8 a 12 escrituras por semana; subsidios VIS con desembolso más lento.' },
  ];
  const EST_LB0 = [
    { codigo: 'D04', actividad: 'Diseño estructural NSR-10 (muros vaciados, plataforma y cimentación)', paqueteEdt: '1.3.2', optimista: 52, masProbable: 61, pesimista: 76, base: 'Propuesta del diseñador estructural y proyectos similares del promotor.' },
    { codigo: 'D09', actividad: 'Estudio de movilidad y aprobación de la Secretaría de Movilidad', paqueteEdt: '1.3.4', optimista: 90, masProbable: 105, pesimista: 138, base: 'Estudio de 8 semanas más revisión de la Secretaría de Movilidad con una ronda de observaciones.' },
    { codigo: 'D10', actividad: 'Factibilidad de servicios y aprobación de diseños de redes de EPM', paqueteEdt: '1.3.4', optimista: 170, masProbable: 198, pesimista: 256, base: 'Tiempos de respuesta de EPM en proyectos del promotor (factibilidad, diseño y revisión).' },
    { codigo: 'D12', actividad: 'Trámite de la licencia en la curaduría: revisión, acta de observaciones y correcciones', paqueteEdt: '1.3.5', optimista: 66, masProbable: 80, pesimista: 118, base: '45 días hábiles legales (Decreto 1077 de 2015) más el plazo para atender el acta de observaciones; en la práctica, 3 a 5 meses en Medellín.' },
    { codigo: 'D14', actividad: 'Permisos ambientales: aprovechamiento forestal y ocupación de cauce', paqueteEdt: '1.3.5', optimista: 115, masProbable: 140, pesimista: 177, base: 'Trámites ante el Área Metropolitana del Valle de Aburrá con visita técnica.' },
    { codigo: 'C04', actividad: 'Preventas de la etapa 1 hasta el punto de equilibrio (156 de 208 viviendas)', paqueteEdt: '1.4.3', optimista: 140, masProbable: 165, pesimista: 214, base: '156 viviendas a 23 ventas al mes (M) con el lanzamiento de las 104 VIS, 28 (O) y 18 (P); estudio de mercado y lanzamientos comparables del occidente.' },
    { codigo: 'E13', actividad: 'Trámite del crédito constructor de la etapa 1', paqueteEdt: '1.2.4', optimista: 48, masProbable: 56, pesimista: 76, base: 'Cartas de intención de dos bancos; estudio, avalúo y comité de crédito.' },
    { codigo: 'K03', actividad: 'Movimiento de tierras, contención y estabilización de taludes de la etapa 1', paqueteEdt: '1.5.1.1', optimista: 60, masProbable: 71, pesimista: 88, base: 'Volumen de corte del anteproyecto con dos frentes de excavadora.' },
    { codigo: 'K04', actividad: 'Pilas pre-excavadas de la etapa 1', paqueteEdt: '1.5.1.1', optimista: 43, masProbable: 50, pesimista: 63, base: 'Número de pilas preliminar a 3 pilas por día.' },
    { codigo: 'K06', actividad: 'Estructura de la plataforma de parqueaderos de la etapa 1', paqueteEdt: '1.5.1.2', optimista: 54, masProbable: 64, pesimista: 80, base: 'Sectores de 700 m² con ciclos de 10 a 11 días.' },
    { codigo: 'K07', actividad: 'Estructura del bloque A (8 pisos)', paqueteEdt: '1.5.1.2', optimista: 56, masProbable: 65, pesimista: 80, base: '8 pisos a 7 a 10 días por piso con formaleta industrializada.' },
    { codigo: 'K09', actividad: 'Estructura del bloque B (8 pisos)', paqueteEdt: '1.5.1.2', optimista: 57, masProbable: 67, pesimista: 83, base: 'Bloque B de 7.815 m² con el segundo juego de formaleta.' },
    { codigo: 'Z01', actividad: 'Entregas de vivienda de la etapa 1 (208 unidades)', paqueteEdt: '1.6.1', optimista: 63, masProbable: 74, pesimista: 91, base: '3 entregas diarias con inspección previa.' },
    { codigo: 'C12', actividad: 'Escrituración y subrogación de créditos de la etapa 1', paqueteEdt: '1.4.6', optimista: 100, masProbable: 119, pesimista: 150, base: '8 a 12 escrituras por semana según la capacidad de notaría y bancos.' },
  ];
  const estimacionesFields = {
    unidadDuracion: 'Días hábiles',
    calendarioEstimacion: 'Lunes a sábado con festivos de Colombia (calendario del proyecto)',
    nivelConfianza: '≈ 50 % (valor esperado)',
    fechaEstimacion: '2026-03-06',
    estimaciones: rows('ed-es', EST_LB1),
    documentacionBase: 'Estimación por tres valores (PERT beta: (O + 4M + P) / 6) de las actividades de la ruta crítica y de mayor incertidumbre, hecha con el constructor sobre su programa de obra para la LB1. Fuentes: rendimientos históricos de la constructora en estructura industrializada (7 a 10 días hábiles por piso y bloque), cantidades del presupuesto de obra, plazos de proveedores (ascensores, concreto, acero), registros de ventas de la etapa 1 (19,5 viviendas al mes) y tiempos reales de los trámites de 2025. Las duraciones del cronograma usan el valor esperado; la reserva de tiempo está en la holgura entre la etapa 1 y las entregas comprometidas en las promesas.',
    supuestosEstimacion: [
      'Calendario de lunes a sábado; los domingos y festivos no se trabaja en obra.',
      'Un juego de formaleta industrializada por bloque y cuadrillas estables de oficiales entrenados.',
      'Concreto premezclado y acero disponibles con programación semanal.',
      'Ventas de la etapa 2 a 14 viviendas al mes en promedio.',
      'Excavación de la etapa 2 fuera de la temporada de lluvias.',
    ],
    rangoEstimaciones: 'La cadena de obra de la etapa 1 hasta el certificado técnico de ocupación (preliminares, tierras, pilas, cimentación, plataforma, estructura del bloque B, equipos especiales y pruebas) suma una desviación estándar de unos 11 días hábiles (raíz de la suma de las varianzas). Con ± 2σ, el certificado técnico de ocupación de la etapa 1 (LB1: 28 de julio de 2027) tiene un rango de ≈ 95 % de ± 22 días hábiles. Para el punto de equilibrio de la etapa 2, la incertidumbre de las ventas domina: σ ≈ 14 días hábiles en los dos tramos de preventas.',
    riesgosEstimacion: 'Lluvias en ladera durante el movimiento de tierras (R-004); disponibilidad y rotación de oficiales de formaleta en un mercado presionado por el alza del salario mínimo de 2026; velocidad de ventas de la etapa 2 (R-001); tiempos de EPM, Movilidad y la curaduría en recibos y certificaciones (R-005). La experiencia de 2025 mostró que los trámites se estimaron optimistas: la licencia tomó 95 días hábiles frente a 84 del PERT de la LB0 (el pesimista era de 118).',
  };
  const estimacionesDuracion = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.con, aprobo: R.jun },
    fields: estimacionesFields,
    revs: [
      { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión aprobada con la LB0 (estimaciones de la factibilidad).', fields: {
        ...cp(estimacionesFields),
        fechaEstimacion: '2025-04-11',
        estimaciones: rows('ed-es', EST_LB0),
        documentacionBase: 'Estimación por tres valores (PERT beta: (O + 4M + P) / 6) de los trámites, las preventas y las actividades de obra de mayor incertidumbre, hecha para la factibilidad con el equipo del promotor, los consultores y presupuestos de referencia de constructoras. Fuentes: proyectos anteriores del promotor, plazos legales de los trámites (Decreto 1077 de 2015), estudio de mercado y rendimientos de estructura industrializada (7 a 10 días hábiles por piso). Las duraciones del cronograma usan el valor esperado.',
        supuestosEstimacion: [
          'Calendario de lunes a sábado; los domingos y festivos no se trabaja en obra.',
          'Ventas de 23 viviendas al mes en el lanzamiento de la etapa 1 (con las 104 VIS) y de 14 al mes en la etapa 2 (18 en promedio).',
          'Licencia con una sola ronda de observaciones de la curaduría.',
          'Un juego de formaleta industrializada por bloque.',
        ],
        rangoEstimaciones: 'Los trámites (movilidad, EPM, licencia y permisos ambientales) concentran la incertidumbre de la fase de diseños: σ de 7 a 9 días hábiles cada uno. Las preventas de la etapa 1 tienen σ ≈ 12 días hábiles. La obra se reestimará con el programa del constructor antes del acta de inicio.',
        riesgosEstimacion: 'Exigencias adicionales o demoras de la curaduría, la Secretaría de Movilidad y EPM (R-005); velocidad de ventas (R-001); lluvias en ladera durante el movimiento de tierras (R-004).',
      } },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualizada con la LB1 (CC-002): estimaciones de obra del programa del constructor; preventas y crédito de la etapa 2.' },
    ],
  };

  /* ================================================================== EJECUCIÓN Y MONITOREO (al corte del 30 de septiembre de 2026) */

  /* ------------------------------------------------------------ 4.3 / 5.5 / 8.3 Registro de entregables */
  const registroEntregables = {
    status: 'revision', rev: 'C', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.con },
    fields: {
      entregables: [
        { id: 'ENT-01', entregable: 'Estudio de títulos, avalúo comercial y levantamiento topográfico del lote', paqueteEdt: '1.2.1', criterios: 'Estudio de títulos sin observaciones; avalúo que soporte el precio de COP 300.000/m² bruto.', fechaPrevista: '2025-02-21', fechaEntrega: '2025-02-21', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-02', entregable: 'Estudio de mercado del occidente de Medellín', paqueteEdt: '1.2.2', criterios: 'Mezcla, precios y velocidad de ventas por segmento con oferta comparable de Robledo, Pajarito y Calasanz.', fechaPrevista: '2025-03-07', fechaEntrega: '2025-03-07', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-03', entregable: 'Factibilidad técnica, legal y financiera (decisión de inversión)', paqueteEdt: '1.2.2', criterios: 'Margen antes de impuestos ≥ 12 % de las ventas; aprobación de la junta.', fechaPrevista: LB0, fechaEntrega: LB0, estado: 'Aceptado', aceptadoPor: R.jun },
        { id: 'ENT-04', entregable: 'Lote escriturado, registrado y englobado a nombre del fideicomiso', paqueteEdt: '1.2.1', criterios: 'Certificado de tradición libre de gravámenes y limitaciones.', fechaPrevista: '2025-05-23', fechaEntrega: '2025-05-23', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-05', entregable: 'Fiducia mercantil inmobiliaria y encargo fiduciario de preventas', paqueteEdt: '1.2.4', criterios: 'Contratos firmados con las condiciones de giro del punto de equilibrio.', fechaPrevista: '2025-06-13', fechaEntrega: '2025-06-13', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-06', entregable: 'Sala de ventas y apartamento modelo', paqueteEdt: '1.4.1', criterios: 'Abierta antes del lanzamiento de la etapa 1, con permisos y póliza.', fechaPrevista: '2025-07-04', fechaEntrega: '2025-07-04', estado: 'Aceptado', aceptadoPor: R.com },
        { id: 'ENT-07', entregable: 'Reparto de cargas aprobado y obligación VIP cumplida (78 VIP: 39 dentro del Macroproyecto de Borde y 39 trasladadas fuera de él; COP 3.000 millones en derechos fiduciarios del ISVIMED)', paqueteEdt: '1.2.3', criterios: 'Concepto favorable del DAP; certificados del ISVIMED (Acuerdo 48 de 2014, art. 326).', fechaPrevista: '2025-07-18', fechaEntrega: '2025-07-18', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-08', entregable: 'Proyecto arquitectónico, estudio geotécnico, diseño estructural con revisión independiente y diseños técnicos y bioclimático', paqueteEdt: '1.3.1 / 1.3.2 / 1.3.3', criterios: 'Cuadro de áreas dentro del índice; memorias firmadas con constancia de la revisión independiente; diseños coordinados sin interferencias críticas.', fechaPrevista: '2025-08-29', fechaEntrega: '2025-08-29', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-09', entregable: 'Estudio de movilidad (281 celdas) aprobado', paqueteEdt: '1.3.4', criterios: 'Concepto favorable de la Secretaría de Movilidad.', fechaPrevista: '2025-10-03', fechaEntrega: '2025-10-03', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-10', entregable: 'Licencia de urbanización y construcción ejecutoriada', paqueteEdt: '1.3.5', criterios: 'Resolución en firme conforme con la norma del polígono (acta AAE-01).', fechaPrevista: '2025-12-15', fechaEntrega: '2025-12-15', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-11', entregable: 'Diseños de redes de acueducto, alcantarillado, energía y gas aprobados por EPM', paqueteEdt: '1.3.4', criterios: 'Aprobación de EPM con tanque de almacenamiento y bombeo (INC-002).', fechaPrevista: '2026-01-23', fechaEntrega: '2026-01-23', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-12', entregable: 'Permisos de aprovechamiento forestal y de ocupación de cauce', paqueteEdt: '1.3.5', criterios: 'Resoluciones del Área Metropolitana del Valle de Aburrá en firme.', fechaPrevista: '2026-01-30', fechaEntrega: '2026-01-30', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-13', entregable: 'Crédito constructor de la etapa 1 aprobado (COP 30.000 millones)', paqueteEdt: '1.2.4', criterios: 'Carta de aprobación del banco con condiciones de desembolso por avance.', fechaPrevista: '2026-02-13', fechaEntrega: '2026-02-13', estado: 'Aceptado', aceptadoPor: R.jun },
        { id: 'ENT-14', entregable: 'Punto de equilibrio de la etapa 1 y giro de los recursos al patrimonio autónomo', paqueteEdt: '1.4.3', criterios: 'Certificación de la fiduciaria: 156 viviendas vinculadas, licencia ejecutoriada, lote libre de gravámenes y crédito aprobado.', fechaPrevista: '2026-03-06', fechaEntrega: '2026-03-06', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-15', entregable: 'Diseños de detalle y planos de taller de la etapa 1', paqueteEdt: '1.3.6', criterios: 'Aprobados para construcción por el director de obra y la supervisión técnica.', fechaPrevista: LB1, fechaEntrega: LB1, estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-16', entregable: 'Movimiento de tierras, contención (incluida la pantalla anclada del CC-003) y cimentación de la etapa 1', paqueteEdt: '1.5.1.1', criterios: 'Recibo topográfico, informe del geotecnista y ensayos de integridad de pilas conformes (acta AAE-02, con observaciones).', fechaPrevista: '2026-08-06', fechaEntrega: '2026-08-21', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-17', entregable: 'Estructura de la plataforma de parqueaderos de la etapa 1', paqueteEdt: '1.5.1.2', criterios: 'Liberación por nivel de la supervisión técnica; resistencia del concreto conforme con la NSR-10 (C.5.6) (acta AAE-03, con observaciones).', fechaPrevista: '2026-09-04', fechaEntrega: '2026-09-18', estado: 'Aceptado', aceptadoPor: R.ger },
        { id: 'ENT-18', entregable: 'Restauración y protección del retiro de la quebrada', paqueteEdt: '1.5.3.3', criterios: 'Revegetalización y obras de protección según el permiso ambiental; el Distrito la recibe con las cesiones.', fechaPrevista: '2026-09-25', fechaEntrega: '2026-09-26', estado: 'Verificado' },
        { id: 'ENT-19', entregable: 'Estructura del bloque A (8 pisos)', paqueteEdt: '1.5.1.2', criterios: 'Liberación por piso de la supervisión técnica. Avance al corte: piso 6 de 8 (75 %); pronóstico 27 de octubre de 2026.', fechaPrevista: '2026-10-02', estado: 'Pendiente' },
        { id: 'ENT-20', entregable: 'Estructura del bloque B (8 pisos)', paqueteEdt: '1.5.1.2', criterios: 'Liberación por piso de la supervisión técnica. Avance al corte: 36 % (piso 3); pronóstico 12 de diciembre de 2026.', fechaPrevista: '2026-11-13', estado: 'Pendiente' },
        { id: 'ENT-21', entregable: 'Diseños de detalle y planos de taller de la etapa 2', paqueteEdt: '1.3.6', criterios: 'Aprobados para construcción antes del acta de inicio de la etapa 2. Avance al corte: 51 %.', fechaPrevista: '2026-12-18', estado: 'Pendiente' },
        { id: 'ENT-22', entregable: 'Obras de mitigación vial: bahía de acceso, carril de desaceleración y semaforización', paqueteEdt: '1.5.3.1', criterios: 'Acta de recibo de la Secretaría de Movilidad antes de radicar el certificado técnico de ocupación de la etapa 1. Inicio el 5 de octubre de 2026.', fechaPrevista: '2027-01-29', estado: 'Pendiente' },
        { id: 'ENT-23', entregable: 'Punto de equilibrio de la etapa 2 y giro al patrimonio autónomo', paqueteEdt: '1.4.4', criterios: 'Certificación de la fiduciaria (156 de 208 viviendas). Al corte: 78; pronóstico 29 de abril de 2027.', fechaPrevista: '2027-01-29', estado: 'Pendiente' },
        { id: 'ENT-24', entregable: 'Certificado técnico de ocupación de la etapa 1', paqueteEdt: '1.5.1.6', criterios: 'Expedido por el supervisor técnico independiente y protocolizado (Ley 1796 de 2016). Pronóstico 19 de agosto de 2027.', fechaPrevista: '2027-07-28', estado: 'Pendiente' },
      ],
      procedimientoAceptacion: 'El responsable del paquete entrega con la evidencia del criterio de aceptación (ensayos, liberaciones, levantamientos, actos administrativos). El gerente verifica con la supervisión técnica independiente (obra) o con el responsable técnico (diseños y trámites) y firma el acta de aceptación de entregables (PRY-2025-003-AAE-##) con su resultado: aceptado, aceptado con observaciones o rechazado, y los pendientes con responsable y fecha. Los entregables regulatorios se aceptan con el acto en firme y los comerciales con la certificación de la fiduciaria. «Verificado» indica que pasó la verificación interna y espera el recibo de un tercero (Distrito, EPM o copropiedad). Las fechas previstas son las de la LB1.',
      responsableVerificacion: 'Gerente de proyecto, con el director de obra (constructor) y la supervisión técnica independiente en los entregables de obra',
    },
  };

  /* ------------------------------------------------------------ 4.3 Registro de incidentes */
  const registroIncidentes = {
    status: 'revision', rev: 'C', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.con },
    fields: {
      incidentes: [
        { id: 'INC-001', fecha: '2025-10-06', descripcion: 'Acta de observaciones de la curaduría: ajustes al cuadro de áreas, a la memoria estructural y al concepto de movilidad.', tipo: 'Técnico', prioridad: 'Alta', responsable: R.arq, fechaObjetivo: '2025-11-14', estado: 'Cerrado', solucion: 'Correcciones radicadas el 28 de noviembre; licencia ejecutoriada el 15 de diciembre de 2025 (dos semanas después de la LB0).' },
        { id: 'INC-002', fecha: '2025-11-24', descripcion: 'EPM pidió redimensionar la red de acueducto del proyecto por la presión disponible en el punto de conexión.', tipo: 'Técnico', prioridad: 'Media', responsable: R.arq, fechaObjetivo: '2025-12-12', estado: 'Cerrado', solucion: 'Diseño ajustado con tanque de almacenamiento y bombeo; aprobación de EPM el 23 de enero de 2026, sin efecto en el inicio de obra.' },
        { id: 'INC-003', fecha: '2026-02-02', descripcion: 'El punto de equilibrio de la etapa 1 no se alcanzó el 30 de enero de 2026: 136 de 156 viviendas.', tipo: 'Cliente y obra', prioridad: 'Alta', responsable: R.com, fechaObjetivo: '2026-02-27', estado: 'Cerrado', solucion: 'Feria de vivienda con Comfama y bancos hipotecarios; punto de equilibrio declarado el 27 de febrero de 2026; obra reprogramada con el CC-002.' },
        { id: 'INC-004', fecha: '2026-05-07', descripcion: 'Deslizamiento superficial del talud oriental de la etapa 1 tras las lluvias de abril y mayo (unos 600 m³).', tipo: 'Técnico', prioridad: 'Alta', responsable: R.con, fechaObjetivo: '2026-07-11', estado: 'Cerrado', solucion: 'Pantalla anclada de 60 m y drenajes (CC-003, COP 600 millones de la reserva para contingencias); inclinómetros con lectura diaria; movimiento de tierras terminado el 17 de julio de 2026.' },
        { id: 'INC-005', fecha: '2026-08-12', descripcion: "Cilindros de concreto del piso 3 del bloque A con 25,1 MPa a 28 días: por debajo de f'c = 28 MPa y del límite inferior de control del gráfico (27,7 MPa), aunque por encima del mínimo individual de 24,5 MPa (f'c − 3,5 MPa, NSR-10 C.5.6.3.3).", tipo: 'Calidad', prioridad: 'Alta', responsable: R.con, fechaObjetivo: '2026-09-11', estado: 'Resuelto', solucion: 'Por precaución, el ingeniero estructural pidió extraer núcleos: 29,4 MPa en promedio, conformes (NSR-10 C.5.6.5). Causa: cilindros curados al sol en obra; se instaló un cuarto de curado.' },
        { id: 'INC-006', fecha: '2026-07-20', descripcion: 'Rotación de oficiales de formaleta y de excavación por el alza del salario mínimo de 2026 y la demanda de otras obras: la estructura del bloque A avanza a 11 días por piso frente a 8,5 planificados.', tipo: 'Recursos', prioridad: 'Media', responsable: R.con, fechaObjetivo: '2026-10-30', estado: 'En curso', solucion: 'Bonificación por rendimiento por piso, segundo turno de formaleta en el bloque B y capacitación en el sistema industrializado.' },
        { id: 'INC-007', fecha: '2026-09-15', descripcion: 'Ventas de la etapa 2 a 11 viviendas al mes frente a 14 planificadas (78 vendidas al corte); el punto de equilibrio se pronostica para el 29 de abril de 2027.', tipo: 'Cliente y obra', prioridad: 'Alta', responsable: R.com, fechaObjetivo: '2026-12-15', estado: 'En curso', solucion: 'CC-004 aprobado el 25 de septiembre (lista +3 % y cuota inicial flexible a 24 meses); alianzas de preaprobación con bancos y Comfama.' },
        { id: 'INC-008', fecha: '2026-04-21', descripcion: 'Queja de la Junta de Acción Comunal por barro y polvo de las volquetas del movimiento de tierras en la vía de acceso al barrio.', tipo: 'Cliente y obra', prioridad: 'Media', responsable: R.ger, fechaObjetivo: '2026-05-05', estado: 'Cerrado', solucion: 'Lavallantas a la salida de la obra, barrido de la vía dos veces al día, volquetas de 7:00 a 17:00 por la ruta aprobada en el plan de manejo de tránsito y mesa vecinal mensual desde mayo; sin nuevas quejas formales.' },
        { id: 'INC-009', fecha: '2026-06-10', descripcion: 'Esperas de concreto premezclado en los vaciados de la plataforma y de las vigas de amarre por la demanda de otras obras (siete días de trabajo perdidos en junio y julio).', tipo: 'Logístico', prioridad: 'Media', responsable: R.con, fechaObjetivo: '2026-07-10', estado: 'Cerrado', solucion: 'Programación semanal confirmada con la concretera, vaciados en la mañana y planta de respaldo del mismo proveedor.' },
        { id: 'INC-010', fecha: '2026-08-28', descripcion: 'No conformidad de la supervisión técnica en la inspección previa al vaciado: recubrimientos de 12 y 15 mm en dos muros del piso 4 del bloque A (exigido ≥ 20 mm).', tipo: 'Calidad', prioridad: 'Alta', responsable: R.con, fechaObjetivo: '2026-08-29', estado: 'Cerrado', solucion: 'Panelas de separación instaladas y nueva inspección conforme antes de vaciar; verificación del 100 % de los paños antes de cerrar la formaleta. Causa: panelas de separación faltantes.' },
        { id: 'INC-011', fecha: '2026-09-18', descripcion: 'Fuga en la prueba hidrostática de la red de agua del piso 1 del bloque A (caída de presión en la primera hora).', tipo: 'Calidad', prioridad: 'Media', responsable: R.con, fechaObjetivo: '2026-09-25', estado: 'Resuelto', solucion: 'Unión mal soldada reemplazada; nueva prueba a 150 psi durante 2 horas sin caída de presión el 21 de septiembre.' },
      ],
      escalamiento: 'Prioridad alta: afecta un hito de control, la seguridad de las personas, la estabilidad de la obra, la licencia o la utilidad en más de COP 300 millones; se informa al gerente el mismo día y a la junta en la siguiente sesión (o en sesión extraordinaria si requiere una decisión de su nivel). Prioridad media: afecta la ruta crítica de un frente o el costo de un paquete; se trata en el comité de obra o de gerencia. Prioridad baja: se resuelve en el frente y se informa en el comité semanal. Un incidente que exige cambiar una línea base o usar la reserva para contingencias se convierte en solicitud de cambio.',
      revisionIncidentes: 'Semanal',
    },
  };

  /* ------------------------------------------------------------ 4.4 Registro de lecciones aprendidas */
  const registroLecciones = {
    status: 'revision', rev: 'B', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.com },
    fields: {
      lecciones: [
        { id: 'LA-01', fecha: '2025-12-15', area: 'Alcance', situacion: 'El concepto de movilidad llegó con obligaciones no previstas (bahía de acceso, carril de desaceleración y semaforización) que la licencia hizo exigibles; costaron COP 430 millones de la reserva para contingencias (CC-002).', impacto: 'Negativo', recomendacion: 'Pedir concepto previo de movilidad antes de radicar la licencia y reservar contingencia para obligaciones viales.', registradoPor: R.ger },
        { id: 'LA-02', fecha: '2026-02-27', area: 'Cronograma', situacion: 'El punto de equilibrio de la etapa 1 se alcanzó cuatro semanas tarde: diciembre tuvo ventas bajas (12 viviendas) y al 30 de enero faltaban 20 viviendas.', impacto: 'Negativo', recomendacion: 'No programar el punto de equilibrio en enero; reforzar el mercadeo en noviembre.', registradoPor: R.ger },
        { id: 'LA-03', fecha: '2026-05-19', area: 'Riesgos', situacion: 'Excavar la terraza oriental en temporada de lluvias produjo un deslizamiento de unos 600 m³, COP 600 millones de contención adicional (CC-003) y tres semanas de atraso.', impacto: 'Negativo', recomendacion: 'Programar las excavaciones en ladera fuera de temporada y tener los drenajes provisionales antes de abrir los cortes.', registradoPor: R.ger },
        { id: 'LA-04', fecha: '2026-07-15', area: 'Costos', situacion: 'Usar primero el aporte del promotor y los recaudos liberados retrasó los desembolsos del crédito constructor y redujo los intereses del primer tramo, aun con la tasa más alta.', impacto: 'Positivo', recomendacion: 'Mantener la regla de desembolsos justo a tiempo y la conciliación mensual del flujo con la fiduciaria.', registradoPor: R.ger },
        { id: 'LA-05', fecha: '2026-09-10', area: 'Calidad', situacion: "Cilindros curados al sol en obra dieron 25,1 MPa a 28 días (por debajo de f'c y fuera de control, aunque por encima del mínimo individual de 24,5 MPa) y llevaron a extraer núcleos por precaución (29,4 MPa, conformes) (INC-005).", impacto: 'Negativo', recomendacion: 'Cuarto de curado en obra desde el primer vaciado.', registradoPor: R.ger },
        { id: 'LA-06', fecha: '2025-08-01', area: 'Cronograma', situacion: 'La revisión independiente de los diseños estructurales se hizo en paralelo con el final del diseño (desde el 14 de julio) y permitió radicar la licencia en legal y debida forma el 4 de agosto, en la fecha planificada.', impacto: 'Positivo', recomendacion: 'Contratar al revisor independiente desde el anteproyecto estructural y revisar por entregas parciales.', registradoPor: R.ies },
        { id: 'LA-07', fecha: '2025-09-30', area: 'Alcance', situacion: 'Se propuso convertir 16 apartamentos tipo C del bloque B en tipo B para acelerar las ventas (CC-001); con la licencia en trámite habría costado unos dos meses y COP 1.180 millones de ventas. Se rechazó y se ajustó la estrategia de precios.', impacto: 'Positivo', recomendacion: 'Congelar la mezcla de producto antes de radicar la licencia y corregir la velocidad de ventas con precios y condiciones, no con el producto.', registradoPor: R.com },
        { id: 'LA-08', fecha: '2026-01-23', area: 'Interesados', situacion: 'EPM pidió redimensionar la red de acueducto por la presión disponible en el punto de conexión (INC-002); el ajuste con tanque y bombeo tomó dos meses, sin afectar el inicio de obra.', impacto: 'Negativo', recomendacion: 'Pedir la factibilidad de EPM con la presión disponible desde el anteproyecto y diseñar el almacenamiento desde el inicio.', registradoPor: R.arq },
        { id: 'LA-09', fecha: '2026-02-27', area: 'Interesados', situacion: 'La feria de vivienda con Comfama y bancos hipotecarios cerró 20 ventas en febrero y permitió declarar el punto de equilibrio de la etapa 1 (INC-003).', impacto: 'Positivo', recomendacion: 'Programar ferias con cajas de compensación y bancos un mes antes de cada fecha de punto de equilibrio, con compradores preaprobados.', registradoPor: R.com },
        { id: 'LA-10', fecha: '2026-09-15', area: 'Recursos', situacion: 'La rotación de oficiales de formaleta tras el alza del salario mínimo de 2026 llevó el bloque A a 11 días por piso frente a 8,5 planificados (INC-006).', impacto: 'Negativo', recomendacion: 'Contratar la mano de obra de estructura con bonificación por rendimiento desde el primer piso y tener dos cuadrillas entrenadas en el sistema industrializado antes de empezar los bloques.', registradoPor: R.con },
      ],
      momentosCaptura: 'Al cerrar cada fase (estructuración, licencias, punto de equilibrio de cada etapa, estructura, certificado técnico de ocupación y entregas), después de cada incidente de prioridad alta y de cada cambio aprobado, y en el comité de gerencia del primer martes de cada trimestre.',
      repositorioLecciones: 'Biblioteca de lecciones de proyectos del promotor (código PRY-2025-003-RLEC)',
      difusion: 'El gerente presenta las lecciones nuevas en el comité de gerencia y las incorpora de inmediato en la planificación de la etapa 2: excavación fuera de temporada (LA-03), cuarto de curado (LA-05), contratación de la mano de obra de estructura con bonificación (LA-10) y feria de vivienda antes del punto de equilibrio (LA-09). Al cierre se consolidan en el informe final y se envían a la gerencia general para el siguiente lote del promotor, en especial las de suelo de expansión (LA-01 y LA-08).',
    },
  };

  /* ------------------------------------------------------------ 4.5 Informes de desempeño del trabajo */
  const BAC1 = 139576 * M;
  const EV_ROWS = [
    { corte: '2026-03-31', pv: 26519106118, ev: 26513300000, ac: 26642105000 },
    { corte: '2026-04-30', pv: 28403861035, ev: 28241430000, ac: 28463854000 },
    { corte: '2026-05-31', pv: 31334610230, ev: 30802680000, ac: 31312692000 },
    { corte: '2026-06-30', pv: 35334737875, ev: 34334620000, ac: 35340079000 },
    { corte: '2026-07-31', pv: 39388289823, ev: 38550070000, ac: 39900272000 },
    { corte: '2026-08-31', pv: 43548425168, ev: 42228970000, ac: 43746658000 },
    { corte: '2026-09-30', pv: 48604248308, ev: 46668360000, ac: 48390020000 },
  ].map((r) => ({ ...r, bac: BAC1 }));
  const evRows = (prefix, from, to) => rows(prefix, EV_ROWS.filter((r) => r.corte >= from && r.corte <= to));
  const informesDesempeno = {
    instances: [
      {
        key: 'ej1', title: 'Informe de desempeño — agosto de 2026',
        status: 'aprobado', rev: '0', date: '2026-09-08',
        titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
        fields: {
          numeroInforme: 'Informe mensual No. 20 — agosto de 2026',
          periodoInicio: '2026-08-01',
          fechaCorte: '2026-08-31',
          destinatarios: 'Junta directiva del promotor; copia a la fiduciaria, al banco del crédito constructor y a la interventoría del banco y la fiduciaria',
          estadoGeneral: 'Amarillo — requiere atención',
          resumen: 'Al 31 de agosto de 2026 el valor ganado es de COP 42.229 millones (30,3 % del BAC de la LB1) frente a COP 43.548 millones planificados (31,2 %), con un costo real de COP 43.747 millones: SPI 0,97 y CPI 0,965. La cimentación de la etapa 1 terminó el 21 de agosto, dos semanas después de la LB1, por el deslizamiento del talud oriental de mayo (CC-003); la plataforma de parqueaderos va en su último nivel y la estructura del bloque A en el piso 4, a 11 días por piso frente a 8,5 planificados por la rotación de oficiales de formaleta (INC-006). La estructura del bloque B arrancó el 24 de agosto. Ventas acumuladas: 261 de 416 viviendas; la etapa 2 suma 68 y vende 11 al mes frente a 14 planificadas. El costo real de la obra supera el presupuesto por la mano de obra (salario mínimo de 2026 +23 %) y la contención del talud.',
          logros: [
            'Cimentación de la etapa 1 terminada el 21 de agosto y aceptada con observaciones (acta AAE-02 del 28 de agosto).',
            'Arranque de la estructura del bloque B el 24 de agosto, en la fecha de la LB1.',
            'Tercer desembolso del crédito constructor (COP 3.200 millones) el 31 de agosto; saldo de COP 9.200 millones.',
            '12 viviendas vendidas en el mes (3 de la etapa 1 y 9 de la etapa 2): 261 acumuladas.',
            'Lecturas de los inclinómetros del talud oriental estables, por debajo de la alerta de 10 mm.',
          ],
          avancePlanificado: 31.2,
          avanceReal: 30.3,
          hitos: rows('i1-hi', [
            { hito: 'Cimentación de la etapa 1', fechaBase: '2026-08-06', fechaPronostico: '2026-08-21', estado: 'Cumplido', comentario: 'Dos semanas tarde por el deslizamiento del talud oriental y la contención del CC-003.' },
            { hito: 'Estructura de la plataforma E1', fechaBase: '2026-09-04', fechaPronostico: '2026-09-18', estado: 'En riesgo', comentario: 'Último nivel en curso; esperas de concreto en junio y julio (INC-009).' },
            { hito: 'Fin de la estructura del bloque A', fechaBase: '2026-10-02', fechaPronostico: '2026-10-27', estado: 'Atrasado', comentario: 'Piso 4 en curso a 11 días por piso (INC-006).' },
            { hito: 'Fin de la estructura del bloque B', fechaBase: '2026-11-13', fechaPronostico: '2026-12-12', estado: 'En riesgo', comentario: 'Arrancó el 24 de agosto; se evalúa un segundo turno de formaleta.' },
            { hito: 'Punto de equilibrio de la etapa 2', fechaBase: '2027-01-29', fechaPronostico: '2027-01-29', estado: 'En riesgo', comentario: '68 de 156 viviendas a 11 ventas al mes; con ese ritmo el punto de equilibrio se correría unos tres meses.' },
            { hito: 'Certificado técnico de ocupación E1', fechaBase: '2027-07-28', fechaPronostico: '2027-08-19', estado: 'En riesgo', comentario: 'Arrastra el atraso de la estructura; holgura con las fechas de entrega de las promesas.' },
            { hito: 'Acta de cierre del proyecto', fechaBase: P.end, fechaPronostico: P.end, estado: 'En riesgo', comentario: 'Depende del punto de equilibrio de la etapa 2; se reevalúa con las ventas de septiembre.' },
          ]),
          valorGanado: evRows('i1-ev', '2026-03-31', '2026-08-31'),
          eacAdoptado: 144592300000,
          fechaFinPronosticada: P.end,
          analisisVariacion: 'SV = −COP 1.320 millones y CV = −COP 1.518 millones, concentrados en la obra de la etapa 1: el lote y la compensación VIP (COP 18.000 millones) están ejecutados al 100 % con CPI 1,0 y diluyen los índices globales. Cronograma: el movimiento de tierras terminó tres semanas tarde por el deslizamiento (INC-004) y la cimentación dos semanas tarde; la estructura del bloque A rinde 11 días por piso frente a 8,5. Costo: mano de obra entre 4 % y 8 % por encima del presupuesto por el salario mínimo de 2026 y la escasez de oficiales, y COP 600 millones de la contención del talud (CC-003), que no están en la LB1. EAC típico (BAC/CPI) de COP 144.592 millones y atípico de COP 141.094 millones; se adopta provisionalmente el típico mientras el constructor entrega el presupuesto actualizado con el ICOCED de junio de 2026 (mano de obra +14,06 % anual). Acciones: bonificación por rendimiento por piso y capacitación en el sistema industrializado; segundo turno de formaleta para el bloque B; cuarto de curado de cilindros; análisis comercial de la etapa 2 para la junta.',
          riesgosPrincipales: 'R-001 Menor velocidad de ventas de la etapa 2 (P 4 × I 4 = 16, en seguimiento): 10, 10 y 9 ventas en junio, julio y agosto; disparador activado (menos de 12 al mes durante dos meses). R-002 Alza de tasas (16): tasa de política monetaria en 12,0 % desde el 30 de junio y crédito constructor por encima del 16 % N.T.V. R-003 Costos de mano de obra y materiales (16). R-004 Lluvias y taludes (12, materializado en mayo; inclinómetros estables). R-013 Rotación de mano de obra calificada (9), registrado en julio con el INC-006. Contingencia disponible: COP 1.763 millones.',
          incidentesRelevantes: 'Abiertos: INC-005, cilindros del piso 3 del bloque A con 25,1 MPa a 28 días (alta; núcleos en laboratorio, objetivo 11 de septiembre) e INC-006, rotación de oficiales de formaleta (media; en curso). Cerrado en el periodo: INC-010, recubrimientos de 12 y 15 mm en dos muros del piso 4 del bloque A detectados por la supervisión técnica antes del vaciado y corregidos con panelas.',
          cambiosPeriodo: 'Sin solicitudes nuevas en agosto. Seguimiento del CC-003: pantalla anclada terminada el 11 de julio dentro de los COP 600 millones aprobados; la reserva para contingencias disponible es de COP 1.763 millones.',
          proximosPasos: rows('i1-pp', [
            { accion: 'Extraer y ensayar núcleos del piso 3 del bloque A y decidir con el ingeniero estructural (INC-005).', responsable: R.con, fecha: '2026-09-11' },
            { accion: 'Instalar el cuarto de curado de cilindros en obra.', responsable: R.con, fecha: '2026-09-05' },
            { accion: 'Terminar la estructura de la plataforma de parqueaderos de la etapa 1.', responsable: R.con, fecha: '2026-09-18' },
            { accion: 'Presentar el análisis de la velocidad de ventas de la etapa 2 con propuesta de precios y condiciones.', responsable: R.com, fecha: '2026-09-21' },
            { accion: 'Entregar el presupuesto de obra actualizado con el ICOCED de junio y el pronóstico ascendente del costo.', responsable: R.con, fecha: '2026-09-25' },
          ]),
          decisionesRequeridas: [
            'Tomar nota del EAC típico de COP 144.592 millones (VAC de −COP 5.016 millones frente al BAC de la LB1) y de su efecto en el margen.',
            'Autorizar al gerente comercial a presentar una solicitud de cambio de precios y condiciones de la etapa 2 si en septiembre las ventas siguen por debajo de 12 al mes.',
          ],
        },
      },
      {
        key: 'ej2', title: 'Informe de desempeño — septiembre de 2026',
        status: 'revision', rev: 'A', date: CUT,
        titleBlock: { elaboro: R.ger, reviso: R.est },
        fields: {
          numeroInforme: 'Informe mensual No. 21 — septiembre de 2026',
          periodoInicio: '2026-09-01',
          fechaCorte: CUT,
          destinatarios: 'Junta directiva del promotor (sesión del 13 de octubre de 2026); copia a la fiduciaria, al banco del crédito constructor y a la interventoría del banco y la fiduciaria',
          estadoGeneral: 'Rojo — requiere acción inmediata',
          resumen: 'Al 30 de septiembre de 2026 el valor ganado es de COP 46.668 millones (33,4 % del BAC de la LB1, COP 139.576 millones) frente a COP 48.604 millones planificados (34,8 %), con un costo real de COP 48.390 millones: SPI 0,96 y CPI 0,964. Los índices globales se diluyen porque el lote y la compensación VIP (COP 18.000 millones) están ejecutados al 100 %; en los costos directos de la etapa 1 el avance es de 39,5 % frente a 43,2 % planificado (SPI 0,914) y el CPI es de 0,921. La plataforma de parqueaderos de la etapa 1 terminó el 18 de septiembre; la estructura del bloque A va en el piso 6 de 8 (75 %) y la del bloque B en el piso 3 (36 %). Ventas: 274 de 416 viviendas (65,9 %) por COP 100.894 millones; la etapa 1 tiene 196 de 208 y la etapa 2, 78 de 208, a 11 ventas al mes frente a 14 planificadas. Por eso el punto de equilibrio de la etapa 2 se pronostica para el 29 de abril de 2027 (LB1: 29 de enero) y el cierre para el 29 de junio de 2029 (LB1: 28 de marzo). Con ventas pronosticadas iguales a las de la línea base (COP 162.122 millones), la utilidad pronosticada baja a COP 14.057 millones (8,67 % de las ventas) frente a COP 20.183 millones (12,45 %) de la línea base: está por debajo del umbral rojo de 10 % del plan de gestión de los costos y se presenta a la junta un plan de recuperación del margen.',
          logros: [
            'Estructura de la plataforma de parqueaderos de la etapa 1 terminada el 18 de septiembre y aceptada con observaciones (acta AAE-03 del 25 de septiembre).',
            'Restauración y protección del retiro de la quebrada terminada el 26 de septiembre.',
            'Cuarto desembolso del crédito constructor (COP 3.200 millones) el 30 de septiembre; saldo de COP 12.400 millones e intereses causados de COP 241,8 millones.',
            '13 viviendas vendidas en el mes (3 de la etapa 1 y 10 de la etapa 2): 274 acumuladas por COP 100.894 millones.',
            'CC-004 aprobado el 25 de septiembre: lista de la etapa 2 +3 % desde el 1 de octubre y cuota inicial flexible a 24 meses con preaprobación bancaria.',
            'INC-005 resuelto: núcleos del piso 3 del bloque A con 29,4 MPa en promedio, conformes (NSR-10 C.5.6.5); cuarto de curado en funcionamiento.',
          ],
          avancePlanificado: 34.8,
          avanceReal: 33.4,
          hitos: rows('i2-hi', [
            { hito: 'Punto de equilibrio de la etapa 1', fechaBase: '2026-02-27', fechaPronostico: '2026-02-27', estado: 'Cumplido', comentario: 'LB0: 30 de enero; reprogramado con el CC-002.' },
            { hito: 'Acta de inicio de obra de la etapa 1', fechaBase: '2026-03-16', fechaPronostico: '2026-03-16', estado: 'Cumplido', comentario: 'En la fecha de la LB1.' },
            { hito: 'Fin de la estructura del bloque A', fechaBase: '2026-10-02', fechaPronostico: '2026-10-27', estado: 'Atrasado', comentario: 'Piso 6 de 8; 11 días por piso frente a 8,5 (INC-006).' },
            { hito: 'Fin de la estructura del bloque B', fechaBase: '2026-11-13', fechaPronostico: '2026-12-12', estado: 'En riesgo', comentario: 'Piso 3 (36 %); segundo turno de formaleta desde octubre.' },
            { hito: 'Crédito constructor de la etapa 2', fechaBase: '2027-01-15', fechaPronostico: '2027-04-20', estado: 'En riesgo', comentario: 'El trámite empieza con el 60 % de preventas de la etapa 2.' },
            { hito: 'Punto de equilibrio de la etapa 2', fechaBase: '2027-01-29', fechaPronostico: '2027-04-29', estado: 'En riesgo', comentario: '78 de 156 viviendas a 11 ventas al mes (INC-007).' },
            { hito: 'Acta de inicio de obra de la etapa 2', fechaBase: '2027-02-15', fechaPronostico: '2027-05-18', estado: 'En riesgo', comentario: 'Sigue al punto de equilibrio y al giro de la etapa 2.' },
            { hito: 'Certificado técnico de ocupación E1', fechaBase: '2027-07-28', fechaPronostico: '2027-08-19', estado: 'En riesgo', comentario: 'Arrastra el atraso de la estructura; las promesas de la etapa 1 tienen holgura para entregar.' },
            { hito: 'Certificado técnico de ocupación E2', fechaBase: '2028-07-14', fechaPronostico: '2028-10-12', estado: 'En riesgo', comentario: 'Tres meses de corrimiento por las preventas de la etapa 2.' },
            { hito: 'Acta de cierre del proyecto', fechaBase: P.end, fechaPronostico: '2029-06-29', estado: 'En riesgo', comentario: 'Ruta crítica pronosticada: preventas de la etapa 2 → obra de la etapa 2 → certificado técnico de ocupación → entregas → cesiones → cierre.' },
          ]),
          valorGanado: evRows('i2-ev', '2026-04-30', CUT),
          eacAdoptado: 148065 * M,
          fechaFinPronosticada: '2029-06-29',
          analisisVariacion: 'SV = −COP 1.936 millones y CV = −COP 1.722 millones. Cronograma: la obra de la etapa 1 arrastra las tres semanas del deslizamiento (INC-004, CC-003) y la estructura rinde 11 días por piso frente a 8,5 (INC-006); SPI(t) 0,981. Costo: la mano de obra cuesta entre 4 % y 8 % más que el presupuesto (salario mínimo de 2026 +23 %; ICOCED de mano de obra +14,06 % anual) y la contención del CC-003 (COP 600 millones) no está en la LB1. EAC por fórmula: típica (BAC/CPI) COP 144.725 millones, atípica COP 141.298 millones y compuesta (CPI × SPI) COP 148.721 millones. Se adopta la EAC del gerente de COP 148.065 millones: pronóstico ascendente de COP 145.702 millones (lote y VIP COP 18.000 millones, directos COP 98.890 millones, indirectos COP 20.154 millones y financieros COP 8.658 millones por la tasa de 16,5 % N.T.V. y la etapa 2 tres meses más tarde) más una provisión de COP 2.363 millones igual al valor monetario esperado de las amenazas abiertas. Frente a la línea base de costos (COP 141.939 millones) la variación es de −COP 6.126 millones. Las ventas pronosticadas se mantienen en COP 162.122 millones: el alza de 3 % de la lista de la etapa 2 (CC-004) rige desde el 1 de octubre y no se incluye hasta verificar la absorción, porque el índice de precios de vivienda nueva de Medellín en estratos bajos baja 1,92 % anual (DANE, II trimestre de 2026) y la etapa 2 vende 11 al mes; sobre las 130 viviendas por vender (68 tipo B y 62 tipo C, COP 53.448 millones a precios de la línea base) el alza valdría hasta COP 1.603 millones (oportunidad R-014). Así, la utilidad pronosticada es de COP 14.057 millones (8,67 % de las ventas): baja COP 6.126 millones, lo mismo que sube el costo. Acciones: segundo turno de formaleta y bonificación por rendimiento; ingeniería de valor en acabados de la etapa 2; desembolsos justo a tiempo; CC-004 y alianzas de preaprobación para llevar la etapa 2 a 14 ventas al mes; CC-005 para reponer la contingencia.',
          riesgosPrincipales: 'R-001 Menor velocidad de ventas de la etapa 2 (16, en seguimiento; disparador activado: menos de 12 ventas al mes durante dos meses). R-002 Alza de tasas (16; IBR 3M por encima de 12 %, disparador activado). R-003 Costos de mano de obra y materiales (16). R-004 Lluvias y taludes (12, materializado en mayo; la excavación de la etapa 2 se programa fuera de temporada). R-013 Rotación de mano de obra calificada (9). Oportunidad R-014: mejor precio de venta de la etapa 2 con la lista del CC-004 (hasta COP 1.603 millones sobre las 130 viviendas por vender), no incluida en el pronóstico. Valor monetario esperado de las amenazas abiertas: COP 2.363 millones frente a COP 1.763 millones de reserva para contingencias disponible.',
          incidentesRelevantes: 'Abiertos: INC-006, rotación de oficiales de formaleta (media; en curso, objetivo 30 de octubre) e INC-007, ventas de la etapa 2 (alta; en curso, objetivo 15 de diciembre). Resueltos en el periodo: INC-005 (núcleos con 29,4 MPa en promedio, conformes) e INC-011 (fuga en la prueba hidrostática del piso 1 del bloque A por una unión mal soldada, rehecha y probada de nuevo el 21 de septiembre).',
          cambiosPeriodo: 'CC-004 aprobado por la junta el 25 de septiembre: lista de precios de la etapa 2 +3 % desde el 1 de octubre y cuota inicial flexible a 24 meses con preaprobación bancaria; sin efecto en alcance, plazo ni costo. El pronóstico de ventas no incluye el alza hasta verificar la absorción con la nueva lista (hasta COP 1.603 millones sobre las 130 viviendas por vender). CC-005 registrado el 28 de septiembre: trasladar COP 600 millones de la reserva de gestión a la reserva para contingencias; en análisis para la sesión del 13 de octubre.',
          proximosPasos: rows('i2-pp', [
            { accion: 'Aplicar la lista de la etapa 2 con +3 % y la cuota inicial flexible a 24 meses (CC-004).', responsable: R.com, fecha: '2026-10-01' },
            { accion: 'Iniciar el segundo turno de formaleta en el bloque B y la bonificación por rendimiento por piso (INC-006).', responsable: R.con, fecha: '2026-10-05' },
            { accion: 'Iniciar las obras de mitigación vial (U02) con el contratista de urbanismo.', responsable: R.con, fecha: '2026-10-05' },
            { accion: 'Presentar a la junta el informe de septiembre y el CC-005.', responsable: R.ger, fecha: '2026-10-13' },
            { accion: 'Entregar el informe final del geotecnista con 60 días de lecturas de inclinómetros (pendiente del acta AAE-02).', responsable: R.con, fecha: '2026-10-15' },
            { accion: 'Quinto desembolso del crédito constructor contra el acta de avance de octubre.', responsable: R.est, fecha: '2026-10-31' },
            { accion: 'Feria de vivienda con Comfama y bancos hipotecarios para compradores preaprobados de la etapa 2.', responsable: R.com, fecha: '2026-11-14' },
            { accion: 'Presentar la ingeniería de valor en acabados de la etapa 2 con su efecto en el costo directo (R-003).', responsable: R.con, fecha: '2026-11-30' },
            { accion: 'Medir la absorción de la etapa 2 con la nueva lista y la cuota inicial flexible y recomendar a la junta mantener o revertir el alza del CC-004.', responsable: R.com, fecha: '2026-11-30' },
          ]),
          decisionesRequeridas: [
            'Aprobar el CC-005: trasladar COP 600 millones de la reserva de gestión a la reserva para contingencias.',
            'Tomar nota del pronóstico de utilidad de COP 14.057 millones (8,67 % de las ventas, por debajo del umbral rojo de 10 %) y aprobar el plan de recuperación del margen: ingeniería de valor en la etapa 2 (propuesta el 30 de noviembre), control de descuentos y negociación de la tasa del crédito constructor de la etapa 2.',
            'Decidir en la sesión de diciembre si se mantiene el alza de 3 % de la lista de la etapa 2 (CC-004) según la absorción de octubre y noviembre (meta: al menos 12 ventas al mes).',
            'Autorizar el inicio del trámite del crédito constructor de la etapa 2 al alcanzar el 60 % de preventas (125 viviendas).',
          ],
        },
      },
    ],
  };

  /* ------------------------------------------------------------ 4.6 Solicitudes de cambio */
  const solicitudesCambio = {
    instances: [
      {
        key: 'ej1', title: 'Solicitud de cambio CC-002 — Mitigación vial y reprogramación de la etapa 1',
        status: 'aprobado', rev: '0', date: '2026-03-10',
        titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
        fields: {
          codigoCambio: 'CC-002',
          fechaSolicitud: '2026-01-19',
          solicitante: R.ger,
          tipoCambio: 'Actualización',
          prioridadCambio: 'Alta',
          elementosAfectados: [
            'Enunciado del alcance (PRY-2025-003-EALC) y EDT: nueva actividad U02 en el paquete 1.5.3.1.',
            'Cronograma maestro y línea base del cronograma (LB0 → LB1).',
            'Presupuesto y línea base de costos: +COP 430 millones en urbanismo con cargo a la reserva para contingencias.',
            'Documentación de requisitos y matriz de trazabilidad (nuevo requisito RQ-09).',
            'Planes de gestión del alcance y del cronograma y estimaciones de duración (programa de obra del constructor).',
            'Registro de riesgos: R-005 materializado y cerrado.',
            'Presupuesto y flujo de caja validados por la fiduciaria y el banco.',
          ],
          descripcionCambio: '(1) Incorporar al alcance las obras de mitigación vial exigidas por la licencia ejecutoriada el 15 de diciembre de 2025, según el concepto de la Secretaría de Movilidad sobre el estudio de movilidad de 281 celdas: bahía de acceso, carril de desaceleración y semaforización sobre la vía colectora (actividad U02, COP 430 millones, del 5 de octubre de 2026 al 29 de enero de 2027). (2) Reprogramar el acta de inicio de obra de la etapa 1 del 16 de febrero al 16 de marzo de 2026, y con ella las actividades de obra que dependen del inicio, con el programa de obra del constructor contratado por administración delegada. (3) Establecer la línea base LB1 de alcance, cronograma y costos.',
          justificacion: 'La licencia quedó ejecutoriada dos semanas después de lo previsto (INC-001) y el punto de equilibrio de la etapa 1 no se cumplió el 30 de enero (136 de 156 viviendas, INC-003): se declaró el 27 de febrero y el crédito constructor se aprobó el 13 de febrero. Sin punto de equilibrio no hay giro de la fiduciaria al patrimonio autónomo, por lo que el inicio de obra del 16 de febrero no era viable; la LB0 ya no sirve para medir el desempeño de la obra. La mitigación vial es una obligación de la licencia: sin ella la Secretaría de Movilidad no recibe las obras y no se puede ocupar la etapa 1.',
          consecuenciaNoHacer: 'El desempeño de la obra se mediría contra una fecha de inicio imposible (SPI artificialmente bajo durante toda la etapa 1) y la mitigación vial quedaría sin presupuesto ni programa, con riesgo de no obtener el recibo de Movilidad antes del certificado técnico de ocupación de la etapa 1.',
          impactoAlcance: 'Trabajo nuevo en el paquete 1.5.3.1 Vías públicas y mitigación vial (actividad U02). El producto no cambia: 416 viviendas con las mismas áreas y especificaciones.',
          diasCronograma: 24,
          impactoCronograma: 'Cuatro semanas (28 días calendario; 24 días hábiles en el calendario de lunes a sábado) en toda la cadena de la etapa 1: fin de la estructura del bloque A del 4 de septiembre al 2 de octubre de 2026; certificado técnico de ocupación de la etapa 1 del 30 de junio al 28 de julio de 2027; entregas de la etapa 1 del 29 de julio al 28 de octubre de 2027. La etapa 2 depende de su propio punto de equilibrio (29 de enero de 2027) y no cambia, como tampoco el fin del proyecto (28 de marzo de 2029).',
          valorCosto: 430 * M,
          impactoCosto: 'Costos directos de la LB1: COP 94.510 millones (+COP 430 millones en el capítulo de urbanismo, que pasa de COP 10.693 a 11.123 millones). El BAC pasa de COP 139.146 a 139.576 millones y la reserva para contingencias de COP 2.793 a 2.363 millones; la línea base de costos (COP 141.939 millones) y el presupuesto del proyecto (COP 143.339 millones) no cambian. Los costos financieros de la línea base se mantienen en COP 7.004 millones porque los desembolsos también se corren. La utilidad de la línea base no cambia (COP 20.183 millones; 12,45 %).',
          impactoCalidad: 'Ninguno sobre las especificaciones del producto. La mitigación vial se construye con los diseños aprobados por la Secretaría de Movilidad y se recibe con acta de esa secretaría y de la Secretaría de Infraestructura Física.',
          impactoRiesgos: 'R-005 (exigencias de EPM, Movilidad o la curaduría) se materializa y se cierra con este cambio. La excavación de la etapa 1 queda más expuesta a la temporada de lluvias de abril y mayo: se refuerza la respuesta de R-004 (drenajes provisionales e inclinómetros). La reserva para contingencias queda en COP 2.363 millones, igual al valor monetario esperado de las amenazas abiertas.',
          impactoOtros: 'Fiduciaria y banco: actualizar el presupuesto y el flujo de caja validados para el giro y los desembolsos (no objeción antes de establecer la LB1). Compradores: las fechas de entrega de las promesas de la etapa 1 siguen dentro del plazo pactado; no se requiere otrosí.',
          alternativas: rows('s2-al', [
            { alternativa: 'Reprogramar e incorporar la mitigación con cargo a la contingencia (LB1)', descripcion: 'Nueva línea base con el inicio de obra real y la mitigación vial presupuestada y programada.', costo: 430 * M, dias: 24, recomendada: true },
            { alternativa: 'Mantener la LB0 y medir el atraso como variación', descripcion: 'No refleja una condición contractual (el inicio depende del giro de la fiduciaria) y deja el SPI distorsionado durante toda la etapa 1; la mitigación se pagaría igual.', costo: 430 * M, dias: 24, recomendada: false },
            { alternativa: 'Acelerar la etapa 1 para recuperar las cuatro semanas', descripcion: 'Segundo juego de formaleta y turnos dobles desde la cimentación para recuperar unas tres semanas antes de las entregas.', costo: 1680 * M, dias: 6, recomendada: false },
          ]),
          decision: 'Aprobada',
          fechaDecision: '2026-03-10',
          decisor: R.jun,
          nivelAutoridad: 'Nivel 3',
          condiciones: 'Aprobada en la sesión ordinaria del 10 de marzo de 2026. Condiciones: (1) no objeción de la fiduciaria y del banco al presupuesto y al flujo de caja actualizados; (2) LB1 establecida a más tardar el 13 de marzo; (3) la mitigación vial se contrata por precios unitarios dentro del contrato de urbanismo y se termina antes de radicar el certificado técnico de ocupación de la etapa 1. Se descarta la aceleración: cuesta más que su beneficio, porque la etapa 1 tiene holgura frente a las entregas pactadas y la fecha de fin no cambia.',
          lineasBaseAfectadas: ['Alcance (LB1)', 'Cronograma (LB1)', 'Costos (LB1)'],
          implementacion: '13 de marzo de 2026: LB1 en el Gestor (alcance, cronograma y costos) y emisión de las revisiones 1 del enunciado del alcance, del plan para la dirección, de los planes del alcance, del cronograma, de los costos y de los riesgos, de la documentación de requisitos y de la matriz de trazabilidad. 16 de marzo de 2026: acta de inicio de obra de la etapa 1. 5 de octubre de 2026: inicio de la mitigación vial. Seguimiento en el informe mensual de desempeño.',
        },
      },
      {
        key: 'ej2', title: 'Solicitud de cambio CC-003 — Contención adicional del talud oriental',
        status: 'aprobado', rev: '0', date: '2026-05-19',
        titleBlock: { elaboro: R.con, reviso: R.ger, aprobo: R.jun },
        fields: {
          codigoCambio: 'CC-003',
          fechaSolicitud: '2026-05-12',
          solicitante: R.con,
          tipoCambio: 'Acción correctiva',
          prioridadCambio: 'Alta',
          elementosAfectados: [
            'Cronograma vigente: nueva actividad K03C en el paquete 1.5.1.1 (sin nueva línea base).',
            'Presupuesto vigente: +COP 600 millones con cargo a la reserva para contingencias.',
            'Planos de contención y drenaje del talud oriental (diseño del geotecnista del proyecto).',
            'Registro de riesgos (R-004 materializado) y registro de incidentes (INC-004).',
            'Contrato a precio global con ' + EMP.geo + '.',
          ],
          descripcionCambio: 'Construir una pantalla anclada de 60 m de longitud con drenajes subhorizontales y cunetas de coronación en el talud oriental de la terraza de la etapa 1, según el diseño del geotecnista del proyecto, después del deslizamiento superficial del 7 de mayo de 2026 (unos 600 m³) ocurrido tras las lluvias de abril y mayo. Instalar inclinómetros con lectura diaria durante las lluvias (alerta con más de 10 mm y alarma con más de 25 mm de desplazamiento acumulado).',
          justificacion: 'El deslizamiento dejó un corte que no cumple los factores de seguridad exigidos por el título H de la NSR-10 para la condición con lluvia, según el concepto del geotecnista del 11 de mayo. Sin contención no se puede continuar la excavación ni construir las pilas del costado oriental de la plataforma, y el talud amenaza el frente de trabajo y la vía de acceso.',
          consecuenciaNoHacer: 'Riesgo de nuevos deslizamientos sobre la excavación y la vía de acceso, con exposición del personal; suspensión de la obra en el costado oriental; la supervisión técnica independiente no liberaría la cimentación de ese costado.',
          impactoAlcance: 'Obra adicional de contención en el paquete 1.5.1.1 (actividad K03C). El producto no cambia.',
          diasCronograma: 17,
          impactoCronograma: 'Tres semanas (21 días calendario; 17 días hábiles) de atraso en el movimiento de tierras de la etapa 1, que se pronostica terminar el 17 de julio de 2026 en lugar del 26 de junio; la pantalla se ejecuta del 19 de mayo al 11 de julio. El atraso se traslada a la cimentación y a la estructura de la etapa 1; la etapa 1 no es ruta crítica del proyecto y la fecha de fin no cambia por este cambio.',
          valorCosto: 600 * M,
          impactoCosto: 'COP 600 millones a precio global con cargo a la reserva para contingencias, que pasa de COP 2.363 a 1.763 millones. El presupuesto vigente de las actividades sube de COP 139.576 a 140.176 millones; la línea base de costos (COP 141.939 millones) no cambia. No se establece una nueva línea base: el desempeño se sigue midiendo contra la LB1 y el costo de la contención aparece como variación de costo en la obra de la etapa 1.',
          impactoCalidad: 'Mejora la estabilidad del talud. Los anclajes se ensayan a tensión (prueba de aceptación del 100 %) y la supervisión técnica independiente libera la pantalla antes de reanudar la excavación junto al talud.',
          impactoRiesgos: 'R-004 (lluvias e inestabilidad de taludes) se materializa; se refuerza su respuesta: inclinómetros, drenajes provisionales antes de abrir cortes y excavación de la etapa 2 fuera de temporada. La reserva para contingencias disponible (COP 1.763 millones) queda por debajo del valor monetario esperado de las amenazas abiertas (COP 2.363 millones); se vigila en el informe mensual.',
          impactoOtros: 'SST: plan de manejo del frente de excavación con monitoreo del talud y evacuación ante alarma. Interventoría del banco: informe extraordinario del evento para el comité fiduciario.',
          alternativas: rows('s3-al', [
            { alternativa: 'Pantalla anclada de 60 m con drenajes', descripcion: 'Diseño del geotecnista; se ejecuta sin cambiar la implantación de la plataforma.', costo: 600 * M, dias: 17, recomendada: true },
            { alternativa: 'Reperfilar el talud a 1H:1V y revegetalizar', descripcion: 'Exige unos 4.500 m³ adicionales de corte, invade la franja de protección del retiro de la quebrada y reduce la plataforma; requeriría modificar la licencia.', costo: 380 * M, dias: 30, recomendada: false },
            { alternativa: 'Muro de contención de concreto reforzado', descripcion: 'Mayor volumen de excavación y concreto, y más plazo por el curado antes de rellenar.', costo: 820 * M, dias: 30, recomendada: false },
          ]),
          decision: 'Aprobada',
          fechaDecision: '2026-05-19',
          decisor: R.jun,
          nivelAutoridad: 'Nivel 2',
          condiciones: 'Aprobada en sesión extraordinaria del 19 de mayo de 2026 con cargo a la reserva para contingencias y sin nueva línea base. Condiciones: diseño firmado por el geotecnista y revisado por el ingeniero estructural; contrato a precio global con pólizas de cumplimiento y de estabilidad; lectura diaria de inclinómetros hasta el fin de la temporada de lluvias; lección aprendida registrada.',
          lineasBaseAfectadas: ['Ninguna: la LB1 se mantiene; se actualizan el cronograma y el presupuesto vigentes.'],
          implementacion: 'Contrato a precio global firmado el 19 de mayo con ' + EMP.geo + '; ejecución prevista del 19 de mayo al 11 de julio de 2026; inclinómetros instalados antes de reanudar la excavación; seguimiento semanal en el comité de obra y mensual en el informe de desempeño.',
        },
      },
      {
        key: 'ej3', title: 'Solicitud de cambio CC-005 — Reposición de la reserva para contingencias',
        status: 'revision', rev: 'A', date: '2026-09-28',
        titleBlock: { elaboro: R.ger, reviso: R.est },
        fields: {
          codigoCambio: 'CC-005',
          fechaSolicitud: '2026-09-28',
          solicitante: R.ger,
          tipoCambio: 'Acción preventiva',
          prioridadCambio: 'Alta',
          elementosAfectados: [
            'Reserva para contingencias y reserva de gestión (plan de gestión de los costos).',
            'Línea base de costos (+COP 600 millones de contingencia).',
            'Registro de riesgos y análisis cuantitativo (valor monetario esperado de las amenazas abiertas).',
            'Presupuesto validado por la fiduciaria y el banco.',
          ],
          descripcionCambio: 'Trasladar COP 600 millones de la reserva de gestión (COP 1.400 millones) a la reserva para contingencias (COP 1.763 millones disponibles) para cubrir el valor monetario esperado de las amenazas abiertas, que suma COP 2.363 millones: R-001 (COP 480 millones), R-002 (420), R-003 (543), R-004 (320), R-006 (140), R-013 (160), R-009 (80), R-010 (60), R-011 (60), R-008 (50), R-007 (30) y R-012 (20).',
          justificacion: 'La contención del talud (CC-003) consumió COP 600 millones de la contingencia. La reevaluación de riesgos de septiembre mantiene el valor monetario esperado de las amenazas abiertas en COP 2.363 millones, concentrado en la etapa 2 (ventas, tasas y costos), frente a COP 1.763 millones disponibles. Con la utilidad pronosticada en 8,67 % de las ventas, una amenaza materializada sin reserva obligaría a decisiones de la junta caso a caso y a demoras en la obra.',
          consecuenciaNoHacer: 'Si las amenazas que se materialicen superan COP 1.763 millones, el gerente no tendrá reserva dentro de su autoridad y cada respuesta requerirá una decisión de la junta; la junta perdería visibilidad del riesgo residual en el pronóstico.',
          impactoAlcance: 'Ninguno.',
          diasCronograma: 0,
          impactoCronograma: 'Ninguno.',
          valorCosto: 600 * M,
          impactoCosto: 'La reserva para contingencias pasa de COP 1.763 a 2.363 millones y la reserva de gestión de COP 1.400 a 800 millones; la línea base de costos pasa de COP 141.939 a 142.539 millones y el presupuesto del proyecto (COP 143.339 millones) no cambia. El pronóstico de utilidad (COP 14.057 millones) ya incluye la provisión de COP 2.363 millones, por lo que no cambia.',
          impactoCalidad: 'Ninguno.',
          impactoRiesgos: 'La reserva para contingencias vuelve a cubrir el valor monetario esperado de las amenazas abiertas. La reserva de gestión queda en COP 800 millones (0,57 % del presupuesto vigente de las actividades) para riesgos no identificados.',
          impactoOtros: 'Requiere la no objeción del banco y la fiduciaria porque modifica el presupuesto validado.',
          alternativas: rows('s5-al', [
            { alternativa: 'Reponer COP 600 millones desde la reserva de gestión', descripcion: 'La contingencia cubre el valor monetario esperado de las amenazas abiertas sin aumentar el presupuesto del proyecto.', costo: 600 * M, dias: 0, recomendada: true },
            { alternativa: 'Mantener la contingencia en COP 1.763 millones', descripcion: 'Aceptar un riesgo residual de COP 600 millones sin reserva; cada amenaza materializada se lleva a la junta.', costo: 0, dias: 0, recomendada: false },
            { alternativa: 'Reponer la contingencia con un aporte adicional del promotor', descripcion: 'Aumenta la exposición de capital del promotor por encima de COP 24.000 millones y el presupuesto del proyecto.', costo: 600 * M, dias: 0, recomendada: false },
          ]),
          decision: 'En análisis',
          decisor: 'Junta directiva del promotor (sesión del 13 de octubre de 2026)',
          nivelAutoridad: 'Nivel 3',
          condiciones: 'Se presenta en la sesión ordinaria del 13 de octubre de 2026 con el informe de desempeño de septiembre; se pidió la no objeción preliminar de la fiduciaria y el banco.',
          lineasBaseAfectadas: ['Costos (línea base de costos: +COP 600 millones de reserva para contingencias)'],
          implementacion: 'Si se aprueba: actualizar las reservas en la herramienta de costos (contingencia COP 2.363 millones; gestión COP 800 millones), emitir la revisión del plan de gestión de los costos, informar a la fiduciaria y al banco y reflejarlo en el informe de octubre.',
        },
      },
    ],
  };

  /* ------------------------------------------------------------ 4.6 Registro de cambios */
  const registroCambios = {
    status: 'revision', rev: 'C', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.est },
    fields: {
      cambios: [
        { id: 'CC-001', fecha: '2025-09-15', solicitante: R.com, descripcion: 'Convertir 16 apartamentos tipo C del bloque B en tipo B para acelerar las ventas de la etapa 1.', tipo: 'Actualización', impactoAlcance: 'Cambio de la mezcla y del cuadro de áreas radicado en la curaduría; habría obligado a modificar la licencia en trámite (unos dos meses) y bajaba las ventas en COP 1.180 millones.', impactoCronograma: 40, impactoCosto: 0, estado: 'Rechazada', fechaDecision: '2025-09-30', decisor: R.jun },
        { id: 'CC-002', fecha: '2026-01-19', solicitante: R.ger, descripcion: 'Incorporar las obras de mitigación vial exigidas en la licencia (bahía de acceso, carril de desaceleración y semaforización) con cargo a la reserva para contingencias y reprogramar el inicio de obra de la etapa 1 al 16 de marzo de 2026 con el programa del constructor.', tipo: 'Actualización', impactoAlcance: 'Nuevo trabajo en 1.5.3.1 Vías públicas y mitigación vial (U02). LB1 del 13 de marzo de 2026 (alcance, cronograma y costos); la etapa 1 se corre cuatro semanas y el fin del proyecto no cambia.', impactoCronograma: 24, impactoCosto: 430 * M, estado: 'Aprobada', fechaDecision: '2026-03-10', decisor: R.jun },
        { id: 'CC-003', fecha: '2026-05-12', solicitante: R.con, descripcion: 'Contención adicional del talud oriental tras el deslizamiento superficial del 7 de mayo de 2026: pantalla anclada de 60 m y drenajes.', tipo: 'Acción correctiva', impactoAlcance: 'Obra adicional de contención en 1.5.1.1 (actividad K03C). Sin nueva línea base: se usa la reserva para contingencias (queda en COP 1.763 millones).', impactoCronograma: 17, impactoCosto: 600 * M, estado: 'Aprobada', fechaDecision: '2026-05-19', decisor: R.jun },
        { id: 'CC-004', fecha: '2026-09-21', solicitante: R.com, descripcion: 'Incrementar 3 % la lista de precios de la etapa 2 y ofrecer cuota inicial flexible a 24 meses con preaprobación bancaria para recuperar la velocidad de ventas.', tipo: 'Acción preventiva', impactoAlcance: 'Sin cambio de alcance, plazo ni costo. El pronóstico de ventas no incluye el alza hasta verificar la absorción con la nueva lista (hasta COP 1.603 millones sobre las 130 viviendas por vender de la etapa 2).', impactoCronograma: 0, impactoCosto: 0, estado: 'Aprobada', fechaDecision: '2026-09-25', decisor: R.jun },
        { id: 'CC-005', fecha: '2026-09-28', solicitante: R.ger, descripcion: 'Reponer COP 600 millones a la reserva para contingencias desde la reserva de gestión para cubrir el valor monetario esperado de las amenazas abiertas (COP 2.363 millones frente a COP 1.763 millones disponibles).', tipo: 'Acción preventiva', impactoAlcance: 'Ninguno.', impactoCronograma: 0, impactoCosto: 600 * M, estado: 'En análisis', decisor: 'Junta directiva del promotor (sesión del 13 de octubre de 2026)' },
      ],
      responsableRegistro: R.ger,
      observacionesCambios: 'Impacto en el cronograma en días hábiles del calendario del proyecto (lunes a sábado con festivos de Colombia): CC-001 unos dos meses; CC-002 cuatro semanas (28 días calendario); CC-003 tres semanas (21 días calendario). CC-002 originó la LB1 (13 de marzo de 2026); CC-003 usó la reserva para contingencias sin nueva línea base; CC-004 no afecta costos y su efecto en las ventas (hasta COP 1.603 millones) no se incluye en el pronóstico hasta verificar la absorción con la nueva lista; CC-005 se decide en la sesión de la junta del 13 de octubre de 2026. Uso acumulado de la reserva para contingencias: COP 1.030 millones (CC-002 COP 430 millones y CC-003 COP 600 millones) de los COP 2.793 millones de la LB0; disponible al corte: COP 1.763 millones. En el periodo no hubo cambios de nivel 1 que afectaran las líneas base.',
    },
  };

  /* ------------------------------------------------------------ emisiones anteriores de los registros vivos
     Los registros se envían a revisión con letra (A, B, C…) en los puntos de control; cada emisión guarda
     el contenido que tenía en su fecha (solo filas conocidas entonces, con su estado de ese momento). */
  const pick = (list, ids, patches) => list.filter((r) => ids.includes(r.id)).map((r) => ({ ...r, ...((patches || {})[r.id] || {}) }));
  const upTo = (list, lastId) => list.filter((r) => r.id <= lastId).map((r) => r.id);
  const ENT = registroEntregables.fields.entregables;
  registroEntregables.revs = [
    { rev: 'A', status: 'revision', date: '2025-12-19', note: 'Primera emisión con la licencia ejecutoriada (acta AAE-01): entregables de la estructuración y de los diseños aceptados; fechas previstas de la LB0.', fields: {
      ...cp(registroEntregables.fields),
      entregables: pick(ENT, upTo(ENT, 'ENT-10'), { 'ENT-07': { fechaPrevista: '2025-06-27' }, 'ENT-10': { fechaPrevista: '2025-12-01' } }),
      procedimientoAceptacion: registroEntregables.fields.procedimientoAceptacion.replace('Las fechas previstas son las de la LB1.', 'Las fechas previstas son las de la LB0.'),
    } },
    { rev: 'B', status: 'revision', date: LB1, note: 'Emitido con la LB1 (CC-002): diseños de redes, permisos ambientales, crédito y punto de equilibrio de la etapa 1 y diseños de detalle de la etapa 1 aceptados.', fields: {
      ...cp(registroEntregables.fields),
      entregables: pick(ENT, upTo(ENT, 'ENT-15')),
    } },
  ];
  const INC = registroIncidentes.fields.incidentes;
  registroIncidentes.revs = [
    { rev: 'A', status: 'revision', date: '2025-12-19', note: 'Primera emisión con la licencia ejecutoriada: acta de observaciones de la curaduría (cerrado) y redimensionamiento de la red de acueducto pedido por EPM (en curso).', fields: {
      ...cp(registroIncidentes.fields),
      incidentes: pick(INC, ['INC-001', 'INC-002'], { 'INC-002': { estado: 'En curso', solucion: 'Diseño ajustado con tanque de almacenamiento y bombeo radicado en EPM el 12 de diciembre; la aprobación se espera en enero de 2026, antes del inicio de obra.' } }),
    } },
    { rev: 'B', status: 'revision', date: LB1, note: 'Emitido con la LB1 (CC-002): incidentes de la licencia, de EPM y del punto de equilibrio de la etapa 1, cerrados.', fields: {
      ...cp(registroIncidentes.fields),
      incidentes: pick(INC, ['INC-001', 'INC-002', 'INC-003']),
    } },
  ];
  const CAM = registroCambios.fields.cambios;
  registroCambios.revs = [
    { rev: 'A', status: 'revision', date: '2025-09-30', note: 'Primera emisión con la decisión del CC-001 (rechazado por la junta).', fields: {
      ...cp(registroCambios.fields),
      cambios: pick(CAM, ['CC-001']),
      observacionesCambios: 'Impacto en el cronograma en días hábiles del calendario del proyecto (lunes a sábado con festivos de Colombia): CC-001 unos dos meses, porque obligaba a modificar la licencia en trámite. La junta lo rechazó el 30 de septiembre de 2025 y pidió corregir la velocidad de ventas con la estrategia de precios. La reserva para contingencias de la LB0 (COP 2.793 millones) no se ha usado.',
    } },
    { rev: 'B', status: 'revision', date: LB1, note: 'Emitido con la LB1: CC-002 aprobado por la junta el 10 de marzo de 2026.', fields: {
      ...cp(registroCambios.fields),
      cambios: pick(CAM, ['CC-001', 'CC-002']),
      observacionesCambios: 'Impacto en el cronograma en días hábiles del calendario del proyecto (lunes a sábado con festivos de Colombia): CC-001 unos dos meses; CC-002 cuatro semanas (28 días calendario). CC-002 originó la LB1 (13 de marzo de 2026) con COP 430 millones de la reserva para contingencias, que queda en COP 2.363 millones de los COP 2.793 millones de la LB0. El fin del proyecto no cambia.',
    } },
  ];
  registroLecciones.revs = [
    { rev: 'A', status: 'revision', date: LB1, note: 'Primera emisión con la LB1: lecciones de la estructuración, de las licencias y del punto de equilibrio de la etapa 1.', fields: {
      ...cp(registroLecciones.fields),
      lecciones: pick(registroLecciones.fields.lecciones, ['LA-01', 'LA-02', 'LA-06', 'LA-07', 'LA-08', 'LA-09']),
      difusion: 'El gerente presenta las lecciones nuevas en el comité de gerencia y las incorpora en la planificación de la obra y de la etapa 2: concepto previo de movilidad y factibilidad de EPM desde el anteproyecto (LA-01 y LA-08), revisión independiente por entregas parciales (LA-06), mezcla de producto congelada antes de radicar (LA-07) y feria de vivienda antes del punto de equilibrio de la etapa 2 (LA-09). Al cierre se consolidan en el informe final y se envían a la gerencia general para el siguiente lote del promotor.',
    } },
  ];

  PM.exampleDocs = PM.exampleDocs || {};
  PM.exampleDocs.medellin = Object.assign(PM.exampleDocs.medellin || {}, {
    'caso-negocio': casoNegocio,
    'plan-gestion-beneficios': planBeneficios,
    'acta-constitucion': actaConstitucion,
    'registro-supuestos': registroSupuestos,
    'plan-direccion': planDireccion,
    'plan-gestion-cambios': planCambios,
    'plan-gestion-configuracion': planConfiguracion,
    'entregables': registroEntregables,
    'registro-incidentes': registroIncidentes,
    'registro-lecciones': registroLecciones,
    'informe-desempeno': informesDesempeno,
    'solicitud-cambio': solicitudesCambio,
    'registro-cambios': registroCambios,
    /* informe-final y acta-cierre: el cierre no ha empezado al corte (2026-09-30); no se crean */
    'plan-gestion-alcance': planAlcance,
    'plan-gestion-requisitos': planRequisitos,
    'documentacion-requisitos': docRequisitos,
    'matriz-trazabilidad': matrizTrazabilidad,
    'enunciado-alcance': enunciadoAlcance,
    'acta-aceptacion-entregable': actasAceptacion,
    'plan-gestion-cronograma': planCronograma,
    'estimaciones-duracion': estimacionesDuracion,
  });
})();

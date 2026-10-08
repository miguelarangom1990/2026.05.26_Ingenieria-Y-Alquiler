/* ==========================================================================
   91-example-medellin.js — proyecto de ejemplo «Edificio Atalaya del Occidente»
   (Medellín): desarrollo inmobiliario integral (estructuración, comercialización,
   diseños y licencias, construcción por etapas, entrega y cierre).
   Devuelve el formato de exportación que consume PM.projectOps.importData:
   {format:'gestor-pmbok', version:1, project, collections:{docs, tools, baselines, flows}}.
   Todo es determinista (ids fijos, sin azar ni fecha del sistema).

   Cronograma: cada actividad se define por sus fechas planificadas (LB1), sus fechas
   de la LB0 cuando difieren, sus fechas reales y su pronóstico. Las duraciones
   (días hábiles L-S con festivos de Colombia) y los desfases de las dependencias se
   derivan de esas fechas con el calendario del proyecto: la primera dependencia de
   cada actividad es la que la impulsa; las demás no la empujan. Las líneas base LB0 y
   LB1 salen de PM.calc.computeSchedule y PM.calc.makeBaselineSnapshot sobre cada
   versión del plan; la prueba verifica que el CPM reproduce las fechas definidas.

   Las cifras salen del modelo del ejemplo (model.json): lote de 50.000 m² por
   COP 15.000 millones, 416 viviendas en una plataforma con cuatro bloques de 8 pisos,
   ventas por COP 162.122 millones y costo total de COP 141.939 millones (LB0/LB1).
   Proyecto, empresas y cifras son ficticios; se usan roles, no nombres de personas.
   Los documentos se construyen con PM.exampleDocs.medellin (archivos 92 y 93).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || typeof PM.registerExample !== 'function') return;
  const D = PM.date;
  const MM = 1e6;

  /* ---------------------------------------------------------------- datos generales */
  const CODE = 'PRY-2025-003';
  const START = '2025-01-13';
  const END = '2029-03-28';           /* acta de cierre de la línea base (el 29 y el 30 de marzo de 2029 son festivos) */
  const FORECAST_END = '2029-06-29';  /* pronóstico al corte */
  const STATUS_DATE = '2026-09-30';
  const LB0_DATE = '2025-04-22';      /* decisión de inversión: factibilidad aprobada por la junta directiva */
  const LB1_DATE = '2026-03-13';      /* CC-002 aprobado el 10 de marzo de 2026 */
  const SETTINGS = { workweek: 6, holidaysCO: true, extraHolidays: [] };

  /* Presupuesto (millones de COP). BAC = costo total sin utilidad y sin reservas. */
  const BUDGET = {
    ventas: 162122,
    lote: 15000, vip: 3000,
    directosLb0: 94080, directos: 94510,
    indirectos: 20062, financieros: 7004,
    contingenciaLb0: 2793, contingencia: 2363, contingenciaUsada: 600,
    gestion: 1400,
  };
  BUDGET.bacLb0 = BUDGET.lote + BUDGET.vip + BUDGET.directosLb0 + BUDGET.indirectos + BUDGET.financieros; /* 139.146 */
  BUDGET.bac = BUDGET.lote + BUDGET.vip + BUDGET.directos + BUDGET.indirectos + BUDGET.financieros;        /* 139.576 */
  BUDGET.lineaBaseCostos = BUDGET.bac + BUDGET.contingencia;                                               /* 141.939 */
  BUDGET.presupuesto = BUDGET.lineaBaseCostos + BUDGET.gestion;                                            /* 143.339 */
  const RESERVES_LB0 = { contingency: BUDGET.contingenciaLb0 * MM, management: BUDGET.gestion * MM };
  const RESERVES_LB1 = { contingency: BUDGET.contingencia * MM, management: BUDGET.gestion * MM };
  const RESERVES = { contingency: (BUDGET.contingencia - BUDGET.contingenciaUsada) * MM, management: BUDGET.gestion * MM };

  const META = {
    name: 'EJEMPLO · Edificio Atalaya del Occidente — Medellín',
    code: CODE,
    client: 'Promotora Modelo Occidente S.A.S. (ficticia)',
    sponsor: 'Junta directiva del promotor',
    manager: 'Gerente de proyecto',
    start: START,
    end: END,
    statusDate: STATUS_DATE,
    budget: BUDGET.presupuesto * MM,
    currency: 'COP',
    status: 'En ejecución',
    lifecycle: 'Predictivo',
    location: 'Medellín (Antioquia), borde urbano occidental, zona 4: suelo de expansión con tratamiento de Desarrollo (DE) y plan parcial adoptado (lote hipotético)',
    description: 'Proyecto de ejemplo con datos ficticios. Desarrollo inmobiliario integral en un lote de 50.000 m² comprado por COP 15.000 millones (COP 300.000/m²) en suelo de expansión de Medellín, con norma de referencia del polígono Z4_DE_1 del Acuerdo 48 de 2014 (100 viviendas/ha, índice de construcción 0,6 sobre área bruta, 8 pisos; supuestos por verificar con la ficha normativa del DAP y la curaduría). Una edificación en propiedad horizontal: plataforma de parqueaderos con cuatro bloques de 8 pisos y 416 viviendas (104 VIS y 312 No VIS, 24.736 m² vendibles), vendida y construida en dos etapas con encargo fiduciario y punto de equilibrio del 75 %. Ventas por COP 162.122 millones; costo total de COP 141.939 millones (lote 9,25 % y costos directos, con los honorarios del constructor, 58,3 % de las ventas); utilidad antes de impuestos de la línea base del 12,45 %.',
    createdAt: '2025-01-13T14:00:00.000Z',
    createdBy: null,
  };

  /* ---------------------------------------------------------------- roles y recursos */
  const ROLE = {
    jun: 'Junta directiva del promotor', ger: 'Gerente de proyecto', est: 'Estructurador financiero', com: 'Gerente comercial',
    arq: 'Arquitecto diseñador', ies: 'Ingeniero estructural', con: 'Director de obra (constructor)', sup: 'Supervisión técnica independiente',
    int: 'Interventoría del banco y la fiduciaria', fid: 'Fiduciaria', ban: 'Banco (crédito constructor)', abo: 'Abogado del proyecto',
    ctd: 'Contador del proyecto', res: 'Residente de obra',
  };
  const RS = {
    ger: 'Gerente de proyecto', est: 'Estructurador financiero', com: 'Gerente comercial', ase: 'Asesores comerciales',
    arq: 'Equipo de diseño arquitectónico', ing: 'Equipo de ingeniería de diseño', abo: 'Abogado del proyecto',
    dob: 'Director de obra', res: 'Residente de obra', sst: 'Coordinador SST', tie: 'Frente de movimiento de tierras',
    pil: 'Equipo de perforación de pilas', cim: 'Cuadrilla de cimentación', est2: 'Cuadrilla de estructura',
    for: 'Juego de formaleta industrializada', gru: 'Grúa torre', mam: 'Cuadrilla de mampostería', ins: 'Cuadrilla de instalaciones',
    aca: 'Cuadrilla de acabados', fac: 'Cuadrilla de fachada y ventanería', urb: 'Frente de urbanismo', sup: 'Supervisor técnico independiente',
  };
  const RESOURCE_LIMITS = {
    [RS.ger]: 1, [RS.est]: 1, [RS.com]: 1, [RS.ase]: 6, [RS.arq]: 1, [RS.ing]: 2, [RS.abo]: 1, [RS.dob]: 1, [RS.res]: 3, [RS.sst]: 2,
    [RS.tie]: 1, [RS.pil]: 1, [RS.cim]: 2, [RS.est2]: 3, [RS.for]: 2, [RS.gru]: 2, [RS.mam]: 3, [RS.ins]: 6, [RS.aca]: 6, [RS.fac]: 2,
    [RS.urb]: 3, [RS.sup]: 1,
  };
  const res = (...pairs) => pairs.map(([name, units]) => ({ name, units }));

  /* ---------------------------------------------------------------- capítulos de costos directos (LB1, millones)
     Totales del presupuesto de factibilidad; la LB1 agrega al capítulo de urbanismo la mitigación vial del CC-002.
     Los directos son el valor estimado del contrato de administración delegada (CT-015): costos reembolsables por
     capítulo más los honorarios del constructor (5 % de los reembolsables), que salen de feeSplit en cada actividad. */
  const CHAPTERS = [
    ['pre', 'Preliminares y obras provisionales', 1620],
    ['tie', 'Movimiento de tierras, contención y estabilización de taludes', 4952],
    ['cim', 'Cimentación (pilas, zapatas y vigas de amarre)', 7202],
    ['est', 'Estructura en concreto (muros vaciados, losas y plataforma)', 22054],
    ['mam', 'Mampostería y muros divisorios', 3511],
    ['hid', 'Instalaciones hidrosanitarias, red contra incendio y gas', 5851],
    ['ele', 'Instalaciones eléctricas, iluminación y telecomunicaciones (RETIE, RETILAP, RITEL)', 6121],
    ['equ', 'Equipos especiales (ascensores, bombeo, planta eléctrica, detección)', 3150],
    ['cub', 'Cubiertas e impermeabilizaciones', 1621],
    ['pan', 'Pañetes, estucos y pintura', 3062],
    ['pis', 'Pisos y enchapes', 4141],
    ['met', 'Carpintería metálica, ventanería y barandas', 3240],
    ['mad', 'Carpintería de madera (puertas, clósets y muebles de cocina)', 2161],
    ['apa', 'Aparatos sanitarios, griferías y equipos de cocina', 1981],
    ['fac', 'Fachada y obras exteriores del edificio', 1259],
    ['adm', 'Administración de obra y gastos generales (personal, campamento, SST, equipos)', 5852],
    ['hon', 'Honorarios del constructor (administración delegada: 5 % sobre los costos reembolsables)', 4496],
    ['ase', 'Aseo general, pruebas y entrega', 451],
    ['urb', 'Urbanismo, vías, redes externas de EPM, equipamiento y cesiones (cargas del plan parcial)', 10595],
    ['pai', 'Paisajismo, zonas verdes privadas y dotación de zonas comunes', 1190],
  ];
  /* Rubros de costos indirectos (sin imprevistos, que son la reserva para contingencias) */
  const INDIRECTS = [
    ['estr', 'Estructuración: estudio de mercado, factibilidad, títulos y avalúo', 420],
    ['dis', 'Estudios y diseños', 2268],
    ['lic', 'Licencias y trámites (expensas, delineación urbana, EPM, movilidad, permisos ambientales)', 480],
    ['sti', 'Supervisión técnica independiente (Ley 1796 de 2016)', 567],
    ['itv', 'Interventoría del banco y la fiduciaria', 473],
    ['ger', 'Gerencia del proyecto (promotor)', 4864],
    ['comi', 'Comisiones de ventas', 2432],
    ['pub', 'Publicidad y mercadeo', 1459],
    ['sala', 'Sala de ventas y apartamento modelo', 680],
    ['fidu', 'Fiducia (encargo de preventas y patrimonio autónomo)', 567],
    ['pol', 'Pólizas y seguros', 567],
    ['not', 'Notariado, registro y escrituración a cargo del promotor', 567],
    ['adtr', 'Predial, GMF, legal, contable, revisoría fiscal y SAGRILAFT', 1670],
    ['ica', 'ICA y avisos y tableros', 932],
    ['spo', 'Servicios públicos provisionales y conexiones definitivas de EPM', 1150],
    ['ph', 'Administración provisional de la propiedad horizontal', 210],
    ['pos', 'Posventas y garantías (Ley 1480 de 2011)', 756],
  ];

  /* ---------------------------------------------------------------- EDT */
  /* [id, parentId, nombre, tipo, responsable, descripción, entregable, aceptación, notas, lb0?] */
  const WBS = [
    ['w11', null, 'Gerencia del proyecto', 'entregable', ROLE.ger,
      'Dirección integrada del proyecto según la Guía del PMBOK®: constitución, planificación, seguimiento y control, control integrado de cambios, gestión administrativa, legal y tributaria del fideicomiso y del promotor.',
      'Plan para la dirección del proyecto, informes de desempeño mensuales, actas de comité y registro de cambios',
      'Plan aprobado por la junta directiva; informes entregados a la junta, a la fiduciaria y al banco dentro de los cinco días hábiles siguientes a cada corte.', ''],
    ['w111', 'w11', 'Inicio y planificación', 'paquete', ROLE.ger,
      'Acta de constitución, registro de interesados, plan para la dirección del proyecto y líneas base del alcance, del cronograma y de costos aprobadas con la decisión de inversión.',
      'Acta de constitución, registro de interesados y plan para la dirección del proyecto con la LB0',
      'Acta firmada por la junta directiva; LB0 aprobada en la sesión de decisión de inversión.', ''],
    ['w112', 'w11', 'Seguimiento y control', 'paquete', ROLE.ger,
      'Comités semanales de obra y mensuales de gerencia, medición del avance, valor ganado, informes de desempeño, control integrado de cambios y gestión de riesgos e incidentes.',
      'Informes de desempeño, actas de comité, registros de cambios, riesgos e incidentes actualizados',
      'Informe mensual aprobado por la junta directiva; cambios decididos según la autoridad del plan de gestión de cambios.', ''],
    ['w113', 'w11', 'Gestión administrativa, legal y tributaria', 'paquete', ROLE.est,
      'Contabilidad del proyecto y del fideicomiso, revisoría fiscal, SAGRILAFT del promotor, impuesto predial del lote, GMF y gestión jurídica de contratos.',
      'Estados financieros, declaraciones tributarias y paz y salvos al día',
      'Sin sanciones tributarias; revisoría fiscal sin salvedades.', ''],
    ['w12', null, 'Estructuración técnica, legal y financiera', 'entregable', ROLE.est,
      'Compra y saneamiento del lote, estudio de mercado, factibilidad, gestión urbanística de la unidad de actuación y estructura fiduciaria y de financiación (encargo de preventas, patrimonio autónomo y crédito constructor).',
      'Lote en el patrimonio autónomo, factibilidad aprobada, cargas urbanísticas definidas y financiación contratada',
      'Decisión de inversión de la junta directiva; lote libre de gravámenes en el patrimonio autónomo; créditos aprobados.', ''],
    ['w121', 'w12', 'Compra y saneamiento del lote', 'paquete', ROLE.abo,
      'Debida diligencia del lote (títulos, avalúo, topografía), promesa de compraventa con arras del 20 %, escritura con pago del 80 %, aporte al patrimonio autónomo y registro libre de gravámenes.',
      'Escritura registrada y certificado de tradición del lote a nombre del fideicomiso',
      'Estudio de títulos sin observaciones; certificado de tradición libre de gravámenes y limitaciones.', ''],
    ['w122', 'w12', 'Estudio de mercado y factibilidad', 'paquete', ROLE.est,
      'Estudio de mercado del occidente de Medellín (oferta, absorción y precios VIS y No VIS) y factibilidad técnica, legal y financiera con escenarios de precio, costo y tasa.',
      'Estudio de mercado y modelo de factibilidad aprobados',
      'Margen antes de impuestos de la línea base ≥ 12 % de las ventas y aprobación de la junta directiva.', ''],
    ['w123', 'w12', 'Gestión urbanística: unidad de actuación, cargas y compensación VIP', 'paquete', ROLE.arq,
      'Delimitación de la unidad de actuación urbanística del plan parcial, reparto de cargas y beneficios con el Departamento Administrativo de Planeación y compensación de la obligación VIP por compra de derechos fiduciarios al ISVIMED (Acuerdo 48 de 2014, arts. 324 a 326).',
      'Reparto de cargas aprobado y certificado de cumplimiento de la obligación VIP',
      'Concepto favorable del DAP; certificado del ISVIMED por 78 viviendas VIP equivalentes.', ''],
    ['w124', 'w12', 'Estructura fiduciaria y financiación', 'paquete', ROLE.est,
      'Contratos de fiducia mercantil (patrimonio autónomo) y de encargo fiduciario de preventas, radicación de documentos para anunciar y enajenar vivienda (Ley 962 de 2005, art. 71), administración fiduciaria y crédito constructor por etapas (COP 30.000 y 26.000 millones a IBR + 4,5 puntos).',
      'Fideicomiso constituido, encargo de preventas y créditos constructores aprobados',
      'Contratos firmados; cartas de aprobación del banco; costos financieros dentro del presupuesto.', ''],
    ['w13', null, 'Diseños y licencias', 'entregable', ROLE.arq,
      'Diseños arquitectónicos, geotécnicos, estructurales (NSR-10) y técnicos, estudio de movilidad, diseños de redes de EPM, licencia de urbanización y construcción, permisos ambientales y diseños de detalle por etapa.',
      'Licencia ejecutoriada y diseños aprobados para construcción',
      'Licencia de urbanización y construcción en firme; planos aprobados por la supervisión técnica.', ''],
    ['w131', 'w13', 'Diseño arquitectónico', 'paquete', ROLE.arq,
      'Esquema básico, anteproyecto y proyecto arquitectónico de la plataforma, los cuatro bloques y las zonas comunes, con cuadro de áreas y cumplimiento de la norma.',
      'Proyecto arquitectónico y cuadro de áreas',
      'Cuadro de áreas dentro del índice de construcción (≤ 30.000 m²) y de la densidad del polígono; aprobación del gerente.', ''],
    ['w132', 'w13', 'Estudio geotécnico y diseño estructural', 'paquete', ROLE.ies,
      'Estudio geotécnico y de estabilidad de taludes, diseño estructural NSR-10 (zona de amenaza sísmica intermedia) y revisión independiente de los diseños estructurales (Ley 1796 de 2016).',
      'Estudio geotécnico, memorias y planos estructurales con revisión independiente',
      'Memorias firmadas por profesionales con matrícula vigente y constancia de la revisión independiente.', ''],
    ['w133', 'w13', 'Diseños técnicos y bioclimáticos', 'paquete', ROLE.arq,
      'Diseños hidrosanitario, de gas, de red contra incendio, eléctrico, de iluminación y de telecomunicaciones (RETIE, RETILAP, RITEL), bioclimático (Resolución 0194 de 2025) y paisajístico.',
      'Diseños técnicos coordinados',
      'Diseños coordinados sin interferencias críticas y metas de ahorro de agua y energía cumplidas.', ''],
    ['w134', 'w13', 'Estudio de movilidad y diseños de redes de EPM', 'paquete', ROLE.arq,
      'Estudio de movilidad por más de 150 celdas de parqueo y factibilidad y diseños de las redes de acueducto, alcantarillado, energía y gas con EPM.',
      'Estudio de movilidad aprobado y diseños de redes aprobados por EPM',
      'Resolución de la Secretaría de Movilidad y aprobación de diseños de EPM.', ''],
    ['w135', 'w13', 'Licencia de urbanización y construcción y permisos ambientales', 'paquete', ROLE.arq,
      'Radicación en legal y debida forma, trámite en la curaduría (Decreto 1077 de 2015), respuesta al acta de observaciones, ejecutoria de la licencia y permisos ambientales ante el Área Metropolitana del Valle de Aburrá.',
      'Licencia de urbanización y construcción ejecutoriada y permisos ambientales',
      'Resolución de licencia en firme y permisos de aprovechamiento forestal y de ocupación de cauce.', ''],
    ['w136', 'w13', 'Diseños de detalle y planos de taller', 'paquete', ROLE.arq,
      'Diseños de detalle, planos de taller y coordinación técnica por etapa para contratar y construir.',
      'Paquete de diseños para construcción de cada etapa',
      'Planos aprobados por el director de obra y la supervisión técnica antes del inicio de cada etapa.', ''],
    ['w14', null, 'Comercialización y ventas', 'entregable', ROLE.com,
      'Sala de ventas, mercadeo, preventas por etapa con encargo fiduciario hasta el punto de equilibrio, venta del inventario y escrituración con subrogación de créditos.',
      '416 viviendas y 203 parqueaderos vendidos y escriturados',
      'Ventas netas de desistimientos según el plan; punto de equilibrio declarado por la fiduciaria en cada etapa.', ''],
    ['w141', 'w14', 'Sala de ventas y apartamento modelo', 'paquete', ROLE.com,
      'Construcción y dotación de la sala de ventas y del apartamento modelo en el lote.',
      'Sala de ventas y apartamento modelo en funcionamiento',
      'Abierta antes del lanzamiento de la etapa 1, con permisos y póliza.', ''],
    ['w142', 'w14', 'Mercadeo y publicidad', 'paquete', ROLE.com,
      'Plan de mercadeo, publicidad digital y en medios, eventos de lanzamiento y alianzas con cajas de compensación y bancos.',
      'Plan de mercadeo ejecutado y reportes mensuales de visitas y conversión',
      'Costo por venta dentro del presupuesto y meta de visitas cumplida.', ''],
    ['w143', 'w14', 'Preventas y punto de equilibrio de la etapa 1', 'paquete', ROLE.com,
      'Lanzamiento de la etapa 1 (bloques A y B), separaciones, vinculación al encargo fiduciario con SARLAFT, promesas y punto de equilibrio del 75 % (156 de 208 viviendas).',
      'Punto de equilibrio de la etapa 1 declarado y recursos girados al patrimonio autónomo',
      'Certificación de la fiduciaria de las condiciones de giro.', ''],
    ['w144', 'w14', 'Preventas y punto de equilibrio de la etapa 2', 'paquete', ROLE.com,
      'Lanzamiento de la etapa 2 (bloques C y D), preventas hasta el 60 % para el crédito y hasta el 75 % (156 de 208 viviendas) para el punto de equilibrio.',
      'Punto de equilibrio de la etapa 2 declarado y recursos girados al patrimonio autónomo',
      'Certificación de la fiduciaria de las condiciones de giro.', ''],
    ['w145', 'w14', 'Venta del inventario', 'paquete', ROLE.com,
      'Venta de las unidades restantes de cada etapa después del punto de equilibrio, con lista de precios ajustada y reventa de desistimientos.',
      'Inventario vendido',
      'Inventario en cero antes del certificado técnico de ocupación de cada etapa.', ''],
    ['w146', 'w14', 'Escrituración y subrogación de créditos', 'paquete', ROLE.com,
      'Escrituración de las viviendas y parqueaderos, registro, desembolso de créditos hipotecarios y subsidios, y subrogación (amortización) del crédito constructor.',
      'Escrituras registradas y crédito constructor amortizado',
      'Escrituras registradas; paz y salvo del banco por cada unidad liberada.', ''],
    ['w15', null, 'Construcción', 'entregable', ROLE.con,
      'Construcción de la edificación (plataforma de parqueaderos y cuatro bloques de 8 pisos) en dos etapas, urbanismo y cargas del plan parcial, administración de obra, supervisión técnica independiente e interventoría. Se ejecuta por administración delegada (CT-015): costos reembolsables más honorarios del constructor del 5 %, incluidos en el presupuesto de cada actividad de obra.',
      'Edificación terminada con certificado técnico de ocupación por etapa y obras de urbanismo recibidas',
      'Certificado técnico de ocupación (Ley 1796 de 2016), recibo de redes de EPM y certificaciones RETIE y RITEL.', ''],
    ['w151', 'w15', 'Construcción de la etapa 1 (bloques A y B)', 'cuenta-control', ROLE.con,
      'Preliminares, movimiento de tierras, cimentación, estructura de la plataforma (50 %) y de los bloques A y B, mampostería, instalaciones, cubiertas, fachadas, acabados, equipos especiales y pruebas de la etapa 1.',
      'Bloques A y B (208 viviendas) y 50 % de la plataforma terminados',
      'Certificado técnico de ocupación de la etapa 1.', ''],
    ['w1511', 'w151', 'Preliminares, movimiento de tierras y cimentación (etapa 1)', 'paquete', ROLE.con,
      'Cerramiento, campamento, topografía, plan de manejo de tránsito, movimiento de tierras, contención y estabilización de taludes, pilas pre-excavadas, zapatas y vigas de amarre de la etapa 1.',
      'Terreno conformado, taludes estabilizados y cimentación de la etapa 1',
      'Recibo topográfico, informe del geotecnista y ensayos de integridad de pilas conformes.',
      'Deslizamiento superficial del talud oriental en mayo de 2026 (INC-004): contención adicional aprobada con el CC-003.'],
    ['w1512', 'w151', 'Estructura de la plataforma y de los bloques A y B', 'paquete', ROLE.con,
      'Estructura de la plataforma de parqueaderos de la etapa 1 y de los bloques A y B en muros de concreto vaciados con formaleta industrializada.',
      'Estructura de la plataforma (etapa 1) y de los bloques A y B',
      'Liberación por piso de la supervisión técnica; resistencia del concreto conforme con NSR-10 (C.5.6).',
      'Cilindros de 25,1 MPa en el piso 3 del bloque A (INC-005): núcleos conformes.'],
    ['w1513', 'w151', 'Mampostería e instalaciones (etapa 1)', 'paquete', ROLE.con,
      'Mampostería, instalaciones hidrosanitarias, de gas, de red contra incendio, eléctricas y de telecomunicaciones de los bloques A y B e instalaciones y acabados de la plataforma.',
      'Mampostería e instalaciones probadas de la etapa 1',
      'Pruebas de presión y estanqueidad conformes y revisión de RETIE.', ''],
    ['w1514', 'w151', 'Cubiertas, fachadas y ventanería (etapa 1)', 'paquete', ROLE.con,
      'Cubiertas e impermeabilización, fachada, ventanería y barandas de los bloques A y B.',
      'Envolvente de los bloques A y B terminada',
      'Prueba de estanqueidad de cubiertas y ventanas sin filtraciones.', ''],
    ['w1515', 'w151', 'Acabados (etapa 1)', 'paquete', ROLE.con,
      'Pañetes, estucos y pintura, pisos y enchapes, carpintería de madera, aparatos sanitarios y cocinas de los bloques A y B.',
      'Viviendas de la etapa 1 terminadas para entrega',
      'Lista de chequeo de entrega por vivienda sin pendientes.', ''],
    ['w1516', 'w151', 'Equipos especiales, pruebas y certificado técnico de ocupación (etapa 1)', 'paquete', ROLE.con,
      'Ascensores, bombeo, planta eléctrica y detección de incendio, aseo general, pruebas, recibo de redes de EPM, certificaciones RETIE y RITEL y certificado técnico de ocupación.',
      'Certificado técnico de ocupación de la etapa 1',
      'Certificado expedido por el supervisor técnico independiente y protocolizado.', ''],
    ['w152', 'w15', 'Construcción de la etapa 2 (bloques C y D)', 'cuenta-control', ROLE.con,
      'Construcción de la etapa 2: plataforma (50 %) y bloques C y D, con la misma secuencia de la etapa 1.',
      'Bloques C y D (208 viviendas) y 50 % de la plataforma terminados',
      'Certificado técnico de ocupación de la etapa 2.', ''],
    ['w1521', 'w152', 'Preliminares, movimiento de tierras y cimentación (etapa 2)', 'paquete', ROLE.con,
      'Adecuación del campamento, movimiento de tierras y contención, pilas, zapatas y vigas de amarre de la etapa 2.',
      'Cimentación de la etapa 2',
      'Recibo topográfico, informe del geotecnista y ensayos de integridad de pilas conformes.', ''],
    ['w1522', 'w152', 'Estructura de la plataforma y de los bloques C y D', 'paquete', ROLE.con,
      'Estructura de la plataforma de la etapa 2 y de los bloques C y D.',
      'Estructura de la plataforma (etapa 2) y de los bloques C y D',
      'Liberación por piso de la supervisión técnica; resistencia del concreto conforme con NSR-10 (C.5.6).', ''],
    ['w1523', 'w152', 'Mampostería e instalaciones (etapa 2)', 'paquete', ROLE.con,
      'Mampostería e instalaciones de los bloques C y D e instalaciones y acabados de la plataforma de la etapa 2.',
      'Mampostería e instalaciones probadas de la etapa 2',
      'Pruebas de presión y estanqueidad conformes y revisión de RETIE.', ''],
    ['w1524', 'w152', 'Cubiertas, fachadas y ventanería (etapa 2)', 'paquete', ROLE.con,
      'Cubiertas e impermeabilización, fachada, ventanería y barandas de los bloques C y D.',
      'Envolvente de los bloques C y D terminada',
      'Prueba de estanqueidad de cubiertas y ventanas sin filtraciones.', ''],
    ['w1525', 'w152', 'Acabados (etapa 2)', 'paquete', ROLE.con,
      'Pañetes, estucos y pintura, pisos y enchapes, carpintería de madera, aparatos sanitarios y cocinas de los bloques C y D.',
      'Viviendas de la etapa 2 terminadas para entrega',
      'Lista de chequeo de entrega por vivienda sin pendientes.', ''],
    ['w1526', 'w152', 'Equipos especiales, pruebas y certificado técnico de ocupación (etapa 2)', 'paquete', ROLE.con,
      'Equipos especiales, aseo general, pruebas, recibo de redes, certificaciones y certificado técnico de ocupación de la etapa 2.',
      'Certificado técnico de ocupación de la etapa 2',
      'Certificado expedido por el supervisor técnico independiente y protocolizado.', ''],
    ['w153', 'w15', 'Urbanismo y cargas del plan parcial', 'cuenta-control', ROLE.con,
      'Obras de urbanismo y cargas locales del plan parcial: vías públicas y mitigación vial, redes externas de EPM, parque de cesión, equipamiento público, retiro de la quebrada y urbanismo interno.',
      'Obras de urbanismo y cesiones listas para entregar al Distrito',
      'Recibo de obras por la Secretaría de Infraestructura Física y de redes por EPM.', ''],
    ['w1531', 'w153', 'Vías públicas y mitigación vial', 'paquete', ROLE.con,
      'Vía colectora del plan parcial (sección pública de 16 m) con andenes, vías locales y obras de mitigación vial exigidas en la licencia: bahía de acceso, carril de desaceleración y semaforización (CC-002).',
      'Vías públicas y obras de mitigación vial construidas',
      'Recibo de la Secretaría de Infraestructura Física y de la Secretaría de Movilidad.', '',
      { description: 'Vía colectora del plan parcial (sección pública de 16 m) con andenes y vías locales.', deliverable: 'Vías públicas construidas', acceptance: 'Recibo de la Secretaría de Infraestructura Física.' }],
    ['w1532', 'w153', 'Redes externas de servicios públicos (EPM)', 'paquete', ROLE.con,
      'Redes externas de acueducto, alcantarillado, energía y gas que conectan el proyecto con la infraestructura de EPM, en dos fases.',
      'Redes externas recibidas por EPM',
      'Acta de recibo de EPM y pruebas de presión conformes.', ''],
    ['w1533', 'w153', 'Parque de cesión, equipamiento público y retiro de la quebrada', 'paquete', ROLE.con,
      'Adecuación del parque de cesión (9.000 m²), construcción de 416 m² de equipamiento público y restauración del retiro de la quebrada.',
      'Parque, equipamiento y retiro listos para entregar',
      'Recibo del DAP y de la Secretaría de Infraestructura Física.', ''],
    ['w1534', 'w153', 'Urbanismo interno, paisajismo y dotación de zonas comunes', 'paquete', ROLE.con,
      'Urbanismo interno, zonas verdes privadas (3.400 m²), paisajismo y dotación de las zonas comunes por etapa.',
      'Zonas comunes dotadas por etapa',
      'Inventario de dotación entregado a la administración provisional.', ''],
    ['w154', 'w15', 'Administración de obra, supervisión técnica e interventoría', 'paquete', ROLE.con,
      'Administración de obra, SST y gastos generales, servicios provisionales, pólizas de construcción, supervisión técnica independiente (Ley 1796 de 2016) e interventoría del banco y la fiduciaria.',
      'Obra administrada con supervisión técnica e interventoría',
      'Informes mensuales de supervisión técnica e interventoría sin hallazgos abiertos de más de 30 días.', ''],
    ['w16', null, 'Entrega, escrituración y cierre', 'entregable', ROLE.ger,
      'Entrega de viviendas, reglamento de propiedad horizontal y entrega de zonas comunes, entrega de cesiones al Distrito, posventas, liquidación del fideicomiso y del crédito y cierre del proyecto.',
      'Viviendas y zonas comunes entregadas, cesiones recibidas y proyecto cerrado',
      'Actas de entrega firmadas; fideicomiso liquidado; acta de cierre aprobada por la junta directiva.', ''],
    ['w161', 'w16', 'Entrega de viviendas', 'paquete', ROLE.con,
      'Entrega de las 416 viviendas con acta, manual del propietario y garantías, coordinada con la escrituración.',
      'Actas de entrega de las 416 viviendas',
      'Acta firmada por cada propietario sin pendientes críticos.', ''],
    ['w162', 'w16', 'Propiedad horizontal y zonas comunes', 'paquete', ROLE.ger,
      'Reglamento de propiedad horizontal (Ley 675 de 2001), administración provisional y entrega de zonas comunes a la copropiedad.',
      'Reglamento registrado y zonas comunes entregadas a la copropiedad',
      'Acta de entrega aprobada por el consejo de administración.', ''],
    ['w163', 'w16', 'Entrega de cesiones y obras de urbanismo al Distrito', 'paquete', ROLE.ger,
      'Escrituración y entrega material de las áreas de cesión y de las obras de urbanismo y equipamiento al Distrito de Medellín.',
      'Actas de recibo de cesiones y obras',
      'Actas firmadas por el Distrito y escrituras de cesión registradas.', ''],
    ['w164', 'w16', 'Posventas y garantías', 'paquete', ROLE.con,
      'Atención de solicitudes de posventa y garantías legales de los inmuebles nuevos (Ley 1480 de 2011).',
      'Solicitudes de posventa atendidas',
      'Solicitudes atendidas dentro de los plazos del procedimiento de posventas.', ''],
    ['w165', 'w16', 'Liquidación y cierre del proyecto', 'paquete', ROLE.ger,
      'Liquidación del encargo fiduciario, del patrimonio autónomo y del crédito constructor; informe final, lecciones aprendidas y acta de cierre.',
      'Fideicomiso liquidado y acta de cierre',
      'Acta de liquidación de la fiduciaria, paz y salvo del banco y acta de cierre aprobada por la junta directiva.', ''],
  ];

  /* ---------------------------------------------------------------- cronograma
     A(id, wbs, nombre, o) / M(id, wbs, nombre, o). Fechas ISO (L-S, sin festivos).
     o.p: fechas de la LB1 [inicio, fin] (o fecha del hito); o.b0: fechas de la LB0 si difieren (null: no estaba en la LB0);
     o.lb1 === false: la actividad no está en la LB1 (cambio posterior); o.a: [inicio real, fin real|null];
     o.prog: avance al corte (actividades en curso); o.fc: [inicio, fin] pronosticados (re-estimación; inicio null = el del CPM);
     o.deps: 'ID' (FS), 'ID:SS', 'ID:FF', 'ID:FS+2' (la primera impulsa; las demás no empujan); o.fix: fecha impuesta (no comenzar antes de);
     o.cost: presupuesto en millones (LB1; o.cost0 para la LB0); o.k: lote | vip | dir | ind | fin; o.cap: capítulos (directos) o rubro (indirectos);
     o.loe: esfuerzo de nivel (avance = tiempo planificado transcurrido); o.st: etapa E1 | E2; o.f: costo real / valor ganado. */
  const DEFS = [];
  /* Honorarios del constructor (administración delegada, CT-015): 5 % sobre los costos reembolsables. El presupuesto de cada
     actividad de obra (o.cost) ya los incluye; o.cap trae los capítulos con honorarios y feeSplit los separa en costo
     reembolsable por capítulo más el capítulo «hon» (el total de la actividad no cambia). */
  const FEE = 0.05;
  const feeSplit = (cap) => {
    const out = {}; let total = 0, reimb = 0;
    for (const [c, v] of Object.entries(cap)) { const r = Math.round(v / (1 + FEE)); out[c] = r; total += v; reimb += r; }
    out.hon = total - reimb;
    return out;
  };
  const ADM_NOTE = 'Personal directivo y técnico de obra, SST, campamento, vigilancia y equipos menores: COP 2.926 millones reembolsables por etapa más el 5 % de honorarios. Los honorarios del constructor (5 % sobre los costos reembolsables, contrato CT-015) van incluidos en el presupuesto de cada actividad de obra: COP 4.496 millones en la LB1.';
  const A = (id, wbsId, name, o) => DEFS.push({ id, wbsId, name, ms: false, ...o, ...(o.k === 'dir' && o.cap && typeof o.cap === 'object' ? { cap: feeSplit(o.cap) } : {}) });
  const M = (id, wbsId, name, o) => DEFS.push({ id, wbsId, name, ms: true, cost: 0, ...o });
  const sh = (d, n) => D.add(d, n);
  const E1 = (s, f) => ({ b0: [s, f], p: [sh(s, 28), sh(f, 28)] });  /* reprogramación de la etapa 1 (CC-002): cuatro semanas */

  /* 1.1 Gerencia del proyecto */
  M('G01', 'w111', 'Acta de constitución del proyecto aprobada', { p: START, a: [START, START], resp: ROLE.jun });
  A('G02', 'w111', 'Registro de interesados y reunión de arranque', { p: ['2025-01-13', '2025-01-24'], a: ['2025-01-13', '2025-01-24'], deps: ['G01'], resp: ROLE.ger, res: res([RS.ger, 0.5]) });
  A('G03', 'w111', 'Plan para la dirección del proyecto y líneas base', { p: ['2025-03-17', '2025-04-21'], a: ['2025-03-17', '2025-04-21'], deps: ['E04:FF+6', 'G02'], resp: ROLE.ger, res: res([RS.ger, 0.5]) });
  M('G04', 'w111', 'Línea base LB0 aprobada por la junta directiva', { p: LB0_DATE, a: [LB0_DATE, LB0_DATE], deps: ['E05', 'G03'], resp: ROLE.jun });
  A('G05', 'w112', 'Gerencia, seguimiento y control: comités, informes de desempeño y control de cambios', { p: ['2025-01-13', '2029-03-27'], a: ['2025-01-13', null], fc: [null, '2029-06-28'], loe: true, deps: ['G01'], cost: 4864, k: 'ind', cap: 'ger', resp: ROLE.ger, res: res([RS.ger, 0.5]), cat: 'Mano de obra', doc: 'NOM', notes: 'Honorarios de gerencia del promotor (3 % de las ventas), pagados por mes. Esfuerzo de nivel hasta el acta de cierre.' });
  A('G06', 'w113', 'Gestión administrativa, legal y tributaria: contabilidad, revisoría fiscal, SAGRILAFT, predial y GMF', { p: ['2025-01-13', '2029-03-27'], a: ['2025-01-13', null], fc: [null, '2029-06-28'], loe: true, deps: ['G01'], cost: 1670, k: 'ind', cap: 'adtr', resp: ROLE.est, res: res([RS.abo, 0.25]), cat: 'Otros', doc: 'FE', f: 1.03, notes: 'Incluye impuesto predial del lote 2025-2029 (COP 380 millones), GMF (COP 560 millones) y servicios legales, contables y de revisoría fiscal (COP 730 millones).' });

  /* 1.2 Estructuración técnica, legal y financiera */
  A('E01', 'w121', 'Debida diligencia del lote: estudio de títulos, avalúo y levantamiento topográfico', { p: ['2025-01-14', '2025-02-21'], a: ['2025-01-14', '2025-02-21'], deps: ['G01:FS+1'], cost: 120, k: 'ind', cap: 'estr', resp: ROLE.abo, res: res([RS.abo, 0.75]), cat: 'Subcontratos', doc: 'FE' });
  M('E02', 'w121', 'Promesa de compraventa del lote firmada y arras del 20 % pagadas (COP 3.000 millones)', { p: '2025-02-28', a: ['2025-02-28', '2025-02-28'], deps: ['E01'], cost: 3000, k: 'lote', resp: ROLE.jun, cat: 'Otros', doc: 'PROM', notes: 'Arras confirmatorias del 20 % del precio (COP 15.000 millones; COP 300.000 por m² bruto).' });
  A('E03', 'w122', 'Estudio de mercado del occidente de Medellín', { p: ['2025-01-20', '2025-03-07'], a: ['2025-01-20', '2025-03-07'], deps: ['G01:FS+5'], cost: 100, k: 'ind', cap: 'estr', resp: ROLE.com, res: res([RS.com, 0.5]), cat: 'Subcontratos', doc: 'FE' });
  A('E04', 'w122', 'Factibilidad técnica, legal y financiera', { p: ['2025-02-03', '2025-04-11'], a: ['2025-02-03', '2025-04-11'], deps: ['E03:SS', 'E01:SS'], cost: 200, k: 'ind', cap: 'estr', resp: ROLE.est, res: res([RS.est, 1]), cat: 'Subcontratos', doc: 'FE' });
  M('E05', 'w122', 'Factibilidad aprobada por la junta directiva (decisión de inversión)', { p: LB0_DATE, a: [LB0_DATE, LB0_DATE], deps: ['E04', 'E03'], resp: ROLE.jun, notes: 'Margen antes de impuestos de 12,45 % de las ventas; aporte del promotor de COP 24.000 millones.' });
  M('E06', 'w121', 'Escritura del lote, pago del 80 % (COP 12.000 millones) y aporte al patrimonio autónomo', { p: '2025-04-30', a: ['2025-04-30', '2025-04-30'], deps: ['E05', 'E02'], cost: 12000, k: 'lote', resp: ROLE.abo, cat: 'Otros', doc: 'ESC' });
  A('E07', 'w121', 'Registro de la escritura, englobe y certificado de tradición libre de gravámenes', { p: ['2025-05-02', '2025-05-23'], a: ['2025-05-02', '2025-05-23'], deps: ['E06'], cost: 260, k: 'ind', cap: 'not', resp: ROLE.abo, res: res([RS.abo, 0.5]), cat: 'Otros', doc: 'FE', notes: 'Gastos de cierre de la compra a cargo del comprador según la promesa: impuesto de registro departamental (1 % del precio, COP 150 millones), derechos de registro según la tarifa de la Superintendencia de Notariado y Registro (≈ COP 80 millones), 50 % de los derechos notariales con IVA (≈ COP 27 millones) y englobe y certificados (≈ COP 3 millones).' });
  A('E08', 'w123', 'Unidad de actuación urbanística: reparto de cargas y beneficios con el DAP', { b0: ['2025-03-03', '2025-06-27'], p: ['2025-03-03', '2025-07-18'], a: ['2025-03-03', '2025-07-18'], deps: ['E04:SS'], cost: 40, k: 'ind', cap: 'lic', resp: ROLE.arq, cat: 'Otros', doc: 'FE', notes: 'El DAP pidió ajustar el reparto de cargas de la vía colectora: tres semanas de atraso.' });
  M('E09', 'w123', 'Obligación VIP compensada: derechos fiduciarios del ISVIMED pagados (COP 3.000 millones)', { b0: '2025-06-27', p: '2025-07-18', a: ['2025-07-18', '2025-07-18'], deps: ['E08'], cost: 3000, k: 'vip', resp: ROLE.est, cat: 'Otros', doc: 'ISV', notes: 'Traslado de la obligación VIP (20 % del suelo neto urbanizable = 7.800 m², equivalentes a 78 VIP) al Macroproyecto de Borde (Acuerdo 48 de 2014, art. 326).' });
  A('E10', 'w124', 'Estructuración fiduciaria (fiducia mercantil y encargo de preventas) y radicación de documentos para anunciar y enajenar vivienda', { p: ['2025-05-02', '2025-06-13'], a: ['2025-05-02', '2025-06-13'], deps: ['E06'], resp: ROLE.est, res: res([RS.est, 0.5], [RS.abo, 0.25]), notes: 'Documentos para anunciar y enajenar las 416 viviendas radicados el 13 de junio de 2025 ante la Secretaría de Gestión y Control Territorial de Medellín (Ley 962 de 2005, art. 71, reglamentado por el Decreto 2180 de 2006, compilado en el Decreto 1077 de 2015), antes del anuncio y de las preventas: folio de matrícula del lote, modelos del encargo fiduciario y de la promesa y presupuesto financiero de las dos etapas; sin licencia por tratarse de preventas. El radicado se actualizó con la licencia ejecutoriada en diciembre de 2025, antes del lanzamiento de la etapa 2.' });
  M('E11', 'w124', 'Encargo fiduciario de preventas firmado', { p: '2025-06-13', a: ['2025-06-13', '2025-06-13'], deps: ['E10'], resp: ROLE.fid });
  A('E12', 'w124', 'Administración fiduciaria del encargo y del patrimonio autónomo', { p: ['2025-06-14', '2029-03-16'], a: ['2025-06-14', null], fc: [null, '2029-06-15'], loe: true, deps: ['E11'], cost: 567, k: 'ind', cap: 'fidu', resp: ROLE.fid, cat: 'Otros', doc: 'FID', notes: 'Comisión fiduciaria mensual hasta la liquidación del fideicomiso.' });
  A('E13', 'w124', 'Trámite del crédito constructor de la etapa 1 (estudio, avalúo y aprobación)', { b0: ['2025-11-04', '2026-01-15'], p: ['2025-11-04', '2026-02-12'], a: ['2025-11-04', '2026-02-12'], fix: true, deps: ['C03'], resp: ROLE.est, res: res([RS.est, 0.5]), notes: 'El banco esperó la licencia ejecutoriada y el 60 % de las preventas para aprobar.' });
  M('E14', 'w124', 'Crédito constructor de la etapa 1 aprobado (COP 30.000 millones)', { b0: '2026-01-16', p: '2026-02-13', a: ['2026-02-13', '2026-02-13'], deps: ['E13'], cost: 180, k: 'fin', resp: ROLE.ban, cat: 'Otros', doc: 'BCO', notes: 'Comisión de estudio y estructuración del crédito: 0,5 % del cupo más gastos.' });
  A('E15', 'w124', 'Intereses del crédito de la etapa 1: desembolsos 1 a 7', { ...E1('2026-06-02', '2026-12-18'), a: ['2026-06-30', null], fc: [null, '2027-02-27'], deps: ['K06:SS+12', 'E14'], cost: 620, k: 'fin', resp: ROLE.est, cat: 'Otros', doc: 'BCO', f: 1.0, notes: 'Cuatro desembolsos desde el 30 de junio de 2026; saldo de COP 12.400 millones al corte. Tasa IBR + 4,5 puntos: 16,5 % N.T.V. en septiembre de 2026, frente a 13,6 % de la línea base.' });
  A('E16', 'w124', 'Intereses del crédito de la etapa 1: desembolsos 8 a 14', { ...E1('2026-12-19', '2027-06-30'), deps: ['E15'], cost: 1850, k: 'fin', resp: ROLE.est });
  A('E17', 'w124', 'Intereses del crédito de la etapa 1: amortización con subrogaciones', { ...E1('2027-07-01', '2027-11-26'), deps: ['E16', 'C12:SS'], cost: 1100, k: 'fin', resp: ROLE.est });
  A('E18', 'w124', 'Trámite del crédito constructor de la etapa 2 (estudio, avalúo y aprobación)', { p: ['2026-11-30', '2027-01-14'], fc: ['2027-02-08', '2027-04-16'], deps: ['C07'], resp: ROLE.est, res: res([RS.est, 0.5]), notes: 'Re-estimado: el banco exige el 60 % de las preventas de la etapa 2 antes de aprobar.' });
  M('E19', 'w124', 'Crédito constructor de la etapa 2 aprobado (COP 26.000 millones)', { p: '2027-01-15', deps: ['E18'], cost: 160, k: 'fin', resp: ROLE.ban });
  A('E20', 'w124', 'Intereses del crédito de la etapa 2: desembolsos 1 a 7', { p: ['2027-05-03', '2027-11-26'], deps: ['L06:SS', 'E19'], cost: 540, k: 'fin', resp: ROLE.est });
  A('E21', 'w124', 'Intereses del crédito de la etapa 2: desembolsos 8 a 14', { p: ['2027-11-27', '2028-06-30'], deps: ['E20'], cost: 1600, k: 'fin', resp: ROLE.est });
  A('E22', 'w124', 'Intereses del crédito de la etapa 2: amortización con subrogaciones', { p: ['2028-07-17', '2028-12-15'], deps: ['C13:SS', 'E21'], cost: 954, k: 'fin', resp: ROLE.est });

  /* 1.3 Diseños y licencias */
  A('D01', 'w131', 'Diseño arquitectónico: esquema básico y anteproyecto', { p: ['2025-03-03', '2025-05-16'], a: ['2025-03-03', '2025-05-16'], deps: ['E04:SS+24'], cost: 330, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.arq, 1]), cat: 'Subcontratos', doc: 'FE' });
  A('D02', 'w131', 'Proyecto arquitectónico y cuadro de áreas', { p: ['2025-05-19', '2025-07-11'], a: ['2025-05-19', '2025-07-11'], deps: ['D01'], cost: 470, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.arq, 1]), cat: 'Subcontratos', doc: 'FE' });
  A('D03', 'w132', 'Estudio geotécnico y de estabilidad de taludes', { p: ['2025-04-01', '2025-05-09'], a: ['2025-04-01', '2025-05-09'], deps: ['D01:SS+24'], cost: 110, k: 'ind', cap: 'dis', resp: ROLE.ies, res: res([RS.ing, 1]), cat: 'Subcontratos', doc: 'FE' });
  A('D04', 'w132', 'Diseño estructural NSR-10 (muros vaciados, plataforma y cimentación)', { p: ['2025-05-12', '2025-07-25'], a: ['2025-05-12', '2025-07-25'], deps: ['D03', 'D01:SS'], cost: 400, k: 'ind', cap: 'dis', resp: ROLE.ies, res: res([RS.ing, 1]), cat: 'Subcontratos', doc: 'FE' });
  A('D05', 'w132', 'Revisión independiente de los diseños estructurales (Ley 1796 de 2016)', { p: ['2025-07-14', '2025-08-01'], a: ['2025-07-14', '2025-08-01'], deps: ['D04:FF'], cost: 85, k: 'ind', cap: 'dis', resp: ROLE.ies, cat: 'Subcontratos', doc: 'FE' });
  A('D06', 'w133', 'Diseños hidrosanitario, de gas y de red contra incendio', { p: ['2025-04-21', '2025-08-29'], a: ['2025-04-21', '2025-08-29'], deps: ['D01:SS'], cost: 140, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.ing, 0.5]), cat: 'Subcontratos', doc: 'FE' });
  A('D07', 'w133', 'Diseños eléctrico, de iluminación y de telecomunicaciones (RETIE, RETILAP, RITEL)', { p: ['2025-04-21', '2025-08-29'], a: ['2025-04-21', '2025-08-29'], deps: ['D01:SS'], cost: 140, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.ing, 0.5]), cat: 'Subcontratos', doc: 'FE' });
  A('D08', 'w133', 'Diseño bioclimático (Resolución 0194 de 2025) y paisajístico', { p: ['2025-05-05', '2025-08-15'], a: ['2025-05-05', '2025-08-15'], deps: ['D01:SS'], cost: 70, k: 'ind', cap: 'dis', resp: ROLE.arq, cat: 'Subcontratos', doc: 'FE' });
  A('D09', 'w134', 'Estudio de movilidad (281 celdas) y aprobación de la Secretaría de Movilidad', { b0: ['2025-05-05', '2025-09-12'], p: ['2025-05-05', '2025-10-03'], a: ['2025-05-05', '2025-10-03'], deps: ['D01:SS'], cost: 110, k: 'ind', cap: 'dis', resp: ROLE.arq, cat: 'Subcontratos', doc: 'FE', f: 1.1, notes: 'Movilidad exigió obras de mitigación (bahía de acceso, carril de desaceleración y semaforización); incorporadas con el CC-002.' });
  A('D10', 'w134', 'Factibilidad de servicios y aprobación de diseños de redes de EPM', { b0: ['2025-04-07', '2025-12-12'], p: ['2025-04-07', '2026-01-23'], a: ['2025-04-07', '2026-01-23'], deps: ['E04:SS'], cost: 160, k: 'ind', cap: 'dis', resp: ROLE.arq, cat: 'Subcontratos', doc: 'FE', f: 1.05, notes: 'EPM pidió redimensionar la red de acueducto (INC-002): seis semanas de atraso, sin efecto en el inicio de obra.' });
  M('D11', 'w135', 'Licencia de urbanización y construcción radicada en legal y debida forma', { p: '2025-08-04', a: ['2025-08-04', '2025-08-04'], deps: ['D05', 'D02', 'D04'], resp: ROLE.arq });
  A('D12', 'w135', 'Trámite de la licencia en la curaduría: revisión, acta de observaciones y correcciones', { b0: ['2025-08-05', '2025-11-14'], p: ['2025-08-05', '2025-11-28'], a: ['2025-08-05', '2025-11-28'], deps: ['D11'], cost: 310, k: 'ind', cap: 'lic', resp: ROLE.arq, res: res([RS.arq, 0.5]), cat: 'Otros', doc: 'LIC', f: 1.04, notes: 'Expensas de curaduría e impuesto de delineación urbana. Acta de observaciones del 6 de octubre de 2025 (INC-001).' });
  M('D13', 'w135', 'Licencia de urbanización y construcción ejecutoriada', { b0: '2025-12-01', p: '2025-12-15', a: ['2025-12-15', '2025-12-15'], deps: ['D12', 'D09'], resp: ROLE.arq });
  A('D14', 'w135', 'Permisos ambientales: aprovechamiento forestal y ocupación de cauce (Área Metropolitana del Valle de Aburrá)', { b0: ['2025-07-01', '2025-12-19'], p: ['2025-07-01', '2026-01-30'], a: ['2025-07-01', '2026-01-30'], deps: ['D03:FS+38'], cost: 50, k: 'ind', cap: 'lic', resp: ROLE.arq, cat: 'Otros', doc: 'FE' });
  A('D15', 'w136', 'Diseños de detalle y planos de taller de la etapa 1', { b0: ['2025-12-02', '2026-02-13'], p: ['2025-12-16', '2026-03-13'], a: ['2025-12-16', '2026-03-13'], deps: ['D13', 'D06', 'D07', 'D08'], cost: 170, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.arq, 1], [RS.ing, 1]), cat: 'Subcontratos', doc: 'FE' });
  A('D16', 'w136', 'Diseños de detalle y planos de taller de la etapa 2', { p: ['2026-06-01', '2026-12-18'], a: ['2026-06-01', null], fc: [null, '2027-01-29'], fix: true, deps: ['D15'], cost: 163, k: 'ind', cap: 'dis', resp: ROLE.arq, res: res([RS.arq, 0.5], [RS.ing, 0.5]), cat: 'Subcontratos', doc: 'FE' });

  /* 1.4 Comercialización y ventas */
  A('C01', 'w141', 'Sala de ventas y apartamento modelo', { p: ['2025-05-19', '2025-07-04'], a: ['2025-05-19', '2025-07-04'], deps: ['D01'], cost: 680, k: 'ind', cap: 'sala', resp: ROLE.com, res: res([RS.com, 0.5]), cat: 'Subcontratos', doc: 'FE', f: 1.04 });
  A('C02', 'w142', 'Plan de mercadeo y publicidad', { p: ['2025-05-19', '2028-06-30'], a: ['2025-05-19', null], fc: [null, '2028-09-29'], loe: true, deps: ['D01'], cost: 1459, k: 'ind', cap: 'pub', resp: ROLE.com, res: res([RS.com, 0.25]), cat: 'Otros', doc: 'FE', f: 1.06, notes: 'Pauta adicional en 2026 para sostener la velocidad de ventas de la etapa 2.' });
  M('C03', 'w143', 'Lanzamiento de la etapa 1', { p: '2025-07-07', a: ['2025-07-07', '2025-07-07'], fix: true, deps: ['C01', 'E11'], resp: ROLE.com });
  A('C04', 'w143', 'Preventas de la etapa 1 hasta el punto de equilibrio (156 de 208 viviendas)', { b0: ['2025-07-08', '2026-01-30'], p: ['2025-07-08', '2026-02-27'], a: ['2025-07-08', '2026-02-27'], sales: 'C04', deps: ['C03'], cost: 912, k: 'ind', cap: 'comi', resp: ROLE.com, res: res([RS.ase, 4]), cat: 'Otros', doc: 'COM' });
  M('C05', 'w143', 'Punto de equilibrio de la etapa 1 declarado por la fiduciaria', { b0: '2026-01-30', p: '2026-02-27', a: ['2026-02-27', '2026-02-27'], deps: ['C04', 'E14', 'D13'], resp: ROLE.fid, notes: '156 viviendas vinculadas (75 % de la etapa), licencia ejecutoriada, lote libre de gravámenes y crédito aprobado. Cuatro semanas después de lo planeado (INC-003).' });
  M('C06', 'w143', 'Giro de los recursos del encargo al patrimonio autónomo (etapa 1)', { b0: '2026-02-06', p: '2026-03-06', a: ['2026-03-06', '2026-03-06'], deps: ['C05'], resp: ROLE.fid });
  M('C07L', 'w144', 'Lanzamiento de la etapa 2', { p: '2026-03-02', a: ['2026-03-02', '2026-03-02'], fix: true, deps: ['C05'], resp: ROLE.com });
  A('C07', 'w144', 'Preventas de la etapa 2 hasta el 60 % (125 de 208 viviendas)', { p: ['2026-03-03', '2026-11-27'], a: ['2026-03-03', null], sales: 'C07', deps: ['C07L'], cost: 731, k: 'ind', cap: 'comi', resp: ROLE.com, res: res([RS.ase, 3]), cat: 'Otros', doc: 'COM', notes: 'Ventas de 11 viviendas al mes frente a 14 planeadas (INC-007): tasas altas y Mi Casa Ya sin asignaciones en 2026.' });
  A('C08', 'w144', 'Preventas de la etapa 2 del 60 % al 75 % (31 viviendas)', { p: ['2026-11-28', '2027-01-28'], fc: ['2027-02-06', '2027-04-26'], deps: ['C07'], cost: 181, k: 'ind', cap: 'comi', resp: ROLE.com, res: res([RS.ase, 3]) });
  M('C09', 'w144', 'Punto de equilibrio de la etapa 2 declarado por la fiduciaria', { p: '2027-01-29', deps: ['C08', 'E19'], resp: ROLE.fid });
  M('C10', 'w144', 'Giro de los recursos del encargo al patrimonio autónomo (etapa 2)', { p: '2027-02-05', deps: ['C09'], resp: ROLE.fid });
  A('C11', 'w145', 'Venta del inventario de la etapa 1 (52 viviendas)', { b0: ['2026-02-02', '2026-10-30'], p: ['2026-03-02', '2026-11-27'], a: ['2026-03-02', null], sales: 'C11', deps: ['C05'], cost: 304, k: 'ind', cap: 'comi', resp: ROLE.com, res: res([RS.ase, 1]), cat: 'Otros', doc: 'COM' });
  A('C12', 'w146', 'Escrituración y subrogación de créditos de la etapa 1', { ...E1('2027-07-01', '2027-11-26'), deps: ['K30'], cost: 599, k: 'ind', cap: 'not', capSplit: { not: 133, ica: 466 }, resp: ROLE.com, res: res([RS.abo, 0.75]), notes: 'Incluye el 50 % de los derechos notariales de las escrituras a cargo del promotor y el ICA sobre los ingresos escriturados.' });
  A('C13', 'w146', 'Escrituración y subrogación de créditos de la etapa 2', { p: ['2028-07-17', '2028-12-15'], deps: ['L30'], cost: 600, k: 'ind', cap: 'not', capSplit: { not: 134, ica: 466 }, resp: ROLE.com, res: res([RS.abo, 0.75]) });
  A('C14', 'w145', 'Venta del inventario de la etapa 2 (52 viviendas)', { p: ['2027-02-01', '2028-06-30'], deps: ['C09'], cost: 304, k: 'ind', cap: 'comi', resp: ROLE.com, res: res([RS.ase, 1]) });

  /* 1.5 Construcción — etapa 1 (LB0 = factibilidad; LB1 = reprogramación de cuatro semanas del CC-002) */
  A('P01', 'w154', 'Pólizas de la etapa 1: todo riesgo construcción, RCE, cumplimiento y amparo patrimonial (Ley 1796)', { ...E1('2026-02-09', '2026-02-14'), a: ['2026-03-09', '2026-03-14'], deps: ['C06'], cost: 283, k: 'ind', cap: 'pol', resp: ROLE.est, cat: 'Otros', doc: 'POL' });
  M('K01', 'w1511', 'Acta de inicio de obra de la etapa 1', { b0: '2026-02-16', p: '2026-03-16', a: ['2026-03-16', '2026-03-16'], deps: ['P01', 'C06', 'D15'], resp: ROLE.ger });
  A('K02', 'w1511', 'Preliminares de la etapa 1: cerramiento, campamento, topografía y plan de manejo de tránsito', { ...E1('2026-02-17', '2026-03-13'), a: ['2026-03-17', '2026-04-10'], deps: ['K01'], cost: 1020, k: 'dir', cap: { pre: 1020 }, st: 'E1', resp: ROLE.con, res: res([RS.res, 1], [RS.cim, 1]), f: 1.03 });
  A('K03', 'w1511', 'Movimiento de tierras, contención y estabilización de taludes de la etapa 1', { ...E1('2026-03-02', '2026-05-29'), a: ['2026-03-30', '2026-07-17'], deps: ['K02:SS+11'], cost: 2859, k: 'dir', cap: { tie: 2859 }, st: 'E1', resp: ROLE.con, res: res([RS.tie, 1]), f: 1.08, notes: 'Lluvias de abril y mayo y deslizamiento superficial del talud oriental (INC-004): terminó tres semanas tarde.' });
  A('K03C', 'w1511', 'Contención adicional del talud oriental: pantalla anclada y drenajes (CC-003)', { b0: null, lb1: false, a: ['2026-05-19', '2026-07-11'], deps: ['K03:SS+42'], cost: 600, k: 'dir', cap: { tie: 600 }, st: 'E1', resp: ROLE.con, notes: 'Aprobada con el CC-003 el 19 de mayo de 2026 con cargo a la reserva para contingencias (COP 600 millones). No está en la LB1.' });
  A('K04', 'w1511', 'Pilas pre-excavadas de la etapa 1 (bloques A y B y plataforma)', { ...E1('2026-04-06', '2026-06-05'), a: ['2026-05-04', '2026-07-11'], deps: ['K03:SS+30'], cost: 2175, k: 'dir', cap: { cim: 2175 }, st: 'E1', resp: ROLE.con, res: res([RS.pil, 1], [RS.cim, 1]), f: 1.05 });
  A('K05', 'w1511', 'Zapatas, dados y vigas de amarre de la etapa 1', { ...E1('2026-05-04', '2026-07-10'), a: ['2026-06-01', '2026-08-21'], deps: ['K04:SS+24'], cost: 1450, k: 'dir', cap: { cim: 1450 }, st: 'E1', resp: ROLE.con, res: res([RS.cim, 1]), f: 1.05 });
  A('K06', 'w1512', 'Estructura de la plataforma de parqueaderos de la etapa 1', { ...E1('2026-05-19', '2026-08-07'), a: ['2026-06-16', '2026-09-18'], deps: ['K05:SS+12'], cost: 2601, k: 'dir', cap: { est: 2601 }, st: 'E1', resp: ROLE.con, res: res([RS.est2, 1]), f: 1.05 });
  A('K07', 'w1512', 'Estructura del bloque A (8 pisos, muros vaciados con formaleta industrializada)', { ...E1('2026-06-16', '2026-09-04'), a: ['2026-07-13', null], prog: 75, deps: ['K06:SS+21'], cost: 3774, k: 'dir', cap: { est: 3774 }, st: 'E1', resp: ROLE.con, res: res([RS.est2, 1], [RS.for, 1], [RS.gru, 1]), f: 1.05, notes: 'Piso 6 de 8 al corte; un piso cada 8 días hábiles.' });
  M('K08', 'w1512', 'Fin de la estructura del bloque A', { b0: '2026-09-04', p: '2026-10-02', deps: ['K07'], resp: ROLE.con });
  A('K09', 'w1512', 'Estructura del bloque B (8 pisos, muros vaciados con formaleta industrializada)', { ...E1('2026-07-27', '2026-10-16'), a: ['2026-08-24', null], prog: 36, deps: ['K07:SS+36'], cost: 4727, k: 'dir', cap: { est: 4727 }, st: 'E1', resp: ROLE.con, res: res([RS.est2, 1], [RS.for, 1], [RS.gru, 1]), f: 1.05 });
  M('K10', 'w1512', 'Fin de la estructura del bloque B', { b0: '2026-10-16', p: '2026-11-13', deps: ['K09'], resp: ROLE.con });
  /* bloque A */
  A('K11', 'w1513', 'Mampostería del bloque A', { ...E1('2026-08-10', '2026-11-13'), a: ['2026-09-07', null], fc: [null, '2027-01-08'], deps: ['K07:SS+48'], cost: 775, k: 'dir', cap: { mam: 775 }, st: 'E1', resp: ROLE.con, res: res([RS.mam, 1]), f: 1.06 });
  A('K12', 'w1513', 'Instalaciones hidrosanitarias, de gas y red contra incendio del bloque A', { ...E1('2026-08-24', '2026-12-18'), a: ['2026-09-21', null], fc: [null, '2027-02-05'], deps: ['K11:SS+12'], cost: 1111, k: 'dir', cap: { hid: 1111 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]), f: 1.04 });
  A('K13', 'w1513', 'Instalaciones eléctricas y de telecomunicaciones del bloque A', { ...E1('2026-09-07', '2027-01-15'), deps: ['K11:SS+24'], cost: 1203, k: 'dir', cap: { ele: 1203 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('K14', 'w1514', 'Cubierta e impermeabilización del bloque A', { ...E1('2026-09-07', '2026-10-09'), deps: ['K08'], cost: 357, k: 'dir', cap: { cub: 357 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K15', 'w1514', 'Fachada, ventanería y barandas del bloque A', { ...E1('2026-11-17', '2027-02-26'), deps: ['K11', 'K14'], cost: 993, k: 'dir', cap: { met: 715, fac: 278 }, st: 'E1', resp: ROLE.con, res: res([RS.fac, 1]) });
  A('K16', 'w1515', 'Pañetes, estucos y pintura del bloque A', { ...E1('2026-10-20', '2027-02-12'), deps: ['K11:SS+30', 'K12:SS'], cost: 676, k: 'dir', cap: { pan: 676 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K17', 'w1515', 'Pisos y enchapes del bloque A', { ...E1('2026-11-17', '2027-03-19'), deps: ['K16:SS+24'], cost: 825, k: 'dir', cap: { pis: 825 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K18', 'w1515', 'Carpintería de madera, aparatos sanitarios y cocinas del bloque A', { ...E1('2027-01-18', '2027-04-30'), deps: ['K17:SS+48', 'K13'], cost: 926, k: 'dir', cap: { mad: 477, apa: 449 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  /* bloque B: seis semanas después del bloque A */
  A('K19', 'w1513', 'Mampostería del bloque B', { ...E1('2026-09-21', '2026-12-24'), deps: ['K09:SS+48'], cost: 970, k: 'dir', cap: { mam: 970 }, st: 'E1', resp: ROLE.con, res: res([RS.mam, 1]) });
  A('K20', 'w1513', 'Instalaciones hidrosanitarias, de gas y red contra incendio del bloque B', { ...E1('2026-10-05', '2027-01-29'), deps: ['K19:SS+12'], cost: 1391, k: 'dir', cap: { hid: 1391 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('K21', 'w1513', 'Instalaciones eléctricas y de telecomunicaciones del bloque B', { ...E1('2026-10-19', '2027-02-26'), deps: ['K19:SS+24'], cost: 1507, k: 'dir', cap: { ele: 1507 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('K22', 'w1514', 'Cubierta e impermeabilización del bloque B', { ...E1('2026-10-19', '2026-11-20'), deps: ['K10'], cost: 448, k: 'dir', cap: { cub: 448 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K23', 'w1514', 'Fachada, ventanería y barandas del bloque B', { ...E1('2026-12-29', '2027-04-16'), deps: ['K19', 'K22'], cost: 1244, k: 'dir', cap: { met: 896, fac: 348 }, st: 'E1', resp: ROLE.con, res: res([RS.fac, 1]) });
  A('K24', 'w1515', 'Pañetes, estucos y pintura del bloque B', { ...E1('2026-12-01', '2027-03-26'), deps: ['K19:SS+30', 'K20:SS'], cost: 846, k: 'dir', cap: { pan: 846 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K25', 'w1515', 'Pisos y enchapes del bloque B', { ...E1('2026-12-29', '2027-04-30'), deps: ['K24:SS+24'], cost: 1033, k: 'dir', cap: { pis: 1033 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K26', 'w1515', 'Carpintería de madera, aparatos sanitarios y cocinas del bloque B', { ...E1('2027-03-01', '2027-06-11'), deps: ['K25:SS+48', 'K21'], cost: 1125, k: 'dir', cap: { mad: 597, apa: 528 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('K27', 'w1513', 'Instalaciones y acabados de la plataforma de parqueaderos de la etapa 1', { ...E1('2026-09-14', '2027-01-29'), deps: ['K08:FS+7'], cost: 1017, k: 'dir', cap: { hid: 441, ele: 369, pis: 207 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('K28', 'w1516', 'Equipos especiales de la etapa 1: ascensores, bombeo, planta eléctrica y detección de incendio', { ...E1('2027-02-01', '2027-05-21'), deps: ['K13:FS+12', 'K21:FF'], cost: 1720, k: 'dir', cap: { equ: 1720 }, st: 'E1', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('K29', 'w1516', 'Aseo general, pruebas, recibo de redes de EPM y certificaciones RETIE y RITEL de la etapa 1', { ...E1('2027-05-03', '2027-06-25'), deps: ['K18', 'K26:FF+12', 'K28:FF', 'K23', 'K27', 'U06:FF'], cost: 236, k: 'dir', cap: { ase: 236 }, st: 'E1', resp: ROLE.con, res: res([RS.aca, 1]) });
  M('K30', 'w1516', 'Certificado técnico de ocupación de la etapa 1 (Ley 1796 de 2016)', { b0: '2027-06-30', p: '2027-07-28', deps: ['K29'], resp: ROLE.sup });
  A('K31', 'w154', 'Administración de obra, SST y gastos generales de la etapa 1', { ...E1('2026-02-17', '2027-06-25'), a: ['2026-03-17', null], fc: [null, '2027-08-06'], loe: true, deps: ['K01'], cost: 3072, k: 'dir', cap: { adm: 3072 }, st: 'E1', resp: ROLE.con, res: res([RS.dob, 0.5], [RS.res, 1], [RS.sst, 1]), f: 1.07, notes: ADM_NOTE });
  A('S01', 'w154', 'Servicios públicos provisionales de obra y conexiones definitivas de EPM de la etapa 1', { ...E1('2026-02-17', '2027-06-25'), a: ['2026-03-17', null], fc: [null, '2027-08-06'], loe: true, deps: ['K01'], cost: 575, k: 'ind', cap: 'spo', resp: ROLE.con, cat: 'Otros', doc: 'EPM', f: 1.05 });
  A('S02', 'w154', 'Supervisión técnica independiente de la etapa 1 (Ley 1796 de 2016)', { ...E1('2026-02-17', '2027-06-30'), a: ['2026-03-17', null], fc: [null, '2027-08-13'], loe: true, deps: ['K01'], cost: 283, k: 'ind', cap: 'sti', resp: ROLE.sup, res: res([RS.sup, 0.5]), cat: 'Subcontratos', doc: 'FE' });
  A('S03', 'w154', 'Interventoría técnica, administrativa y financiera del banco y la fiduciaria', { ...E1('2026-02-17', '2028-09-01'), a: ['2026-03-17', null], fc: [null, '2029-01-29'], loe: true, deps: ['K01'], cost: 473, k: 'ind', cap: 'itv', resp: ROLE.int, cat: 'Subcontratos', doc: 'FE' });

  /* 1.5 Construcción — etapa 2 (LB0 = LB1). Bloque C: fechas del bloque A + 357 días; bloque D: del bloque B + 378 días. */
  A('P02', 'w154', 'Pólizas de la etapa 2: todo riesgo construcción, RCE, cumplimiento y amparo patrimonial', { p: ['2027-02-08', '2027-02-13'], deps: ['C10'], cost: 284, k: 'ind', cap: 'pol', resp: ROLE.est });
  M('L01', 'w1521', 'Acta de inicio de obra de la etapa 2', { p: '2027-02-15', deps: ['P02', 'C10', 'D16'], resp: ROLE.ger });
  A('L02', 'w1521', 'Preliminares de la etapa 2: adecuación del campamento, cerramiento y topografía', { p: ['2027-02-16', '2027-03-05'], deps: ['L01'], cost: 681, k: 'dir', cap: { pre: 681 }, st: 'E2', resp: ROLE.con, res: res([RS.res, 1], [RS.cim, 1]) });
  A('L03', 'w1521', 'Movimiento de tierras y contención de la etapa 2', { p: ['2027-02-22', '2027-04-30'], deps: ['L02:SS+5'], cost: 2340, k: 'dir', cap: { tie: 2340 }, st: 'E2', resp: ROLE.con, res: res([RS.tie, 1]) });
  A('L04', 'w1521', 'Pilas pre-excavadas de la etapa 2 (bloques C y D y plataforma)', { p: ['2027-03-23', '2027-05-21'], deps: ['L03:SS+24'], cost: 2362, k: 'dir', cap: { cim: 2362 }, st: 'E2', resp: ROLE.con, res: res([RS.pil, 1], [RS.cim, 1]) });
  A('L05', 'w1521', 'Zapatas, dados y vigas de amarre de la etapa 2', { p: ['2027-04-19', '2027-06-18'], deps: ['L04:SS+24'], cost: 1575, k: 'dir', cap: { cim: 1575 }, st: 'E2', resp: ROLE.con, res: res([RS.cim, 1]) });
  A('L06', 'w1522', 'Estructura de la plataforma de parqueaderos de la etapa 2', { p: ['2027-05-03', '2027-07-23'], deps: ['L05:SS+12'], cost: 2601, k: 'dir', cap: { est: 2601 }, st: 'E2', resp: ROLE.con, res: res([RS.est2, 1]) });
  A('L07', 'w1522', 'Estructura del bloque C (8 pisos)', { p: ['2027-06-08', '2027-08-27'], deps: ['L06:SS+30'], cost: 4727, k: 'dir', cap: { est: 4727 }, st: 'E2', resp: ROLE.con, res: res([RS.est2, 1], [RS.for, 1], [RS.gru, 1]) });
  M('L08', 'w1522', 'Fin de la estructura del bloque C', { p: '2027-08-27', deps: ['L07'], resp: ROLE.con });
  A('L09', 'w1522', 'Estructura del bloque D (8 pisos)', { p: ['2027-08-09', '2027-10-29'], deps: ['L07:SS+48'], cost: 4727, k: 'dir', cap: { est: 4727 }, st: 'E2', resp: ROLE.con, res: res([RS.est2, 1], [RS.for, 1], [RS.gru, 1]) });
  M('L10', 'w1522', 'Fin de la estructura del bloque D', { p: '2027-10-29', deps: ['L09'], resp: ROLE.con });
  const C_ = (d) => sh(d, 357), D_ = (d) => sh(d, 378);
  A('L11', 'w1523', 'Mampostería del bloque C', { p: [C_('2026-08-10'), C_('2026-11-13')], deps: ['L07:SS+48'], cost: 970, k: 'dir', cap: { mam: 970 }, st: 'E2', resp: ROLE.con, res: res([RS.mam, 1]) });
  A('L12', 'w1523', 'Instalaciones hidrosanitarias, de gas y red contra incendio del bloque C', { p: [C_('2026-08-24'), C_('2026-12-18')], deps: ['L11:SS+12'], cost: 1360, k: 'dir', cap: { hid: 1360 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L13', 'w1523', 'Instalaciones eléctricas y de telecomunicaciones del bloque C', { p: [C_('2026-09-07'), C_('2027-01-15')], deps: ['L11:SS+24'], cost: 1473, k: 'dir', cap: { ele: 1473 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L14', 'w1524', 'Cubierta e impermeabilización del bloque C', { p: [C_('2026-09-07'), C_('2026-10-09')], deps: ['L08'], cost: 448, k: 'dir', cap: { cub: 448 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L15', 'w1524', 'Fachada, ventanería y barandas del bloque C', { p: [C_('2026-11-17'), C_('2027-02-26')], deps: ['L11', 'L14'], cost: 1244, k: 'dir', cap: { met: 896, fac: 348 }, st: 'E2', resp: ROLE.con, res: res([RS.fac, 1]) });
  A('L16', 'w1525', 'Pañetes, estucos y pintura del bloque C', { p: [C_('2026-10-20'), C_('2027-02-12')], deps: ['L11:SS+30', 'L12:SS'], cost: 846, k: 'dir', cap: { pan: 846 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L17', 'w1525', 'Pisos y enchapes del bloque C', { p: [C_('2026-11-17'), C_('2027-03-19')], deps: ['L16:SS+24'], cost: 1027, k: 'dir', cap: { pis: 1027 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L18', 'w1525', 'Carpintería de madera, aparatos sanitarios y cocinas del bloque C', { p: [C_('2027-01-18'), C_('2027-04-30')], deps: ['L17:SS+48', 'L13'], cost: 1148, k: 'dir', cap: { mad: 597, apa: 551 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L19', 'w1523', 'Mampostería del bloque D', { p: [D_('2026-09-21'), D_('2026-12-24')], deps: ['L09:SS+48'], cost: 971, k: 'dir', cap: { mam: 971 }, st: 'E2', resp: ROLE.con, res: res([RS.mam, 1]) });
  A('L20', 'w1523', 'Instalaciones hidrosanitarias, de gas y red contra incendio del bloque D', { p: [D_('2026-10-05'), D_('2027-01-29')], deps: ['L19:SS+12'], cost: 1361, k: 'dir', cap: { hid: 1361 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L21', 'w1523', 'Instalaciones eléctricas y de telecomunicaciones del bloque D', { p: [D_('2026-10-19'), D_('2027-02-26')], deps: ['L19:SS+24'], cost: 1473, k: 'dir', cap: { ele: 1473 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L22', 'w1524', 'Cubierta e impermeabilización del bloque D', { p: [D_('2026-10-19'), D_('2026-11-20')], deps: ['L10'], cost: 448, k: 'dir', cap: { cub: 448 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L23', 'w1524', 'Fachada, ventanería y barandas del bloque D', { p: [D_('2026-12-29'), D_('2027-04-16')], deps: ['L19', 'L22'], cost: 1245, k: 'dir', cap: { met: 896, fac: 349 }, st: 'E2', resp: ROLE.con, res: res([RS.fac, 1]) });
  A('L24', 'w1525', 'Pañetes, estucos y pintura del bloque D', { p: [D_('2026-12-01'), D_('2027-03-26')], deps: ['L19:SS+30', 'L20:SS'], cost: 846, k: 'dir', cap: { pan: 846 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L25', 'w1525', 'Pisos y enchapes del bloque D', { p: [D_('2026-12-29'), D_('2027-04-30')], deps: ['L24:SS+24'], cost: 1028, k: 'dir', cap: { pis: 1028 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L26', 'w1525', 'Carpintería de madera, aparatos sanitarios y cocinas del bloque D', { p: [D_('2027-03-01'), D_('2027-06-11')], deps: ['L25:SS+48', 'L21'], cost: 1148, k: 'dir', cap: { mad: 597, apa: 551 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  A('L27', 'w1523', 'Instalaciones y acabados de la plataforma de parqueaderos de la etapa 2', { p: [C_('2026-09-14'), C_('2027-01-29')], deps: ['L08:FS+7'], cost: 1110, k: 'dir', cap: { hid: 480, ele: 402, pis: 228 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L28', 'w1526', 'Equipos especiales de la etapa 2: ascensores, bombeo y detección de incendio', { p: [C_('2027-02-01'), C_('2027-05-21')], deps: ['L13:FS+12', 'L21:FF'], cost: 1588, k: 'dir', cap: { equ: 1588 }, st: 'E2', resp: ROLE.con, res: res([RS.ins, 1]) });
  A('L29', 'w1526', 'Aseo general, pruebas, recibo de redes de EPM y certificaciones RETIE y RITEL de la etapa 2', { p: [D_('2027-05-03'), D_('2027-06-25')], deps: ['L26:FF+12', 'L18', 'L28:FF', 'L23', 'L27', 'U11:FF'], cost: 237, k: 'dir', cap: { ase: 237 }, st: 'E2', resp: ROLE.con, res: res([RS.aca, 1]) });
  M('L30', 'w1526', 'Certificado técnico de ocupación de la etapa 2 (Ley 1796 de 2016)', { p: '2028-07-14', deps: ['L29'], resp: ROLE.sup });
  A('L31', 'w154', 'Administración de obra, SST y gastos generales de la etapa 2', { p: ['2027-02-16', '2028-07-07'], deps: ['L01'], loe: true, cost: 3072, k: 'dir', cap: { adm: 3072 }, st: 'E2', resp: ROLE.con, res: res([RS.dob, 0.5], [RS.res, 1], [RS.sst, 1]), notes: ADM_NOTE });
  A('S04', 'w154', 'Servicios públicos provisionales de obra y conexiones definitivas de EPM de la etapa 2', { p: ['2027-02-16', '2028-07-07'], deps: ['L01'], loe: true, cost: 575, k: 'ind', cap: 'spo', resp: ROLE.con });
  A('S05', 'w154', 'Supervisión técnica independiente de la etapa 2 (Ley 1796 de 2016)', { p: ['2027-02-16', '2028-07-14'], deps: ['L01'], loe: true, cost: 284, k: 'ind', cap: 'sti', resp: ROLE.sup, res: res([RS.sup, 0.5]) });

  /* 1.5 Urbanismo y cargas del plan parcial */
  A('U01', 'w1531', 'Vía colectora del plan parcial y andenes (fase 1)', { ...E1('2026-04-06', '2027-02-24'), a: ['2026-05-04', null], fc: [null, '2027-04-23'], deps: ['K03:SS+30'], cost: 3630, k: 'dir', cap: { urb: 3630 }, st: 'E1', resp: ROLE.con, res: res([RS.urb, 1]), f: 1.04 });
  A('U02', 'w1531', 'Mitigación vial exigida en la licencia: bahía de acceso, carril de desaceleración y semaforización (CC-002)', { b0: null, p: ['2026-10-05', '2027-01-29'], deps: ['U01:SS+120'], cost: 430, k: 'dir', cap: { urb: 430 }, st: 'E1', resp: ROLE.con, res: res([RS.urb, 1]), notes: 'Obligación del concepto de movilidad incorporada en la licencia; financiada con la reserva para contingencias (CC-002).' });
  A('U03', 'w1532', 'Redes externas de acueducto, alcantarillado, energía y gas de EPM (fase 1)', { ...E1('2026-04-21', '2026-12-18'), a: ['2026-05-19', null], fc: [null, '2027-02-27'], deps: ['U01:SS+12'], cost: 1500, k: 'dir', cap: { urb: 1500 }, st: 'E1', resp: ROLE.con, res: res([RS.urb, 1]), f: 1.03 });
  A('U04', 'w1533', 'Restauración y protección del retiro de la quebrada', { ...E1('2026-06-02', '2026-08-28'), a: ['2026-06-30', '2026-09-26'], deps: ['K03:SS+66'], cost: 230, k: 'dir', cap: { urb: 230 }, st: 'E1', resp: ROLE.con, f: 1.06 });
  A('U05', 'w1533', 'Parque de cesión, etapa 1: senderos, iluminación y zona de juegos', { ...E1('2027-01-18', '2027-04-30'), deps: ['U02:FS+12', 'U03'], cost: 528, k: 'dir', cap: { urb: 528 }, st: 'E1', resp: ROLE.con, res: res([RS.urb, 1]) });
  A('U06', 'w1534', 'Urbanismo interno, paisajismo y dotación de zonas comunes de la etapa 1', { ...E1('2027-03-08', '2027-06-18'), deps: ['K15:FS+6'], cost: 625, k: 'dir', cap: { pai: 625 }, st: 'E1', resp: ROLE.con, res: res([RS.urb, 1]) });
  A('U07', 'w1531', 'Vías locales y andenes (fase 2)', { p: ['2027-09-06', '2028-03-31'], deps: ['L09:SS+24'], cost: 1400, k: 'dir', cap: { urb: 1400 }, st: 'E2', resp: ROLE.con, res: res([RS.urb, 1]) });
  A('U08', 'w1532', 'Redes externas de EPM (fase 2)', { p: ['2027-09-06', '2028-02-25'], deps: ['U07:SS'], cost: 850, k: 'dir', cap: { urb: 850 }, st: 'E2', resp: ROLE.con, res: res([RS.urb, 1]) });
  A('U09', 'w1533', 'Parque de cesión, etapa 2: canchas, plazoleta y arborización', { p: ['2028-01-11', '2028-05-26'], deps: ['U07:SS+108'], cost: 1182, k: 'dir', cap: { urb: 1182 }, st: 'E2', resp: ROLE.con, res: res([RS.urb, 1]) });
  A('U10', 'w1533', 'Equipamiento público (416 m² construidos para entregar al Distrito)', { p: ['2027-10-04', '2028-05-26'], deps: ['L09:SS+48'], cost: 1373, k: 'dir', cap: { urb: 1373 }, st: 'E2', resp: ROLE.con, res: res([RS.est2, 0.5]) });
  A('U11', 'w1534', 'Urbanismo interno, paisajismo y dotación de zonas comunes de la etapa 2', { p: ['2028-03-06', '2028-06-30'], deps: ['L15:FS+6', 'L23:FF'], cost: 625, k: 'dir', cap: { pai: 625 }, st: 'E2', resp: ROLE.con, res: res([RS.urb, 1]) });

  /* 1.6 Entrega, escrituración y cierre */
  A('Z01', 'w161', 'Entregas de vivienda de la etapa 1 (208 unidades)', { ...E1('2027-07-01', '2027-09-30'), deps: ['K30'], resp: ROLE.con, res: res([RS.res, 1]) });
  A('Z02', 'w161', 'Entregas de vivienda de la etapa 2 (208 unidades)', { p: ['2028-07-17', '2028-09-29'], deps: ['L30'], resp: ROLE.con, res: res([RS.res, 1]) });
  A('Z03', 'w162', 'Reglamento de propiedad horizontal: elaboración, escritura y registro (Ley 675 de 2001)', { ...E1('2027-04-01', '2027-06-25'), deps: ['K29:FF'], cost: 40, k: 'ind', cap: 'not', resp: ROLE.abo, res: res([RS.abo, 0.5]) });
  A('Z04', 'w162', 'Administración provisional de la copropiedad', { b0: ['2027-07-01', '2028-11-30'], p: ['2027-07-29', '2028-11-30'], deps: ['K30'], loe: true, cost: 210, k: 'ind', cap: 'ph', resp: ROLE.ger });
  A('Z05', 'w162', 'Entrega de zonas comunes a la copropiedad (asamblea y consejo de administración)', { p: ['2028-10-02', '2028-11-30'], deps: ['Z02'], resp: ROLE.ger });
  A('Z06', 'w163', 'Entrega de cesiones y obras de urbanismo al Distrito', { p: ['2028-10-02', '2029-01-31'], deps: ['Z02', 'U09', 'U10', 'U07'], resp: ROLE.ger });
  A('Z07', 'w164', 'Atención de posventas y garantías (Ley 1480 de 2011)', { b0: ['2027-07-01', '2029-03-16'], p: ['2027-07-29', '2029-03-16'], fc: [null, '2029-06-15'], deps: ['K30'], loe: true, cost: 756, k: 'ind', cap: 'pos', resp: ROLE.con });
  A('Z08', 'w165', 'Liquidación del encargo, del patrimonio autónomo y del crédito constructor', { p: ['2029-01-15', '2029-03-16'], deps: ['C13:FS+22', 'E22'], resp: ROLE.est });
  M('Z09', 'w165', 'Fideicomiso y crédito constructor liquidados', { p: '2029-03-16', deps: ['Z08'], resp: ROLE.fid });
  A('Z10', 'w165', 'Informe final, lecciones aprendidas y archivo del proyecto', { p: ['2029-02-01', '2029-03-27'], deps: ['Z06', 'Z05', 'Z09:FF+8'], resp: ROLE.ger, res: res([RS.ger, 0.5]) });
  M('Z11', 'w165', 'Acta de cierre del proyecto', { p: END, deps: ['Z10', 'Z09', 'Z05'], resp: ROLE.jun });

  /* ---------------------------------------------------------------- ventas por mes (unidades netas de desistimientos)
     [mes, etapa 1, etapa 2] — etapa 1: punto de equilibrio (156) el 27 de febrero de 2026; 196 vendidas al corte.
     Etapa 2: lanzada el 2 de marzo de 2026; 78 vendidas al corte. */
  const SALES = [
    ['2025-07', 24, 0], ['2025-08', 22, 0], ['2025-09', 21, 0], ['2025-10', 20, 0], ['2025-11', 18, 0], ['2025-12', 12, 0],
    ['2026-01', 19, 0], ['2026-02', 20, 0], ['2026-03', 9, 16], ['2026-04', 8, 12], ['2026-05', 7, 11], ['2026-06', 6, 10],
    ['2026-07', 4, 10], ['2026-08', 3, 9], ['2026-09', 3, 10],
  ];
  const salesCum = (month) => { let e1 = 0, e2 = 0; for (const [m, a, b] of SALES) if (m <= month) { e1 += a; e2 += b; } return { e1, e2 }; };
  const SALES_PROGRESS = {
    C04: (c) => Math.min(100, Math.round((100 * c.e1) / 156)),
    C11: (c) => Math.max(0, Math.min(100, Math.round((100 * (c.e1 - 156)) / 52))),
    C07: (c) => Math.min(100, Math.round((100 * c.e2) / 125)),
  };

  /* ---------------------------------------------------------------- calendario y solución de fechas */
  const byDef = new Map(DEFS.map((d) => [d.id, d]));
  const cal = PM.cal.make(SETTINGS, START);
  const nextWork = (d) => { let x = d; for (let i = 0; i < 30 && !cal.isWork(x); i++) x = D.add(x, 1); return x; };
  const prevWork = (d) => { let x = d; for (let i = 0; i < 30 && !cal.isWork(x); i++) x = D.add(x, -1); return x; };
  const parseDep = (s) => { const m = /^([A-Z0-9]+)(?::(FS|SS|FF|SF))?(?:([+-]\d+))?$/.exec(s); return { id: m[1], type: m[2] || 'FS', lag: m[3] ? Number(m[3]) : null }; };
  /* fechas de una versión: 'lb0' | 'lb1' → {s, f} normalizadas o null si la actividad no existe en esa versión */
  function datesOf(def, ver) {
    let v;
    if (ver === 'lb0') { if (def.b0 === null) return null; if (def.lb1 === false && def.b0 === undefined) return null; v = def.b0 !== undefined ? def.b0 : def.p; }
    else { if (def.lb1 === false) return null; v = def.p; }
    if (v === undefined || v === null) return null;
    if (def.ms) { const m = prevWork(Array.isArray(v) ? v[0] : v); return { s: m, f: m }; }
    return { s: nextWork(v[0]), f: prevWork(v[1]) };
  }
  const isAnchorMs = (def, dt) => def.ms && dt.s === START && !(def.deps || []).length;
  /* índices CPM [es, ef) de unas fechas */
  const idxOf = (def, dt) => {
    if (def.ms) { const e = isAnchorMs(def, dt) ? 0 : cal.indexOf(dt.s) + 1; return { es: e, ef: e }; }
    return { es: cal.indexOf(dt.s), ef: cal.indexOf(dt.f) + 1 };
  };
  /* desfase exacto que deja la actividad en sus fechas */
  const exactLag = (type, p, t) => (type === 'FS' ? t.es - p.ef : type === 'SS' ? t.es - p.es : type === 'FF' ? t.ef - p.ef : t.ef - p.es);
  const lagWarnings = [];
  function solveVersion(ver, getDates) {
    const tasks = [];
    for (const def of DEFS) {
      const dt = getDates(def);
      if (!dt) continue;
      const ti = idxOf(def, dt);
      const deps = [];
      (def.deps || []).forEach((raw) => {
        const dp = parseDep(raw);
        const pdef = byDef.get(dp.id);
        const pdt = pdef && getDates(pdef);
        if (!pdt) return;
        const ex = exactLag(dp.type, idxOf(pdef, pdt), ti);
        let lag;
        if (!deps.length && !def.fix) lag = ex;
        else { lag = dp.lag !== null ? dp.lag : 0; if (lag > ex) lag = ex; }
        if (lag < 0) lagWarnings.push(ver + ' ' + def.id + ' ← ' + raw + ' desfase ' + lag);
        deps.push({ id: dp.id, type: dp.type, lag });
      });
      tasks.push({ def, dt, deps, duration: def.ms ? 0 : cal.countWork(dt.s, dt.f) });
    }
    return tasks;
  }
  const lb1Dates = (def) => datesOf(def, 'lb1');
  const lb0Dates = (def) => datesOf(def, 'lb0');
  const solvedLb1 = solveVersion('lb1', lb1Dates);
  const solvedLb0 = solveVersion('lb0', lb0Dates);
  const lb1ById = new Map(solvedLb1.map((x) => [x.def.id, x]));

  /* ---------------------------------------------------------------- costos por actividad (millones → COP) */
  const costOf = (def, ver) => (ver === 'lb0' && def.cost0 !== undefined ? def.cost0 : def.cost || 0);
  const isLoe = (def) => !!def.loe;
  const plannedPct = (def, at) => { const dt = lb1Dates(def); if (!dt) return 0; return 100 * PM.calc.plannedFraction(cal, dt.s, dt.f, def.ms, at); };

  /* avance al corte de una actividad en curso: dato (prog) o, con fin pronosticado, el tiempo transcurrido sobre la duración
     re-estimada; así la actualización a la fecha de corte (remanente = duración × (1 − avance)) llega al mismo fin */
  const elapsedOf = (def) => cal.countWork(def.a[0], STATUS_DATE);
  const curProgress = (def) => {
    if (def.prog !== undefined) return def.prog;
    if (def.fc) return Math.max(1, Math.min(99, Math.round((100 * elapsedOf(def)) / Math.max(1, cal.countWork(def.a[0], prevWork(def.fc[1]))))));
    return 0;
  };
  const monthOf = (d) => d.slice(0, 7);
  function progressAt(def, at) {
    const a = def.a;
    if (!a || !a[0] || a[0] > at) return 0;
    if (def.sales) return SALES_PROGRESS[def.sales](salesCum(monthOf(at)));
    if (def.ms) return a[0] <= at ? 100 : 0;
    if (a[1] && a[1] <= at) return 100;
    if (isLoe(def)) return Math.max(1, Math.min(99, Math.round(plannedPct(def, at))));
    if (a[1]) return Math.max(1, Math.min(99, Math.round((100 * cal.countWork(a[0], at)) / Math.max(1, cal.countWork(a[0], a[1])))));
    const now = curProgress(def);
    if (at >= STATUS_DATE) return now;
    return Math.max(0, Math.min(now, Math.round((now * cal.countWork(a[0], at)) / Math.max(1, cal.countWork(a[0], STATUS_DATE)))));
  }
  const progressNow = (def) => progressAt(def, STATUS_DATE);

  /* ---------------------------------------------------------------- versiones del plan */
  const taskOut = (x, extra) => ({
    id: x.def.id, name: x.def.name, wbsId: x.def.wbsId || null,
    duration: x.duration, milestone: !!x.def.ms,
    start: x.def.fix ? x.dt.s : null,
    deps: x.deps.map((d) => ({ ...d })),
    progress: 0, cost: 0, resources: (x.def.res || []).map((r) => ({ ...r })),
    responsible: x.def.resp || '', actualStart: null, actualFinish: null, notes: '',
    ...extra,
  });
  const scheduleSettings = () => ({ ...SETTINGS, extraHolidays: [], resourceLimits: { ...RESOURCE_LIMITS } });
  const planData = (ver) => {
    const solved = ver === 'lb0' ? solvedLb0 : solvedLb1;
    return { settings: scheduleSettings(), tasks: solved.map((x) => taskOut(x, { cost: costOf(x.def, ver) * MM })) };
  };

  /* Plan vigente con avance: dependencias y desfases de la LB1; duraciones reales, re-estimadas o de la LB1. */
  function currentData() {
    const tasks = [];
    const pending = [];
    for (const def of DEFS) {
      let x = lb1ById.get(def.id);
      if (!x) {
        /* actividad posterior a la LB1 (cambio aprobado): fechas reales */
        const dt = { s: def.a[0], f: def.a[1] || def.a[0] };
        const ti = idxOf(def, dt);
        /* desfase respecto a las fechas reales del predecesor (o a las de la LB1 si aún no las tiene) */
        const realOrPlan = (pdef) => { const p = lb1Dates(pdef); const r = pdef.a || []; return { s: r[0] || p.s, f: r[1] || p.f }; };
        const deps = (def.deps || []).map(parseDep).filter((dp) => byDef.has(dp.id) && lb1Dates(byDef.get(dp.id)))
          .map((dp) => ({ id: dp.id, type: dp.type, lag: exactLag(dp.type, idxOf(byDef.get(dp.id), realOrPlan(byDef.get(dp.id))), ti) }));
        x = { def, dt, deps, duration: def.ms ? 0 : cal.countWork(dt.s, dt.f) };
      }
      const a = def.a || null;
      const prog = progressNow(def);
      let duration = x.duration;
      if (!def.ms && a && a[0] && a[1]) duration = cal.countWork(a[0], a[1]);
      else if (!def.ms && a && a[0]) {
        /* en curso: hasta el fin pronosticado o, sin él, al ritmo observado (transcurrido / avance) */
        if (def.fc) duration = cal.countWork(a[0], prevWork(def.fc[1]));
        else if (!def.loe && prog > 0) duration = Math.max(elapsedOf(def) + 1, Math.round((elapsedOf(def) * 100) / prog));
      } else if (!def.ms && def.fc) {
        if (def.fc[0]) duration = cal.countWork(nextWork(def.fc[0]), prevWork(def.fc[1]));
        else pending.push(def.id);
      }
      const t = taskOut(x, {
        duration,
        cost: (def.cost || 0) * MM,
        progress: prog,
        actualStart: a && a[0] && a[0] <= STATUS_DATE ? a[0] : null,
        actualFinish: a && a[1] && a[1] <= STATUS_DATE && prog >= 100 ? a[1] : null,
        notes: def.notes || '',
      });
      tasks.push(t);
    }
    const data = { settings: scheduleSettings(), tasks };
    if (pending.length) {
      /* re-estimaciones con inicio calculado: la duración llega hasta el fin pronosticado */
      const sched = PM.calc.computeSchedule(data, START, STATUS_DATE);
      for (const id of pending) {
        const t = tasks.find((x) => x.id === id);
        const s = sched.byId.get(id).startDate;
        t.duration = Math.max(1, cal.countWork(s, prevWork(byDef.get(id).fc[1])));
      }
    }
    return data;
  }

  /* ---------------------------------------------------------------- EDT y diccionario */
  const wbsNodes = (tasks, plan) => {
    const costByWbs = {};
    for (const t of tasks) if (t.wbsId) costByWbs[t.wbsId] = (costByWbs[t.wbsId] || 0) + (Number(t.cost) || 0);
    const parents = new Set(WBS.map((w) => w[1]).filter(Boolean));
    const order = {};
    return WBS.map(([id, parentId, name, kind, responsible, description, deliverable, acceptance, notes, lb0]) => {
      const k = parentId || 'root'; order[k] = (order[k] || 0) + 1;
      const leaf = !parents.has(id);
      const node = { id, parentId, name, order: order[k], kind, description, responsible, deliverable, acceptance, costEstimate: leaf ? costByWbs[id] || 0 : null, notes: plan ? '' : notes || '' };
      return plan === 'lb0' && lb0 ? { ...node, ...lb0 } : node;
    });
  };

  /* ---------------------------------------------------------------- cortes de avance (mensuales) y costos reales */
  const monthEnds = () => {
    const out = [];
    let d = D.endOfMonth(START);
    while (d < STATUS_DATE) { out.push(d); d = D.endOfMonth(D.add(d, 1)); }
    out.push(STATUS_DATE);
    return out;
  };
  const MONTH_NAME = (iso) => PM.MONTHS_LONG[+iso.slice(5, 7) - 1] + ' de ' + iso.slice(0, 4);
  const CUT_NOTES = {
    '2025-01': 'Proyecto constituido el 13 de enero; debida diligencia del lote y estudio de mercado en curso.',
    '2025-02': 'Promesa de compraventa del lote firmada el 28 de febrero con arras del 20 % (COP 3.000 millones).',
    '2025-03': 'Factibilidad y anteproyecto en curso; gestión de la unidad de actuación con el DAP.',
    '2025-04': 'Decisión de inversión y LB0 el 22 de abril; escritura del lote y aporte al patrimonio autónomo el 30 de abril.',
    '2025-05': 'Registro del lote libre de gravámenes (impuesto y derechos de registro y notaría: COP 260 millones); inicio del proyecto arquitectónico y de la sala de ventas.',
    '2025-06': 'Encargo fiduciario de preventas firmado y documentos para anunciar y enajenar radicados ante la Secretaría de Gestión y Control Territorial el 13 de junio.',
    '2025-07': 'Lanzamiento de la etapa 1 el 7 de julio (24 viviendas en el mes); obligación VIP compensada el 18 de julio.',
    '2025-08': 'Licencia radicada en legal y debida forma el 4 de agosto.',
    '2025-09': 'Ventas de la etapa 1 en 67 viviendas; CC-001 (cambio de mezcla) rechazado.',
    '2025-10': 'Acta de observaciones de la curaduría (INC-001); estudio de movilidad aprobado con obras de mitigación.',
    '2025-11': 'Correcciones de la licencia radicadas el 28 de noviembre.',
    '2025-12': 'Licencia ejecutoriada el 15 de diciembre (dos semanas tarde); diciembre con ventas bajas.',
    '2026-01': 'Diseños de redes aprobados por EPM (INC-002 cerrado); punto de equilibrio de la etapa 1 sin cumplir en la fecha planeada (INC-003).',
    '2026-02': 'Crédito de la etapa 1 aprobado el 13 de febrero; punto de equilibrio declarado el 27 de febrero.',
    '2026-03': 'CC-002 aprobado y LB1 establecida el 13 de marzo; acta de inicio de obra de la etapa 1 el 16 de marzo; lanzamiento de la etapa 2.',
    '2026-04': 'Preliminares terminados; movimiento de tierras afectado por lluvias.',
    '2026-05': 'Deslizamiento del talud oriental el 7 de mayo (INC-004); contención adicional aprobada con el CC-003.',
    '2026-06': 'Pilas y estructura de la plataforma en curso; restauración del retiro de la quebrada iniciada.',
    '2026-07': 'Movimiento de tierras terminado el 17 de julio (tres semanas tarde); primer desembolso del crédito constructor.',
    '2026-08': 'Cimentación terminada el 21 de agosto; cilindros del piso 3 del bloque A bajo el límite de control (INC-005).',
    '2026-09': 'Corte del 30 de septiembre: plataforma terminada, bloque A en el piso 6 y bloque B al 30 %; ventas de 274 viviendas.',
  };
  /* estado completo de avance en cada corte; se guardan solo los cambios (como 50-evm) */
  function statusUpdates() {
    const cuts = monthEnds();
    let prev = {};
    const out = [];
    cuts.forEach((date, i) => {
      const full = {};
      for (const def of DEFS) { const p = progressAt(def, date); if (p > 0) full[def.id] = p; }
      const delta = {};
      for (const k of Object.keys(full)) if (full[k] !== (prev[k] || 0)) delta[k] = full[k];
      prev = full;
      out.push({ id: 'su' + String(i + 1).padStart(2, '0'), date, progress: delta, note: 'Corte de ' + MONTH_NAME(date) + '. ' + (CUT_NOTES[date.slice(0, 7)] || '') });
    });
    return out;
  }

  /* costos reales: valor ganado de cada actividad × factor de costo, repartido según el avance de cada corte */
  const CAT_SPLIT = {
    dir: [['Materiales', 0.55], ['Subcontratos', 0.45]],
    adm: [['Mano de obra', 0.7], ['Equipos', 0.3]],
    urb: [['Subcontratos', 0.6], ['Materiales', 0.4]],
  };
  const DOC_BASE = { FE: 20410, OC: 3100, NOM: 0, COM: 500, FID: 0, BCO: 0, POL: 0, LIC: 0, ESC: 0, PROM: 0, ISV: 0, EPM: 0 };
  const lastOfficeDay = (d) => { let x = d; for (let i = 0; i < 10; i++) { const w = D.dow(x); if (w !== 0 && w !== 6 && cal.isWork(x)) return x; x = D.add(x, -1); } return x; };
  function actualsData() {
    const cuts = monthEnds();
    const counters = { ...DOC_BASE };
    const rows = [];
    const docRef = (prefix, date, def) => {
      if (prefix === 'NOM') return 'NOM-' + date.slice(0, 7);
      if (prefix === 'FID') return 'FID-' + date.slice(0, 7).replace('-', '');
      if (prefix === 'BCO') return 'BCO-' + date.slice(0, 7).replace('-', '');
      if (prefix === 'ESC') return 'ESC-1532-2025';
      if (prefix === 'PROM') return 'PROM-2025-001';
      if (prefix === 'ISV') return 'ISV-2025-078';
      if (prefix === 'LIC') return 'LIC-' + date.slice(0, 7).replace('-', '');
      if (prefix === 'POL') return 'POL-2026-' + def.id;
      if (prefix === 'EPM') return 'EPM-' + date.slice(0, 7).replace('-', '');
      counters[prefix] = (counters[prefix] || 0) + 1;
      return prefix + '-' + String(counters[prefix]).padStart(5, '0');
    };
    for (const def of DEFS) {
      const prog = progressNow(def);
      if (!prog || !def.cost) continue;
      const budget = def.cost * MM;
      const total = Math.round((budget * prog / 100) * (def.f || 1) / 1000) * 1000;
      const inc = [];
      let prevP = 0;
      for (const c of cuts) { const p = progressAt(def, c); if (p > prevP) { inc.push([def.ms ? def.a[0] : c, p - prevP]); prevP = p; } }
      if (!inc.length) continue;
      let acc = 0;
      inc.forEach(([date, dp], i) => {
        const amount = i === inc.length - 1 ? total - acc : Math.round((total * dp) / prog / 1000) * 1000;
        acc += amount;
        const when = def.ms ? date : lastOfficeDay(date === STATUS_DATE ? STATUS_DATE : date);
        const period = def.ms ? '' : ': ' + MONTH_NAME(date);
        const split = def.k === 'dir' ? (def.cap && def.cap.adm ? CAT_SPLIT.adm : def.cap && def.cap.urb ? CAT_SPLIT.urb : def.id === 'K03C' ? [['Subcontratos', 1]] : CAT_SPLIT.dir) : [[def.cat || 'Otros', 1]];
        let left = amount;
        split.forEach(([cat, share], j) => {
          const v = j === split.length - 1 ? left : Math.round((amount * share) / 1000) * 1000;
          left -= v;
          const prefix = def.k === 'dir' ? (cat === 'Materiales' ? 'OC' : cat === 'Mano de obra' ? 'NOM' : 'FE') : def.doc || 'FE';
          rows.push({ date: when, taskId: def.id, category: cat, description: def.name + period + (split.length > 1 ? ' (' + cat.toLowerCase() + ')' : ''), document: docRef(prefix, when, def), amount: v });
        });
      });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.taskId.localeCompare(b.taskId) || a.category.localeCompare(b.category));
    return rows.map((r, i) => ({ id: 'ac' + String(i + 1).padStart(3, '0'), date: r.date, amount: r.amount, taskId: r.taskId, wbsId: byDef.get(r.taskId).wbsId, category: r.category, description: r.description, document: r.document }));
  }
  const costsData = () => ({ actuals: actualsData(), statusUpdates: statusUpdates(), reserves: { ...RESERVES } });

  /* ---------------------------------------------------------------- matriz RACI */
  const RACI_ROLES = [
    ['rol-jun', 'Junta directiva / promotor'], ['rol-ger', 'Gerente de proyecto'], ['rol-est', 'Estructurador financiero'], ['rol-com', 'Gerente comercial'],
    ['rol-arq', 'Arquitecto diseñador'], ['rol-ies', 'Ingeniero estructural'], ['rol-con', 'Constructor / director de obra'],
    ['rol-sup', 'Interventoría / supervisión técnica independiente'], ['rol-fid', 'Fiduciaria'], ['rol-ban', 'Banco (crédito constructor)'], ['rol-cur', 'Curaduría urbana'],
  ];
  /* celdas en el orden de RACI_ROLES; '' = sin asignación */
  const RACI = {
    w11: ['A', 'R', 'C', 'C', 'I', 'I', 'C', 'I', 'I', 'I', ''],
    w111: ['A', 'R', 'C', 'C', 'C', '', 'C', '', 'I', 'I', ''],
    w112: ['I', 'RA', 'C', 'C', '', '', 'R', 'C', 'I', 'I', ''],
    w113: ['I', 'A', 'R', '', '', '', '', '', 'C', '', ''],
    w12: ['A', 'R', 'R', 'C', 'C', '', '', '', 'C', 'C', ''],
    w121: ['A', 'R', 'C', '', '', '', '', '', 'C', '', ''],
    w122: ['A', 'C', 'R', 'R', 'C', '', 'C', '', '', '', ''],
    w123: ['I', 'A', 'C', '', 'R', '', '', '', '', '', 'I'],
    w124: ['A', 'C', 'R', '', '', '', '', '', 'R', 'R', ''],
    w13: ['I', 'A', '', 'C', 'R', 'R', 'C', 'C', '', '', 'C'],
    w131: ['', 'A', '', 'C', 'R', 'C', 'C', '', '', '', ''],
    w132: ['', 'A', '', '', 'C', 'R', 'C', 'C', '', '', ''],
    w133: ['', 'A', '', '', 'R', 'C', 'C', '', '', '', ''],
    w134: ['', 'A', '', '', 'R', '', 'C', '', '', '', 'I'],
    w135: ['I', 'A', '', '', 'R', 'C', '', '', 'I', 'I', 'R'],
    w136: ['', 'A', '', '', 'R', 'R', 'C', 'C', '', '', ''],
    w14: ['I', 'A', 'C', 'R', '', '', '', '', 'C', '', ''],
    w141: ['', 'A', '', 'R', 'C', '', 'C', '', '', '', ''],
    w142: ['', 'C', '', 'RA', '', '', '', '', '', '', ''],
    w143: ['I', 'A', 'C', 'R', '', '', '', '', 'R', 'C', ''],
    w144: ['I', 'A', 'C', 'R', '', '', '', '', 'R', 'C', ''],
    w145: ['', 'I', '', 'RA', '', '', '', '', 'C', '', ''],
    w146: ['', 'A', 'C', 'R', '', '', '', '', 'R', 'R', ''],
    w15: ['I', 'A', '', '', 'C', 'C', 'R', 'C', 'I', 'I', ''],
    w151: ['', 'A', '', '', 'C', 'C', 'R', 'C', '', 'I', ''],
    w152: ['', 'A', '', '', 'C', 'C', 'R', 'C', '', 'I', ''],
    w153: ['', 'A', '', '', 'C', '', 'R', 'I', '', '', 'I'],
    w154: ['', 'A', 'C', '', '', '', 'R', 'R', 'C', 'C', ''],
    w16: ['A', 'R', '', 'R', '', '', 'R', '', 'C', 'C', ''],
    w161: ['', 'A', '', 'C', '', '', 'R', 'C', '', '', ''],
    w162: ['', 'RA', '', 'C', '', '', 'C', '', 'I', '', ''],
    w163: ['', 'A', '', '', 'C', '', 'R', '', '', '', 'I'],
    w164: ['', 'A', '', 'C', '', '', 'R', '', '', '', ''],
    w165: ['A', 'R', 'R', '', '', '', '', '', 'R', 'C', ''],
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
      ['Rotación de oficiales de formaleta y de excavación', ['Alza del salario mínimo de 2026 (+23 %) y ofertas de otras obras', 'Curva de aprendizaje del sistema industrializado']],
      ['Frente de tierras con un solo turno en temporada de lluvias', []],
    ]],
    ['Método', [
      ['Excavación de la terraza oriental programada en temporada de lluvias', ['Programa de obra de la LB0 sin holgura para la temporada de abril y mayo', 'Inicio de obra reprogramado cuatro semanas (CC-002)']],
      ['Cortes del talud abiertos sin protección provisional', ['Plástico y drenajes provisionales instalados tarde']],
    ]],
    ['Maquinaria', [
      ['Un solo equipo de perforación de pilas', ['Equipo adicional disponible solo en julio']],
      ['Volquetas restringidas por el plan de manejo de tránsito', ['Horario de cargue de 7:00 a 16:00']],
    ]],
    ['Materiales', [
      ['Llegada irregular del concreto premezclado en las tardes de lluvia', ['Rutas de acceso con barro']],
      ['Acero de refuerzo de las pilas con entregas parciales', []],
    ]],
    ['Medición', [
      ['Inclinómetros instalados después de iniciar la excavación', ['Lecturas semanales en lugar de diarias en la temporada de lluvias']],
      ['Avance de tierras medido por volumen y no por terrazas liberadas', []],
    ]],
    ['Medio ambiente', [
      ['Lluvias de abril y mayo de 2026 por encima del promedio', ['Deslizamiento superficial del talud oriental el 7 de mayo (INC-004)']],
      ['Nivel freático alto en la zona de la plataforma', ['Bombeo permanente en la excavación de pilas']],
    ]],
  ];
  /* jornadas perdidas por causa: cada jornada perdida es un caso del Pareto */
  const PARETO_DIAS = [
    ['Lluvias que impidieron excavar o vaciar', 21], ['Deslizamiento del talud oriental y contención adicional', 15], ['Espera de concreto premezclado', 7],
    ['Rotación de oficiales y personal nuevo', 5], ['Espera de acero de refuerzo', 3], ['Restricción de horario de volquetas', 2], ['Daños de equipos', 1],
  ];
  /* resistencia a 28 días (MPa) de los cilindros de concreto de muros y losas, f'c = 28 MPa; el ensayo del 2026-08-12 (piso 3 del bloque A) está fuera de control */
  const CONCRETO = [
    ['2026-06-02', 33.1], ['2026-06-09', 32.4], ['2026-06-16', 34.0], ['2026-06-23', 33.6], ['2026-06-30', 32.2],
    ['2026-07-07', 33.8], ['2026-07-11', 32.9], ['2026-07-16', 34.3], ['2026-07-22', 33.0], ['2026-07-28', 32.6],
    ['2026-08-01', 33.5], ['2026-08-05', 34.1], ['2026-08-12', 25.1], ['2026-08-15', 32.8], ['2026-08-19', 33.4],
    ['2026-08-24', 32.7], ['2026-08-27', 33.9], ['2026-08-31', 34.4], ['2026-09-04', 33.2], ['2026-09-09', 32.5],
    ['2026-09-12', 33.7], ['2026-09-17', 34.2], ['2026-09-21', 33.0], ['2026-09-25', 32.8], ['2026-09-29', 33.6],
  ];
  const CONCRETO_NOTES = { '2026-08-12': 'Piso 3 del bloque A: cilindros curados al sol en obra (INC-005); núcleos extraídos con 29,4 MPa (conformes, NSR-10 C.5.6.5).' };
  const qualityData = () => ({
    ishikawa: [{
      id: 'ish-1',
      name: 'Atraso del movimiento de tierras y de la cimentación de la etapa 1',
      effect: 'Movimiento de tierras terminado el 17 de julio (tres semanas tarde frente a la LB1) y cimentación el 21 de agosto (dos semanas tarde)',
      categories: ISHIKAWA.map(([name, causes], ci) => ({
        id: 'ish-1-c' + (ci + 1), name,
        causes: causes.map(([text, subs], ki) => ({ id: 'ish-1-c' + (ci + 1) + '-' + (ki + 1), text, sub: subs.map((s, si) => ({ id: 'ish-1-c' + (ci + 1) + '-' + (ki + 1) + '-' + (si + 1), text: s })) })),
      })),
    }],
    pareto: [
      { id: 'par-1', name: 'Jornadas perdidas en la etapa 1 por causa, marzo a septiembre de 2026 (un caso = una jornada)', source: 'manual', items: PARETO_DIAS.map(([cause, count], i) => ({ id: 'par-1-' + (i + 1), cause, count })) },
      { id: 'par-2', name: 'No conformidades en las mediciones de control de calidad', source: 'mediciones', items: [] },
    ],
    control: [{
      id: 'ctl-1', name: 'Resistencia del concreto a 28 días (muros y losas, f\'c = 28 MPa)', unit: 'MPa', target: 33, lsl: 24.5, usl: null,
      points: CONCRETO.map(([date, value], i) => ({ id: 'ctl-1-' + String(i + 1).padStart(2, '0'), date, value, note: CONCRETO_NOTES[date] || '' })),
    }],
  });

  /* ---------------------------------------------------------------- diagramas de flujo (retícula de 8 px) */
  const node = (id, type, x, y, w, h, text) => ({ id, type, x, y, w, h, text });
  const edge = (id, from, to, label) => ({ id, from, to, label: label || '' });
  const flowsData = () => [
    {
      id: 'flujo-ventas',
      data: {
        name: 'Venta y escrituración con encargo fiduciario',
        description: 'De la separación en la sala de ventas a la entrega del inmueble: vinculación con SARLAFT, encargo fiduciario individual, promesa, cuotas iniciales, punto de equilibrio (75 % de la etapa con licencia ejecutoriada, lote libre de gravámenes y crédito constructor aprobado), crédito hipotecario o subsidio, escrituración con subrogación y entrega. Si el punto de equilibrio no se cumple en el plazo, la fiduciaria devuelve los aportes con sus rendimientos.',
        lanes: [{ id: 'ln-cmp', name: 'Comprador', h: 176 }, { id: 'ln-com', name: 'Sala de ventas (comercializadora)', h: 176 }, { id: 'ln-fid', name: 'Fiduciaria', h: 272 }, { id: 'ln-pro', name: 'Promotor (gerencia del proyecto)', h: 176 }, { id: 'ln-ban', name: 'Banco o caja de compensación', h: 176 }],
        nodes: [
          node('v-ini', 'terminal', 176, 56, 160, 64, 'Cliente separa un inmueble en la sala de ventas'),
          node('v-sep', 'process', 176, 224, 160, 80, 'Registrar la separación y recibir la cuota de separación'),
          node('v-sar', 'process', 392, 408, 160, 64, 'Vincular al comprador y verificar SARLAFT'),
          node('v-dsar', 'decision', 600, 384, 176, 112, '¿Comprador aprobado en SARLAFT?'),
          node('v-lib', 'process', 608, 232, 160, 64, 'Liberar el inmueble y devolver la separación'),
          node('v-enc', 'document', 824, 400, 160, 72, 'Encargo fiduciario individual firmado'),
          node('v-pro', 'document', 1040, 680, 160, 72, 'Promesa de compraventa firmada'),
          node('v-cuo', 'process', 1256, 56, 160, 64, 'Pagar las cuotas iniciales al encargo fiduciario'),
          node('v-pe', 'decision', 1464, 376, 176, 112, '¿Punto de equilibrio cumplido en el plazo?'),
          node('v-dev', 'process', 1472, 536, 160, 64, 'Devolver los aportes con sus rendimientos'),
          node('v-giro', 'process', 1688, 408, 160, 64, 'Girar los recursos al patrimonio autónomo'),
          node('v-cre', 'process', 1904, 856, 160, 64, 'Estudiar el crédito hipotecario o el subsidio'),
          node('v-dcre', 'decision', 2112, 832, 176, 112, '¿Crédito o subsidio aprobado?'),
          node('v-des', 'process', 2120, 232, 160, 64, 'Tramitar el desistimiento y revender el inmueble'),
          node('v-esc', 'document', 2336, 680, 160, 72, 'Escritura, registro y subrogación del crédito constructor'),
          node('v-ent', 'process', 2552, 680, 160, 64, 'Entregar el inmueble con acta y manual del propietario'),
          node('v-fin', 'terminal', 2768, 56, 160, 64, 'Fin: inmueble entregado o negocio terminado'),
          node('v-nota', 'note', 392, 40, 336, 96, 'Los recursos permanecen en el encargo hasta que la fiduciaria certifica las condiciones de giro (Circular Básica Jurídica de la Superintendencia Financiera).'),
        ],
        edges: [
          edge('ve1', 'v-ini', 'v-sep'), edge('ve2', 'v-sep', 'v-sar'), edge('ve3', 'v-sar', 'v-dsar'),
          edge('ve4', 'v-dsar', 'v-enc', 'Sí'), edge('ve5', 'v-dsar', 'v-lib', 'No'), edge('ve6', 'v-lib', 'v-fin'),
          edge('ve7', 'v-enc', 'v-pro'), edge('ve8', 'v-pro', 'v-cuo'), edge('ve9', 'v-cuo', 'v-pe'),
          edge('ve10', 'v-pe', 'v-giro', 'Sí'), edge('ve11', 'v-pe', 'v-dev', 'No'), edge('ve12', 'v-dev', 'v-fin'),
          edge('ve13', 'v-giro', 'v-cre'), edge('ve14', 'v-cre', 'v-dcre'),
          edge('ve15', 'v-dcre', 'v-esc', 'Sí'), edge('ve16', 'v-dcre', 'v-des', 'No'), edge('ve17', 'v-des', 'v-fin'),
          edge('ve18', 'v-esc', 'v-ent'), edge('ve19', 'v-ent', 'v-fin'),
        ],
        createdAt: '2025-06-16T20:00:00.000Z',
        updatedAt: '2025-07-04T20:00:00.000Z',
      },
    },
    {
      id: 'flujo-cambios',
      data: {
        name: 'Control integrado de cambios (4.6)',
        description: 'Proceso 4.6 Realizar el control integrado de cambios: el gerente de proyecto aprueba los cambios dentro de su autoridad; los demás los decide la junta directiva como comité de control de cambios. Los cambios que afectan el presupuesto aprobado por el banco o validado por la fiduciaria requieren su no objeción antes de actualizar las líneas base.',
        lanes: [{ id: 'ln-sol', name: 'Solicitante', h: 176 }, { id: 'ln-ger', name: 'Gerente de proyecto', h: 176 }, { id: 'ln-jun', name: 'Junta directiva (comité de control de cambios)', h: 192 }, { id: 'ln-fyb', name: 'Fiduciaria, banco e interventoría', h: 176 }],
        nodes: [
          node('c-ini', 'terminal', 176, 64, 160, 48, 'Necesidad de cambio identificada'),
          node('c-sol', 'document', 384, 48, 160, 80, 'Diligenciar la solicitud de cambio'),
          node('c-reg', 'process', 384, 232, 160, 64, 'Registrar en el registro de cambios'),
          node('c-imp', 'process', 592, 216, 176, 96, 'Analizar el impacto en alcance, cronograma, costos, flujo de caja y riesgos'),
          node('c-niv', 'decision', 800, 208, 176, 112, '¿Está dentro de la autoridad del gerente?'),
          node('c-jun', 'decision', 1008, 392, 176, 112, '¿Lo aprueba la junta directiva?'),
          node('c-rec', 'process', 1240, 416, 160, 64, 'Registrar el rechazo o el aplazamiento y su justificación'),
          node('c-ban', 'decision', 1232, 576, 176, 112, '¿Afecta el presupuesto aprobado por el banco?'),
          node('c-not', 'process', 1456, 600, 160, 64, 'Obtener la no objeción del banco y la fiduciaria'),
          node('c-act', 'process', 1664, 224, 160, 80, 'Actualizar el plan, las líneas base y el registro de cambios'),
          node('c-com', 'process', 1872, 232, 160, 64, 'Comunicar la decisión a los interesados'),
          node('c-fin', 'terminal', 1872, 64, 160, 48, 'Fin: decisión comunicada'),
          node('c-nota', 'note', 176, 384, 288, 112, 'Autoridad del gerente: cambios sin efecto en hitos ni en la utilidad y de hasta COP 300 millones con cargo a la reserva para contingencias. Los demás van a la junta directiva.'),
        ],
        edges: [
          edge('ce1', 'c-ini', 'c-sol'), edge('ce2', 'c-sol', 'c-reg'), edge('ce3', 'c-reg', 'c-imp'), edge('ce4', 'c-imp', 'c-niv'),
          edge('ce5', 'c-niv', 'c-act', 'Sí'), edge('ce6', 'c-niv', 'c-jun', 'No'), edge('ce7', 'c-jun', 'c-ban', 'Sí'), edge('ce8', 'c-jun', 'c-rec', 'No'),
          edge('ce9', 'c-ban', 'c-not', 'Sí'), edge('ce10', 'c-ban', 'c-act', 'No'), edge('ce11', 'c-not', 'c-act'),
          edge('ce12', 'c-act', 'c-com'), edge('ce13', 'c-rec', 'c-com'), edge('ce14', 'c-com', 'c-fin'),
        ],
        createdAt: '2025-04-14T20:00:00.000Z',
        updatedAt: '2026-03-13T20:00:00.000Z',
      },
    },
    {
      id: 'flujo-giros',
      data: {
        name: 'Liberación de recursos de la fiducia y desembolsos del crédito constructor',
        description: 'Giro de los recursos del encargo fiduciario al patrimonio autónomo cuando se cumplen las condiciones del punto de equilibrio, y ciclo mensual de desembolsos del crédito constructor contra el avance de obra verificado por la interventoría. El aporte del promotor y los recaudos se usan primero; los pagos a contratistas salen del patrimonio autónomo.',
        lanes: [{ id: 'ln-pro', name: 'Promotor (gerencia del proyecto)', h: 176 }, { id: 'ln-fid', name: 'Fiduciaria', h: 176 }, { id: 'ln-int', name: 'Interventoría del banco', h: 176 }, { id: 'ln-ban', name: 'Banco (crédito constructor)', h: 176 }],
        nodes: [
          node('f-ini', 'terminal', 176, 56, 160, 64, 'Punto de equilibrio alcanzado en la etapa'),
          node('f-sol', 'document', 384, 48, 160, 80, 'Solicitud de giro con los soportes de las condiciones'),
          node('f-ver', 'process', 592, 232, 160, 64, 'Verificar licencia, ventas, lote, crédito y presupuesto'),
          node('f-ok', 'decision', 800, 208, 176, 112, '¿Cumple todas las condiciones de giro?'),
          node('f-sub', 'process', 800, 56, 160, 64, 'Subsanar las condiciones pendientes'),
          node('f-giro', 'process', 1032, 224, 176, 80, 'Girar los recursos del encargo al patrimonio autónomo'),
          node('f-acta', 'document', 1240, 400, 160, 80, 'Acta mensual de avance de obra'),
          node('f-rev', 'decision', 1448, 384, 176, 112, '¿Avance y calidad verificados?'),
          node('f-aju', 'process', 1456, 56, 160, 64, 'Corregir el acta y las no conformidades'),
          node('f-des', 'process', 1664, 584, 160, 64, 'Desembolsar el crédito contra el avance'),
          node('f-pag', 'process', 1872, 224, 176, 80, 'Pagar a contratistas y proveedores desde el patrimonio autónomo'),
          node('f-ter', 'decision', 2080, 32, 176, 112, '¿Obra de la etapa terminada?'),
          node('f-fin', 'terminal', 2320, 56, 176, 64, 'Fin: amortización con subrogaciones a la escrituración'),
        ],
        edges: [
          edge('fe1', 'f-ini', 'f-sol'), edge('fe2', 'f-sol', 'f-ver'), edge('fe3', 'f-ver', 'f-ok'),
          edge('fe4', 'f-ok', 'f-giro', 'Sí'), edge('fe5', 'f-ok', 'f-sub', 'No'), edge('fe6', 'f-sub', 'f-sol'),
          edge('fe7', 'f-giro', 'f-acta'), edge('fe8', 'f-acta', 'f-rev'),
          edge('fe9', 'f-rev', 'f-des', 'Sí'), edge('fe10', 'f-rev', 'f-aju', 'No'), edge('fe11', 'f-aju', 'f-acta'),
          edge('fe12', 'f-des', 'f-pag'), edge('fe13', 'f-pag', 'f-ter'),
          edge('fe14', 'f-ter', 'f-fin', 'Sí'), edge('fe15', 'f-ter', 'f-acta', 'No'),
        ],
        createdAt: '2025-11-10T20:00:00.000Z',
        updatedAt: '2026-07-15T20:00:00.000Z',
      },
    },
  ];

  /* ---------------------------------------------------------------- documentos (PM.exampleDocs.medellin, archivos 92 y 93) */
  const ts = (date) => date + 'T15:00:00.000Z';
  function docsData(project) {
    const src = (PM.exampleDocs && PM.exampleDocs.medellin) || {};
    const out = [];
    for (const templateId of Object.keys(src)) {
      const t = PM.templates && PM.templates[templateId];
      const entry = src[templateId];
      if (!t || !entry || typeof entry !== 'object') continue;
      const items = t.multiple
        ? (Array.isArray(entry.instances) ? entry.instances : []).filter((x) => x && x.key).map((x, i) => ({ id: templateId + '--' + x.key, title: x.title || t.name + ' — ' + (i + 1), seq: i + 1, e: x, revs: x.revs }))
        : [{ id: templateId, title: t.name, seq: null, e: entry, revs: entry.revs }];
      for (const it of items) {
        const e = it.e;
        const date = D.valid(e.date) ? e.date : D.valid(entry.date) ? entry.date : STATUS_DATE;
        const status = e.status || entry.status || 'borrador';
        const rev = e.rev !== undefined ? e.rev : entry.rev !== undefined ? entry.rev : null;
        const fields = PM.clone(e.fields || {});
        const tbIn = { ...(entry.titleBlock || {}), ...(e.titleBlock || {}) };
        const titleBlock = {
          codigo: CODE + '-' + (t.abbr || 'DOC') + (t.multiple ? '-' + String(it.seq).padStart(2, '0') : ''),
          elaboro: tbIn.elaboro || ROLE.ger,
          reviso: tbIn.reviso || '',
          aprobo: tbIn.aprobo || (status === 'aprobado' ? ROLE.jun : ''),
          fechaAprobacion: tbIn.fechaAprobacion !== undefined ? tbIn.fechaAprobacion : status === 'aprobado' ? date : null,
        };
        const revs = (Array.isArray(it.revs) ? it.revs : []).filter((r) => r && D.valid(r.date)).map((r) => ({
          id: 'rev-' + String(r.rev),
          data: { rev: r.rev, status: r.status || 'aprobado', date: ts(r.date), byId: null, note: r.note || '', fields: PM.clone(r.fields || e.fields || {}), titleBlock: { ...titleBlock, fechaAprobacion: (r.status || 'aprobado') === 'aprobado' ? r.date : null }, title: it.title },
        }));
        const created = revs.length ? D.min(date, ...revs.map((r) => r.data.date.slice(0, 10))) : date;
        const body = PM.newDocBody(t, project, { title: it.title, status, rev, titleBlock, createdAt: ts(created), updatedAt: ts(date), createdBy: null, updatedBy: null });
        /* campos de la entrada; las claves que no trae toman el valor inicial de la plantilla con ids fijos */
        const base = body.fields || {};
        for (const [k, v] of Object.entries(base)) if (!(k in fields)) fields[k] = Array.isArray(v) ? v.map((r, i) => (r && typeof r === 'object' ? { ...r, id: k + '-' + (i + 1) } : r)) : v;
        body.fields = fields;
        if (t.multiple) body.seq = it.seq;
        out.push({ id: it.id, data: body, revs });
      }
    }
    return out;
  }
  /* contenido aprobado vigente en una fecha (documento o revisión) */
  const approvedFieldsAt = (doc, date) => {
    if (!doc) return null;
    const cands = [{ date: doc.data.titleBlock && doc.data.titleBlock.fechaAprobacion, status: doc.data.status, fields: doc.data.fields, cur: 1 }]
      .concat((doc.revs || []).map((r) => ({ date: String(r.data.date || '').slice(0, 10), status: r.data.status, fields: r.data.fields, cur: 0 })))
      .filter((c) => c.status === 'aprobado' && D.valid(c.date) && c.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date) || b.cur - a.cur);
    return cands.length ? PM.clone(cands[0].fields) : null;
  };

  /* ---------------------------------------------------------------- líneas base */
  function baselinesData(scopeDoc) {
    const plan = (ver) => { const data = planData(ver); return { data, sched: PM.calc.computeSchedule(data, START) }; };
    const lb0 = plan('lb0');
    const lb1 = plan('lb1');
    const snap0 = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched: lb0.sched, wbs: { nodes: wbsNodes(lb0.data.tasks, 'lb0') }, costs: { reserves: { ...RESERVES_LB0 } }, scopeStatement: approvedFieldsAt(scopeDoc, LB0_DATE) });
    const snap1 = PM.calc.makeBaselineSnapshot({ includes: ['scope', 'schedule', 'cost'], sched: lb1.sched, wbs: { nodes: wbsNodes(lb1.data.tasks, 'lb1') }, costs: { reserves: { ...RESERVES_LB1 } }, scopeStatement: approvedFieldsAt(scopeDoc, LB1_DATE) });
    return [
      { id: 'lb0', data: { number: 0, label: 'LB0', date: LB0_DATE, includes: ['scope', 'schedule', 'cost'], note: 'Línea base inicial aprobada por la junta directiva con la factibilidad y el plan para la dirección del proyecto (decisión de inversión).', changeRef: null, byId: null, ...snap0 } },
      { id: 'lb1', data: { number: 1, label: 'LB1', date: LB1_DATE, includes: ['scope', 'schedule', 'cost'], note: 'Mitigación vial exigida en la licencia (+COP 430 millones con cargo a la reserva para contingencias) y reprogramación del inicio de obra de la etapa 1 al 16 de marzo de 2026 (+4 semanas); fin del proyecto sin cambio.', changeRef: 'CC-002', byId: null, ...snap1 } },
    ];
  }

  /* ---------------------------------------------------------------- constructor */
  function buildExample() {
    const project = { ...META };
    const schedule = currentData();
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

  /* Datos internos del modelo para pruebas y documentación (no se guardan en el proyecto). */
  const facts = () => ({
    code: CODE, start: START, end: END, forecastEnd: FORECAST_END, statusDate: STATUS_DATE, lb0Date: LB0_DATE, lb1Date: LB1_DATE,
    budget: { ...BUDGET }, chapters: CHAPTERS.map(([id, name, value]) => ({ id, name, value })), indirects: INDIRECTS.map(([id, name, value]) => ({ id, name, value })),
    tasks: DEFS.map((d) => ({ id: d.id, k: d.k || null, st: d.st || null, cap: d.cap || null, capSplit: d.capSplit || null, cost: d.cost || 0, loe: !!d.loe, inLb0: !!lb0Dates(d), inLb1: !!lb1Dates(d), f: d.f || 1 })),
    sales: SALES.map(([m, e1, e2]) => ({ month: m, e1, e2 })),
    lagWarnings: lagWarnings.slice(),
    dates: { lb0: Object.fromEntries(DEFS.map((d) => [d.id, lb0Dates(d)])), lb1: Object.fromEntries(DEFS.map((d) => [d.id, lb1Dates(d)])) },
    raciRoles: RACI_ROLES.map(([id, name]) => ({ id, name })),
  });

  PM.registerExample({
    id: 'medellin', icon: 'portfolio',
    name: 'Edificio residencial en Medellín',
    description: 'Desarrollo inmobiliario completo en un lote de 50.000 m²: estructuración, ventas con encargo fiduciario, diseños y licencias, construcción en dos etapas de 416 viviendas, entrega y cierre.',
    summary: ['Desarrollo inmobiliario', '4,2 años', 'COP 143.339 M'],
    build: () => buildExample(),
    facts,
  });
})();

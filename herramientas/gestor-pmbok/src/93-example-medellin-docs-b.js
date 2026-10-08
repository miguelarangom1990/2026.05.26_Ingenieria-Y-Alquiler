/* ==========================================================================
   93-example-medellin-docs-b.js — contenido de los documentos del ejemplo
   «Edificio Atalaya del Occidente» (Medellín) para las plantillas de Costos
   (cap. 7), Calidad (8), Recursos (9), Comunicaciones (10), Riesgos (11),
   Adquisiciones (12) e Interesados (13) registradas en 13-templates-b.js.
   El constructor 91-example-medellin.js convierte cada entrada en un documento
   (estado, revisión, cajetín y revisiones emitidas).

   Fuente única de cifras, fechas, roles y códigos: el modelo del ejemplo
   (model.json): lote de 50.000 m² por COP 15.000 millones, 416 viviendas,
   ventas de COP 162.122 millones, BAC de COP 139.576 millones (LB1), línea base
   de costos de COP 141.939 millones, reserva de gestión de COP 1.400 millones,
   LB0 del 22 de abril de 2025, LB1 del 13 de marzo de 2026 (CC-002) y corte del
   30 de septiembre de 2026. Los documentos aprobados no citan hechos
   posteriores a su fecha de aprobación; las revisiones emitidas guardan el
   contenido vigente en su fecha. Empresas y cifras ficticias; personas por su
   rol, nunca por su nombre.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM) return;

  const M = 1e6;
  const cp = (x) => JSON.parse(JSON.stringify(x));
  /* filas de tabla con id fijo y determinista */
  const rows = (prefix, list) => list.map((r, i) => (r.id ? { ...r } : { id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  /* copia de filas con cambios por id y filas omitidas (para las revisiones emitidas) */
  const patchRows = (list, patches, drop) => list.filter((r) => !(drop || []).includes(r.id)).map((r) => (patches && patches[r.id] ? { ...r, ...patches[r.id] } : { ...r }));
  /* contenido completo de una revisión emitida: campos vigentes con cambios */
  const revFields = (fields, changes) => Object.assign(cp(fields), cp(changes || {}));
  /* fecha ISO desplazada n días (fechas de la LB0 de la etapa 1, cuatro semanas antes que la LB1) */
  const shift = (iso, days) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

  const R = {
    jun: 'Junta directiva del promotor', ger: 'Gerente de proyecto', est: 'Estructurador financiero', com: 'Gerente comercial',
    arq: 'Arquitecto diseñador', ies: 'Ingeniero estructural', con: 'Director de obra (constructor)', sup: 'Supervisión técnica independiente',
    sti: 'Supervisor técnico independiente', int: 'Interventoría del banco y la fiduciaria', fid: 'Fiduciaria', ban: 'Banco (crédito constructor)',
    abo: 'Abogado del proyecto', ctd: 'Contador del proyecto', res: 'Residente de obra', ins: 'Inspector de calidad', sst: 'Coordinador SST',
  };
  const EMP = {
    pro: 'Promotora Modelo Occidente S.A.S. (ficticia)',
    fdc: 'Fideicomiso Atalaya del Occidente (ficticio)',
    fid: 'Fiduciaria Andina S.A. (ficticia)',
    ban: 'Banco Comercial del Valle S.A. (ficticio)',
    con: 'Constructora Laderas S.A.S. (ficticia)',
    com: 'Ventas Inmobiliarias Medellín S.A.S. (ficticia)',
    arq: 'Taller de Arquitectura Ladera S.A.S. (ficticia)',
    geo: 'Geotecnia y Suelos del Valle S.A.S. (ficticia)',
    est: 'Ingeniería Estructural Andes S.A.S. (ficticia)',
    rev: 'Revisión Estructural Independiente S.A.S. (ficticia)',
    red: 'Ingeniería de Redes Técnicas S.A.S. (ficticia)',
    bio: 'Consultoría Bioclimática Verde S.A.S. (ficticia)',
    mov: 'Movilidad Urbana Consultores S.A.S. (ficticia)',
    sup: 'Supervisión Técnica Independiente S.A.S. (ficticia)',
    int: 'Interventorías Financieras S.A.S. (ficticia)',
    tie: 'Movimientos de Tierra Aburrá S.A.S. (ficticia)',
    anc: 'Geoestructuras Ancladas S.A.S. (ficticia)',
    pil: 'Pilotes y Cimentaciones del Valle S.A.S. (ficticia)',
    eind: 'Estructuras Industrializadas S.A.S. (ficticia)',
    cto: 'Concretos del Aburrá S.A.S. (ficticia)',
    ace: 'Aceros de Antioquia S.A.S. (ficticia)',
    ins: 'Redes y Montajes Medellín S.A.S. (ficticia)',
    asc: 'Ascensores Andinos S.A.S. (ficticia)',
    ven: 'Ventanería y Fachadas del Valle S.A.S. (ficticia)',
    urb: 'Urbanizaciones y Vías S.A.S. (ficticia)',
    pub: 'Agencia Creativa Montaña S.A.S. (ficticia)',
    seg: 'Aseguradora Solidaria del Valle S.A. (ficticia)',
    lab: 'Laboratorio de Materiales del Aburrá S.A.S. (ficticia)',
    tit: 'Abogados Inmobiliarios del Valle S.A.S. (ficticia)',
    mer: 'Inteligencia de Mercado Inmobiliario S.A.S. (ficticia)',
    fac: 'Estructuraciones Financieras Andinas S.A.S. (ficticia)',
  };
  const LB0 = '2025-04-22';
  const LB1 = '2026-03-13';
  const CUT = '2026-09-30';

  /* ================================================================== 7. COSTOS */

  /* ------------------------------------------------------------ 7.1 Plan de gestión de los costos */
  const cuentasControl = rows('pgco-cc', [
    { cuenta: 'CC-1.1', paqueteEdt: '1.1 Gerencia del proyecto', responsable: R.ger, centroCosto: 'PRY-2025-003-01', presupuesto: 6534 * M },
    { cuenta: 'CC-1.2', paqueteEdt: '1.2 Estructuración técnica, legal y financiera (lote, compensación VIP, fiducia y costos financieros)', responsable: R.est, centroCosto: 'PRY-2025-003-02', presupuesto: 26291 * M },
    { cuenta: 'CC-1.3', paqueteEdt: '1.3 Diseños y licencias', responsable: R.arq, centroCosto: 'PRY-2025-003-03', presupuesto: 2708 * M },
    { cuenta: 'CC-1.4', paqueteEdt: '1.4 Comercialización y ventas', responsable: R.com, centroCosto: 'PRY-2025-003-04', presupuesto: 5770 * M },
    { cuenta: 'CC-1.5.1', paqueteEdt: '1.5.1 Construcción de la etapa 1 (bloques A y B)', responsable: R.con, centroCosto: 'PRY-2025-003-05', presupuesto: 37009 * M },
    { cuenta: 'CC-1.5.2', paqueteEdt: '1.5.2 Construcción de la etapa 2 (bloques C y D)', responsable: R.con, centroCosto: 'PRY-2025-003-06', presupuesto: 38984 * M },
    { cuenta: 'CC-1.5.3', paqueteEdt: '1.5.3 Urbanismo y cargas del plan parcial', responsable: R.con, centroCosto: 'PRY-2025-003-07', presupuesto: 12373 * M },
    { cuenta: 'CC-1.5.4', paqueteEdt: '1.5.4 Administración de obra, supervisión técnica e interventoría', responsable: R.con, centroCosto: 'PRY-2025-003-08', presupuesto: 8901 * M },
    { cuenta: 'CC-1.6', paqueteEdt: '1.6 Entrega, escrituración y cierre', responsable: R.ger, centroCosto: 'PRY-2025-003-09', presupuesto: 1006 * M },
  ]);
  const pgcoFields = {
    moneda: 'COP',
    unidadesMedida: 'Pesos colombianos corrientes (COP): cada costo se presupuesta con el precio proyectado para el periodo en que se causa; los informes a la junta directiva se presentan en millones de COP con un decimal. Cantidades de obra en m² de área construida (39.385 m²) y de área privada vendible (24.736 m²), m³ de concreto, kg de acero de refuerzo, metros lineales de vía y de red, y unidades de vivienda (416). Los indicadores de referencia son COP por m² construido y COP por m² vendible.',
    nivelPrecision: 'Presupuesto y control en pesos; líneas base e informes redondeados al millón de COP (COP M).',
    nivelExactitud: 'Factibilidad: −10 % a +15 % sobre el costo total. Etapa 1, con diseños de detalle y presupuesto del constructor: ±5 % en los costos directos. Etapa 2: −10 % a +15 % hasta sus planos de taller.',
    tipoEstimacion: 'Presupuestaria (−10 % a +25 %)',
    metodosEstimacion: [
      'Paramétrica para la edificación: COP 2,20 millones/m² construido de torre (COP 2,10 millones/m² de costo reembolsable más los honorarios del constructor), COP 1,65 millones/m² de plataforma de parqueaderos y COP 2,40 millones/m² de zonas comunes (Construdata 2025 actualizado con el ICOCED, proyectado con su reajuste esperado de 5 % a 6 % anual hasta la mitad de la ejecución de cada etapa y con la prima de ladera del Valle de Aburrá).',
      'Ascendente con cantidades de obra para el urbanismo y las cargas del plan parcial (vía colectora, vías locales, redes de EPM, parque de cesión y equipamiento).',
      'Porcentajes de la práctica del sector para los indirectos: gerencia 3,0 % y comisiones 1,5 % de las ventas; diseños 2,4 %, supervisión técnica 0,6 % y pólizas 0,6 % de los directos.',
      'Tarifas oficiales y cotizaciones: expensas de curaduría (Decreto 1077 de 2015), delineación urbana e ICA (Acuerdo 093 de 2023), fiducia, pólizas y comisiones del crédito.',
      'Simulación del crédito constructor por etapa: desembolsos mensuales por avance durante 14 meses y amortización con las subrogaciones, a IBR 3M + 4,5 puntos.',
    ],
    cuentasControl,
    enlaceContable: 'La contabilidad del proyecto se lleva en el Fideicomiso Atalaya del Occidente (ficticio): la fiduciaria registra cada pago del patrimonio autónomo y el contador del proyecto lo concilia cada mes con su cuenta de control y su actividad del cronograma (el código de la EDT va en el centro de costo y en la orden de pago). Los costos reales se cargan en la herramienta con el número del soporte: factura electrónica (FE-), orden de compra (OC-), nómina (NOM-), comisión (COM-), extracto de la fiduciaria (FID-) o del banco (BCO-). El corte contable es el último día hábil del mes; los costos del constructor por administración delegada entran con el acta de avance aprobada por la interventoría. El IVA pagado en insumos y servicios es mayor costo, porque la venta de vivienda no genera IVA. Excepción: por las 104 VIS el constructor tiene derecho a la devolución o compensación del IVA pagado en materiales (Estatuto Tributario, art. 850, parágrafo 2; Decreto 1625 de 2016, arts. 1.6.1.26.1 y siguientes, modificados por el Decreto 096 de 2020), hasta el 4 % del valor registrado en cada escritura de venta (≈ COP 1.057 millones sobre COP 26.416 millones) y sin exceder el IVA soportado con facturas. El contador del proyecto marca desde la compra las facturas de materiales del bloque A y de su parte de la plataforma y de las zonas comunes, y la solicitud se presenta a la DIAN a medida que se escrituran las VIS de la etapa 1. Por prudencia (plazo de la DIAN y posibles rechazos) la devolución no se descuenta de la línea base: se registra como menor costo de la etapa 1 cuando la DIAN la reconozca.',
    umbrales: rows('pgco-um', [
      { indicador: 'Índice de desempeño del costo (CPI)', verde: '≥ 0,98', amarillo: '0,93 a 0,97', rojo: '< 0,93', accion: 'Amarillo: análisis de causas por cuenta de control en el comité de gerencia. Rojo: plan de acción correctiva del constructor y EAC ascendente presentada a la junta directiva.' },
      { indicador: 'Índice de desempeño del cronograma (SPI) y SPI(t)', verde: '≥ 0,98', amarillo: '0,93 a 0,97', rojo: '< 0,93', accion: 'Revisar la ruta crítica (preventas y punto de equilibrio de cada etapa, obra y certificado técnico de ocupación) y evaluar compresión con segundo turno o frentes adicionales.' },
      { indicador: 'Variación del costo por cuenta de control (CV %)', verde: '≤ 3 %', amarillo: '3 % a 6 %', rojo: '> 6 %', accion: 'Informar a la junta directiva las cuentas en rojo con su causa y su estimación a la conclusión (EAC).' },
      { indicador: 'Variación a la conclusión (VAC) del costo total', verde: '≥ 0', amarillo: 'Hasta −2 % del BAC', rojo: '< −2 % del BAC', accion: 'Revisar el saldo de las reservas y el pronóstico de la utilidad; si la reserva para contingencias no alcanza, escalar a la junta.' },
      { indicador: 'Utilidad antes de impuestos pronosticada sobre las ventas', verde: '≥ 12 %', amarillo: '10 % a 12 %', rojo: '< 10 %', accion: 'Amarillo: revisar precios de lista, mezcla y descuentos con el gerente comercial. Rojo: presentar a la junta alternativas de ingeniería de valor y de precio.' },
      { indicador: 'Saldo de la reserva para contingencias frente al VME de las amenazas abiertas', verde: 'Saldo ≥ VME', amarillo: 'Saldo entre 80 % y 100 % del VME', rojo: 'Saldo < 80 % del VME', accion: 'Reevaluar el análisis cuantitativo; si el faltante persiste, solicitar a la junta la reposición desde la reserva de gestión.' },
    ]),
    reservaContingencia: 2363 * M,
    reservaGestion: 1400 * M,
    usoReservas: 'La reserva para contingencias (COP 2.363 millones, igual al VME de las amenazas del registro de riesgos en la LB1) está dentro de la línea base de costos y fuera del BAC. El gerente de proyecto autoriza su uso para riesgos identificados hasta COP 300 millones por evento cuando no afecta hitos ni la utilidad; por encima de ese monto decide la junta directiva. Todo uso se tramita con solicitud de cambio y queda en el registro de cambios. La reserva de gestión (COP 1.400 millones, 1 % del BAC) está fuera de la línea base de costos y solo la libera la junta para trabajo no previsto dentro del alcance; al usarla se actualiza la línea base de costos. Uso aprobado con esta revisión: CC-002, COP 430 millones para la mitigación vial exigida en la licencia.',
    tecnicasValorGanado: rows('pgco-ev', [
      { trabajo: 'Lote, compensación VIP, comisiones del crédito y otros pagos únicos', tecnica: 'Fórmula fija 0/100', criterio: 'Se gana el 100 % con el pago soportado (escritura, derechos fiduciarios del ISVIMED, comisión de estructuración).' },
      { trabajo: 'Estudios, diseños y licencias (1.3)', tecnica: 'Hitos ponderados', criterio: 'Esquema básico 20 %; anteproyecto 20 %; proyecto y cuadro de áreas 30 %; diseños técnicos aprobados 20 %; licencia ejecutoriada 10 %. Diseños de detalle por planos de taller entregados.' },
      { trabajo: 'Preventas por etapa (1.4.3 y 1.4.4)', tecnica: 'Unidades completadas', criterio: 'Viviendas vinculadas al encargo fiduciario / meta del paquete (156 por etapa para el punto de equilibrio).' },
      { trabajo: 'Estructura de la plataforma y de los bloques', tecnica: 'Unidades completadas', criterio: 'Pisos (o niveles de la plataforma) vaciados y liberados por la supervisión técnica independiente sobre el total del paquete (8 pisos por bloque); medición quincenal con el acta de avance.' },
      { trabajo: 'Mampostería, instalaciones, cubiertas, fachadas y acabados', tecnica: 'Porcentaje completado', criterio: 'Avance por capítulo y por piso con las cantidades del presupuesto del constructor, verificado por la interventoría del banco y la fiduciaria en el acta mensual.' },
      { trabajo: 'Urbanismo, vías y redes externas', tecnica: 'Unidades completadas', criterio: 'Metros lineales de vía y de red construidos y recibidos por EPM o por el Distrito, frente a la cantidad de diseño del paquete.' },
      { trabajo: 'Gerencia, fiducia, gestión administrativa, administración de obra, supervisión técnica e interventoría', tecnica: 'Nivel de esfuerzo', criterio: 'El valor ganado es igual al valor planificado del periodo.' },
      { trabajo: 'Intereses del crédito constructor', tecnica: 'Porcentaje completado', criterio: 'Intereses causados / intereses presupuestados del tramo; el valor ganado iguala el costo causado.' },
    ]),
    nivelCuentaControl: 'Nivel 2 de la EDT (1.1 a 1.6) y nivel 3 en la construcción (1.5.1 a 1.5.4)',
    metodoEac: 'EAC = AC + ETC ascendente',
    frecuenciaMedicion: 'Mensual',
    formatosInformes: 'Informe mensual de costos dentro del informe de desempeño (corte el último día del mes; comité de gerencia el primer martes y junta directiva el segundo martes): PV, EV, AC, SPI, CPI, EAC y VAC por cuenta de control, curva S, estado de resultados pronosticado (ventas, costos y utilidad) frente a la factibilidad, consumo de reservas y flujo de caja conciliado con la fiduciaria. Acta mensual de avance de obra del constructor certificada por la interventoría, que soporta el giro de la fiduciaria y el desembolso del crédito. Anexo de órdenes de cambio y de pagos por contrato.',
    descripcionProcesos: '7.2 Estimar los costos: el estructurador financiero actualiza la estimación al cerrar cada fase (factibilidad, licencia y diseños de detalle de cada etapa) con las cantidades del constructor y cotizaciones. 7.3 Determinar el presupuesto: agrega por paquete de trabajo y cuenta de control, dimensiona las reservas con el análisis cuantitativo de riesgos y lo somete a la junta (LB0 del 22 de abril de 2025; LB1 del 13 de marzo de 2026 con el CC-002). 7.4 Controlar los costos: costo real mensual desde la contabilidad del fideicomiso, medición del valor ganado, pronóstico ascendente del gerente y control integrado de cambios para todo ajuste del presupuesto; la fiduciaria solo paga contra presupuesto aprobado y acta de avance.',
    detallesAdicionales: 'Los costos financieros se presupuestan por tramo de crédito; la variación de la tasa (IBR) se trata como riesgo R-002 y se informa aparte de la variación por desempeño. Las ventas no forman parte del BAC: su desviación se controla en el plan de ventas y en el estado de resultados pronosticado. Los costos están en pesos corrientes: los costos unitarios de la factibilidad (precios de marzo de 2025) incluyen el reajuste proyectado del ICOCED (5 % a 6 % anual) hasta la mitad de la ejecución de cada etapa, y el presupuesto del constructor de la etapa 1 (marzo de 2026) los confirmó dentro de ±5 %. El riesgo R-003 cubre solo el alza por encima de esa proyección: el salario mínimo de 2026 subió 23 % frente a cerca de 7 % previsto en la factibilidad, y todavía no se sabe cuánto se trasladará a los destajos y a los subcontratos de la etapa 2.',
  };
  const pgcoDetalles0 = 'Los costos financieros se presupuestan por tramo de crédito; la variación de la tasa (IBR) se trata como riesgo R-002 y se informa aparte de la variación por desempeño. Las ventas no forman parte del BAC: su desviación se controla en el plan de ventas y en el estado de resultados pronosticado. Los costos están en pesos corrientes: los costos unitarios (precios de marzo de 2025) incluyen el reajuste proyectado del ICOCED (5 % a 6 % anual) hasta la mitad de la ejecución de cada etapa. El riesgo R-003 cubre solo el alza por encima de esa proyección (salario mínimo, acero y concreto).';
  const planGestionCostos = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.est, reviso: R.ger, aprobo: R.jun },
    fields: pgcoFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con la factibilidad y la LB0: BAC de COP 139.146 millones y reserva para contingencias de COP 2.793 millones.',
        fields: revFields(pgcoFields, {
          nivelExactitud: 'Factibilidad: −10 % a +15 % sobre el costo total; se refina por etapa con los diseños de detalle y el presupuesto del constructor.',
          cuentasControl: patchRows(cuentasControl, { 'pgco-cc-07': { presupuesto: 11943 * M } }),
          reservaContingencia: 2793 * M,
          detallesAdicionales: pgcoDetalles0,
          usoReservas: 'La reserva para contingencias (COP 2.793 millones, igual al VME de las amenazas identificadas en la factibilidad) está dentro de la línea base de costos y fuera del BAC. El gerente de proyecto autoriza su uso para riesgos identificados hasta COP 300 millones por evento cuando no afecta hitos ni la utilidad; por encima de ese monto decide la junta directiva. Todo uso se tramita con solicitud de cambio y queda en el registro de cambios. La reserva de gestión (COP 1.400 millones, 1 % del BAC) está fuera de la línea base de costos y solo la libera la junta para trabajo no previsto dentro del alcance; al usarla se actualiza la línea base de costos.',
          descripcionProcesos: '7.2 Estimar los costos: el estructurador financiero actualiza la estimación al cerrar cada fase (factibilidad, licencia y diseños de detalle de cada etapa) con las cantidades del constructor y cotizaciones. 7.3 Determinar el presupuesto: agrega por paquete de trabajo y cuenta de control, dimensiona las reservas con el análisis cuantitativo de riesgos y lo somete a la junta (LB0 del 22 de abril de 2025). 7.4 Controlar los costos: costo real mensual desde la contabilidad del fideicomiso, medición del valor ganado, pronóstico ascendente del gerente y control integrado de cambios para todo ajuste del presupuesto; la fiduciaria solo paga contra presupuesto aprobado y acta de avance.',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'CC-002: mitigación vial exigida en la licencia (+COP 430 millones en la cuenta 1.5.3) con cargo a la reserva para contingencias, que queda en COP 2.363 millones (LB1).' },
    ],
  };

  /* ------------------------------------------------------------ 7.2 Estimaciones de costos */
  const D25 = 2.5; /* contingencia de la LB1 sobre los costos directos (COP 2.363 millones) */
  const estimaciones = rows('eco', [
    { codigo: 'E-01', paqueteEdt: '1.2.1', descripcion: 'Lote bruto de 50.000 m² en suelo de expansión de la zona 4 (occidente): precio negociado con soporte de avalúo comercial; 20 % de arras con la promesa y 80 % con la escritura.', categoria: 'Gastos generales', unidad: 'm²', cantidad: 50000, costoUnitario: 300000, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-02', paqueteEdt: '1.2.3', descripcion: 'Compensación de la obligación VIP: derechos fiduciarios del ISVIMED por 78 VIP equivalentes, 39 dentro del Macroproyecto de Borde y 39 trasladadas fuera de él, COP 1.500 millones cada parte (7.800 m² de suelo a COP 384.615/m²; Acuerdo 48 de 2014, art. 326).', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 3000 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-03', paqueteEdt: '1.5.1', descripcion: 'Bloques A (VIS) y B: estructura de muros vaciados, mampostería, instalaciones, cubiertas, fachadas, acabados y equipos especiales (14.055 m² construidos).', categoria: 'Subcontratos', unidad: 'm² construido', cantidad: 14055, costoUnitario: 2200000, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-04', paqueteEdt: '1.5.2', descripcion: 'Bloques C y D (15.630 m² construidos) con las especificaciones del bloque B.', categoria: 'Subcontratos', unidad: 'm² construido', cantidad: 15630, costoUnitario: 2200000, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-05', paqueteEdt: '1.5.1 y 1.5.2', descripcion: 'Plataforma de parqueaderos en semisótano y sótano (8.600 m², 50 % por etapa), con su cimentación en pilas pre-excavadas.', categoria: 'Subcontratos', unidad: 'm² construido', cantidad: 8600, costoUnitario: 1650000, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-06', paqueteEdt: '1.5.1 y 1.5.2', descripcion: 'Zonas comunes construidas (1.100 m²): portería, salón social, gimnasio, zona de juegos cubierta y cuartos técnicos.', categoria: 'Subcontratos', unidad: 'm² construido', cantidad: 1100, costoUnitario: 2400000, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-07', paqueteEdt: '1.5.3.1', descripcion: 'Vía colectora del plan parcial (sección pública de 16 m) con andenes, drenaje y alumbrado público.', categoria: 'Subcontratos', unidad: 'ml', cantidad: 250, costoUnitario: 14520000, contingencia: D25, metodo: 'Ascendente' },
    { codigo: 'E-08', paqueteEdt: '1.5.3.1', descripcion: 'Vías locales y andenes sobre 3.000 m² de suelo de cesión vial.', categoria: 'Subcontratos', unidad: 'ml', cantidad: 280, costoUnitario: 5000000, contingencia: D25, metodo: 'Ascendente' },
    { codigo: 'E-09', paqueteEdt: '1.5.3.1', descripcion: 'Mitigación vial exigida en la licencia por el concepto de la Secretaría de Movilidad: bahía de acceso, carril de desaceleración y semaforización (CC-002).', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 430 * M, contingencia: D25, metodo: 'Cotización de proveedor' },
    { codigo: 'E-10', paqueteEdt: '1.5.3.2', descripcion: 'Redes externas de acueducto, alcantarillado, energía y gas según la factibilidad de servicios y los diseños aprobados por EPM (fases 1 y 2).', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 2350 * M, contingencia: D25, metodo: 'Ascendente' },
    { codigo: 'E-11', paqueteEdt: '1.5.3.3', descripcion: 'Adecuación del parque de cesión (9.000 m²): senderos, iluminación, juegos, canchas, plazoleta y arborización.', categoria: 'Subcontratos', unidad: 'm²', cantidad: 9000, costoUnitario: 190000, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-12', paqueteEdt: '1.5.3.3', descripcion: 'Equipamiento público para entregar al Distrito: 416 m² construidos (1 m² por vivienda) a unos COP 3,3 millones/m².', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 1373 * M, contingencia: D25, metodo: 'Paramétrica' },
    { codigo: 'E-13', paqueteEdt: '1.5.3.3', descripcion: 'Restauración y protección del retiro de la quebrada (15 m a cada lado): revegetalización, cerramiento y obras de drenaje.', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 230 * M, contingencia: D25, metodo: 'Juicio de expertos' },
    { codigo: 'E-14', paqueteEdt: '1.5.3.4', descripcion: 'Urbanismo interno, paisajismo, zonas verdes privadas (3.400 m²) y dotación de zonas comunes, en dos fases.', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 1250 * M, contingencia: D25, metodo: 'Análoga' },
    { codigo: 'E-15', paqueteEdt: '1.2.1 y 1.2.2', descripcion: 'Estructuración: estudio de títulos, avalúo y topografía (COP 120 millones), estudio de mercado (COP 100 millones) y factibilidad técnica, legal y financiera (COP 200 millones).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 420 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-16', paqueteEdt: '1.3', descripcion: 'Estudios y diseños: arquitectura y coordinación, geotecnia, estructural NSR-10 con revisión independiente, técnicos, bioclimático y movilidad (2,4 % de los directos).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 2268 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-17', paqueteEdt: '1.2.3 y 1.3.5', descripcion: 'Licencias y trámites: expensas de curaduría (Decreto 1077 de 2015), delineación urbana (0,3 %, Acuerdo 093 de 2023), nomenclatura, EPM, movilidad y permisos ambientales.', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 480 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-18', paqueteEdt: '1.5.4', descripcion: 'Supervisión técnica independiente de las etapas 1 y 2 (Ley 1796 de 2016), 0,6 % de los directos.', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 567 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-19', paqueteEdt: '1.5.4', descripcion: 'Interventoría técnica, administrativa y financiera del banco y la fiduciaria (0,5 % de los directos).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 473 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-20', paqueteEdt: '1.1.2', descripcion: 'Gerencia del proyecto del promotor (3,0 % de las ventas): gerente, control de proyectos y gastos de oficina durante 51 meses.', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 4864 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-21', paqueteEdt: '1.4.3 a 1.4.5', descripcion: 'Comisiones de ventas de la comercializadora (1,5 % del valor de cada venta).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 2432 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-22', paqueteEdt: '1.4.2', descripcion: 'Publicidad y mercadeo: agencia, pauta digital, ferias de vivienda y material de ventas (0,9 % de las ventas).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 1459 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-23', paqueteEdt: '1.4.1', descripcion: 'Sala de ventas y apartamento modelo: construcción, dotación y operación.', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 680 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-24', paqueteEdt: '1.2.4', descripcion: 'Fiducia: encargo de preventas y patrimonio autónomo de administración y pagos (0,35 % de las ventas).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 567 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-25', paqueteEdt: '1.5.4', descripcion: 'Pólizas de las dos etapas: todo riesgo construcción, responsabilidad civil extracontractual, cumplimiento y amparo patrimonial (Ley 1796 de 2016).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 567 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-26', paqueteEdt: '1.2.1, 1.4.6 y 1.6.2', descripcion: 'Notariado, registro y escrituración a cargo del promotor (0,35 % de las ventas): impuesto y derechos de registro y notaría de la compra del lote (COP 260 millones), escrituración de las viviendas de cada etapa y reglamento de propiedad horizontal.', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 567 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-27', paqueteEdt: '1.1.3', descripcion: 'Predial del lote 2025-2029 (COP 380 millones), GMF del 4 por mil (COP 560 millones) y servicios legales, contables, revisoría fiscal y SAGRILAFT (COP 730 millones).', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 1670 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-28', paqueteEdt: '1.4.6', descripcion: 'ICA (5 por mil) y avisos y tableros (15 % del ICA) sobre los ingresos por ventas.', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 932 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-29', paqueteEdt: '1.5.4', descripcion: 'Servicios públicos provisionales de obra y derechos de conexión definitiva de EPM de las dos etapas.', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 1150 * M, contingencia: 0, metodo: 'Análoga' },
    { codigo: 'E-30', paqueteEdt: '1.6.2', descripcion: 'Administración provisional de la propiedad horizontal a cargo del propietario inicial (Ley 675 de 2001, art. 52).', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 210 * M, contingencia: 0, metodo: 'Análoga' },
    { codigo: 'E-31', paqueteEdt: '1.6.4', descripcion: 'Atención de posventas y garantías (Ley 1480 de 2011): cuadrilla de posventas y materiales (0,8 % de los directos).', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 756 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-32', paqueteEdt: '1.2.4', descripcion: 'Comisiones de estudio y estructuración del crédito constructor (0,5 % del cupo de COP 56.000 millones más COP 60 millones).', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 340 * M, contingencia: 0, metodo: 'Cotización de proveedor' },
    { codigo: 'E-33', paqueteEdt: '1.2.4', descripcion: 'Intereses del crédito constructor de la etapa 1 (cupo de COP 30.000 millones a 13,6 % N.T.V.; 14 desembolsos y amortización con subrogaciones).', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 3570 * M, contingencia: 0, metodo: 'Paramétrica' },
    { codigo: 'E-34', paqueteEdt: '1.2.4', descripcion: 'Intereses del crédito constructor de la etapa 2 (cupo de COP 26.000 millones a 13,6 % N.T.V.).', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 3094 * M, contingencia: 0, metodo: 'Paramétrica' },
  ]);
  const ecoFields = {
    estimaciones,
    documentacionBase: 'Estimación de la factibilidad aprobada el 22 de abril de 2025, actualizada para la LB1 con el presupuesto del constructor de la etapa 1 (planos de taller de marzo de 2026), que confirmó los costos unitarios en pesos corrientes dentro de ±5 %. Edificación: costo paramétrico por m² construido de Construdata 2025 para multifamiliar de estrato 3 con sistema industrializado, actualizado con el ICOCED, proyectado con su reajuste esperado hasta la mitad de la ejecución de cada etapa y con la prima de ladera del Valle de Aburrá, y contrastado con el presupuesto por capítulos (estructura 23,3 %, cimentación 7,6 %, instalaciones 12,7 %, acabados 12,0 %, administración de obra 6,2 % y honorarios del constructor 4,8 % de los directos). Urbanismo y cargas: cantidades de los diseños de vías y redes y precios unitarios de contratistas de la zona. Indirectos: tarifas oficiales y porcentajes de mercado sobre las ventas (COP 162.122 millones) o sobre los directos (COP 94.510 millones). Financieros: simulación del crédito por etapa. Totales: BAC de COP 139.576 millones (lote 15.000, compensación VIP 3.000, directos 94.510, indirectos 20.062 y financieros 7.004), contingencia del 2,5 % sobre los directos (≈ COP 2.363 millones) y línea base de costos de COP 141.939 millones.',
    supuestos: [
      'Pesos corrientes: los costos unitarios de marzo de 2025 incluyen el reajuste proyectado del ICOCED (5 % a 6 % anual) hasta la mitad de la ejecución de cada etapa; el presupuesto del constructor de la etapa 1 (marzo de 2026) los confirmó dentro de ±5 %. El riesgo R-003 cubre solo el alza por encima de esa proyección (salario mínimo de 2026 +23 % frente a cerca de 7 % previsto en la factibilidad).',
      'Área construida de 39.385 m² y área privada vendible de 24.736 m², según el cuadro de áreas del proyecto arquitectónico.',
      'Construcción por administración delegada: los costos reembolsables (COP 90.014 millones en la LB1) se pagan contra soporte, más honorarios fijos del constructor del 5 % sobre el costo reembolsable estimado (COP 4.496 millones, 4,8 % de los directos); el concreto y el acero se negocian por volumen para las dos etapas.',
      'Ventas totales de COP 162.122 millones como base de los indirectos calculados sobre ventas.',
      'Crédito constructor a IBR 3M + 4,5 puntos (13,6 % N.T.V.), con desembolsos por avance durante 14 meses por etapa.',
      'Las cargas del plan parcial (vías, redes, parque y equipamiento) se cumplen en obra y la obligación VIP se compensa en dinero con el ISVIMED.',
      'Los valores incluyen el IVA de insumos y servicios, que es costo porque la venta de vivienda no genera IVA. La devolución del IVA de materiales de las 104 VIS (Estatuto Tributario, art. 850, parágrafo 2), de hasta el 4 % de su valor escriturado (≈ COP 1.057 millones), no se descuenta: se registra como menor costo de la etapa 1 cuando la DIAN la reconozca.',
    ],
    restricciones: [
      'Costo total de la factibilidad de COP 141.939 millones (87,55 % de las ventas) aprobado por la junta directiva.',
      'Lote de COP 15.000 millones pagado con el aporte del promotor antes de iniciar las preventas.',
      'Precio de la vivienda VIS por debajo del tope de 150 SMMLV (Ley 2294 de 2023, art. 293): limita el costo admisible del bloque A.',
      'La fiduciaria solo gira los recursos de cada etapa con el punto de equilibrio (75 % de las viviendas) y el presupuesto validado.',
    ],
    riesgosConsiderados: 'La contingencia del 2,5 % de los directos (COP 2.363 millones en la LB1) cubre el VME de las amenazas del registro de riesgos: velocidad de ventas de la etapa 2 (R-001), tasas de interés (R-002), costos de mano de obra y materiales (R-003), lluvias y taludes en ladera (R-004), desistimientos (R-006) y riesgos menores de normatividad, SST, comunidad, supervisión técnica y SARLAFT. La exigencia de obras de mitigación vial (R-005) se materializó con la licencia y pasó al presupuesto con el CC-002. Las variaciones del precio de mercado de la vivienda no se incluyen: se manejan en el plan de ventas.',
    rangoEstimacion: '−10 % a +15 % sobre el costo total; ±5 % en los directos de la etapa 1',
    nivelConfianza: 'Medio',
    fechaPrecios: '2026-03-13',
    incluyeIva: true,
  };
  /* LB0: sin la mitigación vial; contingencia de COP 2.793 millones (3 % en la edificación y 2,75 % en el urbanismo) */
  const eco0Cont = { 'eco-03': 3, 'eco-04': 3, 'eco-05': 3, 'eco-06': 3, 'eco-07': 2.75, 'eco-08': 2.75, 'eco-10': 2.75, 'eco-11': 2.75, 'eco-12': 2.75, 'eco-13': 2.75, 'eco-14': 2.75 };
  const estimacionCostos = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.est, reviso: R.con, aprobo: R.jun },
    fields: ecoFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Estimación de la factibilidad (LB0): directos de COP 94.080 millones, BAC de COP 139.146 millones y contingencia de COP 2.793 millones.',
        fields: revFields(ecoFields, {
          estimaciones: patchRows(estimaciones, Object.fromEntries(Object.entries(eco0Cont).map(([k, v]) => [k, { contingencia: v }])), ['eco-09']),
          documentacionBase: 'Estimación de la factibilidad aprobada por la junta directiva el 22 de abril de 2025. Edificación: costo paramétrico por m² construido de Construdata 2025 para multifamiliar de estrato 3 con sistema industrializado, actualizado con el ICOCED, proyectado con su reajuste esperado hasta la mitad de la ejecución de cada etapa y con la prima de ladera del Valle de Aburrá, y contrastado con el presupuesto por capítulos (estructura 23,4 %, cimentación 7,7 %, instalaciones 12,7 %, acabados 12,1 %, administración de obra 6,2 % y honorarios del constructor 4,8 % de los directos). Urbanismo y cargas: cantidades de los anteproyectos de vías y redes y precios unitarios de contratistas de la zona. Indirectos: tarifas oficiales y porcentajes de mercado sobre las ventas (COP 162.122 millones) o sobre los directos. Financieros: simulación del crédito por etapa. Totales: BAC de COP 139.146 millones (lote 15.000, compensación VIP 3.000, directos 94.080, indirectos 20.062 y financieros 7.004), contingencia de COP 2.793 millones (3 % en la edificación y 2,75 % en el urbanismo) y línea base de costos de COP 141.939 millones.',
          riesgosConsiderados: 'La contingencia (COP 2.793 millones) equivale al VME de las amenazas identificadas en la factibilidad: velocidad de ventas (R-001), tasas de interés (R-002), costos de mano de obra y materiales (R-003), lluvias y taludes en ladera (R-004), obligaciones adicionales de EPM, Movilidad o la curaduría (R-005, COP 430 millones), desistimientos (R-006) y riesgos menores de normatividad, SST, comunidad, supervisión técnica y SARLAFT. Las variaciones del precio de mercado de la vivienda no se incluyen: se manejan en el plan de ventas.',
          rangoEstimacion: '−10 % a +15 % sobre el costo total (factibilidad)',
          supuestos: ecoFields.supuestos.map((x, i) => (i === 0 ? 'Pesos corrientes: los costos unitarios de marzo de 2025 incluyen el reajuste proyectado del ICOCED (5 % a 6 % anual) hasta la mitad de la ejecución de cada etapa; el riesgo R-003 cubre solo el alza por encima de esa proyección (salario mínimo, acero y concreto).'
            : i === 2 ? 'Construcción por administración delegada: los costos reembolsables (COP 89.604 millones en la factibilidad) se pagan contra soporte, más honorarios fijos del constructor del 5 % sobre el costo reembolsable estimado (COP 4.476 millones, 4,8 % de los directos); el concreto y el acero se negocian por volumen para las dos etapas.' : x)),
          fechaPrecios: '2025-03-31',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'CC-002: se agrega la mitigación vial (E-09, COP 430 millones) y la contingencia queda en el 2,5 % de los directos (COP 2.363 millones); directos de la etapa 1 validados con el presupuesto del constructor.' },
    ],
  };

  /* ------------------------------------------------------------ 7.3 Requisitos de financiamiento */
  const CAP = 'Capital de trabajo de la empresa', CLI = 'Anticipo del cliente', BAN = 'Crédito bancario';
  /* [periodo, fecha, egresos LB1, contingencia LB1, financiamiento neto LB1, fuente principal, egresos LB0, contingencia LB0, financiamiento LB0] */
  const FLUJO = [
    ['2025-T1 · ene–mar', '2025-01-01', 3870305458, 0, 3870305458, CAP, 3871839293, 0, 3871839293],
    ['2025-T2 · abr–jun', '2025-04-01', 14570448751, 0, 14570448751, CAP, 17588706477, 0, 17588706477],
    ['2025-T3 · jul–sep', '2025-07-01', 4769557236, 0, 4769557236, CAP, 1841097115, 0, 1841097115],
    ['2025-T4 · oct–dic', '2025-10-01', 1153747729, 0, 1153747729, CAP, 1216506709, 0, 1216506709],
    ['2026-T1 · ene–mar', '2026-01-01', 2358046944, 20442217, 7329540826, CLI, 3775402272, 24162130, 8750616067],
    ['2026-T2 · abr–jun', '2026-04-01', 8815631757, 193350014, 7763241933, BAN, 10458141342, 228534316, 9440935821],
    ['2026-T3 · jul–sep', '2026-07-01', 13269510433, 294348251, 9858546857, BAN, 13802614776, 347911411, 10445214359],
    ['2026-T4 · oct–dic', '2026-10-01', 12698757902, 282019924, 12980777826, BAN, 11803358189, 333339673, 12136697862],
    ['2027-T1 · ene–mar', '2027-01-01', 14008935487, 297175919, 22627846717, CLI, 13309111034, 351253636, 21982099982],
    ['2027-T2 · abr–jun', '2027-04-01', 16217603980, 355171578, 10108977658, BAN, 14390896820, 419802885, 8346901803],
    ['2027-T3 · jul–sep', '2027-07-01', 12800146219, 264816636, 11207025444, CLI, 12413938150, 313005867, 10869006607],
    ['2027-T4 · oct–dic', '2027-10-01', 13726174761, 285275367, 32690937685, CLI, 13404115267, 337187516, 32420790340],
    ['2028-T1 · ene–mar', '2028-01-01', 11979348009, 258234500, 7988317755, BAN, 11972202248, 305225966, 8028163459],
    ['2028-T2 · abr–jun', '2028-04-01', 6006145936, 110539884, 2759728125, CLI, 5999286005, 130655055, 2772983366],
    ['2028-T3 · jul–sep', '2028-07-01', 1504178131, 1625711, 5221500000, CLI, 1481876162, 1921545, 5199493865],
    ['2028-T4 · oct–dic', '2028-10-01', 1324485402, 0, 31221500000, CLI, 1318193511, 0, 31210946875],
    ['2029-T1 · ene–mar', '2029-01-01', 502975864, 0, 0, CLI, 498714630, 0, 0],
  ];
  const periodos = FLUJO.map((f, i) => ({ id: 'rfi-' + String(i + 1).padStart(2, '0'), periodo: f[0], fecha: f[1], egresos: f[2], contingencia: f[3], financiamiento: f[4], fuente: f[5] }));
  const periodosLb0 = FLUJO.map((f, i) => ({ id: 'rfi-' + String(i + 1).padStart(2, '0'), periodo: f[0], fecha: f[1], egresos: f[6], contingencia: f[7], financiamiento: f[8], fuente: f[5] }));
  const rfiFields = {
    presupuestoTotal: 143339 * M,
    lineaBaseCostos: 141939 * M,
    reservaGestion: 1400 * M,
    fuentes: 'Cuatro fuentes, en este orden: (1) aporte de capital del promotor de COP 24.000 millones (lote, compensación VIP y gastos preoperativos), que se agota en noviembre de 2025, con un préstamo puente de socios de unos COP 1.260 millones entre noviembre de 2025 y febrero de 2026 que se paga con el giro de marzo; (2) cuotas iniciales de los compradores (COP 45.995 millones), que la fiduciaria libera al patrimonio autónomo cuando cada etapa alcanza su punto de equilibrio; (3) crédito constructor de Banco Comercial del Valle S.A. (ficticio): COP 30.000 millones para la etapa 1 y COP 26.000 millones para la etapa 2, desembolsados contra el avance certificado por la interventoría; (4) saldo del precio a la escrituración (COP 116.127 millones, con crédito hipotecario, leasing o subsidios), que amortiza el crédito con las subrogaciones. En la columna «Fuente», «Capital de trabajo de la empresa» es el aporte del promotor y «Anticipo del cliente» agrupa los recursos de los compradores (cuotas iniciales y saldos de escrituración); cada trimestre muestra su fuente principal y el financiamiento neto de amortizaciones.',
    periodos,
    condicionesPago: 'Separación de COP 1 millón (VIS) o COP 5 millones (No VIS) y cuota inicial del 20 % (VIS) o 30 % (No VIS) en cuotas mensuales hasta dos meses antes de la entrega, consignadas en el encargo fiduciario de preventas; saldo del 70 % al 80 % con crédito hipotecario, leasing habitacional o subsidios de caja de compensación, desembolsado a la escrituración. La fiduciaria gira las cuotas de cada etapa al patrimonio autónomo solo con el punto de equilibrio certificado (75 % de las viviendas vinculadas, licencia ejecutoriada, lote libre de gravámenes en el patrimonio autónomo, crédito constructor aprobado y presupuesto validado), conforme a la Circular Básica Jurídica de la Superintendencia Financiera (parte II, título II, capítulo I). Pagos a contratistas: por acta mensual de avance, a 30 días, con retención en garantía del 5 % hasta la liquidación.',
    conciliacionLimite: 'Con el plan de la LB1 la holgura acumulada nunca es negativa: es cero durante 2025 (el aporte cubre los egresos y el préstamo de socios el faltante desde noviembre) y vuelve a cero entre septiembre y diciembre de 2026 y en septiembre de 2027, los dos periodos de mayor exigencia de caja de la obra. Para sostenerla, los desembolsos del crédito de la etapa 1 empiezan en junio de 2026 y el crédito de la etapa 2 debe estar aprobado el 15 de enero de 2027, un mes antes de su acta de inicio. El cupo de crédito (COP 56.000 millones, 59 % de los directos) cubre la obra que no financian las cuotas iniciales; la reserva de gestión (COP 1.400 millones) queda en la tesorería del promotor. El excedente final (COP 44.183 millones) devuelve el aporte de COP 24.000 millones y la utilidad antes de impuestos de COP 20.183 millones.',
    riesgosFinanciamiento: 'Atraso del punto de equilibrio de una etapa: retrasa el giro de las cuotas y el inicio de la obra (ocurrió en la etapa 1: cuatro semanas, origen del CC-002). Alza de la IBR (R-002): cada punto adicional cuesta unos COP 500 millones de intereses en el proyecto. Menor velocidad de ventas (R-001) y desistimientos (R-006): menos cuotas iniciales y más uso del crédito. Retrasos en la escrituración y las subrogaciones: postergan la amortización y aumentan los intereses. Mitigación: desembolsos justo a tiempo, conciliación mensual del flujo con la fiduciaria, preaprobación de crédito hipotecario de los compradores y préstamo de socios como puente.',
  };
  const requisitosFinanciamiento = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.est, reviso: R.ger, aprobo: R.jun },
    fields: rfiFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Flujo de la factibilidad (LB0): inicio de obra de la etapa 1 el 16 de febrero de 2026, compensación VIP en junio de 2025.',
        fields: revFields(rfiFields, {
          periodos: periodosLb0,
          fuentes: 'Cuatro fuentes, en este orden: (1) aporte de capital del promotor de COP 24.000 millones (lote, compensación VIP y gastos preoperativos), complementado con un préstamo puente de socios a finales de 2025 que se paga con el giro de las cuotas de la etapa 1; (2) cuotas iniciales de los compradores (COP 45.995 millones), que la fiduciaria libera al patrimonio autónomo cuando cada etapa alcanza su punto de equilibrio; (3) crédito constructor de COP 30.000 millones para la etapa 1 y COP 26.000 millones para la etapa 2, desembolsado contra el avance certificado por la interventoría; (4) saldo del precio a la escrituración (COP 116.127 millones), que amortiza el crédito con las subrogaciones. En la columna «Fuente», «Capital de trabajo de la empresa» es el aporte del promotor y «Anticipo del cliente» agrupa los recursos de los compradores; cada trimestre muestra su fuente principal y el financiamiento neto de amortizaciones.',
          conciliacionLimite: 'La holgura acumulada nunca es negativa: es cero durante 2025 y vuelve a cero entre septiembre y diciembre de 2026 y en septiembre de 2027, los dos periodos de mayor exigencia de caja de la obra. El crédito de la etapa 1 se aprueba en enero de 2026 y desembolsa desde junio de 2026; el de la etapa 2, antes de su acta de inicio (15 de febrero de 2027). El cupo de crédito (COP 56.000 millones) cubre la obra que no financian las cuotas iniciales; la reserva de gestión (COP 1.400 millones) queda en la tesorería del promotor. El excedente final (COP 44.183 millones) devuelve el aporte de COP 24.000 millones y la utilidad antes de impuestos de COP 20.183 millones.',
          riesgosFinanciamiento: 'Atraso del punto de equilibrio de una etapa: retrasa el giro de las cuotas y el inicio de la obra. Alza de la IBR (R-002): cada punto adicional cuesta unos COP 500 millones de intereses en el proyecto. Menor velocidad de ventas (R-001) y desistimientos (R-006): menos cuotas iniciales y más uso del crédito. Retrasos en la escrituración y las subrogaciones: postergan la amortización y aumentan los intereses. Mitigación: desembolsos justo a tiempo, conciliación mensual del flujo con la fiduciaria, preaprobación de crédito hipotecario de los compradores y préstamo de socios como puente.',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'LB1 (CC-002): flujo trimestral con el inicio de obra de la etapa 1 el 16 de marzo de 2026, el punto de equilibrio del 27 de febrero y la mitigación vial con cargo a la contingencia.' },
    ],
  };

  /* ================================================================== 8. CALIDAD */

  /* ------------------------------------------------------------ 8.1 Plan de gestión de la calidad */
  const pgcaObjetivos = rows('pgca-obj', [
    { objetivo: 'Construir la estructura conforme a la NSR-10 y a los planos aprobados en la licencia.', metrica: '% de pisos liberados por la supervisión técnica independiente sin observaciones mayores', meta: '100 %', frecuencia: 'Por hito' },
    { objetivo: 'Obtener el certificado técnico de ocupación de cada etapa en la fecha de la línea base.', metrica: 'Días de diferencia entre el certificado y la fecha de la línea base', meta: '≤ 15 días', frecuencia: 'Por hito' },
    { objetivo: 'Concreto conforme a la resistencia especificada.', metrica: 'Ensayos de cilindros conformes con NSR-10 C.5.6.3.3', meta: '≥ 98 %', frecuencia: 'Semanal' },
    { objetivo: 'Entregar viviendas sin defectos mayores.', metrica: 'Pendientes por vivienda en la inspección previa a la entrega', meta: '≤ 3 menores y 0 mayores', frecuencia: 'Por evento' },
    { objetivo: 'Reducir los reclamos de posventa.', metrica: 'Solicitudes de posventa por vivienda en el primer año', meta: '≤ 1,5', frecuencia: 'Mensual' },
    { objetivo: 'Satisfacción de los compradores con la entrega.', metrica: 'Calificación de la encuesta de entrega (1 a 5)', meta: '≥ 4,2', frecuencia: 'Por evento' },
    { objetivo: 'Diseños coordinados antes de construir.', metrica: 'Interferencias de diseño detectadas en obra por cada 1.000 m² construidos', meta: '≤ 2', frecuencia: 'Mensual' },
  ]);
  const pgcaRoles = rows('pgca-rol', [
    { rol: R.ger, responsabilidades: 'Aprueba el plan de calidad, preside la revisión mensual de calidad, asigna recursos a las acciones correctivas y verifica el cierre de las no conformidades mayores.', autoridad: 'Retener pagos o la entrega de una etapa no conforme; aprobar acciones correctivas con costo dentro de su límite.' },
    { rol: R.con, responsabilidades: 'Ejecuta el plan de inspección y ensayos, controla subcontratistas y proveedores y reporta cada mes las métricas de calidad.', autoridad: 'Detener un vaciado o una actividad no conforme; rechazar materiales.' },
    { rol: 'Inspector de calidad (constructor)', responsabilidades: 'Inspecciona cada piso antes del vaciado (refuerzo, recubrimiento, embebidos y formaleta), toma las muestras de concreto y lleva el registro de mediciones.', autoridad: 'Retener la liberación de un piso hasta que se corrija.' },
    { rol: R.sti, responsabilidades: 'Verifica que la construcción cumpla los planos y especificaciones aprobados y la NSR-10 (Título I); libera cada piso y emite el certificado técnico de ocupación de cada etapa.', autoridad: 'Ordenar la corrección o demolición de elementos no conformes; abstenerse de expedir el certificado técnico.' },
    { rol: R.ies + ' (diseñador)', responsabilidades: 'Atiende consultas técnicas, aprueba cambios al diseño estructural y evalúa ensayos fuera de especificación (núcleos, pruebas de carga).', autoridad: 'Aprobar o rechazar desviaciones del diseño estructural.' },
    { rol: R.arq, responsabilidades: 'Coordina los diseños, controla las especificaciones de acabados y del apartamento modelo y aprueba muestras.', autoridad: 'Aprobar o rechazar materiales y acabados.' },
    { rol: R.int, responsabilidades: 'Verifica avance y calidad antes de certificar las actas que soportan los giros y los desembolsos.', autoridad: 'Abstenerse de certificar el avance no conforme.' },
    { rol: 'Laboratorio de ensayos', responsabilidades: EMP.lab + ': ensaya cilindros, acero, suelos y núcleos con equipos calibrados, como laboratorio acreditado ante el ONAC.', autoridad: 'Emitir los resultados oficiales de ensayo.' },
  ]);
  const pgcaEntregables = rows('pgca-ent', [
    { entregable: 'Diseños y licencia', criterio: 'Diseños coordinados, revisión independiente estructural aprobada y licencia ejecutoriada sin condicionamientos pendientes.', aseguramiento: 'Comité quincenal de coordinación de diseños y lista de chequeo de radicación de la curaduría.', control: 'Revisión independiente de los diseños estructurales (Ley 1796 de 2016) y atención del acta de observaciones.', responsable: R.arq },
    { entregable: 'Movimiento de tierras, contención y cimentación', criterio: 'Cortes y contenciones según el estudio geotécnico; pilas con integridad verificada (PIT) y cotas de fundación aprobadas.', aseguramiento: 'Procedimiento de excavación por terrazas con drenajes provisionales e inclinómetros.', control: 'Lecturas de inclinómetros (MC-06), ensayos de integridad (MC-05) y recibo del geotecnista.', responsable: R.con },
    { entregable: 'Estructura (muros vaciados, losas y plataforma)', criterio: 'Resistencia, asentamiento, plomo y recubrimiento dentro de MC-01 a MC-04; liberación por piso de la supervisión técnica.', aseguramiento: 'Plan de inspección y ensayos, capacitación de las cuadrillas en el sistema industrializado y curado de cilindros según NTC 550.', control: 'Inspección previa a cada vaciado, ensayos de laboratorio y liberación por piso.', responsable: R.ins },
    { entregable: 'Instalaciones hidrosanitarias, de gas, eléctricas y de telecomunicaciones', criterio: 'Pruebas hidrostáticas (MC-07) y de hermeticidad de gas conformes; dictámenes RETIE y RITEL.', aseguramiento: 'Planos de taller aprobados y protocolos por piso.', control: 'Pruebas por piso y por bajante; inspección por organismo acreditado.', responsable: R.res },
    { entregable: 'Acabados y vivienda terminada', criterio: 'Especificación del apartamento modelo y no más de 3 pendientes menores por vivienda (MC-08).', aseguramiento: 'Muestras aprobadas y un apartamento piloto por bloque.', control: 'Lista de chequeo por vivienda antes de la entrega.', responsable: R.con },
    { entregable: 'Zonas comunes, urbanismo y cesiones', criterio: 'Obras conformes con la licencia y recibidas por EPM, la Secretaría de Movilidad y el Distrito.', aseguramiento: 'Coordinación con las entidades y visitas previas de recibo.', control: 'Actas de recibo de redes y de obras de urbanismo; entrega de zonas comunes a la copropiedad.', responsable: R.ger },
  ]);
  const pgcaFields = {
    estandares: [
      'NSR-10 (Decreto 926 de 2010, modificado por el Decreto 945 de 2017): Título C (concreto estructural), Título I (supervisión técnica) y Títulos J y K (protección contra incendio y requisitos complementarios).',
      'Ley 400 de 1997 y Ley 1796 de 2016 con el Decreto 1203 de 2017: revisión independiente de los diseños estructurales, supervisión técnica independiente y certificado técnico de ocupación.',
      'NTC 550 y NTC 673 (elaboración, curado y ensayo de cilindros de concreto), NTC 396 (asentamiento), NTC 3318 (concreto premezclado) y NTC 2289 (barras corrugadas para refuerzo).',
      'NTC 1500 (Código Colombiano de Fontanería) y normas de diseño y construcción de redes de EPM.',
      'RETIE vigente (MinEnergía), RETILAP (Resolución 180540 de 2010) y RITEL (Resolución CRC 5050 de 2016, título 8), con inspección por organismo acreditado.',
      'Resolución 0194 de 2025 de MinVivienda (construcción sostenible): metas de ahorro de agua y energía obligatorias en las VIS.',
      'Ley 1480 de 2011 y Decreto 1074 de 2015: garantía legal de inmuebles nuevos (estabilidad de la obra por 10 años y acabados por 1 año); Ley 675 de 2001 (propiedad horizontal).',
      'Acuerdo 48 de 2014 (POT de Medellín), licencia de urbanización y construcción y planos aprobados por la curaduría.',
      'NTC-ISO 9001:2015 como referencia del sistema de gestión de calidad del constructor.',
    ],
    objetivos: pgcaObjetivos,
    rolesCalidad: pgcaRoles,
    entregablesRevision: pgcaEntregables,
    herramientas: [
      'Plan de inspección y ensayos por capítulo, con puntos de espera y de liberación.',
      'Listas de verificación por piso y por vivienda.',
      'Gráfico de control de la resistencia del concreto a 28 días.',
      'Diagramas de Pareto de no conformidades y de jornadas perdidas por causa.',
      'Diagramas de causa y efecto (Ishikawa) para no conformidades repetidas.',
      'Auditoría mensual al proceso constructivo del constructor.',
      'Coordinación de diseños en un modelo BIM para detectar interferencias antes de construir.',
    ],
    costoCalidad: 'Costos de conformidad: laboratorio de ensayos (cilindros, acero, suelos e integridad de pilas), inspector de calidad del constructor, supervisión técnica independiente (COP 567 millones) y revisión independiente de los diseños estructurales (COP 85 millones). Costos de no conformidad: reparaciones, demoliciones y extracción de núcleos, reprocesos de instalaciones y atención de posventas (presupuesto de COP 756 millones, 0,8 % de los directos). Meta: costos internos de no conformidad menores del 0,3 % de los directos de cada etapa.',
    procedimientoNoConformidades: 'Toda no conformidad se registra el mismo día en las mediciones de control de calidad con su causa y se clasifica como menor (se corrige en el piso antes de liberarlo) o mayor (afecta la estructura, la seguridad o la licencia). Tratamiento: 1) identificación y bloqueo del elemento o del lote; 2) evaluación del ingeniero estructural o del diseñador responsable; 3) corrección, reparación o demolición aprobada; 4) verificación del inspector de calidad y de la supervisión técnica; 5) cierre documentado. Las no conformidades mayores se informan al gerente de proyecto el mismo día.',
    accionesCorrectivas: 'Para las no conformidades mayores o repetidas (dos o más con la misma causa en un mes), el constructor presenta en cinco días hábiles un análisis de causa raíz (Ishikawa o cinco porqués) y un plan de acción con responsable y fecha; el gerente de proyecto lo aprueba y el inspector de calidad verifica su eficacia en los vaciados siguientes. Si la acción tiene costo o cambia una especificación, se tramita como solicitud de cambio.',
    mejoraContinua: 'Revisión mensual de calidad en el comité de gerencia con los indicadores del periodo; lecciones aprendidas de la etapa 1 incorporadas al plan de la etapa 2 antes de su acta de inicio; auditoría trimestral del sistema de calidad del constructor y encuesta de satisfacción de los compradores en cada entrega.',
  };
  const planGestionCalidad = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.con, aprobo: R.jun },
    fields: pgcaFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Emisión con el plan para la dirección del proyecto: calidad de estudios, diseños, licencias y ventas, y requisitos generales para el plan de calidad del constructor.',
        fields: revFields(pgcaFields, {
          /* la Resolución 0194 de 2025 se publicó el 23 de abril de 2025, un día después de esta emisión */
          estandares: pgcaFields.estandares.map((x) => (x.startsWith('Resolución 0194') ? 'Resolución 0549 de 2015 de MinVivienda (construcción sostenible): metas de ahorro de agua y energía en edificaciones nuevas.' : x)),
          objetivos: patchRows(pgcaObjetivos, null, ['pgca-obj-03', 'pgca-obj-05']),
          rolesCalidad: patchRows(pgcaRoles, {
            'pgca-rol-02': { responsabilidades: 'Constructor por seleccionar: presentará el plan de inspección y ensayos de cada etapa antes de su acta de inicio, conforme a este plan.' },
          }, ['pgca-rol-03', 'pgca-rol-07', 'pgca-rol-08']),
          entregablesRevision: patchRows(pgcaEntregables, {
            'pgca-ent-03': { aseguramiento: 'Plan de inspección y ensayos del constructor, por aprobar antes del acta de inicio de cada etapa.', control: 'Inspección previa a cada vaciado, ensayos de laboratorio y liberación por piso de la supervisión técnica independiente.' },
          }, ['pgca-ent-04']),
          costoCalidad: 'Costos de conformidad: supervisión técnica independiente (COP 567 millones), revisión independiente de los diseños estructurales (COP 85 millones), laboratorio de ensayos e inspector de calidad del constructor dentro de la administración de obra. Costos de no conformidad: reparaciones, demoliciones, reprocesos y atención de posventas (presupuesto de COP 756 millones, 0,8 % de los directos).',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Incorpora el plan de inspección y ensayos del constructor (contrato CT-015), la supervisión técnica independiente (CT-016), el laboratorio y las métricas MC-01 a MC-08 antes del acta de inicio de la etapa 1.' },
    ],
  };

  /* ------------------------------------------------------------ 8.1 Métricas de calidad */
  const metricasCalidad = {
    status: 'aprobado', rev: '0', date: LB1,
    titleBlock: { elaboro: R.con, reviso: R.sup, aprobo: R.ger },
    fields: {
      metricas: rows('mcal', [
        { codigo: 'MC-01', entregable: 'Estructura', metrica: 'Resistencia del concreto a 28 días', definicion: 'Resistencia a la compresión de cilindros estándar a 28 días. Especificada: f\'c = 28 MPa en muros y losas; objetivo de dosificación f\'cr = 33 MPa.', metodo: 'Cilindros (NTC 550 y NTC 673) por cada 40 m³ o por vaciado de piso', tolerancia: 'Promedio de 3 ensayos consecutivos ≥ f\'c y ningún ensayo < f\'c − 3,5 MPa (NSR-10 C.5.6.3.3)', frecuencia: 'Semanal', responsable: R.ins },
        { codigo: 'MC-02', entregable: 'Estructura', metrica: 'Asentamiento del concreto fluido de muros', definicion: 'Asentamiento medido con el cono de Abrams a la llegada de cada mixer, antes de vaciar.', metodo: 'Cono de Abrams (NTC 396) en cada mixer', tolerancia: '180 ± 25 mm', frecuencia: 'Diaria', responsable: R.ins },
        { codigo: 'MC-03', entregable: 'Estructura', metrica: 'Plomo de muros', definicion: 'Desplome de los muros de fachada y de núcleo por piso, en milímetros.', metodo: 'Plomada o nivel láser, por muro de fachada y por piso', tolerancia: '≤ 6 mm por piso de 2,4 m', frecuencia: 'Por evento', responsable: R.res },
        { codigo: 'MC-04', entregable: 'Estructura', metrica: 'Recubrimiento del acero de refuerzo', definicion: 'Espesor de concreto entre el acero de refuerzo y la cara del elemento.', metodo: 'Medición antes de cerrar la formaleta, 100 % de los paños', tolerancia: '≥ 20 mm en muros interiores y ≥ 40 mm en elementos en contacto con el suelo (NSR-10 C.7.7)', frecuencia: 'Por evento', responsable: R.sti },
        { codigo: 'MC-05', entregable: 'Cimentación', metrica: 'Integridad de pilas', definicion: 'Continuidad del fuste de las pilas pre-excavadas por ensayo de baja deformación.', metodo: 'Ensayo de integridad (PIT) en el 100 % de las pilas', tolerancia: 'Sin anomalías; toda anomalía se evalúa con el diseñador', frecuencia: 'Por hito', responsable: R.ies },
        { codigo: 'MC-06', entregable: 'Taludes', metrica: 'Desplazamiento en inclinómetros', definicion: 'Desplazamiento horizontal acumulado en los inclinómetros del talud oriental y de las terrazas.', metodo: 'Inclinómetros con lectura diaria en temporada de lluvias y semanal en verano', tolerancia: 'Alerta > 10 mm; alarma > 25 mm acumulados', frecuencia: 'Diaria', responsable: R.con },
        { codigo: 'MC-07', entregable: 'Instalaciones', metrica: 'Prueba hidrostática de redes de agua', definicion: 'Presión sostenida en las redes de agua potable y de la red contra incendio antes de cerrar muros y placas.', metodo: 'Manómetro calibrado, por piso y por bajante', tolerancia: '150 psi durante 2 horas sin caída de presión', frecuencia: 'Por evento', responsable: R.res },
        { codigo: 'MC-08', entregable: 'Entregas', metrica: 'Pendientes por vivienda en la inspección previa', definicion: 'Defectos encontrados en la inspección previa a la entrega, clasificados como menores (estéticos) o mayores (funcionales o de seguridad).', metodo: 'Lista de chequeo por vivienda', tolerancia: '≤ 3 pendientes menores y ninguno mayor', frecuencia: 'Por evento', responsable: R.con },
      ]),
      instrumentos: 'Prensa de compresión del laboratorio con certificado de calibración vigente (laboratorio acreditado ante el ONAC); cono de Abrams y moldes de cilindros del constructor revisados cada mes; nivel láser y plomadas verificados cada mes contra una referencia fija; inclinómetros con sonda calibrada por el fabricante; manómetros de prueba hidrostática con certificado de calibración de menos de un año; flexómetros y calibradores para el recubrimiento.',
      registro: 'Cada medición se anota el mismo día en el registro de mediciones de control de calidad con fecha, entregable, métrica, resultado y conformidad; las no conformes llevan causa y acción. Los ensayos de laboratorio se archivan con su número de informe y alimentan el gráfico de control de la resistencia del concreto. El supervisor técnico independiente firma la liberación de cada piso en la bitácora de obra.',
    },
  };

  /* ------------------------------------------------------------ 8.2 Documentos de prueba y evaluación */
  const pruebas = rows('dpe', [
    { codigo: 'PR-01', documento: 'Protocolo de excavación y lectura de inclinómetros', entregable: 'Movimiento de tierras y taludes', tipo: 'Protocolo de inspección', criterio: 'Cortes por terrazas de máximo 3 m con drenajes provisionales; desplazamiento acumulado menor de 10 mm (alerta) y de 25 mm (alarma).', responsable: R.con, frecuencia: 'Diaria', evidencia: 'Formato de lectura de inclinómetros y bitácora' },
    { codigo: 'PR-02', documento: 'Ensayo de integridad de pilas (PIT)', entregable: 'Cimentación', tipo: 'Prueba de aceptación', criterio: 'Sin anomalías en el 100 % de las pilas; una pila con anomalía se evalúa con el ingeniero estructural.', responsable: R.ies, frecuencia: 'Por hito', evidencia: 'Informe del laboratorio por grupo de pilas' },
    { codigo: 'PR-03', documento: 'Lista de verificación previa al vaciado (refuerzo, recubrimiento, embebidos y formaleta)', entregable: 'Estructura', tipo: 'Inspección preoperacional', criterio: 'Refuerzo según planos; recubrimiento ≥ 20 mm (40 mm contra el suelo); tuberías embebidas probadas; formaleta aplomada y limpia.', responsable: R.ins, frecuencia: 'Por evento', evidencia: 'Lista firmada por el inspector y el supervisor técnico' },
    { codigo: 'PR-04', documento: 'Muestreo y ensayo de cilindros de concreto (NTC 550 y NTC 673)', entregable: 'Estructura', tipo: 'Prueba de aceptación', criterio: 'Promedio de 3 ensayos consecutivos ≥ 28 MPa y ningún ensayo < 24,5 MPa (NSR-10 C.5.6.3.3).', responsable: R.ins, frecuencia: 'Por evento', evidencia: 'Informe del laboratorio y gráfico de control' },
    { codigo: 'PR-05', documento: 'Asentamiento del concreto en obra (NTC 396)', entregable: 'Estructura', tipo: 'Prueba de aceptación', criterio: '180 ± 25 mm; el mixer fuera de rango se rechaza.', responsable: R.ins, frecuencia: 'Diaria', evidencia: 'Remisión del mixer con el resultado anotado' },
    { codigo: 'PR-06', documento: 'Ensayo de tracción y doblamiento del acero de refuerzo (NTC 2289)', entregable: 'Estructura', tipo: 'Prueba de aceptación', criterio: 'Fluencia ≥ 420 MPa, resistencia y alargamiento según NTC 2289, por lote y por diámetro.', responsable: R.ins, frecuencia: 'Por evento', evidencia: 'Certificado del fabricante e informe del laboratorio' },
    { codigo: 'PR-07', documento: 'Extracción y ensayo de núcleos de concreto (NSR-10 C.5.6.5)', entregable: 'Estructura', tipo: 'Prueba de aceptación', criterio: 'Promedio de 3 núcleos ≥ 85 % de f\'c y ningún núcleo < 75 % de f\'c.', responsable: R.ies, frecuencia: 'Por evento', evidencia: 'Informe del laboratorio y concepto del diseñador estructural' },
    { codigo: 'PR-08', documento: 'Liberación de piso por la supervisión técnica independiente', entregable: 'Estructura', tipo: 'Auditoría', criterio: 'Piso conforme a los planos aprobados y a la NSR-10, sin no conformidades abiertas.', responsable: R.sti, frecuencia: 'Por hito', evidencia: 'Anotación de liberación en la bitácora de obra' },
    { codigo: 'PR-09', documento: 'Prueba hidrostática de redes de agua y red contra incendio', entregable: 'Instalaciones hidrosanitarias', tipo: 'Prueba de aceptación', criterio: '150 psi durante 2 horas sin caída de presión.', responsable: R.res, frecuencia: 'Por evento', evidencia: 'Formato de prueba firmado por piso' },
    { codigo: 'PR-10', documento: 'Prueba de estanqueidad de desagües y de hermeticidad de la red de gas', entregable: 'Instalaciones hidrosanitarias y de gas', tipo: 'Prueba de aceptación', criterio: 'Desagües llenos durante 24 horas sin fugas; red de gas sin caída de presión según la norma de EPM.', responsable: R.res, frecuencia: 'Por evento', evidencia: 'Formato de prueba y certificado del instalador' },
    { codigo: 'PR-11', documento: 'Inspección RETIE y RITEL', entregable: 'Instalaciones eléctricas y de telecomunicaciones', tipo: 'Prueba de aceptación', criterio: 'Dictamen de inspección conforme por organismo acreditado ante el ONAC.', responsable: R.con, frecuencia: 'Por hito', evidencia: 'Dictamen y declaración de cumplimiento' },
    { codigo: 'PR-12', documento: 'Lista de chequeo de entrega de vivienda', entregable: 'Viviendas', tipo: 'Lista de verificación', criterio: 'No más de 3 pendientes menores y ninguno mayor (MC-08); el comprador firma el acta de entrega.', responsable: R.con, frecuencia: 'Por evento', evidencia: 'Lista de chequeo y acta de entrega por vivienda' },
    { codigo: 'PR-13', documento: 'Auditoría mensual al proceso constructivo', entregable: 'Construcción', tipo: 'Auditoría', criterio: 'Cumplimiento de al menos el 90 % de los puntos del plan de inspección y ensayos.', responsable: R.ger, frecuencia: 'Mensual', evidencia: 'Informe de auditoría' },
  ]);
  const itemsVerificacion = rows('dpe-it', [
    { item: 'Ejes y niveles', criterio: 'Ejes replanteados por topografía; nivel de losa ± 5 mm.', referencia: 'Planos arquitectónicos y estructurales' },
    { item: 'Acero de refuerzo', criterio: 'Diámetros, cantidades, separaciones y traslapos según planos; sin óxido suelto ni grasa.', referencia: 'Planos estructurales; NSR-10 C.7 y C.12' },
    { item: 'Recubrimiento', criterio: '≥ 20 mm en muros interiores y 40 mm contra el suelo; panelas de separación instaladas cada 60 cm.', referencia: 'NSR-10 C.7.7' },
    { item: 'Instalaciones embebidas', criterio: 'Tuberías probadas y fijadas, cajas eléctricas tapadas y pases según planos.', referencia: 'Planos de instalaciones' },
    { item: 'Formaleta', criterio: 'Paneles limpios, con desmoldante, alineados, aplomados (≤ 6 mm por piso) y con corbatas completas.', referencia: 'Manual del sistema industrializado' },
    { item: 'Juntas de construcción', criterio: 'Juntas en la posición del plano, limpias y con la superficie preparada.', referencia: 'Planos estructurales' },
    { item: 'Concreto', criterio: 'Remisión con f\'c = 28 MPa, asentamiento de 180 ± 25 mm y menos de 90 minutos desde el despacho.', referencia: 'NTC 3318 y NTC 396' },
    { item: 'Toma y curado de muestras', criterio: 'Seis cilindros por cada 40 m³ o por vaciado, identificados, protegidos del sol el primer día y llevados al cuarto de curado.', referencia: 'NTC 550' },
    { item: 'Seguridad', criterio: 'Barandas perimetrales, líneas de vida y permiso de trabajo en alturas vigente.', referencia: 'Resolución 4272 de 2021' },
    { item: 'Liberación', criterio: 'Firma del inspector de calidad y anotación del supervisor técnico independiente en la bitácora.', referencia: 'NSR-10 Título I y Ley 1796 de 2016' },
  ]);
  const dpeFields = {
    pruebas,
    itemsVerificacion,
    aprobacionCliente: 'Los protocolos de estructura se acordaron con la supervisión técnica independiente antes del acta de inicio de la etapa 1 (16 de marzo de 2026); la interventoría del banco y la fiduciaria recibe copia de las liberaciones por piso para certificar el avance. La revisión 1A agrega la extracción de núcleos (PR-07, tras el INC-005), el curado de cilindros en cuarto de curado, los protocolos de instalaciones del bloque A (PR-09 a PR-11) y la auditoría mensual; se presenta para aprobación en el comité de gerencia de octubre de 2026.',
    archivo: 'Repositorio del proyecto, carpeta 08-Calidad/Protocolos, y archivo físico en el campamento de obra (una carpeta por bloque y por piso).',
  };
  const documentosPrueba = {
    status: 'revision', rev: '1A', date: CUT,
    titleBlock: { elaboro: R.con, reviso: R.sup },
    fields: dpeFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB1, note: 'Protocolos de movimiento de tierras, cimentación y estructura para el acta de inicio de la etapa 1.',
        fields: revFields(dpeFields, {
          pruebas: patchRows(pruebas, null, ['dpe-07', 'dpe-09', 'dpe-10', 'dpe-11', 'dpe-13']),
          itemsVerificacion: patchRows(itemsVerificacion, { 'dpe-it-08': { item: 'Toma de muestras', criterio: 'Seis cilindros por cada 40 m³ o por vaciado, identificados y curados según NTC 550.' } }),
          aprobacionCliente: 'Los protocolos de estructura se acordaron con la supervisión técnica independiente antes del acta de inicio de la etapa 1 (16 de marzo de 2026); la interventoría del banco y la fiduciaria recibe copia de las liberaciones por piso para certificar el avance.',
        }),
      },
    ],
  };

  /* ------------------------------------------------------------ 8.2 Informes de calidad (julio, agosto y septiembre de 2026) */
  const DEST_CAL = 'Gerente de proyecto; supervisión técnica independiente; interventoría del banco y la fiduciaria';
  const informeCalidad = {
    instances: [
      {
        key: 'ej1', title: 'Informe de calidad — julio de 2026', status: 'aprobado', rev: '0', date: '2026-08-07',
        titleBlock: { elaboro: R.ins, reviso: R.con, aprobo: R.ger },
        fields: {
          fecha: '2026-08-05', periodoDesde: '2026-07-01', periodoHasta: '2026-07-31', elaboradoPor: 'Inspector de calidad (constructor)', destinatarios: DEST_CAL,
          inspecciones: 46, noConformidades: 2, conformidad: 95.7,
          resumen: 'En julio terminaron la contención adicional del talud oriental (11 de julio), las pilas de la etapa 1 (11 de julio) y el movimiento de tierras (17 de julio), y empezó la estructura del bloque A (13 de julio). Se hicieron 46 inspecciones con 2 no conformidades: dos muros de fachada del piso 2 del bloque A fuera de plomo (8 y 9 mm) por formaleta mal aplomada, corregidos antes de vaciar el piso 3. Las pilas ensayadas no muestran anomalías y los inclinómetros del talud oriental están estables después de la pantalla anclada. Los hormigueros de junio en las vigas de amarre de la plataforma quedaron reparados con mortero de reparación estructural.',
          resultadosMetricas: rows('ical1-m', [
            { metrica: 'MC-01 Resistencia del concreto a 28 días', meta: 'Promedio de 3 ≥ 28 MPa; ningún ensayo < 24,5 MPa', resultado: '5 ensayos; promedio 33,3 MPa; mínimo 32,6 MPa', estado: 'Cumple', comentario: 'Proceso estable, cerca del objetivo de 33 MPa.' },
            { metrica: 'MC-02 Asentamiento', meta: '180 ± 25 mm', resultado: '58 mixers; 2 rechazados con 145 mm', estado: 'Cumple con observaciones', comentario: 'Rechazo en planta informado al proveedor de concreto.' },
            { metrica: 'MC-03 Plomo de muros', meta: '≤ 6 mm por piso', resultado: '2 muros con 8 y 9 mm en el piso 2 del bloque A', estado: 'Cumple con observaciones', comentario: 'Corregidos antes del vaciado siguiente.' },
            { metrica: 'MC-05 Integridad de pilas', meta: 'Sin anomalías', resultado: 'Pilas de la etapa 1 sin anomalías', estado: 'Cumple', comentario: 'Informe del laboratorio aceptado por el ingeniero estructural.' },
            { metrica: 'MC-06 Inclinómetros', meta: 'Alerta > 10 mm', resultado: 'Máximo 6 mm acumulados', estado: 'Cumple', comentario: 'Lectura diaria mientras dure la temporada de lluvias.' },
          ]),
          incidentes: rows('ical1-i', [
            { descripcion: 'Plomo de 9 mm y 8 mm en dos muros de fachada del piso 2 del bloque A.', causa: 'Formaleta mal aplomada por cuadrilla nueva en el sistema industrializado.', accion: 'Reaplome de paneles, verificación con nivel láser antes de cada vaciado y capacitación del proveedor de formaleta.', responsable: R.con, fecha: '2026-07-31', estado: 'Cerrada' },
            { descripcion: 'Hormigueros en vigas de amarre de la plataforma (no conformidad de junio).', causa: 'Vibrado insuficiente.', accion: 'Reparación con mortero estructural aprobada por el ingeniero estructural y dos vibradores adicionales.', responsable: R.con, fecha: '2026-07-15', estado: 'Cerrada' },
          ]),
          recomendaciones: 'Mantener la verificación de plomo con nivel láser en todos los muros de fachada hasta que la cuadrilla estabilice su rendimiento; programar la capacitación de la segunda cuadrilla antes de iniciar el bloque B.',
          escalamientos: 'Ninguno.',
        },
      },
      {
        key: 'ej2', title: 'Informe de calidad — agosto de 2026', status: 'aprobado', rev: '0', date: '2026-09-08',
        titleBlock: { elaboro: R.ins, reviso: R.con, aprobo: R.ger },
        fields: {
          fecha: '2026-09-04', periodoDesde: '2026-08-01', periodoHasta: '2026-08-31', elaboradoPor: 'Inspector de calidad (constructor)', destinatarios: DEST_CAL,
          inspecciones: 58, noConformidades: 3, conformidad: 94.8,
          resumen: 'En agosto terminó la cimentación de la etapa 1 (21 de agosto), avanzaron la plataforma y el bloque A y empezó el bloque B (24 de agosto). Se hicieron 58 inspecciones con 3 no conformidades: un juego de cilindros del piso 3 del bloque A con 25,1 MPa a 28 días (por debajo de f\'c y del límite inferior de control, aunque sobre f\'c − 3,5 MPa) y dos muros del piso 4 del bloque A con recubrimiento de 12 y 15 mm. Los cilindros se habían curado al sol en la obra; se pidió concepto al diseñador estructural y la extracción de núcleos (INC-005). Los recubrimientos se corrigieron con panelas antes de vaciar.',
          resultadosMetricas: rows('ical2-m', [
            { metrica: 'MC-01 Resistencia del concreto a 28 días', meta: 'Promedio de 3 ≥ 28 MPa; ningún ensayo < 24,5 MPa', resultado: '8 ensayos; promedio 32,5 MPa; mínimo 25,1 MPa (12 de agosto)', estado: 'Cumple con observaciones', comentario: 'Cumple el criterio de la NSR-10, pero el punto del 12 de agosto está fuera de los límites de control calculados con los 18 ensayos disponibles al 31 de agosto (26,7 a 39,0 MPa).' },
            { metrica: 'MC-02 Asentamiento', meta: '180 ± 25 mm', resultado: '71 mixers; todos en rango', estado: 'Cumple', comentario: '' },
            { metrica: 'MC-03 Plomo de muros', meta: '≤ 6 mm por piso', resultado: 'Máximo 5 mm', estado: 'Cumple', comentario: 'La acción de julio fue eficaz.' },
            { metrica: 'MC-04 Recubrimiento', meta: '≥ 20 mm en muros interiores', resultado: '2 muros del piso 4 del bloque A con 12 y 15 mm', estado: 'Cumple con observaciones', comentario: 'Corregidos antes del vaciado.' },
            { metrica: 'MC-06 Inclinómetros', meta: 'Alerta > 10 mm', resultado: 'Máximo 7 mm acumulados', estado: 'Cumple', comentario: '' },
          ]),
          incidentes: rows('ical2-i', [
            { descripcion: 'Cilindros del piso 3 del bloque A con 25,1 MPa a 28 días (INC-005).', causa: 'Cilindros curados al sol en la obra durante las primeras 24 horas.', accion: 'Extracción de tres núcleos (NSR-10 C.5.6.5), cuarto de curado en el campamento (en servicio desde el 18 de agosto) y capacitación del personal de muestreo.', responsable: R.con, fecha: '2026-09-11', estado: 'En curso' },
            { descripcion: 'Recubrimiento de 12 y 15 mm en dos muros del piso 4 del bloque A.', causa: 'Panelas de separación faltantes.', accion: 'Instalación de panelas cada 60 cm y verificación del 100 % de los paños antes de cerrar la formaleta.', responsable: R.ins, fecha: '2026-08-29', estado: 'Cerrada' },
          ]),
          recomendaciones: 'Instalar el cuarto de curado desde el primer vaciado en la etapa 2; incluir la verificación de panelas en la lista previa al vaciado.',
          escalamientos: 'INC-005 informado al gerente de proyecto y a la supervisión técnica el 13 de agosto; resultado de núcleos pendiente para la primera semana de septiembre.',
        },
      },
      {
        key: 'ej3', title: 'Informe de calidad — septiembre de 2026', status: 'revision', rev: 'A', date: CUT,
        titleBlock: { elaboro: R.ins, reviso: R.con },
        fields: {
          fecha: CUT, periodoDesde: '2026-09-01', periodoHasta: CUT, elaboradoPor: 'Inspector de calidad (constructor)', destinatarios: DEST_CAL,
          inspecciones: 64, noConformidades: 1, conformidad: 98.4,
          resumen: 'En septiembre terminó la estructura de la plataforma (18 de septiembre) y la restauración del retiro de la quebrada (26 de septiembre); el bloque A llegó al piso 6 y el bloque B al piso 3; empezaron la mampostería (21 %) y las instalaciones (8 %) del bloque A. Se hicieron 64 inspecciones con 1 no conformidad: fuga en la prueba hidrostática del piso 1 del bloque A por una unión mal soldada, rehecha y probada de nuevo el 29 de septiembre. Los núcleos del piso 3 del bloque A dieron 29,4 MPa en promedio (conformes con NSR-10 C.5.6.5), por lo que el concreto se aceptó y el INC-005 quedó resuelto. Todos los ensayos de resistencia del mes estuvieron dentro de los límites de control.',
          resultadosMetricas: rows('ical3-m', [
            { metrica: 'MC-01 Resistencia del concreto a 28 días', meta: 'Promedio de 3 ≥ 28 MPa; ningún ensayo < 24,5 MPa', resultado: '7 ensayos; promedio 33,3 MPa; mínimo 32,5 MPa', estado: 'Cumple', comentario: 'Desde el 18 de agosto los cilindros se curan en el cuarto de curado.' },
            { metrica: 'MC-03 Plomo de muros', meta: '≤ 6 mm por piso', resultado: 'Máximo 5 mm', estado: 'Cumple', comentario: '' },
            { metrica: 'MC-04 Recubrimiento', meta: '≥ 20 mm en muros interiores', resultado: 'Todos los paños conformes', estado: 'Cumple', comentario: '' },
            { metrica: 'MC-06 Inclinómetros', meta: 'Alerta > 10 mm', resultado: 'Máximo 7 mm acumulados', estado: 'Cumple', comentario: 'Se vuelve a lectura diaria en octubre por la segunda temporada de lluvias.' },
            { metrica: 'MC-07 Prueba hidrostática', meta: '150 psi, 2 horas sin caída', resultado: '2 pruebas; 1 con caída de 20 psi (piso 1 del bloque A)', estado: 'Cumple con observaciones', comentario: 'Repetida y conforme el 29 de septiembre.' },
          ]),
          incidentes: rows('ical3-i', [
            { descripcion: 'Fuga en la prueba hidrostática del piso 1 del bloque A.', causa: 'Unión mal soldada.', accion: 'Unión rehecha, prueba repetida y prueba por tramo antes de cerrar muros.', responsable: R.res, fecha: '2026-09-29', estado: 'Cerrada' },
            { descripcion: 'Cierre del INC-005 (cilindros de 25,1 MPa del piso 3 del bloque A).', causa: 'Curado deficiente de cilindros en obra.', accion: 'Núcleos de 29,4 MPa en promedio: concreto aceptado; cuarto de curado en operación.', responsable: R.con, fecha: '2026-09-11', estado: 'Cerrada' },
          ]),
          recomendaciones: 'Certificar internamente a los soldadores de tubería del subcontratista de instalaciones; programar la prueba por tramo en los pisos 2 a 8 del bloque A.',
          escalamientos: 'Ninguno pendiente; se informa a la junta el cierre del INC-005.',
        },
      },
    ],
  };

  /* ------------------------------------------------------------ 8.3 Mediciones de control de calidad */
  const medicionesControl = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.ins, reviso: R.con },
    fields: {
      mediciones: rows('mcc', [
        { fecha: '2026-05-29', entregable: 'Pilas de la etapa 1, primer grupo', metrica: 'MC-05 Integridad de pilas', resultado: 'Sin anomalías', conforme: 'Sí', causa: '', accion: 'Pilas aceptadas.' },
        { fecha: '2026-06-02', entregable: 'Pilas de la etapa 1', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '33,1 MPa', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-06-19', entregable: 'Viga de amarre del eje 4 de la plataforma, tramo A-B', metrica: 'Inspección del concreto endurecido', resultado: 'Hormigueros de 4 cm de profundidad', conforme: 'No', causa: 'Vibrado insuficiente', accion: 'Reparación con mortero estructural aprobada por el ingeniero estructural.' },
        { fecha: '2026-06-19', entregable: 'Viga de amarre del eje 4 de la plataforma, tramo C-D', metrica: 'Inspección del concreto endurecido', resultado: 'Hormigueros superficiales', conforme: 'No', causa: 'Vibrado insuficiente', accion: 'Reparación con mortero estructural.' },
        { fecha: '2026-06-30', entregable: 'Viga de amarre del eje 6 de la plataforma, tramo B-C', metrica: 'Inspección del concreto endurecido', resultado: 'Hormigueros superficiales', conforme: 'No', causa: 'Vibrado insuficiente', accion: 'Reparación; dos vibradores adicionales y capacitación de la cuadrilla.' },
        { fecha: '2026-07-10', entregable: 'Pilas de la etapa 1, segundo grupo', metrica: 'MC-05 Integridad de pilas', resultado: 'Sin anomalías', conforme: 'Sí', causa: '', accion: 'Pilas aceptadas.' },
        { fecha: '2026-07-15', entregable: 'Talud oriental (después de la pantalla anclada)', metrica: 'MC-06 Inclinómetros', resultado: '6 mm acumulados', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-07-16', entregable: 'Zapatas y vigas de amarre de la etapa 1', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '34,3 MPa', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-07-24', entregable: 'Muro de fachada del eje 1, piso 2, bloque A', metrica: 'MC-03 Plomo de muros', resultado: '9 mm', conforme: 'No', causa: 'Formaleta mal aplomada', accion: 'Reaplome antes del vaciado del piso 3; verificación con nivel láser.' },
        { fecha: '2026-07-24', entregable: 'Muro de fachada del eje 7, piso 2, bloque A', metrica: 'MC-03 Plomo de muros', resultado: '8 mm', conforme: 'No', causa: 'Formaleta mal aplomada', accion: 'Reaplome y capacitación del proveedor de formaleta.' },
        { fecha: '2026-08-05', entregable: 'Losa de la plataforma, sector 2', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '34,1 MPa', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-08-12', entregable: 'Muros y losa del piso 3 del bloque A', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '25,1 MPa', conforme: 'No', causa: 'Curado deficiente de cilindros en obra', accion: 'Extracción de núcleos (INC-005) y cuarto de curado en el campamento.' },
        { fecha: '2026-08-20', entregable: 'Muros de fachada del piso 4 del bloque A', metrica: 'MC-03 Plomo de muros', resultado: '4 mm', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-08-28', entregable: 'Muro del eje C, piso 4, bloque A', metrica: 'MC-04 Recubrimiento', resultado: '12 mm', conforme: 'No', causa: 'Panelas de separación faltantes', accion: 'Panelas instaladas cada 60 cm antes de cerrar la formaleta.' },
        { fecha: '2026-08-28', entregable: 'Muro del eje E, piso 4, bloque A', metrica: 'MC-04 Recubrimiento', resultado: '15 mm', conforme: 'No', causa: 'Panelas de separación faltantes', accion: 'Panelas instaladas; reinspección del 100 % de los paños.' },
        { fecha: '2026-08-29', entregable: 'Muros de los ejes C y E, piso 4, bloque A (reinspección)', metrica: 'MC-04 Recubrimiento', resultado: '25 mm', conforme: 'Sí', causa: '', accion: 'Piso liberado por la supervisión técnica.' },
        { fecha: '2026-09-04', entregable: 'Muros del piso 3 del bloque A (núcleos)', metrica: 'Resistencia de núcleos (NSR-10 C.5.6.5)', resultado: '29,4 MPa en promedio de 3 núcleos', conforme: 'Sí', causa: '', accion: 'Concreto aceptado por el diseñador estructural; INC-005 resuelto.' },
        { fecha: '2026-09-12', entregable: 'Muros y losa del piso 5 del bloque A', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '33,7 MPa', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-09-25', entregable: 'Red de agua del piso 1 del bloque A', metrica: 'MC-07 Prueba hidrostática', resultado: 'Caída de 20 psi en 2 horas', conforme: 'No', causa: 'Unión mal soldada', accion: 'Unión rehecha por el instalador.' },
        { fecha: '2026-09-29', entregable: 'Red de agua del piso 1 del bloque A (repetición)', metrica: 'MC-07 Prueba hidrostática', resultado: '150 psi durante 2 horas sin caída', conforme: 'Sí', causa: '', accion: 'Tramo liberado.' },
        { fecha: '2026-09-28', entregable: 'Talud oriental', metrica: 'MC-06 Inclinómetros', resultado: '7 mm acumulados', conforme: 'Sí', causa: '', accion: '' },
        { fecha: '2026-09-29', entregable: 'Muros y losa del piso 2 del bloque B', metrica: 'MC-01 Resistencia del concreto a 28 días', resultado: '33,6 MPa', conforme: 'Sí', causa: '', accion: '' },
      ]),
      conclusiones: 'Del 2 de junio al 29 de septiembre de 2026 se hicieron 25 ensayos de resistencia a 28 días con una media de 33,0 MPa (σ = 1,76 MPa), todos sobre f\'c − 3,5 MPa; solo el del 12 de agosto (25,1 MPa) quedó fuera de los límites de control, explicado por el curado de los cilindros al sol y descartado con núcleos de 29,4 MPa. Se registraron 9 no conformidades con 5 causas: vibrado insuficiente (3), formaleta mal aplomada (2), panelas de separación faltantes (2), curado deficiente de cilindros (1) y unión mal soldada (1). Las acciones (vibradores adicionales, nivel láser, panelas cada 60 cm, cuarto de curado y prueba por tramo) fueron eficaces: no hay no conformidades abiertas al corte. Ver el Pareto «No conformidades en las mediciones de control de calidad» y el gráfico de control en la vista Ishikawa y Pareto.',
    },
  };

  /* ================================================================== 9. RECURSOS */

  /* ------------------------------------------------------------ 9.1 Plan de gestión de los recursos */
  const planGestionRecursos = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: {
      identificacion: 'Equipo de dirección del promotor: gerente de proyecto (100 %), estructurador financiero (50 %), gerente comercial (100 %), abogado del proyecto (25 %) y contador del proyecto (50 %). Consultores de estudios y diseños contratados a precio fijo. Fuerza de ventas de la comercializadora (seis asesores en los lanzamientos y cuatro en preventas). Construcción por administración delegada: director de obra, dos residentes (edificación y urbanismo), coordinador SST, inspector de calidad y almacenista del constructor, con cuadrillas propias y subcontratistas por especialidad. Recursos físicos clave: dos juegos de formaleta industrializada, dos grúas torre, equipo de perforación de pilas, un frente de movimiento de tierras y hasta tres frentes de urbanismo. Las cantidades por actividad están en los requisitos de recursos y en la vista de recursos del cronograma.',
      adquisicion: 'El equipo del promotor se asigna desde la estructura de la Promotora Modelo Occidente S.A.S. (ficticia). Los diseñadores y consultores se contratan por invitación a tres oferentes. El constructor se selecciona por calidad y costo antes del punto de equilibrio de la etapa 1 y contrata su personal y sus subcontratistas (con aprobación del gerente de proyecto los subcontratos de más de COP 500 millones). Los equipos mayores (formaleta, grúas torre, andamios y equipos de perforación) se alquilan; el concreto y el acero se negocian por volumen para las dos etapas.',
      roles: rows('pgr-rol', [
        { rol: R.ger, autoridad: 'Dirige el proyecto; aprueba cambios sin efecto en hitos ni en la utilidad hasta COP 300 millones con cargo a la reserva para contingencias; aprueba los subcontratos del constructor.', responsabilidad: 'Plan para la dirección, líneas base, informes a la junta, control integrado de cambios y relación con la fiduciaria, el banco y las autoridades.', competencias: 'Ingeniero civil o arquitecto con especialización en gerencia de proyectos y diez años en desarrollo inmobiliario; certificación PMP deseable.' },
        { rol: R.est, autoridad: 'Visto bueno financiero de pagos, contratos y desembolsos; propone las condiciones del crédito y de la fiducia.', responsabilidad: 'Factibilidad, flujo de caja, fiducia, crédito constructor, tributos y contabilidad del fideicomiso.', competencias: 'Profesional en finanzas o economía con experiencia en fiducia inmobiliaria y crédito constructor.' },
        { rol: R.com, autoridad: 'Fija los precios de lista dentro de la política aprobada y concede descuentos hasta el 2 %.', responsabilidad: 'Mercadeo, sala de ventas, preventas, punto de equilibrio, escrituración y servicio al cliente.', competencias: 'Mercadeo inmobiliario, conocimiento de subsidios y crédito hipotecario y manejo del SARLAFT con la fiduciaria.' },
        { rol: R.arq, autoridad: 'Aprueba especificaciones y cambios de diseño sin efecto en el costo.', responsabilidad: 'Diseño arquitectónico, coordinación técnica de los diseños y trámite de la licencia y los permisos.', competencias: 'Arquitecto con experiencia en licencias en Medellín y en vivienda VIS.' },
        { rol: R.ies, autoridad: 'Aprueba desviaciones del diseño estructural.', responsabilidad: 'Estudio geotécnico, diseño estructural NSR-10, atención de la revisión independiente y de las consultas de obra.', competencias: 'Ingeniero civil con posgrado en estructuras y la experiencia exigida por la Ley 400 de 1997.' },
        { rol: R.con, autoridad: 'Detiene trabajos inseguros o no conformes; contrata personal y subcontratistas aprobados.', responsabilidad: 'Programa y presupuesto de obra, compras, calidad, SST, gestión ambiental y entregas.', competencias: 'Ingeniero civil con diez años en edificación con sistema industrializado.' },
        { rol: R.res, autoridad: 'Ordena los trabajos diarios a cuadrillas y subcontratistas.', responsabilidad: 'Control de frentes, cantidades de obra, actas de avance y bitácora.', competencias: 'Ingeniero civil con tres años de experiencia en obra.' },
        { rol: R.sst, autoridad: 'Suspende cualquier trabajo con riesgo inminente.', responsabilidad: 'SG-SST de la obra (Decreto 1072 de 2015 y Resolución 0312 de 2019), permisos de trabajo en alturas y en excavaciones, inducciones y reportes a la ARL.', competencias: 'Profesional en SST con licencia vigente y curso de coordinador de trabajo en alturas (Resolución 4272 de 2021).' },
        { rol: R.sti, autoridad: 'Libera o rechaza cada piso; expide el certificado técnico de ocupación.', responsabilidad: 'Supervisión técnica de la construcción (NSR-10, Título I, y Ley 1796 de 2016).', competencias: 'Ingeniero civil con la experiencia exigida por la Ley 400 de 1997, modificada por la Ley 1796 de 2016, independiente del constructor y del diseñador.' },
        { rol: 'Asesores comerciales', autoridad: 'Separan unidades con la lista de precios vigente.', responsabilidad: 'Atención en la sala de ventas, vinculación de compradores al encargo fiduciario y seguimiento de las cuotas iniciales.', competencias: 'Experiencia en venta de vivienda nueva; conocimiento de subsidios y crédito hipotecario.' },
      ]),
      organigrama: 'Junta directiva del promotor (patrocinador) → gerente de proyecto. Del gerente dependen el estructurador financiero (con el contador y el abogado del proyecto), el gerente comercial (con la comercializadora y la agencia de publicidad), el arquitecto diseñador (coordinador de los consultores de diseño) y el director de obra del constructor (residentes, coordinador SST, inspector de calidad, almacenista, cuadrillas y subcontratistas). Fuera de la línea jerárquica, con reporte a la junta, al banco o a la fiduciaria: supervisión técnica independiente, interventoría del banco y la fiduciaria y revisor fiscal.',
      gestionEquipo: 'Comité de gerencia mensual (primer martes), comité de obra semanal (lunes) y reunión comercial semanal. Los objetivos individuales se ligan a los hitos de la línea base: licencia ejecutoriada, punto de equilibrio e inicio de obra de cada etapa y certificado técnico de ocupación. Los conflictos se resuelven en el nivel más bajo posible y se escalan según el plan de comunicaciones.',
      capacitacion: 'Inducción al proyecto para todo el equipo (alcance, líneas base y control de cambios). Asesores comerciales: producto, subsidios, crédito hipotecario, SARLAFT y Ley 1480 de 2011. Obra: inducción SST y ambiental para todo trabajador, certificación de trabajo en alturas (Resolución 4272 de 2021), operación del sistema de formaleta industrializada con el proveedor y manejo de residuos de construcción y demolición (Resolución 1257 de 2021).',
      desarrolloEquipo: 'Reunión de arranque con el equipo y los consultores; taller de lecciones aprendidas al cerrar cada fase; actividades de integración trimestrales; evaluación mensual del desempeño de las cuadrillas y subcontratistas en obra.',
      reconocimiento: 'Bonificación del equipo del promotor por hitos cumplidos a tiempo: licencia ejecutoriada, punto de equilibrio de cada etapa y certificado técnico de ocupación. Comisión por ventas para los asesores según su contrato con la comercializadora. En obra, reconocimiento mensual a la cuadrilla con mejor desempeño en calidad y SST.',
      controlRecursos: 'El almacenista controla entradas y salidas con orden de compra y remisión; inventario mensual de materiales y de equipos alquilados (formaleta, grúas y andamios) conciliado con cada proveedor. Las grúas torre y la formaleta se programan por bloque para evitar la sobreasignación; todo traslado entre etapas se aprueba en el comité de obra. El consumo de concreto y acero se compara cada mes con las cantidades del presupuesto (desperdicio máximo del 3 % en concreto y del 4 % en acero).',
      seguridad: 'SG-SST del constructor conforme al Decreto 1072 de 2015 y a la Resolución 0312 de 2019, con programa de trabajo en alturas y plan de rescate (Resolución 4272 de 2021), permisos de trabajo para excavaciones y trabajos en caliente, plan de manejo de tránsito para volquetas, plan de manejo ambiental y de residuos (Resolución 1257 de 2021) y reporte mensual de accidentalidad a la gerencia. Meta: cero accidentes graves e índice de frecuencia menor que el promedio de la ARL para edificaciones.',
      requisitosIngreso: [
        'Afiliación vigente a EPS, fondo de pensiones y ARL (planilla PILA del mes).',
        'Examen médico ocupacional de ingreso con aptitud para el cargo, y para trabajo en alturas cuando aplique.',
        'Inducción SST y ambiental de la obra.',
        'Certificado de trabajo en alturas vigente para quien trabaje a 2 m o más (Resolución 4272 de 2021).',
        'Elementos de protección personal entregados y registrados.',
        'Subcontratistas: verificación en listas restrictivas (SAGRILAFT) y SG-SST evaluado.',
      ],
    },
  };

  /* ------------------------------------------------------------ 9.1 Acta de constitución del equipo */
  const firmantes = rows('ace-f', [
    { rol: R.ger, organizacion: EMP.pro, fecha: '2025-01-24' },
    { rol: R.est, organizacion: EMP.pro, fecha: '2025-01-24' },
    { rol: R.com, organizacion: EMP.pro, fecha: '2025-01-24' },
    { rol: R.abo, organizacion: EMP.pro, fecha: '2025-01-24' },
    { rol: R.arq, organizacion: EMP.arq, fecha: '2025-03-03' },
    { rol: R.ies, organizacion: EMP.est, fecha: '2025-05-12' },
    { rol: 'Coordinador de la sala de ventas', organizacion: EMP.com, fecha: '2025-05-19' },
    { rol: R.con, organizacion: EMP.con, fecha: '2026-03-16' },
    { rol: 'Residentes de obra (edificación y urbanismo)', organizacion: EMP.con, fecha: '2026-03-16' },
    { rol: R.sst, organizacion: EMP.con, fecha: '2026-03-16' },
    { rol: R.sti, organizacion: EMP.sup, fecha: '2026-03-16' },
  ]);
  const aceFields = {
    valores: [
      'Seguridad primero: ningún hito justifica un riesgo para las personas.',
      'Cumplimiento de la norma: NSR-10, licencia y reglamentos técnicos sin atajos.',
      'Transparencia con los compradores, la fiduciaria y el banco: una sola versión de la información de avance y de recursos.',
      'Responsabilidad con el dinero de los compradores y del banco.',
      'Respeto por la comunidad vecina y por el entorno de la quebrada.',
      'Colaboración: los problemas se traen con una propuesta de solución.',
    ],
    pautasComunicacion: 'Un solo canal formal por tema: correo para decisiones y solicitudes, bitácora de obra para órdenes técnicas y oficio radicado para entidades y fiduciaria; el grupo de mensajería solo sirve para coordinar el día. Respuesta a correos en 24 horas hábiles. Toda información a compradores la emite la gerencia comercial, y toda información a entidades, el gerente de proyecto o el arquitecto diseñador.',
    tomaDecisiones: 'Se decide en el nivel que tiene la autoridad según el plan de recursos: el director de obra en lo técnico dentro del presupuesto; el gerente de proyecto en cambios hasta COP 300 millones sin efecto en hitos ni en la utilidad; la junta directiva en lo demás. Las decisiones se apoyan en datos (valor ganado, flujo de caja y ensayos) y quedan en acta con responsable y fecha.',
    resolucionConflictos: '1) Conversación directa entre las partes en 48 horas; 2) mediación del gerente de proyecto; 3) comité de gerencia; 4) en asuntos contractuales, el mecanismo del contrato: arreglo directo y luego conciliación en el Centro de Arbitraje y Conciliación de la Cámara de Comercio de Medellín para Antioquia.',
    pautasReuniones: 'Agenda enviada con 24 horas de anticipación; inicio puntual; duración máxima de 90 minutos en los comités y 45 minutos en el comité de obra; acta con decisiones y compromisos enviada en 48 horas; revisión de compromisos al inicio de cada reunión.',
    acuerdos: [
      'Los cambios se tramitan con solicitud de cambio; nadie ordena trabajo adicional verbalmente.',
      'Los riesgos y los incidentes se reportan apenas se conocen, sin esperar al comité.',
      'El cronograma y el presupuesto vigentes están en la herramienta del proyecto y son la única versión válida.',
      'Los compromisos vencidos se explican en el comité siguiente con una nueva fecha.',
      'En obra se respeta el horario acordado con la comunidad: lunes a viernes de 7:00 a. m. a 5:00 p. m. y sábados de 7:00 a. m. a 1:00 p. m.',
    ],
    vigencia: 'Vigente hasta el cierre del proyecto; se revisa al iniciar cada etapa de obra y cuando ingresa un integrante clave.',
    firmantes,
  };
  const actaConstitucionEquipo = {
    status: 'aprobado', rev: '1', date: '2026-03-16',
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: aceFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: '2025-01-24', note: 'Acta del equipo del promotor suscrita en la reunión de arranque.',
        fields: revFields(aceFields, {
          firmantes: patchRows(firmantes, null, ['ace-f-05', 'ace-f-06', 'ace-f-07', 'ace-f-08', 'ace-f-09', 'ace-f-10', 'ace-f-11']),
          acuerdos: aceFields.acuerdos.slice(0, 4),
          vigencia: 'Vigente hasta el cierre del proyecto; se revisa al iniciar la obra de cada etapa y cuando ingresa un integrante clave.',
        }),
      },
      { rev: '1', status: 'aprobado', date: '2026-03-16', note: 'Adhesión del constructor, de los residentes, del coordinador SST y de la supervisión técnica independiente con el acta de inicio de obra de la etapa 1; acuerdo de horario de obra.' },
    ],
  };

  /* ------------------------------------------------------------ 9.2 Requisitos de recursos (fechas de la LB1; en la LB0 la obra de la etapa 1 iba cuatro semanas antes) */
  const reqRows = rows('rrec', [
    { paqueteEdt: '1.1.2', actividad: 'Gerencia, seguimiento y control del proyecto', categoria: 'Personal', recurso: 'Gerente de proyecto', cantidad: 1, unidad: 'persona', desde: '2025-01-13', hasta: '2029-03-27', especificacion: 'Ingeniero civil o arquitecto con especialización en gerencia de proyectos; dedicación completa.' },
    { paqueteEdt: '1.4.3 y 1.4.4', actividad: 'Preventas de las etapas 1 y 2', categoria: 'Personal', recurso: 'Asesores comerciales', cantidad: 4, unidad: 'personas', desde: '2025-07-08', hasta: '2027-01-28', especificacion: 'Seis en los lanzamientos y cuatro en preventas; conocimiento de subsidios, crédito hipotecario y SARLAFT.' },
    { paqueteEdt: '1.5.1.1', actividad: 'Movimiento de tierras, contención y estabilización de taludes de la etapa 1', categoria: 'Equipos', recurso: 'Frente de movimiento de tierras', cantidad: 1, unidad: 'frente', desde: '2026-03-30', hasta: '2026-06-26', especificacion: 'Dos excavadoras de 20 t, un bulldozer, seis volquetas de 14 m³ y un vibrocompactador, con operadores certificados.' },
    { paqueteEdt: '1.5.1.1', actividad: 'Pilas pre-excavadas de la etapa 1', categoria: 'Equipos', recurso: 'Equipo de perforación de pilas', cantidad: 1, unidad: 'equipo', desde: '2026-05-04', hasta: '2026-07-03', especificacion: 'Piloteadora rotativa para pilas de 0,8 a 1,2 m de diámetro, con camisa recuperable.' },
    { paqueteEdt: '1.5.1.1', actividad: 'Zapatas, dados y vigas de amarre de la etapa 1', categoria: 'Personal', recurso: 'Cuadrilla de cimentación', cantidad: 1, unidad: 'cuadrilla', desde: '2026-06-01', hasta: '2026-08-06', especificacion: 'Un oficial y cuatro ayudantes, con figuradores de acero.' },
    { paqueteEdt: '1.5.1.2', actividad: 'Estructura de la plataforma y de los bloques A y B', categoria: 'Personal', recurso: 'Cuadrilla de estructura', cantidad: 2, unidad: 'cuadrillas', desde: '2026-06-16', hasta: '2026-11-13', especificacion: 'Cuadrilla de unas 18 personas por bloque para formaleta, refuerzo y vaciado de un piso cada 8,5 días hábiles.' },
    { paqueteEdt: '1.5.1.2', actividad: 'Estructura de los bloques A y B', categoria: 'Equipos', recurso: 'Juego de formaleta industrializada', cantidad: 2, unidad: 'juegos', desde: '2026-07-14', hasta: '2026-11-13', especificacion: 'Formaleta de aluminio para muros y losa de un piso completo de un bloque (13 apartamentos), en alquiler.' },
    { paqueteEdt: '1.5.1.2', actividad: 'Estructura de los bloques A y B', categoria: 'Equipos', recurso: 'Grúa torre', cantidad: 2, unidad: 'grúas', desde: '2026-07-14', hasta: '2026-11-13', especificacion: 'Pluma de 50 m y 1,5 t en punta, con operador certificado y señalero.' },
    { paqueteEdt: '1.5.1.2', actividad: 'Estructura de la plataforma y de los bloques A y B', categoria: 'Materiales', recurso: 'Concreto premezclado', cantidad: 7500, unidad: 'm³', desde: '2026-05-04', hasta: '2026-11-13', especificacion: 'f\'c de 21 a 28 MPa; concreto fluido para muros con asentamiento de 180 ± 25 mm, bombeable (NTC 3318).' },
    { paqueteEdt: '1.5.1.2', actividad: 'Estructura de la plataforma y de los bloques A y B', categoria: 'Materiales', recurso: 'Acero de refuerzo', cantidad: 605000, unidad: 'kg', desde: '2026-05-04', hasta: '2026-11-13', especificacion: 'Barras corrugadas de 420 MPa (NTC 2289) y malla electrosoldada, figuradas en planta.' },
    { paqueteEdt: '1.5.1.3', actividad: 'Mampostería de los bloques A y B', categoria: 'Personal', recurso: 'Cuadrilla de mampostería', cantidad: 2, unidad: 'cuadrillas', desde: '2026-09-07', hasta: '2027-01-21', especificacion: 'Oficiales de mampostería en bloque de arcilla, con ayudantes.' },
    { paqueteEdt: '1.5.1.3', actividad: 'Instalaciones hidrosanitarias, de gas, eléctricas y de telecomunicaciones de la etapa 1', categoria: 'Personal', recurso: 'Cuadrilla de instalaciones', cantidad: 4, unidad: 'cuadrillas', desde: '2026-09-21', hasta: '2027-03-24', especificacion: 'Técnicos electricistas con matrícula del CONTE e instaladores de gas certificados.' },
    { paqueteEdt: '1.5.1.4', actividad: 'Fachadas, ventanería y barandas de la etapa 1', categoria: 'Personal', recurso: 'Cuadrilla de fachada y ventanería', cantidad: 2, unidad: 'cuadrillas', desde: '2026-12-15', hasta: '2027-05-14', especificacion: 'Trabajo en alturas certificado; montaje desde andamio multidireccional.' },
    { paqueteEdt: '1.5.1.5', actividad: 'Acabados de la etapa 1', categoria: 'Personal', recurso: 'Cuadrilla de acabados', cantidad: 4, unidad: 'cuadrillas', desde: '2026-11-17', hasta: '2027-07-09', especificacion: 'Pañetes, estucos, pintura, enchapes y carpintería según el apartamento modelo.' },
    { paqueteEdt: '1.5.3', actividad: 'Vía colectora, redes externas y retiro de la quebrada (fase 1)', categoria: 'Equipos', recurso: 'Frente de urbanismo', cantidad: 2, unidad: 'frentes', desde: '2026-05-04', hasta: '2027-03-24', especificacion: 'Retroexcavadora, vibrocompactador, cuadrilla de redes y de pavimentos.' },
    { paqueteEdt: '1.5.4', actividad: 'Administración de obra de la etapa 1', categoria: 'Personal', recurso: 'Director de obra', cantidad: 1, unidad: 'persona', desde: '2026-03-17', hasta: '2027-07-23', especificacion: 'Ingeniero civil con diez años en edificación industrializada.' },
    { paqueteEdt: '1.5.4', actividad: 'Administración de obra de la etapa 1', categoria: 'Personal', recurso: 'Residente de obra', cantidad: 2, unidad: 'personas', desde: '2026-03-17', hasta: '2027-07-23', especificacion: 'Uno para la edificación y otro para el urbanismo.' },
    { paqueteEdt: '1.5.4', actividad: 'SST de la etapa 1', categoria: 'Personal', recurso: 'Coordinador SST', cantidad: 1, unidad: 'persona', desde: '2026-03-17', hasta: '2027-07-23', especificacion: 'Licencia en SST y curso de coordinador de trabajo en alturas.' },
    { paqueteEdt: '1.5.4', actividad: 'Supervisión técnica independiente de la etapa 1', categoria: 'Servicios', recurso: 'Supervisor técnico independiente', cantidad: 1, unidad: 'servicio', desde: '2026-03-17', hasta: '2027-07-28', especificacion: 'Visitas semanales y liberación por piso (Ley 1796 de 2016).' },
    { paqueteEdt: '1.5.2.2', actividad: 'Estructura de la plataforma y de los bloques C y D', categoria: 'Personal', recurso: 'Cuadrilla de estructura', cantidad: 2, unidad: 'cuadrillas', desde: '2027-05-03', hasta: '2027-10-29', especificacion: 'Las mismas cuadrillas y juegos de formaleta de la etapa 1, trasladados al terminar el bloque B.' },
  ]);
  const ETAPA1 = (r) => /^1\.5\.(1|3|4)/.test(r.paqueteEdt) && r.desde >= '2026-01-01';
  const rrecFields = {
    requisitos: reqRows,
    baseEstimacion: 'Rendimientos del constructor para el sistema industrializado (un piso de 13 apartamentos cada 8,5 días hábiles por bloque, con una cuadrilla y un juego de formaleta), cantidades de obra del presupuesto de la etapa 1 (unos 7.500 m³ de concreto y 605 t de acero), referencias de Construdata y experiencia de la constructora en proyectos similares del Valle de Aburrá. Los límites de recursos por tipo se registran en el cronograma (vista de recursos) para verificar la sobreasignación.',
    supuestos: [
      'Calendario de lunes a sábado con festivos de Colombia.',
      'Disponibilidad de mano de obra calificada en el Valle de Aburrá similar a la de 2025.',
      'Los equipos mayores se alquilan con mantenimiento incluido.',
      'Una grúa torre y un juego de formaleta por bloque; las etapas no se traslapan en la estructura.',
    ],
  };
  const requisitosRecursos = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.con, reviso: R.ger, aprobo: R.ger },
    fields: rrecFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Requisitos de la factibilidad (LB0): obra de la etapa 1 programada desde el 17 de febrero de 2026.',
        fields: revFields(rrecFields, {
          /* fechas de la red LB0 (la etapa 1 empezaba 4 semanas antes; los festivos hacen que algunos fines no se desplacen exactamente 28 días) */
          requisitos: reqRows.map((r) => {
            if (!ETAPA1(r)) return { ...r };
            const lb0 = { 'Zapatas, dados y vigas de amarre de la etapa 1': { hasta: '2026-07-10' }, 'Instalaciones hidrosanitarias, de gas, eléctricas y de telecomunicaciones de la etapa 1': { hasta: '2027-02-26' } }[r.actividad] || {};
            return { ...r, desde: lb0.desde || shift(r.desde, -28), hasta: lb0.hasta || shift(r.hasta, -28) };
          }),
          baseEstimacion: 'Rendimientos de referencia para el sistema industrializado (un piso de 13 apartamentos cada 8,5 días hábiles por bloque, con una cuadrilla y un juego de formaleta), cantidades de la factibilidad, referencias de Construdata y experiencia de constructoras del Valle de Aburrá. Se ajustarán con el programa del constructor antes del acta de inicio.',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'LB1 (CC-002): obra de la etapa 1 desde el 16 de marzo de 2026 con el programa y las cantidades del constructor.' },
    ],
  };

  /* ------------------------------------------------------------ 9.2 Estructura de desglose de recursos (tarifas de marzo de 2025) */
  const estructuraDesgloseRecursos = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.est, reviso: R.ger, aprobo: R.ger },
    fields: {
      recursos: rows('edr', [
        { codigo: '1', categoria: 'Personal', recurso: 'Personal', descripcion: 'Equipo de dirección del promotor, fuerza de ventas, personal de obra y servicios profesionales por dedicación.', unidad: '', fuente: 'Interno' },
        { codigo: '1.1', categoria: 'Personal', recurso: 'Gerente de proyecto', descripcion: 'Dedicación completa; incluye prestaciones sociales.', unidad: 'mes', costoUnitario: 32000000, fuente: 'Interno' },
        { codigo: '1.2', categoria: 'Personal', recurso: 'Estructurador financiero', descripcion: 'Dedicación del 50 %.', unidad: 'mes', costoUnitario: 9000000, fuente: 'Interno' },
        { codigo: '1.3', categoria: 'Personal', recurso: 'Gerente comercial', descripcion: 'Dedicación completa; incluye prestaciones sociales.', unidad: 'mes', costoUnitario: 18000000, fuente: 'Interno' },
        { codigo: '1.4', categoria: 'Personal', recurso: 'Director de obra', descripcion: 'Personal del constructor, reembolsable dentro de la administración de obra.', unidad: 'mes', costoUnitario: 22000000, fuente: 'Contratado' },
        { codigo: '1.5', categoria: 'Personal', recurso: 'Residente de obra', descripcion: 'Uno para la edificación y otro para el urbanismo.', unidad: 'mes', costoUnitario: 9500000, fuente: 'Contratado' },
        { codigo: '1.6', categoria: 'Personal', recurso: 'Coordinador SST', descripcion: 'Licencia en SST y coordinador de trabajo en alturas.', unidad: 'mes', costoUnitario: 7000000, fuente: 'Contratado' },
        { codigo: '1.7', categoria: 'Personal', recurso: 'Oficial de construcción', descripcion: 'Jornal con prestaciones y aportes (salario mínimo de 2025).', unidad: 'jornal', costoUnitario: 190000, fuente: 'Contratado' },
        { codigo: '1.8', categoria: 'Personal', recurso: 'Ayudante de construcción', descripcion: 'Jornal con prestaciones y aportes (salario mínimo de 2025).', unidad: 'jornal', costoUnitario: 110000, fuente: 'Contratado' },
        { codigo: '2', categoria: 'Equipos', recurso: 'Equipos', descripcion: 'Formaleta, izaje, movimiento de tierras, perforación y acceso a fachadas.', unidad: '', fuente: 'Contratado' },
        { codigo: '2.1', categoria: 'Equipos', recurso: 'Juego de formaleta industrializada de aluminio', descripcion: 'Muros y losa de un piso de un bloque; incluye asesoría técnica del proveedor.', unidad: 'mes', costoUnitario: 75000000, fuente: 'Contratado' },
        { codigo: '2.2', categoria: 'Equipos', recurso: 'Grúa torre', descripcion: 'Pluma de 50 m y 1,5 t en punta; incluye operador y montaje y desmontaje prorrateados.', unidad: 'mes', costoUnitario: 38000000, fuente: 'Contratado' },
        { codigo: '2.3', categoria: 'Equipos', recurso: 'Excavadora de 20 t', descripcion: 'Con operador y combustible.', unidad: 'hora', costoUnitario: 230000, fuente: 'Contratado' },
        { codigo: '2.4', categoria: 'Equipos', recurso: 'Piloteadora rotativa', descripcion: 'Perforación de pilas de 0,8 a 1,2 m de diámetro, con camisa recuperable.', unidad: 'm perforado', costoUnitario: 380000, fuente: 'Contratado' },
        { codigo: '2.5', categoria: 'Equipos', recurso: 'Andamio multidireccional para fachadas', descripcion: 'Montado y certificado por persona competente (Resolución 4272 de 2021).', unidad: 'm²-mes', costoUnitario: 9500, fuente: 'Contratado' },
        { codigo: '3', categoria: 'Materiales', recurso: 'Materiales', descripcion: 'Insumos principales de la estructura, la mampostería y la fachada.', unidad: '', fuente: 'Contratado' },
        { codigo: '3.1', categoria: 'Materiales', recurso: 'Concreto premezclado de 28 MPa fluido', descripcion: 'Para muros y losas, con bombeo (NTC 3318).', unidad: 'm³', costoUnitario: 485000, fuente: 'Contratado' },
        { codigo: '3.2', categoria: 'Materiales', recurso: 'Acero de refuerzo de 420 MPa', descripcion: 'Barras corrugadas (NTC 2289) figuradas en planta.', unidad: 'kg', costoUnitario: 4100, fuente: 'Contratado' },
        { codigo: '3.3', categoria: 'Materiales', recurso: 'Bloque de arcilla para mampostería', descripcion: 'Bloque número 5 para muros divisorios.', unidad: 'unidad', costoUnitario: 1900, fuente: 'Contratado' },
        { codigo: '3.4', categoria: 'Materiales', recurso: 'Ventanería en aluminio', descripcion: 'Perfilería con vidrio de 4 mm, instalada.', unidad: 'm²', costoUnitario: 290000, fuente: 'Contratado' },
        { codigo: '4', categoria: 'Transporte', recurso: 'Transporte', descripcion: 'Retiro de sobrantes y traslado de equipos.', unidad: '', fuente: 'Contratado' },
        { codigo: '4.1', categoria: 'Transporte', recurso: 'Retiro de sobrantes de excavación', descripcion: 'A sitio de disposición autorizado (Resolución 1257 de 2021).', unidad: 'm³', costoUnitario: 38000, fuente: 'Contratado' },
        { codigo: '4.2', categoria: 'Transporte', recurso: 'Traslado de formaleta y equipos entre etapas', descripcion: 'Tractomula con cargue y descargue.', unidad: 'viaje', costoUnitario: 1800000, fuente: 'Contratado' },
        { codigo: '5', categoria: 'Servicios', recurso: 'Servicios', descripcion: 'Servicios técnicos, de control y de apoyo.', unidad: '', fuente: 'Contratado' },
        { codigo: '5.1', categoria: 'Servicios', recurso: 'Ensayo de cilindros de concreto', descripcion: 'Laboratorio acreditado ante el ONAC.', unidad: 'ensayo', costoUnitario: 45000, fuente: 'Contratado' },
        { codigo: '5.2', categoria: 'Servicios', recurso: 'Ensayo de integridad de pilas (PIT)', descripcion: 'Por pila ensayada.', unidad: 'pila', costoUnitario: 180000, fuente: 'Contratado' },
        { codigo: '5.3', categoria: 'Servicios', recurso: 'Supervisión técnica independiente', descripcion: 'Precio fijo mensual durante la construcción (Ley 1796 de 2016).', unidad: 'mes', costoUnitario: 17000000, fuente: 'Contratado' },
        { codigo: '5.4', categoria: 'Servicios', recurso: 'Vigilancia de obra', descripcion: 'Dos puestos de 24 horas.', unidad: 'mes', costoUnitario: 14000000, fuente: 'Contratado' },
        { codigo: '5.5', categoria: 'Servicios', recurso: 'Topografía de obra', descripcion: 'Comisión con estación total.', unidad: 'mes', costoUnitario: 9000000, fuente: 'Contratado' },
      ]),
    },
  };

  /* ------------------------------------------------------------ 9.3 Asignaciones de recursos (al 30 de septiembre de 2026) */
  const asignacionesRecursos = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.con, reviso: R.ger },
    fields: {
      equipo: rows('asig-e', [
        { rol: R.ger, asignado: 'Titular del cargo (ingeniero civil)', organizacion: EMP.pro, dedicacion: 100, desde: '2025-01-13', hasta: '2029-06-28', paqueteEdt: '1.1', certificaciones: 'Especialización en gerencia de proyectos; PMP' },
        { rol: R.est, asignado: 'Titular del cargo (economista)', organizacion: EMP.pro, dedicacion: 50, desde: '2025-01-13', hasta: '2029-06-28', paqueteEdt: '1.1.3 y 1.2.4', certificaciones: 'Especialización en finanzas' },
        { rol: R.com, asignado: 'Titular del cargo', organizacion: EMP.pro, dedicacion: 100, desde: '2025-01-13', hasta: '2029-03-15', paqueteEdt: '1.4', certificaciones: 'Capacitación SARLAFT vigente' },
        { rol: 'Asesores comerciales', asignado: 'Cuatro asesores de la sala de ventas', organizacion: EMP.com, dedicacion: 100, desde: '2025-07-07', hasta: '2028-09-29', paqueteEdt: '1.4.3 a 1.4.5', certificaciones: 'Capacitación SARLAFT y Ley 1480 de 2011' },
        { rol: R.abo, asignado: 'Titular del cargo', organizacion: EMP.pro, dedicacion: 25, desde: '2025-01-13', hasta: '2029-06-28', paqueteEdt: '1.2.1 y 1.6.2', certificaciones: 'Tarjeta profesional vigente' },
        { rol: R.ctd, asignado: 'Titular del cargo', organizacion: EMP.pro, dedicacion: 50, desde: '2025-01-13', hasta: '2029-06-28', paqueteEdt: '1.1.3', certificaciones: 'Tarjeta profesional vigente' },
        { rol: R.arq, asignado: 'Arquitecto coordinador de diseños de la etapa 2', organizacion: EMP.arq, dedicacion: 50, desde: '2026-06-01', hasta: '2027-01-29', paqueteEdt: '1.3.6', certificaciones: 'Matrícula profesional vigente' },
        { rol: R.con, asignado: 'Titular del cargo (ingeniero civil)', organizacion: EMP.con, dedicacion: 100, desde: '2026-03-16', hasta: '2028-10-12', paqueteEdt: '1.5', certificaciones: 'Matrícula profesional del COPNIA vigente' },
        { rol: 'Residente de obra (edificación)', asignado: 'Titular del cargo (ingeniero civil)', organizacion: EMP.con, dedicacion: 100, desde: '2026-03-16', hasta: '2027-08-13', paqueteEdt: '1.5.1', certificaciones: 'Matrícula profesional; trabajo en alturas' },
        { rol: 'Residente de obra (urbanismo)', asignado: 'Titular del cargo (ingeniero civil)', organizacion: EMP.con, dedicacion: 100, desde: '2026-05-04', hasta: '2027-04-24', paqueteEdt: '1.5.3', certificaciones: 'Matrícula profesional' },
        { rol: R.sst, asignado: 'Titular del cargo', organizacion: EMP.con, dedicacion: 100, desde: '2026-03-16', hasta: '2028-10-12', paqueteEdt: '1.5.4', certificaciones: 'Licencia en SST; coordinador de trabajo en alturas' },
        { rol: R.ins, asignado: 'Titular del cargo (tecnólogo en obras civiles)', organizacion: EMP.con, dedicacion: 100, desde: '2026-04-27', hasta: '2028-10-12', paqueteEdt: '1.5.1 y 1.5.2', certificaciones: 'Técnico en ensayos de concreto' },
        { rol: 'Almacenista', asignado: 'Titular del cargo', organizacion: EMP.con, dedicacion: 100, desde: '2026-03-16', hasta: '2028-10-12', paqueteEdt: '1.5.4', certificaciones: 'Manejo de inventarios' },
        { rol: R.sti, asignado: 'Ingeniero supervisor y un auxiliar', organizacion: EMP.sup, dedicacion: 40, desde: '2026-03-17', hasta: '2027-08-13', paqueteEdt: '1.5.4 (S02)', certificaciones: 'Matrícula profesional y experiencia exigida por la Ley 1796 de 2016' },
        { rol: 'Interventor del banco y la fiduciaria', asignado: 'Ingeniero interventor', organizacion: EMP.int, dedicacion: 10, desde: '2026-03-17', hasta: '2029-01-29', paqueteEdt: '1.5.4 (S03)', certificaciones: 'Matrícula profesional vigente' },
      ]),
      fisicos: rows('asig-f', [
        { recurso: 'Juego de formaleta industrializada de aluminio', cantidad: 2, unidad: 'juegos', ubicacion: 'Bloques A y B', desde: '2026-07-13', hasta: '2026-12-12', documento: 'Contrato de alquiler y remisiones de entrega', estado: 'En obra' },
        { recurso: 'Grúa torre (pluma de 50 m)', cantidad: 2, unidad: 'grúas', ubicacion: 'Bloques A y B', desde: '2026-07-06', hasta: '2027-01-15', documento: 'Acta de montaje y certificado de inspección', estado: 'En obra' },
        { recurso: 'Excavadoras de 20 t', cantidad: 2, unidad: 'equipos', ubicacion: 'Terrazas de la etapa 1', desde: '2026-03-30', hasta: '2026-07-17', documento: 'Remisión de retiro del 18 de julio', estado: 'Devuelto' },
        { recurso: 'Piloteadora rotativa', cantidad: 1, unidad: 'equipo', ubicacion: 'Plataforma y bloques A y B', desde: '2026-05-04', hasta: '2026-07-11', documento: 'Acta de retiro del subcontratista', estado: 'Devuelto' },
        { recurso: 'Vibradores de concreto', cantidad: 6, unidad: 'unidades', ubicacion: 'Estructura de la etapa 1', desde: '2026-06-16', hasta: '2026-12-12', documento: 'Inventario de almacén (dos adicionales desde el 1 de julio)', estado: 'En obra' },
        { recurso: 'Inclinómetros', cantidad: 4, unidad: 'unidades', ubicacion: 'Talud oriental y terrazas', desde: '2026-04-15', hasta: '2027-08-02', documento: 'Informe de instalación del geotecnista', estado: 'En obra' },
        { recurso: 'Cuarto de curado de cilindros', cantidad: 1, unidad: 'unidad', ubicacion: 'Campamento de obra', desde: '2026-08-18', hasta: '2027-08-06', documento: 'Acta de puesta en servicio', estado: 'En obra' },
        { recurso: 'Montacargas de obra', cantidad: 1, unidad: 'equipo', ubicacion: 'Bloque A', desde: '2026-09-07', hasta: '2027-05-28', documento: 'Certificado de inspección', estado: 'En obra' },
        { recurso: 'Andamio multidireccional para fachadas del bloque A', cantidad: 2400, unidad: 'm²', ubicacion: 'Fachadas del bloque A', desde: '2026-12-15', hasta: '2027-04-21', documento: 'Orden de alquiler en trámite', estado: 'Programado' },
        { recurso: 'Planta eléctrica de respaldo de 150 kVA', cantidad: 1, unidad: 'equipo', ubicacion: 'Campamento de obra', desde: '2026-03-17', hasta: '2027-08-06', documento: 'Contrato de alquiler', estado: 'En mantenimiento' },
      ]),
      calendario: 'Obra: lunes a viernes de 7:00 a. m. a 5:00 p. m. y sábados de 7:00 a. m. a 1:00 p. m., sin trabajo los domingos ni los festivos de Colombia, según lo acordado con la mesa vecinal. Desde el 14 de septiembre de 2026 hay un turno extendido de formaleta en el bloque B hasta las 8:00 p. m., sin maquinaria ruidosa después de las 7:00 p. m. (respuesta al INC-006). Sala de ventas: todos los días de 9:00 a. m. a 6:00 p. m. Equipo del promotor: lunes a viernes. Disponibilidad pendiente: andamio de fachadas del bloque A desde el 15 de diciembre de 2026.',
    },
  };

  /* ------------------------------------------------------------ 9.4 Evaluaciones de desempeño del equipo */
  const evaluacionDesempenoEquipo = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.con, reviso: R.ger },
    fields: {
      evaluaciones: rows('ede', [
        { fecha: '2026-06-30', equipo: 'Excavación (CT-019)', tecnica: 3, seguridad: 4, productividad: 2, colaboracion: 3, comunicacion: 3, fortalezas: 'Respuesta rápida en el deslizamiento del 7 de mayo; orden en el manejo de volquetas.', mejoras: 'Abrió la terraza oriental sin los drenajes provisionales completos; rendimiento bajo en lluvias.', accion: 'Excavación por terrazas con drenajes antes de abrir cada corte; programación semanal con el residente.' },
        { fecha: '2026-07-31', equipo: 'Pantalla anclada (CT-020)', tecnica: 5, seguridad: 4, productividad: 4, colaboracion: 4, comunicacion: 4, fortalezas: 'Terminó la pantalla y los drenajes en ocho semanas, dentro del valor del CC-003.', mejoras: 'Entrega tardía de los registros de tensionamiento de anclajes.', accion: 'Entregar los registros con cada fila de anclajes.' },
        { fecha: '2026-07-31', equipo: 'Pilas (CT-021)', tecnica: 4, seguridad: 4, productividad: 4, colaboracion: 4, comunicacion: 4, fortalezas: 'Todas las pilas ensayadas sin anomalías.', mejoras: 'Una semana de atraso por el deslizamiento y por cambios de cota de fundación.', accion: 'Reunión previa con el geotecnista en cada grupo de pilas de la etapa 2.' },
        { fecha: '2026-08-31', equipo: 'Cimentación (cuadrilla)', tecnica: 3, seguridad: 4, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Buena coordinación con el subcontratista de pilas.', mejoras: 'Hormigueros en las vigas de amarre de la plataforma por vibrado insuficiente.', accion: 'Dos vibradores adicionales y capacitación en vibrado.' },
        { fecha: '2026-08-31', equipo: 'Estructura A (CT-022)', tecnica: 3, seguridad: 4, productividad: 2, colaboracion: 4, comunicacion: 3, fortalezas: 'Calidad de vaciado aceptable y buen orden en la losa.', mejoras: 'Rendimiento de 11 días por piso frente a 8,5 planeados por la rotación de oficiales; plomo de muros del piso 2.', accion: 'Bonificación por rendimiento por piso, capacitación del proveedor de formaleta y turno extendido en el bloque B (INC-006).' },
        { fecha: '2026-08-31', equipo: 'Vía y redes (CT-025)', tecnica: 4, seguridad: 3, productividad: 3, colaboracion: 3, comunicacion: 3, fortalezas: 'Buen avance de la vía colectora en verano.', mejoras: 'Atraso en las redes de EPM y señalización vial incompleta en dos inspecciones.', accion: 'Refuerzo del plan de manejo de tránsito y mesa técnica quincenal con EPM.' },
        { fecha: '2026-09-30', equipo: 'Estructura A y B (CT-022)', tecnica: 3, seguridad: 4, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Rendimiento mejoró a 10 días por piso; bloque B al día con el pronóstico.', mejoras: 'Recubrimientos del piso 4 del bloque A corregidos tarde.', accion: 'Mantener la bonificación; verificar panelas antes de cerrar la formaleta.' },
        { fecha: '2026-09-30', equipo: 'Instalaciones bloque A', tecnica: 3, seguridad: 4, productividad: 4, colaboracion: 4, comunicacion: 4, fortalezas: 'Arranque ordenado de las instalaciones del bloque A detrás de la mampostería.', mejoras: 'Unión mal soldada en el piso 1 (fuga en la prueba hidrostática).', accion: 'Certificación interna de soldadores de tubería y prueba por tramo antes de cerrar muros.' },
        { fecha: '2026-09-30', equipo: 'Dirección de obra', tecnica: 4, seguridad: 4, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Gestión del deslizamiento y del INC-005 con información oportuna.', mejoras: 'Directos de la etapa 1 con SPI de 0,914 y CPI de 0,921.', accion: 'Plan de recuperación de la estructura y control semanal de costos por capítulo.' },
        { fecha: '2026-09-30', equipo: 'Sala de ventas', tecnica: 4, seguridad: 5, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Etapa 1 casi vendida (196 de 208 viviendas).', mejoras: 'Etapa 2 a 11 ventas al mes frente a 14 planeadas.', accion: 'Alianzas de preaprobación con bancos y Comfama y cuota inicial flexible (CC-004).' },
      ]),
      criterios: 'Escala de 1 a 5 frente a lo esperado (3 = cumple). Competencia técnica: calidad del trabajo y no conformidades del periodo. SST: permisos, elementos de protección, inspecciones y ausencia de incidentes. Productividad: rendimiento real frente al planeado (por ejemplo, días por piso). Colaboración y comunicación: cumplimiento de compromisos del comité de obra y calidad de la información. El director de obra evalúa cada mes a las cuadrillas y subcontratistas con el inspector de calidad y el coordinador SST; el gerente de proyecto evalúa a la dirección de obra y al equipo comercial. Los subcontratistas se identifican por su contrato: CT-019 ' + EMP.tie + ', CT-020 ' + EMP.anc + ', CT-021 ' + EMP.pil + ', CT-022 ' + EMP.eind + ' y CT-025 ' + EMP.urb + '; las instalaciones del bloque A las ejecuta ' + EMP.ins + ' dentro del contrato del constructor (CT-015).',
      indicadores: rows('ede-ind', [
        { indicador: 'Accidentes con incapacidad', meta: '0', resultado: '0 en la etapa 1', comentario: 'Seis meses sin accidentes con incapacidad.' },
        { indicador: 'Reportes de casi accidente', meta: '≥ 4 por mes', resultado: '6 en septiembre', comentario: 'Cultura de reporte estable.' },
        { indicador: 'Ausentismo', meta: '≤ 3 %', resultado: '3,8 %', comentario: 'Afectado por la rotación de personal y por incapacidades de origen común.' },
        { indicador: 'Rotación del personal de obra', meta: '≤ 10 % mensual', resultado: '14 % en julio; 9 % en septiembre', comentario: 'Disparador del R-013 alcanzado en julio (INC-006); bonificación por rendimiento desde agosto.' },
        { indicador: 'Cumplimiento del plan de capacitación', meta: '100 %', resultado: '92 %', comentario: 'Pendiente la capacitación en el sistema industrializado de la cuadrilla nueva del bloque B.' },
        { indicador: 'Días por piso en la estructura', meta: '8,5 días hábiles', resultado: '11 en julio y agosto; 10 en septiembre', comentario: 'Mejora con la bonificación y el turno extendido.' },
      ]),
    },
  };

  /* ================================================================== 10. COMUNICACIONES */

  /* ------------------------------------------------------------ 10.1 Plan de gestión de las comunicaciones */
  const planGestionComunicaciones = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.ger, reviso: R.com, aprobo: R.jun },
    fields: {
      requisitos: 'Junta directiva: decisiones sobre la factibilidad, las líneas base y los cambios fuera de la autoridad del gerente, con información de ventas, costos, flujo de caja y utilidad pronosticada. Fiduciaria y banco: información verificable para certificar el punto de equilibrio, los giros y los desembolsos. Autoridades (curaduría, Departamento Administrativo de Planeación, Secretaría de Movilidad, EPM y Área Metropolitana del Valle de Aburrá): radicaciones completas y respuestas dentro de los plazos legales. Compradores: avance de obra, estado de cuenta y fechas de entrega confiables; la Ley 1480 de 2011 exige información veraz y suficiente. Comunidad vecina: horarios, tránsito de volquetas y canales de queja. Constructor y consultores: decisiones de diseño y órdenes de cambio oportunas.',
      confidencialidad: 'Los datos personales de los compradores se tratan conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos del promotor. La información financiera del fideicomiso y los precios negociados con proveedores son confidenciales: solo los conocen la junta, el gerente de proyecto, el estructurador financiero y la fiduciaria. La información de vinculación de los compradores (SARLAFT) la custodia la fiduciaria. Las publicaciones en medios y redes las aprueba el gerente comercial.',
      matriz: rows('pgcm-m', [
        { informacion: 'Informe de desempeño del proyecto', proposito: 'Mostrar avance, valor ganado, ventas, flujo de caja, riesgos y cambios para tomar decisiones.', emisor: R.ger, receptores: R.jun, medio: 'Informe escrito', metodo: 'De tipo push (enviar)', frecuencia: 'Mensual', formato: 'Informe con tablero de indicadores (segundo martes)', responsable: R.ger },
        { informacion: 'Comité de gerencia', proposito: 'Revisar avance, ventas, flujo de caja, riesgos y cambios y asignar compromisos.', emisor: R.ger, receptores: 'Estructurador financiero, gerente comercial, arquitecto diseñador y director de obra', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Mensual', formato: 'Acta de reunión (primer martes)', responsable: R.ger },
        { informacion: 'Comité de obra', proposito: 'Programar la semana y revisar calidad, SST, subcontratistas y restricciones.', emisor: R.con, receptores: 'Residentes, coordinador SST, inspector de calidad, subcontratistas y gerente de proyecto', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Semanal', formato: 'Acta y programa semanal (lunes)', responsable: R.con },
        { informacion: 'Acta de avance de obra y flujo de caja', proposito: 'Soportar los giros de la fiduciaria y los desembolsos del crédito constructor.', emisor: R.est, receptores: 'Fiduciaria, banco e interventoría', medio: 'Oficio radicado', metodo: 'De tipo push (enviar)', frecuencia: 'Mensual', formato: 'Acta de avance certificada por la interventoría (día 10)', responsable: R.est },
        { informacion: 'Certificación del punto de equilibrio', proposito: 'Cumplir las condiciones de giro del encargo de preventas de cada etapa.', emisor: R.fid, receptores: 'Junta directiva, gerente de proyecto y banco', medio: 'Oficio radicado', metodo: 'De tipo push (enviar)', frecuencia: 'Por hito', formato: 'Certificación de la fiduciaria', responsable: R.com },
        { informacion: 'Liberación por piso e informe de supervisión técnica', proposito: 'Dejar constancia del cumplimiento de la NSR-10 y de los planos aprobados.', emisor: R.sup, receptores: 'Director de obra, gerente de proyecto e ingeniero estructural', medio: 'Bitácora de obra', metodo: 'De tipo push (enviar)', frecuencia: 'Semanal', formato: 'Anotación en bitácora e informe mensual', responsable: R.con },
        { informacion: 'Radicaciones y respuestas a entidades', proposito: 'Tramitar licencias, permisos y recibos de obras con trazabilidad.', emisor: R.arq, receptores: 'Curaduría, Planeación, Movilidad, EPM y Área Metropolitana', medio: 'Oficio radicado', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Oficio con número de radicado', responsable: R.arq },
        { informacion: 'Estado de cuenta del comprador', proposito: 'Informar a cada comprador sus pagos y saldos en el encargo fiduciario.', emisor: R.com, receptores: 'Compradores', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Mensual', formato: 'Extracto de la fiduciaria y estado de cuenta de la comercializadora', responsable: R.com },
        { informacion: 'Boletín de avance de obra', proposito: 'Mantener a los compradores informados del avance y de las fechas de entrega.', emisor: R.com, receptores: 'Compradores', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por hito', formato: 'Boletín bimestral con fotos y en cada hito de obra', responsable: R.com },
        { informacion: 'Mesa vecinal', proposito: 'Atender quejas por ruido, polvo y tránsito e informar horarios y frentes de obra.', emisor: R.ger, receptores: 'Comunidad vecina y Junta de Acción Comunal', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Mensual', formato: 'Acta y registro de peticiones, quejas y reclamos', responsable: R.ger },
        { informacion: 'Comité de control de cambios', proposito: 'Evaluar y decidir las solicitudes de cambio que superan la autoridad del gerente.', emisor: R.ger, receptores: R.jun, medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Por evento', formato: 'Solicitud de cambio con análisis de impacto y acta', responsable: R.ger },
        { informacion: 'Repositorio del proyecto', proposito: 'Mantener la versión vigente de planos, cronograma, presupuesto y documentos.', emisor: R.ger, receptores: 'Equipo del proyecto', medio: 'Repositorio de documentos', metodo: 'De tipo pull (consultar)', frecuencia: 'Diaria', formato: 'Carpetas por área de conocimiento con control de versiones', responsable: R.ger },
      ]),
      tecnologias: 'Correo corporativo, repositorio en la nube con control de versiones, herramienta de gestión del proyecto (cronograma, valor ganado y registros), bitácora de obra física y digital, grupos de mensajería por frente para la coordinación diaria, portal de la fiduciaria para la consulta de saldos de los compradores y CRM de ventas de la comercializadora.',
      recursos: 'Gerente de proyecto: cerca del 20 % de su tiempo en informes y comités. Gerente comercial: boletines y atención a compradores con apoyo de la agencia de publicidad (incluido en el presupuesto de mercadeo de COP 1.459 millones). Mesa vecinal y gestión social: dentro del presupuesto de gerencia. Repositorio y licencias de software: gastos administrativos del proyecto.',
      restricciones: 'Los plazos legales de las entidades no los controla el proyecto (por ejemplo, 45 días hábiles para resolver la licencia, según el Decreto 1077 de 2015). La información financiera del fideicomiso solo se publica con autorización de la fiduciaria. La publicidad de preventas debe cumplir la Ley 1480 de 2011: información veraz, precio total, área privada y fecha estimada de entrega.',
      escalamiento: rows('pgcm-esc', [
        { nivel: 'Nivel 1', situacion: 'Problema operativo de obra o de ventas que el responsable no resuelve en el día.', escalaA: 'Director de obra o gerente comercial', plazo: 'Mismo día' },
        { nivel: 'Nivel 2', situacion: 'Afecta un hito, la seguridad o un compromiso con compradores, o requiere usar la reserva para contingencias.', escalaA: R.ger, plazo: '24 horas' },
        { nivel: 'Nivel 3', situacion: 'Requiere cambiar una línea base o usar la reserva de gestión, afecta la utilidad o hay un conflicto contractual o con una autoridad.', escalaA: R.jun, plazo: '48 horas (sesión extraordinaria si hace falta)' },
      ]),
      flujoInformacion: 'El constructor reporta avance, calidad y SST cada lunes; el gerente comercial reporta ventas y recaudos cada semana; el estructurador financiero concilia los costos reales con la contabilidad del fideicomiso al cierre de cada mes; el gerente de proyecto consolida el informe de desempeño (corte el último día del mes), lo presenta al comité de gerencia el primer martes y a la junta el segundo martes; la fiduciaria y el banco reciben el acta de avance el día 10.',
      actualizacion: 'Se revisa al cerrar cada fase (licencia, inicio de obra de cada etapa y entregas) o cuando cambian los interesados; el gerente de proyecto aprueba las modificaciones y las informa en el comité de gerencia.',
      glosario: rows('pgcm-g', [
        { termino: 'Encargo fiduciario de preventas', definicion: 'Contrato con la fiduciaria en el que los compradores consignan separaciones y cuotas iniciales; los recursos se giran al proyecto solo cuando se cumple el punto de equilibrio.' },
        { termino: 'Patrimonio autónomo', definicion: 'Fideicomiso inmobiliario de administración y pagos que recibe el lote y los recursos del proyecto y paga a los proveedores.' },
        { termino: 'Punto de equilibrio', definicion: 'Condiciones de giro de cada etapa: 75 % de las viviendas vinculadas, licencia ejecutoriada, lote libre de gravámenes, crédito constructor aprobado y presupuesto validado por la fiduciaria.' },
        { termino: 'Subrogación', definicion: 'Traslado de la deuda del crédito constructor al crédito hipotecario del comprador al escriturar.' },
        { termino: 'Certificado técnico de ocupación', definicion: 'Documento del supervisor técnico independiente que certifica que la edificación se construyó conforme a la licencia y a la NSR-10 (Ley 1796 de 2016); se protocoliza con las escrituras.' },
        { termino: 'Supervisión técnica independiente', definicion: 'Verificación, por un profesional independiente del constructor y del diseñador, de que la construcción cumple los planos y especificaciones aprobados (NSR-10, Título I).' },
        { termino: 'VIS', definicion: 'Vivienda de interés social: precio de hasta 150 SMMLV en Medellín (Ley 2294 de 2023, art. 293).' },
        { termino: 'Acta de avance de obra', definicion: 'Documento mensual del constructor, certificado por la interventoría, que soporta los pagos y los desembolsos del crédito.' },
        { termino: 'Cargas urbanísticas', definicion: 'Obligaciones del plan parcial: cesiones de suelo, vías, redes, parque y equipamiento que el proyecto construye y entrega al Distrito.' },
      ]),
    },
  };

  /* ------------------------------------------------------------ 10.2 Registro de comunicaciones */
  const registroComunicaciones = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.com },
    fields: {
      comunicaciones: rows('rcom', [
        { id: 'COM-001', fecha: '2025-01-21', tipo: 'Acta', asunto: 'Reunión de arranque: acta de constitución, alcance de la estructuración, roles y reglas de comunicación.', emisor: R.ger, receptores: 'Equipo del promotor y consultores de estructuración', medio: 'Reunión presencial', referencia: 'Acta AR-001', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-002', fecha: '2025-04-22', tipo: 'Presentación', asunto: 'Factibilidad y plan para la dirección del proyecto presentados a la junta: decisión de inversión y LB0 aprobadas.', emisor: R.ger, receptores: R.jun, medio: 'Reunión presencial', referencia: 'Acta de junta de abril de 2025', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-003', fecha: '2025-06-13', tipo: 'Oficio', asunto: 'Firma del encargo fiduciario de preventas y del contrato de fiducia mercantil.', emisor: R.est, receptores: EMP.fid, medio: 'Oficio radicado', referencia: 'CT-011', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-004', fecha: '2025-08-04', tipo: 'Oficio', asunto: 'Radicación en legal y debida forma de la solicitud de licencia de urbanización y construcción.', emisor: R.arq, receptores: 'Curaduría urbana', medio: 'Oficio radicado', referencia: 'Radicado de la curaduría (ficticio) CU-2025-0815', requiereRespuesta: true, fechaRespuesta: '2025-10-06', estado: 'Respondida' },
        { id: 'COM-005', fecha: '2025-10-06', tipo: 'Oficio', asunto: 'Acta de observaciones de la curaduría: cuadro de áreas, memoria estructural y concepto de movilidad (INC-001).', emisor: 'Curaduría urbana', receptores: R.arq, medio: 'Oficio radicado', referencia: 'INC-001', requiereRespuesta: true, fechaRespuesta: '2025-11-28', estado: 'Respondida' },
        { id: 'COM-006', fecha: '2025-11-24', tipo: 'Correo', asunto: 'EPM pide redimensionar la red de acueducto por la presión disponible en la conexión (INC-002).', emisor: 'EPM', receptores: R.arq, medio: 'Correo electrónico', referencia: 'INC-002', requiereRespuesta: true, fechaRespuesta: '2025-12-12', estado: 'Respondida' },
        { id: 'COM-007', fecha: '2025-12-15', tipo: 'Comunicado', asunto: 'Licencia de urbanización y construcción ejecutoriada: aviso a compradores y a la fiduciaria.', emisor: R.com, receptores: 'Compradores de la etapa 1 y fiduciaria', medio: 'Correo electrónico', referencia: 'Resolución de licencia (ficticia)', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-008', fecha: '2026-02-27', tipo: 'Oficio', asunto: 'Certificación del punto de equilibrio de la etapa 1: 156 de 208 viviendas vinculadas y condiciones de giro cumplidas.', emisor: R.fid, receptores: 'Gerente de proyecto, junta directiva y banco', medio: 'Oficio radicado', referencia: 'Hito C05', requiereRespuesta: false, estado: 'Recibida' },
        { id: 'COM-009', fecha: '2026-03-10', tipo: 'Acta', asunto: 'La junta aprueba el CC-002 (mitigación vial e inicio de obra el 16 de marzo); LB1 el 13 de marzo.', emisor: R.ger, receptores: R.jun, medio: 'Reunión presencial', referencia: 'CC-002', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-010', fecha: '2026-03-16', tipo: 'Acta', asunto: 'Acta de inicio de obra de la etapa 1 con el constructor, la supervisión técnica y la interventoría.', emisor: R.ger, receptores: 'Constructor, supervisión técnica independiente e interventoría', medio: 'Reunión presencial', referencia: 'Hito K01', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-011', fecha: '2026-05-07', tipo: 'Anotación en bitácora', asunto: 'Deslizamiento superficial del talud oriental (unos 600 m³); se suspende la excavación de la terraza oriental.', emisor: R.con, receptores: R.ger, medio: 'Bitácora de obra', referencia: 'INC-004', requiereRespuesta: true, fechaRespuesta: '2026-05-12', estado: 'Respondida' },
        { id: 'COM-012', fecha: '2026-05-19', tipo: 'Acta', asunto: 'Comité de control de cambios: la junta aprueba el CC-003 (pantalla anclada y drenajes con cargo a la reserva para contingencias).', emisor: R.ger, receptores: R.jun, medio: 'Reunión presencial', referencia: 'Acta CCC-2026-02', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-013', fecha: '2026-06-16', tipo: 'Comunicado', asunto: 'Boletín de avance n.º 2 a compradores: movimiento de tierras, pilas e inicio de la plataforma.', emisor: R.com, receptores: 'Compradores', medio: 'Correo electrónico', referencia: 'Boletín 2-2026', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-014', fecha: '2026-08-13', tipo: 'Oficio', asunto: 'Cilindros del piso 3 del bloque A con 25,1 MPa: se pide concepto al diseñador estructural y extracción de núcleos.', emisor: R.con, receptores: 'Ingeniero estructural y supervisión técnica independiente', medio: 'Oficio radicado', referencia: 'INC-005', requiereRespuesta: true, fechaRespuesta: '2026-09-04', estado: 'Respondida' },
        { id: 'COM-015', fecha: '2026-08-14', tipo: 'Comunicado', asunto: 'Boletín de avance n.º 3 a compradores: pilas terminadas, cimentación en su tramo final y estructura del bloque A en curso.', emisor: R.com, receptores: 'Compradores', medio: 'Correo electrónico', referencia: 'Boletín 3-2026', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-016', fecha: '2026-09-10', tipo: 'Oficio', asunto: 'Acta de avance de obra de agosto y flujo de caja para el cuarto desembolso del crédito de la etapa 1.', emisor: R.est, receptores: 'Banco, fiduciaria e interventoría', medio: 'Oficio radicado', referencia: 'Acta de avance n.º 6', requiereRespuesta: true, fechaRespuesta: CUT, estado: 'Respondida' },
        { id: 'COM-017', fecha: '2026-09-25', tipo: 'Acta', asunto: 'Sesión extraordinaria de la junta: aprueba el CC-004 (lista de la etapa 2 +3 % y cuota inicial flexible).', emisor: R.ger, receptores: R.jun, medio: 'Reunión presencial', referencia: 'Acta JD-2026-09E', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-018', fecha: '2026-09-28', tipo: 'Informe', asunto: 'Solicitud de cambio CC-005: reponer COP 280 millones a la reserva para contingencias desde la reserva de gestión; se decide el 13 de octubre.', emisor: R.ger, receptores: R.jun, medio: 'Informe escrito', referencia: 'CC-005', requiereRespuesta: true, estado: 'Pendiente de respuesta' },
        { id: 'COM-019', fecha: '2026-09-29', tipo: 'Acta', asunto: 'Mesa vecinal de septiembre: quejas por polvo en la vía de acceso; se acuerdan lavado de llantas y riego dos veces al día.', emisor: R.ger, receptores: 'Comunidad vecina y Junta de Acción Comunal', medio: 'Reunión presencial', referencia: 'Mesa vecinal n.º 7', requiereRespuesta: false, estado: 'Archivada' },
      ]),
      archivo: 'Repositorio del proyecto (carpeta 10-Comunicaciones) con los radicados físicos escaneados; correo corporativo archivado por tema; bitácora de obra original en el campamento. Conservación: diez años después de la entrega de la etapa 2, por la garantía de estabilidad de la Ley 1480 de 2011 y el amparo patrimonial de la Ley 1796 de 2016.',
    },
  };

  /* ------------------------------------------------------------ 10.2 Actas de reunión */
  const actaReunion = {
    instances: [
      {
        key: 'ej1', title: 'Acta de reunión AR-001 — Reunión de arranque del proyecto', status: 'aprobado', rev: '0', date: '2025-01-24',
        titleBlock: { elaboro: R.est, reviso: R.com, aprobo: R.ger },
        fields: {
          numero: 'AR-001', fecha: '2025-01-21', horaInicio: '8:00 a. m.', horaFin: '11:30 a. m.', lugar: 'Oficina del promotor, Medellín', modalidad: 'Presencial', tipoReunion: 'Reunión de arranque (kick-off)', convoca: R.ger,
          objetivo: 'Presentar el acta de constitución, el alcance de la fase de estructuración y las reglas de trabajo, y asignar los responsables de la debida diligencia del lote, el estudio de mercado y la factibilidad.',
          asistentes: rows('ar1-a', [
            { rol: 'Delegado de la junta directiva del promotor', organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.ger, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.est, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.com, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.abo, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.ctd, organizacion: EMP.pro, asistencia: 'Excusado' },
            { rol: 'Consultor del estudio de títulos y avalúo', organizacion: EMP.tit, asistencia: 'Asistió' },
            { rol: 'Consultor del estudio de mercado', organizacion: EMP.mer, asistencia: 'Asistió' },
          ]),
          agenda: [
            'Acta de constitución del proyecto, aprobada el 13 de enero de 2025.',
            'Objetivos: desarrollo de 416 viviendas (104 VIS y 312 No VIS) en dos etapas, utilidad antes de impuestos de al menos 12 % de las ventas y retorno del aporte del promotor.',
            'Cronograma de la estructuración: debida diligencia, promesa del lote, estudio de mercado y factibilidad.',
            'Roles, comités y reglas de comunicación.',
            'Interesados y riesgos iniciales.',
            'Compromisos.',
          ],
          desarrollo: 'El gerente de proyecto presentó el acta de constitución aprobada por la junta el 13 de enero y el alcance de la fase de estructuración, con la decisión de inversión prevista para abril. El abogado del proyecto informó que el estudio preliminar de títulos no muestra gravámenes ni limitaciones al dominio y que falta confirmar la norma del plan parcial con el Departamento Administrativo de Planeación. El consultor de mercado presentó la metodología del estudio del occidente de Medellín (oferta, absorción y precios por estrato y por tipo de vivienda). El estructurador financiero propuso la estructura de financiación (aporte del promotor, preventas con encargo fiduciario y crédito constructor por etapa) y el calendario de la factibilidad. Se acordaron los comités, el registro de interesados y el flujo de información.',
          decisiones: rows('ar1-d', [
            { decision: 'Negociar la promesa de compraventa del lote con arras del 20 % y pago del saldo con la escritura, sujeta a la factibilidad.', tema: 'Lote', aprobadaPor: 'Delegado de la junta directiva' },
            { decision: 'Adoptar un ciclo de vida predictivo por etapas y el comité de gerencia mensual del primer martes.', tema: 'Gobierno del proyecto', aprobadaPor: R.ger },
            { decision: 'Contratar la factibilidad técnica, legal y financiera con entrega el 11 de abril de 2025.', tema: 'Factibilidad', aprobadaPor: R.ger },
          ]),
          compromisos: rows('ar1-c', [
            { compromiso: 'Completar el registro de interesados.', responsable: R.ger, fecha: '2025-01-24', estado: 'Cumplido' },
            { compromiso: 'Entregar el estudio de títulos, el avalúo y el levantamiento topográfico.', responsable: R.abo, fecha: '2025-02-21', estado: 'Pendiente' },
            { compromiso: 'Preparar la minuta de la promesa de compraventa del lote.', responsable: R.abo, fecha: '2025-02-21', estado: 'Pendiente' },
            { compromiso: 'Entregar el estudio de mercado del occidente de Medellín.', responsable: R.com, fecha: '2025-03-07', estado: 'Pendiente' },
            { compromiso: 'Presentar a la junta la factibilidad y la línea base para la decisión de inversión.', responsable: R.ger, fecha: '2025-04-22', estado: 'Pendiente' },
          ]),
          proximaFecha: '2025-02-04',
          observaciones: 'Acta revisada y aprobada por los asistentes el 24 de enero de 2025.',
        },
      },
      {
        key: 'ej2', title: 'Acta de reunión CCC-2026-02 — Comité de control de cambios: CC-003, contención del talud oriental', status: 'aprobado', rev: '0', date: '2026-06-09',
        titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
        fields: {
          numero: 'CCC-2026-02', fecha: '2026-05-19', horaInicio: '7:30 a. m.', horaFin: '9:30 a. m.', lugar: 'Sala de juntas del promotor, con conexión virtual a la obra', modalidad: 'Mixta', tipoReunion: 'Comité de control de cambios', convoca: R.ger,
          objetivo: 'Decidir la solicitud de cambio CC-003, presentada por el director de obra el 12 de mayo de 2026 después del deslizamiento superficial del talud oriental (INC-004).',
          asistentes: rows('ar2-a', [
            { rol: 'Miembros de la junta directiva (3)', organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.ger, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.est, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.con, organizacion: EMP.con, asistencia: 'Asistió' },
            { rol: 'Ingeniero geotecnista', organizacion: EMP.geo, asistencia: 'Asistió' },
            { rol: R.sti, organizacion: EMP.sup, asistencia: 'Asistió' },
            { rol: 'Interventor del banco y la fiduciaria', organizacion: EMP.int, asistencia: 'Excusado' },
          ]),
          agenda: [
            'Informe del deslizamiento del 7 de mayo y estado del talud (INC-004).',
            'Alternativas de estabilización y concepto geotécnico.',
            'Impacto en costo, cronograma y riesgos (CC-003).',
            'Financiación con la reserva para contingencias.',
            'Decisión y compromisos.',
          ],
          desarrollo: 'El director de obra informó que el 7 de mayo, después de las lluvias de abril y mayo, se deslizaron unos 600 m³ del talud oriental de la terraza de la etapa 1, sin personas afectadas; la excavación de ese frente está suspendida y los inclinómetros muestran estabilidad desde el 10 de mayo. El geotecnista presentó tres alternativas: tender el talud (reduce el área de la plataforma y obliga a rediseñar), muro de contención en concreto (unas 10 semanas) y pantalla anclada de 60 m con drenajes (7 a 8 semanas, COP 600 millones). El estructurador financiero confirmó que la reserva para contingencias tiene COP 2.363 millones y que el riesgo R-004 (lluvias y taludes) estaba previsto con un VME de COP 400 millones. El gerente de proyecto estimó tres semanas de atraso en el movimiento de tierras, sin efecto en la fecha de cierre del proyecto. El supervisor técnico pidió que el diseño de la pantalla tenga la revisión del ingeniero estructural antes de iniciar.',
          decisiones: rows('ar2-d', [
            { decision: 'Aprobar el CC-003: pantalla anclada de 60 m y drenajes del talud oriental por COP 600 millones con cargo a la reserva para contingencias, que queda en COP 1.763 millones. No se establece nueva línea base: la LB1 se mantiene para medir el desempeño.', tema: 'CC-003', aprobadaPor: R.jun },
            { decision: 'Contratar la obra a precio global con ' + EMP.anc + ' e iniciar de inmediato.', tema: 'Adquisiciones', aprobadaPor: R.ger },
            { decision: 'Registrar el riesgo R-004 como materializado y reevaluar los taludes de la etapa 2.', tema: 'Riesgos', aprobadaPor: R.ger },
          ]),
          compromisos: rows('ar2-c', [
            { compromiso: 'Firmar el contrato CT-020 y dar la orden de inicio.', responsable: R.ger, fecha: '2026-05-19', estado: 'Cumplido' },
            { compromiso: 'Entregar el diseño de la pantalla revisado por el ingeniero estructural a la supervisión técnica.', responsable: R.ies, fecha: '2026-05-22', estado: 'Cumplido' },
            { compromiso: 'Actualizar el registro de riesgos, el registro de cambios y el pronóstico del cronograma.', responsable: R.ger, fecha: '2026-05-22', estado: 'Cumplido' },
            { compromiso: 'Instalar inclinómetros adicionales con lectura diaria en temporada de lluvias.', responsable: R.con, fecha: '2026-05-26', estado: 'Cumplido' },
            { compromiso: 'Terminar la pantalla anclada y los drenajes.', responsable: R.con, fecha: '2026-07-11', estado: 'En curso' },
          ]),
          proximaFecha: '2026-06-09',
          observaciones: 'Acta aprobada en la sesión ordinaria de la junta directiva del 9 de junio de 2026.',
        },
      },
      {
        key: 'ej3', title: 'Acta de reunión JD-2026-09E — Junta directiva extraordinaria: CC-004 y estado del proyecto', status: 'revision', rev: 'A', date: CUT,
        titleBlock: { elaboro: R.ger, reviso: R.com },
        fields: {
          numero: 'JD-2026-09E', fecha: '2026-09-25', horaInicio: '7:00 a. m.', horaFin: '9:00 a. m.', lugar: 'Sala de juntas del promotor, Medellín', modalidad: 'Presencial', tipoReunion: 'Comité de control de cambios', convoca: 'Presidente de la junta directiva, a solicitud del gerente de proyecto',
          objetivo: 'Decidir la solicitud de cambio CC-004 (lista de precios de la etapa 2 y cuota inicial flexible) ante la baja velocidad de ventas de la etapa 2 (INC-007) y revisar el avance del proyecto con corte al 31 de agosto.',
          asistentes: rows('ar3-a', [
            { rol: 'Miembros de la junta directiva (3)', organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.ger, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.com, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.est, organizacion: EMP.pro, asistencia: 'Asistió' },
            { rol: R.con, organizacion: EMP.con, asistencia: 'Asistió' },
            { rol: 'Revisor fiscal', organizacion: EMP.pro, asistencia: 'Excusado' },
          ]),
          agenda: [
            'Ventas de la etapa 2: 68 viviendas al 31 de agosto, 11 al mes frente a 14 planeadas (INC-007).',
            'Solicitud de cambio CC-004: lista de la etapa 2 +3 % y cuota inicial flexible a 24 meses con preaprobación bancaria.',
            'Avance de obra y valor ganado con corte al 31 de agosto.',
            'Tasas de interés y costos de mano de obra: anuncio del CC-005 (reposición de la reserva para contingencias).',
            'Proposiciones y varios.',
          ],
          desarrollo: 'El gerente comercial presentó las ventas de la etapa 2: 68 viviendas al 31 de agosto, con 9 en agosto, frente a 14 al mes planeadas. La caída de las ventas de vivienda nueva en Medellín (−15 % en el primer semestre) y la falta de asignaciones de Mi Casa Ya explican la menor demanda; el índice de precios de vivienda nueva del área metropolitana sube 9,14 % anual, pero en los estratos 1 a 3 del municipio baja 1,92 %. Propuso subir 3 % la lista de la etapa 2 desde el 1 de octubre (oportunidad R-014: hasta COP 1.603 millones sobre las viviendas por vender si el mercado la absorbe) y ofrecer cuota inicial flexible a 24 meses con preaprobación bancaria y alianza con Comfama para acelerar la absorción. El estructurador financiero mostró que la medida no cambia el BAC ni el cronograma, recomendó no incluir el alza en el pronóstico de ventas hasta verificar la absorción e informó que el punto de equilibrio de la etapa 2 se pronostica para el 29 de abril de 2027 (LB1: 29 de enero). El director de obra informó la plataforma terminada el 18 de septiembre, el bloque A en el piso 6 y el bloque B en el piso 3, con un SPI cercano a 0,91 en los directos de la etapa 1 por el deslizamiento de mayo y la rotación de oficiales. El gerente de proyecto anunció el CC-005, porque el VME de las amenazas abiertas (COP 2.043 millones, sin el R-004, materializado, cuya reserva se usó en el CC-003) supera la reserva disponible (COP 1.763 millones) en COP 280 millones.',
          decisiones: rows('ar3-d', [
            { decision: 'Aprobar el CC-004: lista de precios de la etapa 2 +3 % desde el 1 de octubre de 2026 y cuota inicial flexible a 24 meses con preaprobación bancaria. El alza no se incluye en el pronóstico de ventas hasta verificar la absorción.', tema: 'CC-004', aprobadaPor: R.jun },
            { decision: 'Mantener los descuentos de la etapa 2 dentro del 2 % autorizado al gerente comercial.', tema: 'Política comercial', aprobadaPor: R.jun },
            { decision: 'Recibir el CC-005 con el análisis cuantitativo de riesgos actualizado en la sesión ordinaria del 13 de octubre.', tema: 'Reservas', aprobadaPor: R.jun },
          ]),
          compromisos: rows('ar3-c', [
            { compromiso: 'Publicar la nueva lista de precios y el esquema de cuota inicial flexible en la sala de ventas.', responsable: R.com, fecha: '2026-10-01', estado: 'En curso' },
            { compromiso: 'Firmar las alianzas de preaprobación con dos bancos y con Comfama.', responsable: R.com, fecha: '2026-10-15', estado: 'En curso' },
            { compromiso: 'Presentar el plan de recuperación de la estructura de los bloques A y B.', responsable: R.con, fecha: '2026-10-06', estado: 'Pendiente' },
            { compromiso: 'Presentar el CC-005 y el análisis cuantitativo de riesgos actualizado.', responsable: R.ger, fecha: '2026-10-13', estado: 'En curso' },
          ]),
          proximaFecha: '2026-10-13',
          observaciones: 'Borrador enviado a los asistentes el 28 de septiembre de 2026; se aprobará en la sesión ordinaria del 13 de octubre.',
        },
      },
    ],
  };

  /* ================================================================== 11. RIESGOS */

  /* ------------------------------------------------------------ 11.1 Plan de gestión de los riesgos */
  const pgriFields = {
    estrategia: 'Gestionar los riesgos de un desarrollo inmobiliario de ciclo largo (unos cuatro años) en el que la exposición es comercial y financiera antes de la obra (ventas, tasas y punto de equilibrio de cada etapa) y técnica durante la obra (ladera, estructura y SST). Principios: decidir por etapas con puntos de no retorno (decisión de inversión y punto de equilibrio de cada etapa); transferir lo transferible a la fiducia y a las pólizas; mantener una reserva para contingencias igual al VME de las amenazas y una reserva de gestión del 1 % del BAC para lo desconocido.',
    metodologia: 'Identificación con juicio de expertos, listas de verificación del sector y lecciones de proyectos anteriores del promotor; análisis cualitativo con una matriz de probabilidad e impacto de 5 × 5 (probabilidad de 10 % a 80 %; impacto por costo, desde menos de COP 100 millones hasta más de COP 1.500 millones, con equivalentes en plazo, alcance, calidad y SST); análisis cuantitativo por valor monetario esperado para dimensionar la reserva y análisis de sensibilidad de la utilidad frente al precio de venta, la velocidad de ventas, el costo directo y la tasa de interés; respuestas con propietario, disparador y reserva; seguimiento mensual en el comité de gerencia.',
    rolesRiesgo: rows('pgri-rol', [
      { rol: R.jun, responsabilidades: 'Fija el apetito al riesgo, aprueba las reservas y decide los riesgos escalados (más de COP 300 millones o con efecto en hitos o en la utilidad).' },
      { rol: R.ger, responsabilidades: 'Dueño del proceso: mantiene el registro, convoca la revisión mensual, autoriza el uso de la reserva para contingencias hasta COP 300 millones por evento y escala a la junta.' },
      { rol: R.est, responsabilidades: 'Riesgos financieros y tributarios (tasas, flujo de caja, fiducia y crédito); análisis cuantitativo y de sensibilidad.' },
      { rol: R.com, responsabilidades: 'Riesgos comerciales: velocidad de ventas, desistimientos, precios y SARLAFT de los compradores.' },
      { rol: R.arq, responsabilidades: 'Riesgos normativos y de trámites: licencia, POT, EPM y Secretaría de Movilidad.' },
      { rol: R.con, responsabilidades: 'Riesgos de construcción, SST y ambientales; informa los disparadores cada semana en el comité de obra.' },
      { rol: 'Fiduciaria y aseguradora', responsabilidades: 'Reciben los riesgos transferidos: custodia de los recursos de los compradores, SARLAFT y pólizas.' },
    ]),
    financiamiento: 'Reserva para contingencias de COP 2.363 millones (LB1) dentro de la línea base de costos, igual al VME de las amenazas del registro; reserva de gestión de COP 1.400 millones (1 % del BAC) fuera de la línea base, controlada por la junta. Las respuestas con costo (pólizas, inclinómetros, alianzas comerciales) están presupuestadas en sus paquetes de trabajo. Con el CC-002 se usaron COP 430 millones de la reserva para la mitigación vial exigida en la licencia (R-005 materializado).',
    calendario: 'Identificación inicial con la factibilidad (abril de 2025); revisión mensual del registro en el comité de gerencia; reevaluación completa en cada punto de decisión (radicación de la licencia, punto de equilibrio e inicio de obra de cada etapa, certificado técnico de ocupación); revisión semanal de los disparadores de obra en el comité de obra y diaria de lluvias e inclinómetros en temporada de lluvias.',
    edrRiesgos: rows('pgri-rbs', [
      { nivel1: 'Técnico', nivel2: 'Geotecnia y taludes en ladera', ejemplos: 'Lluvias, deslizamientos y nivel freático en las terrazas (R-004).', categoriaRegistro: 'Técnico' },
      { nivel1: 'Técnico', nivel2: 'Estructura y calidad de la construcción', ejemplos: 'Resistencia del concreto y hallazgos de la supervisión técnica independiente (R-011).', categoriaRegistro: 'Técnico' },
      { nivel1: 'Técnico', nivel2: 'Seguridad y salud en el trabajo', ejemplos: 'Trabajo en alturas y excavaciones profundas (R-009).', categoriaRegistro: 'Técnico' },
      { nivel1: 'De gestión', nivel2: 'Recursos y mano de obra', ejemplos: 'Disponibilidad y rotación de oficiales de formaleta y de cuadrillas especializadas.', categoriaRegistro: 'De la organización' },
      { nivel1: 'De gestión', nivel2: 'Cumplimiento y gobierno', ejemplos: 'SARLAFT de compradores y SAGRILAFT de proveedores (R-012).', categoriaRegistro: 'De la organización' },
      { nivel1: 'De gestión', nivel2: 'Dirección del proyecto', ejemplos: 'Estimaciones, coordinación de diseños y control de cambios.', categoriaRegistro: 'Dirección de proyectos' },
      { nivel1: 'Comercial', nivel2: 'Demanda y velocidad de ventas', ejemplos: 'Velocidad de ventas de cada etapa y desistimientos (R-001 y R-006); oportunidades de precio por valorización.', categoriaRegistro: 'Externo' },
      { nivel1: 'Externo', nivel2: 'Mercado financiero', ejemplos: 'Tasas del crédito constructor e hipotecario (R-002).', categoriaRegistro: 'Externo' },
      { nivel1: 'Externo', nivel2: 'Precios de insumos y mano de obra', ejemplos: 'Salario mínimo, acero y concreto (R-003).', categoriaRegistro: 'Externo' },
      { nivel1: 'Externo', nivel2: 'Regulatorio y trámites', ejemplos: 'Licencia, EPM, Movilidad, topes VIS y revisión del POT (R-005, R-007 y R-008).', categoriaRegistro: 'Externo' },
      { nivel1: 'Externo', nivel2: 'Entorno y comunidad', ejemplos: 'Ruido, polvo y tránsito de volquetas (R-010).', categoriaRegistro: 'Externo' },
    ]),
    apetito: 'La junta acepta una utilidad antes de impuestos mínima del 10 % de las ventas (objetivo de la factibilidad: 12,45 %) y no acepta riesgos que comprometan la seguridad de las personas, el cumplimiento de la NSR-10 o la devolución de los recursos de los compradores. Umbrales: todo riesgo con impacto mayor de COP 1.500 millones o de tres meses en una entrega se escala a la junta; la reserva para contingencias no debe ser menor que el VME de las amenazas abiertas; el punto de equilibrio de cada etapa solo se declara con el 75 % de las viviendas vinculadas.',
    probabilidad: rows('pgri-p', [
      { valor: 5, nivel: 'Muy alta', rango: 'Más de 70 % (80 % para el VME)', descripcion: 'Se espera que ocurra en la mayoría de las circunstancias o ya muestra señales.' },
      { valor: 4, nivel: 'Alta', rango: '51 % a 70 % (60 % para el VME)', descripcion: 'Es probable que ocurra durante la etapa.' },
      { valor: 3, nivel: 'Media', rango: '26 % a 50 % (40 % para el VME)', descripcion: 'Puede ocurrir en algún momento del proyecto.' },
      { valor: 2, nivel: 'Baja', rango: '11 % a 25 % (20 % para el VME)', descripcion: 'Podría ocurrir, pero no es lo esperado.' },
      { valor: 1, nivel: 'Muy baja', rango: 'Hasta 10 % (10 % para el VME)', descripcion: 'Solo ocurriría en circunstancias excepcionales.' },
    ]),
    impactos: rows('pgri-i', [
      { valor: 5, nivel: 'Muy alto', alcance: 'Pérdida de unidades vendibles o incumplimiento de la licencia.', cronograma: 'Más de 3 meses en una entrega o en el cierre.', costo: 'Más de COP 1.500 millones.', calidad: 'Falla estructural o pérdida del certificado técnico de ocupación.', sst: 'Accidente mortal.' },
      { valor: 4, nivel: 'Alto', alcance: 'Cambio del producto que la junta y los compradores deben aprobar.', cronograma: '6 semanas a 3 meses en un hito.', costo: 'COP 700 a 1.500 millones.', calidad: 'Demolición o refuerzo de elementos estructurales.', sst: 'Accidente grave.' },
      { valor: 3, nivel: 'Medio', alcance: 'Ajuste de especificaciones de acabados o de zonas comunes.', cronograma: '2 a 6 semanas en un hito.', costo: 'COP 300 a 700 millones.', calidad: 'No conformidad mayor reparable.', sst: 'Accidente con incapacidad menor de 30 días.' },
      { valor: 2, nivel: 'Bajo', alcance: 'Ajuste menor sin efecto en el producto vendido.', cronograma: '1 a 2 semanas en un hito.', costo: 'COP 100 a 300 millones.', calidad: 'No conformidades menores repetidas.', sst: 'Incidente sin incapacidad.' },
      { valor: 1, nivel: 'Muy bajo', alcance: 'Sin efecto apreciable.', cronograma: 'Menos de 1 semana.', costo: 'Menos de COP 100 millones.', calidad: 'No conformidad menor aislada.', sst: 'Primeros auxilios.' },
    ]),
    matrizPI: rows('pgri-m', [
      { nivel: 'Muy alto', puntuacion: '20 a 25', tratamiento: 'Escalar de inmediato a la junta directiva; respuesta aprobada y reserva asignada antes de continuar el trabajo afectado.', revision: 'Semanal' },
      { nivel: 'Alto', puntuacion: '10 a 19', tratamiento: 'Plan de respuesta obligatorio con propietario, disparador y reserva; seguimiento en el informe mensual a la junta.', revision: 'Quincenal' },
      { nivel: 'Medio', puntuacion: '5 a 9', tratamiento: 'Respuesta definida por el propietario y seguimiento en el registro.', revision: 'Mensual' },
      { nivel: 'Bajo', puntuacion: '1 a 4', tratamiento: 'Aceptar y mantener en la lista de vigilancia.', revision: 'Trimestral' },
    ]),
    formatosInformes: 'Registro de riesgos en la herramienta (matriz de probabilidad e impacto); informe de riesgos mensual dentro del informe de desempeño, con los principales riesgos, su tendencia, los disparadores activados y el estado de las reservas; análisis cuantitativo (VME) en cada línea base y siempre que el VME de las amenazas abiertas supere la reserva disponible.',
    seguimiento: 'Revisión mensual en el comité de gerencia (primer martes) con los propietarios; auditoría de riesgos al cerrar cada fase; disparadores de obra revisados cada lunes. Los riesgos materializados pasan al registro de incidentes y, si exigen recursos, a una solicitud de cambio.',
  };
  const planGestionRiesgos = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: pgriFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Emisión con la factibilidad (LB0): reserva para contingencias de COP 2.793 millones.',
        fields: revFields(pgriFields, {
          financiamiento: 'Reserva para contingencias de COP 2.793 millones dentro de la línea base de costos, igual al VME de las amenazas identificadas en la factibilidad; reserva de gestión de COP 1.400 millones (1 % del BAC) fuera de la línea base, controlada por la junta. Las respuestas con costo (pólizas, inclinómetros, alianzas comerciales) están presupuestadas en sus paquetes de trabajo.',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'LB1 (CC-002): R-005 materializado con la licencia; la reserva para contingencias queda en COP 2.363 millones.' },
    ],
  };

  /* ------------------------------------------------------------ 11.2–11.7 Registro de riesgos (corte del 30 de septiembre de 2026) */
  const RIESGOS = [
    { id: 'R-001', descripcion: 'Menor velocidad de ventas de la etapa 2: por tasas altas y menos subsidios, las preventas pueden quedar por debajo de 14 viviendas al mes y atrasar el punto de equilibrio y la obra de la etapa 2.', causa: 'Tasas altas, menos subsidios (Mi Casa Ya sin asignaciones en 2026) y caída de 15 % de las ventas de vivienda nueva en Medellín.', efecto: 'Punto de equilibrio y obra de la etapa 2 más tarde; más costo financiero y de gerencia.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 4, propietario: R.com, estrategia: 'Mitigar', respuesta: 'Alianzas de preaprobación con Comfama y bancos, cuota inicial flexible (CC-004), ajuste de la mezcla hacia el tipo B y descuento por pronto pago acotado.', disparador: 'Ventas de la etapa 2 menores de 12 al mes durante dos meses.', reserva: 480 * M, estado: 'En seguimiento' },
    { id: 'R-002', descripcion: 'Alza de las tasas de interés del crédito constructor y del crédito hipotecario.', causa: 'Política monetaria del Banco de la República (de 9,25 % a 12,25 % en 2026).', efecto: 'Mayor costo financiero y menos compradores con crédito aprobado.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 4, propietario: R.est, estrategia: 'Mitigar', respuesta: 'Desembolsos justo a tiempo, uso de los recaudos del patrimonio autónomo, evaluación de un tramo en UVR o de una cobertura y escrituración rápida para subrogar.', disparador: 'IBR a tres meses por encima de 12 %.', reserva: 420 * M, estado: 'En seguimiento' },
    { id: 'R-003', descripcion: 'Aumento de los costos de mano de obra y materiales (salario mínimo, acero y concreto).', causa: 'Salario mínimo de 2026 (+23 %; Decreto 1469 de 2025) e ICOCED de mano de obra de +14,06 % anual, por encima del reajuste proyectado en el presupuesto (5 % a 6 % anual).', efecto: 'Mayor costo directo de la etapa 2.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 4, propietario: R.con, estrategia: 'Mitigar', respuesta: 'Contratos a precio fijo por bloque, compras anticipadas de acero y concreto e ingeniería de valor en los acabados de la etapa 2.', disparador: 'ICOCED mensual mayor de 0,8 %.', reserva: 543 * M, estado: 'En seguimiento' },
    { id: 'R-004', descripcion: 'Lluvias e inestabilidad de taludes en la ladera durante las excavaciones.', causa: 'Temporadas de lluvias en terreno de ladera con cortes de hasta 9 m.', efecto: 'Atrasos en el movimiento de tierras y la cimentación y obras de contención adicionales.', categoria: 'Técnico', tipo: 'Amenaza', probabilidad: 3, impacto: 4, propietario: R.con, estrategia: 'Mitigar', respuesta: 'Materializado el 7 de mayo de 2026 (INC-004): su reserva se usó en la contención del CC-003 (COP 600 millones de la reserva para contingencias). Para la etapa 2 la respuesta es excavar fuera de la temporada de lluvias (junio a agosto de 2027), con inclinómetros de lectura diaria y los drenajes provisionales construidos antes de abrir los cortes, sin reserva adicional.', disparador: 'Lluvia mayor de 50 mm en un día o desplazamiento del inclinómetro mayor de 10 mm.', reserva: null, estado: 'Materializado' },
    { id: 'R-005', descripcion: 'Exigencias adicionales o retrasos de EPM, de la Secretaría de Movilidad o de la curaduría.', causa: 'Trámites con varias entidades y concepto de movilidad obligatorio por más de 150 celdas de parqueo.', efecto: 'Obras adicionales de mitigación o atraso de la licencia.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 3, impacto: 4, propietario: R.arq, estrategia: 'Aceptar', respuesta: 'Radicación temprana, gestor de trámites y seguimiento semanal. Materializado con la licencia (bahía, carril de desaceleración y semaforización) e incorporado al alcance con el CC-002.', disparador: 'Acta de observaciones o concepto con obligaciones.', reserva: null, estado: 'Cerrado' },
    { id: 'R-006', descripcion: 'Desistimientos de compradores que no logran el cierre financiero.', causa: 'Compradores sin crédito hipotecario o subsidio aprobado al escriturar.', efecto: 'Reventa, costos comerciales y atraso de las subrogaciones.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 3, impacto: 3, propietario: R.com, estrategia: 'Mitigar', respuesta: 'Preaprobación de crédito antes de pagar el 50 % de la cuota inicial y lista de espera para reventa.', disparador: 'Más de 3 % de desistimientos en un trimestre.', reserva: 140 * M, estado: 'Abierto' },
    { id: 'R-007', descripcion: 'Cambio de los topes de la VIS por el borrador de decreto con precio en pesos.', causa: 'Borrador de decreto de MinVivienda publicado en enero de 2026: precio de la VIS fijado en pesos y tope único de 135 SMMLV (≈ COP 236,4 millones), por debajo del precio pactado de COP 254 millones.', efecto: 'Las VIS que se desistan y se revendan después de su vigencia quedarían al nuevo tope.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 1, impacto: 3, propietario: R.est, estrategia: 'Aceptar', respuesta: 'Precios VIS pactados en pesos con margen bajo el tope; seguimiento normativo con el gremio.', disparador: 'Expedición del decreto.', reserva: 30 * M, estado: 'Abierto' },
    { id: 'R-008', descripcion: 'Revisión de mediano plazo del POT de Medellín.', causa: 'Revisión del Acuerdo 48 de 2014 en curso en 2026.', efecto: 'Cambios de norma para la etapa 2 si la licencia pierde vigencia.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 1, impacto: 3, propietario: R.arq, estrategia: 'Evitar', respuesta: 'Mantener la licencia ejecutoriada y vigente; pedir a tiempo la prórroga (Decreto 1077 de 2015) si la etapa 2 se atrasa.', disparador: 'Adopción del nuevo POT.', reserva: 50 * M, estado: 'Abierto' },
    { id: 'R-009', descripcion: 'Accidente de trabajo en alturas o en excavaciones.', causa: 'Trabajo en alturas y excavaciones profundas.', efecto: 'Lesiones, suspensión de la obra y sanciones.', categoria: 'Técnico', tipo: 'Amenaza', probabilidad: 2, impacto: 3, propietario: R.con, estrategia: 'Mitigar', respuesta: 'SG-SST, permisos de trabajo, coordinador de trabajo en alturas y plan de rescate (Resolución 4272 de 2021).', disparador: 'Incidente o casi accidente grave.', reserva: 80 * M, estado: 'Abierto' },
    { id: 'R-010', descripcion: 'Relación con la comunidad vecina por ruido, polvo y tránsito de volquetas.', causa: 'Obra de larga duración en zona habitada.', efecto: 'Quejas, sellamientos o restricciones de horario.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 3, impacto: 2, propietario: R.ger, estrategia: 'Mitigar', respuesta: 'Plan de gestión social, horario de obra acordado, plan de manejo de tránsito aprobado y mesa vecinal mensual.', disparador: 'Más de tres quejas en un mes.', reserva: 60 * M, estado: 'Abierto' },
    { id: 'R-011', descripcion: 'Hallazgos de la supervisión técnica independiente.', causa: 'Errores de ejecución o de ensayos.', efecto: 'Demoliciones parciales y atraso del certificado técnico de ocupación.', categoria: 'Técnico', tipo: 'Amenaza', probabilidad: 2, impacto: 3, propietario: R.con, estrategia: 'Mitigar', respuesta: 'Plan de calidad, ensayos de concreto y acero y liberación por piso.', disparador: 'No conformidad mayor.', reserva: 60 * M, estado: 'Abierto' },
    { id: 'R-012', descripcion: 'Lavado de activos o financiación del terrorismo en los recursos de compradores (SARLAFT).', causa: 'Recursos de origen no verificado.', efecto: 'Daño reputacional y devolución de recursos.', categoria: 'De la organización', tipo: 'Amenaza', probabilidad: 1, impacto: 2, propietario: R.com, estrategia: 'Transferir', respuesta: 'Vinculación de compradores a través de la fiduciaria, con debida diligencia y consulta de listas restrictivas.', disparador: 'Alerta de la fiduciaria.', reserva: 20 * M, estado: 'Abierto' },
    { id: 'R-013', descripcion: 'Rotación de mano de obra calificada por el alza salarial.', causa: 'Salario mínimo de 2026 y demanda de otras obras del Valle de Aburrá.', efecto: 'Menor rendimiento de la estructura y atrasos.', categoria: 'De la organización', tipo: 'Amenaza', probabilidad: 3, impacto: 3, propietario: R.con, estrategia: 'Mitigar', respuesta: 'Bonificación por rendimiento por piso, turno extendido y capacitación en el sistema industrializado (INC-006).', disparador: 'Rotación mensual mayor de 10 %.', reserva: 160 * M, estado: 'Abierto' },
    { id: 'R-014', descripcion: 'Mejor precio de venta de la etapa 2: si el mercado absorbe la lista del CC-004 (+3 % desde el 1 de octubre de 2026), las 130 viviendas por vender se venderían a mayor precio.', causa: 'Índice de precios de vivienda nueva (DANE, II trimestre de 2026) de +9,14 % anual en el área metropolitana, pero de −1,92 % en los estratos 1 a 3 del municipio de Medellín: el alza depende de la absorción.', efecto: 'Hasta COP 1.603 millones más de ventas de la etapa 2, no incluidos en el pronóstico.', categoria: 'Externo', tipo: 'Oportunidad', probabilidad: 3, impacto: 5, propietario: R.com, estrategia: 'Mejorar', respuesta: 'Lista de la etapa 2 +3 % (CC-004) con cuota inicial flexible y preaprobación bancaria para sostener la absorción; descuentos dentro del 2 % autorizado y seguimiento mensual del precio efectivo de cierre.', disparador: 'Absorción de 12 viviendas al mes o más con la nueva lista durante dos meses.', reserva: null, estado: 'En seguimiento' },
  ];
  /* Registro en la LB0 (factibilidad) y en la LB1 (CC-002): probabilidades, impactos y reservas de entonces */
  const RIESGOS_LB = {
    'R-001': { p0: 3, r0: 400, desc: 'Menor velocidad de ventas: por cambios del mercado o de los subsidios, las preventas pueden quedar por debajo del ritmo planeado (23 viviendas al mes en el lanzamiento de la etapa 1 y 14 al mes en la etapa 2) y atrasar el punto de equilibrio de cada etapa.', causa: 'Tasas de interés, disponibilidad de subsidios y competencia en el occidente de Medellín.', respuesta: 'Alianzas de preaprobación con Comfama y bancos, ferias de vivienda, ajuste de la mezcla y descuento por pronto pago acotado.', disparador: 'Ventas menores de 15 al mes durante dos meses.' },
    'R-002': { p0: 3, r0: 480, causa: 'Política monetaria del Banco de la República.', respuesta: 'Desembolsos justo a tiempo, uso de los recaudos del patrimonio autónomo y escrituración rápida para subrogar.' },
    'R-003': { p0: 3, r0: 573, causa: 'Ajuste del salario mínimo y precios internacionales del acero por encima del reajuste proyectado en el presupuesto (ICOCED de 5 % a 6 % anual).', efecto: 'Mayor costo directo de las dos etapas.', respuesta: 'Contratos a precio fijo por especialidad, compras por volumen de acero y concreto e ingeniería de valor en acabados.' },
    'R-004': { p0: 3, r0: 400, respuesta: 'Inclinómetros con lectura diaria en lluvias, drenajes provisionales antes de abrir los cortes y programación de las excavaciones fuera de temporada de lluvias.' },
    'R-005': { p0: 3, r0: 430 },
    'R-006': { p0: 3, r0: 120 },
    'R-007': { p0: 2, r0: 120, desc: 'Cambio de la reglamentación de la VIS (tope o forma de cálculo del precio).', causa: 'Iniciativas regulatorias de MinVivienda.', respuesta: 'Precios VIS con margen bajo el tope; seguimiento normativo con el gremio.', disparador: 'Publicación de un proyecto de decreto.' },
    'R-008': { p0: 1, r0: 50, causa: 'Revisión de mediano plazo del Acuerdo 48 de 2014.' },
    'R-009': { p0: 2, r0: 80 },
    'R-010': { p0: 3, r0: 60 },
    'R-011': { p0: 2, r0: 60 },
    'R-012': { p0: 1, r0: 20 },
  };
  const riesgosEnLinea = (lb) => RIESGOS.filter((r) => RIESGOS_LB[r.id]).map((r) => {
    const x = RIESGOS_LB[r.id];
    const row = { ...r, probabilidad: x.p0, reserva: x.r0 * M, estado: 'Abierto' };
    for (const [k, f] of [['desc', 'descripcion'], ['causa', 'causa'], ['efecto', 'efecto'], ['respuesta', 'respuesta'], ['disparador', 'disparador']]) if (x[k]) row[f] = x[k];
    if (r.id === 'R-004') row.respuesta = x.respuesta;
    if (r.id === 'R-005') {
      if (lb === 'lb1') { row.estado = 'Cerrado'; row.reserva = null; row.respuesta = 'Radicación temprana, gestor de trámites y seguimiento semanal. Materializado con la licencia (bahía, carril de desaceleración y semaforización) e incorporado al alcance con el CC-002.'; }
      else row.respuesta = 'Radicación temprana de la licencia, gestor de trámites y seguimiento semanal; reserva para contingencias de COP 430 millones.';
    }
    return row;
  });
  const rrieFields = {
    riesgos: RIESGOS.map((r) => ({ ...r })),
    fechaRevision: CUT,
    listaVigilancia: 'Riesgos de puntuación baja que se revisan cada trimestre: cambio de los topes VIS por el borrador de decreto con precio en pesos (R-007), revisión de mediano plazo del POT (R-008) y SARLAFT de compradores (R-012). También se vigilan el plazo de fabricación de los ascensores de la etapa 1 (unos seis meses) y la tarifa de ICA en la revisión del Estatuto Tributario de Medellín (Acuerdo 093 de 2023).',
    residuales: 'Después de la pantalla anclada (CC-003) queda un riesgo residual de movimientos menores del talud oriental, vigilado con inclinómetros. Riesgos secundarios: la cuota inicial flexible (CC-004, respuesta al R-001) reduce el recaudo de la etapa 2 antes de su punto de equilibrio y aumenta el uso del crédito; el turno extendido de formaleta (respuesta al R-013) aumenta el ruido al final de la tarde y puede elevar el R-010.',
    planesReserva: 'R-001: si al 31 de enero de 2027 la etapa 2 no supera 120 viviendas vendidas, evaluar con la junta iniciar solo el bloque C o vender inventario a un fondo inmobiliario. R-002: si la IBR a tres meses supera 13 %, contratar una cobertura de tasa o un tramo en UVR para el crédito de la etapa 2. R-004: excavar la etapa 2 entre junio y agosto de 2027, con los drenajes construidos antes de abrir los cortes. Para riesgos no identificados se mantiene la reserva de gestión de COP 1.400 millones.',
  };
  const registroRiesgos = {
    status: 'revision', rev: '2A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.est },
    fields: rrieFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Registro de la factibilidad (LB0): 12 amenazas con un VME de COP 2.793 millones.',
        fields: revFields(rrieFields, {
          riesgos: riesgosEnLinea('lb0'),
          fechaRevision: LB0,
          listaVigilancia: 'Riesgos de puntuación baja que se revisan cada trimestre: revisión de mediano plazo del POT (R-008) y SARLAFT de compradores (R-012).',
          residuales: 'Ninguno identificado con la factibilidad.',
          planesReserva: 'R-001: si una etapa no alcanza el punto de equilibrio en el plazo del encargo, prorrogarlo con la fiduciaria y reforzar el mercadeo antes de devolver recursos. Para riesgos no identificados se mantiene la reserva de gestión de COP 1.400 millones.',
        }),
      },
      {
        rev: '1', status: 'aprobado', date: LB1, note: 'Registro de la LB1 (CC-002): R-005 materializado y cerrado; 11 amenazas abiertas con un VME de COP 2.363 millones.',
        fields: revFields(rrieFields, {
          riesgos: riesgosEnLinea('lb1'),
          fechaRevision: LB1,
          listaVigilancia: 'Riesgos de puntuación baja que se revisan cada trimestre: revisión de mediano plazo del POT (R-008) y SARLAFT de compradores (R-012).',
          residuales: 'La mitigación vial (CC-002) agrega un frente de obra sobre la vía colectora con tránsito público: aumenta la exposición del R-010 (comunidad) durante su construcción.',
          planesReserva: 'R-001: si una etapa no alcanza el punto de equilibrio en el plazo del encargo, prorrogarlo con la fiduciaria y reforzar el mercadeo antes de devolver recursos. Para riesgos no identificados se mantiene la reserva de gestión de COP 1.400 millones.',
        }),
      },
    ],
  };

  /* ------------------------------------------------------------ 11.2 Informe de riesgos (septiembre de 2026) */
  const informeRiesgos = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.est },
    fields: {
      fecha: CUT,
      periodo: 'Septiembre de 2026 (corte del 30 de septiembre)',
      elaboradoPor: R.ger,
      nivelGeneral: 'Alto',
      tendencia: 'En aumento',
      fuentesRiesgoGeneral: 'La exposición se concentra en la etapa 2: su punto de equilibrio depende de vender 78 viviendas más a un ritmo de 11 al mes (frente a 14 planeadas), en un mercado con tasas altas (política monetaria en 12,25 % y crédito constructor a 16,5 % N.T.V.) y con la mano de obra al alza (ICOCED de mano de obra de +14,06 % anual). Con ventas iguales a las de la línea base, la utilidad pronosticada baja de 12,45 % a 8,87 % de las ventas (COP 14.377 millones), por debajo del mínimo de 10 % que acepta la junta, y la reserva para contingencias disponible (COP 1.763 millones) es menor que el VME de las amenazas abiertas (COP 2.043 millones).',
      resumenCategorias: rows('irie-c', [
        { categoria: 'Técnico', amenazas: 3, oportunidades: 0, mayorPuntuacion: 12, comentario: 'R-004 materializado en mayo (deslizamiento del talud oriental): su reserva se usó en el CC-003 y la excavación de la etapa 2 se programa fuera de temporada.' },
        { categoria: 'Externo', amenazas: 7, oportunidades: 1, mayorPuntuacion: 16, comentario: 'Ventas, tasas y costos (R-001 a R-003) concentran el 71 % del VME de las amenazas abiertas; R-005 cerrado con el CC-002.' },
        { categoria: 'De la organización', amenazas: 2, oportunidades: 0, mayorPuntuacion: 9, comentario: 'R-013 (rotación de mano de obra) identificado en julio con el INC-006.' },
        { categoria: 'Dirección de proyectos', amenazas: 0, oportunidades: 0, mayorPuntuacion: 0, comentario: 'Sin riesgos abiertos; las desviaciones de estimación se manejan con el control de costos.' },
      ]),
      principales: rows('irie-p', [
        { riesgo: 'R-001 Ventas lentas de la etapa 2', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Disparador activado en junio (ventas menores de 12 al mes desde mayo). CC-004 aprobado el 25 de septiembre: lista +3 % y cuota inicial flexible; alianzas de preaprobación con bancos y Comfama en trámite.' },
        { riesgo: 'R-003 Alza de costos de obra', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Directos de la etapa 1 con CPI de 0,921; compra anticipada del acero de la etapa 2 en negociación; ingeniería de valor en acabados de la etapa 2.' },
        { riesgo: 'R-002 Alza de tasas de interés', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Disparador activado (IBR a tres meses sobre 12 %); crédito a 16,5 % N.T.V.; se evalúa un tramo en UVR para la etapa 2.' },
        { riesgo: 'R-004 Lluvias y taludes en ladera', nivel: 'Alto', tendencia: 'Estable', respuesta: 'Materializado (INC-004, CC-003); pantalla anclada terminada el 11 de julio; inclinómetros estables (7 mm); excavación de la etapa 2 programada fuera de temporada.' },
        { riesgo: 'R-013 Rotación de mano de obra', nivel: 'Medio', tendencia: 'En disminución', respuesta: 'Bonificación por rendimiento y turno extendido; la rotación bajó de 14 % en julio a 9 % en septiembre.' },
        { riesgo: 'R-006 Desistimientos', nivel: 'Medio', tendencia: 'Estable', respuesta: 'Nueve desistimientos en 2026 (6 en la etapa 1 y 3 en la etapa 2), todos revendidos.' },
        { riesgo: 'R-014 Mejor precio de la etapa 2', nivel: 'Alto', tendencia: 'Estable', respuesta: 'CC-004 aprobado el 25 de septiembre: lista de la etapa 2 +3 % desde el 1 de octubre. Valdría hasta COP 1.603 millones sobre las 130 viviendas por vender (VME de COP 641 millones), pero no se incluye en el pronóstico hasta verificar la absorción: los precios de vivienda nueva de estratos 1 a 3 en Medellín bajan 1,92 % anual.' },
      ]),
      reservaContingencia: 2363 * M,
      reservaUtilizada: 600 * M,
      comentarioReservas: 'De la reserva para contingencias de la LB1 (COP 2.363 millones) se usaron COP 600 millones en la contención del talud oriental (CC-003, materialización del R-004); quedan COP 1.763 millones. El VME de las amenazas abiertas reevaluado al corte (sin el R-004, cuya reserva ya se usó) es de COP 2.043 millones: faltan COP 280 millones. El CC-005 propone reponerlos desde la reserva de gestión (COP 1.400 millones), que quedaría en COP 1.120 millones; la junta lo decide el 13 de octubre de 2026.',
      emergentes: 'Escasez de oficiales de formaleta en el Valle de Aburrá por la reactivación de obras de infraestructura; posible paro de transportadores de carga por el precio del ACPM, que afectaría el suministro de concreto y acero; borrador de decreto de precios VIS en pesos (vigilado como R-007); cambios en la tarifa de ICA en la revisión del Estatuto Tributario de Medellín.',
      recomendaciones: '1) Aprobar el CC-005 (reposición de COP 280 millones a la reserva para contingencias). 2) Iniciar ya el trámite del crédito de la etapa 2 con dos bancos para no atrasar su aprobación más allá de abril de 2027. 3) Contratar a precio fijo la mano de obra de estructura de la etapa 2 antes de febrero de 2027. 4) Preparar con la junta un plan de contingencia comercial si en enero de 2027 la etapa 2 no supera 120 viviendas vendidas. 5) Aprobar un plan de recuperación del margen (utilidad pronosticada de 8,87 % frente al mínimo de 10 %: faltan unos COP 1.835 millones): ingeniería de valor en la etapa 2, control de descuentos, negociación de la tasa del crédito de la etapa 2 y solicitud a la DIAN de la devolución del IVA de materiales de las 104 VIS con su escrituración (hasta ≈ COP 1.057 millones, no incluida en el pronóstico).',
    },
  };

  /* ------------------------------------------------------------ 11.4 Análisis cuantitativo (VME) */
  const BASES = {
    'R-001': 'Tres meses de atraso del punto de equilibrio y de la obra de la etapa 2: intereses, gerencia y administración adicionales.',
    'R-002': 'Unos 1,4 puntos adicionales de IBR (≈ COP 500 millones por punto) sobre el saldo pronosticado de los créditos de las dos etapas.',
    'R-003': 'Unos 4 % adicionales sobre la mano de obra y los materiales pendientes de la etapa 2.',
    'R-004': 'Contención y drenajes adicionales en la excavación de la etapa 2, con base en el costo real de la pantalla del CC-003.',
    'R-005': 'Obras de mitigación vial o de redes que exijan Movilidad o EPM.',
    'R-006': 'Unos diez desistimientos: reventa, comisiones y descuentos.',
    'R-007': 'Si se expide el borrador (tope de 135 SMMLV, ≈ COP 236,4 millones), las 104 promesas firmadas conservarían su precio (régimen de transición por confirmar), pero cada VIS desistida y revendida después de su vigencia valdría COP 17,6 millones menos: unas 10 VIS de compradores sin subsidio ni crédito (≈ COP 176 millones) más el reproceso de promesas, subsidios y créditos (≈ COP 124 millones).',
    'R-008': 'Ajustes de diseño de la etapa 2 si la licencia pierde vigencia antes de terminarla.',
    'R-009': 'Dos semanas de suspensión de la obra, sanciones y sobrecostos.',
    'R-010': 'Restricciones de horario y medidas adicionales de mitigación.',
    'R-011': 'Reparaciones o demoliciones parciales y reensayos.',
    'R-012': 'Devolución de recursos y reventa de unidades.',
    'R-013': 'Un mes adicional de administración y equipos en la estructura de la etapa 2.',
    'R-014': 'Lista de la etapa 2 +3 % (CC-004) sobre las 130 viviendas por vender (68 tipo B y 62 tipo C, COP 53.448 millones a precios de la línea base). No se incluye en el pronóstico de ventas hasta verificar la absorción.',
  };
  const BASES_LB = {
    'R-001': 'Tres meses de atraso del punto de equilibrio de una etapa: intereses, gerencia y administración adicionales.',
    'R-002': 'Unos 2,4 puntos adicionales de IBR (≈ COP 500 millones por punto) sobre el saldo de los créditos de las dos etapas.',
    'R-003': 'Cerca del 1,5 % de los costos directos por alzas de mano de obra, acero y concreto por encima del presupuesto.',
    'R-004': 'Contención y drenajes adicionales en las excavaciones de las dos etapas.',
    'R-006': 'Unos ocho desistimientos: reventa, comisiones y descuentos.',
    'R-007': 'Ajuste del precio de las 104 VIS si cambia la forma de cálculo del tope.',
  };
  const PCT = { 1: 10, 2: 20, 3: 40, 4: 60, 5: 80 };
  /* impacto en costo por riesgo: al corte, en la LB0 y en la LB1 (millones) */
  const IMP = {
    'R-001': [800, 1000], 'R-002': [700, 1200], 'R-003': [905, 1432.5], 'R-004': [800, 1000], 'R-005': [1075, 1075], 'R-006': [350, 300], 'R-007': [300, 600],
    'R-008': [500, 500], 'R-009': [400, 400], 'R-010': [150, 150], 'R-011': [300, 300], 'R-012': [200, 200], 'R-013': [400, null], 'R-014': [1603, null],
  };
  /* nombres cortos para la columna «Riesgo» (texto de una línea); la descripción completa está en el registro */
  const CORTO = {
    'R-001': 'Ventas lentas de la etapa 2', 'R-002': 'Alza de tasas de interés', 'R-003': 'Alza de costos de obra', 'R-004': 'Lluvias y taludes en ladera',
    'R-005': 'Exigencias de EPM o Movilidad', 'R-006': 'Desistimientos', 'R-007': 'Cambio de los topes VIS', 'R-008': 'Revisión del POT',
    'R-009': 'Accidente de trabajo grave', 'R-010': 'Quejas de la comunidad', 'R-011': 'Hallazgos de la supervisión', 'R-012': 'SARLAFT de compradores',
    'R-013': 'Rotación de mano de obra', 'R-014': 'Mejor precio de la etapa 2',
  };
  const CORTO_LB = { 'R-001': 'Ventas más lentas', 'R-007': 'Cambio de la norma VIS' };
  const acuRow = (r, i, lb) => ({ id: 'acua-' + String(i + 1).padStart(2, '0'), riesgo: r.id + ' ' + ((lb && CORTO_LB[r.id]) || CORTO[r.id]), tipo: r.tipo, probabilidad: lb ? PCT[RIESGOS_LB[r.id].p0] : PCT[r.probabilidad], impacto: (lb ? IMP[r.id][1] : IMP[r.id][0]) * M, base: (lb && BASES_LB[r.id]) || BASES[r.id] });
  const acuaCorte = RIESGOS.filter((r) => r.estado !== 'Cerrado' && r.estado !== 'Materializado').sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'Amenaza' ? -1 : 1)).map((r, i) => acuRow(r, i, false));
  const acuaLb = (lb) => RIESGOS.filter((r) => RIESGOS_LB[r.id] && (lb === 'lb0' || r.id !== 'R-005')).map((r, i) => acuRow(r, i, true));
  const acuaFields = {
    riesgos: acuaCorte,
    reservaRecomendada: 2043 * M,
    resultadosCronograma: 'Simulación de Monte Carlo del cronograma pronosticado al corte (1.000 iteraciones; duraciones triangulares en las preventas de la etapa 2, la obra y los trámites): 18 % de probabilidad de cerrar en la fecha de la línea base (28 de marzo de 2029), 36 % en la fecha del pronóstico determinístico (29 de junio de 2029), 50 % el 27 de julio de 2029 y 80 % el 14 de septiembre de 2029. El pronóstico determinístico queda por debajo de la mediana por el sesgo de fusión: las preventas, el crédito y los diseños de detalle de la etapa 2 convergen en su acta de inicio. La ruta crítica más frecuente pasa por las preventas de la etapa 2 (índice de criticidad de 0,82), su punto de equilibrio y la obra de la etapa 2.',
    sensibilidad: 'Diagrama de tornado de la utilidad antes de impuestos pronosticada (COP 14.377 millones): costo directo pendiente ±5 % → ∓COP 3.940 millones; precio de las 130 viviendas por vender de la etapa 2 ±5 % → ±COP 2.672 millones; tasa del crédito ±2 puntos → ∓COP 1.000 millones; velocidad de ventas de la etapa 2 ±3 viviendas al mes → ±COP 650 millones (intereses y gerencia). El costo directo pendiente es la variable de mayor efecto.',
    conclusiones: 'Al corte, el VME de las amenazas abiertas es de COP 2.043 millones y la reserva para contingencias disponible es de COP 1.763 millones: se recomienda reponer COP 280 millones desde la reserva de gestión (CC-005). El R-004 no entra en el cálculo: se materializó en mayo y su reserva se usó en la contención del CC-003; en la etapa 2 se responde con la programación de la excavación fuera de temporada. La oportunidad R-014 (hasta COP 1.603 millones; VME de COP 641 millones) no reduce la reserva ni entra en el pronóstico, porque depende de que el mercado absorba la lista del CC-004 cuando los precios de vivienda nueva de estratos 1 a 3 en Medellín bajan 1,92 % anual. Con la provisión completa (COP 2.043 millones) y ventas iguales a las de la línea base, la utilidad antes de impuestos pronosticada es de COP 14.377 millones (8,87 % de las ventas), por debajo del mínimo de 10 % que acepta la junta: faltan unos COP 1.835 millones, que pueden venir de la R-014, de la devolución del IVA de materiales de las 104 VIS (hasta ≈ COP 1.057 millones, tampoco incluida) y de la ingeniería de valor de la etapa 2.',
    tecnicas: [
      'Valor monetario esperado (VME) por riesgo con la escala de probabilidad del plan (10 % a 80 %).',
      'Simulación de Monte Carlo del cronograma pronosticado.',
      'Análisis de sensibilidad (diagrama de tornado) de la utilidad.',
      'Juicio de expertos del constructor, la fiduciaria y el banco para estimar los impactos.',
    ],
  };
  const analisisCuantitativo = {
    status: 'revision', rev: '2A', date: CUT,
    titleBlock: { elaboro: R.est, reviso: R.ger },
    fields: acuaFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Factibilidad (LB0): VME de las amenazas de COP 2.793 millones = reserva para contingencias.',
        fields: revFields(acuaFields, {
          riesgos: acuaLb('lb0'),
          reservaRecomendada: 2793 * M,
          resultadosCronograma: 'Simulación de Monte Carlo del cronograma de la factibilidad (1.000 iteraciones; duraciones triangulares en licencia, preventas y obra): 45 % de probabilidad de cerrar el 28 de marzo de 2029 y 80 % antes del 29 de junio de 2029; la fecha determinística queda por debajo de la mediana por el sesgo de fusión de las preventas, la licencia y el crédito en el inicio de cada etapa. Las preventas y el trámite de la licencia son las actividades con mayor índice de criticidad.',
          sensibilidad: 'Diagrama de tornado de la utilidad antes de impuestos (COP 20.183 millones): costo directo ±5 % → ∓COP 4.700 millones; precio de venta ±5 % → ±COP 8.100 millones; tasa del crédito ±2 puntos → ∓COP 1.000 millones; velocidad de ventas ±3 viviendas al mes → ±COP 900 millones. El precio de venta y el costo directo son las variables de mayor efecto.',
          conclusiones: 'El VME de las amenazas identificadas es de COP 2.793 millones (1,97 % del costo total): se recomienda una reserva para contingencias de ese valor dentro de la línea base de costos y una reserva de gestión de COP 1.400 millones (1 % del BAC). La utilidad antes de impuestos de la factibilidad es de COP 20.183 millones (12,45 % de las ventas).',
        }),
      },
      {
        rev: '1', status: 'aprobado', date: LB1, note: 'LB1 (CC-002): sin el R-005, el VME de las amenazas es de COP 2.363 millones = reserva para contingencias.',
        fields: revFields(acuaFields, {
          riesgos: acuaLb('lb1'),
          reservaRecomendada: 2363 * M,
          resultadosCronograma: 'Simulación de Monte Carlo del cronograma de la LB1 (1.000 iteraciones): 42 % de probabilidad de cerrar el 28 de marzo de 2029 y 80 % antes del 30 de junio de 2029. Las preventas de la etapa 2 pasan a ser la actividad con mayor índice de criticidad.',
          sensibilidad: 'Diagrama de tornado de la utilidad antes de impuestos (COP 20.183 millones): costo directo ±5 % → ∓COP 4.726 millones; precio de venta de las viviendas por vender ±5 % → ±COP 4.300 millones; tasa del crédito ±2 puntos → ∓COP 1.000 millones; velocidad de ventas de la etapa 2 ±3 viviendas al mes → ±COP 800 millones.',
          conclusiones: 'Con el R-005 materializado e incorporado al alcance por el CC-002 (COP 430 millones), el VME de las amenazas abiertas es de COP 2.363 millones y coincide con la reserva para contingencias de la LB1. La utilidad antes de impuestos de la línea base se mantiene en COP 20.183 millones (12,45 % de las ventas).',
        }),
      },
    ],
  };

  /* ================================================================== 12. ADQUISICIONES */
  const FFP = 'Precio fijo cerrado (FFP)', FPIF = 'Precio fijo más honorarios con incentivos (FPIF)', FPEPA = 'Precio fijo con ajuste económico de precio (FP-EPA)';
  const CPFF = 'Costo más honorarios fijos (CPFF)', TM = 'Tiempo y materiales (T&M)';
  const CAMARA = 'Centro de Arbitraje y Conciliación de la Cámara de Comercio de Medellín para Antioquia';

  /* ------------------------------------------------------------ 12.1 Plan de gestión de las adquisiciones */
  const cronoAdq = rows('pgad-c', [
    { adquisicion: 'Estudio de títulos, avalúo y topografía del lote (CT-001)', solicitudOfertas: '2025-01-06', adjudicacion: '2025-01-10', inicio: '2025-01-14', fin: '2025-02-21', responsable: R.abo },
    { adquisicion: 'Estudio de mercado (CT-002)', solicitudOfertas: '2025-01-06', adjudicacion: '2025-01-15', inicio: '2025-01-20', fin: '2025-03-07', responsable: R.com },
    { adquisicion: 'Factibilidad técnica, legal y financiera (CT-003)', solicitudOfertas: '2025-01-15', adjudicacion: '2025-01-29', inicio: '2025-02-03', fin: '2025-04-11', responsable: R.est },
    { adquisicion: 'Diseño arquitectónico, coordinación y diseños de detalle (CT-004)', solicitudOfertas: '2025-02-03', adjudicacion: '2025-02-24', inicio: '2025-03-03', fin: '2026-12-18', responsable: R.ger },
    { adquisicion: 'Estudio geotécnico y diseños técnicos (CT-005 y CT-008)', solicitudOfertas: '2025-03-10', adjudicacion: '2025-03-25', inicio: '2025-04-01', fin: '2025-08-29', responsable: R.arq },
    { adquisicion: 'Diseño estructural NSR-10 y revisión independiente (CT-006 y CT-007)', solicitudOfertas: '2025-04-07', adjudicacion: '2025-05-05', inicio: '2025-05-12', fin: '2025-08-01', responsable: R.ies },
    { adquisicion: 'Fiducia mercantil y encargo de preventas (CT-011)', solicitudOfertas: '2025-03-17', adjudicacion: '2025-04-25', inicio: '2025-04-30', fin: '2029-03-16', responsable: R.est },
    { adquisicion: 'Comercialización y publicidad (CT-012 y CT-013)', solicitudOfertas: '2025-04-01', adjudicacion: '2025-05-09', inicio: '2025-05-19', fin: '2028-12-15', responsable: R.com },
    { adquisicion: 'Crédito constructor de la etapa 1 (CT-014)', solicitudOfertas: '2025-11-04', adjudicacion: '2026-02-13', inicio: '2026-02-13', fin: '2027-12-24', responsable: R.est },
    { adquisicion: 'Construcción por administración delegada de las etapas 1 y 2 (CT-015)', solicitudOfertas: '2025-09-15', adjudicacion: '2025-11-28', inicio: '2026-03-13', fin: '2028-09-29', responsable: R.ger },
    { adquisicion: 'Supervisión técnica independiente (CT-016)', solicitudOfertas: '2025-10-01', adjudicacion: '2025-12-12', inicio: '2026-03-13', fin: '2028-07-14', responsable: R.ger },
    { adquisicion: 'Interventoría del banco y la fiduciaria (CT-017)', solicitudOfertas: '2026-01-19', adjudicacion: '2026-02-27', inicio: '2026-03-13', fin: '2028-09-29', responsable: R.est },
    { adquisicion: 'Pólizas de la etapa 1 (CT-018)', solicitudOfertas: '2026-02-16', adjudicacion: '2026-03-06', inicio: '2026-03-09', fin: '2027-10-28', responsable: R.est },
    { adquisicion: 'Movimiento de tierras de la etapa 1', solicitudOfertas: '2026-02-02', adjudicacion: '2026-03-20', inicio: '2026-03-30', fin: '2026-06-26', responsable: R.con },
    { adquisicion: 'Pilas, concreto, acero y urbanismo de la etapa 1', solicitudOfertas: '2026-03-02', adjudicacion: '2026-04-21', inicio: '2026-05-04', fin: '2027-03-24', responsable: R.con },
    { adquisicion: 'Mano de obra de estructura con formaleta industrializada', solicitudOfertas: '2026-04-06', adjudicacion: '2026-06-03', inicio: '2026-06-16', fin: '2026-11-13', responsable: R.con },
    { adquisicion: 'Ascensores de las etapas 1 y 2', solicitudOfertas: '2026-06-01', adjudicacion: '2026-08-14', inicio: '2026-09-01', fin: '2028-05-12', responsable: R.con },
    { adquisicion: 'Crédito constructor de la etapa 2', solicitudOfertas: '2026-11-30', adjudicacion: '2027-01-15', inicio: '2027-01-15', fin: '2028-12-15', responsable: R.est },
    { adquisicion: 'Pólizas y subcontratos de la etapa 2', solicitudOfertas: '2026-11-16', adjudicacion: '2027-01-29', inicio: '2027-02-15', fin: '2028-07-07', responsable: R.con },
  ]);
  /* LB0: obra de la etapa 1 cuatro semanas antes; contratos posteriores al 22 de abril de 2025 sin número */
  const cronoAdqLb0 = patchRows(cronoAdq, {
    'pgad-c-04': { adquisicion: 'Diseño arquitectónico, coordinación y diseños de detalle (CT-004)', fin: '2026-12-18' },
    'pgad-c-05': { adquisicion: 'Estudio geotécnico y diseños técnicos (CT-005 y CT-008)' },
    'pgad-c-06': { adquisicion: 'Diseño estructural NSR-10 y revisión independiente' },
    'pgad-c-07': { adquisicion: 'Fiducia mercantil y encargo de preventas' },
    'pgad-c-08': { adquisicion: 'Comercialización y publicidad' },
    'pgad-c-09': { adquisicion: 'Crédito constructor de la etapa 1', adjudicacion: '2026-01-16', inicio: '2026-01-16', fin: '2027-11-26' },
    'pgad-c-10': { adquisicion: 'Construcción por administración delegada de las etapas 1 y 2', inicio: '2026-02-13' },
    'pgad-c-11': { adquisicion: 'Supervisión técnica independiente', inicio: '2026-02-13', fin: '2028-07-14' },
    'pgad-c-12': { adquisicion: 'Interventoría del banco y la fiduciaria', solicitudOfertas: '2025-12-15', adjudicacion: '2026-01-30', inicio: '2026-02-13', fin: '2028-09-01' },
    'pgad-c-13': { adquisicion: 'Pólizas de la etapa 1', solicitudOfertas: '2026-01-19', adjudicacion: '2026-02-06', inicio: '2026-02-09', fin: '2027-09-30' },
    'pgad-c-14': { solicitudOfertas: '2026-01-05', adjudicacion: '2026-02-20', inicio: '2026-03-02', fin: '2026-05-29' },
    'pgad-c-15': { solicitudOfertas: '2026-02-02', adjudicacion: '2026-03-24', inicio: '2026-04-06', fin: '2027-02-24' },
    'pgad-c-16': { solicitudOfertas: '2026-03-09', adjudicacion: '2026-05-06', inicio: '2026-05-19', fin: '2026-10-16' },
    'pgad-c-17': { solicitudOfertas: '2026-05-04', adjudicacion: '2026-07-17', inicio: '2026-08-03' },
  });
  const pgadFields = {
    coordinacion: 'Las adquisiciones siguen las fases del proyecto: estructuración y diseños (consultorías a precio fijo), comercialización (fiducia, comercializadora y agencia), financiación (crédito constructor por etapa) y construcción (constructor por administración delegada que celebra subcontratos por especialidad y compras de concreto y acero por volumen, con aprobación del gerente de proyecto para los de más de COP 500 millones). Las fechas de contratación se amarran a hitos del cronograma: ningún contrato de obra se firma antes de la licencia ejecutoriada y del punto de equilibrio de la etapa, y las pólizas se expiden antes del acta de inicio. Los contratos de obra se pagan desde el patrimonio autónomo contra acta de avance certificada por la interventoría.',
    cronogramaAdquisiciones: cronoAdq,
    rolesAdquisiciones: rows('pgad-r', [
      { rol: R.jun, responsabilidad: 'Aprueba la estrategia de adquisiciones, los contratos de fiducia, crédito y construcción y toda adquisición mayor de COP 1.000 millones.', limite: 'Más de COP 1.000 millones' },
      { rol: R.ger, responsabilidad: 'Conduce los procesos de selección, firma contratos y órdenes dentro de su límite, aprueba los subcontratos y compras del constructor de más de COP 500 millones y administra los contratos.', limite: 'Hasta COP 1.000 millones por contrato del promotor; aprueba subcontratos del constructor de más de COP 500 millones' },
      { rol: R.est, responsabilidad: 'Fiducia, crédito, pólizas y verificación de pagos contra el presupuesto.', limite: 'Visto bueno financiero (sin firma)' },
      { rol: R.abo, responsabilidad: 'Minutas, revisión de pólizas, debida diligencia SAGRILAFT de contratistas y liquidaciones.', limite: 'Visto bueno jurídico obligatorio' },
      { rol: R.con, responsabilidad: 'Solicita ofertas, adjudica subcontratos y compras de obra dentro de su límite, recomienda al gerente los mayores y administra los subcontratos.', limite: 'Subcontratos y órdenes de compra hasta COP 500 millones dentro del presupuesto aprobado' },
      { rol: R.fid, responsabilidad: 'Paga a los contratistas desde el patrimonio autónomo con instrucción del promotor y soporte.', limite: 'Solo pagos con instrucción y presupuesto' },
    ]),
    metricasProveedor: rows('pgad-m', [
      { metrica: 'Actividades terminadas a tiempo según el programa', meta: '≥ 90 %', frecuencia: 'Mensual' },
      { metrica: 'No conformidades de calidad', meta: '≤ 2 menores y 0 mayores por mes', frecuencia: 'Mensual' },
      { metrica: 'Cumplimiento SST (inspecciones conformes)', meta: '100 %', frecuencia: 'Mensual' },
      { metrica: 'Entregas de concreto a la hora programada', meta: '≥ 95 %', frecuencia: 'Semanal' },
      { metrica: 'Aportes de seguridad social del personal al día (PILA)', meta: '100 %', frecuencia: 'Mensual' },
    ]),
    jurisdiccion: 'Ley colombiana; arreglo directo y luego conciliación y arbitraje en el ' + CAMARA + '.',
    moneda: 'Pesos colombianos (COP); pagos desde el patrimonio autónomo a 30 días de la factura electrónica con el acta aprobada; retención en garantía del 5 % en los contratos de obra hasta el acta de liquidación.',
    garantias: 'Contratos de obra: cumplimiento (20 % del valor, por el plazo del contrato y seis meses más), salarios y prestaciones sociales (5 %, plazo y tres años más), estabilidad y calidad de la obra (20 %, cinco años desde el recibo), buen manejo del anticipo (100 %, cuando lo haya) y responsabilidad civil extracontractual (mínimo COP 2.000 millones). Constructor: además, todo riesgo construcción por el valor de cada etapa y amparo de perjuicios patrimoniales por diez años (art. 8 de la Ley 1796 de 2016). Consultorías: cumplimiento (10 %) y calidad del servicio (10 %, dos años). Suministros: cumplimiento y calidad de los bienes.',
    estimacionesIndependientes: 'El estructurador financiero prepara una estimación independiente para cada adquisición mayor de COP 500 millones: costo paramétrico de la construcción (Construdata actualizado con el ICOCED), precios unitarios de referencia para los subcontratos y cotizaciones de mercado para consultorías y pólizas. Las ofertas que se alejan más de 10 % de la estimación se revisan antes de adjudicar.',
    supuestosRestricciones: 'Supuestos: hay oferta suficiente de constructores con experiencia en sistema industrializado en el Valle de Aburrá; los precios de concreto y acero se mantienen estables en cada etapa con compras por volumen. Restricciones: contratos de obra solo con licencia ejecutoriada, punto de equilibrio de la etapa y recursos en el patrimonio autónomo; la supervisión técnica es independiente del constructor y del diseñador (Ley 1796 de 2016); todo contratista pasa la verificación SAGRILAFT.',
    proveedoresPrecalificados: [
      EMP.con + ': construcción por administración delegada.',
      EMP.sup + ': supervisión técnica independiente.',
      EMP.int + ': interventoría del banco y la fiduciaria.',
      EMP.tie + ': movimiento de tierras.',
      EMP.pil + ': pilas y cimentación.',
      EMP.cto + ': concreto premezclado.',
      EMP.ace + ': acero de refuerzo.',
      EMP.eind + ': mano de obra de estructura con formaleta industrializada.',
      EMP.urb + ': urbanismo, vías y redes externas.',
      EMP.ins + ': instalaciones hidrosanitarias, de gas y eléctricas.',
      EMP.asc + ': ascensores.',
      EMP.ven + ': ventanería y fachadas.',
    ],
  };
  const planGestionAdquisiciones = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.abo, aprobo: R.jun },
    fields: pgadFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Emisión con la factibilidad (LB0): construcción contratada para iniciar el 16 de febrero de 2026.',
        fields: revFields(pgadFields, {
          cronogramaAdquisiciones: cronoAdqLb0,
          proveedoresPrecalificados: [
            'Tres constructores del Valle de Aburrá con experiencia en sistema industrializado (por invitar en septiembre de 2025).',
            'Dos firmas de supervisión técnica independiente sin vínculos con el constructor ni con el diseñador.',
            'Tres fiduciarias vigiladas por la Superintendencia Financiera con experiencia en preventas.',
            'Tres bancos con línea de crédito constructor para vivienda.',
          ],
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'LB1 (CC-002): fechas de los contratos de obra ajustadas al acta de inicio del 16 de marzo de 2026; constructor, supervisión técnica e interventoría contratados el 13 de marzo.' },
    ],
  };

  /* ------------------------------------------------------------ 12.1 Estrategia de las adquisiciones */
  const estrategiaAdquisiciones = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: {
      enfoque: 'El promotor gerencia el proyecto y contrata lo demás: consultorías de estructuración y diseño a precio fijo, comercialización por comisión, fiducia y crédito con entidades vigiladas por la Superintendencia Financiera, y la construcción con un constructor por administración delegada, que da al promotor control de costos, compras y calidad sin pagar el sobreprecio por riesgo de un contrato a precio global. La supervisión técnica independiente y la interventoría del banco se contratan por separado para preservar su independencia.',
      estrategias: rows('eadq', [
        { adquisicion: 'Estudios y diseños (arquitectura, geotecnia, estructura, redes, bioclimático y movilidad)', metodoEntrega: 'Diseño-licitación-construcción (DBB)', tipoContrato: FFP, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'El alcance lo definen la norma y el programa arquitectónico; un diseño completo permite contratar la obra con cantidades.' },
        { adquisicion: 'Revisión independiente de los diseños estructurales', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FFP, metodoSeleccion: 'Calificaciones únicamente', justificacion: 'Exigida por la Ley 1796 de 2016; se elige por idoneidad y ausencia de conflicto de interés.' },
        { adquisicion: 'Fiducia mercantil y encargo de preventas', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FPEPA, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Comisión mensual reajustada cada año por IPC; capacidad operativa para 416 compradores y SARLAFT.' },
        { adquisicion: 'Comercialización y sala de ventas', metodoEntrega: 'Servicio con subcontratación permitida', tipoContrato: FPIF, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Comisión fija del 1,5 % del valor de cada venta, pagada solo con recursos girados al patrimonio autónomo, como incentivo para llegar al punto de equilibrio.' },
        { adquisicion: 'Publicidad y mercadeo', metodoEntrega: 'Servicio con subcontratación permitida', tipoContrato: TM, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Tarifa mensual de la agencia más pauta reembolsable según el plan de medios aprobado.' },
        { adquisicion: 'Crédito constructor por etapa', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FPEPA, metodoSeleccion: 'Menor costo', justificacion: 'Tasa IBR a tres meses más un margen fijo; se elige el menor margen con desembolsos contra avance y subrogación a los compradores.' },
        { adquisicion: 'Construcción de las etapas 1 y 2', metodoEntrega: 'Diseño-licitación-construcción (DBB)', tipoContrato: CPFF, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Administración delegada: costos reembolsables con soporte más honorarios fijos del constructor (5 % del costo reembolsable estimado, que solo cambian con cambios de alcance aprobados); el promotor conserva el control de las compras y el ahorro. Se descartó el precio global porque los constructores incluyen entre 8 y 10 % de imprevistos por el riesgo de mano de obra y acero.' },
        { adquisicion: 'Supervisión técnica independiente', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FFP, metodoSeleccion: 'Basado en la calidad o el puntaje técnico', justificacion: 'Obligatoria por la Ley 1796 de 2016; se valora la experiencia en sistemas industrializados y la independencia.' },
        { adquisicion: 'Subcontratos de obra por especialidad (tierras, pilas, estructura, instalaciones, fachadas y urbanismo)', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FFP, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Precios unitarios fijos sobre cantidades medidas; el constructor invita al menos a tres oferentes por especialidad.' },
        { adquisicion: 'Concreto premezclado y acero de refuerzo', metodoEntrega: 'Suministro directo (orden de compra)', tipoContrato: FPEPA, metodoSeleccion: 'Menor costo', justificacion: 'Compra por volumen para las dos etapas con precio reajustable por índice (acero según el precio de la palanquilla; concreto según el ICOCED de insumos).' },
        { adquisicion: 'Formaleta industrializada, grúas torre y andamios', metodoEntrega: 'Suministro directo (orden de compra)', tipoContrato: TM, metodoSeleccion: 'Menor costo', justificacion: 'Alquiler por mes de uso con montaje, asesoría técnica y reposición de piezas.' },
        { adquisicion: 'Ascensores', metodoEntrega: 'Llave en mano', tipoContrato: FFP, metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Suministro, instalación, certificación y mantenimiento del primer año; se compara el costo del ciclo de vida.' },
        { adquisicion: 'Pólizas y seguros', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: FFP, metodoSeleccion: 'Menor costo', justificacion: 'Prima única por etapa con las coberturas mínimas que exigen el banco y la Ley 1796 de 2016.' },
      ]),
      fases: rows('eadq-f', [
        { fase: 'Precontractual', descripcion: 'Estudio de proveedores, estimación independiente, términos de referencia y enunciado del trabajo; invitación a por lo menos tres oferentes.', criteriosDesempeno: 'Tres ofertas válidas; estimación independiente lista antes de abrir las ofertas.', criteriosSalida: 'Evaluación aprobada y recomendación de adjudicación.' },
        { fase: 'Selección y contratación', descripcion: 'Evaluación con criterios ponderados, negociación, verificación SAGRILAFT, minuta y pólizas.', criteriosDesempeno: 'Contrato firmado en la fecha del cronograma de adquisiciones.', criteriosSalida: 'Contrato firmado, pólizas aprobadas y acta de inicio.' },
        { fase: 'Ejecución y control', descripcion: 'Actas mensuales, medición del desempeño del proveedor, control de cambios y pagos desde el patrimonio autónomo.', criteriosDesempeno: 'Métricas del proveedor en verde; actas aprobadas en 10 días.', criteriosSalida: 'Recibo a satisfacción de los entregables.' },
        { fase: 'Cierre', descripcion: 'Recibo final, liquidación, devolución de la retención en garantía y evaluación del proveedor.', criteriosDesempeno: 'Liquidación dentro de los cuatro meses siguientes a la terminación.', criteriosSalida: 'Acta de liquidación firmada y pólizas de estabilidad vigentes.' },
      ]),
      seguimiento: 'Cada contrato tiene un supervisor por rol (gerente de proyecto, estructurador financiero o director de obra) que registra su desempeño cada mes. Al cerrar la etapa 1 se documentan las lecciones aprendidas por proveedor para la selección de la etapa 2. Los diseñadores entregan al constructor y a la supervisión técnica los modelos, planos y memorias en un acta de entrega de diseños.',
    },
  };

  /* ------------------------------------------------------------ 12.1 Análisis de hacer o comprar */
  const decisionesHacerComprar = {
    status: 'aprobado', rev: '0', date: LB0,
    titleBlock: { elaboro: R.est, reviso: R.ger, aprobo: R.jun },
    fields: {
      analisis: rows('hoc', [
        { item: 'Construcción de las etapas 1 y 2', opcionHacer: 'Crear una constructora propia del promotor: director, residentes, compras y equipos propios durante cuatro años.', costoHacer: 96980 * M, opcionComprar: 'Constructor por administración delegada: costos reembolsables más honorarios fijos del 5 % sobre el costo estimado (COP 4.476 millones, incluidos en los directos).', costoComprar: 94080 * M, factores: 'El promotor no tiene equipo de obra; la administración delegada da control de costos sin estructura permanente (unos COP 2.900 millones). Un contrato a precio global costaría unos COP 7.500 millones más por imprevistos.', decision: 'Comprar' },
        { item: 'Comercialización y sala de ventas', opcionHacer: 'Fuerza de ventas propia: seis asesores, CRM y coordinación de la sala.', costoHacer: 2700 * M, opcionComprar: 'Comercializadora con comisión del 1,5 % de las ventas.', costoComprar: 2432 * M, factores: 'El gerente comercial sigue siendo del promotor (estrategia, precios y relación con la fiduciaria); la comercializadora pone la fuerza de ventas y el CRM y cobra solo por resultado.', decision: 'Mixto' },
        { item: 'Formaleta industrializada (dos juegos)', opcionHacer: 'Comprar dos juegos de formaleta de aluminio y revenderlos al terminar.', costoHacer: 2150 * M, opcionComprar: 'Alquilar dos juegos por 24 meses de uso entre las dos etapas.', costoComprar: 1800 * M, factores: 'Uso intermitente entre etapas; el alquiler incluye asesoría técnica y reposición de piezas; no hay mercado seguro de reventa.', decision: 'Alquilar' },
        { item: 'Grúas torre (dos)', opcionHacer: 'Comprar dos grúas usadas y operarlas con personal propio.', costoHacer: 1650 * M, opcionComprar: 'Alquiler con operador, montaje y desmontaje durante 18 meses.', costoComprar: 1368 * M, factores: 'El alquiler traslada al proveedor el mantenimiento, la certificación y el riesgo de varada.', decision: 'Alquilar' },
        { item: 'Concreto para las dos etapas (unos 15.000 m³)', opcionHacer: 'Planta dosificadora en obra con agregados comprados.', costoHacer: 6950 * M, opcionComprar: 'Concreto premezclado bombeado (NTC 3318).', costoComprar: 7275 * M, factores: 'La planta propia es más barata, pero ocupa terraza útil del lote, exige permisos ambientales y un control de calidad propio; el premezclado trae certificación y responsabilidad del proveedor.', decision: 'Comprar' },
        { item: 'Diseños técnicos (hidrosanitario, gas, eléctrico y telecomunicaciones)', opcionHacer: 'Departamento técnico del promotor.', costoHacer: 340 * M, opcionComprar: 'Firma de diseño especializada.', costoComprar: 280 * M, factores: 'La firma especializada conoce las normas de EPM, RETIE y RITEL y asume la responsabilidad del diseño.', decision: 'Comprar' },
        { item: 'Supervisión técnica independiente', opcionHacer: 'No permitido: la Ley 1796 de 2016 exige independencia del constructor y del diseñador.', opcionComprar: 'Firma de supervisión técnica independiente a precio fijo mensual.', costoComprar: 567 * M, factores: 'Requisito legal para edificaciones de más de 2.000 m² y para el certificado técnico de ocupación.', decision: 'Comprar' },
        { item: 'Andamios para fachadas', opcionHacer: 'Comprar andamio tubular y montarlo con personal propio.', costoHacer: 520 * M, opcionComprar: 'Alquiler de andamio multidireccional con montaje y certificación por persona competente.', costoComprar: 380 * M, factores: 'El alquiler incluye inspección y certificación de cada etapa de montaje (Resolución 4272 de 2021).', decision: 'Alquilar' },
      ]),
      criterios: 'Costo total para el proyecto (estructura, riesgo y valor residual), control de la calidad y del plazo, capacidad y experiencia del promotor, exigencias legales (independencia de la supervisión técnica; fiducia y crédito con entidades vigiladas por la Superintendencia Financiera), uso del espacio del lote y flexibilidad entre etapas.',
      conclusion: 'El promotor conserva la gerencia, la estrategia comercial y la estructuración financiera, y compra o alquila lo demás: construcción por administración delegada, fuerza de ventas por comisión, equipos mayores en alquiler y concreto premezclado. Así reduce su estructura fija y traslada los riesgos operativos a especialistas, con un costo directo igual al de la factibilidad (COP 94.080 millones).',
    },
  };

  /* ------------------------------------------------------------ 12.1 Enunciados del trabajo (SOW) */
  const enunciadoTrabajo = {
    instances: [
      {
        key: 'ej1', title: 'SOW-01 — Construcción por administración delegada de las etapas 1 y 2', status: 'aprobado', rev: '0', date: '2025-09-12',
        titleBlock: { elaboro: R.ger, reviso: R.arq, aprobo: R.jun },
        fields: {
          adquisicion: 'Construcción por administración delegada de la edificación (plataforma y bloques A a D), del urbanismo y de las cargas del plan parcial',
          paqueteEdt: '1.5 Construcción (1.5.1 a 1.5.4), 1.6.1 Entrega de viviendas y 1.6.4 Posventas',
          tipoContrato: CPFF,
          antecedentes: 'El proyecto tiene la licencia de urbanización y construcción radicada en legal y debida forma (4 de agosto de 2025) y diseños completos de la etapa 1. La factibilidad aprobada el 22 de abril de 2025 fija los costos directos en COP 94.080 millones y la estrategia de adquisiciones define la administración delegada para controlar costos y compras sin pagar los imprevistos de un precio global.',
          descripcionTrabajo: 'Construir, por cuenta del Fideicomiso Atalaya del Occidente (ficticio), las obras de las etapas 1 y 2 según la licencia, los planos y las especificaciones: preliminares, movimiento de tierras y contención, cimentación en pilas y zapatas, estructura de muros vaciados con formaleta industrializada, mampostería, instalaciones, cubiertas, fachadas, acabados, equipos especiales, urbanismo y cargas (vía colectora, vías locales, redes de EPM, parque, equipamiento y retiro de la quebrada), pruebas, certificaciones y entregas; administrar los subcontratos y las compras, con aprobación del gerente de proyecto para los de más de COP 500 millones; atender las posventas durante el año de garantía de los acabados.',
          entregables: rows('sow1-e', [
            { entregable: 'Programa de obra y presupuesto de la etapa 1', especificacion: 'Programa detallado coherente con la línea base y presupuesto por capítulos con cantidades.', cantidad: 1, unidad: 'documento', fecha: '2026-02-02' },
            { entregable: 'Plan de calidad, plan SST y plan de manejo ambiental', especificacion: 'Conformes con el plan de calidad del proyecto, el Decreto 1072 de 2015 y la Resolución 1257 de 2021.', cantidad: 1, unidad: 'documento', fecha: '2026-02-02' },
            { entregable: 'Etapa 1 terminada (bloques A y B, 50 % de la plataforma y urbanismo de la fase 1)', especificacion: '208 viviendas con certificado técnico de ocupación, redes recibidas por EPM y zonas comunes dotadas.', cantidad: 208, unidad: 'viviendas', fecha: '2027-06-30' },
            { entregable: 'Etapa 2 terminada (bloques C y D, 50 % de la plataforma y urbanismo de la fase 2)', especificacion: '208 viviendas con certificado técnico de ocupación y cesiones listas para entregar al Distrito.', cantidad: 208, unidad: 'viviendas', fecha: '2028-07-14' },
            { entregable: 'Equipamiento público y parque de cesión', especificacion: 'Obras terminadas y recibidas por el Distrito.', cantidad: 1, unidad: 'global', fecha: '2028-05-26' },
            { entregable: 'Actas mensuales de avance y de costos', especificacion: 'Cantidades ejecutadas y costos soportados, certificados por la interventoría.', cantidad: 30, unidad: 'actas', fecha: '2028-07-14' },
            { entregable: 'Manuales de uso y mantenimiento y planos récord', especificacion: 'Por etapa, para compradores y copropiedad (Ley 1480 de 2011 y Ley 675 de 2001).', cantidad: 2, unidad: 'manuales', fecha: '2028-09-29' },
          ]),
          exclusiones: [
            'Diseños arquitectónicos y técnicos (los entrega el promotor).',
            'Comercialización, escrituración y trámites ante la fiduciaria y el banco.',
            'Supervisión técnica independiente e interventoría (contratos separados).',
            'Licencias y expensas de curaduría.',
          ],
          especificaciones: 'Planos y especificaciones de la licencia y de los diseños de detalle; NSR-10; NTC 1500; RETIE, RETILAP y RITEL; normas de EPM; Resolución 0194 de 2025 de MinVivienda (ahorro de agua y energía en las VIS); especificaciones de acabados del apartamento modelo de cada tipo (A, B y C).',
          calidad: 'Plan de inspección y ensayos con métricas de resistencia del concreto, asentamiento, plomo, recubrimiento, integridad de pilas y pruebas hidrostáticas; liberación de cada piso por la supervisión técnica independiente; entrega de cada vivienda con no más de tres pendientes menores.',
          sst: 'SG-SST (Decreto 1072 de 2015 y Resolución 0312 de 2019), programa de trabajo en alturas (Resolución 4272 de 2021), plan de manejo de tránsito aprobado por la Secretaría de Movilidad, gestión de residuos de construcción y demolición (Resolución 1257 de 2021) y cumplimiento de los permisos del Área Metropolitana del Valle de Aburrá.',
          lugar: 'Lote del proyecto, borde urbano occidental de Medellín (zona 4)',
          periodoInicio: '2026-02-16',
          periodoFin: '2028-09-29',
          horario: 'Lunes a viernes de 7:00 a. m. a 5:00 p. m. y sábados de 7:00 a. m. a 1:00 p. m.',
          formaPago: 'Reembolso mensual de los costos directos soportados (facturas, nómina y subcontratos) contra acta de avance aprobada por la interventoría, desde el patrimonio autónomo y a 30 días; honorarios fijos del constructor (5 % del costo reembolsable estimado, COP 4.476 millones con los directos de la factibilidad) pagados cada mes en proporción al avance certificado y ajustados solo por cambios de alcance aprobados; retención en garantía del 5 % de los honorarios hasta la liquidación.',
          polizas: [
            'Cumplimiento (20 % de los honorarios y la administración, por el plazo y seis meses más).',
            'Salarios y prestaciones sociales (5 %, por el plazo y tres años más).',
            'Estabilidad y calidad de la obra (20 %, cinco años desde el recibo).',
            'Responsabilidad civil extracontractual (COP 3.000 millones).',
            'Amparo de perjuicios patrimoniales por diez años (art. 8 de la Ley 1796 de 2016).',
          ],
          supervision: R.ger,
          documentosRequeridos: [
            'Certificado de existencia y representación legal y estados financieros de los dos últimos años.',
            'Experiencia en al menos 50.000 m² de vivienda multifamiliar con sistema industrializado en los últimos cinco años.',
            'Hojas de vida del director de obra y de los residentes con matrícula profesional vigente (COPNIA).',
            'SG-SST con calificación aceptable de estándares mínimos (Resolución 0312 de 2019).',
            'Formulario SAGRILAFT y verificación en listas restrictivas.',
          ],
        },
      },
      {
        key: 'ej2', title: 'SOW-02 — Supervisión técnica independiente de las etapas 1 y 2', status: 'aprobado', rev: '0', date: '2025-09-26',
        titleBlock: { elaboro: R.ies, reviso: R.abo, aprobo: R.ger },
        fields: {
          adquisicion: 'Supervisión técnica independiente de la construcción (Ley 1796 de 2016 y NSR-10, Título I)',
          paqueteEdt: '1.5.4 (S02 y S05)',
          tipoContrato: FFP,
          antecedentes: 'La edificación tiene 39.385 m² construidos, más de los 2.000 m² a partir de los cuales la Ley 1796 de 2016 exige supervisión técnica independiente del constructor y del diseñador, y el certificado técnico de ocupación para ocupar y escriturar.',
          descripcionTrabajo: 'Verificar durante la construcción que la estructura y los elementos no estructurales cumplan los planos, memorias y especificaciones aprobados en la licencia y la NSR-10: revisión de planos de taller, control de materiales y ensayos, visitas semanales, liberación de cada piso antes del vaciado, informes mensuales, informe final y expedición del certificado técnico de ocupación de cada etapa.',
          entregables: rows('sow2-e', [
            { entregable: 'Plan de supervisión', especificacion: 'Alcance, frecuencia de visitas y puntos de control según el Título I de la NSR-10.', cantidad: 1, unidad: 'documento', fecha: '2026-02-13' },
            { entregable: 'Liberaciones de piso de los bloques A a D', especificacion: 'Anotación en la bitácora por piso y bloque, con verificación de refuerzo y recubrimiento.', cantidad: 32, unidad: 'pisos', fecha: '2027-10-29' },
            { entregable: 'Informes mensuales de supervisión', especificacion: 'Estado de la obra, ensayos revisados y no conformidades.', cantidad: 30, unidad: 'informes', fecha: '2028-07-14' },
            { entregable: 'Certificado técnico de ocupación de la etapa 1', especificacion: 'Conforme a la Ley 1796 de 2016 y al Decreto 1203 de 2017.', cantidad: 1, unidad: 'certificado', fecha: '2027-06-30' },
            { entregable: 'Certificado técnico de ocupación de la etapa 2', especificacion: 'Conforme a la Ley 1796 de 2016 y al Decreto 1203 de 2017.', cantidad: 1, unidad: 'certificado', fecha: '2028-07-14' },
          ]),
          exclusiones: [
            'Ensayos de laboratorio (los paga el proyecto por medio del constructor; el supervisor los verifica).',
            'Interventoría administrativa y financiera.',
            'Diseño o rediseño estructural.',
          ],
          especificaciones: 'NSR-10, Títulos I y C; Ley 1796 de 2016 y Decreto 1203 de 2017; planos y memorias aprobados en la licencia.',
          calidad: 'Visitas al menos semanales y antes de cada vaciado de muros y losas; respuesta a las no conformidades en 48 horas; certificado técnico de ocupación en el formato reglamentario.',
          sst: 'Cumplir el reglamento SST de la obra, con inducción, elementos de protección personal y certificado de trabajo en alturas vigente.',
          lugar: 'Obra del proyecto en Medellín',
          periodoInicio: '2026-02-16',
          periodoFin: '2028-07-14',
          horario: 'Visitas programadas en el horario de obra y extraordinarias por vaciado',
          formaPago: 'Precio fijo mensual durante la construcción de cada etapa contra informe mensual aprobado; el 10 % se paga con la expedición del certificado técnico de ocupación de cada etapa.',
          polizas: [
            'Cumplimiento (10 %, por el plazo y seis meses más).',
            'Responsabilidad civil profesional (COP 1.000 millones).',
            'Salarios y prestaciones sociales (5 %).',
          ],
          supervision: R.ger,
          documentosRequeridos: [
            'Matrícula profesional y certificaciones de experiencia exigidas por la Ley 400 de 1997, modificada por la Ley 1796 de 2016.',
            'Declaración de independencia frente al constructor, el diseñador estructural y el revisor independiente.',
            'Hojas de vida del equipo de supervisión.',
          ],
        },
      },
      {
        key: 'ej3', title: 'SOW-03 — Mano de obra de estructura con formaleta industrializada (etapa 1)', status: 'aprobado', rev: '0', date: '2026-04-01',
        titleBlock: { elaboro: R.con, reviso: R.ies, aprobo: R.ger },
        fields: {
          adquisicion: 'Mano de obra para formaleta, refuerzo y vaciado de la plataforma y de los bloques A y B',
          paqueteEdt: '1.5.1.2 (K06, K07 y K09)',
          tipoContrato: FFP,
          antecedentes: 'El constructor ejecuta la estructura con formaleta industrializada de aluminio alquilada; la mano de obra especializada se subcontrata a destajo por m² de losa terminada y el proyecto suministra el concreto, el acero y la formaleta.',
          descripcionTrabajo: 'Montaje y desmontaje de la formaleta de muros y losas, armado e instalación del acero de refuerzo y de la malla, colocación de los embebidos con los instaladores, vaciado, vibrado y curado del concreto, y limpieza y mantenimiento diario de la formaleta, con dos cuadrillas (una por bloque) a un ritmo de un piso cada 8,5 días hábiles por bloque.',
          entregables: rows('sow3-e', [
            { entregable: 'Estructura de la plataforma de la etapa 1', especificacion: 'Losas y muros de contención liberados por la supervisión técnica.', cantidad: 4300, unidad: 'm²', fecha: '2026-09-04' },
            { entregable: 'Estructura del bloque A', especificacion: 'Ocho pisos de muros vaciados y losa, liberados piso a piso.', cantidad: 8, unidad: 'pisos', fecha: '2026-10-02' },
            { entregable: 'Estructura del bloque B', especificacion: 'Ocho pisos de muros vaciados y losa, liberados piso a piso.', cantidad: 8, unidad: 'pisos', fecha: '2026-11-13' },
          ]),
          exclusiones: [
            'Suministro de concreto, acero y formaleta (los pone el proyecto).',
            'Grúa torre y su operador.',
            'Instalaciones embebidas (las coloca el subcontratista de instalaciones).',
          ],
          especificaciones: 'Planos estructurales aprobados, manual del sistema de formaleta del proveedor y NSR-10, Título C (recubrimientos, juntas y curado).',
          calidad: 'Plomo de muros de máximo 6 mm por piso; recubrimientos según los planos; ninguna no conformidad abierta para liberar un piso; los defectos atribuibles a la mano de obra (hormigueros, desplomes) se reparan a costo del subcontratista.',
          sst: 'Trabajo en alturas con certificado vigente, líneas de vida y barandas perimetrales en cada losa (Resolución 4272 de 2021); todo el personal afiliado a la seguridad social.',
          lugar: 'Plataforma y bloques A y B de la etapa 1',
          periodoInicio: '2026-06-16',
          periodoFin: '2026-11-13',
          horario: 'Lunes a sábado en el horario de obra; turnos extendidos solo con autorización del director de obra.',
          formaPago: 'Destajo por m² de losa terminada y liberada, pagado cada quince días con corte de obra; retención en garantía del 5 % hasta la liquidación.',
          polizas: [
            'Cumplimiento (10 %).',
            'Salarios y prestaciones sociales (10 %, por el plazo y tres años más).',
            'Responsabilidad civil extracontractual (COP 500 millones).',
          ],
          supervision: R.con,
          documentosRequeridos: [
            'Planilla PILA del personal cada mes.',
            'Certificados de trabajo en alturas vigentes.',
            'Experiencia en estructuras con formaleta industrializada.',
            'Formulario SAGRILAFT.',
          ],
        },
      },
    ],
  };

  /* ------------------------------------------------------------ 12.1 Criterios de selección (constructor) */
  const criteriosSeleccionProveedores = {
    status: 'aprobado', rev: '0', date: '2025-11-28',
    titleBlock: { elaboro: R.ger, reviso: R.est, aprobo: R.jun },
    fields: {
      adquisicion: 'Construcción por administración delegada de las etapas 1 y 2 (SOW-01)',
      metodoSeleccion: 'Basado en calidad y costo',
      requisitosHabilitantes: [
        'Experiencia en al menos 50.000 m² de vivienda multifamiliar con sistema industrializado en los últimos cinco años.',
        'Patrimonio líquido mínimo de COP 15.000 millones y capacidad residual de contratación suficiente.',
        'SG-SST con calificación aceptable de estándares mínimos (Resolución 0312 de 2019).',
        'Director de obra con diez años de experiencia y matrícula profesional vigente.',
        'Verificación SAGRILAFT y en listas restrictivas sin hallazgos.',
      ],
      proveedorA: EMP.con,
      proveedorB: 'Edificaciones del Valle de Aburrá S.A.S. (ficticia)',
      proveedorC: 'Constructora Monteverde Ingeniería S.A.S. (ficticia)',
      criterios: rows('csp', [
        { criterio: 'Honorarios y costos de administración', descripcion: 'Valor de la administración y de los honorarios frente a la menor oferta (los costos directos son reembolsables).', peso: 35, puntajeA: 92, puntajeB: 100, puntajeC: 85 },
        { criterio: 'Experiencia en sistema industrializado', descripcion: 'm² construidos con formaleta industrializada y rendimiento demostrado por piso.', peso: 20, puntajeA: 95, puntajeB: 80, puntajeC: 85 },
        { criterio: 'Equipo propuesto', descripcion: 'Director de obra, residentes, coordinador SST e inspector de calidad.', peso: 15, puntajeA: 90, puntajeB: 75, puntajeC: 85 },
        { criterio: 'Plan de calidad y SST', descripcion: 'Calificación del SG-SST, accidentalidad y plan de inspección y ensayos.', peso: 15, puntajeA: 90, puntajeB: 80, puntajeC: 85 },
        { criterio: 'Programa y metodología', descripcion: 'Coherencia del programa con la línea base y estrategia para trabajar en ladera y en lluvias.', peso: 10, puntajeA: 85, puntajeB: 75, puntajeC: 80 },
        { criterio: 'Capacidad financiera', descripcion: 'Liquidez para pagar la nómina mientras llegan los reembolsos.', peso: 5, puntajeA: 85, puntajeB: 90, puntajeC: 80 },
      ]),
      resultado: EMP.con + ' obtiene 90,95 puntos, frente a 86,25 y 84,25 de los otros dos oferentes: sus honorarios (5 % del costo reembolsable estimado) son casi 9 % más caros que los de la menor oferta (4,6 %), pero lo compensa con experiencia en sistema industrializado en ladera y un mejor equipo. Se adjudica con carta de intención del 28 de noviembre de 2025; el contrato se firmará cuando la etapa 1 cumpla el punto de equilibrio y el crédito constructor esté aprobado. Por ser una empresa vinculada al promotor, la junta verificó que su oferta cumpliera las mismas condiciones que las demás.',
      seleccionado: EMP.con,
    },
  };

  /* ------------------------------------------------------------ 12.2 Registro de contratos y acuerdos (al 30 de septiembre de 2026) */
  const AP = 'Aprobada', NA = 'No aplica', PE = 'Pendiente';
  const ct = (numero, proveedor, objeto, paqueteEdt, tipoContrato, valor, fechaInicio, fechaFin, supervisor, pol, estado, observaciones) =>
    ({ id: numero, numero, proveedor, objeto, paqueteEdt, tipoContrato, valor, fechaInicio, fechaFin, supervisor, polizaCumplimiento: pol[0], polizaCalidad: pol[1], polizaRce: pol[2], estado, observaciones });
  const registroAdquisiciones = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.abo, reviso: R.ger },
    fields: {
      contratos: [
        ct('CT-001', EMP.tit, 'Estudio de títulos, avalúo comercial y levantamiento topográfico del lote', '1.2.1', FFP, 120 * M, '2025-01-14', '2025-02-21', R.abo, [AP, AP, NA], 'Liquidado', 'Liquidado en marzo de 2025.'),
        ct('CT-002', EMP.mer, 'Estudio de mercado del occidente de Medellín', '1.2.2', FFP, 100 * M, '2025-01-20', '2025-03-07', R.com, [AP, AP, NA], 'Liquidado', ''),
        ct('CT-003', EMP.fac, 'Factibilidad técnica, legal y financiera', '1.2.2', FFP, 200 * M, '2025-02-03', '2025-04-11', R.est, [AP, AP, NA], 'Liquidado', ''),
        ct('CT-004', EMP.arq, 'Diseño arquitectónico, coordinación de diseños y diseños de detalle', '1.3.1 y 1.3.6', FFP, 1133 * M, '2025-03-03', '2027-01-29', R.ger, [AP, AP, NA], 'En ejecución', 'Precio fijo por fases; diseños de detalle de la etapa 2 al 51 %, con prórroga al 29 de enero de 2027.'),
        ct('CT-005', EMP.geo, 'Estudio geotécnico y de estabilidad de taludes', '1.3.2', FFP, 110 * M, '2025-04-01', '2025-05-09', R.ger, [AP, AP, NA], 'Liquidado', 'El geotecnista asesoró el diseño de la pantalla del CC-003 por fuera de este contrato.'),
        ct('CT-006', EMP.est, 'Diseño estructural NSR-10', '1.3.2', FFP, 400 * M, '2025-05-12', '2025-07-25', R.ger, [AP, AP, NA], 'Liquidado', 'Atiende consultas de obra con la póliza de calidad vigente.'),
        ct('CT-007', EMP.rev, 'Revisión independiente de los diseños estructurales (Ley 1796 de 2016)', '1.3.2', FFP, 85 * M, '2025-07-14', '2025-08-01', R.ger, [AP, AP, NA], 'Liquidado', ''),
        ct('CT-008', EMP.red, 'Diseños hidrosanitario, de gas, de red contra incendio, eléctrico y de telecomunicaciones', '1.3.3', FFP, 280 * M, '2025-04-21', '2025-08-29', R.arq, [AP, AP, NA], 'Liquidado', 'Ajuste del diseño de acueducto pedido por EPM (INC-002) atendido sin costo.'),
        ct('CT-009', EMP.bio, 'Diseño bioclimático y paisajístico', '1.3.3', FFP, 70 * M, '2025-05-05', '2025-08-15', R.arq, [AP, AP, NA], 'Liquidado', ''),
        ct('CT-010', EMP.mov, 'Estudio de movilidad y trámite ante la Secretaría de Movilidad', '1.3.4', FFP, 80 * M, '2025-05-05', '2025-10-03', R.arq, [AP, AP, NA], 'Liquidado', ''),
        ct('CT-011', EMP.fid, 'Fiducia mercantil inmobiliaria y encargo fiduciario de preventas', '1.2.4', FPEPA, 567 * M, '2025-04-30', '2029-03-16', R.est, [NA, NA, NA], 'En ejecución', 'Comisión mensual reajustada por IPC; entidad vigilada por la Superintendencia Financiera. Liquidación pronosticada para el 19 de junio de 2029.'),
        ct('CT-012', EMP.com, 'Comercialización y sala de ventas', '1.4.3 a 1.4.5', FPIF, 2432 * M, '2025-05-19', '2028-12-15', R.com, [AP, NA, AP], 'En ejecución', 'Comisión del 1,5 % de las ventas, pagada con recursos girados al patrimonio autónomo.'),
        ct('CT-013', EMP.pub, 'Publicidad y mercadeo', '1.4.2', TM, 1459 * M, '2025-05-19', '2028-06-30', R.com, [AP, NA, NA], 'En ejecución', 'Tarifa mensual más pauta según el plan de medios aprobado.'),
        ct('CT-014', EMP.ban, 'Crédito constructor de la etapa 1 (COP 30.000 millones)', '1.2.4', FPEPA, 30000 * M, '2026-02-13', '2027-12-24', R.est, [NA, NA, NA], 'En ejecución', 'IBR 3M + 4,5 puntos (16,5 % N.T.V. en septiembre de 2026); cuatro desembolsos y saldo de COP 12.400 millones al corte.'),
        ct('CT-015', EMP.con, 'Construcción por administración delegada de las etapas 1 y 2', '1.5', CPFF, 94510 * M, '2026-03-13', '2028-09-29', R.ger, [AP, AP, AP], 'En ejecución', 'Valor estimado = directos de la LB1: costos reembolsables de COP 90.014 millones más honorarios fijos de COP 4.496 millones (5 %). Con el CC-003 (COP 571 millones de costo y COP 29 millones de honorarios) el valor vigente es de COP 95.110 millones. Los subcontratos y compras CT-019 a CT-025 se celebran dentro de este contrato y hacen parte del costo reembolsable.'),
        ct('CT-016', EMP.sup, 'Supervisión técnica independiente de las etapas 1 y 2', '1.5.4', FFP, 567 * M, '2026-03-13', '2028-07-14', R.ger, [AP, AP, NA], 'En ejecución', 'Precio fijo mensual; 10 % con cada certificado técnico de ocupación.'),
        ct('CT-017', EMP.int, 'Interventoría técnica, administrativa y financiera del banco y la fiduciaria', '1.5.4', FFP, 473 * M, '2026-03-13', '2028-09-29', R.est, [AP, AP, NA], 'En ejecución', 'Designada por el banco; certifica las actas de avance para giros y desembolsos.'),
        ct('CT-018', EMP.seg, 'Pólizas de la etapa 1: todo riesgo construcción, RCE, cumplimiento y amparo patrimonial', '1.5.4', FFP, 283 * M, '2026-03-09', '2027-10-28', R.est, [NA, NA, NA], 'En ejecución', 'Prima única; amparo de perjuicios patrimoniales por diez años desde el certificado técnico de ocupación.'),
        ct('CT-019', EMP.tie, 'Movimiento de tierras y contención de la etapa 1', '1.5.1.1', FFP, 2723 * M, '2026-03-27', '2026-07-17', R.con, [AP, AP, AP], 'Terminado', 'Precios unitarios; terminado el 17 de julio, tres semanas tarde; liquidación en revisión con mayores cantidades de 8 %.'),
        ct('CT-020', EMP.anc, 'Contención adicional del talud oriental: pantalla anclada y drenajes (CC-003)', '1.5.1.1', FFP, 571 * M, '2026-05-19', '2026-07-11', R.con, [AP, AP, AP], 'Terminado', 'Precio global de COP 571 millones; con los honorarios del constructor (COP 29 millones) suma los COP 600 millones del CC-003, con cargo a la reserva para contingencias.'),
        ct('CT-021', EMP.pil, 'Pilas pre-excavadas y cimentación de la etapa 1', '1.5.1.1', FFP, 3452 * M, '2026-04-28', '2026-08-21', R.con, [AP, AP, AP], 'Terminado', 'Precios unitarios; mayores profundidades de pila (+5 %) aprobadas por el ingeniero estructural.'),
        ct('CT-022', EMP.eind, 'Mano de obra de estructura con formaleta industrializada (plataforma y bloques A y B)', '1.5.1.2', FFP, 4758 * M, '2026-06-10', '2026-11-13', R.con, [PE, AP, AP], 'En ejecución', 'Destajo por m² (45 % del costo reembolsable de la estructura). Prórroga al 12 de diciembre en trámite: falta ampliar la vigencia de la póliza de cumplimiento.'),
        ct('CT-023', EMP.cto, 'Suministro de concreto premezclado de la etapa 1', '1.5.1.1 y 1.5.1.2', FPEPA, 3714 * M, '2026-04-28', '2026-12-12', R.con, [AP, AP, NA], 'En ejecución', 'Precio por m³ reajustable por el ICOCED de insumos.'),
        ct('CT-024', EMP.ace, 'Suministro de acero de refuerzo de la etapa 1', '1.5.1.1 y 1.5.1.2', FPEPA, 2476 * M, '2026-04-28', '2026-12-12', R.con, [AP, AP, NA], 'En ejecución', 'Precio por kg reajustable por el precio de la palanquilla.'),
        ct('CT-025', EMP.urb, 'Urbanismo, vía colectora y redes externas de la fase 1', '1.5.3.1 a 1.5.3.3', FFP, 5105 * M, '2026-04-28', '2027-03-24', R.con, [AP, AP, AP], 'En ejecución', 'Precios unitarios; incluye la restauración del retiro de la quebrada, terminada el 26 de septiembre.'),
      ],
      documentacion: 'Originales en el archivo del promotor y copias digitales en el repositorio del proyecto (carpeta 12-Adquisiciones): contratos, pólizas, actas de inicio, actas de avance, otrosíes y liquidaciones. La fiduciaria conserva copia de los contratos que paga el patrimonio autónomo.',
      clausulas: 'Multa del 0,1 % por día de atraso en los hitos contractuales (tope del 10 %); cláusula penal del 10 %; retención en garantía del 5 % hasta la liquidación; indemnidad frente a reclamaciones laborales y de terceros; cumplimiento SAGRILAFT y terminación por inclusión en listas restrictivas; prohibición de ceder sin autorización; solución de controversias en el ' + CAMARA + '. En la administración delegada: auditoría de costos por la interventoría y propiedad del fideicomiso sobre los materiales y equipos comprados.',
    },
  };

  /* ------------------------------------------------------------ 12.3 Seguimiento de contratos y desempeño de proveedores */
  const controlAdquisiciones = {
    status: 'revision', rev: 'A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.est },
    fields: {
      seguimiento: rows('cadq', [
        { contrato: 'CT-004 Diseños', fechaCorte: CUT, avance: 93, valorEjecutado: 1053130000, valorPagado: 1000000000, retencion: 0, plazo: 3, calidad: 4, sst: 5, observaciones: EMP.arq + '. Diseños de detalle de la etapa 2 al 51 % con seis semanas de atraso.' },
        { contrato: 'CT-011 Fiducia', fechaCorte: CUT, avance: 35, valorEjecutado: 198450000, valorPagado: 198450000, retencion: 0, plazo: 4, calidad: 5, sst: 5, observaciones: EMP.fid + '. Conciliación mensual al día; punto de equilibrio de la etapa 1 certificado el 27 de febrero.' },
        { contrato: 'CT-012 Comercialización', fechaCorte: CUT, avance: 66, valorEjecutado: 1599300000, valorPagado: 1520000000, retencion: 0, plazo: 3, calidad: 4, sst: 5, observaciones: EMP.com + '. Etapa 1 con 196 de 208 viviendas; etapa 2 con 78 de 208, a 11 ventas al mes frente a 14 planeadas.' },
        { contrato: 'CT-013 Publicidad', fechaCorte: CUT, avance: 44, valorEjecutado: 680478000, valorPagado: 640000000, retencion: 0, plazo: 4, calidad: 4, sst: 5, observaciones: EMP.pub + '. Costo 6 % sobre el valor ganado por la pauta adicional de la etapa 2.' },
        { contrato: 'CT-015 Constructor', fechaCorte: CUT, avance: 20, valorEjecutado: 20169751000, valorPagado: 18900000000, retencion: 65740000, plazo: 2, calidad: 4, sst: 4, observaciones: EMP.con + '. Directos de la etapa 1 con SPI de 0,914 y CPI de 0,921; plan de recuperación de la estructura pedido para el 6 de octubre.' },
        { contrato: 'CT-016 Supervisión técnica', fechaCorte: CUT, avance: 20, valorEjecutado: 113200000, valorPagado: 113200000, retencion: 0, plazo: 5, calidad: 5, sst: 5, observaciones: EMP.sup + '. Liberaciones de piso oportunas; exigió núcleos en el INC-005.' },
        { contrato: 'CT-017 Interventoría', fechaCorte: CUT, avance: 21, valorEjecutado: 99330000, valorPagado: 99330000, retencion: 0, plazo: 4, calidad: 4, sst: 5, observaciones: EMP.int + '. Actas certificadas en un promedio de seis días.' },
        { contrato: 'CT-019 Movimiento de tierras', fechaCorte: CUT, avance: 100, valorEjecutado: 2940840000, valorPagado: 2793798000, retencion: 147042000, plazo: 2, calidad: 3, sst: 4, observaciones: EMP.tie + '. Terminado tres semanas tarde; mayores cantidades de 8 % por el deslizamiento y las lluvias.' },
        { contrato: 'CT-020 Pantalla anclada', fechaCorte: CUT, avance: 100, valorEjecutado: 571000000, valorPagado: 542450000, retencion: 28550000, plazo: 5, calidad: 5, sst: 4, observaciones: EMP.anc + '. Terminada el 11 de julio dentro del valor del CC-003.' },
        { contrato: 'CT-021 Pilas y cimentación', fechaCorte: CUT, avance: 100, valorEjecutado: 3624600000, valorPagado: 3443370000, retencion: 181230000, plazo: 3, calidad: 4, sst: 4, observaciones: EMP.pil + '. Pilas sin anomalías; cimentación terminada el 21 de agosto, dos semanas tarde.' },
        { contrato: 'CT-022 Estructura', fechaCorte: CUT, avance: 64, valorEjecutado: 3209949000, valorPagado: 2905000000, retencion: 160497450, plazo: 2, calidad: 3, sst: 4, observaciones: EMP.eind + '. 11 días por piso en julio y agosto y 10 en septiembre, frente a 8,5 planeados (INC-006).' },
        { contrato: 'CT-023 Concreto', fechaCorte: CUT, avance: 73, valorEjecutado: 2714000000, valorPagado: 2475000000, retencion: 0, plazo: 3, calidad: 4, sst: 4, observaciones: EMP.cto + '. Siete días de espera de concreto entre junio y agosto; planta de respaldo desde agosto.' },
        { contrato: 'CT-024 Acero', fechaCorte: CUT, avance: 75, valorEjecutado: 1857000000, valorPagado: 1733000000, retencion: 0, plazo: 3, calidad: 5, sst: 4, observaciones: EMP.ace + '. Tres días de espera de acero en junio; ensayos de tracción conformes.' },
        { contrato: 'CT-025 Urbanismo fase 1', fechaCorte: CUT, avance: 46, valorEjecutado: 2433842000, valorPagado: 2190000000, retencion: 121692100, plazo: 3, calidad: 4, sst: 3, observaciones: EMP.urb + '. Vía colectora al 42 % y redes al 47 %; retiro de la quebrada terminado.' },
      ]),
      reclamaciones: rows('cadq-r', [
        { contrato: 'CT-019', descripcion: 'Reclamación por mayor permanencia de equipos y personal durante la suspensión del frente oriental (7 al 19 de mayo de 2026), por COP 96 millones.', fecha: '2026-06-05', estado: 'En negociación', solucion: 'La interventoría reconoce 6 de los 12 días; propuesta de pago de COP 48 millones en el acta de liquidación.' },
        { contrato: 'CT-022', descripcion: 'Solicitud de reajuste del destajo en 9 % por el alza del salario mínimo de 2026 y la escasez de oficiales.', fecha: '2026-07-22', estado: 'Resuelta', solucion: 'Se pactó una bonificación por rendimiento por piso (máximo 4 % del destajo) en lugar del reajuste, vigente desde el 1 de agosto (INC-006).' },
        { contrato: 'CT-023', descripcion: 'Reclamo del proyecto por demoras en el despacho de concreto (siete días de espera entre junio y agosto).', fecha: '2026-08-20', estado: 'Resuelta', solucion: 'El proveedor asignó una planta de respaldo y despacho prioritario a primera hora; multa contractual de COP 12 millones descontada en el acta de agosto.' },
        { contrato: 'CT-012', descripcion: 'La comercializadora pide anticipar el 50 % de la comisión de las ventas de la etapa 2 antes del punto de equilibrio.', fecha: '2026-09-10', estado: 'Abierta', solucion: 'El contrato solo paga comisiones con recursos girados al patrimonio autónomo; el gerente comercial propone pagar el 25 % al llegar a 125 viviendas vinculadas.' },
        { contrato: 'CT-025', descripcion: 'EPM rechazó un tramo de alcantarillado por pendiente fuera de diseño; el contratista pide el pago de la reconstrucción.', fecha: '2026-09-14', estado: 'Abierta', solucion: 'El residente de urbanismo y el diseñador revisan si fue un error de replanteo (a cargo del contratista) o del diseño.' },
      ]),
      cierre: 'Para liquidar cada contrato: recibo a satisfacción de los entregables, balance de cantidades y valor final, paz y salvo de salarios y aportes (PILA), pólizas de estabilidad y calidad vigentes por el plazo exigido, devolución de la retención en garantía, cruce de cuentas con la fiduciaria, evaluación final del proveedor y acta de liquidación firmada por el supervisor y el abogado del proyecto. Liquidados: CT-001 a CT-003 y CT-005 a CT-010. Por liquidar: CT-019, CT-020 y CT-021 (terminados).',
    },
  };

  /* ================================================================== 13. INTERESADOS */

  /* ------------------------------------------------------------ 13.1 Registro de interesados (corte del 30 de septiembre de 2026) */
  const INTERESADOS = rows('rint', [
    { nombre: R.jun, cargo: 'Órgano de gobierno del promotor (patrocinador)', organizacion: EMP.pro, rol: 'Patrocinador', contacto: 'Secretaría de la junta; sesión ordinaria el segundo martes de cada mes', requisitos: 'Utilidad antes de impuestos de al menos 12 % de las ventas y retorno del aporte de COP 24.000 millones.', expectativas: 'Información temprana de desviaciones y alternativas con su efecto en la utilidad.', poder: 5, interes: 5, influencia: 5, clasificacion: 'Interno', actitud: 'Partidario', nivelActual: 'Líder', nivelDeseado: 'Líder' },
    { nombre: R.ger, cargo: 'Gerente de proyecto', organizacion: EMP.pro, rol: 'Director del proyecto', contacto: 'Oficina del promotor y comité de gerencia (primer martes)', requisitos: 'Cumplir el alcance, el plazo y el costo de la línea base.', expectativas: 'Decisiones oportunas de la junta y apoyo de las áreas del promotor.', poder: 4, interes: 5, influencia: 4, clasificacion: 'Interno', actitud: 'Partidario', nivelActual: 'Líder', nivelDeseado: 'Líder' },
    { nombre: R.fid, cargo: 'Gerencia de negocios inmobiliarios', organizacion: EMP.fid, rol: 'Administra el encargo de preventas y el patrimonio autónomo', contacto: 'Oficial de negocio asignado; comité fiduciario mensual', requisitos: 'Condiciones de giro verificables, presupuesto validado y SARLAFT de los compradores al día.', expectativas: 'Soportes completos y conciliación mensual sin diferencias.', poder: 4, interes: 3, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Banco del crédito constructor', cargo: 'Banca constructor', organizacion: EMP.ban, rol: 'Financiador', contacto: 'Gerente de cuenta de banca constructor; acta de avance el día 10', requisitos: 'Avance verificado por la interventoría, preventas y garantías.', expectativas: 'Escrituración rápida y subrogación de los créditos a sus clientes hipotecarios.', poder: 5, interes: 4, influencia: 5, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Constructor y subcontratistas', cargo: 'Director de obra y gerencia técnica del constructor', organizacion: EMP.con, rol: 'Ejecutor de la obra (administración delegada)', contacto: 'Comité de obra los lunes; bitácora de obra', requisitos: 'Flujo de pagos oportuno y diseños completos antes de cada frente.', expectativas: 'Continuidad entre las etapas 1 y 2 sin pausas de las cuadrillas.', poder: 3, interes: 5, influencia: 3, clasificacion: 'Interno', actitud: 'Partidario', nivelActual: 'Partidario', nivelDeseado: 'Líder' },
    { nombre: 'Diseñadores y revisor independiente', cargo: 'Directores de diseño', organizacion: 'Varios (ficticios)', rol: 'Diseño y revisión de los diseños', contacto: 'Comité de coordinación de diseños (quincenal)', requisitos: 'Pago de honorarios y respuestas oportunas a sus consultas.', expectativas: 'Pocas modificaciones tardías del programa arquitectónico.', poder: 2, interes: 3, influencia: 3, clasificacion: 'Externo', actitud: 'Partidario', nivelActual: 'Partidario', nivelDeseado: 'Partidario' },
    { nombre: R.sti, cargo: 'Ingeniero supervisor', organizacion: EMP.sup, rol: 'Supervisión técnica (Ley 1796 de 2016)', contacto: 'Visitas semanales; bitácora de obra', requisitos: 'Cumplimiento de la NSR-10 y de los planos aprobados.', expectativas: 'Aviso de vaciados con 48 horas y atención de observaciones.', poder: 4, interes: 3, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Curaduría urbana de Medellín', cargo: 'Curador urbano', organizacion: 'Curaduría urbana (autoridad)', rol: 'Expide la licencia y sus modificaciones', contacto: 'Ventanilla de radicación; reuniones técnicas con cita previa', requisitos: 'Solicitudes completas y conformes con la norma (Decreto 1077 de 2015).', expectativas: 'Respuesta oportuna al acta de observaciones.', poder: 5, interes: 2, influencia: 5, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Neutral' },
    { nombre: 'Departamento Administrativo de Planeación (DAP)', cargo: 'Subdirección de planeación territorial', organizacion: 'Distrito de Medellín', rol: 'Plan parcial, unidad de actuación y reparto de cargas', contacto: 'Oficio radicado; mesas técnicas del plan parcial', requisitos: 'Cumplimiento de las cargas y la entrega de las cesiones.', expectativas: 'Obras de urbanismo terminadas según el cronograma del plan parcial.', poder: 5, interes: 2, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Secretaría de Gestión y Control Territorial', cargo: 'Subsecretaría de control urbanístico', organizacion: 'Distrito de Medellín', rol: 'Control urbanístico y recibo de obligaciones', contacto: 'Oficio radicado; visitas de control', requisitos: 'Radicación de los documentos para anunciar y enajenar vivienda antes de las preventas (Ley 962 de 2005, art. 71; radicados el 13 de junio de 2025) y obras conformes con la licencia.', expectativas: 'Acceso a la obra para las visitas de control.', poder: 4, interes: 2, influencia: 3, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Desconocedor', nivelDeseado: 'Neutral' },
    { nombre: 'Secretaría de Movilidad', cargo: 'Subsecretaría de movilidad', organizacion: 'Distrito de Medellín', rol: 'Estudio de movilidad y plan de manejo de tránsito', contacto: 'Oficio radicado; mesas técnicas', requisitos: 'Mitigación vial construida antes de la ocupación de la etapa 1.', expectativas: 'Plan de manejo de tránsito cumplido en la vía de acceso.', poder: 4, interes: 2, influencia: 3, clasificacion: 'Externo', actitud: 'Reticente', nivelActual: 'Reticente', nivelDeseado: 'Neutral' },
    { nombre: 'EPM', cargo: 'Unidad de nuevas conexiones', organizacion: 'Empresas Públicas de Medellín E.S.P.', rol: 'Factibilidad, diseños y conexiones de servicios', contacto: 'Mesa técnica quincenal durante la construcción de redes', requisitos: 'Redes construidas según sus normas de diseño y construcción.', expectativas: 'Solicitudes de recibo con planos récord completos.', poder: 4, interes: 2, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Área Metropolitana del Valle de Aburrá', cargo: 'Subdirección ambiental', organizacion: 'Autoridad ambiental urbana', rol: 'Permisos de aprovechamiento forestal, ocupación de cauce y RCD', contacto: 'Oficio radicado; informes de cumplimiento', requisitos: 'Cumplimiento de los permisos y de la Resolución 1257 de 2021.', expectativas: 'Informes de cumplimiento a tiempo.', poder: 4, interes: 2, influencia: 3, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Neutral' },
    { nombre: 'ISVIMED', cargo: 'Dirección de vivienda', organizacion: 'Instituto Social de Vivienda y Hábitat de Medellín', rol: 'Compensación de la obligación VIP y subsidios municipales', contacto: 'Oficio radicado', requisitos: 'Pago de los derechos fiduciarios de la compensación VIP (cumplido el 18 de julio de 2025).', expectativas: 'Información de compradores VIS que puedan acceder a subsidios municipales.', poder: 3, interes: 2, influencia: 2, clasificacion: 'Externo', actitud: 'Partidario', nivelActual: 'Partidario', nivelDeseado: 'Partidario' },
    { nombre: 'Compradores, cajas de compensación y bancos hipotecarios', cargo: '274 hogares compradores al corte', organizacion: 'Compradores (416 hogares al terminar las ventas)', rol: 'Clientes', contacto: 'Sala de ventas, portal de la fiduciaria y boletín bimestral', requisitos: 'Entrega a tiempo, calidad del apartamento modelo y crédito o subsidio aprobado.', expectativas: 'Información confiable de la fecha de entrega y atención ágil de peticiones.', poder: 3, interes: 5, influencia: 4, clasificacion: 'Externo', actitud: 'Partidario', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
    { nombre: 'Comunidad vecina y Junta de Acción Comunal', cargo: 'Junta de Acción Comunal del sector', organizacion: 'Comunidad del sector (ficticia)', rol: 'Vecinos de la obra', contacto: 'Mesa vecinal mensual y línea de atención de quejas', requisitos: 'Control de ruido, polvo y tránsito de volquetas.', expectativas: 'Empleo local y respeto del horario de obra.', poder: 2, interes: 4, influencia: 3, clasificacion: 'Externo', actitud: 'Reticente', nivelActual: 'Reticente', nivelDeseado: 'Neutral' },
    { nombre: 'Futura copropiedad', cargo: 'Asamblea y consejo de administración (por conformar)', organizacion: 'Propiedad horizontal del edificio', rol: 'Recibe las zonas comunes', contacto: 'Administración provisional desde la primera entrega', requisitos: 'Zonas comunes completas y dotadas (Ley 675 de 2001).', expectativas: 'Manuales, garantías e inventario de las zonas comunes.', poder: 2, interes: 3, influencia: 2, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Desconocedor', nivelDeseado: 'Partidario' },
  ]);
  const rintFields = {
    interesados: INTERESADOS,
    fechaActualizacion: CUT,
    fuentes: 'Acta de constitución, contratos de fiducia y de encargo de preventas, licencia de urbanización y construcción, plan parcial y unidad de actuación urbanística, contratos del proyecto, peticiones y quejas de compradores y actas de la mesa vecinal. Cambios al corte: la comunidad vecina pasó a reticente por el polvo y el tránsito de volquetas en la vía de acceso (mesa vecinal de septiembre); la Secretaría de Movilidad sigue reticente hasta recibir la mitigación vial del CC-002, que empieza el 5 de octubre de 2026; los compradores siguen en neutral mientras se confirma la fecha de entrega de la etapa 1.',
  };
  const rintLb1 = patchRows(INTERESADOS, {
    'rint-15': { cargo: 'Unos 170 hogares compradores', expectativas: 'Inicio de obra de la etapa 1 en la fecha anunciada.' },
    'rint-16': { actitud: 'Neutral', nivelActual: 'Neutral', expectativas: 'Empleo local y conocer el horario de obra antes de empezar.' },
  });
  const rint0 = patchRows(INTERESADOS, {
    'rint-03': { organizacion: 'Fiduciaria por seleccionar', actitud: 'Neutral', nivelActual: 'Desconocedor', contacto: 'Por definir' },
    'rint-04': { organizacion: 'Banco por seleccionar', nivelActual: 'Desconocedor', contacto: 'Por definir' },
    'rint-06': { nivelActual: 'Neutral', contacto: 'Por definir con los contratos de diseño' },
    'rint-08': { nivelActual: 'Desconocedor' },
    'rint-09': { nivelActual: 'Neutral' },
    'rint-11': { actitud: 'Neutral', nivelActual: 'Desconocedor', requisitos: 'Estudio de movilidad aprobado y obras de mitigación que resulten.' },
    'rint-12': { nivelActual: 'Desconocedor' },
    'rint-13': { nivelActual: 'Desconocedor' },
    'rint-14': { nivelActual: 'Neutral', requisitos: 'Compensación de la obligación VIP en dinero (derechos fiduciarios).' },
    'rint-15': { cargo: 'Hogares de estrato 3 interesados en vivienda del occidente', organizacion: 'Compradores potenciales', actitud: 'Neutral', nivelActual: 'Desconocedor', contacto: 'Estudio de mercado y futura sala de ventas' },
    'rint-16': { actitud: 'Neutral', nivelActual: 'Desconocedor', contacto: 'Por establecer antes del inicio de obra' },
  }, ['rint-05', 'rint-07', 'rint-10', 'rint-17']);
  const registroInteresados = {
    status: 'revision', rev: '2A', date: CUT,
    titleBlock: { elaboro: R.ger, reviso: R.com },
    fields: rintFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: '2025-01-24', note: 'Registro inicial de la reunión de arranque.',
        fields: revFields(rintFields, { interesados: rint0, fechaActualizacion: '2025-01-24', fuentes: 'Acta de constitución, caso de negocio, oferta del lote, norma del plan parcial y reunión de arranque del 21 de enero de 2025. Fiduciaria, banco, constructor y supervisión técnica se agregarán cuando se seleccionen.' }),
      },
      {
        rev: '1', status: 'aprobado', date: LB1, note: 'Actualización para el inicio de obra de la etapa 1: constructor, supervisión técnica independiente, Secretaría de Gestión y Control Territorial y futura copropiedad.',
        fields: revFields(rintFields, { interesados: rintLb1, fechaActualizacion: LB1, fuentes: 'Acta de constitución, contratos de fiducia y de encargo de preventas, licencia ejecutoriada (con el concepto de movilidad y sus obligaciones de mitigación), plan parcial, contratos de construcción, supervisión técnica e interventoría y peticiones de compradores.' }),
      },
    ],
  };

  /* ------------------------------------------------------------ 13.2 Plan de involucramiento de los interesados */
  const involucramiento = rows('piin', [
    { interesado: R.jun, nivelActual: 'Líder', nivelDeseado: 'Líder', estrategia: 'Informe mensual de desempeño con alertas tempranas y alternativas; sesión extraordinaria para cambios que afecten hitos o la utilidad.', responsable: R.ger, frecuencia: 'Mensual' },
    { interesado: R.fid, nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Conciliación mensual del flujo y del presupuesto; entrega anticipada de los soportes del punto de equilibrio de la etapa 2; visitas de obra trimestrales.', responsable: R.est, frecuencia: 'Mensual' },
    { interesado: 'Banco del crédito constructor', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Acta de avance certificada el día 10; información de ventas y escrituración; solicitud del crédito de la etapa 2 con tres meses de anticipación.', responsable: R.est, frecuencia: 'Mensual' },
    { interesado: 'Constructor y subcontratistas', nivelActual: 'Partidario', nivelDeseado: 'Líder', estrategia: 'Comité de obra semanal, pagos a tiempo desde el patrimonio autónomo, diseños de detalle completos antes de cada frente y reconocimiento de buenas prácticas.', responsable: R.ger, frecuencia: 'Semanal' },
    { interesado: R.sti, nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Plan de supervisión acordado, aviso de vaciados con 48 horas y atención de observaciones en 48 horas.', responsable: R.con, frecuencia: 'Semanal' },
    { interesado: 'Curaduría urbana de Medellín', nivelActual: 'Neutral', nivelDeseado: 'Neutral', estrategia: 'Trámites completos y oportunos (modificaciones o prórroga de la licencia) con reunión técnica previa a cada radicación.', responsable: R.arq, frecuencia: 'Por evento' },
    { interesado: 'Departamento Administrativo de Planeación (DAP)', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Seguimiento del reparto de cargas y del cronograma de entrega de las cesiones; informes de avance de las obras de urbanismo.', responsable: R.arq, frecuencia: 'Por hito' },
    { interesado: 'Secretaría de Movilidad', nivelActual: 'Reticente', nivelDeseado: 'Neutral', estrategia: 'Construir la mitigación vial antes de la ocupación de la etapa 1; cumplir el plan de manejo de tránsito y reunirse antes de cada cierre vial.', responsable: R.ger, frecuencia: 'Por hito' },
    { interesado: 'EPM', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Mesa técnica quincenal durante la construcción de las redes y solicitudes de recibo con planos récord.', responsable: R.con, frecuencia: 'Quincenal' },
    { interesado: 'Área Metropolitana del Valle de Aburrá', nivelActual: 'Neutral', nivelDeseado: 'Neutral', estrategia: 'Informes de cumplimiento de los permisos de aprovechamiento forestal y de ocupación de cauce; gestión de residuos con gestores autorizados.', responsable: R.con, frecuencia: 'Por hito' },
    { interesado: 'Compradores, cajas de compensación y bancos hipotecarios', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Boletín bimestral de avance, visitas de obra por etapa, respuesta a peticiones y quejas en 15 días hábiles y acompañamiento en la preaprobación del crédito y del subsidio.', responsable: R.com, frecuencia: 'Mensual' },
    { interesado: 'Comunidad vecina y Junta de Acción Comunal', nivelActual: 'Neutral', nivelDeseado: 'Neutral', estrategia: 'Mesa vecinal mensual, horario de obra acordado, lavado de llantas y control de polvo, línea de atención de quejas y contratación de mano de obra local no calificada.', responsable: R.ger, frecuencia: 'Mensual' },
    { interesado: 'ISVIMED', nivelActual: 'Partidario', nivelDeseado: 'Partidario', estrategia: 'Información a los compradores VIS sobre los subsidios municipales disponibles.', responsable: R.com, frecuencia: 'Por evento' },
    { interesado: 'Futura copropiedad', nivelActual: 'Desconocedor', nivelDeseado: 'Partidario', estrategia: 'Manual de uso y mantenimiento, inventario de zonas comunes, capacitación del consejo de administración y entrega formal de los bienes comunes (Ley 675 de 2001, art. 24).', responsable: R.ger, frecuencia: 'Por hito' },
  ]);
  const piinFields = {
    involucramiento,
    impactoCambio: 'El inicio de la obra de la etapa 1 cambia la relación con los interesados: los compradores pasan de la promesa al seguimiento del avance y de sus pagos; la comunidad vecina empieza a sentir ruido, polvo y tránsito de volquetas; EPM, Movilidad y el Área Metropolitana pasan del trámite al control en obra; la fiduciaria y el banco reciben actas mensuales de avance. El CC-002 obliga a construir la mitigación vial exigida por Movilidad antes de ocupar la etapa 1.',
    interrelaciones: 'Fiduciaria, banco e interventoría dependen de la misma información (acta de avance y ventas): se les entrega un solo paquete conciliado. Compradores y bancos hipotecarios: la preaprobación del crédito condiciona la escrituración y la subrogación del crédito constructor. Comunidad y Movilidad: las quejas por tránsito de volquetas pueden endurecer el control del plan de manejo de tránsito. Constructor y supervisión técnica: la liberación por piso condiciona el ritmo de la estructura.',
    requisitosFase: 'Construcción de la etapa 1 y preventas de la etapa 2 (marzo de 2026 a julio de 2027): informe mensual a la junta, acta de avance a la fiduciaria y al banco el día 10, boletín bimestral a compradores, mesa vecinal mensual, comité de obra semanal y liberaciones por piso de la supervisión técnica.',
    informacionDistribuir: 'Avance físico y financiero, ventas por etapa, estado del punto de equilibrio de la etapa 2, fechas pronosticadas de entrega, estado de cuenta de cada comprador, horarios de obra y frentes que afectan el tránsito, resultados de ensayos y liberaciones por piso.',
    actualizacion: 'Se revisa cada mes con el registro de interesados y se reemite al iniciar la obra de cada etapa, al empezar las entregas y al entregar las zonas comunes a la copropiedad.',
  };
  const planInvolucramientoInteresados = {
    status: 'aprobado', rev: '1', date: LB1,
    titleBlock: { elaboro: R.ger, reviso: R.com, aprobo: R.jun },
    fields: piinFields,
    revs: [
      {
        rev: '0', status: 'aprobado', date: LB0, note: 'Plan para la estructuración, la licencia y las preventas de la etapa 1.',
        fields: revFields(piinFields, {
          involucramiento: patchRows(involucramiento, {
            'piin-02': { nivelActual: 'Desconocedor', estrategia: 'Selección de la fiduciaria con condiciones de giro claras; reuniones quincenales hasta firmar el encargo de preventas.' },
            'piin-03': { nivelActual: 'Desconocedor', estrategia: 'Presentar el proyecto con la factibilidad y las preventas a tres bancos antes de pedir el crédito de la etapa 1.' },
            'piin-06': { nivelActual: 'Desconocedor', estrategia: 'Reunión técnica previa a la radicación y solicitud completa en legal y debida forma.' },
            'piin-08': { nivelActual: 'Desconocedor', estrategia: 'Estudio de movilidad con reunión previa para conocer las obligaciones de mitigación antes de radicar la licencia.' },
            'piin-09': { nivelActual: 'Desconocedor', estrategia: 'Factibilidad de servicios y diseños de redes aprobados antes del inicio de obra.' },
            'piin-10': { nivelActual: 'Desconocedor', estrategia: 'Solicitud temprana de los permisos de aprovechamiento forestal y de ocupación de cauce.' },
            'piin-11': { nivelActual: 'Desconocedor', estrategia: 'Lanzamiento de la etapa 1 con información veraz (Ley 1480 de 2011), sala de ventas, apartamento modelo y acompañamiento en la preaprobación del crédito y del subsidio.' },
            'piin-12': { nivelActual: 'Desconocedor', estrategia: 'Presentación del proyecto a la Junta de Acción Comunal antes del inicio de obra y acuerdo del horario de trabajo.' },
          }, ['piin-04', 'piin-05', 'piin-14']),
          impactoCambio: 'La compra del lote, la licencia y el lanzamiento de la etapa 1 cambian el entorno: la comunidad conocerá un proyecto de 416 viviendas en su sector; las entidades reciben solicitudes de licencia, permisos y redes; los compradores entregan sus recursos a un encargo fiduciario.',
          requisitosFase: 'Estructuración, licencia y preventas de la etapa 1 (abril de 2025 a febrero de 2026): informe mensual a la junta, radicaciones con trazabilidad, información comercial veraz a los compradores y conciliación mensual con la fiduciaria.',
          informacionDistribuir: 'Estado de la licencia y de los trámites, ventas y recaudos de la etapa 1, avance hacia el punto de equilibrio, fechas estimadas de inicio de obra y de entrega.',
        }),
      },
      { rev: '1', status: 'aprobado', date: LB1, note: 'Actualización para la construcción de la etapa 1 y las preventas de la etapa 2 (LB1).' },
    ],
  };

  PM.exampleDocs = PM.exampleDocs || {};
  PM.exampleDocs.medellin = Object.assign(PM.exampleDocs.medellin || {}, {
    'plan-gestion-costos': planGestionCostos,
    'estimacion-costos': estimacionCostos,
    'requisitos-financiamiento': requisitosFinanciamiento,
    'plan-gestion-calidad': planGestionCalidad,
    'metricas-calidad': metricasCalidad,
    'documentos-prueba': documentosPrueba,
    'informe-calidad': informeCalidad,
    'mediciones-control-calidad': medicionesControl,
    'plan-gestion-recursos': planGestionRecursos,
    'acta-constitucion-equipo': actaConstitucionEquipo,
    'requisitos-recursos': requisitosRecursos,
    'estructura-desglose-recursos': estructuraDesgloseRecursos,
    'asignaciones-recursos': asignacionesRecursos,
    'evaluacion-desempeno-equipo': evaluacionDesempenoEquipo,
    'plan-gestion-comunicaciones': planGestionComunicaciones,
    'registro-comunicaciones': registroComunicaciones,
    'acta-reunion': actaReunion,
    'plan-gestion-riesgos': planGestionRiesgos,
    'registro-riesgos': registroRiesgos,
    'informe-riesgos': informeRiesgos,
    'analisis-cuantitativo': analisisCuantitativo,
    'plan-gestion-adquisiciones': planGestionAdquisiciones,
    'estrategia-adquisiciones': estrategiaAdquisiciones,
    'decisiones-hacer-comprar': decisionesHacerComprar,
    'enunciado-trabajo-adquisicion': enunciadoTrabajo,
    'criterios-seleccion-proveedores': criteriosSeleccionProveedores,
    'registro-adquisiciones': registroAdquisiciones,
    'control-adquisiciones': controlAdquisiciones,
    'registro-interesados': registroInteresados,
    'plan-involucramiento-interesados': planInvolucramientoInteresados,
  });
})();

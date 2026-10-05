/* ==========================================================================
   13-templates-b.js — plantillas de documentos de la Guía del PMBOK® 6.ª ed.
   para Costos (cap. 7), Calidad (8), Recursos (9), Comunicaciones (10),
   Riesgos (11), Adquisiciones (12) e Interesados (13).
   Contrato: SPEC.md §5 (estructura y tablas de columnas fijas) y §6 (ids).
   Los ejemplos describen el proyecto ficticio PRY-2026-014 (SPEC.md §8).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;

  /* ================================================================== constructores de campos */
  const field = (type, base) => (key, label, extra) => Object.assign({ key, label, type }, base || {}, extra || {});
  const text = field('text');
  const area = field('textarea', { rows: 4 });
  const number = field('number');
  const money = field('money');
  const pct = field('pct');
  const date = field('date');
  const list = field('list');
  const check = field('check');
  const select = (key, label, options, extra) => Object.assign({ key, label, type: 'select', options }, extra || {});
  const table = (key, label, columns, extra) => Object.assign({ key, label, type: 'table', columns }, extra || {});
  const section = (id, title, fields, description) => (description ? { id, title, description, fields } : { id, title, fields });

  /* columnas de tabla */
  const col = (key, label, type, extra) => Object.assign({ key, label, type }, extra || {});
  const cText = (key, label, extra) => col(key, label, 'text', Object.assign({ width: 150 }, extra));
  const cCode = (key, label, extra) => col(key, label, 'text', Object.assign({ width: 84 }, extra));
  const cArea = (key, label, extra) => col(key, label, 'textarea', Object.assign({ width: 220 }, extra));
  const cNum = (key, label, extra) => col(key, label, 'number', Object.assign({ width: 90 }, extra));
  const cMoney = (key, label, extra) => col(key, label, 'money', Object.assign({ width: 130 }, extra));
  const cPct = (key, label, extra) => col(key, label, 'pct', Object.assign({ width: 84 }, extra));
  const cDate = (key, label, extra) => col(key, label, 'date', Object.assign({ width: 130 }, extra));
  const cCheck = (key, label, extra) => col(key, label, 'check', extra);
  const cSelect = (key, label, options, extra) => col(key, label, 'select', Object.assign({ options, width: 140 }, extra));
  const cCalc = (key, label, calc, format, extra) => col(key, label, 'calc', Object.assign({ calc, format }, extra));
  const cScale = (key, label, extra) => cNum(key, label, Object.assign({ min: 1, max: 5, width: 74, hint: 'Escala de 1 (muy bajo) a 5 (muy alto).' }, extra));
  /* Pistas de escala que concuerdan con la columna: «probabilidad muy baja», «influencia muy alta»;
     las calificaciones de desempeño usan la escala de lo esperado. */
  const ESCALA_FEM = { hint: 'Escala de 1 (muy baja) a 5 (muy alta).' };
  const ESCALA_DESEMPENO = { hint: 'Escala de 1 (muy por debajo de lo esperado) a 5 (supera lo esperado); 3 = cumple.' };

  /* ================================================================== cálculos de columnas (puros, toleran vacíos) */
  const val = (v) => {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
    const x = PM.num(v, NaN);
    return Number.isFinite(x) ? x : null;
  };
  const round = (x, d) => { const f = Math.pow(10, d === undefined ? 2 : d); return Math.round(x * f) / f; };
  const get = (row, key) => (row && typeof row === 'object' ? row[key] : undefined);
  const indexIn = (row, rows) => {
    if (!Array.isArray(rows)) return -1;
    let i = rows.indexOf(row);
    if (i < 0 && row && row.id) i = rows.findIndex((r) => r && r.id === row.id);
    return i;
  };
  const calcProduct = (a, b) => (row) => { const x = val(get(row, a)), y = val(get(row, b)); return x === null || y === null ? null : round(x * y); };
  const calcAverage = (keys) => (row) => {
    const xs = keys.map((k) => val(get(row, k))).filter((x) => x !== null);
    return xs.length ? round(xs.reduce((s, x) => s + x, 0) / xs.length) : null;
  };
  /* Acumulado en el orden de la tabla: suma fn(fila) desde la primera fila hasta la actual. */
  const calcCumulative = (fn) => (row, rows) => {
    const i = indexIn(row, rows);
    const upto = i < 0 ? [row] : rows.slice(0, i + 1);
    let any = false, s = 0;
    for (const r of upto) { const x = fn(r); if (x !== null) { any = true; s += x; } }
    return any ? round(s) : null;
  };
  const calcWeighted = (scoreKey) => (row) => { const w = val(get(row, 'peso')), s = val(get(row, scoreKey)); return w === null || s === null ? null : round((w * s) / 100); };
  const calcRiskScore = (row) => PM.calc.riskScore(get(row, 'probabilidad'), get(row, 'impacto'));
  const isOpportunity = (row) => /^oportunidad/i.test(String(get(row, 'tipo') || '').trim());
  /* VME = probabilidad (%) × impacto; positivo para oportunidades y negativo para amenazas (y filas sin tipo). */
  const calcEmv = (row) => {
    const p = val(get(row, 'probabilidad')), imp = val(get(row, 'impacto'));
    if (p === null || imp === null) return null;
    return round(((isOpportunity(row) ? 1 : -1) * Math.abs(imp) * p) / 100);
  };
  /* VME acumulado por tipo: en la última fila da el total de amenazas y el de oportunidades. */
  const cumThreatEmv = calcCumulative((row) => (isOpportunity(row) ? null : calcEmv(row)));
  const cumOpportunityEmv = calcCumulative((row) => (isOpportunity(row) ? calcEmv(row) : null));
  const calcMakeBuyDiff = (row) => { const h = val(get(row, 'costoHacer')), c = val(get(row, 'costoComprar')); return h === null || c === null ? null : round(h - c); };
  const costTotal = calcProduct('cantidad', 'costoUnitario');
  const costWithContingency = (row) => { const t = costTotal(row); if (t === null) return null; const c = val(get(row, 'contingencia')) || 0; return round(t * (1 + c / 100)); };
  const fundBaseline = (row) => { const e = val(get(row, 'egresos')), c = val(get(row, 'contingencia')); return e === null && c === null ? null : (e || 0) + (c || 0); };
  const cumBaseline = calcCumulative(fundBaseline);
  const cumFunding = calcCumulative((row) => val(get(row, 'financiamiento')));
  const calcFundingGap = (row, rows) => { const f = cumFunding(row, rows), b = cumBaseline(row, rows); return f === null && b === null ? null : round((f || 0) - (b || 0)); };

  /* ================================================================== formatos de columnas calculadas */
  /* Moneda del proyecto actual (lectura única y en caché por proyecto; por defecto COP). */
  let curPid = null, curCurrency = 'COP';
  const currency = () => {
    try {
      const pid = PM.getState().projectId;
      if (pid !== curPid) {
        curPid = pid; curCurrency = 'COP';
        if (pid) PM.store.get(PM.paths.project(pid)).then((p) => { if (curPid === pid && p && PM.CURRENCIES[p.currency]) curCurrency = p.currency; }).catch(() => {});
      }
    } catch (e) { /* sin estado de la aplicación: COP */ }
    return curCurrency;
  };
  const isNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
  const fmtMoney = (v) => (isNum(v) ? PM.fmt.money(v, currency()) : '—');
  const fmtScore = (v) => (isNum(v) ? PM.fmt.fixed(v, 1) : '—');
  const fmtPoints = (v) => (isNum(v) ? PM.fmt.num(v, 2) : '—');
  const fmtRisk = (v) => { const s = PM.num(v, 0); return s > 0 ? s + ' · ' + PM.calc.riskLevel(s).label : '—'; };
  const fmtText = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const fmtMakeBuy = (v) => (isNum(v) ? fmtMoney(v) + (v > 0 ? ' · la opción externa cuesta menos' : v < 0 ? ' · hacer cuesta menos' : ' · sin diferencia') : '—');

  /* ================================================================== opciones compartidas */
  const SI_NO = ['Sí', 'No'];
  const FRECUENCIAS = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Por hito', 'Por evento', 'Única vez'];
  const MONEDAS = [{ value: 'COP', label: 'Peso colombiano (COP)' }, { value: 'USD', label: 'Dólar estadounidense (USD)' }, { value: 'EUR', label: 'Euro (EUR)' }];
  const NIVELES_CONFIANZA = ['Alto', 'Medio', 'Bajo'];
  // Costos
  const CATEGORIAS_COSTO = ['Mano de obra', 'Equipos', 'Materiales', 'Transporte', 'Subcontratos', 'Servicios', 'Gastos generales'];
  const METODOS_ESTIMACION = ['Análoga', 'Paramétrica', 'Ascendente', 'Por tres valores (PERT)', 'Cotización de proveedor', 'Juicio de expertos'];
  const TIPOS_ESTIMACION = ['Orden de magnitud (−25 % a +75 %)', 'Presupuestaria (−10 % a +25 %)', 'Definitiva (−5 % a +10 %)'];
  const TECNICAS_VALOR_GANADO = ['Fórmula fija 0/100', 'Fórmula fija 50/50', 'Fórmula fija 20/80', 'Porcentaje completado', 'Hitos ponderados', 'Unidades completadas', 'Nivel de esfuerzo', 'Esfuerzo prorrateado'];
  const METODOS_EAC = ['EAC = BAC / CPI (desempeño típico)', 'EAC = AC + (BAC − EV) (desempeño atípico)', 'EAC = AC + (BAC − EV) / (CPI × SPI)', 'EAC = AC + ETC ascendente'];
  const FUENTES_FINANCIAMIENTO = ['Capital de trabajo de la empresa', 'Anticipo del cliente', 'Facturación por actas de corte', 'Crédito bancario', 'Reserva de gestión'];
  // Calidad
  const TIPOS_PRUEBA = ['Lista de verificación', 'Inspección preoperacional', 'Protocolo de inspección', 'Prueba de carga', 'Ensayo de arrancamiento', 'Auditoría', 'Prueba de aceptación'];
  const CUMPLIMIENTO_METRICA = ['Cumple', 'Cumple con observaciones', 'No cumple'];
  const ESTADO_ACCION = ['Abierta', 'En curso', 'Cerrada'];
  // Recursos
  const CATEGORIAS_RECURSO = ['Personal', 'Equipos', 'Materiales', 'Transporte', 'Servicios'];
  const FUENTES_RECURSO = ['Interno', 'Contratado', 'Subarriendo', 'Suministro del cliente'];
  const ESTADO_RECURSO_FISICO = ['Programado', 'En obra', 'En mantenimiento', 'Devuelto'];
  // Comunicaciones
  const MEDIOS = ['Reunión presencial', 'Reunión virtual', 'Correo electrónico', 'Informe escrito', 'Oficio radicado', 'Llamada telefónica', 'Mensajería (grupo de obra)', 'Cartelera de obra', 'Bitácora de obra', 'Repositorio de documentos'];
  const METODOS_COMUNICACION = ['Interactiva', 'De tipo push (enviar)', 'De tipo pull (consultar)'];
  const TIPOS_COMUNICACION = ['Informe', 'Acta', 'Correo', 'Oficio', 'Comunicado', 'Presentación', 'Llamada', 'Anotación en bitácora'];
  const ESTADOS_COMUNICACION = ['Enviada', 'Recibida', 'Pendiente de respuesta', 'Respondida', 'Archivada'];
  const TIPOS_REUNION = ['Comité de seguimiento', 'Reunión de arranque (kick-off)', 'Reunión técnica', 'Comité de control de cambios', 'Reunión de SST', 'Reunión con el cliente', 'Reunión con proveedores', 'Reunión de cierre', 'Revisión de lecciones aprendidas'];
  const MODALIDADES = ['Presencial', 'Virtual', 'Mixta'];
  const ASISTENCIA = ['Asistió', 'Excusado', 'Ausente'];
  const ESTADO_COMPROMISO = ['Pendiente', 'En curso', 'Cumplido', 'Vencido'];
  // Riesgos (SPEC §5: registro-riesgos)
  const RIESGO_CATEGORIAS = ['Técnico', 'Externo', 'De la organización', 'Dirección de proyectos'];
  const RIESGO_TIPOS = ['Amenaza', 'Oportunidad'];
  const RIESGO_ESTRATEGIAS = ['Escalar', 'Evitar', 'Transferir', 'Mitigar', 'Aceptar', 'Explotar', 'Compartir', 'Mejorar'];
  /* Guía del PMBOK 6.ª ed., 11.5.2.4 (amenazas) y 11.5.2.5 (oportunidades). */
  const ESTRATEGIAS_AMENAZA = ['Escalar', 'Evitar', 'Transferir', 'Mitigar', 'Aceptar'];
  const ESTRATEGIAS_OPORTUNIDAD = ['Escalar', 'Explotar', 'Compartir', 'Mejorar', 'Aceptar'];
  /* Coherencia entre el tipo de riesgo y la estrategia elegida (null si falta alguno de los dos o la estrategia no es del catálogo). */
  const calcStrategyFit = (row) => {
    const tipo = String(get(row, 'tipo') || '').trim().toLowerCase();
    const est = String(get(row, 'estrategia') || '').trim().toLowerCase();
    if (!est || (tipo !== 'amenaza' && tipo !== 'oportunidad')) return null;
    const has = (list) => list.some((x) => x.toLowerCase() === est);
    if (!has(RIESGO_ESTRATEGIAS)) return null;
    if (tipo === 'oportunidad') return has(ESTRATEGIAS_OPORTUNIDAD) ? 'Coherente' : 'No aplica a oportunidades';
    return has(ESTRATEGIAS_AMENAZA) ? 'Coherente' : 'No aplica a amenazas';
  };
  const RIESGO_ESTADOS = ['Abierto', 'En seguimiento', 'Cerrado', 'Materializado'];
  const RIESGO_NIVELES = ['Bajo', 'Medio', 'Alto', 'Muy alto'];
  const EDR_RIESGOS_NIVEL1 = ['Técnico', 'De gestión', 'Comercial', 'Externo'];
  const TENDENCIAS = ['En aumento', 'Estable', 'En disminución'];
  // Adquisiciones
  const TIPOS_CONTRATO = ['Precio fijo cerrado (FFP)', 'Precio fijo más honorarios con incentivos (FPIF)', 'Precio fijo con ajuste económico de precio (FP-EPA)', 'Costo más honorarios fijos (CPFF)', 'Costo más honorarios con incentivos (CPIF)', 'Costo más honorarios por cumplimiento de objetivos (CPAF)', 'Tiempo y materiales (T&M)'];
  const METODOS_SELECCION = ['Menor costo', 'Calificaciones únicamente', 'Basado en la calidad o el puntaje técnico', 'Basado en calidad y costo', 'Fuente única', 'Presupuesto fijo'];
  const METODOS_ENTREGA = ['Suministro directo (orden de compra)', 'Servicio sin subcontratación', 'Servicio con subcontratación permitida', 'Empresa conjunta (joint venture)', 'Llave en mano', 'Diseño-construcción (DB)', 'Diseño-licitación-construcción (DBB)', 'Diseño-construcción-operación (DBO)', 'Construir-poseer-operar-transferir (BOOT)'];
  const DECISION_HACER_COMPRAR = ['Hacer', 'Comprar', 'Alquilar', 'Mixto'];
  const ESTADO_POLIZA = ['Aprobada', 'Pendiente', 'Vencida', 'No aplica'];
  const ESTADO_CONTRATO = ['En negociación', 'Firmado', 'En ejecución', 'Suspendido', 'Terminado', 'Liquidado'];
  const ESTADO_RECLAMACION = ['Abierta', 'En negociación', 'Resuelta', 'Escalada'];
  // Interesados (SPEC §5: registro-interesados)
  const NIVELES_INVOLUCRAMIENTO = ['Desconocedor', 'Reticente', 'Neutral', 'Partidario', 'Líder'];
  const CLASIFICACION_INTERESADO = ['Interno', 'Externo'];
  const ACTITUDES = ['Partidario', 'Neutral', 'Reticente'];

  /* Datos compartidos del ejemplo (SPEC §8) */
  const EJ = {
    empresa: 'Ingeniería y Alquiler S.A.S.',
    cliente: 'Constructora Modelo S.A.S. (ficticia)',
    interventoria: 'Interventoría del cliente (ficticia)',
  };

  const templates = [];
  const add = (t) => templates.push(t);

  /* ================================================================== 7. COSTOS */

  add({
    id: 'plan-gestion-costos', name: 'Plan de gestión de los costos', abbr: 'PGCO',
    area: 'costos', group: 'planificacion', process: '7.1', processes: ['7.1'], kind: 'plan', multiple: false,
    purpose: 'Establece cómo se estimarán, presupuestarán, gestionarán, monitorearán y controlarán los costos del proyecto: unidades, precisión, umbrales de control y reglas para medir el desempeño con valor ganado.',
    tips: [
      'Calcula la reserva para contingencias con el análisis cuantitativo de riesgos y deja la reserva de gestión fuera de la línea base de costos: solo se usa con una solicitud de cambio aprobada.',
      'Usa los paquetes de la EDT como cuentas de control y como centros de costo del sistema contable; así el costo real se carga sin reclasificaciones.',
      'Elige técnicas de valor ganado simples: 0/100 para actividades de una semana o menos, 50/50 para las de dos a cuatro semanas y unidades completadas para montajes medibles en m².',
      'Registra los valores antes de IVA y aclara si el contrato con el cliente usa AIU (administración, imprevistos y utilidad).',
    ],
    sections: [
      section('unidades', 'Unidades, precisión y exactitud', [
        select('moneda', 'Moneda del proyecto', MONEDAS, { from: 'project.currency' }),
        area('unidadesMedida', 'Unidades de medida', { hint: 'Unidad de cada tipo de recurso: jornal, hora-hombre, m² de andamio por mes, viaje, global.' }),
        text('nivelPrecision', 'Nivel de precisión', { hint: 'Redondeo de las estimaciones, p. ej., al millar de pesos más cercano.' }),
        text('nivelExactitud', 'Nivel de exactitud', { hint: 'Rango aceptable para considerar realista una estimación, p. ej., −5 % / +10 %.' }),
        select('tipoEstimacion', 'Tipo de estimación de referencia', TIPOS_ESTIMACION),
        list('metodosEstimacion', 'Métodos de estimación', { placeholder: 'Método y dónde se aplica' }),
      ]),
      section('organizacion', 'Enlaces con los procedimientos de la organización', [
        table('cuentasControl', 'Cuentas de control', [
          cCode('cuenta', 'Cuenta'),
          cText('paqueteEdt', 'Componente de la EDT', { width: 200 }),
          cText('responsable', 'Responsable'),
          cText('centroCosto', 'Centro de costo contable'),
          cMoney('presupuesto', 'Presupuesto'),
        ], { hint: 'Punto de control de la EDT donde se integran alcance, presupuesto y costo real.' }),
        area('enlaceContable', 'Relación con el sistema contable', { rows: 3 }),
      ]),
      section('control', 'Umbrales de control y reservas', [
        table('umbrales', 'Umbrales de control', [
          cText('indicador', 'Indicador', { width: 220 }),
          cText('verde', 'Verde', { width: 100 }),
          cText('amarillo', 'Amarillo', { width: 110 }),
          cText('rojo', 'Rojo', { width: 100 }),
          cArea('accion', 'Acción requerida'),
        ], {
          hint: 'Variación permitida antes de tomar una acción.',
          defaultRows: [
            { indicador: 'Índice de desempeño del costo (CPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: analizar causas. Rojo: plan de acción correctiva.' },
            { indicador: 'Índice de desempeño del cronograma (SPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: analizar causas. Rojo: plan de recuperación.' },
            { indicador: 'Variación del costo por cuenta de control (CV %)', verde: '≤ 5 %', amarillo: '5 % a 10 %', rojo: '> 10 %', accion: 'Informar al patrocinador las cuentas en rojo con su EAC.' },
            { indicador: 'Variación a la conclusión (VAC)', verde: '≥ 0', amarillo: 'Hasta −2 % del BAC', rojo: '< −2 % del BAC', accion: 'Evaluar el uso de la reserva para contingencias.' },
          ],
        }),
        money('reservaContingencia', 'Reserva para contingencias', { hint: 'Hace parte de la línea base de costos; cubre riesgos identificados.' }),
        money('reservaGestion', 'Reserva de gestión', { hint: 'Fuera de la línea base de costos; cubre trabajo imprevisto dentro del alcance.' }),
        area('usoReservas', 'Autorización y uso de las reservas', { rows: 3 }),
      ]),
      section('desempeno', 'Reglas para la medición del desempeño', [
        table('tecnicasValorGanado', 'Técnicas de medición del valor ganado', [
          cText('trabajo', 'Tipo de trabajo', { width: 220 }),
          cSelect('tecnica', 'Técnica', TECNICAS_VALOR_GANADO, { width: 200 }),
          cArea('criterio', 'Criterio de medición'),
        ], {
          defaultRows: [
            { trabajo: 'Actividades de una semana o menos', tecnica: 'Fórmula fija 0/100', criterio: 'Se gana el 100 % al terminar la actividad.' },
            { trabajo: 'Actividades de dos a cuatro semanas', tecnica: 'Fórmula fija 50/50', criterio: '50 % al iniciar y 50 % al terminar.' },
            { trabajo: 'Trabajo medible en unidades (m², viajes)', tecnica: 'Unidades completadas', criterio: 'Unidades terminadas / unidades del paquete.' },
            { trabajo: 'Gestión y apoyo continuo', tecnica: 'Nivel de esfuerzo', criterio: 'El valor ganado es igual al valor planificado del periodo.' },
          ],
        }),
        text('nivelCuentaControl', 'Nivel de la EDT para medir el valor ganado'),
        select('metodoEac', 'Método de pronóstico (EAC)', METODOS_EAC),
        select('frecuenciaMedicion', 'Frecuencia de medición', ['Semanal', 'Quincenal', 'Mensual']),
      ]),
      section('informes', 'Formatos de los informes y descripción de los procesos', [
        area('formatosInformes', 'Formatos de los informes de costos', { rows: 3 }),
        area('descripcionProcesos', 'Descripción de los procesos de gestión de los costos', { hint: 'Cómo se realizan 7.2 Estimar los costos, 7.3 Determinar el presupuesto y 7.4 Controlar los costos.' }),
        area('detallesAdicionales', 'Detalles adicionales', { rows: 3, hint: 'Financiamiento, tasas de cambio, registro de costos reales.' }),
      ]),
    ],
    example: {
      moneda: 'COP',
      unidadesMedida: 'Pesos colombianos (COP) antes de IVA. Montaje y desmontaje en días de cuadrilla (montadores certificados, supervisor y herramienta); bodega en jornales de 8 horas; ingeniería en horas-hombre; personal de dirección en meses; equipo en obra en meses de permanencia; transporte en viajes de tractomula; servicios en valor global o por jornada de inspección.',
      nivelPrecision: 'Estimaciones redondeadas al millar de pesos; informes al patrocinador en millones con un decimal.',
      nivelExactitud: '−5 % / +10 % sobre la estimación definitiva de cada paquete de trabajo, sin incluir la reserva para contingencias.',
      tipoEstimacion: 'Definitiva (−5 % a +10 %)',
      metodosEstimacion: [
        'Estimación ascendente por paquete de trabajo con las tarifas internas de 2026.',
        'Estimación paramétrica del montaje y el desmontaje: días de cuadrilla por m² de andamio según el histórico de obras 2024–2025.',
        'Cotizaciones vigentes para transporte, subarriendo de piezas, topografía, ensayos, inspección y exámenes médicos.',
        'Análisis de reservas con el valor monetario esperado del registro de riesgos.',
      ],
      cuentasControl: [
        { id: 'r1', cuenta: 'CC-1.1', paqueteEdt: '1.1 Gestión del proyecto', responsable: 'Director de proyecto', centroCosto: 'PRY-2026-014-01', presupuesto: 38600000 },
        { id: 'r2', cuenta: 'CC-1.2', paqueteEdt: '1.2 Ingeniería', responsable: 'Ingeniero de diseño', centroCosto: 'PRY-2026-014-02', presupuesto: 28100000 },
        { id: 'r3', cuenta: 'CC-1.3', paqueteEdt: '1.3 Suministro y logística', responsable: 'Coordinador logístico', centroCosto: 'PRY-2026-014-03', presupuesto: 27400000 },
        { id: 'r4', cuenta: 'CC-1.4', paqueteEdt: '1.4 Montaje', responsable: 'Residente de obra', centroCosto: 'PRY-2026-014-04', presupuesto: 213500000 },
        { id: 'r5', cuenta: 'CC-1.5', paqueteEdt: '1.5 Certificación y operación', responsable: 'Director de proyecto', centroCosto: 'PRY-2026-014-05', presupuesto: 87300000 },
        { id: 'r6', cuenta: 'CC-1.6', paqueteEdt: '1.6 Desmontaje y retiro', responsable: 'Residente de obra', centroCosto: 'PRY-2026-014-06', presupuesto: 57100000 },
      ],
      enlaceContable: 'Cada cuenta de control es un centro de costo en el sistema contable de la empresa. Las facturas de proveedores y las legalizaciones de caja menor se imputan con el código de la cuenta; la nómina de las cuadrillas se distribuye cada semana según los partes diarios de obra. El costo real se registra por causación, no por pago.',
      umbrales: [
        { id: 'r1', indicador: 'Índice de desempeño del costo (CPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: análisis de causas en el comité de obra. Rojo: plan de acción correctiva y, si hace falta presupuesto, solicitud de cambio.' },
        { id: 'r2', indicador: 'Índice de desempeño del cronograma (SPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Revisar la ruta crítica y evaluar compresión del cronograma (jornada extendida o segunda cuadrilla).' },
        { id: 'r3', indicador: 'Variación del costo por cuenta de control (CV %)', verde: '≤ 5 %', amarillo: '5 % a 10 %', rojo: '> 10 %', accion: 'Informar a Gerencia General las cuentas en rojo con su estimación a la conclusión (EAC).' },
        { id: 'r4', indicador: 'Variación a la conclusión (VAC)', verde: '≥ 0', amarillo: 'Hasta −2 % del BAC', rojo: '< −2 % del BAC', accion: 'Evaluar el saldo de la reserva para contingencias; si no alcanza, escalar a Gerencia General.' },
      ],
      reservaContingencia: 22600000,
      reservaGestion: 11900000,
      usoReservas: 'El director de proyecto autoriza el uso de la reserva para contingencias para responder a riesgos del registro, hasta COP 5 millones por evento, y lo informa en el comité de obra; los montos mayores los aprueba Gerencia General. La reserva de gestión solo la autoriza Gerencia General mediante una solicitud de cambio aprobada, y al usarla se actualiza la línea base de costos. Con el CC-002 se trasladaron $ 9,8 M de la reserva para contingencias al BAC (línea base LB1).',
      tecnicasValorGanado: [
        { id: 'r1', trabajo: 'Gestión del proyecto (1.1)', tecnica: 'Nivel de esfuerzo', criterio: 'El valor ganado es igual al valor planificado del periodo.' },
        { id: 'r2', trabajo: 'Ingeniería (1.2)', tecnica: 'Hitos ponderados', criterio: 'Levantamiento 20 %; diseño y memoria aprobados 60 %; plan de montaje y plan de rescate aprobados 20 %.' },
        { id: 'r3', trabajo: 'Alistamiento y transporte (1.3)', tecnica: 'Unidades completadas', criterio: 'Viajes entregados en obra con remisión firmada / viajes programados.' },
        { id: 'r4', trabajo: 'Montaje por niveles (1.4)', tecnica: 'Unidades completadas', criterio: 'm² de andamio montado e inspeccionado / m² de la etapa; medición semanal con el residente.' },
        { id: 'r5', trabajo: 'Inspección y certificación por etapa (1.5)', tecnica: 'Fórmula fija 0/100', criterio: 'Se gana el 100 % al firmar el certificado de la persona competente.' },
        { id: 'r6', trabajo: 'Alquiler e inspecciones semanales en obra (1.5)', tecnica: 'Nivel de esfuerzo', criterio: 'Avance proporcional al tiempo de permanencia del equipo en obra.' },
        { id: 'r7', trabajo: 'Desmontaje y retiro (1.6)', tecnica: 'Porcentaje completado', criterio: 'Avance estimado por el supervisor y verificado con el inventario de retorno.' },
      ],
      nivelCuentaControl: 'Segundo nivel de la EDT (1.1 a 1.6): cada paquete es una cuenta de control con un responsable.',
      metodoEac: 'EAC = AC + (BAC − EV) / (CPI × SPI)',
      frecuenciaMedicion: 'Semanal',
      formatosInformes: 'Informe semanal de desempeño (valor ganado por cuenta de control, curva S, CPI, SPI, EAC y ETC) para el comité de obra; informe ejecutivo mensual a Gerencia General con la tendencia de los índices y el saldo de las reservas.',
      descripcionProcesos: '7.2 Estimar los costos: estimación ascendente por paquete con tarifas internas y cotizaciones, revisada por el director de proyecto. 7.3 Determinar el presupuesto: agregación por cuenta de control, reserva para contingencias según el análisis cuantitativo de riesgos y aprobación de la línea base por Gerencia General. 7.4 Controlar los costos: corte semanal los viernes con el costo real del sistema contable y el avance físico medido en obra.',
      detallesAdicionales: 'El proyecto se financia con el anticipo del cliente, capital de trabajo y la facturación mensual por actas de corte (ver los requisitos de financiamiento). No hay compras en moneda extranjera.',
    },
  });

  add({
    id: 'estimacion-costos', name: 'Estimaciones de costos y base de las estimaciones', abbr: 'ECO',
    area: 'costos', group: 'planificacion', process: '7.2', processes: ['7.2', '7.3', '7.4'], kind: 'registro', multiple: false,
    purpose: 'Cuantifica los recursos monetarios necesarios para completar cada paquete de trabajo, con su contingencia, y documenta cómo se obtuvo cada estimación (base de las estimaciones).',
    tips: [
      'Incluye en el costo del jornal o del día de cuadrilla las prestaciones sociales, la seguridad social (con ARL de clase de riesgo V para montaje en obra), la dotación y el EPP.',
      'Documenta la base de cada partida (rendimiento, histórico o cotización) para poder sustentarla ante el patrocinador y la interventoría.',
      'La suma de las contingencias de las partidas debe coincidir con la reserva para contingencias del plan de gestión de los costos.',
      'Contrasta las cotizaciones de transporte de carga con los costos de referencia del SICE-TAC del Ministerio de Transporte.',
    ],
    sections: [
      section('estimaciones', 'Estimaciones por paquete de trabajo', [
        table('estimaciones', 'Estimaciones de costos', [
          cCode('codigo', 'Código'),
          cCode('paqueteEdt', 'EDT', { hint: 'Código del paquete de trabajo en la EDT.' }),
          cArea('descripcion', 'Recurso o actividad', { width: 240 }),
          cSelect('categoria', 'Categoría', CATEGORIAS_COSTO, { width: 170 }),
          cText('unidad', 'Unidad', { width: 90 }),
          cNum('cantidad', 'Cantidad', { min: 0 }),
          cMoney('costoUnitario', 'Costo unitario'),
          cCalc('total', 'Total', costTotal, fmtMoney, { hint: 'Cantidad × costo unitario.' }),
          cPct('contingencia', 'Contingencia (%)', { hint: 'Porcentaje de contingencia asignado a la partida.' }),
          cCalc('totalContingencia', 'Total con contingencia', costWithContingency, fmtMoney, { hint: 'Total × (1 + contingencia %).' }),
          cSelect('metodo', 'Método', METODOS_ESTIMACION, { width: 200 }),
        ]),
      ]),
      section('base', 'Base de las estimaciones', [
        area('documentacionBase', 'Cómo se desarrollaron las estimaciones'),
        list('supuestos', 'Supuestos'),
        list('restricciones', 'Restricciones'),
        area('riesgosConsiderados', 'Riesgos considerados en la contingencia', { rows: 3 }),
        text('rangoEstimacion', 'Rango de las estimaciones', { hint: 'P. ej., COP 452 M −5 % / +10 %.' }),
        select('nivelConfianza', 'Nivel de confianza de la estimación', NIVELES_CONFIANZA),
        date('fechaPrecios', 'Fecha base de los precios'),
        check('incluyeIva', 'Los valores incluyen IVA'),
      ]),
    ],
    example: {
      estimaciones: [
        { id: 'r1', codigo: 'E-01', paqueteEdt: '1.1', descripcion: 'Director de proyecto (dedicación del 50 %): planificación, comités, informes y control de cambios', categoria: 'Mano de obra', unidad: 'mes', cantidad: 4.5, costoUnitario: 5200000, contingencia: 2, metodo: 'Ascendente' },
        { id: 'r2', codigo: 'E-02', paqueteEdt: '1.1', descripcion: 'Programa de protección contra caídas, exámenes médicos y certificación del personal en alturas', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 2600000, contingencia: 0, metodo: 'Cotización de proveedor' },
        { id: 'r3', codigo: 'E-03', paqueteEdt: '1.1', descripcion: 'Pólizas del contrato, costos financieros y gastos administrativos del proyecto', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 8400000, contingencia: 10, metodo: 'Cotización de proveedor' },
        { id: 'r4', codigo: 'E-04', paqueteEdt: '1.1', descripcion: 'Cierre: acta de cierre, facturación final, liquidación del contrato y lecciones aprendidas', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 4200000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r5', codigo: 'E-05', paqueteEdt: '1.2', descripcion: 'Levantamiento topográfico y de fachada', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 3600000, contingencia: 3, metodo: 'Cotización de proveedor' },
        { id: 'r6', codigo: 'E-06', paqueteEdt: '1.2', descripcion: 'Ensayo de arrancamiento de anclajes en losa (laboratorio)', categoria: 'Subcontratos', unidad: 'global', cantidad: 1, costoUnitario: 1900000, contingencia: 0, metodo: 'Cotización de proveedor' },
        { id: 'r7', codigo: 'E-07', paqueteEdt: '1.2', descripcion: 'Diseño, planos de montaje, memoria de cálculo y revisión con la interventoría', categoria: 'Mano de obra', unidad: 'hora', cantidad: 160, costoUnitario: 100000, contingencia: 2, metodo: 'Análoga' },
        { id: 'r8', codigo: 'E-08', paqueteEdt: '1.2', descripcion: 'Plan de montaje y desmontaje, plan de rescate y plan de izaje', categoria: 'Mano de obra', unidad: 'hora', cantidad: 66, costoUnitario: 100000, contingencia: 3, metodo: 'Análoga' },
        { id: 'r9', codigo: 'E-09', paqueteEdt: '1.3', descripcion: 'Alistamiento, limpieza y clasificación de piezas en bodega', categoria: 'Mano de obra', unidad: 'jornal', cantidad: 50, costoUnitario: 150000, contingencia: 5, metodo: 'Paramétrica' },
        { id: 'r10', codigo: 'E-10', paqueteEdt: '1.3', descripcion: 'Mantenimiento de piezas antes del despacho (cuñas, pasadores y pintura)', categoria: 'Materiales', unidad: 'global', cantidad: 1, costoUnitario: 2300000, contingencia: 0, metodo: 'Juicio de expertos' },
        { id: 'r11', codigo: 'E-11', paqueteEdt: '1.3', descripcion: 'Inspección de salida y remisiones (dos operarios y montacargas)', categoria: 'Mano de obra', unidad: 'día', cantidad: 2, costoUnitario: 1300000, contingencia: 0, metodo: 'Ascendente' },
        { id: 'r12', codigo: 'E-12', paqueteEdt: '1.3', descripcion: 'Transporte a obra en tractomula (despachos nocturnos)', categoria: 'Transporte', unidad: 'viaje', cantidad: 6, costoUnitario: 1900000, contingencia: 10, metodo: 'Cotización de proveedor' },
        { id: 'r13', codigo: 'E-13', paqueteEdt: '1.3', descripcion: 'Recepción, descargue e inspección en obra (cuadrilla y camión grúa)', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 3600000, contingencia: 0, metodo: 'Ascendente' },
        { id: 'r14', codigo: 'E-14', paqueteEdt: '1.4', descripcion: 'Montaje de los niveles 1 a 5: cuadrilla de seis montadores certificados con supervisor, malacate y herramienta', categoria: 'Mano de obra', unidad: 'día de cuadrilla', cantidad: 17, costoUnitario: 2800000, contingencia: 5, metodo: 'Paramétrica' },
        { id: 'r15', codigo: 'E-15', paqueteEdt: '1.4', descripcion: 'Materiales de la etapa 1: anclajes químicos, tornillería, amarres, líneas de vida y EPP de reposición', categoria: 'Materiales', unidad: 'global', cantidad: 1, costoUnitario: 10900000, contingencia: 5, metodo: 'Cotización de proveedor' },
        { id: 'r16', codigo: 'E-16', paqueteEdt: '1.4', descripcion: 'Montaje de los niveles 6 a 10 con izaje desde la grúa del cliente', categoria: 'Mano de obra', unidad: 'día de cuadrilla', cantidad: 18, costoUnitario: 2800000, contingencia: 10, metodo: 'Paramétrica' },
        { id: 'r17', codigo: 'E-17', paqueteEdt: '1.4', descripcion: 'Materiales de la etapa 2 (anclajes, tornillería y amarres)', categoria: 'Materiales', unidad: 'global', cantidad: 1, costoUnitario: 11600000, contingencia: 0, metodo: 'Cotización de proveedor' },
        { id: 'r18', codigo: 'E-18', paqueteEdt: '1.4', descripcion: 'Montaje de los niveles 11 a 15 con exposición a viento', categoria: 'Mano de obra', unidad: 'día de cuadrilla', cantidad: 18, costoUnitario: 2800000, contingencia: 10, metodo: 'Paramétrica' },
        { id: 'r19', codigo: 'E-19', paqueteEdt: '1.4', descripcion: 'Materiales de la etapa 3 (anclajes cada dos niveles, tornillería y amarres)', categoria: 'Materiales', unidad: 'global', cantidad: 1, costoUnitario: 10000000, contingencia: 0, metodo: 'Cotización de proveedor' },
        { id: 'r20', codigo: 'E-20', paqueteEdt: '1.4', descripcion: 'Pasarelas de acceso a losas y marquesina peatonal (dos montadores y supervisor)', categoria: 'Mano de obra', unidad: 'día', cantidad: 4, costoUnitario: 2400000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r21', codigo: 'E-21', paqueteEdt: '1.4', descripcion: 'Malla de cerramiento, rodapiés y barandas definitivas', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 13200000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r22', codigo: 'E-22', paqueteEdt: '1.4', descripcion: 'Plataforma adicional de descargue en el piso 8 (CC-002 aprobado)', categoria: 'Mano de obra', unidad: 'global', cantidad: 1, costoUnitario: 9800000, contingencia: 0, metodo: 'Ascendente' },
        { id: 'r23', codigo: 'E-23', paqueteEdt: '1.5', descripcion: 'Inspección y certificación por persona competente (etapas 1 y 2 y andamio completo)', categoria: 'Servicios', unidad: 'jornada', cantidad: 6, costoUnitario: 1600000, contingencia: 10, metodo: 'Cotización de proveedor' },
        { id: 'r24', codigo: 'E-24', paqueteEdt: '1.5', descripcion: 'Alquiler interno del andamio propio en obra (4.800 m², tarifa interna)', categoria: 'Equipos', unidad: 'mes', cantidad: 3.7, costoUnitario: 14600000, contingencia: 0, metodo: 'Paramétrica' },
        { id: 'r25', codigo: 'E-25', paqueteEdt: '1.5', descripcion: 'Subarriendo de diagonales y plataformas faltantes (≈ 10 % del inventario)', categoria: 'Equipos', unidad: 'mes', cantidad: 3.7, costoUnitario: 2400000, contingencia: 20, metodo: 'Cotización de proveedor' },
        { id: 'r26', codigo: 'E-26', paqueteEdt: '1.5', descripcion: 'Inducción en uso seguro del andamio al personal del cliente', categoria: 'Servicios', unidad: 'global', cantidad: 1, costoUnitario: 1200000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r27', codigo: 'E-27', paqueteEdt: '1.5', descripcion: 'Inspecciones semanales y mantenimiento en obra (residente de obra, ajustes y reposición menor)', categoria: 'Mano de obra', unidad: 'mes', cantidad: 3.4, costoUnitario: 4000000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r28', codigo: 'E-28', paqueteEdt: '1.6', descripcion: 'Desmontaje de los niveles 15 a 1: ocho montadores certificados con supervisor y herramienta', categoria: 'Mano de obra', unidad: 'día de cuadrilla', cantidad: 13, costoUnitario: 3000000, contingencia: 5, metodo: 'Paramétrica' },
        { id: 'r29', codigo: 'E-29', paqueteEdt: '1.6', descripcion: 'Retiro de anclajes y resane de perforaciones', categoria: 'Materiales', unidad: 'global', cantidad: 1, costoUnitario: 500000, contingencia: 0, metodo: 'Juicio de expertos' },
        { id: 'r30', codigo: 'E-30', paqueteEdt: '1.6', descripcion: 'Transporte de retorno en tractomula', categoria: 'Transporte', unidad: 'viaje', cantidad: 6, costoUnitario: 1900000, contingencia: 10, metodo: 'Cotización de proveedor' },
        { id: 'r31', codigo: 'E-31', paqueteEdt: '1.6', descripcion: 'Inspección de retorno y clasificación de piezas (cuatro operarios y montacargas)', categoria: 'Mano de obra', unidad: 'día', cantidad: 4, costoUnitario: 1150000, contingencia: 0, metodo: 'Análoga' },
        { id: 'r32', codigo: 'E-32', paqueteEdt: '1.6', descripcion: 'Liquidación de faltantes y daños con el cliente', categoria: 'Gastos generales', unidad: 'global', cantidad: 1, costoUnitario: 1600000, contingencia: 20, metodo: 'Juicio de expertos' },
      ],
      documentacionBase: 'Estimación ascendente por paquete de trabajo a partir de las cantidades del diseño (4.800 m² de fachada en tres costados, lista de piezas por etapa y 12 viajes de tractomula), las tarifas internas de 2026 (día de cuadrilla con prestaciones, seguridad social, dotación, supervisión, herramienta y prorrateo del coordinador SST; alquiler interno del andamio) y las cotizaciones vigentes de transporte, subarriendo, topografía, ensayos, inspección y exámenes médicos. El montaje usa el rendimiento histórico de 90 a 95 m² por día de cuadrilla de seis montadores en sistema multidireccional (cerca de 1.600 m² por etapa en 17 a 18 días). Los totales por paquete coinciden con el presupuesto de las actividades del cronograma e incluyen la plataforma de descargue del CC-002 (línea base LB1).',
      supuestos: [
        'Jornada de lunes a sábado; festivos de Colombia no laborables.',
        'El cliente suministra la grúa torre para izar material desde el nivel 6, la zona de acopio y el punto de energía.',
        'Tarifas de transporte vigentes hasta diciembre de 2026.',
        'Cerca del 90 % de las piezas está disponible en bodega; el faltante se subarrienda.',
      ],
      restricciones: [
        'Presupuesto aprobado de COP 486,5 millones, incluidas las reservas.',
        'Entrega del andamio desmontado a más tardar el 18 de diciembre de 2026.',
        'Solo personal con certificado vigente de trabajo en alturas (Resolución 4272 de 2021).',
      ],
      riesgosConsiderados: 'La contingencia por partida cubre las amenazas R-001 a R-009 del registro de riesgos (lluvias, accidente en alturas, faltantes de piezas, cambios de secuencia, grúa del cliente, restricciones de carga, entre otras) y suma COP 22,6 millones, igual al valor monetario esperado del análisis cuantitativo.',
      rangoEstimacion: 'COP 452,0 M −5 % / +10 % (COP 429,4 M a COP 497,2 M)',
      nivelConfianza: 'Alto',
      fechaPrecios: '2026-07-15',
      incluyeIva: false,
    },
  });

  add({
    id: 'requisitos-financiamiento', name: 'Requisitos de financiamiento del proyecto', abbr: 'RFI',
    area: 'costos', group: 'planificacion', process: '7.3', processes: ['7.3'], kind: 'documento', multiple: false,
    purpose: 'Determina el financiamiento total y periódico que requiere el proyecto a partir de la línea base de costos y la reserva de gestión, y lo concilia con las fuentes y el límite de financiamiento disponibles.',
    tips: [
      'El financiamiento total es la línea base de costos más la reserva de gestión; suele entregarse en montos escalonados, no de forma continua.',
      'Programa los ingresos según el ciclo real de cobro: acta de corte aprobada, factura electrónica radicada y plazo de pago del cliente (30 a 60 días).',
      'Descuenta del flujo la retención en garantía (usualmente 5 %) hasta el acta de liquidación del contrato.',
      'Si la holgura acumulada es negativa en algún mes, concilia con el límite de financiamiento: mueve actividades o negocia anticipos antes de aprobar la línea base.',
    ],
    sections: [
      section('resumen', 'Resumen del financiamiento', [
        money('presupuestoTotal', 'Presupuesto total del proyecto', { from: 'project.budget' }),
        money('lineaBaseCostos', 'Línea base de costos', { hint: 'BAC de las actividades más la reserva para contingencias.' }),
        money('reservaGestion', 'Reserva de gestión'),
        area('fuentes', 'Fuentes de financiamiento', { rows: 3 }),
      ]),
      section('periodos', 'Requisitos periódicos de financiamiento', [
        table('periodos', 'Flujo de financiamiento por periodo', [
          cText('periodo', 'Periodo', { width: 170 }),
          cDate('fecha', 'Fecha requerida'),
          cMoney('egresos', 'Egresos planificados', { hint: 'Costo de las actividades del periodo según la línea base.' }),
          cMoney('contingencia', 'Reserva para contingencias', { hint: 'Parte de la reserva para contingencias prevista en el periodo.' }),
          cMoney('financiamiento', 'Financiamiento disponible'),
          cSelect('fuente', 'Fuente', FUENTES_FINANCIAMIENTO, { width: 250 }),
          cCalc('acumuladoLineaBase', 'Línea base acumulada', cumBaseline, fmtMoney, { hint: 'Suma de egresos y contingencia hasta el periodo.' }),
          cCalc('acumuladoFinanciamiento', 'Financiamiento acumulado', cumFunding, fmtMoney),
          cCalc('holgura', 'Holgura acumulada', calcFundingGap, fmtMoney, { hint: 'Financiamiento acumulado − línea base acumulada. Negativa = falta financiamiento.' }),
        ]),
      ], 'Registra los periodos en orden cronológico: los acumulados se calculan de arriba hacia abajo.'),
      section('condiciones', 'Condiciones y conciliación', [
        area('condicionesPago', 'Condiciones de pago del contrato con el cliente', { rows: 3 }),
        area('conciliacionLimite', 'Conciliación con el límite de financiamiento', { rows: 3 }),
        area('riesgosFinanciamiento', 'Riesgos del financiamiento', { rows: 3 }),
      ]),
    ],
    example: {
      presupuestoTotal: 486500000,
      lineaBaseCostos: 474600000,
      reservaGestion: 11900000,
      fuentes: 'Anticipo del 20 % del valor del contrato (COP 598 millones) contra póliza de buen manejo del anticipo; capital de trabajo de la empresa en septiembre; facturación mensual por actas de corte de alquiler y montaje. La reserva de gestión permanece en la tesorería de la empresa y solo se gira con aprobación de Gerencia General.',
      periodos: [
        { id: 'r1', periodo: 'Agosto de 2026', fecha: '2026-08-03', egresos: 75700000, contingencia: 2300000, financiamiento: 119600000, fuente: 'Anticipo del cliente' },
        { id: 'r2', periodo: 'Septiembre de 2026', fecha: '2026-09-01', egresos: 126500000, contingencia: 4800000, financiamiento: 91000000, fuente: 'Capital de trabajo de la empresa' },
        { id: 'r3', periodo: 'Octubre de 2026', fecha: '2026-10-01', egresos: 132700000, contingencia: 8000000, financiamiento: 142000000, fuente: 'Facturación por actas de corte' },
        { id: 'r4', periodo: 'Noviembre de 2026', fecha: '2026-11-03', egresos: 55400000, contingencia: 4000000, financiamiento: 70000000, fuente: 'Facturación por actas de corte' },
        { id: 'r5', periodo: 'Diciembre de 2026', fecha: '2026-12-01', egresos: 61700000, contingencia: 3500000, financiamiento: 63900000, fuente: 'Facturación por actas de corte' },
      ],
      condicionesPago: 'Anticipo del 20 % amortizable en las actas; actas de corte mensuales aprobadas por la interventoría; factura electrónica radicada dentro de los 3 días hábiles siguientes a la aprobación del acta; pago a 30 días desde la radicación; retención en garantía del 5 % que se devuelve con el acta de liquidación.',
      conciliacionLimite: 'Los egresos mensuales salen del valor planificado de la línea base de costos (LB1). Gerencia General fijó un límite de financiamiento de COP 150 millones en un mes y exige holgura acumulada positiva en todos los periodos. Octubre es el mes de mayor egreso (COP 140,7 millones con contingencia). Septiembre y octubre son los meses más ajustados (holgura acumulada de COP 1,3 y 2,6 millones) porque el pago del acta de agosto llega en octubre; por eso se negoció pago a 30 días con el transportador y el subarriendo se factura mes vencido.',
      riesgosFinanciamiento: 'Retraso en el pago de las actas (R-006): la factura de agosto venció el 30 de septiembre sin pago (INC-005). Si no se paga al 15 de octubre, el director de proyecto escala a Gerencia General para usar crédito de tesorería: sin ese pago, la holgura acumulada de octubre sería negativa y se afectaría la nómina de las cuadrillas.',
    },
  });

  /* ================================================================== 8. CALIDAD */

  /* Métricas típicas de andamio multidireccional (filas iniciales y ejemplo) */
  const METRICAS_ANDAMIO = [
    { codigo: 'MC-01', entregable: 'Andamio montado', metrica: 'Verticalidad de montantes', definicion: 'Desplome del montante (pie derecho) respecto a la vertical, en milímetros por metro de altura.', metodo: 'Nivel de burbuja de 60 cm o plomada', tolerancia: '≤ 3 mm/m (máximo 6 mm por tramo de 2 m)', frecuencia: 'Diaria', responsable: 'Supervisor de montaje' },
    { codigo: 'MC-02', entregable: 'Andamio montado', metrica: 'Torque de abrazaderas', definicion: 'Torque de apriete de las abrazaderas de anclaje a la estructura.', metodo: 'Torquímetro calibrado', tolerancia: '50 N·m ± 5 N·m (según fabricante)', frecuencia: 'Diaria', responsable: 'Supervisor de montaje' },
    { codigo: 'MC-03', entregable: 'Andamio montado', metrica: 'Nivelación de bases regulables', definicion: 'Diferencia de nivel entre bases de un mismo módulo y extensión del husillo.', metodo: 'Nivel láser o de manguera', tolerancia: 'Desnivel ≤ 5 mm; husillo dentro del límite del fabricante', frecuencia: 'Por hito', responsable: 'Supervisor de montaje' },
    { codigo: 'MC-04', entregable: 'Plataformas de trabajo', metrica: 'Rodapiés y barandas completos', definicion: 'Plataformas con baranda superior, baranda intermedia y rodapié en todo el perímetro de trabajo.', metodo: 'Inspección visual con lista de verificación', tolerancia: '100 % de las plataformas en uso', frecuencia: 'Diaria', responsable: 'Coordinador SST (HSE)' },
  ];

  add({
    id: 'plan-gestion-calidad', name: 'Plan de gestión de la calidad', abbr: 'PGCA',
    area: 'calidad', group: 'planificacion', process: '8.1', processes: ['8.1'], kind: 'plan', multiple: false,
    purpose: 'Describe cómo se aplicarán las políticas, procedimientos y normas de calidad para lograr los objetivos de calidad del proyecto: estándares, roles, actividades de aseguramiento y control, y tratamiento de no conformidades.',
    tips: [
      'Cita las normas que realmente aplican: Resolución 4272 de 2021 (trabajo en alturas), Decreto 1072 de 2015 (SG-SST), NSR-10 y el manual técnico del fabricante del andamio.',
      'Distingue Gestionar la calidad (auditorías al proceso de montaje) de Controlar la calidad (inspección del andamio montado).',
      'Define quién puede poner la tarjeta roja y detener el uso del andamio: la autoridad debe ser clara y conocida por todos.',
    ],
    sections: [
      section('normas', 'Estándares y objetivos de calidad', [
        list('estandares', 'Normas y estándares aplicables'),
        table('objetivos', 'Objetivos de calidad del proyecto', [
          cArea('objetivo', 'Objetivo', { width: 240 }),
          cText('metrica', 'Métrica', { width: 220 }),
          cText('meta', 'Meta', { width: 90 }),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
        ]),
      ]),
      section('roles', 'Roles y responsabilidades de calidad', [
        table('rolesCalidad', 'Roles de calidad', [
          cText('rol', 'Rol', { width: 180 }),
          cArea('responsabilidades', 'Responsabilidades'),
          cArea('autoridad', 'Autoridad'),
        ]),
      ]),
      section('actividades', 'Entregables y actividades de calidad', [
        table('entregablesRevision', 'Entregables y procesos sujetos a revisión', [
          cText('entregable', 'Entregable o proceso', { width: 180 }),
          cArea('criterio', 'Requisito o criterio de aceptación'),
          cArea('aseguramiento', 'Gestionar la calidad (8.2)', { hint: 'Actividad de aseguramiento sobre el proceso.' }),
          cArea('control', 'Controlar la calidad (8.3)', { hint: 'Inspección o prueba sobre el producto.' }),
          cText('responsable', 'Responsable'),
        ]),
        list('herramientas', 'Herramientas de calidad'),
        area('costoCalidad', 'Costo de la calidad', { rows: 3, hint: 'Costos de conformidad (prevención, evaluación) y de no conformidad (fallas internas y externas).' }),
      ]),
      section('mejora', 'No conformidades y mejora', [
        area('procedimientoNoConformidades', 'Tratamiento de no conformidades', { rows: 3 }),
        area('accionesCorrectivas', 'Acciones correctivas', { rows: 3 }),
        area('mejoraContinua', 'Mejora continua', { rows: 3 }),
      ]),
    ],
    example: {
      estandares: [
        'Resolución 4272 de 2021: requisitos mínimos de seguridad para el trabajo en alturas.',
        'Decreto 1072 de 2015: Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).',
        'NSR-10: Reglamento Colombiano de Construcción Sismo Resistente (cargas de diseño).',
        'EN 12810 y EN 12811: andamios de fachada de componentes prefabricados (referencia técnica del fabricante).',
        'Manual técnico del fabricante del sistema multidireccional.',
        'ISO 9001:2015: sistema de gestión de la calidad de la empresa.',
      ],
      objetivos: [
        { id: 'r1', objetivo: 'Entregar cada etapa del andamio conforme al diseño.', metrica: '% de inspecciones conformes', meta: '≥ 95 %', frecuencia: 'Semanal' },
        { id: 'r2', objetivo: 'Certificar cada etapa a la primera.', metrica: 'Etapas certificadas sin observaciones / etapas inspeccionadas', meta: '100 %', frecuencia: 'Por hito' },
        { id: 'r3', objetivo: 'Cero accidentes con incapacidad.', metrica: 'Accidentes con incapacidad', meta: '0', frecuencia: 'Mensual' },
        { id: 'r4', objetivo: 'Satisfacción del cliente con el servicio.', metrica: 'Calificación de la encuesta del director de obra (1 a 5)', meta: '≥ 4,0', frecuencia: 'Por hito' },
        { id: 'r5', objetivo: 'Devolver el equipo en buen estado.', metrica: '% de piezas que regresan sin daño', meta: '≥ 98 %', frecuencia: 'Única vez' },
      ],
      rolesCalidad: [
        { id: 'r1', rol: 'Director de proyecto', responsabilidades: 'Aprueba el plan de calidad, revisa los informes de calidad y asigna recursos para las acciones correctivas.', autoridad: 'Detener la entrega de una etapa no conforme; aprobar acciones correctivas.' },
        { id: 'r2', rol: 'Ingeniero de diseño', responsabilidades: 'Define criterios de aceptación y tolerancias; atiende consultas técnicas; aprueba desviaciones del diseño.', autoridad: 'Aprobar o rechazar desviaciones técnicas.' },
        { id: 'r3', rol: 'Supervisor de montaje', responsabilidades: 'Ejecuta la autoinspección diaria con la lista de verificación y corrige las no conformidades.', autoridad: 'Suspender el montaje de un frente por condiciones inseguras o no conformes.' },
        { id: 'r4', rol: 'Coordinador SST (HSE)', responsabilidades: 'Verifica permisos de trabajo en alturas, EPP, sistemas de protección contra caídas y plan de rescate.', autoridad: 'Detener cualquier trabajo con riesgo inminente.' },
        { id: 'r5', rol: 'Persona competente (inspector certificado)', responsabilidades: 'Inspecciona y certifica cada etapa antes de su uso por el cliente.', autoridad: 'Emitir o negar el certificado de uso (tarjeta verde o roja).' },
        { id: 'r6', rol: 'Interventoría del cliente', responsabilidades: 'Verifica la certificación y aprueba las actas de corte.', autoridad: 'Aceptar o rechazar entregables; suspender el uso de un nivel.' },
      ],
      entregablesRevision: [
        { id: 'r1', entregable: 'Diseño y memoria de cálculo', criterio: 'Cargas según NSR-10 y ficha técnica del fabricante.', aseguramiento: 'Revisión por pares del diseño antes de enviarlo a la interventoría.', control: 'Aprobación del diseño por la interventoría.', responsable: 'Ingeniero de diseño' },
        { id: 'r2', entregable: 'Piezas despachadas desde bodega', criterio: 'Sin deformaciones, corrosión ni soldaduras fisuradas.', aseguramiento: 'Procedimiento de alistamiento con lista de clasificación.', control: 'Inspección del 100 % de las piezas antes del cargue.', responsable: 'Coordinador logístico' },
        { id: 'r3', entregable: 'Andamio montado por etapas', criterio: 'Métricas MC-01 a MC-07 dentro de tolerancia.', aseguramiento: 'Auditoría semanal del proceso de montaje.', control: 'Inspección diaria y certificación por etapa.', responsable: 'Supervisor de montaje' },
        { id: 'r4', entregable: 'Accesos, protecciones y plataforma de descargue', criterio: 'Barandas, rodapiés, malla y escaleras completas; prueba de carga de la plataforma.', aseguramiento: 'Lista de verificación del plan de montaje.', control: 'Inspección antes de habilitar el acceso.', responsable: 'Coordinador SST (HSE)' },
        { id: 'r5', entregable: 'Equipo devuelto a bodega', criterio: 'Inventario conciliado; piezas clasificadas por estado.', aseguramiento: 'Procedimiento de retorno.', control: 'Inspección de retorno y reporte de daños.', responsable: 'Coordinador logístico' },
      ],
      herramientas: [
        'Listas de verificación de montaje e inspección (tarjeta verde o roja).',
        'Hojas de verificación para registrar defectos por tipo.',
        'Diagrama de causa y efecto (Ishikawa).',
        'Diagrama de Pareto de no conformidades.',
        'Diagramas de flujo del proceso de montaje.',
        'Auditorías de proceso.',
      ],
      costoCalidad: 'Costos de conformidad: exámenes médicos y certificación del personal en alturas ($ 2,6 M), inspección y certificación por persona competente ($ 9,6 M), inspecciones semanales y mantenimiento en obra ($ 13,6 M) y calibración de torquímetros. Costos de no conformidad: reprocesos de montaje, piezas dañadas y días de suspensión; se registran en el informe mensual de calidad.',
      procedimientoNoConformidades: 'Toda no conformidad se registra en las mediciones de control de calidad con su causa. El tramo afectado se marca con tarjeta roja y no se usa hasta corregirlo y reinspeccionarlo. Si afecta la estabilidad, se informa el mismo día al ingeniero de diseño y a la interventoría.',
      accionesCorrectivas: 'Cuando una misma causa se repite tres veces en un mes, el supervisor de montaje analiza la causa raíz (Ishikawa) y propone una acción correctiva que aprueba el director de proyecto; su eficacia se verifica en las dos semanas siguientes.',
      mejoraContinua: 'Revisión mensual del Pareto de no conformidades en el comité de obra; las lecciones se registran en el registro de lecciones aprendidas y se incorporan al procedimiento corporativo de montaje (ciclo PHVA).',
    },
  });

  add({
    id: 'metricas-calidad', name: 'Métricas de calidad', abbr: 'MCAL',
    area: 'calidad', group: 'planificacion', process: '8.1', processes: ['8.1'], kind: 'registro', multiple: false,
    purpose: 'Define los atributos del producto o del proceso que se medirán, cómo se medirán y la tolerancia aceptable, para verificar el cumplimiento en el control de calidad.',
    tips: [
      'Cada métrica necesita una definición operacional: qué se mide, con qué instrumento, cómo y cuál es la tolerancia.',
      'Usa torquímetros con certificado de calibración vigente; una herramienta descalibrada invalida las mediciones.',
      'Registra las mediciones con el mismo nombre de la métrica para que el diagrama de Pareto agrupe bien las causas.',
    ],
    sections: [
      section('metricas', 'Métricas', [
        table('metricas', 'Métricas de calidad', [
          cCode('codigo', 'Código'),
          cText('entregable', 'Entregable', { width: 150 }),
          cText('metrica', 'Métrica', { width: 190 }),
          cArea('definicion', 'Definición operacional'),
          cText('metodo', 'Método o instrumento', { width: 180 }),
          cText('tolerancia', 'Tolerancia o criterio', { width: 200 }),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
          cText('responsable', 'Responsable'),
        ], { defaultRows: METRICAS_ANDAMIO }),
      ]),
      section('medicion', 'Medición y registro', [
        area('instrumentos', 'Instrumentos de medición y calibración', { rows: 3 }),
        area('registro', 'Registro de las mediciones', { rows: 3 }),
      ]),
    ],
    example: {
      metricas: [
        ...METRICAS_ANDAMIO.map((m, i) => ({ id: 'r' + (i + 1), ...m })),
        { id: 'r5', codigo: 'MC-05', entregable: 'Andamio montado', metrica: 'Diagonales y arriostramiento', definicion: 'Diagonales en la posición y cantidad indicadas en el plano de montaje.', metodo: 'Comparación con el plano de montaje', tolerancia: '100 % según plano', frecuencia: 'Diaria', responsable: 'Supervisor de montaje' },
        { id: 'r6', codigo: 'MC-06', entregable: 'Plataformas de trabajo', metrica: 'Seguros y pasadores de plataformas', definicion: 'Pasadores con seguro instalado en plataformas y uniones.', metodo: 'Inspección visual', tolerancia: '0 pasadores sin seguro', frecuencia: 'Diaria', responsable: 'Supervisor de montaje' },
        { id: 'r7', codigo: 'MC-07', entregable: 'Andamio montado', metrica: 'Anclajes a la estructura', definicion: 'Cantidad y ubicación de anclajes frente al plano; resistencia al arrancamiento.', metodo: 'Conteo contra plano y ensayo de arrancamiento por muestreo (10 %)', tolerancia: '100 % de anclajes; arrancamiento ≥ carga de diseño', frecuencia: 'Por hito', responsable: 'Ingeniero de diseño' },
      ],
      instrumentos: 'Dos torquímetros con certificado de calibración vigente (renovación semestral), nivel de burbuja de 60 cm, nivel láser, flexómetro y equipo de ensayo de arrancamiento. Los certificados se archivan en la carpeta de calidad del proyecto.',
      registro: 'Cada medición se registra el mismo día en «Mediciones de control de calidad» con fecha, entregable, métrica, resultado y conformidad; las no conformidades incluyen la causa y la acción. El diagrama de Pareto mensual se construye con esas filas.',
    },
  });

  /* Lista de verificación de inspección del andamio (filas iniciales) */
  const LISTA_VERIFICACION_ANDAMIO = [
    { item: 'Apoyos y bases', criterio: 'Bases regulables sobre durmientes, niveladas y sin hundimientos.', referencia: 'Manual del fabricante' },
    { item: 'Montantes', criterio: 'Verticales (desplome ≤ 3 mm/m), sin deformaciones y con uniones completas.', referencia: 'Manual del fabricante' },
    { item: 'Horizontales y diagonales', criterio: 'Instalados según el plano de montaje, con cuñas aseguradas.', referencia: 'Plano de montaje' },
    { item: 'Anclajes', criterio: 'Cantidad y ubicación según plano; abrazaderas con el torque especificado.', referencia: 'Memoria de cálculo' },
    { item: 'Plataformas', criterio: 'Completas, sin vacíos y con seguros puestos.', referencia: 'Manual del fabricante' },
    { item: 'Barandas y rodapiés', criterio: 'Baranda superior, intermedia y rodapié en todo el perímetro de trabajo.', referencia: 'Resolución 4272 de 2021' },
    { item: 'Accesos', criterio: 'Escaleras internas o torre de acceso con trampillas y protección.', referencia: 'Plan de montaje' },
    { item: 'Malla de protección', criterio: 'Instalada y amarrada, sin rasgaduras.', referencia: 'Plan de montaje' },
    { item: 'Señalización', criterio: 'Tarjeta de estado visible (verde: apto; roja: no apto) y capacidad de carga indicada.', referencia: 'Procedimiento de inspección' },
    { item: 'Entorno', criterio: 'Distancia segura a redes eléctricas y zona inferior demarcada.', referencia: 'Resolución 4272 de 2021' },
  ];

  add({
    id: 'documentos-prueba', name: 'Documentos de prueba y evaluación', abbr: 'DPE',
    area: 'calidad', group: 'ejecucion', process: '8.2', processes: ['8.2', '8.3'], kind: 'registro', multiple: false,
    purpose: 'Reúne los protocolos, listas de verificación y pruebas con los que se evalúa si los entregables cumplen los objetivos de calidad, y los criterios de aceptación de cada uno.',
    tips: [
      'Haz que la interventoría apruebe el protocolo de certificación antes de la primera etapa; evita discusiones el día de la inspección.',
      'La inspección de la persona competente es distinta de la autoinspección del montador: ambas deben quedar registradas.',
      'Conserva las listas de verificación firmadas: son evidencia ante la ARL y el Ministerio del Trabajo si ocurre un evento.',
    ],
    sections: [
      section('protocolos', 'Protocolos, pruebas y listas de verificación', [
        table('pruebas', 'Documentos de prueba', [
          cCode('codigo', 'Código'),
          cText('documento', 'Documento', { width: 220 }),
          cText('entregable', 'Entregable evaluado', { width: 180 }),
          cSelect('tipo', 'Tipo', TIPOS_PRUEBA, { width: 210 }),
          cArea('criterio', 'Criterio de aceptación'),
          cText('responsable', 'Responsable'),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
          cText('evidencia', 'Evidencia', { width: 180 }),
        ]),
      ]),
      section('lista', 'Lista de verificación de inspección', [
        table('itemsVerificacion', 'Ítems de la lista de verificación', [
          cText('item', 'Ítem', { width: 170 }),
          cArea('criterio', 'Criterio de aceptación', { width: 280 }),
          cText('referencia', 'Referencia', { width: 180 }),
        ], { defaultRows: LISTA_VERIFICACION_ANDAMIO }),
      ]),
      section('validacion', 'Validación y archivo', [
        area('aprobacionCliente', 'Validación con el cliente y la interventoría', { rows: 3 }),
        text('archivo', 'Ubicación de los registros'),
      ]),
    ],
    example: {
      pruebas: [
        { id: 'r1', codigo: 'PR-01', documento: 'Lista de verificación diaria de andamio (preuso)', entregable: 'Andamio montado', tipo: 'Inspección preoperacional', criterio: 'Ítems 1 a 10 de la lista conformes antes de iniciar labores.', responsable: 'Supervisor de montaje', frecuencia: 'Diaria', evidencia: 'Formato diario firmado' },
        { id: 'r2', codigo: 'PR-02', documento: 'Protocolo de certificación por etapa', entregable: 'Andamio montado (por etapa de cinco niveles)', tipo: 'Protocolo de inspección', criterio: 'Lista completa conforme y métricas MC-01 a MC-07 dentro de tolerancia.', responsable: 'Persona competente (inspector certificado)', frecuencia: 'Por hito', evidencia: 'Certificado de uso y tarjeta verde' },
        { id: 'r3', codigo: 'PR-03', documento: 'Ensayo de arrancamiento de anclajes', entregable: 'Anclajes a la estructura', tipo: 'Ensayo de arrancamiento', criterio: 'El 10 % de los anclajes de cada etapa resiste la carga de diseño sin desplazamiento.', responsable: 'Ingeniero de diseño', frecuencia: 'Por hito', evidencia: 'Informe de ensayo con fotografías' },
        { id: 'r4', codigo: 'PR-04', documento: 'Prueba de carga de la plataforma de descargue del piso 8', entregable: 'Plataforma adicional de descargue (CC-002)', tipo: 'Prueba de carga', criterio: 'Soporta 1,25 veces la carga de trabajo sin deformación permanente.', responsable: 'Ingeniero de diseño', frecuencia: 'Única vez', evidencia: 'Acta de prueba firmada por la interventoría' },
        { id: 'r5', codigo: 'PR-05', documento: 'Inspección de piezas antes del despacho', entregable: 'Piezas despachadas desde bodega', tipo: 'Lista de verificación', criterio: 'Sin deformación, corrosión ni fisuras; cuñas completas.', responsable: 'Coordinador logístico', frecuencia: 'Por evento', evidencia: 'Remisión con lista de piezas inspeccionadas' },
        { id: 'r6', codigo: 'PR-06', documento: 'Auditoría del proceso de montaje', entregable: 'Proceso de montaje', tipo: 'Auditoría', criterio: 'Cumplimiento ≥ 90 % del procedimiento de montaje.', responsable: 'Director de proyecto', frecuencia: 'Mensual', evidencia: 'Informe de auditoría' },
      ],
      itemsVerificacion: LISTA_VERIFICACION_ANDAMIO.map((x, i) => ({ id: 'r' + (i + 1), ...x })),
      aprobacionCliente: 'La interventoría aprobó el protocolo de certificación y el formato de inspección diaria el 21 de agosto de 2026, junto con el diseño. Cualquier cambio a estos documentos se somete a su revisión antes de aplicarlo.',
      archivo: 'Carpeta de calidad del proyecto PRY-2026-014 y copia física en el campamento de obra.',
    },
  });

  add({
    id: 'informe-calidad', name: 'Informe de calidad', abbr: 'ICAL',
    area: 'calidad', group: 'ejecucion', process: '8.2', processes: ['8.2'], kind: 'informe', multiple: true,
    purpose: 'Presenta los resultados de la gestión y el control de la calidad del periodo: cumplimiento de las métricas, incidentes de calidad, acciones correctivas y recomendaciones de mejora.',
    tips: [
      'Muestra los resultados contra la meta de cada métrica, no solo el número de hallazgos.',
      'Incluye el Pareto de causas del periodo y las acciones correctivas con responsable y fecha.',
      'Escala al patrocinador o al cliente solo lo que el equipo no puede resolver; lo demás va como recomendación.',
    ],
    sections: [
      section('general', 'Datos del informe', [
        date('fecha', 'Fecha del informe'),
        date('periodoDesde', 'Periodo desde'),
        date('periodoHasta', 'Periodo hasta'),
        text('elaboradoPor', 'Elaborado por'),
        text('destinatarios', 'Destinatarios'),
      ]),
      section('resultados', 'Resultados del periodo', [
        number('inspecciones', 'Inspecciones realizadas', { min: 0 }),
        number('noConformidades', 'No conformidades', { min: 0 }),
        pct('conformidad', 'Conformidad', { hint: '(Inspecciones − no conformidades) / inspecciones.' }),
        area('resumen', 'Resumen de resultados'),
        table('resultadosMetricas', 'Resultados por métrica', [
          cText('metrica', 'Métrica', { width: 200 }),
          cText('meta', 'Meta', { width: 120 }),
          cText('resultado', 'Resultado', { width: 200 }),
          cSelect('estado', 'Estado', CUMPLIMIENTO_METRICA, { width: 210 }),
          cArea('comentario', 'Comentario'),
        ]),
      ]),
      section('acciones', 'Incidentes de calidad y acciones', [
        table('incidentes', 'Incidentes de calidad y acciones correctivas', [
          cArea('descripcion', 'Incidente'),
          cArea('causa', 'Causa'),
          cArea('accion', 'Acción correctiva'),
          cText('responsable', 'Responsable'),
          cDate('fecha', 'Fecha objetivo'),
          cSelect('estado', 'Estado', ESTADO_ACCION, { width: 110 }),
        ]),
        area('recomendaciones', 'Recomendaciones de mejora', { rows: 3 }),
        area('escalamientos', 'Asuntos escalados', { rows: 2 }),
      ]),
    ],
    example: {
      fecha: '2026-10-01',
      periodoDesde: '2026-09-01',
      periodoHasta: '2026-09-30',
      elaboradoPor: 'Supervisor de montaje y Coordinador SST (HSE)',
      destinatarios: 'Director de proyecto; Interventoría del cliente',
      inspecciones: 42,
      noConformidades: 11,
      conformidad: 73.8,
      resumen: 'En septiembre se montaron los niveles 1 a 5, certificados y aceptados el 21 de septiembre, y avanzó el montaje de los niveles 6 a 10. Se hicieron 42 inspecciones (27 listas de verificación diarias sin hallazgos y 15 mediciones de control registradas), con 11 no conformidades. La conformidad del 73,8 % está por debajo de la meta del 95 %: el 64 % de los defectos se concentra en abrazaderas con torque insuficiente y rodapiés faltantes. No hubo accidentes.',
      resultadosMetricas: [
        { id: 'r1', metrica: 'Torque de abrazaderas (MC-02)', meta: '50 ± 5 N·m', resultado: '4 hallazgos entre 40 y 43 N·m', estado: 'No cumple', comentario: 'Llave de impacto descalibrada usada en el preapriete; se retiró de servicio.' },
        { id: 'r2', metrica: 'Rodapiés y barandas completos (MC-04)', meta: '100 % de plataformas', resultado: '3 hallazgos de rodapiés faltantes', estado: 'No cumple', comentario: 'Incluye los rodapiés retirados en el nivel 4 por el contratista de mampostería del cliente (INC-004).' },
        { id: 'r3', metrica: 'Diagonales y arriostramiento (MC-05)', meta: '100 % según plano', resultado: '2 diagonales mal instaladas', estado: 'Cumple con observaciones', comentario: 'Corregidas el mismo día.' },
        { id: 'r4', metrica: 'Seguros y pasadores (MC-06)', meta: '0 sin seguro', resultado: '1 pasador sin seguro', estado: 'Cumple con observaciones', comentario: 'Corregido durante la inspección.' },
        { id: 'r5', metrica: 'Nivelación de bases regulables (MC-03)', meta: 'Desnivel ≤ 5 mm', resultado: '1 base con desnivel de 9 mm', estado: 'Cumple con observaciones', comentario: 'Corregida antes de continuar el montaje.' },
        { id: 'r6', metrica: 'Verticalidad de montantes (MC-01)', meta: '≤ 3 mm/m', resultado: 'Máximo 2,6 mm/m (24 de septiembre)', estado: 'Cumple', comentario: 'Dentro de la tolerancia, pero el punto del 24 de septiembre quedó fuera de los límites de control; se revisó el aplome de la base y las diagonales del módulo.' },
        { id: 'r7', metrica: 'Certificación de etapas a la primera', meta: '100 %', resultado: 'Etapa 1 certificada sin observaciones', estado: 'Cumple', comentario: 'Certificado del 21 de septiembre de 2026.' },
      ],
      incidentes: [
        { id: 'r1', descripcion: 'Torque insuficiente repetido en abrazaderas de anclaje.', causa: 'Preapriete con llave de impacto sin calibrar y apriete final sin torquímetro.', accion: 'Retirar la llave; apriete final solo con torquímetro calibrado; verificar el 100 % de los anclajes de los niveles 6 a 8.', responsable: 'Supervisor de montaje', fecha: '2026-10-03', estado: 'En curso' },
        { id: 'r2', descripcion: 'Rodapiés faltantes en esquinas y retirados por terceros.', causa: 'Las piezas de esquina llegan al final de la etapa; el contratista de mampostería del cliente retira rodapiés para trabajar.', accion: 'Instalar los rodapiés de esquina al cerrar cada nivel; acordar con el director de obra la prohibición de retirar protecciones.', responsable: 'Coordinador SST (HSE)', fecha: '2026-10-06', estado: 'Abierta' },
        { id: 'r3', descripcion: 'Diagonales invertidas en dos módulos.', causa: 'Montador nuevo sin inducción práctica del sistema multidireccional.', accion: 'Inducción práctica obligatoria antes del primer turno de cada montador nuevo.', responsable: 'Supervisor de montaje', fecha: '2026-09-26', estado: 'Cerrada' },
      ],
      recomendaciones: 'Incluir el torque en la autoinspección diaria del supervisor; reforzar la lista de verificación de cierre de nivel; revisar el Pareto en el comité de obra del 9 de octubre.',
      escalamientos: 'Se informó a la interventoría la reincidencia del torque insuficiente y se solicitó al director de obra controlar a su contratista de mampostería; no se requiere cambio de alcance ni de presupuesto.',
    },
  });

  add({
    id: 'mediciones-control-calidad', name: 'Mediciones de control de calidad', abbr: 'MCC',
    area: 'calidad', group: 'monitoreo', process: '8.3', processes: ['8.3'], kind: 'registro', multiple: false,
    purpose: 'Registra los resultados documentados de las actividades de Controlar la calidad: qué se midió, el resultado, si cumple y, cuando no, la causa del defecto y la acción tomada. Alimenta el diagrama de Pareto.',
    tips: [
      'Registra una fila por medición, conforme o no; así el porcentaje de conformidad es real.',
      'Escribe la causa del defecto con un texto estándar (p. ej., «Abrazadera con torque insuficiente») para que el diagrama de Pareto agrupe correctamente.',
      'Toda no conformidad abre una acción y el tramo queda con tarjeta roja hasta su reinspección.',
    ],
    sections: [
      section('mediciones', 'Mediciones', [
        table('mediciones', 'Mediciones de control de calidad', [
          cDate('fecha', 'Fecha'),
          cText('entregable', 'Entregable', { width: 170 }),
          cText('metrica', 'Métrica', { width: 200 }),
          cText('resultado', 'Resultado', { width: 200 }),
          cSelect('conforme', 'Conforme', SI_NO, { width: 90 }),
          cText('causa', 'Causa del defecto', { width: 220, hint: 'Usa siempre el mismo texto para la misma causa.' }),
          cArea('accion', 'Acción tomada'),
        ]),
      ]),
      section('analisis', 'Análisis', [
        area('conclusiones', 'Conclusiones del periodo', { rows: 3 }),
      ]),
    ],
    example: {
      mediciones: [
        { id: 'r1', fecha: '2026-09-02', entregable: 'Niveles 1 a 5', metrica: 'Torque de abrazaderas', resultado: '42 N·m en 2 de 10 anclajes', conforme: 'No', causa: 'Abrazadera con torque insuficiente', accion: 'Reapriete con torquímetro calibrado y reinspección del tramo.' },
        { id: 'r2', fecha: '2026-09-03', entregable: 'Niveles 1 a 5', metrica: 'Nivelación de bases regulables', resultado: 'Desnivel de 9 mm en el eje C', conforme: 'No', causa: 'Base sin nivelar', accion: 'Ajuste de husillos y verificación con nivel láser.' },
        { id: 'r3', fecha: '2026-09-04', entregable: 'Niveles 1 a 5', metrica: 'Rodapiés y barandas completos', resultado: 'Plataformas del nivel 2 completas', conforme: 'Sí', causa: '', accion: '' },
        { id: 'r4', fecha: '2026-09-07', entregable: 'Niveles 1 a 5', metrica: 'Rodapiés y barandas completos', resultado: 'Sin rodapié en 2 plataformas del nivel 3', conforme: 'No', causa: 'Rodapié faltante', accion: 'Instalación inmediata y charla de 5 minutos sobre la lista de cierre de nivel.' },
        { id: 'r5', fecha: '2026-09-10', entregable: 'Niveles 1 a 5', metrica: 'Verticalidad de montantes', resultado: 'Desplome de 0,1 mm/m', conforme: 'Sí', causa: '', accion: '' },
        { id: 'r6', fecha: '2026-09-11', entregable: 'Niveles 1 a 5', metrica: 'Torque de abrazaderas', resultado: '40 N·m en 3 de 12 anclajes', conforme: 'No', causa: 'Abrazadera con torque insuficiente', accion: 'Reapriete y verificación del 100 % de los anclajes del nivel 4.' },
        { id: 'r7', fecha: '2026-09-14', entregable: 'Niveles 1 a 5', metrica: 'Diagonales y arriostramiento', resultado: 'Diagonal invertida en el módulo 5, eje B', conforme: 'No', causa: 'Diagonal mal instalada', accion: 'Corrección inmediata e inducción práctica al montador.' },
        { id: 'r8', fecha: '2026-09-21', entregable: 'Niveles 1 a 5', metrica: 'Inspección de certificación (lista completa)', resultado: 'Etapa 1 aprobada sin observaciones', conforme: 'Sí', causa: '', accion: '' },
        { id: 'r9', fecha: '2026-09-22', entregable: 'Niveles 6 a 10', metrica: 'Seguros y pasadores de plataformas', resultado: '1 pasador sin seguro en el nivel 6', conforme: 'No', causa: 'Pasador sin seguro', accion: 'Instalación del seguro y verificación de todo el nivel.' },
        { id: 'r10', fecha: '2026-09-24', entregable: 'Niveles 1 a 5', metrica: 'Rodapiés y barandas completos', resultado: 'Rodapiés retirados en el nivel 4 por el contratista de mampostería del cliente', conforme: 'No', causa: 'Rodapié faltante', accion: 'Reposición en 24 horas y solicitud al director de obra para controlar a su contratista (INC-004).' },
        { id: 'r11', fecha: '2026-09-24', entregable: 'Niveles 6 a 10', metrica: 'Verticalidad de montantes', resultado: 'Desplome de 2,6 mm/m en el nivel 7: dentro de la tolerancia, fuera de los límites de control', conforme: 'Sí', causa: '', accion: 'Revisión del aplome de la base y de las diagonales del módulo; seguimiento en la gráfica de control.' },
        { id: 'r12', fecha: '2026-09-25', entregable: 'Niveles 6 a 10', metrica: 'Torque de abrazaderas', resultado: '43 N·m en 2 anclajes del nivel 7', conforme: 'No', causa: 'Abrazadera con torque insuficiente', accion: 'Reapriete con torquímetro calibrado.' },
        { id: 'r13', fecha: '2026-09-28', entregable: 'Niveles 6 a 10', metrica: 'Diagonales y arriostramiento', resultado: 'Diagonal sin acoplar en el módulo 12', conforme: 'No', causa: 'Diagonal mal instalada', accion: 'Acople y verificación del módulo completo.' },
        { id: 'r14', fecha: '2026-09-29', entregable: 'Niveles 6 a 10', metrica: 'Rodapiés y barandas completos', resultado: 'Sin rodapié en dos plataformas de esquina del nivel 8', conforme: 'No', causa: 'Rodapié faltante', accion: 'Instalación de los rodapiés de esquina antes de liberar el nivel.' },
        { id: 'r15', fecha: '2026-09-30', entregable: 'Niveles 6 a 10', metrica: 'Torque de abrazaderas', resultado: '41 N·m en 4 anclajes del nivel 8', conforme: 'No', causa: 'Abrazadera con torque insuficiente', accion: 'Retiro de la llave de impacto descalibrada y reapriete con torquímetro.' },
        { id: 'r16', fecha: '2026-10-01', entregable: 'Niveles 6 a 10', metrica: 'Anclajes a la estructura', resultado: '12 de 12 anclajes del nivel 8 según plano', conforme: 'Sí', causa: '', accion: '' },
      ],
      conclusiones: 'Entre el 2 de septiembre y el 1 de octubre se registraron 16 mediciones con 11 no conformidades. Dos causas concentran el 64 % de los defectos: abrazaderas con torque insuficiente (4) y rodapiés faltantes (3). Las acciones se centran en el uso exclusivo del torquímetro calibrado y en la lista de cierre de nivel. Ver el diagrama de Pareto en la vista Ishikawa y Pareto.',
    },
  });

  /* ================================================================== 9. RECURSOS */

  add({
    id: 'plan-gestion-recursos', name: 'Plan de gestión de los recursos', abbr: 'PGR',
    area: 'recursos', group: 'planificacion', process: '9.1', processes: ['9.1'], kind: 'plan', multiple: false,
    purpose: 'Define cómo se identifican, adquieren, gestionan, desarrollan, controlan y liberan los recursos del equipo y los recursos físicos del proyecto, incluidos los requisitos de seguridad y salud en el trabajo.',
    tips: [
      'Verifica antes del ingreso a obra: certificado de trabajo en alturas vigente, examen médico ocupacional con énfasis en alturas y afiliación a seguridad social (planilla PILA del mes).',
      'Incluye el plan de rescate en alturas y su simulacro antes de iniciar el montaje, como exige la Resolución 4272 de 2021.',
      'Planifica la liberación del personal y del equipo por fases para no pagar recursos ociosos.',
      'Controla las piezas en obra con remisiones firmadas y conciliaciones quincenales; las pérdidas se detectan tarde si se espera al desmontaje.',
    ],
    sections: [
      section('identificacion', 'Identificación y adquisición de recursos', [
        area('identificacion', 'Identificación de los recursos', { rows: 3, hint: 'Métodos para identificar y cuantificar los recursos del equipo y físicos.' }),
        area('adquisicion', 'Adquisición de los recursos', { rows: 3, hint: 'De dónde salen: personal propio, contratación, bodega, subarriendo, compras.' }),
      ]),
      section('roles', 'Roles y responsabilidades', [
        table('roles', 'Roles y responsabilidades', [
          cText('rol', 'Rol', { width: 180 }),
          cArea('autoridad', 'Autoridad'),
          cArea('responsabilidad', 'Responsabilidad'),
          cArea('competencias', 'Competencias'),
        ]),
        area('organigrama', 'Organigrama del proyecto', { rows: 9, hint: 'Estructura jerárquica del equipo; usa sangría o líneas para mostrar dependencias.' }),
      ]),
      section('equipo', 'Gestión y desarrollo del equipo', [
        area('gestionEquipo', 'Gestión del equipo del proyecto', { rows: 3, hint: 'Conformación, jornada, gestión y liberación del personal.' }),
        area('capacitacion', 'Capacitación', { rows: 3 }),
        area('desarrolloEquipo', 'Desarrollo del equipo', { rows: 3 }),
        area('reconocimiento', 'Plan de reconocimiento', { rows: 3 }),
      ]),
      section('control', 'Control de los recursos físicos', [
        area('controlRecursos', 'Control de los recursos', { rows: 3, hint: 'Inventario, mantenimiento, remisiones, pérdidas y reposición.' }),
      ]),
      section('sst', 'Seguridad y salud en el trabajo (SST)', [
        area('seguridad', 'Requisitos de SST del proyecto'),
        list('requisitosIngreso', 'Requisitos de ingreso del personal a obra'),
      ]),
    ],
    example: {
      identificacion: 'Los recursos se identifican desde la EDT y el cronograma: personal por paquete de trabajo (ingeniería, logística, montaje, SST), equipo de andamio según la lista de piezas del diseño (4.800 m² en tres etapas), transporte por viajes y servicios de inspección y exámenes médicos. Las cantidades se consolidan en los requisitos de recursos y en la estructura de desglose de recursos.',
      adquisicion: 'Personal propio asignado por la Gerencia de Operaciones; montadores adicionales con contrato de obra y seguridad social al día. Equipo de andamio de la bodega propia; el faltante (cerca del 10 % de diagonales y plataformas) se subarrienda a un proveedor aliado. Transporte, topografía, inspección y exámenes médicos se contratan según el plan de gestión de las adquisiciones.',
      roles: [
        { id: 'r1', rol: 'Director de proyecto', autoridad: 'Asigna cuadrillas, aprueba compras y subarriendos dentro del presupuesto y autoriza el uso de la reserva para contingencias.', responsabilidad: 'Cumplir las líneas base de alcance, cronograma y costo; dirigir al equipo; informar a Gerencia General.', competencias: 'Dirección de proyectos (PMP o equivalente), liderazgo y negociación.' },
        { id: 'r2', rol: 'Ingeniero de diseño', autoridad: 'Aprueba el diseño, la memoria de cálculo y las desviaciones técnicas.', responsabilidad: 'Diseñar el andamio y los planes de montaje y de rescate; resolver consultas técnicas en obra.', competencias: 'Ingeniero civil con matrícula profesional y experiencia en andamios multidireccionales.' },
        { id: 'r3', rol: 'Residente de obra', autoridad: 'Coordina con el director de obra del cliente el acceso, el acopio y la secuencia.', responsabilidad: 'Programar los frentes diarios, medir el avance y elaborar las actas de corte.', competencias: 'Ingeniero o tecnólogo en construcción; manejo de cronogramas.' },
        { id: 'r4', rol: 'Supervisor de montaje', autoridad: 'Suspende el montaje por condiciones inseguras o no conformidades.', responsabilidad: 'Dirigir la cuadrilla, ejecutar la autoinspección y cumplir el plan de montaje.', competencias: 'Coordinador de trabajo en alturas (Resolución 4272 de 2021) y cinco años en montaje.' },
        { id: 'r5', rol: 'Coordinador SST (HSE)', autoridad: 'Detiene cualquier trabajo con riesgo inminente.', responsabilidad: 'Permisos de trabajo en alturas, inspección de EPP y sistemas de protección contra caídas, simulacros de rescate y reportes a la ARL.', competencias: 'Profesional en SST con licencia vigente y curso de 50 horas del SG-SST.' },
        { id: 'r6', rol: 'Cuadrilla de montaje (montadores certificados)', autoridad: 'Puede negarse a trabajar en condiciones inseguras.', responsabilidad: 'Montar, mantener y desmontar el andamio según el plan.', competencias: 'Certificado de trabajo seguro en alturas nivel avanzado y examen médico ocupacional vigentes.' },
        { id: 'r7', rol: 'Coordinador logístico', autoridad: 'Programa los despachos y asigna vehículos.', responsabilidad: 'Alistamiento, transporte, permisos de cargue y descargue e inventario en obra.', competencias: 'Logística de carga y conocimiento de las restricciones de circulación en Bogotá.' },
      ],
      organigrama: 'Gerencia General (patrocinador)\n└─ Director de proyecto\n   ├─ Ingeniero de diseño\n   ├─ Residente de obra\n   │  ├─ Supervisor de montaje — frente 1\n   │  │  └─ Cuadrilla de montaje A (6 montadores)\n   │  └─ Supervisor de montaje — frente 2 (desde el 13 de octubre)\n   │     └─ Cuadrilla de montaje B (6 montadores)\n   ├─ Coordinador SST (HSE)\n   ├─ Coordinador logístico\n   │  └─ Almacén\n   └─ Facturación y cartera (apoyo)',
      gestionEquipo: 'El equipo se conforma por fases: ingeniería (agosto), logística (agosto), montaje y operación (septiembre a noviembre) y desmontaje (noviembre y diciembre). Jornada de lunes a sábado de 7:00 a 17:00, con jornada extendida pactada para días secos en temporada de lluvias. Al terminar su fase, cada integrante se libera con entrega de pendientes y registro de lecciones aprendidas.',
      capacitacion: 'Inducción al proyecto y al plan de rescate para todo el personal; reentrenamiento anual en alturas; inducción práctica del sistema multidireccional para montadores nuevos antes de su primer turno; charla diaria de 5 minutos al iniciar la jornada.',
      desarrolloEquipo: 'Reunión semanal del equipo con los indicadores de calidad y SST; rotación de montadores entre frentes para nivelar competencias; acompañamiento del supervisor a los montadores nuevos durante dos semanas.',
      reconocimiento: 'Bonificación por etapa certificada a la primera y sin accidentes; reconocimiento mensual a la cuadrilla con mejor resultado en las inspecciones; mención en el informe a Gerencia General.',
      controlRecursos: 'Inventario de piezas en obra con remisiones firmadas y conciliación quincenal contra el inventario del sistema; mantenimiento preventivo semanal; las piezas dañadas se separan con tarjeta roja y se reportan a almacén. La utilización real se compara con la planificada en la vista de recursos.',
      seguridad: 'El proyecto se rige por el SG-SST de la empresa (Decreto 1072 de 2015) y la Resolución 4272 de 2021: permiso de trabajo en alturas diario, coordinador de alturas en cada frente, sistemas de protección contra caídas certificados, plan de rescate con simulacro antes de iniciar el montaje y reporte de accidentes a la ARL dentro de los 2 días hábiles siguientes.',
      requisitosIngreso: [
        'Afiliación vigente a EPS, fondo de pensiones y ARL (planilla PILA del mes).',
        'Certificado de trabajo seguro en alturas nivel avanzado vigente.',
        'Examen médico ocupacional con énfasis en trabajo en alturas.',
        'Inducción SST del proyecto y de la obra del cliente.',
        'EPP y sistema personal de protección contra caídas inspeccionados.',
      ],
    },
  });

  add({
    id: 'acta-constitucion-equipo', name: 'Acta de constitución del equipo', abbr: 'ACE',
    area: 'recursos', group: 'planificacion', process: '9.1', processes: ['9.1', '9.4', '9.5'], kind: 'documento', multiple: false,
    purpose: 'Establece los valores, acuerdos y pautas de trabajo del equipo del proyecto: comunicación, toma de decisiones, resolución de conflictos y reuniones.',
    tips: [
      'Redáctala con el equipo, no para el equipo: los acuerdos que la cuadrilla propone se cumplen mejor.',
      'Deja explícito que cualquier persona puede detener un trabajo inseguro sin represalias.',
      'Revísala cuando ingresen nuevos integrantes o al iniciar una fase.',
    ],
    sections: [
      section('valores', 'Valores del equipo', [
        list('valores', 'Valores'),
      ]),
      section('pautas', 'Pautas de trabajo', [
        area('pautasComunicacion', 'Pautas de comunicación', { rows: 3 }),
        area('tomaDecisiones', 'Criterios para la toma de decisiones', { rows: 3 }),
        area('resolucionConflictos', 'Proceso de resolución de conflictos', { rows: 3 }),
        area('pautasReuniones', 'Pautas para las reuniones', { rows: 3 }),
      ]),
      section('acuerdos', 'Acuerdos del equipo', [
        list('acuerdos', 'Otros acuerdos'),
        text('vigencia', 'Vigencia y revisión'),
        table('firmantes', 'Integrantes que suscriben el acta', [
          cText('rol', 'Rol', { width: 220 }),
          cText('organizacion', 'Organización', { width: 200 }),
          cDate('fecha', 'Fecha de adhesión'),
        ]),
      ]),
    ],
    example: {
      valores: [
        'La seguridad primero: nadie trabaja en condiciones inseguras.',
        'Cumplimos lo que prometemos al cliente.',
        'Respeto entre compañeros y con el personal de la obra.',
        'Transparencia: los problemas se informan a tiempo.',
      ],
      pautasComunicacion: 'Las instrucciones de obra se dan en la charla de las 7:00. Las novedades urgentes se informan por llamada al supervisor y luego quedan en el grupo de mensajería del proyecto. Toda solicitud del cliente se remite al residente de obra; nadie acuerda cambios directamente con el personal del cliente.',
      tomaDecisiones: 'Las decisiones técnicas las toma el ingeniero de diseño; las de secuencia y frentes, el residente con el supervisor; las de costo y cronograma, el director de proyecto. Las decisiones de SST no se someten a votación: el coordinador SST puede detener el trabajo.',
      resolucionConflictos: 'Primero se conversa entre las partes. Si no hay acuerdo el mismo día, interviene el supervisor; si persiste, el director de proyecto decide en un máximo de 48 horas. Los conflictos con personal del cliente se manejan por medio del residente.',
      pautasReuniones: 'Charla diaria de 10 minutos a las 7:00; reunión de equipo los lunes a las 16:00 (30 minutos); comité de obra con el cliente los viernes a las 7:00. Se empieza a tiempo, con agenda, y se cierra con compromisos y responsables.',
      acuerdos: [
        'Celulares solo en zonas seguras, nunca sobre el andamio.',
        'Orden y aseo al cerrar cada jornada.',
        'Nadie sube al andamio sin tarjeta verde vigente.',
        'Toda pieza dañada o faltante se reporta el mismo día.',
      ],
      vigencia: 'Del 3 de agosto de 2026 hasta el cierre del proyecto; se revisa al inicio de cada fase.',
      firmantes: [
        { id: 'r1', rol: 'Director de proyecto', organizacion: EJ.empresa, fecha: '2026-08-04' },
        { id: 'r2', rol: 'Ingeniero de diseño', organizacion: EJ.empresa, fecha: '2026-08-04' },
        { id: 'r3', rol: 'Residente de obra', organizacion: EJ.empresa, fecha: '2026-08-04' },
        { id: 'r4', rol: 'Coordinador SST (HSE)', organizacion: EJ.empresa, fecha: '2026-08-04' },
        { id: 'r5', rol: 'Coordinador logístico', organizacion: EJ.empresa, fecha: '2026-08-04' },
        { id: 'r6', rol: 'Supervisor de montaje', organizacion: EJ.empresa, fecha: '2026-08-31' },
        { id: 'r7', rol: 'Cuadrilla de montaje A (representante)', organizacion: EJ.empresa, fecha: '2026-08-31' },
      ],
    },
  });

  add({
    id: 'requisitos-recursos', name: 'Requisitos de recursos', abbr: 'RREC',
    area: 'recursos', group: 'planificacion', process: '9.2', processes: ['9.2', '9.3'], kind: 'registro', multiple: false,
    purpose: 'Identifica los tipos y cantidades de recursos que requiere cada paquete de trabajo o actividad, con la base de la estimación.',
    tips: [
      'Estima los recursos por paquete de trabajo o actividad e indica la base de cada estimación (rendimiento, histórico o cotización).',
      'Cruza la cantidad de montadores con el inventario de certificados de alturas vigentes antes de comprometer fechas.',
      'Revisa la vista de recursos para detectar sobreasignaciones y nivelar el histograma.',
    ],
    sections: [
      section('requisitos', 'Requisitos por paquete de trabajo', [
        table('requisitos', 'Requisitos de recursos', [
          cCode('paqueteEdt', 'EDT'),
          cText('actividad', 'Actividad', { width: 190 }),
          cSelect('categoria', 'Categoría', CATEGORIAS_RECURSO, { width: 120 }),
          cText('recurso', 'Recurso', { width: 200 }),
          cNum('cantidad', 'Cantidad', { min: 0 }),
          cText('unidad', 'Unidad', { width: 90 }),
          cDate('desde', 'Desde'),
          cDate('hasta', 'Hasta'),
          cArea('especificacion', 'Especificación o competencia'),
        ]),
      ]),
      section('base', 'Base de las estimaciones', [
        area('baseEstimacion', 'Base de las estimaciones de recursos', { rows: 3 }),
        list('supuestos', 'Supuestos'),
      ]),
    ],
    example: {
      requisitos: [
        { id: 'r1', paqueteEdt: '1.2', actividad: 'Diseño y memoria de cálculo', categoria: 'Personal', recurso: 'Ingeniero de diseño', cantidad: 1, unidad: 'persona', desde: '2026-08-03', hasta: '2026-08-21', especificacion: 'Ingeniero civil con matrícula profesional y experiencia en andamios multidireccionales.' },
        { id: 'r2', paqueteEdt: '1.2', actividad: 'Levantamiento topográfico y de fachada', categoria: 'Servicios', recurso: 'Comisión de topografía', cantidad: 1, unidad: 'global', desde: '2026-08-03', hasta: '2026-08-06', especificacion: 'Dos topógrafos con estación total.' },
        { id: 'r3', paqueteEdt: '1.3', actividad: 'Alistamiento, inspección de salida y remisiones', categoria: 'Personal', recurso: 'Operarios de bodega', cantidad: 4, unidad: 'persona', desde: '2026-08-18', hasta: '2026-08-25', especificacion: 'Inducción en inspección y clasificación de piezas; montacargas de bodega.' },
        { id: 'r4', paqueteEdt: '1.3', actividad: 'Transporte a obra', categoria: 'Transporte', recurso: 'Tractomula con conductor', cantidad: 6, unidad: 'viaje', desde: '2026-08-26', hasta: '2026-08-28', especificacion: 'Despachos nocturnos; SOAT, revisión técnico-mecánica y póliza de responsabilidad civil vigentes.' },
        { id: 'r5', paqueteEdt: '1.5', actividad: 'Alquiler del andamio en obra', categoria: 'Equipos', recurso: 'Andamio multidireccional', cantidad: 4800, unidad: 'm²', desde: '2026-08-27', hasta: '2026-12-12', especificacion: 'Sistema galvanizado con plataformas, barandas, rodapiés y anclajes; cerca del 10 % de diagonales y plataformas subarrendadas.' },
        { id: 'r6', paqueteEdt: '1.4', actividad: 'Montaje de los niveles 1 a 10, accesos y protecciones', categoria: 'Personal', recurso: 'Cuadrilla de montaje A', cantidad: 6, unidad: 'persona', desde: '2026-08-31', hasta: '2026-11-12', especificacion: 'Montadores con certificado de trabajo en alturas nivel avanzado vigente.' },
        { id: 'r7', paqueteEdt: '1.4', actividad: 'Montaje de los niveles 11 a 15', categoria: 'Personal', recurso: 'Cuadrilla de montaje B', cantidad: 6, unidad: 'persona', desde: '2026-10-13', hasta: '2026-11-12', especificacion: 'Montadores con certificado de trabajo en alturas nivel avanzado vigente.' },
        { id: 'r8', paqueteEdt: '1.4', actividad: 'Supervisión de montaje y desmontaje', categoria: 'Personal', recurso: 'Supervisor de montaje', cantidad: 2, unidad: 'persona', desde: '2026-08-31', hasta: '2026-12-12', especificacion: 'Coordinador de trabajo en alturas; el segundo desde el 13 de octubre.' },
        { id: 'r9', paqueteEdt: '1.4', actividad: 'Apriete de anclajes', categoria: 'Equipos', recurso: 'Torquímetro calibrado', cantidad: 2, unidad: 'unidad', desde: '2026-08-31', hasta: '2026-11-12', especificacion: 'Certificado de calibración vigente.' },
        { id: 'r10', paqueteEdt: '1.4', actividad: 'Izaje desde el nivel 6', categoria: 'Equipos', recurso: 'Grúa torre del cliente', cantidad: 4, unidad: 'hora/día', desde: '2026-09-19', hasta: '2026-10-31', especificacion: 'Suministro del cliente; ventana fija de 7:00 a 9:00 desde el 1 de octubre.' },
        { id: 'r11', paqueteEdt: '1.5', actividad: 'Inspección y certificación por etapa', categoria: 'Servicios', recurso: 'Persona competente (inspector certificado)', cantidad: 6, unidad: 'jornada', desde: '2026-09-19', hasta: '2026-11-12', especificacion: 'Inspector independiente del montador.' },
        { id: 'r12', paqueteEdt: '1.6', actividad: 'Desmontaje de los niveles 15 a 1', categoria: 'Personal', recurso: 'Cuadrilla de desmontaje (montadores de las cuadrillas A y B)', cantidad: 8, unidad: 'persona', desde: '2026-11-27', hasta: '2026-12-12', especificacion: 'Montadores certificados; el desmontaje rinde cerca de 1,4 veces el montaje.' },
        { id: 'r13', paqueteEdt: '1.6', actividad: 'Transporte de retorno', categoria: 'Transporte', recurso: 'Tractomula con conductor', cantidad: 6, unidad: 'viaje', desde: '2026-12-14', hasta: '2026-12-16', especificacion: 'Despachos nocturnos.' },
      ],
      baseEstimacion: 'Cantidades de equipo según la lista de piezas del diseño (4.800 m² de fachada en tres costados). Personal de montaje con el rendimiento histórico de 90 a 95 m² por día de cuadrilla de seis montadores; transporte con capacidad de 800 m² de andamio por tractomula. Fechas según la línea base del cronograma (LB1); la cuadrilla B se agregó el 29 de septiembre para recuperar el atraso. Servicios según cotizaciones.',
      supuestos: [
        'La grúa torre del cliente está disponible 4 horas diarias para izaje desde el nivel 6 (descartado el 15 de septiembre; ver INC-003).',
        'Hay 12 montadores con certificado de alturas vigente disponibles en la empresa.',
        'El inventario de bodega cubre cerca del 90 % de las piezas.',
      ],
    },
  });

  add({
    id: 'estructura-desglose-recursos', name: 'Estructura de desglose de recursos (EDR)', abbr: 'EDR',
    area: 'recursos', group: 'planificacion', process: '9.2', processes: ['9.2', '9.3', '9.6'], kind: 'registro', multiple: false,
    purpose: 'Representa jerárquicamente los recursos del proyecto por categoría y tipo, para organizar la planificación, la asignación, los costos y el control de los recursos.',
    tips: [
      'Organiza los recursos por categoría y tipo con códigos jerárquicos (1, 1.1, 1.1.1) para agrupar cantidades y costos.',
      'Usa los mismos nombres de recursos en el cronograma para que la vista de recursos los consolide.',
      'Indica la fuente (interno, contratado, subarriendo o suministro del cliente) para conectar la EDR con el plan de adquisiciones.',
    ],
    sections: [
      section('recursos', 'Estructura de desglose', [
        table('recursos', 'Recursos', [
          cCode('codigo', 'Código'),
          cSelect('categoria', 'Categoría', CATEGORIAS_RECURSO, { width: 120 }),
          cText('recurso', 'Recurso', { width: 220 }),
          cArea('descripcion', 'Descripción o especificación'),
          cText('unidad', 'Unidad', { width: 90 }),
          cMoney('costoUnitario', 'Tarifa o costo unitario'),
          cSelect('fuente', 'Fuente', FUENTES_RECURSO, { width: 190 }),
        ], {
          defaultRows: [
            { codigo: '1', categoria: 'Personal', recurso: 'Personal', descripcion: 'Roles de dirección, ingeniería, supervisión y cuadrillas.' },
            { codigo: '2', categoria: 'Equipos', recurso: 'Equipos', descripcion: 'Andamio, herramientas y equipos de izaje.' },
            { codigo: '3', categoria: 'Materiales', recurso: 'Materiales', descripcion: 'Consumibles, malla y repuestos.' },
            { codigo: '4', categoria: 'Transporte', recurso: 'Transporte', descripcion: 'Vehículos de carga y viajes.' },
            { codigo: '5', categoria: 'Servicios', recurso: 'Servicios', descripcion: 'Servicios técnicos, de salud ocupacional e inspección.' },
          ],
        }),
      ]),
    ],
    example: {
      recursos: [
        { id: 'r1', codigo: '1', categoria: 'Personal', recurso: 'Personal', descripcion: 'Roles de dirección, ingeniería, supervisión y cuadrillas.' },
        { id: 'r2', codigo: '1.1', categoria: 'Personal', recurso: 'Director de proyecto', descripcion: 'Dedicación del 50 %.', unidad: 'mes', costoUnitario: 5200000, fuente: 'Interno' },
        { id: 'r3', codigo: '1.2', categoria: 'Personal', recurso: 'Ingeniero de diseño', descripcion: 'Diseño, memoria de cálculo y planes de montaje, rescate e izaje.', unidad: 'hora', costoUnitario: 100000, fuente: 'Interno' },
        { id: 'r4', codigo: '1.3', categoria: 'Personal', recurso: 'Residente de obra', descripcion: 'Coordinación en obra, inspecciones semanales y actas de corte.', unidad: 'mes', costoUnitario: 4000000, fuente: 'Interno' },
        { id: 'r5', codigo: '1.4', categoria: 'Personal', recurso: 'Supervisor de montaje', descripcion: 'Coordinador de trabajo en alturas; su costo se incluye en el día de cuadrilla.', unidad: 'mes', costoUnitario: 3900000, fuente: 'Interno' },
        { id: 'r6', codigo: '1.5', categoria: 'Personal', recurso: 'Cuadrilla de montaje', descripcion: 'Seis montadores certificados en alturas con supervisor, malacate y herramienta menor; incluye prestaciones, seguridad social, dotación y EPP.', unidad: 'día de cuadrilla', costoUnitario: 2800000, fuente: 'Interno' },
        { id: 'r7', codigo: '1.6', categoria: 'Personal', recurso: 'Coordinador SST (HSE)', descripcion: 'Licencia SST vigente; su costo se prorratea en el día de cuadrilla.', unidad: 'mes', costoUnitario: 3800000, fuente: 'Interno' },
        { id: 'r8', codigo: '1.7', categoria: 'Personal', recurso: 'Operario de bodega', descripcion: 'Alistamiento, inspección y clasificación de piezas.', unidad: 'jornal', costoUnitario: 150000, fuente: 'Interno' },
        { id: 'r9', codigo: '2', categoria: 'Equipos', recurso: 'Equipos', descripcion: 'Andamio, herramientas y equipos de izaje.' },
        { id: 'r10', codigo: '2.1', categoria: 'Equipos', recurso: 'Andamio multidireccional propio', descripcion: '4.800 m²; tarifa interna de alquiler (depreciación y mantenimiento del lote asignado).', unidad: 'mes', costoUnitario: 14600000, fuente: 'Interno' },
        { id: 'r11', codigo: '2.2', categoria: 'Equipos', recurso: 'Diagonales y plataformas subarrendadas', descripcion: 'Piezas compatibles con el sistema (≈ 10 % del inventario).', unidad: 'mes', costoUnitario: 2400000, fuente: 'Subarriendo' },
        { id: 'r12', codigo: '2.3', categoria: 'Equipos', recurso: 'Torquímetros y herramienta menor', descripcion: 'Con certificado de calibración.', unidad: 'unidad', fuente: 'Interno' },
        { id: 'r13', codigo: '2.4', categoria: 'Equipos', recurso: 'Grúa torre', descripcion: 'Izaje desde el nivel 6; ventana fija de 7:00 a 9:00.', unidad: 'hora', fuente: 'Suministro del cliente' },
        { id: 'r14', codigo: '2.5', categoria: 'Equipos', recurso: 'Camión grúa y montacargas de bodega', descripcion: 'Descargue en obra, cargue de retorno y movimiento de paquetes en bodega.', unidad: 'día', fuente: 'Interno' },
        { id: 'r15', codigo: '3', categoria: 'Materiales', recurso: 'Materiales', descripcion: 'Consumibles, malla y repuestos.' },
        { id: 'r16', codigo: '3.1', categoria: 'Materiales', recurso: 'Anclajes químicos, tornillería y amarres', descripcion: 'Por etapa de cinco niveles, según la memoria de cálculo.', unidad: 'global', costoUnitario: 10000000, fuente: 'Contratado' },
        { id: 'r17', codigo: '3.2', categoria: 'Materiales', recurso: 'Repuestos y mantenimiento de piezas', descripcion: 'Cuñas, pasadores, pintura y enderezado antes del despacho.', unidad: 'global', costoUnitario: 2300000, fuente: 'Contratado' },
        { id: 'r18', codigo: '3.3', categoria: 'Materiales', recurso: 'Malla de protección', descripcion: '2.400 m² de inventario propio, color verde estándar.', unidad: 'm²', fuente: 'Interno' },
        { id: 'r19', codigo: '4', categoria: 'Transporte', recurso: 'Transporte', descripcion: 'Vehículos de carga y viajes.' },
        { id: 'r20', codigo: '4.1', categoria: 'Transporte', recurso: 'Tractomula con conductor', descripcion: 'Ida y retorno; despachos nocturnos.', unidad: 'viaje', costoUnitario: 1900000, fuente: 'Contratado' },
        { id: 'r21', codigo: '5', categoria: 'Servicios', recurso: 'Servicios', descripcion: 'Servicios técnicos, de salud ocupacional e inspección.' },
        { id: 'r22', codigo: '5.1', categoria: 'Servicios', recurso: 'Levantamiento topográfico', descripcion: 'Fachada de la Torre 2.', unidad: 'global', costoUnitario: 3600000, fuente: 'Contratado' },
        { id: 'r23', codigo: '5.2', categoria: 'Servicios', recurso: 'Ensayo de arrancamiento de anclajes', descripcion: 'Laboratorio de ensayos; ensayo en losa antes del diseño definitivo.', unidad: 'global', costoUnitario: 1900000, fuente: 'Contratado' },
        { id: 'r24', codigo: '5.3', categoria: 'Servicios', recurso: 'Inspección y certificación', descripcion: 'Persona competente independiente del montador.', unidad: 'jornada', costoUnitario: 1600000, fuente: 'Contratado' },
        { id: 'r25', codigo: '5.4', categoria: 'Servicios', recurso: 'Exámenes médicos ocupacionales', descripcion: 'Con énfasis en trabajo en alturas.', unidad: 'persona', costoUnitario: 230000, fuente: 'Contratado' },
      ],
    },
  });

  add({
    id: 'asignaciones-recursos', name: 'Asignaciones de recursos físicos y del equipo', abbr: 'ASIG',
    area: 'recursos', group: 'ejecucion', process: '9.3', processes: ['9.3', '9.4', '9.6'], kind: 'registro', multiple: false,
    purpose: 'Documenta qué personas y qué recursos físicos (equipos, materiales, ubicaciones) quedaron asignados al proyecto, por cuánto tiempo y dónde, junto con los calendarios de recursos.',
    tips: [
      'Registra la remisión o el documento de salida de cada lote enviado a obra: es la base para la conciliación y el cobro de faltantes.',
      'Incluye en el calendario los festivos de Colombia, el horario de la obra y la restricción de circulación de vehículos de carga en Bogotá (el llamado pico y placa de carga).',
      'Verifica la vigencia de certificados y exámenes al asignar a cada persona; no asignes a nadie con documentos vencidos.',
    ],
    sections: [
      section('equipo', 'Asignaciones del equipo del proyecto', [
        table('equipo', 'Equipo del proyecto', [
          cText('rol', 'Rol', { width: 170 }),
          cText('asignado', 'Asignado', { width: 220 }),
          cText('organizacion', 'Organización', { width: 170 }),
          cPct('dedicacion', 'Dedicación (%)'),
          cDate('desde', 'Desde'),
          cDate('hasta', 'Hasta'),
          cCode('paqueteEdt', 'EDT', { width: 110 }),
          cText('certificaciones', 'Certificaciones vigentes', { width: 200 }),
        ]),
      ]),
      section('fisicos', 'Asignaciones de recursos físicos', [
        table('fisicos', 'Recursos físicos', [
          cText('recurso', 'Recurso', { width: 220 }),
          cNum('cantidad', 'Cantidad', { min: 0 }),
          cText('unidad', 'Unidad', { width: 80 }),
          cText('ubicacion', 'Ubicación', { width: 180 }),
          cDate('desde', 'Desde'),
          cDate('hasta', 'Hasta'),
          cText('documento', 'Remisión o documento', { width: 160 }),
          cSelect('estado', 'Estado', ESTADO_RECURSO_FISICO, { width: 140 }),
        ]),
      ]),
      section('calendarios', 'Calendarios de recursos', [
        area('calendario', 'Calendario de trabajo y disponibilidad'),
      ]),
    ],
    example: {
      equipo: [
        { id: 'r1', rol: 'Director de proyecto', asignado: 'Director de proyecto de la Gerencia de Operaciones', organizacion: EJ.empresa, dedicacion: 50, desde: '2026-08-03', hasta: '2026-12-18', paqueteEdt: '1.1', certificaciones: 'PMP vigente' },
        { id: 'r2', rol: 'Ingeniero de diseño', asignado: 'Ingeniero del área técnica', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-08-03', hasta: '2026-08-21', paqueteEdt: '1.2', certificaciones: 'Matrícula profesional' },
        { id: 'r3', rol: 'Residente de obra', asignado: 'Residente asignado a la obra Altavista', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-08-17', hasta: '2026-12-18', paqueteEdt: '1.4 a 1.6', certificaciones: 'Alturas nivel avanzado' },
        { id: 'r4', rol: 'Supervisor de montaje (frente 1)', asignado: 'Supervisor con rol de coordinador de alturas', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-08-31', hasta: '2026-12-16', paqueteEdt: '1.4 / 1.6', certificaciones: 'Coordinador de trabajo en alturas' },
        { id: 'r5', rol: 'Supervisor de montaje (frente 2)', asignado: 'Supervisor adicional para el segundo frente', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-10-13', hasta: '2026-12-16', paqueteEdt: '1.4 / 1.6', certificaciones: 'Coordinador de trabajo en alturas' },
        { id: 'r6', rol: 'Cuadrilla de montaje A', asignado: 'Seis montadores certificados', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-08-31', hasta: '2026-12-16', paqueteEdt: '1.4 / 1.6', certificaciones: 'Alturas nivel avanzado (6 de 6)' },
        { id: 'r7', rol: 'Cuadrilla de montaje B', asignado: 'Seis montadores certificados (contrato de obra)', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-10-13', hasta: '2026-12-16', paqueteEdt: '1.4 / 1.6', certificaciones: 'Alturas nivel avanzado (6 de 6)' },
        { id: 'r8', rol: 'Coordinador SST (HSE)', asignado: 'Profesional SST del proyecto', organizacion: EJ.empresa, dedicacion: 100, desde: '2026-08-04', hasta: '2026-12-16', paqueteEdt: '1.1 / 1.5', certificaciones: 'Licencia SST y curso de 50 horas del SG-SST' },
        { id: 'r9', rol: 'Coordinador logístico', asignado: 'Coordinador de bodega', organizacion: EJ.empresa, dedicacion: 40, desde: '2026-08-10', hasta: '2026-12-18', paqueteEdt: '1.3 / 1.6', certificaciones: '' },
      ],
      fisicos: [
        { id: 'r1', recurso: 'Andamio multidireccional, etapa 1 (niveles 1 a 5)', cantidad: 1600, unidad: 'm²', ubicacion: 'Torre 2, fachadas norte, oriente y occidente', desde: '2026-08-26', hasta: '2026-12-16', documento: 'Remisiones 0815 y 0816', estado: 'En obra' },
        { id: 'r2', recurso: 'Andamio multidireccional, etapa 2 (niveles 6 a 10)', cantidad: 1600, unidad: 'm²', ubicacion: 'Torre 2 y acopio sur', desde: '2026-08-27', hasta: '2026-12-16', documento: 'Remisiones 0817 y 0818', estado: 'En obra' },
        { id: 'r3', recurso: 'Andamio multidireccional, etapa 3 (niveles 11 a 15)', cantidad: 1600, unidad: 'm²', ubicacion: 'Acopio en obra, zona sur', desde: '2026-08-28', hasta: '2026-12-16', documento: 'Remisiones 0819 y 0820', estado: 'En obra' },
        { id: 'r4', recurso: 'Diagonales y plataformas subarrendadas', cantidad: 520, unidad: 'unidad', ubicacion: 'Torre 2', desde: '2026-08-27', hasta: '2026-12-16', documento: 'Contrato CA-2026-045 y otrosí n.º 1 (OC-031)', estado: 'En obra' },
        { id: 'r5', recurso: 'Malla de protección', cantidad: 2400, unidad: 'm²', ubicacion: 'Torre 2', desde: '2026-08-26', hasta: '2026-12-16', documento: 'Remisión 0815', estado: 'En obra' },
        { id: 'r6', recurso: 'Torquímetro calibrado', cantidad: 2, unidad: 'unidad', ubicacion: 'Campamento de obra', desde: '2026-08-31', hasta: '2026-12-16', documento: 'Salida de almacén 1142', estado: 'En obra' },
        { id: 'r7', recurso: 'Llave de impacto', cantidad: 1, unidad: 'unidad', ubicacion: 'Bodega, taller de mantenimiento', desde: '2026-08-31', hasta: '2026-10-01', documento: 'Salida de almacén 1143', estado: 'En mantenimiento' },
      ],
      calendario: 'Jornada de lunes a sábado de 7:00 a 17:00, con jornada extendida de 10 horas en días secos durante la temporada de lluvias. No se trabaja en los festivos de Colombia del periodo: 7 y 17 de agosto, 12 de octubre, 2 y 16 de noviembre y 8 de diciembre de 2026. Izaje con la grúa del cliente en la ventana fija de 7:00 a 9:00 desde el 1 de octubre. Despachos de carga nocturnos por la restricción de circulación de vehículos de carga en Bogotá. Cuadrilla B disponible desde el 13 de octubre (el 12 es festivo).',
    },
  });

  add({
    id: 'evaluacion-desempeno-equipo', name: 'Evaluaciones de desempeño del equipo', abbr: 'EDE',
    area: 'recursos', group: 'ejecucion', process: '9.4', processes: ['9.4', '9.5'], kind: 'registro', multiple: false,
    purpose: 'Evalúa de manera formal la eficacia del equipo (competencias, cumplimiento de SST, productividad, colaboración y comunicación) para identificar fortalezas, necesidades de capacitación y acciones de desarrollo.',
    tips: [
      'Evalúa con la misma escala y los mismos criterios cada vez; así se ven las tendencias.',
      'Retroalimenta en privado y reconoce en público.',
      'Convierte cada oportunidad de mejora en una acción concreta con fecha (capacitación, acompañamiento o rotación).',
    ],
    sections: [
      section('evaluaciones', 'Evaluaciones', [
        table('evaluaciones', 'Evaluaciones de desempeño', [
          cDate('fecha', 'Fecha'),
          cText('equipo', 'Equipo o cuadrilla', { width: 190 }),
          cScale('tecnica', 'Competencia técnica', ESCALA_DESEMPENO),
          cScale('seguridad', 'Cumplimiento SST', ESCALA_DESEMPENO),
          cScale('productividad', 'Productividad', ESCALA_DESEMPENO),
          cScale('colaboracion', 'Colaboración', ESCALA_DESEMPENO),
          cScale('comunicacion', 'Comunicación', ESCALA_DESEMPENO),
          cCalc('promedio', 'Promedio', calcAverage(['tecnica', 'seguridad', 'productividad', 'colaboracion', 'comunicacion']), fmtScore, { hint: 'Promedio de las calificaciones registradas.' }),
          cArea('fortalezas', 'Fortalezas'),
          cArea('mejoras', 'Oportunidades de mejora'),
          cArea('accion', 'Acción de desarrollo'),
        ]),
        area('criterios', 'Escala y criterios de evaluación', { rows: 3 }),
      ]),
      section('indicadores', 'Indicadores del equipo', [
        table('indicadores', 'Indicadores', [
          cText('indicador', 'Indicador', { width: 220 }),
          cText('meta', 'Meta', { width: 140 }),
          cText('resultado', 'Resultado', { width: 140 }),
          cArea('comentario', 'Comentario'),
        ], {
          defaultRows: [
            { indicador: 'Accidentes con incapacidad', meta: '0' },
            { indicador: 'Reportes de casi accidente', meta: '≥ 2 por mes' },
            { indicador: 'Ausentismo', meta: '≤ 3 %' },
            { indicador: 'Rotación del personal', meta: '0 retiros' },
            { indicador: 'Cumplimiento del plan de capacitación', meta: '100 %' },
          ],
        }),
      ]),
    ],
    example: {
      evaluaciones: [
        { id: 'r1', fecha: '2026-08-21', equipo: 'Equipo de ingeniería', tecnica: 5, seguridad: 5, productividad: 4, colaboracion: 4, comunicacion: 5, fortalezas: 'Diseño y memoria aprobados por la interventoría sin observaciones mayores.', mejoras: 'Entregar antes la lista de piezas por etapa a almacén.', accion: 'Lista de piezas por etapa con 10 días hábiles de anticipación.' },
        { id: 'r2', fecha: '2026-08-29', equipo: 'Equipo de logística y almacén', tecnica: 4, seguridad: 5, productividad: 4, colaboracion: 4, comunicacion: 3, fortalezas: 'Seis viajes despachados en tres noches.', mejoras: 'El inventario del sistema no coincidía con el conteo físico de diagonales (INC-001).', accion: 'Inventario cíclico semanal y conciliación antes de cada despacho.' },
        { id: 'r3', fecha: '2026-09-22', equipo: 'Cuadrilla de montaje A', tecnica: 4, seguridad: 5, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Etapa 1 certificada a la primera y sin accidentes.', mejoras: 'Rendimiento afectado por lluvias; reporte tardío de faltantes.', accion: 'Reporte de faltantes al cierre de cada jornada.' },
        { id: 'r4', fecha: '2026-10-02', equipo: 'Cuadrilla de montaje A', tecnica: 3, seguridad: 4, productividad: 3, colaboracion: 4, comunicacion: 4, fortalezas: 'Buena coordinación con la obra en la ventana de grúa.', mejoras: 'Torque insuficiente y diagonales mal instaladas por montadores nuevos.', accion: 'Inducción práctica del sistema y acompañamiento del supervisor durante dos semanas.' },
      ],
      criterios: 'Escala de 1 a 5: 1 = muy por debajo de lo esperado; 3 = cumple; 5 = supera lo esperado de forma consistente. Evalúan el supervisor de montaje y el coordinador SST al cierre de cada etapa o cada dos semanas; el director de proyecto valida y retroalimenta a cada equipo.',
      indicadores: [
        { id: 'r1', indicador: 'Accidentes con incapacidad', meta: '0', resultado: '0', comentario: 'Sin eventos a la fecha de corte.' },
        { id: 'r2', indicador: 'Reportes de casi accidente', meta: '≥ 2 por mes', resultado: '3 en septiembre', comentario: 'La cultura de reporte funciona.' },
        { id: 'r3', indicador: 'Ausentismo', meta: '≤ 3 %', resultado: '2,1 %', comentario: '' },
        { id: 'r4', indicador: 'Rotación del personal', meta: '0 retiros', resultado: '1 retiro', comentario: 'Reemplazado en 2 días por un montador certificado.' },
        { id: 'r5', indicador: 'Cumplimiento del plan de capacitación', meta: '100 %', resultado: '92 %', comentario: 'Pendiente el reentrenamiento de un montador.' },
      ],
    },
  });

  /* ================================================================== 10. COMUNICACIONES */

  add({
    id: 'plan-gestion-comunicaciones', name: 'Plan de gestión de las comunicaciones', abbr: 'PGCM',
    area: 'comunicaciones', group: 'planificacion', process: '10.1', processes: ['10.1'], kind: 'plan', multiple: false,
    purpose: 'Define qué información necesita cada interesado, quién la emite, con qué propósito, por qué medio, con qué frecuencia y formato, y cómo se escalan los asuntos que no se resuelven.',
    tips: [
      'Diferencia las comunicaciones formales (actas, oficios, facturas) de las operativas (grupos de mensajería): las decisiones siempre se formalizan por escrito.',
      'Programa las actas de corte con el calendario de facturación electrónica del cliente para no perder su cierre contable del mes.',
      'Define el escalamiento con tiempos de respuesta; un problema sin dueño ni plazo se convierte en incidente.',
    ],
    sections: [
      section('requisitos', 'Requisitos de comunicación', [
        area('requisitos', 'Requisitos de comunicación de los interesados', { hint: 'Qué necesita cada grupo, idioma, nivel de detalle y formato.' }),
        area('confidencialidad', 'Autorización de información confidencial', { rows: 3 }),
      ]),
      section('matriz', 'Matriz de comunicaciones', [
        table('matriz', 'Matriz de comunicaciones', [
          cText('informacion', 'Información', { width: 220 }),
          cArea('proposito', 'Propósito', { width: 200 }),
          cText('emisor', 'Emisor', { width: 160 }),
          cText('receptores', 'Receptores', { width: 200 }),
          cSelect('medio', 'Medio', MEDIOS, { width: 210 }),
          cSelect('metodo', 'Método', METODOS_COMUNICACION, { width: 200 }),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
          cText('formato', 'Formato', { width: 180 }),
          cText('responsable', 'Responsable', { width: 160 }),
        ]),
      ]),
      section('tecnologia', 'Tecnologías, recursos y restricciones', [
        area('tecnologias', 'Métodos y tecnologías', { rows: 3 }),
        area('recursos', 'Recursos asignados (tiempo y presupuesto)', { rows: 2 }),
        area('restricciones', 'Restricciones', { rows: 2 }),
      ]),
      section('escalamiento', 'Proceso de escalamiento', [
        table('escalamiento', 'Niveles de escalamiento', [
          cText('nivel', 'Nivel', { width: 90 }),
          cArea('situacion', 'Cuándo se escala'),
          cText('escalaA', 'Escala a', { width: 220 }),
          cText('plazo', 'Tiempo de respuesta', { width: 140 }),
        ], {
          defaultRows: [
            { nivel: 'Nivel 1', situacion: 'Problema operativo que el equipo no resuelve en el turno.', escalaA: 'Residente de obra o supervisor', plazo: 'Mismo día' },
            { nivel: 'Nivel 2', situacion: 'Afecta un hito, la seguridad o requiere una decisión del cliente.', escalaA: 'Director de proyecto', plazo: '24 horas' },
            { nivel: 'Nivel 3', situacion: 'Requiere cambio de línea base, uso de la reserva de gestión o hay un conflicto contractual.', escalaA: 'Patrocinador', plazo: '48 horas' },
          ],
        }),
      ]),
      section('actualizacion', 'Flujo de información y actualización', [
        area('flujoInformacion', 'Flujo de la información', { rows: 3 }),
        area('actualizacion', 'Método para actualizar el plan', { rows: 2 }),
      ]),
      section('glosario', 'Glosario', [
        table('glosario', 'Términos comunes', [
          cText('termino', 'Término', { width: 180 }),
          cArea('definicion', 'Definición', { width: 360 }),
        ]),
      ]),
    ],
    example: {
      requisitos: 'El cliente requiere un informe semanal de avance y SST, y actas de corte mensuales aprobadas por la interventoría. Gerencia General requiere un informe ejecutivo mensual. La cuadrilla necesita instrucciones diarias claras en la charla de inicio. Idioma: español; fechas en formato dd/mm/aaaa; valores en pesos colombianos.',
      confidencialidad: 'Los costos, las tarifas internas y los márgenes del proyecto solo se comparten con Gerencia General y el director de proyecto. La información que se entrega al cliente (actas, facturas, informes) la autoriza el director de proyecto.',
      matriz: [
        { id: 'r1', informacion: 'Charla de inicio de jornada (SST y frentes del día)', proposito: 'Alinear tareas y riesgos del día.', emisor: 'Supervisor de montaje', receptores: 'Cuadrillas de montaje', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Diaria', formato: 'Registro de asistencia', responsable: 'Supervisor de montaje' },
        { id: 'r2', informacion: 'Permiso de trabajo en alturas', proposito: 'Autorizar el trabajo con los controles verificados.', emisor: 'Coordinador SST (HSE)', receptores: 'Supervisor de montaje; cuadrilla', medio: 'Informe escrito', metodo: 'De tipo push (enviar)', frecuencia: 'Diaria', formato: 'Formato de permiso firmado', responsable: 'Coordinador SST (HSE)' },
        { id: 'r3', informacion: 'Comité de obra y seguimiento', proposito: 'Revisar avance, valor ganado, SST, calidad, riesgos, incidentes, cambios y programación de la grúa.', emisor: 'Director de proyecto', receptores: 'Director de obra (cliente); Interventoría; residente; supervisor; coordinador SST', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Semanal', formato: 'Acta de reunión (viernes a las 7:00)', responsable: 'Residente de obra' },
        { id: 'r4', informacion: 'Informe semanal de desempeño', proposito: 'Informar avance físico, valor ganado y pronósticos.', emisor: 'Director de proyecto', receptores: 'Director de obra (cliente); Interventoría', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Semanal', formato: 'Informe PDF con curva S', responsable: 'Director de proyecto' },
        { id: 'r5', informacion: 'Informe ejecutivo', proposito: 'Estado general, reservas, riesgos principales y decisiones requeridas.', emisor: 'Director de proyecto', receptores: 'Gerencia General', medio: 'Reunión virtual', metodo: 'Interactiva', frecuencia: 'Mensual', formato: 'Presentación de cinco diapositivas', responsable: 'Director de proyecto' },
        { id: 'r6', informacion: 'Acta de corte y factura electrónica', proposito: 'Soportar el cobro del periodo.', emisor: 'Residente de obra', receptores: 'Interventoría; Facturación y cartera; cliente', medio: 'Oficio radicado', metodo: 'De tipo push (enviar)', frecuencia: 'Mensual', formato: 'Acta firmada y factura electrónica validada por la DIAN', responsable: 'Facturación y cartera' },
        { id: 'r7', informacion: 'Programa semanal de despachos', proposito: 'Coordinar cargue, descargue y acopio.', emisor: 'Coordinador logístico', receptores: 'Residente de obra; almacén; transportador', medio: 'Mensajería (grupo de obra)', metodo: 'De tipo push (enviar)', frecuencia: 'Semanal', formato: 'Tabla de despachos', responsable: 'Coordinador logístico' },
        { id: 'r8', informacion: 'Planos, certificados y actas vigentes', proposito: 'Consultar la versión vigente de cada documento.', emisor: 'Director de proyecto', receptores: 'Equipo del proyecto; Interventoría', medio: 'Repositorio de documentos', metodo: 'De tipo pull (consultar)', frecuencia: 'Por evento', formato: 'PDF con cajetín y revisión', responsable: 'Residente de obra' },
        { id: 'r9', informacion: 'Aviso a la comunidad vecina', proposito: 'Informar cierres parciales del andén y horarios de cargue.', emisor: 'Residente de obra', receptores: 'Comunidad vecina', medio: 'Cartelera de obra', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Aviso impreso', responsable: 'Residente de obra' },
      ],
      tecnologias: 'Correo corporativo; grupo de mensajería del proyecto solo para coordinación operativa (las decisiones se formalizan por correo o acta); repositorio de documentos del proyecto; este gestor para planes, registros y líneas base.',
      recursos: 'Cerca de 4 horas semanales del director de proyecto en informes y comités y 3 horas semanales del residente en actas. Sin costo adicional de herramientas.',
      restricciones: 'El campamento de obra tiene conexión limitada; los comités se hacen presenciales. Los datos personales del equipo y de los interesados se tratan según la Ley 1581 de 2012.',
      escalamiento: [
        { id: 'r1', nivel: 'Nivel 1', situacion: 'Problema operativo que el equipo no resuelve en el turno.', escalaA: 'Residente de obra o supervisor de montaje', plazo: 'Mismo día' },
        { id: 'r2', nivel: 'Nivel 2', situacion: 'Afecta un hito, la seguridad o requiere decisión del cliente.', escalaA: 'Director de proyecto', plazo: '24 horas' },
        { id: 'r3', nivel: 'Nivel 3', situacion: 'Requiere cambio de línea base, uso de la reserva de gestión o hay un conflicto contractual.', escalaA: 'Gerencia General (patrocinador)', plazo: '48 horas' },
        { id: 'r4', nivel: 'Nivel 4', situacion: 'Controversia contractual con el cliente sin acuerdo.', escalaA: 'Gerencia General y representante legal del cliente', plazo: '5 días hábiles' },
      ],
      flujoInformacion: 'Partes diarios del supervisor → residente de obra (consolida el avance) → director de proyecto (valor ganado, riesgos e incidentes) → informe semanal al cliente y ejecutivo mensual a Gerencia General. Las solicitudes del cliente entran por el residente y se registran en el registro de comunicaciones.',
      actualizacion: 'El plan se revisa al inicio de cada fase y cuando cambia un interesado clave; los cambios los aprueba el director de proyecto y se informan en el comité de obra.',
      glosario: [
        { id: 'r1', termino: 'Acta de corte', definicion: 'Documento que mide las cantidades ejecutadas en un periodo y soporta la factura.' },
        { id: 'r2', termino: 'Tarjeta verde o roja', definicion: 'Etiqueta de estado del andamio: verde, apto para uso; roja, no apto.' },
        { id: 'r3', termino: 'Persona competente', definicion: 'Persona capacitada y certificada para inspeccionar andamios y sistemas de protección contra caídas (Resolución 4272 de 2021).' },
        { id: 'r4', termino: 'Interventoría', definicion: 'Persona o firma que supervisa el contrato en representación del cliente.' },
        { id: 'r5', termino: 'Valor ganado (EV)', definicion: 'Valor del trabajo realizado expresado en el presupuesto aprobado para ese trabajo.' },
      ],
    },
  });

  add({
    id: 'registro-comunicaciones', name: 'Registro de comunicaciones del proyecto', abbr: 'RCOM',
    area: 'comunicaciones', group: 'ejecucion', process: '10.2', processes: ['10.2', '10.3'], kind: 'registro', multiple: false,
    purpose: 'Lleva el control de las comunicaciones formales del proyecto (informes, actas, oficios, correos relevantes): quién las emitió, a quién, cuándo, por qué medio y si están pendientes de respuesta.',
    tips: [
      'Asigna un consecutivo a cada comunicación formal y anota el número de radicado del cliente.',
      'Marca las comunicaciones que requieren respuesta y revisa las pendientes en el comité de obra.',
      'Archiva la evidencia (PDF del correo, oficio radicado): es el soporte en reclamaciones y en la liquidación del contrato.',
    ],
    sections: [
      section('registro', 'Comunicaciones', [
        table('comunicaciones', 'Registro de comunicaciones', [
          cCode('id', 'Código', { width: 90, placeholder: 'COM-001' }),
          cDate('fecha', 'Fecha'),
          cSelect('tipo', 'Tipo', TIPOS_COMUNICACION, { width: 130 }),
          cArea('asunto', 'Asunto', { width: 260 }),
          cText('emisor', 'Emisor', { width: 170 }),
          cText('receptores', 'Receptores', { width: 200 }),
          cSelect('medio', 'Medio', MEDIOS, { width: 210 }),
          cText('referencia', 'Referencia o radicado', { width: 150 }),
          cCheck('requiereRespuesta', 'Requiere respuesta'),
          cDate('fechaRespuesta', 'Fecha de respuesta'),
          cSelect('estado', 'Estado', ESTADOS_COMUNICACION, { width: 200 }),
        ]),
      ]),
      section('archivo', 'Archivo', [
        area('archivo', 'Ubicación y conservación del archivo', { rows: 2 }),
      ]),
    ],
    example: {
      comunicaciones: [
        { id: 'COM-001', fecha: '2026-08-04', tipo: 'Acta', asunto: 'Acta de la reunión de arranque del proyecto', emisor: 'Director de proyecto', receptores: 'Director de obra (cliente); Interventoría', medio: 'Correo electrónico', referencia: 'Acta 01', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-002', fecha: '2026-08-18', tipo: 'Oficio', asunto: 'Entrega del diseño, la memoria de cálculo y el plan de rescate para aprobación', emisor: 'Ingeniero de diseño', receptores: 'Interventoría', medio: 'Oficio radicado', referencia: 'Radicado 2026-0187', requiereRespuesta: true, fechaRespuesta: '2026-08-21', estado: 'Respondida' },
        { id: 'COM-003', fecha: '2026-08-28', tipo: 'Acta', asunto: 'Acta de corte n.º 1 (agosto) de alquiler y montaje para aprobación; la factura FE-4512 se radicó el 31 de agosto', emisor: 'Residente de obra', receptores: 'Interventoría', medio: 'Oficio radicado', referencia: 'Radicado 2026-0203', requiereRespuesta: true, fechaRespuesta: '2026-08-31', estado: 'Respondida' },
        { id: 'COM-004', fecha: '2026-09-07', tipo: 'Correo', asunto: 'Solicitud de cambio CC-002: plataforma adicional de descargue en el piso 8', emisor: 'Director de obra (cliente)', receptores: 'Director de proyecto', medio: 'Correo electrónico', referencia: 'CC-002', requiereRespuesta: true, fechaRespuesta: '2026-09-11', estado: 'Respondida' },
        { id: 'COM-005', fecha: '2026-09-15', tipo: 'Oficio', asunto: 'Baja disponibilidad de la grúa del cliente para izaje desde el nivel 6 (INC-003)', emisor: 'Director de proyecto', receptores: 'Director de obra (cliente)', medio: 'Oficio radicado', referencia: 'Radicado 2026-0221', requiereRespuesta: true, fechaRespuesta: '2026-10-01', estado: 'Respondida' },
        { id: 'COM-006', fecha: '2026-09-21', tipo: 'Comunicado', asunto: 'Certificado de uso de la etapa 1 (niveles 1 a 5)', emisor: 'Persona competente (inspector certificado)', receptores: 'Director de obra (cliente); Interventoría', medio: 'Correo electrónico', referencia: 'CERT-014-01', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-007', fecha: '2026-09-21', tipo: 'Acta', asunto: 'Acta parcial n.º 2: aceptación de la etapa 1', emisor: 'Residente de obra', receptores: 'Interventoría; Director de obra (cliente)', medio: 'Oficio radicado', referencia: 'Radicado 2026-0228', requiereRespuesta: false, estado: 'Archivada' },
        { id: 'COM-008', fecha: '2026-09-22', tipo: 'Comunicado', asunto: 'Aviso a la comunidad: despachos nocturnos y cierre parcial del andén norte', emisor: 'Residente de obra', receptores: 'Comunidad vecina', medio: 'Cartelera de obra', referencia: '', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-009', fecha: '2026-09-24', tipo: 'Oficio', asunto: 'Hallazgo de la interventoría: rodapiés retirados en el nivel 4 (INC-004)', emisor: 'Interventoría', receptores: 'Director de proyecto; Coordinador SST (HSE)', medio: 'Oficio radicado', referencia: 'Oficio INT-0412', requiereRespuesta: true, fechaRespuesta: '2026-09-25', estado: 'Respondida' },
        { id: 'COM-010', fecha: '2026-09-29', tipo: 'Correo', asunto: 'Solicitud de cambio CC-003: extensión del alquiler tres semanas', emisor: 'Director de obra (cliente)', receptores: 'Director de proyecto', medio: 'Correo electrónico', referencia: 'CC-003', requiereRespuesta: true, estado: 'Pendiente de respuesta' },
        { id: 'COM-011', fecha: '2026-09-29', tipo: 'Acta', asunto: 'Acta n.º 08 del comité de obra y seguimiento', emisor: 'Residente de obra', receptores: 'Asistentes del comité', medio: 'Correo electrónico', referencia: 'Acta 08', requiereRespuesta: false, estado: 'Enviada' },
        { id: 'COM-012', fecha: '2026-09-30', tipo: 'Correo', asunto: 'Cobro de la factura de agosto vencida (INC-005)', emisor: 'Facturación y cartera', receptores: 'Dirección financiera del cliente', medio: 'Correo electrónico', referencia: 'Factura electrónica FE-4512', requiereRespuesta: true, estado: 'Pendiente de respuesta' },
        { id: 'COM-013', fecha: '2026-10-02', tipo: 'Informe', asunto: 'Informe semanal de desempeño, corte del 2 de octubre', emisor: 'Director de proyecto', receptores: 'Director de obra (cliente); Interventoría', medio: 'Correo electrónico', referencia: 'ISD-08', requiereRespuesta: false, estado: 'Enviada' },
      ],
      archivo: 'Las comunicaciones formales se archivan en la carpeta del proyecto con el código del registro; los correos se guardan en PDF y los oficios radicados con su sello de recibido.',
    },
  });

  add({
    id: 'acta-reunion', name: 'Acta de reunión', abbr: 'AREU',
    area: 'comunicaciones', group: 'ejecucion', process: '10.2', processes: ['10.2'], kind: 'acta', multiple: true,
    purpose: 'Deja constancia de una reunión del proyecto: asistentes, agenda, temas tratados, decisiones y compromisos con responsable y fecha.',
    tips: [
      'Envía el acta dentro de las 24 horas siguientes y pide observaciones en un plazo fijo; si no hay observaciones, se entiende aprobada.',
      'Cada compromiso necesita un responsable y una fecha; revisa los pendientes al inicio de la siguiente reunión.',
      'Registra decisiones, no conversaciones: el desarrollo debe ser breve y las decisiones explícitas.',
    ],
    sections: [
      section('datos', 'Datos de la reunión', [
        text('numero', 'Acta n.º'),
        date('fecha', 'Fecha', { required: true }),
        text('horaInicio', 'Hora de inicio', { placeholder: '07:00' }),
        text('horaFin', 'Hora de terminación', { placeholder: '08:30' }),
        text('lugar', 'Lugar o medio'),
        select('modalidad', 'Modalidad', MODALIDADES),
        select('tipoReunion', 'Tipo de reunión', TIPOS_REUNION),
        text('convoca', 'Convoca'),
        area('objetivo', 'Objetivo de la reunión', { rows: 2 }),
      ]),
      section('asistentes', 'Asistentes', [
        table('asistentes', 'Asistentes', [
          cText('rol', 'Rol o cargo', { width: 220 }),
          cText('organizacion', 'Organización', { width: 220 }),
          cSelect('asistencia', 'Asistencia', ASISTENCIA, { width: 120 }),
        ]),
      ]),
      section('agenda', 'Agenda', [
        list('agenda', 'Temas de la agenda', {
          default: ['Verificación de compromisos anteriores', 'Avance del cronograma y valor ganado', 'Seguridad y salud en el trabajo', 'Calidad', 'Riesgos e incidentes', 'Solicitudes de cambio', 'Compromisos y varios'],
        }),
      ]),
      section('desarrollo', 'Desarrollo', [
        area('desarrollo', 'Desarrollo de la reunión', { rows: 8, hint: 'Resumen por tema de la agenda.' }),
      ]),
      section('decisiones', 'Decisiones', [
        table('decisiones', 'Decisiones tomadas', [
          cArea('decision', 'Decisión', { width: 320 }),
          cText('tema', 'Tema', { width: 170 }),
          cText('aprobadaPor', 'Aprobada por', { width: 220 }),
        ]),
      ]),
      section('compromisos', 'Compromisos', [
        table('compromisos', 'Compromisos', [
          cArea('compromiso', 'Compromiso', { width: 320 }),
          cText('responsable', 'Responsable', { width: 180 }),
          cDate('fecha', 'Fecha límite'),
          cSelect('estado', 'Estado', ESTADO_COMPROMISO, { width: 120 }),
        ]),
      ]),
      section('cierre', 'Próxima reunión', [
        date('proximaFecha', 'Fecha de la próxima reunión'),
        area('observaciones', 'Observaciones', { rows: 2 }),
      ]),
    ],
    example: {
      numero: '08',
      fecha: '2026-09-29',
      horaInicio: '07:00',
      horaFin: '08:30',
      lugar: 'Campamento de obra, Edificio Altavista (Torre 2), Bogotá D.C.',
      modalidad: 'Presencial',
      tipoReunion: 'Comité de seguimiento',
      convoca: 'Director de proyecto',
      objetivo: 'Revisar el avance, la SST, la calidad, los riesgos y los cambios, y acordar acciones para recuperar el atraso del montaje de los niveles 6 a 10. Por el atraso que causa la grúa del cliente, la sesión semanal del viernes 2 de octubre se adelantó al martes 29 de septiembre.',
      asistentes: [
        { id: 'r1', rol: 'Director de proyecto', organizacion: EJ.empresa, asistencia: 'Asistió' },
        { id: 'r2', rol: 'Residente de obra', organizacion: EJ.empresa, asistencia: 'Asistió' },
        { id: 'r3', rol: 'Supervisor de montaje', organizacion: EJ.empresa, asistencia: 'Asistió' },
        { id: 'r4', rol: 'Coordinador SST (HSE)', organizacion: EJ.empresa, asistencia: 'Asistió' },
        { id: 'r5', rol: 'Director de obra (cliente)', organizacion: EJ.cliente, asistencia: 'Asistió' },
        { id: 'r6', rol: 'Interventor técnico y SST', organizacion: EJ.interventoria, asistencia: 'Asistió' },
        { id: 'r7', rol: 'Coordinador logístico', organizacion: EJ.empresa, asistencia: 'Excusado' },
      ],
      agenda: [
        'Verificación de compromisos del comité anterior',
        'Avance del montaje y del cronograma (SPI)',
        'SST: permisos, incidentes y simulacro de rescate',
        'Calidad: no conformidades de la semana',
        'Riesgos e incidentes: grúa del cliente, lluvias y piezas para los niveles 11 a 15',
        'Solicitud de cambio CC-003: extensión del alquiler',
        'Compromisos y varios',
      ],
      desarrollo: '1. Compromisos anteriores: 4 de 5 cumplidos; queda pendiente la confirmación escrita de la ventana de grúa.\n2. Avance: etapa 1 (niveles 1 a 5) certificada y aceptada el 21 de septiembre con el acta parcial n.º 2. Niveles 6 a 10 al 50 %. El SPI acumulado es cercano a 0,93 por la baja disponibilidad de la grúa del cliente (2,5 horas diarias frente a 4 previstas, INC-003) y por los dos días de lluvia del 8 y 9 de septiembre.\n3. SST: sin accidentes; tres reportes de casi accidente. El simulacro de rescate del 24 de septiembre tuvo un tiempo de respuesta de 6 minutos. Se cerró el hallazgo de rodapiés retirados en el nivel 4 (INC-004).\n4. Calidad: reincidencia de torque insuficiente en abrazaderas; se retiró la llave de impacto descalibrada.\n5. Riesgos: el inventario disponible para los niveles 11 a 15 cubre el 94 % de las piezas; se prepara el subarriendo preacordado (R-003).\n6. El director de obra radicó la solicitud CC-003 para extender el alquiler tres semanas, hasta el 8 de enero de 2027, por la reprogramación de la fachada.',
      decisiones: [
        { id: 'r1', decision: 'Establecer una ventana fija de grúa de 7:00 a 9:00 para el izaje del andamio desde el 1 de octubre, sujeta a la programación de grúa de la obra, y medir su cumplimiento diario.', tema: 'Grúa del cliente (INC-003)', aprobadaPor: 'Director de obra (cliente) y Director de proyecto' },
        { id: 'r2', decision: 'Movilizar la segunda cuadrilla y un supervisor adicional desde el 13 de octubre para montar los niveles 11 a 15 en paralelo.', tema: 'Avance del cronograma', aprobadaPor: 'Director de proyecto' },
        { id: 'r3', decision: 'Hacer el apriete final de abrazaderas solo con torquímetro calibrado; la interventoría verificará por muestreo.', tema: 'Calidad', aprobadaPor: 'Director de proyecto e Interventoría' },
        { id: 'r4', decision: 'Analizar el impacto del CC-003 y decidirlo en el comité de control de cambios ampliado del 9 de octubre.', tema: 'Solicitudes de cambio', aprobadaPor: 'Director de proyecto y Director de obra (cliente)' },
      ],
      compromisos: [
        { id: 'r1', compromiso: 'Confirmar por escrito la ventana fija de grúa de 7:00 a 9:00 con la programación de grúa de la obra.', responsable: 'Director de obra (cliente)', fecha: '2026-10-01', estado: 'Cumplido' },
        { id: 'r2', compromiso: 'Solicitar a Gerencia General la aprobación de horas extra hasta $ 6 M con cargo a la reserva para contingencias (supera el límite de $ 5 M por evento del director).', responsable: 'Director de proyecto', fecha: '2026-10-02', estado: 'Cumplido' },
        { id: 'r3', compromiso: 'Verificar el torque del 100 % de los anclajes de los niveles 6 a 8.', responsable: 'Supervisor de montaje', fecha: '2026-10-03', estado: 'En curso' },
        { id: 'r4', compromiso: 'Reservar el inventario y confirmar el subarriendo para los niveles 11 a 15.', responsable: 'Coordinador logístico', fecha: '2026-10-06', estado: 'Pendiente' },
        { id: 'r5', compromiso: 'Presentar el análisis de impacto del CC-003 (costo, cronograma y pólizas).', responsable: 'Director de proyecto', fecha: '2026-10-09', estado: 'En curso' },
        { id: 'r6', compromiso: 'Gestionar el pago de la factura de agosto.', responsable: 'Facturación y cartera', fecha: '2026-10-15', estado: 'Pendiente' },
      ],
      proximaFecha: '2026-10-09',
      observaciones: 'Próximo comité: viernes 9 de octubre de 2026 a las 7:00 en el campamento de obra, seguido del comité de control de cambios ampliado.',
    },
  });

  /* ================================================================== 11. RIESGOS */

  /* Definiciones genéricas (filas iniciales del plan); el ejemplo las ajusta al proyecto. */
  const PROBABILIDAD_5 = [
    { valor: 5, nivel: 'Muy alta', rango: 'Más de 70 %', descripcion: 'Se espera que ocurra en la mayoría de las circunstancias.' },
    { valor: 4, nivel: 'Alta', rango: '51 % a 70 %', descripcion: 'Es probable que ocurra.' },
    { valor: 3, nivel: 'Media', rango: '31 % a 50 %', descripcion: 'Puede ocurrir en algún momento del proyecto.' },
    { valor: 2, nivel: 'Baja', rango: '11 % a 30 %', descripcion: 'Podría ocurrir, pero no es lo esperado.' },
    { valor: 1, nivel: 'Muy baja', rango: '1 % a 10 %', descripcion: 'Solo ocurriría en circunstancias excepcionales.' },
  ];
  const IMPACTO_5 = [
    { valor: 5, nivel: 'Muy alto', alcance: 'El entregable no sirve para su uso.', cronograma: 'Retraso mayor al 20 % de la duración o pérdida de un hito contractual.', costo: 'Aumento mayor al 10 % del presupuesto.', calidad: 'Falla estructural o incumplimiento normativo.', sst: 'Accidente grave o mortal.' },
    { valor: 4, nivel: 'Alto', alcance: 'Cambios importantes que el cliente debe aprobar.', cronograma: 'Retraso del 10 % al 20 %.', costo: 'Aumento del 5 % al 10 %.', calidad: 'Rechazo de un entregable por el cliente.', sst: 'Accidente con incapacidad.' },
    { valor: 3, nivel: 'Medio', alcance: 'Afecta áreas importantes del alcance.', cronograma: 'Retraso del 5 % al 10 %.', costo: 'Aumento del 2 % al 5 %.', calidad: 'Reproceso que requiere aprobación del cliente.', sst: 'Incidente con atención de primeros auxilios.' },
    { valor: 2, nivel: 'Bajo', alcance: 'Afecta áreas menores del alcance.', cronograma: 'Retraso del 1 % al 5 %.', costo: 'Aumento menor al 2 %.', calidad: 'Defecto menor corregido en el turno.', sst: 'Casi accidente.' },
    { valor: 1, nivel: 'Muy bajo', alcance: 'Disminución apenas perceptible.', cronograma: 'Retraso menor al 1 %.', costo: 'Aumento insignificante.', calidad: 'Sin efecto apreciable.', sst: 'Condición insegura corregida de inmediato.' },
  ];
  const MATRIZ_PI = [
    { nivel: 'Muy alto', puntuacion: '20 a 25', tratamiento: 'Escalar de inmediato al patrocinador; respuesta aprobada y reserva asignada antes de continuar el trabajo afectado.', revision: 'Semanal' },
    { nivel: 'Alto', puntuacion: '10 a 19', tratamiento: 'Plan de respuesta obligatorio con propietario, disparador y reserva estimada.', revision: 'Semanal' },
    { nivel: 'Medio', puntuacion: '5 a 9', tratamiento: 'Respuesta definida por el propietario y seguimiento en el registro.', revision: 'Quincenal' },
    { nivel: 'Bajo', puntuacion: '1 a 4', tratamiento: 'Aceptar y mantener en la lista de vigilancia.', revision: 'Mensual' },
  ];
  /* Estructura de desglose de los riesgos (Guía del PMBOK® 6.ª ed., gráfico 11-4) */
  const EDR_RIESGOS_BASE = [
    { nivel1: 'Técnico', nivel2: 'Definición del alcance y de los requisitos', categoriaRegistro: 'Técnico' },
    { nivel1: 'Técnico', nivel2: 'Estimaciones, supuestos y restricciones', categoriaRegistro: 'Técnico' },
    { nivel1: 'Técnico', nivel2: 'Procesos técnicos y tecnología', categoriaRegistro: 'Técnico' },
    { nivel1: 'Técnico', nivel2: 'Interfaces técnicas', categoriaRegistro: 'Técnico' },
    { nivel1: 'De gestión', nivel2: 'Dirección de proyectos', categoriaRegistro: 'Dirección de proyectos' },
    { nivel1: 'De gestión', nivel2: 'Organización y operaciones', categoriaRegistro: 'De la organización' },
    { nivel1: 'De gestión', nivel2: 'Dotación de recursos', categoriaRegistro: 'De la organización' },
    { nivel1: 'De gestión', nivel2: 'Comunicación', categoriaRegistro: 'Dirección de proyectos' },
    { nivel1: 'Comercial', nivel2: 'Términos y condiciones contractuales', categoriaRegistro: 'De la organización' },
    { nivel1: 'Comercial', nivel2: 'Proveedores y subcontratistas', categoriaRegistro: 'Externo' },
    { nivel1: 'Comercial', nivel2: 'Estabilidad del cliente', categoriaRegistro: 'Externo' },
    { nivel1: 'Externo', nivel2: 'Legislación y regulaciones', categoriaRegistro: 'Externo' },
    { nivel1: 'Externo', nivel2: 'Sitio e instalaciones', categoriaRegistro: 'Externo' },
    { nivel1: 'Externo', nivel2: 'Clima y medio ambiente', categoriaRegistro: 'Externo' },
  ];
  const withIds = (rows) => rows.map((r, i) => Object.assign({ id: 'r' + (i + 1) }, r));

  add({
    id: 'plan-gestion-riesgos', name: 'Plan de gestión de los riesgos', abbr: 'PGRI',
    area: 'riesgos', group: 'planificacion', process: '11.1', processes: ['11.1'], kind: 'plan', multiple: false,
    purpose: 'Describe cómo se estructurarán y realizarán las actividades de gestión de riesgos: estrategia, metodología, roles, financiamiento, calendario, categorías, apetito al riesgo y las definiciones de probabilidad e impacto de la matriz.',
    tips: [
      'Ajusta las definiciones de impacto a los valores del proyecto (días hábiles y pesos) para que todos califiquen igual.',
      'Incluye la seguridad en alturas como objetivo de impacto: un accidente grave debe calificar 5 sin importar el costo.',
      'Considera las temporadas de lluvias de Bogotá (marzo a mayo y octubre a noviembre) al definir el calendario de revisiones.',
      'Acuerda el apetito al riesgo con el patrocinador antes del taller de identificación.',
    ],
    sections: [
      section('estrategia', 'Estrategia y metodología', [
        area('estrategia', 'Estrategia de riesgos', { rows: 3 }),
        area('metodologia', 'Metodología', { hint: 'Enfoques, herramientas y fuentes de datos para identificar, analizar, responder y monitorear.' }),
      ]),
      section('organizacion', 'Roles, financiamiento y calendario', [
        table('rolesRiesgo', 'Roles y responsabilidades', [
          cText('rol', 'Rol', { width: 200 }),
          cArea('responsabilidades', 'Responsabilidades', { width: 360 }),
        ]),
        area('financiamiento', 'Financiamiento', { rows: 3, hint: 'Fondos para las actividades de gestión de riesgos y para las reservas.' }),
        area('calendario', 'Calendario', { rows: 3, hint: 'Cuándo y con qué frecuencia se realizan las actividades de gestión de riesgos.' }),
      ]),
      section('categorias', 'Categorías de riesgo', [
        table('edrRiesgos', 'Estructura de desglose de los riesgos (RBS)', [
          cSelect('nivel1', 'Categoría (nivel 1)', EDR_RIESGOS_NIVEL1, { width: 130 }),
          cText('nivel2', 'Subcategoría (nivel 2)', { width: 230 }),
          cArea('ejemplos', 'Ejemplos en el proyecto'),
          cSelect('categoriaRegistro', 'Categoría en el registro', RIESGO_CATEGORIAS, { width: 200, hint: 'Categoría con la que se clasifican estos riesgos en el registro de riesgos.' }),
        ], { defaultRows: EDR_RIESGOS_BASE }),
      ]),
      section('apetito', 'Apetito al riesgo de los interesados', [
        area('apetito', 'Apetito y umbrales de riesgo', { rows: 3 }),
      ]),
      section('definiciones', 'Definiciones de probabilidad e impacto', [
        table('probabilidad', 'Escala de probabilidad', [
          cNum('valor', 'Valor', { min: 1, max: 5, width: 70 }),
          cText('nivel', 'Nivel', { width: 110 }),
          cText('rango', 'Rango', { width: 120 }),
          cArea('descripcion', 'Descripción'),
        ], { defaultRows: PROBABILIDAD_5 }),
        table('impactos', 'Escala de impacto por objetivo', [
          cNum('valor', 'Valor', { min: 1, max: 5, width: 70 }),
          cText('nivel', 'Nivel', { width: 100 }),
          cArea('alcance', 'Alcance', { width: 180 }),
          cArea('cronograma', 'Cronograma', { width: 180 }),
          cArea('costo', 'Costo', { width: 160 }),
          cArea('calidad', 'Calidad', { width: 180 }),
          cArea('sst', 'Seguridad y salud en el trabajo', { width: 180 }),
        ], { defaultRows: IMPACTO_5, hint: 'El impacto de un riesgo es el mayor valor entre los objetivos afectados.' }),
        table('matrizPI', 'Matriz de probabilidad e impacto (puntuación = probabilidad × impacto)', [
          cText('nivel', 'Nivel', { width: 100 }),
          cText('puntuacion', 'Puntuación', { width: 100 }),
          cArea('tratamiento', 'Tratamiento requerido', { width: 320 }),
          cText('revision', 'Revisión', { width: 120 }),
        ], { defaultRows: MATRIZ_PI }),
      ]),
      section('informes', 'Informes y seguimiento', [
        area('formatosInformes', 'Formatos de los informes', { rows: 3 }),
        area('seguimiento', 'Seguimiento', { rows: 3, hint: 'Cómo se registran, revisan y auditan las actividades de riesgos y las lecciones aprendidas.' }),
      ]),
    ],
    example: {
      estrategia: 'Gestionar de forma proactiva las amenazas a la seguridad en alturas, al cronograma de montaje y a la disponibilidad de equipo, y aprovechar las oportunidades de extensión del alquiler. El riesgo general del proyecto debe mantenerse en nivel Medio o inferior.',
      metodologia: 'Identificación en taller con el equipo (lluvia de ideas guiada por la EDR y listas de verificación de obras anteriores); análisis cualitativo con la matriz 5 × 5 de este plan; análisis cuantitativo con valor monetario esperado para las amenazas de nivel Medio o superior y simulación de Monte Carlo del cronograma; respuestas con propietario, disparador y reserva; monitoreo semanal en el comité de obra.',
      rolesRiesgo: [
        { id: 'r1', rol: 'Gerencia General (patrocinador)', responsabilidades: 'Aprueba el plan, el apetito al riesgo y el uso de la reserva de gestión; recibe los riesgos escalados.' },
        { id: 'r2', rol: 'Director de proyecto', responsabilidades: 'Dirige la gestión de riesgos, mantiene el registro y autoriza el uso de la reserva para contingencias.' },
        { id: 'r3', rol: 'Propietario del riesgo', responsabilidades: 'Vigila los disparadores, ejecuta la respuesta acordada e informa en el comité de obra.' },
        { id: 'r4', rol: 'Coordinador SST (HSE)', responsabilidades: 'Identifica y controla los riesgos de trabajo en alturas; lidera los simulacros de rescate.' },
        { id: 'r5', rol: 'Equipo del proyecto', responsabilidades: 'Identifica riesgos nuevos y los reporta al director de proyecto.' },
      ],
      financiamiento: 'Reserva para contingencias de COP 22,6 millones, igual al valor monetario esperado de las amenazas analizadas (tras el traslado de COP 9,8 millones al BAC por el CC-002), y reserva de gestión de COP 11,9 millones. Las actividades de gestión de riesgos (talleres, simulacros) se cargan a la cuenta de control 1.1.',
      calendario: 'Taller de identificación el 4 de agosto de 2026; revisión semanal en el comité de obra; reevaluación completa al inicio de cada fase (montaje, operación y desmontaje) y auditoría de riesgos en noviembre, antes del desmontaje.',
      edrRiesgos: [
        { id: 'r1', nivel1: 'Técnico', nivel2: 'Requisitos y diseño', ejemplos: 'Errores de levantamiento; cargas no previstas; cambios en la geometría de la fachada.', categoriaRegistro: 'Técnico' },
        { id: 'r2', nivel1: 'Técnico', nivel2: 'Procesos de montaje', ejemplos: 'Torque insuficiente; diagonales mal instaladas; anclajes incompletos.', categoriaRegistro: 'Técnico' },
        { id: 'r3', nivel1: 'Técnico', nivel2: 'Seguridad en alturas', ejemplos: 'Caídas de personas; caída de objetos; falla de sistemas de protección.', categoriaRegistro: 'Técnico' },
        { id: 'r4', nivel1: 'De gestión', nivel2: 'Planificación y estimación', ejemplos: 'Rendimientos optimistas; despachos sin coordinación con el avance.', categoriaRegistro: 'Dirección de proyectos' },
        { id: 'r5', nivel1: 'De gestión', nivel2: 'Recursos', ejemplos: 'Faltantes de piezas en bodega; rotación de montadores certificados.', categoriaRegistro: 'De la organización' },
        { id: 'r6', nivel1: 'Comercial', nivel2: 'Términos contractuales y pagos', ejemplos: 'Retraso en el pago de las actas; retención en garantía.', categoriaRegistro: 'De la organización' },
        { id: 'r7', nivel1: 'Comercial', nivel2: 'Proveedores y subcontratistas', ejemplos: 'Incumplimiento del transportador o del proveedor de subarriendo.', categoriaRegistro: 'Externo' },
        { id: 'r8', nivel1: 'Externo', nivel2: 'Clima', ejemplos: 'Lluvias y tormentas eléctricas; viento en los niveles altos.', categoriaRegistro: 'Externo' },
        { id: 'r9', nivel1: 'Externo', nivel2: 'Regulaciones y movilidad', ejemplos: 'Restricciones de circulación de carga en Bogotá; permisos de cargue.', categoriaRegistro: 'Externo' },
        { id: 'r10', nivel1: 'Externo', nivel2: 'Sitio y cliente', ejemplos: 'Cambios en la secuencia de obra; grúa no disponible; daños o hurto en obra.', categoriaRegistro: 'Externo' },
      ],
      apetito: 'Tolerancia cero a los riesgos de accidente grave en alturas: todo riesgo de SST con impacto 4 o 5 debe tener respuesta antes de iniciar el trabajo. Se acepta una desviación de hitos de hasta 5 días hábiles sin escalar y una variación del costo de hasta 2 % del BAC cubierta con la reserva para contingencias.',
      probabilidad: withIds([
        { valor: 5, nivel: 'Muy alta', rango: 'Más de 70 % (se usa 80 %)', descripcion: 'Se espera que ocurra; ya hay señales en la obra.' },
        { valor: 4, nivel: 'Alta', rango: '51 % a 70 % (se usa 60 %)', descripcion: 'Ocurrió en la mayoría de las obras similares.' },
        { valor: 3, nivel: 'Media', rango: '31 % a 50 % (se usa 40 %)', descripcion: 'Ocurrió en algunas obras similares.' },
        { valor: 2, nivel: 'Baja', rango: '11 % a 30 % (se usa 20 %)', descripcion: 'Ocurrió rara vez en obras similares.' },
        { valor: 1, nivel: 'Muy baja', rango: '1 % a 10 % (se usa 5 %)', descripcion: 'No ha ocurrido en la empresa.' },
      ]),
      impactos: withIds([
        { valor: 5, nivel: 'Muy alto', alcance: 'El cliente no puede usar el andamio en un costado completo.', cronograma: 'Más de 15 días hábiles o pérdida de la entrega del 18 de diciembre.', costo: 'Más de COP 45 M.', calidad: 'Falla estructural o rechazo de la certificación de una etapa completa.', sst: 'Accidente grave o mortal.' },
        { valor: 4, nivel: 'Alto', alcance: 'Un nivel completo no disponible para el cliente.', cronograma: '8 a 15 días hábiles.', costo: 'COP 22 M a 45 M.', calidad: 'Reproceso de un nivel; observación formal de la interventoría.', sst: 'Accidente con incapacidad.' },
        { valor: 3, nivel: 'Medio', alcance: 'Reprogramación de frentes con aprobación del cliente.', cronograma: '4 a 7 días hábiles.', costo: 'COP 9 M a 22 M.', calidad: 'Reproceso de varios módulos.', sst: 'Incidente con primeros auxilios.' },
        { valor: 2, nivel: 'Bajo', alcance: 'Ajustes menores dentro de un nivel.', cronograma: '1 a 3 días hábiles.', costo: 'COP 2 M a 9 M.', calidad: 'Defecto corregido en el turno.', sst: 'Casi accidente.' },
        { valor: 1, nivel: 'Muy bajo', alcance: 'Sin efecto apreciable.', cronograma: 'Menos de 1 día hábil.', costo: 'Menos de COP 2 M.', calidad: 'Observación sin reproceso.', sst: 'Condición insegura corregida de inmediato.' },
      ]),
      matrizPI: withIds(MATRIZ_PI),
      formatosInformes: 'Registro de riesgos en este gestor; matriz de probabilidad e impacto (vista «Probabilidad e impacto»); informe de riesgos mensual con el riesgo general del proyecto, los riesgos de nivel Alto o Muy alto, los materializados y el saldo de las reservas; sección de riesgos en el informe semanal de desempeño.',
      seguimiento: 'Los propietarios revisan los disparadores cada semana y actualizan el estado en el registro antes del comité de obra. Las lecciones aprendidas sobre riesgos se registran al cierre de cada fase y la auditoría de noviembre verifica la eficacia de las respuestas.',
    },
  });

  add({
    id: 'registro-riesgos', name: 'Registro de riesgos', abbr: 'RRIE',
    area: 'riesgos', group: 'planificacion', process: '11.2', processes: ['11.2', '11.3', '11.4', '11.5', '11.6', '11.7'], kind: 'registro', multiple: false,
    purpose: 'Recoge los riesgos individuales del proyecto (amenazas y oportunidades) con su causa, efecto, probabilidad, impacto, propietario, estrategia, respuesta, disparador, reserva y estado. Se actualiza en todos los procesos de riesgos.',
    tips: [
      'Redacta cada riesgo como causa, evento y efecto: «Debido a…, puede ocurrir…, lo que causaría…».',
      'Asigna un solo propietario por riesgo y un disparador observable.',
      'La suma de las reservas de las amenazas debe ser coherente con la reserva para contingencias del presupuesto.',
      'Registra también las oportunidades, con estrategias de escalar, explotar, compartir, mejorar o aceptar; la columna «Coherencia de la estrategia» avisa cuando la estrategia no corresponde al tipo.',
    ],
    sections: [
      section('riesgos', 'Riesgos identificados', [
        table('riesgos', 'Riesgos', [
          cCode('id', 'Código', { width: 84, placeholder: 'R-001' }),
          cArea('descripcion', 'Descripción del riesgo', { width: 280 }),
          cArea('causa', 'Causa'),
          cArea('efecto', 'Efecto'),
          cSelect('categoria', 'Categoría', RIESGO_CATEGORIAS, { width: 200 }),
          cSelect('tipo', 'Tipo', RIESGO_TIPOS, { width: 120 }),
          cScale('probabilidad', 'Probabilidad (1–5)', ESCALA_FEM),
          cScale('impacto', 'Impacto (1–5)'),
          cCalc('puntuacion', 'Puntuación', calcRiskScore, fmtRisk, { hint: 'Probabilidad × impacto. Bajo 1–4, Medio 5–9, Alto 10–19, Muy alto 20–25.' }),
          cText('propietario', 'Propietario', { width: 170 }),
          cSelect('estrategia', 'Estrategia', RIESGO_ESTRATEGIAS, { width: 130, hint: 'Amenazas: escalar, evitar, transferir, mitigar o aceptar. Oportunidades: escalar, explotar, compartir, mejorar o aceptar.' }),
          cCalc('coherenciaEstrategia', 'Coherencia de la estrategia', calcStrategyFit, fmtText, { width: 190, align: 'left', hint: 'Compara la estrategia con el tipo de riesgo según la Guía del PMBOK: evitar, transferir y mitigar son solo para amenazas; explotar, compartir y mejorar, solo para oportunidades.' }),
          cArea('respuesta', 'Respuesta acordada', { width: 260 }),
          cArea('disparador', 'Disparador'),
          cMoney('reserva', 'Reserva', { hint: 'Reserva para contingencias asignada a la amenaza.' }),
          cSelect('estado', 'Estado', RIESGO_ESTADOS, { width: 140 }),
        ]),
      ]),
      section('seguimiento', 'Seguimiento y respuestas complementarias', [
        date('fechaRevision', 'Última revisión del registro'),
        area('listaVigilancia', 'Lista de vigilancia', { rows: 2, hint: 'Riesgos de baja prioridad o emergentes que se observan sin respuesta activa.' }),
        area('residuales', 'Riesgos residuales y secundarios', { rows: 3 }),
        area('planesReserva', 'Planes de reserva', { rows: 3, hint: 'Qué hacer si la respuesta principal no funciona.' }),
      ]),
    ],
    example: {
      riesgos: [
        { id: 'R-001', descripcion: 'Debido a la temporada de lluvias de octubre y noviembre en Bogotá, pueden presentarse lluvias intensas o tormentas eléctricas que obliguen a suspender el montaje en altura, lo que retrasaría la terminación de los niveles 6 a 15.', causa: 'Temporada de lluvias; trabajo a la intemperie en altura.', efecto: 'Días de suspensión, jornales de espera y atraso de la ruta crítica.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 3, propietario: 'Supervisor de montaje', estrategia: 'Mitigar', respuesta: 'Concentrar el montaje en la mañana; frentes alternos bajo cubierta (alistamiento y plataformas interiores); protocolo de suspensión por tormenta eléctrica; jornada extendida de 10 horas en días secos.', disparador: 'Pronóstico del IDEAM con probabilidad de lluvia mayor al 70 % o alerta de tormenta eléctrica.', reserva: 4800000, estado: 'En seguimiento' },
        { id: 'R-002', descripcion: 'Debido al trabajo continuo en alturas durante el montaje y el desmontaje, un montador podría sufrir una caída, lo que causaría lesiones graves, suspensión de la obra e investigación.', causa: 'Exposición permanente a más de 2 m; montaje sin baranda anticipada; fatiga.', efecto: 'Lesión grave o mortal; suspensión de 10 días o más; sanciones y sobrecostos.', categoria: 'Técnico', tipo: 'Amenaza', probabilidad: 2, impacto: 5, propietario: 'Coordinador SST (HSE)', estrategia: 'Mitigar', respuesta: 'Montaje con baranda anticipada; permiso de trabajo en alturas diario; coordinador de alturas en cada frente; inspección preuso de arneses y líneas de vida; plan de rescate con simulacro.', disparador: 'Permiso sin firmar, EPP en mal estado o viento mayor a 40 km/h.', reserva: 3000000, estado: 'Abierto' },
        { id: 'R-003', descripcion: 'Debido a que el inventario de bodega es compartido con otras obras y no coincide con el conteo físico, pueden faltar diagonales y plataformas para los niveles 11 a 15, lo que detendría el montaje de la segunda cuadrilla.', causa: 'Inventario compartido; diferencias entre el sistema y el conteo físico (INC-001).', efecto: 'Espera de hasta 8 días hábiles y subarriendo urgente.', categoria: 'De la organización', tipo: 'Amenaza', probabilidad: 5, impacto: 4, propietario: 'Coordinador logístico', estrategia: 'Mitigar', respuesta: 'Reservar el inventario en el sistema; inventario cíclico semanal; subarriendo preacordado con el proveedor aliado (contrato CA-2026-045).', disparador: 'Inventario disponible menor al 100 % de la lista de piezas de la etapa 10 días hábiles antes de su montaje.', reserva: 6400000, estado: 'En seguimiento' },
        { id: 'R-004', descripcion: 'Debido a reprogramaciones de la constructora en la secuencia de fachada, podría ser necesario reprogramar o remontar tramos del andamio, lo que generaría reprocesos y atrasos.', causa: 'Reprogramaciones del cliente; solicitudes no previstas.', efecto: 'Remontaje parcial, reprogramación de frentes y días adicionales.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 3, propietario: 'Director de proyecto', estrategia: 'Mitigar', respuesta: 'Comité semanal con el director de obra; secuencia congelada a dos semanas; toda modificación se tramita como solicitud de cambio con su impacto valorado.', disparador: 'Solicitud del cliente que modifique la secuencia de las dos semanas siguientes.', reserva: 2100000, estado: 'En seguimiento' },
        { id: 'R-005', descripcion: 'Debido a la operación de maquinaria y al acceso de terceros en la obra, pueden presentarse daños o hurto de piezas del andamio, lo que obligaría a reponerlas.', causa: 'Golpes de maquinaria del cliente; acopio sin cerramiento.', efecto: 'Reposición de piezas y posibles atrasos en el desmontaje.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 3, impacto: 2, propietario: 'Residente de obra', estrategia: 'Transferir', respuesta: 'Cláusula de custodia a cargo del cliente; inventario de entrega firmado; conciliación quincenal y cobro de faltantes al cliente.', disparador: 'Diferencia entre el inventario en obra y las remisiones.', reserva: 1100000, estado: 'Abierto' },
        { id: 'R-006', descripcion: 'Debido a demoras en la aprobación de actas y en la tesorería del cliente, el pago de las facturas podría retrasarse más de 60 días, lo que presionaría el capital de trabajo del proyecto.', causa: 'Aprobación tardía de actas; glosas a la factura electrónica.', efecto: 'Costo financiero y riesgo de no cubrir la nómina de las cuadrillas.', categoria: 'De la organización', tipo: 'Amenaza', probabilidad: 3, impacto: 3, propietario: 'Facturación y cartera', estrategia: 'Mitigar', respuesta: 'Radicar acta y factura dentro de los 3 días hábiles siguientes a la aprobación; seguimiento semanal de cartera; escalar a Gerencia General si la factura no se paga 15 días después de vencida.', disparador: 'Factura vencida sin pago (INC-005, factura de agosto).', reserva: 1200000, estado: 'En seguimiento' },
        { id: 'R-007', descripcion: 'Debido a las restricciones de circulación de vehículos de carga en Bogotá, los despachos de retorno podrían retrasarse o requerir horarios con recargo.', causa: 'Restricciones de movilidad para carga; congestión en la zona de la obra.', efecto: 'Viajes con recargo y esperas de la cuadrilla.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 2, propietario: 'Coordinador logístico', estrategia: 'Mitigar', respuesta: 'Despachos nocturnos en franjas permitidas; vehículos con placa habilitada para el día; permiso de cargue y descargue en vía.', disparador: 'Programa de despachos con viajes en franjas restringidas.', reserva: 1200000, estado: 'Abierto' },
        { id: 'R-008', descripcion: 'Debido a errores de montaje no detectados, la inspección de certificación de una etapa podría no aprobarse, lo que impediría su uso por el cliente.', causa: 'Autoinspección incompleta; tolerancias no verificadas.', efecto: 'Reinspección, correcciones y atraso de hasta 8 días hábiles.', categoria: 'Técnico', tipo: 'Amenaza', probabilidad: 1, impacto: 4, propietario: 'Ingeniero de diseño', estrategia: 'Aceptar', respuesta: 'Aceptación activa: autoinspección con la lista de verificación antes de solicitar la certificación y reserva para la reinspección.', disparador: 'Más de 3 no conformidades abiertas en la etapa por certificar.', reserva: 1000000, estado: 'Abierto' },
        { id: 'R-009', descripcion: 'Debido a la prioridad que da la constructora a sus frentes de estructura y fachada, la grúa torre del cliente podría no estar disponible para izar el andamio desde el nivel 6, lo que reduciría el rendimiento del montaje.', causa: 'Grúa compartida con los frentes del cliente, sin ventana garantizada en el contrato.', efecto: 'Izaje manual lento, jornales adicionales y atraso de los niveles 6 a 10.', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 3, propietario: 'Residente de obra', estrategia: 'Mitigar', respuesta: 'Ventana fija de grúa de 7:00 a 9:00 desde el 1 de octubre (decidida en el comité del 29 de septiembre); segundo malacate eléctrico de mayor capacidad desde el nivel 10 como plan de reserva.', disparador: 'Disponibilidad de grúa menor a 3 horas diarias durante dos días seguidos.', reserva: 1800000, estado: 'Materializado' },
        { id: 'R-010', descripcion: 'Debido a despachos no coordinados con el avance del montaje, podría faltar espacio de acopio en la obra y dañarse piezas.', causa: 'Programa de despachos independiente del avance real.', efecto: 'Doble manipulación y daño de piezas.', categoria: 'Dirección de proyectos', tipo: 'Amenaza', probabilidad: 1, impacto: 3, propietario: 'Coordinador logístico', estrategia: 'Evitar', respuesta: 'Despacho por etapas aprobado por el residente y acopio delimitado por niveles.', disparador: 'Acopio en obra mayor al requerido para dos semanas de montaje.', reserva: 0, estado: 'Cerrado' },
        { id: 'R-011', descripcion: 'Debido a la reprogramación de la fachada del cliente, este podría extender el alquiler del andamio montado, lo que aumentaría los ingresos del proyecto sin nuevos costos de montaje.', causa: 'Atraso de los acabados de fachada de la constructora.', efecto: 'Ingreso adicional por alquiler con el equipo ya montado.', categoria: 'Externo', tipo: 'Oportunidad', probabilidad: 3, impacto: 4, propietario: 'Director de proyecto', estrategia: 'Mejorar', respuesta: 'Presentar una propuesta de extensión con tarifa preferencial; mantener el equipo en buen estado. El cliente radicó la solicitud CC-003 el 29 de septiembre.', disparador: 'Reprogramación de la fachada comunicada por el cliente.', estado: 'En seguimiento' },
        { id: 'R-012', descripcion: 'Debido a que otra obra de la empresa necesitará andamio en diciembre, las piezas podrían despacharse directamente desde Altavista, lo que ahorraría transporte de retorno e inspección en bodega.', causa: 'Nueva obra de la empresa con inicio previsto en diciembre de 2026.', efecto: 'Ahorro en viajes de retorno y manipulación.', categoria: 'De la organización', tipo: 'Oportunidad', probabilidad: 2, impacto: 3, propietario: 'Coordinador logístico', estrategia: 'Explotar', respuesta: 'Coordinar con la Gerencia de Operaciones la asignación del equipo e inspeccionarlo en obra antes del despacho directo.', disparador: 'Confirmación de la fecha de inicio de la otra obra.', estado: 'Abierto' },
      ],
      fechaRevision: '2026-10-02',
      listaVigilancia: 'Viento fuerte en los niveles 11 a 15 (por encima de 30 m); rotación de montadores certificados; desmontaje en temporada de fin de año si se aprueba el CC-003.',
      residuales: 'Después de las respuestas, R-001 conserva un riesgo residual de cerca de 2 días de suspensión por mes en temporada de lluvias y R-002 se mantiene en vigilancia permanente. Riesgo secundario de R-009: el segundo malacate eléctrico exige inspección y operador capacitado.',
      planesReserva: 'R-003: si el subarriendo no llega a tiempo, trasladar piezas de los niveles 1 a 5 cuando el cliente libere la fachada norte. R-001: si la suspensión supera 5 días en un mes, programar la segunda cuadrilla los sábados en la tarde. R-009: si la ventana de grúa no se cumple, instalar el segundo malacate eléctrico desde el nivel 10.',
    },
  });

  add({
    id: 'informe-riesgos', name: 'Informe de riesgos', abbr: 'IRIE',
    area: 'riesgos', group: 'planificacion', process: '11.2', processes: ['11.2', '11.3', '11.4', '11.5', '11.6', '11.7'], kind: 'informe', multiple: false,
    purpose: 'Presenta el riesgo general del proyecto y sus fuentes, junto con información resumida de los riesgos individuales: cantidad por categoría, riesgos principales, tendencias, estado de las reservas y recomendaciones.',
    tips: [
      'Informa el riesgo general del proyecto, no solo la lista de riesgos individuales.',
      'Muestra la tendencia frente al informe anterior y el saldo de las reservas.',
      'Destaca los riesgos que requieren una decisión del patrocinador.',
    ],
    sections: [
      section('general', 'Datos del informe', [
        date('fecha', 'Fecha del informe'),
        text('periodo', 'Periodo'),
        text('elaboradoPor', 'Elaborado por'),
      ]),
      section('global', 'Riesgo general del proyecto', [
        select('nivelGeneral', 'Nivel del riesgo general', RIESGO_NIVELES),
        select('tendencia', 'Tendencia', TENDENCIAS),
        area('fuentesRiesgoGeneral', 'Fuentes del riesgo general', { hint: 'Impulsores más importantes de la exposición al riesgo del proyecto en su conjunto.' }),
      ]),
      section('resumen', 'Resumen de los riesgos individuales', [
        table('resumenCategorias', 'Riesgos por categoría', [
          cSelect('categoria', 'Categoría', RIESGO_CATEGORIAS, { width: 200 }),
          cNum('amenazas', 'Amenazas', { min: 0 }),
          cNum('oportunidades', 'Oportunidades', { min: 0 }),
          cNum('mayorPuntuacion', 'Mayor puntuación', { min: 0, max: 25 }),
          cArea('comentario', 'Comentario'),
        ]),
        table('principales', 'Riesgos principales', [
          cText('riesgo', 'Riesgo', { width: 260 }),
          cSelect('nivel', 'Nivel', RIESGO_NIVELES, { width: 110 }),
          cSelect('tendencia', 'Tendencia', TENDENCIAS, { width: 140 }),
          cArea('respuesta', 'Estado de la respuesta', { width: 280 }),
        ]),
      ]),
      section('reservas', 'Reservas', [
        money('reservaContingencia', 'Reserva para contingencias'),
        money('reservaUtilizada', 'Reserva utilizada a la fecha'),
        area('comentarioReservas', 'Análisis de las reservas', { rows: 3 }),
      ]),
      section('recomendaciones', 'Riesgos emergentes y recomendaciones', [
        area('emergentes', 'Riesgos emergentes', { rows: 2 }),
        area('recomendaciones', 'Recomendaciones y decisiones requeridas', { rows: 3 }),
      ]),
    ],
    example: {
      fecha: '2026-10-02',
      periodo: 'Septiembre de 2026 (corte del 2 de octubre)',
      elaboradoPor: 'Director de proyecto',
      nivelGeneral: 'Medio',
      tendencia: 'En aumento',
      fuentesRiesgoGeneral: 'La exposición general la impulsan tres factores: la temporada de lluvias de octubre y noviembre, la disponibilidad de la grúa del cliente (ya materializada, SPI 0,93) y el inventario ajustado de diagonales y plataformas para los niveles 11 a 15, que se montarán con dos cuadrillas en paralelo. El atraso acumulado reduce la holgura disponible antes de la entrega del 18 de diciembre.',
      resumenCategorias: [
        { id: 'r1', categoria: 'Técnico', amenazas: 2, oportunidades: 0, mayorPuntuacion: 10, comentario: 'Seguridad en alturas y certificación de etapas.' },
        { id: 'r2', categoria: 'Externo', amenazas: 5, oportunidades: 1, mayorPuntuacion: 12, comentario: 'Clima, grúa y secuencia del cliente, movilidad de carga.' },
        { id: 'r3', categoria: 'De la organización', amenazas: 2, oportunidades: 1, mayorPuntuacion: 20, comentario: 'Faltantes de piezas (muy alto) y pagos del cliente.' },
        { id: 'r4', categoria: 'Dirección de proyectos', amenazas: 1, oportunidades: 0, mayorPuntuacion: 3, comentario: 'Cerrado al terminar la logística de ida.' },
      ],
      principales: [
        { id: 'r1', riesgo: 'R-003 Faltantes de diagonales y plataformas para los niveles 11 a 15', nivel: 'Muy alto', tendencia: 'Estable', respuesta: 'Inventario reservado y conteo cíclico semanal; subarriendo preacordado listo para activarse el 6 de octubre.' },
        { id: 'r2', riesgo: 'R-009 Grúa del cliente no disponible', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Materializado (INC-003). Ventana fija de 7:00 a 9:00 desde el 1 de octubre; segundo malacate como plan de reserva.' },
        { id: 'r3', riesgo: 'R-001 Lluvias que detienen el montaje', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Jornada extendida en días secos y frentes alternos bajo cubierta.' },
        { id: 'r4', riesgo: 'R-004 Cambios del cliente en la secuencia de obra', nivel: 'Alto', tendencia: 'En aumento', respuesta: 'Secuencia congelada a dos semanas; la reprogramación de la fachada ya generó la solicitud CC-003, en análisis.' },
        { id: 'r5', riesgo: 'R-002 Caída de altura de un montador', nivel: 'Alto', tendencia: 'Estable', respuesta: 'Permisos diarios, baranda anticipada y simulacro de rescate del 24 de septiembre.' },
        { id: 'r6', riesgo: 'R-006 Retraso en los pagos del cliente', nivel: 'Medio', tendencia: 'En aumento', respuesta: 'Factura de agosto vencida (INC-005); cobro en curso con plazo al 15 de octubre.' },
      ],
      reservaContingencia: 22600000,
      reservaUtilizada: 6100000,
      comentarioReservas: 'Se usaron COP 6,1 millones: subarriendo de 180 diagonales adicionales (INC-001, COP 3,9 millones) y jornada extendida de septiembre (INC-002, COP 2,2 millones). Quedan COP 16,5 millones frente a un valor monetario esperado de COP 20,8 millones de las amenazas abiertas o en seguimiento. Si se aprueban las horas extra de octubre (hasta COP 6 millones), el saldo bajaría a COP 10,5 millones: la reserva quedaría corta si se materializa otra amenaza alta.',
      emergentes: 'Viento fuerte en los niveles 11 a 15 durante el montaje. Si se aprueba el CC-003, el desmontaje coincidiría con la temporada de fin de año (menor disponibilidad de transporte y personal).',
      recomendaciones: 'Recuperar el SPI con la segunda cuadrilla desde el 13 de octubre; reestimar el valor monetario esperado de R-001, R-003 y R-009 con la información de septiembre; decidir el CC-003 incluyendo su efecto en los riesgos del desmontaje; si la brecha de la reserva se confirma, tramitar una solicitud de cambio para que Gerencia General traslade parte de la reserva de gestión a la reserva para contingencias.',
    },
  });

  add({
    id: 'analisis-cuantitativo', name: 'Análisis cuantitativo (valor monetario esperado)', abbr: 'ACUA',
    area: 'riesgos', group: 'planificacion', process: '11.4', processes: ['11.4', '11.7'], kind: 'registro', multiple: false,
    purpose: 'Analiza numéricamente el efecto combinado de los riesgos individuales sobre los objetivos del proyecto: valor monetario esperado (VME) de amenazas y oportunidades, reserva para contingencias recomendada y probabilidad de cumplir costo y fecha.',
    tips: [
      'Usa probabilidades coherentes con la escala del plan de gestión de los riesgos (p. ej., nivel 3 = 40 %).',
      'El VME de las amenazas es negativo y el de las oportunidades positivo; la última fila de las columnas acumuladas da ambos totales, y la reserva para contingencias se calcula con el de las amenazas.',
      'Para la fecha de terminación, complementa con una simulación de Monte Carlo sobre las estimaciones por tres valores.',
    ],
    sections: [
      section('vme', 'Valor monetario esperado', [
        table('riesgos', 'VME por riesgo', [
          cText('riesgo', 'Riesgo', { width: 260 }),
          cSelect('tipo', 'Tipo', RIESGO_TIPOS, { width: 120 }),
          cPct('probabilidad', 'Probabilidad (%)'),
          cMoney('impacto', 'Impacto', { hint: 'Efecto en costo si el riesgo ocurre (valor positivo).' }),
          cCalc('vme', 'VME', calcEmv, fmtMoney, { hint: 'Probabilidad × impacto: negativo para amenazas, positivo para oportunidades.' }),
          cCalc('vmeAmenazas', 'VME acumulado de amenazas', cumThreatEmv, fmtMoney, { width: 150, hint: 'Suma del VME de las amenazas hasta esta fila. En la última fila es el VME total de las amenazas, base de la reserva para contingencias.' }),
          cCalc('vmeOportunidades', 'VME acumulado de oportunidades', cumOpportunityEmv, fmtMoney, { width: 150, hint: 'Suma del VME de las oportunidades hasta esta fila. En la última fila, VME neto = total de amenazas + total de oportunidades.' }),
          cArea('base', 'Base del impacto'),
        ]),
      ]),
      section('resultados', 'Resultados', [
        money('reservaRecomendada', 'Reserva para contingencias recomendada', { hint: 'Toma como base el VME total de las amenazas (última fila de «VME acumulado de amenazas», en valor absoluto); las oportunidades no la reducen.' }),
        area('resultadosCronograma', 'Análisis del cronograma (Monte Carlo)', { rows: 3 }),
        area('sensibilidad', 'Análisis de sensibilidad', { rows: 2 }),
        area('conclusiones', 'Conclusiones', { rows: 3 }),
        list('tecnicas', 'Técnicas aplicadas'),
      ]),
    ],
    example: {
      riesgos: [
        { id: 'r1', riesgo: 'R-001 Lluvias que detienen el montaje', tipo: 'Amenaza', probabilidad: 60, impacto: 8000000, base: 'Jornales de espera de una cuadrilla por 5 días y reprogramación.' },
        { id: 'r2', riesgo: 'R-002 Caída de altura de un montador', tipo: 'Amenaza', probabilidad: 20, impacto: 15000000, base: 'Suspensión de 10 días por investigación, reemplazo y sobrecostos.' },
        { id: 'r3', riesgo: 'R-003 Faltantes de piezas para los niveles 11 a 15', tipo: 'Amenaza', probabilidad: 80, impacto: 8000000, base: 'Subarriendo urgente y espera parcial de 8 días hábiles.' },
        { id: 'r4', riesgo: 'R-004 Cambios en la secuencia de obra del cliente', tipo: 'Amenaza', probabilidad: 60, impacto: 3500000, base: 'Remontaje parcial y reprogramación de frentes.' },
        { id: 'r5', riesgo: 'R-005 Daño o hurto de equipo en obra', tipo: 'Amenaza', probabilidad: 40, impacto: 2750000, base: 'Reposición de piezas no cubierta por el cliente.' },
        { id: 'r6', riesgo: 'R-006 Retraso en los pagos del cliente', tipo: 'Amenaza', probabilidad: 40, impacto: 3000000, base: 'Costo financiero de 60 días sobre el capital de trabajo.' },
        { id: 'r7', riesgo: 'R-007 Restricciones de circulación de carga', tipo: 'Amenaza', probabilidad: 60, impacto: 2000000, base: 'Recargos y esperas en los viajes de retorno.' },
        { id: 'r8', riesgo: 'R-008 Certificación de una etapa no aprobada', tipo: 'Amenaza', probabilidad: 5, impacto: 20000000, base: 'Reinspección y correcciones de una etapa completa.' },
        { id: 'r9', riesgo: 'R-009 Grúa del cliente no disponible', tipo: 'Amenaza', probabilidad: 60, impacto: 3000000, base: 'Jornales adicionales y alquiler de malacate eléctrico.' },
        { id: 'r10', riesgo: 'R-011 Extensión del alquiler por reprogramación de la fachada', tipo: 'Oportunidad', probabilidad: 40, impacto: 12000000, base: 'Margen de tres semanas adicionales de alquiler (ingreso menos mantenimiento, inspección y pólizas).' },
        { id: 'r11', riesgo: 'R-012 Despacho directo de piezas a otra obra', tipo: 'Oportunidad', probabilidad: 20, impacto: 6000000, base: 'Ahorro de viajes de retorno e inspección en bodega.' },
      ],
      reservaRecomendada: 22600000,
      resultadosCronograma: 'Simulación de Monte Carlo (1.000 iteraciones) con las estimaciones por tres valores de montaje y desmontaje y los riesgos R-001, R-003 y R-009: P50 = 11 de diciembre, P80 = 18 de diciembre y P90 = 23 de diciembre de 2026. La fecha comprometida tiene cerca de 80 % de confianza.',
      sensibilidad: 'R-003, R-001 y R-002 concentran el 63 % del valor monetario esperado de las amenazas (COP 14,2 de 22,6 millones); son los primeros a vigilar en el diagrama de tornado.',
      conclusiones: 'La reserva para contingencias de COP 22,6 millones cubre el VME de las amenazas; con ella la línea base de costos (COP 474,6 millones) queda dentro del presupuesto aprobado de COP 486,5 millones. Las oportunidades (VME de COP 6,0 millones) no se descuentan de la reserva.',
      tecnicas: [
        'Valor monetario esperado (VME).',
        'Simulación de Monte Carlo del cronograma con estimaciones por tres valores.',
        'Análisis de sensibilidad (diagrama de tornado).',
        'Entrevistas a expertos para los rangos de impacto.',
      ],
    },
  });

  /* ================================================================== 12. ADQUISICIONES */

  add({
    id: 'plan-gestion-adquisiciones', name: 'Plan de gestión de las adquisiciones', abbr: 'PGAD',
    area: 'adquisiciones', group: 'planificacion', process: '12.1', processes: ['12.1'], kind: 'plan', multiple: false,
    purpose: 'Define cómo se adquirirán los bienes y servicios externos del proyecto: coordinación con el cronograma, actividades clave, roles y límites de aprobación, métricas de los proveedores, condiciones contractuales, garantías y proveedores precalificados.',
    tips: [
      'Exige a los proveedores que ingresan a la obra la evaluación de estándares mínimos del SG-SST (Resolución 0312 de 2019) y la planilla de seguridad social.',
      'Define las pólizas por tipo de contrato: cumplimiento, calidad, salarios y prestaciones sociales y responsabilidad civil extracontractual.',
      'Establece límites de aprobación por monto y quién supervisa cada contrato.',
    ],
    sections: [
      section('coordinacion', 'Coordinación y cronograma', [
        area('coordinacion', 'Coordinación con otros aspectos del proyecto', { rows: 3 }),
        table('cronogramaAdquisiciones', 'Cronograma de las actividades clave', [
          cText('adquisicion', 'Adquisición', { width: 240 }),
          cDate('solicitudOfertas', 'Solicitud de ofertas'),
          cDate('adjudicacion', 'Adjudicación'),
          cDate('inicio', 'Inicio'),
          cDate('fin', 'Fin'),
          cText('responsable', 'Responsable', { width: 170 }),
        ]),
      ]),
      section('roles', 'Roles y límites de aprobación', [
        table('rolesAdquisiciones', 'Roles y responsabilidades', [
          cText('rol', 'Rol', { width: 200 }),
          cArea('responsabilidad', 'Responsabilidad', { width: 300 }),
          cText('limite', 'Límite de aprobación', { width: 200 }),
        ]),
      ]),
      section('metricas', 'Métricas de desempeño de los proveedores', [
        table('metricasProveedor', 'Métricas', [
          cText('metrica', 'Métrica', { width: 280 }),
          cText('meta', 'Meta', { width: 110 }),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
        ], {
          defaultRows: [
            { metrica: 'Entregas a tiempo', meta: '≥ 95 %', frecuencia: 'Mensual' },
            { metrica: 'No conformidades en la recepción', meta: '≤ 2 %', frecuencia: 'Por evento' },
            { metrica: 'Cumplimiento SST del proveedor', meta: '100 %', frecuencia: 'Mensual' },
          ],
        }),
      ]),
      section('condiciones', 'Condiciones contractuales', [
        text('jurisdiccion', 'Jurisdicción legal y solución de controversias'),
        text('moneda', 'Moneda y condiciones de pago'),
        area('garantias', 'Pólizas y garantías exigidas', { rows: 3 }),
        area('estimacionesIndependientes', 'Estimaciones independientes', { rows: 2 }),
        area('supuestosRestricciones', 'Supuestos y restricciones', { rows: 2 }),
        list('proveedoresPrecalificados', 'Proveedores precalificados'),
      ]),
    ],
    example: {
      coordinacion: 'Las órdenes se emiten con 10 días hábiles de anticipación a la fecha de necesidad del cronograma. El avance de los proveedores se informa en el comité de obra y en el informe semanal de desempeño. El área de compras de la empresa negocia y elabora los contratos; el director de proyecto define necesidades, adjudica y designa al supervisor.',
      cronogramaAdquisiciones: [
        { id: 'r1', adquisicion: 'Levantamiento topográfico y de fachada', solicitudOfertas: '2026-07-20', adjudicacion: '2026-07-27', inicio: '2026-08-03', fin: '2026-08-06', responsable: 'Ingeniero de diseño' },
        { id: 'r2', adquisicion: 'Exámenes médicos ocupacionales', solicitudOfertas: '2026-07-27', adjudicacion: '2026-07-31', inicio: '2026-08-04', fin: '2026-08-08', responsable: 'Coordinador SST (HSE)' },
        { id: 'r3', adquisicion: 'Ensayo de arrancamiento de anclajes en losa', solicitudOfertas: '2026-07-27', adjudicacion: '2026-08-03', inicio: '2026-08-11', fin: '2026-08-11', responsable: 'Ingeniero de diseño' },
        { id: 'r4', adquisicion: 'Transporte en tractomula (ida y retorno)', solicitudOfertas: '2026-07-27', adjudicacion: '2026-08-07', inicio: '2026-08-26', fin: '2026-12-16', responsable: 'Coordinador logístico' },
        { id: 'r5', adquisicion: 'Subarriendo de diagonales y plataformas', solicitudOfertas: '2026-08-03', adjudicacion: '2026-08-14', inicio: '2026-08-26', fin: '2026-12-12', responsable: 'Coordinador logístico' },
        { id: 'r6', adquisicion: 'Inspección y certificación por persona competente', solicitudOfertas: '2026-08-10', adjudicacion: '2026-08-24', inicio: '2026-09-19', fin: '2026-11-12', responsable: 'Director de proyecto' },
      ],
      rolesAdquisiciones: [
        { id: 'r1', rol: 'Gerencia General', responsabilidad: 'Aprueba contratos mayores a COP 50 millones y las excepciones al método de selección.', limite: 'Más de COP 50 M' },
        { id: 'r2', rol: 'Director de proyecto', responsabilidad: 'Define necesidades, aprueba los enunciados del trabajo, adjudica y designa supervisores.', limite: 'Hasta COP 50 M' },
        { id: 'r3', rol: 'Área de compras', responsabilidad: 'Solicita ofertas, verifica requisitos habilitantes y pólizas, elabora y archiva los contratos.', limite: 'Sin facultad de aprobación' },
        { id: 'r4', rol: 'Coordinador logístico', responsabilidad: 'Recibe los bienes y servicios de logística y firma las remisiones.', limite: 'Compras menores hasta COP 5 M' },
        { id: 'r5', rol: 'Supervisor del contrato', responsabilidad: 'Verifica el cumplimiento, aprueba las facturas y evalúa al proveedor.', limite: 'Pagos del contrato asignado' },
      ],
      metricasProveedor: [
        { id: 'r1', metrica: 'Entregas a tiempo', meta: '≥ 95 %', frecuencia: 'Mensual' },
        { id: 'r2', metrica: 'No conformidades en la recepción', meta: '≤ 2 %', frecuencia: 'Por evento' },
        { id: 'r3', metrica: 'Cumplimiento SST del proveedor (planilla, EPP, permisos)', meta: '100 %', frecuencia: 'Mensual' },
        { id: 'r4', metrica: 'Facturas sin errores', meta: '≥ 98 %', frecuencia: 'Mensual' },
      ],
      jurisdiccion: 'Leyes de la República de Colombia; controversias por arreglo directo y, si no hay acuerdo, conciliación en el centro de la Cámara de Comercio de Bogotá.',
      moneda: 'Pesos colombianos (COP), precios antes de IVA; pago a 30 días contra factura electrónica y retención en garantía del 5 %.',
      garantias: 'Contratos de más de COP 5 millones: póliza de cumplimiento (10 % del valor, vigencia del contrato y 4 meses más) y de pago de salarios y prestaciones sociales (5 %, vigencia del contrato y 3 años más). Proveedores que trabajan en la obra o transportan carga: póliza de responsabilidad civil extracontractual; el transporte, además, seguro de la carga. Suministros y subarriendos: póliza de calidad del bien (10 %, vigencia del contrato y un año más).',
      estimacionesIndependientes: 'El coordinador logístico prepara una estimación independiente del transporte con los costos de referencia del SICE-TAC; el ingeniero de diseño estima la inspección con tarifas de obras anteriores.',
      supuestosRestricciones: 'Supuesto: hay al menos tres proveedores calificados para cada adquisición. Restricción: solo ingresan a la obra proveedores con SG-SST evaluado y seguridad social al día.',
      proveedoresPrecalificados: [
        'Transportador A: tractomulas y camiones de 10 t.',
        'Transportador B: tractomulas con despachos nocturnos.',
        'Proveedor aliado de andamio multidireccional compatible.',
        'Inspector de andamios independiente (persona competente certificada).',
        'Laboratorio de ensayos de anclajes.',
        'IPS de salud ocupacional con convenio vigente.',
      ],
    },
  });

  add({
    id: 'estrategia-adquisiciones', name: 'Estrategia de las adquisiciones', abbr: 'EADQ',
    area: 'adquisiciones', group: 'planificacion', process: '12.1', processes: ['12.1'], kind: 'documento', multiple: false,
    purpose: 'Determina para cada adquisición el método de entrega, el tipo de acuerdo contractual y las fases de la adquisición con sus criterios de desempeño y de salida.',
    tips: [
      'Elige el tipo de contrato según la claridad del alcance: precio fijo si está bien definido; tiempo y materiales si las cantidades son inciertas.',
      'Define criterios de salida para cada fase de la adquisición y verifícalos antes de avanzar.',
      'Considera el costo total (transporte, seguros, retenciones), no solo el precio unitario.',
    ],
    sections: [
      section('enfoque', 'Enfoque general', [
        area('enfoque', 'Enfoque de las adquisiciones', { rows: 3 }),
      ]),
      section('estrategias', 'Método de entrega y tipo de acuerdo', [
        table('estrategias', 'Estrategia por adquisición', [
          cText('adquisicion', 'Adquisición', { width: 220 }),
          cSelect('metodoEntrega', 'Método de entrega', METODOS_ENTREGA, { width: 290 }),
          cSelect('tipoContrato', 'Tipo de contrato', TIPOS_CONTRATO, { width: 320 }),
          cSelect('metodoSeleccion', 'Método de selección', METODOS_SELECCION, { width: 270 }),
          cArea('justificacion', 'Justificación'),
        ]),
      ]),
      section('fases', 'Fases de la adquisición', [
        table('fases', 'Fases', [
          cText('fase', 'Fase', { width: 160 }),
          cArea('descripcion', 'Descripción'),
          cArea('criteriosDesempeno', 'Criterios de desempeño'),
          cArea('criteriosSalida', 'Criterios de salida'),
        ]),
        area('seguimiento', 'Seguimiento y transferencia de conocimiento', { rows: 3 }),
      ]),
    ],
    example: {
      enfoque: 'Se contratan solo los bienes y servicios que la empresa no tiene o que no son parte de su competencia central: transporte de carga, piezas faltantes, topografía, inspección independiente y exámenes médicos. El diseño, el montaje y el desmontaje se ejecutan con personal propio para conservar el control de la seguridad y la calidad.',
      estrategias: [
        { id: 'r1', adquisicion: 'Transporte en tractomula (ida y retorno)', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Tiempo y materiales (T&M)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'La cantidad de viajes de retorno depende del avance; tarifa por viaje con valor máximo del contrato.' },
        { id: 'r2', adquisicion: 'Subarriendo de diagonales y plataformas', metodoEntrega: 'Suministro directo (orden de compra)', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Menor costo', justificacion: 'Piezas estándar compatibles; precio mensual fijo por lote.' },
        { id: 'r3', adquisicion: 'Inspección y certificación', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Tiempo y materiales (T&M)', metodoSeleccion: 'Calificaciones únicamente', justificacion: 'La competencia del inspector es crítica; la interventoría exige independencia; tarifa por inspección.' },
        { id: 'r4', adquisicion: 'Levantamiento topográfico', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Alcance corto y bien definido.' },
        { id: 'r5', adquisicion: 'Exámenes médicos ocupacionales', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Fuente única', justificacion: 'IPS con convenio corporativo vigente y tarifas negociadas.' },
      ],
      fases: [
        { id: 'r1', fase: 'Preparación', descripcion: 'Enunciados del trabajo, criterios de selección y solicitud de ofertas.', criteriosDesempeno: 'Enunciados aprobados por el director de proyecto.', criteriosSalida: 'Ofertas recibidas de al menos tres proveedores (salvo fuente única).' },
        { id: 'r2', fase: 'Selección y contratación', descripcion: 'Evaluación, negociación, firma y aprobación de pólizas.', criteriosDesempeno: 'Evaluación documentada con criterios ponderados.', criteriosSalida: 'Contrato firmado, pólizas aprobadas y acta de inicio.' },
        { id: 'r3', fase: 'Ejecución y control', descripcion: 'Supervisión, recepción, pagos y evaluación de desempeño.', criteriosDesempeno: 'Métricas del plan de gestión de las adquisiciones.', criteriosSalida: 'Bienes y servicios recibidos a satisfacción.' },
        { id: 'r4', fase: 'Cierre', descripcion: 'Liquidación, devolución de la retención en garantía y evaluación final.', criteriosDesempeno: 'Sin reclamaciones abiertas.', criteriosSalida: 'Acta de liquidación firmada.' },
      ],
      seguimiento: 'El supervisor de cada contrato registra el desempeño en el seguimiento de contratos y desempeño de proveedores. La evaluación final alimenta la lista de proveedores precalificados de la empresa.',
    },
  });

  add({
    id: 'decisiones-hacer-comprar', name: 'Análisis de hacer o comprar', abbr: 'HOC',
    area: 'adquisiciones', group: 'planificacion', process: '12.1', processes: ['12.1'], kind: 'registro', multiple: false,
    purpose: 'Compara, para cada necesidad, el costo y las condiciones de hacerlo con recursos propios frente a comprarlo, contratarlo o alquilarlo, y documenta la decisión tomada.',
    tips: [
      'Compara costos completos: mano de obra, depreciación, seguros y costo de oportunidad del equipo propio.',
      'Incluye factores cualitativos: control de la seguridad, exigencias del cliente (inspector independiente) y riesgo transferido.',
      'En equipos evalúa también el subarriendo: puede convenir más que comprar piezas que no se volverán a usar.',
    ],
    sections: [
      section('analisis', 'Análisis', [
        table('analisis', 'Alternativas por necesidad', [
          cText('item', 'Necesidad', { width: 200 }),
          cArea('opcionHacer', 'Hacer (recursos propios)'),
          cMoney('costoHacer', 'Costo de hacer'),
          cArea('opcionComprar', 'Comprar, contratar o alquilar'),
          cMoney('costoComprar', 'Costo de comprar'),
          cCalc('diferencia', 'Diferencia (hacer − comprar)', calcMakeBuyDiff, fmtMakeBuy, { hint: 'Positiva: comprar, contratar o alquilar cuesta menos. Negativa: hacer cuesta menos.' }),
          cArea('factores', 'Factores cualitativos'),
          cSelect('decision', 'Decisión', DECISION_HACER_COMPRAR, { width: 110 }),
        ]),
      ]),
      section('conclusion', 'Criterios y conclusión', [
        area('criterios', 'Criterios de decisión', { rows: 2 }),
        area('conclusion', 'Conclusión', { rows: 3 }),
      ]),
    ],
    example: {
      analisis: [
        { id: 'r1', item: 'Transporte de ida y retorno', opcionHacer: 'Dos camiones propios de 10 t, con el doble de viajes (24).', costoHacer: 27600000, opcionComprar: 'Transportador en tractomula por viaje (12 viajes).', costoComprar: 22800000, factores: 'Los camiones propios están comprometidos con otras obras; el transportador asume el riesgo de la carga.', decision: 'Comprar' },
        { id: 'r2', item: 'Diagonales y plataformas faltantes (≈ 10 %)', opcionHacer: 'Trasladar piezas de otras obras de la empresa y reprogramar sus desmontajes.', costoHacer: 11500000, opcionComprar: 'Subarriendo por 3,7 meses a un proveedor aliado.', costoComprar: 8880000, factores: 'El traslado atrasaría dos obras en curso. Comprar piezas nuevas (cerca de COP 58 millones) se descartó: la caja del proyecto no lo soporta y no hay demanda confirmada.', decision: 'Alquilar' },
        { id: 'r3', item: 'Diseño, memoria de cálculo y planes de trabajo', opcionHacer: 'Ingeniero de diseño propio.', costoHacer: 22600000, opcionComprar: 'Firma de ingeniería externa.', costoComprar: 29000000, factores: 'Conocimiento del sistema y disponibilidad inmediata.', decision: 'Hacer' },
        { id: 'r4', item: 'Inspección y certificación por etapa', opcionHacer: 'Certificar a un supervisor propio como persona competente.', costoHacer: 7800000, opcionComprar: 'Inspector externo certificado (6 jornadas).', costoComprar: 9600000, factores: 'La interventoría exige un inspector independiente del montador.', decision: 'Comprar' },
        { id: 'r5', item: 'Levantamiento topográfico', opcionHacer: 'Alquilar estación total y usar un técnico propio.', costoHacer: 5100000, opcionComprar: 'Firma de topografía con dos topógrafos.', costoComprar: 3690000, factores: 'Sin personal propio con experiencia en levantamiento de fachadas.', decision: 'Comprar' },
      ],
      criterios: 'Costo total, capacidad disponible, control sobre la seguridad y la calidad, exigencias del cliente y riesgo transferido al proveedor.',
      conclusion: 'Se contratan el transporte, la topografía, el ensayo de anclajes y la inspección independiente; se subarriendan las piezas faltantes; el diseño, el montaje y el desmontaje se hacen con personal propio.',
    },
  });

  add({
    id: 'enunciado-trabajo-adquisicion', name: 'Enunciado del trabajo de la adquisición (SOW)', abbr: 'SOW',
    area: 'adquisiciones', group: 'planificacion', process: '12.1', processes: ['12.1'], kind: 'documento', multiple: true,
    purpose: 'Describe con detalle suficiente el trabajo que se adquiere para que los proveedores determinen si pueden ofrecerlo: especificaciones, cantidades, niveles de calidad, lugar, plazo, requisitos de SST y condiciones.',
    tips: [
      'Describe el trabajo con el detalle necesario para cotizar sin preguntar: cantidades, especificaciones, lugar, plazo y criterios de aceptación.',
      'Incluye los requisitos de SST y de seguridad vial (PESV) que el proveedor debe cumplir en la obra.',
      'Especifica las pólizas y los documentos exigidos; sin ellos no se firma el acta de inicio.',
    ],
    sections: [
      section('general', 'Información general', [
        text('adquisicion', 'Objeto de la adquisición'),
        text('paqueteEdt', 'Paquetes de la EDT relacionados'),
        select('tipoContrato', 'Tipo de contrato previsto', TIPOS_CONTRATO),
        area('antecedentes', 'Antecedentes y justificación', { rows: 3 }),
      ]),
      section('alcance', 'Alcance del trabajo', [
        area('descripcionTrabajo', 'Descripción del trabajo'),
        table('entregables', 'Entregables', [
          cText('entregable', 'Entregable', { width: 220 }),
          cArea('especificacion', 'Especificación'),
          cNum('cantidad', 'Cantidad', { min: 0 }),
          cText('unidad', 'Unidad', { width: 90 }),
          cDate('fecha', 'Fecha límite'),
        ]),
        list('exclusiones', 'Exclusiones'),
      ]),
      section('requisitos', 'Requisitos', [
        area('especificaciones', 'Especificaciones técnicas', { rows: 3 }),
        area('calidad', 'Niveles de calidad y criterios de aceptación', { rows: 3 }),
        area('sst', 'Requisitos de SST y ambientales', { rows: 3 }),
        text('lugar', 'Lugar de ejecución'),
        date('periodoInicio', 'Inicio del periodo de desempeño'),
        date('periodoFin', 'Fin del periodo de desempeño'),
        text('horario', 'Horario'),
      ]),
      section('condiciones', 'Condiciones', [
        area('formaPago', 'Forma de pago', { rows: 2 }),
        list('polizas', 'Pólizas exigidas'),
        text('supervision', 'Supervisor del contrato (rol)'),
        list('documentosRequeridos', 'Documentos que debe presentar el proveedor'),
      ]),
    ],
    example: {
      adquisicion: 'Transporte de carga del equipo de andamio multidireccional entre la bodega principal de la empresa y la obra Edificio Altavista (ida y retorno).',
      paqueteEdt: '1.3 Suministro y logística; 1.6 Desmontaje y retiro',
      tipoContrato: 'Tiempo y materiales (T&M)',
      antecedentes: 'El proyecto requiere seis viajes de ida en agosto de 2026 y seis de retorno en diciembre de 2026. La empresa no dispone de flota suficiente en esas fechas (ver el análisis de hacer o comprar).',
      descripcionTrabajo: 'El proveedor suministra tractomulas con conductor para cargar en la bodega y descargar en la obra según el programa semanal de despachos. El cargue y el descargue los hace el personal de la empresa con apoyo del conductor. Incluye peajes, combustible y seguro de la carga.',
      entregables: [
        { id: 'r1', entregable: 'Viajes de ida (bodega a obra)', especificacion: 'Tractomula con carrocería de estacas; carga amarrada y carpada.', cantidad: 6, unidad: 'viaje', fecha: '2026-08-28' },
        { id: 'r2', entregable: 'Viajes de retorno (obra a bodega)', especificacion: 'Mismo tipo de vehículo; despacho nocturno.', cantidad: 6, unidad: 'viaje', fecha: '2026-12-16' },
        { id: 'r3', entregable: 'Remisiones firmadas', especificacion: 'Remisión con la lista de piezas firmada en origen y destino.', cantidad: 12, unidad: 'documento', fecha: '2026-12-16' },
      ],
      exclusiones: [
        'Izaje con grúa en la obra (lo suministra el cliente).',
        'Custodia de la carga una vez descargada en la obra.',
        'Viajes a obras diferentes a la del proyecto.',
      ],
      especificaciones: 'Vehículos con SOAT, revisión técnico-mecánica y póliza de responsabilidad civil extracontractual vigentes; placa habilitada para circular en Bogotá en el horario del despacho; conductor con licencia de categoría C3 vigente.',
      calidad: 'Llegada en la fecha y franja programadas (tolerancia de 1 hora); cero piezas perdidas o dañadas por el transporte; remisión firmada en cada viaje.',
      sst: 'Conductor afiliado a seguridad social y con inducción de la obra; uso de EPP en la zona de descargue; cumplimiento del plan estratégico de seguridad vial (PESV) del proveedor.',
      lugar: 'Bodega principal de la empresa y obra Edificio Altavista (ficticia), Bogotá D.C.',
      periodoInicio: '2026-08-26',
      periodoFin: '2026-12-16',
      horario: 'Despachos nocturnos de lunes a sábado en las franjas permitidas para vehículos de carga.',
      formaPago: 'Pago mensual a 30 días por viajes ejecutados según remisiones firmadas, contra factura electrónica; retención en garantía del 5 % hasta la liquidación.',
      polizas: [
        'Cumplimiento: 10 % del valor del contrato, vigencia del contrato y 4 meses más.',
        'Pago de salarios y prestaciones sociales: 5 %, vigencia del contrato y 3 años más.',
        'Responsabilidad civil extracontractual: 200 SMMLV.',
        'Seguro de transporte de la mercancía por el valor del equipo despachado.',
      ],
      supervision: 'Coordinador logístico',
      documentosRequeridos: [
        'RUT y certificado de existencia y representación legal con vigencia no mayor a 30 días.',
        'Planilla de seguridad social de los conductores.',
        'Licencias de conducción, SOAT y revisión técnico-mecánica de los vehículos.',
        'Evaluación de estándares mínimos del SG-SST.',
        'Pólizas aprobadas.',
      ],
    },
  });

  add({
    id: 'criterios-seleccion-proveedores', name: 'Criterios de selección y evaluación de ofertas', abbr: 'CSP',
    area: 'adquisiciones', group: 'planificacion', process: '12.1', processes: ['12.1', '12.2'], kind: 'registro', multiple: false,
    purpose: 'Define los requisitos habilitantes y los criterios ponderados con los que se evalúan las ofertas, y registra el puntaje de cada oferente para sustentar la adjudicación.',
    tips: [
      'Define y pondera los criterios antes de abrir las ofertas; los pesos deben sumar 100 %.',
      'Separa los requisitos habilitantes (cumple o no cumple) de los criterios que otorgan puntaje.',
      'Documenta la evaluación: es el soporte de la adjudicación ante auditorías.',
    ],
    sections: [
      section('proceso', 'Proceso de selección', [
        text('adquisicion', 'Adquisición evaluada'),
        select('metodoSeleccion', 'Método de selección', METODOS_SELECCION),
        list('requisitosHabilitantes', 'Requisitos habilitantes (cumple o no cumple)'),
        text('proveedorA', 'Oferente A'),
        text('proveedorB', 'Oferente B'),
        text('proveedorC', 'Oferente C'),
      ]),
      section('evaluacion', 'Evaluación ponderada', [
        table('criterios', 'Criterios y puntajes (0 a 100)', [
          cText('criterio', 'Criterio', { width: 180 }),
          cArea('descripcion', 'Descripción'),
          cPct('peso', 'Peso (%)'),
          cNum('puntajeA', 'Puntaje A', { min: 0, max: 100, width: 80 }),
          cNum('puntajeB', 'Puntaje B', { min: 0, max: 100, width: 80 }),
          cNum('puntajeC', 'Puntaje C', { min: 0, max: 100, width: 80 }),
          cCalc('ponderadoA', 'Ponderado A', calcWeighted('puntajeA'), fmtPoints, { hint: 'Peso × puntaje A / 100.' }),
          cCalc('ponderadoB', 'Ponderado B', calcWeighted('puntajeB'), fmtPoints, { hint: 'Peso × puntaje B / 100.' }),
          cCalc('ponderadoC', 'Ponderado C', calcWeighted('puntajeC'), fmtPoints, { hint: 'Peso × puntaje C / 100.' }),
        ], {
          defaultRows: [
            { criterio: 'Precio', descripcion: 'Valor total de la oferta frente a la menor ofertada.', peso: 40 },
            { criterio: 'Capacidad y disponibilidad', descripcion: 'Recursos disponibles en las fechas requeridas.', peso: 20 },
            { criterio: 'Experiencia', descripcion: 'Trabajos similares en los últimos tres años.', peso: 15 },
            { criterio: 'SST', descripcion: 'SG-SST evaluado, accidentalidad y controles en obra.', peso: 15 },
            { criterio: 'Condiciones comerciales', descripcion: 'Plazo de pago y garantías.', peso: 10 },
          ],
        }),
      ]),
      section('resultado', 'Resultado', [
        area('resultado', 'Resultado de la evaluación', { rows: 3 }),
        text('seleccionado', 'Oferente seleccionado'),
      ]),
    ],
    example: {
      adquisicion: 'Transporte en tractomula del equipo de andamio (ida y retorno)',
      metodoSeleccion: 'Basado en calidad y costo',
      requisitosHabilitantes: [
        'RUT y certificado de existencia y representación legal vigentes.',
        'Planilla de seguridad social al día.',
        'Evaluación de estándares mínimos del SG-SST (Resolución 0312 de 2019).',
        'Plan estratégico de seguridad vial (PESV).',
        'Capacidad para expedir las pólizas exigidas.',
      ],
      proveedorA: 'Transportador A',
      proveedorB: 'Transportador B',
      proveedorC: 'Transportador C',
      criterios: [
        { id: 'r1', criterio: 'Precio', descripcion: 'Tarifa por viaje frente a la menor ofertada.', peso: 40, puntajeA: 85, puntajeB: 100, puntajeC: 92 },
        { id: 'r2', criterio: 'Disponibilidad de flota', descripcion: 'Tractomulas disponibles en las fechas del programa de despachos.', peso: 20, puntajeA: 90, puntajeB: 85, puntajeC: 60 },
        { id: 'r3', criterio: 'Experiencia', descripcion: 'Transporte de equipo de construcción en los últimos tres años.', peso: 15, puntajeA: 90, puntajeB: 80, puntajeC: 70 },
        { id: 'r4', criterio: 'SST y seguridad vial', descripcion: 'SG-SST evaluado, PESV y accidentalidad.', peso: 15, puntajeA: 95, puntajeB: 85, puntajeC: 70 },
        { id: 'r5', criterio: 'Condiciones comerciales', descripcion: 'Plazo de pago y despachos nocturnos sin recargo.', peso: 10, puntajeA: 70, puntajeB: 100, puntajeC: 80 },
      ],
      resultado: 'Los tres oferentes cumplieron los requisitos habilitantes. Puntaje total: Transportador A 86,8; Transportador B 91,8; Transportador C 77,8. Se adjudica al Transportador B por precio, condiciones de pago y despachos nocturnos incluidos en la tarifa.',
      seleccionado: 'Transportador B',
    },
  });

  add({
    id: 'registro-adquisiciones', name: 'Registro de contratos y acuerdos', abbr: 'RADQ',
    area: 'adquisiciones', group: 'ejecucion', process: '12.2', processes: ['12.2', '12.3'], kind: 'registro', multiple: false,
    purpose: 'Registra los contratos, órdenes y acuerdos del proyecto con su proveedor, objeto, tipo de contrato, valor, plazo, supervisor, pólizas y estado.',
    tips: [
      'Registra todos los contratos y órdenes del proyecto con su supervisor; un contrato sin supervisor no se controla.',
      'Verifica que las pólizas estén aprobadas antes del acta de inicio y vigentes durante toda la ejecución.',
      'Pacta la retención en garantía y la forma de pago contra factura electrónica.',
    ],
    sections: [
      section('contratos', 'Contratos y acuerdos', [
        table('contratos', 'Contratos', [
          cCode('numero', 'Número', { width: 110 }),
          cText('proveedor', 'Proveedor', { width: 180 }),
          cArea('objeto', 'Objeto', { width: 240 }),
          cCode('paqueteEdt', 'EDT', { width: 90 }),
          cSelect('tipoContrato', 'Tipo de contrato', TIPOS_CONTRATO, { width: 320 }),
          cMoney('valor', 'Valor'),
          cDate('fechaInicio', 'Inicio'),
          cDate('fechaFin', 'Fin'),
          cText('supervisor', 'Supervisor (rol)', { width: 170 }),
          cSelect('polizaCumplimiento', 'Póliza de cumplimiento', ESTADO_POLIZA, { width: 130 }),
          cSelect('polizaCalidad', 'Póliza de calidad', ESTADO_POLIZA, { width: 130 }),
          cSelect('polizaRce', 'Póliza de responsabilidad civil extracontractual', ESTADO_POLIZA, { width: 150 }),
          cSelect('estado', 'Estado', ESTADO_CONTRATO, { width: 140 }),
          cArea('observaciones', 'Observaciones'),
        ]),
      ]),
      section('documentacion', 'Documentación y cláusulas', [
        area('documentacion', 'Ubicación de la documentación', { rows: 2 }),
        area('clausulas', 'Cláusulas relevantes', { rows: 3, hint: 'Multas, retención en garantía, terminación anticipada, indemnidad.' }),
      ]),
    ],
    example: {
      contratos: [
        { id: 'r1', numero: 'OS-2026-101', proveedor: 'Transportador B', objeto: 'Transporte en tractomula del equipo de andamio, ida y retorno (12 viajes a COP 1,9 millones por viaje, con valor máximo).', paqueteEdt: '1.3 / 1.6', tipoContrato: 'Tiempo y materiales (T&M)', valor: 22800000, fechaInicio: '2026-08-26', fechaFin: '2026-12-16', supervisor: 'Coordinador logístico', polizaCumplimiento: 'Aprobada', polizaCalidad: 'No aplica', polizaRce: 'Aprobada', estado: 'En ejecución', observaciones: 'Ida terminada (seis viajes del 26 al 28 de agosto); retorno programado del 14 al 16 de diciembre.' },
        { id: 'r2', numero: 'CA-2026-045', proveedor: 'Proveedor aliado de andamio', objeto: 'Subarriendo de diagonales y plataformas compatibles por 3,7 meses.', paqueteEdt: '1.5', tipoContrato: 'Precio fijo cerrado (FFP)', valor: 12760000, fechaInicio: '2026-08-26', fechaFin: '2026-12-12', supervisor: 'Coordinador logístico', polizaCumplimiento: 'Aprobada', polizaCalidad: 'Aprobada', polizaRce: 'No aplica', estado: 'En ejecución', observaciones: 'Valor inicial de COP 8,88 millones; otrosí n.º 1 del 27 de agosto por 180 diagonales adicionales (INC-001, orden de compra OC-031): COP 3,88 millones con cargo a la reserva para contingencias.' },
        { id: 'r3', numero: 'OS-2026-118', proveedor: 'Inspector de andamios independiente', objeto: 'Inspección y certificación del andamio por persona competente (6 jornadas: etapas 1 y 2 y andamio completo).', paqueteEdt: '1.5', tipoContrato: 'Tiempo y materiales (T&M)', valor: 9600000, fechaInicio: '2026-09-19', fechaFin: '2026-11-12', supervisor: 'Director de proyecto', polizaCumplimiento: 'Aprobada', polizaCalidad: 'No aplica', polizaRce: 'Aprobada', estado: 'En ejecución', observaciones: 'Etapa 1 inspeccionada y certificada el 21 de septiembre.' },
        { id: 'r4', numero: 'OS-2026-097', proveedor: 'IPS de salud ocupacional', objeto: 'Exámenes médicos ocupacionales con énfasis en alturas del personal inicial (12 personas).', paqueteEdt: '1.1', tipoContrato: 'Precio fijo cerrado (FFP)', valor: 2760000, fechaInicio: '2026-08-04', fechaFin: '2026-08-08', supervisor: 'Coordinador SST (HSE)', polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'No aplica', estado: 'Liquidado', observaciones: 'Convenio corporativo vigente.' },
        { id: 'r5', numero: 'OS-2026-089', proveedor: 'Firma de topografía', objeto: 'Levantamiento topográfico y de fachada de la Torre 2.', paqueteEdt: '1.2', tipoContrato: 'Precio fijo cerrado (FFP)', valor: 3690000, fechaInicio: '2026-08-03', fechaFin: '2026-08-06', supervisor: 'Ingeniero de diseño', polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'Aprobada', estado: 'Liquidado', observaciones: '' },
        { id: 'r6', numero: 'OS-2026-093', proveedor: 'Laboratorio de ensayos', objeto: 'Ensayo de arrancamiento de anclajes en losa.', paqueteEdt: '1.2', tipoContrato: 'Precio fijo cerrado (FFP)', valor: 1980000, fechaInicio: '2026-08-11', fechaFin: '2026-08-11', supervisor: 'Ingeniero de diseño', polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'Aprobada', estado: 'Liquidado', observaciones: 'Resultado conforme.' },
      ],
      documentacion: 'Contratos, pólizas, actas de inicio y de liquidación en la carpeta de adquisiciones del proyecto (área de compras); copia de las remisiones en el campamento de obra.',
      clausulas: 'Retención en garantía del 5 % de cada pago hasta la liquidación; multa del 1 % por día de retraso en entregas programadas, con tope del 10 %; terminación anticipada por incumplimiento de requisitos de SST; indemnidad frente a reclamaciones laborales del personal del proveedor.',
    },
  });

  add({
    id: 'control-adquisiciones', name: 'Seguimiento de contratos y desempeño de proveedores', abbr: 'CADQ',
    area: 'adquisiciones', group: 'monitoreo', process: '12.3', processes: ['12.3'], kind: 'registro', multiple: false,
    purpose: 'Controla la ejecución de cada contrato (avance, valores ejecutados, pagados y retenidos), califica el desempeño de los proveedores y gestiona las reclamaciones hasta el cierre.',
    tips: [
      'Califica a cada proveedor con la misma escala (plazo, calidad y SST) y comparte la calificación con él.',
      'Gestiona las reclamaciones por escrito y con referencia a la cláusula o al enunciado del trabajo.',
      'No liquides un contrato sin paz y salvo de seguridad social del proveedor y conciliación de cantidades.',
    ],
    sections: [
      section('seguimiento', 'Seguimiento de contratos', [
        table('seguimiento', 'Estado y desempeño por contrato', [
          cText('contrato', 'Contrato', { width: 230 }),
          cDate('fechaCorte', 'Fecha de corte'),
          cPct('avance', 'Avance (%)'),
          cMoney('valorEjecutado', 'Valor ejecutado'),
          cMoney('valorPagado', 'Valor pagado'),
          cMoney('retencion', 'Retención en garantía'),
          cScale('plazo', 'Plazo (1–5)', ESCALA_DESEMPENO),
          cScale('calidad', 'Calidad (1–5)', ESCALA_DESEMPENO),
          cScale('sst', 'SST (1–5)', ESCALA_DESEMPENO),
          cCalc('calificacion', 'Calificación', calcAverage(['plazo', 'calidad', 'sst']), fmtScore, { hint: 'Promedio de plazo, calidad y SST.' }),
          cArea('observaciones', 'Observaciones'),
        ]),
      ]),
      section('reclamaciones', 'Reclamaciones', [
        table('reclamaciones', 'Reclamaciones', [
          cCode('contrato', 'Contrato', { width: 120 }),
          cArea('descripcion', 'Descripción', { width: 260 }),
          cDate('fecha', 'Fecha'),
          cSelect('estado', 'Estado', ESTADO_RECLAMACION, { width: 140 }),
          cArea('solucion', 'Solución o gestión'),
        ]),
      ]),
      section('cierre', 'Cierre de las adquisiciones', [
        area('cierre', 'Verificaciones para liquidar los contratos', { rows: 3 }),
      ]),
    ],
    example: {
      seguimiento: [
        { id: 'r1', contrato: 'OS-2026-101 Transporte (Transportador B)', fechaCorte: '2026-10-02', avance: 50, valorEjecutado: 11400000, valorPagado: 10830000, retencion: 570000, plazo: 4, calidad: 5, sst: 4, observaciones: 'Ida completa en tres noches; un viaje llegó dos horas tarde por un cierre vial. La factura FE-7712 (COP 11,98 millones) incluye un recargo nocturno de COP 0,58 millones en reclamación.' },
        { id: 'r2', contrato: 'CA-2026-045 Subarriendo de diagonales y plataformas', fechaCorte: '2026-10-02', avance: 52, valorEjecutado: 6600000, valorPagado: 3686000, retencion: 330000, plazo: 5, calidad: 4, sst: 5, observaciones: 'Entregó las 180 diagonales adicionales en 48 horas; repuso sin costo seis piezas deformadas. Septiembre facturado y pendiente de pago.' },
        { id: 'r3', contrato: 'OS-2026-118 Inspección y certificación', fechaCorte: '2026-10-02', avance: 17, valorEjecutado: 1600000, valorPagado: 0, retencion: 80000, plazo: 5, calidad: 5, sst: 5, observaciones: 'Certificó la etapa 1 el 21 de septiembre, en la fecha acordada.' },
        { id: 'r4', contrato: 'OS-2026-097 Exámenes médicos', fechaCorte: '2026-08-08', avance: 100, valorEjecutado: 2760000, valorPagado: 2760000, retencion: 0, plazo: 5, calidad: 4, sst: 5, observaciones: 'Liquidado.' },
        { id: 'r5', contrato: 'OS-2026-089 Topografía', fechaCorte: '2026-08-06', avance: 100, valorEjecutado: 3690000, valorPagado: 3690000, retencion: 0, plazo: 5, calidad: 4, sst: 5, observaciones: 'Liquidado.' },
        { id: 'r6', contrato: 'OS-2026-093 Ensayo de anclajes', fechaCorte: '2026-08-11', avance: 100, valorEjecutado: 1980000, valorPagado: 1980000, retencion: 0, plazo: 5, calidad: 5, sst: 5, observaciones: 'Liquidado.' },
      ],
      reclamaciones: [
        { id: 'r1', contrato: 'CA-2026-045', descripcion: 'Seis diagonales entregadas con deformación; se pidió la reposición sin costo.', fecha: '2026-08-28', estado: 'Resuelta', solucion: 'Repuestas el 29 de agosto.' },
        { id: 'r2', contrato: 'OS-2026-101', descripcion: 'La factura FE-7712 de los viajes de ida incluye un recargo nocturno de COP 0,58 millones no pactado en el contrato.', fecha: '2026-09-04', estado: 'En negociación', solucion: 'El enunciado del trabajo incluye los despachos nocturnos en la tarifa; se revisará con el proveedor antes de la factura de retorno.' },
      ],
      cierre: 'Para liquidar cada contrato: acta de recibo a satisfacción del supervisor, paz y salvo de seguridad social del proveedor, conciliación de remisiones e inventario, evaluación final del proveedor y devolución de la retención en garantía.',
    },
  });

  /* ================================================================== 13. INTERESADOS */

  add({
    id: 'registro-interesados', name: 'Registro de interesados', abbr: 'RINT',
    area: 'interesados', group: 'inicio', process: '13.1', processes: ['13.1', '13.2', '13.3', '13.4'], kind: 'registro', multiple: false,
    purpose: 'Identifica a las personas, grupos y organizaciones que influyen en el proyecto o se ven afectados por él, con sus requisitos, expectativas, poder, interés, influencia y nivel de involucramiento actual y deseado.',
    tips: [
      'Registra roles o cargos, no solo nombres: el rol se mantiene aunque cambie la persona.',
      'Califica poder, interés e influencia de 1 a 5 para ubicar a cada interesado en la matriz de poder e interés.',
      'Incluye a los externos: comunidad vecina, Secretaría de Movilidad, ARL y proveedores.',
      'Trata los datos de contacto según la Ley 1581 de 2012 de protección de datos personales.',
    ],
    sections: [
      section('interesados', 'Interesados', [
        table('interesados', 'Registro de interesados', [
          cText('nombre', 'Interesado', { width: 200 }),
          cText('cargo', 'Cargo', { width: 170 }),
          cText('organizacion', 'Organización', { width: 190 }),
          cText('rol', 'Rol en el proyecto', { width: 200 }),
          cText('contacto', 'Contacto', { width: 170 }),
          cArea('requisitos', 'Requisitos'),
          cArea('expectativas', 'Expectativas'),
          cScale('poder', 'Poder (1–5)'),
          cScale('interes', 'Interés (1–5)'),
          cScale('influencia', 'Influencia (1–5)', ESCALA_FEM),
          cSelect('clasificacion', 'Clasificación', CLASIFICACION_INTERESADO, { width: 110 }),
          cSelect('actitud', 'Actitud', ACTITUDES, { width: 120 }),
          cSelect('nivelActual', 'Nivel actual', NIVELES_INVOLUCRAMIENTO, { width: 130 }),
          cSelect('nivelDeseado', 'Nivel deseado', NIVELES_INVOLUCRAMIENTO, { width: 130 }),
        ]),
      ]),
      section('notas', 'Fuentes y actualización', [
        date('fechaActualizacion', 'Fecha de actualización'),
        area('fuentes', 'Fuentes de identificación y observaciones', { rows: 3 }),
      ]),
    ],
    example: {
      interesados: [
        { id: 'r1', nombre: 'Gerencia General', cargo: 'Gerente General', organizacion: EJ.empresa, rol: 'Patrocinador', contacto: 'Oficina principal', requisitos: 'Proyecto dentro del presupuesto aprobado y sin accidentes.', expectativas: 'Margen esperado del caso de negocio y referencia para nuevos contratos con el cliente.', poder: 5, interes: 4, influencia: 5, clasificacion: 'Interno', actitud: 'Partidario', nivelActual: 'Partidario', nivelDeseado: 'Líder' },
        { id: 'r2', nombre: 'Director de obra (cliente)', cargo: 'Director de obra', organizacion: EJ.cliente, rol: 'Cliente y usuario del andamio', contacto: 'Campamento de obra Altavista', requisitos: 'Andamio certificado por etapas según la secuencia de fachada.', expectativas: 'Cero interferencias con sus frentes y respuesta rápida a los cambios.', poder: 4, interes: 5, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
        { id: 'r3', nombre: 'Interventoría', cargo: 'Interventor técnico y SST', organizacion: EJ.interventoria, rol: 'Supervisa el contrato; aprueba actas y certificaciones', contacto: 'Oficina de interventoría en obra', requisitos: 'Cumplimiento de la Resolución 4272 de 2021 y del diseño aprobado.', expectativas: 'Documentación completa antes de cada inspección.', poder: 4, interes: 4, influencia: 4, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
        { id: 'r4', nombre: 'Coordinador SST (HSE)', cargo: 'Coordinador SST', organizacion: EJ.empresa, rol: 'Controla la seguridad en alturas', contacto: 'Celular del proyecto', requisitos: 'Permisos, EPP y sistemas de protección contra caídas conformes.', expectativas: 'Respaldo de la dirección para detener trabajos inseguros.', poder: 4, interes: 5, influencia: 3, clasificacion: 'Interno', actitud: 'Partidario', nivelActual: 'Líder', nivelDeseado: 'Líder' },
        { id: 'r5', nombre: 'Gerencia de proyectos de la constructora', cargo: 'Gerente de proyectos', organizacion: EJ.cliente, rol: 'Decide la contratación y la extensión del alquiler', contacto: 'Oficina principal del cliente', requisitos: 'Costo del alquiler dentro de su presupuesto de obra.', expectativas: 'No recibir escalamientos operativos.', poder: 5, interes: 2, influencia: 3, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
        { id: 'r6', nombre: 'Secretaría de Movilidad', cargo: 'Área de permisos de cargue y descargue', organizacion: 'Secretaría Distrital de Movilidad de Bogotá', rol: 'Autoridad de tránsito: regula la circulación y el cargue de vehículos de carga', contacto: 'Ventanilla de trámites', requisitos: 'Cumplimiento de las restricciones de circulación y de los permisos de cargue en vía.', expectativas: 'Sin ocupación indebida del espacio público.', poder: 4, interes: 1, influencia: 2, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Desconocedor', nivelDeseado: 'Neutral' },
        { id: 'r7', nombre: 'Cuadrilla de montaje', cargo: 'Montadores certificados en alturas', organizacion: EJ.empresa, rol: 'Ejecuta el montaje y el desmontaje', contacto: 'Por medio del supervisor de montaje', requisitos: 'Condiciones seguras, EPP completo y pago oportuno.', expectativas: 'Continuidad laboral y reconocimiento.', poder: 2, interes: 4, influencia: 3, clasificacion: 'Interno', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
        { id: 'r8', nombre: 'Comunidad vecina', cargo: 'Residentes y comercios de la cuadra', organizacion: 'Vecinos del Edificio Altavista', rol: 'Afectados por ruido, cierres del andén y cargue nocturno', contacto: 'Cartelera de obra y punto de atención', requisitos: 'Andén despejado y horarios respetados.', expectativas: 'Mínimas molestias y respuesta a sus quejas.', poder: 2, interes: 4, influencia: 2, clasificacion: 'Externo', actitud: 'Reticente', nivelActual: 'Reticente', nivelDeseado: 'Neutral' },
        { id: 'r9', nombre: 'ARL', cargo: 'Asesor de prevención', organizacion: 'Administradora de Riesgos Laborales de la empresa', rol: 'Asesoría y cobertura de riesgos laborales', contacto: 'Línea de atención de la ARL', requisitos: 'Afiliación al día y reporte de accidentes dentro de los 2 días hábiles siguientes.', expectativas: 'Programas de prevención ejecutados.', poder: 2, interes: 2, influencia: 2, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Partidario' },
        { id: 'r10', nombre: 'Transportador contratado', cargo: 'Coordinador de despachos', organizacion: 'Transportador B', rol: 'Proveedor del transporte de carga', contacto: 'Línea de despachos del proveedor', requisitos: 'Programa de despachos con 48 horas de anticipación.', expectativas: 'Pagos a 30 días y viajes completos.', poder: 1, interes: 2, influencia: 1, clasificacion: 'Externo', actitud: 'Neutral', nivelActual: 'Neutral', nivelDeseado: 'Neutral' },
      ],
      fechaActualizacion: '2026-09-29',
      fuentes: 'Acta de constitución, contrato con el cliente, reunión de arranque y comités de obra. La Gerencia de proyectos de la constructora se volvió relevante con la solicitud CC-003; la Secretaría de Movilidad, con los despachos nocturnos.',
    },
  });

  add({
    id: 'plan-involucramiento-interesados', name: 'Plan de involucramiento de los interesados', abbr: 'PIIN',
    area: 'interesados', group: 'planificacion', process: '13.2', processes: ['13.2', '13.3', '13.4'], kind: 'plan', multiple: false,
    purpose: 'Define las estrategias y acciones para promover la participación productiva de los interesados, a partir de la brecha entre su nivel de involucramiento actual y el deseado.',
    tips: [
      'Parte de la matriz de evaluación del involucramiento (actual frente a deseado) y define una acción para cerrar cada brecha.',
      'Gestiona de cerca a quienes tienen alto poder y alto interés; mantén satisfechos a los de alto poder y bajo interés.',
      'Revisa el plan cuando un interesado cambie de actitud o aparezca uno nuevo.',
    ],
    sections: [
      section('matriz', 'Matriz de evaluación del involucramiento', [
        table('involucramiento', 'Estrategias por interesado', [
          cText('interesado', 'Interesado', { width: 200 }),
          cSelect('nivelActual', 'Nivel actual', NIVELES_INVOLUCRAMIENTO, { width: 130 }),
          cSelect('nivelDeseado', 'Nivel deseado', NIVELES_INVOLUCRAMIENTO, { width: 130 }),
          cArea('estrategia', 'Estrategia y acciones', { width: 300 }),
          cText('responsable', 'Responsable', { width: 170 }),
          cSelect('frecuencia', 'Frecuencia', FRECUENCIAS, { width: 120 }),
        ]),
      ]),
      section('cambio', 'Cambio e interrelaciones', [
        area('impactoCambio', 'Alcance e impacto del cambio para los interesados', { rows: 3 }),
        area('interrelaciones', 'Interrelaciones y posibles traslapos entre interesados', { rows: 3 }),
      ]),
      section('comunicacion', 'Requisitos de comunicación de la fase', [
        area('requisitosFase', 'Requisitos de comunicación para la fase actual', { rows: 3 }),
        area('informacionDistribuir', 'Información que se distribuye', { rows: 3 }),
      ]),
      section('actualizacion', 'Actualización', [
        area('actualizacion', 'Método para actualizar y refinar el plan', { rows: 2 }),
      ]),
    ],
    example: {
      involucramiento: [
        { id: 'r1', interesado: 'Gerencia General', nivelActual: 'Partidario', nivelDeseado: 'Líder', estrategia: 'Informe ejecutivo mensual con las decisiones requeridas; participación en el comité de control de cambios ampliado y en la entrega final.', responsable: 'Director de proyecto', frecuencia: 'Mensual' },
        { id: 'r2', interesado: 'Director de obra (cliente)', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Comité de obra semanal; respuesta a solicitudes en 24 horas; mostrar el avance con la curva S y acordar la ventana de grúa.', responsable: 'Director de proyecto', frecuencia: 'Semanal' },
        { id: 'r3', interesado: 'Interventoría', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Invitarla a las inspecciones de certificación y entregarle los protocolos antes de cada etapa.', responsable: 'Residente de obra', frecuencia: 'Semanal' },
        { id: 'r4', interesado: 'Gerencia de proyectos de la constructora', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Reunión al terminar el montaje y presentación de la propuesta de extensión del alquiler (CC-003).', responsable: 'Gerencia General', frecuencia: 'Por hito' },
        { id: 'r5', interesado: 'Secretaría de Movilidad', nivelActual: 'Desconocedor', nivelDeseado: 'Neutral', estrategia: 'Tramitar a tiempo los permisos de cargue y descargue; cumplir las franjas de circulación de carga.', responsable: 'Coordinador logístico', frecuencia: 'Por evento' },
        { id: 'r6', interesado: 'Cuadrilla de montaje', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Charla diaria, reconocimiento por etapa certificada y participación en las lecciones aprendidas.', responsable: 'Supervisor de montaje', frecuencia: 'Diaria' },
        { id: 'r7', interesado: 'Comunidad vecina', nivelActual: 'Reticente', nivelDeseado: 'Neutral', estrategia: 'Avisos con los horarios de cargue; punto de atención de quejas con respuesta en 48 horas; aseo diario del andén.', responsable: 'Residente de obra', frecuencia: 'Por evento' },
        { id: 'r8', interesado: 'ARL', nivelActual: 'Neutral', nivelDeseado: 'Partidario', estrategia: 'Solicitar asesoría para el simulacro de rescate y la inspección de los sistemas de protección contra caídas.', responsable: 'Coordinador SST (HSE)', frecuencia: 'Mensual' },
      ],
      impactoCambio: 'El montaje cambia la circulación peatonal del andén norte y la zona de cargue de la obra; la comunidad vecina y el personal de la constructora se ven afectados por el ruido y los cierres parciales. El cliente debe adaptar su secuencia de fachada al avance del andamio.',
      interrelaciones: 'La interventoría y el director de obra deciden juntos sobre las actas de corte; la Gerencia de proyectos de la constructora decide la extensión que pide el director de obra; la Secretaría de Movilidad condiciona la logística del cliente y la nuestra; la ARL respalda al coordinador SST frente a la interventoría.',
      requisitosFase: 'Fase de montaje y operación: avance semanal, certificados por etapa, programación de cargue y de grúa, avisos a la comunidad y alertas de SST.',
      informacionDistribuir: 'Según la matriz del plan de gestión de las comunicaciones: informe semanal (cliente e interventoría), informe ejecutivo (Gerencia General), certificados de uso (interventoría) y avisos (comunidad vecina).',
      actualizacion: 'Se revisa al inicio de cada fase y cuando la matriz de evaluación del involucramiento muestre una brecha que no se cierra en un mes; los cambios los aprueba el director de proyecto.',
    },
  });

  /* ================================================================== registro */
  PM.registerTemplates(templates);
})();

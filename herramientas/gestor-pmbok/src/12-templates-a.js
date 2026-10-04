/* ==========================================================================
   12-templates-a.js — plantillas de documentos de Integración (cap. 4),
   Alcance (cap. 5) y Cronograma (cap. 6) de la Guía del PMBOK® 6.ª edición.
   Contrato: SPEC.md §5–§6 (ids canónicos y tablas de columnas fijas).
   Los ejemplos describen el proyecto ficticio de SPEC.md §8.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;

  /* ------------------------------------------------------------------ opciones compartidas */
  const AREAS_CONOCIMIENTO = ['Integración', 'Alcance', 'Cronograma', 'Costos', 'Calidad', 'Recursos', 'Comunicaciones', 'Riesgos', 'Adquisiciones', 'Interesados'];
  const PRIORIDAD = ['Alta', 'Media', 'Baja'];
  const CICLOS_VIDA = PM.LIFECYCLES || ['Predictivo', 'Iterativo', 'Incremental', 'Adaptativo (ágil)', 'Híbrido'];
  const FRECUENCIA = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Por hito o fin de fase'];
  const DIMENSION_OBJETIVO = ['Alcance', 'Cronograma', 'Costo', 'Calidad', 'Seguridad y salud en el trabajo', 'Satisfacción del cliente'];

  // Control de cambios (registro y solicitud comparten valores: SPEC §5)
  const TIPO_CAMBIO = ['Acción correctiva', 'Acción preventiva', 'Reparación de defecto', 'Actualización'];
  const ESTADO_CAMBIO = ['Registrada', 'En análisis', 'Aprobada', 'Rechazada', 'Diferida'];
  const NIVEL_AUTORIDAD = ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Emergencia'];

  // Registros de ejecución
  const ESTADO_INCIDENTE = ['Abierto', 'En curso', 'Resuelto', 'Cerrado'];
  const TIPO_INCIDENTE = ['Técnico', 'Logístico', 'Seguridad y salud en el trabajo', 'Cliente y obra', 'Contractual y pagos', 'Recursos', 'Calidad', 'Clima y entorno', 'Comunicaciones'];
  const ESTADO_ENTREGABLE = ['Pendiente', 'En revisión', 'Verificado', 'Aceptado', 'Rechazado'];
  const IMPACTO_LECCION = ['Positivo', 'Negativo'];
  const TIPO_SUPUESTO = ['Supuesto', 'Restricción'];
  const ESTADO_SUPUESTO = ['Por validar', 'Validado', 'Descartado'];
  const CATEGORIA_SUPUESTO = ['Técnico', 'Cronograma', 'Costos', 'Recursos', 'Logística', 'Seguridad y salud en el trabajo', 'Contractual', 'Cliente y obra', 'Clima y entorno', 'Regulatorio'];

  // Informes y actas
  const ESTADO_GENERAL = ['Verde — según lo planificado', 'Amarillo — requiere atención', 'Rojo — requiere acción inmediata'];
  const ESTADO_HITO = ['Cumplido', 'En curso', 'Pendiente', 'En riesgo', 'Atrasado'];
  const CUMPLIMIENTO = ['Sí', 'Parcialmente', 'No'];
  const RESULTADO_VERIFICACION = ['Conforme', 'Conforme con observaciones', 'No conforme'];
  const DECISION_ACEPTACION = ['Aceptado', 'Aceptado con observaciones', 'Rechazado'];
  const ESTADO_PAZ_SALVO = ['Paz y salvo', 'Pendiente', 'No aplica'];

  // Planes
  const ESTADO_PLAN = ['Aprobado', 'En elaboración', 'Por elaborar', 'Incluido en este plan', 'No aplica'];
  const LINEA_BASE = ['Alcance', 'Cronograma', 'Costos', 'Medición del desempeño'];
  const TIPO_BENEFICIO = ['Tangible', 'Intangible'];
  const PLAZO_BENEFICIO = ['Corto plazo (durante el proyecto)', 'Mediano plazo (hasta 1 año)', 'Largo plazo (más de 1 año)'];
  const FRECUENCIA_BENEFICIO = ['Mensual', 'Trimestral', 'Semestral', 'Anual', 'Al cierre del proyecto'];
  const TIPO_ELEMENTO_CONFIG = ['Documento de gestión', 'Línea base', 'Plano o diseño', 'Procedimiento', 'Registro', 'Equipo o inventario'];
  const NIVEL_CONTROL_CONFIG = ['Control de cambios formal', 'Control de versiones', 'Solo registro'];

  // Requisitos (categorías de la Guía del PMBOK® 6.ª ed., 5.2)
  const TIPO_REQUISITO = ['Del negocio', 'De los interesados', 'De la solución: funcional', 'De la solución: no funcional', 'De transición y preparación', 'Del proyecto', 'De calidad'];
  const ESTADO_REQUISITO = ['Propuesto', 'Aprobado', 'En implementación', 'Verificado', 'Validado', 'Diferido', 'Cancelado'];

  // Cronograma
  const METODOLOGIA_CRONOGRAMA = ['Método de la ruta crítica (CPM)', 'Método de la cadena crítica', 'Planificación gradual con iteraciones', 'Híbrido (CPM y entregas iterativas)'];
  const CALENDARIO = ['Lunes a viernes', 'Lunes a sábado', 'Todos los días'];
  const UNIDAD_DURACION = ['Días hábiles', 'Horas', 'Semanas'];
  const METODO_VALOR_GANADO = ['Porcentaje completado', 'Fórmula fija 0/100', 'Fórmula fija 50/50', 'Fórmula fija 20/80', 'Hitos ponderados', 'Unidades completadas', 'Nivel de esfuerzo', 'Esfuerzo prorrateado'];
  const NIVEL_CONFIANZA = ['≈ 50 % (valor esperado)', '≈ 84 % (esperado + 1σ)', '≈ 95 % (esperado ± 2σ)', '≈ 99,7 % (esperado ± 3σ)'];

  /* ------------------------------------------------------------------ cálculos de columnas (puros, toleran vacíos) */
  const numOrNull = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const round = (x, d) => { const f = Math.pow(10, d); return Math.round(x * f) / f; };
  const fmtNum = (d) => (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.num(v, d));
  const fmtFixed = (d) => (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.fixed(v, d));
  const fmtIdx = (v) => (v === null || v === undefined || v === '' ? '—' : PM.fmt.idx(v));
  const fmtText = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

  // Estimación por tres valores (6.4): optimista (O), más probable (M), pesimista (P)
  const tresValores = (row) => {
    const o = numOrNull(row && row.optimista), m = numOrNull(row && row.masProbable), p = numOrNull(row && row.pesimista);
    return o === null || m === null || p === null ? null : { o, m, p };
  };
  const pertDe = (t) => (t.o + 4 * t.m + t.p) / 6;
  const sigmaDe = (t) => Math.abs(t.p - t.o) / 6;
  const calcPert = (row) => { const t = tresValores(row); return t ? round(pertDe(t), 2) : null; };
  const calcTriangular = (row) => { const t = tresValores(row); return t ? round((t.o + t.m + t.p) / 3, 2) : null; };
  const calcDesviacion = (row) => { const t = tresValores(row); return t ? round(sigmaDe(t), 2) : null; };
  const calcIntervalo = (row) => {
    const t = tresValores(row); if (!t) return null;
    const e = pertDe(t), s = sigmaDe(t);
    return PM.fmt.fixed(Math.max(0, e - 2 * s), 1) + ' – ' + PM.fmt.fixed(e + 2 * s, 1);
  };

  // Valor ganado por fecha de corte (4.5 / 7.4)
  const evmDe = (row) => ({ bac: numOrNull(row && row.bac), pv: numOrNull(row && row.pv), ev: numOrNull(row && row.ev), ac: numOrNull(row && row.ac) });
  const calcSv = (row) => { const x = evmDe(row); return x.ev !== null && x.pv !== null ? round(x.ev - x.pv, 0) : null; };
  const calcCv = (row) => { const x = evmDe(row); return x.ev !== null && x.ac !== null ? round(x.ev - x.ac, 0) : null; };
  const calcSpi = (row) => { const x = evmDe(row); return x.ev !== null && x.pv !== null && x.pv > 0 ? round(x.ev / x.pv, 2) : null; };
  const calcCpi = (row) => { const x = evmDe(row); return x.ev !== null && x.ac !== null && x.ac > 0 ? round(x.ev / x.ac, 2) : null; };
  const eacDe = (x) => (x.bac !== null && x.ev !== null && x.ev > 0 && x.ac !== null && x.ac > 0 ? (x.bac * x.ac) / x.ev : null);
  const calcEac = (row) => { const e = eacDe(evmDe(row)); return e === null ? null : round(e, 0); };
  const calcEtc = (row) => { const x = evmDe(row); const e = eacDe(x); return e === null ? null : round(e - x.ac, 0); };
  const calcVac = (row) => { const x = evmDe(row); const e = eacDe(x); return e === null ? null : round(x.bac - e, 0); };
  const calcTcpi = (row) => { const x = evmDe(row); return x.bac !== null && x.ev !== null && x.ac !== null && x.bac - x.ac !== 0 ? round((x.bac - x.ev) / (x.bac - x.ac), 2) : null; };

  // Beneficio neto de una alternativa (caso de negocio)
  const calcNeto = (row) => { const i = numOrNull(row && row.ingreso), c = numOrNull(row && row.costo); return i === null && c === null ? null : round((i || 0) - (c || 0), 0); };

  /* ------------------------------------------------------------------ proyecto de ejemplo (SPEC §8) */
  const EX = {
    name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista',
    code: 'PRY-2026-014',
    client: 'Constructora Modelo S.A.S. (ficticia)',
    sponsor: 'Gerencia General',
    manager: 'Director de proyecto',
    start: '2026-08-03',
    end: '2026-12-18',
    budget: 486500000,
    description: 'Ingeniería, suministro, montaje por etapas, inspección y certificación, alquiler con mantenimiento en obra, desmontaje y retiro de andamio multidireccional para la fachada de la Torre 2 (15 pisos) del Edificio Altavista (ficticio), Bogotá D.C.',
  };
  const CCB_AMPLIADO = 'CCB ampliado: Gerencia General y Director de obra del cliente';

  /* Columnas de firmas reutilizadas por actas */
  const firmasColumns = () => [
    { key: 'rol', label: 'Rol', type: 'text', width: 200, hint: 'Rol con el que firma (patrocinador, director del proyecto, cliente, interventoría).' },
    { key: 'nombre', label: 'Nombre o cargo', type: 'text', width: 200 },
    { key: 'fecha', label: 'Fecha', type: 'date' },
  ];

  const templates = [
    /* ================================================================== INTEGRACIÓN · INICIO (4.1) */
    {
      id: 'caso-negocio',
      name: 'Caso de negocio',
      abbr: 'CNEG',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'],
      kind: 'documento', multiple: false,
      purpose: 'Justifica económicamente el proyecto: documenta la necesidad del negocio, las alternativas evaluadas y la recomendación que lo origina. Es una entrada para desarrollar el acta de constitución.',
      tips: [
        'Incluye siempre la alternativa "no hacer nada" para dejar trazada la decisión frente a la gerencia.',
        'Calcula el margen con el costo completo: depreciación del equipo propio, transporte, montaje, SST, pólizas y costo financiero de la retención en garantía.',
        'Revisa el flujo de caja, no solo el margen: anticipo, actas de obra mensuales, plazo de pago del cliente y retención en garantía (usualmente 5 % a 10 %) que se libera al liquidar.',
        'Si el cliente exige trabajo en alturas certificado (Resolución 4272 de 2021), cuantifica el costo de personal certificado, coordinador de alturas e inspección por persona competente.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación',
          fields: [
            { key: 'nombre', label: 'Proyecto u oportunidad', type: 'text', from: 'project.name', required: true, hint: 'Nombre con el que se conocerá la oportunidad; normalmente coincide con el del proyecto.' },
            { key: 'cliente', label: 'Cliente', type: 'text', from: 'project.client', hint: 'Razón social del cliente o área interna que origina la necesidad.' },
            { key: 'patrocinador', label: 'Patrocinador', type: 'text', from: 'project.sponsor', hint: 'Quién respalda la inversión y decide si el proyecto continúa.' },
            { key: 'fechaCaso', label: 'Fecha de elaboración', type: 'date', hint: 'Fecha en que se presenta el caso de negocio para decisión.' },
          ],
        },
        {
          id: 'necesidad', title: 'Necesidad del negocio y análisis de la situación',
          fields: [
            { key: 'necesidad', label: 'Necesidad del negocio', type: 'textarea', required: true, hint: 'Problema u oportunidad que motiva el proyecto y por qué hay que actuar ahora: solicitud del cliente, requisito legal, oportunidad de mercado.' },
            { key: 'alineacion', label: 'Metas y objetivos estratégicos relacionados', type: 'textarea', hint: 'Objetivos de la empresa a los que contribuye: crecimiento de una línea de servicio, utilización del inventario, fidelización de clientes.' },
            { key: 'brecha', label: 'Situación actual y brecha de capacidades', type: 'textarea', hint: 'Capacidades actuales frente a las requeridas (inventario, personal certificado, ingeniería, logística) y cómo se cubre lo que falta.' },
          ],
        },
        {
          id: 'alternativas', title: 'Alternativas evaluadas',
          description: 'Compara al menos tres opciones: no hacer nada, hacer lo mínimo y hacer más. El beneficio neto se calcula como ingreso menos costo.',
          fields: [
            {
              key: 'opciones', label: 'Alternativas', type: 'table', addLabel: 'Agregar alternativa',
              hint: 'Una fila por alternativa. Marca la recomendada y explica sus riesgos principales.',
              columns: [
                { key: 'opcion', label: 'Alternativa', type: 'text', width: 180 },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 240 },
                { key: 'costo', label: 'Costo estimado', type: 'money', width: 140 },
                { key: 'ingreso', label: 'Ingreso o beneficio esperado', type: 'money', width: 140 },
                { key: 'neto', label: 'Beneficio neto', type: 'calc', calc: calcNeto, format: fmtNum(0), hint: 'Ingreso o beneficio esperado menos costo estimado.' },
                { key: 'riesgos', label: 'Riesgos principales', type: 'textarea', width: 220 },
                { key: 'recomendada', label: 'Recomendada', type: 'check' },
              ],
              defaultRows: [
                { opcion: 'No hacer nada' },
                { opcion: 'Hacer lo mínimo' },
                { opcion: 'Hacer más (solución completa)' },
              ],
            },
          ],
        },
        {
          id: 'economico', title: 'Análisis económico',
          fields: [
            { key: 'valorContrato', label: 'Valor del contrato o ingreso esperado', type: 'money', hint: 'Valor antes de IVA de la alternativa recomendada.' },
            { key: 'costoEstimado', label: 'Costo estimado (presupuesto)', type: 'money', from: 'project.budget', hint: 'Costo total con reservas; debe coincidir con el presupuesto que se aprobará en el acta de constitución.' },
            { key: 'margenEsperado', label: 'Margen bruto esperado (%)', type: 'pct', min: -100, max: 100, hint: '(Ingreso − costo) ÷ ingreso × 100. Indica si se calcula con o sin reservas.' },
            { key: 'flujoCaja', label: 'Flujo de caja y condiciones de pago', type: 'textarea', hint: 'Anticipo, periodicidad de facturación (actas de obra), plazo de pago, retención en garantía y momento de su liberación.' },
          ],
        },
        {
          id: 'recomendacion', title: 'Recomendación y criterios de éxito',
          fields: [
            { key: 'recomendacion', label: 'Recomendación', type: 'textarea', required: true, hint: 'Alternativa recomendada, razones y condiciones para continuar (por ejemplo, contrato firmado y anticipo recibido).' },
            { key: 'criteriosExito', label: 'Criterios de éxito del negocio', type: 'list', hint: 'Cómo se medirá que la inversión valió la pena: margen real, satisfacción del cliente, cero accidentes, nuevos contratos.' },
            { key: 'riesgosAltoNivel', label: 'Riesgos de alto nivel', type: 'list', hint: 'Amenazas u oportunidades que podrían cambiar la decisión.' },
            { key: 'supuestosCaso', label: 'Supuestos y restricciones del análisis', type: 'textarea', hint: 'Bases del cálculo: tarifas, duración del alquiler, costos de transporte, disponibilidad de inventario, fecha de las cotizaciones.' },
          ],
        },
      ],
      example: {
        nombre: EX.name,
        cliente: EX.client,
        patrocinador: EX.sponsor,
        fechaCaso: '2026-07-15',
        necesidad: 'Constructora Modelo S.A.S. (ficticia) requiere un sistema de andamio certificado para ejecutar la fachada (mampostería, pañete y pintura) de la Torre 2 del Edificio Altavista, de 15 pisos, entre agosto y diciembre de 2026. El cliente pidió una solución integral con ingeniería, montaje por etapas y certificación, porque su contrato con la interventoría exige trabajo en alturas conforme a la Resolución 4272 de 2021.',
        alineacion: 'Contribuye al objetivo estratégico 2026 de crecer 15 % en servicios integrales de andamios (ingeniería y montaje) frente al alquiler simple, y a elevar la utilización del inventario de andamio multidireccional, que en julio de 2026 está en 62 %.',
        brecha: 'La empresa tiene en bodega cerca del 90 % de las piezas requeridas, ingeniero de diseño y cuadrillas de montadores certificados. Faltan un supervisor de montaje adicional para trabajar dos frentes en paralelo y cerca del 10 % de diagonales y plataformas, que se cubrirán con subarriendo a un proveedor aliado.',
        opciones: [
          { id: 'r1', opcion: 'No hacer nada (no ofertar)', descripcion: 'No presentar oferta y mantener el inventario disponible para alquileres simples.', costo: 0, ingreso: 0, riesgos: 'Pérdida de un cliente recurrente; inventario ocioso de cerca de 4.800 m² de andamio en el segundo semestre.', recomendada: false },
          { id: 'r2', opcion: 'Hacer lo mínimo (solo alquiler)', descripcion: 'Alquilar el equipo puesto en obra; el cliente asume montaje, certificación y desmontaje.', costo: 171500000, ingreso: 226000000, riesgos: 'Montaje por terceros sin control de calidad; más daños y pérdidas de piezas; responsabilidad compartida ante un accidente.', recomendada: false },
          { id: 'r3', opcion: 'Hacer más (solución integral)', descripcion: 'Ingeniería, suministro, montaje por etapas, certificación, mantenimiento en obra, desmontaje y retiro.', costo: 486500000, ingreso: 598000000, riesgos: 'Mayor exposición al trabajo en alturas; dependencia de la grúa del cliente; lluvias de temporada.', recomendada: true },
        ],
        valorContrato: 598000000,
        costoEstimado: EX.budget,
        margenEsperado: 18.6,
        flujoCaja: 'Anticipo del 20 % contra entrega de pólizas; facturación mensual de alquiler y montaje mediante actas de obra; pago a 30 días; retención en garantía del 5 %, que se libera con el acta de liquidación del contrato.',
        recomendacion: 'Ofertar la solución integral. Es la única alternativa que cumple la exigencia de la interventoría sobre certificación y control del trabajo en alturas, y deja un margen bruto mínimo de 18,6 % aun si se consumen todas las reservas. Condición para continuar: contrato firmado y anticipo recibido antes del 31 de julio de 2026.',
        criteriosExito: [
          'Margen bruto real igual o superior a 18 % al liquidar el contrato.',
          'Cero accidentes con incapacidad en trabajo en alturas.',
          'Calificación del cliente igual o superior a 4,5 / 5 en la encuesta de cierre.',
          'Invitación a ofertar la Torre 3 del mismo proyecto.',
        ],
        riesgosAltoNivel: [
          'Lluvias de temporada (septiembre a noviembre) que detienen el montaje.',
          'Accidente en trabajo en alturas.',
          'Retraso en los pagos del cliente.',
          'Faltantes de piezas en bodega al momento del despacho.',
        ],
        supuestosCaso: 'Tarifa de alquiler de $ 9.800 por m² al mes; 4,5 meses de alquiler; dos cuadrillas de seis montadores; transporte en tractomula con seis viajes de ida y seis de retorno; inventario disponible confirmado por almacén el 10 de julio de 2026.',
      },
    },

    {
      id: 'plan-gestion-beneficios',
      name: 'Plan de gestión de los beneficios',
      abbr: 'PBEN',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'],
      kind: 'plan', multiple: false,
      purpose: 'Describe cómo y cuándo se entregarán los beneficios del proyecto, cómo se medirán y quién es responsable de sostenerlos después del cierre.',
      tips: [
        'Diferencia entregables de beneficios: el andamio montado es un entregable; el cliente recurrente o la mayor utilización del inventario son beneficios.',
        'Asigna un dueño del beneficio que lo siga midiendo después del cierre, normalmente una gerencia y no el director del proyecto.',
        'Define la línea base de cada métrica antes de iniciar; sin ella no podrás demostrar la mejora.',
      ],
      sections: [
        {
          id: 'alineacion', title: 'Alineación estratégica',
          fields: [
            { key: 'objetivoEstrategico', label: 'Objetivo estratégico', type: 'text', hint: 'Objetivo del plan estratégico de la empresa al que aporta el proyecto.' },
            { key: 'alineacionEstrategica', label: 'Cómo se alinea el proyecto', type: 'textarea', hint: 'Relación entre los beneficios del proyecto y la estrategia: línea de negocio, mercado, capacidades.' },
          ],
        },
        {
          id: 'beneficios', title: 'Beneficios objetivo',
          fields: [
            {
              key: 'beneficios', label: 'Beneficios', type: 'table', addLabel: 'Agregar beneficio',
              hint: 'Un beneficio por fila, con su métrica, valor actual (línea base), meta y plazo para obtenerlo.',
              columns: [
                { key: 'beneficio', label: 'Beneficio', type: 'textarea', width: 220 },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_BENEFICIO },
                { key: 'metrica', label: 'Métrica', type: 'text', width: 200 },
                { key: 'lineaBase', label: 'Línea base', type: 'text', width: 140 },
                { key: 'meta', label: 'Meta', type: 'text', width: 160 },
                { key: 'plazo', label: 'Plazo', type: 'select', options: PLAZO_BENEFICIO },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 160 },
              ],
            },
          ],
        },
        {
          id: 'medicion', title: 'Medición y sostenimiento',
          fields: [
            { key: 'responsableBeneficios', label: 'Dueño de los beneficios', type: 'text', hint: 'Cargo que responde por los beneficios ante la gerencia, durante y después del proyecto.' },
            { key: 'frecuenciaMedicion', label: 'Frecuencia de medición', type: 'select', options: FRECUENCIA_BENEFICIO, hint: 'Cada cuánto se mide y reporta el avance de los beneficios.' },
            { key: 'mecanismoMedicion', label: 'Fuentes y mecanismo de medición', type: 'textarea', hint: 'De dónde salen los datos (facturación, informes de almacén, encuestas) y en qué informe se reportan.' },
            { key: 'transicion', label: 'Transición a la operación', type: 'textarea', hint: 'Quién asume el seguimiento de los beneficios al cerrar el proyecto y cómo se documenta.' },
          ],
        },
        {
          id: 'supuestos', title: 'Supuestos y riesgos de los beneficios',
          fields: [
            { key: 'supuestosBeneficios', label: 'Supuestos', type: 'list', hint: 'Condiciones que deben cumplirse para lograr los beneficios.' },
            { key: 'riesgosBeneficios', label: 'Riesgos', type: 'list', hint: 'Eventos que podrían impedir o reducir los beneficios.' },
          ],
        },
      ],
      example: {
        objetivoEstrategico: 'Crecer 15 % los ingresos por servicios integrales de andamios en 2026.',
        alineacionEstrategica: 'El proyecto desarrolla la línea de servicios integrales (ingeniería, montaje y certificación), prioridad del plan estratégico 2026–2028, y aumenta la utilización del inventario propio de andamio multidireccional en el segundo semestre.',
        beneficios: [
          { id: 'r1', beneficio: 'Ingreso por servicio integral de andamios', tipo: 'Tangible', metrica: 'Ingreso facturado antes de IVA (COP)', lineaBase: 'Sin contratos integrales con este cliente', meta: '$ 598 M', plazo: 'Corto plazo (durante el proyecto)', responsable: 'Director de proyecto' },
          { id: 'r2', beneficio: 'Mayor utilización del inventario de andamio multidireccional', tipo: 'Tangible', metrica: 'm² alquilados ÷ m² disponibles', lineaBase: '62 % (julio de 2026)', meta: '≥ 75 % entre septiembre y noviembre', plazo: 'Corto plazo (durante el proyecto)', responsable: 'Almacén' },
          { id: 'r3', beneficio: 'Cliente recurrente', tipo: 'Intangible', metrica: 'Invitaciones a ofertar nuevas torres', lineaBase: '0', meta: '1 invitación (Torre 3) en el primer semestre de 2027', plazo: 'Mediano plazo (hasta 1 año)', responsable: 'Gerencia General' },
          { id: 'r4', beneficio: 'Referencia comercial en trabajo seguro en alturas', tipo: 'Intangible', metrica: 'Certificación de buen servicio emitida por el cliente', lineaBase: 'Sin certificación', meta: 'Certificación con calificación ≥ 4,5 / 5', plazo: 'Mediano plazo (hasta 1 año)', responsable: 'Gerencia General' },
        ],
        responsableBeneficios: 'Gerencia General; el director de proyecto reporta los beneficios de corto plazo durante la ejecución.',
        frecuenciaMedicion: 'Mensual',
        mecanismoMedicion: 'El ingreso se toma de la facturación del sistema contable y la utilización del inventario del informe mensual de almacén. Los beneficios intangibles se evalúan con la encuesta de satisfacción de cierre y el seguimiento comercial al cliente.',
        transicion: 'Al cierre, la Gerencia Comercial asume el seguimiento del beneficio de cliente recurrente y reporta el resultado en el informe trimestral de ventas.',
        supuestosBeneficios: ['El cliente ejecuta la Torre 3 en 2027.', 'Las tarifas de alquiler se mantienen durante la vigencia del contrato.'],
        riesgosBeneficios: ['Retrasos en pagos que reduzcan el flujo de caja del proyecto.', 'Un accidente en alturas afectaría la reputación y la referencia comercial.'],
      },
    },

    {
      id: 'acta-constitucion',
      name: 'Acta de constitución del proyecto',
      abbr: 'ACT',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'],
      kind: 'acta', multiple: false,
      purpose: 'Autoriza formalmente la existencia del proyecto y confiere al director la autoridad para aplicar recursos de la organización. Documenta el propósito, los objetivos medibles y los requisitos de alto nivel.',
      tips: [
        'Firma el acta antes de movilizar equipo: sin ella no hay autorización formal para comprometer personal, inventario ni transporte.',
        'Escribe objetivos medibles con su criterio de éxito (fechas de liberación por etapa, CPI ≥ 0,95, cero accidentes con incapacidad).',
        'Fija la autoridad del director en cifras: monto máximo de compras y subarriendos sin aprobación adicional y nivel de cambios que puede aprobar.',
        'Verifica que las pólizas exigidas por el contrato (cumplimiento, responsabilidad civil extracontractual, salarios y prestaciones) estén expedidas antes de la fecha de inicio.',
      ],
      sections: [
        {
          id: 'general', title: 'Datos generales',
          fields: [
            { key: 'nombreProyecto', label: 'Nombre del proyecto', type: 'text', from: 'project.name', required: true, hint: 'Nombre oficial con el que se identificará el proyecto en documentos y comunicaciones.' },
            { key: 'codigoProyecto', label: 'Código', type: 'text', from: 'project.code', hint: 'Código interno del proyecto.' },
            { key: 'cliente', label: 'Cliente', type: 'text', from: 'project.client', hint: 'Razón social del cliente o área interna beneficiaria.' },
            { key: 'patrocinador', label: 'Patrocinador', type: 'text', from: 'project.sponsor', hint: 'Persona o instancia que autoriza el proyecto y provee los recursos.' },
            { key: 'fechaInicio', label: 'Fecha de inicio', type: 'date', from: 'project.start', hint: 'Fecha a partir de la cual se autoriza ejecutar el proyecto.' },
            { key: 'fechaFin', label: 'Fecha de fin prevista', type: 'date', from: 'project.end', hint: 'Fecha comprometida de terminación.' },
          ],
        },
        {
          id: 'proposito', title: 'Propósito y objetivos medibles',
          fields: [
            { key: 'proposito', label: 'Propósito del proyecto', type: 'textarea', required: true, hint: 'Para qué se hace el proyecto y qué valor entrega al cliente y a la empresa, en una o dos frases.' },
            {
              key: 'objetivos', label: 'Objetivos y criterios de éxito', type: 'table', addLabel: 'Agregar objetivo',
              hint: 'Un objetivo por dimensión, con un criterio de éxito verificable y quién lo evalúa.',
              columns: [
                { key: 'dimension', label: 'Dimensión', type: 'select', options: DIMENSION_OBJETIVO },
                { key: 'objetivo', label: 'Objetivo', type: 'textarea', width: 240 },
                { key: 'criterioExito', label: 'Criterio de éxito', type: 'textarea', width: 240 },
                { key: 'evalua', label: 'Quién lo evalúa', type: 'text', width: 160 },
              ],
            },
          ],
        },
        {
          id: 'descripcion', title: 'Descripción, requisitos y riesgo general',
          fields: [
            { key: 'descripcion', label: 'Descripción de alto nivel', type: 'textarea', from: 'project.description', hint: 'Qué se va a hacer y entregar, en términos generales.' },
            { key: 'limites', label: 'Límites del proyecto', type: 'textarea', hint: 'Qué incluye y qué no incluye el proyecto a alto nivel (frentes, torres, servicios del cliente).' },
            { key: 'entregablesClave', label: 'Entregables clave', type: 'list', hint: 'Productos principales que se entregarán; el detalle va en el enunciado del alcance.' },
            { key: 'requisitosAltoNivel', label: 'Requisitos de alto nivel', type: 'list', hint: 'Condiciones que el proyecto debe cumplir: normativa, contrato, capacidades técnicas.' },
            { key: 'riesgoGeneral', label: 'Riesgo general del proyecto', type: 'textarea', hint: 'Nivel de riesgo global y sus fuentes principales; el detalle va en el registro de riesgos.' },
          ],
        },
        {
          id: 'hitos', title: 'Resumen del cronograma de hitos y recursos financieros',
          fields: [
            {
              key: 'hitos', label: 'Cronograma de hitos', type: 'table', addLabel: 'Agregar hito',
              hint: 'Hitos principales con fecha comprometida y la evidencia que demuestra su cumplimiento.',
              columns: [
                { key: 'hito', label: 'Hito', type: 'text', width: 260 },
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'criterio', label: 'Evidencia de cumplimiento', type: 'textarea', width: 240 },
              ],
            },
            { key: 'presupuesto', label: 'Presupuesto aprobado', type: 'money', from: 'project.budget', hint: 'Recursos financieros preaprobados para el proyecto, incluidas las reservas.' },
            { key: 'recursosFinancieros', label: 'Desglose de recursos financieros', type: 'textarea', hint: 'Cómo se compone el presupuesto (actividades, reserva para contingencias, reserva de gestión) y quién administra cada reserva.' },
          ],
        },
        {
          id: 'interesados', title: 'Interesados clave, aprobación y criterios de salida',
          fields: [
            {
              key: 'interesadosClave', label: 'Lista de interesados clave', type: 'table', addLabel: 'Agregar interesado',
              hint: 'Quiénes influyen o se ven afectados por el proyecto y qué esperan; el detalle va en el registro de interesados.',
              columns: [
                { key: 'interesado', label: 'Interesado', type: 'text', width: 200 },
                { key: 'rol', label: 'Rol en el proyecto', type: 'text', width: 160 },
                { key: 'interes', label: 'Interés principal', type: 'textarea', width: 260 },
              ],
            },
            { key: 'requisitosAprobacion', label: 'Requisitos de aprobación', type: 'textarea', hint: 'Qué constituye el éxito del proyecto, quién lo decide y quién firma la aceptación de entregables y el cierre.' },
            { key: 'criteriosSalida', label: 'Criterios de salida', type: 'textarea', hint: 'Condiciones para cerrar el proyecto o para suspenderlo o cancelarlo.' },
          ],
        },
        {
          id: 'autoridad', title: 'Director asignado, responsabilidad y autoridad',
          fields: [
            { key: 'director', label: 'Director del proyecto asignado', type: 'text', from: 'project.manager', required: true, hint: 'Nombre o cargo de quien dirige el proyecto.' },
            { key: 'responsabilidadAutoridad', label: 'Responsabilidad y nivel de autoridad', type: 'textarea', hint: 'Decisiones que puede tomar el director: personal, presupuesto, cambios, decisiones técnicas, resolución de conflictos y escalamiento.' },
            { key: 'limiteGasto', label: 'Límite de gasto sin aprobación adicional', type: 'money', hint: 'Monto máximo por compra, subarriendo o cambio que el director aprueba por sí mismo.' },
            { key: 'firmas', label: 'Firmas', type: 'table', addLabel: 'Agregar firma', hint: 'Firma el patrocinador que autoriza; el director acepta la designación.', columns: firmasColumns() },
          ],
        },
      ],
      example: {
        nombreProyecto: EX.name,
        codigoProyecto: EX.code,
        cliente: EX.client,
        patrocinador: EX.sponsor,
        fechaInicio: EX.start,
        fechaFin: EX.end,
        proposito: 'Proveer a Constructora Modelo S.A.S. (ficticia) un sistema de andamio multidireccional diseñado, montado y certificado para ejecutar con seguridad la fachada de la Torre 2 del Edificio Altavista, y retirarlo al terminar, dentro del plazo y el presupuesto aprobados.',
        objetivos: [
          { id: 'r1', dimension: 'Alcance', objetivo: 'Entregar montados y liberados los 15 niveles del andamio, los accesos y las protecciones perimetrales.', criterioExito: 'Listas de chequeo aprobadas y tarjeta verde por nivel; actas de aceptación firmadas por el cliente con visto bueno de la interventoría.', evalua: 'Interventoría del cliente' },
          { id: 'r2', dimension: 'Cronograma', objetivo: 'Terminar el montaje completo a más tardar el 7 de noviembre de 2026 y cerrar el proyecto el 18 de diciembre de 2026.', criterioExito: 'Desviación de hitos contractuales ≤ 5 días hábiles; SPI ≥ 0,95 en cada corte.', evalua: 'Director de proyecto' },
          { id: 'r3', dimension: 'Costo', objetivo: 'Ejecutar el proyecto dentro del presupuesto aprobado de COP 486,5 M.', criterioExito: 'CPI ≥ 0,95 y EAC dentro de la línea base de costos.', evalua: 'Patrocinador' },
          { id: 'r4', dimension: 'Seguridad y salud en el trabajo', objetivo: 'Cero accidentes con incapacidad durante el montaje, la operación y el desmontaje.', criterioExito: 'Índice de frecuencia de accidentes igual a cero; 100 % de permisos de trabajo en alturas diligenciados.', evalua: 'Coordinador SST (HSE)' },
          { id: 'r5', dimension: 'Satisfacción del cliente', objetivo: 'Lograr la satisfacción del cliente con el servicio integral.', criterioExito: 'Encuesta de cierre con calificación ≥ 4,5 / 5.', evalua: 'Gerencia General' },
        ],
        descripcion: EX.description,
        limites: 'Incluye el andamio de fachada de la Torre 2 desde el nivel de andén hasta la cubierta, en las fachadas norte, oriente y occidente. No incluye la Torre 1, las obras de fachada, la grúa ni el montacargas (los aporta el cliente), la vigilancia del equipo fuera de la jornada ni los permisos de ocupación del espacio público.',
        entregablesClave: [
          'Diseño, planos de montaje y memoria de cálculo aprobados por la interventoría',
          'Plan de montaje y desmontaje y plan de rescate en alturas',
          'Andamio montado y liberado por etapas (niveles 1–5, 6–10 y 11–15)',
          'Accesos y protecciones perimetrales',
          'Certificado de inspección del andamio completo por persona competente',
          'Informes de inspección y mantenimiento en obra',
          'Acta de inspección de retorno y acta de cierre',
        ],
        requisitosAltoNivel: [
          'Cumplir la Resolución 4272 de 2021 (trabajo en alturas) y el SG-SST según el Decreto 1072 de 2015.',
          'Plataformas de trabajo con carga de servicio de 200 kg/m² en todos los niveles.',
          'Montaje por etapas sin interrumpir la fachada en los niveles ya liberados.',
          'Memoria de cálculo firmada por ingeniero civil con matrícula profesional vigente.',
          'Despachos dentro de los horarios permitidos a vehículos de carga en Bogotá.',
        ],
        riesgoGeneral: 'Medio-alto: trabajo en alturas continuo durante cinco meses en temporada de lluvias, dependencia de la grúa del cliente para izar material desde el nivel 6 e inventario ajustado de diagonales. Se mitiga con plan de rescate, holgura para lluvias y jornada extendida pactada, subarriendo preacordado y comité de obra semanal.',
        hitos: [
          { id: 'r1', hito: 'Acta de constitución firmada', fecha: '2026-08-03', criterio: 'Acta firmada por el patrocinador y el director.' },
          { id: 'r2', hito: 'Diseño y memoria de cálculo aprobados por la interventoría', fecha: '2026-08-21', criterio: 'Comunicación de aprobación de la interventoría.' },
          { id: 'r3', hito: 'Equipo despachado completo a obra', fecha: '2026-08-29', criterio: 'Remisiones firmadas sin faltantes.' },
          { id: 'r4', hito: 'Niveles 1–5 montados y liberados', fecha: '2026-09-19', criterio: 'Tarjeta verde y acta de aceptación de la etapa 1.' },
          { id: 'r5', hito: 'Niveles 6–10 montados y liberados', fecha: '2026-10-10', criterio: 'Tarjeta verde y acta de aceptación de la etapa 2.' },
          { id: 'r6', hito: 'Niveles 11–15, accesos y protecciones montados', fecha: '2026-11-07', criterio: 'Acta de aceptación de la etapa 3.' },
          { id: 'r7', hito: 'Certificación del andamio completo', fecha: '2026-11-12', criterio: 'Certificado firmado por persona competente.' },
          { id: 'r8', hito: 'Desmontaje terminado y equipo retirado de obra', fecha: '2026-12-12', criterio: 'Acta de entrega del frente libre de equipo.' },
          { id: 'r9', hito: 'Inspección de retorno y acta de cierre firmada', fecha: '2026-12-18', criterio: 'Acta de cierre firmada por el cliente y el patrocinador.' },
        ],
        presupuesto: EX.budget,
        recursosFinancieros: 'Presupuesto aprobado de COP 486.500.000: BAC de actividades COP 442.200.000; reserva para contingencias COP 32.400.000, administrada por el director con aprobación del CCB; reserva de gestión COP 11.900.000, administrada por Gerencia General. Anticipo del 20 % del valor del contrato.',
        interesadosClave: [
          { id: 'r1', interesado: 'Gerencia General', rol: 'Patrocinador', interes: 'Margen del contrato y relación de largo plazo con el cliente.' },
          { id: 'r2', interesado: 'Director de obra del cliente', rol: 'Cliente', interes: 'Andamio disponible por etapas para no frenar la fachada.' },
          { id: 'r3', interesado: 'Interventoría del cliente', rol: 'Supervisión técnica', interes: 'Cumplimiento normativo, aprobación del diseño y liberación de niveles.' },
          { id: 'r4', interesado: 'Coordinador SST (HSE)', rol: 'Equipo del proyecto', interes: 'Trabajo en alturas sin accidentes y registros del SG-SST al día.' },
          { id: 'r5', interesado: 'ARL', rol: 'Externo', interes: 'Seguimiento al programa de prevención y protección contra caídas.' },
          { id: 'r6', interesado: 'Almacén y Coordinador logístico', rol: 'Equipo del proyecto', interes: 'Disponibilidad de piezas, despachos y retorno sin faltantes.' },
        ],
        requisitosAprobacion: 'El patrocinador determina el éxito con base en los objetivos medibles de esta acta. Los entregables los acepta el director de obra del cliente con visto bueno de la interventoría mediante actas de aceptación. El acta de cierre la firman el patrocinador, el director de proyecto y el cliente.',
        criteriosSalida: 'El proyecto se cierra con el equipo retirado de obra, la inspección de retorno liquidada, la facturación emitida y el acta de cierre firmada. Se suspende si el cliente incumple pagos por más de 60 días o si la interventoría suspende el frente por condiciones no atribuibles a la empresa; la cancelación la decide el patrocinador.',
        director: EX.manager,
        responsabilidadAutoridad: 'El director dirige el equipo asignado (ingeniería, logística, montaje y SST), aprueba el cronograma detallado, asigna cuadrillas, autoriza compras y subarriendos dentro del presupuesto, aprueba cambios de nivel 1 y escala al CCB los de nivel 2 y 3. Puede detener cualquier actividad por condiciones inseguras.',
        limiteGasto: 15000000,
        firmas: [
          { id: 'r1', rol: 'Patrocinador', nombre: 'Gerencia General', fecha: '2026-08-03' },
          { id: 'r2', rol: 'Director del proyecto', nombre: 'Director de proyecto', fecha: '2026-08-03' },
          { id: 'r3', rol: 'Cliente (enterado)', nombre: 'Director de obra del cliente', fecha: '2026-08-04' },
        ],
      },
    },

    {
      id: 'registro-supuestos',
      name: 'Registro de supuestos',
      abbr: 'RSUP',
      area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1', '5.3', '6.5', '11.2'],
      kind: 'registro', multiple: false,
      purpose: 'Registra los supuestos y las restricciones identificados a lo largo del proyecto, con su responsable y la fecha en que deben validarse.',
      tips: [
        'Valida cada supuesto con evidencia escrita (acta de comité de obra, correo del cliente, certificado) y su fecha; un supuesto falso se convierte en riesgo o incidente.',
        'Registra como restricciones las normas obligatorias: Resolución 4272 de 2021 (trabajo en alturas), Decreto 1072 de 2015 (SG-SST) y las restricciones de circulación de carga de la Secretaría Distrital de Movilidad.',
        'Revisa el registro en el comité semanal: los supuestos sobre el cliente (grúa, frente despejado, pagos) son los que más fallan en obra.',
      ],
      sections: [
        {
          id: 'registro', title: 'Supuestos y restricciones',
          fields: [
            {
              key: 'supuestos', label: 'Registro de supuestos y restricciones', type: 'table', addLabel: 'Agregar supuesto o restricción',
              hint: 'Código consecutivo (S-01, S-02…). Un supuesto es lo que se da por cierto sin prueba; una restricción es un límite impuesto.',
              columns: [
                { key: 'id', label: 'Código', type: 'text', width: 80, hint: 'Consecutivo, p. ej. S-07.' },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_SUPUESTO, default: 'Supuesto' },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 320 },
                { key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIA_SUPUESTO },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 160 },
                { key: 'fechaValidacion', label: 'Fecha de validación', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_SUPUESTO, default: 'Por validar' },
              ],
            },
          ],
        },
        {
          id: 'gestion', title: 'Criterios de gestión',
          fields: [
            { key: 'criterioValidacion', label: 'Cómo se validan', type: 'textarea', hint: 'Evidencia que se exige para marcar un supuesto como validado y qué se hace cuando resulta falso.' },
            { key: 'frecuenciaRevision', label: 'Frecuencia de revisión', type: 'select', options: FRECUENCIA, hint: 'Cada cuánto se revisa el registro completo.' },
          ],
        },
      ],
      example: {
        supuestos: [
          { id: 'S-01', tipo: 'Supuesto', descripcion: 'El cliente entrega el frente de la Torre 2 despejado y con losas aptas para anclajes antes del 31 de agosto de 2026.', categoria: 'Cliente y obra', responsable: 'Residente de obra', fechaValidacion: '2026-08-28', estado: 'Validado' },
          { id: 'S-02', tipo: 'Supuesto', descripcion: 'La grúa torre del cliente estará disponible 4 horas diarias para izar material desde el nivel 6.', categoria: 'Cliente y obra', responsable: 'Director de proyecto', fechaValidacion: '2026-09-19', estado: 'Descartado' },
          { id: 'S-03', tipo: 'Supuesto', descripcion: 'El inventario de bodega cubre el 100 % de las piezas de andamio multidireccional sin necesidad de subarrendar.', categoria: 'Logística', responsable: 'Coordinador logístico', fechaValidacion: '2026-08-21', estado: 'Descartado' },
          { id: 'S-04', tipo: 'Restricción', descripcion: 'Los vehículos de carga solo pueden circular en Bogotá en los horarios permitidos por la Secretaría Distrital de Movilidad; los despachos se programan en horario nocturno.', categoria: 'Regulatorio', responsable: 'Coordinador logístico', fechaValidacion: '2026-08-14', estado: 'Validado' },
          { id: 'S-05', tipo: 'Restricción', descripcion: 'Todo trabajo en alturas se ejecuta con personal certificado, permiso de trabajo diario y coordinador de alturas en sitio (Resolución 4272 de 2021).', categoria: 'Seguridad y salud en el trabajo', responsable: 'Coordinador SST (HSE)', fechaValidacion: '2026-08-03', estado: 'Validado' },
          { id: 'S-06', tipo: 'Restricción', descripcion: 'Presupuesto máximo de COP 486,5 M; el uso de la reserva de gestión requiere aprobación de Gerencia General.', categoria: 'Costos', responsable: 'Director de proyecto', fechaValidacion: '2026-08-03', estado: 'Validado' },
          { id: 'S-07', tipo: 'Supuesto', descripcion: 'Las lluvias de octubre y noviembre no detendrán el montaje más de 6 días hábiles en total.', categoria: 'Clima y entorno', responsable: 'Supervisor de montaje', fechaValidacion: '2026-11-07', estado: 'Por validar' },
          { id: 'S-08', tipo: 'Supuesto', descripcion: 'El cliente paga las facturas de alquiler y montaje a 30 días.', categoria: 'Contractual', responsable: 'Facturación y cartera', fechaValidacion: '2026-10-15', estado: 'Por validar' },
        ],
        criterioValidacion: 'Cada supuesto se valida con evidencia escrita (acta del comité de obra, correo del cliente, certificado o conteo físico). Si resulta falso se marca como descartado y se registra el riesgo o incidente correspondiente: S-02 originó el incidente INC-003 y S-03 el INC-001.',
        frecuenciaRevision: 'Semanal',
      },
    },

    /* ================================================================== INTEGRACIÓN · PLANIFICACIÓN (4.2) */
    {
      id: 'plan-direccion',
      name: 'Plan para la dirección del proyecto',
      abbr: 'PDP',
      area: 'integracion', group: 'planificacion', process: '4.2', processes: ['4.2'],
      kind: 'plan', multiple: false,
      purpose: 'Integra los planes subsidiarios y las líneas base, y describe cómo se ejecutará, monitoreará, controlará y cerrará el proyecto. Es el documento de referencia para el equipo y los interesados.',
      tips: [
        'Úsalo como índice: cada plan subsidiario puede ser un documento aparte, referenciado aquí con su código y revisión vigente.',
        'Adapta el rigor al tamaño y al riesgo: un montaje de una semana no necesita doce planes completos, pero el plan de rescate y el control de cambios no se omiten.',
        'Toda modificación de una línea base aprobada pasa por Realizar el control integrado de cambios (4.6) y genera nueva revisión de este plan.',
      ],
      sections: [
        {
          id: 'ciclo', title: 'Ciclo de vida y enfoque de desarrollo',
          fields: [
            { key: 'cicloVida', label: 'Ciclo de vida', type: 'select', options: CICLOS_VIDA, from: 'project.lifecycle', hint: 'Tipo de ciclo de vida del proyecto.' },
            { key: 'enfoqueDesarrollo', label: 'Enfoque de desarrollo', type: 'textarea', hint: 'Cómo se define y entrega el producto: todo planificado al inicio, por entregas incrementales o iteraciones.' },
            {
              key: 'fases', label: 'Fases del proyecto', type: 'table', addLabel: 'Agregar fase',
              hint: 'Fases en orden, con sus entregables y el criterio para pasar a la siguiente.',
              columns: [
                { key: 'fase', label: 'Fase', type: 'text', width: 180 },
                { key: 'entregables', label: 'Entregables principales', type: 'textarea', width: 240 },
                { key: 'criterioSalida', label: 'Criterio de salida', type: 'textarea', width: 220 },
                { key: 'fechaPrevista', label: 'Fecha prevista de cierre', type: 'date' },
              ],
            },
          ],
        },
        {
          id: 'adaptacion', title: 'Adaptación (tailoring)',
          fields: [
            { key: 'adaptacion', label: 'Decisiones de adaptación', type: 'textarea', hint: 'Qué procesos se aplican, con qué rigor y por qué, según el tamaño, la complejidad y el riesgo del proyecto.' },
            { key: 'procesosSimplificados', label: 'Procesos o documentos simplificados', type: 'list', hint: 'Elementos que se omiten o se reemplazan por procedimientos corporativos, con la razón.' },
          ],
        },
        {
          id: 'planes', title: 'Planes subsidiarios',
          fields: [
            {
              key: 'planesSubsidiarios', label: 'Planes subsidiarios y componentes', type: 'table', addLabel: 'Agregar plan o componente',
              hint: 'Estado y ubicación de cada plan. Marca "No aplica" con la razón en el resumen.',
              columns: [
                { key: 'plan', label: 'Plan', type: 'text', width: 240 },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_PLAN },
                { key: 'referencia', label: 'Documento o ubicación', type: 'text', width: 200 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 160 },
                { key: 'resumen', label: 'Resumen del enfoque', type: 'textarea', width: 260 },
              ],
              defaultRows: [
                { plan: 'Plan de gestión del alcance' },
                { plan: 'Plan de gestión de los requisitos' },
                { plan: 'Plan de gestión del cronograma' },
                { plan: 'Plan de gestión de los costos' },
                { plan: 'Plan de gestión de la calidad' },
                { plan: 'Plan de gestión de los recursos' },
                { plan: 'Plan de gestión de las comunicaciones' },
                { plan: 'Plan de gestión de los riesgos' },
                { plan: 'Plan de gestión de las adquisiciones' },
                { plan: 'Plan de involucramiento de los interesados' },
                { plan: 'Plan de gestión de cambios' },
                { plan: 'Plan de gestión de la configuración' },
              ],
            },
          ],
        },
        {
          id: 'lineasBase', title: 'Líneas base',
          fields: [
            {
              key: 'lineasBase', label: 'Resumen de las líneas base', type: 'table', addLabel: 'Agregar línea base',
              hint: 'Contenido, versión vigente (LB0, LB1…) y fecha de aprobación de cada línea base.',
              columns: [
                { key: 'lineaBase', label: 'Línea base', type: 'select', options: LINEA_BASE },
                { key: 'contenido', label: 'Contenido', type: 'textarea', width: 280 },
                { key: 'version', label: 'Versión', type: 'text', width: 80 },
                { key: 'fechaAprobacion', label: 'Fecha de aprobación', type: 'date' },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea', width: 220 },
              ],
              defaultRows: [
                { lineaBase: 'Alcance', contenido: 'Enunciado del alcance, EDT y diccionario de la EDT.' },
                { lineaBase: 'Cronograma', contenido: 'Fechas de inicio y fin aprobadas de actividades e hitos.' },
                { lineaBase: 'Costos', contenido: 'Presupuesto distribuido en el tiempo, con la reserva para contingencias.' },
              ],
            },
            { key: 'presupuestoTotal', label: 'Presupuesto del proyecto', type: 'money', from: 'project.budget', hint: 'Línea base de costos más la reserva de gestión.' },
            { key: 'umbralesVariacion', label: 'Umbrales de variación', type: 'textarea', hint: 'Variaciones de cronograma, costo y alcance que se toleran sin escalar y las que obligan a tomar acción.' },
          ],
        },
        {
          id: 'revisiones', title: 'Revisiones clave de gestión',
          fields: [
            {
              key: 'revisiones', label: 'Revisiones', type: 'table', addLabel: 'Agregar revisión',
              hint: 'Reuniones o puntos de control en los que se revisa el desempeño y se toman decisiones.',
              columns: [
                { key: 'revision', label: 'Revisión', type: 'text', width: 200 },
                { key: 'momento', label: 'Momento o frecuencia', type: 'text', width: 180 },
                { key: 'participantes', label: 'Participantes', type: 'textarea', width: 220 },
                { key: 'proposito', label: 'Propósito y decisiones', type: 'textarea', width: 260 },
              ],
              defaultRows: [
                { revision: 'Reunión de inicio (kick-off)', momento: 'Al aprobar el plan para la dirección', proposito: 'Presentar objetivos, alcance, cronograma, roles y reglas de trabajo.' },
                { revision: 'Comité de seguimiento', momento: 'Semanal', proposito: 'Revisar avance, valor ganado, riesgos, incidentes y cambios.' },
                { revision: 'Revisión de fin de fase', momento: 'Al terminar cada fase', proposito: 'Verificar criterios de salida y autorizar la fase siguiente.' },
                { revision: 'Revisión de cierre', momento: 'Al aceptar el último entregable', proposito: 'Confirmar la aceptación final, el cierre contractual y las lecciones aprendidas.' },
              ],
            },
            { key: 'mantenimientoPlan', label: 'Mantenimiento del plan', type: 'textarea', hint: 'Quién mantiene el plan, cómo se actualiza y cómo se controlan sus revisiones.' },
          ],
        },
      ],
      example: {
        cicloVida: 'Predictivo',
        enfoqueDesarrollo: 'Enfoque predictivo: el alcance, el diseño y la secuencia de montaje se definen y aprueban antes de movilizar equipo. El montaje se entrega de forma incremental, por etapas de cinco niveles, para que el cliente avance la fachada en paralelo.',
        fases: [
          { id: 'r1', fase: 'Inicio e ingeniería', entregables: 'Acta de constitución, diseño, planos, memoria de cálculo, plan de montaje y plan de rescate.', criterioSalida: 'Diseño y memoria aprobados por la interventoría.', fechaPrevista: '2026-08-21' },
          { id: 'r2', fase: 'Suministro y logística', entregables: 'Equipo alistado, inspeccionado y despachado.', criterioSalida: 'Remisiones firmadas sin faltantes.', fechaPrevista: '2026-08-29' },
          { id: 'r3', fase: 'Montaje y certificación', entregables: 'Andamio montado por etapas, accesos, protecciones y certificado del andamio completo.', criterioSalida: 'Certificado de persona competente y acta de aceptación de la etapa 3.', fechaPrevista: '2026-11-12' },
          { id: 'r4', fase: 'Operación en obra', entregables: 'Inspecciones semanales y mantenimiento del andamio.', criterioSalida: 'Orden escrita del cliente para desmontar.', fechaPrevista: '2026-11-28' },
          { id: 'r5', fase: 'Desmontaje, retiro y cierre', entregables: 'Equipo retirado, inspección de retorno, informe final y acta de cierre.', criterioSalida: 'Acta de cierre firmada.', fechaPrevista: '2026-12-18' },
        ],
        adaptacion: 'Proyecto mediano (cerca de 4,5 meses y COP 486,5 M) con alto riesgo de seguridad: se aplican con rigor completo integración, alcance, cronograma, costos, riesgos y control de cambios. Calidad y recursos se apoyan en los procedimientos corporativos de inspección de andamios y de asignación de cuadrillas. Las adquisiciones se limitan al subarriendo puntual de piezas y al transporte tercerizado.',
        procesosSimplificados: [
          'Adquisiciones: sin licitación; el subarriendo de piezas y el transporte se contratan con proveedores homologados según la política corporativa.',
          'Calidad: las métricas de calidad se toman de las listas de chequeo corporativas de inspección de andamios.',
          'Riesgos: el análisis cuantitativo se limita al valor monetario esperado de los riesgos altos; no se hace simulación.',
          'Comunicaciones: el comité de obra semanal reemplaza las reuniones separadas de equipo y de cliente.',
        ],
        planesSubsidiarios: [
          { id: 'r1', plan: 'Plan de gestión del alcance', estado: 'Aprobado', referencia: 'PRY-2026-014-PALC rev. 0', responsable: 'Director de proyecto', resumen: 'Enunciado del alcance, EDT por fases y etapas de montaje, aceptación mediante actas.' },
          { id: 'r2', plan: 'Plan de gestión de los requisitos', estado: 'Aprobado', referencia: 'PRY-2026-014-PREQ rev. 0', responsable: 'Ingeniero de diseño', resumen: 'Requisitos legales, del cliente y de la solución, con trazabilidad a la EDT y a la inspección.' },
          { id: 'r3', plan: 'Plan de gestión del cronograma', estado: 'Aprobado', referencia: 'PRY-2026-014-PCRO rev. 0', responsable: 'Director de proyecto', resumen: 'Ruta crítica, calendario de lunes a sábado con festivos de Colombia y corte semanal los viernes.' },
          { id: 'r4', plan: 'Plan de gestión de los costos', estado: 'Aprobado', referencia: 'Plan de gestión de los costos rev. 0', responsable: 'Director de proyecto', resumen: 'Pesos colombianos sin decimales, valor ganado mensual y administración de reservas.' },
          { id: 'r5', plan: 'Plan de gestión de la calidad', estado: 'Aprobado', referencia: 'Plan de gestión de la calidad rev. 0', responsable: 'Supervisor de montaje', resumen: 'Listas de chequeo por nivel e inspección y liberación por persona competente.' },
          { id: 'r6', plan: 'Plan de gestión de los recursos', estado: 'Aprobado', referencia: 'Plan de gestión de los recursos rev. 0', responsable: 'Director de proyecto', resumen: 'Dos cuadrillas de montaje certificadas e inventario reservado en bodega.' },
          { id: 'r7', plan: 'Plan de gestión de las comunicaciones', estado: 'Aprobado', referencia: 'Plan de gestión de las comunicaciones rev. 0', responsable: 'Director de proyecto', resumen: 'Comité de obra semanal e informe mensual de desempeño al patrocinador y al cliente.' },
          { id: 'r8', plan: 'Plan de gestión de los riesgos', estado: 'Aprobado', referencia: 'Plan de gestión de los riesgos rev. 0', responsable: 'Director de proyecto', resumen: 'Escala de 1 a 5, revisión semanal y reserva para contingencias.' },
          { id: 'r9', plan: 'Plan de gestión de las adquisiciones', estado: 'Aprobado', referencia: 'Plan de gestión de las adquisiciones rev. 0', responsable: 'Coordinador logístico', resumen: 'Subarriendo puntual de piezas y transporte tercerizado con proveedores homologados, sin licitación.' },
          { id: 'r10', plan: 'Plan de involucramiento de los interesados', estado: 'Aprobado', referencia: 'Plan de involucramiento rev. 0', responsable: 'Director de proyecto', resumen: 'Estrategias para el cliente, la interventoría y la ARL.' },
          { id: 'r11', plan: 'Plan de gestión de cambios', estado: 'Aprobado', referencia: 'PRY-2026-014-PCAM rev. 0', responsable: 'Director de proyecto', resumen: 'Tres niveles de autoridad y comité de control de cambios semanal.' },
          { id: 'r12', plan: 'Plan de gestión de la configuración', estado: 'Aprobado', referencia: 'PRY-2026-014-PCFG rev. 0', responsable: 'Ingeniero de diseño', resumen: 'Control de revisiones de planos, memoria y procedimientos; trazabilidad del equipo.' },
        ],
        lineasBase: [
          { id: 'r1', lineaBase: 'Alcance', contenido: 'Enunciado del alcance, EDT con seis entregables de nivel 2 (1.1 a 1.6) y diccionario de la EDT.', version: 'LB1', fechaAprobacion: '2026-09-11', observaciones: 'Incluye la plataforma de descargue del piso 8 (CC-002).' },
          { id: 'r2', lineaBase: 'Cronograma', contenido: 'Cronograma por ruta crítica del 3 de agosto al 18 de diciembre de 2026, calendario de lunes a sábado con festivos de Colombia.', version: 'LB1', fechaAprobacion: '2026-09-11', observaciones: 'CC-002 agrega 4 días a accesos y protecciones sin mover la fecha de fin.' },
          { id: 'r3', lineaBase: 'Costos', contenido: 'Línea base de costos de $ 474,6 M: BAC de actividades de $ 452,0 M más reserva para contingencias de $ 22,6 M.', version: 'LB1', fechaAprobacion: '2026-09-11', observaciones: '$ 9,8 M trasladados de la reserva para contingencias al BAC por el CC-002. La reserva de gestión ($ 11,9 M) queda fuera de la línea base.' },
        ],
        presupuestoTotal: EX.budget,
        umbralesVariacion: 'SPI y CPI: verde ≥ 0,95; amarillo entre 0,90 y 0,94; rojo < 0,90. Hitos contractuales: hasta 5 días hábiles de desviación sin escalar al patrocinador. Costo: una variación mayor al 5 % en un entregable de nivel 2 se analiza en el comité semanal.',
        revisiones: [
          { id: 'r1', revision: 'Reunión de inicio (kick-off)', momento: '3 de agosto de 2026', participantes: 'Patrocinador, equipo del proyecto, director de obra del cliente e interventoría', proposito: 'Presentar objetivos, alcance, cronograma, roles, plan de rescate y reglas de comunicación.' },
          { id: 'r2', revision: 'Comité de obra y seguimiento', momento: 'Semanal, viernes a las 7:00', participantes: 'Director de proyecto, residente de obra, supervisor de montaje, coordinador SST y director de obra del cliente', proposito: 'Avance, valor ganado, riesgos, incidentes, cambios y programación de la grúa del cliente.' },
          { id: 'r3', revision: 'Revisión de fin de fase', momento: 'Al terminar ingeniería, cada etapa de montaje y el desmontaje', participantes: 'Director de proyecto, patrocinador e interventoría', proposito: 'Verificar criterios de salida y autorizar la fase siguiente.' },
          { id: 'r4', revision: 'Revisión de cierre', momento: 'Diciembre de 2026', participantes: 'Patrocinador, director de proyecto y cliente', proposito: 'Aceptación final, liquidación del contrato y lecciones aprendidas.' },
        ],
        mantenimientoPlan: 'El director de proyecto mantiene el plan. Cualquier cambio a una línea base o a un plan subsidiario pasa por el control integrado de cambios y genera una nueva revisión del documento (borradores A, B…; emisiones aprobadas 0, 1…).',
      },
    },

    {
      id: 'plan-gestion-cambios',
      name: 'Plan de gestión de cambios',
      abbr: 'PCAM',
      area: 'integracion', group: 'planificacion', process: '4.2', processes: ['4.2'],
      kind: 'plan', multiple: false,
      purpose: 'Establece cómo se solicitan, analizan, aprueban o rechazan e incorporan los cambios durante el proyecto: comité de control de cambios, niveles de autoridad y procedimiento.',
      tips: [
        'Define los umbrales en pesos y días hábiles, no solo en porcentajes, para que el residente sepa cuándo escalar.',
        'Ninguna instrucción verbal del director de obra o de la interventoría se ejecuta sin solicitud de cambio registrada; las órdenes anotadas en la bitácora de obra también se formalizan.',
        'Los cambios de emergencia por seguridad (por ejemplo, anclajes adicionales por viento) se ejecutan de inmediato y se documentan dentro de las 24 horas siguientes.',
        'Si el cambio modifica el valor o el plazo del contrato, tramita además el otrosí u orden de cambio y la modificación de las pólizas.',
      ],
      sections: [
        {
          id: 'enfoque', title: 'Enfoque y alcance',
          fields: [
            { key: 'enfoqueCambios', label: 'Enfoque del control de cambios', type: 'textarea', hint: 'Principios: qué se controla, cuándo se formaliza un cambio y cómo se relaciona con el contrato.' },
            { key: 'definicionCambio', label: 'Qué es y qué no es un cambio', type: 'textarea', hint: 'Diferencia entre un cambio formal y un ajuste menor que el equipo puede hacer sin aprobación.' },
          ],
        },
        {
          id: 'ccb', title: 'Comité de control de cambios (CCB)',
          fields: [
            {
              key: 'ccb', label: 'Integrantes del comité', type: 'table', addLabel: 'Agregar integrante',
              hint: 'Roles del comité y su responsabilidad en el análisis y la decisión.',
              columns: [
                { key: 'rol', label: 'Rol en el comité', type: 'text', width: 160 },
                { key: 'integrante', label: 'Integrante', type: 'text', width: 200 },
                { key: 'responsabilidad', label: 'Responsabilidad', type: 'textarea', width: 300 },
              ],
            },
            { key: 'frecuenciaCcb', label: 'Frecuencia de reunión', type: 'select', options: ['Semanal', 'Quincenal', 'Mensual', 'A demanda'], hint: 'Cada cuánto sesiona el comité de forma ordinaria.' },
          ],
        },
        {
          id: 'umbrales', title: 'Niveles de autoridad y umbrales de aprobación',
          fields: [
            {
              key: 'umbrales', label: 'Niveles de autoridad', type: 'table', addLabel: 'Agregar nivel',
              hint: 'Quién aprueba según el impacto. Ajusta los criterios al presupuesto y a los hitos del proyecto.',
              columns: [
                { key: 'nivel', label: 'Nivel', type: 'text', width: 100 },
                { key: 'criterio', label: 'Criterio (impacto)', type: 'textarea', width: 320 },
                { key: 'aprobador', label: 'Aprueba', type: 'text', width: 220 },
                { key: 'plazoDias', label: 'Plazo de respuesta (días hábiles)', type: 'number', min: 0, max: 30 },
              ],
              defaultRows: [
                { nivel: 'Nivel 1', criterio: 'Sin efecto en hitos contractuales ni en el alcance del contrato; costo cubierto por la reserva para contingencias e inferior al 1 % del presupuesto.', aprobador: 'Director del proyecto', plazoDias: 2 },
                { nivel: 'Nivel 2', criterio: 'Costo entre el 1 % y el 5 % del presupuesto o desplazamiento de un hito de hasta 5 días hábiles.', aprobador: 'Comité de control de cambios (CCB)', plazoDias: 5 },
                { nivel: 'Nivel 3', criterio: 'Costo superior al 5 % del presupuesto, uso de la reserva de gestión o cambio en el alcance, el valor o la fecha de fin del contrato.', aprobador: 'Patrocinador y cliente (CCB ampliado)', plazoDias: 10 },
                { nivel: 'Emergencia', criterio: 'Acción inmediata para controlar una condición insegura o un riesgo inminente para personas o equipos.', aprobador: 'Director del proyecto o coordinador SST; el CCB la ratifica', plazoDias: 1 },
              ],
            },
          ],
        },
        {
          id: 'proceso', title: 'Proceso de control de cambios',
          fields: [
            {
              key: 'pasos', label: 'Pasos del proceso', type: 'table', addLabel: 'Agregar paso',
              hint: 'Secuencia desde la solicitud hasta la verificación de la implementación.',
              columns: [
                { key: 'paso', label: 'Paso', type: 'text', width: 140 },
                { key: 'actividad', label: 'Actividad', type: 'textarea', width: 320 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 180 },
                { key: 'plazo', label: 'Plazo', type: 'text', width: 120 },
              ],
              defaultRows: [
                { paso: '1. Registrar', actividad: 'Diligenciar la solicitud de cambio con descripción, justificación y soportes; asignar el código CC-### en el registro de cambios.', responsable: 'Solicitante y director del proyecto', plazo: '1 día hábil' },
                { paso: '2. Analizar', actividad: 'Evaluar el impacto en alcance, cronograma, costo, calidad, riesgos, recursos y seguridad; proponer alternativas.', responsable: 'Director del proyecto con el equipo técnico', plazo: '3 días hábiles' },
                { paso: '3. Decidir', actividad: 'Aprobar, rechazar o diferir según el nivel de autoridad; registrar la decisión y sus condiciones.', responsable: 'Aprobador según el nivel', plazo: 'Según el nivel' },
                { paso: '4. Actualizar', actividad: 'Actualizar el plan para la dirección, las líneas base y los documentos afectados; emitir nuevas revisiones.', responsable: 'Director del proyecto', plazo: '2 días hábiles' },
                { paso: '5. Comunicar', actividad: 'Informar la decisión al solicitante, al equipo y a los interesados afectados.', responsable: 'Director del proyecto', plazo: '1 día hábil' },
                { paso: '6. Verificar', actividad: 'Comprobar que el cambio aprobado se implementó como se decidió.', responsable: 'Control de calidad y cliente', plazo: 'Al implementar' },
              ],
            },
            { key: 'cambiosEmergencia', label: 'Cambios de emergencia', type: 'textarea', hint: 'Quién puede ordenar un cambio inmediato, en qué casos y cómo se documenta después.' },
          ],
        },
        {
          id: 'herramientas', title: 'Documentación y comunicación',
          fields: [
            { key: 'herramientasCambios', label: 'Formatos y herramientas', type: 'textarea', hint: 'Formatos, registros y herramientas para documentar solicitudes, decisiones y nuevas líneas base.' },
            { key: 'comunicacionCambios', label: 'Comunicación de decisiones', type: 'textarea', hint: 'Cómo y en qué plazo se informa cada decisión y a quién.' },
          ],
        },
      ],
      example: {
        enfoqueCambios: 'Todo cambio a las líneas base, al alcance del contrato o a los documentos bajo control de configuración se tramita por escrito, se analiza y se decide según el nivel de autoridad antes de ejecutarse. Los cambios solicitados por el cliente se formalizan además con una orden de cambio u otrosí.',
        definicionCambio: 'Es cambio cualquier modificación de elementos, cantidades o especificaciones del andamio, de las fechas de hitos, del presupuesto o de un documento aprobado (planos, memoria de cálculo, procedimientos). No son cambios los ajustes de secuencia dentro de la holgura disponible ni las reasignaciones de personal que no afectan costo ni plazo.',
        ccb: [
          { id: 'r1', rol: 'Presidente', integrante: 'Director de proyecto', responsabilidad: 'Convoca, presenta el análisis de impacto y decide los cambios de nivel 1.' },
          { id: 'r2', rol: 'Patrocinador', integrante: 'Gerencia General', responsabilidad: 'Decide los cambios de nivel 3 y autoriza el uso de la reserva de gestión.' },
          { id: 'r3', rol: 'Asesor técnico', integrante: 'Ingeniero de diseño', responsabilidad: 'Evalúa el impacto estructural y emite las nuevas revisiones de planos y memoria.' },
          { id: 'r4', rol: 'Asesor SST', integrante: 'Coordinador SST (HSE)', responsabilidad: 'Evalúa el impacto en seguridad, permisos de trabajo y plan de rescate.' },
          { id: 'r5', rol: 'Representante del cliente', integrante: 'Director de obra del cliente', responsabilidad: 'Participa en los cambios de nivel 3 y emite la orden de cambio.' },
          { id: 'r6', rol: 'Secretaría', integrante: 'Residente de obra', responsabilidad: 'Mantiene el registro de cambios y las actas del comité.' },
        ],
        frecuenciaCcb: 'Semanal',
        umbrales: [
          { id: 'r1', nivel: 'Nivel 1', criterio: 'Sin efecto en hitos contractuales ni en el alcance del contrato; costo de hasta COP 4.865.000 (1 % del presupuesto) cubierto por la reserva para contingencias.', aprobador: 'Director de proyecto', plazoDias: 2 },
          { id: 'r2', nivel: 'Nivel 2', criterio: 'Costo entre COP 4.865.000 y COP 24.325.000 (1 % a 5 %) o desplazamiento de un hito de hasta 5 días hábiles.', aprobador: 'Comité de control de cambios (CCB)', plazoDias: 5 },
          { id: 'r3', nivel: 'Nivel 3', criterio: 'Costo superior a COP 24.325.000, uso de la reserva de gestión o cambio en el alcance, el valor o la fecha de fin del contrato.', aprobador: CCB_AMPLIADO, plazoDias: 10 },
          { id: 'r4', nivel: 'Emergencia', criterio: 'Condición insegura o riesgo inminente: viento fuerte, anclaje deficiente, daño estructural del andamio.', aprobador: 'Director de proyecto o Coordinador SST (HSE); ratifica el CCB', plazoDias: 1 },
        ],
        pasos: [
          { id: 'r1', paso: '1. Registrar', actividad: 'El solicitante diligencia la solicitud de cambio; el residente asigna el código CC-### en el registro de cambios.', responsable: 'Solicitante y Residente de obra', plazo: '1 día hábil' },
          { id: 'r2', paso: '2. Analizar', actividad: 'Análisis de impacto en alcance, cronograma, costo, calidad, riesgos y SST, con al menos una alternativa.', responsable: 'Director de proyecto e Ingeniero de diseño', plazo: '3 días hábiles' },
          { id: 'r3', paso: '3. Decidir', actividad: 'Decisión según el nivel de autoridad, registrada en el acta del comité.', responsable: 'Aprobador según el nivel', plazo: 'Según el nivel' },
          { id: 'r4', paso: '4. Actualizar', actividad: 'Nueva revisión de planos y memoria, cronograma, presupuesto y línea base (LB1, LB2…).', responsable: 'Director de proyecto', plazo: '2 días hábiles' },
          { id: 'r5', paso: '5. Comunicar', actividad: 'Comunicación al solicitante y presentación en el comité de obra.', responsable: 'Director de proyecto', plazo: '1 día hábil' },
          { id: 'r6', paso: '6. Verificar', actividad: 'Inspección del cambio implementado y firma del cliente en el acta de aceptación.', responsable: 'Supervisor de montaje e Interventoría del cliente', plazo: 'Al implementar' },
        ],
        cambiosEmergencia: 'Ante una condición insegura (viento, anclaje deficiente, daño del andamio) el director de proyecto o el coordinador SST ordenan la acción inmediata. Se documenta dentro de las 24 horas siguientes con una solicitud de cambio, que el CCB ratifica en su siguiente sesión.',
        herramientasCambios: 'Formato de solicitud de cambio, registro de cambios, control de revisiones de planos y líneas base en el gestor (LB0, LB1…). Las decisiones quedan en el acta del comité y, si afectan el contrato, en la orden de cambio firmada por el cliente.',
        comunicacionCambios: 'El director comunica la decisión al solicitante en un día hábil y presenta en el comité semanal los cambios aprobados con su efecto en cronograma y costo.',
      },
    },

    {
      id: 'plan-gestion-configuracion',
      name: 'Plan de gestión de la configuración',
      abbr: 'PCFG',
      area: 'integracion', group: 'planificacion', process: '4.2', processes: ['4.2'],
      kind: 'plan', multiple: false,
      purpose: 'Define qué elementos del proyecto se controlan (documentos, planos, líneas base, equipos), cómo se identifican, cómo se controlan sus versiones y cómo se audita que estén vigentes.',
      tips: [
        'Usa la convención de revisiones de planos: borradores A, B, C; emisiones aprobadas 0, 1, 2. Así se distingue de inmediato lo que está aprobado.',
        'En obra solo debe estar la última revisión aprobada de planos y memoria de cálculo; marca como obsoletas y retira las anteriores.',
        'Lleva trazabilidad de las piezas críticas (bases, gatos, anclajes, plataformas) desde la remisión hasta la inspección de retorno: soporta el cobro de faltantes y daños.',
      ],
      sections: [
        {
          id: 'enfoque', title: 'Enfoque',
          fields: [
            { key: 'objetivoConfiguracion', label: 'Objetivo', type: 'textarea', hint: 'Qué se busca asegurar con el control de la configuración en este proyecto.' },
            { key: 'responsableConfiguracion', label: 'Responsable de la configuración', type: 'text', hint: 'Quién administra los elementos de configuración y su repositorio.' },
            { key: 'repositorio', label: 'Repositorio', type: 'text', hint: 'Dónde se guardan las versiones vigentes y el historial (carpeta, servidor, copia controlada en obra).' },
          ],
        },
        {
          id: 'elementos', title: 'Elementos de configuración',
          fields: [
            {
              key: 'elementos', label: 'Elementos de configuración', type: 'table', addLabel: 'Agregar elemento',
              hint: 'Elementos cuya versión o estado debe controlarse, con su código y nivel de control.',
              columns: [
                { key: 'elemento', label: 'Elemento', type: 'text', width: 260 },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_ELEMENTO_CONFIG },
                { key: 'codigo', label: 'Código o identificación', type: 'text', width: 180 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 160 },
                { key: 'control', label: 'Nivel de control', type: 'select', options: NIVEL_CONTROL_CONFIG },
              ],
              defaultRows: [
                { elemento: 'Acta de constitución del proyecto', tipo: 'Documento de gestión', control: 'Control de cambios formal' },
                { elemento: 'Plan para la dirección del proyecto', tipo: 'Documento de gestión', control: 'Control de cambios formal' },
                { elemento: 'Línea base del alcance (enunciado, EDT y diccionario)', tipo: 'Línea base', control: 'Control de cambios formal' },
                { elemento: 'Cronograma y línea base del cronograma', tipo: 'Línea base', control: 'Control de cambios formal' },
                { elemento: 'Presupuesto y línea base de costos', tipo: 'Línea base', control: 'Control de cambios formal' },
                { elemento: 'Planos de montaje', tipo: 'Plano o diseño', control: 'Control de cambios formal' },
                { elemento: 'Memoria de cálculo', tipo: 'Plano o diseño', control: 'Control de cambios formal' },
                { elemento: 'Procedimiento de montaje y desmontaje', tipo: 'Procedimiento', control: 'Control de versiones' },
                { elemento: 'Plan de rescate en alturas', tipo: 'Procedimiento', control: 'Control de versiones' },
                { elemento: 'Listas de chequeo de inspección', tipo: 'Registro', control: 'Solo registro' },
                { elemento: 'Remisiones y actas de entrega de equipo', tipo: 'Equipo o inventario', control: 'Solo registro' },
              ],
            },
          ],
        },
        {
          id: 'versiones', title: 'Identificación y control de versiones',
          fields: [
            { key: 'convencionCodigos', label: 'Convención de códigos', type: 'textarea', hint: 'Estructura del código de cada documento: proyecto, disciplina, tipo y consecutivo.' },
            { key: 'convencionRevisiones', label: 'Convención de revisiones', type: 'textarea', default: 'Borradores A, B, C…; emisiones aprobadas 0, 1, 2…; borradores sobre la emisión n: (n+1)A, (n+1)B…', hint: 'Cómo se numeran los borradores y las emisiones aprobadas.' },
            { key: 'aprobacionVersiones', label: 'Elaboración, revisión y aprobación', type: 'textarea', hint: 'Quién elabora, revisa y aprueba cada tipo de elemento y cómo se distribuye la versión vigente.' },
          ],
        },
        {
          id: 'estado', title: 'Contabilidad del estado y auditorías',
          fields: [
            { key: 'contabilidadEstado', label: 'Contabilidad del estado', type: 'textarea', hint: 'Cómo se registra y consulta la versión vigente, el estado y el historial de cada elemento.' },
            { key: 'frecuenciaAuditoria', label: 'Frecuencia de verificación', type: 'select', options: FRECUENCIA, hint: 'Cada cuánto se verifica que lo usado en obra coincida con lo aprobado.' },
            { key: 'auditorias', label: 'Verificación y auditoría de la configuración', type: 'textarea', hint: 'Qué se verifica, quién lo hace y qué pasa con las diferencias encontradas.' },
          ],
        },
      ],
      example: {
        objetivoConfiguracion: 'Asegurar que en obra se use siempre la última revisión aprobada de planos, memoria de cálculo y procedimientos, y que cada pieza de equipo despachada sea trazable hasta su retorno a bodega.',
        responsableConfiguracion: 'Ingeniero de diseño (documentos técnicos) y Almacén (equipo)',
        repositorio: 'Carpeta compartida del proyecto PRY-2026-014 en el servidor documental de la empresa, con copia controlada impresa en la oficina de obra.',
        elementos: [
          { id: 'r1', elemento: 'Acta de constitución del proyecto', tipo: 'Documento de gestión', codigo: 'PRY-2026-014-ACT', responsable: 'Director de proyecto', control: 'Control de cambios formal' },
          { id: 'r2', elemento: 'Plan para la dirección del proyecto', tipo: 'Documento de gestión', codigo: 'PRY-2026-014-PDP', responsable: 'Director de proyecto', control: 'Control de cambios formal' },
          { id: 'r3', elemento: 'Línea base del alcance (enunciado, EDT y diccionario)', tipo: 'Línea base', codigo: 'LB del alcance', responsable: 'Director de proyecto', control: 'Control de cambios formal' },
          { id: 'r4', elemento: 'Cronograma y línea base del cronograma', tipo: 'Línea base', codigo: 'LB del cronograma', responsable: 'Director de proyecto', control: 'Control de cambios formal' },
          { id: 'r5', elemento: 'Presupuesto y línea base de costos', tipo: 'Línea base', codigo: 'LB de costos', responsable: 'Director de proyecto', control: 'Control de cambios formal' },
          { id: 'r6', elemento: 'Planos de montaje PL-001 a PL-006', tipo: 'Plano o diseño', codigo: 'PRY-2026-014-ING-PL-###', responsable: 'Ingeniero de diseño', control: 'Control de cambios formal' },
          { id: 'r7', elemento: 'Memoria de cálculo MC-001', tipo: 'Plano o diseño', codigo: 'PRY-2026-014-ING-MC-001', responsable: 'Ingeniero de diseño', control: 'Control de cambios formal' },
          { id: 'r8', elemento: 'Procedimiento de montaje y desmontaje', tipo: 'Procedimiento', codigo: 'PRY-2026-014-SST-PR-001', responsable: 'Coordinador SST (HSE)', control: 'Control de versiones' },
          { id: 'r9', elemento: 'Plan de rescate en alturas', tipo: 'Procedimiento', codigo: 'PRY-2026-014-SST-PR-002', responsable: 'Coordinador SST (HSE)', control: 'Control de versiones' },
          { id: 'r10', elemento: 'Listas de chequeo de inspección', tipo: 'Registro', codigo: 'LCI-###', responsable: 'Supervisor de montaje', control: 'Solo registro' },
          { id: 'r11', elemento: 'Remisiones de despacho y de retorno', tipo: 'Equipo o inventario', codigo: 'REM-###', responsable: 'Almacén', control: 'Solo registro' },
        ],
        convencionCodigos: 'Código del proyecto + disciplina (GES gestión, ING ingeniería, SST seguridad, LOG logística) + tipo (PL plano, MC memoria, PR procedimiento, IN informe) + consecutivo de tres dígitos. Ejemplo: PRY-2026-014-ING-PL-003.',
        convencionRevisiones: 'Borradores A, B, C…; emisiones aprobadas 0, 1, 2…; borradores sobre la emisión n: (n+1)A, (n+1)B…',
        aprobacionVersiones: 'Elabora el ingeniero de diseño, revisa el director de proyecto y aprueba la interventoría para planos y memoria; los procedimientos de SST los aprueba el coordinador SST. Solo las emisiones aprobadas se envían a obra; la copia anterior se marca como obsoleta y se retira.',
        contabilidadEstado: 'El listado maestro de documentos del gestor muestra para cada elemento su revisión vigente, su estado (borrador, en revisión, aprobado u obsoleto), la fecha y el responsable. Almacén lleva el saldo de piezas en obra por referencia, conciliado con las remisiones.',
        frecuenciaAuditoria: 'Mensual',
        auditorias: 'Cada mes el director verifica que las copias en obra coincidan con la revisión vigente y que el saldo de equipo en obra coincida con las remisiones. Antes del cierre se hace una auditoría final de documentos y del inventario de retorno; las diferencias se registran como incidentes.',
      },
    },

    /* ================================================================== INTEGRACIÓN · EJECUCIÓN (4.3, 4.4) */
    {
      id: 'entregables',
      name: 'Registro de entregables',
      abbr: 'ENT',
      area: 'integracion', group: 'ejecucion', process: '4.3', processes: ['4.3', '5.5', '8.3'],
      kind: 'registro', multiple: false,
      purpose: 'Controla cada entregable desde su producción hasta la aceptación formal: paquete de la EDT, criterios de aceptación, fechas y estado (pendiente, en revisión, verificado, aceptado o rechazado).',
      tips: [
        'Un entregable pasa a "Verificado" tras el control de calidad interno (8.3) y a "Aceptado" solo con la firma del cliente o de la interventoría (5.5).',
        'Asocia cada entregable aceptado a un acta parcial de obra: es el soporte para facturar el periodo.',
        'Si el cliente rechaza un entregable, registra las observaciones en el acta y vuelve a ponerlo en "Pendiente" con una fecha nueva.',
      ],
      sections: [
        {
          id: 'registro', title: 'Entregables',
          fields: [
            {
              key: 'entregables', label: 'Registro de entregables', type: 'table', addLabel: 'Agregar entregable',
              hint: 'Un entregable por fila, enlazado al paquete de trabajo de la EDT (p. ej. "1.4 Montaje").',
              columns: [
                { key: 'id', label: 'Código', type: 'text', width: 70, hint: 'Consecutivo, p. ej. E-11.' },
                { key: 'entregable', label: 'Entregable', type: 'textarea', width: 240 },
                { key: 'paqueteEdt', label: 'Paquete de la EDT', type: 'text', width: 150 },
                { key: 'criterios', label: 'Criterios de aceptación', type: 'textarea', width: 260 },
                { key: 'fechaPrevista', label: 'Fecha prevista', type: 'date' },
                { key: 'fechaEntrega', label: 'Fecha de entrega', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_ENTREGABLE, default: 'Pendiente' },
                { key: 'aceptadoPor', label: 'Aceptado por', type: 'text', width: 170 },
              ],
            },
          ],
        },
        {
          id: 'aceptacion', title: 'Verificación y aceptación',
          fields: [
            { key: 'procedimientoAceptacion', label: 'Procedimiento', type: 'textarea', hint: 'Pasos desde la verificación interna hasta la firma de aceptación y qué ocurre si el entregable se rechaza.' },
            { key: 'responsableVerificacion', label: 'Responsable de la verificación interna', type: 'text', hint: 'Quién verifica el entregable antes de presentarlo al cliente.' },
          ],
        },
      ],
      example: {
        entregables: [
          { id: 'E-01', entregable: 'Levantamiento topográfico y de fachada de la Torre 2', paqueteEdt: '1.2 Ingeniería', criterios: 'Planos de levantamiento con cotas de losas, voladizos y vanos, revisados por el ingeniero de diseño.', fechaPrevista: '2026-08-08', fechaEntrega: '2026-08-08', estado: 'Aceptado', aceptadoPor: 'Director de obra del cliente' },
          { id: 'E-02', entregable: 'Diseño del andamio, planos de montaje y memoria de cálculo', paqueteEdt: '1.2 Ingeniería', criterios: 'Memoria firmada por ingeniero civil con matrícula vigente; plataformas para 200 kg/m²; aprobación escrita de la interventoría.', fechaPrevista: '2026-08-21', fechaEntrega: '2026-08-21', estado: 'Aceptado', aceptadoPor: 'Interventoría del cliente' },
          { id: 'E-03', entregable: 'Plan de montaje y desmontaje y plan de rescate en alturas', paqueteEdt: '1.2 Ingeniería', criterios: 'Conforme a la Resolución 4272 de 2021; revisado por el coordinador SST y la ARL.', fechaPrevista: '2026-08-21', fechaEntrega: '2026-08-22', estado: 'Aceptado', aceptadoPor: 'Interventoría del cliente' },
          { id: 'E-04', entregable: 'Equipo alistado, inspeccionado y despachado a obra', paqueteEdt: '1.3 Suministro y logística', criterios: 'Remisiones firmadas por el residente del cliente; listas de chequeo de piezas sin no conformidades abiertas.', fechaPrevista: '2026-08-29', fechaEntrega: '2026-08-29', estado: 'Aceptado', aceptadoPor: 'Director de obra del cliente' },
          { id: 'E-05', entregable: 'Andamio montado y liberado, niveles 1 a 5', paqueteEdt: '1.4 Montaje', criterios: 'Listas de chequeo aprobadas, tarjeta verde por nivel y acta de aceptación firmada.', fechaPrevista: '2026-09-19', fechaEntrega: '2026-09-21', estado: 'Aceptado', aceptadoPor: 'Director de obra del cliente' },
          { id: 'E-06', entregable: 'Andamio montado y liberado, niveles 6 a 10', paqueteEdt: '1.4 Montaje', criterios: 'Listas de chequeo aprobadas, tarjeta verde por nivel y acta de aceptación firmada.', fechaPrevista: '2026-10-10', estado: 'Pendiente' },
          { id: 'E-07', entregable: 'Andamio montado y liberado, niveles 11 a 15', paqueteEdt: '1.4 Montaje', criterios: 'Listas de chequeo aprobadas, tarjeta verde por nivel y acta de aceptación firmada.', fechaPrevista: '2026-10-31', estado: 'Pendiente' },
          { id: 'E-08', entregable: 'Accesos, protecciones perimetrales y plataforma de descargue del piso 8 (CC-002)', paqueteEdt: '1.4 Montaje', criterios: 'Torre de escaleras completa; barandas, rodapiés y malla continuos; prueba de carga de la plataforma de descargue.', fechaPrevista: '2026-11-07', estado: 'Pendiente' },
          { id: 'E-09', entregable: 'Certificado de inspección del andamio completo', paqueteEdt: '1.5 Certificación y operación', criterios: 'Certificado firmado por persona competente en trabajo en alturas, sin hallazgos abiertos.', fechaPrevista: '2026-11-12', estado: 'Pendiente' },
          { id: 'E-10', entregable: 'Informe mensual de inspección y mantenimiento en obra (septiembre)', paqueteEdt: '1.5 Certificación y operación', criterios: 'Registros de inspección semanal, novedades y acciones correctivas del mes.', fechaPrevista: '2026-09-30', fechaEntrega: '2026-10-01', estado: 'En revisión' },
          { id: 'E-11', entregable: 'Desmontaje, retiro y transporte de retorno', paqueteEdt: '1.6 Desmontaje y retiro', criterios: 'Frente entregado libre de equipo; remisiones de retorno firmadas.', fechaPrevista: '2026-12-12', estado: 'Pendiente' },
          { id: 'E-12', entregable: 'Acta de inspección de retorno y liquidación de faltantes y daños', paqueteEdt: '1.6 Desmontaje y retiro', criterios: 'Conteo y clasificación en bodega firmados por almacén y por el cliente.', fechaPrevista: '2026-12-16', estado: 'Pendiente' },
        ],
        procedimientoAceptacion: 'Verificación interna con lista de chequeo y liberación de la persona competente (estado Verificado); recorrido con el cliente y la interventoría; firma del acta de aceptación de entregables (estado Aceptado). Un entregable rechazado vuelve a Pendiente con las acciones registradas en el acta.',
        responsableVerificacion: 'Supervisor de montaje y persona competente en trabajo en alturas',
      },
    },

    {
      id: 'registro-incidentes',
      name: 'Registro de incidentes',
      abbr: 'RINC',
      area: 'integracion', group: 'ejecucion', process: '4.3', processes: ['4.3', '4.5', '9.5', '10.3', '13.3'],
      kind: 'registro', multiple: false,
      purpose: 'Registra los problemas que ya ocurrieron y afectan el proyecto, con su responsable, fecha objetivo y solución, para hacerles seguimiento hasta cerrarlos.',
      tips: [
        'Un incidente es algo que ya ocurrió; si todavía no ha ocurrido, regístralo como riesgo.',
        'Todo accidente de trabajo se reporta además a la ARL y a la EPS dentro de los dos días hábiles siguientes; accidentes e incidentes se investigan dentro de los 15 días siguientes según la Resolución 1401 de 2007.',
        'Revisa los incidentes abiertos en el comité semanal y escala al patrocinador los de prioridad alta que superen su fecha objetivo.',
      ],
      sections: [
        {
          id: 'registro', title: 'Incidentes',
          fields: [
            {
              key: 'incidentes', label: 'Registro de incidentes', type: 'table', addLabel: 'Agregar incidente',
              hint: 'Un incidente por fila con código consecutivo (INC-001). Describe el hecho, no la opinión.',
              columns: [
                { key: 'id', label: 'Código', type: 'text', width: 80, hint: 'Consecutivo, p. ej. INC-006.' },
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 280 },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_INCIDENTE },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: PRIORIDAD },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 160 },
                { key: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_INCIDENTE, default: 'Abierto' },
                { key: 'solucion', label: 'Solución o acción', type: 'textarea', width: 280 },
              ],
            },
          ],
        },
        {
          id: 'gestion', title: 'Gestión del registro',
          fields: [
            { key: 'escalamiento', label: 'Criterios de escalamiento', type: 'textarea', hint: 'Cuándo y a quién se escala un incidente según prioridad, antigüedad o tipo.' },
            { key: 'revisionIncidentes', label: 'Frecuencia de revisión', type: 'select', options: FRECUENCIA, hint: 'Cada cuánto se revisan los incidentes abiertos.' },
          ],
        },
      ],
      example: {
        incidentes: [
          { id: 'INC-001', fecha: '2026-08-25', descripcion: 'Faltan 180 diagonales de 2,57 m en bodega para completar el segundo envío; el inventario del sistema no coincide con el conteo físico.', tipo: 'Logístico', prioridad: 'Alta', responsable: 'Coordinador logístico', fechaObjetivo: '2026-08-28', estado: 'Cerrado', solucion: 'Subarriendo de 180 diagonales a un proveedor aliado, recibidas el 27 de agosto; ajuste del inventario en el sistema.' },
          { id: 'INC-002', fecha: '2026-09-08', descripcion: 'Lluvias intensas suspendieron el montaje de los niveles 3 y 4 el 8 y el 9 de septiembre.', tipo: 'Clima y entorno', prioridad: 'Media', responsable: 'Supervisor de montaje', fechaObjetivo: '2026-09-19', estado: 'Cerrado', solucion: 'Jornada extendida de 10 horas en días secos del 10 al 18 de septiembre; el hito de los niveles 1 a 5 se cumplió el 21 de septiembre, con 1 día hábil de atraso.' },
          { id: 'INC-003', fecha: '2026-09-15', descripcion: 'La grúa torre del cliente no está disponible en el horario acordado para izar material desde el nivel 6: promedio de 2,5 horas diarias frente a 4 horas previstas.', tipo: 'Cliente y obra', prioridad: 'Alta', responsable: 'Director de proyecto', fechaObjetivo: '2026-10-09', estado: 'En curso', solucion: 'Ventana fija de grúa de 7:00 a 9:00 acordada en el comité de obra del 1 de octubre; el residente mide el cumplimiento diario y, si la ventana no se respeta, se escala al patrocinador y al director de obra del cliente.' },
          { id: 'INC-004', fecha: '2026-09-24', descripcion: 'La interventoría encontró rodapiés retirados por el contratista de mampostería del cliente en el nivel 4 y suspendió el uso de ese nivel.', tipo: 'Seguridad y salud en el trabajo', prioridad: 'Alta', responsable: 'Coordinador SST (HSE)', fechaObjetivo: '2026-09-26', estado: 'Cerrado', solucion: 'Reposición de rodapiés en 24 horas, nueva liberación por persona competente y comunicación escrita al cliente sobre la prohibición de modificar el andamio.' },
          { id: 'INC-005', fecha: '2026-09-30', descripcion: 'La factura de alquiler y montaje de agosto venció sin pago del cliente.', tipo: 'Contractual y pagos', prioridad: 'Media', responsable: 'Facturación y cartera', fechaObjetivo: '2026-10-15', estado: 'Abierto', solucion: 'Gestión de cobro con la dirección financiera del cliente; si no se paga al 15 de octubre se escala al patrocinador según el contrato.' },
        ],
        escalamiento: 'Un incidente de prioridad alta sin solución en 3 días hábiles se escala al patrocinador. Los incidentes de SST se reportan de inmediato al coordinador SST y, si hay lesionados, a la ARL dentro de los dos días hábiles siguientes.',
        revisionIncidentes: 'Semanal',
      },
    },

    {
      id: 'registro-lecciones',
      name: 'Registro de lecciones aprendidas',
      abbr: 'RLEC',
      area: 'integracion', group: 'ejecucion', process: '4.4', processes: ['4.4', '4.7'],
      kind: 'registro', multiple: false,
      purpose: 'Captura durante todo el proyecto lo que funcionó y lo que no, con recomendaciones concretas para el resto del proyecto y para proyectos futuros.',
      tips: [
        'Registra las lecciones durante el proyecto, no solo al cierre: al final ya se olvidaron los detalles.',
        'Escribe la recomendación como una acción concreta que otro director pueda aplicar (qué hacer, cuándo y quién).',
        'Al cierre, transfiere las lecciones a los activos de los procesos de la organización: plantillas de oferta, listas de chequeo y procedimientos.',
      ],
      sections: [
        {
          id: 'registro', title: 'Lecciones',
          fields: [
            {
              key: 'lecciones', label: 'Registro de lecciones aprendidas', type: 'table', addLabel: 'Agregar lección',
              hint: 'Una lección por fila: situación, impacto y recomendación accionable.',
              columns: [
                { key: 'id', label: 'Código', type: 'text', width: 80, hint: 'Consecutivo, p. ej. LA-006.' },
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'area', label: 'Área de conocimiento', type: 'select', options: AREAS_CONOCIMIENTO },
                { key: 'situacion', label: 'Situación', type: 'textarea', width: 280 },
                { key: 'impacto', label: 'Impacto', type: 'select', options: IMPACTO_LECCION },
                { key: 'recomendacion', label: 'Recomendación', type: 'textarea', width: 280 },
                { key: 'registradoPor', label: 'Registrado por', type: 'text', width: 160 },
              ],
            },
          ],
        },
        {
          id: 'transferencia', title: 'Captura y transferencia',
          fields: [
            { key: 'momentosCaptura', label: 'Momentos de captura', type: 'textarea', hint: 'En qué reuniones o hitos se recogen las lecciones.' },
            { key: 'repositorioLecciones', label: 'Repositorio de la organización', type: 'text', hint: 'Dónde quedan las lecciones al cerrar el proyecto para que otros las consulten.' },
            { key: 'difusion', label: 'Difusión e incorporación', type: 'textarea', hint: 'Cómo se comparten las lecciones y en qué plantillas o procedimientos se incorporan.' },
          ],
        },
      ],
      example: {
        lecciones: [
          { id: 'LA-001', fecha: '2026-08-28', area: 'Recursos', situacion: 'El sistema mostraba 1.200 diagonales de 2,57 m disponibles, pero en el conteo físico faltaban 180; el subarriendo urgente costó $ 3,9 M adicionales.', impacto: 'Negativo', recomendacion: 'Hacer conteo físico ciego de piezas críticas 15 días antes del despacho y bloquear en el sistema las piezas reservadas para el proyecto.', registradoPor: 'Coordinador logístico' },
          { id: 'LA-002', fecha: '2026-09-19', area: 'Cronograma', situacion: 'La jornada extendida de 10 horas en días secos, acordada desde el inicio con la cuadrilla y la interventoría, recuperó uno de los dos días perdidos por lluvia.', impacto: 'Positivo', recomendacion: 'Pactar desde la oferta la jornada extendida para temporada de lluvias y presupuestar las horas extra en la reserva para contingencias.', registradoPor: 'Supervisor de montaje' },
          { id: 'LA-003', fecha: '2026-09-26', area: 'Calidad', situacion: 'La interventoría encontró rodapiés retirados por un contratista del cliente en un nivel ya aceptado.', impacto: 'Negativo', recomendacion: 'Incluir en el acta de aceptación la prohibición de modificar el andamio y hacer una ronda diaria de verificación de protecciones en los niveles liberados.', registradoPor: 'Coordinador SST (HSE)' },
          { id: 'LA-004', fecha: '2026-09-30', area: 'Interesados', situacion: 'La grúa del cliente estuvo disponible en promedio 2,5 horas diarias frente a 4 horas supuestas, sin compromiso contractual que lo respaldara.', impacto: 'Negativo', recomendacion: 'Pactar en el contrato una ventana diaria de grúa garantizada y la compensación por tiempos de espera.', registradoPor: 'Director de proyecto' },
          { id: 'LA-005', fecha: '2026-10-01', area: 'Integración', situacion: 'Los umbrales del plan de gestión de cambios permitieron decidir el CC-002 en 4 días hábiles, con orden de cambio del cliente.', impacto: 'Positivo', recomendacion: 'Mantener umbrales en pesos y días en todos los planes de cambios y llevar el análisis de impacto prediligenciado al comité.', registradoPor: 'Director de proyecto' },
        ],
        momentosCaptura: 'En el comité semanal (lecciones de la semana), al terminar cada fase y en la reunión de cierre con el cliente.',
        repositorioLecciones: 'Base de lecciones aprendidas de la empresa, carpeta Gestión de proyectos del servidor documental.',
        difusion: 'Las lecciones con recomendación aplicable se presentan en la reunión mensual de directores y se incorporan a las plantillas de oferta, a las listas de chequeo de inspección y a los procedimientos de montaje.',
      },
    },

    /* ================================================================== INTEGRACIÓN · MONITOREO Y CONTROL (4.5, 4.6) */
    {
      id: 'informe-desempeno',
      name: 'Informe de desempeño del trabajo',
      abbr: 'IDT',
      area: 'integracion', group: 'monitoreo', process: '4.5', processes: ['4.5'],
      kind: 'informe', multiple: true,
      purpose: 'Presenta a los interesados el estado del proyecto en un periodo: avance frente al plan, valor ganado, pronósticos, riesgos, incidentes, cambios y próximos pasos.',
      tips: [
        'Usa la misma fecha de corte para el avance físico, los costos reales y el valor ganado; si no, los índices no son comparables.',
        'Concilia el costo real con contabilidad (nómina causada, subarriendos, transporte, horas extra) antes de calcular el CPI.',
        'Acompaña cada índice con su causa y la acción correctiva; un SPI sin explicación no ayuda a decidir.',
        'Registra una fila de valor ganado por cada corte para ver la tendencia; la tabla calcula SPI, CPI, EAC, ETC, VAC y TCPI.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación del informe',
          fields: [
            { key: 'numeroInforme', label: 'Número o nombre del informe', type: 'text', required: true, hint: 'Ejemplo: Informe mensual No. 2 — septiembre de 2026.' },
            { key: 'periodoInicio', label: 'Inicio del periodo', type: 'date', hint: 'Primer día del periodo que cubre el informe (el día siguiente al corte del informe anterior).' },
            { key: 'fechaCorte', label: 'Fecha de corte', type: 'date', required: true, hint: 'Fecha a la que se miden avance, costos y valor ganado.' },
            { key: 'destinatarios', label: 'Destinatarios', type: 'text', hint: 'Quiénes reciben el informe (patrocinador, cliente, interventoría).' },
            { key: 'estadoGeneral', label: 'Estado general', type: 'select', options: ESTADO_GENERAL, hint: 'Semáforo global según los umbrales del plan para la dirección.' },
          ],
        },
        {
          id: 'resumen', title: 'Resumen ejecutivo',
          fields: [
            { key: 'resumen', label: 'Resumen', type: 'textarea', hint: 'En un párrafo: dónde está el proyecto, qué cambió en el periodo y qué decisión se necesita.' },
            { key: 'logros', label: 'Logros del periodo', type: 'list', hint: 'Entregables aceptados, hitos cumplidos y problemas resueltos.' },
          ],
        },
        {
          id: 'avance', title: 'Avance frente al plan',
          fields: [
            { key: 'avancePlanificado', label: 'Avance planificado (%)', type: 'pct', hint: 'PV ÷ BAC × 100 a la fecha de corte.' },
            { key: 'avanceReal', label: 'Avance real (%)', type: 'pct', hint: 'EV ÷ BAC × 100 a la fecha de corte.' },
            {
              key: 'hitos', label: 'Hitos', type: 'table', addLabel: 'Agregar hito',
              hint: 'Fecha de la línea base frente a la real o pronosticada de cada hito.',
              columns: [
                { key: 'hito', label: 'Hito', type: 'text', width: 240 },
                { key: 'fechaBase', label: 'Fecha línea base', type: 'date' },
                { key: 'fechaPronostico', label: 'Fecha real o pronosticada', type: 'date' },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_HITO },
                { key: 'comentario', label: 'Comentario', type: 'textarea', width: 220 },
              ],
            },
          ],
        },
        {
          id: 'valorGanado', title: 'Valor ganado y pronósticos',
          description: 'SV = EV − PV · CV = EV − AC · SPI = EV ÷ PV · CPI = EV ÷ AC · EAC = BAC ÷ CPI · ETC = EAC − AC · VAC = BAC − EAC · TCPI = (BAC − EV) ÷ (BAC − AC).',
          fields: [
            {
              key: 'valorGanado', label: 'Indicadores de valor ganado por corte', type: 'table', addLabel: 'Agregar corte',
              hint: 'Una fila por fecha de corte. Ingresa BAC, PV, EV y AC; los indicadores se calculan solos.',
              columns: [
                { key: 'corte', label: 'Corte', type: 'date' },
                { key: 'bac', label: 'BAC', type: 'money', width: 130, hint: 'Presupuesto hasta la conclusión.' },
                { key: 'pv', label: 'PV', type: 'money', width: 130, hint: 'Valor planificado.' },
                { key: 'ev', label: 'EV', type: 'money', width: 130, hint: 'Valor ganado.' },
                { key: 'ac', label: 'AC', type: 'money', width: 130, hint: 'Costo real.' },
                { key: 'sv', label: 'SV', type: 'calc', calc: calcSv, format: fmtNum(0), hint: 'Variación del cronograma = EV − PV.' },
                { key: 'cv', label: 'CV', type: 'calc', calc: calcCv, format: fmtNum(0), hint: 'Variación del costo = EV − AC.' },
                { key: 'spi', label: 'SPI', type: 'calc', calc: calcSpi, format: fmtIdx, hint: 'Índice de desempeño del cronograma = EV ÷ PV.' },
                { key: 'cpi', label: 'CPI', type: 'calc', calc: calcCpi, format: fmtIdx, hint: 'Índice de desempeño del costo = EV ÷ AC.' },
                { key: 'eac', label: 'EAC', type: 'calc', calc: calcEac, format: fmtNum(0), hint: 'Estimación a la conclusión = BAC ÷ CPI.' },
                { key: 'etc', label: 'ETC', type: 'calc', calc: calcEtc, format: fmtNum(0), hint: 'Estimación hasta la conclusión = EAC − AC.' },
                { key: 'vac', label: 'VAC', type: 'calc', calc: calcVac, format: fmtNum(0), hint: 'Variación a la conclusión = BAC − EAC.' },
                { key: 'tcpi', label: 'TCPI', type: 'calc', calc: calcTcpi, format: fmtIdx, hint: 'Índice de desempeño del trabajo por completar = (BAC − EV) ÷ (BAC − AC).' },
              ],
            },
            { key: 'eacAdoptado', label: 'EAC adoptado para la gestión', type: 'money', hint: 'Pronóstico que adopta el director después de comparar las fórmulas (típica, atípica, compuesta) y el plan de recuperación.' },
            { key: 'fechaFinPronosticada', label: 'Fecha de fin pronosticada', type: 'date', hint: 'Fecha de terminación esperada con el desempeño actual y las acciones aprobadas.' },
            { key: 'analisisVariacion', label: 'Análisis de variaciones y acciones', type: 'textarea', hint: 'Causas de SV y CV, actividades que las generan y acciones correctivas o preventivas en curso.' },
          ],
        },
        {
          id: 'riesgos', title: 'Riesgos, incidentes y cambios',
          fields: [
            { key: 'riesgosPrincipales', label: 'Riesgos principales', type: 'textarea', hint: 'Riesgos de mayor puntuación, su tendencia y el estado de sus respuestas.' },
            { key: 'incidentesRelevantes', label: 'Incidentes', type: 'textarea', hint: 'Incidentes abiertos con su responsable y fecha objetivo; incidentes cerrados en el periodo.' },
            { key: 'cambiosPeriodo', label: 'Cambios del periodo', type: 'textarea', hint: 'Solicitudes registradas, aprobadas o rechazadas en el periodo y su efecto en las líneas base.' },
          ],
        },
        {
          id: 'proximos', title: 'Próximos pasos y decisiones',
          fields: [
            {
              key: 'proximosPasos', label: 'Próximos pasos', type: 'table', addLabel: 'Agregar acción',
              hint: 'Acciones del siguiente periodo con responsable y fecha.',
              columns: [
                { key: 'accion', label: 'Acción', type: 'textarea', width: 320 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 180 },
                { key: 'fecha', label: 'Fecha', type: 'date' },
              ],
            },
            { key: 'decisionesRequeridas', label: 'Decisiones requeridas', type: 'list', hint: 'Lo que el patrocinador o el cliente deben decidir y para cuándo.' },
          ],
        },
      ],
      example: {
        numeroInforme: 'Informe mensual No. 2 — septiembre de 2026',
        periodoInicio: '2026-08-29',
        fechaCorte: '2026-10-02',
        destinatarios: 'Gerencia General, Director de obra del cliente e Interventoría del cliente',
        estadoGeneral: 'Amarillo — requiere atención',
        resumen: 'Al corte del 2 de octubre de 2026 el proyecto lleva 43,7 % de avance frente a 47,0 % planificado (SPI 0,93) y gasta algo más de lo previsto por el trabajo realizado (CPI 0,97). Ingeniería, logística y el montaje de los niveles 1 a 5 están terminados y aceptados; el montaje de los niveles 6 a 10 va en 60 %, retrasado por la baja disponibilidad de la grúa del cliente y dos días de lluvia. El EAC se cubre con la reserva para contingencias remanente. Se aprobó el CC-002 y está en análisis el CC-003.',
        logros: [
          'Etapa 1 (niveles 1 a 5) aceptada el 21 de septiembre con el acta parcial No. 2.',
          'Cero accidentes con lesión en el periodo.',
          'CC-002 (plataforma de descargue del piso 8) decidido en 4 días hábiles, con orden de cambio del cliente.',
          'Hallazgo de la interventoría sobre rodapiés del nivel 4 cerrado en 48 horas.',
        ],
        avancePlanificado: 47.0,
        avanceReal: 43.7,
        hitos: [
          { id: 'r1', hito: 'Diseño y memoria aprobados por la interventoría', fechaBase: '2026-08-21', fechaPronostico: '2026-08-21', estado: 'Cumplido', comentario: 'Sin observaciones mayores.' },
          { id: 'r2', hito: 'Equipo despachado completo a obra', fechaBase: '2026-08-29', fechaPronostico: '2026-08-29', estado: 'Cumplido', comentario: 'Con subarriendo de diagonales (INC-001).' },
          { id: 'r3', hito: 'Niveles 1–5 montados y liberados', fechaBase: '2026-09-19', fechaPronostico: '2026-09-21', estado: 'Cumplido', comentario: 'Un día hábil de atraso por lluvias (INC-002).' },
          { id: 'r4', hito: 'Niveles 6–10 montados y liberados', fechaBase: '2026-10-10', fechaPronostico: '2026-10-16', estado: 'En riesgo', comentario: 'Avance de 60 %; depende de la ventana fija de grúa (INC-003).' },
          { id: 'r5', hito: 'Niveles 11–15, accesos y protecciones', fechaBase: '2026-11-07', fechaPronostico: '2026-11-12', estado: 'Pendiente', comentario: 'La segunda cuadrilla entra el 13 de octubre para que el atraso de la etapa 2 no se acumule.' },
          { id: 'r6', hito: 'Certificación del andamio completo', fechaBase: '2026-11-12', fechaPronostico: '2026-11-14', estado: 'Pendiente', comentario: 'Persona competente reservada.' },
          { id: 'r7', hito: 'Acta de cierre firmada', fechaBase: '2026-12-18', fechaPronostico: '2026-12-22', estado: 'Pendiente', comentario: 'Sujeto a la decisión sobre el CC-003.' },
        ],
        valorGanado: [
          { id: 'r1', corte: '2026-08-28', bac: 442200000, pv: 98300000, ev: 95400000, ac: 96900000 },
          { id: 'r2', corte: '2026-09-18', bac: 452000000, pv: 165800000, ev: 156900000, ac: 160700000 },
          { id: 'r3', corte: '2026-10-02', bac: 452000000, pv: 212400000, ev: 197500000, ac: 203600000 },
        ],
        eacAdoptado: 462700000,
        fechaFinPronosticada: '2026-12-22',
        analisisVariacion: 'SV de −$ 14,9 M: el atraso se concentra en el montaje de los niveles 6 a 10 (ruta crítica) por la grúa del cliente, disponible 2,5 horas diarias frente a 4 horas previstas, y por dos días de lluvia. CV de −$ 6,1 M: horas extra para recuperar el atraso y subarriendo de diagonales (INC-001). Se adopta un EAC de $ 462,7 M, entre el típico ($ 466,0 M) y el atípico ($ 458,1 M), porque el sobrecosto del subarriendo no se repetirá. Acciones: ventana fija de grúa de 7:00 a 9:00 y segunda cuadrilla para los niveles 11 a 15 desde el 13 de octubre.',
        riesgosPrincipales: 'Lluvias de octubre y noviembre que detienen el montaje (alto, en seguimiento con jornada extendida); disponibilidad de la grúa del cliente (alto, parcialmente materializado); retraso en pagos del cliente (medio, factura de agosto vencida); accidente en alturas (alto, controlado con permisos diarios, inspección y plan de rescate).',
        incidentesRelevantes: 'Abiertos: INC-003, grúa del cliente no disponible en el horario acordado (en curso, prioridad alta) e INC-005, factura de agosto vencida (abierto, prioridad media). Cerrados en el periodo: INC-002, lluvias, e INC-004, rodapiés retirados en el nivel 4.',
        cambiosPeriodo: 'CC-002, plataforma adicional de descargue en piso 8: aprobado el 11 de septiembre (+4 días en accesos y protecciones sin mover la fecha de fin; $ 9,8 M trasladados de la reserva para contingencias al BAC y facturados al cliente por orden de cambio). CC-003, extensión del alquiler 3 semanas por reprogramación de fachada: en análisis.',
        proximosPasos: [
          { id: 'r1', accion: 'Cumplir la ventana fija de grúa de 7:00 a 9:00 y medir su cumplimiento diario.', responsable: 'Residente de obra', fecha: '2026-10-09' },
          { id: 'r2', accion: 'Presentar el análisis de impacto del CC-003 al CCB ampliado.', responsable: 'Director de proyecto', fecha: '2026-10-09' },
          { id: 'r3', accion: 'Movilizar la segunda cuadrilla para los niveles 11 a 15.', responsable: 'Supervisor de montaje', fecha: '2026-10-13' },
          { id: 'r4', accion: 'Gestionar el cobro de la factura de agosto.', responsable: 'Facturación y cartera', fecha: '2026-10-15' },
        ],
        decisionesRequeridas: [
          'Aprobar horas extra de la cuadrilla hasta $ 6 M con cargo a la reserva para contingencias.',
          'Decidir el CC-003 antes del 16 de octubre para programar el desmontaje.',
        ],
      },
    },

    {
      id: 'solicitud-cambio',
      name: 'Solicitud de cambio',
      abbr: 'SCAM',
      area: 'integracion', group: 'monitoreo', process: '4.6', processes: ['4.3', '4.5', '4.6'],
      kind: 'formato', multiple: true,
      purpose: 'Formaliza una propuesta para modificar un documento, entregable o línea base: describe el cambio, lo justifica, analiza su impacto y registra la decisión del comité de control de cambios.',
      tips: [
        'Cuantifica el impacto en días hábiles y en pesos, aunque sea preliminar; sin cifras el comité no puede decidir.',
        'Adjunta el soporte que origina el cambio: correo del cliente, anotación en la bitácora de obra u orden de la interventoría.',
        'Si el cambio modifica el valor o el plazo del contrato, tramita el otrosí u orden de cambio y la ampliación de las pólizas antes de ejecutarlo.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación',
          fields: [
            { key: 'codigoCambio', label: 'Código del cambio', type: 'text', required: true, hint: 'Mismo código del registro de cambios, p. ej. CC-004.' },
            { key: 'fechaSolicitud', label: 'Fecha de la solicitud', type: 'date', required: true, hint: 'Fecha en que se recibe la solicitud.' },
            { key: 'solicitante', label: 'Solicitante', type: 'text', hint: 'Persona o rol que pide el cambio.' },
            { key: 'tipoCambio', label: 'Tipo de cambio', type: 'select', options: TIPO_CAMBIO, hint: 'Acción correctiva, acción preventiva, reparación de defecto o actualización.' },
            { key: 'prioridadCambio', label: 'Prioridad', type: 'select', options: PRIORIDAD, hint: 'Urgencia de la decisión.' },
            { key: 'elementosAfectados', label: 'Elementos de configuración afectados', type: 'list', hint: 'Documentos, planos, líneas base o entregables que cambiarían.' },
          ],
        },
        {
          id: 'descripcion', title: 'Descripción y justificación',
          fields: [
            { key: 'descripcionCambio', label: 'Descripción del cambio', type: 'textarea', required: true, hint: 'Qué se quiere cambiar, con cantidades y especificaciones.' },
            { key: 'justificacion', label: 'Justificación', type: 'textarea', required: true, hint: 'Por qué es necesario: causa, beneficio esperado o problema que resuelve.' },
            { key: 'consecuenciaNoHacer', label: 'Consecuencia de no hacerlo', type: 'textarea', hint: 'Qué pasa si el cambio no se aprueba.' },
          ],
        },
        {
          id: 'impacto', title: 'Análisis de impacto',
          fields: [
            { key: 'impactoAlcance', label: 'Impacto en el alcance', type: 'textarea', hint: 'Entregables o paquetes de la EDT que se agregan, modifican o eliminan.' },
            { key: 'diasCronograma', label: 'Impacto en el cronograma (días hábiles)', type: 'number', min: -365, max: 365, hint: 'Días hábiles que se agregan (positivo) o se ahorran (negativo) en las actividades afectadas.' },
            { key: 'impactoCronograma', label: 'Detalle del impacto en el cronograma', type: 'textarea', hint: 'Actividades afectadas y si el cambio mueve hitos o la fecha de fin.' },
            { key: 'valorCosto', label: 'Impacto en el costo', type: 'money', hint: 'Costo adicional (positivo) o ahorro (negativo) para el proyecto.' },
            { key: 'impactoCosto', label: 'Detalle del impacto en el costo', type: 'textarea', hint: 'Desglose del costo y fuente de financiación (reserva, orden de cambio, contrato).' },
            { key: 'impactoCalidad', label: 'Impacto en la calidad', type: 'textarea', hint: 'Requisitos, especificaciones o inspecciones que cambian.' },
            { key: 'impactoRiesgos', label: 'Impacto en los riesgos', type: 'textarea', hint: 'Riesgos nuevos, riesgos que cambian y sus respuestas.' },
            { key: 'impactoOtros', label: 'Otros impactos', type: 'textarea', hint: 'Recursos, seguridad y salud en el trabajo, adquisiciones, contrato y pólizas.' },
          ],
        },
        {
          id: 'alternativas', title: 'Alternativas',
          fields: [
            {
              key: 'alternativas', label: 'Alternativas evaluadas', type: 'table', addLabel: 'Agregar alternativa',
              hint: 'Incluye la opción de no hacer el cambio. Marca la recomendada.',
              columns: [
                { key: 'alternativa', label: 'Alternativa', type: 'text', width: 200 },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 260 },
                { key: 'costo', label: 'Costo', type: 'money', width: 130 },
                { key: 'dias', label: 'Días hábiles', type: 'number', min: -365, max: 365 },
                { key: 'recomendada', label: 'Recomendada', type: 'check' },
              ],
            },
          ],
        },
        {
          id: 'decision', title: 'Decisión del comité de control de cambios',
          fields: [
            { key: 'decision', label: 'Decisión o estado', type: 'select', options: ESTADO_CAMBIO, hint: 'Estado de la solicitud; debe coincidir con el registro de cambios.' },
            { key: 'fechaDecision', label: 'Fecha de la decisión', type: 'date', hint: 'Fecha en que el aprobador decide.' },
            { key: 'decisor', label: 'Decidido por', type: 'text', hint: 'Persona o comité que decide, según el nivel de autoridad.' },
            { key: 'nivelAutoridad', label: 'Nivel de autoridad aplicado', type: 'select', options: NIVEL_AUTORIDAD, hint: 'Nivel del plan de gestión de cambios que corresponde al impacto.' },
            { key: 'condiciones', label: 'Condiciones o razones de la decisión', type: 'textarea', hint: 'Condiciones de la aprobación o razones del rechazo o la postergación.' },
            { key: 'lineasBaseAfectadas', label: 'Líneas base que se actualizan', type: 'list', hint: 'Alcance, cronograma o costos, con la nueva versión.' },
            { key: 'implementacion', label: 'Plan de implementación', type: 'textarea', hint: 'Qué se actualiza, quién lo hace y cuándo; cómo se verificará.' },
          ],
        },
      ],
      example: {
        codigoCambio: 'CC-002',
        fechaSolicitud: '2026-09-07',
        solicitante: 'Director de obra del cliente',
        tipoCambio: 'Actualización',
        prioridadCambio: 'Alta',
        elementosAfectados: [
          'Planos de montaje (nueva revisión 1)',
          'Memoria de cálculo (anexo de la plataforma de descargue)',
          'Enunciado del alcance y EDT (1.4 Montaje)',
          'Cronograma y presupuesto (línea base LB1)',
        ],
        descripcionCambio: 'Diseñar, suministrar y montar una plataforma voladiza de descargue de 2,57 × 3,07 m en el piso 8, con barandas, rodapiés y puerta de carga, para recibir el material de fachada izado con la grúa del cliente.',
        justificacion: 'El cliente reprogramó la fachada para trabajar en paralelo en los pisos 6 a 10. Sin un punto de descargue en el piso 8, el material sube por la torre de escaleras, lo que aumenta la manipulación manual y el riesgo de caída de objetos.',
        consecuenciaNoHacer: 'Menor rendimiento de la fachada del cliente, mayor exposición de su personal a cargas manuales en alturas y posibles reclamaciones por demoras atribuidas al andamio.',
        impactoAlcance: 'Nuevo elemento en accesos y protecciones (1.4 Montaje): plataforma de descargue con su diseño, montaje, inspección y desmontaje.',
        diasCronograma: 4,
        impactoCronograma: 'Agrega 4 días hábiles a la actividad de accesos y protecciones; no mueve la fecha de fin porque esa ruta tiene 6 días de holgura total.',
        valorCosto: 9800000,
        impactoCosto: 'Ingeniería $ 1,2 M; ménsulas y plataformas adicionales $ 3,1 M; montaje y desmontaje $ 4,6 M; inspección $ 0,9 M. Se trasladan de la reserva para contingencias al BAC y se facturan al cliente por $ 12,6 M antes de IVA mediante orden de cambio.',
        impactoCalidad: 'Requiere un anexo de la memoria de cálculo para carga de servicio de 600 kg/m² en la plataforma y anclajes adicionales a la losa del piso 8, verificados por la interventoría.',
        impactoRiesgos: 'Nuevo riesgo de sobrecarga de la plataforma: se responde con señalización de carga máxima, inspección diaria y prohibición de acopio. Reduce el riesgo de caída de objetos durante el transporte manual de material.',
        impactoOtros: 'Requiere orden de cambio del cliente y ajuste del valor asegurado de la póliza de cumplimiento. Lo ejecuta la cuadrilla asignada, sin personal adicional.',
        alternativas: [
          { id: 'r1', alternativa: 'Plataforma voladiza en el piso 8', descripcion: 'Plataforma de 2,57 × 3,07 m anclada a la losa, integrada al andamio.', costo: 9800000, dias: 4, recomendada: true },
          { id: 'r2', alternativa: 'Montacargas de cremallera adicional', descripcion: 'Alquiler a un tercero de un montacargas adosado a la fachada.', costo: 31500000, dias: 8, recomendada: false },
          { id: 'r3', alternativa: 'No hacer el cambio', descripcion: 'El material sube por la torre de escaleras.', costo: 0, dias: 0, recomendada: false },
        ],
        decision: 'Aprobada',
        fechaDecision: '2026-09-11',
        decisor: CCB_AMPLIADO,
        nivelAutoridad: 'Nivel 3',
        condiciones: 'Ejecutar después de liberar el nivel 8; la plataforma no se usa hasta tener la inspección de la persona competente y el visto bueno de la interventoría; el cliente emite la orden de cambio antes del montaje.',
        lineasBaseAfectadas: ['Línea base del alcance (LB1)', 'Línea base del cronograma (LB1)', 'Línea base de costos (LB1)'],
        implementacion: 'Ingeniería emite los planos rev. 1 y el anexo de memoria el 15 de septiembre; el montaje se programa con los niveles 6 a 10; el director actualiza cronograma, presupuesto y registro de cambios y establece la línea base LB1.',
      },
    },

    {
      id: 'registro-cambios',
      name: 'Registro de cambios',
      abbr: 'RCAM',
      area: 'integracion', group: 'monitoreo', process: '4.6', processes: ['4.6'],
      kind: 'registro', multiple: false,
      purpose: 'Lista todas las solicitudes de cambio del proyecto con su impacto, estado y decisión, como evidencia del control integrado de cambios.',
      tips: [
        'Registra todas las solicitudes, incluso las rechazadas: son evidencia ante reclamaciones del cliente o de la interventoría.',
        'Cada cambio aprobado debe reflejarse en la línea base y en el plan afectado; verifica que exista la nueva versión (LB1, LB2…).',
        'Usa el mismo código en la solicitud, en el acta del comité y en la orden de cambio u otrosí del contrato.',
      ],
      sections: [
        {
          id: 'registro', title: 'Cambios',
          fields: [
            {
              key: 'cambios', label: 'Registro de cambios', type: 'table', addLabel: 'Agregar solicitud de cambio',
              hint: 'Una solicitud por fila con código CC-###. El impacto en el cronograma va en días hábiles.',
              columns: [
                { key: 'id', label: 'Código', type: 'text', width: 80, hint: 'Consecutivo, p. ej. CC-004.' },
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'solicitante', label: 'Solicitante', type: 'text', width: 170 },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 280 },
                { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_CAMBIO },
                { key: 'impactoAlcance', label: 'Impacto en el alcance', type: 'textarea', width: 240 },
                { key: 'impactoCronograma', label: 'Impacto en el cronograma (días)', type: 'number', min: -365, max: 365 },
                { key: 'impactoCosto', label: 'Impacto en el costo', type: 'money', width: 130 },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_CAMBIO, default: 'Registrada' },
                { key: 'fechaDecision', label: 'Fecha de decisión', type: 'date' },
                { key: 'decisor', label: 'Decidido por', type: 'text', width: 200 },
              ],
            },
          ],
        },
        {
          id: 'control', title: 'Control del registro',
          fields: [
            { key: 'responsableRegistro', label: 'Responsable del registro', type: 'text', hint: 'Quién mantiene el registro al día (normalmente la secretaría del comité).' },
            { key: 'observacionesCambios', label: 'Observaciones', type: 'textarea', hint: 'Razones de rechazos, cambios pendientes de decisión y fechas de las próximas sesiones del comité.' },
          ],
        },
      ],
      example: {
        cambios: [
          { id: 'CC-001', fecha: '2026-08-12', solicitante: 'Director de obra del cliente', descripcion: 'Cambio de color de malla de cerramiento: sustituir la malla verde estándar por malla azul con el color corporativo del cliente.', tipo: 'Actualización', impactoAlcance: 'Cambia la especificación de la malla de cerramiento de las fachadas norte y oriente (cerca de 2.400 m²), sin efecto funcional.', impactoCronograma: 3, impactoCosto: 7200000, estado: 'Rechazada', fechaDecision: '2026-08-19', decisor: CCB_AMPLIADO },
          { id: 'CC-002', fecha: '2026-09-07', solicitante: 'Director de obra del cliente', descripcion: 'Plataforma adicional de descargue en piso 8: plataforma voladiza de 2,57 × 3,07 m con barandas, rodapiés y puerta de carga.', tipo: 'Actualización', impactoAlcance: 'Nuevo elemento en accesos y protecciones (1.4 Montaje).', impactoCronograma: 4, impactoCosto: 9800000, estado: 'Aprobada', fechaDecision: '2026-09-11', decisor: CCB_AMPLIADO },
          { id: 'CC-003', fecha: '2026-09-29', solicitante: 'Director de obra del cliente', descripcion: 'Extensión del alquiler 3 semanas por reprogramación de fachada: el andamio completo permanece tres semanas más en obra, el desmontaje y el retiro se desplazan y la fecha de fin pasa del 18 de diciembre de 2026 al 8 de enero de 2027.', tipo: 'Actualización', impactoAlcance: 'Amplía el alquiler y el mantenimiento en obra (1.5 Certificación y operación) y desplaza el desmontaje y el retiro (1.6).', impactoCronograma: 16, impactoCosto: 14600000, estado: 'En análisis' },
        ],
        responsableRegistro: 'Residente de obra (secretaría del CCB)',
        observacionesCambios: 'CC-001 se rechazó porque el costo y el plazo no se justifican para un cambio estético y no hay malla azul en inventario. CC-003 se decidirá en el CCB ampliado del 9 de octubre de 2026; su costo incluye mantenimiento, inspección semanal, supervisión y ampliación de pólizas.',
      },
    },

    /* ================================================================== INTEGRACIÓN · CIERRE (4.7) */
    {
      id: 'informe-final',
      name: 'Informe final del proyecto',
      abbr: 'IFIN',
      area: 'integracion', group: 'cierre', process: '4.7', processes: ['4.7'],
      kind: 'informe', multiple: false,
      purpose: 'Resume el desempeño del proyecto al cierre: cumplimiento de los objetivos de alcance, calidad, cronograma y costo, beneficios logrados, riesgos e incidentes y lecciones aprendidas.',
      tips: [
        'Compara contra la última línea base aprobada y explica cada variación con su causa.',
        'Si los beneficios no se pueden medir al cierre, indica cuándo se medirán y quién es responsable.',
        'Incluye el estado de la liquidación del contrato y de la retención en garantía; la gerencia lo pregunta siempre.',
      ],
      sections: [
        {
          id: 'resumen', title: 'Resumen del proyecto',
          fields: [
            { key: 'descripcionFinal', label: 'Descripción del proyecto', type: 'textarea', from: 'project.description', hint: 'Qué se hizo y para quién, en pocas líneas.' },
            { key: 'fechaInicioReal', label: 'Fecha de inicio real', type: 'date', hint: 'Fecha real de inicio del proyecto.' },
            { key: 'fechaFinPlan', label: 'Fecha de fin planificada', type: 'date', from: 'project.end', hint: 'Fecha de fin de la línea base vigente.' },
            { key: 'fechaFinReal', label: 'Fecha de fin real', type: 'date', hint: 'Fecha de firma del acta de cierre.' },
            { key: 'presupuestoAprobado', label: 'Presupuesto aprobado', type: 'money', from: 'project.budget', hint: 'Presupuesto total aprobado, con reservas.' },
            { key: 'costoFinal', label: 'Costo real final', type: 'money', hint: 'Costo real total conciliado con contabilidad.' },
          ],
        },
        {
          id: 'objetivos', title: 'Cumplimiento de objetivos',
          fields: [
            {
              key: 'cumplimiento', label: 'Objetivos y resultados', type: 'table', addLabel: 'Agregar objetivo',
              hint: 'Objetivos del acta de constitución frente al resultado obtenido.',
              columns: [
                { key: 'dimension', label: 'Dimensión', type: 'select', options: DIMENSION_OBJETIVO },
                { key: 'objetivo', label: 'Objetivo', type: 'textarea', width: 240 },
                { key: 'resultado', label: 'Resultado', type: 'textarea', width: 260 },
                { key: 'cumplido', label: 'Cumplido', type: 'select', options: CUMPLIMIENTO },
              ],
            },
            { key: 'alcanceFinal', label: 'Alcance', type: 'textarea', hint: 'Criterios usados para evaluar el alcance y evidencia de que se cumplieron.' },
            { key: 'calidadFinal', label: 'Calidad', type: 'textarea', hint: 'Criterios de calidad del proyecto y del producto, resultados de verificación y no conformidades.' },
            { key: 'cronogramaFinal', label: 'Cronograma', type: 'textarea', hint: 'Fechas reales de los hitos frente a la línea base y razones de las variaciones.' },
            { key: 'costoFinalAnalisis', label: 'Costo', type: 'textarea', hint: 'Rango de costo aceptable, costo real y razones de las variaciones; uso de reservas.' },
          ],
        },
        {
          id: 'beneficios', title: 'Validación y beneficios',
          fields: [
            { key: 'validacionProducto', label: 'Validación del producto', type: 'textarea', hint: 'Cómo el producto final satisfizo las necesidades del cliente identificadas al inicio.' },
            { key: 'beneficiosLogrados', label: 'Beneficios logrados', type: 'textarea', hint: 'Beneficios del caso de negocio logrados al cierre; los pendientes, con fecha y responsable de su medición.' },
          ],
        },
        {
          id: 'riesgos', title: 'Riesgos e incidentes',
          fields: [
            { key: 'resumenRiesgos', label: 'Riesgos', type: 'textarea', hint: 'Riesgos que se materializaron, cómo se respondió y uso de la reserva para contingencias.' },
            { key: 'resumenIncidentes', label: 'Incidentes', type: 'textarea', hint: 'Incidentes principales y cómo se resolvieron; incidentes abiertos al cierre.' },
          ],
        },
        {
          id: 'lecciones', title: 'Lecciones aprendidas y recomendaciones',
          fields: [
            { key: 'leccionesClave', label: 'Lecciones clave', type: 'list', hint: 'Las lecciones más útiles para futuros proyectos; el detalle está en el registro de lecciones.' },
            { key: 'recomendacionesFuturas', label: 'Recomendaciones', type: 'textarea', hint: 'Cambios sugeridos a ofertas, procedimientos o estándares de la empresa.' },
          ],
        },
      ],
      example: {
        descripcionFinal: EX.description,
        fechaInicioReal: '2026-08-03',
        fechaFinPlan: EX.end,
        fechaFinReal: '2026-12-22',
        presupuestoAprobado: EX.budget,
        costoFinal: 464300000,
        cumplimiento: [
          { id: 'r1', dimension: 'Alcance', objetivo: 'Entregar montados y liberados los 15 niveles, los accesos y las protecciones.', resultado: '15 niveles, torre de acceso, protecciones y plataforma de descargue del piso 8 (CC-002) aceptados en cuatro actas parciales.', cumplido: 'Sí' },
          { id: 'r2', dimension: 'Cronograma', objetivo: 'Montaje completo al 7 de noviembre y cierre al 18 de diciembre de 2026.', resultado: 'Montaje completo el 12 de noviembre (+4 días hábiles) y cierre el 22 de diciembre (+3 días hábiles).', cumplido: 'Parcialmente' },
          { id: 'r3', dimension: 'Costo', objetivo: 'Ejecutar dentro de COP 486,5 M con CPI ≥ 0,95.', resultado: 'Costo final de $ 464,3 M y CPI final de 0,97. De la reserva para contingencias se trasladaron $ 9,8 M al BAC por el CC-002 y se usaron $ 12,3 M de los $ 22,6 M restantes; la reserva de gestión no se usó.', cumplido: 'Sí' },
          { id: 'r4', dimension: 'Seguridad y salud en el trabajo', objetivo: 'Cero accidentes con incapacidad.', resultado: 'Cero accidentes; un casi accidente (caída de una abrazadera sin lesionados) investigado y cerrado.', cumplido: 'Sí' },
          { id: 'r5', dimension: 'Satisfacción del cliente', objetivo: 'Encuesta de cierre ≥ 4,5 / 5.', resultado: 'Calificación de 4,6 / 5.', cumplido: 'Sí' },
        ],
        alcanceFinal: 'Criterio: cada etapa se considera terminada con la lista de chequeo aprobada, la tarjeta verde de la persona competente y el acta de aceptación firmada por el cliente con visto bueno de la interventoría. Evidencia: actas parciales No. 1 a 4, certificado del andamio completo del 14 de noviembre y acta de inspección de retorno del 19 de diciembre.',
        calidadFinal: 'Cero no conformidades abiertas al cierre. Tres hallazgos de la interventoría, todos cerrados en 48 horas o menos. Faltantes en la inspección de retorno del 0,4 % de las piezas (meta ≤ 1 %), liquidados al cliente según tarifa.',
        cronogramaFinal: 'Diseño aprobado el 21 de agosto (plan: 21 de agosto); despacho completo el 29 de agosto (29 de agosto); niveles 1 a 5 el 21 de septiembre (19 de septiembre); niveles 6 a 10 el 16 de octubre (10 de octubre); certificación del andamio completo el 14 de noviembre (12 de noviembre); desmontaje terminado el 15 de diciembre (12 de diciembre); cierre el 22 de diciembre (18 de diciembre). Causas: baja disponibilidad de la grúa del cliente y cinco días de lluvia; la segunda cuadrilla recuperó parte del atraso.',
        costoFinalAnalisis: 'Rango aceptable: hasta la línea base de costos de $ 474,6 M. Costo real de $ 464,3 M (CV de −$ 12,3 M frente al BAC de $ 452,0 M). Causas: horas extra para recuperar el atraso ($ 6,8 M), subarriendo de diagonales ($ 3,9 M) y reposición de piezas dañadas ($ 1,6 M).',
        validacionProducto: 'El cliente ejecutó el 100 % de la fachada de la Torre 2 con el andamio, sin suspensiones de la interventoría por condiciones del andamio después de octubre.',
        beneficiosLogrados: 'Ingreso facturado de $ 610,6 M (incluye la orden de cambio del CC-002 por $ 12,6 M) y margen bruto de 24,0 %, superior al mínimo de 18 % del caso de negocio. La utilización del inventario de andamio multidireccional llegó a 78 % en octubre. El beneficio de cliente recurrente (invitación a la Torre 3) se medirá en el primer semestre de 2027; responsable: Gerencia Comercial.',
        resumenRiesgos: 'Se materializaron dos riesgos identificados: la baja disponibilidad de la grúa del cliente y las lluvias de octubre; ambos se atendieron con la reserva para contingencias y una segunda cuadrilla. El riesgo de accidente en alturas no se materializó gracias a los permisos diarios, la inspección por persona competente y el plan de rescate. El cliente retiró el CC-003 el 16 de octubre tras recuperar su programación de fachada.',
        resumenIncidentes: 'Siete incidentes registrados, todos cerrados: faltante de diagonales, lluvias, grúa del cliente, rodapiés retirados por terceros en el nivel 4, factura de agosto vencida (pagada el 20 de octubre), caída de una abrazadera sin lesionados y retraso en la recolección de retorno por restricción vehicular.',
        leccionesClave: [
          'Pactar en el contrato una ventana diaria de grúa garantizada.',
          'Hacer conteo físico ciego de piezas críticas 15 días antes del despacho.',
          'Hacer pre-inspección interna antes de pedir la liberación de cada nivel.',
          'Acordar desde la oferta la jornada extendida para la temporada de lluvias.',
        ],
        recomendacionesFuturas: 'Ofrecer la plataforma de descargue como opción estándar en fachadas de más de 10 pisos y presupuestar una segunda cuadrilla en montajes por etapas de más de 12 niveles.',
      },
    },

    {
      id: 'acta-cierre',
      name: 'Acta de cierre y aceptación final',
      abbr: 'ACIE',
      area: 'integracion', group: 'cierre', process: '4.7', processes: ['4.7'],
      kind: 'acta', multiple: false,
      purpose: 'Formaliza la aceptación final del proyecto: entregables aceptados, transferencia al cliente, cierre administrativo y contractual (liquidación, pólizas, paz y salvo) y firmas.',
      tips: [
        'No firmes el cierre sin la inspección de retorno: los faltantes y daños se liquidan antes del paz y salvo.',
        'Verifica la vigencia de las pólizas de cumplimiento, responsabilidad civil extracontractual y salarios y prestaciones; solicita su ampliación o cancelación según el contrato.',
        'La firma del acta suele liberar la retención en garantía: anota el valor y el plazo de pago.',
        'Archiva certificados de persona competente, permisos de trabajo en alturas y registros de inspección; el Decreto 1072 de 2015 obliga a conservar los registros del SG-SST.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación',
          fields: [
            { key: 'proyectoCierre', label: 'Proyecto', type: 'text', from: 'project.name', required: true, hint: 'Nombre del proyecto que se cierra.' },
            { key: 'codigoCierre', label: 'Código', type: 'text', from: 'project.code', hint: 'Código interno del proyecto.' },
            { key: 'clienteCierre', label: 'Cliente', type: 'text', from: 'project.client', hint: 'Cliente que recibe y acepta.' },
            { key: 'contrato', label: 'Contrato y modificaciones', type: 'text', hint: 'Número del contrato u orden de servicio, otrosíes y órdenes de cambio.' },
            { key: 'directorCierre', label: 'Director del proyecto', type: 'text', from: 'project.manager', hint: 'Quien entrega el proyecto.' },
            { key: 'fechaCierre', label: 'Fecha de cierre', type: 'date', required: true, hint: 'Fecha de firma del acta.' },
          ],
        },
        {
          id: 'entregables', title: 'Entregables aceptados',
          fields: [
            {
              key: 'entregablesAceptados', label: 'Entregables', type: 'table', addLabel: 'Agregar entregable',
              hint: 'Cada entregable con el documento que soporta su aceptación.',
              columns: [
                { key: 'entregable', label: 'Entregable', type: 'textarea', width: 260 },
                { key: 'soporte', label: 'Documento de aceptación', type: 'text', width: 200 },
                { key: 'fechaAceptacion', label: 'Fecha de aceptación', type: 'date' },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea', width: 200 },
              ],
            },
          ],
        },
        {
          id: 'transferencia', title: 'Transferencia',
          fields: [
            { key: 'transferencia', label: 'Transferencia al cliente', type: 'textarea', hint: 'Qué se entregó, en qué estado y cuándo: frente de obra, equipo, documentación.' },
            { key: 'documentacionEntregada', label: 'Documentación entregada', type: 'list', hint: 'Certificados, memorias, planos y registros entregados al cliente.' },
          ],
        },
        {
          id: 'administrativo', title: 'Cierre administrativo y contractual',
          fields: [
            { key: 'valorFinal', label: 'Valor final del contrato', type: 'money', hint: 'Valor antes de IVA con todas las modificaciones.' },
            { key: 'retencionGarantia', label: 'Retención en garantía por liberar', type: 'money', hint: 'Valor retenido por el cliente que se libera con el cierre.' },
            { key: 'liquidacion', label: 'Liquidación', type: 'textarea', hint: 'Facturado, recaudado, saldos, faltantes y daños cobrados y condiciones de pago pendientes.' },
            { key: 'polizas', label: 'Pólizas', type: 'textarea', hint: 'Pólizas del contrato, su vigencia requerida después del cierre y reclamaciones si las hubo.' },
            {
              key: 'pazSalvo', label: 'Paz y salvo', type: 'table', addLabel: 'Agregar concepto',
              hint: 'Conceptos que deben quedar a paz y salvo antes de cerrar.',
              columns: [
                { key: 'concepto', label: 'Concepto', type: 'text', width: 260 },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_PAZ_SALVO },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 170 },
                { key: 'observacion', label: 'Observación', type: 'textarea', width: 240 },
              ],
              defaultRows: [
                { concepto: 'Pagos del cliente' },
                { concepto: 'Faltantes y daños de equipo' },
                { concepto: 'Proveedores y subarriendos' },
                { concepto: 'Nómina, seguridad social y ARL del personal' },
                { concepto: 'Documentación de SST' },
              ],
            },
            { key: 'compromisosPendientes', label: 'Compromisos posteriores al cierre', type: 'textarea', hint: 'Obligaciones que siguen vigentes: garantías, pólizas, pagos pendientes, seguimiento de beneficios.' },
          ],
        },
        {
          id: 'firmas', title: 'Firmas',
          fields: [
            { key: 'firmasCierre', label: 'Firmas', type: 'table', addLabel: 'Agregar firma', hint: 'Firman el patrocinador, el director del proyecto y el cliente; la interventoría da su visto bueno.', columns: firmasColumns() },
          ],
        },
      ],
      example: {
        proyectoCierre: EX.name,
        codigoCierre: EX.code,
        clienteCierre: EX.client,
        contrato: 'Contrato de servicios CS-2026-031 (ficticio) y orden de cambio No. 1',
        directorCierre: EX.manager,
        fechaCierre: '2026-12-22',
        entregablesAceptados: [
          { id: 'r1', entregable: 'Ingeniería (diseño, memoria de cálculo y planes aprobados) y equipo despachado a obra', soporte: 'Acta parcial No. 1', fechaAceptacion: '2026-08-29', observaciones: 'Incluye aprobación de la memoria por la interventoría el 21 de agosto.' },
          { id: 'r2', entregable: 'Montaje de los niveles 1 a 5', soporte: 'Acta parcial No. 2', fechaAceptacion: '2026-09-21', observaciones: 'Aceptado con observaciones menores, corregidas en sitio.' },
          { id: 'r3', entregable: 'Montaje de los niveles 6 a 10', soporte: 'Acta parcial No. 3', fechaAceptacion: '2026-10-16', observaciones: 'Sin observaciones.' },
          { id: 'r4', entregable: 'Montaje de los niveles 11 a 15, accesos, protecciones y plataforma de descargue (CC-002)', soporte: 'Acta parcial No. 4', fechaAceptacion: '2026-11-14', observaciones: 'Prueba de carga de la plataforma aprobada.' },
          { id: 'r5', entregable: 'Certificado de inspección del andamio completo', soporte: 'Certificado de persona competente', fechaAceptacion: '2026-11-14', observaciones: 'Sin hallazgos abiertos.' },
          { id: 'r6', entregable: 'Desmontaje, retiro e inspección de retorno', soporte: 'Acta de inspección de retorno', fechaAceptacion: '2026-12-19', observaciones: 'Faltantes y daños liquidados en la factura final.' },
        ],
        transferencia: 'El frente de fachada de la Torre 2 se entregó libre de equipo el 15 de diciembre; las áreas de acopio se devolvieron limpias. El equipo regresó a bodega, donde almacén lo recibió con la inspección de retorno. Se entregó al cliente la documentación técnica y de SST del andamio.',
        documentacionEntregada: [
          'Planos de montaje rev. 1 y memoria de cálculo con el anexo de la plataforma de descargue',
          'Certificados de inspección por persona competente, por etapa y del andamio completo',
          'Registros de inspección semanal y de mantenimiento en obra',
          'Permisos de trabajo en alturas y listas de chequeo diarias',
          'Actas parciales No. 1 a 4 y acta de inspección de retorno',
        ],
        valorFinal: 610600000,
        retencionGarantia: 30530000,
        liquidacion: 'Valor final de $ 610.600.000 antes de IVA (contrato inicial de $ 598.000.000 más la orden de cambio No. 1 por $ 12.600.000). Facturado el 100 %; recaudado $ 580.070.000. La retención en garantía del 5 % ($ 30.530.000) se libera con la firma de esta acta. Faltantes y daños de la inspección de retorno ($ 2.150.000) facturados al cliente según la tarifa del contrato.',
        polizas: 'Cumplimiento (20 % del valor del contrato) vigente hasta el 22 de junio de 2027 (plazo más seis meses). Responsabilidad civil extracontractual vigente hasta el 31 de diciembre de 2026, sin reclamaciones. Salarios y prestaciones sociales vigente hasta el 22 de diciembre de 2029 (plazo más tres años).',
        pazSalvo: [
          { id: 'r1', concepto: 'Pagos del cliente', estado: 'Pendiente', responsable: 'Facturación y cartera', observacion: 'Falta la retención en garantía, que se libera con esta acta.' },
          { id: 'r2', concepto: 'Faltantes y daños de equipo', estado: 'Paz y salvo', responsable: 'Almacén', observacion: 'Liquidados en la factura final.' },
          { id: 'r3', concepto: 'Proveedores y subarriendos', estado: 'Paz y salvo', responsable: 'Coordinador logístico', observacion: 'Diagonales subarrendadas devueltas y pagadas el 30 de octubre.' },
          { id: 'r4', concepto: 'Nómina, seguridad social y ARL del personal', estado: 'Paz y salvo', responsable: 'Director de proyecto', observacion: 'Planillas de aportes de agosto a diciembre entregadas a la interventoría.' },
          { id: 'r5', concepto: 'Documentación de SST', estado: 'Paz y salvo', responsable: 'Coordinador SST (HSE)', observacion: 'Archivo del SG-SST del proyecto actualizado.' },
        ],
        compromisosPendientes: 'El cliente paga la retención en garantía dentro de los 30 días siguientes a la firma. Ingeniería y Alquiler mantiene vigente la póliza de cumplimiento hasta el 22 de junio de 2027. La Gerencia Comercial hace seguimiento a la invitación para la Torre 3.',
        firmasCierre: [
          { id: 'r1', rol: 'Patrocinador', nombre: 'Gerencia General', fecha: '2026-12-22' },
          { id: 'r2', rol: 'Director del proyecto', nombre: 'Director de proyecto', fecha: '2026-12-22' },
          { id: 'r3', rol: 'Cliente', nombre: 'Director de obra del cliente', fecha: '2026-12-22' },
          { id: 'r4', rol: 'Visto bueno', nombre: 'Interventoría del cliente', fecha: '2026-12-22' },
        ],
      },
    },

    /* ================================================================== ALCANCE (cap. 5) */
    {
      id: 'plan-gestion-alcance',
      name: 'Plan de gestión del alcance',
      abbr: 'PALC',
      area: 'alcance', group: 'planificacion', process: '5.1', processes: ['5.1'],
      kind: 'plan', multiple: false,
      purpose: 'Describe cómo se definirá, desarrollará, monitoreará, controlará y validará el alcance: elaboración del enunciado, creación de la EDT, aprobación de la línea base del alcance y aceptación de entregables.',
      tips: [
        'Define qué significa "terminado" para cada tipo de entregable; por ejemplo, un nivel montado incluye plataformas, barandas, rodapiés y anclajes, liberado con tarjeta verde por persona competente.',
        'Toda solicitud del cliente o de la interventoría que no esté en el enunciado se registra como solicitud de cambio antes de ejecutarla; así se evita la corrupción del alcance.',
        'La aceptación del cliente (5.5) es distinta del control de calidad interno (8.3): primero se verifica, luego se valida.',
      ],
      sections: [
        {
          id: 'enunciado', title: 'Elaboración del enunciado del alcance',
          fields: [
            { key: 'procesoEnunciado', label: 'Proceso para elaborar el enunciado', type: 'textarea', hint: 'Quién lo elabora, con qué insumos, quién lo revisa y cómo se aprueba.' },
            { key: 'fuentesAlcance', label: 'Fuentes de información', type: 'list', hint: 'Documentos y actividades de los que se obtiene el alcance.' },
          ],
        },
        {
          id: 'edt', title: 'EDT y diccionario de la EDT',
          fields: [
            { key: 'procesoEdt', label: 'Proceso para crear la EDT', type: 'textarea', hint: 'Criterio de descomposición (por fases, entregables o etapas) y herramienta.' },
            { key: 'criterioPaquete', label: 'Criterio de paquete de trabajo', type: 'textarea', hint: 'Cuándo un elemento es lo bastante pequeño para estimarse, asignarse y controlarse.' },
            { key: 'nivelesEdt', label: 'Niveles de descomposición', type: 'number', min: 2, max: 8, hint: 'Número máximo de niveles de la EDT, contando el proyecto como nivel 1.' },
            { key: 'diccionario', label: 'Contenido del diccionario de la EDT', type: 'textarea', hint: 'Información que se registra para cada paquete de trabajo.' },
          ],
        },
        {
          id: 'lineaBase', title: 'Línea base del alcance',
          fields: [
            { key: 'aprobacionLineaBase', label: 'Aprobación', type: 'textarea', hint: 'Quién aprueba la línea base del alcance y cuándo.' },
            { key: 'mantenimientoLineaBase', label: 'Mantenimiento', type: 'textarea', hint: 'Cómo se modifica la línea base y cómo se identifican sus versiones.' },
          ],
        },
        {
          id: 'validacion', title: 'Validación y control del alcance',
          fields: [
            { key: 'procesoAceptacion', label: 'Aceptación formal de los entregables', type: 'textarea', hint: 'Cómo se obtiene la aceptación del cliente y qué documento la soporta.' },
            {
              key: 'responsablesAceptacion', label: 'Responsables de verificación y aceptación', type: 'table', addLabel: 'Agregar tipo de entregable',
              hint: 'Por tipo de entregable: quién verifica internamente y quién acepta.',
              columns: [
                { key: 'tipoEntregable', label: 'Tipo de entregable', type: 'text', width: 200 },
                { key: 'verifica', label: 'Verifica (interno)', type: 'text', width: 200 },
                { key: 'acepta', label: 'Acepta (cliente)', type: 'text', width: 220 },
                { key: 'documento', label: 'Documento de aceptación', type: 'text', width: 200 },
              ],
            },
            { key: 'controlAlcance', label: 'Control del alcance', type: 'textarea', hint: 'Cómo se compara lo ejecutado con la línea base y cómo se manejan las desviaciones.' },
          ],
        },
      ],
      example: {
        procesoEnunciado: 'El director de proyecto y el ingeniero de diseño elaboran el enunciado a partir del acta de constitución, el pliego técnico del cliente, los planos de fachada y la documentación de requisitos. El borrador se revisa con el director de obra del cliente y la interventoría y se aprueba como parte de la línea base del alcance.',
        fuentesAlcance: [
          'Acta de constitución del proyecto',
          'Pliego técnico y contrato del cliente',
          'Planos arquitectónicos y estructurales de la Torre 2',
          'Documentación de requisitos',
          'Visita técnica a obra del 22 de julio de 2026',
        ],
        procesoEdt: 'La EDT se descompone por fases y entregables: 1.1 Gestión del proyecto, 1.2 Ingeniería, 1.3 Suministro y logística, 1.4 Montaje, 1.5 Certificación y operación, 1.6 Desmontaje y retiro. El montaje se descompone en etapas de cinco niveles. Se elabora en la herramienta EDT del gestor.',
        criterioPaquete: 'Un paquete de trabajo debe poder estimarse, asignarse a un responsable y verificarse con un criterio de aceptación, con una duración entre 2 y 20 días hábiles.',
        nivelesEdt: 3,
        diccionario: 'Para cada paquete: código, descripción del trabajo, responsable, entregable, criterios de aceptación, hitos, recursos, costo estimado y referencias técnicas (planos y procedimientos).',
        aprobacionLineaBase: 'La línea base del alcance (enunciado, EDT y diccionario) la aprueba el patrocinador con el visto bueno del director de obra del cliente y se registra como LB0 antes del primer despacho.',
        mantenimientoLineaBase: 'Solo se modifica con una solicitud de cambio aprobada según el plan de gestión de cambios. Cada cambio aprobado genera una nueva línea base (LB1, LB2…) y una nueva revisión del enunciado y de la EDT.',
        procesoAceptacion: 'Cada etapa se verifica internamente con la lista de chequeo y la liberación de la persona competente. Luego se hace un recorrido con el cliente y la interventoría; si se cumplen los criterios, se firma el acta de aceptación de entregables, que soporta el acta de obra para facturar.',
        responsablesAceptacion: [
          { id: 'r1', tipoEntregable: 'Diseño y memoria de cálculo', verifica: 'Ingeniero de diseño', acepta: 'Interventoría del cliente', documento: 'Comunicación de aprobación' },
          { id: 'r2', tipoEntregable: 'Etapas de montaje, accesos y protecciones', verifica: 'Supervisor de montaje y persona competente', acepta: 'Director de obra del cliente con visto bueno de la interventoría', documento: 'Acta de aceptación de entregables' },
          { id: 'r3', tipoEntregable: 'Desmontaje y retiro', verifica: 'Residente de obra', acepta: 'Director de obra del cliente', documento: 'Acta de entrega del frente' },
        ],
        controlAlcance: 'El residente de obra compara cada semana el trabajo ejecutado con la EDT. Toda solicitud del cliente o de la interventoría que no esté en el enunciado (plataformas adicionales, cambios de malla, prolongación del alquiler) se registra como solicitud de cambio antes de ejecutarla.',
      },
    },

    {
      id: 'plan-gestion-requisitos',
      name: 'Plan de gestión de los requisitos',
      abbr: 'PREQ',
      area: 'alcance', group: 'planificacion', process: '5.1', processes: ['5.1'],
      kind: 'plan', multiple: false,
      purpose: 'Describe cómo se recopilarán, analizarán, priorizarán, documentarán, rastrearán y gestionarán los requisitos del proyecto y del producto.',
      tips: [
        'Los requisitos legales (trabajo en alturas, SG-SST) son siempre de prioridad alta y no son negociables con el cliente.',
        'Cada requisito debe llegar a un paquete de la EDT y a una inspección o prueba que lo verifique; si no, no se puede demostrar que se cumplió.',
        'Define métricas del producto verificables en obra: carga de servicio de plataformas, separación a fachada, altura de barandas y rodapiés.',
      ],
      sections: [
        {
          id: 'planificacion', title: 'Recopilación, seguimiento e informe',
          fields: [
            { key: 'tecnicasRecopilacion', label: 'Técnicas de recopilación', type: 'list', hint: 'Entrevistas, revisión de documentos, visitas a obra, juicio de expertos.' },
            { key: 'actividadesRequisitos', label: 'Planificación, seguimiento e informe', type: 'textarea', hint: 'Cómo se planifican y rastrean las actividades de requisitos y dónde se informa su estado.' },
            { key: 'responsableRequisitos', label: 'Responsable de los requisitos', type: 'text', hint: 'Quién mantiene la documentación de requisitos y la matriz de trazabilidad.' },
          ],
        },
        {
          id: 'priorizacion', title: 'Priorización',
          fields: [
            {
              key: 'criteriosPriorizacion', label: 'Escala de prioridad', type: 'table', addLabel: 'Agregar nivel',
              hint: 'Significado de cada nivel de prioridad.',
              columns: [
                { key: 'nivel', label: 'Nivel', type: 'select', options: PRIORIDAD },
                { key: 'criterio', label: 'Criterio', type: 'textarea', width: 380 },
              ],
              defaultRows: [
                { nivel: 'Alta', criterio: 'Obligatorio por ley, contrato o seguridad; sin él no se acepta el entregable.' },
                { nivel: 'Media', criterio: 'Necesario para el desempeño esperado; se puede negociar la forma de cumplirlo.' },
                { nivel: 'Baja', criterio: 'Deseable; se atiende si no afecta costo ni plazo.' },
              ],
            },
            { key: 'procesoPriorizacion', label: 'Proceso de priorización', type: 'textarea', hint: 'Quién propone y quién valida la prioridad de cada requisito.' },
          ],
        },
        {
          id: 'trazabilidad', title: 'Estructura de trazabilidad',
          fields: [
            { key: 'atributosTrazabilidad', label: 'Atributos que se registran', type: 'list', hint: 'Datos de cada requisito en la matriz de trazabilidad.' },
            { key: 'estructuraTrazabilidad', label: 'Vínculos de trazabilidad', type: 'textarea', hint: 'Con qué se vincula cada requisito: necesidad del negocio, EDT, diseño, verificación.' },
          ],
        },
        {
          id: 'cambios', title: 'Cambios y métricas del producto',
          fields: [
            { key: 'cambiosRequisitos', label: 'Gestión de cambios de requisitos', type: 'textarea', hint: 'Cómo se inician, analizan y autorizan los cambios de requisitos.' },
            {
              key: 'metricasProducto', label: 'Métricas del producto', type: 'table', addLabel: 'Agregar métrica',
              hint: 'Métricas con su umbral y método de verificación.',
              columns: [
                { key: 'metrica', label: 'Métrica', type: 'text', width: 220 },
                { key: 'umbral', label: 'Umbral o valor objetivo', type: 'text', width: 180 },
                { key: 'metodo', label: 'Método de verificación', type: 'textarea', width: 260 },
              ],
            },
          ],
        },
      ],
      example: {
        tecnicasRecopilacion: [
          'Entrevistas con el director de obra del cliente y con la interventoría',
          'Revisión del pliego técnico, los planos y el contrato',
          'Visita técnica a obra',
          'Juicio de expertos: ingeniero de diseño, supervisor de montaje y coordinador SST',
          'Análisis de la normativa aplicable',
        ],
        actividadesRequisitos: 'Los requisitos se recopilan antes de aprobar el diseño, se registran con código REQ-### en la documentación de requisitos y se rastrean en la matriz de trazabilidad. Su estado se informa en el comité semanal y en el informe de desempeño.',
        responsableRequisitos: 'Ingeniero de diseño',
        criteriosPriorizacion: [
          { id: 'r1', nivel: 'Alta', criterio: 'Obligatorio por ley, contrato o seguridad; sin él no se acepta el entregable.' },
          { id: 'r2', nivel: 'Media', criterio: 'Necesario para el desempeño esperado; se puede negociar la forma de cumplirlo.' },
          { id: 'r3', nivel: 'Baja', criterio: 'Deseable; se atiende si no afecta costo ni plazo.' },
        ],
        procesoPriorizacion: 'El director de proyecto propone la prioridad y la valida con el cliente en la revisión del diseño. Los requisitos legales y de SST son siempre de prioridad alta.',
        atributosTrazabilidad: [
          'Código y descripción',
          'Fuente e interesado que lo solicita',
          'Objetivo del negocio o del proyecto que atiende',
          'Paquete de la EDT y entregable',
          'Referencia de diseño (plano o memoria)',
          'Método de verificación y estado',
        ],
        estructuraTrazabilidad: 'La matriz de trazabilidad vincula cada requisito con su origen (necesidad del negocio, contrato o norma), con el paquete de la EDT que lo cumple, con el plano o memoria que lo diseña y con la inspección o prueba que lo verifica.',
        cambiosRequisitos: 'Los cambios de requisitos se tramitan según el plan de gestión de cambios: se analiza el impacto en diseño, cronograma, costo y riesgos, se actualizan la documentación de requisitos y la matriz, y se emite una nueva revisión de planos si aplica.',
        metricasProducto: [
          { id: 'r1', metrica: 'Carga de servicio de las plataformas', umbral: '≥ 200 kg/m²', metodo: 'Memoria de cálculo aprobada e inspección visual de deformaciones por nivel.' },
          { id: 'r2', metrica: 'Separación entre andamio y fachada', umbral: '≤ 30 cm', metodo: 'Medición con flexómetro en cada nivel durante la liberación.' },
          { id: 'r3', metrica: 'Altura de barandas y rodapiés', umbral: 'Baranda 1,0 m; rodapié 15 cm', metodo: 'Lista de chequeo de inspección por nivel.' },
          { id: 'r4', metrica: 'Faltantes en la inspección de retorno', umbral: '≤ 1 % de las piezas despachadas', metodo: 'Conteo en bodega contra remisiones.' },
        ],
      },
    },

    {
      id: 'documentacion-requisitos',
      name: 'Documentación de requisitos',
      abbr: 'DREQ',
      area: 'alcance', group: 'planificacion', process: '5.2', processes: ['5.2'],
      kind: 'registro', multiple: false,
      purpose: 'Describe cómo los requisitos individuales cumplen con las necesidades del negocio: requisitos del negocio, de los interesados, de la solución, de transición, del proyecto y de calidad, con su criterio de aceptación.',
      tips: [
        'Redacta requisitos verificables: "plataforma con carga de servicio de 200 kg/m²" en lugar de "plataforma resistente".',
        'Registra la fuente de cada requisito (pliego, contrato, acta de reunión, norma) para resolver discusiones con el cliente.',
        'Incluye los requisitos de transición: capacitación del personal del cliente en el uso seguro del andamio antes de liberar cada etapa.',
      ],
      sections: [
        {
          id: 'contexto', title: 'Contexto',
          fields: [
            { key: 'objetivosNegocio', label: 'Objetivos del negocio y del proyecto', type: 'textarea', hint: 'Objetivos a los que deben aportar los requisitos; sirven para la trazabilidad.' },
            { key: 'normativa', label: 'Normativa aplicable', type: 'list', hint: 'Leyes, resoluciones y normas técnicas que generan requisitos.' },
          ],
        },
        {
          id: 'requisitos', title: 'Requisitos',
          fields: [
            {
              key: 'requisitos', label: 'Requisitos', type: 'table', addLabel: 'Agregar requisito',
              hint: 'Un requisito por fila, con código REQ-###, categoría, fuente y criterio de aceptación.',
              columns: [
                { key: 'codigo', label: 'Código', type: 'text', width: 90 },
                { key: 'requisito', label: 'Requisito', type: 'textarea', width: 300 },
                { key: 'tipo', label: 'Categoría', type: 'select', options: TIPO_REQUISITO },
                { key: 'fuente', label: 'Fuente', type: 'text', width: 180 },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: PRIORIDAD },
                { key: 'criterioAceptacion', label: 'Criterio de aceptación', type: 'textarea', width: 260 },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_REQUISITO },
              ],
            },
          ],
        },
        {
          id: 'supuestos', title: 'Supuestos, dependencias y restricciones',
          fields: [
            { key: 'supuestosRequisitos', label: 'Supuestos y restricciones', type: 'textarea', hint: 'Condiciones que se asumen para cumplir los requisitos y límites que los condicionan.' },
            { key: 'dependencias', label: 'Dependencias', type: 'textarea', hint: 'Requisitos que dependen de terceros o de otros requisitos.' },
          ],
        },
      ],
      example: {
        objetivosNegocio: 'Ejecutar con seguridad la fachada de la Torre 2 sin frenar al cliente (objetivo del cliente), con un margen bruto mínimo de 18 % y cero accidentes (objetivos de la empresa).',
        normativa: [
          'Resolución 4272 de 2021: requisitos mínimos de seguridad para el trabajo en alturas',
          'Decreto 1072 de 2015: Sistema de Gestión de la Seguridad y Salud en el Trabajo',
          'Resolución 1401 de 2007: investigación de incidentes y accidentes de trabajo',
          'Restricciones de circulación de vehículos de carga de la Secretaría Distrital de Movilidad de Bogotá',
        ],
        requisitos: [
          { id: 'r1', codigo: 'REQ-001', requisito: 'Cumplir la Resolución 4272 de 2021: sistemas de acceso certificados, permisos de trabajo diarios, personal certificado y coordinador de alturas en sitio.', tipo: 'Del proyecto', fuente: 'Contrato y normativa', prioridad: 'Alta', criterioAceptacion: 'Permisos y certificados al día en cada auditoría de la interventoría.', estado: 'En implementación' },
          { id: 'r2', codigo: 'REQ-002', requisito: 'Plataformas de trabajo con carga de servicio de 200 kg/m² en todos los niveles.', tipo: 'De la solución: no funcional', fuente: 'Pliego técnico del cliente', prioridad: 'Alta', criterioAceptacion: 'Memoria de cálculo aprobada; inspección sin deformaciones.', estado: 'Verificado' },
          { id: 'r3', codigo: 'REQ-003', requisito: 'Cobertura completa de las fachadas norte, oriente y occidente, desde el andén hasta la cubierta (15 niveles), con separación a fachada de 30 cm como máximo.', tipo: 'De la solución: funcional', fuente: 'Pliego técnico del cliente', prioridad: 'Alta', criterioAceptacion: 'Acta de aceptación por etapa; medición de separación por nivel.', estado: 'En implementación' },
          { id: 'r4', codigo: 'REQ-004', requisito: 'Montaje por etapas de cinco niveles, liberando cada etapa antes de iniciar la siguiente.', tipo: 'De los interesados', fuente: 'Director de obra del cliente', prioridad: 'Alta', criterioAceptacion: 'Tarjeta verde por etapa antes del uso por el cliente.', estado: 'En implementación' },
          { id: 'r5', codigo: 'REQ-005', requisito: 'Acceso por torre de escaleras con descansos cada dos niveles.', tipo: 'De la solución: funcional', fuente: 'Pliego técnico del cliente', prioridad: 'Media', criterioAceptacion: 'Inspección de la torre de acceso sin hallazgos.', estado: 'En implementación' },
          { id: 'r6', codigo: 'REQ-006', requisito: 'Protección perimetral con barandas de 1,0 m, rodapiés de 15 cm y malla contra caída de objetos.', tipo: 'De la solución: funcional', fuente: 'Normativa y pliego técnico', prioridad: 'Alta', criterioAceptacion: 'Lista de chequeo por nivel sin hallazgos.', estado: 'En implementación' },
          { id: 'r7', codigo: 'REQ-007', requisito: 'Inspección y liberación por persona competente antes del primer uso de cada etapa y semanalmente durante la operación.', tipo: 'De calidad', fuente: 'Resolución 4272 de 2021', prioridad: 'Alta', criterioAceptacion: 'Tarjeta verde y registro de inspección firmados.', estado: 'En implementación' },
          { id: 'r8', codigo: 'REQ-008', requisito: 'Despachos dentro de los horarios permitidos a vehículos de carga en Bogotá.', tipo: 'Del proyecto', fuente: 'Secretaría Distrital de Movilidad', prioridad: 'Media', criterioAceptacion: 'Cero comparendos o inmovilizaciones de vehículos del proyecto.', estado: 'Verificado' },
          { id: 'r9', codigo: 'REQ-009', requisito: 'Memoria de cálculo firmada por ingeniero civil con matrícula profesional vigente.', tipo: 'De los interesados', fuente: 'Interventoría del cliente', prioridad: 'Alta', criterioAceptacion: 'Aprobación escrita de la interventoría.', estado: 'Validado' },
          { id: 'r10', codigo: 'REQ-010', requisito: 'Capacitar al personal del cliente en el uso seguro del andamio antes de liberar cada etapa.', tipo: 'De transición y preparación', fuente: 'Director de obra del cliente', prioridad: 'Media', criterioAceptacion: 'Registro de asistencia por etapa.', estado: 'En implementación' },
          { id: 'r11', codigo: 'REQ-011', requisito: 'Plataforma de descargue en el piso 8 con carga de servicio de 600 kg/m² (CC-002).', tipo: 'De la solución: funcional', fuente: 'Solicitud de cambio CC-002', prioridad: 'Alta', criterioAceptacion: 'Anexo de memoria aprobado y prueba de carga antes del uso.', estado: 'Aprobado' },
          { id: 'r12', codigo: 'REQ-012', requisito: 'Margen bruto mínimo de 18 % sobre el valor del contrato.', tipo: 'Del negocio', fuente: 'Caso de negocio', prioridad: 'Alta', criterioAceptacion: 'Liquidación del contrato con margen ≥ 18 %.', estado: 'Aprobado' },
        ],
        supuestosRequisitos: 'Las losas de la Torre 2 resisten los anclajes del andamio según el concepto del calculista del cliente. El cliente no modifica el andamio ni retira protecciones. La carga de servicio se controla con señalización en cada nivel.',
        dependencias: 'REQ-003 y REQ-004 dependen de que el cliente entregue el frente despejado y de la disponibilidad de su grúa desde el nivel 6. REQ-011 depende de la orden de cambio del cliente.',
      },
    },

    {
      id: 'matriz-trazabilidad',
      name: 'Matriz de trazabilidad de requisitos',
      abbr: 'MTR',
      area: 'alcance', group: 'planificacion', process: '5.2', processes: ['5.2', '5.5', '5.6'],
      kind: 'registro', multiple: false,
      purpose: 'Vincula cada requisito con su origen y lo rastrea hasta el paquete de la EDT, el diseño y la verificación que demuestran que se cumplió.',
      tips: [
        'Actualiza la matriz cuando un cambio aprobado agregue o modifique un requisito; si no, el entregable nuevo queda sin criterio de aceptación.',
        'Usa los mismos códigos de la documentación de requisitos y de la EDT para que la trazabilidad sea directa.',
        'Antes de cada acta de aceptación revisa que todos los requisitos de ese entregable estén verificados.',
      ],
      sections: [
        {
          id: 'matriz', title: 'Matriz',
          fields: [
            {
              key: 'matriz', label: 'Matriz de trazabilidad', type: 'table', addLabel: 'Agregar requisito',
              hint: 'Una fila por requisito, desde su origen hasta su verificación.',
              columns: [
                { key: 'codigoRequisito', label: 'Requisito', type: 'text', width: 90, hint: 'Código de la documentación de requisitos.' },
                { key: 'requisito', label: 'Descripción', type: 'textarea', width: 220 },
                { key: 'origen', label: 'Necesidad u objetivo de origen', type: 'text', width: 200 },
                { key: 'paqueteEdt', label: 'Paquete de la EDT', type: 'text', width: 160 },
                { key: 'entregable', label: 'Entregable', type: 'text', width: 180 },
                { key: 'diseno', label: 'Referencia de diseño', type: 'text', width: 180 },
                { key: 'verificacion', label: 'Verificación o prueba', type: 'textarea', width: 220 },
                { key: 'estado', label: 'Estado', type: 'select', options: ESTADO_REQUISITO },
              ],
            },
          ],
        },
        {
          id: 'control', title: 'Control de la matriz',
          fields: [
            { key: 'responsableMatriz', label: 'Responsable', type: 'text', hint: 'Quién mantiene la matriz actualizada.' },
            { key: 'fechaActualizacion', label: 'Última actualización', type: 'date', hint: 'Fecha de la última revisión completa de la matriz.' },
            { key: 'notasMatriz', label: 'Notas', type: 'textarea', hint: 'Requisitos sin verificar, cambios recientes y pendientes.' },
          ],
        },
      ],
      example: {
        matriz: [
          { id: 'r1', codigoRequisito: 'REQ-001', requisito: 'Cumplir la Resolución 4272 de 2021.', origen: 'Objetivo SST: cero accidentes', paqueteEdt: '1.1 Gestión del proyecto', entregable: 'Plan de rescate y permisos de trabajo', diseno: 'Plan de rescate PR-002 rev. 0', verificacion: 'Auditoría semanal del coordinador SST y de la interventoría.', estado: 'En implementación' },
          { id: 'r2', codigoRequisito: 'REQ-002', requisito: 'Plataformas de 200 kg/m².', origen: 'Pliego técnico del cliente', paqueteEdt: '1.2 Ingeniería', entregable: 'Memoria de cálculo', diseno: 'Memoria MC-001 rev. 0', verificacion: 'Revisión de la memoria por la interventoría e inspección por nivel.', estado: 'Verificado' },
          { id: 'r3', codigoRequisito: 'REQ-003', requisito: 'Cobertura completa de fachada en 15 niveles.', origen: 'Necesidad del cliente: ejecutar la fachada', paqueteEdt: '1.4 Montaje', entregable: 'Andamio montado por etapas', diseno: 'Planos PL-001 a PL-004', verificacion: 'Lista de chequeo y acta de aceptación por etapa.', estado: 'En implementación' },
          { id: 'r4', codigoRequisito: 'REQ-004', requisito: 'Montaje por etapas de cinco niveles.', origen: 'Objetivo de cronograma del cliente', paqueteEdt: '1.4 Montaje', entregable: 'Etapas 1, 2 y 3', diseno: 'Procedimiento de montaje PR-001', verificacion: 'Tarjeta verde por etapa.', estado: 'En implementación' },
          { id: 'r5', codigoRequisito: 'REQ-006', requisito: 'Protección perimetral completa.', origen: 'Objetivo SST: cero accidentes', paqueteEdt: '1.4 Montaje', entregable: 'Accesos y protecciones', diseno: 'Plano PL-005', verificacion: 'Lista de chequeo por nivel.', estado: 'En implementación' },
          { id: 'r6', codigoRequisito: 'REQ-007', requisito: 'Inspección por persona competente.', origen: 'Requisito legal', paqueteEdt: '1.5 Certificación y operación', entregable: 'Certificados de inspección', diseno: 'Formato de inspección FI-01', verificacion: 'Certificado firmado y tarjeta verde.', estado: 'En implementación' },
          { id: 'r7', codigoRequisito: 'REQ-009', requisito: 'Memoria firmada por ingeniero con matrícula.', origen: 'Requisito de la interventoría', paqueteEdt: '1.2 Ingeniería', entregable: 'Memoria de cálculo', diseno: 'Memoria MC-001 rev. 0', verificacion: 'Aprobación escrita de la interventoría del 21 de agosto.', estado: 'Validado' },
          { id: 'r8', codigoRequisito: 'REQ-011', requisito: 'Plataforma de descargue en el piso 8 (CC-002).', origen: 'Necesidad del cliente: recibir material de fachada', paqueteEdt: '1.4 Montaje', entregable: 'Plataforma de descargue', diseno: 'Plano PL-006 rev. 0 y anexo de memoria', verificacion: 'Prueba de carga e inspección antes del uso.', estado: 'Aprobado' },
        ],
        responsableMatriz: 'Ingeniero de diseño',
        fechaActualizacion: '2026-09-15',
        notasMatriz: 'Se agregó REQ-011 por el CC-002. Los requisitos de la etapa 2 (niveles 6 a 10) se verifican antes del acta parcial No. 3.',
      },
    },

    {
      id: 'enunciado-alcance',
      name: 'Enunciado del alcance del proyecto',
      abbr: 'EALC',
      area: 'alcance', group: 'planificacion', process: '5.3', processes: ['5.3'],
      kind: 'documento', multiple: false,
      purpose: 'Describe en detalle el alcance del producto y del proyecto: entregables, criterios de aceptación, exclusiones, supuestos y restricciones. Junto con la EDT y su diccionario forma la línea base del alcance.',
      tips: [
        'Las exclusiones evitan discusiones en obra: deja explícito lo que no incluye (grúa, vigilancia, energía, permisos de espacio público, señalización vial).',
        'Escribe criterios de aceptación medibles e indica quién los verifica (persona competente, interventoría).',
        'Cuando un cambio aprobado modifique el alcance, emite una nueva revisión de este documento y de la EDT.',
      ],
      sections: [
        {
          id: 'producto', title: 'Descripción del alcance del producto',
          fields: [
            { key: 'descripcionProducto', label: 'Descripción del producto', type: 'textarea', from: 'project.description', required: true, hint: 'Características del producto, servicio o resultado que se entrega.' },
            { key: 'alcanceProyecto', label: 'Trabajo del proyecto', type: 'textarea', hint: 'Trabajo necesario para entregar el producto, por fases o grandes bloques.' },
          ],
        },
        {
          id: 'entregables', title: 'Entregables y criterios de aceptación',
          fields: [
            {
              key: 'entregablesAlcance', label: 'Entregables', type: 'table', addLabel: 'Agregar entregable',
              hint: 'Entregables del proyecto con su descripción y criterio de aceptación.',
              columns: [
                { key: 'entregable', label: 'Entregable', type: 'text', width: 200 },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', width: 260 },
                { key: 'criterioAceptacion', label: 'Criterio de aceptación', type: 'textarea', width: 280 },
              ],
            },
            { key: 'criteriosGenerales', label: 'Criterios generales de aceptación', type: 'textarea', hint: 'Condiciones comunes a todos los entregables y quién firma la aceptación.' },
          ],
        },
        {
          id: 'exclusiones', title: 'Exclusiones del proyecto',
          fields: [
            { key: 'exclusiones', label: 'Exclusiones', type: 'list', hint: 'Lo que no hace parte del proyecto, aunque el cliente pueda suponerlo.' },
          ],
        },
        {
          id: 'supuestos', title: 'Supuestos y restricciones',
          fields: [
            { key: 'supuestosAlcance', label: 'Supuestos', type: 'list', hint: 'Condiciones que se dan por ciertas para cumplir el alcance; regístralas también en el registro de supuestos.' },
            { key: 'restriccionesAlcance', label: 'Restricciones', type: 'list', hint: 'Límites de plazo, presupuesto, normativa o condiciones de obra.' },
          ],
        },
      ],
      example: {
        descripcionProducto: 'Sistema de andamio multidireccional de fachada para la Torre 2 del Edificio Altavista (15 pisos, cerca de 4.800 m² de fachada en tres costados), con plataformas de trabajo en todos los niveles, torre de escaleras de acceso, protecciones perimetrales (barandas, rodapiés y malla) y plataforma de descargue en el piso 8; diseñado, montado, certificado, mantenido y retirado por Ingeniería y Alquiler S.A.S.',
        alcanceProyecto: 'Ingeniería (levantamiento, diseño, memoria de cálculo, plan de montaje y plan de rescate); suministro desde bodega (alistamiento, inspección y transporte); montaje en tres etapas de cinco niveles más accesos y protecciones; inspección y certificación por persona competente; alquiler con mantenimiento e inspección semanal en obra; desmontaje, transporte de retorno e inspección de retorno; cierre administrativo y contractual.',
        entregablesAlcance: [
          { id: 'r1', entregable: 'Diseño del andamio', descripcion: 'Planos de montaje, memoria de cálculo, plan de montaje y desmontaje y plan de rescate.', criterioAceptacion: 'Aprobación escrita de la interventoría; memoria firmada por ingeniero con matrícula vigente.' },
          { id: 'r2', entregable: 'Equipo en obra', descripcion: 'Piezas alistadas, inspeccionadas y transportadas.', criterioAceptacion: 'Remisiones firmadas por el residente del cliente sin faltantes; piezas sin daños visibles.' },
          { id: 'r3', entregable: 'Andamio montado por etapas', descripcion: 'Etapas de los niveles 1–5, 6–10 y 11–15.', criterioAceptacion: 'Lista de chequeo aprobada, tarjeta verde de la persona competente y acta de aceptación firmada.' },
          { id: 'r4', entregable: 'Accesos y protecciones', descripcion: 'Torre de escaleras, barandas, rodapiés, malla y plataforma de descargue del piso 8.', criterioAceptacion: 'Inspección sin hallazgos, prueba de carga de la plataforma y visto bueno de la interventoría.' },
          { id: 'r5', entregable: 'Certificación y mantenimiento', descripcion: 'Certificado del andamio completo e informes de inspección semanal.', criterioAceptacion: 'Certificado firmado por persona competente; informes entregados cada semana.' },
          { id: 'r6', entregable: 'Desmontaje y retiro', descripcion: 'Andamio desmontado, transportado a bodega e inspeccionado.', criterioAceptacion: 'Frente entregado libre de equipo y acta de inspección de retorno firmada.' },
        ],
        criteriosGenerales: 'Un entregable se acepta cuando cumple su criterio, ha sido verificado internamente (control de calidad) y lo firma el director de obra del cliente con visto bueno de la interventoría en un acta de aceptación de entregables.',
        exclusiones: [
          'Grúa, montacargas y su operador para el izaje de material (los aporta el cliente).',
          'Vigilancia del equipo en obra fuera de la jornada de trabajo.',
          'Permisos de ocupación del espacio público y plan de manejo de tránsito.',
          'Andamios para la Torre 1 y para trabajos interiores.',
          'Lonas publicitarias o mallas con especificaciones distintas a la estándar.',
          'Reparación de daños causados al equipo por terceros (se facturan según tarifa).',
        ],
        supuestosAlcance: [
          'El cliente entrega el frente despejado y con losas aptas para anclajes.',
          'La grúa del cliente estará disponible 4 horas diarias para izar material desde el nivel 6.',
          'El cliente no modifica el andamio ni retira protecciones sin autorización.',
        ],
        restriccionesAlcance: [
          'Fecha de fin: 18 de diciembre de 2026.',
          'Presupuesto aprobado de COP 486,5 M.',
          'Trabajo en alturas según la Resolución 4272 de 2021 y SG-SST según el Decreto 1072 de 2015.',
          'Despachos solo en los horarios permitidos a vehículos de carga en Bogotá.',
        ],
      },
    },

    {
      id: 'acta-aceptacion-entregable',
      name: 'Acta de aceptación de entregables',
      abbr: 'AAE',
      area: 'alcance', group: 'monitoreo', process: '5.5', processes: ['5.5'],
      kind: 'acta', multiple: true,
      purpose: 'Formaliza la aceptación por parte del cliente de uno o varios entregables verificados, con el resultado de la validación, las observaciones y los compromisos pendientes.',
      tips: [
        'La aceptación la firma el cliente o la interventoría; la verificación interna no es aceptación.',
        'Usa el acta como soporte del acta de obra o de la factura del periodo.',
        'Si se acepta con observaciones, registra cada pendiente con responsable y fecha límite, y ciérralo en la siguiente acta.',
      ],
      sections: [
        {
          id: 'identificacion', title: 'Identificación',
          fields: [
            { key: 'numeroActa', label: 'Número del acta', type: 'text', required: true, hint: 'Consecutivo, p. ej. Acta parcial No. 3.' },
            { key: 'fechaActa', label: 'Fecha', type: 'date', required: true, hint: 'Fecha del recorrido y la firma.' },
            { key: 'proyectoActa', label: 'Proyecto', type: 'text', from: 'project.name', hint: 'Proyecto al que pertenecen los entregables.' },
            { key: 'clienteActa', label: 'Cliente', type: 'text', from: 'project.client', hint: 'Cliente que acepta.' },
            { key: 'lugar', label: 'Lugar', type: 'text', hint: 'Obra, frente o sitio donde se hizo la validación.' },
          ],
        },
        {
          id: 'entregables', title: 'Entregables presentados',
          fields: [
            {
              key: 'entregablesPresentados', label: 'Entregables', type: 'table', addLabel: 'Agregar entregable',
              hint: 'Cada entregable con su criterio de aceptación, el resultado y la evidencia.',
              columns: [
                { key: 'entregable', label: 'Entregable', type: 'textarea', width: 240 },
                { key: 'paqueteEdt', label: 'Paquete de la EDT', type: 'text', width: 140 },
                { key: 'criterio', label: 'Criterio de aceptación', type: 'textarea', width: 240 },
                { key: 'resultado', label: 'Resultado', type: 'select', options: RESULTADO_VERIFICACION },
                { key: 'evidencia', label: 'Evidencia', type: 'textarea', width: 220 },
              ],
            },
          ],
        },
        {
          id: 'resultado', title: 'Resultado de la validación',
          fields: [
            { key: 'decisionAceptacion', label: 'Decisión', type: 'select', options: DECISION_ACEPTACION, required: true, hint: 'Resultado global del acta.' },
            { key: 'observacionesActa', label: 'Observaciones', type: 'textarea', hint: 'Condiciones de la aceptación, motivos de rechazo y compromisos de uso.' },
            {
              key: 'pendientes', label: 'Pendientes', type: 'table', addLabel: 'Agregar pendiente',
              hint: 'Acciones por cerrar, con responsable y fecha límite.',
              columns: [
                { key: 'accion', label: 'Acción', type: 'textarea', width: 300 },
                { key: 'responsable', label: 'Responsable', type: 'text', width: 180 },
                { key: 'fechaLimite', label: 'Fecha límite', type: 'date' },
              ],
            },
          ],
        },
        {
          id: 'firmas', title: 'Firmas',
          fields: [
            { key: 'firmasActa', label: 'Firmas', type: 'table', addLabel: 'Agregar firma', hint: 'Firman quien acepta (cliente o interventoría) y quien entrega.', columns: firmasColumns() },
          ],
        },
      ],
      example: {
        numeroActa: 'Acta parcial No. 2',
        fechaActa: '2026-09-21',
        proyectoActa: EX.name,
        clienteActa: EX.client,
        lugar: 'Obra Edificio Altavista, Torre 2 — Bogotá D.C.',
        entregablesPresentados: [
          { id: 'r1', entregable: 'Andamio montado, niveles 1 a 5 (fachadas norte, oriente y occidente)', paqueteEdt: '1.4 Montaje', criterio: 'Lista de chequeo aprobada, tarjeta verde por nivel y anclajes según planos de montaje rev. 0.', resultado: 'Conforme', evidencia: 'Listas de chequeo LCI-015 a LCI-019 y registro fotográfico.' },
          { id: 'r2', entregable: 'Torre de escaleras de acceso, niveles 1 a 5', paqueteEdt: '1.4 Montaje', criterio: 'Escalones, descansos y barandas completos; inspección aprobada.', resultado: 'Conforme', evidencia: 'Lista de chequeo LCI-020.' },
          { id: 'r3', entregable: 'Protecciones perimetrales, niveles 1 a 5', paqueteEdt: '1.4 Montaje', criterio: 'Barandas de 1,0 m, rodapiés de 15 cm y malla continua.', resultado: 'Conforme con observaciones', evidencia: 'Malla suelta en la esquina nororiental del nivel 3, corregida en sitio durante el recorrido.' },
        ],
        decisionAceptacion: 'Aceptado con observaciones',
        observacionesActa: 'Se acepta la etapa 1 (niveles 1 a 5) a partir de esta fecha. El cliente se compromete a no retirar barandas, rodapiés ni anclajes; cualquier modificación la ejecuta solo personal de Ingeniería y Alquiler con autorización del supervisor de montaje.',
        pendientes: [
          { id: 'r1', accion: 'Instalar señalización de carga máxima en cada nivel.', responsable: 'Supervisor de montaje', fechaLimite: '2026-09-22' },
          { id: 'r2', accion: 'Entregar el registro de capacitación del personal del cliente en el uso seguro del andamio.', responsable: 'Coordinador SST (HSE)', fechaLimite: '2026-09-23' },
        ],
        firmasActa: [
          { id: 'r1', rol: 'Cliente (acepta)', nombre: 'Director de obra del cliente', fecha: '2026-09-21' },
          { id: 'r2', rol: 'Interventoría (visto bueno)', nombre: 'Interventoría del cliente', fecha: '2026-09-21' },
          { id: 'r3', rol: 'Entrega', nombre: 'Director de proyecto', fecha: '2026-09-21' },
        ],
      },
    },

    /* ================================================================== CRONOGRAMA (cap. 6) */
    {
      id: 'plan-gestion-cronograma',
      name: 'Plan de gestión del cronograma',
      abbr: 'PCRO',
      area: 'cronograma', group: 'planificacion', process: '6.1', processes: ['6.1'],
      kind: 'plan', multiple: false,
      purpose: 'Establece cómo se desarrollará, actualizará, monitoreará y controlará el cronograma: metodología, calendario, unidades, nivel de exactitud, umbrales de control y reglas de medición del desempeño.',
      tips: [
        'Usa el calendario de lunes a sábado con festivos de Colombia (Ley 51 de 1983) si la obra trabaja los sábados; el gestor los calcula automáticamente.',
        'Define un día fijo de corte semanal (por ejemplo, el viernes) para registrar el avance y las fechas reales.',
        'Acuerda las reglas de medición antes de iniciar: con "0/100" en la certificación evitas discusiones sobre avances parciales.',
      ],
      sections: [
        {
          id: 'modelo', title: 'Desarrollo del modelo de programación',
          fields: [
            { key: 'metodologia', label: 'Metodología de programación', type: 'select', options: METODOLOGIA_CRONOGRAMA, hint: 'Método con el que se calcula el cronograma.' },
            { key: 'herramienta', label: 'Herramienta', type: 'text', hint: 'Software o herramienta del modelo de programación.' },
            { key: 'calendario', label: 'Calendario laboral', type: 'select', options: CALENDARIO, hint: 'Días laborables de la semana en obra.' },
            { key: 'festivosColombia', label: 'Considerar festivos de Colombia', type: 'check', default: true, hint: 'Excluye del calendario los festivos nacionales.' },
            { key: 'unidadMedida', label: 'Unidad de duración', type: 'select', options: UNIDAD_DURACION, hint: 'Unidad en la que se expresan las duraciones.' },
            { key: 'nivelExactitud', label: 'Nivel de exactitud', type: 'text', hint: 'Rango aceptable de las estimaciones de duración (p. ej. ±10 %).' },
          ],
        },
        {
          id: 'mantenimiento', title: 'Enlaces con la EDT y mantenimiento',
          fields: [
            { key: 'enlaceEdt', label: 'Enlace con la EDT y cuentas de control', type: 'textarea', hint: 'Cómo se asocian las actividades a los paquetes de trabajo y en qué nivel se controla.' },
            { key: 'frecuenciaActualizacion', label: 'Frecuencia de actualización', type: 'select', options: FRECUENCIA, hint: 'Cada cuánto se registra el avance y se recalcula el cronograma.' },
            { key: 'mantenimientoModelo', label: 'Mantenimiento del modelo', type: 'textarea', hint: 'Quién actualiza, con qué datos, en qué fecha de corte y cómo se controla la línea base.' },
          ],
        },
        {
          id: 'umbrales', title: 'Umbrales de control',
          fields: [
            {
              key: 'umbralesCronograma', label: 'Umbrales', type: 'table', addLabel: 'Agregar indicador',
              hint: 'Rangos verde, amarillo y rojo por indicador y la acción que dispara cada uno.',
              columns: [
                { key: 'indicador', label: 'Indicador', type: 'text', width: 220 },
                { key: 'verde', label: 'Verde', type: 'text', width: 110 },
                { key: 'amarillo', label: 'Amarillo', type: 'text', width: 130 },
                { key: 'rojo', label: 'Rojo', type: 'text', width: 110 },
                { key: 'accion', label: 'Acción', type: 'textarea', width: 280 },
              ],
              defaultRows: [
                { indicador: 'Índice de desempeño del cronograma (SPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: analizar causas en el comité. Rojo: plan de recuperación y aviso al patrocinador.' },
                { indicador: 'Desviación de hitos contractuales', verde: '0 días', amarillo: '1 a 5 días hábiles', rojo: '> 5 días hábiles', accion: 'Rojo: solicitud de cambio o plan de recuperación aprobado por el CCB.' },
                { indicador: 'Holgura total de la ruta crítica', verde: '≥ 5 días', amarillo: '1 a 4 días', rojo: '≤ 0 días', accion: 'Revisar secuencia y recursos; evaluar ejecución rápida o intensificación.' },
              ],
            },
          ],
        },
        {
          id: 'medicion', title: 'Medición del desempeño e informes',
          fields: [
            {
              key: 'reglasMedicion', label: 'Reglas para medir el avance', type: 'table', addLabel: 'Agregar tipo de actividad',
              hint: 'Método de valor ganado por tipo de actividad.',
              columns: [
                { key: 'tipoActividad', label: 'Tipo de actividad', type: 'text', width: 220 },
                { key: 'metodo', label: 'Método', type: 'select', options: METODO_VALOR_GANADO },
                { key: 'criterio', label: 'Criterio de medición', type: 'textarea', width: 300 },
              ],
            },
            { key: 'formatosInformes', label: 'Formatos de los informes', type: 'textarea', hint: 'Informes del cronograma, su contenido, destinatarios y frecuencia.' },
          ],
        },
      ],
      example: {
        metodologia: 'Método de la ruta crítica (CPM)',
        herramienta: 'Gestor PMBOK: cronograma de Gantt, diagrama de red y curva S',
        calendario: 'Lunes a sábado',
        festivosColombia: true,
        unidadMedida: 'Días hábiles',
        nivelExactitud: '±10 % en las duraciones de montaje y ±5 % en ingeniería y logística',
        enlaceEdt: 'Cada actividad se asocia a un paquete de trabajo de la EDT. Las cuentas de control son los entregables de nivel 2 (1.1 a 1.6), sobre los que se consolidan fechas, costo y avance.',
        frecuenciaActualizacion: 'Semanal',
        mantenimientoModelo: 'El residente de obra registra el avance físico y las fechas reales cada viernes (fecha de corte). El director actualiza el modelo, revisa la ruta crítica y presenta las variaciones en el comité semanal. La línea base solo cambia con una solicitud de cambio aprobada.',
        umbralesCronograma: [
          { id: 'r1', indicador: 'Índice de desempeño del cronograma (SPI)', verde: '≥ 0,95', amarillo: '0,90 a 0,94', rojo: '< 0,90', accion: 'Amarillo: el director analiza causas en el comité. Rojo: plan de recuperación y aviso a Gerencia General.' },
          { id: 'r2', indicador: 'Desviación de hitos contractuales', verde: '0 días', amarillo: '1 a 5 días hábiles', rojo: '> 5 días hábiles', accion: 'Rojo: solicitud de cambio o plan de recuperación aprobado por el CCB y comunicado al cliente.' },
          { id: 'r3', indicador: 'Holgura total de la ruta crítica', verde: '≥ 5 días', amarillo: '1 a 4 días', rojo: '≤ 0 días', accion: 'Evaluar una segunda cuadrilla (intensificación) o traslapar accesos con el montaje (ejecución rápida).' },
        ],
        reglasMedicion: [
          { id: 'r1', tipoActividad: 'Ingeniería y documentos', metodo: 'Hitos ponderados', criterio: 'Borrador 30 %, enviado a revisión de la interventoría 60 %, aprobado 100 %.' },
          { id: 'r2', tipoActividad: 'Alistamiento y transporte', metodo: 'Unidades completadas', criterio: 'Piezas inspeccionadas o viajes realizados sobre el total previsto.' },
          { id: 'r3', tipoActividad: 'Montaje por etapas', metodo: 'Porcentaje completado', criterio: 'Niveles montados por fachada, verificados por el supervisor; el 100 % solo con la liberación de la persona competente.' },
          { id: 'r4', tipoActividad: 'Inspección y certificación', metodo: 'Fórmula fija 0/100', criterio: 'Se gana al emitir el certificado.' },
          { id: 'r5', tipoActividad: 'Gestión del proyecto y mantenimiento en obra', metodo: 'Nivel de esfuerzo', criterio: 'Proporcional al tiempo transcurrido.' },
        ],
        formatosInformes: 'Informe semanal de avance para el comité de obra: Gantt con línea base y fecha de corte, hitos y ruta crítica. Informe mensual de desempeño para el patrocinador y el cliente: SPI, SV, curva S y pronóstico de fecha de fin.',
      },
    },

    {
      id: 'estimaciones-duracion',
      name: 'Estimaciones de duración (tres valores / PERT)',
      abbr: 'EDUR',
      area: 'cronograma', group: 'planificacion', process: '6.4', processes: ['6.4'],
      kind: 'registro', multiple: false,
      purpose: 'Registra la estimación de duración de cada actividad con tres valores (optimista, más probable y pesimista), el valor esperado PERT y triangular, la desviación estándar y la base de las estimaciones.',
      tips: [
        'PERT (distribución beta) pondera cuatro veces el valor más probable; la triangular da el mismo peso a los tres valores y resulta más conservadora cuando el pesimista es alto.',
        'Sustenta los valores con rendimientos históricos de las cuadrillas (niveles por día, m² de malla por día) y ajusta el pesimista por lluvias y restricciones de horario.',
        'Para una ruta, suma los valores PERT y las varianzas (σ²); la desviación de la ruta es la raíz de esa suma. PERT ± 2σ da cerca de 95 % de confianza.',
      ],
      sections: [
        {
          id: 'parametros', title: 'Parámetros de la estimación',
          fields: [
            { key: 'unidadDuracion', label: 'Unidad de duración', type: 'select', options: UNIDAD_DURACION, default: 'Días hábiles', hint: 'Unidad común a todas las estimaciones.' },
            { key: 'calendarioEstimacion', label: 'Calendario de referencia', type: 'text', hint: 'Días laborables, jornada y festivos considerados.' },
            { key: 'nivelConfianza', label: 'Nivel de confianza adoptado', type: 'select', options: NIVEL_CONFIANZA, hint: 'Con qué confianza se comprometen las duraciones en el cronograma.' },
            { key: 'fechaEstimacion', label: 'Fecha de la estimación', type: 'date', hint: 'Fecha en que se elaboraron o revisaron las estimaciones.' },
          ],
        },
        {
          id: 'estimaciones', title: 'Estimaciones por actividad',
          description: 'PERT = (O + 4M + P) ÷ 6 · Triangular = (O + M + P) ÷ 3 · Desviación σ = (P − O) ÷ 6 · Rango ≈ 95 % = PERT ± 2σ.',
          fields: [
            {
              key: 'estimaciones', label: 'Estimación por tres valores', type: 'table', addLabel: 'Agregar actividad',
              hint: 'Ingresa los tres valores de cada actividad; los valores esperados y el rango se calculan solos.',
              columns: [
                { key: 'codigo', label: 'Código', type: 'text', width: 70 },
                { key: 'actividad', label: 'Actividad', type: 'textarea', width: 220 },
                { key: 'paqueteEdt', label: 'Paquete de la EDT', type: 'text', width: 150 },
                { key: 'optimista', label: 'Optimista (O)', type: 'number', min: 0, max: 9999 },
                { key: 'masProbable', label: 'Más probable (M)', type: 'number', min: 0, max: 9999 },
                { key: 'pesimista', label: 'Pesimista (P)', type: 'number', min: 0, max: 9999 },
                { key: 'pert', label: 'PERT', type: 'calc', calc: calcPert, format: fmtFixed(1), hint: '(O + 4M + P) ÷ 6' },
                { key: 'triangular', label: 'Triangular', type: 'calc', calc: calcTriangular, format: fmtFixed(1), hint: '(O + M + P) ÷ 3' },
                { key: 'desviacion', label: 'Desviación (σ)', type: 'calc', calc: calcDesviacion, format: fmtFixed(2), hint: '(P − O) ÷ 6' },
                { key: 'rango', label: 'Rango ≈ 95 %', type: 'calc', calc: calcIntervalo, format: fmtText, hint: 'PERT − 2σ a PERT + 2σ' },
                { key: 'base', label: 'Base de la estimación', type: 'textarea', width: 240 },
              ],
            },
          ],
        },
        {
          id: 'base', title: 'Base de las estimaciones',
          fields: [
            { key: 'documentacionBase', label: 'Fuentes y método', type: 'textarea', hint: 'Datos históricos, juicio de expertos y técnicas usadas (análoga, paramétrica, tres valores).' },
            { key: 'supuestosEstimacion', label: 'Supuestos', type: 'list', hint: 'Condiciones asumidas: tamaño de cuadrilla, jornada, disponibilidad de equipos del cliente.' },
            { key: 'rangoEstimaciones', label: 'Rango y confianza de la estimación agregada', type: 'textarea', hint: 'Duración esperada de la ruta crítica, su desviación y el rango con el nivel de confianza adoptado.' },
            { key: 'riesgosEstimacion', label: 'Riesgos que influyen en las estimaciones', type: 'textarea', hint: 'Riesgos individuales que amplían el valor pesimista y las actividades que afectan.' },
          ],
        },
      ],
      example: {
        unidadDuracion: 'Días hábiles',
        calendarioEstimacion: 'Lunes a sábado, jornada de 8 horas; no se trabaja los festivos de Colombia.',
        nivelConfianza: '≈ 95 % (esperado ± 2σ)',
        fechaEstimacion: '2026-07-28',
        estimaciones: [
          { id: 'r1', codigo: 'A-01', actividad: 'Levantamiento topográfico y de fachada', paqueteEdt: '1.2 Ingeniería', optimista: 3, masProbable: 4, pesimista: 6, base: 'Histórico: 1 día por cada 4 pisos con dos topógrafos.' },
          { id: 'r2', codigo: 'A-02', actividad: 'Diseño, planos de montaje y memoria de cálculo', paqueteEdt: '1.2 Ingeniería', optimista: 7, masProbable: 9, pesimista: 13, base: 'Proyectos similares 2024–2025 de 12 a 18 pisos; incluye una ronda de comentarios de la interventoría.' },
          { id: 'r3', codigo: 'A-03', actividad: 'Plan de montaje y desmontaje y plan de rescate', paqueteEdt: '1.2 Ingeniería', optimista: 3, masProbable: 4, pesimista: 6, base: 'Plantilla corporativa; revisión del coordinador SST y de la ARL.' },
          { id: 'r4', codigo: 'A-04', actividad: 'Alistamiento e inspección de piezas en bodega', paqueteEdt: '1.3 Suministro y logística', optimista: 4, masProbable: 5, pesimista: 8, base: 'Cerca de 1.000 piezas por día con cuatro operarios; el pesimista incluye clasificar piezas con daño.' },
          { id: 'r5', codigo: 'A-05', actividad: 'Transporte a obra (seis viajes)', paqueteEdt: '1.3 Suministro y logística', optimista: 2, masProbable: 3, pesimista: 5, base: 'Despachos nocturnos por restricción de carga; dos viajes por noche.' },
          { id: 'r6', codigo: 'A-06', actividad: 'Montaje de los niveles 1 a 5', paqueteEdt: '1.4 Montaje', optimista: 14, masProbable: 17, pesimista: 22, base: 'Cuadrilla de seis montadores, 0,3 niveles por día por fachada, incluidos los anclajes.' },
          { id: 'r7', codigo: 'A-07', actividad: 'Montaje de los niveles 6 a 10', paqueteEdt: '1.4 Montaje', optimista: 15, masProbable: 18, pesimista: 24, base: 'Igual que la etapa 1 más izaje con la grúa del cliente (4 horas diarias).' },
          { id: 'r8', codigo: 'A-08', actividad: 'Montaje de los niveles 11 a 15', paqueteEdt: '1.4 Montaje', optimista: 15, masProbable: 18, pesimista: 25, base: 'Exposición al viento en niveles altos; el pesimista supone tres días de lluvia.' },
          { id: 'r9', codigo: 'A-09', actividad: 'Accesos, protecciones y plataforma de descargue', paqueteEdt: '1.4 Montaje', optimista: 7, masProbable: 9, pesimista: 12, base: 'Torre de escaleras de un nivel por día y 400 m² de malla por día.' },
          { id: 'r10', codigo: 'A-10', actividad: 'Inspección y certificación por persona competente', paqueteEdt: '1.5 Certificación y operación', optimista: 2, masProbable: 3, pesimista: 5, base: 'Inspector certificado, cinco niveles por día.' },
          { id: 'r11', codigo: 'A-11', actividad: 'Desmontaje completo', paqueteEdt: '1.6 Desmontaje y retiro', optimista: 10, masProbable: 12, pesimista: 16, base: 'El desmontaje rinde cerca de 1,4 veces el montaje.' },
          { id: 'r12', codigo: 'A-12', actividad: 'Transporte de retorno e inspección de retorno', paqueteEdt: '1.6 Desmontaje y retiro', optimista: 3, masProbable: 4, pesimista: 6, base: 'Incluye conteo y clasificación de daños en bodega.' },
        ],
        documentacionBase: 'Rendimientos históricos de las cuadrillas de Ingeniería y Alquiler (2024–2025) en fachadas de 10 a 20 pisos con andamio multidireccional, juicio de expertos del supervisor de montaje y del ingeniero de diseño, y estimación por tres valores con distribución beta (PERT).',
        supuestosEstimacion: [
          'Cuadrilla de seis montadores certificados por frente.',
          'Grúa del cliente disponible 4 horas diarias para izaje desde el nivel 6.',
          'Jornada de 8 horas de lunes a sábado.',
          'Inventario completo en bodega al iniciar el alistamiento.',
        ],
        rangoEstimaciones: 'Secuencia de ingeniería a certificación (A-01, A-02, A-04 a A-10): suma PERT de 88,8 días hábiles y σ de la ruta de 3,1 días (raíz de la suma de varianzas). Con cerca de 95 % de confianza la secuencia tarda entre 82,6 y 95,1 días hábiles. El cronograma traslapa accesos y protecciones con el montaje de los niveles 11 a 15 para reducir la duración total.',
        riesgosEstimacion: 'Las lluvias de septiembre a noviembre, la disponibilidad de la grúa del cliente y los faltantes de piezas son los riesgos que más amplían el valor pesimista; afectan las actividades A-04 y A-06 a A-09.',
      },
    },
  ];

  PM.registerTemplates(templates);
})();

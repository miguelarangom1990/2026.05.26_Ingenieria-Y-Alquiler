/* ==========================================================================
   97-example-erp-docs-negocio.js — documentos de negocio del ejemplo ágil
   «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
   (94-example-erp.js, SPEC §9.7) con las plantillas de 15-templates-negocio.js:
   - ANTES: evaluación de necesidades (abril de 2026, antes del caso de negocio
     rev. 0), aprobada con la decisión de la Gerencia General de elaborar el caso.
   - ANTES: acuerdo con el cliente. El proyecto es interno, así que es un acuerdo
     interno o memorando de entendimiento entre la Gerencia General
     (patrocinadora) y las áreas usuarias, con la oficina de proyectos (PMO) y TI
     como áreas ejecutoras: presupuesto asignado, dedicación del dueño del
     producto y de los usuarios clave, gobierno y criterios de aceptación de
     cada release. Rev. 0 firmada con el acta de constitución (presupuesto
     preliminar del acta rev. 0) y rev. 1 con el otrosí No. 1 de la LB0
     (presupuesto aprobado), firmado por los mismos nueve firmantes. Las áreas
     con usuario clave son las del catálogo de recursos; contabilidad participa
     con el contador y la firma el gerente administrativo y financiero.
     Decisión sobre el CC-001: no modifica el acuerdo, porque no cambió el
     presupuesto, la fecha de fin ni la dedicación pactada;
     la regla de modificación de la rev. 1 (solo los cambios de nivel 3 del plan
     de gestión de cambios o de la dedicación requieren otrosí) lo deja escrito
     sin citar hechos posteriores a su fecha.
   - DESPUÉS: informe de realización de los beneficios. El cierre es posterior
     al corte, así que solo hay un seguimiento PROGRAMADO (borrador): los
     beneficios del plan de gestión de los beneficios (rev. 2) y del caso de
     negocio (rev. 1) con su indicador, línea base, meta y fecha meta, en estado
     «Pendiente» y sin resultados (sin línea base numérica, la meta tope de los
     rechazos de la DIAN va en el comentario para que el avance no se calcule
     desde 0). Las acciones son de sostenimiento, posteriores al cierre. Se
     mide con los datos del primer mes completo después del cierre, al terminar el cierre contable de ese mes (cinco
     primeros días hábiles del mes siguiente, como la restricción S-05); la
     próxima medición cubre el mes de la meta de cartera, la última de la
     medición mensual de la PMO según el plan de gestión de los beneficios.
   Se registra en PM.exampleDocs.erpParts con la firma (F, ctx). Usa los
   documentos de 95 (PM.exampleDocs.erp) y los de los otros módulos 97 (caso de
   negocio, plan de gestión de los beneficios, requisitos de financiamiento,
   plan para la dirección…): sin el módulo de integración no genera nada. Las
   cifras salen de esos documentos, de F, de ctx.data (LB0, catálogo de
   recursos) o del calendario del proyecto (PM.cal); los supuestos propios
   (fechas de la evaluación, número del memorando) están en
   docs/ejemplo-erp/supuestos-y-fuentes.md. Los documentos aprobados (y sus
   revisiones) no citan hechos posteriores a su fecha. Se usan roles, no
   nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.date || !PM.cal || !PM.fmt) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const ms = (v) => plain(PM.fmt.moneyShort(v, 'COP'));
  const money = (v) => plain(PM.fmt.money(v, 'COP'));
  const n0 = (v) => plain(PM.fmt.num(v, 0));
  const nm = (v) => plain(PM.fmt.num(v, Number.isInteger(v) ? 0 : 1));
  const pc = (x, d) => plain(PM.fmt.pct(x, d || 0));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const monthName = (iso) => plain(PM.fmt.date(iso, 'monthLong'));
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
  const r100k = (v) => Math.round(v / 1e5) * 1e5;
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const noDot = (s) => String(s).replace(/\.\s*$/, '');
  const andList = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);
  const WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  const nw = (n) => (Number.isInteger(n) && n >= 0 && n <= 10 ? WORDS[n] : n0(n));
  /* primer número de un texto con coma decimal («3,8 % de las piezas» → 3.8); null si no tiene */
  const numIn = (s) => { const m = /(\d+(?:,\d+)?)/.exec(plain(s || '')); return m ? parseFloat(m[1].replace(',', '.')) : null; };
  /* «de cerca de 4 % (…) a 0,5 % o menos» → [4, 0.5] (criterios de éxito del caso de negocio rev. 0) */
  const fromTo = (s) => { const m = /: de (?:cerca de )?(\d+(?:,\d+)?)[^]*? a (\d+(?:,\d+)?)/.exec(plain(s || '')); return m ? [numIn(m[1]), numIn(m[2])] : [null, null]; };
  /* fecha escrita en un texto («al 31 de marzo de 2027» → '2027-03-31'); null si no tiene */
  const MONTHS = Array.from({ length: 12 }, (_, i) => plain(PM.fmt.date('2026-' + String(i + 1).padStart(2, '0') + '-01', 'monthLong')).split(' ')[0]);
  const dateIn = (s) => {
    const m = /(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/.exec(plain(s || ''));
    const k = m ? MONTHS.indexOf(m[2]) : -1;
    return k < 0 ? null : m[3] + '-' + String(k + 1).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0');
  };

  const ROLE = {
    pat: 'Gerencia General', po: 'Dueño del producto (Gerente administrativo y financiero)', pof: 'Gerente administrativo y financiero',
    pmo: 'Jefe de la PMO', ti: 'Jefe de TI', con: 'Contador', adop: 'Dueño del producto y jefes de las áreas usuarias',
  };
  const PARTE = { pat: 'Contratante o patrocinador', eje: 'Contratista o área ejecutora', ambas: 'Ambas partes' };
  /* quienes firman el acuerdo interno y cada otrosí (la regla de modificación lo exige): la Gerencia General, el gerente administrativo
     y financiero (dueño del producto y superior de contabilidad), la PMO, TI y el jefe de cada área usuaria (el de
     facturación y cartera firma por esas dos áreas) */
  const FIRMANTES = [
    ['Patrocinadora', ROLE.pat],
    ['Dueño del producto y contabilidad', ROLE.pof],
    ['Área ejecutora: PMO', ROLE.pmo],
    ['Área ejecutora: TI', ROLE.ti],
    ['Área comercial', 'Gerente comercial'],
    ['Logística', 'Coordinador logístico'],
    ['Almacén', 'Jefe de almacén'],
    ['Mantenimiento', 'Jefe de mantenimiento'],
    ['Facturación y cartera', 'Jefe de facturación y cartera'],
  ];
  /* áreas con usuario clave, si el catálogo de recursos no las nombra (rec-uc: seis personas) */
  const AREAS_UC = 'comercial, logística, almacén, mantenimiento, facturación y cartera';

  /* ------------------------------------------------------------------ supuestos del módulo (ejemplo)
     Fechas de la evaluación de necesidades (antes del caso de negocio rev. 0, que se elaboró el 28 de abril de 2026) y
     número del memorando de entendimiento (consecutivo con el código del proyecto). docs/ejemplo-erp/supuestos-y-fuentes.md. */
  const SUP = { evaluacion: '2026-04-14', decision: '2026-04-17', memorando: 'MDE-' };
  /* unidad de cada métrica de éxito de la visión del producto (en su orden) para el informe de beneficios */
  const UNIDAD_VISION = ['días hábiles', '% de las facturas emitidas', '% de las piezas', '% de los m² disponibles', '% de la cartera total'];

  /* ================================================================== módulo
     Se calcula una vez por construcción (ctx): el módulo de integración lo llama como par y el constructor lo llama
     después; la marca «busy» evita la recursión cuando este módulo llama a los demás. */
  const memo = new WeakMap();
  function part(F, ctx) {
    if (ctx && typeof ctx === 'object' && memo.has(ctx)) return cp(memo.get(ctx));
    if (part.busy) return {};
    part.busy = true;
    let out = {};
    try { out = build(F, ctx) || {}; } finally { part.busy = false; }
    if (ctx && typeof ctx === 'object') memo.set(ctx, out);
    return cp(out);
  }

  function build(F, ctx) {
    const { R, CODE, data } = ctx || {};
    if (!F || !data || !data.schedule || !Array.isArray(data.baselines) || !data.resources) return {};
    const { schedule, baselines, resources } = data;
    const START = F.start, END = F.end, LB0 = F.lb0Date;
    const cal = PM.cal.make(schedule.settings, START);
    const LB = ((baselines.find((b) => b && b.data && b.data.number === 0) || baselines[0]) || {}).data;
    if (!LB || !LB.schedule || !LB.cost) return {};
    const lbTask = (id) => LB.schedule.tasks.find((t) => t.id === id) || {};
    const task = (id) => schedule.tasks.find((t) => t.id === id) || {};
    const catItem = (key) => (resources.items || []).find((x) => x.id === 'rec-' + key) || {};
    const ded = (it) => (it.dedication === undefined || it.dedication === null ? 100 : it.dedication);

    /* documentos de 95 y de los otros módulos 97 */
    const base = PM.exampleDocs && typeof PM.exampleDocs.erp === 'function' ? PM.exampleDocs.erp(F) || {} : {};
    const peers = {};
    for (const fn of (PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts)) ? PM.exampleDocs.erpParts : []) {
      if (fn === part || typeof fn !== 'function') continue;
      let p = null;
      try { p = fn(F, ctx); } catch (e) { p = null; }
      if (p && typeof p === 'object') for (const k of Object.keys(p)) if (!(k in peers)) peers[k] = p[k];
    }
    const entryOf = (tid) => base[tid] || peers[tid] || null;
    const fieldsAt = (tid, rev) => {
      const e = entryOf(tid);
      if (!e) return null;
      if (rev === undefined || String(e.rev) === String(rev)) return e.fields || null;
      const r = (e.revs || []).find((x) => String(x.rev) === String(rev));
      return r ? r.fields || e.fields || null : null;
    };
    const BEN = PM.exampleDocs && PM.exampleDocs.erpIntegracion && PM.exampleDocs.erpIntegracion.BEN;
    const caso = fieldsAt('caso-negocio'), caso0 = fieldsAt('caso-negocio', '0'), pben = fieldsAt('plan-gestion-beneficios');
    const acta = fieldsAt('acta-constitucion'), acta0 = fieldsAt('acta-constitucion', '0');
    const vision = fieldsAt('vision-producto');
    if (!BEN || !caso || !caso0 || !pben || !acta || !acta0 || !vision) return {};
    /* última revisión aprobada de un documento a una fecha (sin el documento, la referencia va sin revisión) */
    const revAt = (tid, at) => {
      const e = entryOf(tid);
      if (!e) return undefined;
      const list = [...(e.revs || []).map((r) => [r.rev, r.status || 'aprobado', r.date]), [e.rev, e.status, e.date]].filter(([rv, st, d]) => st === 'aprobado' && d && d <= at && /^\d+$/.test(String(rv)));
      list.sort((a, b) => String(a[2]).localeCompare(String(b[2])) || Number(a[0]) - Number(b[0]));
      return list.length ? String(list[list.length - 1][0]) : undefined;
    };
    const ref = (tid, at) => { const rv = revAt(tid, at); return CODE + '-' + ((PM.templates[tid] && PM.templates[tid].abbr) || 'DOC') + (rv !== undefined ? ' rev. ' + rv : ''); };
    const NAME = acta.nombreProyecto;
    const golive1 = F.milestones.t29.actual;
    const R1_REVIEW = cal.addWork(golive1, 1);           // revisión del caso de negocio al cierre del release 1 (integración)
    const lbBac = LB.cost.bac, lbCont = LB.cost.contingency, lbMan = LB.cost.management;

    /* ================================================================ 4.1 · EVALUACIÓN DE NECESIDADES (abril de 2026) */
    const crit0 = caso0.criteriosExito || [];
    const critOf = (re) => crit0.find((s) => re.test(plain(s))) || '';
    const [diasA, diasD] = fromTo(critOf(/^Cierre mensual/));
    const [invA, invD] = fromTo(critOf(/^Diferencia entre el inventario/));
    const [utilA, utilD] = fromTo(critOf(/^Utilización/));
    const [carA, carD] = fromTo(critOf(/^Cartera vencida/));
    const rechD = numIn(critOf(/^Facturas electrónicas rechazadas/));
    const opc0 = caso0.opciones || [];
    const opcName = (letter) => (opc0.find((o) => o.opcion.startsWith(letter + '.')) || {}).opcion || letter;
    const evaluacion = {
      nombre: NAME,
      origen: 'Crear, mejorar o reparar un producto, proceso o servicio',
      solicitante: 'Gerente administrativo y financiero, con el coordinador logístico, el jefe de almacén y el jefe de facturación y cartera',
      patrocinador: ROLE.pat,
      responsableAnalisis: 'Jefe de la PMO, con el gerente administrativo y financiero y el jefe de TI',
      fechaEvaluacion: SUP.evaluacion,
      problema: 'Los equipos en alquiler, las remisiones de entrega y devolución y la liquidación del alquiler se controlan en hojas de cálculo separadas por área; el software contable registra la factura al final del mes sin conocer el estado de los equipos y la factura electrónica se emite a mano en el portal del proveedor tecnológico. El corte mensual de alquileres tarda hasta ' + nw(diasA) + ' días hábiles, el inventario de la bodega no coincide con el de las obras, los faltantes y daños se detectan días después y sin soporte para cobrarlos, y la cartera se conoce con una semana de retraso. Con más obras activas en Bogotá y la Sabana, la operación no crece sin más personal administrativo y la Gerencia General decide compras de inventario sin datos de utilización.',
      objetivosOrganizacion: 'Plan estratégico 2026–2028: controlar el inventario en alquiler y facturar a tiempo, y crecer en alquiler en Bogotá y la Sabana sin aumentar el personal administrativo. La utilización del andamio multidireccional es la base para decidir inversiones en inventario.',
      urgencia: 'Cada mes con más obras activas el cierre exige más horas de digitación y conciliación. Ninguna salida a producción puede caer en el cierre mensual ni en el cierre anual, así que conviene empezar en mayo de 2026 para tener el primer módulo (inventario y alquiler) en producción en el segundo semestre y el último después del cierre anual.',
      brechas: rows('br', [
        { aspecto: 'Cierre mensual de facturación de alquileres', actual: 'Hasta ' + nw(diasA) + ' días hábiles: la liquidación se arma en hojas de cálculo con las remisiones y las actas en papel.', deseada: 'Facturar el alquiler el mismo día del corte: cierre en ' + nw(diasD) + ' día hábil.', indicador: 'Días hábiles del cierre mensual de facturación', valorActual: diasA, valorDeseado: diasD },
        { aspecto: 'Factura electrónica', actual: 'Se emite a mano en el portal del proveedor tecnológico, sin conexión con el control de equipos ni con la cartera.', deseada: 'Factura electrónica emitida desde el sistema y validada por la DIAN, con menos de ' + nm(rechD) + ' % de rechazos.', indicador: 'Facturas rechazadas por la DIAN (% de las emitidas); hoy no hay línea base', valorActual: null, valorDeseado: rechD },
        { aspecto: 'Inventario por bodega y obra', actual: 'El inventario de la bodega no coincide con el de las obras: la diferencia frente al conteo físico se estima cerca de ' + nm(invA) + ' % de las piezas y se medirá en el descubrimiento.', deseada: 'Inventario confiable por bodega, obra y estado, con diferencia de ' + nm(invD) + ' % o menos en los conteos.', indicador: 'Diferencia entre el inventario físico y el del sistema (% de las piezas)', valorActual: invA, valorDeseado: invD },
        { aspecto: 'Utilización del andamio multidireccional', actual: 'Almacén estima cerca de ' + nm(utilA) + ' % de los m² alquilados y la medirá con el inventario de julio; no hay disponibilidad en línea por bodega y obra.', deseada: nm(utilD) + ' % o más, sin comprar más equipo.', indicador: 'm² alquilados ÷ m² disponibles (%)', valorActual: utilA, valorDeseado: utilD },
        { aspecto: 'Cartera', actual: nm(carA) + ' % de la cartera total está vencida a más de 60 días y se conoce con una semana de retraso.', deseada: nm(carD) + ' % o menos, con la cartera por edades al día y bloqueo de despachos a clientes en mora.', indicador: 'Cartera vencida a más de 60 días ÷ cartera total (%)', valorActual: carA, valorDeseado: carD },
        { aspecto: 'Capacidad interna para implementar', actual: 'No hay un sistema integrado ni un equipo interno que pueda implementarlo: TI tiene un jefe y un analista.', deseada: 'Socio implementador con experiencia en alquiler de equipos, un usuario clave por área con dedicación pactada y datos maestros depurados.', indicador: '', valorActual: null, valorDeseado: null },
      ]),
      causas: [
        'Hojas de cálculo y sistemas separados para equipos, remisiones y facturación: cada área digita los mismos datos.',
        'Remisiones y actas de entrega y devolución en papel, que llegan a facturación días después del corte.',
        'Sin trazabilidad por pieza entre bodegas y obras: los faltantes y daños se detectan tarde y sin soporte para cobrarlos.',
        'Factura electrónica emitida a mano en el portal del proveedor tecnológico, por fuera del control de equipos.',
        'Crecimiento de las obras activas sin un sistema que escale sin más personal administrativo.',
      ],
      afectados: rows('af', [
        { interesado: ROLE.pat, afectacion: 'Decide inversiones en inventario, tarifas y crédito sin indicadores diarios; la operación no crece sin más personal administrativo.', expectativa: 'Tablero diario de utilización del inventario, ingresos y cartera.', grado: 'Alto' },
        { interesado: 'Gerente administrativo y financiero (facturación, cartera y contabilidad)', afectacion: 'El cierre de facturación tarda hasta ' + nw(diasA) + ' días hábiles y la cartera se conoce con una semana de retraso.', expectativa: 'Cierre de facturación en un día y cartera vencida de ' + nm(carD) + ' % o menos.', grado: 'Alto' },
        { interesado: 'Coordinador logístico', afectacion: 'Llama a la bodega para saber qué hay disponible y digita dos veces las remisiones.', expectativa: 'Despachar sin llamar a la bodega.', grado: 'Alto' },
        { interesado: 'Jefe de almacén y personal de bodega', afectacion: 'Concilian a mano el inventario al final del mes y registran en papel las entregas y las devoluciones.', expectativa: 'Menos trabajo de conciliación y equipos fáciles de usar en el patio y sin conexión.', grado: 'Alto' },
        { interesado: 'Jefe de facturación y cartera', afectacion: 'Liquida el alquiler en hojas de cálculo y emite cada factura electrónica a mano.', expectativa: 'Prefactura desde las actas y factura electrónica sin rechazos.', grado: 'Alto' },
        { interesado: 'Jefe de mantenimiento', afectacion: 'Recibe los equipos sin historial: no puede programar el preventivo ni soportar el cobro de daños.', expectativa: 'Programar el preventivo y cobrar los daños con soporte.', grado: 'Medio' },
        { interesado: 'Gerente comercial', afectacion: 'Cotiza y compromete entregas sin conocer la disponibilidad real.', expectativa: 'Comprometer entregas con datos reales.', grado: 'Medio' },
        { interesado: 'Clientes de alquiler (obras)', afectacion: 'Reciben la factura días después del corte y cobros de faltantes y daños sin soporte.', expectativa: 'Factura oportuna y cobros con el soporte del acta de devolución.', grado: 'Medio' },
      ]),
      opciones: rows('op', [
        { opcion: opcName('A'), descripcion: 'Seguir con las hojas de cálculo, el software contable y la factura electrónica en el portal del proveedor tecnológico.', atiende: 'No', ventajas: 'Sin inversión ni esfuerzo de las áreas.', desventajas: 'Las brechas siguen y crecen con las obras activas: no se puede crecer en alquiler sin más personal administrativo.', pasaCaso: true },
        { opcion: opcName('B'), descripcion: 'Conectar la facturación electrónica al software contable y llevar el inventario en una aplicación de bodega independiente.', atiende: 'Parcialmente', ventajas: 'Inversión y plazo menores.', desventajas: 'No resuelve la disponibilidad por obra, la utilización, la cartera ni el mantenimiento, y deja dos fuentes de datos por conciliar.', pasaCaso: true },
        { opcion: opcName('C'), descripcion: 'ERP de mercado medio en la nube con un socio implementador, entregado por releases: primero inventario y alquiler.', atiende: 'Sí', ventajas: 'Cubre las brechas medibles con una sola fuente de datos, entrega valor desde el primer release y no requiere servidores propios.', desventajas: 'Exige depurar los datos maestros, pactar la dedicación de los usuarios clave e integrar el proveedor tecnológico de facturación electrónica.', pasaCaso: true },
        { opcion: opcName('D'), descripcion: 'ERP con licencia perpetua, servidores en la sede y desarrollos a la medida, con una sola salida a producción.', atiende: 'Sí', ventajas: 'Control total de la solución y de los desarrollos.', desventajas: 'Inversión y soporte altos, beneficios más tardíos y todo el alcance en una sola fecha; TI tendría que operar los servidores.', pasaCaso: true },
      ]),
      recomendacion: 'Elaborar el caso de negocio con las cuatro opciones y presentarlo a la Gerencia General con el acta de constitución. Antes de cerrarlo hay que estimar el presupuesto de orden de magnitud con referencias de mercado de la suscripción en la nube y de la implementación, estimar los beneficios con las líneas base de esta evaluación (la diferencia de inventario se medirá en el descubrimiento y la utilización, con el inventario de julio) y pactar con las áreas, en un acuerdo interno, la dedicación del dueño del producto y de los usuarios clave.',
      criteriosEvaluacion: [
        'Cobertura de las brechas: cierre de facturación, factura electrónica, inventario, utilización y cartera.',
        'Beneficio neto a tres años de operación, después de la suscripción y de la inversión.',
        'Valor temprano: un primer release útil antes de terminar el proyecto.',
        'Riesgos de los datos maestros, de la disponibilidad de los usuarios clave y de la integración con la DIAN.',
        'Capacidad de TI para operar la solución sin servidores propios.',
      ],
      supuestosRestricciones: [
        'La factura electrónica cumple el anexo técnico vigente de la DIAN y se emite por medio de un proveedor tecnológico autorizado.',
        'Ninguna salida a producción en los cinco primeros días hábiles de cada mes (cierre mensual) ni durante el cierre anual.',
        'Los saldos migrados de inventario y cartera los concilian y aprueban contabilidad y la revisoría fiscal.',
        'El proyecto se financia con recursos propios de la empresa, sin crédito.',
        'Los usuarios clave mantienen su operación diaria: su dedicación al proyecto se pacta con la Gerencia General.',
      ],
      decision: 'Elaborar el caso de negocio',
      fechaDecision: SUP.decision,
    };

    /* ================================================================ 4.1 · ACUERDO INTERNO (memorando de entendimiento) */
    const valorInicial = acta0.presupuesto;
    const budget = F.budget;
    const po = catItem('po'), uc = catItem('uc'), sm = catItem('sm'), dir = catItem('dir');
    const poHours = (ded(po) / 100) * (po.hoursPerDay || 8);
    /* áreas usuarias: las del usuario clave del catálogo de recursos (contabilidad participa con el contador, rec-con) */
    const areas = (/usuario clave de (.+?) \(/.exec(plain(uc.notes || '')) || [])[1] || AREAS_UC;
    const rf0 = fieldsAt('requisitos-financiamiento', '0');
    const tramos = rf0 && Array.isArray(rf0.periodos) ? rf0.periodos.filter((p) => p.financiamiento > 0) : [];
    const umbral = (n) => ((fieldsAt('plan-gestion-cambios') || {}).umbrales || []).find((u) => u.nivel === 'Nivel ' + n) || null;
    const releaseHitos = (f) => (f.hitos || []).filter((h) => /^Release \d en producción$/.test(h.hito));
    const plazoTxt = n0(D.diff(START, END) + 1) + ' días calendario (' + n0(cal.countWork(START, END)) + ' días hábiles con el calendario del proyecto), del ' + dl(START) + ' al ' + dl(END) + ': hasta el cierre, después de la estabilización del último release.';
    const acuFields = (stage) => {
      const at = stage >= 1 ? LB0 : START;
      const actaS = stage >= 1 ? acta : acta0;
      const u1 = umbral(1), u2 = umbral(2), u3 = umbral(3);
      const hitosTxt = releaseHitos(actaS).map((h) => lc(h.hito) + ' el ' + dl(h.fecha) + ' (' + lc(noDot(h.criterio)) + ')');
      return {
        tipoAcuerdo: 'Acuerdo interno o memorando de entendimiento',
        numeroAcuerdo: SUP.memorando + CODE,
        objeto: 'Acuerdo interno para implementar el ERP de mercado medio en la nube por releases (proyecto interno ' + CODE + '): la Gerencia General asigna el presupuesto y gobierna el proyecto; las áreas usuarias —' + areas + '— se comprometen con la dedicación del dueño del producto y de sus usuarios clave, la depuración de sus datos y la aceptación de cada release; contabilidad, por medio del contador, concilia los saldos migrados, y la oficina de proyectos (PMO) y TI lo ejecutan con el fabricante del ERP y el socio implementador' + (stage >= 1 ? ' contratados.' : ' que se contraten.'),
        contratante: 'Gerencia General (patrocinadora) de Ingeniería y Alquiler S.A.S.',
        contratista: 'Oficina de proyectos (PMO) y TI, con las áreas usuarias (' + areas + ') y contabilidad',
        modalidadPrecio: 'Presupuesto interno asignado',
        fechaFirma: START,
        fechaInicio: START,
        fechaTerminacion: END,
        plazo: plazoTxt,
        valorInicial,
        baseValor: 'No aplica (acuerdo interno)',
        anticipoPct: 0,
        anticipoValor: 0,
        retencionPct: 0,
        formaPago: stage >= 1
          ? 'No hay pagos entre las partes. La Gerencia General libera el presupuesto en ' + nw(tramos.length) + ' tramos que suman ' + ms(sum(tramos, (p) => p.financiamiento)) + ', la línea base de costos (requisitos de financiamiento, ' + ref('requisitos-financiamiento', at) + '): el primero con el acta de constitución, el segundo al firmar los contratos y, desde el tercero, cada uno con la revisión del caso de negocio al cierre de un release. La reserva de gestión (' + ms(lbMan) + ') queda en la tesorería. Los pagos a los proveedores siguen las condiciones de sus contratos (registro de contratos y acuerdos, ' + ref('registro-adquisiciones', at) + '). Las horas internas de los usuarios clave y del personal de bodega se imputan al proyecto con el costo del catálogo de recursos y se pagan con la nómina de cada área; el tiempo del dueño del producto no se imputa.'
          : 'No hay pagos entre las partes. La Gerencia General libera el presupuesto por tramos: el primero con el acta de constitución y los siguientes según el valor que confirme la revisión del caso de negocio al cierre de cada release. Los pagos a los proveedores seguirán las condiciones de sus contratos. Las horas internas de los usuarios clave se imputan al proyecto con el costo del catálogo de recursos y se pagan con la nómina de cada área; el tiempo del dueño del producto no se imputa.',
        polizas: [],
        obligaciones: rows('ob', [
          { parte: PARTE.pat, obligacion: stage >= 1 ? 'Asignar el presupuesto aprobado de ' + ms(budget) + ' y liberarlo por tramos según la revisión del caso de negocio al cierre de cada release.' : 'Asignar el presupuesto preliminar de ' + ms(valorInicial) + ' y liberarlo por tramos según la revisión del caso de negocio al cierre de cada release.', clausula: 'Presupuesto', responsable: ROLE.pat },
          { parte: PARTE.pat, obligacion: 'Presidir el comité quincenal de seguimiento y la revisión de cierre de cada release, y aprobar el acta de cierre del proyecto.', clausula: 'Gobierno', responsable: ROLE.pat },
          { parte: PARTE.pat, obligacion: stage >= 1 && u3 ? 'Decidir los cambios de nivel 3 (' + lc(noDot(u3.criterio)) + ') y autorizar el uso de la reserva de gestión.' : 'Decidir los cambios al presupuesto, a la fecha de fin y a la dedicación pactada en este acuerdo.', clausula: 'Gobierno', responsable: ROLE.pat },
          { parte: PARTE.eje, obligacion: 'Dueño del producto: dedicar al menos ' + nw(poHours) + ' horas diarias (' + ded(po) + ' % de su jornada) a refinar y ordenar el backlog y a aceptar o rechazar los incrementos en la revisión de cada iteración. Su tiempo no se imputa al presupuesto del proyecto.', clausula: 'Dedicación', responsable: ROLE.po },
          { parte: PARTE.eje, obligacion: 'Asignar un usuario clave por área usuaria (' + areas + ': ' + nw(uc.availability) + ' en total), con suplente, que asista al refinamiento, a la revisión de cada iteración de su release y a la prueba de aceptación, con su agenda fuera del cierre mensual. Las horas de los talleres, la depuración de datos, la formación y la capacitación se imputan al proyecto a ' + money(uc.unitCost) + ' por día.', clausula: 'Dedicación', responsable: 'Jefes de las áreas usuarias' },
          { parte: PARTE.eje, obligacion: 'Depurar los datos maestros de cada área y conciliar los saldos migrados de inventario y cartera, con la aprobación de contabilidad y de la revisoría fiscal antes de cada salida a producción.', clausula: 'Datos', responsable: ROLE.con + ' y jefes de las áreas usuarias' },
          { parte: PARTE.eje, obligacion: 'Dirigir el proyecto (jefe de la PMO al ' + ded(dir) + ' % y Scrum Master al ' + ded(sm) + ' %): plan, líneas base, informe quincenal, control de cambios y contratos con el fabricante del ERP y el socio implementador dentro del presupuesto.', clausula: 'Dirección', responsable: R.dir },
          { parte: PARTE.eje, obligacion: 'Proveer los ambientes, los equipos de bodega, la seguridad y los respaldos, y recibir el soporte al terminar la estabilización; desde entonces el soporte va con el presupuesto de operación de TI.', clausula: 'Infraestructura y soporte', responsable: ROLE.ti },
          { parte: PARTE.ambas, obligacion: 'Usar el ERP como única fuente de cada proceso y retirar las hojas de cálculo de control al salir cada release.', clausula: 'Adopción', responsable: ROLE.adop },
        ]),
        supervision: 'Gerencia General, en el comité quincenal de seguimiento y en la revisión de cierre de cada release; el dueño del producto acepta o rechaza los incrementos.',
        responsableContratista: 'Director de proyecto (jefe de la PMO). Firman este acuerdo y cada otrosí la Gerencia General, el jefe de la PMO, el jefe de TI, el jefe de cada área usuaria (el de facturación y cartera, por esas dos áreas) y el gerente administrativo y financiero, como dueño del producto y por contabilidad.',
        condicionesAceptacion: actaS.requisitosAprobacion + ' Salidas a producción del acta de constitución (' + ref('acta-constitucion', at) + '): ' + andList(hitosTxt) + '. Ninguna salida cae en los cinco primeros días hábiles del mes.',
        multas: 'No aplican multas ni cláusula penal entre áreas de la misma empresa. Si un área no cumple la dedicación pactada, el director de proyecto lo presenta en el comité quincenal y la Gerencia General decide; si el incumplimiento cambia la fecha de un release, se tramita ' + (stage >= 1 ? 'una solicitud de cambio según el plan de gestión de cambios (' + ref('plan-gestion-cambios', at) + ').' : 'como un cambio que decide la Gerencia General.'),
        suspensionTerminacion: 'La Gerencia General puede no liberar el tramo siguiente, diferir un release o cancelar el proyecto si la revisión del caso de negocio al cierre de un release no confirma su valor; en ese caso se cierra lo entregado y se documentan las lecciones (criterios de salida del acta de constitución).',
        otrasClausulas: 'Restricciones que las áreas exigen al proyecto: ' + (actaS.requisitosAltoNivel || []).filter((x) => /DIAN|cierre mensual/.test(x)).map((x) => lc(noDot(x))).join('; ') + '. Garantías: entre áreas de la misma empresa no se exigen pólizas; las de los proveedores van en sus contratos. Los datos de clientes, tarifas y cartera que se usen en las pruebas y en la migración solo se usan para el proyecto.',
        documentosContractuales: stage >= 1
          ? [
            'Este acuerdo interno (' + SUP.memorando + CODE + ') y su otrosí No. 1',
            'Acta de constitución del proyecto (' + ref('acta-constitucion', at) + ')',
            'Plan para la dirección del proyecto (' + ref('plan-direccion', at) + ') y plan de releases (' + ref('plan-release', at) + '), con la línea base LB0',
            'Plan de gestión de cambios (' + ref('plan-gestion-cambios', at) + ')',
            'Requisitos de financiamiento del proyecto (' + ref('requisitos-financiamiento', at) + ')',
            'Caso de negocio (' + ref('caso-negocio', at) + ') y plan de gestión de los beneficios (' + ref('plan-gestion-beneficios', at) + ')',
          ]
          : [
            'Este acuerdo interno (' + SUP.memorando + CODE + ')',
            'Acta de constitución del proyecto (' + ref('acta-constitucion', at) + ')',
            'Caso de negocio (' + ref('caso-negocio', at) + ') y plan de gestión de los beneficios (' + ref('plan-gestion-beneficios', at) + ')',
          ],
        modificaciones: stage >= 1
          ? rows('mo', [{
            numero: 'Otrosí No. 1', tipo: 'Otrosí', fecha: LB0,
            objeto: 'Presupuesto aprobado de ' + ms(budget) + ' con la LB0 (BAC de ' + ms(lbBac) + ', reserva para contingencias de ' + ms(lbCont) + ' y reserva de gestión de ' + ms(lbMan) + ') en lugar del preliminar de ' + ms(valorInicial) + '; tramos del financiamiento y criterios de aceptación de los tres releases. El plazo no cambia.',
            solicitudCambio: '', efectoValor: budget - valorInicial, efectoPlazo: D.diff(acta0.fechaFin, acta.fechaFin), estado: 'Firmada',
          }])
          : [],
        controlModificaciones: stage >= 1 && u1 && u2 && u3
          ? 'Las modificaciones las propone el director de proyecto, las aprueba la Gerencia General y las firman como otrosí quienes firman este acuerdo. Requieren otrosí los cambios de nivel 3 del plan de gestión de cambios (' + lc(noDot(u3.criterio)) + ') y los de la dedicación pactada. Los de nivel 1 (' + lc(noDot(u1.criterio)) + '; decide el ' + lc(u1.aprobador) + ') y los de nivel 2 (' + lc(noDot(u2.criterio)) + '; decide el ' + lc(u2.aprobador) + ') se registran en el registro de cambios y no modifican este acuerdo.'
          : 'Las modificaciones del presupuesto, de la fecha de fin o de la dedicación pactada las propone el director de proyecto, las aprueba la Gerencia General y las firman como otrosí quienes firman este acuerdo. Los ajustes del alcance dentro de cada release los decide el dueño del producto y no modifican este acuerdo; el plan de gestión de cambios fijará los niveles de decisión con la línea base.',
        /* el otrosí No. 1 cambia el presupuesto y los criterios de aceptación de los tres releases: lo firman todos */
        firmas: rows('fi', [
          ...FIRMANTES.map(([rol, nombre]) => ({ rol, nombre, fecha: START })),
          ...(stage >= 1 ? FIRMANTES.map(([rol, nombre]) => ({ rol: rol + ' (otrosí No. 1)', nombre, fecha: LB0 })) : []),
        ]),
      };
    };

    /* ================================================================ 4.7 · INFORME DE BENEFICIOS (seguimiento programado) */
    /* primer mes completo después del cierre; se mide al terminar su cierre contable (cinco primeros días hábiles del mes
       siguiente); la próxima medición, el mes siguiente */
    const measureOf = (k) => {
      const from = D.addMonths(D.startOfMonth(END), k);
      const to = D.add(D.addMonths(from, 1), -1);
      const at = cal.addWork(cal.dateOf(cal.indexOf(D.addMonths(from, 1))), 5);
      return { from, to, at };
    };
    const M1 = measureOf(1), M2 = measureOf(2);
    const VIS = vision.metricasExito || [];
    const dayCost = catItem('uc').unitCost;
    const comp = {
      fuga: r100k(BEN.ingresos * BEN.fuga),
      util: r100k(BEN.m2 * (BEN.utilMeta - BEN.utilBase) * BEN.tarifa * 12 * BEN.atribucion * BEN.margen),
      cartera: r100k(BEN.cartera * (BEN.carteraBase - BEN.carteraMeta) * BEN.tasa),
      tiempo: r100k(BEN.diasPersona * dayCost),
    };
    const annual = comp.fuga + comp.util + comp.cartera + comp.tiempo;
    const ramp0 = BEN.rampa[0];
    const fullYear = BEN.years[BEN.rampa.findIndex((x) => x >= 1)] || BEN.years[BEN.years.length - 1];
    const fullYearEnd = fullYear + '-12-31';
    const migNote = /(\d+,\d+)\s*%/.exec(task('t17').notes || '');
    const lastGolive = lbTask('t33').start || END;
    const neto = caso.valorContrato - caso.costoEstimado;
    const VIS_NOTE = [
      'Se mide en cada cierre mensual con el reporte de facturación del ERP desde la salida del release 2.',
      'Sin línea base numérica: hoy la factura se emite a mano en el portal del proveedor tecnológico. Meta: menos de ' + nm(numIn(VIS[1] && VIS[1].meta)) + ' % de las emitidas. La meta es un tope sin línea base, así que no va en la columna «Meta» y el avance hacia la meta no se calcula: se compara el resultado con el tope. Se mide con el reporte de rechazos del proveedor tecnológico desde la salida del release 2.',
      'Se mide con el conteo cíclico mensual de bodega desde ' + monthName(D.addMonths(D.startOfMonth(golive1), 1)) + '.' + (migNote ? ' Primera medición al cierre del release 1: ' + migNote[1] + ' % de diferencia en la migración del inventario de la bodega principal (no es todavía el conteo cíclico).' : ''),
      'Se mide cada mes con el inventario por bodega, obra y estado del ERP (m² alquilados y disponibles) hasta que lo reemplace el tablero gerencial del release 3.',
      'Se mide con la cartera por edades del ERP desde la salida del release 2; su fecha meta es la última de la medición mensual de la PMO.',
    ];
    const benRow = (b) => {
      const owner = 'Responsable: ' + b.responsable + '. ';
      const vi = VIS.findIndex((m) => m.metrica === b.metrica);
      if (vi >= 0) {
        const m = VIS[vi];
        /* sin línea base numérica la meta va en el comentario y no en la tabla: la plantilla tomaría 0 como línea base y,
           para una meta que es un tope («menos de 1 %»), el avance calculado sería falso (2 % de rechazos daría 200 %) */
        const lb = numIn(m.lineaBase);
        return { beneficio: b.beneficio, indicador: b.metrica, unidad: UNIDAD_VISION[vi] || '', lineaBase: lb, meta: lb === null ? null : numIn(m.meta), fechaMeta: m.fecha, resultado: null, estado: 'Pendiente', comentario: owner + (VIS_NOTE[vi] || '') };
      }
      if (/[Ff]acturación recuperada/.test(b.beneficio)) {
        return { beneficio: b.beneficio, indicador: b.metrica, unidad: 'COP al año', lineaBase: 0, meta: comp.fuga, fechaMeta: fullYearEnd, resultado: null, estado: 'Pendiente', comentario: owner + 'Meta a plena adopción (' + fullYear + '). Se mide cada año frente a la base de ' + BEN.baseYear + ' con la facturación por concepto del ERP, en la revisión anual del caso de negocio; en ' + BEN.years[0] + ' se espera el ' + pc(ramp0) + ' (' + ms(comp.fuga * ramp0) + ').' };
      }
      if (/[Tt]iempo administrativo/.test(b.beneficio)) {
        return { beneficio: b.beneficio, indicador: b.metrica, unidad: 'días-persona al año', lineaBase: 0, meta: BEN.diasPersona, fechaMeta: fullYearEnd, resultado: null, estado: 'Pendiente', comentario: owner + 'Meta a plena adopción (' + fullYear + '): ' + n0(BEN.diasPersona) + ' días-persona a ' + money(dayCost) + ' = ' + ms(comp.tiempo) + ' al año. Se mide cada año con el registro de tiempos de las áreas; en ' + BEN.years[0] + ' se espera el ' + pc(ramp0) + ' (' + n0(BEN.diasPersona * ramp0) + ' días-persona).' };
      }
      if (/[Mm]antenimiento preventivo/.test(b.beneficio)) {
        return { beneficio: b.beneficio, indicador: b.metrica, unidad: '% de la maquinaria serializada', lineaBase: 0, meta: numIn(b.meta), fechaMeta: dateIn(b.meta), resultado: null, estado: 'Pendiente', comentario: owner + 'La línea base es 0 % (' + lc(b.lineaBase) + '). Se mide con las órdenes de mantenimiento del ERP desde la salida del release 3.' };
      }
      /* intangibles: se verifican; la meta numérica solo si el plan la expresa como «toda», y la unidad es el universo de
         esa meta («Toda devolución con diferencia de peso mayor a 3 % …» → «% de las devoluciones con diferencia de peso
         mayor a 3 %») */
      const all = /^Toda (\S+)( con .*?%)?/.exec(plain(b.meta || ''));
      const plural = (w) => (/ón$/.test(w) ? w.replace(/ón$/, 'ones') : w + 's');
      return {
        beneficio: b.beneficio, indicador: b.metrica, unidad: all ? '% de las ' + plural(all[1]) + (all[2] || '') : '', lineaBase: null, meta: all ? 100 : null,
        fechaMeta: /al salir cada release/.test(b.meta) ? lastGolive : END, resultado: null, estado: 'Pendiente',
        comentario: owner + 'Intangible (línea base: ' + lc(b.lineaBase) + '). Se verifica la meta del plan: «' + noDot(b.meta) + '».',
      };
    };
    const informe = {
      proyecto: NAME,
      numeroInforme: 'Seguimiento n.º 1 — ' + monthName(M1.from) + ' (programado)',
      fechaMedicion: M1.at,
      periodoDesde: M1.from,
      periodoHasta: M1.to,
      duenoBeneficios: pben.responsableBeneficios,
      fuentes: 'Reportes del ERP (facturación, inventario por bodega, obra y estado, cartera por edades y órdenes de mantenimiento), tablero gerencial, conteos cíclicos de bodega y reporte de rechazos del proveedor tecnológico, según el mecanismo de medición del plan de gestión de los beneficios (' + ref('plan-gestion-beneficios', R1_REVIEW) + '). Se mide con los datos de ' + monthName(M1.from) + ', primer mes completo después del cierre del proyecto (' + dl(END) + '), al terminar el cierre contable de ese mes (cinco primeros días hábiles del mes siguiente).',
      beneficios: rows('be', [
        ...(pben.beneficios || []).map(benRow),
        { beneficio: 'Beneficio bruto anual del caso de negocio', indicador: 'Facturación recuperada + valor de la mayor utilización del andamio + menor costo financiero de la cartera + tiempo administrativo liberado', unidad: 'COP al año', lineaBase: 0, meta: annual, fechaMeta: fullYearEnd, resultado: null, estado: 'Pendiente',
          comentario: 'Responsable: ' + ROLE.pof + ', ante la Gerencia General. Caso de negocio (' + ref('caso-negocio', R1_REVIEW) + '): facturación completa ' + ms(comp.fuga) + ', utilización del andamio ' + ms(comp.util) + ', costo financiero de la cartera vencida ' + ms(comp.cartera) + ' y tiempo administrativo liberado ' + ms(comp.tiempo) + '; beneficio neto a tres años de ' + ms(neto) + ' con el presupuesto aprobado. En ' + BEN.years[0] + ' se espera el ' + pc(ramp0) + ' (' + ms(annual * ramp0) + ').' },
      ]),
      noPrevistos: [],
      desviaciones: '',
      acciones: rows('ac', [
        { accion: 'Medir cada mes los indicadores de facturación, inventario, utilización, cartera y mantenimiento hasta la meta de cartera y presentar el resultado a la Gerencia General (transición del plan de gestión de los beneficios).', responsable: R.dir + ' y ' + lc(ROLE.pof), fechaObjetivo: (VIS[4] && VIS[4].fecha) || M2.to, estado: 'Pendiente' },
        { accion: 'Pasar los indicadores al tablero gerencial a cargo de cada dueño y cerrar el seguimiento de la PMO con el informe de beneficios.', responsable: R.dir, fechaObjetivo: M2.at, estado: 'Pendiente' },
        { accion: 'Presentar en la revisión anual del caso de negocio la facturación recuperada, el tiempo liberado y el valor de la utilización y de la cartera frente a lo previsto.', responsable: ROLE.pof, fechaObjetivo: BEN.years[0] + '-12-31', estado: 'Pendiente' },
        { accion: 'Verificar en cada medición que ninguna área volvió a las hojas de cálculo de control y que todas consultan la disponibilidad y el estado de los equipos en el ERP (supuesto del plan de gestión de los beneficios y obligación de adopción del acuerdo interno).', responsable: ROLE.adop, fechaObjetivo: M1.at, estado: 'Pendiente' },
      ]),
      conclusionCaso: 'Aún no se puede concluir',
      conclusion: 'Seguimiento programado: los resultados y la conclusión se escriben con la medición del ' + dl(M1.at) + '. El caso de negocio se cumple si se alcanzan las metas de las métricas de éxito y el beneficio bruto anual previsto (' + ms(annual) + ' a plena adopción, desde ' + fullYear + ').',
      proximaMedicion: M2.at,
      alcanceProximaMedicion: 'Seguimiento n.º 2 con los datos de ' + monthName(M2.from) + ': metas de cartera vencida y de mantenimiento preventivo (' + dl((VIS[4] && VIS[4].fecha) || M2.to) + ') y última medición mensual de la PMO; después, los indicadores pasan al tablero gerencial a cargo de cada dueño. La facturación recuperada y el tiempo liberado se miden en la revisión anual del caso de negocio.',
    };

    /* ================================================================ entradas por plantilla */
    return {
      'evaluacion-necesidades': {
        status: 'aprobado', rev: '0', date: SUP.decision, created: SUP.evaluacion,
        titleBlock: { elaboro: ROLE.pmo, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: evaluacion,
      },
      'acuerdo-cliente': {
        status: 'aprobado', rev: '1', date: LB0, created: START, titleBlock: { elaboro: R.dir, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: acuFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: START, note: 'Acuerdo interno firmado con el acta de constitución: presupuesto preliminar de ' + ms(valorInicial) + ', dedicación de las áreas y gobierno del proyecto.', fields: acuFields(0) },
          { rev: '1', status: 'aprobado', date: LB0, note: 'Otrosí No. 1 con la LB0: presupuesto aprobado de ' + ms(budget) + ', tramos del financiamiento y criterios de aceptación de los tres releases.' },
        ],
      },
      'informe-beneficios': { instances: [
        { key: 'seguimiento-1', title: 'Seguimiento de beneficios n.º 1 — programado para el ' + dl(M1.at), status: 'borrador', rev: 'A', date: R1_REVIEW, created: R1_REVIEW,
          titleBlock: { elaboro: ROLE.pof, reviso: R.dir, aprobo: ROLE.pat }, fields: informe },
      ] },
    };
  }

  PM.exampleDocs = PM.exampleDocs || {};
  (PM.exampleDocs.erpParts = PM.exampleDocs.erpParts || []).push(part);
  /* supuestos del módulo, para las pruebas y la documentación */
  PM.exampleDocs.erpNegocio = { SUP: cp(SUP), UNIDAD_VISION: cp(UNIDAD_VISION) };
})();

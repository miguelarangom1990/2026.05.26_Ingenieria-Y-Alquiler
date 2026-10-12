/* ==========================================================================
   97-example-erp-docs-integracion.js — documentos de integración del ejemplo
   ágil «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
   (94-example-erp.js, SPEC §9.7): caso de negocio, plan de gestión de los
   beneficios, registro de supuestos, plan para la dirección del proyecto y
   requisitos de financiamiento.
   Se registra en PM.exampleDocs.erpParts con la firma (F, ctx): F son los
   hechos que calcula 94 (computeFacts) y ctx = {R, CODE, STATUS_DATE, data}
   (schedule, wbs, costs, agile, items, baselines y resources). Las cifras salen
   de F, de ctx.data o de PM.calc / PM.agile / PM.res: el flujo de
   financiamiento es el valor planificado mensual de la LB0 y la reserva para
   contingencias del registro de riesgos (rev. 0) repartida por mes. Los
   beneficios cuantificados del caso de negocio son supuestos del ejemplo
   (BEN y ALT, abajo; docs/ejemplo-erp/supuestos-y-fuentes.md).
   Revisiones: el caso de negocio y los beneficios se revisan al cierre del
   release 1 (agilidad: se confirma el valor antes de liberar el siguiente
   tramo, que cubre desde el mes siguiente a la revisión); el plan para la
   dirección cambia con el CC-001 y después del cierre del release 1 (con la
   rev. 2 del plan de releases); el registro de supuestos y los requisitos de
   financiamiento tienen una revisión en curso al corte. Los documentos aprobados (y sus revisiones) no citan hechos
   posteriores a su fecha. El plan para la dirección cita cada plan y documento con la revisión vigente en la fecha de
   cada emisión, también los de los otros módulos 97 (adquisiciones, comunicaciones y equipo) cuando la página los carga.
   Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.calc || !PM.agile || !PM.date) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const ms = (v) => plain(PM.fmt.moneyShort(v, 'COP'));
  const money = (v) => plain(PM.fmt.money(v, 'COP'));
  const ix = (v) => plain(PM.fmt.idx(v));
  const n0 = (v) => plain(PM.fmt.num(v, 0));
  const n1 = (v) => plain(PM.fmt.num(v, 1));
  const pc = (x, d) => plain(PM.fmt.pct(x, d || 0));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
  const monthName = (iso) => plain(PM.fmt.date(iso, 'monthLong'));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const round1 = (v) => Math.round(v * 10) / 10;
  const M = 1e6;
  const mm = (x) => Math.round(x * M);
  /* redondeo a COP 100.000 (las tablas del flujo y los beneficios se expresan en décimas de millón) */
  const r100k = (v) => Math.round(v / 1e5) * 1e5;
  const andList = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);

  const ROLE = {
    pat: 'Gerencia General', po: 'Dueño del producto (Gerente administrativo y financiero)', pof: 'Gerente administrativo y financiero',
    ti: 'Jefe de TI', con: 'Contador', ccb: 'Comité de control de cambios', imp: 'Líder del implementador', di: 'Desarrollador de integraciones',
    alm: 'Jefe de almacén y coordinador logístico', mant: 'Jefe de mantenimiento',
  };

  /* ------------------------------------------------------------------ supuestos del caso de negocio (ejemplo)
     Beneficios anuales a plena adopción. Las cifras base son supuestos del ejemplo (no datos de una empresa real):
     ingresos de alquiler y servicios de 2025, inventario de andamio multidireccional, tarifa por m² al mes (la del caso de
     negocio del ejemplo del andamio), cartera total y tiempo administrativo liberado. El costo del día de un usuario
     clave sale del catálogo de recursos (rec-uc). Horizonte: tres años de operación después del último release. */
  const BEN = {
    baseYear: '2025', ingresos: mm(22000), fuga: 0.01,
    m2: 20000, tarifa: 9800, utilBase: 0.62, utilMeta: 0.75, atribucion: 0.5, margen: 0.7,
    cartera: mm(5500), carteraBase: 0.18, carteraMeta: 0.10, tasa: 0.18,
    diasPersona: 420,
    years: ['2027', '2028', '2029'], rampa: [0.7, 1, 1],
    /* suscripción estimada en el caso de negocio inicial (antes de las propuestas), por mes */
    suscripcionEstimada: mm(11),
  };
  /* alternativas que no se recomiendan: inversión, operación anual y beneficio que capturan */
  const ALT = {
    minimo: { inversion: mm(160), operacion: mm(40), parteFuga: 0.4, parteTiempo: 0.3 },
    propio: { inversion: mm(1150), operacion: mm(160), rampa: [0.2, 1, 1] },
  };
  /* riesgos del registro (rev. 0, LB0) y actividades del cronograma en que se exponen: reparto de la reserva para
     contingencias por mes en proporción al valor planificado de esas actividades */
  const RISK_TASKS = {
    'R-001': ['t16', 't17', 't18', 't19'], 'R-002': ['t25', 't26', 't27'], 'R-003': ['t22', 't23', 't24', 't28', 't30', 't32'],
    'R-004': ['t15', 't26'], 'R-005': ['t25', 't26', 't27', 't34'], 'R-006': ['t28', 't30', 't32'], 'R-007': ['t25', 't26', 't27'],
  };

  function part(F, ctx) {
    const { R, CODE, STATUS_DATE, data } = ctx || {};
    if (!data || !data.schedule || !data.baselines || !data.agile) return {};
    const { schedule, wbs, costs, agile, items, baselines, resources } = data;
    const START = F.start, END = F.end, LB0 = F.lb0Date, CC1 = F.cc1Date;
    const cal = PM.cal.make(schedule.settings, START);
    const tree = PM.calc.wbsTree(wbs.nodes);
    const wcode = (id) => tree.codes.get(id) || '';
    const roots = tree.childrenOf();
    const LB = (baselines.find((b) => b.data && b.data.number === 0) || baselines[0]).data;
    const lbTask = (id) => LB.schedule.tasks.find((t) => t.id === id) || {};
    const task = (id) => schedule.tasks.find((t) => t.id === id) || {};
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const relName = (id) => F.releaseNames[id];
    const relShort = (id) => relName(id).replace(/:.*/, '');
    const sprintsOf = (id) => PM.agile.sortSprints(agile.sprints).filter((s) => s.releaseId === id);
    const iterRange = (id) => { const l = sprintsOf(id).map((s) => s.name.replace('Iteración ', '')); return 'iteraciones ' + l[0] + ' a ' + l[l.length - 1]; };
    const code = (tid) => CODE + '-' + ((PM.templates[tid] && PM.templates[tid].abbr) || 'DOC');
    const catItem = (key) => (resources.items || []).find((x) => x.id === 'rec-' + key) || {};
    const lbBac = LB.cost.bac, lbCont = LB.cost.contingency, lbMan = LB.cost.management;
    const lbCostBase = lbBac + lbCont;

    /* fechas del plan y hechos con fecha */
    const golive1 = F.milestones.t29.actual;                 // salida a producción del release 1
    const R1_REVIEW = cal.addWork(golive1, 1);               // revisión del caso de negocio al cierre del release 1
    const R1 = rel('rel-1');
    const r1ac = PM.agile.releaseActualCost(R1, costs, tree, R1_REVIEW);
    const r1prog = F.releaseAt('rel-1', R1_REVIEW);
    const r1cpi = r1ac ? (R1.budget * r1prog.pct) / r1ac : null;
    const migNote = /(\d+,\d+)\s*%/.exec(task('t17').notes || '');
    const migPct = migNote ? migNote[1] + ' %' : '';
    const actualOf = (tid) => (costs.actuals || []).filter((a) => a.taskId === tid && a.date <= STATUS_DATE).reduce((s, a) => s + a.amount, 0);
    const t14Over = actualOf('t14') - task('t14').cost;
    const t16Late = cal.countWork(D.add(lbTask('t16').finish, 1), task('t16').actualFinish);
    const connectorExtra = (costs.actuals || []).filter((a) => a.releaseId === 'rel-2' && /conector/.test(a.description) && a.date <= STATUS_DATE).reduce((s, a) => s + a.amount, 0);
    /* documentos de 95 que se citan: revisiones del registro de riesgos (reserva por riesgo) y del plan de releases */
    const base = PM.exampleDocs && typeof PM.exampleDocs.erp === 'function' ? PM.exampleDocs.erp(F) : null;
    /* documentos de los otros módulos de 97 (adquisiciones, comunicaciones y equipo) que cita el plan para la dirección: su
       revisión vigente a la fecha de cada emisión del plan. Si la página no carga esos módulos, la referencia va sin revisión.
       Ninguno de ellos llama a este módulo; la marca evita una recursión si alguno lo hiciera. */
    const peers = {};
    if (!part.busy) {
      part.busy = true;
      try {
        for (const fn of (PM.exampleDocs && Array.isArray(PM.exampleDocs.erpParts)) ? PM.exampleDocs.erpParts : []) {
          if (fn === part || typeof fn !== 'function') continue;
          let p = null;
          try { p = fn(F, ctx); } catch (e) { p = null; }
          if (p && typeof p === 'object') for (const k of Object.keys(p)) if (!(k in peers)) peers[k] = p[k];
        }
      } finally { part.busy = false; }
    }
    const prelRevs = base && base['plan-release'] && Array.isArray(base['plan-release'].revs) ? base['plan-release'].revs : [];
    const prelRev = (r) => (prelRevs.find((x) => x.rev === r) || {}).date;

    /* suscripción contratada (catálogo de recursos y asignación de t12): usuarios por mes y valor mensual */
    const t12 = task('t12');
    const subMonths = (() => { let n = 0; for (let m = D.startOfMonth(lbTask('t12').start); m <= lbTask('t12').finish; m = D.addMonths(m, 1)) n++; return n; })();
    const subLines = (t12.resources || []).map((a) => ({ item: catItem(a.resourceId.replace('rec-', '')), users: a.qty / subMonths }));
    const subMonthly = subLines.reduce((s, l) => s + l.users * l.item.unitCost, 0);
    const subUsers = subLines.map((l) => n0(l.users) + ' ' + (/limitado/.test(l.item.name) ? 'limitados' : 'completos'));
    const subTotalUsers = n0(subLines.reduce((s, l) => s + l.users, 0));

    /* equipo del implementador por iteración (catálogo: costo por día × dedicación × días de la iteración) y bolsas */
    const sprintDays = PM.agile.settings(agile).sprintLength;
    const implFee = ['cf', 'de', 'di', 'ap'].reduce((s, k) => { const it = catItem(k); return s + it.unitCost * (it.dedication === undefined ? 100 : it.dedication) / 100 * sprintDays; }, 0);
    const implHours = ['cf', 'de', 'di', 'ap'].reduce((s, k) => { const it = catItem(k); return s + (it.hoursPerDay || 8) * (it.dedication === undefined ? 100 : it.dedication) / 100 * sprintDays; }, 0);
    const analyst = catItem('at').unitCost * sprintDays;
    const bolsa2 = task('t26').costFixed || 0;
    const bolsa3 = rel('rel-3').budget - rel('rel-3').plannedSprints * (implFee + analyst);

    /* ================================================================ beneficios cuantificados (caso de negocio) */
    const dayCost = catItem('uc').unitCost;
    const benefit = {
      fuga: r100k(BEN.ingresos * BEN.fuga),
      util: r100k(BEN.m2 * (BEN.utilMeta - BEN.utilBase) * BEN.tarifa * 12 * BEN.atribucion * BEN.margen),
      cartera: r100k(BEN.cartera * (BEN.carteraBase - BEN.carteraMeta) * BEN.tasa),
      tiempo: r100k(BEN.diasPersona * dayCost),
    };
    const annual = benefit.fuga + benefit.util + benefit.cartera + benefit.tiempo;
    const rampSum = BEN.rampa.reduce((s, x) => s + x, 0);
    const gross3 = r100k(annual * rampSum);
    const years = BEN.years.length;
    const opC = (monthly) => monthly * 12 * years;
    const caseNumbers = (budget, monthly) => {
      const op = opC(monthly);
      const ingreso = gross3 - op;
      /* recuperación: años hasta que el beneficio neto de la operación acumulado iguala la inversión */
      let acc = 0, payback = null;
      BEN.rampa.forEach((f, i) => { const y = annual * f - monthly * 12; if (payback === null && acc + y >= budget) payback = i + (budget - acc) / y; acc += y; });
      return { op, ingreso, costo: budget, neto: ingreso - budget, margen: round1(((ingreso - budget) / ingreso) * 100), payback };
    };
    const minGross = r100k((benefit.fuga * ALT.minimo.parteFuga + benefit.tiempo * ALT.minimo.parteTiempo) * rampSum);
    const minIngreso = minGross - ALT.minimo.operacion * years;
    const propGross = r100k(annual * ALT.propio.rampa.reduce((s, x) => s + x, 0));
    const propIngreso = propGross - ALT.propio.operacion * years;

    /* ================================================================ 4.1 · CASO DE NEGOCIO */
    const vision = (PM.templates['vision-producto'] && PM.templates['vision-producto'].example) || {};
    const metric = (n) => (vision.metricasExito || [])[n] || {};
    const NAME = 'EJEMPLO · Implementación del ERP de Ingeniería y Alquiler';
    const opciones = (budget, monthly, stage) => {
      const c = caseNumbers(budget, monthly);
      return rows('op', [
        { opcion: 'A. No hacer nada', descripcion: 'Seguir con las hojas de cálculo de control de equipos, el software contable y la facturación electrónica en el portal del proveedor tecnológico.', costo: 0, ingreso: 0,
          riesgos: 'El corte mensual sigue tardando hasta cinco días hábiles; el inventario de bodega no coincide con el de las obras y la cartera se conoce con una semana de retraso. La empresa no puede crecer en alquiler sin aumentar el personal administrativo.', recomendada: false },
        { opcion: 'B. Hacer lo mínimo', descripcion: 'Conectar la facturación electrónica al software contable y llevar el inventario en una aplicación de bodega independiente.', costo: ALT.minimo.inversion, ingreso: minIngreso,
          riesgos: 'Solo captura parte de la facturación y del tiempo administrativo: no resuelve la disponibilidad por obra, la utilización del inventario, la cartera ni el mantenimiento, y deja dos fuentes de datos por conciliar.', recomendada: false },
        { opcion: 'C. ERP de mercado medio en la nube con socio implementador, por releases', descripcion: 'Suscripción en la nube para ' + subTotalUsers + ' usuarios, implementación por iteraciones de precio fijo y tres releases: inventario y alquiler; facturación electrónica y cartera; mantenimiento y tablero gerencial.', costo: c.costo, ingreso: c.ingreso,
          riesgos: stage >= 1 ? 'Calidad de los datos maestros (R-001), disponibilidad de los usuarios clave (R-002) e integración con la DIAN (R-004).' : 'Calidad de los datos maestros, disponibilidad de los usuarios clave e integración con la DIAN por medio del proveedor tecnológico.', recomendada: true },
        { opcion: 'D. ERP con servidores propios y desarrollos a la medida', descripcion: 'Licencia perpetua, servidores en la sede, desarrollo a la medida de la liquidación del alquiler y una sola salida a producción.', costo: ALT.propio.inversion, ingreso: propIngreso,
          riesgos: 'Inversión inicial y soporte anual altos; los beneficios llegan cerca de seis meses después y todo el alcance sale en una sola fecha.', recomendada: false },
      ]);
    };
    const benefitText = 'beneficio bruto anual a plena adopción de ' + ms(annual) + ': facturación completa ' + ms(benefit.fuga) + ', utilización del andamio ' + ms(benefit.util) + ', costo financiero de la cartera vencida ' + ms(benefit.cartera) + ' y tiempo administrativo liberado ' + ms(benefit.tiempo);
    const driversText = (monthly, stage) => 'Bases del cálculo (supuestos del ejemplo): ingresos de alquiler y servicios de ' + ms(BEN.ingresos) + ' en ' + BEN.baseYear + ' con ' + pc(BEN.fuga) + ' de facturación que hoy no se cobra (días de alquiler, transportes, faltantes y daños sin soporte); ' + n0(BEN.m2) + ' m² de andamio multidireccional con tarifa de ' + money(BEN.tarifa) + ' por m² al mes y utilización de ' + pc(BEN.utilBase) + ' a ' + pc(BEN.utilMeta) + ', con ' + pc(BEN.atribucion) + ' de la mejora atribuida al ERP y margen de contribución de ' + pc(BEN.margen) + '; cartera total de ' + ms(BEN.cartera) + ' con ' + n0((BEN.carteraBase - BEN.carteraMeta) * 100) + ' puntos menos de cartera vencida a más de 60 días a un costo financiero de ' + pc(BEN.tasa) + ' anual; ' + n0(BEN.diasPersona) + ' días-persona al año liberados en facturación, conciliaciones y digitación a ' + money(dayCost) + ' por día. Horizonte de tres años de operación (' + BEN.years[0] + ' a ' + BEN.years[years - 1] + ') con ' + pc(BEN.rampa[0]) + ' del beneficio el primer año. ' + cap(benefitText) + '. ' +
      (stage >= 1 ? 'Operación: suscripción contratada de ' + subTotalUsers + ' usuarios (' + andList(subUsers) + ') por ' + money(monthly) + ' al mes durante los tres años. ' : 'Operación: suscripción estimada de ' + subTotalUsers + ' usuarios por cerca de ' + ms(monthly) + ' al mes (referencia de mercado; se confirma con las propuestas). ') +
      'Alternativa B: inversión de ' + ms(ALT.minimo.inversion) + ' y operación de ' + ms(ALT.minimo.operacion) + ' al año; captura ' + pc(ALT.minimo.parteFuga) + ' de la facturación recuperada y ' + pc(ALT.minimo.parteTiempo) + ' del tiempo liberado. Alternativa D: inversión de ' + ms(ALT.propio.inversion) + ' y operación de ' + ms(ALT.propio.operacion) + ' al año; logra ' + pc(ALT.propio.rampa[0]) + ' del beneficio el primer año. Tasa de planificación de COP 4.000 por dólar para los equipos importados.';
    const casoFields = (stage) => {
      const budget = stage >= 1 ? F.budget : 700000000;
      const monthly = stage >= 1 ? subMonthly : BEN.suscripcionEstimada;
      const c = caseNumbers(budget, monthly);
      const m = [0, 1, 2, 3, 4].map(metric);
      return {
        nombre: NAME, cliente: 'Ingeniería y Alquiler S.A.S. (proyecto interno)', patrocinador: ROLE.pat,
        fechaCaso: stage >= 1 ? R1_REVIEW : '2026-04-28',
        necesidad: 'La empresa controla los equipos en alquiler, las remisiones de entrega y devolución y la facturación en hojas de cálculo y sistemas separados: el corte mensual de alquileres tarda hasta cinco días hábiles, el inventario de la bodega no coincide con el de las obras, la cartera se conoce con una semana de retraso y la factura electrónica se emite a mano en el portal del proveedor tecnológico. Con el crecimiento de las obras activas en Bogotá y la Sabana, la operación no escala sin más personal administrativo y la gerencia decide inversiones en inventario sin datos de utilización.',
        alineacion: 'Aporta al objetivo estratégico 2026–2028 de controlar el inventario en alquiler y facturar a tiempo: un solo dato por equipo para comercial, logística, almacén, mantenimiento, facturación y cartera, y la base para elevar la utilización del andamio multidireccional, ' + (stage >= 1 ? 'de ' + m[3].lineaBase.replace(/ \((.+)\)$/, ' en $1') : 'que almacén estima cerca de 62 %') + ', sin comprar más equipo.',
        brecha: 'Hoy no hay un sistema integrado ni un equipo interno que pueda implementarlo: TI tiene un jefe y un analista, y la facturación electrónica depende del portal del proveedor tecnológico. Se requiere un ERP de mercado medio, un socio implementador con experiencia en alquiler de equipos, la depuración de los datos maestros (equipos, piezas, clientes, obras y tarifas), equipos de bodega con conectividad y la dedicación de un usuario clave por área. El jefe de la PMO dirige el proyecto y el gerente administrativo y financiero actúa como dueño del producto.',
        opciones: opciones(budget, monthly, stage),
        valorContrato: c.ingreso,
        costoEstimado: budget,
        margenEsperado: c.margen,
        flujoCaja: stage >= 1
          ? 'Recursos propios de la empresa, liberados por tramos según el documento «Requisitos de financiamiento del proyecto» (rev. 0): después de la contratación, cada tramo se libera con la revisión de este caso al cierre de un release y cubre los meses siguientes. Los pagos a los proveedores siguen las condiciones de los contratos (registro de contratos y acuerdos). Margen calculado como beneficio neto a tres años (después de la suscripción) menos el presupuesto aprobado con sus reservas, sobre ese beneficio. Recuperación de la inversión en cerca de ' + n1(c.payback) + ' años desde ' + BEN.years[0] + '.'
          : 'Recursos propios de la empresa. Se propone pagar la suscripción cada mes y al implementador por iteración terminada, y liberar el financiamiento por tramos según el valor demostrado en la revisión de cada release. Margen calculado como beneficio neto a tres años (después de la suscripción) menos el presupuesto preliminar con reservas, sobre ese beneficio. Recuperación de la inversión en cerca de ' + n1(c.payback) + ' años desde ' + BEN.years[0] + '.',
        recomendacion: stage >= 1
          ? 'Continuar con los releases 2 y 3 (alternativa C). Revisión al cierre del release 1: el release está en producción desde el ' + dl(golive1) + ' con ' + r1prog.done + ' de ' + r1prog.total + ' puntos, incluida la integración con las básculas aprobada en el CC-001, y un costo real de ' + ms(r1ac) + ' frente a un presupuesto de ' + ms(R1.budget) + ' (CPI ' + ix(r1cpi) + '). El inventario de la bodega principal se migró con ' + migPct + ' de diferencia frente al conteo físico (meta: ' + m[2].meta + '). Con el presupuesto aprobado de ' + ms(F.budget) + ' (LB0 del ' + dl(LB0) + ') el beneficio neto a tres años es de ' + ms(c.neto) + '. Con esta revisión se libera el tramo 3 del financiamiento (' + ms(T3.amount) + ', de ' + tramoSpan(T3) + ': ' + tramoBrief(T3) + '); el ' + relShort('rel-2').toLowerCase() + ' empezó el ' + dl(rel('rel-2').start) + ' con el tramo 2, que cubre hasta el ' + dl(tramos[1].end) + '. El caso se revisa de nuevo al cierre del ' + relShort('rel-2').toLowerCase() + ', antes de liberar el tramo 4.'
          : 'Recomendar la alternativa C: es la única que cubre los cinco objetivos del negocio, entrega valor desde el primer release (inventario y alquiler) y deja un beneficio neto a tres años de ' + ms(c.neto) + ' aun con el presupuesto preliminar completo y sus reservas. Condiciones para continuar: seleccionar el ERP y el implementador con demostraciones guiadas con guiones de negocio propios, firmar los contratos dentro del presupuesto preliminar y revisar este caso al cierre de cada release antes de liberar el financiamiento del siguiente.',
        criteriosExito: stage >= 1
          ? [0, 1, 2, 3, 4].map((i) => m[i].metrica + (/^\d/.test(m[i].lineaBase) ? ': de ' + lc(m[i].lineaBase) + ' a ' + lc(m[i].meta) : ': línea base, ' + lc(m[i].lineaBase) + '; meta, ' + lc(m[i].meta)) + ' al ' + dl(m[i].fecha) + '.')
          : [
            'Cierre mensual de facturación de alquileres: de cerca de 5 días hábiles a 1.',
            'Facturas electrónicas rechazadas por la DIAN: menos de 1 % de las emitidas, sin digitarlas en el portal del proveedor tecnológico.',
            'Diferencia entre el inventario físico y el del sistema: de cerca de 4 % (se mide en el descubrimiento) a 0,5 % o menos.',
            'Utilización del andamio multidireccional: de cerca de 62 % a 75 % o más.',
            'Cartera vencida a más de 60 días: de 18 % a 10 % o menos de la cartera total.',
          ],
        riesgosAltoNivel: stage >= 1
          ? [
            'Calidad de los datos maestros para las migraciones de cartera y de hojas de vida (R-001): se materializó en parte en la depuración del release 1.',
            'Disponibilidad de los usuarios clave en el refinamiento, las revisiones y las pruebas de aceptación (R-002).',
            'Integración con la DIAN por medio del proveedor tecnológico en el release 2 (R-004).',
            'Adopción del ERP en las bodegas y las obras (R-003): sin ella no se logran los beneficios de inventario y utilización.',
          ]
          : [
            'Calidad de los datos maestros (equipos, piezas, clientes, obras y tarifas) para la migración.',
            'Disponibilidad de los usuarios clave, que mantienen su operación diaria.',
            'Integración con la DIAN por medio del proveedor tecnológico de facturación electrónica.',
            'Resistencia al cambio del personal de bodega y de los conductores.',
          ],
        supuestosCaso: driversText(monthly, stage),
      };
    };

    /* ================================================================ 4.1 · PLAN DE GESTIÓN DE LOS BENEFICIOS */
    const plazoOf = (iso) => (iso <= END ? 'Corto plazo (durante el proyecto)' : 'Mediano plazo (hasta 1 año)');
    const EST0 = ['5 días hábiles (estimación de facturación)', 'Facturación manual en el portal del proveedor tecnológico', 'Cerca de 4 % (se mide en el descubrimiento)', 'Cerca de 62 % (estimación de almacén; se mide en julio)', '18 % (informe de cartera de abril de 2026)'];
    const OWN = [ROLE.po, ROLE.po, ROLE.alm, ROLE.pat, ROLE.po];
    const BEN_NAME = ['Cierre de facturación de alquileres en un día', 'Facturación electrónica sin rechazos y sin digitación', 'Inventario confiable por bodega y obra', 'Mayor utilización del andamio multidireccional', 'Menos cartera vencida'];
    const beneficiosRows = (stage) => rows('be', [
      ...[0, 1, 2, 3, 4].map((i) => {
        const m = metric(i);
        return { beneficio: BEN_NAME[i], tipo: 'Tangible', metrica: m.metrica, lineaBase: stage >= 1 ? m.lineaBase : EST0[i], meta: m.meta + ' al ' + dl(m.fecha), plazo: plazoOf(m.fecha), responsable: OWN[i] };
      }),
      /* beneficios monetarios del caso de negocio que no son métricas de la visión: se siguen después del cierre, hasta el horizonte del caso */
      { beneficio: 'Facturación recuperada: días de alquiler, transportes, faltantes y daños que hoy no se cobran', tipo: 'Tangible', metrica: 'Facturación anual de esos conceptos frente a la base de ' + BEN.baseYear + ' (COP al año)',
        lineaBase: 'Base de ' + BEN.baseYear + ': cerca de ' + pc(BEN.fuga) + ' de los ingresos de alquiler y servicios (' + ms(BEN.ingresos) + ') no se factura (estimación)', meta: ms(benefit.fuga) + ' al año a plena adopción (' + pc(BEN.rampa[0]) + ' en ' + BEN.years[0] + ')', plazo: 'Largo plazo (más de 1 año)', responsable: ROLE.po },
      { beneficio: 'Tiempo administrativo liberado en facturación, conciliaciones y digitación', tipo: 'Tangible', metrica: 'Días-persona al año que las áreas administrativas dejan de dedicar a esas tareas',
        lineaBase: 'Procesos manuales de ' + BEN.baseYear + ': sin tiempo liberado', meta: n0(BEN.diasPersona) + ' días-persona al año (' + ms(benefit.tiempo) + ') a plena adopción (' + pc(BEN.rampa[0]) + ' en ' + BEN.years[0] + ')', plazo: 'Largo plazo (más de 1 año)', responsable: ROLE.po },
      { beneficio: 'Mantenimiento preventivo programado (release 3)', tipo: 'Tangible', metrica: 'Maquinaria serializada con plan de mantenimiento preventivo programado en el ERP', lineaBase: 'Sin programación: mantenimiento correctivo al devolver el equipo', meta: '100 % de la maquinaria serializada al 31 de marzo de 2027', plazo: 'Mediano plazo (hasta 1 año)', responsable: ROLE.mant },
      { beneficio: 'Un solo dato por equipo para todas las áreas', tipo: 'Intangible', metrica: 'Áreas que consultan la disponibilidad y el estado de los equipos en el ERP', lineaBase: 'Hojas de cálculo separadas por área', meta: 'Hojas de cálculo de control retiradas al salir cada release', plazo: 'Corto plazo (durante el proyecto)', responsable: ROLE.alm },
      { beneficio: 'Cobro con soporte de faltantes y daños', tipo: 'Intangible', metrica: stage >= 2 ? 'Devoluciones con faltantes o daños valorados al cerrar el conteo y con el peso de báscula (CC-001)' : 'Devoluciones con faltantes o daños valorados al cerrar el conteo', lineaBase: 'Faltantes detectados días después, sin soporte para cobrarlos', meta: stage >= 2 ? 'Toda devolución con diferencia de peso mayor a 3 % contada por pieza y valorada antes de facturar' : 'Faltantes y daños valorados en el ERP antes de facturar', plazo: 'Corto plazo (durante el proyecto)', responsable: ROLE.po },
    ]);
    const benFields = (stage) => ({
      objetivoEstrategico: 'Controlar el inventario en alquiler y facturar a tiempo (plan estratégico 2026–2028).',
      alineacionEstrategica: 'Los beneficios del ERP sostienen el crecimiento del alquiler sin aumentar el personal administrativo: facturación completa el mismo día del corte, inventario confiable por bodega y obra, mayor utilización del andamio multidireccional sin comprar equipo y cartera al día. El caso de negocio estima un ' + benefitText + (stage >= 1 ? '. Las metas son las métricas de éxito de la visión del producto (rev. 0, ' + dl(LB0) + ').' : '; las líneas base se miden en el descubrimiento.'),
      beneficios: beneficiosRows(stage),
      responsableBeneficios: 'Gerente administrativo y financiero (dueño del producto), que responde ante la Gerencia General; la Gerencia General responde por la utilización del inventario, el jefe de almacén y el coordinador logístico por el inventario y el jefe de mantenimiento por el preventivo.',
      frecuenciaMedicion: 'Mensual',
      mecanismoMedicion: 'Cada beneficio se mide cada mes desde la salida a producción del release que lo habilita: ' + relShort('rel-1').toLowerCase() + ', inventario, faltantes y utilización del andamio (el inventario por bodega, obra y estado da los m² alquilados y disponibles; la utilización sale de un reporte del ERP hasta que la reemplace el tablero gerencial); ' + relShort('rel-2').toLowerCase() + ', facturación y cartera; ' + relShort('rel-3').toLowerCase() + ', mantenimiento preventivo y tablero gerencial. Fuentes: los reportes del ERP, el tablero gerencial, los conteos cíclicos de bodega y el reporte de rechazos del proveedor tecnológico; las líneas base anteriores salen de las hojas de cálculo y del software contable. La facturación recuperada y el tiempo liberado se miden cada año frente a la base de ' + BEN.baseYear + ', con la facturación por concepto del ERP y el registro de tiempos de las áreas. El dueño del producto presenta el avance en el comité quincenal y en la revisión del caso de negocio al cierre de cada release.' +
        (stage >= 2 ? ' Primera medición al cierre del ' + relShort('rel-1').toLowerCase() + ' (' + dl(R1_REVIEW) + '): el inventario de la bodega principal se migró con ' + migPct + ' de diferencia frente al conteo físico (meta: ' + metric(2).meta + '). Es la diferencia de la migración, no todavía la del conteo cíclico, que empieza en ' + monthName(D.addMonths(D.startOfMonth(golive1), 1)) + '.' : ''),
      transicion: 'Al cierre del proyecto (' + dl(END) + ') la PMO y la gerencia administrativa y financiera siguen midiendo cada mes hasta el ' + dl(metric(4).fecha) + ', fecha de la meta de cartera, y presentan el resultado a la Gerencia General. Después, los indicadores quedan en el tablero gerencial a cargo de cada dueño y la PMO cierra su seguimiento en el informe de beneficios. Los beneficios monetarios del caso de negocio (' + ms(annual) + ' al año a plena adopción) se siguen hasta ' + BEN.years[years - 1] + ', el horizonte del caso: cada año el gerente administrativo y financiero presenta a la Gerencia General, en la revisión anual del caso de negocio, la facturación recuperada, el tiempo liberado y el valor de la utilización y de la cartera frente a lo previsto.',
      supuestosBeneficios: [
        'Las áreas usan el ERP como única fuente: las hojas de cálculo de control se retiran al salir cada release.',
        'El inventario de andamio multidireccional y las tarifas de alquiler se mantienen en el horizonte del caso de negocio (' + BEN.years[0] + ' a ' + BEN.years[years - 1] + ').',
        'Los usuarios clave de cada área sostienen el uso después de la estabilización.',
      ],
      riesgosBeneficios: stage >= 1
        ? [
          'R-003: resistencia del personal de bodega y de los conductores a registrar en la tableta; mantendría registros en papel y anularía los beneficios de inventario.' + (stage >= 2 ? ' En seguimiento: el registro de interesados del ' + dl(R1_REVIEW) + ' los pasa de reticentes a neutrales.' : ''),
          'R-002: disponibilidad de los usuarios clave para aceptar los incrementos y medir los beneficios.',
          'R-004: rechazos de la DIAN que retrasen la facturación electrónica del release 2.',
        ]
        : [
          'Resistencia al cambio en las bodegas y las obras.',
          'Usuarios clave sin tiempo para el proyecto ni para medir los beneficios.',
          'Rechazos de la DIAN que retrasen la facturación electrónica.',
        ],
    });

    /* ================================================================ 4.1 · REGISTRO DE SUPUESTOS */
    const s3 = sprintsOf('rel-1')[2], it7 = agile.sprints.find((s) => s.id === F.currentSprint);
    const r1End = R1.end;
    const supuestos = (stage) => {
      const S = (id, tipo, descripcion, categoria, responsable, fechaValidacion, estado) => ({ id, tipo, descripcion, categoria, responsable, fechaValidacion, estado });
      const list = [
        S('S-01', 'Supuesto', 'El dueño del producto (gerente administrativo y financiero) dedica al menos dos horas diarias a refinar y aceptar historias.', 'Recursos', ROLE.pat,
          stage >= 2 ? r1End : stage >= 1 ? r1End : LB0, stage >= 2 ? 'Validado' : 'Por validar'),
        S('S-02', 'Supuesto', 'Los usuarios clave participan en los talleres, en la revisión de cada iteración y en las pruebas de aceptación de cada release.' + (stage >= 2 ? ' Validado en el release 1: firmaron su prueba de aceptación.' : ''), 'Recursos', 'Dueño del producto',
          stage >= 1 ? r1End : LB0, stage >= 2 ? 'Validado' : 'Por validar'),
        S('S-03', 'Supuesto', 'La tasa de planificación de COP 4.000 por dólar alcanza para los equipos de bodega importados.' + (stage >= 2 ? ' Descartado: la tasa de cambio encareció los equipos de bodega importados y los puntos de acceso de la red; los equipos costaron ' + ms(t14Over) + ' más de lo presupuestado.' : ''), 'Costos', ROLE.ti,
          stage >= 2 ? task('t14').actualFinish : stage >= 1 ? lbTask('t14').finish : LB0, stage >= 2 ? 'Descartado' : 'Por validar'),
        S('S-04', 'Restricción', 'La factura electrónica cumple el anexo técnico vigente de la DIAN y se emite por medio de un proveedor tecnológico autorizado.', 'Regulatorio', ROLE.con, '2026-05-05', 'Validado'),
        S('S-05', 'Restricción', 'Ninguna salida a producción en los cinco primeros días hábiles de cada mes (cierre mensual) ni durante el cierre anual: si la última revisión de un release cae en esas fechas, la salida se mueve al día hábil siguiente al cierre.', 'Cronograma', ROLE.con, '2026-05-05', 'Validado'),
        S('S-06', 'Restricción', 'Los saldos migrados de inventario y cartera los concilian y aprueban contabilidad y la revisoría fiscal antes de cada salida a producción.', 'Regulatorio', ROLE.con, '2026-05-05', 'Validado'),
        S('S-07', 'Restricción', stage >= 1
          ? 'Presupuesto aprobado de ' + ms(F.budget) + ': BAC de ' + ms(lbBac) + ', reserva para contingencias de ' + ms(lbCont) + ' y reserva de gestión de ' + ms(lbMan) + ', que solo autoriza la Gerencia General.'
          : 'Presupuesto preliminar de COP 700 millones (−10 % / +25 %); la reserva de gestión solo la autoriza la Gerencia General.', 'Costos', R.dir, stage >= 1 ? LB0 : START, 'Validado'),
      ];
      if (stage >= 1) list.push(
        S('S-08', 'Supuesto', 'Los datos maestros (equipos, piezas, clientes, obras y tarifas) se depuran en ' + lbTask('t16').duration + ' días hábiles.' + (stage >= 2 ? ' Descartado: el 14 % de las referencias no tenía peso unitario y había clientes duplicados; la depuración tardó ' + t16Late + ' días hábiles más (R-001).' : ''), 'Técnico', 'Dueño del producto',
          stage >= 2 ? task('t16').actualFinish : lbTask('t16').finish, stage >= 2 ? 'Descartado' : 'Por validar'),
        S('S-09', 'Supuesto', 'El proveedor tecnológico de facturación electrónica entrega el ambiente de habilitación antes del ' + dl(rel('rel-2').start) + ', inicio del release 2.' + (stage >= 2 ? ' Lo entregó el ' + dl(task('t15').actualFinish) + '.' : ''), 'Técnico', ROLE.ti,
          stage >= 2 ? task('t15').actualFinish : lbTask('t15').finish, stage >= 2 ? 'Validado' : 'Por validar'),
        S('S-10', 'Supuesto', 'La velocidad del equipo se estabiliza entre 28 y 32 puntos por iteración desde la iteración 3.' + (stage >= 2 ? ' Las iteraciones 3 a 5 terminaron ' + andList(F.velocity.rows.slice(2, 5).map((r) => String(r.completed))) + ' puntos, pero la 6 cerró en ' + F.velocity.rows[5].completed + ' (R-008); se valida al cerrar la ' + it7.name.toLowerCase() + '.' : ''), 'Cronograma', R.sm,
          stage >= 2 ? it7.end : s3.end, 'Por validar'),
        S('S-11', 'Supuesto', 'Contabilidad entrega el auxiliar de cartera conciliado al cierre del mes anterior en los primeros días hábiles del mes de la migración de saldos.' + (stage >= 2 ? ' Por validar: el auxiliar a 30 de septiembre no ha llegado (INC-003, TA-011 bloqueado); compromiso para el 13 de octubre.' : ''), 'Recursos', ROLE.con,
          stage >= 2 ? '2026-10-13' : lbTask('t18').start, 'Por validar'),
        S('S-12', 'Restricción', 'Suscripción de ' + subTotalUsers + ' usuarios (' + andList(subUsers) + ') de ' + monthName(lbTask('t12').start) + ' a ' + monthName(lbTask('t12').finish) + ', con facturación mensual vencida; desde ' + monthName(D.addMonths(D.startOfMonth(lbTask('t12').finish), 1)) + ' pasa al presupuesto de operación de TI.', 'Contractual', ROLE.ti, F.milestones.t11.actual, 'Validado'),
        S('S-13', 'Restricción', 'El implementador trabaja a precio fijo de ' + n0(implHours) + ' horas por iteración de ' + sprintDays + ' días hábiles: las horas adicionales de las iteraciones solo entran con las bolsas del conector y del tablero gerencial o con una solicitud de cambio. Sus servicios fuera de los releases (ambientes, formación, capacitación, apoyo a la migración, salidas y estabilización) se contratan con órdenes de servicio a la tarifa del contrato.', 'Contractual', R.dir, F.milestones.t11.actual, 'Validado'),
      );
      if (stage >= 2) list.push(
        S('S-14', 'Supuesto', 'Las básculas de las bodegas principal y de Funza tienen salida de datos y se integran sin costo adicional (CC-001).', 'Técnico', ROLE.di, CC1, 'Validado'),
      );
      return list;
    };
    const supFields = (stage) => ({
      supuestos: supuestos(stage),
      criterioValidacion: 'Cada supuesto se valida con evidencia escrita (acta, propuesta del oferente, contrato, medición o resultado de una iteración) y su fecha. Si resulta falso se marca como descartado y se registra el riesgo o el incidente que origina.' +
        (stage >= 1 ? ' Los supuestos técnicos críticos se validan pronto con investigaciones (spikes) de máximo una iteración, como IN-003 para la API del proveedor tecnológico, y los del equipo en la revisión de cada iteración. El registro se revisa en cada planificación de iteración y en el comité quincenal, y debe coincidir con los supuestos del plan de releases.' : ' Los supuestos de la solución se validan en el descubrimiento y en la selección, antes de firmar los contratos.') +
        (stage >= 2 ? ' S-03 explica el sobrecosto de los equipos de bodega; S-08 originó la materialización parcial de R-001; S-10 se sigue con R-008 y S-11 con el INC-003.' : ''),
      frecuenciaRevision: 'Quincenal',
    });

    /* ================================================================ 4.2 · PLAN PARA LA DIRECCIÓN DEL PROYECTO */
    const lb = (id, k) => lbTask(id)[k || 'start'];
    const r1Points0 = F.releaseAt('rel-1', LB0).total;
    const r1PointsCC = F.releaseAt('rel-1', CC1).total;
    const relWin = (tid) => dlShort(lb(tid)) + ' al ' + dl(lb(tid, 'finish'));
    const fases = rows('fa', [
      { fase: 'Selección y contratación', entregables: 'Mapa de procesos y requisitos de alto nivel, solicitud de propuestas, demostraciones guiadas, matriz de evaluación y contratos de suscripción e implementación (EDT ' + wcode('w2') + ').', criterioSalida: 'Contratos firmados por la Gerencia General dentro del presupuesto preliminar.', fechaPrevista: lb('t11') },
      { fase: 'Planificación y preparación', entregables: 'Plan para la dirección del proyecto, plan de releases, línea base LB0, ambientes y usuarios del ERP y plan de gestión del cambio.', criterioSalida: 'LB0 aprobada por la Gerencia General antes de la iteración 1.', fechaPrevista: lb('t03', 'finish') },
      ...['rel-1', 'rel-2', 'rel-3'].map((rid, i) => {
        const r = rel(rid), go = ['t29', 't31', 't33'][i], tid = r.taskId;
        const extra = ['inventario de la bodega principal migrado, equipos de bodega instalados y usuarios del release capacitados', 'saldos de cartera migrados, facturación electrónica habilitada y usuarios del release capacitados', 'hojas de vida migradas y usuarios del release capacitados'][i];
        const crit = ['Primera remisión emitida en producción con el inventario migrado.', 'Primera factura electrónica validada por la DIAN en producción.', 'Primera orden de mantenimiento y tablero gerencial en producción.'][i];
        return { fase: relName(rid) + ' (' + iterRange(rid) + ')', entregables: cap(relShort(rid).toLowerCase()) + ' en producción (EDT ' + wcode(r.wbsId) + ', iteraciones del ' + relWin(tid) + '); ' + extra + '.', criterioSalida: 'Historias «Debe tener» aceptadas por el dueño del producto, prueba de aceptación firmada por los usuarios clave y salida autorizada por el comité de control de cambios. ' + crit, fechaPrevista: lb(go) };
      }),
      { fase: 'Estabilización y cierre', entregables: 'Estabilización (hypercare) con el implementador, transferencia al soporte de TI, informe final, lecciones aprendidas y acta de cierre.', criterioSalida: 'Cero incidentes críticos abiertos, soporte transferido a TI y acta de cierre firmada.', fechaPrevista: lb('t06') },
    ]);
    const planRef = (tid, rev) => code(tid) + (rev !== undefined ? ' rev. ' + rev : '');
    /* fechas de las emisiones del plan: LB0, CC-001 y, después del cierre del release 1, la de la rev. 2 del plan de releases
       (planificación de la iteración 6, en 95), que incorpora la línea base del release 2 */
    const PDP2 = prelRev('2') || sprintsOf('rel-2')[1].start;
    const pdDate = (stage) => [LB0, CC1, PDP2][stage];
    /* última emisión aprobada de un documento de 95 o de otro módulo de 97 a una fecha (sin el documento, la referencia va sin
       revisión) */
    const revAt = (tid, at) => {
      const e = (base && base[tid]) || peers[tid];
      if (!e) return undefined;
      const list = [...(e.revs || []).map((r) => [r.rev, r.status || 'aprobado', r.date]), [e.rev, e.status, e.date]].filter(([rv, st, d]) => st === 'aprobado' && d && d <= at && /^\d+$/.test(String(rv)));
      list.sort((a, b) => String(a[2]).localeCompare(String(b[2])) || Number(a[0]) - Number(b[0]));
      return list.length ? String(list[list.length - 1][0]) : undefined;
    };
    const R2B = rel('rel-2').baseline;
    const r2PlanSprint = R2B ? agile.sprints.find((x) => x.start === R2B.date) : null;
    const r2SameAsLb0 = !!R2B && R2B.end === lb(rel('rel-2').taskId, 'finish') && R2B.budget === lbTask(rel('rel-2').taskId).cost;
    const planesSub = (stage) => rows('ps', [
      { plan: 'Plan de gestión del alcance', estado: 'Incluido en este plan', referencia: 'Visión del producto (' + planRef('vision-producto', revAt('vision-producto', pdDate(stage))) + ') y plan de releases (' + planRef('plan-release', revAt('plan-release', pdDate(stage))) + ')', responsable: 'Dueño del producto', resumen: 'La visión del producto y el backlog por release definen el alcance; la EDT conserva los nueve entregables y cada release es un entregable de la EDT. El alcance de un release se compromete con línea base en la planificación de su primera iteración.' },
      { plan: 'Plan de gestión de los requisitos', estado: 'Incluido en este plan', referencia: 'Backlog del producto y definición de listo y de terminado (' + planRef('definicion-terminado', revAt('definicion-terminado', pdDate(stage))) + ')', responsable: 'Dueño del producto', resumen: 'Historias de usuario con criterios de aceptación, prioridad MoSCoW y estimación en puntos; se refinan cada semana con los usuarios clave.' },
      { plan: 'Plan de gestión del cronograma', estado: 'Incluido en este plan', referencia: 'Cronograma (LB0) y plan de releases', responsable: R.dir, resumen: 'Cronograma por ruta crítica para los entregables predictivos y las salidas a producción; iteraciones de ' + sprintDays + ' días hábiles y pronóstico por velocidad para los releases. Calendario de lunes a viernes con festivos de Colombia.' },
      { plan: 'Plan de gestión de los costos', estado: 'Incluido en este plan', referencia: 'Requisitos de financiamiento (' + planRef('requisitos-financiamiento', 0) + ')', responsable: R.dir, resumen: 'Pesos colombianos sin decimales, valor ganado del proyecto sobre la LB0 en cada corte quincenal y AgileEVM de cada release; reserva para contingencias por riesgo y reserva de gestión de la Gerencia General.' },
      { plan: 'Plan de gestión de la calidad', estado: 'Incluido en este plan', referencia: 'Definición de listo y de terminado (' + planRef('definicion-terminado', revAt('definicion-terminado', pdDate(stage))) + ') y documentos de prueba y evaluación (' + planRef('documentos-prueba', revAt('documentos-prueba', pdDate(stage))) + ')', responsable: R.sm, resumen: 'La definición de terminado es el estándar de calidad de cada elemento; la prueba de aceptación firmada por los usuarios clave, el de cada release; facturas validadas por la DIAN en habilitación antes del release 2. Los documentos de prueba organizan las pruebas de cada elemento, de cada release y de cada migración.' },
      { plan: 'Plan de gestión de los recursos', estado: 'Incluido en este plan', referencia: 'Catálogo de recursos, capacidad de las iteraciones y acta de constitución del equipo (' + planRef('acta-constitucion-equipo', revAt('acta-constitucion-equipo', pdDate(stage))) + ')', responsable: R.dir, resumen: 'Equipo Scrum de cinco desarrolladores (dos al 50 %) del implementador y de TI, Scrum Master al 50 % y dueño del producto; la capacidad de cada iteración descuenta ausencias y festivos. Los acuerdos de trabajo del equipo están en su acta de constitución.' },
      { plan: 'Plan de gestión de las comunicaciones', estado: 'Aprobado', referencia: planRef('plan-gestion-comunicaciones', revAt('plan-gestion-comunicaciones', pdDate(stage))), responsable: R.dir, resumen: 'Comité quincenal con el informe de desempeño, reunión semanal con el implementador y eventos de Scrum con sus actas; carteleras, capacitación por grupos y acompañamiento en sitio para las bodegas, y registro de las comunicaciones formales (con terceros y de gobierno del proyecto).' },
      { plan: 'Plan de gestión de los riesgos', estado: 'Aprobado', referencia: planRef('plan-gestion-riesgos', revAt('plan-gestion-riesgos', pdDate(stage))), responsable: R.dir, resumen: 'Riesgos en dos niveles (impedimentos en la iteración y riesgos del proyecto en el comité quincenal), matriz 5 × 5 y reserva para contingencias asignada por riesgo.' },
      { plan: 'Plan de gestión de las adquisiciones', estado: 'Aprobado', referencia: planRef('plan-gestion-adquisiciones', revAt('plan-gestion-adquisiciones', pdDate(stage))), responsable: R.dir, resumen: 'Selección del ERP y del socio implementador con solicitud de propuestas, demostraciones guiadas y evaluación ponderada; contratos de suscripción y de implementación por iteraciones de precio fijo.' },
      { plan: 'Plan de involucramiento de los interesados', estado: 'Aprobado', referencia: planRef('plan-involucramiento-interesados', revAt('plan-involucramiento-interesados', pdDate(stage))), responsable: R.dir, resumen: 'Red de usuarios clave, revisiones de iteración abiertas a las áreas y acompañamiento en las bodegas en cada salida a producción.' },
      { plan: 'Plan de gestión de cambios', estado: 'Aprobado', referencia: planRef('plan-gestion-cambios', revAt('plan-gestion-cambios', pdDate(stage))), responsable: R.dir, resumen: 'Control integrado de cambios en dos niveles: dentro de ±10 % del alcance de un release decide el dueño del producto; lo demás, el comité de control de cambios o la Gerencia General.' },
      { plan: 'Plan de gestión de la configuración', estado: 'Incluido en este plan', referencia: 'Ambientes del ERP y revisiones de los documentos', responsable: ROLE.ti, resumen: 'Ambientes de pruebas y producción, parametrización documentada en cada historia y revisiones controladas de los documentos del proyecto en el gestor.' },
      { plan: 'Plan de releases (hoja de ruta del producto)', estado: 'Aprobado', referencia: planRef('plan-release', revAt('plan-release', pdDate(stage))), responsable: 'Dueño del producto', resumen: 'Tres releases y ' + agile.sprints.length + ' iteraciones de ' + sprintDays + ' días hábiles con velocidad supuesta de ' + ((PM.templates['plan-release'] && PM.templates['plan-release'].example.velocidadSupuesta) || 30) + ' puntos; ' + relShort('rel-1').toLowerCase() + (stage >= 2 ? ' cerrado con ' + r1PointsCC + ' puntos de línea base (CC-001) y ' + relShort('rel-2').toLowerCase() + ' comprometido con ' + R2B.points + ' puntos el ' + dl(R2B.date) : ' con ' + (stage >= 1 ? r1PointsCC + ' puntos de línea base (CC-001)' : r1Points0 + ' puntos de línea base')) + '.' },
      { plan: 'Plan de gestión del cambio organizacional', estado: 'Aprobado', referencia: 'Entregable ' + wcode('w51') + ' de la EDT', responsable: R.dir, resumen: 'Análisis de impacto por área, red de usuarios clave y seguimiento de la adopción, elaborados con el consultor de gestión del cambio.' },
      { plan: 'Caso de negocio y plan de gestión de los beneficios', estado: 'Aprobado', referencia: planRef('caso-negocio', stage >= 2 ? 1 : 0) + ' y ' + planRef('plan-gestion-beneficios', stage >= 2 ? 2 : 1), responsable: 'Dueño del producto', resumen: 'Justificación de la inversión y beneficios con su dueño y medición; se revisan al cierre de cada release.' },
    ]);
    const pdFields = (stage) => ({
      cicloVida: 'Adaptativo (ágil)',
      enfoqueDesarrollo: 'Entrega híbrida dentro de un ciclo de vida adaptativo. El producto —los tres releases del ERP— se construye con Scrum y tablero Kanban, en iteraciones de ' + sprintDays + ' días hábiles, con estimación en puntos de historia y prioridad MoSCoW: el alcance de cada release se compromete con línea base en la planificación de su primera iteración y se ajusta con lo que aprenden las áreas en cada revisión. Los entregables de preparación —selección y contratación, infraestructura y licenciamiento, migración de datos, capacitación y gestión del cambio, y salidas en vivo y estabilización— son predictivos: se planifican con la EDT y el cronograma por ruta crítica. Cada release es un entregable adaptativo de la EDT (' + wcode('w6') + ' a ' + wcode('w8') + ') vinculado a una actividad del cronograma, cuyo avance sale del backlog.',
      fases,
      adaptacion: 'Proyecto interno de nueve meses y ' + ms(F.budget) + ' cuyo producto se descubre al usarlo: se adapta la Guía del PMBOK® a un ciclo de vida adaptativo. Se aplican con rigor completo la integración (acta, este plan, LB0 y control integrado de cambios en dos niveles), los costos (valor ganado del proyecto y AgileEVM de cada release), los riesgos (registro con reserva por riesgo) y las adquisiciones (selección y contratos). El alcance, los requisitos, el cronograma de los releases, la calidad y los recursos del equipo se gestionan con los artefactos ágiles.',
      procesosSimplificados: [
        'Alcance y requisitos: la visión del producto y el backlog (historias con criterios de aceptación y prioridad MoSCoW) reemplazan el enunciado del alcance y la documentación de requisitos.',
        'Cronograma: el plan de releases y las iteraciones de ' + sprintDays + ' días hábiles reemplazan el cronograma detallado de los releases; el cronograma por ruta crítica se usa para los entregables predictivos y las salidas a producción.',
        'Calidad: la definición de terminado es el estándar de calidad de cada elemento del backlog y la prueba de aceptación firmada por los usuarios clave, el de cada release.',
        'Recursos: la capacidad del equipo por iteración, calculada con el catálogo de recursos (dedicación y ausencias), reemplaza las asignaciones detalladas de los desarrolladores.',
        'Control de cambios en dos niveles: dentro de ±10 % del alcance de un release comprometido decide el dueño del producto; fuera de ese umbral, o con cambio de fecha o de presupuesto, se tramita una solicitud de cambio.',
        'Valor ganado: el AgileEVM de cada release se vincula a su actividad del cronograma (EDT ' + wcode('w6') + ' a ' + wcode('w8') + '), así su avance entra a la curva S y al valor ganado del proyecto.',
        'Configuración: sin plan separado; los ambientes del ERP, la parametrización documentada en cada historia y las revisiones de los documentos cubren el control de la configuración.',
      ],
      planesSubsidiarios: planesSub(stage),
      lineasBase: rows('lb', [
        { lineaBase: 'Alcance', contenido: 'EDT de ' + roots.length + ' entregables (' + wcode(roots[0].id) + ' a ' + wcode(roots[roots.length - 1].id) + ') con su diccionario; visión del producto y backlog por release. ' + (stage >= 2
          ? cap(relShort('rel-1').toLowerCase()) + ' cerrado con ' + r1PointsCC + ' puntos; ' + relShort('rel-2').toLowerCase() + ' comprometido con ' + R2B.points + ' puntos en la planificación de la ' + (r2PlanSprint ? r2PlanSprint.name.toLowerCase() + ' (' + dl(R2B.date) + ')' : 'primera iteración del release (' + dl(R2B.date) + ')') + '; el ' + relShort('rel-3').toLowerCase() + ' se compromete en la planificación de la iteración ' + sprintsOf('rel-3')[0].name.replace('Iteración ', '') + '.'
          : cap(relShort('rel-1').toLowerCase()) + ' comprometido con ' + (stage >= 1 ? r1PointsCC : r1Points0) + ' puntos; los releases 2 y 3 se comprometen en la planificación de las iteraciones ' + sprintsOf('rel-2')[0].name.replace('Iteración ', '') + ' y ' + sprintsOf('rel-3')[0].name.replace('Iteración ', '') + '.'), version: 'LB0', fechaAprobacion: LB0,
          observaciones: stage >= 1 ? 'La línea base del ' + relShort('rel-1').toLowerCase() + ' pasó de ' + r1Points0 + ' a ' + r1PointsCC + ' puntos con el CC-001 (' + dl(CC1) + '), sin cambiar su fecha ni su presupuesto' + (stage >= 2 ? '; la del ' + relShort('rel-2').toLowerCase() + ' se registró en «Releases e iteraciones» con ' + (r2SameAsLb0 ? 'la fecha de fin y el presupuesto de la LB0' : 'fin el ' + dl(R2B.end) + ' y presupuesto de ' + ms(R2B.budget)) + ' (' + R2B.sprints + ' iteraciones). La LB0 del proyecto no cambia.' : '; la LB0 del proyecto no cambia.') : 'Las líneas base de cada release se mantienen en «Releases e iteraciones» y en el plan de releases.' },
        { lineaBase: 'Cronograma', contenido: 'Del ' + dl(LB.schedule.start) + ' al ' + dl(LB.schedule.finish) + ', ruta crítica con calendario de lunes a viernes y festivos de Colombia; salidas a producción el ' + andList([lb('t29'), lb('t31'), lb('t33')].map(dl)) + '.', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Las salidas a producción evitan el cierre mensual y el cierre anual.' },
        { lineaBase: 'Costos', contenido: 'BAC de las actividades de ' + ms(lbBac) + ' más reserva para contingencias de ' + ms(lbCont) + ' = ' + ms(lbCostBase) + ', distribuidos por mes en los requisitos de financiamiento.', version: 'LB0', fechaAprobacion: LB0, observaciones: 'La reserva de gestión (' + ms(lbMan) + ') queda fuera de la línea base; los releases suman ' + ms(agile.releases.reduce((s, r) => s + r.budget, 0)) + '.' },
        { lineaBase: 'Medición del desempeño', contenido: 'Valor ganado del proyecto sobre la LB0 en cada corte quincenal y AgileEVM de cada release sobre su línea base (puntos, fin, presupuesto e iteraciones).', version: 'LB0', fechaAprobacion: LB0, observaciones: 'Los releases toman su avance del backlog y entran a la curva S del proyecto.' },
      ]),
      presupuestoTotal: F.budget,
      umbralesVariacion: 'Proyecto: CPI acumulado de 0,95 o más en cada corte (criterio de éxito del acta de constitución) y SPI de 0,95 o más (alerta temprana de este plan; el criterio del acta es que ninguna salida a producción se mueva más de una iteración); entre 0,90 y 0,94 el director presenta acciones en el comité quincenal y por debajo de 0,90 se escala a la Gerencia General. Releases: alcance dentro de ±10 % de su línea base sin trámite (nivel 1, dueño del producto); fuera de ese rango, o con cambio de fecha o de presupuesto, solicitud de cambio: nivel 2 hasta COP 30 millones con cargo a la reserva para contingencias (comité de control de cambios) y nivel 3 para la fecha de fin del proyecto, la reserva de gestión o más de COP 30 millones (Gerencia General). Hitos: ninguna salida a producción se mueve más de una iteración ni cae en el cierre mensual.',
      revisiones: rows('rv', [
        { revision: 'Reunión diaria', momento: 'Diaria, 15 minutos', participantes: 'Desarrolladores y Scrum Master', proposito: 'Coordinar el trabajo del día y detectar impedimentos; el Scrum Master los escala en menos de un día hábil.' },
        { revision: 'Planificación de la iteración', momento: 'Primer día de cada iteración', participantes: 'Dueño del producto, Scrum Master y desarrolladores', proposito: 'Objetivo, capacidad y compromiso de la iteración; en la primera iteración de cada release se compromete su línea base.' },
        { revision: 'Revisión de la iteración', momento: 'Último día de cada iteración', participantes: 'Equipo Scrum, usuarios clave del release y gerente de proyecto del implementador; la Gerencia General, al cierre de cada release', proposito: 'Aceptar o rechazar los incrementos y ajustar el backlog (cambios de nivel 1).' },
        { revision: 'Retrospectiva', momento: 'Después de cada revisión', participantes: 'Scrum Master, desarrolladores y dueño del producto', proposito: 'Acciones de mejora para la iteración siguiente y lecciones aprendidas.' },
        { revision: 'Comité de seguimiento', momento: 'Quincenal', participantes: 'Gerencia General, director de proyecto, dueño del producto, Scrum Master, jefe de TI y líder del implementador; gerente comercial y contador como invitados', proposito: 'Informe de desempeño: valor ganado y AgileEVM, pronóstico de los releases, riesgos, incidentes y cambios.' },
        { revision: 'Comité de control de cambios', momento: 'Quincenal y a solicitud', participantes: 'Integrantes definidos en el plan de gestión de cambios', proposito: 'Decidir las solicitudes de cambio de nivel 2 y escalar las de nivel 3.' },
        { revision: 'Cierre de cada release', momento: 'Día hábil siguiente a la salida a producción de cada release', participantes: 'Gerencia General, dueño del producto y director de proyecto', proposito: 'Resultados del release en producción, revisión del caso de negocio y de los beneficios y liberación del siguiente tramo de financiamiento, que cubre desde el mes siguiente.' },
        { revision: 'Reunión con el implementador', momento: 'Semanal', participantes: 'Director de proyecto, Scrum Master, gerente de proyecto del implementador y líder del implementador', proposito: 'Capacidad del equipo del implementador, facturación por iteración y cumplimiento del contrato.' },
        { revision: 'Revisión de cierre', momento: 'Al terminar la estabilización', participantes: 'Gerencia General, director de proyecto, dueño del producto y jefe de TI', proposito: 'Aceptación final, transferencia al soporte, informe final y lecciones aprendidas.' },
      ]),
      mantenimientoPlan: 'El director de proyecto mantiene el plan. Se revisa después del cierre de cada release, con la hoja de ruta actualizada del plan de releases, y con cada cambio aprobado a una línea base del proyecto o de un release comprometido; cada revisión la aprueba la Gerencia General y queda en el historial del documento (borradores A, B…; emisiones aprobadas 0, 1…).' + (stage >= 1 ? ' Revisión 1 (' + dl(CC1) + '): CC-001, línea base del ' + relShort('rel-1').toLowerCase() + ' en ' + r1PointsCC + ' puntos.' : '') +
        (stage >= 2 ? ' Revisión 2 (' + dl(PDP2) + '): cierre del ' + relShort('rel-1').toLowerCase() + ', línea base del ' + relShort('rel-2').toLowerCase() + ' en ' + R2B.points + ' puntos, plan de releases (' + planRef('plan-release', revAt('plan-release', PDP2)) + '), caso de negocio (' + planRef('caso-negocio', 1) + ') y plan de gestión de los beneficios (' + planRef('plan-gestion-beneficios', 2) + ').' : ''),
    });

    /* ================================================================ 7.3 · REQUISITOS DE FINANCIAMIENTO */
    const evm = PM.calc.evm({ sched: PM.calc.computeSchedule(PM.agile.applyToSchedule(schedule, agile, items), START), costBaseline: LB, costs, statusDate: STATUS_DATE });
    const months = []; for (let m = D.startOfMonth(LB.schedule.start); m <= LB.schedule.finish; m = D.addMonths(m, 1)) months.push(m);
    const monthEnd = (m) => D.add(D.addMonths(m, 1), -1);
    const firstWork = (m) => cal.dateOf(cal.indexOf(m));
    const cumPv = months.map((m) => r100k(evm.pvAt(monthEnd(m))));
    const egresos = cumPv.map((c, i) => c - (i ? cumPv[i - 1] : 0));
    /* reserva para contingencias por mes: cada riesgo del registro (rev. 0) en proporción al valor planificado de sus actividades */
    const rr0 = base && base['registro-riesgos'] && Array.isArray(base['registro-riesgos'].revs) ? (base['registro-riesgos'].revs.find((r) => r.rev === '0') || {}).fields : null;
    const risks0 = rr0 && Array.isArray(rr0.riesgos) ? rr0.riesgos.filter((r) => r.reserva > 0) : [];
    const pvBetween = (tid, a, b) => { const t = lbTask(tid); if (!t.cost) return 0; const f = (at) => PM.calc.plannedFraction(cal, t.start, t.finish, t.milestone, at); return t.cost * (f(b) - f(D.add(a, -1))); };
    const taskPvMonth = (tid, i) => pvBetween(tid, months[i], monthEnd(months[i]));
    const contRaw = months.map(() => 0);
    for (const r of risks0) {
      const w = months.map((m, i) => (RISK_TASKS[r.id] || []).reduce((s, tid) => s + taskPvMonth(tid, i), 0));
      const tot = w.reduce((s, x) => s + x, 0);
      w.forEach((x, i) => { contRaw[i] += tot ? (r.reserva * x) / tot : 0; });
    }
    if (!risks0.length) months.forEach((m, i) => { contRaw[i] = (lbCont * egresos[i]) / lbBac; });
    const cumC = []; contRaw.reduce((acc, x, i) => { cumC[i] = r100k(acc + x); return acc + x; }, 0);
    const contingencia = cumC.map((c, i) => c - (i ? cumC[i - 1] : 0));
    /* tramos: ventanas de meses completos. El tramo 1 se libera con el acta de constitución y el 2 al firmar los contratos;
       desde el 3, cada tramo se libera con la revisión del caso de negocio al cierre de un release (día hábil siguiente a su
       salida a producción, según la LB0) y cubre desde el mes siguiente a esa revisión. Así cada tramo está disponible antes de
       empezar su ventana, y el arranque del release siguiente lo financia el tramo anterior, que cubre su mes completo. */
    const monthIdx = (iso) => months.indexOf(D.startOfMonth(iso));
    const SIGN = F.milestones.t11.actual || lb('t11');
    const GATES0 = [START, lb('t11'), cal.addWork(lb('t29'), 1), cal.addWork(lb('t31'), 1)];
    const cuts = [0, ...GATES0.slice(1).map((g) => monthIdx(g) + 1), months.length];
    const tramos = cuts.slice(0, -1).map((a, k) => {
      const b = cuts[k + 1];
      const need = egresos.slice(a, b).reduce((s, x) => s + x, 0) + contingencia.slice(a, b).reduce((s, x) => s + x, 0);
      return { n: k + 1, from: a, to: b - 1, need, amount: Math.ceil(need / 1e5) * 1e5, start: a === 0 ? LB.schedule.start : months[a], end: monthEnd(months[b - 1]) };
    });
    /* alcance real de cada ventana: actividades predictivas con valor planificado en ella (LB0) e iteraciones de los releases */
    const WORK = {
      t02: 'arranque', t07: 'descubrimiento', t08: 'solicitud de propuestas', t09: 'demostraciones', t10: 'negociación de los contratos',
      t03: 'planificación', t13: 'ambientes', t14: 'equipos de bodega', t15: 'habilitación del proveedor tecnológico', t20: 'gestión del cambio', t21: 'formación de usuarios clave',
      t16: 'depuración de datos', t17: 'migración del inventario', t18: 'migración de cartera', t19: 'migración de hojas de vida',
      t22: 'capacitación del release 1', t23: 'capacitación del release 2', t24: 'capacitación del release 3',
      t28: 'salida del release 1', t30: 'salida del release 2', t32: 'salida del release 3', t34: 'estabilización', t05: 'cierre',
    };
    const workIn = (t) => [...new Set(LB.schedule.tasks.filter((x) => WORK[x.id] && pvBetween(x.id, t.start, t.end) > 0).sort((x, y) => String(x.start).localeCompare(String(y.start))).map((x) => WORK[x.id]))];
    const iterNum = (s) => s.name.replace('Iteración ', '');
    const relParts = (t) => ['rel-1', 'rel-2', 'rel-3'].map((rid) => {
      const all = sprintsOf(rid), over = all.filter((s) => s.start <= t.end && s.end >= t.start);
      if (!over.length) return null;
      const head = over.find((s) => s.start < t.start), tail = over.find((s) => s.end > t.end && s !== head);
      const full = over.filter((s) => s !== head && s !== tail);
      const rn = relShort(rid).toLowerCase();
      const brief = !head && !tail && full.length === all.length ? rn : all[0].start >= t.start ? 'el inicio del ' + rn : all[all.length - 1].end <= t.end ? 'el resto del ' + rn : 'parte del ' + rn;
      if (!head && !tail && full.length === all.length) return { brief, long: rn + ' (' + iterRange(rid) + ')' };
      const parts = [];
      if (head) parts.push('el final de la iteración ' + iterNum(head));
      if (full.length) parts.push(full.length === 1 ? 'la iteración ' + iterNum(full[0]) : 'las iteraciones ' + andList(full.map(iterNum)));
      if (tail) parts.push('el inicio de la iteración ' + iterNum(tail));
      return { brief, long: andList(parts) + ' del ' + rn };
    }).filter(Boolean);
    const tramoWhat = (t) => [andList(workIn(t)), ...relParts(t).map((p) => p.long)].filter(Boolean).join('; ');
    const tramoBrief = (t) => andList(relParts(t).map((p) => p.brief));
    const span = (a, b) => (a === b ? monthName(months[a]) : (months[a].slice(0, 4) === months[b].slice(0, 4) ? monthName(months[a]).replace(/ de 20\d\d$/, '') : monthName(months[a])) + ' a ' + monthName(months[b]));
    const tramoSpan = (t) => span(t.from, t.to);
    /* revisiones que liberan los tramos 3 y 4: la del release 1 ya ocurrió al corte (R1_REVIEW); la del release 2, prevista */
    const tramoWhen = (k, stage) => [
      'liberado con el acta de constitución (' + dl(START) + ')',
      'liberado al firmar los contratos (' + dl(SIGN) + ') y confirmado con la LB0 (' + dl(LB0) + ')',
      stage >= 1 ? 'liberado con la revisión del caso de negocio al cierre del ' + relShort('rel-1').toLowerCase() + ' (' + dl(R1_REVIEW) + ')' : 'que se libera con la revisión del caso de negocio al cierre del ' + relShort('rel-1').toLowerCase() + ', prevista para el ' + dl(GATES0[2]),
      'que se libera con la revisión del caso de negocio al cierre del ' + relShort('rel-2').toLowerCase() + ', prevista para el ' + dl(GATES0[3]),
    ][k];
    const periodos = rows('pe', months.map((m, i) => {
      const t = tramos.find((x) => x.from === i);
      return { periodo: cap(monthName(m)), fecha: i === 0 ? LB.schedule.start : firstWork(m), egresos: egresos[i], contingencia: contingencia[i], financiamiento: t ? t.amount : 0, fuente: 'Capital de trabajo de la empresa' };
    }));
    const need = egresos.map((e, i) => e + contingencia[i]);
    const peak = need.reduce((b, x, i) => (x > need[b] ? i : b), 0);
    const fundTotal = tramos.reduce((s, t) => s + t.amount, 0);
    const tramoText = (stage) => tramos.map((t, k) => cap('tramo ' + t.n + ' (' + ms(t.amount) + '), ' + tramoWhen(k, stage) + ', para ' + tramoSpan(t) + ': ' + tramoWhat(t) + '.')).join(' ');
    /* costos que forman los egresos (catálogo de recursos, EDT y releases), sin fijar momentos de pago: esos los fijan los contratos */
    const condicionesPago = 'Proyecto interno: no hay contrato con un cliente ni ingresos que programar. Los egresos de la tabla son el valor planificado de la LB0, es decir, el costo devengado en cada mes, no un programa de pagos: el equipo del implementador a precio fijo de ' + ms(implFee) + ' por iteración, más las bolsas de ' + ms(bolsa2) + ' del conector en el ' + relShort('rel-2').toLowerCase() + ' y de ' + ms(bolsa3) + ' del tablero gerencial en el ' + relShort('rel-3').toLowerCase() + '; la suscripción del ERP, ' + money(subMonthly) + ' al mes de ' + monthName(lbTask('t12').start) + ' a ' + monthName(lbTask('t12').finish) + '; los equipos de bodega, el paquete de facturación electrónica y los consultores, y las horas internas, que se pagan con la nómina de cada mes. Los pagos a los proveedores siguen las condiciones de cada contrato (plazo de pago después de la factura electrónica y retención en garantía hasta la aceptación de cada release), que están en el registro de contratos y acuerdos; por eso el desembolso de caja va detrás del devengo y los tramos, calculados sobre el devengo, dejan un margen de caja en cada ventana.';
    const finFieldsAt = (stage) => ({
      presupuestoTotal: F.budget,
      lineaBaseCostos: lbCostBase,
      reservaGestion: lbMan,
      fuentes: 'Recursos propios de la empresa (capital de trabajo); no hay anticipos ni crédito. La Gerencia General libera el financiamiento por tramos que cubren meses completos: el primero con el acta de constitución y el segundo al firmar los contratos. Desde el tercero, cada tramo se libera solo si la revisión del caso de negocio al cierre de un release confirma su valor, y cubre desde el mes siguiente a esa revisión: el arranque del release siguiente lo financia el tramo anterior, que cubre su mes completo, para que el equipo no se detenga mientras se hace la revisión. Cada tramo incluye también los costos continuos de sus meses (la dirección del proyecto y, desde ' + monthName(lb('t12')).replace(/ de 20\d\d$/, '') + ', la suscripción del ERP y la facilitación ágil) y la parte de la reserva para contingencias de esos meses. ' + tramoText(stage) + ' La reserva de gestión (' + ms(lbMan) + ') queda en la tesorería y no entra en los tramos: si la Gerencia General autoriza su uso, se gira como un tramo adicional.',
      periodos,
      condicionesPago,
      conciliacionLimite: 'Los egresos de cada mes son el valor planificado de la línea base de costos (LB0) y la reserva para contingencias (' + ms(lbCont) + ') se reparte por mes según el registro de riesgos: cada riesgo, en los meses de las actividades que expone y en proporción a su valor planificado. Límite de financiamiento: el presupuesto aprobado de ' + ms(F.budget) + '; los tramos suman ' + ms(fundTotal) + ', la línea base de costos, y la reserva de gestión queda en la tesorería. La holgura acumulada nunca es negativa: cada tramo está disponible desde el primer día de su ventana, la cubre completa y queda en cero al terminarla. El mes de mayor egreso es ' + monthName(months[peak]) + ' (' + ms(need[peak]) + ' con la contingencia), por ' + (peak === monthIdx(lb('t14')) ? 'los equipos de bodega, la formación de usuarios clave y el inicio del ' + relShort('rel-1').toLowerCase() : 'las iteraciones de los releases') + '.',
      riesgosFinanciamiento: 'Tasa de cambio de los equipos de bodega importados (supuesto de COP 4.000 por dólar) y horas adicionales del conector con el proveedor tecnológico por encima de su bolsa (R-004). Se cubren con la reserva para contingencias, que el director de proyecto autoriza por riesgo; lo que supere esa reserva es un cambio de nivel 3 que decide la Gerencia General con la reserva de gestión.',
    });
    const finFields0 = finFieldsAt(0);
    /* revisión en curso al corte: desembolso real frente a la LB0 y a los tramos liberados */
    const acMonth = (m) => (costs.actuals || []).filter((a) => a.date >= m && a.date <= monthEnd(m) && a.date <= STATUS_DATE).reduce((s, a) => s + a.amount, 0);
    const closedMonths = months.filter((m) => monthEnd(m) <= STATUS_DATE);
    const GATES_NOW = [START, SIGN, R1_REVIEW, GATES0[3]];
    const released = tramos.filter((t, k) => GATES_NOW[k] <= STATUS_DATE);
    const releasedSum = released.reduce((s, t) => s + t.amount, 0);
    const E = F.evm;
    const closedTramos = tramos.filter((t) => t.end <= STATUS_DATE).map((t) => {
      const ac = months.slice(t.from, t.to + 1).reduce((sum, m) => sum + acMonth(m), 0);
      return 'tramo ' + t.n + ', real ' + ms(ac) + ' frente a ' + ms(t.amount) + (ac > t.amount ? ' (el exceso de ' + ms(ac - t.amount) + ' lo absorbió el tramo ' + (t.n + 1) + ', disponible desde el ' + dl(GATES_NOW[t.n]) + ')' : '');
    });
    /* bolsa del conector (t26, costo fijo de la LB0): consumo real frente a la parte que corresponde al avance del release 2 */
    const r2prog = F.releases && F.releases['rel-2'] ? F.releases['rel-2'].prog : PM.calc.releaseProgress({ release: rel('rel-2'), items, settings: PM.agile.settings(agile) });
    const bolsaEarned = bolsa2 * r2prog.pct;
    const bolsaProj = r2prog.pct ? connectorExtra / r2prog.pct : 0;
    const bolsaText = 'el conector con el proveedor tecnológico ha consumido ' + ms(connectorExtra) + ' de la bolsa de ' + ms(bolsa2) + ' con el ' + pc(r2prog.pct, 1) + ' del ' + relShort('rel-2').toLowerCase() + ' terminado (' + r2prog.done + ' de ' + r2prog.total + ' puntos), ' +
      (connectorExtra > bolsaEarned ? ms(connectorExtra - bolsaEarned) + ' por encima de la parte de la bolsa que corresponde a ese avance' : 'dentro de la parte de la bolsa que corresponde a ese avance') +
      (bolsaProj > bolsa2 ? '; al mismo ritmo, el consumo llegaría a ' + ms(bolsaProj) + ' al terminar el release, ' + ms(bolsaProj - bolsa2) + ' más que la bolsa' : '') + '.';
    const finFields = {
      ...finFieldsAt(1),
      conciliacionLimite: finFields0.conciliacionLimite + ' Al corte del ' + dl(STATUS_DATE) + ' se han liberado los tramos ' + andList(released.map((t) => String(t.n))) + ' (' + ms(releasedSum) + ') y el costo real acumulado es de ' + ms(E.ac) + ' frente a un valor planificado de ' + ms(E.pv) + ': holgura de ' + ms(releasedSum - E.ac) + '. Por mes, real frente a la LB0: ' + closedMonths.map((m) => { const i = months.indexOf(m); return monthName(m).replace(/ de 20\d\d$/, '') + ' ' + ms(acMonth(m)) + ' frente a ' + ms(egresos[i]); }).join('; ') + '. Ventanas cerradas: ' + closedTramos.join('; ') + '.',
      riesgosFinanciamiento: 'Materializado: la tasa de cambio encareció los equipos de bodega en ' + ms(t14Over) + ' (S-03, descartado). En seguimiento (R-004): ' + bolsaText + ' El EAC al corte es de ' + ms(E.eac) + ' frente a un BAC de ' + ms(E.bac) + ' (VAC de ' + ms(E.vac) + '): la diferencia cabe en la reserva para contingencias, que ya está en los tramos, así que el financiamiento total no cambia. Como propone el informe de desempeño del corte del ' + dl(STATUS_DATE) + ', el uso de la reserva se decide si el EAC se confirma en el siguiente corte; el tramo 4 se ajusta en la revisión al cierre del ' + relShort('rel-2').toLowerCase() + '.',
    };
    /* tramo 3 (el que libera la revisión del caso al cierre del release 1), para el caso de negocio rev. 1 */
    const T3 = tramos[2];

    /* ================================================================ entradas por plantilla */
    const TB_PO = { elaboro: ROLE.pof, reviso: R.dir, aprobo: ROLE.pat };
    return {
      'caso-negocio': {
        status: 'aprobado', rev: '1', date: R1_REVIEW, created: START, titleBlock: TB_PO, fields: casoFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: START, note: 'Emisión inicial con el presupuesto preliminar de orden de magnitud, aprobada junto con el acta de constitución.', fields: casoFields(0) },
          { rev: '1', status: 'aprobado', date: R1_REVIEW, note: 'Revisión al cierre del ' + relShort('rel-1').toLowerCase() + ': presupuesto aprobado, suscripción contratada y primeros resultados; se libera el tramo 3 del financiamiento, desde ' + monthName(T3.start) + '.' },
        ],
      },
      'plan-gestion-beneficios': {
        status: 'aprobado', rev: '2', date: R1_REVIEW, created: START, titleBlock: TB_PO, fields: benFields(2),
        revs: [
          { rev: '0', status: 'aprobado', date: START, note: 'Beneficios preliminares con líneas base estimadas.', fields: benFields(0) },
          { rev: '1', status: 'aprobado', date: LB0, note: 'Líneas base medidas en el descubrimiento y metas de la visión del producto.', fields: benFields(1) },
          { rev: '2', status: 'aprobado', date: R1_REVIEW, note: 'Primera medición al cierre del ' + relShort('rel-1').toLowerCase() + ' y control de faltantes con el peso de báscula (CC-001).' },
        ],
      },
      'registro-supuestos': {
        status: 'revision', rev: '2A', date: '2026-10-08', created: '2026-05-05', titleBlock: { elaboro: R.dir, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: supFields(2),
        revs: [
          { rev: '0', status: 'aprobado', date: '2026-05-05', note: 'Emisión inicial después de la reunión de arranque.', fields: supFields(0) },
          { rev: '1', status: 'aprobado', date: LB0, note: 'Revisión con el plan de releases y la LB0: supuestos de la planificación y restricciones de los contratos.', fields: supFields(1) },
        ],
      },
      'plan-direccion': {
        status: 'aprobado', rev: '2', date: PDP2, created: lb('t03'), titleBlock: { elaboro: R.dir, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: pdFields(2),
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con la LB0 y el plan de releases.', fields: pdFields(0) },
          { rev: '1', status: 'aprobado', date: CC1, note: 'CC-001: línea base del ' + relShort('rel-1').toLowerCase() + ' en ' + r1PointsCC + ' puntos; la LB0 del proyecto no cambia.', fields: pdFields(1) },
          { rev: '2', status: 'aprobado', date: PDP2, note: 'Después del cierre del ' + relShort('rel-1').toLowerCase() + ': línea base del ' + relShort('rel-2').toLowerCase() + ' en ' + R2B.points + ' puntos, plan de releases, caso de negocio y beneficios revisados; la LB0 del proyecto no cambia.' },
        ],
      },
      'requisitos-financiamiento': {
        status: 'revision', rev: '1A', date: STATUS_DATE, created: lb('t03'), titleBlock: { elaboro: R.dir, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: finFields,
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con la LB0.', fields: finFields0 },
        ],
      },
    };
  }

  PM.exampleDocs = PM.exampleDocs || {};
  (PM.exampleDocs.erpParts = PM.exampleDocs.erpParts || []).push(part);
  /* supuestos del caso de negocio y reparto de la reserva, para las pruebas y la documentación */
  PM.exampleDocs.erpIntegracion = { BEN: PM.deepFreeze ? PM.deepFreeze(cp(BEN)) : cp(BEN), ALT: cp(ALT), RISK_TASKS: cp(RISK_TASKS) };
})();

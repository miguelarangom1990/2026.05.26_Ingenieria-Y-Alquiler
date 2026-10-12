/* ==========================================================================
   97-example-erp-docs-adquisiciones.js — documentos de adquisiciones del
   ejemplo ágil «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
   (94-example-erp.js, SPEC §9.7): plan de gestión de las adquisiciones,
   estrategia, análisis de hacer o comprar, enunciados del trabajo (SOW),
   criterios de selección, registro de contratos y seguimiento de contratos.
   Se registra en PM.exampleDocs.erpParts con la firma (F, ctx): F son los
   hechos que calcula 94 (computeFacts) y ctx = {R, CODE, STATUS_DATE, data}
   (schedule, wbs, costs, agile, items, baselines y resources).
   De dónde sale cada cifra:
   - Fechas de las adquisiciones: actividades de la LB0 (t07 a t15, t20) y
     días hábiles del calendario del proyecto.
   - Valores de los contratos: catálogo de recursos por las asignaciones del
     cronograma (suscripción, implementador, proveedor tecnológico, equipos,
     red y consultores), releases (bolsas) e iteraciones (precio fijo).
   - Ejecutado, pagado y retenido: costos reales del ejemplo agrupados por
     proveedor (descripción del registro de costos), con la regla de pago a 30
     días y la retención del 5 % de las iteraciones hasta aceptar el release.
   - Desempeño del implementador: velocidad, iteraciones cerradas, elementos
     aceptados y rechazados en las revisiones y AgileEVM de los releases.
   Supuestos propios (SUP, abajo; docs/ejemplo-erp/supuestos-y-fuentes.md):
   costos de «hacer», tarifa de referencia de la estimación independiente,
   puntajes de la evaluación de ofertas, números de contrato y calificaciones
   de los proveedores.
   Los documentos aprobados (y sus revisiones) no citan hechos posteriores a
   su fecha. Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.calc || !PM.agile || !PM.date || !PM.res || !PM.cal) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const ms = (v) => plain(PM.fmt.moneyShort(v, 'COP'));
  const money = (v) => plain(PM.fmt.money(v, 'COP'));
  const ix = (v) => plain(PM.fmt.idx(v));
  const n0 = (v) => plain(PM.fmt.num(v, 0));
  const n1 = (v) => plain(PM.fmt.num(v, 1));
  const pc = (x, d) => plain(PM.fmt.pct(x, d || 0));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
  const monthName = (iso) => plain(PM.fmt.date(iso, 'monthLong'));
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
  const round1 = (v) => Math.round(v * 10) / 10;
  const round2 = (v) => Math.round(v * 100) / 100;
  const M = 1e6;
  const mm = (x) => Math.round(x * M);
  const lc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  const nw = (n) => (Number.isInteger(n) && n >= 0 && n <= 10 ? WORDS[n] : n0(n));
  const andList = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);

  const ROLE = {
    pat: 'Gerencia General', dir: 'Director de proyecto (jefe de la PMO)', pof: 'Gerente administrativo y financiero', ti: 'Jefe de TI',
    jur: 'Asesor jurídico', csel: 'Consultor de selección (independiente)', comite: 'Comité de selección', con: 'Contador',
  };
  const IMPL = 'Socio implementador';

  /* ------------------------------------------------------------------ supuestos del módulo (ejemplo)
     Cifras que no salen de los datos del proyecto; están en docs/ejemplo-erp/supuestos-y-fuentes.md. */
  const SUP = {
    /* tasa de planificación de los equipos importados (la del presupuesto, sección 1 de los supuestos del ejemplo) */
    trm: 4000,
    /* estimación independiente del consultor de selección (25 de mayo): tarifa de referencia por hora del implementador */
    tarifaReferencia: 85000,
    /* condiciones de pago: días calendario después de la factura y retención en garantía de las iteraciones */
    pagoDias: 30, retencion: 0.05,
    /* números de contrato (consecutivos de la empresa) */
    num: { sel: 'OS-2026-018', jur: 'OS-2026-031', sub: 'CT-2026-007', impl: 'CT-2026-008', cgc: 'OS-2026-034', eq: 'OC-2026-052', red: 'OS-2026-036', fe: 'CT-2026-011' },
    /* análisis de hacer o comprar: costo de las opciones con recursos propios (horizonte de tres años de operación) */
    hacer: {
      plataforma: mm(520),        // licencias perpetuas de 45 usuarios, servidores con respaldo, soporte anual y administración (3 años)
      curva: 1.5,                 // iteraciones de más de un equipo propio por la curva de aprendizaje del ERP
      reclutamiento: mm(35),      // selección, contratación y formación certificada del equipo propio
      facturacion: mm(96),        // solución propia de facturación electrónica habilitada ante la DIAN y su mantenimiento (3 años)
      migracionFirma: mm(62),     // firma especializada en migración de datos (opción externa de la depuración y la migración)
      cambioDias: 20,             // jornadas de un profesional de la PMO para el plan de gestión del cambio sin consultor
      digitacion: 0.5,            // jornada diaria de un auxiliar por bodega para digitar las actas en papel (sin equipos de campo)
      diasMes: 21, meses: 36,     // días hábiles por mes y meses del horizonte
      redMateriales: mm(4.6),     // puntos de acceso y cableado comprados por la empresa
      redDiasTI: 8,               // jornadas del jefe de TI para instalar la red
    },
    /* evaluación de ofertas (22 de junio): costo total a tres años de A y C frente al de B y puntajes de 0 a 100 */
    ofertas: { A: 1.14, C: 0.93 },
    criterios: [
      { criterio: 'Funcionalidad en los guiones de negocio', descripcion: 'Demostración guiada con los mismos guiones y datos de la empresa: pedido, despacho, devolución, liquidación del alquiler y factura electrónica.', peso: 35, A: 88, B: 92, C: 70 },
      { criterio: 'Costo total a tres años', descripcion: 'Suscripción de los usuarios por 36 meses y once iteraciones de 240 horas; el puntaje es proporcional a la oferta de menor costo.', peso: 25, costo: true },
      { criterio: 'Experiencia y referencias del implementador', descripcion: 'Implementaciones del ERP ofrecido en empresas de alquiler o distribución en los últimos tres años, verificadas con dos clientes.', peso: 15, A: 90, B: 85, C: 60 },
      { criterio: 'Trabajo por iteraciones y estabilidad del equipo', descripcion: 'Experiencia en entregas iterativas con Scrum, equipo propuesto con dedicación definida y compromiso de reemplazo con un perfil equivalente.', peso: 15, A: 70, B: 90, C: 65 },
      { criterio: 'Soporte y nivel de servicio', descripcion: 'Disponibilidad del servicio en la nube, mesa de ayuda en español y tiempos de respuesta del fabricante y del implementador.', peso: 10, A: 85, B: 85, C: 75 },
    ],
    /* calificaciones de desempeño (1 a 5; null = no aplica) en el seguimiento al cierre del release 1 (0) y al corte (1) */
    calif: {
      sel: [[5, 5, 5], [5, 5, 5]], jur: [[5, 5, null], [5, 5, null]], sub: [[5, 5, null], [5, 5, null]], impl: [[5, 4, 5], [4, 4, 5]],
      cgc: [[5, 4, 5], [5, 4, 5]], eq: [[3, 4, 5], [3, 4, 5]], red: [[5, 5, 5], [5, 5, 5]], fe: [[5, 4, null], [5, 2, null]],
    },
  };

  /* ================================================================== módulo */
  function part(F, ctx) {
    const { R, CODE, STATUS_DATE, data } = ctx;
    const { schedule, wbs, costs, agile, items, baselines, resources } = data;
    if (!schedule || !wbs || !costs || !agile || !Array.isArray(items) || !Array.isArray(baselines) || !resources) return {};
    const CUT = STATUS_DATE, START = F.start, END = F.end, LB0 = F.lb0Date;
    const cal = PM.cal.make(schedule.settings, START);
    const tree = PM.calc.wbsTree(wbs.nodes);
    const wcode = (id) => tree.codes.get(id);
    const wname = (id) => tree.byId.get(id).name;
    const LB = baselines.map((b) => b.data).find((b) => b && b.number === 0);
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id);
    const task = (id) => schedule.tasks.find((t) => t.id === id);
    const st = PM.agile.settings(agile);
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const sprints = PM.agile.sortSprints(agile.sprints);
    const nSprints = sprints.length;
    const cat = PM.res.catalog(resources, schedule);
    const item = (key) => cat.byId.get('rec-' + key);
    const hoursDay = (it) => (it && it.hoursPerDay) || 8;
    const ded = (it) => (it && it.dedication !== undefined && it.dedication !== null ? it.dedication : 100) / 100;

    /* documentos de 95 que se citan (límite de gasto del acta, incidentes, próximos pasos del informe de desempeño) */
    const base = (PM.exampleDocs && typeof PM.exampleDocs.erp === 'function') ? PM.exampleDocs.erp(F) || {} : {};
    const limite = Number(base['acta-constitucion'] && base['acta-constitucion'].fields && base['acta-constitucion'].fields.limiteGasto) || 0;
    const incidents = (base['registro-incidentes'] && base['registro-incidentes'].fields && base['registro-incidentes'].fields.incidentes) || [];
    const inc = (id) => incidents.find((x) => x.id === id) || null;
    const inf = base['informe-desempeno'] && Array.isArray(base['informe-desempeno'].instances) ? base['informe-desempeno'].instances.find((x) => x.date === CUT) : null;
    const pasoAviso = inf && inf.fields && Array.isArray(inf.fields.proximosPasos) ? inf.fields.proximosPasos.find((p) => /aviso automático/.test(p.accion)) : null;
    const limTxt = limite ? ms(limite) : 'el límite de gasto del acta';

    /* ---------------------------------------------------------------- fechas (LB0 y calendario del proyecto) */
    const T = {
      selSol: cal.addWork(START, -5), selAdj: START, selFin: lbT('t09').finish,
      disc: lbT('t07').finish, rfp: lbT('t08').start, demoIni: lbT('t09').start, eval: lbT('t09').finish, adj: lbT('t10').start, sign: lbT('t11').start,
      jurSol: cal.addWork(lbT('t10').start, -5), jurAdj: cal.addWork(lbT('t10').start, -1), jurIni: lbT('t10').start, jurFin: lbT('t10').finish,
      cgcSol: cal.addWork(lbT('t20').start, -10), cgcAdj: cal.addWork(lbT('t20').start, -1), cgcIni: lbT('t20').start, cgcFin: lbT('t20').finish,
      eqSol: cal.addWork(lbT('t14').start, -10), eqAdj: cal.addWork(lbT('t14').start, -1), eqIni: lbT('t14').start, eqFin: lbT('t14').finish,
      feSol: cal.addWork(lbT('t15').start, -10), feAdj: cal.addWork(lbT('t15').start, -3), feIni: lbT('t15').start, feFin: lbT('t15').finish,
      subIni: lbT('t12').start, subFin: D.endOfMonth(lbT('t12').finish), implIni: lbT('t13').start, implFin: END,
      lb0: LB0, it2: sprints[1].start, r1End: rel('rel-1').end, r2Start: rel('rel-2').start,
    };
    T.feLimite = cal.addWork(T.r2Start, -1);
    T.feServicioFin = D.addMonths(T.feFin, 12);
    /* revisión del seguimiento al cierre del release 1 (día hábil siguiente a su salida a producción) y del registro con el
       contrato del proveedor tecnológico */
    const C0 = cal.addWork(task('t29').actualFinish, 1);
    const REG1 = T.feIni;

    /* ---------------------------------------------------------------- valores de los contratos (catálogo y cronograma) */
    /* costo de un recurso del catálogo en las actividades del cronograma (unidades × días o cantidad × costo unitario) */
    const resCost = (key, filter) => sum(schedule.tasks.filter((t) => !filter || filter(t)), (t) => sum((t.resources || []).filter((a) => a.resourceId === 'rec-' + key), (a) => PM.res.assignment(cat, t, a).cost));
    const resQty = (key, filter) => sum(schedule.tasks.filter((t) => !filter || filter(t)), (t) => sum((t.resources || []).filter((a) => a.resourceId === 'rec-' + key), (a) => PM.res.assignment(cat, t, a).qty));
    const t12 = task('t12');
    let subMonths = 0; for (let m = D.startOfMonth(lbT('t12').start); m <= lbT('t12').finish; m = D.addMonths(m, 1)) subMonths++;
    const subFull = resQty('suc') / subMonths, subLim = resQty('sul') / subMonths, subUsers = subFull + subLim;
    const subValue = resCost('suc') + resCost('sul');
    const subMonthly = subValue / subMonths;
    const team = cat.items.filter((it) => it.supplier === IMPL && it.agileTeam);
    const implFee = sum(team, (it) => it.unitCost * ded(it) * st.sprintLength);
    const implHours = sum(team, (it) => ded(it) * hoursDay(it) * st.sprintLength);
    const rate = item('cf').unitCost / hoursDay(item('cf'));
    const rateLider = item('lim').unitCost / hoursDay(item('lim'));
    const analyst = item('at').unitCost * st.sprintLength;
    const bolsa2 = task('t26').costFixed || 0;
    const r3 = rel('rel-3');
    const bolsa3 = r3.budget - r3.plannedSprints * (implFee + analyst);
    const fixedPart = nSprints * implFee;
    const implValue = fixedPart + bolsa2 + bolsa3;
    /* horas de los servicios por horas del implementador según las asignaciones del cronograma (fuera de los releases) */
    const implHoursOf = (tid) => { const t = task(tid); return sum((t.resources || []).filter((a) => { const it = cat.resolve(a); return it && it.supplier === IMPL; }), (a) => PM.res.assignment(cat, t, a).qty * hoursDay(cat.resolve(a))); };
    const hFormacion = implHoursOf('t21'), hCapacitacion = implHoursOf('t22'), hEstabilizacion = implHoursOf('t34');
    const feValue = resCost('fe');
    const feDocs = Number((/\(([\d.]+) documentos\)/.exec(item('fe').name) || [, '0'])[1].replace(/\./g, ''));
    const eqKeys = ['tab', 'lec', 'imp'];
    const eqQty = Object.fromEntries(eqKeys.map((k) => [k, resQty(k)]));
    const eqPlanned = sum(eqKeys, (k) => resCost(k));
    const eqUsd = eqPlanned / SUP.trm;
    const redPlanned = resCost('red');
    const selRate = item('csel').unitCost, selDays = resQty('csel'), selValue = resCost('csel');
    const jurValue = resCost('jur'), jurDays = resQty('jur');
    const cgcValue = resCost('cgc'), cgcDays = resQty('cgc');
    const supplier = (key) => item(key).supplier;
    const vSup = (PM.templates['plan-release'] && PM.templates['plan-release'].example && PM.templates['plan-release'].example.velocidadSupuesta) || 30;
    const vMeta = Math.round(vSup * 0.9);
    const w4Cost = tree.byId.get('w4').costEstimate;

    /* ---------------------------------------------------------------- costos reales por contrato */
    const by = (re) => (a) => re.test(String(a.description || ''));
    const MATCH = {
      sel: by(/^Consultor de selección/), jur: by(/^Asesoría jurídica/), sub: by(/^Suscripción del ERP/), impl: by(/^Implementador/),
      cgc: by(/^Consultor de gestión del cambio/), eq: (a) => a.category === 'Equipos', red: by(/^Red inalámbrica/), fe: by(/^Proveedor tecnológico/),
    };
    const isIter = by(/precio fijo por iteración/), isBolsa = by(/horas adicionales del conector/);
    const actualsOf = (key, at) => costs.actuals.filter((a) => a.date <= at && MATCH[key](a));
    const total = (list) => sum(list, (a) => a.amount);
    const docsOf = (list) => andList(list.map((a) => a.document));
    const relAccepted = (rid, at) => { const r = rel(rid); return !!r && r.status === 'cerrado' && r.end <= at; };
    const retained = (a, at) => (isIter(a) && a.releaseId && !relAccepted(a.releaseId, at) ? SUP.retencion : 0);
    const paidAt = (a, at) => D.add(a.date, SUP.pagoDias) <= at;
    const pagado = (list, at) => Math.round(sum(list.filter((a) => paidAt(a, at)), (a) => a.amount * (1 - retained(a, at))));
    const retenido = (list, at) => Math.round(sum(list, (a) => a.amount * retained(a, at)));
    const eqFinal = total(actualsOf('eq', CUT)), redFinal = total(actualsOf('red', CUT));
    const selFinal = total(actualsOf('sel', CUT));
    const otrosAt = (at) => costs.actuals.filter((a) => a.category === 'Otros' && a.date <= at);
    /* días hábiles de retraso de la entrega de los equipos (fin real frente a la LB0) */
    const eqLate = cal.countWork(D.add(T.eqFin, 1), task('t14').actualFinish);

    /* ---------------------------------------------------------------- desempeño del implementador */
    const closedBy = (at) => sprints.filter((s) => s.status === 'cerrado' && s.end <= at);
    const velBy = (at) => F.velocity.rows.filter((r) => r.status === 'cerrado' && r.end <= at).map((r) => r.completed);
    /* elementos aceptados y rechazados en la revisión de cada iteración cerrada (rechazado: llegó a «terminado» dentro de la
       iteración y volvió al backlog, como HU-033) */
    const reviewStats = (at) => {
      let acc = 0, rej = 0; const rejCodes = [];
      for (const s of closedBy(at)) {
        acc += items.filter((it) => PM.agile.countable(it) && it.sprintId === s.id && it.doneDate && it.doneDate <= s.end).length;
        for (const u of s.unfinished || []) {
          const it = items.find((x) => x.id === u.id);
          if (it && (it.history || []).some((h) => PM.agile.category(st, h.status) === 'terminado' && h.date >= s.start && h.date <= s.end)) { rej++; rejCodes.push(it.code + ' (' + s.name.toLowerCase() + ')'); }
        }
      }
      return { acc, rej, pres: acc + rej, rejCodes };
    };
    const R1 = rel('rel-1');
    const acR1 = (at) => PM.agile.releaseActualCost(R1, costs, tree, at, schedule.tasks, agile.releases);
    const r1Prog = F.releases['rel-1'].prog;
    const r2Evm = F.releases['rel-2'].evm;
    const it6 = sprints.find((s) => s.id === 'spr-06');
    const hu033 = (it6 && (it6.unfinished || [])[0]) || null;

    /* ================================================================ 12.1 · ANÁLISIS DE HACER O COMPRAR */
    const H = SUP.hacer;
    const implTeamEq = implHours / (hoursDay(item('cf')) * st.sprintLength);
    const implHacerIter = Math.ceil(nSprints * H.curva);
    const implHacer = Math.round(implTeamEq * analyst * implHacerIter + H.reclutamiento);
    const implEst0 = nSprints * implHours * SUP.tarifaReferencia;
    const cambioHacer = H.cambioDias * item('sm').unitCost;
    const digitacionHacer = Math.round(H.digitacion * 2 * item('alm').unitCost * H.diasMes * H.meses);
    const redHacer = H.redMateriales + H.redDiasTI * item('jti').unitCost;
    const subTres = Math.round(subMonthly * H.meses);
    const hocFields = (stage) => {
      const implCompra = stage >= 1 ? implValue : implEst0;
      return {
        analisis: rows('hoc', [
          { item: 'Plataforma del ERP (software e infraestructura)', opcionHacer: 'ERP instalado en servidores propios: licencias perpetuas de ' + n0(subUsers) + ' usuarios, servidores con respaldo, soporte anual del fabricante y administración por TI durante tres años.', costoHacer: H.plataforma,
            opcionComprar: 'ERP de mercado medio en la nube por suscripción: ' + n0(subFull) + ' usuarios completos y ' + n0(subLim) + ' limitados a precios de lista (' + money(subMonthly) + ' al mes) durante 36 meses; ' + n0(subMonths) + ' meses dentro del proyecto (' + ms(subValue) + ').', costoComprar: subTres,
            factores: 'Sin servidores propios, como espera el jefe de TI; actualizaciones y respaldo incluidos. El desarrollo a la medida se descartó en el caso de negocio (alternativa de desarrollo propio).', decision: 'Comprar' },
          { item: 'Implementación (parametrización, desarrollos e integraciones de los tres releases)', opcionHacer: 'Equipo propio de ' + n0(implHours) + ' horas por iteración (' + n1(implTeamEq) + ' personas equivalentes al costo del analista de TI): ' + implHacerIter + ' iteraciones por la curva de aprendizaje del ERP, más selección y formación certificada (' + ms(H.reclutamiento) + ').', costoHacer: implHacer,
            opcionComprar: stage >= 1
              ? 'Socio implementador por iteraciones de precio fijo (contrato ' + SUP.num.impl + '): ' + nSprints + ' iteraciones de ' + n0(implHours) + ' horas a ' + ms(implFee) + ' y bolsas con tope de ' + ms(bolsa2) + ' (conector) y ' + ms(bolsa3) + ' (tablero gerencial), con el analista de TI de la empresa en el equipo.'
              : 'Socio implementador por iteraciones de precio fijo: ' + nSprints + ' iteraciones de ' + n0(implHours) + ' horas a la tarifa de referencia de la estimación independiente (' + money(SUP.tarifaReferencia) + ' por hora), con el analista de TI de la empresa en el equipo.',
            costoComprar: implCompra,
            factores: 'Un equipo propio tardaría ' + nw(implHacerIter - nSprints) + ' iteraciones más (el último release pasaría a 2027) y quedaría sin carga al terminar. El analista de TI en todas las historias conserva el conocimiento de la parametrización.', decision: 'Mixto' },
          { item: 'Facturación electrónica DIAN', opcionHacer: 'Solución propia habilitada ante la DIAN: firma, generación del XML, envío, validación y actualización con cada cambio del anexo técnico durante tres años.', costoHacer: H.facturacion,
            opcionComprar: 'Proveedor tecnológico autorizado por la DIAN: habilitación y paquete anual de ' + n0(feDocs) + ' documentos (' + ms(feValue) + ' al año) durante tres años; el conector con el ERP va en la implementación.', costoComprar: 3 * feValue,
            factores: 'Riesgo regulatorio transferido al proveedor; la empresa no tiene desarrolladores para mantener el anexo técnico.', decision: 'Comprar' },
          { item: 'Depuración y migración de datos (maestros, inventario, cartera y hojas de vida)', opcionHacer: 'Usuarios clave, personal de bodega y contabilidad con las plantillas y validaciones del implementador (entregable ' + wcode('w4') + ').', costoHacer: w4Cost,
            opcionComprar: 'Firma especializada en migración de datos, con su personal para el conteo físico y la conciliación.', costoComprar: H.migracionFirma,
            factores: 'Los datos los conocen las áreas: la firma necesitaría a los mismos usuarios clave para validar y la conciliación la aprueban contabilidad y revisoría fiscal.', decision: 'Hacer' },
          { item: 'Plan de gestión del cambio y red de usuarios clave', opcionHacer: 'Un profesional de la PMO durante ' + H.cambioDias + ' días hábiles, sin experiencia en adopción de ERP.', costoHacer: cambioHacer,
            opcionComprar: 'Consultor de gestión del cambio durante ' + n0(cgcDays) + ' días hábiles: diagnóstico, plan y red de usuarios clave; la PMO lo ejecuta después.', costoComprar: cgcValue,
            factores: 'El consultor trae la metodología y la red de usuarios clave queda en la empresa.', decision: 'Mixto' },
          { item: 'Equipos de bodega (tabletas, lectores e impresoras de etiquetas)', opcionHacer: 'Sin equipos de campo: actas en papel digitadas en la oficina de cada bodega por un auxiliar a media jornada durante tres años.', costoHacer: digitacionHacer,
            opcionComprar: 'Comprar ' + n0(eqQty.tab) + ' tabletas robustas, ' + n0(eqQty.lec) + ' lectores de código de barras y ' + n0(eqQty.imp) + ' impresoras de etiquetas a precios de referencia en dólares (tasa de planificación de ' + money(SUP.trm) + ').', costoComprar: eqPlanned,
            factores: 'Las actas firmadas en obra y el trabajo sin conexión son requisitos del release 1. El alquiler operativo a 36 meses costaba más que la compra y no cubría los daños en patio.', decision: 'Comprar' },
          { item: 'Red inalámbrica de las bodegas', opcionHacer: 'El jefe de TI la diseña e instala con puntos de acceso comprados por la empresa (' + H.redDiasTI + ' jornadas).', costoHacer: redHacer,
            opcionComprar: 'Integrador de redes llave en mano, con estudio de sitio y cobertura garantizada en patios y estanterías.', costoComprar: redPlanned,
            factores: 'El jefe de TI no tiene disponibilidad en julio y la instalación en altura exige personal certificado.', decision: 'Comprar' },
        ]),
        criterios: 'Tiempo hasta facturar con la DIAN, costo total a tres años, riesgo técnico y dependencia de personas clave. Las decisiones se revisan al planificar cada release, cuando la necesidad se conoce mejor.',
        conclusion: 'Se compra la plataforma en la nube y el servicio de facturación electrónica; la implementación se contrata con un socio que trabaja por iteraciones, con el analista de TI de la empresa en el equipo; se compran los equipos de bodega, la red se contrata llave en mano y el plan de gestión del cambio, con un consultor externo. La depuración y la migración de datos se hacen con los usuarios clave y el personal de bodega.' +
          (stage >= 1 ? ' Con los contratos firmados el ' + dl(T.sign) + ', la implementación quedó en ' + ms(implValue) + ': ' + ms(implValue - implEst0) + ' más que la estimación del ' + dl(T.disc) + ' por las bolsas del conector y del tablero, aunque la tarifa negociada (' + money(rate) + ' por hora) quedó ' + pc((SUP.tarifaReferencia - rate) / SUP.tarifaReferencia, 1) + ' por debajo de la de referencia.' : ''),
      };
    };

    /* ================================================================ 12.1 · ESTRATEGIA DE LAS ADQUISICIONES */
    const estrategiaFields = {
      enfoque: 'Comprar la plataforma como servicio y contratar la implementación por capacidad, para que el backlog pueda cambiar sin otrosí: el contrato fija el equipo por iteración, los eventos de Scrum, la definición de terminado y la prueba de aceptación de cada release, no una lista cerrada de funciones. Lo incierto (conector con el proveedor tecnológico y tablero gerencial) se contrata con bolsas de horas con tope. Los bienes y servicios estándar (equipos, red y facturación electrónica) se compran a precio fijo con especificaciones cerradas.',
      estrategias: rows('ea', [
        { adquisicion: 'Suscripción del ERP en la nube', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Precio fijo por usuario-mes. Se evalúa junto con el implementador (propuesta conjunta) porque la funcionalidad depende de los dos.' },
        { adquisicion: 'Implementación por iteraciones de ' + n0(implHours) + ' horas', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Precio fijo por iteración (capacidad del equipo), pagado al cierre contra el acta de revisión. Reordenar o cambiar el backlog no modifica el contrato; un cambio de fecha o de presupuesto de un release pasa por el control de cambios.' },
        { adquisicion: 'Bolsas de horas del implementador (conector y tablero gerencial)', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Tiempo y materiales (T&M)', metodoSeleccion: 'Fuente única', justificacion: 'El esfuerzo no se conoce hasta investigar la API del proveedor tecnológico y definir los indicadores; tarifa del contrato con tope por bolsa.' },
        { adquisicion: 'Servicios del implementador por horas (ambientes, formación, capacitación, apoyo a la migración, salidas y estabilización)', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Tiempo y materiales (T&M)', metodoSeleccion: 'Fuente única', justificacion: 'Órdenes de servicio a la tarifa del contrato, cada una dentro del presupuesto de su actividad y del límite de gasto del director.' },
        { adquisicion: 'Proveedor tecnológico de facturación electrónica', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'Paquete anual de documentos a precio fijo; debe tener conector probado con el ERP elegido y habilitar antes del release 2.' },
        { adquisicion: 'Equipos de bodega importados', metodoEntrega: 'Suministro directo (orden de compra)', tipoContrato: 'Precio fijo con ajuste económico de precio (FP-EPA)', metodoSeleccion: 'Menor costo', justificacion: 'Especificación cerrada y tres cotizaciones; precio en dólares con ajuste a la tasa de cambio de la factura.' },
        { adquisicion: 'Red inalámbrica de las bodegas', metodoEntrega: 'Llave en mano', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Basado en calidad y costo', justificacion: 'El integrador responde por la cobertura con su estudio de sitio; dos cotizaciones.' },
        { adquisicion: 'Consultor de selección del ERP', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Tiempo y materiales (T&M)', metodoSeleccion: 'Calificaciones únicamente', justificacion: 'Independiente de los fabricantes; tarifa por jornada con tope de jornadas.' },
        { adquisicion: 'Asesoría jurídica y consultoría de gestión del cambio', metodoEntrega: 'Servicio sin subcontratación', tipoContrato: 'Precio fijo cerrado (FFP)', metodoSeleccion: 'Calificaciones únicamente', justificacion: 'Alcances cortos y definidos (revisión de los contratos; plan de gestión del cambio y red de usuarios clave).' },
      ]),
      fases: rows('fa', [
        { fase: 'Selección (mayo y junio de 2026)', descripcion: 'Solicitud de propuestas a cinco fabricantes e implementadores, demostraciones guiadas con los mismos guiones de negocio y evaluación ponderada.', criteriosDesempeno: 'Mismos guiones y datos para todos los oferentes; criterios y pesos publicados con la solicitud.', criteriosSalida: 'Matriz de evaluación firmada por el comité de selección y recomendación aprobada por la Gerencia General.' },
        { fase: 'Contratación (junio de 2026)', descripcion: 'Negociación de la suscripción y del contrato de implementación por iteraciones, revisión jurídica y pólizas.', criteriosDesempeno: 'Contratos dentro del presupuesto preliminar del acta de constitución.', criteriosSalida: 'Contratos firmados por la Gerencia General antes de la línea base y pólizas aprobadas.' },
        { fase: 'Preparación (julio de 2026)', descripcion: 'Ambientes, usuarios y perfiles; equipos de bodega y red; formación de usuarios clave; plan de gestión del cambio.', criteriosDesempeno: 'Entregas en la fecha del cronograma.', criteriosSalida: 'Ambientes disponibles antes de la iteración 1 y equipos de bodega instalados antes de la iteración 2.' },
        { fase: 'Releases (julio a diciembre de 2026)', descripcion: 'Iteraciones del implementador por capacidad; proveedor tecnológico habilitado antes del release 2; salidas a producción fuera del cierre mensual.', criteriosDesempeno: 'Velocidad frente a la del plan de releases, elementos aceptados en cada revisión y defectos en producción.', criteriosSalida: 'Cada release aceptado por el dueño del producto con la prueba de aceptación firmada por los usuarios clave.' },
        { fase: 'Estabilización y cierre (enero de 2027)', descripcion: 'Estabilización con el implementador, transferencia al soporte de TI y liquidación de los contratos.', criteriosDesempeno: 'Cero incidentes críticos abiertos al final de la estabilización.', criteriosSalida: 'Acta de transferencia firmada por el jefe de TI y actas de liquidación sin reclamaciones abiertas.' },
      ]),
      seguimiento: 'El supervisor de cada contrato registra el avance, los pagos y la calificación en el seguimiento de contratos; el desempeño del implementador se mide en cada revisión de iteración con los incrementos aceptados. Transferencia de conocimiento: cada historia documenta su parametrización y el analista de TI participa en todas, para que el soporte pase a TI al terminar la estabilización.',
    };

    /* ================================================================ 12.1 · PLAN DE GESTIÓN DE LAS ADQUISICIONES */
    const cronograma = rows('cr', [
      { adquisicion: 'Consultor de selección del ERP (independiente)', solicitudOfertas: T.selSol, adjudicacion: T.selAdj, inicio: T.selAdj, fin: T.selFin, responsable: ROLE.dir },
      { adquisicion: 'Suscripción del ERP en la nube (propuesta conjunta con el implementador)', solicitudOfertas: T.rfp, adjudicacion: T.adj, inicio: T.subIni, fin: T.subFin, responsable: ROLE.ti },
      { adquisicion: 'Implementación del ERP por iteraciones', solicitudOfertas: T.rfp, adjudicacion: T.adj, inicio: T.implIni, fin: T.implFin, responsable: ROLE.dir },
      { adquisicion: 'Asesoría jurídica de los contratos', solicitudOfertas: T.jurSol, adjudicacion: T.jurAdj, inicio: T.jurIni, fin: T.jurFin, responsable: ROLE.dir },
      { adquisicion: 'Consultoría de gestión del cambio', solicitudOfertas: T.cgcSol, adjudicacion: T.cgcAdj, inicio: T.cgcIni, fin: T.cgcFin, responsable: ROLE.dir },
      { adquisicion: 'Equipos de bodega (tabletas, lectores e impresoras)', solicitudOfertas: T.eqSol, adjudicacion: T.eqAdj, inicio: T.eqIni, fin: T.eqFin, responsable: ROLE.ti },
      { adquisicion: 'Red inalámbrica de las bodegas', solicitudOfertas: T.eqSol, adjudicacion: T.eqAdj, inicio: T.eqIni, fin: T.eqFin, responsable: ROLE.ti },
      { adquisicion: 'Proveedor tecnológico de facturación electrónica', solicitudOfertas: T.feSol, adjudicacion: T.feAdj, inicio: T.feIni, fin: T.feFin, responsable: ROLE.ti },
    ]);
    const planFields = (stage) => ({
      coordinacion: (stage >= 1
        ? 'Los contratos de suscripción e implementación se firmaron el ' + dl(T.sign) + ', antes de la línea base del ' + dl(T.lb0) + ': la suscripción arranca el ' + dl(T.subIni) + ' y la iteración 1, el ' + dl(rel('rel-1').start) + '. Los equipos de bodega y la red llegan antes de la iteración 2 (' + dl(T.it2) + ') y el proveedor tecnológico habilita la facturación antes del release 2 (' + dl(T.r2Start) + '). '
        : 'Los contratos de suscripción e implementación se firman antes de la línea base, para que la suscripción arranque en julio junto con la iteración 1; los equipos de bodega y la red llegan antes de la iteración 2 y el proveedor tecnológico habilita la facturación antes del release 2, en septiembre. ') +
        'El contrato de implementación se pacta por capacidad: el implementador participa en todos los eventos de Scrum, el dueño del producto ordena el backlog y la definición de terminado y la prueba de aceptación de cada release son condiciones de entrega. Cambiar el orden o el contenido del backlog no modifica el contrato; un cambio de fecha o de presupuesto de un release pasa por el control de cambios y, si cambia el valor del contrato, por un otrosí. El avance de los proveedores se informa en el comité quincenal.',
      cronogramaAdquisiciones: cp(cronograma),
      rolesAdquisiciones: rows('ro', [
        { rol: ROLE.pat, responsabilidad: 'Firma los contratos de suscripción e implementación, aprueba la adjudicación que recomienda el comité de selección y los otrosíes que superan el límite del director.', limite: limite ? 'Más de ' + ms(limite) : 'Sin límite' },
        { rol: ROLE.dir, responsabilidad: 'Define las necesidades, aprueba los enunciados del trabajo, administra los contratos, emite las órdenes de servicio por horas y aprueba los pagos con sus soportes.', limite: 'Hasta ' + limTxt + ' por compra u orden (límite de gasto del acta de constitución)' },
        { rol: ROLE.comite, responsabilidad: 'Dueño del producto, director de proyecto, jefe de TI y contador: evalúa las ofertas con los criterios ponderados. El consultor de selección es secretario técnico, sin voto.', limite: 'Recomienda; no aprueba' },
        { rol: 'Dueño del producto', responsabilidad: 'Acepta o rechaza los incrementos en la revisión de cada iteración: el acta de revisión firmada es el soporte del pago de la iteración.', limite: 'Aceptación de los incrementos' },
        { rol: ROLE.ti, responsabilidad: 'Supervisa la suscripción, el proveedor tecnológico, los equipos y la red; recibe a satisfacción y verifica los acuerdos de nivel de servicio.', limite: 'Recibo a satisfacción' },
        { rol: ROLE.jur, responsabilidad: 'Revisa los contratos, los otrosíes y las pólizas antes de la firma.', limite: 'Sin facultad de aprobación' },
        { rol: 'Contabilidad', responsabilidad: 'Verifica facturas, retenciones e IVA y programa los pagos a ' + SUP.pagoDias + ' días.', limite: 'Sin facultad de aprobación' },
      ]),
      metricasProveedor: rows('me', [
        { metrica: 'Implementador: elementos aceptados en la revisión frente a los presentados', meta: '≥ 90 %', frecuencia: 'Quincenal' },
        stage >= 1
          ? { metrica: 'Implementador: velocidad de la iteración frente a la velocidad supuesta del plan de releases (' + vSup + ' puntos)', meta: '≥ ' + vMeta + ' puntos', frecuencia: 'Quincenal' }
          : { metrica: 'Implementador: velocidad de la iteración frente a la velocidad supuesta que fije el plan de releases', meta: '≥ 90 %', frecuencia: 'Quincenal' },
        { metrica: 'Implementador: reemplazo de un integrante del equipo con un perfil equivalente', meta: '≤ 5 días hábiles', frecuencia: 'Por evento' },
        { metrica: 'Fabricante: disponibilidad mensual del ERP en producción', meta: '≥ 99,5 %', frecuencia: 'Mensual' },
        { metrica: 'Proveedor tecnológico: disponibilidad del servicio con aviso previo de mantenimientos y caídas', meta: '≥ 99 %', frecuencia: 'Mensual' },
        { metrica: 'Proveedor tecnológico: documentos rechazados por causas del proveedor', meta: '< 1 %', frecuencia: 'Mensual' },
        { metrica: 'Distribuidor e integrador: equipos y red instalados antes de la iteración 2', meta: '100 %', frecuencia: 'Por hito' },
        { metrica: 'Facturas de los proveedores sin errores', meta: '≥ 98 %', frecuencia: 'Mensual' },
      ]),
      jurisdiccion: 'Leyes de la República de Colombia; controversias por arreglo directo y, si no hay acuerdo en 30 días, conciliación en el centro de arbitraje y conciliación de la Cámara de Comercio de Bogotá.',
      moneda: 'Pesos colombianos (COP), precios antes de IVA, pago a ' + SUP.pagoDias + ' días contra factura electrónica. Implementador: cada iteración al cierre, contra el acta de revisión firmada por el dueño del producto, con retención en garantía del ' + pc(SUP.retencion) + ' hasta la aceptación del release; bolsas y horas por consumo mensual con el reporte aprobado. Suscripción: mes vencido. Equipos importados: cotizados en dólares con ajuste a la tasa de cambio de la factura (tasa de planificación de ' + money(SUP.trm) + ' por dólar).',
      garantias: 'Contratos de más de ' + limTxt + ' y trabajos en sitio: póliza de cumplimiento del 10 % (vigencia del contrato y 4 meses más). Implementador, además: calidad del servicio (10 %, vigencia y un año más), pago de salarios y prestaciones sociales (5 %, vigencia y tres años más) y retención del ' + pc(SUP.retencion) + ' de cada iteración hasta aceptar su release. Equipos: póliza de calidad del 10 % por un año, además de la garantía del fabricante. Red: calidad y responsabilidad civil extracontractual por el trabajo en alturas. Servicios en la nube (suscripción y proveedor tecnológico): acuerdo de nivel de servicio con créditos por indisponibilidad, sin pólizas.',
      estimacionesIndependientes: 'El consultor de selección estima el costo total a tres años de cada propuesta con los precios de lista de la suscripción y una tarifa de referencia de ' + money(SUP.tarifaReferencia) + ' por hora para las ' + n0(implHours) + ' horas de cada iteración (' + ms(implEst0) + ' por ' + nSprints + ' iteraciones). El jefe de TI estima los equipos de bodega con precios de referencia en dólares a la tasa de planificación (' + ms(eqPlanned) + ').' +
        (stage >= 1 ? ' La tarifa negociada (' + money(rate) + ' por hora) quedó ' + pc((SUP.tarifaReferencia - rate) / SUP.tarifaReferencia, 1) + ' por debajo de la referencia.' : ''),
      supuestosRestricciones: 'Supuestos: hay al menos tres oferentes con implementador local y experiencia en alquiler o distribución; el proveedor tecnológico se elige compatible con el ERP seleccionado; tasa de planificación de ' + money(SUP.trm) + ' por dólar. Restricciones: contratos firmados antes de la línea base; la factura electrónica exige un proveedor tecnológico autorizado por la DIAN; ninguna salida a producción durante el cierre mensual; contratos de servicios en pesos colombianos.',
      proveedoresPrecalificados: stage >= 1
        ? [
          'Oferente B — ' + supplier('suc') + ' y ' + lc(supplier('cf')) + ' (propuesta conjunta): contratos ' + SUP.num.sub + ' y ' + SUP.num.impl + ' del ' + dl(T.sign) + '.',
          'Oferentes A y C: alternativas si el contrato de implementación se termina de forma anticipada.',
          supplier('tab') + ': orden de compra ' + SUP.num.eq + ' (menor costo entre tres cotizaciones).',
          supplier('red') + ': orden de servicio ' + SUP.num.red + ' llave en mano.',
          'Tres proveedores tecnológicos de facturación electrónica autorizados por la DIAN con conector para el ERP elegido (solicitud en ' + monthName(T.feSol).replace(/ de 20\d\d$/, '') + ').',
          supplier('jur') + ' y ' + lc(supplier('cgc')) + ': órdenes de servicio ' + SUP.num.jur + ' y ' + SUP.num.cgc + '.',
        ]
        : [
          'Cinco fabricantes de ERP de mercado medio en la nube con socio implementador local (lista corta del consultor de selección).',
          'Tres proveedores tecnológicos de facturación electrónica autorizados por la DIAN.',
          'Tres distribuidores de equipos de cómputo robustos para bodega.',
          'Dos integradores de redes inalámbricas industriales.',
          'Firma de abogados con experiencia en contratos de tecnología.',
          'Dos consultores de gestión del cambio con experiencia en implementaciones de ERP.',
        ],
    });

    /* ================================================================ 12.1 · CRITERIOS DE SELECCIÓN Y EVALUACIÓN */
    const tcoB = subTres + fixedPart;
    const tco = { A: tcoB * SUP.ofertas.A, B: tcoB, C: tcoB * SUP.ofertas.C };
    const tcoMin = Math.min(tco.A, tco.B, tco.C);
    const scoreOf = (c, k) => (c.costo ? Math.round((100 * tcoMin) / tco[k]) : c[k]);
    const totals = Object.fromEntries(['A', 'B', 'C'].map((k) => [k, round2(sum(SUP.criterios, (c) => (c.peso * scoreOf(c, k)) / 100))]));
    const winner = ['A', 'B', 'C'].sort((a, b) => totals[b] - totals[a])[0];
    const habilitantes = [
      'Facturación electrónica DIAN mediante un proveedor tecnológico autorizado, con conector probado.',
      'Operación en la nube con ambientes de pruebas y producción y respaldo diario.',
      'Experiencia del implementador en empresas de alquiler o distribución, con dos referencias verificables.',
      'Equipo propuesto disponible desde julio de 2026, con certificación del fabricante en el ERP.',
      'Aceptación del contrato por iteraciones de precio fijo, con la definición de terminado como condición de entrega.',
      'Capacidad para expedir las pólizas de cumplimiento, calidad y salarios.',
    ];
    const critFields = (stage) => ({
      adquisicion: 'ERP en la nube con su socio implementador (propuesta conjunta de suscripción e implementación)',
      metodoSeleccion: 'Basado en calidad y costo',
      requisitosHabilitantes: cp(habilitantes),
      proveedorA: stage >= 1 ? 'Oferente A: ERP de mercado medio con implementador nacional (entregas por fases)' : 'Por definir: finalista 1 de los cinco invitados',
      proveedorB: stage >= 1 ? 'Oferente B: ERP de mercado medio en la nube con socio implementador local' : 'Por definir: finalista 2 de los cinco invitados',
      proveedorC: stage >= 1 ? 'Oferente C: ERP de gama de entrada con implementador regional' : 'Por definir: finalista 3 de los cinco invitados',
      criterios: rows('cs', SUP.criterios.map((c) => ({ criterio: c.criterio, descripcion: c.descripcion, peso: c.peso, puntajeA: stage >= 1 ? scoreOf(c, 'A') : null, puntajeB: stage >= 1 ? scoreOf(c, 'B') : null, puntajeC: stage >= 1 ? scoreOf(c, 'C') : null }))),
      resultado: stage >= 1
        ? 'Los tres finalistas de los cinco invitados cumplieron los requisitos habilitantes; los otros dos no tenían experiencia en alquiler o un conector con un proveedor tecnológico autorizado. Puntaje total: oferente A ' + n1(totals.A) + ', oferente B ' + n1(totals.B) + ' y oferente C ' + n1(totals.C) + '. Costo total a tres años: B ' + ms(tco.B) + ', A ' + ms(tco.A) + ' y C ' + ms(tco.C) + '. Las demostraciones con los mismos guiones mostraron diferencias que las presentaciones comerciales ocultaban: el oferente C no liquidó el alquiler por días calendario desde las actas sin hojas de cálculo auxiliares y el oferente A propuso entregas por fases de tres meses, sin iteraciones. Se recomienda adjudicar al oferente ' + winner + ' y negociar el contrato de implementación por iteraciones de precio fijo de ' + n0(implHours) + ' horas, con bolsas de horas con tope para las integraciones y la definición de terminado como condición de entrega.'
        : 'Evaluación pendiente: demostraciones guiadas del ' + dlShort(T.demoIni) + ' al ' + dl(T.eval) + ', con los mismos guiones de negocio para los finalistas. Los criterios y los pesos se publican con la solicitud de propuestas y no cambian después de abrir las ofertas.',
      seleccionado: stage >= 1 ? 'Oferente ' + winner + ': ' + lc(supplier('suc')) + ' y ' + lc(supplier('cf')) + ' (propuesta conjunta)' : 'Por definir',
    });

    /* ================================================================ 12.1 · ENUNCIADOS DEL TRABAJO (SOW) */
    const relFin = (id) => rel(id).end;
    const sowImpl = (stage) => ({
      adquisicion: 'Implementación del ERP en la nube por iteraciones de precio fijo: equipo de desarrollo del socio implementador para los tres releases, bolsas de horas y servicios por horas',
      paqueteEdt: wcode('w31') + ' (ambientes), ' + wcode('w4') + ' (migración), ' + wcode('w52') + ' y ' + wcode('w53') + ' (formación y capacitación), ' + wcode('w6') + ' a ' + wcode('w8') + ' (releases) y ' + wcode('w9') + ' (salidas en vivo y estabilización)',
      tipoContrato: 'Precio fijo cerrado (FFP)',
      antecedentes: 'El descubrimiento de mayo de 2026 definió los requisitos de alto nivel de inventario y alquiler, facturación electrónica y cartera, y mantenimiento y tablero gerencial. El análisis de hacer o comprar decidió contratar la implementación con un socio que trabaje por iteraciones, con el analista de TI de la empresa en el equipo.' +
        (stage >= 1 ? ' Anexo técnico del contrato ' + SUP.num.impl + ', firmado el ' + dl(T.sign) + ' con el socio implementador del oferente ' + winner + ', seleccionado por el comité el ' + dl(T.eval) + ' con ' + n1(totals[winner]) + ' puntos de 100.' : ' Este enunciado acompaña la solicitud de propuestas del ' + dl(T.rfp) + ' y se evalúa con los criterios de selección publicados.'),
      descripcionTrabajo: 'El implementador aporta un equipo de ' + n0(implHours) + ' horas por iteración de ' + st.sprintLength + ' días hábiles: consultor funcional ERP y desarrollador ERP con dedicación completa, y desarrollador de integraciones y analista de pruebas al 50 %, que trabaja con el analista de TI de la empresa como un solo equipo Scrum durante ' + nSprints + ' iteraciones en tres releases. El equipo participa en la planificación, la reunión diaria, la revisión y la retrospectiva de cada iteración; el dueño del producto ordena el backlog y puede cambiar su contenido sin modificar el contrato mientras no cambien la fecha ni el presupuesto del release. ' +
        (stage >= 1 ? 'Incluye bolsas de horas con tope para el conector con el proveedor tecnológico (' + ms(bolsa2) + ') y el modelo de datos del tablero gerencial (' + ms(bolsa3) + ')' : 'Incluye bolsas de horas con tope, que se fijan en la negociación, para el conector con el proveedor tecnológico y el modelo de datos del tablero gerencial') +
        ', y servicios por horas a la tarifa del contrato: ambientes y perfiles, formación de usuarios clave, capacitación de usuarios finales por release, apoyo a la migración de datos, tres salidas a producción y la estabilización.',
      entregables: rows('en', [
        ...['rel-1', 'rel-2', 'rel-3'].map((id) => ({ entregable: 'Iteraciones del ' + rel(id).name.replace(/^Release (\d):/, 'release $1:'), especificacion: 'Incrementos que cumplen la definición de terminado y se aceptan en la revisión de cada iteración; prueba de aceptación del release firmada por los usuarios clave.', cantidad: rel(id).plannedSprints, unidad: 'iteración', fecha: relFin(id) })),
        { entregable: 'Bolsa de horas: conector con el proveedor tecnológico', especificacion: stage >= 1 ? 'Tope de ' + ms(bolsa2) + ' a ' + money(rate) + ' por hora; consumo aprobado por el dueño del producto en cada planificación.' : 'Tope fijado en la negociación; consumo aprobado por el dueño del producto en cada planificación.', cantidad: 1, unidad: 'bolsa', fecha: relFin('rel-2') },
        { entregable: 'Bolsa de horas: modelo de datos del tablero gerencial', especificacion: stage >= 1 ? 'Tope de ' + ms(bolsa3) + ' a ' + money(rate) + ' por hora.' : 'Tope fijado en la negociación.', cantidad: 1, unidad: 'bolsa', fecha: relFin('rel-3') },
        { entregable: 'Formación de usuarios clave en el ERP estándar', especificacion: 'Usuarios clave de las cinco áreas, con evaluación aprobada antes de la iteración 2.', cantidad: hFormacion, unidad: 'horas', fecha: lbT('t21').finish },
        { entregable: 'Capacitación de usuarios finales por release', especificacion: n0(hCapacitacion) + ' horas por release, con guías rápidas por rol, antes de cada salida a producción.', cantidad: 3 * hCapacitacion, unidad: 'horas', fecha: lbT('t24').finish },
        { entregable: 'Salidas a producción (corte, carga de saldos y acompañamiento)', especificacion: 'Plan de corte con reversión probada; ninguna salida durante el cierre mensual.', cantidad: 3, unidad: 'salida', fecha: lbT('t32').start },
        { entregable: 'Estabilización (hypercare) y transferencia al soporte de TI', especificacion: 'Consultor funcional y desarrollador ERP durante ' + task('t34').duration + ' días hábiles; acta de transferencia firmada por el jefe de TI.', cantidad: hEstabilizacion, unidad: 'horas', fecha: lbT('t34').finish },
      ]),
      exclusiones: [
        'Nómina y gestión humana, costeo de los proyectos de montaje y portal de autoservicio para clientes (fuera de la visión del producto).',
        'Suscripción del ERP y servicio del proveedor tecnológico de facturación electrónica (contratos aparte).',
        'Equipos de bodega, red inalámbrica y conteo físico del inventario.',
        'Soporte posterior a la estabilización: se contrata con el presupuesto de operación de TI desde febrero de 2027.',
      ],
      especificaciones: 'Parametrización estándar del ERP antes que desarrollos: un desarrollo a la medida solo entra con una historia aceptada por el dueño del producto. Integración con el proveedor tecnológico de facturación electrónica conforme al anexo técnico vigente de la DIAN. Todo cambio pasa primero por el ambiente de pruebas. Cada historia documenta su parametrización para el soporte de TI.',
      calidad: 'Cada elemento se entrega cuando cumple la definición de terminado que acuerdan el equipo y el dueño del producto antes de la iteración 1: criterios de aceptación probados con el usuario clave, pruebas en el ambiente de pruebas y documentación. Cada release se acepta con la prueba de aceptación firmada por los usuarios clave. Una historia rechazada en la revisión vuelve al backlog y se rehace dentro de la capacidad de las iteraciones siguientes, sin costo adicional.',
      sst: 'Personal afiliado a seguridad social y ARL (planilla mensual). Inducción de seguridad y salud en el trabajo antes de entrar a las bodegas; en patios y bodegas, casco, botas y chaleco, y prohibido entrar a las zonas de cargue sin acompañante.',
      lugar: 'Sede administrativa (Bogotá D.C.), bodega principal (Bogotá) y bodega de Funza (Cundinamarca); trabajo remoto en los días acordados con el Scrum Master.',
      periodoInicio: T.implIni,
      periodoFin: T.implFin,
      horario: 'Lunes a viernes de 8:00 a. m. a 5:00 p. m., con la reunión diaria a las 8:15 a. m.; las salidas a producción se hacen fuera del horario de despachos, según el plan de corte.',
      formaPago: stage >= 1
        ? 'Cada iteración se paga a precio fijo (' + ms(implFee) + ') al cierre, contra el acta de revisión firmada por el dueño del producto, a ' + SUP.pagoDias + ' días de la factura electrónica, con retención en garantía del ' + pc(SUP.retencion) + ' que se devuelve al aceptar el release. Las bolsas y los servicios por horas se facturan por consumo mensual con el reporte aprobado por el director, a ' + money(rate) + ' por hora (líder del implementador: ' + money(rateLider) + ').'
        : 'Precio fijo por iteración que cotiza el oferente para las ' + n0(implHours) + ' horas; pago al cierre de cada iteración contra el acta de revisión firmada por el dueño del producto, a ' + SUP.pagoDias + ' días de la factura electrónica, con retención en garantía del ' + pc(SUP.retencion) + ' hasta la aceptación del release. Bolsas y servicios por horas a la tarifa ofertada, por consumo mensual aprobado.',
      polizas: [
        'Cumplimiento: 10 % del valor del contrato, vigencia del contrato y 4 meses más.',
        'Calidad del servicio: 10 % del valor del contrato, vigencia del contrato y un año más.',
        'Pago de salarios, prestaciones sociales e indemnizaciones: 5 % del valor del contrato, vigencia del contrato y tres años más.',
      ],
      supervision: ROLE.dir + '; el dueño del producto acepta los incrementos',
      documentosRequeridos: [
        'RUT y certificado de existencia y representación legal con vigencia no mayor a 30 días.',
        'Hojas de vida del equipo propuesto con la certificación del fabricante en el ERP.',
        'Planilla de seguridad social del personal asignado.',
        'Plan de trabajo por release y propuesta de definición de terminado.',
        'Acuerdo de confidencialidad y de tratamiento de datos personales (Ley 1581 de 2012).',
        'Pólizas aprobadas antes del acta de inicio.',
      ],
    });
    const sowSub = (stage) => ({
      adquisicion: 'Suscripción del ERP de mercado medio en la nube: ' + n0(subUsers) + ' usuarios (' + n0(subFull) + ' completos y ' + n0(subLim) + ' limitados), ambientes y respaldo',
      paqueteEdt: wcode('w31') + ' ' + wname('w31'),
      tipoContrato: 'Precio fijo cerrado (FFP)',
      antecedentes: 'La empresa no tendrá servidores propios para el ERP (análisis de hacer o comprar). La suscripción se ofrece junto con la implementación (propuesta conjunta) y se evalúa con el costo total a tres años.' + (stage >= 1 ? ' Anexo del contrato ' + SUP.num.sub + ', firmado el ' + dl(T.sign) + ' con el ' + lc(supplier('suc')) + ' del oferente ' + winner + '.' : ''),
      descripcionTrabajo: 'El fabricante provee el ERP como servicio: ' + n0(subFull) + ' usuarios completos (comercial, logística, almacén, facturación, cartera, contabilidad, mantenimiento y gerencia) y ' + n0(subLim) + ' limitados (consultas, aprobaciones y registro en tableta), ambientes de pruebas y producción, actualizaciones, respaldo diario y mesa de ayuda de segundo nivel para el implementador y TI. Desde febrero de 2027 la suscripción pasa al presupuesto de operación de TI.',
      entregables: rows('en', [
        { entregable: 'Usuarios completos', especificacion: 'Acceso a todos los módulos según el perfil.', cantidad: subFull, unidad: 'usuario', fecha: lbT('t13').finish },
        { entregable: 'Usuarios limitados', especificacion: 'Consultas, aprobaciones y registro desde la tableta.', cantidad: subLim, unidad: 'usuario', fecha: lbT('t13').finish },
        { entregable: 'Ambientes de pruebas y producción', especificacion: 'Con copia de producción a pruebas a solicitud del jefe de TI.', cantidad: 2, unidad: 'ambiente', fecha: lbT('t13').finish },
        { entregable: 'Informe mensual de disponibilidad y respaldos', especificacion: 'Disponibilidad del mes, incidentes y prueba de restauración.', cantidad: subMonths, unidad: 'informe', fecha: T.subFin },
      ]),
      exclusiones: [
        'Parametrización, desarrollos e integraciones (contrato de implementación).',
        'Usuarios adicionales: se cotizan a los precios de lista vigentes.',
        'Soporte de primer nivel a los usuarios finales: lo presta TI con el implementador.',
      ],
      especificaciones: 'ERP de mercado medio en la nube con inventario por bodega y por serial, contratos de alquiler, facturación electrónica mediante proveedor tecnológico, cartera, mantenimiento y reportes; acceso por navegador y aplicación para tabletas con trabajo sin conexión; perfiles por rol y registro de auditoría.',
      calidad: 'Disponibilidad mensual de 99,5 % o más en producción, con créditos de servicio si no se cumple; respaldo diario con retención de 30 días y prueba de restauración trimestral; aviso de mantenimientos con cinco días hábiles de anticipación.',
      sst: 'Sin trabajo en sitio. Seguridad de la información: datos cifrados, centro de datos con certificación de seguridad y cumplimiento de la Ley 1581 de 2012 de protección de datos personales.',
      lugar: 'Servicio en la nube del fabricante; acceso desde la sede administrativa, las dos bodegas y las obras.',
      periodoInicio: T.subIni,
      periodoFin: T.subFin,
      horario: 'Servicio 24 horas, 7 días; mesa de ayuda de lunes a viernes de 7:00 a. m. a 7:00 p. m.',
      formaPago: stage >= 1
        ? 'Mensual, mes vencido, a ' + SUP.pagoDias + ' días de la factura electrónica: ' + money(subMonthly) + ' al mes (' + n0(subFull) + ' usuarios completos a ' + money(item('suc').unitCost) + ' y ' + n0(subLim) + ' limitados a ' + money(item('sul').unitCost) + ').'
        : 'Mensual, mes vencido, a ' + SUP.pagoDias + ' días de la factura electrónica, a los precios por usuario de la propuesta.',
      polizas: ['No se exigen pólizas: el acuerdo de nivel de servicio prevé créditos por indisponibilidad.', 'Devolución de los datos en formato abierto al terminar la suscripción.'],
      supervision: ROLE.ti,
      documentosRequeridos: [
        'Certificado de existencia y representación legal del fabricante o de su distribuidor autorizado en Colombia.',
        'Certificación de seguridad del centro de datos.',
        'Acuerdo de nivel de servicio y política de tratamiento de datos personales.',
      ],
    });
    const sowFe = {
      adquisicion: 'Servicio de facturación electrónica con un proveedor tecnológico autorizado por la DIAN: habilitación, certificado de firma y paquete anual de documentos',
      paqueteEdt: wcode('w33') + ' ' + wname('w33'),
      tipoContrato: 'Precio fijo cerrado (FFP)',
      antecedentes: 'El análisis de hacer o comprar decidió comprar el servicio a un proveedor tecnológico autorizado. Debe ser compatible con el ERP contratado el ' + dl(T.sign) + ' (contrato ' + SUP.num.sub + ') y entregar las credenciales antes del release 2, que construye la factura electrónica desde el ' + dl(T.r2Start) + '.',
      descripcionTrabajo: 'El proveedor habilita a la empresa ante la DIAN como facturador electrónico con su servicio, entrega las credenciales del ambiente de habilitación y el certificado de firma digital, provee un paquete anual de ' + n0(feDocs) + ' documentos electrónicos (facturas, notas crédito y notas débito) y presta mesa de ayuda. El conector con el ERP lo construye el implementador con la API del proveedor.',
      entregables: rows('en', [
        { entregable: 'Credenciales del ambiente de habilitación', especificacion: 'Usuario técnico y acceso a la API de pruebas.', cantidad: 1, unidad: 'juego', fecha: T.feLimite },
        { entregable: 'Certificado de firma digital', especificacion: 'Instalado y con el procedimiento de renovación documentado.', cantidad: 1, unidad: 'certificado', fecha: T.feLimite },
        { entregable: 'Paquete anual de documentos electrónicos', especificacion: 'Facturas, notas crédito y notas débito validadas por la DIAN.', cantidad: feDocs, unidad: 'documento', fecha: T.feServicioFin },
        { entregable: 'Mesa de ayuda y aviso de caídas', especificacion: 'Aviso inmediato de toda caída o mantenimiento de los ambientes.', cantidad: 12, unidad: 'mes', fecha: T.feServicioFin },
      ]),
      exclusiones: [
        'Conector con el ERP (lo construye el implementador).',
        'Documentos por encima del paquete anual: se facturan a la tarifa por documento adicional.',
        'Nómina electrónica (fuera del alcance del proyecto).',
      ],
      especificaciones: 'Servicio conforme al anexo técnico vigente de la factura electrónica de venta de la DIAN; API documentada para envío, consulta de estado y descarga de la representación gráfica; ambiente de habilitación disponible para las pruebas del conector.',
      calidad: 'Disponibilidad mensual del servicio de 99 % o más; aviso inmediato al equipo de toda caída o mantenimiento de los ambientes de habilitación y producción; menos de 1 % de documentos rechazados por causas del proveedor; respuesta de la mesa de ayuda en cuatro horas hábiles.',
      sst: 'Sin trabajo en sitio. Tratamiento de los datos de los clientes conforme a la Ley 1581 de 2012 y custodia del certificado de firma.',
      lugar: 'Servicio en la nube del proveedor; pruebas con el equipo del proyecto en la sede administrativa.',
      periodoInicio: T.feIni,
      periodoFin: T.feServicioFin,
      horario: 'Servicio 24 horas, 7 días; mesa de ayuda de lunes a sábado de 7:00 a. m. a 7:00 p. m.',
      formaPago: 'Pago único del paquete anual (' + ms(feValue) + ') contra factura electrónica, a ' + SUP.pagoDias + ' días; documentos adicionales por consumo mensual.',
      polizas: ['No se exigen pólizas: el acuerdo de nivel de servicio prevé créditos por indisponibilidad.'],
      supervision: ROLE.ti + '; contacto técnico: desarrollador de integraciones',
      documentosRequeridos: [
        'Resolución de la DIAN que autoriza al proveedor tecnológico.',
        'Documentación de la API y del ambiente de habilitación.',
        'Acuerdo de nivel de servicio y política de tratamiento de datos personales.',
      ],
    };
    const sowEq = {
      adquisicion: 'Suministro de ' + n0(eqQty.tab) + ' tabletas robustas, ' + n0(eqQty.lec) + ' lectores de código de barras y ' + n0(eqQty.imp) + ' impresoras de etiquetas, e instalación de la red inalámbrica de las bodegas principal y de Funza',
      paqueteEdt: wcode('w32') + ' ' + wname('w32'),
      tipoContrato: 'Precio fijo con ajuste económico de precio (FP-EPA)',
      antecedentes: 'Las actas de entrega y devolución se firmarán en tableta en la obra y los equipos serializados se identifican con código de barras (release 1). El análisis de hacer o comprar decidió comprar los equipos y contratar la red llave en mano. Lote 1: equipos importados, cotizados en dólares y ajustados a la tasa de cambio de la factura; lote 2: red inalámbrica a precio fijo.',
      descripcionTrabajo: 'Lote 1 (distribuidor): suministro, configuración básica y entrega en la bodega principal de las tabletas con funda y lápiz, los lectores inalámbricos y las impresoras de etiquetas (una por bodega), con garantía de un año. Lote 2 (integrador de redes): estudio de sitio, suministro e instalación de los puntos de acceso, cableado y configuración para cubrir patios y estanterías de las dos bodegas, con pruebas de lectura y de sincronización con el ERP.',
      entregables: rows('en', [
        { entregable: 'Tabletas robustas con funda y lápiz', especificacion: 'Resistentes a caídas y polvo, batería para un turno completo.', cantidad: eqQty.tab, unidad: 'unidad', fecha: T.eqFin },
        { entregable: 'Lectores de código de barras inalámbricos', especificacion: 'Códigos 1D y 2D, compatibles con las tabletas.', cantidad: eqQty.lec, unidad: 'unidad', fecha: T.eqFin },
        { entregable: 'Impresoras de etiquetas', especificacion: 'Térmicas, con etiquetas para intemperie.', cantidad: eqQty.imp, unidad: 'unidad', fecha: T.eqFin },
        { entregable: 'Red inalámbrica con cobertura en patios y estanterías', especificacion: 'Estudio de sitio, puntos de acceso para exteriores y mapa de cobertura firmado por el jefe de TI.', cantidad: 2, unidad: 'bodega', fecha: T.eqFin },
      ]),
      exclusiones: [
        'Licencias del ERP en las tabletas (suscripción).',
        'Obras civiles y acometidas eléctricas de las bodegas (las hace la empresa).',
        'Mantenimiento después del año de garantía.',
      ],
      especificaciones: 'Tabletas robustas con certificación de resistencia a caídas y polvo; lectores inalámbricos 1D y 2D; impresoras térmicas de etiquetas. Red: puntos de acceso para exteriores en los patios, cobertura medida con la tableta en cada estantería y segmento de red separado para los equipos de bodega.',
      calidad: 'Equipos nuevos, con garantía del fabricante de un año y cambio de modelo sin costo dentro de los 30 días calendario siguientes a la entrega si la prueba de campo con el ERP no es satisfactoria. Red recibida con el mapa de cobertura firmado por el jefe de TI y la lectura de etiquetas verificada en las dos bodegas.',
      sst: 'El integrador instala puntos de acceso en altura (estanterías y postes del patio): certificado vigente de trabajo en alturas (Resolución 4272 de 2021), permiso de trabajo, EPP, seguridad social al día e inducción de seguridad de la bodega.',
      lugar: 'Bodega principal (Bogotá D.C.) y bodega de Funza (Cundinamarca).',
      periodoInicio: T.eqIni,
      periodoFin: T.eqFin,
      horario: 'Instalación de lunes a viernes de 7:00 a. m. a 4:00 p. m., sin interrumpir los despachos de la mañana.',
      formaPago: 'Lote 1: precio en dólares convertido a pesos con la tasa de cambio de la fecha de la factura; pago a ' + SUP.pagoDias + ' días contra entrega a satisfacción. Lote 2: precio fijo llave en mano, pago a ' + SUP.pagoDias + ' días contra el acta de recibo con el mapa de cobertura.',
      polizas: [
        'Lote 1: calidad y correcto funcionamiento de los equipos, 10 % del valor, un año.',
        'Lote 2: cumplimiento y calidad, 10 % del valor cada una, y responsabilidad civil extracontractual por el trabajo en alturas.',
      ],
      supervision: ROLE.ti,
      documentosRequeridos: [
        'RUT y certificado de existencia y representación legal.',
        'Fichas técnicas de los equipos y certificado de garantía del fabricante.',
        'Integrador: certificados de trabajo en alturas del personal, planilla de seguridad social y evaluación de estándares mínimos del SG-SST (Resolución 0312 de 2019).',
      ],
    };

    /* ================================================================ 12.2 · REGISTRO DE CONTRATOS Y ACUERDOS
       stage 0: 30 de junio (firmas); 1: contrato del proveedor tecnológico; 2: corte */
    const regDate = (stage) => (stage === 0 ? T.sign : stage === 1 ? REG1 : CUT);
    const subAt = (at) => actualsOf('sub', at);
    const implAt = (at) => actualsOf('impl', at);
    const hourlyAt = (at) => implAt(at).filter((a) => !isIter(a) && !isBolsa(a));
    const contrato = (stage) => {
      const at = regDate(stage);
      const list = [
        { numero: SUP.num.sel, proveedor: supplier('csel'), objeto: 'Descubrimiento de procesos, solicitud de propuestas, guiones de demostración y evaluación de ofertas del ERP.', paqueteEdt: wcode('w2'), tipoContrato: 'Tiempo y materiales (T&M)', valor: selValue, fechaInicio: T.selAdj, fechaFin: T.selFin, supervisor: ROLE.dir, polizaCumplimiento: 'Aprobada', polizaCalidad: 'No aplica', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Terminado' : 'Liquidado',
          observaciones: 'Tope de ' + n0(selDays) + ' jornadas a ' + money(selRate) + '. ' + (stage === 0 ? 'Facturado: ' + ms(total(actualsOf('sel', at))) + ' (' + docsOf(actualsOf('sel', at)) + '); en liquidación.' : 'Liquidado por ' + money(total(actualsOf('sel', at))) + ' (' + n1(total(actualsOf('sel', at)) / selRate) + ' jornadas) con las facturas ' + docsOf(actualsOf('sel', at)) + '; el saldo del tope se liberó.') },
        { numero: SUP.num.jur, proveedor: supplier('jur'), objeto: 'Revisión jurídica de los contratos de suscripción e implementación y de sus pólizas.', paqueteEdt: wcode('w23'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: jurValue, fechaInicio: T.jurIni, fechaFin: T.jurFin, supervisor: ROLE.dir, polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Terminado' : 'Liquidado',
          observaciones: n0(jurDays) + ' jornadas a precio fijo. ' + (stage === 0 ? 'Contratos revisados y firmados el ' + dl(T.sign) + '.' : 'Liquidado con la factura ' + docsOf(actualsOf('jur', at)) + '.') },
        { numero: SUP.num.sub, proveedor: supplier('suc'), objeto: 'Suscripción del ERP en la nube: ' + n0(subFull) + ' usuarios completos y ' + n0(subLim) + ' limitados, ambientes de pruebas y producción y respaldo diario.', paqueteEdt: wcode('w31'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: subValue, fechaInicio: T.subIni, fechaFin: T.subFin, supervisor: ROLE.ti, polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Firmado' : 'En ejecución',
          observaciones: money(subMonthly) + ' al mes, mes vencido, durante ' + n0(subMonths) + ' meses; acuerdo de nivel de servicio con créditos por indisponibilidad en lugar de pólizas.' + (stage >= 1 ? ' Facturas al ' + dl(at) + ': ' + docsOf(subAt(at)) + ' (' + ms(total(subAt(at))) + ').' : '') + ' Desde febrero de 2027 pasa al presupuesto de operación de TI.' },
        { numero: SUP.num.impl, proveedor: supplier('cf'), objeto: 'Implementación del ERP por iteraciones de precio fijo de ' + n0(implHours) + ' horas (' + nSprints + ' iteraciones en tres releases), bolsas de horas con tope y servicios por horas.', paqueteEdt: wcode('w31') + '–' + wcode('w9'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: implValue, fechaInicio: T.implIni, fechaFin: T.implFin, supervisor: ROLE.dir, polizaCumplimiento: 'Aprobada', polizaCalidad: 'Aprobada', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Firmado' : 'En ejecución',
          observaciones: 'Valor: ' + nSprints + ' iteraciones a ' + ms(implFee) + ' (' + ms(fixedPart) + ') y bolsas con tope de ' + ms(bolsa2) + ' (conector) y ' + ms(bolsa3) + ' (tablero gerencial). Las órdenes de servicio por horas (' + money(rate) + ' por hora; líder ' + money(rateLider) + ') se pagan aparte, con cargo al presupuesto de cada actividad. Póliza de salarios aprobada; retención del ' + pc(SUP.retencion) + ' de cada iteración hasta la aceptación de su release.' +
            (stage >= 1 ? ' Al ' + dl(at) + ': ' + closedBy(at).length + ' iteraciones facturadas y ' + hourlyAt(at).length + ' órdenes por horas (' + ms(total(hourlyAt(at))) + '). El CC-001 (básculas) no modificó el contrato: el alcance del release 1 cambió dentro de la capacidad contratada.' : '') +
            (stage >= 2 ? ' Bolsa del conector: ' + ms(total(implAt(at).filter(isBolsa))) + ' consumidos de ' + ms(bolsa2) + '.' : '') },
        { numero: SUP.num.cgc, proveedor: supplier('cgc'), objeto: 'Plan de gestión del cambio, red de usuarios clave y plan de comunicaciones de la adopción.', paqueteEdt: wcode('w51'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: cgcValue, fechaInicio: T.cgcIni, fechaFin: T.cgcFin, supervisor: ROLE.dir, polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Firmado' : 'Liquidado',
          observaciones: n0(cgcDays) + ' jornadas a precio fijo.' + (stage >= 1 ? ' Liquidado con la factura ' + docsOf(actualsOf('cgc', at)) + '.' : '') },
        { numero: SUP.num.eq, proveedor: supplier('tab'), objeto: 'Suministro de ' + n0(eqQty.tab) + ' tabletas robustas, ' + n0(eqQty.lec) + ' lectores de código de barras y ' + n0(eqQty.imp) + ' impresoras de etiquetas (lote 1).', paqueteEdt: wcode('w32'), tipoContrato: 'Precio fijo con ajuste económico de precio (FP-EPA)', valor: stage === 0 ? eqPlanned : total(actualsOf('eq', at)), fechaInicio: T.eqIni, fechaFin: T.eqFin, supervisor: ROLE.ti, polizaCumplimiento: 'No aplica', polizaCalidad: 'Aprobada', polizaRce: 'No aplica',
          estado: stage === 0 ? 'Firmado' : 'Liquidado',
          observaciones: 'Orden por USD ' + n0(eqUsd) + ' (' + money(eqPlanned) + ' a la tasa de planificación); pago contra entrega.' + (stage >= 1 ? ' Facturada por ' + money(total(actualsOf('eq', at))) + ' (' + docsOf(actualsOf('eq', at)) + ') con la tasa de cambio de la nacionalización. Las tabletas llegaron ' + nw(eqLate) + ' días hábiles tarde (INC-001); la prueba de campo de la iteración 2 (IN-002) confirmó los modelos dentro del plazo de cambio de 30 días.' : '') },
        { numero: SUP.num.red, proveedor: supplier('red'), objeto: 'Red inalámbrica de las bodegas principal y de Funza, llave en mano (lote 2).', paqueteEdt: wcode('w32'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: stage === 0 ? redPlanned : total(actualsOf('red', at)), fechaInicio: T.eqIni, fechaFin: T.eqFin, supervisor: ROLE.ti, polizaCumplimiento: 'Aprobada', polizaCalidad: 'Aprobada', polizaRce: 'Aprobada',
          estado: stage === 0 ? 'Firmado' : 'Liquidado',
          observaciones: stage === 0 ? 'Precio fijo llave en mano con estudio de sitio; pólizas por el trabajo en alturas.' : 'Llave en mano por ' + money(redPlanned) + ' más una adición de ' + money(total(actualsOf('red', at)) - redPlanned) + ' por un punto de acceso adicional en el patio de Funza que pidió el estudio de sitio, aprobada por el director. Liquidado con la factura ' + docsOf(actualsOf('red', at)) + '.' },
      ];
      if (stage >= 1) list.push({ numero: SUP.num.fe, proveedor: supplier('fe'), objeto: 'Habilitación como facturador electrónico, certificado de firma y paquete anual de ' + n0(feDocs) + ' documentos.', paqueteEdt: wcode('w33'), tipoContrato: 'Precio fijo cerrado (FFP)', valor: feValue, fechaInicio: T.feIni, fechaFin: T.feServicioFin, supervisor: ROLE.ti, polizaCumplimiento: 'No aplica', polizaCalidad: 'No aplica', polizaRce: 'No aplica',
        estado: stage === 1 ? 'Firmado' : 'En ejecución',
        observaciones: stage === 1 ? 'Credenciales y certificado a más tardar el ' + dl(T.feLimite) + ', antes del release 2. Acuerdo de nivel de servicio con aviso de caídas.' : 'Credenciales y certificado entregados el ' + dl(task('t15').actualFinish) + ', antes del plazo del ' + dl(T.feLimite) + ' (factura ' + docsOf(actualsOf('fe', at)) + '). Reclamación en curso por la caída del ambiente de habilitación sin aviso (INC-002). El paquete anual cubre hasta ' + monthName(T.feServicioFin) + '; desde febrero de 2027 lo administra TI.' });
      return rows('ct', list);
    };
    const clausulas = (stage) => 'Implementador: pago de cada iteración contra el acta de revisión firmada por el dueño del producto, con retención del ' + pc(SUP.retencion) + ' hasta la aceptación del release; las historias rechazadas se rehacen dentro de la capacidad de las iteraciones siguientes, sin costo adicional; reemplazo de cualquier integrante del equipo con un perfil equivalente en cinco días hábiles y una semana de empalme a su cargo' + (stage >= 2 ? ' (respuesta al riesgo R-005)' : '') + '; los equipos de prueba de su equipo corren por su cuenta' + (stage >= 1 ? ' (así cubrió la iteración 2 con sus tabletas de prueba mientras llegaban las importadas, INC-001)' : '') + '; terminación anticipada al cierre de cualquier iteración con aviso de una iteración; propiedad de la empresa sobre la parametrización y la documentación. Fabricante y proveedor tecnológico: créditos de servicio por indisponibilidad y aviso de mantenimientos y caídas. Equipos: cambio de modelo sin costo dentro de los 30 días siguientes a la entrega. Todos: confidencialidad y tratamiento de datos personales (Ley 1581 de 2012) e indemnidad frente a reclamaciones laborales de su personal.';
    const documentacion = (at) => 'Contratos, otrosíes, pólizas, actas de inicio y de liquidación en la carpeta de adquisiciones del proyecto (repositorio de la PMO); facturas en contabilidad; actas de revisión de cada iteración, soporte de los pagos al implementador, en el gestor.' + (otrosAt(at).length ? ' Las compras menores (' + otrosAt(at).map((a) => a.description.charAt(0).toLowerCase() + a.description.slice(1) + ', ' + a.document).join('; ') + ') se pagan con aprobación del director dentro de su límite y no se registran como contrato.' : '');
    const regFields = (stage) => ({
      contratos: contrato(stage),
      documentacion: stage >= 1 ? documentacion(regDate(stage)) : 'Contratos, pólizas y actas de inicio en la carpeta de adquisiciones del proyecto (repositorio de la PMO); facturas en contabilidad; actas de revisión de cada iteración, soporte de los pagos al implementador, en el gestor.',
      clausulas: clausulas(stage),
    });

    /* ================================================================ 12.3 · SEGUIMIENTO DE CONTRATOS Y DESEMPEÑO
       stage 0: cierre del release 1 (C0); 1: corte */
    const ctlFields = (stage) => {
      const at = stage === 0 ? C0 : CUT;
      const cal5 = (key) => SUP.calif[key][stage];
      const lastDate = (list) => list.reduce((m, a) => (a.date > m ? a.date : m), '');
      const row = (key, label, avance, obs, done) => {
        const list = actualsOf(key, at);
        const [plazo, calidad, sst] = cal5(key);
        return { contrato: label, fechaCorte: done ? lastDate(list) : at, avance, valorEjecutado: total(list), valorPagado: pagado(list, at), retencion: retenido(list, at), plazo, calidad, sst, observaciones: obs };
      };
      const vel = velBy(at);
      const rs = reviewStats(at);
      const closed = closedBy(at).length;
      const subN = subAt(at).length;
      const bolsaUsed = total(implAt(at).filter(isBolsa));
      const hourly = hourlyAt(at);
      const below = F.velocity.rows.filter((r) => r.status === 'cerrado' && r.end <= at && r.completed < vMeta).map((r) => r.name.replace('Iteración ', ''));
      const acR1at = acR1(at);
      /* causa de las iteraciones por debajo de la meta (actas de revisión y retrospectivas de 95) */
      const WHY_LOW = { 1: 'de arranque', 6: 'por la integración con la DIAN' };
      const implObs = 'Iteraciones facturadas: ' + closed + ' de ' + nSprints + ', a ' + ms(implFee) + ' cada una (avance por iteraciones cerradas). Velocidades: ' + andList(vel.map(String)) + ' puntos frente a ' + vSup + ' de la velocidad supuesta (meta: ' + vMeta + ' o más)' + (below.length ? '; por debajo, la' + (below.length > 1 ? 's iteraciones ' : ' iteración ') + andList(below.map((n) => n + (WHY_LOW[n] ? ' (' + WHY_LOW[n] + ')' : ''))) : '') + '. Elementos aceptados en las revisiones: ' + rs.acc + ' de ' + rs.pres + ' presentados (' + pc(rs.acc / rs.pres, 1) + ')' + (rs.rej ? '; rechazado: ' + andList(rs.rejCodes) + ', que se rehace sin costo adicional' : '') + '. ' +
        'Release 1 aceptado con ' + r1Prog.done + ' de ' + r1Prog.total + ' puntos (CPI del release ' + ix(R1.budget / acR1at) + ')' + (stage >= 1 ? '; release 2 con CPI de ' + ix(r2Evm.cpi) + ' y retención del ' + pc(SUP.retencion) + ' de sus iteraciones hasta su aceptación' : '; se devolvió la retención de sus iteraciones') + '. ' +
        (bolsaUsed ? 'Bolsa del conector: ' + ms(bolsaUsed) + ' de ' + ms(bolsa2) + ' (' + pc(bolsaUsed / bolsa2) + '). ' : '') +
        'Órdenes de servicio por horas: ' + hourly.length + ', por ' + ms(total(hourly)) + '.' +
        (stage >= 1 ? ' Si se aprueba mover la fecha del release 2 con una iteración adicional, esta requiere un otrosí de ' + ms(implFee) + '.' : '');
      const feList = actualsOf('fe', at);
      const feElapsed = Math.max(0, Math.min(1, D.diff(T.feIni, at) / D.diff(T.feIni, T.feServicioFin)));
      const seguimiento = [
        row('impl', SUP.num.impl + ' Implementación (' + lc(supplier('cf')) + ')', round1((closed / nSprints) * 100), implObs, false),
        row('sub', SUP.num.sub + ' Suscripción del ERP (' + lc(supplier('suc')) + ')', round1((subN / subMonths) * 100), 'Meses facturados: ' + subN + ' de ' + subMonths + ' (' + docsOf(subAt(at)) + '), mes vencido; el avance es el de los meses facturados. Disponibilidad dentro del acuerdo de nivel de servicio; SST no aplica (servicio en la nube).', false),
        row('fe', SUP.num.fe + ' Proveedor tecnológico de facturación electrónica', round1(feElapsed * 100), 'Paquete anual facturado (' + docsOf(feList) + ')' + (pagado(feList, at) >= total(feList) ? ' y pagado' : ', por pagar a ' + SUP.pagoDias + ' días') + '; el avance es el tiempo transcurrido del servicio anual. Entregó credenciales y certificado el ' + dl(task('t15').actualFinish) + ', antes del plazo del ' + dl(T.feLimite) + '.' + (stage >= 1 && inc('INC-002') ? ' El ambiente de habilitación se cayó el ' + dlShort(inc('INC-002').fecha) + ' y el ' + dlShort(D.add(inc('INC-002').fecha, 1)) + ' sin aviso (INC-002): calidad calificada en ' + SUP.calif.fe[1][1] + ' y reclamación en curso.' : '') + ' SST no aplica (servicio en la nube).', false),
        row('eq', SUP.num.eq + ' Equipos de bodega (' + lc(supplier('tab')) + ')', 100, 'Liquidado por ' + money(eqFinal) + ' frente a ' + money(eqPlanned) + ' de la orden: ajuste por tasa de cambio previsto en el contrato (FP-EPA). Entrega ' + nw(eqLate) + ' días hábiles tarde (INC-001), sin efecto en la iteración 2.', true),
        row('red', SUP.num.red + ' Red inalámbrica (' + lc(supplier('red')) + ')', 100, 'Liquidado por ' + money(redFinal) + ' con la adición del punto de acceso del patio de Funza; cobertura verificada en las dos bodegas.', true),
        row('sel', SUP.num.sel + ' Consultor de selección', 100, 'Liquidado por ' + money(selFinal) + ' de un tope de ' + money(selValue) + '; evaluación entregada el ' + dl(T.eval) + '.', true),
        row('jur', SUP.num.jur + ' Asesoría jurídica', 100, 'Liquidado; contratos revisados antes de la firma del ' + dl(T.sign) + '. SST no aplica.', true),
        row('cgc', SUP.num.cgc + ' Consultoría de gestión del cambio', 100, 'Liquidado; plan de gestión del cambio y red de usuarios clave entregados el ' + dl(T.cgcFin) + '.', true),
      ];
      const inc1 = inc('INC-001'), inc2 = inc('INC-002');
      const reclamaciones = [
        { contrato: SUP.num.eq, descripcion: 'Las tabletas robustas llegaron ' + nw(eqLate) + ' días hábiles tarde por una demora en la importación (INC-001).', fecha: inc1 ? inc1.fecha : T.eqFin, estado: 'Resuelta', solucion: 'Cerrada sin penalidad: el retraso no afectó la iteración 2 porque el implementador prestó sus tabletas de prueba sin costo; instaladas el ' + dl(task('t14').actualFinish) + '.' },
      ];
      if (stage >= 1 && inc2) reclamaciones.unshift({ contrato: SUP.num.fe, descripcion: 'El ambiente de habilitación estuvo caído el ' + dlShort(inc2.fecha) + ' y el ' + dlShort(D.add(inc2.fecha, 1)) + ' sin el aviso que exige el enunciado del trabajo (INC-002); el equipo perdió dos días de pruebas del conector. Ya había fallado sin aviso en la iteración 5 (medio día perdido, retrospectiva de la iteración 5).', fecha: inc2.fecha, estado: 'En negociación', solucion: 'El proveedor restableció el servicio el ' + dlShort(D.add(inc2.fecha, 1)) + '. Se le pidió aviso automático de caídas y un crédito de servicio por los dos días.' + (pasoAviso ? ' Próximo paso: acordar el aviso automático a más tardar el ' + dl(pasoAviso.fecha) + ' (próximos pasos del informe de desempeño).' : '') });
      const liquidados = seguimiento.filter((r) => r.avance === 100).map((r) => r.contrato.split(' ')[0]);
      return {
        seguimiento: rows('sg', seguimiento),
        reclamaciones: rows('rc', reclamaciones),
        cierre: 'Para liquidar cada contrato: acta de recibo a satisfacción del supervisor, paz y salvo de seguridad social y parafiscales del proveedor, pólizas vigentes para el periodo posterior, conciliación de las facturas con el registro de costos reales y evaluación final del proveedor. Liquidados: ' + andList(liquidados) + '. Pendientes: el contrato del implementador, al terminar la estabilización (' + dl(T.implFin) + '), con la devolución de la retención y el acta de transferencia al soporte de TI; la suscripción, que pasa al presupuesto de operación de TI en febrero de 2027, y el proveedor tecnológico, cuyo paquete anual sigue hasta ' + monthName(T.feServicioFin) + '.',
      };
    };

    /* ================================================================ entradas por plantilla */
    const TB_DIR = { elaboro: ROLE.dir, reviso: ROLE.pof, aprobo: ROLE.pat };
    const TB_TI = { elaboro: ROLE.ti, reviso: ROLE.dir, aprobo: ROLE.pat };
    const sowImpl0 = sowImpl(0), sowImpl1 = sowImpl(1), sowSub0 = sowSub(0), sowSub1 = sowSub(1);
    const reg2 = regFields(2);
    const ctl1 = ctlFields(1);
    return {
      'plan-gestion-adquisiciones': {
        status: 'aprobado', rev: '1', date: T.lb0, created: cal.addWork(T.disc, -4), titleBlock: TB_DIR, fields: planFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: T.disc, note: 'Emisión inicial al cerrar el descubrimiento, antes de la solicitud de propuestas.', fields: planFields(0) },
          { rev: '1', status: 'aprobado', date: T.lb0, note: 'Actualizado con los contratos firmados el ' + dl(T.sign) + ' y la LB0: proveedores seleccionados, tarifa negociada y velocidad supuesta del plan de releases.' },
        ],
      },
      'estrategia-adquisiciones': { status: 'aprobado', rev: '0', date: T.disc, created: cal.addWork(T.disc, -4), titleBlock: TB_DIR, fields: estrategiaFields },
      'decisiones-hacer-comprar': {
        status: 'aprobado', rev: '1', date: T.lb0, created: cal.addWork(T.disc, -5), titleBlock: TB_DIR, fields: hocFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: T.disc, note: 'Decisiones al cerrar el descubrimiento, con la estimación independiente del consultor de selección.', fields: hocFields(0) },
          { rev: '1', status: 'aprobado', date: T.lb0, note: 'Valores contratados de la implementación (precio por iteración y bolsas) con la LB0.' },
        ],
      },
      'enunciado-trabajo-adquisicion': { instances: [
        { key: 'sow-equipos', title: 'Enunciado del trabajo — Equipos de bodega y red inalámbrica', status: 'aprobado', rev: '0', date: T.eqSol, created: cal.addWork(T.eqSol, -3), titleBlock: TB_TI, fields: sowEq },
        { key: 'sow-implementacion', title: 'Enunciado del trabajo — Implementación del ERP por iteraciones de precio fijo', status: 'aprobado', rev: '1', date: T.sign, created: cal.addWork(T.rfp, -3), titleBlock: TB_DIR, fields: sowImpl1,
          revs: [
            { rev: '0', status: 'aprobado', date: T.rfp, note: 'Emitido con la solicitud de propuestas.', fields: sowImpl0 },
            { rev: '1', status: 'aprobado', date: T.sign, note: 'Anexo técnico del contrato ' + SUP.num.impl + ': precio por iteración, bolsas y tarifa por hora negociados.' },
          ] },
        { key: 'sow-suscripcion', title: 'Enunciado del trabajo — Suscripción del ERP en la nube', status: 'aprobado', rev: '1', date: T.sign, created: cal.addWork(T.rfp, -3), titleBlock: TB_TI, fields: sowSub1,
          revs: [
            { rev: '0', status: 'aprobado', date: T.rfp, note: 'Emitido con la solicitud de propuestas.', fields: sowSub0 },
            { rev: '1', status: 'aprobado', date: T.sign, note: 'Anexo del contrato ' + SUP.num.sub + ' con los precios por usuario.' },
          ] },
        { key: 'sow-facturacion', title: 'Enunciado del trabajo — Servicio de facturación electrónica', status: 'aprobado', rev: '0', date: T.feSol, created: cal.addWork(T.feSol, -3), titleBlock: TB_TI, fields: sowFe },
      ] },
      'criterios-seleccion-proveedores': {
        status: 'aprobado', rev: '1', date: T.eval, created: cal.addWork(T.rfp, -3), titleBlock: { elaboro: ROLE.csel, reviso: ROLE.comite, aprobo: ROLE.pat }, fields: critFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: T.rfp, note: 'Criterios, pesos y requisitos habilitantes publicados con la solicitud de propuestas.', fields: critFields(0) },
          { rev: '1', status: 'aprobado', date: T.eval, note: 'Evaluación de los tres finalistas después de las demostraciones guiadas.' },
        ],
      },
      'registro-adquisiciones': {
        status: 'revision', rev: '2A', date: CUT, created: T.sign, titleBlock: { elaboro: ROLE.dir, reviso: ROLE.jur, aprobo: '' }, fields: reg2,
        revs: [
          { rev: '0', status: 'aprobado', date: T.sign, note: 'Emisión con los contratos firmados.', fields: regFields(0) },
          { rev: '1', status: 'aprobado', date: REG1, note: 'Contrato del proveedor tecnológico; equipos, red y consultorías liquidados.', fields: regFields(1) },
        ],
      },
      'control-adquisiciones': {
        status: 'revision', rev: '1A', date: CUT, created: C0, titleBlock: { elaboro: ROLE.dir, reviso: ROLE.pof, aprobo: '' }, fields: ctl1,
        revs: [
          { rev: '0', status: 'aprobado', date: C0, note: 'Evaluación de los proveedores al cierre del release 1.', fields: ctlFields(0) },
        ],
      },
    };
  }

  PM.exampleDocs = PM.exampleDocs || {};
  (PM.exampleDocs.erpParts = PM.exampleDocs.erpParts || []).push(part);
  /* supuestos del módulo, para las pruebas y la documentación */
  PM.exampleDocs.erpAdquisiciones = { SUP: PM.deepFreeze ? PM.deepFreeze(cp(SUP)) : cp(SUP) };
})();

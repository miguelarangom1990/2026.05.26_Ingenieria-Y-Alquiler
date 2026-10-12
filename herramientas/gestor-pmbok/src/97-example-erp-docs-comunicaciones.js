/* ==========================================================================
   97-example-erp-docs-comunicaciones.js — documentos de comunicaciones del
   ejemplo ágil «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
   (94-example-erp.js, SPEC §9.7): plan de gestión de las comunicaciones,
   registro de comunicaciones del proyecto y actas de reunión.
   Se registra en PM.exampleDocs.erpParts con la firma (F, ctx): F son los
   hechos que calcula 94 (computeFacts) y ctx = {R, CODE, STATUS_DATE, data}
   (schedule, wbs, costs, agile, items, baselines y resources). Las cifras salen
   de F, de ctx.data, de PM.calc / PM.agile o de los documentos de 95
   (PM.exampleDocs.erp(F): incidentes, riesgos, solicitud de cambio, informe de
   desempeño), así que no se escriben a mano.
   Enfoque ágil (11-doc-approach): los eventos de Scrum y el tablero cubren al
   equipo y tienen sus propias actas (95); este plan se centra en los
   interesados que no asisten a ellos, el registro guarda solo comunicaciones
   formales (con terceros y de gobierno del proyecto) y las actas son de
   comités y reuniones con decisiones.
   Este módulo fija el calendario y las decisiones del comité quincenal de
   seguimiento y del comité de control de cambios (supuestos en MEET, abajo):
   informe quincenal con corte cada dos viernes (el n.º 7 es el del 9 de
   octubre, el de 95) y periodo desde el día siguiente al corte anterior,
   comité el jueves anterior a cada corte y actas que se aprueban si no hay
   observaciones en dos días hábiles. Las decisiones de las sesiones ordinarias
   van en el informe quincenal siguiente y las de la revisión al cierre de cada
   release, en la revisión del caso de negocio (módulo de integración), que el
   registro cita. Con los otros módulos 97 cargados, el acta del comité de
   selección nombra los criterios del documento de criterios (adquisiciones).
   Los documentos aprobados (y sus revisiones) no citan hechos posteriores a su
   fecha.
   Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.calc || !PM.agile || !PM.date || !PM.cal) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const ms = (v) => plain(PM.fmt.moneyShort(v, 'COP'));
  const ix = (v) => plain(PM.fmt.idx(v));
  const n1 = (v) => plain(PM.fmt.num(v, 1));
  const nm = (v) => plain(PM.fmt.num(v, Number.isInteger(v) ? 0 : 1));
  const pc = (x, d) => plain(PM.fmt.pct(x, d || 0));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const andList = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);
  const signedPct = (x) => (x >= 0 ? '+' : '−') + plain(PM.fmt.num(Math.abs(x) * 100, 1)) + ' %';
  const pad2 = (n) => String(n).padStart(2, '0');
  const WORDS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  const word = (n) => WORDS[n] || String(n);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /* ------------------------------------------------------------------ calendario de reuniones (supuestos del ejemplo)
     - reportLag: el informe quincenal se emite el día hábil siguiente a su corte (el plan exige máximo dos días hábiles).
     - El comité quincenal se reúne el jueves anterior a cada corte (un día antes del viernes de corte), de 8:00 a 9:30;
       antes de la LB0 sigue la misma cadencia desde la segunda semana después de la reunión de arranque.
     - approvalDays: un acta se envía el día de la reunión y se entiende aprobada si no hay observaciones en dos días hábiles. */
  const MEET = { cadenceDays: 14, reportLag: 1, approvalDays: 2, firstComiteAfterKickoff: 14, comiteHours: ['08:00', '09:30'] };

  const EMP = 'Ingeniería y Alquiler S.A.S.';
  const ROLE = { ccb: 'Comité de control de cambios', po: 'Dueño del producto (Gerente administrativo y financiero)' };

  function part(F, ctx) {
    const { R, CODE, STATUS_DATE, data } = ctx || {};
    if (!F || !R || !data || !data.schedule || !data.baselines || !data.agile || !data.wbs || !data.costs) return {};
    const base = PM.exampleDocs && typeof PM.exampleDocs.erp === 'function' ? PM.exampleDocs.erp(F) : null;
    if (!base || !base['registro-incidentes'] || !base['registro-riesgos'] || !base['informe-desempeno']) return {};
    const { schedule, wbs, costs, agile, items, baselines } = data;
    const resources = data.resources || { items: [] };
    const cal = PM.cal.make(schedule.settings, F.start);
    const tree = PM.calc.wbsTree(wbs.nodes);
    const wcode = (id) => tree.codes.get(id) || '';
    const LB = (baselines.find((b) => b.data && b.data.number === 0) || baselines[0]).data;
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id) || {};
    const task = (id) => schedule.tasks.find((t) => t.id === id) || {};
    const cat = (key) => (resources.items || []).find((x) => x.id === 'rec-' + key) || {};
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const relName = (id) => F.releaseNames[id];
    const relShort = (id) => relName(id).replace(/:.*/, '');
    const sprints = PM.agile.sortSprints(agile.sprints);
    const st = PM.agile.settings(agile);
    const item = (code) => (items || []).find((x) => x.code === code) || {};
    const abbr = (tid) => (PM.templates && PM.templates[tid] && PM.templates[tid].abbr) || 'DOC';
    const docCode = (tid) => CODE + '-' + abbr(tid);
    const pctIn = (txt) => (txt.match(/\d+,\d+\s*%/) || [''])[0].replace(/\s+/, ' ');
    /* rango de fechas en texto: «del 3 al 6 de noviembre» o «del 29 de octubre al 6 de noviembre» */
    const rangeTxt = (a, b) => (a === b ? 'el ' + dlShort(a) : a.slice(0, 7) === b.slice(0, 7) ? 'del ' + (+a.slice(8)) + ' al ' + dlShort(b) : 'del ' + dlShort(a) + ' al ' + dlShort(b));
    const relList = () => agile.releases.map((r) => lcFirst(r.name.replace(/^Release \d+: /, ''))).join('; ');
    const firstWorkOn = (iso) => { let d = iso; while (!cal.isWork(d)) d = D.add(d, 1); return d; };
    /* cinco primeros días hábiles del mes (cierre mensual) */
    const closingDays = (iso) => { const d0 = firstWorkOn(D.startOfMonth(iso)); return [0, 1, 2, 3, 4].map((k) => cal.addWork(d0, k)); };

    /* ---------------- documentos de 95 que se citan (hechos con fecha) */
    const acta0 = base['acta-constitucion'].revs.find((r) => r.rev === '0').fields;
    const INC = Object.fromEntries(base['registro-incidentes'].fields.incidentes.map((r) => [r.id, r]));
    const RR = base['registro-riesgos'];
    const riesgosNow = RR.fields.riesgos;
    const riesgosRev = (r) => RR.revs.find((x) => x.rev === r).fields.riesgos;
    const riskRev1Date = RR.revs.find((x) => x.rev === '1').date;
    const informe = base['informe-desempeno'].instances[0];
    const solicitud = base['solicitud-cambio'].instances[0].fields;
    const planRel0 = base['plan-release'].revs.find((r) => r.rev === '0').fields;
    const cambiosPlan = base['plan-gestion-cambios'].fields;
    const stakeholders = base['registro-interesados'].fields.interesados;
    const rfOrg = (stakeholders.find((s) => /Revisor fiscal/.test(s.nombre)) || {}).organizacion || 'Revisoría fiscal';
    const umbral = Object.fromEntries(cambiosPlan.umbrales.map((u) => [u.nivel, u]));
    /* disparador de R-003 en el registro de riesgos rev. 0 (LB0): «Más de 5 % de remisiones o devoluciones registradas en papel en una semana» */
    const r003Paper = ((/(más de \d+(?:,\d+)?\s*%)/i.exec((riesgosRev('0').find((r) => r.id === 'R-003') || {}).disparador || '') || [])[1] || '').replace(/^M/, 'm').replace(/\s+%/, ' %');

    /* ---------------- fechas del proyecto */
    const KICKOFF = task('t02').actualFinish;                 // reunión de arranque (registro de interesados rev. 0)
    const SELECTION = task('t09').actualFinish;               // comité de selección: fin de las demostraciones y la evaluación
    const LB0 = F.lb0Date;
    const CC1 = F.cc1Date, CC1_REQ = F.cc1Request;
    const r1Sprints = sprints.filter((s) => s.releaseId === 'rel-1');
    const r2Sprints = sprints.filter((s) => s.releaseId === 'rel-2');
    const it1 = sprints[0], it4 = r1Sprints[r1Sprints.length - 1];
    const it6 = sprints.filter((s) => s.status === 'cerrado').slice(-1)[0];
    const GOLIVE1 = F.milestones.t29.actual;                  // salida a producción del release 1
    const GO_CCB = it4.end;                                   // comité de control de cambios que autoriza la salida
    const PLAN_REV1 = cal.addWork(GOLIVE1, 1);                // revisión del plan después de la salida (con el registro de interesados rev. 2)
    const R3_GO = lbT('t32').start;                           // salida del release 3 en la LB0: después del cierre anual

    /* informe quincenal: cortes cada dos viernes hasta el del informe de 95 (n.º N, 9 de octubre) */
    const nInf = Number((/(\d+)/.exec(informe.fields.numeroInforme) || [])[1]) || 1;
    const lastCut = informe.fields.fechaCorte;
    const cuts = Array.from({ length: nInf }, (_, i) => D.add(lastCut, -MEET.cadenceDays * (nInf - 1 - i)));
    const issueOf = (cut) => cal.addWork(cut, MEET.reportLag);
    /* comité quincenal: el jueves anterior a cada corte, desde la segunda semana después del arranque */
    const comites = [];
    for (let d = D.add(lastCut, -1); d >= D.add(KICKOFF, MEET.firstComiteAfterKickoff); d = D.add(d, -MEET.cadenceDays)) comites.unshift(d);
    for (let d = D.add(lastCut, MEET.cadenceDays - 1); d <= F.end; d = D.add(d, MEET.cadenceDays)) comites.push(d);
    const COMITE_OCT = D.add(lastCut, -1);                    // sesión que aprobó la rev. 2 del registro de riesgos (R-008)
    const nextComite = (after, skip) => comites.find((d) => d > after && !(skip || []).includes(d)) || null;
    const approvalOf = (meeting) => cal.addWork(meeting, MEET.approvalDays);

    /* ---------------- cifras de los datos */
    const r1Lb0 = F.releaseAt('rel-1', LB0).total;
    const R1 = rel('rel-1'), R2 = rel('rel-2');
    const r1before = F.releaseAt('rel-1', D.add(CC1_REQ, -1));
    const r1atReq = F.releaseAt('rel-1', CC1_REQ);
    const velReq = F.velocityAt(CC1_REQ);
    const remainingReq = R1.baseline.points - r1atReq.done;
    const cc1Pct = (R1.baseline.points - r1Lb0) / r1Lb0;
    const s4 = F.releaseAt('rel-1', it4.end);
    const r1ac = PM.agile.releaseActualCost(R1, costs, tree, it4.end);
    const r1cpi = r1ac ? (R1.budget * s4.pct) / r1ac : null;
    const r2at6 = F.releaseAt('rel-2', it6.end);
    const vel6 = F.velocityAt(it6.end);
    const fc6 = F.forecastAt('rel-2', it6.end);
    const r2ac6 = PM.agile.releaseActualCost(R2, costs, tree, it6.end);
    const mig = pctIn(task('t17').notes || '');                // diferencia del inventario migrado (0,4 %)
    const sinPeso = ((/(\d+)\s*%/.exec(task('t16').notes || '') || [])[1]) || '';
    const t16Late = cal.countWork(D.add(lbT('t16').finish, 1), task('t16').actualFinish);
    const t14 = task('t14');
    const qtyOf = (key) => ((t14.resources || []).find((a) => a.resourceId === 'rec-' + key) || {}).qty || 0;
    const groups = (((costs.actuals || []).find((a) => a.taskId === 't22' && /grupos/.test(a.description)) || {}).description || '').match(/\((\w+) grupos\)/);
    const groupsTxt = groups ? groups[1] + ' grupos' : 'grupos por rol';
    const feDoc = ((costs.actuals || []).find((a) => a.taskId === 't15') || {}).document || '';
    const ucCount = cat('uc').availability || 0;
    const t23 = lbT('t23');
    const t23Days = []; for (let d = t23.start; d <= t23.finish; d = D.add(d, 1)) if (cal.isWork(d)) t23Days.push(d);
    const novClose = closingDays(t23.finish);
    const t23Before = t23Days.filter((d) => d < novClose[0]);
    /* días sueltos: «el 29 y el 30 de octubre» */
    const daysTxt = (list) => andList(list.map((d, i) => 'el ' + (i < list.length - 1 && list[i + 1].slice(0, 7) === d.slice(0, 7) ? String(+d.slice(8)) : dlShort(d))));
    const reserveDiff = (() => {
      const before = Object.fromEntries(riesgosRev('1').map((r) => [r.id, r.reserva]));
      const added = riesgosNow.filter((r) => !(r.id in before));
      const changed = riesgosNow.filter((r) => r.id in before && before[r.id] !== r.reserva);
      return { added, changed, before, total: riesgosNow.reduce((s, r) => s + r.reserva, 0), totalBefore: riesgosRev('1').reduce((s, r) => s + r.reserva, 0) };
    })();

    /* ============================================================ 10.1 · PLAN DE GESTIÓN DE LAS COMUNICACIONES */
    const MATRIX = (stage) => {
      const list = [
        { informacion: 'Informe de desempeño del trabajo (informe quincenal)', proposito: 'Estado general, valor ganado del proyecto sobre la LB0 y AgileEVM de cada release, velocidad y pronóstico, riesgos, incidentes, cambios y decisiones requeridas.', emisor: R.dir, receptores: 'Gerencia General; dueño del producto; comité de control de cambios', medio: 'Informe escrito', metodo: 'De tipo push (enviar)', frecuencia: 'Quincenal', formato: 'Informe de desempeño del trabajo del gestor; corte cada dos viernes desde el ' + dl(cuts[0]) + ', periodo desde el día siguiente al corte anterior y emisión dentro de los dos días hábiles siguientes. El valor ganado se calcula a la fecha de corte de cada informe; los cortes de avance que guarda el gestor son mensuales (último día hábil de cada mes)', responsable: R.dir },
        { informacion: 'Comité quincenal de seguimiento', proposito: 'Revisar el estado del proyecto y de los releases y decidir sobre riesgos, reservas, incidentes escalados y cambios de nivel 2 (sesión del comité de control de cambios).', emisor: R.dir, receptores: 'Gerencia General; dueño del producto; jefe de TI; líder del implementador; Scrum Master; gerente comercial y contador (invitados)', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Quincenal', formato: 'Jueves anterior a cada corte, de ' + MEET.comiteHours[0] + ' a ' + MEET.comiteHours[1] + ' (el implementador se conecta por videoconferencia); acta de reunión cuando hay decisiones', responsable: R.dir },
        { informacion: 'Planificación de la iteración', proposito: 'Acordar el objetivo, la capacidad y el compromiso de cada iteración de ' + st.sprintLength + ' días hábiles.', emisor: R.sm, receptores: 'Dueño del producto; desarrolladores (equipo Scrum)', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Quincenal', formato: 'Planificación de la iteración en el gestor, el primer día de cada iteración', responsable: R.sm },
        { informacion: 'Reunión diaria del equipo Scrum', proposito: 'Sincronizar el trabajo del día y levantar impedimentos.', emisor: 'Desarrolladores (equipo Scrum)', receptores: 'Equipo Scrum; Scrum Master', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Diaria', formato: '15 minutos frente al tablero Kanban; sin acta (los impedimentos quedan en el tablero)', responsable: R.sm },
        { informacion: 'Refinamiento del backlog del producto', proposito: 'Detallar, dividir y estimar las historias de las próximas iteraciones con las áreas, y revisar las reglas contables de las historias de facturación.', emisor: 'Dueño del producto', receptores: 'Desarrolladores; usuarios clave (el jefe de mantenimiento, en el release 3); contador (historias de facturación y cartera)', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Semanal', formato: 'Backlog del producto en el gestor con criterios de aceptación y estimación', responsable: 'Dueño del producto' },
        { informacion: 'Revisión de la iteración', proposito: 'Demostrar el incremento con datos reales, aceptar o rechazar cada elemento y recoger la retroalimentación de las áreas.', emisor: 'Equipo Scrum', receptores: 'Dueño del producto; usuarios clave (coordinador logístico, jefe de almacén, jefe de facturación y cartera); gerente de proyecto del implementador; Gerencia General al cierre de cada release', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Quincenal', formato: 'Acta de revisión de la iteración, el último día de cada iteración', responsable: R.sm },
        { informacion: 'Retrospectiva de la iteración', proposito: 'Mejorar la forma de trabajo del equipo y llevar las lecciones al registro de lecciones aprendidas.', emisor: R.sm, receptores: 'Equipo Scrum; dueño del producto', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Quincenal', formato: 'Retrospectiva de la iteración, después de la revisión', responsable: R.sm },
        { informacion: 'Tablero Kanban y métricas ágiles', proposito: 'Mostrar a cualquier interesado el estado del trabajo, los bloqueos, el burndown, el burnup y la velocidad sin informes adicionales.', emisor: R.sm, receptores: 'Equipo Scrum; dueño del producto; director de proyecto; interesados que lo consulten', medio: 'Repositorio de documentos', metodo: 'De tipo pull (consultar)', frecuencia: 'Diaria', formato: 'Tablero Kanban y métricas ágiles del gestor, actualizados cada día', responsable: R.sm },
        { informacion: 'Reunión semanal con el implementador', proposito: 'Revisar la capacidad del equipo del implementador, el alcance de cada iteración, la facturación al cierre de cada iteración y los riesgos del contrato.', emisor: R.dir, receptores: 'Gerente de proyecto del implementador; líder del implementador; Scrum Master', medio: 'Reunión virtual', metodo: 'Interactiva', frecuencia: 'Semanal', formato: 'Acta de reunión solo cuando hay acuerdos contractuales; los demás temas, en el tablero', responsable: R.dir },
        { informacion: 'Espacio del proyecto en la reunión semanal de bodega', proposito: 'Contar a almacén y bodega qué cambia con cada release, recoger novedades y seguir la adopción en las dos bodegas.', emisor: 'Dueño del producto con el usuario clave de almacén', receptores: 'Jefe de almacén; personal de bodega y conductores', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Semanal', formato: '15 minutos en la reunión semanal de las bodegas principal y de Funza', responsable: 'Dueño del producto' },
        { informacion: 'Avisos en las carteleras de las bodegas', proposito: 'Preparar al personal de bodega y a los conductores para la capacitación y la salida de cada release.', emisor: 'Dueño del producto', receptores: 'Personal de bodega y conductores', medio: 'Cartelera de obra', metodo: 'De tipo push (enviar)', frecuencia: 'Por hito', formato: 'Aviso impreso en las carteleras de las bodegas principal y de Funza antes de la capacitación de cada release', responsable: 'Dueño del producto' },
        { informacion: 'Capacitación de usuarios finales por release', proposito: 'Formar a cada rol en los procesos del release antes de su salida a producción.', emisor: R.ins, receptores: 'Usuarios finales de cada release (por grupos y por rol)', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Por hito', formato: 'Sesiones por grupo y guías rápidas; registro de asistencia y evaluación', responsable: 'Dueño del producto' },
        { informacion: 'Comunicado de salida a producción', proposito: 'Informar la fecha del corte, qué cambia en cada área, el canal de soporte y el retiro de los formatos anteriores.', emisor: R.dir, receptores: 'Todas las áreas; personal de bodega y conductores (copia en las carteleras)', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por hito', formato: 'Comunicado por correo el día en que el comité de control de cambios autoriza cada salida; copia impresa en las carteleras de las bodegas principal y de Funza', responsable: R.dir },
        { informacion: 'Reunión con la revisoría fiscal antes de cada corte', proposito: 'Revisar los soportes de la conciliación de los saldos migrados (inventario, cartera y hojas de vida) antes de cada salida a producción.', emisor: 'Contador', receptores: 'Revisor fiscal; director de proyecto', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Por hito', formato: 'Conciliación firmada por contabilidad y conformidad escrita de la revisoría fiscal', responsable: 'Contador' },
        { informacion: 'Revisión trimestral con el fabricante del ERP', proposito: 'Revisar el uso de la suscripción, las funciones estándar y la hoja de ruta del producto.', emisor: R.dir, receptores: 'Gerente de cuenta del fabricante del ERP; jefe de TI', medio: 'Reunión virtual', metodo: 'Interactiva', frecuencia: 'Por evento', formato: 'Una reunión por trimestre de la suscripción; acta de reunión si hay acuerdos', responsable: R.jti },
        { informacion: 'Casos en la mesa de ayuda del proveedor tecnológico', proposito: 'Reportar fallas del ambiente de habilitación y de la API y tramitar credenciales y certificados de firma.', emisor: R.di, receptores: 'Proveedor tecnológico de facturación electrónica', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Caso en la mesa de ayuda del proveedor con número de seguimiento', responsable: R.di },
        { informacion: 'Reunión semanal con el proveedor tecnológico (release 2)', proposito: 'Seguir la integración con la DIAN, los casos abiertos y la estabilidad del ambiente de habilitación.', emisor: R.di, receptores: 'Proveedor tecnológico de facturación electrónica; Scrum Master; jefe de TI', medio: 'Reunión virtual', metodo: 'Interactiva', frecuencia: 'Semanal', formato: 'Durante el ' + relShort('rel-2').toLowerCase() + ' (' + r2Sprints[0].name.toLowerCase().replace('iteración', 'iteraciones') + ' a ' + r2Sprints[r2Sprints.length - 1].name.replace('Iteración ', '') + '); acuerdos en el tablero y, si son formales, en el registro de comunicaciones', responsable: R.di },
        { informacion: 'Normativa de la factura electrónica', proposito: 'Seguir los cambios del anexo técnico de la factura electrónica de venta y del servicio de validación.', emisor: 'DIAN', receptores: 'Contador; desarrollador de integraciones', medio: 'Repositorio de documentos', metodo: 'De tipo pull (consultar)', frecuencia: 'Por evento', formato: 'Consulta de la normativa y del anexo técnico vigente antes de cada historia de facturación', responsable: 'Contador' },
        { informacion: 'Comunicaciones formales con proveedores y entes externos', proposito: 'Dejar soporte de las solicitudes, notificaciones, reclamos y entregas que comprometen a la empresa o a un proveedor.', emisor: R.dir, receptores: 'Socio implementador; fabricante del ERP; proveedor tecnológico; distribuidores; revisoría fiscal', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Correo u oficio con el consecutivo COM-### del registro de comunicaciones', responsable: R.dir },
        { informacion: 'Decisión de las solicitudes de cambio', proposito: 'Informar al solicitante y al equipo la decisión de cada solicitud de cambio y su efecto en los releases.', emisor: R.dir, receptores: 'Solicitante; equipo Scrum; interesados afectados', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Correo con la solicitud de cambio decidida, dentro de un día hábil', responsable: R.dir },
        { informacion: 'Documentos del proyecto', proposito: 'Consultar la versión vigente de planes, registros, actas y líneas base.', emisor: R.dir, receptores: 'Equipo del proyecto; interesados autorizados', medio: 'Repositorio de documentos', metodo: 'De tipo pull (consultar)', frecuencia: 'Por evento', formato: 'Gestor de proyectos: cada documento con código, revisión y estado', responsable: R.sm },
        /* respuesta de R-003 en el registro de riesgos desde la rev. 0 (LB0): acompañamiento en sitio y medición semanal del papel */
        { informacion: 'Acompañamiento en sitio después de cada salida a producción', proposito: 'Resolver dudas en el puesto de trabajo y medir el uso del ERP frente a los formatos en papel.', emisor: 'Usuarios clave de almacén y logística con el analista de TI', receptores: 'Personal de bodega y conductores; jefe de almacén', medio: 'Reunión presencial', metodo: 'Interactiva', frecuencia: 'Diaria', formato: 'Dos semanas después de cada salida, en las bodegas principal y de Funza (respuesta del riesgo R-003); reporte semanal del porcentaje de remisiones y devoluciones registradas en papel (disparador de R-003' + (r003Paper ? ': ' + r003Paper + ' en una semana' : '') + ')', responsable: 'Dueño del producto' },
      ];
      if (stage >= 1) {
        list.push(
          { informacion: 'Reporte de defectos e incidentes de producción', proposito: 'Reportar las fallas del ERP en producción y atender el mismo día las que impiden facturar o despachar.', emisor: 'Usuarios de las áreas, por medio de su usuario clave', receptores: 'Jefe de TI; Scrum Master; dueño del producto (fallas críticas)', medio: 'Correo electrónico', metodo: 'De tipo push (enviar)', frecuencia: 'Por evento', formato: 'Caso en la mesa de ayuda de TI; las fallas críticas, además por llamada al jefe de TI y por el carril de urgencia del tablero', responsable: R.jti },
        );
      }
      return rows('pgcm-m', list);
    };
    const escalation = (stage) => rows('pgcm-e', [
      { nivel: 'Nivel 1', situacion: 'Impedimento del equipo Scrum o duda operativa de un usuario clave.', escalaA: R.sm + ', en la reunión diaria', plazo: 'Menos de un día hábil' },
      { nivel: 'Nivel 2', situacion: 'Impedimento que el Scrum Master no resuelve en un día hábil, incidente de prioridad alta sin solución en dos días hábiles o incumplimiento de un proveedor.', escalaA: R.dir, plazo: '1 día hábil' },
      { nivel: 'Nivel 3', situacion: 'Incidente que afecta una salida a producción o la facturación, variación fuera de los umbrales del plan para la dirección del proyecto o necesidad de usar la reserva de gestión.', escalaA: 'Gerencia General (patrocinador)', plazo: '2 días hábiles' },
      { nivel: 'Cambios', situacion: 'Cambio en el alcance, la fecha o el presupuesto de un release o del proyecto (niveles 1 a 3 del plan de gestión de cambios; las emergencias, en la fila siguiente).', escalaA: 'Según el plan de gestión de cambios: dueño del producto (nivel 1), comité de control de cambios (nivel 2) o Gerencia General (nivel 3)', plazo: 'De ' + umbral['Nivel 1'].plazoDias + ' a ' + umbral['Nivel 3'].plazoDias + ' días hábiles según el nivel' },
      /* nivel «Emergencia» del plan de gestión de cambios (rev. 0, con la LB0): carril de urgencia y ratificación del comité */
      ...(umbral.Emergencia ? [{ nivel: 'Emergencia', situacion: umbral.Emergencia.criterio, escalaA: 'Dueño del producto y jefe de TI, que autorizan la corrección por el carril de urgencia del tablero (plan de gestión de cambios); el comité de control de cambios la ratifica en su siguiente sesión', plazo: 'Atención el mismo día; se documenta en ' + umbral.Emergencia.plazoDias + (umbral.Emergencia.plazoDias === 1 ? ' día hábil' : ' días hábiles') }] : []),
    ]);
    const glossary = (stage) => rows('pgcm-g', [
      { termino: 'Release', definicion: 'Entrega de un conjunto de procesos completos del ERP que sale a producción; el proyecto tiene ' + word(agile.releases.length) + ': ' + relList() + '.' },
      { termino: 'Iteración', definicion: 'Periodo fijo de ' + st.sprintLength + ' días hábiles en el que el equipo Scrum construye un incremento del producto.' },
      { termino: 'Revisión de la iteración', definicion: 'Reunión en la que el equipo demuestra el incremento y el dueño del producto acepta o rechaza cada elemento.' },
      { termino: 'Retrospectiva', definicion: 'Reunión del equipo después de la revisión para mejorar su forma de trabajo.' },
      { termino: 'Tablero Kanban y límite WIP', definicion: 'Tablero con las columnas del flujo de trabajo; el límite WIP es el número máximo de elementos que puede tener una columna.' },
      { termino: 'Burndown y burnup', definicion: 'Gráficos del trabajo que falta en la iteración (burndown) y del trabajo terminado frente al alcance del release (burnup).' },
      { termino: 'AgileEVM', definicion: 'Valor ganado de un release calculado con los puntos terminados frente a su alcance y su presupuesto.' },
      { termino: 'Usuario clave', definicion: 'Representante de un área que participa en el refinamiento, las revisiones y las pruebas de aceptación.' },
      { termino: 'Salida a producción', definicion: 'Corte en el que un release empieza a usarse en la operación con los datos migrados.' },
      { termino: 'Estabilización (hypercare)', definicion: 'Acompañamiento intensivo del implementador después de la última salida, antes de pasar al soporte de TI.' },
      { termino: 'Proveedor tecnológico', definicion: 'Empresa autorizada por la DIAN que valida y transmite las facturas electrónicas.' },
      { termino: 'Carril de urgencia', definicion: 'Fila del tablero para las fallas críticas de producción, que pueden superar el límite WIP una vez por iteración (plan de gestión de cambios).' },
      ...(stage >= 1 ? [
        { termino: 'Defecto de producción', definicion: 'Falla del ERP que aparece en la operación después de una salida; se reporta en la mesa de ayuda de TI y se atiende como soporte, sin release.' },
      ] : []),
    ]);
    function lcFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
    const planFields = (stage) => ({
      requisitos: 'Gerencia General: estado general, decisiones requeridas, uso de las reservas y riesgos altos cada quincena, en una página y con semáforo. Dueño del producto: avance de cada release, velocidad, pronóstico y retroalimentación de los usuarios clave en cada iteración. Usuarios clave y jefes de área: qué se demuestra en cada revisión, qué cambia en su proceso y cuándo sale a producción cada release. Personal de bodega y conductores: instrucciones prácticas en carteleras y en la capacitación por grupos en la bodega, no por correo. Contabilidad y revisoría fiscal: soportes de la conciliación de los saldos migrados antes de cada corte. Implementador, fabricante y proveedor tecnológico: alcance de cada iteración, aceptación oportuna, incidentes y comunicaciones formales con consecutivo. El equipo Scrum se comunica con el tablero, los eventos de Scrum y las métricas, que tienen sus propias actas; este plan se centra en los interesados que no asisten a esos eventos.' +
        (stage >= 1 ? ' Desde la salida a producción del ' + relShort('rel-1').toLowerCase() + ' (' + dl(GOLIVE1) + '), las bodegas, logística y facturación necesitan un canal único para reportar defectos de producción, con respuesta el mismo día cuando impiden facturar o despachar.' : '') +
        ' Idioma: español; fechas en formato largo; valores en pesos colombianos sin decimales.',
      confidencialidad: 'Los valores de los contratos, las tarifas del implementador, los costos reales y las reservas solo se comparten con la Gerencia General, el dueño del producto, el director de proyecto, el contador y el comité de control de cambios. Los datos de clientes y obras que se usan en el ambiente de pruebas (NIT, cartera, contactos) solo los usan el equipo Scrum y los usuarios clave, según las cláusulas de confidencialidad de los contratos. Las comunicaciones formales con proveedores las autoriza el director de proyecto y las que comprometen a la empresa las firma la Gerencia General.',
      matriz: MATRIX(stage),
      tecnologias: 'Correo corporativo para las comunicaciones formales; videoconferencia para las reuniones con el implementador, el fabricante y el proveedor tecnológico; el gestor de proyectos para los documentos, el backlog, el tablero Kanban, las métricas ágiles y el registro de comunicaciones; carteleras en las bodegas principal y de Funza.' +
        (stage >= 1 ? ' Mesa de ayuda de TI para los defectos de producción.' : '') +
        ' El grupo de mensajería del equipo es solo para coordinación operativa: las decisiones se formalizan en acta o por correo.',
      recursos: 'Las comunicaciones no tienen presupuesto propio. El tiempo del director de proyecto (' + cat('dir').dedication + ' % de dedicación) para informes, comités y reuniones con proveedores está en «' + task('t04').name.replace(/ \(esfuerzo de nivel\)/, '') + '» (EDT ' + wcode(task('t04').wbsId) + ', ' + ms(task('t04').cost) + ') y el del Scrum Master (' + cat('sm').dedication + ' %) para los eventos, en «' + task('t35').name.replace(/ \(esfuerzo de nivel\)/, '') + '» (' + ms(task('t35').cost) + '). Este plan y la red de usuarios clave se elaboraron con el consultor de gestión del cambio en «' + task('t20').name + '» (EDT ' + wcode(task('t20').wbsId) + ', ' + ms(task('t20').cost) + '); la capacitación por release está en la EDT ' + wcode('w53') + ' (' + ms(['t22', 't23', 't24'].reduce((s, id) => s + task(id).cost, 0)) + ').',
      restricciones: 'Ninguna salida a producción durante los cinco primeros días hábiles del mes (cierre mensual) ni durante el cierre anual: el ' + relShort('rel-3').toLowerCase() + ' sale el ' + dl(R3_GO) + ', después del cierre anual. Las capacitaciones de facturación, cartera y contabilidad tampoco se programan en los días de cierre. El dueño del producto dedica al menos dos horas diarias al proyecto y los usuarios clave asisten al refinamiento y a las revisiones: las reuniones con ellos se agrupan en esos eventos. ' +
        (stage >= 1
          ? 'El personal de bodega y los conductores no trabajan con correo corporativo y en las obras la señal falla: los avisos para ellos van en cartelera, en la reunión semanal de bodega y en la capacitación por grupos.'
          : 'El personal de bodega y los conductores no trabajan con correo corporativo y la red inalámbrica de los patios se instala hasta el ' + dl(lbT('t14').finish) + ' (EDT ' + wcode(task('t14').wbsId) + '): los avisos para ellos van en cartelera, en la reunión semanal de bodega y en la capacitación por grupos.') +
        ' Los datos personales de clientes, contactos y empleados se tratan según la Ley 1581 de 2012.',
      escalamiento: escalation(stage),
      flujoInformacion: 'El equipo Scrum actualiza cada día el tablero y el backlog → el Scrum Master consolida la velocidad, el burndown y los impedimentos → el director calcula el valor ganado del proyecto sobre la LB0 y el AgileEVM de cada release, y actualiza riesgos, incidentes y cambios → el comité quincenal decide el jueves anterior al corte → el informe quincenal del viernes recoge sus decisiones y llega a la Gerencia General, al dueño del producto y al comité de control de cambios. Las necesidades de las áreas entran por los usuarios clave al refinamiento con el dueño del producto. Las comunicaciones formales con proveedores y entes externos entran y salen por el director y quedan en el registro de comunicaciones con su consecutivo.' +
        (stage >= 1 ? ' Desde la salida del ' + relShort('rel-1').toLowerCase() + ', los defectos de producción entran por la mesa de ayuda de TI: el jefe de TI los clasifica y el dueño del producto los ordena en el backlog como soporte (sin release) o, si son críticos, por el carril de urgencia.' : ''),
      actualizacion: 'El director revisa el plan al cerrar cada release, cuando cambia un interesado clave o un canal y cuando una retrospectiva o el comité quincenal detectan una falla de comunicación. Cada revisión la revisa el dueño del producto y la aprueba la Gerencia General; se informa en el comité quincenal y el registro de interesados se actualiza al mismo tiempo.',
      glosario: glossary(stage),
    });

    /* ============================================================ 10.2 · ACTAS DE REUNIÓN
       Seis sesiones con decisiones: arranque, comité de selección, aprobación de la LB0, CC-001, salida del release 1 y el
       comité quincenal de octubre. Los eventos de Scrum tienen sus propias actas (95). Los compromisos vencidos a la fecha
       del acta (su aprobación) figuran cumplidos; los demás, pendientes, y se verifican en la siguiente acta. */
    const att = (rol, organizacion, asistencia) => ({ rol, organizacion: organizacion || EMP, asistencia: asistencia || 'Asistió' });
    const ORG = { imp: cat('cf').supplier || 'Socio implementador', csel: cat('csel').supplier || 'Consultor independiente', cgc: cat('cgc').supplier || 'Consultor independiente' };
    const LUGAR = 'Sala de juntas de la sede administrativa, Bogotá D.C.';
    const LUGAR_MIX = LUGAR + ', con videoconferencia para el implementador';
    const acta = (o) => {
      const docDate = o.status === 'revision' ? o.fecha : approvalOf(o.fecha);
      const comp = o.compromisos.map((c) => ({ ...c, estado: c.fecha <= docDate ? 'Cumplido' : 'Pendiente' }));
      return { ...o, docDate, compromisos: comp };
    };
    const lb0Rel = planRel0.releases;
    const rr0 = riesgosRev('0');
    /* criterios de la evaluación ponderada: los del documento «Criterios de selección y evaluación de ofertas» (módulo de
       adquisiciones, si está cargado); sin él, los mismos cinco por su nombre corto */
    const SEL = PM.exampleDocs && PM.exampleDocs.erpAdquisiciones && PM.exampleDocs.erpAdquisiciones.SUP && Array.isArray(PM.exampleDocs.erpAdquisiciones.SUP.criterios) ? PM.exampleDocs.erpAdquisiciones.SUP.criterios.map((c) => lcFirst(c.criterio)) : null;
    const selCriteria = (SEL && SEL.length ? SEL : ['funcionalidad en los guiones de negocio', 'costo total a tres años', 'experiencia y referencias del implementador', 'trabajo por iteraciones y estabilidad del equipo', 'soporte y nivel de servicio']).join('; ');
    const comiteLb0Next = nextComite(LB0);
    /* sesión ordinaria del comité después de la salida del release 1: aprobó la rev. 2 del plan de releases (95) y, con el módulo
       de integración, la del plan para la dirección; sus acuerdos van en el informe quincenal siguiente (sin acta propia) */
    const prelRev2 = (base['plan-release'].revs || []).find((r) => r.rev === '2');
    const SESSION_SEP = prelRev2 && prelRev2.date === nextComite(GOLIVE1) && cuts.includes(D.add(prelRev2.date, 1)) ? prelRev2.date : null;
    const withPlanDir = !!(PM.exampleDocs && PM.exampleDocs.erpIntegracion);
    const MEETINGS = [
      acta({
        key: 'arranque', tipoReunion: 'Reunión de arranque (kick-off)', fecha: KICKOFF, horaInicio: '08:00', horaFin: '11:00', lugar: LUGAR, modalidad: 'Presencial', convoca: R.pat,
        titulo: 'Reunión de arranque del proyecto', asunto: 'Acta de la reunión de arranque del proyecto',
        objetivo: 'Presentar el acta de constitución a las áreas, designar los usuarios clave, acordar la agenda de los talleres de descubrimiento y el calendario de la selección del ERP, e instalar el comité quincenal de seguimiento.',
        asistentes: [att(R.pat), att(R.dir), att(ROLE.po), att('Gerente comercial'), att('Coordinador logístico'), att('Jefe de almacén'), att('Jefe de facturación y cartera'), att('Jefe de mantenimiento', null, 'Excusado'), att(R.jti), att('Contador'), att(R.csel, ORG.csel)],
        agenda: ['Acta de constitución: propósito, objetivos, alcance y presupuesto preliminar', 'Enfoque: selección y preparación predictivas; tres releases ágiles', 'Roles: patrocinador, director de proyecto, dueño del producto y usuarios clave', 'Talleres de descubrimiento por área', 'Calendario de la selección del ERP y del socio implementador', 'Comité quincenal de seguimiento y canales de comunicación', 'Riesgos iniciales', 'Compromisos y varios'],
        desarrollo: [
          '1. La Gerencia General presentó el acta de constitución aprobada el ' + dl(F.start) + ': presupuesto preliminar de orden de magnitud de ' + ms(acta0.presupuesto) + ' con recursos propios. Hitos: ' + andList(acta0.hitos.map((h) => lcFirst(h.hito) + ' el ' + dl(h.fecha))) + '.',
          '2. El director explicó el enfoque: la selección, la infraestructura, la migración de datos y la capacitación se planifican de forma predictiva; el ERP se entrega en ' + word(agile.releases.length) + ' releases (' + relList() + ') con iteraciones de ' + st.sprintLength + ' días hábiles.',
          '3. Roles: el gerente administrativo y financiero es el dueño del producto; cada área designa un usuario clave (' + word(ucCount) + ' en total) para los talleres, las demostraciones y, después, el refinamiento y las revisiones.',
          '4. El consultor de selección conducirá los talleres de descubrimiento con comercial, logística, almacén, mantenimiento, facturación, cartera y contabilidad hasta el ' + dlShort(lbT('t07').finish) + '; la solicitud de propuestas sale el ' + dlShort(lbT('t08').start) + ', las demostraciones guiadas y la evaluación terminan el ' + dlShort(lbT('t09').finish) + ' y los contratos se firman el ' + dl(lbT('t11').start) + '.',
          '5. Se acordó un comité quincenal de seguimiento y un comité de selección para evaluar las propuestas. El jefe de mantenimiento se excusó: designa su usuario clave por correo.',
          '6. Riesgos iniciales: calidad de los datos maestros, disponibilidad de los usuarios clave por su operación diaria e integración con la DIAN.',
        ].join('\n'),
        decisiones: [
          { decision: 'Designar un usuario clave por área (comercial, logística, almacén, mantenimiento, facturación y cartera) con tiempo para los talleres de descubrimiento y las demostraciones.', tema: 'Usuarios clave', aprobadaPor: R.pat },
          { decision: 'Hacer los talleres de descubrimiento por área hasta el ' + dl(lbT('t07').finish) + '.', tema: 'Descubrimiento', aprobadaPor: R.dir + ' y dueño del producto' },
          { decision: 'Instalar el comité quincenal de seguimiento (Gerencia General, director, dueño del producto y jefe de TI; gerente comercial y contador como invitados), jueves de por medio de ' + MEET.comiteHours[0] + ' a ' + MEET.comiteHours[1] + '; primera sesión el ' + dl(comites[0]) + '.', tema: 'Comunicaciones', aprobadaPor: R.pat },
          { decision: 'Conformar el comité de selección (director, dueño del producto, jefe de TI y contador, con el consultor de selección como secretario técnico sin voto) para evaluar las propuestas y recomendar a la Gerencia General.', tema: 'Selección del ERP', aprobadaPor: R.pat },
        ],
        compromisos: [
          { compromiso: 'Publicar el registro de interesados con los canales de comunicación acordados.', responsable: R.dir, fecha: KICKOFF },
          { compromiso: 'Enviar a los jefes de área la agenda de los talleres de descubrimiento.', responsable: R.csel, fecha: cal.addWork(KICKOFF, 1) },
          { compromiso: 'Designar el usuario clave de mantenimiento.', responsable: 'Jefe de mantenimiento', fecha: cal.addWork(KICKOFF, 2) },
          { compromiso: 'Preparar la solicitud de propuestas con los requisitos de alto nivel del descubrimiento.', responsable: R.csel, fecha: lbT('t08').start },
          { compromiso: 'Preparar los guiones de negocio de las demostraciones (pedido, despacho, devolución, liquidación y factura).', responsable: 'Dueño del producto con los usuarios clave', fecha: lbT('t08').finish },
        ],
        proximaFecha: comites[0], proxima: 'Primera sesión del comité quincenal de seguimiento: ' + dl(comites[0]) + ' a las ' + MEET.comiteHours[0] + '.',
        titleBlock: { elaboro: R.dir, reviso: ROLE.po, aprobo: R.pat },
      }),
      acta({
        key: 'seleccion', tipoReunion: 'Reunión técnica', fecha: SELECTION, horaInicio: '14:00', horaFin: '17:30', lugar: LUGAR, modalidad: 'Presencial', convoca: R.dir,
        titulo: 'Comité de selección del ERP y del socio implementador', asunto: 'Acta del comité de selección con la recomendación a la Gerencia General',
        objetivo: 'Consolidar la evaluación ponderada de los tres finalistas después de las demostraciones guiadas y presentar a la Gerencia General la recomendación para negociar los contratos de suscripción e implementación.',
        asistentes: [att(R.dir), att(ROLE.po), att(R.jti), att('Contador'), att(R.csel, ORG.csel), att('Usuarios clave de logística, almacén, facturación y cartera (' + word(resUnits('t09', 'uc')) + ')'), att(R.pat)],
        agenda: ['Compromisos de la reunión de arranque', 'Resultado de las demostraciones guiadas con los guiones de negocio', 'Evaluación ponderada de los finalistas', 'Costo frente al presupuesto preliminar', 'Recomendación a la Gerencia General', 'Negociación, firma y notificaciones', 'Compromisos'],
        desarrollo: [
          '1. Compromisos de la reunión de arranque: cumplidos. Los talleres de descubrimiento terminaron el ' + dlShort(task('t07').actualFinish) + ', la solicitud de propuestas salió el ' + dlShort(task('t08').actualStart) + ' y los tres finalistas se invitaron el ' + dlShort(task('t08').actualFinish) + '.',
          '2. ' + cap(rangeTxt(task('t09').actualStart, task('t09').actualFinish)) + ' los tres finalistas presentaron con los mismos guiones de negocio (pedido, despacho, devolución, liquidación y factura) y con datos de la empresa, ante ' + word(resUnits('t09', 'uc')) + ' usuarios clave. Las demostraciones mostraron diferencias que las presentaciones comerciales no dejaban ver, en especial en la liquidación del alquiler desde las actas y en la forma de entrega (por fases o por iteraciones).',
          '3. El comité aplicó la evaluación ponderada del documento «Criterios de selección y evaluación de ofertas» (' + selCriteria + '); los puntajes y la matriz firmada están en ese documento.',
          '4. La oferta del finalista con mayor puntaje cabe en el presupuesto preliminar del acta de constitución (' + ms(acta0.presupuesto) + ').',
          '5. La Gerencia General recibió la recomendación y autorizó negociar desde el ' + dl(lbT('t10').start) + ' para firmar el ' + dl(lbT('t11').start) + ', con la revisión del asesor jurídico.',
        ].join('\n'),
        decisiones: [
          { decision: 'Recomendar a la Gerencia General el ERP de mercado medio en la nube del finalista con el mayor puntaje ponderado, con su socio implementador local.', tema: 'Evaluación de ofertas', aprobadaPor: 'Comité de selección' },
          { decision: 'Negociar ' + rangeTxt(lbT('t10').start, lbT('t10').finish) + ' el contrato de suscripción y el contrato de implementación por iteraciones de precio fijo.', tema: 'Negociación', aprobadaPor: R.pat },
          { decision: 'Notificar el ' + dl(lbT('t10').start) + ' la adjudicación al finalista recomendado y la no adjudicación a los otros dos.', tema: 'Comunicaciones', aprobadaPor: R.dir },
        ],
        compromisos: [
          { compromiso: 'Entregar el informe final de la evaluación con la matriz firmada por el comité de selección.', responsable: R.csel, fecha: lbT('t10').start },
          { compromiso: 'Notificar la adjudicación y la no adjudicación a los finalistas.', responsable: R.dir, fecha: lbT('t10').start },
          { compromiso: 'Revisar los contratos de suscripción e implementación antes de la firma.', responsable: R.jur, fecha: cal.addWork(lbT('t11').start, -1) },
          { compromiso: 'Preparar el aprovisionamiento de ambientes, usuarios y perfiles desde el ' + dl(lbT('t13').start) + '.', responsable: R.jti, fecha: lbT('t11').start },
        ],
        proximaFecha: nextComite(SELECTION), proxima: 'Comité quincenal de seguimiento del ' + dl(nextComite(SELECTION)) + '.',
        titleBlock: { elaboro: R.csel, reviso: ROLE.po, aprobo: R.dir },
      }),
      acta({
        key: 'lb0', tipoReunion: 'Comité de seguimiento', fecha: LB0, horaInicio: '08:00', horaFin: '10:00', lugar: LUGAR_MIX, modalidad: 'Mixta', convoca: R.dir,
        titulo: 'Comité de seguimiento: aprobación del plan para la dirección del proyecto y de la LB0', asunto: 'Acta del comité de seguimiento que aprobó el plan para la dirección del proyecto, el plan de releases y la LB0',
        objetivo: 'Aprobar el plan para la dirección del proyecto, el plan de releases y la línea base LB0 antes de la iteración 1 (sesión extraordinaria del comité quincenal).',
        asistentes: [att(R.pat), att(R.dir), att(ROLE.po), att(R.sm), att(R.jti), att('Contador'), att('Gerente de proyecto del implementador', ORG.imp), att(R.lim, ORG.imp), att(R.cgc, ORG.cgc)],
        agenda: ['Compromisos del comité de selección', 'Plan para la dirección del proyecto y planes subsidiarios', 'Plan de releases e iteraciones', 'Línea base LB0: alcance, cronograma y costos', 'Registro de riesgos y reserva para contingencias', 'Plan de gestión de las comunicaciones y calendario de reuniones', 'Inicio de la iteración 1', 'Compromisos'],
        desarrollo: [
          '1. Compromisos del comité de selección: cumplidos. Contratos firmados el ' + dl(task('t11').actualFinish) + '; ambientes, usuarios y perfiles listos el ' + dl(task('t13').actualFinish) + '; plan de gestión del cambio y red de usuarios clave terminados el ' + dl(task('t20').actualFinish) + '.',
          '2. El director presentó el plan para la dirección del proyecto: ciclo de vida adaptativo, entregables predictivos de preparación y control de cambios en dos niveles (±' + st.scopeChangeThreshold + ' % del alcance de cada release).',
          '3. Plan de releases: ' + andList(lb0Rel.map((r, i) => relShort('rel-' + (i + 1)).toLowerCase() + ' con ' + r.puntos + ' puntos del ' + dlShort(r.fechaInicio) + ' al ' + dl(r.fechaFin) + ' (' + r.iteraciones + ' iteraciones, ' + ms(r.presupuesto) + ')')) + '; velocidad supuesta de ' + planRel0.velocidadSupuesta + ' puntos por iteración.',
          '4. LB0: BAC de ' + ms(LB.cost.bac) + ' más reserva para contingencias de ' + ms(LB.cost.contingency) + ' (línea base de costos de ' + ms(LB.cost.bac + LB.cost.contingency) + ') y reserva de gestión de ' + ms(LB.cost.management) + ': presupuesto de ' + ms(LB.cost.bac + LB.cost.contingency + LB.cost.management) + '. Cronograma del ' + dl(LB.schedule.start) + ' al ' + dl(LB.schedule.finish) + '.',
          '5. Registro de riesgos (rev. 0): ' + word(rr0.length) + ' riesgos (' + andList(['Amenaza', 'Oportunidad'].map((t) => { const n = rr0.filter((r) => r.tipo === t).length; return n ? word(n).replace(/^uno$/, 'una') + (t === 'Amenaza' ? (n === 1 ? ' amenaza' : ' amenazas') : (n === 1 ? ' oportunidad' : ' oportunidades')) : ''; }).filter(Boolean)) + ') con la reserva para contingencias de ' + ms(rr0.reduce((s, r) => s + r.reserva, 0)) + ' repartida por riesgo.',
          '6. Plan de gestión de las comunicaciones: informe quincenal con corte cada dos viernes desde el ' + dl(cuts[0]) + ', comité quincenal el jueves anterior a cada corte y eventos de Scrum con sus actas.',
          '7. La iteración 1 empieza el ' + dl(it1.start) + ' con su planificación.',
        ].join('\n'),
        decisiones: [
          { decision: 'Aprobar el plan para la dirección del proyecto (rev. 0) y sus planes subsidiarios, entre ellos el plan de gestión de las comunicaciones y el plan de gestión de cambios.', tema: 'Plan para la dirección del proyecto', aprobadaPor: R.pat },
          { decision: 'Aprobar el plan de releases (rev. 0): ' + word(agile.releases.length) + ' releases y ' + sprints.length + ' iteraciones de ' + st.sprintLength + ' días hábiles; ' + relShort('rel-1').toLowerCase() + ' con ' + r1Lb0 + ' puntos de línea base.', tema: 'Plan de releases', aprobadaPor: R.pat },
          { decision: 'Establecer la línea base LB0: línea base de costos de ' + ms(LB.cost.bac + LB.cost.contingency) + ' (BAC ' + ms(LB.cost.bac) + ' y contingencia ' + ms(LB.cost.contingency) + '), reserva de gestión de ' + ms(LB.cost.management) + ' y fin el ' + dl(LB.schedule.finish) + '.', tema: 'Líneas base', aprobadaPor: R.pat },
          { decision: 'Iniciar la iteración 1 el ' + dl(it1.start) + '.', tema: 'Iteraciones', aprobadaPor: 'Dueño del producto' },
        ],
        compromisos: [
          { compromiso: 'Registrar la LB0 y las fechas de los releases y las iteraciones en el gestor.', responsable: R.sm, fecha: LB0 },
          { compromiso: 'Comunicar a las áreas el plan de releases, el calendario de reuniones y los usuarios clave de cada release.', responsable: R.dir, fecha: it1.start },
          { compromiso: 'Hacer la planificación de la iteración 1.', responsable: 'Dueño del producto y Scrum Master', fecha: it1.start },
          { compromiso: 'Formar a los usuarios clave en el ERP estándar.', responsable: R.dir, fecha: lbT('t21').finish },
          { compromiso: 'Instalar los equipos de bodega antes de la iteración 2.', responsable: R.jti, fecha: cal.addWork(sprints[1].start, -1) },
        ],
        proximaFecha: comiteLb0Next, proxima: 'Comité quincenal de seguimiento del ' + dl(comiteLb0Next) + '.',
        titleBlock: { elaboro: R.sm, reviso: R.dir, aprobo: R.pat },
      }),
      acta({
        key: 'cc001', tipoReunion: 'Comité de control de cambios', fecha: CC1, horaInicio: MEET.comiteHours[0], horaFin: MEET.comiteHours[1], lugar: LUGAR_MIX, modalidad: 'Mixta', convoca: R.dir,
        titulo: 'Comité de control de cambios: solicitud de cambio CC-001', asunto: 'Acta del comité de control de cambios que decidió la solicitud de cambio CC-001',
        objetivo: 'Decidir en la sesión del comité quincenal la solicitud de cambio CC-001 (integración con las básculas de despacho en el ' + relShort('rel-1').toLowerCase() + '), que supera el umbral de ±' + st.scopeChangeThreshold + ' % del alcance del release (nivel 2).',
        asistentes: [att(R.dir), att(ROLE.po), att(R.pat), att(R.jti), att(R.lim, ORG.imp), att(R.sm), att('Coordinador logístico (solicitante, invitado)')],
        agenda: ['Compromisos del comité del ' + dl(LB0), 'Avance del ' + relShort('rel-1').toLowerCase() + ' y velocidad de las iteraciones 1 y 2', 'Solicitud de cambio CC-001: impacto y alternativas', 'Decisión y línea base del ' + relShort('rel-1').toLowerCase(), 'Riesgos: depuración de datos maestros (R-001)', 'Compromisos'],
        desarrollo: [
          '1. Compromisos del comité del ' + dl(LB0) + ': cumplidos. La iteración 1 empezó el ' + dl(it1.start) + ', los usuarios clave se formaron ' + rangeTxt(task('t21').actualStart, task('t21').actualFinish) + ' y los equipos de bodega quedaron instalados el ' + dl(task('t14').actualFinish) + ', con las tabletas dos días hábiles tarde (INC-001).',
          '2. ' + relShort('rel-1') + ': ' + r1atReq.done + ' de ' + r1before.total + ' puntos terminados después de dos iteraciones, con velocidades de ' + andList(velReq.rows.filter((r) => r.status === 'cerrado').map((r) => String(r.completed))) + ' puntos.',
          '3. CC-001: el coordinador logístico pidió el ' + dl(CC1_REQ) + ' integrar las básculas de despacho para no contar pieza a pieza cada devolución. Con las básculas el alcance del release pasaría de ' + r1before.total + ' a ' + R1.baseline.points + ' puntos: ' + signedPct(cc1Pct) + ' frente a los ' + r1Lb0 + ' de su línea base, por encima del umbral. Faltarían ' + remainingReq + ' puntos para las iteraciones 3 y 4 (' + n1(remainingReq / 2) + ' por iteración). Alternativas: ' + andList(solicitud.alternativas.map((a) => a.alternativa.replace(/^([A-C])\. (.)/, (m0, l, c) => l + ') ' + c.toLowerCase()) + (a.costo ? ' (' + ms(a.costo) + ' y ' + a.dias + ' días hábiles más)' : ' (sin costo)'))) + '.',
          '4. Riesgo R-001: la depuración de datos maestros termina ' + word(t16Late) + ' días hábiles después de lo previsto en la LB0 porque el ' + sinPeso + ' % de las referencias no tenía peso unitario y había clientes duplicados; el peso unitario es la base del peso teórico de la remisión.',
        ].join('\n'),
        decisiones: [
          { decision: 'Aprobar el CC-001 con la alternativa A: la línea base del ' + relShort('rel-1').toLowerCase() + ' pasa de ' + r1Lb0 + ' a ' + R1.baseline.points + ' puntos, sin cambiar su fecha de fin (' + dl(R1.baseline.end) + ') ni su presupuesto (' + ms(R1.baseline.budget) + ').', tema: 'Solicitud de cambio CC-001', aprobadaPor: ROLE.ccb },
          { decision: 'Si al cerrar la iteración 3 el pronóstico mueve el fin del release, el dueño del producto difiere elementos «Debería tener» al ' + relShort('rel-2').toLowerCase() + ' (nivel 1).', tema: 'Solicitud de cambio CC-001', aprobadaPor: ROLE.ccb },
          { decision: 'Aprobar la revisión 1 del plan de releases y del plan para la dirección del proyecto con el CC-001: línea base del ' + relShort('rel-1').toLowerCase() + ' en ' + R1.baseline.points + ' puntos; la línea base del proyecto (LB0) no cambia.', tema: 'Líneas base', aprobadaPor: R.pat },
        ],
        compromisos: [
          { compromiso: 'Actualizar la línea base del ' + relShort('rel-1').toLowerCase() + ' en «Releases e iteraciones» con la referencia CC-001.', responsable: R.sm, fecha: CC1 },
          { compromiso: 'Comunicar la decisión al solicitante, al equipo Scrum y al implementador.', responsable: R.dir, fecha: CC1 },
          { compromiso: 'Emitir en el gestor la revisión 1 del plan de releases y del plan para la dirección del proyecto.', responsable: 'Dueño del producto y ' + lcFirst(R.dir), fecha: CC1 },
          { compromiso: 'Reevaluar el registro de riesgos con el CC-001 y la depuración de datos maestros.', responsable: R.dir, fecha: riskRev1Date },
          { compromiso: 'Coordinar con el proveedor de las básculas la configuración de su salida de datos.', responsable: R.di, fecha: sprints[2].end },
          { compromiso: 'Incluir HU-038, HU-039 y HU-040 en la planificación de la iteración 4.', responsable: 'Dueño del producto', fecha: sprints[3].start },
        ],
        proximaFecha: nextComite(CC1), proxima: 'Comité quincenal de seguimiento del ' + dl(nextComite(CC1)) + '.',
        titleBlock: { elaboro: R.sm, reviso: ROLE.po, aprobo: R.dir },
      }),
      acta({
        key: 'salida-r1', tipoReunion: 'Comité de control de cambios', fecha: GO_CCB, horaInicio: '16:00', horaFin: '17:30', lugar: LUGAR_MIX, modalidad: 'Mixta', convoca: R.dir,
        titulo: 'Comité de control de cambios: salida a producción del ' + relShort('rel-1').toLowerCase(), asunto: 'Acta del comité de control de cambios que autorizó la salida a producción del ' + relShort('rel-1').toLowerCase(),
        objetivo: 'Autorizar la salida a producción del ' + relShort('rel-1').toLowerCase() + ' el ' + dl(GOLIVE1) + ', después de la revisión de la iteración 4.',
        asistentes: [att(R.dir), att(ROLE.po), att(R.pat), att(R.jti), att(R.lim, ORG.imp), att(R.sm), att('Contador'), att('Jefe de almacén (invitado)'), att('Coordinador logístico (invitado)')],
        agenda: ['Compromisos del comité del ' + dl(CC1), relShort('rel-1') + ': aceptación y prueba de aceptación', 'Migración del inventario de la bodega principal', 'Capacitación de los usuarios finales', 'Plan de corte y plan de reversión', 'Riesgos de la salida: cierre mensual y adopción en las bodegas', 'Decisión de salida a producción y comunicaciones'],
        desarrollo: [
          '1. Compromisos del comité del ' + dl(CC1) + ': cumplidos. La línea base del release quedó en ' + R1.baseline.points + ' puntos con la referencia CC-001, el registro de riesgos se reevaluó el ' + dl(riskRev1Date) + ' y las historias de las básculas entraron a la iteración 4.',
          '2. ' + relShort('rel-1') + ': ' + s4.done + ' de ' + s4.total + ' puntos terminados en sus ' + word(r1Sprints.length) + ' iteraciones, sin diferir elementos. El dueño del producto lo aceptó en la revisión de hoy y los usuarios clave firmaron la prueba de aceptación. Quedan defectos menores para el ' + relShort('rel-2').toLowerCase() + ' (' + andList(['DF-003', 'DF-004', 'DF-005', 'DF-006', 'DF-007'].filter((c) => item(c).createdAt && item(c).createdAt <= GO_CCB)) + '), que no impiden la salida. Costo real del release: ' + ms(r1ac) + ' frente a ' + ms(R1.budget) + ' presupuestados (CPI ' + ix(r1cpi) + '), por las horas extra del ensayo de corte.',
          '3. Migración: el inventario de la bodega principal quedó conciliado con una diferencia de ' + mig + ' frente al conteo físico (meta: 0,5 % o menos); contabilidad lo entregó a la revisoría fiscal el ' + dl(cal.addWork(task('t17').actualFinish, 1)) + ' y esta dio hoy su conformidad.',
          '4. Capacitación: los usuarios finales del release se capacitaron ' + rangeTxt(task('t22').actualStart, task('t22').actualFinish) + ' en ' + groupsTxt + '.',
          '5. Plan de corte: el ensayo de carga del inventario migrado (TA-008) terminó el ' + dl(item('TA-008').doneDate) + '; el plan de reversión se probó en el ambiente de pruebas.',
          '6. Riesgos: la salida del ' + dl(GOLIVE1) + ' queda después del cierre mensual de septiembre (' + rangeTxt(closingDays(GOLIVE1)[0], closingDays(GOLIVE1)[4]) + ', R-006). Para la adopción en las bodegas (R-003) el jefe de almacén pidió acompañamiento en sitio durante las dos primeras semanas.',
        ].join('\n'),
        decisiones: [
          { decision: 'Autorizar la salida a producción del ' + relShort('rel-1').toLowerCase() + ' el ' + dl(GOLIVE1) + ' con el plan de corte ensayado y el plan de reversión probado.', tema: 'Salida a producción', aprobadaPor: ROLE.ccb },
          { decision: 'Pasar al ' + relShort('rel-2').toLowerCase() + ' los defectos menores de la prueba de aceptación y del ensayo de corte.', tema: 'Backlog del producto', aprobadaPor: 'Dueño del producto' },
          { decision: 'Acompañar en sitio las bodegas principal y de Funza hasta el ' + dl(cal.addWork(GOLIVE1, 10)) + ' y retirar ese día los formatos en papel de remisiones y devoluciones.', tema: 'Adopción (R-003)', aprobadaPor: 'Dueño del producto y ' + lcFirst(R.dir) },
          { decision: 'No hacer la sesión ordinaria del comité quincenal del ' + dl(GOLIVE1) + ' por la salida a producción; la siguiente es el ' + dl(nextComite(GOLIVE1)) + '.', tema: 'Comunicaciones', aprobadaPor: R.dir },
        ],
        compromisos: [
          { compromiso: 'Enviar a todas las áreas el comunicado de salida a producción con el canal de soporte.', responsable: R.dir, fecha: GO_CCB },
          { compromiso: 'Ejecutar el corte y la salida a producción según el guion del ensayo.', responsable: R.jti, fecha: GOLIVE1 },
          { compromiso: 'Revisar con los usuarios de producción los permisos de bodega y logística.', responsable: R.at, fecha: GOLIVE1 },
          { compromiso: 'Actualizar el plan de gestión de las comunicaciones y el registro de interesados después de la salida.', responsable: R.dir, fecha: PLAN_REV1 },
          { compromiso: 'Acompañar en sitio a las bodegas principal y de Funza.', responsable: 'Usuarios clave de almacén y logística', fecha: cal.addWork(GOLIVE1, 10) },
        ],
        proximaFecha: nextComite(GOLIVE1), proxima: 'Comité quincenal de seguimiento del ' + dl(nextComite(GOLIVE1)) + '.',
        titleBlock: { elaboro: R.sm, reviso: ROLE.po, aprobo: R.dir },
      }),
      acta({
        key: 'comite-' + COMITE_OCT, tipoReunion: 'Comité de seguimiento', fecha: COMITE_OCT, horaInicio: MEET.comiteHours[0], horaFin: MEET.comiteHours[1], lugar: LUGAR_MIX, modalidad: 'Mixta', convoca: R.dir, status: 'revision',
        titulo: 'Comité quincenal de seguimiento del ' + dl(COMITE_OCT), asunto: 'Acta del comité quincenal de seguimiento del ' + dlShort(COMITE_OCT) + ', enviada para observaciones',
        objetivo: 'Revisar el ' + relShort('rel-2').toLowerCase() + ' después de la revisión de la iteración 6, reevaluar los riesgos con la velocidad real y hacer seguimiento a los incidentes abiertos con el proveedor tecnológico y con contabilidad.',
        asistentes: [att(R.pat), att(R.dir), att(ROLE.po), att(R.sm), att(R.jti), att(R.lim, ORG.imp), att('Contador'), att('Gerente comercial (invitado)', null, 'Excusado')],
        agenda: ['Compromisos del comité de control de cambios del ' + dl(GO_CCB), relShort('rel-2') + ': resultado de la iteración 6 y pronóstico', 'Riesgos: nuevo R-008 y reserva para contingencias', 'Incidentes: INC-002 (proveedor tecnológico) e INC-003 (auxiliar de cartera)', 'Cambios: alcance del ' + relShort('rel-2').toLowerCase() + ' dentro del umbral', 'Capacitación del ' + relShort('rel-2').toLowerCase(), 'Compromisos'],
        desarrollo: [
          '1. Compromisos del ' + dl(GO_CCB) + ': cumplidos. El ' + relShort('rel-1').toLowerCase() + ' salió a producción el ' + dl(GOLIVE1) + ' en un día y sin reversión; el acompañamiento en sitio terminó el ' + dl(cal.addWork(GOLIVE1, 10)) + '; el plan de gestión de las comunicaciones (rev. 1) y el registro de interesados (rev. 2) se actualizaron el ' + dl(PLAN_REV1) + '. Ese día, en la revisión al cierre del ' + relShort('rel-1').toLowerCase() + ', la Gerencia General confirmó el caso de negocio y la continuidad de los releases 2 y 3.' +
            (SESSION_SEP ? ' En la sesión ordinaria del ' + dl(SESSION_SEP) + ', la Gerencia General aprobó la revisión 2 del plan de releases' + (withPlanDir ? ' y del plan para la dirección del proyecto' : '') + ', con la línea base del ' + relShort('rel-2').toLowerCase() + '; sus acuerdos quedaron en el informe quincenal n.º ' + (cuts.indexOf(D.add(SESSION_SEP, 1)) + 1) + '.' : ''),
          '2. ' + relShort('rel-2') + ': ' + r2at6.done + ' de ' + r2at6.total + ' puntos terminados (' + pc(r2at6.pct) + ') después de 2 de sus ' + r2Sprints.length + ' iteraciones; la iteración 6 terminó ' + vel6.rows.find((r) => r.id === it6.id).completed + ' de ' + it6.committed + ' puntos porque HU-033 se rechazó en la revisión. Velocidad promedio de las tres últimas iteraciones: ' + n1(vel6.avg3) + ' puntos; con la velocidad del release (' + nm(fc6.velocity) + ' puntos por iteración) el pronóstico termina el ' + dl(fc6.finish) + ', después del ' + dl(R2.end) + '. Costo real del release al cierre de la iteración 6: ' + ms(r2ac6) + '.',
          '3. Cambios: el alcance del release pasó de ' + R2.baseline.points + ' a ' + r2at6.total + ' puntos (' + signedPct((r2at6.total - R2.baseline.points) / R2.baseline.points) + ') con HU-041 y ME-009, dentro del umbral de ±' + st.scopeChangeThreshold + ' %: lo decide el dueño del producto (nivel 1).',
          '4. Riesgos: se registra R-008 (velocidad insuficiente para el ' + relShort('rel-2').toLowerCase() + ') con una reserva de ' + andList(reserveDiff.added.map((r) => ms(r.reserva))) + ' y se ajustan las de ' + andList(reserveDiff.changed.map((r) => r.id + ' (de ' + ms(reserveDiff.before[r.id]) + ' a ' + ms(r.reserva) + ')')) + '. La reserva para contingencias sigue en ' + ms(reserveDiff.total) + ' y no se ha usado.',
          '5. Incidentes: ' + incTxt('INC-002') + ' ' + incTxt('INC-003'),
          '6. Capacitación del ' + relShort('rel-2').toLowerCase() + ': ' + rangeTxt(t23.start, t23.finish) + '; ' + (() => { const x = novClose.filter((d) => t23Days.includes(d)); return x.length ? rangeTxt(x[0], x[x.length - 1]) + ' coincide con el cierre mensual (' + rangeTxt(novClose[0], novClose[novClose.length - 1]) + ').' : 'no coincide con el cierre mensual (' + rangeTxt(novClose[0], novClose[novClose.length - 1]) + ').'; })(),
          '7. El informe quincenal n.º ' + nInf + ' (corte del ' + dl(lastCut) + ') recogerá estas decisiones con el valor ganado al corte.',
        ].join('\n'),
        decisiones: [
          { decision: 'Aprobar la revisión 2 del registro de riesgos: R-008 con su reserva y redistribución de la reserva para contingencias sin aumentar su total (' + ms(reserveDiff.total) + ').', tema: 'Riesgos', aprobadaPor: R.pat },
          { decision: 'El dueño del producto decide el ' + dl(R008Date()) + ', en el refinamiento, entre diferir ME-005 y ME-006 (' + (item('ME-005').estimate + item('ME-006').estimate) + ' puntos «Podría tener») al ' + relShort('rel-3').toLowerCase() + ' (nivel 1) o tramitar una solicitud de cambio para mover la fecha del ' + relShort('rel-2').toLowerCase() + ' (nivel 2, en sesión extraordinaria del comité de control de cambios).', tema: 'Alcance o fecha del ' + relShort('rel-2').toLowerCase(), aprobadaPor: R.pat + ' y dueño del producto' },
          { decision: 'Enviar al proveedor tecnológico un reclamo formal por la caída del ambiente de habilitación sin aviso y pedirle aviso automático de caídas y un crédito de servicio por los dos días, según su acuerdo de nivel de servicio (INC-002).', tema: 'Incidentes', aprobadaPor: R.dir },
          { decision: 'Si el auxiliar de cartera no llega el ' + dl(INC['INC-003'].fechaObjetivo) + ', TA-011 sale de la iteración 7 y entra HU-023 (INC-003).', tema: 'Incidentes', aprobadaPor: 'Dueño del producto' },
          { decision: 'Programar las sesiones de capacitación de facturación, cartera y contabilidad del ' + relShort('rel-2').toLowerCase() + ' ' + daysTxt(t23Before) + ', antes del cierre mensual de noviembre, como prevén el plan de gestión de las comunicaciones y el plan de involucramiento de los interesados; el resto de los usuarios finales se capacita en la ventana completa.', tema: 'Capacitación', aprobadaPor: 'Dueño del producto' },
        ],
        compromisos: [
          { compromiso: 'Enviar al proveedor tecnológico el reclamo formal por la caída del ambiente de habilitación (INC-002).', responsable: R.dir, fecha: COMITE_OCT },
          ...informe.fields.proximosPasos.map((p) => ({ compromiso: p.accion, responsable: p.responsable, fecha: p.fecha })),
          { compromiso: 'Emitir el informe quincenal n.º ' + nInf + ' (corte del ' + dl(lastCut) + ').', responsable: R.dir, fecha: issueOf(lastCut) },
        ].sort((a, b) => a.fecha.localeCompare(b.fecha)),
        proximaFecha: nextComite(COMITE_OCT), proxima: 'Comité quincenal de seguimiento del ' + dl(nextComite(COMITE_OCT)) + '.',
        titleBlock: { elaboro: R.sm, reviso: ROLE.po, aprobo: R.dir },
      }),
    ];
    function resUnits(tid, key) { const a = (task(tid).resources || []).find((x) => x.resourceId === 'rec-' + key); return a ? a.units : 0; }
    function incTxt(id) {
      const r = INC[id];
      return id + ' (' + dlShort(r.fecha) + '): ' + lcFirst(r.descripcion.replace(/\.$/, '')) + '; responsable: ' + lcFirst(r.responsable) + ', fecha objetivo: ' + dl(r.fechaObjetivo) + '.';
    }
    /* decisión de alcance o fecha del release 2: la fecha del refinamiento que cita R-008 en el registro de riesgos */
    function R008Date() { const r = riesgosNow.find((x) => x.id === 'R-008'); const m = /refinamiento del (\d+) de octubre/.exec((r && r.respuesta) || ''); return m ? '2026-10-' + pad2(+m[1]) : informe.fields.proximosPasos[0].fecha; }

    /* número de cada acta (consecutivo por fecha, como el código del documento) */
    MEETINGS.forEach((m, i) => { m.numero = pad2(i + 1); m.code = docCode('acta-reunion') + '-' + m.numero; });
    const actaFields = (m) => ({
      numero: m.numero, fecha: m.fecha, horaInicio: m.horaInicio, horaFin: m.horaFin, lugar: m.lugar, modalidad: m.modalidad, tipoReunion: m.tipoReunion,
      convoca: m.convoca, objetivo: m.objetivo,
      asistentes: rows('as', m.asistentes),
      agenda: m.agenda.slice(),
      desarrollo: m.desarrollo,
      decisiones: rows('de', m.decisiones),
      compromisos: rows('co', m.compromisos),
      proximaFecha: m.proximaFecha,
      observaciones: m.proxima + ' Acta enviada a los asistentes el ' + dl(m.fecha) + '; si no hay observaciones en los dos días hábiles siguientes' + (m.status === 'revision' ? ' (hasta el ' + dl(approvalOf(m.fecha)) + ')' : '') + ', se entiende aprobada.',
    });

    /* ============================================================ 10.2 / 10.3 · REGISTRO DE COMUNICACIONES
       Solo comunicaciones formales: con terceros (soporte legal y contractual) y de gobierno del proyecto (actas de comités,
       informes quincenales, cambios, comunicados de salida y requerimientos formales entre áreas); la coordinación del equipo
       queda en el tablero y en los eventos. Fechas del cronograma, de los incidentes (95) y del calendario de este módulo. */
    const C = (o) => ({ requiereRespuesta: false, fechaRespuesta: null, referencia: '', ...o });
    const destinatarios = informe.fields.destinatarios.replace(/ y /, ', ').split(/,\s*/).map((x, i) => (i ? lcFirst(x) : x)).join('; ');
    const supplierTab = cat('tab').supplier || 'Distribuidor de equipos de cómputo';
    const supplierFe = cat('fe').supplier || 'Proveedor tecnológico de facturación electrónica';
    const inc002Days = [INC['INC-002'].fecha, cal.addWork(INC['INC-002'].fecha, 1)];
    const COMMS = [
      ...MEETINGS.map((m) => C({ fecha: m.fecha, tipo: 'Acta', asunto: m.asunto + ' (acta n.º ' + m.numero + ')', emisor: m.titleBlock.elaboro, receptores: 'Asistentes de la reunión', medio: 'Correo electrónico', referencia: m.code, acta: m })),
      C({ fecha: task('t08').actualStart, tipo: 'Correo', asunto: 'Solicitud de propuestas para la suscripción del ERP en la nube y la implementación por releases, con los requisitos de alto nivel del descubrimiento', emisor: R.dir, receptores: 'Cinco fabricantes e implementadores de ERP', medio: 'Correo electrónico', referencia: 'Enunciado del trabajo de la adquisición (SOW)', requiereRespuesta: true, fechaRespuesta: task('t08').actualFinish }),
      C({ fecha: task('t08').actualFinish, tipo: 'Correo', asunto: 'Invitación a los tres finalistas a las demostraciones guiadas con guiones de negocio (pedido, despacho, devolución, liquidación y factura) ' + rangeTxt(task('t09').actualStart, task('t09').actualFinish), emisor: R.dir, receptores: 'Tres finalistas (fabricante e implementador)', medio: 'Correo electrónico', referencia: 'Criterios de selección y evaluación de ofertas', requiereRespuesta: true, fechaRespuesta: task('t09').actualStart }),
      C({ fecha: task('t10').actualStart, tipo: 'Oficio', asunto: 'Notificación de adjudicación al fabricante del ERP y al socio implementador recomendados e inicio de la negociación de los contratos', emisor: R.pat, receptores: 'Fabricante del ERP; socio implementador', medio: 'Correo electrónico', referencia: 'Acta n.º ' + MEETINGS[1].numero + ' (' + MEETINGS[1].code + ')' }),
      C({ fecha: task('t10').actualStart, tipo: 'Oficio', asunto: 'Notificación de no adjudicación a los otros dos finalistas, con el resultado de su evaluación', emisor: R.dir, receptores: 'Dos finalistas no adjudicados', medio: 'Correo electrónico', referencia: 'Criterios de selección y evaluación de ofertas' }),
      C({ fecha: task('t11').actualFinish, tipo: 'Oficio', asunto: 'Envío de los contratos de suscripción y de implementación firmados', emisor: R.pat, receptores: 'Fabricante del ERP; socio implementador', medio: 'Correo electrónico', referencia: 'Registro de contratos y acuerdos' }),
      C({ fecha: t14.actualStart, tipo: 'Oficio', asunto: 'Orden de compra de ' + word(qtyOf('tab')) + ' tabletas robustas, ' + word(qtyOf('lec')) + ' lectores de código de barras y ' + word(qtyOf('imp')) + ' impresoras de etiquetas para las bodegas', emisor: R.jti, receptores: supplierTab, medio: 'Correo electrónico', referencia: 'Registro de contratos y acuerdos' }),
      C({ fecha: it1.start, tipo: 'Comunicado', asunto: 'Plan de releases, calendario de eventos de Scrum y del comité quincenal, y usuarios clave de cada release', emisor: R.dir, receptores: 'Jefes de área; usuarios clave', medio: 'Correo electrónico', referencia: docCode('plan-gestion-comunicaciones') + ' rev. 0' }),
      C({ fecha: INC['INC-001'].fecha, tipo: 'Correo', asunto: 'Aviso del distribuidor: las tabletas robustas llegan dos días hábiles tarde por una demora en la importación', emisor: supplierTab, receptores: R.jti, medio: 'Correo electrónico', referencia: 'INC-001', requiereRespuesta: true, fechaRespuesta: INC['INC-001'].fecha }),
      C({ fecha: CC1_REQ, tipo: 'Correo', asunto: 'Solicitud de cambio CC-001: integración con las básculas de despacho en el ' + relShort('rel-1').toLowerCase(), emisor: 'Coordinador logístico', receptores: R.dir + '; comité de control de cambios', medio: 'Correo electrónico', referencia: 'CC-001', requiereRespuesta: true, fechaRespuesta: CC1 }),
      C({ fecha: CC1, tipo: 'Correo', asunto: 'Decisión del CC-001: aprobada la alternativa A (' + relShort('rel-1').toLowerCase() + ' de ' + r1Lb0 + ' a ' + R1.baseline.points + ' puntos, sin cambio de fecha ni de presupuesto)', emisor: R.dir, receptores: 'Coordinador logístico; equipo Scrum; líder del implementador', medio: 'Correo electrónico', referencia: 'CC-001' }),
      C({ fecha: task('t15').actualStart, tipo: 'Correo', asunto: 'Solicitud de las credenciales del ambiente de habilitación y del certificado de firma digital', emisor: R.jti, receptores: supplierFe, medio: 'Correo electrónico', referencia: 'Registro de contratos y acuerdos', requiereRespuesta: true, fechaRespuesta: task('t15').actualFinish }),
      C({ fecha: task('t15').actualFinish, tipo: 'Correo', asunto: 'Entrega de las credenciales del ambiente de habilitación y del certificado de firma digital', emisor: supplierFe, receptores: R.jti + '; desarrollador de integraciones', medio: 'Correo electrónico', referencia: feDoc ? 'Factura ' + feDoc : '', estado: 'Recibida' }),
      C({ fecha: cal.addWork(task('t22').actualStart, -2), tipo: 'Comunicado', asunto: 'Aviso en las carteleras: capacitación por grupos ' + rangeTxt(task('t22').actualStart, task('t22').actualFinish) + ' y salida a producción del ' + relShort('rel-1').toLowerCase() + ' el ' + dl(lbT('t29').start), emisor: 'Dueño del producto', receptores: 'Personal de bodega y conductores', medio: 'Cartelera de obra', referencia: '' }),
      C({ fecha: cal.addWork(task('t17').actualFinish, 1), tipo: 'Oficio', asunto: 'Entrega del inventario de la bodega principal conciliado (diferencia de ' + mig + ' frente al conteo físico) para revisión antes de la salida del ' + relShort('rel-1').toLowerCase(), emisor: 'Contador', receptores: 'Revisor fiscal (' + rfOrg.replace(/ \(externa\)/, '') + ')', medio: 'Correo electrónico', referencia: 'Migración del inventario (EDT ' + wcode('w42') + ')', requiereRespuesta: true, fechaRespuesta: GO_CCB }),
      C({ fecha: GO_CCB, tipo: 'Comunicado', asunto: 'Salida a producción del ' + relShort('rel-1').toLowerCase() + ' el ' + dl(GOLIVE1) + ': qué cambia en cada área, canal de soporte y retiro de los formatos en papel', emisor: R.dir, receptores: 'Todas las áreas; personal de bodega y conductores (copia en las carteleras)', medio: 'Correo electrónico', referencia: MEETINGS[4].code }),
      C({ fecha: PLAN_REV1, tipo: 'Comunicado', asunto: 'Canal de reporte de defectos de producción (mesa de ayuda de TI) y acompañamiento en sitio en las bodegas', emisor: R.jti, receptores: 'Todas las áreas; usuarios clave', medio: 'Correo electrónico', referencia: docCode('plan-gestion-comunicaciones') + ' rev. 1' }),
      /* decisión de la revisión al cierre del release 1 (día hábil siguiente a la salida): queda en la rev. 1 del caso de negocio
         (módulo de integración), que la Gerencia General comunica */
      C({ fecha: PLAN_REV1, tipo: 'Comunicado', asunto: 'Resultado de la revisión del caso de negocio al cierre del ' + relShort('rel-1').toLowerCase() + ': continúan los releases 2 y 3 y se libera el siguiente tramo del financiamiento', emisor: R.pat, receptores: R.dir + '; dueño del producto; contador', medio: 'Correo electrónico', referencia: withPlanDir ? docCode('caso-negocio') + ' rev. 1' : 'Caso de negocio, rev. 1' }),
      ...cuts.slice(0, -1).map((cut, i) => C({ fecha: issueOf(cut), tipo: 'Informe', asunto: 'Informe de desempeño del trabajo, corte del ' + dl(cut), emisor: R.dir, receptores: destinatarios, medio: 'Informe escrito', referencia: 'Informe quincenal n.º ' + (i + 1), estado: 'Enviada' })),
      C({ fecha: lastCut, tipo: 'Informe', asunto: 'Borrador del informe de desempeño del trabajo, corte del ' + dl(lastCut) + ', para revisión del dueño del producto', emisor: R.dir, receptores: 'Dueño del producto', medio: 'Repositorio de documentos', referencia: 'Informe quincenal n.º ' + nInf, requiereRespuesta: true }),
      C({ fecha: INC['INC-003'].fecha, tipo: 'Correo', asunto: 'Requerimiento del auxiliar de cartera conciliado a 30 de septiembre para migrar los saldos de cartera (TA-011 bloqueado); entrega comprometida para el ' + dl(INC['INC-003'].fechaObjetivo), emisor: 'Dueño del producto', receptores: 'Contador', medio: 'Correo electrónico', referencia: 'INC-003', requiereRespuesta: true }),
      C({ fecha: COMITE_OCT, tipo: 'Oficio', asunto: 'Reclamo por la caída del ambiente de habilitación del ' + dlShort(inc002Days[0]) + ' y el ' + dl(inc002Days[1]) + ' sin aviso al equipo, con la solicitud de aviso automático de caídas y de un crédito de servicio por los dos días', emisor: R.dir, receptores: supplierFe, medio: 'Correo electrónico', referencia: 'INC-002', requiereRespuesta: true }),
    ].filter((c) => D.valid(c.fecha) && c.fecha <= STATUS_DATE);
    COMMS.forEach((c, i) => { c.seq = i; });
    COMMS.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.seq - b.seq);
    COMMS.forEach((c, i) => { c.id = 'COM-' + String(i + 1).padStart(3, '0'); });
    /* estado de cada comunicación a una fecha (vigente o revisión anterior) */
    const commsAt = (at) => COMMS.filter((c) => c.fecha <= at).map((c) => {
      const answered = c.requiereRespuesta && c.fechaRespuesta && c.fechaRespuesta <= at;
      let estado;
      if (c.acta) estado = c.acta.status === 'revision' || c.acta.docDate > at ? 'Enviada' : 'Archivada';
      else if (c.requiereRespuesta) estado = answered ? 'Respondida' : 'Pendiente de respuesta';
      else estado = c.estado || (c.tipo === 'Comunicado' ? 'Enviada' : 'Archivada');
      return { id: c.id, fecha: c.fecha, tipo: c.tipo, asunto: c.asunto, emisor: c.emisor, receptores: c.receptores, medio: c.medio, referencia: c.referencia, requiereRespuesta: !!c.requiereRespuesta, fechaRespuesta: answered ? c.fechaRespuesta : null, estado };
    });
    const archivo = (at) => 'Se registran las comunicaciones formales del proyecto: las que van a terceros o vienen de ellos (proveedores y revisoría fiscal) y las de gobierno del proyecto (actas de los comités, informes quincenales, solicitudes y decisiones de cambio, comunicados de salida y requerimientos formales entre áreas). Se archivan en la carpeta del proyecto del repositorio de la PMO con su código COM-###: los correos en PDF con sus anexos y los oficios con la constancia de recibido. Los documentos del gestor (actas, informes, solicitudes de cambio) se citan por su código o su número. En el gestor quedan las actas de las sesiones con decisiones; los acuerdos de las sesiones ordinarias del comité quincenal quedan en el informe quincenal siguiente, y las decisiones de la revisión al cierre de cada release, en la revisión del caso de negocio y del plan de gestión de los beneficios. La coordinación del equipo Scrum no se registra aquí: queda en el tablero y en las actas de los eventos. Conservación: diez años después del cierre (artículo 28 de la Ley 962 de 2005).' +
      (at >= PLAN_REV1 ? ' Los defectos de producción se registran en la mesa de ayuda de TI, no en este registro.' : '');
    const REG_REV0 = LB0, REG_REV1 = PLAN_REV1;

    /* ============================================================ entradas por plantilla */
    const PLAN_TB = { elaboro: R.dir, reviso: ROLE.po, aprobo: R.pat };
    return {
      'plan-gestion-comunicaciones': {
        status: 'aprobado', rev: '1', date: PLAN_REV1, created: lbT('t20').start, titleBlock: PLAN_TB, fields: planFields(1),
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con el plan para la dirección del proyecto y la LB0: matriz de comunicaciones con los canales del registro de interesados, eventos de Scrum, comité quincenal, informe quincenal, acompañamiento en sitio de R-003 y escalamiento de emergencia del plan de gestión de cambios.', fields: planFields(0) },
          { rev: '1', status: 'aprobado', date: PLAN_REV1, note: 'Revisión después de la salida a producción del ' + relShort('rel-1').toLowerCase() + ': canal único de reporte de defectos de producción por la mesa de ayuda de TI (matriz, tecnologías y flujo de la información) y motivo de los avisos en cartelera para el personal de bodega y los conductores, con la red inalámbrica de las bodegas ya instalada.' },
        ],
      },
      'registro-comunicaciones': {
        /* el cajetín vigente se copia a cada revisión (94): el aprobador va aunque la vigente esté en revisión */
        status: 'revision', rev: '2A', date: STATUS_DATE, created: KICKOFF, titleBlock: { elaboro: R.sm, reviso: ROLE.po, aprobo: R.dir },
        fields: { comunicaciones: commsAt(STATUS_DATE), archivo: archivo(STATUS_DATE) },
        revs: [
          { rev: '0', status: 'aprobado', date: REG_REV0, note: 'Emisión con el plan de gestión de las comunicaciones: comunicaciones de la selección y la contratación.', fields: { comunicaciones: commsAt(REG_REV0), archivo: archivo(REG_REV0) } },
          { rev: '1', status: 'aprobado', date: REG_REV1, note: 'Actualización después de la salida a producción del ' + relShort('rel-1').toLowerCase() + '.', fields: { comunicaciones: commsAt(REG_REV1), archivo: archivo(REG_REV1) } },
        ],
      },
      'acta-reunion': {
        instances: MEETINGS.map((m) => ({
          key: m.key, title: 'Acta de reunión — ' + m.titulo, status: m.status || 'aprobado', rev: m.status === 'revision' ? 'A' : '0', date: m.docDate, created: m.fecha,
          titleBlock: m.titleBlock, fields: actaFields(m),
        })),
      },
    };
  }

  PM.exampleDocs = PM.exampleDocs || {};
  (PM.exampleDocs.erpParts = PM.exampleDocs.erpParts || []).push(part);
  /* calendario de reuniones de este módulo, para las pruebas y la documentación */
  PM.exampleDocs.erpComunicaciones = { MEET: { ...MEET, comiteHours: MEET.comiteHours.slice() } };
})();

/* ==========================================================================
   97-example-erp-docs-equipo.js — documentos del equipo del ejemplo ágil
   «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»
   (94-example-erp.js, SPEC §9.7): acta de constitución del equipo, plan de
   involucramiento de los interesados, documentos de prueba y evaluación, y
   planificación de las iteraciones 1 a 5 (las de la 6 y la 7 están en 95).
   Se registra en PM.exampleDocs.erpParts con la firma (F, ctx): F son los
   hechos que calcula 94 (computeFacts) y ctx = {R, CODE, STATUS_DATE, data}
   (schedule, wbs, costs, agile, items, baselines y resources). Las cifras salen
   de F, de ctx.data o de PM.calc / PM.agile / PM.res: elementos, compromiso,
   capacidad y velocidad de cada iteración; días-persona del catálogo de
   recursos (PM.res.teamCapacity); fechas de la LB0 y reales del cronograma;
   criterios de aceptación de la EDT y del backlog; niveles de involucramiento
   del registro de interesados de 95 (PM.exampleDocs.erp(F)) a la misma fecha.
   Enfoque (11-doc-approach): la planificación es un evento de Scrum
   (adaptativo); el acta del equipo, el plan de involucramiento y los
   documentos de prueba son de ambos enfoques y aquí siguen la práctica ágil:
   acuerdos que salen de las retrospectivas, interesados llevados a las
   revisiones y pruebas escritas por historia desde sus criterios.
   Fechas: el acta del equipo y los documentos de prueba nacen con la LB0
   (10 de julio de 2026) y la definición de terminado; ambos cambian con la
   retrospectiva de la iteración 3 (26 de agosto). El plan de involucramiento
   se revisa con el registro de interesados después de la salida del release 1.
   Los documentos de prueba son un registro vivo: revisión en curso al corte.
   Una planificación se aprueba el primer día de su iteración y no cita hechos
   posteriores (una incapacidad médica no se conoce al planificar).
   Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || !PM.calc || !PM.agile || !PM.date || !PM.cal || !PM.res) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const n1 = (v) => plain(PM.fmt.num(v, 1));
  const nm = (v) => plain(PM.fmt.num(v, Number.isInteger(v) ? 0 : 1));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
  const round1 = (v) => Math.round(v * 10) / 10;
  /* «del 21 al 27 de julio» o «del 27 de agosto al 7 de septiembre» */
  const range = (a, b) => { const A = dlShort(a), B = dlShort(b); const m = (x) => x.replace(/^\d+ de /, ''); return m(A) === m(B) && a.slice(0, 4) === b.slice(0, 4) ? 'del ' + A.split(' ')[0] + ' al ' + B : 'del ' + A + ' al ' + B; };
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => ({ id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const andList = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);
  const WORDS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince'];
  const word = (n) => WORDS[n] || String(n);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const lcFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  /* primer porcentaje de un texto («0,5 %», «3 %») */
  const pctIn = (txt) => { const m = /(\d+(?:,\d+)?)\s*%/.exec(plain(txt || '')); return m ? m[1] + ' %' : ''; };

  const EMP = 'Ingeniería y Alquiler S.A.S.';
  const ROLE = {
    pat: 'Gerencia General', po: 'Dueño del producto (Gerente administrativo y financiero)', pof: 'Gerente administrativo y financiero',
    ti: 'Jefe de TI', con: 'Contador', ccb: 'Comité de control de cambios',
  };
  /* duración máxima de los eventos en iteraciones de dos semanas (la Guía de Scrum 2020 fija 8, 4 y 3 horas para un mes) */
  const TIMEBOX = { planificacion: 4, revision: 2, retrospectiva: 1.5, diaria: 15 };
  /* una ausencia se conoce al planificar salvo que sea una incapacidad médica (llega sin aviso) */
  const knownAtPlanning = (a) => !/^incapacidad/i.test(String((a && a.note) || ''));

  function part(F, ctx) {
    const { R, CODE, STATUS_DATE, data } = ctx || {};
    if (!F || !R || !data || !data.schedule || !data.wbs || !data.agile || !Array.isArray(data.items) || !Array.isArray(data.baselines)) return {};
    const base = PM.exampleDocs && typeof PM.exampleDocs.erp === 'function' ? PM.exampleDocs.erp(F) : null;
    if (!base || !base['registro-interesados'] || !base['registro-riesgos'] || !base['registro-incidentes']) return {};
    const { schedule, wbs, agile, items, baselines } = data;
    const resources = data.resources || { items: [] };
    const cal = PM.cal.make(schedule.settings, F.start);
    const tree = PM.calc.wbsTree(wbs.nodes);
    const node = (id) => tree.byId.get(id) || {};
    const wcode = (id) => tree.codes.get(id) || '';
    const LB = (baselines.find((b) => b.data && b.data.number === 0) || baselines[0]).data;
    const lbT = (id) => LB.schedule.tasks.find((t) => t.id === id) || {};
    const task = (id) => schedule.tasks.find((t) => t.id === id) || {};
    const st = PM.agile.settings(agile);
    const sprints = PM.agile.sortSprints(agile.sprints);
    const sp = (id) => sprints.find((s) => s.id === id);
    const rel = (id) => agile.releases.find((r) => r.id === id);
    const relName = (id) => F.releaseNames[id];
    const relShort = (id) => relName(id).replace(/:.*/, '');
    const item = (code) => items.find((i) => i.code === code) || {};
    const TYPE_LABEL = Object.fromEntries(((PM.AGILE && PM.AGILE.ITEM_TYPES) || []).map((t) => [t.value, t.label]));
    const catItem = (key) => (resources.items || []).find((x) => x.id === 'rec-' + key) || {};
    const team = (resources.items || []).filter((x) => x.agileTeam);
    const half = team.filter((x) => Number(x.dedication) < 100);
    const equiv = team.reduce((s, x) => s + Number(x.dedication === undefined ? 100 : x.dedication) / 100, 0);
    const devs = 'Desarrolladores (' + word(team.length) + ' personas)';
    const golive = (rid) => ({ 'rel-1': 't29', 'rel-2': 't31', 'rel-3': 't33' })[rid];
    const LB0 = F.lb0Date;
    const t16 = task('t16'), t17 = task('t17'), t15 = task('t15');
    const golive1 = task('t29').actualFinish;
    const DOD_REV1 = (PM.templates['definicion-terminado'] && PM.templates['definicion-terminado'].example.fechaAcuerdo) || '2026-08-26';
    const it = (n) => sprints[n - 1];
    const R2 = rel('rel-2');
    /* «el release 2 (facturación electrónica y cartera)» e iteraciones «5 a 8» */
    const relDesc = (id) => { const [a, b] = relName(id).split(': '); return 'el ' + lcFirst(a) + ' (' + b + ')'; };
    const relIts = (id) => { const l = PM.calc.sprintsOfRelease(sprints, id).map((s) => s.name.replace('Iteración ', '')); return l[0] + ' a ' + l[l.length - 1]; };
    const holidaysIn = (s) => { const out = []; for (let d = s.start; d <= s.end; d = D.add(d, 1)) if (cal.holidayName(d)) out.push(d); return out; };
    const r003 = base['registro-riesgos'].fields.riesgos.find((r) => r.id === 'R-003') || {};
    const inc = base['registro-incidentes'].fields.incidentes;
    const incOf = (id) => inc.find((r) => r.id === id) || {};

    /* ============================================================ 9.1 · ACTA DE CONSTITUCIÓN DEL EQUIPO
       Rev. 0 con la LB0, antes de la iteración 1; rev. 1 con los acuerdos de las retrospectivas de las iteraciones 1 a 3. */
    const orgOf = (r) => (r.origin === 'Interno' ? EMP : (r.supplier || 'Socio implementador') + ' (contratista)');
    const signers = [['po', ROLE.po], ['sm', R.sm], ...team.map((x) => [x.id.replace('rec-', ''), x.name]), ['lim', R.lim]];
    const firmantes = rows('ace-f', signers.map(([key, rol]) => ({ rol, organizacion: orgOf(catItem(key)), fecha: LB0 })));
    const retros = [1, 2, 3].map((n) => it(n));
    const charter = (stage) => ({
      valores: [
        'Compromiso con el objetivo de la iteración: lo que se promete en la planificación se termina o se dice a tiempo que no se alcanza.',
        'Transparencia del tablero: el estado real de cada elemento, sus bloqueos y sus riesgos se ven en el tablero el mismo día.',
        'Respeto entre la empresa y el implementador: un solo equipo, sin «ellos» y «nosotros», que comparte el conocimiento del ERP.',
        'Calidad sin atajos en la facturación: nada que afecte una factura, un saldo o un impuesto se da por terminado sin probarlo con datos reales.',
      ],
      pautasComunicacion: 'El tablero Kanban del gestor es la fuente del estado del trabajo: cada persona actualiza sus elementos el mismo día y marca los bloqueos con su causa. Los impedimentos se dicen en la reunión diaria y el Scrum Master los escala en menos de un día hábil. Las dudas de negocio van al dueño del producto o al usuario clave que él designe; lo que se acuerda con un área queda en el elemento del backlog. El grupo de mensajería del equipo es solo para coordinación operativa: las decisiones quedan en el tablero, en un acta o por correo. Con las áreas y los proveedores se sigue el plan de gestión de las comunicaciones.',
      tomaDecisiones: 'El dueño del producto decide el orden del backlog, el alcance de cada iteración dentro del release y la aceptación de cada elemento. El equipo decide cómo hacer el trabajo, estima en puntos de historia (planning poker) y fija su compromiso en la planificación. Las decisiones técnicas se toman por consenso; si no lo hay en un día hábil, decide el ' + lcFirst(R.lim) + ' con el ' + lcFirst(ROLE.ti) + ' cuando se afectan la arquitectura, la seguridad o las integraciones. Los cambios de alcance, fecha o presupuesto de un release siguen el plan de gestión de cambios. Nadie del equipo acepta pedidos directos de las áreas: entran al backlog por el dueño del producto.',
      resolucionConflictos: 'Primero lo conversan las partes el mismo día, con esta acta como referencia. Si no se resuelve, el Scrum Master facilita una conversación al día hábil siguiente y, si toca la forma de trabajar, lo lleva a la retrospectiva. Si persiste o afecta las condiciones del contrato de implementación (personas, horas o alcance), deciden el ' + lcFirst(R.dir.replace(/ \(.*\)$/, '')) + ' y el ' + lcFirst(R.lim) + ' en máximo dos días hábiles, según lo que establece ese contrato. Los desacuerdos con las áreas usuarias los maneja el dueño del producto.',
      pautasReuniones: 'Planificación el primer día de cada iteración (máximo ' + TIMEBOX.planificacion + ' horas); reunión diaria de ' + TIMEBOX.diaria + ' minutos a las 8:15 a. m. frente al tablero, por videoconferencia los días de trabajo remoto; refinamiento semanal con el dueño del producto y los usuarios clave; revisión el último día de la iteración (' + TIMEBOX.revision + ' horas), con datos reales, y retrospectiva después de la revisión (' + n1(TIMEBOX.retrospectiva) + ' horas). Se empieza a tiempo y con el tablero actualizado; los temas largos se tratan después de la reunión diaria solo con quienes los necesitan. La reunión diaria es de los desarrolladores: cuando el Scrum Master está en el comité quincenal, la hacen sin él.',
      acuerdos: [
        'Cada historia documenta su parametrización y el ' + lcFirst(R.at) + ' participa en todas las historias, para que el conocimiento del ERP quede en la empresa (respuesta al riesgo R-005).',
        'Los límites WIP, el carril de urgencia y las demás políticas del tablero son los de la definición de listo y de terminado; esta acta no los repite.',
        ...(stage >= 1 ? [
          'No empezar una historia que no se alcance a probar antes del cierre de la iteración; el Scrum Master lo revisa en la reunión diaria (retrospectiva de la ' + lcFirst(retros[0].name) + ').',
          'Hacer la revisión de pares el mismo día en que una historia pasa a «En revisión» (retrospectiva de la ' + lcFirst(retros[1].name) + ').',
          'Probar con los datos maestros depurados de la bodega principal, no con datos inventados (retrospectiva de la ' + lcFirst(retros[1].name) + ').',
          'Las historias y mejoras pasan por «Pruebas de usuario»: el usuario clave del área las aprueba con datos reales antes de terminarlas (retrospectiva de la ' + lcFirst(retros[2].name) + ').',
        ] : []),
        'El trabajo remoto se hace en los días acordados con el Scrum Master; esos días cada persona está conectada en el horario del equipo.',
        'Nadie entra a los patios ni a las zonas de cargue de las bodegas sin la inducción de seguridad y salud en el trabajo y sin acompañante; allí se usan casco, botas y chaleco.',
      ],
      vigencia: 'Del ' + dl(LB0) + ' hasta el cierre del proyecto (' + dl(F.end) + '). Se revisa en cada retrospectiva y cuando ingresa un integrante nuevo; los cambios se emiten como nueva revisión.' + (stage >= 1 ? ' La revisión 1 recoge los acuerdos de las retrospectivas de las iteraciones 1 a 3.' : ''),
      firmantes: cp(firmantes),
    });

    /* ============================================================ 13.2 · PLAN DE INVOLUCRAMIENTO DE LOS INTERESADOS
       Rev. 0 con la LB0 (niveles del registro de interesados rev. 1) y rev. 1 del mismo día que el registro rev. 2. */
    const reg = base['registro-interesados'];
    const regRev = (r) => (reg.revs.find((x) => x.rev === r) || {}).fields;
    const regAt = { 0: regRev('1').interesados, 1: reg.fields.interesados };
    const capR2 = lbT('t23'), go2 = lbT(golive('rel-2')), go3 = lbT(golive('rel-3'));
    const paperPct = pctIn(r003.disparador);
    const STRAT = {
      'Gerencia General': (s) => ({ estrategia: 'Revisión de la iteración al cierre de cada release, consulta del tablero y las métricas ágiles e informe quincenal con las decisiones requeridas. Respalda ante las áreas cada salida a producción y la fecha de retiro de los formatos en papel.', responsable: R.dir, frecuencia: 'Quincenal' }),
      'Gerente administrativo y financiero': () => ({ estrategia: 'Mantener: ordena el backlog, preside el refinamiento y acepta cada incremento en la revisión. El Scrum Master protege sus dos horas diarias para el proyecto.', responsable: R.sm, frecuencia: 'Semanal' }),
      'Jefe de la PMO': () => ({ estrategia: 'Mantener: dirige el comité quincenal y el control de cambios en dos niveles, y recoge las lecciones para los siguientes proyectos de TI.', responsable: ROLE.pat, frecuencia: 'Quincenal' }),
      'Coordinador logístico': (s) => ({ estrategia: 'Revisiones de cada iteración del ' + relShort('rel-1').toLowerCase() + ' y pruebas de usuario de despachos y devoluciones; vocero del release ante bodega y comercial.' + (s >= 1 ? ' Después de la salida, lleva al refinamiento las mejoras de logística y prueba las del ' + relShort('rel-2').toLowerCase() + ' que tocan la remisión.' : ''), responsable: 'Dueño del producto', frecuencia: 'Quincenal' }),
      'Jefe de almacén': (s) => ({ estrategia: (s >= 1 ? 'Pasó a neutral con la salida del ' + relShort('rel-1').toLowerCase() + '. ' : '') + 'Capacitación por grupos en la bodega, acompañamiento en sitio dos semanas después de cada salida y retiro de los formatos en papel con fecha anunciada; participa en la depuración de datos y en el conteo físico, y tiene un espacio para el proyecto en la reunión semanal de bodega.', responsable: 'Dueño del producto', frecuencia: 'Semanal' }),
      'Personal de bodega y conductores': (s) => ({ estrategia: (s >= 1 ? 'Pasó a neutral con la salida del ' + relShort('rel-1').toLowerCase() + '. ' : '') + 'Capacitación por grupos en la bodega antes de cada salida, avisos en las carteleras, acompañamiento en sitio dos semanas después y retiro de los formatos en papel con fecha anunciada. Se mide cada semana el porcentaje de remisiones y devoluciones en papel (disparador del riesgo R-003: más de ' + paperPct + ').', responsable: 'Dueño del producto', frecuencia: 'Por hito' }),
      'Jefe de facturación y cartera': (s) => ({ estrategia: 'Revisiones de cada iteración del ' + relShort('rel-2').toLowerCase() + ', pruebas de usuario de facturación y cartera y vocero del release ante su área; capacitación de su equipo antes de la salida' + (s >= 1 ? ' (' + range(capR2.start, capR2.finish) + ')' : '') + '.', responsable: 'Dueño del producto', frecuencia: 'Quincenal' }),
      'Jefe de mantenimiento': (s) => ({ estrategia: 'Refinamiento de las historias del ' + relShort('rel-3').toLowerCase() + ' y validación de la plantilla de hojas de vida antes de su migración; invitado a las revisiones de las iteraciones del release.' + (s >= 1 ? ' Sus pedidos después de la salida del ' + relShort('rel-1').toLowerCase() + ' entran al backlog del release 3.' : ''), responsable: 'Dueño del producto', frecuencia: 'Por hito' }),
      'Gerente comercial': () => ({ estrategia: 'Invitado al comité quincenal; valida las listas de precios y la consulta de disponibilidad con datos reales en las revisiones; los pedidos de su área entran al backlog por el refinamiento con el dueño del producto.', responsable: R.dir, frecuencia: 'Quincenal' }),
      'Jefe de TI': () => ({ estrategia: 'Asesor técnico del comité de control de cambios y responsable de cada salida a producción y de la transferencia al soporte; aprueba los perfiles de producción.', responsable: R.dir, frecuencia: 'Quincenal' }),
      'Contador': (s) => ({ estrategia: 'Refinamiento conjunto de las historias de facturación y cartera antes de su planificación, validación de los casos tributarios dentro de la iteración y aprobación de las conciliaciones de inventario y de cartera.', responsable: 'Dueño del producto', frecuencia: 'Semanal' }),
      'Revisor fiscal': () => ({ estrategia: 'Reunión antes de cada corte con los soportes de la conciliación de los saldos migrados (inventario, cartera y hojas de vida), con el contador.', responsable: ROLE.con, frecuencia: 'Por hito' }),
      'Gerente de proyecto del implementador': () => ({ estrategia: 'Mantener: reunión semanal con el director de proyecto sobre capacidad y alcance de cada iteración, revisiones de iteración y aceptación oportuna de los incrementos.', responsable: R.dir, frecuencia: 'Semanal' }),
      'Gerente de cuenta del fabricante del ERP': () => ({ estrategia: 'Mantener: revisión trimestral del uso de la suscripción y de las funciones estándar del ERP.', responsable: ROLE.ti, frecuencia: 'Por evento' }),
      'Proveedor tecnológico de facturación electrónica': (s) => ({ estrategia: 'Reunión semanal con el desarrollador de integraciones durante el ' + relShort('rel-2').toLowerCase() + ' y casos en su mesa de ayuda con número de seguimiento; credenciales y ambiente de habilitación estables antes de cada historia de facturación.', responsable: R.di, frecuencia: 'Semanal' }),
      'DIAN': () => ({ estrategia: 'No se reúne con el proyecto: se cumple el anexo técnico vigente de la factura electrónica, se validan los documentos en el ambiente de habilitación antes de la salida del ' + relShort('rel-2').toLowerCase() + ' y el contador sigue los cambios de la normativa.', responsable: ROLE.con, frecuencia: 'Por evento' }),
    };
    const involucramiento = (stage) => rows('piin-r', regAt[stage].map((x) => {
      const f = STRAT[x.nombre];
      const s = f ? f(stage) : { estrategia: 'Revisiones de iteración y tablero.', responsable: R.dir, frecuencia: 'Quincenal' };
      return { interesado: x.nombre, nivelActual: x.nivelActual, nivelDeseado: x.nivelDeseado, estrategia: s.estrategia, responsable: s.responsable, frecuencia: s.frecuencia };
    }));
    const engagement = (stage) => ({
      involucramiento: involucramiento(stage),
      impactoCambio: 'El ERP cambia la forma de trabajar de casi todas las áreas: en bodega, las remisiones, actas y devoluciones se registran en tableta, con conteo por estado y etiquetas de código de barras; en logística, la remisión sale del pedido y la disponibilidad se consulta en línea, sin doble digitación; en facturación, la prefactura sale de las actas y la factura electrónica se emite el mismo día del corte; en cartera, los recaudos se aplican el mismo día y se bloquean los despachos a clientes en mora; en mantenimiento, cada equipo tiene hoja de vida e inspección antes del despacho; contabilidad aprueba reglas tributarias y saldos migrados, y la gerencia decide con un tablero diario. Los formatos en papel se retiran con fecha anunciada después de cada salida.' + (stage >= 1 ? ' Con el ' + relShort('rel-1').toLowerCase() + ' en producción desde el ' + dl(golive1) + ', el cambio ya llegó a bodega y logística; ahora llega a facturación, cartera y contabilidad.' : ''),
      interrelaciones: 'El personal de bodega sigue lo que hacen el jefe de almacén y el coordinador logístico: si ellos usan el ERP, la bodega lo usa. El contador y el revisor fiscal aprueban juntos las conciliaciones antes de cada salida. El proveedor tecnológico y la DIAN condicionan el ' + relShort('rel-2').toLowerCase() + ': un rechazo en habilitación afecta a facturación, cartera y contabilidad. El gerente comercial y el jefe de facturación y cartera comparten las listas de precios y la liquidación del alquiler. El implementador y el analista de TI comparten el conocimiento de la parametrización (riesgo R-005). El jefe de mantenimiento recibe las piezas «para reparación» que registra la bodega en cada devolución.',
      requisitosFase: stage >= 1
        ? 'Fase actual: ' + relDesc('rel-2') + ', iteraciones ' + relIts('rel-2') + ', y preparación del ' + relShort('rel-3').toLowerCase() + '. Facturación, cartera y contabilidad necesitan saber qué cambia en la factura y en el recaudo, el estado de las pruebas de habilitación ante la DIAN y las fechas de su capacitación (' + range(capR2.start, capR2.finish) + '), antes de la salida del ' + dl(go2.start) + '. Bodega y logística necesitan el canal de soporte de producción del release 1 y el acompañamiento en sitio; mantenimiento, el calendario de refinamiento de su release.'
        : 'Fase actual: ' + relDesc('rel-1') + ', iteraciones ' + relIts('rel-1') + ', con la depuración de los datos maestros, la formación de los usuarios clave (' + range(lbT('t21').start, lbT('t21').finish) + ') y la capacitación de los usuarios finales (' + range(lbT('t22').start, lbT('t22').finish) + ') antes de la salida del ' + dl(lbT(golive('rel-1')).start) + '. Bodega, almacén y logística necesitan saber qué cambia en su trabajo diario, cuándo los capacitan y cuándo se retiran los formatos en papel.',
      informacionDistribuir: 'Según la matriz del plan de gestión de las comunicaciones: informe quincenal de desempeño (Gerencia General, dueño del producto y comité de control de cambios), actas de revisión de cada iteración (usuarios clave), tablero Kanban y métricas ágiles (consulta abierta), carteleras y capacitación por grupos (bodega), conciliaciones firmadas (revisoría fiscal) y comunicado de cada salida a producción (todas las áreas).',
      actualizacion: 'Se actualiza al cerrar cada release, junto con el registro de interesados, y cuando un interesado cambia de actitud o aparece uno nuevo; las brechas que no se cierran en un mes se revisan en el comité quincenal. Aprueba la Gerencia General a propuesta del director de proyecto.' + (stage >= 1 ? ' Próxima revisión: al cerrar el ' + relShort('rel-2').toLowerCase() + ', antes de su salida del ' + dl(go2.start) + '.' : ''),
    });

    /* ============================================================ 8.2 · DOCUMENTOS DE PRUEBA Y EVALUACIÓN
       Rev. 0 con la LB0 y la definición de terminado; rev. 1 con la retrospectiva de la iteración 3 (prueba con datos migrados
       y columna «Pruebas de usuario»); rev. 2A al corte con los resultados del release 1 y del release 2 en curso. */
    const it4 = PM.calc.sprintsOfRelease(sprints, 'rel-1').slice(-1)[0];
    const it6 = sprints.filter((s) => s.status === 'cerrado').slice(-1)[0];
    const uatDefects = items.filter((i) => i.type === 'defecto' && /prueba de aceptación del release 1/i.test(i.description || '')).map((i) => i.code).sort();
    const cutDefects = items.filter((i) => i.type === 'defecto' && /ensayo de corte del release 1/i.test(i.description || '')).map((i) => i.code).sort();
    const hu040 = item('HU-040'), ta008 = item('TA-008'), hu032 = item('HU-032'), hu033 = item('HU-033'), me009 = item('ME-009'), ta011 = item('TA-011');
    const scalePct = pctIn(hu040.acceptance);
    const invTol = pctIn(node('w42').acceptance);
    const invResult = pctIn(t17.notes);
    const rulesN = (/Las (\d+) reglas/.exec(plain(me009.acceptance || '')) || [])[1] || '';
    const closed = sprints.filter((s) => s.status === 'cerrado');
    const acceptedCount = items.filter((i) => PM.agile.countable(i) && PM.agile.isDone(st, i) && i.doneDate && i.doneDate <= it6.end).length;
    const acceptedPts = F.velocity.rows.filter((r) => r.status === 'cerrado').reduce((s, r) => s + (r.completed || 0), 0);
    const uatPassed = items.filter((i) => (i.history || []).some((h) => h.status === 'pruebas-usuario' && h.date <= STATUS_DATE));
    const uatAccepted = uatPassed.filter((i) => PM.agile.isDone(st, i));
    const inc4 = incOf('INC-004'), inc3 = incOf('INC-003');
    const DF9 = item('DF-009');
    const wl = (id) => 'EDT ' + wcode(id) + ' ' + node(id).name;
    const PR = [
      { stage: 0, documento: 'Casos de prueba de aceptación de cada elemento (criterios Dado/Cuando/Entonces)', entregable: 'Historias, tareas, defectos y mejoras de cada iteración (releases 1 a 3)', tipo: 'Prueba de aceptación',
        criterio: () => 'Cumple todos sus criterios de aceptación con datos de prueba de la empresa; el dueño del producto lo acepta o lo rechaza en la revisión de la iteración.', responsable: R.ap, frecuencia: 'Por evento',
        evidencia: (s) => 'Casos y resultado en el elemento del backlog; acta de revisión de la iteración.' + (s >= 2 ? ' Al corte: ' + acceptedCount + ' elementos aceptados (' + acceptedPts + ' puntos) en las iteraciones ' + closed[0].name.replace('Iteración ', '') + ' a ' + it6.name.replace('Iteración ', '') + '; ' + hu033.code + ' rechazada en la revisión de la ' + lcFirst(it6.name) + '.' : '') },
      { stage: 0, documento: 'Pruebas funcionales y de regresión del proceso afectado', entregable: 'Incremento de cada iteración en el ambiente de pruebas', tipo: 'Protocolo de inspección',
        criterio: (s) => 'Pasa las pruebas funcionales y de regresión del proceso afectado en el ambiente de pruebas, sin defectos críticos ni altos abiertos.' + (s >= 1 ? ' Desde la ' + lcFirst(it4.name) + ', con los datos migrados de la bodega principal.' : ''), responsable: R.ap, frecuencia: 'Quincenal',
        evidencia: () => 'Resultado de la regresión registrado antes de la revisión de cada iteración.' },
      { stage: 0, documento: 'Prueba de aceptación del release (UAT)', entregable: 'Cada release antes de su salida a producción (EDT ' + andList(['w6', 'w7', 'w8'].map(wcode)) + ')', tipo: 'Prueba de aceptación',
        criterio: () => node('w6').acceptance + ' Los defectos que no impiden operar pasan al backlog del release siguiente.', responsable: 'Dueño del producto con los usuarios clave', frecuencia: 'Por hito',
        evidencia: (s) => 'Prueba de aceptación firmada por los usuarios clave de las áreas del release.' + (s >= 2 ? ' ' + cap(relShort('rel-1').toLowerCase()) + ': firmada el ' + dl(it4.end) + ' con ' + word(uatDefects.length) + ' defectos menores (' + andList(uatDefects) + '), que pasaron al ' + relShort('rel-2').toLowerCase() + '.' : '') },
      { stage: 0, documento: 'Ensayo de corte con los datos migrados y plan de reversión', entregable: 'Salidas a producción (' + wl('w9') + ')', tipo: 'Protocolo de inspección',
        criterio: (s) => node('w9').acceptance.split(';')[0] + '; carga completa de los saldos en el ambiente de pruebas ' + (s >= 2 ? 'una semana antes de cada salida (lección de la salida del release 1)' : 'antes de cada salida') + ', con los pasos y tiempos en el plan de corte.', responsable: R.at + ' con el ' + lcFirst(ROLE.ti), frecuencia: 'Por hito',
        evidencia: (s) => 'Plan de corte con el resultado del ensayo.' + (s >= 2 ? ' ' + cap(relShort('rel-1').toLowerCase()) + ': ' + ta008.code + ' terminada el ' + dl(ta008.doneDate) + ' con ' + invResult + ' de diferencia frente al conteo físico; salida del ' + dl(golive1) + ' en un día y sin reversión.' : '') },
      { stage: 0, documento: 'Conciliación del inventario migrado con el conteo físico', entregable: wl('w42'), tipo: 'Protocolo de inspección',
        criterio: () => node('w42').acceptance, responsable: ROLE.con + ' con el jefe de almacén', frecuencia: 'Por hito',
        evidencia: (s) => 'Conciliación firmada por contabilidad y conformidad de la revisoría fiscal.' + (s >= 2 ? ' Bodega principal: ' + invResult + ' (' + dl(t17.actualFinish) + ').' : '') },
      { stage: 0, documento: 'Conciliación de los saldos de cartera con el auxiliar contable', entregable: wl('w43'), tipo: 'Protocolo de inspección',
        criterio: () => node('w43').acceptance, responsable: ROLE.con, frecuencia: 'Por hito',
        evidencia: (s) => 'Conciliación por cliente firmada por contabilidad y conformidad de la revisoría fiscal.' + (s >= 2 ? ' Pendiente: el auxiliar de cartera conciliado no se ha entregado (' + inc3.id + ') y ' + ta011.code + ' sigue bloqueada.' : '') },
      { stage: 0, documento: 'Pruebas de habilitación de la factura electrónica con el proveedor tecnológico', entregable: wl('w7'), tipo: 'Prueba de aceptación',
        criterio: () => node('w7').acceptance + ' Facturas, notas crédito y notas débito aceptadas en el ambiente de habilitación antes de la salida.', responsable: R.di + ' con el contador', frecuencia: 'Por evento',
        evidencia: (s) => 'CUFE y respuesta de la DIAN guardados en el ERP para cada documento de prueba.' + (s >= 2 ? ' Primera factura aceptada en habilitación en la ' + lcFirst(it6.name) + ' (' + hu032.code + '); ' + hu033.code + ' rechazada en la revisión del ' + dl(it6.end) + ' porque la representación gráfica no tenía el código QR.' : '') },
      { stage: 0, documento: 'Verificación de las hojas de vida migradas', entregable: wl('w44'), tipo: 'Lista de verificación',
        criterio: () => node('w44').acceptance, responsable: 'Jefe de mantenimiento', frecuencia: 'Por hito',
        evidencia: (s) => 'Lista de los equipos serializados verificada antes de la salida del ' + relShort('rel-3').toLowerCase() + '.' + (s >= 2 ? ' Pendiente (release 3).' : '') },
      { stage: 1, documento: 'Aprobación del usuario clave en «Pruebas de usuario»', entregable: 'Historias y mejoras desde la ' + lcFirst(it4.name), tipo: 'Prueba de aceptación',
        criterio: () => 'El usuario clave del área la prueba con datos reales y la aprueba antes de pasarla a «Terminado».', responsable: 'Usuario clave del área', frecuencia: 'Por evento',
        evidencia: (s) => 'Paso por la columna «Pruebas de usuario» en el historial del elemento.' + (s >= 2 ? ' Al corte: ' + uatPassed.length + ' elementos pasaron por la columna y ' + uatAccepted.length + ' fueron aceptados; ' + hu033.code + ' la pasó y fue rechazada en la revisión por el código QR, que ahora verifica la lista de chequeo del anexo técnico.' : '') },
      { stage: 1, documento: 'Prueba de la integración con las básculas de despacho', entregable: 'Integración con las básculas (EP-008, CC-001), ' + relShort('rel-1').toLowerCase(), tipo: 'Protocolo de inspección',
        criterio: (s) => 'Peso de báscula capturado en la remisión y en la devolución, y alerta al jefe de almacén cuando la diferencia con el peso teórico supera ' + scalePct + '.' + (s >= 2 ? ' Se prueba con las básculas de las dos bodegas.' : ''), responsable: R.di, frecuencia: 'Por evento',
        evidencia: (s) => 'Remisiones y devoluciones de prueba con el peso capturado.' + (s >= 2 ? ' El ensayo de corte encontró que la báscula de Funza envía el peso con coma decimal (' + andList(cutDefects) + ', corregido en la ' + lcFirst(sp(item(cutDefects[0]).sprintId).name) + ').' : '') },
      { stage: 2, documento: 'Revisión de perfiles y permisos por rol antes de cada salida', entregable: 'Usuarios y perfiles de producción (' + wl('w31') + ')', tipo: 'Lista de verificación',
        criterio: () => 'Cada perfil se prueba con un usuario de producción: permisos mínimos y sin accesos indebidos a costos ni a facturación.', responsable: R.at, frecuencia: 'Por hito',
        evidencia: () => 'Lista por perfil firmada por el ' + lcFirst(ROLE.ti) + '; ' + relShort('rel-1').toLowerCase() + ': revisada antes de la salida (acción 2 de la retrospectiva de la ' + lcFirst(it4.name) + ').' },
      { stage: 2, documento: 'Lista de chequeo del anexo técnico vigente de la DIAN', entregable: 'Historias que generan documentos electrónicos (' + relShort('rel-2').toLowerCase() + ')', tipo: 'Lista de verificación',
        criterio: () => 'Cada documento electrónico cumple los ítems de facturación electrónica de la lista de verificación de este registro.', responsable: R.ap, frecuencia: 'Por evento',
        evidencia: () => 'Lista diligenciada en el elemento del backlog (acción 1 de la retrospectiva de la ' + lcFirst(it6.name) + '; pasa a la definición de terminado en su próxima revisión). ' + me009.code + ', en curso, agrega un caso de prueba por cada una de las ' + rulesN + ' reglas de rechazo documentadas en IN-004.' },
      { stage: 2, documento: 'Verificación en producción de las correcciones del carril de urgencia', entregable: 'Defectos críticos de producción (soporte del ' + relShort('rel-1').toLowerCase() + ')', tipo: 'Prueba de aceptación',
        criterio: () => 'La corrección pasa la regresión del proceso en el ambiente de pruebas y el usuario que reportó la falla la verifica en producción el mismo día.', responsable: ROLE.ti + ' con el usuario clave del área', frecuencia: 'Por evento',
        evidencia: () => 'Caso de la mesa de ayuda de TI cerrado con la verificación; ' + DF9.code + ' verificado en producción el ' + dl(inc4.fecha) + ' con la bodega de Funza (' + inc4.id + ').' },
    ];
    const pruebas = (stage) => rows('dpe-p', PR.filter((p) => p.stage <= stage).map((p, i) => ({
      codigo: 'PR-' + String(i + 1).padStart(2, '0'), documento: p.documento, entregable: p.entregable, tipo: p.tipo, criterio: p.criterio(stage), responsable: p.responsable, frecuencia: p.frecuencia, evidencia: p.evidencia(stage),
    })));
    const DOD = 'Definición de terminado';
    const CR = 'Criterios para liberar un release';
    const CHECK = [
      { stage: 0, item: 'Criterios de aceptación', criterio: 'Cumple todos sus criterios de aceptación y se demostró con datos de prueba de la empresa.', referencia: DOD },
      { stage: 0, item: 'Revisión de pares', criterio: 'La parametrización o el código lo revisó otro miembro del equipo y quedó en el control de versiones de configuración.', referencia: DOD },
      { stage: 0, item: 'Regresión', criterio: 'Pruebas funcionales y de regresión del proceso afectado sin defectos críticos ni altos abiertos.', referencia: DOD },
      { stage: 1, item: 'Datos migrados', criterio: 'Probado con los datos migrados de la bodega principal.', referencia: DOD + ' (rev. 1)' },
      { stage: 1, item: 'Pruebas de usuario', criterio: 'Historias y mejoras aprobadas por el usuario clave del área con datos reales.', referencia: DOD + ' (rev. 1)' },
      { stage: 0, item: 'Validación de la DIAN', criterio: 'Las facturas que genera la historia fueron validadas por la DIAN en el ambiente de habilitación.', referencia: DOD },
      { stage: 0, item: 'Documentación', criterio: 'Manual de usuario y guía rápida del rol actualizados; parametrización documentada en la historia.', referencia: DOD + ' y acta de constitución del equipo' },
      { stage: 2, item: 'Factura electrónica: adquirente', criterio: 'NIT con dígito de verificación, tipo de persona, responsabilidades fiscales y correo de facturación completos.', referencia: 'Anexo técnico de la DIAN; HU-027' },
      { stage: 2, item: 'Factura electrónica: numeración', criterio: 'Prefijo y rango de la resolución de facturación vigente para cada tipo de documento.', referencia: 'Anexo técnico de la DIAN; HU-028' },
      { stage: 2, item: 'Factura electrónica: impuestos', criterio: 'IVA y retenciones calculados según el concepto, con los casos validados por contabilidad.', referencia: 'HU-029' },
      { stage: 2, item: 'Factura electrónica: CUFE', criterio: 'CUFE generado y respuesta de la DIAN registrada en el ERP; los rechazos se muestran con su causa.', referencia: 'Anexo técnico de la DIAN; HU-032' },
      { stage: 2, item: 'Representación gráfica', criterio: 'PDF con CUFE y código QR, enviado con el XML al correo de facturación del cliente.', referencia: 'Anexo técnico de la DIAN; acción 1 de la retrospectiva de la ' + lcFirst(it6.name) },
      { stage: 0, item: 'Historias «Debe tener»', criterio: 'Todas las del release están terminadas y aceptadas.', referencia: CR },
      { stage: 0, item: 'Prueba de aceptación', criterio: 'Firmada por los usuarios clave de las áreas del release.', referencia: CR },
      { stage: 0, item: 'Migración conciliada', criterio: 'Saldos conciliados y aprobados por contabilidad y revisoría fiscal.', referencia: CR },
      { stage: 0, item: 'Capacitación y reversión', criterio: 'Usuarios capacitados y con acceso; plan de reversión probado en el ensayo de corte.', referencia: CR },
      { stage: 2, item: 'Perfiles y permisos', criterio: 'Cada perfil probado con un usuario de producción antes de la salida.', referencia: 'Acción 2 de la retrospectiva de la ' + lcFirst(it4.name) },
      { stage: 0, item: 'Fecha de salida', criterio: 'Después de los cinco primeros días hábiles del mes y autorizada por el comité de control de cambios.', referencia: CR + '; plan de gestión de cambios' },
    ];
    const lista = (stage) => rows('dpe-v', CHECK.filter((c) => c.stage <= stage).map(({ item: x, criterio, referencia }) => ({ item: x, criterio, referencia })));
    const testDoc = (stage) => ({
      pruebas: pruebas(stage),
      itemsVerificacion: lista(stage),
      aprobacionCliente: 'El proyecto es interno: no hay cliente externo ni interventoría. Valida el dueño del producto, que acepta o rechaza cada elemento en la revisión de la iteración; los usuarios clave de las áreas del release firman la prueba de aceptación antes de cada salida; contabilidad aprueba las conciliaciones de los saldos migrados y la revisoría fiscal da su conformidad antes de cada corte, y el comité de control de cambios autoriza cada salida con esa evidencia.' +
        (stage >= 2 ? ' El ' + relShort('rel-1').toLowerCase() + ' cumplió los cuatro pasos antes de su salida del ' + dl(golive1) + '; en el ' + relShort('rel-2').toLowerCase() + ' falta la conciliación de la cartera.' : ''),
      archivo: 'Casos y resultados en cada elemento del backlog del gestor (criterios e historial del tablero); actas de revisión de cada iteración; pruebas de aceptación firmadas, planes de corte y conciliaciones en el repositorio del proyecto ' + CODE + '.',
    });

    /* ============================================================ 4.3 · PLANIFICACIÓN DE LAS ITERACIONES 1 A 5
       Elementos comprometidos al iniciar: los de la iteración (sin los que entraron después por urgencia) y los que no se
       terminaron en ella (sprint.unfinished), en el orden del backlog. Velocidad de referencia: promedio de las ≤ 3 últimas
       iteraciones cerradas el día anterior al inicio (en la iteración 1, la velocidad supuesta del plan de releases).
       Días-persona: PM.res.teamCapacity con las ausencias conocidas al planificar. */
    const planRelease = PM.templates['plan-release'] ? PM.templates['plan-release'].example : {};
    const committedItems = (s) => {
      const own = items.filter((i) => PM.agile.countable(i) && i.sprintId === s.id && !(i.sprintAddedDate && i.sprintAddedDate > s.start));
      const unf = (s.unfinished || []).map((u) => items.find((i) => i.id === u.id)).filter((i) => i && !own.includes(i));
      return [...own, ...unf].sort((a, b) => a.rank - b.rank);
    };
    const asElement = (i) => ({ codigo: i.code, titulo: i.title, tipo: TYPE_LABEL[i.type] || i.type, estimacion: i.estimate, responsable: i.assignee, criterios: i.acceptance });
    const sumEst = (list) => list.reduce((s, i) => s + (Number(i.estimate) || 0), 0);
    const resKnown = { ...resources, items: (resources.items || []).map((x) => ({ ...x, absences: (x.absences || []).filter(knownAtPlanning) })) };
    const planFacts = (s) => {
      const prevEnd = D.add(s.start, -1);
      const vel = F.velocityAt(prevEnd);
      const closedRows = vel.rows.filter((r) => r.status === 'cerrado');
      const capInfo = PM.res.teamCapacity({ data: resKnown, schedule, sprint: s, cal, settings: st, velocity: vel });
      const els = committedItems(s);
      return { vel, closedRows, last3: closedRows.slice(-3), ref: closedRows.length ? round1(vel.avg3) : planRelease.velocidadSupuesta, personDays: capInfo.personDays, normal: capInfo.normal, els, total: sumEst(els), holidays: holidaysIn(s) };
    };
    const capText = (s, p) => cap(word(team.length)) + ' personas, ' + word(half.length) + ' de ellas al 50 %: ' + nm(equiv) + ' personas equivalentes × ' + st.sprintLength + ' días hábiles = ' + nm(p.normal) + ' días-persona' +
      (p.personDays === p.normal ? ', sin ausencias previstas' : ', ' + nm(p.personDays) + ' con las ausencias previstas') +
      (p.holidays.length ? ' (' + (p.holidays.length === 1 ? 'el festivo del ' + dlShort(p.holidays[0]) + ' no es día' : 'los festivos del ' + andList(p.holidays.map(dlShort)) + ' no son días') + ' de la iteración)' : '') + '.';
    const velText = (p) => (p.closedRows.length
      ? 'Velocidad de referencia: ' + n1(p.ref) + ' puntos, ' + (p.last3.length === 1 ? 'la de la ' + lcFirst(p.last3[0].name) + ', la única cerrada' : 'promedio de las iteraciones ' + andList(p.last3.map((r) => r.name.replace('Iteración ', ''))) + ' (' + andList(p.last3.map((r) => String(r.completed))) + ' puntos)') + '.'
      : 'Sin iteraciones cerradas, la velocidad de referencia es la supuesta en el plan de releases (' + nm(p.ref) + ' puntos por iteración, de una implementación similar del implementador).');
    const elList = (codes) => andList(codes.map((c) => { const x = item(c); return x.code + ' (' + x.estimate + ' ' + (x.estimate === 1 ? 'punto' : 'puntos') + ')'; }));
    const unfCodes = (s) => (s.unfinished || []).map((u) => u.code);
    const prevSprint = (s) => sprints[sprints.indexOf(s) - 1];
    const rolledFromPrev = (s) => { const pv = prevSprint(s); return pv ? unfCodes(pv).filter((c) => item(c).sprintId === s.id) : []; };

    const s1 = it(1), s2 = it(2), s3 = it(3), s4 = it(4), s5 = it(5);
    const P = Object.fromEntries([s1, s2, s3, s4, s5].map((s) => [s.id, planFacts(s)]));
    const p1 = P[s1.id], p2 = P[s2.id], p3 = P[s3.id], p4 = P[s4.id], p5 = P[s5.id];
    const PART = (extra) => [ROLE.po, R.sm, devs, ...extra];
    const lbT16 = lbT('t16');
    const delay16 = cal.countWork(lbT16.finish, t16.actualFinish) - 1;
    const basculas = items.filter((i) => i.createdAt === F.cc1Request && i.type === 'historia' && i.releaseId === 'rel-1').sort((a, b) => a.rank - b.rank).map((i) => i.code);
    const epic8 = items.find((i) => i.type === 'epica' && i.createdAt === F.cc1Request) || {};
    const deferible = ['HU-006', 'HU-014'].filter((c) => item(c).priority === 'Debería tener');
    const r2Base = R2.baseline || {};
    const it5Defects = p5.els.filter((i) => i.type === 'defecto').map((i) => i.code).sort();
    const tablets = incOf('INC-001');
    /* cifras de los criterios de aceptación del backlog: carga de prueba del catálogo y traslado de prueba */
    const refs200 = (/de (\d+) referencias/.exec(item('TA-002').acceptance || '') || [])[1] || '';
    const montantes = (/de (\d+) montantes/.exec(item('DF-001').acceptance || '') || [])[1] || '';
    const planning = {
      [s1.id]: {
        notas: capText(s1, p1) + ' ' + velText(p1) + ' El equipo fija la capacidad en ' + s1.capacity + ' puntos y compromete ' + s1.committed + ' en su primera iteración, mientras se ajusta a la estimación en puntos y a los datos que todavía se depuran.',
        riesgos: 'Dependencias: la depuración de los datos maestros (EDT ' + wcode('w41') + ') empieza hoy y entrega por lotes, así que el catálogo se prueba con las ' + refs200 + ' referencias de la carga de prueba de TA-002; la formación de los usuarios clave (' + range(lbT('t21').start, lbT('t21').finish) + ') coincide con la segunda semana de la iteración. IN-001 va primero: decide cómo se controlan la maquinaria serializada y las piezas a granel antes de construir el catálogo. Riesgos del registro: R-001 (calidad de los datos maestros) y R-002 (disponibilidad de los usuarios clave). Los equipos de bodega se instalan antes de la ' + lcFirst(s2.name) + '.',
        part: PART(['Coordinador logístico (invitado)', 'Jefe de almacén (invitado)']),
      },
      [s2.id]: {
        notas: capText(s2, p2) + ' ' + velText(p2) + ' Esa velocidad incluye el aprendizaje de la primera iteración y deja ' + andList(rolledFromPrev(s2)) + ' empezada; con ' + nm(p2.personDays) + ' días-persona y la velocidad supuesta del plan de releases (' + nm(planRelease.velocidadSupuesta) + ' puntos), el equipo fija la capacidad en ' + s2.capacity + ' puntos y compromete ' + s2.committed + '.',
        riesgos: andList(rolledFromPrev(s2)) + ' viene de la ' + lcFirst(s1.name) + ' con su estimación original y ' + elList(['DF-001']) + ' se registró hoy desde la revisión de la ' + lcFirst(s1.name) + ': se verifica con el traslado de prueba de ' + montantes + ' montantes. HU-005 y HU-008 dependen de los equipos de bodega: por el retraso de las tabletas importadas (' + tablets.id + '), el equipo cuenta también con las tabletas de prueba del implementador. HU-008 debe funcionar sin conexión en obra. Acciones de la retrospectiva de la ' + lcFirst(s1.name) + ': no empezar historias que no se alcancen a probar y criterios de despacho refinados con los usuarios clave. Riesgo del registro: R-003 (resistencia al registro en tableta en las bodegas).',
        part: PART(['Coordinador logístico (invitado)']),
      },
      [s3.id]: {
        notas: capText(s3, p3) + ' ' + velText(p3) + ' La ' + lcFirst(s2.name) + ' terminó ' + s2.completed + ' puntos con ' + nm(P[s2.id].personDays) + ' días-persona y desde esta iteración las historias se prueban con los datos maestros depurados: el equipo fija la capacidad en ' + s3.capacity + ' puntos y compromete ' + s3.committed + ', ' + (s3.committed - s3.capacity === 1 ? 'un punto' : word(s3.committed - s3.capacity) + ' puntos') + ' más que la capacidad, porque ' + elList(['HU-006']) + ' es «' + item('HU-006').priority + '» y es la primera que sale si no se alcanza.',
        riesgos: 'La solicitud de cambio de las básculas, radicada el ' + dl(F.cc1Request) + ', la decide el comité de control de cambios: sus historias (' + epic8.code + ', ' + andList(basculas) + ') no entran a esta iteración y, si se aprueban, se planifican en la ' + lcFirst(s4.name) + '. La depuración de los datos maestros termina el ' + dl(t16.actualFinish) + ', ' + word(delay16) + ' días hábiles después de lo previsto (R-001): hasta ese día las historias de devoluciones y contratos se prueban con los lotes ya depurados (acción 2 de la retrospectiva de la ' + lcFirst(s2.name) + '). TA-005 prueba la carga de saldos de la bodega de Funza con su conteo físico. Desde esta iteración, la revisión de pares se hace el mismo día en que una historia pasa a «En revisión» (acción 1 de la retrospectiva de la ' + lcFirst(s2.name) + ').',
        part: PART(['Coordinador logístico (invitado)', 'Gerente comercial (invitado)']),
      },
      [s4.id]: {
        notas: capText(s4, p4) + ' ' + velText(p4) + ' Capacidad y compromiso de ' + s4.committed + ' puntos: incluye ' + andList(rolledFromPrev(s4)) + ', que viene casi terminada de la ' + lcFirst(s3.name) + ', y las ' + word(basculas.length) + ' historias de las básculas aprobadas en el CC-001 (' + sumEst(basculas.map(item)) + ' puntos); las iteraciones ' + s2.name.replace('Iteración ', '') + ' y ' + s3.name.replace('Iteración ', '') + ' terminaron ' + (s2.completed === s3.completed ? s2.completed + ' puntos cada una' : s2.completed + ' y ' + s3.completed + ' puntos') + '.',
        riesgos: 'Última iteración del ' + relShort('rel-1').toLowerCase() + ', con salida a producción el ' + dl(lbT(golive('rel-1')).start) + '. Si no se alcanza, el dueño del producto difiere al ' + relShort('rel-2').toLowerCase() + ' ' + andList(deferible) + ' (' + sumEst(deferible.map(item)) + ' puntos, «Debería tener»), como lo prevé la condición del CC-001. El conteo físico de la bodega principal (' + range(lbT('t17').start, lbT('t17').finish) + ') y la capacitación de los usuarios finales (' + range(lbT('t22').start, lbT('t22').finish) + ') ocupan al personal de bodega y a los usuarios clave: las pruebas de usuario se acuerdan cada mañana en la reunión diaria. Es la primera iteración con la columna «Pruebas de usuario» y con la prueba con datos migrados de la definición de terminado (rev. 1). TA-008 ensaya la carga del inventario migrado antes del corte. HU-039 depende de la salida de datos de las básculas, que coordina el desarrollador de integraciones con su proveedor.',
        part: PART(['Coordinador logístico (invitado)', 'Jefe de almacén (invitado)']),
      },
      [s5.id]: {
        notas: capText(s5, p5) + ' ' + velText(p5) + ' Capacidad y compromiso de ' + s5.committed + ' puntos: la ' + lcFirst(s4.name) + ' terminó ' + s4.completed + ' con ' + nm(P[s4.id].personDays) + ' días-persona.',
        riesgos: 'Primera iteración del ' + relShort('rel-2').toLowerCase() + ': el dueño del producto compromete hoy su línea base de ' + r2Base.points + ' puntos. La salida a producción del ' + relShort('rel-1').toLowerCase() + ' es hoy, con el ' + lcFirst(R.lim) + ' y el ' + lcFirst(ROLE.ti) + ': los defectos de producción entran por el carril de urgencia sin cambiar el compromiso. La iteración incluye ' + word(it5Defects.length) + ' defectos del release 1 que no impidieron su salida (' + andList(it5Defects) + ', ' + sumEst(it5Defects.map(item)) + ' puntos). El ambiente de habilitación del proveedor tecnológico está disponible desde el ' + dl(t15.actualFinish) + ' e IN-003 va primero, antes de construir el conector (R-004). TA-010 depende del formato del archivo de recaudo que debe entregar el banco. Contabilidad valida los casos tributarios de HU-029 dentro de la iteración.',
        part: PART(['Jefe de facturación y cartera (invitado)']),
      },
    };
    const planDoc = (s) => {
      const p = P[s.id], x = planning[s.id];
      return {
        iteracion: s.name, release: relName(s.releaseId), fechaInicio: s.start, fechaFin: s.end, objetivo: s.goal,
        capacidad: s.capacity, velocidadReferencia: p.ref, compromiso: s.committed, notasCapacidad: x.notas,
        elementos: rows('el', p.els.map(asElement)), riesgos: x.riesgos, participantes: x.part,
      };
    };

    /* ============================================================ entradas por plantilla */
    const TB_TEAM = { elaboro: R.sm, reviso: 'Desarrolladores', aprobo: R.dir };
    const TB_PLAN = { elaboro: R.sm, reviso: 'Desarrolladores', aprobo: ROLE.pof };
    const retro3 = it(3).end;
    return {
      'acta-constitucion-equipo': {
        status: 'aprobado', rev: '1', date: retro3, created: lbT('t03').start, titleBlock: TB_TEAM, fields: charter(1),
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Acuerdo inicial del equipo Scrum, antes de la ' + lcFirst(s1.name) + '.', fields: charter(0) },
          { rev: '1', status: 'aprobado', date: retro3, note: 'Acuerdos de las retrospectivas de las iteraciones 1 a 3.' },
        ],
      },
      'plan-involucramiento-interesados': {
        status: 'aprobado', rev: '1', date: reg.date, created: lbT('t20').start, titleBlock: { elaboro: R.dir, reviso: ROLE.pof, aprobo: ROLE.pat }, fields: engagement(1),
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con el plan para la dirección del proyecto y el registro de interesados (rev. 1).', fields: engagement(0) },
          { rev: '1', status: 'aprobado', date: reg.date, note: 'Revisión después de la salida a producción del ' + relShort('rel-1').toLowerCase() + ', con el registro de interesados (rev. 2).' },
        ],
      },
      'documentos-prueba': {
        status: 'revision', rev: '2A', date: STATUS_DATE, created: LB0, titleBlock: { elaboro: R.ap, reviso: R.sm, aprobo: '' }, fields: testDoc(2),
        revs: [
          { rev: '0', status: 'aprobado', date: LB0, note: 'Emisión inicial con la definición de terminado (rev. 0).', fields: testDoc(0) },
          { rev: '1', status: 'aprobado', date: DOD_REV1, note: 'Retrospectiva de la iteración 3: prueba con datos migrados, columna «Pruebas de usuario» e integración con las básculas.', fields: testDoc(1) },
        ],
      },
      'planificacion-sprint': {
        instances: [s1, s2, s3, s4, s5].map((s, i) => ({
          key: 'it' + (i + 1), title: 'Planificación de la iteración — ' + s.name, status: 'aprobado', rev: '0', date: s.start, created: s.start, titleBlock: TB_PLAN, fields: planDoc(s),
        })),
      },
    };
  }

  PM.exampleDocs = PM.exampleDocs || {};
  (PM.exampleDocs.erpParts = PM.exampleDocs.erpParts || []).push(part);
  /* reglas del módulo, para las pruebas y la documentación */
  PM.exampleDocs.erpEquipo = { TIMEBOX: { ...TIMEBOX }, knownAtPlanning };
})();

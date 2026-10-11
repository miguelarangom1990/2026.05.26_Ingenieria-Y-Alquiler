/* ==========================================================================
   95-example-erp-docs.js — documentos del ejemplo «EJEMPLO · Implementación
   del ERP de Ingeniería y Alquiler» (94-example-erp.js, SPEC §9.7).
   PM.exampleDocs.erp(F) devuelve {plantilla: entrada}; F son los hechos que
   calcula el constructor con la aplicación (valor ganado del proyecto,
   AgileEVM, velocidad, avance y pronóstico de los releases, WIP, burndown e
   historia del backlog a una fecha). Toda cifra de un documento sale de F o de
   los ejemplos de las plantillas ágiles (14-templates-agile.js), que cuadran
   con los datos del ejemplo; la prueba test/example-erp.test.mjs la verifica.
   Entrada: {status, rev, date (emisión vigente), created, titleBlock, fields,
   revs:[{rev, status, date, note, fields}]}; las plantillas múltiples llevan
   {instances:[{key, title, …}]}. Los documentos aprobados no citan hechos
   posteriores a su fecha. Se usan roles, no nombres de personas.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM) return;
  const D = PM.date;

  /* textos con espacios normales (los formatos usan espacios de no separación solo para la pantalla) */
  const plain = (v) => String(v).replace(/[  ]/g, ' ');
  const ms = (v) => plain(PM.fmt.moneyShort(v, 'COP'));
  const money = (v) => plain(PM.fmt.money(v, 'COP'));
  const ix = (v) => plain(PM.fmt.idx(v));
  const pc = (x, d) => plain(PM.fmt.pct(x, d || 0));
  const n1 = (v) => plain(PM.fmt.num(v, 1));
  const nm = (v) => plain(PM.fmt.num(v, Number.isInteger(v) ? 0 : 1));
  const dl = (iso) => plain(PM.fmt.date(iso, 'long'));
  const dlShort = (iso) => dl(iso).replace(/ de 20\d\d$/, '');
  const round1 = (v) => Math.round(v * 10) / 10;
  const cp = (x) => JSON.parse(JSON.stringify(x));
  const rows = (prefix, list) => list.map((r, i) => (r.id ? { ...r } : { id: prefix + '-' + String(i + 1).padStart(2, '0'), ...r }));
  const ex = (id) => cp((PM.templates[id] && PM.templates[id].example) || {});
  const TYPE_LABEL = Object.fromEntries(((PM.AGILE && PM.AGILE.ITEM_TYPES) || []).map((t) => [t.value, t.label]));

  const ROLE = {
    pat: 'Gerencia General', dir: 'Director de proyecto (jefe de la PMO)', po: 'Dueño del producto (Gerente administrativo y financiero)',
    sm: 'Scrum Master / facilitador', ccb: 'Comité de control de cambios', ti: 'Jefe de TI', con: 'Contador', imp: 'Líder del implementador',
  };

  PM.exampleDocs = PM.exampleDocs || {};
  PM.exampleDocs.erp = function (F) {
    const E = F.evm;
    const R1 = F.releases['rel-1'], R2 = F.releases['rel-2'], R3 = F.releases['rel-3'];
    const relName = (id) => F.releaseNames[id];
    const item = (code) => F.items.find((x) => x.code === code);
    const sprint = (id) => F.sprintsList.find((s) => s.id === id);
    const lvl1 = Object.fromEntries(F.wbsLevel1.map((n) => [n.id, n]));
    const TE = F.taskEvm;
    const cv = (id) => TE[id].ev - TE[id].ac;

    /* ============================================================ 4.1 · ACTA DE CONSTITUCIÓN */
    const actaFields = {
      nombreProyecto: 'EJEMPLO · Implementación del ERP de Ingeniería y Alquiler',
      codigoProyecto: F.code,
      cliente: 'Ingeniería y Alquiler S.A.S. (proyecto interno)',
      patrocinador: ROLE.pat,
      fechaInicio: F.start,
      fechaFin: F.end,
      proposito: 'Reemplazar las hojas de cálculo y los sistemas aislados con que hoy se controlan los equipos en alquiler, las remisiones y la facturación por un ERP de mercado medio en la nube, implementado por releases con un socio implementador, para facturar el alquiler el mismo día del corte, conocer en línea la disponibilidad de cada equipo por bodega y obra, cobrar con soporte los faltantes y daños, y dar a la Gerencia General indicadores diarios de utilización, ingresos y cartera.',
      objetivos: rows('ob', [
        { dimension: 'Alcance', objetivo: 'Poner en producción los tres releases: inventario y alquiler de equipos; facturación electrónica y cartera; mantenimiento y tablero gerencial.', criterioExito: 'Historias «Debe tener» de cada release aceptadas por el dueño del producto y prueba de aceptación firmada por los usuarios clave.', evalua: 'Dueño del producto' },
        { dimension: 'Cronograma', objetivo: 'Salidas a producción el 10 de septiembre y el 10 de noviembre de 2026 y el 12 de enero de 2027; cierre el 29 de enero de 2027.', criterioExito: 'Ninguna salida se mueve más de una iteración (10 días hábiles) y ninguna cae en el cierre mensual.', evalua: ROLE.pat },
        { dimension: 'Costo', objetivo: 'Ejecutar el proyecto dentro del presupuesto aprobado de ' + ms(F.budget) + ' (reservas incluidas).', criterioExito: 'CPI acumulado de 0,95 o más en cada corte; uso de la reserva para contingencias aprobado por el comité de control de cambios.', evalua: ROLE.pat },
        { dimension: 'Calidad', objetivo: 'Facturas electrónicas validadas por la DIAN e inventario confiable.', criterioExito: 'Menos de 1 % de facturas rechazadas por la DIAN y diferencia de inventario de 0,5 % o menos en los conteos de bodega.', evalua: 'Dueño del producto' },
        { dimension: 'Satisfacción del cliente', objetivo: 'Adopción del ERP por las áreas usuarias (clientes internos).', criterioExito: '90 % de los usuarios de cada release capacitados antes de su salida y satisfacción de 4 o más sobre 5 en la encuesta posterior.', evalua: ROLE.dir },
      ]),
      descripcion: 'Implementación de un ERP de mercado medio en la nube con un socio implementador, con un enfoque adaptativo: tres releases de iteraciones de diez días hábiles (Scrum con tablero Kanban) y entregables predictivos de preparación (selección y contratación, infraestructura y licenciamiento, migración de datos, capacitación y salidas en vivo). Cubre inventario y alquiler de equipos (contratos, despachos, devoluciones y disponibilidad por bodega), facturación electrónica DIAN y cartera, mantenimiento de equipos y tablero gerencial, con estabilización (hypercare) en enero de 2027.',
      limites: 'Incluye: selección y contratación del ERP y del implementador; suscripción, ambientes y equipos de bodega; parametrización, desarrollos e integraciones de los tres releases (proveedor tecnológico de facturación electrónica y básculas); migración de datos maestros, inventario, cartera y hojas de vida; capacitación y gestión del cambio; tres salidas en vivo y la estabilización hasta el 29 de enero de 2027. No incluye: nómina y gestión humana, costeo de los proyectos de montaje, portal de autoservicio para clientes ni el soporte posterior a la estabilización (presupuesto de operación de TI).',
      entregablesClave: [
        'ERP y socio implementador seleccionados y contratados.',
        'Release 1 — inventario y alquiler de equipos — en producción.',
        'Release 2 — facturación electrónica DIAN y cartera — en producción.',
        'Release 3 — mantenimiento y tablero gerencial — en producción.',
        'Datos maestros, inventario, saldos de cartera y hojas de vida migrados y conciliados.',
        'Usuarios capacitados por release y solución estabilizada con el soporte transferido a TI.',
      ],
      requisitosAltoNivel: [
        'Facturación electrónica conforme al anexo técnico vigente de la DIAN, mediante un proveedor tecnológico autorizado.',
        'Trazabilidad de cada equipo por bodega, obra y estado, con remisiones y actas firmadas en obra desde tabletas.',
        'Liquidación del alquiler por días calendario desde las actas de entrega y devolución, con las tarifas de cada contrato.',
        'Cartera por edades con bloqueo de despachos a clientes en mora.',
        'Hojas de vida e inspección de los equipos antes de cada despacho.',
        'Ninguna salida a producción durante el cierre mensual (primeros cinco días hábiles de cada mes).',
      ],
      riesgoGeneral: 'Medio-alto. La calidad de los datos maestros, la disponibilidad de los usuarios clave y la integración con la DIAN pueden atrasar los releases 1 y 2. El enfoque por releases limita el impacto: cada release entrega un proceso completo, el alcance se controla en dos niveles y la reserva para contingencias cubre los riesgos identificados.',
      hitos: rows('hi', [
        { hito: 'Contratos de suscripción e implementación firmados', fecha: '2026-06-30', criterio: 'Contratos firmados por la Gerencia General.' },
        { hito: 'Plan de releases y línea base LB0 aprobados', fecha: F.lb0Date, criterio: 'Aprobación de la Gerencia General antes de la iteración 1.' },
        { hito: 'Release 1 en producción', fecha: '2026-09-10', criterio: 'Primera remisión emitida en producción con el inventario migrado.' },
        { hito: 'Release 2 en producción', fecha: '2026-11-10', criterio: 'Primera factura electrónica validada por la DIAN en producción.' },
        { hito: 'Release 3 en producción', fecha: '2027-01-12', criterio: 'Primera orden de mantenimiento y tablero gerencial en producción.' },
        { hito: 'Cierre del proyecto', fecha: F.end, criterio: 'Acta de cierre firmada después de la estabilización.' },
      ]),
      presupuesto: F.budget,
      recursosFinancieros: 'Presupuesto de ' + ms(F.budget) + ' con recursos propios de la empresa: BAC de las actividades ' + ms(F.bac) + ' (' + F.wbsLevel1.slice().sort((a, b) => b.cost - a.cost).map((n) => n.name.replace(/ · .*/, '') + ' ' + ms(n.cost)).join('; ') + '), reserva para contingencias de ' + ms(F.reserves.contingency) + ' y reserva de gestión de ' + ms(F.reserves.management) + '. Los releases suman ' + ms(R1.evm.bac + R2.evm.bac + R3.evm.bac) + ' (' + ms(R1.evm.bac) + ', ' + ms(R2.evm.bac) + ' y ' + ms(R3.evm.bac) + '). Desembolsos mensuales contra facturas del implementador al cierre de cada iteración.',
      interesadosClave: rows('ik', [
        { interesado: ROLE.pat, rol: 'Patrocinador', interes: 'Facturar a tiempo, controlar el inventario y decidir con indicadores diarios.' },
        { interesado: 'Gerente administrativo y financiero', rol: 'Dueño del producto', interes: 'Cierre de facturación en un día, cartera al día y datos contables confiables.' },
        { interesado: 'Jefe de la PMO', rol: 'Director de proyecto', interes: 'Entregar los releases en fecha y presupuesto con un método repetible.' },
        { interesado: 'Coordinador logístico y jefe de almacén', rol: 'Usuarios clave del release 1', interes: 'Disponibilidad en línea y remisiones sin digitar dos veces.' },
        { interesado: 'Jefe de facturación y cartera', rol: 'Usuario clave del release 2', interes: 'Prefactura desde las actas y factura electrónica sin rechazos.' },
        { interesado: 'Socio implementador', rol: 'Proveedor del equipo de desarrollo', interes: 'Alcance claro por iteración y aceptación oportuna de los incrementos.' },
      ]),
      requisitosAprobacion: 'Cada release se aprueba cuando el dueño del producto acepta sus historias «Debe tener» y los usuarios clave firman la prueba de aceptación; la salida a producción la autoriza el comité de control de cambios. El proyecto se aprueba con el acta de cierre que firma la Gerencia General después de la estabilización.',
      criteriosSalida: 'Tres releases en producción y estabilizados, saldos migrados conciliados, soporte transferido a TI y acta de cierre firmada; o decisión de la Gerencia General de cancelar o diferir un release, caso en el que se cierra lo entregado y se documentan las lecciones.',
      director: ROLE.dir,
      responsabilidadAutoridad: 'El director de proyecto dirige el plan, el presupuesto y los entregables predictivos, preside el comité de control de cambios y aprueba gastos dentro del presupuesto hasta el límite de gasto. El dueño del producto ordena el backlog y acepta o rechaza los incrementos; el Scrum Master facilita los eventos y elimina impedimentos. Los cambios de nivel 2 los decide el comité de control de cambios y los de nivel 3, la Gerencia General.',
      limiteGasto: 15000000,
      firmas: rows('fi', [
        { rol: 'Patrocinador', nombre: ROLE.pat, fecha: F.lb0Date },
        { rol: 'Director de proyecto', nombre: 'Jefe de la PMO', fecha: F.lb0Date },
        { rol: 'Dueño del producto', nombre: 'Gerente administrativo y financiero', fecha: F.lb0Date },
      ]),
    };
    const actaRev0 = {
      ...cp(actaFields),
      presupuesto: 700000000,
      recursosFinancieros: 'Presupuesto preliminar de orden de magnitud de COP 700 millones (−10 % / +25 %) con recursos propios: suscripción del ERP, implementación por releases, equipos de bodega, migración, capacitación y reservas. Se actualiza con los contratos firmados y la línea base.',
      hitos: rows('hi', [
        { hito: 'Contratos de suscripción e implementación firmados', fecha: '2026-06-30', criterio: 'Contratos firmados por la Gerencia General.' },
        { hito: 'Release 1 en producción', fecha: '2026-09-10', criterio: 'Primera remisión emitida en producción.' },
        { hito: 'Cierre del proyecto', fecha: F.end, criterio: 'Acta de cierre firmada después de la estabilización.' },
      ]),
      objetivos: actaFields.objetivos.map((o) => (o.dimension === 'Costo' ? { ...o, objetivo: 'Ejecutar el proyecto dentro del presupuesto preliminar de COP 700 millones, que se ajusta con los contratos.' } : o)),
      firmas: rows('fi', [{ rol: 'Patrocinador', nombre: ROLE.pat, fecha: F.start }, { rol: 'Director de proyecto', nombre: 'Jefe de la PMO', fecha: F.start }]),
    };

    /* ============================================================ 13.1 · REGISTRO DE INTERESADOS */
    const ST = (nombre, cargo, organizacion, rol, contacto, requisitos, expectativas, poder, interes, influencia, clasificacion, actitud, nivelActual, nivelDeseado) =>
      ({ nombre, cargo, organizacion, rol, contacto, requisitos, expectativas, poder, interes, influencia, clasificacion, actitud, nivelActual, nivelDeseado });
    const EMP = 'Ingeniería y Alquiler S.A.S.';
    const stakeholders = (stage) => rows('in', [
      ST(ROLE.pat, 'Gerente general', EMP, 'Patrocinador', 'Comité quincenal', 'Presupuesto, salidas fuera del cierre mensual y tablero gerencial.', 'Facturar a tiempo y decidir con indicadores diarios.', 5, 4, 5, 'Interno', 'Partidario', 'Partidario', 'Líder'),
      ST('Gerente administrativo y financiero', 'Gerente administrativo y financiero', EMP, 'Dueño del producto', 'Revisión de cada iteración y refinamiento semanal', 'Prefactura desde las actas, factura electrónica, cartera por edades y saldos conciliados.', 'Cierre de facturación en un día y cartera vencida de 10 % o menos.', 4, 5, 5, 'Interno', 'Partidario', 'Líder', 'Líder'),
      ST('Jefe de la PMO', 'Jefe de la PMO', EMP, 'Director de proyecto', 'Comité quincenal y reunión semanal con el implementador', 'Plan, presupuesto, control de cambios e informes.', 'Método repetible para los siguientes proyectos de TI.', 3, 5, 4, 'Interno', 'Partidario', 'Líder', 'Líder'),
      ST('Coordinador logístico', 'Coordinador logístico', EMP, 'Usuario clave del release 1', 'Revisión de cada iteración', 'Disponibilidad en línea, remisiones desde el pedido y actas en tableta.', 'Despachar sin llamar a la bodega.', 3, 5, 3, 'Interno', 'Partidario', 'Partidario', 'Líder'),
      ST('Jefe de almacén', 'Jefe de almacén (bodegas principal y de Funza)', EMP, 'Usuario clave del release 1', 'Reunión semanal de bodega', 'Conteo por estado en las devoluciones y kárdex por equipo.', 'Menos trabajo de conciliación al final del mes.', 2, 5, 3, 'Interno', stage >= 2 ? 'Neutral' : 'Reticente', stage >= 2 ? 'Neutral' : 'Reticente', 'Partidario'),
      ST('Personal de bodega y conductores', 'Auxiliares de bodega y conductores', EMP, 'Usuarios finales del release 1', 'Capacitación por grupos y carteleras', 'Tabletas fáciles de usar en patio y sin conexión.', 'No digitar dos veces ni quedarse sin señal en las obras.', 1, 4, 2, 'Interno', stage >= 2 ? 'Neutral' : 'Reticente', stage >= 2 ? 'Neutral' : 'Reticente', 'Partidario'),
      ST('Jefe de facturación y cartera', 'Jefe de facturación y cartera', EMP, 'Usuario clave del release 2', 'Revisión de cada iteración', 'Factura electrónica sin rechazos y recaudo aplicado el mismo día.', 'Cierre del corte de alquileres en un día.', 3, 5, 3, 'Interno', 'Partidario', 'Partidario', 'Líder'),
      ST('Jefe de mantenimiento', 'Jefe de mantenimiento', EMP, 'Usuario clave del release 3', 'Refinamiento del release 3', 'Hojas de vida, órdenes de trabajo y bloqueo de equipos no aptos.', 'Programar el preventivo y cobrar los daños con soporte.', 2, 4, 2, 'Interno', 'Neutral', 'Neutral', 'Partidario'),
      ST('Gerente comercial', 'Gerente comercial', EMP, 'Interesado del release 1', 'Comité quincenal (invitado)', 'Tarifas por cliente y disponibilidad para cotizar.', 'Comprometer entregas con datos reales.', 3, 3, 3, 'Interno', 'Neutral', 'Neutral', 'Partidario'),
      ST('Jefe de TI', 'Jefe de TI', EMP, 'Responsable de infraestructura y soporte', 'Comité quincenal', 'Seguridad, respaldos, equipos de bodega y transferencia al soporte.', 'Plataforma en la nube sin servidores propios.', 3, 5, 4, 'Interno', 'Partidario', 'Partidario', 'Líder'),
      ST('Contador', 'Contador', EMP, 'Aprobador de las reglas contables y de la migración de saldos', 'Refinamiento de las historias de facturación', 'Reglas tributarias correctas y saldos migrados iguales al auxiliar.', 'Cierres contables sin reprocesos.', 4, 4, 4, 'Interno', 'Neutral', 'Neutral', 'Partidario'),
      ST('Revisor fiscal', 'Revisor fiscal', 'Firma de revisoría fiscal (externa)', 'Aprueba la conciliación de saldos migrados', 'Reunión antes de cada corte', 'Trazabilidad de los saldos de inventario y cartera migrados.', 'Soportes completos de la migración.', 4, 3, 4, 'Externo', 'Neutral', 'Desconocedor', 'Neutral'),
      ST('Gerente de proyecto del implementador', 'Gerente de proyecto', 'Socio implementador (contratista)', 'Proveedor del equipo de desarrollo', 'Reunión semanal y revisiones de iteración', 'Alcance claro por iteración, aceptación oportuna y pagos al cierre de cada iteración.', 'Caso de éxito en el sector de alquiler de equipos.', 3, 5, 4, 'Externo', 'Partidario', 'Partidario', 'Partidario'),
      ST('Gerente de cuenta del fabricante del ERP', 'Gerente de cuenta', 'Fabricante del ERP (suscripción)', 'Proveedor de la suscripción', 'Revisión trimestral', 'Suscripción vigente y uso de las funciones estándar.', 'Renovación y ampliación de usuarios.', 2, 3, 2, 'Externo', 'Partidario', 'Partidario', 'Partidario'),
      ST('Proveedor tecnológico de facturación electrónica', 'Ejecutivo de soporte', 'Proveedor tecnológico autorizado por la DIAN', 'Proveedor del servicio de facturación electrónica', 'Mesa de ayuda y reunión semanal en el release 2', 'Credenciales, certificado y ambiente de habilitación estable.', 'Integración sin cambios en su API.', 2, 3, 3, 'Externo', 'Neutral', stage >= 1 ? 'Neutral' : 'Desconocedor', 'Partidario'),
      ST('DIAN', 'Autoridad tributaria', 'Dirección de Impuestos y Aduanas Nacionales', 'Regulador de la facturación electrónica', 'Normativa y servicio de validación', 'Anexo técnico vigente de la factura electrónica de venta.', 'Facturas válidas y oportunas.', 5, 1, 4, 'Externo', 'Neutral', 'Desconocedor', 'Neutral'),
    ].filter((r) => stage >= 1 || !/implementador|fabricante|Proveedor tecnológico/i.test(r.organizacion)));
    const interesadosFields = {
      interesados: stakeholders(2),
      fechaActualizacion: '2026-09-11',
      fuentes: 'Talleres de descubrimiento de mayo de 2026, organigrama, contratos de suscripción e implementación y encuesta de preparación para el cambio. Actualizado el 11 de septiembre después de la salida a producción del release 1: el jefe de almacén y el personal de bodega pasan de reticentes a neutrales; se mantiene el acompañamiento en las bodegas hasta el release 3.',
    };

    /* ============================================================ 11.2 · REGISTRO DE RIESGOS */
    const RISK = (id, descripcion, causa, efecto, categoria, tipo, probabilidad, impacto, propietario, estrategia, respuesta, disparador, reserva, estado) =>
      ({ id, descripcion, causa, efecto, categoria, tipo, probabilidad, impacto, propietario, estrategia, respuesta, disparador, reserva, estado });
    const riesgos = (stage) => {
      const res = stage >= 2 ? { 'R-001': 10, 'R-002': 5, 'R-003': 4, 'R-004': 12, 'R-005': 6, 'R-006': 6, 'R-007': 8, 'R-008': 9 } : { 'R-001': 10, 'R-002': 6, 'R-003': 5, 'R-004': 14, 'R-005': 7, 'R-006': 6, 'R-007': 12 };
      const list = [
        RISK('R-001', 'Debido a que los datos maestros (equipos, piezas, clientes, obras y tarifas) están en hojas de cálculo sin control, pueden migrarse datos incompletos o duplicados, lo que atrasaría las salidas en vivo y produciría inventario y facturas erróneos.', 'Hojas de cálculo sin validaciones; referencias sin peso unitario; clientes duplicados.', 'Retrabajo de depuración, conciliaciones fallidas y salidas a producción aplazadas.', 'Técnico', 'Amenaza', 4, 4, 'Dueño del producto', 'Mitigar',
          'Depuración por responsables de área con plantillas y validaciones del implementador; ensayo de carga antes de cada corte; conciliación firmada por contabilidad y revisoría fiscal.' + (stage >= 1 ? ' Materializado en parte en la depuración del release 1 (+3 días hábiles, ' + ms(-cv('t16')) + ' más).' : ''),
          'Más de 2 % de errores en el ensayo de carga o depuración atrasada más de 3 días hábiles.', res['R-001'], stage >= 1 ? 'En seguimiento' : 'Abierto'),
        RISK('R-002', 'Debido a que los usuarios clave mantienen su operación diaria, pueden no asistir al refinamiento, a las revisiones y a las pruebas de aceptación, lo que atrasaría la aceptación de los incrementos.', 'Carga operativa de fin de mes; un solo usuario clave por área.', 'Historias sin aceptar, retrabajo y menor velocidad.', 'De la organización', 'Amenaza', 4, 3, ROLE.pat, 'Mitigar',
          'Agenda fija de refinamiento y revisión acordada con la Gerencia General; suplente por área; pruebas de usuario programadas fuera del cierre mensual.', 'Dos ausencias seguidas de un usuario clave a la revisión o al refinamiento.', res['R-002'], 'En seguimiento'),
        RISK('R-003', 'Debido al cambio en la forma de trabajar en las bodegas y obras, el personal de bodega y los conductores pueden resistirse a usar las tabletas, lo que mantendría registros paralelos en papel.', 'Costumbre del registro en papel; temor al control por pieza.', 'Datos incompletos en el ERP y pérdida de los beneficios del release 1.', 'De la organización', 'Amenaza', 3, 4, ROLE.dir, 'Mitigar',
          'Red de usuarios clave, capacitación por grupos en la bodega, acompañamiento en sitio durante dos semanas después de cada salida y retiro de los formatos en papel con fecha anunciada.', 'Más de 5 % de remisiones o devoluciones registradas en papel en una semana.', res['R-003'], 'En seguimiento'),
        RISK('R-004', 'Debido a los cambios del anexo técnico de la DIAN y a la estabilidad del ambiente del proveedor tecnológico, las facturas pueden ser rechazadas en habilitación o en producción, lo que atrasaría el release 2 y la facturación de los clientes.', 'Integración nueva con el proveedor tecnológico; reglas de validación de la DIAN; ambiente de habilitación inestable.', 'Release 2 atrasado, facturas sin validar y cartera sin respaldo.', 'Externo', 'Amenaza', 4, 4, 'Desarrollador de integraciones', 'Mitigar',
          (stage >= 2 ? 'Investigación de la API antes del conector (IN-003), reglas de rechazo documentadas (IN-004), validaciones previas en el ERP (ME-009), lista de chequeo del anexo técnico en la definición de terminado y aviso de caídas del proveedor. Materializado en parte: dos días de caída del ambiente en la iteración 6 (INC-002) y HU-033 rechazada en la revisión.' : 'Investigación de la API del proveedor antes de construir el conector (IN-003), pruebas tempranas en el ambiente de habilitación y validaciones previas en el ERP antes de enviar cada documento.'),
          'Más de 2 % de rechazos en habilitación o caída del ambiente del proveedor por más de un día.', res['R-004'], 'En seguimiento'),
        RISK('R-005', 'Debido a que el equipo de desarrollo depende del implementador, la salida del consultor funcional o del desarrollador ERP puede detener el avance, lo que bajaría la velocidad varias iteraciones.', 'Rotación de personal en el mercado de consultores ERP.', 'Velocidad menor, pérdida de conocimiento y releases atrasados.', 'Externo', 'Amenaza', 2, 5, ROLE.dir, 'Transferir',
          'Cláusula del contrato: reemplazo con perfil equivalente en 5 días hábiles y empalme de una semana a cargo del implementador; documentación de la parametrización en cada historia; el analista de TI participa en todas las historias.', 'Aviso de retiro de un consultor del implementador.', res['R-005'], 'Abierto'),
        RISK('R-006', 'Debido a que una salida a producción puede coincidir con el cierre mensual o anual, los saldos migrados pueden quedar mal cortados, lo que afectaría los estados financieros.', 'Calendario de releases cercano a los cierres; migración de saldos de cartera e inventario.', 'Reprocesos contables y observaciones de la revisoría fiscal.', 'Dirección de proyectos', 'Amenaza', 3, 5, 'Contador', 'Evitar',
          'Ninguna salida durante los cinco primeros días hábiles del mes: release 2 el 10 de noviembre y release 3 el 12 de enero de 2027, después del cierre anual; conciliación aprobada por contabilidad y revisoría fiscal antes de cada salida.', 'Fecha de salida a producción dentro de los cinco primeros días hábiles del mes.', res['R-006'], 'En seguimiento'),
        RISK('R-007', 'Debido a que las áreas descubren necesidades al usar cada incremento, el alcance de los releases puede crecer, lo que movería sus fechas o su presupuesto.', 'Retroalimentación de las revisiones; necesidades no identificadas en el descubrimiento.', 'Releases más largos y costos adicionales del implementador.', 'Dirección de proyectos', 'Amenaza', 4, 3, 'Dueño del producto', 'Mitigar',
          'Control de cambios en dos niveles: el dueño del producto prioriza dentro de ±10 % del alcance del release; lo demás va al comité con solicitud de cambio.' + (stage >= 1 ? ' CC-001 aprobado el 13 de agosto (básculas, release 1).' : '') + (stage >= 2 ? ' Release 2 en +7,1 % al 7 de octubre (nivel 1).' : ''),
          'Alcance de un release comprometido a más de 8 % de su línea base.', res['R-007'], stage >= 1 ? 'En seguimiento' : 'Abierto'),
        RISK('R-009', 'Debido a que el conector con el proveedor tecnológico y las plantillas de migración del implementador quedan probados en los releases 1 y 2, el release 3 puede reutilizarlos, lo que reduciría su esfuerzo.', 'Plantillas de carga y conector reutilizables.', 'Menos puntos en el release 3 y holgura para las mejoras «Podría tener».', 'Técnico', 'Oportunidad', 3, 3, 'Líder del implementador', 'Mejorar',
          'Documentar el conector y las plantillas como componentes reutilizables y estimar el release 3 con ellos.', 'Plantilla de hojas de vida (TA-012) construida a partir de la de inventario.', 0, 'Abierto'),
      ];
      if (stage >= 2) list.splice(7, 0, RISK('R-008', 'Debido a que la velocidad de las iteraciones 5 y 6 (' + F.velocity.rows[4].completed + ' y ' + F.velocity.rows[5].completed + ' puntos) es menor que la necesaria para los ' + R2.prog.remaining + ' puntos que faltan, el release 2 puede terminar después del 6 de noviembre, lo que movería su salida a producción.', 'Integración con el proveedor tecnológico más lenta de lo previsto; alcance del release 2 en ' + R2.prog.total + ' puntos.', 'Salida del release 2 después del cierre de noviembre y factura electrónica en producción hasta diciembre.', 'Dirección de proyectos', 'Amenaza', 4, 3, 'Dueño del producto', 'Mitigar',
        'Diferir al release 3 las mejoras «Podría tener» ME-005 y ME-006 (8 puntos), nivel 1, o tramitar una solicitud de cambio para mover la fecha, nivel 2; decisión en el refinamiento del 14 de octubre.', 'Pronóstico por velocidad del release posterior al 6 de noviembre al cerrar una iteración.', res['R-008'], 'Abierto'));
      return list;
    };
    const sumRes = (list) => list.reduce((s, r) => s + r.reserva, 0);
    const riesgosFields = {
      riesgos: riesgos(2).map((r) => ({ ...r, reserva: r.reserva * 1e6 })),
      fechaRevision: '2026-10-08',
      listaVigilancia: 'Riesgos bajos en observación: tasa de cambio de los equipos importados (materializado en julio, sin compras pendientes); disponibilidad de salas de capacitación en noviembre; renovación del certificado de firma digital en 2027.',
      residuales: 'Después de las respuestas quedan como residuales: rechazos puntuales de la DIAN por datos del adquirente (se atienden con la mesa de ayuda) y diferencias menores de inventario en las obras (inventario cíclico mensual). Riesgo secundario: más carga del analista de TI al documentar la parametrización (R-005).',
      planesReserva: 'Reserva para contingencias de ' + ms(F.reserves.contingency) + ' distribuida por riesgo (columna «Reserva»; R-008 se agregó el 8 de octubre sin aumentar el total). No se ha usado. El EAC al 9 de octubre (' + ms(E.eac) + ') se cubriría con ' + ms(E.eac - E.bac) + ' de esta reserva. La reserva de gestión (' + ms(F.reserves.management) + ') solo la autoriza la Gerencia General.',
    };

    /* ============================================================ 4.2 · PLAN DE GESTIÓN DE CAMBIOS */
    const cambiosPlan = {
      enfoqueCambios: 'Control integrado de cambios en dos niveles, adaptado al enfoque ágil. Dentro de un release comprometido, el dueño del producto puede reordenar, refinar, dividir o reemplazar elementos del backlog sin trámite formal mientras el alcance total se mantenga dentro de ±10 % de la línea base del release y no cambien su fecha ni su presupuesto. Si se supera ese umbral o cambian la fecha o el presupuesto de un release comprometido, se tramita una solicitud de cambio (4.6) y, aprobada, se fija una nueva línea base del release. Los cambios a las líneas base del proyecto (LB0) y a los entregables predictivos siguen el proceso formal.',
      definicionCambio: 'Es cambio: modificar el alcance de un release comprometido en más de ±10 % de su línea base, su fecha de fin o su presupuesto; cambiar un entregable predictivo (selección, infraestructura, migración, capacitación, salidas en vivo), las fechas de los hitos, el presupuesto o un documento aprobado. No es cambio: reordenar el backlog, refinar o dividir historias, cambiar la prioridad MoSCoW o asignar elementos a iteraciones dentro del umbral.',
      ccb: rows('cc', [
        { rol: 'Presidente', integrante: ROLE.dir, responsabilidad: 'Convoca, presenta el análisis de impacto y decide junto con el comité los cambios de nivel 2.' },
        { rol: 'Dueño del producto', integrante: 'Gerente administrativo y financiero', responsabilidad: 'Decide los cambios de nivel 1 y propone las alternativas de alcance.' },
        { rol: 'Patrocinador', integrante: ROLE.pat, responsabilidad: 'Decide los cambios de nivel 3 y autoriza el uso de la reserva de gestión.' },
        { rol: 'Asesor técnico', integrante: ROLE.ti, responsabilidad: 'Evalúa el impacto en infraestructura, seguridad e integraciones.' },
        { rol: 'Representante del implementador', integrante: ROLE.imp, responsabilidad: 'Estima el esfuerzo y confirma la capacidad del equipo de desarrollo.' },
        { rol: 'Secretaría', integrante: ROLE.sm, responsabilidad: 'Mantiene el registro de cambios y actualiza la línea base del release en «Releases e iteraciones».' },
      ]),
      frecuenciaCcb: 'Quincenal',
      umbrales: rows('um', [
        { nivel: 'Nivel 1', criterio: 'Dentro de un release: alcance dentro de ±10 % de su línea base, sin cambiar su fecha ni su presupuesto.', aprobador: 'Dueño del producto', plazoDias: 2 },
        { nivel: 'Nivel 2', criterio: 'Alcance de un release fuera de ±10 %, cambio de su fecha de fin dentro del plazo del proyecto o de su presupuesto hasta COP 30 millones con cargo a la reserva para contingencias.', aprobador: ROLE.ccb, plazoDias: 5 },
        { nivel: 'Nivel 3', criterio: 'Cambio en la fecha de fin del proyecto, uso de la reserva de gestión, costo superior a COP 30 millones o nuevo módulo fuera de la visión del producto.', aprobador: ROLE.pat, plazoDias: 10 },
        { nivel: 'Emergencia', criterio: 'Falla crítica en producción que impide facturar o despachar.', aprobador: 'Dueño del producto y Jefe de TI; ratifica el comité', plazoDias: 1 },
      ]),
      pasos: rows('pa', [
        { paso: '1. Registrar', actividad: 'Desde «Releases e iteraciones» se registra la solicitud de cambio prellenada con la variación del release y la fila CC-### del registro de cambios.', responsable: ROLE.sm, plazo: '1 día hábil' },
        { paso: '2. Analizar', actividad: 'Impacto en alcance (puntos), cronograma (iteraciones y fechas), costo, calidad y riesgos, con el pronóstico por velocidad y al menos una alternativa.', responsable: 'Dueño del producto y Director de proyecto', plazo: '2 días hábiles' },
        { paso: '3. Decidir', actividad: 'Decisión según el nivel de autoridad, registrada en la solicitud y en el registro de cambios.', responsable: 'Aprobador según el nivel', plazo: 'Según el nivel' },
        { paso: '4. Actualizar', actividad: 'Nueva línea base del release con la referencia del cambio; plan de releases y, si aplica, nueva línea base del proyecto en «Líneas base».', responsable: ROLE.sm, plazo: '1 día hábil' },
        { paso: '5. Comunicar', actividad: 'Comunicación al solicitante, al equipo en la siguiente planificación y a los interesados en el informe de desempeño.', responsable: ROLE.dir, plazo: '1 día hábil' },
        { paso: '6. Verificar', actividad: 'Revisión del incremento con el cambio implementado y aceptación del dueño del producto.', responsable: 'Dueño del producto', plazo: 'En la revisión de la iteración' },
      ]),
      cambiosEmergencia: 'Ante una falla crítica en producción (no se puede facturar o despachar), el dueño del producto y el jefe de TI autorizan la corrección inmediata por el carril de urgencia del tablero, que puede superar el límite WIP una vez por iteración. Se documenta dentro de las 24 horas siguientes y el comité la ratifica en su siguiente sesión.',
      herramientasCambios: 'Solicitud de cambio y registro de cambios del gestor; línea base de cada release en «Releases e iteraciones» (alcance, fin, presupuesto e iteraciones, con la referencia del cambio); líneas base del proyecto en «Líneas base»; actas de revisión de cada iteración para los cambios de nivel 1.',
      comunicacionCambios: 'El director comunica la decisión al solicitante en un día hábil; los cambios aprobados se presentan en la siguiente revisión de iteración y en el informe de desempeño quincenal con su efecto en los releases.',
    };

    /* ============================================================ plantillas ágiles: visión, DoD, plan de releases */
    const vision = ex('vision-producto');
    const dod = ex('definicion-terminado');
    const dodRev0 = {
      ...cp(dod),
      fechaAcuerdo: F.lb0Date,
      revisionAcuerdo: 'Se revisa en cada retrospectiva; los cambios se acuerdan por consenso del equipo con el dueño del producto y se emiten como nueva revisión.',
      definicionTerminado: dod.definicionTerminado.filter((x) => !/datos migrados|Pruebas de usuario/.test(x)),
      politicasFlujo: dod.politicasFlujo.filter((x) => !/^Las historias y mejoras pasan por «Pruebas de usuario»/.test(x)).map((x) => (/^Límites WIP/.test(x) ? 'Límites WIP: 3 elementos en «En curso» y 2 en «En revisión»; con una columna llena, el equipo ayuda a terminar antes de tomar trabajo nuevo.' : x)),
      columnasTablero: dod.columnasTablero.filter((r) => r.columna !== 'Pruebas de usuario').map((r) => (r.columna === 'En revisión' ? { ...r, criterioSalida: 'Cumple la definición de terminado.' } : r)),
    };
    const plan = ex('plan-release');
    const planAt = (date, stage) => {
      const p = cp(plan);
      p.releases = p.releases.map((r, i) => {
        const id = 'rel-' + (i + 1);
        const pts = F.releaseAt(id, date).total;
        return { ...r, puntos: pts, alcance: stage < 1 && i === 0 ? r.alcance.replace('; integración con las básculas de despacho (CC-001)', '') : r.alcance };
      });
      if (stage < 2) {
        p.capacidadEquipo = p.capacidadEquipo.replace(/ \(31 puntos al cierre de la iteración 5\)/, '');
        p.supuestos = p.supuestos.map((x) => x.replace(' (lo entregó el 31 de agosto)', ''));
      }
      return p;
    };

    /* ============================================================ iteraciones: planificación, revisión, retrospectiva */
    const it5 = sprint('spr-05'), it6 = sprint('spr-06'), it7 = sprint('spr-07');
    const asElement = (code) => { const it = item(code); return { codigo: it.code, titulo: it.title, tipo: TYPE_LABEL[it.type] || it.type, estimacion: it.estimate, responsable: it.assignee, criterios: it.acceptance }; };
    const sprintCodes = (sid) => F.items.filter((x) => x.type !== 'epica' && x.sprintId === sid).sort((a, b) => a.rank - b.rank).map((x) => x.code);
    /* iteración 7: los elementos comprometidos al iniciar (sin DF-009, que entró por urgencia el 9 de octubre) */
    const it7Codes = sprintCodes('spr-07').filter((c) => c !== 'DF-009');
    const vel7 = F.velocityAt('2026-10-07');
    const it7Plan = {
      iteracion: it7.name, release: relName('rel-2'), fechaInicio: it7.start, fechaFin: it7.end, objetivo: it7.goal,
      capacidad: it7.capacity, velocidadReferencia: round1(vel7.avg3), compromiso: it7.committed,
      notasCapacidad: 'Cinco personas, dos de ellas al 50 %: 4 personas equivalentes × 10 días hábiles = 40 días-persona sin ausencias (el festivo del 12 de octubre no es día de la iteración). Con el rendimiento de la iteración 6 (26 puntos en 38 días-persona) la capacidad sería de 27 puntos y con el de la iteración 5 (30 en 37), de 32; el equipo fija la capacidad en 32 puntos porque HU-033 llega casi terminada. Velocidad de referencia: promedio de las iteraciones 4, 5 y 6 (' + vel7.rows.filter((r) => r.status === 'cerrado').slice(-3).map((r) => r.completed).join(', ').replace(/, (\d+)$/, ' y $1') + ' puntos).',
      elementos: rows('el', it7Codes.map(asElement)),
      riesgos: 'Compromiso de ' + it7.committed + ' puntos frente a una velocidad de referencia de ' + n1(vel7.avg3) + ': el equipo lo acepta porque HU-033 solo requiere corregir el código QR. TA-011 depende del auxiliar de cartera conciliado que contabilidad entrega el 13 de octubre; si no llega, se reemplaza por HU-023 de la iteración 8. DF-008 es un defecto de producción del release 1 (soporte, sin release). Los defectos críticos de producción entran por el carril de urgencia. HU-033 se verifica con la lista de chequeo del anexo técnico de la DIAN (acción 1 de la retrospectiva de la iteración 6).',
      participantes: [ROLE.po, 'Scrum Master / facilitador', 'Equipo de desarrollo (cinco personas)', 'Jefe de facturación y cartera (invitado)'],
    };
    /* revisión de la iteración 5 (23 de septiembre) */
    const r2at23 = F.releaseAt('rel-2', it5.end);
    const vel5 = F.velocityAt(it5.end);
    const fc5 = F.forecastAt('rel-2', it5.end);
    const it5Done = sprintCodes('spr-05');
    const it5Unfinished = it5.unfinished.map((u) => u.code);
    const it5Review = {
      iteracion: it5.name, fecha: it5.end, objetivo: it5.goal, objetivoCumplido: 'Sí',
      comprometido: it5.committed, terminado: it5.completed,
      incremento: 'Con los clientes migrados de la bodega principal se demostraron los datos tributarios del adquirente, la resolución de facturación con sus rangos, el cálculo de IVA y retención en la fuente en facturas de alquiler y de venta, y el primer documento de prueba aceptado por el proveedor tecnológico en el ambiente de habilitación. También se corrigieron los cinco defectos menores que dejó la prueba de aceptación del release 1.',
      elementos: rows('el', [
        ...it5Done.map((code) => { const it = item(code); return { codigo: it.code, titulo: it.title, estimacion: it.estimate, resultado: 'Aceptado', observaciones: code === 'HU-029' ? 'Contabilidad validó los cinco casos tributarios.' : code === 'IN-003' ? 'Decisión: envío en línea con consulta de estado cada cinco minutos.' : '' }; }),
        ...it5Unfinished.map((code) => { const it = item(code); return { codigo: it.code, titulo: it.title, estimacion: it.estimate, resultado: 'No terminado', observaciones: 'Bloqueado: el banco no entregó el formato del archivo de recaudo; vuelve al backlog del producto.' }; }),
      ]),
      retroalimentacion: 'El usuario clave de facturación confirmó que los datos tributarios del cliente evitan los rechazos más comunes. Contabilidad pidió revisar con ella cada historia de facturación antes de la planificación. El jefe de almacén reportó que la consulta de disponibilidad no refleja algunas devoluciones registradas sin conexión (DF-008, soporte de producción).',
      cambiosBacklog: 'Sin elementos nuevos en el release 2: su alcance sigue en ' + r2at23.total + ' puntos, igual a su línea base. TA-010 vuelve al backlog del producto hasta que el banco entregue el formato. Entraron ME-007 al release 3 (alerta de ciclo de alquiler, pedido de mantenimiento) y DF-008 como soporte de producción del release 1, sin release.',
      estadoRelease: 'Release 2: ' + r2at23.done + ' de ' + r2at23.total + ' puntos terminados (' + pc(r2at23.pct) + ') después de 1 de sus 4 iteraciones. Faltan ' + r2at23.remaining + ' puntos para las iteraciones 6 a 8 (' + n1(r2at23.remaining / 3) + ' por iteración) frente a una velocidad promedio de ' + nm(vel5.avg3) + ' puntos en las tres últimas. El pronóstico por velocidad del release (' + nm(fc5.velocity) + ' puntos por iteración) termina el ' + dl(fc5.finish) + ': conserva la fecha del plan.',
      asistentes: [ROLE.po, 'Scrum Master / facilitador', 'Equipo de desarrollo (cinco personas)', 'Jefe de facturación y cartera', 'Contador', 'Jefe de almacén'],
    };
    const it5Retro = {
      iteracion: it5.name, fecha: it5.end, formato: 'Bien, mejorar y acciones', facilitador: 'Scrum Master / facilitador', satisfaccion: 4.1,
      seguimientoAnteriores: 'Acciones de la iteración 4: (1) ensayo de corte del release 1 con los datos migrados — hecha: la salida del 10 de septiembre fue en un día y sin reversión; (2) revisión de los perfiles de bodega antes de la salida — hecha.',
      queFueBien: [
        'La salida a producción del release 1 el 10 de septiembre se hizo en un día y sin reversión.',
        'La investigación de la API del proveedor tecnológico (IN-003) aclaró el envío en línea antes de construir el conector.',
        'Contabilidad validó los cinco casos tributarios de HU-029 dentro de la iteración.',
      ],
      queMejorar: [
        'El ambiente de pruebas no tenía los clientes migrados con sus datos tributarios: dos historias se probaron con datos inventados.',
        'Las historias de facturación llegaron a la planificación sin revisar las reglas tributarias con contabilidad.',
        'El ambiente de habilitación del proveedor tecnológico se cayó sin aviso y el equipo perdió medio día.',
      ],
      propuestas: ['Hacer la revisión de pares a mitad de la iteración y no solo al final.'],
      aprendizajes: ['Los datos tributarios del adquirente son la primera causa de rechazo: se validan al crear el cliente, no al facturar.'],
      acciones: rows('ac', [
        { accion: 'Cargar en el ambiente de pruebas los clientes y obras migrados con sus datos tributarios.', responsable: 'Analista de TI', fechaObjetivo: '2026-09-25', estado: 'Pendiente' },
        { accion: 'Refinar con contabilidad cada historia de facturación antes de la planificación.', responsable: 'Dueño del producto', fechaObjetivo: '2026-09-24', estado: 'Pendiente' },
        { accion: 'Revisar cada mañana el ambiente de habilitación del proveedor tecnológico y avisar en la reunión diaria.', responsable: 'Desarrollador de integraciones', fechaObjetivo: '2026-09-30', estado: 'Pendiente' },
      ]),
      lecciones: rows('le', [
        { situacion: 'El ambiente de pruebas sin los clientes migrados ocultó errores de datos tributarios hasta la revisión de la iteración 5.', impacto: 'Negativo', recomendacion: 'Cargar los datos migrados en el ambiente de pruebas antes de construir historias que dependan de ellos.' },
        { situacion: 'Una investigación de la API del proveedor tecnológico (IN-003) antes del conector evitó retrabajo en la integración.', impacto: 'Positivo', recomendacion: 'Programar una investigación de máximo una iteración antes de cada integración con un sistema externo.' },
      ]),
    };
    const it6Plan = ex('planificacion-sprint');
    const it6Review = ex('acta-revision-sprint');
    const it6Retro = {
      ...ex('retrospectiva'),
      propuestas: ['Usar la lista de chequeo del anexo técnico de la DIAN como plantilla de criterios de aceptación para toda historia que genere documentos electrónicos.'],
      aprendizajes: ['Una historia rechazada en la revisión vuelve a la iteración siguiente con su estimación original y solo cuenta en la velocidad cuando se acepta.'],
    };

    /* ============================================================ 4.4 · REGISTRO DE LECCIONES APRENDIDAS */
    const fromRetro = (retro, sprintName) => retro.lecciones.map((l) => ({ fecha: retro.fecha, area: 'Integración', situacion: l.situacion, impacto: l.impacto, recomendacion: l.recomendacion, registradoPor: 'Retrospectiva ' + sprintName }));
    const leccionesAll = [
      { fecha: '2026-06-22', area: 'Adquisiciones', situacion: 'Las demostraciones guiadas con guiones de negocio propios (pedido, despacho, devolución, liquidación y factura) mostraron diferencias entre los tres finalistas que las presentaciones comerciales ocultaban.', impacto: 'Positivo', recomendacion: 'Exigir en toda selección de software demostraciones con guiones y datos de la empresa, iguales para todos los oferentes.', registradoPor: ROLE.dir },
      { fecha: F.cc1Date, area: 'Integración', situacion: 'La integración con las básculas (CC-001) superaba el umbral de ±10 % del release 1; el comité la decidió en dos días hábiles porque el análisis mostró con la velocidad real que cabía sin mover la fecha ni el presupuesto.', impacto: 'Positivo', recomendacion: 'Analizar los cambios de alcance de un release con la velocidad real y decidirlos en el comité en menos de una semana.', registradoPor: ROLE.dir },
      { fecha: '2026-08-14', area: 'Calidad', situacion: 'El 14 % de las referencias del catálogo no tenía peso unitario y había clientes duplicados: la depuración de datos maestros tardó tres días hábiles más y costó ' + ms(-cv('t16')) + ' más de lo presupuestado.', impacto: 'Negativo', recomendacion: 'Medir la calidad de los datos maestros en el descubrimiento y presupuestar la depuración con esa medición.', registradoPor: 'Dueño del producto' },
      { fecha: '2026-08-26', area: 'Integración', situacion: 'Dos historias del release 1 se dieron por terminadas sin que el usuario clave las probara con datos reales y fallaron en la prueba de aceptación.', impacto: 'Negativo', recomendacion: 'Agregar al tablero una columna «Pruebas de usuario» con límite WIP para que el usuario clave apruebe cada historia antes de terminarla.', registradoPor: 'Retrospectiva Iteración 3' },
      { fecha: '2026-09-10', area: 'Cronograma', situacion: 'El ensayo de corte con el inventario migrado (TA-008) permitió salir a producción con el release 1 en un día y fuera del cierre mensual.', impacto: 'Positivo', recomendacion: 'Ensayar cada corte con los datos migrados una semana antes y programar la salida después de los cinco primeros días hábiles del mes.', registradoPor: ROLE.dir },
      ...fromRetro(it5Retro, it5.name),
      ...fromRetro(it6Retro, it6.name),
    ].map((r, i) => ({ id: 'LA-' + String(i + 1).padStart(3, '0'), ...r }));
    const leccionesFields = {
      lecciones: leccionesAll,
      momentosCaptura: 'Al final de cada retrospectiva (las lecciones se envían desde «Releases e iteraciones»), al decidir cada solicitud de cambio, después de cada salida a producción y al cierre del proyecto.',
      repositorioLecciones: 'Repositorio de lecciones aprendidas de la PMO (proyectos de TI)',
      difusion: 'El Scrum Master presenta las lecciones nuevas en la siguiente planificación; las que cambian la forma de trabajar se incorporan a la definición de listo y de terminado o a las políticas del tablero. Al cierre se consolidan en el informe final para los siguientes proyectos de TI de la empresa.',
    };

    /* ============================================================ 4.6 · REGISTRO Y SOLICITUD DE CAMBIO (CC-001) */
    /* alcance del release 1 antes de la solicitud (las historias de las básculas se crearon el día de la solicitud) y terminado a esa fecha */
    const r1before = F.releaseAt('rel-1', D.add(F.cc1Request, -1));
    const r1at11 = F.releaseAt('rel-1', F.cc1Request);
    const r1Base = 102;
    const cc1Pct = (R1.prog.total - r1Base) / r1Base;
    const signedPct = (x) => (x >= 0 ? '+' : '−') + plain(PM.fmt.num(Math.abs(x) * 100, 1)) + ' %';
    const vel2 = F.velocityAt('2026-08-11');
    const remaining11 = R1.prog.total - r1at11.done;
    const cc1Row = {
      id: 'CC-001', fecha: F.cc1Request, solicitante: 'Coordinador logístico',
      descripcion: 'Agregar al release 1 la integración con las básculas de despacho de las bodegas principal y de Funza: peso teórico de la remisión, captura del peso de báscula y alerta de diferencias de peso en las devoluciones (épica EP-008, 13 puntos).',
      tipo: 'Actualización',
      impactoAlcance: 'Release 1: de ' + r1before.total + ' a ' + R1.prog.total + ' puntos frente a ' + r1Base + ' de la línea base (' + signedPct(cc1Pct) + '); supera el umbral de ±10 %.',
      impactoCronograma: 0, impactoCosto: 0, estado: 'Aprobada', fechaDecision: F.cc1Date, decisor: ROLE.ccb,
    };
    const registroCambiosFields = {
      cambios: [cc1Row],
      responsableRegistro: ROLE.sm,
      observacionesCambios: 'Control en dos niveles: los ajustes del backlog dentro de ±10 % del alcance de un release comprometido, sin cambiar fecha ni presupuesto, los decide el dueño del producto y quedan en las actas de revisión (nivel 1); los demás pasan por solicitud de cambio (nivel 2 o 3). En la revisión de la iteración 6 (7 de octubre) el release 2 pasó de ' + R2.variance.baselinePoints + ' a ' + R2.prog.total + ' puntos (' + signedPct(R2.variance.scopePct) + '), dentro del umbral: no requiere solicitud. Si el dueño del producto decide mantener el alcance y mover la fecha del release 2, se registrará el CC-002.',
    };
    const registroCambiosRev0 = { ...cp(registroCambiosFields), observacionesCambios: 'CC-001 aprobado por el comité de control de cambios el 13 de agosto de 2026: la línea base del release 1 pasa de ' + r1Base + ' a ' + R1.prog.total + ' puntos, sin cambio de fecha (9 de septiembre) ni de presupuesto (' + ms(R1.evm.bac) + '). La línea base del proyecto (LB0) no cambia.' };
    const solicitud = {
      codigoCambio: 'CC-001', fechaSolicitud: F.cc1Request, solicitante: 'Coordinador logístico', tipoCambio: 'Actualización', prioridadCambio: 'Alta',
      elementosAfectados: ['Línea base del release «' + relName('rel-1') + '»', 'Backlog del producto (alcance del release)', 'Plan de releases', 'Entregable de la EDT 1.6 ' + 'Release 1 · Inventario y alquiler de equipos', 'Actividad del cronograma «Release 1: inventario y alquiler de equipos (iteraciones 1 a 4)»'],
      descripcionCambio: 'Actualizar la línea base del release «' + relName('rel-1') + '». Agregar la integración con las básculas de despacho (EP-008): HU-038, peso teórico de la remisión (3 puntos); HU-039, captura del peso de báscula en despachos y devoluciones (5 puntos), y HU-040, alerta de diferencias de peso en las devoluciones (5 puntos).',
      justificacion: 'En las devoluciones de julio y agosto el conteo manual tomó en promedio 3,5 horas por vehículo y los faltantes se detectaron días después, sin soporte para cobrarlos. Con el peso de báscula solo se cuentan pieza a pieza las devoluciones con diferencia mayor a 3 %. El cambio supera el umbral de ±10 % del alcance del release comprometido: según el control en dos niveles lo decide el comité de control de cambios (4.6).',
      consecuenciaNoHacer: 'Los faltantes seguirían detectándose tarde y sin soporte; la integración quedaría para 2027 con otro contrato del implementador.',
      impactoAlcance: 'Release «' + relName('rel-1') + '»: ' + R1.prog.total + ' puntos frente a ' + r1Base + ' de la línea base (+' + (R1.prog.total - r1Base) + ' puntos, ' + signedPct(cc1Pct) + '). Elementos agregados después de la línea base: ' + ['DF-001', 'HU-038', 'HU-039', 'HU-040'].map((c) => { const it = item(c); return it.code + ' ' + it.title + ' (' + it.estimate + ' puntos)'; }).join('; ') + '.',
      diasCronograma: 0,
      impactoCronograma: 'Sin cambio en la fecha de fin del release (9 de septiembre de 2026): faltan ' + remaining11 + ' puntos para las iteraciones 3 y 4 (' + n1(remaining11 / 2) + ' por iteración) y la iteración 2 terminó ' + vel2.rows[1].completed + '. Si la velocidad baja, el dueño del producto difiere al release 2 elementos «Debería tener».',
      valorCosto: 0,
      impactoCosto: 'Sin cambio en el presupuesto del release (' + ms(R1.evm.bac) + '): el implementador trabaja a precio fijo por iteración y las básculas de las dos bodegas ya tienen salida de datos.',
      impactoCalidad: 'Mejora el control de faltantes: alerta de diferencias de peso mayores a 3 % antes de cerrar cada devolución.',
      impactoRiesgos: 'Aumenta el riesgo de no terminar el release 1 en su fecha (' + n1(remaining11 / 2) + ' puntos por iteración frente a un promedio de ' + n1(vel2.avgAll) + ' en las iteraciones 1 y 2); se mitiga con la opción de diferir elementos «Debería tener». Reduce el riesgo de pérdida de equipos en obra.',
      impactoOtros: 'La épica EP-008 se agrega al plan de releases (revisión 1) y al diccionario de la EDT del entregable 1.6. La línea base del proyecto (LB0) no cambia.',
      alternativas: rows('al', [
        { alternativa: 'A. Agregar las básculas al release 1', descripcion: '13 puntos en las iteraciones 3 y 4, sin mover la fecha ni el presupuesto del release.', costo: 0, dias: 0, recomendada: true },
        { alternativa: 'B. Pasar las básculas al release 3', descripcion: 'Sin efecto en el release 1; los faltantes siguen sin control hasta enero de 2027.', costo: 0, dias: 0, recomendada: false },
        { alternativa: 'C. Contratar una quinta iteración del release 1', descripcion: 'Precio fijo del implementador más el analista de TI; salida a producción el 24 de septiembre.', costo: 24000000, dias: 10, recomendada: false },
      ]),
      decision: 'Aprobada', fechaDecision: F.cc1Date, decisor: ROLE.ccb, nivelAutoridad: 'Nivel 2',
      condiciones: 'Aprobada la alternativa A: la línea base del release 1 pasa a ' + R1.prog.total + ' puntos sin cambiar la fecha ni el presupuesto. Si al cerrar la iteración 3 el pronóstico mueve el fin del release, el dueño del producto difiere elementos «Debería tener» al release 2.',
      lineasBaseAfectadas: ['Línea base del release 1: ' + R1.prog.total + ' puntos, fin el 9 de septiembre de 2026, ' + ms(R1.evm.bac) + ' y 4 iteraciones'],
      implementacion: 'El Scrum Master actualiza la línea base del release en «Releases e iteraciones» con referencia al CC-001 el 13 de agosto; el dueño del producto incluye HU-038 a HU-040 en la planificación de la iteración 4; el desarrollador de integraciones coordina con el proveedor de las básculas la configuración de su salida de datos.',
    };

    /* ============================================================ 4.3 · REGISTRO DE INCIDENTES */
    const incidentesFields = {
      incidentes: [
        { id: 'INC-001', fecha: '2026-07-22', descripcion: 'Las cuatro tabletas robustas para las bodegas llegaron dos días hábiles tarde por una demora en la importación.', tipo: 'Logístico', prioridad: 'Media', responsable: ROLE.ti, fechaObjetivo: '2026-07-24', estado: 'Cerrado', solucion: 'Instaladas el 24 de julio; el equipo usó las tabletas de prueba del implementador en la iteración 2.' },
        { id: 'INC-002', fecha: '2026-09-30', descripcion: 'El ambiente de habilitación del proveedor tecnológico de facturación electrónica estuvo caído el 30 de septiembre y el 1 de octubre, sin aviso al equipo.', tipo: 'Técnico', prioridad: 'Alta', responsable: 'Desarrollador de integraciones', fechaObjetivo: '2026-10-14', estado: 'En curso', solucion: 'El proveedor restableció el servicio el 1 de octubre; se le pidió aviso automático de caídas (acción 2 de la retrospectiva de la iteración 6).' },
        { id: 'INC-003', fecha: '2026-10-05', descripcion: 'Contabilidad no ha entregado el auxiliar de cartera conciliado a 30 de septiembre: bloquea TA-011 y la migración de saldos de cartera.', tipo: 'Recursos', prioridad: 'Alta', responsable: ROLE.con, fechaObjetivo: '2026-10-13', estado: 'Abierto', solucion: 'Entrega comprometida para el 13 de octubre; si no llega, TA-011 sale de la iteración 7 y entra HU-023.' },
        { id: 'INC-004', fecha: F.statusDate, descripcion: 'Defecto crítico en producción: el traslado entre bodegas no descontaba las piezas reservadas para despacho (DF-009).', tipo: 'Técnico', prioridad: 'Alta', responsable: 'Desarrollador ERP', fechaObjetivo: F.statusDate, estado: 'Resuelto', solucion: 'Corregido el mismo día por el carril de urgencia de la iteración 7 y verificado en producción con la bodega de Funza.' },
      ],
      escalamiento: 'Un incidente de prioridad alta sin solución en dos días hábiles se escala al director de proyecto; si afecta una salida a producción o la facturación, a la Gerencia General. Los impedimentos del equipo los atiende el Scrum Master en la reunión diaria.',
      revisionIncidentes: 'Semanal',
    };

    /* ============================================================ 4.5 · INFORME DE DESEMPEÑO (corte del 9 de octubre) */
    const vel = F.velocity;
    const last3 = vel.rows.filter((r) => r.status === 'cerrado').slice(-3);
    const bd = F.burndown;
    const enCurso = F.wip.find((w) => w.id === 'en-curso');
    const blocked = F.items.filter((x) => x.blocked && x.sprintId === F.currentSprint);
    const M31 = F.milestones.t31;
    const pctP = round1(E.pctPlanned * 100), pctR = round1(E.pctComplete * 100);
    const informe = {
      numeroInforme: 'Informe quincenal No. 7 — corte del 9 de octubre de 2026',
      periodoInicio: '2026-09-24',
      fechaCorte: F.statusDate,
      destinatarios: 'Gerencia General, dueño del producto y comité de control de cambios',
      estadoGeneral: 'Amarillo — requiere atención',
      resumen: 'Al corte del ' + dl(F.statusDate) + ' (día 2 de la ' + it7.name.toLowerCase() + ') el proyecto lleva ' + n1(pctR) + ' % de avance frente a ' + n1(pctP) + ' % planificado (SPI ' + ix(E.spi) + ') y gasta algo más de lo previsto por el trabajo realizado (CPI ' + ix(E.cpi) + '). El release 1 está en producción desde el 10 de septiembre con ' + R1.prog.total + ' puntos. El release 2 lleva ' + R2.prog.done + ' de ' + R2.prog.total + ' puntos (' + pc(R2.prog.pct) + '): con la velocidad del release (' + nm(R2.forecast.velocity) + ' puntos por iteración) necesitaría ' + R2.forecast.sprintsNeeded + ' iteraciones más y terminaría el ' + dl(R2.forecast.finish) + ', después del 6 de noviembre. El dueño del producto decide el 14 de octubre entre diferir 8 puntos «Podría tener» (nivel 1) o tramitar una solicitud de cambio para mover la fecha del release 2 (nivel 2). El EAC de ' + ms(E.eac) + ' cabe en la reserva para contingencias.',
      logros: [
        'Release 1 en producción el 10 de septiembre: ' + R1.prog.total + ' puntos, con la integración de las básculas aprobada en el CC-001, sin cambio de fecha ni de presupuesto.',
        'Iteración 6 cerrada con ' + vel.rows[5].completed + ' de ' + vel.rows[5].committed + ' puntos: prefactura desde las actas, envío al proveedor tecnológico con CUFE y notas crédito.',
        'Primera factura electrónica aceptada por la DIAN en el ambiente de habilitación.',
        'Inventario de la bodega principal migrado con una diferencia de 0,4 % frente al conteo físico (meta: 0,5 % o menos).',
      ],
      avancePlanificado: pctP,
      avanceReal: pctR,
      hitos: rows('hi', [
        { hito: 'Contratos firmados con el fabricante y el socio implementador', fechaBase: F.milestones.t11.plan, fechaPronostico: F.milestones.t11.actual, estado: 'Cumplido', comentario: 'Dentro del presupuesto de la selección.' },
        { hito: 'Release 1 en producción', fechaBase: F.milestones.t29.plan, fechaPronostico: F.milestones.t29.actual, estado: 'Cumplido', comentario: 'Con la integración de las básculas (CC-001).' },
        { hito: 'Release 2 en producción', fechaBase: M31.plan, fechaPronostico: M31.forecast, estado: 'En riesgo', comentario: 'El cronograma actualizado al corte la mueve al ' + dlShort(M31.forecast) + '; por velocidad el release terminaría el ' + dlShort(R2.forecast.finish) + '. Depende de la decisión del 14 de octubre.' },
        { hito: 'Release 3 en producción', fechaBase: F.milestones.t33.plan, fechaPronostico: F.milestones.t33.forecast, estado: 'Pendiente', comentario: 'Fijado después del cierre anual; el release 3 tiene holgura hasta esa fecha.' },
        { hito: 'Cierre del proyecto', fechaBase: F.milestones.t06.plan, fechaPronostico: F.milestones.t06.forecast, estado: 'Pendiente', comentario: 'Después de la estabilización (hypercare).' },
      ]),
      valorGanado: rows('vg', F.evmRows.map((r) => ({ ...r }))),
      eacAdoptado: Math.round(E.eac / 1e5) * 1e5,
      fechaFinPronosticada: F.forecastFinish,
      analisisVariacion: 'SV de ' + ms(E.sv) + ': se concentra en el release 2 (avance ' + pc(R2.prog.pct) + ' frente a ' + pc(TE.t26.pv / TE.t26.cost) + ' planificado en la LB0) y en la migración de saldos de cartera, detenida por el auxiliar conciliado que falta (' + pc(TE.t18.ev / TE.t18.cost) + ' frente a ' + pc(TE.t18.pv / TE.t18.cost) + '). CV de ' + ms(E.cv) + ': horas adicionales del conector con el proveedor tecnológico en el release 2 (CV ' + ms(cv('t26')) + '), depuración de datos maestros (' + ms(cv('t16')) + ') y equipos de bodega por la tasa de cambio (' + ms(cv('t14')) + '); la suscripción, que se factura mes vencido, compensa en parte (' + ms(cv('t12')) + '). AgileEVM del release 2: PV ' + ms(R2.evm.pv) + ', EV ' + ms(R2.evm.ev) + ', AC ' + ms(R2.evm.ac) + ' (SPI ' + ix(R2.evm.spi) + ', CPI ' + ix(R2.evm.cpi) + ', EAC ' + ms(R2.evm.eac) + '). Se adopta el EAC típico (' + ms(E.eac) + ', TCPI ' + ix(E.tcpi) + ') porque los sobrecostos del conector y de la depuración reflejan el desempeño de las integraciones y migraciones que faltan. El cronograma actualizado al corte conserva el fin del ' + dl(F.forecastFinish) + ' porque la salida del release 3 está fijada después del cierre anual.',
      riesgosPrincipales: 'R-004, integración con la DIAN (alto, en parte materializado: caídas del ambiente de habilitación y HU-033 rechazada); R-008, velocidad insuficiente para el release 2 (alto, nuevo); R-001, calidad de datos para la migración de cartera (alto, en seguimiento); R-002, disponibilidad de los usuarios clave en noviembre (alto).',
      incidentesRelevantes: 'Abiertos: INC-003, auxiliar de cartera sin entregar (prioridad alta), que deja bloqueado ' + blocked.map((x) => x.code).join(', ') + ' en la iteración 7, e INC-002, caídas del ambiente de habilitación del proveedor tecnológico (en curso). Resuelto: INC-004, defecto crítico de producción DF-009, atendido el 9 de octubre por el carril de urgencia. La columna «En curso» del tablero está en su límite WIP (' + enCurso.count + ' de ' + enCurso.wip + '). Burndown de la iteración 7: ' + bd.remaining + ' de ' + bd.total + ' puntos por terminar (compromiso de ' + bd.committed + ').',
      cambiosPeriodo: 'Sin solicitudes de cambio en el periodo. Nivel 1: en la revisión de la iteración 6 el alcance del release 2 pasó de ' + R2.variance.baselinePoints + ' a ' + R2.prog.total + ' puntos (' + signedPct(R2.variance.scopePct) + ', dentro del umbral de ±10 %) por HU-041 y ME-009. El CC-001 (básculas, release 1) se aprobó el 13 de agosto.',
      proximosPasos: rows('pp', [
        { accion: 'Decidir si se difieren ME-005 y ME-006 al release 3 o si se tramita el cambio de fecha del release 2.', responsable: 'Dueño del producto', fecha: '2026-10-14' },
        { accion: 'Entregar el auxiliar de cartera conciliado a 30 de septiembre para desbloquear TA-011 y la migración de saldos.', responsable: 'Contador', fecha: '2026-10-13' },
        { accion: 'Acordar con el proveedor tecnológico el aviso automático de caídas del ambiente de habilitación.', responsable: ROLE.sm, fecha: '2026-10-14' },
        { accion: 'Programar la capacitación de usuarios finales del release 2 (29 de octubre a 6 de noviembre).', responsable: 'Dueño del producto', fecha: '2026-10-16' },
      ]),
      decisionesRequeridas: [
        'Alcance o fecha del release 2: diferir 8 puntos «Podría tener» al release 3 o aprobar el CC-002 para moverlo una iteración (decisión del 14 de octubre).',
        'Autorizar el uso de hasta ' + ms(Math.ceil((E.eac - E.bac) / 1e6) * 1e6) + ' de la reserva para contingencias si se confirma el EAC en el corte del 23 de octubre.',
      ],
    };

    /* ============================================================ entradas por plantilla */
    return {
      'acta-constitucion': { status: 'aprobado', rev: '1', date: F.lb0Date, created: F.start, titleBlock: { elaboro: ROLE.dir, reviso: 'Gerente administrativo y financiero', aprobo: ROLE.pat }, fields: actaFields,
        revs: [{ rev: '0', status: 'aprobado', date: F.start, note: 'Emisión inicial con el presupuesto preliminar de orden de magnitud.', fields: actaRev0 }, { rev: '1', status: 'aprobado', date: F.lb0Date, note: 'Actualizada con los contratos firmados, el presupuesto aprobado de ' + ms(F.budget) + ' y la LB0.' }] },
      'registro-interesados': { status: 'aprobado', rev: '2', date: '2026-09-11', created: '2026-05-05', titleBlock: { elaboro: ROLE.dir, reviso: 'Gerente administrativo y financiero', aprobo: ROLE.pat }, fields: interesadosFields,
        revs: [
          { rev: '0', status: 'aprobado', date: '2026-05-05', note: 'Emisión inicial después de la reunión de arranque.', fields: { ...cp(interesadosFields), interesados: stakeholders(0), fechaActualizacion: '2026-05-05', fuentes: 'Reunión de arranque, organigrama y entrevistas con las gerencias.' } },
          { rev: '1', status: 'aprobado', date: F.lb0Date, note: 'Se agregan el socio implementador, el fabricante del ERP y el proveedor tecnológico de facturación electrónica.', fields: { ...cp(interesadosFields), interesados: stakeholders(1), fechaActualizacion: F.lb0Date, fuentes: 'Talleres de descubrimiento de mayo de 2026, organigrama, contratos de suscripción e implementación y encuesta de preparación para el cambio.' } },
          { rev: '2', status: 'aprobado', date: '2026-09-11', note: 'Actitudes de almacén y bodega actualizadas después de la salida a producción del release 1.' },
        ] },
      'registro-riesgos': { status: 'aprobado', rev: '2', date: '2026-10-08', created: F.lb0Date, titleBlock: { elaboro: ROLE.dir, reviso: ROLE.sm, aprobo: ROLE.pat }, fields: riesgosFields,
        revs: [
          { rev: '0', status: 'aprobado', date: F.lb0Date, note: 'Emisión inicial con el plan para la dirección del proyecto y la LB0.', fields: { ...cp(riesgosFields), riesgos: riesgos(0).map((r) => ({ ...r, reserva: r.reserva * 1e6 })), fechaRevision: F.lb0Date, planesReserva: 'Reserva para contingencias de ' + ms(F.reserves.contingency) + ' distribuida por riesgo (columna «Reserva»). La reserva de gestión (' + ms(F.reserves.management) + ') solo la autoriza la Gerencia General.', listaVigilancia: 'Riesgos bajos en observación: tasa de cambio de los equipos importados; disponibilidad de salas de capacitación; renovación del certificado de firma digital en 2027.' } },
          { rev: '1', status: 'aprobado', date: '2026-08-14', note: 'Reevaluación con el CC-001 y la depuración de datos maestros del release 1.', fields: { ...cp(riesgosFields), riesgos: riesgos(1).map((r) => ({ ...r, reserva: r.reserva * 1e6 })), fechaRevision: '2026-08-14', planesReserva: 'Reserva para contingencias de ' + ms(F.reserves.contingency) + ' distribuida por riesgo (columna «Reserva»); no se ha usado. La reserva de gestión (' + ms(F.reserves.management) + ') solo la autoriza la Gerencia General.', listaVigilancia: 'Riesgos bajos en observación: tasa de cambio de los equipos importados (materializado en julio, sin compras pendientes); disponibilidad de salas de capacitación; renovación del certificado de firma digital en 2027.' } },
          { rev: '2', status: 'aprobado', date: '2026-10-08', note: 'Reevaluación después de la revisión de la iteración 6: nuevo R-008 (velocidad del release 2) y redistribución de la reserva sin aumentarla.' },
        ] },
      'plan-gestion-cambios': { status: 'aprobado', rev: '0', date: F.lb0Date, created: '2026-07-01', titleBlock: { elaboro: ROLE.dir, reviso: 'Gerente administrativo y financiero', aprobo: ROLE.pat }, fields: cambiosPlan },
      'vision-producto': { status: 'aprobado', rev: '0', date: F.lb0Date, created: '2026-06-23', titleBlock: { elaboro: 'Gerente administrativo y financiero', reviso: ROLE.dir, aprobo: ROLE.pat }, fields: vision },
      'definicion-terminado': { status: 'aprobado', rev: '1', date: dod.fechaAcuerdo, created: F.lb0Date, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: 'Gerente administrativo y financiero' }, fields: dod,
        revs: [{ rev: '0', status: 'aprobado', date: F.lb0Date, note: 'Acuerdo inicial antes de la iteración 1.', fields: dodRev0 }, { rev: '1', status: 'aprobado', date: dod.fechaAcuerdo, note: 'Retrospectiva de la iteración 3: prueba con datos migrados y columna «Pruebas de usuario».' }] },
      'plan-release': { status: 'aprobado', rev: '2', date: it6.start, created: '2026-07-01', titleBlock: { elaboro: 'Gerente administrativo y financiero', reviso: ROLE.sm, aprobo: ROLE.pat }, fields: planAt(it6.start, 2),
        revs: [
          { rev: '0', status: 'aprobado', date: F.lb0Date, note: 'Plan inicial aprobado con la LB0.', fields: planAt(F.lb0Date, 0) },
          { rev: '1', status: 'aprobado', date: F.cc1Date, note: 'CC-001: el release 1 pasa a ' + R1.prog.total + ' puntos con la integración de las básculas.', fields: planAt(F.cc1Date, 1) },
          { rev: '2', status: 'aprobado', date: it6.start, note: 'Hoja de ruta después del release 1 y de la línea base del release 2.' },
        ] },
      'planificacion-sprint': { instances: [
        { key: 'it6', title: 'Planificación de la iteración — ' + it6.name, status: 'aprobado', rev: '0', date: it6.start, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: 'Gerente administrativo y financiero' }, fields: it6Plan },
        { key: 'it7', title: 'Planificación de la iteración — ' + it7.name, status: 'aprobado', rev: '0', date: it7.start, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: 'Gerente administrativo y financiero' }, fields: it7Plan },
      ] },
      'acta-revision-sprint': { instances: [
        { key: 'it5', title: 'Acta de revisión de la iteración — ' + it5.name, status: 'aprobado', rev: '0', date: it5.end, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: 'Gerente administrativo y financiero' }, fields: it5Review },
        { key: 'it6', title: 'Acta de revisión de la iteración — ' + it6.name, status: 'aprobado', rev: '0', date: it6.end, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: 'Gerente administrativo y financiero' }, fields: it6Review },
      ] },
      'retrospectiva': { instances: [
        { key: 'it5', title: 'Retrospectiva de la iteración — ' + it5.name, status: 'aprobado', rev: '0', date: it5.end, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: ROLE.sm }, fields: it5Retro },
        { key: 'it6', title: 'Retrospectiva de la iteración — ' + it6.name, status: 'aprobado', rev: '0', date: it6.end, titleBlock: { elaboro: ROLE.sm, reviso: 'Equipo de desarrollo', aprobo: ROLE.sm }, fields: it6Retro },
      ] },
      'registro-incidentes': { status: 'revision', rev: 'B', date: F.statusDate, created: '2026-07-22', titleBlock: { elaboro: ROLE.sm, reviso: ROLE.dir, aprobo: '' }, fields: incidentesFields,
        revs: [{ rev: 'A', status: 'revision', date: '2026-07-24', note: 'Primera emisión con el INC-001.', fields: { ...cp(incidentesFields), incidentes: incidentesFields.incidentes.slice(0, 1) } }] },
      'registro-lecciones': { status: 'revision', rev: 'B', date: '2026-10-08', created: '2026-06-22', titleBlock: { elaboro: ROLE.sm, reviso: ROLE.dir, aprobo: '' }, fields: leccionesFields,
        revs: [{ rev: 'A', status: 'revision', date: '2026-09-11', note: 'Primera emisión para revisión: selección, CC-001, depuración de datos, retrospectiva 3 y salida del release 1.', fields: { ...cp(leccionesFields), lecciones: leccionesAll.filter((l) => l.fecha <= '2026-09-11') } }] },
      'registro-cambios': { status: 'revision', rev: '1A', date: '2026-10-08', created: F.cc1Request, titleBlock: { elaboro: ROLE.sm, reviso: ROLE.dir, aprobo: '' }, fields: registroCambiosFields,
        revs: [{ rev: '0', status: 'aprobado', date: F.cc1Date, note: 'Emisión con la decisión del CC-001.', fields: registroCambiosRev0 }] },
      'solicitud-cambio': { instances: [
        { key: 'cc001', title: 'Solicitud de cambio CC-001 — ' + relName('rel-1'), status: 'aprobado', rev: '0', date: F.cc1Date, created: F.cc1Request, titleBlock: { elaboro: ROLE.sm, reviso: ROLE.dir, aprobo: ROLE.ccb }, fields: solicitud },
      ] },
      'informe-desempeno': { instances: [
        { key: 'corte-2026-10-09', title: 'Informe de desempeño del trabajo — corte del 9 de octubre de 2026', status: 'revision', rev: 'A', date: F.statusDate, titleBlock: { elaboro: ROLE.dir, reviso: 'Gerente administrativo y financiero', aprobo: '' }, fields: informe },
      ] },
    };
  };
})();

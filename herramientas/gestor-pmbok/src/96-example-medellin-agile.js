/* ==========================================================================
   96-example-medellin-agile.js — capa ágil del ejemplo «Edificio Atalaya del
   Occidente» (Medellín): enfoque híbrido (SPEC §9.7).
   La estructuración, los diseños y las licencias, la obra y la entrega siguen
   en cascada; desde marzo de 2026 los canales digitales de venta del paquete
   1.4.2 «Mercadeo y publicidad» se gestionan con Scrum y tablero Kanban: un
   release de 12 iteraciones de 20 días hábiles (calendario del proyecto, lunes
   a sábado con festivos de Colombia) con un presupuesto que es una parte del
   rubro de publicidad y mercadeo de la actividad C02.

   Reglas de la capa (las cifras del proyecto no cambian):
   - El release se vincula a la actividad C02D del cronograma (release.taskId),
     definida en 91-example-medellin.js: del 2 de marzo al 23 de diciembre de 2026
     en el paquete 1.4.2, en la LB1 y con costo 0. Su avance sale del backlog
     (PM.agile.applyToSchedule) y es igual al guardado en cada corte; el Gantt
     muestra el release con sus iteraciones y el pronóstico por velocidad. El
     presupuesto sigue en C02 (agrupa también medios, eventos y alianzas y se mide
     por nivel de esfuerzo), así que el valor ganado del proyecto (PV, EV, AC, SPI,
     CPI, EAC) es idéntico.
   - Su costo real sale de los registros mensuales de C02 de marzo a septiembre
     de 2026, divididos en dos líneas de la misma factura (mismo día, misma
     actividad, misma suma): la parte digital lleva releaseId.
   - El release se vincula al entregable 1.4.2 (wbsId 'w142'). El paquete tiene
     gasto que no es del release (medios, eventos y alianzas desde mayo de
     2025); como el release tiene registros marcados con releaseId, el núcleo
     (PM.agile.releaseActualCost) solo le imputa esos.

   Expone PM.exampleAgile.medellin(ctx) → {lifecycle, description, wbs, agile,
   backlog, actuals(list), raci(base), facts}; 91-example-medellin.js lo
   incorpora al construir el ejemplo. Agrega a PM.exampleDocs.medellin los
   documentos ágiles (visión, definición de listo y de terminado, plan de
   releases, planificación de las iteraciones 8 y 9, revisión y retrospectiva
   de la iteración 8) y envía las lecciones de esa retrospectiva al registro de
   lecciones aprendidas. Todo es determinista; personas por su rol.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM) return;

  const M = 1e6;
  const CUT = '2026-09-30';
  const REL = 'rel-canales-e2';
  const RELEASE_TASK = 'C02D';   /* actividad del cronograma que representa el release (91-example-medellin.js) */
  const RELEASE_WBS = 'w142';
  const WBS = 'w142';
  const BASELINE_DATE = '2026-02-27';

  /* ---------------------------------------------------------------- roles */
  const R = {
    jun: 'Junta directiva del promotor', ger: 'Gerente de proyecto', com: 'Gerente comercial', abo: 'Abogado del proyecto',
    po: 'Gerente comercial (dueño del producto)', sm: 'Coordinador de mercadeo digital (Scrum Master / facilitador)',
    eq: 'Equipo digital de la agencia y analista de CRM', con: 'Director de obra (constructor)',
  };
  const WHO = {
    web: 'Desarrollador web de la agencia', dis: 'Diseñador de contenidos de la agencia', pau: 'Especialista en pauta digital de la agencia',
    crm: 'Analista de CRM', coo: 'Coordinador de mercadeo digital',
  };

  /* ---------------------------------------------------------------- tablero y release */
  const COLUMNS = [
    { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null },
    { id: 'en-produccion', name: 'En producción', category: 'en-curso', wip: 4 },
    { id: 'aprobacion', name: 'Aprobación comercial y legal', category: 'en-curso', wip: 3 },
    { id: 'publicado', name: 'Publicado', category: 'terminado', wip: null },
  ];
  const SETTINGS = { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 20, columns: COLUMNS, scopeChangeThreshold: 10 };
  const RELEASE_NAME = 'Canales digitales de venta — etapa 2';
  const RELEASE_GOAL = 'Que los canales digitales atraigan, califiquen y lleven a la separación a los hogares compradores de la etapa 2 y del inventario de la etapa 1 hasta llegar al 60 % de las preventas de la etapa 2 (125 viviendas), con al menos 40 % de las ventas originadas en canales digitales y un costo de pauta por venta de COP 2,8 millones o menos, con publicidad veraz y datos personales tratados con autorización.';
  const BUDGET = 245 * M;
  const BASE_POINTS = 213;
  const RELEASE_START = '2026-03-02';
  const RELEASE_END = '2026-12-23';
  const PLANNED_SPRINTS = 12;

  /* Iteraciones de 20 días hábiles: [número, inicio, fin, objetivo, estado, capacidad, comprometido, terminado, no terminados, notas] */
  const SPRINTS = [
    [1, '2026-03-02', '2026-03-25', 'Poner en línea la campaña de la etapa 2 con medición desde el primer día y la página de la tipología B.', 'cerrado', 20, 21, 13, ['HU-001'], 'HU-001 pasó a la iteración 2: el inventario por piso de la comercializadora llegó el 23 de marzo.'],
    [2, '2026-03-26', '2026-04-20', 'Publicar la disponibilidad de la etapa 2 y la página de la tipología C con la política de tratamiento de datos.', 'cerrado', 20, 21, 16, ['HU-005'], 'HU-005 pasó a la iteración 3: el texto de la autorización de datos esperó la aprobación del abogado del proyecto.'],
    [3, '2026-04-21', '2026-05-14', 'Llevar al CRM todos los prospectos con su autorización de datos y su canal de origen.', 'cerrado', 18, 18, 18, [], ''],
    [4, '2026-05-15', '2026-06-09', 'Asignar y calificar cada prospecto en menos de una hora hábil y publicar la página VIS.', 'cerrado', 20, 23, 18, ['HU-012'], 'HU-012 pasó a la iteración 5: la comercializadora pidió agregar la etapa «visita» al embudo.'],
    [5, '2026-06-10', '2026-07-04', 'Ver el embudo de ventas por canal y ofrecer el simulador de cuota.', 'cerrado', 19, 19, 19, [], ''],
    [6, '2026-07-06', '2026-07-29', 'Mostrar los apartamentos B y C en 360° y corregir la autorización de datos de la mensajería.', 'cerrado', 21, 21, 21, [], ''],
    [7, '2026-07-30', '2026-08-24', 'Simular el subsidio VIS y abrir la disponibilidad en línea.', 'cerrado', 20, 24, 16, ['HU-025'], 'HU-025 pasó a la iteración 8: la sincronización del inventario con la comercializadora tomó más de lo previsto.'],
    [8, '2026-08-25', '2026-09-16', 'Medir el costo por separación de cada canal y permitir el bloqueo en línea de un apartamento por 48 horas.', 'cerrado', 19, 19, 19, [], ''],
    [9, '2026-09-17', '2026-10-09', 'Permitir que el comprador solicite en línea la preaprobación de su crédito y se vincule al encargo fiduciario.', 'en-curso', 23, 23, null, [], 'Capacidad con un segundo desarrollador de la agencia en septiembre y octubre. HU-035 (lista de precios del CC-004) entró el 25 de septiembre con la iteración iniciada.'],
    [10, '2026-10-10', '2026-11-04', 'Recibir la cuota de separación en el encargo fiduciario y llevar prospectos preaprobados a la feria de vivienda.', 'planeado', 19, null, null, [], ''],
    [11, '2026-11-05', '2026-11-28', 'Atribuir las ventas a su canal y publicar los contenidos de avance de obra para compradores.', 'planeado', 19, null, null, [], ''],
    [12, '2026-11-30', '2026-12-23', 'Avance de obra en el portal del comprador y cierre del release.', 'planeado', 19, null, null, [], ''],
  ];
  const spId = (n) => 'spr-cd-' + String(n).padStart(2, '0');
  const spOf = (n) => SPRINTS.find((s) => s[0] === n);

  /* ---------------------------------------------------------------- backlog del producto
     E(código, título, descripción, valor) — épicas.
     I(código, tipo, épica, título, estimación, prioridad, valor, responsable, iteración, estado, descripción, criterios, opciones)
     estado: 'AAAA-MM-DD' (publicado ese día) | 'en-produccion' | 'aprobacion' | 'backlog'.
     opciones: created (si es posterior a la línea base), from (iteración donde empezó si pasó a otra), added (entró con la
     iteración iniciada), prod / aprob (fechas de paso), blocked, release:false, tags. */
  const EPICS = [];
  const ITEMS = [];
  const E = (code, title, description, value) => EPICS.push({ code, title, description, value });
  const I = (code, type, epic, title, estimate, priority, value, assignee, sprint, state, description, acceptance, o) => ITEMS.push({ code, type, epic, title, estimate, priority, value, assignee, sprint, state, description, acceptance, o: o || {} });
  const MUST = 'Debe tener', SHOULD = 'Debería tener', COULD = 'Podría tener', WONT = 'No en este release';

  E('EP-001', 'Sitio web y páginas por tipología (VIS y No VIS)', 'Páginas de la etapa 2 y de cada tipología con disponibilidad, planos, áreas privada y construida, acabados y precios de la lista vigente, más la página VIS para el inventario de la etapa 1.', 9);
  E('EP-002', 'Recorrido virtual 360° y apartamento modelo digital', 'Recorridos 360° del apartamento modelo y de las tipologías B y C, zonas comunes y vistas desde el piso, para que el hogar conozca los espacios sin ir a la sala de ventas.', 8);
  E('EP-003', 'CRM y embudo de ventas con calificación de prospectos', 'Registro automático de prospectos con su autorización de datos, asignación a asesores, calificación y embudo de ventas por canal y tipología.', 10);
  E('EP-004', 'Pauta digital y medición del costo por prospecto y por venta', 'Campañas en buscadores y redes sociales por tipología, etiquetas de conversión y tablero de costo por prospecto, por visita y por separación de cada canal.', 9);
  E('EP-005', 'Simulador de crédito y subsidios para vivienda VIS', 'Simulación de la cuota con crédito hipotecario o leasing habitacional, del subsidio de la caja de compensación para VIS y solicitud de preaprobación con los bancos aliados.', 8);
  E('EP-006', 'Separación en línea con el encargo fiduciario', 'Disponibilidad en línea, bloqueo temporal, vinculación digital al encargo fiduciario con SARLAFT, firma electrónica y pago de la cuota de separación al encargo.', 9);
  E('EP-007', 'Contenidos de avance de obra para compradores', 'Fotos, videos, boletín y portal con el avance de obra por bloque, validados por el director de obra y la supervisión técnica independiente.', 6);

  /* EP-001 · Sitio web y páginas por tipología */
  I('HU-001', 'historia', 'EP-001', 'Página de la etapa 2 con disponibilidad por bloque, piso y tipología', 8, MUST, 9, WHO.web, 2, '2026-04-08',
    'Como hogar interesado en la etapa 2 quiero ver qué apartamentos de los bloques C y D siguen disponibles por piso y tipología para elegir uno antes de visitar la sala de ventas.',
    'Muestra la disponibilidad de los bloques C y D por piso y tipología con el inventario diario de la comercializadora; los apartamentos separados o vendidos aparecen como no disponibles; precio desde con la fecha de la lista vigente; se lee bien en celulares; tiene aprobación comercial y legal antes de publicarse.', { from: 1, tags: ['etapa 2', 'sitio web'] });
  I('HU-002', 'historia', 'EP-001', 'Página de la tipología B (58 m²) con planos, áreas y acabados', 5, MUST, 8, WHO.dis, 1, '2026-03-24',
    'Como hogar comprador quiero conocer la tipología B con su plano, sus áreas y sus acabados para compararla con mi presupuesto.',
    'Plano con cotas, área privada y área construida, alcobas y baños, acabados de entrega y precio desde con la fecha de la lista; los renders llevan la leyenda «Imágenes de referencia» (Ley 1480 de 2011); el botón de contacto lleva al formulario con autorización de datos.', { tags: ['tipología B', 'Ley 1480'] });
  I('HU-003', 'historia', 'EP-001', 'Página de la tipología C (68 m²) con planos, áreas y acabados', 5, MUST, 8, WHO.dis, 2, '2026-04-17',
    'Como hogar comprador quiero conocer la tipología C de tres alcobas con su plano, sus áreas y sus acabados para decidir si me conviene.',
    'Plano con cotas, área privada y área construida, tres alcobas y dos baños, acabados de entrega y precio desde con la fecha de la lista; renders con la leyenda «Imágenes de referencia» (Ley 1480 de 2011); botón de contacto con autorización de datos.', { tags: ['tipología C', 'Ley 1480'] });
  I('HU-004', 'historia', 'EP-001', 'Página de la tipología A (VIS de 50 m²) para el inventario de la etapa 1', 5, SHOULD, 7, WHO.dis, 4, '2026-06-02',
    'Como hogar con ingresos de hasta 4 SMMLV quiero conocer las viviendas VIS que quedan en la etapa 1 y sus condiciones para saber si puedo comprar con subsidio.',
    'Precio pactado en pesos por debajo del tope VIS de 150 SMMLV, cuota inicial del 20 %, requisitos del subsidio de la caja de compensación y enlace al simulador; no ofrece subsidios sin asignaciones vigentes; aprobación comercial y legal.', { tags: ['VIS', 'tipología A'] });
  I('HU-005', 'historia', 'EP-001', 'Formulario de contacto con autorización de tratamiento de datos personales', 5, MUST, 9, WHO.web, 3, '2026-05-06',
    'Como gerente comercial quiero que cada prospecto deje sus datos con autorización para contactarlo sin incumplir la ley de protección de datos personales.',
    'Autorización previa, expresa e informada con sus finalidades (contacto comercial, envío de información del proyecto y análisis de la demanda), casilla sin marcar por defecto, enlace al aviso de privacidad y a la política de tratamiento (Ley 1581 de 2012); la evidencia (fecha, hora y texto aceptado) queda en el CRM; el prospecto elige los canales por los que acepta ser contactado.', { from: 2, tags: ['Ley 1581', 'formulario'] });
  I('HU-006', 'historia', 'EP-001', 'Comparador de las tipologías B y C (áreas, precio y cuota mensual)', 5, COULD, 4, WHO.web, null, 'backlog',
    'Como hogar comprador quiero comparar lado a lado las tipologías B y C para decidir cuál me conviene.',
    'Compara área privada y construida, alcobas, precio desde con la fecha de la lista y cuota mensual estimada con el simulador; aprobación comercial y legal.', { tags: ['tipologías'] });
  I('TA-001', 'tarea', 'EP-001', 'Leyendas legales de publicidad de vivienda en el sitio y en las piezas', 3, MUST, 8, WHO.dis, 3, '2026-04-30',
    'Plantillas de leyendas para todas las páginas y piezas: imágenes de referencia, áreas, vigencia de la lista de precios y condiciones de las promociones.',
    'Leyendas aprobadas por el abogado del proyecto: «Imágenes de referencia», área privada y área construida, precio desde con la fecha de la lista, y vigencia, cantidades y restricciones de las promociones (Ley 1480 de 2011); aplicadas en las plantillas del sitio y de la pauta.', { tags: ['Ley 1480'] });

  /* EP-002 · Recorrido virtual 360° y apartamento modelo digital */
  I('IN-001', 'investigacion', 'EP-002', 'Investigar proveedores y costos de recorridos virtuales 360°', 2, SHOULD, 5, WHO.coo, 3, '2026-04-24',
    'Comparar al menos tres opciones de recorrido 360° (fotografía del apartamento modelo y modelos 3D desde los planos) en costo, plazo y desempeño en celulares.',
    'Cuadro comparativo con costo, plazo, peso en celulares y licencias de uso; recomendación aprobada por el dueño del producto.', { tags: ['360°'] });
  I('HU-007', 'historia', 'EP-002', 'Recorridos virtuales 360° de las tipologías B y C', 13, MUST, 9, WHO.dis, 6, '2026-07-28',
    'Como hogar comprador quiero recorrer en 360° los apartamentos B y C desde el celular para entender los espacios sin ir a la sala de ventas.',
    'Recorrido del apartamento modelo (tipología C) y modelo 3D de la tipología B con los acabados de entrega; carga en menos de 5 segundos en celulares; leyenda «Imágenes de referencia» y acabados opcionales identificados como tales (Ley 1480 de 2011); botón para agendar la visita a la sala.', { tags: ['360°', 'Ley 1480'] });
  I('HU-008', 'historia', 'EP-002', 'Vista desde el piso y orientación de cada apartamento', 5, COULD, 4, WHO.dis, null, 'backlog',
    'Como hogar comprador quiero ver la vista desde el piso y la orientación del apartamento que me interesa.',
    'Fotografías con dron a la altura de los pisos 2, 5 y 8 de los bloques C y D, tomadas por un operador registrado ante la Aeronáutica Civil; leyenda de que la vista puede cambiar con construcciones futuras.', { tags: ['360°'] });
  I('HU-033', 'historia', 'EP-002', 'Recorrido virtual 360° de las zonas comunes (plataforma, salón social y gimnasio)', 5, SHOULD, 6, WHO.dis, 7, '2026-08-14',
    'Como hogar comprador quiero ver las zonas comunes que tendrá el edificio para valorar lo que incluye mi compra.',
    'Modelo 3D de la plataforma, el salón social y el gimnasio según los planos aprobados en la licencia; leyenda «Imágenes de referencia»; no muestra dotación que no esté en el presupuesto del proyecto.', { created: '2026-07-29', tags: ['360°', 'zonas comunes'] });

  /* EP-003 · CRM y embudo de ventas */
  I('HU-009', 'historia', 'EP-003', 'Registrar automáticamente en el CRM los prospectos del sitio, las redes sociales y la mensajería', 8, MUST, 10, WHO.crm, 3, '2026-05-13',
    'Como asesor comercial quiero recibir en el CRM cada prospecto con su canal de origen para atenderlo sin digitarlo.',
    'Los prospectos del formulario, de los anuncios en redes sociales y de la mensajería entran al CRM en menos de 5 minutos con canal, campaña y tipología de interés; sin duplicados por celular o correo; solo se registran prospectos con autorización de datos.', { tags: ['CRM'] });
  I('HU-010', 'historia', 'EP-003', 'Asignar cada prospecto a un asesor por turnos con respuesta en menos de una hora hábil', 5, MUST, 9, WHO.crm, 4, '2026-05-27',
    'Como gerente comercial quiero que cada prospecto tenga un asesor responsable desde que llega para responderle a tiempo.',
    'Asignación por turnos entre los asesores de la sala; alerta al coordinador si un prospecto no recibe respuesta en una hora hábil; el tiempo de primera respuesta se mide en el tablero.', { tags: ['CRM'] });
  I('HU-011', 'historia', 'EP-003', 'Calificar prospectos según ingresos, cuota inicial, preaprobación y plazo de compra', 8, MUST, 9, WHO.crm, 4, '2026-06-05',
    'Como asesor comercial quiero saber qué prospectos tienen más probabilidad de comprar para atenderlos primero.',
    'Puntaje de 0 a 100 con reglas acordadas con la comercializadora; prospecto calificado desde 60 puntos; el asesor ve el puntaje y su explicación; la calificación no usa datos sensibles (Ley 1581 de 2012).', { tags: ['CRM', 'Ley 1581'] });
  I('HU-012', 'historia', 'EP-003', 'Embudo de ventas por etapa en el CRM (prospecto, calificado, visita, separación y promesa)', 5, MUST, 8, WHO.crm, 5, '2026-06-19',
    'Como gerente comercial quiero ver cuántos prospectos pasan de una etapa a la siguiente por canal y tipología para saber dónde se pierden las ventas.',
    'Cada prospecto tiene una etapa y la fecha de cada cambio; el embudo muestra la conversión entre etapas por canal y por tipología; las separaciones cuadran con las registradas por la comercializadora.', { from: 4, tags: ['CRM'] });
  I('HU-013', 'historia', 'EP-003', 'Recordatorios del CRM solo por los canales autorizados y en el horario permitido', 3, MUST, 7, WHO.crm, 5, '2026-06-26',
    'Como prospecto quiero que me contacten solo por los canales que autoricé y en horas razonables.',
    'Mensajes y llamadas programados solo por los canales autorizados y en el horario de la Ley 2300 de 2023 (lunes a viernes de 7:00 a. m. a 7:00 p. m. y sábados de 8:00 a. m. a 3:00 p. m.; nunca domingos ni festivos); si el prospecto pide no ser contactado, el CRM lo respeta.', { tags: ['CRM', 'Ley 2300'] });
  I('HU-014', 'historia', 'EP-003', 'Secuencia de seguimiento a prospectos calificados que no agendan visita', 5, SHOULD, 6, WHO.crm, null, 'backlog',
    'Como asesor comercial quiero que el CRM recuerde a los prospectos calificados que aún no visitan la sala para no perderlos.',
    'Tres mensajes en dos semanas con contenido por tipología; se detiene al agendar la visita o si el prospecto pide no recibir más mensajes; respeta el horario y los canales autorizados.', { tags: ['CRM'] });
  I('TA-002', 'tarea', 'EP-003', 'Política de tratamiento de datos, aviso de privacidad y registro de la base de prospectos en el RNBD', 3, MUST, 8, WHO.coo, 2, '2026-04-10',
    'Documentos y trámites para tratar los datos de los prospectos con autorización y con las garantías de la Ley 1581 de 2012.',
    'Política de tratamiento y aviso de privacidad aprobados por el abogado del proyecto y publicados en el sitio; base de prospectos inscrita en el Registro Nacional de Bases de Datos de la Superintendencia de Industria y Comercio; procedimiento para consultas y reclamos de los titulares.', { tags: ['Ley 1581'] });
  I('HU-032', 'historia', 'EP-003', 'Formulario de referidos para compradores de la etapa 1', 5, SHOULD, 6, WHO.web, null, 'backlog',
    'Como comprador de la etapa 1 quiero referir a un familiar o a un amigo interesado en la etapa 2 para que lo atiendan.',
    'El referido confirma su propia autorización de datos con un mensaje antes de entrar al CRM (Ley 1581 de 2012); el CRM marca el canal «Referido»; los beneficios por referido se publican con sus condiciones y vigencia (Ley 1480 de 2011).', { created: '2026-05-14', tags: ['referidos', 'Ley 1581'] });
  I('DF-001', 'defecto', 'EP-003', 'La autorización de datos no se guardaba cuando el prospecto llegaba por la mensajería', 3, MUST, 9, WHO.crm, 6, '2026-07-10',
    'En junio, 37 prospectos que llegaron por la mensajería entraron al CRM sin la evidencia de su autorización de tratamiento de datos.',
    'Todo prospecto de la mensajería recibe el aviso de privacidad y acepta la autorización antes de registrarse; los 37 prospectos sin evidencia se contactaron para pedirla o se suprimieron; prueba con 20 casos.', { created: '2026-06-30', tags: ['Ley 1581', 'CRM'] });

  /* EP-004 · Pauta digital y medición */
  I('TA-003', 'tarea', 'EP-004', 'Etiquetas de conversión y parámetros de campaña en el sitio y el CRM', 3, MUST, 8, WHO.pau, 1, '2026-03-06',
    'Medición de las conversiones de cada anuncio desde el sitio hasta el CRM.',
    'Cada anuncio lleva parámetros de campaña; el sitio registra las conversiones (formulario, mensajería y agendamiento de visita); el aviso de cookies permite rechazar las de publicidad.', { tags: ['pauta', 'medición'] });
  I('HU-015', 'historia', 'EP-004', 'Campaña de la etapa 2 en buscadores y redes sociales por tipología', 5, MUST, 9, WHO.pau, 1, '2026-03-12',
    'Como gerente comercial quiero pauta digital de la etapa 2 segmentada por tipología para atraer hogares que puedan comprar.',
    'Anuncios por tipología con piezas aprobadas por el gerente comercial y el abogado del proyecto; precio desde con la fecha de la lista y leyendas de publicidad de vivienda; presupuesto mensual de pauta dentro del presupuesto del release; medición desde el primer día.', { tags: ['pauta', 'Ley 1480'] });
  I('HU-016', 'historia', 'EP-004', 'Tablero de costo por prospecto, por visita y por separación de cada canal', 8, MUST, 10, WHO.pau, 8, '2026-09-15',
    'Como gerente comercial quiero saber cuánto cuesta cada prospecto, cada visita y cada separación por canal para invertir donde se vende más barato.',
    'Cruza la inversión mensual de pauta con los prospectos, las visitas y las separaciones del CRM; muestra el costo por prospecto calificado y por separación por canal y tipología; las ventas cuadran con las certificadas por la fiduciaria en el último corte.', { tags: ['medición'] });
  I('HU-017', 'historia', 'EP-004', 'Atribuir cada separación al canal digital de origen del prospecto', 5, MUST, 8, WHO.crm, null, 'backlog',
    'Como gerente comercial quiero saber qué canal originó cada venta para medir el costo por venta de forma confiable.',
    'Aplica la regla de atribución adoptada en IN-003 (último canal digital en los 30 días anteriores a la visita); las separaciones sin rastro digital quedan como «Sala de ventas»; informe mensual por canal.', { tags: ['medición', 'CRM'] });
  I('HU-018', 'historia', 'EP-004', 'Campañas por tipología con reasignación mensual del presupuesto de pauta', 5, SHOULD, 7, WHO.pau, null, 'backlog',
    'Como gerente comercial quiero mover cada mes la pauta hacia las campañas que venden más barato.',
    'Cada mes el presupuesto de pauta se reasigna a las campañas con menor costo por separación sin superar el presupuesto del release; la reasignación queda registrada con su justificación.', { tags: ['pauta'] });
  I('HU-019', 'historia', 'EP-004', 'Anuncios de recordación para visitantes del sitio y de los recorridos', 5, COULD, 4, WHO.pau, null, 'backlog',
    'Como gerente comercial quiero volver a mostrar el proyecto a quienes ya lo visitaron en línea.',
    'Solo para visitantes que aceptaron las cookies de publicidad; frecuencia máxima semanal por persona; piezas con aprobación comercial y legal.', { tags: ['pauta'] });
  I('HU-020', 'historia', 'EP-004', 'Campaña para la feria de vivienda con la caja de compensación y los bancos aliados', 5, MUST, 8, WHO.pau, null, 'backlog',
    'Como gerente comercial quiero llevar a la feria de vivienda prospectos con crédito preaprobado para cerrar ventas antes del punto de equilibrio de la etapa 2.',
    'Invitación a prospectos calificados con preaprobación o simulación; agenda por franjas; piezas con las condiciones, vigencia y restricciones de los beneficios de la feria (Ley 1480 de 2011); medición de asistentes y separaciones.', { tags: ['pauta', 'feria'] });
  I('IN-003', 'investigacion', 'EP-004', 'Investigar la atribución de ventas cuando el prospecto visita la sala después de ver un anuncio', 3, SHOULD, 6, WHO.coo, 8, '2026-08-28',
    'Comparar reglas de atribución con los datos de junio a agosto para medir el costo por venta de cada canal.',
    'Tres reglas comparadas con los datos de junio a agosto; recomendación aprobada por el dueño del producto y por la comercializadora.', { created: '2026-08-24', tags: ['medición'] });

  /* EP-005 · Simulador de crédito y subsidios VIS */
  I('HU-021', 'historia', 'EP-005', 'Simulador de cuota mensual con crédito hipotecario y leasing habitacional', 8, MUST, 9, WHO.web, 5, '2026-07-03',
    'Como hogar comprador quiero estimar la cuota mensual de mi crédito o de mi leasing para saber si puedo pagar el apartamento.',
    'Calcula la cuota con la tasa de referencia de los bancos aliados, el plazo y la cuota inicial (20 % en VIS y 30 % en No VIS); aclara que es una simulación y que la tasa la fija el banco; no guarda datos sin autorización.', { tags: ['simulador'] });
  I('HU-022', 'historia', 'EP-005', 'Simulador VIS con el subsidio de la caja de compensación según los ingresos del hogar', 8, MUST, 8, WHO.web, 7, '2026-08-21',
    'Como hogar con ingresos de hasta 4 SMMLV quiero saber cuánto subsidio podría recibir y cuánto me falta para la cuota inicial.',
    'Estima el subsidio de la caja según los ingresos del hogar en SMMLV y el valor que falta para la cuota inicial; muestra solo programas con asignaciones vigentes (Mi Casa Ya aparece como no disponible en 2026); textos con aprobación legal.', { tags: ['VIS', 'simulador'] });
  I('HU-023', 'historia', 'EP-005', 'Validar que el precio VIS simulado no supere el tope de 150 SMMLV del año de escrituración', 3, MUST, 7, WHO.web, 7, '2026-08-06',
    'Como gerente comercial quiero que el simulador advierta si una vivienda VIS supera el tope legal para no ofrecer condiciones que el comprador no podrá usar.',
    'Con el SMMLV vigente, el simulador advierte si el precio de una vivienda VIS supera el tope de 150 SMMLV (Ley 2294 de 2023, art. 293); el SMMLV se actualiza cada enero.', { tags: ['VIS'] });
  I('HU-024', 'historia', 'EP-005', 'Solicitar la preaprobación del crédito con los bancos aliados desde el simulador', 8, MUST, 9, WHO.crm, 9, '2026-09-29',
    'Como hogar comprador quiero pedir la preaprobación de mi crédito desde el simulador para separar con más seguridad.',
    'El hogar envía su solicitud a uno o más bancos aliados con autorización expresa para compartir sus datos con cada banco (Ley 1581 de 2012); el CRM registra la respuesta del banco y avisa al asesor.', { tags: ['simulador', 'Ley 1581'] });
  I('HU-035', 'historia', 'EP-005', 'Publicar la lista de precios de la etapa 2 con el alza del 3 % y la cuota inicial flexible a 24 meses (CC-004)', 3, MUST, 9, WHO.web, 9, 'aprobacion',
    'Como gerente comercial quiero que las páginas y el simulador muestren las condiciones de venta aprobadas en el CC-004 desde el 1 de octubre de 2026.',
    'Desde el 1 de octubre de 2026, páginas y simulador con la nueva lista de la etapa 2 y su fecha de vigencia; cuota inicial a 24 meses con sus condiciones; las piezas con la lista anterior se retiran el 30 de septiembre; aprobación comercial y legal.', { created: '2026-09-25', added: '2026-09-25', prod: '2026-09-25', aprob: '2026-09-29', tags: ['precios', 'Ley 1480'] });

  /* EP-006 · Separación en línea con el encargo fiduciario */
  I('IN-002', 'investigacion', 'EP-006', 'Investigar con la fiduciaria la vinculación digital al encargo fiduciario y la firma electrónica', 3, MUST, 8, WHO.coo, 5, '2026-06-17',
    'Requisitos de la fiduciaria para vincular compradores en línea y recibir la cuota de separación.',
    'Requisitos de la fiduciaria (SARLAFT, documentos, firma electrónica y recaudo) documentados; decisión sobre el alcance de las historias de separación en línea.', { tags: ['fiduciaria'] });
  I('HU-025', 'historia', 'EP-006', 'Consultar la disponibilidad en línea y bloquear un apartamento por 48 horas', 8, MUST, 9, WHO.web, 8, '2026-09-04',
    'Como hogar comprador quiero apartar en línea el apartamento que elegí mientras completo la separación.',
    'El hogar bloquea un apartamento disponible por 48 horas con sus datos y su autorización; el inventario de la comercializadora se actualiza cada 15 minutos; al vencer el plazo sin separación el apartamento se libera y el asesor recibe aviso; no puede haber dos bloqueos sobre el mismo apartamento.', { from: 7, tags: ['separación'] });
  I('HU-026', 'historia', 'EP-006', 'Vinculación digital del comprador al encargo fiduciario con SARLAFT', 8, MUST, 10, WHO.web, 9, 'en-produccion',
    'Como comprador quiero vincularme en línea al encargo fiduciario para separar sin ir a la oficina de la fiduciaria.',
    'El comprador diligencia el formulario de vinculación de la fiduciaria y carga sus documentos; la fiduciaria hace la verificación SARLAFT antes de aceptar el encargo; el promotor no recibe ni guarda los documentos; el estado de la vinculación llega al CRM.', { prod: '2026-09-18', blocked: true, blockedReason: 'La fiduciaria no ha habilitado el servicio de vinculación digital en su ambiente de pruebas; en la sesión técnica del 24 de septiembre se comprometió a hacerlo el 7 de octubre de 2026.', tags: ['separación', 'fiduciaria'] });
  I('HU-027', 'historia', 'EP-006', 'Pagar la cuota de separación por PSE con abono directo al encargo fiduciario', 8, MUST, 9, WHO.web, null, 'backlog',
    'Como comprador quiero pagar la cuota de separación en línea con la seguridad de que el dinero queda en el encargo fiduciario.',
    'El pago va a la cuenta del encargo fiduciario del comprador, nunca a cuentas del promotor; el comprobante de la fiduciaria llega al comprador y al CRM; conciliación diaria con la fiduciaria.', { tags: ['separación', 'fiduciaria'] });
  I('HU-028', 'historia', 'EP-006', 'Firma electrónica del formulario de vinculación y del encargo fiduciario individual', 5, MUST, 8, WHO.web, 9, 'aprobacion',
    'Como comprador quiero firmar en línea los documentos de la vinculación para no desplazarme.',
    'Firma electrónica con los requisitos de la Ley 527 de 1999 y del Decreto 2364 de 2012, aceptada por la fiduciaria; el comprador recibe copia del documento firmado; textos aprobados por el abogado del proyecto.', { prod: '2026-09-18', aprob: '2026-09-28', tags: ['separación', 'fiduciaria'] });

  /* EP-007 · Contenidos de avance de obra */
  I('HU-029', 'historia', 'EP-007', 'Galería mensual de fotos y video del avance de obra por bloque', 5, SHOULD, 7, WHO.dis, 6, '2026-07-17',
    'Como comprador quiero ver cada mes cómo avanza la construcción de mi bloque.',
    'Fotos y un video corto del avance de cada bloque con su fecha; datos revisados por el director de obra; sin imágenes de personas trabajando sin sus elementos de protección.', { tags: ['avance de obra'] });
  I('HU-030', 'historia', 'EP-007', 'Boletín digital de avance para compradores con baja en un clic', 5, SHOULD, 6, WHO.crm, null, 'backlog',
    'Como comprador quiero recibir el boletín de avance en mi correo y poder dejar de recibirlo cuando quiera.',
    'Reemplaza el boletín actual; se envía solo a compradores que lo autorizaron; enlace para dejar de recibirlo; medición de aperturas.', { tags: ['avance de obra'] });
  I('HU-031', 'historia', 'EP-007', 'Avance de obra por bloque y fecha estimada de entrega en el portal del comprador', 13, SHOULD, 7, WHO.web, null, 'backlog',
    'Como comprador quiero consultar el avance de mi bloque y la fecha estimada de entrega en un solo lugar.',
    'El comprador ve el avance de su bloque con los porcentajes del último informe mensual aprobado y la fecha estimada de entrega con la advertencia de que puede cambiar; no ve información de otros compradores.', { tags: ['avance de obra', 'portal'] });
  I('TA-004', 'tarea', 'EP-007', 'Validar con el director de obra y la supervisión técnica los textos de avance antes de publicarlos', 2, MUST, 7, WHO.coo, 9, '2026-09-22',
    'Procedimiento para que ningún contenido de avance de obra se publique sin revisión técnica.',
    'Procedimiento acordado: el director de obra revisa los datos de avance y la supervisión técnica independiente los textos técnicos; nada se publica sin las dos revisiones.', { tags: ['avance de obra'] });

  /* fuera del release (siguiente release): sin estimar ni refinar */
  I('HU-034', 'historia', 'EP-007', 'Estado de cuenta del comprador con las cuotas iniciales pagadas al encargo fiduciario', null, WONT, 6, '', null, 'backlog',
    'Como comprador quiero consultar en línea las cuotas iniciales que he pagado al encargo fiduciario y las que me faltan.',
    '', { created: '2026-08-24', release: false, tags: ['portal', 'fiduciaria'] });

  /* ---------------------------------------------------------------- costos reales del release
     Parte digital (tarifa del equipo digital de la agencia y pauta digital) de las facturas mensuales de la agencia (CT-013),
     en millones; el resto de cada registro de C02 son medios, eventos y alianzas. */
  const DIGITAL = { '2026-03': 21.6, '2026-04': 23.8, '2026-05': 22.1, '2026-06': 24.5, '2026-07': 24.9, '2026-08': 22.6, '2026-09': 25.4 };

  /* ---------------------------------------------------------------- RACI: roles y eventos ágiles */
  const RACI_ROLES = [
    ['rol-po', 'Dueño del producto (gerente comercial)'],
    ['rol-sm', 'Scrum Master / facilitador (coordinador de mercadeo digital)'],
    ['rol-dt', 'Desarrolladores (agencia digital y analista de CRM)'],
  ];
  /* claves: po, sm, dt (roles ágiles); ger = gerente de proyecto; jun = junta directiva (patrocinador). Mismos nombres de
     eventos que «Agregar eventos ágiles» de la vista RACI, para que no se dupliquen. */
  const RACI_EVENTS = [
    ['Refinamiento del backlog', { po: 'RA', sm: 'C', dt: 'C', ger: 'I' }],
    ['Priorización del backlog', { po: 'RA', sm: 'C', dt: 'C', ger: 'C' }],
    ['Planificación de la iteración', { po: 'C', sm: 'R', dt: 'RA', ger: 'I' }],
    ['Reunión diaria', { sm: 'R', dt: 'RA', ger: 'I' }],
    ['Revisión de la iteración', { po: 'A', sm: 'R', dt: 'R', ger: 'C', jun: 'I' }],
    ['Retrospectiva', { po: 'C', sm: 'RA', dt: 'R', ger: 'I' }],
    ['Definición de terminado', { po: 'A', sm: 'C', dt: 'R', ger: 'C' }],
    ['Aceptación de historias de usuario', { po: 'A', sm: 'I', dt: 'R', ger: 'I' }],
    ['Planificación del release', { po: 'A', sm: 'R', dt: 'R', ger: 'C', jun: 'I' }],
    ['Aprobación comercial y legal de piezas y formularios', { po: 'A', sm: 'C', dt: 'R', ger: 'I' }],
  ];
  const RACI_KEY = { po: 'rol-po', sm: 'rol-sm', dt: 'rol-dt', ger: 'rol-ger', jun: 'rol-jun' };

  /* ---------------------------------------------------------------- utilidades */
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const itemId = (code) => 'bl-' + code.toLowerCase();
  const BASE_CREATED = '2026-02-26';
  const EPIC_CREATED = '2026-02-20';
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

  /* historial de estados coherente con las iteraciones (días hábiles del calendario del proyecto) */
  function historyOf(it, cal) {
    const o = it.o;
    const created = o.created || BASE_CREATED;
    const h = [{ date: created, status: 'backlog' }];
    if (!it.sprint) return h;
    const first = spOf(o.from || it.sprint);
    const todo = o.added || (first[1] > created ? first[1] : created);
    h.push({ date: todo, status: 'por-hacer' });
    const done = isDate(it.state) ? it.state : null;
    const quick = it.type === 'tarea' || it.type === 'investigacion';
    const approvalDays = quick ? 1 : it.sprint <= 6 ? 5 : 2;
    let aprob = o.aprob || (done ? cal.addWork(done, -approvalDays) : null);
    let prod = o.prod || cal.addWork(todo, 2);
    if (aprob && prod >= aprob) prod = cal.addWork(aprob, -1);
    if (prod < todo) prod = todo;
    if (aprob && aprob < prod) aprob = prod;
    if (done || it.state === 'en-produccion' || it.state === 'aprobacion') h.push({ date: prod, status: 'en-produccion' });
    if (done || it.state === 'aprobacion') h.push({ date: aprob, status: 'aprobacion' });
    if (done) h.push({ date: done, status: 'publicado' });
    return h;
  }

  function buildBacklog(cal) {
    const epicIds = new Map(EPICS.map((e) => [e.code, itemId(e.code)]));
    const out = [];
    let rank = 0;
    EPICS.forEach((e) => {
      rank += 100;
      out.push({ id: itemId(e.code), data: { code: e.code, type: 'epica', title: e.title, description: e.description, acceptance: '', estimate: null, priority: MUST, value: e.value, rank, status: 'backlog', wbsId: WBS, releaseId: REL, sprintId: null, epicId: null, assignee: R.po, blocked: false, blockedReason: '', tags: [], createdAt: EPIC_CREATED, doneDate: null, sprintAddedDate: null, history: [{ date: EPIC_CREATED, status: 'backlog' }] } });
    });
    /* orden del backlog: iteración en curso, backlog del release por prioridad y valor, fuera del release, terminados */
    const PRI = { [MUST]: 0, [SHOULD]: 1, [COULD]: 2, [WONT]: 3 };
    const group = (it) => (it.state === 'backlog' ? (it.o.release === false ? 2 : 1) : isDate(it.state) ? 3 : 0);
    const ordered = ITEMS.map((it, i) => ({ it, i })).sort((a, b) => group(a.it) - group(b.it) || (group(a.it) === 3 ? String(a.it.state).localeCompare(String(b.it.state)) : 0) || PRI[a.it.priority] - PRI[b.it.priority] || b.it.value - a.it.value || a.i - b.i).map((x) => x.it);
    rank = 1000;
    for (const it of ordered) {
      const o = it.o;
      const done = isDate(it.state) ? it.state : null;
      const status = done ? 'publicado' : it.state;
      const history = historyOf(it, cal);
      out.push({ id: itemId(it.code), data: {
        code: it.code, type: it.type, title: it.title, description: it.description, acceptance: it.acceptance, estimate: it.estimate, priority: it.priority, value: it.value, rank,
        status, wbsId: WBS, releaseId: o.release === false ? null : REL, sprintId: it.sprint ? spId(it.sprint) : null, epicId: epicIds.get(it.epic) || null,
        assignee: it.assignee, blocked: !!o.blocked, blockedReason: o.blockedReason || '', tags: (o.tags || []).slice(), createdAt: o.created || BASE_CREATED,
        doneDate: done, sprintAddedDate: o.added || null, history,
      } });
      rank += 1000;
    }
    return out;
  }

  function buildAgile() {
    const unfinished = (codes) => codes.map((code) => { const it = ITEMS.find((x) => x.code === code); return { id: itemId(code), code, title: it.title, estimate: it.estimate, sprintAddedDate: null }; });
    const docs = {
      8: { planificacion: 'planificacion-sprint--it8', revision: 'acta-revision-sprint--it8', retrospectiva: 'retrospectiva--it8' },
      9: { planificacion: 'planificacion-sprint--it9' },
    };
    const sprints = SPRINTS.map(([n, start, end, goal, status, capacity, committed, completed, unf, notes]) => {
      const s = { id: spId(n), name: 'Iteración ' + n, releaseId: REL, goal, start, end, status, capacity, committed, completed, docs: { ...(docs[n] || {}) }, notes };
      if (status === 'cerrado') s.unfinished = unfinished(unf);
      return s;
    });
    const release = {
      id: REL, name: RELEASE_NAME, goal: RELEASE_GOAL, start: RELEASE_START, end: RELEASE_END, status: 'en-curso', budget: BUDGET, plannedSprints: PLANNED_SPRINTS,
      wbsId: RELEASE_WBS, taskId: RELEASE_TASK,
      baseline: { date: BASELINE_DATE, points: BASE_POINTS, end: RELEASE_END, budget: BUDGET, sprints: PLANNED_SPRINTS, changeRef: null },
      notes: 'Release adaptativo del paquete 1.4.2 Mercadeo y publicidad (enfoque adaptativo desde marzo de 2026, decisión de la junta directiva del 10 de febrero de 2026). Presupuesto de COP 245 millones dentro del rubro de publicidad y mercadeo (COP 1.459 millones de la actividad C02): no aumenta el BAC del proyecto. En el cronograma lo representa la actividad C02D (del 2 de marzo al 23 de diciembre de 2026, en la LB1), con costo 0: su avance se calcula desde este backlog y su fin pronosticado, con la velocidad; el presupuesto sigue en C02, que agrupa también medios, eventos y alianzas y se mide por nivel de esfuerzo hasta junio de 2028, de modo que el valor ganado del proyecto no cambia y el del release se mide con su valor ganado ágil. Está vinculado al entregable 1.4.2, pero su costo real son solo los registros de costos marcados con este release (la parte digital de las facturas mensuales de la agencia, CT-013), no todo el gasto del paquete. Línea base comprometida el 27 de febrero de 2026: 213 puntos, 12 iteraciones, COP 245 millones y fin el 23 de diciembre de 2026. Al corte el alcance es de 232 puntos (+8,9 %) por cinco elementos agregados en las revisiones (HU-032, DF-001, HU-033, IN-003 y HU-035): dentro del umbral del 10 % y sin cambio de fecha ni de presupuesto, es un cambio de nivel 1 del control en dos niveles que decide el dueño del producto sin solicitud de cambio.',
    };
    return { settings: { ...SETTINGS, columns: COLUMNS.map((c) => ({ ...c })) }, releases: [release], sprints };
  }

  /* divide los registros mensuales de C02 (mismo día, misma actividad, misma suma) y marca la parte digital con el release */
  function splitActuals(actuals) {
    const out = [];
    for (const a of Array.isArray(actuals) ? actuals : []) {
      const d = isObj(a) && a.taskId === 'C02' && isDate(a.date) && a.date <= CUT ? DIGITAL[a.date.slice(0, 7)] : undefined;
      const digital = d ? Math.round(d * M) : 0;
      if (!digital || !(a.amount > digital)) { out.push(a); continue; }
      out.push({ ...a, amount: a.amount - digital, description: a.description + ' — medios, eventos y alianzas' });
      out.push({ ...a, id: a.id + '-d', amount: digital, releaseId: REL, description: a.description + ' — canales digitales de venta (release de la etapa 2)' });
    }
    return out;
  }

  /* agrega los roles ágiles, las filas de eventos (paquete 1.4.2, después de su fila) y el equipo en la fila de 1.4.2 */
  function raciWithAgile(base) {
    const roles = [...(base.roles || [])];
    for (const [id, name] of RACI_ROLES) if (!roles.some((r) => r.id === id)) roles.push({ id, name });
    const events = RACI_EVENTS.map(([activity, cells], i) => {
      const c = {};
      for (const [k, v] of Object.entries(cells)) if (roles.some((r) => r.id === RACI_KEY[k])) c[RACI_KEY[k]] = v;
      return { id: 'rc-ag-' + String(i + 1).padStart(2, '0'), wbsId: WBS, activity, cells: c };
    });
    const rows = [];
    let placed = false;
    for (const r of base.rows || []) {
      if (r.wbsId === WBS) { rows.push({ ...r, cells: { ...r.cells, 'rol-sm': 'C', 'rol-dt': 'R' } }); rows.push(...events); placed = true; }
      else rows.push(r);
    }
    if (!placed) rows.push(...events);
    return { roles, rows };
  }

  PM.exampleAgile = PM.exampleAgile || {};
  PM.exampleAgile.medellin = function (ctx) {
    const cal = (ctx && ctx.cal) || PM.cal.make({ workweek: 6, holidaysCO: true, extraHolidays: [] }, '2025-01-13');
    return {
      lifecycle: 'Híbrido',
      description: 'Ciclo de vida híbrido: la estructuración, los diseños y las licencias, la obra y la entrega siguen en cascada; desde marzo de 2026 los canales digitales de venta del paquete 1.4.2 se gestionan con Scrum y tablero Kanban (un release de 12 iteraciones de 20 días hábiles dentro del presupuesto de publicidad y mercadeo, representado en el cronograma por la actividad C02D).',
      wbs: { [WBS]: { approach: 'adaptativo', notes: 'Enfoque adaptativo desde marzo de 2026 (decisión de la junta directiva del 10 de febrero de 2026): los canales digitales de venta de la etapa 2 se gestionan como un release de 12 iteraciones de 20 días hábiles con COP 245 millones de este paquete. La actividad C02 sigue midiéndose por nivel de esfuerzo; el release se representa en el cronograma con la actividad C02D (costo 0), que toma su avance del backlog, y se mide con su valor ganado ágil.' } },
      agile: buildAgile(),
      backlog: buildBacklog(cal),
      actuals: splitActuals,
      raci: raciWithAgile,
      facts: { releaseId: REL, taskId: RELEASE_TASK, wbsId: WBS, releaseWbs: RELEASE_WBS, budget: BUDGET, basePoints: BASE_POINTS, plannedSprints: PLANNED_SPRINTS, digital: Object.fromEntries(Object.entries(DIGITAL).map(([k, v]) => [k, Math.round(v * M)])), raciRoles: RACI_ROLES.map(([id, name]) => ({ id, name })), raciEvents: RACI_EVENTS.map(([a]) => a), statusDate: CUT },
    };
  };

  /* ================================================================== documentos ágiles (plantillas de 14-templates-agile) */
  const ITER8 = spOf(8), ITER9 = spOf(9);
  const itemRow = (prefix) => (code, i) => { const it = ITEMS.find((x) => x.code === code); const TYPE = { historia: 'Historia de usuario', tarea: 'Tarea', defecto: 'Defecto', mejora: 'Mejora', investigacion: 'Investigación (spike)' }; return { id: prefix + '-' + String(i + 1).padStart(2, '0'), codigo: code, titulo: it.title, tipo: TYPE[it.type], estimacion: it.estimate, responsable: it.assignee, criterios: it.acceptance }; };

  const vision = {
    status: 'aprobado', rev: '0', date: '2026-02-24',
    titleBlock: { elaboro: R.po, reviso: R.ger, aprobo: R.jun },
    fields: {
      producto: 'Canales digitales de venta del Edificio Atalaya del Occidente',
      patrocinador: R.jun,
      duenoProducto: R.po,
      horizonte: 'Marzo a diciembre de 2026: un release de 12 iteraciones de 20 días hábiles para las preventas de la etapa 2 y el inventario de la etapa 1.',
      paraQuien: 'Hogares del Valle de Aburrá que buscan vivienda nueva de estrato 3 en el occidente de Medellín (apartamentos No VIS de 58 y 68 m² de la etapa 2 y las viviendas VIS de 50 m² que queden en el inventario de la etapa 1), los compradores que ya separaron y los asesores comerciales de la sala de ventas.',
      necesidad: 'La etapa 1 vendió 19,5 viviendas al mes frente a 23 planificadas y su punto de equilibrio llegó cuatro semanas tarde (INC-003). Los prospectos llegan por el formulario, las redes sociales y la mensajería y se registran a mano en hojas de cálculo; la primera respuesta tarda en promedio 9 horas hábiles; nadie sabe cuánto cuesta una venta por canal, y para separar hay que ir a la sala de ventas y a la fiduciaria.',
      categoria: 'Canal digital de ventas: sitio por tipología con disponibilidad, recorridos virtuales, CRM con embudo de ventas, pauta medida por costo por venta, simulador de crédito y subsidios y separación en línea con el encargo fiduciario.',
      beneficioClave: 'El hogar encuentra y recorre su apartamento, simula su crédito o su subsidio y lo separa en línea con el dinero protegido en el encargo fiduciario; el área comercial atiende cada prospecto en menos de una hora hábil y sabe cuánto cuesta cada venta por canal.',
      alternativas: 'La sala de ventas física con el apartamento modelo, el sitio informativo actual sin disponibilidad y la pauta sin medición de ventas.',
      diferenciador: 'Información veraz y verificable de cada apartamento disponible, atención inmediata y una separación en línea que deja los recursos en el encargo fiduciario, con la inversión en pauta dirigida a los canales que venden más barato.',
      declaracion: 'Para los hogares que buscan vivienda nueva de estrato 3 en el occidente de Medellín, que hoy solo pueden conocer y separar un apartamento en la sala de ventas y esperan horas una respuesta, los canales digitales de venta del Edificio Atalaya del Occidente son un canal de ventas en línea que muestra la disponibilidad real, los recorridos y la cuota estimada y permite separar con el encargo fiduciario. A diferencia de la sala de ventas y del sitio informativo actual, nuestro producto atiende en menos de una hora hábil y mide el costo de cada venta por canal.',
      objetivosNegocio: [
        'Llegar al 60 % de las preventas de la etapa 2 (125 viviendas) con apoyo de los canales digitales.',
        'Lograr que al menos 40 % de las ventas de la etapa 2 se originen en canales digitales.',
        'Bajar el costo de pauta por venta originada en canales digitales de COP 4,1 millones a COP 2,8 millones.',
        'Responder a cada prospecto en menos de una hora hábil.',
        'Publicar el 100 % de las piezas y formularios con aprobación comercial y legal (Ley 1480 de 2011 y Ley 1581 de 2012).',
      ],
      metricasExito: [
        { id: 'vis-m-01', metrica: 'Ventas de la etapa 2 originadas en canales digitales', lineaBase: '24 % (ventas de la etapa 1 en enero y febrero de 2026)', meta: '40 % o más', fecha: '2026-12-23' },
        { id: 'vis-m-02', metrica: 'Costo de pauta por venta originada en canales digitales', lineaBase: 'COP 4,1 millones (estimado de 2025)', meta: 'COP 2,8 millones o menos', fecha: '2026-12-23' },
        { id: 'vis-m-03', metrica: 'Costo por prospecto calificado', lineaBase: 'COP 96.000 (estimado de 2025)', meta: 'COP 70.000 o menos', fecha: '2026-10-31' },
        { id: 'vis-m-04', metrica: 'Tiempo de primera respuesta a un prospecto', lineaBase: '9 horas hábiles en promedio', meta: 'Menos de 1 hora hábil', fecha: '2026-06-30' },
        { id: 'vis-m-05', metrica: 'Piezas y formularios publicados con aprobación comercial y legal', lineaBase: 'Sin registro', meta: '100 %', fecha: '2026-03-31' },
      ],
      personas: [
        { id: 'vis-p-01', persona: 'Hogar comprador No VIS', descripcion: 'Pareja de 28 a 40 años con ingresos de 5 a 9 SMMLV que busca su primera vivienda o cambia de arriendo; investiga en el celular por las noches.', necesidades: 'Ver apartamentos disponibles con precio y áreas reales, recorrerlos sin desplazarse, saber su cuota mensual y separar sin perder el apartamento que eligió.' },
        { id: 'vis-p-02', persona: 'Hogar comprador VIS con subsidio', descripcion: 'Hogar con ingresos de hasta 4 SMMLV afiliado a la caja de compensación, que depende del subsidio y del crédito para la cuota inicial.', necesidades: 'Saber si cumple los requisitos, cuánto subsidio podría recibir y cuánto le falta; condiciones claras y vigentes.' },
        { id: 'vis-p-03', persona: 'Asesor comercial de la sala de ventas', descripcion: 'Atiende visitas y prospectos de todos los canales; hoy recibe listas de contactos sin contexto.', necesidades: 'Recibir cada prospecto con su canal, su tipología de interés y su calificación, y saber a quién llamar primero y en qué horario.' },
        { id: 'vis-p-04', persona: 'Comprador de la etapa 1', descripcion: 'Hogar que ya separó y paga sus cuotas iniciales al encargo fiduciario mientras se construye su bloque.', necesidades: 'Información confiable del avance de su bloque y de la fecha estimada de entrega; poder referir a familiares y amigos.' },
      ],
      productoMinimo: 'Iteraciones 1 a 3: campaña de la etapa 2 medida desde el primer día, páginas de las tipologías B y C con disponibilidad y leyendas legales, y todos los prospectos en el CRM con su autorización de datos y su canal de origen.',
      fueraAlcance: [
        'Venta de parqueaderos adicionales y de depósitos.',
        'Estado de cuenta del comprador y recaudo de las cuotas iniciales en línea (siguiente release, con la fiduciaria).',
        'Medios tradicionales, eventos y alianzas del plan de mercadeo, que siguen en el paquete 1.4.2 con su presupuesto y se gestionan con el plan de mercadeo.',
      ],
      restricciones: [
        'Publicidad veraz, suficiente y verificable de la vivienda: áreas, precio, imágenes de referencia y condiciones de las promociones con su vigencia (Ley 1480 de 2011).',
        'Datos personales solo con autorización previa, expresa e informada, aviso de privacidad y política de tratamiento (Ley 1581 de 2012); contacto comercial solo por los canales autorizados y en el horario de la Ley 2300 de 2023.',
        'Los recursos de los compradores se reciben solo en el encargo fiduciario, con la vinculación y el SARLAFT de la fiduciaria.',
        'Presupuesto de COP 245 millones dentro del rubro de publicidad y mercadeo del proyecto, sin aumentar el BAC.',
        'En el cronograma del proyecto el release se representa con una actividad de costo 0 que toma su avance del backlog; el presupuesto sigue en la actividad C02 de publicidad y mercadeo, que se mide por nivel de esfuerzo.',
      ],
    },
  };

  const DLT_LISTO = [
    'Redactada como «Como <comprador, asesor o gerente comercial> quiero <necesidad> para <beneficio>», con la tipología, el bloque o el canal al que aplica.',
    'Criterios de aceptación verificables con los datos reales que usará: lista de precios vigente, áreas privadas y construidas e inventario de la comercializadora.',
    'Estimada por el equipo en puntos de historia y de 8 puntos o menos (13 solo con aprobación del dueño del producto); si es mayor, se divide.',
    'Si publica precios o condiciones de venta o recoge datos personales, el abogado del proyecto revisó los textos base en el refinamiento.',
    'Dependencias con la comercializadora, la fiduciaria o los bancos identificadas y con fecha acordada.',
  ];
  const DLT_TERMINADO = [
    'Cumple todos sus criterios de aceptación y se probó en celulares y en computadores.',
    'Las piezas y páginas dan información veraz, suficiente y verificable: área privada y área construida, precio desde con la fecha de la lista, tipología y bloque, y la leyenda «Imágenes de referencia» en renders y recorridos (Ley 1480 de 2011).',
    'Las promociones y condiciones de venta indican vigencia, cantidades y restricciones.',
    'Todo formulario o flujo que recoge datos personales pide la autorización previa, expresa e informada con sus finalidades, enlaza el aviso de privacidad y la política de tratamiento y guarda la evidencia en el CRM (Ley 1581 de 2012).',
    'Los mensajes del CRM salen solo por los canales autorizados y en el horario permitido (Ley 2300 de 2023).',
    'Tiene la aprobación comercial del gerente comercial y la aprobación legal del abogado del proyecto (columna «Aprobación comercial y legal»).',
    'Mide sus conversiones: etiquetas y parámetros de campaña verificados en la medición del canal.',
    'El dueño del producto lo aceptó en la revisión de la iteración.',
  ];
  const DLT_PRECIOS = 'Toda pieza o página con precios usa la lista vigente y muestra su fecha de vigencia; la que tenga una lista vencida se retira antes de que cambie la lista.';
  const DLT_FLUJO = [
    'Solo entran a «En producción» elementos de la iteración actual que cumplen la definición de listo.',
    'Límites WIP: 4 elementos en «En producción» y 3 en «Aprobación comercial y legal»; con una columna llena, el equipo ayuda a terminar antes de empezar algo nuevo.',
    'El abogado del proyecto revisa las piezas en dos franjas fijas, martes y jueves; nada pasa a «Publicado» sin la aprobación comercial y la legal.',
    'Un elemento bloqueado se marca con la causa el mismo día; si sigue bloqueado al día siguiente, el facilitador lo escala al dueño del producto.',
    'Una pieza publicada con un error legal se retira primero y se corrige después, por un carril de urgencia que puede superar el límite WIP una vez por iteración.',
  ];
  const DLT_COLUMNAS = [
    { id: 'dlt-c-01', columna: 'Por hacer', categoria: 'Por hacer', criterioEntrada: 'Elemento de la iteración actual que cumple la definición de listo.', criterioSalida: 'Un miembro del equipo lo toma y hay cupo en «En producción».' },
    { id: 'dlt-c-02', columna: 'En producción', categoria: 'En curso', wip: 4, criterioEntrada: 'Tiene responsable y hay cupo en la columna.', criterioSalida: 'Pieza, página o flujo terminado y probado por quien lo hizo, con las leyendas legales y la medición.' },
    { id: 'dlt-c-03', columna: 'Aprobación comercial y legal', categoria: 'En curso', wip: 3, criterioEntrada: 'Cumple los criterios de aceptación en el ambiente de pruebas.', criterioSalida: 'Aprobación del gerente comercial y del abogado del proyecto registrada en el elemento.' },
    { id: 'dlt-c-04', columna: 'Publicado', categoria: 'Terminado', criterioEntrada: 'Cumple la definición de terminado y quedó en línea.', criterioSalida: 'Aceptado o rechazado por el dueño del producto en la revisión de la iteración.' },
  ];
  const dltFields = {
    aplicaA: 'Historias, tareas, defectos, mejoras e investigaciones del backlog de los canales digitales de venta: páginas, piezas de pauta, recorridos, formularios, flujos del CRM, simuladores y contenidos de avance de obra. Una épica se da por terminada cuando lo están todos sus elementos.',
    acordadaPor: 'Equipo digital de la agencia y analista de CRM, gerente comercial (dueño del producto) y coordinador de mercadeo digital (facilitador), con el abogado del proyecto',
    fechaAcuerdo: '2026-09-17',
    revisionAcuerdo: 'Se revisa en cada retrospectiva; los cambios se acuerdan con el dueño del producto y el abogado del proyecto y se emiten como nueva revisión. La revisión 1 (25 de agosto de 2026) fijó las franjas de revisión legal acordadas en la retrospectiva de la iteración 7 y la revisión 2 (17 de septiembre de 2026) agrega la verificación de la lista de precios vigente, acordada en la retrospectiva de la iteración 8.',
    definicionListo: DLT_LISTO,
    definicionTerminado: [...DLT_TERMINADO.slice(0, 3), DLT_PRECIOS, ...DLT_TERMINADO.slice(3)],
    criteriosRelease: [
      'Todas las historias «Debe tener» del release están publicadas y aceptadas.',
      'La comercializadora y la fiduciaria aprobaron por escrito los flujos de disponibilidad y de separación en línea.',
      'Ninguna pieza vigente tiene observaciones legales abiertas.',
      'El tablero de costo por prospecto y por venta cuadra con las ventas certificadas por la fiduciaria en el último corte.',
      'Los asesores comerciales están capacitados en el CRM y en la separación en línea.',
    ],
    politicasFlujo: DLT_FLUJO,
    columnasTablero: DLT_COLUMNAS,
  };
  const definicionTerminado = {
    status: 'aprobado', rev: '2', date: '2026-09-17',
    titleBlock: { elaboro: R.sm, reviso: R.abo, aprobo: R.po },
    fields: dltFields,
    revs: [
      { rev: '0', status: 'aprobado', date: BASELINE_DATE, note: 'Acuerdo inicial con la planificación del release.', fields: { ...dltFields, fechaAcuerdo: BASELINE_DATE, revisionAcuerdo: 'Se revisa en cada retrospectiva; los cambios se acuerdan con el dueño del producto y el abogado del proyecto y se emiten como nueva revisión.', definicionTerminado: DLT_TERMINADO, politicasFlujo: [DLT_FLUJO[0], DLT_FLUJO[1], 'Nada pasa a «Publicado» sin la aprobación comercial y la legal.', DLT_FLUJO[3], DLT_FLUJO[4]] } },
      { rev: '1', status: 'aprobado', date: '2026-08-25', note: 'Retrospectiva de la iteración 7: franjas fijas de revisión legal (martes y jueves).', fields: { ...dltFields, fechaAcuerdo: '2026-08-25', revisionAcuerdo: 'Se revisa en cada retrospectiva; los cambios se acuerdan con el dueño del producto y el abogado del proyecto y se emiten como nueva revisión. La revisión 1 (25 de agosto de 2026) fija las franjas de revisión legal acordadas en la retrospectiva de la iteración 7.', definicionTerminado: DLT_TERMINADO } },
      { rev: '2', status: 'aprobado', date: '2026-09-17', note: 'Retrospectiva de la iteración 8: verificación de la lista de precios vigente en toda pieza con precios.' },
    ],
  };

  const planRelease = {
    status: 'aprobado', rev: '0', date: BASELINE_DATE,
    titleBlock: { elaboro: R.po, reviso: R.sm, aprobo: R.ger },
    fields: {
      visionResumen: 'Canales digitales de venta para la etapa 2 y el inventario de la etapa 1: que el hogar encuentre su apartamento, lo recorra, simule su crédito o su subsidio y lo separe en línea con el encargo fiduciario, y que el área comercial conozca el costo por prospecto y por venta de cada canal, con publicidad veraz y datos personales tratados con autorización.',
      unidadEstimacion: 'Puntos de historia',
      velocidadSupuesta: 18,
      duracionIteracion: 20,
      capacidadEquipo: 'Equipo digital de la agencia de publicidad (CT-013): desarrollador web, diseñador de contenidos y especialista en pauta digital, más el analista de CRM de la comercializadora; trabajan de lunes a viernes, unos 17 de los 20 días hábiles de cada iteración en el calendario del proyecto (lunes a sábado con festivos de Colombia). El coordinador de mercadeo digital facilita los eventos con dedicación de 50 % y el gerente comercial, dueño del producto, dedica una hora diaria. La velocidad supuesta de 18 puntos sale de la tarifa mensual del equipo de la agencia y de dos campañas digitales anteriores del promotor; desde la iteración 4 se reemplaza por el promedio de las tres últimas iteraciones cerradas.',
      releases: [
        { id: 'prel-01', release: RELEASE_NAME, objetivo: RELEASE_GOAL, fechaInicio: RELEASE_START, fechaFin: RELEASE_END, iteraciones: PLANNED_SPRINTS, puntos: BASE_POINTS, presupuesto: BUDGET, alcance: 'Siete épicas: sitio web y páginas por tipología (VIS y No VIS); recorridos virtuales 360°; CRM y embudo de ventas con calificación de prospectos; pauta digital medida por costo por prospecto y por venta; simulador de crédito y subsidios VIS; separación en línea con el encargo fiduciario; contenidos de avance de obra para compradores.' },
      ],
      supuestos: [
        'El presupuesto del release (COP 245 millones) sale del rubro de publicidad y mercadeo de la actividad C02 (COP 1.459 millones): no aumenta el BAC ni cambia la línea base de costos.',
        'El release se representa en el cronograma maestro con una actividad de costo 0 (C02D, del 2 de marzo al 23 de diciembre de 2026, que entra en la LB1): su avance se calcula desde el backlog (puntos terminados / alcance) y su fin pronosticado, con la velocidad, de modo que el Gantt muestra el release con sus iteraciones. El presupuesto sigue en C02, que agrupa también medios, eventos y alianzas y se mide por nivel de esfuerzo hasta junio de 2028: así el valor ganado del proyecto no cambia. El release se controla con su valor ganado ágil y su costo real con la parte digital de las facturas de la agencia, marcada con el release.',
        'La comercializadora entrega cada día el inventario de la etapa 2 por bloque, piso y apartamento.',
        'La fiduciaria habilita la vinculación digital de compradores al encargo antes de la iteración 9.',
        'El abogado del proyecto revisa las piezas y los formularios dentro de la misma iteración.',
      ],
      riesgosPlan: [
        'Demoras de la fiduciaria en los servicios digitales del encargo (vinculación y recaudo).',
        'Cambios de la lista de precios o de las condiciones de venta que obliguen a rehacer piezas aprobadas.',
        'Sanciones por publicidad engañosa o por tratar datos sin autorización si una pieza o un formulario sale sin aprobación.',
        'Rotación del equipo de la agencia.',
      ],
      criteriosReplanificacion: 'La hoja de ruta se revisa en cada revisión de iteración con el pronóstico por velocidad. Dentro del release comprometido, el dueño del producto reordena, divide, agrega o retira elementos sin trámite formal mientras el alcance total se mantenga dentro de ±10 % de su línea base (213 puntos) y no cambien la fecha (23 de diciembre de 2026) ni el presupuesto (COP 245 millones): es un cambio de nivel 1 del control en dos niveles, que se informa en la revisión de la iteración y en el comité de gerencia. Si se supera el umbral o cambian la fecha o el presupuesto, el gerente comercial registra una solicitud de cambio, que se decide según el plan de gestión de cambios; aprobada, se fija una nueva línea base del release.',
    },
  };

  const PART = ['Gerente comercial (dueño del producto)', 'Coordinador de mercadeo digital (Scrum Master / facilitador)', 'Equipo digital de la agencia (desarrollador web, diseñador de contenidos y especialista en pauta digital)', 'Analista de CRM de la comercializadora'];
  const planIt8 = {
    key: 'it8', title: 'Planificación de la iteración — Iteración 8', status: 'aprobado', rev: '0', date: ITER8[1],
    titleBlock: { elaboro: R.sm, reviso: R.eq, aprobo: R.po },
    fields: {
      iteracion: 'Iteración 8', release: RELEASE_NAME, fechaInicio: ITER8[1], fechaFin: ITER8[2], objetivo: ITER8[3],
      capacidad: 19, velocidadReferencia: 18.7, compromiso: 19,
      notasCapacidad: 'Cuatro personas trabajan de lunes a viernes: 17 de los 20 días hábiles de la iteración (68 días-persona), menos 3 días de vacaciones del diseñador de contenidos = 65 días-persona. Con la velocidad media de las iteraciones 5 a 7 (18,7 puntos con unos 64 días-persona), la capacidad es de 19 puntos. La iteración no tiene festivos.',
      elementos: ['HU-025', 'HU-016', 'IN-003'].map(itemRow('pit8')),
      riesgos: 'HU-025 viene de la iteración 7: la sincronización del inventario con la comercializadora debe quedar estable antes del 1 de septiembre. HU-016 necesita las ventas certificadas por la fiduciaria del corte de agosto (comité fiduciario del 10 de septiembre). Las piezas de esta iteración se revisan en las franjas legales de martes y jueves.',
      participantes: PART,
    },
  };
  const planIt9 = {
    key: 'it9', title: 'Planificación de la iteración — Iteración 9', status: 'aprobado', rev: '0', date: ITER9[1],
    titleBlock: { elaboro: R.sm, reviso: R.eq, aprobo: R.po },
    fields: {
      iteracion: 'Iteración 9', release: RELEASE_NAME, fechaInicio: ITER9[1], fechaFin: ITER9[2], objetivo: ITER9[3],
      capacidad: 23, velocidadReferencia: 18.7, compromiso: 23,
      notasCapacidad: 'A los cuatro integrantes (17 de los 20 días hábiles cada uno, 68 días-persona) se suma en septiembre y octubre un segundo desarrollador web de la agencia para la separación en línea (17 días-persona más): 85 días-persona. Con el rendimiento de las iteraciones 6 a 8 (18,7 puntos con unos 65 días-persona), la capacidad es de 23 puntos. El 12 de octubre es festivo y queda fuera de la iteración.',
      elementos: ['HU-024', 'HU-026', 'HU-028', 'TA-004'].map(itemRow('pit9')),
      riesgos: 'HU-026 depende del servicio de vinculación digital de la fiduciaria, que aún no está habilitado en su ambiente de pruebas: la sesión técnica semanal acordada en la retrospectiva de la iteración 8 debe confirmar la fecha antes del 24 de septiembre; si no llega, el equipo avanza en HU-028, que no depende del servicio. El compromiso supera la velocidad media porque se suma un desarrollador; si sale de la iteración, se devuelve HU-028 al backlog.',
      participantes: PART,
    },
  };

  const REV8_ITEMS = [
    { id: 'ari8-01', codigo: 'HU-025', titulo: ITEMS.find((x) => x.code === 'HU-025').title, estimacion: 8, resultado: 'Aceptado', observaciones: 'Probado con 12 bloqueos reales en la sala de ventas; el inventario se sincroniza con la comercializadora cada 15 minutos y ningún apartamento quedó con dos bloqueos.' },
    { id: 'ari8-02', codigo: 'HU-016', titulo: ITEMS.find((x) => x.code === 'HU-016').title, estimacion: 8, resultado: 'Aceptado', observaciones: 'Con datos de agosto: costo por prospecto calificado de COP 78.000 y costo de pauta por venta digital de COP 3,2 millones; cuadra con las ventas certificadas por la fiduciaria.' },
    { id: 'ari8-03', codigo: 'IN-003', titulo: ITEMS.find((x) => x.code === 'IN-003').title, estimacion: 3, resultado: 'Aceptado', observaciones: 'Regla adoptada: la venta se atribuye al último canal digital del prospecto en los 30 días anteriores a su visita a la sala; HU-017 la aplicará en el CRM.' },
  ];
  const revision8 = {
    key: 'it8', title: 'Acta de revisión de la iteración — Iteración 8', status: 'aprobado', rev: '0', date: ITER8[2],
    titleBlock: { elaboro: R.sm, reviso: R.ger, aprobo: R.po },
    fields: {
      iteracion: 'Iteración 8', fecha: ITER8[2], objetivo: ITER8[3], objetivoCumplido: 'Sí', comprometido: 19, terminado: 19,
      incremento: 'Se demostraron en línea la disponibilidad de la etapa 2 con el bloqueo de un apartamento por 48 horas (con datos reales de la comercializadora) y el tablero de costo por prospecto, por visita y por separación de cada canal con los datos de julio y agosto, junto con la regla de atribución de ventas adoptada.',
      elementos: REV8_ITEMS,
      retroalimentacion: 'La comercializadora confirmó que el bloqueo en línea evita las dobles separaciones y pidió que el asesor vea el canal de origen al recibir la visita. El gerente de proyecto pidió incluir en el informe mensual la participación digital de las ventas de la etapa 2: en agosto, 3 de las 9 ventas (33 %) se originaron en canales digitales, frente a la meta de 40 %. El abogado del proyecto recordó que el alza de precios en estudio para la etapa 2 obligaría a retirar las piezas con la lista anterior el mismo día en que cambie.',
      cambiosBacklog: 'Sin elementos nuevos en la revisión. El alcance del release va en 229 puntos frente a 213 de su línea base (+7,5 %) por HU-032 (referidos, +5, mayo), DF-001 (+3, junio), HU-033 (zonas comunes, +5, julio) e IN-003 (+3, agosto). Está dentro del umbral de ±10 % y no cambian la fecha ni el presupuesto: es un cambio de nivel 1 que decide el dueño del producto, sin solicitud de cambio.',
      estadoRelease: 'Release: 140 de 229 puntos terminados (61 %) después de 8 de las 12 iteraciones (67 % del tiempo). Faltan 89 puntos para 4 iteraciones (22,3 por iteración) frente a una velocidad media de 18,7 en las tres últimas: al ritmo actual el release necesita una iteración más y terminaría el 19 de enero de 2027. El dueño del producto propone diferir al siguiente release tres historias «Podría tener» (HU-006, HU-008 y HU-019; 15 puntos) para conservar la fecha del 23 de diciembre; lo decide en la revisión de la iteración 9, con la absorción de septiembre y octubre.',
      asistentes: [...PART, R.ger, 'Director comercial de la comercializadora (invitado)', 'Abogado del proyecto (invitado)'],
    },
  };

  const LESSONS = [
    { id: 'ret8-l-01', situacion: 'La revisión legal de las piezas se acumulaba al final de cada iteración y una historia lista esperaba hasta seis días hábiles; con la columna «Aprobación comercial y legal» (límite WIP de 3) y dos franjas semanales fijas del abogado del proyecto, la espera bajó a dos días hábiles.', impacto: 'Positivo', recomendacion: 'En la publicidad de vivienda, hacer explícita la aprobación comercial y legal como columna del tablero con límite WIP y agendar franjas fijas de revisión del abogado desde la primera iteración.' },
    { id: 'ret8-l-02', situacion: 'La vinculación digital al encargo fiduciario depende de un servicio de la fiduciaria que no estaba previsto en su contrato y se identificó en el refinamiento, pocos días antes de planificar la historia.', impacto: 'Negativo', recomendacion: 'Validar con la fiduciaria, desde la visión del producto, los servicios digitales que necesitan las historias del encargo fiduciario y acordar sus fechas por escrito antes de comprometerlas en una iteración.' },
  ];
  const retro8 = {
    key: 'it8', title: 'Retrospectiva de la iteración — Iteración 8', status: 'aprobado', rev: '0', date: ITER8[2],
    titleBlock: { elaboro: R.sm, reviso: R.eq, aprobo: R.po },
    fields: {
      iteracion: 'Iteración 8', fecha: ITER8[2], formato: 'Bien, mejorar y acciones', facilitador: R.sm, satisfaccion: 4.1,
      seguimientoAnteriores: 'Acciones de la iteración 7: (1) franjas fijas del abogado del proyecto para la aprobación legal (martes y jueves) — hecha: la espera en «Aprobación comercial y legal» bajó de seis a dos días hábiles; (2) comprometer según la velocidad media y no según la capacidad nominal — hecha: se comprometieron 19 puntos y se terminaron 19; (3) sincronizar el inventario con la comercializadora cada 15 minutos — hecha.',
      queFueBien: [
        'Se comprometió según la velocidad media (19 puntos) y se terminó todo el compromiso.',
        'Las franjas fijas del abogado del proyecto redujeron la espera en «Aprobación comercial y legal» de seis a dos días hábiles.',
        'El tablero de costo por separación permitió mover pauta hacia la tipología C, que tiene el menor costo por venta.',
      ],
      queMejorar: [
        'Dos piezas de la tipología B se aprobaron con la leyenda de la lista de precios anterior; se corrigieron antes de publicarlas, pero la definición de terminado no exigía verificar la vigencia de la lista.',
        'La dependencia de HU-026 con el servicio de vinculación digital de la fiduciaria se conoció en el refinamiento del 10 de septiembre, tarde para acordar una fecha.',
        'El diseñador de contenidos faltó a cuatro reuniones diarias por las grabaciones en la obra.',
      ],
      propuestas: ['Mover la reunión diaria a las 8:00 a. m. los días de grabación en obra.'],
      aprendizajes: ['La aprobación legal es parte del flujo de trabajo y no un paso al final: medir su espera en el tablero la hizo visible y permitió reducirla.'],
      acciones: [
        { id: 'ret8-a-01', accion: 'Agregar a la definición de terminado la verificación de la lista de precios vigente y de su fecha en toda pieza o página con precios.', responsable: 'Coordinador de mercadeo digital', fechaObjetivo: '2026-09-17', estado: 'Pendiente' },
        { id: 'ret8-a-02', accion: 'Acordar con la fiduciaria una sesión técnica semanal para habilitar la vinculación digital (HU-026) y confirmar la fecha por escrito.', responsable: 'Gerente comercial (dueño del producto)', fechaObjetivo: '2026-09-24', estado: 'Pendiente' },
        { id: 'ret8-a-03', accion: 'Refinar con el abogado del proyecto, antes de cada planificación, las historias que publican precios o condiciones o recogen datos personales.', responsable: 'Coordinador de mercadeo digital', fechaObjetivo: '2026-10-07', estado: 'Pendiente' },
      ],
      lecciones: LESSONS,
    },
  };

  PM.exampleDocs = PM.exampleDocs || {};
  PM.exampleDocs.medellin = Object.assign(PM.exampleDocs.medellin || {}, {
    'vision-producto': vision,
    'definicion-terminado': definicionTerminado,
    'plan-release': planRelease,
    'planificacion-sprint': { instances: [planIt8, planIt9] },
    'acta-revision-sprint': { instances: [revision8] },
    'retrospectiva': { instances: [retro8] },
  });

  /* Lecciones de la retrospectiva de la iteración 8 enviadas al registro de lecciones aprendidas (como «Enviar a lecciones
     aprendidas» de «Releases e iteraciones»: mismo texto, área «Integración», fecha de la retrospectiva). */
  const reg = PM.exampleDocs.medellin['registro-lecciones'];
  const regRows = reg && reg.fields && Array.isArray(reg.fields.lecciones) ? reg.fields.lecciones : null;
  if (regRows) {
    const key = (x) => String(x.situacion || '') + '|' + String(x.recomendacion || '');
    const seen = new Set(regRows.map(key));
    let n = regRows.reduce((mx, r) => { const m = /^LA-(\d+)$/.exec(String(r.id || '')); return m ? Math.max(mx, Number(m[1])) : mx; }, 0);
    const added = [];
    for (const l of LESSONS) {
      if (seen.has(key(l))) continue;
      n += 1;
      const id = 'LA-' + String(n).padStart(2, '0');
      regRows.push({ id, fecha: ITER8[2], area: 'Integración', situacion: l.situacion, impacto: l.impacto, recomendacion: l.recomendacion, registradoPor: 'Retrospectiva Iteración 8' });
      added.push(id);
    }
    if (added.length && typeof reg.fields.difusion === 'string') reg.fields.difusion += ' Las lecciones de la retrospectiva de la iteración 8 de los canales digitales (' + added.join(' y ') + ') se aplican en el tablero del release y en la definición de terminado.';
  }
})();

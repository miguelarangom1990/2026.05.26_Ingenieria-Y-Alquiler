# Supuestos y fuentes del ejemplo «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»

Este documento explica las cifras del proyecto de ejemplo ágil `erp` del Gestor de Proyectos PMBOK (SPEC §9.7). El proyecto es **ficticio**: las cifras son **supuestos del ejemplo**, calibrados con guías de proveedores de software y consultoría que se citan en la sección 2. No son cotizaciones ni precios de un fabricante, un implementador o un proveedor tecnológico real. Se usan roles, no nombres de personas.

- Datos y cálculos: `src/94-example-erp.js` (EDT, cronograma, costos, capa ágil, backlog, RACI y línea base LB0).
- Documentos: `src/95-example-erp-docs.js` y los ejemplos de las plantillas ágiles en `src/14-templates-agile.js`.
- Verificación: `test/example-erp.test.mjs` compara cada cifra de los documentos con lo que calcula la aplicación (`PM.calc.*`, `PM.agile.*`).

Todas las cifras están en pesos colombianos (COP) antes de IVA; "M" significa millones de COP. Supuesto: la empresa es responsable de IVA y lo descuenta, así que el presupuesto del proyecto no lo incluye.

---

## 1. El proyecto en una página

| Concepto | Valor del ejemplo |
|---|---|
| Nombre y código | EJEMPLO · Implementación del ERP de Ingeniería y Alquiler, PRY-2026-021 |
| Tipo | Proyecto interno de Ingeniería y Alquiler S.A.S. (alquiler, montaje y logística de andamios, formaletas, puntales y maquinaria) |
| Sedes | Sede administrativa y bodega principal en Bogotá D.C.; bodega de Funza (Cundinamarca) |
| Ciclo de vida | Adaptativo (ágil): Scrum con tablero Kanban; entregables de preparación predictivos en la EDT |
| Patrocinador | Gerencia General |
| Director de proyecto | Jefe de la PMO (25 % de dedicación) |
| Dueño del producto | Gerente administrativo y financiero |
| Scrum Master / facilitador | Profesional de la PMO (50 % de dedicación) |
| Desarrolladores (equipo Scrum) | Consultor funcional ERP, desarrollador ERP, desarrollador de integraciones y analista de pruebas del socio implementador, y analista de TI de la empresa |
| Fechas | Inicio 4 de mayo de 2026 · LB0 10 de julio de 2026 · corte 9 de octubre de 2026 (viernes) · fin 29 de enero de 2027 |
| Presupuesto aprobado | **COP 680,0 M** = BAC de las actividades 601,3 M + reserva para contingencias 60,0 M + reserva de gestión 18,7 M |
| Equivalencia en dólares | ≈ USD 170.000 con una tasa de planificación de COP 4.000 por dólar (supuesto redondeado) |
| Releases | 3 releases con presupuesto de **COP 278 M** (96, 104 y 78 M) y 11 iteraciones de 10 días hábiles |

Módulos del ERP: inventario y alquiler de equipos (contratos de alquiler, despachos y devoluciones, disponibilidad por bodega y obra), facturación electrónica DIAN y cartera, mantenimiento de equipos (hojas de vida, órdenes de trabajo, inspecciones) y tablero gerencial. Además: migración de datos maestros, integración con el proveedor tecnológico de facturación electrónica y con las básculas de despacho (CC-001), capacitación y gestión del cambio, tres salidas en vivo y estabilización (hypercare).

---

## 2. Orientación de mercado y fuentes consultadas

Las fuentes son **guías de proveedores de software o de servicios**, no estudios independientes. Se usaron solo como orientación de órdenes de magnitud, proporciones y plazos; las cifras del ejemplo son supuestos propios. Consulta: octubre de 2026.

| Fuente | Qué dice (resumen) | Cómo se usó en el ejemplo |
|---|---|---|
| ECOSIRE, «Calculadora de costos ERP: cómo usarla» — <https://ecosire.com/es/blog/erp-cost-calculator-how-to-use> | Clasifica la complejidad por usuarios (menos de 50: simple; 50 a 200: estándar; más de 200: compleja). Modela la implementación como un porcentaje de la licencia del primer año, ajustado por módulos, complejidad y tipo de socio; licencias en la nube como suscripción anual; soporte del proveedor de 15 % a 22 % de la licencia al año. Declara una precisión de ±30 % para planificación. | Con 45 usuarios del ERP la empresa queda en el límite superior del rango «simple»; el ejemplo la presupuesta como «estándar» por las integraciones (proveedor tecnológico de la DIAN y básculas), la migración de cuatro grupos de datos y las dos bodegas. Suscripción en la nube por usuario y mes, sin licencia perpetua ni servidores propios. El presupuesto preliminar del acta (rev. 0, COP 700 M) se presenta como orden de magnitud de −10 % / +25 %. |
| Innowise, «Coste de implantación de un ERP» — <https://innowise.com/es/blog/erp-implementation-cost/> | Mediana empresa: USD 100.000 a 500.000 de implantación. Recomienda una contingencia de 10 % a 20 % del presupuesto. Costos ocultos: limpieza de datos antes de migrar, gestión del cambio, soporte intensivo tras la salida en vivo, informes solicitados tarde, integraciones no detectadas y tiempo del equipo interno; pueden aumentar el presupuesto inicial entre 10 % y 20 %. | Presupuesto total de ≈ USD 170.000, en la parte baja del rango de la mediana empresa y dentro del rango de orientación del brief (USD 100.000 a 280.000 para empresas de 50 a 200 empleados). Reserva para contingencias de 10,0 % del BAC. Los costos ocultos tienen actividades propias: depuración de datos maestros, gestión del cambio, estabilización y horas internas de usuarios clave. |
| Softland Colombia, «¿Qué es un sistema ERP? Guía completa» — <https://softland.com/co/?p=19127> | Implementación de 2 a 6 meses en la mayoría de los casos, según módulos, documentación de procesos, personalización y disponibilidad del equipo. El ERP debe cubrir la facturación electrónica de la DIAN; sin cobertura nativa requiere desarrollos adicionales que encarecen la implementación. Recomienda documentar procesos, preparar al equipo, definir indicadores antes de empezar y arrancar con los módulos esenciales. | Releases de 6 a 9 semanas de iteraciones (2 meses por fase en promedio) y 9 meses en total con selección y estabilización. Integración con un proveedor tecnológico autorizado y bolsa de horas para el conector. Indicadores de la visión del producto con línea base medida antes de empezar. El release 1 es el módulo esencial (inventario y alquiler). |

---

## 3. Supuestos de la empresa y del alcance

- Empresa mediana de alquiler de equipos de construcción con dos bodegas y obras activas en Bogotá y la Sabana; hoy controla equipos, remisiones y alquiler en hojas de cálculo y factura con el software contable al final del mes.
- 45 usuarios del ERP: **30 completos** (comercial, logística, almacén, facturación, cartera, contabilidad, mantenimiento y gerencia) y **15 limitados** (consultas, aprobaciones y registro en tableta del personal de bodega y los conductores).
- ERP de mercado medio en la nube con un **socio implementador** local; el fabricante solo vende la suscripción.
- Fuera del alcance (visión del producto y acta): nómina y gestión humana, costeo de los proyectos de montaje, portal de autoservicio para clientes y el soporte posterior a la estabilización (pasa al presupuesto de operación de TI desde febrero de 2027).
- Restricciones: facturación electrónica conforme al anexo técnico vigente de la DIAN por medio de un proveedor tecnológico autorizado; ninguna salida a producción en los cinco primeros días hábiles del mes (cierre mensual) ni antes del cierre anual; saldos migrados conciliados por contabilidad y revisoría fiscal.

---

## 4. Presupuesto por entregable (BAC de COP 601,3 M) y base de estimación

| EDT | Entregable (enfoque) | BAC (M) | Base de estimación |
|---|---|---:|---|
| 1.1 | Gestión del proyecto (heredado: adaptativo) | 60,6 | Jefe de la PMO al 25 %: COP 3,3 M por mes × 9 meses = 29,7 M (esfuerzo de nivel). Scrum Master al 50 %: COP 1,8 M por iteración × 11 = 19,8 M. Plan, plan de releases y LB0 6,5 M; arranque 1,4 M; cierre 3,2 M. |
| 1.2 | Selección y contratación del ERP y del implementador (predictivo) | 32,1 | Consultor de selección independiente: descubrimiento 14,5 M, solicitud de propuestas 4,8 M y demostraciones guiadas 7,6 M (con horas internas de usuarios clave). Asesoría jurídica de los contratos 5,2 M. |
| 1.3 | Infraestructura y licenciamiento (predictivo) | 112,6 | Suscripción: 30 usuarios completos × COP 320.000 + 15 limitados × COP 96.000 = COP 11,04 M por mes × 7 meses (julio de 2026 a enero de 2027) = 77,28 M, facturada mes vencido. Ambientes, usuarios y perfiles 3,1 M. Equipos de bodega 28,0 M (4 tabletas robustas, 6 lectores de código de barras, 2 impresoras de etiquetas y red inalámbrica de las dos bodegas). Proveedor tecnológico de facturación electrónica: habilitación y paquete anual de 6.000 documentos 4,2 M. |
| 1.4 | Migración de datos (predictivo) | 43,0 | Depuración de datos maestros 12,6 M; conteo físico y migración del inventario de la bodega principal 14,8 M; saldos de cartera 8,4 M; hojas de vida de equipos 7,2 M. |
| 1.5 | Capacitación y gestión del cambio (predictivo) | 38,6 | Plan de gestión del cambio y red de usuarios clave 6,8 M; formación de usuarios clave 9,6 M; capacitación de usuarios finales por release 8,2 M, 7,4 M y 6,6 M. |
| 1.6 | Release 1 · Inventario y alquiler de equipos (adaptativo) | 96,0 | 4 iteraciones × COP 24,0 M (sección 5). |
| 1.7 | Release 2 · Facturación electrónica y cartera (adaptativo) | 104,0 | 4 iteraciones × COP 24,0 M + bolsa de COP 8,0 M de horas del implementador para el conector con el proveedor tecnológico. |
| 1.8 | Release 3 · Mantenimiento y tablero gerencial (adaptativo) | 78,0 | 3 iteraciones × COP 24,0 M + bolsa de COP 6,0 M de horas del implementador para el modelo de datos del tablero gerencial. |
| 1.9 | Salidas en vivo y estabilización (predictivo) | 36,4 | Tres cortes y salidas a producción de COP 4,6 M cada uno. Estabilización de 13 días hábiles: 208 horas del consultor funcional y del desarrollador ERP a COP 82.500 (17,16 M) más el analista de TI (5,46 M) = 22,62 M. |
| | **Total BAC** | **601,3** | |
| | Reserva para contingencias | 60,0 | 10,0 % del BAC (Innowise recomienda 10 % a 20 %). Distribuida por riesgo en el registro de riesgos: R-001 10 M, R-002 5 M, R-003 4 M, R-004 12 M, R-005 6 M, R-006 6 M, R-007 8 M, R-008 9 M (agregado el 8 de octubre sin aumentar el total) y R-009 0 M (oportunidad). |
| | Reserva de gestión | 18,7 | 3,1 % del BAC; solo la autoriza la Gerencia General (cambios de nivel 3). |
| | **Presupuesto aprobado** | **680,0** | |

Distribución del BAC: equipo de los releases 46 % (278,0 M), licencias, equipos y servicios de infraestructura 19 % (112,6 M), gestión del proyecto 10 %, migración 7 %, capacitación y gestión del cambio 6 %, salidas y estabilización 6 %, selección y contratación 5 %.

---

## 5. Desarrolladores, releases e iteraciones

**Precio fijo por iteración.** El socio implementador aporta 240 horas por iteración de 10 días hábiles: consultor funcional ERP y desarrollador ERP con dedicación completa (80 horas cada uno), desarrollador de integraciones y analista de pruebas al 50 % (40 horas cada uno). Tarifa combinada supuesta de COP 82.500 por hora → **COP 19,8 M por iteración**. El analista de TI de la empresa trabaja con dedicación completa: costo empresa (salario y prestaciones) de **COP 4,2 M por iteración**. Cada iteración cuesta COP 24,0 M.

| Release | Iteraciones | Fechas | Presupuesto (M) | Puntos | Estado al corte |
|---|---|---|---:|---:|---|
| Release 1: inventario y alquiler de equipos | 1 a 4 | 13 jul – 9 sep 2026 | 96,0 | 118 (línea base: 102 al 10 de julio; 118 con el CC-001 el 13 de agosto) | Cerrado; en producción desde el 10 de septiembre |
| Release 2: facturación electrónica y cartera | 5 a 8 | 10 sep – 6 nov 2026 | 104,0 | 120 (línea base: 112 al 10 de septiembre; +7,1 %, nivel 1) | En curso: 56 puntos terminados (46,7 %) |
| Release 3: mantenimiento y tablero gerencial | 9 a 11 | 9 nov – 22 dic 2026 | 78,0 | 88 (sin línea base: se compromete en la iteración 9) | Planeado |

Iteraciones de 10 días hábiles con el calendario de lunes a viernes y los festivos de Colombia; cuando hay festivo la iteración termina más tarde en el calendario (las fechas las genera «Releases e iteraciones»):

| Iteración | Inicio | Fin | Estado | Comprometido | Terminado |
|---|---|---|---|---:|---:|
| 1 | 13 jul 2026 | 27 jul 2026 | Cerrada | 27 | 24 |
| 2 | 28 jul 2026 | 11 ago 2026 | Cerrada | 31 | 31 |
| 3 | 12 ago 2026 | 26 ago 2026 | Cerrada | 34 | 31 |
| 4 | 27 ago 2026 | 9 sep 2026 | Cerrada | 32 | 32 |
| 5 | 10 sep 2026 | 23 sep 2026 | Cerrada | 32 | 30 |
| 6 | 24 sep 2026 | 7 oct 2026 | Cerrada | 31 | 26 (HU-033 rechazada) |
| 7 | 8 oct 2026 | 22 oct 2026 | En curso | 31 | 2 al corte (DF-009, carril de urgencia) |
| 8 | 23 oct 2026 | 6 nov 2026 | Planeada | — | — |
| 9 | 9 nov 2026 | 23 nov 2026 | Planeada | — | — |
| 10 | 24 nov 2026 | 7 dic 2026 | Planeada | — | — |
| 11 | 9 dic 2026 | 22 dic 2026 | Planeada | — | — |

- **Velocidad supuesta** del plan de releases: 30 puntos por iteración, tomada de una implementación similar del implementador. La velocidad real se estabiliza entre 30 y 32 desde la iteración 2 y baja a 26 en la iteración 6 por la integración con la DIAN; promedio de las tres últimas iteraciones cerradas: **29,3 puntos** (32, 30 y 26).
- **Capacidad**: cinco personas, dos de ellas al 50 % = 4 personas equivalentes × 10 días = 40 días-persona por iteración, menos ausencias.
- **Salidas a producción** el día hábil siguiente a la última revisión del release, salvo cierres: release 1 el 10 de septiembre, release 2 el 10 de noviembre (después de los cinco primeros días hábiles de noviembre) y release 3 el 12 de enero de 2027 (después del cierre anual).
- **Tablero**: columnas por defecto (Por hacer; En curso, WIP 3; En revisión, WIP 2; Terminado) más «Pruebas de usuario» (en curso, WIP 2), agregada en la retrospectiva de la iteración 3 (26 de agosto). Umbral de cambio de alcance de los releases: 10 %.
- **Eventos documentados**: cada iteración cerrada (1 a 6) tiene su acta de revisión y su retrospectiva, vinculadas a la iteración en «Releases e iteraciones»; las iteraciones 6 y 7 tienen además su planificación. Las actas citan los elementos que nacieron en cada revisión (por ejemplo, DF-001 y ME-001 en la iteración 1, ME-002 y la solicitud de las básculas en la 2, DF-002 y ME-003 en la 3) y las lecciones de cada retrospectiva están en el registro de lecciones aprendidas. El acta de revisión de la iteración 1 se aprobó el día hábil siguiente (28 de julio), con DF-001 ya registrado.

---

## 6. Equipo interno y usuarios clave

- Se imputan al proyecto, como mano de obra interna, las horas de los usuarios clave y del personal de bodega en talleres de descubrimiento, demostraciones, depuración de datos, conteo físico, formación y capacitación (registros «NOM-…»). Es el «tiempo del equipo interno» que Innowise señala como costo oculto.
- **No** se imputan las dos horas diarias del dueño del producto ni la asistencia de los usuarios clave al refinamiento y a las revisiones de cada iteración: se consideran parte de su operación (supuesto conservador del ejemplo; en un proyecto real conviene medirlas).
- Facilitación: el Scrum Master / facilitador es un profesional de la PMO al 50 %; la dirección del proyecto la ejerce el jefe de la PMO al 25 %.

---

## 7. Costos reales al corte (COP 352,1 M)

Los registros de costos reales usan documentos de soporte ficticios: «FE-…» factura electrónica del proveedor, «FC-…» factura de compra de equipos y «NOM-…» nómina (horas internas). Todos tienen fecha igual o anterior al corte.

| Categoría | Costo real (M) |
|---|---:|
| Servicios profesionales (implementador, consultores y asesoría jurídica) | 198,36 |
| Mano de obra interna | 85,04 |
| Licencias (suscripción y proveedor tecnológico) | 37,32 |
| Equipos de bodega | 22,83 |
| Subcontratos (red inalámbrica) | 7,42 |
| Otros (logística de la capacitación) | 1,15 |
| **Total** | **352,12** |

- Los costos de cada iteración (implementador COP 19,8 M y analista de TI COP 4,2 M, más las horas adicionales del conector o del ensayo de corte) se registran al cierre de la iteración con el **release** (`releaseId`): 15 registros por COP 150,3 M (release 1: 97,8 M; release 2: 52,5 M). Con esos registros la aplicación calcula el costo real del AgileEVM (`PM.agile.releaseActualCost`).
- El Scrum Master se registra por iteración en la gestión del proyecto (1.1), no en los releases.
- La suscripción se factura mes vencido: al corte hay tres facturas (julio, agosto y septiembre, COP 33,12 M) frente a un avance por tiempo de 49 %, lo que compensa en parte las variaciones de costo.
- Variaciones de costo explicadas en el informe de desempeño: horas adicionales del conector con el proveedor tecnológico (release 2), depuración de datos maestros tres días más larga (14 % de las referencias sin peso unitario y clientes duplicados, riesgo R-001), equipos de bodega importados encarecidos por la tasa de cambio y horas extra del ensayo de corte del release 1.

---

## 8. Cifras que calcula la aplicación al corte (9 de octubre de 2026)

Estas cifras no se escriben a mano: salen de `PM.calc` y `PM.agile` con los datos del ejemplo y los documentos las citan desde esos cálculos. Si cambian los datos, `test/example-erp.test.mjs` detecta cualquier diferencia.

| Indicador | Valor |
|---|---|
| Valor ganado del proyecto (LB0) | BAC 601,3 M · PV 355,7 M · EV 345,8 M · AC 352,1 M |
| Índices | SPI 0,97 · CPI 0,98 · TCPI 1,03 |
| Pronóstico | EAC 612,4 M (típico, BAC/CPI) · VAC −11,1 M, cubierto por la reserva para contingencias |
| Avance | 57,5 % real frente a 59,2 % planificado |
| Fin pronosticado | 29 de enero de 2027 (cronograma actualizado al corte); la salida del release 2 se mueve del 10 al 12 de noviembre |
| Velocidad | 24, 31, 31, 32, 30 y 26 puntos en las iteraciones 1 a 6; promedio de las tres últimas 29,3 |
| Release 1 | 118 de 118 puntos · AgileEVM: AC 97,8 M, SPI 1,00, CPI 0,98 |
| Release 2 | 56 de 120 puntos (46,7 %) · AgileEVM: PPC 50 %, PV 52,0 M, EV 48,5 M, AC 52,5 M, SPI 0,93, CPI 0,92, EAC 112,5 M |
| Pronóstico del release 2 | Con la velocidad del release (28 puntos por iteración) faltan 3 iteraciones: terminaría el 23 de noviembre de 2026, después del 6 de noviembre. Decisión del dueño del producto el 14 de octubre: diferir 8 puntos «Podría tener» (nivel 1) o tramitar el CC-002 para mover la fecha (nivel 2). |
| Iteración 7 | Comprometido 31 · alcance 33 (DF-009 entró por urgencia) · terminado 2 · restante 31 |
| Tablero Kanban | «En curso» en su límite WIP (3 de 3); TA-011 bloqueado (falta el auxiliar de cartera conciliado a 30 de septiembre) |
| Curva S | Las actividades de los tres releases toman su avance del backlog (100 %, 46,7 % y 0 %) y entran al valor ganado del proyecto |

**Control de cambios en dos niveles**

- CC-001 (nivel 2, aprobado por el comité de control de cambios el 13 de agosto): integración con las básculas de despacho en el release 1. El alcance pasa de 102 a 118 puntos (+15,7 %, por encima del umbral de 10 %) sin cambiar la fecha ni el presupuesto del release; la línea base del release 1 se actualiza con `changeRef: 'CC-001'`. La LB0 del proyecto no cambia.
- Release 2 (nivel 1): en la revisión de la iteración 6 su alcance pasa de 112 a 120 puntos (+7,1 %) por HU-041 y ME-009, dentro del umbral: lo decide el dueño del producto sin solicitud de cambio.

**Backlog**: 90 elementos (8 épicas, 43 historias de usuario, 14 tareas, 9 defectos, 10 mejoras y 6 investigaciones), estimaciones en la serie de Fibonacci, prioridad MoSCoW, criterios de aceptación en formato Dado/Cuando/Entonces o lista, historial de estados coherente con las fechas de las iteraciones y 4 elementos sin estimar pendientes de refinamiento.

---

## 9. Catálogo de recursos (9.2, 9.3 y 9.6)

La herramienta «resources» del ejemplo (`src/94-example-erp.js`, SPEC §10) tiene 26 recursos con los tipos del preset «Tecnología y sistemas» y un recurso por cada nombre de las asignaciones del cronograma (las asignaciones llevan `resourceId`). Las tarifas son supuestos coherentes con las secciones 4 a 7.

| Recurso | Tipo | Costo unitario | Base |
|---|---|---|---|
| Consultor funcional ERP, desarrollador ERP, desarrollador de integraciones y analista de pruebas | Consultoría y servicios (implementador) | COP 660.000 por día | 8 h × COP 82.500; los dos primeros al 100 % y los otros dos al 50 % suman las 240 horas por iteración del precio fijo |
| Analista de TI | Personas del proyecto | COP 420.000 por día | COP 4,2 M por iteración de 10 días hábiles |
| Scrum Master / facilitador | Personas del proyecto | COP 360.000 por día | COP 1,8 M por iteración al 50 % |
| Dueño del producto | Personas del proyecto | 0 | Su tiempo no se imputa al proyecto (sección 6) |
| Director de proyecto (jefe de la PMO) | Personas del proyecto | COP 628.600 por día | COP 3,3 M al mes al 25 % |
| Suscripción del ERP | Licencias y suscripciones | COP 320.000 y COP 96.000 por usuario-mes | 210 usuarios-mes completos y 105 limitados = COP 77,28 M (t12) |
| Tabletas, lectores, impresoras y red inalámbrica | Equipos de cómputo e infraestructura | COP 2,8 M, 1,1 M, 1,6 M y 7,0 M | 4, 6, 2 y 1 = COP 28,0 M (t14) |

- **Formas de costeo.** Todas las actividades conservan su precio global salvo dos cuyo costo calculado es exactamente el presupuestado: el release 2 (t26) de forma mixta, con la bolsa fija de COP 8,0 M del conector más el equipo (40 días × COP 2,4 M = COP 96,0 M), y la estabilización (t34) por recursos (13 días × COP 1,74 M = COP 22,62 M). El valor ganado de la sección 8 no cambia.
- **Equipo Scrum y capacidad sugerida.** Las cinco personas del equipo de desarrollo están marcadas como equipo ágil con su dedicación (dos al 50 %) y 8 horas por día, con las ausencias de las planificaciones: incapacidad del desarrollador ERP del 15 al 17 de septiembre (iteración 5: 37 días-persona), vacaciones del analista de TI el 1 y el 2 de octubre (iteración 6: 38) y vacaciones del analista de pruebas del 26 al 30 de octubre (iteración 8: 37,5 de 40). La capacidad sugerida es la velocidad media (29,3 puntos) por esa proporción: 29,3 puntos en la iteración 7 y **27,5 puntos** en la 8. Los festivos del 12 de octubre y del 2 de noviembre no son días de esas iteraciones. En el histograma, los días de ausencia aparecen sin disponibilidad frente a la asignación del release.
- **No planificados.** Las tabletas de prueba del implementador que el equipo usó mientras llegaban las importadas (INC-001), por cuenta del contratista, y las horas extra del ensayo de corte del release 1 (acción correctiva: su costo es una variación). Ninguno usa la reserva para contingencias, que no se ha usado, ni cambia la línea base.
- **Estructura de desglose de los riesgos.** El plan de gestión de los riesgos (rev. 0, aprobado con la LB0) define ocho subcategorías en las cuatro categorías; cada riesgo del registro, y de sus revisiones, tiene la suya.

---

## 10. Limitaciones

- Las cifras son supuestos de un ejemplo didáctico. Precios de suscripción, tarifas, equipos y plazos cambian por fabricante, implementador, número de usuarios, tasa de cambio y fecha; un proyecto real debe cotizarlos.
- Las fuentes de la sección 2 son guías comerciales de proveedores; sus rangos son amplios y no distinguen el mercado colombiano (salvo Softland en plazos y facturación electrónica).
- No se modelan el soporte anual del fabricante ni la suscripción después de enero de 2027 (operación de TI), ni el IVA, ni los costos de la nómina electrónica (fuera del alcance).
- Las tarifas por hora y los costos de personal interno son supuestos redondeados para que las cuentas se puedan seguir a mano (por ejemplo, 240 horas × COP 82.500 = COP 19,8 M).

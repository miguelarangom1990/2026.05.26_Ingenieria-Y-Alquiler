# Supuestos y fuentes del ejemplo «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler»

Este documento explica las cifras del proyecto de ejemplo ágil `erp` del Gestor de Proyectos PMBOK (SPEC §9.7). El proyecto es **ficticio**: las cifras son **supuestos del ejemplo**, calibrados con guías de proveedores de software y consultoría que se citan en la sección 2. No son cotizaciones ni precios de un fabricante, un implementador o un proveedor tecnológico real. Se usan roles, no nombres de personas.

- Datos y cálculos: `src/94-example-erp.js` (EDT, cronograma, costos, capa ágil, backlog, RACI y línea base LB0).
- Documentos: `src/95-example-erp-docs.js`, los ejemplos de las plantillas ágiles en `src/14-templates-agile.js` y cuatro módulos que se registran en `PM.exampleDocs.erpParts` (secciones 11 a 14): `src/97-example-erp-docs-integracion.js`, `src/97-example-erp-docs-adquisiciones.js`, `src/97-example-erp-docs-comunicaciones.js` y `src/97-example-erp-docs-equipo.js`.
- Verificación: `test/example-erp.test.mjs` compara cada cifra de los documentos con lo que calcula la aplicación (`PM.calc.*`, `PM.agile.*`); cada módulo 97 tiene su prueba (`test/example-erp-docs-integracion.test.mjs`, `-adquisiciones`, `-comunicaciones` y `-equipo`).

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

**Documentos del ejemplo y enfoque de la metodología.** La lista de documentos tiene la columna «Enfoque» y el filtro «Enfoque de la metodología» (`src/11-doc-approach.js`). De las 59 plantillas, 25 son predictivas, 6 ágiles y 28 de ambos enfoques. El filtro «Proyecto ágil (ágiles y de ambos enfoques)» muestra las que aplican a este proyecto. La clasificación es orientativa: dice a qué enfoque pertenece cada documento, no que esté prohibido en el otro.

| Enfoque | Plantillas que usa el ejemplo | Documentos al corte |
|---|---|---:|
| Ágil | Las 6: visión del producto, definición de listo y de terminado, plan de releases, planificación, revisión y retrospectiva de la iteración | 22 |
| Ambos enfoques | 26 de 28: todas las que corresponden a la fecha de corte. El informe final y el acta de cierre se harán al cierre, en enero de 2027 | 34 |
| Predictivo | 2 de 25: el plan de gestión de cambios y el plan de gestión de los riesgos (rev. 0 del 10 de julio de 2026), aprobados con la LB0. El ejemplo los usa para el control de cambios en dos niveles y la reserva para contingencias por riesgo | 2 |
| **Total** | **34 plantillas** | **58** |

Las plantillas múltiples (enunciados del trabajo, planificaciones de la iteración, actas de reunión, etc.) juntan las instancias de 95 y de los módulos 97 y se numeran por fecha de creación (`src/94-example-erp.js`). Por eso las planificaciones de las iteraciones 6 y 7, que están en 95, son PIT-06 y PIT-07.

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
- **Eventos documentados**: cada iteración cerrada (1 a 6) tiene su acta de revisión y su retrospectiva, vinculadas a la iteración en «Releases e iteraciones»; las iteraciones 1 a 7 tienen además su planificación (PIT-01 a PIT-07; las de la 1 a la 5 están en la sección 14). Las actas citan los elementos que nacieron en cada revisión (por ejemplo, DF-001 y ME-001 en la iteración 1, ME-002 y la solicitud de las básculas en la 2, DF-002 y ME-003 en la 3) y las lecciones de cada retrospectiva están en el registro de lecciones aprendidas. El acta de revisión de la iteración 1 se aprobó el día hábil siguiente (28 de julio), con DF-001 ya registrado.
- **Equipo y pruebas**: el equipo Scrum tiene su acta de constitución (rev. 1, con los acuerdos de las retrospectivas de las iteraciones 1 a 3). Los documentos de prueba y evaluación (rev. 2A, en revisión al corte) organizan las pruebas por elemento, por release y por migración (sección 14).

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
- **Categorías de costo.** Cada actividad con presupuesto lleva su categoría (`costCategory`) para el desglose de costos por categoría: tiempo del personal interno (dirección, facilitación, migración y conciliaciones) como mano de obra; consultores externos, implementador (iteraciones de precio fijo, capacitación y salidas en vivo), suscripción del ERP y proveedor de facturación electrónica como servicios; tabletas, lectores, impresoras y red de bodegas como equipos. En t26 es la categoría de la bolsa fija (servicios); en t34 cada línea va por el tipo de su recurso. Plan vigente (M): Servicios 447,4, Mano de obra 125,9 y Equipos 28,0 (suma 601,3). No cambia costos ni valor ganado.
- **Equipo Scrum y capacidad sugerida.** Las cinco personas del equipo de desarrollo están marcadas como equipo ágil con su dedicación (dos al 50 %) y 8 horas por día, con sus ausencias: incapacidad del desarrollador ERP del 15 al 17 de septiembre (iteración 5: 37 días-persona; no se conocía al planificarla, sección 14), vacaciones del analista de TI el 1 y el 2 de octubre (iteración 6: 38) y vacaciones del analista de pruebas del 26 al 30 de octubre (iteración 8: 37,5). La capacidad sugerida es la velocidad media (29,3 puntos) por la proporción entre los días-persona de la iteración y el promedio de las iteraciones de las que sale esa velocidad (5 a 7: 37, 38 y 40, en promedio 38,3): 30,6 puntos en la iteración 7, con el equipo completo, y **28,7 puntos** en la 8. Los festivos del 12 de octubre y del 2 de noviembre no son días de esas iteraciones. En el histograma, los días de ausencia aparecen sin disponibilidad frente a la asignación del release.
- **No planificados.** Las tabletas de prueba del implementador, que el equipo usó en la iteración 2 mientras se configuraban las importadas (llegaron dos días hábiles tarde, INC-001), por cuenta del contratista, y las horas extra del ensayo de corte del release 1 (acción correctiva: su costo es una variación). Ninguno usa la reserva para contingencias, que no se ha usado, ni cambia la línea base.
- **Estructura de desglose de los riesgos.** El plan de gestión de los riesgos (rev. 0, aprobado con la LB0) define ocho subcategorías en las cuatro categorías; cada riesgo del registro, y de sus revisiones, tiene la suya.

---

## 10. Integración: caso de negocio, beneficios, supuestos, plan para la dirección y financiamiento

Los cinco documentos los genera `src/97-example-erp-docs-integracion.js` y `test/example-erp-docs-integracion.test.mjs` compara cada cifra con lo que calcula la aplicación. Las cinco plantillas son de ambos enfoques y aquí siguen la práctica ágil: el caso de negocio y los beneficios se revisan al cerrar cada release, y el financiamiento se libera por tramos según el valor que confirma cada revisión.

| Documento | Código | Estado al corte | Versiones |
|---|---|---|---|
| Caso de negocio | PRY-2026-021-CNEG | Aprobado, rev. 1 | Rev. 0 del 4 de mayo de 2026, aprobada con el acta de constitución: presupuesto preliminar de COP 700 M. Rev. 1 del 11 de septiembre, día hábil siguiente a la salida del release 1: presupuesto aprobado, suscripción contratada y primeros resultados; con ella se libera el tramo 3 del financiamiento, que cubre desde octubre. |
| Plan de gestión de los beneficios | PRY-2026-021-PBEN | Aprobado, rev. 2 | Rev. 0 del 4 de mayo (líneas base estimadas). Rev. 1 del 10 de julio (líneas base medidas en el descubrimiento y metas de la visión del producto). Rev. 2 del 11 de septiembre (primera medición y control de faltantes con el peso de báscula del CC-001). |
| Registro de supuestos | PRY-2026-021-RSUP | En revisión, rev. 2A del 8 de octubre | Rev. 0 del 5 de mayo, después de la reunión de arranque (7 supuestos y restricciones). Rev. 1 del 10 de julio, con la LB0 (13). Al corte tiene 14. |
| Plan para la dirección del proyecto | PRY-2026-021-PDP | Aprobado, rev. 2 | Rev. 0 del 10 de julio, con la LB0 (release 1 con 102 puntos). Rev. 1 del 13 de agosto: CC-001, release 1 con 118 puntos. Rev. 2 del 24 de septiembre, con la rev. 2 del plan de releases: línea base del release 2 en 112 puntos, caso de negocio rev. 1 y beneficios rev. 2. La LB0 del proyecto no cambia en ninguna. |
| Requisitos de financiamiento del proyecto | PRY-2026-021-RFI | En revisión, rev. 1A del 9 de octubre | Rev. 0 del 10 de julio, con la LB0. La rev. 1A compara al corte el costo real con el plan y con los tramos liberados. |

Los dos documentos en revisión llevan en el cajetín «Aprobó: Gerencia General», para que se sepa a quién le toca aprobarlos. En todo el ejemplo, una revisión aprobada muestra quién la aprobó aunque la emisión vigente esté en revisión: la que declara la revisión (por ejemplo, el comité de control de cambios en la rev. 0 del registro de cambios y el dueño del producto en las de los documentos de prueba) o, si no, la del cajetín vigente o la Gerencia General.

### 10.1 Beneficios del caso de negocio (supuestos del ejemplo)

Solo el caso de negocio fija estos beneficios. Son supuestos del ejemplo, no datos de una empresa real: constantes `BEN` y `ALT` del módulo (`PM.exampleDocs.erpIntegracion`). Cada beneficio anual se redondea a COP 0,1 M.

| Beneficio anual a plena adopción | Base del cálculo | COP M |
|---|---|---:|
| Facturación completa | 1 % de los ingresos de alquiler y servicios de 2025 (COP 22.000 M): días de alquiler, transportes, faltantes y daños que hoy no se cobran | 220,0 |
| Utilización del andamio multidireccional | 20.000 m² × 13 puntos (de 62 % a 75 %) × COP 9.800 por m² al mes × 12 × 50 % atribuible al ERP × 70 % de margen de contribución | 107,0 |
| Costo financiero de la cartera vencida | Cartera total de COP 5.500 M × 8 puntos menos de cartera vencida a más de 60 días (de 18 % a 10 %) × 18 % anual | 79,2 |
| Tiempo administrativo liberado | 420 días-persona al año (cierre de facturación, conciliaciones y digitación) × COP 180.000, costo del día de un usuario clave en el catálogo de recursos | 75,6 |
| **Total anual** | | **481,8** |

- **Horizonte.** Tres años de operación (2027 a 2029), con 70 % del beneficio el primer año: 481,8 × 2,7 = **COP 1.300,9 M** de beneficio bruto. Es el mismo horizonte del costo total a tres años de la evaluación de ofertas (entregable 1.2.2 de la EDT) y de la fuente de ECOSIRE (sección 2).
- **Operación.** Se descuenta la suscripción de los tres años. La rev. 0 la estima en cerca de COP 11 M al mes (36 meses = COP 396,0 M, referencia de mercado). La rev. 1 usa la contratada: 30 usuarios completos × COP 320.000 + 15 limitados × COP 96.000 = COP 11.040.000 al mes (COP 397,44 M).
- **Margen** («Margen bruto esperado»): beneficio neto ÷ beneficio después de la operación de la alternativa recomendada. **Recuperación** de la inversión: cerca de 2,4 años desde 2027, en las dos revisiones.

| Alternativa (3 años) | Inversión (M) | Beneficio después de la operación (M) | Beneficio neto (M) |
|---|---:|---:|---:|
| A. No hacer nada | 0 | 0 | 0 |
| B. Hacer lo mínimo: conector de facturación electrónica y aplicación de bodega. Captura 40 % de la facturación recuperada y 30 % del tiempo liberado; operación de COP 40 M al año | 160,0 | 178,8 | 18,8 |
| C. ERP en la nube con socio implementador, por releases (recomendada), rev. 0 con el presupuesto preliminar | 700,0 | 904,9 | **204,9** (margen 22,6 %) |
| C. Ídem, rev. 1 con el presupuesto aprobado | 680,0 | 903,46 | **223,46** (margen 24,7 %) |
| D. ERP con servidores propios y desarrollos a la medida. Operación de COP 160 M al año; logra 20 % del beneficio el primer año | 1.150,0 | 580,0 | −570,0 |

La rev. 1 cita el cierre del release 1, con cifras calculadas: 118 de 118 puntos; costo real de COP 97,8 M (`PM.agile.releaseActualCost`) frente a COP 96,0 M presupuestados (CPI 0,98); inventario migrado con 0,4 % de diferencia (nota de la actividad t17), y tramo 3 del financiamiento (COP 187,4 M) para octubre y noviembre: el resto del release 2 y el inicio del release 3. El release 2 empezó el 10 de septiembre con el tramo 2, que cubre hasta el 30 de septiembre.

Los criterios de éxito de la rev. 1 son las cinco métricas de la visión del producto. Cuando la línea base no es un número, se escribe aparte: «Facturas electrónicas rechazadas por la DIAN: línea base, sin integración (facturación manual en el portal del proveedor); meta, menos de 1 % de las emitidas al 30 de noviembre de 2026».

### 10.2 Plan de gestión de los beneficios

- **Metas.** Las cinco métricas de éxito de la visión del producto, con línea base, meta y fecha (corto y mediano plazo).
- **Beneficios monetarios del caso de negocio.** Dos filas tangibles a largo plazo (más de un año), cuyo dueño es el gerente administrativo y financiero: facturación recuperada, COP 220 M al año a plena adopción (70 % en 2027) frente a la base de 2025, y tiempo administrativo liberado, 420 días-persona al año (COP 75,6 M). La utilización y la cartera ya se miden con sus métricas de la visión; su valor en pesos sale de las bases del caso.
- **Otros beneficios.** Uno tangible, el mantenimiento preventivo (100 % de la maquinaria serializada al 31 de marzo de 2027, a cargo del jefe de mantenimiento), y dos intangibles: un solo dato por equipo y el cobro con soporte de faltantes y daños (en la rev. 2, con el peso de báscula: toda devolución con más de 3 % de diferencia se cuenta por pieza y se valora antes de facturar).
- **Dueños.** El dueño del producto, de facturación, cartera, facturación recuperada y tiempo liberado; el jefe de almacén y el coordinador logístico, del inventario; la Gerencia General, de la utilización; el jefe de mantenimiento, del preventivo.
- **Medición.** Mensual desde la salida del release que habilita cada beneficio: release 1, inventario, faltantes y utilización (un reporte del ERP mide la utilización hasta que la reemplace el tablero gerencial); release 2, facturación y cartera; release 3, mantenimiento y tablero gerencial. La facturación recuperada y el tiempo liberado se miden cada año frente a la base de 2025. Primera medición al cierre del release 1: inventario migrado con 0,4 % de diferencia; el conteo cíclico empieza en octubre de 2026.
- **Transición.** Al cierre del proyecto la PMO y la gerencia administrativa siguen midiendo cada mes hasta el 31 de marzo de 2027, fecha de la meta de cartera. Los beneficios monetarios se siguen hasta 2029, el horizonte del caso, en su revisión anual con la Gerencia General.
- **Líneas base de la rev. 0 (supuestos).** Estimaciones previas al descubrimiento: «cerca de 4 %» de diferencia de inventario, «cerca de 62 %» de utilización y 18 % de cartera vencida del informe de cartera de abril de 2026. La rev. 1 las reemplaza por las medidas (3,8 % y 62 % en julio de 2026).

### 10.3 Requisitos de financiamiento

- **Egresos.** Valor planificado mensual de la LB0 (`PM.calc.evm(...).pvAt` al cierre de cada mes): el costo devengado, no un programa de pagos. Suman el BAC de COP 601,3 M.
- **Reserva para contingencias** (COP 60,0 M). Cada riesgo del registro rev. 0 se reparte en los meses de las actividades que expone, en proporción a su valor planificado (`RISK_TASKS` del módulo): R-001, migraciones (t16 a t19); R-002 y R-007, releases (t25 a t27); R-003, capacitaciones y salidas; R-004, proveedor tecnológico (t15) y release 2; R-005, releases y estabilización (t34); R-006, salidas a producción.
- **Tramos.** Recursos propios (capital de trabajo) en ventanas de meses completos que suman la línea base de costos (COP 661,3 M); la reserva de gestión (COP 18,7 M) queda en la tesorería. El tramo 1 se libera con el acta de constitución; el tramo 2, al firmar los contratos (30 de junio de 2026, hito t11), y la LB0 lo confirma el 10 de julio. Desde el tramo 3, cada tramo se libera solo si la revisión del caso de negocio al cierre de un release confirma su valor (día hábil siguiente a la salida) y cubre desde el mes siguiente; el arranque del release siguiente lo financia el tramo anterior. La holgura acumulada nunca es negativa y queda en cero al cerrar cada ventana.

| Mes | Egresos LB0 (M) | Contingencia (M) | Tramo (M) |
|---|---:|---:|---:|
| Mayo de 2026 | 20,9 | 0,0 | 39,7 (tramo 1, acta) |
| Junio de 2026 | 18,8 | 0,0 | — |
| Julio de 2026 | 114,5 | 5,0 | 315,3 (tramo 2, contratos del 30 de junio) |
| Agosto de 2026 | 75,9 | 6,7 | — |
| Septiembre de 2026 | 97,3 | 15,9 | — |
| Octubre de 2026 | 84,1 | 14,2 | 187,4 (tramo 3, revisión del 11 de septiembre) |
| Noviembre de 2026 | 79,3 | 9,8 | — |
| Diciembre de 2026 | 66,7 | 5,2 | 118,9 (tramo 4, revisión prevista del 11 de noviembre) |
| Enero de 2027 | 43,8 | 3,2 | — |
| **Total** | **601,3** | **60,0** | **661,3** |

El alcance de cada ventana no se escribe a mano: el módulo lo calcula con las actividades predictivas que tienen valor planificado en ella y con las iteraciones que caen en ella (completas, o su inicio o su final). Cada tramo incluye también los costos continuos de sus meses: la dirección del proyecto y, desde julio, la suscripción y la facilitación ágil. El mes de mayor egreso es julio de 2026 (COP 119,5 M con la contingencia).

| Tramo | Ventana | Alcance (calculado) |
|---|---|---|
| 1 | Mayo y junio de 2026 | Arranque, descubrimiento, solicitud de propuestas, demostraciones y negociación de los contratos |
| 2 | Julio a septiembre de 2026 | Planificación, ambientes, equipos de bodega, gestión del cambio, depuración de datos, formación de usuarios clave, habilitación del proveedor tecnológico, migración del inventario, capacitación y salida del release 1; release 1 (iteraciones 1 a 4), la iteración 5 y el inicio de la 6 |
| 3 | Octubre y noviembre de 2026 | Migración de cartera, capacitación y salida del release 2, migración de hojas de vida; el final de la iteración 6, las iteraciones 7 a 9 y el inicio de la 10 |
| 4 | Diciembre de 2026 y enero de 2027 | Migración de hojas de vida, capacitación y salida del release 3, estabilización y cierre; el final de la iteración 10 y la 11 |

- **Componentes de los egresos.** Implementador a precio fijo, COP 19,8 M por iteración = (660.000 + 660.000 + 330.000 + 330.000) × 10 días del catálogo; bolsas de COP 8,0 M (t26) y COP 6,0 M (presupuesto del release 3 menos tres iteraciones de COP 24,0 M); suscripción de COP 11.040.000 al mes de julio de 2026 a enero de 2027; equipos de bodega, paquete de facturación electrónica, consultores y horas internas. El documento remite a las condiciones de pago de cada contrato (sección 12): el desembolso de caja va detrás del devengo, así que los tramos dejan un margen de caja.
- **Rev. 1A al corte del 9 de octubre.** Tramos 1 a 3 liberados: COP 542,4 M; costo real COP 352,1 M frente a un valor planificado de COP 355,7 M (holgura de COP 190,3 M). El tramo 1 cerró con COP 41,5 M reales frente a 39,7 M; el exceso de COP 1,8 M lo absorbió el tramo 2, disponible desde el 30 de junio. El tramo 2 cerró con COP 280,9 M frente a 315,3 M.
- **Riesgos de la rev. 1A.** Materializado: la tasa de cambio encareció los equipos de bodega en COP 2,3 M (S-03). En seguimiento (R-004): el conector consumió COP 4,5 M de la bolsa de 8,0 M (horas adicionales de las iteraciones 5 y 6) con el release 2 en 46,7 % (56 de 120 puntos): COP 767.000 por encima de la parte de la bolsa que corresponde a ese avance (8,0 × 46,7 % = 3,7 M); al mismo ritmo llegaría a COP 9,6 M, 1,6 M más que la bolsa. No se presenta como un sobrecosto ya materializado. El EAC (COP 612,4 M, VAC −11,1 M) cabe en la reserva para contingencias, que ya está en los tramos.

### 10.4 Registro de supuestos y plan para la dirección

- **Supuestos.** Coinciden con los del plan de releases: dedicación del dueño del producto, usuarios clave, ambiente de habilitación, velocidad de 28 a 32 puntos y salidas fuera del cierre mensual.
- **Fechas de validación**, tomadas de los datos: S-03 (tasa de cambio), descartado el 24 de julio con el sobrecosto real de la actividad t14; S-08 (depuración en 20 días hábiles), descartado el 14 de agosto, tres días hábiles después de la LB0; S-09 (habilitación del proveedor tecnológico), validado el 31 de agosto; S-14 (básculas), validado con el CC-001 el 13 de agosto; S-12 (suscripción de 45 usuarios) y S-13 (precio fijo del implementador), restricciones de los contratos del 30 de junio.
- **S-13.** Limita la regla de horas adicionales a las iteraciones: el implementador trabaja a precio fijo de 240 horas por iteración y las horas adicionales de las iteraciones solo entran con las bolsas del conector y del tablero gerencial o con una solicitud de cambio. Sus servicios fuera de los releases (ambientes, formación, capacitación, apoyo a la migración, salidas y estabilización) son aparte: se contratan con órdenes de servicio a la tarifa del contrato (sección 12).
- **Por validar al corte.** S-10 (velocidad, R-008) hasta el cierre de la iteración 7 (22 de octubre) y S-11 (auxiliar de cartera, INC-003) hasta el 13 de octubre.
- **Plan para la dirección: fases.** Usan las fechas de la LB0: contratos el 30 de junio, LB0 el 10 de julio, salidas a producción el 10 de septiembre, el 10 de noviembre y el 12 de enero, y cierre el 29 de enero de 2027.
- **Mantenimiento del plan.** Se revisa después del cierre de cada release, con la hoja de ruta actualizada del plan de releases, y con cada cambio aprobado a una línea base. Cada versión cita la revisión vigente a su fecha de cada plan y documento, también los de los otros módulos 97: la rev. 0 cita PGCM rev. 0, PGAD rev. 1, PIIN rev. 0, ACE rev. 0 y DPE rev. 0, y la rev. 2 cita PGCM rev. 1, PIIN rev. 1, ACE rev. 1 y DPE rev. 1.
- **Umbrales.** CPI acumulado de 0,95 o más en cada corte (criterio de éxito de costo del acta) y SPI de 0,95 o más como alerta temprana del plan (el criterio de cronograma del acta es que ninguna salida a producción se mueva más de una iteración); entre 0,90 y 0,94, acciones en el comité quincenal; por debajo de 0,90 se escala a la Gerencia General. Es el mismo corte de 0,90 que usa la aplicación para el tono crítico de los índices (`PM.calc.indexTone`). Los niveles de cambio son los del plan de gestión de cambios.

---

## 11. Adquisiciones

Los diez documentos los genera `src/97-example-erp-docs-adquisiciones.js` y los verifica `test/example-erp-docs-adquisiciones.test.mjs`: plan de gestión de las adquisiciones, estrategia, análisis de hacer o comprar, cuatro enunciados del trabajo (SOW), criterios de selección y evaluación de ofertas, registro de contratos y acuerdos, y seguimiento de contratos y desempeño de proveedores. Las siete plantillas son de ambos enfoques: el contrato de implementación recoge el enfoque ágil (capacidad por iteración, eventos de Scrum y definición de terminado como condición de entrega).

**De dónde salen las cifras.** Las fechas, de las actividades de la LB0 (t07 a t15 y t20) y del calendario del proyecto; los valores de los contratos, del catálogo de recursos por las asignaciones del cronograma, de las iteraciones y de los presupuestos de los releases; lo ejecutado, lo pagado y lo retenido, de los costos reales agrupados por proveedor; el desempeño del implementador, de la velocidad, las revisiones y el AgileEVM de los releases. Las cifras que no salen de los datos son supuestos del módulo (`SUP`, publicado en `PM.exampleDocs.erpAdquisiciones`): costos de «hacer», tarifa de referencia, referencia de mercado de la suscripción, grupos de capacitación, puntajes de las ofertas, números de contrato y calificaciones de los proveedores.

### 11.1 Fechas y estados

| Documento | Estado al corte | Revisiones | Base |
|---|---|---|---|
| Plan de gestión de las adquisiciones (PGAD) | Aprobado, rev. 1 | 0: 25 may · 1: 10 jul | Rev. 0 al cerrar el descubrimiento (fin de t07), el día hábil anterior a la solicitud de propuestas (26 de mayo, inicio de t08); rev. 1 con los contratos firmados y la LB0 |
| Estrategia de las adquisiciones (EADQ) | Aprobado, rev. 0 | 0: 25 may | Con el plan; no cita precios, que son posteriores a las propuestas |
| Análisis de hacer o comprar (HOC) | Aprobado, rev. 1 | 0: 25 may · 1: 10 jul | Rev. 0 con la estimación independiente; rev. 1 con los valores contratados |
| SOW-01 Implementación del ERP por iteraciones | Aprobado, rev. 1 | 0: 26 may · 1: 30 jun | Emitido con la solicitud de propuestas; la rev. 1 es el anexo técnico del contrato CT-2026-008 |
| SOW-02 Suscripción del ERP en la nube | Aprobado, rev. 1 | 0: 26 may · 1: 30 jun | Igual que el anterior; anexo del contrato CT-2026-007 |
| SOW-03 Equipos de bodega y red inalámbrica | Aprobado, rev. 0 | 0: 16 jun | Solicitud de cotizaciones 10 días hábiles antes de t14 (1 de julio) |
| SOW-04 Servicio de facturación electrónica | Aprobado, rev. 0 | 0: 31 jul | Solicitud 10 días hábiles antes de t15 (18 de agosto) |
| Criterios de selección y evaluación de ofertas (CSP) | Aprobado, rev. 1 | 0: 26 may · 1: 22 jun | Criterios y pesos publicados con la solicitud (sin puntajes); evaluación al terminar las demostraciones (fin de t09) |
| Registro de contratos y acuerdos (RADQ) | En revisión, rev. 2A del 9 de octubre | 0: 30 jun · 1: 18 ago | Rev. 0 con las firmas (t11); rev. 1 con el contrato del proveedor tecnológico (inicio de t15) y las órdenes de equipos y red, emitidas el 1 de julio. Elabora el director, revisa el contador y aprueba la Gerencia General |
| Seguimiento de contratos y desempeño de proveedores (CADQ) | En revisión, rev. 1A del 9 de octubre | 0: 11 sep | Rev. 0 al cierre del release 1 (día hábil siguiente a su salida), con la evaluación final y la liquidación de los contratos terminados. Elabora el director, revisa el gerente administrativo y financiero y aprueba la Gerencia General |

El consecutivo de los enunciados del trabajo sigue la fecha de creación de cada uno (sección 1).

### 11.2 Contratos

| Número | Proveedor (rol) | Tipo | Valor (COP) | Vigencia | Base del valor |
|---|---|---|---:|---|---|
| OS-2026-018 | Consultor de selección (independiente) | Tiempo y materiales (T&M) con tope de jornadas | 25.740.000 | 4 may – 22 jun 2026 | 33 jornadas (t07, t08 y t09) × COP 780.000; facturado COP 22.960.000 (29,4 jornadas; FE-1182, FE-1207 y FE-1231) |
| OS-2026-031 | Firma de abogados | Precio fijo cerrado (FFP) | 5.400.000 | 23 – 30 jun 2026 | 5 jornadas (t10) × COP 1.080.000 (FE-0388) |
| CT-2026-007 | Fabricante del ERP | Precio fijo cerrado (FFP) por usuario-mes | 77.280.000 | 1 jul 2026 – 31 ene 2027 | COP 11.040.000 al mes × 7 meses (t12), mes vencido |
| CT-2026-008 | Socio implementador | Precio fijo cerrado (FFP) por iteración, con bolsas de horas con tope | 231.800.000 | 1 jul 2026 – 29 ene 2027 | 11 iteraciones × COP 19,8 M (240 horas a COP 82.500) + bolsas de COP 8,0 M (conector) y 6,0 M (tablero gerencial) |
| OS-2026-034 | Consultor de gestión del cambio | Precio fijo cerrado (FFP) | 6.500.000 | 1 – 7 jul 2026 | 5 jornadas (t20) × COP 1.300.000 (FE-0412) |
| OC-2026-052 | Distribuidor de equipos de cómputo | Precio fijo con ajuste económico de precio (FP-EPA) | 22.830.000 | 1 – 22 jul 2026 | Orden por USD 5.250 (COP 21,0 M del catálogo a la tasa de planificación de COP 4.000), facturada con la tasa de la fecha de la factura (FC-2291 y FC-2292; tasa implícita cercana a COP 4.349) |
| OS-2026-036 | Integrador de redes | Precio fijo con ajuste económico de precio (FP-EPA), llave en mano | 7.420.000 | 1 – 22 jul 2026 | COP 7,0 M del catálogo: instalación a precio fijo en pesos y puntos de acceso importados en dólares; FE-0917 trae un ajuste de COP 420.000 por la tasa de cambio (supuesto) |
| CT-2026-011 | Proveedor tecnológico autorizado por la DIAN | Precio fijo cerrado (FFP), paquete anual | 4.200.000 | 18 ago 2026 – 31 ago 2027 | Paquete anual de 6.000 documentos (t15, FE-3377); el servicio sigue después del proyecto y lo administra TI |

- Los números de contrato son consecutivos supuestos de la empresa. La compra menor de la capacitación del release 1 (salas, refrigerios y guías impresas, FE-2210) no es un contrato: la aprueba el director dentro de su límite.
- Con esos ajustes, el CV de t14 (equipos y red) es de −COP 2,25 M y coincide con el informe de desempeño de 95, que atribuye a la tasa de cambio el CV de los equipos de bodega (−COP 2,3 M).
- **Órdenes de servicio del implementador.** Los servicios por horas (ambientes, taller de planificación de releases, formación, capacitación, apoyo a la migración, salidas y estabilización; COP 82.500 por hora, líder COP 95.000) se contratan con órdenes de servicio, cada una con su alcance y su valor y con cargo al presupuesto de su actividad. No suman al valor fijo y cada una amplía las pólizas de cumplimiento, calidad y salarios (supuesto). Al corte: 8 órdenes por COP 40,2 M (FE-5101 a FE-5142), con su propia fila en el seguimiento.
- **Límite de gasto.** El director aprueba compras y órdenes hasta COP 15 M (límite de gasto del acta). La orden de la estabilización (208 horas, COP 17,2 M) lo supera, así que la aprueba la Gerencia General.

### 11.3 Condiciones supuestas

- **Pagos.** A 30 días calendario de la factura; la suscripción, mes vencido. Las bolsas se facturan por consumo al cierre de cada iteración (FE-53005 y FE-53006) y los servicios por horas, al terminar cada actividad, contra su orden de servicio.
- **Retención en garantía** del 5 % de cada iteración del implementador hasta aceptar su release. Al corte: COP 1.980.000 (iteraciones 5 y 6); la del release 1 se liberó al aceptarlo.
- **Pagado al corte** con esa regla: implementador COP 113,4 M de 163,5 M ejecutados (iteraciones y bolsa: 79,2 de 123,3; órdenes de servicio: 34,2 de 40,2); suscripción COP 22,08 M de 33,12 M; los demás contratos, pagados.
- **Liquidación.** Un contrato terminado se liquida cuando está pagado y tiene la evaluación final del proveedor. Los cinco terminados (selección, asesoría jurídica, gestión del cambio, equipos y red) figuran como «Terminado» en la rev. 1 del registro y se liquidan el 11 de septiembre de 2026, con la rev. 0 del seguimiento.
- **Pólizas.** Cumplimiento del 10 % en contratos de más de COP 15 M y en trabajos en sitio, salvo las órdenes de compra de bienes que se pagan después del recibo a satisfacción, que solo exigen la de calidad. Implementador, además, calidad (10 %) y salarios (5 %), ampliadas con cada orden de servicio. Equipos, calidad; red, calidad y responsabilidad civil extracontractual (trabajo en alturas); servicios en la nube, acuerdo de nivel de servicio con créditos por indisponibilidad, sin pólizas.
- **Formación y capacitación.** La orden de la formación de usuarios clave incluye los materiales (FE-5110: 40 horas por COP 3,3 M y materiales por COP 4,5 M). La capacitación de usuarios finales se contrata por grupos: seis por rol en cada release (18 en el enunciado del trabajo) y 12 horas por grupo en la orden del release 1 (supuesto). Esa capacitación se facturó por COP 5,9 M (FE-5133, seis grupos): 71,5 horas a la tarifa del contrato, dentro de las 72 de su orden de servicio y por encima de las 48 de la asignación de t22 en el cronograma. El director pidió revisar con el dueño del producto las horas por grupo de los releases 2 y 3 antes de emitir sus órdenes.
- **Otras cláusulas.** Reemplazo de personal del implementador en cinco días hábiles con una semana de empalme (respuesta a R-005); terminación anticipada al cierre de cualquier iteración; historias rechazadas rehechas sin costo dentro de la capacidad; los equipos de prueba del implementador corren por su cuenta; cambio de modelo de los equipos sin costo en 30 días (la investigación IN-002 de la iteración 2 confirmó los modelos). Si se aprueba mover la fecha del release 2 con una iteración adicional, se contrata con un otrosí de COP 19,8 M.

### 11.4 Análisis de hacer o comprar (tres años de operación)

| Necesidad | Hacer (COP) | Comprar, contratar o alquilar (COP) | Decisión |
|---|---|---|---|
| Plataforma del ERP | 520 M (supuesto: licencias perpetuas de 45 usuarios, servidores con respaldo, soporte anual y administración; solo la plataforma) | Rev. 1: 36 × 11,04 M = 397,44 M (precios del contrato). Rev. 0: 36 × cerca de 11 M = 396 M (referencia de mercado) | Comprar |
| Implementación | 249,2 M: 3 personas equivalentes al costo del analista de TI (4,2 M por iteración) × 17 iteraciones (curva de aprendizaje de 1,5) + 35 M de selección y formación (supuestos) | Rev. 1: 231,8 M contratados. Rev. 0: 11 × 240 horas × COP 85.000 = 224,4 M (tarifa de referencia de la estimación independiente, supuesto) | Mixto (implementador con el analista de TI en el equipo) |
| Facturación electrónica | 96 M (supuesto: solución propia habilitada y su mantenimiento) | 3 × 4,2 M = 12,6 M | Comprar |
| Depuración y migración | 43,0 M (entregable 1.4 de la LB0) | 62 M (supuesto: firma especializada) | Hacer |
| Gestión del cambio | 20 días × COP 360.000 (profesional de la PMO) = 7,2 M | 5 días × 1,3 M = 6,5 M | Mixto |
| Equipos de bodega | 90,72 M: un auxiliar por bodega a media jornada (COP 120.000 por día) × 21 días × 36 meses (supuesto: digitar actas en papel) | 21,0 M (catálogo) | Comprar |
| Red inalámbrica | 4,6 M de materiales (supuesto) + 8 jornadas del jefe de TI (COP 650.000) = 9,8 M | 7,0 M (catálogo) | Comprar |

La rev. 1 concluye que la implementación quedó en COP 231,8 M, COP 7,4 M más que la estimación del 25 de mayo por las bolsas, aunque la tarifa negociada (COP 82.500) quedó 2,9 % por debajo de la de referencia.

### 11.5 Evaluación de ofertas (22 de junio de 2026)

Pesos y puntajes de 0 a 100 son supuestos; el costo total a tres años de los oferentes A y C es 1,14 y 0,93 veces el del oferente B. El de B sale de los datos: 36 meses de suscripción (COP 397,44 M) + 11 iteraciones (COP 217,8 M) = COP 615,2 M (A: 701,4 M; C: 572,2 M). El puntaje de costo es proporcional a la oferta de menor costo.

| Criterio | Peso | A | B | C |
|---|---:|---:|---:|---:|
| Funcionalidad en los guiones de negocio | 35 % | 88 | 92 | 70 |
| Costo total a tres años | 25 % | 82 | 93 | 100 |
| Experiencia y referencias del implementador | 15 % | 90 | 85 | 60 |
| Trabajo por iteraciones y estabilidad del equipo | 15 % | 70 | 90 | 65 |
| Soporte y nivel de servicio | 10 % | 85 | 85 | 75 |
| **Total ponderado** (calculado por la plantilla) | | **83,8** | **90,2** | **75,8** |

Tres finalistas de cinco invitados (los otros dos no cumplieron los requisitos habilitantes); se adjudica al oferente B, propuesta conjunta del fabricante y el socio implementador. El oferente A aceptó el contrato por iteraciones, pero presentó un plan por fases de tres meses con una sola revisión de los usuarios por fase: por eso tiene 70 en «Trabajo por iteraciones y estabilidad del equipo».

### 11.6 Seguimiento de los proveedores (calificaciones supuestas de 1 a 5)

| Contrato | Plazo | Calidad | SST | Hechos que la sustentan |
|---|---:|---:|---:|---|
| Implementador, iteraciones y bolsas | 4 (5 al cierre del release 1) | 4 | 5 | Velocidades de 24, 31, 31, 32, 30 y 26 frente a la meta de 27 o más (90 % de la velocidad supuesta); 44 de 45 elementos aceptados (HU-033 rechazada en la iteración 6); CPI de 0,98 en el release 1 y 0,92 en el release 2; bolsa del conector 56 % usada (COP 4,5 M). Ejecutado COP 123,3 M, 53,2 % del valor fijo, con un avance de 54,5 % (6 de 11 iteraciones) |
| Implementador, órdenes de servicio | 5 | 4 | 5 | 8 órdenes por COP 40,2 M; avance de 50 % (7 de 14 actividades con servicios por horas terminadas) |
| Fabricante (suscripción) | 5 | 5 | no aplica | 3 de 7 meses facturados |
| Proveedor tecnológico | 5 | 2 (4 al cierre del release 1) | no aplica | Credenciales el 31 de agosto, antes del plazo del 9 de septiembre. Caída sin aviso del ambiente de habilitación el 30 de septiembre y el 1 de octubre (INC-002), además de medio día en la iteración 5: reclamo formal del 8 de octubre con la solicitud de aviso automático de caídas y de un crédito de servicio por los dos días; reclamación «En negociación», próximo paso el 14 de octubre |
| Distribuidor de equipos | 3 | 4 | 5 | Tabletas dos días hábiles tarde (INC-001), instaladas el 24 de julio, antes de la iteración 2. En esa iteración el equipo usó sin costo las tabletas de prueba del implementador mientras se configuraban las importadas. Reclamación resuelta sin penalidad |
| Integrador, consultores y asesoría jurídica | 5 | 4 o 5 | 5 o no aplica | Liquidados el 11 de septiembre |

---

## 12. Comunicaciones: plan, registro y actas de reunión

Los ocho documentos los genera `src/97-example-erp-docs-comunicaciones.js` y los verifica `test/example-erp-docs-comunicaciones.test.mjs`: plan de gestión de las comunicaciones (PGCM), registro de comunicaciones (RCOM) y seis actas de reunión (AREU-01 a AREU-06). Las tres plantillas son de ambos enfoques. En este proyecto ágil los eventos de Scrum y el tablero cubren al equipo y tienen sus propias actas, así que el plan se centra en los interesados que no asisten a esos eventos, el registro guarda solo las comunicaciones formales (con terceros y de gobierno del proyecto) y las actas son de comités y reuniones con decisiones.

**De dónde salen las cifras.** Ninguna se escribe a mano: las fechas salen del cronograma, de las iteraciones y los releases, del backlog y de los documentos de 95 (incidentes, riesgos, plan de gestión de cambios, CC-001, plan de releases e informe de desempeño); los valores, de la LB0, del catálogo de recursos y del costo real de los releases; los avances y las velocidades a una fecha, del backlog a esa fecha.

### 12.1 Calendario de reuniones (supuestos del módulo, `MEET`)

| Reunión o documento | Regla | Fechas en el ejemplo |
|---|---|---|
| Informe quincenal de desempeño | Corte cada dos viernes; el n.º 7 es el del 9 de octubre (informe de 95). Cada informe cubre desde el día siguiente al corte anterior y se emite el día hábil siguiente al corte (el plan exige máximo dos días hábiles). El valor ganado se calcula a la fecha de corte; los cortes de avance que guarda el gestor son mensuales (último día hábil de cada mes) | Cortes: 17 y 31 de julio, 14 y 28 de agosto, 11 y 25 de septiembre y 9 de octubre de 2026. El n.º 7 va del 28 de septiembre (primer día hábil después del corte del 25) al 9 de octubre; su borrador está en revisión del dueño del producto y se emite a más tardar el 13 de octubre |
| Comité quincenal de seguimiento | Jueves anterior a cada corte, de 8:00 a 9:30, en la sala de juntas de la sede administrativa (el implementador por videoconferencia). Antes de la LB0 sigue la misma cadencia desde la segunda semana después del arranque | 21 de mayo, 4 y 18 de junio, 2, 16 y 30 de julio, 13 y 27 de agosto, 10 (no se hizo, por la salida a producción) y 24 de septiembre, 8 y 22 de octubre de 2026 |
| Comité de control de cambios | Sesiona dentro del comité quincenal; en sesión extraordinaria cuando una decisión no espera | CC-001 en el comité del 13 de agosto; salida del release 1 en sesión extraordinaria el 9 de septiembre |
| Actas de reunión | Se envían el día de la reunión; sin observaciones en dos días hábiles se entienden aprobadas. En el gestor quedan las actas de las sesiones con decisiones; los acuerdos de las sesiones ordinarias van en el informe quincenal siguiente | Acta del 8 de octubre en revisión al corte (observaciones hasta el 13 de octubre) |

### 12.2 Actas de reunión

| Acta | Reunión | Fecha | Decisiones principales | Estado al corte |
|---|---|---|---|---|
| AREU-01 | Reunión de arranque | 5 may 2026 | Un usuario clave por área (seis); talleres de descubrimiento hasta el 25 de mayo; comité quincenal desde el 21 de mayo; comité de selección (director, dueño del producto, jefe de TI y contador, con el consultor de selección como secretario técnico sin voto) | Aprobada el 7 de mayo |
| AREU-02 | Comité de selección | 22 jun 2026 | Recomendar el finalista con el mayor puntaje (sin repetir los puntajes del documento de criterios); negociar del 23 al 30 de junio; notificar el 23 de junio | Aprobada el 24 de junio |
| AREU-03 | Comité de seguimiento (extraordinario) | 10 jul 2026 | Plan para la dirección (rev. 0), plan de releases (rev. 0) y LB0: BAC 601,3 M + contingencia 60,0 M + reserva de gestión 18,7 M = 680,0 M; iteración 1 desde el 13 de julio | Aprobada el 14 de julio |
| AREU-04 | Comité de control de cambios | 13 ago 2026 | CC-001 con la alternativa A: release 1 de 102 a 118 puntos (+15,7 %) sin cambiar fecha ni presupuesto; la Gerencia General aprueba la rev. 1 del plan de releases y del plan para la dirección; la LB0 no cambia | Aprobada el 18 de agosto |
| AREU-05 | Comité de control de cambios (extraordinario) | 9 sep 2026 | Salida del release 1 el 10 de septiembre (118 de 118 puntos; costo real 97,8 M, CPI 0,98; inventario con 0,4 % de diferencia); defectos menores al release 2; acompañamiento en sitio hasta el 24 de septiembre y retiro de los formatos en papel ese día; no se hace el comité ordinario del 10 de septiembre | Aprobada el 11 de septiembre |
| AREU-06 | Comité quincenal | 8 oct 2026 | Registro de riesgos rev. 2 (R-008 con 9,0 M; ajustes de R-002, R-003, R-004, R-005 y R-007; total 60,0 M sin usar); decisión del dueño del producto el 14 de octubre sobre el release 2; reclamo formal al proveedor tecnológico (INC-002); plan B de INC-003; capacitación de facturación, cartera y contabilidad el 29 y el 30 de octubre, porque del 3 al 6 de noviembre la ventana coincide con el cierre mensual (del 3 al 9 de noviembre, con el festivo del 2) | En revisión (rev. A) |

- Los compromisos de cada acta son los del momento: cumplidos los que vencían hasta su fecha y pendientes los demás; la siguiente acta los verifica. Los del 8 de octubre son los próximos pasos del informe de desempeño del 9 de octubre.
- Cajetín: AREU-01 la elabora el director y la aprueba la Gerencia General; AREU-02, el consultor de selección, con aprobación del director; AREU-03, el Scrum Master, con aprobación de la Gerencia General. De AREU-04 a AREU-06 elabora el Scrum Master, revisa el dueño del producto y aprueba el director de proyecto (también en el acta del 8 de octubre, que sigue en revisión).

### 12.3 Registro de comunicaciones

- **Alcance.** Comunicaciones formales: las que van a terceros o vienen de ellos (proveedores y revisoría fiscal) y las de gobierno del proyecto (actas de los comités, informes quincenales, solicitudes y decisiones de cambio, comunicados de salida y requerimientos formales entre áreas). La coordinación del equipo Scrum queda en el tablero y en los eventos; los defectos de producción, en la mesa de ayuda de TI. Es lo que dice el enfoque del registro en `src/11-doc-approach.js` («En ágil registra solo las comunicaciones formales: con terceros y de gobierno del proyecto»).
- **Versiones.** Rev. 0 del 10 de julio (9 comunicaciones, las de la selección y la contratación) y rev. 1 del 11 de septiembre (26), aprobadas por el director de proyecto; elabora el Scrum Master y revisa el dueño del producto. Al corte, la rev. 2A tiene **32 comunicaciones** (COM-001 a COM-032).
- **Contenido.** Entre otras: la solicitud de propuestas (26 de mayo), la invitación a los tres finalistas (9 de junio), las notificaciones de adjudicación y no adjudicación (23 de junio), el envío de los contratos firmados (30 de junio), la orden de compra de los equipos de bodega (1 de julio), el aviso del retraso de las tabletas (22 de julio, INC-001), la solicitud y la decisión del CC-001, la solicitud y la entrega de las credenciales del proveedor tecnológico (18 y 31 de agosto), el aviso en carteleras de la capacitación del release 1, la entrega del inventario conciliado a la revisoría fiscal (8 de septiembre, conformidad el 9), el comunicado de salida a producción (9 de septiembre, por correo y con copia en las carteleras), el canal de defectos de producción (COM-025, 11 de septiembre), el resultado de la revisión del caso de negocio al cierre del release 1 (COM-026, 11 de septiembre: continúan los releases 2 y 3 y se libera el siguiente tramo), los informes quincenales n.º 1 a 7, el requerimiento del auxiliar de cartera (5 de octubre, INC-003) y el reclamo al proveedor tecnológico (8 de octubre, INC-002).
- **Pendientes de respuesta al corte:** el requerimiento del auxiliar de cartera, el reclamo al proveedor tecnológico y el borrador del informe n.º 7.
- Los documentos de adquisiciones se citan por su nombre (enunciado del trabajo, criterios de selección, registro de contratos), sin números ni valores de contratos. Conservación del archivo: diez años después del cierre (artículo 28 de la Ley 962 de 2005).

### 12.4 Plan de gestión de las comunicaciones

- **Versiones.** Rev. 0 del 10 de julio, con la LB0 (matriz de 22 filas), y rev. 1 del 11 de septiembre, con el registro de interesados rev. 2 (23 filas). Elabora el director, revisa el dueño del producto y aprueba la Gerencia General.
- **Canales.** Comité quincenal, eventos de Scrum, reunión semanal con el implementador, espacio en la reunión semanal de bodega, carteleras y capacitación por grupos, comunicado de cada salida, reunión con la revisoría fiscal antes de cada corte, revisión trimestral con el fabricante, mesa de ayuda y reunión semanal con el proveedor tecnológico durante el release 2, y consulta de la normativa de la DIAN.
- **La rev. 0 ya trae lo aprobado ese día en otros documentos:** el escalamiento de emergencia y el carril de urgencia del plan de gestión de cambios (se atiende el mismo día, se documenta en un día hábil y el comité lo ratifica) y el acompañamiento en sitio de dos semanas después de cada salida con el reporte semanal del papel (disparador de R-003: más de 5 % de remisiones o devoluciones en papel en una semana).
- **La rev. 1 agrega lo nuevo después de la salida del release 1:** el canal único de reporte de defectos e incidentes de producción por la mesa de ayuda de TI (matriz, tecnologías, flujo de la información y glosario) y el motivo actualizado de los avisos en cartelera.
- **Recursos.** Sin presupuesto propio: tiempo del director (25 %) en «Dirección del proyecto y comités» (EDT 1.1.3, COP 29,7 M), del Scrum Master (50 %) en la facilitación ágil (COP 19,8 M), elaboración con el consultor de gestión del cambio (EDT 1.5.1, COP 6,8 M) y capacitación por release (EDT 1.5.3, COP 22,2 M).
- **Restricciones.** Ninguna salida a producción en los cinco primeros días hábiles del mes ni en el cierre anual (el release 3 sale el 12 de enero de 2027, actividad t32); las capacitaciones de facturación, cartera y contabilidad tampoco van en los días de cierre.
- **Supuestos.** El personal de bodega y los conductores no trabajan con correo corporativo: sus avisos van en cartelera, en la reunión semanal de bodega y en la capacitación por grupos, y lo que se envía por correo a todas las áreas lleva copia en las carteleras. En la rev. 0 se suma que la red inalámbrica de los patios se instala hasta el 22 de julio (LB0, EDT 1.3.2); en la rev. 1, con la red ya instalada, el motivo es que en las obras la señal falla. La revisión trimestral con el fabricante tiene frecuencia «Por evento» (la plantilla no tiene «Trimestral»). Datos personales según la Ley 1581 de 2012.

---

## 13. Equipo, pruebas y planificaciones de las iteraciones 1 a 5

Los ocho documentos los genera `src/97-example-erp-docs-equipo.js`. `test/example-erp-docs-equipo.test.mjs` compara cada cifra con lo que calcula la aplicación y revisa que ninguna versión aprobada cite hechos posteriores a su fecha. La planificación de la iteración es un evento de Scrum (enfoque ágil); los otros tres documentos son de ambos enfoques y aquí siguen la práctica ágil: los acuerdos del equipo salen de las retrospectivas, la estrategia principal con los interesados es llevarlos a las revisiones y las pruebas se escriben por elemento a partir de sus criterios de aceptación.

| Documento | Código | Estado al corte | Versiones |
|---|---|---|---|
| Acta de constitución del equipo | PRY-2026-021-ACE | Aprobado, rev. 1 | Rev. 0 del 10 de julio de 2026: acuerdo inicial con la LB0, antes de la iteración 1. Rev. 1 del 26 de agosto: acuerdos de las retrospectivas de las iteraciones 1 a 3 |
| Plan de involucramiento de los interesados | PRY-2026-021-PIIN | Aprobado, rev. 1 | Rev. 0 del 10 de julio, con el registro de interesados rev. 1. Rev. 1 del 11 de septiembre, con el registro rev. 2, después de la salida del release 1 |
| Documentos de prueba y evaluación | PRY-2026-021-DPE | En revisión, rev. 2A del 9 de octubre | Rev. 0 del 10 de julio, con la definición de terminado (8 pruebas). Rev. 1 del 26 de agosto, con la retrospectiva de la iteración 3 («Pruebas de usuario» y datos migrados) y la prueba de las básculas del CC-001 (10 pruebas). Al corte tiene 13 pruebas y 18 ítems de verificación |
| Planificación de la iteración (1 a 5) | PRY-2026-021-PIT-01 a PIT-05 | Aprobadas, rev. 0 | Cada una el primer día de su iteración: 13 de julio, 28 de julio, 12 de agosto, 27 de agosto y 10 de septiembre de 2026 |

### 13.1 Planificación de las iteraciones 1 a 5

| Iteración | Código | Días-persona | Velocidad de referencia | Capacidad | Compromiso |
|---|---|---:|---:|---:|---:|
| 1 | PIT-01 | 40 | 30 (supuesta en el plan de releases) | 30 | 27 |
| 2 | PIT-02 | 40 | 24 | 31 | 31 |
| 3 | PIT-03 | 40 | 27,5 | 33 | 34 |
| 4 | PIT-04 | 40 | 28,7 | 32 | 32 |
| 5 | PIT-05 | 40 | 31,3 | 32 | 32 |

- **Elementos.** Los comprometidos al iniciar, en el orden del backlog, incluidos los que no se terminaron en la iteración (`sprint.unfinished`): HU-004 en la 1, HU-006 en la 3 y TA-010 en la 5. Suman el compromiso de cada iteración. Las cifras salen de «Releases e iteraciones», del backlog y del catálogo de recursos.
- **Velocidad de referencia.** Promedio de las tres últimas iteraciones cerradas el día anterior al inicio; en la iteración 1, sin iteraciones cerradas, la velocidad supuesta del plan de releases.
- **Días-persona.** Salen de `PM.res.teamCapacity` con las ausencias conocidas al planificar. Supuesto: una incapacidad médica no se conoce al planificar, así que la iteración 5 se planificó con 40 días-persona; los 37 reales los cita la planificación de la iteración 6. Los festivos del 20 de julio, el 7 de agosto y el 17 de agosto no son días de sus iteraciones.
- **Criterios de aceptación al planificar.** Son los del backlog, salvo cuatro que el backlog precisó después con el resultado del trabajo; la planificación los cita como estaban ese día (supuesto: el texto anterior no está en los datos). IN-001 (PIT-01): «Decisión documentada y aceptada por el dueño del producto sobre el manejo de cada familia» (la decisión se tomó el 15 de julio). HU-002 (PIT-01): «El gerente comercial valida las cinco familias y sus unidades» (las validó el 21 de julio). HU-029 (PIT-05): «Contabilidad valida cinco casos tributarios antes de aceptar la historia» (aceptada el 21 de septiembre). TA-010 (PIT-05): archivo «en el formato que entregue el banco» y prueba «con un archivo de recaudos del banco» (el banco entregó el formato el 2 de octubre).
- **Iteración 2.** HU-004 viene de la iteración 1 y DF-001 entra desde su revisión. Los equipos de bodega quedaron instalados el 24 de julio con las tabletas importadas dos días hábiles tarde (INC-001): mientras se configuran con los perfiles de bodega, el equipo cuenta también con las tabletas de prueba del implementador.
- **Iteración 3.** El equipo compromete 34 puntos con una capacidad de 33 porque HU-006 (3 puntos) es «Debería tener» y es la primera que sale si no se alcanza; fue la que quedó sin terminar. La solicitud de las básculas, radicada el 11 de agosto, se cita sin el código CC-001 porque el comité la decidió el 13: sus historias (épica EP-008: HU-038, HU-039 y HU-040) entran en la iteración 4. La depuración de datos termina el 14 de agosto, tres días hábiles después de lo previsto en la LB0.
- **Iteración 4.** Entran las historias de las básculas (13 puntos). Si no se alcanza, el dueño del producto difiere HU-006 y HU-014 (6 puntos «Debería tener»), como lo prevé la condición del CC-001. El conteo físico (27 de agosto a 7 de septiembre) y la capacitación del release 1 (1 a 8 de septiembre) tienen las fechas de la LB0.
- **Iteración 5.** El release 2 se compromete con su línea base de 112 puntos el mismo día de la salida a producción del release 1. Entran cinco defectos del release 1 que no impidieron su salida: DF-002 a DF-006 (8 puntos).
- **Participantes.** Dueño del producto, Scrum Master, desarrolladores (cinco personas) y los usuarios clave invitados del release. En la iteración 5 no asiste el contador: la retrospectiva de esa iteración dice que las historias de facturación llegaron a la planificación sin revisar las reglas tributarias con contabilidad. Elabora el Scrum Master, revisan los desarrolladores y aprueba el dueño del producto.
- **Vínculo con la iteración.** `SPRINT_DOCS` de `src/94-example-erp.js` enlaza PIT-01 a PIT-05 con las iteraciones 1 a 5: «Releases e iteraciones» abre cada planificación en lugar de ofrecer crearla.

### 13.2 Acta de constitución del equipo

- **Firmantes por rol:** dueño del producto, Scrum Master, los cinco desarrolladores y el líder del implementador, el 10 de julio de 2026. La organización sale del origen de cada recurso del catálogo: los internos son de la empresa y los contratados, del socio implementador.
- **Duración máxima de los eventos** (supuesto, en proporción a la Guía de Scrum 2020 para iteraciones de dos semanas): planificación 4 horas, revisión 2 horas, retrospectiva 1,5 horas y reunión diaria de 15 minutos a las 8:15 a. m., la hora del horario del enunciado del trabajo del implementador (SOW-01).
- **Lo que no repite:** los límites WIP y el carril de urgencia están en la definición de listo y de terminado, y la columna «Pruebas de usuario», en su rev. 1. El trabajo remoto y la seguridad en las bodegas siguen el enunciado del trabajo (días acordados con el Scrum Master; inducción de seguridad y salud en el trabajo y acompañante en patios y zonas de cargue).
- **Decisiones.** El dueño del producto ordena el backlog, propone el objetivo de la iteración y acepta o rechaza cada elemento; los desarrolladores seleccionan con él los elementos y fijan su compromiso. Las decisiones técnicas son por consenso; si no lo hay en un día hábil, deciden el líder del implementador con el jefe de TI cuando se afectan la arquitectura, la seguridad o las integraciones (supuesto).
- **Conflictos que tocan el contrato de implementación** (personas, horas o alcance): los deciden el director de proyecto y el líder del implementador en máximo dos días hábiles. Es un acuerdo del equipo (supuesto), no una cláusula: las controversias contractuales siguen el contrato.
- **Cajetín.** Elabora el Scrum Master, revisan los desarrolladores y aprueba el director de proyecto, que administra la relación con el implementador.
- **Acuerdos de las retrospectivas** (rev. 1): no empezar historias que no se alcancen a probar (iteración 1), revisión de pares el mismo día y prueba con los datos maestros depurados (iteración 2), y coordinar cada mañana las pruebas de usuario del día con el usuario clave (iteración 3).

### 13.3 Plan de involucramiento de los interesados

- **Matriz.** Un renglón por cada uno de los 16 interesados del registro, con su nivel actual y deseado a la misma fecha. Quien ya está en el nivel deseado tiene la estrategia «Mantener».
- **Personal de bodega y almacén.** Capacitación por grupos, acompañamiento en sitio dos semanas después de cada salida y retiro del papel con fecha anunciada; la medición semanal usa el disparador de R-003 (más de 5 %). En la rev. 1 el jefe de almacén y el personal de bodega pasan a «Neutral» con la salida del release 1.
- **DIAN.** No se reúne con el proyecto, porque es la autoridad tributaria: la estrategia es cumplir el anexo técnico vigente y validar en habilitación antes de la salida del release 2. La reunión antes de cada corte es con el revisor fiscal.
- **Gerencia General.** Respalda ante las áreas cada salida y la fecha de retiro del papel. No firma el comunicado de salida: según el plan de gestión de las comunicaciones, lo emite el director de proyecto.
- **Capacitación de facturación, cartera y contabilidad (rev. 1).** El plan de gestión de las comunicaciones no permite capacitarlos en el cierre mensual (cinco primeros días hábiles del mes). El 2 de noviembre de 2026 es festivo, así que el cierre va del 3 al 9 de noviembre; de la ventana de la LB0 (29 de octubre a 6 de noviembre) quedan el 29 y el 30 de octubre. El módulo los calcula con el calendario y coinciden con la decisión del comité del 8 de octubre (AREU-06).

### 13.4 Documentos de prueba y evaluación

- **Criterios.** Las pruebas de migración, de aceptación de cada release, de habilitación ante la DIAN y de las salidas copian los criterios del diccionario de la EDT (1.4.2, 1.4.3, 1.4.4, 1.6, 1.7 y 1.9).
- **Cifras**, todas de los datos: 0,5 % es la meta de la EDT 1.4.2 y 0,4 % el resultado de la actividad t17; 3 % es el umbral de alerta de HU-040; las 12 reglas de rechazo salen de ME-009; al corte hay 44 elementos aceptados con 174 puntos (la suma de las velocidades de las iteraciones 1 a 6); 14 elementos pasaron por «Pruebas de usuario» y se aceptaron 13 (HU-033 la pasó y se rechazó en la revisión por el código QR).
- **Prueba de aceptación del release 1.** Firmada el 9 de septiembre, último día de la iteración 4, con cuatro defectos menores (DF-003, DF-004, DF-005 y DF-007), que pasaron al release 2. DF-006 viene del ensayo de corte.
- **La rev. 2A agrega** la revisión de perfiles y permisos (acción 2 de la retrospectiva de la iteración 4), la lista de chequeo del anexo técnico de la DIAN (acción 1 de la retrospectiva de la iteración 6, que pasa a la definición de terminado en su próxima revisión), la verificación en producción de las correcciones del carril de urgencia (DF-009, INC-004) y el ensayo de corte una semana antes de cada salida (lección de la salida del release 1).
- **Validación.** El proyecto es interno: valida el dueño del producto en cada revisión, los usuarios clave firman la prueba de aceptación de cada release, contabilidad aprueba las conciliaciones, la revisoría fiscal da su conformidad y el comité de control de cambios autoriza cada salida. La lista de verificación del registro es la del ERP (definición de terminado, anexo técnico de la DIAN y criterios para liberar un release).
- **Cajetín.** Elabora el analista de pruebas y revisa el Scrum Master; como está en revisión, no tiene aprobador.

---

## 14. Limitaciones

- Las cifras son supuestos de un ejemplo didáctico. Precios de suscripción, tarifas, equipos y plazos cambian por fabricante, implementador, número de usuarios, tasa de cambio y fecha; un proyecto real debe cotizarlos.
- Las fuentes de la sección 2 son guías comerciales de proveedores; sus rangos son amplios y no distinguen el mercado colombiano (salvo Softland en plazos y facturación electrónica).
- No se modelan el soporte anual del fabricante ni la suscripción después de enero de 2027 (operación de TI), ni el IVA, ni los costos de la nómina electrónica (fuera del alcance).
- Las tarifas por hora y los costos de personal interno son supuestos redondeados para que las cuentas se puedan seguir a mano (por ejemplo, 240 horas × COP 82.500 = COP 19,8 M).
- Los beneficios del caso de negocio (sección 10) son supuestos didácticos sobre una empresa ficticia; en un proyecto real se miden en el descubrimiento y se validan con contabilidad. No se modelan el valor del dinero en el tiempo (VPN o TIR) ni los impuestos sobre los beneficios. El flujo de financiamiento se calcula sobre el devengo de la LB0 y no modela el desfase de caja de cada contrato.
- La duración máxima de los eventos, la hora de la reunión diaria, la regla de que una incapacidad médica no se conoce al planificar y el texto de los criterios de IN-001, HU-002, HU-029 y TA-010 antes de precisarlos son supuestos del ejemplo (sección 14). La lista del anexo técnico de la DIAN resume los criterios del backlog del ejemplo; no reproduce el anexo técnico vigente.
- Las condiciones de los contratos (pólizas, plazos de pago, retención en garantía y jurisdicción), los números de contrato, los puntajes de las ofertas y las calificaciones de los proveedores (sección 12) son supuestos del ejemplo; no son un modelo de contrato y un proyecto real los revisa con su asesor jurídico.

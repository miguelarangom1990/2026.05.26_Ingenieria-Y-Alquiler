# Gestor de Proyectos PMBOK

Aplicación de una sola página para gestionar proyectos según la Guía del PMBOK® (6.ª edición),
publicada como artefacto de claude.ai: https://claude.ai/artifact/7NdhF1iuH3L7am1RPkWgak

## Qué incluye

- **Portafolio**: crear, seleccionar, duplicar, exportar/importar (.json) y eliminar proyectos; tres proyectos de ejemplo:
  alquiler y montaje de andamio (predictivo), edificio residencial en Medellín (híbrido: la obra en cascada y el mercadeo
  digital con Scrum y Kanban — supuestos y fuentes en `docs/ejemplo-medellin/`) e implementación del ERP de la empresa
  (ágil — supuestos y fuentes en `docs/ejemplo-erp/`).
- **Menú lateral plegable** en escritorio con tres modos (fijo, al pasar el mouse, con clic) y vistas a todo el ancho.
- **Mapa de procesos**: los 49 procesos (10 áreas × 5 grupos) con entradas, herramientas y técnicas y salidas.
- **Documentos**: 59 plantillas (actas, planes, registros, informes y las de Scrum) con cajetín, revisiones A/B → 0/1,
  lista maestra, exportación a Markdown/HTML y redacción asistida con Claude. Cada plantilla indica su **enfoque de la
  metodología** (predictivo o tradicional, ágil o adaptativo, o ambos) en una columna y un filtro de la lista maestra.
- **Líneas base** de alcance, cronograma y costos, con comparación contra el estado actual.
- **Herramientas**: EDT y diccionario, Gantt con ruta crítica y festivos de Colombia, pronóstico a la fecha de
  corte, diagrama de red, histograma de recursos, curva S y valor ganado, matrices RACI, probabilidad e impacto
  e interesados, Ishikawa, Pareto, gráfico de control y diagramas de flujo con carriles.
- **Tablero** con indicadores (SPI, CPI, EAC, fin pronosticado) y ruta sugerida de pasos PMBOK según el enfoque.
- **Ágil e híbrido** (ciclo de vida adaptativo, híbrido, iterativo o incremental): enfoque predictivo o adaptativo por
  entregable de la EDT; backlog del producto priorizado (MoSCoW, épicas, refinamiento) en puntos u horas; tablero Kanban con
  límites WIP; releases e iteraciones (planificación, inicio y cierre, línea base del release); burndown, burnup, velocidad,
  flujo acumulado, pronóstico y valor ganado ágil (AgileEVM); avance de cada release en el Gantt y la curva S; control de
  cambios en dos niveles; plantillas de visión del producto, definición de listo y de terminado, plan de releases,
  planificación, revisión y retrospectiva (que alimenta las lecciones aprendidas); roles y eventos ágiles en la RACI.
- **Recursos del proyecto**: catálogo con código, tipo (humano, material, maquinaria, herramienta… según el tipo de
  proyecto: general, construcción, alquiler de equipos o TI, o tipos propios), unidad, disponibilidad, costo unitario,
  origen, proveedor y ausencias; se pueden agregar recursos en cualquier momento. Un recurso **no planificado** pide su
  motivo: sustitución, por cuenta del contratista a todo costo, menor rendimiento o respuesta a un riesgo (consume la
  reserva para contingencias) no cambian la línea base; un cambio de alcance, diseño o método, o la reserva de gestión,
  registran una solicitud de cambio. Cada actividad elige su **forma de costeo**: precio global (a todo costo, escrito a
  mano), calculada por recursos, mixta (parte fija + recursos) o por precios unitarios. Histograma y consumo de
  materiales por semana o mes; las personas del equipo ágil alimentan la **capacidad sugerida** de cada iteración.
- **Estructuras de desglose en diagrama**: de costos (presupuesto, reservas de gestión y para contingencias, cuentas de
  control y paquetes, del plan o de una línea base), de riesgos (categorías del plan de gestión de los riesgos con los
  riesgos del registro) y de recursos (tipo → subtipo → recurso), con zoom, ramas plegables, vista de tabla y
  exportación a SVG y PNG.

Los datos se guardan en la base de datos del artefacto (compartida con quien tenga acceso); fuera de claude.ai
la página funciona en modo local (navegador).

## Estructura

- `src/` — módulos que se concatenan en orden: `head.html` (estilos), `00-core` (datos, UI), `05-calc` (CPM, EVM),
  `06-model`, `07-agile-core` (capa ágil), `08-shell`, `09-resources-core` (recursos, costeo y estructuras de desglose),
  `10-pmbok` (base de conocimiento), `11-doc-approach` (enfoque de cada plantilla), `12/13/14-templates`, `20-docs`, `30-wbs`, `36-breakdowns` (diagramas de desglose),
  `40-schedule`, `42-resources` (catálogo), `45-agile-backlog`, `46-agile-sprints`, `50-evm`, `60-flow`, `70-matrices`, `80-dashboard`,
  `90–97` (ejemplos), `99-boot`.
- `SPEC.md` — contratos de datos, API del núcleo y convenciones.
- `build.mjs` — genera `gestor-pmbok.html` (la página que se publica).
- `test/` — pruebas con Playwright (Chromium).

## Uso

```bash
node build.mjs                                   # genera gestor-pmbok.html
node test/smoke.mjs --file gestor-pmbok.html     # recorre todas las vistas (también --dark, --mobile)
node test/dbmode.test.mjs --file gestor-pmbok.html   # modo artefacto con base de datos simulada
node test/<modulo>.test.mjs --file gestor-pmbok.html # calc, core, kb, shell, docs, wbs, schedule, evm, flow, matrices, dashboard,
                                                     # agile-core, agile-backlog, agile-sprints, agile-c1, agile-c2,
                                                     # resources-core, resources-catalog, resources-schedule, breakdowns,
                                                     # example-erp-docs-integracion/-adquisiciones/-comunicaciones/-equipo,
                                                     # example, example-erp, example-medellin, example-medellin-agile,
                                                     # example-medellin-docs-a/-b, templates-agile, templates-b
node test/smoke.mjs --file gestor-pmbok.html --example erp           # también --example medellin, --blank --lifecycle 'Híbrido'
node test/templates.test.mjs --file gestor-pmbok.html
```

PMBOK® es una marca registrada del Project Management Institute, Inc. Esta es una herramienta independiente.

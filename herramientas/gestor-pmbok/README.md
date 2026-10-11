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
- **Documentos**: 53 plantillas (actas, planes, registros, informes) con cajetín, revisiones A/B → 0/1,
  lista maestra, exportación a Markdown/HTML y redacción asistida con Claude.
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

Los datos se guardan en la base de datos del artefacto (compartida con quien tenga acceso); fuera de claude.ai
la página funciona en modo local (navegador).

## Estructura

- `src/` — módulos que se concatenan en orden: `head.html` (estilos), `00-core` (datos, UI), `05-calc` (CPM, EVM),
  `06-model`, `07-agile-core` (capa ágil), `08-shell`, `10-pmbok` (base de conocimiento), `12/13/14-templates`, `20-docs`,
  `30-wbs`, `40-schedule`, `45-agile-backlog`, `46-agile-sprints`, `50-evm`, `60-flow`, `70-matrices`, `80-dashboard`,
  `90–96` (ejemplos), `99-boot`.
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
                                                     # example, example-erp, example-medellin, example-medellin-agile,
                                                     # example-medellin-docs-a/-b, templates-agile
node test/smoke.mjs --file gestor-pmbok.html --example erp           # también --example medellin, --blank --lifecycle 'Híbrido'
node test/templates.test.mjs --file gestor-pmbok.html
```

PMBOK® es una marca registrada del Project Management Institute, Inc. Esta es una herramienta independiente.

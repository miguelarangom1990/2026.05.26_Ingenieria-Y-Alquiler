# Gestor de Proyectos PMBOK

Aplicación de una sola página para gestionar proyectos según la Guía del PMBOK® (6.ª edición),
publicada como artefacto de claude.ai: https://claude.ai/artifact/7NdhF1iuH3L7am1RPkWgak

## Qué incluye

- **Portafolio**: crear, seleccionar, duplicar, exportar/importar (.json) y eliminar proyectos; dos proyectos de ejemplo
  (alquiler y montaje de andamio, y edificio residencial en Medellín — supuestos y fuentes en `docs/ejemplo-medellin/`).
- **Menú lateral plegable** en escritorio con tres modos (fijo, al pasar el mouse, con clic) y vistas a todo el ancho.
- **Mapa de procesos**: los 49 procesos (10 áreas × 5 grupos) con entradas, herramientas y técnicas y salidas.
- **Documentos**: 53 plantillas (actas, planes, registros, informes) con cajetín, revisiones A/B → 0/1,
  lista maestra, exportación a Markdown/HTML y redacción asistida con Claude.
- **Líneas base** de alcance, cronograma y costos, con comparación contra el estado actual.
- **Herramientas**: EDT y diccionario, Gantt con ruta crítica y festivos de Colombia, pronóstico a la fecha de
  corte, diagrama de red, histograma de recursos, curva S y valor ganado, matrices RACI, probabilidad e impacto
  e interesados, Ishikawa, Pareto, gráfico de control y diagramas de flujo con carriles.
- **Tablero** con indicadores (SPI, CPI, EAC, fin pronosticado) y ruta sugerida de pasos PMBOK.

Los datos se guardan en la base de datos del artefacto (compartida con quien tenga acceso); fuera de claude.ai
la página funciona en modo local (navegador).

## Estructura

- `src/` — módulos que se concatenan en orden: `head.html` (estilos), `00-core` (datos, UI), `05-calc` (CPM, EVM),
  `06-model`, `08-shell`, `10-pmbok` (base de conocimiento), `12/13-templates`, `20-docs`, `30-wbs`,
  `40-schedule`, `50-evm`, `60-flow`, `70-matrices`, `80-dashboard`, `90-example`, `99-boot`.
- `SPEC.md` — contratos de datos, API del núcleo y convenciones.
- `build.mjs` — genera `gestor-pmbok.html` (la página que se publica).
- `test/` — pruebas con Playwright (Chromium).

## Uso

```bash
node build.mjs                                   # genera gestor-pmbok.html
node test/smoke.mjs --file gestor-pmbok.html     # recorre todas las vistas (también --dark, --mobile)
node test/dbmode.test.mjs --file gestor-pmbok.html   # modo artefacto con base de datos simulada
node test/<modulo>.test.mjs --file gestor-pmbok.html # calc, core, kb, shell, docs, wbs, schedule, evm, flow, matrices, dashboard,
                                                     # example, example-medellin, example-medellin-docs-a/-b
node test/templates.test.mjs --file gestor-pmbok.html
```

PMBOK® es una marca registrada del Project Management Institute, Inc. Esta es una herramienta independiente.

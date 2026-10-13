# Gestor de Proyectos PMBOK — especificación técnica

Aplicación de una sola página (artefacto de claude.ai) para gestionar proyectos según la
Guía del PMBOK® 6.ª edición (5 grupos de procesos × 10 áreas de conocimiento, 49 procesos),
para **Ingeniería y Alquiler S.A.S.** (Colombia: alquiler, montaje y logística de equipos de
construcción — andamios, formaletas, maquinaria). Todo el texto visible está en **español de
Colombia**, tono profesional y directo.

## 1. Arquitectura

- Sin paso de compilación de JS. Preact + htm (global `htmPreact`, expuesto como `PM.lib`) cargado
  desde CDN. Se escribe con plantillas `html\`…\`` (htm), **nunca JSX**.
  - Componente: `html\`<${Comp} prop=${v} />\``; cierre `</${Comp}>`; listas con `key`.
  - Hooks: `const { html, useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = PM.lib;`
- `src/*.js` se concatenan en orden alfabético dentro de `<script>` (no módulos ES). Cada archivo es
  una IIFE `(function(){ 'use strict'; const PM = window.PM; … })();`.
- `node build.mjs` genera `gestor-pmbok.html` (página publicada).
  `node build.mjs --out <ruta> --include 20,40` genera una página con el núcleo (`00`–`09`, `99`) más
  los módulos con esos prefijos — **úsalo para probar tu módulo aislado** (otros agentes escriben en
  paralelo; no construyas `gestor-pmbok.html` ni dependas de sus archivos a medio hacer).
- Pruebas (Chromium vía Playwright, ya instalado):
  - `node test/calc.test.mjs` — cálculos compartidos.
  - `node test/core.test.mjs --file <ruta.html>` — regresiones del núcleo (arranque, sincronización y errores de
    suscripción, dos pestañas en modo local, modal/menú/tabla, riel móvil, portafolio, importación, contraste).
  - `node test/smoke.mjs --file <ruta.html> [--only vista1,vista2] [--shots dir] [--dark] [--mobile]` —
    abre la página, crea un proyecto (o el de ejemplo si existe), recorre las vistas y reporta errores
    de consola, tarjetas de error y desbordes horizontales. Código de salida ≠ 0 si algo falla.
  - `node test/shell.test.mjs --file <ruta.html> [--quick]` — riel de escritorio (tres modos, plegado, teclado, móvil) y ancho
    completo de las vistas a 1920/2560 px (ver §4, «Riel de navegación»).
  - `test/harness.mjs` exporta `openApp({file, width, height, dark})` (espera a que la pantalla salga de «Conectando…»), `createProject(page, meta)`,
    `gotoView(page, id)`, etc. Escribe tus propias pruebas de interacción en `test/<modulo>.test.mjs`.
  - Para mirar el resultado: `page.screenshot(...)` y lee la imagen. Revisa tema claro y oscuro y 400 px.

### Archivos y responsables

| Archivo | Contenido |
|---|---|
| `src/head.html` | `<title>`, fuentes, CSS completo (tokens + componentes). Núcleo. |
| `src/00-core.js` | utilidades, formato, fechas/calendario (festivos CO), almacenamiento, sincronización, registros, kit de UI, modales, descargas, Claude. Núcleo. |
| `src/05-calc.js` | EDT, CPM, valor ganado, líneas base, riesgos, revisiones. Núcleo. |
| `src/06-model.js` | hooks de modelo compartido (incluye el avance ágil de los releases vinculados al cronograma). Núcleo. |
| `src/07-agile-core.js` | capa ágil: contratos de backlog, releases e iteraciones, `PM.agile`, cálculos ágiles en `PM.calc`, `PM.useAgileModel` (§9). Núcleo. |
| `src/08-shell.js` | riel, selector de proyecto, portafolio, formulario de proyecto. Núcleo. |
| `src/09-resources-core.js` | recursos: catálogo, tipos, formas de costeo, capacidad del equipo, árboles de desglose, `PM.changeControl` (§10). Núcleo. |
| `src/10-pmbok.js` | base de conocimiento PMBOK (`PM.KB`). |
| `src/12-templates-a.js` | plantillas: Integración, Alcance, Cronograma. |
| `src/13-templates-b.js` | plantillas: Costos, Calidad, Recursos, Comunicaciones, Riesgos, Adquisiciones, Interesados. |
| `src/14-templates-agile.js` | plantillas ágiles (§9.5). |
| `src/15-templates-negocio.js` | documentos de negocio: evaluación de necesidades, acuerdo con el cliente, informe de realización de los beneficios (§6). |
| `src/20-docs.js` | vistas `procesos`, `documentos`, `documento` (editor). |
| `src/30-wbs.js` | vista `edt`. |
| `src/36-breakdowns.js` | vista `estructuras` (estructuras de desglose de costos, riesgos y recursos en diagrama; §10). |
| `src/40-schedule.js` | vistas `cronograma`, `red`, `recursos` (pestañas Catálogo, Histograma y Consumo). |
| `src/42-resources.js` | componentes y diálogos del catálogo de recursos (`PM.ResourceCatalog`, `PM.resourceDialog`…; §10). |
| `src/45-agile-backlog.js` | vistas `backlog`, `kanban` (§9). |
| `src/46-agile-sprints.js` | vistas `iteraciones`, `metricas-agiles` (§9). |
| `src/50-evm.js` | vista `valor-ganado`. |
| `src/60-flow.js` | vista `flujogramas`. |
| `src/70-matrices.js` | vistas `raci`, `riesgos-matriz`, `interesados-matriz`, `calidad`. |
| `src/80-dashboard.js` | vistas `tablero`, `lineas-base`, `ficha`. |
| `src/90-example.js` | constructor del proyecto de ejemplo (`PM.registerExample`). |
| `src/91–93-example-medellin*.js`, `src/96-example-medellin-agile.js`, `src/98-example-medellin-docs-negocio.js` | ejemplo inmobiliario en Medellín (híbrido: capa ágil comercial y digital en 96; documentos de negocio en 98). |
| `src/11-doc-approach.js` | enfoque de la metodología de cada plantilla (`PM.DOC_APPROACHES`, `PM.DOC_APPROACH`, `PM.docApproach`; §5.1). |
| `src/94-example-erp.js`, `src/95-example-erp-docs.js`, `src/97-example-erp-docs-*.js` | ejemplo ágil: implementación del ERP de Ingeniería y Alquiler (datos y documentos; §9.7). |
| `src/99-boot.js` | arranque. Núcleo. |

**No modifiques archivos del núcleo.** Si necesitas algo del núcleo que no existe, impleméntalo
localmente en tu archivo y repórtalo en tu respuesta final (sección "Necesidades del núcleo").
No crees archivos dentro de `src/` distintos del tuyo (los demás se construyen en paralelo).

## 2. Plataforma (restricciones del visor)

- No hay `alert/confirm/prompt` (devuelven nada). Usa `PM.confirm({...})`, `PM.promptText({...})`, `PM.toast(texto, {tone:'crit'})`.
- No hay red: nada de `fetch` externo, iframes, imágenes remotas. No uses `<a download>`: usa `PM.download(nombre, contenido)`
  (extensiones permitidas: txt json md csv html svg; muestra un modal para copiar si el visor no permite descargar).
- No hay `window.print()`. No uses `localStorage` para datos (solo `PM.prefs.get/set` para preferencias de vista).
- `Date.now()`/`Math.random()` están permitidos en la página.
- Debe funcionar a 400 px de ancho sin desplazamiento horizontal del `body`. Tablas, diagramas y
  gráficos van dentro de un contenedor con `overflow-x:auto` (`.table-wrap`, `.chart`).
- Accesibilidad: controles con etiqueta (`aria-label` en botones de icono), foco visible, contraste.

## 3. Datos

Rutas (usa `PM.paths.*`). Todos los cuerpos son objetos JSON (≤ 256 KiB). Las fechas de calendario
son cadenas ISO `YYYY-MM-DD`; las marcas de tiempo, ISO completas (`PM.nowIso()`).

| Ruta | Contenido |
|---|---|
| `projects/{pid}` | metadatos: `{name, code, client, sponsor, manager, start, end, budget, currency, status, lifecycle, description, location, statusDate?, createdAt, updatedAt, createdBy}` |
| `projects/{pid}/docs/{docId}` | documento (ver §5). `docId` = id de plantilla; si la plantilla es `multiple`, `docId = <plantilla>--<uid>` |
| `projects/{pid}/docs/{docId}/revs/{revId}` | revisión emitida (instantánea) |
| `projects/{pid}/tools/wbs` | `{nodes:[{id, parentId, name, order, description, responsible, deliverable, acceptance, costEstimate, notes, kind}]}` |
| `projects/{pid}/tools/schedule` | `{settings:{workweek:5|6|7, holidaysCO:bool, extraHolidays:[], resourceLimits:{nombre:unidades}}, tasks:[Task]}` |
| `projects/{pid}/tools/costs` | `{actuals:[{id,date,amount,taskId,wbsId,category,description,document}], statusUpdates:[{id,date,progress:{taskId:pct},note}], reserves:{contingency, management}}` |
| `projects/{pid}/tools/raci` | `{roles:[{id,name}], rows:[{id, wbsId, activity, cells:{roleId:'R'|'A'|'C'|'I'|'RA'|…}}]}` |
| `projects/{pid}/tools/quality` | `{ishikawa:[{id,name,effect,categories:[{id,name,causes:[{id,text,sub:[{id,text}]}]}]}], pareto:[{id,name,source:'manual'|'mediciones',items:[{id,cause,count}]}], control:[{id,name,unit,target,lsl,usl,points:[{id,date,value,note}]}]}` |
| `projects/{pid}/baselines/{bid}` | `{number, label:'LB0', date, includes:['scope','schedule','cost'], note, changeRef, byId, scope?, schedule?, cost?}` (ver `PM.calc.makeBaselineSnapshot`) |
| `projects/{pid}/flows/{fid}` | `{name, description, nodes:[{id,type,x,y,w,h,text}], edges:[{id,from,to,label}], lanes?:[{id,name}], updatedAt}` |

**Task** (`tools/schedule.tasks[]`): `{id, name, wbsId|null, duration (días hábiles; 0 = hito), milestone:bool,
start:'YYYY-MM-DD'|null (restricción "no comenzar antes de"), deps:[{id, type:'FS'|'SS'|'FF'|'SF', lag:días}],
progress:0–100, cost (presupuesto de la actividad), resources:[{name, units}], responsible, actualStart, actualFinish, notes}`.
El orden del arreglo es el orden de presentación.

Reglas:
- Un error de suscripción no significa «no existe»: mientras el documento no se haya leído, `loading` sigue en `true`
  (o `error` queda expuesto si no se puede reintentar), el núcleo reintenta solo y `save()` no escribe sobre un documento
  que nunca se leyó. Un guardado anterior a la primera lectura se aplica solo si el documento no existía.
- Al guardar, el núcleo conserva la identidad de las partes que no cambiaron (`PM.reconcile`): las filas sin cambios
  de una tabla siguen siendo el mismo objeto (útil para `PM.memo`).
- Los datos que entregan los hooks están **congelados**: clona (`PM.clone`) o construye objetos nuevos antes de guardar.
- Una sola escritura a la vez por documento (el núcleo lo garantiza si usas los hooks/`PM.store`).
- No escribas desde render ni al cargar; solo ante una acción del usuario.
- Modo lectura: si `PM.useCanWrite()` es `false`, deshabilita/oculta toda edición.
- Al eliminar elementos referenciados (p. ej. un nodo EDT usado por actividades) pide confirmación con `PM.confirm` y limpia referencias.

### API de datos (núcleo)

```js
PM.useAppState()                // {projectId, view, params, canWrite, mode:'db'|'local'|'loading', meId, saving, lastSaved, storageWarning, persistFailed}
                                // persistFailed: modo local y el navegador no dejó escribir (cuota llena) → el riel dice «Cambios sin guardar»
PM.useCurrentProject()          // {project:{id,...meta}|null, loading}
PM.useProjects()                // {projects:[...], loading}
PM.useToolData(toolId, PM.EMPTY.<tool>)  // [data (normalizada con PM.normalizeTool), save(next) (antirrebote 650 ms), {loading, exists, error, saveNow}]
PM.useDoc(path)                 // {data, exists, loading, error, save, saveNow}
PM.useCollection(path)          // {docs:[{id,data}], loading, error}
PM.useProjectModel()            // {project, pid, schedule, effSchedule, saveSchedule, wbs, saveWbs, costs, saveCosts, tree, sched, forecast, baselines, baselineDocs, evm, rollup, statusDate, currency,
                                //  agile, saveAgile, agileItems, agileOn, agileMeta, resources, saveResources, catalog, loading}
                                // effSchedule = schedule con el avance ágil aplicado (§9.3); sched/forecast/evm/rollup se calculan con él.
                                // Para editar el cronograma usa siempre `schedule` (lo guardado), nunca effSchedule.
PM.useAgileModel()              // §9.2
PM.useResourceModel()           // §10: useProjectModel + saveItem(recurso) (guarda; un recurso virtual recibe id y código), saveItems(lista) y removeItem(id);
                                // las escrituras seguidas en el mismo ciclo se encadenan (no se pisan)
                                // sched: red según lo programado (lo atrasado conserva sus fechas → «vencido»);
                                // forecast: la misma red actualizada a la fecha de corte (fin, ruta crítica e hitos pronosticados, 6.6)
PM.useProjectDocs()             // {list, byTemplate, get(templateId), loading}
PM.useDocTable(templateId, fieldKey) // [rows, saveRows, {doc, exists, loading}] — lee/escribe una tabla de un documento singleton
PM.newDocBody(template, project, extra) // cuerpo inicial de documento
PM.store.get/set/update/delete/list(path)  // acceso directo (promesas); set/update/delete aceptan {quiet:true} (sin aviso de error)
PM.store.flush()                // escribe ya lo pendiente; false si el modo local no pudo guardar (importData lo usa: si no cabe,
                                // retira el proyecto y lanza un error con `user: true` y un mensaje para mostrar)
PM.normalizeTool(toolId, data)  // corrige tipos (arreglo/objeto) de datos importados; devuelve el mismo objeto si ya es válido
PM.projectOps.update(pid, patch) // metadatos del proyecto
PM.statusDateOf(project)        // fecha de corte (project.statusDate o hoy)
PM.touchProject(pid)            // marca "actualizado" (ya lo hacen los save de useProjectModel/useDocTable); .cancel(pid)
PM.navigate(viewId, params)     // navegación; params llega a la vista como prop `params`
PM.selectProject(pid, viewId)
```

### Cálculos (`PM.calc`, en 05-calc.js — léelo)

- `wbsTree(nodes)` → `{byId, codes (Map id→'1.2.3'), depth, flat:[{node,code,depth,isLeaf}], leaves, childrenOf(id|null), descendants(id), ancestors(id), parentOf}`. Raíz implícita = proyecto (código `1`).
- `computeSchedule(schedule, projectStart, statusDate?)` → `{cal, tasks:[Task + {es, ef, ls, lf, tf, ff, critical, startDate, finishDate, lateStart, lateFinish, duration, milestone, preds, succs, rescheduled, remaining}], byId, start, finish, criticalIds, errors, statusDate, rescheduledIds}`.
  Con `statusDate` (actualización a la fecha de corte): una actividad no iniciada empieza, como pronto, el día hábil siguiente
  al corte; una iniciada y sin terminar programa su duración restante (`remaining` = duración × (1 − avance)) desde ese día
  (`duration` sigue siendo la planificada); un hito no alcanzado queda después del corte. Sin `statusDate`, nada cambia. `cal` = calendario laboral (`dateOf(i)`, `indexOf(iso)`, `isWork(iso)`, `countWork(a,b)`, `addWork(iso,n)`, `holidayName(iso)`).
  Convención: actividad ocupa [es, ef) en índices de días hábiles; un hito se dibuja al **cierre** de `startDate`.
- `rollupWbs(tree, sched)` → `Map(wbsId → {start, finish, cost, progress, count, critical, tasks})`.
- `evm({sched, costBaseline, costs, statusDate})` → `{bac, pv, ev, ac, sv, cv, spi, cpi, eac, eacAtypical, eacComposite, etc, vac, tcpi, tcpiEac, pctPlanned, pctComplete, pctSpent, series:[{date,pv,ev|null,ac|null}], pvAt(d), evAt(d), acAt(d), planStart, planFinish, esWd, atWd, pdWd, spiT, forecastFinish, costBaseline, totalBudget, reserves, fromBaseline}`.
- `activeBaselines(docs)` → `{list, scope, schedule, cost, latest}`; `nextBaselineNumber(docs)`; `makeBaselineSnapshot({includes, sched, wbs, costs, scopeStatement})`.
- `plannedFraction(cal, start, finish, milestone, at)`, `riskScore(p,i)`, `riskLevel(score)` → `{label, tone}` (1–4 Bajo, 5–9 Medio, 10–19 Alto, 20–25 Muy alto), `indexTone(v)`.
- `nextDraftRev(rev)` / `approvedRev(rev)`: convención de planos (borradores A, B…; emisiones 0, 1, 2…).
- `PM.date.*`: `valid, add, diff, dow, today, min, max, startOfWeek, startOfMonth, endOfMonth, addMonths, holidaysCO(y)`.
- `PM.fmt.*`: `num(n,d), fixed, money(n,cur), moneyShort(n,cur) ("$ 480,5 M"), pct(x 0–1), pct100(x 0–100), idx (0,95), date(iso, 'medium'|'short'|'dm'|'month'|'long'|'dow'), datetime(ts), days(n)`.

## 4. Vistas y navegación

Registra cada vista: `PM.registerView({id, label, group, icon, order, component, needsProject:true, hidden:false, parent?, description, when?, unavailable?})` (`parent`: id de la vista visible que se marca como actual mientras se muestra una vista oculta; `navLabel`: texto más corto para el menú lateral (el título de la vista sigue siendo `label`); `when(project)`: la vista solo aparece en el menú si devuelve `true`, y si se abre igual el anfitrión muestra el componente `unavailable` con `{project, view}`).
Grupos: `portafolio`, `proyecto`, `planificacion` (Alcance, tiempo y recursos), `agil` (Ágil (Scrum y Kanban), lo agrega 07-agile-core), `costos` (Costos y desempeño), `analisis` (Matrices y análisis).
El componente recibe `{project, params}`. Íconos disponibles: claves de `PM.ICONS` en 00-core.js.

| id | label | grupo | orden | módulo |
|---|---|---|---|---|
| `tablero` | Tablero del proyecto | proyecto | 10 | 80 |
| `procesos` | Mapa de procesos | proyecto | 20 | 20 |
| `documentos` | Documentos | proyecto | 30 | 20 |
| `documento` (oculta) | Documento | proyecto | 31 | 20 |
| `lineas-base` | Líneas base | proyecto | 40 | 80 |
| `ficha` | Ficha del proyecto | proyecto | 50 | 80 |
| `edt` | EDT | planificacion | 10 | 30 |
| `cronograma` | Cronograma (Gantt) | planificacion | 20 | 40 |
| `red` | Diagrama de red | planificacion | 30 | 40 |
| `recursos` | Recursos | planificacion | 40 | 40 |
| `backlog` | Backlog del producto | agil | 10 | 45 |
| `kanban` | Tablero Kanban | agil | 20 | 45 |
| `iteraciones` | Releases e iteraciones | agil | 30 | 46 |
| `metricas-agiles` | Métricas ágiles | agil | 40 | 46 |
| `valor-ganado` | Curva S y valor ganado | costos | 10 | 50 |
| `raci` | Matriz RACI | analisis | 10 | 70 |
| `riesgos-matriz` | Probabilidad e impacto | analisis | 20 | 70 |
| `interesados-matriz` | Interesados | analisis | 30 | 70 |
| `calidad` | Ishikawa y Pareto | analisis | 40 | 70 |
| `flujogramas` | Diagramas de flujo | analisis | 50 | 60 |

### Riel de navegación y ancho de las vistas (08-shell, head.html)

- **Móvil (≤ 900 px)**: panel lateral de siempre (botón «Abrir menú» en la barra superior, `navOpen`); los modos de abajo no aplican.
- **Escritorio (> 900 px)**: riel plegable. Desplegado mide `--rail-w` (252 px); plegado, `--rail-mini` (60 px) y muestra solo
  la marca, el botón de modo, el selector de proyecto compacto (prefijo y número del código, o carpeta sin proyecto; menú
  flotante a la derecha del riel), los íconos de las vistas (nombre accesible = etiqueta, `aria-current="page"` en la actual),
  separadores en lugar de los títulos de grupo y el ícono de almacenamiento. Las etiquetas emergentes de los íconos (y de los
  botones de modo y de plegar) salen de `data-tip` al apuntarlos o enfocarlos con el teclado (`.rail-tip`, una sola,
  `position: fixed`); en el modo «al pasar el mouse» no se muestran (el propio despliegue enseña las etiquetas).
- **Mismo ritmo vertical plegado y desplegado**: marca 34 px, botones 28 px, selector 64 px, títulos de grupo 21 px (una línea;
  plegado, un separador `::before` dentro de esa altura) e ítems 30 px, con los mismos márgenes. Al desplegarse encima del
  contenido, cada ícono queda donde estaba y el clic cae en la sección apuntada (en modo fijo el plegado apila los dos botones
  y desplaza todo 32 px, lo que no importa porque el diseño cambia a propósito).
- Si el riel no cabe en la altura de la ventana se desplaza (barra delgada también plegado) y una sombra arriba/abajo
  (`--rail-shade`) avisa que hay más contenido.
- Vistas ocultas (p. ej. `documento`): marcan como actual su `parent` (campo opcional de `registerView`) o, si no lo declaran,
  la vista visible anterior de su grupo («Documentos»).
- Un solo botón (`.rail-mode`, arriba del riel en ambos estados) alterna **fijo → al pasar el mouse → con clic → fijo**; su
  `aria-label`/`title` dicen el modo actual y el siguiente («Menú: fijo. Cambiar a: se abre al pasar el mouse»); cada cambio
  muestra un aviso. Preferencias: `PM.prefs` `railMode` (`'fijo'|'hover'|'clic'`) y `railCollapsed` (solo modo fijo).
  - **fijo**: sin automatismos; el botón `.rail-fold` («Plegar menú» / «Desplegar menú», `aria-expanded`) lo deja como la
    persona quiera. El riel es parte del diseño: al plegarlo el contenido gana el ancho.
  - **al pasar el mouse**: plegado en reposo (el diseño reserva solo 60 px); al entrar el puntero (120 ms de intención) se
    despliega **encima** del contenido (sombra, sin mover el diseño) y se pliega 300 ms después de salir.
  - **con clic**: plegado en reposo; un clic sobre el riel lo despliega encima del contenido (ese primer clic solo abre; el
    botón de modo siempre actúa); se pliega solo 3 s después de abrir o de salir el puntero si este no está sobre el riel
    (volver a entrar cancela), y al instante con un clic fuera del riel.
  - En los dos modos superpuestos: el foco del teclado (`:focus-visible`, y solo si se está navegando con Tab desde la última
    pulsación del puntero) dentro del riel lo despliega y cuenta como puntero encima; si el foco pasa al contenido se pliega;
    Escape lo pliega; con el menú de proyectos abierto no se pliega, y al cerrarlo (también con Escape, que devuelve el foco
    al selector) retoma el plegado automático. La presencia del puntero se confirma con `pointerover`/`pointermove` del
    documento mientras está desplegado: Chromium no envía `pointerleave` si el nodo bajo el puntero desaparece (p. ej.
    «Nuevo proyecto» abre un modal).
- Clases: `.rail.is-mini` (plegado), `.rail.is-peek` (desplegado encima), `.rail.track-mini` (el diseño usa 60 px, vía
  `.app:has(> .rail.track-mini)`), `data-mode` en el `<aside>`. Transición de 180 ms, desactivada con `prefers-reduced-motion`.
- **Ancho**: `.page` no tiene tope de ancho; todas las vistas usan el ancho disponible a 1920 y 2560 px. Limita la medida del
  texto corrido en el propio párrafo (`max-width` ~70–80ch) y no estires formularios cortos (usa rejillas `auto-fill`, como
  `.pf-grid` en `PM.ProjectForm`). Nada de `max-width` fijo en contenedores de vista.
- Pruebas: `node test/shell.test.mjs --file <html> [--quick]` (modos, persistencia, temporizadores con movimientos reales del
  mouse, teclado, nombres accesibles, alineación plegado/desplegado, presencia tras un modal o Escape, ventana baja, modo local
  sin espacio, móvil sin cambios y ancho completo de las 17 vistas con el riel desplegado y plegado).

Funciones globales que deben existir (para enlaces entre módulos):
- `PM.openDocument(templateIdOrDocId)` (20-docs): abre el editor; si no existe un singleton, lo crea al primer guardado.
- `PM.openTool(viewId)` = `PM.navigate(viewId)` (núcleo no lo define; usa `PM.navigate`).

## 5. Plantillas de documentos

`PM.registerTemplates([Template, …])`. Ids canónicos en §6 (no inventes otros ni cambies los ids).

```js
Template = {
  id, name, abbr: 'ACT',              // abreviatura de 2–4 letras para el código del documento
  area: 'integracion', group: 'inicio', process: '4.1', processes: ['4.1'], // procesos que lo crean/actualizan
  kind: 'acta'|'plan'|'registro'|'informe'|'documento'|'formato',
  multiple: false,                    // true: el proyecto puede tener varias instancias (informes, actas…)
  purpose: 'Para qué sirve, 1–2 frases.',
  tips: ['consejo práctico', …],      // 2–4 consejos concretos
  sections: [{ id, title, description?, fields: [Field] }],
  example: { <fieldKey>: valor, … },   // contenido para el proyecto de ejemplo (§8); filas de tabla con id
}
Field = { key, label, type, hint?, placeholder?, required?, options?, from?: 'project.<campo>', rows?, min?, max?,
          columns?: [Column], defaultRows?: [ {...} ], default? }
type: 'text' | 'textarea' | 'number' | 'money' | 'pct' | 'date' | 'select' | 'list' (arreglo de cadenas) | 'table' | 'check'
Column = { key, label, type: 'text'|'textarea'|'number'|'money'|'pct'|'date'|'select'|'calc'|'check', options?, width?, calc?: (row, rows) => valor, format?: (v,row) => texto, hint? }
```
Las claves `key` son únicas dentro de la plantilla (los campos se guardan planos en `fields`).

Documento guardado (`projects/{pid}/docs/{docId}`):
```js
{ template, title, status:'borrador'|'revision'|'aprobado'|'obsoleto', rev:null|'A'|'0'…, fields:{…},
  titleBlock:{codigo, elaboro, reviso, aprobo, fechaAprobacion}, createdAt, updatedAt, createdBy, updatedBy }
```
Revisión (`…/revs/{revId}`): `{rev, status, date (ts), byId, note, fields, titleBlock, title}`.

### 5.1 Enfoque de la metodología de cada plantilla (11-doc-approach.js)

`PM.DOC_APPROACHES`: `predictivo` («Predictivo / tradicional»), `adaptativo` («Ágil / adaptativo») y `ambos` («Ambos
enfoques»), con `short`, `tone`, `icon` y `hint`. `PM.DOC_APPROACH[id] = {approach, why, replacement}` clasifica las 62
plantillas (25 predictivas, 6 ágiles y 31 de ambos enfoques; panel de tres perspectivas: Guía del PMBOK® 6.ª ed. con la
Guía de prácticas ágiles, 7.ª ed. con la Guía de Scrum 2020 y práctica en proyectos de TI). `PM.docApproach(t|id)` →
`{id, label, short, tone, icon, hint, why, replacement}` o `null`; una plantilla puede declarar `approach` y las de
`agile: true` son `adaptativo`. Es orientativo: dice a qué enfoque pertenece el documento, no que esté prohibido en el otro.
Una plantilla nueva debe agregarse al mapa (la prueba `docs` exige que las 62 tengan enfoque; los documentos de negocio de
`15-templates-negocio.js` —evaluación de necesidades, acuerdo con el cliente e informe de realización de los beneficios— son de
ambos enfoques).
Lista maestra (20): columna «Enfoque» entre «Proceso» y «Estado» (instancias de plantillas múltiples heredan la de su
fila madre), filtro «Enfoque de la metodología» (valores exactos `predictivo`, `adaptativo`, `ambos` y combinados
`predictivo+ambos`, `adaptativo+ambos`), nota plegable «¿Qué indica el enfoque?», enfoque en la vista del documento,
columna «Enfoque» en el CSV y `PM.navigate('documentos', {approach})`. El filtro no cambia los indicadores del avance
documental; la línea de resumen suma el desglose por estado de lo visible.

### Tablas con columnas fijas (otros módulos las leen; respeta exactamente estas claves)

- `registro-riesgos` → campo `riesgos`: `id` (R-001), `descripcion`, `causa`, `efecto`, `categoria` (Técnico | Externo | De la organización | Dirección de proyectos), `tipo` (Amenaza | Oportunidad), `probabilidad` (1–5), `impacto` (1–5), `puntuacion` (calc P×I), `propietario`, `estrategia` (Escalar | Evitar | Transferir | Mitigar | Aceptar | Explotar | Compartir | Mejorar), `respuesta`, `disparador`, `reserva` (money), `estado` (Abierto | En seguimiento | Cerrado | Materializado).
- `registro-interesados` → campo `interesados`: `nombre`, `cargo`, `organizacion`, `rol`, `contacto`, `requisitos`, `expectativas`, `poder` (1–5), `interes` (1–5), `influencia` (1–5), `clasificacion` (Interno | Externo), `actitud` (Partidario | Neutral | Reticente), `nivelActual` y `nivelDeseado` (Desconocedor | Reticente | Neutral | Partidario | Líder).
- `registro-cambios` → `cambios`: `id` (CC-001), `fecha`, `solicitante`, `descripcion`, `tipo` (Acción correctiva | Acción preventiva | Reparación de defecto | Actualización), `impactoAlcance`, `impactoCronograma` (días, number), `impactoCosto` (money), `estado` (Registrada | En análisis | Aprobada | Rechazada | Diferida), `fechaDecision`, `decisor`.
- `registro-incidentes` → `incidentes`: `id` (INC-001), `fecha`, `descripcion`, `tipo`, `prioridad` (Alta | Media | Baja), `responsable`, `fechaObjetivo`, `estado` (Abierto | En curso | Resuelto | Cerrado), `solucion`.
- `registro-lecciones` → `lecciones`: `id`, `fecha`, `area`, `situacion`, `impacto` (Positivo | Negativo), `recomendacion`, `registradoPor`.
- `entregables` → `entregables`: `id`, `entregable`, `paqueteEdt`, `criterios`, `fechaPrevista`, `fechaEntrega`, `estado` (Pendiente | En revisión | Verificado | Aceptado | Rechazado), `aceptadoPor`.
- `mediciones-control-calidad` → `mediciones`: `fecha`, `entregable`, `metrica`, `resultado`, `conforme` (Sí | No), `causa` (causa del defecto), `accion`.
- `registro-supuestos` → `supuestos`: `id`, `tipo` (Supuesto | Restricción), `descripcion`, `categoria`, `responsable`, `fechaValidacion`, `estado` (Por validar | Validado | Descartado).

## 6. Catálogo de documentos (ids canónicos)

Área (id, número de capítulo): integracion 4, alcance 5, cronograma 6, costos 7, calidad 8, recursos 9,
comunicaciones 10, riesgos 11, adquisiciones 12, interesados 13.
Grupo (id): inicio, planificacion, ejecucion, monitoreo (Monitoreo y control), cierre.

| id | Nombre | Proceso | Área | Grupo | kind | múltiple |
|---|---|---|---|---|---|---|
| evaluacion-necesidades | Evaluación de necesidades | 4.1 (entrada) | integracion | inicio | documento | |
| caso-negocio | Caso de negocio | 4.1 (entrada) | integracion | inicio | documento | |
| plan-gestion-beneficios | Plan de gestión de los beneficios | 4.1 (entrada) | integracion | inicio | plan | |
| acuerdo-cliente | Acuerdo con el cliente | 4.1 (entrada; 4.6 lo actualiza) | integracion | inicio | documento | |
| acta-constitucion | Acta de constitución del proyecto | 4.1 | integracion | inicio | acta | |
| registro-supuestos | Registro de supuestos | 4.1 | integracion | inicio | registro | |
| plan-direccion | Plan para la dirección del proyecto | 4.2 | integracion | planificacion | plan | |
| plan-gestion-cambios | Plan de gestión de cambios | 4.2 | integracion | planificacion | plan | |
| plan-gestion-configuracion | Plan de gestión de la configuración | 4.2 | integracion | planificacion | plan | |
| entregables | Registro de entregables | 4.3 / 5.5 / 8.3 | integracion | ejecucion | registro | |
| registro-incidentes | Registro de incidentes | 4.3 | integracion | ejecucion | registro | |
| registro-lecciones | Registro de lecciones aprendidas | 4.4 | integracion | ejecucion | registro | |
| informe-desempeno | Informe de desempeño del trabajo | 4.5 | integracion | monitoreo | informe | sí |
| solicitud-cambio | Solicitud de cambio | 4.6 | integracion | monitoreo | formato | sí |
| registro-cambios | Registro de cambios | 4.6 | integracion | monitoreo | registro | |
| informe-final | Informe final del proyecto | 4.7 | integracion | cierre | informe | |
| acta-cierre | Acta de cierre y aceptación final | 4.7 | integracion | cierre | acta | |
| informe-beneficios | Informe de realización de los beneficios | 4.7 (posterior al cierre) | integracion | cierre | informe | sí |
| plan-gestion-alcance | Plan de gestión del alcance | 5.1 | alcance | planificacion | plan | |
| plan-gestion-requisitos | Plan de gestión de los requisitos | 5.1 | alcance | planificacion | plan | |
| documentacion-requisitos | Documentación de requisitos | 5.2 | alcance | planificacion | registro | |
| matriz-trazabilidad | Matriz de trazabilidad de requisitos | 5.2 | alcance | planificacion | registro | |
| enunciado-alcance | Enunciado del alcance del proyecto | 5.3 | alcance | planificacion | documento | |
| acta-aceptacion-entregable | Acta de aceptación de entregables | 5.5 | alcance | monitoreo | acta | sí |
| plan-gestion-cronograma | Plan de gestión del cronograma | 6.1 | cronograma | planificacion | plan | |
| estimaciones-duracion | Estimaciones de duración (tres valores / PERT) | 6.4 | cronograma | planificacion | registro | |
| plan-gestion-costos | Plan de gestión de los costos | 7.1 | costos | planificacion | plan | |
| estimacion-costos | Estimaciones de costos y base de las estimaciones | 7.2 | costos | planificacion | registro | |
| requisitos-financiamiento | Requisitos de financiamiento del proyecto | 7.3 | costos | planificacion | documento | |
| plan-gestion-calidad | Plan de gestión de la calidad | 8.1 | calidad | planificacion | plan | |
| metricas-calidad | Métricas de calidad | 8.1 | calidad | planificacion | registro | |
| documentos-prueba | Documentos de prueba y evaluación | 8.2 | calidad | ejecucion | registro | |
| informe-calidad | Informe de calidad | 8.2 | calidad | ejecucion | informe | sí |
| mediciones-control-calidad | Mediciones de control de calidad | 8.3 | calidad | monitoreo | registro | |
| plan-gestion-recursos | Plan de gestión de los recursos | 9.1 | recursos | planificacion | plan | |
| acta-constitucion-equipo | Acta de constitución del equipo | 9.1 | recursos | planificacion | documento | |
| requisitos-recursos | Requisitos de recursos | 9.2 | recursos | planificacion | registro | |
| estructura-desglose-recursos | Estructura de desglose de recursos (EDR) | 9.2 | recursos | planificacion | registro | |
| asignaciones-recursos | Asignaciones de recursos físicos y del equipo | 9.3 | recursos | ejecucion | registro | |
| evaluacion-desempeno-equipo | Evaluaciones de desempeño del equipo | 9.4 | recursos | ejecucion | registro | |
| plan-gestion-comunicaciones | Plan de gestión de las comunicaciones | 10.1 | comunicaciones | planificacion | plan | |
| registro-comunicaciones | Registro de comunicaciones del proyecto | 10.2 | comunicaciones | ejecucion | registro | |
| acta-reunion | Acta de reunión | 10.2 | comunicaciones | ejecucion | acta | sí |
| plan-gestion-riesgos | Plan de gestión de los riesgos | 11.1 | riesgos | planificacion | plan | |
| registro-riesgos | Registro de riesgos | 11.2–11.7 | riesgos | planificacion | registro | |
| informe-riesgos | Informe de riesgos | 11.2 | riesgos | planificacion | informe | |
| analisis-cuantitativo | Análisis cuantitativo (valor monetario esperado) | 11.4 | riesgos | planificacion | registro | |
| plan-gestion-adquisiciones | Plan de gestión de las adquisiciones | 12.1 | adquisiciones | planificacion | plan | |
| estrategia-adquisiciones | Estrategia de las adquisiciones | 12.1 | adquisiciones | planificacion | documento | |
| decisiones-hacer-comprar | Análisis de hacer o comprar | 12.1 | adquisiciones | planificacion | registro | |
| enunciado-trabajo-adquisicion | Enunciado del trabajo de la adquisición (SOW) | 12.1 | adquisiciones | planificacion | documento | sí |
| criterios-seleccion-proveedores | Criterios de selección y evaluación de ofertas | 12.1 | adquisiciones | planificacion | registro | |
| registro-adquisiciones | Registro de contratos y acuerdos | 12.2 | adquisiciones | ejecucion | registro | |
| control-adquisiciones | Seguimiento de contratos y desempeño de proveedores | 12.3 | adquisiciones | monitoreo | registro | |
| registro-interesados | Registro de interesados | 13.1 | interesados | inicio | registro | |
| plan-involucramiento-interesados | Plan de involucramiento de los interesados | 13.2 | interesados | planificacion | plan | |

Herramientas que también son salidas de procesos (ids de vista): `edt` (EDT y diccionario, 5.4 → línea base del
alcance), `cronograma` (6.2 lista de actividades e hitos, 6.5 cronograma), `red` (6.3 diagrama de red), `recursos` (9.2),
`valor-ganado` (7.3 línea base de costos, 7.4 pronósticos y datos de desempeño), `lineas-base`, `raci` (9.1),
`riesgos-matriz` (11.3), `interesados-matriz` (13.1/13.2), `calidad` (8.2/8.3), `flujogramas` (8.1 / 4.2).

Documentos de negocio (15-templates-negocio.js): la evaluación de necesidades, el caso de negocio, el plan de gestión de
los beneficios y el acuerdo con el cliente son entradas de 4.1 (ningún proceso los crea). El acuerdo con el cliente también
es entrada de 4.5, 4.7, 5.2, 6.5, 7.3, 11.2, 13.1 y 13.2, y 4.6 lo actualiza (otrosíes, adiciones, prórrogas y órdenes de
cambio). El informe de realización de los beneficios es una salida de 4.7 posterior al cierre (`afterClose: true`, sin
`label`): no es salida de la Guía, el proyecto cierra sin él y no cuenta en el avance documental mientras el proyecto no
tenga uno (20-docs: `PM.isAfterCloseDoc`, `PM.countsInProgress`, `PM.countedTemplates`, que usan el mapa de procesos, la
lista maestra y el tablero); se muestra con el distintivo de texto «Posterior al cierre» en la salida de 4.7 y en la fila de
la lista maestra, y el filtro «Sin iniciar» no lo lista.

## 7. Diseño

Identidad: plano de ingeniería. Tipografías: `--font-display` (Archivo, títulos), `--font-body` (IBM Plex Sans), `--font-mono`
(IBM Plex Mono: códigos EDT, fechas en tablas, revisiones). Tokens en `src/head.html` — **usa solo tokens** (`var(--…)`), nunca
colores literales (salvo dentro de `head.html`). Ambos temas (claro/oscuro) deben verse bien.

- Superficies: `--bg`, `--surface`, `--surface-2`, `--surface-3`; líneas `--line`, `--line-strong`; texto `--fg`, `--fg-2`, `--fg-3`.
- Acento `--accent` (azul plano) y `--accent-wash`; señal `--signal` (línea de hoy/corte, línea base). Semánticos: `--good`, `--warn`, `--crit`, `--info` y sus `*-wash`.
  Texto en tono señal (festivos, marcas, chips): `--signal-ink` (≥ 4,5:1 sobre `--surface` y `--signal-wash`); `--signal` queda para líneas y rellenos.
  Texto sobre un relleno `--crit` (botón «Eliminar», aviso de error): `--crit-fg`.
- Series categóricas en orden fijo `--s1`…`--s8`; grupos de procesos `--g-inicio`, `--g-planificacion`, `--g-ejecucion`, `--g-monitoreo`, `--g-cierre`.
- Gráficos (SVG a mano): `.chart` contenedor; texto con `fill: var(--fg-2)` (11 px); retícula `var(--grid)` 1 px sólida; ejes `var(--axis)`;
  líneas de datos 2 px; marcadores ≥ 8 px con anillo de 2 px color superficie; barras ≤ 24 px; áreas ~10 % de opacidad;
  leyenda siempre que haya ≥ 2 series; nunca doble eje; texto nunca del color de la serie; tooltip con `PM.useChartTip()`;
  todo dibujado con una sola escala y etiquetas que no se superpongan. Exportar con `PM.ui.SvgDownload`.
- Ruta crítica en `--crit`; línea base en gris (`--fg-3`/`--line-strong`) o `--signal`; avance en `--accent`.
- Clases CSS disponibles: ver `head.html` (`.page`, `.card`, `.card-head`, `.card-body`, `.grid.cols-2/3/4`, `.stack`, `.row`,
  `.table-wrap` + `.table`, `.chip-*`, `.btn*`, `.tabs`, `.toolbar`, `.empty`, `.stat`, `.meter`, `.title-block`, `.chart`, `.legend`, `.split`…).
  Si necesitas CSS propio, inyéctalo una sola vez desde tu módulo con un `<style id="css-<modulo>">` en `document.head`
  (prefija tus clases con el nombre del módulo, p. ej. `.gantt-…`), usando solo tokens.
- Kit `PM.ui`: `Icon, Button(variant: primary|ghost|danger|danger-solid, size:'sm', icon), IconButton(icon,label), Field(label,hint,required,error),
  Input(onValue), TextArea(onValue), Select(options,onValue,placeholder), NumberInput(value,onValue,money,currency,min,max),
  DateInput(onValue), Check(checked,onValue,label), Search, Tabs(tabs,value,onChange), Segmented(options,value,onChange),
  Chip(tone), Empty(icon,title,actions), Card(title,subtitle,actions), PageHeader(eyebrow,title,description,actions),
  Stat(label,value,sub,tone), Meter(value 0–1,tone), Loading, Spinner, Dropdown(label,items), DataTable(columns,rows,onChange,readOnly,newRow,currency),
  Modal(title,onClose,footer,size:'wide'|'xl'), Person(id), ErrorBoundary, CopyBlock, SvgDownload(getSvg,filename)`.
  Otros: `PM.openModal(close => html…)`, `PM.confirm`, `PM.promptText({…, optional, hint})`, `PM.toast`, `PM.download`, `PM.toCSV(columns, rows, currency)`,
  `PM.svgToString(svgEl)`, `PM.copyText`, `PM.ai.json/text/available/errorText`, `PM.memo(Comp, areEqual?)`,
  `PM.discardPending(path)` (descarta un guardado pendiente antes de eliminar), `PM.currentCurrency()`, `PM.isNum(v)`.
  `PM.useChartTip()` → `{ref, setHost, show(e, contenido), hide, node}` (se voltea arriba/izquierda cerca de los bordes).
  `ui.Dropdown` se posiciona `fixed` (no lo recortan contenedores con desplazamiento); `ui.Segmented` acepta `disabled`;
  `ui.NumberInput` encadena `onFocus`/`onBlur` externos; `ui.Modal` gestiona foco y Escape solo para el modal superior
  (foco inicial: `[autofocus]` → primer campo del cuerpo → botón principal; Tab/Mayús+Tab no salen del diálogo);
  `ui.DataTable` omite filas que no son objetos y, en edición, vuelve a dibujar solo la fila editada (las columnas `calc`
  se evalúan en la tabla); `PM.autoSize(textarea, max)` ajusta alturas por lotes;
  `PM.ProjectForm` acepta `autoFocus={false}`. En columnas de tabla, `calc(row, rows, ctx)` y `format(v, row, ctx)` reciben
  `ctx = {currency, rows, index}`; las celdas llevan la clase `col-<tipo>`. Los campos `table` aceptan `addLabel` y las columnas `default`.
  Preact (paquete htm/standalone) no traduce `onFocusOut`: usa `onfocusout` en minúsculas o `onBlur`.
- Vista típica: `<div class="page">` + `PageHeader` (eyebrow con el proceso PMBOK relacionado, p. ej. "6.5 Desarrollar el cronograma") + contenido.
  Cada vista abre en un estado útil: si no hay datos, un `Empty` que explique qué aparecerá y un botón para empezar
  (p. ej. "Agregar actividad", "Importar desde la EDT").
- Redacción: español de Colombia, voz activa, botones que dicen lo que hacen ("Agregar actividad", "Establecer línea base"),
  errores que explican qué pasó y cómo resolverlo. Términos PMBOK en español oficial (EDT, línea base, valor ganado, holgura total…).

## 8. Proyecto de ejemplo (brief común)

Todo el contenido de ejemplo describe el MISMO proyecto ficticio, identificado como ejemplo. Usa **roles**, no nombres de personas.

- Nombre: "EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista". Código `PRY-2026-014`.
- Cliente: "Constructora Modelo S.A.S. (ficticia)". Patrocinador: "Gerencia General". Director: "Director de proyecto".
- Ubicación: Bogotá D.C., obra Edificio Altavista (ficticia), Torre 2 de 15 pisos. Ciclo de vida predictivo.
- Fechas: inicio 2026-08-03, fin previsto 2026-12-18, fecha de corte 2026-10-02. Calendario L-S (workweek 6) con festivos de Colombia.
- Presupuesto aprobado: COP 486.500.000 (BAC actividades ≈ 452 M; reserva para contingencias 22,6 M; reserva de gestión 11,9 M).
- Alcance: ingeniería (levantamiento, diseño y memoria de cálculo del andamio, plan de montaje y de rescate), suministro desde bodega
  (alistamiento, inspección, transporte), montaje por etapas (niveles 1–5, 6–10, 11–15, accesos y protecciones), inspección y
  certificación por persona competente (Resolución 4272 de 2021, trabajo en alturas), alquiler y mantenimiento en obra,
  desmontaje, transporte de retorno e inspección de retorno, cierre (acta de entrega, facturación, lecciones).
- EDT: 1.1 Gestión del proyecto · 1.2 Ingeniería · 1.3 Suministro y logística · 1.4 Montaje · 1.5 Certificación y operación · 1.6 Desmontaje y retiro.
- Roles: Patrocinador (Gerencia General), Director de proyecto, Ingeniero de diseño, Residente de obra, Coordinador SST (HSE),
  Coordinador logístico, Supervisor de montaje, Cuadrilla de montaje (montadores certificados), Almacén, Facturación y cartera,
  Director de obra del cliente, Interventoría del cliente, ARL.
- Riesgos típicos: lluvias que detienen el montaje; accidente en trabajo en alturas; faltantes de piezas en bodega; cambios del
  cliente en la secuencia de obra; daño o pérdida de equipo en obra; retraso en pagos del cliente; restricciones de circulación de
  carga en Bogotá; inspección de certificación no aprobada; disponibilidad de grúa/montacargas del cliente.
- Estado al corte: ingeniería y logística terminadas, montaje niveles 1–5 terminado, niveles 6–10 en curso (~60 %), resto pendiente.
  Un cambio aprobado (plataforma adicional de descargue), SPI ≈ 0,93, CPI ≈ 0,97.

## 9. Capa ágil y enfoque híbrido (Scrum y Kanban)

Objetivo: usar prácticas ágiles cuando el alcance no está claro y requiere iteración, solas (proyecto adaptativo) o
combinadas con el enfoque predictivo (proyecto híbrido: unos entregables de la EDT en cascada y otros por iteraciones).
Referencias: PMBOK® 6 (consideraciones para entornos ágiles/adaptativos de cada área), PMBOK® 7 (enfoques de desarrollo
y ciclo de vida), Guía de prácticas ágiles (PMI y Agile Alliance), Guía de Scrum 2020, método Kanban.

### 9.1 Activación y enfoque

- `project.lifecycle` (`PM.LIFECYCLES`): `Predictivo` → `PM.agile.mode(project) = 'predictivo'`; `Adaptativo (ágil)` → `'adaptativo'`;
  `Híbrido`, `Iterativo`, `Incremental` → `'hibrido'`. `PM.agile.enabled(project)` = modo ≠ predictivo.
- Las vistas ágiles se registran con `when: PM.agile.when, unavailable: PM.AgileUnavailable` (grupo `agil`): solo aparecen
  en el menú con ciclo de vida adaptativo o híbrido; si se abren en un proyecto predictivo, el anfitrión muestra un aviso con
  el botón «Usar ciclo de vida híbrido».
- Enfoque por entregable: nodo de la EDT con `approach: 'predictivo' | 'adaptativo'` (opcional; si falta se hereda del padre;
  en la raíz, `'adaptativo'` si el proyecto es adaptativo, si no `'predictivo'`). `PM.calc.wbsApproach(tree, project)` → `Map(id → enfoque efectivo)`.
- Unidad de estimación por proyecto: `settings.estimationUnit` = `'puntos'` (por defecto, «pts») o `'horas'` («h»); `PM.agile.unitShort(settings)`.

### 9.2 Datos

| Ruta | Contenido |
|---|---|
| `projects/{pid}/tools/agile` | `{settings, releases:[Release], sprints:[Sprint]}` (lee con `PM.useAgileModel()`; `PM.EMPTY.agile`, `PM.TOOL_SHAPES.agile`) |
| `projects/{pid}/backlog/{itemId}` | un documento por elemento del backlog (`Item`); colección registrada en `PM.PROJECT_COLLECTIONS` (se exporta, importa, duplica y elimina con el proyecto). Rutas: `PM.paths.backlog(pid)`, `PM.paths.backlogItem(pid, id)` |

```js
settings = { framework: 'scrum'|'kanban'|'scrum-kanban', estimationUnit: 'puntos'|'horas', sprintLength: 10 (días hábiles),
             columns: [{ id, name, category: 'pendiente'|'en-curso'|'terminado', wip: número|null }], scopeChangeThreshold: 10 (%) }
             // PM.agile.settings(data) normaliza; columnas por defecto: por-hacer, en-curso (WIP 3), en-revision (WIP 2), terminado
Release  = { id, name, goal, start, end, status: 'planeado'|'comprometido'|'en-curso'|'cerrado', budget (BAC del release, money),
             plannedSprints, wbsId|null (entregable adaptativo de la EDT), taskId|null (actividad del cronograma que lo representa),
             baseline: { date, points, end, budget, sprints, changeRef|null } | null, notes }
Sprint   = { id, name ('Iteración 3'), releaseId|null, goal, start, end, status: 'planeado'|'en-curso'|'cerrado',
             capacity (unidades), committed (se fija al iniciar), completed (se fija al cerrar),
             docs: { planificacion?: docId, revision?: docId, retrospectiva?: docId }, notes }
Item     = { code ('HU-001'; PM.agile.nextCode), type: 'epica'|'historia'|'tarea'|'defecto'|'mejora'|'investigacion', title, description,
             acceptance (criterios de aceptación, texto), estimate (número|null), priority (MoSCoW: PM.AGILE.PRIORITIES), value (1–10, opcional),
             rank (número; menor = más arriba; PM.agile.rankBetween), status ('backlog' = backlog del producto, o id de columna),
             wbsId|null, releaseId|null, sprintId|null, epicId|null, assignee, blocked: bool, blockedReason, tags: [],
             createdAt (YYYY-MM-DD), doneDate|null, sprintAddedDate|null (si entra a una iteración ya iniciada),
             history: [{date, status}] (≤ 60; PM.agile.withStatus lo mantiene), requirementId? }
```
- `costs.actuals[]` admite `releaseId` (opcional) para imputar costos reales a un release (AgileEVM).
- `tools/schedule.tasks[]` admite `releaseId` (opcional): la actividad representa un release (equivalente a `release.taskId`).
- Las épicas agrupan (`epicId` de los hijos) y no cuentan en las métricas (`PM.agile.countable`).
- Pertenencia (la registra `saveItem` con `PM.agile.trackMembership`, no las vistas): `releaseAddedDate` (ingreso al release actual),
  `releaseExits` y `sprintExits` (`[{releaseId|sprintId, added, removed, estimate}]`, ≤ 20; solo salidas de iteraciones en curso o
  cerradas). El burnup y el burndown cuentan cada elemento solo mientras perteneció. `release.baseline.items = [{id, estimate}]`
  guarda los elementos al fijar la línea base: la solicitud de cambio lista agregados, retirados y reestimados.
- Cambiar de estado SIEMPRE con `PM.agile.withStatus(settings, item, status, fecha)` (o `model.setStatus(item, status)`): registra
  el historial (flujo acumulado) y `doneDate` (burndown, burnup, velocidad).

`PM.useAgileModel()` → `{...PM.useProjectModel(), agileData, settings, releases, sprints (por inicio), items, saveAgile(next),
saveItem(item con id) (escribe el documento del elemento), deleteItem(id), setStatus(item, status), currentSprint, velocity,
approach (Map de la EDT), mode, enabled, unit ('pts'|'h'), agileLoading}`.
Constantes: `PM.AGILE.{FRAMEWORKS, UNITS, UNIT_SHORT, ITEM_TYPES, CODE_PREFIX, PRIORITIES, BACKLOG, CATEGORIES, DEFAULT_COLUMNS,
RELEASE_STATUS, SPRINT_STATUS, APPROACHES, ROLES, DEFAULT_SETTINGS}`. Iconos nuevos: `backlog`, `kanban`, `sprint`, `burndown`, `release`.

### 9.3 Cálculos (`PM.calc`, `PM.agile` — lee 07-agile-core.js)

- `sprintBurndown({sprint, items, settings, cal, statusDate})` → `{total, done, remaining, committed, days:[{date, ideal, remaining|null, scope|null, done|null}]}` (día 0 = día hábil anterior al inicio; días futuros en `null`).
- `velocity({sprints, items, settings})` → `{rows:[{id,name,start,end,status,releaseId,committed,completed}], closed, avg3, avgAll, min3, max3}` (promedio de las últimas 3 iteraciones cerradas).
- `releaseProgress`, `releaseBurnup({release, sprints, items, settings, statusDate})` → `{points:[{date,label,scope,done,future}], total, done, remaining, pct, baselinePoints}`.
- `releaseForecast({release, sprints, items, settings, cal, statusDate})` → `{velocity, sprintsNeeded, finish, finishBest, finishWorst, …}` (velocidad media, máxima y mínima de las últimas 3).
- `agileEvm({release, sprints, items, settings, actualCost, statusDate})` → `{bac, plannedSprints, sprintsElapsed, ppc, apc, pv, ev, ac, sv, cv, spi, cpi, eac, vac, expectedSprints}`
  (AgileEVM: PPC = iteraciones transcurridas / planeadas (máx. 1); APC = terminado / alcance actual; PV = BAC × PPC; EV = BAC × APC;
  con línea base del release, las iteraciones planeadas y el BAC salen de ella: `fromBaseline: true`).
- `releaseForecast`: sin iteraciones cerradas del release, cuenta desde lo más tarde entre el día siguiente al corte, `release.start`
  y el inicio de su primera iteración. `releaseVariance({…, sprints})` agrega `sprintChange` (frente a `baseline.sprints`) y
  `sprintsAfterEnd` (iteraciones que terminan después del fin), que también exigen control de cambios.
  Costo real: `PM.agile.releaseActualCost(release, costs, tree, statusDate)`: los registros con `releaseId` del release; si el release
  no tiene ninguno marcado, los de su actividad (`taskId`) o de su paquete EDT y descendientes (`wbsId`) desde `release.start`.
- `cfd({items, settings, from, to})` → `[{date, nuevo, pendiente, 'en-curso', terminado}]` (semanal si el rango supera 180 días).
- `releaseVariance({release, items, settings})` → `{hasBaseline, scopePct, dateChange (días), budgetChange, needsChangeControl, …}`.
- `PM.agile.releaseCosts(releases, costs, tree, statusDate, tasks?)` (con `tasks` = `schedule.tasks`, la actividad de cada release
  sale de `linksOf`, incluido `task.releaseId`; pásalas siempre que las tengas; `releaseActualCost(release, costs, tree, statusDate, tasks?, releases?)` igual) → `{byRelease: Map(id → {ac, shared}), total, shared}`: costos reales de
  varios releases recorriendo los registros una vez (`total` sin duplicar los compartidos por actividad o EDT).
- WIP: `PM.agile.wipLimit(columna)` (entero ≥ 1 o null), `PM.agile.wipCounts(settings, items)` (conteo por columna sobre todo el
  tablero, sin filtros), `PM.agile.wipStatus(settings, items)` → `[{id, name, category, wip, count, over, full}]`. Úsalos en lugar de copiar la regla.
- Diálogos compartidos (45): `PM.agileItemDialog(model, item|null, valoresIniciales)` (editor del elemento del backlog) y
  `PM.agileSettingsDialog(model)` (configuración ágil); trabajan sobre el proyecto actual con sus propias suscripciones.
- Plantillas aplicables (20): `PM.templateApplies(t|id, project, byTemplate)` y `PM.applicableTemplates(project, byTemplate)`: una
  plantilla ágil (`t.agile`) cuenta solo con ciclo de vida adaptativo o híbrido, o si el proyecto ya tiene documentos de ella.
- Tiempos de flujo: `PM.agile.flowTimes(item, settings)` → `{start, doneDate, cycle, lead}` (días calendario contando ambos extremos;
  inicio = primer paso a «en curso» o «terminado»). Vínculo inverso: `PM.agile.releaseTasks(tasks, agileData)` → `Map(releaseId → taskId)`.
- Ayudantes: `PM.agile.hasBaseline(release)` (línea base con fecha, puntos o fin; `null` o `{}` no cuentan), `PM.agile.activeRelease(releases, sprints)`
  (el de la iteración en curso, si no el primero en curso, comprometido o sin cerrar), `PM.agile.sortSprints(sprints)` (por inicio).
- `PM.agile.applyToSchedule(schedule, agileData, items)`: las actividades vinculadas a un release (`release.taskId` o `task.releaseId`)
  toman `progress` = terminado/alcance × 100 (1 decimal), `actualStart` = inicio de la primera iteración iniciada (si no tenía) y
  `actualFinish` = última terminación al llegar a 100 %; marca `agileDerived: true`. Con `opts.statusDate`, agrega
  `forecastFinish` (pronóstico por velocidad) y `computeSchedule` con fecha de corte lo usa como duración restante. `useProjectModel` lo aplica antes del CPM:
  así el trabajo ágil entra a la ruta crítica, la curva S, el valor ganado y el tablero del proyecto. No modifica lo guardado.
  Los vínculos salen de `PM.agile.linksOf(tasks, agileData)` → `Map(taskId → release)`: primero `release.taskId` (si dos releases
  apuntan a la misma actividad gana el último) y luego `task.releaseId` solo para releases sin actividad (la primera en el orden
  del cronograma). Un release nunca se aplica a dos actividades; usa esta función en lugar de replicar la regla.

### 9.4 Vistas (grupo `agil`)

- `backlog` (45) — Backlog del producto: lista priorizada (rango; subir/bajar y arrastrar), filtros (tipo, release, épica,
  estado, entregable EDT, texto), alta rápida, editor del elemento (todos los campos de `Item`), épicas con avance, totales
  estimados por release, MoSCoW, refinamiento (elementos sin estimar o sin criterios de aceptación), asignar a release o iteración,
  exportar CSV. Reordenar el backlog es libre (no requiere control de cambios).
  Parámetros de navegación: `{wbs, release, epic}` inician los filtros (el entregable incluye lo que lo compone); los filtros
  aplicados se muestran como botones que se quitan con un clic.
- `kanban` (45) — Tablero Kanban (parámetros `{sprint, release}`): columnas de `settings.columns` (editar nombre, categoría y límite WIP; agregar/quitar con
  reasignación), tarjetas arrastrables y con teclado (mover a la columna anterior/siguiente), alerta visual y textual al superar el
  WIP, bloqueados, filtro por iteración (por defecto la actual en Scrum) o todo el flujo (Kanban), tiempo de ciclo y antigüedad
  en la columna, mover a «Terminado» registra `doneDate`.
- `iteraciones` (46) — Releases e iteraciones: releases (CRUD, vínculo con entregable EDT y actividad del cronograma, presupuesto,
  iteraciones planeadas, «Fijar línea base del release», estado), iteraciones (CRUD, generar siguientes por duración,
  planificación con capacidad y velocidad, iniciar → fija `committed`, cerrar → fija `completed` y devuelve lo no terminado al
  backlog o a la siguiente iteración), documentos de la iteración (crear y abrir `planificacion-sprint`, `acta-revision-sprint`,
  `retrospectiva` prellenados; «Enviar a lecciones aprendidas» copia las lecciones de la retrospectiva a `registro-lecciones`),
  control de cambios en dos niveles: si `releaseVariance.needsChangeControl` → aviso y «Registrar solicitud de cambio» (crea
  `solicitud-cambio` prellenada y la fila CC-00x en `registro-cambios`); aprobada, «Actualizar línea base del release» guarda la
  nueva línea base con `changeRef`.
  Vacías, `iteraciones` y `metricas-agiles` muestran una tarjeta de ancho completo con los pasos para empezar.
- `metricas-agiles` (46) — Métricas: burndown de la iteración, burnup del release (con línea base), velocidad (comprometido vs.
  terminado, promedio), diagrama de flujo acumulado, pronóstico de terminación (optimista/probable/pesimista), AgileEVM por
  release (PV, EV, AC, SPI, CPI, EAC) comparado con el valor ganado del proyecto, tiempo de ciclo y rendimiento (throughput).

Integraciones en módulos existentes:
- 30-wbs: selector de enfoque por nodo (Heredado/Predictivo/Adaptativo), distintivo «Ágil» en los entregables adaptativos,
  acción «Crear release» (crea el release con `wbsId` y abre `iteraciones`), conteo de elementos del backlog por paquete.
- 40-schedule: en el editor de actividad, «Release vinculado» (`task.releaseId`); si está vinculado, el avance se muestra
  calculado desde el backlog y no se edita; en el Gantt, distintivo del release y segmentos de sus iteraciones dentro de la barra.
- 50-evm: los registros de costos admiten «Release» (`releaseId`); sección «Valor ganado ágil (AgileEVM)» por release.
- 70-matrices: «Agregar roles ágiles» en la RACI (`PM.AGILE.ROLES`) y filas de eventos ágiles (refinamiento, planificación,
  revisión, retrospectiva, priorización, definición de terminado) con asignación típica.
- 80-dashboard: tarjeta ágil (iteración actual y días restantes, burndown mínimo, velocidad media, avance del release, SPI/CPI
  ágiles, alertas de WIP y bloqueados) y ruta sugerida según el enfoque (predictivo, híbrido, adaptativo).

### 9.5 Plantillas ágiles (14-templates-agile.js; ids y claves fijas)

| id | Nombre | Proceso | Área | Grupo | kind | múltiple |
|---|---|---|---|---|---|---|
| vision-producto | Visión del producto | 5.2 | alcance | inicio | documento | |
| definicion-terminado | Definición de listo y de terminado | 8.1 | calidad | planificacion | documento | |
| plan-release | Plan de releases (hoja de ruta del producto) | 6.5 | cronograma | planificacion | plan | |
| planificacion-sprint | Planificación de la iteración | 4.3 | integracion | ejecucion | acta | sí |
| acta-revision-sprint | Acta de revisión de la iteración | 5.5 | alcance | monitoreo | acta | sí |
| retrospectiva | Retrospectiva de la iteración | 4.4 | integracion | ejecucion | acta | sí |

Claves que otros módulos leen o prellenan (respeta exactamente):
- `vision-producto`: `producto`, `paraQuien`, `necesidad`, `categoria`, `beneficioClave`, `alternativas`, `diferenciador`
  (declaración «Para… que… el… es un… que… a diferencia de… nuestro producto…»), `objetivosNegocio` (list), `metricasExito` (table:
  `metrica`, `lineaBase`, `meta`, `fecha`), `personas` (table: `persona`, `descripcion`, `necesidades`), `restricciones` (list).
- `definicion-terminado`: `definicionListo` (list), `definicionTerminado` (list), `criteriosRelease` (list), `politicasFlujo` (list: políticas explícitas del tablero y límites WIP).
- `plan-release`: `visionResumen` (textarea), `velocidadSupuesta` (number), `duracionIteracion` (number, días hábiles),
  `releases` (table: `release`, `objetivo`, `fechaInicio`, `fechaFin`, `iteraciones` (number), `puntos` (number), `presupuesto` (money), `alcance` (textarea)), `supuestos` (list).
- `planificacion-sprint`: `iteracion`, `release`, `fechaInicio`, `fechaFin`, `objetivo`, `capacidad` (number), `velocidadReferencia` (number), `compromiso` (number),
  `elementos` (table: `codigo`, `titulo`, `tipo`, `estimacion` (number), `responsable`, `criterios`), `riesgos` (textarea), `participantes` (list).
- `acta-revision-sprint`: `iteracion`, `fecha`, `objetivo`, `objetivoCumplido` (select: Sí | Parcialmente | No), `comprometido` (number), `terminado` (number),
  `elementos` (table: `codigo`, `titulo`, `estimacion` (number), `resultado` (select: Aceptado | Rechazado | No terminado), `observaciones`),
  `retroalimentacion` (textarea), `cambiosBacklog` (textarea), `asistentes` (list).
- `retrospectiva`: `iteracion`, `fecha`, `formato` (select: Bien, mejorar y acciones | Empezar, dejar y continuar | 4L), `queFueBien` (list), `queMejorar` (list),
  `acciones` (table: `accion`, `responsable`, `fechaObjetivo` (date), `estado` (select: Pendiente | En curso | Hecha)),
  `lecciones` (table: `situacion`, `impacto` (select: Positivo | Negativo), `recomendacion`) → se copian a `registro-lecciones.lecciones`
  (`id`, `fecha`, `area` = 'Integración', `situacion`, `impacto`, `recomendacion`, `registradoPor` = 'Retrospectiva <iteración>').

### 9.6 Control de cambios en dos niveles

1. Dentro del release (sin control formal): reordenar, refinar, dividir o cambiar elementos del backlog del producto mientras el
   alcance total del release se mantenga dentro de `scopeChangeThreshold` (%) de su línea base y no cambien fecha ni presupuesto.
2. Del release (4.6 Realizar el control integrado de cambios): si el alcance supera el umbral o cambian la fecha o el presupuesto
   del release comprometido → solicitud de cambio, registro de cambios y, aprobada, nueva línea base del release (y, si aplica,
   nueva línea base del proyecto en `lineas-base`).

### 9.7 Ejemplos

- `erp` (94): «EJEMPLO · Implementación del ERP de Ingeniería y Alquiler» — ciclo de vida Adaptativo (ágil), Scrum con tablero
  Kanban, iteraciones de 2 semanas, 3 releases (inventario y alquiler de equipos; facturación electrónica y cartera;
  mantenimiento y tablero gerencial), iteraciones cerradas y una en curso a la fecha de corte, documentos ágiles y PMBOK.
  Documentos: `PM.exampleDocs.erp(F, ctx)` (95) más los módulos `97-example-erp-docs-*.js` (integración, adquisiciones,
  comunicaciones, equipo, negocio), que se registran en `PM.exampleDocs.erpParts` con la misma firma; `ctx = {R, CODE, STATUS_DATE,
  data}` (data: schedule, wbs, costs, agile, items, baselines, resources). Una plantilla única la aporta un solo módulo; las
  múltiples suman instancias y se numeran por fecha de creación. El ejemplo diligencia los documentos ágiles y de ambos
  enfoques que corresponden a la fecha de corte (el informe final y el acta de cierre quedan para el cierre) y conserva dos
  planes predictivos que usa por su LB0 (cambios y riesgos). Una revisión aprobada lleva quien la aprobó aunque la emisión
  vigente esté en revisión. Los documentos de negocio (97-example-erp-docs-negocio) son la evaluación de necesidades, el
  acuerdo con el cliente (con su otrosí) y el primer seguimiento de beneficios, en borrador y programado para después del
  cierre (no cuenta en el avance documental).
- `medellin` (91–93, 96 y 98): ciclo de vida Híbrido; la obra y la estructuración siguen en cascada y el entregable comercial y digital
  (sala de ventas virtual, CRM y campañas) se gestiona con Kanban/Scrum. Las cifras financieras del ejemplo no cambian: el avance
  derivado del backlog coincide con el avance guardado de las actividades vinculadas. Los documentos de negocio (98, que se
  suman a `PM.exampleDocs.medellin`) son la evaluación de necesidades y el acuerdo interno de la junta directiva; el proyecto
  no ha cerrado, así que no tiene informe de beneficios.

## 10. Recursos del proyecto y estructuras de desglose

Objetivo: registrar los recursos del proyecto en un **catálogo** (también los que aparecen a mitad del proyecto, sin
planificar), clasificarlos por **tipo**, asignarlos a las actividades, costear las actividades de cuatro formas,
alimentar la capacidad del equipo ágil y ver en diagrama las **estructuras de desglose** de costos, riesgos y recursos.
Referencias: Guía del PMBOK® 6.ª ed. 9.2 (estimar recursos; estructura de desglose de recursos), 9.3 (adquirir), 9.6
(controlar los recursos), 7.2 y 7.3 (estimar costos y determinar el presupuesto; componentes del presupuesto, gráfico 7-8),
11.1 y 11.2 (estructura de desglose de los riesgos, gráfico 11-4), 4.6 (control integrado de cambios).

### 10.1 Datos

| Ruta | Contenido |
|---|---|
| `projects/{pid}/tools/resources` | `{preset, types:[Type], items:[Resource]}` (`PM.EMPTY.resources`, `PM.TOOL_SHAPES.resources`) |

```js
Type     = { id, name, kind: 'trabajo'|'consumible', edr: 'Personal'|'Equipos'|'Materiales'|'Transporte'|'Servicios' }
           // sin types guardados se usan los del preset (PM.RES.PRESETS: general, construccion, alquiler, ti); 'sin-clasificar' es virtual
Resource = { id, code ('REC-001'; PM.res.nextCode), name, typeId, subtype (texto: nivel 2 de la EDR), kind? (anula el del tipo),
             unit (PM.RES.UNITS o texto), availability (trabajo: unidades por día hábil; consumible: existencia, opcional),
             availableFrom, availableTo (rango opcional), unitCost (trabajo: por unidad y día hábil; consumible: por unidad de medida),
             origin (PM.RES.ORIGINS), supplier, contract, responsible, status ('planificado'|'solicitado'|'disponible'|'liberado'),
             planned (bool; false = no planificado), addedDate, reason (PM.RES.REASONS), riskId, reserveAmount, changeRef,
             agileTeam (bool), dedication (0–100 %), hoursPerDay, absences:[{id, from, to, note}], notes }
```
- Asignación en el cronograma (`tasks[].resources[]`): `{resourceId?, name, units, qty?}`. `name` se conserva siempre (compatibilidad);
  `resourceId` enlaza con el catálogo. Trabajo: `units` = unidades por día. Consumible: `qty` = cantidad total (si falta: unidades × días).
- Recursos **virtuales**: nombres usados en asignaciones que no están en el catálogo (datos de antes). `PM.res.catalog` los agrega como
  «Sin clasificar» (`id 'v:<nombre>'`, `virtual: true`) con la disponibilidad de `schedule.settings.resourceLimits`. Al editarlos se
  guardan en el catálogo (`useResourceModel().saveItem`). La disponibilidad del catálogo tiene prioridad sobre `resourceLimits`.
- Actividad (`tasks[]`): `costMode: 'global'` (por defecto: `cost` escrito a mano, precio global a todo costo) | `'recursos'` |
  `'mixto'` (`costFixed` + recursos) | `'unitario'` (`quantity` × `unitPrice`, `qtyUnit`); `costCategory` opcional (PM.RES.COST_CATEGORIES)
  para el desglose de costos de las actividades de precio global.

### 10.2 Cálculos (`PM.res`, lee 09-resources-core.js)

- `catalog(data, schedule)` → `{types, items, byId, byKey, resolve(asignación), kindOf(item), typeOf(item)}`.
- `assignment(cat, task, a)` → `{item, kind, units, qty, unitCost, cost, priced}`; `taskCost(task, cat)` → `{mode, total, fixed,
  resourcesTotal, lines, unpriced, unitario, manual}`; `applyCosts(schedule, data)`: lo aplica a las actividades no «global»
  (`cost` = calculado, `costManual`, `costComputed: true`). `useProjectModel` lo aplica en `effSchedule`, así entra al CPM, la curva S,
  el valor ganado sin línea base y las nuevas líneas base. **La línea base guardada no cambia**: muestra la diferencia.
- `costSplit(task, cat, cost?)` → `[{category, value}]` en `PM.RES.COST_CATEGORIES`: cada línea por `costCategoryOf(tipo)` (el
  `costCategory` del tipo o su categoría EDR: Personal → Mano de obra, Equipos, Materiales, Transporte, Servicios; si no,
  Otros); la parte fija y el precio global por el `costCategory` de la actividad (fija sin categoría → Otros; global → Sin categoría).
- `PM.RES.plural(unidad)` / `PM.RES.unitN(n, unidad)`: unidades en plural («hora» → «horas», «usuario-mes» → «usuarios-mes»;
  los símbolos no cambian). Usarlas en 36, 40 y 42 al escribir cantidades.
- `reserveUse({data, schedule, contingency})`: ver §10.3.
- `compact(item)`: recurso sin campos vacíos ni con el valor de `PM.RES.DEFAULT_ITEM` (`catalog()` los rellena al leer); quien lea
  `resources.items` crudos no debe suponer esos campos. `DOC_LIMIT` = 256 KiB: `useResourceModel` no escribe un catálogo que no
  cabe (rechaza la promesa y avisa) y avisa al pasar el 90 %. `assignment` limita `unitCost` a ≥ 0; `taskCost` cuenta también
  las asignaciones sin nombre cuyo `resourceId` está en el catálogo. `PM.date.valid` exige mes 1–12 y día dentro del mes.
- `usage(cat, tasks)` → `Map(id → {tasks:[{task, units, qty, cost}], count, qty, cost})` (uso de cada recurso en el cronograma).
- `availableOn(item, día)`; `teamCapacity({data, schedule, sprint, cal, settings, velocity})` → `{members[{…, normal, absentDays,
  inRangeDays}], personDays, normal, hours, ratio, suggested, unit, reference:{kind:'velocidad'|'habitual', personDays, sprints}}`
  (miembros: `agileTeam`, de trabajo y no liberados; sugerida en horas, o en puntos = velocidad media × `ratio`). `ratio` =
  días-persona de la iteración / referencia: «velocidad» = promedio de días-persona de las ≤ 3 últimas iteraciones cerradas de
  `velocity.rows` (las del promedio `avg3`, con el equipo de entonces, también los liberados, dentro de su rango; un no
  planificado sin `availableFrom` empieza en su `addedDate`); si alguna no
  tiene fechas, «habitual» = `normal` (`sprintLength` × unidades × dedicación de cada miembro disponible algún día de la
  iteración; quien está fuera de su rango toda la iteración no cuenta). `absentDays`: ausencias dentro del rango.
- Árboles para diagramas (nodo `{id, label, code?, sub?, value, metric:'money'|'count'|'score', pct, tone?, badge?, kind:'root'|'group'|'reserve'|'leaf', children}`):
  `rbsTree({data, schedule, sched})` (recursos: tipo → subtipo → recurso), `cbsTree({tree, sched, schedule, data, baseline, reserves,
  source:'plan'|'baseline', controlDepth, showActivities, by:'edt'|'categoria'})` (costos, gráfico 7-8 del PMBOK),
  `riskTree({planRows, risks})` (riesgos: `plan-gestion-riesgos.edrRiesgos` (nivel1, nivel2, categoriaRegistro) → riesgos de
  `registro-riesgos.riesgos`, ubicados por `subcategoria` (columna opcional nueva) o por su `categoria`; las hojas de oportunidad
  llevan `opportunity: true` y tono `good`; `max`, `tone` y `level` de cada grupo salen solo de las amenazas; los grupos traen
  `threats` y `opportunities`). En `cbsTree` por categoría se omiten las categorías en 0 (salvo con actividades); en el plan
  vigente la reserva para contingencias es la disponible (nodo con `reserveTotal`, `reserveConsumed`) y, si hay consumo sin
  actividad, un nodo `cbs:riesgos` «Respuestas a riesgos sin actividad».
- `PM.changeControl.register({pid, project, description, justification, scope, days, cost, affected, requester, type, date, quiet})` →
  `{code, docId}`: crea `solicitud-cambio--<uid>` (decisión «Registrada») y agrega la fila CC-00x a `registro-cambios`.

### 10.3 Recursos no planificados (9.6) y línea base

Un recurso nuevo con línea base de costos o cronograma ya fijada se marca `planned: false` y pide el **motivo** (`PM.RES.REASONS`):
sustitución equivalente, por cuenta del contratista (todo costo), respuesta a un riesgo identificado (registra `riskId` y
`reserveAmount`: consumo de la reserva para contingencias), menor rendimiento (acción correctiva: variación) → **no** cambian la
línea base; cambio de alcance, diseño o método, o imprevisto pagado con la reserva de gestión → `baseline: true`: ofrecer
`PM.changeControl.register` y guardar `changeRef`. La vista muestra planificados frente a no planificados.

Reserva para contingencias: `costs.reserves.contingency` es el total de la reserva del plan (dentro de la línea base) y **no se
descuenta** al usarla; el consumo se registra en cada recurso no planificado por riesgo (`reserveAmount`). Una sola regla,
`PM.res.reserveUse({data, schedule, contingency})` → `{total, consumed, available, assigned, unassigned, items}`: disponible =
total − Σ `reserveAmount`. Lo consumido pasa a las cuentas de control (gráfico 7-8): las actividades «recursos» o «mixto» ya
suman el costo de sus asignaciones; lo que no está en ninguna (`unassigned` = Σ max(0, `reserveAmount` − asignado)) es una cuenta
aparte. En el **plan vigente** (36 EDC «Plan actual», 50 presupuesto y «Reservas», 80) la línea base = actividades + `unassigned`
+ reserva **disponible**: el total no se duplica cuando el recurso se asigna, ni se pierde cuando no. Una línea base guardada
conserva su reserva tal como se aprobó; al **fijar una nueva** con reserva consumida (80), `cost.contingency` guarda la disponible
más el consumo sin actividad (no el total). `useProjectModel` expone `reserveUse` y, sin línea base de costos, pasa a
`calc.evm` esa misma reserva efectiva (`costBaseline` y `totalBudget` no cuentan dos veces lo consumido). Costo de los no planificados (42 tarjeta «No planificados» y 80 alerta): el de sus
asignaciones en el cronograma (costo unitario del catálogo); sin asignaciones, su `reserveAmount` (rotularlo así).

### 10.4 Vistas e integraciones

- `recursos` (40 + 42): `PM.navigate('recursos', {tab: 'catalogo'|'histograma'|'consumo', plan?: 'no-planificado'|…})` (la pestaña
  elegida se recuerda en PM.prefs `rec.tab`). Editar «Disponible» en el histograma guarda en el catálogo y quita la clave del recurso
  en `resourceLimits`. La columna de costo del Gantt aparece con área de 1440 px o más. Pestañas **Catálogo** (`PM.ResourceCatalog`: tabla con filtros por tipo y planificado, agregar, editar,
  eliminar con limpieza de asignaciones, tipos del proyecto con presets, importar los virtuales, flujo de no planificados),
  **Histograma** (el actual, con filtro por tipo y disponibilidad del catálogo; editar «Disponible» guarda en el catálogo) y
  **Consumo** (consumibles: cantidad y costo por semana o mes).
- Editor de actividad (40): selector de recurso del catálogo con «Crear recurso nuevo…» (`PM.resourceDialog`), unidades por día o
  cantidad según la clase, forma de costeo con desglose y comparación con la línea base.
- 42 expone: `PM.ResourceCatalog({model})`, `PM.resourceDialog(model, item|null, initial) → Promise<recurso guardado|null>`,
  `PM.resourceTypesDialog(model)`, `PM.unplannedResourceFlow(model, item) → Promise<item con motivo|null>`.
- `estructuras` (36): «Estructuras de desglose» (`navLabel` «Desgloses»), grupo `planificacion`, orden 15: pestañas Costos, Riesgos
  y Recursos, diagrama de árbol (zoom, ajustar, plegar ramas, teclado, exportar SVG y PNG, ver como tabla con columna «Nivel»).
  Zoom inicial «auto»: ajusta al ancho si queda en 60 % o más; si no, 100 % centrado en la raíz. «Actualizar el documento EDR»
  escribe la unidad de los recursos de trabajo con su base de tiempo («persona por día hábil»). En Costos, la reserva para
  contingencias del plan es la disponible (§10.3); en Riesgos, el indicador de nivel alto cuenta solo amenazas.
- 46: capacidad sugerida de la iteración con `teamCapacity`. 50: consumo de la reserva para contingencias por recursos no
  planificados y forma de costeo en las tablas por actividad. 80: alerta de recursos no planificados y paso «Catálogo de recursos»
  en la ruta. 10: herramientas y glosario.

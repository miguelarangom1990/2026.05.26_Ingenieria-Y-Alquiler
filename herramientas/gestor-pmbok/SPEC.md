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
| `src/06-model.js` | hooks de modelo compartido. Núcleo. |
| `src/08-shell.js` | riel, selector de proyecto, portafolio, formulario de proyecto. Núcleo. |
| `src/10-pmbok.js` | base de conocimiento PMBOK (`PM.KB`). |
| `src/12-templates-a.js` | plantillas: Integración, Alcance, Cronograma. |
| `src/13-templates-b.js` | plantillas: Costos, Calidad, Recursos, Comunicaciones, Riesgos, Adquisiciones, Interesados. |
| `src/20-docs.js` | vistas `procesos`, `documentos`, `documento` (editor). |
| `src/30-wbs.js` | vista `edt`. |
| `src/40-schedule.js` | vistas `cronograma`, `red`, `recursos`. |
| `src/50-evm.js` | vista `valor-ganado`. |
| `src/60-flow.js` | vista `flujogramas`. |
| `src/70-matrices.js` | vistas `raci`, `riesgos-matriz`, `interesados-matriz`, `calidad`. |
| `src/80-dashboard.js` | vistas `tablero`, `lineas-base`, `ficha`. |
| `src/90-example.js` | constructor del proyecto de ejemplo (`PM.registerExample`). |
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
PM.useProjectModel()            // {project, pid, schedule, saveSchedule, wbs, saveWbs, costs, saveCosts, tree, sched, forecast, baselines, baselineDocs, evm, rollup, statusDate, currency, loading}
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

Registra cada vista: `PM.registerView({id, label, group, icon, order, component, needsProject:true, hidden:false, parent?, description})` (`parent`: id de la vista visible que se marca como actual mientras se muestra una vista oculta).
Grupos: `portafolio`, `proyecto`, `planificacion` (Alcance, tiempo y recursos), `costos` (Costos y desempeño), `analisis` (Matrices y análisis).
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
| caso-negocio | Caso de negocio | 4.1 (entrada) | integracion | inicio | documento | |
| plan-gestion-beneficios | Plan de gestión de los beneficios | 4.1 (entrada) | integracion | inicio | plan | |
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

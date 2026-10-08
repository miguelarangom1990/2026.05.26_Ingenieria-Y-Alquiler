/* ==========================================================================
   20-docs.js — documentos del proyecto: mapa de procesos (10 áreas × 5
   grupos), lista maestra de documentos y editor con cajetín, flujo de
   revisiones (convención de planos), historial, exportación (Markdown/HTML)
   y redacción asistida con Claude.
   Vistas: procesos, documentos, documento (oculta). Expone PM.openDocument.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ------------------------------------------------------------------ estilos del módulo */
  const CSS = `
.docs-m-only { display: none; }
.docs-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: var(--fs-sm); color: var(--fg-3); min-width: 0; }
.docs-crumbs button { border: 0; background: none; padding: 0; color: var(--accent); cursor: pointer; font: inherit; }
.docs-crumbs button:hover { text-decoration: underline; }
.docs-crumbs [aria-current] { color: var(--fg-2); min-width: 0; overflow-wrap: anywhere; }
.docs-chip-sin { background: transparent; border: 1px dashed var(--line-strong); color: var(--fg-3); }
.docs-seg { display: flex; flex: 1; min-width: 28px; height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.docs-seg > span { display: block; height: 100%; }
.docs-seg-done { background: var(--good); }
.docs-seg-prog { background: var(--accent); }
.docs-sw { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: none; }
.docs-sw-none { background: var(--surface-3); box-shadow: inset 0 0 0 1px var(--line-strong); }
.docs-num { font-family: var(--font-display); font-weight: 700; color: var(--fg-3); font-size: 1.05rem; line-height: 1.2; min-width: 1.5em; font-variant-numeric: tabular-nums; flex: none; }
.docs-code { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--fg-3); }
.docs-sub { display: flex; gap: 6px; align-items: flex-start; }
.docs-sub > .docs-sw { margin-top: 4px; }

.docs-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; }
.docs-gbtn { display: flex; flex-direction: column; gap: 6px; min-width: 0; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-top: 3px solid var(--gc); border-radius: var(--r-md); background: var(--surface); color: var(--fg); cursor: pointer; box-shadow: var(--shadow-card); }
.docs-gbtn:hover { border-color: var(--line-strong); border-top-color: var(--gc); }
.docs-gbtn[aria-pressed="true"] { background: var(--accent-wash); border-color: var(--accent); border-top-color: var(--gc); }
.docs-gbtn:focus-visible, .docs-proc:focus-visible, .docs-proc.is-hit:focus-visible { box-shadow: var(--focus); }
.docs-gbtn-name { display: flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 600; }
.docs-gbtn-num { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; line-height: 1.1; font-stretch: 105%; }
.docs-gbtn-sub { font-size: var(--fs-xs); color: var(--fg-3); }
.docs-matrix-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-card); max-width: 100%; }
.docs-matrix { display: grid; grid-template-columns: minmax(150px, 0.9fr) repeat(5, minmax(148px, 1fr)); min-width: 900px; }
.docs-mrow { display: contents; }
.docs-mh { display: flex; align-items: center; gap: 7px; padding: 9px 10px; background: var(--surface-2); border-left: 1px solid var(--line); border-bottom: 1px solid var(--line-strong); font-size: var(--fs-xs); font-weight: 600; color: var(--fg); }
.docs-mh:first-child { border-left: 0; color: var(--fg-3); border-top-left-radius: var(--r-lg); }
.docs-mh:last-child { border-top-right-radius: var(--r-lg); }
.docs-ma { display: flex; flex-direction: column; gap: 1px; align-items: flex-start; padding: 10px 12px; border-top: 1px solid var(--line); background: var(--surface-2); min-width: 0; }
.docs-mrow-head + .docs-mrow > * { border-top: 0; }
.docs-ma-name { font-size: var(--fs-sm); font-weight: 600; line-height: 1.3; min-width: 0; overflow-wrap: break-word; }
.docs-mc { display: flex; flex-direction: column; gap: 6px; padding: 6px; border-top: 1px solid var(--line); border-left: 1px solid var(--line); min-width: 0; }
.docs-dim { opacity: 0.35; }
.docs-proc { display: flex; flex-direction: column; gap: 3px; width: 100%; min-width: 0; text-align: left; padding: 6px 8px 7px 9px; border: 1px solid var(--line); border-left: 3px solid var(--gc); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); cursor: pointer; line-height: 1.3; font-size: var(--fs-xs); }
.docs-proc:hover { background: var(--surface-2); border-color: var(--line-strong); border-left-color: var(--gc); }
.docs-proc.is-dim { opacity: 0.32; }
.docs-proc.is-hit { border-color: var(--accent); border-left-color: var(--gc); box-shadow: 0 0 0 2px var(--accent-wash); }
.docs-proc-name { font-weight: 500; overflow-wrap: anywhere; }
.docs-proc-meta { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; color: var(--fg-3); margin-top: 2px; }
.docs-acc { border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-card); min-width: 0; }
.docs-acc-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 14px; border: 0; background: transparent; color: var(--fg); cursor: pointer; text-align: left; border-radius: var(--r-lg); }
.docs-acc-head:hover { background: var(--surface-2); }
.docs-acc-title { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; font-weight: 600; font-size: var(--fs-sm); }
.docs-acc-body { display: flex; flex-direction: column; gap: 12px; padding: 4px 14px 14px; }
.docs-acc-glabel { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-3); font-weight: 600; }
.docs-acc-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; }

.docs-io { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; }
.docs-io ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; font-size: var(--fs-sm); color: var(--fg-2); }
.docs-io-h { margin-bottom: 6px; }
.docs-out { border: 1px solid var(--line); border-radius: var(--r-md); }
.docs-out-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; padding: 8px 12px; border-top: 1px solid var(--line); }
.docs-out-row:first-child { border-top: 0; }
.docs-out-name { flex: 1 1 220px; min-width: 0; display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); }
.docs-out-name > .icon { color: var(--fg-3); }
.docs-out-sub { flex-basis: 100%; display: flex; flex-direction: column; gap: 4px; padding-left: 24px; }
.docs-out-inst { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; font-size: var(--fs-sm); }
.docs-out-inst .docs-link { flex: 1 1 160px; font-weight: 500; }
.docs-out-iname { flex: 1 1 160px; min-width: 0; }
.docs-out-iname .docs-link { color: var(--accent); }

.docs-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.docs-stats > .stat + .stat { border-left: 1px solid var(--line); }
.docs-stats-foot { display: flex; align-items: center; gap: 10px; padding: 0 16px 14px; font-size: var(--fs-xs); color: var(--fg-3); }
.docs-filters { display: grid; grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(0, 1fr)); gap: 8px; align-items: center; }
.docs-tablewrap { border: 0; border-radius: 0 0 var(--r-lg) var(--r-lg); }
.docs-table { table-layout: fixed; min-width: 860px; }
.docs-table td { vertical-align: middle; overflow-wrap: anywhere; }
.docs-table .docs-act { text-align: right; white-space: nowrap; }
.docs-link { border: 0; background: none; padding: 0; color: var(--fg); font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
.docs-link:hover { color: var(--accent); text-decoration: underline; }
.docs-inst td:nth-child(2) { padding-left: 26px; }
.docs-inst .docs-link { font-weight: 500; }
.docs-parent td { background: var(--surface-2); }
@media (max-width: 1100px) { .docs-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .docs-filters > :first-child { grid-column: 1 / -1; } }
@media (max-width: 760px) { .docs-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .docs-stats > .stat { border-left: 0 !important; border-top: 1px solid var(--line); } .docs-stats > .stat:first-child { grid-column: 1 / -1; border-top: 0; } }
@media (max-width: 520px) { .docs-filters { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 680px) {
  .docs-table { table-layout: auto; min-width: 0; }
  .docs-table, .docs-table tbody { display: block; }
  .docs-table colgroup, .docs-table thead { display: none; }
  .docs-table tr { display: grid; grid-template-columns: auto auto auto minmax(0, 1fr) auto; grid-template-areas: "name name name name act" "code code code code act" "status rev proc upd upd"; gap: 4px 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--line); }
  .docs-table tr:last-child { border-bottom: 0; }
  .docs-table td { display: block; padding: 0; border: 0; min-width: 0; }
  .docs-table tbody tr:hover td { background: transparent; }
  .docs-table .docs-c-code { grid-area: code; } .docs-table .docs-c-name { grid-area: name; } .docs-table .docs-c-proc { grid-area: proc; }
  .docs-table .docs-c-status { grid-area: status; } .docs-table .docs-c-rev { grid-area: rev; } .docs-table .docs-c-upd { grid-area: upd; text-align: right; }
  .docs-table .docs-act { grid-area: act; }
  .docs-table tr.docs-parent { background: var(--surface-2); }
  .docs-table tr.docs-parent td { background: transparent; }
  .docs-table tr.docs-inst { padding-left: 26px; }
  .docs-table tr.docs-inst td:nth-child(2) { padding-left: 0; }
  .docs-m-only { display: inline; }
}

/* Título editable: el área de texto y una copia invisible del texto (::after) comparten la celda de una rejilla, así el
   bloque mide lo mismo que el título en lectura (hasta el tope de .page-head-text) en vez del ancho por defecto de un textarea. */
.docs-title-wrap { display: grid; min-width: 0; margin-left: -7px; }
.docs-title-wrap::after { content: attr(data-value) ' '; grid-area: 1 / 1; visibility: hidden; pointer-events: none; min-width: 0; white-space: pre-wrap; overflow-wrap: break-word; border: 1px dashed transparent; padding: 0 6px; }
.docs-title-input { grid-area: 1 / 1; align-self: stretch; display: block; width: 100%; min-width: 0; font: inherit; line-height: inherit; color: inherit; letter-spacing: inherit; border: 1px dashed var(--line-strong); border-radius: var(--r-sm); background: transparent; padding: 0 6px; margin: 0; resize: none; overflow: hidden; white-space: pre-wrap; overflow-wrap: break-word; }
.docs-title-input:hover { border-color: var(--fg-3); }
.docs-title-input:focus { outline: none; border-style: solid; border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-wash); }
.docs-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.docs-bar-info { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: var(--fs-sm); color: var(--fg-2); min-width: 0; }
.docs-rev { font-family: var(--font-mono); font-weight: 600; color: var(--fg); }
.docs-save { display: inline-flex; align-items: center; gap: 5px; font-size: var(--fs-xs); color: var(--fg-3); }
.docs-save.is-ok { color: var(--good); }
.docs-callout { display: flex; gap: 10px; align-items: flex-start; padding: 10px 14px; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface-2); font-size: var(--fs-sm); color: var(--fg); }
.docs-callout > .icon { margin-top: 2px; flex: none; color: var(--fg-3); }
.docs-callout.is-info { background: var(--info-wash); border-color: transparent; }
.docs-callout.is-info > .icon { color: var(--info); }
.docs-callout.is-warn { background: var(--warn-wash); border-color: transparent; }
.docs-callout.is-warn > .icon { color: var(--warn); }
.docs-callout.is-good { background: var(--good-wash); border-color: transparent; }
.docs-callout.is-good > .icon { color: var(--good); }
.docs-callout-body { display: flex; flex-direction: column; gap: 8px; min-width: 0; flex: 1; }
.docs-tb-input { width: 100%; min-width: 0; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg); padding: 2px 6px; min-height: 24px; }
.docs-tb-input:hover { border-color: var(--line-strong); }
.docs-tb-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-wash); }
/* Campos de una sección, en tramos consecutivos del mismo tipo (se respeta el orden de la plantilla):
   cortos en una rejilla que no los estira (como .pf-grid), textos largos y listas en columnas de lectura (máx. 70ch)
   que se reparten el ancho, tablas a todo el ancho. */
.docs-fields { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.docs-run { display: grid; gap: 16px 18px; min-width: 0; }
.docs-run.is-short { grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.docs-run.is-long { grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr)); }
.docs-run.is-long > * { min-width: 0; max-width: 70ch; }
.docs-run.is-table { grid-template-columns: minmax(0, 1fr); }
.docs-line { display: block; resize: none; overflow-y: auto; overflow-wrap: break-word; }
.docs-sec-n { font-family: var(--font-mono); font-weight: 500; color: var(--fg-3); margin-right: 8px; font-size: 0.9em; }
.docs-ro { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--fg); padding: 1px 0; }
.docs-ro-empty { color: var(--fg-3); font-style: italic; }
.docs-ro-list { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 3px; }
.docs-list { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.docs-list-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
.docs-list-n { flex: none; width: 1.9em; padding-right: 4px; text-align: right; font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg-3); }
.docs-list-row .docs-list-n { padding-top: 7px; }
.docs-list-ta { flex: 1; margin-right: 4px; resize: none; overflow: hidden; min-height: 32px; display: block; }
.docs-suffix { position: relative; }
.docs-suffix .input { padding-right: 30px; }
.docs-suffix-u { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--fg-3); font-size: var(--fs-sm); pointer-events: none; }
.docs-hint { display: inline-flex; flex-wrap: wrap; gap: 2px 10px; align-items: center; }
.docs-from { display: inline-flex; align-items: center; gap: 4px; color: var(--info); }
.docs-from-btn { display: inline-flex; align-items: center; gap: 4px; border: 0; background: none; padding: 0; color: var(--accent); font: inherit; cursor: pointer; text-align: left; }
.docs-from-btn:hover { text-decoration: underline; }
.docs-tips { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); color: var(--fg-2); }
.docs-meta { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 3px 12px; margin: 0; font-size: var(--fs-xs); }
.docs-meta dt { color: var(--fg-3); }
.docs-meta dd { margin: 0; color: var(--fg); overflow-wrap: anywhere; }
.docs-rel { display: flex; flex-direction: column; }
.docs-rel-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 6px; border: 0; border-top: 1px solid var(--line); background: none; color: var(--fg); text-align: left; cursor: pointer; font-size: var(--fs-sm); border-radius: 0; }
.docs-rel-item:first-child { border-top: 0; }
.docs-rel-item:hover { background: var(--surface-2); }
.docs-rel-name { flex: 1; min-width: 0; }
.docs-more { margin-top: 6px; border-top: 1px solid var(--line); }
.docs-more > summary { cursor: pointer; padding: 8px 6px 4px; font-size: var(--fs-xs); font-weight: 600; color: var(--fg-2); list-style-position: inside; }
.docs-more > summary:hover { color: var(--fg); }
.docs-ai-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 4px 14px; }
.docs-ai-item { border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.docs-cmp { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.docs-cmp > div { min-width: 0; border: 1px solid var(--line); border-radius: var(--r-md); padding: 8px 10px; font-size: var(--fs-sm); display: flex; flex-direction: column; gap: 4px; }
.docs-cmp > .is-new { border-color: var(--accent); }
.docs-hist td { vertical-align: middle; }
.docs-hist .docs-h-note { min-width: 160px; white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 680px) {
  .docs-hist, .docs-hist tbody { display: block; }
  .docs-hist thead { display: none; }
  .docs-hist tr { display: grid; grid-template-columns: auto auto minmax(0, 1fr); grid-template-areas: "rev status date" "by by by" "note note note" "act act act"; gap: 6px 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--line); }
  .docs-hist tr:last-child { border-bottom: 0; }
  .docs-hist td { display: block; padding: 0; border: 0; min-width: 0; }
  .docs-hist tbody tr:hover td { background: transparent; }
  .docs-hist .docs-h-rev { grid-area: rev; } .docs-hist .docs-h-status { grid-area: status; } .docs-hist .docs-h-date { grid-area: date; text-align: right; }
  .docs-hist .docs-h-by { grid-area: by; } .docs-hist .docs-h-note { grid-area: note; min-width: 0; } .docs-hist .docs-h-act { grid-area: act; }
  .docs-hist .docs-h-act .row { flex-wrap: wrap !important; }
}
.docs-tbl .table td { min-width: 92px; }
.docs-tbl .table td.num .cell-calc { white-space: nowrap !important; }
.docs-cmp.is-stack { grid-template-columns: minmax(0, 1fr); }
.docs-split { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.docs-split.is-below { grid-template-columns: minmax(0, 1fr); }
.docs-split.is-below > aside { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start; }
.docs-split.is-below > aside > .docs-panel-bar, .docs-split.is-below > aside > .docs-callout { grid-column: 1 / -1; }
.docs-panel-bar { display: flex; justify-content: flex-end; }
@media (max-width: 1100px) { .docs-split { grid-template-columns: minmax(0, 1fr); } .docs-panel-bar { display: none; } }
.docs-ai-prog { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); }
.docs-ai-prog li { display: flex; align-items: center; gap: 8px; color: var(--fg-3); }
.docs-ai-prog li.is-done { color: var(--fg); }
.docs-ai-prog li.is-done > .icon { color: var(--good); }
.docs-ai-prog li.is-now { color: var(--fg); font-weight: 600; }
.docs-ai-prog li.is-now > .icon { color: var(--accent); }
.docs-ai-why { font-size: var(--fs-xs); color: var(--fg-3); }
.docs-snap { display: flex; flex-direction: column; gap: 14px; }
@media (max-width: 680px) {
  .docs-cmp, .docs-io { grid-template-columns: minmax(0, 1fr); }
  .docs-actions .menu { position: fixed; left: 16px !important; right: 16px !important; top: auto !important; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); min-width: 0 !important; max-width: none; }
}
`;
  if (!document.getElementById('css-docs')) {
    const el = document.createElement('style');
    el.id = 'css-docs';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ------------------------------------------------------------------ catálogo base (respaldo si falta PM.KB) */
  const AREAS_FALLBACK = [
    { id: 'integracion', num: 4, name: 'Gestión de la Integración del Proyecto', short: 'Integración' },
    { id: 'alcance', num: 5, name: 'Gestión del Alcance del Proyecto', short: 'Alcance' },
    { id: 'cronograma', num: 6, name: 'Gestión del Cronograma del Proyecto', short: 'Cronograma' },
    { id: 'costos', num: 7, name: 'Gestión de los Costos del Proyecto', short: 'Costos' },
    { id: 'calidad', num: 8, name: 'Gestión de la Calidad del Proyecto', short: 'Calidad' },
    { id: 'recursos', num: 9, name: 'Gestión de los Recursos del Proyecto', short: 'Recursos' },
    { id: 'comunicaciones', num: 10, name: 'Gestión de las Comunicaciones del Proyecto', short: 'Comunicaciones' },
    { id: 'riesgos', num: 11, name: 'Gestión de los Riesgos del Proyecto', short: 'Riesgos' },
    { id: 'adquisiciones', num: 12, name: 'Gestión de las Adquisiciones del Proyecto', short: 'Adquisiciones' },
    { id: 'interesados', num: 13, name: 'Gestión de los Interesados del Proyecto', short: 'Interesados' },
  ];
  const GROUP_IDS = ['inicio', 'planificacion', 'ejecucion', 'monitoreo', 'cierre'];
  const GROUPS_FALLBACK = [
    { id: 'inicio', name: 'Inicio' }, { id: 'planificacion', name: 'Planificación' }, { id: 'ejecucion', name: 'Ejecución' },
    { id: 'monitoreo', name: 'Monitoreo y Control' }, { id: 'cierre', name: 'Cierre' },
  ];
  const KIND = {
    acta: ['Acta', 'Actas'], plan: ['Plan', 'Planes'], registro: ['Registro', 'Registros'], informe: ['Informe', 'Informes'],
    documento: ['Documento', 'Documentos'], formato: ['Formato', 'Formatos'],
  };
  const kindLabel = (k) => (KIND[k] ? KIND[k][0] : '');
  /* Documentos que integran líneas base: sus cambios después de aprobados pasan por 4.6. */
  const BASELINE_DOCS = new Set(['enunciado-alcance', 'plan-direccion']);
  /* Documentos aprobados que Claude lee para mantener coherencia. */
  const AI_CONTEXT_DOCS = ['acta-constitucion', 'enunciado-alcance'];
  /* Registros cuyas tablas leen otras vistas del gestor (SPEC §5): se advierte al eliminarlos. */
  const SHARED_DOCS = new Set(['registro-riesgos', 'registro-interesados', 'registro-cambios', 'registro-incidentes', 'registro-lecciones', 'entregables', 'mediciones-control-calidad', 'registro-supuestos']);

  /* ------------------------------------------------------------------ utilidades */
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const uniq = (arr) => [...new Set(arr)];
  const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codeKey = (c) => String(c || '').split('.').map((n) => String(parseInt(n, 10) || 0).padStart(3, '0')).join('.');
  const cmpCode = (a, b) => { const x = codeKey(a), y = codeKey(b); return x < y ? -1 : x > y ? 1 : 0; };
  const isEmptyVal = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
  const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s; };
  const humanize = (k) => { const s = String(k || '').replace(/([a-záéíóúñ])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').trim().toLowerCase(); return s ? s[0].toUpperCase() + s.slice(1) : ''; };
  const prettyId = (id) => humanize(String(id || '').split('--')[0]);
  const normOpt = (o) => (o !== null && typeof o === 'object' ? o : { value: o, label: String(o) });
  const localDate = (ts) => { const d = new Date(ts); if (!ts || isNaN(d)) return null; return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const fileSafe = (s) => String(s || 'documento').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'documento';
  const groupColor = (gid) => 'var(--g-' + gid + ', var(--fg-3))';
  /* Marca de tiempo para CSV: dd/mm/aaaa hh:mm (hora local), mismo estilo de fecha que dd/mm/aaaa. */
  const csvStamp = (ts) => { const iso = localDate(ts); if (!iso) return ''; const d = new Date(ts); return PM.fmt.date(iso, 'short') + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };

  /* ------------------------------------------------------------------ base de conocimiento (tolerante a ausencias) */
  const kbReady = () => (PM.KB && Array.isArray(PM.KB.processes) && PM.KB.processes.length ? PM.KB : null);
  const areasList = () => {
    const src = PM.KB && Array.isArray(PM.KB.areas) && PM.KB.areas.length ? PM.KB.areas : AREAS_FALLBACK;
    return [...src].sort((a, b) => (Number(a.num) || 99) - (Number(b.num) || 99));
  };
  const groupsList = () => {
    const src = PM.KB && Array.isArray(PM.KB.groups) && PM.KB.groups.length ? PM.KB.groups : GROUPS_FALLBACK;
    return [...src].sort((a, b) => (GROUP_IDS.indexOf(a.id) + 1 || 99) - (GROUP_IDS.indexOf(b.id) + 1 || 99));
  };
  const areaOf = (id) => areasList().find((a) => a.id === id) || AREAS_FALLBACK.find((a) => a.id === id) || null;
  const groupOf = (id) => groupsList().find((g) => g.id === id) || GROUPS_FALLBACK.find((g) => g.id === id) || null;
  const areaNum = (id) => { const a = areaOf(id); return a ? Number(a.num) || 99 : 99; };
  const areaShort = (a) => (a ? a.short || String(a.name || '').replace(/^Gestión de (la |los |las |el )?/i, '').replace(/ del Proyecto$/i, '') : '');
  function processOf(code) {
    const K = PM.KB; if (!K || !code) return null;
    if (typeof K.process === 'function') { try { const p = K.process(code); if (p) return p; } catch (e) { /* respaldo abajo */ } }
    return (K.processes || []).find((p) => p && p.code === code) || null;
  }
  function processesForDoc(docId) {
    const K = PM.KB; if (!K) return [];
    if (typeof K.processesForDoc === 'function') { try { const r = K.processesForDoc(docId, 'produces'); if (Array.isArray(r)) return r.filter((p) => p && (p.outputs || []).some((o) => o && o.doc === docId)); } catch (e) { /* respaldo abajo */ } }
    return (K.processes || []).filter((p) => p && (p.outputs || []).some((o) => o && o.doc === docId));
  }
  const docOutputs = (p) => uniq(((p && p.outputs) || []).filter((o) => o && o.doc).map((o) => o.doc));
  /* Documentos que miden el avance de un proceso: los que el proceso crea (no los que solo actualiza),
     sin contar los que dependen de eventos (una solicitud de cambio puede no ocurrir nunca). */
  const EVENT_DOCS = new Set(['solicitud-cambio']);
  const trackedDocs = (p) => uniq(((p && p.outputs) || []).filter((o) => o && o.doc && !o.update && !EVENT_DOCS.has(o.doc)).map((o) => o.doc));
  /* Procesos de una plantilla separados en los que crean el documento y los que solo lo actualizan. */
  function templateProcessRoles(t) {
    const create = [], update = [];
    const add = (arr, c) => { c = c ? String(c) : ''; if (c && !arr.includes(c)) arr.push(c); };
    if (t && t.process) add(create, t.process);
    for (const p of processesForDoc(t && t.id)) {
      const outs = (p.outputs || []).filter((o) => o && o.doc === t.id);
      if (outs.some((o) => !o.update)) add(create, p.code);
    }
    for (const c of (t && Array.isArray(t.processes) ? t.processes : [])) if (!create.includes(String(c))) add(update, c);
    for (const p of processesForDoc(t && t.id)) if (!create.includes(p.code)) add(update, p.code);
    return { create: create.sort(cmpCode), update: update.sort(cmpCode) };
  }
  function docName(id) {
    if (PM.templates[id]) return PM.templates[id].name;
    const K = PM.KB;
    if (K && typeof K.doc === 'function') { try { const d = K.doc(id); if (d && d.name) return d.name; } catch (e) { /* nombre deducido */ } }
    return prettyId(id);
  }
  const ioText = (x) => (typeof x === 'string' ? x : !x ? '' : x.doc ? docName(x.doc) : x.label || x.text || x.name || x.view || x.baseline || '');

  /* ------------------------------------------------------------------ estado y códigos de documentos */
  const STATUS_ORDER = ['aprobado', 'revision', 'borrador', 'obsoleto'];
  const statusOf = (d) => (d && d.status) || 'borrador';
  const aggStatus = (insts) => { if (!insts || !insts.length) return 'sin'; const s = new Set(insts.map(statusOf)); return STATUS_ORDER.find((id) => s.has(id)) || 'borrador'; };
  function StatusChip({ status }) {
    const s = PM.docStatus(status);
    return html`<${ui.Chip} tone=${status === 'sin' ? null : s.tone} class=${status === 'sin' ? 'docs-chip-sin' : ''}>${s.label}</${ui.Chip}>`;
  }
  /* Consecutivo de instancias (plantillas múltiples): se respeta el guardado; si falta, orden de creación. */
  function seqMap(insts) {
    const list = [...(insts || [])].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)));
    const m = new Map(); let max = 0;
    for (const d of list) if (Number.isFinite(d.seq) && d.seq > 0) { m.set(d.id, d.seq); max = Math.max(max, d.seq); }
    for (const d of list) if (!m.has(d.id)) m.set(d.id, ++max);
    return m;
  }
  const sortedInstances = (insts) => { const m = seqMap(insts); return [...(insts || [])].sort((a, b) => m.get(a.id) - m.get(b.id)); };
  const nextSeq = (insts) => { let max = 0; for (const v of seqMap(insts).values()) max = Math.max(max, v); return max + 1; };
  function baseCode(project, tid) {
    const t = PM.templates[tid];
    const abbr = (t && t.abbr) || String(tid || 'DOC').split('-').map((s) => s[0] || '').join('').toUpperCase().slice(0, 4);
    return [project && project.code, abbr].filter(Boolean).join('-');
  }
  function docCode(project, tid, doc, insts) {
    const t = PM.templates[tid];
    const base = baseCode(project, tid);
    if (!(t && t.multiple) && !String((doc && doc.id) || '').includes('--')) return base;
    const n = doc && Number.isFinite(doc.seq) ? doc.seq : seqMap(insts).get(doc && doc.id) || nextSeq(insts);
    return base + '-' + pad2(n);
  }
  const templateOrder = (a, b) => (areaNum(a.area) - areaNum(b.area)) || ((GROUP_IDS.indexOf(a.group) + 1 || 9) - (GROUP_IDS.indexOf(b.group) + 1 || 9)) || cmpCode(a.process, b.process);

  /* ------------------------------------------------------------------ campos */
  const allFields = (t) => ((t && t.sections) || []).flatMap((s) => s.fields || []);
  const projectValue = (f, project) => { const v = PM.calc.fieldDefault(f, project); return v === undefined || v === null || v === '' ? undefined : v; };
  /* Campos con from:'project.x' sin valor guardado toman el dato de la ficha del proyecto. */
  function resolveFields(t, fields, project) {
    const out = { ...(fields || {}) };
    for (const f of allFields(t)) if (out[f.key] === undefined && f.from) { const v = projectValue(f, project); if (v !== undefined) out[f.key] = v; }
    return out;
  }
  const fieldKind = (f) => (f.type === 'table' ? 'table' : f.type === 'textarea' || f.type === 'list' ? 'long' : 'short');
  /* Agrupa los campos consecutivos del mismo tipo (corto, largo, tabla) para darles la rejilla que les conviene. */
  const fieldRuns = (fields) => {
    const runs = [];
    for (const f of fields || []) { const kind = fieldKind(f); const last = runs[runs.length - 1]; if (last && last.kind === kind) last.fields.push(f); else runs.push({ kind, fields: [f] }); }
    return runs;
  };
  function optionLabel(options, v) { const o = (options || []).map(normOpt).find((x) => String(x.value) === String(v)); return o ? o.label : String(v); }
  function fmtValue(f, v, currency) {
    if (v === undefined || v === null || v === '') return '';
    switch (f.type) {
      case 'money': return PM.fmt.money(v, currency);
      case 'number': return PM.fmt.num(v, 2);
      case 'pct': return PM.fmt.pct100(v, 1);
      case 'date': return PM.date.valid(v) ? PM.fmt.date(v, 'long') : String(v);
      case 'check': return v ? 'Sí' : 'No';
      case 'select': return optionLabel(f.options, v);
      case 'list': return Array.isArray(v) ? v.filter((x) => String(x).trim()).join('\n') : String(v);
      case 'table': return Array.isArray(v) ? v.length + (v.length === 1 ? ' fila' : ' filas') : '';
      default: return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
  }
  const safeCalc = (c, row, rows) => { try { return c.calc ? c.calc(row, rows) : row[c.key]; } catch (e) { return null; } };
  function cellStr(c, row, rows, currency) {
    const v = c.type === 'calc' ? safeCalc(c, row, rows) : row[c.key];
    if (typeof c.format === 'function') { try { const s = c.format(v, row); if (s !== null && s !== undefined) return String(s); } catch (e) { /* formato por tipo */ } }
    if (v === undefined || v === null || v === '') return '';
    if (c.type === 'date') return PM.date.valid(v) ? PM.fmt.date(v) : String(v);
    if (c.type === 'pct') return PM.fmt.pct100(v);
    if (c.type === 'calc') return typeof v === 'number' ? PM.fmt.num(v, 2) : String(v);
    return fmtValue(c, v, currency);
  }
  const isNumCol = (c) => c.type === 'number' || c.type === 'money' || c.type === 'pct' || c.type === 'calc';
  /* Plantilla deducida de los datos guardados cuando la plantilla original no está registrada. */
  function pseudoTemplate(tid, doc) {
    const data = (doc && doc.fields) || {};
    const fields = Object.keys(data).map((k) => {
      const v = data[k];
      if (Array.isArray(v) && v.length && v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
        const keys = [];
        const showId = v.some((r) => r.id && !/^r_/.test(String(r.id)));
        v.forEach((r) => Object.keys(r).forEach((c) => { if ((c !== 'id' || showId) && !keys.includes(c)) keys.push(c); }));
        return { key: k, label: humanize(k), type: 'table', columns: keys.map((c) => ({ key: c, label: humanize(c), type: v.some((r) => typeof r[c] === 'number') ? 'number' : 'text' })) };
      }
      if (Array.isArray(v)) return { key: k, label: humanize(k), type: 'list' };
      if (typeof v === 'number') return { key: k, label: humanize(k), type: 'number' };
      if (typeof v === 'boolean') return { key: k, label: humanize(k), type: 'check' };
      if (PM.date.valid(v)) return { key: k, label: humanize(k), type: 'date' };
      return { key: k, label: humanize(k), type: String(v ?? '').length > 80 || String(v ?? '').includes('\n') ? 'textarea' : 'text' };
    });
    return { id: tid, name: (doc && doc.title) || prettyId(tid), abbr: '', missing: true, purpose: '', tips: [], sections: [{ id: 'contenido', title: 'Contenido guardado', fields }] };
  }
  /* Siguiente código de fila para tablas con columna `id` (R-001, CC-001…). */
  const CODE_RE = /^([A-Za-zÁÉÍÓÚÑáéíóúñ]{1,8}[-_.]?)(\d{1,5})$/;
  function nextRowCode(rows, field, t) {
    const samples = [...(rows || []).map((r) => r && r.id), ...(((t && t.example && t.example[field.key]) || []).map((r) => r && r.id)), ((field.columns || []).find((c) => c.key === 'id') || {}).placeholder];
    let prefix = null, width = 3;
    for (const s of samples) { const m = typeof s === 'string' && CODE_RE.exec(s.trim()); if (m) { prefix = m[1]; width = m[2].length; break; } }
    if (prefix === null) prefix = String(field.key || 'X').charAt(0).toUpperCase() + '-';
    let max = 0;
    const used = new Set((rows || []).map((r) => r && r.id));
    for (const r of rows || []) { const m = r && typeof r.id === 'string' && CODE_RE.exec(r.id.trim()); if (m && m[1] === prefix) max = Math.max(max, parseInt(m[2], 10)); }
    let n = max + 1, code;
    do { code = prefix + String(n).padStart(width, '0'); n++; } while (used.has(code));
    return code;
  }
  const hasIdColumn = (f) => (f.columns || []).some((c) => c.key === 'id' && c.type !== 'calc');
  function makeNewRow(f, t) {
    return (rows) => {
      const base = {};
      for (const c of f.columns || []) if (c.default !== undefined && c.type !== 'calc') base[c.key] = PM.clone(c.default);
      if (hasIdColumn(f)) base.id = nextRowCode(rows, f, t);
      return base;
    };
  }
  function withIds(rows, existing, f, t) {
    const acc = [...(existing || [])]; const out = [];
    for (const r of rows || []) {
      let id = r.id;
      if (hasIdColumn(f)) { if (!id || typeof id !== 'string' || acc.some((x) => x && x.id === id)) id = nextRowCode(acc, f, t); }
      else id = PM.uid('r');
      const row = { ...r, id }; out.push(row); acc.push(row);
    }
    return out;
  }

  /* ------------------------------------------------------------------ medidor segmentado (aprobado / en elaboración) */
  function progressOf(docIds, idx) {
    let done = 0, prog = 0;
    for (const d of docIds) { const s = aggStatus(idx.byTemplate[d]); if (s === 'aprobado') done++; else if (s === 'borrador' || s === 'revision') prog++; }
    return { total: docIds.length, done, prog };
  }
  /* Avance de un conjunto de plantillas (misma base que el tablero y la lista maestra: una plantilla cuenta
     como aprobada si alguno de sus documentos lo está). */
  function templateProgress(tpls, idx) {
    const r = progressOf((tpls || []).map((t) => t.id), idx);
    let none = 0; for (const t of tpls || []) if (!(idx.byTemplate[t.id] || []).length) none++;
    return { ...r, none };
  }
  function SegMeter({ done, prog, total, label }) {
    const pd = total ? (done / total) * 100 : 0, pp = total ? (prog / total) * 100 : 0;
    return html`<span class="docs-seg" role="meter" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${done} aria-label=${label}><span class="docs-seg-done" style=${'width:' + pd + '%'}></span><span class="docs-seg-prog" style=${'width:' + pp + '%'}></span></span>`;
  }
  const Legend = () => html`<div class="legend" aria-hidden="true">
    <span class="legend-item"><span class="docs-sw" style="background:var(--good)"></span>Documentos aprobados</span>
    <span class="legend-item"><span class="docs-sw" style="background:var(--accent)"></span>En elaboración (borrador o en revisión)</span>
    <span class="legend-item"><span class="docs-sw docs-sw-none"></span>Sin iniciar</span>
  </div>`;

  function useWidth(ref) {
    const [w, setW] = useState(0);
    useLayoutEffect(() => {
      const el = ref.current; if (!el) return undefined;
      setW(el.clientWidth);
      let raf = 0;
      const measure = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setW(el.clientWidth)); };
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); }; }
      const ro = new ResizeObserver(measure); ro.observe(el);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);
    return w;
  }

  /* ------------------------------------------------------------------ navegación pública */
  PM.openDocument = (ref) => {
    if (!ref) return PM.navigate('documentos');
    const s = String(ref);
    if (s.includes('--')) return PM.navigate('documento', { docId: s });
    const t = PM.templates[s];
    if (t && t.multiple) return PM.navigate('documento', { template: s });
    return PM.navigate('documento', { docId: s });
  };

  /* ==================================================================== MAPA DE PROCESOS */
  function ProcessCard({ p, idx, state, onOpen }) {
    const pr = progressOf(trackedDocs(p), idx);
    const outs = (p.outputs || []).filter(Boolean);
    const views = outs.filter((o) => o.view || o.baseline);
    const other = views.length ? 'Salidas en herramientas' : outs.some((o) => o.doc && o.update) ? 'Actualiza documentos existentes' : outs.some((o) => o.doc) ? 'Genera solicitudes de cambio' : 'Sin documentos propios';
    const label = p.code + ' ' + p.name + (pr.total ? '. ' + pr.done + ' de ' + pr.total + ' documentos aprobados' : '');
    return html`<button type="button" class=${cx('docs-proc', state === 'dim' && 'is-dim', state === 'hit' && 'is-hit')} style=${'--gc:' + groupColor(p.group)} data-code=${p.code} aria-label=${label} onClick=${() => onOpen(p.code)}>
      <span class="docs-code">${p.code}</span>
      <span class="docs-proc-name">${p.name}</span>
      ${pr.total
        ? html`<span class="docs-proc-meta"><${SegMeter} ...${pr} label=${'Documentos de ' + p.code} /><span class="mono">${pr.done}/${pr.total}</span></span>`
        : html`<span class="docs-proc-meta">${views.length ? html`<${ui.Icon} name="process" size=${12} />` : null}${other}</span>`}
    </button>`;
  }

  function openProcess(code) {
    PM.openModal((close) => html`<${ProcessDetail} code=${code} close=${close} />`);
  }

  function ProcessMapView({ project, params }) {
    const K = kbReady();
    const idx = PM.useProjectDocs();
    const hostRef = useRef();
    const width = useWidth(hostRef);
    const [q, setQ] = useState('');
    const groupParam = params && params.group && groupOf(params.group) ? params.group : '';
    const [hl, setHl] = useState(groupParam);
    useEffect(() => { if (groupParam) setHl(groupParam); }, [groupParam]);
    const [mode, setModeRaw] = useState(() => { const m = PM.prefs.get('docs.mapMode', null); return m === 'lista' || m === 'matriz' ? m : null; });
    const setMode = (m) => { setModeRaw(m); PM.prefs.set('docs.mapMode', m); };
    const [openAreas, setOpenAreas] = useState(() => new Set());
    useEffect(() => { if (K && params && params.process && processOf(params.process)) openProcess(params.process); }, []);
    const data = useMemo(() => {
      if (!K) return null;
      const A = areasList(); const G = groupsList();
      const procs = K.processes.filter((p) => p && p.code).slice().sort((a, b) => cmpCode(a.code, b.code));
      const cell = {};
      for (const p of procs) (cell[p.area + '|' + p.group] = cell[p.area + '|' + p.group] || []).push(p);
      const tpls = PM.templateList || [];
      const groupStats = G.map((g) => ({ g, count: procs.filter((p) => p.group === g.id).length, ...templateProgress(tpls.filter((t) => t.group === g.id), idx) }));
      const total = templateProgress(tpls, idx);
      return { A, G, procs, cell, groupStats, total, tpls };
    }, [K, idx]);

    const ql = norm(q.trim());
    const matches = (p) => !ql || norm([p.code, p.name, p.description, ...docOutputs(p).map(docName)].join(' ')).includes(ql);
    const stateOf = (p) => ((hl && p.group !== hl) || (ql && !matches(p)) ? 'dim' : ql ? 'hit' : '');
    const listMode = mode ? mode === 'lista' : width < 860;

    if (!data) {
      return html`<div class="page" ref=${hostRef}>
        <${ui.PageHeader} eyebrow="Guía del PMBOK® · 6.ª edición" title="Mapa de procesos" />
        <${ui.Empty} icon="map" title="La base de conocimiento del PMBOK no está disponible" actions=${html`<${ui.Button} variant="primary" icon="files" onClick=${() => PM.navigate('documentos')}>Ir a Documentos</${ui.Button}>`}>
          El mapa necesita el catálogo de los 49 procesos con sus entradas, herramientas y salidas, y no se cargó en esta versión del gestor. Mientras tanto puedes crear y emitir los documentos del proyecto desde la lista maestra.
        </${ui.Empty}>
      </div>`;
    }
    const { A, G, procs, cell, groupStats, total, tpls } = data;
    const open = (code) => openProcess(code);
    const toggleArea = (id) => setOpenAreas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const anyMatch = !ql || procs.some(matches);

    const matrix = html`<div class="docs-matrix-wrap"><div class="docs-matrix" role="table" aria-label="Procesos por área de conocimiento y grupo de procesos">
      <div class="docs-mrow docs-mrow-head" role="row">
        <div class="docs-mh" role="columnheader">Área de conocimiento</div>
        ${G.map((g) => html`<div key=${g.id} role="columnheader" data-group=${g.id} class=${cx('docs-mh', hl && hl !== g.id && 'docs-dim')}><span class="docs-sw" aria-hidden="true" style=${'background:' + groupColor(g.id)}></span>${g.name}</div>`)}
      </div>
      ${A.map((a) => html`<div class="docs-mrow" role="row" key=${a.id} data-area=${a.id}>
        <div class="docs-ma" role="rowheader" title=${a.name}><span class="docs-num">${a.num}</span><span class="docs-ma-name">${areaShort(a)}<span class="sr-only"> (${a.name})</span></span></div>
        ${G.map((g) => html`<div key=${g.id} class="docs-mc" role="cell">${(cell[a.id + '|' + g.id] || []).map((p) => html`<${ProcessCard} key=${p.code} p=${p} idx=${idx} state=${stateOf(p)} onOpen=${open} />`)}</div>`)}
      </div>`)}
    </div></div>`;

    const list = html`<div class="stack-sm" role="list" aria-label="Procesos por área de conocimiento">
      ${A.map((a) => {
        const ps = procs.filter((p) => p.area === a.id && (!hl || p.group === hl) && matches(p));
        if (!ps.length && (hl || ql)) return null;
        const isOpen = !!ql || openAreas.has(a.id);
        const pr = templateProgress(tpls.filter((t) => t.area === a.id && (!hl || t.group === hl)), idx);
        return html`<section class="docs-acc" key=${a.id} role="listitem" data-area=${a.id}>
          <button type="button" class="docs-acc-head" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => toggleArea(a.id)}>
            <span class="docs-num">${a.num}</span>
            <span class="docs-acc-title">${a.name}<span class="xsmall faint" style="font-weight:400">${ps.length} ${ps.length === 1 ? 'proceso' : 'procesos'} · ${pr.done}/${pr.total} documentos aprobados</span></span>
            <${ui.Icon} name=${isOpen ? 'chevron-up' : 'chevron-down'} size=${16} />
          </button>
          ${isOpen ? html`<div class="docs-acc-body">
            ${G.map((g) => { const gp = ps.filter((p) => p.group === g.id); if (!gp.length) return null; return html`<div class="stack-sm" key=${g.id}>
              <div class="docs-acc-glabel"><span class="docs-sw" style=${'background:' + groupColor(g.id)}></span>${g.name}</div>
              <div class="docs-acc-list">${gp.map((p) => html`<${ProcessCard} key=${p.code} p=${p} idx=${idx} state=${ql ? 'hit' : ''} onOpen=${open} />`)}</div>
            </div>`; })}
          </div>` : null}
        </section>`;
      })}
    </div>`;

    return html`<div class="page" ref=${hostRef}>
      <${ui.PageHeader} eyebrow=${'Guía del PMBOK® · ' + procs.length + ' procesos'} title="Mapa de procesos"
        description="Los procesos de dirección de proyectos por área de conocimiento y grupo de procesos. Abre un proceso para ver sus entradas, herramientas y técnicas y salidas, y para crear los documentos que produce."
        actions=${html`<${ui.Button} icon="files" onClick=${() => PM.navigate('documentos')}>Ver lista de documentos</${ui.Button}>`} />
      <div class="stack-sm">
        <div class="docs-strip" role="group" aria-label="Avance documental por grupo de procesos (selecciona uno para resaltarlo)">
          ${groupStats.map((s) => html`<button key=${s.g.id} type="button" class="docs-gbtn" data-group=${s.g.id} aria-pressed=${hl === s.g.id ? 'true' : 'false'} style=${'--gc:' + groupColor(s.g.id)} onClick=${() => setHl(hl === s.g.id ? '' : s.g.id)}>
            <span class="docs-gbtn-name"><span class="docs-sw" style="background:var(--gc)"></span>${s.g.name}</span>
            <span class="docs-gbtn-num">${s.total ? PM.fmt.pct(s.done / s.total) : '—'}</span>
            <${SegMeter} ...${s} label=${'Documentos aprobados en ' + s.g.name} />
            <span class="docs-gbtn-sub">${s.count} ${s.count === 1 ? 'proceso' : 'procesos'} · ${s.total ? s.done + '/' + s.total + ' documentos aprobados' : 'sin documentos propios'}</span>
          </button>`)}
        </div>
        <div class="row-between"><${Legend} /><span class="xsmall faint" data-total title="Cuenta todas las plantillas del proyecto, igual que el tablero y la lista de documentos. Los medidores de cada proceso cuentan solo los documentos que ese proceso crea.">Total: ${total.done} de ${total.total} documentos aprobados · ${total.prog} en elaboración · ${total.none} sin iniciar</span></div>
      </div>
      <div class="toolbar">
        <div style="flex:1 1 220px;min-width:0;max-width:380px"><${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar proceso, código o documento…" aria-label="Buscar procesos" /></div>
        ${hl ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => setHl('')}>Quitar resaltado de ${groupOf(hl) ? groupOf(hl).name : hl}</${ui.Button}>` : null}
        <div class="spacer"></div>
        <${ui.Segmented} label="Forma de ver el mapa" value=${listMode ? 'lista' : 'matriz'} onChange=${setMode} options=${[{ value: 'matriz', label: 'Matriz', icon: 'map' }, { value: 'lista', label: 'Lista', icon: 'checklist' }]} />
      </div>
      ${!anyMatch ? html`<${ui.Empty} icon="search" title="Ningún proceso coincide con la búsqueda" actions=${html`<${ui.Button} onClick=${() => setQ('')}>Limpiar búsqueda</${ui.Button}>`}>Prueba con el código (por ejemplo 6.5) o con parte del nombre del proceso o de un documento.</${ui.Empty}>` : listMode ? list : matrix}
    </div>`;
  }

  /* Detalle de un proceso: entradas, herramientas y técnicas, salidas con su estado. */
  function ProcessDetail({ code, close }) {
    const p = processOf(code);
    const idx = PM.useProjectDocs();
    const canWrite = PM.useCanWrite();
    if (!p) {
      return html`<${ui.Modal} title="Proceso no disponible" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
        <p>No se encontró el proceso ${code} en la base de conocimiento.</p>
      </${ui.Modal}>`;
    }
    const a = areaOf(p.area), g = groupOf(p.group);
    const pr = progressOf(trackedDocs(p), idx);
    const go = (fn) => () => { close(); fn(); };
    const inputs = (p.inputs || []).map(ioText).filter(Boolean);
    const tools = (p.tools || []).map(ioText).filter(Boolean);
    const inputDocs = uniq((p.inputsDocs || []).map((d) => (typeof d === 'string' ? d : d && d.doc)).filter(Boolean));
    const toolViews = uniq(p.toolViews || []).map((id) => PM.getView(id)).filter((v) => v && !v.hidden);
    const subtitle = html`<span class="docs-sub"><span class="docs-sw" style=${'background:' + groupColor(p.group)}></span><span>${(g ? g.name : p.group) + (a ? ' · ' + a.num + '. ' + a.name : '')}</span></span>`;
    return html`<${ui.Modal} size="wide" title=${p.code + ' ' + p.name} subtitle=${subtitle} onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
      ${p.description ? html`<p>${p.description}</p>` : null}
      ${pr.total ? html`<div class="row small muted" style="gap:10px"><div style="width:140px;display:flex"><${SegMeter} ...${pr} label="Avance de documentos del proceso" /></div>${pr.done} de ${pr.total} documentos aprobados${pr.prog ? ' · ' + pr.prog + ' en elaboración' : ''}</div>` : null}
      <div class="docs-io">
        <section><h3 class="h4 docs-io-h">Entradas</h3>
          ${inputs.length ? html`<ul>${inputs.map((x, i) => html`<li key=${i}>${x}</li>`)}</ul>` : html`<p class="small faint">Sin entradas registradas.</p>`}
          ${inputDocs.length ? html`<div class="stack-sm" style="margin-top:10px"><div class="label-caps">Documentos del proyecto que usa</div>
            ${inputDocs.map((d) => { const t = PM.templates[d]; const insts = sortedInstances(idx.byTemplate[d]);
              /* Plantillas múltiples: se listan sus documentos (el enlace a la plantilla abriría uno nuevo en blanco). */
              if (t && t.multiple) {
                return html`<div class="stack-sm" style="gap:4px" key=${d} data-input-doc=${d}>
                  <div class="docs-out-inst">
                    <span class="docs-out-iname">${t.name} <span class="xsmall faint">· ${insts.length ? insts.length + (insts.length === 1 ? ' documento' : ' documentos') : 'ninguno todavía'}</span></span>
                    ${insts.length ? null : html`<${StatusChip} status="sin" />`}
                    ${!insts.length && canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${go(() => PM.openDocument(d))} aria-label=${'Nuevo: ' + t.name}>Nuevo</${ui.Button}>` : null}
                  </div>
                  ${insts.length ? html`<div class="stack-sm" style="gap:4px;padding-left:16px">${insts.slice(-3).map((x) => html`<div class="docs-out-inst" key=${x.id}>
                    <span class="docs-out-iname"><button type="button" class="docs-link" data-open-doc=${x.id} onClick=${go(() => PM.openDocument(x.id))}>${x.title || t.name}</button></span>
                    <${StatusChip} status=${statusOf(x)} />${x.rev ? html`<span class="code-tag">Rev. ${x.rev}</span>` : null}
                  </div>`)}${insts.length > 3 ? html`<span class="xsmall faint">Y ${insts.length - 3} más en la lista de documentos.</span>` : null}</div>` : null}
                </div>`;
              }
              return html`<div class="docs-out-inst" key=${d} data-input-doc=${d}>
              <span class="docs-out-iname">${t ? html`<button type="button" class="docs-link" onClick=${go(() => PM.openDocument(d))}>${t.name}</button>` : docName(d)}</span>
              <${StatusChip} status=${aggStatus(insts)} />
            </div>`; })}
          </div>` : null}
        </section>
        <section><h3 class="h4 docs-io-h">Herramientas y técnicas</h3>
          ${tools.length ? html`<ul>${tools.map((x, i) => html`<li key=${i}>${x}</li>`)}</ul>` : html`<p class="small faint">Sin herramientas registradas.</p>`}
          ${toolViews.length ? html`<div class="stack-sm" style="margin-top:10px"><div class="label-caps">Herramientas de la aplicación</div><div class="row">
            ${toolViews.map((v) => html`<${ui.Button} key=${v.id} size="sm" icon=${v.icon} onClick=${go(() => PM.navigate(v.id))}>${v.label}</${ui.Button}>`)}
          </div></div>` : null}
        </section>
      </div>
      <section class="stack-sm"><h3 class="h4">Salidas</h3>
        ${(p.outputs || []).length ? html`<div class="docs-out">${(p.outputs || []).map((o, i) => html`<${OutputRow} key=${i} o=${o} idx=${idx} canWrite=${canWrite} go=${go} />`)}</div>` : html`<p class="small faint">Sin salidas registradas.</p>`}
      </section>
    </${ui.Modal}>`;
  }

  function OutputRow({ o, idx, canWrite, go }) {
    if (!o) return null;
    if (typeof o === 'string') return html`<div class="docs-out-row"><span class="docs-out-name"><${ui.Icon} name="file" size=${15} />${o}</span></div>`;
    if (o.doc) {
      const t = PM.templates[o.doc];
      const insts = sortedInstances(idx.byTemplate[o.doc]);
      const name = docName(o.doc);
      const nameNode = html`<span class="stack-sm" style="gap:0;min-width:0"><span>${name}</span>${o.label && norm(o.label) !== norm(name) ? html`<span class="xsmall faint">Salida de la Guía: ${o.label}</span>` : null}</span>`;
      const upd = o.update ? html`<${ui.Chip} tone="info" title="El proceso actualiza este documento, creado en otro proceso">Actualiza</${ui.Chip}>` : null;
      if (!t && !insts.length) {
        return html`<div class="docs-out-row" data-doc=${o.doc}><span class="docs-out-name"><${ui.Icon} name="file" size=${15} />${nameNode}</span>${upd}<span class="xsmall faint">Plantilla no disponible</span></div>`;
      }
      if (t && t.multiple) {
        return html`<div class="docs-out-row" data-doc=${o.doc}>
          <span class="docs-out-name"><${ui.Icon} name="files" size=${15} />${nameNode}</span>${upd}
          ${insts.length ? html`<span class="xsmall faint">${insts.length} ${insts.length === 1 ? 'documento' : 'documentos'}</span>` : html`<${StatusChip} status="sin" />`}
          ${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${go(() => PM.openDocument(o.doc))}>Nuevo</${ui.Button}>` : !insts.length ? html`<${ui.Button} size="sm" icon="eye" onClick=${go(() => PM.openDocument(o.doc))}>Ver plantilla</${ui.Button}>` : null}
          ${insts.length ? html`<div class="docs-out-sub">${insts.slice(-6).map((d) => html`<div class="docs-out-inst" key=${d.id}>
            <button type="button" class="docs-link" onClick=${go(() => PM.openDocument(d.id))}>${d.title || name}</button>
            <${StatusChip} status=${statusOf(d)} />${d.rev ? html`<span class="code-tag">Rev. ${d.rev}</span>` : null}
          </div>`)}${insts.length > 6 ? html`<span class="xsmall faint">Y ${insts.length - 6} más en la lista de documentos.</span>` : null}</div>` : null}
        </div>`;
      }
      const d = insts.find((x) => x.id === o.doc) || insts[0] || null;
      return html`<div class="docs-out-row" data-doc=${o.doc}>
        <span class="docs-out-name"><${ui.Icon} name="file" size=${15} />${nameNode}</span>${upd}
        <${StatusChip} status=${d ? statusOf(d) : 'sin'} />${d && d.rev ? html`<span class="code-tag">Rev. ${d.rev}</span>` : null}
        <${ui.Button} size="sm" icon=${d ? 'file' : canWrite ? 'plus' : 'eye'} onClick=${go(() => PM.openDocument(d ? d.id : o.doc))}>${d ? 'Abrir' : canWrite ? 'Crear' : 'Ver plantilla'}</${ui.Button}>
      </div>`;
    }
    if (o.view) {
      const v = PM.getView(o.view);
      return html`<div class="docs-out-row"><span class="docs-out-name"><${ui.Icon} name=${v ? v.icon : 'process'} size=${15} />${o.label || (v ? v.label : o.view)}</span>
        <${ui.Chip}>Herramienta</${ui.Chip}>
        ${v ? html`<${ui.Button} size="sm" icon="arrow-right" onClick=${go(() => PM.navigate(o.view))}>Abrir herramienta</${ui.Button}>` : null}
      </div>`;
    }
    if (o.baseline) {
      const v = PM.getView('lineas-base');
      return html`<div class="docs-out-row"><span class="docs-out-name"><${ui.Icon} name="layers" size=${15} />${o.label || 'Línea base'}</span>
        <${ui.Chip} tone="signal">Línea base</${ui.Chip}>
        ${v ? html`<${ui.Button} size="sm" icon="arrow-right" onClick=${go(() => PM.navigate('lineas-base'))}>Ver líneas base</${ui.Button}>` : null}
      </div>`;
    }
    return html`<div class="docs-out-row"><span class="docs-out-name"><${ui.Icon} name="file" size=${15} />${ioText(o)}</span></div>`;
  }

  /* ==================================================================== LISTA MAESTRA */
  function buildEntries(project, idx) {
    const out = [];
    const known = new Set();
    const tpls = PM.templateList.map((t, i) => ({ t, i })).sort((x, y) => templateOrder(x.t, y.t) || x.i - y.i).map((x) => x.t);
    for (const t of tpls) {
      known.add(t.id);
      const insts = sortedInstances(idx.byTemplate[t.id]);
      const base = { tid: t.id, t, area: t.area, group: t.group, kind: t.kind, process: t.process || '' };
      if (!t.multiple) {
        const doc = insts.find((d) => d.id === t.id) || insts[0] || null;
        out.push({ ...base, type: 'single', key: t.id, doc, status: doc ? statusOf(doc) : 'sin', code: baseCode(project, t.id), name: t.name });
      } else {
        const sm = seqMap(insts);
        out.push({ ...base, type: 'parent', key: 'p:' + t.id, doc: null, status: insts.length ? aggStatus(insts) : 'sin', code: baseCode(project, t.id), name: t.name, count: insts.length });
        for (const d of insts) out.push({ ...base, type: 'instance', key: d.id, parent: t.id, doc: d, status: statusOf(d), code: baseCode(project, t.id) + '-' + pad2(sm.get(d.id)), name: d.title || t.name });
      }
    }
    for (const d of idx.list) {
      if (known.has(d.template)) continue;
      out.push({ tid: d.template, t: null, area: 'otros', group: '', kind: '', process: '', type: 'orphan', key: d.id, doc: d, status: statusOf(d), code: docCode(project, d.template, d, idx.byTemplate[d.template]), name: d.title || prettyId(d.template) });
    }
    return out;
  }
  const countable = (e) => e.type !== 'parent' || !e.count;

  function DocRow({ e, canWrite }) {
    const openIt = () => PM.openDocument(e.type === 'parent' ? e.tid : e.doc ? e.doc.id : e.tid);
    if (e.type === 'parent') {
      return html`<tr class="docs-parent" data-tid=${e.tid}>
        <td class="docs-c-code mono xsmall">${e.code}-NN</td>
        <td class="docs-c-name"><div class="stack-sm" style="gap:0"><span style="font-weight:600">${e.name}</span><span class="xsmall faint">${kindLabel(e.kind)}${kindLabel(e.kind) ? ' · ' : ''}${e.count ? e.count + (e.count === 1 ? ' documento' : ' documentos') : 'Admite varios documentos por proyecto'}</span></div></td>
        <td class="docs-c-proc mono xsmall">${e.process}</td>
        <td class="docs-c-status">${e.count ? null : html`<${StatusChip} status="sin" />`}</td>
        <td class="docs-c-rev"></td><td class="docs-c-upd"></td>
        <td class="docs-act">${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${openIt} aria-label=${'Nuevo: ' + e.name}>Nuevo</${ui.Button}>` : e.count ? null : html`<${ui.Button} size="sm" icon="eye" onClick=${openIt}>Ver plantilla</${ui.Button}>`}</td>
      </tr>`;
    }
    const d = e.doc;
    const btn = d ? 'Abrir' : canWrite ? 'Crear' : 'Ver plantilla';
    return html`<tr class=${e.type === 'instance' ? 'docs-inst' : ''} data-doc=${e.key}>
      <td class="docs-c-code mono xsmall">${e.code}</td>
      <td class="docs-c-name"><div class="stack-sm" style="gap:0"><button type="button" class="docs-link" onClick=${openIt}>${e.name}</button>${e.type !== 'instance' && kindLabel(e.kind) ? html`<span class="xsmall faint">${kindLabel(e.kind)}</span>` : e.type === 'orphan' ? html`<span class="xsmall faint">Plantilla no disponible</span>` : null}</div></td>
      <td class="docs-c-proc mono xsmall">${e.process}</td>
      <td class="docs-c-status"><${StatusChip} status=${e.status} /></td>
      <td class="docs-c-rev mono">${d && d.rev ? html`<span class="docs-m-only">Rev. </span>${d.rev}` : html`<span class="faint">—</span>`}</td>
      <td class="docs-c-upd xsmall faint">${d ? PM.fmt.datetime(d.updatedAt) : '—'}</td>
      <td class="docs-act"><${ui.Button} size="sm" icon=${!d ? (canWrite ? 'plus' : 'eye') : 'file'} onClick=${openIt} aria-label=${btn + ': ' + e.name}>${btn}</${ui.Button}></td>
    </tr>`;
  }

  function DocumentsView({ project, params }) {
    const idx = PM.useProjectDocs();
    const canWrite = PM.useCanWrite();
    const [q, setQ] = useState('');
    const [area, setArea] = useState((params && params.area) || '');
    const [grp, setGrp] = useState('');
    const [estado, setEstado] = useState((params && params.status) || '');
    const [kind, setKind] = useState('');
    const entries = useMemo(() => buildEntries(project, idx), [project, idx]);
    const counts = useMemo(() => {
      const c = { total: 0, aprobado: 0, revision: 0, borrador: 0, sin: 0, obsoleto: 0 };
      for (const e of entries) if (countable(e)) { c.total++; c[e.status] = (c[e.status] || 0) + 1; }
      return c;
    }, [entries]);
    const A = areasList();
    const G = groupsList();

    if (idx.loading) return html`<div class="page"><${ui.PageHeader} eyebrow="Proyecto" title="Documentos" /><${ui.Loading} rows=${6} /></div>`;
    if (!entries.length) {
      return html`<div class="page">
        <${ui.PageHeader} eyebrow="Lista maestra" title="Documentos" />
        <${ui.Empty} icon="files" title="No hay plantillas de documentos disponibles" actions=${kbReady() ? html`<${ui.Button} icon="map" onClick=${() => PM.navigate('procesos')}>Ir al mapa de procesos</${ui.Button}>` : null}>
          Las plantillas del PMBOK (acta de constitución, planes, registros, informes…) no se cargaron en esta versión del gestor. Cuando estén disponibles, aquí aparecerá la lista maestra con el estado y la revisión de cada documento.
        </${ui.Empty}>
      </div>`;
    }

    const ql = norm(q.trim());
    const matchT = (e) => (!area || e.area === area) && (!grp || e.group === grp) && (!kind || e.kind === kind);
    const matchQ = (e) => !ql || norm([e.code, e.name, e.t && e.t.name, e.t && e.t.abbr, e.process].join(' ')).includes(ql);
    const matchS = (e) => !estado || e.status === estado;
    const visible = [];
    for (const e of entries) {
      if (e.type === 'instance' || !matchT(e)) continue;
      if (e.type === 'parent') {
        const insts = entries.filter((x) => x.type === 'instance' && x.parent === e.tid);
        const pq = matchQ(e);
        const vis = insts.filter((x) => (pq || matchQ(x)) && matchS(x));
        const ok = (pq || vis.length) && (!estado || vis.length || (estado === 'sin' && !insts.length));
        if (ok) visible.push(e, ...vis);
      } else if (matchQ(e) && matchS(e)) visible.push(e);
    }
    const byArea = PM.groupBy(visible, (e) => e.area || 'otros');
    const areaBlocks = [...A.map((a) => ({ id: a.id, num: a.num, name: a.name })), { id: 'otros', num: '—', name: 'Documentos sin plantilla disponible' }].filter((a) => byArea[a.id]);
    const filtered = !!(ql || area || grp || estado || kind);
    const shownCount = visible.filter(countable).length;
    const clear = () => { setQ(''); setArea(''); setGrp(''); setEstado(''); setKind(''); };

    const exportCsv = () => {
      const rows = entries.filter(countable).map((e) => {
        const d = e.doc; const a = areaOf(e.area); const g = groupOf(e.group); const tb = (d && d.titleBlock) || {};
        return {
          code: e.type === 'parent' ? e.code + '-NN' : e.code, name: e.name, template: e.t ? e.t.name : '', area: a ? a.num + '. ' + a.name : '', group: g ? g.name : '',
          process: e.process, kind: kindLabel(e.kind), status: PM.docStatus(e.status).label, rev: (d && d.rev) || '', updated: d ? csvStamp(d.updatedAt) : '',
          approved: PM.date.valid(tb.fechaAprobacion) ? PM.fmt.date(tb.fechaAprobacion, 'short') : '', elaboro: tb.elaboro || '', reviso: tb.reviso || '', aprobo: tb.aprobo || '',
        };
      });
      const cols = [
        { key: 'code', label: 'Código' }, { key: 'name', label: 'Documento' }, { key: 'template', label: 'Plantilla' }, { key: 'area', label: 'Área de conocimiento' },
        { key: 'group', label: 'Grupo de procesos' }, { key: 'process', label: 'Proceso' }, { key: 'kind', label: 'Tipo' }, { key: 'status', label: 'Estado' },
        { key: 'rev', label: 'Revisión' }, { key: 'updated', label: 'Actualizado' }, { key: 'approved', label: 'Fecha de aprobación' },
        { key: 'elaboro', label: 'Elaboró' }, { key: 'reviso', label: 'Revisó' }, { key: 'aprobo', label: 'Aprobó' },
      ];
      const name = (project.code ? fileSafe(project.code) : PM.slug(project.name) || 'proyecto') + '_lista-maestra.csv';
      PM.download(name, PM.toCSV(cols, rows));
    };

    const statusOpts = [{ value: 'sin', label: 'Sin iniciar' }, ...PM.DOC_STATUS.map((s) => ({ value: s.id, label: s.label }))];
    const approvedPct = counts.total ? counts.aprobado / counts.total : 0;
    return html`<div class="page">
      <${ui.PageHeader} eyebrow="Lista maestra de documentos" title="Documentos"
        description="Todos los documentos del proyecto según la Guía del PMBOK®, con su código, estado y revisión vigente. Abre uno para editarlo, emitirlo o consultar su historial."
        actions=${html`<${ui.Button} icon="map" onClick=${() => PM.navigate('procesos')}>Mapa de procesos</${ui.Button}><${ui.Button} icon="download" onClick=${exportCsv}>Exportar lista (CSV)</${ui.Button}>`} />
      <div class="card">
        <div class="docs-stats">
          <${ui.Stat} label="Documentos" value=${counts.total} sub=${counts.obsoleto ? counts.obsoleto + (counts.obsoleto === 1 ? ' obsoleto' : ' obsoletos') : PM.templateList.length + ' plantillas'} />
          <${ui.Stat} label="Aprobados" value=${counts.aprobado} tone=${counts.aprobado ? 'good' : undefined} sub=${PM.fmt.pct(approvedPct) + ' del total'} />
          <${ui.Stat} label="En revisión" value=${counts.revision} />
          <${ui.Stat} label="Borradores" value=${counts.borrador} />
          <${ui.Stat} label="Sin iniciar" value=${counts.sin} />
        </div>
        <div class="docs-stats-foot"><div style="flex:1;max-width:420px;display:flex"><${SegMeter} total=${counts.total} done=${counts.aprobado} prog=${counts.borrador + counts.revision} label="Avance documental del proyecto" /></div><span>Avance documental</span></div>
      </div>
      <div class="docs-filters">
        <${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar por nombre, código o proceso…" aria-label="Buscar documentos" />
        <${ui.Select} value=${area} onValue=${setArea} placeholder="Todas las áreas" aria-label="Filtrar por área de conocimiento" options=${A.map((a) => ({ value: a.id, label: a.num + '. ' + areaShort(a) }))} />
        <${ui.Select} value=${grp} onValue=${setGrp} placeholder="Todos los grupos" aria-label="Filtrar por grupo de procesos" options=${G.map((g) => ({ value: g.id, label: g.name }))} />
        <${ui.Select} value=${estado} onValue=${setEstado} placeholder="Todos los estados" aria-label="Filtrar por estado" options=${statusOpts} />
        <${ui.Select} value=${kind} onValue=${setKind} placeholder="Todos los tipos" aria-label="Filtrar por tipo de documento" options=${Object.keys(KIND).map((k) => ({ value: k, label: KIND[k][1] }))} />
      </div>
      ${filtered ? html`<div class="row small muted"><span>${shownCount} de ${counts.total} documentos</span><${ui.Button} size="sm" variant="ghost" icon="x" onClick=${clear}>Limpiar filtros</${ui.Button}></div>` : null}
      ${!areaBlocks.length ? html`<${ui.Empty} icon="filter" title="Ningún documento coincide con los filtros" actions=${html`<${ui.Button} onClick=${clear}>Limpiar filtros</${ui.Button}>`}>Cambia la búsqueda o quita alguno de los filtros de área, grupo, estado o tipo.</${ui.Empty}>` : null}
      ${areaBlocks.map((a) => {
        const rows = byArea[a.id];
        const n = rows.filter(countable).length;
        const ap = rows.filter((e) => countable(e) && e.status === 'aprobado').length;
        return html`<section class="card" key=${a.id} data-area=${a.id}>
          <div class="card-head"><h2 class="h3"><span class="docs-sec-n">${a.num}</span>${a.name}</h2><span class="xsmall faint">${n} ${n === 1 ? 'documento' : 'documentos'} · ${ap} ${ap === 1 ? 'aprobado' : 'aprobados'}</span></div>
          <div class="table-wrap docs-tablewrap"><table class="table docs-table">
            <colgroup><col style="width:190px" /><col /><col style="width:74px" /><col style="width:122px" /><col style="width:62px" /><col style="width:148px" /><col style="width:132px" /></colgroup>
            <thead><tr><th>Código</th><th>Documento</th><th>Proceso</th><th>Estado</th><th>Rev.</th><th>Actualizado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>${rows.map((e) => html`<${DocRow} key=${e.key} e=${e} canWrite=${canWrite} />`)}</tbody>
          </table></div>
        </section>`;
      })}
    </div>`;
  }

  /* ==================================================================== EDITOR */
  let aiDenied = false;

  function ListEditor({ id, value, onChange, label, placeholder }) {
    const items = Array.isArray(value) ? value : isEmptyVal(value) ? [] : [String(value)];
    const refs = useRef([]);
    const focusNext = useRef(null);
    useLayoutEffect(() => { if (focusNext.current === null) return; const el = refs.current[focusNext.current]; focusNext.current = null; if (el) el.focus(); });
    const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
    const add = (at) => { const next = [...items]; next.splice(at, 0, ''); focusNext.current = at; onChange(next); };
    const del = (i) => { focusNext.current = i > 0 ? i - 1 : null; onChange(items.filter((_, j) => j !== i)); };
    const move = (i, d) => onChange(PM.moveItem(items, i, i + d));
    return html`<div class="docs-list" id=${id} role="group" aria-label=${label}>
      ${items.length === 0 ? html`<div class="xsmall faint">Sin elementos todavía.</div>` : null}
      ${items.map((x, i) => html`<div class="docs-list-row" key=${i}>
        <span class="docs-list-n" aria-hidden="true">${i + 1}.</span>
        <${ListItemInput} inputRef=${(el) => { refs.current[i] = el; }} value=${x} placeholder=${placeholder} label=${label + ' — elemento ' + (i + 1)}
          onValue=${(v) => set(i, v)} onEnter=${() => add(i + 1)} onEmptyBackspace=${() => del(i)} />
        <${ui.IconButton} size="sm" icon="chevron-up" label=${'Subir elemento ' + (i + 1)} disabled=${i === 0} onClick=${() => move(i, -1)} />
        <${ui.IconButton} size="sm" icon="chevron-down" label=${'Bajar elemento ' + (i + 1)} disabled=${i === items.length - 1} onClick=${() => move(i, 1)} />
        <${ui.IconButton} size="sm" icon="trash" label=${'Quitar elemento ' + (i + 1)} onClick=${() => del(i)} />
      </div>`)}
      <div><${ui.Button} size="sm" icon="plus" onClick=${() => add(items.length)}>Agregar elemento</${ui.Button}></div>
    </div>`;
  }

  /* Elemento de lista: área de texto de una línea que crece con el contenido; Enter agrega el siguiente. */
  function ListItemInput({ value, onValue, onEnter, onEmptyBackspace, inputRef, label, placeholder }) {
    const ref = useRef(null);
    useLayoutEffect(() => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 320) + 'px'; }, [value]);
    return html`<textarea class="input docs-list-ta" rows="1" ref=${(el) => { ref.current = el; inputRef(el); }} value=${value ?? ''} placeholder=${placeholder} aria-label=${label}
      onInput=${(e) => onValue(e.currentTarget.value.replace(/\r?\n/g, ' '))}
      onKeyDown=${(e) => { if (e.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); onEnter(); } else if (e.key === 'Backspace' && e.currentTarget.value === '') { e.preventDefault(); onEmptyBackspace(); } }}></textarea>`;
  }

  /* Campo de texto corto en edición: área de texto de una línea que crece con el contenido (Enter no agrega saltos de línea).
     En la rejilla de campos cortos la columna es angosta: así un valor largo se ve completo, partido como en lectura.
     Un solo observador recalcula el alto cuando cambia el ancho (riel plegado, ventana), fuera del ciclo del observador. */
  const lineWidths = new WeakMap();
  let lineRO = null;
  function watchLineWidth(el) {
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    if (!lineRO) {
      lineRO = new ResizeObserver((entries) => {
        const changed = [];
        for (const e of entries) { const w = Math.round(e.contentRect.width); if (lineWidths.get(e.target) !== w) { lineWidths.set(e.target, w); changed.push(e.target); } }
        if (changed.length) requestAnimationFrame(() => changed.forEach((x) => PM.autoSize(x, 640)));
      });
    }
    lineRO.observe(el);
    return () => { lineRO.unobserve(el); lineWidths.delete(el); };
  }
  function TextLineInput({ id, value, placeholder, onValue }) {
    const ref = useRef(null);
    useLayoutEffect(() => { PM.autoSize(ref.current, 640); }, [value]);
    useEffect(() => watchLineWidth(ref.current), []);
    return html`<textarea ref=${ref} id=${id} rows="1" class="input docs-line" value=${value ?? ''} placeholder=${placeholder}
      onInput=${(e) => onValue(e.currentTarget.value.replace(/\r?\n/g, ' '))}
      onKeyDown=${(e) => { if (e.key === 'Enter' && !e.isComposing) e.preventDefault(); }}></textarea>`;
  }

  const sameValue = (a, b) => String(a ?? '') === String(b ?? '');

  function FieldEditor({ f, value, onField, currency, project, t }) {
    const id = 'docs-f-' + f.key;
    const set = (v) => onField(f.key, v);
    const pv = f.from ? projectValue(f, project) : undefined;
    let hint = f.hint || null;
    if (pv !== undefined) {
      hint = html`<span class="docs-hint">${f.hint ? html`<span>${f.hint}</span>` : null}${sameValue(value, pv)
        ? html`<span class="docs-from"><${ui.Icon} name="link" size=${12} />Tomado de la ficha del proyecto</span>`
        : html`<button type="button" class="docs-from-btn" onClick=${() => set(pv)}><${ui.Icon} name="link" size=${12} />Usar dato de la ficha: ${clip(fmtValue(f, pv, currency), 48)}</button>`}</span>`;
    }
    let control;
    let labelFor = id;
    switch (f.type) {
      case 'textarea': control = html`<${ui.TextArea} id=${id} value=${value ?? ''} rows=${f.rows || 3} placeholder=${f.placeholder} onValue=${set} />`; break;
      case 'number': control = html`<${ui.NumberInput} id=${id} value=${value} min=${f.min} max=${f.max} placeholder=${f.placeholder} onValue=${set} />`; break;
      case 'money': control = html`<${ui.NumberInput} id=${id} value=${value} money=${true} currency=${currency} min=${f.min} max=${f.max} placeholder=${f.placeholder} onValue=${set} />`; break;
      case 'pct': control = html`<div class="docs-suffix"><${ui.NumberInput} id=${id} value=${value} min=${f.min ?? 0} max=${f.max ?? 100} onValue=${set} /><span class="docs-suffix-u">%</span></div>`; break;
      case 'date': control = html`<${ui.DateInput} id=${id} value=${value} onValue=${set} />`; break;
      case 'select': control = html`<${ui.Select} id=${id} value=${value} options=${f.options || []} placeholder="Selecciona una opción" onValue=${set} />`; break;
      case 'list': labelFor = undefined; control = html`<${ListEditor} id=${id} value=${value} onChange=${set} label=${f.label} placeholder=${f.placeholder} />`; break;
      case 'table': labelFor = undefined; control = html`<div class="docs-tbl" role="group" aria-label=${f.label}><${ui.DataTable} columns=${f.columns || []} rows=${Array.isArray(value) ? value : []} onChange=${set} currency=${currency} newRow=${makeNewRow(f, t)} addLabel=${f.addLabel || 'Agregar fila'} emptyText=${'Sin filas todavía. Usa «' + (f.addLabel || 'Agregar fila') + '» para empezar.'} /></div>`; break;
      case 'check': break;
      default: control = html`<${TextLineInput} id=${id} value=${value} placeholder=${f.placeholder} onValue=${set} />`;
    }
    if (f.type === 'check') {
      return html`<div class="field"><${ui.Check} id=${id} checked=${!!value} onValue=${set} label=${f.label} />${hint ? html`<div class="field-hint">${hint}</div>` : null}</div>`;
    }
    return html`<${ui.Field} label=${f.label} for=${labelFor} required=${f.required} hint=${hint}>${control}</${ui.Field}>`;
  }

  /* En lectura, las fechas de las tablas no se parten en dos líneas ("01 sep" / "2026"). */
  const nbspDate = (v) => (PM.date.valid(v) ? PM.fmt.date(v).replace(/ /g, ' ') : v ?? '');
  const readColumns = (cols) => (cols || []).map((c) => (c.type === 'date' && !c.format ? { ...c, format: nbspDate } : c));
  function FieldView({ f, value, currency }) {
    if (f.type === 'table') return html`<div class="docs-tbl"><${ui.DataTable} columns=${readColumns(f.columns)} rows=${Array.isArray(value) ? value : []} readOnly=${true} currency=${currency} emptyText="Sin registros." /></div>`;
    if (f.type === 'check') return html`<div class="docs-ro">${value ? 'Sí' : 'No'}</div>`;
    const items = f.type === 'list' ? (Array.isArray(value) ? value : isEmptyVal(value) ? [] : [value]).filter((x) => String(x).trim()) : null;
    if (isEmptyVal(value) || (items && !items.length)) return html`<div class="docs-ro docs-ro-empty">Sin diligenciar</div>`;
    if (items) return html`<ol class="docs-ro-list">${items.map((x, i) => html`<li key=${i}>${x}</li>`)}</ol>`;
    return html`<div class=${cx('docs-ro', (f.type === 'number' || f.type === 'money' || f.type === 'pct') && 'num')}>${fmtValue(f, value, currency)}</div>`;
  }

  function SectionBlock({ s, i, fields, editable, onField, currency, project, t }) {
    return html`<section class="card" data-section=${s.id}>
      <div class="card-head"><div class="stack-sm" style="gap:2px"><h2 class="h3"><span class="docs-sec-n">${i + 1}</span>${s.title}</h2>${s.description ? html`<p class="xsmall faint">${s.description}</p>` : null}</div></div>
      <div class="card-body"><div class="docs-fields">
        ${fieldRuns(s.fields).map((run) => html`<div key=${run.kind + ':' + run.fields[0].key} class=${'docs-run is-' + run.kind}>
          ${run.fields.map((f) => html`<div key=${f.key} data-field=${f.key}>
            ${editable
              ? html`<${FieldEditor} f=${f} value=${fields[f.key]} onField=${onField} currency=${currency} project=${project} t=${t} />`
              : html`<div class="field"><div class="field-label">${f.label}</div><${FieldView} f=${f} value=${fields[f.key]} currency=${currency} /></div>`}
          </div>`)}
        </div>`)}
        ${!(s.fields || []).length ? html`<p class="small faint">Esta sección no tiene campos.</p>` : null}
      </div></div>
    </section>`;
  }

  function TitleBlock({ project, doc, code, status, editable, onTb, exists }) {
    const tb = (doc && doc.titleBlock) || {};
    const cell = (k, v, cls) => html`<div class=${cls}><span class="tb-k">${k}</span><span class="tb-v">${v || '—'}</span></div>`;
    const edit = (key, label) => (editable
      ? html`<div><label class="tb-k" for=${'docs-tb-' + key}>${label}</label><input id=${'docs-tb-' + key} class="docs-tb-input" value=${tb[key] || ''} placeholder="Nombre o cargo" onInput=${(e) => onTb(key, e.currentTarget.value)} /></div>`
      : cell(label, tb[key]));
    return html`<div class="title-block" role="group" aria-label="Cajetín del documento">
      ${cell('Proyecto', project.name, 'span-2')}
      ${cell('Cliente', project.client, 'span-2')}
      ${cell('Código del documento', code)}
      ${cell('Revisión', doc && doc.rev)}
      ${cell('Fecha', exists && doc && doc.updatedAt ? PM.fmt.date(localDate(doc.updatedAt)) : '')}
      ${cell('Estado', PM.docStatus(status).label)}
      ${edit('elaboro', 'Elaboró')}
      ${edit('reviso', 'Revisó')}
      ${edit('aprobo', 'Aprobó')}
      ${cell('Fecha de aprobación', tb.fechaAprobacion ? PM.fmt.date(tb.fechaAprobacion) : '')}
    </div>`;
  }

  function SaveState({ pending, edited, exists, editable }) {
    const st = PM.useAppState();
    if (pending || st.saving > 0) return html`<span class="docs-save" role="status"><${ui.Icon} name="clock" size=${13} />Guardando…</span>`;
    if (edited) return html`<span class="docs-save is-ok" role="status"><${ui.Icon} name="check" size=${13} />Guardado</span>`;
    if (!exists || !editable) return null;
    return html`<span class="docs-save"><${ui.Icon} name="save" size=${13} />Guardado automático</span>`;
  }

  /* Título editable de una instancia (plantillas múltiples). Mientras tiene el foco se edita un borrador local,
     así borrar todo el texto no hace reaparecer el título por defecto; al salir vacío vuelve al título por defecto. */
  function TitleInput({ value, fallback, onValue }) {
    const [draft, setDraft] = useState(null);
    const typed = useRef(false);
    const ref = useRef(null);
    const width = useWidth(ref);
    const shown = draft !== null ? draft : value || fallback;
    /* Área de texto de una línea que crece con el contenido: los títulos largos se parten como en lectura. La copia invisible
       (.docs-title-wrap::after) da el ancho y el alto; esta medición solo asegura que nunca se recorte el texto. */
    useLayoutEffect(() => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; }, [shown, width]);
    return html`<span class="docs-title-wrap" data-value=${shown || fallback}><textarea ref=${ref} rows="1" class="docs-title-input" aria-label="Título del documento" value=${shown} placeholder=${fallback}
      onFocus=${() => { typed.current = false; setDraft(value || fallback); }}
      onInput=${(e) => { const v = e.currentTarget.value.replace(/\r?\n/g, ' '); typed.current = true; setDraft(v); if (v.trim()) onValue(v); }}
      onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      onBlur=${() => {
        const v = String(draft ?? '').trim(); setDraft(null);
        if (!typed.current) return;
        if (!v) { if (value !== fallback) onValue(fallback); } else if (v !== value) onValue(v);
      }}></textarea></span>`;
  }

  /* Diálogo de emisión con nota opcional (y aprobador cuando se aprueba). Resuelve {note, aprobo} o null. */
  function issueDialog({ title, intro, confirmText, approver, aprobo, danger, missing, info }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v, close) => { if (done) return; done = true; close(); resolve(v); };
      function IssueBody({ close }) {
        const [note, setNote] = useState('');
        const [ap, setAp] = useState(aprobo || '');
        useEffect(() => { const el = document.getElementById(approver ? 'docs-issue-ap' : 'docs-issue-note'); if (el) el.focus(); }, []);
        return html`<${ui.Modal} title=${title} onClose=${() => finish(null, close)} footer=${html`<${ui.Button} onClick=${() => finish(null, close)}>Cancelar</${ui.Button}><${ui.Button} variant=${danger ? 'danger-solid' : 'primary'} onClick=${() => finish({ note: note.trim(), aprobo: ap.trim() }, close)}>${confirmText}</${ui.Button}>`}>
          <p class="small">${intro}</p>
          ${info ? html`<div class="docs-callout is-info" data-callout="emision-info"><${ui.Icon} name="info" size=${16} /><span>${info}</span></div>` : null}
          ${missing && missing.length ? html`<div class="docs-callout is-warn" data-callout="faltantes"><${ui.Icon} name="alert" size=${16} /><span>Hay campos obligatorios sin diligenciar: ${missing.map((f) => f.label).join(', ')}. Quien revise los verá vacíos; deberás completarlos antes de aprobar.</span></div>` : null}
          ${approver ? html`<${ui.Field} label="Aprobó" for="docs-issue-ap" hint="Nombre o cargo de quien aprueba. Se registra en el cajetín."><${ui.Input} id="docs-issue-ap" value=${ap} onValue=${setAp} placeholder="Ej.: Gerencia General" /></${ui.Field}>` : null}
          <${ui.Field} label="Nota (opcional)" for="docs-issue-note" hint="Motivo o resumen de los cambios. Queda en el historial de revisiones."><${ui.TextArea} id="docs-issue-note" value=${note} onValue=${setNote} rows=${2} /></${ui.Field}>
        </${ui.Modal}>`;
      }
      PM.openModal((close) => html`<${IssueBody} close=${close} />`);
    });
  }

  function SnapshotModal({ close, snap, t, project, code }) {
    const fields = snap.fields || {};
    const currency = project.currency || 'COP';
    return html`<${ui.Modal} size="xl" title=${'Revisión ' + (snap.rev || '—') + ' · ' + PM.docStatus(snap.status).label} subtitle=${code + ' · emitida el ' + PM.fmt.datetime(snap.date)} onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
      <div class="docs-snap">
        ${snap.note ? html`<div class="docs-callout"><${ui.Icon} name="info" size=${16} /><div class="docs-callout-body"><strong>Nota de la emisión</strong><span>${snap.note}</span></div></div>` : null}
        <h3 class="h3">${snap.title || t.name}</h3>
        <${TitleBlock} project=${project} code=${code} status=${snap.status} exists=${true} doc=${{ titleBlock: snap.titleBlock || {}, rev: snap.rev, updatedAt: snap.date }} editable=${false} />
        ${(t.sections || []).map((s, i) => html`<${SectionBlock} key=${s.id || i} s=${s} i=${i} fields=${fields} editable=${false} currency=${currency} project=${project} t=${t} />`)}
      </div>
    </${ui.Modal}>`;
  }

  function HistoryModal({ close, pid, docId, t, project, code, title, canRestore, onRestore }) {
    const { docs, loading } = PM.useCollection(PM.paths.revs(pid, docId));
    const list = useMemo(() => docs.filter((d) => d.data).map((d) => ({ id: d.id, ...d.data })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))), [docs]);
    const view = (s) => PM.openModal((c2) => html`<${SnapshotModal} close=${c2} snap=${s} t=${t} project=${project} code=${code} />`);
    const restore = async (s) => {
      const ok = await PM.confirm({ title: 'Restaurar contenido de la revisión ' + (s.rev || '—'), body: 'El contenido actual del documento se reemplazará por el de esa revisión. La revisión vigente, el estado y el historial no cambian; podrás emitir el resultado como un nuevo borrador.', confirmText: 'Restaurar contenido' });
      if (!ok) return;
      await onRestore(s);
      close();
      PM.toast('Se restauró el contenido de la revisión ' + (s.rev || '—') + '.');
    };
    const can = canRestore();
    return html`<${ui.Modal} size="wide" title="Historial de revisiones" subtitle=${code + ' · ' + title} onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
      ${loading ? html`<${ui.Loading} rows=${3} />` : !list.length ? html`<${ui.Empty} icon="history" title="Aún no hay revisiones emitidas">Cada vez que emites un borrador, lo envías a revisión, lo apruebas o lo marcas como obsoleto, se guarda aquí una copia de su contenido.</${ui.Empty}>` : html`
        ${!can ? html`<div class="docs-callout is-info"><${ui.Icon} name="lock" size=${16} /><span>El documento está bloqueado. Para restaurar el contenido de una revisión anterior, crea primero una nueva revisión.</span></div>` : null}
        <div class="table-wrap"><table class="table docs-hist">
          <thead><tr><th>Rev.</th><th>Estado</th><th>Fecha</th><th>Emitió</th><th>Nota</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>${list.map((s) => html`<tr key=${s.id} data-rev=${s.rev || ''} data-status=${s.status || ''}>
            <td class="docs-h-rev mono" style="font-weight:600"><span class="docs-m-only">Rev. </span>${s.rev || '—'}</td>
            <td class="docs-h-status"><${StatusChip} status=${s.status || 'borrador'} /></td>
            <td class="docs-h-date nowrap xsmall">${PM.fmt.datetime(s.date)}</td>
            <td class="docs-h-by small"><span class="docs-m-only faint">Emitió: </span><${ui.Person} id=${s.byId} /></td>
            <td class="docs-h-note small">${s.note || html`<span class="faint">—</span>`}</td>
            <td class="docs-h-act nowrap"><div class="row" style="flex-wrap:nowrap;gap:6px">
              <${ui.Button} size="sm" icon="eye" onClick=${() => view(s)}>Ver</${ui.Button}>
              ${can ? html`<${ui.Button} size="sm" icon="undo" onClick=${() => restore(s)}>Restaurar este contenido</${ui.Button}>` : null}
            </div></td>
          </tr>`)}</tbody>
        </table></div>`}
    </${ui.Modal}>`;
  }

  /* ------------------------------------------------------------------ exportación */
  function titleBlockRows(ctx) {
    const { project, doc, code, status, exists } = ctx;
    const tb = (doc && doc.titleBlock) || {};
    return [
      ['Proyecto', project.name || ''], ['Cliente', project.client || ''], ['Código del documento', code], ['Revisión', (doc && doc.rev) || '—'],
      ['Fecha', exists && doc && doc.updatedAt ? PM.fmt.date(localDate(doc.updatedAt)) : ''], ['Estado', PM.docStatus(status).label],
      ['Elaboró', tb.elaboro || ''], ['Revisó', tb.reviso || ''], ['Aprobó', tb.aprobo || ''], ['Fecha de aprobación', tb.fechaAprobacion ? PM.fmt.date(tb.fechaAprobacion) : ''],
    ];
  }
  function subtitleLine(t, title) {
    const a = areaOf(t.area), g = groupOf(t.group);
    return [t.missing || norm(t.name) === norm(title) ? '' : t.name, t.process ? 'Proceso ' + t.process + (processOf(t.process) ? ' ' + processOf(t.process).name : '') : '', g ? 'Grupo de procesos: ' + g.name : '', a ? 'Área: ' + a.num + '. ' + areaShort(a) : ''].filter(Boolean).join(' · ');
  }
  function buildMarkdown(ctx) {
    const { t, fields, project, title } = ctx;
    const cur = project.currency || 'COP';
    const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
    const L = ['# ' + title, ''];
    const sub = subtitleLine(t, title); if (sub) L.push('_' + sub + '_', '');
    L.push('| Cajetín | |', '|---|---|');
    for (const [k, v] of titleBlockRows(ctx)) L.push('| ' + k + ' | ' + esc(v || '—') + ' |');
    L.push('');
    (t.sections || []).forEach((s, i) => {
      L.push('## ' + (i + 1) + '. ' + s.title, '');
      if (s.description) L.push('_' + s.description + '_', '');
      for (const f of s.fields || []) {
        const v = fields[f.key];
        L.push('**' + f.label + '**', '');
        if (f.type === 'table') {
          const rows = Array.isArray(v) ? v : [];
          const cols = f.columns || [];
          if (!rows.length) { L.push('_Sin registros._', ''); continue; }
          L.push('| ' + cols.map((c) => esc(c.label)).join(' | ') + ' |', '|' + cols.map((c) => (isNumCol(c) ? '---:' : '---')).join('|') + '|');
          for (const r of rows) L.push('| ' + cols.map((c) => esc(cellStr(c, r, rows, cur))).join(' | ') + ' |');
          L.push('');
        } else if (f.type === 'list') {
          const items = (Array.isArray(v) ? v : isEmptyVal(v) ? [] : [v]).filter((x) => String(x).trim());
          if (!items.length) L.push('_Sin diligenciar._', ''); else { items.forEach((x, j) => L.push((j + 1) + '. ' + String(x).replace(/\r?\n/g, ' '))); L.push(''); }
        } else if (f.type === 'check') L.push(v ? 'Sí' : 'No', '');
        else { const s2 = fmtValue(f, v, cur); L.push(s2 ? s2.replace(/\r?\n/g, '  \n') : '_Sin diligenciar._', ''); }
      }
    });
    L.push('---', '', 'Documento ' + ctx.code + (ctx.doc && ctx.doc.rev ? ', revisión ' + ctx.doc.rev : '') + '. Generado con el Gestor de Proyectos PMBOK el ' + PM.fmt.datetime(PM.nowIso()) + '.');
    return L.join('\n') + '\n';
  }
  function buildHtml(ctx) {
    const { t, fields, project, title } = ctx;
    const cur = project.currency || 'COP';
    const e = PM.escapeHtml;
    const para = (s) => e(s).split(/\n{2,}/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
    const tb = titleBlockRows(ctx);
    const tbCell = ([k, v], span) => '<td' + (span ? ' colspan="' + span + '"' : '') + '><span class="k">' + e(k) + '</span><span class="v">' + e(v || '—') + '</span></td>';
    let body = '';
    (t.sections || []).forEach((s, i) => {
      body += '<section><h2>' + (i + 1) + '. ' + e(s.title) + '</h2>' + (s.description ? '<p class="desc">' + e(s.description) + '</p>' : '');
      for (const f of s.fields || []) {
        const v = fields[f.key];
        body += '<div class="f"><div class="l">' + e(f.label) + '</div>';
        if (f.type === 'table') {
          const rows = Array.isArray(v) ? v : [];
          const cols = f.columns || [];
          if (!rows.length) body += '<p class="e">Sin registros.</p>';
          else body += '<table class="data"><thead><tr>' + cols.map((c) => '<th' + (isNumCol(c) ? ' class="n"' : '') + '>' + e(c.label) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + cols.map((c) => '<td' + (isNumCol(c) ? ' class="n"' : '') + '>' + e(cellStr(c, r, rows, cur)).replace(/\n/g, '<br>') + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
        } else if (f.type === 'list') {
          const items = (Array.isArray(v) ? v : isEmptyVal(v) ? [] : [v]).filter((x) => String(x).trim());
          body += items.length ? '<ol>' + items.map((x) => '<li>' + e(x) + '</li>').join('') + '</ol>' : '<p class="e">Sin diligenciar.</p>';
        } else if (f.type === 'check') body += '<p>' + (v ? 'Sí' : 'No') + '</p>';
        else { const s2 = fmtValue(f, v, cur); body += s2 ? para(s2) : '<p class="e">Sin diligenciar.</p>'; }
        body += '</div>';
      }
      body += '</section>';
    });
    const css = '*{box-sizing:border-box}body{margin:0;background:#eef1f4;color:#18212c;font:14px/1.5 "Segoe UI",Roboto,Helvetica,Arial,sans-serif}'
      + '.sheet{max-width:960px;margin:24px auto;background:#fff;border:1px solid #b6c0cc;padding:36px 44px}'
      + '.org{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5a6676;font-weight:600}'
      + 'h1{font-size:24px;line-height:1.2;margin:6px 0 4px}.sub{color:#5a6676;font-size:12px;margin:0 0 16px}'
      + 'table{border-collapse:collapse;width:100%}.tb{margin:0 0 8px}.tb td{border:1px solid #6f7b8a;padding:5px 8px;vertical-align:top;width:16.66%}'
      + '.tb .k{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#5a6676;font-weight:600}.tb .v{font-family:Consolas,"Courier New",monospace;font-size:12px;overflow-wrap:anywhere}'
      + 'h2{font-size:16px;margin:28px 0 10px;padding-bottom:4px;border-bottom:2px solid #18212c}.desc{color:#5a6676;font-size:12px;margin:-4px 0 10px}'
      + '.f{margin:0 0 14px}.f .l{font-weight:600;font-size:12px;color:#36414f;margin-bottom:3px}.f p{margin:0 0 6px}.e{color:#8a94a1;font-style:italic}ol{margin:0;padding-left:22px}'
      + '.data th,.data td{border:1px solid #b6c0cc;padding:4px 6px;font-size:12px;text-align:left;vertical-align:top}.data th{background:#eef1f4}.data .n{text-align:right;white-space:nowrap}'
      + 'footer{margin-top:28px;padding-top:8px;border-top:1px solid #b6c0cc;font-size:11px;color:#5a6676}'
      + '@media print{body{background:#fff}.sheet{border:0;margin:0;max-width:none;padding:0}@page{size:A4;margin:16mm}h2{break-after:avoid}tr,.f{break-inside:avoid}}';
    return '<!doctype html>\n<html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + e(ctx.code + ' — ' + title) + '</title><style>' + css + '</style></head><body><div class="sheet">'
      + '<div class="org">' + e(project.name || '') + '</div><h1>' + e(title) + '</h1>' + (subtitleLine(t, title) ? '<p class="sub">' + e(subtitleLine(t, title)) + '</p>' : '')
      + '<table class="tb"><tr>' + tbCell(tb[0], 2) + tbCell(tb[1], 2) + tbCell(tb[2]) + tbCell(tb[3]) + '</tr><tr>' + tb.slice(4).map((x) => tbCell(x)).join('') + '</tr></table>'
      + body + '<footer>Documento ' + e(ctx.code) + (ctx.doc && ctx.doc.rev ? ', revisión ' + e(ctx.doc.rev) : '') + '. Generado con el Gestor de Proyectos PMBOK el ' + e(PM.fmt.datetime(PM.nowIso())) + '.</footer></div></body></html>\n';
  }

  /* ------------------------------------------------------------------ Claude: redacción asistida */
  const TYPE_DESC = { text: 'texto corto', textarea: 'texto largo', number: 'número', money: 'valor monetario (número)', pct: 'porcentaje de 0 a 100 (número)', date: 'fecha AAAA-MM-DD', select: 'selección', list: 'lista de textos (arreglo de cadenas)', table: 'tabla (arreglo de objetos)', check: 'sí/no (booleano)', calc: 'calculado' };
  const optsText = (options) => (options || []).map(normOpt).map((o) => String(o.value)).join(' | ');
  function fieldSpec(f, wanted) {
    const parts = ['`' + f.key + '`', f.label, TYPE_DESC[f.type] || f.type];
    if (f.type === 'select') parts.push('valores permitidos: ' + optsText(f.options));
    if (f.hint) parts.push('ayuda: ' + f.hint);
    if (f.type === 'table') parts.push('columnas: ' + (f.columns || []).filter((c) => c.type !== 'calc').map((c) => c.key + ' (' + c.label + ', ' + (TYPE_DESC[c.type] || c.type) + (c.type === 'select' ? ': ' + optsText(c.options) : '') + (c.key === 'id' ? ', código como R-001' : '') + ')').join('; '));
    return '- ' + parts.join(' — ') + (wanted ? '  ← REDACTAR' : '');
  }
  function projectBrief(p) {
    const cur = p.currency || 'COP';
    const rows = [['Nombre', p.name], ['Código', p.code], ['Cliente', p.client], ['Patrocinador', p.sponsor], ['Director del proyecto', p.manager], ['Ubicación', p.location],
      ['Fecha de inicio', p.start], ['Fecha de fin prevista', p.end], ['Presupuesto aprobado', p.budget !== null && p.budget !== undefined && p.budget !== '' ? PM.fmt.money(p.budget, cur) + ' (' + cur + ')' : ''],
      ['Estado', p.status], ['Ciclo de vida', p.lifecycle], ['Descripción', p.description]];
    return rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').map(([k, v]) => '- ' + k + ': ' + v).join('\n');
  }
  function docText(t, fields, currency) {
    const out = [];
    for (const f of allFields(t)) {
      const v = fields[f.key]; if (isEmptyVal(v)) continue;
      if (f.type === 'table') {
        const rows = Array.isArray(v) ? v : [];
        out.push(f.label + ':');
        rows.slice(0, 12).forEach((r) => out.push('  - ' + (f.columns || []).map((c) => { const x = cellStr(c, r, rows, currency); return x ? c.label + ': ' + x : ''; }).filter(Boolean).join('; ')));
      } else if (f.type === 'list') out.push(f.label + ': ' + (Array.isArray(v) ? v : [v]).filter((x) => String(x).trim()).join('; '));
      else out.push(f.label + ': ' + fmtValue(f, v, currency));
    }
    return out.join('\n');
  }
  function relatedExcerpts(idx, tid, project) {
    const docs = AI_CONTEXT_DOCS.filter((id) => id !== tid).map((id) => (idx.byTemplate[id] || []).find((d) => statusOf(d) === 'aprobado')).filter(Boolean);
    if (!docs.length) return '';
    const per = Math.floor(4000 / docs.length);
    return docs.map((d) => {
      const t = PM.templates[d.template] || pseudoTemplate(d.template, d);
      const head = '### ' + t.name + ' (revisión ' + (d.rev || '—') + ', aprobado)\n';
      return head + clip(docText(t, d.fields || {}, project.currency || 'COP'), per - head.length);
    }).join('\n\n');
  }
  const stripUidIds = (fields) => {
    const out = {};
    for (const [k, v] of Object.entries(fields || {})) out[k] = Array.isArray(v) ? v.map((r) => (r && typeof r === 'object' && typeof r.id === 'string' && /^r_/.test(r.id) ? (({ id, ...rest }) => rest)(r) : r)) : v;
    return out;
  };
  function buildAiPrompt({ t, project, fields, keys, instructions, related }) {
    const a = areaOf(t.area), g = groupOf(t.group);
    const want = new Set(keys);
    const L = [];
    L.push('Eres un director de proyectos certificado PMP que redacta documentos de proyecto según la Guía del PMBOK® 6.ª edición, en español de Colombia, para Ingeniería y Alquiler S.A.S., empresa colombiana que alquila, monta y transporta equipos de construcción (andamios, formaletas y maquinaria).');
    L.push('', '## Proyecto', projectBrief(project));
    L.push('', '## Documento', '- Nombre: ' + t.name + (t.abbr ? ' (' + t.abbr + ')' : ''));
    if (t.process) L.push('- Proceso: ' + t.process + (processOf(t.process) ? ' ' + processOf(t.process).name : ''));
    if (g) L.push('- Grupo de procesos: ' + g.name);
    if (a) L.push('- Área de conocimiento: ' + a.name);
    if (t.purpose) L.push('- Propósito: ' + t.purpose);
    if ((t.tips || []).length) L.push('- Recomendaciones: ' + t.tips.join(' / '));
    L.push('', '## Estructura del documento (clave — etiqueta — tipo)');
    for (const s of t.sections || []) {
      L.push('### ' + s.title + (s.description ? ' — ' + s.description : ''));
      for (const f of s.fields || []) L.push(fieldSpec(f, want.has(f.key)));
    }
    let current = JSON.stringify(stripUidIds(fields));
    if (current.length > 6000) current = current.slice(0, 6000) + ' …(truncado)';
    L.push('', '## Contenido actual del documento (JSON)', current);
    if (related) L.push('', '## Documentos aprobados relacionados (extractos, para mantener coherencia)', related);
    if (instructions && instructions.trim()) L.push('', '## Instrucciones adicionales del usuario', instructions.trim());
    L.push('', '## Tarea', 'Redacta el contenido de estos campos: ' + keys.join(', ') + '.');
    L.push('Reglas:');
    L.push('- Responde ÚNICAMENTE con un objeto JSON, sin texto adicional ni bloques de código. Sus claves deben ser exactamente las claves de campo indicadas.');
    L.push('- Texto: contenido concreto y aplicable a este proyecto, en español de Colombia; separa ideas con saltos de línea.');
    L.push('- Listas: arreglo de cadenas. Tablas: arreglo de objetos que usan solo las claves de columna indicadas (omite las columnas calculadas).');
    L.push('- Números, valores monetarios y porcentajes: números sin símbolos ni separadores de miles; porcentajes de 0 a 100.');
    L.push('- Fechas: AAAA-MM-DD, coherentes con las fechas del proyecto. Selecciones: exactamente uno de los valores permitidos. Casillas: true o false.');
    L.push('- No inventes nombres de personas: usa roles (por ejemplo "Director de proyecto", "Residente de obra", "Coordinador SST").');
    L.push('- Mantén coherencia con el contenido actual y con los documentos relacionados; mejora y completa en lugar de contradecir.');
    L.push('Ejemplo de forma: {"clave_texto": "…", "clave_lista": ["…", "…"], "clave_tabla": [{"columna": "…"}]}');
    return L.join('\n');
  }
  function toNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v !== 'string') return null;
    let s = v.replace(/[^\d,.-]/g, '');
    if (!s) return null;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
  function matchOption(options, v) {
    const opts = (options || []).map(normOpt);
    const s = String(v); const n = norm(s).trim();
    const hit = opts.find((o) => String(o.value) === s) || opts.find((o) => norm(String(o.value)).trim() === n || norm(String(o.label)).trim() === n);
    return hit ? hit.value : undefined;
  }
  function coerceValue(f, v) {
    if (v === undefined || v === null) return undefined;
    const type = f.type;
    if (type === 'text' || type === 'textarea') {
      if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? Object.values(x).join(' — ') : String(x))).join('\n');
      if (typeof v === 'object') return Object.entries(v).map(([k, x]) => k + ': ' + (x && typeof x === 'object' ? JSON.stringify(x) : x)).join('\n');
      return String(v);
    }
    if (type === 'number' || type === 'money' || type === 'pct') {
      let n = toNum(v); if (n === null) return undefined;
      const lo = f.min ?? (type === 'pct' ? 0 : undefined), hi = f.max ?? (type === 'pct' ? 100 : undefined);
      if (lo !== undefined && n < lo) n = lo;
      if (hi !== undefined && n > hi) n = hi;
      return n;
    }
    if (type === 'date') { const s = String(v).trim().slice(0, 10); return PM.date.valid(s) ? s : undefined; }
    if (type === 'select') return matchOption(f.options, v);
    if (type === 'check') {
      if (typeof v === 'boolean') return v;
      const s = norm(String(v)).trim();
      if (['true', 'si', 'yes', '1', 'x'].includes(s)) return true;
      if (['false', 'no', '0'].includes(s)) return false;
      return undefined;
    }
    if (type === 'list') {
      if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x.trim() : x && typeof x === 'object' ? Object.values(x).join(' — ') : String(x))).filter(Boolean);
      if (typeof v === 'string') return v.split(/\r?\n+/).map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
      return undefined;
    }
    if (type === 'table') {
      if (!Array.isArray(v)) return undefined;
      return v.filter((r) => r && typeof r === 'object' && !Array.isArray(r)).map((r) => {
        const out = {};
        for (const c of f.columns || []) {
          if (c.type === 'calc' || r[c.key] === undefined) continue;
          const cv = coerceValue(c, r[c.key]);
          if (cv !== undefined) out[c.key] = cv;
        }
        return out;
      }).filter((r) => Object.keys(r).length);
    }
    return typeof v === 'object' ? undefined : String(v);
  }
  function coerceProposals(t, res, keys) {
    let obj = res;
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { obj = null; } }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    if (!keys.some((k) => k in obj)) { const inner = obj.fields || obj.campos; if (inner && typeof inner === 'object' && !Array.isArray(inner)) obj = inner; }
    const fmap = Object.fromEntries(allFields(t).map((f) => [f.key, f]));
    const out = {};
    for (const k of keys) {
      const f = fmap[k]; if (!f || !(k in obj)) continue;
      const v = coerceValue(f, obj[k]);
      if (v === undefined || (f.type !== 'check' && isEmptyVal(v))) continue;
      out[k] = v;
    }
    return out;
  }

  function AiModal({ close, t, project, getFields, idx, tid, onApply, onDenied }) {
    const flds = useMemo(() => allFields(t), [t]);
    const fmap = useMemo(() => Object.fromEntries(flds.map((f) => [f.key, f])), [flds]);
    const cur = getFields();
    const [sel, setSel] = useState(() => new Set(flds.filter((f) => isEmptyVal(cur[f.key])).map((f) => f.key)));
    const [instr, setInstr] = useState('');
    const [phase, setPhase] = useState('form');
    const [stream, setStream] = useState('');
    const [err, setErr] = useState('');
    const [props, setProps] = useState(null);
    const [pick, setPick] = useState(() => new Set());
    const [modes, setModes] = useState({});
    const ctl = useRef(null);
    useEffect(() => () => { if (ctl.current) ctl.current.abort(); }, []);
    const toggle = (setter, key) => setter((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
    const run = async () => {
      const keys = flds.filter((f) => sel.has(f.key)).map((f) => f.key);
      if (!keys.length) return;
      const prompt = buildAiPrompt({ t, project, fields: cur, keys, instructions: instr, related: relatedExcerpts(idx, tid, project) });
      const c = new AbortController();
      ctl.current = c;
      setErr(''); setStream(''); setPhase('running');
      try {
        const res = await PM.ai.json(prompt, { signal: c.signal, cache: false, onText: ({ text }) => { if (ctl.current === c) setStream(text || ''); } });
        if (ctl.current !== c) return;
        ctl.current = null;
        const out = coerceProposals(t, res, keys);
        const got = keys.filter((k) => k in out);
        if (!got.length) { setErr('Claude no propuso contenido válido para los campos elegidos. Ajusta las instrucciones o la selección y vuelve a intentarlo.'); setPhase('form'); return; }
        setProps(out);
        setPick(new Set(got));
        setModes(Object.fromEntries(got.filter((k) => fmap[k].type === 'table').map((k) => [k, Array.isArray(cur[k]) && cur[k].length ? 'append' : 'replace'])));
        setPhase('review');
      } catch (e) {
        if (ctl.current !== c) return;
        ctl.current = null;
        const code = e && e.code;
        if (code === 'cancelled' || (e && e.name === 'AbortError')) { setErr('Solicitud detenida. Ajusta la selección o las instrucciones y vuelve a intentarlo.'); setPhase('form'); return; }
        if (code === 'not_granted') { aiDenied = true; if (onDenied) onDenied(); }
        setErr(PM.ai.errorText(code));
        setPhase('form');
      }
    };
    const stop = () => { if (ctl.current) ctl.current.abort(); };
    const apply = () => {
      const vals = {};
      for (const k of pick) {
        const f = fmap[k]; if (!f || !props || props[k] === undefined) continue;
        let v = props[k];
        if (f.type === 'table') { const ex = Array.isArray(cur[k]) ? cur[k] : []; v = modes[k] === 'append' ? [...ex, ...withIds(v, ex, f, t)] : withIds(v, [], f, t); }
        vals[k] = v;
      }
      const n = Object.keys(vals).length;
      if (!n) return;
      onApply(vals);
      close();
      PM.toast(n === 1 ? 'Se aplicó 1 campo propuesto por Claude. Revísalo antes de emitir el documento.' : 'Se aplicaron ' + n + ' campos propuestos por Claude. Revísalos antes de emitir el documento.');
    };
    const onClose = () => { stop(); close(); };
    const currency = project.currency || 'COP';
    let body, footer;
    if (phase === 'running') {
      /* Progreso legible: la respuesta llega como JSON, así que no se muestra en bruto; se indica qué campos ya llegaron. */
      const keys = flds.filter((f) => sel.has(f.key)).map((f) => f.key);
      const order = keys.map((k) => [k, stream.search(new RegExp('"' + reEsc(k) + '"\\s*:'))]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]).map(([k]) => k);
      const now = order[order.length - 1] || null;
      body = html`<div class="stack" aria-live="polite">
        ${stream ? html`<div class="small muted">Claude está redactando la propuesta: ${order.length} de ${keys.length} ${keys.length === 1 ? 'campo' : 'campos'} · ${PM.fmt.num(stream.length)} caracteres recibidos.</div>
          <ul class="docs-ai-prog" data-ai-progress>${keys.map((k) => { const st = k === now ? 'now' : order.includes(k) ? 'done' : 'wait'; return html`<li key=${k} class=${st === 'done' ? 'is-done' : st === 'now' ? 'is-now' : ''} data-ai-state=${st}>
            <${ui.Icon} name=${st === 'done' ? 'check' : st === 'now' ? 'edit' : 'clock'} size=${14} /><span>${fmap[k].label}${st === 'now' ? ' — redactando…' : st === 'wait' ? ' — pendiente' : ''}</span>
          </li>`; })}</ul>`
          : html`<${ui.Spinner} label="Pensando…" /><p class="small muted">Claude analiza la plantilla y el contexto del proyecto. La primera respuesta puede tardar hasta un minuto.</p>`}
      </div>`;
      footer = html`<${ui.Button} icon="stop" onClick=${stop}>Detener</${ui.Button}>`;
    } else if (phase === 'review' && props) {
      const keys = flds.filter((f) => sel.has(f.key)).map((f) => f.key);
      const got = keys.filter((k) => k in props);
      const missing = keys.filter((k) => !(k in props));
      body = html`<div class="stack">
        <p class="small muted">Revisa la propuesta y marca los campos que quieres aplicar. Los campos sin marcar no cambian. Nada se guarda hasta que pulses «Aplicar selección».</p>
        ${got.map((k) => { const f = fmap[k]; return html`<div class="docs-ai-item" key=${k} data-ai-field=${k}>
          <div class="row-between">
            <${ui.Check} checked=${pick.has(k)} onValue=${() => toggle(setPick, k)} label=${html`<strong>${f.label}</strong>`} />
            ${f.type === 'table' && Array.isArray(cur[k]) && cur[k].length ? html`<${ui.Segmented} label=${'Cómo aplicar ' + f.label} value=${modes[k]} onChange=${(v) => setModes({ ...modes, [k]: v })} options=${[{ value: 'append', label: 'Agregar filas' }, { value: 'replace', label: 'Reemplazar tabla' }]} />` : null}
          </div>
          <div class=${cx('docs-cmp', f.type === 'table' && 'is-stack')}>
            <div><span class="label-caps">Actual</span><${FieldView} f=${f} value=${cur[k]} currency=${currency} /></div>
            <div class="is-new"><span class="label-caps">Propuesta</span><${FieldView} f=${f} value=${props[k]} currency=${currency} /></div>
          </div>
        </div>`; })}
        ${missing.length ? html`<p class="xsmall faint">Sin propuesta válida para: ${missing.map((k) => fmap[k].label).join(', ')}.</p>` : null}
      </div>`;
      footer = html`<${ui.Button} variant="ghost" icon="arrow-left" onClick=${() => setPhase('form')}>Volver a la selección</${ui.Button}><${ui.Button} onClick=${onClose}>Descartar</${ui.Button}><${ui.Button} variant="primary" icon="check" disabled=${!pick.size} onClick=${apply}>Aplicar selección (${pick.size})</${ui.Button}>`;
    } else {
      body = html`<div class="stack">
        <p class="small muted">Claude redactará una propuesta para los campos que elijas con base en la ficha del proyecto, la estructura de la plantilla, el contenido actual y los documentos aprobados relacionados. Podrás revisarla antes de aplicarla.</p>
        <div class="row-between"><span class="label-caps">Campos a redactar (${sel.size})</span><div class="row" style="gap:4px">
          <${ui.Button} size="sm" variant="ghost" onClick=${() => setSel(new Set(flds.filter((f) => isEmptyVal(cur[f.key])).map((f) => f.key)))}>Solo vacíos</${ui.Button}>
          <${ui.Button} size="sm" variant="ghost" onClick=${() => setSel(new Set(flds.map((f) => f.key)))}>Todos</${ui.Button}>
          <${ui.Button} size="sm" variant="ghost" onClick=${() => setSel(new Set())}>Ninguno</${ui.Button}>
        </div></div>
        ${(t.sections || []).map((s) => (s.fields || []).length ? html`<div class="stack-sm" key=${s.id}><div class="h4">${s.title}</div><div class="docs-ai-fields">
          ${s.fields.map((f) => html`<${ui.Check} key=${f.key} checked=${sel.has(f.key)} onValue=${() => toggle(setSel, f.key)} data-ai-pick=${f.key} label=${html`<span>${f.label}${isEmptyVal(cur[f.key]) ? html` <span class="xsmall faint">(vacío)</span>` : null}</span>`} />`)}
        </div></div>` : null)}
        <${ui.Field} label="Instrucciones adicionales (opcional)" for="docs-ai-instr" hint="Por ejemplo: enfatiza la seguridad en trabajo en alturas y el montaje por etapas.">
          <${ui.TextArea} id="docs-ai-instr" value=${instr} onValue=${setInstr} rows=${2} />
        </${ui.Field}>
        ${err ? html`<div class="docs-callout is-warn" role="alert"><${ui.Icon} name="alert" size=${16} /><span>${err}</span></div>` : null}
      </div>`;
      footer = html`<${ui.Button} onClick=${onClose}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="sparkles" disabled=${!sel.size} onClick=${run}>Redactar propuesta</${ui.Button}>`;
    }
    return html`<${ui.Modal} size="wide" title="Redactar con Claude" subtitle=${t.name} onClose=${onClose} footer=${footer}>${body}</${ui.Modal}>`;
  }

  /* ------------------------------------------------------------------ panel lateral */
  function ProcLink({ code }) {
    const p = processOf(code);
    if (!p) return html`<div class="docs-rel-item" style="cursor:default"><span class="docs-rel-name"><span class="docs-code">${code}</span> Proceso ${code}</span></div>`;
    return html`<button type="button" class="docs-rel-item" data-process=${code} onClick=${() => PM.navigate('procesos', { process: code })}><span class="docs-sw" aria-hidden="true" style=${'background:' + groupColor(p.group)}></span><span class="docs-rel-name"><span class="docs-code">${code}</span> ${p.name}</span><${ui.Icon} name="chevron-right" size=${14} /></button>`;
  }
  function SidePanel({ t, tid, idx, doc, exists, status, canWrite, panel, onTogglePanel }) {
    const roles = useMemo(() => (t.missing ? { create: [], update: [] } : templateProcessRoles(t)), [t, kbReady()]);
    const codes = [...roles.create, ...roles.update];
    const related = useMemo(() => {
      if (t.missing) return [];
      const set = [];
      const add = (id) => { if (id && id !== tid && PM.templates[id] && !set.includes(id)) set.push(id); };
      const procs = (roles.create.length ? roles.create : codes).map(processOf).filter(Boolean);
      procs.forEach((p) => trackedDocs(p).forEach(add));
      const main = processOf(t.process) || procs[0];
      if (main) (main.inputsDocs || []).forEach((d) => add(typeof d === 'string' ? d : d && d.doc));
      if (!kbReady()) PM.templateList.filter((x) => x.area === t.area && x.process === t.process).forEach((x) => add(x.id));
      if (BASELINE_DOCS.has(tid)) { add('solicitud-cambio'); add('registro-cambios'); }
      return set.slice(0, 8);
    }, [t, tid, kbReady()]);
    const a = areaOf(t.area), g = groupOf(t.group);
    const tips = Array.isArray(t.tips) ? t.tips : [];
    const showChange = BASELINE_DOCS.has(tid) && status !== 'aprobado';
    return html`<aside class="stack" aria-label="Información del documento">
      ${onTogglePanel ? html`<div class="docs-panel-bar"><${ui.Button} size="sm" variant="ghost" icon=${panel === 'abajo' ? 'compare' : 'expand'} data-panel-toggle=${panel} onClick=${onTogglePanel}>${panel === 'abajo' ? 'Mostrar el panel al lado' : 'Pasar el panel abajo'}</${ui.Button}></div>` : null}
      <${ui.Card} title="Acerca de este documento">
        <div class="stack-sm">
          ${t.purpose ? html`<p class="small">${t.purpose}</p>` : null}
          ${tips.length ? html`<div class="label-caps" style="margin-top:6px">Recomendaciones</div><ul class="docs-tips">${tips.map((x, i) => html`<li key=${i}>${x}</li>`)}</ul>` : null}
          <dl class="docs-meta" style="margin-top:8px">
            ${kindLabel(t.kind) ? html`<dt>Tipo</dt><dd>${kindLabel(t.kind)}${t.multiple ? ' (admite varios por proyecto)' : ''}</dd>` : null}
            ${a ? html`<dt>Área</dt><dd>${a.num}. ${a.name}</dd>` : null}
            ${g ? html`<dt>Grupo</dt><dd>${g.name}</dd>` : null}
            ${exists ? html`<dt>Creado</dt><dd>${PM.fmt.datetime(doc.createdAt)}${doc.createdBy ? html` · <${ui.Person} id=${doc.createdBy} />` : null}</dd>` : null}
            ${exists ? html`<dt>Modificado</dt><dd>${PM.fmt.datetime(doc.updatedAt)}${doc.updatedBy ? html` · <${ui.Person} id=${doc.updatedBy} />` : null}</dd>` : null}
          </dl>
        </div>
      </${ui.Card}>
      ${codes.length ? html`<${ui.Card} title="Procesos del PMBOK" subtitle=${roles.create.length ? (roles.create.length === 1 ? 'Proceso que crea este documento' : 'Procesos que crean este documento') : 'Procesos que actualizan este documento'}>
        <div class="docs-rel">${(roles.create.length ? roles.create : roles.update).map((c) => html`<${ProcLink} key=${c} code=${c} />`)}</div>
        ${roles.create.length && roles.update.length ? html`<details class="docs-more" open=${roles.update.length <= 3}>
          <summary>${roles.update.length === 1 ? 'También lo actualiza 1 proceso' : 'También lo actualizan ' + roles.update.length + ' procesos'}</summary>
          <div class="docs-rel">${roles.update.map((c) => html`<${ProcLink} key=${c} code=${c} />`)}</div>
        </details>` : null}
      </${ui.Card}>` : null}
      ${related.length ? html`<${ui.Card} title="Documentos relacionados">
        <div class="docs-rel">${related.map((id) => {
          const rt = PM.templates[id]; const insts = sortedInstances(idx.byTemplate[id]);
          /* Plantillas múltiples: abre el documento más reciente; si no hay ninguno, crea uno nuevo. */
          if (rt.multiple) {
            const last = insts[insts.length - 1] || null;
            return last
              ? html`<button type="button" key=${id} class="docs-rel-item" data-related=${id} data-open-doc=${last.id} onClick=${() => PM.openDocument(last.id)}>
                  <span class="docs-rel-name stack-sm" style="gap:0"><span>${last.title || rt.name}</span>${(() => { const sub = [insts.length > 1 ? 'El más reciente de ' + insts.length : '', norm(last.title || rt.name).includes(norm(rt.name)) ? '' : rt.name].filter(Boolean).join(' · '); return sub ? html`<span class="xsmall faint">${sub}</span>` : null; })()}</span><${StatusChip} status=${statusOf(last)} />
                </button>`
              : html`<button type="button" key=${id} class="docs-rel-item" data-related=${id} onClick=${() => PM.openDocument(id)} aria-label=${(canWrite ? 'Crear: ' : 'Ver plantilla: ') + rt.name}>
                  <span class="docs-rel-name stack-sm" style="gap:0"><span>${rt.name}</span><span class="xsmall faint">${canWrite ? 'Ninguno todavía · crear el primero' : 'Ninguno todavía'}</span></span><${StatusChip} status="sin" />
                </button>`;
          }
          return html`<button type="button" key=${id} class="docs-rel-item" data-related=${id} onClick=${() => PM.openDocument(id)}>
            <span class="docs-rel-name">${rt.name}</span><${StatusChip} status=${aggStatus(insts)} />
          </button>`;
        })}</div>
      </${ui.Card}>` : null}
      ${showChange ? html`<div class="docs-callout is-info"><${ui.Icon} name="layers" size=${16} /><div class="docs-callout-body">
        <strong>Documento de línea base</strong>
        <span>Una vez aprobado, cualquier cambio debe pasar por 4.6 Realizar el control integrado de cambios: registra una solicitud de cambio y, cuando se apruebe, crea una nueva revisión.</span>
      </div></div>` : null}
    </aside>`;
  }

  /* ==================================================================== 4.6: SOLICITUD DE CAMBIO → REGISTRO DE CAMBIOS
     El tablero y el diálogo de líneas base leen las decisiones desde la tabla `cambios` del registro de cambios
     (SPEC §5). Cada solicitud se vincula con su fila por el código del cambio (CC-###). */
  const CR_TID = 'solicitud-cambio', CL_TID = 'registro-cambios';
  /* [columna del registro, campo de la solicitud]. Los datos de control se copian siempre; los textos solo
     llenan celdas vacías (en el registro suelen ser un resumen de la solicitud). */
  const CR_KEY_MAP = [['fecha', 'fechaSolicitud'], ['solicitante', 'solicitante'], ['tipo', 'tipoCambio'], ['impactoCronograma', 'diasCronograma'], ['impactoCosto', 'valorCosto'], ['estado', 'decision'], ['fechaDecision', 'fechaDecision'], ['decisor', 'decisor']];
  const CR_TEXT_MAP = [['descripcion', 'descripcionCambio'], ['impactoAlcance', 'impactoAlcance']];
  const isRow = (r) => r && typeof r === 'object' && !Array.isArray(r);
  const sameCode = (a, b) => norm(String(a ?? '').trim()) === norm(String(b ?? '').trim());
  const sameCell = (a, b) => (typeof a === 'number' || typeof b === 'number' ? !isEmptyVal(a) && Number(a) === Number(b) : String(a ?? '').trim() === String(b ?? '').trim());
  const changeLogField = () => allFields(PM.templates[CL_TID]).find((f) => f.key === 'cambios') || null;
  const changeLogRows = (regDoc) => { const v = regDoc && regDoc.exists && regDoc.data && regDoc.data.fields && regDoc.data.fields.cambios; return Array.isArray(v) ? v.filter(isRow) : []; };
  function changeRowFrom(fields) {
    const id = String((fields && fields.codigoCambio) || '').trim();
    if (!id) return null;
    const row = { id };
    for (const [k, s] of [...CR_KEY_MAP, ...CR_TEXT_MAP]) { const v = fields[s]; if (!isEmptyVal(v) && !(typeof v === 'string' && !v.trim())) row[k] = v; }
    return row;
  }
  function changeLinkState(fields, regDoc, insts, docId) {
    const row = changeRowFrom(fields);
    if (!row) return { kind: 'nocode' };
    const other = (insts || []).find((d) => d.id !== docId && sameCode(d.fields && d.fields.codigoCambio, row.id));
    if (other) return { kind: 'dup', row, other };
    const ex = changeLogRows(regDoc).find((r) => sameCode(r.id, row.id));
    if (!ex) return { kind: 'missing', row };
    const diffs = [];
    for (const [k] of CR_KEY_MAP) if (row[k] !== undefined && !sameCell(ex[k], row[k])) diffs.push(k);
    for (const [k] of CR_TEXT_MAP) if (row[k] !== undefined && isEmptyVal(ex[k])) diffs.push(k);
    return { kind: diffs.length ? 'differs' : 'ok', row, ex, diffs };
  }
  function changeDiffText(st, currency) {
    const f = changeLogField();
    const col = (k) => ((f && f.columns) || []).find((c) => c.key === k) || { key: k, label: humanize(k), type: 'text' };
    return st.diffs.map((k) => {
      const c = col(k);
      if (CR_TEXT_MAP.some(([x]) => x === k)) return c.label + ' (vacío en el registro)';
      const a = cellStr(c, st.ex, [st.ex], currency), b = cellStr(c, st.row, [st.row], currency);
      return c.label + ' (registro: ' + (a ? '«' + a + '»' : 'vacío') + '; solicitud: «' + b + '»)';
    }).join('; ');
  }
  /* Siguiente código libre (CC-###) considerando el registro y las demás solicitudes. */
  function nextChangeCode(regDoc, insts) {
    const f = changeLogField();
    if (!f) return '';
    const rows = [...changeLogRows(regDoc), ...(insts || []).map((d) => ({ id: d.fields && d.fields.codigoCambio })).filter((r) => r.id)];
    return nextRowCode(rows, f, PM.templates[CL_TID]);
  }

  function ChangeLogCallout({ st, canWrite, editable, busy, regStatus, nextCode, currency, project, onSync, onSetCode }) {
    const view = PM.templates[CL_TID] ? html`<${ui.Button} size="sm" variant="ghost" icon="checklist" onClick=${() => PM.openDocument(CL_TID)}>Ver registro de cambios</${ui.Button}>` : null;
    const body = (tone, icon, text, actions) => html`<div class=${cx('docs-callout', tone && 'is-' + tone)} data-callout="registro-cambios" data-link=${st.kind}><${ui.Icon} name=${icon} size=${16} /><div class="docs-callout-body">
      <strong>Registro de cambios</strong><span>${text}</span>${actions ? html`<div class="row">${actions}</div>` : null}
    </div></div>`;
    if (st.kind === 'nocode') {
      return body('info', 'link', 'Asigna el código del cambio para vincular esta solicitud con el registro de cambios: el tablero y el diálogo de líneas base leen las decisiones desde ese registro.',
        editable && nextCode ? html`<${ui.Button} size="sm" icon="plus" onClick=${() => onSetCode(nextCode)}>Usar el código ${nextCode}</${ui.Button}>` : null);
    }
    const id = st.row.id;
    if (st.kind === 'dup') {
      const o = st.other;
      return body('warn', 'alert', 'El código ' + id + ' también lo usa «' + (o.title || 'otra solicitud de cambio') + '». Cada solicitud necesita un código propio; cambia uno de los dos para vincularla con el registro de cambios.', view);
    }
    const lockNote = regStatus === 'aprobado' ? ' El registro de cambios está aprobado: después de actualizarlo, crea una nueva revisión para emitir el cambio.' : '';
    if (st.kind === 'missing') {
      return body('warn', 'alert', id + ' aún no figura en el registro de cambios, así que el tablero y el diálogo de líneas base no ven esta solicitud.' + (editable ? ' Se registrará al emitirla; también puedes registrarla ahora.' : '') + lockNote,
        html`${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="plus" disabled=${busy} onClick=${onSync}>Registrar en el registro de cambios</${ui.Button}>` : null}${view}`);
    }
    if (st.kind === 'differs') {
      return body('warn', 'alert', 'El registro de cambios tiene otros datos para ' + id + ': ' + changeDiffText(st, currency) + '.' + lockNote,
        html`${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="refresh" disabled=${busy} onClick=${onSync}>Actualizar el registro de cambios</${ui.Button}>` : null}${view}`);
    }
    return body('good', 'check-circle', id + ' figura en el registro de cambios' + (st.ex.estado ? ' con estado «' + st.ex.estado + '»' : '') + '.', view);
  }

  /* ==================================================================== 4.5 / 4.7: DATOS CALCULADOS PARA LOS INFORMES
     El informe de desempeño y el informe final toman del gestor lo que ya está calculado (valor ganado,
     cronograma, registros) para que el documento cuadre con las herramientas. */
  const LOADABLE = { 'informe-desempeno': 'perf', 'informe-final': 'final' };
  const round1 = (x) => Math.round(Number(x) * 10) / 10;
  const docTable = (idx, tid, key) => { const list = idx.byTemplate[tid] || []; const d = list.find((x) => x.id === tid) || list[0]; const v = d && d.fields && d.fields[key]; return Array.isArray(v) ? v.filter(isRow) : []; };
  const wdDelta = (cal, base, fc) => (!cal || !PM.date.valid(base) || !PM.date.valid(fc) || base === fc ? 0 : fc > base ? cal.countWork(PM.date.add(base, 1), fc) : -cal.countWork(PM.date.add(fc, 1), base));
  const wdText = (n) => PM.fmt.num(Math.abs(n)) + (Math.abs(n) === 1 ? ' día hábil' : ' días hábiles');
  const signedMoney = (v, cur) => (Number(v) > 0 ? '+' : '') + PM.fmt.money(v, cur);
  const lc = (s) => String(s || '').toLowerCase();
  /* Texto breve para resúmenes: recortado y sin puntuación final (se agrega la del renglón). */
  const brief = (s, n) => clip(String(s ?? '').trim().replace(/[\s.;:,]+$/, ''), n);
  const endDot = (s) => (/[.!?…]$/.test(s) ? s : s + '.');
  const fieldMap = (t) => Object.fromEntries(allFields(t).map((f) => [f.key, f]));
  const optOk = (c, v) => !c || !Array.isArray(c.options) || !c.options.length || c.options.map(normOpt).some((o) => String(o.value) === String(v));
  const pickCols = (f, row) => { const keys = new Set(((f && f.columns) || []).map((c) => c.key)); const out = { id: row.id }; for (const k of Object.keys(row)) if (keys.has(k)) out[k] = row[k]; return out; };
  /* Hitos del cronograma: fecha de la línea base del cronograma frente a la real o pronosticada. */
  function milestoneRows(m, f) {
    if (!f) return [];
    const est = ((f.columns || []).find((c) => c.key === 'estado')) || null;
    const bl = m.baselines && m.baselines.schedule && m.baselines.schedule.schedule;
    const blTasks = new Map(((bl && bl.tasks) || []).filter(isRow).map((x) => [x.id, x]));
    const at = m.statusDate, cal = m.sched.cal;
    const rows = [];
    for (const task of m.sched.tasks) {
      if (!task.milestone) continue;
      const b = blTasks.get(task.id);
      const base = b ? (PM.date.valid(b.start) ? b.start : PM.date.valid(b.finish) ? b.finish : null) : null;
      const done = Number(task.progress) >= 100 || PM.date.valid(task.actualFinish);
      const fc = PM.date.valid(task.actualFinish) ? task.actualFinish : PM.date.valid(task.startDate) ? task.startDate : task.finishDate;
      const delta = base && PM.date.valid(fc) ? wdDelta(cal, base, fc) : 0;
      const estado = done ? 'Cumplido' : base && delta > 0 ? (base < at ? 'Atrasado' : 'En riesgo') : PM.date.valid(fc) && fc < at ? 'Atrasado' : 'Pendiente';
      const comentario = !base ? '' : delta === 0 ? (done ? 'Cumplido en la fecha de la línea base.' : 'Según la línea base.') : delta > 0 ? wdText(delta) + ' después de la línea base' + (done ? '.' : ' (pronóstico).') : wdText(delta) + ' antes de la línea base.';
      const row = { id: PM.uid('r'), hito: task.name || 'Hito', fechaBase: base || '', fechaPronostico: PM.date.valid(fc) ? fc : '', comentario };
      if (optOk(est, estado)) row.estado = estado;
      rows.push(pickCols(f, row));
      if (rows.length >= 15) break;
    }
    return rows;
  }
  function riskLines(idx, n) {
    const rows = docTable(idx, 'registro-riesgos', 'riesgos').filter((r) => r.estado !== 'Cerrado');
    return rows.map((r) => ({ r, s: PM.calc.riskScore(r.probabilidad, r.impacto) })).sort((a, b) => b.s - a.s).slice(0, n).map(({ r, s }) => [r.id, brief(r.descripcion, 110)].filter(Boolean).join(' ') + ': ' + [s ? lc(PM.calc.riskLevel(s).label) + ' (' + s + ')' : 'sin evaluar', lc(r.estado), r.estrategia ? 'estrategia: ' + lc(r.estrategia) : ''].filter(Boolean).join(', ') + '.');
  }
  function incidentText(idx) {
    const rows = docTable(idx, 'registro-incidentes', 'incidentes');
    if (!rows.length) return '';
    const open = rows.filter((r) => r.estado !== 'Resuelto' && r.estado !== 'Cerrado');
    const closed = rows.filter((r) => r.estado === 'Resuelto' || r.estado === 'Cerrado');
    const L = [];
    if (open.length) {
      L.push('Abiertos:');
      for (const r of open.slice(0, 8)) L.push([r.id, brief(r.descripcion, 110)].filter(Boolean).join(' ') + ': ' + [lc(r.estado || 'Abierto'), r.prioridad ? 'prioridad ' + lc(r.prioridad) : '', r.responsable ? 'responsable: ' + r.responsable : '', PM.date.valid(r.fechaObjetivo) ? 'fecha objetivo ' + PM.fmt.date(r.fechaObjetivo) : ''].filter(Boolean).join(', ') + '.');
    } else L.push('No hay incidentes abiertos.');
    if (closed.length) L.push('Resueltos o cerrados: ' + closed.map((r) => r.id || brief(r.descripcion, 40)).join(', ') + '.');
    return L.join('\n');
  }
  function changesText(idx, from, at, currency) {
    const rows = docTable(idx, CL_TID, 'cambios');
    if (!rows.length) return '';
    const inP = (d) => PM.date.valid(d) && (!from || d >= from) && d <= at;
    const rel = rows.filter((r) => inP(r.fecha) || inP(r.fechaDecision) || r.estado === 'Registrada' || r.estado === 'En análisis');
    if (!rel.length) return 'Sin solicitudes de cambio registradas o decididas en el periodo.';
    return rel.map((r) => {
      const decided = r.estado === 'Aprobada' || r.estado === 'Rechazada' || r.estado === 'Diferida';
      const parts = [PM.isNum(r.impactoCronograma) && r.impactoCronograma !== '' ? (Number(r.impactoCronograma) > 0 ? '+' : Number(r.impactoCronograma) < 0 ? '−' : '') + wdText(Number(r.impactoCronograma)) : '', PM.isNum(r.impactoCosto) && r.impactoCosto !== '' ? signedMoney(r.impactoCosto, currency) : ''].filter(Boolean);
      return [r.id, brief(r.descripcion, 100)].filter(Boolean).join(' ') + ': ' + lc(r.estado || 'Registrada') + (decided && PM.date.valid(r.fechaDecision) ? ' el ' + PM.fmt.date(r.fechaDecision) : '') + (parts.length ? ' (' + parts.join('; ') + ')' : '') + '.';
    }).join('\n');
  }
  function perfProposals(m, idx, cur, t, docId, currency) {
    const fm = fieldMap(t); const values = {}, why = {}, notes = [];
    const set = (k, v, w) => { if (fm[k] && v !== undefined && v !== null && v !== '') { values[k] = v; if (w) why[k] = w; } };
    const { evm, sched, statusDate: at } = m;
    set('fechaCorte', at, 'Fecha de corte del proyecto (ficha del proyecto).');
    const prev = (idx.byTemplate['informe-desempeno'] || []).filter((d) => d.id !== docId).map((d) => d.fields && d.fields.fechaCorte).filter((x) => PM.date.valid(x) && x < at).sort().pop();
    const from = prev ? PM.date.add(prev, 1) : (PM.date.valid(cur.periodoInicio) ? cur.periodoInicio : null);
    if (prev) set('periodoInicio', from, 'Día siguiente al corte del informe anterior (' + PM.fmt.date(prev) + ').');
    if (evm && evm.bac > 0) {
      set('avancePlanificado', round1(evm.pctPlanned * 100), 'PV ÷ BAC al corte.');
      set('avanceReal', round1(evm.pctComplete * 100), 'EV ÷ BAC al corte.');
      if (fm.valorGanado) {
        const row = { corte: at, bac: Math.round(evm.bac), pv: Math.round(evm.pv), ev: Math.round(evm.ev), ac: Math.round(evm.ac) };
        const ex = Array.isArray(cur.valorGanado) ? cur.valorGanado.filter(isRow) : [];
        const i = ex.findIndex((r) => r.corte === at);
        const next = i >= 0 ? ex.map((r, j) => (j === i ? { ...r, ...row } : r)) : [...ex, { id: PM.uid('r'), ...row }];
        next.sort((a, b) => String(a.corte || '').localeCompare(String(b.corte || '')));
        set('valorGanado', next, i >= 0 ? 'Actualiza la fila del corte del ' + PM.fmt.date(at) + '; las demás filas no cambian.' : 'Agrega la fila del corte del ' + PM.fmt.date(at) + ' a las existentes.');
      }
      if (PM.isNum(evm.eac)) set('eacAdoptado', Math.round(evm.eac), 'EAC típico = BAC ÷ CPI. Ajústalo si adoptas otro pronóstico.');
    } else notes.push('Las actividades del cronograma no tienen presupuesto (BAC = 0), así que no hay avance ni valor ganado para cargar.');
    const ff = evm && PM.date.valid(evm.forecastFinish) ? evm.forecastFinish : sched && PM.date.valid(sched.finish) ? sched.finish : null;
    set('fechaFinPronosticada', ff, evm && PM.date.valid(evm.forecastFinish) ? 'Pronóstico por cronograma ganado (SPI(t)).' : 'Fin del cronograma actualizado al corte.');
    const hitos = milestoneRows(m, fm.hitos);
    if (hitos.length) set('hitos', hitos, m.baselines && m.baselines.schedule ? 'Hitos del cronograma frente a la línea base ' + (m.baselines.schedule.label || '') + '.' : 'Hitos del cronograma. Sin línea base del cronograma, la fecha de línea base queda vacía.');
    const rk = riskLines(idx, 5);
    if (rk.length) set('riesgosPrincipales', rk.join('\n'), 'Riesgos abiertos de mayor puntuación (registro de riesgos).');
    set('incidentesRelevantes', incidentText(idx), 'Registro de incidentes.');
    set('cambiosPeriodo', changesText(idx, from, at, currency), from ? 'Cambios registrados o decididos entre el ' + PM.fmt.date(from) + ' y el corte, y los pendientes de decisión.' : 'Registro de cambios (sin inicio del periodo se incluyen todos).');
    return { values, why, notes };
  }
  function finalProposals(m, idx, cur, t, currency) {
    const fm = fieldMap(t); const values = {}, why = {}, notes = [];
    const set = (k, v, w) => { if (fm[k] && v !== undefined && v !== null && v !== '') { values[k] = v; if (w) why[k] = w; } };
    const { evm, sched, baselines, costs, statusDate: at } = m;
    const tasks = (sched && sched.tasks) || [];
    const starts = tasks.map((x) => x.actualStart).filter(PM.date.valid).sort();
    if (starts.length) set('fechaInicioReal', starts[0], 'Primera fecha de inicio real registrada en el cronograma.');
    else if (PM.date.valid(sched.start) && tasks.some((x) => Number(x.progress) > 0)) set('fechaInicioReal', sched.start, 'Inicio del cronograma: no hay fechas de inicio real registradas.');
    const bl = baselines && baselines.schedule;
    const blFinish = bl && bl.schedule && PM.date.valid(bl.schedule.finish) ? bl.schedule.finish : null;
    if (blFinish) set('fechaFinPlan', blFinish, 'Fin de la línea base del cronograma ' + (bl.label || '') + '.');
    const allDone = tasks.length > 0 && tasks.every((x) => Number(x.progress) >= 100);
    const fins = tasks.map((x) => (PM.date.valid(x.actualFinish) ? x.actualFinish : x.finishDate)).filter(PM.date.valid).sort();
    const realEnd = allDone ? fins[fins.length - 1] : null;
    if (realEnd) set('fechaFinReal', realEnd, 'Última fecha de terminación del cronograma. Si el acta de cierre se firmó después, usa esa fecha.');
    else if (tasks.length) notes.push('Hay actividades sin terminar: la fecha de fin real se carga cuando todas estén al 100 %.');
    const actuals = ((costs && costs.actuals) || []).filter((a) => isRow(a) && PM.isNum(a.amount));
    if (actuals.length) set('costoFinal', Math.round(PM.sum(actuals, (a) => Number(a.amount) || 0)), 'Suma de los ' + actuals.length + ' costos reales registrados' + (allDone ? '.' : '; el proyecto aún no termina.'));
    if (tasks.length) {
      const fin = realEnd || (evm && PM.date.valid(evm.forecastFinish) ? evm.forecastFinish : sched.finish);
      const L = [];
      if (blFinish) L.push('Fin de la línea base del cronograma (' + (bl.label || 'vigente') + '): ' + PM.fmt.date(blFinish, 'long') + '.');
      if (PM.date.valid(fin)) { const d = blFinish ? wdDelta(sched.cal, blFinish, fin) : 0; L.push('Fin ' + (realEnd ? 'real' : 'pronosticado') + ': ' + PM.fmt.date(fin, 'long') + (blFinish ? (d ? ' (' + wdText(d) + (d > 0 ? ' de atraso' : ' de adelanto') + ').' : ' (sin variación).') : '.')); }
      if (evm && PM.isNum(evm.spi)) L.push('SPI ' + PM.fmt.idx(evm.spi) + (PM.isNum(evm.spiT) ? ' · SPI(t) ' + PM.fmt.idx(evm.spiT) : '') + ' al corte del ' + PM.fmt.date(at, 'long') + '.');
      const ms = milestoneRows(m, { columns: [{ key: 'hito' }, { key: 'fechaBase' }, { key: 'fechaPronostico' }, { key: 'comentario' }] }).filter((r) => r.fechaBase && r.fechaPronostico && r.fechaBase !== r.fechaPronostico).slice(0, 6);
      for (const r of ms) L.push(r.hito + ': ' + PM.fmt.date(r.fechaBase) + ' en la línea base → ' + PM.fmt.date(r.fechaPronostico) + '. ' + r.comentario);
      set('cronogramaFinal', L.join('\n'), 'Resumen del cronograma frente a la línea base.');
    }
    if (evm && evm.bac > 0) {
      const L = ['Presupuesto de las actividades (BAC): ' + PM.fmt.money(evm.bac, currency) + (evm.reserves && (evm.reserves.contingency || evm.reserves.management) ? '; reserva para contingencias ' + PM.fmt.money(evm.reserves.contingency, currency) + ' y reserva de gestión ' + PM.fmt.money(evm.reserves.management, currency) : '') + '.',
        'Costo real (AC) al ' + PM.fmt.date(at, 'long') + ': ' + PM.fmt.money(evm.ac, currency) + '; valor ganado (EV): ' + PM.fmt.money(evm.ev, currency) + '.'];
      if (PM.isNum(evm.cpi)) L.push('CPI ' + PM.fmt.idx(evm.cpi) + (PM.isNum(evm.eac) ? '; EAC ' + PM.fmt.money(evm.eac, currency) : '') + (PM.isNum(evm.vac) ? '; VAC ' + PM.fmt.money(evm.vac, currency) : '') + '.');
      set('costoFinalAnalisis', L.join('\n'), 'Indicadores de valor ganado al corte.');
    }
    const risks = docTable(idx, 'registro-riesgos', 'riesgos');
    if (risks.length) {
      const mat = risks.filter((r) => r.estado === 'Materializado');
      const n = (e) => risks.filter((r) => r.estado === e).length;
      const L = [risks.length + ' riesgos registrados: ' + n('Cerrado') + ' cerrados, ' + (n('Abierto') + n('En seguimiento')) + ' abiertos o en seguimiento y ' + mat.length + ' materializados.'];
      for (const r of mat.slice(0, 6)) L.push(endDot([r.id, brief(r.descripcion, 110)].filter(Boolean).join(' ') + (r.respuesta ? ': ' + brief(r.respuesta, 160) : '')));
      set('resumenRiesgos', L.join('\n'), 'Registro de riesgos.');
    }
    set('resumenIncidentes', incidentText(idx), 'Registro de incidentes.');
    return { values, why, notes };
  }
  const cmpVal = (v) => JSON.stringify(Array.isArray(v) ? v.map((r) => (isRow(r) ? (({ id, ...rest }) => rest)(r) : r)) : v ?? null);

  function LoadDataModal({ close, t, res, cur, currency, onApply, title }) {
    const fm = useMemo(() => fieldMap(t), [t]);
    const keys = useMemo(() => allFields(t).map((f) => f.key).filter((k) => k in res.values && cmpVal(cur[k]) !== cmpVal(res.values[k])), [t, res]);
    const [pick, setPick] = useState(() => new Set(keys.filter((k) => isEmptyVal(cur[k]) || k === 'valorGanado')));
    const toggle = (k) => setPick((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
    const apply = () => {
      const vals = {};
      for (const k of keys) if (pick.has(k)) vals[k] = PM.clone(res.values[k]);
      const n = Object.keys(vals).length;
      if (!n) return;
      onApply(vals);
      close();
      PM.toast(n === 1 ? 'Se cargó 1 campo con los datos del gestor.' : 'Se cargaron ' + n + ' campos con los datos del gestor.');
    };
    return html`<${ui.Modal} size="wide" title=${title} subtitle=${t.name} onClose=${close} footer=${keys.length
      ? html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="check" disabled=${!pick.size} onClick=${apply}>Aplicar selección (${pick.size})</${ui.Button}>`
      : html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
      <div class="stack" data-load-modal>
        ${keys.length ? html`<p class="small muted">Marca los campos que quieres cargar. Vienen marcados los que están vacíos; los demás reemplazarían lo que ya escribiste. Nada cambia hasta que pulses «Aplicar selección».</p>`
          : html`<p class="small">El documento ya tiene los mismos datos que calcula el gestor; no hay nada nuevo para cargar.</p>`}
        ${res.notes.map((n, i) => html`<div class="docs-callout is-info" key=${'n' + i}><${ui.Icon} name="info" size=${16} /><span>${n}</span></div>`)}
        ${keys.map((k) => { const f = fm[k]; return html`<div class="docs-ai-item" key=${k} data-load-field=${k}>
          <${ui.Check} checked=${pick.has(k)} onValue=${() => toggle(k)} label=${html`<strong>${f.label}</strong>`} />
          ${res.why[k] ? html`<span class="docs-ai-why">${res.why[k]}</span>` : null}
          <div class=${cx('docs-cmp', f.type === 'table' && 'is-stack')}>
            <div><span class="label-caps">Actual</span><${FieldView} f=${f} value=${cur[k]} currency=${currency} /></div>
            <div class="is-new"><span class="label-caps">Datos del gestor</span><${FieldView} f=${f} value=${res.values[k]} currency=${currency} /></div>
          </div>
        </div>`; })}
      </div>
    </${ui.Modal}>`;
  }

  /* Aviso con la acción de carga; usa el modelo del proyecto (solo se monta en los informes que lo necesitan). */
  function ReportDataCallout({ tid, t, idx, docId, project, getFields, onApply }) {
    const m = PM.useProjectModel();
    const kind = LOADABLE[tid];
    const currency = project.currency || 'COP';
    const label = kind === 'perf' ? 'Cargar datos al corte' : 'Cargar datos del proyecto';
    const open = () => {
      const cur = getFields();
      const res = kind === 'perf' ? perfProposals(m, idx, cur, t, docId, currency) : finalProposals(m, idx, cur, t, currency);
      if (!Object.keys(res.values).length) { PM.toast('Todavía no hay datos calculados para cargar: crea el cronograma con el presupuesto de las actividades y registra el avance y los costos reales.'); return; }
      PM.openModal((close) => html`<${LoadDataModal} close=${close} t=${t} res=${res} cur=${cur} currency=${currency} onApply=${onApply} title=${label} />`);
    };
    const text = kind === 'perf'
      ? 'El gestor ya calcula el avance, el valor ganado y los pronósticos al corte del ' + PM.fmt.date(m.statusDate, 'long') + '. Cárgalos junto con los hitos, los riesgos, los incidentes y los cambios para que el informe cuadre con las herramientas.'
      : 'El gestor ya tiene las fechas del cronograma, los costos reales y los registros del proyecto. Cárgalos para que el informe final cuadre con las herramientas.';
    return html`<div class="docs-callout is-info" data-callout="datos-gestor"><${ui.Icon} name="scurve" size=${16} /><div class="docs-callout-body">
      <span>${text}</span>
      <div class="row"><${ui.Button} size="sm" icon="refresh" disabled=${m.loading} onClick=${open}>${label}</${ui.Button}>${kind === 'perf' && PM.getView('valor-ganado') ? html`<${ui.Button} size="sm" variant="ghost" icon="scurve" onClick=${() => PM.navigate('valor-ganado')}>Ver curva S y valor ganado</${ui.Button}>` : null}</div>
    </div></div>`;
  }

  /* ------------------------------------------------------------------ editor de documento */
  function Editor({ project, docId, templateId }) {
    const pid = project.id;
    const r = PM.useDoc(PM.paths.doc(pid, docId));
    const idx = PM.useProjectDocs();
    const st = PM.useAppState();
    const canWrite = !!st.canWrite;
    const exists = !!(r.exists && r.data);
    const tid = (exists && r.data.template) || templateId || PM.docTemplateOf(docId);
    const realT = PM.templates[tid] || null;
    const t = useMemo(() => realT || (exists ? pseudoTemplate(tid, r.data) : null), [realT, tid, exists ? r.data : null]);
    const multiple = !!(realT && realT.multiple);
    const virtual = useMemo(() => (realT ? PM.newDocBody(realT, project, { template: tid }) : null), [realT, tid]);
    const doc = exists ? r.data : virtual;
    /* bodyRef: último cuerpo conocido (guardado o recién editado) para encadenar ediciones rápidas. */
    const bodyRef = useRef(null);
    const seenRef = useRef(undefined);
    if (seenRef.current !== r.data) { seenRef.current = r.data; bodyRef.current = exists ? r.data : null; }
    const insts = idx.byTemplate[tid] || [];
    const isInst = multiple || String(docId).includes('--');
    const seq = exists && Number.isFinite(r.data.seq) ? r.data.seq : exists ? seqMap(insts).get(docId) || nextSeq(insts.filter((d) => d.id !== docId)) : nextSeq(insts);
    const bcode = baseCode(project, tid);
    const code = isInst ? bcode + '-' + pad2(seq) : bcode;
    const defaultTitle = realT ? (multiple ? realT.name + ' ' + pad2(seq) : realT.name) : prettyId(tid);
    const title = (exists && r.data.title) || defaultTitle;
    const status = exists ? statusOf(r.data) : 'borrador';
    const rev = exists ? r.data.rev || null : null;
    const editable = canWrite && !!realT && (status === 'borrador' || status === 'revision');
    const fields = useMemo(() => resolveFields(t, doc ? doc.fields : null, project), [t, doc, project]);
    const editableRef = useRef(editable);
    editableRef.current = editable;
    const [pending, setPending] = useState(false);
    const [edited, setEdited] = useState(false);
    const [aiOk, setAiOk] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);
    useEffect(() => {
      let live = true;
      if (aiDenied) return undefined;
      Promise.resolve().then(() => PM.ai.available()).then((ok) => { if (live && !aiDenied) setAiOk(!!ok); }).catch(() => {});
      return () => { live = false; };
    }, []);
    useEffect(() => { if (exists) PM.prefs.set('docs.last', { pid, docId }); }, [exists, pid, docId]);
    const { docs: revDocs } = PM.useCollection(exists ? PM.paths.revs(pid, docId) : null);
    /* 4.6: la solicitud de cambio se vincula con su fila del registro de cambios. */
    const isCR = tid === CR_TID && !!PM.templates[CL_TID];
    const clDoc = PM.useDoc(isCR ? PM.paths.doc(pid, CL_TID) : null);
    const [clBusy, setClBusy] = useState(false);
    /* Panel lateral: en documentos con tablas va debajo del contenido para que las tablas usen todo el ancho. */
    const hasTables = useMemo(() => allFields(t).some((f) => f.type === 'table'), [t]);
    const panelKey = 'docs.panel.' + (hasTables ? 'tablas' : 'texto');
    const [, setPanelTick] = useState(0);
    const panelPref = PM.prefs.get(panelKey, null);
    const panel = panelPref === 'lado' || panelPref === 'abajo' ? panelPref : hasTables ? 'abajo' : 'lado';

    if (r.loading) return html`<div class="page"><${ui.Loading} rows=${6} /></div>`;
    if (!t) {
      return html`<div class="page"><${ui.Empty} icon="file" title="No se encontró el documento" actions=${html`<${ui.Button} variant="primary" icon="files" onClick=${() => PM.navigate('documentos')}>Ir a la lista de documentos</${ui.Button}>`}>
        ${PM.templateList.length ? 'Puede que se haya eliminado o que el enlace corresponda a otro proyecto.' : 'Las plantillas de documentos no están disponibles en esta versión del gestor, así que no se puede crear este documento.'}
      </${ui.Empty}></div>`;
    }

    const currency = project.currency || 'COP';
    const codeFor = (b) => (isInst ? bcode + '-' + pad2(Number.isFinite(b.seq) ? b.seq : seq) : bcode);
    const createBody = () => {
      const now = PM.nowIso(); const me = PM.getState().meId || null;
      const b = PM.clone(virtual || PM.newDocBody(realT, project, { template: tid }));
      Object.assign(b, { template: tid, createdAt: now, updatedAt: now, createdBy: me, updatedBy: me });
      if (multiple) { b.seq = nextSeq(insts); b.title = realT.name + ' ' + pad2(b.seq); }
      return b;
    };
    const markPending = () => {
      setPending(true); setEdited(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setPending(false), 900);
    };
    const commit = (mut, opts = {}) => {
      if (!canWrite || !realT) return Promise.resolve();
      const base = PM.clone(bodyRef.current || createBody());
      if (!base.fields || typeof base.fields !== 'object') base.fields = {};
      base.titleBlock = { codigo: '', elaboro: '', reviso: '', aprobo: '', fechaAprobacion: null, ...(base.titleBlock || {}) };
      if (!base.template) base.template = tid;
      mut(base);
      base.titleBlock.codigo = codeFor(base);
      base.updatedAt = PM.nowIso();
      base.updatedBy = PM.getState().meId || null;
      bodyRef.current = base;
      if (!opts.silent) markPending();
      PM.touchProject(pid);
      return opts.now ? r.saveNow(base) : r.save(base);
    };
    const setField = (key, v) => commit((b) => { b.fields[key] = v; });
    const setTb = (key, v) => commit((b) => { b.titleBlock[key] = v; });
    const setTitle = (v) => commit((b) => { b.title = v; });

    /* Emisión: guarda el documento y una instantánea en revs/. */
    const issue = async ({ status: ns, rev: nr, note, tbPatch, toast }) => {
      const now = PM.nowIso(); const me = PM.getState().meId || null;
      let snap = null;
      await commit((b) => {
        b.fields = resolveFields(t, b.fields, project);
        b.status = ns; b.rev = nr;
        Object.assign(b.titleBlock, tbPatch || {});
        b.titleBlock.codigo = codeFor(b);
        snap = { rev: nr, status: ns, date: now, byId: me, note: note || '', fields: PM.clone(b.fields), titleBlock: PM.clone(b.titleBlock), title: b.title || '' };
      }, { now: true, silent: true });
      if (!snap) return;
      try { await PM.store.set(PM.paths.rev(pid, docId, PM.uid('rev')), snap); } catch (e) { return; /* el núcleo ya avisó del error */ }
      let extra = null;
      if (isCR) { try { extra = await syncChangeLog(snap.fields); } catch (e) { extra = null; } }
      PM.toast(extra ? toast + ' ' + extra : toast);
    };
    /* Crea o actualiza la fila de la solicitud en el registro de cambios. Devuelve el mensaje para el usuario o null. */
    const syncChangeLog = async (flds) => {
      if (!isCR || !canWrite || clDoc.loading) return null;
      const stNow = changeLinkState(flds, clDoc, idx.byTemplate[CR_TID], docId);
      if (stNow.kind !== 'missing' && stNow.kind !== 'differs') return null;
      const regT = PM.templates[CL_TID];
      const base = clDoc.exists && clDoc.data ? PM.clone(clDoc.data) : PM.newDocBody(regT, project, { template: CL_TID });
      base.fields = { ...(base.fields || {}) };
      const rows = Array.isArray(base.fields.cambios) ? base.fields.cambios.filter(isRow) : [];
      const row = stNow.row;
      const i = rows.findIndex((x) => sameCode(x.id, row.id));
      let estado;
      if (i >= 0) {
        const next = { ...rows[i] };
        for (const [k] of CR_KEY_MAP) if (row[k] !== undefined) next[k] = row[k];
        for (const [k] of CR_TEXT_MAP) if (row[k] !== undefined && isEmptyVal(next[k])) next[k] = row[k];
        rows[i] = next; estado = next.estado;
      } else {
        const f = changeLogField();
        const init = f ? makeNewRow(f, regT)(rows) : {};
        const next = { ...init, ...row };
        rows.push(next); estado = next.estado;
      }
      base.fields.cambios = rows;
      base.titleBlock = { codigo: '', elaboro: '', reviso: '', aprobo: '', fechaAprobacion: null, ...(base.titleBlock || {}) };
      if (!base.titleBlock.codigo) base.titleBlock.codigo = baseCode(project, CL_TID);
      base.updatedAt = PM.nowIso(); base.updatedBy = PM.getState().meId || null;
      await clDoc.saveNow(base);
      PM.touchProject(pid);
      const lock = clDoc.exists && statusOf(base) === 'aprobado' ? ' El registro de cambios está aprobado: crea una nueva revisión para emitir la actualización.' : '';
      return (i >= 0 ? 'Se actualizó ' + row.id + ' en el registro de cambios.' : row.id + ' quedó en el registro de cambios' + (estado ? ' con estado «' + estado + '».' : '.')) + lock;
    };
    const curFields = () => resolveFields(t, (bodyRef.current || virtual || {}).fields, project);
    /* Aviso del diálogo de emisión sobre lo que pasará con el registro de cambios. */
    const changeIssueInfo = () => {
      if (!isCR || !canWrite) return null;
      const s2 = changeLinkState(curFields(), clDoc, idx.byTemplate[CR_TID], docId);
      if (s2.kind === 'missing') return 'Al emitir, ' + s2.row.id + ' se registrará en el registro de cambios' + (s2.row.estado ? ' con estado «' + s2.row.estado + '»' : '') + '.';
      if (s2.kind === 'differs') return 'Al emitir, se actualizará ' + s2.row.id + ' en el registro de cambios: ' + changeDiffText(s2, project.currency || 'COP') + '.';
      if (s2.kind === 'nocode') return 'La solicitud no tiene código del cambio, así que no se registrará en el registro de cambios.';
      if (s2.kind === 'dup') return 'Otra solicitud usa el código ' + s2.row.id + ', así que el registro de cambios no se actualizará.';
      return null;
    };
    const doSyncChange = async () => {
      setClBusy(true);
      try { const msg = await syncChangeLog(curFields()); if (msg) PM.toast(msg); } catch (e) { /* el núcleo ya avisó del error */ } finally { setClBusy(false); }
    };
    const nextDraft = PM.calc.nextDraftRev(rev);
    /* Campos obligatorios de la plantilla que siguen vacíos en el contenido actual. */
    const missingRequired = () => {
      const cur = resolveFields(t, (bodyRef.current || virtual || {}).fields, project);
      return allFields(t).filter((f) => f.required && f.type !== 'check' && (f.type === 'list'
        ? !(Array.isArray(cur[f.key]) ? cur[f.key] : [cur[f.key]]).some((x) => String(x ?? '').trim())
        : isEmptyVal(cur[f.key]) || (typeof cur[f.key] === 'string' && !cur[f.key].trim())));
    };
    const focusField = (key) => {
      const host = document.querySelector('[data-field="' + key + '"]');
      if (!host) return;
      host.scrollIntoView({ block: 'center' });
      const el = host.querySelector('input, textarea, select, button');
      if (el) el.focus({ preventScroll: true });
    };
    const tbNow = (doc && doc.titleBlock) || {};
    const doEmitDraft = async () => {
      const res = await issueDialog({ title: 'Emitir borrador ' + nextDraft, intro: 'Se registrará la revisión ' + nextDraft + ' en el historial con el contenido actual. El documento sigue en borrador y puedes seguir editándolo.', confirmText: 'Emitir borrador ' + nextDraft, info: changeIssueInfo() });
      if (res) await issue({ status: 'borrador', rev: nextDraft, note: res.note, toast: 'Borrador ' + nextDraft + ' emitido.' });
    };
    const doSendReview = async () => {
      const rv = rev || nextDraft;
      const res = await issueDialog({ title: 'Enviar a revisión', intro: 'La revisión ' + rv + ' quedará «En revisión» y se registrará en el historial. Puedes seguir ajustándola mientras se revisa.', confirmText: 'Enviar a revisión', missing: missingRequired(), info: changeIssueInfo() });
      if (res) await issue({ status: 'revision', rev: rv, note: res.note, toast: 'Documento enviado a revisión (revisión ' + rv + ').' });
    };
    const doApprove = async () => {
      const miss = missingRequired();
      if (miss.length) {
        PM.openModal((close) => html`<${ui.Modal} title="Faltan campos obligatorios" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}><${ui.Button} variant="primary" icon="edit" onClick=${() => { close(); focusField(miss[0].key); }}>Ir al primer campo</${ui.Button}>`}>
          <p>Para aprobar y emitir el documento, completa ${miss.length === 1 ? 'este campo obligatorio, marcado' : 'estos campos obligatorios, marcados'} con <span style="color:var(--crit)">*</span> en el formulario:</p>
          <ul class="docs-tips" data-missing=${miss.map((f) => f.key).join(',')}>${miss.map((f) => html`<li key=${f.key}>${f.label}</li>`)}</ul>
        </${ui.Modal}>`);
        return;
      }
      const nr = PM.calc.approvedRev(rev);
      const res = await issueDialog({ title: 'Aprobar y emitir revisión ' + nr, intro: 'Se emitirá la revisión ' + nr + ' como aprobada, con fecha de aprobación de hoy (' + PM.fmt.date(PM.date.today()) + '). El documento quedará bloqueado; para modificarlo después tendrás que crear una nueva revisión.', confirmText: 'Aprobar y emitir', approver: true, aprobo: tbNow.aprobo, info: changeIssueInfo() });
      if (res) await issue({ status: 'aprobado', rev: nr, note: res.note, tbPatch: { fechaAprobacion: PM.date.today(), aprobo: res.aprobo || tbNow.aprobo || '' }, toast: 'Revisión ' + nr + ' aprobada y emitida.' });
    };
    const doNewRevision = async () => {
      const ok = await PM.confirm({
        title: 'Crear nueva revisión (' + nextDraft + ')',
        body: html`<div class="stack-sm"><p>El documento se desbloqueará como borrador ${nextDraft} a partir del contenido de la revisión ${rev || 'vigente'}. La revisión aprobada queda guardada en el historial.</p>${BASELINE_DOCS.has(tid) ? html`<p class="small muted">Este documento forma parte de la línea base: verifica que exista una solicitud de cambio aprobada en el registro de cambios antes de modificarlo.</p>` : null}</div>`,
        confirmText: 'Crear revisión ' + nextDraft,
      });
      if (!ok) return;
      await commit((b) => { b.status = 'borrador'; b.rev = nextDraft; b.titleBlock.fechaAprobacion = null; }, { now: true, silent: true });
      PM.toast('Revisión ' + nextDraft + ' abierta como borrador.');
    };
    const doObsolete = async () => {
      const res = await issueDialog({ title: 'Marcar como obsoleto', intro: 'El documento dejará de estar vigente y quedará bloqueado. El cambio se registra en el historial; podrás reactivarlo creando una nueva revisión.', confirmText: 'Marcar como obsoleto', danger: true });
      if (res) await issue({ status: 'obsoleto', rev, note: res.note, toast: 'Documento marcado como obsoleto.' });
    };
    const doDelete = async () => {
      const n = revDocs.length;
      const ok = await PM.confirm({
        title: 'Eliminar documento',
        body: html`<div class="stack-sm"><p>Se eliminará <strong>${title}</strong> (${code})${n ? (n === 1 ? ' junto con su revisión emitida' : ' junto con sus ' + n + ' revisiones emitidas') : ''}. Esta acción no se puede deshacer.</p>${SHARED_DOCS.has(tid) ? html`<p class="small">Otras vistas del gestor (tablero, matrices y gráficos) leen los datos de este registro y dejarán de mostrarlos.</p>` : null}<p class="small muted">Si necesitas conservarlo, expórtalo antes de eliminarlo.</p></div>`,
        confirmText: 'Eliminar documento', tone: 'danger',
      });
      if (!ok) return;
      try {
        await PM.flushAll();
        const revs = await PM.store.list(PM.paths.revs(pid, docId));
        for (const x of revs) await PM.store.delete(PM.paths.rev(pid, docId, x.id));
        await PM.store.delete(PM.paths.doc(pid, docId));
        PM.touchProject(pid);
        const last = PM.prefs.get('docs.last', null);
        if (last && last.docId === docId) PM.prefs.set('docs.last', null);
        PM.toast('Documento eliminado.');
        PM.navigate('documentos');
      } catch (e) { PM.toast('No se pudo eliminar el documento por completo. Intenta de nuevo.', { tone: 'crit' }); }
    };
    const exportDoc = (kind) => {
      const ctx = { t, doc: doc || {}, fields, project, code, title, status: exists ? status : 'sin', exists };
      const name = fileSafe(code) + '_' + (rev ? 'Rev' + rev : 'SinEmitir') + '.' + kind;
      PM.download(name, kind === 'md' ? buildMarkdown(ctx) : buildHtml(ctx));
    };
    const openHistory = () => PM.openModal((close) => html`<${HistoryModal} close=${close} pid=${pid} docId=${docId} t=${t} project=${project} code=${code} title=${title} canRestore=${() => editableRef.current} onRestore=${(s) => commit((b) => { b.fields = PM.clone(s.fields || {}); }, { now: true })} />`);
    const openAi = () => PM.openModal((close) => html`<${AiModal} close=${close} t=${t} project=${project} idx=${idx} tid=${tid} getFields=${curFields} onApply=${(vals) => commit((b) => { Object.assign(b.fields, vals); })} onDenied=${() => setAiOk(false)} />`);

    const a = areaOf(t.area);
    const proc = t.process ? processOf(t.process) : null;
    const eyebrow = [kindLabel(t.kind), t.process ? t.process + (proc ? ' ' + proc.name : '') : ''].filter(Boolean).join(' · ') || 'Documento';
    const revCount = revDocs.length;
    const moreItems = [];
    if (kbReady() && t.process && proc) moreItems.push({ label: 'Ver proceso en el mapa', icon: 'map', onClick: () => PM.navigate('procesos', { process: t.process }) });
    if (exists && canWrite && realT && status !== 'obsoleto') moreItems.push({ label: 'Marcar como obsoleto', icon: 'lock', onClick: doObsolete });
    if (exists && canWrite) { if (moreItems.length) moreItems.push('sep'); moreItems.push({ label: 'Eliminar documento', icon: 'trash', danger: true, onClick: doDelete }); }
    const headerActions = html`<div class="docs-actions row">
      <${ui.Button} icon="history" onClick=${openHistory} disabled=${!exists}>Historial${revCount ? html`<span class="code-tag">${revCount}</span>` : null}</${ui.Button}>
      <${ui.Dropdown} label="Exportar documento" icon="download" variant="" size="" align="left" buttonLabel="Exportar" items=${[
        { label: 'Markdown (.md)', icon: 'file', onClick: () => exportDoc('md') },
        { label: 'HTML para imprimir (.html)', icon: 'download', onClick: () => exportDoc('html') },
      ]} />
      ${aiOk && editable ? html`<${ui.Button} icon="sparkles" onClick=${openAi}>Redactar con Claude</${ui.Button}>` : null}
      ${moreItems.length ? html`<${ui.Dropdown} label="Más acciones del documento" variant="" size="" items=${moreItems} />` : null}
    </div>`;
    const titleNode = multiple && editable
      ? html`<${TitleInput} value=${exists ? r.data.title || '' : ''} fallback=${defaultTitle} onValue=${setTitle} />`
      : title;
    let workflow = null;
    if (canWrite && realT) {
      if (status === 'borrador') workflow = html`<${ui.Button} icon="send" onClick=${doEmitDraft}>Emitir borrador ${nextDraft}</${ui.Button}><${ui.Button} icon="eye" onClick=${doSendReview}>Enviar a revisión</${ui.Button}><${ui.Button} variant="primary" icon="check-circle" onClick=${doApprove}>Aprobar y emitir</${ui.Button}>`;
      else if (status === 'revision') workflow = html`<${ui.Button} icon="undo" onClick=${doEmitDraft}>Emitir borrador ${nextDraft}</${ui.Button}><${ui.Button} variant="primary" icon="check-circle" onClick=${doApprove}>Aprobar y emitir</${ui.Button}>`;
      else workflow = html`<${ui.Button} variant="primary" icon="edit" onClick=${doNewRevision}>Crear nueva revisión (${nextDraft})</${ui.Button}>`;
    }
    const tb = (doc && doc.titleBlock) || {};
    const showBaseline = BASELINE_DOCS.has(tid) && status === 'aprobado';
    return html`<div class="page" data-doc-id=${docId}>
      <nav class="docs-crumbs" aria-label="Ruta de navegación">
        <button type="button" onClick=${() => PM.navigate('documentos')}>Documentos</button>
        <${ui.Icon} name="chevron-right" size=${12} />
        ${a ? html`<button type="button" onClick=${() => PM.navigate('documentos', { area: a.id })}>${a.num}. ${areaShort(a)}</button><${ui.Icon} name="chevron-right" size=${12} />` : null}
        <span aria-current="page">${title}</span>
      </nav>
      <${ui.PageHeader} eyebrow=${eyebrow} title=${titleNode} actions=${headerActions} />
      <div class="docs-bar">
        <div class="docs-bar-info">
          <${StatusChip} status=${exists ? status : 'sin'} />
          <span>Revisión <span class="docs-rev" data-rev=${rev || ''}>${rev || '—'}</span></span>
          <span class="mono xsmall">${code}</span>
          <span class="xsmall faint">${exists ? 'Actualizado ' + PM.fmt.datetime(r.data.updatedAt) : 'Aún no creado'}</span>
          ${canWrite && realT ? html`<${SaveState} pending=${pending} edited=${edited && editable} exists=${exists} editable=${editable} />` : null}
        </div>
        ${workflow ? html`<div class="row">${workflow}</div>` : null}
      </div>
      ${!exists && canWrite && realT ? html`<div class="docs-callout is-info" data-callout="nuevo"><${ui.Icon} name="info" size=${16} /><div class="docs-callout-body">
        <span>Este documento todavía no existe en el proyecto. Se creará automáticamente cuando escribas en cualquier campo${multiple ? ' o cambies su título' : ''}.</span>
        <div><${ui.Button} size="sm" variant="primary" icon="plus" onClick=${() => commit(() => {}, { now: true }).then(() => PM.toast('Documento creado.'))}>Crear documento</${ui.Button}></div>
      </div></div>` : null}
      ${!exists && !canWrite ? html`<div class="docs-callout"><${ui.Icon} name="lock" size=${16} /><span>Este documento aún no se ha creado en el proyecto. Se muestra la plantilla vacía en modo de consulta.</span></div>` : null}
      ${exists && !realT ? html`<div class="docs-callout is-warn"><${ui.Icon} name="alert" size=${16} /><span>La plantilla «${tid}» no está disponible en esta versión del gestor. Se muestran los datos guardados tal como están: puedes consultarlos, exportarlos o eliminar el documento, pero no editarlos.</span></div>` : null}
      ${exists && realT && status === 'aprobado' ? html`<div class="docs-callout is-good" data-callout="aprobado"><${ui.Icon} name="lock" size=${16} /><div class="docs-callout-body">
        <span>Revisión ${rev || '—'} aprobada${tb.fechaAprobacion ? ' el ' + PM.fmt.date(tb.fechaAprobacion, 'long') : ''}${tb.aprobo ? ' por ' + tb.aprobo : ''}. El contenido está bloqueado${canWrite ? '; para modificarlo crea una nueva revisión (' + nextDraft + ')' : ''}.</span>
        ${showBaseline ? html`<span>Este documento forma parte de la línea base: los cambios deben pasar por 4.6 Realizar el control integrado de cambios. Registra una solicitud de cambio y, cuando sea aprobada, crea la nueva revisión.</span>
          <div class="row">${PM.templates['solicitud-cambio'] && canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${() => PM.openDocument('solicitud-cambio')}>Nueva solicitud de cambio</${ui.Button}>` : null}${PM.templates['registro-cambios'] ? html`<${ui.Button} size="sm" variant="ghost" icon="checklist" onClick=${() => PM.openDocument('registro-cambios')}>Ver registro de cambios</${ui.Button}>` : null}</div>` : null}
      </div></div>` : null}
      ${exists && status === 'obsoleto' ? html`<div class="docs-callout is-warn"><${ui.Icon} name="alert" size=${16} /><span>Documento obsoleto: ya no está vigente y se conserva solo como consulta.${canWrite && realT ? ' Para reactivarlo, crea una nueva revisión (' + nextDraft + ').' : ''}</span></div>` : null}
      ${isCR ? html`<${ChangeLogCallout} st=${changeLinkState(fields, clDoc, idx.byTemplate[CR_TID], docId)} canWrite=${canWrite} editable=${editable} busy=${clBusy || clDoc.loading}
        regStatus=${clDoc.exists && clDoc.data ? statusOf(clDoc.data) : null} nextCode=${editable ? nextChangeCode(clDoc, idx.byTemplate[CR_TID]) : ''} currency=${currency} project=${project}
        onSync=${doSyncChange} onSetCode=${(c) => setField('codigoCambio', c)} />` : null}
      ${editable && LOADABLE[tid] ? html`<${ReportDataCallout} tid=${tid} t=${t} idx=${idx} docId=${docId} project=${project} getFields=${curFields} onApply=${(vals) => commit((b) => { Object.assign(b.fields, vals); })} />` : null}
      <${TitleBlock} project=${project} doc=${doc} code=${code} status=${exists ? status : 'sin'} exists=${exists} editable=${editable} onTb=${setTb} />
      <div class=${cx('docs-split', panel === 'abajo' && 'is-below')} data-panel=${panel}>
        <div class="stack-lg" style="gap:16px">
          ${(t.sections || []).map((s, i) => html`<${SectionBlock} key=${s.id || i} s=${s} i=${i} fields=${fields} editable=${editable} onField=${setField} currency=${currency} project=${project} t=${t} />`)}
          ${!(t.sections || []).length ? html`<${ui.Empty} icon="file" title="La plantilla no tiene secciones">No hay campos para diligenciar en este documento.</${ui.Empty}>` : null}
        </div>
        <${SidePanel} t=${t} tid=${tid} idx=${idx} doc=${doc} exists=${exists} status=${status} canWrite=${canWrite} panel=${panel} onTogglePanel=${() => { PM.prefs.set(panelKey, panel === 'lado' ? 'abajo' : 'lado'); setPanelTick((x) => x + 1); }} />
      </div>
    </div>`;
  }

  function DocumentView({ project, params }) {
    const p = params || {};
    const newKey = useMemo(() => PM.uid('d'), [params]);
    let docId = p.docId || null;
    const tpl = p.template || null;
    if (!docId && tpl) { const t = PM.templates[tpl]; if (!t || !t.multiple) docId = tpl; }
    if (!docId && !tpl) { const last = PM.prefs.get('docs.last', null); if (last && last.pid === project.id && last.docId) docId = last.docId; }
    if (docId) return html`<${Editor} key=${'d:' + docId} project=${project} docId=${docId} />`;
    if (tpl) return html`<${Editor} key=${'n:' + tpl + ':' + newKey} project=${project} docId=${tpl + '--' + newKey} templateId=${tpl} />`;
    return html`<div class="page">
      <${ui.PageHeader} eyebrow="Documentos" title="Ningún documento abierto" />
      <${ui.Empty} icon="file" title="Abre un documento desde la lista maestra" actions=${html`<${ui.Button} variant="primary" icon="files" onClick=${() => PM.navigate('documentos')}>Ir a la lista de documentos</${ui.Button}>${kbReady() ? html`<${ui.Button} icon="map" onClick=${() => PM.navigate('procesos')}>Mapa de procesos</${ui.Button}>` : null}`}>
        Desde la lista maestra o el mapa de procesos puedes crear, editar y emitir cada documento del proyecto.
      </${ui.Empty}>
    </div>`;
  }

  /* ------------------------------------------------------------------ registro de vistas */
  PM.registerView({ id: 'procesos', label: 'Mapa de procesos', group: 'proyecto', icon: 'map', order: 20, component: ProcessMapView, description: 'Los procesos de la Guía del PMBOK® por área y grupo, con el avance de sus documentos.' });
  PM.registerView({ id: 'documentos', label: 'Documentos', group: 'proyecto', icon: 'files', order: 30, component: DocumentsView, description: 'Lista maestra de documentos del proyecto: estado, revisión y exportación.' });
  PM.registerView({ id: 'documento', label: 'Documento', group: 'proyecto', icon: 'file', order: 31, hidden: true, component: DocumentView, description: 'Editor de documentos con cajetín, revisiones e historial.' });
})();

/* ==========================================================================
   46-agile-sprints.js — capa ágil (SPEC §9.4–§9.6): vistas «iteraciones»
   (Releases e iteraciones) y «metricas-agiles» (Métricas ágiles).
   - Releases: alta, edición y eliminación con limpieza de referencias; vínculo
     con un entregable adaptativo de la EDT y con una actividad del cronograma;
     presupuesto (BAC del release); línea base y control de cambios en dos
     niveles (solicitud de cambio, registro de cambios y nueva línea base).
   - Iteraciones: alta, generación según la duración configurada, planificación
     con capacidad y velocidad, inicio (fija el compromiso) y cierre (fija lo
     terminado; lo pendiente vuelve al backlog o pasa a la siguiente iteración),
     documentos de la iteración y envío de lecciones al registro.
   - Métricas: burndown, burnup, velocidad, flujo acumulado, pronóstico de
     terminación, valor ganado ágil (AgileEVM), tiempo de ciclo y rendimiento.
     Gráficos SVG propios con resumen accesible y tabla de datos.
   Los cálculos de base vienen de 07-agile-core.js (PM.calc / PM.agile).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib || !PM.agile || !PM.useAgileModel) return;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } = PM.lib;
  const ui = PM.ui;
  const D = PM.date;
  const fmt = PM.fmt;
  const num = PM.num;
  const cx = PM.cx;
  const A = PM.agile;
  const C = PM.calc;
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const arr = (x) => (Array.isArray(x) ? x.filter(isObj) : []);
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const NONE = '__none__';

  /* elementos del release al fijar su línea base: [{id, estimate}] (para comparar en la solicitud de cambio) */
  const baselineItems = (cur, relId) => (cur.idx.byRelease.get(relId) || []).filter((it) => PM.agile.countable(it)).map((it) => ({ id: it.id, estimate: PM.agile.estimate(it) }));

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.ags-root { container: agsroot / inline-size; }
.ags-layout { display: grid; grid-template-columns: minmax(250px, 320px) minmax(0, 1fr); gap: 16px; align-items: start; }
.ags-layout > * { min-width: 0; }
/* la lista lateral de releases solo cuando la columna principal tiene espacio para las tablas de iteraciones */
@container agsroot (max-width: 1179.98px) { .ags-layout { grid-template-columns: minmax(0, 1fr); } }
.ags-side { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ags-side-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 0 2px; }
.ags-rel-list { display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 0; padding: 0; }
@container agsroot (max-width: 1179.98px) { .ags-rel-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); } }
.ags-rel { display: flex; flex-direction: column; gap: 6px; width: 100%; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); cursor: pointer; font: inherit; box-shadow: var(--shadow-card); }
.ags-rel:hover { border-color: var(--line-strong); }
.ags-rel[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent), var(--shadow-card); }
.ags-rel[aria-pressed]:focus-visible { box-shadow: inset 3px 0 0 var(--accent), var(--focus); }
.ags-rel-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.ags-rel-name { font-weight: 600; font-size: var(--fs-sm); line-height: 1.3; overflow-wrap: anywhere; }
.ags-rel-meta { font-size: var(--fs-xs); color: var(--fg-3); font-family: var(--font-mono); }
.ags-rel-prog { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--fg-2); }
.ags-bar { position: relative; flex: 1; height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.ags-bar > span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--accent); }
.ags-chips { display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; }
.ags-chips .chip { white-space: normal; line-height: 1.35; padding-top: 1px; padding-bottom: 1px; }
.ags-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.ags-goal { color: var(--fg-2); max-width: 80ch; font-size: var(--fs-sm); }
.ags-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
.ags-tiles > .stat { padding: 10px 12px; box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.ags-tiles .stat-value { font-size: 1.25rem; overflow-wrap: anywhere; }
.ags-kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 14px; font-size: var(--fs-sm); margin: 0; }
.ags-kv dt { color: var(--fg-3); }
.ags-kv dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 560px) { .ags-kv { grid-template-columns: minmax(0, 1fr); } .ags-kv dd { margin-bottom: 4px; } .ags-title-cell { min-width: 130px; } .ags-btn-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; } }
.ags-callout { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; padding: 10px 14px; border: 1px solid var(--line); border-left: 3px solid var(--info); border-radius: var(--r-md); background: var(--info-wash); color: var(--fg); font-size: var(--fs-sm); line-height: 1.5; }
.ags-callout > .icon { margin-top: 2px; color: var(--info); }
.ags-callout[data-tone="warn"] { background: var(--warn-wash); border-left-color: var(--warn); }
.ags-callout[data-tone="warn"] > .icon { color: var(--warn); }
.ags-callout[data-tone="good"] { background: var(--good-wash); border-left-color: var(--good); }
.ags-callout[data-tone="good"] > .icon { color: var(--good); }
.ags-callout[data-tone="crit"] { background: var(--crit-wash); border-left-color: var(--crit); }
.ags-callout[data-tone="crit"] > .icon { color: var(--crit); }
.ags-callout-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ags-callout-body ul { margin: 0; padding-left: 18px; }
.ags-callout-body .row { margin-top: 2px; }
.ags-tbl td { vertical-align: middle; }
.ags-tbl tr.is-sel td { background: var(--accent-wash); }
.ags-tbl tr.is-sel td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
.ags-title-cell { min-width: 180px; overflow-wrap: anywhere; }
.ags-actions { white-space: nowrap; text-align: right; width: 1%; }
/* columna de acciones fija a la derecha: siempre visible aunque la tabla se desplace horizontalmente */
.ags-scroll .ags-tbl .ags-actions { position: sticky; right: 0; }
td.ags-actions { background: var(--surface); }
.ags-scroll .ags-tbl td.ags-actions { z-index: 1; }
.ags-scroll .ags-tbl th.ags-actions { z-index: 2; }
.ags-scroll[data-overflow="true"] .ags-tbl .ags-actions { box-shadow: inset 1px 0 0 var(--line-strong); }
.ags-scroll-hint { display: flex; align-items: center; gap: 6px; font-size: var(--fs-xs); color: var(--fg-3); }
.ags-scroll-hint > .icon { color: var(--fg-3); }
.ags-link { border: 0; background: none; padding: 0; font: inherit; color: var(--accent); cursor: pointer; text-align: left; font-weight: 600; }
.ags-link:hover { text-decoration: underline; }
.ags-link[aria-pressed="true"] { color: var(--fg); }
.ags-plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 560px), 1fr)); gap: 16px; align-items: start; }
.ags-plan-grid > * { min-width: 0; }
.ags-list-wrap { max-height: 460px; overflow: auto; }
.ags-sub { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.ags-form { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 12px 14px; }
.ags-form > .span-all { grid-column: 1 / -1; }
.ags-plan-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(140px, 200px); gap: 12px 14px; align-items: start; }
@media (max-width: 680px) { .ags-plan-form { grid-template-columns: minmax(0, 1fr); } }
.ags-commit { display: flex; flex-direction: column; gap: 6px; }
.ags-commit-track { position: relative; height: 12px; border-radius: 6px; background: var(--surface-3); margin: 4px 0; }
.ags-commit-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; background: var(--accent); }
.ags-commit-fill[data-over="true"] { background: var(--warn); }
.ags-commit-fill[data-started="true"] { opacity: 0.35; }
.ags-commit-done { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; background: var(--accent); }
.ags-commit-key { display: inline-flex; align-items: center; gap: 6px; }
.ags-commit-key > i { width: 12px; height: 8px; border-radius: 2px; background: var(--accent); display: inline-block; }
.ags-commit-key > i.is-light { opacity: 0.35; }
.ags-commit-key > i.is-cap { width: 2px; height: 12px; background: var(--fg); border-radius: 1px; }
/* alcance agregado después del inicio: trama (no solo color) */
.ags-commit-added { position: absolute; top: 0; bottom: 0; border-radius: 0 6px 6px 0; background: repeating-linear-gradient(135deg, var(--accent) 0 2px, transparent 2px 5px); box-shadow: inset 0 0 0 1px var(--accent); }
.ags-commit-key > i.is-added { background: repeating-linear-gradient(135deg, var(--accent) 0 2px, transparent 2px 4px); box-shadow: inset 0 0 0 1px var(--accent); }
.ags-commit-cap { position: absolute; top: -4px; width: 2px; height: 20px; margin-left: -1px; background: var(--fg); border-radius: 1px; box-shadow: 0 0 0 1px var(--surface); }
.ags-commit-text { font-size: var(--fs-xs); color: var(--fg-2); display: flex; flex-wrap: wrap; gap: 4px 16px; }
.ags-commit-text strong { color: var(--fg); font-weight: 600; }
.ags-flag { display: inline-flex; align-items: center; gap: 5px; font-size: var(--fs-xs); color: var(--fg); }
.ags-flag > .icon { color: var(--warn); }
.ags-flag[data-tone="crit"] > .icon { color: var(--crit); }
.ags-docs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 10px; }
.ags-doc { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); min-width: 0; }
.ags-doc-name { font-weight: 600; font-size: var(--fs-sm); display: flex; gap: 6px; align-items: center; }
.ags-doc-name > .icon { color: var(--fg-3); }
.ags-doc .btn { align-self: flex-start; }
.ags-radio-group { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.ags-radio-group legend { font-size: var(--fs-sm); font-weight: 600; padding: 0; margin-bottom: 6px; }
.ags-radio { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; font-size: var(--fs-sm); }
.ags-radio input { margin-top: 3px; accent-color: var(--accent); flex: none; }
.ags-radio:has(input:checked) { border-color: var(--accent); background: var(--accent-wash); }
.ags-radio:has(input:disabled) { opacity: 0.6; cursor: not-allowed; }
.ags-radio:has(input:focus-visible) { box-shadow: var(--focus); }
.ags-toolbar { gap: 10px 16px; align-items: flex-end; }
.ags-toolbar .field { flex: 0 1 260px; min-width: min(100%, 200px); }
.ags-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 16px; align-items: start; }
.ags-split { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 16px 24px; align-items: start; }
.ags-split > * { min-width: 0; }
.ags-charts > * { min-width: 0; }
.ags-charts > .span-all { grid-column: 1 / -1; }
.ags-chart { border-radius: var(--r-sm); }
.ags-chart:focus-visible { box-shadow: var(--focus); }
.ags-hit { cursor: crosshair; }
.ags-tip { display: flex; flex-direction: column; gap: 3px; min-width: 170px; }
.ags-tip-head { font-weight: 600; color: var(--fg); }
.ags-tip-row { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; gap: 8px; align-items: center; }
.ags-tip-row strong { font-family: var(--font-mono); font-weight: 600; color: var(--fg); text-align: right; white-space: nowrap; }
.ags-key { width: 16px; height: 2px; display: inline-block; border-radius: 1px; flex: none; }
.ags-key-dash { width: 16px; height: 2px; display: inline-block; flex: none; background: repeating-linear-gradient(90deg, var(--k, var(--fg-3)) 0 4px, transparent 4px 7px); }
.ags-key-sw { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: none; }
.ags-key-cut { width: 2px; height: 12px; display: inline-block; background: var(--signal); border-radius: 1px; flex: none; }
.ags-key-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex: none; }
.ags-key-out { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: none; border: 1.5px dashed var(--k, var(--fg-3)); background: transparent; box-sizing: border-box; }
.ags-data { max-height: 360px; overflow: auto; }
.ags-note { font-size: var(--fs-xs); color: var(--fg-3); max-width: 80ch; }
.ags-shared-list { margin: 4px 0 0; padding-left: 18px; font-size: var(--fs-xs); }
/* estado vacío: ruta para empezar (ocupa el ancho de la vista, como el resto de las vistas) */
.ags-steps { list-style: none; margin: 0; padding: 14px 16px 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 12px; }
.ags-step { display: flex; flex-direction: column; gap: 6px; padding: 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); min-width: 0; }
.ags-step[data-done="1"] { border-color: var(--good); background: var(--good-wash); }
.ags-step-head { display: flex; gap: 8px; align-items: center; min-width: 0; }
.ags-step-n { flex: none; width: 22px; height: 22px; border-radius: 50%; display: inline-grid; place-items: center; font-size: var(--fs-xs); font-weight: 700; border: 1px solid var(--line-strong); color: var(--fg-2); background: var(--surface); }
.ags-step[data-done="1"] .ags-step-n { border-color: var(--good); color: var(--good); }
.ags-step-state { font-size: var(--fs-xs); color: var(--fg-2); }
.ags-step p { margin: 0; max-width: 60ch; font-size: var(--fs-sm); color: var(--fg-2); }
.ags-step > .ags-step-act { margin-top: auto; padding-top: 2px; }
.ags-cmp td { white-space: nowrap; }
.ags-cmp th { white-space: normal; min-width: 8ch; vertical-align: bottom; }
.ags-empty-chart { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-sm); color: var(--fg-2); padding: 8px 0; max-width: 70ch; }
.ags-empty-chart > .icon { color: var(--fg-3); margin-top: 2px; }
/* capacidad sugerida por la disponibilidad del equipo (catálogo de recursos, §10.4) */
.ags-capsug { display: flex; flex-direction: column; gap: 8px; padding: 10px 14px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: var(--r-md); background: var(--surface-2); font-size: var(--fs-sm); min-width: 0; }
.ags-capsug[data-state="no-members"], .ags-capsug[data-state="no-dates"] { border-left-color: var(--info); }
.ags-capsug-head { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; gap: 6px 10px; align-items: start; }
@media (max-width: 760px) { .ags-capsug-head { grid-template-columns: 16px minmax(0, 1fr); } .ags-capsug-acts { grid-column: 2; } }
.ags-capsug-head > .icon { margin-top: 3px; color: var(--accent); }
.ags-capsug[data-state="no-members"] .ags-capsug-head > .icon, .ags-capsug[data-state="no-dates"] .ags-capsug-head > .icon { color: var(--info); }
.ags-capsug-main { min-width: 0; display: flex; flex-direction: column; gap: 3px; line-height: 1.45; }
.ags-capsug-val { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-lg); color: var(--fg); white-space: nowrap; }
.ags-capsug-acts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.ags-capsug-why { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: var(--fs-xs); color: var(--fg-2); }
.ags-capsug-why li { display: inline-flex; gap: 5px; align-items: flex-start; min-width: 0; }
.ags-capsug-why li > .icon { flex: none; margin-top: 1px; color: var(--fg-3); }
.ags-capsug-group { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ags-capsug-why-h { font-size: var(--fs-xs); font-weight: 600; color: var(--fg-2); }
.ags-capsug-group.is-known .ags-capsug-why-h { font-weight: 500; color: var(--fg-3); }
.ags-capsug .table td, .ags-capsug .table th { white-space: nowrap; }
.ags-capsug .table td:first-child { white-space: normal; min-width: 150px; }
.ags-capsug-meter { position: relative; height: 8px; border-radius: 4px; background: var(--surface-3); overflow: hidden; max-width: 420px; }
.ags-capsug-meter > span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; background: var(--accent); }
`;
  if (!document.getElementById('css-agile-sprints')) {
    const st = document.createElement('style');
    st.id = 'css-agile-sprints';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- utilidades */
  const pad2 = (n) => String(n).padStart(2, '0');
  const today = () => D.today();
  const sumEst = (list) => list.reduce((s, i) => s + A.estimate(i), 0);
  const fpts = (v, unit) => fmt.num(v, 1) + ' ' + unit;
  const sgn = (v) => (v > 0 ? '+' : v < 0 ? '−' : '');
  const signedPts = (v, unit) => sgn(v) + fmt.num(Math.abs(v), 1) + ' ' + unit;
  const signedPct = (x) => sgn(x) + fmt.pct(Math.abs(x), 1);
  const signedMoney = (v, cur) => (v > 0 ? '+' : '') + fmt.money(v, cur);
  const daysText = (n) => fmt.num(Math.abs(n)) + (Math.abs(n) === 1 ? ' día' : ' días');
  const wdText = (n) => fmt.num(Math.abs(n)) + (Math.abs(n) === 1 ? ' día hábil' : ' días hábiles');
  const wdDiff = (cal, a, b) => (!cal || !D.valid(a) || !D.valid(b) || a === b ? 0 : b > a ? cal.countWork(D.add(a, 1), b) : -cal.countWork(D.add(b, 1), a));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const sameCode = (a, b) => norm(a) !== '' && norm(a) === norm(b);
  const dateRange = (a, b) => (D.valid(a) || D.valid(b) ? fmt.date(a) + ' – ' + fmt.date(b) : 'Sin fechas definidas');
  const round1 = (v) => (isNum(v) ? Math.round(v * 10) / 10 : null);
  const nOr = (v) => (PM.isNum(v) ? Number(v) : null);
  const TYPE_LABEL = Object.fromEntries(PM.AGILE.ITEM_TYPES.map((t) => [t.value, t.label]));
  const REL_STATUS = { planeado: ['Planeado', 'outline'], comprometido: ['Comprometido', 'info'], 'en-curso': ['En curso', 'accent'], cerrado: ['Cerrado', 'good'] };
  const SPR_STATUS = { planeado: ['Planeada', 'outline'], 'en-curso': ['En curso', 'accent'], cerrado: ['Cerrada', 'good'] };
  const CAT_TONE = { nuevo: 'outline', pendiente: 'info', 'en-curso': 'accent', terminado: 'good' };
  const statusName = (settings, status) => { if (!status || status === PM.AGILE.BACKLOG) return 'Backlog del producto'; const c = settings.columns.find((x) => x.id === status); return c ? c.name : 'Backlog del producto'; };
  /* Consecutivo libre del tipo «CC-004» / «LA-012». */
  const nextCode = (codes, prefix) => { let max = 0; const re = new RegExp('^' + prefix + '-(\\d+)$', 'i'); for (const c of codes) { const mm = re.exec(String(c ?? '').trim()); if (mm) max = Math.max(max, Number(mm[1])); } return prefix + '-' + String(max + 1).padStart(3, '0'); };

  /* Nombres para mostrar: los datos importados pueden traer iteraciones o releases sin nombre. */
  const spName = (s) => (s && String(s.name ?? '').trim()) || 'Iteración sin nombre';
  const relName = (r) => (r && String(r.name ?? '').trim()) || 'Release sin nombre';

  /* La normalización de la herramienta puede convertir `baseline: null` en `{}`: solo hay línea base si tiene datos
     (PM.agile.hasBaseline, la regla del núcleo). */
  const normRelease = (r) => (r.baseline == null || A.hasBaseline(r) ? r : { ...r, baseline: null });
  /* Actividad del cronograma que representa el release, con la regla del núcleo (PM.agile.linksOf): release.taskId
     primero (si dos releases apuntan a la misma actividad gana el último) y luego task.releaseId solo para releases sin
     actividad. Es la misma actividad a la que el núcleo aplica el avance del backlog. */
  const taskIdOfRelease = (m, releaseId) => { for (const [tid, r] of A.linksOf(arr(m.schedule && m.schedule.tasks), m.agileData || m.agile)) if (r.id === releaseId) return tid; return null; };
  /* Texto de un campo que puede llegar con otro tipo en datos importados o editados a mano (número, null). */
  const str = (v) => (v === null || v === undefined ? '' : String(v));
  /* Iteraciones de la línea base del release: las planeadas o, si son menos, las ya creadas (así la línea base no queda
     por debajo de lo que el equipo ya tiene en el calendario). */
  const baselineSprints = (release, relSprints) => Math.max(Math.round(num(release && release.plannedSprints, 0)), arr(relSprints).length);
  /* Iteraciones que se cruzan en el calendario (el equipo trabaja una iteración a la vez). Las cerradas no cuentan: una
     iteración que se cerró antes de su fin planeado conserva sus fechas y la siguiente puede empezar antes. */
  const overlapsOf = (s, all) => (s.status !== 'cerrado' && D.valid(s.start) && D.valid(s.end) ? arr(all).filter((o) => o.id !== s.id && o.status !== 'cerrado' && D.valid(o.start) && D.valid(o.end) && o.start <= s.end && o.end >= s.start) : []);
  /* Variación frente a la línea base (PM.calc.releaseVariance con las iteraciones: número frente a la línea base e
     iteraciones que terminan después del fin) más un caso que el núcleo no cubre: si la línea base tiene fecha de fin y
     el release ya no la tiene, la fecha cambió y requiere control de cambios (§9.6). */
  function relVariance(release, items, settings, sprints) {
    let v = C.releaseVariance({ release, items, settings, sprints });
    if (!v.hasBaseline) return v;
    if (v.sprintChange === undefined) {
      /* núcleo anterior sin la comparación de iteraciones: la misma regla, aquí */
      const rs = C.sprintsOfRelease(sprints, release.id);
      const bs = Math.round(num(release.baseline.sprints, 0));
      const endRef = D.valid(release.end) ? release.end : D.valid(release.baseline.end) ? release.baseline.end : null;
      v = { ...v, sprintChange: bs > 0 ? rs.length - bs : 0, sprintsAfterEnd: endRef ? rs.filter((s) => D.valid(s.end) && s.end > endRef).map((s) => s.id) : [] };
    }
    /* Menos iteraciones creadas que las de la línea base no es un cambio: el equipo las crea a medida que planifica (o
       el release termina antes). Sí lo son más iteraciones que la línea base y las que terminan después del fin. */
    const thr = num(settings && settings.scopeChangeThreshold, 10) / 100;
    const needs = Math.abs(v.scopePct) > thr + 1e-9 || v.dateChange !== 0 || Math.abs(v.budgetChange) > 0.5 || v.sprintChange > 0 || v.sprintsAfterEnd.length > 0;
    v = { ...v, needsChangeControl: needs };
    if (D.valid(release.baseline.end) && !D.valid(release.end)) return { ...v, endRemoved: true, needsChangeControl: true };
    return v;
  }
  /* Base de la velocidad con que el núcleo pronostica un release (PM.calc.releaseForecast): la media de las últimas
     iteraciones cerradas del release o, si el release no tiene ninguna, la del equipo en todo el proyecto. */
  function velBasis(release, sprints, items, settings) {
    const rv = C.velocity({ sprints: arr(sprints).filter((s) => s.releaseId === release.id), items, settings });
    if (rv.closed) return { scope: 'release', n: Math.min(3, rv.closed), avg: rv.avg3 };
    const pv = C.velocity({ sprints, items, settings });
    return { scope: 'equipo', n: Math.min(3, pv.closed), avg: pv.avg3 };
  }
  /* «la última iteración cerrada» / «las últimas 3 iteraciones cerradas» */
  const lastClosed = (n) => (n === 1 ? 'la última iteración cerrada' : 'las últimas ' + n + ' iteraciones cerradas');
  const velName = (b) => (b.scope === 'release' ? 'velocidad media del release' : 'velocidad del equipo');
  const velWhere = (b) => lastClosed(b.n) + (b.scope === 'release' ? ' del release' : ' del proyecto');
  /* leyenda de la línea de promedio de la velocidad con el número real de iteraciones promediadas */
  const avgLabel = (closed) => { const n = Math.min(3, closed); return 'Promedio (' + (n === 1 ? 'última cerrada' : 'últimas ' + n + ' cerradas') + ')'; };
  /* Alcance y terminado del release a una fecha, con los mismos filtros del burnup del núcleo (releaseBurnup). */
  function burnupAt(release, items, settings, day) {
    let scope = 0, done = 0;
    for (const it of items) {
      if (!A.countable(it) || it.releaseId !== release.id) continue;
      const e = A.estimate(it);
      if (!D.valid(it.createdAt) || it.createdAt <= day) scope += e;
      if (A.isDone(settings, it) && D.valid(it.doneDate) && it.doneDate <= day) done += e;
    }
    return { scope, done, remaining: scope - done, pct: scope > 0 ? done / scope : 0 };
  }

  /* Elementos contables agrupados por iteración y por release (ordenados por rango). */
  function indexItems(items) {
    const bySprint = new Map(), byRelease = new Map();
    const push = (m, k, it) => { let l = m.get(k); if (!l) m.set(k, (l = [])); l.push(it); };
    for (const it of items) {
      if (!A.countable(it)) continue;
      if (it.sprintId) push(bySprint, it.sprintId, it);
      if (it.releaseId) push(byRelease, it.releaseId, it);
    }
    const byRank = (a, b) => num(a.rank, 0) - num(b.rank, 0) || String(a.code || '').localeCompare(String(b.code || ''));
    for (const l of bySprint.values()) l.sort(byRank);
    for (const l of byRelease.values()) l.sort(byRank);
    return { bySprint, byRelease };
  }

  /* Pronóstico por flujo (Kanban sin iteraciones cerradas): puntos terminados en las últimas 6 semanas. */
  function flowForecast(list, settings, statusDate, cal) {
    const remaining = sumEst(list.filter((i) => !A.isDone(settings, i)));
    if (!(remaining > 0) || !cal) return null;
    const from = D.add(statusDate, -41);
    const done = sumEst(list.filter((i) => A.isDone(settings, i) && D.valid(i.doneDate) && i.doneDate >= from && i.doneDate <= statusDate));
    if (!(done > 0)) return null;
    const perWeek = done / 6;
    const weeks = remaining / perWeek;
    return { perWeek, weeks, finish: cal.addWork(D.add(statusDate, Math.ceil(weeks * 7)), 0) };
  }

  /* Fechas de la siguiente iteración: el equipo trabaja una iteración a la vez, así que empieza el día hábil siguiente a
     la última iteración de TODO el proyecto (no solo del release: si el release siguiente ya tiene iteraciones, la nueva
     queda después de ellas y no se cruza), y nunca antes del inicio del release. */
  function nextSprintDates(cal, settings, allSprints, relSprints, release, project, statusDate) {
    const lastEnd = (list) => D.max(...list.map((s) => s.end).filter(D.valid));
    const base = lastEnd(allSprints) || lastEnd(relSprints);
    let start = base ? D.add(base, 1) : null;
    const rs = release && D.valid(release.start) ? release.start : null;
    if (!start) start = rs || (project && D.valid(project.start) ? project.start : statusDate);
    else if (rs && rs > start) start = rs;
    start = cal.addWork(start, 0);
    return { start, end: cal.addWork(start, Math.max(1, settings.sprintLength) - 1) };
  }
  /* Riesgos de agregar iteraciones a un release: las que terminan después de su fin y el total frente a la línea base
     (o a las planeadas, sin línea base). Cambiar el número de iteraciones de un release con línea base es nivel 2. */
  function addRisks(release, existing, plans) {
    if (!release) return { afterEnd: [], total: existing + plans.length, overBaseline: false, overPlanned: false, base: null };
    const end = D.valid(release.end) ? release.end : null;
    const afterEnd = end ? plans.filter((p) => D.valid(p.end) && p.end > end) : [];
    const total = existing + plans.length;
    const bl = A.hasBaseline(release) ? Math.round(num(release.baseline.sprints, 0)) : 0;
    const planned = Math.round(num(release.plannedSprints, 0));
    return { afterEnd, total, end, base: bl || null, overBaseline: bl > 0 && total > bl, overPlanned: !bl && planned > 0 && total > planned, planned };
  }
  const sprintNumber = (sprints) => { let max = 0; for (const s of sprints) { const mm = /(\d+)\s*$/.exec(String(s.name || '')); if (mm) max = Math.max(max, Number(mm[1])); } return Math.max(max, sprints.length) + 1; };

  /* Documentos: consecutivo de instancias (igual que el editor de 20-docs) y valores ajustados a la plantilla. */
  function seqMap(insts) {
    const list = [...(insts || [])].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)));
    const m = new Map(); let max = 0;
    for (const d of list) if (Number.isFinite(d.seq) && d.seq > 0) { m.set(d.id, d.seq); max = Math.max(max, d.seq); }
    for (const d of list) if (!m.has(d.id)) m.set(d.id, ++max);
    return m;
  }
  const nextSeq = (insts) => { let max = 0; for (const v of seqMap(insts).values()) max = Math.max(max, v); return max + 1; };
  const optValues = (o) => (Array.isArray(o) ? o.map((x) => (isObj(x) ? String(x.value) : String(x))) : null);
  const fitValue = (f, v) => {
    if (v === undefined || v === null) return undefined;
    if (f.type === 'select') { const opts = optValues(f.options); return !opts || !opts.length || opts.includes(String(v)) ? v : undefined; }
    if ((f.type === 'number' || f.type === 'money' || f.type === 'pct') && !isNum(v)) return undefined;
    if (f.type === 'list') return Array.isArray(v) ? v.map(String) : undefined;
    return v;
  };
  /* Solo las claves que existen en la plantilla; filas de tabla con las columnas de la plantilla. */
  function fitFields(t, values) {
    const out = {};
    for (const s of (t && t.sections) || []) for (const f of s.fields || []) {
      if (!(f.key in values)) continue;
      const v = values[f.key];
      if (f.type === 'table') {
        if (!Array.isArray(v)) continue;
        out[f.key] = v.map((row) => { const r = { id: row.id || PM.uid('r') }; for (const c of f.columns || []) { const x = fitValue(c, row[c.key]); if (x !== undefined) r[c.key] = x; } return r; });
        continue;
      }
      const x = fitValue(f, v);
      if (x !== undefined) out[f.key] = x;
    }
    return out;
  }
  /* Los textos de los documentos usan espacios normales (los de no separación son solo para la pantalla). */
  const plain = (v) => (typeof v === 'string' ? v.replace(/[\u00a0\u202f]/g, ' ') : Array.isArray(v) ? v.map(plain) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) : v);
  /* Elementos de una iteración cerrada que no se terminaron: se registran al cerrar (sprint.unfinished) para que el
     burndown y el acta de revisión conserven el alcance con que terminó la iteración. */
  function withUnfinished(sprint, items) {
    const list = arr(sprint && sprint.unfinished);
    if (!list.length) return items;
    const inSprint = new Set(items.filter((it) => it.sprintId === sprint.id).map((it) => it.id));
    /* los que ya registran su salida (sprintExits, PM.agile.trackMembership) los cuenta el núcleo: no se duplican */
    for (const it of items) if (arr(it.sprintExits).some((e) => e.sprintId === sprint.id)) inSprint.add(it.id);
    const extra = list.filter((u) => u.id && !inSprint.has(u.id)).map((u) => ({ id: u.id + '@' + sprint.id, code: u.code || '', title: u.title || '', type: 'historia', estimate: nOr(u.estimate), status: PM.AGILE.BACKLOG, sprintId: sprint.id, sprintAddedDate: D.valid(u.sprintAddedDate) ? u.sprintAddedDate : null, unfinished: true }));
    return extra.length ? [...items, ...extra] : items;
  }
  async function createDoc({ pid, project, tid, insts, title, values }) {
    const t = PM.templates[tid];
    values = plain(values);
    const docId = tid + '--' + PM.uid('d');
    const body = PM.newDocBody(t, project, { template: tid });
    body.fields = { ...(body.fields || {}), ...fitFields(t, values) };
    if (t.multiple) body.seq = nextSeq(insts);
    body.title = plain(title || t.name);
    PM.touchProject(pid);
    await PM.store.set(PM.paths.doc(pid, docId), body);
    return docId;
  }

  const DOC_KINDS = [
    { kind: 'planificacion', tid: 'planificacion-sprint', label: 'Planificación de la iteración', icon: 'checklist' },
    { kind: 'revision', tid: 'acta-revision-sprint', label: 'Acta de revisión de la iteración', icon: 'check-circle' },
    { kind: 'retrospectiva', tid: 'retrospectiva', label: 'Retrospectiva de la iteración', icon: 'history' },
  ];

  /* Variación del release frente a su línea base, con textos listos para mostrar y para la solicitud de cambio. */
  function varianceDetail(r, v, settings, unit, currency, cal, relSprints) {
    const thr = settings.scopeChangeThreshold;
    const b = r.baseline || {};
    const scopeOver = Math.abs(v.scopePct) > thr / 100 + 1e-9;
    const rs = arr(relSprints);
    /* días hábiles del cambio de fecha: hasta el fin del release o, si alguna iteración termina después, hasta esa */
    const after = rs.filter((s) => (v.sprintsAfterEnd || []).includes(s.id));
    const lastAfter = after.length ? D.max(...after.map((s) => s.end)) : null;
    const effEnd = lastAfter && (!D.valid(r.end) || lastAfter > r.end) ? lastAfter : r.end;
    const wd = wdDiff(cal, b.end, effEnd);
    const lines = [];
    lines.push({ id: 'scope', flag: scopeOver, text: 'Alcance: ' + fpts(v.total, unit) + ' frente a ' + fpts(v.baselinePoints, unit) + ' de la línea base (' + signedPct(v.scopePct) + (scopeOver ? '; supera el umbral de ±' + fmt.num(thr, 1) + ' %' : '; dentro del umbral de ±' + fmt.num(thr, 1) + ' %') + ').' });
    const wdEnd = wdDiff(cal, b.end, r.end);
    lines.push(v.endRemoved ? { id: 'date', flag: true, text: 'Fecha de fin: se quitó (línea base: ' + fmt.date(b.end) + ').' }
      : v.dateChange ? { id: 'date', flag: true, text: 'Fecha de fin: del ' + fmt.date(b.end) + ' al ' + fmt.date(r.end) + ' (' + sgn(v.dateChange) + daysText(v.dateChange) + ' calendario, ' + sgn(wdEnd) + wdText(wdEnd) + ').' }
      : { id: 'date', flag: false, text: 'Fecha de fin: sin cambio (' + fmt.date(b.end) + ').' });
    lines.push(Math.abs(v.budgetChange) > 0.5 ? { id: 'budget', flag: true, text: 'Presupuesto: de ' + fmt.money(b.budget, currency) + ' a ' + fmt.money(r.budget, currency) + ' (' + signedMoney(v.budgetChange, currency) + ').' } : { id: 'budget', flag: false, text: 'Presupuesto: sin cambio (' + fmt.money(b.budget, currency) + ').' });
    const bs = Math.round(num(b.sprints, 0));
    if (bs > 0) {
      const n = bs + (v.sprintChange || 0);
      lines.push(v.sprintChange > 0 ? { id: 'sprints', flag: true, text: 'Iteraciones: ' + fmt.num(n) + ' frente a ' + fmt.num(bs) + ' de la línea base (+' + fmt.num(v.sprintChange) + ').' }
        : v.sprintChange < 0 ? { id: 'sprints', flag: false, text: 'Iteraciones: ' + fmt.num(n) + ' creadas de ' + fmt.num(bs) + ' de la línea base.' }
        : { id: 'sprints', flag: false, text: 'Iteraciones: ' + fmt.num(bs) + ', igual que la línea base.' });
    }
    if (after.length) {
      const endTxt = D.valid(r.end) ? ' (' + fmt.date(r.end) + ')' : '';
      lines.push({ id: 'after-end', flag: true, text: (after.length === 1 ? 'Iteración que termina después del fin del release' : 'Iteraciones que terminan después del fin del release') + endTxt + ': ' + after.map((s) => spName(s) + ' (termina el ' + fmt.date(s.end) + ')').join(', ') + '.' });
    }
    return { lines, scopeOver, wd, thr, after, effEnd };
  }

  /* ---------------------------------------------------------------- campos con borrador (guardan al salir) */
  function DraftText({ id, value, onCommit, disabled, multiline, placeholder, label }) {
    const [v, setV] = useState(str(value));
    const focused = useRef(false);
    useEffect(() => { if (!focused.current) setV(str(value)); }, [value]);
    const commit = () => { focused.current = false; if (str(v) !== str(value)) onCommit(str(v)); };
    const common = { id, value: v, disabled, placeholder, 'aria-label': label, onFocus: () => { focused.current = true; }, onBlur: commit };
    return multiline
      ? html`<${ui.TextArea} ...${common} rows=${2} onValue=${setV} />`
      : html`<${ui.Input} ...${common} onValue=${setV} onKeyDown=${(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />`;
  }
  function DraftNumber({ id, value, onCommit, disabled, min, max }) {
    const [v, setV] = useState(nOr(value));
    const focused = useRef(false);
    useEffect(() => { if (!focused.current) setV(nOr(value)); }, [value]);
    return html`<${ui.NumberInput} id=${id} value=${v} min=${min} max=${max} disabled=${disabled} onValue=${setV}
      onFocus=${() => { focused.current = true; }} onBlur=${() => { focused.current = false; if (v !== nOr(value)) onCommit(v); }}
      onKeyDown=${(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />`;
  }

  function Callout({ tone = 'info', icon, title, children, actions, role: dataRole }) {
    const ic = icon || (tone === 'good' ? 'check-circle' : tone === 'warn' || tone === 'crit' ? 'alert' : 'info');
    return html`<div class="ags-callout" data-tone=${tone} data-role=${dataRole}>
      <${ui.Icon} name=${ic} size=${16} />
      <div class="ags-callout-body">${title ? html`<strong>${title}</strong>` : null}${children}${actions ? html`<div class="row">${actions}</div>` : null}</div>
    </div>`;
  }

  /* Contenedor de tabla con desplazamiento horizontal: marca si el contenido no cabe (la columna de acciones queda fija y
     se avisa con texto que la tabla se desplaza). */
  function ScrollWrap({ class: cls, children }) {
    const ref = useRef(null);
    const [over, setOver] = useState(false);
    useLayoutEffect(() => {
      const el = ref.current; if (!el) return undefined;
      const upd = () => { const o = el.scrollWidth > el.clientWidth + 1; setOver((prev) => (prev === o ? prev : o)); };
      upd();
      let ro = null;
      try { ro = new ResizeObserver(upd); ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild); } catch (e) { window.addEventListener('resize', upd); }
      return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', upd); };
    }, []);
    return html`<div class="stack-sm" style="gap:4px;min-width:0">
      <div class=${cx('table-wrap ags-scroll', cls)} ref=${ref} data-overflow=${over ? 'true' : 'false'}>${children}</div>
      ${over ? html`<div class="ags-scroll-hint" data-role="scroll-hint"><${ui.Icon} name="chevron-right" size=${13} />Desplaza la tabla hacia los lados para ver todas las columnas; las acciones quedan fijas a la derecha.</div>` : null}
    </div>`;
  }

  /* ==================================================================== DIÁLOGOS */
  function ReleaseEditor({ close, release, isNew, wbsGroups, taskOptions, currency, onSave }) {
    const [f, setF] = useState(() => ({
      /* los textos se inicializan como cadena: un nombre, un objetivo o unas notas numéricos (datos importados o editados a
         mano) no deben impedir guardar */
      name: str(release.name), goal: str(release.goal), start: D.valid(release.start) ? release.start : '', end: D.valid(release.end) ? release.end : '', status: release.status || 'planeado',
      budget: nOr(release.budget), plannedSprints: nOr(release.plannedSprints), wbsId: str(release.wbsId), taskId: str(release.currentTaskId), notes: str(release.notes),
    }));
    const [err, setErr] = useState({});
    const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
    const bl = A.hasBaseline(release);
    /* «Comprometido» se alcanza al fijar la línea base; sin ella no se ofrece (salvo datos anteriores que ya lo tengan). */
    const keepCommitted = release.status === 'comprometido';
    const statusOpts = bl || keepCommitted ? PM.AGILE.RELEASE_STATUS : PM.AGILE.RELEASE_STATUS.filter((o) => o.value !== 'comprometido');
    const statusHint = bl ? 'Tiene línea base.' : keepCommitted ? 'Comprometido sin línea base: fíjala desde el release para controlar los cambios.' : 'Para comprometerlo, fija la línea base desde el release (pasa a «Comprometido»).';
    const submit = () => {
      const e = {};
      if (!str(f.name).trim()) e.name = 'Escribe el nombre del release.';
      if (bl && !D.valid(f.end)) e.end = 'El release tiene línea base: la fecha de fin no se puede quitar. Si cambia, guarda la nueva fecha y registra la solicitud de cambio.';
      else if (f.start && f.end && f.end < f.start) e.end = 'La fecha de fin debe ser igual o posterior a la de inicio.';
      if (f.status === 'comprometido' && !bl && !keepCommitted) e.status = 'Fija la línea base del release para comprometerlo.';
      if (f.plannedSprints !== null && (f.plannedSprints < 0 || f.plannedSprints > 200 || Math.round(f.plannedSprints) !== f.plannedSprints)) e.plannedSprints = 'Usa un número entero entre 0 y 200.';
      if (f.budget !== null && f.budget < 0) e.budget = 'El presupuesto no puede ser negativo.';
      setErr(e);
      if (Object.keys(e).length) return;
      onSave({ ...f, name: str(f.name).trim(), goal: str(f.goal).trim(), notes: str(f.notes).trim(), start: D.valid(f.start) ? f.start : null, end: D.valid(f.end) ? f.end : null, wbsId: f.wbsId || null, taskId: f.taskId || null });
      close();
    };
    return html`<${ui.Modal} title=${isNew ? 'Nuevo release' : 'Editar release'} subtitle=${isNew ? 'Un release agrupa los elementos del backlog que se entregan juntos.' : relName(release)} size="wide" onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="save" onClick=${submit}>${isNew ? 'Crear release' : 'Guardar release'}</${ui.Button}>`}>
      <form class="ags-form" data-role="release-form" onSubmit=${(e) => { e.preventDefault(); submit(); }}>
        <${ui.Field} label="Nombre" for="ags-rel-name" required error=${err.name}><${ui.Input} id="ags-rel-name" value=${f.name} onValue=${set('name')} placeholder="Release 1 · Inventario y alquiler" autoFocus /></${ui.Field}>
        <${ui.Field} label="Estado" for="ags-rel-status" error=${err.status} hint=${statusHint}><${ui.Select} id="ags-rel-status" value=${f.status} options=${statusOpts} onValue=${set('status')} /></${ui.Field}>
        <${ui.Field} class="span-all" label="Objetivo del release" for="ags-rel-goal" hint="Resultado de negocio que se entrega, en una o dos frases."><${ui.TextArea} id="ags-rel-goal" value=${f.goal} onValue=${set('goal')} rows=${2} /></${ui.Field}>
        <${ui.Field} label="Inicio" for="ags-rel-start"><${ui.DateInput} id="ags-rel-start" value=${f.start} onValue=${(v) => set('start')(v || '')} /></${ui.Field}>
        <${ui.Field} label="Fin" for="ags-rel-end" required=${bl} error=${err.end} hint=${bl ? 'Cambiarla requiere control de cambios.' : null}><${ui.DateInput} id="ags-rel-end" value=${f.end} onValue=${(v) => set('end')(v || '')} /></${ui.Field}>
        <${ui.Field} label=${'Presupuesto (BAC del release, ' + currency + ')'} for="ags-rel-budget" error=${err.budget} hint=${bl ? 'Cambiarlo requiere control de cambios.' : 'Base del valor ganado ágil (AgileEVM).'}><${ui.NumberInput} id="ags-rel-budget" money currency=${currency} value=${f.budget} min=${0} onValue=${set('budget')} /></${ui.Field}>
        <${ui.Field} label="Iteraciones planeadas" for="ags-rel-sprints" error=${err.plannedSprints} hint="Base del avance planificado del AgileEVM."><${ui.NumberInput} id="ags-rel-sprints" value=${f.plannedSprints} min=${0} max=${200} onValue=${set('plannedSprints')} /></${ui.Field}>
        <${ui.Field} label="Entregable de la EDT" for="ags-rel-wbs" hint="Se recomiendan los entregables con enfoque adaptativo.">
          <select id="ags-rel-wbs" class="select" value=${f.wbsId} onChange=${(e) => set('wbsId')(e.currentTarget.value)}>
            <option value="">Sin entregable vinculado</option>
            ${wbsGroups.adaptive.length ? html`<optgroup label="Entregables adaptativos">${wbsGroups.adaptive.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</optgroup>` : null}
            ${wbsGroups.other.length ? html`<optgroup label="Otros entregables (predictivos)">${wbsGroups.other.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</optgroup>` : null}
          </select>
        </${ui.Field}>
        <${ui.Field} label="Actividad del cronograma" for="ags-rel-task" hint="Su avance se calculará desde el backlog. Una actividad representa un solo release.">
          <${ui.Select} id="ags-rel-task" value=${f.taskId} placeholder="Sin actividad vinculada" options=${taskOptions} onValue=${set('taskId')} />
        </${ui.Field}>
        <${ui.Field} class="span-all" label="Notas" for="ags-rel-notes"><${ui.TextArea} id="ags-rel-notes" value=${f.notes} onValue=${set('notes')} rows=${2} /></${ui.Field}>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  function SprintEditor({ close, sprint, releaseOptions, releases, sprints, onSave }) {
    const [f, setF] = useState(() => ({ name: str(sprint.name), releaseId: str(sprint.releaseId), goal: str(sprint.goal), start: D.valid(sprint.start) ? sprint.start : '', end: D.valid(sprint.end) ? sprint.end : '', capacity: nOr(sprint.capacity), notes: str(sprint.notes) }));
    const [err, setErr] = useState({});
    const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
    const submit = () => {
      const e = {};
      if (!str(f.name).trim()) e.name = 'Escribe el nombre de la iteración.';
      if (!D.valid(f.start)) e.start = 'Indica la fecha de inicio.';
      if (!D.valid(f.end)) e.end = 'Indica la fecha de fin.';
      else if (D.valid(f.start) && f.end < f.start) e.end = 'La fecha de fin debe ser igual o posterior a la de inicio.';
      if (f.capacity !== null && f.capacity < 0) e.capacity = 'La capacidad no puede ser negativa.';
      setErr(e);
      if (Object.keys(e).length) return;
      onSave({ ...f, name: str(f.name).trim(), goal: str(f.goal).trim(), notes: str(f.notes).trim(), releaseId: f.releaseId || null });
      close();
    };
    const st = SPR_STATUS[sprint.status] || SPR_STATUS.planeado;
    /* avisos (no impiden guardar): la iteración se cruza con otra o termina después del fin de su release */
    const rel = f.releaseId ? arr(releases).find((r) => r.id === f.releaseId) : null;
    const valid = D.valid(f.start) && D.valid(f.end) && f.end >= f.start;
    const cross = valid ? overlapsOf({ id: sprint.id, start: f.start, end: f.end }, sprints) : [];
    const late = valid && rel && D.valid(rel.end) && f.end > rel.end;
    return html`<${ui.Modal} title="Editar iteración" subtitle=${spName(sprint) + ' · ' + st[0]} size="wide" onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="save" onClick=${submit}>Guardar iteración</${ui.Button}>`}>
      <form class="ags-form" data-role="sprint-form" onSubmit=${(e) => { e.preventDefault(); submit(); }}>
        <${ui.Field} label="Nombre" for="ags-sp-name" required error=${err.name}><${ui.Input} id="ags-sp-name" value=${f.name} onValue=${set('name')} autoFocus /></${ui.Field}>
        <${ui.Field} label="Release" for="ags-sp-rel"><${ui.Select} id="ags-sp-rel" value=${f.releaseId} placeholder="Sin release" options=${releaseOptions} onValue=${set('releaseId')} /></${ui.Field}>
        <${ui.Field} label="Inicio" for="ags-sp-start" required error=${err.start}><${ui.DateInput} id="ags-sp-start" value=${f.start} onValue=${(v) => set('start')(v || '')} /></${ui.Field}>
        <${ui.Field} label="Fin" for="ags-sp-end" required error=${err.end}><${ui.DateInput} id="ags-sp-end" value=${f.end} onValue=${(v) => set('end')(v || '')} /></${ui.Field}>
        <${ui.Field} label="Capacidad" for="ags-sp-cap" error=${err.capacity} hint="Unidades de estimación que el equipo puede terminar."><${ui.NumberInput} id="ags-sp-cap" value=${f.capacity} min=${0} onValue=${set('capacity')} /></${ui.Field}>
        <${ui.Field} class="span-all" label="Objetivo de la iteración" for="ags-sp-goal" hint="Compromiso del equipo para la iteración."><${ui.TextArea} id="ags-sp-goal" value=${f.goal} onValue=${set('goal')} rows=${2} /></${ui.Field}>
        <${ui.Field} class="span-all" label="Notas" for="ags-sp-notes"><${ui.TextArea} id="ags-sp-notes" value=${f.notes} onValue=${set('notes')} rows=${2} /></${ui.Field}>
        ${cross.length || late ? html`<div class="span-all stack-sm" data-role="sprint-warnings" aria-live="polite">
          ${cross.length ? html`<span class="ags-flag"><${ui.Icon} name="alert" size=${14} />Se cruza con ${cross.map((o) => spName(o) + ' (' + fmt.date(o.start, 'dm') + ' – ' + fmt.date(o.end) + ')').join(', ')}: el equipo trabaja una iteración a la vez.</span>` : null}
          ${late ? html`<span class="ags-flag"><${ui.Icon} name="alert" size=${14} />Termina después del fin del release (${fmt.date(rel.end)}).${A.hasBaseline(rel) ? ' El release tiene línea base: requiere una solicitud de cambio (nivel 2).' : ''}</span>` : null}
        </div>` : null}
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  function GenerateDialog({ close, release, existing, planned, plan, onConfirm }) {
    const [count, setCount] = useState(() => Math.max(1, planned - existing));
    const n = Math.max(0, Math.min(52, Math.round(num(count, 0))));
    const preview = useMemo(() => plan(n), [n]);
    const risk = addRisks(release, existing, preview);
    const lateSet = new Set(risk.afterEnd.map((p) => p.name));
    return html`<${ui.Modal} title="Generar iteraciones" subtitle=${relName(release)} onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="sprint" disabled=${!n} onClick=${() => { onConfirm(preview); close(); }}>${n === 1 ? 'Generar 1 iteración' : 'Generar ' + n + ' iteraciones'}</${ui.Button}>`}>
      <p class="small muted">El release tiene ${countLabel(existing, 'iteración creada', 'iteraciones creadas')}${planned ? ' de ' + planned + ' planeadas' : ' y ninguna planeada'}. Cada iteración empieza el día hábil siguiente a la última iteración del proyecto (el equipo trabaja una a la vez) y dura lo configurado en la capa ágil, según el calendario del proyecto.</p>
      <${ui.Field} label="Número de iteraciones" for="ags-gen-n"><${ui.NumberInput} id="ags-gen-n" value=${count} min=${0} max=${52} onValue=${setCount} /></${ui.Field}>
      ${preview.length ? html`<div class="table-wrap ags-data"><table class="table table-tight"><caption class="sr-only">Iteraciones que se crearán</caption><thead><tr><th>Iteración</th><th>Inicio</th><th>Fin</th></tr></thead>
        <tbody>${preview.map((p) => html`<tr key=${p.name} data-late=${lateSet.has(p.name) ? 'true' : 'false'}><td>${p.name}${lateSet.has(p.name) ? html`<div class="ags-flag"><${ui.Icon} name="alert" size=${13} />Después del fin del release</div>` : null}</td><td class="mono nowrap">${fmt.date(p.start)}</td><td class="mono nowrap">${fmt.date(p.end)}</td></tr>`)}</tbody></table></div>` : null}
      <${AddRiskNote} risk=${risk} release=${release} count=${preview.length} />
    </${ui.Modal}>`;
  }
  /* Aviso al agregar iteraciones que alargan el release o superan su línea base (control de cambios de nivel 2). */
  function AddRiskNote({ risk, release, count = 1 }) {
    if (!risk.afterEnd.length && !risk.overBaseline && !risk.overPlanned) return null;
    const bl = A.hasBaseline(release);
    const lines = [];
    if (risk.afterEnd.length) lines.push((risk.afterEnd.length === 1 ? spName(risk.afterEnd[0]) + ' termina' : fmt.num(risk.afterEnd.length) + ' iteraciones terminan') + ' después del fin del release (' + fmt.date(risk.end) + ').');
    if (risk.overBaseline) lines.push('El release pasaría a ' + fmt.num(risk.total) + ' iteraciones frente a ' + fmt.num(risk.base) + ' de su línea base.');
    else if (risk.overPlanned) lines.push('El release pasaría a ' + fmt.num(risk.total) + ' iteraciones frente a ' + fmt.num(risk.planned) + ' planeadas.');
    return html`<${Callout} tone="warn" role="add-risk" title=${bl ? 'Requiere control de cambios (nivel 2)' : 'El release se alarga'}>
      <ul>${lines.map((l) => html`<li key=${l}>${l}</li>`)}</ul>
      <span>${bl ? 'El release tiene línea base: después de ' + (count === 1 ? 'crearla' : 'crearlas') + ', registra la solicitud de cambio (4.6 Realizar el control integrado de cambios) y, aprobada, actualiza la línea base del release.' : 'Ajusta la fecha de fin o las iteraciones planeadas del release para que el plan las incluya.'}</span>
    </${Callout}>`;
  }

  /* Inicio de la iteración: el objetivo es el compromiso del equipo (Guía de Scrum 2020) y el total de los elementos
     seleccionados es el pronóstico que queda fijo para la velocidad y el burndown. Si hoy está fuera de las fechas
     planeadas, ofrece moverlas desde hoy conservando la duración en días hábiles. */
  function StartSprintDialog({ close, sprint, unit, total, count, unest, firstColumn, requireGoal, cal, todayIso, sprints, onConfirm }) {
    const [goal, setGoal] = useState(() => str(sprint.goal));
    const [dates, setDates] = useState('keep');
    const [err, setErr] = useState(null);
    const valid = D.valid(sprint.start) && D.valid(sprint.end) && sprint.end >= sprint.start;
    const outside = valid ? (todayIso < sprint.start ? 'before' : todayIso > sprint.end ? 'after' : null) : null;
    const moved = useMemo(() => {
      if (!outside || !cal) return null;
      const dur = Math.max(1, cal.countWork(sprint.start, sprint.end) || 1);
      const start = cal.addWork(todayIso, 0);
      return { start, end: cal.addWork(start, dur - 1), dur };
    }, [outside, cal, sprint.start, sprint.end, todayIso]);
    const cross = moved ? overlapsOf({ id: sprint.id, start: moved.start, end: moved.end }, sprints) : [];
    const hasGoal = !!goal.trim();
    const submit = () => {
      if (requireGoal && !hasGoal) { setErr('Escribe el objetivo de la iteración: es el compromiso del equipo para esta iteración. Los elementos seleccionados son el pronóstico para lograrlo.'); return; }
      onConfirm({ goal: goal.trim(), dates: dates === 'adjust' && moved ? { start: moved.start, end: moved.end } : null });
      close();
    };
    const capTxt = PM.isNum(sprint.capacity) ? ' (capacidad ' + fpts(Number(sprint.capacity), unit) + ')' : '';
    return html`<${ui.Modal} title=${'Iniciar ' + spName(sprint)} onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="sprint" data-role="start-confirm" onClick=${submit} autoFocus=${!!str(sprint.goal).trim()}>Iniciar iteración</${ui.Button}>`}>
      <div class="stack-sm small" data-role="start-dialog">
        <${ui.Field} label="Objetivo de la iteración" for="ags-start-goal" required=${requireGoal} error=${err} hint="Es el compromiso del equipo: qué valor entrega al terminar la iteración.">
          <${ui.TextArea} id="ags-start-goal" value=${goal} onValue=${(v) => { setGoal(v); setErr(null); }} rows=${2} autoFocus=${!str(sprint.goal).trim()} placeholder="Qué valor entrega el equipo al terminar la iteración" />
        </${ui.Field}>
        ${!requireGoal && !hasGoal ? html`<p class="ags-flag" data-role="start-no-goal"><${ui.Icon} name="alert" size=${14} />Sin objetivo: la iteración no tendrá un compromiso con el que evaluar la revisión.</p>` : null}
        <p data-role="start-forecast">Pronóstico: <strong>${fpts(total, unit)}</strong> en ${count} ${count === 1 ? 'elemento' : 'elementos'}${capTxt}. Al iniciar, este total queda fijo como lo comprometido para la velocidad y el burndown; los elementos pueden ajustarse con el dueño del producto sin cambiar el objetivo.</p>
        ${unest ? html`<p class="ags-flag"><${ui.Icon} name="alert" size=${14} />${unest === 1 ? '1 elemento no está estimado y cuenta como 0.' : unest + ' elementos no están estimados y cuentan como 0.'}</p>` : null}
        <p>Los elementos que están en el backlog del producto pasan a «${firstColumn}» del tablero.</p>
        ${outside && moved ? html`<fieldset class="ags-radio-group" data-role="start-dates">
          <legend>${outside === 'before' ? 'Hoy (' + fmt.date(todayIso) + ') es anterior al inicio planeado (' + fmt.date(sprint.start) + ')' : 'Hoy (' + fmt.date(todayIso) + ') es posterior al fin planeado (' + fmt.date(sprint.end) + ')'}</legend>
          <label class="ags-radio"><input type="radio" name="ags-start-dates" value="keep" checked=${dates === 'keep'} onChange=${() => setDates('keep')} /><span><strong>Conservar las fechas planeadas</strong><br /><span class="xsmall muted">${fmt.date(sprint.start)} – ${fmt.date(sprint.end)}. El burndown y los días restantes siguen esas fechas.</span></span></label>
          <label class="ags-radio"><input type="radio" name="ags-start-dates" value="adjust" checked=${dates === 'adjust'} onChange=${() => setDates('adjust')} /><span><strong>Ajustar las fechas desde hoy</strong><br /><span class="xsmall muted">${fmt.date(moved.start)} – ${fmt.date(moved.end)} (${wdText(moved.dur)}, la misma duración).</span></span></label>
          ${dates === 'adjust' && cross.length ? html`<span class="ags-flag"><${ui.Icon} name="alert" size=${14} />Las fechas nuevas se cruzan con ${cross.map((o) => spName(o)).join(', ')}: ajústala${cross.length === 1 ? '' : 's'} después en «Editar».</span>` : null}
        </fieldset>` : null}
      </div>
    </${ui.Modal}>`;
  }

  function CloseSprintDialog({ close, sprint, unit, done, committed, pending, nextName, nextExists, nextLate, onConfirm }) {
    const [choice, setChoice] = useState('backlog');
    const pendingPts = sumEst(pending);
    return html`<${ui.Modal} title=${'Cerrar ' + spName(sprint)} onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="check" onClick=${() => { onConfirm(choice); close(); }}>Cerrar iteración</${ui.Button}>`}>
      <p class="small">Se registran <strong>${fpts(done, unit)}</strong> terminados frente a ${fpts(committed, unit)} comprometidos. La velocidad de esta iteración queda fija desde ahora.</p>
      ${pending.length ? html`<fieldset class="ags-radio-group" data-role="close-choice">
        <legend>${pending.length === 1 ? 'Qué hacer con el elemento no terminado' : 'Qué hacer con los ' + pending.length + ' elementos no terminados'} (${fpts(pendingPts, unit)})</legend>
        <label class="ags-radio"><input type="radio" name="ags-close" value="backlog" checked=${choice === 'backlog'} onChange=${() => setChoice('backlog')} /><span><strong>Devolverlos al backlog del producto</strong><br /><span class="xsmall muted">Quedan sin iteración y con estado «Backlog del producto» para volver a priorizarlos.</span></span></label>
        <label class="ags-radio"><input type="radio" name="ags-close" value="next" checked=${choice === 'next'} onChange=${() => setChoice('next')} /><span><strong>Pasarlos a ${nextExists ? '«' + nextName + '»' : 'una nueva iteración («' + nextName + '»)'}</strong><br /><span class="xsmall muted">${nextExists ? 'Conservan su estado en el tablero.' : 'Se crea la iteración siguiente con la duración configurada, después de la última iteración del proyecto.'}</span>${!nextExists && nextLate ? html`<span class="ags-flag" data-role="close-next-late"><${ui.Icon} name="alert" size=${13} />${nextLate}</span>` : null}</span></label>
      </fieldset>
      <ul class="small" style="margin:0;padding-left:18px">${pending.slice(0, 8).map((it) => html`<li key=${it.id}><span class="code-tag">${it.code}</span> ${it.title || 'Sin título'}</li>`)}${pending.length > 8 ? html`<li class="faint">y ${pending.length - 8} más</li>` : null}</ul>` : html`<p class="small muted">Todos los elementos de la iteración están terminados.</p>`}
    </${ui.Modal}>`;
  }

  function DeleteReleaseDialog({ close, release, sprintCount, itemCount, keepTask, onConfirm }) {
    const [choice, setChoice] = useState('keep');
    return html`<${ui.Modal} title=${'Eliminar «' + relName(release) + '»'} onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="danger-solid" icon="trash" onClick=${() => { onConfirm(choice); close(); }}>Eliminar release</${ui.Button}>`}>
      <p class="small">${itemCount ? itemCount + (itemCount === 1 ? ' elemento del backlog queda' : ' elementos del backlog quedan') + ' sin release (no se eliminan). ' : ''}Se quita también el vínculo con la actividad del cronograma y con los costos reales imputados al release.</p>
      ${keepTask ? html`<p class="small" data-role="delete-keep-progress">La actividad «${keepTask.name}» conserva el avance calculado desde el backlog (${fmt.pct100(keepTask.progress, 1)}${keepTask.actualStart ? ', inicio real ' + fmt.date(keepTask.actualStart) : ''}${keepTask.actualFinish ? ', fin real ' + fmt.date(keepTask.actualFinish) : ''}) como su avance registrado: el valor ganado del proyecto no cambia y, desde ahora, el avance se actualiza en el cronograma.</p>` : null}
      ${sprintCount ? html`<fieldset class="ags-radio-group" data-role="delete-choice">
        <legend>${sprintCount === 1 ? 'La iteración del release' : 'Las ' + sprintCount + ' iteraciones del release'}</legend>
        <label class="ags-radio"><input type="radio" name="ags-del" value="keep" checked=${choice === 'keep'} onChange=${() => setChoice('keep')} /><span><strong>Conservarlas sin release</strong><br /><span class="xsmall muted">Mantienen sus elementos, su velocidad y sus documentos.</span></span></label>
        <label class="ags-radio"><input type="radio" name="ags-del" value="delete" checked=${choice === 'delete'} onChange=${() => setChoice('delete')} /><span><strong>Eliminarlas también</strong><br /><span class="xsmall muted">Sus elementos quedan sin iteración; los documentos de las iteraciones se conservan.</span></span></label>
      </fieldset>` : null}
    </${ui.Modal}>`;
  }

  /* ==================================================================== ACCIONES (leen el estado más reciente de ref) */
  function makeActions(ref) {
    const S = () => ref.current;
    const guard = () => { if (!S().canWrite) { PM.toast('Estás en modo de solo lectura.'); return false; } return true; };
    /* una sola escritura de la herramienta «agile» por acción, sobre lo último que se leyó */
    const commitAgile = (fn) => {
      const d = PM.clone(S().m.agileData) || {};
      d.releases = arr(d.releases); d.sprints = arr(d.sprints);
      fn(d);
      /* «sin línea base» se guarda sin la clave: la normalización de la herramienta convierte null en {} */
      for (const r of d.releases) if (r.baseline !== undefined && !A.hasBaseline(r)) delete r.baseline;
      return S().m.saveAgile(d);
    };
    const saveItems = (list) => Promise.all(list.map((it) => S().m.saveItem(it)));
    const relOf = (id) => S().releases.find((r) => r.id === id) || null;
    const sprintsOfRel = (relId) => (relId ? C.sprintsOfRelease(S().m.sprints, relId) : S().m.sprints.filter((s) => !s.releaseId || !S().releases.some((r) => r.id === s.releaseId)));
    const planSprints = (release, count) => {
      const { m, project, cal } = S();
      const relSprints = sprintsOfRel(release ? release.id : null);
      let n = sprintNumber(m.sprints);
      const out = [];
      let all = [...m.sprints], mine = [...relSprints];
      for (let k = 0; k < count; k++) {
        const dt = nextSprintDates(cal, m.settings, all, mine, release, project, m.statusDate);
        const s = { name: 'Iteración ' + n++, start: dt.start, end: dt.end };
        out.push(s); all = [...all, s]; mine = [...mine, s];
      }
      return out;
    };
    const newSprint = (p, release, cap) => ({ id: PM.uid('spr'), name: p.name, releaseId: release ? release.id : null, goal: '', start: p.start, end: p.end, status: 'planeado', capacity: cap, committed: null, completed: null, docs: {}, notes: '' });
    const lastCapacity = (relId) => { const l = sprintsOfRel(relId).filter((s) => PM.isNum(s.capacity)); const all = S().m.sprints.filter((s) => PM.isNum(s.capacity)); const x = l[l.length - 1] || all[all.length - 1]; return x ? Number(x.capacity) : null; };
    const wbsGroups = () => {
      const { m } = S(); const adaptive = [], other = [];
      for (const { node, code } of m.tree.flat) { const ap = m.approach.get(node.id); (ap === 'adaptativo' ? adaptive : other).push({ value: node.id, label: code + ' ' + (node.name || 'Sin nombre') }); }
      return { adaptive, other };
    };
    const currentTaskOf = (r) => taskIdOfRelease(S().m, r.id) || '';
    /* Avance que el núcleo calcula hoy desde el backlog para la actividad del release (m.effSchedule, agileDerived): al
       romper el vínculo se guarda como avance registrado (igual que el editor de actividades de 40-schedule), así el EV,
       el SPI y la curva S del proyecto no caen. */
    const derivedOf = (m, taskId, relId) => {
      const t = taskId ? arr(m.effSchedule && m.effSchedule.tasks).find((x) => x.id === taskId) : null;
      if (!t || !t.agileDerived || (relId && t.releaseId !== relId)) return null;
      return { progress: num(t.progress, 0), actualStart: D.valid(t.actualStart) ? t.actualStart : null, actualFinish: num(t.progress, 0) >= 100 && D.valid(t.actualFinish) ? t.actualFinish : null };
    };
    /* Quita el vínculo de las actividades con el release: la que lo representaba conserva su avance derivado y ninguna
       queda con task.releaseId del release. Una sola escritura del cronograma. */
    const unlinkTasks = (m, relId, taskId) => {
      const keep = derivedOf(m, taskId, relId);
      const tasks = arr(m.schedule.tasks);
      if (!keep && !tasks.some((t) => t.releaseId === relId)) return null;
      const next = PM.clone(m.schedule);
      next.tasks = next.tasks.map((t) => {
        if (!t || typeof t !== 'object') return t;
        let x = t;
        if (keep && t.id === taskId) x = { ...x, progress: keep.progress, actualStart: keep.actualStart || t.actualStart || null, actualFinish: keep.actualFinish };
        if (t.releaseId === relId) x = { ...x, releaseId: null };
        return x;
      });
      m.saveSchedule(next);
      return keep;
    };
    const taskOptions = (r) => {
      const { m } = S();
      /* actividades que ya representan otro release (regla del núcleo: un release por actividad) */
      const taken = new Map();
      for (const [tid, x] of A.linksOf(arr(m.schedule.tasks), m.agileData || m.agile)) if (x.id !== r.id) taken.set(tid, x);
      const codes = m.tree.codes;
      return arr(m.schedule.tasks).filter((t) => !taken.has(t.id)).map((t) => ({ value: t.id, label: (t.wbsId && codes.get(t.wbsId) ? codes.get(t.wbsId) + ' · ' : '') + (t.name || 'Actividad sin nombre') + (t.milestone ? ' (hito)' : '') }));
    };
    const editRelease = (r, isNew) => {
      const { m } = S();
      PM.openModal((close) => html`<${ReleaseEditor} close=${close} release=${{ ...r, currentTaskId: isNew ? '' : currentTaskOf(r) }} isNew=${isNew} wbsGroups=${wbsGroups()} taskOptions=${taskOptions(r)} currency=${m.currency}
        onSave=${(f) => saveRelease(r, isNew, f)} />`);
    };
    const saveRelease = (r, isNew, f) => {
      if (!guard()) return;
      const { m } = S();
      const prevTask = isNew ? null : currentTaskOf(r) || null;
      const id = isNew ? PM.uid('rel') : r.id;
      commitAgile((d) => {
        const patch = { name: f.name, goal: f.goal, start: f.start, end: f.end, status: f.status, budget: f.budget, plannedSprints: f.plannedSprints, wbsId: f.wbsId, taskId: f.taskId, notes: f.notes };
        if (isNew) d.releases.push({ id, ...patch });
        else { const x = d.releases.find((y) => y.id === id); if (x) Object.assign(x, patch); }
      });
      /* la actividad que deja de representar el release pierde su vínculo (task.releaseId) y conserva el avance que se
         calculaba desde el backlog */
      if (prevTask && prevTask !== f.taskId) {
        const tasks = arr(m.schedule.tasks);
        const keep = derivedOf(m, prevTask, id);
        if (keep || tasks.some((t) => t.id === prevTask && t.releaseId === id)) {
          const next = PM.clone(m.schedule);
          next.tasks = next.tasks.map((t) => (t && t.id === prevTask ? { ...t, ...(t.releaseId === id ? { releaseId: null } : null), ...(keep ? { progress: keep.progress, actualStart: keep.actualStart || t.actualStart || null, actualFinish: keep.actualFinish } : null) } : t));
          m.saveSchedule(next);
        }
        if (keep) {
          const t = tasks.find((x) => x.id === prevTask);
          PM.toast('«' + ((t && t.name) || 'La actividad') + '» deja de calcularse desde el backlog y conserva su avance de ' + fmt.pct100(keep.progress, 1) + '.');
        }
      }
      S().select(id, null);
      PM.toast(isNew ? 'Release «' + f.name + '» creado.' : 'Release «' + f.name + '» actualizado.');
    };
    const api = {
      releaseNew: () => { if (guard()) editRelease({ name: '', status: 'planeado', plannedSprints: null, budget: null }, true); },
      releaseEdit: (r) => { if (guard()) editRelease(r, false); },
      releaseDelete: (r) => {
        if (!guard()) return;
        const { m } = S();
        const rs = sprintsOfRel(r.id);
        const itemCount = m.items.filter((it) => it.releaseId === r.id).length;
        const tid = taskIdOfRelease(m, r.id);
        const keep0 = derivedOf(m, tid, r.id);
        const tk = keep0 ? arr(m.schedule.tasks).find((t) => t.id === tid) : null;
        const keepTask = keep0 ? { ...keep0, name: (tk && tk.name) || 'Actividad sin nombre' } : null;
        PM.openModal((close) => html`<${DeleteReleaseDialog} close=${close} release=${r} sprintCount=${rs.length} itemCount=${itemCount} keepTask=${keepTask} onConfirm=${async (choice) => {
          const cur = S().m;
          const dropSprints = new Set(choice === 'delete' ? rs.map((s) => s.id) : []);
          const changed = cur.items.filter((it) => it.releaseId === r.id || (it.sprintId && dropSprints.has(it.sprintId))).map((it) => ({ ...it, releaseId: it.releaseId === r.id ? null : it.releaseId, sprintId: it.sprintId && dropSprints.has(it.sprintId) ? null : it.sprintId || null, sprintAddedDate: it.sprintId && dropSprints.has(it.sprintId) ? null : it.sprintAddedDate || null }));
          commitAgile((d) => {
            d.releases = d.releases.filter((x) => x.id !== r.id);
            d.sprints = choice === 'delete' ? d.sprints.filter((s) => s.releaseId !== r.id) : d.sprints.map((s) => (s.releaseId === r.id ? { ...s, releaseId: null } : s));
          });
          /* la actividad del release conserva el avance calculado desde el backlog (con lo leído antes del cambio) */
          unlinkTasks(cur, r.id, taskIdOfRelease(cur, r.id));
          if (arr(cur.costs.actuals).some((a) => a.releaseId === r.id)) { const next = PM.clone(cur.costs); next.actuals = next.actuals.map((a) => (a && a.releaseId === r.id ? { ...a, releaseId: null } : a)); cur.saveCosts(next); }
          S().select(null, null);
          S().requestFocus({ test: (mm) => !mm.releases.some((x) => x.id === r.id), targets: ['[data-role="release-detail"] h2', '.ags-side-head h2', '.page-head h1'] });
          await saveItems(changed);
          PM.toast('Release «' + relName(r) + '» eliminado.');
        }} />`);
      },
      releaseBaseline: async (r) => {
        if (!guard()) return;
        const { m, relInfo } = S();
        const info = relInfo.get(r.id); if (!info) return;
        const late0 = D.valid(r.end) ? info.sprints.filter((s) => D.valid(s.end) && s.end > r.end) : [];
        const ok = await PM.confirm({ title: 'Fijar línea base de «' + relName(r) + '»', confirmText: 'Fijar línea base', body: html`<div class="stack-sm small">
          <p>La línea base compromete el release con el dueño del producto y los interesados:</p>
          <ul style="margin:0;padding-left:18px"><li>Alcance: ${fpts(info.prog.total, m.unit)} (${info.prog.count} elementos)</li><li>Fin: ${fmt.date(r.end)}</li><li>Presupuesto: ${fmt.money(r.budget, m.currency)}</li><li>Iteraciones: ${fmt.num(baselineSprints(r, info.sprints))}</li></ul>
          ${late0.length ? html`<p class="ags-flag" data-role="baseline-late"><${ui.Icon} name="alert" size=${14} />${late0.map((s) => spName(s)).join(', ')} ${late0.length === 1 ? 'termina' : 'terminan'} después del fin del release: ajusta la fecha de fin o las iteraciones antes de fijar la línea base.</p>` : null}
          <p>Después, los cambios de alcance de más de ±${fmt.num(m.settings.scopeChangeThreshold, 1)} % o cualquier cambio de fecha, presupuesto o número de iteraciones requieren una solicitud de cambio (4.6).</p></div>` });
        if (!ok) return;
        const cur = S();
        const prog = cur.relInfo.get(r.id).prog;
        const nSpr = baselineSprints(relOf(r.id) || r, cur.relInfo.get(r.id).sprints);
        commitAgile((d) => {
          const x = d.releases.find((y) => y.id === r.id); if (!x) return;
          x.baseline = { date: cur.m.statusDate, points: prog.total, end: x.end || null, budget: num(x.budget, 0), sprints: nSpr, changeRef: null, items: baselineItems(cur, r.id) };
          x.pendingChange = null;
          if (x.status !== 'en-curso' && x.status !== 'cerrado') x.status = 'comprometido';
        });
        PM.toast('Línea base del release fijada: ' + fpts(prog.total, cur.m.unit) + '.');
      },
      releaseChangeRequest: async (r) => {
        if (!guard()) return;
        const tCR = PM.templates['solicitud-cambio'], tCL = PM.templates['registro-cambios'];
        if (!tCR || !tCL) { PM.toast('Las plantillas de solicitud y registro de cambios no están disponibles en esta versión.', { tone: 'crit' }); return; }
        const s0 = S();
        const crInsts = s0.docsIdx.byTemplate['solicitud-cambio'] || [];
        const code = nextCode([...s0.changeRows.map((x) => x.id), ...crInsts.map((d) => d.fields && d.fields.codigoCambio)], 'CC');
        const info0 = s0.relInfo.get(r.id);
        const det0 = varianceDetail(r, info0.v, s0.m.settings, s0.m.unit, s0.m.currency, s0.cal, info0.sprints);
        const ok = await PM.confirm({ title: 'Registrar solicitud de cambio ' + code, confirmText: 'Registrar solicitud', body: html`<div class="stack-sm small">
          <p>Se crea la solicitud de cambio ${code} prellenada con el impacto del release «${relName(r)}» y se agrega al registro de cambios con estado «Registrada»:</p>
          <ul style="margin:0;padding-left:18px">${det0.lines.filter((l) => l.flag).map((l) => html`<li key=${l.id}>${l.text}</li>`)}</ul>
          <p>Cuando el comité de control de cambios la apruebe en el registro de cambios, podrás actualizar la línea base del release.</p></div>` });
        if (!ok) return;
        const { m, project, docsIdx, cal } = S();
        const rel = relOf(r.id) || r;
        const info = S().relInfo.get(r.id);
        const v = info.v, det = varianceDetail(rel, v, m.settings, m.unit, m.currency, cal, info.sprints);
        const b = rel.baseline || {};
        const nowItems = (S().idx.byRelease.get(rel.id) || []).filter(A.countable);
        const list12 = (xs, f) => xs.slice(0, 12).map(f).join('; ') + (xs.length > 12 ? '; y ' + (xs.length - 12) + ' más' : '');
        let addedText;
        if (Array.isArray(b.items)) {
          /* con los elementos de la línea base: agregados, retirados y reestimados */
          const base = new Map(b.items.filter((x) => x && x.id).map((x) => [x.id, num(x.estimate, 0)]));
          const byId = new Map(m.items.map((it) => [it.id, it]));
          const added = nowItems.filter((it) => !base.has(it.id));
          const removed = [...base.keys()].filter((id) => !nowItems.some((it) => it.id === id));
          const reest = nowItems.filter((it) => base.has(it.id) && base.get(it.id) !== A.estimate(it));
          addedText = (added.length ? ' Agregados después de la línea base: ' + list12(added, (it) => it.code + ' ' + (it.title || '') + ' (' + fpts(A.estimate(it), m.unit) + ')') + '.' : '')
            + (removed.length ? ' Retirados del release: ' + list12(removed, (id) => { const it = byId.get(id); return it ? it.code + ' ' + (it.title || '') : id; }) + '.' : '')
            + (reest.length ? ' Reestimados: ' + list12(reest, (it) => it.code + ' (' + fpts(base.get(it.id), m.unit) + ' → ' + fpts(A.estimate(it), m.unit) + ')') + '.' : '');
        } else {
          const added = nowItems.filter((it) => D.valid(b.date) && ((D.valid(it.createdAt) && it.createdAt > b.date) || (D.valid(it.releaseAddedDate) && it.releaseAddedDate > b.date)));
          addedText = added.length ? ' Elementos agregados después de la línea base: ' + list12(added, (it) => it.code + ' ' + (it.title || '') + ' (' + fpts(A.estimate(it), m.unit) + ')') + '.' : '';
        }
        const changed = det.lines.filter((l) => l.flag);
        const scopeText = 'Release «' + relName(rel) + '»: ' + fpts(v.total, m.unit) + ' frente a ' + fpts(v.baselinePoints, m.unit) + ' de la línea base (' + signedPts(v.total - v.baselinePoints, m.unit) + ', ' + signedPct(v.scopePct) + ').' + addedText;
        const node = rel.wbsId ? m.tree.byId.get(rel.wbsId) : null;
        const taskId = currentTaskOf(rel);
        const task = taskId ? arr(m.schedule.tasks).find((t) => t.id === taskId) : null;
        const affected = ['Línea base del release «' + relName(rel) + '»', 'Backlog del producto (alcance del release)', 'Plan de releases'];
        if (node) affected.push('Entregable de la EDT ' + (m.tree.codes.get(node.id) || '') + ' ' + (node.name || ''));
        if (task) affected.push('Actividad del cronograma «' + (task.name || '') + '»');
        const date = today();
        const values = {
          codigoCambio: code, fechaSolicitud: date, solicitante: 'Dueño del producto', tipoCambio: 'Actualización',
          descripcionCambio: 'Actualizar la línea base del release «' + relName(rel) + '». ' + changed.map((l) => l.text).join(' '),
          justificacion: 'El release está comprometido con una línea base y el cambio supera el primer nivel de control (ajustes del backlog dentro de ±' + fmt.num(det.thr, 1) + ' % del alcance, sin cambiar fecha, presupuesto ni número de iteraciones). Según el control de cambios en dos niveles, requiere la decisión del comité de control de cambios (4.6 Realizar el control integrado de cambios).',
          impactoAlcance: scopeText,
          diasCronograma: det.wd,
          impactoCronograma: (v.endRemoved ? 'Se quitó la fecha de fin del release (línea base: ' + fmt.date(b.end, 'long') + '): el release queda sin fecha comprometida hasta que el comité decida.'
            : v.dateChange ? 'La fecha de fin del release pasa del ' + fmt.date(b.end, 'long') + ' al ' + fmt.date(rel.end, 'long') + ' (' + sgn(wdDiff(cal, b.end, rel.end)) + wdText(wdDiff(cal, b.end, rel.end)) + ').' : det.after.length ? 'La fecha de fin del release no cambia (' + fmt.date(rel.end, 'long') + '), pero el trabajo se extiende hasta el ' + fmt.date(det.effEnd, 'long') + ' (' + sgn(det.wd) + wdText(det.wd) + ' frente a la línea base).' : 'Sin cambio en la fecha de fin del release (' + fmt.date(b.end, 'long') + ').')
            + (v.sprintChange ? ' El release pasa de ' + fmt.num(Math.round(num(b.sprints, 0))) + ' a ' + fmt.num(Math.round(num(b.sprints, 0)) + v.sprintChange) + ' iteraciones.' : '')
            + (det.after.length ? ' ' + (det.after.length === 1 ? 'Iteración que termina' : 'Iteraciones que terminan') + ' después del fin del release: ' + det.after.map((s) => spName(s) + ' (' + fmt.date(s.start) + ' – ' + fmt.date(s.end) + ')').join(', ') + '.' : '')
            + ((v.endRemoved || v.dateChange || det.after.length) && task ? ' Afecta la actividad «' + (task.name || '') + '» del cronograma.' : ''),
          valorCosto: Math.round(v.budgetChange * 100) / 100,
          impactoCosto: Math.abs(v.budgetChange) > 0.5 ? 'El presupuesto del release (BAC) pasa de ' + fmt.money(b.budget, m.currency) + ' a ' + fmt.money(rel.budget, m.currency) + '.' : 'Sin cambio en el presupuesto del release (' + fmt.money(b.budget, m.currency) + ').',
          elementosAfectados: affected,
          decision: 'Registrada',
        };
        let docId;
        try { docId = await createDoc({ pid: m.pid, project, tid: 'solicitud-cambio', insts: docsIdx.byTemplate['solicitud-cambio'] || [], title: tCR.name + ' ' + code + ' — ' + relName(rel), values }); }
        catch (e) { return; }
        const row = plain({ id: code, fecha: date, solicitante: 'Dueño del producto', descripcion: values.descripcionCambio, tipo: 'Actualización', impactoAlcance: scopeText, impactoCronograma: det.wd, impactoCosto: values.valorCosto, estado: 'Registrada' });
        await S().saveChangeRows([...S().changeRows, row]);
        commitAgile((d) => { const x = d.releases.find((y) => y.id === r.id); if (x) x.pendingChange = { code, docId, date }; });
        PM.toast('Solicitud ' + code + ' creada y agregada al registro de cambios.');
      },
      releaseUpdateBaseline: async (r, code) => {
        if (!guard()) return;
        const { m, relInfo } = S();
        const info = relInfo.get(r.id); if (!info) return;
        /* las iteraciones aprobadas que terminan después del fin llevan el fin del release a la última de ellas */
        const lastEnd0 = D.max(...info.sprints.map((s) => s.end).filter(D.valid));
        const newEnd0 = lastEnd0 && D.valid(r.end) && lastEnd0 > r.end ? lastEnd0 : r.end;
        const ok = await PM.confirm({ title: 'Actualizar línea base de «' + relName(r) + '»', confirmText: 'Actualizar línea base', body: html`<div class="stack-sm small">
          <p>Con la solicitud ${code} aprobada, la nueva línea base del release queda así:</p>
          <ul style="margin:0;padding-left:18px"><li>Alcance: ${fpts(info.prog.total, m.unit)}</li><li>Fin: ${fmt.date(newEnd0)}${newEnd0 !== r.end ? ' (fin de ' + spName(info.sprints.find((s) => s.end === lastEnd0)) + '; antes ' + fmt.date(r.end) + ')' : ''}</li><li>Presupuesto: ${fmt.money(r.budget, m.currency)}</li><li>Iteraciones: ${fmt.num(baselineSprints(r, info.sprints))}</li></ul>
          <p>Si el cambio afecta la línea base del proyecto, establece también una nueva en «Líneas base».</p></div>` });
        if (!ok) return;
        const cur = S();
        const info1 = cur.relInfo.get(r.id);
        const prog = info1.prog;
        commitAgile((d) => {
          const x = d.releases.find((y) => y.id === r.id); if (!x) return;
          const lastEnd = D.max(...info1.sprints.map((s) => s.end).filter(D.valid));
          if (lastEnd && D.valid(x.end) && lastEnd > x.end) x.end = lastEnd;
          const nSpr = baselineSprints(x, info1.sprints);
          if (nSpr > Math.round(num(x.plannedSprints, 0))) x.plannedSprints = nSpr;
          x.baseline = { date: cur.m.statusDate, points: prog.total, end: x.end || null, budget: num(x.budget, 0), sprints: nSpr, changeRef: code, items: baselineItems(cur, r.id) };
          x.pendingChange = null;
        });
        PM.toast('Línea base del release actualizada con ' + code + '.');
      },
      releaseDiscardChange: (r) => { if (guard()) commitAgile((d) => { const x = d.releases.find((y) => y.id === r.id); if (x) x.pendingChange = null; }); },
      sprintAdd: async (release) => {
        if (!guard()) return;
        const p = planSprints(release, 1)[0];
        /* una iteración que termina después del fin del release o que supera su línea base alarga el release: se avisa
           antes de crearla (control de cambios de nivel 2 si el release tiene línea base) */
        const risk = addRisks(release, release ? sprintsOfRel(release.id).length : 0, [p]);
        if (risk.afterEnd.length || risk.overBaseline) {
          const ok = await PM.confirm({ title: 'Agregar ' + p.name + ' a «' + relName(release) + '»', confirmText: 'Agregar iteración', body: html`<div class="stack-sm small" data-role="add-confirm">
            <p>${p.name} iría del ${fmt.date(p.start)} al ${fmt.date(p.end)}, después de la última iteración del proyecto (el equipo trabaja una iteración a la vez).</p>
            <${AddRiskNote} risk=${risk} release=${release} count=${1} /></div>` });
          if (!ok) return;
        }
        const s = newSprint(p, release, lastCapacity(release ? release.id : null));
        commitAgile((d) => { d.sprints.push(s); });
        S().select(release ? release.id : NONE, s.id);
        /* sin línea base, superar las iteraciones planeadas no exige control de cambios, pero se dice */
        PM.toast(spName(s) + ' creada: ' + fmt.date(s.start) + ' – ' + fmt.date(s.end) + '.' + (risk.overPlanned && !risk.afterEnd.length ? ' El release queda con ' + risk.total + ' iteraciones frente a ' + risk.planned + ' planeadas: actualiza las planeadas en «Editar release».' : ''));
      },
      sprintGenerate: (release) => {
        if (!guard() || !release) return;
        const existing = sprintsOfRel(release.id).length;
        PM.openModal((close) => html`<${GenerateDialog} close=${close} release=${release} existing=${existing} planned=${Math.round(num(release.plannedSprints, 0))} plan=${(n) => planSprints(release, n)}
          onConfirm=${(list) => {
            if (!list.length) return;
            const cap = lastCapacity(release.id);
            const made = list.map((p) => newSprint(p, release, cap));
            commitAgile((d) => { d.sprints.push(...made); });
            S().select(release.id, made[0].id);
            PM.toast(made.length === 1 ? 'Se creó 1 iteración.' : 'Se crearon ' + made.length + ' iteraciones.');
          }} />`);
      },
      sprintEdit: (s) => {
        if (!guard()) return;
        const opts = S().releases.map((r) => ({ value: r.id, label: relName(r) }));
        PM.openModal((close) => html`<${SprintEditor} close=${close} sprint=${s} releaseOptions=${opts} releases=${S().releases} sprints=${S().m.sprints} onSave=${(f) => {
          commitAgile((d) => { const x = d.sprints.find((y) => y.id === s.id); if (x) Object.assign(x, { name: f.name, releaseId: f.releaseId, goal: f.goal, start: f.start, end: f.end, capacity: f.capacity, notes: f.notes }); });
          S().select(f.releaseId || NONE, s.id);
          PM.toast(spName(f) + ' actualizada.');
        }} />`);
      },
      sprintPatch: (s, patch) => { if (guard()) commitAgile((d) => { const x = d.sprints.find((y) => y.id === s.id); if (x) Object.assign(x, patch); }); },
      sprintDelete: async (s) => {
        if (!guard()) return;
        const list = S().m.items.filter((it) => it.sprintId === s.id);
        const ok = await PM.confirm({ title: 'Eliminar ' + spName(s), tone: 'danger', confirmText: 'Eliminar iteración', body: (list.length ? list.length + (list.length === 1 ? ' elemento queda' : ' elementos quedan') + ' sin iteración (conservan su release y su estado). ' : '') + 'Los documentos de la iteración se conservan en la lista de documentos.' });
        if (!ok) return;
        commitAgile((d) => { d.sprints = d.sprints.filter((x) => x.id !== s.id); });
        /* el botón que abrió la confirmación desaparece con la fila: el foco pasa al planificador o a la tabla */
        S().requestFocus({ test: (mm) => !mm.sprints.some((x) => x.id === s.id), targets: ['[data-role="planner"] [data-role="sprint-close"]', '[data-role="planner"] [data-role="sprint-start"]:not([disabled])', '[data-role="planner"] h2', '[data-role="sprints"] h2'] });
        await saveItems(S().m.items.filter((it) => it.sprintId === s.id).map((it) => ({ ...it, sprintId: null, sprintAddedDate: null })));
        PM.toast(spName(s) + ' eliminada.');
      },
      itemAdd: (it, s) => {
        if (!guard() || s.status === 'cerrado') return;
        const st = S().m.settings;
        let next = { ...it, sprintId: s.id, sprintAddedDate: null };
        if (!next.releaseId && s.releaseId) next.releaseId = s.releaseId;
        if (s.status === 'en-curso') {
          next.sprintAddedDate = today();
          if (A.category(st, it.status) === 'nuevo') next = A.withStatus(st, next, A.firstColumn(st).id, today());
        }
        return S().m.saveItem(next);
      },
      itemRemove: (it, s) => {
        if (!guard() || s.status === 'cerrado') return;
        const st = S().m.settings;
        let next = { ...it, sprintId: null, sprintAddedDate: null };
        if (!A.isDone(st, it) && A.category(st, it.status) !== 'nuevo') next = A.withStatus(st, next, PM.AGILE.BACKLOG, today());
        return S().m.saveItem(next);
      },
      fillToCapacity: async (s, candidates, cap, current) => {
        if (!guard()) return;
        let room = cap - current; const pick = [];
        for (const it of candidates) { const e = A.estimate(it); if (!(e > 0)) continue; if (e <= room + 1e-9) { pick.push(it); room -= e; } }
        if (!pick.length) { PM.toast('Ningún candidato estimado cabe en la capacidad disponible.'); return; }
        await Promise.all(pick.map((it) => api.itemAdd(it, s)));
        PM.toast(pick.length === 1 ? 'Se agregó 1 elemento.' : 'Se agregaron ' + pick.length + ' elementos.');
      },
      sprintStart: (s) => {
        if (!guard()) return;
        const { m, cal } = S();
        const other = m.sprints.find((x) => x.status === 'en-curso' && x.id !== s.id);
        if (other) { PM.toast('Ya hay una iteración en curso (' + spName(other) + '). Ciérrala antes de iniciar otra.', { tone: 'crit' }); return; }
        const list = m.items.filter((it) => A.countable(it) && it.sprintId === s.id);
        const total = sumEst(list), unest = list.filter((it) => !PM.isNum(it.estimate)).length;
        PM.openModal((close) => html`<${StartSprintDialog} close=${close} sprint=${s} unit=${m.unit} total=${total} count=${list.length} unest=${unest} firstColumn=${A.firstColumn(m.settings).name}
          requireGoal=${m.settings.framework !== 'kanban'} cal=${cal} todayIso=${today()} sprints=${m.sprints}
          onConfirm=${async ({ goal, dates }) => {
            const cur = S().m, st = cur.settings, first = A.firstColumn(st).id, d0 = today();
            const now = cur.items.filter((it) => A.countable(it) && it.sprintId === s.id);
            const committed = sumEst(now);
            /* el foco vuelve al botón «Cerrar iteración» que reemplaza a «Iniciar iteración» */
            S().requestFocus({ test: (mm) => mm.sprints.some((x) => x.id === s.id && x.status === 'en-curso'), targets: ['[data-role="planner"][data-sprint-id="' + s.id + '"] [data-role="sprint-close"]', '[data-role="planner"] h2'] });
            await saveItems(now.filter((it) => A.category(st, it.status) === 'nuevo').map((it) => A.withStatus(st, it, first, d0)));
            commitAgile((d) => {
              const x = d.sprints.find((y) => y.id === s.id); if (!x) return;
              x.status = 'en-curso'; x.committed = committed;
              if (goal !== str(x.goal).trim()) x.goal = goal;
              if (dates) { x.start = dates.start; x.end = dates.end; }
              const r = x.releaseId ? d.releases.find((y) => y.id === x.releaseId) : null;
              if (r && (r.status === 'planeado' || r.status === 'comprometido' || !r.status)) r.status = 'en-curso';
            });
            PM.toast(spName(s) + ' iniciada: ' + fpts(committed, cur.unit) + ' comprometidos' + (dates ? '; fechas ajustadas al ' + fmt.date(dates.start) + ' – ' + fmt.date(dates.end) : '') + '.');
          }} />`);
      },
      sprintClose: (s) => {
        if (!guard()) return;
        const { m } = S();
        const st = m.settings;
        const list = m.items.filter((it) => A.countable(it) && it.sprintId === s.id);
        const done = sumEst(list.filter((it) => A.isDone(st, it)));
        const pending = list.filter((it) => !A.isDone(st, it));
        const committed = PM.isNum(s.committed) ? Number(s.committed) : sumEst(list);
        const rel = s.releaseId ? relOf(s.releaseId) : null;
        const later = sprintsOfRel(s.releaseId && rel ? s.releaseId : null).filter((x) => x.id !== s.id && x.status === 'planeado' && String(x.start || '') >= String(s.start || ''));
        const next = later[0] || null;
        const nextName = next ? spName(next) : 'Iteración ' + sprintNumber(m.sprints);
        /* la iteración nueva va después de la última del proyecto: puede terminar después del fin del release */
        const plan0 = !next && pending.length ? planSprints(rel, 1)[0] : null;
        const nextLate = plan0 && rel && D.valid(rel.end) && plan0.end > rel.end ? 'Iría del ' + fmt.date(plan0.start) + ' al ' + fmt.date(plan0.end) + ', después del fin del release (' + fmt.date(rel.end) + ')' + (A.hasBaseline(rel) ? ': requiere una solicitud de cambio (nivel 2).' : '.') : null;
        PM.openModal((close) => html`<${CloseSprintDialog} close=${close} sprint=${s} unit=${m.unit} done=${done} committed=${committed} pending=${pending} nextName=${nextName} nextExists=${!!next} nextLate=${nextLate}
          onConfirm=${async (choice) => {
            const cur = S().m, st2 = cur.settings, d0 = today();
            /* el botón «Cerrar iteración» desaparece: el foco pasa al botón principal del planificador o a su título */
            S().requestFocus({ test: (mm) => mm.sprints.some((x) => x.id === s.id && x.status === 'cerrado'), targets: ['[data-role="planner"] [data-role="sprint-close"]', '[data-role="planner"] [data-role="sprint-start"]:not([disabled])', '[data-role="planner"] h2'] });
            const now = cur.items.filter((it) => A.countable(it) && it.sprintId === s.id);
            const completed = sumEst(now.filter((it) => A.isDone(st2, it)));
            const rest = now.filter((it) => !A.isDone(st2, it));
            let target = next, created = null;
            if (choice === 'next' && rest.length && !target) { created = newSprint(planSprints(rel, 1)[0], rel, PM.isNum(s.capacity) ? Number(s.capacity) : lastCapacity(s.releaseId)); target = created; }
            commitAgile((d) => {
              const x = d.sprints.find((y) => y.id === s.id); if (!x) return;
              x.status = 'cerrado'; x.completed = completed;
              if (!PM.isNum(x.committed)) x.committed = sumEst(now);
              x.unfinished = rest.map((it) => ({ id: it.id, code: it.code || '', title: it.title || '', estimate: nOr(it.estimate), sprintAddedDate: it.sprintAddedDate || null }));
              if (created) d.sprints.push(created);
            });
            const moved = choice === 'next' && target
              ? rest.map((it) => ({ ...it, sprintId: target.id, sprintAddedDate: null }))
              : rest.map((it) => ({ ...A.withStatus(st2, it, PM.AGILE.BACKLOG, d0), sprintId: null, sprintAddedDate: null }));
            await saveItems(moved);
            PM.toast(spName(s) + ' cerrada: ' + fpts(completed, cur.unit) + ' terminados' + (rest.length ? (choice === 'next' && target ? '; ' + rest.length + ' pasan a ' + spName(target) + '.' : '; ' + rest.length + ' vuelven al backlog.') : '.'));
          }} />`);
      },
      docOpen: async (kind, s) => {
        const k = DOC_KINDS.find((x) => x.kind === kind); if (!k) return;
        const { m, docsIdx, project, canWrite } = S();
        const cur = s.docs && s.docs[kind];
        if (cur && docsIdx.list.some((d) => d.id === cur)) { PM.navigate('documento', { docId: cur }); return; }
        if (!canWrite) return;
        const t = PM.templates[k.tid]; if (!t) return;
        const st = m.settings;
        const rel = s.releaseId ? relOf(s.releaseId) : null;
        const list = m.items.filter((it) => A.countable(it) && it.sprintId === s.id).sort((a, b) => num(a.rank, 0) - num(b.rank, 0));
        const total = sumEst(list), doneList = list.filter((it) => A.isDone(st, it)), done = sumEst(doneList);
        const committed = PM.isNum(s.committed) ? Number(s.committed) : total;
        const finished = s.status === 'cerrado' && PM.isNum(s.completed) ? Number(s.completed) : done;
        const endDate = D.valid(s.end) ? s.end : today();
        let values;
        if (kind === 'planificacion') {
          const blocked = list.filter((it) => it.blocked);
          values = {
            iteracion: spName(s), release: rel ? relName(rel) : '', fechaInicio: s.start, fechaFin: s.end, objetivo: str(s.goal),
            capacidad: nOr(s.capacity), velocidadReferencia: round1(m.velocity.avg3), compromiso: committed,
            elementos: [
              ...list.map((it) => ({ id: PM.uid('r'), codigo: it.code || '', titulo: it.title || '', tipo: TYPE_LABEL[it.type] || it.type || '', estimacion: nOr(it.estimate), responsable: it.assignee || '', criterios: it.acceptance || '' })),
              ...arr(s.unfinished).filter((u) => !list.some((it) => it.id === u.id)).map((u) => { const it = m.items.find((x) => x.id === u.id) || {}; return { id: PM.uid('r'), codigo: u.code || '', titulo: u.title || '', tipo: TYPE_LABEL[it.type] || '', estimacion: nOr(u.estimate), responsable: it.assignee || '', criterios: it.acceptance || '' }; }),
            ],
            riesgos: blocked.length ? 'Elementos bloqueados al planificar: ' + blocked.map((it) => it.code + (it.blockedReason ? ' (' + it.blockedReason + ')' : '')).join('; ') + '.' : '',
            participantes: [...PM.AGILE.ROLES],
          };
        } else if (kind === 'revision') {
          values = {
            /* «¿Se cumplió el objetivo?» no se prellena: el objetivo es el compromiso de la iteración y lo decide el dueño
               del producto en la revisión (los puntos terminados son el pronóstico, no el veredicto). En una iteración
               cerrada, lo terminado es lo que se fijó al cierre. */
            iteracion: spName(s), fecha: endDate, objetivo: str(s.goal),
            comprometido: committed, terminado: finished,
            elementos: [
              ...list.map((it) => ({ id: PM.uid('r'), codigo: it.code || '', titulo: it.title || '', estimacion: nOr(it.estimate), resultado: A.isDone(st, it) ? 'Aceptado' : 'No terminado', observaciones: '' })),
              ...arr(s.unfinished).filter((u) => !list.some((it) => it.id === u.id)).map((u) => ({ id: PM.uid('r'), codigo: u.code || '', titulo: u.title || '', estimacion: nOr(u.estimate), resultado: 'No terminado', observaciones: 'Pasó al backlog o a la iteración siguiente al cerrar.' })),
            ],
            asistentes: [...PM.AGILE.ROLES],
          };
        } else {
          values = { iteracion: spName(s), fecha: endDate, formato: 'Bien, mejorar y acciones' };
        }
        let docId;
        try { docId = await createDoc({ pid: m.pid, project, tid: k.tid, insts: docsIdx.byTemplate[k.tid] || [], title: t.name + ' — ' + spName(s), values }); }
        catch (e) { return; }
        commitAgile((d) => { const x = d.sprints.find((y) => y.id === s.id); if (x) x.docs = { ...(isObj(x.docs) ? x.docs : {}), [kind]: docId }; });
        PM.navigate('documento', { docId });
      },
      lessonsSend: async (s) => {
        if (!guard()) return;
        if (!PM.templates['registro-lecciones']) { PM.toast('La plantilla del registro de lecciones aprendidas no está disponible en esta versión.', { tone: 'crit' }); return; }
        const { docsIdx } = S();
        const retro = docsIdx.list.find((d) => d.id === (s.docs && s.docs.retrospectiva));
        const rows = arr(retro && retro.fields && retro.fields.lecciones).filter((x) => String(x.situacion || '').trim() || String(x.recomendacion || '').trim());
        if (!rows.length) { PM.toast('La retrospectiva aún no tiene lecciones: agrégalas en su tabla «Lecciones» y vuelve a enviarlas.'); return; }
        const reg = S().lessonRows;
        const key = (x) => norm(x.situacion) + '|' + norm(x.recomendacion);
        const seen = new Set(reg.map(key));
        const out = [...reg]; let added = 0;
        const fecha = retro.fields && D.valid(retro.fields.fecha) ? retro.fields.fecha : D.valid(s.end) ? s.end : today();
        for (const x of rows) {
          if (seen.has(key(x))) continue;
          seen.add(key(x));
          out.push({ id: nextCode(out.map((y) => y.id), 'LA'), fecha, area: 'Integración', situacion: String(x.situacion || ''), impacto: x.impacto === 'Positivo' || x.impacto === 'Negativo' ? x.impacto : '', recomendacion: String(x.recomendacion || ''), registradoPor: 'Retrospectiva ' + spName(s) });
          added++;
        }
        if (!added) { PM.toast('Las lecciones de esta retrospectiva ya están en el registro de lecciones aprendidas.'); return; }
        await S().saveLessonRows(out);
        PM.toast(added === 1 ? 'Se envió 1 lección al registro de lecciones aprendidas.' : 'Se enviaron ' + added + ' lecciones al registro de lecciones aprendidas.');
      },
    };
    return api;
  }

  /* ==================================================================== VISTA «iteraciones» */
  function ReleaseCard({ r, info, selected, onSelect, unit }) {
    const st = REL_STATUS[r.status] || REL_STATUS.planeado;
    const planned = Math.max(info.sprints.length, Math.round(num(r.plannedSprints, 0)));
    const closedN = info.sprints.filter((s) => s.status === 'cerrado').length;
    const cc = info.v.hasBaseline && info.v.needsChangeControl;
    /* cerradas frente al total (planeadas o creadas, lo mayor): «3 de 3 iteraciones» se leía como si estuvieran hechas */
    const sprTxt = planned ? closedN + ' de ' + planned + (planned === 1 ? ' iteración cerrada' : ' iteraciones cerradas') : 'sin iteraciones planeadas';
    return html`<button type="button" class="ags-rel" aria-pressed=${selected ? 'true' : 'false'} data-release-id=${r.id} onClick=${() => onSelect(r.id)}>
      <span class="ags-rel-top"><span class="ags-rel-name">${relName(r)}</span><${ui.Chip} tone=${st[1]}>${st[0]}</${ui.Chip}></span>
      <span class="ags-rel-meta">${dateRange(r.start, r.end)}</span>
      <span class="ags-rel-prog"><span class="ags-bar" aria-hidden="true"><span style=${'width:' + Math.round(info.prog.pct * 1000) / 10 + '%'}></span></span><span class="num">${fmt.pct(info.prog.pct)}</span></span>
      <span class="xsmall muted" data-role="release-card-summary">${fpts(info.prog.done, unit)} de ${fpts(info.prog.total, unit)} · ${sprTxt}</span>
      <span class="ags-chips">
        ${A.hasBaseline(r) ? html`<${ui.Chip} tone="info" icon="lock">Con línea base</${ui.Chip}>` : html`<${ui.Chip} tone="outline">Sin línea base</${ui.Chip}>`}
        ${cc ? html`<${ui.Chip} tone="warn" icon="alert">Requiere control de cambios</${ui.Chip}>` : null}
      </span>
    </button>`;
  }

  /* Sin pronóstico: distingue la falta de iteraciones cerradas de una velocidad de 0 (iteraciones cerradas sin nada
     terminado), que no permite pronosticar. */
  const noForecastText = (fc, long) => (fc.velocity === 0
    ? 'La velocidad de las iteraciones cerradas es 0: no se puede pronosticar' + (long ? '. Revisa en la retrospectiva por qué no se terminó trabajo, o termina elementos del release (el ritmo de flujo usa lo terminado en las últimas 6 semanas).' : '.')
    : 'Sin velocidad: aún no hay pronóstico. Cierra una iteración o termina elementos del release' + (long ? ' (el ritmo de flujo usa lo terminado en las últimas 6 semanas).' : '.'));
  function ForecastStat({ r, info, unit, cal }) {
    const fc = info.fc, fl = info.fl;
    if (info.prog.total > 0 && info.prog.remaining <= 0) return html`<${ui.Stat} label="Pronóstico" value="Terminado" sub=${info.prog.lastDone ? 'Último elemento el ' + fmt.date(info.prog.lastDone) : null} tone="good" />`;
    const fin = fc.finish || (fl && fl.finish);
    if (!fin) return html`<${ui.Stat} label="Pronóstico" value="—" sub=${info.prog.total ? noForecastText(fc, false) : 'Agrega y estima elementos del release.'} />`;
    const late = D.valid(r.end) ? wdDiff(cal, r.end, fin) : 0;
    const how = fc.finish ? fc.sprintsNeeded + (fc.sprintsNeeded === 1 ? ' iteración' : ' iteraciones') + ' a ' + fpts(fc.velocity, unit) + ' (' + velName(info.vb) + ')' : 'Por flujo: ' + fpts(fl.perWeek, unit) + ' por semana';
    const vs = !D.valid(r.end) ? '' : late > 0 ? '; ' + wdText(late) + ' después del fin' : late < 0 ? '; ' + wdText(late) + ' antes del fin' : '; en la fecha de fin';
    return html`<${ui.Stat} label="Pronóstico de terminación" value=${fmt.date(fin)} sub=${how + vs} tone=${late > 0 ? (late > 5 ? 'crit' : 'warn') : D.valid(r.end) ? 'good' : null} />`;
  }

  function ChangeControl({ r, info, unit, currency, settings, cal, canWrite, act, changeRows, docsIdx }) {
    const v = info.v;
    const thr = settings.scopeChangeThreshold;
    const tplOk = !!(PM.templates['solicitud-cambio'] && PM.templates['registro-cambios']);
    if (!v.hasBaseline) {
      return html`<${Callout} tone="info" icon="lock" role="baseline-none" title="Sin línea base"
        actions=${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="lock" disabled=${!info.prog.total || !D.valid(r.end)} onClick=${() => act.releaseBaseline(r)}>Fijar línea base del release</${ui.Button}>` : null}>
        <span>Fija la línea base cuando el equipo y el dueño del producto acuerden alcance, fecha, presupuesto e iteraciones. Después, los ajustes del backlog dentro de ±${fmt.num(thr, 1)} % del alcance se gestionan en el release; si lo superan, o si cambian la fecha, el presupuesto o el número de iteraciones, pasan por el control integrado de cambios (4.6).</span>
        ${canWrite && (!info.prog.total || !D.valid(r.end)) ? html`<span class="xsmall muted">${!D.valid(r.end) ? 'Define la fecha de fin del release' : 'Asigna y estima elementos del release'} para poder fijar la línea base.</span>` : null}
      </${Callout}>`;
    }
    const b = r.baseline;
    const det = varianceDetail(r, v, settings, unit, currency, cal, info.sprints);
    const pc = isObj(r.pendingChange) && r.pendingChange.code ? r.pendingChange : null;
    const base = html`<div class="xsmall muted" data-role="baseline-summary">Línea base del ${fmt.date(b.date)}: ${fpts(num(b.points, 0), unit)} · fin ${fmt.date(b.end)} · ${fmt.money(b.budget, currency)} · ${fmt.num(b.sprints || 0)} ${num(b.sprints, 0) === 1 ? 'iteración' : 'iteraciones'}${b.changeRef ? ' · actualizada con ' + b.changeRef : ''}</div>`;
    const list = html`<ul>${det.lines.map((l) => html`<li key=${l.id} data-flag=${l.flag ? 'true' : 'false'}>${l.flag ? html`<strong>${l.text}</strong>` : l.text}</li>`)}</ul>`;
    const openDoc = pc && pc.docId && docsIdx.list.some((d) => d.id === pc.docId) ? html`<${ui.Button} size="sm" icon="file" onClick=${() => PM.navigate('documento', { docId: pc.docId })}>Abrir solicitud ${pc.code}</${ui.Button}>` : null;
    const openLog = PM.templates['registro-cambios'] ? html`<${ui.Button} size="sm" variant="ghost" icon="checklist" onClick=${() => PM.navigate('documento', { docId: 'registro-cambios' })}>Ver registro de cambios</${ui.Button}>` : null;
    const registerBtn = (label) => (canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="send" data-role="change-register" disabled=${!tplOk} onClick=${() => act.releaseChangeRequest(r)}>${label}</${ui.Button}>` : null);
    const noTpl = !tplOk ? html`<span class="xsmall muted">Las plantillas de solicitud y registro de cambios no están disponibles en esta versión del gestor.</span>` : null;
    let pending = null;
    if (pc) {
      const row = changeRows.find((x) => sameCode(x.id, pc.code));
      const doc = docsIdx.list.find((d) => d.id === pc.docId);
      const estado = (row && row.estado) || (doc && doc.fields && doc.fields.decision) || 'Registrada';
      const when = row && D.valid(row.fechaDecision) ? ' el ' + fmt.date(row.fechaDecision) : '';
      const who = row && row.decisor ? ' por ' + row.decisor : '';
      if (estado === 'Aprobada') {
        pending = html`<${Callout} tone="good" role="change-approved" title=${'Solicitud ' + pc.code + ' aprobada'}
          actions=${html`${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="lock" onClick=${() => act.releaseUpdateBaseline(r, pc.code)}>Actualizar línea base del release</${ui.Button}>` : null}${openDoc}<${ui.Button} size="sm" variant="ghost" icon="layers" onClick=${() => PM.navigate('lineas-base')}>Líneas base del proyecto</${ui.Button}>`}>
          <span>El comité de control de cambios aprobó la solicitud${when}${who}. Actualiza la línea base del release para que refleje el alcance, la fecha y el presupuesto aprobados; si el cambio afecta la línea base del proyecto, establece también una nueva en «Líneas base».</span>
        </${Callout}>`;
      } else if (estado === 'Rechazada') {
        pending = html`<${Callout} tone="crit" role="change-rejected" title=${'Solicitud ' + pc.code + ' rechazada'}
          actions=${html`${v.needsChangeControl ? registerBtn('Registrar nueva solicitud de cambio') : null}${openDoc}${canWrite ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => act.releaseDiscardChange(r)}>Descartar aviso</${ui.Button}>` : null}`}>
          <span>El comité rechazó la solicitud${when}${who}: la línea base del release no cambia. ${v.needsChangeControl ? 'Ajusta el backlog, la fecha o el presupuesto para volver a los valores de la línea base, o registra una nueva solicitud con otra propuesta.' : 'El release ya está dentro de su línea base.'}</span>
        </${Callout}>`;
      } else {
        pending = html`<${Callout} tone="info" icon="clock" role="change-pending" title=${'Solicitud ' + pc.code + ' en trámite (' + estado + ')'} actions=${html`${openDoc}${openLog}`}>
          <span>Cuando el comité de control de cambios la marque como «Aprobada» en el registro de cambios, podrás actualizar aquí la línea base del release. Mientras tanto, el release se controla contra la línea base vigente.</span>
        </${Callout}>`;
      }
    }
    const status = v.needsChangeControl
      ? html`<${Callout} tone="warn" role="change-needed" title="El release requiere control de cambios (nivel 2)"
          actions=${!pc ? html`${registerBtn('Registrar solicitud de cambio')}${openLog}` : null}>
          <span>Frente a la línea base cambió algo más allá de lo que el equipo puede ajustar dentro del release:</span>${list}${!pc ? noTpl : null}
        </${Callout}>`
      : html`<${Callout} tone="good" role="change-level1" title="Cambios dentro del release (nivel 1)">
          <span>Los ajustes del backlog se mantienen dentro del umbral y no cambian la fecha, el presupuesto ni el número de iteraciones: no requieren solicitud de cambio.</span>${list}
        </${Callout}>`;
    return html`<div class="stack-sm" data-role="change-control">${base}${status}${pending}</div>`;
  }

  function ReleaseDetail({ r, info, m, canWrite, act, changeRows, docsIdx }) {
    const { unit, currency, settings } = m;
    const cal = m.sched.cal;
    const st = REL_STATUS[r.status] || REL_STATUS.planeado;
    const planned = Math.max(info.sprints.length, Math.round(num(r.plannedSprints, 0)));
    const node = r.wbsId ? m.tree.byId.get(r.wbsId) : null;
    const taskId = taskIdOfRelease(m, r.id);
    const task = taskId ? m.sched.byId.get(taskId) : null;
    const approach = node ? m.approach.get(node.id) : null;
    const relVel = C.velocity({ sprints: info.sprints, items: m.items, settings });
    return html`<section class="card" data-role="release-detail" data-release-id=${r.id}>
      <div class="card-head">
        <div class="stack-sm" style="gap:4px;min-width:0">
          <h2 class="h3" tabindex="-1">${relName(r)}</h2>
          <div class="ags-chips"><${ui.Chip} tone=${st[1]}>${st[0]}</${ui.Chip}><span class="xsmall faint mono">${dateRange(r.start, r.end)}</span>${A.hasBaseline(r) ? html`<${ui.Chip} tone="info" icon="lock">Con línea base</${ui.Chip}>` : null}</div>
        </div>
        <div class="row">
          ${canWrite ? html`<${ui.Button} size="sm" icon="edit" onClick=${() => act.releaseEdit(r)}>Editar release</${ui.Button}>` : null}
          ${canWrite && !A.hasBaseline(r) ? html`<${ui.Button} size="sm" icon="lock" disabled=${!info.prog.total || !D.valid(r.end)} onClick=${() => act.releaseBaseline(r)}>Fijar línea base del release</${ui.Button}>` : null}
          <${ui.Dropdown} label=${'Más acciones de ' + relName(r)} items=${[
            canWrite ? { label: 'Generar iteraciones', icon: 'sprint', onClick: () => act.sprintGenerate(r) } : null,
            { label: 'Ver métricas del release', icon: 'burndown', onClick: () => PM.navigate('metricas-agiles', { release: r.id }) },
            { label: 'Abrir el backlog', icon: 'backlog', onClick: () => PM.navigate('backlog', { release: r.id }) },
            canWrite ? 'sep' : null,
            canWrite ? { label: 'Eliminar release', icon: 'trash', danger: true, onClick: () => act.releaseDelete(r) } : null,
          ]} />
        </div>
      </div>
      <div class="card-body stack">
        ${r.goal ? html`<p class="ags-goal">${r.goal}</p>` : null}
        <div class="ags-tiles" data-role="release-stats">
          <${ui.Stat} label="Avance" value=${fmt.pct(info.prog.pct)} sub=${fpts(info.prog.done, unit) + ' de ' + fpts(info.prog.total, unit) + ' (' + info.prog.count + ' elementos)'} />
          <${ForecastStat} r=${r} info=${info} unit=${unit} cal=${cal} />
          <${ui.Stat} label="Fin planeado" value=${fmt.date(r.end)} sub=${A.hasBaseline(r) ? 'Línea base: ' + fmt.date(r.baseline.end) : 'Sin línea base'} />
          <${ui.Stat} label="Presupuesto (BAC)" value=${fmt.moneyShort(num(r.budget, 0), currency)} sub=${A.hasBaseline(r) ? 'Línea base: ' + fmt.moneyShort(num(r.baseline.budget, 0), currency) : 'Base del AgileEVM'} />
          <${ui.Stat} label="Iteraciones cerradas" value=${info.sprints.filter((s) => s.status === 'cerrado').length + ' de ' + planned} sub=${info.sprints.length + (info.sprints.length === 1 ? ' creada' : ' creadas') + ' · ' + Math.round(num(r.plannedSprints, 0)) + ' planeadas' + (A.hasBaseline(r) && num(r.baseline.sprints, 0) > 0 ? ' · línea base: ' + Math.round(num(r.baseline.sprints, 0)) : '') + ' · ' + settings.sprintLength + ' días hábiles c/u'} />
          <${ui.Stat} label="Velocidad media del release" value=${relVel.avg3 !== null ? fpts(relVel.avg3, unit) : '—'} sub=${relVel.closed ? 'Promedio de ' + lastClosed(Math.min(3, relVel.closed)) + ' del release' : 'Sin iteraciones cerradas en el release'} />
        </div>
        <dl class="ags-kv">
          <dt>Entregable de la EDT</dt><dd>${node ? html`<span class="code-tag">${m.tree.codes.get(node.id) || ''}</span> ${node.name || 'Sin nombre'} ${approach ? html`<${ui.Chip} tone=${approach === 'adaptativo' ? 'accent' : 'outline'}>${approach === 'adaptativo' ? 'Adaptativo' : 'Predictivo'}</${ui.Chip}>` : null}` : html`<span class="faint">Sin entregable vinculado</span>`}</dd>
          <dt>Actividad del cronograma</dt><dd>${task ? html`${task.name || 'Actividad sin nombre'} <span class="xsmall muted">· ${fmt.date(task.startDate)} – ${fmt.date(task.finishDate)} · avance ${fmt.pct100(task.progress, 1)} (calculado desde el backlog)</span>` : html`<span class="faint">Sin actividad vinculada: el avance del release no entra al cronograma ni a la curva S.</span>`}</dd>
        </dl>
        <${ChangeControl} r=${r} info=${info} unit=${unit} currency=${currency} settings=${settings} cal=${cal} canWrite=${canWrite} act=${act} changeRows=${changeRows} docsIdx=${docsIdx} />
      </div>
    </section>`;
  }

  function SprintsCard({ release, list, velRows, selId, onSelect, canWrite, act, m, kanban }) {
    const unit = m.unit;
    const plannedN = release ? Math.round(num(release.plannedSprints, 0)) : 0;
    const countTxt = release ? countLabel(list.length, 'iteración creada', 'iteraciones creadas') + (plannedN ? ' de ' + plannedN + ' planeadas' : ' · sin iteraciones planeadas en el release') : countLabel(list.length, 'iteración', 'iteraciones');
    const relEnd = release && D.valid(release.end) ? release.end : null;
    return html`<section class="card" data-role="sprints">
      <div class="card-head">
        <div class="stack-sm" style="gap:2px;min-width:0"><h2 class="h3" tabindex="-1">${release ? 'Iteraciones del release' : 'Iteraciones sin release'}</h2>
          <div class="xsmall faint">${countTxt} · ${m.settings.sprintLength} días hábiles cada una · calendario del proyecto</div></div>
        ${canWrite ? html`<div class="row">
          <${ui.Button} size="sm" icon="plus" data-role="sprint-add" onClick=${() => act.sprintAdd(release)}>Agregar iteración</${ui.Button}>
          ${release ? html`<${ui.Button} size="sm" icon="sprint" data-role="sprint-generate" onClick=${() => act.sprintGenerate(release)}>Generar iteraciones</${ui.Button}>` : null}
        </div>` : null}
      </div>
      <div class="card-body stack">
        ${kanban ? html`<${Callout} tone="info" icon="kanban" role="kanban-note" title="Marco Kanban: las iteraciones son opcionales">
          <span>El trabajo fluye de forma continua por el tablero. Puedes planificar y controlar solo con releases (avance, pronóstico por flujo, línea base y control de cambios) y crear iteraciones únicamente si quieres cadencias fijas de revisión y retrospectiva.</span>
        </${Callout}>` : null}
        ${list.length ? html`<${ScrollWrap}><table class="table ags-tbl" data-role="sprint-table">
          <caption class="sr-only">${release ? 'Iteraciones de ' + relName(release) : 'Iteraciones sin release'}</caption>
          <thead><tr><th>Iteración</th><th>Fechas</th><th>Estado</th><th class="num">Capacidad</th><th class="num">Comprometido</th><th class="num">Terminado</th><th class="ags-actions"><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>${list.map((s) => {
            const st = SPR_STATUS[s.status] || SPR_STATUS.planeado;
            const vr = velRows.get(s.id) || { committed: 0, completed: 0 };
            const sel = s.id === selId;
            /* señales con ícono y texto: la iteración termina después del fin del release o se cruza con otra */
            const late = relEnd && D.valid(s.end) && s.end > relEnd;
            const cross = overlapsOf(s, m.sprints);
            return html`<tr key=${s.id} class=${sel ? 'is-sel' : ''} data-sprint-id=${s.id}>
              <td><button type="button" class="ags-link" aria-pressed=${sel ? 'true' : 'false'} onClick=${() => onSelect(s.id)}>${spName(s)}</button>${s.goal ? html`<div class="xsmall faint" style="max-width:46ch">${str(s.goal)}</div>` : null}
                ${late ? html`<div class="ags-flag" data-role="sprint-late"><${ui.Icon} name="alert" size=${13} />Después del fin del release (${fmt.date(relEnd)})</div>` : null}
                ${cross.length ? html`<div class="ags-flag" data-role="sprint-overlap"><${ui.Icon} name="alert" size=${13} />Se cruza con ${cross.map((o) => spName(o)).join(', ')}</div>` : null}</td>
              <td class="mono small"><span class="nowrap">${fmt.date(s.start, 'dm')} –</span> <span class="nowrap">${fmt.date(s.end)}</span></td>
              <td><${ui.Chip} tone=${st[1]}>${st[0]}</${ui.Chip}></td>
              <td class="num">${PM.isNum(s.capacity) ? fpts(Number(s.capacity), unit) : '—'}</td>
              <td class="num">${fpts(vr.committed, unit)}${s.status === 'planeado' ? html`<div class="xsmall faint">planificado</div>` : null}</td>
              <td class="num">${s.status === 'planeado' ? '—' : fpts(vr.completed, unit)}</td>
              <td class="ags-actions">${canWrite ? html`<div class="row" style="gap:0;flex-wrap:nowrap;justify-content:flex-end">
                <${ui.IconButton} size="sm" icon="edit" label=${'Editar ' + spName(s)} onClick=${() => act.sprintEdit(s)} />
                <${ui.IconButton} size="sm" icon="trash" label=${'Eliminar ' + spName(s)} onClick=${() => act.sprintDelete(s)} />
              </div>` : null}</td>
            </tr>`;
          })}</tbody>
        </table></${ScrollWrap}>` : html`<${ui.Empty} icon="sprint" title="Sin iteraciones" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => act.sprintAdd(release)}>Agregar iteración</${ui.Button}>${release ? html`<${ui.Button} icon="sprint" onClick=${() => act.sprintGenerate(release)}>Generar iteraciones</${ui.Button}>` : null}` : null}>
          ${kanban ? 'Opcional en Kanban. ' : ''}Cada iteración dura ${m.settings.sprintLength} días hábiles y empieza el día hábil siguiente a la última iteración del proyecto.
        </${ui.Empty}>`}
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------- capacidad sugerida (SPEC §10.4)
     PM.res.teamCapacity con las personas del catálogo de recursos marcadas como «Equipo ágil»: días-persona disponibles
     en la iteración (dedicación, festivos, ausencias y rango de disponibilidad) frente a una iteración habitual completa
     (settings.sprintLength); la sugerida es la velocidad media × esa proporción (puntos) o la suma de horas (horas).
     Se explica qué redujo la disponibilidad solo si la proporción es menor que 1 (iteración más corta por festivos,
     ausencias, días fuera de rango). La dedicación parcial y los festivos que no acortan la iteración ya están en la
     referencia (iteración habitual o iteraciones de la velocidad): se listan aparte como «Ya considerado». */
  const teamMembersOf = (cat) => (cat && Array.isArray(cat.items) ? cat.items.filter((it) => !it.virtual && it.agileTeam && cat.kindOf(it) === 'trabajo' && it.status !== 'liberado') : []);
  function capacityDetail(m, s, cal) {
    const R = PM.res;
    const members = teamMembersOf(m.catalog);
    if (!R || !members.length) return { members, tc: null };
    if (!D.valid(s.start) || !D.valid(s.end) || s.end < s.start || !cal) return { members, tc: null, noDates: true };
    const tc = R.teamCapacity({ data: m.resources, schedule: m.schedule, sprint: s, cal, settings: m.settings, velocity: m.velocity });
    const ww = cal.settings && [5, 6, 7].includes(Number(cal.settings.workweek)) ? Number(cal.settings.workweek) : 5;
    const weekday = (d) => { const w = D.dow(d); return ww === 7 ? true : ww === 6 ? w !== 0 : w !== 0 && w !== 6; };
    const days = [], holidays = [];
    for (let d = s.start, g = 0; d <= s.end && g < 400; d = D.add(d, 1), g++) {
      if (cal.isWork(d)) days.push(d);
      else if (weekday(d)) holidays.push({ date: d, name: (cal.holidayName && cal.holidayName(d)) || 'No laborable' });
    }
    const byId = new Map(members.map((x) => [x.id, x]));
    const absent = [], outside = [], partial = [];
    const rows = tc.members.map((row) => {
      const it = byId.get(row.id);
      let nAbs = 0, nOut = 0;
      if (it) for (const d of days) {
        if (R.availableOn(it, d) !== 0) continue;
        if (arr(it.absences).some((a) => D.valid(a.from) && d >= a.from && d <= (D.valid(a.to) ? a.to : a.from))) nAbs++; else nOut++;
      }
      if (nAbs) absent.push({ name: row.name, days: nAbs });
      if (nOut) outside.push({ name: row.name, days: nOut });
      if (row.dedication < 100) partial.push({ name: row.name, pct: row.dedication });
      return { ...row, absent: nAbs, outside: nOut };
    });
    const length = Math.max(1, Math.round(num(m.settings && m.settings.sprintLength, days.length || 10)));
    return { members, tc, rows, days: days.length, length, holidays, absent, outside, partial };
  }
  const nameList = (list, fmtOne) => list.slice(0, 4).map(fmtOne).join(', ') + (list.length > 4 ? ' y ' + (list.length - 4) + ' más' : '');
  function CapacitySuggestion({ s, m, cal, cap, canWrite, act }) {
    const [open, setOpen] = useState(false);
    const info = useMemo(() => capacityDetail(m, s, cal), [m.catalog, m.resources, m.schedule, m.settings, m.velocity, s.start, s.end, cal]);
    if (!PM.res) return null;
    const unit = m.unit;
    const tblId = 'ags-capsug-tbl-' + s.id;
    const toCatalog = () => PM.navigate('recursos', { tab: 'catalogo' });
    const catalogBtn = html`<${ui.Button} size="sm" variant="ghost" icon="resources" data-role="capacity-catalog" onClick=${toCatalog}>Ir al catálogo de recursos</${ui.Button}>`;
    if (!info.members.length) {
      return html`<div class="ags-capsug" data-role="capacity-suggestion" data-state="no-members">
        <div class="ags-capsug-head"><${ui.Icon} name="info" size=${16} />
          <div class="ags-capsug-main"><strong>Capacidad sugerida</strong>
            <span class="small">Sin miembros del equipo ágil en el catálogo de recursos. Marca a las personas del equipo como «Equipo ágil», con su dedicación y sus ausencias, y la planificación sugerirá la capacidad de cada iteración con su disponibilidad real.</span></div>
          <div class="ags-capsug-acts">${catalogBtn}</div>
        </div>
      </div>`;
    }
    const nMem = countLabel(info.members.length, 'miembro del equipo', 'miembros del equipo');
    if (info.noDates) {
      return html`<div class="ags-capsug" data-role="capacity-suggestion" data-state="no-dates">
        <div class="ags-capsug-head"><${ui.Icon} name="calendar" size=${16} />
          <div class="ags-capsug-main"><strong>Capacidad sugerida</strong><span class="small">Define las fechas de inicio y fin de la iteración para calcular la disponibilidad de los ${nMem}.</span></div>
          <div class="ags-capsug-acts">${catalogBtn}</div>
        </div>
      </div>`;
    }
    const tc = info.tc;
    const sug = PM.isNum(tc.suggested) ? Number(tc.suggested) : null;
    /* referencia de la proporción (PM.res.teamCapacity): días-persona promedio de las iteraciones cerradas de la velocidad
       media o, sin ellas, una iteración habitual del equipo */
    const ref = tc.reference || { kind: 'habitual', personDays: tc.normal, sprints: [] };
    const byVel = ref.kind === 'velocidad';
    const refText = byVel ? 'días-persona en promedio de ' + lastClosed(ref.sprints.length) : 'días-persona de una iteración habitual';
    const ratio = tc.ratio;
    const same = sug !== null && cap !== null && Math.abs(cap - sug) < 0.05;
    const hours = tc.unit === 'horas';
    const vel = m.velocity;
    const basis = hours
      ? 'Suma de los días-persona disponibles por las horas por día de cada miembro.'
      : sug !== null ? 'Velocidad media de ' + fpts(vel.avg3, unit) + ' (' + lastClosed(Math.min(3, vel.closed)) + ' del proyecto) × ' + fmt.pct(ratio || 0, 1) + (byVel ? ' de los días-persona con que se logró.' : ' de disponibilidad.')
        : 'Sin velocidad: cierra al menos una iteración para llevar los días-persona a ' + (unit === 'h' ? 'horas' : 'puntos') + '.';
    /* motivos: solo reducen la disponibilidad si la proporción es menor que 1 (como se muestra, con un decimal) */
    const reduced = ratio === null || ratio < 0.9995;
    const shorter = info.days < info.length;
    const holText = () => (info.holidays.length === 1 ? 'Festivo: ' : 'Festivos: ') + nameList(info.holidays, (h) => fmt.date(h.date, 'dow') + ' (' + h.name + ')');
    const why = [], known = [];
    if (reduced) {
      if (shorter) why.push({ k: 'len', icon: 'calendar', text: 'La iteración tiene ' + wdText(info.days) + '; una habitual, ' + wdText(info.length) + '.' });
      if (shorter && info.holidays.length) why.push({ k: 'hol', icon: 'flag', text: holText() + '.' });
      if (info.absent.length) why.push({ k: 'abs', icon: 'user', text: 'Ausencias: ' + nameList(info.absent, (a) => a.name + ' (' + wdText(a.days) + ')') + '.' });
      if (info.outside.length) why.push({ k: 'out', icon: 'clock', text: 'Fuera de su disponibilidad: ' + nameList(info.outside, (a) => a.name + ' (' + wdText(a.days) + ')') + '.' });
      /* con la velocidad, la referencia puede tener más días-persona por el equipo de entonces */
      if (!why.length && byVel) why.push({ k: 'ref', icon: 'info', text: 'Las iteraciones de referencia tuvieron ' + fmt.num(ref.personDays, 1) + ' días-persona en promedio, con el equipo de entonces.' });
    }
    if (info.days > info.length) known.push({ k: 'len', icon: 'calendar', text: 'La iteración tiene ' + wdText(info.days) + '; una habitual, ' + wdText(info.length) + ' (más disponibilidad).' });
    if (!shorter && info.holidays.length) known.push({ k: 'hol', icon: 'flag', text: holText() + '; la iteración conserva sus ' + wdText(info.days) + '.' });
    if (info.partial.length) known.push({ k: 'ded', icon: 'user', text: 'Dedicación parcial: ' + nameList(info.partial, (a) => a.name + ' (' + fmt.num(a.pct, 0) + ' %)') + '.' });
    const whyId = 'ags-capsug-why-' + s.id, knownId = 'ags-capsug-known-' + s.id;
    const use = () => {
      if (same || sug === null) return;
      act.sprintPatch(s, { capacity: sug });
      PM.toast('Capacidad de ' + spName(s) + ': ' + fpts(sug, unit) + ', sugerida por la disponibilidad del equipo.');
    };
    const meterLabel = 'Disponibilidad del equipo: ' + fmt.num(tc.personDays, 1) + ' de ' + fmt.num(ref.personDays, 1) + ' ' + refText + ' (' + fmt.pct(ratio || 0, 1) + ')';
    return html`<div class="ags-capsug" data-role="capacity-suggestion" data-state="ok">
      <div class="ags-capsug-head"><${ui.Icon} name="user" size=${16} />
        <div class="ags-capsug-main">
          <div><strong>Capacidad sugerida: </strong><span class="ags-capsug-val" data-role="capacity-suggested">${sug !== null ? fpts(sug, unit) : '—'}</span>${same ? html` <${ui.Chip} tone="good" icon="check">Igual a la capacidad registrada</${ui.Chip}>` : null}</div>
          <span class="small" data-role="capacity-availability">${nMem} · ${fmt.num(tc.personDays, 1)} de ${fmt.num(ref.personDays, 1)} ${refText} (${fmt.pct(ratio || 0, 1)})${hours ? ' · ' + fmt.num(tc.hours, 1) + ' h' : ''}</span>
          <div class="ags-capsug-meter" role="img" aria-label=${meterLabel}><span style=${'width:' + Math.min(1, Math.max(0, ratio || 0)) * 100 + '%'}></span></div>
          <span class="xsmall muted" data-role="capacity-basis">${basis}${cap !== null && sug !== null && !same ? ' Capacidad registrada: ' + fpts(cap, unit) + ' (' + signedPts(cap - sug, unit) + ' frente a la sugerida).' : ''}</span>
        </div>
        <div class="ags-capsug-acts">
          ${canWrite && sug !== null ? html`<${ui.Button} size="sm" variant=${same ? undefined : 'primary'} icon="check" data-role="capacity-use" aria-disabled=${same ? 'true' : undefined} title=${same ? 'La capacidad registrada ya es la sugerida' : 'Fija la capacidad de la iteración en ' + fpts(sug, unit)} onClick=${use}>Usar la sugerida</${ui.Button}>` : null}
          <${ui.Button} size="sm" variant="ghost" icon=${open ? 'chevron-up' : 'chevron-down'} aria-expanded=${open ? 'true' : 'false'} aria-controls=${tblId} data-role="capacity-detail-toggle" onClick=${() => setOpen((v) => !v)}>${open ? 'Ocultar el detalle' : 'Ver el detalle'}</${ui.Button}>
        </div>
      </div>
      ${why.length ? html`<div class="ags-capsug-group" data-role="capacity-why-group"><span class="ags-capsug-why-h" id=${whyId}>Reducen la disponibilidad</span>
        <ul class="ags-capsug-why" data-role="capacity-why" aria-labelledby=${whyId}>${why.map((w) => html`<li key=${w.k} data-why=${w.k}><${ui.Icon} name=${w.icon} size=${13} /><span>${w.text}</span></li>`)}</ul></div>` : null}
      ${known.length ? html`<div class="ags-capsug-group is-known" data-role="capacity-known-group"><span class="ags-capsug-why-h" id=${knownId}>${byVel ? 'Ya considerado en las iteraciones de referencia' : 'Ya considerado en la iteración habitual'}</span>
        <ul class="ags-capsug-why" data-role="capacity-known" aria-labelledby=${knownId}>${known.map((w) => html`<li key=${w.k} data-known=${w.k}><${ui.Icon} name=${w.icon} size=${13} /><span>${w.text}</span></li>`)}</ul></div>` : null}
      ${open ? html`<div id=${tblId} class="stack-sm" style="gap:6px">
        <div class="table-wrap"><table class="table table-tight" data-role="capacity-members"><caption class="sr-only">Disponibilidad de los miembros del equipo en ${spName(s)}</caption>
          <thead><tr><th>Miembro</th><th class="num">Dedicación</th><th class="num">Días-persona disponibles</th><th class="num">Iteración habitual</th>${hours ? html`<th class="num">Horas</th>` : null}<th class="num">Ausencias</th></tr></thead>
          <tbody>${info.rows.map((r) => html`<tr key=${r.id} data-member=${r.id}><td>${r.name}</td><td class="num">${fmt.num(r.dedication, 0)} %</td><td class="num">${fmt.num(r.personDays, 1)}</td><td class="num">${fmt.num(r.normal, 1)}</td>${hours ? html`<td class="num">${fmt.num(r.hours, 1)}</td>` : null}<td class="num">${r.absent ? wdText(r.absent) : '—'}</td></tr>`)}</tbody>
          <tfoot><tr><td>Total</td><td></td><td class="num">${fmt.num(tc.personDays, 1)}</td><td class="num">${fmt.num(tc.normal, 1)}</td>${hours ? html`<td class="num">${fmt.num(tc.hours, 1)}</td>` : null}<td></td></tr></tfoot>
        </table></div>
        <div class="row" style="gap:6px 12px"><span class="xsmall muted">Dedicación, horas por día, ausencias y fechas de disponibilidad se editan en el catálogo de recursos.</span>${catalogBtn}</div>
      </div>` : null}
    </div>`;
  }

  /* Fila de elemento (planificación): se vuelve a dibujar solo si cambian sus datos. */
  const itemSig = (it) => [it.id, it.code, it.title, it.estimate, it.status, it.priority, it.blocked ? 1 : 0, it.type, it.sprintId].join('\u0001');
  const ItemRow = PM.memo(function ItemRow({ it, mode, statusText, statusTone, unit, canAct, onAct, sprintName, note }) {
    const est = PM.isNum(it.estimate) ? fpts(Number(it.estimate), unit) : null;
    const label = (mode === 'add' ? 'Agregar ' : 'Quitar ') + (it.code || '') + ' «' + (it.title || 'Sin título') + '» ' + (mode === 'add' ? 'a ' : 'de ') + sprintName;
    return html`<tr data-item-id=${it.id} data-code=${it.code}>
      <td class="mono nowrap small">${it.code}</td>
      <td class="ags-title-cell">${it.title || html`<span class="faint">Sin título</span>`}${it.blocked ? html` <${ui.Chip} tone="crit" icon="lock">Bloqueado</${ui.Chip}>` : null}<div class="xsmall faint">${TYPE_LABEL[it.type] || ''}${it.priority ? ' · ' + it.priority : ''}</div></td>
      ${mode === 'remove' ? html`<td><${ui.Chip} tone=${statusTone}>${statusText}</${ui.Chip}></td>` : null}
      <td class="num nowrap">${est || html`<span class="ags-flag"><${ui.Icon} name="alert" size=${13} />Sin estimar</span>`}</td>
      <td class="ags-actions">${canAct ? html`<${ui.Button} size="sm" variant="ghost" icon=${mode === 'add' ? 'plus' : 'minus'} aria-label=${label} title=${label} onClick=${() => onAct(it.id)}><span class="ags-btn-text">${mode === 'add' ? 'Agregar' : 'Quitar'}</span></${ui.Button}>` : note ? html`<span class="xsmall faint">${note}</span>` : null}</td>
    </tr>`;
  }, (a, b) => a.sig === b.sig && a.mode === b.mode && a.canAct === b.canAct && a.onAct === b.onAct && a.unit === b.unit && a.statusText === b.statusText && a.sprintName === b.sprintName && a.note === b.note);

  const CAND_LIMIT = 60;
  function SprintPlanner({ s, release, m, idx, canWrite, act, docsIdx, lessonRows }) {
    const { settings, unit } = m;
    const list = idx.bySprint.get(s.id) || [];
    const st = SPR_STATUS[s.status] || SPR_STATUS.planeado;
    const closed = s.status === 'cerrado', planned = s.status === 'planeado';
    const total = sumEst(list);
    const cap = nOr(s.capacity);
    /* Alcance de la iteración: los elementos actuales y, en una cerrada, los no terminados que salieron al cerrar.
       Lo agregado después del inicio (sprintAddedDate) no es parte del compromiso fijado al iniciar. */
    const unf = closed ? arr(s.unfinished).filter((u) => u.id && !list.some((it) => it.id === u.id)) : [];
    const est = (x) => Math.max(0, num(x && x.estimate, 0));
    const scope = total + unf.reduce((a, u) => a + est(u), 0), scopeCount = list.length + unf.length;
    const addedList = [...list.filter((it) => D.valid(it.sprintAddedDate)), ...unf.filter((u) => D.valid(u.sprintAddedDate))];
    const added = planned ? 0 : addedList.reduce((a, u) => a + est(u), 0);
    const committed = planned ? total : PM.isNum(s.committed) ? Number(s.committed) : scope - added;
    const done = closed && PM.isNum(s.completed) ? Number(s.completed) : sumEst(list.filter((it) => A.isDone(settings, it)));
    const [q, setQ] = useState('');
    const [all, setAll] = useState(false);
    const sprintIds = useMemo(() => new Set(m.sprints.map((x) => x.id)), [m.sprints]);
    const candidates = useMemo(() => {
      const out = m.items.filter((it) => A.countable(it) && (!it.sprintId || !sprintIds.has(it.sprintId)) && !A.isDone(settings, it) && (s.releaseId ? it.releaseId === s.releaseId : true));
      out.sort((a, b) => num(a.rank, 0) - num(b.rank, 0) || String(a.code || '').localeCompare(String(b.code || '')));
      return out;
    }, [m.items, sprintIds, settings, s.releaseId]);
    const shownCand = useMemo(() => { const t = norm(q); const f = t ? candidates.filter((it) => norm((it.code || '') + ' ' + (it.title || '')).includes(t)) : candidates; return f; }, [candidates, q]);
    const byId = useMemo(() => new Map(m.items.map((it) => [it.id, it])), [m.items]);
    const ref = useRef(); ref.current = { s, byId };
    /* al agregar o quitar con el teclado, el foco pasa al botón de la fila que ocupa el lugar del elemento movido */
    const refocus = useRef(null);
    const candRef = useRef(), itemsRef = useRef();
    const rowIndex = (box, id) => (box ? [...box.querySelectorAll('tbody tr[data-item-id]')].findIndex((tr) => tr.dataset.itemId === id) : -1);
    const onAdd = useCallback((id) => { const it = ref.current.byId.get(id); if (!it) return; const box = candRef.current; if (box && box.contains(document.activeElement)) refocus.current = { box: 'cand', id, index: rowIndex(box, id) }; act.itemAdd(it, ref.current.s); }, [act]);
    const onRemove = useCallback((id) => { const it = ref.current.byId.get(id); if (!it) return; const box = itemsRef.current; if (box && box.contains(document.activeElement)) refocus.current = { box: 'items', id, index: rowIndex(box, id) }; act.itemRemove(it, ref.current.s); }, [act]);
    useEffect(() => {
      const rf = refocus.current; if (!rf) return;
      const box = rf.box === 'cand' ? candRef.current : itemsRef.current;
      if (!box) { refocus.current = null; return; }
      const rows = [...box.querySelectorAll('tbody tr[data-item-id]')];
      if (rows.some((tr) => tr.dataset.itemId === rf.id)) return;
      refocus.current = null;
      const target = rows.length ? rows[Math.min(Math.max(0, rf.index), rows.length - 1)].querySelector('button') : box.querySelector('h3');
      if (target) { if (target.tagName === 'H3') target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    });
    const other = m.sprints.find((x) => x.status === 'en-curso' && x.id !== s.id);
    const vel = m.velocity;
    const over = cap !== null && committed > cap + 1e-9;
    const refMax = Math.max(cap || 0, committed + added, scope, 1);
    const noGoal = !closed && !str(s.goal).trim();
    const unest = list.filter((it) => !PM.isNum(it.estimate)).length;
    const capId = 'ags-cap-' + s.id, goalId = 'ags-goal-' + s.id;
    const startBlock = !canWrite ? null : other ? 'Ya hay una iteración en curso (' + spName(other) + '). Ciérrala antes de iniciar esta.' : !list.length ? 'Agrega elementos a la iteración antes de iniciarla.' : null;
    const relLabel = release ? relName(release) : 'Sin release';
    return html`<section class="card" data-role="planner" data-sprint-id=${s.id}>
      <div class="card-head">
        <div class="stack-sm" style="gap:4px;min-width:0">
          <h2 class="h3" tabindex="-1">${(planned ? 'Planificación de ' : '') + spName(s)}</h2>
          <div class="ags-chips"><${ui.Chip} tone=${st[1]}>${st[0]}</${ui.Chip}><span class="xsmall faint mono">${fmt.date(s.start, 'dow')} – ${fmt.date(s.end, 'dow')} ${D.valid(s.end) ? s.end.slice(0, 4) : ''}</span><span class="xsmall faint">· ${relLabel}</span></div>
        </div>
        <div class="row">
          ${canWrite && planned ? html`<${ui.Button} size="sm" variant="primary" icon="sprint" data-role="sprint-start" disabled=${!!startBlock} title=${startBlock || undefined} onClick=${() => act.sprintStart(s)}>Iniciar iteración</${ui.Button}>` : null}
          ${canWrite && s.status === 'en-curso' ? html`<${ui.Button} size="sm" variant="primary" icon="check" data-role="sprint-close" onClick=${() => act.sprintClose(s)}>Cerrar iteración</${ui.Button}>` : null}
          ${canWrite ? html`<${ui.IconButton} size="sm" icon="edit" label=${'Editar ' + spName(s)} onClick=${() => act.sprintEdit(s)} />` : null}
        </div>
      </div>
      <div class="card-body stack">
        ${startBlock && planned ? html`<div class="ags-flag" data-role="start-hint"><${ui.Icon} name="info" size=${14} />${startBlock}</div>` : null}
        <div class="ags-plan-form">
          <${ui.Field} label="Objetivo de la iteración" for=${goalId} hint=${closed || !canWrite ? null : 'Compromiso del equipo para la iteración. Se guarda al salir del campo.'}><${DraftText} id=${goalId} multiline value=${s.goal} disabled=${!canWrite || closed} placeholder=${canWrite && !closed ? 'Qué valor entrega el equipo al terminar la iteración' : undefined} onCommit=${(v) => act.sprintPatch(s, { goal: v.trim() })} /></${ui.Field}>
          <${ui.Field} label=${'Capacidad (' + unit + ')'} for=${capId} hint=${closed || !canWrite ? null : 'Disponibilidad real del equipo.'}><${DraftNumber} id=${capId} value=${s.capacity} min=${0} disabled=${!canWrite || closed} onCommit=${(v) => act.sprintPatch(s, { capacity: v })} /></${ui.Field}>
        </div>
        ${noGoal ? html`<div class="ags-flag" data-role="no-goal"><${ui.Icon} name="alert" size=${14} />${canWrite ? (planned ? 'Sin objetivo: escríbelo antes de iniciar; es el compromiso del equipo para la iteración.' : 'Sin objetivo de iteración registrado: es el compromiso del equipo; escríbelo arriba.') : 'Sin objetivo de iteración registrado.'}</div>` : null}
        ${!closed ? html`<${CapacitySuggestion} s=${s} m=${m} cal=${m.sched.cal} cap=${cap} canWrite=${canWrite} act=${act} />` : null}
        <div class="ags-commit" data-role="commitment">
          <div class="ags-commit-text">
            ${planned
              ? html`<span data-role="commit-forecast">Pronóstico: <strong>${fpts(committed, unit)}</strong> en ${list.length} ${list.length === 1 ? 'elemento' : 'elementos'}${cap !== null ? ' de ' + fpts(cap, unit) + ' de capacidad (' + fmt.pct(cap > 0 ? committed / cap : 0) + ')' : ' · sin capacidad definida'}</span>`
              : html`<span data-role="commit-start">Compromiso al iniciar: <strong>${fpts(committed, unit)}</strong>${cap !== null ? ' de ' + fpts(cap, unit) + ' de capacidad (' + fmt.pct(cap > 0 ? committed / cap : 0) + ')' : ' · sin capacidad definida'}</span>
                <span data-role="commit-scope">${closed ? 'Alcance al cerrar' : 'Alcance actual'}: <strong>${fpts(scope, unit)}</strong> en ${scopeCount} ${scopeCount === 1 ? 'elemento' : 'elementos'}${added > 0 ? ' (+' + fpts(added, unit) + ' agregados durante la iteración en ' + countLabel(addedList.length, 'elemento', 'elementos') + ')' : ''}</span>`}
            <span data-role="team-velocity">Velocidad del equipo: <strong>${vel.avg3 !== null ? fpts(vel.avg3, unit) : '—'}</strong>${vel.avg3 !== null ? ' (promedio de ' + lastClosed(Math.min(3, vel.closed)) + ' del proyecto; rango ' + fmt.num(vel.min3, 1) + '–' + fmt.num(vel.max3, 1) + ')' : ' (sin iteraciones cerradas)'}</span>
            ${!planned ? html`<span>${closed ? 'Terminado al cerrar' : 'Terminado'}: <strong>${fpts(done, unit)}</strong> (${fmt.pct(committed > 0 ? done / committed : 0)} del compromiso)</span>` : null}
          </div>
          <div class="ags-commit-track" role="img" aria-label=${(planned ? 'Pronóstico ' : 'Compromiso al iniciar ') + fpts(committed, unit) + (added > 0 ? '; agregado durante la iteración ' + fpts(added, unit) : '') + (cap !== null ? '; capacidad ' + fpts(cap, unit) : '') + (!planned ? '; terminado ' + fpts(done, unit) : '')}>
            <div class="ags-commit-fill" data-over=${over ? 'true' : 'false'} data-started=${planned ? 'false' : 'true'} style=${'width:' + (committed / refMax) * 100 + '%'}></div>
            ${added > 0 ? html`<div class="ags-commit-added" data-role="commit-added" style=${'left:' + (committed / refMax) * 100 + '%;width:' + (added / refMax) * 100 + '%'}></div>` : null}
            ${!planned && done > 0 ? html`<div class="ags-commit-done" style=${'width:' + Math.min(refMax, done) / refMax * 100 + '%'}></div>` : null}
            ${cap !== null ? html`<div class="ags-commit-cap" style=${'left:' + (cap / refMax) * 100 + '%'}></div>` : null}
          </div>
          <div class="row ags-commit-text" style="gap:6px 14px">
            ${!planned ? html`<span class="ags-commit-key"><i></i>Terminado</span><span class="ags-commit-key"><i class="is-light"></i>Comprometido al iniciar</span>` : null}
            ${added > 0 ? html`<span class="ags-commit-key"><i class="is-added"></i>Agregado durante la iteración</span>` : null}
            ${cap !== null ? html`<span class="ags-commit-key"><i class="is-cap"></i>Capacidad</span>` : null}
            ${over ? html`<span class="ags-flag" data-role="over-capacity"><${ui.Icon} name="alert" size=${14} />Supera la capacidad en ${fpts(committed - cap, unit)}.</span>` : null}
            ${vel.avg3 !== null && committed > vel.avg3 * 1.15 ? html`<span class="ags-flag"><${ui.Icon} name="alert" size=${14} />${planned ? 'El pronóstico' : 'El compromiso'} supera en más de 15 % la velocidad del equipo.</span>` : null}
            ${unest ? html`<span class="ags-flag"><${ui.Icon} name="alert" size=${14} />${unest === 1 ? '1 elemento sin estimar.' : unest + ' elementos sin estimar.'}</span>` : null}
          </div>
        </div>
        <div class="ags-plan-grid">
          <div class="stack-sm" data-role="sprint-items" ref=${itemsRef}>
            <div class="ags-sub"><h3 class="h4">Elementos de la iteración (${list.length})</h3></div>
            ${list.length ? html`<${ScrollWrap} class="ags-list-wrap"><table class="table table-tight ags-tbl"><caption class="sr-only">Elementos de ${spName(s)}</caption>
              <thead><tr><th>Código</th><th>Título</th><th>Estado</th><th class="num">Estimación</th><th class="ags-actions"><span class="sr-only">Acción</span></th></tr></thead>
              <tbody>${list.map((it) => { const cat = A.category(settings, it.status); const isDone = cat === 'terminado'; return html`<${ItemRow} key=${it.id} it=${it} sig=${itemSig(it)} mode="remove" statusText=${statusName(settings, it.status)} statusTone=${CAT_TONE[cat]} unit=${unit} canAct=${canWrite && !closed && !isDone} onAct=${onRemove} sprintName=${spName(s)} />`; })}</tbody></table></${ScrollWrap}>`
              : html`<p class="small muted">Aún no hay elementos.${closed || !canWrite ? '' : ' Agrégalos desde los candidatos, en el orden del backlog.'}</p>`}
            ${closed && arr(s.unfinished).length ? html`<p class="small muted" data-role="unfinished">${'Al cerrar quedaron sin terminar ' + arr(s.unfinished).length + (arr(s.unfinished).length === 1 ? ' elemento (' : ' elementos (') + fpts(arr(s.unfinished).reduce((a, u) => a + Math.max(0, num(u.estimate, 0)), 0), unit) + '): ' + arr(s.unfinished).map((u) => u.code).filter(Boolean).join(', ') + '. Pasaron al backlog del producto o a la iteración siguiente; el burndown y el acta de revisión los conservan.'}</p>` : null}
          </div>
          ${!closed ? html`<div class="stack-sm" data-role="candidates" ref=${candRef}>
            <div class="ags-sub"><h3 class="h4">Candidatos ${release ? 'del release' : 'del backlog'} (${candidates.length})</h3>
              ${canWrite && cap !== null && cap > committed && candidates.length ? html`<${ui.Button} size="sm" icon="layers" onClick=${() => act.fillToCapacity(s, candidates, cap, committed)}>Llenar hasta la capacidad</${ui.Button}>` : null}</div>
            ${candidates.length > 8 ? html`<${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar por código o título" aria-label="Buscar candidatos" />` : null}
            ${shownCand.length ? html`<${ScrollWrap} class="ags-list-wrap"><table class="table table-tight ags-tbl"><caption class="sr-only">Candidatos para ${spName(s)}, en orden de prioridad del backlog</caption>
              <thead><tr><th>Código</th><th>Título</th><th class="num">Estimación</th><th class="ags-actions"><span class="sr-only">Acción</span></th></tr></thead>
              <tbody>${(all ? shownCand : shownCand.slice(0, CAND_LIMIT)).map((it) => html`<${ItemRow} key=${it.id} it=${it} sig=${itemSig(it)} mode="add" unit=${unit} canAct=${canWrite} onAct=${onAdd} sprintName=${spName(s)} />`)}</tbody></table></${ScrollWrap}>
              ${!all && shownCand.length > CAND_LIMIT ? html`<div><${ui.Button} size="sm" variant="ghost" icon="chevron-down" onClick=${() => setAll(true)}>Mostrar los ${shownCand.length} candidatos</${ui.Button}></div>` : null}`
              : html`<p class="small muted">${candidates.length ? 'Ningún candidato coincide con la búsqueda.' : release ? 'No quedan elementos del release sin iteración.' + (canWrite ? ' Agrega o asigna elementos desde el backlog del producto.' : '') : 'No hay elementos sin iteración en el backlog.'}</p>`}
          </div>` : null}
        </div>
        <${SprintDocs} s=${s} canWrite=${canWrite} act=${act} docsIdx=${docsIdx} lessonRows=${lessonRows} />
      </div>
    </section>`;
  }

  function SprintDocs({ s, canWrite, act, docsIdx, lessonRows }) {
    const retroId = s.docs && s.docs.retrospectiva;
    const retro = retroId ? docsIdx.list.find((d) => d.id === retroId) : null;
    const lessons = retro ? arr(retro.fields && retro.fields.lecciones).filter((x) => String(x.situacion || '').trim() || String(x.recomendacion || '').trim()) : [];
    const sent = useMemo(() => { const k = new Set(lessonRows.map((x) => norm(x.situacion) + '|' + norm(x.recomendacion))); return lessons.filter((x) => k.has(norm(x.situacion) + '|' + norm(x.recomendacion))).length; }, [lessons, lessonRows]);
    const lessonsTpl = !!PM.templates['registro-lecciones'];
    return html`<div class="stack-sm" data-role="sprint-docs">
      <h3 class="h4">Documentos de la iteración</h3>
      <div class="ags-docs">${DOC_KINDS.map((k) => {
        const t = PM.templates[k.tid];
        const id = s.docs && s.docs[k.kind];
        const doc = id ? docsIdx.list.find((d) => d.id === id) : null;
        const sdoc = doc ? PM.docStatus(doc.status || 'borrador') : null;
        return html`<div class="ags-doc" key=${k.kind} data-doc-kind=${k.kind}>
          <div class="ags-doc-name"><${ui.Icon} name=${k.icon} size=${15} />${k.label}</div>
          ${doc ? html`<div class="xsmall muted">${doc.title || t && t.name || k.label}${sdoc ? ' · ' + sdoc.label : ''}</div>
            <${ui.Button} size="sm" icon="file" onClick=${() => act.docOpen(k.kind, s)}>Abrir</${ui.Button}>`
          : !t ? html`<div class="xsmall muted" data-role="doc-unavailable">La plantilla «${k.label}» no está disponible en esta versión del gestor.</div><${ui.Button} size="sm" icon="plus" disabled>Crear documento</${ui.Button}>`
          : html`<div class="xsmall muted">${canWrite ? 'Se crea prellenado con los datos de la iteración.' : 'Aún no se ha creado.'}</div><${ui.Button} size="sm" icon="plus" disabled=${!canWrite} onClick=${() => act.docOpen(k.kind, s)}>Crear y abrir</${ui.Button}>`}
        </div>`;
      })}</div>
      <div class="row">
        ${canWrite ? html`<${ui.Button} size="sm" icon="book" data-role="lessons-send" disabled=${!retro || !lessonsTpl} onClick=${() => act.lessonsSend(s)}>Enviar a lecciones aprendidas</${ui.Button}>` : null}
        <span class="xsmall muted">${!retro ? (canWrite ? 'Crea la retrospectiva y registra sus lecciones para enviarlas al registro de lecciones aprendidas (4.4).' : 'Aún no hay retrospectiva.') : !lessonsTpl ? 'La plantilla del registro de lecciones aprendidas no está disponible.' : lessons.length ? sent + ' de ' + lessons.length + (lessons.length === 1 ? ' lección enviada' : ' lecciones enviadas') + ' al registro de lecciones aprendidas.' : 'La retrospectiva aún no tiene lecciones registradas.'}</span>
      </div>
    </div>`;
  }

  /* Ruta para empezar (estado vacío de las vistas ágiles): cada paso dice si está listo (con ícono y texto, no solo color),
     qué falta y lleva a la vista donde se hace. */
  function StartCard({ title, subtitle, steps }) {
    return html`<section class="card ags-start" data-role="agile-start">
      <div class="card-head"><div class="stack-sm" style="gap:2px"><h2 class="h3">${title}</h2>${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}</div></div>
      <ol class="ags-steps">${steps.map((st, i) => html`<li key=${st.id} class="ags-step" data-step=${st.id} data-done=${st.done ? '1' : '0'}>
        <div class="ags-step-head"><span class="ags-step-n" aria-hidden="true">${st.done ? html`<${ui.Icon} name="check" size=${13} />` : i + 1}</span><strong>${st.title}</strong></div>
        <div class="ags-step-state" data-role="step-state"><span class="sr-only">Paso ${i + 1}: </span>${st.done ? 'Listo' : 'Pendiente'} · ${st.state}</div>
        <p>${st.text}</p>
        ${st.action ? html`<div class="ags-step-act"><${ui.Button} size="sm" variant=${st.action.primary ? 'primary' : undefined} icon=${st.action.icon} onClick=${st.action.onClick}>${st.action.label}</${ui.Button}></div>` : null}
      </li>`)}</ol>
    </section>`;
  }
  const countLabel = (n, one, many) => (n === 1 ? '1 ' + one : fmt.num(n) + ' ' + many);
  const backlogStep = (m) => {
    const list = m.items.filter(A.countable);
    const est = list.reduce((t, it) => t + A.estimate(it), 0);
    return { id: 'backlog', title: 'Backlog del producto', done: list.length > 0, state: list.length ? countLabel(list.length, 'elemento', 'elementos') + (est > 0 ? ' · ' + fpts(est, m.unit) + ' estimados' : ' sin estimar') : 'sin elementos',
      text: 'Historias de usuario con criterios de aceptación, estimadas y ordenadas por valor. Los releases y las iteraciones se planifican con ellas.',
      action: PM.getView('backlog') ? { label: 'Ir al backlog', icon: 'backlog', onClick: () => PM.navigate('backlog') } : null };
  };

  function IterationsView({ project, params }) {
    const m = PM.useAgileModel();
    const canWrite = PM.useCanWrite();
    const docsIdx = PM.useProjectDocs();
    const [changeRows, saveChangeRows] = PM.useDocTable('registro-cambios', 'cambios');
    const [lessonRows, saveLessonRows] = PM.useDocTable('registro-lecciones', 'lecciones');
    const pRel = params && params.release, pSp = params && params.sprint;
    const [relSel, setRelSel] = useState(() => pRel || null);
    const [spSel, setSpSel] = useState(() => pSp || null);
    useEffect(() => { if (pRel) { setRelSel(pRel); setSpSel(pSp || null); } }, [pRel, pSp]);
    const { settings, items, sprints, statusDate } = m;
    const cal = m.sched.cal;
    const releases = useMemo(() => m.releases.map(normRelease), [m.releases]);
    const idx = useMemo(() => indexItems(items), [items]);
    const relInfo = useMemo(() => {
      const out = new Map();
      for (const r of releases) {
        const its = idx.byRelease.get(r.id) || [];
        const prog = C.releaseProgress({ release: r, items: its, settings });
        const fc = C.releaseForecast({ release: r, sprints, items, settings, cal, statusDate });
        const fl = !fc.finish && prog.remaining > 0 ? flowForecast(its, settings, statusDate, cal) : null;
        out.set(r.id, { prog, fc, fl, v: relVariance(r, its, settings, sprints), sprints: C.sprintsOfRelease(sprints, r.id), vb: velBasis(r, sprints, items, settings) });
      }
      return out;
    }, [releases, idx, sprints, items, settings, cal, statusDate]);
    const orphans = useMemo(() => sprints.filter((s) => !s.releaseId || !releases.some((r) => r.id === s.releaseId)), [sprints, releases]);
    const velRows = useMemo(() => new Map(m.velocity.rows.map((r) => [r.id, r])), [m.velocity]);
    let selRel = null;
    if (relSel === NONE && orphans.length) selRel = NONE;
    else if (relSel && releases.some((r) => r.id === relSel)) selRel = relSel;
    else {
      /* release activo (regla del núcleo: el de la iteración en curso, si no el primero en curso, comprometido o sin cerrar) */
      const pick = A.activeRelease(releases, sprints) || releases[0];
      selRel = pick ? pick.id : orphans.length ? NONE : null;
    }
    const release = selRel && selRel !== NONE ? releases.find((r) => r.id === selRel) : null;
    const group = selRel === NONE ? orphans : release ? relInfo.get(release.id).sprints : [];
    const selSprint = group.find((s) => s.id === spSel) || group.find((s) => s.status === 'en-curso') || group.find((s) => s.status === 'planeado') || group[group.length - 1] || null;
    /* Foco después de una acción que hace desaparecer el botón que la abrió (iniciar, cerrar o eliminar): cuando los
       datos guardados reflejan el cambio, el foco pasa al primer destino que exista (botón principal del planificador o
       un título con tabindex=-1). No se lo quita a quien ya movió el foco fuera de la vista. */
    const focusReq = useRef(null);
    useEffect(() => {
      const rq = focusReq.current; if (!rq) return;
      if (Date.now() - rq.t > 10000) { focusReq.current = null; return; }
      if (!rq.test(m)) return;
      focusReq.current = null;
      const view = document.querySelector('[data-view="iteraciones"]');
      const ae = document.activeElement;
      if (ae && ae !== document.body && document.contains(ae) && !(view && view.contains(ae))) return;
      for (const sel of rq.targets) {
        const el = view && view.querySelector(sel);
        if (!el) continue;
        if (/^H\d$/.test(el.tagName) && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus();
        return;
      }
    });
    const ref = useRef(null);
    ref.current = { m, project, canWrite, docsIdx, changeRows, saveChangeRows, lessonRows, saveLessonRows, releases, idx, relInfo, cal, select: (r, s) => { setRelSel(r); setSpSel(s || null); }, requestFocus: (rq) => { focusReq.current = { ...rq, t: Date.now() }; } };
    const act = useMemo(() => makeActions(ref), []);
    const selectRel = useCallback((id) => { setRelSel(id); setSpSel(null); }, []);
    if (m.loading) return html`<div class="page"><${ui.Loading} rows=${6} /></div>`;
    const kanban = settings.framework === 'kanban';
    const fw = (PM.AGILE.FRAMEWORKS.find((f) => f.value === settings.framework) || {}).label || '';
    /* el grupo «Ágil» ya se ve en el riel: el encabezado lleva solo los procesos PMBOK, con su nombre oficial */
    const header = html`<${ui.PageHeader} eyebrow="6.5 Desarrollar el cronograma · 4.6 Realizar el control integrado de cambios" title="Releases e iteraciones"
      description=${'Planifica releases con línea base y presupuesto, genera iteraciones de ' + settings.sprintLength + ' días hábiles, planifica la capacidad, inicia y cierra cada iteración con sus documentos. Marco: ' + fw + '.'}
      actions=${html`
        ${!canWrite ? html`<${ui.Chip} tone="outline" icon="eye">Solo lectura</${ui.Chip}>` : null}
        ${typeof PM.agileSettingsDialog === 'function' ? html`<${ui.Button} icon="settings" data-role="agile-settings" onClick=${() => PM.agileSettingsDialog(ref.current.m)}>Configuración ágil</${ui.Button}>` : null}
        <${ui.Button} icon="burndown" onClick=${() => PM.navigate('metricas-agiles', release ? { release: release.id } : {})}>Ver métricas</${ui.Button}>
        ${canWrite ? html`<${ui.Button} variant="primary" icon="plus" data-role="release-new" onClick=${act.releaseNew}>Nuevo release</${ui.Button}>` : null}`} />`;
    if (!releases.length && !orphans.length) {
      const steps = [
        backlogStep(m),
        { id: 'release', title: 'Release', done: false, state: 'sin releases', text: 'Objetivo, fechas, presupuesto (BAC) e iteraciones planeadas. Vincúlalo con un entregable adaptativo de la EDT y con su actividad del cronograma para que su avance entre a la curva S del proyecto.',
          action: canWrite ? { label: 'Crear el primer release', icon: 'plus', onClick: act.releaseNew } : null },
        { id: 'sprints', title: kanban ? 'Iteraciones (opcionales en Kanban)' : 'Iteraciones', done: false, state: 'sin iteraciones', text: 'Iteraciones de ' + settings.sprintLength + ' días hábiles: capacidad y velocidad al planificar, compromiso al iniciar y lo terminado al cerrar.',
          action: canWrite && kanban ? { label: 'Agregar iteración sin release', icon: 'sprint', onClick: () => act.sprintAdd(null) } : null },
        { id: 'baseline', title: 'Línea base del release', done: false, state: 'sin línea base', text: 'Fíjala al comprometer el release. Si su alcance cambia más del ' + fmt.num(settings.scopeChangeThreshold) + '\u00a0% o cambian su fecha o su presupuesto, se registra una solicitud de cambio (4.6).' },
      ];
      return html`<div class="page" data-view="iteraciones">${header}
        <${ui.Empty} icon="release" title="Aún no hay releases" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${act.releaseNew}>Crear el primer release</${ui.Button}>${kanban ? html`<${ui.Button} icon="sprint" onClick=${() => act.sprintAdd(null)}>Agregar iteración sin release</${ui.Button}>` : null}` : null}>
          Un release agrupa los elementos del backlog que se entregan juntos: objetivo, fechas, presupuesto (BAC) e iteraciones. Vincúlalo con un entregable adaptativo de la EDT y con su actividad del cronograma para que su avance entre a la curva S del proyecto.${kanban ? ' Con Kanban las iteraciones son opcionales.' : ''}
        </${ui.Empty}>
        <${StartCard} title="Ruta para planificar" subtitle="Lo que falta para planificar releases e iteraciones en este proyecto" steps=${steps} />
      </div>`;
    }
    return html`<div class="page ags-root" data-view="iteraciones">
      ${header}
      <div class="ags-layout">
        <aside class="ags-side" aria-label="Releases del proyecto">
          <div class="ags-side-head"><h2 class="h3" tabindex="-1">Releases</h2><span class="xsmall faint">${releases.length}</span></div>
          <ul class="ags-rel-list">
            ${releases.map((r) => html`<li key=${r.id}><${ReleaseCard} r=${r} info=${relInfo.get(r.id)} selected=${selRel === r.id} onSelect=${selectRel} unit=${m.unit} /></li>`)}
            ${orphans.length ? html`<li><button type="button" class="ags-rel" aria-pressed=${selRel === NONE ? 'true' : 'false'} data-release-id=${NONE} onClick=${() => selectRel(NONE)}>
              <span class="ags-rel-top"><span class="ags-rel-name">Iteraciones sin release</span><${ui.Chip} tone="outline">${orphans.length}</${ui.Chip}></span>
              <span class="xsmall muted">Iteraciones que no pertenecen a ningún release.</span></button></li>` : null}
          </ul>
          ${!releases.length && canWrite ? html`<${ui.Button} icon="plus" onClick=${act.releaseNew}>Crear release</${ui.Button}>` : null}
        </aside>
        <div class="ags-main">
          ${release ? html`<${ReleaseDetail} r=${release} info=${relInfo.get(release.id)} m=${m} canWrite=${canWrite} act=${act} changeRows=${changeRows} docsIdx=${docsIdx} />` : null}
          ${selRel ? html`<${SprintsCard} release=${release} list=${group} velRows=${velRows} selId=${selSprint ? selSprint.id : null} onSelect=${setSpSel} canWrite=${canWrite} act=${act} m=${m} kanban=${kanban} />` : null}
          ${selSprint ? html`<${SprintPlanner} key=${selSprint.id} s=${selSprint} release=${release} m=${m} idx=${idx} canWrite=${canWrite} act=${act} docsIdx=${docsIdx} lessonRows=${lessonRows} />` : null}
        </div>
      </div>
    </div>`;
  }

  /* ==================================================================== GRÁFICOS (SVG a mano) */
  const CH = 260;
  function useWidth(ref, fallback) {
    const [w, setW] = useState(fallback);
    useLayoutEffect(() => {
      const el = ref.current; if (!el) return undefined;
      let raf = 0;
      const upd = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const v = Math.floor(el.clientWidth); if (v > 0) setW((o) => (Math.abs(o - v) > 1 ? v : o)); }); };
      const first = Math.floor(el.clientWidth); if (first > 0) setW(first);
      let ro = null;
      try { ro = new ResizeObserver(upd); ro.observe(el); } catch (e) { window.addEventListener('resize', upd); }
      return () => { cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', upd); };
    }, []);
    return w;
  }
  function niceStep(max, count) { if (!(max > 0)) return 1; const raw = max / count; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  function niceScale(max, count, integer) {
    let step = niceStep(max, count); if (integer) step = Math.max(1, Math.ceil(step));
    const top = Math.max(step, Math.ceil(max / step - 1e-9) * step);
    const ticks = []; for (let i = 0; i * step <= top + step * 1e-6; i++) ticks.push(+(i * step).toFixed(6));
    return { top, ticks };
  }
  const tw = (s) => String(s).length * 6.3;
  function frameY({ width, height, maxV, fmtY, mr = 18, mt = 22, mb = 30, minIw = 160, integer }) {
    const sc = niceScale(maxV > 0 ? maxV * 1.04 : 1, 4, integer);
    const labels = sc.ticks.map(fmtY);
    const M = { l: Math.max(30, Math.ceil(Math.max(...labels.map(tw))) + 12), r: mr, t: mt, b: mb };
    const iw = Math.max(minIw, width - M.l - M.r), ih = height - M.t - M.b;
    const y = (v) => M.t + ih - (Math.max(0, Math.min(v, sc.top)) / sc.top) * ih;
    return { M, iw, ih, W: M.l + iw + M.r, H: height, y, top: sc.top, ticks: sc.ticks.map((v, i) => ({ v, y: y(v), label: labels[i] })) };
  }
  function linePath(pts) { let d = '', pen = false; for (const p of pts) { if (!p || p[1] === null || p[1] === undefined || !Number.isFinite(p[1])) { pen = false; continue; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); pen = true; } return d; }
  function indexTicks(n, iw, slot) { if (n <= 0) return []; const fit = Math.max(1, Math.floor(iw / slot)); const every = Math.max(1, Math.ceil(n / fit)); const out = []; for (let i = 0; i < n; i += every) out.push(i); return out; }
  function dateTicks(first, last, iw) {
    const span = D.diff(first, last); let list = [], style;
    if (span > 80) { let mm = D.startOfMonth(first); if (mm < first) mm = D.addMonths(mm, 1); for (let g = 0; mm <= last && g < 400; g++, mm = D.addMonths(mm, 1)) list.push(mm); style = 'month'; }
    else { let w = D.startOfWeek(first); if (w < first) w = D.add(w, 7); for (let g = 0; w <= last && g < 200; g++, w = D.add(w, 7)) list.push(w); style = 'dm'; }
    const slot = style === 'month' ? 66 : 54;
    const every = Math.max(1, Math.ceil(list.length / Math.max(1, Math.floor(iw / slot))));
    return list.filter((_, i) => i % every === 0).map((d) => ({ d, label: fmt.date(d, style) }));
  }
  /* columna con extremo de datos redondeado (4 px), anclada a la base */
  const barPath = (x, y, w, h, r = 4) => { if (h <= 0.5) return ''; const rr = Math.min(r, w / 2, h); return 'M' + x + ',' + (y + h) + 'V' + (y + rr) + 'Q' + x + ',' + y + ' ' + (x + rr) + ',' + y + 'H' + (x + w - rr) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + rr) + 'V' + (y + h) + 'Z'; };
  const hbarPath = (x, y, w, h, r = 4) => { if (w <= 0.5) return ''; const rr = Math.min(r, h / 2, w); return 'M' + x + ',' + y + 'H' + (x + w - rr) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + rr) + 'V' + (y + h - rr) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - rr) + ',' + (y + h) + 'H' + x + 'Z'; };

  function YGrid({ g }) {
    const r = g.M.l + g.iw;
    return html`<g data-role="y-axis">${g.ticks.map((t) => html`<g key=${'y' + t.v}><line class="grid-line" x1=${g.M.l} x2=${r} y1=${t.y} y2=${t.y} /><text x=${g.M.l - 8} y=${t.y + 3.5} text-anchor="end">${t.label}</text></g>`)}<line class="axis-line" x1=${g.M.l} x2=${r} y1=${g.M.t + g.ih} y2=${g.M.t + g.ih} /></g>`;
  }
  function XLabels({ g, ticks }) {
    const yy = g.M.t + g.ih;
    return html`<g data-role="x-axis">${ticks.map((t) => {
      const half = tw(t.label) / 2;
      const anchor = t.x - half < 2 ? 'start' : t.x + half > g.W - 2 ? 'end' : 'middle';
      const tx = anchor === 'start' ? Math.max(2, t.x - half) : anchor === 'end' ? Math.min(g.W - 2, t.x + half) : t.x;
      return html`<g key=${'x' + t.key}><line class="axis-line" x1=${t.x} x2=${t.x} y1=${yy} y2=${yy + 4} /><text x=${tx} y=${g.H - 10} text-anchor=${anchor}>${t.label}</text></g>`;
    })}</g>`;
  }
  /* Marcas verticales (corte, fin planeado) con etiquetas que no se superponen. */
  function placeMarks(marks, g) {
    const out = marks.filter((mk) => mk && Number.isFinite(mk.x) && mk.x >= g.M.l - 0.5 && mk.x <= g.M.l + g.iw + 0.5).sort((a, b) => a.x - b.x).map((mk) => ({ ...mk }));
    let prevEnd = -Infinity, row = 0;
    for (const mk of out) {
      const w = tw(mk.label) + 8;
      const anchor = mk.x + w > g.M.l + g.iw ? 'end' : 'start';
      const x0 = anchor === 'end' ? mk.x - w : mk.x;
      row = x0 < prevEnd ? row + 1 : 0;
      mk.anchor = anchor; mk.tx = anchor === 'end' ? mk.x - 4 : mk.x + 4; mk.ty = g.M.t - 8 - row * 12;
      prevEnd = x0 + w;
    }
    return out;
  }
  function Marks({ g, marks }) {
    return html`<g data-role="marks">${marks.map((mk) => html`<g key=${mk.key} data-mark=${mk.key}><line x1=${mk.x} x2=${mk.x} y1=${g.M.t - 4} y2=${g.M.t + g.ih} style=${'stroke:' + mk.color + ';stroke-width:1.5' + (mk.dash ? ';stroke-dasharray:4 3' : '')} /><text x=${mk.tx} y=${mk.ty} text-anchor=${mk.anchor} style="fill:var(--fg);font-weight:600">${mk.label}</text></g>`)}</g>`;
  }
  function Tip({ head, rows, foot }) {
    return html`<div class="ags-tip"><div class="ags-tip-head">${head}</div>${rows.filter(Boolean).map((r) => html`<div class="ags-tip-row" key=${r.label}>${keyMark(r)}<span class="muted">${r.label}</span><strong>${r.value}</strong></div>`)}${foot ? html`<div class="xsmall faint">${foot}</div>` : null}</div>`;
  }
  function keyMark(it) {
    if (!it.color) return html`<span></span>`;
    if (it.kind === 'dash') return html`<span class="ags-key-dash" style=${'--k:' + it.color}></span>`;
    if (it.kind === 'sw') return html`<span class="ags-key-sw" style=${'background:' + it.color + (it.opacity ? ';opacity:' + it.opacity : '')}></span>`;
    if (it.kind === 'cut') return html`<span class="ags-key-cut"></span>`;
    if (it.kind === 'dot') return html`<span class="ags-key-dot" style=${'background:' + it.color}></span>`;
    if (it.kind === 'out') return html`<span class="ags-key-out" style=${'--k:' + it.color}></span>`;
    return html`<span class="ags-key" style=${'background:' + it.color}></span>`;
  }
  function Legend({ items }) {
    return html`<div class="legend" data-role="legend">${items.filter(Boolean).map((it) => html`<span class="legend-item" key=${it.label}>${keyMark(it)}${it.label}${it.value !== undefined ? html`<span class="mono" style="color:var(--fg)">${it.value}</span>` : null}</span>`)}</div>`;
  }
  /* Recorrido de los puntos de un gráfico con el puntero y con las flechas del teclado. */
  function useNav(tip, svgRef, n, defIdx, anchorOf, contentOf) {
    const [hover, setHover] = useState(null);
    const api = useRef(); api.current = { n, defIdx, anchorOf, contentOf };
    const show = (i, cX, cY) => { const svg = svgRef.current; const a = api.current; if (!svg || i === null || i < 0 || i >= a.n) return; const r = svg.getBoundingClientRect(); const p = a.anchorOf(i); setHover(i); tip.show({ clientX: cX !== undefined ? cX : r.left + p.x, clientY: cY !== undefined ? cY : r.top + p.y }, a.contentOf(i)); };
    const leave = () => { setHover(null); tip.hide(); };
    const onKey = (e) => {
      const a = api.current; if (!a.n) return;
      let i = hover;
      if (e.key === 'ArrowRight') i = i === null ? a.defIdx : Math.min(a.n - 1, i + 1);
      else if (e.key === 'ArrowLeft') i = i === null ? a.defIdx : Math.max(0, i - 1);
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = a.n - 1;
      else if (e.key === 'Escape') { leave(); return; }
      else return;
      e.preventDefault(); show(i);
    };
    return { hover, show, leave, onKey };
  }
  function ChartFrame({ tip, nav, svgRef, g, aria, id, children, onMove }) {
    return html`<div class="chart ags-chart" ref=${tip.ref} tabindex="0" role="group" aria-label=${aria + ' Usa las flechas izquierda y derecha para recorrer los datos.'} onKeyDown=${nav.onKey} onBlur=${nav.leave}>
      <svg ref=${svgRef} width=${g.W} height=${g.H} viewBox=${'0 0 ' + g.W + ' ' + g.H} role="img" aria-label=${aria} data-chart=${id}>
        ${children}
        ${onMove ? html`<rect class="ags-hit" data-role="hit" x=${g.M.l} y=${g.M.t} width=${g.iw} height=${g.ih} style="fill:transparent" onPointerMove=${onMove} onPointerDown=${onMove} onPointerLeave=${nav.leave} />` : null}
      </svg>
      ${tip.node}
    </div>`;
  }
  const nearestIdx = (xs, px) => { if (!xs.length) return -1; let best = 0; for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - px) < Math.abs(xs[best] - px)) best = i; return best; };
  const svgX = (svgRef, e) => { const svg = svgRef.current; if (!svg) return null; const r = svg.getBoundingClientRect(); return e.clientX - r.left; };

  function ChartCard({ id, title, subtitle, legend, empty, render, table, filename, extra, span, split }) {
    const svgRef = useRef();
    const [open, setOpen] = useState(false);
    const tid = useMemo(() => PM.uid('agsdata'), []);
    return html`<section class=${cx('card', span && 'span-all')} data-chart-card=${id}>
      <div class="card-head"><div class="stack-sm" style="gap:2px;min-width:0"><h3 class="h3">${title}</h3>${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}</div>
        ${empty ? null : html`<div class="row"><${ui.Button} size="sm" icon="table" data-role="toggle-data" aria-expanded=${open ? 'true' : 'false'} aria-controls=${tid} onClick=${() => setOpen(!open)}>${open ? 'Ocultar datos' : 'Ver datos'}</${ui.Button}><${ui.SvgDownload} getSvg=${() => svgRef.current} filename=${filename} /></div>`}</div>
      <div class="card-body stack">${empty ? html`<div class="ags-empty-chart" data-role="chart-empty"><${ui.Icon} name="info" size=${16} /><span>${empty}</span></div>` : html`${split ? html`<div class="ags-split"><div class="stack">${legend || null}${render(svgRef)}</div>${extra ? html`<div class="stack">${extra}</div>` : null}</div>` : html`${legend || null}${render(svgRef)}${extra || null}`}${open && table ? html`<div id=${tid} data-role="chart-data">${table()}</div>` : null}`}</div>
    </section>`;
  }
  function DataTable({ caption, head, rows }) {
    return html`<div class="table-wrap ags-data"><table class="table table-tight"><caption class="sr-only">${caption}</caption>
      <thead><tr>${head.map((h, i) => html`<th key=${i} class=${h.num ? 'num' : ''}>${h.label}</th>`)}</tr></thead>
      <tbody>${rows.map((r, i) => html`<tr key=${i}>${r.map((c, j) => html`<td key=${j} class=${head[j].num ? 'num nowrap' : head[j].mono ? 'mono nowrap' : ''}>${c}</td>`)}</tr>`)}</tbody></table></div>`;
  }
  const C_IDEAL = 'var(--fg-3)', C_REM = 'var(--s1)', C_SCOPE = 'var(--s7)';

  /* ---------- burndown de la iteración */
  function BurndownChart({ bd, unit, statusDate, svgRef, name }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const days = bd.days;
    const g = useMemo(() => {
      const n = days.length; if (n < 2) return null;
      let maxV = 0; for (const d of days) maxV = Math.max(maxV, d.ideal || 0, d.remaining || 0, d.scope || 0);
      const f = frameY({ width, height: CH, maxV, fmtY: (v) => fmt.num(v, 1) });
      const x = (i) => f.M.l + (i / (n - 1)) * f.iw;
      const path = (k) => linePath(days.map((d, i) => [x(i), d[k] === null || d[k] === undefined ? null : f.y(d[k])]));
      let cut = -1; for (let i = 0; i < n; i++) if (days[i].date <= statusDate) cut = i;
      let last = -1; for (let i = 0; i < n; i++) if (days[i].remaining !== null && days[i].remaining !== undefined) last = i;
      const g0 = { ...f, n, xs: days.map((_, i) => x(i)), paths: { ideal: path('ideal'), scope: path('scope'), remaining: path('remaining') }, last, defIdx: last >= 0 ? last : 0 };
      g0.xt = indexTicks(n, f.iw, 56).map((i) => ({ key: days[i].date, x: x(i), label: fmt.date(days[i].date, 'dm') }));
      g0.marks = placeMarks([cut >= 0 && cut < n - 1 ? { key: 'cut', x: x(cut), label: 'Corte', color: 'var(--signal)' } : null], f);
      g0.end = last >= 0 ? { x: x(last), y: f.y(days[last].remaining) } : null;
      return g0;
    }, [days, width, statusDate]);
    const nav = useNav(tip, svgRef, days.length, g ? g.defIdx : 0, (i) => ({ x: g.xs[i], y: g.M.t + 4 }), (i) => {
      const d = days[i];
      return html`<${Tip} head=${(i === 0 ? 'Planificación · ' : '') + fmt.date(d.date, 'dow')} rows=${[
        { label: 'Restante', value: d.remaining === null ? '—' : fpts(d.remaining, unit), color: C_REM },
        { label: 'Alcance', value: d.scope === null ? '—' : fpts(d.scope, unit), color: C_SCOPE },
        { label: 'Terminado', value: d.done === null ? '—' : fpts(d.done, unit) },
        { label: 'Ideal', value: fpts(d.ideal, unit), color: C_IDEAL, kind: 'dash' }]} foot=${d.remaining === null ? 'Día posterior a la fecha de corte.' : null} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return html`<p class="small muted">La iteración necesita fechas de inicio y fin válidas.</p>`;
    const lastD = g.last >= 0 ? days[g.last] : null;
    const aria = 'Burndown de ' + name + ': ' + (lastD ? 'al ' + fmt.date(lastD.date, 'long') + ' quedan ' + fpts(lastD.remaining, unit) + ' de un alcance de ' + fpts(lastD.scope, unit) + ' (ideal ' + fpts(lastD.ideal, unit) + ')' : 'la iteración aún no tiene días transcurridos') + '; compromiso inicial ' + fpts(bd.committed, unit) + '.';
    const hp = nav.hover !== null ? days[nav.hover] : null;
    const onMove = (e) => { const px = svgX(svgRef, e); if (px !== null) nav.show(nearestIdx(g.xs, px), e.clientX); };
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="burndown" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} /><${Marks} g=${g} marks=${g.marks} />
      <path data-series="ideal" d=${g.paths.ideal} style=${'fill:none;stroke:' + C_IDEAL + ';stroke-width:2;stroke-dasharray:6 5;stroke-linecap:round'} />
      <path data-series="scope" d=${g.paths.scope} style=${'fill:none;stroke:' + C_SCOPE + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />
      <path data-series="remaining" d=${g.paths.remaining} style=${'fill:none;stroke:' + C_REM + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />
      ${g.end ? html`<circle cx=${g.end.x} cy=${g.end.y} r="4.5" style=${'fill:' + C_REM + ';stroke:var(--surface);stroke-width:2'} />` : null}
      ${hp ? html`<g pointer-events="none" data-role="crosshair"><line x1=${g.xs[nav.hover]} x2=${g.xs[nav.hover]} y1=${g.M.t} y2=${g.M.t + g.ih} style="stroke:var(--fg-3);stroke-width:1" />
        ${[['remaining', C_REM], ['scope', C_SCOPE]].filter(([k]) => hp[k] !== null && hp[k] !== undefined).map(([k, c]) => html`<circle key=${k} cx=${g.xs[nav.hover]} cy=${g.y(hp[k])} r="4.5" style=${'fill:' + c + ';stroke:var(--surface);stroke-width:2'} />`)}</g>` : null}
    </${ChartFrame}>`;
  }

  /* ---------- burnup del release */
  /* Puntos del burnup: los del núcleo (inicio y cierre de cada iteración) más el punto de la fecha de corte, calculado
     con los mismos filtros (alcance creado y trabajo terminado hasta esa fecha). */
  function burnupPoints(bu, release, items, settings, statusDate) {
    const pts = bu.points.filter((p) => D.valid(p.date)).map((p) => ({ ...p }));
    const past = pts.filter((p) => !p.future && p.scope !== null);
    const lastPast = past[past.length - 1];
    if (pts.length && D.valid(statusDate) && statusDate >= pts[0].date && (!lastPast || statusDate > lastPast.date) && !pts.some((p) => p.date === statusDate)) {
      const at = burnupAt(release, items, settings, statusDate);
      pts.push({ date: statusDate, label: 'Corte', scope: at.scope, done: at.done, future: false, cut: true });
    }
    pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return pts;
  }
  const ptLabel = (p, long) => (p.cut ? (long ? 'Fecha de corte' : 'Corte') : p.sprintId ? (long ? 'Cierre de ' : '') + spName({ name: p.label }) : long ? 'Inicio del release' : 'Inicio');
  function BurnupChart({ bu, pts, cut, proj, release, unit, statusDate, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const g = useMemo(() => {
      if (!pts.length) return null;
      const bl = PM.isNum(bu.baselinePoints) && A.hasBaseline(release) ? Number(bu.baselinePoints) : null;
      const blEnd = A.hasBaseline(release) && D.valid(release.baseline.end) ? release.baseline.end : null;
      const dates = [...pts.map((p) => p.date), proj, release.end, blEnd, statusDate].filter(D.valid);
      const first = D.min(...dates); let last = D.max(...dates); if (first === last) last = D.add(first, 7);
      const maxV = Math.max(bl || 0, ...pts.map((p) => Math.max(p.scope || 0, p.done || 0)));
      const f = frameY({ width, height: CH, maxV, fmtY: (v) => fmt.num(v, 1), mt: 34, mr: bl !== null ? Math.max(tw('Línea base'), tw(fpts(bl, unit))) + 16 : 18 });
      const t0 = D.toMs(first), span = D.toMs(last) - t0;
      const x = (d) => f.M.l + ((D.toMs(d) - t0) / span) * f.iw;
      const known = pts.filter((p) => p.scope !== null && p.scope !== undefined);
      const lk = known[known.length - 1];
      const g0 = { ...f, known, xs: known.map((p) => x(p.date)), x };
      g0.scopePath = linePath(known.map((p) => [x(p.date), f.y(p.scope)]));
      g0.donePath = linePath(known.map((p) => [x(p.date), f.y(p.done)]));
      /* la proyección parte del último punto conocido (normalmente el corte) y llega al alcance de ese punto */
      g0.proj = proj && lk && proj > lk.date && lk.scope - lk.done > 0 ? { x0: x(lk.date), y0: f.y(lk.done), x1: x(proj), y1: f.y(lk.scope), date: proj } : null;
      g0.bl = bl !== null ? { y: f.y(bl), v: bl } : null;
      g0.xt = dateTicks(first, last, f.iw).map((t) => ({ key: t.d, x: x(t.d), label: t.label }));
      g0.marks = placeMarks([
        D.valid(statusDate) && statusDate >= first && statusDate <= last ? { key: 'cut', x: x(statusDate), label: 'Corte', color: 'var(--signal)' } : null,
        D.valid(release.end) ? { key: 'end', x: x(release.end), label: 'Fin planeado', color: 'var(--fg-3)', dash: true } : null,
      ], f);
      g0.defIdx = Math.max(0, known.length - 1);
      return g0;
    }, [bu, pts, proj, release, width, statusDate, unit]);
    const n = g ? g.known.length : 0;
    const nav = useNav(tip, svgRef, n, g ? g.defIdx : 0, (i) => ({ x: g.xs[i], y: g.M.t + 4 }), (i) => {
      const p = g.known[i];
      return html`<${Tip} head=${ptLabel(p, true) + ' · ' + fmt.date(p.date)} rows=${[
        { label: 'Alcance', value: fpts(p.scope, unit), color: C_SCOPE },
        { label: 'Terminado', value: fpts(p.done, unit), color: C_REM },
        g.bl ? { label: 'Línea base', value: fpts(g.bl.v, unit), color: 'var(--fg-3)' } : null,
        { label: 'Restante', value: fpts(p.scope - p.done, unit) }]} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return html`<p class="small muted">El release necesita fechas o iteraciones para dibujar el burnup.</p>`;
    const aria = 'Burnup de ' + relName(release) + ': al ' + fmt.date(statusDate, 'long') + ' (fecha de corte), terminado ' + fpts(cut.done, unit) + ' de un alcance de ' + fpts(cut.scope, unit) + ' (' + fmt.pct(cut.pct) + ')' + (g.bl ? '; línea base ' + fpts(g.bl.v, unit) : '; sin línea base') + (g.proj ? '; proyección de terminación el ' + fmt.date(g.proj.date, 'long') : '') + '.';
    const hp = nav.hover !== null ? g.known[nav.hover] : null;
    const onMove = (e) => { const px = svgX(svgRef, e); if (px !== null) nav.show(nearestIdx(g.xs, px), e.clientX); };
    const right = g.M.l + g.iw;
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="burnup" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} /><${Marks} g=${g} marks=${g.marks} />
      ${g.bl ? html`<g data-role="baseline"><line x1=${g.M.l} x2=${right} y1=${g.bl.y} y2=${g.bl.y} style="stroke:var(--fg-3);stroke-width:1.5" /><text x=${right + 8} y=${g.bl.y - 2} style="fill:var(--fg);font-weight:600">Línea base</text><text x=${right + 8} y=${g.bl.y + 11}>${fpts(g.bl.v, unit)}</text></g>` : null}
      <path data-series="scope" d=${g.scopePath} style=${'fill:none;stroke:' + C_SCOPE + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />
      <path data-series="done" d=${g.donePath} style=${'fill:none;stroke:' + C_REM + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />
      ${g.proj ? html`<line data-series="projection" x1=${g.proj.x0} y1=${g.proj.y0} x2=${g.proj.x1} y2=${g.proj.y1} style=${'stroke:' + C_REM + ';stroke-width:2;stroke-dasharray:2 4;stroke-linecap:round'} /><circle cx=${g.proj.x1} cy=${g.proj.y1} r="4.5" style=${'fill:var(--surface);stroke:' + C_REM + ';stroke-width:2'} />` : null}
      ${g.known.map((p, i) => html`<g key=${'p' + i} data-pt=${p.cut ? 'cut' : String(i)}><circle data-series="scope-point" cx=${g.xs[i]} cy=${g.y(p.scope)} r="4" style=${'fill:' + C_SCOPE + ';stroke:var(--surface);stroke-width:2'} /><circle data-series="done-point" cx=${g.xs[i]} cy=${g.y(p.done)} r="4" style=${'fill:' + C_REM + ';stroke:var(--surface);stroke-width:2'} /></g>`)}
      ${hp ? html`<line pointer-events="none" data-role="crosshair" x1=${g.xs[nav.hover]} x2=${g.xs[nav.hover]} y1=${g.M.t} y2=${g.M.t + g.ih} style="stroke:var(--fg-3);stroke-width:1" />` : null}
    </${ChartFrame}>`;
  }

  /* ---------- velocidad */
  function VelocityChart({ vel, unit, svgRef, where = '' }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const rows = vel.rows;
    const g = useMemo(() => {
      const n = rows.length; if (!n) return null;
      const maxV = Math.max(vel.avg3 || 0, ...rows.map((r) => Math.max(r.committed, r.completed)));
      const f = frameY({ width, height: CH, maxV, fmtY: (v) => fmt.num(v, 1) });
      const band = Math.max(34, f.iw / n);
      const iw = band * n, W = f.M.l + iw + f.M.r;
      const bw = Math.max(6, Math.min(24, (band - 12) / 2));
      const g0 = { ...f, iw, W, band, bw, n };
      g0.cxs = rows.map((_, i) => f.M.l + band * (i + 0.5));
      const short = band < 80;
      const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / (short ? 40 : 82)))));
      g0.xt = rows.map((r, i) => ({ key: r.id, x: g0.cxs[i], label: short ? 'It. ' + ((/(\d+)\s*$/.exec(String(r.name || '')) || [])[1] || i + 1) : spName(r), show: i % every === 0 })).filter((t) => t.show);
      g0.avgY = vel.avg3 !== null ? f.y(vel.avg3) : null;
      g0.defIdx = Math.max(0, rows.map((r) => r.status).lastIndexOf('cerrado'));
      return g0;
    }, [rows, vel.avg3, width]);
    const nav = useNav(tip, svgRef, rows.length, g ? g.defIdx : 0, (i) => ({ x: g.cxs[i], y: g.M.t + 4 }), (i) => {
      const r = rows[i]; const st = SPR_STATUS[r.status] || SPR_STATUS.planeado;
      return html`<${Tip} head=${spName(r) + ' · ' + st[0]} rows=${[
        r.status === 'planeado' ? { label: 'Planificado (sin iniciar)', value: fpts(r.committed, unit), color: 'var(--fg-3)', kind: 'out' } : { label: 'Comprometido', value: fpts(r.committed, unit), color: 'var(--fg-3)', kind: 'sw', opacity: 0.45 },
        { label: r.status === 'cerrado' ? 'Terminado' : 'Terminado hasta hoy', value: fpts(r.completed, unit), color: C_REM, kind: 'sw' },
        r.committed > 0 && r.status !== 'planeado' ? { label: 'Cumplimiento', value: fmt.pct(r.completed / r.committed) } : null]} foot=${fmt.date(r.start) + ' – ' + fmt.date(r.end)} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return null;
    const closedRows = rows.filter((r) => r.status === 'cerrado');
    const plannedRows = rows.filter((r) => r.status === 'planeado');
    const aria = 'Velocidad por iteración' + (closedRows.length ? ' (terminado de comprometido): ' + closedRows.map((r) => spName(r) + ' ' + fmt.num(r.completed, 1) + ' de ' + fmt.num(r.committed, 1)).join(', ') + '. Promedio de ' + lastClosed(Math.min(3, vel.closed)) + where + ': ' + fpts(vel.avg3, unit) + '.' : ': aún no hay iteraciones cerradas; ' + rows.length + (rows.length === 1 ? ' iteración planeada o en curso.' : ' iteraciones planeadas o en curso.'))
      + (plannedRows.length && closedRows.length ? ' ' + (plannedRows.length === 1 ? 'Planificada sin iniciar: ' : 'Planificadas sin iniciar: ') + plannedRows.map((r) => spName(r) + ' ' + fmt.num(r.committed, 1)).join(', ') + '.' : '');
    const onMove = (e) => { const px = svgX(svgRef, e); if (px !== null) nav.show(nearestIdx(g.cxs, px), e.clientX); };
    const base = g.M.t + g.ih;
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="velocity" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} />
      ${nav.hover !== null ? html`<rect pointer-events="none" x=${g.M.l + g.band * nav.hover} y=${g.M.t} width=${g.band} height=${g.ih} style="fill:var(--fg-3);opacity:0.08" />` : null}
      ${rows.map((r, i) => {
        const hc = base - g.y(r.committed), hd = base - g.y(r.completed);
        return html`<g key=${r.id} data-sprint=${r.id}>
          ${r.status === 'planeado'
            ? html`<path data-series="planned" d=${barPath(g.cxs[i] - 1 - g.bw + 0.75, base - hc + 0.75, g.bw - 1.5, Math.max(0, hc - 0.75))} style="fill:none;stroke:var(--fg-3);stroke-width:1.5;stroke-dasharray:3 2" />`
            : html`<path data-series="committed" d=${barPath(g.cxs[i] - 1 - g.bw, base - hc, g.bw, hc)} style="fill:var(--fg-3);opacity:0.45" />`}
          <path data-series="completed" d=${barPath(g.cxs[i] + 1, base - hd, g.bw, hd)} style=${'fill:' + C_REM + (r.status === 'en-curso' ? ';opacity:0.6' : '')} />
        </g>`;
      })}
      ${g.avgY !== null ? html`<g data-role="average"><line x1=${g.M.l} x2=${g.M.l + g.iw} y1=${g.avgY} y2=${g.avgY} style="stroke:var(--fg);stroke-width:1.5;stroke-dasharray:6 4" /><text x=${g.M.l + g.iw - 4} y=${g.avgY - 6} text-anchor="end" style="fill:var(--fg);font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round">Promedio ${fpts(vel.avg3, unit)}</text></g>` : null}
    </${ChartFrame}>`;
  }

  /* ---------- diagrama de flujo acumulado */
  const CFD_LAYERS = [
    { key: 'terminado', label: 'Terminado', color: 'var(--s3)' },
    { key: 'en-curso', label: 'En curso', color: 'var(--s1)' },
    { key: 'pendiente', label: 'Por hacer', color: 'var(--s4)' },
    { key: 'nuevo', label: 'Backlog del producto', color: 'var(--s7)' },
  ];
  function CfdChart({ rows, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const g = useMemo(() => {
      const n = rows.length; if (n < 2) return null;
      const tot = rows.map((r) => CFD_LAYERS.reduce((s, l) => s + (r[l.key] || 0), 0));
      const f = frameY({ width, height: CH, maxV: Math.max(1, ...tot), fmtY: (v) => fmt.num(v), integer: true });
      const x = (i) => f.M.l + (i / (n - 1)) * f.iw;
      const xs = rows.map((_, i) => x(i));
      const layers = []; let below = rows.map(() => 0);
      for (const l of CFD_LAYERS) {
        const above = rows.map((r, i) => below[i] + (r[l.key] || 0));
        const top = above.map((v, i) => [xs[i], f.y(v)]);
        const bottom = below.map((v, i) => [xs[i], f.y(v)]).reverse();
        const area = 'M' + top.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'L' + bottom.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
        layers.push({ ...l, area, line: linePath(top) });
        below = above;
      }
      const g0 = { ...f, xs, layers, n, defIdx: n - 1 };
      const span = Math.max(1, D.diff(rows[0].date, rows[n - 1].date));
      g0.xt = dateTicks(rows[0].date, rows[n - 1].date, f.iw).map((t) => ({ key: t.d, x: f.M.l + (D.diff(rows[0].date, t.d) / span) * f.iw, label: t.label }));
      return g0;
    }, [rows, width]);
    const nav = useNav(tip, svgRef, rows.length, g ? g.defIdx : 0, (i) => ({ x: g.xs[i], y: g.M.t + 4 }), (i) => {
      const r = rows[i]; const total = CFD_LAYERS.reduce((s, l) => s + (r[l.key] || 0), 0);
      return html`<${Tip} head=${fmt.date(r.date, 'dow')} rows=${[...[...CFD_LAYERS].reverse().map((l) => ({ label: l.label, value: fmt.num(r[l.key] || 0), color: l.color, kind: 'sw' })), { label: 'Total', value: fmt.num(total) }]} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return null;
    const lastR = rows[rows.length - 1];
    const aria = 'Diagrama de flujo acumulado del ' + fmt.date(rows[0].date, 'long') + ' al ' + fmt.date(lastR.date, 'long') + ': al final hay ' + CFD_LAYERS.map((l) => fmt.num(lastR[l.key] || 0) + ' ' + l.label.toLowerCase()).join(', ') + '.';
    const onMove = (e) => { const px = svgX(svgRef, e); if (px !== null) nav.show(nearestIdx(g.xs, px), e.clientX); };
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="cfd" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} />
      ${g.layers.map((l) => html`<g key=${l.key} data-series=${l.key}><path d=${l.area} style=${'fill:' + l.color + ';fill-opacity:0.22;stroke:none'} /><path d=${l.line} style=${'fill:none;stroke:' + l.color + ';stroke-width:2;stroke-linejoin:round'} /></g>`)}
      ${nav.hover !== null ? html`<line pointer-events="none" data-role="crosshair" x1=${g.xs[nav.hover]} x2=${g.xs[nav.hover]} y1=${g.M.t} y2=${g.M.t + g.ih} style="stroke:var(--fg);stroke-width:1" />` : null}
    </${ChartFrame}>`;
  }

  /* ---------- pronóstico de terminación (línea de tiempo) */
  /* Release con alcance y sin trabajo pendiente: el «pronóstico» del núcleo es la fecha real de terminación. */
  const relFinished = (fc) => !!fc && fc.total > 0 && !(fc.remaining > 0);
  function ForecastChart({ fc, fl, release, statusDate, unit, svgRef, vb }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const bl = A.hasBaseline(release) && D.valid(release.baseline.end) ? release.baseline.end : null;
    const lanes = useMemo(() => {
      const out = [];
      const done = relFinished(fc);
      const fin = done ? fc.finish : fc.finish || (fl && fl.finish);
      if (fin) out.push({ key: 'fc', done, label: done ? 'Terminado' : fc.finish ? 'Pronóstico' : 'Pronóstico por flujo', best: fc.finish && !done ? fc.finishBest : null, worst: fc.finish && !done ? fc.finishWorst : null, date: fin });
      if (D.valid(release.end)) out.push({ key: 'plan', label: 'Fin planeado', date: release.end });
      if (bl) out.push({ key: 'bl', label: 'Línea base', date: bl });
      return out;
    }, [fc, fl, release, bl]);
    const g = useMemo(() => {
      if (!lanes.length) return null;
      const dates = [statusDate, ...lanes.flatMap((l) => [l.date, l.best, l.worst])].filter(D.valid);
      let first = D.min(...dates), last = D.max(...dates);
      const pad = Math.max(3, Math.round(D.diff(first, last) * 0.06));
      first = D.add(first, -pad); last = D.add(last, pad);
      const labW = Math.max(...lanes.map((l) => tw(l.label))) + 16;
      const M = { l: labW, r: 18, t: 26, b: 30 };
      const laneH = 40;
      const H = M.t + lanes.length * laneH + M.b;
      const iw = Math.max(160, width - M.l - M.r), ih = lanes.length * laneH, W = M.l + iw + M.r;
      const t0 = D.toMs(first), span = D.toMs(last) - t0;
      const x = (d) => M.l + ((D.toMs(d) - t0) / span) * iw;
      const g0 = { M, iw, ih, W, H, x, laneH };
      g0.lanes = lanes.map((l, i) => ({ ...l, cy: M.t + laneH * i + laneH / 2, x: x(l.date), xb: D.valid(l.best) ? x(l.best) : null, xw: D.valid(l.worst) ? x(l.worst) : null }));
      g0.xs = g0.lanes.map((l) => l.x);
      g0.xt = dateTicks(first, last, iw).map((t) => ({ key: t.d, x: x(t.d), label: t.label }));
      g0.marks = placeMarks([D.valid(statusDate) ? { key: 'cut', x: x(statusDate), label: 'Corte', color: 'var(--signal)' } : null], { M, iw });
      return g0;
    }, [lanes, width, statusDate]);
    const nav = useNav(tip, svgRef, lanes.length, 0, (i) => ({ x: g.lanes[i].x, y: g.lanes[i].cy - 10 }), (i) => {
      const l = g.lanes[i];
      if (l.key === 'fc' && l.done) return html`<${Tip} head="Release terminado" rows=${[{ label: 'Último elemento terminado', value: fmt.date(l.date), color: C_REM, kind: 'dot' }]} />`;
      if (l.key === 'fc') return html`<${Tip} head=${l.label} rows=${[
        { label: 'Probable', value: fmt.date(l.date), color: C_REM, kind: 'dot' },
        D.valid(l.best) ? { label: 'Optimista', value: fmt.date(l.best) } : null,
        D.valid(l.worst) ? { label: 'Pesimista', value: fmt.date(l.worst) } : null]}
        foot=${fc.finish ? fc.sprintsNeeded + (fc.sprintsNeeded === 1 ? ' iteración' : ' iteraciones') + ' a ' + fpts(fc.velocity, unit) + ' por iteración (' + (vb ? velName(vb) : 'velocidad media') + '; el rango usa la máxima y la mínima de ' + (vb ? velWhere(vb) : 'las últimas iteraciones cerradas') + ').' : 'Ritmo de ' + fpts(fl.perWeek, unit) + ' por semana en las últimas 6 semanas.'} />`;
      return html`<${Tip} head=${l.label} rows=${[{ label: 'Fecha', value: fmt.date(l.date) }]} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return null;
    const f0 = g.lanes.find((l) => l.key === 'fc');
    const aria = 'Pronóstico de terminación de ' + relName(release) + ': ' + (f0 && f0.done ? 'terminado el ' + fmt.date(f0.date, 'long') : f0 ? 'probable el ' + fmt.date(f0.date, 'long') + (D.valid(f0.best) ? ', optimista el ' + fmt.date(f0.best, 'long') : '') + (D.valid(f0.worst) ? ', pesimista el ' + fmt.date(f0.worst, 'long') : '') : 'sin pronóstico') + (D.valid(release.end) ? '; fin planeado el ' + fmt.date(release.end, 'long') : '') + (bl ? '; línea base el ' + fmt.date(bl, 'long') : '') + '.';
    const yb = g.M.t + g.ih;
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="forecast">
      ${g.lanes.map((l, i) => html`<g key=${l.key} data-lane=${l.key}>
        ${i ? html`<line class="grid-line" x1=${g.M.l} x2=${g.M.l + g.iw} y1=${g.M.t + g.laneH * i} y2=${g.M.t + g.laneH * i} />` : null}
        <text x=${g.M.l - 10} y=${l.cy + 4} text-anchor="end" style="fill:var(--fg);font-weight:600">${l.label}</text>
      </g>`)}
      <line class="axis-line" x1=${g.M.l} x2=${g.M.l + g.iw} y1=${yb} y2=${yb} />
      <${XLabels} g=${g} ticks=${g.xt} /><${Marks} g=${{ ...g, M: g.M, ih: g.ih }} marks=${g.marks} />
      ${g.lanes.map((l, i) => {
        const hot = nav.hover === i;
        const lbl = fmt.date(l.date, 'dm');
        const la = l.x + tw(lbl) / 2 > g.M.l + g.iw ? 'end' : l.x - tw(lbl) / 2 < g.M.l ? 'start' : 'middle';
        if (l.key === 'fc') return html`<g key=${'m' + l.key} data-role="forecast-range" onPointerEnter=${() => nav.show(i)} onPointerLeave=${nav.leave}>
          ${l.xb !== null && l.xw !== null ? html`<rect x=${Math.min(l.xb, l.xw)} y=${l.cy - 5} width=${Math.max(2, Math.abs(l.xw - l.xb))} height="10" rx="5" style=${'fill:' + C_REM + ';fill-opacity:0.22'} />
            <circle cx=${l.xb} cy=${l.cy} r="4" style=${'fill:var(--surface);stroke:' + C_REM + ';stroke-width:2'} /><circle cx=${l.xw} cy=${l.cy} r="4" style=${'fill:var(--surface);stroke:' + C_REM + ';stroke-width:2'} />` : null}
          <circle cx=${l.x} cy=${l.cy} r=${hot ? 7 : 6} style=${'fill:' + C_REM + ';stroke:var(--surface);stroke-width:2'} />
          <text x=${l.x} y=${l.cy - 11} text-anchor=${la} style="fill:var(--fg);font-weight:600">${lbl}</text>
        </g>`;
        const s = 6;
        return html`<g key=${'m' + l.key} onPointerEnter=${() => nav.show(i)} onPointerLeave=${nav.leave}>
          <path d=${'M' + l.x + ' ' + (l.cy - s) + 'L' + (l.x + s) + ' ' + l.cy + 'L' + l.x + ' ' + (l.cy + s) + 'L' + (l.x - s) + ' ' + l.cy + 'Z'} style=${l.key === 'plan' ? 'fill:var(--fg-2);stroke:var(--surface);stroke-width:2' : 'fill:var(--surface);stroke:var(--fg-2);stroke-width:2'} />
          <text x=${l.x} y=${l.cy - 11} text-anchor=${la}>${lbl}</text>
        </g>`;
      })}
    </${ChartFrame}>`;
  }

  /* ---------- valor ganado ágil: barras horizontales BAC / PV / EV / AC */
  function EvmBars({ ev, currency, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const rows = useMemo(() => [
      { key: 'bac', label: 'BAC', name: 'Presupuesto del release', v: ev.bac, color: 'var(--fg-3)' },
      { key: 'pv', label: 'PV', name: 'Valor planificado', v: ev.pv, color: 'var(--s1)' },
      { key: 'ev', label: 'EV', name: 'Valor ganado', v: ev.ev, color: 'var(--s3)' },
      { key: 'ac', label: 'AC', name: 'Costo real', v: ev.ac, color: 'var(--s2)' },
    ], [ev]);
    const g = useMemo(() => {
      const maxV = Math.max(1, ...rows.map((r) => r.v || 0));
      const vals = rows.map((r) => fmt.moneyShort(r.v, currency));
      const M = { l: 44, r: Math.max(...vals.map(tw)) + 18, t: 8, b: 8 };
      const rowH = 30, H = M.t + rows.length * rowH + M.b;
      const iw = Math.max(120, width - M.l - M.r), W = M.l + iw + M.r;
      const x = (v) => (Math.max(0, v) / maxV) * iw;
      return { M, iw, ih: rows.length * rowH, W, H, rowH, x, vals, ys: rows.map((_, i) => M.t + rowH * i + rowH / 2) };
    }, [rows, width, currency]);
    const nav = useNav(tip, svgRef, rows.length, 2, (i) => ({ x: g.M.l + g.x(rows[i].v), y: g.ys[i] - 8 }), (i) => html`<${Tip} head=${rows[i].name + ' (' + rows[i].label + ')'} rows=${[{ label: 'Valor', value: fmt.money(rows[i].v, currency), color: rows[i].color, kind: 'sw' }]} />`);
    const aria = 'Valor ganado ágil del release: BAC ' + g.vals[0] + ', PV ' + g.vals[1] + ', EV ' + g.vals[2] + ', AC ' + g.vals[3] + '.';
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="agile-evm">
      ${rows.map((r, i) => html`<g key=${r.key} data-series=${r.key} onPointerEnter=${() => nav.show(i)} onPointerLeave=${nav.leave}>
        <rect x=${g.M.l} y=${g.ys[i] - g.rowH / 2} width=${g.iw} height=${g.rowH} style="fill:transparent" />
        <text x=${g.M.l - 10} y=${g.ys[i] + 4} text-anchor="end" style="fill:var(--fg);font-weight:600">${r.label}</text>
        <path d=${hbarPath(g.M.l, g.ys[i] - 9, g.x(r.v), 18)} style=${'fill:' + r.color + (nav.hover === i ? ';opacity:0.8' : '')} />
        <text x=${g.M.l + g.x(r.v) + 6} y=${g.ys[i] + 4}>${g.vals[i]}</text>
      </g>`)}
      <line class="axis-line" x1=${g.M.l} x2=${g.M.l} y1=${g.M.t} y2=${g.M.t + g.ih} />
    </${ChartFrame}>`;
  }

  /* ---------- tiempo de ciclo (dispersión) */
  function CycleChart({ stats, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const pts = stats.done;
    const g = useMemo(() => {
      if (!pts.length) return null;
      let first = pts[0].doneDate, last = pts[pts.length - 1].doneDate;
      if (first === last) { first = D.add(first, -3); last = D.add(last, 3); }
      const f = frameY({ width, height: CH, maxV: Math.max(1, ...pts.map((p) => p.cycle)), fmtY: (v) => fmt.num(v), integer: true });
      const t0 = D.toMs(first), span = Math.max(1, D.toMs(last) - t0);
      const x = (d) => f.M.l + 6 + ((D.toMs(d) - t0) / span) * (f.iw - 12);
      const g0 = { ...f, xs: pts.map((p) => x(p.doneDate)), ys: pts.map((p) => f.y(p.cycle)) };
      g0.xt = dateTicks(first, last, f.iw).map((t) => ({ key: t.d, x: x(t.d), label: t.label }));
      g0.p85 = stats.p85 !== null ? f.y(stats.p85) : null;
      return g0;
    }, [pts, width, stats.p85]);
    const nav = useNav(tip, svgRef, pts.length, pts.length - 1, (i) => ({ x: g.xs[i], y: g.ys[i] - 6 }), (i) => {
      const p = pts[i];
      return html`<${Tip} head=${p.code + ' · ' + (p.title || 'Sin título')} rows=${[{ label: 'Tiempo de ciclo', value: daysText(p.cycle) }, p.lead !== null ? { label: 'Tiempo de entrega', value: daysText(p.lead) } : null, { label: 'Inicio del trabajo', value: fmt.date(p.start) }, { label: 'Terminado', value: fmt.date(p.doneDate) }]} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return null;
    const aria = 'Tiempo de ciclo de ' + pts.length + ' elementos terminados: promedio ' + daysText(round1(stats.avgCycle)) + ', percentil 85 ' + daysText(stats.p85) + '.';
    const onMove = (e) => { const svg = svgRef.current; if (!svg) return; const r = svg.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; let best = -1, bd = Infinity; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(g.xs[i] - px, g.ys[i] - py); if (d < bd) { bd = d; best = i; } } if (best >= 0 && bd < 28) nav.show(best, e.clientX, e.clientY); else nav.leave(); };
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="cycle-time" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} />
      ${g.p85 !== null ? html`<g data-role="p85"><line x1=${g.M.l} x2=${g.M.l + g.iw} y1=${g.p85} y2=${g.p85} style="stroke:var(--fg);stroke-width:1.5;stroke-dasharray:6 4" /><text x=${g.M.l + g.iw - 4} y=${g.p85 - 6} text-anchor="end" style="fill:var(--fg);font-weight:600">85 %: ${daysText(stats.p85)}</text></g>` : null}
      ${pts.map((p, i) => html`<circle key=${p.id} data-point=${p.code} cx=${g.xs[i]} cy=${g.ys[i]} r=${nav.hover === i ? 6 : 4.5} style=${'fill:' + C_REM + ';fill-opacity:0.85;stroke:var(--surface);stroke-width:2'} />`)}
    </${ChartFrame}>`;
  }

  /* ---------- rendimiento (elementos terminados por semana) */
  function ThroughputChart({ stats, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const weeks = stats.weeks;
    const g = useMemo(() => {
      const n = weeks.length; if (!n) return null;
      const f = frameY({ width, height: CH, maxV: Math.max(1, ...weeks.map((w) => w.count), stats.perWeek || 0), fmtY: (v) => fmt.num(v), integer: true });
      const band = f.iw / n, bw = Math.max(6, Math.min(24, band - 8));
      const g0 = { ...f, band, bw, cxs: weeks.map((_, i) => f.M.l + band * (i + 0.5)) };
      const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(f.iw / 54))));
      g0.xt = weeks.map((w, i) => ({ key: w.start, x: g0.cxs[i], label: fmt.date(w.start, 'dm'), show: i % every === 0 })).filter((t) => t.show);
      g0.avgY = stats.perWeek !== null ? f.y(stats.perWeek) : null;
      return g0;
    }, [weeks, width, stats.perWeek]);
    const nav = useNav(tip, svgRef, weeks.length, weeks.length - 1, (i) => ({ x: g.cxs[i], y: g.M.t + 4 }), (i) => {
      const w = weeks[i];
      return html`<${Tip} head=${'Semana del ' + fmt.date(w.start, 'dm') + ' al ' + fmt.date(D.add(w.start, 6), 'dm')} rows=${[{ label: 'Elementos terminados', value: fmt.num(w.count), color: C_REM, kind: 'sw' }, { label: 'Estimación terminada', value: fmt.num(w.points, 1) }]} foot=${w.partial ? 'Semana en curso a la fecha de corte.' : null} />`;
    });
    useEffect(() => { nav.leave(); }, [g]);
    if (!g) return null;
    const aria = 'Rendimiento: ' + weeks.map((w) => fmt.date(w.start, 'dm') + ' ' + w.count).join(', ') + '. Promedio ' + fmt.num(stats.perWeek, 1) + ' elementos por semana.';
    const onMove = (e) => { const px = svgX(svgRef, e); if (px !== null) nav.show(nearestIdx(g.cxs, px), e.clientX); };
    const base = g.M.t + g.ih;
    return html`<${ChartFrame} tip=${tip} nav=${nav} svgRef=${svgRef} g=${g} aria=${aria} id="throughput" onMove=${onMove}>
      <${YGrid} g=${g} /><${XLabels} g=${g} ticks=${g.xt} />
      ${nav.hover !== null ? html`<rect pointer-events="none" x=${g.M.l + g.band * nav.hover} y=${g.M.t} width=${g.band} height=${g.ih} style="fill:var(--fg-3);opacity:0.08" />` : null}
      ${weeks.map((w, i) => { const h = base - g.y(w.count); return html`<path key=${w.start} data-week=${w.start} d=${barPath(g.cxs[i] - g.bw / 2, base - h, g.bw, h)} style=${'fill:' + C_REM + (w.partial ? ';opacity:0.6' : '')} />`; })}
      ${g.avgY !== null ? html`<g data-role="average"><line x1=${g.M.l} x2=${g.M.l + g.iw} y1=${g.avgY} y2=${g.avgY} style="stroke:var(--fg);stroke-width:1.5;stroke-dasharray:6 4" /><text x=${g.M.l + g.iw - 4} y=${g.avgY - 6} text-anchor="end" style="fill:var(--fg);font-weight:600">Promedio ${fmt.num(stats.perWeek, 1)}</text></g>` : null}
    </${ChartFrame}>`;
  }

  /* Tiempo de ciclo (del primer paso a «en curso» a la terminación), tiempo de entrega (creación → terminación) y
     rendimiento semanal hasta la fecha de corte. */
  function flowStats(items, settings, statusDate) {
    const done = [];
    for (const it of items) {
      if (!A.countable(it) || !A.isDone(settings, it) || !D.valid(it.doneDate) || it.doneDate > statusDate) continue;
      const ft = A.flowTimes(it, settings);
      if (!ft) continue;
      done.push({ id: it.id, code: it.code || '', title: it.title || '', start: ft.start, doneDate: it.doneDate, cycle: ft.cycle, lead: ft.lead, estimate: A.estimate(it) });
    }
    done.sort((a, b) => (a.doneDate < b.doneDate ? -1 : a.doneDate > b.doneDate ? 1 : String(a.code).localeCompare(String(b.code))));
    const cyc = done.map((d) => d.cycle).sort((a, b) => a - b);
    const q = (p) => (cyc.length ? cyc[Math.min(cyc.length - 1, Math.max(0, Math.ceil(p * cyc.length) - 1))] : null);
    const leads = done.map((d) => d.lead).filter((v) => v !== null);
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const endW = D.startOfWeek(statusDate);
    let startW = D.add(endW, -7 * 11);
    if (done.length) { const fw = D.startOfWeek(done[0].doneDate); if (fw > startW) startW = D.diff(fw, endW) < 28 ? D.add(endW, -21) : fw; }
    const weeks = [];
    for (let w = startW, g = 0; w <= endW && g < 60; g++, w = D.add(w, 7)) weeks.push({ start: w, count: 0, points: 0, partial: D.add(w, 6) > statusDate });
    for (const d of done) { const w = D.startOfWeek(d.doneDate); const k = weeks.find((x) => x.start === w); if (k) { k.count++; k.points += d.estimate; } }
    const perWeek = weeks.length && done.length ? weeks.reduce((s, w) => s + w.count, 0) / weeks.length : null;
    return { done, avgCycle: mean(cyc), median: q(0.5), p85: q(0.85), avgLead: mean(leads), weeks, perWeek };
  }

  function AgileEvmSection({ release, ev, m, cost }) {
    const { currency } = m;
    const shared = cost && cost.shared > 0 ? cost : null;
    const pe = m.evm;
    const taskId = taskIdOfRelease(m, release.id);
    const task = taskId ? m.sched.byId.get(taskId) : null;
    const planned = task ? C.plannedFraction(m.sched.cal, task.startDate, task.finishDate, task.milestone, m.statusDate) : null;
    const tSpi = task && planned > 0 ? num(task.progress, 0) / 100 / planned : null;
    const tone = (v) => C.indexTone(v);
    /* mismo vocabulario y bandas que el tablero (80) y el valor ganado ágil (50): de 0,98 a 1,02 es «al día» o «dentro del
       presupuesto» */
    const word = (v, a, mid, b) => (v === null || !Number.isFinite(v) ? '—' : v > 1.02 ? a : v >= 0.98 ? mid : b);
    return html`<div class="stack" data-role="agile-evm">
      <div class="ags-tiles" data-role="evm-tiles">
        <${ui.Stat} label="BAC del release" value=${fmt.moneyShort(ev.bac, currency)} sub=${fmt.money(ev.bac, currency)} />
        <${ui.Stat} label="PPC (avance planeado)" value=${fmt.pct(ev.ppc, 1)} sub=${ev.sprintsElapsed + ' de ' + ev.plannedSprints + ' iteraciones transcurridas'} />
        <${ui.Stat} label="APC (avance real)" value=${fmt.pct(ev.apc, 1)} sub=${'Terminado / alcance actual'} />
        <${ui.Stat} label="PV" value=${fmt.moneyShort(ev.pv, currency)} sub="BAC × PPC" />
        <${ui.Stat} label="EV" value=${fmt.moneyShort(ev.ev, currency)} sub="BAC × APC" />
        <${ui.Stat} label="AC (costo real)" value=${fmt.moneyShort(ev.ac, currency)} sub=${ev.ac > 0 ? (shared ? 'Incluye ' + fmt.moneyShort(shared.shared, currency) + ' compartidos con otro release' : 'Costos imputados al release') : 'Sin costos imputados'} />
        <${ui.Stat} label="SV" value=${(ev.sv > 0 ? '+' : '') + fmt.moneyShort(ev.sv, currency)} sub="EV − PV" tone=${ev.sv < 0 ? 'warn' : null} />
        <${ui.Stat} label="CV" value=${ev.ac > 0 ? (ev.cv > 0 ? '+' : '') + fmt.moneyShort(ev.cv, currency) : '—'} sub="EV − AC" tone=${ev.ac > 0 && ev.cv < 0 ? 'warn' : null} />
        <${ui.Stat} label="SPI" value=${fmt.idx(ev.spi)} sub=${word(ev.spi, 'Adelantado', 'Al día', 'Atrasado')} tone=${tone(ev.spi)} />
        <${ui.Stat} label="CPI" value=${fmt.idx(ev.cpi)} sub=${word(ev.cpi, 'Por debajo del presupuesto', 'Dentro del presupuesto', 'Por encima del presupuesto')} tone=${tone(ev.cpi)} />
        <${ui.Stat} label="EAC" value=${ev.eac !== null ? fmt.moneyShort(ev.eac, currency) : '—'} sub="BAC / CPI" />
        <${ui.Stat} label="VAC" value=${ev.vac !== null ? (ev.vac > 0 ? '+' : '') + fmt.moneyShort(ev.vac, currency) : '—'} sub="BAC − EAC" tone=${ev.vac !== null && ev.vac < 0 ? 'warn' : null} />
      </div>
      <div class="table-wrap"><table class="table table-tight ags-cmp" data-role="evm-compare"><caption class="sr-only">Comparación del valor ganado ágil con el del proyecto y la actividad vinculada</caption>
        <thead><tr><th>Indicador</th><th class="num">Release (AgileEVM)</th><th class="num">Proyecto (valor ganado)</th><th class="num">Actividad vinculada</th></tr></thead>
        <tbody>
          <tr><td>SPI</td><td class="num">${fmt.idx(ev.spi)}</td><td class="num">${fmt.idx(pe.spi)}</td><td class="num">${task ? fmt.idx(tSpi) : '—'}</td></tr>
          <tr><td>CPI</td><td class="num">${fmt.idx(ev.cpi)}</td><td class="num">${fmt.idx(pe.cpi)}</td><td class="num">—</td></tr>
          <tr data-role="evm-compare-ac"><td>Costo real (AC)</td><td class="num">${fmt.moneyShort(ev.ac, currency)}</td><td class="num">${fmt.moneyShort(num(pe.ac, 0), currency)}</td><td class="num">—</td></tr>
          <tr><td>Avance real</td><td class="num">${fmt.pct(ev.apc, 1)}</td><td class="num">${fmt.pct(pe.pctComplete, 1)}</td><td class="num">${task ? fmt.pct100(task.progress, 1) : '—'}</td></tr>
          <tr><td>Avance planeado</td><td class="num">${fmt.pct(ev.ppc, 1)}</td><td class="num">${fmt.pct(pe.pctPlanned, 1)}</td><td class="num">${task ? fmt.pct(planned, 1) : '—'}</td></tr>
        </tbody></table></div>
      ${shared ? html`<${Callout} tone="warn" role="evm-shared" title="Costos compartidos con otros releases"
        actions=${PM.getView('valor-ganado') ? html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => PM.navigate('valor-ganado', { tab: 'reales' })}>Ir a costos reales</${ui.Button}>` : null}>
        <span>${(shared.count === 1 ? '1 registro de costos sin release' : shared.count + ' registros de costos sin release') + ' (' + fmt.money(shared.shared, currency) + ') ' + (shared.count === 1 ? 'coincide' : 'coinciden') + ' también con ' + shared.others.map((r) => '«' + relName(r) + '»').join(', ') + ' porque comparten el entregable de la EDT o la actividad: cuenta' + (shared.count === 1 ? '' : 'n') + ' en el AC de este release y en el de ' + (shared.others.length === 1 ? 'ese release' : 'esos releases') + ', pero una sola vez en el total de los releases (' + fmt.money(shared.total, currency) + ', sin duplicar). Imputa cada registro a su release con el selector «Release» de Costos reales para que el CPI del release sea exacto.'}</span>
        <ul class="ags-shared-list" data-role="evm-shared-records">${shared.recs.slice(0, 5).map((x, i) => html`<li key=${(x.actual.id || '') + i}>${[D.valid(x.actual.date) ? fmt.date(x.actual.date) : null, String(x.actual.description || x.actual.category || 'Registro sin descripción').trim(), fmt.money(x.amount, currency)].filter(Boolean).join(' · ')}</li>`)}${shared.recs.length > 5 ? html`<li>y ${shared.recs.length - 5} más</li>` : null}</ul>
      </${Callout}>` : null}
      <p class="ags-note">${task ? 'Actividad vinculada: «' + (task.name || '') + '» (' + fmt.date(task.startDate) + ' – ' + fmt.date(task.finishDate) + '); su avance se calcula desde el backlog del release, así que el valor ganado del proyecto ya incluye este trabajo.' : 'El release no tiene una actividad del cronograma vinculada: su avance no entra al valor ganado del proyecto. Vincúlala desde «Releases e iteraciones».'} El AgileEVM mide el avance planeado por iteraciones transcurridas (PPC) y el real por estimación terminada (APC).</p>
    </div>`;
  }

  /* ==================================================================== VISTA «metricas-agiles» */
  function MetricsView({ project, params }) {
    const m = PM.useAgileModel();
    const pRel = params && params.release, pSp = params && params.sprint;
    const [relSel, setRelSel] = useState(() => pRel || null);
    const [spSel, setSpSel] = useState(() => pSp || null);
    const [scope, setScope] = useState('release');
    useEffect(() => { if (pRel) { setRelSel(pRel); setSpSel(pSp || null); } }, [pRel, pSp]);
    const { settings, items, sprints, statusDate, unit, currency } = m;
    const cal = m.sched.cal;
    const releases = useMemo(() => m.releases.map(normRelease), [m.releases]);
    let relId = '';
    if (relSel === '' || relSel === NONE) relId = '';
    else if (relSel && releases.some((r) => r.id === relSel)) relId = relSel;
    else { const pick = A.activeRelease(releases, sprints) || releases[0]; relId = pick ? pick.id : ''; }
    const release = relId ? releases.find((r) => r.id === relId) : null;
    const spList = useMemo(() => (release ? C.sprintsOfRelease(sprints, release.id) : sprints), [release, sprints]);
    const sprint = spList.find((s) => s.id === spSel) || spList.find((s) => s.status === 'en-curso') || [...spList].reverse().find((s) => s.status === 'cerrado') || spList[0] || null;
    const flowScope = release && scope === 'release' ? 'release' : 'todo';
    const scopeItems = useMemo(() => (flowScope === 'release' ? items.filter((it) => it.releaseId === release.id) : items), [items, flowScope, release]);
    const bd = useMemo(() => (sprint ? C.sprintBurndown({ sprint, items: withUnfinished(sprint, items), settings, cal, statusDate }) : null), [sprint, items, settings, cal, statusDate]);
    const bu = useMemo(() => (release ? C.releaseBurnup({ release, sprints, items, settings, statusDate }) : null), [release, sprints, items, settings, statusDate]);
    const fc = useMemo(() => (release ? C.releaseForecast({ release, sprints, items, settings, cal, statusDate }) : null), [release, sprints, items, settings, cal, statusDate]);
    /* burnup a la fecha de corte: puntos con el corte, valores al corte y proyección desde el corte */
    const buCut = useMemo(() => (release ? burnupAt(release, items, settings, statusDate) : null), [release, items, settings, statusDate]);
    const buPts = useMemo(() => (bu ? burnupPoints(bu, release, items, settings, statusDate) : []), [bu, release, items, settings, statusDate]);
    const buProj = useMemo(() => {
      if (!bu || !fc || !D.valid(fc.finish) || !(bu.remaining > 0)) return null;
      const known = buPts.filter((pt) => pt.scope !== null && pt.scope !== undefined);
      const lk = known[known.length - 1];
      return lk && fc.finish > lk.date && lk.scope - lk.done > 0 ? fc.finish : null;
    }, [bu, fc, buPts]);
    const vb = useMemo(() => (release ? velBasis(release, sprints, items, settings) : null), [release, sprints, items, settings]);
    const fl = useMemo(() => (release && fc && !fc.finish ? flowForecast(items.filter((it) => A.countable(it) && it.releaseId === release.id), settings, statusDate, cal) : null), [release, fc, items, settings, statusDate, cal]);
    const vel = useMemo(() => C.velocity({ sprints: flowScope === 'release' ? spList : sprints, items, settings }), [flowScope, spList, sprints, items, settings]);
    const cfdRange = useMemo(() => {
      const relSp = release ? C.sprintsOfRelease(sprints, release.id) : [];
      const created = scopeItems.filter((it) => A.countable(it) && D.valid(it.createdAt)).map((it) => it.createdAt);
      let from = flowScope === 'release' && release ? D.min(release.start, relSp[0] && relSp[0].start) || D.min(...created) : D.min(...created, ...sprints.map((s) => s.start));
      const to = statusDate;
      if (!D.valid(from) || from > to) return null;
      if (D.diff(from, to) > 730) from = D.add(to, -730);
      return { from, to };
    }, [release, sprints, scopeItems, flowScope, statusDate]);
    const cfdRows = useMemo(() => (cfdRange ? C.cfd({ items: scopeItems, settings, from: cfdRange.from, to: cfdRange.to }) : []), [cfdRange, scopeItems, settings]);
    /* costos reales de todos los releases en una pasada (PM.agile.releaseCosts, la regla de 50-evm): el AC de cada release
       y los registros sin release que comparten entregable o actividad con otro release (cuentan una vez en el total) */
    /* con las actividades del cronograma, el núcleo resuelve también el vínculo desde la actividad (task.releaseId) */
    const relCosts = useMemo(() => A.releaseCosts(releases, m.costs, m.tree, statusDate, arr(m.schedule && m.schedule.tasks)), [releases, m.costs, m.tree, statusDate, m.schedule]);
    const costInfo = useMemo(() => {
      if (!release) return null;
      const own = relCosts.byRelease.get(release.id) || { ac: 0, shared: 0 };
      const recs = relCosts.shared.filter((x) => x.ids.includes(release.id));
      const otherIds = new Set(); for (const x of recs) for (const id of x.ids) if (id !== release.id) otherIds.add(id);
      return { ac: own.ac, shared: own.shared, count: recs.length, recs, others: releases.filter((r) => otherIds.has(r.id)), total: relCosts.total, sharedAll: relCosts.shared.length };
    }, [release, relCosts, releases]);
    const ev = useMemo(() => (release ? C.agileEvm({ release, sprints, items, settings, actualCost: costInfo ? costInfo.ac : 0, statusDate }) : null), [release, sprints, items, settings, costInfo, statusDate]);
    const fst = useMemo(() => flowStats(scopeItems, settings, statusDate), [scopeItems, settings, statusDate]);
    if (m.loading) return html`<div class="page"><${ui.Loading} rows=${6} /></div>`;
    const header = html`<${ui.PageHeader} eyebrow="4.5 Monitorear y controlar el trabajo del proyecto · 7.4 Controlar los costos" title="Métricas ágiles"
      description=${'Burndown, burnup, velocidad, flujo acumulado, pronóstico, valor ganado ágil y tiempos de ciclo, con datos a la fecha de corte (' + fmt.date(statusDate, 'long') + ').'}
      actions=${html`<${ui.Button} icon="sprint" onClick=${() => PM.navigate('iteraciones', release ? { release: release.id } : {})}>Releases e iteraciones</${ui.Button}>`} />`;
    if (!releases.length && !sprints.length && !items.length) {
      const steps = [
        { ...backlogStep(m), text: 'Elementos estimados y con fecha de creación: alimentan el burnup, el flujo acumulado y el pronóstico de terminación.' },
        { id: 'release', title: 'Release con presupuesto', done: false, state: 'sin releases', text: 'Su alcance, su fin planeado y su presupuesto (BAC) dan el burnup, el pronóstico y el valor ganado ágil (AgileEVM).',
          action: PM.getView('iteraciones') ? { label: 'Ir a releases e iteraciones', icon: 'sprint', onClick: () => PM.navigate('iteraciones') } : null },
        { id: 'sprints', title: 'Iteraciones cerradas', done: false, state: 'sin iteraciones', text: 'Cada iteración cerrada fija lo terminado: velocidad, burndown y rango del pronóstico (optimista, probable y pesimista).' },
        { id: 'flow', title: 'Elementos terminados', done: false, state: 'sin elementos terminados', text: 'Mover tarjetas a «Terminado» registra su fecha: tiempo de ciclo, tiempo de entrega y rendimiento semanal.',
          action: PM.getView('kanban') ? { label: 'Ir al tablero Kanban', icon: 'kanban', onClick: () => PM.navigate('kanban') } : null },
      ];
      return html`<div class="page" data-view="metricas-agiles">${header}<${ui.Empty} icon="burndown" title="Aún no hay datos para las métricas" actions=${html`<${ui.Button} variant="primary" icon="sprint" onClick=${() => PM.navigate('iteraciones')}>Ir a releases e iteraciones</${ui.Button}><${ui.Button} icon="backlog" onClick=${() => PM.navigate('backlog')}>Ir al backlog</${ui.Button}>`}>
        Las métricas aparecen cuando el proyecto tiene elementos en el backlog, releases e iteraciones: burndown de la iteración, burnup del release, velocidad, flujo acumulado, pronóstico de terminación, valor ganado ágil y tiempo de ciclo.
      </${ui.Empty}>
        <${StartCard} title="Qué necesitan las métricas" subtitle="Cada métrica se calcula con los datos que registra el equipo" steps=${steps} />
      </div>`;
    }
    const relOpts = [...releases.map((r) => ({ value: r.id, label: relName(r) })), { value: NONE, label: 'Todo el proyecto (sin release)' }];
    const spOpts = spList.map((s) => ({ value: s.id, label: spName(s) + ' · ' + (SPR_STATUS[s.status] || SPR_STATUS.planeado)[0].toLowerCase() }));
    const fileBase = PM.slug((project.code || project.name || 'proyecto')) || 'proyecto';
    const tbl = (caption, head, rows) => () => html`<${DataTable} caption=${caption} head=${head} rows=${rows} />`;
    const lastBd = bd && [...bd.days].reverse().find((d) => d.remaining !== null);
    const fcFin = fc ? (relFinished(fc) ? fc.finish : fc.finish || (fl && fl.finish)) || null : null;
    return html`<div class="page" data-view="metricas-agiles">
      ${header}
      <div class="toolbar ags-toolbar" data-role="metrics-filters">
        <${ui.Field} label="Release" for="ags-m-rel"><${ui.Select} id="ags-m-rel" value=${relId || NONE} options=${relOpts} onValue=${(v) => { setRelSel(v === NONE ? '' : v); setSpSel(null); }} /></${ui.Field}>
        <${ui.Field} label="Iteración" for="ags-m-sp">${spOpts.length ? html`<${ui.Select} id="ags-m-sp" value=${sprint ? sprint.id : ''} options=${spOpts} onValue=${setSpSel} />` : html`<${ui.Select} id="ags-m-sp" value="" options=${[]} placeholder="Sin iteraciones" disabled />`}</${ui.Field}>
        ${release ? html`<div class="field"><span class="field-label" id="ags-m-scope">Flujo y velocidad</span><${ui.Segmented} label="Alcance de las métricas de flujo y velocidad" value=${flowScope} onChange=${setScope} options=${[{ value: 'release', label: 'Release' }, { value: 'todo', label: 'Todo el proyecto' }]} /></div>` : null}
      </div>
      <div class="ags-charts">
        <${ChartCard} id="burndown" title=${'Burndown' + (sprint ? ' de ' + spName(sprint) : ' de la iteración')} filename=${'burndown_' + fileBase + '.svg'}
          subtitle=${sprint ? fmt.date(sprint.start) + ' – ' + fmt.date(sprint.end) + ' · ' + (lastBd ? 'quedan ' + fpts(lastBd.remaining, unit) : 'sin días transcurridos') : null}
          empty=${!sprint ? 'Crea una iteración en «Releases e iteraciones» para ver su burndown.' : !bd || bd.days.length < 2 ? 'La iteración necesita fechas de inicio y fin válidas.' : null}
          legend=${html`<${Legend} items=${[{ label: 'Restante', color: C_REM }, { label: 'Alcance', color: C_SCOPE }, { label: 'Ideal', color: C_IDEAL, kind: 'dash' }, { label: 'Corte', kind: 'cut', color: 'var(--signal)' }]} />`}
          render=${(r) => html`<${BurndownChart} bd=${bd} unit=${unit} statusDate=${statusDate} svgRef=${r} name=${sprint ? spName(sprint) : ''} />`}
          table=${bd ? tbl('Burndown por día hábil', [{ label: 'Fecha', mono: true }, { label: 'Ideal', num: true }, { label: 'Restante', num: true }, { label: 'Alcance', num: true }, { label: 'Terminado', num: true }], bd.days.map((d) => [fmt.date(d.date), fmt.num(d.ideal, 1), d.remaining === null ? '—' : fmt.num(d.remaining, 1), d.scope === null ? '—' : fmt.num(d.scope, 1), d.done === null ? '—' : fmt.num(d.done, 1)])) : null} />
        <${ChartCard} id="burnup" title=${'Burnup' + (release ? ' de ' + relName(release) : ' del release')} filename=${'burnup_' + fileBase + '.svg'}
          subtitle=${bu ? 'Al ' + fmt.date(statusDate) + ': ' + fpts(buCut.done, unit) + ' de ' + fpts(buCut.scope, unit) + ' (' + fmt.pct(buCut.pct) + ')' + (A.hasBaseline(release) ? ' · línea base ' + fpts(num(release.baseline.points, 0), unit) : ' · sin línea base') : null}
          empty=${!release ? 'Selecciona un release para ver su burnup.' : !bu.points.length ? 'Define el inicio del release o crea sus iteraciones para ver el burnup.' : null}
          legend=${html`<${Legend} items=${[{ label: 'Alcance', color: C_SCOPE }, { label: 'Terminado', color: C_REM }, release && A.hasBaseline(release) ? { label: 'Línea base', color: 'var(--fg-3)' } : null, buProj ? { label: 'Proyección', color: C_REM, kind: 'dash' } : null, { label: 'Corte', kind: 'cut', color: 'var(--signal)' }]} />`}
          render=${(r) => html`<${BurnupChart} bu=${bu} pts=${buPts} cut=${buCut} proj=${buProj} release=${release} unit=${unit} statusDate=${statusDate} svgRef=${r} />`}
          table=${bu ? tbl('Burnup al inicio, al cierre de cada iteración y a la fecha de corte', [{ label: 'Punto' }, { label: 'Fecha', mono: true }, { label: 'Alcance', num: true }, { label: 'Terminado', num: true }], buPts.map((p) => [ptLabel(p, false), fmt.date(p.date), p.scope === null ? '—' : fmt.num(p.scope, 1), p.done === null ? '—' : fmt.num(p.done, 1)])) : null} />
        <${ChartCard} id="velocity" title="Velocidad" filename=${'velocidad_' + fileBase + '.svg'}
          subtitle=${vel.avg3 !== null ? 'Promedio de ' + lastClosed(Math.min(3, vel.closed)) + (flowScope === 'release' ? ' del release' : ' del proyecto') + ': ' + fpts(vel.avg3, unit) + (vel.closed > 1 ? ' · rango ' + fmt.num(vel.min3, 1) + '–' + fmt.num(vel.max3, 1) : '') : 'Sin iteraciones cerradas todavía'}
          empty=${!vel.rows.length ? (settings.framework === 'kanban' ? 'En Kanban sin iteraciones, usa el rendimiento semanal como medida de capacidad.' : 'Crea iteraciones para medir la velocidad.') : null}
          legend=${html`<${Legend} items=${[vel.rows.some((rw) => rw.status !== 'planeado') ? { label: 'Comprometido', color: 'var(--fg-3)', kind: 'sw', opacity: 0.45 } : null, vel.rows.some((rw) => rw.status === 'planeado') ? { label: 'Planificado (sin iniciar)', color: 'var(--fg-3)', kind: 'out' } : null, { label: 'Terminado', color: C_REM, kind: 'sw' }, vel.rows.some((rw) => rw.status === 'en-curso') ? { label: 'Terminado hasta hoy (iteración en curso)', color: C_REM, kind: 'sw', opacity: 0.6 } : null, vel.avg3 !== null ? { label: avgLabel(vel.closed), color: 'var(--fg)', kind: 'dash' } : null]} />`}
          render=${(r) => html`<${VelocityChart} vel=${vel} unit=${unit} svgRef=${r} where=${flowScope === 'release' ? ' del release' : ' del proyecto'} />`}
          table=${tbl('Velocidad por iteración', [{ label: 'Iteración' }, { label: 'Estado' }, { label: 'Inicio', mono: true }, { label: 'Fin', mono: true }, { label: 'Comprometido o planificado', num: true }, { label: 'Terminado', num: true }, { label: 'Cumplimiento', num: true }], vel.rows.map((rw) => [spName(rw), (SPR_STATUS[rw.status] || SPR_STATUS.planeado)[0], fmt.date(rw.start), fmt.date(rw.end), fmt.num(rw.committed, 1) + (rw.status === 'planeado' ? ' (planificado)' : ''), fmt.num(rw.completed, 1), rw.committed > 0 && rw.status !== 'planeado' ? fmt.pct(rw.completed / rw.committed) : '—']))} />
        <${ChartCard} id="cfd" title="Diagrama de flujo acumulado" filename=${'flujo-acumulado_' + fileBase + '.svg'}
          subtitle=${cfdRange ? 'Del ' + fmt.date(cfdRange.from) + ' al ' + fmt.date(cfdRange.to) + (cfdRows.length && D.diff(cfdRange.from, cfdRange.to) > 180 ? ' · semanal' : ' · diario') + ' · elementos (sin épicas)' : null}
          empty=${cfdRows.length < 2 ? 'Se necesitan elementos con fecha de creación y al menos dos días de historia hasta la fecha de corte.' : null}
          legend=${html`<${Legend} items=${[...CFD_LAYERS].reverse().map((l) => ({ label: l.label, color: l.color, kind: 'sw' }))} />`}
          render=${(r) => html`<${CfdChart} rows=${cfdRows} svgRef=${r} />`}
          table=${tbl('Elementos por estado y fecha', [{ label: 'Fecha', mono: true }, { label: 'Backlog del producto', num: true }, { label: 'Por hacer', num: true }, { label: 'En curso', num: true }, { label: 'Terminado', num: true }], cfdRows.map((rw) => [fmt.date(rw.date), fmt.num(rw.nuevo), fmt.num(rw.pendiente), fmt.num(rw['en-curso']), fmt.num(rw.terminado)]))} />
        <${ChartCard} id="cycle-time" title="Tiempo de ciclo" filename=${'tiempo-ciclo_' + fileBase + '.svg'}
          subtitle=${fst.done.length ? fst.done.length + ' terminados · promedio ' + daysText(round1(fst.avgCycle)) + ' · mediana ' + daysText(fst.median) + ' · tiempo de entrega promedio ' + (fst.avgLead !== null ? daysText(round1(fst.avgLead)) : '—') : null}
          empty=${!fst.done.length ? 'Aún no hay elementos terminados hasta la fecha de corte.' : null}
          legend=${html`<${Legend} items=${[{ label: 'Elemento terminado (días calendario desde que empezó)', color: C_REM, kind: 'dot' }, { label: 'Percentil 85', color: 'var(--fg)', kind: 'dash' }]} />`}
          render=${(r) => html`<${CycleChart} stats=${fst} svgRef=${r} />`}
          table=${tbl('Tiempo de ciclo por elemento', [{ label: 'Código', mono: true }, { label: 'Título' }, { label: 'Inicio', mono: true }, { label: 'Terminado', mono: true }, { label: 'Ciclo (días)', num: true }, { label: 'Entrega (días)', num: true }], fst.done.map((p) => [p.code, p.title, fmt.date(p.start), fmt.date(p.doneDate), fmt.num(p.cycle), p.lead === null ? '—' : fmt.num(p.lead)]))} />
        <${ChartCard} id="throughput" title="Rendimiento (throughput)" filename=${'rendimiento_' + fileBase + '.svg'}
          subtitle=${fst.perWeek !== null ? 'Promedio: ' + fmt.num(fst.perWeek, 1) + ' elementos por semana en las últimas ' + fst.weeks.length + ' semanas' : null}
          empty=${!fst.done.length ? 'Aún no hay elementos terminados hasta la fecha de corte.' : null}
          legend=${html`<${Legend} items=${[{ label: 'Elementos terminados por semana', color: C_REM, kind: 'sw' }, fst.weeks.some((w) => w.partial) ? { label: 'Semana en curso (hasta el corte)', color: C_REM, kind: 'sw', opacity: 0.6 } : null, { label: 'Promedio', color: 'var(--fg)', kind: 'dash' }]} />`}
          render=${(r) => html`<${ThroughputChart} stats=${fst} svgRef=${r} />`}
          table=${tbl('Elementos terminados por semana', [{ label: 'Semana', mono: true }, { label: 'Elementos', num: true }, { label: 'Estimación', num: true }], fst.weeks.map((w) => [fmt.date(w.start) + (w.partial ? ' (en curso)' : ''), fmt.num(w.count), fmt.num(w.points, 1)]))} />
        <${ChartCard} id="forecast" span split title="Pronóstico de terminación" filename=${'pronostico_' + fileBase + '.svg'}
          subtitle=${relFinished(fc) ? 'Release terminado' : fc && fc.finish ? fpts(fc.remaining, unit) + ' restantes a ' + fpts(fc.velocity, unit) + ' por iteración (' + velName(vb) + ')' : fl ? fpts(fl.perWeek, unit) + ' por semana (flujo de las últimas 6 semanas)' : release ? (fc && fc.velocity === 0 ? 'Velocidad de 0 en las iteraciones cerradas' : 'Sin velocidad ni ritmo de flujo todavía') : null}
          empty=${!release ? 'Selecciona un release para ver su pronóstico.' : !(fc.finish || (fl && fl.finish)) && !D.valid(release.end) ? (fc.total && !fc.remaining ? 'El release está terminado.' : fc.velocity === 0 ? 'La velocidad de las iteraciones cerradas es 0 y el release no tiene fecha de fin: no hay pronóstico.' : 'Sin velocidad ni fecha de fin no hay pronóstico: cierra una iteración o termina elementos del release.') : null}
          legend=${html`<${Legend} items=${[
            fcFin ? { label: relFinished(fc) ? 'Terminación real' : 'Probable', color: C_REM, kind: 'dot' } : null,
            fcFin && !relFinished(fc) && fc.finish && fc.finishBest ? { label: 'Rango optimista–pesimista', color: C_REM, kind: 'sw', opacity: 0.3 } : null,
            release && D.valid(release.end) ? { label: 'Fin planeado', color: 'var(--fg-2)', kind: 'sw' } : null,
            { label: 'Corte', kind: 'cut', color: 'var(--signal)' }]} />`}
          render=${(r) => html`<${ForecastChart} fc=${fc} fl=${fl} release=${release} statusDate=${statusDate} unit=${unit} svgRef=${r} vb=${vb} />`}
          extra=${release && fc ? html`<${ForecastText} release=${release} fc=${fc} fl=${fl} unit=${unit} cal=${cal} vb=${vb} />` : null}
          table=${release && fc ? tbl('Fechas del pronóstico', [{ label: 'Escenario' }, { label: 'Fecha', mono: true }, { label: 'Frente al fin planeado', num: true }, { label: 'Frente a la línea base', num: true }], (relFinished(fc) ? [['Terminación real (último elemento)', fc.finish]] : [
            ['Optimista (velocidad máxima)', fc.finishBest], ['Probable (' + (fc.finish ? velName(vb) : fl && fl.finish ? 'ritmo de flujo' : 'sin velocidad') + ')', fcFin], ['Pesimista (velocidad mínima)', fc.finishWorst],
          ]).map(([k, d]) => [k, fmt.date(d), D.valid(d) && D.valid(release.end) ? sgn(wdDiff(cal, release.end, d)) + wdText(wdDiff(cal, release.end, d)) : '—', D.valid(d) && A.hasBaseline(release) && D.valid(release.baseline.end) ? sgn(wdDiff(cal, release.baseline.end, d)) + wdText(wdDiff(cal, release.baseline.end, d)) : '—'])) : null} />
        <${ChartCard} id="agile-evm" span split title="Valor ganado ágil (AgileEVM)" filename=${'agile-evm_' + fileBase + '.svg'}
          subtitle=${release ? 'Release «' + relName(release) + '» frente al valor ganado del proyecto' : null}
          empty=${!release ? 'Selecciona un release para calcular su valor ganado ágil.' : !(ev.bac > 0) ? 'Define el presupuesto (BAC) y las iteraciones planeadas del release para calcular el AgileEVM.' : null}
          legend=${null}
          render=${(r) => html`<${EvmBars} ev=${ev} currency=${currency} svgRef=${r} />`}
          extra=${release && ev && ev.bac > 0 ? html`<${AgileEvmSection} release=${release} ev=${ev} m=${m} cost=${costInfo} />` : null}
          table=${ev ? tbl('Valor ganado ágil', [{ label: 'Indicador' }, { label: 'Valor', num: true }], [['BAC', fmt.money(ev.bac, currency)], ['PPC', fmt.pct(ev.ppc, 1)], ['APC', fmt.pct(ev.apc, 1)], ['PV', fmt.money(ev.pv, currency)], ['EV', fmt.money(ev.ev, currency)], ['AC', fmt.money(ev.ac, currency)], ['SV', fmt.money(ev.sv, currency)], ['CV', fmt.money(ev.cv, currency)], ['SPI', fmt.idx(ev.spi)], ['CPI', fmt.idx(ev.cpi)], ['EAC', fmt.money(ev.eac, currency)], ['VAC', fmt.money(ev.vac, currency)]]) : null} />
      </div>
    </div>`;
  }

  function ForecastText({ release, fc, fl, unit, cal, vb }) {
    const done = relFinished(fc);
    const fin = done ? fc.finish : fc.finish || (fl && fl.finish);
    if (!fin) {
      return html`<${Callout} tone="info" role="forecast-none" title=${done ? 'Release terminado' : 'Aún no hay pronóstico'}>
        <span>${done ? 'Todos los elementos del release están terminados.' : !fc.total ? 'El release no tiene elementos estimados: asígnalos y estímalos en el backlog para pronosticar su terminación.' : noForecastText(fc, true)}</span>
      </${Callout}>`;
    }
    const late = D.valid(release.end) ? wdDiff(cal, release.end, fin) : null;
    const bl = A.hasBaseline(release) && D.valid(release.baseline.end) ? wdDiff(cal, release.baseline.end, fin) : null;
    const tone = late === null ? 'info' : late > 5 ? 'crit' : late > 0 ? 'warn' : 'good';
    const vsPlan = late === null ? 'El release no tiene fecha de fin para comparar.' : late === 0 ? 'Coincide con el fin planeado.' : late > 0 ? wdText(late) + ' después del fin planeado (' + fmt.date(release.end) + ').' : wdText(late) + ' antes del fin planeado (' + fmt.date(release.end) + ').';
    const vsBl = bl === null ? '' : bl === 0 ? ' Coincide con la línea base.' : ' ' + sgn(bl) + wdText(bl) + ' frente a la línea base (' + fmt.date(release.baseline.end) + ').';
    return html`<${Callout} tone=${tone} role="forecast-text">
      <span>${done ? 'El release está terminado: el último elemento se terminó el ' + fmt.date(fin, 'long') + '. ' : fc.finish ? 'Con la ' + velName(vb) + ' (' + fpts(fc.velocity, unit) + ', promedio de ' + velWhere(vb) + ') faltan ' + fc.sprintsNeeded + (fc.sprintsNeeded === 1 ? ' iteración' : ' iteraciones') + ': terminaría el ' + fmt.date(fin, 'long') + (fc.finishBest && fc.finishWorst && fc.finishBest !== fc.finishWorst ? ' (entre el ' + fmt.date(fc.finishBest) + ' y el ' + fmt.date(fc.finishWorst) + ')' : '') + '. ' : 'Al ritmo de ' + fpts(fl.perWeek, unit) + ' por semana terminaría el ' + fmt.date(fin, 'long') + '. '}${vsPlan}${vsBl}</span>
    </${Callout}>`;
  }

  /* ---------------------------------------------------------------- registro de vistas */
  PM.registerView({ id: 'iteraciones', label: 'Releases e iteraciones', group: 'agil', icon: 'sprint', order: 30, needsProject: true, component: IterationsView, when: PM.agile.when, unavailable: PM.AgileUnavailable,
    description: 'Releases con línea base y control de cambios, iteraciones con capacidad y velocidad, inicio y cierre, y documentos de la iteración (§9.4).' });
  PM.registerView({ id: 'metricas-agiles', label: 'Métricas ágiles', group: 'agil', icon: 'burndown', order: 40, needsProject: true, component: MetricsView, when: PM.agile.when, unavailable: PM.AgileUnavailable,
    description: 'Burndown, burnup, velocidad, flujo acumulado, pronóstico, valor ganado ágil y tiempo de ciclo (§9.4).' });
})();

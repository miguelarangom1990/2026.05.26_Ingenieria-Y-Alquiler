/* ==========================================================================
   80-dashboard.js — vistas "tablero" (resumen del proyecto: desempeño, curva
   S, hitos, riesgos, incidentes, cambios, documentación y ruta sugerida),
   "lineas-base" (establecer, comparar y eliminar líneas base del alcance,
   cronograma y costos) y "ficha" (metadatos, fecha de corte, calendario,
   almacenamiento, respaldo y eliminación del proyecto).
   Recursos (SPEC §10.4): alerta de recursos no planificados (cantidad, costo
   estimado, sin motivo o sin la solicitud de cambio que requieren) con enlace
   al catálogo; en la ruta sugerida, paso «Catálogo de recursos» (9.2) y, si
   aplica, «Estructuras de desglose revisadas» (opcional: no cuenta en el avance).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const D = PM.date;
  const fmt = PM.fmt;
  const num = PM.num;
  const cx = PM.cx;

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.dashboard-tile { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; min-width: 0; }
.dashboard-tile .stat-value { overflow-wrap: anywhere; }
.dashboard-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.dashboard-pair-k { font-size: var(--fs-xs); color: var(--fg-2); font-weight: 600; font-family: var(--font-mono); letter-spacing: 0.02em; }
.dashboard-tile-foot { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line); font-size: var(--fs-xs); color: var(--fg-2); display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.dashboard-tile-foot strong { font-family: var(--font-display); font-size: var(--fs-lg); color: var(--fg); font-weight: 700; }
.dashboard-net { display: flex; gap: 6px; align-items: flex-start; }
.dashboard-net strong { color: var(--fg); font-weight: 600; }
.dashboard-fc-chip { background: var(--surface); border: 1px dashed var(--signal); color: var(--signal-ink); font-weight: 600; }
.dashboard-fc-chip .dashboard-fc-key { margin-top: 0; }
.dashboard-fc-key { flex: none; width: 14px; height: 8px; border-radius: 2px; border: 1px dashed var(--signal); background: repeating-linear-gradient(135deg, var(--signal) 0 1px, transparent 1px 4px); margin-top: 4px; }
.dashboard-link { border: 0; background: none; padding: 0; color: var(--accent); font: inherit; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; text-align: left; }
.dashboard-link:hover { text-decoration: underline; }
.dashboard-meter { position: relative; height: 8px; border-radius: 4px; background: var(--surface-3); margin-top: 6px; }
.dashboard-meter-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; }
.dashboard-meter-plan { position: absolute; top: -4px; bottom: -4px; width: 2px; border-radius: 1px; background: var(--fg); box-shadow: 0 0 0 1px var(--surface); }
.dashboard-meter-legend { display: flex; gap: 12px; font-size: 0.6875rem; color: var(--fg-3); }
.dashboard-meter-legend span { display: inline-flex; align-items: center; gap: 5px; }
.dashboard-key-fill { width: 10px; height: 6px; border-radius: 2px; display: inline-block; }
.dashboard-key-plan { width: 2px; height: 10px; border-radius: 1px; display: inline-block; background: var(--fg); }
.dashboard-two { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 16px; align-items: start; }
@media (max-width: 1100px) { .dashboard-two { grid-template-columns: minmax(0, 1fr); } }
.dashboard-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.dashboard-panel-head .h3 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dashboard-panel-title { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dashboard-panel-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-left: auto; }
.dashboard-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.dashboard-li { display: flex; gap: 10px; align-items: flex-start; padding: 9px 16px; border-bottom: 1px solid var(--line); min-width: 0; }
.dashboard-li:last-child { border-bottom: 0; }
.dashboard-li-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dashboard-li-title { font-size: var(--fs-sm); font-weight: 500; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dashboard-li .code-tag { margin-top: 2px; }
.dashboard-li > .chip { margin-top: 1px; }
.dashboard-ms { flex: none; margin-top: 1px; }
.dashboard-more { padding: 8px 16px 12px; }
.dashboard-blank { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px; color: var(--fg-2); font-size: var(--fs-sm); }
.dashboard-blank-center { align-items: center; text-align: center; padding: 28px 16px; }
.dashboard-blank-center .icon { color: var(--fg-3); }
.dashboard-scurve { min-height: 220px; }
.dashboard-scurve .dashboard-hit { cursor: crosshair; }
.dashboard-legend-v { font-family: var(--font-mono); color: var(--fg); }
.dashboard-tip-row { display: flex; align-items: center; gap: 6px; }
.dashboard-tip-row span:nth-child(2) { flex: 1; }
.dashboard-docgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }
@media (max-width: 1280px) { .dashboard-docgrid { grid-template-columns: minmax(0, 1fr); } }
.dashboard-docrow { display: grid; grid-template-columns: 148px minmax(40px, 1fr) 42px; align-items: center; gap: 10px; width: 100%; padding: 4px 6px; border: 0; background: transparent; border-radius: var(--r-sm); cursor: pointer; text-align: left; color: var(--fg); font-size: var(--fs-sm); }
.dashboard-docrow:hover { background: var(--surface-2); }
.dashboard-docrow-label { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dashboard-docrow-count { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg-2); text-align: right; }
.dashboard-bar { display: flex; gap: 2px; height: 12px; min-width: 0; }
.dashboard-bar > span { flex-basis: 0; min-width: 4px; height: 100%; }
.dashboard-bar > span:first-child { border-top-left-radius: 3px; border-bottom-left-radius: 3px; }
.dashboard-bar > span:last-child { border-top-right-radius: 3px; border-bottom-right-radius: 3px; }
.dashboard-bar.is-empty { border: 1px dashed var(--line-strong); border-radius: 3px; }
.dashboard-swatch-none { background: var(--surface-3); box-shadow: inset 0 0 0 1px var(--line-strong); }
.dashboard-route.is-prominent { border-color: var(--accent); box-shadow: inset 0 3px 0 var(--accent), var(--shadow-card); }
.dashboard-route-meter { width: 140px; }
.dashboard-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 8px; }
.dashboard-step { display: flex; gap: 10px; align-items: flex-start; width: 100%; height: 100%; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); cursor: pointer; color: var(--fg); min-width: 0; }
.dashboard-step:hover { border-color: var(--line-strong); background: var(--surface-2); }
.dashboard-step[data-next="true"] { border-color: var(--accent); background: var(--accent-wash); }
.dashboard-step-num { width: 24px; height: 24px; border-radius: 50%; flex: none; display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: var(--fs-xs); font-weight: 600; border: 1.5px solid var(--line-strong); color: var(--fg-2); background: var(--surface); }
.dashboard-step[data-state="done"] .dashboard-step-num { background: var(--good); border-color: var(--good); color: var(--surface); }
.dashboard-step[data-state="partial"] .dashboard-step-num { border-color: var(--warn); color: var(--warn); }
.dashboard-step[data-next="true"] .dashboard-step-num { border-color: var(--accent); color: var(--accent); }
.dashboard-step-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dashboard-step-title { font-weight: 600; font-size: var(--fs-sm); }
.dashboard-step-desc { font-size: var(--fs-xs); color: var(--fg-2); line-height: 1.4; }
.dashboard-step-note { font-size: var(--fs-xs); line-height: 1.4; color: var(--fg); background: var(--warn-wash); border-radius: var(--r-sm); padding: 4px 6px; }
.dashboard-phase-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.dashboard-status-hint { align-items: center; flex-wrap: wrap; }
.dashboard-status-hint > .icon { margin-top: 0; }
.dashboard-status-hint-main { flex: 1 1 260px; min-width: 0; color: var(--fg); }
.dashboard-status-hint-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.dashboard-tb { grid-auto-flow: row dense; overflow: hidden; }
.dashboard-tb > div { margin: 0 -1px -1px 0; }
.dashboard-sd { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dashboard-sd .input { width: auto; min-width: 0; min-height: 26px; padding: 2px 6px; font-size: var(--fs-xs); font-family: var(--font-mono); }
.dashboard-sd-hint { font-size: 0.6875rem; color: var(--fg-3); font-family: var(--font-body); }
.dashboard-note { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: var(--r-md); font-size: var(--fs-sm); background: var(--surface-2); color: var(--fg-2); border: 1px solid var(--line); }
.dashboard-note > .icon { margin-top: 2px; color: var(--info); }
.dashboard-note.warn { background: var(--warn-wash); color: var(--fg); border-color: transparent; }
.dashboard-note.warn > .icon { color: var(--warn); }
.dashboard-note ul { margin: 4px 0 0; padding-left: 18px; }
.dashboard-late { color: var(--crit); font-weight: 600; }
.dashboard-early { color: var(--good); font-weight: 600; }
.dashboard-row-sel td { background: var(--surface-2); }
.dashboard-row-sel td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
.dashboard-row-removed td { color: var(--fg-3); }
.dashboard-compare-table td:first-child, .dashboard-compare-table th:first-child { position: sticky; left: 0; z-index: 2; min-width: 200px; box-shadow: inset -1px 0 0 var(--line); }
.dashboard-compare-table td:first-child { background: var(--surface); }
.dashboard-compare-table th:first-child { z-index: 3; }
@media (max-width: 680px) { .dashboard-compare-table td:first-child, .dashboard-compare-table th:first-child { min-width: 150px; max-width: 180px; } }
.dashboard-row-removed td:first-child { text-decoration: line-through; }
.dashboard-preview { border: 1px solid var(--line); border-radius: var(--r-md); display: flex; flex-direction: column; }
.dashboard-preview > div { padding: 10px 12px; border-bottom: 1px solid var(--line); display: flex; gap: 10px; align-items: flex-start; }
.dashboard-preview > div:last-child { border-bottom: 0; }
.dashboard-preview > div[data-off="true"] { opacity: 0.5; }
.dashboard-preview .icon { margin-top: 2px; flex: none; }
.dashboard-fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.dashboard-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
.dashboard-summary > div { padding: 10px 12px; margin: 0 -1px -1px 0; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dashboard-summary-v { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl); line-height: 1.2; }
.dashboard-summary-s { font-size: var(--fs-xs); color: var(--fg-3); }
.dashboard-active { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dashboard-active > div { padding: 14px 16px; border-right: 1px solid var(--line); display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dashboard-active > div:last-child { border-right: 0; }
@media (max-width: 760px) { .dashboard-active { grid-template-columns: minmax(0, 1fr); } .dashboard-active > div { border-right: 0; border-bottom: 1px solid var(--line); } .dashboard-active > div:last-child { border-bottom: 0; } }
.dashboard-dl { display: grid; grid-template-columns: minmax(110px, max-content) minmax(0, 1fr); gap: 8px 16px; margin: 0; font-size: var(--fs-sm); }
.dashboard-dl dt { color: var(--fg-2); }
.dashboard-dl dd { margin: 0; overflow-wrap: anywhere; min-width: 0; }
@media (max-width: 480px) { .dashboard-dl { grid-template-columns: minmax(0, 1fr); gap: 2px; } .dashboard-dl dd { margin-bottom: 8px; } }
.dashboard-dl.is-stacked { grid-template-columns: minmax(0, 1fr); gap: 1px; }
.dashboard-dl.is-stacked dt { font-size: var(--fs-xs); color: var(--fg-3); }
.dashboard-dl.is-stacked dd { margin-bottom: 9px; }
.dashboard-dl.is-stacked dd:last-child { margin-bottom: 0; }
.dashboard-danger { border-color: var(--crit); }
.dashboard-danger .dashboard-panel-head .h3 { color: var(--crit); }
.dashboard-danger-row { display: flex; gap: 10px 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.dashboard-danger-row:last-child { border-bottom: 0; }
.dashboard-danger-row > div { flex: 1 1 200px; min-width: 0; }
.dashboard-scope-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); }
.dashboard-scope-list li { display: flex; gap: 8px; align-items: baseline; min-width: 0; overflow-wrap: anywhere; }
.dashboard-agile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); overflow: hidden; border-radius: 0 0 var(--r-lg) var(--r-lg); }
.dashboard-agile-sec { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; min-width: 0; box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.dashboard-agile-sec > h4 { margin: 0; }
.dashboard-agile-big { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl); line-height: 1.2; color: var(--fg); overflow-wrap: anywhere; }
.dashboard-agile-big small { font-family: var(--font-body); font-size: var(--fs-sm); font-weight: 500; color: var(--fg-2); }
.dashboard-agile-goal { font-size: var(--fs-sm); color: var(--fg); line-height: 1.4; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.dashboard-burn { min-height: 0; }
.dashboard-burn svg { display: block; }
.dashboard-key-dash { width: 16px; height: 2px; display: inline-block; background: repeating-linear-gradient(90deg, var(--fg-3) 0 4px, transparent 4px 7px); }
.dashboard-alerts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dashboard-alert { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-sm); line-height: 1.4; color: var(--fg); min-width: 0; overflow-wrap: anywhere; }
.dashboard-alert > .icon { flex: none; margin-top: 2px; }
.dashboard-alert[data-tone="crit"] > .icon { color: var(--crit); }
.dashboard-alert[data-tone="warn"] > .icon { color: var(--warn); }
.dashboard-alert[data-tone="good"] > .icon { color: var(--good); }
.dashboard-agile-kv { display: flex; gap: 6px 14px; flex-wrap: wrap; align-items: baseline; font-size: var(--fs-xs); color: var(--fg-2); }
.dashboard-agile-kv strong { font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--fg); }
.dashboard-commit { display: inline-flex; gap: 6px; align-items: flex-start; min-width: 0; }
.dashboard-commit > .icon { flex: none; margin-top: 1px; color: var(--warn); }
.dashboard-commit.is-over { color: var(--fg); }
.dashboard-mode-chip { margin-left: 2px; }
.dashboard-step-body .chip { white-space: normal; text-align: left; }
.dashboard-step[data-optional="true"] { border-style: dashed; }
.dashboard-step[data-optional="true"] .dashboard-step-num { border-style: dashed; }
.dashboard-step[data-optional="true"][data-state="done"] .dashboard-step-num { border-style: solid; }
.dashboard-res .dashboard-alerts { padding: 12px 16px 14px; }
.dashboard-res-actions { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 0 16px 14px; }
`;
  if (!document.getElementById('css-dashboard')) {
    const s = document.createElement('style'); s.id = 'css-dashboard'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- constantes */
  const AREAS = [
    { id: 'integracion', n: 4, label: 'Integración' },
    { id: 'alcance', n: 5, label: 'Alcance' },
    { id: 'cronograma', n: 6, label: 'Cronograma' },
    { id: 'costos', n: 7, label: 'Costos' },
    { id: 'calidad', n: 8, label: 'Calidad' },
    { id: 'recursos', n: 9, label: 'Recursos' },
    { id: 'comunicaciones', n: 10, label: 'Comunicaciones' },
    { id: 'riesgos', n: 11, label: 'Riesgos' },
    { id: 'adquisiciones', n: 12, label: 'Adquisiciones' },
    { id: 'interesados', n: 13, label: 'Interesados' },
  ];
  const GROUPS = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'planificacion', label: 'Planificación' },
    { id: 'ejecucion', label: 'Ejecución' },
    { id: 'monitoreo', label: 'Monitoreo y Control' },
    { id: 'cierre', label: 'Cierre' },
  ];
  const PARTS = [
    { id: 'scope', label: 'Alcance', long: 'Línea base del alcance', hint: 'EDT, diccionario y enunciado del alcance' },
    { id: 'schedule', label: 'Cronograma', long: 'Línea base del cronograma', hint: 'Fechas de inicio y fin de actividades e hitos' },
    { id: 'cost', label: 'Costos', long: 'Línea base de costos', hint: 'Presupuesto por actividad (BAC) y reservas' },
  ];
  const META_KEYS = ['name', 'code', 'client', 'sponsor', 'manager', 'start', 'end', 'budget', 'currency', 'status', 'lifecycle', 'description', 'location'];
  const WORKWEEK = { 5: 'Lunes a viernes', 6: 'Lunes a sábado', 7: 'Todos los días' };
  const PRIORITY = { alta: 0, media: 1, baja: 2 };

  /* ---------------------------------------------------------------- utilidades */
  const openDoc = (tid) => { if (typeof PM.openDocument === 'function') PM.openDocument(tid); else PM.navigate('documentos'); };
  const go = (view, params) => PM.navigate(view, params || {});
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const idx = (v) => (isNum(v) ? fmt.idx(v) : '—');
  const money = (v, cur) => (isNum(v) ? fmt.money(v, cur) : '—');
  const moneyShort = (v, cur) => (isNum(v) ? fmt.moneyShort(v, cur) : '—');
  const signedMoney = (v, cur) => (!isNum(v) ? '—' : (v > 0 ? '+' : '') + fmt.moneyShort(v, cur));
  const signedNum = (n) => (!isNum(n) ? '—' : n > 0 ? '+' + fmt.num(n) : n < 0 ? '−' + fmt.num(Math.abs(n)) : '0');
  const wdUnit = (n) => (Math.abs(n) === 1 ? 'día hábil' : 'días hábiles');
  /* diferencia con signo en días hábiles de a hasta b (positivo: b es posterior) */
  const wdDiff = (cal, a, b) => (D.valid(a) && D.valid(b) ? cal.indexOf(b) - cal.indexOf(a) : null);
  const lateTone = (v) => (!isNum(v) ? null : v > 5 ? 'crit' : v > 0 ? 'warn' : 'good');
  /* Variación en palabras, con la misma redacción del cronograma (40-schedule): «3 días hábiles de atraso frente a LB1». */
  const varPhrase = (v, vs) => (!isNum(v) ? '' : v === 0 ? 'sin variación ' + vs : fmt.num(Math.abs(v)) + ' ' + wdUnit(v) + (v > 0 ? ' de atraso ' : ' de adelanto ') + vs);
  /* Referencia de la variación del fin, la misma del cronograma: el fin de la línea base del cronograma vigente o,
     sin ella, el fin planificado (red según lo programado). */
  function finishRef(model) {
    const bl = model.baselines.schedule;
    const f = bl && bl.schedule && D.valid(bl.schedule.finish) ? bl.schedule.finish : null;
    return f ? { date: f, label: 'Fin ' + (bl.label || 'línea base'), vs: 'frente a ' + (bl.label || 'la línea base') } : { date: model.sched.finish, label: 'Fin planificado', vs: 'frente al fin planificado' };
  }
  /* Red actualizada a la fecha de corte (6.6, PM.useProjectModel().forecast); si el modelo no la trae, la planificada. */
  const forecastOf = (model) => (model.forecast && Array.isArray(model.forecast.tasks) && model.forecast.byId ? model.forecast : model.sched);
  const toneVar = (t) => (t === 'good' ? 'var(--good)' : t === 'warn' ? 'var(--warn)' : t === 'crit' ? 'var(--crit)' : 'var(--accent)');
  const toneStyle = (t) => (t === 'good' || t === 'warn' || t === 'crit' ? 'color:' + toneVar(t) : '');
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  /* corta en palabra completa (si la hay en la segunda mitad) y cierra con «…» sin signos sueltos al final */
  const truncWords = (s, n) => {
    s = String(s || '').trim();
    if (s.length <= n) return s;
    let cut = s.slice(0, n - 1);
    const sp = cut.lastIndexOf(' ');
    if (sp > n / 2) cut = cut.slice(0, sp);
    return cut.replace(/[\s,;:.\-–—(]+$/, '') + '…';
  };
  /* cierra una frase con punto, salvo que ya termine en «…», punto, signo de cierre de interrogación o exclamación */
  const endSentence = (s) => (/[….!?]$/.test(s) ? s : s + '.');
  const riskScoreOf = (r) => PM.calc.riskScore(r.probabilidad, r.impacto) || num(r.puntuacion);
  const hasContent = (r) => !!(r && (String(r.descripcion || '').trim() || String(r.id || '').trim()));
  const VarText = ({ v }) => html`<span class=${!isNum(v) || v === 0 ? 'faint' : v > 0 ? 'dashboard-late' : 'dashboard-early'}>${signedNum(v)}</span>`;
  const workweekOf = (settings) => ([5, 6, 7].includes(Number(settings && settings.workweek)) ? Number(settings.workweek) : 5);
  /* Lectura de los índices con la misma banda que la vista de valor ganado (50-evm.js): de 0,98 a 1,02 es «al día» o
     «dentro del presupuesto»; el color lo da PM.calc.indexTone (≥ 0,98 bien), así la palabra y el tono no se contradicen. */
  const IDX_LOW = 0.98, IDX_HIGH = 1.02;
  const spiText = (v) => (v > IDX_HIGH ? 'Adelantado' : v >= IDX_LOW ? 'Al día' : 'Atrasado');
  const cpiText = (v) => (v > IDX_HIGH ? 'Por debajo del presupuesto' : v >= IDX_LOW ? 'Dentro del presupuesto' : 'Por encima del presupuesto');
  /* Riesgo abierto: el mismo criterio de la matriz de probabilidad e impacto (70-matrices.js); un riesgo «Materializado»
     ya pasó al registro de incidentes. */
  const isOpenRisk = (r) => !['cerrado', 'materializado'].includes(norm(r.estado));
  const isOpenIncident = (r) => !['resuelto', 'cerrado'].includes(norm(r.estado));
  /* Desplazamiento suave salvo que el sistema pida reducir el movimiento. */
  const scrollBehavior = () => { try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; } catch (e) { return 'auto'; } };
  const calendarText = (cal) => (WORKWEEK[cal.settings.workweek] || 'Lunes a viernes').toLowerCase() + (cal.settings.holidaysCO ? ', descontando festivos de Colombia' : ', sin descontar festivos');

  function useWidth(ref, fallback) {
    const [w, setW] = useState(fallback);
    useLayoutEffect(() => {
      const el = ref.current; if (!el) return undefined;
      let raf = 0;
      const update = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const cw = Math.floor(el.clientWidth); if (cw > 0) setW(cw); }); };
      const first = Math.floor(el.clientWidth); if (first > 0) setW(first);
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', update); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', update); }; }
      const ro = new ResizeObserver(update); ro.observe(el);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);
    return w;
  }

  function Panel({ title, subtitle, count, countTone, actions, children, class: cls, ...rest }) {
    return html`<section class=${cx('card dashboard-panel', cls)} ...${rest}>
      <div class="dashboard-panel-head">
        <div class="dashboard-panel-title">
          <h3 class="h3">${title}${count !== undefined && count !== null ? html`<span class=${cx('chip', countTone && 'chip-' + countTone)} data-count>${count}</span>` : null}</h3>
          ${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}
        </div>
        ${actions ? html`<div class="dashboard-panel-actions">${actions}</div>` : null}
      </div>
      ${children}
    </section>`;
  }
  const LinkBtn = ({ label, onClick, icon = 'arrow-right' }) => html`<button type="button" class="dashboard-link" onClick=${onClick}>${label}<${ui.Icon} name=${icon} size=${13} /></button>`;
  const ViewBtn = ({ label, view, params }) => html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => go(view, params)}>${label}</${ui.Button}>`;

  /* ---------------------------------------------------------------- fecha de corte */
  function StatusDateControl({ project, compact }) {
    const canWrite = PM.useCanWrite();
    const saved = D.valid(project.statusDate) ? project.statusDate : '';
    const effective = PM.statusDateOf(project);
    const [draft, setDraft] = useState(effective);
    const timer = useRef();
    const pending = useRef(null);
    useEffect(() => { setDraft(effective); if (pending.current === saved) pending.current = null; }, [effective, saved]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const today = D.today();
    const commit = (v) => {
      clearTimeout(timer.current);
      const y = D.valid(v) ? +v.slice(0, 4) : 0;
      /* fecha vacía o fuera de rango: se restablece la vigente sin guardar */
      if (!D.valid(v) || y < 1990 || y > 2100) { setDraft(effective); return; }
      if (v === saved || v === pending.current) return;
      pending.current = v;
      PM.projectOps.update(project.id, { statusDate: v }).then(() => { if (!compact) PM.toast('Fecha de corte: ' + fmt.date(v, 'long') + '.'); }, () => { pending.current = null; setDraft(effective); });
    };
    if (!canWrite) return html`<span class="mono">${fmt.date(effective)}${saved ? '' : html` <span class="dashboard-sd-hint">(hoy, sin fijar)</span>`}</span>`;
    return html`<div class="dashboard-sd">
      <input type="date" class="input" aria-label="Fecha de corte" value=${draft}
        onInput=${(e) => { const v = e.currentTarget.value; setDraft(v); clearTimeout(timer.current); if (D.valid(v)) timer.current = setTimeout(() => commit(v), 700); }}
        onBlur=${(e) => commit(e.currentTarget.value)}
        onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }} />
      <${ui.Button} size="sm" onClick=${() => { setDraft(today); commit(today); }} disabled=${saved === today} title="Fija la fecha de corte en la fecha de hoy">Usar hoy</${ui.Button}>
      ${!saved ? html`<span class="dashboard-sd-hint">Sin fijar: se usa la fecha de hoy.</span>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- tablero: cajetín */
  function TitleBlock({ project: p }) {
    const cell = (k, v, span) => html`<div class=${span || ''}><span class="tb-k">${k}</span><span class="tb-v">${v || html`<span class="faint">—</span>`}</span></div>`;
    return html`<div class="title-block dashboard-tb" role="group" aria-label="Datos del proyecto">
      ${cell('Código', p.code)}
      ${cell('Cliente', p.client, 'span-2')}
      ${cell('Director del proyecto', p.manager)}
      ${cell('Patrocinador', p.sponsor, 'span-2')}
      ${cell('Estado', p.status ? html`<${ui.Chip} tone=${PM.statusTone(p.status)}>${p.status}</${ui.Chip}>` : null)}
      ${cell('Ciclo de vida', p.lifecycle)}
      ${cell('Inicio', D.valid(p.start) ? fmt.date(p.start) : null)}
      ${cell('Fin previsto', D.valid(p.end) ? fmt.date(p.end) : null)}
      <div class="span-2"><span class="tb-k">Fecha de corte</span><div class="tb-v"><${StatusDateControl} project=${p} compact /></div></div>
    </div>`;
  }

  /* ---------------------------------------------------------------- tablero: indicadores */
  function Tile({ label, value, tone, sub, sub2, sub3, children, action, title, kpi, foot, source }) {
    return html`<div class="card dashboard-tile" data-kpi=${kpi}>
      <div class="stat-label">${label}</div>
      ${value !== undefined ? html`<div class="stat-value" style=${toneStyle(tone)} title=${title} data-source=${source}>${value}</div>` : null}
      ${children}
      ${sub ? html`<div class="stat-sub">${sub}</div>` : null}
      ${sub2 ? html`<div class="stat-sub">${sub2}</div>` : null}
      ${sub3 || null}
      ${action ? html`<div><${LinkBtn} label=${action[0]} onClick=${() => go(action[1])} /></div>` : null}
      ${foot || null}
    </div>`;
  }
  function PlanMeter({ actual, planned, tone }) {
    const a = PM.clamp(num(actual), 0, 1), p = PM.clamp(num(planned), 0, 1);
    return html`<div class="stack-sm" style="gap:5px">
      <div class="dashboard-meter" role="img" aria-label=${'Avance real ' + fmt.pct(a, 1) + ' frente a ' + fmt.pct(p, 1) + ' planificado'}>
        <span class="dashboard-meter-fill" style=${'width:' + (a * 100).toFixed(2) + '%;background:' + toneVar(tone)}></span>
        <span class="dashboard-meter-plan" style=${'left:calc(' + (p * 100).toFixed(2) + '% - 1px)'}></span>
      </div>
      <div class="dashboard-meter-legend"><span><i class="dashboard-key-fill" style=${'background:' + toneVar(tone)}></i>Real</span><span><i class="dashboard-key-plan"></i>Planificado</span></div>
    </div>`;
  }

  /* Avance físico a la fecha de corte: EV/BAC frente a PV/BAC si las actividades tienen costo; si no, ponderado por duración. */
  function physicalProgress(model) {
    const { sched, evm, statusDate } = model;
    if (evm.bac > 0) return { actual: evm.pctComplete, planned: evm.pctPlanned, weighted: false };
    const work = sched.tasks.filter((t) => !t.milestone);
    const wsum = PM.sum(work, (t) => t.duration);
    const actual = wsum ? PM.sum(work, (t) => (t.duration * t.progress) / 100) / wsum : 0;
    const planned = wsum ? PM.sum(work, (t) => t.duration * PM.calc.plannedFraction(sched.cal, t.startDate, t.finishDate, false, statusDate)) / wsum : 0;
    return { actual, planned, weighted: true };
  }

  function KpiRow({ model }) {
    const { sched, evm, currency, statusDate } = model;
    const cal = sched.cal;
    const hasTasks = sched.tasks.length > 0;
    const work = sched.tasks.filter((t) => !t.milestone);
    const bac = evm.bac;
    const spiTone = PM.calc.indexTone(evm.spi);
    const cpiTone = PM.calc.indexTone(evm.cpi);

    /* 1. avance físico */
    let av;
    if (!hasTasks) av = { value: '—', sub: 'El cronograma aún no tiene actividades.', action: ['Crear cronograma', 'cronograma'] };
    else {
      const pp = physicalProgress(model);
      if (!pp.weighted) av = { value: fmt.pct(pp.actual, 1), actual: pp.actual, planned: pp.planned, tone: spiTone, sub: 'Planificado ' + fmt.pct(pp.planned, 1) + ' al ' + fmt.date(statusDate, 'dm') + ' · EV/BAC frente a PV/BAC' };
      else {
        const tone = pp.planned > 0 ? PM.calc.indexTone(pp.actual / pp.planned) : null;
        av = { value: fmt.pct(pp.actual, 1), actual: pp.actual, planned: pp.planned, tone, sub: 'Ponderado por duración (planificado ' + fmt.pct(pp.planned, 1) + '): las actividades aún no tienen costo.', action: ['Asignar costos', 'cronograma'] };
      }
    }

    /* 2. índices */
    const spiWord = evm.spi === null ? 'Sin valor planificado a la fecha' : spiText(evm.spi);
    const cpiWord = evm.cpi === null ? 'Sin costos reales' : cpiText(evm.cpi);
    const idxAction = !hasTasks ? null : !(bac > 0) ? ['Asignar costos a las actividades', 'cronograma'] : !(evm.ac > 0) ? ['Registrar costos reales', 'valor-ganado'] : null;

    /* 3. EAC */
    let eac;
    if (!(bac > 0)) eac = { label: 'Estimación a la conclusión (EAC)', value: '—', sub: 'Sin presupuesto por actividad: el BAC es cero.', action: hasTasks ? ['Asignar costos', 'cronograma'] : ['Crear cronograma', 'cronograma'] };
    else if (evm.eac === null && evm.ac > 0) eac = { label: 'Presupuesto hasta la conclusión (BAC)', value: moneyShort(bac, currency), title: money(bac, currency), sub: 'Hay ' + moneyShort(evm.ac, currency) + ' de costos reales pero ningún avance registrado (EV = 0): el EAC se calcula cuando las actividades reporten avance.', action: ['Registrar avance', 'cronograma'] };
    else if (evm.eac === null) eac = { label: 'Presupuesto hasta la conclusión (BAC)', value: moneyShort(bac, currency), title: money(bac, currency), sub: 'El EAC se calcula cuando haya costos reales registrados.', action: ['Registrar costos reales', 'valor-ganado'] };
    else {
      const vac = evm.vac;
      eac = { label: 'Estimación a la conclusión (EAC)', value: moneyShort(evm.eac, currency), title: money(evm.eac, currency), tone: vac >= 0 ? 'good' : -vac / bac <= 0.05 ? 'warn' : 'crit', sub: 'BAC ' + moneyShort(bac, currency) + ' · VAC ' + signedMoney(vac, currency) + (vac < 0 ? ' (sobrecosto previsto)' : vac > 0 ? ' (ahorro previsto)' : ''), sub2: 'EAC = BAC / CPI' };
    }

    /* 4. fin pronosticado. La cifra principal es la de la red actualizada a la fecha de corte (6.6: ruta crítica con lo
       pendiente reprogramado desde el corte), la misma «Fin pronosticado al corte» del cronograma, los hitos y los
       informes; nunca el fin planificado vencido. El cronograma ganado (IEAC(t) = PD / SPI(t)) va como contraste: pondera
       el avance por costo, así que una compra grande ejecutada al inicio puede ocultar el atraso de la ruta crítica (o un
       atraso fuera de ella adelantarlo). Solo si el modelo no trae la red actualizada manda el cronograma ganado.
       Las variaciones se miden en días hábiles frente a la misma referencia del cronograma. */
    let fin;
    if (!hasTasks) fin = { value: '—', sub: 'Sin cronograma para pronosticar el fin.', action: ['Crear cronograma', 'cronograma'] };
    else {
      const hasNet = !!(model.forecast && D.valid(model.forecast.finish));
      const forecast = forecastOf(model);
      const ref = finishRef(model);
      const net = D.valid(forecast.finish) ? forecast.finish : sched.finish;
      const es = D.valid(evm.forecastFinish) ? evm.forecastFinish : null;
      const fc = hasNet || !es ? net : es;
      const fromNet = fc === net;
      const v = wdDiff(cal, ref.date, fc);
      const vEs = es ? wdDiff(cal, ref.date, es) : null;
      /* diferencia entre los dos pronósticos (positiva: el cronograma ganado termina después de la cifra principal) */
      const gap = es && fromNet ? wdDiff(cal, fc, es) : 0;
      const remaining = statusDate >= fc ? 0 : cal.countWork(D.max(D.add(statusDate, 1), sched.start), fc);
      /* el fin planificado ya pasó con trabajo pendiente: el cronograma necesita actualizarse */
      const overdue = sched.finish < statusDate && work.some((t) => t.progress < 100);
      let tone = lateTone(v);
      if (tone === 'good' && vEs > 0) tone = 'warn';
      const netText = 'Red actualizada al corte (' + fmt.date(statusDate, 'dm') + '): ruta crítica con lo pendiente reprogramado desde el corte.';
      const esLabel = 'Por cronograma ganado (SPI(t) ' + idx(evm.spiT) + ')';
      const esTitle = 'IEAC(t) = PD / SPI(t): pondera el avance por costo y no sigue la ruta crítica. Es un contraste del pronóstico de la red actualizada a la fecha de corte.';
      fin = {
        value: fmt.date(fc), tone, title: fmt.date(fc, 'long') + (fromNet ? ' · red actualizada a la fecha de corte' : ' · por cronograma ganado'), source: fromNet ? 'red' : 'cronograma-ganado',
        sub: ref.label + ': ' + fmt.date(ref.date) + ' · ' + (v === 0 ? 'sin variación' : fmt.num(Math.abs(v)) + ' ' + wdUnit(v) + (v > 0 ? ' de atraso' : ' de adelanto')),
        sub2: fromNet ? netText + (overdue ? ' El fin planificado (' + fmt.date(sched.finish) + ') ya pasó con actividades sin terminar: actualiza el avance o reprograma lo pendiente.' : es ? '' : ' Sin valor ganado (costos por actividad y avance) no hay pronóstico por cronograma ganado.')
          : esLabel + '. La red actualizada a la fecha de corte no está disponible.',
        sub3: es && fromNet ? html`<div class="stat-sub dashboard-net" data-earned=${es} title=${esTitle}><span>${esLabel}: <strong>${fmt.date(es)}</strong> · ${varPhrase(vEs, ref.vs)}${Math.abs(gap) >= 10 ? '. Difiere ' + fmt.num(Math.abs(gap)) + ' ' + wdUnit(gap) + ': pondera el avance por costo, no la ruta crítica.' : ''}</span></div>` : null,
        action: overdue ? ['Actualizar el cronograma', 'cronograma'] : undefined,
        remaining,
      };
    }

    return html`<div class="grid cols-4" role="group" aria-label="Indicadores clave">
      <${Tile} kpi="avance" label="Avance físico" value=${av.value} tone=${av.tone} sub=${av.sub} action=${av.action}>
        ${av.actual !== undefined ? html`<${PlanMeter} actual=${av.actual} planned=${av.planned} tone=${av.tone} />` : null}
      </${Tile}>
      <${Tile} kpi="indices" label="Índices de desempeño" action=${idxAction}>
        <div class="dashboard-pair">
          <div data-index="spi"><div class="dashboard-pair-k" title="Índice de desempeño del cronograma = EV / PV">SPI</div><div class="stat-value" style=${toneStyle(spiTone)}>${idx(evm.spi)}</div><div class="stat-sub">${spiWord}</div>${bac > 0 && evm.spi !== null ? html`<div class="stat-sub nowrap" title="Variación del cronograma = EV − PV">SV ${signedMoney(evm.sv, currency)}</div>` : null}</div>
          <div data-index="cpi"><div class="dashboard-pair-k" title="Índice de desempeño del costo = EV / AC">CPI</div><div class="stat-value" style=${toneStyle(cpiTone)}>${idx(evm.cpi)}</div><div class="stat-sub">${cpiWord}</div>${evm.cpi !== null ? html`<div class="stat-sub nowrap" title="Variación del costo = EV − AC">CV ${signedMoney(evm.cv, currency)}</div>` : null}</div>
        </div>
      </${Tile}>
      <${Tile} kpi="eac" label=${eac.label} value=${eac.value} title=${eac.title} tone=${eac.tone} sub=${eac.sub} sub2=${eac.sub2} action=${eac.action} />
      <${Tile} kpi="fin" label="Fin pronosticado" value=${fin.value} title=${fin.title} source=${fin.source} tone=${fin.tone} sub=${fin.sub} sub2=${fin.sub2} sub3=${fin.sub3} action=${fin.action}
        foot=${fin.remaining !== undefined ? html`<div class="dashboard-tile-foot" data-remaining=${fin.remaining}><strong>${fmt.num(fin.remaining)}</strong>${fin.remaining === 1 ? 'día hábil restante' : 'días hábiles restantes'} desde la fecha de corte</div>` : null} />
    </div>`;
  }

  /* ---------------------------------------------------------------- tablero: curva S */
  function niceStep(max, count) {
    if (!(max > 0)) return 1;
    const raw = max / count; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  /* Mismos colores que la vista «Curva S y valor ganado» (50-evm.js): PV --s1, EV --s3, AC --s2.
     Si ese módulo publica su asignación (PM.EVM_SERIES), se usa la suya para que no se separen. */
  const evmColor = (key, fallback) => {
    const s = Array.isArray(PM.EVM_SERIES) ? PM.EVM_SERIES.find((x) => x && x.key === key) : null;
    return s && typeof s.color === 'string' && /^var\(--[\w-]+\)$/.test(s.color) ? s.color : fallback;
  };
  const SERIES = [
    { key: 'pv', label: 'Valor planificado (PV)', color: evmColor('pv', 'var(--s1)') },
    { key: 'ev', label: 'Valor ganado (EV)', color: evmColor('ev', 'var(--s3)') },
    { key: 'ac', label: 'Costo real (AC)', color: evmColor('ac', 'var(--s2)') },
  ];
  /* Marcas del eje x: inicio de mes cada 1, 2, 3, 4, 6, 12… meses, alineadas con el calendario (trimestres, semestres,
     años). La etiqueta lleva el año en la primera marca y cada vez que cambia frente a la anterior, así en un plan de
     varios años ninguna marca queda sin su año. Se toma el paso más corto cuyas etiquetas no se superponen, contando el
     ajuste en los bordes del lienzo (unos 6,4 px por carácter a 11 px). */
  const MONTH_STEPS = [1, 2, 3, 4, 6, 12, 24, 36, 60, 120];
  const AXIS_CHAR_W = 6.4;
  function monthTicks(months, x, width) {
    const build = (sel) => {
      let prevY = null;
      return sel.map((m) => {
        const yy = m.slice(0, 4);
        const label = PM.MONTHS[+m.slice(5, 7) - 1] + (yy !== prevY ? ' ' + yy : '');
        prevY = yy;
        const xx = x(m), w = label.length * AXIS_CHAR_W;
        const end = xx + w / 2 > width - 2, start = !end && xx - w / 2 < 2;
        const l = end ? width - 2 - w : start ? 2 : xx - w / 2;
        return { m, x: xx, label, anchor: end ? 'end' : start ? 'start' : 'middle', tx: end ? width - 2 : start ? 2 : xx, l, r: l + w };
      });
    };
    const fits = (t) => t.every((k, i) => i === 0 || k.l >= t[i - 1].r + 8);
    for (const step of MONTH_STEPS) {
      const sel = months.filter((m) => (+m.slice(0, 4) * 12 + +m.slice(5, 7) - 1) % step === 0);
      if (!sel.length) continue;
      const t = build(sel);
      if (fits(t)) return t;
      /* si solo choca la primera marca (dos etiquetas con año seguidas: «jul 2025 · ene 2026»), se omite esa marca */
      if (sel.length > 2) { const t2 = build(sel.slice(1)); if (fits(t2)) return t2; }
    }
    return months.length ? build([months[0]]) : [];
  }
  function MiniSCurve({ evm, currency }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const [hover, setHover] = useState(null);
    const series = evm.series || [];
    const H = 220;
    const geo = useMemo(() => {
      if (series.length < 2) return null;
      const first = series[0].date, last = series[series.length - 1].date;
      const t0 = D.toMs(first), span = Math.max(1, D.toMs(last) - t0);
      const maxV = Math.max(evm.bac || 0, ...series.map((p) => Math.max(p.pv || 0, p.ev || 0, p.ac || 0)));
      const step = niceStep(maxV * 1.04, 5);
      const top = Math.max(step, Math.ceil((maxV * 1.04) / step) * step);
      const ticks = []; for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
      /* margen izquierdo según la etiqueta más larga del eje (p. ej. "US$ 1.250,00") */
      const labels = ticks.map((v) => fmt.moneyShort(v, currency));
      const M = { l: Math.min(120, Math.max(48, Math.ceil(Math.max(...labels.map((s) => s.length)) * 6.4) + 14)), r: 14, t: 18, b: 26 };
      const iw = Math.max(80, width - M.l - M.r), ih = H - M.t - M.b;
      const x = (d) => M.l + ((D.toMs(d) - t0) / span) * iw;
      const y = (v) => M.t + ih - (v / top) * ih;
      const path = (key) => { let d = ''; for (const p of series) { if (!isNum(p[key])) continue; d += (d ? 'L' : 'M') + x(p.date).toFixed(1) + ' ' + y(p[key]).toFixed(1); } return d; };
      const months = []; let m = D.startOfMonth(first); if (m < first) m = D.addMonths(m, 1);
      let guard = 0; while (m <= last && guard++ < 1200) { months.push(m); m = D.addMonths(m, 1); }
      return { M, x, y, iw, ih, ticks, labels, paths: SERIES.map((s) => ({ ...s, d: path(s.key) })), months: monthTicks(months, x, width), xs: series.map((p) => x(p.date)), first, last };
    }, [series, width, evm.bac, currency]);
    if (!geo) return null;
    const M = geo.M;
    const sx = D.valid(evm.statusDate) && evm.statusDate >= geo.first && evm.statusDate <= geo.last ? geo.x(evm.statusDate) : null;
    const bacY = evm.bac > 0 ? geo.y(evm.bac) : null;
    const hp = hover !== null ? series[hover] : null;
    const onMove = (e) => {
      const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
      const px = e.clientX - svg.getBoundingClientRect().left;
      let best = 0, bd = Infinity; geo.xs.forEach((xx, i) => { const dd = Math.abs(xx - px); if (dd < bd) { bd = dd; best = i; } });
      setHover(best);
      const p = series[best];
      /* la información se ancla arriba del área de trazado para que no se recorte al pie del gráfico */
      const host = tip.ref.current;
      const at = host ? { clientX: e.clientX, clientY: host.getBoundingClientRect().top + 2 - host.scrollTop } : e;
      tip.show(at, html`<div class="stack-sm" style="gap:4px"><strong>${fmt.date(p.date)}</strong>
        ${SERIES.filter((s) => isNum(p[s.key])).map((s) => html`<div class="dashboard-tip-row" key=${s.key}><span class="legend-line" style=${'background:' + s.color}></span><span>${s.label}</span><span class="mono">${moneyShort(p[s.key], currency)}</span></div>`)}
      </div>`);
    };
    const onLeave = () => { setHover(null); tip.hide(); };
    const aria = 'Curva S al ' + fmt.date(evm.statusDate) + ': PV ' + moneyShort(evm.pv, currency) + ', EV ' + moneyShort(evm.ev, currency) + ', AC ' + moneyShort(evm.ac, currency) + ', BAC ' + moneyShort(evm.bac, currency) + '.';
    return html`<div class="chart dashboard-scurve" ref=${tip.ref}>
      <svg width=${width} height=${H} viewBox=${'0 0 ' + width + ' ' + H} role="img" aria-label=${aria}>
        ${geo.ticks.map((v, i) => html`<g key=${'y' + v}><line class="grid-line" x1=${M.l} x2=${M.l + geo.iw} y1=${geo.y(v)} y2=${geo.y(v)} /><text x=${M.l - 8} y=${geo.y(v) + 3.5} text-anchor="end">${geo.labels[i]}</text></g>`)}
        <line class="axis-line" x1=${M.l} x2=${M.l + geo.iw} y1=${M.t + geo.ih} y2=${M.t + geo.ih} />
        ${geo.months.map((k) => html`<g key=${'m' + k.m} data-month=${k.m}><line class="axis-line" x1=${k.x} x2=${k.x} y1=${M.t + geo.ih} y2=${M.t + geo.ih + 4} /><text x=${k.tx} y=${H - 8} text-anchor=${k.anchor}>${k.label}</text></g>`)}
        ${bacY !== null ? html`<line x1=${M.l} x2=${M.l + geo.iw} y1=${bacY} y2=${bacY} style="stroke:var(--line-strong);stroke-width:1" /><text x=${M.l + 4} y=${bacY - 4}>BAC</text>` : null}
        ${sx !== null ? html`<line x1=${sx} x2=${sx} y1=${M.t - 4} y2=${M.t + geo.ih} style="stroke:var(--signal);stroke-width:1.5" /><text x=${sx > M.l + geo.iw - 40 ? sx - 4 : sx + 4} y=${M.t - 6} text-anchor=${sx > M.l + geo.iw - 40 ? 'end' : 'start'} style="fill:var(--signal-ink);font-weight:600">Corte</text>` : null}
        ${geo.paths.map((s) => (s.d ? html`<path key=${s.key} data-series=${s.key} d=${s.d} style=${'fill:none;stroke:' + s.color + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />` : null))}
        ${hp ? html`<g pointer-events="none">
          <line x1=${geo.xs[hover]} x2=${geo.xs[hover]} y1=${M.t} y2=${M.t + geo.ih} style="stroke:var(--axis);stroke-width:1" />
          ${SERIES.filter((s) => isNum(hp[s.key])).map((s) => html`<circle key=${s.key} cx=${geo.xs[hover]} cy=${geo.y(hp[s.key])} r="4.5" style=${'fill:' + s.color + ';stroke:var(--surface);stroke-width:2'} />`)}
        </g>` : null}
        <rect class="dashboard-hit" x=${M.l} y=${M.t} width=${geo.iw} height=${geo.ih} style="fill:transparent" onPointerMove=${onMove} onPointerLeave=${onLeave} />
      </svg>
      ${tip.node}
    </div>`;
  }
  function SCurveCard({ model }) {
    const { evm, currency, baselines, sched } = model;
    const has = evm.bac > 0 && (evm.series || []).length > 1;
    const subtitle = has ? (evm.fromBaseline ? 'PV según ' + baselines.cost.label : 'PV según el cronograma vigente (sin línea base de costos)') + ' · corte ' + fmt.date(evm.statusDate) : 'Valores acumulados de PV, EV y AC';
    return html`<${Panel} title="Curva S" subtitle=${subtitle} actions=${html`<${ViewBtn} label="Ver valor ganado" view="valor-ganado" />`} data-card="scurve">
      ${has ? html`<div class="card-body stack-sm">
        <div class="legend">${SERIES.map((s) => html`<span class="legend-item" key=${s.key}><span class="legend-line" style=${'background:' + s.color}></span>${s.label}<span class="dashboard-legend-v">${moneyShort(evm[s.key], currency)}</span></span>`)}</div>
        <${MiniSCurve} evm=${evm} currency=${currency} />
      </div>` : html`<div class="dashboard-blank dashboard-blank-center">
        <${ui.Icon} name="scurve" size=${28} stroke=${1.5} />
        <div>${sched.tasks.length ? 'La curva S se dibuja cuando las actividades del cronograma tienen costo (presupuesto por actividad).' : 'La curva S se dibuja a partir del cronograma con costos por actividad.'}</div>
        <${ui.Button} size="sm" icon="gantt" onClick=${() => go('cronograma')}>${sched.tasks.length ? 'Asignar costos en el cronograma' : 'Crear cronograma'}</${ui.Button}>
      </div>`}
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: hitos */
  function MilestonesCard({ model }) {
    const { sched, baselines, statusDate } = model;
    const forecast = forecastOf(model);
    const all = sched.tasks.filter((t) => t.milestone);
    const pending = PM.sortBy(all.filter((t) => t.progress < 100), (t) => t.startDate || '');
    const shown = pending.slice(0, 5);
    const bl = baselines.schedule;
    const blTasks = bl && bl.schedule ? new Map((bl.schedule.tasks || []).map((t) => [t.id, t])) : null;
    const subtitle = all.length ? all.length - pending.length + ' de ' + all.length + ' hitos cumplidos' + (bl ? ' · variación frente a ' + bl.label : '') : 'Fechas clave del cronograma';
    return html`<${Panel} title="Próximos hitos" subtitle=${subtitle} actions=${html`<${ViewBtn} label="Ver cronograma" view="cronograma" />`} data-card="milestones">
      ${!all.length ? html`<div class="dashboard-blank"><div>No hay hitos en el cronograma. Agrega hitos (actividades de duración cero) para seguir las fechas clave del proyecto.</div><${ui.Button} size="sm" icon="milestone" onClick=${() => go('cronograma')}>Ir al cronograma</${ui.Button}></div>`
        : !pending.length ? html`<div class="dashboard-blank"><div class="row"><${ui.Icon} name="check-circle" size=${16} style="color:var(--good)" />Todos los hitos están cumplidos.</div></div>`
        : html`<ul class="dashboard-list">${shown.map((t) => {
          /* «Vencido» con la fecha planificada; el pronóstico al corte se muestra aparte cuando la mueve */
          const overdue = t.startDate < statusDate;
          const b = blTasks ? blTasks.get(t.id) : null;
          const v = b ? wdDiff(sched.cal, b.finish, t.finishDate) : null;
          const f = forecast.byId.get(t.id);
          const fd = f && D.valid(f.startDate) && f.startDate !== t.startDate ? f.startDate : null;
          const fTitle = fd ? 'Fecha del hito en la red actualizada a la fecha de corte (' + fmt.date(statusDate) + '): ' + varPhrase(wdDiff(sched.cal, t.finishDate, f.finishDate), 'frente a la fecha planificada') + (b ? '; ' + varPhrase(wdDiff(sched.cal, b.finish, f.finishDate), 'frente a ' + bl.label) : '') + '.' : null;
          return html`<li class="dashboard-li" key=${t.id} data-milestone=${t.id}>
            <span class="dashboard-ms" style=${'color:' + (overdue || t.critical ? 'var(--crit)' : 'var(--fg-2)')}><${ui.Icon} name="milestone" size=${16} /></span>
            <div class="dashboard-li-main">
              <div class="dashboard-li-title">${t.name || 'Hito sin nombre'}</div>
              <div class="row" style="gap:6px">
                <span class="xsmall mono" title="Fecha planificada">${fmt.date(t.startDate)}</span>
                ${overdue ? html`<${ui.Chip} tone="crit">Vencido</${ui.Chip}>` : null}
                ${fd ? html`<span class="chip dashboard-fc-chip" data-forecast=${fd} title=${fTitle}><span class="dashboard-fc-key" aria-hidden="true"></span>Pronóstico al corte: ${fmt.date(fd)}</span>` : null}
                ${t.tf <= 0 ? html`<${ui.Chip} tone="crit" title="Holgura total cero: cualquier atraso mueve el fin del proyecto">Ruta crítica</${ui.Chip}>` : html`<${ui.Chip} tone="outline" title="Holgura total en días hábiles">Holgura ${fmt.num(t.tf)} d</${ui.Chip}>`}
                ${bl ? (b ? html`<${ui.Chip} tone=${v > 0 ? lateTone(v) : v < 0 ? 'good' : 'outline'} title=${'Fin en ' + bl.label + ': ' + fmt.date(b.finish)}>${v === 0 ? 'Sin variación' : signedNum(v) + ' d'} frente a ${bl.label}</${ui.Chip}>` : html`<${ui.Chip} tone="info">Nuevo, no está en ${bl.label}</${ui.Chip}>`) : null}
              </div>
            </div>
          </li>`;
        })}</ul>
        ${pending.length > shown.length ? html`<div class="dashboard-more xsmall faint">Y ${pending.length - shown.length} hitos más en el cronograma.</div>` : null}`}
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: riesgos, incidentes y cambios */
  function RegisterBlank({ exists, text, emptyText, templateId, buttonLabel, canWrite }) {
    return html`<div class="dashboard-blank"><div>${exists ? text : emptyText}</div>${!exists && canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${() => openDoc(templateId)}>${buttonLabel}</${ui.Button}>` : null}</div>`;
  }
  function RisksCard({ rows, exists, canWrite }) {
    const active = rows.filter((r) => hasContent(r) && isOpenRisk(r));
    const top = PM.sortBy(active, (r) => riskScoreOf(r), -1).slice(0, 5);
    const high = active.filter((r) => riskScoreOf(r) >= 10).length;
    const actions = html`<${ui.Button} size="sm" variant="ghost" onClick=${() => openDoc('registro-riesgos')}>Abrir registro</${ui.Button}><${ViewBtn} label="Ver matriz" view="riesgos-matriz" />`;
    return html`<${Panel} title="Riesgos principales" count=${active.length || null} countTone=${high ? 'signal' : undefined} subtitle=${active.length ? active.length + (active.length === 1 ? ' abierto · ' : ' abiertos · ') + high + ' de nivel alto o muy alto · ordenados por P × I' : 'Registro de riesgos (11.2 Identificar los riesgos)'} actions=${actions} data-card="risks">
      ${!active.length ? html`<${RegisterBlank} exists=${exists && rows.some(hasContent)} canWrite=${canWrite} templateId="registro-riesgos" buttonLabel="Registrar riesgos" text="No hay riesgos abiertos: todos los registrados están cerrados o materializados (los materializados se siguen en el registro de incidentes)." emptyText="Aún no hay riesgos registrados. Identifica amenazas y oportunidades con su probabilidad e impacto (escala 1 a 5)." />`
        : html`<ul class="dashboard-list">${top.map((r, i) => {
          const score = riskScoreOf(r); const lvl = PM.calc.riskLevel(score);
          return html`<li class="dashboard-li" key=${(r.id || '') + i} data-risk=${r.id}>
            <span class="code-tag">${r.id || '—'}</span>
            <div class="dashboard-li-main">
              <div class="dashboard-li-title">${r.descripcion || 'Riesgo sin descripción'}</div>
              <div class="xsmall faint">${[r.tipo, r.propietario ? 'Propietario: ' + r.propietario : null, r.estrategia, r.estado].filter(Boolean).join(' · ')}</div>
            </div>
            <${ui.Chip} tone=${lvl.tone} title=${'Probabilidad ' + (r.probabilidad || '—') + ' × impacto ' + (r.impacto || '—')}>${lvl.label} · ${score || '—'}</${ui.Chip}>
          </li>`;
        })}</ul>
        ${active.length > top.length ? html`<div class="dashboard-more"><${LinkBtn} label=${active.length - top.length === 1 ? 'Ver el otro riesgo abierto' : 'Ver los ' + (active.length - top.length) + ' riesgos abiertos restantes'} onClick=${() => openDoc('registro-riesgos')} /></div>` : null}`}
    </${Panel}>`;
  }
  const PRIORITY_TONE = { alta: 'crit', media: 'warn', baja: 'outline' };
  function IncidentsCard({ rows, exists, canWrite, statusDate }) {
    const open = PM.sortBy(rows.filter((r) => hasContent(r) && isOpenIncident(r)), (r) => (PRIORITY[norm(r.prioridad)] ?? 3) + '|' + (r.fechaObjetivo || '9999'));
    const shown = open.slice(0, 4);
    return html`<${Panel} title="Incidentes abiertos" count=${exists ? open.length : null} countTone=${open.length ? 'warn' : 'good'} subtitle="Registro de incidentes (4.3)" actions=${html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => openDoc('registro-incidentes')}>Abrir registro</${ui.Button}>`} data-card="incidents">
      ${!open.length ? html`<${RegisterBlank} exists=${exists} canWrite=${canWrite} templateId="registro-incidentes" buttonLabel="Crear registro de incidentes" text="No hay incidentes abiertos." emptyText="Aún no se ha creado el registro de incidentes." />`
        : html`<ul class="dashboard-list">${shown.map((r, i) => {
          const late = D.valid(r.fechaObjetivo) && r.fechaObjetivo < statusDate;
          return html`<li class="dashboard-li" key=${(r.id || '') + i} data-incident=${r.id}>
            <span class="code-tag">${r.id || '—'}</span>
            <div class="dashboard-li-main">
              <div class="dashboard-li-title">${r.descripcion || 'Incidente sin descripción'}</div>
              <div class="xsmall faint">${[r.responsable, r.estado].filter(Boolean).join(' · ')}${D.valid(r.fechaObjetivo) ? html`${r.responsable || r.estado ? ' · ' : ''}<span style=${late ? 'color:var(--crit);font-weight:600' : ''}>${late ? 'Vencido el ' : 'Objetivo '}${fmt.date(r.fechaObjetivo, 'dm')}</span>` : null}</div>
            </div>
            ${r.prioridad ? html`<${ui.Chip} tone=${PRIORITY_TONE[norm(r.prioridad)] || 'outline'}>${r.prioridad}</${ui.Chip}>` : null}
          </li>`;
        })}</ul>
        ${open.length > shown.length ? html`<div class="dashboard-more"><${LinkBtn} label=${'Ver los ' + (open.length - shown.length) + ' restantes'} onClick=${() => openDoc('registro-incidentes')} /></div>` : null}`}
    </${Panel}>`;
  }
  function ChangesCard({ rows, exists, canWrite, currency }) {
    const valid = rows.filter(hasContent);
    const pending = valid.filter((r) => ['registrada', 'en analisis'].includes(norm(r.estado)));
    const approved = valid.filter((r) => norm(r.estado) === 'aprobada').length;
    const shown = pending.slice(0, 4);
    return html`<${Panel} title="Cambios pendientes" count=${exists ? pending.length : null} countTone=${pending.length ? 'info' : undefined} subtitle=${'Registradas o en análisis · ' + approved + (approved === 1 ? ' aprobada' : ' aprobadas') + ' en total'} actions=${html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => openDoc('registro-cambios')}>Abrir registro</${ui.Button}>`} data-card="changes">
      ${!pending.length ? html`<${RegisterBlank} exists=${exists} canWrite=${canWrite} templateId="registro-cambios" buttonLabel="Crear registro de cambios" text="No hay solicitudes de cambio pendientes de decisión." emptyText="Aún no se ha creado el registro de cambios (4.6 Realizar el control integrado de cambios)." />`
        : html`<ul class="dashboard-list">${shown.map((r, i) => {
          const imp = [isNum(num(r.impactoCosto, NaN)) && num(r.impactoCosto) !== 0 ? signedMoney(num(r.impactoCosto), currency) : null, isNum(num(r.impactoCronograma, NaN)) && num(r.impactoCronograma) !== 0 ? signedNum(num(r.impactoCronograma)) + ' días' : null].filter(Boolean).join(' · ');
          return html`<li class="dashboard-li" key=${(r.id || '') + i} data-change=${r.id}>
            <span class="code-tag">${r.id || '—'}</span>
            <div class="dashboard-li-main">
              <div class="dashboard-li-title">${r.descripcion || 'Solicitud sin descripción'}</div>
              <div class="xsmall faint">${[r.tipo, r.solicitante, imp ? 'Impacto ' + imp : null].filter(Boolean).join(' · ')}</div>
            </div>
            <${ui.Chip} tone=${norm(r.estado) === 'en analisis' ? 'warn' : 'info'}>${r.estado}</${ui.Chip}>
          </li>`;
        })}</ul>
        ${pending.length > shown.length ? html`<div class="dashboard-more"><${LinkBtn} label=${'Ver las ' + (pending.length - shown.length) + ' restantes'} onClick=${() => openDoc('registro-cambios')} /></div>` : null}`}
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: documentación */
  function StackBar({ c }) {
    if (!c.total) return html`<span class="dashboard-bar is-empty"></span>`;
    const segs = [['ok', 'var(--good)'], ['wip', 'var(--info)'], ['none', 'var(--surface-3)']].filter(([k]) => c[k] > 0);
    return html`<span class="dashboard-bar">${segs.map(([k, col]) => html`<span key=${k} style=${'flex-grow:' + c[k] + ';background:' + col}></span>`)}</span>`;
  }
  function DocRow({ label, code, swatch, c, onClick, id }) {
    const aria = label + ': ' + c.ok + (c.ok === 1 ? ' aprobado, ' : ' aprobados, ') + c.wip + ' en elaboración y ' + c.none + ' sin iniciar, de ' + c.total + (c.total === 1 ? ' documento' : ' documentos');
    return html`<button type="button" class="dashboard-docrow" data-docrow=${id} onClick=${onClick} aria-label=${aria} title=${aria}>
      <span class="dashboard-docrow-label">${code ? html`<span class="code-tag">${code}</span>` : null}${swatch ? html`<span class="swatch" style=${'background:' + swatch}></span>` : null}<span class="truncate">${label}</span></span>
      <${StackBar} c=${c} />
      <span class="dashboard-docrow-count">${c.ok}/${c.total}</span>
    </button>`;
  }
  function DocsCard({ docs, project }) {
    /* plantillas que cuentan en el avance (20-docs, PM.countedTemplates): las ágiles solo con ciclo de vida adaptativo o
       híbrido, o si el proyecto ya tiene documentos de ellas, y sin los documentos posteriores al cierre que aún no
       existen; así el conteo coincide con el mapa de procesos y la lista */
    const catalog = PM.templateList || [];
    const templates = useMemo(() => (typeof PM.countedTemplates === 'function' ? PM.countedTemplates(project, docs.byTemplate) : typeof PM.applicableTemplates === 'function' ? PM.applicableTemplates(project, docs.byTemplate) : catalog), [catalog, project, docs.byTemplate]);
    const statusOf = (t) => { const ds = docs.byTemplate[t.id] || []; if (!ds.length) return 'none'; return ds.some((d) => d.status === 'aprobado') ? 'ok' : 'wip'; };
    const count = (list) => { const c = { ok: 0, wip: 0, none: 0, total: list.length }; for (const t of list) c[statusOf(t)]++; return c; };
    const total = count(templates);
    const actions = html`<${ui.Button} size="sm" variant="ghost" onClick=${() => go('procesos')}>Mapa de procesos</${ui.Button}><${ViewBtn} label="Ver documentos" view="documentos" />`;
    if (!catalog.length) {
      return html`<${Panel} title="Documentación" actions=${actions} data-card="docs"><div class="dashboard-blank">${docs.list.length ? docs.list.length + ' documentos registrados. ' : ''}El catálogo de plantillas PMBOK no está cargado en esta página, por eso no se puede calcular el avance por área de conocimiento.</div></${Panel}>`;
    }
    return html`<${Panel} title="Documentación" subtitle=${total.ok + ' de ' + total.total + ' documentos aprobados · ' + total.wip + ' en elaboración · ' + total.none + ' sin iniciar'} actions=${actions} data-card="docs">
      <div class="card-body stack">
        <div class="legend">
          <span class="legend-item"><span class="swatch" style="background:var(--good)"></span>Aprobado</span>
          <span class="legend-item"><span class="swatch" style="background:var(--info)"></span>En elaboración (borrador o en revisión)</span>
          <span class="legend-item"><span class="swatch dashboard-swatch-none"></span>Sin iniciar</span>
        </div>
        <div class="dashboard-docgrid">
          <div class="stack-sm" style="gap:2px"><div class="label-caps" style="padding:0 6px 4px">Por área de conocimiento</div>
            ${AREAS.map((a) => html`<${DocRow} key=${a.id} id=${a.id} code=${a.n} label=${a.label} c=${count(templates.filter((t) => t.area === a.id))} onClick=${() => go('documentos', { area: a.id })} />`)}
          </div>
          <div class="stack-sm" style="gap:2px"><div class="label-caps" style="padding:0 6px 4px">Por grupo de procesos</div>
            ${GROUPS.map((g) => html`<${DocRow} key=${g.id} id=${g.id} swatch=${'var(--g-' + g.id + ')'} label=${g.label} c=${count(templates.filter((t) => t.group === g.id))} onClick=${() => go('procesos', { group: g.id })} />`)}
          </div>
        </div>
      </div>
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: capa ágil (§9.4)
     Lee model.agile y model.agileItems (los mismos datos de PM.useProjectModel que ya usa el tablero; no abre otra
     suscripción) y calcula con PM.calc / PM.agile del núcleo. */
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  /* ayudantes del núcleo (07-agile-core): línea base del release con contenido, iteraciones por inicio y release activo */
  const hasRelBaseline = (r) => PM.agile.hasBaseline(r);
  const agileReleases = (data) => (data && Array.isArray(data.releases) ? data.releases.filter((r) => isObj(r) && r.id) : []);
  const agileSprints = (data) => PM.agile.sortSprints(data && data.sprints);
  const fpts = (v, unit) => fmt.num(v, Number.isInteger(v) ? 0 : 1) + ' ' + unit;
  const FRAMEWORK_LABEL = { scrum: 'Scrum', kanban: 'Kanban (flujo continuo)', 'scrum-kanban': 'Scrum con tablero Kanban' };
  const MODE_LABEL = { hibrido: 'Enfoque híbrido', adaptativo: 'Enfoque adaptativo' };
  const isKanbanFlow = (data) => PM.agile.settings(data).framework === 'kanban';
  const elems = (n) => (n === 1 ? '1 elemento' : fmt.num(n) + ' elementos');
  function agileSummary(model) {
    const A = PM.agile, C = PM.calc;
    const data = model.agile || {};
    const settings = A.settings(data);
    const items = Array.isArray(model.agileItems) ? model.agileItems : [];
    const releases = agileReleases(data);
    const sprints = agileSprints(data);
    const statusDate = model.statusDate, cal = model.sched.cal;
    const current = sprints.find((s) => s.status === 'en-curso') || null;
    const next = current ? null : sprints.find((s) => s.status === 'planeado') || null;
    const burndown = current ? C.sprintBurndown({ sprint: current, items, settings, cal, statusDate }) : null;
    let left = null, sprintDays = null;
    if (current && D.valid(current.end)) {
      const from = D.valid(current.start) && current.start > statusDate ? current.start : D.add(statusDate, 1);
      left = statusDate >= current.end ? 0 : cal.countWork(from, current.end);
      sprintDays = D.valid(current.start) && current.start <= current.end ? cal.countWork(current.start, current.end) : null;
    }
    const vel = C.velocity({ sprints, items, settings });
    /* WIP por columna con la regla del núcleo (PM.agile.wipStatus, la misma del tablero Kanban): todos los elementos de
       cada columna, sin filtrar por iteración (los filtros del tablero solo cambian qué tarjetas se ven, no el trabajo en
       curso real del equipo). Luego, en una sola pasada: trabajo en curso, rendimiento de las últimas 4 semanas y bloqueados. */
    const wipSt = A.wipStatus(settings, items);
    const counts = new Map(wipSt.map((w) => [w.id, w.count]));
    let wip = 0, thr = 0, thrEst = 0;
    const from28 = D.add(statusDate, -27);
    const boardBlocked = [], backlogBlocked = [];
    for (const it of items) {
      if (!A.countable(it)) continue;
      const cat = A.category(settings, it.status);
      if (cat === 'terminado') { if (D.valid(it.doneDate) && it.doneDate >= from28 && it.doneDate <= statusDate) { thr++; thrEst += A.estimate(it); } continue; }
      if (cat === 'en-curso') wip++;
      /* bloqueados en el tablero (por hacer o en curso) y en el backlog del producto (aún sin planificar) */
      if (it.blocked) (cat === 'nuevo' ? backlogBlocked : boardBlocked).push(it);
    }
    const wipOver = wipSt.filter((w) => w.over).map((w) => ({ id: w.id, name: w.name, n: w.count, wip: w.wip }));
    const blockedSprint = current ? boardBlocked.filter((it) => it.sprintId === current.id).length : 0;
    const kanban = settings.framework === 'kanban';
    const active = A.activeRelease(releases, sprints);
    let rel = null;
    if (active) {
      const prog = C.releaseProgress({ release: active, items, settings });
      /* con las actividades del cronograma y todos los releases: la actividad del release sale de PM.agile.linksOf (§9.3) */
      const ac = A.releaseActualCost(active, model.costs, model.tree, statusDate, model.sched.tasks, releases);
      const ev = C.agileEvm({ release: active, sprints, items, settings, actualCost: ac, statusDate });
      const fc = C.releaseForecast({ release: active, sprints, items, settings, cal, statusDate });
      /* flujo continuo (Kanban): sin iteraciones no hay velocidad; el pronóstico usa el rendimiento de las últimas 4 semanas
         (estimación terminada por semana) proyectado en días calendario desde la fecha de corte */
      let flowFc = null;
      if (kanban && !fc.finish && prog.remaining > 0) {
        const perWeek = thrEst / 4;
        let finish = null;
        if (perWeek > 0) { finish = D.add(statusDate, Math.max(1, Math.ceil((prog.remaining / perWeek) * 7))); for (let g = 0; g < 14 && !cal.isWork(finish); g++) finish = D.add(finish, 1); }
        flowFc = { perWeek, finish };
      }
      rel = { r: active, prog, ev, fc, flowFc };
    }
    return { settings, unit: A.unitShort(settings), items, releases, sprints, current, next, burndown, left, sprintDays, vel, rel, wipOver, boardBlocked: A.sortByRank(boardBlocked), backlogBlocked: A.sortByRank(backlogBlocked), blockedSprint, kanban, wip, thr, thrEst, counts };
  }

  /* Burndown mínimo de la iteración en curso: ideal (discontinua) y restante (hasta la fecha de corte). */
  function MiniBurndown({ bd, unit, name }) {
    const ref = useRef();
    const width = useWidth(ref, 260);
    const H = 118;
    const days = bd.days;
    const geo = useMemo(() => {
      if (days.length < 2) return null;
      const n = days.length - 1;
      const maxV = Math.max(1, num(bd.committed), ...days.map((d) => Math.max(num(d.ideal), num(d.remaining), num(d.scope))));
      const yLabel = fmt.num(maxV, Number.isInteger(maxV) ? 0 : 1);
      const M = { l: Math.max(22, yLabel.length * 6.4 + 10), r: 8, t: 10, b: 20 };
      const iw = Math.max(60, width - M.l - M.r), ih = H - M.t - M.b;
      const x = (i) => M.l + (i / n) * iw;
      const y = (v) => M.t + ih - (num(v) / maxV) * ih;
      const ideal = days.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d.ideal).toFixed(1)).join('');
      let rem = '', last = null;
      days.forEach((d, i) => { if (!isNum(d.remaining)) return; rem += (rem ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d.remaining).toFixed(1); last = { x: x(i), y: y(d.remaining), d, i }; });
      return { M, iw, ih, ideal, rem, last, yLabel, first: days[1] ? days[1].date : days[0].date, end: days[n].date };
    }, [days, width, bd.committed]);
    if (!geo) return null;
    const { M } = geo;
    const last = geo.last;
    const lastIdeal = last ? last.d.ideal : null;
    const aria = 'Burndown de ' + (name || 'la iteración') + ': ' + (last ? 'restan ' + fpts(last.d.remaining, unit) + ' al ' + fmt.date(last.d.date) + ' frente a ' + fpts(Math.round(lastIdeal * 10) / 10, unit) + ' de la línea ideal' : 'la iteración aún no empieza') + '; compromiso ' + fpts(num(bd.committed), unit) + '.';
    return html`<div class="stack-sm" style="gap:4px">
      <div class="chart dashboard-burn" ref=${ref}>
        <svg width=${width} height=${H} viewBox=${'0 0 ' + width + ' ' + H} role="img" aria-label=${aria} data-chart="burndown">
          <line class="grid-line" x1=${M.l} x2=${M.l + geo.iw} y1=${M.t} y2=${M.t} />
          <text x=${M.l - 6} y=${M.t + 3.5} text-anchor="end">${geo.yLabel}</text>
          <text x=${M.l - 6} y=${M.t + geo.ih + 3.5} text-anchor="end">0</text>
          <line class="axis-line" x1=${M.l} x2=${M.l + geo.iw} y1=${M.t + geo.ih} y2=${M.t + geo.ih} />
          <text x=${M.l} y=${H - 5} text-anchor="start">${fmt.date(geo.first, 'dm')}</text>
          <text x=${M.l + geo.iw} y=${H - 5} text-anchor="end">${fmt.date(geo.end, 'dm')}</text>
          <path data-series="ideal" d=${geo.ideal} style="fill:none;stroke:var(--fg-3);stroke-width:1.5;stroke-dasharray:5 4" />
          ${geo.rem ? html`<path data-series="restante" d=${geo.rem} style="fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round" />` : null}
          ${last ? html`<circle cx=${last.x} cy=${last.y} r="4" style="fill:var(--accent);stroke:var(--surface);stroke-width:2" />` : null}
        </svg>
      </div>
      <div class="legend" style="font-size:var(--fs-xs)"><span class="legend-item"><span class="dashboard-key-dash"></span>Ideal</span><span class="legend-item"><span class="legend-line" style="background:var(--accent)"></span>Restante${last ? html` <span class="dashboard-legend-v">${fpts(last.d.remaining, unit)}</span>` : null}</span></div>
    </div>`;
  }

  /* PM.calc.releaseForecast cuenta las iteraciones desde el día siguiente a la última iteración cerrada del release: si hay
     una en curso, la cuenta la incluye («la iteración actual y 2 más», no «3 iteraciones más») */
  const sprintsLeftText = (n, withCurrent) => (!n ? '' : withCurrent ? (n === 1 ? ' (con la iteración actual)' : ' (la iteración actual y ' + (n - 1) + ' más)') : ' (' + n + (n === 1 ? ' iteración más)' : ' iteraciones más)'));
  const COMMIT_MARGIN = 0.15;
  function commitVsVelocity(committed, avg) {
    const p = (committed - avg) / avg;
    /* con un decimal cerca del margen, para que «16 %» no se lea «15 %» */
    const pct = fmt.pct(Math.abs(p), Math.abs(Math.abs(p) * 100 - COMMIT_MARGIN * 100) < 1 ? 1 : 0);
    if (p > COMMIT_MARGIN + 1e-9) return { state: 'over', over: true, text: 'El compromiso supera en ' + pct + ' la velocidad media (más del ' + fmt.pct(COMMIT_MARGIN) + '): riesgo de no terminarlo.' };
    if (Math.abs(committed - avg) < 0.05) return { state: 'equal', text: 'El compromiso es igual a la velocidad media.' };
    if (p > 0) return { state: 'within', text: 'El compromiso supera en ' + pct + ' la velocidad media; dentro del margen del ' + fmt.pct(COMMIT_MARGIN) + '.' };
    return { state: 'under', text: 'El compromiso está ' + pct + ' por debajo de la velocidad media.' };
  }
  const idxWord = (v, hi, mid, lo) => (!isNum(v) ? null : v > IDX_HIGH ? hi : v >= IDX_LOW ? mid : lo);
  function AgileCard({ model, project }) {
    const canWrite = PM.useCanWrite();
    const s = useMemo(() => agileSummary(model), [model.agile, model.agileItems, model.costs, model.tree, model.statusDate, model.sched]);
    const { unit, current, next, burndown, vel, rel, wipOver, boardBlocked, backlogBlocked, settings, kanban } = s;
    const statusDate = model.statusDate;
    const cal = model.sched.cal;
    const currency = model.currency;
    const mode = PM.agile.mode(project);
    const links = html`<${ViewBtn} label="Backlog" view="backlog" /><${ViewBtn} label="Kanban" view="kanban" /><${ViewBtn} label="Iteraciones" view="iteraciones" /><${ViewBtn} label="Métricas" view="metricas-agiles" />`;
    const subtitle = (MODE_LABEL[mode] || 'Capa ágil') + ' · ' + (FRAMEWORK_LABEL[settings.framework] || 'Scrum') + ' · al ' + fmt.date(model.statusDate);
    if (!s.items.length && !s.releases.length && !s.sprints.length) {
      return html`<${Panel} title="Seguimiento ágil" subtitle=${subtitle} actions=${links} data-card="agile">
        <div class="dashboard-blank" data-agile-empty>
          <div>La capa ágil está activa, pero aún no hay backlog, releases ni iteraciones. Empieza por el backlog del producto (historias de usuario con criterios de aceptación) y luego planifica los releases y las iteraciones.</div>
          <div class="row"><${ui.Button} size="sm" variant="primary" icon="backlog" onClick=${() => go('backlog')}>${canWrite ? 'Crear el backlog' : 'Ver el backlog'}</${ui.Button}><${ui.Button} size="sm" icon="release" onClick=${() => go('iteraciones')}>${canWrite ? 'Planificar releases e iteraciones' : 'Ver releases e iteraciones'}</${ui.Button}></div>
        </div>
      </${Panel}>`;
    }

    /* 1. iteración actual */
    let iter;
    if (current) {
      const over = D.valid(current.end) && statusDate > current.end;
      iter = html`<div class="dashboard-agile-sec" data-agile="sprint">
        <h4 class="label-caps">Iteración actual</h4>
        <div class="row" style="gap:6px"><strong data-agile-sprint-name>${current.name || 'Iteración sin nombre'}</strong><${ui.Chip} tone="accent" icon="sprint">En curso</${ui.Chip}></div>
        ${current.goal ? html`<div class="dashboard-agile-goal" title=${current.goal}><span class="faint">Objetivo: </span>${current.goal}</div>` : html`<div class="xsmall faint">Sin objetivo de iteración registrado.</div>`}
        ${over ? html`<div class="dashboard-alert" data-tone="warn" data-agile-overdue><${ui.Icon} name="alert" size=${15} /><span>Terminó el ${fmt.date(current.end)} y sigue en curso: ciérrala en Releases e iteraciones para fijar lo terminado.</span></div>`
          : html`<div class="dashboard-agile-big" data-agile-left=${s.left}>${s.left === null ? '—' : fmt.num(s.left)} <small>${s.left === 1 ? 'día hábil restante' : 'días hábiles restantes'}</small></div>
            <div class="xsmall faint">${D.valid(current.start) ? fmt.date(current.start, 'dm') + ' – ' : ''}${D.valid(current.end) ? fmt.date(current.end, 'dm') : 'sin fecha de fin'}${s.sprintDays ? ' · ' + s.sprintDays + ' días hábiles' : ''}</div>`}
        ${burndown && burndown.days.length > 1 ? html`<${MiniBurndown} bd=${burndown} unit=${unit} name=${current.name} />` : null}
        <div class="dashboard-agile-kv">${burndown ? html`<span>Compromiso <strong>${fpts(num(burndown.committed), unit)}</strong></span><span title="Estimación de los elementos que hoy están en la iteración, incluido lo agregado después de iniciarla">Alcance actual <strong data-agile-scope>${fpts(burndown.total, unit)}</strong></span><span>Terminado <strong data-agile-done>${fpts(burndown.done, unit)}</strong></span><span>Restante <strong>${fpts(burndown.remaining, unit)}</strong></span>` : null}</div>
      </div>`;
    } else if (kanban) {
      const inProgress = settings.columns.filter((c) => c.category === 'en-curso');
      iter = html`<div class="dashboard-agile-sec" data-agile="sprint">
        <h4 class="label-caps">Flujo continuo</h4>
        <div class="dashboard-agile-big" data-agile-wip=${s.wip}>${fmt.num(s.wip)} <small>${s.wip === 1 ? 'elemento en curso' : 'elementos en curso'}</small></div>
        ${inProgress.length ? html`<div class="dashboard-agile-kv" data-agile-columns>${inProgress.map((c) => { const n = s.counts.get(c.id) || 0, lim = PM.agile.wipLimit(c); return html`<span key=${c.id}>${c.name} <strong>${lim ? n + ' / ' + lim : n}</strong></span>`; })}</div>` : null}
        <div class="xsmall faint">Trabajo en curso por columna${inProgress.some(PM.agile.wipLimit) ? ' frente a su límite WIP' : ''}, en todo el tablero.</div>
      </div>`;
    } else {
      iter = html`<div class="dashboard-agile-sec" data-agile="sprint">
        <h4 class="label-caps">Iteración actual</h4>
        <div class="small">${next ? html`Ninguna iteración en curso. Próxima: <strong>${next.name || 'Iteración'}</strong>${D.valid(next.start) ? ', inicia el ' + fmt.date(next.start) : ''}.` : 'Ninguna iteración en curso ni planeada.'}</div>
        <div><${ui.Button} size="sm" icon="sprint" onClick=${() => go('iteraciones')}>${!canWrite ? 'Ver iteraciones' : next ? 'Iniciar la iteración' : 'Planificar la siguiente iteración'}</${ui.Button}></div>
      </div>`;
    }

    /* 2. velocidad (Scrum) o rendimiento (Kanban: flujo continuo, sin iteraciones) */
    /* compromiso de la iteración en curso frente a la velocidad media: el mismo margen del 15 % que usa el planificador de
       iteraciones (COMMIT_MARGIN) y la diferencia en porcentaje, para que «dentro» no se lea como «igual o menor» */
    const commitCheck = current && burndown && isNum(vel.avg3) && vel.avg3 > 0 ? commitVsVelocity(num(burndown.committed), vel.avg3) : null;
    const velBasis = vel.closed === 1 ? 'Terminado en la única iteración cerrada.'
      : vel.closed ? (vel.closed > 3 ? 'Promedio de las últimas 3 iteraciones cerradas' : 'Promedio de las ' + vel.closed + ' iteraciones cerradas') + ' (mín. ' + fpts(vel.min3, unit) + ', máx. ' + fpts(vel.max3, unit) + ').'
      : 'Aparece al cerrar la primera iteración (terminado al cierre).';
    const velSec = kanban ? html`<div class="dashboard-agile-sec" data-agile="throughput">
      <h4 class="label-caps">Rendimiento</h4>
      <div class="dashboard-agile-big" data-agile-throughput=${s.thr}>${fmt.num(s.thr)} <small>${s.thr === 1 ? 'elemento terminado en 4 semanas' : 'elementos terminados en 4 semanas'}</small></div>
      <div class="xsmall faint">Del ${fmt.date(D.add(statusDate, -27), 'dm')} al ${fmt.date(statusDate, 'dm')}: ${fpts(s.thrEst, unit)} terminados${s.thr ? ' · ' + fmt.num(s.thr / 4, 1) + ' elementos por semana' : ''}. En flujo continuo el rendimiento reemplaza a la velocidad por iteración.</div>
    </div>` : html`<div class="dashboard-agile-sec" data-agile="velocity">
      <h4 class="label-caps">Velocidad media</h4>
      <div class="dashboard-agile-big" data-agile-velocity=${isNum(vel.avg3) ? vel.avg3 : ''}>${isNum(vel.avg3) ? fmt.num(vel.avg3, 1) : '—'} <small>${isNum(vel.avg3) ? unit + ' por iteración' : ''}</small></div>
      <div class="xsmall faint" data-agile-velbasis>${velBasis}</div>
      ${current && burndown ? html`<div class="dashboard-agile-kv"><span>Compromiso actual <strong>${fpts(num(burndown.committed), unit)}</strong></span>${commitCheck ? html`<span data-agile-commit-check=${commitCheck.state} class=${cx('dashboard-commit', commitCheck.over && 'is-over')}>${commitCheck.over ? html`<${ui.Icon} name="alert" size=${14} />` : null}<span>${commitCheck.text}</span></span>` : null}</div>` : null}
    </div>`;

    /* 3. release activo: avance, SPI y CPI ágiles, pronóstico */
    let relSec;
    if (!rel) {
      relSec = html`<div class="dashboard-agile-sec" data-agile="release"><h4 class="label-caps">Release activo</h4><div class="small">${s.releases.length ? 'Todos los releases están cerrados.' : 'Aún no hay releases: agrúpalos en la hoja de ruta para seguir su avance, su valor ganado ágil y su pronóstico.'}</div><div><${ui.Button} size="sm" icon="release" onClick=${() => go('iteraciones')}>${s.releases.length || !canWrite ? 'Ver releases' : 'Crear release'}</${ui.Button}></div></div>`;
    } else {
      const { r, prog, ev, fc, flowFc } = rel;
      /* sin presupuesto (BAC) el release no tiene PV ni EV: SPI y CPI no se calculan (un CPI 0 no significa sobrecosto) */
      const noBac = !(ev.bac > 0);
      const spi = noBac ? null : ev.spi, cpi = noBac ? null : ev.cpi;
      const spiT = PM.calc.indexTone(spi), cpiT = PM.calc.indexTone(cpi);
      const finish = fc.finish || (flowFc && flowFc.finish) || null;
      const fv = finish && D.valid(r.end) ? wdDiff(cal, r.end, finish) : null;
      const vsEnd = fv === null ? '.' : fv === 0 ? ', en la fecha del release.' : ', ' + fmt.num(Math.abs(fv)) + ' ' + wdUnit(fv) + (fv > 0 ? ' después' : ' antes') + ' del fin del release (' + fmt.date(r.end) + ').';
      const fcText = prog.total > 0 && !prog.remaining ? 'Alcance terminado' + (D.valid(prog.lastDone) ? ' el ' + fmt.date(prog.lastDone) : '') + '.'
        : fc.finish ? 'Terminación probable: ' + fmt.date(fc.finish) + sprintsLeftText(fc.sprintsNeeded, !!(current && current.releaseId === r.id)) + vsEnd
        : flowFc && flowFc.finish ? 'Terminación probable por rendimiento: ' + fmt.date(flowFc.finish) + ' (' + fpts(Math.round(flowFc.perWeek * 10) / 10, unit) + ' por semana en las últimas 4 semanas)' + vsEnd
        : flowFc ? 'Sin elementos estimados terminados en las últimas 4 semanas: el pronóstico por rendimiento aparece cuando el flujo entregue trabajo.'
        : prog.total > 0 ? 'Sin velocidad todavía: el pronóstico aparece al cerrar la primera iteración.' : 'Sin alcance estimado en el release.';
      const spiEmpty = noBac ? 'Sin presupuesto (BAC)' : kanban && !s.sprints.length ? 'Sin iteraciones (flujo continuo)' : 'Sin iteraciones transcurridas';
      const fcTone = fv === null ? null : fv > 0 ? 'warn' : 'good';
      relSec = html`<div class="dashboard-agile-sec" data-agile="release">
        <h4 class="label-caps">Release activo</h4>
        <div class="row" style="gap:6px"><strong data-agile-release=${r.id}>${r.name || 'Release sin nombre'}</strong>${hasRelBaseline(r) ? html`<${ui.Chip} tone="outline" icon="layers" title=${'Línea base del release: ' + fpts(num(r.baseline.points), unit) + (D.valid(r.baseline.end) ? ', fin ' + fmt.date(r.baseline.end) : '')}>Con línea base</${ui.Chip}>` : html`<${ui.Chip} tone="outline">Sin línea base</${ui.Chip}>`}</div>
        <div class="dashboard-agile-kv"><span>Terminado <strong data-agile-progress>${fpts(prog.done, unit)} de ${fpts(prog.total, unit)}</strong></span><span><strong>${fmt.pct(prog.pct, 1)}</strong></span></div>
        <${ui.Meter} value=${prog.pct} tone=${prog.pct >= 1 ? 'good' : undefined} label=${'Avance del release ' + (r.name || '') + ': ' + fmt.pct(prog.pct, 1)} />
        <div class="dashboard-pair" style="margin-top:4px">
          <div data-index="spi-agil"><div class="dashboard-pair-k" title="SPI ágil = EV / PV (PV = BAC × iteraciones transcurridas / planeadas)">SPI ágil</div><div class="stat-value" style=${toneStyle(spiT)}>${idx(spi)}</div><div class="stat-sub">${idxWord(spi, 'Adelantado', 'Al día', 'Atrasado') || spiEmpty}</div></div>
          <div data-index="cpi-agil"><div class="dashboard-pair-k" title="CPI ágil = EV / AC (costos reales imputados al release)">CPI ágil</div><div class="stat-value" style=${toneStyle(cpiT)}>${idx(cpi)}</div><div class="stat-sub">${idxWord(cpi, 'Por debajo del presupuesto', 'Dentro del presupuesto', 'Por encima del presupuesto') || (noBac ? 'Sin presupuesto (BAC)' : 'Sin costos imputados')}</div></div>
        </div>
        <div class="dashboard-alert" data-tone=${fcTone || undefined} data-agile-forecast=${finish || ''}><${ui.Icon} name=${fcTone === 'warn' ? 'alert' : 'calendar'} size=${15} /><span>${fcText}${fc.finishBest && fc.finishWorst && fc.finishBest !== fc.finishWorst && prog.remaining ? ' Rango: ' + fmt.date(fc.finishBest) + ' a ' + fmt.date(fc.finishWorst) + '.' : ''}</span></div>
        ${ev.bac > 0 ? html`<div class="xsmall faint">BAC ${moneyShort(ev.bac, currency)} · EV ${moneyShort(ev.ev, currency)} · AC ${moneyShort(ev.ac, currency)}</div>` : ev.ac > 0 ? html`<div class="xsmall faint">AC ${moneyShort(ev.ac, currency)} sin presupuesto (BAC) del release.</div>` : null}
      </div>`;
    }

    /* 4. alertas */
    /* WIP y bloqueados sobre todo el tablero (como el tablero Kanban); los bloqueados del backlog del producto aparte */
    const alerts = [];
    const list = (arr) => endSentence(arr.slice(0, 3).map((it) => (it.code || '') + (it.title ? ' ' + truncWords(it.title, 40) : '')).join('; ') + (arr.length > 3 ? ' y ' + (arr.length - 3) + ' más' : ''));
    for (const w of wipOver) alerts.push(html`<li key=${'wip-' + w.id} class="dashboard-alert" data-tone="crit" data-agile-alert="wip"><${ui.Icon} name="alert" size=${15} /><span>Límite WIP superado en «${w.name}»: ${w.n} elementos para un límite de ${w.wip}.</span></li>`);
    if (boardBlocked.length) {
      const nB = boardBlocked.length, k = s.blockedSprint;
      const where = current && k === nB ? ' en la iteración actual' : ' en el tablero' + (current && k ? ' (' + k + ' de la iteración actual)' : '');
      alerts.push(html`<li key="blocked" class="dashboard-alert" data-tone="crit" data-agile-alert="blocked"><${ui.Icon} name="lock" size=${15} /><span>${nB === 1 ? '1 elemento bloqueado' : nB + ' elementos bloqueados'}${where}: ${list(boardBlocked)}</span></li>`);
    }
    if (backlogBlocked.length) {
      const nK = backlogBlocked.length;
      alerts.push(html`<li key="blocked-backlog" class="dashboard-alert" data-tone="warn" data-agile-alert="blocked-backlog"><${ui.Icon} name="lock" size=${15} /><span>${nK === 1 ? '1 elemento del backlog del producto está bloqueado' : nK + ' elementos del backlog del producto están bloqueados'} (aún sin planificar): ${list(backlogBlocked)}</span></li>`);
    }
    const onBoard = wipOver.length > 0 || boardBlocked.length > 0;
    const alertSec = html`<div class="dashboard-agile-sec" data-agile="alerts">
      <h4 class="label-caps">Alertas del flujo</h4>
      ${alerts.length ? html`<ul class="dashboard-alerts">${alerts}</ul>` : html`<div class="dashboard-alert" data-tone="good" data-agile-alert="none"><${ui.Icon} name="check-circle" size=${15} /><span>Sin alertas: ninguna columna supera su límite WIP y no hay elementos bloqueados.</span></div>`}
      ${alerts.length ? html`<div class="row" style="gap:6px 14px">${onBoard ? html`<${LinkBtn} label="Ver tablero Kanban" onClick=${() => go('kanban')} />` : null}${backlogBlocked.length ? html`<${LinkBtn} label="Ver backlog" onClick=${() => go('backlog')} />` : null}</div>` : null}
    </div>`;

    return html`<${Panel} title="Seguimiento ágil" subtitle=${subtitle} actions=${links} data-card="agile">
      <div class="dashboard-agile-grid">${iter}${relSec}${velSec}${alertSec}</div>
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: recursos del proyecto (§10)
     Catálogo efectivo (model.catalog, con los recursos «virtuales» que solo existen en las asignaciones) y recursos no
     planificados (SPEC §10.3): costo de sus asignaciones del cronograma valoradas con el costo unitario del catálogo
     (PM.res.assignment) y, aparte y rotulado así, el monto de reserva registrado de los que no están asignados; sin
     motivo; sin la solicitud de cambio que su motivo exige; consumo de la reserva para contingencias con la regla única
     PM.res.reserveUse (la misma de la EDC y del presupuesto). Una pasada por las asignaciones. */
  const plural = (n, one, many) => fmt.num(n) + ' ' + (n === 1 ? one : many);
  /* Reservas del plan vigente (SPEC §10.3, PM.res.reserveUse; la misma regla de la EDC «Plan actual» y del presupuesto):
     costs.reserves.contingency es el total y no se descuenta; lo consumido por recursos que responden a riesgos ya está en
     el BAC (asignado a actividades por recursos o mixtas) o es una cuenta aparte (unassigned). Fuera del BAC quedan la
     reserva disponible y ese consumo sin actividad: es lo que congela una nueva línea base (outside) para no contar dos veces
     lo asignado. sched: el cronograma calculado (model.sched). */
  function planReserves(resources, sched, costs) {
    const res = (costs && costs.reserves) || {};
    const total = Math.max(0, num(res.contingency, 0));
    const ru = PM.res && typeof PM.res.reserveUse === 'function' ? PM.res.reserveUse({ data: resources, schedule: sched, contingency: total }) : null;
    const consumed = ru ? ru.consumed : 0;
    const available = consumed > 0 ? Math.max(0, total - consumed) : total;
    const unassigned = ru ? ru.unassigned : 0;
    return { total, consumed, available, unassigned, outside: available + unassigned, management: num(res.management, 0) };
  }
  function resourceStats(model) {
    const R = PM.res, RES = PM.RES;
    if (!R || !RES) return null;
    const cat = model.catalog || R.catalog(model.resources, model.schedule);
    if (!cat) return null;
    const known = new Set(cat.types.map((t) => t.id));
    const saved = cat.items.filter((it) => !it.virtual);
    const typed = saved.filter((it) => known.has(it.typeId));
    const unpl = saved.filter((it) => it.planned === false);
    const reasons = Array.isArray(RES.REASONS) ? RES.REASONS : [];
    const reasonOf = (it) => reasons.find((r) => r.value === it.reason) || null;
    const use = new Map();
    if (unpl.length) {
      const ids = new Set(unpl.map((x) => x.id));
      for (const t of (model.schedule && Array.isArray(model.schedule.tasks) ? model.schedule.tasks : [])) {
        if (!isObj(t) || !Array.isArray(t.resources)) continue;
        for (const a of t.resources) { if (!isObj(a)) continue; const l = R.assignment(cat, t, a); if (l.item && ids.has(l.item.id)) use.set(l.item.id, (use.get(l.item.id) || 0) + l.cost); }
      }
    }
    /* asignados: costo de sus asignaciones; sin asignar: su monto de reserva registrado (cifras separadas) */
    let assignedCost = 0, nAssigned = 0, pendingReserve = 0, nPending = 0;
    const noReason = [], noChange = [];
    for (const it of unpl) {
      const r = reasonOf(it);
      if (use.has(it.id)) { assignedCost += use.get(it.id); nAssigned++; }
      else { nPending++; pendingReserve += isNum(num(it.reserveAmount, NaN)) ? Math.max(0, num(it.reserveAmount)) : 0; }
      if (!r) noReason.push(it);
      else if (r.baseline && !String(it.changeRef || '').trim()) noChange.push(it);
    }
    const contingency = Math.max(0, num(model.costs && model.costs.reserves && model.costs.reserves.contingency, 0));
    const ru = typeof R.reserveUse === 'function' ? R.reserveUse({ data: model.resources, schedule: model.sched || model.schedule, contingency }) : null;
    return { total: cat.items.length, saved: saved.length, typed: typed.length, types: new Set(typed.map((it) => it.typeId)).size, uncl: cat.items.length - typed.length,
      agile: saved.filter((it) => it.agileTeam).length,
      unpl: { n: unpl.length, assignedCost, nAssigned, pendingReserve, nPending, noReason, noChange, reserve: ru ? ru.consumed : 0, available: ru ? ru.available : contingency, contingency } };
  }
  const resNames = (list) => list.slice(0, 3).map((it) => (it.code ? it.code + ' ' : '') + it.name).join(', ') + (list.length > 3 ? ' y ' + (list.length - 3) + ' más' : '');
  function UnplannedCard({ stats, currency }) {
    const u = stats.unpl;
    const issues = u.noReason.length + u.noChange.length;
    const over = u.available < -0.5;
    /* «3 recursos no planificados: 1 asignado en el cronograma por $ 560 mil (costo unitario del catálogo); 2 sin asignar,
       con $ 6,1 M de monto de reserva registrado» */
    const parts = [];
    if (u.nAssigned) parts.push(html`${plural(u.nAssigned, 'asignado', 'asignados')} en el cronograma por <strong data-res-cost="assigned">${moneyShort(u.assignedCost, currency)}</strong> (costo unitario del catálogo)`);
    if (u.nPending) parts.push(html`${fmt.num(u.nPending)} sin asignar${u.pendingReserve > 0.5 ? html`, con <strong data-res-cost="reserve">${moneyShort(u.pendingReserve, currency)}</strong> de monto de reserva registrado` : ''}`);
    const toCatalog = () => go('recursos', { tab: 'catalogo', plan: 'no-planificado' });
    return html`<${Panel} title="Recursos no planificados" count=${u.n} countTone=${u.noChange.length ? 'crit' : issues ? 'warn' : 'info'} subtitle="Recursos que no estaban en la planificación · 9.6 Controlar los recursos" class="dashboard-res"
      actions=${html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" data-res-link onClick=${toCatalog}>Ver en el catálogo</${ui.Button}>`} data-card="unplanned-resources">
      <ul class="dashboard-alerts">
        <li class="dashboard-alert" data-res-alert="summary"><${ui.Icon} name="resources" size=${15} /><span>${plural(u.n, 'recurso no planificado', 'recursos no planificados')}: ${parts.map((x, i) => html`${i ? '; ' : ''}${x}`)}.</span></li>
        ${u.noReason.length ? html`<li class="dashboard-alert" data-tone="warn" data-res-alert="no-reason"><${ui.Icon} name="alert" size=${15} /><span>${u.noReason.length === 1 ? '1 sin motivo registrado' : u.noReason.length + ' sin motivo registrado'}: ${resNames(u.noReason)}. El motivo dice si cambia o no la línea base.</span></li>` : null}
        ${u.noChange.length ? html`<li class="dashboard-alert" data-tone="crit" data-res-alert="no-change"><${ui.Icon} name="alert" size=${15} /><span>${u.noChange.length === 1 ? '1 requiere solicitud de cambio y no la tiene' : u.noChange.length + ' requieren solicitud de cambio y no la tienen'}: ${resNames(u.noChange)} (4.6).</span></li>` : null}
        ${u.reserve > 0 ? html`<li class="dashboard-alert" data-tone=${over ? 'crit' : undefined} data-res-alert="reserve"><${ui.Icon} name=${over ? 'alert' : 'money'} size=${15} /><span>Consumen ${moneyShort(u.reserve, currency)} de la reserva para contingencias: ${over ? 'superan la reserva en ' + moneyShort(-u.available, currency) + '.' : 'quedan ' + moneyShort(u.available, currency) + ' disponibles.'}</span></li>` : null}
        ${!issues ? html`<li class="dashboard-alert" data-tone="good" data-res-alert="ok"><${ui.Icon} name="check-circle" size=${15} /><span>Todos tienen motivo y, si cambian la línea base, su solicitud de cambio.</span></li>` : null}
      </ul>
    </${Panel}>`;
  }

  /* ---------------------------------------------------------------- tablero: líneas base y ruta sugerida */
  const partDetail = (id, bl, cur) => {
    if (id === 'scope') return ((bl.scope && bl.scope.wbs) || []).length + ' elementos de la EDT';
    if (id === 'schedule') return bl.schedule ? 'Fin ' + fmt.date(bl.schedule.finish) + ' · ' + (bl.schedule.tasks || []).length + ' actividades' : '';
    return bl.cost ? 'BAC ' + moneyShort(bl.cost.bac, cur) : '';
  };
  function BaselinesCard({ model, canWrite }) {
    const b = model.baselines;
    return html`<${Panel} title="Líneas base" subtitle="Línea base para la medición del desempeño" actions=${html`<${ViewBtn} label="Ver líneas base" view="lineas-base" />`} data-card="baselines">
      <ul class="dashboard-list">
        ${PARTS.map((p) => { const bl = b[p.id]; return html`<li class="dashboard-li" key=${p.id} data-part=${p.id}>
          <div class="dashboard-li-main"><div class="dashboard-li-title">${p.long}</div><div class="xsmall faint">${bl ? partDetail(p.id, bl, model.currency) : p.hint}</div></div>
          ${bl ? html`<${ui.Chip} tone="accent" title=${'Vigente desde ' + fmt.date(bl.date, 'long')}>${bl.label} · ${fmt.date(bl.date, 'short')}</${ui.Chip}>` : html`<${ui.Chip} tone="outline">Sin línea base</${ui.Chip}>`}
        </li>`; })}
      </ul>
      ${canWrite ? html`<div class="dashboard-more" style="padding-top:12px;border-top:1px solid var(--line)"><${ui.Button} size="sm" icon="layers" variant=${b.list.length ? undefined : 'primary'} onClick=${() => openEstablish()}>Establecer línea base</${ui.Button}></div>` : null}
    </${Panel}>`;
  }

  const isApproved = (d) => !!d && d.status === 'aprobado';
  const docStateLabel = (d, approvedLabel) => (!d ? 'Pendiente' : isApproved(d) ? approvedLabel : PM.docStatus(d.status).label);
  const hasNumImpact = (v) => isNum(num(v, NaN)) && num(v) !== 0;
  /* filas del registro de entregables (4.3 / 5.5) con nombre */
  function deliverablesOf(docs) {
    const doc = docs.get('entregables');
    const rows = doc && doc.fields && Array.isArray(doc.fields.entregables) ? doc.fields.entregables.filter((r) => r && typeof r === 'object' && String(r.entregable || '').trim()) : [];
    return { doc, rows, accepted: rows.filter((r) => norm(r.estado) === 'aceptado').length };
  }
  /* Lo que falta para cerrar el proyecto (4.7): trabajo sin terminar, riesgos e incidentes abiertos y entregables sin aceptar. */
  function closureBlockers({ model, docs, riesgos, incidentes }) {
    const out = [];
    const work = model.sched.tasks.filter((t) => !t.milestone);
    const unfinished = work.filter((t) => num(t.progress) < 100).length;
    if (unfinished) out.push('avance físico ' + fmt.pct(physicalProgress(model).actual, 1) + ' (' + unfinished + (unfinished === 1 ? ' actividad sin terminar)' : ' actividades sin terminar)'));
    const openR = riesgos.filter((r) => hasContent(r) && isOpenRisk(r)).length;
    if (openR) out.push(openR + (openR === 1 ? ' riesgo abierto' : ' riesgos abiertos'));
    const openI = incidentes.filter((r) => hasContent(r) && isOpenIncident(r)).length;
    if (openI) out.push(openI + (openI === 1 ? ' incidente abierto' : ' incidentes abiertos'));
    const ent = deliverablesOf(docs);
    const notAcc = ent.rows.length - ent.accepted;
    if (notAcc) out.push(notAcc + (notAcc === 1 ? ' entregable sin aceptar' : ' entregables sin aceptar'));
    return out;
  }
  const PHASES = [
    { id: 'plan', label: 'Inicio y planificación' },
    { id: 'control', label: 'Ejecución, monitoreo y cierre' },
  ];

  /* Paso «Catálogo de recursos» (9.2): hecho con al menos un recurso guardado con un tipo del proyecto; parcial si solo hay
     recursos sin clasificar (los «virtuales» de las asignaciones o guardados sin tipo). */
  function catalogStep(rs, mode) {
    if (!rs) return null;
    const label = rs.typed ? plural(rs.typed, 'recurso con tipo', 'recursos con tipo') + (rs.uncl ? ' · ' + rs.uncl + ' sin clasificar' : '')
      : rs.total ? plural(rs.total, 'recurso sin clasificar', 'recursos sin clasificar') : 'Pendiente';
    return { phase: 'plan', id: 'catalogo-recursos', label: 'Catálogo de recursos',
      desc: mode === 'adaptativo' ? '9.2 · Personas del equipo (dedicación y ausencias) y demás recursos con tipo y costo: alimentan la capacidad de las iteraciones.' : '9.2 · Recursos con tipo, unidad, disponibilidad y costo: alimentan el costeo de las actividades, el histograma y la capacidad del equipo.',
      done: rs.typed > 0, partial: rs.total > 0, stateLabel: label, action: () => go('recursos', { tab: 'catalogo' }) };
  }
  /* Paso opcional «Estructuras de desglose revisadas» (7.3, 11.2, 9.2): aplica si existe la vista y hay algo que desglosar
     (presupuesto, riesgos o recursos). Revisadas = la EDR documentada (estructura-desglose-recursos con filas) y las
     categorías de riesgo del plan de gestión de los riesgos (edrRiesgos). No cuenta en el avance de la ruta. */
  function breakdownStep({ docs, rs, bac, nRisks }) {
    if (!PM.getView || !PM.getView('estructuras')) return null;
    if (!(bac > 0) && !nRisks && !(rs && rs.total)) return null;
    const rowsOf = (d, k, f) => (d && d.fields && Array.isArray(d.fields[k]) ? d.fields[k].filter((r) => isObj(r) && String(r[f] || '').trim()).length : 0);
    const edr = rowsOf(docs.get('estructura-desglose-recursos'), 'recursos', 'recurso');
    const rbs = rowsOf(docs.get('plan-gestion-riesgos'), 'edrRiesgos', 'nivel1');
    return { phase: 'plan', id: 'estructuras', optional: true, label: 'Estructuras de desglose revisadas',
      desc: '7.3 · 11.2 · 9.2 · Desglose de costos, de los riesgos y de los recursos en diagrama, para revisarlos antes de fijar la línea base.',
      done: edr > 0 && rbs > 0, partial: edr > 0 || rbs > 0,
      stateLabel: edr && rbs ? 'EDR y categorías de riesgo documentadas' : edr ? 'EDR documentada · faltan las categorías de riesgo' : rbs ? 'Categorías de riesgo definidas · falta la EDR' : 'Sin revisar',
      action: () => go('estructuras', { tab: edr && !rbs ? 'riesgos' : rbs && !edr ? 'recursos' : 'costos' }) };
  }

  function buildRoute({ model, docs, riesgos, incidentes, cambios, canWrite, mode = 'predictivo', rs = null }) {
    const acta = docs.get('acta-constitucion');
    const inter = docs.get('registro-interesados');
    const nInter = inter && inter.fields && Array.isArray(inter.fields.interesados) ? inter.fields.interesados.filter((r) => r && String(r.nombre || r.cargo || r.organizacion || '').trim()).length : 0;
    const enunciado = docs.get('enunciado-alcance');
    const nodes = (model.wbs && model.wbs.nodes) || [];
    const tasks = model.sched.tasks;
    const work = tasks.filter((t) => !t.milestone);
    const bacNow = PM.sum(tasks, (t) => t.cost);
    const costs = model.costs || {};
    const nRisks = riesgos.filter(hasContent).length;
    const progressed = tasks.some((t) => t.progress > 0) || (costs.statusUpdates || []).length > 0 || (costs.actuals || []).length > 0;
    /* 4.5 informe de desempeño: el último emitido (aprobado) debe cubrir el periodo de la fecha de corte (≈ un mes) */
    const reports = docs.byTemplate['informe-desempeno'] || [];
    const repDate = (d) => (d.fields && D.valid(d.fields.fechaCorte) ? d.fields.fechaCorte : String(d.updatedAt || d.createdAt || '').slice(0, 10));
    const lastRep = PM.sortBy(reports, repDate, -1)[0] || null;
    const lastIssued = PM.sortBy(reports.filter(isApproved), repDate, -1)[0] || null;
    const issuedAt = lastIssued ? repDate(lastIssued) : null;
    const repCurrent = !!lastIssued && (!D.valid(issuedAt) || D.diff(issuedAt, model.statusDate) <= 35);
    const repDraft = lastRep && !isApproved(lastRep) ? lastRep : null;
    /* 4.6 control integrado de cambios: nada pendiente de decisión y cada cambio aprobado con impacto llevado a una línea base */
    const changesDoc = docs.get('registro-cambios');
    const validCh = cambios.filter(hasContent);
    const pendingCh = validCh.filter((r) => ['registrada', 'en analisis'].includes(norm(r.estado)));
    const latestBl = model.baselines.latest;
    const refs = new Set(model.baselines.list.map((b) => b.changeRef).filter(Boolean));
    const unbaselined = latestBl ? validCh.filter((r) => norm(r.estado) === 'aprobada' && (hasNumImpact(r.impactoCronograma) || hasNumImpact(r.impactoCosto)) && !refs.has(r.id) && (!D.valid(r.fechaDecision) || r.fechaDecision > latestBl.date)) : [];
    /* 5.5 entregables aceptados */
    const ent = deliverablesOf(docs);
    const actasOk = (docs.byTemplate['acta-aceptacion-entregable'] || []).filter(isApproved).length;
    const nActas = (docs.byTemplate['acta-aceptacion-entregable'] || []).length;
    /* 4.7 cierre */
    const ifin = docs.get('informe-final');
    const acie = docs.get('acta-cierre');
    const blockers = closureBlockers({ model, docs, riesgos, incidentes });
    const steps = [
      { phase: 'plan', id: 'acta', label: 'Acta de constitución aprobada', desc: '4.1 · Autoriza formalmente el proyecto y al director.', done: isApproved(acta), partial: !!acta, stateLabel: docStateLabel(acta, 'Aprobada'), action: () => openDoc('acta-constitucion') },
      { phase: 'plan', id: 'interesados', label: 'Registro de interesados', desc: '13.1 · Identifica a quienes influyen o se ven afectados por el proyecto.', done: nInter > 0, partial: !!inter, stateLabel: nInter ? nInter + (nInter === 1 ? ' interesado' : ' interesados') : inter ? 'Sin interesados registrados' : 'Pendiente', action: () => openDoc('registro-interesados') },
      { phase: 'plan', id: 'alcance', label: 'Enunciado del alcance', desc: '5.3 · Entregables, exclusiones y criterios de aceptación.', done: !!enunciado, stateLabel: enunciado ? PM.docStatus(enunciado.status).label : 'Pendiente', action: () => openDoc('enunciado-alcance') },
      { phase: 'plan', id: 'edt', label: 'EDT', desc: '5.4 · Desglosa el alcance en paquetes de trabajo.', done: nodes.length > 0, stateLabel: nodes.length ? nodes.length + ' elementos' : 'Pendiente', action: () => go('edt') },
      { phase: 'plan', id: 'cronograma', label: 'Cronograma', desc: '6.2–6.5 · Actividades, dependencias, duraciones y ruta crítica.', done: work.length > 0, stateLabel: work.length ? work.length + (work.length === 1 ? ' actividad' : ' actividades') : 'Pendiente', action: () => go('cronograma') },
      catalogStep(rs, mode),
      { phase: 'plan', id: 'presupuesto', label: 'Presupuesto (costos en actividades)', desc: '7.2–7.3 · Costo de cada actividad; su suma es el BAC.', done: bacNow > 0, stateLabel: bacNow > 0 ? 'BAC ' + moneyShort(bacNow, model.currency) : 'Pendiente', action: () => go('cronograma') },
      { phase: 'plan', id: 'riesgos', label: 'Registro de riesgos', desc: '11.2 · Amenazas y oportunidades con probabilidad e impacto.', done: nRisks > 0, partial: riesgos.length > 0, stateLabel: nRisks ? nRisks + (nRisks === 1 ? ' riesgo' : ' riesgos') : 'Pendiente', action: () => openDoc('registro-riesgos') },
      mode === 'adaptativo' ? null : breakdownStep({ docs, rs, bac: bacNow, nRisks }),
      { phase: 'plan', id: 'lineabase', label: 'Línea base', desc: '4.2 · Aprueba alcance, cronograma y costos como referencia del desempeño.', done: model.baselines.list.length > 0, stateLabel: latestBl ? latestBl.label + ' establecida' : 'Pendiente', action: () => (canWrite ? openEstablish() : go('lineas-base')) },
      { phase: 'control', id: 'avance', label: 'Registrar avance', desc: '4.3 / 4.5 · % de avance y costos reales a la fecha de corte.', done: progressed, stateLabel: progressed ? 'Con avance registrado' : 'Pendiente', action: () => go('cronograma') },
      { phase: 'control', id: 'informe', label: 'Informe de desempeño', desc: '4.5 · Comunica el avance, el valor ganado y los pronósticos de cada periodo.', done: repCurrent, partial: reports.length > 0,
        stateLabel: repCurrent ? 'Emitido · corte ' + fmt.date(issuedAt, 'dm') : repDraft ? PM.docStatus(repDraft.status).label : lastIssued ? 'Desactualizado · corte ' + fmt.date(issuedAt, 'dm') : 'Pendiente',
        action: () => openDoc(repDraft ? repDraft.id : repCurrent ? lastIssued.id : 'informe-desempeno') },
      { phase: 'control', id: 'cambios', label: 'Control de cambios', desc: '4.6 · Decide las solicitudes de cambio y lleva las aprobadas a una nueva línea base.', done: !!changesDoc && !pendingCh.length && !unbaselined.length, partial: !!changesDoc,
        stateLabel: !changesDoc ? 'Pendiente' : pendingCh.length ? pendingCh.length + (pendingCh.length === 1 ? ' pendiente de decisión' : ' pendientes de decisión') : unbaselined.length === 1 ? unbaselined[0].id + ' aprobada sin nueva línea base' : unbaselined.length ? unbaselined.length + ' aprobadas sin nueva línea base' : validCh.length ? 'Sin solicitudes pendientes' : 'Sin solicitudes',
        action: () => (!pendingCh.length && unbaselined.length && canWrite ? openEstablish() : openDoc('registro-cambios')) },
      { phase: 'control', id: 'entregables', label: 'Entregables aceptados', desc: '5.5 · El cliente acepta formalmente los entregables verificados.', done: ent.rows.length > 0 && ent.accepted === ent.rows.length, partial: !!ent.doc || nActas > 0,
        stateLabel: ent.rows.length ? ent.accepted + ' de ' + ent.rows.length + (ent.rows.length === 1 ? ' aceptado' : ' aceptados') : actasOk ? actasOk + (actasOk === 1 ? ' acta aprobada' : ' actas aprobadas') : ent.doc ? 'Sin entregables registrados' : 'Pendiente',
        action: () => openDoc('entregables') },
      { phase: 'control', id: 'informe-final', label: 'Informe final', desc: '4.7 · Resume el desempeño del alcance, el cronograma, los costos y la calidad.', done: isApproved(ifin), partial: !!ifin, stateLabel: docStateLabel(ifin, 'Aprobado'), action: () => openDoc('informe-final') },
      { phase: 'control', id: 'acta-cierre', label: 'Acta de cierre', desc: '4.7 · Formaliza la aceptación final y el cierre del proyecto.', done: isApproved(acie) && !blockers.length, partial: !!acie,
        stateLabel: isApproved(acie) && blockers.length ? 'Aprobada con pendientes' : docStateLabel(acie, 'Aprobada'),
        note: blockers.length ? (isApproved(acie) ? 'Se aprobó con pendientes: ' : 'Antes de aprobarla: ') + blockers.join(', ') + '.' : null, showNote: !!(acie || ifin),
        action: () => openDoc('acta-cierre') },
    ].filter(Boolean);
    let route = steps;
    if ((mode === 'hibrido' || mode === 'adaptativo') && PM.agile) {
      const ag = agileSteps({ model, docs, nodes });
      /* Kanban (flujo continuo, sin iteraciones): el tablero con límites WIP y la revisión periódica del flujo reemplazan a
         la primera iteración y a la revisión y retrospectiva de cada iteración */
      const startStep = ag.kanban ? ag.flujo : ag.iteracion;
      const reviewStep = ag.kanban ? ag.revisionFlujo : ag.revision;
      const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
      if (mode === 'hibrido') {
        /* híbrido: la ruta predictiva completa más el enfoque ágil después del alcance (EDT), la línea base del release junto
           a la del proyecto y, al empezar la ejecución, la primera iteración y la revisión y retrospectiva de cada iteración */
        route = [];
        for (const s of steps) {
          if (s.id === 'avance') route.push(startStep);
          route.push(s);
          if (s.id === 'edt') route.push(ag.enfoque, ag.vision, ag.backlog, ag.terminado, ag.releases);
          if (s.id === 'lineabase') route.push(ag.lbRelease);
          if (s.id === 'avance') route.push(reviewStep);
        }
      } else {
        /* adaptativo: los pasos predictivos esenciales (acta, interesados, riesgos, plan de gestión de cambios) y los ágiles */
        const planCambios = docs.get('plan-gestion-cambios');
        route = [byId.acta, byId.interesados, byId.riesgos,
          { phase: 'plan', id: 'plan-cambios', label: 'Plan de gestión de cambios', desc: '4.2 · Control de cambios en dos niveles: el backlog se ajusta libremente; el alcance, la fecha o el presupuesto del release, con solicitud de cambio.', done: isApproved(planCambios), partial: !!planCambios, stateLabel: docStateLabel(planCambios, 'Aprobado'), action: () => openDoc('plan-gestion-cambios') },
          ag.vision, ag.backlog, ag.terminado, catalogStep(rs, mode), ag.releases, ag.lbRelease, startStep, reviewStep,
          /* seguimiento y cierre: 4.5, 5.5 y 4.7 aplican a cualquier ciclo de vida */
          byId.informe, byId.entregables, byId['informe-final'], byId['acta-cierre']].filter(Boolean);
      }
    }
    return route.map((s) => ({ ...s, state: s.done ? 'done' : s.partial ? 'partial' : 'pending' }));
  }
  /* Pasos ágiles de la ruta sugerida (§9): cada uno se da por hecho con los datos del proyecto. */
  function agileSteps({ model, docs, nodes }) {
    const A = PM.agile;
    const data = model.agile || {};
    const settings = A.settings(data);
    const unit = A.unitShort(settings);
    const items = Array.isArray(model.agileItems) ? model.agileItems : [];
    const countable = items.filter(A.countable);
    const releases = agileReleases(data);
    const sprints = agileSprints(data);
    /* enfoque por entregable (nodos de la EDT con approach) */
    const nAdapt = nodes.filter((n) => n && n.approach === 'adaptativo').length;
    const nSet = nodes.filter((n) => n && (n.approach === 'adaptativo' || n.approach === 'predictivo')).length;
    const vision = docs.get('vision-producto');
    const ddt = docs.get('definicion-terminado');
    const ddtList = ddt && ddt.fields && Array.isArray(ddt.fields.definicionTerminado) ? ddt.fields.definicionTerminado.filter((x) => String(x || '').trim()) : [];
    const planRel = docs.get('plan-release');
    const est = countable.reduce((t, i) => t + A.estimate(i), 0);
    const withBl = releases.filter(hasRelBaseline);
    const committed = releases.filter((r) => r.status === 'comprometido' || r.status === 'en-curso');
    const started = sprints.filter((sp) => sp.status === 'en-curso' || sp.status === 'cerrado');
    const cur = sprints.find((sp) => sp.status === 'en-curso');
    const closed = sprints.filter((sp) => sp.status === 'cerrado');
    /* revisión y retrospectiva de una iteración: el documento enlazado en la iteración o uno de esa plantilla con su nombre */
    const ids = new Set(docs.list.map((d) => d.id));
    const hasDoc = (sp, kind, tid) => !!(sp.docs && sp.docs[kind] && ids.has(sp.docs[kind])) || (docs.byTemplate[tid] || []).some((d) => d.fields && norm(d.fields.iteracion) && norm(d.fields.iteracion) === norm(sp.name));
    const covered = closed.filter((sp) => hasDoc(sp, 'revision', 'acta-revision-sprint') && hasDoc(sp, 'retrospectiva', 'retrospectiva'));
    const anyEventDoc = (docs.byTemplate['acta-revision-sprint'] || []).length + (docs.byTemplate.retrospectiva || []).length > 0;
    /* Kanban: columnas guardadas por el equipo (no las de fábrica) con al menos un límite WIP */
    const kanban = settings.framework === 'kanban';
    const ownCols = isObj(data.settings) && Array.isArray(data.settings.columns) && data.settings.columns.some((c) => isObj(c) && c.id);
    const nWip = settings.columns.filter(PM.agile.wipLimit).length;
    /* Kanban: revisión del flujo o retrospectiva (actas de revisión o retrospectivas) en el último periodo (≈ un mes) */
    const reviews = [...(docs.byTemplate['acta-revision-sprint'] || []), ...(docs.byTemplate.retrospectiva || [])];
    const revDate = (d) => (d.fields && D.valid(d.fields.fecha) ? d.fields.fecha : String(d.updatedAt || d.createdAt || '').slice(0, 10));
    const lastRev = PM.sortBy(reviews, revDate, -1)[0] || null;
    const lastRevAt = lastRev ? revDate(lastRev) : null;
    const revCurrent = !!lastRev && (!D.valid(lastRevAt) || D.diff(lastRevAt, model.statusDate) <= 35);
    return {
      kanban,
      flujo: { phase: 'control', id: 'flujo-kanban', label: 'Configurar columnas y límites WIP', desc: 'Método Kanban · Columnas del flujo con políticas explícitas y un límite WIP para el trabajo en curso.', done: ownCols && nWip > 0, partial: ownCols || nWip > 0,
        stateLabel: ownCols ? settings.columns.length + ' columnas · ' + (nWip ? nWip + ' con límite WIP' : 'sin límite WIP') : 'Columnas por defecto (sin revisar)', action: () => go('kanban') },
      revisionFlujo: { phase: 'control', id: 'revision-flujo', label: 'Revisión periódica del flujo', desc: 'Método Kanban · Revisión del servicio y retrospectiva con cadencia fija: tiempo de ciclo, rendimiento, bloqueos y mejoras.', done: revCurrent, partial: !!lastRev,
        stateLabel: !lastRev ? 'Pendiente' : !D.valid(lastRevAt) ? 'Registrada' : (revCurrent ? 'Última: ' : 'Desactualizada · última: ') + fmt.date(lastRevAt, 'dm'), action: () => openDoc(lastRev ? lastRev.id : 'retrospectiva') },
      enfoque: { phase: 'plan', id: 'enfoque', label: 'Definir el enfoque por entregable en la EDT', desc: 'PMBOK® 7 · Qué entregables siguen en cascada y cuáles se desarrollan por iteraciones.', done: nAdapt > 0, partial: nSet > 0,
        stateLabel: nAdapt ? nAdapt + (nAdapt === 1 ? ' entregable adaptativo' : ' entregables adaptativos') : nodes.length ? 'Sin entregables adaptativos' : 'Pendiente (sin EDT)', action: () => go('edt') },
      vision: { phase: 'plan', id: 'vision', label: 'Visión del producto', desc: '5.2 · Para quién es el producto, qué necesidad resuelve y cómo se medirá el éxito.', done: !!vision, stateLabel: vision ? PM.docStatus(vision.status).label : 'Pendiente', action: () => openDoc('vision-producto') },
      backlog: { phase: 'plan', id: 'backlog', label: 'Backlog inicial', desc: '5.2 / 5.3 · Historias de usuario priorizadas con criterios de aceptación y estimación.', done: countable.length > 0, partial: items.length > 0,
        stateLabel: countable.length ? countable.length + (countable.length === 1 ? ' elemento' : ' elementos') + (est > 0 ? ' · ' + fpts(est, unit) : ' sin estimar') : items.length ? 'Solo épicas' : 'Pendiente', action: () => go('backlog') },
      terminado: { phase: 'plan', id: 'terminado', label: 'Definición de listo y de terminado', desc: '8.1 · Cuándo un elemento puede entrar a una iteración y cuándo se da por terminado.', done: !!ddt && ddtList.length > 0, partial: !!ddt,
        stateLabel: ddt ? (ddtList.length ? PM.docStatus(ddt.status).label + ' · ' + ddtList.length + (ddtList.length === 1 ? ' criterio' : ' criterios') : 'Sin criterios de terminado') : 'Pendiente', action: () => openDoc('definicion-terminado') },
      releases: { phase: 'plan', id: 'releases', label: 'Plan de releases', desc: '6.5 · Hoja de ruta: releases con objetivo, fechas, iteraciones y presupuesto.', done: releases.length > 0, partial: !!planRel,
        stateLabel: releases.length ? releases.length + (releases.length === 1 ? ' release' : ' releases') : planRel ? 'Plan sin releases creados' : 'Pendiente', action: () => go('iteraciones') },
      lbRelease: { phase: 'plan', id: 'linea-base-release', label: 'Fijar la línea base del release', desc: '4.6 · Congela alcance, fecha y presupuesto del release comprometido; cambiarlos requiere control de cambios.', done: withBl.length > 0 && committed.every(hasRelBaseline), partial: withBl.length > 0,
        stateLabel: releases.length ? withBl.length + ' de ' + releases.length + (releases.length === 1 ? ' release con línea base' : ' releases con línea base') : 'Pendiente', action: () => go('iteraciones') },
      iteracion: { phase: 'control', id: 'primera-iteracion', label: 'Planificar la primera iteración', desc: '4.3 · Objetivo, capacidad y elementos comprometidos; al iniciarla se fija el compromiso.', done: started.length > 0, partial: sprints.length > 0,
        stateLabel: cur ? (cur.name || 'Iteración') + ' en curso' : closed.length ? closed.length + (closed.length === 1 ? ' iteración cerrada' : ' iteraciones cerradas') : sprints.length ? 'Planeada: ' + (sprints[0].name || 'iteración') : 'Pendiente', action: () => go('iteraciones') },
      revision: { phase: 'control', id: 'revision-retro', label: 'Revisión y retrospectiva de cada iteración', desc: '5.5 / 4.4 · Acta de revisión del incremento y retrospectiva con acciones y lecciones aprendidas.', done: closed.length > 0 && covered.length === closed.length, partial: closed.length > 0 || anyEventDoc,
        stateLabel: closed.length ? covered.length + ' de ' + closed.length + (closed.length === 1 ? ' iteración cerrada documentada' : ' iteraciones cerradas documentadas') : 'Sin iteraciones cerradas', action: () => go('iteraciones') },
    };
  }
  /* n: número visible del paso (los opcionales no se numeran ni cuentan en el avance) */
  function RouteStep({ s, n, next }) {
    const optIcon = PM.ICONS && PM.ICONS.breakdown ? 'breakdown' : 'layers';
    return html`<li><button type="button" class="dashboard-step" data-step=${s.id} data-state=${s.state} data-optional=${s.optional ? 'true' : undefined} data-next=${next ? 'true' : undefined} onClick=${s.action}>
      <span class="dashboard-step-num" aria-hidden="true">${s.done ? html`<${ui.Icon} name="check" size=${14} stroke=${2.5} />` : s.optional ? html`<${ui.Icon} name=${optIcon} size=${13} />` : n}</span>
      <span class="dashboard-step-body">
        <span class="dashboard-step-title">${s.label}</span>
        <span class="dashboard-step-desc">${s.desc}</span>
        <span class="row" style="gap:6px">${s.optional ? html`<${ui.Chip} tone="outline" data-optional-chip>Opcional</${ui.Chip}>` : null}<${ui.Chip} tone=${s.done ? 'good' : s.state === 'partial' ? 'warn' : 'outline'}>${s.stateLabel}</${ui.Chip}>${next ? html`<span class="xsmall" style="color:var(--accent);font-weight:600">Siguiente paso</span>` : null}</span>
        ${s.note && (s.showNote || next) ? html`<span class="dashboard-step-note" data-step-note=${s.id}>${s.note}</span>` : null}
      </span>
    </button></li>`;
  }
  function RouteCard({ route, prominent, mode = 'predictivo', flow = false }) {
    const [open, setOpen] = useState(!!prominent);
    /* los pasos opcionales no cuentan en el avance ni son el «siguiente paso» */
    const req = route.filter((r) => !r.optional);
    const done = req.filter((r) => r.done).length;
    const nextIdx = route.findIndex((r) => !r.done && !r.optional);
    const complete = done === req.length;
    const planDone = req.filter((r) => r.phase === 'plan').every((r) => r.done);
    const ad = mode === 'adaptativo', hy = mode === 'hibrido';
    /* flow: Kanban (flujo continuo, sin iteraciones) */
    const work = flow ? 'gestionar el flujo' : 'iterar';
    const summary = complete ? (ad ? 'Completaste los ' + req.length + ' pasos de la ruta sugerida para el enfoque adaptativo, del acta de constitución al acta de cierre.' : 'Completaste los ' + req.length + ' pasos de la ruta de la Guía del PMBOK®' + (hy ? ' con el enfoque híbrido' : '') + ', del acta de constitución al acta de cierre.')
      : planDone ? done + ' de ' + req.length + ' pasos completados · planificación completa: ' + (ad ? (flow ? 'sigue gestionar el flujo con revisiones periódicas, informar el desempeño, aceptar los entregables y cerrar.' : 'sigue iterar con revisión y retrospectiva, informar el desempeño, aceptar los entregables y cerrar.') : hy ? 'sigue ' + work + ', monitorear, controlar y cerrar.' : 'sigue monitorear, controlar y cerrar.')
      : done + ' de ' + req.length + ' pasos completados · ' + (ad ? 'constituir el proyecto, preparar el backlog y los releases, ' + (flow ? 'gestionar el flujo' : 'iterar') + ', aceptar los entregables y cerrar.' : hy ? 'iniciar, planificar (en cascada y ' + (flow ? 'ágil' : 'por iteraciones') + '), establecer las líneas base, ' + work + ', controlar y cerrar.' : 'iniciar, planificar, establecer la línea base, controlar y cerrar.');
    return html`<section class=${cx('card dashboard-route', prominent && 'is-prominent')} data-card="route" data-prominent=${prominent ? 'true' : 'false'} data-mode=${mode}>
      <div class="dashboard-panel-head">
        <div class="stack-sm" style="gap:2px;min-width:0">
          <h3 class="h3">${prominent ? 'Ruta sugerida para arrancar el proyecto' : 'Ruta sugerida'}${MODE_LABEL[mode] ? html` <${ui.Chip} tone="info" icon="sprint" class="dashboard-mode-chip">${MODE_LABEL[mode]}</${ui.Chip}>` : null}</h3>
          <div class="xsmall faint" data-route-summary>${summary}</div>
        </div>
        <div class="row">
          <div class="dashboard-route-meter"><${ui.Meter} value=${req.length ? done / req.length : 0} tone=${complete ? 'good' : undefined} label="Pasos completados" /></div>
          ${!prominent ? html`<${ui.Button} size="sm" variant="ghost" icon=${open ? 'chevron-up' : 'chevron-down'} aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpen(!open)}>${open ? 'Ocultar pasos' : 'Mostrar pasos'}</${ui.Button}>` : null}
        </div>
      </div>
      ${open ? html`<${RouteSteps} route=${route} nextIdx=${nextIdx} mode=${mode} flow=${flow} />` : null}
    </section>`;
  }
  /* Pasos por fase en filas parejas que llegan al borde derecho: con el ancho disponible caben hasta `max` columnas de
     230 px; cada fase usa las filas necesarias y reparte sus pasos entre ellas (8 pasos en 7 columnas → 4 + 4; 6 pasos en
     9 columnas → 6). Sin medida (primer cuadro) rige la regla CSS auto-fit. */
  const STEP_MIN = 230, STEP_GAP = 8;
  const PHASE_LABELS = { adaptativo: { plan: 'Inicio y preparación del producto', control: 'Ejecución por iteraciones y cierre' }, hibrido: { plan: 'Inicio y planificación (en cascada y ágil)' } };
  const FLOW_PHASE_LABELS = { adaptativo: { plan: 'Inicio y preparación del producto', control: 'Ejecución en flujo continuo y cierre' } };
  function RouteSteps({ route, nextIdx, mode, flow }) {
    const ref = useRef();
    const w = useWidth(ref, 0);
    const max = w > 0 ? Math.max(1, Math.floor((w + STEP_GAP) / (STEP_MIN + STEP_GAP))) : 0;
    const labels = (flow && FLOW_PHASE_LABELS[mode]) || PHASE_LABELS[mode] || {};
    /* número visible de cada paso: los opcionales no se numeran (llevan el del paso anterior, que no se muestra) */
    const nums = []; let k = 0; for (const s of route) { if (!s.optional) k++; nums.push(Math.max(1, k)); }
    return html`<div class="card-body"><div class="stack" ref=${ref}>
      ${PHASES.map((p0) => {
        const ph = labels[p0.id] ? { ...p0, label: labels[p0.id] } : p0;
        const items = route.map((s, i) => ({ s, i, n: nums[i] })).filter((x) => x.s.phase === ph.id);
        if (!items.length) return null;
        /* los pasos opcionales van en su propia fila debajo de los de la fase (no cuentan ni rompen las filas parejas) */
        const reqItems = items.filter((x) => !x.s.optional);
        const optItems = items.filter((x) => x.s.optional);
        const n = reqItems.filter((x) => x.s.done).length;
        const cols = max && reqItems.length ? Math.ceil(reqItems.length / Math.ceil(reqItems.length / max)) : 0;
        const gridStyle = cols ? 'grid-template-columns:repeat(' + cols + ', minmax(0, 1fr))' : undefined;
        return html`<div class="stack-sm" key=${ph.id} data-phase=${ph.id}>
          <div class="dashboard-phase-head"><span class="label-caps">${ph.label}</span><span class="xsmall faint">${n} de ${reqItems.length}</span></div>
          ${reqItems.length ? html`<ol class="dashboard-steps" start=${reqItems[0].n} data-cols=${cols || undefined} style=${gridStyle}>${reqItems.map(({ s, i, n: k }) => html`<${RouteStep} key=${s.id} s=${s} n=${k} next=${i === nextIdx} />`)}</ol>` : null}
          ${optItems.length ? html`<div class="stack-sm" style="gap:4px" data-phase-optional=${ph.id}><span class="xsmall faint">Opcional: no cuenta en el avance de la ruta</span>
            <ul class="dashboard-steps is-optional" style=${gridStyle}>${optItems.map(({ s, i, n: k }) => html`<${RouteStep} key=${s.id} s=${s} n=${k} next=${false} />`)}</ul></div>` : null}
        </div>`;
      })}
    </div></div>`;
  }

  /* Sugerencia de estado del proyecto en los hitos del flujo (línea base → En ejecución; informe final o acta de cierre →
     En cierre; acta de cierre aprobada → Cerrado). El cambio lo hace el usuario; «Ahora no» la oculta en este navegador. */
  function statusSuggestion({ project, model, docs }) {
    const st = project.status || '';
    const acie = docs.get('acta-cierre');
    const ifin = docs.get('informe-final');
    if (isApproved(acie)) return st === 'Cerrado' ? null : { to: 'Cerrado', text: 'El acta de cierre está aprobada' };
    if ((acie || ifin) && ['Propuesta', 'En planificación', 'En ejecución'].includes(st)) return { to: 'En cierre', text: acie ? 'El acta de cierre está en elaboración' : 'El informe final está en elaboración' };
    const bl = model.baselines.latest;
    if (bl && ['Propuesta', 'En planificación'].includes(st)) return { to: 'En ejecución', text: 'La línea base ' + bl.label + ' ya está establecida' };
    return null;
  }
  function StatusHint({ project, model, docs }) {
    const sug = statusSuggestion({ project, model, docs });
    const key = 'dashboard.statusHint.' + project.id;
    const [dismissed, setDismissed] = useState(() => PM.prefs.get(key, null));
    const [busy, setBusy] = useState(false);
    if (!sug || dismissed === sug.to + '|' + (project.status || '')) return null;
    const apply = () => { setBusy(true); PM.projectOps.update(project.id, { status: sug.to }).then(() => PM.toast('Estado del proyecto: ' + sug.to + '.'), () => {}).then(() => setBusy(false)); };
    const later = () => { const v = sug.to + '|' + (project.status || ''); PM.prefs.set(key, v); setDismissed(v); };
    return html`<div class="dashboard-note dashboard-status-hint" role="status" data-status-hint=${sug.to}>
      <${ui.Icon} name="info" size=${16} />
      <div class="dashboard-status-hint-main">${sug.text}, pero el estado del proyecto sigue en «${project.status || 'Sin estado'}». ¿Lo cambias a «${sug.to}»?</div>
      <div class="dashboard-status-hint-actions">
        <${ui.Button} size="sm" variant="primary" disabled=${busy} onClick=${apply}>Cambiar a «${sug.to}»</${ui.Button}>
        <${ui.Button} size="sm" variant="ghost" onClick=${later}>Ahora no</${ui.Button}>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- vista: tablero */
  function TableroView({ project }) {
    const model = PM.useProjectModel();
    const docs = PM.useProjectDocs();
    const [riesgos, , rMeta] = PM.useDocTable('registro-riesgos', 'riesgos');
    const [incidentes, , iMeta] = PM.useDocTable('registro-incidentes', 'incidentes');
    const [cambios, , cMeta] = PM.useDocTable('registro-cambios', 'cambios');
    const canWrite = PM.useCanWrite();
    const p = model.project || project;
    /* recursos del proyecto (§10): catálogo y no planificados; se recalcula solo si cambian el catálogo, el cronograma o las reservas */
    const rs = useMemo(() => (model.loading ? null : resourceStats(model)), [model.loading, model.catalog, model.schedule, model.sched, model.resources, model.costs]);
    if (model.loading || docs.loading || rMeta.loading || iMeta.loading || cMeta.loading || !p) return html`<div class="page"><${ui.Loading} rows=${6} /></div>`;
    const mode = PM.agile ? PM.agile.mode(p) : 'predictivo';
    const route = buildRoute({ model, docs, riesgos, incidentes, cambios, canWrite, mode, rs });
    const prominent = route.filter((r) => r.done && !r.optional).length < 5;
    const agileOn = !!(PM.agile && PM.agile.enabled(p));
    const flow = agileOn && isKanbanFlow(model.agile);
    return html`<div class="page dashboard-page">
      <${ui.PageHeader} eyebrow="Tablero del proyecto · 4.5 Monitorear y controlar el trabajo del proyecto" title=${p.name}
        description=${p.description ? trunc(p.description, 260) : null}
        actions=${html`<${ui.Button} size="sm" icon=${canWrite ? 'edit' : 'eye'} onClick=${() => go('ficha')}>${canWrite ? 'Editar ficha' : 'Ver ficha'}</${ui.Button}>`} />
      <${TitleBlock} project=${p} />
      ${canWrite ? html`<${StatusHint} project=${p} model=${model} docs=${docs} />` : null}
      ${prominent ? html`<${RouteCard} route=${route} prominent mode=${mode} flow=${flow} />` : null}
      <${KpiRow} model=${model} />
      ${agileOn ? html`<${AgileCard} model=${model} project=${p} />` : null}
      ${rs && rs.unpl.n ? html`<${UnplannedCard} stats=${rs} currency=${model.currency} />` : null}
      <div class="dashboard-two">
        <${SCurveCard} model=${model} />
        <${MilestonesCard} model=${model} />
      </div>
      <div class="dashboard-two">
        <${RisksCard} rows=${riesgos} exists=${rMeta.exists} canWrite=${canWrite} />
        <div class="stack" style="gap:16px">
          <${IncidentsCard} rows=${incidentes} exists=${iMeta.exists} canWrite=${canWrite} statusDate=${model.statusDate} />
          <${ChangesCard} rows=${cambios} exists=${cMeta.exists} canWrite=${canWrite} currency=${model.currency} />
        </div>
      </div>
      <div class="dashboard-two">
        <${DocsCard} docs=${docs} project=${p} />
        <${BaselinesCard} model=${model} canWrite=${canWrite} />
      </div>
      ${!prominent ? html`<${RouteCard} route=${route} mode=${mode} flow=${flow} />` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- establecer línea base (modal) */
  function openEstablish(onDone) {
    PM.openModal((close) => html`<${EstablishBaseline} close=${close} onDone=${onDone} />`);
  }
  function EstablishBaseline({ close, onDone }) {
    const model = PM.useProjectModel();
    const docs = PM.useProjectDocs();
    const [cambios] = PM.useDocTable('registro-cambios', 'cambios');
    const st = PM.useAppState();
    const [inc, setInc] = useState({ scope: true, schedule: true, cost: true });
    const [note, setNote] = useState('');
    const [changeRef, setChangeRef] = useState('');
    const [busy, setBusy] = useState(false);
    const n = PM.calc.nextBaselineNumber(model.baselineDocs);
    const label = 'LB' + n;
    const includes = PARTS.map((p) => p.id).filter((k) => inc[k]);
    const approved = cambios.filter((r) => norm(r.estado) === 'aprobada' && String(r.id || '').trim());
    const chosen = approved.find((r) => r.id === changeRef) || null;
    const nodes = (model.wbs && model.wbs.nodes) || [];
    const tasks = model.sched.tasks;
    const ms = tasks.filter((t) => t.milestone).length;
    const bac = PM.sum(tasks, (t) => t.cost);
    const res = (model.costs && model.costs.reserves) || {};
    /* con consumo de la reserva por riesgos, la línea base congela la reserva del plan vigente (disponible + consumo sin
       actividad): lo asignado a actividades ya está en el BAC y no se cuenta dos veces (SPEC §10.3) */
    const pr = useMemo(() => planReserves(model.resources, model.sched, model.costs), [model.resources, model.sched, model.costs]);
    const reserveUsed = pr.consumed > 0;
    const cur = model.currency;
    const scopeDoc = docs.get('enunciado-alcance');
    const warnings = [];
    if (inc.scope && !nodes.length) warnings.push('La EDT está vacía: la línea base del alcance no tendrá paquetes de trabajo.');
    if (inc.schedule && !tasks.length) warnings.push('El cronograma no tiene actividades: la línea base del cronograma quedará vacía.');
    if (inc.cost && !(bac > 0)) warnings.push('Las actividades no tienen costo: la línea base de costos quedará en cero.');
    if (inc.schedule || inc.cost) for (const e of model.sched.errors || []) warnings.push(e.message);
    const canSubmit = includes.length > 0 && !busy && !model.loading && !!model.pid && st.canWrite;
    const submit = async () => {
      if (!canSubmit) return;
      setBusy(true);
      const costs = reserveUsed ? { ...model.costs, reserves: { ...res, contingency: pr.outside } } : model.costs;
      const snap = PM.calc.makeBaselineSnapshot({ includes, sched: model.sched, wbs: model.wbs, costs, scopeStatement: scopeDoc && scopeDoc.fields ? scopeDoc.fields : null });
      const body = { number: n, label, date: D.today(), includes, note: note.trim(), changeRef: changeRef || null, byId: st.meId || null, ...snap };
      if (new TextEncoder().encode(JSON.stringify(body)).length > 255 * 1024) {
        setBusy(false);
        PM.toast('La línea base supera el tamaño máximo de un registro (256 KB). Establece el alcance, el cronograma y los costos en líneas base separadas.', { tone: 'crit' });
        return;
      }
      const bid = PM.uid('bl');
      try {
        await PM.store.set(PM.paths.baseline(model.pid, bid), body);
        PM.touchProject(model.pid);
        PM.toast('Línea base ' + label + ' establecida.');
        close();
        if (onDone) onDone(bid);
      } catch (e) { setBusy(false); }
    };
    const row = (id, title, lines) => html`<div data-off=${inc[id] ? 'false' : 'true'} data-preview=${id}>
      <${ui.Icon} name=${inc[id] ? 'check-circle' : 'minus'} size=${16} style=${inc[id] ? 'color:var(--good)' : 'color:var(--fg-3)'} />
      <div class="stack-sm" style="gap:2px;min-width:0"><strong class="small">${title}${inc[id] ? '' : ' — no se incluye'}</strong>${lines.map((l, i) => html`<span key=${i} class="xsmall muted">${l}</span>`)}</div>
    </div>`;
    const footer = html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="layers" disabled=${!canSubmit} onClick=${submit}>${busy ? 'Guardando…' : 'Establecer ' + label}</${ui.Button}>`;
    return html`<${ui.Modal} title=${'Establecer línea base ' + label} subtitle="Guarda una instantánea aprobada de la planificación actual para medir el desempeño." size="wide" onClose=${close} footer=${footer}>
      <fieldset class="dashboard-fieldset">
        <legend class="field-label" style="margin-bottom:6px">Qué incluye</legend>
        ${PARTS.map((p) => html`<div key=${p.id}><${ui.Check} checked=${inc[p.id]} name=${'bl-' + p.id} onValue=${(v) => setInc((x) => ({ ...x, [p.id]: v }))} label=${html`<span><strong>${p.long}</strong> <span class="faint">· ${p.hint}</span></span>`} /></div>`)}
        ${!includes.length ? html`<div class="field-error">Selecciona al menos una parte para establecer la línea base.</div>` : null}
      </fieldset>
      <div class="stack-sm">
        <div class="label-caps">Se capturará</div>
        <div class="dashboard-preview">
          ${row('scope', 'Alcance', [nodes.length + ' elementos de la EDT (' + model.tree.leaves.size + ' paquetes de trabajo)', scopeDoc ? 'Enunciado del alcance: ' + PM.docStatus(scopeDoc.status).label.toLowerCase() : 'Sin enunciado del alcance: solo se guardará la EDT'])}
          ${row('schedule', 'Cronograma', [tasks.length - ms + ' actividades y ' + ms + ' hitos', tasks.length ? fmt.date(model.sched.start) + ' → ' + fmt.date(model.sched.finish) + ' · ' + fmt.num(model.sched.workdays) + ' días hábiles' : 'Sin fechas'])}
          ${row('cost', 'Costos', ['BAC ' + money(bac, cur), reserveUsed
            ? 'Reserva para contingencias ' + money(pr.outside, cur) + ': disponible ' + money(pr.available, cur) + (pr.unassigned > 0.5 ? ' + ' + money(pr.unassigned, cur) + ' de respuestas a riesgos sin actividad' : '') + ' (' + money(pr.consumed, cur) + ' de los ' + money(pr.total, cur) + ' del plan ya los consumieron recursos que responden a riesgos) · reserva de gestión ' + money(num(res.management), cur)
            : 'Reserva para contingencias ' + money(num(res.contingency), cur) + ' · reserva de gestión ' + money(num(res.management), cur)])}
        </div>
      </div>
      ${warnings.length ? html`<div class="dashboard-note warn" role="status"><${ui.Icon} name="alert" size=${16} /><div>Revisa antes de continuar:<ul>${warnings.map((w, i) => html`<li key=${i}>${w}</li>`)}</ul></div></div>` : null}
      <${ui.Field} label="Solicitud de cambio asociada" for="bl-change" hint=${n === 0 ? 'Opcional para la primera línea base (LB0), que se aprueba con el plan para la dirección del proyecto.' : 'La solicitud de cambio aprobada que autoriza modificar la línea base vigente.'}>
        <${ui.Select} id="bl-change" value=${changeRef} onValue=${setChangeRef} placeholder=${approved.length ? 'Ninguna' : 'No hay solicitudes aprobadas'} options=${approved.map((r) => ({ value: r.id, label: r.id + ' · ' + trunc(r.descripcion || 'Sin descripción', 70) }))} />
      </${ui.Field}>
      ${chosen ? html`<div class="dashboard-note" data-change-detail><${ui.Icon} name="info" size=${16} /><div><strong>${chosen.id}</strong> · ${chosen.descripcion || 'Sin descripción'}${(() => { const parts = [isNum(num(chosen.impactoCronograma, NaN)) ? signedNum(num(chosen.impactoCronograma)) + ' días en el cronograma' : null, isNum(num(chosen.impactoCosto, NaN)) ? signedMoney(num(chosen.impactoCosto), cur) + ' en costos' : null].filter(Boolean); return parts.length ? html`<div class="xsmall muted">Impacto aprobado: ${parts.join(' · ')}${chosen.fechaDecision ? ' · decisión del ' + fmt.date(chosen.fechaDecision) : ''}</div>` : null; })()}</div></div>` : null}
      ${n >= 1 && !changeRef ? html`<div class="dashboard-note warn" data-warn="change"><${ui.Icon} name="alert" size=${16} /><div class="stack-sm" style="gap:6px">
        <div>Según la Guía del PMBOK®, una línea base aprobada solo se modifica mediante el proceso Realizar el control integrado de cambios (4.6). Selecciona la solicitud de cambio aprobada que justifica ${label}.${approved.length ? '' : ' El registro de cambios no tiene solicitudes con estado «Aprobada».'}</div>
        ${!approved.length ? html`<div><${LinkBtn} label="Abrir registro de cambios" onClick=${() => { close(); openDoc('registro-cambios'); }} /></div>` : null}
      </div></div>` : null}
      <${ui.Field} label="Nota" for="bl-note" hint="Motivo o contexto, p. ej. «Plan aprobado por el patrocinador en el comité de arranque».">
        <${ui.TextArea} id="bl-note" value=${note} onValue=${setNote} rows=${2} />
      </${ui.Field}>
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- líneas base: comparación */
  function SummaryCell({ k, v, s, tone, attr }) {
    return html`<div data-summary=${attr}><span class="label-caps">${k}</span><span class="dashboard-summary-v" style=${toneStyle(tone)}>${v}</span>${s ? html`<span class="dashboard-summary-s">${s}</span>` : null}</div>`;
  }
  function ScheduleCompare({ bl, sched }) {
    const [onlyVar, setOnlyVar] = useState(false);
    const snap = bl.schedule || {};
    const cal = sched.cal;
    const blTasks = snap.tasks || [];
    const blMap = new Map(blTasks.map((t) => [t.id, t]));
    const rows = [];
    for (const t of sched.tasks) {
      const b = blMap.get(t.id);
      if (!b) rows.push({ id: t.id, kind: 'new', name: t.name, milestone: t.milestone, cStart: t.startDate, cFinish: t.finishDate });
      else rows.push({ id: t.id, kind: 'same', name: t.name || b.name, milestone: t.milestone, bStart: b.start, bFinish: b.finish, cStart: t.startDate, cFinish: t.finishDate, vStart: wdDiff(cal, b.start, t.startDate), vFinish: wdDiff(cal, b.finish, t.finishDate), progress: t.progress });
    }
    for (const b of blTasks) if (!sched.byId.has(b.id)) rows.push({ id: b.id, kind: 'removed', name: b.name, milestone: b.milestone, bStart: b.start, bFinish: b.finish });
    const finVar = sched.tasks.length ? wdDiff(cal, snap.finish, sched.finish) : null;
    const startVar = sched.tasks.length ? wdDiff(cal, snap.start, sched.start) : null;
    const late = rows.filter((r) => r.kind === 'same' && r.vFinish > 0).length;
    const early = rows.filter((r) => r.kind === 'same' && r.vFinish < 0).length;
    const nNew = rows.filter((r) => r.kind === 'new').length, nRem = rows.filter((r) => r.kind === 'removed').length;
    const shown = onlyVar ? rows.filter((r) => r.kind !== 'same' || r.vStart || r.vFinish) : rows;
    return html`<div class="stack" data-compare="schedule">
      <div class="dashboard-summary">
        <${SummaryCell} attr="finish" k="Fin del proyecto" v=${signedNum(finVar)} tone=${lateTone(finVar)} s=${fmt.date(snap.finish) + ' en ' + bl.label + ' → ' + (sched.tasks.length ? fmt.date(sched.finish) : '—') + ' vigente'} />
        <${SummaryCell} attr="start" k="Inicio del proyecto" v=${signedNum(startVar)} tone=${lateTone(startVar)} s=${fmt.date(snap.start) + ' → ' + (sched.tasks.length ? fmt.date(sched.start) : '—')} />
        <${SummaryCell} attr="late" k="Terminan después" v=${late} tone=${late ? 'warn' : null} s=${early + ' terminan antes'} />
        <${SummaryCell} attr="changes" k="Nuevas / eliminadas" v=${nNew + ' / ' + nRem} s=${'frente a ' + blTasks.length + ' actividades en ' + bl.label} />
      </div>
      <div class="row-between">
        <p class="xsmall muted" style="max-width:70ch">Variaciones en días hábiles según el calendario del proyecto (${calendarText(cal)}). Positivo: la fecha del cronograma vigente es posterior a la de la línea base.</p>
        <${ui.Check} checked=${onlyVar} onValue=${setOnlyVar} label="Solo actividades con variación o cambios" />
      </div>
      <div class="table-wrap"><table class="table table-tight dashboard-compare-table">
        <thead><tr><th>Actividad</th><th>Inicio ${bl.label}</th><th>Inicio vigente</th><th class="num">Var. inicio</th><th>Fin ${bl.label}</th><th>Fin vigente</th><th class="num">Var. fin</th><th>Estado</th></tr></thead>
        <tbody>
          ${shown.length === 0 ? html`<tr><td colspan="8" class="faint" style="padding:12px">${rows.length ? 'Ninguna actividad tiene variación frente a ' + bl.label + '.' : 'Ni la línea base ni el cronograma vigente tienen actividades.'}</td></tr>` : null}
          ${shown.map((r) => html`<tr key=${r.kind + r.id} data-task=${r.id} data-kind=${r.kind} class=${r.kind === 'removed' ? 'dashboard-row-removed' : ''}>
            <td>${r.milestone ? html`<${ui.Icon} name="milestone" size=${12} style="margin-right:4px;color:var(--fg-3)" />` : null}${r.name || 'Sin nombre'}</td>
            <td class="mono nowrap">${fmt.date(r.bStart, 'short')}</td>
            <td class="mono nowrap">${fmt.date(r.cStart, 'short')}</td>
            <td class="num mono" data-var="start">${r.kind === 'same' ? html`<${VarText} v=${r.vStart} />` : '—'}</td>
            <td class="mono nowrap">${fmt.date(r.bFinish, 'short')}</td>
            <td class="mono nowrap">${fmt.date(r.cFinish, 'short')}</td>
            <td class="num mono" data-var="finish">${r.kind === 'same' ? html`<${VarText} v=${r.vFinish} />` : '—'}</td>
            <td class="nowrap">${r.kind === 'new' ? html`<${ui.Chip} tone="info">Nueva</${ui.Chip}>` : r.kind === 'removed' ? html`<${ui.Chip} tone="warn">Eliminada</${ui.Chip}>` : r.progress >= 100 ? html`<${ui.Chip} tone="good">Terminada</${ui.Chip}>` : r.progress > 0 ? html`<${ui.Chip}>${fmt.pct100(r.progress)}</${ui.Chip}>` : html`<span class="faint xsmall">Sin iniciar</span>`}</td>
          </tr>`)}
        </tbody>
      </table></div>
    </div>`;
  }
  function CostCompare({ bl, sched, costs, resources, currency }) {
    const [onlyVar, setOnlyVar] = useState(false);
    const snap = bl.cost || {};
    const blTasks = snap.tasks || [];
    const blMap = new Map(blTasks.map((t) => [t.id, t]));
    const rows = [];
    for (const t of sched.tasks) {
      const b = blMap.get(t.id);
      if (!b) rows.push({ id: t.id, kind: 'new', name: t.name, cCost: num(t.cost), v: num(t.cost) });
      else rows.push({ id: t.id, kind: 'same', name: t.name || b.name, bCost: num(b.cost), cCost: num(t.cost), v: num(t.cost) - num(b.cost) });
    }
    for (const b of blTasks) if (!sched.byId.has(b.id)) rows.push({ id: b.id, kind: 'removed', name: b.name, bCost: num(b.cost), v: -num(b.cost) });
    const bacNow = PM.sum(sched.tasks, (t) => t.cost);
    const bacBl = num(snap.bac);
    /* reservas vigentes fuera del BAC (SPEC §10.3): contingencia disponible + consumo por riesgos sin actividad + gestión;
       lo consumido por recursos asignados a actividades ya está en el BAC vigente */
    const pr = useMemo(() => planReserves(resources, sched, costs), [resources, sched, costs]);
    const resBl = num(snap.contingency) + num(snap.management);
    const resNow = pr.outside + pr.management;
    const movedToBac = pr.consumed - pr.unassigned;
    const dBac = bacNow - bacBl;
    const shown = onlyVar ? rows.filter((r) => Math.abs(r.v) > 0.5) : rows;
    const vCell = (v) => html`<span class=${Math.abs(v) < 0.5 ? 'faint' : v > 0 ? 'dashboard-late' : 'dashboard-early'}>${Math.abs(v) < 0.5 ? '0' : signedMoney(v, currency)}</span>`;
    return html`<div class="stack" data-compare="cost">
      <div class="dashboard-summary">
        <${SummaryCell} attr="bac" k=${'BAC en ' + bl.label} v=${moneyShort(bacBl, currency)} s=${money(bacBl, currency)} />
        <${SummaryCell} attr="bac-now" k="BAC vigente (suma de actividades)" v=${moneyShort(bacNow, currency)} s=${money(bacNow, currency)} />
        <${SummaryCell} attr="bac-var" k="Variación del BAC" v=${Math.abs(dBac) < 0.5 ? '0' : signedMoney(dBac, currency)} tone=${Math.abs(dBac) < 0.5 ? null : dBac > 0 ? 'warn' : 'good'} s=${bacBl > 0 ? fmt.pct(dBac / bacBl, 1) + ' frente a ' + bl.label : ''} />
        <${SummaryCell} attr="reserves" k=${pr.consumed > 0 ? 'Reservas vigentes (contingencia disponible + gestión)' : 'Reservas (contingencia + gestión)'} v=${moneyShort(resNow, currency)} s=${'En ' + bl.label + ': ' + moneyShort(resBl, currency) + (movedToBac > 0.5 ? ' · ' + moneyShort(movedToBac, currency) + ' de la contingencia ya están en el BAC (recursos que responden a riesgos)' : '')} />
      </div>
      <div class="row-between">
        <p class="xsmall muted" style="max-width:70ch">Presupuesto vigente de cada actividad frente a la línea base de costos. Positivo: el presupuesto vigente es mayor que el de la línea base. Los costos reales y el valor ganado están en <button type="button" class="dashboard-link" onClick=${() => go('valor-ganado')}>Curva S y valor ganado</button>.</p>
        <${ui.Check} checked=${onlyVar} onValue=${setOnlyVar} label="Solo actividades con variación" />
      </div>
      <div class="table-wrap"><table class="table table-tight dashboard-compare-table">
        <thead><tr><th>Actividad</th><th class="num">Presupuesto ${bl.label}</th><th class="num">Presupuesto vigente</th><th class="num">Variación</th><th>Estado</th></tr></thead>
        <tbody>
          ${shown.length === 0 ? html`<tr><td colspan="5" class="faint" style="padding:12px">${rows.length ? 'Ninguna actividad cambió de presupuesto frente a ' + bl.label + '.' : 'No hay actividades con costo.'}</td></tr>` : null}
          ${shown.map((r) => html`<tr key=${r.kind + r.id} data-task=${r.id} data-kind=${r.kind} class=${r.kind === 'removed' ? 'dashboard-row-removed' : ''}>
            <td>${r.name || 'Sin nombre'}</td>
            <td class="num mono nowrap">${r.kind === 'new' ? '—' : money(r.bCost, currency)}</td>
            <td class="num mono nowrap">${r.kind === 'removed' ? '—' : money(r.cCost, currency)}</td>
            <td class="num mono nowrap">${vCell(r.v)}</td>
            <td class="nowrap">${r.kind === 'new' ? html`<${ui.Chip} tone="info">Nueva</${ui.Chip}>` : r.kind === 'removed' ? html`<${ui.Chip} tone="warn">Eliminada</${ui.Chip}>` : html`<span class="faint xsmall">En ${bl.label}</span>`}</td>
          </tr>`)}
        </tbody>
        <tfoot><tr><td style="background:var(--surface-2)"><strong>Total</strong></td><td class="num mono nowrap"><strong>${money(bacBl, currency)}</strong></td><td class="num mono nowrap"><strong>${money(bacNow, currency)}</strong></td><td class="num mono nowrap"><strong>${vCell(dBac)}</strong></td><td></td></tr></tfoot>
      </table></div>
    </div>`;
  }
  function ScopeCompare({ bl, tree, wbs, docs }) {
    const snapNodes = (bl.scope && bl.scope.wbs) || [];
    const snapTree = useMemo(() => PM.calc.wbsTree(snapNodes), [bl]);
    const cur = (wbs && wbs.nodes) || [];
    const curById = new Map(cur.map((n) => [n.id, n]));
    const added = tree.flat.filter((f) => !snapTree.byId.has(f.node.id));
    const removed = snapTree.flat.filter((f) => !curById.has(f.node.id));
    const renamed = snapTree.flat.filter((f) => curById.has(f.node.id) && String(curById.get(f.node.id).name || '').trim() !== String(f.node.name || '').trim());
    const moved = snapTree.flat.filter((f) => { const c = curById.get(f.node.id); return c && (c.parentId || null) !== (f.node.parentId || null); });
    const ss = bl.scope ? bl.scope.scopeStatement : null;
    const curDoc = docs.get('enunciado-alcance');
    const curFields = curDoc ? curDoc.fields || {} : null;
    const tpl = PM.templates && PM.templates['enunciado-alcance'];
    const fieldLabel = (k) => { if (tpl) for (const s of tpl.sections || []) for (const f of s.fields || []) if (f.key === k) return f.label; return k; };
    const changedKeys = ss && curFields ? [...new Set([...Object.keys(ss), ...Object.keys(curFields)])].filter((k) => !PM.equal(ss[k] ?? null, curFields[k] ?? null)) : [];
    const list = (items, render, empty) => (items.length ? html`<ul class="dashboard-scope-list">${items.map(render)}</ul>` : html`<p class="xsmall faint">${empty}</p>`);
    const noChange = !added.length && !removed.length && !renamed.length && !moved.length;
    return html`<div class="stack" data-compare="scope">
      <div class="dashboard-summary">
        <${SummaryCell} attr="nodes" k="Elementos de la EDT" v=${cur.length} s=${snapNodes.length + ' en ' + bl.label} />
        <${SummaryCell} attr="added" k="Agregados" v=${added.length} tone=${added.length ? 'warn' : null} />
        <${SummaryCell} attr="removed" k="Eliminados" v=${removed.length} tone=${removed.length ? 'warn' : null} />
        <${SummaryCell} attr="renamed" k="Renombrados / reubicados" v=${renamed.length + ' / ' + moved.length} tone=${renamed.length || moved.length ? 'warn' : null} />
      </div>
      ${noChange ? html`<div class="dashboard-note"><${ui.Icon} name="check-circle" size=${16} style="color:var(--good)" /><div>La EDT actual coincide con la línea base del alcance ${bl.label}.</div></div>` : html`<div class="grid cols-2">
        <div class="stack-sm"><div class="h4">Agregados después de ${bl.label}</div>${list(added, (f) => html`<li key=${f.node.id} data-added=${f.node.id}><span class="code-tag">${f.code}</span><span>${f.node.name || 'Sin nombre'}</span></li>`, 'Ninguno.')}</div>
        <div class="stack-sm"><div class="h4">Eliminados desde ${bl.label}</div>${list(removed, (f) => html`<li key=${f.node.id} data-removed=${f.node.id}><span class="code-tag">${f.code}</span><s class="faint">${f.node.name || 'Sin nombre'}</s></li>`, 'Ninguno.')}</div>
        <div class="stack-sm"><div class="h4">Renombrados</div>${list(renamed, (f) => html`<li key=${f.node.id} data-renamed=${f.node.id}><span class="code-tag">${tree.codes.get(f.node.id) || f.code}</span><span><s class="faint">${f.node.name || 'Sin nombre'}</s> → ${curById.get(f.node.id).name || 'Sin nombre'}</span></li>`, 'Ninguno.')}</div>
        <div class="stack-sm"><div class="h4">Reubicados en otra rama</div>${list(moved, (f) => html`<li key=${f.node.id}><span class="code-tag">${f.code} → ${tree.codes.get(f.node.id) || '—'}</span><span>${curById.get(f.node.id).name || 'Sin nombre'}</span></li>`, 'Ninguno.')}</div>
      </div>`}
      <div class="stack-sm">
        <div class="h4">Enunciado del alcance</div>
        <div class="row-between">
          <p class="small muted" data-scope-statement>${!ss ? (curDoc ? 'La línea base no incluyó el enunciado del alcance porque no existía cuando se estableció.' : 'Ni la línea base ni el proyecto tienen enunciado del alcance.') : !curDoc ? 'El enunciado del alcance se eliminó después de establecer la línea base.' : !changedKeys.length ? 'El enunciado del alcance no ha cambiado desde ' + bl.label + '.' : 'Campos modificados desde ' + bl.label + ': ' + changedKeys.map(fieldLabel).join(', ') + '.'}</p>
          ${curDoc || ss ? html`<${ui.Button} size="sm" variant="ghost" icon="file" onClick=${() => openDoc('enunciado-alcance')}>Abrir enunciado del alcance</${ui.Button}>` : null}
        </div>
      </div>
    </div>`;
  }
  function BaselineDetail({ bl, model, docs }) {
    const order = ['schedule', 'cost', 'scope'];
    const inc = bl.includes || [];
    const [tab, setTab] = useState(order.find((k) => inc.includes(k)) || 'schedule');
    const tabs = order.map((k) => ({ id: k, label: PARTS.find((p) => p.id === k).label + (inc.includes(k) ? '' : ' (no incluido)') }));
    const part = PARTS.find((p) => p.id === tab);
    return html`<section class="card" data-card="baseline-detail" data-bl=${bl.label}>
      <div class="dashboard-panel-head">
        <div class="stack-sm" style="gap:2px;min-width:0">
          <h3 class="h3">Comparación: ${bl.label} frente al estado actual</h3>
          <div class="xsmall faint">Establecida el ${fmt.date(bl.date, 'long')}${bl.note ? ' · ' + trunc(bl.note, 120) : ''}</div>
        </div>
      </div>
      <div class="card-body stack">
        <${ui.Tabs} tabs=${tabs} value=${tab} onChange=${setTab} />
        ${!inc.includes(tab) || !bl[tab] ? html`<div class="dashboard-note"><${ui.Icon} name="info" size=${16} /><div>${bl.label} no incluye la ${part.long.toLowerCase()}. ${model.baselines[tab] ? 'La vigente es ' + model.baselines[tab].label + '.' : 'El proyecto aún no tiene ' + part.long.toLowerCase() + '.'}</div></div>`
          : tab === 'schedule' ? html`<${ScheduleCompare} bl=${bl} sched=${model.sched} />`
          : tab === 'cost' ? html`<${CostCompare} bl=${bl} sched=${model.sched} costs=${model.costs} resources=${model.resources} currency=${model.currency} />`
          : html`<${ScopeCompare} bl=${bl} tree=${model.tree} wbs=${model.wbs} docs=${docs} />`}
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------- vista: líneas base */
  function LineasBaseView({ params }) {
    const model = PM.useProjectModel();
    const docs = PM.useProjectDocs();
    const [cambios] = PM.useDocTable('registro-cambios', 'cambios');
    const canWrite = PM.useCanWrite();
    const [selId, setSelId] = useState(params && params.id ? params.id : null);
    const detailRef = useRef();
    if (model.loading) return html`<div class="page"><${ui.Loading} rows=${5} /></div>`;
    const list = model.baselines.list;
    const sel = list.find((b) => b.id === selId) || list[0] || null;
    const establish = () => openEstablish((bid) => setSelId(bid));
    const select = (id) => { setSelId(id); setTimeout(() => { try { detailRef.current && detailRef.current.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }); } catch (e) { /* sin desplazamiento */ } }, 30); };
    const remove = async (b) => {
      const others = list.filter((x) => x.id !== b.id);
      const effects = PARTS.filter((p) => model.baselines[p.id] && model.baselines[p.id].id === b.id).map((p) => { const prev = others.find((x) => (x.includes || []).includes(p.id)); return p.long + ': ' + (prev ? 'pasará a regir ' + prev.label + '.' : 'el proyecto quedará sin línea base.'); });
      const ok = await PM.confirm({
        title: 'Eliminar ' + b.label,
        body: html`<div class="stack-sm">
          <p>Se eliminará la instantánea <strong>${b.label}</strong> del ${fmt.date(b.date, 'long')}. Esta acción no se puede deshacer.</p>
          ${effects.length ? html`<ul style="margin:0;padding-left:18px">${effects.map((e, i) => html`<li key=${i}>${e}</li>`)}</ul>` : html`<p class="small muted">No es la línea base vigente de ninguna parte, así que los cálculos actuales no cambian.</p>`}
          ${effects.length ? html`<p class="small muted">El valor ganado y las variaciones de cronograma y costos se recalcularán con la línea base que quede vigente o, si no queda ninguna, con el cronograma actual.</p>` : null}
          <p class="small muted">Las líneas base aprobadas son parte del registro del proyecto: elimina solo las que se crearon por error.</p>
        </div>`,
        confirmText: 'Eliminar línea base', tone: 'danger',
      });
      if (!ok) return;
      try { await PM.store.delete(PM.paths.baseline(model.pid, b.id)); PM.touchProject(model.pid); PM.toast(b.label + ' eliminada.'); if (selId === b.id) setSelId(null); } catch (e) { /* ya notificado */ }
    };
    const changeOf = (ref) => cambios.find((r) => r.id === ref) || null;
    const tasks = model.sched.tasks;
    const bacNow = PM.sum(tasks, (t) => t.cost);
    const header = html`<${ui.PageHeader} eyebrow="4.2 Desarrollar el plan para la dirección del proyecto · 4.6 Realizar el control integrado de cambios" title="Líneas base"
      description="Las líneas base del alcance, del cronograma y de costos forman la línea base para la medición del desempeño. Se establecen al aprobar la planificación y solo se modifican mediante solicitudes de cambio aprobadas."
      actions=${canWrite ? html`<${ui.Button} variant="primary" icon="layers" onClick=${establish}>Establecer línea base</${ui.Button}>` : null} />`;
    if (!list.length) {
      const nodes = ((model.wbs && model.wbs.nodes) || []).length;
      const ready = [
        { k: 'EDT', v: nodes ? nodes + ' elementos' : 'Vacía', ok: nodes > 0, view: 'edt', btn: 'Crear EDT' },
        { k: 'Cronograma', v: tasks.length ? tasks.length + ' actividades · fin ' + fmt.date(model.sched.finish) : 'Sin actividades', ok: tasks.length > 0, view: 'cronograma', btn: 'Crear cronograma' },
        { k: 'Presupuesto (BAC)', v: bacNow > 0 ? money(bacNow, model.currency) : 'Sin costos', ok: bacNow > 0, view: 'cronograma', btn: 'Asignar costos' },
      ];
      return html`<div class="page">${header}
        <${ui.Empty} icon="layers" title="Aún no hay líneas base" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="layers" onClick=${establish}>Establecer línea base</${ui.Button}>` : null}>
          Una línea base es la versión aprobada del alcance (EDT), del cronograma y del presupuesto. Establécela al terminar la planificación: con ella se miden las variaciones, el valor ganado y el impacto de cada cambio. La primera es LB0; las siguientes requieren una solicitud de cambio aprobada.
        </${ui.Empty}>
        <section class="card" data-card="readiness">
          <div class="dashboard-panel-head"><div class="stack-sm" style="gap:2px"><h3 class="h3">Estado actual de la planificación</h3><div class="xsmall faint">Esto es lo que se capturaría si estableces la línea base ahora.</div></div></div>
          <div class="dashboard-active">${ready.map((r) => html`<div key=${r.k}><span class="label-caps">${r.k}</span><span class="row" style="gap:6px"><${ui.Icon} name=${r.ok ? 'check-circle' : 'alert'} size=${15} style=${r.ok ? 'color:var(--good)' : 'color:var(--warn)'} /><strong class="small">${r.v}</strong></span>${!r.ok && canWrite ? html`<div><${LinkBtn} label=${r.btn} onClick=${() => go(r.view)} /></div>` : null}</div>`)}</div>
        </section>
      </div>`;
    }
    return html`<div class="page">${header}
      <section class="card" data-card="active-baselines">
        <div class="dashboard-panel-head"><div class="stack-sm" style="gap:2px"><h3 class="h3">Líneas base vigentes</h3><div class="xsmall faint">La más reciente que incluye cada parte es la que rige el control del desempeño.</div></div></div>
        <div class="dashboard-active">${PARTS.map((p) => { const b = model.baselines[p.id]; return html`<div key=${p.id} data-active=${p.id}>
          <span class="label-caps">${p.long}</span>
          ${b ? html`<span class="row" style="gap:6px"><span class="mono" style="font-weight:700;font-size:var(--fs-lg)">${b.label}</span><span class="xsmall muted">${fmt.date(b.date)}</span></span><span class="xsmall muted">${partDetail(p.id, b, model.currency)}</span>` : html`<span class="small muted">Sin línea base</span><span class="xsmall faint">${p.hint}</span>`}
        </div>`; })}</div>
      </section>
      <div class="stack-sm">
        <div class="section-head"><h2 class="h3">Historial de líneas base</h2><span class="xsmall faint">${list.length} ${list.length === 1 ? 'registrada' : 'registradas'} · la más reciente primero</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Línea base</th><th>Fecha</th><th>Incluye</th><th>Nota</th><th>Solicitud de cambio</th><th>Registrada por</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>${list.map((b) => {
            const ch = b.changeRef ? changeOf(b.changeRef) : null;
            const activeFor = PARTS.filter((p) => model.baselines[p.id] && model.baselines[p.id].id === b.id).map((p) => p.id);
            return html`<tr key=${b.id} data-bl=${b.label} class=${cx('clickable', sel && sel.id === b.id && 'dashboard-row-sel')} onClick=${(e) => { if (e.target.closest('.dashboard-noclick')) return; select(b.id); }}>
              <td class="nowrap"><span class="mono" style="font-weight:700">${b.label}</span>${activeFor.length ? html` <${ui.Chip} tone="good">Vigente</${ui.Chip}>` : null}</td>
              <td class="nowrap mono">${fmt.date(b.date)}</td>
              <td style="min-width:236px"><div class="row" style="gap:4px">${PARTS.filter((p) => (b.includes || []).includes(p.id)).map((p) => html`<${ui.Chip} key=${p.id} tone=${activeFor.includes(p.id) ? 'accent' : 'outline'} title=${activeFor.includes(p.id) ? 'Vigente' : 'Reemplazada por una línea base posterior'}>${p.label}</${ui.Chip}>`)}</div></td>
              <td style="min-width:160px;max-width:320px">${b.note ? html`<span class="small">${b.note}</span>` : html`<span class="faint">—</span>`}</td>
              <td style="min-width:150px;max-width:260px">${b.changeRef ? html`<span class="code-tag">${b.changeRef}</span>${ch ? html` <span class="small">${trunc(ch.descripcion, 48)}</span>` : html` <span class="xsmall faint">(ya no está en el registro)</span>`}` : b.number >= 1 ? html`<${ui.Chip} tone="warn">Sin solicitud de cambio</${ui.Chip}>` : html`<span class="faint">Ninguna</span>`}</td>
              <td class="nowrap">${b.byId ? html`<${ui.Person} id=${b.byId} />` : html`<span class="faint">No registrado</span>`}</td>
              <td class="dashboard-noclick nowrap"><div class="row" style="gap:2px;flex-wrap:nowrap">
                <${ui.Button} size="sm" variant="ghost" icon="compare" onClick=${() => select(b.id)} aria-pressed=${sel && sel.id === b.id ? 'true' : 'false'}>Comparar</${ui.Button}>
                ${canWrite ? html`<${ui.IconButton} size="sm" icon="trash" label=${'Eliminar ' + b.label} onClick=${() => remove(b)} />` : null}
              </div></td>
            </tr>`;
          })}</tbody>
        </table></div>
      </div>
      <div ref=${detailRef} style="scroll-margin-top:72px">${sel ? html`<${BaselineDetail} key=${sel.id} bl=${sel} model=${model} docs=${docs} />` : null}</div>
    </div>`;
  }

  /* ---------------------------------------------------------------- vista: ficha del proyecto */
  function ReadOnlyMeta({ project: p }) {
    const items = [
      ['Nombre', p.name], ['Código', p.code], ['Cliente', p.client], ['Patrocinador', p.sponsor], ['Director del proyecto', p.manager],
      ['Fecha de inicio', D.valid(p.start) ? fmt.date(p.start, 'long') : null], ['Fecha de fin prevista', D.valid(p.end) ? fmt.date(p.end, 'long') : null],
      ['Presupuesto aprobado', isNum(p.budget) ? money(p.budget, p.currency || 'COP') : null], ['Moneda', p.currency], ['Estado', p.status], ['Ciclo de vida', p.lifecycle],
      ['Ubicación / obra', p.location], ['Descripción', p.description],
    ];
    return html`<dl class="dashboard-dl" data-readonly-meta>${items.map(([k, v]) => html`<dt key=${'k' + k}>${k}</dt><dd key=${'v' + k} style="white-space:pre-wrap">${v || html`<span class="faint">—</span>`}</dd>`)}</dl>`;
  }
  function CalendarCard({ project, schedule, exists, canWrite }) {
    const settings = (schedule && schedule.settings) || {};
    const ww = workweekOf(settings);
    const co = settings.holidaysCO !== false;
    const extra = (settings.extraHolidays || []).filter(D.valid).sort();
    const cal = useMemo(() => PM.cal.make(settings, project.start), [schedule, project.start]);
    const span = D.valid(project.start) && D.valid(project.end) && project.end >= project.start;
    const workdays = span ? cal.countWork(project.start, project.end) : null;
    const from = PM.statusDateOf(project);
    const holidays = useMemo(() => {
      if (!co || !D.valid(project.start)) return [];
      const end = span ? project.end : D.addMonths(project.start, 12);
      const out = [];
      for (let y = +project.start.slice(0, 4); y <= +end.slice(0, 4); y++) for (const h of D.holidaysCO(y)) { const w = D.dow(h.date); const workday = ww === 7 || (ww === 6 ? w !== 0 : w !== 0 && w !== 6); if (h.date >= project.start && h.date <= end && workday) out.push(h); }
      return out;
    }, [co, ww, project.start, project.end]);
    const upcoming = holidays.filter((h) => h.date >= from).slice(0, 3);
    return html`<${Panel} title="Calendario laboral" subtitle="Se usa para el cronograma, la ruta crítica y las variaciones" actions=${html`<${ViewBtn} label=${canWrite ? 'Configurar en el cronograma' : 'Ver cronograma'} view="cronograma" />`} data-card="calendar">
      <div class="card-body stack-sm">
        ${!exists ? html`<p class="xsmall faint">El cronograma aún no tiene configuración propia; se usan los valores predeterminados.</p>` : null}
        <dl class="dashboard-dl is-stacked">
          <dt>Semana laboral</dt><dd data-cal="workweek">${WORKWEEK[ww]}</dd>
          <dt>Festivos de Colombia</dt><dd>${co ? 'Se descuentan (Ley 51 de 1983)' : 'No se descuentan'}</dd>
          <dt>No laborables adicionales</dt><dd>${extra.length ? extra.slice(0, 4).map((d) => fmt.date(d, 'short')).join(', ') + (extra.length > 4 ? ' y ' + (extra.length - 4) + ' más' : '') : html`<span class="faint">Ninguno</span>`}</dd>
          <dt>Días hábiles del proyecto</dt><dd>${workdays !== null ? fmt.num(workdays) + ' (inicio → fin previsto)' : html`<span class="faint">Define el inicio y el fin previsto</span>`}</dd>
          ${co ? html`<dt>Festivos en días laborables</dt><dd>${holidays.length ? holidays.length + (span ? ' dentro del proyecto' : ' en los próximos 12 meses') : 'Ninguno'}</dd>` : null}
          ${upcoming.length ? html`<dt>Próximos festivos</dt><dd><div class="stack-sm" style="gap:2px">${upcoming.map((h) => html`<span key=${h.date}><span class="mono xsmall">${fmt.date(h.date, 'dow')}</span> · ${h.name}</span>`)}</div></dd>` : null}
        </dl>
      </div>
    </${Panel}>`;
  }
  function FichaView({ project }) {
    const canWrite = PM.useCanWrite();
    const st = PM.useAppState();
    const [schedule, , sMeta] = PM.useToolData('schedule', PM.EMPTY.schedule);
    const { projects } = PM.useProjects();
    const [busy, setBusy] = useState(null);
    const formRef = useRef();
    /* El formulario compartido enfoca el nombre al montarse; en la ficha eso abre el teclado en móviles
       y salta el encabezado. Se retira ese foco inicial si el usuario aún no ha interactuado. */
    useEffect(() => {
      let raf = 0, n = 0, touched = false;
      const mark = () => { touched = true; };
      const stop = () => { cancelAnimationFrame(raf); document.removeEventListener('pointerdown', mark, true); document.removeEventListener('keydown', mark, true); };
      document.addEventListener('pointerdown', mark, true); document.addEventListener('keydown', mark, true);
      const tick = () => {
        const el = document.activeElement;
        if (!touched && el && el.id === 'pf-name' && formRef.current && formRef.current.contains(el)) { el.blur(); stop(); return; }
        if (touched || ++n >= 6) { stop(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return stop;
    }, [project.id]);
    const initial = useMemo(() => { const o = {}; for (const k of META_KEYS) if (project[k] !== undefined && project[k] !== null) o[k] = project[k]; return o; }, [project.id]);
    const save = async (data) => {
      const patch = {};
      for (const k of META_KEYS) if (data[k] !== undefined) patch[k] = data[k];
      try { await PM.projectOps.update(project.id, patch); PM.toast('Cambios guardados en la ficha del proyecto.'); } catch (e) { /* ya notificado */ }
    };
    const duplicate = async () => {
      const name = await PM.promptText({ title: 'Duplicar proyecto', label: 'Nombre de la copia', value: project.name + ' (copia)', confirmText: 'Duplicar proyecto' });
      if (!name) return;
      setBusy('dup');
      try { const id = await PM.runWithProgress('Duplicando el proyecto', (onProgress) => PM.projectOps.duplicate(project.id, name, { onProgress })); if (!id) return; PM.toast('Proyecto duplicado. Revisa el código y los datos de la copia.'); PM.selectProject(id, 'ficha'); }
      catch (e) { PM.toast('No se pudo duplicar el proyecto. Intenta de nuevo.', { tone: 'crit' }); setBusy(null); }
    };
    const exportFile = async () => { setBusy('exp'); try { await PM.exportProjectFile(project.id, project); } finally { setBusy(null); } };
    return html`<div class="page">
      <${ui.PageHeader} eyebrow="Proyecto · datos generales" title="Ficha del proyecto" description="Datos de identificación del proyecto. El nombre, el cliente, el director y las fechas se usan como valores iniciales en los documentos y en el tablero." />
      <div class="split">
        <section class="card" data-card="meta">
          <div class="dashboard-panel-head"><div class="stack-sm" style="gap:2px"><h3 class="h3">Datos del proyecto</h3><div class="xsmall faint">Creado ${fmt.datetime(project.createdAt)} · actualizado ${fmt.datetime(project.updatedAt)}${project.createdBy ? html` · por <${ui.Person} id=${project.createdBy} />` : ''}</div></div></div>
          <div class="card-body" ref=${formRef}>${canWrite ? html`<${PM.ProjectForm} key=${project.id} initial=${initial} projects=${projects.filter((x) => x.id !== project.id)} submitText="Guardar cambios" onSubmit=${save} />` : html`<${ReadOnlyMeta} project=${project} />`}</div>
        </section>
        <div class="stack" style="gap:16px">
          <${Panel} title="Fecha de corte" subtitle="Fecha a la que se mide el avance" data-card="status-date">
            <div class="card-body stack-sm">
              <${StatusDateControl} project=${project} />
              <p class="xsmall muted">El valor ganado, los índices SPI y CPI, los hitos vencidos y la línea de corte de la curva S se calculan a esta fecha. Actualízala cada vez que registres avance.</p>
            </div>
          </${Panel}>
          <${CalendarCard} project=${project} schedule=${schedule} exists=${sMeta.exists} canWrite=${canWrite} />
          <${Panel} title="Almacenamiento" data-card="storage">
            <div class="card-body"><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><${ui.Icon} name=${st.mode === 'db' ? 'cloud' : 'device'} size=${18} style="color:var(--fg-2);margin-top:2px" />
              <p class="small" data-storage=${st.mode}>${st.mode === 'db' ? 'Los datos de este proyecto se guardan en el artefacto y los ven todas las personas con acceso. Cada cambio se guarda automáticamente.' : st.mode === 'local' ? 'Los datos se guardan solo en este navegador. Exporta el proyecto con regularidad para respaldarlo o llevarlo a otro equipo.' : 'Conectando con el almacenamiento…'}</p></div></div>
          </${Panel}>
          <${Panel} title=${canWrite ? 'Respaldo y copia' : 'Exportar'} data-card="backup">
            <div class="dashboard-danger-row"><div><div class="h4">Exportar proyecto (.json)</div><div class="xsmall muted">Copia completa con documentos, revisiones, herramientas y líneas base. Sirve de respaldo o para importarlo en otro navegador.</div></div><${ui.Button} size="sm" icon="download" disabled=${busy === 'exp'} onClick=${exportFile}>Exportar (.json)</${ui.Button}></div>
            ${canWrite ? html`<div class="dashboard-danger-row"><div><div class="h4">Duplicar proyecto</div><div class="xsmall muted">Crea una copia independiente con todos sus datos, útil como punto de partida para un proyecto similar.</div></div><${ui.Button} size="sm" icon="copy" disabled=${busy === 'dup'} onClick=${duplicate}>${busy === 'dup' ? 'Duplicando…' : 'Duplicar proyecto'}</${ui.Button}></div>` : null}
          </${Panel}>
          ${canWrite ? html`<${Panel} title="Eliminar proyecto" class="dashboard-danger" data-card="danger">
            <div class="dashboard-danger-row"><div class="xsmall muted">Elimina de forma permanente el proyecto y todos sus documentos, herramientas y líneas base. Esta acción no se puede deshacer: exporta antes una copia si la necesitas.</div><${ui.Button} size="sm" variant="danger" icon="trash" onClick=${() => PM.deleteProjectFlow(project)}>Eliminar proyecto</${ui.Button}></div>
          </${Panel}>` : null}
        </div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- registro de vistas */
  PM.registerView({ id: 'tablero', label: 'Tablero del proyecto', group: 'proyecto', icon: 'dashboard', order: 10, needsProject: true, component: TableroView, description: 'Avance, desempeño, hitos, riesgos, cambios y documentación del proyecto.' });
  PM.registerView({ id: 'lineas-base', label: 'Líneas base', group: 'proyecto', icon: 'layers', order: 40, needsProject: true, component: LineasBaseView, description: 'Establece y compara las líneas base del alcance, del cronograma y de costos.' });
  PM.registerView({ id: 'ficha', label: 'Ficha del proyecto', group: 'proyecto', icon: 'settings', order: 50, needsProject: true, component: FichaView, description: 'Datos generales, fecha de corte, calendario y opciones del proyecto.' });
})();

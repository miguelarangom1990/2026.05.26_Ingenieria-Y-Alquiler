/* ==========================================================================
   40-schedule.js — Gestión del cronograma y de los recursos:
   vista «cronograma» (Gantt, actividades, hitos, calendario laboral),
   vista «red» (diagrama de red PDM y cálculo de la ruta crítica) y
   vista «recursos» (histograma, sobreasignaciones y matriz de asignación).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const D = PM.date;
  const cx = PM.cx;
  const num = PM.num;
  const fmt = PM.fmt;

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.sched-strip { display: flex; flex-wrap: wrap; overflow: hidden; }
.sched-strip > .stat { flex: 1 1 116px; padding: 10px 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); margin: 0 -1px -1px 0; }
.sched-strip > .sched-stat-fc { flex: 2 1 232px; }
.sched-strip .stat-value { font-size: 1.12rem; white-space: nowrap; }
.sched-strip .stat-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sched-fc-swatch { width: 16px; height: 9px; border-radius: 2px; border: 1px dashed var(--signal); background: repeating-linear-gradient(135deg, var(--signal) 0 1px, transparent 1px 4px); }
.sched-fcnote { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-xs); color: var(--fg-2); margin: 0; }
.sched-fcnote .sched-fc-swatch { margin-top: 3px; flex: none; }
.sched-banner { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--warn); background: var(--warn-wash); color: var(--fg); border-radius: var(--r-md); font-size: var(--fs-sm); }
.sched-banner .icon { color: var(--warn); margin-top: 2px; }
.sched-note { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-sm); color: var(--fg-2); background: var(--info-wash); border-radius: var(--r-md); padding: 8px 12px; }
.sched-note .icon { color: var(--info); margin-top: 2px; }
.sched-tools { display: flex; flex-direction: column; align-items: stretch; gap: 0; padding: 0; }
.sched-tools > .row { padding: 7px 10px; }
.sched-tools > .row + .row { border-top: 1px solid var(--line); }
.sched-lblsel { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); color: var(--fg-2); }
.sched-lblsel select { width: auto; min-height: 26px; padding: 2px 26px 2px 8px; font-size: var(--fs-xs); }
.sched-frame { position: relative; overflow: auto; max-height: min(74vh, 960px); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); overscroll-behavior: contain; }
.sched-inner { position: relative; }
.sched-headrow { position: sticky; top: 0; z-index: 4; display: flex; }
.sched-bodyrow { display: flex; }
.sched-ghead { position: sticky; left: 0; z-index: 5; flex: none; display: grid; align-items: end; background: var(--surface-2); border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line); }
.sched-ghead > div { font-size: 0.72rem; font-weight: 600; color: var(--fg-2); padding: 0 5px 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sched-ghead > .num { text-align: right; }
.sched-grid { position: sticky; left: 0; z-index: 3; flex: none; background: var(--surface); border-right: 1px solid var(--line-strong); }
.sched-row { display: grid; align-items: center; height: 30px; border-bottom: 1px solid var(--grid); font-size: 0.78rem; background: var(--surface); }
.sched-row > * { min-width: 0; }
.sched-row.is-sum { background: var(--surface-2); font-weight: 600; }
.sched-row.is-sel { background: var(--accent-wash); }
.sched-row.is-crit .sched-n { color: var(--crit); font-weight: 600; }
.sched-ro { padding: 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--fg-2); }
.sched-ro.num { text-align: right; font-variant-numeric: tabular-nums; }
.sched-mono, .sched-cell.sched-mono { font-family: var(--font-mono); font-size: 0.72rem; }
.sched-cell { display: flex; align-items: center; gap: 4px; width: 100%; min-height: 26px; padding: 2px 6px; border: 1px solid transparent; border-radius: var(--r-sm); background: transparent; color: var(--fg); text-align: left; cursor: text; font-size: inherit; font-weight: inherit; white-space: nowrap; overflow: hidden; line-height: 1.3; }
.sched-cell > .sched-txt { overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1 1 auto; }
.sched-cell.num { justify-content: flex-end; font-variant-numeric: tabular-nums; }
.sched-cell.num > .sched-txt { flex: 0 1 auto; }
.sched-cell:hover { border-color: var(--line-strong); background: var(--surface); }
.sched-cell.ro { cursor: default; }
.sched-cell.ro:hover { border-color: transparent; background: transparent; }
.sched-cell .icon { color: var(--fg-3); }
.sched-pin { width: 6px; height: 6px; border-radius: 50%; background: var(--signal); flex: none; }
@media (max-width: 600px) { .sched-strip .stat-value { font-size: 1rem; } .sched-strip > .stat { padding: 8px 10px; } }
.sched-edit { position: relative; }
.sched-input { width: 100%; height: 26px; padding: 2px 5px; border: 1px solid var(--accent); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); font-size: var(--fs-sm); box-shadow: 0 0 0 2px var(--accent-wash); font-size: inherit; }
.sched-input:focus { outline: none; }
.sched-input[aria-invalid="true"] { border-color: var(--crit); box-shadow: 0 0 0 2px var(--crit-wash); }
.sched-err { position: absolute; z-index: 8; left: 0; top: calc(100% + 3px); width: max-content; max-width: 280px; padding: 5px 8px; border: 1px solid var(--crit); border-radius: var(--r-sm); background: var(--surface); color: var(--crit); font-size: var(--fs-xs); font-weight: 400; line-height: 1.35; white-space: normal; box-shadow: var(--shadow-pop); }
.sched-name { display: flex; align-items: center; gap: 2px; min-width: 0; }
.sched-name .sched-ms-ico { color: var(--fg-2); flex: none; }
.sched-name > .sched-cell, .sched-name > .sched-edit { flex: 1 1 auto; min-width: 0; }
.sched-tog { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; background: transparent; color: var(--fg-2); border-radius: var(--r-sm); cursor: pointer; padding: 0; flex: none; }
.sched-tog:hover { background: var(--surface-3); color: var(--fg); }
.sched-svg { display: block; overflow: visible; }
.sched-svg text { font-family: var(--font-body); font-size: 11px; fill: var(--fg-2); }
.sched-svg .sched-lbl { pointer-events: none; paint-order: stroke; stroke: var(--surface); stroke-width: 3px; stroke-linejoin: round; }
.sched-svg .sched-lbl-sum { fill: var(--fg); font-weight: 600; }
.sched-svg .sched-mark { font-size: 10.5px; font-weight: 600; fill: var(--signal-ink); }
.sched-svg .sched-faint { fill: var(--fg-3); }
.sched-bar { cursor: grab; touch-action: pan-y; }
.sched-bar.ro { cursor: pointer; }
.sched-bar.is-drag { cursor: grabbing; }
.sched-handle { cursor: ew-resize; }
.sched-tipgrid { display: grid; grid-template-columns: auto auto; gap: 2px 12px; margin-top: 4px; }
.sched-tipgrid > span:nth-child(odd) { color: var(--fg-3); }
.sched-tipgrid > span:nth-child(even) { font-variant-numeric: tabular-nums; }
.sched-legend .swatch { width: 16px; height: 9px; }
.sched-tbl td { white-space: nowrap; vertical-align: middle; }
.sched-tbl td.wrap { white-space: normal; min-width: 180px; }
.sched-tbl tr.is-sel td { background: var(--accent-wash); }
.sched-tbl td.edit { padding: 2px 4px; }
.sched-mstbl th { white-space: normal; vertical-align: bottom; line-height: 1.3; }
.sched-kv { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 16px; padding: 10px 12px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-md); }
.sched-kv > div { display: flex; flex-direction: column; gap: 1px; }
.sched-kv .k { font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-3); font-weight: 600; }
.sched-kv .v { font-family: var(--font-mono); font-size: var(--fs-sm); }
.sched-sub { display: grid; gap: 6px; }
.sched-subrow { display: grid; gap: 6px; align-items: center; }
.sched-subrow.deps { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.6fr) minmax(0, 0.9fr) 32px; }
.sched-subrow.res { grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr) 32px; }
.sched-subhead { font-size: var(--fs-xs); color: var(--fg-3); font-weight: 600; }
@media (max-width: 560px) { .sched-subrow.deps { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .sched-subrow.deps > :nth-child(3) { grid-column: 1; } .sched-subhead.deps { display: none; } }
.sched-months { display: grid; grid-template-columns: repeat(auto-fill, minmax(214px, 1fr)); gap: 16px; }
.sched-month-h { font-weight: 600; font-size: var(--fs-sm); margin-bottom: 6px; }
.sched-mgrid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; }
.sched-mgrid > .dh { font-size: 0.6875rem; color: var(--fg-3); text-align: center; font-weight: 600; }
.sched-day { height: 26px; display: flex; align-items: center; justify-content: center; border-radius: var(--r-sm); font-size: var(--fs-xs); font-variant-numeric: tabular-nums; border: 1px solid transparent; background: var(--surface); color: var(--fg); padding: 0; }
button.sched-day { cursor: pointer; }
button.sched-day:hover { border-color: var(--line-strong); }
.sched-day.is-off { background: var(--surface-3); color: var(--fg-3); }
.sched-day.is-hol { background: var(--signal-wash); color: var(--signal-ink); font-weight: 600; }
.sched-day.is-extra { background: var(--warn-wash); color: var(--warn); font-weight: 600; }
.sched-day.out-proj { opacity: 0.45; }
.sched-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.sched-net { max-height: min(76vh, 1100px); overflow: auto; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); }
.sched-net svg text { fill: var(--fg); font-size: 11px; }
.sched-net svg .sched-net-v { font-family: var(--font-mono); font-size: 10.5px; fill: var(--fg); }
.sched-net svg .sched-net-elbl { font-size: 10px; fill: var(--fg-2); font-family: var(--font-mono); }
.sched-net svg .sched-net-node { cursor: default; }
.sched-key { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line-strong); border-radius: var(--r-sm); font-size: 0.6875rem; width: 330px; max-width: 100%; background: var(--surface); }
.sched-key > div { padding: 3px 6px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); text-align: center; color: var(--fg-2); }
.sched-key > div:nth-child(3n) { border-right: 0; }
.sched-key > .mid { grid-column: span 3; color: var(--fg); border-right: 0; padding: 7px 6px; }
.sched-key > .bot { border-bottom: 0; }
.sched-path { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: var(--fs-sm); }
.sched-path .icon { color: var(--fg-3); }
.sched-path > .row { flex-wrap: nowrap; max-width: 100%; min-width: 0; }
.sched-path .chip { white-space: normal; min-width: 0; line-height: 1.35; padding-block: 2px; }
.sched-hist { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.sched-matrix td.u, .sched-matrix th.u { text-align: center; }
.sched-matrix td.has { background: var(--accent-wash); color: var(--accent); font-weight: 600; font-variant-numeric: tabular-nums; }
.sched-matrix tfoot td { font-weight: 600; background: var(--surface-2); border-top: 1px solid var(--line); }
.sched-reslist tr.clickable.is-sel td { background: var(--accent-wash); }
.sched-reslist .input { min-height: 28px; padding: 3px 7px; width: 96px; }
.sched-tbl td.sched-resname { min-width: 160px; }
.sched-reslist td, .sched-conflicts td { vertical-align: middle; }
.sched-matrix td.wrap { min-width: 230px; }
.sched-yes { color: var(--crit); font-weight: 600; }
.sched-tasklinks { display: flex; flex-wrap: wrap; gap: 2px 4px; }
.sched-tasklinks .btn { padding: 0 5px; min-height: 22px; font-weight: 500; }
`;
  if (!document.getElementById('css-schedule')) {
    const st = document.createElement('style');
    st.id = 'css-schedule';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- constantes */
  const ROW_H = 30;            // alto de fila del Gantt
  const HEAD_H = 58;           // encabezado: nivel superior [0,20), inferior [20,40), marcas [40,58)
  const T1 = 20, T2 = 40;
  const ZOOMS = { dia: { label: 'Día', ppd: 30 }, semana: { label: 'Semana', ppd: 6.4 }, mes: { label: 'Mes', ppd: 1.8 } };
  /* Iniciales de los días en es-CO (CLDR): martes y miércoles comparten la «M» (la «X» es convención de España). */
  const DOW1 = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const DOW_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const WORKWEEKS = [{ value: 5, label: 'Lunes a viernes' }, { value: 6, label: 'Lunes a sábado' }, { value: 7, label: 'Todos los días' }];
  const DEP_CODE = { FS: 'FC', SS: 'CC', FF: 'FF', SF: 'CF' };
  const CODE_TYPE = { FS: 'FS', SS: 'SS', FF: 'FF', SF: 'SF', FC: 'FS', CC: 'SS', CF: 'SF' };
  const DEP_TYPES = [
    { value: 'FS', label: 'Fin a comienzo (FC)' },
    { value: 'SS', label: 'Comienzo a comienzo (CC)' },
    { value: 'FF', label: 'Fin a fin (FF)' },
    { value: 'SF', label: 'Comienzo a fin (CF)' },
  ];
  const DEP_NAME = { FS: 'fin a comienzo', SS: 'comienzo a comienzo', FF: 'fin a fin', SF: 'comienzo a fin' };
  const GCOLS = {
    num: { label: '#', w: 42, title: 'Número de fila (se usa en Predecesoras)', num: true },
    code: { label: 'EDT', w: 52, title: 'Código del paquete de la EDT' },
    name: { label: 'Nombre', w: 186 },
    dur: { label: 'Dur.', w: 54, title: 'Duración en días hábiles (0 = hito)', num: true },
    start: { label: 'Inicio', w: 80, title: 'Inicio calculado. Edítalo para fijar la restricción «No comenzar antes de».' },
    finish: { label: 'Fin', w: 72, title: 'Fin calculado (último día de trabajo)' },
    pct: { label: '%', w: 56, title: '% de avance', num: true },
    pred: { label: 'Predecesoras', w: 100, title: 'Filas predecesoras: 3, 3FC+2, 5CC-1 (FC, CC, FF, CF o FS, SS, FF, SF), separadas por ; o ,' },
  };
  const COLSETS = { full: ['num', 'code', 'name', 'dur', 'start', 'finish', 'pct', 'pred'], compact: ['num', 'name', 'dur'] };

  /* ---------------------------------------------------------------- utilidades */
  const fd = (iso) => (D.valid(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(2, 4) : '—');
  const tw = (s, px = 11) => String(s == null ? '' : s).length * px * 0.56;
  const fit = (s, w, px = 11) => { s = String(s == null ? '' : s); if (tw(s, px) <= w) return s; const n = Math.floor(w / (px * 0.56)) - 1; return n > 1 ? s.slice(0, n) + '…' : ''; };
  const lagSigned = (lag) => (lag > 0 ? '+' + lag : lag < 0 ? '−' + Math.abs(lag) : '');
  const daysTxt = (n) => (Number.isFinite(n) ? fmt.num(n) + (Math.abs(n) === 1 ? ' día' : ' días') : '—');
  const varTxt = (v) => (v === null || v === undefined ? '—' : v > 0 ? '+' + fmt.num(v) + ' d' : v < 0 ? '−' + fmt.num(Math.abs(v)) + ' d' : '0 d');
  const varTone = (v) => (v === null || v === undefined ? null : v > 0 ? 'crit' : v < 0 ? 'good' : null);
  const isoWeek = (iso) => {
    const d = new Date(D.toMs(iso));
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day + 3);
    const y = d.getUTCFullYear();
    const jan4 = new Date(Date.UTC(y, 0, 4));
    const firstThu = jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86400000 + 3 * 86400000;
    return 1 + Math.round((d.getTime() - firstThu) / (7 * 86400000));
  };
  /* Regla de 05-calc: crítica = holgura total ≤ 0 y sin terminar (avance < 100 %). Las terminadas no cuentan. */
  const CRIT_RULE = 'Actividades sin terminar con holgura total ≤ 0. Las terminadas no se marcan como críticas aunque su holgura sea 0.';
  const critCell = (t) => (t.critical ? html`<span class="sched-yes">Sí</span>`
    : t.progress >= 100 ? html`<span class="faint" title="Actividad terminada: ya no forma parte de la ruta crítica pendiente">No (terminada)</span>`
    : html`<span class="faint">No</span>`);
  const taskName = (t) => (t && String(t.name || '').trim()) || 'Actividad sin nombre';
  const resText = (rs) => (rs || []).filter((r) => r && String(r.name || '').trim()).map((r) => String(r.name).trim() + ' ×' + fmt.num(num(r.units), 2)).join('; ');
  const newTask = (p = {}) => ({ id: PM.uid('t'), name: 'Nueva actividad', wbsId: null, duration: 5, milestone: false, start: null, deps: [], progress: 0, cost: 0, resources: [], responsible: '', actualStart: null, actualFinish: null, notes: '', ...p });

  /* Variación en días hábiles entre la fecha actual y la de línea base (+ = atraso). */
  function wdVar(cal, cur, base) {
    if (!D.valid(cur) || !D.valid(base) || cur === base) return D.valid(cur) && D.valid(base) ? 0 : null;
    return cur > base ? cal.countWork(D.add(base, 1), cur) : -cal.countWork(D.add(cur, 1), base);
  }
  /* Variación en palabras, con la misma redacción del tablero (80-dashboard): «3 días hábiles de atraso frente a LB1». */
  const wdWord = (n) => (Math.abs(n) === 1 ? 'día hábil' : 'días hábiles');
  const varPhrase = (v, vs) => (v === null || v === undefined ? '' : v === 0 ? 'sin variación ' + vs : fmt.num(Math.abs(v)) + ' ' + wdWord(v) + (v > 0 ? ' de atraso ' : ' de adelanto ') + vs);
  const varColor = (v) => (v > 0 ? 'color:var(--crit)' : v < 0 ? 'color:var(--good)' : '');
  /* Instantánea del cronograma de la línea base vigente (o null). */
  const blSchedOf = (baselines) => { const b = baselines && baselines.schedule && baselines.schedule.schedule; return b && Array.isArray(b.tasks) ? b : null; };
  /* Pronóstico al corte (6.6): actividades sin terminar cuyas fechas cambian al actualizar la red a la fecha de corte
     (m.forecast) frente a lo planificado (m.sched). Map id → actividad pronosticada. Se memoriza por par de redes. */
  const NO_DIFF = new Map();
  const diffCache = new WeakMap();
  function forecastDiff(sched, forecast) {
    if (!forecast || forecast === sched || !forecast.byId) return NO_DIFF;
    const hit = diffCache.get(forecast);
    if (hit && hit.sched === sched) return hit.map;
    const map = new Map();
    for (const t of sched.tasks) {
      if (t.progress >= 100) continue;
      const f = forecast.byId.get(t.id);
      if (f && (f.startDate !== t.startDate || f.finishDate !== t.finishDate)) map.set(t.id, f);
    }
    diffCache.set(forecast, { sched, map });
    return map;
  }
  const FC_RULE = 'el trabajo no iniciado empieza, como pronto, el día hábil siguiente al corte; el iniciado programa su duración restante desde ese día y los hitos no alcanzados quedan después del corte';
  /* ¿La dependencia determina la fecha del sucesor? */
  const isDriving = (p, s, l) => (l.type === 'SS' ? s.es === p.es + l.lag : l.type === 'FF' ? s.ef === p.ef + l.lag : l.type === 'SF' ? s.ef === p.es + l.lag : s.es === p.ef + l.lag);

  /* Predecesoras en texto estilo MS Project (números de fila). */
  function depsToText(deps, idxById) {
    return (deps || []).filter((d) => d && idxById.has(d.id)).map((d) => {
      const n = idxById.get(d.id) + 1;
      const type = ['FS', 'SS', 'FF', 'SF'].includes(d.type) ? d.type : 'FS';
      const lag = Math.round(num(d.lag));
      if (type === 'FS' && !lag) return String(n);
      return n + DEP_CODE[type] + (lag > 0 ? '+' + lag : lag < 0 ? '-' + Math.abs(lag) : '');
    }).join(';');
  }
  function parseDeps(text, tasks, selfId) {
    const s = String(text || '').trim();
    if (!s) return { deps: [] };
    const out = [];
    for (const p of s.split(/[;,]/).map((x) => x.trim()).filter(Boolean)) {
      const m = /^(\d{1,5})\s*([a-zA-Z]{2})?\s*(?:([+\-−])\s*(\d{1,4})\s*(?:d|días|dias|día|dia)?)?$/i.exec(p);
      if (!m) return { error: '«' + p + '» no es válido. Escribe el número de fila y, si aplica, el tipo y el desfase: 3, 3FC+2 o 5CC-1.' };
      const n = parseInt(m[1], 10);
      const t = tasks[n - 1];
      if (!t) return { error: 'La fila ' + n + ' no existe. Usa los números de la columna #.' };
      if (t.id === selfId) return { error: 'Una actividad no puede ser su propia predecesora (fila ' + n + ').' };
      const type = CODE_TYPE[(m[2] || 'FS').toUpperCase()];
      if (!type) return { error: '«' + m[2] + '» no es un tipo de dependencia. Usa FC, CC, FF o CF (o FS, SS, FF, SF).' };
      if (out.some((d) => d.id === t.id)) return { error: 'La fila ' + n + ' aparece dos veces. Deja un solo vínculo por predecesora.' };
      out.push({ id: t.id, type, lag: m[3] ? (m[3] === '+' ? 1 : -1) * parseInt(m[4], 10) : 0 });
    }
    return { deps: out };
  }
  /* Devuelve el id de la predecesora que cerraría un ciclo, o null. */
  function cycleVia(tasks, selfId, deps) {
    const preds = new Map(tasks.map((t) => [t.id, ((t.id === selfId ? deps : t.deps) || []).map((d) => d.id)]));
    for (const d of deps) {
      const seen = new Set(); const st = [d.id];
      while (st.length) { const id = st.pop(); if (id === selfId) return d.id; if (seen.has(id)) continue; seen.add(id); for (const p of preds.get(id) || []) st.push(p); }
    }
    return null;
  }

  /* Validadores de celdas editables: devuelven {value} o {error}. */
  const V = {
    name: (s) => (String(s).trim() ? { value: String(s).trim() } : { error: 'El nombre no puede quedar vacío.' }),
    dur: (s) => { const m = /^\s*(\d{1,4})\s*(d|días|dias|día|dia)?\s*$/i.exec(s); return m ? { value: parseInt(m[1], 10) } : { error: 'Escribe un número entero de días hábiles (0 = hito).' }; },
    pct: (s) => { const m = /^\s*(\d{1,3}(?:[.,]\d+)?)\s*%?\s*$/.exec(s); const v = m ? parseFloat(m[1].replace(',', '.')) : NaN; return Number.isFinite(v) && v >= 0 && v <= 100 ? { value: Math.round(v) } : { error: 'Escribe un porcentaje entre 0 y 100.' }; },
    date: (s) => (!s ? { value: null } : D.valid(s) ? { value: s } : { error: 'La fecha no es válida.' }),
    money: (s) => { const clean = String(s).replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); if (!clean) return { value: 0 }; const v = parseFloat(clean); return Number.isFinite(v) && v >= 0 ? { value: v } : { error: 'Escribe un valor mayor o igual a 0.' }; },
    text: (s) => ({ value: String(s).trim() }),
  };

  /* ---------------------------------------------------------------- hooks */
  function usePref(key, def) {
    const [v, setV] = useState(() => PM.prefs.get(key, def));
    const set = useCallback((x) => { setV(x); PM.prefs.set(key, x); }, [key]);
    return [v, set];
  }
  /* Preferencia con clave variable (p. ej. por proyecto): al cambiar la clave se relee la guardada. */
  function useKeyedPref(key, def) {
    const [st, setSt] = useState(() => ({ key, v: PM.prefs.get(key, def) }));
    const v = st.key === key ? st.v : PM.prefs.get(key, def);
    const set = useCallback((x) => { setSt({ key, v: x }); PM.prefs.set(key, x); }, [key]);
    return [v, set];
  }
  /* Ancho de un elemento (ref de callback + ResizeObserver). */
  function useWidth() {
    const [w, setW] = useState(0);
    const roRef = useRef(null);
    const ref = useCallback((el) => {
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
      if (!el) return;
      setW(el.clientWidth);
      if (typeof ResizeObserver !== 'undefined') { const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); roRef.current = ro; }
    }, []);
    useEffect(() => () => { if (roRef.current) roRef.current.disconnect(); }, []);
    return [ref, w];
  }
  /* Escritura del cronograma: siempre sobre el valor más reciente (aunque aún no se haya re-renderizado). */
  function useScheduleWriter(m) {
    const ref = useRef(m); ref.current = m;
    const last = useRef(null);
    return useMemo(() => {
      const get = () => { const cur = ref.current.schedule; const l = last.current; return l && l.base === cur ? l.value : cur; };
      const save = (next) => { last.current = { base: ref.current.schedule, value: next }; ref.current.saveSchedule(next); };
      const setTasks = (fn) => { const cur = get(); const tasks = fn((cur.tasks || []).slice()); save({ ...cur, settings: { ...(cur.settings || {}) }, tasks }); return tasks; };
      const updateTask = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const setSettings = (patch) => { const cur = get(); save({ ...cur, settings: { ...(cur.settings || {}), ...patch }, tasks: (cur.tasks || []).slice() }); };
      return { get, save, setTasks, updateTask, setSettings };
    }, []);
  }
  /* Capa de tooltip aislada: solo ella se re-renderiza al mover el puntero. */
  function TipLayer({ host, api }) {
    const tip = PM.useChartTip();
    useLayoutEffect(() => { tip.ref.current = host.current; api.current = tip; });
    return tip.node;
  }

  /* ---------------------------------------------------------------- celda editable */
  function EditCell({ value, display, kind = 'text', validate, onCommit, label, readOnly, align, auto, title, icon, inputMode, cls }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [err, setErr] = useState(null);
    const inputRef = useRef();
    const btnRef = useRef();
    /* active: hay una edición abierta. Evita que el blur que dispara el navegador al desmontar el campo
       (tras Enter o Esc) vuelva a confirmar o guarde un cambio cancelado. */
    const active = useRef(false);
    /* refocus: la edición terminó con el teclado (Enter o Esc); el foco vuelve a la celda (no a <body>). */
    const refocus = useRef(false);
    const initial = value === null || value === undefined ? '' : String(value);
    const start = () => { if (readOnly) return; active.current = true; setDraft(initial); setErr(null); setEditing(true); };
    const stop = (byKey) => { active.current = false; refocus.current = !!byKey; setEditing(false); setErr(null); };
    /* auto = marca de tiempo de la actividad recién creada; solo abre la edición si es reciente (no al volver a montarse la fila). */
    useEffect(() => { if (auto && !readOnly && Date.now() - auto < 2000) start(); }, [auto]);
    useLayoutEffect(() => {
      if (editing) { const el = inputRef.current; if (el) { el.focus(); if (kind !== 'date' && el.select) el.select(); } return; }
      if (refocus.current) { refocus.current = false; const b = btnRef.current; if (b && b.focus) b.focus({ preventScroll: true }); }
    }, [editing]);
    const commit = (raw, byKey) => {
      if (!active.current) return;
      if (raw === initial) { stop(byKey); return; }
      const r = validate ? validate(raw) : { value: raw };
      if (r.error) { setErr(r.error); return; }
      stop(byKey);
      onCommit(r.value);
    };
    const shown = display === undefined ? initial : display;
    if (readOnly) return html`<div class=${cx('sched-cell ro', align === 'right' && 'num', cls)} title=${title}>${icon}<span class="sched-txt">${shown}</span></div>`;
    if (!editing) return html`<button ref=${btnRef} type="button" class=${cx('sched-cell', align === 'right' && 'num', cls)} title=${title || 'Clic para editar'} aria-label=${label + ': ' + (shown || 'vacío') + '. Editar'} onClick=${start}>${icon}<span class="sched-txt">${shown}</span></button>`;
    return html`<div class="sched-edit">
      <input ref=${inputRef} class=${cx('sched-input', align === 'right' && 'num')} type=${kind} inputmode=${inputMode} value=${draft} aria-label=${label} aria-invalid=${err ? 'true' : undefined}
        onInput=${(e) => { setDraft(e.currentTarget.value); if (err) setErr(null); }}
        onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value, true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(true); } }}
        onBlur=${(e) => commit(e.currentTarget.value)} />
      ${err ? html`<div class="sched-err" role="alert">${err} <span class="faint">Esc para cancelar.</span></div>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- operaciones sobre el cronograma */
  /* Tras fijar una restricción de inicio: avisa si una dependencia (o el inicio del proyecto) manda. */
  function explainStart(schedule, projectStart, taskId, wanted) {
    const res = PM.calc.computeSchedule(schedule, projectStart);
    const t = res.byId.get(taskId);
    if (!t || !D.valid(wanted) || t.startDate <= wanted) return;
    let best = null, bestEs = -Infinity;
    for (const p of t.preds) {
      const r = res.byId.get(p.id); if (!r) continue;
      const es = p.type === 'SS' ? r.es + p.lag : p.type === 'FF' ? r.ef + p.lag - t.duration : p.type === 'SF' ? r.es + p.lag - t.duration : r.ef + p.lag;
      if (es > bestEs) { bestEs = es; best = { p, r }; }
    }
    const cal = res.cal;
    const consEs = Math.max(0, cal.indexOf(wanted) + (t.milestone ? 1 : 0));
    const head = '«' + taskName(t) + '» queda el ' + fmt.date(t.startDate) + ' y no el ' + fmt.date(wanted) + ': ';
    if (D.valid(t.actualStart)) {
      PM.toast(head + 'la actividad tiene inicio real (' + fmt.date(t.actualStart) + '). Cambia el inicio real en el editor de la actividad.', { timeout: 7000 });
    } else if (best && bestEs === t.es && bestEs > consEs) {
      PM.toast(head + 'manda la dependencia ' + DEP_NAME[best.p.type] + ' (' + DEP_CODE[best.p.type] + lagSigned(best.p.lag) + ') con «' + taskName(best.r) + '». La fecha quedó guardada como restricción «No comenzar antes de»; quita o cambia la dependencia si necesitas adelantarla.', { timeout: 8000 });
    } else if (wanted < cal.anchor) {
      PM.toast(head + 'ninguna actividad puede comenzar antes del inicio del proyecto (' + fmt.date(cal.anchor) + ').', { timeout: 7000 });
    } else if (!cal.isWork(wanted)) {
      const why = cal.isHoliday(wanted) ? (cal.holidayName(wanted) || 'día no laborable') : 'día de descanso de la semana laboral';
      PM.toast(head + 'el ' + fmt.date(wanted) + ' no es día hábil (' + why + '), así que la actividad empieza el siguiente día hábil.', { timeout: 7000 });
    }
  }
  async function deleteTaskFlow(w, sched, id) {
    const t = sched.byId.get(id); if (!t) return false;
    const dependents = sched.tasks.filter((x) => (x.deps || []).some((d) => d.id === id));
    const ok = await PM.confirm({
      title: t.milestone ? 'Eliminar hito' : 'Eliminar actividad',
      body: html`<div class="stack-sm"><p>Se eliminará <strong>${taskName(t)}</strong> del cronograma.</p>${dependents.length ? html`<p class="small muted">También se quitará como predecesora de ${dependents.length === 1 ? '1 actividad' : dependents.length + ' actividades'}: ${dependents.slice(0, 4).map(taskName).join(', ')}${dependents.length > 4 ? '…' : ''}.</p>` : null}</div>`,
      confirmText: t.milestone ? 'Eliminar hito' : 'Eliminar actividad', tone: 'danger',
    });
    if (!ok) return false;
    w.setTasks((ts) => ts.filter((x) => x.id !== id).map((x) => ((x.deps || []).some((d) => d.id === id) ? { ...x, deps: x.deps.filter((d) => d.id !== id) } : x)));
    PM.toast(t.milestone ? 'Hito eliminado.' : 'Actividad eliminada.');
    return true;
  }
  /* Una actividad por paquete de trabajo (hoja de la EDT) que aún no tenga actividades. */
  function importFromWbs(w, tree) {
    if (!tree.nodes.length) { PM.toast('La EDT está vacía. Crea los paquetes de trabajo en la vista EDT y vuelve a importar.', { tone: 'crit' }); return 0; }
    const cur = w.get();
    const used = new Set((cur.tasks || []).map((t) => t.wbsId).filter(Boolean));
    const add = tree.flat.filter((f) => f.isLeaf && !used.has(f.node.id)).map((f) => newTask({ name: String(f.node.name || '').trim() || 'Paquete ' + f.code, wbsId: f.node.id, cost: Math.max(0, num(f.node.costEstimate)), responsible: f.node.responsible || '' }));
    if (!add.length) { PM.toast('Todos los paquetes de trabajo de la EDT ya tienen actividades.'); return 0; }
    w.setTasks((ts) => [...ts, ...add]);
    PM.toast(add.length === 1 ? 'Se creó 1 actividad desde la EDT. Ajusta su duración y dependencias.' : 'Se crearon ' + add.length + ' actividades desde la EDT. Ajusta duraciones y dependencias.');
    return add.length;
  }
  const editorCtx = (m, w, canWrite) => ({ w, sched: m.sched, tree: m.tree, currency: m.currency, canWrite, projectStart: m.project ? m.project.start : null });
  function openTaskEditor(ctx, taskId) {
    PM.openModal((close) => html`<${TaskEditor} ctx=${ctx} taskId=${taskId} close=${close} />`);
  }

  /* ---------------------------------------------------------------- editor de actividad */
  function TaskEditor({ ctx, taskId, close }) {
    const { w, sched, tree, currency, canWrite } = ctx;
    const ro = !canWrite;
    const live = w.get();
    const liveTasks = (live.tasks || []).filter((t) => t && t.id);
    const rowNo = liveTasks.findIndex((t) => t.id === taskId) + 1;
    const orig = liveTasks.find((t) => t.id === taskId);
    const [d, setD] = useState(() => (orig ? {
      ...orig, name: orig.name || '', duration: num(orig.duration), milestone: !!orig.milestone || num(orig.duration) <= 0,
      deps: (orig.deps || []).map((x) => ({ id: x.id, type: ['FS', 'SS', 'FF', 'SF'].includes(x.type) ? x.type : 'FS', lag: Math.round(num(x.lag)), key: PM.uid('k') })),
      resources: (orig.resources || []).map((r) => ({ name: r.name || '', units: num(r.units, 1), key: PM.uid('k') })),
    } : null));
    const [error, setError] = useState(null);
    const resNames = useMemo(() => [...new Set(liveTasks.flatMap((t) => (t.resources || []).map((r) => String(r.name || '').trim()).filter(Boolean)))].sort(), []);
    if (!d) return html`<${ui.Modal} title="Actividad no encontrada" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}><p>La actividad ya no existe; puede que otra persona la haya eliminado.</p></${ui.Modal}>`;
    const comp = sched.byId.get(taskId);
    const set = (k) => (v) => { setD((x) => ({ ...x, [k]: v })); setError(null); };
    const setDep = (i, patch) => setD((x) => ({ ...x, deps: x.deps.map((y, j) => (j === i ? { ...y, ...patch } : y)) }));
    const setRes = (i, patch) => setD((x) => ({ ...x, resources: x.resources.map((y, j) => (j === i ? { ...y, ...patch } : y)) }));
    const predOptions = liveTasks.map((t, i) => ({ value: t.id, label: (i + 1) + ' · ' + taskName(t) })).filter((o) => o.value !== taskId);
    const wbsOptions = tree.flat.map((f) => ({ value: f.node.id, label: f.code + ' ' + (f.node.name || '') }));
    const save = () => {
      const name = String(d.name || '').trim();
      if (!name) return setError('Escribe el nombre de la actividad.');
      if (!d.milestone && (d.duration === null || d.duration === undefined || d.duration === '')) return setError('Escribe la duración en días hábiles (0 convierte la actividad en hito).');
      let dur = Math.max(0, Math.round(num(d.duration)));
      const milestone = !!d.milestone || dur === 0; if (milestone) dur = 0;
      const deps = [];
      for (const x of d.deps) {
        if (!x.id) continue;
        if (deps.some((y) => y.id === x.id)) return setError('La predecesora «' + taskName(liveTasks.find((t) => t.id === x.id)) + '» está repetida. Deja un solo vínculo por actividad.');
        deps.push({ id: x.id, type: x.type || 'FS', lag: Math.round(num(x.lag)) });
      }
      const cur = w.get();
      const via = cycleVia(cur.tasks || [], taskId, deps);
      if (via) return setError('La predecesora «' + taskName((cur.tasks || []).find((t) => t.id === via)) + '» ya depende, directa o indirectamente, de esta actividad. Quítala para evitar una dependencia circular.');
      if (D.valid(d.actualStart) && D.valid(d.actualFinish) && d.actualFinish < d.actualStart) return setError('El fin real no puede ser anterior al inicio real.');
      const resources = d.resources.filter((r) => String(r.name || '').trim()).map((r) => ({ name: String(r.name).trim(), units: Math.max(0, num(r.units, 1)) }));
      const base = (cur.tasks || []).find((t) => t.id === taskId);
      if (!base) { close(); PM.toast('La actividad ya no existe.', { tone: 'crit' }); return; }
      const next = {
        ...base, name, wbsId: d.wbsId || null, duration: dur, milestone, start: D.valid(d.start) ? d.start : null, deps,
        progress: PM.clamp(Math.round(num(d.progress)), 0, 100), cost: Math.max(0, num(d.cost)), resources,
        responsible: String(d.responsible || '').trim(), actualStart: D.valid(d.actualStart) ? d.actualStart : null,
        actualFinish: D.valid(d.actualFinish) ? d.actualFinish : null, notes: d.notes || '',
      };
      w.save({ ...cur, settings: { ...(cur.settings || {}) }, tasks: (cur.tasks || []).map((t) => (t.id === taskId ? next : t)) });
      close();
      if (next.start && next.start !== base.start) explainStart(w.get(), ctx.projectStart, taskId, next.start);
    };
    const remove = async () => { const ok = await deleteTaskFlow(w, sched, taskId); if (ok) close(); };
    const footer = ro ? html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>` : html`
      <${ui.Button} variant="danger" icon="trash" onClick=${remove} style="margin-right:auto">Eliminar</${ui.Button}>
      <${ui.Button} onClick=${close}>Cancelar</${ui.Button}>
      <${ui.Button} variant="primary" icon="check" onClick=${save}>Guardar cambios</${ui.Button}>`;
    const kv = (k, v, tone) => html`<div><span class="k">${k}</span><span class="v" style=${tone ? 'color:var(--' + tone + ')' : ''}>${v}</span></div>`;
    return html`<${ui.Modal} size="wide" title=${(d.milestone ? 'Hito' : 'Actividad') + (rowNo ? ' ' + rowNo : '')} subtitle=${ro ? 'Solo lectura' : 'Las duraciones y desfases se expresan en días hábiles.'} onClose=${close} footer=${footer}>
      ${error ? html`<div class="sched-banner" role="alert"><${ui.Icon} name="alert" size=${16} /><div>${error}</div></div>` : null}
      <div class="grid cols-2">
        <${ui.Field} label="Nombre" required for="te-name" class="span-all"><${ui.Input} id="te-name" value=${d.name} onValue=${set('name')} disabled=${ro} autoFocus=${!ro} /></${ui.Field}>
        <${ui.Field} label="Paquete de la EDT" for="te-wbs"><${ui.Select} id="te-wbs" value=${d.wbsId || ''} onValue=${(v) => set('wbsId')(v || null)} placeholder="Sin paquete de la EDT" options=${wbsOptions} disabled=${ro} /></${ui.Field}>
        <${ui.Field} label="Responsable" for="te-resp"><${ui.Input} id="te-resp" value=${d.responsible || ''} onValue=${set('responsible')} disabled=${ro} placeholder="Rol o persona" /></${ui.Field}>
        <${ui.Field} label="Duración (días hábiles)" for="te-dur" hint="0 convierte la actividad en hito.">
          <div class="row" style="flex-wrap:nowrap">
            <div style="flex:1"><${ui.NumberInput} id="te-dur" value=${d.duration} min=${0} onValue=${(v) => { const n = Math.max(0, Math.round(num(v))); setD((x) => ({ ...x, duration: v === null ? null : n, milestone: v !== null && n === 0 })); }} disabled=${ro} /></div>
            <${ui.Check} label="Hito" checked=${d.milestone} disabled=${ro} onValue=${(v) => setD((x) => ({ ...x, milestone: v, duration: v ? 0 : Math.max(1, num(x.duration)) }))} />
          </div>
        </${ui.Field}>
        <${ui.Field} label="No comenzar antes de" for="te-start" hint="Restricción de fecha. Déjala vacía para que manden las dependencias."><${ui.DateInput} id="te-start" value=${d.start} onValue=${set('start')} disabled=${ro} /></${ui.Field}>
        <${ui.Field} label="% de avance" for="te-pct"><${ui.NumberInput} id="te-pct" value=${d.progress} min=${0} max=${100} onValue=${set('progress')} disabled=${ro} /></${ui.Field}>
        <${ui.Field} label=${'Costo presupuestado (' + currency + ')'} for="te-cost"><${ui.NumberInput} id="te-cost" money currency=${currency} value=${d.cost} min=${0} onValue=${set('cost')} disabled=${ro} /></${ui.Field}>
        <${ui.Field} label="Inicio real" for="te-as"><${ui.DateInput} id="te-as" value=${d.actualStart} onValue=${set('actualStart')} disabled=${ro} /></${ui.Field}>
        <${ui.Field} label="Fin real" for="te-af" hint="Con avance 100 % fija la fecha de terminación."><${ui.DateInput} id="te-af" value=${d.actualFinish} onValue=${set('actualFinish')} disabled=${ro} /></${ui.Field}>
      </div>
      <div class="stack-sm">
        <div class="h4">Predecesoras</div>
        ${d.deps.length ? html`<div class="sched-sub">
          <div class="sched-subrow deps sched-subhead deps"><span>Actividad predecesora</span><span>Tipo</span><span>Desfase (días)</span><span></span></div>
          ${d.deps.map((x, i) => html`<div class="sched-subrow deps" key=${x.key}>
            <${ui.Select} aria-label=${'Predecesora ' + (i + 1)} value=${x.id || ''} onValue=${(v) => setDep(i, { id: v })} placeholder="Elige una actividad" options=${predOptions} disabled=${ro} />
            <${ui.Select} aria-label=${'Tipo de dependencia ' + (i + 1)} value=${x.type} onValue=${(v) => setDep(i, { type: v })} options=${DEP_TYPES} disabled=${ro} />
            <${ui.NumberInput} aria-label=${'Desfase en días ' + (i + 1)} title="Positivo = retraso; negativo = adelanto" value=${x.lag} onValue=${(v) => setDep(i, { lag: Math.round(num(v)) })} disabled=${ro} />
            ${ro ? html`<span></span>` : html`<${ui.IconButton} icon="trash" label=${'Quitar predecesora ' + (i + 1)} onClick=${() => setD((y) => ({ ...y, deps: y.deps.filter((_, j) => j !== i) }))} />`}
          </div>`)}
        </div>` : html`<p class="small faint">Sin predecesoras: la actividad empieza al inicio del proyecto o en su restricción de fecha.</p>`}
        ${ro ? null : html`<div><${ui.Button} size="sm" icon="plus" disabled=${!predOptions.length} onClick=${() => setD((x) => ({ ...x, deps: [...x.deps, { id: '', type: 'FS', lag: 0, key: PM.uid('k') }] }))}>Agregar predecesora</${ui.Button}></div>`}
        <p class="xsmall faint">Desfase positivo = retraso (espera); negativo = adelanto (solapamiento).</p>
      </div>
      <div class="stack-sm">
        <div class="h4">Recursos</div>
        ${d.resources.length ? html`<div class="sched-sub">
          <div class="sched-subrow res sched-subhead"><span>Recurso (persona, cuadrilla o equipo)</span><span>Unidades por día</span><span></span></div>
          ${d.resources.map((r, i) => html`<div class="sched-subrow res" key=${r.key}>
            <${ui.Input} aria-label=${'Nombre del recurso ' + (i + 1)} list="sched-res-names" value=${r.name} onValue=${(v) => setRes(i, { name: v })} placeholder="Ej.: Cuadrilla de montaje" disabled=${ro} />
            <${ui.NumberInput} aria-label=${'Unidades del recurso ' + (i + 1)} value=${r.units} min=${0} onValue=${(v) => setRes(i, { units: v })} disabled=${ro} />
            ${ro ? html`<span></span>` : html`<${ui.IconButton} icon="trash" label=${'Quitar recurso ' + (i + 1)} onClick=${() => setD((y) => ({ ...y, resources: y.resources.filter((_, j) => j !== i) }))} />`}
          </div>`)}
          <datalist id="sched-res-names">${resNames.map((n) => html`<option key=${n} value=${n} />`)}</datalist>
        </div>` : html`<p class="small faint">Sin recursos asignados. Las unidades son personas o equipos por día hábil y alimentan el histograma de recursos.</p>`}
        ${ro ? null : html`<div><${ui.Button} size="sm" icon="plus" onClick=${() => setD((x) => ({ ...x, resources: [...x.resources, { name: '', units: 1, key: PM.uid('k') }] }))}>Agregar recurso</${ui.Button}></div>`}
      </div>
      <${ui.Field} label="Notas" for="te-notes"><${ui.TextArea} id="te-notes" value=${d.notes || ''} onValue=${set('notes')} rows=${2} disabled=${ro} /></${ui.Field}>
      ${comp ? html`<div class="stack-sm">
        <div class="h4">Valores calculados (ruta crítica, antes de guardar)</div>
        <div class="sched-kv">
          ${kv('Inicio temprano', fmt.date(comp.startDate))}${kv('Fin temprano', fmt.date(comp.finishDate))}
          ${kv('Inicio tardío', fmt.date(comp.lateStart))}${kv('Fin tardío', fmt.date(comp.lateFinish))}
          ${kv('Holgura total', daysTxt(comp.tf), comp.tf < 0 ? 'crit' : null)}${kv('Holgura libre', daysTxt(comp.ff))}
          ${kv('Crítica', comp.critical ? 'Sí' : comp.progress >= 100 ? 'No (terminada)' : 'No', comp.critical ? 'crit' : null)}
        </div>
      </div>` : null}
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- Gantt: filas y geometría */
  function rollOf(tasks) {
    const cost = PM.sum(tasks, (t) => num(t.cost));
    const weight = cost > 0 ? (t) => num(t.cost) : (t) => Math.max(1, t.duration);
    const ws = PM.sum(tasks, weight);
    return { tasks, cost, count: tasks.length, progress: ws > 0 ? PM.sum(tasks, (t) => weight(t) * t.progress) / ws : 0, start: D.min(...tasks.map((t) => t.startDate)), finish: D.max(...tasks.map((t) => t.finishDate)), critical: tasks.some((t) => t.critical) };
  }
  function buildRows(sched, tree, rollup, group, collapsed) {
    const idx = new Map(sched.tasks.map((t, i) => [t.id, i]));
    if (!group) return sched.tasks.map((t, i) => ({ kind: 'task', key: t.id, id: t.id, task: t, num: i + 1, depth: 0, group: null }));
    const byNode = new Map(); const none = [];
    for (const t of sched.tasks) { if (t.wbsId && tree.byId.has(t.wbsId)) { if (!byNode.has(t.wbsId)) byNode.set(t.wbsId, []); byNode.get(t.wbsId).push(t); } else none.push(t); }
    const rows = [];
    for (const f of tree.flat) {
      const r = rollup.get(f.node.id);
      if (!r || !r.count) continue;
      if (tree.ancestors(f.node.id).some((a) => collapsed.has(a))) continue;
      rows.push({ kind: 'sum', key: 's:' + f.node.id, id: f.node.id, code: f.code, name: f.node.name || 'Sin nombre', depth: f.depth - 1, roll: r, open: !collapsed.has(f.node.id) });
      if (collapsed.has(f.node.id)) continue;
      for (const t of byNode.get(f.node.id) || []) rows.push({ kind: 'task', key: t.id, id: t.id, task: t, num: idx.get(t.id) + 1, depth: f.depth, group: f.node.id });
    }
    if (none.length) {
      rows.push({ kind: 'sum', key: 's:__none', id: '__none', code: '', name: 'Sin paquete de la EDT', depth: 0, roll: rollOf(none), open: !collapsed.has('__none') });
      if (!collapsed.has('__none')) for (const t of none) rows.push({ kind: 'task', key: t.id, id: t.id, task: t, num: idx.get(t.id) + 1, depth: 1, group: '__none' });
    }
    return rows;
  }
  function headerTiers(lo, hi, zoom, ppd) {
    const x = (iso) => D.diff(lo, iso) * ppd;
    const end = D.add(hi, 1);
    const top = [], bottom = [];
    const span = (a, b) => { const a2 = a < lo ? lo : a, b2 = b > end ? end : b; return { x: x(a2), w: x(b2) - x(a2) }; };
    const months = (arr, long) => { let m = D.startOfMonth(lo), g = 0; while (m < end && g++ < 600) { const nx = D.addMonths(m, 1); const mi = +m.slice(5, 7) - 1; arr.push({ ...span(m, nx), key: m, label: long ? PM.MONTHS_LONG[mi] + ' ' + m.slice(0, 4) : PM.MONTHS[mi], short: long ? PM.MONTHS[mi] + ' ' + m.slice(2, 4) : PM.MONTHS[mi].slice(0, 1).toUpperCase() }); m = nx; } };
    const weeks = (arr, asTop) => { let wk = D.startOfWeek(lo), g = 0; while (wk < end && g++ < 1200) { const nx = D.add(wk, 7); arr.push({ ...span(wk, nx), key: wk, label: asTop ? 'Semana ' + isoWeek(wk) + ' · ' + fmt.date(wk, 'dm') + ' – ' + fmt.date(D.add(wk, 6), 'dm') : fmt.date(wk, 'dm'), short: asTop ? 'S' + isoWeek(wk) : wk.slice(8, 10) }); wk = nx; } };
    if (zoom === 'dia') { weeks(top, true); for (let d = lo, g = 0; d < end && g++ < 4000; d = D.add(d, 1)) bottom.push({ x: x(d), w: ppd, key: d, label: DOW1[D.dow(d)] + ' ' + d.slice(8, 10), short: d.slice(8, 10), date: d }); }
    else if (zoom === 'semana') { months(top, true); weeks(bottom, false); }
    else { let y = +lo.slice(0, 4), g = 0; while (y + '-01-01' < end && g++ < 50) { const a = y + '-01-01'; top.push({ ...span(a, (y + 1) + '-01-01'), key: a, label: String(y), short: String(y) }); y++; } months(bottom, false); }
    return { top, bottom };
  }
  const tierLabel = (c) => (tw(c.label) + 8 <= c.w ? c.label : tw(c.short) + 4 <= c.w ? c.short : '');
  const diamond = (x, y, r) => 'M' + x + ',' + (y - r) + 'L' + (x + r) + ',' + y + 'L' + x + ',' + (y + r) + 'L' + (x - r) + ',' + y + 'Z';
  const bracket = (x0, x1, y) => (x1 - x0 < 12 ? 'M' + x0 + ',' + y + 'H' + x1 + 'V' + (y + 6) + 'H' + x0 + 'Z' : 'M' + x0 + ',' + y + 'H' + x1 + 'V' + (y + 11) + 'L' + (x1 - 5) + ',' + (y + 6) + 'H' + (x0 + 5) + 'L' + x0 + ',' + (y + 11) + 'Z');
  /* Flecha ortogonal entre barras según el tipo de dependencia. */
  function depPath(type, a, b) {
    const G = 7; const ya = a.top + 12.5, yb = b.top + 12.5;
    const aS = a.ms ? a.xm - 7 : a.x0, aE = a.ms ? a.xm + 7 : a.x1, bS = b.ms ? b.xm - 7 : b.x0, bE = b.ms ? b.xm + 7 : b.x1;
    const yMid = b.top > a.top ? a.top + ROW_H : a.top;
    if (type === 'SS') { const xm = Math.min(aS, bS) - G; return 'M' + aS + ',' + ya + 'H' + xm + 'V' + yb + 'H' + bS; }
    if (type === 'FF') { const xm = Math.max(aE, bE) + G; return 'M' + aE + ',' + ya + 'H' + xm + 'V' + yb + 'H' + bE; }
    if (type === 'SF') { if (bE + G <= aS - G) return 'M' + aS + ',' + ya + 'H' + (aS - G) + 'V' + yb + 'H' + bE; return 'M' + aS + ',' + ya + 'H' + (aS - G) + 'V' + yMid + 'H' + (bE + G) + 'V' + yb + 'H' + bE; }
    if (bS - G >= aE + G) return 'M' + aE + ',' + ya + 'H' + (aE + G) + 'V' + yb + 'H' + bS;
    return 'M' + aE + ',' + ya + 'H' + (aE + G) + 'V' + yMid + 'H' + (bS - G) + 'V' + yb + 'H' + bS;
  }
  function ganttLayout({ sched, rows, zoom, frameW, gridW, blById, blRange, showBase, showDeps, showCrit, labelMode, projectStart, statusDate, today, fcById, fcFinish }) {
    const ppd = (ZOOMS[zoom] || ZOOMS.semana).ppd;
    const cal = sched.cal;
    const ds = [sched.start, sched.finish];
    if (D.valid(projectStart)) ds.push(projectStart);
    if (showBase && blRange) ds.push(blRange.start, blRange.finish);
    const end = fcById && D.valid(fcFinish) && fcFinish > sched.finish ? fcFinish : sched.finish;
    if (end !== sched.finish) ds.push(end);
    let lo = D.min(...ds) || D.today(), hi = D.max(...ds) || lo;
    lo = zoom === 'mes' ? D.startOfMonth(D.add(lo, -10)) : D.add(D.startOfWeek(lo), -7);
    hi = zoom === 'mes' ? D.endOfMonth(D.add(hi, 20)) : D.add(D.startOfWeek(D.add(hi, 10)), 6);
    let days = D.diff(lo, hi) + 1;
    const avail = Math.max(0, (frameW || 0) - gridW - 2);
    if (days * ppd < avail) { days = Math.ceil(avail / ppd); hi = D.add(lo, days - 1); }
    const width = Math.ceil(days * ppd);
    const x = (iso) => D.diff(lo, iso) * ppd;
    const nonwork = [];
    if (zoom !== 'mes') for (let d = lo, g = 0; d <= hi && g++ < 6000; d = D.add(d, 1)) if (!cal.isWork(d)) nonwork.push({ d, x: x(d), hol: cal.isHoliday(d) ? cal.holidayName(d) || 'No laborable' : null });
    const geo = new Map();
    const bars = rows.map((r, i) => {
      const top = i * ROW_H;
      if (r.kind === 'sum') return { r, i, top, x0: x(r.roll.start), x1: x(r.roll.finish) + ppd };
      const t = r.task; const g = { r, i, top, t, ms: t.milestone, crit: showCrit && t.critical };
      if (t.milestone) { g.xm = x(t.startDate) + ppd; g.x0 = g.xm - 7; g.x1 = g.xm + 7; } else { g.x0 = x(t.startDate); g.x1 = x(t.finishDate) + ppd; }
      if (showBase && blById) { const b = blById.get(t.id); if (b && D.valid(b.start)) g.base = b.milestone ? { xm: x(b.start) + ppd } : { x0: x(b.start), x1: x(D.valid(b.finish) ? b.finish : b.start) + ppd }; }
      /* pronóstico al corte: solo el trabajo pendiente cuyas fechas cambian (fcById ya viene filtrado) */
      const f = fcById ? fcById.get(t.id) : null;
      if (f) g.fc = f.milestone ? { f, xm: x(f.startDate) + ppd } : { f, x0: x(f.startDate), x1: x(f.finishDate) + ppd };
      geo.set(t.id, g);
      return g;
    });
    for (const g of bars) {
      const text = g.t ? (labelMode === 'resp' ? g.t.responsible || '' : labelMode === 'none' ? '' : taskName(g.t)) : (labelMode === 'none' ? '' : (g.r.code ? g.r.code + ' ' : '') + g.r.name + ' · ' + fmt.num(g.r.roll.progress) + ' %');
      if (!text) continue;
      let right = g.ms ? g.xm + 10 : g.x1 + 6; let left = g.ms ? g.xm - 10 : g.x0 - 6;
      /* la etiqueta no tapa la barra del pronóstico */
      if (g.fc) { right = Math.max(right, g.fc.xm !== undefined ? g.fc.xm + 11 : g.fc.x1 + 6); left = Math.min(left, g.fc.xm !== undefined ? g.fc.xm - 11 : g.fc.x0 - 6); }
      const room = width - right - 4; const need = tw(text);
      if (need <= room) g.label = { x: right, anchor: 'start', text };
      else if (left - need >= 2) g.label = { x: left, anchor: 'end', text };
      else if (room >= left) g.label = { x: right, anchor: 'start', text: fit(text, room) };
      else g.label = { x: left, anchor: 'end', text: fit(text, left - 2) };
    }
    const arrows = [];
    if (showDeps) for (const g of bars) {
      if (!g.t) continue;
      for (const p of g.t.preds) {
        const a = geo.get(p.id); if (!a) continue;
        arrows.push({ key: p.id + '>' + g.t.id, d: depPath(p.type, a, g), crit: showCrit && a.t.critical && g.t.critical && isDriving(a.t, g.t, p) });
      }
    }
    arrows.sort((p, q) => (p.crit === q.crit ? 0 : p.crit ? 1 : -1));
    const lines = [];
    const inRange = (d) => D.valid(d) && d >= lo && d <= hi;
    if (inRange(statusDate)) lines.push({ kind: 'status', x: x(statusDate) + ppd, label: statusDate === today ? 'Corte (hoy)' : 'Corte ' + fmt.date(statusDate, 'dm') });
    if (today !== statusDate && inRange(today)) lines.push({ kind: 'today', x: x(today) + ppd / 2, label: 'Hoy' });
    lines.sort((a, b) => a.x - b.x);
    lines.forEach((l, i) => { const w2 = tw(l.label, 10.5); if (lines.length === 2 && i === 0) l.anchor = 'end'; else l.anchor = l.x + 4 + w2 > width ? 'end' : 'start'; l.tx = l.anchor === 'end' ? l.x - 4 : l.x + 4; });
    return { lo, hi, ppd, width, x, nonwork, bars, arrows, lines, end, tiers: headerTiers(lo, hi, zoom, ppd), bodyH: rows.length * ROW_H };
  }
  /* Desplazamiento inicial del Gantt: la línea de corte a un tercio del área visible (lo ejecutado a la izquierda,
     lo pendiente a la derecha), sin pasar del inicio del cronograma ni dejar espacio vacío después de su fin
     (o del fin pronosticado, si se dibuja el pronóstico al corte). */
  function initialScrollX(L, sched, visW) {
    const lo = Math.max(0, L.x(sched.start) - 16);
    const st = L.lines.find((l) => l.kind === 'status');
    if (!st || !(visW > 0)) return lo;
    const hi = Math.max(lo, L.x(L.end || sched.finish) + L.ppd + 40 - visW);
    return PM.clamp(st.x - visW / 3, lo, hi);
  }
  function TaskTip({ t, code, bl, cal, currency, fc }) {
    const v = bl ? wdVar(cal, t.finishDate, bl.finish || bl.start) : null;
    const fv = fc ? wdVar(cal, fc.finishDate, t.finishDate) : null;
    return html`<div>
      <strong>${t.milestone ? 'Hito: ' : ''}${taskName(t)}</strong>
      <div class="sched-tipgrid">
        <span>${t.milestone ? 'Fecha planificada' : 'Inicio – fin'}</span><span>${t.milestone ? fmt.date(t.startDate) : fmt.date(t.startDate, 'dm') + ' – ' + fmt.date(t.finishDate)}</span>
        ${fc ? html`<span>Pronóstico al corte</span><span style="color:var(--signal-ink);font-weight:600" data-tip="forecast">${fc.milestone ? fmt.date(fc.startDate) : fmt.date(fc.startDate, 'dm') + ' – ' + fmt.date(fc.finishDate)}${fv ? ' (' + varTxt(fv) + ')' : ''}</span>` : null}
        ${fc && fc.remaining ? html`<span>Duración restante</span><span>${daysTxt(fc.remaining)} hábiles desde el corte</span>` : null}
        ${t.milestone ? null : html`<span>Duración</span><span>${daysTxt(t.duration)} hábiles</span>`}
        <span>Holgura total / libre</span><span>${fmt.num(t.tf)} / ${fmt.num(t.ff)} d</span>
        <span>Avance</span><span>${fmt.num(t.progress)} %</span>
        <span>Costo</span><span>${fmt.money(t.cost, currency)}</span>
        ${code ? html`<span>EDT</span><span>${code}</span>` : null}
        ${bl ? html`<span>Fin línea base</span><span>${fmt.date(bl.finish || bl.start)}</span><span>Variación</span><span style=${v > 0 ? 'color:var(--crit)' : v < 0 ? 'color:var(--good)' : ''}>${varTxt(v)}${v > 0 ? ' (atraso)' : v < 0 ? ' (adelanto)' : ''}</span>` : null}
        ${t.critical ? html`<span>Ruta crítica</span><span style="color:var(--crit)">Sí</span>` : null}
      </div>
    </div>`;
  }
  /* CSV del cronograma calculado. */
  function scheduleCsv(sched, tree, currency) {
    const idx = new Map(sched.tasks.map((t, i) => [t.id, i]));
    const cols = [
      { key: 'n', label: '#' }, { key: 'code', label: 'EDT' }, { key: 'name', label: 'Actividad' }, { key: 'tipo', label: 'Tipo' },
      { key: 'dur', label: 'Duración (días hábiles)' }, { key: 'ini', label: 'Inicio' }, { key: 'fin', label: 'Fin' },
      { key: 'il', label: 'Inicio tardío' }, { key: 'tl', label: 'Fin tardío' }, { key: 'ht', label: 'Holgura total' }, { key: 'hl', label: 'Holgura libre' },
      { key: 'crit', label: 'Crítica' }, { key: 'pred', label: 'Predecesoras' }, { key: 'rest', label: 'No comenzar antes de' }, { key: 'pct', label: '% avance' },
      { key: 'ar', label: 'Inicio real' }, { key: 'fr', label: 'Fin real' }, { key: 'cost', label: 'Costo (' + currency + ')' }, { key: 'resp', label: 'Responsable' }, { key: 'rec', label: 'Recursos' },
    ];
    const rows = sched.tasks.map((t, i) => ({
      n: i + 1, code: (t.wbsId && tree.codes.get(t.wbsId)) || '', name: taskName(t), tipo: t.milestone ? 'Hito' : 'Actividad', dur: t.duration,
      ini: fmt.date(t.startDate, 'short'), fin: fmt.date(t.finishDate, 'short'), il: fmt.date(t.lateStart, 'short'), tl: fmt.date(t.lateFinish, 'short'),
      ht: t.tf, hl: t.ff, crit: !!t.critical, pred: depsToText(t.deps, idx), rest: t.start ? fmt.date(t.start, 'short') : '', pct: t.progress,
      ar: t.actualStart ? fmt.date(t.actualStart, 'short') : '', fr: t.actualFinish ? fmt.date(t.actualFinish, 'short') : '', cost: num(t.cost), resp: t.responsible || '', rec: resText(t.resources),
    }));
    return PM.toCSV(cols, rows);
  }
  const fileBase = (project) => (project && project.code ? project.code + '_' : '') + PM.slug((project && project.name) || 'proyecto');

  /* ---------------------------------------------------------------- pestaña Gantt */
  function GanttTab({ m, w, canWrite, sel, setSel, edit, focus, onFocused }) {
    const { sched, tree, rollup, baselines, statusDate, project, currency } = m;
    const [zoom, setZoom] = usePref('sched.zoom', 'semana');
    const [group, setGroup] = usePref('sched.group', true);
    const [showCrit, setShowCrit] = usePref('sched.crit', true);
    const [showBaseP, setShowBase] = usePref('sched.base', true);
    const [showDeps, setShowDeps] = usePref('sched.deps', true);
    const [labelMode, setLabelMode] = usePref('sched.label', 'name');
    const [colsPref, setColsPref] = usePref('sched.cols', 'auto');
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [autoEdit, setAutoEdit] = useState(null);
    const [wrapRef, frameW] = useWidth();
    const frameRef = useRef(); const tipApi = useRef(null);
    const headSvgRef = useRef(); const bodySvgRef = useRef(); const dragTipRef = useRef();
    const drag = useRef(null); const lastClick = useRef({ id: null, at: 0 });
    const uid = useMemo(() => PM.uid('gm'), []);
    const blSched = blSchedOf(baselines);
    const blById = useMemo(() => (blSched ? new Map(blSched.tasks.map((b) => [b.id, b])) : null), [blSched]);
    const showBase = !!showBaseP && !!blSched;
    /* Pronóstico al corte (6.6): se ofrece cuando el corte es posterior al inicio y desplaza trabajo pendiente;
       entonces se muestra por defecto. La elección de ocultarlo se recuerda por proyecto. Solo dibuja: no guarda nada. */
    const forecast = m.forecast || sched;
    const fcMoved = forecastDiff(sched, forecast);
    const fcAvail = fcMoved.size > 0 && D.valid(statusDate) && (!D.valid(project.start) || statusDate > project.start);
    const [fcHidden, setFcHidden] = useKeyedPref('sched.fcHide.' + (project.id || ''), false);
    const showFc = fcAvail && !fcHidden;
    const colSet = colsPref === 'auto' ? (frameW && frameW < 960 ? 'compact' : 'full') : colsPref;
    const cols = COLSETS[colSet] || COLSETS.full;
    const colW = (k) => (k === 'name' && colSet === 'compact' ? (frameW && frameW < 520 ? 124 : 180) : GCOLS[k].w);
    const gridW = cols.reduce((s, k) => s + colW(k), 0);
    const gridTemplate = cols.map((k) => colW(k) + 'px').join(' ');
    const idxById = useMemo(() => new Map(sched.tasks.map((t, i) => [t.id, i])), [sched]);
    const rows = useMemo(() => buildRows(sched, tree, rollup, group, collapsed), [sched, tree, rollup, group, collapsed]);
    const today = D.today();
    const fcById = showFc ? fcMoved : null;
    const L = useMemo(() => ganttLayout({ sched, rows, zoom, frameW, gridW, blById, blRange: blSched, showBase, showDeps, showCrit, labelMode, projectStart: project.start, statusDate, today, fcById, fcFinish: forecast.finish }),
      [sched, rows, zoom, frameW, gridW, blById, blSched, showBase, showDeps, showCrit, labelMode, project.start, statusDate, today, fcById, forecast.finish]);
    /* al abrir o cambiar la escala, desplaza la línea de tiempo hasta la fecha de corte (a un tercio del área visible) */
    const scrolledKey = useRef('');
    useLayoutEffect(() => {
      const f = frameRef.current; if (!f || !sched.tasks.length || !frameW) return;
      const key = zoom;
      if (scrolledKey.current === key) return;
      scrolledKey.current = key;
      f.scrollLeft = initialScrollX(L, sched, f.clientWidth - gridW);
    });
    /* «Ver en el cronograma» (p. ej. desde la EDT): expande su grupo, desplaza la fila y la barra a la vista. */
    useLayoutEffect(() => {
      const f = frameRef.current; if (!focus || !f || !frameW) return;
      const i = rows.findIndex((r) => r.kind === 'task' && r.id === focus.id);
      if (i < 0) {
        const t = sched.byId.get(focus.id);
        if (!t || !group) { onFocused(); return; }
        const gid = t.wbsId && tree.byId.has(t.wbsId) ? t.wbsId : '__none';
        const shut = [gid, ...(gid === '__none' ? [] : tree.ancestors(gid))].filter((id) => collapsed.has(id));
        if (!shut.length) { onFocused(); return; }
        setCollapsed((c) => { const n = new Set(c); for (const id of shut) n.delete(id); return n; });
        return; /* vuelve a ejecutarse con el grupo abierto */
      }
      const g = L.bars[i]; const visW = Math.max(0, f.clientWidth - gridW);
      f.scrollTop = Math.max(0, i * ROW_H - (f.clientHeight - HEAD_H) / 3);
      f.scrollLeft = Math.max(0, (g.ms ? g.xm : g.x0) - visW / 4);
      try { f.scrollIntoView({ block: 'nearest' }); } catch (e) { /* sin soporte */ }
      onFocused();
    }, [focus, rows, frameW]);
    const selTask = sel ? sched.byId.get(sel) : null;
    const taskRows = rows.filter((r) => r.kind === 'task');
    const selPos = taskRows.findIndex((r) => r.id === sel);
    const neighbor = (dir) => { if (selPos < 0) return null; const nb = taskRows[selPos + dir]; if (!nb) return null; if (group && nb.group !== taskRows[selPos].group) return null; return nb; };

    /* acciones */
    const addTask = (milestone) => {
      const ts = w.get().tasks || [];
      let at = ts.length, wbsId = null;
      if (selTask) { at = ts.findIndex((t) => t.id === selTask.id) + 1; wbsId = selTask.wbsId && tree.byId.has(selTask.wbsId) ? selTask.wbsId : null; }
      else if (sel && sel.startsWith('s:')) {
        const nid = sel.slice(2); const inGroup = (t) => (nid === '__none' ? !(t.wbsId && tree.byId.has(t.wbsId)) : t.wbsId === nid);
        if (nid !== '__none') wbsId = nid;
        const last = ts.reduce((k, t, i) => (inGroup(t) ? i : k), -1); if (last >= 0) at = last + 1;
      }
      if (at <= 0) at = ts.length;
      const t = newTask(milestone ? { name: 'Nuevo hito', duration: 0, milestone: true, wbsId } : { wbsId });
      w.setTasks((arr) => { const a = arr.slice(); a.splice(at, 0, t); return a; });
      setSel(t.id); setAutoEdit({ id: t.id, n: Date.now() });
    };
    const move = (dir) => {
      const nb = neighbor(dir); if (!nb || !selTask) return;
      w.setTasks((ts) => { const a = ts.slice(); const i = a.findIndex((t) => t.id === selTask.id), j = a.findIndex((t) => t.id === nb.id); if (i < 0 || j < 0) return a; const tmp = a[i]; a[i] = a[j]; a[j] = tmp; return a; });
    };
    const toggleGroup = (id) => setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const exportCsv = () => PM.download(fileBase(project) + '_cronograma.csv', scheduleCsv(sched, tree, currency));
    const exportSvg = () => {
      const head = headSvgRef.current, body = bodySvgRef.current; if (!head || !body) return;
      const NS = 'http://www.w3.org/2000/svg'; const LW = 320; const W = LW + L.width; const Ht = HEAD_H + Math.max(1, rows.length) * ROW_H + 30;
      const mk = (tag, attrs, text) => { const el = document.createElementNS(NS, tag); for (const k of Object.keys(attrs)) el.setAttribute(k, attrs[k]); if (text !== undefined) el.textContent = text; return el; };
      const svg = mk('svg', { width: W, height: Ht, viewBox: '0 0 ' + W + ' ' + Ht, class: 'sched-svg' });
      svg.appendChild(mk('rect', { x: 0, y: 0, width: LW, height: HEAD_H, fill: 'var(--surface-2)' }));
      svg.appendChild(mk('text', { x: 8, y: 18, style: 'font-weight:600;fill:var(--fg)' }, fit((project.code ? project.code + ' · ' : '') + project.name, LW - 16)));
      svg.appendChild(mk('text', { x: 8, y: HEAD_H - 8 }, 'Actividad'));
      rows.forEach((r, i) => {
        const y = HEAD_H + i * ROW_H;
        const label = r.kind === 'sum' ? (r.code ? r.code + ' ' : '') + r.name : r.num + '  ' + taskName(r.task);
        svg.appendChild(mk('text', { x: 8 + r.depth * 10, y: y + 19, style: r.kind === 'sum' ? 'font-weight:600;fill:var(--fg)' : 'fill:var(--fg)' }, fit(label, LW - 16 - r.depth * 10)));
        svg.appendChild(mk('line', { x1: 0, y1: y + ROW_H - 0.5, x2: LW, y2: y + ROW_H - 0.5, stroke: 'var(--grid)' }));
      });
      svg.appendChild(mk('line', { x1: LW - 0.5, y1: 0, x2: LW - 0.5, y2: Ht - 30, stroke: 'var(--line-strong)' }));
      const h2 = head.cloneNode(true); h2.setAttribute('x', LW); h2.setAttribute('y', 0);
      const b2 = body.cloneNode(true); b2.setAttribute('x', LW); b2.setAttribute('y', HEAD_H);
      b2.querySelectorAll('.sched-selrect, .sched-dragtip, .sched-hit, .sched-handle').forEach((el) => el.remove());
      svg.appendChild(h2); svg.appendChild(b2);
      svg.appendChild(mk('text', { x: 8, y: Ht - 10, class: 'sched-faint' }, 'Cronograma generado el ' + fmt.date(D.today(), 'long') + ' · fecha de corte ' + fmt.date(statusDate) + (showCrit ? ' · ruta crítica en rojo' : '') + (showBase ? ' · línea base en gris' : '') + (showFc ? ' · pronóstico al corte con trama' : '')));
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-100000px;top:0;width:10px;height:10px;overflow:hidden';
      holder.appendChild(svg); document.body.appendChild(holder);
      let text = '';
      try { text = PM.svgToString(svg); } finally { holder.remove(); }
      PM.download(fileBase(project) + '_gantt.svg', text);
    };

    /* tooltip */
    const showTip = (e, t) => { if (tipApi.current) tipApi.current.show(e, html`<${TaskTip} t=${t} code=${t.wbsId ? tree.codes.get(t.wbsId) : ''} bl=${blById ? blById.get(t.id) : null} cal=${sched.cal} currency=${currency} fc=${fcMoved.get(t.id) || null} />`); };
    const hideTip = () => { if (tipApi.current) tipApi.current.hide(); };
    const showSumTip = (e, r) => {
      if (!tipApi.current || drag.current) return;
      tipApi.current.show(e, html`<div><strong>${r.code ? r.code + ' ' : ''}${r.name}</strong><div class="sched-tipgrid">
        <span>Inicio – fin</span><span>${fmt.date(r.roll.start, 'dm')} – ${fmt.date(r.roll.finish)}</span>
        <span>Duración</span><span>${daysTxt(sched.cal.countWork(r.roll.start, r.roll.finish))} hábiles</span>
        <span>Actividades</span><span>${r.roll.count}</span>
        <span>Avance</span><span>${fmt.num(r.roll.progress)} %</span>
        <span>Costo</span><span>${fmt.money(r.roll.cost, currency)}</span>
      </div></div>`);
    };

    /* arrastre de barras: vista previa directa sobre el DOM, escritura al soltar */
    const resetDom = (d) => {
      d.el.removeAttribute('transform'); d.el.classList.remove('is-drag');
      if (d.main) d.main.setAttribute('width', d.w0);
      if (d.under) d.under.setAttribute('width', d.w0);
      if (d.prog) d.prog.removeAttribute('display');
      if (d.handle) d.handle.setAttribute('x', d.h0);
      if (dragTipRef.current) dragTipRef.current.setAttribute('display', 'none');
    };
    const onDown = (e, g) => {
      if (e.button !== undefined && e.button !== 0) return;
      hideTip();
      const el = e.currentTarget;
      const mode = canWrite && !g.ms && e.target && e.target.classList && e.target.classList.contains('sched-handle') ? 'resize' : 'move';
      const main = el.querySelector('.sched-bar-main'), prog = el.querySelector('.sched-bar-prog'), handle = el.querySelector('.sched-handle'), under = el.querySelector('.sched-bar-under');
      drag.current = { g, el, mode, x0: e.clientX, dx: 0, moved: false, pid: e.pointerId, main, prog, handle, under, w0: main ? +main.getAttribute('width') : 0, h0: handle ? +handle.getAttribute('x') : 0 };
      /* captura también en solo lectura: así pointerup siempre llega y el estado de arrastre no queda colgado */
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* el navegador no admite captura */ }
    };
    const onMove = (e) => {
      const d = drag.current; if (!d || !canWrite || e.pointerId !== d.pid) return;
      d.dx = e.clientX - d.x0;
      if (!d.moved && Math.abs(d.dx) < 4) return;
      if (!d.moved) { d.moved = true; d.el.classList.add('is-drag'); }
      const steps = Math.round(d.dx / L.ppd); const t = d.g.t; const cal = sched.cal;
      let txt, xr;
      if (d.mode === 'move') {
        let ns = D.add(t.startDate, steps); if (!cal.isWork(ns)) ns = cal.dateOf(cal.indexOf(ns));
        const off = D.diff(t.startDate, ns) * L.ppd;
        d.el.setAttribute('transform', 'translate(' + off + ',0)'); txt = (t.milestone ? 'Hito: ' : 'Inicio: ') + fmt.date(ns, 'dow'); xr = d.g.x0 + off;
      } else {
        let nf = D.add(t.finishDate, steps); if (nf < t.startDate) nf = t.startDate;
        let guard = 0; while (!cal.isWork(nf) && nf > t.startDate && guard++ < 60) nf = D.add(nf, -1);
        const nw = Math.max(L.ppd, (D.diff(t.startDate, nf) + 1) * L.ppd);
        d.main.setAttribute('width', nw); if (d.under) d.under.setAttribute('width', nw); if (d.prog) d.prog.setAttribute('display', 'none'); if (d.handle) d.handle.setAttribute('x', d.h0 + (nw - d.w0));
        txt = 'Fin: ' + fmt.date(nf, 'dow') + ' · ' + daysTxt(Math.max(1, cal.countWork(t.startDate, nf))); xr = d.g.x0 + nw;
      }
      const tg = dragTipRef.current;
      if (tg) {
        const tx = tg.querySelector('text'), tr = tg.querySelector('rect'); tx.textContent = txt;
        const wt = tw(txt) + 14; const xx = PM.clamp(d.mode === 'move' ? xr : xr - wt, 0, Math.max(0, L.width - wt)); const yy = d.g.top < 20 ? d.g.top + ROW_H - 4 : d.g.top - 19;
        tr.setAttribute('width', wt); tx.setAttribute('x', 7); tg.setAttribute('transform', 'translate(' + xx + ',' + yy + ')'); tg.removeAttribute('display');
      }
    };
    const commitDrag = (t, mode, steps) => {
      const cal = sched.cal;
      if (mode === 'move') {
        if (D.valid(t.actualStart)) { PM.toast('«' + taskName(t) + '» tiene inicio real (' + fmt.date(t.actualStart) + ') y no se puede mover. Cambia el inicio real en el editor de la actividad.', { timeout: 7000 }); return; }
        let ns = D.add(t.startDate, steps); if (!cal.isWork(ns)) ns = cal.dateOf(cal.indexOf(ns));
        if (ns === t.startDate) return; /* al ajustar al día hábil no se movió: no crea una restricción */
        w.updateTask(t.id, { start: ns });
        explainStart(w.get(), project.start, t.id, ns);
      } else {
        if (D.valid(t.actualFinish) && t.progress >= 100) { PM.toast('«' + taskName(t) + '» ya terminó (fin real ' + fmt.date(t.actualFinish) + '); su duración no se cambia arrastrando.', { timeout: 7000 }); return; }
        let nf = D.add(t.finishDate, steps); if (nf < t.startDate) nf = t.startDate;
        let guard = 0; while (!cal.isWork(nf) && nf > t.startDate && guard++ < 60) nf = D.add(nf, -1);
        const dur = Math.max(1, cal.countWork(t.startDate, nf));
        if (dur !== t.duration) w.updateTask(t.id, { duration: dur, milestone: false });
      }
    };
    const onUp = (e) => {
      const d = drag.current; if (!d || (e.pointerId !== undefined && e.pointerId !== d.pid)) return;
      drag.current = null;
      try { d.el.releasePointerCapture(d.pid); } catch (er) { /* sin captura */ }
      resetDom(d);
      const t = d.g.t;
      if (!d.moved) {
        setSel(t.id);
        const now = Date.now();
        if (lastClick.current.id === t.id && now - lastClick.current.at < 450) { lastClick.current = { id: null, at: 0 }; edit(t.id); }
        else lastClick.current = { id: t.id, at: now };
        return;
      }
      const steps = Math.round(d.dx / L.ppd);
      if (steps) commitDrag(t, d.mode, steps);
    };
    const onCancel = () => { const d = drag.current; if (!d) return; drag.current = null; resetDom(d); };

    if (!sched.tasks.length) {
      return html`<${ui.Empty} icon="gantt" title="Aún no hay actividades" actions=${canWrite ? html`
        <${ui.Button} variant="primary" icon="plus" onClick=${() => addTask(false)}>Agregar actividad</${ui.Button}>
        <${ui.Button} icon="wbs" onClick=${() => importFromWbs(w, tree)}>Importar desde la EDT</${ui.Button}>` : null}>
        ${canWrite
          ? html`Agrega las actividades una por una o crea una por cada paquete de trabajo de la EDT. Las fechas se calculan con el método de la ruta crítica a partir del inicio del proyecto (${fmt.date(project.start)}), en días hábiles.`
          : 'Este cronograma todavía no tiene actividades. Cuando alguien con permiso de edición las agregue, aquí verás el diagrama de Gantt con las fechas calculadas por el método de la ruta crítica.'}
      </${ui.Empty}>`;
    }

    /* celdas */
    const validatePred = (id) => (s) => {
      const r = parseDeps(s, sched.tasks, id); if (r.error) return r;
      const via = cycleVia(w.get().tasks || [], id, r.deps);
      if (via) return { error: 'Crearía una dependencia circular: la fila ' + ((idxById.get(via) ?? -1) + 1) + ' ya depende, directa o indirectamente, de esta actividad.' };
      return { value: r.deps };
    };
    const ro = !canWrite;
    const taskCell = (k, r) => {
      const t = r.task;
      let c;
      if (k === 'num') c = html`<div class="sched-ro num sched-n">${r.num}</div>`;
      else if (k === 'code') c = html`<div class="sched-ro sched-mono">${(t.wbsId && tree.codes.get(t.wbsId)) || '—'}</div>`;
      else if (k === 'name') c = html`<div class="sched-name" style=${'padding-left:' + (r.depth * (colSet === 'compact' ? 7 : 12)) + 'px'}>
          ${t.milestone ? html`<${ui.Icon} name="milestone" size=${11} class="sched-ms-ico" title="Hito" />` : null}
          <${EditCell} value=${t.name || ''} display=${taskName(t)} validate=${V.name} label=${'Nombre, fila ' + r.num} readOnly=${ro} auto=${autoEdit && autoEdit.id === t.id ? autoEdit.n : null} title=${taskName(t)} onCommit=${(v) => w.updateTask(t.id, { name: v })} />
        </div>`;
      else if (k === 'dur') c = html`<${EditCell} value=${String(t.duration)} display=${fmt.num(t.duration) + ' d'} validate=${V.dur} inputMode="numeric" align="right" label=${'Duración en días hábiles, fila ' + r.num} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { duration: v, milestone: v === 0 })} />`;
      else if (k === 'start') c = html`<${EditCell} kind="date" cls="sched-mono" value=${t.start || t.startDate} display=${fd(t.startDate)} validate=${V.date} label=${'No comenzar antes de, fila ' + r.num} readOnly=${ro}
          icon=${t.start ? html`<span class="sched-pin" aria-hidden="true"></span>` : null}
          title=${t.start ? 'Restricción: no comenzar antes del ' + fmt.date(t.start) + '. Borra la fecha para quitarla.' : 'Escribe una fecha para fijar la restricción «No comenzar antes de».'}
          onCommit=${(v) => { w.updateTask(t.id, { start: v }); if (v) explainStart(w.get(), project.start, t.id, v); }} />`;
      else if (k === 'finish') c = html`<div class="sched-ro sched-mono">${fd(t.finishDate)}</div>`;
      else if (k === 'pct') c = html`<${EditCell} value=${String(Math.round(t.progress))} display=${fmt.num(t.progress) + ' %'} validate=${V.pct} inputMode="decimal" align="right" label=${'% de avance, fila ' + r.num} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { progress: v })} />`;
      else if (k === 'pred') c = html`<${EditCell} cls="sched-mono" value=${depsToText(t.deps, idxById)} validate=${validatePred(t.id)} label=${'Predecesoras, fila ' + r.num} readOnly=${ro} title=${GCOLS.pred.title} onCommit=${(v) => w.updateTask(t.id, { deps: v })} />`;
      return html`<div key=${k} data-col=${k}>${c}</div>`;
    };
    const sumCell = (k, r) => {
      let c = null;
      if (k === 'num') c = html`<div style="display:flex;justify-content:flex-end;padding-right:2px"><button type="button" class="sched-tog" aria-expanded=${r.open ? 'true' : 'false'} aria-label=${(r.open ? 'Contraer ' : 'Expandir ') + r.name} title=${r.open ? 'Contraer' : 'Expandir'} onClick=${(e) => { e.stopPropagation(); toggleGroup(r.id); }}><${ui.Icon} name=${r.open ? 'chevron-down' : 'chevron-right'} size=${14} /></button></div>`;
      else if (k === 'code') c = html`<div class="sched-ro sched-mono" style="color:var(--fg)">${r.code}</div>`;
      else if (k === 'name') c = html`<div class="sched-ro" style=${'color:var(--fg);padding-left:' + (r.depth * (colSet === 'compact' ? 7 : 12) + 5) + 'px'} title=${r.name}>${r.name}</div>`;
      else if (k === 'dur') c = html`<div class="sched-ro num">${fmt.num(sched.cal.countWork(r.roll.start, r.roll.finish))} d</div>`;
      else if (k === 'start') c = html`<div class="sched-ro sched-mono">${fd(r.roll.start)}</div>`;
      else if (k === 'finish') c = html`<div class="sched-ro sched-mono">${fd(r.roll.finish)}</div>`;
      else if (k === 'pct') c = html`<div class="sched-ro num">${fmt.num(r.roll.progress)} %</div>`;
      return html`<div key=${k} data-col=${k}>${c}</div>`;
    };
    const rowEls = rows.map((r) => {
      if (r.kind === 'sum') return html`<div key=${r.key} class=${cx('sched-row is-sum', sel === r.key && 'is-sel')} data-sum=${r.id} style=${'grid-template-columns:' + gridTemplate} onClick=${() => setSel(r.key)}>${cols.map((k) => sumCell(k, r))}</div>`;
      const t = r.task;
      return html`<div key=${r.key} class=${cx('sched-row', sel === t.id && 'is-sel', showCrit && t.critical && 'is-crit')} data-id=${t.id} style=${'grid-template-columns:' + gridTemplate}
        onClick=${() => { if (sel !== t.id) setSel(t.id); }}
        onDblClick=${(e) => { if (e.target.closest && e.target.closest('button.sched-cell, .sched-edit, .sched-tog')) return; edit(t.id); }}>${cols.map((k) => taskCell(k, r))}</div>`;
    });

    /* SVG */
    const H = Math.max(L.bodyH, ROW_H);
    const selIndex = rows.findIndex((r) => (r.kind === 'sum' ? r.key : r.id) === sel);
    const vlines = zoom === 'dia' ? L.tiers.top : L.tiers.bottom;
    const lineEl = (l, y1, y2) => html`<line x1=${l.x} y1=${y1} x2=${l.x} y2=${y2} stroke="var(--signal)" stroke-width=${l.kind === 'status' ? 1.5 : 1} stroke-dasharray=${l.kind === 'today' ? '3 3' : undefined} />`;
    const label = (g) => (g.label ? html`<text class="sched-lbl" x=${g.label.x} y=${g.top + 16.5} text-anchor=${g.label.anchor}>${g.label.text}</text>` : null);
    const renderBar = (g) => {
      if (g.r.kind === 'sum') return html`<g key=${g.r.key} class="sched-sum" data-sum=${g.r.id} onMouseMove=${(e) => showSumTip(e, g.r)} onMouseLeave=${hideTip}><path d=${bracket(g.x0, g.x1, g.top + 8)} fill="var(--fg-2)" />${g.label ? html`<text class="sched-lbl sched-lbl-sum" x=${g.label.x} y=${g.top + 17} text-anchor=${g.label.anchor}>${g.label.text}</text>` : null}</g>`;
      const t = g.t; const color = g.crit ? 'var(--crit)' : 'var(--accent)';
      const common = { class: cx('sched-bar', ro && 'ro'), 'data-id': t.id, 'data-crit': g.crit ? '1' : '0', onPointerDown: (e) => onDown(e, g), onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onCancel, onMouseMove: (e) => { if (!drag.current) showTip(e, t); }, onMouseLeave: hideTip };
      if (g.ms) return html`<g key=${t.id} ...${common}>
          <rect x=${g.xm - 10} y=${g.top + 2} width="20" height="21" fill="transparent" />
          <path class="sched-ms" data-cx=${g.xm} d=${diamond(g.xm, g.top + 12.5, 7)} fill=${g.crit ? 'var(--crit)' : 'var(--fg)'} stroke="var(--surface)" stroke-width="1.5" />
          ${label(g)}
        </g>`;
      const wd = Math.max(2, g.x1 - g.x0); const pw = (wd * PM.clamp(t.progress, 0, 100)) / 100;
      return html`<g key=${t.id} ...${common}>
          <rect class="sched-hit" x=${g.x0 - 2} y=${g.top + 3} width=${wd + 4} height="19" fill="transparent" />
          ${g.fc ? html`<rect class="sched-bar-under" x=${g.x0} y=${g.top + 6} width=${wd} height="13" rx="3" fill="var(--surface)" />` : null}
          <rect class="sched-bar-main" x=${g.x0} y=${g.top + 6} width=${wd} height="13" rx="3" fill=${color} fill-opacity="0.28" stroke=${color} stroke-opacity="0.75" stroke-width="1" />
          ${pw > 0 ? html`<rect class="sched-bar-prog" x=${g.x0} y=${g.top + 6} width=${pw} height="13" rx="3" fill=${color} />` : null}
          ${canWrite ? html`<rect class="sched-handle" x=${g.x1 - 5} y=${g.top + 3} width="10" height="19" fill="transparent" />` : null}
          ${label(g)}
        </g>`;
    };
    /* Pronóstico al corte: barra (o rombo) con trama y contorno discontinuo en --signal, detrás de la barra planificada. */
    const renderFc = (g) => {
      if (!g.fc) return null;
      const t = g.t, f = g.fc.f;
      const attrs = { class: 'sched-fc', 'data-id': t.id, 'data-start': f.startDate, 'data-finish': f.finishDate, onMouseMove: (e) => { if (!drag.current) showTip(e, t); }, onMouseLeave: hideTip };
      if (g.fc.xm !== undefined) return html`<g key=${'fc' + t.id} ...${attrs}><path d=${diamond(g.fc.xm, g.top + 12.5, 8)} fill=${'url(#' + uid + 'h)'} stroke="var(--signal)" stroke-width="1.5" stroke-dasharray="3 2" /></g>`;
      return html`<g key=${'fc' + t.id} ...${attrs}><rect x=${g.fc.x0} y=${g.top + 3.5} width=${Math.max(2, g.fc.x1 - g.fc.x0)} height="18" rx="3" fill=${'url(#' + uid + 'h)'} stroke="var(--signal)" stroke-width="1.25" stroke-dasharray="4 2" /></g>`;
    };
    const headSvg = html`<svg ref=${headSvgRef} class="sched-svg" width=${L.width} height=${HEAD_H} viewBox=${'0 0 ' + L.width + ' ' + HEAD_H} role="img" aria-label="Escala de tiempo">
      <rect x="0" y="0" width=${L.width} height=${HEAD_H} fill="var(--surface-2)" />
      ${L.tiers.top.map((c) => html`<g key=${'t' + c.key}><line x1=${c.x} y1="0" x2=${c.x} y2=${T1} stroke="var(--line)" /><text x=${c.x + 5} y="14" style="font-weight:600;fill:var(--fg)">${tierLabel(c)}</text></g>`)}
      <line x1="0" y1=${T1 - 0.5} x2=${L.width} y2=${T1 - 0.5} stroke="var(--line)" />
      ${L.tiers.bottom.map((c) => { const lab = tierLabel(c); const off = c.date && !sched.cal.isWork(c.date); return html`<g key=${'b' + c.key}><line x1=${c.x} y1=${T1} x2=${c.x} y2=${T2} stroke="var(--line)" />${lab ? html`<text x=${c.x + c.w / 2} y="34" text-anchor="middle" class=${off ? 'sched-faint' : ''}>${lab}</text>` : null}</g>`; })}
      <line x1="0" y1=${T2 - 0.5} x2=${L.width} y2=${T2 - 0.5} stroke="var(--line)" />
      ${L.lines.map((l) => html`<g key=${l.kind}>${lineEl(l, T2, HEAD_H)}<text class="sched-mark" x=${l.tx} y=${HEAD_H - 6} text-anchor=${l.anchor}>${l.label}</text></g>`)}
      <line x1="0" y1=${HEAD_H - 0.5} x2=${L.width} y2=${HEAD_H - 0.5} stroke="var(--line-strong)" />
    </svg>`;
    const bodySvg = html`<svg ref=${bodySvgRef} class="sched-svg sched-body" width=${L.width} height=${H} viewBox=${'0 0 ' + L.width + ' ' + H} data-origin=${L.lo} data-ppd=${L.ppd} role="img" aria-label="Diagrama de Gantt">
      <defs>
        <marker id=${uid + 'a'} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.5 L8,4 L0,7.5 z" fill="var(--fg-3)" /></marker>
        <marker id=${uid + 'c'} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.5 L8,4 L0,7.5 z" fill="var(--crit)" /></marker>
        <pattern id=${uid + 'h'} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--surface)" fill-opacity="0.55" /><line x1="0" y1="0" x2="0" y2="5" stroke="var(--signal)" stroke-width="1.5" stroke-opacity="0.6" /></pattern>
      </defs>
      ${L.nonwork.map((n) => html`<rect key=${n.d} class=${cx('sched-nonwork', n.hol && 'sched-holiday')} data-date=${n.d} x=${n.x} y="0" width=${L.ppd} height=${H} fill=${n.hol ? 'var(--signal-wash)' : 'var(--surface-3)'} fill-opacity=${n.hol ? 1 : 0.75}>${n.hol ? html`<title>${n.hol + ' · ' + fmt.date(n.d, 'long')}</title>` : null}</rect>`)}
      ${vlines.map((c) => html`<line key=${'v' + c.key} x1=${c.x} y1="0" x2=${c.x} y2=${H} stroke="var(--grid)" />`)}
      ${rows.map((r, i) => html`<line key=${'h' + r.key} x1="0" y1=${(i + 1) * ROW_H - 0.5} x2=${L.width} y2=${(i + 1) * ROW_H - 0.5} stroke="var(--grid)" />`)}
      ${selIndex >= 0 ? html`<rect class="sched-selrect" x="0" y=${selIndex * ROW_H} width=${L.width} height=${ROW_H - 1} fill="var(--accent-wash)" fill-opacity="0.7" />` : null}
      ${L.lines.map((l) => html`<g key=${'l' + l.kind}>${lineEl(l, 0, H)}</g>`)}
      ${showFc ? L.bars.map(renderFc) : null}
      ${showBase ? L.bars.map((g) => (!g.base ? null : g.base.xm !== undefined
        ? html`<path key=${'bl' + g.t.id} class="sched-base" d=${diamond(g.base.xm, g.top + 24, 4)} fill="var(--surface)" stroke="var(--fg-3)" stroke-width="1.5" />`
        : html`<rect key=${'bl' + g.t.id} class="sched-base" x=${g.base.x0} y=${g.top + 22} width=${Math.max(2, g.base.x1 - g.base.x0)} height="4" rx="1" fill="var(--fg-3)" />`)) : null}
      <g fill="none" stroke-width="1.25">${L.arrows.map((a) => html`<path key=${a.key} class=${cx('sched-dep', a.crit && 'is-crit')} d=${a.d} stroke=${a.crit ? 'var(--crit)' : 'var(--fg-3)'} marker-end=${'url(#' + uid + (a.crit ? 'c' : 'a') + ')'} />`)}</g>
      ${L.bars.map(renderBar)}
      <g ref=${dragTipRef} class="sched-dragtip" display="none" pointer-events="none"><rect x="0" y="0" rx="3" height="18" width="10" fill="var(--fg)" /><text x="7" y="13" style="fill:var(--surface);font-weight:600"></text></g>
    </svg>`;

    const up = neighbor(-1), down = neighbor(1);
    const sw = (style) => html`<span class="swatch" style=${style}></span>`;
    return html`<div class="stack" ref=${wrapRef}>
      <div class="toolbar sched-tools" role="toolbar" aria-label="Herramientas del cronograma">
        ${canWrite ? html`<div class="row">
          <${ui.Button} size="sm" variant="primary" icon="plus" onClick=${() => addTask(false)}>Agregar actividad</${ui.Button}>
          <${ui.Button} size="sm" icon="milestone" onClick=${() => addTask(true)}>Agregar hito</${ui.Button}>
          <${ui.Button} size="sm" icon="edit" disabled=${!selTask} onClick=${() => selTask && edit(selTask.id)}>Editar</${ui.Button}>
          <${ui.Button} size="sm" variant="danger" icon="trash" disabled=${!selTask} onClick=${() => selTask && deleteTaskFlow(w, sched, selTask.id).then((ok) => ok && setSel(null))}>Eliminar</${ui.Button}>
          <div class="btn-group">
            <${ui.Button} size="sm" icon="arrow-up" aria-label="Subir actividad" title="Subir actividad" disabled=${!up} onClick=${() => move(-1)} />
            <${ui.Button} size="sm" icon="arrow-down" aria-label="Bajar actividad" title="Bajar actividad" disabled=${!down} onClick=${() => move(1)} />
          </div>
          <span class="toolbar-sep"></span>
          <${ui.Button} size="sm" icon="wbs" onClick=${() => importFromWbs(w, tree)}>Importar desde la EDT</${ui.Button}>
        </div>` : html`<div class="row"><${ui.Button} size="sm" icon="eye" disabled=${!selTask} onClick=${() => selTask && edit(selTask.id)}>Ver detalle</${ui.Button}><span class="small faint">Solo lectura: no puedes modificar el cronograma.</span></div>`}
        <div class="row">
          <${ui.Segmented} label="Escala de tiempo" value=${zoom} onChange=${setZoom} options=${Object.keys(ZOOMS).map((k) => ({ value: k, label: ZOOMS[k].label }))} />
          <${ui.Check} label="Agrupar por EDT" checked=${!!group} onValue=${setGroup} />
          <${ui.Check} label="Ruta crítica" checked=${!!showCrit} onValue=${setShowCrit} />
          <span title=${blSched ? 'Línea base ' + (baselines.schedule.label || '') + ' del ' + fmt.date(baselines.schedule.date) : 'Aún no hay línea base del cronograma. Establécela en Líneas base.'}><${ui.Check} label="Línea base" checked=${showBase} disabled=${!blSched} onValue=${setShowBase} /></span>
          <span data-fc-toggle title=${fcAvail ? 'Dibuja las fechas de la red actualizada a la fecha de corte (' + fmt.date(statusDate) + ') para el trabajo pendiente que se desplaza: ' + FC_RULE + '. No cambia el cronograma guardado.' : 'La red actualizada a la fecha de corte (' + fmt.date(statusDate) + ') coincide con lo planificado: ninguna actividad pendiente se desplaza.'}><${ui.Check} label="Pronóstico al corte" checked=${showFc} disabled=${!fcAvail} onValue=${(v) => setFcHidden(!v)} /></span>
          <${ui.Check} label="Dependencias" checked=${!!showDeps} onValue=${setShowDeps} />
          <label class="sched-lblsel">Etiqueta
            <select class="select" value=${labelMode} onChange=${(e) => setLabelMode(e.currentTarget.value)}><option value="name">Nombre</option><option value="resp">Responsable</option><option value="none">Ninguna</option></select>
          </label>
          <${ui.Button} size="sm" variant="ghost" icon="table" onClick=${() => setColsPref(colSet === 'full' ? 'compact' : 'full')}>${colSet === 'full' ? 'Menos columnas' : 'Más columnas'}</${ui.Button}>
          <span class="spacer"></span>
          <${ui.Button} size="sm" icon="download" onClick=${exportCsv}>Exportar CSV</${ui.Button}>
          <${ui.Button} size="sm" icon="image" onClick=${exportSvg}>Descargar SVG</${ui.Button}>
        </div>
      </div>
      <div class="sched-frame" ref=${frameRef}>
        <div class="sched-inner" style=${'width:' + (gridW + L.width) + 'px'}>
          <div class="sched-headrow">
            <div class="sched-ghead" style=${'width:' + gridW + 'px;height:' + HEAD_H + 'px;grid-template-columns:' + gridTemplate}>${cols.map((k) => html`<div key=${k} class=${GCOLS[k].num ? 'num' : ''} title=${GCOLS[k].title}>${GCOLS[k].label}</div>`)}</div>
            ${headSvg}
          </div>
          <div class="sched-bodyrow">
            <div class="sched-grid" style=${'width:' + gridW + 'px'}>${rowEls}</div>
            ${bodySvg}
          </div>
          <${TipLayer} host=${frameRef} api=${tipApi} />
        </div>
      </div>
      <div class="legend sched-legend">
        <span class="legend-item">${sw('background:var(--accent-wash);border:1px solid var(--accent)')}Actividad (por ejecutar)</span>
        <span class="legend-item">${sw('background:var(--accent)')}Avance</span>
        ${showCrit ? html`<span class="legend-item">${sw('background:var(--crit)')}Ruta crítica</span>` : null}
        <span class="legend-item"><${ui.Icon} name="milestone" size=${12} />Hito</span>
        ${group ? html`<span class="legend-item">${sw('background:var(--fg-2);height:5px')}Resumen de la EDT</span>` : null}
        ${showBase ? html`<span class="legend-item">${sw('background:var(--fg-3);height:4px')}Línea base ${baselines.schedule.label || ''}</span>` : null}
        ${showFc ? html`<span class="legend-item" data-legend="forecast"><span class="swatch sched-fc-swatch"></span>Pronóstico al corte</span>` : null}
        <span class="legend-item"><span class="legend-line" style="background:var(--signal)"></span>Fecha de corte / hoy</span>
        ${colSet === 'full' ? html`<span class="legend-item"><span class="sched-pin"></span>Restricción «No comenzar antes de»</span>` : null}
        ${zoom !== 'mes' ? html`<span class="legend-item">${sw('background:var(--surface-3);border:1px solid var(--line)')}No laborable</span><span class="legend-item">${sw('background:var(--signal-wash);border:1px solid var(--line)')}Festivo</span>` : null}
      </div>
      ${showFc ? html`<p class="sched-fcnote" data-fc-note><span class="swatch sched-fc-swatch" aria-hidden="true"></span><span>${fcMoved.size === 1 ? '1 actividad pendiente cambia de fecha' : fcMoved.size + ' actividades pendientes cambian de fecha'} al actualizar la red a la fecha de corte (${fmt.date(statusDate)}): ${FC_RULE}. La trama muestra dónde quedan; las barras sólidas siguen siendo lo planificado (por eso lo atrasado figura como vencido) y el cronograma guardado no cambia.</span></p>` : null}
      ${canWrite ? html`<p class="xsmall faint">Arrastra una barra para moverla (queda como restricción «No comenzar antes de») o su borde derecho para cambiar la duración. Haz clic en una celda para editarla; doble clic en la fila o en la barra abre el editor completo.</p>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- resumen del cronograma */
  /* Celda del resumen (como ui.Stat, con data-stat para ubicarla). */
  const StripStat = ({ id, label, value, sub, tone, title, cls }) => html`<div class=${cx('stat', cls)} data-stat=${id} title=${title}>
    <div class="stat-label">${label}</div>
    <div class="stat-value" style=${tone ? 'color:var(--' + tone + ')' : ''}>${value}</div>
    ${sub ? html`<div class="stat-sub">${sub}</div>` : null}
  </div>`;
  /* Resumen: lo planificado (Inicio, Fin, Duración) y el pronóstico al corte (6.6), cuya variación se mide en días hábiles
     frente al fin de la línea base vigente o, sin ella, frente al fin planificado (la misma referencia del tablero). */
  function SummaryStrip({ m }) {
    const { sched, baselines, statusDate } = m;
    const forecast = m.forecast || sched;
    const s = useMemo(() => {
      const ts = sched.tasks;
      const r = rollOf(ts);
      const bl = baselines.schedule && baselines.schedule.schedule ? baselines.schedule.schedule : null;
      const blFinish = bl && D.valid(bl.finish) ? bl.finish : null;
      const ref = blFinish || sched.finish;
      return { crit: ts.filter((t) => t.critical).length, pct: r.progress, blFinish, blLabel: baselines.schedule ? baselines.schedule.label : '', varWd: blFinish ? wdVar(sched.cal, sched.finish, blFinish) : null,
        fcFinish: forecast.finish, fcVar: wdVar(sched.cal, forecast.finish, ref), moved: forecastDiff(sched, forecast).size };
    }, [sched, forecast, baselines.schedule]);
    const vs = s.blFinish ? 'frente a ' + (s.blLabel || 'la línea base') : 'frente al fin planificado';
    const refTxt = s.blFinish ? 'el fin de ' + (s.blLabel || 'la línea base') + ' (' + fmt.date(s.blFinish) + ')' : 'el fin planificado (' + fmt.date(sched.finish) + ')';
    const fcTitle = 'Red actualizada a la fecha de corte (' + fmt.date(statusDate) + ', 6.6 Controlar el cronograma): ' + FC_RULE + '. '
      + (s.moved ? (s.moved === 1 ? '1 actividad pendiente cambia de fecha. ' : s.moved + ' actividades pendientes cambian de fecha. ') : 'Ninguna actividad pendiente cambia de fecha. ')
      + 'Variación en días hábiles frente a ' + refTxt + '.';
    return html`<div class="card sched-strip">
      <${StripStat} id="start" label="Inicio" value=${fmt.date(sched.start)} />
      <${StripStat} id="finish" label="Fin" value=${fmt.date(sched.finish)} />
      <${StripStat} id="forecast" cls="sched-stat-fc" label="Fin pronosticado al corte" value=${fmt.date(s.fcFinish)} tone=${varTone(s.fcVar)} sub=${varPhrase(s.fcVar, vs)} title=${fcTitle} />
      <${StripStat} id="duration" label="Duración" value=${fmt.num(sched.workdays) + ' d'} sub="días hábiles" />
      <${StripStat} id="critical" label="Críticas" value=${fmt.num(s.crit)} tone=${s.crit ? 'crit' : null} sub="sin terminar" title=${CRIT_RULE} />
      <${StripStat} id="progress" label="Avance" value=${fmt.num(s.pct) + ' %'} sub="ponderado" title="Avance ponderado por costo (o por duración si no hay costos)" />
      <${StripStat} id="baseline" label=${'Fin ' + (s.blLabel || 'línea base')} value=${s.blFinish ? fmt.date(s.blFinish) : '—'}
        sub=${s.blFinish ? html`planificado <span style=${'white-space:nowrap;' + varColor(s.varWd)}>${varTxt(s.varWd)}</span>` : 'sin línea base'}
        title=${s.blFinish ? 'Fin de ' + (s.blLabel || 'la línea base') + '. Variación del fin planificado (' + fmt.date(sched.finish) + ') frente a ella: ' + varPhrase(s.varWd, '').trim() + '.' : 'Establece una línea base del cronograma en Líneas base para medir la variación del fin.'} />
    </div>`;
  }

  /* ---------------------------------------------------------------- pestaña Actividades (tabla completa) */
  function ActivitiesTab({ m, w, canWrite, sel, setSel, edit, focus, onFocused }) {
    const { sched, tree, currency, project } = m;
    const idxById = useMemo(() => new Map(sched.tasks.map((t, i) => [t.id, i])), [sched]);
    const tblRef = useRef();
    useLayoutEffect(() => {
      if (!focus) return;
      const tr = tblRef.current && tblRef.current.querySelector('tr[data-id="' + (window.CSS && window.CSS.escape ? window.CSS.escape(focus.id) : focus.id) + '"]');
      if (tr) { try { tr.scrollIntoView({ block: 'center' }); } catch (e) { /* sin soporte */ } }
      onFocused();
    }, [focus]);
    const ro = !canWrite;
    const validatePred = (id) => (s) => {
      const r = parseDeps(s, sched.tasks, id); if (r.error) return r;
      const via = cycleVia(w.get().tasks || [], id, r.deps);
      return via ? { error: 'Crearía una dependencia circular con la fila ' + ((idxById.get(via) ?? -1) + 1) + '.' } : { value: r.deps };
    };
    const exportCsv = () => PM.download(fileBase(project) + '_actividades.csv', scheduleCsv(sched, tree, currency));
    if (!sched.tasks.length) {
      const add = () => { const t = newTask(); w.setTasks((ts) => [...ts, t]); setSel(t.id); edit(t.id); };
      return html`<${ui.Empty} icon="table" title="Aún no hay actividades" actions=${canWrite ? html`
        <${ui.Button} variant="primary" icon="plus" onClick=${add}>Agregar actividad</${ui.Button}>
        <${ui.Button} icon="wbs" onClick=${() => importFromWbs(w, tree)}>Importar desde la EDT</${ui.Button}>` : null}>
        La tabla de actividades muestra, para cada actividad, sus fechas tempranas y tardías, las holguras, las predecesoras, el avance, el costo y los recursos.
      </${ui.Empty}>`;
    }
    return html`<div class="stack">
      <div class="row-between">
        <p class="small muted" style="max-width:80ch">Cronograma calculado por el método de la ruta crítica. Las fechas tempranas y tardías, y las holguras, se recalculan con cada cambio. ${canWrite ? 'Haz clic en una celda editable para cambiarla; doble clic en la fila abre el editor.' : ''}</p>
        <${ui.Button} size="sm" icon="download" onClick=${exportCsv}>Exportar CSV</${ui.Button}>
      </div>
      <div class="table-wrap">
        <table class="table table-tight sched-tbl" ref=${tblRef}>
          <thead><tr>
            <th class="num">#</th><th>EDT</th><th>Actividad</th><th class="num">Dur. (d)</th><th>Inicio</th><th>Fin</th><th>Inicio tardío</th><th>Fin tardío</th>
            <th class="num" title="Holgura total (días hábiles)">Holg. total</th><th class="num" title="Holgura libre (días hábiles)">Holg. libre</th><th>Crítica</th>
            <th>Predecesoras</th><th>No antes de</th><th class="num">% avance</th><th>Inicio real</th><th>Fin real</th><th class="num">Costo</th><th>Responsable</th><th>Recursos</th><th><span class="sr-only">Acciones</span></th>
          </tr></thead>
          <tbody>
            ${sched.tasks.map((t, i) => html`<tr key=${t.id} data-id=${t.id} class=${sel === t.id ? 'is-sel' : ''} onClick=${() => setSel(t.id)} onDblClick=${(e) => { if (e.target.closest && e.target.closest('button, input')) return; edit(t.id); }}>
              <td class="num faint">${i + 1}</td>
              <td class="mono xsmall">${(t.wbsId && tree.codes.get(t.wbsId)) || '—'}</td>
              <td class="edit" style="min-width:220px"><div class="sched-name">${t.milestone ? html`<${ui.Icon} name="milestone" size=${11} class="sched-ms-ico" />` : null}<${EditCell} value=${t.name || ''} display=${taskName(t)} validate=${V.name} label=${'Nombre, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { name: v })} /></div></td>
              <td class="edit" style="min-width:64px"><${EditCell} value=${String(t.duration)} display=${fmt.num(t.duration)} validate=${V.dur} align="right" label=${'Duración, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { duration: v, milestone: v === 0 })} /></td>
              <td class="mono xsmall">${fmt.date(t.startDate, 'short')}</td>
              <td class="mono xsmall">${fmt.date(t.finishDate, 'short')}</td>
              <td class="mono xsmall">${fmt.date(t.lateStart, 'short')}</td>
              <td class="mono xsmall">${fmt.date(t.lateFinish, 'short')}</td>
              <td class="num" style=${t.tf < 0 ? 'color:var(--crit)' : ''}>${fmt.num(t.tf)}</td>
              <td class="num">${fmt.num(t.ff)}</td>
              <td>${critCell(t)}</td>
              <td class="edit" style="min-width:110px"><${EditCell} cls="sched-mono" value=${depsToText(t.deps, idxById)} validate=${validatePred(t.id)} label=${'Predecesoras, fila ' + (i + 1)} readOnly=${ro} title=${GCOLS.pred.title} onCommit=${(v) => w.updateTask(t.id, { deps: v })} /></td>
              <td class="edit" style="min-width:120px"><${EditCell} kind="date" cls="sched-mono" value=${t.start || ''} display=${t.start ? fmt.date(t.start, 'short') : '—'} validate=${V.date} label=${'No comenzar antes de, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => { w.updateTask(t.id, { start: v }); if (v) explainStart(w.get(), project.start, t.id, v); }} /></td>
              <td class="edit" style="min-width:70px"><${EditCell} value=${String(Math.round(t.progress))} display=${fmt.num(t.progress) + ' %'} validate=${V.pct} align="right" label=${'% de avance, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { progress: v })} /></td>
              <td class="mono xsmall">${t.actualStart ? fmt.date(t.actualStart, 'short') : '—'}</td>
              <td class="mono xsmall">${t.actualFinish ? fmt.date(t.actualFinish, 'short') : '—'}</td>
              <td class="edit" style="min-width:120px"><${EditCell} value=${String(num(t.cost))} display=${fmt.money(t.cost, currency)} validate=${V.money} align="right" inputMode="decimal" label=${'Costo, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { cost: v })} /></td>
              <td class="edit" style="min-width:140px"><${EditCell} value=${t.responsible || ''} display=${t.responsible || '—'} validate=${V.text} label=${'Responsable, fila ' + (i + 1)} readOnly=${ro} onCommit=${(v) => w.updateTask(t.id, { responsible: v })} /></td>
              <td class="wrap xsmall">${resText(t.resources) || html`<span class="faint">—</span>`}</td>
              <td><${ui.IconButton} size="sm" icon=${canWrite ? 'edit' : 'eye'} label=${(canWrite ? 'Editar ' : 'Ver ') + taskName(t)} onClick=${(e) => { e.stopPropagation(); edit(t.id); }} /></td>
            </tr>`)}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- pestaña Hitos */
  function MilestonesTab({ m, canWrite, edit, addMilestone }) {
    const { sched, baselines, statusDate, tree } = m;
    const forecast = m.forecast || sched;
    const blById = useMemo(() => { const b = baselines.schedule && baselines.schedule.schedule; return b && Array.isArray(b.tasks) ? new Map(b.tasks.map((x) => [x.id, x])) : null; }, [baselines.schedule]);
    const list = useMemo(() => sched.tasks.map((t, i) => ({ t, n: i + 1 })).filter((x) => x.t.milestone).sort((a, b) => (a.t.startDate < b.t.startDate ? -1 : a.t.startDate > b.t.startDate ? 1 : a.n - b.n)), [sched]);
    if (!list.length) return html`<${ui.Empty} icon="milestone" title="Aún no hay hitos" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="milestone" onClick=${addMilestone}>Agregar hito</${ui.Button}>` : null}>
      Los hitos marcan eventos significativos sin duración: aprobación de la ingeniería, entrega del andamio certificado, acta de cierre. Se dibujan al cierre de su fecha.</${ui.Empty}>`;
    /* «Vencido» se mide con la fecha planificada (sched); el pronóstico al corte va en su propia columna. */
    const status = (t) => (t.progress >= 100 ? { label: 'Cumplido', tone: 'good' } : t.startDate < statusDate ? { label: 'Vencido', tone: 'crit' } : { label: 'Próximo', tone: 'info' });
    const counts = PM.groupBy(list, (x) => status(x.t).label);
    const moved = forecastDiff(sched, forecast);
    const nMoved = list.filter((x) => moved.has(x.t.id)).length;
    const blLabel = baselines.schedule ? baselines.schedule.label || 'la línea base' : '';
    const fcHead = 'Fecha del hito en la red actualizada a la fecha de corte (' + fmt.date(statusDate) + '): ' + FC_RULE + '. Variación en días hábiles frente a ' + (blById ? blLabel : 'la fecha planificada') + '; positivo = atraso.';
    return html`<div class="stack">
      <div class="row">
        <${ui.Chip} tone="good">${(counts.Cumplido || []).length} cumplidos</${ui.Chip}>
        <${ui.Chip} tone="crit">${(counts.Vencido || []).length} vencidos</${ui.Chip}>
        <${ui.Chip} tone="info">${(counts['Próximo'] || []).length} próximos</${ui.Chip}>
        ${nMoved ? html`<${ui.Chip} tone="signal" title=${fcHead}>${nMoved === 1 ? '1 desplazado al corte' : nMoved + ' desplazados al corte'}</${ui.Chip}>` : null}
        <span class="small faint">Estado a la fecha de corte ${fmt.date(statusDate)}.</span>
        <span class="spacer"></span>
        ${canWrite ? html`<${ui.Button} size="sm" icon="milestone" onClick=${addMilestone}>Agregar hito</${ui.Button}>` : null}
      </div>
      <div class="table-wrap"><table class="table sched-tbl sched-mstbl">
        <thead><tr><th class="num">#</th><th>Hito</th><th>EDT</th><th>Fecha planificada</th><th>Fecha línea base</th><th class="num" title="Fecha planificada frente a la línea base, en días hábiles; positivo = atraso">Variación (días hábiles)</th><th title=${fcHead}>Pronóstico al corte</th><th class="num">Holgura total</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${list.map(({ t, n }) => {
          const b = blById && blById.get(t.id); const v = b ? wdVar(sched.cal, t.startDate, b.start) : null; const st = status(t);
          const f = forecast.byId.get(t.id) || t; const fv = wdVar(sched.cal, f.startDate, b ? b.start : t.startDate); const isMoved = moved.has(t.id);
          return html`<tr key=${t.id} data-id=${t.id}>
          <td class="num faint">${n}</td>
          <td class="wrap" style="min-width:260px"><strong style="font-weight:600">${taskName(t)}</strong>${t.critical ? html` <${ui.Chip} tone="crit">Crítico</${ui.Chip}>` : null}</td>
          <td class="mono xsmall">${(t.wbsId && tree.codes.get(t.wbsId)) || '—'}</td>
          <td class="mono xsmall">${fmt.date(t.startDate, 'dow')} ${t.startDate.slice(0, 4)}</td>
          <td class="mono xsmall">${b ? fmt.date(b.start, 'short') : html`<span class="faint">—</span>`}</td>
          <td class="num" style=${varColor(v)}>${v === null ? '—' : varTxt(v)}</td>
          <td class="mono xsmall" data-col="forecast" data-date=${f.startDate} data-var=${fv} title=${isMoved ? 'Se desplaza ' + varPhrase(wdVar(sched.cal, f.startDate, t.startDate), 'frente a la fecha planificada') + ' al actualizar la red a la fecha de corte.' : 'Coincide con la fecha planificada.'}><span style=${isMoved ? 'color:var(--signal-ink);font-weight:600' : ''}>${fmt.date(f.startDate, 'short')}</span> <span style=${varColor(fv)}>${varTxt(fv)}</span></td>
          <td class="num">${fmt.num(t.tf)} d</td>
          <td><${ui.Chip} tone=${st.tone}>${st.label}</${ui.Chip}></td>
          <td><${ui.IconButton} size="sm" icon=${canWrite ? 'edit' : 'eye'} label=${(canWrite ? 'Editar ' : 'Ver ') + taskName(t)} onClick=${() => edit(t.id)} /></td>
        </tr>`; })}</tbody>
      </table></div>
      <p class="xsmall faint">«Pronóstico al corte»: fecha del hito en la red actualizada a la fecha de corte (6.6 Controlar el cronograma); su variación se mide en días hábiles frente a ${blById ? blLabel : 'la fecha planificada'}. El estado «Vencido» se mide con la fecha planificada.</p>
      ${blById ? null : html`<p class="xsmall faint">Sin línea base del cronograma: establece una en Líneas base para comparar las fechas de los hitos.</p>`}
    </div>`;
  }

  /* ---------------------------------------------------------------- pestaña Calendario */
  function CalendarTab({ m, w, canWrite }) {
    const { schedule, sched, project } = m;
    const settings = schedule.settings || {};
    const ww = [5, 6, 7].includes(Number(settings.workweek)) ? Number(settings.workweek) : 5;
    const useCO = settings.holidaysCO !== false;
    const extra = useMemo(() => [...new Set((settings.extraHolidays || []).filter(D.valid))].sort(), [settings.extraHolidays]);
    const [newDay, setNewDay] = useState('');
    const [err, setErr] = useState(null);
    const ro = !canWrite;
    const first = D.min(project.start, sched.tasks.length ? sched.start : null) || D.today();
    const last = D.max(project.end, sched.tasks.length ? sched.finish : null, first) || first;
    const years = []; for (let y = +first.slice(0, 4); y <= Math.min(+last.slice(0, 4), +first.slice(0, 4) + 4); y++) years.push(y);
    const cal = sched.cal;
    const addDay = (d) => {
      if (!D.valid(d)) { setErr('Elige una fecha.'); return; }
      if (extra.includes(d)) { setErr('Esa fecha ya está en la lista.'); return; }
      if (!cal.isWork(d)) { setErr('Ese día ya es no laborable (fin de semana o festivo).'); return; }
      w.setSettings({ extraHolidays: [...extra, d].sort() }); setNewDay(''); setErr(null);
    };
    const removeDay = (d) => w.setSettings({ extraHolidays: extra.filter((x) => x !== d) });
    const months = [];
    for (let mth = D.startOfMonth(first), g = 0; mth <= last && g < 18; mth = D.addMonths(mth, 1), g++) months.push(mth);
    const dowOk = (iso) => { const wd = D.dow(iso); return ww === 7 ? true : ww === 6 ? wd !== 0 : wd !== 0 && wd !== 6; };
    return html`<div class="stack-lg">
      <div class="grid cols-2">
        <${ui.Card} title="Jornada laboral" subtitle="Calendario del proyecto para el cálculo del cronograma">
          <div class="stack">
            <${ui.Field} label="Semana laboral">
              ${ro ? html`<div>${WORKWEEKS.find((o) => o.value === ww).label}</div>` : html`<${ui.Segmented} label="Semana laboral" value=${ww} onChange=${(v) => w.setSettings({ workweek: Number(v) })} options=${WORKWEEKS} />`}
            </${ui.Field}>
            <${ui.Check} label="Festivos de Colombia (Ley 51 de 1983)" checked=${useCO} disabled=${ro} onValue=${(v) => w.setSettings({ holidaysCO: v })} />
            <div class="sched-note"><${ui.Icon} name="info" size=${15} /><div>Las duraciones se expresan en <strong>días hábiles</strong>: una actividad de 5 días que empieza un jueves, con semana de lunes a viernes, termina el miércoles siguiente. Los días no laborables (fines de semana según la jornada, festivos y días adicionales) no cuentan y se sombrean en el Gantt.</div></div>
          </div>
        </${ui.Card}>
        <${ui.Card} title="Días no laborables adicionales" subtitle="Paros, cierres de obra, vacancias del cliente…">
          <div class="stack">
            ${ro ? null : html`<div class="row" style="align-items:flex-start">
              <div style="flex:1;min-width:150px"><${ui.Field} error=${err}><${ui.DateInput} aria-label="Día no laborable" value=${newDay} onValue=${(v) => { setNewDay(v || ''); setErr(null); }} /></${ui.Field}></div>
              <${ui.Button} icon="plus" onClick=${() => addDay(newDay)}>Agregar día no laborable</${ui.Button}>
            </div>`}
            ${extra.length ? html`<div class="table-wrap"><table class="table table-tight"><tbody>${extra.map((d) => html`<tr key=${d}><td class="mono xsmall">${fmt.date(d, 'short')}</td><td>${fmt.date(d, 'long')} <span class="faint">(${PM.DOW[D.dow(d)]})</span></td><td style="width:1%">${ro ? null : html`<${ui.IconButton} size="sm" icon="trash" label=${'Quitar ' + fmt.date(d, 'long')} onClick=${() => removeDay(d)} />`}</td></tr>`)}</tbody></table></div>`
              : html`<p class="small faint">No hay días adicionales. También puedes marcarlos con un clic en el calendario mensual.</p>`}
          </div>
        </${ui.Card}>
      </div>
      <${ui.Card} title=${'Festivos de Colombia ' + years.join(', ')} subtitle=${useCO ? 'Se excluyen del cálculo del cronograma.' : 'Desactivados: no se excluyen del cálculo.'}>
        <div class="grid cols-2">${years.map((y) => html`<div key=${y} class="table-wrap"><table class="table table-tight">
          <thead><tr><th>Fecha</th><th>Festivo</th><th>Efecto</th></tr></thead>
          <tbody>${D.holidaysCO(y).map((h) => html`<tr key=${h.date} style=${useCO ? '' : 'opacity:.55'}><td class="mono xsmall nowrap">${fmt.date(h.date, 'dow')} ${y}</td><td>${h.name}</td><td class="xsmall">${!useCO ? html`<span class="faint">No aplica</span>` : dowOk(h.date) ? html`<${ui.Chip} tone="signal">Día no hábil</${ui.Chip}>` : html`<span class="faint">Cae en descanso</span>`}</td></tr>`)}</tbody>
        </table></div>`)}</div>
      </${ui.Card}>
      <${ui.Card} title="Calendario del proyecto" subtitle=${canWrite ? 'Haz clic en un día hábil para marcarlo como no laborable, o en un día marcado para volverlo hábil.' : 'Días hábiles y no laborables del proyecto.'}>
        <div class="stack">
          <div class="sched-months">${months.map((mth) => {
            const dim = +D.endOfMonth(mth).slice(8, 10); const lead = (D.dow(mth) + 6) % 7;
            return html`<div key=${mth}>
              <div class="sched-month-h">${PM.MONTHS_LONG[+mth.slice(5, 7) - 1]} ${mth.slice(0, 4)}</div>
              <div class="sched-mgrid">${[1, 2, 3, 4, 5, 6, 0].map((k) => html`<div class="dh" key=${'dh' + k}><abbr title=${DOW_LONG[k]} style="text-decoration:none">${DOW1[k]}</abbr></div>`)}
                ${Array.from({ length: lead }, (_, i) => html`<div key=${'e' + i}></div>`)}
                ${Array.from({ length: dim }, (_, i) => {
                  const d = mth.slice(0, 8) + String(i + 1).padStart(2, '0');
                  const isExtra = extra.includes(d); const hol = useCO ? D.holidaysCO(+d.slice(0, 4)).find((h) => h.date === d) : null;
                  const off = !dowOk(d);
                  const inProj = !sched.tasks.length || (d >= sched.start && d <= sched.finish);
                  const cls = cx('sched-day', isExtra ? 'is-extra' : hol ? 'is-hol' : off ? 'is-off' : null, !inProj && 'out-proj');
                  const title = fmt.date(d, 'long') + ' · ' + (isExtra ? 'No laborable (adicional)' : hol ? hol.name : off ? 'Descanso' : 'Día hábil');
                  const toggleable = canWrite && (isExtra || (!hol && !off));
                  return toggleable ? html`<button type="button" key=${d} class=${cls} title=${title} aria-label=${title} aria-pressed=${isExtra ? 'true' : 'false'} onClick=${() => (isExtra ? removeDay(d) : addDay(d))}>${i + 1}</button>` : html`<div key=${d} class=${cls} title=${title}>${i + 1}</div>`;
                })}
              </div>
            </div>`;
          })}</div>
          <div class="legend">
            <span class="legend-item"><span class="swatch" style="background:var(--surface);border:1px solid var(--line-strong)"></span>Día hábil</span>
            <span class="legend-item"><span class="swatch" style="background:var(--surface-3)"></span>Descanso semanal</span>
            <span class="legend-item"><span class="swatch" style="background:var(--signal-wash);border:1px solid var(--signal)"></span>Festivo</span>
            <span class="legend-item"><span class="swatch" style="background:var(--warn-wash);border:1px solid var(--warn)"></span>No laborable adicional</span>
            <span class="legend-item"><span class="swatch" style="background:var(--surface);border:1px solid var(--line);opacity:.45"></span>Fuera de las fechas del cronograma</span>
          </div>
        </div>
      </${ui.Card}>
    </div>`;
  }

  /* ---------------------------------------------------------------- vista Cronograma */
  function CronogramaView({ params }) {
    const m = PM.useProjectModel();
    const canWrite = PM.useCanWrite();
    const w = useScheduleWriter(m);
    const [tab, setTab] = usePref('sched.tab', 'gantt');
    const [sel, setSel] = useState(null);
    const [focus, setFocus] = useState(null);
    const ctxRef = useRef(); ctxRef.current = editorCtx(m, w, canWrite);
    const edit = useCallback((id) => openTaskEditor(ctxRef.current, id), []);
    const onFocused = useCallback(() => setFocus(null), []);
    /* params.taskId (enlace «Ver en el cronograma»): selecciona la actividad y la lleva a la vista. */
    const wanted = params && params.taskId ? String(params.taskId) : null;
    const handled = useRef(null);
    useEffect(() => {
      if (!wanted || m.loading || handled.current === wanted) return;
      handled.current = wanted;
      if (!m.sched.byId.has(wanted)) { PM.toast('La actividad ya no está en el cronograma; puede que la hayan eliminado.', { tone: 'crit' }); return; }
      if (tab !== 'gantt' && tab !== 'actividades') setTab('gantt');
      setSel(wanted); setFocus({ id: wanted, n: Date.now() });
    }, [wanted, m.loading]);
    if (m.loading) return html`<div class="page"><${ui.Loading} rows=${5} /></div>`;
    const { sched } = m;
    const addMilestone = () => {
      const t = newTask({ name: 'Nuevo hito', duration: 0, milestone: true });
      w.setTasks((ts) => [...ts, t]); setSel(t.id); edit(t.id);
    };
    const msCount = sched.tasks.filter((t) => t.milestone).length;
    const cyc = sched.errors.filter((e) => e.type === 'cycle');
    const idx = new Map(sched.tasks.map((t, i) => [t.id, i + 1]));
    const tabs = [
      { id: 'gantt', label: 'Gantt', icon: 'gantt' },
      { id: 'actividades', label: 'Actividades', icon: 'table', count: sched.tasks.length },
      { id: 'hitos', label: 'Hitos', icon: 'milestone', count: msCount },
      { id: 'calendario', label: 'Calendario', icon: 'calendar' },
    ];
    const cur = tabs.some((t) => t.id === tab) ? tab : 'gantt';
    return html`<div class="page">
      <${ui.PageHeader} eyebrow="6.5 Desarrollar el cronograma · 6.6 Controlar el cronograma" title="Cronograma del proyecto"
        description="Actividades, dependencias y duraciones en días hábiles. Las fechas, holguras y la ruta crítica se calculan con el método de la ruta crítica (CPM) desde el inicio del proyecto." />
      ${cyc.map((e, i) => html`<div class="sched-banner" role="alert" key=${'c' + i}><${ui.Icon} name="alert" size=${16} /><div><strong>Dependencias circulares.</strong> ${e.message} Revisa las predecesoras de las filas ${e.ids.map((id) => idx.get(id)).filter(Boolean).sort((a, b) => a - b).join(', ')}.</div></div>`)}
      ${sched.tasks.length ? html`<${SummaryStrip} m=${m} />` : null}
      <${ui.Tabs} tabs=${tabs} value=${cur} onChange=${setTab} />
      ${cur === 'gantt' ? html`<${GanttTab} m=${m} w=${w} canWrite=${canWrite} sel=${sel} setSel=${setSel} edit=${edit} focus=${focus} onFocused=${onFocused} />`
        : cur === 'actividades' ? html`<${ActivitiesTab} m=${m} w=${w} canWrite=${canWrite} sel=${sel} setSel=${setSel} edit=${edit} focus=${focus} onFocused=${onFocused} />`
        : cur === 'hitos' ? html`<${MilestonesTab} m=${m} canWrite=${canWrite} edit=${edit} addMilestone=${addMilestone} />`
        : html`<${CalendarTab} m=${m} w=${w} canWrite=${canWrite} />`}
    </div>`;
  }

  /* ---------------------------------------------------------------- diagrama de red (PDM) */
  const NW = 184, NH = 92, SW = 96, SH = 46, DH = 10, NGAP = 92, VGAP = 22, NPAD = 24, BAND = 22;
  /* Disposición por capas (profundidad = camino más largo), nodos ficticios para vínculos largos y
     orden dentro de cada capa por baricentro (varias pasadas) para reducir cruces. */
  function networkLayout(sched) {
    const tasks = sched.tasks; const byId = sched.byId;
    const layer = new Map();
    for (const id of sched.order) { const t = byId.get(id); if (!t) continue; let L = 1; for (const p of t.preds) { const lp = layer.get(p.id); if (lp !== undefined) L = Math.max(L, lp + 1); } layer.set(id, L); }
    let maxL = 1; for (const v of layer.values()) if (v > maxL) maxL = v;
    const endL = maxL + 1;
    const nodes = new Map();
    nodes.set('__start', { id: '__start', kind: 'start', layer: 0, h: SH });
    for (const t of tasks) nodes.set(t.id, { id: t.id, kind: 'task', layer: layer.get(t.id), h: NH, t });
    nodes.set('__end', { id: '__end', kind: 'end', layer: endL, h: SH });
    const edges = []; const hasIn = new Set(), hasOut = new Set();
    for (const t of tasks) for (const p of t.preds) {
      if (!(layer.get(p.id) < layer.get(t.id))) continue;
      edges.push({ from: p.id, to: t.id, type: p.type, lag: p.lag }); hasIn.add(t.id); hasOut.add(p.id);
    }
    for (const t of tasks) {
      if (!hasIn.has(t.id)) edges.push({ from: '__start', to: t.id, type: 'FS', lag: 0, virtual: true });
      if (!hasOut.has(t.id)) edges.push({ from: t.id, to: '__end', type: 'FS', lag: 0, virtual: true });
    }
    for (const e of edges) {
      if (e.from === '__start') { const t = byId.get(e.to); e.crit = t.critical && t.es === sched.startIdx; }
      else if (e.to === '__end') { const t = byId.get(e.from); e.crit = t.critical && t.ef === sched.finishIdx; }
      else { const a = byId.get(e.from), b = byId.get(e.to); e.crit = a.critical && b.critical && isDriving(a, b, e); }
    }
    const layers = Array.from({ length: endL + 1 }, () => []);
    layers[0].push('__start'); for (const t of tasks) layers[layer.get(t.id)].push(t.id); layers[endL].push('__end');
    const up = new Map(), down = new Map();
    const push = (m, k, v) => { let a = m.get(k); if (!a) m.set(k, (a = [])); a.push(v); };
    let dn = 0;
    for (const e of edges) {
      const la = nodes.get(e.from).layer, lb = nodes.get(e.to).layer; const chain = [e.from];
      for (let L = la + 1; L < lb; L++) { const id = '__d' + dn++; nodes.set(id, { id, kind: 'dummy', layer: L, h: DH }); layers[L].push(id); chain.push(id); }
      chain.push(e.to); e.chain = chain;
      for (let k = 0; k + 1 < chain.length; k++) { push(down, chain[k], chain[k + 1]); push(up, chain[k + 1], chain[k]); }
    }
    const pos = new Map(); layers.forEach((ls) => ls.forEach((id, i) => pos.set(id, i)));
    const bary = (id, nb) => { const ns = nb.get(id); if (!ns || !ns.length) return pos.get(id); let s = 0; for (const n of ns) s += pos.get(n); return s / ns.length; };
    const sweep = (L, nb) => { const b = new Map(layers[L].map((id) => [id, bary(id, nb)])); layers[L].sort((p, q) => b.get(p) - b.get(q)); layers[L].forEach((id, i) => pos.set(id, i)); };
    for (let pass = 0; pass < 6; pass++) { for (let L = 1; L <= endL; L++) sweep(L, up); for (let L = endL - 1; L >= 0; L--) sweep(L, down); }
    for (let L = 1; L <= endL; L++) sweep(L, up);
    const colW = (L) => (L === 0 || L === endL ? SW : NW);
    const colX = []; let xx = NPAD; for (let L = 0; L <= endL; L++) { colX[L] = xx; xx += colW(L) + NGAP; }
    const width = xx - NGAP + NPAD;
    const layerH = layers.map((ls) => ls.reduce((s, id) => s + nodes.get(id).h, 0) + Math.max(0, ls.length - 1) * VGAP);
    const maxH = Math.max(...layerH, SH);
    layers.forEach((ls, L) => { let y = NPAD + (maxH - layerH[L]) / 2; for (const id of ls) { const n = nodes.get(id); n.x = colX[L]; n.w = colW(L); n.y = y; y += n.h + VGAP; } });
    const height = maxH + NPAD * 2;
    /* puertos de salida y llegada repartidos en el lado del nodo */
    const outs = new Map(), ins = new Map();
    for (const e of edges) { push(outs, e.chain[0], e); push(ins, e.chain[e.chain.length - 1], e); }
    const cy = (id) => { const n = nodes.get(id); return n.y + n.h / 2; };
    const spread = (n, list, keyFn, prop) => {
      list.sort((a, b) => keyFn(a) - keyFn(b));
      const k = list.length; const top = n.kind === 'task' ? BAND + 4 : 10; const span = n.h - 2 * top;
      list.forEach((e, i) => { e[prop] = k === 1 ? n.y + n.h / 2 : n.y + top + (span * (i + 0.5)) / k; });
    };
    for (const [id, list] of outs) spread(nodes.get(id), list, (e) => cy(e.chain[1]), 'y0');
    for (const [id, list] of ins) spread(nodes.get(id), list, (e) => cy(e.chain[e.chain.length - 2]), 'y1');
    /* tramos y canales verticales por hueco entre capas */
    const gaps = new Map();
    for (const e of edges) {
      let y = e.y0; e.hops = [];
      for (let k = 1; k < e.chain.length; k++) {
        const a = nodes.get(e.chain[k - 1]), b = nodes.get(e.chain[k]);
        const yb = k === e.chain.length - 1 ? e.y1 : b.y + b.h / 2;
        const hop = { L: a.layer, x0: a.x + a.w, x1: b.x, ya: y, yb, xb2: b.x + b.w, dummy: b.kind === 'dummy' };
        e.hops.push(hop); if (Math.abs(hop.ya - hop.yb) > 0.5) push(gaps, a.layer, hop);
        y = yb;
      }
    }
    for (const [L, hs] of gaps) { hs.sort((p, q) => p.ya - q.ya || p.yb - q.yb); const g0 = colX[L] + colW(L), g1 = colX[L + 1]; hs.forEach((h, i) => { h.cx = g0 + ((g1 - g0) * (i + 1)) / (hs.length + 1); }); }
    for (const e of edges) {
      let d = '';
      e.hops.forEach((h, i) => { if (i === 0) d += 'M' + h.x0 + ',' + h.ya; if (h.cx !== undefined) d += 'H' + h.cx + 'V' + h.yb; d += 'H' + h.x1; if (h.dummy) d += 'H' + h.xb2; });
      if (!e.virtual && (e.type !== 'FS' || e.lag)) {
        /* etiqueta sobre el último tramo horizontal (junto a la flecha); si es corto, sobre el primero (a la salida) */
        e.label = DEP_CODE[e.type] + lagSigned(e.lag);
        const wl = tw(e.label, 10) + 6;
        const last = e.hops[e.hops.length - 1], first = e.hops[0];
        const lastRoom = last.x1 - (last.cx !== undefined ? last.cx : last.x0);
        const firstRoom = (first.cx !== undefined ? first.cx : first.x1) - first.x0;
        if (lastRoom >= wl + 14 || firstRoom < wl + 12) e.lbl = { x: last.x1 - 9 - wl, y: last.yb, w: wl };
        else e.lbl = { x: first.x0 + 5, y: first.ya, w: wl };
      }
      e.d = d;
    }
    edges.sort((p, q) => (p.crit === q.crit ? 0 : p.crit ? 1 : -1));
    return { nodes: [...nodes.values()].filter((n) => n.kind !== 'dummy'), edges, width, height };
  }
  const NET_ZOOMS = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const NET_FIT_MIN = 0.15;
  /* Nodo con el que abre el diagrama: la actividad crítica pendiente más a la izquierda (la primera de la ruta
     crítica que falta por ejecutar); si no hay críticas, el nodo Inicio. */
  function netFocusNode(net) {
    let best = null;
    for (const n of net.nodes) if (n.kind === 'task' && n.t.critical && (!best || n.x < best.x || (n.x === best.x && n.y < best.y))) best = n;
    return best || net.nodes.find((n) => n.kind === 'start') || null;
  }
  /* Secuencias de la ruta crítica (vínculos determinantes entre actividades críticas). */
  function criticalPaths(sched, limit = 6) {
    const crit = sched.tasks.filter((t) => t.critical);
    if (!crit.length) return [];
    const by = sched.byId;
    const next = (t) => t.succs.map((s) => ({ s, st: by.get(s.id) })).filter((x) => x.st && x.st.critical && isDriving(t, x.st, x.s)).map((x) => x.st);
    const driven = new Set(); for (const t of crit) for (const s of next(t)) driven.add(s.id);
    const starts = crit.filter((t) => !driven.has(t.id)).sort((a, b) => a.es - b.es);
    const out = [];
    const dfs = (t, path) => { if (out.length >= limit || path.length > 500) return; const nx = next(t).filter((s) => !path.includes(s)); if (!nx.length) { out.push([...path, t]); return; } for (const s of nx) dfs(s, [...path, t]); };
    for (const s of starts) dfs(s, []);
    return out;
  }
  function splitName(s, maxChars) {
    const words = String(s).split(/\s+/).filter(Boolean); const lines = ['']; 
    for (const wd of words) { const cur = lines[lines.length - 1]; if (!cur) lines[lines.length - 1] = wd; else if ((cur + ' ' + wd).length <= maxChars) lines[lines.length - 1] = cur + ' ' + wd; else lines.push(wd); }
    if (lines.length <= 2) return lines.map((l) => (l.length > maxChars ? l.slice(0, maxChars - 1) + '…' : l));
    const second = lines.slice(1).join(' ');
    return [lines[0].length > maxChars ? lines[0].slice(0, maxChars - 1) + '…' : lines[0], second.length > maxChars ? second.slice(0, maxChars - 1) + '…' : second];
  }

  function RedView() {
    const m = PM.useProjectModel();
    const canWrite = PM.useCanWrite();
    const w = useScheduleWriter(m);
    const [mode, setMode] = usePref('red.mode', 'dias');
    const [zoom, setZoom] = usePref('red.zoom', 1);
    const svgRef = useRef(); const hostRef = useRef(); const tipApi = useRef(null);
    const [measureHost, hostW] = useWidth();
    const setHost = useCallback((el) => { hostRef.current = el; measureHost(el); }, [measureHost]);
    const ctxRef = useRef(); ctxRef.current = editorCtx(m, w, canWrite);
    const { sched, project } = m;
    const hasDeps = sched.tasks.some((t) => t.preds.length);
    const net = useMemo(() => (hasDeps ? networkLayout(sched) : null), [sched, hasDeps]);
    const paths = useMemo(() => criticalPaths(sched), [sched]);
    const idx = useMemo(() => new Map(sched.tasks.map((t, i) => [t.id, i + 1])), [sched]);
    /* «Ajustar»: todo el diagrama en el ancho (y el alto máximo) del recuadro, para ver la estructura y la ruta crítica. */
    const fitScale = net && hostW > 0 ? PM.clamp(Math.min((hostW - 2) / net.width, (Math.min(window.innerHeight * 0.76, 1100) - 2) / net.height), NET_FIT_MIN, 1) : 1;
    const isFit = zoom === 'fit';
    const scale = isFit ? fitScale : PM.clamp(num(zoom, 1), NET_ZOOMS[0], NET_ZOOMS[NET_ZOOMS.length - 1]);
    const stepZoom = (dir) => { const nx = dir > 0 ? NET_ZOOMS.find((z) => z > scale + 0.01) : [...NET_ZOOMS].reverse().find((z) => z < scale - 0.01); if (nx) setZoom(nx); };
    /* Al abrir, lleva la vista a la primera actividad crítica pendiente (la ruta crítica en rojo queda a la vista;
       sin críticas, al nodo Inicio); al cambiar el zoom, conserva el punto central visible. */
    const viewRef = useRef({ placed: false, scale });
    useLayoutEffect(() => {
      const host = hostRef.current; const v = viewRef.current;
      if (!host || !net) { v.placed = false; return; }
      if (!v.placed) {
        const target = isFit ? null : netFocusNode(net);
        host.scrollLeft = target && target.kind === 'task' ? Math.max(0, target.x * scale - host.clientWidth * 0.2) : 0;
        host.scrollTop = target ? Math.max(0, (target.y + target.h / 2) * scale - host.clientHeight / 2) : 0;
        v.placed = true; v.scale = scale; return;
      }
      if (v.scale !== scale) {
        const cxv = (host.scrollLeft + host.clientWidth / 2) / v.scale, cyv = (host.scrollTop + host.clientHeight / 2) / v.scale;
        host.scrollLeft = Math.max(0, cxv * scale - host.clientWidth / 2); host.scrollTop = Math.max(0, cyv * scale - host.clientHeight / 2);
        v.scale = scale;
      }
    });
    if (m.loading) return html`<div class="page"><${ui.Loading} rows=${5} /></div>`;
    const base = Math.min(0, sched.startIdx);
    const dv = (i) => fmt.num(i - base);
    const val = (t) => (mode === 'fechas'
      ? { es: fmt.date(t.startDate, 'dm'), ef: fmt.date(t.finishDate, 'dm'), ls: fmt.date(t.lateStart, 'dm'), lf: fmt.date(t.lateFinish, 'dm') }
      : { es: dv(t.es), ef: dv(t.ef), ls: dv(t.ls), lf: dv(t.lf) });
    const header = html`<${ui.PageHeader} eyebrow="6.3 Secuenciar las actividades" title="Diagrama de red del cronograma"
      description="Método de diagramación por precedencia (PDM): cada actividad es un nodo y cada flecha una dependencia. La ruta crítica (actividades pendientes con holgura total ≤ 0) se resalta en rojo; las terminadas no se marcan como críticas." />`;
    if (!sched.tasks.length || !hasDeps) {
      return html`<div class="page">${header}
        <${ui.Empty} icon="network" title=${sched.tasks.length ? 'Aún no hay dependencias' : 'Aún no hay actividades'} actions=${html`<${ui.Button} variant="primary" icon="gantt" onClick=${() => PM.navigate('cronograma')}>Ir al cronograma</${ui.Button}>`}>
          ${sched.tasks.length ? 'El diagrama de red muestra la secuencia lógica de las actividades. Define predecesoras en la columna «Predecesoras» del cronograma (p. ej. 3 o 3FC+2) o en el editor de cada actividad.' : 'Crea las actividades en el cronograma (o impórtalas desde la EDT) y define sus dependencias para ver aquí el diagrama de red y la ruta crítica.'}
        </${ui.Empty}>
      </div>`;
    }
    const tip = (e, t) => tipApi.current && tipApi.current.show(e, html`<${TaskTip} t=${t} code=${t.wbsId ? m.tree.codes.get(t.wbsId) : ''} bl=${null} cal=${sched.cal} currency=${m.currency} />`);
    const hide = () => tipApi.current && tipApi.current.hide();
    const maxChars = Math.floor((NW - 16) / 6.7); /* margen para la primera línea en negrita */
    const nodeEl = (n) => {
      if (n.kind !== 'task') {
        const isStart = n.kind === 'start';
        const sub = mode === 'fechas' ? fmt.date(isStart ? sched.start : sched.finish, 'dm') : 'Día ' + dv(isStart ? sched.startIdx : sched.finishIdx);
        return html`<g key=${n.id} class="sched-net-end" transform=${'translate(' + n.x + ',' + n.y + ')'}>
          <rect width=${n.w} height=${n.h} rx=${n.h / 2} fill="var(--surface)" stroke="var(--fg-2)" stroke-width="1.5" />
          <text x=${n.w / 2} y="20" text-anchor="middle" style="font-weight:700">${isStart ? 'Inicio' : 'Fin'}</text>
          <text class="sched-net-v" x=${n.w / 2} y="35" text-anchor="middle">${sub}</text>
        </g>`;
      }
      const t = n.t; const c = t.critical; const v = val(t); const lines = splitName(idx.get(t.id) + ' · ' + taskName(t), maxChars);
      const band = c ? 'var(--crit-wash)' : 'var(--surface-2)';
      return html`<g key=${n.id} class=${cx('sched-net-node', c && 'is-crit')} data-id=${t.id} transform=${'translate(' + n.x + ',' + n.y + ')'}
          onMouseMove=${(e) => tip(e, t)} onMouseLeave=${hide} onDblClick=${() => openTaskEditor(ctxRef.current, t.id)}>
        <rect width=${NW} height=${NH} rx="4" fill="var(--surface)" />
        <rect width=${NW} height=${BAND} fill=${band} />
        <rect y=${NH - BAND} width=${NW} height=${BAND} fill=${band} />
        <path d=${'M0,' + BAND + 'H' + NW + 'M0,' + (NH - BAND) + 'H' + NW + 'M' + NW / 3 + ',0V' + BAND + 'M' + (2 * NW) / 3 + ',0V' + BAND + 'M' + NW / 3 + ',' + (NH - BAND) + 'V' + NH + 'M' + (2 * NW) / 3 + ',' + (NH - BAND) + 'V' + NH} stroke=${c ? 'var(--crit)' : 'var(--line-strong)'} stroke-width="1" fill="none" />
        <text class="sched-net-v" x=${NW / 6} y="15" text-anchor="middle">${v.es}</text>
        <text class="sched-net-v" x=${NW / 2} y="15" text-anchor="middle">${t.milestone ? 'Hito' : fmt.num(t.duration) + ' d'}</text>
        <text class="sched-net-v" x=${(5 * NW) / 6} y="15" text-anchor="middle">${v.ef}</text>
        ${lines.map((l, i) => html`<text key=${i} x="8" y=${BAND + (lines.length === 1 ? 29 : 21 + i * 15)} style=${i === 0 ? 'font-weight:600' : ''}>${l}</text>`)}
        <text class="sched-net-v" x=${NW / 6} y=${NH - 7} text-anchor="middle">${v.ls}</text>
        <text class="sched-net-v" x=${NW / 2} y=${NH - 7} text-anchor="middle" style=${c ? 'fill:var(--crit);font-weight:600' : ''}>${fmt.num(t.tf)}</text>
        <text class="sched-net-v" x=${(5 * NW) / 6} y=${NH - 7} text-anchor="middle">${v.lf}</text>
        <rect width=${NW} height=${NH} rx="4" fill="none" stroke=${c ? 'var(--crit)' : 'var(--line-strong)'} stroke-width=${c ? 2 : 1} />
      </g>`;
    };
    const critCount = sched.tasks.filter((t) => t.critical).length;
    return html`<div class="page">
      ${header}
      ${sched.errors.length ? html`<div class="sched-banner" role="alert"><${ui.Icon} name="alert" size=${16} /><div>${sched.errors.map((e) => e.message).join(' ')} Los vínculos circulares no se dibujan.</div></div>` : null}
      <div class="row-between" style="align-items:flex-end">
        <div class="stack-sm">
          <div class="label-caps">Clave del nodo</div>
          <div class="sched-key" aria-label="Clave de lectura del nodo">
            <div>Inicio temprano</div><div>Duración</div><div>Fin temprano</div>
            <div class="mid"># · Nombre de la actividad</div>
            <div class="bot">Inicio tardío</div><div class="bot">Holgura total</div><div class="bot">Fin tardío</div>
          </div>
        </div>
        <div class="row">
          <${ui.Segmented} label="Valores del nodo" value=${mode} onChange=${setMode} options=${[{ value: 'dias', label: 'Días' }, { value: 'fechas', label: 'Fechas' }]} />
          <div class="btn-group">
            <${ui.Button} size="sm" icon="zoom-out" aria-label="Alejar" title="Alejar" disabled=${scale <= NET_ZOOMS[0] + 0.001} onClick=${() => stepZoom(-1)} />
            <${ui.Button} size="sm" aria-label="Restablecer zoom" title="Restablecer zoom (100 %)" onClick=${() => setZoom(1)}>${Math.round(scale * 100)} %</${ui.Button}>
            <${ui.Button} size="sm" icon="zoom-in" aria-label="Acercar" title="Acercar" disabled=${scale >= NET_ZOOMS[NET_ZOOMS.length - 1] - 0.001} onClick=${() => stepZoom(1)} />
            <${ui.Button} size="sm" icon="expand" aria-pressed=${isFit ? 'true' : 'false'} title="Ver todo el diagrama en el recuadro" onClick=${() => setZoom('fit')}>Ajustar a la vista</${ui.Button}>
          </div>
          <${ui.SvgDownload} getSvg=${() => svgRef.current} filename=${fileBase(project) + '_diagrama-red.svg'} />
        </div>
      </div>
      <p class="xsmall faint">${mode === 'fechas'
        ? 'Fechas calendario: el inicio es el primer día de trabajo y el fin, el último día de trabajo de la actividad.'
        : 'Días hábiles contados desde 0 (día 0 = inicio del proyecto, ' + fmt.date(sched.cal.dateOf(base)) + '). En cada nodo, fin temprano = inicio temprano + duración y holgura total = inicio tardío − inicio temprano, en días hábiles.'}
        ${canWrite ? ' Doble clic en un nodo para editar la actividad.' : ''}</p>
      <div class="chart sched-net" ref=${setHost}>
        <svg ref=${svgRef} class="sched-svg" width=${Math.ceil(net.width * scale)} height=${Math.ceil(net.height * scale)} viewBox=${'0 0 ' + net.width + ' ' + net.height} role="img" aria-label=${'Diagrama de red con ' + sched.tasks.length + ' actividades'}>
          <defs>
            <marker id="sched-net-a" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.5 L8,4 L0,7.5 z" fill="var(--fg-3)" /></marker>
            <marker id="sched-net-c" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.5 L8,4 L0,7.5 z" fill="var(--crit)" /></marker>
          </defs>
          <g fill="none">${net.edges.map((e, i) => html`<path key=${'e' + i} class=${cx('sched-net-edge', e.crit && 'is-crit')} d=${e.d} stroke=${e.crit ? 'var(--crit)' : 'var(--fg-3)'} stroke-width=${e.crit ? 2 : 1.25} stroke-dasharray=${e.virtual && !e.crit ? '4 3' : undefined} marker-end=${'url(#sched-net-' + (e.crit ? 'c' : 'a') + ')'} />`)}</g>
          ${net.edges.filter((e) => e.lbl).map((e, i) => html`<g key=${'l' + i}><rect x=${e.lbl.x} y=${e.lbl.y - 15} width=${e.lbl.w} height="13" rx="2" fill="var(--surface)" stroke=${e.crit ? 'var(--crit)' : 'var(--line)'} /><text class="sched-net-elbl" x=${e.lbl.x + e.lbl.w / 2} y=${e.lbl.y - 5} text-anchor="middle">${e.label}</text></g>`)}
          ${net.nodes.map(nodeEl)}
        </svg>
        <${TipLayer} host=${hostRef} api=${tipApi} />
      </div>
      <div class="legend">
        <span class="legend-item"><span class="legend-line" style="background:var(--crit);height:2px"></span>Ruta crítica</span>
        <span class="legend-item"><span class="legend-line" style="background:var(--fg-3)"></span>Dependencia (FC sin desfase si no tiene etiqueta)</span>
        <span class="legend-item"><span class="legend-line" style="background:repeating-linear-gradient(90deg, var(--fg-3) 0 4px, transparent 4px 7px)"></span>Enlace con Inicio o Fin</span>
        <span class="legend-item"><span class="code-tag">CC+2</span>Tipo y desfase en días hábiles</span>
      </div>
      <${ui.Card} title="Ruta crítica" subtitle=${critCount ? critCount + ' actividades críticas · duración ' + fmt.num(sched.workdays) + ' días hábiles' : 'No hay actividades críticas pendientes'}>
        ${paths.length ? html`<div class="stack">${paths.map((p, i) => html`<div key=${i} class="sched-path">
          ${paths.length > 1 ? html`<span class="label-caps" style="margin-right:4px">Ruta ${i + 1}</span>` : null}
          <${ui.Chip} tone="outline">Inicio</${ui.Chip}>
          ${p.map((t) => html`<span key=${t.id} class="row" style="gap:6px"><${ui.Icon} name="arrow-right" size=${13} /><${ui.Chip} tone="crit">${idx.get(t.id)} · ${taskName(t)}</${ui.Chip}></span>`)}
          <${ui.Icon} name="arrow-right" size=${13} /><${ui.Chip} tone="outline">Fin</${ui.Chip}>
        </div>`)}</div>` : html`<p class="small muted">Todas las actividades críticas están terminadas o no hay vínculos determinantes entre ellas.</p>`}
      </${ui.Card}>
      <${ui.Card} title="Cálculo de la ruta crítica" subtitle=${mode === 'fechas' ? 'Fechas calendario' : 'Días hábiles desde el inicio del proyecto (día 0)'} pad=${false}>
        <div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table table-tight sched-tbl">
          <thead><tr><th class="num">#</th><th>Actividad</th><th class="num">Duración</th><th class="num">Inicio temprano</th><th class="num">Fin temprano</th><th class="num">Inicio tardío</th><th class="num">Fin tardío</th><th class="num">Holgura total</th><th class="num">Holgura libre</th><th>Crítica</th></tr></thead>
          <tbody>${sched.tasks.map((t) => { const v = val(t); return html`<tr key=${t.id} data-id=${t.id}>
            <td class="num faint">${idx.get(t.id)}</td><td class="wrap">${taskName(t)}</td><td class="num">${t.milestone ? 'Hito' : fmt.num(t.duration)}</td>
            <td class="num mono">${v.es}</td><td class="num mono">${v.ef}</td><td class="num mono">${v.ls}</td><td class="num mono">${v.lf}</td>
            <td class="num" style=${t.tf < 0 ? 'color:var(--crit)' : ''}>${fmt.num(t.tf)}</td><td class="num">${fmt.num(t.ff)}</td>
            <td>${critCell(t)}</td>
          </tr>`; })}</tbody>
        </table></div>
      </${ui.Card}>
    </div>`;
  }

  /* ---------------------------------------------------------------- recursos */
  const resKey = (s) => String(s || '').trim().toLowerCase();
  function resourceModel(sched, limits, bucket) {
    const cal = sched.cal;
    const map = new Map();
    for (const t of sched.tasks) {
      for (const r of t.resources || []) {
        const name = String((r && r.name) || '').trim(); if (!name) continue;
        const u = Math.max(0, num(r.units)); const k = resKey(name);
        let R = map.get(k); if (!R) { R = { key: k, name, tasks: [], rd: 0, daily: new Map(), peak: 0, peakDate: null }; map.set(k, R); }
        R.tasks.push({ t, units: u });
        if (t.milestone || t.duration <= 0 || !u) continue;
        R.rd += u * t.duration;
        for (let i = t.es; i < t.ef; i++) { const d = cal.dateOf(i); R.daily.set(d, (R.daily.get(d) || 0) + u); }
      }
    }
    const lim = new Map(Object.entries(limits || {}).filter(([, v]) => v !== null && v !== '' && Number.isFinite(Number(v))).map(([k, v]) => [resKey(k), Number(v)]));
    const list = [...map.values()];
    for (const R of list) {
      for (const [d, v] of R.daily) if (v > R.peak + 1e-9 || (Math.abs(v - R.peak) < 1e-9 && (!R.peakDate || d < R.peakDate))) { R.peak = v; R.peakDate = d; }
      R.limit = lim.has(R.key) ? lim.get(R.key) : null;
      R.over = R.limit !== null && R.peak > R.limit + 1e-9;
    }
    list.sort((a, b) => b.rd - a.rd || a.name.localeCompare(b.name, 'es'));
    const many = list.length > 8;
    list.forEach((R, i) => { R.series = many && i >= 8 ? 8 : i; R.color = R.series < 8 ? 'var(--s' + (R.series + 1) + ')' : 'var(--fg-3)'; });
    const series = list.filter((R) => R.series < 8).map((R) => ({ id: R.key, name: R.name, color: R.color, members: [R] }));
    if (many) series.push({ id: '__otros', name: 'Otros (' + (list.length - 8) + ')', color: 'var(--fg-3)', members: list.slice(8) });
    const periods = [];
    if (list.length && sched.tasks.length) {
      let p = bucket === 'mes' ? D.startOfMonth(sched.start) : D.startOfWeek(sched.start); let guard = 0;
      while (p <= sched.finish && guard++ < 520) {
        const nx = bucket === 'mes' ? D.addMonths(p, 1) : D.add(p, 7);
        const days = []; for (let d = p; d < nx; d = D.add(d, 1)) if (cal.isWork(d)) days.push(d);
        const per = { start: p, end: D.add(nx, -1), days, byRes: new Map(), totalPeak: 0, peakDay: null, over: false, label: bucket === 'mes' ? PM.MONTHS[+p.slice(5, 7) - 1] + ' ' + p.slice(2, 4) : fmt.date(p, 'dm') };
        for (const R of list) {
          let pk = 0, sum = 0; const overDays = [];
          for (const d of days) { const v = R.daily.get(d) || 0; sum += v; if (v > pk) pk = v; if (R.limit !== null && v > R.limit + 1e-9) overDays.push(d); }
          per.byRes.set(R.key, { peak: pk, sum, overDays });
          if (overDays.length) per.over = true;
        }
        for (const d of days) { let tot = 0; for (const R of list) tot += R.daily.get(d) || 0; if (tot > per.totalPeak + 1e-9) { per.totalPeak = tot; per.peakDay = d; } }
        per.stack = series.map((S) => ({ S, v: per.peakDay ? PM.sum(S.members, (R) => R.daily.get(per.peakDay) || 0) : 0 }));
        periods.push(per); p = nx;
      }
    }
    const conflicts = [];
    for (const per of periods) for (const R of list) {
      const x = per.byRes.get(R.key); if (!x || !x.overDays.length) continue;
      const demand = Math.max(...x.overDays.map((d) => R.daily.get(d) || 0));
      const tasks = R.tasks.filter(({ t }) => !t.milestone && x.overDays.some((d) => d >= t.startDate && d <= t.finishDate)).map(({ t }) => t);
      conflicts.push({ key: per.start + R.key, per, R, demand, limit: R.limit, days: x.overDays.length, first: x.overDays[0], tasks });
    }
    return { list, series, periods, conflicts };
  }
  function niceScale(max) {
    if (!(max > 0)) max = 1;
    const raw = max / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / mag;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    const top = Math.ceil(max / step - 1e-9) * step; const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return { top, ticks };
  }
  const colPath = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, h, w / 2)); return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z'; };

  function Histogram({ model, selKey, bucket, svgRef }) {
    const hostRef = useRef(); const tipApi = useRef(null);
    const [wrapRef, cw] = useWidth();
    const P = model.periods;
    const single = selKey !== '__all' ? model.list.find((R) => R.key === selKey) : null;
    const M = { l: 40, r: 18, t: 26, b: 34 };
    const slotMin = bucket === 'mes' ? 64 : 34;
    const plotW = Math.max(P.length * slotMin, (cw || 640) - M.l - M.r - 2);
    const slot = plotW / Math.max(1, P.length);
    const PH = 220; const W = M.l + plotW + M.r; const Ht = M.t + PH + M.b;
    const vals = P.map((p) => (single ? p.byRes.get(single.key).peak : p.totalPeak));
    const sc = niceScale(Math.max(0, ...vals, single && single.limit !== null ? single.limit : 0));
    const y = (v) => M.t + PH * (1 - v / sc.top);
    const bw = Math.min(24, slot * 0.62);
    const step = Math.max(1, Math.ceil((tw(P[0] ? P[0].label : '') + 10) / slot));
    const showTip = (e, p) => {
      if (!tipApi.current) return;
      const per = (bucket === 'mes' ? 'Mes de ' + PM.MONTHS_LONG[+p.start.slice(5, 7) - 1] + ' ' + p.start.slice(0, 4) : 'Semana del ' + fmt.date(p.start, 'dm') + ' al ' + fmt.date(p.end));
      if (single) {
        const x = p.byRes.get(single.key);
        tipApi.current.show(e, html`<div><strong>${single.name}</strong><div class="xsmall faint">${per}</div><div class="sched-tipgrid">
          <span>Máximo diario</span><span>${fmt.num(x.peak, 2)} u.</span>
          <span>Promedio</span><span>${fmt.num(p.days.length ? x.sum / p.days.length : 0, 2)} u./día</span>
          <span>Días-recurso</span><span>${fmt.num(x.sum, 2)}</span>
          <span>Disponible</span><span>${single.limit === null ? 'Sin límite' : fmt.num(single.limit, 2) + ' u.'}</span>
          ${x.overDays.length ? html`<span>Sobreasignación</span><span style="color:var(--crit)">${x.overDays.length} ${x.overDays.length === 1 ? 'día' : 'días'}</span>` : null}
        </div></div>`);
      } else {
        tipApi.current.show(e, html`<div><strong>${per}</strong><div class="xsmall faint">${p.peakDay ? 'Día de mayor demanda: ' + fmt.date(p.peakDay, 'dow') : 'Sin demanda'}</div><div class="sched-tipgrid">
          ${p.stack.filter((s) => s.v > 0).map((s) => html`<span key=${s.S.id} class="row" style="gap:5px;flex-wrap:nowrap"><span class="swatch" style=${'background:' + s.S.color}></span>${s.S.name}</span><span>${fmt.num(s.v, 2)} u.</span>`)}
          <span>Total</span><span>${fmt.num(p.totalPeak, 2)} u.</span>
          ${p.over ? html`<span>Sobreasignación</span><span style="color:var(--crit)">${model.list.filter((R) => p.byRes.get(R.key).overDays.length).map((R) => R.name).join(', ')}</span>` : null}
        </div></div>`);
      }
    };
    const bars = P.map((p, i) => {
      const cxp = M.l + i * slot + slot / 2; const x0 = cxp - bw / 2; const els = [];
      if (single) {
        const v = vals[i]; const lim = single.limit;
        if (v > 0) {
          if (lim !== null && v > lim + 1e-9) {
            const yb = y(lim), yt = y(v);
            if (lim > 0) els.push(html`<rect key="b" x=${x0} y=${yb} width=${bw} height=${Math.max(0, M.t + PH - yb)} fill=${single.color} />`);
            els.push(html`<path key="o" class="sched-hist-over" d=${colPath(x0, yt, bw, Math.max(1, yb - yt - (lim > 0 ? 2 : 0)), 4)} fill="var(--crit)" />`);
          } else els.push(html`<path key="b" d=${colPath(x0, y(v), bw, M.t + PH - y(v), 4)} fill=${single.color} />`);
        }
      } else {
        if (p.over) els.push(html`<g key="ov"><rect class="sched-hist-over" x=${M.l + i * slot + 1} y=${M.t} width=${slot - 2} height=${PH} fill="var(--crit-wash)" /><rect x=${M.l + i * slot + 1} y=${M.t - 4} width=${slot - 2} height="3" fill="var(--crit)" /></g>`);
        let acc = 0; const segs = p.stack.filter((s) => s.v > 0);
        segs.forEach((s, k) => {
          const yTop = y(acc + s.v), yBot = y(acc); const gap = k > 0 ? 2 : 0; const h = Math.max(0.5, yBot - yTop - gap);
          els.push(k === segs.length - 1 ? html`<path key=${s.S.id} d=${colPath(x0, yTop, bw, h, 4)} fill=${s.S.color} />` : html`<rect key=${s.S.id} x=${x0} y=${yTop} width=${bw} height=${h} fill=${s.S.color} />`);
          acc += s.v;
        });
      }
      return html`<g key=${p.start} data-period=${p.start}>${els}<rect x=${M.l + i * slot} y=${M.t} width=${slot} height=${PH} fill="transparent" onMouseMove=${(e) => showTip(e, p)} onMouseLeave=${() => tipApi.current && tipApi.current.hide()} /></g>`;
    });
    const limY = single && single.limit !== null ? y(single.limit) : null;
    const limLabel = single && single.limit !== null ? 'Disponible: ' + fmt.num(single.limit, 2) : '';
    return html`<div ref=${wrapRef}>
      <div class="chart sched-hist" ref=${hostRef}>
        <svg ref=${svgRef} class="sched-svg" width=${Math.ceil(W)} height=${Ht} viewBox=${'0 0 ' + Math.ceil(W) + ' ' + Ht} role="img" aria-label=${'Histograma de recursos por ' + (bucket === 'mes' ? 'mes' : 'semana')}>
          <text x=${M.l - 6} y="14" text-anchor="start" class="sched-faint">Unidades por día</text>
          ${sc.ticks.map((v) => html`<g key=${'y' + v}><line class=${v === 0 ? 'axis-line' : 'grid-line'} x1=${M.l} x2=${M.l + plotW} y1=${y(v)} y2=${y(v)} stroke=${v === 0 ? 'var(--axis)' : 'var(--grid)'} /><text x=${M.l - 6} y=${y(v) + 4} text-anchor="end">${fmt.num(v, 2)}</text></g>`)}
          ${bars}
          ${limY !== null ? html`<g pointer-events="none"><line x1=${M.l} x2=${M.l + plotW} y1=${limY} y2=${limY} stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="5 3" />
            <rect x=${M.l + plotW - tw(limLabel) - 10} y=${limY - 17} width=${tw(limLabel) + 8} height="14" rx="2" fill="var(--surface)" /><text x=${M.l + plotW - 6} y=${limY - 6} text-anchor="end" style="fill:var(--fg)">${limLabel}</text></g>` : null}
          ${P.map((p, i) => (i % step === 0 ? html`<text key=${'x' + p.start} x=${M.l + i * slot + slot / 2} y=${M.t + PH + 16} text-anchor="middle">${p.label}</text>` : null))}
          <text x=${M.l + plotW} y=${Ht - 4} text-anchor="end" class="sched-faint">${bucket === 'mes' ? 'Mes' : 'Semana (lunes)'}</text>
        </svg>
        <${TipLayer} host=${hostRef} api=${tipApi} />
      </div>
    </div>`;
  }

  function RecursosView() {
    const m = PM.useProjectModel();
    const canWrite = PM.useCanWrite();
    const w = useScheduleWriter(m);
    const [bucket, setBucket] = usePref('rec.bucket', 'semana');
    const [selKey, setSelKey] = useState('__all');
    const svgRef = useRef();
    const limits = (m.schedule.settings && m.schedule.settings.resourceLimits) || null;
    const model = useMemo(() => resourceModel(m.sched, limits, bucket), [m.sched, limits, bucket]);
    const ctxRef = useRef(); ctxRef.current = editorCtx(m, w, canWrite);
    if (m.loading) return html`<div class="page"><${ui.Loading} rows=${5} /></div>`;
    const { sched, project } = m;
    const idx = new Map(sched.tasks.map((t, i) => [t.id, i + 1]));
    const header = html`<${ui.PageHeader} eyebrow="9.2 Estimar los recursos de las actividades · 9.6 Controlar los recursos" title="Recursos del cronograma"
      description="Demanda de personas y equipos por día hábil a partir de las asignaciones de cada actividad, comparada con la disponibilidad." />`;
    if (!model.list.length) {
      return html`<div class="page">${header}
        <${ui.Empty} icon="resources" title="Aún no hay recursos asignados" actions=${html`<${ui.Button} variant="primary" icon="gantt" onClick=${() => PM.navigate('cronograma')}>Ir al cronograma</${ui.Button}>`}>
          Abre una actividad del cronograma (doble clic en la fila o en la barra) y, en «Recursos», agrega el nombre y las unidades por día hábil, p. ej. «Cuadrilla de montaje» × 6 o «Camión grúa» × 1. Aquí verás el histograma, las sobreasignaciones y la matriz de asignación.
        </${ui.Empty}>
      </div>`;
    }
    const sel = selKey !== '__all' && model.list.some((R) => R.key === selKey) ? selKey : '__all';
    const setLimit = (name, v) => {
      const cur = w.get(); const lim = { ...((cur.settings && cur.settings.resourceLimits) || {}) };
      for (const k of Object.keys(lim)) if (resKey(k) === resKey(name)) delete lim[k];
      if (v !== null && v !== undefined && Number.isFinite(v) && v >= 0) lim[name] = v;
      w.setSettings({ resourceLimits: lim });
    };
    const selR = sel !== '__all' ? model.list.find((R) => R.key === sel) : null;
    const matrixTasks = sched.tasks.filter((t) => (t.resources || []).some((r) => String(r.name || '').trim()));
    const unitsOf = (t, R) => PM.sum((t.resources || []).filter((r) => resKey(r.name) === R.key), (r) => r.units);
    const overCount = model.list.filter((R) => R.over).length;
    return html`<div class="page">
      ${header}
      <div class="sched-note"><${ui.Icon} name="info" size=${15} /><div>La nivelación de recursos es manual: si un recurso supera su disponibilidad, mueve o reprograma actividades en el Gantt (arrastrando las barras o agregando dependencias) y revisa aquí que la demanda quede dentro del límite.</div></div>
      <${ui.Card} title="Recursos" subtitle=${model.list.length + (model.list.length === 1 ? ' recurso' : ' recursos') + (overCount ? ' · ' + overCount + ' sobreasignado' + (overCount === 1 ? '' : 's') : '') + ' · haz clic en una fila para verla en el histograma'} pad=${false}>
        <div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table sched-tbl sched-reslist">
          <thead><tr><th>Recurso</th><th class="num">Actividades</th><th class="num" title="Unidades × duración en días hábiles">Días-recurso</th><th class="num">Máximo diario</th><th>Fecha del máximo</th><th class="num">Disponible (u./día)</th><th>Estado</th></tr></thead>
          <tbody>${model.list.map((R) => html`<tr key=${R.key} data-res=${R.name} class=${cx('clickable', sel === R.key && 'is-sel')} onClick=${(e) => { if (e.target.closest && e.target.closest('input')) return; setSelKey(sel === R.key ? '__all' : R.key); }}>
            <td class="wrap sched-resname"><span class="row" style="gap:7px;flex-wrap:nowrap;align-items:baseline"><span class="swatch" style=${'background:' + R.color}></span><strong style="font-weight:600">${R.name}</strong></span></td>
            <td class="num">${R.tasks.length}</td>
            <td class="num">${fmt.num(R.rd, 1)}</td>
            <td class="num" style=${R.over ? 'color:var(--crit);font-weight:600' : ''}>${fmt.num(R.peak, 2)}</td>
            <td class="mono xsmall">${R.peakDate ? fmt.date(R.peakDate, 'short') : '—'}</td>
            <td class="num">${canWrite ? html`<${ui.NumberInput} aria-label=${'Disponibilidad de ' + R.name} value=${R.limit} min=${0} placeholder="Sin límite" onValue=${(v) => setLimit(R.name, v)} />` : R.limit === null ? html`<span class="faint">Sin límite</span>` : fmt.num(R.limit, 2)}</td>
            <td>${R.limit === null ? html`<${ui.Chip} tone="outline">Sin límite</${ui.Chip}>` : R.over ? html`<${ui.Chip} tone="crit" icon="alert">Sobreasignado</${ui.Chip}>` : html`<${ui.Chip} tone="good">Dentro del límite</${ui.Chip}>`}</td>
          </tr>`)}</tbody>
        </table></div>
      </${ui.Card}>
      <${ui.Card} title="Histograma de recursos" subtitle=${selR ? selR.name + ' · máximo diario de cada periodo' + (selR.limit === null ? ' · sin disponibilidad definida' : ' · disponible ' + fmt.num(selR.limit, 2) + ' u./día') : 'Todos los recursos apilados · día de mayor demanda de cada periodo'}
        actions=${html`
          <${ui.Select} aria-label="Recurso del histograma" value=${sel} onValue=${(v) => setSelKey(v || '__all')} options=${[{ value: '__all', label: 'Todos los recursos' }, ...model.list.map((R) => ({ value: R.key, label: R.name }))]} style="width:auto;min-height:28px;padding-top:3px;padding-bottom:3px;font-size:var(--fs-sm)" />
          <${ui.Segmented} label="Periodo" value=${bucket} onChange=${setBucket} options=${[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]} />
          <${ui.SvgDownload} getSvg=${() => svgRef.current} filename=${fileBase(project) + '_histograma-recursos.svg'} />`}>
        <div class="stack">
          <div class="legend">
            ${selR ? html`
              <span class="legend-item"><span class="swatch" style=${'background:' + selR.color}></span>Demanda (máximo diario del periodo)</span>
              <span class="legend-item"><span class="swatch" style="background:var(--crit)"></span>Por encima de la disponibilidad</span>
              ${selR.limit !== null ? html`<span class="legend-item"><span class="legend-line" style="background:var(--fg)"></span>Disponible</span>` : null}`
            : html`${model.series.map((S) => html`<span key=${S.id} class="legend-item"><span class="swatch" style=${'background:' + S.color}></span>${S.name}</span>`)}
              <span class="legend-item"><span class="swatch" style="background:var(--crit-wash);border-top:3px solid var(--crit)"></span>Periodo con sobreasignación</span>`}
          </div>
          <${Histogram} model=${model} selKey=${sel} bucket=${bucket} svgRef=${svgRef} />
        </div>
      </${ui.Card}>
      <${ui.Card} title="Sobreasignaciones" subtitle=${model.conflicts.length ? 'Periodos en los que la demanda diaria supera la disponibilidad' : 'Sin conflictos con la disponibilidad definida'} pad=${!model.conflicts.length}>
        ${model.conflicts.length ? html`<div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table sched-tbl sched-conflicts">
          <thead><tr><th>Periodo</th><th>Recurso</th><th class="num">Demanda máxima</th><th class="num">Disponible</th><th class="num">Días sobreasignados</th><th>Primer día</th><th>Actividades involucradas</th></tr></thead>
          <tbody>${model.conflicts.map((c) => html`<tr key=${c.key}>
            <td class="nowrap">${bucket === 'mes' ? PM.MONTHS_LONG[+c.per.start.slice(5, 7) - 1] + ' ' + c.per.start.slice(0, 4) : fmt.date(c.per.start, 'dm') + ' – ' + fmt.date(c.per.end, 'dm')}</td>
            <td><span class="row" style="gap:6px;flex-wrap:nowrap"><span class="swatch" style=${'background:' + c.R.color}></span>${c.R.name}</span></td>
            <td class="num" style="color:var(--crit);font-weight:600">${fmt.num(c.demand, 2)}</td>
            <td class="num">${fmt.num(c.limit, 2)}</td>
            <td class="num">${c.days}</td>
            <td class="mono xsmall">${fmt.date(c.first, 'short')}</td>
            <td class="wrap"><div class="sched-tasklinks">${c.tasks.map((t) => html`<button key=${t.id} type="button" class="btn btn-ghost btn-sm" title="Abrir la actividad" onClick=${() => openTaskEditor(ctxRef.current, t.id)}>${idx.get(t.id)} · ${taskName(t)}</button>`)}</div></td>
          </tr>`)}</tbody>
        </table></div>` : html`<p class="small muted">${model.list.some((R) => R.limit !== null) ? 'Ningún recurso supera su disponibilidad en ningún día del cronograma.' : 'Define la disponibilidad (unidades por día) de cada recurso en la tabla de recursos para detectar sobreasignaciones.'}</p>`}
      </${ui.Card}>
      <${ui.Card} title="Matriz de asignación de recursos" subtitle="Unidades por día hábil de cada recurso en cada actividad" pad=${false}>
        <div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table table-tight sched-tbl sched-matrix">
          <thead><tr><th class="num">#</th><th>Actividad</th><th>Fechas</th>${model.list.map((R) => html`<th key=${R.key} class="u" title=${R.name}><span class="row" style="gap:5px;flex-wrap:nowrap;justify-content:center"><span class="swatch" style=${'background:' + R.color}></span>${fit(R.name, 140)}</span></th>`)}</tr></thead>
          <tbody>${matrixTasks.map((t) => html`<tr key=${t.id}>
            <td class="num faint">${idx.get(t.id)}</td><td class="wrap">${taskName(t)}</td><td class="mono xsmall">${fmt.date(t.startDate, 'dm')} – ${fmt.date(t.finishDate, 'dm')}</td>
            ${model.list.map((R) => { const u = unitsOf(t, R); return html`<td key=${R.key} class=${cx('u', u > 0 && 'has')}>${u > 0 ? fmt.num(u, 2) : ''}</td>`; })}
          </tr>`)}</tbody>
          <tfoot><tr><td></td><td colspan="2">Total días-recurso</td>${model.list.map((R) => html`<td key=${R.key} class="u">${fmt.num(R.rd, 1)}</td>`)}</tr></tfoot>
        </table></div>
      </${ui.Card}>
    </div>`;
  }

  /* ---------------------------------------------------------------- registro de vistas */
  PM.registerView({ id: 'cronograma', label: 'Cronograma (Gantt)', group: 'planificacion', icon: 'gantt', order: 20, component: CronogramaView, needsProject: true, description: 'Diagrama de Gantt, actividades, hitos y calendario laboral' });
  PM.registerView({ id: 'red', label: 'Diagrama de red', group: 'planificacion', icon: 'network', order: 30, component: RedView, needsProject: true, description: 'Diagrama de red (PDM) y cálculo de la ruta crítica' });
  PM.registerView({ id: 'recursos', label: 'Recursos', group: 'planificacion', icon: 'resources', order: 40, component: RecursosView, needsProject: true, description: 'Histograma, sobreasignaciones y matriz de asignación de recursos' });
})();

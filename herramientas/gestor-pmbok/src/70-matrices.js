/* ==========================================================================
   70-matrices.js — Matrices y análisis: matriz RACI (9.1), matriz de
   probabilidad e impacto (11.3), matrices de interesados (13.1 / 13.2) y
   herramientas de calidad: Ishikawa, Pareto y gráfico de control (8.2 / 8.3).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.matrices-note { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); color: var(--fg-2); font-size: var(--fs-sm); }
.matrices-note .icon { flex: none; margin-top: 2px; color: var(--fg-3); }
.matrices-note.is-crit { border-color: var(--crit); background: var(--crit-wash); color: var(--fg); }
.matrices-note.is-crit .icon { color: var(--crit); }
.matrices-note.is-good { border-color: var(--good); background: var(--good-wash); color: var(--fg); }
.matrices-note.is-good .icon { color: var(--good); }
.matrices-note.is-warn { border-color: var(--warn); background: var(--warn-wash); color: var(--fg); }
.matrices-note.is-warn .icon { color: var(--warn); }
.matrices-legend { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 18px; }
@media (max-width: 1100px) { .matrices-legend { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .matrices-legend { grid-template-columns: minmax(0, 1fr); } }
.matrices-legend-item { display: flex; gap: 10px; align-items: flex-start; font-size: var(--fs-sm); min-width: 0; line-height: 1.35; }
.matrices-letter { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 22px; padding: 0 6px; border-radius: 4px; font-family: var(--font-mono); font-weight: 600; font-size: 12px; line-height: 1; border: 1px solid transparent; flex: none; }
.matrices-letter-A, .matrices-letter-RA { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.matrices-letter-R { background: color-mix(in srgb, var(--s3) 24%, var(--surface)); border-color: color-mix(in srgb, var(--s3) 75%, var(--surface)); color: var(--fg); }
.matrices-letter-C { background: var(--surface-3); border-color: var(--line-strong); color: var(--fg); }
.matrices-letter-I { background: var(--surface); border: 1px dashed var(--fg-3); color: var(--fg-2); }
.matrices-letter-none { color: var(--fg-3); font-weight: 400; }
.matrices-raci { border-collapse: separate; border-spacing: 0; }
.matrices-raci thead th { vertical-align: bottom; white-space: normal; }
.matrices-raci .matrices-sticky { position: sticky; left: 0; z-index: 2; background: var(--surface); border-right: 1px solid var(--line); }
.matrices-raci thead .matrices-sticky { z-index: 3; background: var(--surface-2); }
.matrices-raci tbody tr:hover .matrices-sticky { background: var(--surface-2); }
.matrices-raci tbody th.matrices-act { min-width: 240px; white-space: normal; font-size: var(--fs-sm); font-weight: 400; color: var(--fg); padding: 4px 8px; vertical-align: middle; top: auto; }
.matrices-raci .matrices-narrow { width: 1%; white-space: nowrap; }
@media (max-width: 680px) { .matrices-raci tbody th.matrices-act { min-width: 172px; max-width: 200px; } .matrices-raci thead th.matrices-act-h { min-width: 172px; } .matrices-act-in { flex-direction: column; align-items: stretch !important; gap: 2px !important; } .matrices-raci .matrices-act-in .cell-input { flex: none; } .matrices-act-in .code-tag { align-self: flex-start; } }
.matrices-act-in { display: flex; gap: 6px; align-items: flex-start; min-width: 0; }
.matrices-act-in .code-tag { margin-top: 6px; }
.matrices-act-in .cell-input { min-width: 0; flex: 1; }
textarea.cell-input.matrices-autotext { resize: none; overflow: hidden; display: block; min-height: 28px; line-height: 1.35; }
.matrices-role-h { width: 92px; min-width: 92px; max-width: 92px; text-align: center !important; padding: 6px 4px !important; }
.matrices-role-h-in { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.matrices-role-name { font-size: var(--fs-xs); line-height: 1.25; font-weight: 600; color: var(--fg); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: break-word; hyphens: auto; }
.matrices-cell-td { padding: 3px !important; text-align: center; vertical-align: middle !important; }
.matrices-cell { width: 100%; min-height: 32px; border: 1px solid transparent; background: transparent; border-radius: var(--r-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 2px; }
.matrices-cell:hover { border-color: var(--line-strong); background: var(--surface); }
.matrices-row-bad th.matrices-sticky { box-shadow: inset 3px 0 0 var(--crit); }
.matrices-check { vertical-align: middle !important; white-space: nowrap; }
.matrices-add { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.matrices-add .input { flex: 1 1 240px; min-width: 0; max-width: 440px; }
.matrices-issues { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.matrices-issue { display: flex; gap: 8px; align-items: flex-start; width: 100%; text-align: left; border: 0; background: transparent; padding: 6px 8px; border-radius: var(--r-sm); cursor: pointer; color: var(--fg); font-size: var(--fs-sm); }
.matrices-issue:hover { background: var(--surface-2); }
.matrices-issue .icon { color: var(--crit); margin-top: 2px; }
.matrices-issue-txt { color: var(--crit); font-size: var(--fs-xs); }
.matrices-pop { padding: 8px; width: 270px; max-width: calc(100vw - 16px); display: flex; flex-direction: column; gap: 6px; }
.matrices-pop-title { padding: 2px 4px 6px; border-bottom: 1px solid var(--line); min-width: 0; }
.matrices-pop-opts { display: flex; flex-direction: column; gap: 2px; }
.matrices-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 5px 6px; border: 1px solid transparent; border-radius: var(--r-sm); background: transparent; cursor: pointer; text-align: left; color: var(--fg); font-size: var(--fs-sm); line-height: 1.3; }
.matrices-opt:hover { background: var(--surface-3); }
.matrices-opt[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-wash); }
.matrices-opt.is-danger { color: var(--crit); }
.matrices-opt .icon { color: var(--fg-3); }
.matrices-opt.is-danger .icon { color: var(--crit); }
.matrices-pop-hint { padding: 2px 4px 0; line-height: 1.35; }
.matrices-import-list { display: flex; flex-direction: column; gap: 2px; max-height: 46vh; overflow-y: auto; border: 1px solid var(--line); border-radius: var(--r-md); padding: 4px; }
.matrices-import-item { display: flex; gap: 8px; align-items: center; padding: 5px 6px; border-radius: var(--r-sm); font-size: var(--fs-sm); min-width: 0; }
.matrices-import-item input { accent-color: var(--accent); width: 15px; height: 15px; margin: 0; flex: none; }
.matrices-import-item.is-dup { color: var(--fg-3); }
.matrices-import-name { flex: 1; min-width: 0; }
.matrices-load { display: flex; gap: 8px; align-items: center; min-width: 120px; }
.matrices-load .meter { flex: 1; }
.matrices-heat-wrap { overflow-x: auto; max-width: 100%; }
.matrices-heat-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.matrices-heat-pair.is-single { grid-template-columns: minmax(0, 1fr); max-width: 640px; }
@media (max-width: 1180px) { .matrices-heat-pair { grid-template-columns: minmax(0, 1fr); max-width: 640px; } }
.matrices-heat-block { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.matrices-heat { display: grid; grid-template-columns: 60px repeat(5, minmax(48px, 1fr)); gap: 3px; min-width: 310px; }
.matrices-heat.is-opp { grid-template-columns: repeat(5, minmax(48px, 1fr)) 60px; }
.matrices-heat-cell { min-height: 68px; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 4px; display: flex; flex-direction: column; align-items: stretch; gap: 3px; cursor: pointer; text-align: left; color: var(--fg); font: inherit; min-width: 0; }
.matrices-heat-cell:hover { border-color: var(--fg-3); }
.matrices-heat-cell[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 2px var(--accent); }
/* Rampa de intensidad por nivel (bajo → muy alto): el tono y la saturación crecen con la puntuación para que
   medio y alto no se confundan (sus lavados de base son casi iguales); la puntuación y la leyenda dan el nivel en texto. */
.matrices-wash-good { background: var(--good-wash); border-color: color-mix(in srgb, var(--good) 40%, var(--surface)); }
.matrices-wash-warn { background: var(--warn-wash); border-color: color-mix(in srgb, var(--warn) 45%, var(--surface)); }
.matrices-wash-signal { background: color-mix(in srgb, var(--signal) 24%, var(--surface)); border-color: color-mix(in srgb, var(--signal) 70%, var(--surface)); }
.matrices-wash-crit { background: color-mix(in srgb, var(--crit) 32%, var(--surface)); border-color: color-mix(in srgb, var(--crit) 85%, var(--surface)); }
.matrices-heat-score { font-family: var(--font-mono); font-size: 10px; color: var(--fg-2); align-self: flex-end; line-height: 1; }
.matrices-wash-signal .matrices-heat-score, .matrices-wash-crit .matrices-heat-score { color: var(--fg); }
.matrices-heat-ids { display: flex; flex-wrap: wrap; gap: 2px; }
.matrices-rid { font-family: var(--font-mono); font-size: 10.5px; line-height: 1.5; padding: 0 4px; border-radius: 3px; background: var(--surface); border: 1px solid var(--line-strong); color: var(--fg); white-space: nowrap; }
.matrices-rid-more { background: var(--fg); color: var(--surface); border-color: var(--fg); }
.matrices-axis-p { display: flex; flex-direction: column; justify-content: center; align-items: flex-end; text-align: right; font-size: 10.5px; line-height: 1.15; color: var(--fg-2); padding-right: 4px; min-width: 0; }
.is-opp .matrices-axis-p { align-items: flex-start; text-align: left; padding: 0 0 0 4px; }
.matrices-axis-num { font-family: var(--font-mono); font-weight: 600; color: var(--fg); font-size: 12px; }
.matrices-axis-i { text-align: center; font-size: 10.5px; color: var(--fg-2); line-height: 1.15; padding-top: 3px; min-width: 0; }
.matrices-axis-title { font-size: var(--fs-xs); color: var(--fg-2); font-weight: 600; }
.matrices-level-sw { width: 14px; height: 14px; border-radius: 3px; border: 1px solid var(--line-strong); flex: none; display: inline-block; }
.matrices-bars { display: flex; flex-direction: column; gap: 6px; }
.matrices-bar-row { display: grid; grid-template-columns: minmax(0, 160px) minmax(0, 1fr) 34px; gap: 8px; align-items: center; font-size: var(--fs-sm); }
.matrices-bar-row .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.matrices-bar-track { height: 8px; background: var(--surface-3); border-radius: 4px; overflow: hidden; }
.matrices-bar-fill { height: 100%; border-radius: 4px; background: var(--s1); }
.matrices-bar-row .cnt { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); font-size: var(--fs-xs); }
.matrices-scale { min-width: 112px; }
.matrices-scale.is-impact { min-width: 116px; }
.matrices-cat-col { min-width: 96px; }
/* En pantallas medianas la categoría pasa a la línea de tipo (bajo la descripción) para que la tabla quepa sin desplazamiento */
.matrices-kind-cat { display: none; }
@media (max-width: 1599px) { .matrices-risk-table .matrices-cat-col { display: none; } .matrices-kind-cat { display: inline; } }
.matrices-sel-estado { min-width: 132px; }
.matrices-desc { min-width: 220px; max-width: 400px; white-space: normal; }
.matrices-desc .matrices-kind { font-size: var(--fs-xs); color: var(--fg-3); margin-top: 2px; }
.matrices-desc-txt { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.matrices-desc .matrices-kind.is-opp { color: var(--info); font-weight: 600; }
.matrices-filterbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 8px 10px; border-radius: var(--r-md); background: var(--accent-wash); color: var(--fg); font-size: var(--fs-sm); }
.matrices-pi-host { width: 100%; min-width: 0; }
.matrices-dot { cursor: grab; touch-action: none; outline: none; }
.matrices-dot.is-ro { cursor: default; }
.matrices-dot:focus-visible .matrices-dot-ring { stroke: var(--accent); stroke-width: 3px; }
.matrices-dragging .matrices-dot { cursor: grabbing; }
.matrices-quads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 760px) { .matrices-quads { grid-template-columns: minmax(0, 1fr); } }
.matrices-quad { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; background: var(--surface); min-width: 0; }
.matrices-quad.is-key { border-color: var(--accent); }
.matrices-quad-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.matrices-quad-list li { display: flex; gap: 8px; align-items: baseline; justify-content: space-between; font-size: var(--fs-sm); border-top: 1px solid var(--line); padding-top: 4px; min-width: 0; }
.matrices-eng td.matrices-eng-td { text-align: center; padding: 3px !important; min-width: 96px; vertical-align: middle; }
.matrices-eng-path { background: color-mix(in srgb, var(--accent) 9%, transparent); }
.matrices-eng-cell { width: 100%; min-height: 32px; display: inline-flex; gap: 4px; align-items: center; justify-content: center; border: 1px dashed transparent; border-radius: var(--r-sm); background: transparent; cursor: pointer; padding: 2px; }
.matrices-eng-cell:hover { border-color: var(--line-strong); background: var(--surface); }
.matrices-eng-static { min-height: 32px; display: inline-flex; gap: 4px; align-items: center; justify-content: center; }
.matrices-mark { display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; border-radius: 50%; font-family: var(--font-mono); font-weight: 700; font-size: 11.5px; border: 1.5px solid; line-height: 1; }
.matrices-mark-c { background: var(--surface-3); border-color: var(--fg-2); color: var(--fg); }
.matrices-mark-d { background: var(--accent-wash); border-color: var(--accent); color: var(--accent); }
.matrices-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 12px; }
.matrices-cat { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); display: flex; flex-direction: column; min-width: 0; }
.matrices-cat-head { display: flex; gap: 4px; align-items: center; padding: 8px; border-bottom: 1px solid var(--line); background: var(--surface-2); border-radius: var(--r-md) var(--r-md) 0 0; }
.matrices-cat-head .cell-input { font-weight: 600; }
.matrices-cat-body { display: flex; flex-direction: column; gap: 4px; padding: 8px; }
.matrices-cause, .matrices-sub { display: flex; gap: 2px; align-items: flex-start; min-width: 0; }
.matrices-cause .cell-input, .matrices-sub .cell-input { flex: 1; min-width: 0; }
.matrices-sub { padding-left: 22px; }
.matrices-sub .cell-input { font-size: var(--fs-xs); }
.matrices-btns { display: flex; flex: none; }
.matrices-ro-text { padding: 4px 6px; font-size: var(--fs-sm); flex: 1; min-width: 0; overflow-wrap: anywhere; }
.matrices-sub .matrices-ro-text { font-size: var(--fs-xs); color: var(--fg-2); }
.matrices-picker { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.matrices-picker .select { width: auto; min-width: 200px; max-width: 100%; flex: 1 1 220px; }
.matrices-fish text, .matrices-chart text { font-family: var(--font-body); }
.matrices-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.matrices-stats .stat { padding: 10px 14px; }
.matrices-stats .stat-value { font-size: 1.25rem; }
.matrices-flags { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); }
.matrices-flags li { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.matrices-series-form { display: grid; grid-template-columns: minmax(0, 2fr) repeat(4, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 900px) { .matrices-series-form { grid-template-columns: repeat(2, minmax(0, 1fr)); } .matrices-series-form > :first-child { grid-column: 1 / -1; } }
.matrices-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.matrices-form-grid > .span-all { grid-column: 1 / -1; }
@media (max-width: 560px) { .matrices-form-grid { grid-template-columns: minmax(0, 1fr); } }
`;
  if (!document.getElementById('css-matrices')) {
    const st = document.createElement('style');
    st.id = 'css-matrices';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- utilidades */
  const FONTS = { body: '"IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif', mono: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace' };
  let measureCtx = null;
  /* Ancho estimado de un texto en px (canvas; con margen para la fuente final). */
  const tw = (text, size = 11, weight = 400, fam = 'body') => {
    const s = String(text ?? '');
    if (!s) return 0;
    try {
      if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
      measureCtx.font = weight + ' ' + size + 'px ' + FONTS[fam];
      return measureCtx.measureText(s).width * 1.06;
    } catch (e) { return s.length * size * 0.6; }
  };
  /* Parte un texto en líneas de ancho máximo maxW (px). maxLines > 0 recorta con "…". */
  const wrap = (text, maxW, size, weight = 400, maxLines = 0) => {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    const breakLong = (w) => { let chunk = ''; for (const ch of w) { if (chunk && tw(chunk + ch, size, weight) > maxW) { lines.push(chunk); chunk = ch; } else chunk += ch; } return chunk; };
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (tw(t, size, weight) <= maxW) { cur = t; continue; }
      if (cur) lines.push(cur);
      cur = tw(w, size, weight) > maxW ? breakLong(w) : w;
    }
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) {
      const keep = lines.slice(0, maxLines);
      let last = keep[maxLines - 1];
      while (last.length > 1 && tw(last + '…', size, weight) > maxW) last = last.slice(0, -1);
      keep[maxLines - 1] = last.replace(/\s+$/, '') + '…';
      return keep;
    }
    return lines.length ? lines : [''];
  };
  const clip = (s, n) => { const t = String(s || ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
  const normKey = (s) => PM.slug(s);

  /* Re-render cuando terminan de cargar las fuentes (las medidas de texto cambian). */
  let fontsVersion = 0;
  const fontsListeners = new Set();
  const bumpFonts = () => { fontsVersion++; fontsListeners.forEach((f) => f(fontsVersion)); };
  try { if (document.fonts) { document.fonts.ready.then(bumpFonts); document.fonts.addEventListener('loadingdone', bumpFonts); } } catch (e) { /* sin API de fuentes */ }
  const useFontsVersion = () => { const [v, setV] = useState(fontsVersion); useEffect(() => { fontsListeners.add(setV); return () => fontsListeners.delete(setV); }, []); return v; };

  /* Ancho disponible de un contenedor (ResizeObserver). */
  const useWidth = (ref, fallback = 640) => {
    const [w, setW] = useState(fallback);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return undefined;
      const upd = () => { const v = Math.floor(el.clientWidth); if (v > 0) setW((o) => (Math.abs(o - v) > 1 ? v : o)); };
      upd();
      let ro = null;
      try { ro = new ResizeObserver(upd); ro.observe(el); } catch (e) { window.addEventListener('resize', upd); }
      return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', upd); };
    }, []);
    return w;
  };

  /* Escala "bonita" para ejes numéricos. */
  const niceStep = (span, count, integer) => {
    const raw = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    let step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    if (integer) step = Math.max(1, Math.round(step));
    return step;
  };
  const niceScale = (min, max, count = 5, integer = false) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
    if (!(max > min)) { const c = min; min = c - (Math.abs(c) * 0.1 || 1); max = c + (Math.abs(c) * 0.1 || 1); }
    const step = niceStep(max - min, count, integer);
    const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi: hi > lo ? hi : lo + step, step, ticks };
  };
  /* Barra con extremo de datos redondeado (4 px), anclada a la base. */
  const barPath = (x, y, w, h, r = 4) => {
    if (h <= 0) return '';
    const rr = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + rr) + 'Q' + x + ',' + y + ' ' + (x + rr) + ',' + y + 'H' + (x + w - rr) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + rr) + 'V' + (y + h) + 'Z';
  };
  /* Etiquetas de referencia a la derecha de un gráfico sin superponerse (separación vertical mínima). */
  const spreadLabels = (labels, minGap, top, bottom) => {
    const s = [...labels].sort((a, b) => a.y - b.y);
    for (let k = 1; k < s.length; k++) if (s[k].y - s[k - 1].y < minGap) s[k].ly = Math.max(s[k].y, (s[k - 1].ly ?? s[k - 1].y) + minGap);
    for (const l of s) if (l.ly === undefined) l.ly = l.y;
    for (let k = 1; k < s.length; k++) if (s[k].ly - s[k - 1].ly < minGap) s[k].ly = s[k - 1].ly + minGap;
    const over = s.length ? s[s.length - 1].ly - bottom : 0;
    if (over > 0) for (const l of s) l.ly -= over;
    if (s.length && s[0].ly < top) { const d = top - s[0].ly; for (const l of s) l.ly += d; }
    return s;
  };

  /* Opciones de una columna de tabla de plantilla (si la plantilla está cargada) o valores por defecto. */
  const optionsOf = (tid, field, col, fallback) => {
    const t = PM.templates && PM.templates[tid];
    if (t) {
      for (const s of t.sections || []) for (const f of s.fields || []) {
        if (f.key !== field) continue;
        const c = (f.columns || []).find((x) => x.key === col);
        if (c && Array.isArray(c.options) && c.options.length) return c.options.map((o) => (o && typeof o === 'object' ? String(o.value) : String(o)));
      }
    }
    return fallback;
  };
  const openRegister = (tid) => { if (typeof PM.openDocument === 'function') PM.openDocument(tid); else PM.navigate('documentos'); };
  const fileBase = (project, name) => (project && project.code ? PM.slug(project.code) + '_' : '') + name;
  const scale15 = (v) => { if (v === null || v === undefined || v === '') return null; const n = Math.round(PM.num(v, NaN)); return n >= 1 && n <= 5 ? n : null; };
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const prefTab = (key, allowed, fallback) => { const v = PM.prefs.get(key, fallback); return allowed.includes(v) ? v : fallback; };

  /* Campo de texto de una línea lógica que crece en alto para mostrar el texto completo (sin saltos de línea). */
  function AutoText({ value, onValue, label, placeholder, class: cls, ...rest }) {
    const ref = useRef();
    const fv = useFontsVersion();
    const fit = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; };
    useLayoutEffect(fit, [value, fv]);
    useEffect(() => {
      const el = ref.current;
      if (!el) return undefined;
      let lastW = el.clientWidth;
      let ro = null;
      try { ro = new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 0.5) { lastW = w; fit(); } }); ro.observe(el); } catch (e) { window.addEventListener('resize', fit); }
      return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); };
    }, []);
    return html`<textarea ref=${ref} rows="1" class=${cx('cell-input matrices-autotext', cls)} aria-label=${label} placeholder=${placeholder} value=${value ?? ''}
      onKeyDown=${(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      onInput=${(e) => onValue(e.currentTarget.value.replace(/[\r\n]+/g, ' '))} ...${rest}></textarea>`;
  }

  /* Exportación SVG: PM.svgToString conserva los atributos style con var(--…), que fuera de la página no se resuelven
     (las líneas con stroke:var(--x) desaparecerían). Aquí se sustituyen por el valor actual de cada token. */
  const svgExport = (el) => {
    if (!el) return '';
    const cs = getComputedStyle(document.documentElement);
    return PM.svgToString(el).replace(/var\((--[\w-]+)\)/g, (m, v) => cs.getPropertyValue(v).trim() || m);
  };
  const SvgDownloadBtn = ({ getSvg, filename }) => html`<${ui.Button} size="sm" icon="image" onClick=${() => { const el = getSvg(); if (el) PM.download(filename, svgExport(el)); }}>Descargar SVG</${ui.Button}>`;

  const Note = ({ tone, icon = 'info', children }) => html`<div class=${cx('matrices-note', tone && 'is-' + tone)}><${ui.Icon} name=${icon} size=${16} /><div style="min-width:0;flex:1">${children}</div></div>`;

  /* ---------------------------------------------------------------- registros emitidos (control de revisiones)
     Igual que en el editor de documentos (20-docs), un registro aprobado u obsoleto está bloqueado: solo se edita en
     borrador o en revisión. Las matrices que escriben en un registro (riesgos, interesados) quedan en modo de consulta
     y ofrecen crear la nueva revisión, que reabre el registro como borrador sin tocar la revisión emitida. */
  const EDITABLE_STATUS = ['borrador', 'revision'];
  const docStatus = (doc) => (doc && doc.status) || 'borrador';
  const useRegisterLock = (templateId, meta) => {
    const canWrite = PM.useCanWrite();
    const { project } = PM.useCurrentProject();
    const pid = project ? project.id : null;
    const r = PM.useDoc(pid ? PM.paths.doc(pid, templateId) : null);
    const ref = useRef(null);
    const doc = meta.exists && meta.doc ? meta.doc : null;
    const status = docStatus(doc);
    const locked = !!doc && !EDITABLE_STATUS.includes(status);
    const rev = doc && doc.rev ? String(doc.rev) : null;
    const nextDraft = PM.calc.nextDraftRev(rev);
    ref.current = { r, locked, pid };
    const newRevision = async () => {
      const t = PM.templates[templateId];
      const name = t ? t.name.charAt(0).toLowerCase() + t.name.slice(1) : 'registro';
      const ok = await PM.confirm({
        title: 'Crear nueva revisión (' + nextDraft + ')',
        body: html`<div class="stack-sm"><p>El ${name} se desbloqueará como borrador ${nextDraft} a partir del contenido de la revisión ${rev || 'vigente'}. La revisión ${status === 'obsoleto' ? 'obsoleta' : 'aprobada'} queda guardada en el historial.</p><p class="small muted">Cuando termines los cambios, emite la revisión desde el registro.</p></div>`,
        confirmText: 'Crear revisión ' + nextDraft,
      });
      if (!ok) return;
      const cur = ref.current;
      const data = cur.r.exists ? cur.r.data : null;
      if (!data || EDITABLE_STATUS.includes(docStatus(data))) return;
      const next = PM.calc.nextDraftRev(data.rev ? String(data.rev) : null);
      const base = PM.clone(data);
      base.status = 'borrador'; base.rev = next;
      base.titleBlock = { codigo: '', elaboro: '', reviso: '', aprobo: '', ...(base.titleBlock || {}), fechaAprobacion: null };
      base.updatedAt = PM.nowIso(); base.updatedBy = PM.getState().meId || null;
      PM.touchProject(cur.pid);
      await cur.r.saveNow(base);
      PM.toast('Revisión ' + next + ' del ' + name + ' abierta como borrador.');
    };
    return { canWrite, locked, editable: canWrite && !locked, status, rev, nextDraft, newRevision, isLocked: () => ref.current.locked };
  };
  const LOCKED_SAVE_MSG = (register) => 'No se guardó: el ' + register + ' quedó bloqueado (aprobado u obsoleto) mientras llenabas el formulario. Crea una nueva revisión del registro y vuelve a intentarlo.';
  /* Aviso de registro bloqueado con la acción para crear la nueva revisión (el registro se abre desde el encabezado). */
  const RegisterLockNote = ({ lock, register, what }) => {
    if (!lock.locked || !lock.canWrite) return null;
    const obs = lock.status === 'obsoleto';
    const state = lock.status === 'aprobado' ? 'está aprobado' : obs ? 'está marcado como obsoleto' : 'está bloqueado';
    return html`<div class=${cx('matrices-note', lock.status === 'aprobado' ? 'is-good' : 'is-warn')} role="status" data-mx-lock=${lock.status}>
      <${ui.Icon} name="lock" size=${16} />
      <div class="stack-sm" style="min-width:0;flex:1">
        <span>El ${register} ${state}${lock.rev ? ' (revisión ' + lock.rev + ')' : ''}, así que esta vista se muestra en modo de consulta. ${obs ? 'Para reactivarlo y ' + what + ', crea una nueva revisión.' : 'Para ' + what + ', crea una nueva revisión del registro; emítela desde el registro cuando termines.'}</span>
        <div class="row"><${ui.Button} size="sm" variant="primary" icon="edit" onClick=${lock.newRevision}>Crear nueva revisión (${lock.nextDraft})</${ui.Button}></div>
      </div>
    </div>`;
  };

  /* ---------------------------------------------------------------- popover anclado (teclado + clic fuera) */
  function Popover({ anchor, onClose, label, children, class: cls }) {
    const ref = useRef();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    const [pos, setPos] = useState(null);
    useLayoutEffect(() => {
      const place = () => {
        const el = ref.current;
        if (!el || !anchor || !anchor.isConnected) return;
        const a = anchor.getBoundingClientRect();
        const w = el.offsetWidth, h = el.offsetHeight;
        const vw = document.documentElement.clientWidth, vh = window.innerHeight;
        let left = a.left + a.width / 2 - w / 2;
        left = Math.max(8, Math.min(left, vw - w - 8));
        let top = a.bottom + 6;
        if (top + h > vh - 8 && a.top - h - 6 >= 8) top = a.top - h - 6;
        setPos((p) => (p && Math.abs(p.left - left) < 0.5 && Math.abs(p.top - top) < 0.5 ? p : { left, top }));
      };
      place();
      /* foco en la opción actual en el mismo ciclo de pintura: el teclado funciona apenas se abre */
      const el0 = ref.current;
      const first = el0 && (el0.querySelector('[data-autofocus]') || el0.querySelector('button:not([disabled]), input, select'));
      if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    }, [anchor]);
    useEffect(() => {
      const el = ref.current;
      const onDown = (e) => { if (el && !el.contains(e.target) && !(anchor && anchor.contains(e.target))) closeRef.current(false); };
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); closeRef.current(true); } };
      document.addEventListener('pointerdown', onDown, true);
      document.addEventListener('keydown', onKey);
      return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey); };
    }, [anchor]);
    const onKeyDown = (e) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const btns = [...ref.current.querySelectorAll('button:not([disabled])')];
      if (!btns.length) return;
      const i = btns.indexOf(document.activeElement);
      const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : fwd ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
      e.preventDefault();
      btns[j].focus();
    };
    const style = pos ? 'position:fixed;left:' + pos.left + 'px;top:' + pos.top + 'px' : 'position:fixed;left:-10000px;top:0';
    return html`<div ref=${ref} class=${cx('popover matrices-pop', cls)} role="dialog" aria-label=${label} onKeyDown=${onKeyDown} style=${style}>${children}</div>`;
  }
  const usePopover = () => {
    const [st, setSt] = useState(null);
    const stRef = useRef(null);
    stRef.current = st;
    const open = useCallback((anchor, data) => setSt((cur) => (cur && cur.anchor === anchor ? null : { anchor, data })), []);
    const close = useCallback((restore) => {
      const cur = stRef.current;
      setSt(null);
      if (restore && cur && cur.anchor && cur.anchor.isConnected) setTimeout(() => { try { cur.anchor.focus(); } catch (e) { /* elemento ya no existe */ } }, 0);
    }, []);
    return { state: st, open, close };
  };
  const MenuOpt = ({ icon, label, onClick, danger, disabled }) => html`<button type="button" class=${cx('matrices-opt', danger && 'is-danger')} disabled=${disabled} onClick=${onClick}><${ui.Icon} name=${icon} size=${15} /><span>${label}</span></button>`;

  /* Selector de nombres con casillas (roles). */
  function PickNamesModal({ close, title, subtitle, candidates, emptyText, emptyAction, onConfirm, intro, resetKey }) {
    const fresh = candidates.filter((c) => !c.exists);
    const allFresh = () => new Set(fresh.map((c) => c.name));
    /* la selección pertenece a una fuente de nombres (resetKey): al cambiarla vuelve a "todos los nuevos" */
    const [sel, setSel] = useState(() => ({ key: resetKey, set: allFresh() }));
    const picked = sel.key === resetKey ? sel.set : allFresh();
    const setPicked = (fn) => setSel((st) => ({ key: resetKey, set: typeof fn === 'function' ? fn(st.key === resetKey ? st.set : allFresh()) : fn }));
    const toggle = (name, on) => setPicked((s) => { const n = new Set(s); if (on) n.add(name); else n.delete(name); return n; });
    const count = fresh.filter((c) => picked.has(c.name)).length;
    const footer = html`<${ui.Button} onClick=${close}>${fresh.length ? 'Cancelar' : 'Cerrar'}</${ui.Button}>
      ${fresh.length ? html`<${ui.Button} variant="primary" icon="plus" disabled=${!count} onClick=${() => { onConfirm(fresh.filter((c) => picked.has(c.name)).map((c) => c.name)); close(); }}>${count === 1 ? 'Agregar 1 rol' : 'Agregar ' + count + ' roles'}</${ui.Button}>` : emptyAction || null}`;
    return html`<${ui.Modal} title=${title} subtitle=${subtitle} onClose=${close} footer=${footer}>
      ${intro || null}
      ${!candidates.length ? html`<p>${emptyText}</p>` : html`<div class="stack-sm">
        ${fresh.length > 1 ? html`<div class="row"><${ui.Button} size="sm" variant="ghost" icon="check" onClick=${() => setPicked(new Set(fresh.map((c) => c.name)))}>Seleccionar todos</${ui.Button}><${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => setPicked(new Set())}>Quitar selección</${ui.Button}></div>` : null}
        <div class="matrices-import-list">${candidates.map((c) => html`<label key=${c.name} class=${cx('matrices-import-item', c.exists && 'is-dup')}>
          <input type="checkbox" disabled=${c.exists} checked=${c.exists || picked.has(c.name)} onChange=${(e) => toggle(c.name, e.currentTarget.checked)} />
          <span class="matrices-import-name">${c.name}${c.detail ? html`<span class="xsmall faint"> · ${c.detail}</span>` : null}</span>
          ${c.exists ? html`<span class="chip">Ya está en la matriz</span>` : null}
        </label>`)}</div>
        ${!fresh.length ? html`<p class="small muted">Todos estos roles ya están en la matriz.</p>` : null}
      </div>`}
    </${ui.Modal}>`;
  }

  /* Roles desde el registro de interesados: el usuario elige qué columna da el nombre de cada rol. */
  const STAKE_NAME_FIELDS = [{ value: 'rol', label: 'Rol en el proyecto' }, { value: 'cargo', label: 'Cargo' }, { value: 'nombre', label: 'Interesado' }];
  const STAKE_FIELD_LABEL = { rol: 'Rol en el proyecto', cargo: 'Cargo', nombre: 'Interesado' };
  const stakeValues = (rows, f) => rows.map((x) => String((x && x[f]) || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
  /* Por defecto: entre las columnas con nombres cortos (un rol descriptivo largo no sirve como encabezado), la que más
     coincide con los roles que ya tiene la matriz; si ninguna coincide, la primera en el orden rol, cargo, interesado. */
  const defaultStakeField = (rows, have) => {
    const fields = ['rol', 'cargo', 'nombre'];
    const short = fields.filter((f) => { const v = stakeValues(rows, f); return v.length && v.every((x) => x.length <= 40); });
    const pool = short.length ? short : fields.filter((f) => stakeValues(rows, f).length);
    if (!pool.length) return 'rol';
    const hits = (f) => new Set(stakeValues(rows, f).map(normKey).filter((k) => have && have.has(k))).size;
    return pool.reduce((best, f) => (hits(f) > hits(best) ? f : best), pool[0]);
  };
  const stakeCandidates = (rows, field, have) => {
    const map = new Map();
    for (const x of rows) {
      const name = String((x && x[field]) || '').trim().replace(/\s+/g, ' ');
      if (!name) continue;
      const k = normKey(name);
      if (!map.has(k)) map.set(k, { name, who: [] });
      const who = String((field === 'nombre' ? x.cargo || x.rol : x.nombre) || '').trim();
      if (who && !map.get(k).who.includes(who)) map.get(k).who.push(who);
    }
    return [...map.values()].map((x) => ({ name: x.name, detail: clip(x.who.join(', '), 60), exists: have.has(normKey(x.name)) }));
  };
  function StakeRoleImportModal({ close, rows, have, onConfirm, onOpenRegister }) {
    const [field, setField] = useState(() => defaultStakeField(rows, have));
    const candidates = useMemo(() => stakeCandidates(rows, field, have), [rows, field, have]);
    const intro = rows.length ? html`<${ui.Field} label="Usar como nombre del rol"><${ui.Segmented} label="Columna del registro que da el nombre del rol" value=${field} onChange=${setField} options=${STAKE_NAME_FIELDS} /></${ui.Field}>` : null;
    return html`<${PickNamesModal} close=${close} title="Importar roles del registro de interesados" subtitle="Cada valor distinto de la columna elegida se agrega como una columna de la matriz."
      candidates=${candidates} intro=${intro} resetKey=${field}
      emptyText=${rows.length ? 'Ningún interesado tiene diligenciada la columna «' + STAKE_FIELD_LABEL[field] + '». Elige otra columna o complétala en el registro.' : 'El registro de interesados todavía no tiene interesados.'}
      emptyAction=${html`<${ui.Button} variant="primary" icon="file" onClick=${() => { close(); onOpenRegister(); }}>Abrir registro de interesados</${ui.Button}>`}
      onConfirm=${onConfirm} />`;
  }

  /* ================================================================== 1. MATRIZ RACI */
  const RACI_INFO = {
    R: { label: 'R', name: 'Responsable de ejecutar', short: 'Responsable', desc: 'Hace el trabajo. Puede haber varios por actividad.' },
    A: { label: 'A', name: 'Persona que rinde cuentas / aprueba', short: 'Rinde cuentas', desc: 'Responde por el resultado y lo aprueba. Exactamente una por actividad.' },
    C: { label: 'C', name: 'Consultado', short: 'Consultado', desc: 'Aporta información o criterio antes de decidir o ejecutar (comunicación en doble vía).' },
    I: { label: 'I', name: 'Informado', short: 'Informado', desc: 'Recibe el avance o el resultado (comunicación en una vía).' },
    RA: { label: 'R/A', name: 'Responsable y rinde cuentas', short: 'Responsable y rinde cuentas', desc: 'Ejecuta el trabajo y además responde por él.' },
    '': { label: '—', name: 'Vacío', short: 'Sin asignar', desc: 'Sin participación en esta actividad.' },
  };
  const RACI_ORDER = ['R', 'A', 'C', 'I', 'RA', ''];
  const normRaci = (v) => { const s = String(v || '').toUpperCase().replace(/[^RACI]/g, ''); if (s === 'AR') return 'RA'; return ['R', 'A', 'C', 'I', 'RA'].includes(s) ? s : ''; };
  const EXAMPLE_ROLES = ['Patrocinador', 'Director de proyecto', 'Ingeniero de diseño', 'Residente de obra', 'Coordinador SST (HSE)', 'Coordinador logístico', 'Supervisor de montaje', 'Cuadrilla de montaje', 'Almacén', 'Facturación y cartera', 'Director de obra del cliente', 'Interventoría del cliente', 'ARL'];
  const cmpCode = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let k = 0; k < Math.max(x.length, y.length); k++) { const d = (x[k] ?? -1) - (y[k] ?? -1); if (d) return d; } return 0; };

  const raciCheck = (row, roles) => {
    let a = 0, r = 0;
    for (const role of roles) { const v = normRaci(row.cells && row.cells[role.id]); if (v === 'A' || v === 'RA') a++; if (v === 'R' || v === 'RA') r++; }
    const issues = [], short = [];
    if (a === 0) { issues.push('Falta quien rinde cuentas (A)'); short.push('Sin A'); }
    if (a > 1) { issues.push('Tiene ' + a + ' roles que rinden cuentas (A); debe haber uno solo'); short.push(a + ' A'); }
    if (r === 0) { issues.push('Falta quien ejecuta (R)'); short.push('Sin R'); }
    return { a, r, issues, short };
  };

  function RaciLetter({ v, showEmpty, decorative }) {
    const k = normRaci(v);
    if (!k) return html`<span class="matrices-letter matrices-letter-none" aria-hidden=${showEmpty && !decorative ? undefined : 'true'}>${showEmpty ? '—' : '·'}</span>`;
    return html`<span class=${'matrices-letter matrices-letter-' + k} aria-hidden=${decorative ? 'true' : undefined}>${RACI_INFO[k].label}</span>`;
  }

  function WbsImportModal({ close, tree, existing, onImport }) {
    const [mode, setMode] = useState('leaves');
    const all = tree.flat;
    const cand = all.filter((f) => (mode === 'leaves' ? f.isLeaf : f.depth === 1));
    const fresh = cand.filter((f) => !existing.has(f.node.id));
    const dup = cand.length - fresh.length;
    const footer = all.length
      ? html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" disabled=${!fresh.length} onClick=${() => { onImport(fresh); close(); }}>${fresh.length ? 'Importar ' + plural(fresh.length, 'elemento', 'elementos') : 'Nada nuevo para importar'}</${ui.Button}>`
      : html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}><${ui.Button} variant="primary" icon="wbs" onClick=${() => { close(); PM.navigate('edt'); }}>Ir a la EDT</${ui.Button}>`;
    return html`<${ui.Modal} title="Importar de la EDT" subtitle="Agrega filas a la matriz a partir de la estructura de desglose del trabajo." onClose=${close} footer=${footer}>
      ${!all.length ? html`<p>La EDT del proyecto todavía no tiene elementos. Créala primero y vuelve a importar.</p>` : html`
        <${ui.Segmented} label="Elementos a importar" value=${mode} onChange=${setMode} options=${[{ value: 'leaves', label: 'Paquetes de trabajo' }, { value: 'level1', label: 'Entregables de nivel 1' }]} />
        <p class="small muted">${mode === 'leaves' ? 'Los paquetes de trabajo son el nivel más bajo de la EDT; ahí se asigna quién ejecuta y quién aprueba.' : 'Los entregables de nivel 1 dan una matriz resumida, útil para el plan de gestión de los recursos.'}</p>
        <div class="matrices-import-list">${cand.map((f) => html`<div key=${f.node.id} class=${cx('matrices-import-item', existing.has(f.node.id) && 'is-dup')}><span class="code-tag">${f.code}</span><span class="matrices-import-name">${f.node.name || 'Elemento sin nombre'}</span>${existing.has(f.node.id) ? html`<span class="chip">Ya está en la matriz</span>` : null}</div>`)}</div>
        ${dup ? html`<p class="small faint">${plural(dup, 'elemento ya está', 'elementos ya están')} en la matriz y se omitirá${dup === 1 ? '' : 'n'}.</p>` : null}`}
    </${ui.Modal}>`;
  }

  function RaciView({ project }) {
    const canWrite = PM.useCanWrite();
    const [raci, save, meta] = PM.useToolData('raci', PM.EMPTY.raci);
    const model = PM.useProjectModel();
    const [stakeRows] = PM.useDocTable('registro-interesados', 'interesados');
    const pop = usePopover();
    const latest = useRef(raci);
    latest.current = raci;
    const [newAct, setNewAct] = useState('');
    const roles = raci.roles || [];
    const rows = raci.rows || [];
    const tree = model.tree;
    const update = (fn) => { const cur = latest.current || {}; const base = { roles: cur.roles || [], rows: cur.rows || [] }; const next = { ...cur, ...base, ...fn(base) }; latest.current = next; PM.touchProject(project && project.id); return save(next); };
    const checks = useMemo(() => rows.map((r) => raciCheck(r, roles)), [rows, roles]);
    const codeOf = (row) => (row.wbsId ? tree.codes.get(row.wbsId) || null : null);

    const setCell = (rowId, roleId, v) => {
      const val = normRaci(v);
      update(({ rows }) => ({ rows: rows.map((r) => { if (r.id !== rowId) return r; const cells = { ...(r.cells || {}) }; if (val) cells[roleId] = val; else delete cells[roleId]; return { ...r, cells }; }) }));
    };
    const addRow = (name) => { const t = String(name || '').trim(); if (!t) return; update(({ rows }) => ({ rows: [...rows, { id: PM.uid('ra'), wbsId: null, activity: t, cells: {} }] })); };
    const addRoles = (names) => {
      update(({ roles }) => { const have = new Set(roles.map((r) => normKey(r.name))); const add = []; for (const n of names) { const k = normKey(n); if (!k || have.has(k)) continue; have.add(k); add.push({ id: PM.uid('rol'), name: n.trim() }); } return { roles: [...roles, ...add] }; });
    };
    const addRole = async () => {
      const name = await PM.promptText({ title: 'Agregar rol', label: 'Nombre del rol (columna)', placeholder: 'Ej.: Supervisor de montaje', confirmText: 'Agregar rol' });
      if (!name) return;
      if ((latest.current.roles || []).some((r) => normKey(r.name) === normKey(name))) { PM.toast('Ya existe un rol con ese nombre en la matriz.'); return; }
      addRoles([name]);
    };
    const roleAction = async (action, roleId) => {
      pop.close(action !== 'rename' && action !== 'delete');
      const list = latest.current.roles || [];
      const role = list.find((r) => r.id === roleId);
      if (!role) return;
      if (action === 'rename') {
        const name = await PM.promptText({ title: 'Renombrar rol', label: 'Nombre del rol', value: role.name, confirmText: 'Guardar nombre' });
        if (!name || name === role.name) return;
        if ((latest.current.roles || []).some((r) => r.id !== roleId && normKey(r.name) === normKey(name))) { PM.toast('Ya existe otro rol con ese nombre en la matriz. Usa un nombre distinto.'); return; }
        update(({ roles }) => ({ roles: roles.map((r) => (r.id === roleId ? { ...r, name } : r)) }));
      } else if (action === 'left' || action === 'right') {
        update(({ roles }) => { const i = roles.findIndex((r) => r.id === roleId); return { roles: PM.moveItem(roles, i, i + (action === 'left' ? -1 : 1)) }; });
      } else if (action === 'delete') {
        const used = (latest.current.rows || []).filter((r) => normRaci(r.cells && r.cells[roleId])).length;
        if (used) {
          const ok = await PM.confirm({ title: 'Eliminar rol', body: 'Se eliminará el rol «' + role.name + '» y ' + plural(used, 'asignación', 'asignaciones') + ' que tiene en la matriz. Esta acción no se puede deshacer.', confirmText: 'Eliminar rol', tone: 'danger' });
          if (!ok) return;
        }
        update(({ roles, rows }) => ({ roles: roles.filter((r) => r.id !== roleId), rows: rows.map((r) => { if (!r.cells || !(roleId in r.cells)) return r; const cells = { ...r.cells }; delete cells[roleId]; return { ...r, cells }; }) }));
        PM.toast('Rol eliminado de la matriz.');
      }
    };
    const delRow = async (row) => {
      const used = Object.values(row.cells || {}).filter((v) => normRaci(v)).length;
      if (used) {
        const ok = await PM.confirm({ title: 'Eliminar fila', body: 'Se eliminará «' + (row.activity || 'la fila') + '» con ' + plural(used, 'asignación', 'asignaciones') + '.', confirmText: 'Eliminar fila', tone: 'danger' });
        if (!ok) return;
      }
      update(({ rows }) => ({ rows: rows.filter((r) => r.id !== row.id) }));
    };
    const moveRow = (i, d) => update(({ rows }) => ({ rows: PM.moveItem(rows, i, i + d) }));
    const sortByWbs = () => update(({ rows }) => {
      const withCode = rows.map((r, i) => ({ r, i, c: r.wbsId ? tree.codes.get(r.wbsId) : null }));
      withCode.sort((a, b) => (a.c && b.c ? cmpCode(a.c, b.c) || a.i - b.i : a.c ? -1 : b.c ? 1 : a.i - b.i));
      return { rows: withCode.map((x) => x.r) };
    });

    const openWbsImport = () => {
      const existing = new Set((latest.current.rows || []).map((r) => r.wbsId).filter(Boolean));
      PM.openModal((close) => html`<${WbsImportModal} close=${close} tree=${tree} existing=${existing} onImport=${(list) => {
        update(({ rows }) => ({ rows: [...rows, ...list.map((f) => ({ id: PM.uid('ra'), wbsId: f.node.id, activity: f.node.name || 'Elemento sin nombre', cells: {} }))] }));
        PM.toast(plural(list.length, 'fila importada', 'filas importadas') + ' de la EDT.');
      }} />`);
    };
    const openRoleImport = (source) => {
      const have = new Set((latest.current.roles || []).map((r) => normKey(r.name)));
      const onConfirm = (names) => { addRoles(names); PM.toast(plural(names.length, 'rol agregado', 'roles agregados') + ' a la matriz.'); };
      if (source === 'stake') {
        PM.openModal((close) => html`<${StakeRoleImportModal} close=${close} rows=${stakeRows} have=${have} onConfirm=${onConfirm} onOpenRegister=${() => openRegister('registro-interesados')} />`);
        return;
      }
      const candidates = EXAMPLE_ROLES.map((name) => ({ name, exists: have.has(normKey(name)) }));
      PM.openModal((close) => html`<${PickNamesModal} close=${close} title="Agregar roles de la lista de ejemplo" subtitle="Roles habituales en proyectos de alquiler y montaje de andamios."
        candidates=${candidates} emptyText="No hay roles de ejemplo disponibles." onConfirm=${onConfirm} />`);
    };

    const exportCsv = () => {
      const cols = [{ key: 'code', label: 'Código EDT' }, { key: 'activity', label: 'Actividad / entregable' }, ...roles.map((r) => ({ key: 'r_' + r.id, label: r.name })), { key: 'obs', label: 'Observaciones' }];
      const data = rows.map((row, i) => {
        const o = { code: codeOf(row) || '', activity: row.activity || '' };
        for (const r of roles) { const v = normRaci(row.cells && row.cells[r.id]); o['r_' + r.id] = v ? RACI_INFO[v].label : ''; }
        o.obs = roles.length ? checks[i].issues.join('; ') : '';
        return o;
      });
      PM.download(fileBase(project, 'matriz-raci') + '.csv', PM.toCSV(cols, data));
    };

    const roleStats = useMemo(() => roles.map((role) => {
      const s = { role, R: 0, A: 0, C: 0, I: 0, load: 0 };
      for (const r of rows) { const v = normRaci(r.cells && r.cells[role.id]); if (!v) continue; if (v === 'R' || v === 'RA') s.R++; if (v === 'A' || v === 'RA') s.A++; if (v === 'C') s.C++; if (v === 'I') s.I++; if (v !== 'C' && v !== 'I') s.load++; }
      return s;
    }), [roles, rows]);
    const bad = rows.map((r, i) => ({ r, c: checks[i] })).filter((x) => roles.length && x.c.issues.length);

    const header = html`<${ui.PageHeader} eyebrow="9.1 Planificar la gestión de recursos · Matriz de asignación de responsabilidades" title="Matriz RACI"
      description="Define quién ejecuta (R), quién rinde cuentas (A), a quién se consulta (C) y a quién se informa (I) en cada actividad o entregable. Cada fila debe tener exactamente un A y al menos un R."
      actions=${rows.length && roles.length ? html`<${ui.Button} icon="download" onClick=${exportCsv}>Exportar CSV</${ui.Button}>` : null} />`;
    if (meta.loading) return html`<div class="page">${header}<${ui.Loading} rows=${5} /></div>`;

    const importItems = [
      { label: 'Importar de la EDT', icon: 'wbs', onClick: openWbsImport, disabled: model.loading },
      { label: 'Importar roles del registro de interesados', icon: 'stakeholders', onClick: () => openRoleImport('stake') },
      { label: 'Agregar roles de la lista de ejemplo', icon: 'resources', onClick: () => openRoleImport('example') },
      'sep',
      { label: 'Ordenar filas por código EDT', icon: 'arrow-down', onClick: sortByWbs, disabled: !rows.some((r) => r.wbsId) },
    ];
    const legend = html`<div class="matrices-legend" aria-label="Leyenda de la matriz RACI">${['R', 'A', 'C', 'I'].map((k) => html`<div class="matrices-legend-item" key=${k}><${RaciLetter} v=${k} /><div><strong>${RACI_INFO[k].name}</strong><div class="xsmall muted">${RACI_INFO[k].desc}</div></div></div>`)}</div>`;

    if (!roles.length && !rows.length) {
      return html`<div class="page">${header}
        <${ui.Empty} icon="raci" title="La matriz RACI está vacía" actions=${canWrite ? html`
          <${ui.Button} variant="primary" icon="wbs" onClick=${openWbsImport} disabled=${model.loading}>Importar de la EDT</${ui.Button}>
          <${ui.Button} icon="resources" onClick=${() => openRoleImport('example')}>Agregar roles de ejemplo</${ui.Button}>
          <${ui.Button} icon="plus" onClick=${addRole}>Agregar rol</${ui.Button}>` : null}>
          Las filas son actividades o entregables (puedes traerlos de la EDT) y las columnas son roles del equipo y de los interesados. ${canWrite ? 'Empieza importando la EDT o agregando los roles.' : 'Todavía no se ha diligenciado.'}
        </${ui.Empty}>
        <${ui.Card} title="Cómo se lee la matriz">${legend}</${ui.Card}>
      </div>`;
    }

    const renderPop = () => {
      const s = pop.state;
      if (!s) return null;
      const d = s.data;
      if (d.kind === 'cell') {
        const row = rows.find((r) => r.id === d.rowId), role = roles.find((r) => r.id === d.roleId);
        if (!row || !role) return null;
        const cur = normRaci(row.cells && row.cells[role.id]);
        return html`<${Popover} anchor=${s.anchor} onClose=${pop.close} label=${'Asignar responsabilidad a ' + role.name}>
          <div class="matrices-pop-title"><div class="xsmall faint truncate" title=${row.activity}>${row.activity || 'Fila sin nombre'}</div><div class="h4 truncate" title=${role.name}>${role.name}</div></div>
          <div class="matrices-pop-opts">${RACI_ORDER.map((k) => html`<button key=${k || 'none'} type="button" class="matrices-opt" aria-pressed=${cur === k ? 'true' : 'false'} data-autofocus=${cur === k ? '' : undefined} onClick=${() => { setCell(row.id, role.id, k); pop.close(true); }}>
            <${RaciLetter} v=${k} showEmpty decorative /><span>${RACI_INFO[k].short}</span></button>`)}</div>
          <div class="xsmall faint matrices-pop-hint">Atajo: sobre la celda escribe R, A, C o I; Supr la deja vacía.</div>
        </${Popover}>`;
      }
      if (d.kind === 'role') {
        const i = roles.findIndex((r) => r.id === d.roleId);
        if (i < 0) return null;
        return html`<${Popover} anchor=${s.anchor} onClose=${pop.close} label=${'Opciones del rol ' + roles[i].name}>
          <div class="matrices-pop-title"><div class="h4 truncate">${roles[i].name}</div></div>
          <div class="matrices-pop-opts">
            <${MenuOpt} icon="edit" label="Renombrar" onClick=${() => roleAction('rename', d.roleId)} />
            <${MenuOpt} icon="arrow-left" label="Mover a la izquierda" disabled=${i === 0} onClick=${() => roleAction('left', d.roleId)} />
            <${MenuOpt} icon="arrow-right" label="Mover a la derecha" disabled=${i === roles.length - 1} onClick=${() => roleAction('right', d.roleId)} />
            <${MenuOpt} icon="trash" label="Eliminar rol" danger onClick=${() => roleAction('delete', d.roleId)} />
          </div>
        </${Popover}>`;
      }
      return null;
    };

    const focusRow = (id) => { const el = document.getElementById('matrices-row-' + id); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); const b = el.querySelector('button.matrices-cell, textarea'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 250); } };

    return html`<div class="page">${header}
      <div class="stack">
        ${canWrite ? html`<div class="toolbar">
          <${ui.Button} size="sm" icon="plus" onClick=${addRole}>Agregar rol</${ui.Button}>
          <${ui.Dropdown} variant="" size="sm" icon="upload" buttonLabel="Importar" label="Importar filas o roles" align="left" items=${importItems} />
          <div class="spacer"></div>
          <span class="xsmall faint">${plural(rows.length, 'fila', 'filas')} · ${plural(roles.length, 'rol', 'roles')}</span>
        </div>` : null}
        ${!roles.length ? html`<${Note}>Agrega roles (columnas) para asignar responsabilidades: con «Agregar rol», o desde «Importar» con los roles del registro de interesados o de la lista de ejemplo.</${Note}>` : null}
        ${!rows.length ? html`<${Note}>Agrega actividades o entregables (filas) con el campo de abajo, o impórtalos de la EDT.</${Note}>` : null}
        <div class="table-wrap">
          <table class="table table-tight matrices-raci">
            <thead><tr>
              <th class="matrices-sticky matrices-act-h" scope="col">Actividad / entregable</th>
              ${roles.map((role) => html`<th key=${role.id} class="matrices-role-h" scope="col"><div class="matrices-role-h-in">
                <span class="matrices-role-name" title=${role.name}>${role.name}</span>
                ${canWrite ? html`<button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label=${'Opciones del rol ' + role.name} title="Opciones del rol" aria-haspopup="dialog" onClick=${(e) => pop.open(e.currentTarget, { kind: 'role', roleId: role.id })}><${ui.Icon} name="more" size=${14} /></button>` : null}
              </div></th>`)}
              <th scope="col" class="matrices-narrow">Validación</th>
              ${canWrite ? html`<th scope="col" class="matrices-narrow"><span class="sr-only">Acciones de fila</span></th>` : null}
            </tr></thead>
            <tbody>
              ${rows.map((row, i) => {
                const c = checks[i];
                const code = codeOf(row);
                const lost = row.wbsId && !code && !model.loading;
                const isBad = roles.length && c.issues.length;
                return html`<tr key=${row.id} id=${'matrices-row-' + row.id} class=${isBad ? 'matrices-row-bad' : ''}>
                  <th scope="row" class="matrices-sticky matrices-act"><div class="matrices-act-in">
                    ${code ? html`<span class="code-tag" title="Código EDT">${code}</span>` : lost ? html`<span class="code-tag" title="Este elemento ya no existe en la EDT">—</span>` : null}
                    ${canWrite ? html`<${AutoText} value=${row.activity || ''} label=${'Nombre de la fila ' + (i + 1)} onValue=${(v) => update(({ rows }) => ({ rows: rows.map((r) => (r.id === row.id ? { ...r, activity: v } : r)) }))} />` : html`<span>${row.activity || html`<span class="faint">Sin nombre</span>`}</span>`}
                  </div></th>
                  ${roles.map((role) => {
                    const v = normRaci(row.cells && row.cells[role.id]);
                    return html`<td key=${role.id} class="matrices-cell-td">${canWrite ? html`<button type="button" class="matrices-cell" aria-haspopup="dialog" data-cell=${row.id + ':' + role.id}
                      aria-label=${(row.activity || 'Fila ' + (i + 1)) + ' — ' + role.name + ': ' + (v ? RACI_INFO[v].short : 'sin asignar')}
                      onClick=${(e) => pop.open(e.currentTarget, { kind: 'cell', rowId: row.id, roleId: role.id })}
                      onKeyDown=${(e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toUpperCase(); if (['R', 'A', 'C', 'I'].includes(k)) { e.preventDefault(); setCell(row.id, role.id, k); } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); setCell(row.id, role.id, ''); } }}>
                      <${RaciLetter} v=${v} /></button>` : html`<span title=${v ? RACI_INFO[v].short : 'Sin asignar'}><${RaciLetter} v=${v} /></span>`}</td>`;
                  })}
                  <td class="matrices-check matrices-narrow">${!roles.length ? html`<span class="faint xsmall">—</span>` : c.issues.length ? html`<span class="chip chip-crit" title=${c.issues.join('. ')}><${ui.Icon} name="alert" size=${12} />${c.short.join(' · ')}</span>` : html`<span class="chip chip-good"><${ui.Icon} name="check" size=${12} />Completa</span>`}</td>
                  ${canWrite ? html`<td class="ctl" style="vertical-align:middle"><div class="row" style="gap:0;flex-wrap:nowrap">
                    <${ui.IconButton} size="sm" icon="chevron-up" label="Subir fila" disabled=${i === 0} onClick=${() => moveRow(i, -1)} />
                    <${ui.IconButton} size="sm" icon="chevron-down" label="Bajar fila" disabled=${i === rows.length - 1} onClick=${() => moveRow(i, 1)} />
                    <${ui.IconButton} size="sm" icon="trash" label="Eliminar fila" onClick=${() => delRow(row)} />
                  </div></td>` : null}
                </tr>`;
              })}
            </tbody>
          </table>
        </div>
        ${canWrite ? html`<form class="matrices-add" onSubmit=${(e) => { e.preventDefault(); if (!newAct.trim()) return; addRow(newAct); setNewAct(''); }}>
          <input class="input" value=${newAct} placeholder="Nueva actividad o entregable" aria-label="Nombre de la nueva actividad o entregable" onInput=${(e) => setNewAct(e.currentTarget.value)} />
          <${ui.Button} type="submit" size="sm" icon="plus" disabled=${!newAct.trim()}>Agregar actividad</${ui.Button}>
        </form>` : null}
      </div>
      <div class="grid cols-2">
        <${ui.Card} title="Validación de la matriz" subtitle="Regla: exactamente un A y al menos un R por fila">
          ${!rows.length || !roles.length ? html`<p class="small muted">La validación aparece cuando la matriz tiene filas y roles.</p>`
            : !bad.length ? html`<${Note} tone="good" icon="check-circle">Todas las filas tienen exactamente un A y al menos un R.</${Note}>`
            : html`<div class="stack-sm" data-raci-issues>
              <div class="small"><strong>${plural(bad.length, 'fila', 'filas')}</strong> de ${rows.length} con observaciones. Selecciona una para ir a ella.</div>
              <ul class="matrices-issues">${bad.map(({ r, c }) => html`<li key=${r.id}><button type="button" class="matrices-issue" onClick=${() => focusRow(r.id)}><${ui.Icon} name="alert" size=${15} />
                <span style="min-width:0">${codeOf(r) ? html`<span class="code-tag">${codeOf(r)}</span> ` : null}<span>${r.activity || 'Fila sin nombre'}</span><div class="matrices-issue-txt">${c.issues.join('. ')}.</div></span>
              </button></li>`)}</ul>
            </div>`}
        </${ui.Card}>
        <${ui.Card} title="Carga por rol" subtitle="Asignaciones por letra; la carga cuenta filas donde el rol ejecuta o rinde cuentas" pad=${false}>
          ${!roles.length ? html`<div class="card-body small muted">Sin roles todavía.</div>` : html`<div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table table-tight">
            <thead><tr><th>Rol</th><th class="num">R</th><th class="num">A</th><th class="num">C</th><th class="num">I</th><th>Carga (R o A)</th></tr></thead>
            <tbody>${roleStats.map((s) => html`<tr key=${s.role.id}>
              <td style="min-width:140px">${s.role.name}${!s.R && !s.A && !s.C && !s.I ? html` <span class="chip chip-outline">Sin asignaciones</span>` : null}</td>
              <td class="num mono">${s.R}</td><td class="num mono">${s.A}</td><td class="num mono">${s.C}</td><td class="num mono">${s.I}</td>
              <td><div class="matrices-load"><${ui.Meter} value=${rows.length ? s.load / rows.length : 0} label=${'Carga de ' + s.role.name} /><span class="xsmall mono nowrap">${s.load}/${rows.length}</span></div></td>
            </tr>`)}</tbody>
          </table></div>`}
        </${ui.Card}>
      </div>
      <${ui.Card} title="Leyenda">${legend}<p class="xsmall faint" style="margin-top:12px">R/A indica que el mismo rol ejecuta y rinde cuentas. Usa la matriz junto con el plan de gestión de los recursos y el acta de constitución del equipo.</p></${ui.Card}>
      ${renderPop()}
    </div>`;
  }

  /* ================================================================== 2. MATRIZ DE PROBABILIDAD E IMPACTO */
  const RISK_FALLBACK = {
    categoria: ['Técnico', 'Externo', 'De la organización', 'Dirección de proyectos'],
    tipo: ['Amenaza', 'Oportunidad'],
    estrategia: ['Escalar', 'Evitar', 'Transferir', 'Mitigar', 'Aceptar', 'Explotar', 'Compartir', 'Mejorar'],
    estado: ['Abierto', 'En seguimiento', 'Cerrado', 'Materializado'],
  };
  const THREAT_STRATS = ['Escalar', 'Evitar', 'Transferir', 'Mitigar', 'Aceptar'];
  const OPP_STRATS = ['Escalar', 'Explotar', 'Compartir', 'Mejorar', 'Aceptar'];
  const P_LABELS = { 1: 'Muy baja', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Muy alta' };
  /* Mismas etiquetas que las escalas del plan de gestión de los riesgos (13-templates-b). */
  const I_LABELS = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' };
  const LEVELS_INFO = [
    { id: 'muy-alto', label: 'Muy alto', tone: 'crit', range: '20–25' },
    { id: 'alto', label: 'Alto', tone: 'signal', range: '10–19' },
    { id: 'medio', label: 'Medio', tone: 'warn', range: '5–9' },
    { id: 'bajo', label: 'Bajo', tone: 'good', range: '1–4' },
  ];
  const TONE_VAR = { good: 'var(--good)', warn: 'var(--warn)', signal: 'var(--signal)', crit: 'var(--crit)' };
  const isOpp = (r) => /^oportunidad/i.test(String(r.tipo || '').trim());
  const isOpenRisk = (r) => !/^(cerrado|materializado)$/i.test(String(r.estado || '').trim());
  const riskCode = (r, idx) => { const s = String(r.id || '').trim(); return s && !/^r_[a-z0-9]{6,}$/i.test(s) ? s : '#' + (idx + 1); };
  const nextRiskId = (rows) => { let max = 0; for (const r of rows) { const m = /^R-(\d+)$/i.exec(String(r.id || '').trim()); if (m) max = Math.max(max, Number(m[1])); } return 'R-' + String(max + 1).padStart(3, '0'); };

  const LevelChip = ({ score }) => { const l = PM.calc.riskLevel(score); return html`<${ui.Chip} tone=${l.tone} title=${'Puntuación ' + (score || '—') + ': nivel ' + l.label}>${l.label}</${ui.Chip}>`; };
  const ScaleSelect = ({ value, onValue, label, labels, disabled, impact }) => html`<select class=${cx('cell-input matrices-scale', impact && 'is-impact')} aria-label=${label} value=${value ? String(value) : ''} disabled=${disabled} onChange=${(e) => onValue(e.currentTarget.value ? Number(e.currentTarget.value) : null)}>
    <option value="">Sin evaluar</option>${[1, 2, 3, 4, 5].map((n) => html`<option key=${n} value=${String(n)}>${n} · ${labels[n]}</option>`)}</select>`;

  function RiskHeat({ opp, items, filter, onPick }) {
    const cols = opp ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];
    const cells = [];
    for (const p of [5, 4, 3, 2, 1]) {
      const lbl = html`<div key=${'p' + p} class="matrices-axis-p"><span class="matrices-axis-num">${p}</span><span>${P_LABELS[p]}</span></div>`;
      if (!opp) cells.push(lbl);
      for (const i of cols) {
        const score = p * i, lvl = PM.calc.riskLevel(score);
        const here = items.filter((x) => x.p === p && x.i === i).sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true }));
        const active = !!(filter && filter.opp === opp && filter.p === p && filter.i === i);
        const shown = here.slice(0, 3), more = here.length - shown.length;
        const tip = (opp ? 'Oportunidades' : 'Amenazas') + ' · Probabilidad ' + p + ' × Impacto ' + i + ' = ' + score + ' · Nivel ' + lvl.label + (here.length ? '\n' + here.map((x) => x.code + ': ' + clip(x.r.descripcion, 70)).join('\n') : '\nSin riesgos');
        cells.push(html`<button key=${p + '-' + i} type="button" class=${cx('matrices-heat-cell', 'matrices-wash-' + lvl.tone)} aria-pressed=${active ? 'true' : 'false'} title=${tip}
          data-heat=${(opp ? 'o' : 'a') + p + i}
          aria-label=${(opp ? 'Oportunidades' : 'Amenazas') + ': probabilidad ' + p + ' (' + P_LABELS[p] + '), impacto ' + i + ' (' + I_LABELS[i] + '), puntuación ' + score + ', nivel ' + lvl.label + ', ' + plural(here.length, 'riesgo', 'riesgos') + (active ? '. Filtro activo' : '')}
          onClick=${() => onPick(active ? null : { opp, p, i })}>
          <span class="matrices-heat-score">${score}</span>
          <span class="matrices-heat-ids">${shown.map((x) => html`<span key=${x.idx} class="matrices-rid">${x.code}</span>`)}${more > 0 ? html`<span class="matrices-rid matrices-rid-more">+${more}</span>` : null}</span>
        </button>`);
      }
      if (opp) cells.push(lbl);
    }
    if (!opp) cells.push(html`<div key="corner"></div>`);
    for (const i of cols) cells.push(html`<div key=${'i' + i} class="matrices-axis-i"><span class="matrices-axis-num">${i}</span><br />${I_LABELS[i]}</div>`);
    if (opp) cells.push(html`<div key="corner"></div>`);
    const count = items.length;
    return html`<div class="matrices-heat-block">
      <div class="row-between"><h3 class="h4">${opp ? 'Oportunidades' : 'Amenazas'}</h3><span class="xsmall faint">${plural(count, 'riesgo evaluado', 'riesgos evaluados')}</span></div>
      <div class="matrices-heat-wrap"><div class=${cx('matrices-heat', opp && 'is-opp')}>${cells}</div></div>
      <div class="row-between matrices-axis-title"><span>${opp ? '← Impacto positivo' : 'Probabilidad ↑ · Impacto →'}</span><span>${opp ? 'Probabilidad ↑' : ''}</span></div>
    </div>`;
  }

  function CountBars({ rows, tone }) {
    const max = Math.max(1, ...rows.map((r) => r.count));
    return html`<div class="matrices-bars">${rows.map((r) => html`<div key=${r.label} class="matrices-bar-row"><span class="lbl" title=${r.label}>${r.chip || r.label}</span>
      <div class="matrices-bar-track" aria-hidden="true"><div class="matrices-bar-fill" style=${'width:' + (r.count / max) * 100 + '%' + (r.tone ? ';background:' + TONE_VAR[r.tone] : tone ? ';background:' + tone : '')}></div></div>
      <span class="cnt">${r.count}</span></div>`)}</div>`;
  }

  function RiskFormModal({ close, nextId, opts, currency, onSave }) {
    const [f, setF] = useState({ descripcion: '', tipo: 'Amenaza', categoria: '', probabilidad: null, impacto: null, causa: '', efecto: '', propietario: '', estrategia: '', respuesta: '', reserva: null, estado: opts.estado[0] || 'Abierto' });
    const [touched, setTouched] = useState(false);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const opp = f.tipo === 'Oportunidad';
    const pool = opp ? OPP_STRATS : THREAT_STRATS;
    const strategies = opts.estrategia.filter((s) => pool.includes(s)).length ? opts.estrategia.filter((s) => pool.includes(s)) : opts.estrategia;
    const score = PM.calc.riskScore(f.probabilidad, f.impacto);
    const err = !f.descripcion.trim() ? 'Describe el riesgo para poder registrarlo.' : null;
    const submit = (e) => { if (e) e.preventDefault(); setTouched(true); if (err) return; if (onSave({ id: nextId, descripcion: f.descripcion.trim(), causa: f.causa.trim(), efecto: f.efecto.trim(), categoria: f.categoria, tipo: f.tipo, probabilidad: f.probabilidad, impacto: f.impacto, propietario: f.propietario.trim(), estrategia: f.estrategia, respuesta: f.respuesta.trim(), disparador: '', reserva: opp ? null : f.reserva, estado: f.estado }) === false) return; close(); };
    const scaleOpts = (labels) => [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: n + ' · ' + labels[n] }));
    return html`<${ui.Modal} title="Agregar riesgo" subtitle=${'Se registrará como ' + nextId + ' en el registro de riesgos.'} size="wide" onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" onClick=${submit}>Agregar riesgo</${ui.Button}>`}>
      <form class="matrices-form-grid" onSubmit=${submit}>
        <${ui.Field} label="Descripción del riesgo" required for="mx-r-desc" class="span-all" error=${touched && err} hint="Redáctalo como causa, riesgo y efecto: «Debido a…, puede ocurrir…, lo que ocasionaría…»."><${ui.TextArea} id="mx-r-desc" value=${f.descripcion} onValue=${set('descripcion')} rows=${2} autoFocus /></${ui.Field}>
        <${ui.Field} label="Tipo"><${ui.Segmented} label="Tipo de riesgo" value=${f.tipo} onChange=${(v) => setF((x) => ({ ...x, tipo: v, estrategia: '' }))} options=${opts.tipo} /></${ui.Field}>
        <${ui.Field} label="Categoría" for="mx-r-cat"><${ui.Select} id="mx-r-cat" value=${f.categoria} onValue=${set('categoria')} placeholder="Sin categoría" options=${opts.categoria} /></${ui.Field}>
        <${ui.Field} label="Probabilidad (1–5)" for="mx-r-p"><${ui.Select} id="mx-r-p" value=${f.probabilidad ? String(f.probabilidad) : ''} onValue=${(v) => set('probabilidad')(v ? Number(v) : null)} placeholder="Sin evaluar" options=${scaleOpts(P_LABELS)} /></${ui.Field}>
        <${ui.Field} label="Impacto (1–5)" for="mx-r-i"><${ui.Select} id="mx-r-i" value=${f.impacto ? String(f.impacto) : ''} onValue=${(v) => set('impacto')(v ? Number(v) : null)} placeholder="Sin evaluar" options=${scaleOpts(I_LABELS)} /></${ui.Field}>
        <div class="span-all row small"><span class="muted">Puntuación (P × I):</span><strong class="mono">${score || '—'}</strong><${LevelChip} score=${score} /></div>
        <${ui.Field} label="Causa" for="mx-r-causa"><${ui.Input} id="mx-r-causa" value=${f.causa} onValue=${set('causa')} /></${ui.Field}>
        <${ui.Field} label="Efecto" for="mx-r-efecto"><${ui.Input} id="mx-r-efecto" value=${f.efecto} onValue=${set('efecto')} /></${ui.Field}>
        <${ui.Field} label="Propietario del riesgo" for="mx-r-prop"><${ui.Input} id="mx-r-prop" value=${f.propietario} onValue=${set('propietario')} placeholder="Rol responsable" /></${ui.Field}>
        <${ui.Field} label="Estrategia de respuesta" for="mx-r-estr"><${ui.Select} id="mx-r-estr" value=${f.estrategia} onValue=${set('estrategia')} placeholder="Sin definir" options=${strategies} /></${ui.Field}>
        <${ui.Field} label="Respuesta acordada" for="mx-r-resp" class="span-all"><${ui.TextArea} id="mx-r-resp" value=${f.respuesta} onValue=${set('respuesta')} rows=${2} /></${ui.Field}>
        ${opp ? null : html`<${ui.Field} label="Reserva para contingencias asignada" for="mx-r-res" hint="Monto que se reserva para responder si la amenaza ocurre."><${ui.NumberInput} id="mx-r-res" money currency=${currency} min=${0} value=${f.reserva} onValue=${set('reserva')} /></${ui.Field}>`}
        <${ui.Field} label="Estado" for="mx-r-est"><${ui.Select} id="mx-r-est" value=${f.estado} onValue=${set('estado')} options=${opts.estado} /></${ui.Field}>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  function RiskMatrixView({ project }) {
    const canWrite = PM.useCanWrite();
    const [rows, saveRows, meta] = PM.useDocTable('registro-riesgos', 'riesgos');
    const lock = useRegisterLock('registro-riesgos', meta);
    const editable = canWrite && !lock.locked;
    const model = PM.useProjectModel();
    const latestRows = useRef(null);
    latestRows.current = { rows, saveRows };
    const [filter, setFilter] = useState(null);
    const [mode, setModeRaw] = useState(() => prefTab('matrices.riskMode', ['both', 'threat', 'opp'], 'both'));
    const setMode = (v) => { setModeRaw(v); PM.prefs.set('matrices.riskMode', v); if (filter && ((v === 'threat' && filter.opp) || (v === 'opp' && !filter.opp))) setFilter(null); };
    const currency = (project && project.currency) || 'COP';
    const opts = useMemo(() => ({
      categoria: optionsOf('registro-riesgos', 'riesgos', 'categoria', RISK_FALLBACK.categoria),
      tipo: optionsOf('registro-riesgos', 'riesgos', 'tipo', RISK_FALLBACK.tipo),
      estrategia: optionsOf('registro-riesgos', 'riesgos', 'estrategia', RISK_FALLBACK.estrategia),
      estado: optionsOf('registro-riesgos', 'riesgos', 'estado', RISK_FALLBACK.estado),
    }), []);
    const items = useMemo(() => rows.map((r, idx) => { const p = scale15(r.probabilidad), i = scale15(r.impacto); const score = p && i ? p * i : 0; return { r, idx, p, i, score, level: PM.calc.riskLevel(score), opp: isOpp(r), code: riskCode(r, idx) }; }), [rows]);
    const evaluated = items.filter((x) => x.score > 0);
    const unevaluated = items.filter((x) => !x.score);
    const patchRow = (idx, patch) => { if (lock.isLocked()) return; const cur = latestRows.current; const next = cur.rows.map((r, j) => (j === idx ? { ...r, ...patch } : r)); cur.rows = next; cur.saveRows(next); };
    const listed = useMemo(() => {
      let l = evaluated;
      if (filter) l = l.filter((x) => x.opp === filter.opp && x.p === filter.p && x.i === filter.i);
      else if (mode === 'threat') l = l.filter((x) => !x.opp);
      else if (mode === 'opp') l = l.filter((x) => x.opp);
      return [...l].sort((a, b) => b.score - a.score || (b.i || 0) - (a.i || 0) || a.code.localeCompare(b.code, 'es', { numeric: true }));
    }, [evaluated, filter, mode]);

    const openAdd = () => PM.openModal((close) => html`<${RiskFormModal} close=${close} nextId=${nextRiskId(rows)} opts=${opts} currency=${currency} onSave=${(row) => { if (lock.isLocked()) { PM.toast(LOCKED_SAVE_MSG('registro de riesgos'), { tone: 'crit' }); return false; } const cur = latestRows.current; cur.saveRows([...cur.rows, row]); PM.toast('Riesgo ' + row.id + ' agregado al registro.'); }} />`);
    const header = html`<${ui.PageHeader} eyebrow="11.3 Realizar el análisis cualitativo de riesgos" title="Matriz de probabilidad e impacto"
      description="Prioriza los riesgos del registro según su probabilidad y su impacto (escala 1–5). La puntuación es P × I. Selecciona una celda para ver sus riesgos."
      actions=${html`<${ui.Button} icon="file" onClick=${() => openRegister('registro-riesgos')}>Abrir registro completo</${ui.Button}>${editable ? html`<${ui.Button} variant="primary" icon="plus" onClick=${openAdd}>Agregar riesgo</${ui.Button}>` : null}`} />`;
    const lockNote = html`<${RegisterLockNote} lock=${lock} register="registro de riesgos" what="cambiar la probabilidad, el impacto o el estado de los riesgos, o agregar riesgos" />`;
    if (meta.loading) return html`<div class="page">${header}<${ui.Loading} rows=${6} /></div>`;
    if (!rows.length) {
      return html`<div class="page">${header}${lockNote}<${ui.Empty} icon="risk" title="Aún no hay riesgos registrados" actions=${html`${editable ? html`<${ui.Button} variant="primary" icon="plus" onClick=${openAdd}>Agregar riesgo</${ui.Button}>` : null}<${ui.Button} icon="file" onClick=${() => openRegister('registro-riesgos')}>Abrir registro de riesgos</${ui.Button}>`}>
        Cuando registres riesgos con su probabilidad e impacto, aparecerán aquí ubicados en la matriz de amenazas o de oportunidades, ordenados por prioridad.
      </${ui.Empty}></div>`;
    }

    const threats = evaluated.filter((x) => !x.opp), opps = evaluated.filter((x) => x.opp);
    const levelRows = LEVELS_INFO.map((l) => ({ label: l.label, tone: l.tone, count: evaluated.filter((x) => x.level.id === l.id).length, chip: html`<${ui.Chip} tone=${l.tone}>${l.label}</${ui.Chip}>` }));
    if (unevaluated.length) levelRows.push({ label: 'Sin evaluar', count: unevaluated.length, chip: html`<${ui.Chip} tone="outline">Sin evaluar</${ui.Chip}>`, tone: null });
    const groupCount = (key, empty, order) => { const g = PM.groupBy(items, (x) => String(x.r[key] || '').trim() || empty); const keys = [...order.filter((k) => g[k]), ...Object.keys(g).filter((k) => !order.includes(k)).sort()]; return keys.map((k) => ({ label: k, count: g[k].length })); };
    const byCat = groupCount('categoria', 'Sin categoría', opts.categoria);
    const byEstado = groupCount('estado', 'Sin estado', opts.estado);
    const openThreats = items.filter((x) => !x.opp && isOpenRisk(x.r));
    const highOpen = openThreats.filter((x) => x.score >= 10).length;
    const reserveOpen = PM.sum(openThreats, (x) => PM.num(x.r.reserva));
    const contingency = PM.num(model.costs && model.costs.reserves && model.costs.reserves.contingency);
    const ratio = contingency > 0 ? reserveOpen / contingency : null;
    const filterLabel = filter ? (filter.opp ? 'Oportunidades' : 'Amenazas') + ' · Probabilidad ' + filter.p + ' × Impacto ' + filter.i + ' (' + PM.calc.riskLevel(filter.p * filter.i).label + ')' : '';

    const riskRow = (x) => html`<tr key=${x.idx} data-risk=${x.code}>
      <td class="mono nowrap">${x.code}</td>
      <td class="matrices-desc"><div class="matrices-desc-txt" title=${x.r.descripcion || undefined}>${x.r.descripcion || html`<span class="faint">Sin descripción</span>`}</div><div class=${cx('matrices-kind', x.opp && 'is-opp')}>${x.opp ? 'Oportunidad' : 'Amenaza'}<span class="matrices-kind-cat">${' · ' + (x.r.categoria || 'Sin categoría')}</span></div></td>
      <td class="matrices-cat-col">${x.r.categoria || html`<span class="faint">—</span>`}</td>
      <td>${editable ? html`<${ScaleSelect} value=${x.p} labels=${P_LABELS} label=${'Probabilidad de ' + x.code} onValue=${(v) => patchRow(x.idx, { probabilidad: v })} />` : html`<span class="mono">${x.p || '—'}</span>`}</td>
      <td>${editable ? html`<${ScaleSelect} impact value=${x.i} labels=${I_LABELS} label=${'Impacto de ' + x.code} onValue=${(v) => patchRow(x.idx, { impacto: v })} />` : html`<span class="mono">${x.i || '—'}</span>`}</td>
      <td class="nowrap"><span class="mono" style="display:inline-block;min-width:22px;text-align:right">${x.score || '—'}</span> <${LevelChip} score=${x.score} /></td>
      <td class="nowrap">${x.r.estrategia || html`<span class="faint">—</span>`}</td>
      <td style="min-width:120px">${x.r.propietario || html`<span class="faint">—</span>`}</td>
      <td>${editable ? html`<select class="cell-input matrices-sel-estado" aria-label=${'Estado de ' + x.code} value=${x.r.estado || ''} onChange=${(e) => patchRow(x.idx, { estado: e.currentTarget.value })}><option value="">Sin estado</option>${[...new Set([...opts.estado, ...(x.r.estado ? [x.r.estado] : [])])].map((o) => html`<option key=${o} value=${o}>${o}</option>`)}</select>` : x.r.estado || html`<span class="faint">—</span>`}</td>
    </tr>`;
    const tableHead = html`<thead><tr><th>ID</th><th>Riesgo</th><th class="matrices-cat-col">Categoría</th><th>Probabilidad</th><th>Impacto</th><th>Puntuación</th><th>Estrategia</th><th>Propietario</th><th>Estado</th></tr></thead>`;

    return html`<div class="page">${header}${lockNote}
      <div class="row-between">
        <${ui.Segmented} label="Matrices visibles" value=${mode} onChange=${setMode} options=${[{ value: 'both', label: 'Amenazas y oportunidades' }, { value: 'threat', label: 'Amenazas' }, { value: 'opp', label: 'Oportunidades' }]} />
        <div class="legend" aria-label="Niveles de riesgo">${LEVELS_INFO.slice().reverse().map((l) => html`<span key=${l.id} class="legend-item"><span class=${'matrices-level-sw matrices-wash-' + l.tone} style=${'border-color:' + TONE_VAR[l.tone]}></span>${l.label} (${l.range})</span>`)}</div>
      </div>
      <div class=${cx('matrices-heat-pair', mode !== 'both' && 'is-single')}>
        ${mode !== 'opp' ? html`<${RiskHeat} opp=${false} items=${threats} filter=${filter} onPick=${setFilter} />` : null}
        ${mode !== 'threat' ? html`<${RiskHeat} opp=${true} items=${opps} filter=${filter} onPick=${setFilter} />` : null}
      </div>
      <section class="section">
        <div class="section-head"><h2 class="h3">Riesgos priorizados</h2><span class="xsmall faint">Ordenados por puntuación, de mayor a menor</span></div>
        ${filter ? html`<div class="matrices-filterbar" role="status"><${ui.Icon} name="filter" size=${15} /><span>Celda seleccionada: <strong>${filterLabel}</strong> · ${plural(listed.length, 'riesgo', 'riesgos')}</span><div class="spacer"></div><${ui.Button} size="sm" icon="x" onClick=${() => setFilter(null)}>Quitar filtro</${ui.Button}></div>` : null}
        <div class="table-wrap"><table class="table matrices-risk-table">${tableHead}<tbody>
          ${listed.length ? listed.map(riskRow) : html`<tr><td colspan="9" class="faint" style="padding:14px 12px">${filter ? 'No hay riesgos en esta celda.' : 'No hay riesgos evaluados en esta vista.'}</td></tr>`}
        </tbody></table></div>
      </section>
      ${unevaluated.length ? html`<section class="section">
        <div class="section-head"><h2 class="h3">Riesgos sin evaluar</h2><span class="xsmall faint">Asigna probabilidad e impacto para ubicarlos en la matriz</span></div>
        <div class="table-wrap"><table class="table matrices-risk-table" data-unevaluated>${tableHead}<tbody>${unevaluated.map(riskRow)}</tbody></table></div>
      </section>` : null}
      <div class="grid cols-3">
        <${ui.Card} title="Por nivel"><${CountBars} rows=${levelRows} /></${ui.Card}>
        <${ui.Card} title="Por categoría"><${CountBars} rows=${byCat} /></${ui.Card}>
        <${ui.Card} title="Por estado"><${CountBars} rows=${byEstado} /></${ui.Card}>
      </div>
      <${ui.Card} title="Reserva para contingencias" subtitle="Reservas asignadas a amenazas abiertas o en seguimiento frente a la reserva para contingencias del presupuesto">
        <div class="stack">
          <div class="grid cols-3" style="gap:0">
            <${ui.Stat} label="Amenazas abiertas" value=${openThreats.length} sub=${plural(highOpen, 'de nivel alto o muy alto', 'de nivel alto o muy alto')} />
            <${ui.Stat} label="Reserva asignada en el registro" value=${PM.fmt.moneyShort(reserveOpen, currency)} title=${PM.fmt.money(reserveOpen, currency)} sub="Suma de las reservas de las amenazas abiertas" />
            <${ui.Stat} label="Reserva para contingencias" value=${PM.fmt.moneyShort(contingency, currency)} title=${PM.fmt.money(contingency, currency)} sub="Definida en Costos" tone=${ratio !== null && ratio > 1 ? 'crit' : undefined} />
          </div>
          ${contingency > 0 ? html`<div class="stack-sm"><${ui.Meter} value=${Math.min(1, ratio)} tone=${ratio > 1 ? 'crit' : ratio > 0.85 ? 'warn' : 'good'} label="Uso de la reserva para contingencias" />
              ${ratio > 1 ? html`<${Note} tone="crit" icon="alert">Las reservas asignadas superan la reserva para contingencias en ${PM.fmt.money(reserveOpen - contingency, currency)}. Revisa las estimaciones de las respuestas o solicita un cambio al presupuesto.</${Note}>`
                : html`<div class="small muted">Las amenazas abiertas usan el ${PM.fmt.pct(ratio)} de la reserva para contingencias; quedan ${PM.fmt.money(contingency - reserveOpen, currency)} disponibles.</div>`}</div>`
            : html`<${Note}>No hay reserva para contingencias registrada en Costos. ${reserveOpen > 0 ? 'Las amenazas abiertas tienen ' + PM.fmt.money(reserveOpen, currency) + ' asignados. ' : ''}Defínela en la vista de curva S y valor ganado.</${Note}>`}
        </div>
      </${ui.Card}>
    </div>`;
  }

  /* ================================================================== 3. MATRICES DE INTERESADOS */
  const ENG_LEVELS = ['Desconocedor', 'Reticente', 'Neutral', 'Partidario', 'Líder'];
  const ENG_DESC = {
    Desconocedor: 'No conoce el proyecto ni sus impactos potenciales.',
    Reticente: 'Conoce el proyecto y sus impactos, pero se resiste al cambio.',
    Neutral: 'Conoce el proyecto, pero no lo apoya ni se opone.',
    Partidario: 'Conoce el proyecto y sus impactos, y apoya el cambio.',
    Líder: 'Conoce el proyecto y participa activamente para asegurar su éxito.',
  };
  const normLevel = (v) => { const k = PM.slug(v); return ENG_LEVELS.find((l) => PM.slug(l) === k) || ''; };
  const QUADS = [
    { id: 'cerca', label: 'Gestionar de cerca', sub: 'Alto poder · alto interés', strategy: 'Involucrarlos activamente: reuniones periódicas, participación en las decisiones clave y comunicación frecuente y personalizada.' },
    { id: 'satisfechos', label: 'Mantener satisfechos', sub: 'Alto poder · bajo interés', strategy: 'Atender sus necesidades y consultarlos en las decisiones que los afecten, sin saturarlos de información.' },
    { id: 'informados', label: 'Mantener informados', sub: 'Bajo poder · alto interés', strategy: 'Comunicar el avance con regularidad y atender sus inquietudes; pueden ser aliados útiles o alertar sobre problemas.' },
    { id: 'monitorear', label: 'Monitorear', sub: 'Bajo poder · bajo interés', strategy: 'Seguimiento con mínimo esfuerzo y comunicaciones generales; revisar periódicamente si cambia su posición.' },
  ];
  const QUAD = Object.fromEntries(QUADS.map((q) => [q.id, q]));
  const quadOf = (p, i) => (p >= 3 ? (i >= 3 ? 'cerca' : 'satisfechos') : i >= 3 ? 'informados' : 'monitorear');
  const stakeName = (r, idx) => String(r.nombre || '').trim() || String(r.cargo || '').trim() || String(r.rol || '').trim() || 'Interesado ' + (idx + 1);
  const classColor = (c) => { const s = PM.slug(c); return s === 'interno' ? 'var(--s1)' : s === 'externo' ? 'var(--s2)' : 'var(--fg-3)'; };
  const STAKE_FALLBACK = { clasificacion: ['Interno', 'Externo'], actitud: ['Partidario', 'Neutral', 'Reticente'] };
  const gapInfo = (x) => {
    if (!x.actual || !x.deseado) return { tone: 'outline', text: x.actual || x.deseado ? 'Falta ' + (x.actual ? 'D' : 'C') : 'Sin evaluar', n: null };
    const n = ENG_LEVELS.indexOf(x.deseado) - ENG_LEVELS.indexOf(x.actual);
    if (n === 0) return { tone: 'good', text: 'Sin brecha', n };
    if (n > 0) return { tone: n >= 2 ? 'crit' : 'warn', text: 'Brecha: ' + plural(n, 'nivel', 'niveles'), n };
    return { tone: 'info', text: 'Por encima del deseado (' + -n + ')', n };
  };

  const ANGLES16 = Array.from({ length: 16 }, (_, k) => [Math.cos((k * Math.PI) / 8), Math.sin((k * Math.PI) / 8)]);
  /* Ubica los puntos (dispersa coordenadas idénticas) y sus etiquetas sin colisiones. */
  function layoutStakeholders(list, X, Y, area, obstacles, radScale = 1, labelW = 130) {
    const cw = (area.ix1 - area.ix0) / 5, ch = (area.iy1 - area.iy0) / 5;
    const groups = PM.groupBy(list, (x) => x.poder + '|' + x.interes);
    const pts = [];
    for (const key of Object.keys(groups)) {
      const g = groups[key].slice().sort((a, b) => a.idx - b.idx);
      const n = g.length;
      const rho = n > 1 ? Math.min(Math.min(cw, ch) * 0.3, 8 + n * 4) : 0;
      g.forEach((x, k) => {
        const bx = x.interes === 3 ? X(3) + Math.max(cw * 0.2, rho + 9) : X(x.interes);
        const by = x.poder === 3 ? Y(3) - Math.max(ch * 0.2, rho + 9) : Y(x.poder);
        const ang = -Math.PI / 2 + (2 * Math.PI * k) / Math.max(1, n);
        pts.push({ ...x, cx: bx + rho * Math.cos(ang), cy: by + rho * Math.sin(ang), rad: (5 + (x.influencia || 2) * 2) * radScale });
      });
    }
    pts.sort((a, b) => a.idx - b.idx);
    const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const outside = (a) => Math.max(0, area.x0 - a.x) + Math.max(0, a.x + a.w - area.x1) + Math.max(0, area.y0 - a.y) + Math.max(0, a.y + a.h - area.y1);
    const circ = pts.map((p) => ({ x: p.cx - p.rad - 1, y: p.cy - p.rad - 1, w: 2 * p.rad + 2, h: 2 * p.rad + 2 }));
    /* distancia de un punto al rectángulo de una etiqueta (0 si está dentro) */
    const gap = (rect, q) => Math.hypot(Math.max(rect.x - q.cx, 0, q.cx - (rect.x + rect.w)), Math.max(rect.y - q.cy, 0, q.cy - (rect.y + rect.h))) - q.rad;
    const placed = [...obstacles];
    const order = pts.map((_, k) => k).sort((a, b) => pts[b].rad - pts[a].rad || pts[a].idx - pts[b].idx);
    const labels = new Array(pts.length);
    /* preferencia de dirección: derecha, izquierda, arriba/abajo y por último diagonales */
    const dirCost = (a) => (a === 0 ? 0 : a === 8 ? 1 : a === 4 || a === 12 ? 2 : 3);
    for (const k of order) {
      const p = pts[k];
      /* nombres largos en dos líneas: etiquetas más compactas que no se extienden sobre los puntos vecinos */
      const lines = wrap(p.name, labelW, 11, 600, 2);
      const w = Math.max(...lines.map((l) => tw(l, 11, 600))) + 2, h = 13 * lines.length + 1;
      let best = null;
      for (const dist of [3, 9, 16, 26, 38, 52]) {
        /* 16 direcciones: el borde de la etiqueta más cercano al punto queda a «dist» px de la burbuja */
        const r = p.rad + dist;
        const cands = [];
        ANGLES16.forEach(([c, sn], a) => {
          const ax = p.cx + r * c, ay = p.cy + r * sn;
          const x = ax - w / 2 + (w / 2) * Math.sign(Math.round(c * 1000)), y = ay - h / 2 + (h / 2) * Math.sign(Math.round(sn * 1000));
          cands.push([x, y, a]);
          /* variante desplazada para quedar dentro del área (p. ej. debajo de un punto pegado al borde) */
          const xc = PM.clamp(x, area.x0, Math.max(area.x0, area.x1 - w)), yc = PM.clamp(y, area.y0, Math.max(area.y0, area.y1 - h));
          if (xc !== x || yc !== y) cands.push([xc, yc, a]);
        });
        let levelBest = null;
        for (const [x, y, a] of cands) {
          const rect = { x, y, w, h };
          let cost = outside(rect) * 60 + dirCost(a);
          for (const q of placed) cost += ov(rect, q) * 3;
          circ.forEach((c, j) => { cost += ov(rect, c) * (j === k ? 12 : 2); });
          /* ambigüedad: si otra burbuja queda más cerca de la etiqueta que la propia, se leería como suya */
          const own = gap(rect, p);
          pts.forEach((q, j) => { if (j === k) return; const g = gap(rect, q); if (g < own - 1) cost += 300 + (own - 1 - g) * 30; else if (g < own + 6) cost += 20 + (own + 6 - g) * 6; });
          if (!levelBest || cost < levelBest.cost) levelBest = { ...rect, cost, dist };
        }
        if (!best || levelBest.cost + levelBest.dist < best.cost + best.dist) best = levelBest;
        if (levelBest.cost <= 3) break;
      }
      placed.push(best);
      const lx = PM.clamp(p.cx, best.x, best.x + best.w), ly = PM.clamp(p.cy, best.y, best.y + best.h);
      const dx = lx - p.cx, dy = ly - p.cy, len = Math.hypot(dx, dy) || 1;
      labels[k] = { x: best.x, y: best.y, w: best.w, h: best.h, lines, leader: best.dist > 6 ? { x1: p.cx + (dx / len) * (p.rad + 1), y1: p.cy + (dy / len) * (p.rad + 1), x2: lx, y2: ly } : null };
    }
    return { pts, labels };
  }

  function PowerInterestChart({ items, canWrite, onMove }) {
    const host = useRef();
    const width = useWidth(host, 640);
    const fv = useFontsVersion();
    const tip = PM.useChartTip();
    const svgRef = useRef();
    const [drag, setDrag] = useState(null);
    const W = PM.clamp(width, 300, 820);
    const narrow = W < 560;
    const H = Math.round(narrow ? PM.clamp(W * 1.08, 330, 600) : PM.clamp(W * 0.66, 300, 540));
    const radScale = PM.clamp(W / 640, 0.72, 1);
    const labelW = narrow ? 104 : 136;
    const m = { l: 40, r: 8, t: 6, b: 42 };
    const band = 22;
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const area = { ix0: m.l, ix1: m.l + pw, iy0: m.t + band, iy1: m.t + ph - band, x0: m.l + 2, x1: m.l + pw - 2, y0: m.t + 2, y1: m.t + ph - 2 };
    const X = (v) => area.ix0 + ((v - 0.5) / 5) * (area.ix1 - area.ix0);
    const Y = (v) => area.iy0 + ((5.5 - v) / 5) * (area.iy1 - area.iy0);
    const quads = [
      { id: 'satisfechos', x: X(0.5), y: m.t, w: X(3) - X(0.5), h: Y(3) - m.t, fill: 'var(--surface-2)', lx: X(0.5) + 8, ly: m.t + 15, anchor: 'start' },
      { id: 'cerca', x: X(3), y: m.t, w: X(5.5) - X(3), h: Y(3) - m.t, fill: 'var(--accent-wash)', lx: X(5.5) - 8, ly: m.t + 15, anchor: 'end' },
      { id: 'monitorear', x: X(0.5), y: Y(3), w: X(3) - X(0.5), h: m.t + ph - Y(3), fill: 'var(--surface)', lx: X(0.5) + 8, ly: m.t + ph - 7, anchor: 'start' },
      { id: 'informados', x: X(3), y: Y(3), w: X(5.5) - X(3), h: m.t + ph - Y(3), fill: 'var(--surface-2)', lx: X(5.5) - 8, ly: m.t + ph - 7, anchor: 'end' },
    ];
    const plotted = items.filter((x) => x.poder && x.interes);
    const lay = useMemo(() => {
      const obstacles = quads.map((q) => { const w = tw(QUAD[q.id].label, 11, 600); return { x: q.anchor === 'end' ? q.lx - w : q.lx, y: q.ly - 11, w, h: 14 }; });
      return layoutStakeholders(plotted, X, Y, area, obstacles, radScale, labelW);
    }, [items, W, H, fv]);
    const snapI = (x) => PM.clamp(Math.round(0.5 + ((x - area.ix0) / (area.ix1 - area.ix0)) * 5), 1, 5);
    const snapP = (y) => PM.clamp(Math.round(5.5 - ((y - area.iy0) / (area.iy1 - area.iy0)) * 5), 1, 5);
    const local = (e) => { const r = svgRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e, p) => {
      if (!canWrite || (e.button !== undefined && e.button > 0)) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* sin captura de puntero */ }
      tip.hide();
      const q = local(e);
      setDrag({ idx: p.idx, pid: e.pointerId, ox: q.x - p.cx, oy: q.y - p.cy, sx: p.cx, sy: p.cy, x: p.cx, y: p.cy, moved: false });
    };
    const move = (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const q = local(e);
      const x = PM.clamp(q.x - drag.ox, area.ix0, area.ix1), y = PM.clamp(q.y - drag.oy, area.iy0, area.iy1);
      setDrag((d) => (d ? { ...d, x, y, moved: d.moved || Math.abs(x - d.sx) + Math.abs(y - d.sy) > 3 } : d));
    };
    const up = (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      setDrag(null);
      if (!d.moved) return;
      const p = plotted.find((x) => x.idx === d.idx);
      const ni = snapI(d.x), np = snapP(d.y);
      if (p && (ni !== p.interes || np !== p.poder)) onMove(d.idx, { poder: np, interes: ni });
    };
    const key = (e, p) => {
      if (!canWrite) return;
      const dlt = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }[e.key];
      if (!dlt) return;
      e.preventDefault();
      const np = PM.clamp(p.poder + dlt[0], 1, 5), ni = PM.clamp(p.interes + dlt[1], 1, 5);
      if (np !== p.poder || ni !== p.interes) onMove(p.idx, { poder: np, interes: ni });
    };
    const tipContent = (p) => { const q = QUAD[quadOf(p.poder, p.interes)]; return html`<div class="stack-sm" style="gap:3px"><strong>${p.name}</strong>${p.r.cargo || p.r.organizacion ? html`<div class="faint">${[p.r.cargo, p.r.organizacion].filter(Boolean).join(' · ')}</div>` : null}<div>Poder ${p.poder} · Interés ${p.interes} · Influencia ${p.influencia || '—'}</div><div><strong>${q.label}</strong>: ${q.strategy}</div></div>`; };
    const dragP = drag ? lay.pts.find((x) => x.idx === drag.idx) : null;
    const snap = drag && drag.moved ? { i: snapI(drag.x), p: snapP(drag.y) } : null;
    const usedClasses = new Set(plotted.map((p) => classColor(p.r.clasificacion)));
    return html`<div class="stack-sm">
      <div class="row-between">
        <div class="legend">
          ${usedClasses.has('var(--s1)') ? html`<span class="legend-item"><span class="dot" style="background:var(--s1)"></span>Interno</span>` : null}
          ${usedClasses.has('var(--s2)') ? html`<span class="legend-item"><span class="dot" style="background:var(--s2)"></span>Externo</span>` : null}
          ${usedClasses.has('var(--fg-3)') ? html`<span class="legend-item"><span class="dot" style="background:var(--fg-3)"></span>Sin clasificar</span>` : null}
          <span class="legend-item"><svg width="26" height="14" aria-hidden="true"><circle cx="5" cy="7" r="3.5" fill="none" stroke="var(--fg-3)" /><circle cx="17" cy="7" r="6.5" fill="none" stroke="var(--fg-3)" /></svg>Tamaño: influencia (1–5)</span>
        </div>
        <span class="xsmall faint" aria-live="polite">${snap ? 'Soltar en: poder ' + snap.p + ' · interés ' + snap.i + ' → ' + QUAD[quadOf(snap.p, snap.i)].label : canWrite ? 'Arrastra un punto (o usa las flechas) para cambiar su poder e interés.' : ''}</span>
      </div>
      <div ref=${host} class="matrices-pi-host">
        <div class=${cx('chart matrices-chart', drag && 'matrices-dragging')} ref=${tip.ref}>
          <svg ref=${svgRef} width=${W} height=${H} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Matriz de poder e interés con ' + plural(plotted.length, 'interesado', 'interesados')} data-pi-chart>
            ${quads.map((q) => html`<rect key=${q.id} x=${q.x} y=${q.y} width=${q.w} height=${q.h} style=${'fill:' + q.fill} />`)}
            ${[1, 2, 3, 4, 5].map((v) => html`<g key=${'g' + v}>
              <line class="grid-line" x1=${X(v)} x2=${X(v)} y1=${area.iy0} y2=${area.iy1} />
              <line class="grid-line" x1=${area.ix0} x2=${area.ix1} y1=${Y(v)} y2=${Y(v)} />
              <text x=${X(v)} y=${m.t + ph + 15} text-anchor="middle">${v}</text>
              <text x=${m.l - 8} y=${Y(v) + 4} text-anchor="end">${v}</text>
            </g>`)}
            <rect x=${m.l} y=${m.t} width=${pw} height=${ph} style="fill:none;stroke:var(--line-strong)" />
            <line x1=${X(3)} x2=${X(3)} y1=${m.t} y2=${m.t + ph} style="stroke:var(--fg-3);stroke-width:1.5" />
            <line x1=${m.l} x2=${m.l + pw} y1=${Y(3)} y2=${Y(3)} style="stroke:var(--fg-3);stroke-width:1.5" />
            ${quads.map((q) => html`<text key=${'l' + q.id} x=${q.lx} y=${q.ly} text-anchor=${q.anchor} style="fill:var(--fg-2);font-weight:600">${QUAD[q.id].label}</text>`)}
            <text x=${m.l + pw / 2} y=${H - 6} text-anchor="middle" style="fill:var(--fg-2);font-weight:600">Interés →</text>
            <text transform=${'translate(12,' + (m.t + ph / 2) + ') rotate(-90)'} text-anchor="middle" style="fill:var(--fg-2);font-weight:600">Poder →</text>
            ${snap ? html`<circle cx=${X(snap.i)} cy=${Y(snap.p)} r=${dragP ? dragP.rad + 4 : 12} style="fill:none;stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3" />` : null}
            ${lay.pts.map((p, k) => { const l = lay.labels[k]; if (!l || (drag && drag.idx === p.idx)) return null; return html`<g key=${'lb' + p.idx} pointer-events="none" data-label-for=${p.idx}>
              ${l.leader ? html`<line x1=${l.leader.x1} y1=${l.leader.y1} x2=${l.leader.x2} y2=${l.leader.y2} style="stroke:var(--fg-3);stroke-width:1" />` : null}
              <text y=${l.y + 11} style="fill:var(--fg);font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round">${l.lines.map((ln, j) => html`<tspan key=${j} x=${l.x + 1} dy=${j ? 13 : 0}>${ln}</tspan>`)}</text>
            </g>`; })}
            ${lay.pts.map((p) => {
              const isDrag = drag && drag.idx === p.idx;
              const cxp = isDrag ? drag.x : p.cx, cyp = isDrag ? drag.y : p.cy;
              const q = QUAD[quadOf(p.poder, p.interes)];
              return html`<g key=${'d' + p.idx} class=${cx('matrices-dot', !canWrite && 'is-ro')} tabindex="0" role=${canWrite ? 'button' : 'img'} data-stake=${p.idx}
                aria-label=${p.name + ': poder ' + p.poder + ', interés ' + p.interes + ', influencia ' + (p.influencia || 'sin evaluar') + '. ' + q.label + '.' + (canWrite ? ' Usa las flechas para moverlo.' : '')}
                onPointerDown=${(e) => down(e, p)} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${() => setDrag(null)}
                onKeyDown=${(e) => key(e, p)}
                onMouseMove=${(e) => { if (!drag) tip.show(e, tipContent(p)); }} onMouseLeave=${tip.hide}>
                <circle cx=${cxp} cy=${cyp} r=${p.rad + 6} style="fill:transparent" />
                <circle class="matrices-dot-ring" cx=${cxp} cy=${cyp} r=${p.rad + 3} style="fill:none" />
                <circle cx=${cxp} cy=${cyp} r=${p.rad} style=${'fill:' + classColor(p.r.clasificacion) + ';fill-opacity:0.9;stroke:var(--surface);stroke-width:2'} />
                ${isDrag ? html`<text x=${cxp + p.rad + 5} y=${cyp + 4} style="fill:var(--fg);font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px">${clip(p.name, narrow ? 22 : 30)}</text>` : null}
              </g>`;
            })}
          </svg>
          ${tip.node}
        </div>
      </div>
      <div class="xsmall faint">Umbral en 3: los valores de 3 a 5 cuentan como altos, por eso un punto con valor 3 se dibuja junto a la línea divisoria, del lado alto. Los interesados con la misma posición se separan levemente para que se vean todos.</div>
    </div>`;
  }

  function StakeholderFormModal({ close, onSave }) {
    const opts = { clasificacion: optionsOf('registro-interesados', 'interesados', 'clasificacion', STAKE_FALLBACK.clasificacion), actitud: optionsOf('registro-interesados', 'interesados', 'actitud', STAKE_FALLBACK.actitud), nivel: optionsOf('registro-interesados', 'interesados', 'nivelActual', ENG_LEVELS) };
    const [f, setF] = useState({ nombre: '', cargo: '', organizacion: '', rol: '', contacto: '', clasificacion: '', poder: null, interes: null, influencia: null, actitud: '', nivelActual: '', nivelDeseado: '' });
    const [touched, setTouched] = useState(false);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const err = !f.nombre.trim() ? 'Escribe el nombre del interesado (persona, cargo u organización).' : null;
    const submit = (e) => { if (e) e.preventDefault(); setTouched(true); if (err) return; if (onSave({ id: PM.uid('r'), ...f, nombre: f.nombre.trim(), requisitos: '', expectativas: '' }) === false) return; close(); };
    const sc = (k) => html`<${ui.Select} id=${'mx-s-' + k} value=${f[k] ? String(f[k]) : ''} onValue=${(v) => set(k)(v ? Number(v) : null)} placeholder="Sin evaluar" options=${[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: n + (n === 1 ? ' · Muy bajo' : n === 5 ? ' · Muy alto' : n === 3 ? ' · Medio' : n === 2 ? ' · Bajo' : ' · Alto') }))} />`;
    return html`<${ui.Modal} title="Agregar interesado" subtitle="Se agrega al registro de interesados. Completa los demás datos en el registro." size="wide" onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" onClick=${submit}>Agregar interesado</${ui.Button}>`}>
      <form class="matrices-form-grid" onSubmit=${submit}>
        <${ui.Field} label="Nombre" required for="mx-s-nombre" error=${touched && err} class="span-all" hint="En el proyecto de ejemplo se usan roles en lugar de nombres de personas."><${ui.Input} id="mx-s-nombre" value=${f.nombre} onValue=${set('nombre')} autoFocus /></${ui.Field}>
        <${ui.Field} label="Cargo" for="mx-s-cargo"><${ui.Input} id="mx-s-cargo" value=${f.cargo} onValue=${set('cargo')} /></${ui.Field}>
        <${ui.Field} label="Organización" for="mx-s-org"><${ui.Input} id="mx-s-org" value=${f.organizacion} onValue=${set('organizacion')} /></${ui.Field}>
        <${ui.Field} label="Rol en el proyecto" for="mx-s-rol"><${ui.Input} id="mx-s-rol" value=${f.rol} onValue=${set('rol')} /></${ui.Field}>
        <${ui.Field} label="Clasificación" for="mx-s-clas"><${ui.Select} id="mx-s-clas" value=${f.clasificacion} onValue=${set('clasificacion')} placeholder="Sin clasificar" options=${opts.clasificacion} /></${ui.Field}>
        <${ui.Field} label="Poder (1–5)" for="mx-s-poder">${sc('poder')}</${ui.Field}>
        <${ui.Field} label="Interés (1–5)" for="mx-s-interes">${sc('interes')}</${ui.Field}>
        <${ui.Field} label="Influencia (1–5)" for="mx-s-influencia">${sc('influencia')}</${ui.Field}>
        <${ui.Field} label="Actitud" for="mx-s-act"><${ui.Select} id="mx-s-act" value=${f.actitud} onValue=${set('actitud')} placeholder="Sin definir" options=${opts.actitud} /></${ui.Field}>
        <${ui.Field} label="Nivel de involucramiento actual (C)" for="mx-s-na"><${ui.Select} id="mx-s-na" value=${f.nivelActual} onValue=${set('nivelActual')} placeholder="Sin evaluar" options=${opts.nivel} /></${ui.Field}>
        <${ui.Field} label="Nivel de involucramiento deseado (D)" for="mx-s-nd"><${ui.Select} id="mx-s-nd" value=${f.nivelDeseado} onValue=${set('nivelDeseado')} placeholder="Sin evaluar" options=${opts.nivel} /></${ui.Field}>
        <${ui.Field} label="Contacto" for="mx-s-contacto" class="span-all"><${ui.Input} id="mx-s-contacto" value=${f.contacto} onValue=${set('contacto')} placeholder="Correo o teléfono" /></${ui.Field}>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  const Mark = ({ k, decorative }) => html`<span class=${'matrices-mark matrices-mark-' + k.toLowerCase()} title=${decorative ? undefined : k === 'C' ? 'Nivel actual' : 'Nivel deseado'} aria-hidden=${decorative ? 'true' : undefined}>${k}</span>`;

  function StakeholderView({ project, params }) {
    const canWrite = PM.useCanWrite();
    const [rows, saveRows, meta] = PM.useDocTable('registro-interesados', 'interesados');
    const lock = useRegisterLock('registro-interesados', meta);
    const editable = canWrite && !lock.locked;
    const latest = useRef(null);
    latest.current = { rows, saveRows };
    const [tab, setTabRaw] = useState(() => (params && ['poder', 'involucramiento'].includes(params.tab) ? params.tab : prefTab('matrices.stakeTab', ['poder', 'involucramiento'], 'poder')));
    const setTab = (v) => { setTabRaw(v); PM.prefs.set('matrices.stakeTab', v); };
    useEffect(() => { if (params && ['poder', 'involucramiento'].includes(params.tab)) setTabRaw(params.tab); }, [params && params.tab]);
    const [onlyGaps, setOnlyGaps] = useState(false);
    const pop = usePopover();
    /* si el registro queda bloqueado (otra pestaña lo aprueba), se cierra el selector de nivel abierto */
    useEffect(() => { if (lock.locked) pop.close(); }, [lock.locked]);
    const items = useMemo(() => rows.map((r, idx) => ({ r, idx, name: stakeName(r, idx), poder: scale15(r.poder), interes: scale15(r.interes), influencia: scale15(r.influencia), actual: normLevel(r.nivelActual), deseado: normLevel(r.nivelDeseado) })), [rows]);
    const patchRow = (idx, patch) => { if (lock.isLocked()) return; const cur = latest.current; const next = cur.rows.map((r, j) => (j === idx ? { ...r, ...patch } : r)); cur.rows = next; cur.saveRows(next); };
    const openAdd = () => PM.openModal((close) => html`<${StakeholderFormModal} close=${close} onSave=${(row) => { if (lock.isLocked()) { PM.toast(LOCKED_SAVE_MSG('registro de interesados'), { tone: 'crit' }); return false; } const cur = latest.current; cur.saveRows([...cur.rows, row]); PM.toast('«' + row.nombre + '» agregado al registro de interesados.'); }} />`);
    const header = html`<${ui.PageHeader} eyebrow="13.1 Identificar a los interesados · 13.2 Planificar el involucramiento de los interesados" title="Matrices de interesados"
      description="Clasifica a los interesados por poder e interés para definir cómo gestionarlos, y compara su nivel de involucramiento actual (C) con el deseado (D)."
      actions=${html`<${ui.Button} icon="file" onClick=${() => openRegister('registro-interesados')}>Abrir registro completo</${ui.Button}>${editable ? html`<${ui.Button} variant="primary" icon="plus" onClick=${openAdd}>Agregar interesado</${ui.Button}>` : null}`} />`;
    const lockNote = html`<${RegisterLockNote} lock=${lock} register="registro de interesados" what="cambiar el poder, el interés, la influencia o el involucramiento, o agregar interesados" />`;
    if (meta.loading) return html`<div class="page">${header}<${ui.Loading} rows=${6} /></div>`;
    if (!rows.length) {
      return html`<div class="page">${header}${lockNote}<${ui.Empty} icon="stakeholders" title="Aún no hay interesados registrados" actions=${html`${editable ? html`<${ui.Button} variant="primary" icon="plus" onClick=${openAdd}>Agregar interesado</${ui.Button}>` : null}<${ui.Button} icon="file" onClick=${() => openRegister('registro-interesados')}>Abrir registro de interesados</${ui.Button}>`}>
        Registra a las personas, cargos u organizaciones que afectan o se ven afectados por el proyecto, con su poder, interés y nivel de involucramiento. Aquí verás la matriz de poder e interés y la matriz de evaluación del involucramiento.
      </${ui.Empty}></div>`;
    }
    const plotted = items.filter((x) => x.poder && x.interes);
    const pending = items.filter((x) => !x.poder || !x.interes);
    const byQuad = PM.groupBy(plotted, (x) => quadOf(x.poder, x.interes));
    const gaps = items.map((x) => ({ x, g: gapInfo(x) }));
    const withGap = gaps.filter((y) => y.g.n !== null && y.g.n !== 0).sort((a, b) => Math.abs(b.g.n) - Math.abs(a.g.n) || a.x.idx - b.x.idx);
    const notAssessed = gaps.filter((y) => y.g.n === null).length;
    const engRows = onlyGaps ? withGap : gaps;

    const renderPop = () => {
      const s = pop.state;
      if (!s) return null;
      const x = items.find((it) => it.idx === s.data.idx);
      if (!x) return null;
      const lvl = s.data.level;
      const isC = x.actual === lvl, isD = x.deseado === lvl;
      return html`<${Popover} anchor=${s.anchor} onClose=${pop.close} label=${'Involucramiento de ' + x.name + ': ' + lvl}>
        <div class="matrices-pop-title"><div class="xsmall faint truncate">${x.name}</div><div class="h4">${lvl}</div><div class="xsmall muted">${ENG_DESC[lvl]}</div></div>
        <div class="matrices-pop-opts">
          <button type="button" class="matrices-opt" aria-pressed=${isC ? 'true' : 'false'} onClick=${() => { patchRow(x.idx, { nivelActual: isC ? '' : lvl }); pop.close(true); }}><${Mark} k="C" decorative /><span>${isC ? 'Quitar como nivel actual' : 'Marcar como nivel actual'}</span></button>
          <button type="button" class="matrices-opt" aria-pressed=${isD ? 'true' : 'false'} onClick=${() => { patchRow(x.idx, { nivelDeseado: isD ? '' : lvl }); pop.close(true); }}><${Mark} k="D" decorative /><span>${isD ? 'Quitar como nivel deseado' : 'Marcar como nivel deseado'}</span></button>
        </div>
        <div class="xsmall faint matrices-pop-hint">Atajo: sobre la celda escribe C o D.</div>
      </${Popover}>`;
    };

    const powerTab = html`<div class="stack-lg">
      ${plotted.length ? html`<${PowerInterestChart} items=${items} canWrite=${editable} onMove=${(idx, patch) => patchRow(idx, patch)} />` : html`<${Note}>Ningún interesado tiene poder e interés evaluados todavía. Asígnalos en la tabla de abajo para ubicarlos en la matriz.</${Note}>`}
      ${pending.length ? html`<section class="section"><div class="section-head"><h2 class="h3">Interesados sin evaluar</h2><span class="xsmall faint">Asigna poder e interés (1–5) para ubicarlos en la matriz</span></div>
        <div class="table-wrap"><table class="table" data-stake-pending><thead><tr><th>Interesado</th><th>Cargo / organización</th><th>Poder</th><th>Interés</th><th>Influencia</th></tr></thead><tbody>
          ${pending.map((x) => html`<tr key=${x.idx}><td style="min-width:160px">${x.name}</td><td class="small muted" style="min-width:160px">${[x.r.cargo, x.r.organizacion].filter(Boolean).join(' · ') || '—'}</td>
            ${['poder', 'interes', 'influencia'].map((k) => html`<td key=${k}>${editable ? html`<select class="cell-input matrices-scale" aria-label=${(k === 'interes' ? 'Interés' : k[0].toUpperCase() + k.slice(1)) + ' de ' + x.name} value=${x[k] ? String(x[k]) : ''} onChange=${(e) => patchRow(x.idx, { [k]: e.currentTarget.value ? Number(e.currentTarget.value) : null })}><option value="">Sin evaluar</option>${[1, 2, 3, 4, 5].map((n) => html`<option key=${n} value=${String(n)}>${n}</option>`)}</select>` : html`<span class="mono">${x[k] || '—'}</span>`}</td>`)}
          </tr>`)}
        </tbody></table></div></section>` : null}
      <section class="section"><div class="section-head"><h2 class="h3">Estrategia por cuadrante</h2><span class="xsmall faint">Úsala como base del plan de involucramiento de los interesados</span></div>
        <div class="matrices-quads">${QUADS.map((q) => { const list = (byQuad[q.id] || []).slice().sort((a, b) => (b.influencia || 0) - (a.influencia || 0) || a.name.localeCompare(b.name, 'es')); return html`<div key=${q.id} class=${cx('matrices-quad', q.id === 'cerca' && 'is-key')} data-quad=${q.id}>
          <div class="row-between"><div><div class="h4">${q.label}</div><div class="xsmall faint">${q.sub}</div></div><span class="chip">${list.length}</span></div>
          <p class="small muted">${q.strategy}</p>
          ${list.length ? html`<ul class="matrices-quad-list">${list.map((x) => html`<li key=${x.idx}><span class="truncate" title=${x.name}>${x.name}${x.r.cargo && x.r.nombre ? html`<span class="xsmall faint"> · ${x.r.cargo}</span>` : null}</span><span class="xsmall mono faint nowrap">P${x.poder} · I${x.interes}</span></li>`)}</ul>` : html`<div class="xsmall faint">Ningún interesado en este cuadrante.</div>`}
        </div>`; })}</div>
      </section>
    </div>`;

    const engTab = html`<div class="stack-lg">
      <div class="row-between">
        <div class="legend"><span class="legend-item"><${Mark} k="C" />Nivel actual</span><span class="legend-item"><${Mark} k="D" />Nivel deseado</span><span class="legend-item"><span class="swatch matrices-eng-path" style="width:18px;height:12px;border:1px solid var(--line)"></span>Camino por recorrer</span></div>
        <${ui.Check} checked=${onlyGaps} onValue=${setOnlyGaps} label=${'Solo interesados con brecha (' + withGap.length + ')'} />
      </div>
      <div class="table-wrap"><table class="table matrices-eng" data-eng-table>
        <thead><tr><th>Interesado</th>${ENG_LEVELS.map((l) => html`<th key=${l} style="text-align:center" title=${ENG_DESC[l]}>${l}</th>`)}<th>Brecha</th></tr></thead>
        <tbody>
          ${engRows.length ? engRows.map(({ x, g }) => {
            const ia = ENG_LEVELS.indexOf(x.actual), id = ENG_LEVELS.indexOf(x.deseado);
            const lo = ia >= 0 && id >= 0 ? Math.min(ia, id) : -1, hi = ia >= 0 && id >= 0 ? Math.max(ia, id) : -1;
            return html`<tr key=${x.idx} data-eng-row=${x.idx}>
              <td style="min-width:170px"><div>${x.name}</div>${x.r.cargo && x.r.nombre ? html`<div class="xsmall faint">${x.r.cargo}</div>` : null}</td>
              ${ENG_LEVELS.map((l, li) => {
                const marks = html`${x.actual === l ? html`<${Mark} k="C" />` : null}${x.deseado === l ? html`<${Mark} k="D" />` : null}`;
                const label = x.name + ', ' + l + ': ' + (x.actual === l && x.deseado === l ? 'nivel actual y deseado' : x.actual === l ? 'nivel actual' : x.deseado === l ? 'nivel deseado' : 'sin marca');
                return html`<td key=${l} class=${cx('matrices-eng-td', lo >= 0 && hi > lo && li >= lo && li <= hi && 'matrices-eng-path')}>
                  ${editable ? html`<button type="button" class="matrices-eng-cell" aria-haspopup="dialog" aria-label=${label} data-eng=${x.idx + ':' + li}
                    onClick=${(e) => pop.open(e.currentTarget, { idx: x.idx, level: l })}
                    onKeyDown=${(e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toUpperCase(); if (k === 'C') { e.preventDefault(); patchRow(x.idx, { nivelActual: x.actual === l ? '' : l }); } else if (k === 'D') { e.preventDefault(); patchRow(x.idx, { nivelDeseado: x.deseado === l ? '' : l }); } }}>${marks}</button>`
                    : html`<span class="matrices-eng-static" aria-label=${label}>${marks}</span>`}
                </td>`;
              })}
              <td class="nowrap" style="vertical-align:middle"><${ui.Chip} tone=${g.tone}>${g.text}</${ui.Chip}></td>
            </tr>`;
          }) : html`<tr><td colspan="7" class="faint" style="padding:14px 12px">Ningún interesado tiene brecha entre el nivel actual y el deseado.</td></tr>`}
        </tbody>
      </table></div>
      <div class="grid cols-2">
        <${ui.Card} title="Interesados con brecha" subtitle="Niveles que hay que recorrer para llegar al involucramiento deseado">
          ${withGap.length ? html`<ul class="matrices-flags" data-gap-list>${withGap.map(({ x, g }) => html`<li key=${x.idx}><${ui.Chip} tone=${g.tone}>${g.n > 0 ? '+' + g.n : g.n}</${ui.Chip}><strong>${x.name}</strong><span class="muted">${x.actual} → ${x.deseado}</span></li>`)}</ul>`
            : html`<p class="small muted">${notAssessed === items.length ? 'Marca el nivel actual (C) y el deseado (D) de cada interesado para calcular las brechas.' : 'Ningún interesado evaluado tiene brecha.'}</p>`}
          ${notAssessed && notAssessed < items.length ? html`<p class="xsmall faint" style="margin-top:8px">${plural(notAssessed, 'interesado sin', 'interesados sin')} evaluación completa de C y D.</p>` : null}
        </${ui.Card}>
        <${ui.Card} title="Niveles de involucramiento (PMBOK 13.2)">
          <dl class="stack-sm" style="margin:0">${ENG_LEVELS.map((l) => html`<div key=${l} class="small"><dt style="display:inline;font-weight:600">${l}: </dt><dd style="display:inline;margin:0" class="muted">${ENG_DESC[l]}</dd></div>`)}</dl>
        </${ui.Card}>
      </div>
    </div>`;

    return html`<div class="page">${header}${lockNote}
      <${ui.Tabs} value=${tab} onChange=${setTab} tabs=${[{ id: 'poder', label: 'Poder e interés', icon: 'stakeholders', count: plotted.length }, { id: 'involucramiento', label: 'Evaluación del involucramiento', icon: 'table', count: withGap.length ? withGap.length + ' con brecha' : undefined }]} />
      ${tab === 'poder' ? powerTab : engTab}
      ${renderPop()}
    </div>`;
  }

  /* ================================================================== 4. HERRAMIENTAS DE CALIDAD */
  const SIX_M = ['Mano de obra', 'Método', 'Maquinaria', 'Materiales', 'Medición', 'Medio ambiente'];
  const FISH = { K: 0.42, gap0: 18, gapC: 10, labelGap: 8, margin: 18, colGap: 20, minBone: 70, minCol: 120, causeSize: 12, subSize: 11, catSize: 12.5, effSize: 13.5, causeLH: 15, subLH: 14, causeW: 180, subW: 165, catW: 150, effW: 170 };

  /* Diagrama de espina de pescado: espina horizontal hacia el efecto (cabeza, a la derecha), categorías alternadas
     arriba/abajo en diagonal, causas como líneas horizontales con su texto pegado a la espina y subcausas debajo.
     Las columnas se separan según el ancho real de los textos, así que nada se superpone. */
  function fishLayout(d) {
    const F = FISH;
    const cats = d.categories || [];
    const bones = cats.map((c, ci) => {
      const causes = (c.causes || []).map((ca) => {
        const has = !!String(ca.text || '').trim();
        const lines = wrap(has ? ca.text : 'Causa sin describir', F.causeW, F.causeSize, 500);
        const subs = (ca.sub || []).map((s) => { const hs = !!String(s.text || '').trim(); return { lines: wrap('• ' + (hs ? s.text : 'Subcausa sin describir'), F.subW, F.subSize, 400), empty: !hs }; });
        const above = lines.length * F.causeLH + 3;
        const below = subs.reduce((t, s) => t + s.lines.length * F.subLH, 0) + (subs.length ? 5 : 0);
        return { lines, subs, above, below, empty: !has };
      });
      const stack = causes.reduce((t, x) => t + x.above + x.below, 0) + Math.max(0, causes.length - 1) * F.gapC;
      const catLines = wrap(String(c.name || '').trim() || 'Categoría sin nombre', F.catW, F.catSize, 700);
      const catBoxW = Math.max(64, ...catLines.map((l) => tw(l, F.catSize, 700))) + 18;
      const catBoxH = catLines.length * 16 + 10;
      return { top: ci % 2 === 0, causes, stack, catLines, catBoxW, catBoxH };
    });
    const tops = bones.filter((b) => b.top), bots = bones.filter((b) => !b.top);
    const boneLen = (list) => (list.length ? Math.max(F.minBone, ...list.map((b) => F.gap0 + b.stack + F.labelGap)) : 0);
    const Ltop = boneLen(tops), Lbot = boneLen(bots);
    const catHTop = Math.max(0, ...tops.map((b) => b.catBoxH)), catHBot = Math.max(0, ...bots.map((b) => b.catBoxH));
    const effHas = !!String(d.effect || '').trim();
    const effLines = wrap(effHas ? d.effect : 'Describe el efecto o problema', F.effW, F.effSize, 700);
    const effBoxW = Math.max(110, ...effLines.map((l) => tw(l, F.effSize, 700))) + 26;
    const effBoxH = effLines.length * 18 + 34;
    const topH = Math.max(Ltop + catHTop, effBoxH / 2 + 4, 40);
    const botH = Math.max(Lbot + catHBot, effBoxH / 2 + 4, 40);
    const y0 = F.margin + topH;
    const H = Math.ceil(y0 + botH + F.margin);
    const place = (b) => {
      const L = b.top ? Ltop : Lbot, sgn = b.top ? -1 : 1;
      const items = [];
      let minX = -L * F.K - b.catBoxW / 2, reqW = 0;
      const boneX = (dd) => -dd * F.K;
      const dist = (y) => Math.abs(y - y0);
      /* separación necesaria respecto a la espina de la columna anterior para un elemento cuyo borde izquierdo es xl a la altura dNear */
      const need = (xl, dNear) => { reqW = Math.max(reqW, -xl - dNear * F.K); minX = Math.min(minX, xl); };
      const text = (txt, yb, size, weight, fill) => {
        const ya = yb - size, yz = yb + 3;
        const right = boneX(Math.max(dist(ya), dist(yz))) - 6;
        const w = tw(txt, size, weight);
        items.push({ t: 'text', x: right, y: yb, txt, size, weight, fill });
        need(right - w, Math.min(dist(ya), dist(yz)));
        return right - w;
      };
      let cursor = b.top ? y0 - F.gap0 - b.stack : y0 + F.gap0;
      for (const ca of b.causes) {
        const yLine = cursor + ca.above;
        let left = 0;
        ca.lines.forEach((ln, k) => { left = Math.min(left, text(ln, cursor + (k + 1) * F.causeLH - 2, F.causeSize, 500, ca.empty ? 'var(--fg-3)' : 'var(--fg)')); });
        let ys = yLine + 4;
        for (const s of ca.subs) for (const ln of s.lines) { text(ln, ys + F.subLH - 3, F.subSize, 400, s.empty ? 'var(--fg-3)' : 'var(--fg-2)'); ys += F.subLH; }
        items.push({ t: 'tick', x1: boneX(dist(yLine)), y1: yLine, x2: left - 4, y2: yLine });
        need(left - 4, dist(yLine));
        cursor += ca.above + ca.below + F.gapC;
      }
      const ex = boneX(L), ey = y0 + sgn * L;
      items.push({ t: 'bone', x1: 0, y1: y0, x2: ex, y2: ey });
      items.push({ t: 'cat', x: ex - b.catBoxW / 2, y: b.top ? ey - b.catBoxH : ey, w: b.catBoxW, h: b.catBoxH, lines: b.catLines });
      return { items, minX, reqW };
    };
    const cols = [];
    for (let k = 0; k < Math.ceil(bones.length / 2); k++) {
      const t = bones[2 * k], b = bones[2 * k + 1];
      const pt = t ? place(t) : null, pb = b ? place(b) : null;
      cols.push({ t, b, pt, pb, minX: Math.min(pt ? pt.minX : 0, pb ? pb.minX : 0), reqW: Math.max(pt ? pt.reqW : 0, pb ? pb.reqW : 0) });
    }
    const xs = [];
    cols.forEach((c, k) => {
      if (k === 0) { xs.push(F.margin - c.minX); return; }
      const p = cols[k - 1];
      const lab = Math.max(((p.t ? p.t.catBoxW : 0) + (c.t ? c.t.catBoxW : 0)) / 2, ((p.b ? p.b.catBoxW : 0) + (c.b ? c.b.catBoxW : 0)) / 2) + F.colGap;
      xs.push(xs[k - 1] + Math.max(c.reqW + F.colGap, lab, F.minCol));
    });
    const items = [];
    cols.forEach((c, k) => { for (const part of [c.pt, c.pb]) if (part) for (const it of part.items) items.push(it.t === 'text' || it.t === 'cat' ? { ...it, x: it.x + xs[k] } : { ...it, x1: it.x1 + xs[k], x2: it.x2 + xs[k] }); });
    const spineEnd = (xs.length ? xs[xs.length - 1] : F.margin + 80) + 44;
    const W = Math.ceil(spineEnd + effBoxW + F.margin);
    return { W, H, y0, spineStart: F.margin, spineEnd, items, eff: { x: spineEnd, y: y0 - effBoxH / 2, w: effBoxW, h: effBoxH, lines: effLines, empty: !effHas } };
  }

  function Fishbone({ diagram, svgRef }) {
    const fv = useFontsVersion();
    const host = useRef();
    const avail = useWidth(host, 4000);
    const L = useMemo(() => fishLayout(diagram), [diagram, fv]);
    const F = FISH;
    return html`<div ref=${host} class="stack-sm" style="min-width:0">${L.W > avail + 2 ? html`<div class="xsmall faint">El diagrama es más ancho que la pantalla: desplázalo horizontalmente para verlo completo.</div>` : null}<div class="chart matrices-fish" data-fishbone>
      <svg ref=${svgRef} width=${L.W} height=${L.H} viewBox=${'0 0 ' + L.W + ' ' + L.H} role="img" aria-label=${'Diagrama de causa y efecto: ' + (diagram.effect || diagram.name || '')}>
        <title>${(diagram.name || 'Diagrama de Ishikawa') + (diagram.effect ? ' — Efecto: ' + diagram.effect : '')}</title>
        <line x1=${L.spineStart} y1=${L.y0} x2=${L.spineEnd - 9} y2=${L.y0} style="stroke:var(--fg);stroke-width:3" />
        <polygon points=${L.spineEnd + ',' + L.y0 + ' ' + (L.spineEnd - 12) + ',' + (L.y0 - 7) + ' ' + (L.spineEnd - 12) + ',' + (L.y0 + 7)} style="fill:var(--fg)" />
        ${L.items.filter((it) => it.t === 'bone').map((it, k) => html`<line key=${'b' + k} data-bone="1" x1=${it.x1} y1=${it.y1} x2=${it.x2} y2=${it.y2} style="stroke:var(--fg-2);stroke-width:2" />`)}
        ${L.items.filter((it) => it.t === 'tick').map((it, k) => html`<line key=${'t' + k} x1=${it.x1} y1=${it.y1} x2=${it.x2} y2=${it.y2} style="stroke:var(--line-strong);stroke-width:1.25" />`)}
        ${L.items.filter((it) => it.t === 'text').map((it, k) => html`<text key=${'x' + k} x=${it.x} y=${it.y} text-anchor="end" style=${'fill:' + it.fill + ';font-size:' + it.size + 'px;font-weight:' + it.weight}>${it.txt}</text>`)}
        ${L.items.filter((it) => it.t === 'cat').map((it, k) => html`<g key=${'c' + k}>
          <rect x=${it.x} y=${it.y} width=${it.w} height=${it.h} rx="3" style="fill:var(--accent-wash);stroke:var(--accent);stroke-width:1.25" />
          ${it.lines.map((ln, j) => html`<text key=${j} x=${it.x + it.w / 2} y=${it.y + 5 + (j + 1) * 16 - 4} text-anchor="middle" style=${'fill:var(--fg);font-weight:700;font-size:' + F.catSize + 'px'}>${ln}</text>`)}
        </g>`)}
        <rect x=${L.eff.x} y=${L.eff.y} width=${L.eff.w} height=${L.eff.h} rx="4" style="fill:var(--surface-2);stroke:var(--fg);stroke-width:2" />
        <text x=${L.eff.x + 13} y=${L.eff.y + 17} style="fill:var(--fg-3);font-size:10px;font-weight:600;letter-spacing:0.08em">EFECTO</text>
        ${L.eff.lines.map((ln, j) => html`<text key=${'e' + j} x=${L.eff.x + 13} y=${L.eff.y + 34 + j * 18} style=${'fill:' + (L.eff.empty ? 'var(--fg-3)' : 'var(--fg)') + ';font-weight:700;font-size:' + F.effSize + 'px'}>${ln}</text>`)}
      </svg>
    </div></div>`;
  }

  const MiniBtn = ({ icon, label, onClick, disabled }) => html`<${ui.IconButton} size="sm" icon=${icon} label=${label} disabled=${disabled} onClick=${onClick} />`;

  function IshikawaPanel({ list, saveQ, canWrite, project }) {
    const [selId, setSelId] = useState(() => PM.prefs.get('matrices.ishSel', null));
    const cur = list.find((d) => d.id === selId) || list[0] || null;
    const svgRef = useRef();
    const focusNext = useRef(null);
    useLayoutEffect(() => { const id = focusNext.current; if (!id) return; const el = document.querySelector('[data-mx-focus="' + id + '"]'); if (el) { focusNext.current = null; el.focus(); } });
    const select = (id) => { setSelId(id); PM.prefs.set('matrices.ishSel', id); };
    const updCur = (fn) => { if (!cur) return; const id = cur.id; saveQ(({ ishikawa }) => ({ ishikawa: ishikawa.map((d) => (d.id === id ? fn(d) : d)) })); };
    const setCats = (fn) => updCur((d) => ({ ...d, categories: fn(d.categories || []) }));
    const setCauses = (catId, fn) => setCats((cs) => cs.map((c) => (c.id === catId ? { ...c, causes: fn(c.causes || []) } : c)));
    const setSubs = (catId, causeId, fn) => setCauses(catId, (xs) => xs.map((x) => (x.id === causeId ? { ...x, sub: fn(x.sub || []) } : x)));
    const create = async () => {
      const name = await PM.promptText({ title: 'Nuevo diagrama de Ishikawa', label: 'Nombre del diagrama', value: 'Análisis de causa raíz ' + (list.length + 1), confirmText: 'Crear diagrama' });
      if (!name) return;
      const d = { id: PM.uid('ish'), name, effect: '', categories: SIX_M.map((n) => ({ id: PM.uid('cat'), name: n, causes: [] })) };
      saveQ(({ ishikawa }) => ({ ishikawa: [...ishikawa, d] }));
      select(d.id);
      focusNext.current = 'effect';
    };
    const rename = async () => { const name = await PM.promptText({ title: 'Renombrar diagrama', label: 'Nombre del diagrama', value: cur.name, confirmText: 'Guardar nombre' }); if (name && name !== cur.name) updCur((d) => ({ ...d, name })); };
    const remove = async () => {
      const ok = await PM.confirm({ title: 'Eliminar diagrama', body: 'Se eliminará «' + cur.name + '» con todas sus causas. Esta acción no se puede deshacer.', confirmText: 'Eliminar diagrama', tone: 'danger' });
      if (!ok) return;
      const id = cur.id;
      saveQ(({ ishikawa }) => ({ ishikawa: ishikawa.filter((d) => d.id !== id) }));
      PM.toast('Diagrama eliminado.');
    };
    const delCat = async (c) => {
      const n = (c.causes || []).length;
      if (n) { const ok = await PM.confirm({ title: 'Eliminar categoría', body: 'Se eliminará la categoría «' + (c.name || 'sin nombre') + '» con ' + plural(n, 'causa', 'causas') + '.', confirmText: 'Eliminar categoría', tone: 'danger' }); if (!ok) return; }
      setCats((cs) => cs.filter((x) => x.id !== c.id));
    };
    const delCause = async (c, x) => {
      const n = (x.sub || []).length;
      if (n) { const ok = await PM.confirm({ title: 'Eliminar causa', body: 'Se eliminará la causa «' + (x.text || 'sin texto') + '» con ' + plural(n, 'subcausa', 'subcausas') + '.', confirmText: 'Eliminar causa', tone: 'danger' }); if (!ok) return; }
      setCauses(c.id, (xs) => xs.filter((y) => y.id !== x.id));
    };
    if (!list.length) {
      return html`<${ui.Empty} icon="quality" title="Aún no hay diagramas de causa y efecto" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${create}>Crear diagrama de Ishikawa</${ui.Button}>` : null}>
        El diagrama de Ishikawa (espina de pescado) organiza las posibles causas de un problema de calidad por categorías, como las 6M: mano de obra, método, maquinaria, materiales, medición y medio ambiente.
      </${ui.Empty}>`;
    }
    const cats = cur.categories || [];
    return html`<div class="stack-lg">
      <div class="matrices-picker">
        <${ui.Select} aria-label="Diagrama de Ishikawa" value=${cur.id} onValue=${select} options=${list.map((d) => ({ value: d.id, label: d.name || 'Diagrama sin nombre' }))} />
        ${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${create}>Nuevo diagrama</${ui.Button}>
          <${ui.Dropdown} label="Opciones del diagrama" items=${[{ label: 'Renombrar', icon: 'edit', onClick: rename }, { label: 'Eliminar diagrama', icon: 'trash', danger: true, onClick: remove }]} />` : null}
        <div class="spacer"></div>
        <${SvgDownloadBtn} getSvg=${() => svgRef.current} filename=${fileBase(project, 'ishikawa-' + (PM.slug(cur.name) || 'diagrama')) + '.svg'} />
      </div>
      <${ui.Field} label="Efecto (problema que se analiza)" for="mx-ish-effect" hint="Escríbelo como un resultado medible, p. ej. «Montaje del nivel 6–10 con 4 días de retraso».">
        ${canWrite ? html`<${ui.TextArea} id="mx-ish-effect" data-mx-focus="effect" rows=${2} value=${cur.effect || ''} onValue=${(v) => updCur((d) => ({ ...d, effect: v }))} placeholder="Describe el efecto o problema" />` : html`<div class="small">${cur.effect || html`<span class="faint">Sin efecto definido.</span>`}</div>`}
      </${ui.Field}>
      <${Fishbone} diagram=${cur} svgRef=${svgRef} />
      <section class="section">
        <div class="section-head"><h2 class="h3">Categorías y causas</h2>${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${() => { const id = PM.uid('cat'); setCats((cs) => [...cs, { id, name: '', causes: [] }]); focusNext.current = id; }}>Agregar categoría</${ui.Button}>` : null}</div>
        ${!cats.length ? html`<${Note}>El diagrama no tiene categorías. ${canWrite ? 'Agrega una para empezar a registrar causas.' : ''}</${Note}>` : null}
        <div class="matrices-cat-grid">${cats.map((c, ci) => html`<div key=${c.id} class="matrices-cat" data-cat=${c.id}>
          <div class="matrices-cat-head">
            ${canWrite ? html`<input class="cell-input" data-mx-focus=${c.id} value=${c.name || ''} placeholder="Nombre de la categoría" aria-label=${'Nombre de la categoría ' + (ci + 1)} onInput=${(e) => { const v = e.currentTarget.value; setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, name: v } : x))); }} />
              <div class="matrices-btns"><${MiniBtn} icon="chevron-up" label="Mover categoría antes" disabled=${ci === 0} onClick=${() => setCats((cs) => PM.moveItem(cs, ci, ci - 1))} /><${MiniBtn} icon="chevron-down" label="Mover categoría después" disabled=${ci === cats.length - 1} onClick=${() => setCats((cs) => PM.moveItem(cs, ci, ci + 1))} /><${MiniBtn} icon="trash" label="Eliminar categoría" onClick=${() => delCat(c)} /></div>`
              : html`<div class="h4" style="padding:4px 6px">${c.name || 'Categoría sin nombre'}</div>`}
          </div>
          <div class="matrices-cat-body">
            ${(c.causes || []).length ? null : html`<div class="xsmall faint" style="padding:2px 6px">Sin causas registradas.</div>`}
            ${(c.causes || []).map((x, xi, arr) => html`<div key=${x.id} class="stack-sm" style="gap:2px">
              <div class="matrices-cause">
                ${canWrite ? html`<${AutoText} data-mx-focus=${x.id} value=${x.text || ''} placeholder="Causa" label=${'Causa ' + (xi + 1) + ' de ' + (c.name || 'la categoría')} onValue=${(v) => setCauses(c.id, (xs) => xs.map((y) => (y.id === x.id ? { ...y, text: v } : y)))} />
                  <div class="matrices-btns">
                    <${MiniBtn} icon="indent" label="Agregar subcausa" onClick=${() => { const id = PM.uid('sub'); setSubs(c.id, x.id, (ss) => [...ss, { id, text: '' }]); focusNext.current = id; }} />
                    <${MiniBtn} icon="chevron-up" label="Subir causa" disabled=${xi === 0} onClick=${() => setCauses(c.id, (xs) => PM.moveItem(xs, xi, xi - 1))} />
                    <${MiniBtn} icon="chevron-down" label="Bajar causa" disabled=${xi === arr.length - 1} onClick=${() => setCauses(c.id, (xs) => PM.moveItem(xs, xi, xi + 1))} />
                    <${MiniBtn} icon="trash" label="Eliminar causa" onClick=${() => delCause(c, x)} />
                  </div>` : html`<div class="matrices-ro-text">${x.text || html`<span class="faint">Causa sin describir</span>`}</div>`}
              </div>
              ${(x.sub || []).map((s, si, sarr) => html`<div key=${s.id} class="matrices-sub">
                ${canWrite ? html`<${AutoText} data-mx-focus=${s.id} value=${s.text || ''} placeholder="Subcausa" label=${'Subcausa ' + (si + 1) + ' de ' + (x.text || 'la causa')} onValue=${(v) => setSubs(c.id, x.id, (ss) => ss.map((y) => (y.id === s.id ? { ...y, text: v } : y)))} />
                  <div class="matrices-btns">
                    <${MiniBtn} icon="chevron-up" label="Subir subcausa" disabled=${si === 0} onClick=${() => setSubs(c.id, x.id, (ss) => PM.moveItem(ss, si, si - 1))} />
                    <${MiniBtn} icon="chevron-down" label="Bajar subcausa" disabled=${si === sarr.length - 1} onClick=${() => setSubs(c.id, x.id, (ss) => PM.moveItem(ss, si, si + 1))} />
                    <${MiniBtn} icon="trash" label="Eliminar subcausa" onClick=${() => setSubs(c.id, x.id, (ss) => ss.filter((y) => y.id !== s.id))} />
                  </div>` : html`<div class="matrices-ro-text">• ${s.text || 'Subcausa sin describir'}</div>`}
              </div>`)}
            </div>`)}
            ${canWrite ? html`<div><${ui.Button} size="sm" variant="ghost" icon="plus" onClick=${() => { const id = PM.uid('cau'); setCauses(c.id, (xs) => [...xs, { id, text: '', sub: [] }]); focusNext.current = id; }}>Agregar causa</${ui.Button}></div>` : null}
          </div>
        </div>`)}</div>
      </section>
    </div>`;
  }

  /* ---------------------------------------------------------------- Pareto */
  const isNonConforming = (r) => r && (r.conforme === false || PM.slug(r.conforme) === 'no');
  const paretoFromMediciones = (rows) => {
    const nc = (rows || []).filter(isNonConforming);
    const map = new Map();
    for (const r of nc) { const label = String(r.causa || '').trim() || 'Sin causa registrada'; const k = label.toLowerCase(); if (!map.has(k)) map.set(k, { id: 'm_' + k, cause: label, count: 0 }); map.get(k).count++; }
    return { items: [...map.values()], total: (rows || []).length, nonconf: nc.length };
  };
  const paretoCompute = (items) => {
    const rows = (items || []).map((x) => ({ cause: String(x.cause || '').trim() || 'Causa sin nombre', count: Math.max(0, PM.num(x.count)) })).filter((x) => x.count > 0);
    rows.sort((a, b) => b.count - a.count || a.cause.localeCompare(b.cause, 'es'));
    const total = PM.sum(rows, (x) => x.count);
    let cum = 0, prev = 0;
    for (const r of rows) { r.pct = total ? r.count / total : 0; r.vital = prev < 0.8 - 1e-9; cum += r.count; r.cum = cum; r.cumPct = total ? cum / total : 0; prev = r.cumPct; }
    return { rows, total };
  };

  function ParetoChart({ data, svgRef, name }) {
    const host = useRef();
    const cw = useWidth(host, 720);
    const fv = useFontsVersion();
    const tip = PM.useChartTip();
    const n = data.rows.length;
    const m = { l: 48, r: 14, t: 26, b: 58 };
    /* cada categoría necesita al menos el ancho de su palabra más larga: así las etiquetas no se parten a mitad de palabra */
    const longestWord = useMemo(() => Math.max(0, ...data.rows.map((r) => Math.max(0, ...r.cause.split(/\s+/).map((w) => tw(w, 11, 400))))), [data, fv]);
    const minSlot = PM.clamp(Math.ceil(longestWord) + 12, 56, 128);
    const slot = PM.clamp((Math.max(280, cw) - m.l - m.r) / Math.max(1, n), minSlot, Math.max(120, minSlot));
    const pw = slot * n, W = Math.ceil(m.l + pw + m.r), ph = 230, H = m.t + ph + m.b;
    const sc = niceScale(0, data.total, 5, true);
    const Y = (v) => m.t + ph - (v / sc.hi) * ph;
    const bw = Math.min(24, slot * 0.55);
    const labels = useMemo(() => data.rows.map((r) => wrap(r.cause, slot - 8, 11, 400, 3)), [data, slot, fv]);
    const X = (k) => m.l + slot * (k + 0.5);
    const y80 = Y(0.8 * data.total);
    const path = data.rows.map((r, k) => (k ? 'L' : 'M') + X(k) + ',' + Y(r.cum)).join('');
    const tipFor = (r) => html`<div class="stack-sm" style="gap:3px"><strong>${r.cause}</strong><div>Frecuencia: ${PM.fmt.num(r.count)} (${PM.fmt.pct(r.pct, 1)} del total)</div><div>Acumulado: ${PM.fmt.num(r.cum)} · ${PM.fmt.pct(r.cumPct, 1)}</div><div>${r.vital ? 'Causa vital (dentro del 80 % acumulado)' : 'Causa del resto (después del 80 % acumulado)'}</div></div>`;
    return html`<div class="stack-sm">
      <div class="legend">
        <span class="legend-item"><span class="swatch" style="background:var(--s1)"></span>Pocos vitales (hasta el 80 % acumulado)</span>
        <span class="legend-item"><span class="swatch" style="background:color-mix(in srgb, var(--s1) 35%, transparent);box-shadow:inset 0 0 0 1px var(--s1)"></span>Muchos triviales</span>
        <span class="legend-item"><span class="legend-line" style="background:var(--s2)"></span>Frecuencia acumulada (rótulos en % del total)</span>
        <span class="legend-item"><svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" style="stroke:var(--fg-2);stroke-width:1.5;stroke-dasharray:4 3" /></svg>80 % del total</span>
      </div>
      ${W > cw + 2 ? html`<div class="xsmall faint">El gráfico es más ancho que la pantalla: desplázalo horizontalmente para verlo completo.</div>` : null}
      <div ref=${host} style="min-width:0">
        <div class="chart matrices-chart" ref=${tip.ref}>
          <svg ref=${svgRef} width=${W} height=${H} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Diagrama de Pareto: ' + name + '. ' + plural(n, 'causa', 'causas') + ', ' + PM.fmt.num(data.total) + ' casos en total.'} data-pareto-chart>
            <title>${'Diagrama de Pareto — ' + name}</title>
            ${sc.ticks.map((t) => html`<g key=${'y' + t}><line class="grid-line" x1=${m.l} x2=${m.l + pw} y1=${Y(t)} y2=${Y(t)} /><text x=${m.l - 6} y=${Y(t) + 4} text-anchor="end">${PM.fmt.num(t)}</text></g>`)}
            <text transform=${'translate(12,' + (m.t + ph / 2) + ') rotate(-90)'} text-anchor="middle" style="fill:var(--fg-2);font-weight:600">Frecuencia (casos)</text>
            ${data.rows.map((r, k) => html`<path key=${'b' + k} d=${barPath(X(k) - bw / 2, Y(r.count), bw, m.t + ph - Y(r.count))} data-vital=${r.vital ? '1' : '0'} style=${r.vital ? 'fill:var(--s1)' : 'fill:var(--s1);fill-opacity:0.35;stroke:var(--s1);stroke-width:1'} />`)}
            <line class="axis-line" x1=${m.l} x2=${m.l + pw} y1=${m.t + ph} y2=${m.t + ph} />
            <line x1=${m.l} x2=${m.l + pw} y1=${y80} y2=${y80} style="stroke:var(--fg-2);stroke-width:1.5;stroke-dasharray:6 4" />
            <text x=${m.l + pw - 4} y=${y80 + 14} text-anchor="end" style="fill:var(--fg-2);font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px">80 % acumulado</text>
            <path d=${path} style="fill:none;stroke:var(--s2);stroke-width:2;stroke-linejoin:round" />
            ${data.rows.map((r, k) => html`<g key=${'p' + k}>
              <circle cx=${X(k)} cy=${Y(r.cum)} r="4" style="fill:var(--s2);stroke:var(--surface);stroke-width:2" />
              <text x=${X(k)} y=${Y(r.cum) - 9} text-anchor="middle" style="fill:var(--fg);font-size:10.5px;font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px">${PM.fmt.pct(r.cumPct)}</text>
            </g>`)}
            ${data.rows.map((r, k) => html`<g key=${'l' + k} data-xlabel=${r.cause}>${labels[k].map((ln, j) => html`<text key=${j} x=${X(k)} y=${m.t + ph + 15 + j * 13} text-anchor="middle" style=${r.vital ? 'fill:var(--fg)' : ''}>${ln}</text>`)}</g>`)}
            ${data.rows.map((r, k) => html`<rect key=${'h' + k} x=${m.l + slot * k} y=${m.t} width=${slot} height=${ph} style="fill:transparent" onMouseMove=${(e) => tip.show(e, tipFor(r))} onMouseLeave=${tip.hide} />`)}
          </svg>
          ${tip.node}
        </div>
      </div>
    </div>`;
  }

  function ParetoNewModal({ close, count, med, onCreate }) {
    const [name, setName] = useState('Análisis de Pareto ' + (count + 1));
    const [source, setSource] = useState('manual');
    const ok = name.trim().length > 0;
    const submit = (e) => { if (e) e.preventDefault(); if (!ok) return; onCreate(name.trim(), source); close(); };
    return html`<${ui.Modal} title="Nuevo análisis de Pareto" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" disabled=${!ok} onClick=${submit}>Crear análisis</${ui.Button}>`}>
      <form class="stack" onSubmit=${submit}>
        <${ui.Field} label="Nombre" for="mx-par-name" required><${ui.Input} id="mx-par-name" value=${name} onValue=${setName} autoFocus /></${ui.Field}>
        <${ui.Field} label="Origen de los datos" hint=${source === 'mediciones' ? 'Cuenta las mediciones con «Conforme = No» del registro de mediciones de control de calidad, agrupadas por la columna «Causa del defecto». Hoy hay ' + plural(med.nonconf, 'no conformidad', 'no conformidades') + '.' : 'Escribe las causas y cuántas veces ocurrió cada una.'}>
          <${ui.Segmented} label="Origen de los datos" value=${source} onChange=${setSource} options=${[{ value: 'manual', label: 'Datos manuales' }, { value: 'mediciones', label: 'Mediciones de control de calidad' }]} />
        </${ui.Field}>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  function ParetoPanel({ list, saveQ, canWrite, project }) {
    const [mrows, , mmeta] = PM.useDocTable('mediciones-control-calidad', 'mediciones');
    const [selId, setSelId] = useState(() => PM.prefs.get('matrices.parSel', null));
    const cur = list.find((d) => d.id === selId) || list[0] || null;
    const svgRef = useRef();
    const med = useMemo(() => paretoFromMediciones(mrows), [mrows]);
    const items = cur ? (cur.source === 'mediciones' ? med.items : cur.items || []) : [];
    const data = useMemo(() => paretoCompute(items), [items]);
    const select = (id) => { setSelId(id); PM.prefs.set('matrices.parSel', id); };
    const updCur = (fn) => { if (!cur) return; const id = cur.id; saveQ(({ pareto }) => ({ pareto: pareto.map((d) => (d.id === id ? fn(d) : d)) })); };
    const create = () => PM.openModal((close) => html`<${ParetoNewModal} close=${close} count=${list.length} med=${med} onCreate=${(name, source) => { const s = { id: PM.uid('par'), name, source, items: [] }; saveQ(({ pareto }) => ({ pareto: [...pareto, s] })); select(s.id); }} />`);
    const rename = async () => { const name = await PM.promptText({ title: 'Renombrar análisis', label: 'Nombre del análisis', value: cur.name, confirmText: 'Guardar nombre' }); if (name && name !== cur.name) updCur((d) => ({ ...d, name })); };
    const remove = async () => {
      const ok = await PM.confirm({ title: 'Eliminar análisis de Pareto', body: 'Se eliminará «' + cur.name + '»' + (cur.source === 'manual' && (cur.items || []).length ? ' con sus ' + plural(cur.items.length, 'causa', 'causas') : '') + '. Las mediciones del registro no se modifican.', confirmText: 'Eliminar análisis', tone: 'danger' });
      if (!ok) return;
      const id = cur.id;
      saveQ(({ pareto }) => ({ pareto: pareto.filter((d) => d.id !== id) }));
      PM.toast('Análisis eliminado.');
    };
    const freeze = async () => {
      const ok = await PM.confirm({ title: 'Convertir en datos manuales', body: 'Se copiarán las ' + plural(med.items.length, 'causa', 'causas') + ' actuales como datos manuales. Desde ese momento el análisis ya no se actualizará con el registro de mediciones.', confirmText: 'Convertir' });
      if (!ok) return;
      updCur((d) => ({ ...d, source: 'manual', items: med.items.map((x) => ({ id: PM.uid('pi'), cause: x.cause, count: x.count })) }));
    };
    if (!list.length) {
      return html`<${ui.Empty} icon="pareto" title="Aún no hay análisis de Pareto" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${create}>Nuevo análisis de Pareto</${ui.Button}>` : null}>
        El diagrama de Pareto ordena las causas de los defectos de mayor a menor frecuencia para concentrar el esfuerzo en las pocas causas que generan la mayoría de los problemas (regla 80/20). Puede calcularse con las mediciones de control de calidad.
      </${ui.Empty}>`;
    }
    const isMed = cur.source === 'mediciones';
    return html`<div class="stack-lg">
      <div class="matrices-picker">
        <${ui.Select} aria-label="Análisis de Pareto" value=${cur.id} onValue=${select} options=${list.map((d) => ({ value: d.id, label: d.name || 'Análisis sin nombre' }))} />
        ${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${create}>Nuevo análisis</${ui.Button}>
          <${ui.Dropdown} label="Opciones del análisis" items=${[{ label: 'Renombrar', icon: 'edit', onClick: rename }, isMed && { label: 'Convertir en datos manuales', icon: 'table', onClick: freeze, disabled: !med.items.length }, { label: 'Eliminar análisis', icon: 'trash', danger: true, onClick: remove }]} />` : null}
        <div class="spacer"></div>
        ${data.rows.length ? html`<${SvgDownloadBtn} getSvg=${() => svgRef.current} filename=${fileBase(project, 'pareto-' + (PM.slug(cur.name) || 'analisis')) + '.svg'} />` : null}
      </div>
      <div class="row-between">
        ${canWrite ? html`<${ui.Segmented} label="Origen de los datos" value=${cur.source || 'manual'} onChange=${(v) => updCur((d) => ({ ...d, source: v, items: d.items || [] }))} options=${[{ value: 'manual', label: 'Datos manuales' }, { value: 'mediciones', label: 'Desde mediciones' }]} />` : html`<span class="chip">${isMed ? 'Calculado desde las mediciones de control de calidad' : 'Datos manuales'}</span>`}
        ${isMed ? html`<${ui.Button} size="sm" variant="ghost" icon="file" onClick=${() => openRegister('mediciones-control-calidad')}>Abrir mediciones de control de calidad</${ui.Button}>` : null}
      </div>
      ${isMed ? html`<${Note}>${mmeta.loading ? 'Cargando mediciones…' : 'Se calcula en vivo con ' + plural(med.nonconf, 'medición no conforme', 'mediciones no conformes') + ' (de ' + med.total + ' registradas), agrupadas por la columna «Causa del defecto».'}</${Note}>` : null}
      ${data.rows.length ? html`<${ParetoChart} data=${data} svgRef=${svgRef} name=${cur.name} />`
        : html`<${Note}>${isMed ? 'El registro de mediciones de control de calidad no tiene mediciones no conformes (Conforme = «No»). Cuando las haya, el diagrama se construirá solo.' : 'Agrega causas con su frecuencia en la tabla de abajo para construir el diagrama.'}</${Note}>`}
      <div class="grid cols-2">
        ${!isMed ? html`<${ui.Card} title="Datos" subtitle="Causa y número de veces que ocurrió">
          <${ui.DataTable} rows=${cur.items || []} readOnly=${!canWrite} onChange=${(next) => updCur((d) => ({ ...d, items: next }))} addLabel="Agregar causa" newRow=${() => ({ cause: '', count: null })} emptyText="Sin causas todavía."
            columns=${[{ key: 'cause', label: 'Causa', type: 'text', placeholder: 'Ej.: Piezas faltantes en el despacho', width: 200 }, { key: 'count', label: 'Frecuencia', type: 'number', min: 0, width: 96 }]} />
        </${ui.Card}>` : null}
        <${ui.Card} title="Tabla de Pareto" subtitle=${data.total ? PM.fmt.num(data.total) + ' casos en total' : 'Sin datos'} pad=${false} class=${isMed ? 'span-all' : ''}>
          ${data.rows.length ? html`<div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table table-tight" data-pareto-table>
            <thead><tr><th>Causa</th><th class="num">Frecuencia</th><th class="num">%</th><th class="num">% acumulado</th><th>Clasificación</th></tr></thead>
            <tbody>${data.rows.map((r, k) => html`<tr key=${k}><td style="min-width:130px">${r.cause}</td><td class="num mono nowrap">${PM.fmt.num(r.count)}</td><td class="num mono nowrap">${PM.fmt.pct(r.pct, 1)}</td><td class="num mono nowrap">${PM.fmt.pct(r.cumPct, 1)}</td><td>${r.vital ? html`<${ui.Chip} tone="accent">Vital</${ui.Chip}>` : html`<span class="xsmall faint">Resto</span>`}</td></tr>`)}</tbody>
          </table></div>` : html`<div class="card-body small muted">La tabla aparece cuando hay causas con frecuencia mayor que cero.</div>`}
        </${ui.Card}>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- gráfico de control */
  const isNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(PM.num(v, NaN));
  const fmtVal = (v) => PM.fmt.num(v, Math.abs(v) >= 100 ? 1 : Math.abs(v) >= 10 ? 2 : 3);
  const controlStats = (s) => {
    const pts = (s.points || []).map((p, k) => ({ ...p, row: k + 1, v: PM.num(p.value, NaN) })).filter((p) => isNum(p.value));
    const n = pts.length;
    const mean = n ? PM.sum(pts, (p) => p.v) / n : null;
    const sd = n >= 2 ? Math.sqrt(PM.sum(pts, (p) => (p.v - mean) ** 2) / (n - 1)) : null;
    const ucl = sd !== null ? mean + 3 * sd : null, lcl = sd !== null ? mean - 3 * sd : null;
    const lsl = isNum(s.lsl) ? PM.num(s.lsl) : null, usl = isNum(s.usl) ? PM.num(s.usl) : null, target = isNum(s.target) ? PM.num(s.target) : null;
    const out = sd ? pts.filter((p) => p.v > ucl || p.v < lcl) : [];
    const runs = [];
    if (mean !== null) {
      let start = 0, side = 0, len = 0;
      pts.forEach((p, k) => {
        const sd2 = p.v > mean ? 1 : p.v < mean ? -1 : 0;
        if (sd2 !== 0 && sd2 === side) len++;
        else { if (side !== 0 && len >= 7) runs.push({ from: start, to: k - 1, side }); side = sd2; start = k; len = sd2 ? 1 : 0; }
      });
      if (side !== 0 && len >= 7) runs.push({ from: start, to: pts.length - 1, side });
    }
    const runIdx = new Set();
    for (const r of runs) for (let k = r.from; k <= r.to; k++) runIdx.add(k);
    const spec = pts.filter((p) => (usl !== null && p.v > usl) || (lsl !== null && p.v < lsl));
    const cp = sd && lsl !== null && usl !== null && usl > lsl ? (usl - lsl) / (6 * sd) : null;
    const cpk = sd && (lsl !== null || usl !== null) ? Math.min(usl !== null ? (usl - mean) / (3 * sd) : Infinity, lsl !== null ? (mean - lsl) / (3 * sd) : Infinity) : null;
    const flags = {};
    pts.forEach((p, k) => { const f = []; if (sd && p.v > ucl) f.push('Fuera de control (> LSC)'); if (sd && p.v < lcl) f.push('Fuera de control (< LIC)'); if (runIdx.has(k)) f.push('Regla de los siete'); if (usl !== null && p.v > usl) f.push('Fuera de especificación (> LSE)'); if (lsl !== null && p.v < lsl) f.push('Fuera de especificación (< LIE)'); flags[p.id || 'row' + p.row] = f; });
    return { pts, n, mean, sd, ucl, lcl, lsl, usl, target, out, runs, runIdx, spec, cp, cpk, flags };
  };

  function ControlChart({ series, st, svgRef }) {
    const host = useRef();
    const cw = useWidth(host, 720);
    const tip = PM.useChartTip();
    const unit = series.unit ? ' ' + series.unit : '';
    const pts = st.pts, n = pts.length;
    const m = { l: 56, r: 104, t: 14, b: 42 };
    const step = PM.clamp((Math.max(320, cw) - m.l - m.r) / Math.max(1, n), 16, 64);
    const pw = step * n, W = Math.ceil(m.l + pw + m.r), ph = 250, H = m.t + ph + m.b;
    const refs = [
      st.mean !== null && { key: 'mean', label: 'Media', v: st.mean, style: 'stroke:var(--fg-3);stroke-width:1.25' },
      st.ucl !== null && { key: 'ucl', label: 'LSC', v: st.ucl, style: 'stroke:var(--signal);stroke-width:1.5' },
      st.lcl !== null && { key: 'lcl', label: 'LIC', v: st.lcl, style: 'stroke:var(--signal);stroke-width:1.5' },
      st.usl !== null && { key: 'usl', label: 'LSE', v: st.usl, style: 'stroke:var(--fg-2);stroke-width:1.5;stroke-dasharray:6 4' },
      st.lsl !== null && { key: 'lsl', label: 'LIE', v: st.lsl, style: 'stroke:var(--fg-2);stroke-width:1.5;stroke-dasharray:6 4' },
      st.target !== null && { key: 'target', label: 'Objetivo', v: st.target, style: 'stroke:var(--accent);stroke-width:1.25;stroke-dasharray:2 3' },
    ].filter(Boolean);
    const vals = [...pts.map((p) => p.v), ...refs.map((r) => r.v)];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1;
    const sc = niceScale(lo - pad, hi + pad, 5);
    const Y = (v) => m.t + ph - ((v - sc.lo) / (sc.hi - sc.lo)) * ph;
    const X = (k) => m.l + step * (k + 0.5);
    const every = Math.max(1, Math.ceil(52 / step));
    const rl = spreadLabels(refs.map((r) => ({ ...r, y: Y(r.v) })), 13, m.t + 4, m.t + ph);
    const outSet = new Set(st.out.map((p) => p.row));
    const path = pts.map((p, k) => (k ? 'L' : 'M') + X(k) + ',' + Y(p.v)).join('');
    const tipFor = (p, k) => { const f = st.flags[p.id || 'row' + p.row] || []; return html`<div class="stack-sm" style="gap:3px"><strong>Muestra ${p.row}${p.date ? ' · ' + PM.fmt.date(p.date) : ''}</strong><div>Valor: ${fmtVal(p.v)}${unit}</div>${f.length ? f.map((x) => html`<div key=${x}>${x}</div>`) : html`<div class="faint">Dentro de los límites</div>`}</div>`; };
    return html`<div class="stack-sm">
      <div class="legend">
        <span class="legend-item"><span class="legend-line" style="background:var(--s1)"></span>Mediciones</span>
        <span class="legend-item"><span class="legend-line" style="background:var(--fg-3)"></span>Media (línea central)</span>
        ${st.ucl !== null ? html`<span class="legend-item"><span class="legend-line" style="background:var(--signal)"></span>Límites de control (±3σ)</span>` : null}
        ${st.usl !== null || st.lsl !== null ? html`<span class="legend-item"><svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" style="stroke:var(--fg-2);stroke-width:1.5;stroke-dasharray:4 3" /></svg>Límites de especificación</span>` : null}
        ${st.target !== null ? html`<span class="legend-item"><svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:2 3" /></svg>Objetivo</span>` : null}
        ${st.out.length ? html`<span class="legend-item"><span class="dot" style="background:var(--crit)"></span>Fuera de control</span>` : null}
        ${st.runs.length ? html`<span class="legend-item"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" style="fill:none;stroke:var(--warn);stroke-width:1.5" /></svg>Regla de los siete</span>` : null}
      </div>
      ${W > cw + 2 ? html`<div class="xsmall faint">El gráfico es más ancho que la pantalla: desplázalo horizontalmente para verlo completo.</div>` : null}
      <div ref=${host} style="min-width:0">
        <div class="chart matrices-chart" ref=${tip.ref}>
          <svg ref=${svgRef} width=${W} height=${H} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Gráfico de control: ' + (series.name || '') + '. ' + plural(n, 'punto', 'puntos') + ', ' + plural(st.out.length, 'fuera de control', 'fuera de control') + '.'} data-control-chart>
            <title>${'Gráfico de control — ' + (series.name || '')}</title>
            ${sc.ticks.map((t) => html`<g key=${'y' + t}><line class="grid-line" x1=${m.l} x2=${m.l + pw} y1=${Y(t)} y2=${Y(t)} /><text x=${m.l - 6} y=${Y(t) + 4} text-anchor="end">${fmtVal(t)}</text></g>`)}
            <line class="axis-line" x1=${m.l} x2=${m.l + pw} y1=${m.t + ph} y2=${m.t + ph} />
            <text transform=${'translate(12,' + (m.t + ph / 2) + ') rotate(-90)'} text-anchor="middle" style="fill:var(--fg-2);font-weight:600">${'Valor' + (series.unit ? ' (' + series.unit + ')' : '')}</text>
            ${refs.map((r) => html`<line key=${r.key} x1=${m.l} x2=${m.l + pw} y1=${Y(r.v)} y2=${Y(r.v)} style=${r.style} />`)}
            ${rl.map((r) => html`<text key=${'t' + r.key} x=${m.l + pw + 6} y=${r.ly + 4} style="fill:var(--fg-2)"><tspan style="font-weight:600;fill:var(--fg)">${r.label}</tspan> ${fmtVal(r.v)}</text>`)}
            <path d=${path} style="fill:none;stroke:var(--s1);stroke-width:2;stroke-linejoin:round" />
            ${pts.map((p, k) => html`<g key=${'p' + k}>
              ${st.runIdx.has(k) ? html`<circle cx=${X(k)} cy=${Y(p.v)} r="8" style="fill:none;stroke:var(--warn);stroke-width:1.5" />` : null}
              <circle cx=${X(k)} cy=${Y(p.v)} r=${outSet.has(p.row) ? 5 : 4} data-out=${outSet.has(p.row) ? '1' : '0'} style=${'fill:' + (outSet.has(p.row) ? 'var(--crit)' : 'var(--s1)') + ';stroke:var(--surface);stroke-width:2'} />
              <circle cx=${X(k)} cy=${Y(p.v)} r="11" style="fill:transparent" onMouseMove=${(e) => tip.show(e, tipFor(p, k))} onMouseLeave=${tip.hide} />
            </g>`)}
            ${pts.map((p, k) => (k % every === 0 ? html`<text key=${'x' + k} x=${X(k)} y=${m.t + ph + 15} text-anchor="middle">${p.date ? PM.fmt.date(p.date, 'dm') : '#' + p.row}</text>` : null))}
            <text x=${m.l + pw / 2} y=${H - 6} text-anchor="middle" style="fill:var(--fg-2);font-weight:600">Muestras en orden de registro</text>
          </svg>
          ${tip.node}
        </div>
      </div>
    </div>`;
  }

  function SeriesModal({ close, onCreate }) {
    const [f, setF] = useState({ name: '', unit: '', target: null, lsl: null, usl: null });
    const [touched, setTouched] = useState(false);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const err = !f.name.trim() ? 'Escribe qué se mide.' : null;
    const specErr = isNum(f.lsl) && isNum(f.usl) && PM.num(f.lsl) >= PM.num(f.usl) ? 'El límite inferior de especificación debe ser menor que el superior.' : null;
    const submit = (e) => { if (e) e.preventDefault(); setTouched(true); if (err || specErr) return; onCreate({ id: PM.uid('ctl'), name: f.name.trim(), unit: f.unit.trim(), target: f.target, lsl: f.lsl, usl: f.usl, points: [] }); close(); };
    return html`<${ui.Modal} title="Nueva serie de control" subtitle="Una serie es una característica medible del proceso o del producto." onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" onClick=${submit}>Crear serie</${ui.Button}>`}>
      <form class="matrices-form-grid" onSubmit=${submit}>
        <${ui.Field} label="Qué se mide" required for="mx-c-name" class="span-all" error=${touched && err}><${ui.Input} id="mx-c-name" value=${f.name} onValue=${set('name')} placeholder="Ej.: Torque de apriete de abrazaderas" autoFocus /></${ui.Field}>
        <${ui.Field} label="Unidad" for="mx-c-unit"><${ui.Input} id="mx-c-unit" value=${f.unit} onValue=${set('unit')} placeholder="Ej.: N·m" /></${ui.Field}>
        <${ui.Field} label="Objetivo" for="mx-c-target"><${ui.NumberInput} id="mx-c-target" value=${f.target} onValue=${set('target')} /></${ui.Field}>
        <${ui.Field} label="Límite inferior de especificación (LIE)" for="mx-c-lsl"><${ui.NumberInput} id="mx-c-lsl" value=${f.lsl} onValue=${set('lsl')} /></${ui.Field}>
        <${ui.Field} label="Límite superior de especificación (LSE)" for="mx-c-usl" error=${specErr}><${ui.NumberInput} id="mx-c-usl" value=${f.usl} onValue=${set('usl')} /></${ui.Field}>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  /* Pegar valores: una medición por línea, "valor" o "fecha;valor" (fecha AAAA-MM-DD o DD/MM/AAAA). */
  const parsePasted = (text) => {
    const out = [], bad = [];
    String(text || '').split(/\r?\n/).forEach((line, k) => {
      const t = line.trim();
      if (!t) return;
      const parts = t.split(/\t|;|\s{2,}/).map((x) => x.trim()).filter(Boolean);
      let date = null, raw = parts[parts.length - 1];
      if (parts.length >= 2) {
        const d = parts[0];
        const mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
        date = PM.date.valid(d) ? d : mm ? mm[3] + '-' + mm[2].padStart(2, '0') + '-' + mm[1].padStart(2, '0') : null;
        if (date && !PM.date.valid(date)) date = null;
      }
      const v = PM.num(String(raw).replace(/\.(?=\d{3}(\D|$))/g, ''), NaN);
      if (Number.isFinite(v)) out.push({ id: PM.uid('pt'), date, value: v }); else bad.push(k + 1);
    });
    return { out, bad };
  };
  function PasteModal({ close, unit, onAdd }) {
    const [text, setText] = useState('');
    const parsed = parsePasted(text);
    return html`<${ui.Modal} title="Pegar mediciones" subtitle="Copia una columna desde una hoja de cálculo y pégala aquí." onClose=${close}
      footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" disabled=${!parsed.out.length} onClick=${() => { onAdd(parsed.out); close(); }}>${parsed.out.length ? 'Agregar ' + plural(parsed.out.length, 'medición', 'mediciones') : 'Agregar mediciones'}</${ui.Button}>`}>
      <${ui.Field} label=${'Valores' + (unit ? ' (' + unit + ')' : '')} for="mx-paste" hint="Una medición por línea: solo el valor (10,4) o fecha y valor separados por tabulación o punto y coma (2026-09-14;10,4).">
        <${ui.TextArea} id="mx-paste" class="mono" rows=${8} value=${text} onValue=${setText} autoFocus />
      </${ui.Field}>
      ${parsed.bad.length ? html`<div class="field-error">No se reconoció un número en ${parsed.bad.length === 1 ? 'la línea ' : 'las líneas '}${parsed.bad.slice(0, 8).join(', ')}${parsed.bad.length > 8 ? '…' : ''}; ${parsed.bad.length === 1 ? 'se omitirá' : 'se omitirán'}.</div>` : null}
    </${ui.Modal}>`;
  }

  function ControlPanel({ list, saveQ, canWrite, project }) {
    const [selId, setSelId] = useState(() => PM.prefs.get('matrices.ctlSel', null));
    const cur = list.find((d) => d.id === selId) || list[0] || null;
    const svgRef = useRef();
    const select = (id) => { setSelId(id); PM.prefs.set('matrices.ctlSel', id); };
    const updCur = (fn) => { if (!cur) return; const id = cur.id; saveQ(({ control }) => ({ control: control.map((d) => (d.id === id ? fn(d) : d)) })); };
    const st = useMemo(() => (cur ? controlStats(cur) : null), [cur]);
    const create = () => PM.openModal((close) => html`<${SeriesModal} close=${close} onCreate=${(s) => { saveQ(({ control }) => ({ control: [...control, s] })); select(s.id); }} />`);
    const remove = async () => {
      const ok = await PM.confirm({ title: 'Eliminar serie', body: 'Se eliminará «' + cur.name + '» con ' + plural((cur.points || []).length, 'medición', 'mediciones') + '. Esta acción no se puede deshacer.', confirmText: 'Eliminar serie', tone: 'danger' });
      if (!ok) return;
      const id = cur.id;
      saveQ(({ control }) => ({ control: control.filter((d) => d.id !== id) }));
      PM.toast('Serie eliminada.');
    };
    const paste = () => PM.openModal((close) => html`<${PasteModal} close=${close} unit=${cur.unit} onAdd=${(pts) => { updCur((s) => ({ ...s, points: [...(s.points || []), ...pts] })); PM.toast(plural(pts.length, 'medición agregada', 'mediciones agregadas') + '.'); }} />`);
    const note = html`<${ui.Card} title="Límites de control y límites de especificación">
      <div class="grid cols-2 small">
        <div><strong>Límites de control (LSC / LIC)</strong><p class="muted">Se calculan con los datos del propio proceso: media ± 3 desviaciones estándar. Muestran la variación natural; un punto fuera, o siete seguidos al mismo lado de la media, indica una causa asignable que hay que investigar (8.3 Controlar la calidad).</p></div>
        <div><strong>Límites de especificación (LSE / LIE)</strong><p class="muted">Los fija el cliente, el diseño o la norma: son el requisito del producto. Un punto fuera es un producto no conforme. Un proceso puede estar bajo control y aun así no cumplir la especificación, o al revés.</p></div>
      </div>
    </${ui.Card}>`;
    if (!list.length) {
      return html`<div class="stack-lg"><${ui.Empty} icon="scurve" title="Aún no hay gráficos de control" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${create}>Nueva serie de control</${ui.Button}>` : null}>
        Registra mediciones de una característica (por ejemplo, el torque de apriete de las abrazaderas o la verticalidad del andamio) para ver si el proceso es estable y cumple la especificación.
      </${ui.Empty}>${note}</div>`;
    }
    const unit = cur.unit ? ' ' + cur.unit : '';
    const specErr = isNum(cur.lsl) && isNum(cur.usl) && PM.num(cur.lsl) >= PM.num(cur.usl);
    const ptLabel = (p) => 'Muestra ' + p.row + (p.date ? ' (' + PM.fmt.date(p.date, 'dm') + ')' : '') + ': ' + fmtVal(p.v) + unit;
    const pointCols = [
      { key: 'n', label: 'N.º', type: 'calc', calc: (row, rows) => rows.indexOf(row) + 1, width: 40 },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'value', label: 'Valor' + (cur.unit ? ' (' + cur.unit + ')' : ''), type: 'number', width: 110 },
      { key: 'flag', label: 'Resultado', type: 'calc', align: 'left', calc: (row, rows) => (st.flags[row.id || 'row' + (rows.indexOf(row) + 1)] || []).join(' · '), format: (v) => html`<span class="row" style="gap:4px;flex-wrap:nowrap;justify-content:flex-start">${v ? v.split(' · ').map((f) => html`<${ui.Chip} key=${f} tone=${/^Fuera de control/.test(f) ? 'crit' : /^Regla/.test(f) ? 'warn' : 'signal'}>${f}</${ui.Chip}>`) : html`<span class="faint">Sin observaciones</span>`}</span>` },
    ];
    return html`<div class="stack-lg">
      <div class="matrices-picker">
        <${ui.Select} aria-label="Serie de control" value=${cur.id} onValue=${select} options=${list.map((d) => ({ value: d.id, label: (d.name || 'Serie sin nombre') + (d.unit ? ' (' + d.unit + ')' : '') }))} />
        ${canWrite ? html`<${ui.Button} size="sm" icon="plus" onClick=${create}>Nueva serie</${ui.Button}>
          <${ui.Dropdown} label="Opciones de la serie" items=${[{ label: 'Pegar mediciones', icon: 'copy', onClick: paste }, { label: 'Eliminar serie', icon: 'trash', danger: true, onClick: remove }]} />` : null}
        <div class="spacer"></div>
        ${st.n ? html`<${SvgDownloadBtn} getSvg=${() => svgRef.current} filename=${fileBase(project, 'control-' + (PM.slug(cur.name) || 'serie')) + '.svg'} />` : null}
      </div>
      ${canWrite ? html`<div class="matrices-series-form">
        <${ui.Field} label="Qué se mide" for="mx-cs-name"><${ui.Input} id="mx-cs-name" value=${cur.name || ''} onValue=${(v) => updCur((s) => ({ ...s, name: v }))} /></${ui.Field}>
        <${ui.Field} label="Unidad" for="mx-cs-unit"><${ui.Input} id="mx-cs-unit" value=${cur.unit || ''} onValue=${(v) => updCur((s) => ({ ...s, unit: v }))} /></${ui.Field}>
        <${ui.Field} label="Objetivo" for="mx-cs-target"><${ui.NumberInput} id="mx-cs-target" value=${cur.target} onValue=${(v) => updCur((s) => ({ ...s, target: v }))} /></${ui.Field}>
        <${ui.Field} label="LIE" for="mx-cs-lsl" hint="Límite inferior de especificación"><${ui.NumberInput} id="mx-cs-lsl" value=${cur.lsl} onValue=${(v) => updCur((s) => ({ ...s, lsl: v }))} /></${ui.Field}>
        <${ui.Field} label="LSE" for="mx-cs-usl" hint="Límite superior de especificación" error=${specErr ? 'Debe ser mayor que el LIE.' : null}><${ui.NumberInput} id="mx-cs-usl" value=${cur.usl} onValue=${(v) => updCur((s) => ({ ...s, usl: v }))} /></${ui.Field}>
      </div>` : null}
      ${st.n ? html`<div class="matrices-stats">
        <${ui.Stat} label="Puntos" value=${st.n} sub=${st.n < 20 ? 'Se recomiendan 20 o más' : 'Muestra suficiente'} />
        <${ui.Stat} label="Media" value=${fmtVal(st.mean)} sub=${cur.unit || ' '} />
        <${ui.Stat} label="Desviación estándar" value=${st.sd !== null ? fmtVal(st.sd) : '—'} sub="s muestral (n − 1)" />
        <${ui.Stat} label="LSC" value=${st.ucl !== null ? fmtVal(st.ucl) : '—'} sub="Media + 3s" />
        <${ui.Stat} label="LIC" value=${st.lcl !== null ? fmtVal(st.lcl) : '—'} sub="Media − 3s" />
        ${st.cpk !== null ? html`<${ui.Stat} label=${st.cp !== null ? 'Cp / Cpk' : 'Cpk'} value=${(st.cp !== null ? PM.fmt.idx(st.cp) + ' / ' : '') + PM.fmt.idx(st.cpk)} sub=${st.cpk >= 1.33 ? 'Proceso capaz' : st.cpk >= 1 ? 'Capacidad ajustada' : 'Proceso no capaz'} tone=${st.cpk >= 1.33 ? 'good' : st.cpk >= 1 ? 'warn' : 'crit'} />` : null}
      </div>` : null}
      ${st.n >= 2 ? html`<${ControlChart} series=${cur} st=${st} svgRef=${svgRef} />` : html`<${Note}>Registra al menos dos mediciones para calcular la media y los límites de control.</${Note}>`}
      ${st.n >= 2 ? html`<div class="grid cols-3">
        <${ui.Card} title="Fuera de control" subtitle="Más allá de ±3s">${st.out.length ? html`<ul class="matrices-flags" data-out-list>${st.out.map((p) => html`<li key=${p.row}><${ui.Chip} tone="crit">${p.v > st.ucl ? '> LSC' : '< LIC'}</${ui.Chip}>${ptLabel(p)}</li>`)}</ul>` : html`<p class="small muted">Ningún punto fuera de los límites de control.</p>`}</${ui.Card}>
        <${ui.Card} title="Regla de los siete" subtitle="7 o más puntos seguidos al mismo lado de la media">${st.runs.length ? html`<ul class="matrices-flags" data-run-list>${st.runs.map((r, k) => html`<li key=${k}><${ui.Chip} tone="warn">${r.to - r.from + 1} puntos</${ui.Chip}>Muestras ${st.pts[r.from].row} a ${st.pts[r.to].row}, ${r.side > 0 ? 'por encima' : 'por debajo'} de la media</li>`)}</ul>` : html`<p class="small muted">No hay rachas de siete puntos al mismo lado de la media.</p>`}</${ui.Card}>
        <${ui.Card} title="Fuera de especificación" subtitle="Producto no conforme">${st.lsl === null && st.usl === null ? html`<p class="small muted">Define el LIE o el LSE para evaluar la conformidad.</p>` : st.spec.length ? html`<ul class="matrices-flags" data-spec-list>${st.spec.map((p) => html`<li key=${p.row}><${ui.Chip} tone="signal">${st.usl !== null && p.v > st.usl ? '> LSE' : '< LIE'}</${ui.Chip}>${ptLabel(p)}</li>`)}</ul>` : html`<p class="small muted">Todas las mediciones cumplen la especificación.</p>`}</${ui.Card}>
      </div>` : null}
      <${ui.Card} title="Mediciones" subtitle="En el orden en que se tomaron">
        <${ui.DataTable} rows=${cur.points || []} readOnly=${!canWrite} onChange=${(next) => updCur((s) => ({ ...s, points: next }))} addLabel="Agregar medición" newRow=${() => ({ id: PM.uid('pt'), date: PM.date.today(), value: null })} emptyText="Sin mediciones todavía." columns=${pointCols} />
      </${ui.Card}>
      ${note}
    </div>`;
  }

  function QualityView({ project, params }) {
    const canWrite = PM.useCanWrite();
    const [quality, save, meta] = PM.useToolData('quality', PM.EMPTY.quality);
    const latest = useRef(quality);
    latest.current = quality;
    const saveQ = useCallback((fn) => {
      const cur = latest.current || {};
      const base = { ishikawa: cur.ishikawa || [], pareto: cur.pareto || [], control: cur.control || [] };
      const next = { ...cur, ...base, ...fn(base) };
      latest.current = next;
      PM.touchProject(PM.getState().projectId);
      return save(next);
    }, [save]);
    const TABS = ['ishikawa', 'pareto', 'control'];
    const [tab, setTabRaw] = useState(() => (params && TABS.includes(params.tab) ? params.tab : prefTab('matrices.qualityTab', TABS, 'ishikawa')));
    const setTab = (v) => { setTabRaw(v); PM.prefs.set('matrices.qualityTab', v); };
    useEffect(() => { if (params && TABS.includes(params.tab)) setTabRaw(params.tab); }, [params && params.tab]);
    const ish = quality.ishikawa || [], par = quality.pareto || [], ctl = Array.isArray(quality.control) ? quality.control : [];
    const header = html`<${ui.PageHeader} eyebrow="8.2 Gestionar la calidad · 8.3 Controlar la calidad" title="Herramientas de calidad"
      description="Analiza las causas de los problemas de calidad con el diagrama de Ishikawa, prioriza los defectos con el diagrama de Pareto y vigila la estabilidad del proceso con el gráfico de control." />`;
    if (meta.loading) return html`<div class="page">${header}<${ui.Loading} rows=${6} /></div>`;
    return html`<div class="page">${header}
      <${ui.Tabs} value=${tab} onChange=${setTab} tabs=${[{ id: 'ishikawa', label: 'Diagrama de Ishikawa', icon: 'quality', count: ish.length || undefined }, { id: 'pareto', label: 'Diagrama de Pareto', icon: 'pareto', count: par.length || undefined }, { id: 'control', label: 'Gráfico de control', icon: 'scurve', count: ctl.length || undefined }]} />
      ${tab === 'ishikawa' ? html`<${IshikawaPanel} list=${ish} saveQ=${saveQ} canWrite=${canWrite} project=${project} />` : null}
      ${tab === 'pareto' ? html`<${ParetoPanel} list=${par} saveQ=${saveQ} canWrite=${canWrite} project=${project} />` : null}
      ${tab === 'control' ? html`<${ControlPanel} list=${ctl} saveQ=${saveQ} canWrite=${canWrite} project=${project} />` : null}
    </div>`;
  }


  PM.registerView({ id: 'riesgos-matriz', label: 'Probabilidad e impacto', group: 'analisis', icon: 'risk', order: 20, component: RiskMatrixView, description: 'Matriz de probabilidad e impacto (11.3)' });
  PM.registerView({ id: 'interesados-matriz', label: 'Interesados', group: 'analisis', icon: 'stakeholders', order: 30, component: StakeholderView, description: 'Matrices de poder e interés y de evaluación del involucramiento (13.1 / 13.2)' });
  PM.registerView({ id: 'calidad', label: 'Ishikawa y Pareto', group: 'analisis', icon: 'quality', order: 40, component: QualityView, description: 'Diagrama de Ishikawa, diagrama de Pareto y gráfico de control (8.2 / 8.3)' });
  PM.registerView({ id: 'raci', label: 'Matriz RACI', group: 'analisis', icon: 'raci', order: 10, component: RaciView, description: 'Matriz de asignación de responsabilidades (9.1)' });
})();

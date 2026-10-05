/* ==========================================================================
   60-flow.js — vista "flujogramas": editor de diagramas de flujo con símbolos
   estándar (estilo ANSI / ISO 5807), carriles por responsable (diagrama
   multifuncional), plantillas de procesos del proyecto, deshacer/rehacer,
   exportación SVG/JSON y un panel de propiedades que permite construir el
   diagrama solo con el teclado.
   Datos: projects/{pid}/flows/{fid} = {name, description, nodes:[{id,type,x,y,w,h,text}],
   edges:[{id,from,to,label}], lanes:[{id,name,h?}], lanesHidden?, createdAt, updatedAt}
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect, useReducer } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;

  /* ---------------------------------------------------------------- constantes */
  const GRID = 8;
  const LH = 16;
  const LANE_LABEL_W = 128;
  const LANE_H = 176;
  const MIN_K = 0.2;
  const MAX_K = 3;
  const FONT = '"IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif';
  const snap = (v) => Math.round(v / GRID) * GRID;
  const floorG = (v) => Math.floor(v / GRID) * GRID;
  const ceilG = (v) => Math.ceil(v / GRID) * GRID;
  const clamp = PM.clamp;

  const TYPES = {
    terminal: { label: 'Inicio/Fin', name: 'inicio o fin', hint: 'terminal, inicio o fin del proceso', w: 144, h: 48, text: 'Inicio', min: [64, 32] },
    process: { label: 'Proceso', name: 'proceso', hint: 'actividad o tarea', w: 160, h: 64, text: 'Proceso', min: [56, 32] },
    decision: { label: 'Decisión', name: 'decisión', hint: 'pregunta con salidas Sí / No', w: 160, h: 96, text: '¿Condición?', min: [72, 48] },
    document: { label: 'Documento', name: 'documento', hint: 'documento o registro que se genera', w: 160, h: 72, text: 'Documento', min: [56, 40] },
    data: { label: 'Datos (E/S)', name: 'datos (entrada o salida)', hint: 'entrada o salida de datos', w: 160, h: 64, text: 'Datos', min: [64, 32] },
    subprocess: { label: 'Subproceso', name: 'subproceso', hint: 'proceso predefinido que se documenta aparte', w: 160, h: 64, text: 'Subproceso', min: [64, 32] },
    connector: { label: 'Conector', name: 'conector', hint: 'círculo con una letra; el flujo continúa en el conector que lleva la misma letra (no es una flecha)', w: 40, h: 40, text: 'A', min: [24, 24] },
    note: { label: 'Nota', name: 'nota', hint: 'anotación o comentario', w: 176, h: 72, text: 'Nota', min: [56, 32] },
  };
  const TYPE_KEYS = Object.keys(TYPES);
  const TYPE_OPTIONS = TYPE_KEYS.map((k) => ({ value: k, label: TYPES[k].label }));
  const DEFAULT_LANES = ['Director del proyecto', 'Residente de obra', 'Coordinador logístico'];

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.flow-root { container: flowroot / inline-size; min-width: 0; }
.flow-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; min-width: 0; }
.flow-list { display: none; flex-direction: column; gap: 6px; min-width: 0; }
.flow-picker { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; min-width: 0; }
.flow-picker .field { flex: 0 1 460px; }
@container flowroot (min-width: 1180px) {
  .flow-layout { grid-template-columns: 232px minmax(0, 1fr); }
  .flow-list { display: flex; }
  .flow-picker { display: none; }
}
.flow-list-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 0 2px 2px; }
.flow-list-item { display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); cursor: pointer; min-width: 0; }
.flow-list-item:hover { border-color: var(--line-strong); background: var(--surface-2); }
.flow-list-item[aria-current="true"] { border-color: var(--accent); background: var(--accent-wash); }
.flow-list-name { font-weight: 600; font-size: var(--fs-sm); line-height: 1.3; overflow-wrap: anywhere; }
.flow-list-meta { font-size: var(--fs-xs); color: var(--fg-3); }
.flow-editor { container: flowed / inline-size; display: flex; flex-direction: column; gap: 10px; min-width: 0; --flow-h: clamp(440px, calc(100vh - 290px), 820px); }
.flow-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 12px; align-items: end; min-width: 0; }
.flow-head > .flow-picker { grid-column: 1; grid-row: 1; }
.flow-head-acts { grid-column: 2; grid-row: 1; }
.flow-head-text { grid-column: 1 / -1; grid-row: 2; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.flow-head-title { font-size: var(--fs-xl); font-stretch: 105%; overflow-wrap: anywhere; }
@container flowroot (min-width: 1180px) {
  .flow-head { align-items: start; }
  .flow-head-text { grid-column: 1; grid-row: 1; }
}
@container flowroot (max-width: 1179.98px) {
  .flow-head-title { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
}
.flow-desc-wrap { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; margin-top: 2px; }
.flow-desc { margin: 0; max-width: 80ch; overflow-wrap: anywhere; }
.flow-desc.is-clamped { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.flow-more { padding: 2px 0; min-height: 24px; border: 0; background: none; color: var(--accent); font-size: var(--fs-xs); font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.flow-more:hover { color: var(--accent-hover); }
.flow-tb-export { display: flex; flex-wrap: wrap; gap: 6px; }
.flow-toolbar { padding: 6px 8px; gap: 6px; }
.flow-toolbar .btn[aria-pressed="true"] { background: var(--accent-wash); color: var(--accent); border-color: var(--accent); }
.flow-zoom { font-family: var(--font-mono); font-size: var(--fs-xs); min-width: 54px; }
.flow-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: start; min-width: 0; }
@container flowed (min-width: 900px) {
  .flow-body { grid-template-columns: minmax(0, 1fr) 312px; }
  .flow-panel { max-height: calc(var(--flow-h) + 52px); overflow-y: auto; }
}
@container flowed (max-width: 1100px) {
  .flow-tb-label { display: none; }
}
@container flowed (max-width: 620px) {
  .flow-body, .flow-stage { --flow-h: 440px; }
  .flow-tb-export, .flow-acts-label { display: none; }
}
.flow-stage { container: flowstage / inline-size; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.flow-palette { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 2px 0; min-width: 0; }
.flow-pal-hint { display: none; flex: 1 1 160px; min-width: 0; font-size: var(--fs-xs); line-height: 1.3; color: var(--fg-3); padding-left: 4px; }
.flow-pal-btn { display: inline-flex; align-items: center; gap: 6px; flex: none; padding: 4px 9px 4px 6px; min-height: 34px; border: 1px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font-size: var(--fs-xs); font-weight: 500; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
.flow-pal-btn:hover { background: var(--surface-2); border-color: var(--fg-3); }
/* Paleta en una sola fila: si los ocho símbolos con nombre no caben, se muestran solo las formas (el nombre queda en
   la descripción emergente y en la etiqueta accesible) y el espacio libre explica cómo usarlas. */
@container flowstage (max-width: 899.98px) {
  .flow-palette { gap: 4px; }
  .flow-pal-btn { padding: 3px 4px; gap: 0; }
  .flow-pal-text { display: none; }
}
@container flowstage (min-width: 520px) and (max-width: 899.98px) {
  .flow-pal-hint { display: block; }
}
.flow-canvas { position: relative; height: var(--flow-h); min-height: 300px; border: 1px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); overflow: hidden; resize: vertical; max-width: 100%; }
.flow-canvas:focus-visible { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.flow-svg { display: block; width: 100%; height: 100%; user-select: none; -webkit-user-select: none; touch-action: none; cursor: grab; }
.flow-svg.is-panning { cursor: grabbing; }
.flow-empty-hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; padding: 24px; text-align: center; color: var(--fg-3); font-size: var(--fs-sm); }
.flow-empty-hint > div { max-width: 340px; background: var(--surface); border: 1px dashed var(--line-strong); border-radius: var(--r-md); padding: 12px 16px; }
.flow-dot { fill: var(--line-strong); }
.flow-shape { fill: var(--surface); stroke: var(--fg-2); stroke-width: 1.5; }
.flow-extra { fill: none; stroke: var(--fg-2); stroke-width: 1.5; }
.flow-t-terminal .flow-shape { fill: var(--accent-wash); stroke: var(--accent); }
.flow-t-decision .flow-shape { fill: var(--warn-wash); stroke: var(--warn); }
.flow-t-document .flow-shape { fill: var(--info-wash); stroke: var(--info); }
.flow-t-data .flow-shape { fill: var(--good-wash); stroke: var(--good); }
.flow-t-connector .flow-shape { fill: var(--surface-3); stroke: var(--fg-2); }
.flow-t-note .flow-shape { fill: var(--signal-wash); stroke: var(--signal); }
.flow-t-note .flow-extra { stroke: var(--signal); }
.flow-text { fill: var(--fg); font-family: var(--font-body); font-size: 13px; }
.flow-t-connector .flow-text, .flow-t-note .flow-text { font-size: 12px; }
.flow-t-connector .flow-text { font-weight: 600; }
.flow-node { cursor: move; }
.flow-ro .flow-node, .flow-ro .flow-edge-hit { cursor: pointer; }
.flow-node.is-sel .flow-shape, .flow-node.is-target .flow-shape { stroke: var(--accent); stroke-width: 2.5; }
.flow-selbox { fill: none; stroke: var(--accent); stroke-width: 1; stroke-dasharray: 4 3; pointer-events: none; }
.flow-handle { fill: var(--accent); stroke: var(--surface); stroke-width: 1.5; cursor: nwse-resize; }
.flow-port { fill: var(--surface); stroke: var(--accent); stroke-width: 1.5; pointer-events: none; }
.flow-port-hit { fill: transparent; stroke: none; cursor: crosshair; }
.flow-port-g:hover .flow-port { fill: var(--accent); }
.flow-edge-line { fill: none; stroke: var(--fg-2); stroke-width: 1.5; }
.flow-edge.is-note .flow-edge-line { stroke: var(--fg-3); stroke-dasharray: 4 3; }
.flow-edge.is-sel .flow-edge-line { stroke: var(--accent); stroke-width: 2.25; }
.flow-edge-hit { fill: none; stroke: transparent; stroke-width: 14; cursor: pointer; }
.flow-arrow { fill: var(--fg-2); }
.flow-arrow-sel { fill: var(--accent); }
.flow-elabel-bg { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }
.flow-elabel-g.is-sel .flow-elabel-bg { stroke: var(--accent); stroke-width: 1.5; }
.flow-elabel { fill: var(--fg); font-family: var(--font-body); font-size: 12px; font-weight: 600; }
.flow-lane { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }
.flow-lane.is-alt { fill: var(--surface-2); }
.flow-lane-head { fill: var(--surface-3); stroke: var(--line-strong); stroke-width: 1; }
.flow-lane-label { fill: var(--fg-2); font-family: var(--font-body); font-size: 12px; font-weight: 600; }
.flow-temp { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 5 4; pointer-events: none; }
.flow-marquee { fill: var(--accent-wash); fill-opacity: 0.45; stroke: var(--accent); stroke-width: 1; stroke-dasharray: 4 3; pointer-events: none; }
.flow-editbox { position: absolute; z-index: 5; margin: 0; padding: 6px; border: 2px solid var(--accent); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); font-family: var(--font-body); line-height: 1.25; text-align: center; resize: none; box-shadow: var(--shadow-pop); outline: none; }
.flow-editbox.is-input { padding: 3px 6px; font-size: 13px; }
.flow-ghost { position: fixed; z-index: 70; pointer-events: none; transform: translate(-50%, -50%); opacity: 0.85; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--surface); border: 1px solid var(--accent); border-radius: var(--r-md); box-shadow: var(--shadow-pop); font-size: var(--fs-xs); color: var(--fg); }
.flow-help { font-size: var(--fs-xs); color: var(--fg-2); }
.flow-help summary { cursor: pointer; color: var(--fg-2); width: max-content; max-width: 100%; }
.flow-help ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 2px; }
.flow-panel { display: block; padding: 0; min-width: 0; }
.flow-body.is-full { grid-template-columns: minmax(0, 1fr); }
.flow-panel .tab { padding: 8px 8px; }
.flow-panel .tabs { padding: 0 6px; position: sticky; top: 0; z-index: 2; background: var(--surface); border-radius: var(--r-lg) var(--r-lg) 0 0; }
.flow-panel-body { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.flow-sec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.flow-sec + .flow-sec { border-top: 1px solid var(--line); padding-top: 14px; }
.flow-geom { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.flow-geom .field-label { font-size: var(--fs-xs); font-weight: 500; color: var(--fg-2); }
.flow-geom .input { padding: 4px 6px; font-size: var(--fs-sm); }
.flow-items { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.flow-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 5px 6px; border: 1px solid transparent; border-radius: var(--r-sm); background: transparent; color: var(--fg); font-size: var(--fs-sm); cursor: pointer; min-width: 0; }
.flow-item:hover { background: var(--surface-2); }
.flow-item[aria-pressed="true"] { background: var(--accent-wash); border-color: var(--accent); }
.flow-item-num { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--fg-3); min-width: 20px; text-align: right; flex: none; }
.flow-item-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flow-glyph { flex: none; display: block; overflow: visible; }
.flow-conn { display: flex; align-items: center; gap: 6px; font-size: var(--fs-sm); min-width: 0; }
.flow-conn > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.flow-lane-row { display: grid; grid-template-columns: minmax(0, 1fr) 64px 78px; gap: 4px; align-items: center; }
.flow-lane-hdr { font-size: var(--fs-xs); color: var(--fg-3); font-weight: 500; }
.flow-sel:focus:not(:focus-visible) { box-shadow: none; }
.flow-lane-row .input { padding: 4px 6px; font-size: var(--fs-sm); }
.flow-tpls { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.flow-tpl-card { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); min-width: 0; }
.flow-tpl-card p { font-size: var(--fs-sm); color: var(--fg-2); flex: 1; }
.flow-tpl-opts { display: flex; flex-direction: column; gap: 6px; }
.flow-tpl-opt { display: flex; gap: 10px; align-items: flex-start; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; background: var(--surface); }
.flow-tpl-opt:hover { border-color: var(--line-strong); }
.flow-tpl-opt.is-on { border-color: var(--accent); background: var(--accent-wash); }
.flow-tpl-opt input { margin-top: 3px; accent-color: var(--accent); flex: none; }
.flow-tpl-name { font-weight: 600; font-size: var(--fs-sm); }
.flow-tpl-desc { font-size: var(--fs-xs); color: var(--fg-2); }
.flow-export-host { position: fixed; left: -20000px; top: 0; width: 1px; height: 1px; overflow: hidden; pointer-events: none; }
`;
  function ensureCss() {
    if (document.getElementById('css-flow')) return;
    const st = document.createElement('style');
    st.id = 'css-flow';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  ensureCss();

  /* ---------------------------------------------------------------- formas */
  const waveOf = (h) => Math.min(10, h * 0.14);
  const skewOf = (w, h) => Math.min(16, w * 0.12, h * 0.35);
  const subInset = (w) => Math.min(10, w * 0.1);
  const foldOf = (w, h) => Math.min(14, w / 4, h / 4);
  const r1 = (v) => Math.round(v * 10) / 10;

  function shapeD(type, w, h) {
    if (type === 'terminal') {
      const r = Math.min(h / 2, w / 2);
      return `M${r1(r)},0 H${r1(w - r)} A${r1(r)},${r1(r)} 0 0 1 ${r1(w - r)},${h} H${r1(r)} A${r1(r)},${r1(r)} 0 0 1 ${r1(r)},0 Z`;
    }
    if (type === 'decision') return `M${r1(w / 2)},0 L${w},${r1(h / 2)} L${r1(w / 2)},${h} L0,${r1(h / 2)} Z`;
    if (type === 'document') { const a = waveOf(h); return `M0,0 H${w} V${r1(h - a)} Q${r1(w * 0.75)},${r1(h - 3 * a)} ${r1(w / 2)},${r1(h - a)} T0,${r1(h - a)} Z`; }
    if (type === 'data') { const s = skewOf(w, h); return `M${r1(s)},0 H${w} L${r1(w - s)},${h} H0 Z`; }
    if (type === 'connector') { const r = Math.min(w, h) / 2, c = w / 2, m = h / 2; return `M${r1(c - r)},${r1(m)} A${r1(r)},${r1(r)} 0 1 0 ${r1(c + r)},${r1(m)} A${r1(r)},${r1(r)} 0 1 0 ${r1(c - r)},${r1(m)} Z`; }
    if (type === 'note') { const f = foldOf(w, h); return `M0,0 H${r1(w - f)} L${w},${r1(f)} V${h} H0 Z`; }
    return `M0,0 H${w} V${h} H0 Z`;
  }
  function extraD(type, w, h) {
    if (type === 'subprocess') { const i = subInset(w); return `M${r1(i)},0 V${h} M${r1(w - i)},0 V${h}`; }
    if (type === 'note') { const f = foldOf(w, h); return `M${r1(w - f)},0 V${r1(f)} H${w}`; }
    return null;
  }
  /* Área útil para el texto dentro de cada forma (coordenadas locales). La decisión usa wrapDecision. */
  function textBox(n) {
    const { type, w, h } = n;
    if (type === 'terminal') {
      /* óvalo: el ancho útil depende de la altura de las líneas extremas dentro de los extremos redondeados */
      const r = Math.min(h / 2, w / 2), lines = Math.max(1, Math.floor((h - 6) / LH));
      const ye = ((lines - 1) / 2) * LH + 6.5;
      const inset = (ye < r ? r - Math.sqrt(r * r - ye * ye) : r) + 5;
      return { x: inset, y: 3, w: Math.max(8, w - 2 * inset), h: h - 6 };
    }
    if (type === 'document') { const a = waveOf(h); return { x: 8, y: 4, w: w - 16, h: h - 2 * a - 4 }; }
    if (type === 'data') { const s = skewOf(w, h); return { x: s + 4, y: 4, w: w - 2 * s - 8, h: h - 8 }; }
    if (type === 'subprocess') { const i = subInset(w); return { x: i + 5, y: 4, w: w - 2 * i - 10, h: h - 8 }; }
    if (type === 'connector') return { x: 2, y: 2, w: w - 4, h: h - 4 };
    if (type === 'note') { const f = foldOf(w, h); return { x: 9, y: 7, w: w - 18 - f / 2, h: h - 14, left: true, top: true }; }
    return { x: 8, y: 4, w: w - 16, h: h - 8 };
  }
  const fontSizeOf = (type) => (type === 'connector' || type === 'note' ? 12 : 13);

  /* ---------------------------------------------------------------- texto: medición y ajuste de líneas */
  const mctx = (() => { try { return document.createElement('canvas').getContext('2d'); } catch (e) { return null; } })();
  const twCache = new Map();
  const wrapCache = new Map();
  function textWidth(s, size, weight) {
    const key = size + '|' + (weight || 400) + '|' + s;
    let v = twCache.get(key);
    if (v !== undefined) return v;
    if (mctx) { mctx.font = (weight || 400) + ' ' + size + 'px ' + FONT; v = mctx.measureText(s).width; } else v = s.length * size * 0.56;
    if (twCache.size > 6000) twCache.clear();
    twCache.set(key, v);
    return v;
  }
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { twCache.clear(); wrapCache.clear(); }); } catch (e) { /* sin API de fuentes */ }

  /* Ajuste voraz de palabras con ancho por línea widthAt(i); sin límite de líneas. */
  function wrapLines(text, widthAt, size, weight) {
    const W = (s) => textWidth(s, size, weight);
    const lim = (i) => Math.max(8, widthAt(i));
    const out = [];
    let broken = false;
    for (const para of String(text || '').split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); continue; }
      let line = '';
      for (let w of words) {
        while (w.length > 1 && W(w) > lim(out.length + (line ? 1 : 0))) {
          if (line) { out.push(line); line = ''; }
          const L = lim(out.length);
          let i = w.length - 1;
          while (i > 1 && W(w.slice(0, i) + '-') > L) i--;
          out.push(w.slice(0, i) + '-');
          broken = true;
          w = w.slice(i);
        }
        const cand = line ? line + ' ' + w : w;
        if (W(cand) <= lim(out.length)) line = cand;
        else { if (line) out.push(line); line = w; }
      }
      out.push(line);
    }
    while (out.length > 1 && out[out.length - 1] === '') out.pop();
    out.broken = broken;
    return out;
  }
  function truncateLines(lines, maxLines, widthAt, size, weight) {
    if (lines.length <= maxLines) return lines;
    const cut = lines.slice(0, Math.max(1, maxLines));
    const i = cut.length - 1;
    let last = cut[i];
    while (last && textWidth(last + '…', size, weight) > widthAt(i)) last = last.slice(0, -1);
    cut[i] = last.replace(/\s+$/, '') + '…';
    return cut;
  }
  function wrapText(text, maxW, maxLines, size, weight) {
    const key = maxW + '|' + maxLines + '|' + size + '|' + (weight || 400) + '|' + text;
    const hit = wrapCache.get(key);
    if (hit) return hit;
    const wa = () => maxW;
    const lines = truncateLines(wrapLines(text, wa, size, weight), maxLines, wa, size, weight);
    if (wrapCache.size > 3000) wrapCache.clear();
    wrapCache.set(key, lines);
    return lines;
  }
  /* Rombo de decisión: el ancho disponible de cada línea depende de su distancia al centro. */
  function wrapDecision(text, w, h, size) {
    const key = 'D|' + w + '|' + h + '|' + size + '|' + text;
    const hit = wrapCache.get(key);
    if (hit) return hit;
    /* Ancho útil de la línea i de n: ancho del rombo a la altura del borde de las letras (no de la caja de línea). */
    const widthsFor = (n) => (i) => { const yi = Math.abs((i - (n - 1) / 2) * LH) + size * 0.5; return w * (1 - yi / (h / 2)) * 0.94 - 8; };
    /* Se usa la primera n en la que el texto cabe sin partir palabras; si no hay, la primera en la que cabe
       partiéndolas; si no cabe con ninguna, la variante recortada que muestra más texto legible. */
    let fit = null, fitBroken = null, best = null;
    for (let n = 1; n <= 12; n++) {
      const wa = widthsFor(n);
      if (wa(0) < 18) break;
      const lines = wrapLines(text, wa, size);
      if (lines.length <= n) { if (!lines.broken) { fit = lines; break; } if (!fitBroken) fitBroken = lines; continue; }
      const cut = truncateLines(lines, n, wa, size);
      const score = cut.join('').replace(/[…-]/g, '').length - cut.filter((l) => /-$/.test(l)).length * 4;
      if (!best || score > best.score) best = { score, cut };
    }
    const out = fit || fitBroken || (best ? best.cut : ['']);
    if (wrapCache.size > 3000) wrapCache.clear();
    wrapCache.set(key, out);
    return out;
  }

  function NodeText({ n }) {
    const size = fontSizeOf(n.type);
    let lines, top, x, left = false;
    if (n.type === 'decision') {
      lines = wrapDecision(n.text, n.w, n.h, size);
      top = (n.h - lines.length * LH) / 2;
      x = n.w / 2;
    } else {
      const tb = textBox(n);
      const maxLines = Math.max(1, Math.floor(tb.h / LH));
      lines = wrapText(n.text, tb.w * 0.97, maxLines, size);
      top = tb.top ? tb.y : tb.y + (tb.h - lines.length * LH) / 2;
      x = tb.left ? tb.x : tb.x + tb.w / 2;
      left = !!tb.left;
    }
    if (!lines.length || (lines.length === 1 && !lines[0])) return null;
    const base = (LH + size * 0.7) / 2;
    return html`<text class="flow-text" text-anchor=${left ? 'start' : 'middle'}>${lines.map((ln, i) => html`<tspan key=${i} x=${r1(x)} y=${r1(top + i * LH + base)}>${ln}</tspan>`)}</text>`;
  }

  /* ---------------------------------------------------------------- geometría de conexiones */
  const DIRS = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const SIDE_LABEL = { top: 'superior', right: 'derecho', bottom: 'inferior', left: 'izquierdo' };

  function portPoint(n, side) {
    const c = { x: n.x + n.w / 2, y: n.y + n.h / 2 };
    if (n.type === 'connector') { const r = Math.min(n.w, n.h) / 2; const d = DIRS[side]; return { x: c.x + d[0] * r, y: c.y + d[1] * r }; }
    if (side === 'top') return { x: c.x, y: n.y };
    if (side === 'bottom') return { x: c.x, y: n.y + n.h - (n.type === 'document' ? waveOf(n.h) : 0) };
    const s = n.type === 'data' ? skewOf(n.w, n.h) / 2 : 0;
    if (side === 'left') return { x: n.x + s, y: c.y };
    return { x: n.x + n.w - s, y: c.y };
  }
  const near = (a, b) => Math.abs(a - b) < 0.01;
  function simplify(pts) {
    const a = [];
    for (const p of pts) { const q = a[a.length - 1]; if (q && near(q.x, p.x) && near(q.y, p.y)) continue; a.push(p); }
    const out = [];
    for (let i = 0; i < a.length; i++) {
      const p = a[i], prev = out[out.length - 1], next = a[i + 1];
      if (prev && next && ((near(prev.x, p.x) && near(p.x, next.x)) || (near(prev.y, p.y) && near(p.y, next.y)))) continue;
      out.push(p);
    }
    return out;
  }
  const insetRect = (n, d) => ({ x0: n.x + d, y0: n.y + d, x1: n.x + n.w - d, y1: n.y + n.h - d });
  function segHits(p, q, r) {
    if (r.x1 <= r.x0 || r.y1 <= r.y0) return false;
    if (near(p.x, q.x)) { if (p.x <= r.x0 || p.x >= r.x1) return false; return Math.max(p.y, q.y) > r.y0 && Math.min(p.y, q.y) < r.y1; }
    if (near(p.y, q.y)) { if (p.y <= r.y0 || p.y >= r.y1) return false; return Math.max(p.x, q.x) > r.x0 && Math.min(p.x, q.x) < r.x1; }
    return false;
  }
  function gapMid(A, B, axis) {
    if (axis === 'y') {
      if (A.y + A.h <= B.y) return (A.y + A.h + B.y) / 2;
      if (B.y + B.h <= A.y) return (B.y + B.h + A.y) / 2;
      return Math.max(A.y + A.h, B.y + B.h) + 24;
    }
    if (A.x + A.w <= B.x) return (A.x + A.w + B.x) / 2;
    if (B.x + B.w <= A.x) return (B.x + B.w + A.x) / 2;
    return Math.max(A.x + A.w, B.x + B.w) + 24;
  }
  /* Primera línea libre de obstáculos más allá de `ext` en la dirección dir (eje x o y) dentro del rango [lo, hi] del otro eje. */
  function clearLine(nodes, axis, lo, hi, ext, dir) {
    let v = ext;
    for (const n of nodes) {
      const a0 = axis === 'x' ? n.y : n.x, a1 = axis === 'x' ? n.y + n.h : n.x + n.w;
      if (a1 < lo || a0 > hi) continue;
      if (axis === 'x') v = dir > 0 ? Math.max(v, n.x + n.w + 24) : Math.min(v, n.x - 24);
      else v = dir > 0 ? Math.max(v, n.y + n.h + 24) : Math.min(v, n.y - 24);
    }
    return v;
  }
  function routeCandidates(A, B, sA, sB, nodes) {
    const pA = portPoint(A, sA), pB = portPoint(B, sB);
    const [ax, ay] = DIRS[sA], [bx, by] = DIRS[sB];
    const S = 16;
    const a = { x: pA.x + ax * S, y: pA.y + ay * S }, b = { x: pB.x + bx * S, y: pB.y + by * S };
    const hA = ax !== 0, hB = bx !== 0;
    const mids = [];
    if (hA && hB) {
      if (ax === -bx) {
        const mx = (a.x + b.x) / 2;
        mids.push([{ x: mx, y: a.y }, { x: mx, y: b.y }]);
        const my = gapMid(A, B, 'y');
        mids.push([{ x: a.x, y: my }, { x: b.x, y: my }]);
      } else {
        const ext = ax > 0 ? Math.max(a.x, b.x) : Math.min(a.x, b.x);
        mids.push([{ x: ext, y: a.y }, { x: ext, y: b.y }]);
        const clr = clearLine(nodes, 'x', Math.min(a.y, b.y), Math.max(a.y, b.y), ext, ax);
        if (clr !== ext) mids.push([{ x: clr, y: a.y }, { x: clr, y: b.y }]);
      }
    } else if (!hA && !hB) {
      if (ay === -by) {
        const my = (a.y + b.y) / 2;
        mids.push([{ x: a.x, y: my }, { x: b.x, y: my }]);
        const mx = gapMid(A, B, 'x');
        mids.push([{ x: mx, y: a.y }, { x: mx, y: b.y }]);
      } else {
        const ext = ay > 0 ? Math.max(a.y, b.y) : Math.min(a.y, b.y);
        mids.push([{ x: a.x, y: ext }, { x: b.x, y: ext }]);
        const clr = clearLine(nodes, 'y', Math.min(a.x, b.x), Math.max(a.x, b.x), ext, ay);
        if (clr !== ext) mids.push([{ x: a.x, y: clr }, { x: b.x, y: clr }]);
      }
    } else if (hA) mids.push([{ x: b.x, y: a.y }]);
    else mids.push([{ x: a.x, y: b.y }]);
    return mids.map((m) => simplify([pA, a, ...m, b, pB]));
  }
  /* Penalización por cruzar (36) o montarse (80) sobre rutas de otras flechas. */
  function crossPenalty(pts, segs, eid) {
    let pen = 0;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const hz = near(p.y, q.y);
      const x0 = Math.min(p.x, q.x), x1 = Math.max(p.x, q.x), y0 = Math.min(p.y, q.y), y1 = Math.max(p.y, q.y);
      for (const o of segs) {
        if (o.id === eid) continue;
        if (hz && !o.hz) { if (o.x > x0 + 1 && o.x < x1 - 1 && p.y > o.y0 + 1 && p.y < o.y1 - 1) pen += 36; }
        else if (!hz && o.hz) { if (p.x > o.x0 + 1 && p.x < o.x1 - 1 && o.y > y0 + 1 && o.y < y1 - 1) pen += 36; }
        else if (hz && o.hz) { if (Math.abs(o.y - p.y) < 1 && Math.min(x1, o.x1) - Math.max(x0, o.x0) > 18) pen += 80; }
        else if (Math.abs(o.x - p.x) < 1 && Math.min(y1, o.y1) - Math.max(y0, o.y0) > 18) pen += 80;
      }
    }
    return pen;
  }
  function routeScore(pts, A, B, nodes) {
    let len = 0, pen = 0;
    const rA = insetRect(A, 12), rB = insetRect(B, 12);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      len += Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
      if (segHits(p, q, rA)) pen += 600;
      if (segHits(p, q, rB)) pen += 600;
      for (const o of nodes) if (o !== A && o !== B && segHits(p, q, insetRect(o, 2))) pen += 220;
    }
    return len + (pts.length - 2) * 26 + pen;
  }
  /* Ubicación de la etiqueta de una flecha: lo más cerca posible del punto medio del recorrido, sin
     tapar elementos, otras etiquetas, la punta de flecha ni los codos de la propia flecha. Si sobre la
     línea no hay espacio libre (dos elementos muy juntos), se prueba justo al lado de la línea. */
  const rectOverlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const labelSize = (label) => ({ w: Math.ceil(textWidth(label, 12, 600) + 12), h: 18 });
  function labelSpot(pts, label, nodes, placed) {
    const fallback = midOf(pts);
    if (pts.length < 2) return fallback;
    const { w, h } = labelSize(label);
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y); segs.push({ a: pts[i - 1], b: pts[i], s0: total, l, hz: near(pts[i - 1].y, pts[i].y) }); total += l; }
    if (total < 1) return fallback;
    const pointAt = (s) => { for (const g of segs) if (s <= g.s0 + g.l || g === segs[segs.length - 1]) { const t = g.l ? clamp((s - g.s0) / g.l, 0, 1) : 0; return { x: g.a.x + (g.b.x - g.a.x) * t, y: g.a.y + (g.b.y - g.a.y) * t, g }; } return null; };
    const tip = pointAt(total - 5);
    const arrowBox = { x0: tip.x - 6, y0: tip.y - 6, x1: tip.x + 6, y1: tip.y + 6 };
    const boxes = nodes.map((n) => ({ x0: n.x - 2, y0: n.y - 2, x1: n.x + n.w + 2, y1: n.y + n.h + 2 }));
    const area = w * h;
    const half = total / 2;
    let best = null;
    const tryAt = (s, base) => {
      const p = pointAt(s), g = p.g;
      const ext = g.hz ? h : w;
      const room = Math.min(s - g.s0, g.s0 + g.l - s), need = g.hz ? w / 2 : h / 2;
      const bend = room < need ? (need - room) * 2.5 : 0;
      for (const off of [0, ext / 2 + 3, -(ext / 2 + 3), ext / 2 + 19, -(ext / 2 + 19), ext / 2 + 35, -(ext / 2 + 35)]) {
        const sc0 = base + Math.abs(off) * 1.2 + (off ? 0 : bend);
        if (best && sc0 >= best.score) continue;
        const cx = g.hz ? p.x : p.x + off, cy = g.hz ? p.y + off : p.y;
        const r = { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
        let pen = rectOverlap(r, arrowBox) * 4;
        for (const b of boxes) pen += rectOverlap(r, b);
        for (const b of placed) pen += rectOverlap(r, b);
        const score = sc0 + (pen / area) * 1000;
        if (!best || score < best.score - 0.001) best = { x: cx, y: cy, r, score };
      }
    };
    const step = Math.max(4, total / 120);
    tryAt(half, 0);
    for (let d = step; d < half; d += step) {
      const base = d * 0.35;
      if (best.score <= base) break;
      tryAt(half - d, base);
      tryAt(half + d, base);
    }
    placed.push(best.r);
    return { x: best.x, y: best.y };
  }
  /* Rutas ortogonales (en codo) entre los lados más convenientes. Dos pasadas: la segunda evita compartir
     un mismo puerto entre entradas y salidas. Con opts.only (ids de elementos que se están arrastrando) y
     opts.base (rutas ya calculadas), solo se recalculan las flechas de esos elementos: el arrastre
     sigue siendo fluido en diagramas grandes y al soltar se recalcula todo. */
  function computeRoutes(nodes, edges, opts) {
    const only = opts && opts.only && opts.base ? opts.only : null;
    const base = only ? opts.base : null;
    const touches = (e) => only.has(e.from) || only.has(e.to);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const pick = (e, usage, segs) => {
      const A = byId.get(e.from), B = byId.get(e.to);
      if (!A || !B || A === B) return null;
      let best = null;
      for (const sA of SIDES) for (const sB of SIDES) {
        let up = 0;
        if (usage) {
          /* En una decisión cada salida (Sí / No) va por un vértice propio y nunca por el de la entrada. */
          const dA = A.type === 'decision', dB = B.type === 'decision';
          for (const u of usage.get(A.id + ':' + sA) || []) if (u.id !== e.id) up += u.dir === 'out' ? (dA ? 90 : 18) : (dA ? 200 : 70);
          for (const u of usage.get(B.id + ':' + sB) || []) if (u.id !== e.id) up += u.dir === 'in' ? 18 : (dB ? 200 : 70);
        }
        for (const pts of routeCandidates(A, B, sA, sB, nodes)) {
          const s = routeScore(pts, A, B, nodes) + up + (segs ? crossPenalty(pts, segs, e.id) : 0);
          if (!best || s < best.score - 0.001) best = { score: s, pts, sA, sB };
        }
      }
      return best;
    };
    const first = edges.map((e) => (only && !touches(e) ? base.get(e.id) || null : pick(e, null)));
    const usage = new Map();
    const add = (k, v) => { if (!usage.has(k)) usage.set(k, []); usage.get(k).push(v); };
    edges.forEach((e, i) => { const r = first[i]; if (!r) return; add(e.from + ':' + r.sA, { id: e.id, dir: 'out' }); add(e.to + ':' + r.sB, { id: e.id, dir: 'in' }); });
    const segs = [];
    edges.forEach((e, i) => {
      const r = first[i]; if (!r) return;
      for (let j = 1; j < r.pts.length; j++) {
        const p = r.pts[j - 1], q = r.pts[j];
        if (near(p.y, q.y)) segs.push({ id: e.id, hz: true, y: p.y, x0: Math.min(p.x, q.x), x1: Math.max(p.x, q.x) });
        else segs.push({ id: e.id, hz: false, x: p.x, y0: Math.min(p.y, q.y), y1: Math.max(p.y, q.y) });
      }
    });
    /* segunda pasada secuencial: cada flecha ve los puertos ya elegidos por las anteriores */
    const reassign = (e, prev, r) => {
      if (prev && prev.sA === r.sA && prev.sB === r.sB) return;
      const drop = (k) => { const l = usage.get(k); if (l) usage.set(k, l.filter((u) => u.id !== e.id)); };
      if (prev) { drop(e.from + ':' + prev.sA); drop(e.to + ':' + prev.sB); }
      add(e.from + ':' + r.sA, { id: e.id, dir: 'out' }); add(e.to + ':' + r.sB, { id: e.id, dir: 'in' });
    };
    const out = new Map();
    const pending = [];
    edges.forEach((e, i) => {
      if (only && !touches(e)) { if (first[i]) out.set(e.id, first[i]); return; }
      const r = pick(e, usage, segs);
      if (!r) return;
      reassign(e, first[i], r);
      const A = byId.get(e.from), B = byId.get(e.to);
      out.set(e.id, { pts: r.pts, sA: r.sA, sB: r.sB, d: roundedPath(r.pts), mid: midOf(r.pts), note: A.type === 'note' || B.type === 'note' });
      if (e.label) pending.push(e);
    });
    /* etiquetas: las conservadas ocupan su lugar; las nuevas buscan un espacio libre */
    const placed = [];
    if (only) for (const e of edges) { const r = out.get(e.id); if (r && e.label && !touches(e)) { const { w, h } = labelSize(e.label); placed.push({ x0: r.mid.x - w / 2, y0: r.mid.y - h / 2, x1: r.mid.x + w / 2, y1: r.mid.y + h / 2 }); } }
    for (const e of pending) { const r = out.get(e.id); r.mid = labelSpot(r.pts, e.label, nodes, placed); }
    return out;
  }
  function roundedPath(pts, rad = 7) {
    if (!pts.length) return '';
    let d = 'M' + r1(pts[0].x) + ',' + r1(pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p = pts[i], p2 = pts[i + 1];
      const l1 = Math.abs(p.x - p0.x) + Math.abs(p.y - p0.y), l2 = Math.abs(p2.x - p.x) + Math.abs(p2.y - p.y);
      const r = Math.min(rad, l1 / 2, l2 / 2);
      const ux = Math.sign(p0.x - p.x), uy = Math.sign(p0.y - p.y), vx = Math.sign(p2.x - p.x), vy = Math.sign(p2.y - p.y);
      d += ' L' + r1(p.x + ux * r) + ',' + r1(p.y + uy * r) + ' Q' + r1(p.x) + ',' + r1(p.y) + ' ' + r1(p.x + vx * r) + ',' + r1(p.y + vy * r);
    }
    const l = pts[pts.length - 1];
    return d + ' L' + r1(l.x) + ',' + r1(l.y);
  }
  function midOf(pts) {
    const L = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y); L.push(l); total += l; }
    let half = total / 2;
    for (let i = 1; i < pts.length; i++) {
      const l = L[i - 1];
      if (half <= l) { const t = l ? half / l : 0; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t }; }
      half -= l;
    }
    return pts[0] || { x: 0, y: 0 };
  }

  /* ---------------------------------------------------------------- carriles */
  const lanesOn = (flow) => !!(flow && Array.isArray(flow.lanes) && flow.lanes.length && !flow.lanesHidden);
  function laneGeom(flow, nodes) {
    if (!lanesOn(flow)) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + n.w); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y + n.h); }
    if (!nodes.length) { minX = LANE_LABEL_W + 40; maxX = minX + 600; minY = 0; maxY = 0; }
    const left = Math.min(0, floorG(minX - LANE_LABEL_W - 32));
    const right = Math.max(left + LANE_LABEL_W + 720, ceilG(maxX + 48));
    let y = 0;
    const bands = flow.lanes.map((l) => { const h = clamp(Math.round(PM.num(l.h, LANE_H)), 64, 4000); const b = { id: l.id, name: l.name || '', y, h }; y += h; return b; });
    const top = Math.min(0, floorG(minY - 24));
    if (top < 0) { bands[0].h += -top; bands[0].y = top; }
    const last = bands[bands.length - 1];
    const need = ceilG(maxY + 24);
    if (need > last.y + last.h) last.h = need - last.y;
    return { left, right, bands, labelW: LANE_LABEL_W, top: bands[0].y, bottom: last.y + last.h };
  }
  function laneIndexAt(geom, y) {
    if (!geom) return -1;
    for (let i = 0; i < geom.bands.length; i++) { const b = geom.bands[i]; if (y >= b.y && y < b.y + b.h) return i; }
    return y < geom.top ? 0 : geom.bands.length - 1;
  }

  /* ---------------------------------------------------------------- utilidades de diagrama */
  function normalizeFlow(d) {
    d = d || {};
    const nodes = [];
    const seen = new Set();
    for (const n of Array.isArray(d.nodes) ? d.nodes : []) {
      if (!n || n.id === undefined || n.id === null || seen.has(String(n.id))) continue;
      const id = String(n.id);
      seen.add(id);
      const type = TYPES[n.type] ? n.type : 'process';
      const def = TYPES[type];
      nodes.push({ id, type, x: Math.round(PM.num(n.x)), y: Math.round(PM.num(n.y)), w: Math.max(def.min[0], Math.round(PM.num(n.w, def.w))), h: Math.max(def.min[1], Math.round(PM.num(n.h, def.h))), text: n.text === undefined || n.text === null ? '' : String(n.text) });
    }
    const ids = new Set(nodes.map((n) => n.id));
    const eSeen = new Set();
    const edges = [];
    for (const e of Array.isArray(d.edges) ? d.edges : []) {
      if (!e || e.id === undefined || e.id === null || eSeen.has(String(e.id))) continue;
      const from = String(e.from), to = String(e.to);
      if (!ids.has(from) || !ids.has(to) || from === to) continue;
      eSeen.add(String(e.id));
      edges.push({ id: String(e.id), from, to, label: e.label === undefined || e.label === null ? '' : String(e.label) });
    }
    const lanes = (Array.isArray(d.lanes) ? d.lanes : []).filter((l) => l && l.id !== undefined && l.id !== null).map((l) => {
      const o = { id: String(l.id), name: l.name === undefined || l.name === null ? '' : String(l.name) };
      if (l.h !== undefined && l.h !== null) o.h = clamp(Math.round(PM.num(l.h, LANE_H)), 64, 4000);
      return o;
    });
    const out = { ...d, name: String(d.name || ''), description: String(d.description || ''), nodes, edges, lanes };
    if (d.lanesHidden) out.lanesHidden = true; else delete out.lanesHidden;
    return out;
  }
  const flowName = (f) => (f && String(f.name || '').trim()) || 'Diagrama sin nombre';
  const shortText = (s, max = 42) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > max ? t.slice(0, max - 1) + '…' : t; };
  const nodeLabel = (n, i) => (i + 1) + '. ' + (shortText(n.text, 38) || '(sin texto)') + ' · ' + TYPES[n.type].label;
  const overlaps = (a, b, m = 0) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
  function freeSpot(nodes, x, y, w, h) {
    let yy = y;
    for (let i = 0; i < 80; i++) { const r = { x, y: yy, w, h }; if (!nodes.some((n) => overlaps(r, n, 8))) return { x, y: yy }; yy += 24; }
    return { x, y };
  }
  function contentBBox(nodes, routes, geom) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const n of nodes) { take(n.x, n.y); take(n.x + n.w, n.y + n.h); }
    if (routes) for (const r of routes.values()) { for (const p of r.pts) take(p.x, p.y); take(r.mid.x - 30, r.mid.y - 12); take(r.mid.x + 30, r.mid.y + 12); }
    if (geom) { take(geom.left, geom.top); take(geom.right, geom.bottom); }
    if (!Number.isFinite(x0)) return null;
    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }
  function fitView(bb, size) {
    if (!bb || !size.w || !size.h) return { x: 40, y: 40, k: 1 };
    const pad = 28;
    const k = clamp(Math.min((size.w - 2 * pad) / bb.w, (size.h - 2 * pad) / bb.h), MIN_K, 1);
    return { k, x: (size.w - bb.w * k) / 2 - bb.x * k, y: (size.h - bb.h * k) / 2 - bb.y * k };
  }

  /* Vista inicial: el diagrama abre legible. Si cabe completo con un zoom ≥ FIT_MIN_K (texto de 13 px ≥ ~10 px),
     se ajusta a la vista; si no, abre a READ_K anclado en el punto de partida (el terminal «Inicio» sin flechas
     de entrada o, en su defecto, el primer elemento) y conserva el borde superior izquierdo del contenido (con la
     columna de carriles) mientras ese punto quede a la vista. «Ajustar a la vista» sigue dando el panorama. */
  const READ_K = 0.85;
  const FIT_MIN_K = 0.75;
  function startNode(nodes, edges) {
    const list = (nodes || []).filter((n) => n.type !== 'note');
    if (!list.length) return null;
    const notes = new Set((nodes || []).filter((n) => n.type === 'note').map((n) => n.id));
    const hasIn = new Set((edges || []).filter((e) => !notes.has(e.from)).map((e) => e.to));
    const first = (arr) => arr.reduce((best, n) => (!best || n.y + n.x < best.y + best.x ? n : best), null);
    return first(list.filter((n) => n.type === 'terminal' && !hasIn.has(n.id))) || first(list.filter((n) => !hasIn.has(n.id))) || first(list);
  }
  function initialView(bb, size, nodes, edges) {
    const v = fitView(bb, size);
    if (!bb || !size.w || !size.h || v.k >= FIT_MIN_K) return v;
    const k = READ_K, pad = 16;
    const a = startNode(nodes, edges);
    /* por eje: parte del borde del contenido o, si así el inicio quedaría fuera, del propio elemento de inicio;
       en horizontal, si el contenido cabe a lo ancho, lo centra */
    const axis = (b0, bLen, a0, aLen, view, center) => {
      const span = view - 2 * pad;
      if (bLen * k <= span) return pad + (center ? (span - bLen * k) / 2 : 0) - b0 * k;
      let w0 = b0;
      if (a0 !== null && (a0 + aLen - b0) * k > span) w0 = Math.max(b0, a0 - 24);
      return pad - w0 * k;
    };
    return { k, x: axis(bb.x, bb.w, a ? a.x : null, a ? a.w : 0, size.w, true), y: axis(bb.y, bb.h, a ? a.y : null, a ? a.h : 0, size.h, false) };
  }

  /* ---------------------------------------------------------------- plantillas */
  const N = (id, type, cxp, cyp, text, w, h) => { const d = TYPES[type]; w = w || d.w; h = h || d.h; return { id, type, x: snap(cxp - w / 2), y: snap(cyp - h / 2), w, h, text }; };
  const E = (from, to, label) => ({ from, to, label: label || '' });
  const TEMPLATES = [
    { id: 'blank', name: 'En blanco', defaultName: 'Nuevo diagrama de flujo', description: '', summary: 'Lienzo vacío para dibujar cualquier proceso desde cero.', nodes: [], edges: [], lanes: [] },
    {
      id: 'cambios', name: 'Control integrado de cambios (4.6)', defaultName: 'Control integrado de cambios',
      description: 'Proceso 4.6 Realizar el control integrado de cambios: desde la solicitud hasta la actualización de las líneas base y la comunicación de la decisión.',
      summary: 'Solicitud, registro, análisis de impacto, decisión del CCB, actualización de líneas base y comunicación. Con carriles por responsable.',
      lanes: [{ id: 'l1', name: 'Solicitante', h: 176 }, { id: 'l2', name: 'Director del proyecto', h: 176 }, { id: 'l3', name: 'Comité de control de cambios (CCB)', h: 192 }],
      nodes: [
        N('inicio', 'terminal', 240, 88, 'Inicio: necesidad de cambio', 160, 48),
        N('solicitud', 'document', 448, 88, 'Diligenciar la solicitud de cambio', 160, 80),
        N('registro', 'process', 448, 264, 'Registrar en el registro de cambios'),
        N('impacto', 'process', 656, 264, 'Analizar el impacto en alcance, cronograma, costo, calidad y riesgos', 160, 80),
        N('ccb', 'decision', 864, 448, 'Decisión del CCB: ¿aprobado?', 176, 112),
        N('actualizar', 'process', 864, 264, 'Actualizar el plan para la dirección y las líneas base', 160, 80),
        N('rechazo', 'process', 1104, 448, 'Registrar el rechazo y su justificación'),
        N('comunicar', 'process', 1104, 264, 'Comunicar la decisión a los interesados'),
        N('fin', 'terminal', 1104, 88, 'Fin'),
      ],
      edges: [E('inicio', 'solicitud'), E('solicitud', 'registro'), E('registro', 'impacto'), E('ccb', 'actualizar', 'Sí'), E('impacto', 'ccb'), E('ccb', 'rechazo', 'No'), E('actualizar', 'comunicar'), E('rechazo', 'comunicar'), E('comunicar', 'fin')],
    },
    {
      id: 'recepcion', name: 'Recepción e inspección de equipo en obra', defaultName: 'Recepción e inspección de equipo en obra',
      description: 'Recepción de andamios, formaletas y accesorios en obra: verificación contra la remisión, inspección visual y tratamiento de novedades.',
      summary: 'Llegada, verificación contra la remisión, inspección visual, decisión de conformidad y reporte de novedades.',
      lanes: [],
      nodes: [
        N('llegada', 'terminal', 200, 48, 'Llegada del vehículo a obra', 176, 48),
        N('remision', 'document', 200, 152, 'Verificar cantidades contra la remisión', 176, 72),
        N('inspeccion', 'process', 200, 264, 'Inspección visual: deformaciones, soldaduras y corrosión', 176, 72),
        N('conforme', 'decision', 200, 392, '¿Equipo conforme?', 176, 112),
        N('almacenar', 'process', 200, 528, 'Almacenar en obra y firmar la remisión', 176, 64),
        N('fin', 'terminal', 200, 632, 'Equipo disponible para montaje', 176, 48),
        N('novedad', 'document', 504, 392, 'Reportar novedad: faltantes o daños', 192, 80),
        N('separar', 'process', 504, 528, 'Separar piezas no conformes para devolución a bodega', 192, 80),
      ],
      edges: [E('llegada', 'remision'), E('remision', 'inspeccion'), E('inspeccion', 'conforme'), E('conforme', 'almacenar', 'Sí'), E('conforme', 'novedad', 'No'), E('novedad', 'separar'), E('separar', 'almacenar', 'Conformes'), E('almacenar', 'fin')],
    },
    {
      id: 'incidentes', name: 'Gestión de incidentes', defaultName: 'Gestión de incidentes',
      description: 'Tratamiento de incidentes del proyecto (4.3 Dirigir y gestionar el trabajo del proyecto): registro, priorización, escalamiento, solución y cierre.',
      summary: 'Registro, priorización, asignación, escalamiento, solución, verificación y cierre con lección aprendida.',
      lanes: [],
      nodes: [
        N('inicio', 'terminal', 200, 48, 'Incidente identificado', 176, 48),
        N('registrar', 'process', 200, 144, 'Registrar en el registro de incidentes', 176, 64),
        N('priorizar', 'process', 200, 248, 'Clasificar y priorizar: alta, media o baja', 176, 64),
        N('asignar', 'process', 200, 352, 'Asignar responsable y fecha objetivo', 176, 64),
        N('equipo', 'decision', 200, 472, '¿Se resuelve dentro del equipo?', 176, 112),
        N('escalar', 'process', 456, 472, 'Escalar al patrocinador o al cliente', 176, 64),
        N('solucion', 'process', 200, 600, 'Implementar la solución', 176, 64),
        N('resuelto', 'decision', 200, 720, '¿Incidente resuelto?', 176, 112),
        N('cerrar', 'process', 200, 848, 'Cerrar el incidente y registrar la lección aprendida', 176, 72),
        N('fin', 'terminal', 200, 952, 'Fin', 144, 48),
        N('nota', 'note', 456, 248, 'Prioridad alta: informar al patrocinador el mismo día.', 192, 64),
      ],
      edges: [E('inicio', 'registrar'), E('registrar', 'priorizar'), E('priorizar', 'asignar'), E('asignar', 'equipo'), E('equipo', 'solucion', 'Sí'), E('equipo', 'escalar', 'No'), E('escalar', 'solucion'), E('solucion', 'resuelto'), E('resuelto', 'asignar', 'No'), E('resuelto', 'cerrar', 'Sí'), E('cerrar', 'fin'), E('nota', 'priorizar')],
    },
    {
      id: 'entregables', name: 'Aprobación de entregables (5.5)', defaultName: 'Aprobación de entregables',
      description: 'Del entregable terminado al entregable aceptado: 8.3 Controlar la calidad (entregable verificado) y 5.5 Validar el alcance (entregable aceptado o solicitud de cambio).',
      summary: 'Inspección de calidad, corrección de defectos, revisión con el cliente, acta de aceptación o solicitud de cambio.',
      lanes: [],
      nodes: [
        N('inicio', 'terminal', 200, 48, 'Entregable terminado', 176, 48),
        N('inspeccion', 'process', 200, 152, 'Inspeccionar contra los criterios de aceptación (8.3)', 176, 72),
        N('cumple', 'decision', 200, 280, '¿Cumple los requisitos?', 176, 112),
        N('corregir', 'process', 456, 280, 'Corregir el defecto (reparación de defecto)', 176, 64),
        N('verificado', 'document', 200, 408, 'Entregable verificado', 176, 64),
        N('revision', 'process', 200, 520, 'Revisión con el cliente o la interventoría (5.5)', 176, 80),
        N('aceptado', 'decision', 200, 648, '¿Aceptado por el cliente?', 176, 112),
        N('solicitud', 'document', 456, 648, 'Solicitud de cambio (4.6)', 176, 64),
        N('cambios', 'terminal', 456, 760, 'Ir a control integrado de cambios', 192, 48),
        N('acta', 'document', 200, 776, 'Acta de aceptación de entregables firmada', 176, 72),
        N('fin', 'terminal', 200, 880, 'Fin', 144, 48),
        N('nota', 'note', 456, 520, 'Actualizar el estado en el registro de entregables.', 192, 64),
      ],
      edges: [E('inicio', 'inspeccion'), E('inspeccion', 'cumple'), E('cumple', 'corregir', 'No'), E('corregir', 'inspeccion'), E('cumple', 'verificado', 'Sí'), E('verificado', 'revision'), E('revision', 'aceptado'), E('aceptado', 'solicitud', 'No'), E('solicitud', 'cambios'), E('aceptado', 'acta', 'Sí'), E('acta', 'fin'), E('nota', 'revision')],
    },
  ];
  const tplById = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
  function flowFromTemplate(tplId, name) {
    const t = tplById(tplId);
    const map = {};
    const nodes = t.nodes.map((n) => { const id = PM.uid('n'); map[n.id] = id; return { ...n, id }; });
    const edges = t.edges.map((e) => ({ id: PM.uid('e'), from: map[e.from], to: map[e.to], label: e.label }));
    const lanes = t.lanes.map((l) => ({ id: PM.uid('l'), name: l.name, h: l.h }));
    const now = PM.nowIso();
    return { name: String(name || t.defaultName).trim() || t.defaultName, description: t.description, nodes, edges, lanes, createdAt: now, updatedAt: now };
  }
  PM.flowTools = { templates: TEMPLATES, fromTemplate: flowFromTemplate, normalize: normalizeFlow, types: TYPES, initialView, startNode };

  /* ---------------------------------------------------------------- historial en memoria (por diagrama) */
  const HISTORIES = new Map();
  const histOf = (path) => { let h = HISTORIES.get(path); if (!h) { h = { undo: [], redo: [], key: null, t: 0 }; HISTORIES.set(path, h); } return h; };

  /* ---------------------------------------------------------------- piezas visuales */
  function Glyph({ type, size = 28 }) {
    const w = size, h = Math.round(size * 0.72);
    const gw = type === 'connector' ? h - 4 : w - 2, gh = type === 'connector' ? h - 4 : type === 'decision' ? h - 1 : h - 4;
    const ex = extraD(type, gw, gh);
    return html`<svg class=${'flow-glyph flow-t-' + type} width=${w} height=${h} viewBox=${'0 0 ' + w + ' ' + h} aria-hidden="true">
      <g transform=${'translate(' + r1((w - gw) / 2) + ',' + r1((h - gh) / 2) + ')'}><path class="flow-shape" d=${shapeD(type, gw, gh)} style="stroke-width:1.25" />${ex ? html`<path class="flow-extra" d=${ex} style="stroke-width:1.25" />` : null}</g>
    </svg>`;
  }

  function LanesLayer({ geom }) {
    if (!geom) return null;
    return html`<g class="flow-lanes">
      ${geom.bands.map((b, i) => {
        const lines = wrapText(b.name || 'Carril ' + (i + 1), geom.labelW - 18, Math.max(1, Math.floor((b.h - 12) / LH)), 12, 600);
        const top = b.y + (b.h - lines.length * LH) / 2;
        return html`<g key=${b.id}>
          <rect class=${cx('flow-lane', i % 2 === 1 && 'is-alt')} x=${geom.left} y=${b.y} width=${geom.right - geom.left} height=${b.h} />
          <rect class="flow-lane-head" x=${geom.left} y=${b.y} width=${geom.labelW} height=${b.h} />
          <text class="flow-lane-label" text-anchor="middle">${lines.map((ln, j) => html`<tspan key=${j} x=${geom.left + geom.labelW / 2} y=${r1(top + j * LH + 12)}>${ln}</tspan>`)}</text>
        </g>`;
      })}
    </g>`;
  }

  function EdgeLabel({ r, label, live }) {
    if (!label) return null;
    const tw = textWidth(label, 12, 600);
    const w = Math.ceil(tw + 12), h = 18;
    return html`<g pointer-events=${live ? undefined : 'none'} style=${live ? 'cursor:pointer' : undefined}><rect class="flow-elabel-bg" x=${r1(r.mid.x - w / 2)} y=${r1(r.mid.y - h / 2)} width=${w} height=${h} rx="3" /><text class="flow-elabel" x=${r1(r.mid.x)} y=${r1(r.mid.y + 4.2)} text-anchor="middle">${label}</text></g>`;
  }

  /* SVG limpio para exportar (sin retícula, puertos ni selección). Se monta un instante fuera de pantalla
     para que PM.svgToString resuelva los estilos calculados. */
  function buildExportSvg(flow) {
    const nodes = flow.nodes;
    const geom = laneGeom(flow, nodes);
    const routes = computeRoutes(nodes, flow.edges);
    const bb = contentBBox(nodes, routes, geom) || { x: 0, y: 0, w: 200, h: 120 };
    const pad = 24;
    const W = Math.ceil(bb.w + pad * 2), Hh = Math.ceil(bb.h + pad * 2);
    const mid = PM.uid('fxa');
    const host = document.createElement('div');
    host.className = 'flow-export-host';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
    PM.lib.render(html`<svg xmlns="http://www.w3.org/2000/svg" width=${W} height=${Hh} viewBox=${'0 0 ' + W + ' ' + Hh}>
      <title>${flowName(flow)}</title>
      <defs><marker id=${mid} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path class="flow-arrow" d="M0,0 L10,5 L0,10 Z" /></marker></defs>
      <g transform=${'translate(' + r1(pad - bb.x) + ',' + r1(pad - bb.y) + ')'}>
        <${LanesLayer} geom=${geom} />
        ${flow.edges.map((e) => { const r = routes.get(e.id); if (!r) return null; return html`<g key=${e.id} class=${cx('flow-edge', r.note && 'is-note')}><path class="flow-edge-line" d=${r.d} marker-end=${r.note ? undefined : 'url(#' + mid + ')'} /></g>`; })}
        ${nodes.map((n) => { const ex = extraD(n.type, n.w, n.h); return html`<g key=${n.id} class=${'flow-node flow-t-' + n.type} transform=${'translate(' + n.x + ',' + n.y + ')'}><path class="flow-shape" d=${shapeD(n.type, n.w, n.h)} />${ex ? html`<path class="flow-extra" d=${ex} />` : null}<${NodeText} n=${n} /></g>`; })}
        ${flow.edges.map((e) => { const r = routes.get(e.id); if (!r || !e.label) return null; return html`<g key=${e.id} class="flow-elabel-g"><${EdgeLabel} r=${r} label=${e.label} /></g>`; })}
      </g>
    </svg>`, host);
    const svg = host.querySelector('svg');
    setTimeout(() => { try { PM.lib.render(null, host); } catch (e) { /* ya desmontado */ } host.remove(); }, 0);
    return svg;
  }

  /* ---------------------------------------------------------------- editor */
  function FlowEditor({ pid, fid, canWrite, picker, onDuplicate, onDelete }) {
    const path = PM.paths.flow(pid, fid);
    const doc = PM.useDoc(path);
    const flow = useMemo(() => (doc.data ? normalizeFlow(doc.data) : null), [doc.data]);
    const hist = histOf(path);
    const [, force] = useReducer((x) => x + 1, 0);
    const [view, setView] = useState({ x: 40, y: 40, k: 1 });
    const [size, setSize] = useState({ w: 0, h: 0 });
    const [sel, setSel] = useState({ nodes: [], edge: null });
    const [hover, setHover] = useState(null);
    const [tr, setTr] = useState(null);
    const [editing, setEditingState] = useState(null);
    const [ghost, setGhost] = useState(null);
    const [tab, setTab] = useState('props');
    const [panning, setPanning] = useState(false);
    const [panelOpen, setPanelOpen] = useState(() => PM.prefs.get('flow.panel', true) !== false);
    const togglePanel = () => { const v = !panelOpen; setPanelOpen(v); PM.prefs.set('flow.panel', v); };
    const wrapRef = useRef();
    const svgRef = useRef();
    const editRef = useRef(null);
    const fittedRef = useRef(false);
    const dragRef = useRef(null);
    const pointers = useRef(new Map());
    const palRef = useRef(null);
    const H = useRef({}).current;
    const ids = useMemo(() => ({ dots: PM.uid('fdot'), arrow: PM.uid('farr'), arrowSel: PM.uid('fars'), form: PM.uid('ff') }), []);

    const nodes = flow ? flow.nodes : [];
    const edges = flow ? flow.edges : [];
    const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const selNodes = sel.nodes.filter((id) => nodeMap.has(id));
    const selEdge = sel.edge && edges.some((e) => e.id === sel.edge) ? sel.edge : null;
    const liveNodes = useMemo(() => {
      if (!tr) return nodes;
      if (tr.kind === 'move') return nodes.map((n) => (tr.ids.includes(n.id) ? { ...n, x: n.x + tr.dx, y: n.y + tr.dy } : n));
      if (tr.kind === 'resize') return nodes.map((n) => (n.id === tr.id ? { ...n, w: tr.w, h: tr.h } : n));
      return nodes;
    }, [nodes, tr]);
    const baseRoutes = useMemo(() => computeRoutes(nodes, edges), [nodes, edges]);
    const routes = useMemo(() => {
      if (!tr || (tr.kind !== 'move' && tr.kind !== 'resize')) return baseRoutes;
      return computeRoutes(liveNodes, edges, { only: new Set(tr.kind === 'move' ? tr.ids : [tr.id]), base: baseRoutes });
    }, [baseRoutes, liveNodes, edges, tr]);
    const geom = useMemo(() => (flow ? laneGeom(flow, liveNodes) : null), [flow, liveNodes]);

    const selKey = selNodes.join(',') + '|' + (selEdge || '');
    useEffect(() => { if (selKey !== '|') setTab('props'); }, [selKey]);
    const R = useRef({});
    R.current = { flow, view, size, sel: { nodes: selNodes, edge: selEdge }, canWrite, nodeMap, liveNodes };
    const setEditing = (v) => { editRef.current = v; setEditingState(v); };

    /* ---- escritura e historial ---- */
    H.commit = (next, key) => {
      if (!R.current.canWrite || !doc.data) return;
      const now = Date.now();
      if (!(key && hist.key === key && now - hist.t < 1500)) { hist.undo.push(doc.data); if (hist.undo.length > 120) hist.undo.shift(); }
      hist.redo = [];
      hist.key = key || null;
      hist.t = now;
      doc.save({ ...next, updatedAt: PM.nowIso() });
      PM.touchProject(pid);
    };
    H.undo = () => {
      if (!R.current.canWrite || !hist.undo.length) return;
      const prev = hist.undo.pop();
      hist.redo.push(doc.data);
      hist.key = null;
      doc.save({ ...prev, updatedAt: PM.nowIso() });
      PM.touchProject(pid);
      force();
    };
    H.redo = () => {
      if (!R.current.canWrite || !hist.redo.length) return;
      const next = hist.redo.pop();
      hist.undo.push(doc.data);
      hist.key = null;
      doc.save({ ...next, updatedAt: PM.nowIso() });
      PM.touchProject(pid);
      force();
    };
    const update = (patch, key) => H.commit({ ...R.current.flow, ...patch }, key);
    H.updateNode = (id, patch, key) => update({ nodes: R.current.flow.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }, key);
    H.updateEdge = (id, patch, key) => update({ edges: R.current.flow.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }, key);

    /* ---- coordenadas y vista ---- */
    const toWorld = (clientX, clientY) => { if (!svgRef.current) return { x: 0, y: 0 }; const r = svgRef.current.getBoundingClientRect(); const v = R.current.view; return { x: (clientX - r.left - v.x) / v.k, y: (clientY - r.top - v.y) / v.k }; };
    H.zoomAt = (factor, px, py) => setView((v) => { const k = clamp(v.k * factor, MIN_K, MAX_K); const f = k / v.k; return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f }; });
    H.zoomCenter = (factor) => { const s = R.current.size; H.zoomAt(factor, s.w / 2, s.h / 2); };
    H.resetZoom = () => { const s = R.current.size; H.zoomAt(1 / R.current.view.k, s.w / 2, s.h / 2); };
    H.fit = () => { const f = R.current.flow; if (!f) return; const g = laneGeom(f, f.nodes); setView(fitView(contentBBox(f.nodes, computeRoutes(f.nodes, f.edges), g), R.current.size)); };
    H.reveal = (id) => {
      const n = R.current.nodeMap.get(id); if (!n) return;
      const v = R.current.view, s = R.current.size;
      const sx = n.x * v.k + v.x, sy = n.y * v.k + v.y;
      if (sx < 8 || sy < 8 || sx + n.w * v.k > s.w - 8 || sy + n.h * v.k > s.h - 8) setView({ ...v, x: s.w / 2 - (n.x + n.w / 2) * v.k, y: s.h / 2 - (n.y + n.h / 2) * v.k });
    };
    H.viewCenter = () => { const v = R.current.view, s = R.current.size; return { x: (s.w / 2 - v.x) / v.k, y: (s.h / 2 - v.y) / v.k }; };

    useLayoutEffect(() => {
      const el = wrapRef.current;
      if (!el) return undefined;
      const measure = () => { const w = el.clientWidth, h = el.clientHeight; setSize((s) => (s.w === w && s.h === h ? s : { w, h })); return { w, h }; };
      const s0 = measure();
      if (!fittedRef.current && R.current.flow && s0.w) { fittedRef.current = true; const f = R.current.flow; setView(initialView(contentBBox(f.nodes, computeRoutes(f.nodes, f.edges), laneGeom(f, f.nodes)), s0, f.nodes, f.edges)); }
      if (typeof ResizeObserver === 'undefined') return undefined;
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      return () => ro.disconnect();
    }, [!!flow]);

    /* rueda: desplaza; con Ctrl/⌘ (o gesto de pellizco del trackpad) acerca o aleja */
    useEffect(() => {
      const svg = svgRef.current;
      if (!svg) return undefined;
      const onWheel = (e) => {
        e.preventDefault();
        const r = svg.getBoundingClientRect();
        if (e.ctrlKey || e.metaKey) { H.zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022)), e.clientX - r.left, e.clientY - r.top); return; }
        const m = e.deltaMode === 1 ? 16 : 1;
        const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * m, dy = (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * m;
        setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      };
      svg.addEventListener('wheel', onWheel, { passive: false });
      return () => svg.removeEventListener('wheel', onWheel);
    }, [!!flow]);

    /* ---- arrastres (escuchas en window; se escribe solo al soltar) ---- */
    const winMove = useMemo(() => (e) => H.onMove(e), []);
    const winUp = useMemo(() => (e) => H.onUp(e, false), []);
    const winCancel = useMemo(() => (e) => H.onUp(e, true), []);
    const listen = (on) => {
      const f = on ? 'addEventListener' : 'removeEventListener';
      window[f]('pointermove', winMove); window[f]('pointerup', winUp); window[f]('pointercancel', winCancel);
    };
    useEffect(() => () => listen(false), []);
    const begin = (e, d) => { dragRef.current = { ...d, sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId }; listen(true); };
    const focusCanvas = () => { try { wrapRef.current && wrapRef.current.focus({ preventScroll: true }); } catch (err) { /* sin foco */ } };
    H.focusCanvas = focusCanvas;
    const trackPointer = (e) => {
      if (e.pointerType !== 'touch') return false;
      if (e.isPrimary) pointers.current.clear();
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const [p, q] = [...pointers.current.values()];
        const r = svgRef.current.getBoundingClientRect();
        dragRef.current = { kind: 'pinch', dist: Math.hypot(p.x - q.x, p.y - q.y) || 1, cxp: (p.x + q.x) / 2 - r.left, cyp: (p.y + q.y) / 2 - r.top, v0: R.current.view, moved: true };
        setTr(null);
        listen(true);
        return true;
      }
      return false;
    };
    H.bgDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      focusCanvas();
      if (editRef.current) H.finishEdit(true);
      if (trackPointer(e)) return;
      if (e.shiftKey) { const p = toWorld(e.clientX, e.clientY); begin(e, { kind: 'marquee', x0: p.x, y0: p.y, base: R.current.sel.nodes }); return; }
      begin(e, { kind: 'pan', v0: R.current.view, clear: true });
    };
    H.nodeDown = (e, id) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      focusCanvas();
      if (editRef.current && editRef.current.id !== id) H.finishEdit(true);
      if (trackPointer(e)) return;
      let cur = R.current.sel.nodes;
      if (e.shiftKey) {
        const has = cur.includes(id);
        cur = has ? cur.filter((x) => x !== id) : [...cur, id];
        setSel({ nodes: cur, edge: null });
        if (has || !R.current.canWrite) return;
      } else if (!cur.includes(id)) { cur = [id]; setSel({ nodes: cur, edge: null }); }
      else setSel({ nodes: cur, edge: null });
      if (!R.current.canWrite) { begin(e, { kind: 'pan', v0: R.current.view, clear: false }); return; }
      begin(e, { kind: 'move', ids: cur, clickId: id, shift: e.shiftKey, touch: e.pointerType === 'touch' });
    };
    H.edgeDown = (e, id) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      focusCanvas();
      if (editRef.current) H.finishEdit(true);
      if (trackPointer(e)) return;
      setSel({ nodes: [], edge: id });
      begin(e, { kind: 'pan', v0: R.current.view, clear: false, edgeId: id, touch: e.pointerType === 'touch' });
    };
    H.handleDown = (e, id) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      const n = R.current.nodeMap.get(id); if (!n) return;
      begin(e, { kind: 'resize', id, w0: n.w, h0: n.h, type: n.type });
    };
    H.portDown = (e, id, side) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      focusCanvas();
      const n = R.current.nodeMap.get(id); if (!n) return;
      const p = portPoint(n, side);
      begin(e, { kind: 'connect', from: id, side, px: p.x, py: p.y });
      setTr({ kind: 'connect', from: id, side, px: p.x, py: p.y, x: p.x, y: p.y, target: null });
    };
    const nodeAt = (p, exclude) => {
      const list = R.current.liveNodes;
      for (let i = list.length - 1; i >= 0; i--) { const n = list[i]; if (n.id !== exclude && p.x >= n.x - 4 && p.x <= n.x + n.w + 4 && p.y >= n.y - 4 && p.y <= n.y + n.h + 4) return n; }
      return null;
    };
    H.onMove = (e) => {
      const d = dragRef.current; if (!d) return;
      if (d.kind === 'pinch') {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [p, q] = [...pointers.current.values()]; if (!q) return;
        const r = svgRef.current.getBoundingClientRect();
        const dist = Math.hypot(p.x - q.x, p.y - q.y) || 1;
        const mx = (p.x + q.x) / 2 - r.left, my = (p.y + q.y) / 2 - r.top;
        const k = clamp(d.v0.k * dist / d.dist, MIN_K, MAX_K), f = k / d.v0.k;
        setView({ k, x: mx - (d.cxp - d.v0.x) * f, y: my - (d.cyp - d.v0.y) * f });
        return;
      }
      if (e.pointerId !== d.pid) return;
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const sdx = e.clientX - d.sx, sdy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(sdx, sdy) < 3) return;
      d.moved = true;
      const k = R.current.view.k;
      if (d.kind === 'pan') { setPanning(true); setView({ ...d.v0, x: d.v0.x + sdx, y: d.v0.y + sdy }); return; }
      if (d.kind === 'move') { const dx = sdx / k, dy = sdy / k; setTr({ kind: 'move', ids: d.ids, dx: e.altKey ? Math.round(dx) : snap(dx), dy: e.altKey ? Math.round(dy) : snap(dy) }); return; }
      if (d.kind === 'resize') {
        const min = TYPES[d.type].min;
        let w = Math.max(min[0], snap(d.w0 + sdx / k)), h = Math.max(min[1], snap(d.h0 + sdy / k));
        if (d.type === 'connector') { w = h = Math.max(w, h); }
        setTr({ kind: 'resize', id: d.id, w, h });
        return;
      }
      if (d.kind === 'connect') { const p = toWorld(e.clientX, e.clientY); const t = nodeAt(p, d.from); setTr({ kind: 'connect', from: d.from, side: d.side, px: d.px, py: d.py, x: p.x, y: p.y, target: t ? t.id : null }); return; }
      if (d.kind === 'marquee') { const p = toWorld(e.clientX, e.clientY); setTr({ kind: 'marquee', x0: d.x0, y0: d.y0, x1: p.x, y1: p.y }); }
    };
    H.onUp = (e, cancelled) => {
      if (pointers.current.has(e.pointerId)) pointers.current.delete(e.pointerId);
      const d = dragRef.current; if (!d) return;
      if (d.kind === 'pinch') { if (pointers.current.size < 2) { pointers.current.clear(); dragRef.current = null; listen(false); } return; }
      if (e.pointerId !== d.pid) return;
      dragRef.current = null;
      listen(false);
      setPanning(false);
      const f = R.current.flow;
      if (cancelled || !f) { setTr(null); return; }
      const k = R.current.view.k;
      if (d.kind === 'pan') {
        if (!d.moved) {
          if (d.clear) setSel({ nodes: [], edge: null });
          if (d.edgeId && d.touch) H.tap('edge', d.edgeId);
        }
        return;
      }
      if (d.kind === 'move') {
        const dx0 = (e.clientX - d.sx) / k, dy0 = (e.clientY - d.sy) / k;
        const dx = e.altKey ? Math.round(dx0) : snap(dx0), dy = e.altKey ? Math.round(dy0) : snap(dy0);
        setTr(null);
        if (d.moved && (dx || dy)) update({ nodes: f.nodes.map((n) => (d.ids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)) });
        else if (!d.moved) {
          if (!d.shift && d.ids.length > 1) setSel({ nodes: [d.clickId], edge: null });
          if (d.touch) H.tap('node', d.clickId);
        }
        return;
      }
      if (d.kind === 'resize') {
        setTr(null);
        const min = TYPES[d.type].min;
        let w = Math.max(min[0], snap(d.w0 + (e.clientX - d.sx) / k)), h = Math.max(min[1], snap(d.h0 + (e.clientY - d.sy) / k));
        if (d.type === 'connector') { w = h = Math.max(w, h); }
        if (d.moved && (w !== d.w0 || h !== d.h0)) H.updateNode(d.id, { w, h });
        return;
      }
      if (d.kind === 'connect') {
        setTr(null);
        const p = toWorld(e.clientX, e.clientY);
        const t = nodeAt(p, d.from);
        if (t) { H.addEdge(d.from, t.id, ''); return; }
        if (d.moved && Math.hypot(p.x - d.px, p.y - d.py) > 40) {
          const def = TYPES.process;
          const n = { id: PM.uid('n'), type: 'process', x: snap(p.x - def.w / 2), y: snap(p.y - def.h / 2), w: def.w, h: def.h, text: def.text };
          update({ nodes: [...f.nodes, n], edges: [...f.edges, { id: PM.uid('e'), from: d.from, to: n.id, label: '' }] });
          setSel({ nodes: [n.id], edge: null });
        }
        return;
      }
      if (d.kind === 'marquee') {
        setTr(null);
        if (!d.moved) { setSel({ nodes: d.base, edge: null }); return; }
        const p = toWorld(e.clientX, e.clientY);
        const r = { x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y), w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0) };
        const inside = f.nodes.filter((n) => overlaps(r, n)).map((n) => n.id);
        setSel({ nodes: [...new Set([...d.base, ...inside])], edge: null });
      }
    };
    /* doble toque en pantallas táctiles (el doble clic del mouse usa el evento nativo) */
    const lastTap = useRef({ id: null, t: 0 });
    H.tap = (kind, id) => {
      const now = Date.now();
      if (lastTap.current.id === kind + id && now - lastTap.current.t < 400) { lastTap.current = { id: null, t: 0 }; if (kind === 'node') H.startEdit(id); else H.startEdgeEdit(id); return; }
      lastTap.current = { id: kind + id, t: now };
    };

    /* ---- operaciones ---- */
    H.addNode = (type, at, opts = {}) => {
      const f = R.current.flow; if (!f || !R.current.canWrite) return null;
      const def = TYPES[type];
      let text = opts.text !== undefined ? opts.text : def.text;
      if (type === 'terminal' && opts.text === undefined && f.nodes.some((n) => n.type === 'terminal')) text = 'Fin';
      const c = at || H.viewCenter();
      const pos = opts.exact ? { x: snap(c.x - def.w / 2), y: snap(c.y - def.h / 2) } : freeSpot(f.nodes, snap(c.x - def.w / 2), snap(c.y - def.h / 2), def.w, def.h);
      const n = { id: PM.uid('n'), type, x: pos.x, y: pos.y, w: def.w, h: def.h, text };
      const extraEdges = opts.connectFrom && f.nodes.some((x) => x.id === opts.connectFrom) ? [{ id: PM.uid('e'), from: opts.connectFrom, to: n.id, label: '' }] : [];
      update({ nodes: [...f.nodes, n], edges: [...f.edges, ...extraEdges] });
      setSel({ nodes: [n.id], edge: null });
      return n;
    };
    H.addEdge = (from, to, label) => {
      const f = R.current.flow; if (!f || !R.current.canWrite) return false;
      if (!from || !to || from === to) { PM.toast('Elige dos elementos distintos para conectarlos.'); return false; }
      const A = R.current.nodeMap.get(from), B = R.current.nodeMap.get(to);
      if (f.edges.some((e) => e.from === from && e.to === to)) { PM.toast('Ya existe una flecha de «' + shortText(A && A.text, 30) + '» a «' + shortText(B && B.text, 30) + '».'); return false; }
      const e = { id: PM.uid('e'), from, to, label: label || '' };
      update({ edges: [...f.edges, e] });
      setSel({ nodes: [], edge: e.id });
      return true;
    };
    H.deleteSel = () => {
      const f = R.current.flow; const s = R.current.sel;
      if (!f || !R.current.canWrite || (!s.nodes.length && !s.edge)) return;
      const gone = new Set(s.nodes);
      update({ nodes: f.nodes.filter((n) => !gone.has(n.id)), edges: f.edges.filter((e) => e.id !== s.edge && !gone.has(e.from) && !gone.has(e.to)) });
      setSel({ nodes: [], edge: null });
    };
    H.duplicateSel = () => {
      const f = R.current.flow; const s = R.current.sel;
      if (!f || !R.current.canWrite || !s.nodes.length) return;
      const map = {};
      const copies = f.nodes.filter((n) => s.nodes.includes(n.id)).map((n) => { const id = PM.uid('n'); map[n.id] = id; return { ...n, id, x: n.x + 24, y: n.y + 24 }; });
      const ce = f.edges.filter((e) => map[e.from] && map[e.to]).map((e) => ({ ...e, id: PM.uid('e'), from: map[e.from], to: map[e.to] }));
      update({ nodes: [...f.nodes, ...copies], edges: [...f.edges, ...ce] });
      setSel({ nodes: copies.map((n) => n.id), edge: null });
    };
    H.nudge = (dx, dy) => {
      const f = R.current.flow; const s = R.current.sel;
      if (!f || !R.current.canWrite || !s.nodes.length) return;
      update({ nodes: f.nodes.map((n) => (s.nodes.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)) }, 'nudge:' + s.nodes.join(','));
    };
    H.align = (axis) => {
      const f = R.current.flow; const s = R.current.sel;
      if (!f || s.nodes.length < 2) return;
      const first = f.nodes.find((n) => n.id === s.nodes[0]);
      const c = axis === 'x' ? first.x + first.w / 2 : first.y + first.h / 2;
      update({ nodes: f.nodes.map((n) => (!s.nodes.includes(n.id) ? n : axis === 'x' ? { ...n, x: Math.round(c - n.w / 2) } : { ...n, y: Math.round(c - n.h / 2) })) });
    };
    H.toggleLanes = () => {
      const f = R.current.flow; if (!f || !R.current.canWrite) return;
      if (lanesOn(f)) { update({ lanesHidden: true }); return; }
      if (f.lanes.length) { const next = { ...f }; delete next.lanesHidden; H.commit(next); }
      else { const next = { ...f, lanes: DEFAULT_LANES.map((name) => ({ id: PM.uid('l'), name, h: LANE_H })) }; delete next.lanesHidden; H.commit(next); }
      setTab('diagram');
      setTimeout(() => H.revealLanes(), 40);
    };
    /* Tras activar carriles, desplaza la vista para que la columna de nombres quede visible. */
    H.revealLanes = () => {
      const f = R.current.flow; if (!f) return;
      const g = laneGeom(f, f.nodes); if (!g) return;
      setView((v) => {
        const lx = g.left * v.k + v.x, ty = g.top * v.k + v.y;
        if (lx >= 0 && ty >= 0) return v;
        return { ...v, x: lx < 0 ? 12 - g.left * v.k : v.x, y: ty < 0 ? 12 - g.top * v.k : v.y };
      });
    };

    /* ---- edición de texto en el lienzo ---- */
    H.startEdit = (id) => { if (!R.current.canWrite) return; const n = R.current.nodeMap.get(id); if (!n) return; setSel({ nodes: [id], edge: null }); setEditing({ kind: 'node', id, value: n.text, orig: n.text }); };
    H.startEdgeEdit = (id) => { if (!R.current.canWrite) return; const e = R.current.flow.edges.find((x) => x.id === id); if (!e) return; setSel({ nodes: [], edge: id }); setEditing({ kind: 'edge', id, value: e.label, orig: e.label }); };
    H.finishEdit = (save) => {
      const ed = editRef.current; if (!ed) return;
      setEditing(null);
      if (save && ed.value !== ed.orig) {
        if (ed.kind === 'node') H.updateNode(ed.id, { text: ed.value });
        else H.updateEdge(ed.id, { label: String(ed.value).trim() });
      }
      focusCanvas();
    };

    /* ---- teclado ---- */
    H.onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;
      if (mod && lower === 'z' && !e.shiftKey) { e.preventDefault(); H.undo(); return; }
      if (mod && (lower === 'y' || (lower === 'z' && e.shiftKey))) { e.preventDefault(); H.redo(); return; }
      if (!mod && (key === '+' || key === '=')) { e.preventDefault(); H.zoomCenter(1.2); return; }
      if (!mod && (key === '-' || key === '_')) { e.preventDefault(); H.zoomCenter(1 / 1.2); return; }
      if (key === 'Escape') { setSel({ nodes: [], edge: null }); return; }
      if (mod && lower === 'a') { e.preventDefault(); setSel({ nodes: R.current.flow.nodes.map((n) => n.id), edge: null }); return; }
      const s = R.current.sel;
      if (key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : GRID;
        const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0, dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
        if (s.nodes.length && R.current.canWrite) H.nudge(dx, dy);
        else setView((v) => ({ ...v, x: v.x - dx * 4, y: v.y - dy * 4 }));
        return;
      }
      if (!R.current.canWrite) return;
      if (mod && lower === 'd') { e.preventDefault(); H.duplicateSel(); return; }
      if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); H.deleteSel(); return; }
      if ((key === 'Enter' || key === 'F2') && !mod) {
        if (s.nodes.length === 1) { e.preventDefault(); H.startEdit(s.nodes[0]); }
        else if (s.edge) { e.preventDefault(); H.startEdgeEdit(s.edge); }
      }
    };

    /* ---- paleta: clic agrega en el centro; arrastrar suelta en el punto ---- */
    H.palDown = (e, type) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      palRef.current = { type, sx: e.clientX, sy: e.clientY, pid: e.pointerId, dragging: false, suppress: false };
      const move = (ev) => {
        const p = palRef.current; if (!p || ev.pointerId !== p.pid) return;
        if (!p.dragging && Math.hypot(ev.clientX - p.sx, ev.clientY - p.sy) < 6) return;
        p.dragging = true;
        setGhost({ type, x: ev.clientX, y: ev.clientY });
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
        const p = palRef.current; if (!p) return;
        setGhost(null);
        if (!p.dragging) return;
        p.suppress = true;
        setTimeout(() => { if (palRef.current === p) palRef.current = null; }, 0);
        const r = svgRef.current && svgRef.current.getBoundingClientRect();
        if (r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { H.addNode(type, toWorld(ev.clientX, ev.clientY), { exact: true }); focusCanvas(); }
      };
      const cancel = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); setGhost(null); palRef.current = null; };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel);
    };
    H.palClick = (type) => {
      const p = palRef.current;
      if (p && p.suppress) { palRef.current = null; return; }
      palRef.current = null;
      const n = H.addNode(type);
      if (n) setTimeout(() => H.reveal(n.id), 0);
    };

    /* ---- descargas ---- */
    const exportJson = () => {
      const f = R.current.flow; if (!f) return;
      const out = { format: 'gestor-pmbok-flujo', version: 1, name: f.name, description: f.description, nodes: f.nodes, edges: f.edges, lanes: f.lanes, lanesHidden: !!f.lanesHidden, exportedAt: PM.nowIso() };
      PM.download('flujo_' + (PM.slug(flowName(f)) || 'diagrama') + '.json', JSON.stringify(out, null, 2));
    };
    const getSvg = () => (R.current.flow ? buildExportSvg(R.current.flow) : null);
    const svgName = () => 'flujo_' + (PM.slug(flowName(R.current.flow)) || 'diagrama') + '.svg';
    const downloadSvg = () => { const el = getSvg(); if (el) PM.download(svgName(), PM.svgToString(el)); };

    /* ---- render ---- */
    if (doc.loading) return html`<div class="flow-editor">${picker}<${ui.Loading} rows=${5} /></div>`;
    if (!flow) {
      return html`<div class="flow-editor">${picker}<${ui.Empty} icon="flow" title="Este diagrama ya no está disponible">Puede que otra persona lo haya eliminado. Elige otro diagrama de la lista.</${ui.Empty}></div>`;
    }

    const single = selNodes.length === 1 ? selNodes[0] : null;
    const gs = view.k >= 0.75 ? 16 : view.k >= 0.375 ? 32 : 64;
    const sp = gs * view.k;
    const ox = ((((view.x - sp / 2) % sp) + sp) % sp), oy = ((((view.y - sp / 2) % sp) + sp) % sp);
    const lanesVisible = lanesOn(flow);
    const zoomPct = Math.round(view.k * 100) + ' %';
    const showPorts = (id) => canWrite && !editing && (!tr || tr.kind === 'connect') && (hover === id || single === id) && (!tr || tr.from === id);

    const toolbar = html`<div class="toolbar flow-toolbar" role="group" aria-label="Herramientas del diagrama">
      ${canWrite ? html`<div class="btn-group">
        <${ui.Button} size="sm" icon="undo" aria-label="Deshacer (Ctrl+Z)" title="Deshacer (Ctrl+Z)" disabled=${!hist.undo.length} onClick=${H.undo}><span class="flow-tb-label">Deshacer</span></${ui.Button}>
        <${ui.Button} size="sm" icon="redo" aria-label="Rehacer (Ctrl+Y)" title="Rehacer (Ctrl+Y)" disabled=${!hist.redo.length} onClick=${H.redo}><span class="flow-tb-label">Rehacer</span></${ui.Button}>
      </div>
      <div class="btn-group">
        <${ui.Button} size="sm" icon="copy" aria-label="Duplicar selección (Ctrl+D)" title="Duplicar selección (Ctrl+D)" disabled=${!selNodes.length} onClick=${H.duplicateSel}><span class="flow-tb-label">Duplicar</span></${ui.Button}>
        <${ui.Button} size="sm" icon="trash" aria-label="Eliminar selección (Supr)" title="Eliminar selección (Supr)" disabled=${!selNodes.length && !selEdge} onClick=${H.deleteSel}><span class="flow-tb-label">Eliminar</span></${ui.Button}>
      </div>
      <div class="toolbar-sep"></div>` : null}
      <div class="btn-group">
        <${ui.Button} size="sm" icon="zoom-out" aria-label="Alejar" title="Alejar (−)" onClick=${() => H.zoomCenter(1 / 1.2)} />
        <${ui.Button} size="sm" class="flow-zoom" aria-label=${'Zoom ' + zoomPct + '. Restablecer al 100 %'} title="Restablecer al 100 %" onClick=${H.resetZoom}>${zoomPct}</${ui.Button}>
        <${ui.Button} size="sm" icon="zoom-in" aria-label="Acercar" title="Acercar (+)" onClick=${() => H.zoomCenter(1.2)} />
      </div>
      <${ui.Button} size="sm" icon="expand" onClick=${H.fit}>Ajustar a la vista</${ui.Button}>
      ${canWrite ? html`<${ui.Button} size="sm" icon="layers" aria-pressed=${lanesVisible ? 'true' : 'false'} title="Carriles por responsable (diagrama multifuncional)" onClick=${H.toggleLanes}>Carriles</${ui.Button}>` : null}
      <${ui.Button} size="sm" icon="settings" aria-pressed=${panelOpen ? 'true' : 'false'} title=${panelOpen ? 'Ocultar el panel de propiedades para ampliar el lienzo' : 'Mostrar el panel de propiedades'} onClick=${togglePanel}>Panel</${ui.Button}>
      <div class="spacer"></div>
      <div class="flow-tb-export">
        <${ui.SvgDownload} getSvg=${getSvg} filename=${svgName()} />
        <${ui.Button} size="sm" icon="download" onClick=${exportJson}>Exportar JSON</${ui.Button}>
      </div>
    </div>`;

    const palette = canWrite ? html`<div class="flow-palette" role="group" aria-label="Paleta de símbolos: haz clic para agregar en el centro o arrastra al lienzo">
      ${TYPE_KEYS.map((t) => html`<button key=${t} type="button" class="flow-pal-btn" title=${TYPES[t].label + ': ' + TYPES[t].hint + '. Clic: agregar en el centro de la vista; arrastrar: soltar en el lienzo.'} aria-label=${'Agregar símbolo de ' + TYPES[t].name} data-type=${t}
        onPointerDown=${(e) => H.palDown(e, t)} onClick=${() => H.palClick(t)}><${Glyph} type=${t} /><span class="flow-pal-text">${TYPES[t].label}</span></button>`)}
      <span class="flow-pal-hint" aria-hidden="true">Clic en un símbolo: se agrega al centro · Arrástralo para soltarlo donde quieras</span>
    </div>` : null;

    const marker = (id, cls) => html`<marker id=${id} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path class=${cls} d="M0,0 L10,5 L0,10 Z" /></marker>`;

    const edgeEls = edges.map((e) => {
      const r = routes.get(e.id); if (!r) return null;
      const isSel = selEdge === e.id;
      return html`<g key=${e.id} class=${cx('flow-edge', isSel && 'is-sel', r.note && 'is-note')} data-edge=${e.id}
        onPointerDown=${(ev) => H.edgeDown(ev, e.id)} onDblClick=${(ev) => { ev.stopPropagation(); H.startEdgeEdit(e.id); }}>
        <path class="flow-edge-hit" d=${r.d} />
        <path class="flow-edge-line" d=${r.d} marker-end=${r.note ? undefined : 'url(#' + (isSel ? ids.arrowSel : ids.arrow) + ')'} />
      </g>`;
    });
    const labelEls = edges.map((e) => {
      const r = routes.get(e.id);
      if (!r || !e.label || (editing && editing.kind === 'edge' && editing.id === e.id)) return null;
      return html`<g key=${e.id} class=${cx('flow-elabel-g', selEdge === e.id && 'is-sel')} data-edge-label=${e.id}
        onPointerDown=${(ev) => H.edgeDown(ev, e.id)} onDblClick=${(ev) => { ev.stopPropagation(); H.startEdgeEdit(e.id); }}><title>${'Flecha: ' + e.label}</title><${EdgeLabel} r=${r} label=${e.label} live=${true} /></g>`;
    });

    const nodeEls = liveNodes.map((n) => {
      const isSel = selNodes.includes(n.id);
      const isTarget = tr && tr.kind === 'connect' && tr.target === n.id;
      const ex = extraD(n.type, n.w, n.h);
      const ports = showPorts(n.id);
      return html`<g key=${n.id} class=${cx('flow-node', 'flow-t-' + n.type, isSel && 'is-sel', isTarget && 'is-target')} data-node=${n.id} transform=${'translate(' + n.x + ',' + n.y + ')'}
        onPointerDown=${(ev) => H.nodeDown(ev, n.id)} onDblClick=${(ev) => { ev.stopPropagation(); H.startEdit(n.id); }}
        onPointerEnter=${() => setHover(n.id)} onPointerLeave=${() => setHover((h) => (h === n.id ? null : h))}>
        <title>${TYPES[n.type].label + ': ' + (n.text || '(sin texto)')}</title>
        <path class="flow-shape" d=${shapeD(n.type, n.w, n.h)} />
        ${ex ? html`<path class="flow-extra" d=${ex} />` : null}
        ${editing && editing.kind === 'node' && editing.id === n.id ? null : html`<${NodeText} n=${n} />`}
        ${isSel ? html`<rect class="flow-selbox" x="-4" y="-4" width=${n.w + 8} height=${n.h + 8} rx="3" />` : null}
        ${isSel && single === n.id && canWrite && !editing ? html`<rect class="flow-handle" data-handle="resize" x=${n.w - 5} y=${n.h - 5} width="10" height="10" rx="2" onPointerDown=${(ev) => H.handleDown(ev, n.id)}><title>Arrastra para cambiar el tamaño</title></rect>` : null}
        ${ports ? SIDES.map((s) => { const p = portPoint(n, s); return html`<g key=${s} class="flow-port-g"><circle class="flow-port-hit" data-side=${s} cx=${r1(p.x - n.x)} cy=${r1(p.y - n.y)} r="10" onPointerDown=${(ev) => H.portDown(ev, n.id, s)}><title>${'Arrastra desde el punto ' + SIDE_LABEL[s] + ' hasta otro elemento para conectarlos'}</title></circle><circle class="flow-port" cx=${r1(p.x - n.x)} cy=${r1(p.y - n.y)} r="4.5" /></g>`; }) : null}
      </g>`;
    });

    let overlay = null;
    if (editing) {
      if (editing.kind === 'node') {
        const n = nodeMap.get(editing.id);
        if (n) {
          const k = view.k;
          /* el cuadro crece con el texto para que ninguna línea quede oculta */
          const fs = clamp(13 * k, 12, 22);
          const w = Math.min(Math.max(n.w * k, 168), Math.max(168, size.w - 8));
          const need = wrapLines(editing.value || ' ', () => w - 20, fs).length * fs * 1.25 + 18;
          const h = Math.min(Math.max(n.h * k, 60, need), Math.max(60, size.h - 8), 260);
          const left = clamp(n.x * k + view.x - (w - n.w * k) / 2, 4, Math.max(4, size.w - w - 4)), top = clamp(n.y * k + view.y - (h - n.h * k) / 2, 4, Math.max(4, size.h - h - 4));
          overlay = html`<textarea class="flow-editbox" aria-label="Texto del elemento (Intro guarda, Mayús+Intro nueva línea, Esc cancela)" autoFocus
            style=${'left:' + r1(left) + 'px;top:' + r1(top) + 'px;width:' + r1(w) + 'px;height:' + r1(h) + 'px;font-size:' + r1(fs) + 'px'}
            value=${editing.value} ref=${(el) => { if (el && !el.dataset.init) { el.dataset.init = '1'; el.focus(); el.select(); } }}
            onInput=${(e) => { const v = { ...editRef.current, value: e.currentTarget.value }; editRef.current = v; setEditingState(v); }}
            onKeyDown=${(e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); H.finishEdit(false); } else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); H.finishEdit(true); } }}
            onBlur=${() => H.finishEdit(true)}></textarea>`;
        }
      } else {
        const r = routes.get(editing.id);
        if (r) {
          const left = clamp(r.mid.x * view.k + view.x - 70, 4, Math.max(4, size.w - 144)), top = clamp(r.mid.y * view.k + view.y - 15, 4, Math.max(4, size.h - 34));
          overlay = html`<input class="flow-editbox is-input" aria-label="Etiqueta de la flecha (Intro guarda, Esc cancela)" placeholder="Sí, No…" style=${'left:' + left + 'px;top:' + top + 'px;width:140px;height:30px'}
            value=${editing.value} ref=${(el) => { if (el && !el.dataset.init) { el.dataset.init = '1'; el.focus(); el.select(); } }}
            onInput=${(e) => { const v = { ...editRef.current, value: e.currentTarget.value }; editRef.current = v; setEditingState(v); }}
            onKeyDown=${(e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); H.finishEdit(false); } else if (e.key === 'Enter') { e.preventDefault(); H.finishEdit(true); } }}
            onBlur=${() => H.finishEdit(true)} />`;
        }
      }
    }

    let temp = null;
    if (tr && tr.kind === 'connect') {
      const T = tr.target ? nodeMap.get(tr.target) : null;
      const tx = T ? T.x + T.w / 2 : tr.x, ty = T ? T.y + T.h / 2 : tr.y;
      temp = html`<path class="flow-temp" d=${'M' + r1(tr.px) + ',' + r1(tr.py) + ' L' + r1(tx) + ',' + r1(ty)} />`;
    } else if (tr && tr.kind === 'marquee') {
      temp = html`<rect class="flow-marquee" x=${Math.min(tr.x0, tr.x1)} y=${Math.min(tr.y0, tr.y1)} width=${Math.abs(tr.x1 - tr.x0)} height=${Math.abs(tr.y1 - tr.y0)} />`;
    }

    /* Encabezado compacto: con el selector de diagramas a la vista (pantallas angostas), el selector ocupa el lugar
       del título (que queda para lectores de pantalla) y comparte fila con «Acciones»; la descripción se recorta a
       dos líneas con «Ver más». Así el lienzo empieza más arriba. */
    const head = html`<div class="flow-head">
      ${picker}
      <div class="flow-head-text">
        <h2 class="flow-head-title">${flowName(flow)}</h2>
        <div class="xsmall faint">${nodes.length} ${nodes.length === 1 ? 'elemento' : 'elementos'} · ${edges.length} ${edges.length === 1 ? 'flecha' : 'flechas'}${lanesVisible ? ' · ' + flow.lanes.length + ' carriles' : ''} · Actualizado ${PM.fmt.datetime(flow.updatedAt)}</div>
        ${flow.description ? html`<${ClampText} text=${flow.description} />` : null}
      </div>
      <div class="flow-head-acts">
        <${ui.Dropdown} label="Acciones del diagrama" buttonLabel=${html`<span class="flow-acts-label">Acciones</span>`} variant="" items=${[
          canWrite && { label: 'Renombrar', icon: 'edit', onClick: async () => { const v = await PM.promptText({ title: 'Renombrar diagrama', label: 'Nombre del diagrama', value: flow.name, confirmText: 'Guardar nombre' }); if (v) update({ name: v }); } },
          canWrite && { label: 'Duplicar diagrama', icon: 'copy', onClick: () => onDuplicate(R.current.flow) },
          { label: 'Descargar SVG', icon: 'image', onClick: downloadSvg },
          { label: 'Exportar JSON', icon: 'download', onClick: exportJson },
          canWrite && 'sep',
          canWrite && { label: 'Eliminar diagrama', icon: 'trash', danger: true, onClick: () => onDelete(fid, R.current.flow) },
        ]} />
      </div>
    </div>`;

    return html`<div class="flow-editor" data-fid=${fid}>
      ${head}
      ${toolbar}
      <div class=${cx('flow-body', !panelOpen && 'is-full')}>
        <div class="flow-stage">
          ${palette}
          <div class="flow-canvas" ref=${wrapRef} tabindex="0" role="region" aria-roledescription="lienzo" aria-label=${'Lienzo del diagrama «' + flowName(flow) + '». Flechas: mover la selección; Supr: eliminar; Intro: editar texto; Ctrl+Z: deshacer. El panel de propiedades permite editar sin mouse.'}
            onKeyDown=${(e) => H.onKey(e)}>
            <svg ref=${svgRef} class=${cx('flow-svg', panning && 'is-panning', !canWrite && 'flow-ro')} onPointerDown=${(e) => H.bgDown(e)} aria-hidden="true">
              <defs>
                <pattern id=${ids.dots} width=${sp} height=${sp} patternUnits="userSpaceOnUse" patternTransform=${'translate(' + r1(ox) + ',' + r1(oy) + ')'}><circle class="flow-dot" cx=${sp / 2} cy=${sp / 2} r="1.1" /></pattern>
                ${marker(ids.arrow, 'flow-arrow')}
                ${marker(ids.arrowSel, 'flow-arrow-sel')}
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill=${'url(#' + ids.dots + ')'} />
              <g transform=${'translate(' + r1(view.x) + ',' + r1(view.y) + ') scale(' + view.k + ')'}>
                <${LanesLayer} geom=${geom} />
                ${edgeEls}
                ${nodeEls}
                ${labelEls}
                ${temp}
              </g>
            </svg>
            ${!nodes.length ? html`<div class="flow-empty-hint"><div>${canWrite ? 'Lienzo vacío. Haz clic en un símbolo de la paleta para agregarlo en el centro, o arrástralo hasta aquí. También puedes usar el formulario «Agregar elemento» del panel de propiedades.' : 'Este diagrama todavía no tiene elementos.'}</div></div>` : null}
            ${overlay}
          </div>
          <details class="flow-help">
            <summary>Atajos de teclado y gestos</summary>
            <ul>
              <li>Arrastra el fondo o usa la rueda para desplazarte; <span class="kbd">Ctrl</span> + rueda o pellizco para acercar o alejar.</li>
              ${canWrite ? html`
              <li>Clic para seleccionar; <span class="kbd">Mayús</span> + clic agrega a la selección; <span class="kbd">Mayús</span> + arrastrar en el fondo selecciona por área.</li>
              <li>Doble clic (o <span class="kbd">Intro</span>) edita el texto de un elemento o la etiqueta de una flecha.</li>
              <li>Pasa el puntero sobre un elemento y arrastra desde uno de sus puntos azules hasta otro elemento para conectarlos; si sueltas en un espacio vacío se crea un proceso nuevo conectado.</li>
              <li><span class="kbd">Supr</span> elimina; <span class="kbd">Ctrl</span>+<span class="kbd">D</span> duplica; flechas mueven 8 px (con <span class="kbd">Mayús</span>, 40 px); <span class="kbd">Alt</span> al arrastrar desactiva el ajuste a la cuadrícula.</li>
              <li><span class="kbd">Ctrl</span>+<span class="kbd">Z</span> deshace y <span class="kbd">Ctrl</span>+<span class="kbd">Y</span> rehace.</li>` : html`<li>Modo de solo lectura: puedes desplazarte, hacer zoom y descargar el diagrama.</li>`}
            </ul>
          </details>
        </div>
        ${panelOpen ? html`<${FlowPanel} flow=${flow} geom=${geom} selNodes=${selNodes} selEdge=${selEdge} setSel=${setSel} H=${H} canWrite=${canWrite} tab=${tab} setTab=${setTab} formId=${ids.form} update=${update} />` : null}
      </div>
      ${ghost ? html`<div class="flow-ghost" style=${'left:' + ghost.x + 'px;top:' + ghost.y + 'px'}><${Glyph} type=${ghost.type} />${TYPES[ghost.type].label}</div>` : null}
    </div>`;
  }

  /* Texto recortado a dos líneas; «Ver más» lo despliega (solo aparece si el texto no cabe). */
  function ClampText({ text }) {
    const ref = useRef(null);
    const [open, setOpen] = useState(false);
    const [over, setOver] = useState(false);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || open) return undefined;
      const check = () => setOver(el.scrollHeight > el.clientHeight + 1);
      check();
      if (typeof ResizeObserver === 'undefined') return undefined;
      const ro = new ResizeObserver(check);
      ro.observe(el);
      return () => ro.disconnect();
    }, [text, open]);
    return html`<div class="flow-desc-wrap">
      <p ref=${ref} class=${cx('small muted flow-desc', !open && 'is-clamped')}>${text}</p>
      ${over || open ? html`<button type="button" class="flow-more" aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpen(!open)}>${open ? 'Ver menos' : 'Ver más'}</button>` : null}
    </div>`;
  }

  /* Entero sin separador de miles (coordenadas en px); confirma al salir del campo o con Intro. */
  function IntInput({ value, onValue, min, max, class: cls, ...rest }) {
    const [draft, setDraft] = useState(null);
    const commit = () => {
      if (draft === null) return;
      const n = parseInt(String(draft).replace(/[^0-9-]/g, ''), 10);
      setDraft(null);
      if (!Number.isFinite(n)) return;
      onValue(clamp(n, min === undefined ? -1e6 : min, max === undefined ? 1e6 : max));
    };
    return html`<input class=${cx('input num', cls)} inputmode="numeric" value=${draft !== null ? draft : String(Math.round(PM.num(value)))}
      onInput=${(e) => setDraft(e.currentTarget.value)} onBlur=${commit} onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') setDraft(null); }} ...${rest} />`;
  }

  /* ---------------------------------------------------------------- panel de propiedades (ruta accesible por teclado) */
  function FlowPanel({ flow, geom, selNodes, selEdge, setSel, H, canWrite, tab, setTab, formId, update }) {
    const nodes = flow.nodes, edges = flow.edges;
    const idx = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
    const nodeOpts = nodes.map((n, i) => ({ value: n.id, label: nodeLabel(n, i) }));
    const byId = (id) => nodes.find((n) => n.id === id);
    const labelOf = (id) => { const n = byId(id); return n ? (idx.get(id) + 1) + '. ' + (shortText(n.text, 30) || '(sin texto)') : '—'; };
    /* Al elegir desde una lista, el botón pulsado desaparece: el foco pasa a la sección de la selección. */
    const focusSel = useRef(false);
    useEffect(() => { if (!focusSel.current) return; focusSel.current = false; const el = document.getElementById(formId + '-sel'); if (el) el.focus({ preventScroll: true }); });
    const pick = (id) => { focusSel.current = true; setSel({ nodes: [id], edge: null }); setTab('props'); H.reveal(id); };
    const pickEdge = (id) => { focusSel.current = true; setSel({ nodes: [], edge: id }); setTab('props'); const e = edges.find((x) => x.id === id); if (e) H.reveal(e.from); };
    const tabs = [{ id: 'props', label: 'Propiedades' }, { id: 'items', label: 'Elementos', count: nodes.length + edges.length }, { id: 'diagram', label: 'Diagrama' }];
    let body;
    if (tab === 'items') body = html`<${ItemsTab} nodes=${nodes} edges=${edges} selNodes=${selNodes} selEdge=${selEdge} pick=${pick} pickEdge=${pickEdge} labelOf=${labelOf} />`;
    else if (tab === 'diagram') body = html`<${DiagramTab} flow=${flow} canWrite=${canWrite} update=${update} H=${H} formId=${formId} />`;
    else body = html`<${PropsTab} flow=${flow} geom=${geom} selNodes=${selNodes} selEdge=${selEdge} H=${H} canWrite=${canWrite} nodeOpts=${nodeOpts} labelOf=${labelOf} byId=${byId} formId=${formId} setSel=${setSel} pick=${pick} pickEdge=${pickEdge} />`;
    return html`<aside class="card flow-panel" aria-label="Panel de propiedades del diagrama">
      <${ui.Tabs} tabs=${tabs} value=${tab} onChange=${setTab} />
      <div class="flow-panel-body">${body}</div>
    </aside>`;
  }

  function ItemsTab({ nodes, edges, selNodes, selEdge, pick, pickEdge, labelOf }) {
    return html`<div class="flow-sec">
      <div class="label-caps">Elementos (${nodes.length})</div>
      ${nodes.length ? html`<div class="flow-items" role="list">${nodes.map((n, i) => html`<div role="listitem" key=${n.id}><button type="button" class="flow-item" aria-pressed=${selNodes.includes(n.id) ? 'true' : 'false'} onClick=${() => pick(n.id)} title=${TYPES[n.type].label + ': ' + n.text}>
        <span class="flow-item-num">${i + 1}</span><${Glyph} type=${n.type} size=${22} /><span class="flow-item-text">${shortText(n.text, 60) || html`<span class="faint">(sin texto)</span>`}</span></button></div>`)}</div>` : html`<p class="small faint">Aún no hay elementos.</p>`}
    </div>
    <div class="flow-sec">
      <div class="label-caps">Flechas (${edges.length})</div>
      ${edges.length ? html`<div class="flow-items" role="list">${edges.map((e) => html`<div role="listitem" key=${e.id}><button type="button" class="flow-item" aria-pressed=${selEdge === e.id ? 'true' : 'false'} onClick=${() => pickEdge(e.id)}>
        <${ui.Icon} name="arrow-right" size=${14} /><span class="flow-item-text">${labelOf(e.from)} → ${labelOf(e.to)}</span>${e.label ? html`<${ui.Chip} tone="outline">${e.label}</${ui.Chip}>` : null}</button></div>`)}</div>` : html`<p class="small faint">Aún no hay flechas.</p>`}
    </div>`;
  }

  function PropsTab({ flow, geom, selNodes, selEdge, H, canWrite, nodeOpts, labelOf, byId, formId, pick, pickEdge }) {
    const edges = flow.edges;
    let selection;
    if (selNodes.length === 1) {
      const n = byId(selNodes[0]);
      const ins = edges.filter((e) => e.to === n.id), outs = edges.filter((e) => e.from === n.id);
      const lane = geom ? laneIndexAt(geom, n.y + n.h / 2) : -1;
      const setGeom = (k) => (v) => { if (v === null || !Number.isFinite(v)) return; const min = TYPES[n.type].min; const val = k === 'w' ? Math.max(min[0], Math.round(v)) : k === 'h' ? Math.max(min[1], Math.round(v)) : Math.round(v); H.updateNode(n.id, n.type === 'connector' && (k === 'w' || k === 'h') ? { w: val, h: val } : { [k]: val }, 'geom:' + k + ':' + n.id); };
      const setType = (t) => {
        if (!TYPES[t] || t === n.type) return;
        const patch = { type: t };
        if (t === 'connector' || n.type === 'connector') { const d = TYPES[t]; patch.w = d.w; patch.h = d.h; patch.x = Math.round(n.x + n.w / 2 - d.w / 2); patch.y = Math.round(n.y + n.h / 2 - d.h / 2); }
        H.updateNode(n.id, patch);
      };
      selection = html`<div class="flow-sec flow-sel" id=${formId + '-sel'} tabindex="-1" aria-label=${'Elemento seleccionado: ' + (n.text || TYPES[n.type].label)}>
        <div class="row-between"><span class="label-caps">Elemento ${(nodeOpts.findIndex((o) => o.value === n.id) + 1)}</span><${ui.Chip} tone="accent">${TYPES[n.type].label}</${ui.Chip}></div>
        ${canWrite ? html`
          <${ui.Field} label="Texto" for=${formId + '-text'} hint="El texto se ajusta dentro del símbolo. Intro en el lienzo también lo edita.">
            <${ui.TextArea} id=${formId + '-text'} value=${n.text} rows=${2} onValue=${(v) => H.updateNode(n.id, { text: v }, 'text:' + n.id)} />
          </${ui.Field}>
          <${ui.Field} label="Tipo de símbolo" for=${formId + '-type'}><${ui.Select} id=${formId + '-type'} value=${n.type} options=${TYPE_OPTIONS} onValue=${setType} /></${ui.Field}>
          ${geom ? html`<${ui.Field} label="Carril" for=${formId + '-lane'} hint="Mueve el elemento al centro del carril elegido.">
            <${ui.Select} id=${formId + '-lane'} value=${lane >= 0 ? geom.bands[lane].id : ''} options=${geom.bands.map((b, i) => ({ value: b.id, label: b.name || 'Carril ' + (i + 1) }))} onValue=${(id) => { const b = geom.bands.find((x) => x.id === id); if (b) H.updateNode(n.id, { y: snap(b.y + (b.h - n.h) / 2) }); }} />
          </${ui.Field}>` : null}
          <div class="flow-geom">
            <${ui.Field} label="X" for=${formId + '-x'}><${IntInput} id=${formId + '-x'} value=${n.x} onValue=${setGeom('x')} /></${ui.Field}>
            <${ui.Field} label="Y" for=${formId + '-y'}><${IntInput} id=${formId + '-y'} value=${n.y} onValue=${setGeom('y')} /></${ui.Field}>
            <${ui.Field} label="Ancho" for=${formId + '-w'}><${IntInput} id=${formId + '-w'} value=${n.w} min=${TYPES[n.type].min[0]} onValue=${setGeom('w')} /></${ui.Field}>
            <${ui.Field} label="Alto" for=${formId + '-h'}><${IntInput} id=${formId + '-h'} value=${n.h} min=${TYPES[n.type].min[1]} onValue=${setGeom('h')} /></${ui.Field}>
          </div>
          <div class="row">
            <${ui.Button} size="sm" icon="copy" onClick=${H.duplicateSel}>Duplicar</${ui.Button}>
            <${ui.Button} size="sm" variant="danger" icon="trash" onClick=${() => { H.deleteSel(); H.focusCanvas(); }}>Eliminar elemento</${ui.Button}>
          </div>` : html`<p class="small" style="white-space:pre-wrap">${n.text || html`<span class="faint">(sin texto)</span>`}</p>${geom && lane >= 0 ? html`<div class="xsmall faint">Carril: ${geom.bands[lane].name}</div>` : null}`}
        <div class="stack-sm">
          <div class="h4">Conexiones</div>
          ${!ins.length && !outs.length ? html`<p class="xsmall faint">Sin conexiones.</p>` : null}
          ${[...ins.map((e) => ({ e, dir: 'in' })), ...outs.map((e) => ({ e, dir: 'out' }))].map(({ e, dir }) => html`<div class="flow-conn" key=${e.id}>
            <${ui.Icon} name=${dir === 'in' ? 'arrow-left' : 'arrow-right'} size=${14} />
            <span title=${dir === 'in' ? 'Llega desde' : 'Sale hacia'}>${dir === 'in' ? 'Desde ' : 'Hacia '}${labelOf(dir === 'in' ? e.from : e.to)}${e.label ? ' (' + e.label + ')' : ''}</span>
            <${ui.IconButton} size="sm" icon="chevron-right" label="Seleccionar esta flecha" onClick=${() => pickEdge(e.id)} />
          </div>`)}
        </div>
      </div>`;
    } else if (selNodes.length > 1) {
      selection = html`<div class="flow-sec flow-sel" id=${formId + '-sel'} tabindex="-1" aria-label=${selNodes.length + ' elementos seleccionados'}>
        <div class="label-caps">${selNodes.length} elementos seleccionados</div>
        ${canWrite ? html`<div class="row">
          <${ui.Button} size="sm" icon="copy" onClick=${H.duplicateSel}>Duplicar</${ui.Button}>
          <${ui.Button} size="sm" variant="danger" icon="trash" onClick=${() => { H.deleteSel(); H.focusCanvas(); }}>Eliminar</${ui.Button}>
        </div>
        <div class="row">
          <${ui.Button} size="sm" onClick=${() => H.align('x')} title="Alinea los centros sobre una misma vertical, tomando como referencia el primer elemento seleccionado">Alinear en columna</${ui.Button}>
          <${ui.Button} size="sm" onClick=${() => H.align('y')} title="Alinea los centros sobre una misma horizontal, tomando como referencia el primer elemento seleccionado">Alinear en fila</${ui.Button}>
        </div>` : null}
        <div class="flow-items">${selNodes.map((id) => html`<button key=${id} type="button" class="flow-item" onClick=${() => pick(id)}><span class="flow-item-text">${labelOf(id)}</span></button>`)}</div>
      </div>`;
    } else if (selEdge) {
      const e = edges.find((x) => x.id === selEdge);
      const setEnds = (edge, from, to) => {
        if (edges.some((x) => x.id !== edge.id && x.from === from && x.to === to)) { PM.toast('Ya existe una flecha de «' + labelOf(from) + '» a «' + labelOf(to) + '». Elige otro elemento.'); return; }
        H.updateEdge(edge.id, { from, to });
      };
      selection = html`<div class="flow-sec flow-sel" id=${formId + '-sel'} tabindex="-1" aria-label="Flecha seleccionada">
        <div class="row-between"><span class="label-caps">Flecha</span>${e.label ? html`<${ui.Chip} tone="accent">${e.label}</${ui.Chip}>` : null}</div>
        ${canWrite ? html`
          <${ui.Field} label="Desde" for=${formId + '-efrom'}><${ui.Select} id=${formId + '-efrom'} value=${e.from} options=${nodeOpts.filter((o) => o.value !== e.to)} onValue=${(v) => { if (v && v !== e.to) setEnds(e, v, e.to); }} /></${ui.Field}>
          <${ui.Field} label="Hacia" for=${formId + '-eto'}><${ui.Select} id=${formId + '-eto'} value=${e.to} options=${nodeOpts.filter((o) => o.value !== e.from)} onValue=${(v) => { if (v && v !== e.from) setEnds(e, e.from, v); }} /></${ui.Field}>
          <${ui.Field} label="Etiqueta" for=${formId + '-elabel'} hint="En las salidas de una decisión indica la respuesta: Sí o No.">
            <${ui.Input} id=${formId + '-elabel'} value=${e.label} placeholder="Sin etiqueta" onValue=${(v) => H.updateEdge(e.id, { label: v }, 'label:' + e.id)} />
          </${ui.Field}>
          <div class="row">
            <${ui.Button} size="sm" onClick=${() => H.updateEdge(e.id, { label: 'Sí' })}>Sí</${ui.Button}>
            <${ui.Button} size="sm" onClick=${() => H.updateEdge(e.id, { label: 'No' })}>No</${ui.Button}>
            <${ui.Button} size="sm" variant="ghost" disabled=${!e.label} onClick=${() => H.updateEdge(e.id, { label: '' })}>Quitar etiqueta</${ui.Button}>
          </div>
          <div class="row">
            <${ui.Button} size="sm" icon="refresh" onClick=${() => { if (flow.edges.some((x) => x.from === e.to && x.to === e.from)) { PM.toast('Ya existe una flecha en el sentido contrario.'); return; } H.updateEdge(e.id, { from: e.to, to: e.from }); }}>Invertir sentido</${ui.Button}>
            <${ui.Button} size="sm" variant="danger" icon="trash" onClick=${() => { H.deleteSel(); H.focusCanvas(); }}>Eliminar flecha</${ui.Button}>
          </div>` : html`<p class="small">${labelOf(e.from)} → ${labelOf(e.to)}</p>`}
      </div>`;
    } else {
      selection = html`<div class="flow-sec"><p class="small muted">${canWrite ? 'Selecciona un elemento o una flecha en el lienzo o en la pestaña «Elementos» para editarlo. También puedes construir el diagrama con los formularios de abajo.' : 'Selecciona un elemento o una flecha para ver sus datos.'}</p></div>`;
    }
    return html`${selection}${canWrite ? html`<${AddNodeForm} flow=${flow} selNodes=${selNodes} H=${H} nodeOpts=${nodeOpts} formId=${formId} /><${AddEdgeForm} flow=${flow} selNodes=${selNodes} H=${H} nodeOpts=${nodeOpts} formId=${formId} />` : null}`;
  }

  function AddNodeForm({ flow, selNodes, H, nodeOpts, formId }) {
    const [type, setType] = useState('process');
    const [text, setText] = useState('');
    const [from, setFrom] = useState('');
    const auto = selNodes.length === 1 ? selNodes[0] : '';
    const connectFrom = from === '-' ? '' : from || auto;
    const submit = (e) => {
      e.preventDefault();
      const f = flow;
      let at = null;
      const src = connectFrom && f.nodes.find((n) => n.id === connectFrom);
      if (src) { const d = TYPES[type]; at = { x: src.x + src.w / 2, y: src.y + src.h + 48 + d.h / 2 }; }
      const n = H.addNode(type, at, { text: text.trim() ? text.trim() : undefined, connectFrom: src ? src.id : null });
      if (n) { setText(''); setFrom(''); setTimeout(() => H.reveal(n.id), 0); }
    };
    return html`<form class="flow-sec" onSubmit=${submit} aria-label="Agregar elemento">
      <div class="h4">Agregar elemento</div>
      <${ui.Field} label="Tipo" for=${formId + '-ntype'}><${ui.Select} id=${formId + '-ntype'} value=${type} options=${TYPE_OPTIONS} onValue=${setType} /></${ui.Field}>
      <${ui.Field} label="Texto" for=${formId + '-ntext'}><${ui.Input} id=${formId + '-ntext'} value=${text} onValue=${setText} placeholder=${TYPES[type].text} /></${ui.Field}>
      ${nodeOpts.length ? html`<${ui.Field} label="Conectar desde" for=${formId + '-nfrom'} hint="El nuevo elemento se ubica debajo del elemento de origen.">
        <${ui.Select} id=${formId + '-nfrom'} value=${from || auto || '-'} options=${[{ value: '-', label: 'Sin conectar' }, ...nodeOpts]} onValue=${setFrom} />
      </${ui.Field}>` : null}
      <div><${ui.Button} type="submit" size="sm" variant="primary" icon="plus">Agregar elemento</${ui.Button}></div>
    </form>`;
  }

  function AddEdgeForm({ flow, selNodes, H, nodeOpts, formId }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');
    const ok = (id) => flow.nodes.some((n) => n.id === id);
    const f0 = ok(from) ? from : selNodes.length === 1 ? selNodes[0] : '';
    const t0 = ok(to) ? to : '';
    if (flow.nodes.length < 2) return html`<div class="flow-sec"><div class="h4">Agregar flecha</div><p class="xsmall faint">Agrega al menos dos elementos para conectarlos.</p></div>`;
    const submit = (e) => {
      e.preventDefault();
      if (!f0 || !t0) { setError('Elige el elemento de origen y el de destino.'); return; }
      if (f0 === t0) { setError('El origen y el destino deben ser elementos distintos.'); return; }
      if (H.addEdge(f0, t0, label.trim())) { setError(''); setTo(''); setLabel(''); }
    };
    return html`<form class="flow-sec" onSubmit=${submit} aria-label="Agregar flecha">
      <div class="h4">Agregar flecha</div>
      <${ui.Field} label="Desde" for=${formId + '-cfrom'}><${ui.Select} id=${formId + '-cfrom'} value=${f0} placeholder="Elige el origen" options=${nodeOpts} onValue=${(v) => { setFrom(v); setError(''); }} /></${ui.Field}>
      <${ui.Field} label="Hacia" for=${formId + '-cto'}><${ui.Select} id=${formId + '-cto'} value=${t0} placeholder="Elige el destino" options=${nodeOpts.filter((o) => o.value !== f0)} onValue=${(v) => { setTo(v); setError(''); }} /></${ui.Field}>
      <${ui.Field} label="Etiqueta (opcional)" for=${formId + '-clabel'} error=${error}><${ui.Input} id=${formId + '-clabel'} value=${label} onValue=${setLabel} placeholder="Sí, No…" /></${ui.Field}>
      <div><${ui.Button} type="submit" size="sm" icon="link">Agregar flecha</${ui.Button}></div>
    </form>`;
  }

  function DiagramTab({ flow, canWrite, update, H, formId }) {
    const on = lanesOn(flow);
    const setLanes = (lanes, key) => update({ lanes }, key);
    const lanes = flow.lanes;
    if (!canWrite) {
      return html`<div class="flow-sec">
        <div><div class="label-caps">Nombre</div><div class="small">${flowName(flow)}</div></div>
        ${flow.description ? html`<div><div class="label-caps">Descripción</div><p class="small" style="white-space:pre-wrap">${flow.description}</p></div>` : null}
        ${on ? html`<div><div class="label-caps">Carriles</div><ol class="small" style="margin:4px 0 0;padding-left:18px">${lanes.map((l) => html`<li key=${l.id}>${l.name || '(sin nombre)'}</li>`)}</ol></div>` : null}
      </div>`;
    }
    return html`<div class="flow-sec">
      <${ui.Field} label="Nombre del diagrama" for=${formId + '-name'}><${ui.Input} id=${formId + '-name'} value=${flow.name} onValue=${(v) => update({ name: v }, 'name')} /></${ui.Field}>
      <${ui.Field} label="Descripción" for=${formId + '-desc'} hint="Alcance del proceso, entradas, salidas o proceso PMBOK relacionado."><${ui.TextArea} id=${formId + '-desc'} value=${flow.description} rows=${3} onValue=${(v) => update({ description: v }, 'desc')} /></${ui.Field}>
    </div>
    <div class="flow-sec">
      <div class="row-between"><div class="h4">Carriles (responsables)</div><${ui.Check} checked=${on} label="Mostrar" onValue=${() => H.toggleLanes()} /></div>
      <p class="xsmall faint">Diagrama de flujo multifuncional: cada carril es un rol o área. Los elementos conservan su posición; su carril depende de su ubicación vertical.</p>
      ${on ? html`
        <div class="stack-sm">
          <div class="flow-lane-row flow-lane-hdr" aria-hidden="true"><span>Rol o área</span><span>Alto (px)</span><span></span></div>
          ${lanes.map((l, i) => html`<div class="flow-lane-row" key=${l.id}>
            <${ui.Input} aria-label=${'Nombre del carril ' + (i + 1)} title=${l.name} value=${l.name} placeholder=${'Carril ' + (i + 1)} onValue=${(v) => setLanes(lanes.map((x) => (x.id === l.id ? { ...x, name: v } : x)), 'lane:' + l.id)} />
            <${IntInput} aria-label=${'Alto del carril ' + (i + 1) + ' en píxeles'} title="Alto en píxeles" value=${PM.num(l.h, LANE_H)} min=${64} max=${4000} onValue=${(v) => { if (v === null || !Number.isFinite(v)) return; setLanes(lanes.map((x) => (x.id === l.id ? { ...x, h: clamp(Math.round(v), 64, 4000) } : x)), 'laneh:' + l.id); }} />
            <div class="row" style="gap:0;flex-wrap:nowrap">
              <${ui.IconButton} size="sm" icon="chevron-up" label=${'Subir el carril ' + (i + 1)} disabled=${i === 0} onClick=${() => setLanes(PM.moveItem(lanes, i, i - 1))} />
              <${ui.IconButton} size="sm" icon="chevron-down" label=${'Bajar el carril ' + (i + 1)} disabled=${i === lanes.length - 1} onClick=${() => setLanes(PM.moveItem(lanes, i, i + 1))} />
              <${ui.IconButton} size="sm" icon="trash" label=${'Eliminar el carril ' + (i + 1)} onClick=${() => { const next = lanes.filter((x) => x.id !== l.id); if (next.length) setLanes(next); else update({ lanes: [], lanesHidden: true }); }} />
            </div>
          </div>`)}
        </div>
        <div><${ui.Button} size="sm" icon="plus" onClick=${() => setLanes([...lanes, { id: PM.uid('l'), name: 'Carril ' + (lanes.length + 1), h: LANE_H }])}>Agregar carril</${ui.Button}></div>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- modal: nuevo diagrama */
  function NewFlowModal({ close, initial, onCreate }) {
    const [tpl, setTpl] = useState(initial || 'blank');
    const [name, setName] = useState(tplById(initial || 'blank').defaultName);
    const [edited, setEdited] = useState(false);
    const [busy, setBusy] = useState(false);
    const [touched, setTouched] = useState(false);
    const choose = (id) => { setTpl(id); if (!edited) setName(tplById(id).defaultName); };
    const err = !name.trim() ? 'Escribe un nombre para el diagrama.' : '';
    const submit = async (e) => { e && e.preventDefault(); setTouched(true); if (err || busy) return; setBusy(true); try { await onCreate(tpl, name.trim()); } finally { setBusy(false); } };
    return html`<${ui.Modal} title="Nuevo diagrama" subtitle="Empieza en blanco o con una plantilla que puedes ajustar." onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="plus" disabled=${busy} onClick=${submit}>${busy ? 'Creando…' : 'Crear diagrama'}</${ui.Button}>`}>
      <form class="stack" onSubmit=${submit}>
        <${ui.Field} label="Nombre del diagrama" required for="flow-new-name" error=${touched ? err : ''}><${ui.Input} id="flow-new-name" value=${name} onValue=${(v) => { setName(v); setEdited(true); }} autoFocus /></${ui.Field}>
        <fieldset class="field" style="border:0;padding:0;margin:0">
          <legend class="field-label" style="padding:0;margin-bottom:5px">Plantilla</legend>
          <div class="flow-tpl-opts">
            ${TEMPLATES.map((t) => html`<label key=${t.id} class=${cx('flow-tpl-opt', tpl === t.id && 'is-on')}>
              <input type="radio" name="flow-tpl" value=${t.id} checked=${tpl === t.id} onChange=${() => choose(t.id)} />
              <span class="stack-sm" style="gap:2px"><span class="flow-tpl-name">${t.name}</span><span class="flow-tpl-desc">${t.summary}${t.nodes.length ? ' · ' + t.nodes.length + ' elementos' + (t.lanes.length ? ', ' + t.lanes.length + ' carriles' : '') : ''}</span></span>
            </label>`)}
          </div>
        </fieldset>
        <button type="submit" hidden></button>
      </form>
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- vista */
  const PREF_KEY = 'flow.selected';
  const readSel = (pid) => { const m = PM.prefs.get(PREF_KEY, {}); return (m && typeof m === 'object' && m[pid]) || null; };
  const writeSel = (pid, fid) => { const m = PM.prefs.get(PREF_KEY, {}); PM.prefs.set(PREF_KEY, { ...(m && typeof m === 'object' ? m : {}), [pid]: fid }); };

  function FlowView({ project, params }) {
    const pid = project.id;
    const canWrite = PM.useCanWrite();
    const { docs, loading } = PM.useCollection(PM.paths.flows(pid));
    const list = useMemo(() => docs.filter((d) => d.data).map((d) => ({ id: d.id, name: flowName(d.data), count: Array.isArray(d.data.nodes) ? d.data.nodes.length : 0, updatedAt: d.data.updatedAt, createdAt: String(d.data.createdAt || '') }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name, 'es')), [docs]);
    const [selId, setSelId] = useState(() => (params && params.fid) || readSel(pid));
    const pendingRef = useRef(null);
    useEffect(() => { if (params && params.fid) setSelId(params.fid); }, [params && params.fid]);
    const activeId = selId && (list.some((f) => f.id === selId) || pendingRef.current === selId) ? selId : list.length ? list[0].id : null;
    const choose = (id) => { pendingRef.current = null; setSelId(id); writeSel(pid, id); };

    const createDoc = async (body, msg) => {
      const id = PM.uid('f');
      try { await PM.store.set(PM.paths.flow(pid, id), body); } catch (e) { return null; }
      pendingRef.current = id;
      setSelId(id);
      writeSel(pid, id);
      PM.touchProject(pid);
      PM.toast(msg);
      return id;
    };
    const create = (tplId, name) => createDoc(flowFromTemplate(tplId, name), 'Diagrama creado.');
    const openNew = (tplId) => PM.openModal((close) => html`<${NewFlowModal} close=${close} initial=${tplId} onCreate=${async (t, n) => { const id = await create(t, n); if (id) close(); }} />`);
    const duplicate = async (f) => {
      if (!f) return;
      const now = PM.nowIso();
      const copy = { ...PM.clone(f), name: flowName(f) + ' (copia)', createdAt: now, updatedAt: now };
      await createDoc(copy, 'Diagrama duplicado.');
    };
    const remove = async (fid, f) => {
      const n = f ? f.nodes.length : 0;
      const ok = await PM.confirm({ title: 'Eliminar diagrama', body: html`<p>Se eliminará <strong>${flowName(f)}</strong> con sus ${n} ${n === 1 ? 'elemento' : 'elementos'}. Esta acción no se puede deshacer.</p><p class="small muted">Si quieres conservar una copia, usa antes «Exportar JSON».</p>`, confirmText: 'Eliminar diagrama', tone: 'danger' });
      if (!ok) return;
      try {
        await PM.flushAll();
        await PM.store.delete(PM.paths.flow(pid, fid));
        HISTORIES.delete(PM.paths.flow(pid, fid));
        const rest = list.filter((x) => x.id !== fid);
        choose(rest.length ? rest[0].id : null);
        PM.touchProject(pid);
        PM.toast('Diagrama eliminado.');
      } catch (e) { /* el núcleo ya avisó del error */ }
    };
    const importJson = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const file = input.files && input.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          let obj = null;
          try { obj = JSON.parse(String(reader.result)); } catch (e) { obj = null; }
          if (!obj || typeof obj !== 'object' || !Array.isArray(obj.nodes)) { PM.toast('El archivo no es un diagrama válido. Usa un .json exportado desde «Diagramas de flujo».', { tone: 'crit' }); return; }
          const f = normalizeFlow(obj);
          const now = PM.nowIso();
          const body = { name: f.name || file.name.replace(/\.json$/i, ''), description: f.description, nodes: f.nodes, edges: f.edges, lanes: f.lanes, createdAt: now, updatedAt: now };
          if (f.lanesHidden) body.lanesHidden = true;
          await createDoc(body, 'Diagrama importado.');
        };
        reader.readAsText(file);
      };
      input.click();
    };

    const header = html`<${ui.PageHeader} eyebrow="8.1 Planificar la gestión de la calidad · Diagramas de flujo" title="Diagramas de flujo"
      description="Modela los procesos del proyecto con símbolos estándar (ISO 5807): control de cambios, recepción e inspección de equipos, aprobación de entregables. Usa carriles para mostrar quién hace cada paso."
      actions=${canWrite ? html`<${ui.Button} icon="upload" onClick=${importJson}>Importar JSON</${ui.Button}><${ui.Button} variant="primary" icon="plus" onClick=${() => openNew('blank')}>Nuevo diagrama</${ui.Button}>` : null} />`;

    if (loading) return html`<div class="page flow-root">${header}<${ui.Loading} rows=${5} /></div>`;

    if (!list.length) {
      return html`<div class="page flow-root">${header}
        <${ui.Empty} icon="flow" title="Aún no hay diagramas de flujo" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => openNew('blank')}>Nuevo diagrama</${ui.Button}>` : null}>
          Un diagrama de flujo muestra la secuencia de pasos, decisiones y responsables de un proceso. Sirve para planificar procesos de calidad (8.1), documentar el control integrado de cambios (4.6) y estandarizar la logística de despacho, recepción y devolución de equipos en obra.${canWrite ? ' Empieza en blanco o con una de las plantillas.' : ''}
        </${ui.Empty}>
        ${canWrite ? html`<section class="section">
          <div class="section-head"><h2 class="h3">Empieza con una plantilla</h2><span class="small faint">Podrás ajustar cada paso después.</span></div>
          <div class="flow-tpls">${TEMPLATES.filter((t) => t.id !== 'blank').map((t) => html`<div class="flow-tpl-card" key=${t.id}>
            <div class="row" style="gap:8px;flex-wrap:nowrap"><${ui.Icon} name="flow" size=${18} /><strong class="small">${t.name}</strong></div>
            <p>${t.summary}</p>
            <div class="xsmall faint">${t.nodes.length} elementos · ${t.edges.length} flechas${t.lanes.length ? ' · ' + t.lanes.length + ' carriles' : ''}</div>
            <div><${ui.Button} size="sm" icon="plus" onClick=${() => openNew(t.id)}>Usar plantilla</${ui.Button}></div>
          </div>`)}</div>
        </section>` : null}
      </div>`;
    }

    const picker = html`<div class="flow-picker">
      <${ui.Field} label="Diagrama" for="flow-picker-select"><${ui.Select} id="flow-picker-select" value=${activeId || ''} options=${list.map((f) => ({ value: f.id, label: f.name }))} onValue=${(v) => v && choose(v)} /></${ui.Field}>
    </div>`;

    return html`<div class="page flow-root">${header}
      <div class="flow-layout">
        <nav class="flow-list" aria-label="Diagramas del proyecto">
          <div class="flow-list-head"><span class="label-caps">Diagramas (${list.length})</span></div>
          ${list.map((f) => html`<button key=${f.id} type="button" class="flow-list-item" aria-current=${f.id === activeId ? 'true' : 'false'} onClick=${() => choose(f.id)}>
            <span class="flow-list-name">${f.name}</span>
            <span class="flow-list-meta">${f.count} ${f.count === 1 ? 'elemento' : 'elementos'} · ${PM.fmt.datetime(f.updatedAt)}</span>
          </button>`)}
        </nav>
        ${activeId ? html`<${FlowEditor} key=${activeId} pid=${pid} fid=${activeId} canWrite=${canWrite} picker=${picker} onDuplicate=${duplicate} onDelete=${remove} />` : null}
      </div>
    </div>`;
  }

  PM.registerView({ id: 'flujogramas', label: 'Diagramas de flujo', group: 'analisis', order: 50, icon: 'flow', component: FlowView, description: 'Diagramas de flujo de procesos con carriles por responsable (8.1, 4.6).' });
})();

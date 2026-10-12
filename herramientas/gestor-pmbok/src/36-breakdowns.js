/* ==========================================================================
   36-breakdowns.js — vista «Estructuras de desglose» (SPEC §10.2 y §10.4):
   estructura de desglose de costos (componentes del presupuesto, Guía del
   PMBOK® 6.ª ed., 7.3 y gráfico 7-8), de los riesgos (11.1 y 11.2, gráfico
   11-4) y de los recursos (9.2), dibujadas con un diagrama de árbol genérico
   (PM.TreeDiagram): disposición vertical u horizontal, ramas plegables, zoom,
   teclado (árbol con aria-level y aria-expanded), vista de tabla y
   exportación SVG y PNG con los colores del tema.
   Datos: PM.res.cbsTree / riskTree / rbsTree (09-resources-core).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib || !PM.ui || !PM.res) return;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;
  const num = PM.num;
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const arr = (x) => (Array.isArray(x) ? x : []);
  const txt = (v) => (v === null || v === undefined ? '' : String(v)).trim();
  const plural = (n, one, many) => PM.fmt.num(n) + ' ' + (Number(n) === 1 ? one : many);
  const keyOf = (s) => txt(s).toLowerCase();

  /* ícono de la vista: árbol de izquierda a derecha (distinto del de la EDT) */
  if (PM.ICONS && !PM.ICONS.breakdown) {
    PM.ICONS.breakdown = '<rect x="2.5" y="9.5" width="6" height="5" rx="1"/><rect x="15.5" y="2.5" width="6" height="5" rx="1"/><rect x="15.5" y="9.5" width="6" height="5" rx="1"/><rect x="15.5" y="16.5" width="6" height="5" rx="1"/><path d="M8.5 12H12M12 5v14M12 5h3.5M12 12h3.5M12 19h3.5"/>';
  }

  /* ---------------------------------------------------------------- estilos */
  const STYLE = `
.trd { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.trd-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; min-width: 0; }
.trd-toolbar .btn-group { flex-wrap: wrap; max-width: 100%; }
.trd-tgroup { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }
.trd-tlabel { font-size: var(--fs-xs); color: var(--fg-2); }
.trd-zoom { display: inline-flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.trd-zoom-v { min-width: 46px; text-align: center; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; color: var(--fg-2); }
.trd-canvas { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); max-height: min(78vh, 1100px); overflow: auto; overscroll-behavior: contain; }
.trd-canvas.can-pan { cursor: grab; }
.trd-canvas.is-panning { cursor: grabbing; user-select: none; }
.trd-canvas svg { margin: 0 auto; }
.trd-keys { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-xs); color: var(--fg-3); }
.trd-keys .kbd { margin-right: 2px; }
@media (max-width: 700px) { .trd-keys { display: none; } }
.trd-hidden { font-size: var(--fs-xs); color: var(--fg-2); }
.chart .trd-link { fill: none; stroke: var(--line-strong); stroke-width: 1.25; }
.chart text.trd-caption { font-family: var(--font-display); font-size: 13px; font-weight: 650; fill: var(--fg); }
.trd-node { cursor: pointer; outline: none; }
.trd-node.is-static { cursor: default; }
.chart .trd-ring { fill: none; stroke: none; }
.chart .trd-node:focus-visible .trd-ring { stroke: var(--accent); stroke-width: 2.5; }
.chart .trd-card { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }
.chart .trd-node:hover .trd-card { stroke: var(--fg-2); }
.chart .trd-node.is-reserve .trd-card { stroke-dasharray: 5 3; stroke-width: 1.5; }
.chart .trd-band { fill: var(--surface-3); }
.chart .trd-edge { fill: none; }
.chart text.trd-code { font-family: var(--font-mono); font-size: 10.5px; fill: var(--fg-2); }
.chart text.trd-tag { font-size: 10px; font-weight: 600; fill: var(--fg-2); }
.chart text.trd-name { font-size: 12px; font-weight: 600; fill: var(--fg); }
.chart text.trd-sub { font-size: 10.5px; fill: var(--fg-2); }
.chart text.trd-val { font-size: 13px; font-weight: 700; fill: var(--fg); font-variant-numeric: tabular-nums; }
.chart text.trd-pct { font-size: 11px; fill: var(--fg-2); font-variant-numeric: tabular-nums; }
.chart .trd-meter-bg { fill: var(--surface-3); }
.chart .trd-meter { fill: var(--accent); }
.chart .trd-pill rect { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }
.chart .trd-pill text { font-family: var(--font-mono); font-size: 10px; font-weight: 600; fill: var(--fg-2); }
.chart .trd-node.is-group:hover .trd-pill rect { stroke: var(--accent); }
.chart .trd-node.t-good .trd-band { fill: var(--good-wash); } .chart .trd-node.t-good .trd-edge { fill: var(--good); } .chart .trd-node.t-good text.trd-tag { fill: var(--good); }
.chart .trd-node.t-warn .trd-band { fill: var(--warn-wash); } .chart .trd-node.t-warn .trd-edge { fill: var(--warn); } .chart .trd-node.t-warn text.trd-tag { fill: var(--warn); }
.chart .trd-node.t-crit .trd-band { fill: var(--crit-wash); } .chart .trd-node.t-crit .trd-edge { fill: var(--crit); } .chart .trd-node.t-crit text.trd-tag { fill: var(--crit); }
.chart .trd-node.t-signal .trd-band { fill: var(--signal-wash); } .chart .trd-node.t-signal .trd-edge { fill: var(--signal); } .chart .trd-node.t-signal text.trd-tag { fill: var(--signal-ink); }
.chart .trd-node.t-info .trd-band { fill: var(--info-wash); } .chart .trd-node.t-info .trd-edge { fill: var(--info); } .chart .trd-node.t-info text.trd-tag { fill: var(--info); }
.chart .trd-node.t-accent .trd-band { fill: var(--accent-wash); } .chart .trd-node.t-accent .trd-edge { fill: var(--accent); } .chart .trd-node.t-accent text.trd-tag { fill: var(--accent); }
.chart .trd-node.is-root .trd-card { fill: var(--accent); stroke: var(--accent); }
.chart .trd-node.is-root .trd-band { fill: var(--accent-hover); }
.chart .trd-node.is-root text { fill: var(--accent-fg); }
.chart .trd-node.is-root:focus-visible .trd-ring { stroke: var(--fg); }
.chart .trd-node.is-root .trd-pill text { fill: var(--fg-2); }
.trd-table-wrap { max-height: min(78vh, 1100px); overflow: auto; }
.trd-table th[scope="row"] { font-weight: 400; text-align: left; background: transparent; position: static; white-space: normal; font-size: var(--fs-sm); color: var(--fg); min-width: 220px; }
.trd-table tr.d1 th[scope="row"], .trd-table tr.d2 th[scope="row"] { font-weight: 600; }
.trd-table tr.d1 td, .trd-table tr.d1 th { background: var(--surface-2); }
.trd-table td.num { white-space: nowrap; }
.trd-table .code-tag { margin-right: 6px; }
.trd-table .trd-sub-cell { color: var(--fg-2); min-width: 180px; }
.trd-linkbtn { border: 0; background: transparent; padding: 0; color: var(--accent); cursor: pointer; text-align: left; font: inherit; text-decoration: underline; text-underline-offset: 2px; }
.trd-png { max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); }
.brk-panel { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.brk-controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 22px; padding: 12px 14px; }
.brk-ctl { display: flex; flex-direction: column; gap: 5px; min-width: 0; max-width: 100%; }
.brk-ctl-label { font-size: var(--fs-xs); font-weight: 600; color: var(--fg-2); }
.brk-ctl .btn-group { flex-wrap: wrap; max-width: 100%; }
.brk-ctl .select { min-width: 200px; max-width: 100%; }
.brk-ctl .check { min-height: 32px; }
.brk-ctl-actions { margin-left: auto; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
@media (max-width: 700px) { .brk-ctl-actions { margin-left: 0; } }
.brk-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
.brk-stats > .stat { box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.brk-stats .stat-value { font-size: 1.35rem; font-variant-numeric: tabular-nums; }
.brk-note { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-left: 3px solid var(--info); border-radius: var(--r-md); background: var(--surface); font-size: var(--fs-sm); color: var(--fg-2); }
.brk-note > .icon { color: var(--info); margin-top: 2px; }
.brk-note.is-warn { border-left-color: var(--warn); }
.brk-note.is-warn > .icon { color: var(--warn); }
.brk-note-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
.brk-note-body p { max-width: 95ch; }
.brk-note strong { color: var(--fg); }
.brk-budget { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; }
.brk-budget-title { font-size: var(--fs-sm); font-weight: 600; }
.brk-bar { display: flex; height: 16px; border-radius: var(--r-sm); overflow: hidden; background: var(--surface-3); }
.brk-bar > span { display: block; height: 100%; min-width: 2px; }
.brk-bar > span + span { box-shadow: inset 2px 0 0 var(--surface); }
.brk-spans { display: flex; flex-direction: column; gap: 6px; font-size: var(--fs-xs); color: var(--fg-2); }
.brk-span { border: 1px solid var(--line-strong); border-top: 0; height: 7px; border-radius: 0 0 3px 3px; }
.brk-span-l { overflow-wrap: anywhere; padding-top: 2px; }
.brk-span-l strong { color: var(--fg); font-variant-numeric: tabular-nums; }
.brk-legend .legend-item strong { color: var(--fg); font-variant-numeric: tabular-nums; font-weight: 600; }
.brk-levels { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: var(--fs-xs); color: var(--fg-2); }
`;
  if (!document.getElementById('css-breakdowns')) { const st = document.createElement('style'); st.id = 'css-breakdowns'; st.textContent = STYLE; document.head.appendChild(st); }

  /* ---------------------------------------------------------------- medición de texto */
  const FAMILY = '"IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  const F = { name: '600 12px ' + FAMILY, sub: '400 10.5px ' + FAMILY, tag: '600 10px ' + FAMILY, code: '400 10.5px ' + MONO, val: '700 13px ' + FAMILY, pct: '400 11px ' + FAMILY, pill: '600 10px ' + MONO, cap: '650 13px "Archivo", "Arial Narrow", ' + FAMILY };
  let mctx = null;
  const wcache = new Map();
  const tw = (s, font) => {
    const k = font + '|' + s; const c = wcache.get(k);
    if (c !== undefined) return c;
    let w;
    try { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); if (mctx) { mctx.font = font; w = mctx.measureText(s).width; } } catch (e) { /* sin canvas */ }
    if (w === undefined || !Number.isFinite(w)) w = s.length * 6.6;
    if (wcache.size > 12000) wcache.clear();
    wcache.set(k, w);
    return w;
  };
  /* recorta con «…» al ancho dado */
  const clip = (s, maxW, font) => {
    s = txt(s);
    if (!s || tw(s, font) <= maxW) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tw(s.slice(0, mid).trimEnd() + '…', font) <= maxW) lo = mid; else hi = mid - 1; }
    return s.slice(0, lo).trimEnd() + '…';
  };
  /* hasta maxLines líneas; la última se recorta con «…» si sobra texto */
  function wrap(s, maxW, maxLines, font) {
    const words = txt(s).split(/\s+/).filter(Boolean);
    if (!words.length) return { lines: [''], cut: false };
    const lines = []; let cur = ''; let i = 0;
    while (i < words.length && lines.length < maxLines) {
      const wd = words[i];
      const test = cur ? cur + ' ' + wd : wd;
      if (tw(test, font) <= maxW) { cur = test; i++; continue; }
      if (cur) { lines.push(cur); cur = ''; continue; }
      let k = wd.length - 1; while (k > 1 && tw(wd.slice(0, k) + '-', font) > maxW) k--;
      lines.push(wd.slice(0, k) + '-'); words[i] = wd.slice(k);
    }
    if (lines.length < maxLines) { if (cur) lines.push(cur); return { lines, cut: false }; }
    const rest = words.slice(i).join(' ');
    if (!rest) return { lines, cut: false };
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = clip(last.endsWith('-') ? last.slice(0, -1) + rest : last + ' ' + rest, maxW, font);
    return { lines, cut: true };
  }

  /* ---------------------------------------------------------------- árbol: preparación y disposición */
  const CW = 200, CH = 106, M = 18;
  const GV = { x: 16, y: 44, ind: 22, s: 10 }; /* vertical: separación entre hermanos, entre niveles, sangría y separación de las pilas */
  const GH = { x: 52, y: 12 }; /* horizontal: separación entre niveles y entre hermanos */
  const TONES = new Set(['good', 'warn', 'crit', 'signal', 'info', 'accent']);
  const TONE_WORD = { good: 'Favorable', warn: 'Atención', crit: 'Crítico', signal: 'Alerta', info: 'Información', accent: 'Destacado' };
  const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.8, 1, 1.25, 1.5, 2];
  const AUTO_LIMIT = 150;

  /* Envuelve los nodos de PM.res.* con identificadores únicos (los datos pueden repetir ids), nivel, posición entre
     hermanos y cantidad de descendientes. order = recorrido en profundidad (preorden). */
  function prepare(root) {
    const byUid = new Map(); const order = []; const seen = new Set();
    const walk = (n, parent, depth, index, setSize) => {
      let uid = String(n.id !== undefined && n.id !== null && n.id !== '' ? n.id : 'n' + order.length);
      if (seen.has(uid)) { let k = 2; while (seen.has(uid + '~' + k)) k++; uid = uid + '~' + k; }
      seen.add(uid);
      const w = { uid, n, parent, depth, index, setSize, kids: [], desc: 0 };
      byUid.set(uid, w); order.push(w);
      const ch = arr(n.children).filter(isObj);
      ch.forEach((c, i) => { if (depth > 40) return; const cw = walk(c, w, depth + 1, i, ch.length); w.kids.push(cw); w.desc += 1 + cw.desc; });
      return w;
    };
    const top = isObj(root) ? walk(root, null, 1, 0, 1) : null;
    return { top, byUid, order };
  }
  /* ramas plegadas al abrir: se muestran los niveles completos que caben en AUTO_LIMIT nodos (al menos dos niveles) */
  function autoCollapsed(P) {
    const out = new Set();
    if (!P.top) return out;
    const byDepth = [];
    for (const w of P.order) byDepth[w.depth] = (byDepth[w.depth] || 0) + 1;
    let total = 0, d = 1;
    for (; d < byDepth.length; d++) { if (d > 2 && total + byDepth[d] > AUTO_LIMIT) break; total += byDepth[d] || 0; }
    if (d >= byDepth.length) return out;
    for (const w of P.order) if (w.depth === d - 1 && w.kids.length) out.add(w.uid);
    return out;
  }

  /* Disposición. Vertical (raíz arriba): los hijos van en fila bajo su padre; si todos los hijos visibles son hojas, se
     apilan bajo el padre con sangría (más compacto). Horizontal (izquierda a derecha): árbol ordenado por niveles.
     → {W, H, pos: Map(uid → {x, y}), mode: Map(uid → 'leaf'|'stack'|'row'), path, order (uids visibles en preorden)} */
  function layout(P, collapsed, orient, capH, capW) {
    const pos = new Map(), mode = new Map(), d = [], order = [];
    if (!P.top) return { W: 0, H: 0, dx: 0, pos, mode, path: '', order };
    const vis = (w) => (collapsed.has(w.uid) ? [] : w.kids);
    const r = (v) => Math.round(v) + 0.5;
    const size = new Map();
    let W, H;
    if (orient === 'h') {
      const meas = (w) => {
        const ks = vis(w); let s = { w: CW, h: CH };
        if (ks.length) {
          let sh = GH.y * (ks.length - 1), mw = 0;
          for (const k of ks) { const z = meas(k); sh += z.h; mw = Math.max(mw, z.w); }
          s = { w: CW + GH.x + mw, h: Math.max(CH, sh), colH: sh };
        }
        size.set(w.uid, s); return s;
      };
      const place = (w, x, y) => {
        const s = size.get(w.uid); const ks = vis(w);
        if (!ks.length) { pos.set(w.uid, { x, y: y + (s.h - CH) / 2 }); mode.set(w.uid, 'leaf'); return; }
        mode.set(w.uid, 'row');
        let cy = y + (s.h - s.colH) / 2; const kx = x + CW + GH.x;
        for (const k of ks) { place(k, kx, cy); cy += size.get(k.uid).h + GH.y; }
        const c1 = pos.get(ks[0].uid).y + CH / 2, c2 = pos.get(ks[ks.length - 1].uid).y + CH / 2;
        const py = (c1 + c2) / 2 - CH / 2;
        pos.set(w.uid, { x, y: py });
        const bx = r(x + CW + GH.x / 2), pm = py + CH / 2;
        d.push('M' + (x + CW) + ' ' + r(pm) + 'H' + bx);
        d.push('M' + bx + ' ' + r(Math.min(c1, pm)) + 'V' + r(Math.max(c2, pm)));
        for (const k of ks) d.push('M' + bx + ' ' + r(pos.get(k.uid).y + CH / 2) + 'H' + kx);
      };
      const s = meas(P.top);
      place(P.top, M, M + capH);
      W = s.w + 2 * M; H = s.h + 2 * M + capH;
    } else {
      const meas = (w) => {
        const ks = vis(w); let s;
        if (!ks.length) s = { w: CW, h: CH, m: 'leaf' };
        else if (ks.every((k) => !vis(k).length)) s = { w: GV.ind + CW, h: CH + ks.length * (GV.s + CH), m: 'stack' };
        else {
          let rw = GV.x * (ks.length - 1), mh = 0;
          for (const k of ks) { const z = meas(k); rw += z.w; mh = Math.max(mh, z.h); }
          s = { w: Math.max(CW, rw), h: CH + GV.y + mh, m: 'row', rw };
        }
        size.set(w.uid, s); return s;
      };
      const place = (w, x, y) => {
        const s = size.get(w.uid); const ks = vis(w);
        mode.set(w.uid, s.m);
        if (s.m === 'leaf') { pos.set(w.uid, { x, y }); return; }
        if (s.m === 'stack') {
          pos.set(w.uid, { x, y });
          const rx = r(x + GV.ind / 2); let ky = y + CH + GV.s, last = y + CH;
          for (const k of ks) { pos.set(k.uid, { x: x + GV.ind, y: ky }); mode.set(k.uid, 'leaf'); d.push('M' + rx + ' ' + r(ky + CH / 2) + 'H' + (x + GV.ind)); last = ky + CH / 2; ky += CH + GV.s; }
          d.push('M' + rx + ' ' + (y + CH) + 'V' + r(last));
          return;
        }
        let kx = x + (s.w - s.rw) / 2; const ky = y + CH + GV.y;
        for (const k of ks) { place(k, kx, ky); kx += size.get(k.uid).w + GV.x; }
        const centers = ks.map((k) => pos.get(k.uid).x + CW / 2);
        const px = PM.clamp((centers[0] + centers[centers.length - 1]) / 2 - CW / 2, x, x + s.w - CW);
        pos.set(w.uid, { x: px, y });
        const pcx = px + CW / 2, by = r(y + CH + GV.y / 2);
        d.push('M' + r(pcx) + ' ' + (y + CH) + 'V' + by);
        let x1 = pcx, x2 = pcx; for (const c of centers) { if (c < x1) x1 = c; if (c > x2) x2 = c; }
        if (x2 - x1 > 1) d.push('M' + r(x1) + ' ' + by + 'H' + r(x2));
        for (const c of centers) d.push('M' + r(c) + ' ' + by + 'V' + ky);
      };
      const s = meas(P.top);
      place(P.top, M, M + capH);
      W = s.w + 2 * M; H = s.h + 2 * M + capH;
    }
    const walk = (w) => { order.push(w.uid); for (const k of vis(w)) walk(k); };
    walk(P.top);
    /* el rótulo cabe completo: si es más ancho que el árbol, el árbol se centra bajo él */
    const minW = capW ? capW + 2 * M : 0;
    const dx = minW > W ? Math.round((minW - W) / 2) : 0;
    return { W: Math.ceil(Math.max(W, minW)), H: Math.ceil(H), dx, pos, mode, path: d.join(''), order };
  }

  /* Navegación con flechas: hacia el padre y hacia los hijos según la disposición; en los demás casos, el elemento más
     cercano en la dirección de la flecha (navegación espacial). */
  function spatial(L, fromUid, key) {
    const p = L.pos.get(fromUid); if (!p) return null;
    const horiz = key === 'ArrowLeft' || key === 'ArrowRight';
    let best = null, bestS = Infinity, beamFound = false;
    for (const [uid, q] of L.pos) {
      if (uid === fromUid) continue;
      const dx = q.x - p.x, dy = q.y - p.y;
      let a, b;
      if (key === 'ArrowDown') { a = dy; b = dx; } else if (key === 'ArrowUp') { a = -dy; b = dx; } else if (key === 'ArrowRight') { a = dx; b = dy; } else { a = -dx; b = dy; }
      if (a < 4) continue;
      /* primero los elementos alineados (misma fila o columna); si no hay, el más cercano dentro de un cono */
      const beam = Math.abs(b) < (horiz ? CH : CW);
      if (beam && !beamFound) { beamFound = true; bestS = Infinity; best = null; }
      if (!beam && (beamFound || Math.abs(b) > a * 2 + CW * 1.5)) continue;
      const sc = beam ? a + Math.abs(b) * 0.25 : a + Math.abs(b) * 2;
      if (sc < bestS) { bestS = sc; best = uid; }
    }
    return best;
  }
  function navTarget(L, P, uid, key, orient) {
    const w = P.byUid.get(uid); if (!w) return null;
    const toParent = orient === 'v' ? 'ArrowUp' : 'ArrowLeft';
    const toKids = orient === 'v' ? 'ArrowDown' : 'ArrowRight';
    if (key === toParent && w.parent && !(orient === 'v' && L.mode.get(w.parent.uid) === 'stack')) return w.parent.uid;
    if (key === toKids) {
      const m = L.mode.get(uid);
      const kids = w.kids.filter((k) => L.pos.has(k.uid));
      if (kids.length && m === 'stack') return kids[0].uid;
      if (kids.length && m === 'row') {
        const p = L.pos.get(uid); let best = null, bd = Infinity;
        for (const k of kids) { const q = L.pos.get(k.uid); const dd = orient === 'v' ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y); if (dd < bd) { bd = dd; best = k.uid; } }
        return best;
      }
      if (orient === 'h') return null;
    }
    return spatial(L, uid, key);
  }

  /* ---------------------------------------------------------------- formato de los nodos */
  const metricOf = (n, m) => n.metric || m || 'money';
  function fmtValue(n, metric, cfg) {
    const v = num(n.value, 0);
    if (metric === 'money') return { short: PM.fmt.moneyShort(v, cfg.currency), full: PM.fmt.money(v, cfg.currency) };
    if (metric === 'count') { const t = plural(v, cfg.unitOne, cfg.unitMany); return { short: t, full: t }; }
    if (metric === 'score') { const t = v > 0 ? cfg.scoreLabel + ' ' + PM.fmt.num(v) : 'Sin evaluar'; return { short: t, full: t + (v > 0 && n.level ? ' (' + n.level + ')' : '') }; }
    return { short: PM.fmt.num(v, 1), full: PM.fmt.num(v, 2) };
  }
  function pctOf(n, metric, cfg) {
    if (metric === 'money') return PM.isNum(n.pct) ? Number(n.pct) : cfg.rootValue > 0 ? num(n.value) / cfg.rootValue : null;
    if (metric === 'count') return cfg.rootValue > 0 ? num(n.value) / cfg.rootValue : null;
    return null;
  }
  /* nombre sin el código repetido al inicio («R-001 · Lluvias…» → «Lluvias…»: el código va en la franja) */
  const shownName = (n) => { const l = txt(n.label) || 'Sin nombre'; const c = txt(n.code); return c && l.startsWith(c + ' · ') ? l.slice(c.length + 3) || l : l; };
  /* texto de la franja: insignia y nivel (nunca solo color) */
  function tagOf(n, isRoot) {
    const leaf = !arr(n.children).length;
    const parts = [];
    if (n.badge) parts.push(txt(n.badge));
    if (n.level) parts.push(leaf && !isRoot ? txt(n.level) : 'Máx.: ' + txt(n.level));
    if (!parts.length && n.kind === 'reserve') parts.push('Reserva');
    if (!parts.length && isRoot) parts.push('Total');
    if (!parts.length && TONES.has(n.tone)) parts.push(TONE_WORD[n.tone]);
    return parts.join(' · ');
  }
  function nodeLabel(w, cfg, open) {
    const n = w.n; const m = metricOf(n, cfg.metric); const v = fmtValue(n, m, cfg);
    const p = w.depth > 1 ? pctOf(n, m, cfg) : null;
    const parts = [(n.code ? txt(n.code) + ' ' : '') + shownName(n) + ': ' + v.full];
    if (p !== null) parts.push(PM.fmt.pct(p, 1) + ' del total');
    const tag = tagOf(n, w.depth === 1); if (tag && tag !== 'Total') parts.push(tag);
    if (txt(n.sub)) parts.push(txt(n.sub));
    if (w.kids.length && !open) parts.push(plural(w.desc, 'elemento oculto', 'elementos ocultos'));
    if (!w.kids.length && cfg.hasActivate && w.depth > 1 && cfg.activateHint) parts.push(cfg.activateHint);
    return parts.join('. ');
  }

  /* Tarjeta del diagrama (memorizada: al mover el foco o plegar solo se vuelven a dibujar las tarjetas que cambian). */
  const TreeNode = PM.memo(function TreeNode({ w, x, y, open, tab, cfg, api, orient }) {
    const n = w.n; const isRoot = w.depth === 1; const nk = w.kids.length;
    const m = metricOf(n, cfg.metric); const v = fmtValue(n, m, cfg); const p = isRoot ? null : pctOf(n, m, cfg);
    const tone = !isRoot && TONES.has(n.tone) ? n.tone : null;
    const code = txt(n.code) ? clip(n.code, 90, F.code) : '';
    const tag = tagOf(n, isRoot);
    const tagTxt = tag ? clip(tag, CW - 22 - (code ? tw(code, F.code) + 10 : 0), F.tag) : '';
    const fullName = shownName(n);
    const name = wrap(fullName, CW - 22, 2, F.name);
    const sub = txt(n.sub) ? clip(n.sub, CW - 22, F.sub) : '';
    const pctTxt = p !== null ? PM.fmt.pct(p, 1) : '';
    const valTxt = clip(v.short, CW - 22 - (pctTxt ? tw(pctTxt, F.pct) + 8 : 0), F.val);
    const pill = nk ? (open ? '−' : '+' + PM.fmt.num(w.desc)) : null;
    const pw = pill ? Math.max(18, Math.ceil(tw(pill, F.pill)) + 10) : 0;
    const pillAt = orient === 'h' ? { x: CW - pw / 2, y: CH / 2 - 7 } : { x: CW / 2 - pw / 2, y: CH - 7 };
    const meter = !isRoot && p !== null && m === 'money';
    return html`<g class=${cx('trd-node', isRoot && 'is-root', n.kind === 'reserve' && 'is-reserve', nk ? 'is-group' : 'is-leaf', tone && 't-' + tone, !nk && !(cfg.hasActivate && !isRoot) && 'is-static')}
        transform=${'translate(' + x + ',' + y + ')'} role="treeitem" tabindex=${tab ? '0' : '-1'}
        aria-level=${w.depth} aria-setsize=${w.setSize} aria-posinset=${w.index + 1} aria-expanded=${nk ? (open ? 'true' : 'false') : undefined}
        aria-label=${nodeLabel(w, cfg, open)} data-uid=${w.uid} data-parent=${w.parent ? w.parent.uid : ''} data-value=${num(n.value, 0)} data-kind=${n.kind || ''}
        onClick=${() => api.current.click(w.uid)}>
      <rect class="trd-ring" x="-4" y="-4" width=${CW + 8} height=${CH + 8} rx="8" />
      <rect class="trd-card" x="0.5" y="0.5" width=${CW - 1} height=${CH - 1} rx="5" />
      <path class="trd-band" d=${'M1 6a5 5 0 0 1 5-5H' + (CW - 6) + 'a5 5 0 0 1 5 5V21H1z'} />
      ${tone ? html`<path class="trd-edge" d=${'M1 6a5 5 0 0 1 5-5V' + (CH - 1) + 'a5 5 0 0 1-5-5z'} />` : null}
      ${code ? html`<text class="trd-code" x="10" y="15">${code}</text>` : null}
      ${tagTxt ? html`<text class="trd-tag" x=${CW - 9} y="15" text-anchor="end">${tagTxt}</text>` : null}
      <text class="trd-name" x="10" y="39">${name.cut ? html`<title>${fullName}</title>` : null}${name.lines.map((l, i) => html`<tspan key=${i} x="10" dy=${i ? 15 : 0}>${l}</tspan>`)}</text>
      ${sub ? html`<text class="trd-sub" x="10" y="72">${sub !== txt(n.sub) ? html`<title>${txt(n.sub)}</title>` : null}${sub}</text>` : null}
      <text class="trd-val" x="10" y="90"><title>${v.full}</title>${valTxt}</text>
      ${pctTxt ? html`<text class="trd-pct" x=${CW - 10} y="90" text-anchor="end">${pctTxt}</text>` : null}
      ${meter ? html`<rect class="trd-meter-bg" x="10" y="96" width=${CW - 20} height="3" rx="1.5" /><rect class="trd-meter" x="10" y="96" width=${Math.max(0, Math.min(1, p)) * (CW - 20)} height="3" rx="1.5" />` : null}
      ${pill ? html`<g class="trd-pill" aria-hidden="true" transform=${'translate(' + pillAt.x + ',' + pillAt.y + ')'}><rect x="0.5" y="0.5" width=${pw - 1} height="13" rx="6.5" /><text x=${pw / 2} y="10.5" text-anchor="middle">${pill}</text></g>` : null}
    </g>`;
  });

  /* ---------------------------------------------------------------- PM.TreeDiagram
     Props: root (nodo de PM.res.*), metric ('money'|'count'|'score'), currency, orientation ('v' raíz arriba | 'h' de
     izquierda a derecha), title (nombre accesible y del archivo exportado), caption (rótulo dibujado en el diagrama),
     fileName (sin extensión), prefKey (recuerda disposición, zoom y vista de tabla), resetKey (al cambiar, vuelve al
     plegado inicial), onActivate(nodo) (clic o Enter en una hoja), activateHint, countUnit ['riesgo','riesgos'],
     scoreLabel ('P×I'). */
  function TreeDiagram({ root, metric = 'money', currency = 'COP', orientation = 'v', title = 'Diagrama de árbol', caption = '', fileName = 'estructura-de-desglose', prefKey = null, resetKey = '', onActivate = null, activateHint = '', countUnit, scoreLabel = 'Puntuación', emptyText = 'No hay elementos para mostrar.' }) {
    const pref = (k, dflt) => (prefKey ? PM.prefs.get(prefKey + '.' + k, dflt) : dflt);
    const setPref = (k, v) => { if (prefKey) PM.prefs.set(prefKey + '.' + k, v); };
    const [orient, setOrientRaw] = useState(() => { const o = pref('orient', orientation); return o === 'h' || o === 'v' ? o : orientation === 'h' ? 'h' : 'v'; });
    const [zoom, setZoomRaw] = useState(() => { const z = pref('zoom', 'fit'); return z === 'fit' || (PM.isNum(z) && z >= ZOOMS[0] && z <= ZOOMS[ZOOMS.length - 1]) ? z : 'fit'; });
    const [asTable, setAsTableRaw] = useState(() => pref('table', false) === true);
    const [host, setHost] = useState({ w: 0, h: 0 });
    const [fontTick, setFontTick] = useState(0);
    const [focusUid, setFocusUid] = useState(null);
    const [busy, setBusy] = useState(false);
    const [user, setUser] = useState({ key: resetKey, set: null });
    const setOrient = (o) => { setOrientRaw(o); setPref('orient', o); };
    const setZoom = (z) => { setZoomRaw(z); setPref('zoom', z); };
    const setAsTable = (b) => { setAsTableRaw(b); setPref('table', b); };
    const svgRef = useRef(null), canvasRef = useRef(null), wantFocus = useRef(false), pan = useRef(null);
    const hintId = useMemo(() => PM.uid('trd-keys'), []);

    useEffect(() => { let live = true; try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) { wcache.clear(); setFontTick((t) => t + 1); } }); } catch (e) { /* sin API de fuentes */ } return () => { live = false; }; }, []);

    const P = useMemo(() => prepare(root), [root]);
    const autoSet = useMemo(() => autoCollapsed(P), [P]);
    const collapsed = user.key === resetKey && user.set ? user.set : autoSet;
    const setCollapsed = (s) => setUser({ key: resetKey, set: s });
    const capH = caption ? 30 : 0;
    const capW = caption ? Math.ceil(tw(caption, F.cap)) + 4 : 0;
    const L = useMemo(() => layout(P, collapsed, orient, capH, capW), [P, collapsed, orient, capH, capW]);

    const m0 = metricOf(isObj(root) ? root : {}, metric);
    const unit = Array.isArray(countUnit) && countUnit.length === 2 ? countUnit : ['elemento', 'elementos'];
    const rootValue = isObj(root) ? num(root.value, 0) : 0;
    const cfg = useMemo(() => ({ metric: m0, currency, unitOne: unit[0], unitMany: unit[1], scoreLabel, rootValue, hasActivate: typeof onActivate === 'function', activateHint, tick: fontTick }), [m0, currency, unit[0], unit[1], scoreLabel, rootValue, typeof onActivate === 'function', activateHint, fontTick]);

    /* foco itinerante: un solo elemento con tabindex 0; si queda oculto, pasa al ancestro visible */
    const focusVisible = useMemo(() => { let w = focusUid ? P.byUid.get(focusUid) : null; while (w && !L.pos.has(w.uid)) w = w.parent; return w ? w.uid : P.top ? P.top.uid : null; }, [focusUid, P, L]);
    const focusEl = (uid) => { const el = svgRef.current && [...svgRef.current.querySelectorAll('[data-uid]')].find((g) => g.getAttribute('data-uid') === uid); if (el) el.focus(); };
    const focusTo = (uid) => { if (!uid) return; if (uid === focusVisible) { focusEl(uid); return; } wantFocus.current = true; setFocusUid(uid); };
    useLayoutEffect(() => { if (!wantFocus.current) return; wantFocus.current = false; focusEl(focusVisible); }, [focusVisible, L]);

    const toggle = (uid) => { const s = new Set(collapsed); if (s.has(uid)) s.delete(uid); else s.add(uid); setCollapsed(s); };
    const activate = (w) => { if (w.kids.length) toggle(w.uid); else if (typeof onActivate === 'function' && w.depth > 1) onActivate(w.n); };
    const api = useRef(null);
    api.current = { click: (uid) => { const w = P.byUid.get(uid); if (!w) return; setFocusUid(uid); activate(w); } };

    const onKeyDown = (e) => {
      const g = e.target && e.target.closest ? e.target.closest('[data-uid]') : null; if (!g) return;
      const uid = g.getAttribute('data-uid'); const w = P.byUid.get(uid); if (!w) return;
      const k = e.key;
      if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); setFocusUid(uid); activate(w); return; }
      if (k === 'Home') { e.preventDefault(); focusTo(P.top.uid); return; }
      if (k === 'End') { e.preventDefault(); focusTo(L.order[L.order.length - 1]); return; }
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        const next = navTarget(L, P, uid, k, orient);
        if (next) focusTo(next);
      }
    };

    /* tamaño del contenedor (ajustar al ancho) */
    useLayoutEffect(() => {
      const el = canvasRef.current; if (!el) return undefined;
      const upd = () => setHost((h) => (h.w === el.clientWidth && h.h === el.clientHeight ? h : { w: el.clientWidth, h: el.clientHeight }));
      upd();
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }
      const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
    }, [asTable, !!P.top]);
    const fit = host.w > 0 && L.W > 0 ? PM.clamp((host.w - 2) / L.W, ZOOMS[0], 1) : 1;
    const scale = zoom === 'fit' ? fit : Number(zoom);
    const stepZoom = (dir) => { const next = dir > 0 ? ZOOMS.find((z) => z > scale + 0.005) : [...ZOOMS].reverse().find((z) => z < scale - 0.005); if (next) setZoom(next); };
    /* al cambiar el zoom se conserva el centro de la vista */
    const prevScale = useRef(scale);
    useLayoutEffect(() => {
      const el = canvasRef.current; const old = prevScale.current; prevScale.current = scale;
      if (!el || !old || Math.abs(old - scale) < 1e-6) return;
      const cxr = (el.scrollLeft + el.clientWidth / 2) / old, cyr = (el.scrollTop + el.clientHeight / 2) / old;
      el.scrollLeft = Math.max(0, cxr * scale - el.clientWidth / 2); el.scrollTop = Math.max(0, cyr * scale - el.clientHeight / 2);
    }, [scale]);
    const canPan = L.W * scale > host.w + 1 || L.H * scale > host.h + 1;

    /* arrastrar el fondo para desplazarse (mouse) */
    const onPointerDown = (e) => {
      const el = canvasRef.current;
      if (!el || e.button !== 0 || e.pointerType !== 'mouse' || !canPan) return;
      if (e.target && e.target.closest && e.target.closest('.trd-node')) return;
      const rc = el.getBoundingClientRect();
      if (e.clientX - rc.left > el.clientWidth || e.clientY - rc.top > el.clientHeight) return; /* barras de desplazamiento */
      pan.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop, id: e.pointerId };
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
      el.classList.add('is-panning');
    };
    const onPointerMove = (e) => { const p = pan.current; const el = canvasRef.current; if (!p || !el) return; el.scrollLeft = p.l - (e.clientX - p.x); el.scrollTop = p.t - (e.clientY - p.y); };
    const endPan = () => { const p = pan.current; const el = canvasRef.current; if (!p) return; pan.current = null; if (el) { try { el.releasePointerCapture(p.id); } catch (er) { /* ya liberada */ } el.classList.remove('is-panning'); } };

    /* ---------------- exportación */
    const svgText = () => {
      const el = svgRef.current; if (!el) return '';
      let s = PM.svgToString(el);
      try {
        const doc = new DOMParser().parseFromString(s, 'image/svg+xml');
        const sv = doc.documentElement;
        if (sv && sv.nodeName.toLowerCase() === 'svg' && !doc.getElementsByTagName('parsererror').length) {
          sv.setAttribute('width', String(L.W)); sv.setAttribute('height', String(L.H));
          ['role', 'aria-label', 'aria-describedby', 'tabindex'].forEach((a) => sv.removeAttribute(a));
          [...sv.querySelectorAll('[tabindex]')].forEach((g) => { g.removeAttribute('tabindex'); g.removeAttribute('role'); });
          const t = doc.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = title + (caption ? ' — ' + caption : '');
          sv.insertBefore(t, sv.firstChild);
          s = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(sv);
        }
      } catch (e) { /* se exporta tal cual */ }
      const cs = getComputedStyle(document.documentElement);
      return s.replace(/var\((--[\w-]+)\)/g, (m1, v) => cs.getPropertyValue(v).trim() || m1);
    };
    const downloadSvg = () => { const s = svgText(); if (s) PM.download(fileName + '.svg', s); };
    const downloadPng = async () => {
      const s = svgText(); if (!s) return;
      const k = Math.min(2, 16000 / L.W, 16000 / L.H, Math.sqrt(64e6 / (L.W * L.H)));
      if (!(k >= 0.35)) { PM.toast('El diagrama es demasiado grande para una imagen PNG. Pliega algunas ramas o descárgalo en SVG.', { tone: 'crit' }); return; }
      setBusy(true);
      try {
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('svg')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(L.W * k)); c.height = Math.max(1, Math.round(L.H * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const name = fileName + '.png';
        const dl = await PM.caps.downloads;
        if (dl) {
          const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
          if (!blob) throw new Error('png');
          await PM.download(name, blob);
        } else {
          const url = c.toDataURL('image/png');
          PM.openModal((close) => html`<${ui.Modal} title="Imagen PNG del diagrama" subtitle=${name} size="wide" onClose=${close} footer=${html`<${ui.Button} variant="primary" onClick=${close}>Cerrar</${ui.Button}>`}>
            <p class="small muted">Este visor no permite descargar archivos. Haz clic derecho sobre la imagen (o mantenla presionada) y elige «Guardar imagen como…».</p>
            <img class="trd-png" src=${url} alt=${title + (caption ? ' — ' + caption : '')} width=${Math.round(L.W)} />
          </${ui.Modal}>`);
        }
      } catch (e) {
        PM.toast('No se pudo generar la imagen PNG en este navegador. Descarga el diagrama en SVG.', { tone: 'crit' });
      } finally { setBusy(false); }
    };
    const tableRows = () => P.order.map((w) => {
      const n = w.n; const mm = metricOf(n, cfg.metric); const v = fmtValue(n, mm, cfg); const p = w.depth > 1 ? pctOf(n, mm, cfg) : null;
      return { nivel: w.depth - 1, codigo: txt(n.code), elemento: shownName(n), detalle: txt(n.sub), valor: mm === 'money' ? Math.round(num(n.value) * 100) / 100 : v.full, pct: p !== null ? Math.round(p * 1000) / 10 : '', insignia: tagOf(n, w.depth === 1) };
    });
    const downloadCsv = () => {
      const cols = [{ key: 'nivel', label: 'Nivel' }, { key: 'codigo', label: 'Código' }, { key: 'elemento', label: 'Elemento' }, { key: 'detalle', label: 'Detalle' }, { key: 'valor', label: cfg.metric === 'money' ? 'Valor (' + currency + ')' : 'Valor' }, { key: 'pct', label: '% del total' }, { key: 'insignia', label: 'Nivel o insignia' }];
      PM.download(fileName + '.csv', PM.toCSV(cols, tableRows(), currency));
    };

    if (!P.top) return html`<${ui.Empty} icon="breakdown" title=${emptyText} />`;
    const hidden = P.order.length - L.order.length;
    const anyGroups = P.order.some((w) => w.kids.length);
    const expandAll = () => setCollapsed(new Set());
    const collapseFirst = () => { const s = new Set(); for (const w of P.order) if (w.depth >= 2 && w.kids.length) s.add(w.uid); setCollapsed(s); };
    const label = title + (caption ? ' — ' + caption : '');

    const toolbar = html`<div class="trd-toolbar" role="group" aria-label=${'Herramientas: ' + title}>
      ${asTable ? null : html`<div class="trd-tgroup"><span class="trd-tlabel">Disposición</span><${ui.Segmented} label="Disposición del diagrama" options=${[{ value: 'v', label: 'Vertical' }, { value: 'h', label: 'Horizontal' }]} value=${orient} onChange=${setOrient} /></div>`}
      ${asTable ? null : html`<div class="trd-zoom" role="group" aria-label="Zoom del diagrama">
        <${ui.IconButton} size="sm" icon="zoom-out" label="Alejar" disabled=${scale <= ZOOMS[0] + 0.001} onClick=${() => stepZoom(-1)} />
        <span class="trd-zoom-v" aria-live="polite" data-trd-zoom><span class="sr-only">Zoom: </span>${Math.round(scale * 100)} %</span>
        <${ui.IconButton} size="sm" icon="zoom-in" label="Acercar" disabled=${scale >= ZOOMS[ZOOMS.length - 1] - 0.001} onClick=${() => stepZoom(1)} />
        <${ui.Button} size="sm" variant="ghost" aria-pressed=${zoom !== 'fit' && Math.abs(scale - 1) < 0.001 ? 'true' : 'false'} onClick=${() => setZoom(1)} title="Ver a tamaño real" aria-label="Zoom al 100 %">100 %</${ui.Button}>
        <${ui.Button} size="sm" variant="ghost" icon="expand" aria-pressed=${zoom === 'fit' ? 'true' : 'false'} onClick=${() => setZoom('fit')}>Ajustar</${ui.Button}>
      </div>`}
      ${asTable || !anyGroups ? null : html`<div class="trd-tgroup">
        <${ui.Button} size="sm" variant="ghost" icon="plus" onClick=${expandAll} disabled=${!collapsed.size}>Desplegar todo</${ui.Button}>
        <${ui.Button} size="sm" variant="ghost" icon="minus" onClick=${collapseFirst}>Plegar al primer nivel</${ui.Button}>
      </div>`}
      <div class="trd-tgroup" style="margin-left:auto">
        <${ui.Button} size="sm" icon="table" aria-pressed=${asTable ? 'true' : 'false'} onClick=${() => setAsTable(!asTable)}>Ver como tabla</${ui.Button}>
        ${asTable
          ? html`<${ui.Button} size="sm" icon="download" onClick=${downloadCsv}>Descargar CSV</${ui.Button}>`
          : html`<${ui.Button} size="sm" icon="image" onClick=${downloadSvg}>Descargar SVG</${ui.Button}><${ui.Button} size="sm" icon="download" onClick=${downloadPng} disabled=${busy} aria-busy=${busy ? 'true' : undefined}>${busy ? 'Generando PNG…' : 'Descargar PNG'}</${ui.Button}>`}
      </div>
    </div>`;

    if (asTable) {
      return html`<div class="trd" data-trd=${prefKey || ''}>
        ${toolbar}
        <div class="table-wrap trd-table-wrap">
          <table class="table trd-table" aria-label=${label + ' (tabla)'}>
            <thead><tr><th scope="col">Elemento</th><th scope="col">Detalle</th><th scope="col" class="num">Valor</th><th scope="col" class="num">% del total</th><th scope="col">Nivel o insignia</th></tr></thead>
            <tbody>${P.order.map((w) => {
              const n = w.n; const mm = metricOf(n, cfg.metric); const v = fmtValue(n, mm, cfg); const p = w.depth > 1 ? pctOf(n, mm, cfg) : null;
              const leafAct = !w.kids.length && w.depth > 1 && typeof onActivate === 'function';
              const nameEl = leafAct ? html`<button type="button" class="trd-linkbtn" onClick=${() => onActivate(n)} title=${activateHint || undefined}>${shownName(n)}</button>` : shownName(n);
              return html`<tr key=${w.uid} class=${'d' + Math.min(w.depth, 3)} data-uid=${w.uid}>
                <th scope="row" style=${'padding-left:' + (10 + (w.depth - 1) * 18) + 'px'}>${n.code ? html`<span class="code-tag">${txt(n.code)}</span>` : null}${nameEl}</th>
                <td class="trd-sub-cell">${txt(n.sub) || html`<span class="faint">—</span>`}</td>
                <td class="num" title=${v.full}>${mm === 'money' ? v.full : v.short}</td>
                <td class="num">${p !== null ? PM.fmt.pct(p, 1) : '—'}</td>
                <td>${tagOf(n, w.depth === 1) || html`<span class="faint">—</span>`}</td>
              </tr>`;
            })}</tbody>
          </table>
        </div>
      </div>`;
    }

    return html`<div class="trd" data-trd=${prefKey || ''}>
      ${toolbar}
      <div class=${cx('chart trd-canvas', canPan && 'can-pan')} ref=${canvasRef} onPointerDown=${onPointerDown} onPointerMove=${onPointerMove} onPointerUp=${endPan} onPointerCancel=${endPan} onLostPointerCapture=${endPan}>
        <svg ref=${svgRef} xmlns="http://www.w3.org/2000/svg" width=${Math.max(1, Math.round(L.W * scale))} height=${Math.max(1, Math.round(L.H * scale))} viewBox=${'0 0 ' + L.W + ' ' + L.H}
          role="tree" aria-label=${label} aria-describedby=${hintId} onKeyDown=${onKeyDown}>
          ${caption ? html`<text class="trd-caption" x=${M} y=${M + 13} aria-hidden="true">${clip(caption, Math.max(80, L.W - 2 * M), F.cap)}</text>` : null}
          <path class="trd-link" d=${L.path} aria-hidden="true" transform=${L.dx ? 'translate(' + L.dx + ',0)' : undefined} />
          ${L.order.map((uid) => { const w = P.byUid.get(uid); const q = L.pos.get(uid); return html`<${TreeNode} key=${uid} w=${w} x=${q.x + L.dx} y=${q.y} open=${!collapsed.has(uid)} tab=${uid === focusVisible} cfg=${cfg} api=${api} orient=${orient} />`; })}
        </svg>
      </div>
      <div class="trd-keys" id=${hintId}>
        <span><span class="kbd">Tab</span> entra al diagrama</span>
        <span><span class="kbd">←</span><span class="kbd">↑</span><span class="kbd">→</span><span class="kbd">↓</span> moverse entre elementos</span>
        <span><span class="kbd">Enter</span> o <span class="kbd">Espacio</span> plegar o desplegar una rama${typeof onActivate === 'function' && activateHint ? ' (en un elemento final: ' + activateHint + ')' : ''}</span>
        <span><span class="kbd">Inicio</span> raíz</span>
        <span>Arrastra el fondo para desplazarte.</span>
      </div>
      ${hidden > 0 ? html`<div class="trd-hidden" role="status">${plural(hidden, 'elemento oculto', 'elementos ocultos')} en ramas plegadas: despliégalas con un clic, con Enter o con «Desplegar todo».</div>` : null}
    </div>`;
  }
  PM.TreeDiagram = TreeDiagram;

  /* ---------------------------------------------------------------- utilidades de las pestañas */
  /* estado de los controles de una pestaña, recordado en las preferencias de la vista */
  function usePrefState(key, defaults) {
    const [v, setV] = useState(() => { const s = PM.prefs.get(key, null); return { ...defaults, ...(isObj(s) ? s : {}) }; });
    const set = (patch) => setV((cur) => { const next = { ...cur, ...patch }; PM.prefs.set(key, next); return next; });
    return [v, set];
  }
  const fileBase = (project, suffix) => ((project && (txt(project.code) || PM.slug(project.name))) || 'proyecto') + '_' + suffix;
  const captionOf = (project, what, extra) => [what, project && (txt(project.code) || txt(project.name)), extra, PM.fmt.date(PM.date.today())].filter(Boolean).join(' · ');
  const openDoc = (tid) => {
    if (typeof PM.openDocument === 'function') return PM.openDocument(tid);
    if (PM.getView('documentos')) return PM.navigate('documentos');
    PM.toast('El editor de documentos no está disponible en esta página.');
    return undefined;
  };
  function Note({ tone, icon = 'info', children, actions }) {
    return html`<div class=${cx('brk-note', tone && 'is-' + tone)} role=${tone === 'warn' ? 'status' : undefined}><${ui.Icon} name=${icon} size=${16} /><div class="brk-note-body">${children}${actions ? html`<div class="row">${actions}</div>` : null}</div></div>`;
  }
  const Ctl = ({ label, id, children }) => html`<div class="brk-ctl">${label ? (id ? html`<label class="brk-ctl-label" for=${id}>${label}</label>` : html`<span class="brk-ctl-label" aria-hidden="true">${label}</span>`) : null}${children}</div>`;
  const Stats = ({ items }) => html`<div class="brk-stats">${items.filter(Boolean).map((s) => html`<${ui.Stat} key=${s.label} label=${s.label} value=${s.value} sub=${s.sub} tone=${s.tone} title=${s.title} />`)}</div>`;
  const leavesOf = (n, out = []) => { if (!isObj(n)) return out; const ch = arr(n.children); if (!ch.length) out.push(n); else for (const c of ch) leavesOf(c, out); return out; };
  const find = (n, id) => arr(n && n.children).find((c) => c && c.id === id) || null;

  /* ---------------------------------------------------------------- Costos (7.3, gráfico 7-8) */
  function BudgetBar({ accounts, cont, mgmt, currency }) {
    const total = accounts + cont + mgmt;
    if (!(total > 0)) return null;
    const segs = [
      { id: 'cc', label: 'Cuentas de control', v: accounts, color: 'var(--s1)' },
      { id: 'rc', label: 'Reserva para contingencias', v: cont, color: 'var(--s4)' },
      { id: 'rg', label: 'Reserva de gestión', v: mgmt, color: 'var(--s7)' },
    ];
    const lb = accounts + cont;
    const pct = (v) => (v / total) * 100;
    const aria = 'Componentes del presupuesto: ' + segs.map((s) => s.label + ' ' + PM.fmt.money(s.v, currency) + ' (' + PM.fmt.pct(s.v / total, 1) + ')').join('; ');
    return html`<section class="card brk-budget" aria-label="Componentes del presupuesto">
      <div class="brk-budget-title">Componentes del presupuesto</div>
      <div class="brk-bar" role="img" aria-label=${aria}>${segs.filter((s) => s.v > 0).map((s) => html`<span key=${s.id} style=${'width:' + pct(s.v) + '%;background:' + s.color} title=${s.label + ': ' + PM.fmt.money(s.v, currency)}></span>`)}</div>
      <div class="brk-spans">
        <div style=${'width:' + Math.max(pct(lb), 30) + '%;max-width:100%'}><div class="brk-span"></div><div class="brk-span-l">Línea base de costos: <strong title=${PM.fmt.money(lb, currency)}>${PM.fmt.moneyShort(lb, currency)}</strong> (cuentas de control + reserva para contingencias)</div></div>
        <div><div class="brk-span"></div><div class="brk-span-l">Presupuesto del proyecto: <strong title=${PM.fmt.money(total, currency)}>${PM.fmt.moneyShort(total, currency)}</strong> (línea base de costos + reserva de gestión)</div></div>
      </div>
      <div class="legend brk-legend">${segs.map((s) => html`<span class="legend-item" key=${s.id}><span class="swatch" style=${'background:' + s.color}></span>${s.label}: <strong title=${PM.fmt.money(s.v, currency)}>${PM.fmt.moneyShort(s.v, currency)}</strong> (${PM.fmt.pct(s.v / total, 1)})</span>`)}</div>
    </section>`;
  }

  function CostTab({ model }) {
    const { tree, sched, schedule, resources, costs, baselines, currency, project } = model;
    const [st, set] = usePrefState('estructuras.cbs', { source: 'plan', by: 'edt', depth: 1, acts: false });
    const bl = baselines && baselines.cost && isObj(baselines.cost.cost) ? baselines.cost : null;
    const source = st.source === 'baseline' && bl ? 'baseline' : 'plan';
    const depths = tree.flat.map((f) => f.depth);
    const minD = depths.length ? depths.reduce((a, b) => Math.min(a, b), Infinity) : 1;
    const maxDepth = depths.length ? depths.reduce((a, b) => Math.max(a, b), 0) - minD + 1 : 1;
    const depth = PM.clamp(Math.round(num(st.depth, 1)), 1, Math.max(1, maxDepth));
    const by = st.by === 'categoria' ? 'categoria' : 'edt';
    const acts = st.acts === true;
    const reserves = costs && costs.reserves;
    const root = useMemo(() => PM.res.cbsTree({ tree, sched, schedule, data: resources, baseline: bl, reserves, source, controlDepth: depth, showActivities: acts, by }), [tree, sched, schedule, resources, bl, reserves, source, depth, acts, by]);
    const mgmt = find(root, 'cbs:gestion'), base = find(root, 'cbs:lb'), cont = find(base, 'cbs:cont');
    const vM = num(mgmt && mgmt.value), vB = num(base && base.value), vC = num(cont && cont.value);
    const accounts = vB - vC;
    const nAccounts = arr(base && base.children).filter((c) => c.id !== 'cbs:cont').length;
    const budget = num(project && project.budget, 0);
    const diff = budget > 0 ? root.value - budget : 0;
    const blName = bl ? txt(bl.label) || 'LB' + num(bl.number, 0) : '';
    const levels = Array.from({ length: Math.max(1, maxDepth) }, (_, i) => ({ value: String(i + 1), label: 'Nivel ' + (i + 1) + ' (' + (i === 0 ? '1.1, 1.2…' : '1.1.' + Array(i).fill('1').join('.') + '…') + ')' }));
    const empty = source === 'plan' && !arr(sched && sched.tasks).length && !num(reserves && reserves.contingency) && !num(reserves && reserves.management);
    if (empty) {
      return html`<div class="brk-panel"><${ui.Empty} icon="money" title="Aún no hay costos para desglosar" actions=${html`<${ui.Button} variant="primary" icon="gantt" onClick=${() => PM.navigate('cronograma')}>Ir al cronograma</${ui.Button}><${ui.Button} icon="wbs" onClick=${() => PM.navigate('edt')}>Ir a la EDT</${ui.Button}>`}>
        La estructura de desglose de costos se arma con el costo de las actividades del cronograma, agrupadas por las cuentas de control de la EDT, y con las reservas para contingencias y de gestión.
      </${ui.Empty}></div>`;
    }
    const idDepth = 'brk-cbs-depth';
    return html`<div class="brk-panel" data-brk="costos">
      <section class="card brk-controls" aria-label="Opciones de la estructura de desglose de costos">
        <${Ctl} label="Fuente"><${ui.Segmented} label="Fuente de los costos" value=${source} onChange=${(v) => set({ source: v })}
          options=${[{ value: 'plan', label: 'Plan actual' }, { value: 'baseline', label: bl ? 'Línea base ' + blName : 'Línea base de costos', disabled: !bl, title: bl ? 'Línea base de costos vigente (' + blName + (bl.date ? ', ' + PM.fmt.date(String(bl.date).slice(0, 10)) : '') + ')' : 'Aún no hay una línea base de costos establecida' }]} /></${Ctl}>
        <${Ctl} label="Agrupar por"><${ui.Segmented} label="Agrupar por" value=${by} onChange=${(v) => set({ by: v })} options=${[{ value: 'edt', label: 'EDT' }, { value: 'categoria', label: 'Categoría de costo' }]} /></${Ctl}>
        <${Ctl} label="Nivel de las cuentas de control" id=${idDepth}><${ui.Select} id=${idDepth} value=${String(depth)} options=${levels} disabled=${by !== 'edt' || maxDepth <= 1} onValue=${(v) => set({ depth: Number(v) || 1 })} /></${Ctl}>
        <${Ctl}><${ui.Check} label="Mostrar actividades" checked=${acts} onValue=${(v) => set({ acts: !!v })} /></${Ctl}>
      </section>
      <${Note}>
        <p><strong>Presupuesto del proyecto = reserva de gestión + línea base de costos.</strong> <strong>Línea base de costos = reserva para contingencias + cuentas de control</strong> (estimaciones de costos de los paquetes de trabajo y sus actividades). La reserva para contingencias cubre los riesgos identificados; la reserva de gestión, los imprevistos no identificados, y solo se usa con un cambio aprobado (Guía del PMBOK® 6.ª ed., 7.3, gráfico 7-8).</p>
        ${by === 'categoria' ? html`<p>Agrupado por categoría de costo: las actividades calculadas por recursos se reparten por el tipo de cada recurso; las de precio global, por su categoría de costo.</p>` : null}
        ${source === 'baseline' ? html`<p>Fuente: línea base ${blName}${bl && bl.date ? ' del ' + PM.fmt.date(String(bl.date).slice(0, 10)) : ''}. Los cambios posteriores del plan no se reflejan hasta establecer una nueva línea base.</p>` : null}
      </${Note}>
      <${Stats} items=${[
        { label: 'Presupuesto del proyecto', value: PM.fmt.moneyShort(root.value, currency), title: PM.fmt.money(root.value, currency), sub: budget > 0 ? (Math.abs(diff) < 1 ? 'Igual al presupuesto de la ficha' : 'Ficha: ' + PM.fmt.moneyShort(budget, currency) + ' (diferencia ' + PM.fmt.moneyShort(diff, currency) + ')') : 'Reserva de gestión + línea base' },
        { label: 'Reserva de gestión', value: PM.fmt.moneyShort(vM, currency), title: PM.fmt.money(vM, currency), sub: 'Fuera de la línea base' },
        { label: 'Línea base de costos', value: PM.fmt.moneyShort(vB, currency), title: PM.fmt.money(vB, currency), sub: source === 'baseline' ? blName : 'Plan actual' },
        { label: 'Reserva para contingencias', value: PM.fmt.moneyShort(vC, currency), title: PM.fmt.money(vC, currency), sub: 'Riesgos identificados' },
        { label: by === 'edt' ? 'Cuentas de control (BAC)' : 'Costo de las actividades (BAC)', value: PM.fmt.moneyShort(accounts, currency), title: PM.fmt.money(accounts, currency), sub: by === 'edt' ? plural(nAccounts, 'grupo', 'grupos') : plural(nAccounts, 'categoría', 'categorías') },
      ]} />
      <${BudgetBar} accounts=${accounts} cont=${vC} mgmt=${vM} currency=${currency} />
      <${TreeDiagram} root=${root} metric="money" currency=${currency} orientation="v" title="Estructura de desglose de costos"
        caption=${captionOf(project, 'Estructura de desglose de costos', source === 'baseline' ? 'Línea base ' + blName : 'Plan actual')}
        fileName=${fileBase(project, 'desglose-costos')} prefKey="estructuras.cbs.diagram" resetKey=${[source, by, depth, acts].join('|')} />
    </div>`;
  }

  /* ---------------------------------------------------------------- Riesgos (11.1 y 11.2, gráfico 11-4) */
  const isClosed = (r) => /^cerrad/i.test(txt(r && r.estado));
  const isOpp = (r) => /^oportunidad/i.test(txt(r && r.tipo));
  const LEVELS = [
    { label: 'Bajo', range: '1–4', tone: 'good' }, { label: 'Medio', range: '5–9', tone: 'warn' },
    { label: 'Alto', range: '10–19', tone: 'signal' }, { label: 'Muy alto', range: '20–25', tone: 'crit' },
  ];
  function RiskTab({ model }) {
    const { project } = model;
    const [planRows, , planMeta] = PM.useDocTable('plan-gestion-riesgos', 'edrRiesgos');
    const [risks, , regMeta] = PM.useDocTable('registro-riesgos', 'riesgos');
    const [st, set] = usePrefState('estructuras.rbr', { hideClosed: false, type: 'ambos' });
    const type = ['ambos', 'amenazas', 'oportunidades'].includes(st.type) ? st.type : 'ambos';
    const plan = useMemo(() => planRows.filter((r) => txt(r.nivel1)), [planRows]);
    const shown = useMemo(() => risks.filter((r) => (!st.hideClosed || !isClosed(r)) && (type === 'ambos' || (type === 'oportunidades') === isOpp(r))), [risks, st.hideClosed, type]);
    const root = useMemo(() => PM.res.riskTree({ planRows: plan, risks: shown }), [plan, shown]);
    if (planMeta.loading || regMeta.loading) return html`<div class="brk-panel"><${ui.Loading} rows=${5} /></div>`;
    if (!risks.length && !plan.length) {
      return html`<div class="brk-panel"><${ui.Empty} icon="risk" title="Aún no hay riesgos registrados" actions=${html`<${ui.Button} variant="primary" icon="file" onClick=${() => openDoc('registro-riesgos')}>Abrir el registro de riesgos</${ui.Button}><${ui.Button} icon="file" onClick=${() => openDoc('plan-gestion-riesgos')}>Abrir el plan de gestión de los riesgos</${ui.Button}>`}>
        La estructura de desglose de los riesgos agrupa los riesgos del registro según las categorías (nivel 1) y subcategorías (nivel 2) definidas en el plan de gestión de los riesgos.
      </${ui.Empty}></div>`;
    }
    const planKeys = new Set(plan.map((r) => keyOf(r.nivel2)).filter(Boolean));
    const unmatched = plan.length ? shown.filter((r) => !planKeys.has(keyOf(r.subcategoria))).length : 0;
    const scores = shown.map((r) => PM.calc.riskScore(r.probabilidad, r.impacto));
    const high = scores.filter((s) => s >= 10).length;
    const unevaluated = scores.filter((s) => !s).length;
    const opps = shown.filter(isOpp).length;
    return html`<div class="brk-panel" data-brk="riesgos">
      <section class="card brk-controls" aria-label="Filtros de la estructura de desglose de los riesgos">
        <${Ctl} label="Tipo"><${ui.Segmented} label="Tipo de riesgo" value=${type} onChange=${(v) => set({ type: v })} options=${[{ value: 'ambos', label: 'Ambos' }, { value: 'amenazas', label: 'Amenazas' }, { value: 'oportunidades', label: 'Oportunidades' }]} /></${Ctl}>
        <${Ctl}><${ui.Check} label="Ocultar riesgos cerrados" checked=${!!st.hideClosed} onValue=${(v) => set({ hideClosed: !!v })} /></${Ctl}>
        <div class="brk-ctl-actions">
          <${ui.Button} size="sm" icon="file" onClick=${() => openDoc('registro-riesgos')}>Abrir el registro de riesgos</${ui.Button}>
          <${ui.Button} size="sm" icon="file" onClick=${() => openDoc('plan-gestion-riesgos')}>Abrir el plan de gestión de los riesgos</${ui.Button}>
        </div>
      </section>
      ${!plan.length ? html`<${Note} tone="warn" icon="alert">
        <p>El plan de gestión de los riesgos no tiene la estructura de desglose de los riesgos (sección «Categorías de riesgo»). Mientras tanto, los riesgos se agrupan por la <strong>categoría del registro</strong>.</p>
      </${Note}>` : unmatched ? html`<${Note}>
        <p>${plural(unmatched, 'riesgo no tiene', 'riesgos no tienen')} una subcategoría del plan: se ubican por su categoría en «Sin subcategoría». Asígnala en la columna «Subcategoría (nivel 2)» del registro de riesgos, escrita igual que en el plan.</p>
      </${Note}>` : null}
      <${Stats} items=${[
        { label: 'Riesgos mostrados', value: PM.fmt.num(shown.length), sub: shown.length === risks.length ? 'Todos los del registro' : 'De ' + plural(risks.length, 'riesgo', 'riesgos') + ' en el registro' },
        { label: 'Amenazas', value: PM.fmt.num(shown.length - opps) },
        { label: 'Oportunidades', value: PM.fmt.num(opps) },
        { label: 'Nivel alto o muy alto', value: PM.fmt.num(high), sub: 'Puntuación P×I de 10 o más', tone: high ? 'warn' : undefined },
        { label: 'Sin evaluar', value: PM.fmt.num(unevaluated), sub: 'Sin probabilidad o impacto' },
      ]} />
      <div class="brk-levels" aria-label="Convenciones de nivel de riesgo">
        <span>Nivel (P×I):</span>
        ${LEVELS.map((l) => html`<${ui.Chip} key=${l.label} tone=${l.tone}>${l.label} ${l.range}</${ui.Chip}>`)}
        <${ui.Chip} tone="outline">Sin evaluar</${ui.Chip}>
        <span>La franja de cada riesgo dice su nivel; la de cada grupo, el nivel más alto de sus riesgos («Máx.»). Las oportunidades llevan la insignia «Oportunidad».</span>
      </div>
      ${!shown.length ? html`<${Note}><p>Ningún riesgo cumple los filtros: el diagrama muestra solo las categorías del plan.</p></${Note}>` : null}
      <${TreeDiagram} root=${root} metric="count" countUnit=${['riesgo', 'riesgos']} scoreLabel="P×I" orientation="v" title="Estructura de desglose de los riesgos"
        caption=${captionOf(project, 'Estructura de desglose de los riesgos', type === 'ambos' ? null : type === 'amenazas' ? 'Amenazas' : 'Oportunidades')}
        fileName=${fileBase(project, 'desglose-riesgos')} prefKey="estructuras.rbr.diagram" resetKey=${[st.hideClosed, type].join('|')}
        onActivate=${() => openDoc('registro-riesgos')} activateHint="abrir el registro de riesgos" />
    </div>`;
  }

  /* ---------------------------------------------------------------- Recursos (9.2) */
  const EDR_CATS = ['Personal', 'Equipos', 'Materiales', 'Transporte', 'Servicios'];
  const EDR_SOURCE = { 'Interno': 'Interno', 'Contratado': 'Contratado', 'Alquilado': 'Subarriendo', 'Compra': 'Contratado', 'Suministro del cliente': 'Suministro del cliente' };
  /* Filas de la tabla «recursos» del documento EDR desde el catálogo: tipo (1) → subtipo (1.1) → recurso (1.1.1), o
     tipo → recurso (1.2) si el recurso no tiene subtipo. Los recursos virtuales (sin clasificar) no se incluyen. */
  function edrRowsFrom(resources, schedule) {
    const cat = PM.res.catalog(resources, schedule);
    const items = cat.items.filter((it) => !it.virtual);
    const reasons = new Map(PM.RES.REASONS.map((r) => [r.value, r.label]));
    const groups = new Map();
    for (const it of items) { const ty = cat.typeOf(it); const g = groups.get(ty.id) || { ty, list: [] }; g.list.push(it); groups.set(ty.id, g); }
    const ordered = [...cat.types, PM.RES.UNCLASSIFIED].map((t) => groups.get(t.id)).filter(Boolean);
    const rows = []; let nTypes = 0, nSubs = 0;
    const desc = (it) => [txt(it.notes), txt(it.supplier) ? 'Proveedor: ' + txt(it.supplier) : '', txt(it.contract) ? 'Contrato: ' + txt(it.contract) : '', it.planned === false ? 'No planificado' + (reasons.get(it.reason) ? ' (' + reasons.get(it.reason) + ')' : '') : '', txt(it.code) ? 'Catálogo: ' + txt(it.code) : ''].filter(Boolean).join(' · ');
    const itemRow = (codigo, ty, it) => ({ id: PM.uid('r'), codigo, categoria: EDR_CATS.includes(ty.edr) && !ty.virtual ? ty.edr : '', recurso: it.name, descripcion: desc(it), unidad: txt(it.unit), costoUnitario: PM.isNum(it.unitCost) ? Number(it.unitCost) : null, fuente: EDR_SOURCE[it.origin] || '' });
    ordered.forEach((g, gi) => {
      nTypes++;
      const tc = String(gi + 1);
      const cat1 = EDR_CATS.includes(g.ty.edr) && !g.ty.virtual ? g.ty.edr : '';
      rows.push({ id: PM.uid('r'), codigo: tc, categoria: cat1, recurso: g.ty.name, descripcion: g.ty.kind === 'consumible' ? 'Consumibles: se asignan por cantidad.' : 'Recursos de trabajo: se asignan en unidades por día.', unidad: '', costoUnitario: null, fuente: '' });
      /* hijos en el orden del catálogo: subtipos (al aparecer por primera vez) y recursos sin subtipo */
      const kids = []; const subs = new Map();
      for (const it of g.list) {
        const s = txt(it.subtype);
        if (!s) { kids.push({ it }); continue; }
        let e = subs.get(keyOf(s)); if (!e) { e = { sub: s, list: [] }; subs.set(keyOf(s), e); kids.push(e); }
        e.list.push(it);
      }
      kids.forEach((k, ki) => {
        const code = tc + '.' + (ki + 1);
        if (k.it) { rows.push(itemRow(code, g.ty, k.it)); return; }
        nSubs++;
        rows.push({ id: PM.uid('r'), codigo: code, categoria: cat1, recurso: k.sub, descripcion: 'Subtipo de ' + g.ty.name + '.', unidad: '', costoUnitario: null, fuente: '' });
        k.list.forEach((it, ii) => rows.push(itemRow(code + '.' + (ii + 1), g.ty, it)));
      });
    });
    return { rows, types: nTypes, subtypes: nSubs, items: items.length, virtual: cat.items.length - items.length };
  }
  /* poda la EDR de recursos (filtros) y recalcula los totales y porcentajes del árbol mostrado */
  function filterRbs(root, keep) {
    const walk = (n) => {
      if (n.kind === 'leaf') return keep(n) ? { ...n, children: [] } : null;
      const ch = arr(n.children).map(walk).filter(Boolean);
      if (!ch.length && n.kind !== 'root') return null;
      return { ...n, children: ch, value: ch.reduce((s, c) => s + num(c.value), 0) };
    };
    const r = walk(root) || { ...root, children: [], value: 0 };
    const total = num(r.value);
    const setPct = (n) => { n.pct = total > 0 ? num(n.value) / total : null; n.children.forEach(setPct); };
    setPct(r);
    return r;
  }
  function ResourceTab({ model, canWrite }) {
    const { resources, schedule, sched, project, currency, pid } = model;
    const [st, set] = usePrefState('estructuras.rbs', { unplanned: false, assigned: false });
    const full = useMemo(() => PM.res.rbsTree({ data: resources, schedule, sched }), [resources, schedule, sched]);
    const root = useMemo(() => (st.unplanned || st.assigned ? filterRbs(full, (n) => (!st.unplanned || n.planned === false) && (!st.assigned || num(n.tasks) > 0)) : full), [full, st.unplanned, st.assigned]);
    const [edrRows, saveEdrRows, edrMeta] = PM.useDocTable('estructura-desglose-recursos', 'recursos');
    const edrDoc = PM.useDoc(pid ? PM.paths.doc(pid, 'estructura-desglose-recursos') : null);
    const leaves = useMemo(() => leavesOf(full).filter((n) => n.kind === 'leaf'), [full]);
    const virtual = leaves.filter((n) => String(n.id).startsWith('r:v:')).length;
    const unplanned = leaves.filter((n) => n.planned === false);
    const unassigned = leaves.filter((n) => !num(n.tasks)).length;
    const unplannedCost = unplanned.reduce((s, n) => s + num(n.value), 0);
    if (!leaves.length) {
      return html`<div class="brk-panel"><${ui.Empty} icon="resources" title="Aún no hay recursos en el proyecto" actions=${html`<${ui.Button} variant="primary" icon="resources" onClick=${() => PM.navigate('recursos')}>Ir al catálogo de recursos</${ui.Button}>`}>
        La estructura de desglose de recursos agrupa los recursos del catálogo por tipo (personal, maquinaria y equipo, materiales, transporte, servicios…) y subtipo, con la cantidad y el costo asignados en el cronograma.
      </${ui.Empty}></div>`;
    }
    const doc = edrMeta.doc;
    const status = (doc && doc.status) || 'borrador';
    const locked = !!doc && !['borrador', 'revision'].includes(status);
    const updateEdr = async () => {
      const gen = edrRowsFrom(resources, schedule);
      if (!gen.rows.length) { PM.toast('El catálogo no tiene recursos clasificados: agrégalos o clasifícalos en Recursos › Catálogo.', { tone: 'crit' }); return; }
      const cur = edrMeta.doc; const curStatus = (cur && cur.status) || 'borrador';
      const isLocked = !!cur && !['borrador', 'revision'].includes(curStatus);
      const rev = cur && cur.rev ? String(cur.rev) : null; const next = PM.calc.nextDraftRev(rev);
      const ok = await PM.confirm({
        title: 'Actualizar el documento EDR',
        body: html`<div class="stack-sm">
          <p>La tabla «Recursos» del documento <strong>Estructura de desglose de recursos (EDR)</strong> se reemplazará por ${plural(gen.rows.length, 'fila generada', 'filas generadas')} desde el catálogo: ${plural(gen.types, 'tipo', 'tipos')}${gen.subtypes ? ', ' + plural(gen.subtypes, 'subtipo', 'subtipos') : ''} y ${plural(gen.items, 'recurso', 'recursos')}, con códigos jerárquicos (1, 1.1, 1.1.1…).</p>
          ${isLocked ? html`<p>El documento está ${curStatus === 'aprobado' ? 'aprobado' : 'marcado como obsoleto'}${rev ? ' (revisión ' + rev + ')' : ''}: se abrirá la revisión ${next} como borrador con la tabla nueva. La revisión emitida queda en el historial.</p>`
            : edrRows.length ? html`<p>Las ${plural(edrRows.length, 'fila actual se perderá', 'filas actuales se perderán')}; las revisiones ya emitidas conservan su contenido.</p>` : null}
          ${gen.virtual ? html`<p class="small muted">${plural(gen.virtual, 'recurso sin clasificar no se incluye', 'recursos sin clasificar no se incluyen')}: clasifícalos primero en el catálogo.</p>` : null}
          <p class="small muted">Los filtros del diagrama no se aplican: se incluye todo el catálogo.</p>
        </div>`,
        confirmText: 'Actualizar el documento',
      });
      if (!ok) return;
      try {
        if (isLocked) {
          const base = PM.clone(cur);
          base.status = 'borrador'; base.rev = next;
          base.titleBlock = { codigo: '', elaboro: '', reviso: '', aprobo: '', ...(base.titleBlock || {}), fechaAprobacion: null };
          base.fields = { ...(base.fields || {}), recursos: gen.rows };
          base.updatedAt = PM.nowIso(); base.updatedBy = PM.getState().meId || null;
          PM.touchProject(pid);
          await edrDoc.saveNow(base);
        } else await saveEdrRows(gen.rows);
        PM.toast('Documento EDR actualizado con ' + plural(gen.rows.length, 'fila', 'filas') + (isLocked ? ' (revisión ' + next + ', borrador).' : '.'));
      } catch (e) {
        PM.toast('No se pudo actualizar el documento EDR. Revisa la conexión e intenta de nuevo.', { tone: 'crit' });
      }
    };
    const filterNote = st.unplanned || st.assigned;
    return html`<div class="brk-panel" data-brk="recursos">
      <section class="card brk-controls" aria-label="Filtros de la estructura de desglose de recursos">
        <${Ctl}><${ui.Check} label="Solo no planificados" checked=${!!st.unplanned} onValue=${(v) => set({ unplanned: !!v })} /></${Ctl}>
        <${Ctl}><${ui.Check} label="Ocultar sin asignar" checked=${!!st.assigned} onValue=${(v) => set({ assigned: !!v })} /></${Ctl}>
        <div class="brk-ctl-actions">
          <${ui.Button} size="sm" icon="resources" onClick=${() => PM.navigate('recursos')}>Ir al catálogo de recursos</${ui.Button}>
          <${ui.Button} size="sm" icon="file" onClick=${() => openDoc('estructura-desglose-recursos')}>Abrir el documento EDR</${ui.Button}>
          ${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="refresh" onClick=${updateEdr} disabled=${edrMeta.loading} data-brk-edr
            title=${locked ? 'El documento está ' + (status === 'aprobado' ? 'aprobado' : 'obsoleto') + ': la actualización abre una revisión nueva como borrador' : 'Reemplaza la tabla de recursos del documento EDR con el catálogo'}>Actualizar el documento EDR</${ui.Button}>` : null}
        </div>
      </section>
      ${virtual ? html`<${Note} tone="warn" icon="alert" actions=${html`<${ui.Button} size="sm" icon="resources" onClick=${() => PM.navigate('recursos')}>Clasificar en el catálogo</${ui.Button}>`}>
        <p>${plural(virtual, 'recurso solo existe', 'recursos solo existen')} como nombre en las asignaciones del cronograma y ${virtual === 1 ? 'aparece' : 'aparecen'} como «Sin clasificar». Clasifícalos en el catálogo para ubicarlos en su tipo y costearlos.</p>
      </${Note}>` : null}
      <${Stats} items=${[
        { label: 'Costo de lo asignado', value: PM.fmt.moneyShort(full.value, currency), title: PM.fmt.money(full.value, currency), sub: 'Cantidad asignada × costo unitario' },
        { label: 'Recursos', value: PM.fmt.num(leaves.length), sub: virtual ? plural(virtual, 'sin clasificar', 'sin clasificar') : 'Todos clasificados' },
        { label: 'No planificados', value: PM.fmt.num(unplanned.length), sub: unplanned.length ? PM.fmt.moneyShort(unplannedCost, currency) + ' asignados' : 'Ninguno', tone: unplanned.length ? 'warn' : undefined, title: PM.fmt.money(unplannedCost, currency) },
        { label: 'Sin asignar', value: PM.fmt.num(unassigned), sub: 'Sin actividades en el cronograma' },
      ]} />
      ${filterNote ? html`<${Note}><p>Con filtros, los totales y porcentajes del diagrama se calculan sobre los recursos mostrados${leavesOf(root).filter((n) => n.kind === 'leaf').length ? '' : ': ningún recurso cumple los filtros'}.</p></${Note}>` : null}
      <${TreeDiagram} root=${root} metric="money" currency=${currency} orientation="v" title="Estructura de desglose de recursos"
        caption=${captionOf(project, 'Estructura de desglose de recursos', [st.unplanned ? 'Solo no planificados' : '', st.assigned ? 'Sin los no asignados' : ''].filter(Boolean).join(', '))}
        fileName=${fileBase(project, 'desglose-recursos')} prefKey="estructuras.rbs.diagram" resetKey=${[st.unplanned, st.assigned].join('|')} />
    </div>`;
  }

  /* ---------------------------------------------------------------- vista */
  const TABS = [
    { id: 'costos', label: 'Costos', icon: 'money' },
    { id: 'riesgos', label: 'Riesgos', icon: 'risk' },
    { id: 'recursos', label: 'Recursos', icon: 'resources' },
  ];
  const TAB_IDS = TABS.map((t) => t.id);
  function BreakdownView({ params }) {
    const model = PM.useResourceModel();
    const canWrite = PM.useCanWrite();
    const [tab, setTabRaw] = useState(() => { const p = params && params.tab; const v = TAB_IDS.includes(p) ? p : PM.prefs.get('estructuras.tab', 'costos'); return TAB_IDS.includes(v) ? v : 'costos'; });
    useEffect(() => { if (params && TAB_IDS.includes(params.tab)) setTabRaw(params.tab); }, [params && params.tab]);
    const setTab = (t) => { setTabRaw(t); PM.prefs.set('estructuras.tab', t); };
    const header = html`<${ui.PageHeader} eyebrow="7.3 Determinar el presupuesto · 9.2 Estimar los recursos de las actividades · 11.2 Identificar los riesgos" title="Estructuras de desglose"
      description="Diagramas jerárquicos de los componentes del presupuesto, de los riesgos y de los recursos del proyecto. El desglose del alcance está en la EDT."
      actions=${html`<${ui.Button} icon="wbs" onClick=${() => PM.navigate('edt')}>Ver la EDT (desglose del alcance)</${ui.Button}>`} />`;
    return html`<div class="page brk-page">
      ${header}
      <${ui.Tabs} value=${tab} onChange=${setTab} tabs=${TABS} />
      ${model.loading ? html`<${ui.Loading} rows=${6} />`
        : tab === 'riesgos' ? html`<${RiskTab} model=${model} />`
        : tab === 'recursos' ? html`<${ResourceTab} model=${model} canWrite=${canWrite} />`
        : html`<${CostTab} model=${model} />`}
    </div>`;
  }

  PM.registerView({ id: 'estructuras', label: 'Estructuras de desglose', group: 'planificacion', order: 15, icon: 'breakdown', component: BreakdownView, needsProject: true, description: 'Estructuras de desglose de costos, de los riesgos y de los recursos en diagrama (7.3, 11.2, 9.2)' });
})();

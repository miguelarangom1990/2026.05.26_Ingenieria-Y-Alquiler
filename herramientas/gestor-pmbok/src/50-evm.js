/* ==========================================================================
   50-evm.js — vista "valor-ganado" (7.3 Determinar el presupuesto · 7.4
   Controlar los costos): curva S con PV, EV y AC, BAC y proyección al EAC;
   indicadores del valor ganado y del cronograma ganado; registro de costos
   reales; cortes de avance; agregación del presupuesto (cuentas de control,
   reservas, línea base de costos) y requisitos de financiamiento; desempeño
   por actividad. Los cálculos de base vienen de PM.calc.evm (05-calc.js).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } = PM.lib;
  const ui = PM.ui;
  const D = PM.date;
  const fmt = PM.fmt;
  const num = PM.num;
  const cx = PM.cx;

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.evm-topbar { gap: 10px 18px; padding: 8px 12px; }
.evm-sd { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
@media (max-width: 680px) { .evm-topbar .toolbar-sep { display: none; } }
.evm-sd .input { width: 158px; min-height: 30px; padding: 4px 8px; }
.evm-sd-hint { font-size: var(--fs-xs); color: var(--fg-3); }
.evm-source { display: flex; align-items: center; gap: 6px 10px; flex-wrap: wrap; min-width: 0; flex: 1 1 280px; }
.evm-source .chip { white-space: normal; line-height: 1.35; padding-top: 3px; padding-bottom: 3px; }
.evm-chart { min-height: 240px; border-radius: var(--r-sm); }
.evm-chart:focus-visible { box-shadow: var(--focus); }
.evm-hit { cursor: crosshair; }
.evm-tip { display: flex; flex-direction: column; gap: 4px; min-width: 210px; }
.evm-tip-date { font-weight: 600; color: var(--fg); margin-bottom: 2px; }
.evm-tip-row { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: center; gap: 8px; }
.evm-tip-row strong { font-family: var(--font-mono); font-weight: 600; color: var(--fg); text-align: right; white-space: nowrap; }
.evm-tip-lbl { color: var(--fg-2); }
.evm-tip-sep { height: 1px; background: var(--line); margin: 2px 0; }
.evm-tip-foot { color: var(--fg-3); }
.evm-legend-v { font-family: var(--font-mono); color: var(--fg); }
.evm-key-dash { width: 16px; height: 2px; display: inline-block; background: repeating-linear-gradient(90deg, var(--s2) 0 4px, transparent 4px 7px); }
.evm-key-cut { width: 2px; height: 12px; display: inline-block; border-radius: 1px; background: var(--signal); }
.evm-swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: none; }
.evm-notes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.evm-note { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; font-size: var(--fs-sm); line-height: 1.5; color: var(--fg); }
.evm-note > .icon { margin-top: 2px; color: var(--fg-3); }
.evm-note[data-tone="good"] > .icon { color: var(--good); }
.evm-note[data-tone="warn"] > .icon { color: var(--warn); }
.evm-note[data-tone="crit"] > .icon { color: var(--crit); }
.evm-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.evm-groups > * { min-width: 0; }
.evm-groups > .span-all { grid-column: 1 / -1; }
@media (max-width: 1000px) { .evm-groups { grid-template-columns: minmax(0, 1fr); } }
.evm-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); overflow: hidden; border-radius: 0 0 var(--r-lg) var(--r-lg); }
.evm-tiles.is-flat { border-radius: var(--r-lg); }
.evm-metric { display: flex; flex-direction: column; gap: 3px; padding: 12px 16px 14px; min-width: 0; box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.evm-metric-label { font-size: var(--fs-xs); color: var(--fg-2); font-weight: 500; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; line-height: 1.4; min-height: calc(19px + 2.8em); }
.evm-tiles.is-flat .evm-metric-label, .evm-tiles.is-plain .evm-metric-label { min-height: 0; }
@media (max-width: 680px) { .evm-metric-label { min-height: 0; } }
.evm-abbr { font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; color: var(--fg-2); background: var(--surface-3); border-radius: var(--r-sm); padding: 0 5px; line-height: 1.6; white-space: nowrap; }
.evm-metric-value { font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; line-height: 1.15; font-stretch: 105%; overflow-wrap: anywhere; color: var(--fg); }
.evm-metric[data-tone="good"] .evm-metric-value { color: var(--good); }
.evm-metric[data-tone="warn"] .evm-metric-value { color: var(--warn); }
.evm-metric[data-tone="crit"] .evm-metric-value { color: var(--crit); }
.evm-metric-value.is-empty { color: var(--fg-3); }
.evm-metric-full { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg-2); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.evm-formula { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--fg-3); line-height: 1.45; margin-top: 2px; }
.evm-metric-note { font-size: var(--fs-xs); color: var(--fg-2); line-height: 1.4; }
.evm-gauge { position: relative; height: 34px; margin-top: 6px; }
.evm-gauge-track { position: absolute; left: 0; right: 0; top: 6px; height: 8px; display: flex; gap: 2px; }
.evm-gauge-zone { height: 100%; opacity: 0.35; }
.evm-gauge-zone:first-child { border-radius: 4px 0 0 4px; }
.evm-gauge-zone:last-child { border-radius: 0 4px 4px 0; }
.evm-gauge-one { position: absolute; top: 2px; width: 1px; height: 16px; background: var(--fg-3); }
.evm-gauge-mark { position: absolute; top: 1px; width: 4px; height: 18px; margin-left: -2px; border-radius: 2px; background: var(--fg); box-shadow: 0 0 0 2px var(--surface); }
.evm-gauge-scale { position: absolute; left: 0; right: 0; top: 22px; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.625rem; color: var(--fg-3); }
.evm-meter { height: 8px; border-radius: 4px; background: var(--surface-3); overflow: hidden; margin-top: 6px; }
.evm-meter > span { display: block; height: 100%; border-radius: 4px; }
.evm-bar-cell { display: flex; align-items: center; gap: 8px; min-width: 150px; }
.evm-bar-track { flex: 1; min-width: 60px; height: 10px; }
.evm-bar { height: 100%; border-radius: 0 3px 3px 0; min-width: 2px; }
.evm-cats { display: flex; flex-direction: column; gap: 10px; }
.evm-cat { display: grid; grid-template-columns: minmax(96px, 150px) minmax(60px, 1fr) auto; gap: 4px 10px; align-items: center; font-size: var(--fs-sm); }
.evm-cat-v { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg); text-align: right; white-space: nowrap; }
.evm-cat-v span { color: var(--fg-3); margin-left: 6px; }
@media (max-width: 560px) { .evm-cat { grid-template-columns: minmax(0, 1fr) auto; } .evm-cat .evm-bar-track { grid-column: 1 / -1; grid-row: 2; } }
.evm-actuals td { vertical-align: middle; }
.evm-flag { display: block; font-size: 0.6875rem; padding: 0 6px; line-height: 1.3; white-space: nowrap; }
.evm-flag.is-warn { color: var(--warn); }
.evm-flag.is-info { color: var(--fg-3); }
.evm-ledger td { vertical-align: middle; }
.evm-op { width: 30px; text-align: center; font-family: var(--font-mono); font-weight: 600; color: var(--fg-3); }
.evm-ledger tr.is-total td { font-weight: 650; background: var(--surface-2); }
.evm-sub { display: block; font-size: var(--fs-xs); color: var(--fg-3); font-weight: 400; }
.evm-ledger .input { max-width: 200px; min-width: 110px; margin-left: auto; text-align: right; }
.evm-ledger-name { min-width: 220px; }
@media (max-width: 560px) { .evm-ledger .evm-pct { display: none; } .evm-ledger-name { min-width: 150px; } .evm-ledger .evm-op { width: 22px; padding-left: 4px; padding-right: 2px; } }
.evm-stack { position: relative; padding-top: 24px; }
.evm-stack-bar { display: flex; gap: 2px; height: 22px; }
.evm-stack-seg { height: 100%; min-width: 3px; }
.evm-stack-seg:first-child { border-radius: 4px 0 0 4px; }
.evm-stack-seg:last-child { border-radius: 0 4px 4px 0; }
.evm-stack-seg:only-child { border-radius: 4px; }
.evm-stack-seg:hover { opacity: 0.82; }
.evm-stack-mark { position: absolute; top: 18px; height: 34px; width: 2px; margin-left: -1px; background: var(--fg); border-radius: 1px; box-shadow: 0 0 0 1px var(--surface); }
.evm-stack-mlabel { position: absolute; top: 0; font-size: 0.6875rem; color: var(--fg); font-weight: 600; white-space: nowrap; }
.evm-sort { border: 0; background: none; padding: 0; font: inherit; color: inherit; cursor: pointer; display: inline-flex; gap: 4px; align-items: center; letter-spacing: inherit; }
.evm-sort:hover { color: var(--fg); }
.evm-table tfoot td { font-weight: 650; background: var(--surface-2); border-top: 1px solid var(--line-strong); }
.evm-table td.num, .evm-table th.num { white-space: nowrap; }
.evm-name { min-width: 220px; }
.evm-act-table .evm-name { min-width: 190px; }
@media (max-width: 560px) { .evm-name, .evm-act-table .evm-name { min-width: 150px; } }
.evm-act-table th { padding-left: 8px; padding-right: 8px; }
.evm-name-sub { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 2px; }
.evm-row-after td { color: var(--fg-3); }
.evm-form { display: grid; grid-template-columns: 170px minmax(0, 1fr) auto; gap: 10px 12px; align-items: end; }
@media (max-width: 680px) { .evm-form { grid-template-columns: minmax(0, 1fr); } }
.evm-explain { font-size: var(--fs-sm); color: var(--fg-2); max-width: 82ch; }
.evm-defer { display: block; min-width: 0; }
.evm-pct-input { width: 92px; }
.evm-pct-input .input { text-align: right; min-height: 28px; padding: 3px 8px; }
.evm-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.evm-filters .select { width: auto; min-width: 150px; flex: 0 1 200px; }
.evm-filters .search { min-width: 180px; flex: 1 1 260px; max-width: 380px; }
.evm-tabpanel { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.evm-diff { font-family: var(--font-mono); font-size: var(--fs-xs); white-space: nowrap; }
.evm-chip-row { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; }
.evm-chip-row .chip { white-space: normal; line-height: 1.35; padding-top: 2px; padding-bottom: 2px; }
.evm-colhit { cursor: default; }
.evm-hint { display: flex; gap: 6px 10px; align-items: center; flex-wrap: wrap; font-size: var(--fs-xs); color: var(--fg-2); }
.evm-hint > .icon { color: var(--fg-3); }
.evm-cell-btn { display: flex; align-items: center; text-align: left; cursor: pointer; padding-right: 18px; max-width: 220px; }
.evm-cell-btn, .evm-cell-btn:hover { background-image: linear-gradient(45deg, transparent 50%, var(--fg-3) 50%), linear-gradient(135deg, var(--fg-3) 50%, transparent 50%); background-position: calc(100% - 10px) 52%, calc(100% - 6px) 52%; background-size: 4px 4px; background-repeat: no-repeat; }
.evm-capacity { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--warn-wash); color: var(--fg); font-size: var(--fs-sm); line-height: 1.5; }
.evm-capacity > .icon { margin-top: 2px; color: var(--warn); }
.evm-capacity[data-tone="crit"] { background: var(--crit-wash); }
.evm-capacity[data-tone="crit"] > .icon { color: var(--crit); }
`;
  if (!document.getElementById('css-evm')) {
    const st = document.createElement('style');
    st.id = 'css-evm';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- constantes y utilidades */
  const CATEGORIES = ['Mano de obra', 'Equipos', 'Materiales', 'Transporte', 'Subcontratos', 'Otros'];
  const TABS = [
    { id: 'curva', label: 'Curva S', icon: 'scurve' },
    { id: 'indicadores', label: 'Indicadores', icon: 'target' },
    { id: 'reales', label: 'Costos reales', icon: 'money' },
    { id: 'avance', label: 'Avance', icon: 'check-circle' },
    { id: 'presupuesto', label: 'Presupuesto', icon: 'layers' },
    { id: 'actividad', label: 'Por actividad', icon: 'table' },
  ];
  const SERIES = [
    { key: 'pv', abbr: 'PV', label: 'Valor planificado', color: 'var(--s1)' },
    { key: 'ev', abbr: 'EV', label: 'Valor ganado', color: 'var(--s3)' },
    { key: 'ac', abbr: 'AC', label: 'Costo real', color: 'var(--s2)' },
  ];
  const EMPTY_ARR = Object.freeze([]);
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const go = (view, params) => PM.navigate(view, params || {});
  const money = (v, cur) => fmt.money(v, cur);
  const short = (v, cur) => fmt.moneyShort(v, cur);
  const zeroish = (v, cur) => Math.abs(v) < ((PM.CURRENCIES[cur] || PM.CURRENCIES.COP).decimals ? 0.005 : 0.5);
  const signedMoney = (v, cur) => (!isNum(v) ? '—' : zeroish(v, cur) ? money(0, cur) : (v > 0 ? '+' : '') + money(v, cur));
  const signedShort = (v, cur) => (!isNum(v) ? '—' : zeroish(v, cur) ? short(0, cur) : (v > 0 ? '+' : '') + short(v, cur));
  const idxTone = (v) => PM.calc.indexTone(v);
  const worstTone = (...tones) => (tones.includes('crit') ? 'crit' : tones.includes('warn') ? 'warn' : tones.includes('good') ? 'good' : null);
  const cmpDate = (a, b) => { const va = D.valid(a), vb = D.valid(b); if (va && vb) return a < b ? -1 : a > b ? 1 : 0; return va ? -1 : vb ? 1 : 0; };
  const monthsBetween = (a, b) => { const out = []; if (!D.valid(a) || !D.valid(b) || b < a) return out; let m = D.startOfMonth(a); let g = 0; while (m <= b && g++ < 600) { out.push(m); m = D.addMonths(m, 1); } return out; };
  const wdText = (n) => fmt.num(Math.abs(n), 0) + (Math.abs(n) === 1 ? ' día hábil' : ' días hábiles');
  const blLabel = (b) => (b ? b.label || 'LB' + num(b.number) : '');
  const taskCode = (t, tree) => (t && t.wbsId && tree.codes.get(t.wbsId)) || '';
  const taskLabel = (t, tree) => { const c = taskCode(t, tree); return (c ? c + ' · ' : '') + (t.name || 'Actividad sin nombre'); };
  const fileBase = (project) => PM.slug((project && (project.code || project.name)) || 'proyecto') || 'proyecto';
  const wdDiff = (cal, a, b) => (b > a ? cal.countWork(D.add(a, 1), b) : b < a ? -cal.countWork(D.add(b, 1), a) : 0);
  const toneColor = (t) => (t === 'good' ? 'var(--good)' : t === 'warn' ? 'var(--warn)' : t === 'crit' ? 'var(--crit)' : '');

  /* ---------------------------------------------------------------- tamaño del registro de costos
     tools/costs es un solo documento (máximo 256 KiB) con los costos reales, los cortes de avance y las reservas.
     Antes, cada corte guardaba el % de TODAS las actividades (con 300 actividades, unos 5 KiB por corte): unos 30 cortes
     semanales y 500 costos reales llenaban el documento y desde ahí ninguna escritura se guardaba.
     Ahora cada corte guarda solo las actividades cuyo % cambió respecto al corte anterior. PM.calc.evm ya acumula los cortes
     en orden de fecha ({...anteriores, ...corte}; una actividad sin valor cuenta 0 %), así que el valor ganado de cada corte
     no cambia. Toda escritura de costos de esta vista compacta los cortes (también los antiguos, guardados completos) y se
     revisa contra el límite antes de enviarse: si no cabe, no se aplica y se avisa (en vez de mostrar datos sin guardar). */
  const DOC_MAX = 255 * 1024;   /* margen de 1 KiB bajo el límite de la plataforma */
  const DOC_WARN = 200 * 1024;
  const isPlainObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const pctVal = (v) => PM.clamp(num(v), 0, 100);
  const utf8 = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const docBytes = (v) => { const s = JSON.stringify(v) || ''; return utf8 ? utf8.encode(s).length : s.length * 2; };
  const kib = (bytes) => fmt.num(Math.ceil(bytes / 1024), 0) + ' KiB';
  /* Estado completo de cada corte con fecha válida, en orden de fecha (igual que lo acumula PM.calc.evm). */
  function cutStates(list) {
    const valid = [];
    (Array.isArray(list) ? list : []).forEach((u, i) => { if (isPlainObj(u) && D.valid(u.date)) valid.push({ u, i }); });
    valid.sort((a, b) => cmpDate(a.u.date, b.u.date) || a.i - b.i);
    let carry = {};
    return valid.map(({ u }) => {
      carry = { ...carry };
      if (isPlainObj(u.progress)) for (const k of Object.keys(u.progress)) carry[k] = pctVal(u.progress[k]);
      return { u, full: carry };
    });
  }
  /* Cambios de un estado respecto al anterior (una actividad ausente vale 0 %). */
  function cutDelta(prev, full) {
    const d = {};
    for (const k of Object.keys(full)) if (full[k] !== (k in prev ? prev[k] : 0)) d[k] = full[k];
    for (const k of Object.keys(prev)) if (!(k in full) && prev[k] !== 0) d[k] = 0;
    return d;
  }
  const sameMap = (a, b) => { if (!isPlainObj(a)) return false; const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every((k) => k in b && a[k] === b[k]); };
  /* Cortes sin fecha válida: PM.calc.evm los ignora; se conservan tal cual, al final de la lista. */
  const undatedCuts = (list) => (Array.isArray(list) ? list.filter((u) => !(isPlainObj(u) && D.valid(u.date))) : []);
  /* Lista de cortes guardable: por fecha, cada uno con solo sus cambios respecto al anterior. */
  function encodeCuts(states, extra) {
    let prev = {};
    const out = states.map(({ u, full }) => { const progress = cutDelta(prev, full); prev = full; return sameMap(u.progress, progress) ? u : { ...u, progress }; });
    return extra && extra.length ? out.concat(extra) : out;
  }
  const compactMemo = new WeakMap();
  function compactCuts(list) {
    if (!Array.isArray(list) || !list.length) return list;
    let v = compactMemo.get(list);
    if (!v) {
      const out = encodeCuts(cutStates(list), undatedCuts(list));
      v = out.length === list.length && out.every((u, i) => u === list[i]) ? list : out;
      compactMemo.set(list, v);
    }
    return v;
  }
  const compactCosts = (c) => (c && Array.isArray(c.statusUpdates) && c.statusUpdates.length ? { ...c, statusUpdates: compactCuts(c.statusUpdates) } : c);
  let fullToastAt = 0;
  /* Guarda el registro de costos si cabe en el documento; devuelve false (y avisa) si no cabe. Una escritura que reduce un
     documento que ya excede el límite (p. ej. en modo local) se permite, para poder volver a dejarlo bajo el límite.
     edit: cambio de un campo (se confirma al pausar la escritura): el aviso no se repite en cada pausa. */
  function saveCostsChecked(save, next, current, edit) {
    const value = compactCosts(next);
    const bytes = docBytes(value);
    if (bytes > DOC_MAX && !(current && bytes < docBytes(current))) {
      if (!edit || Date.now() - fullToastAt > 4000) {
        fullToastAt = Date.now();
        PM.toast('No se guardó el cambio: el registro de costos del proyecto (costos reales, cortes de avance y reservas) llegaría a ' + kib(bytes) + ' y un registro admite como máximo 256 KiB. Exporta los costos reales a CSV y agrupa en un solo registro los costos de los meses cerrados, o elimina los que ya no necesites.', { tone: 'crit' });
      }
      return false;
    }
    save(value);
    return true;
  }
  /* Aviso cuando el registro de costos se acerca al límite (tamaño que tendrá al guardar, con los cortes compactos). */
  function CapacityNote({ costs }) {
    const bytes = useMemo(() => docBytes(compactCosts(costs)), [costs]);
    if (bytes < DOC_WARN) return null;
    const full = bytes > DOC_MAX;
    return html`<div class="evm-capacity" data-role="costs-capacity" data-tone=${full ? 'crit' : 'warn'} role="status">
      <${ui.Icon} name="alert" />
      <div class="stack-sm" style="gap:6px;min-width:0">
        <div><strong>${full ? 'El registro de costos está lleno' : 'El registro de costos se acerca a su límite'}</strong>${': ocupa ' + kib(bytes) + ' de 256 KiB (costos reales, cortes de avance y reservas del proyecto). '
          + (full ? 'Los cambios que lo aumenten no se guardarán. ' : 'Al llegar al límite no se podrán guardar más costos reales ni cortes de avance. ')
          + 'Exporta los costos reales a CSV y agrupa en un solo registro los costos de los meses cerrados, o elimina los que ya no necesites.'}</div>
        <div class="evm-meter" style="margin-top:0" aria-hidden="true"><span style=${'width:' + Math.min(100, (bytes / (256 * 1024)) * 100) + '%;background:' + (full ? 'var(--crit)' : 'var(--warn)')}></span></div>
      </div>
    </div>`;
  }

  function niceStep(max, count) {
    if (!(max > 0)) return 1;
    const raw = max / count; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function niceScale(max, count) {
    const step = niceStep(max, count);
    const top = Math.max(step, Math.ceil(max / step - 1e-9) * step);
    const ticks = []; for (let i = 0; i * step <= top + step * 1e-6; i++) ticks.push(i * step);
    return { top, ticks, step };
  }
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
  function useLatest(v) { const r = useRef(v); r.current = v; return r; }

  /* Escritura diferida: los campos de texto y de número de las tablas guardan al pausar la escritura o al salir del campo.
     Cada guardado recalcula el modelo completo (CPM y valor ganado); hacerlo en cada tecla vuelve lenta la escritura
     en proyectos con cientos de actividades. */
  const COMMIT_MS = 300;
  function useDeferred(commit) {
    const fn = useLatest(commit);
    const st = useRef({ timer: 0, has: false, v: undefined });
    const flush = useCallback(() => { const s = st.current; clearTimeout(s.timer); if (!s.has) return; s.has = false; fn.current(s.v); }, []);
    const push = useCallback((v) => { const s = st.current; s.v = v; s.has = true; clearTimeout(s.timer); s.timer = setTimeout(flush, COMMIT_MS); }, [flush]);
    useEffect(() => flush, [flush]);
    return { push, flush };
  }
  function DraftInput({ value, onCommit, ...rest }) {
    const [draft, setDraft] = useState(null);
    const d = useDeferred(onCommit);
    return html`<input ...${rest} value=${draft !== null ? draft : value ?? ''}
      onInput=${(e) => { const v = e.currentTarget.value; setDraft(v); d.push(v); }}
      onBlur=${() => { d.flush(); setDraft(null); }} />`;
  }
  /* NumberInput del núcleo con guardado diferido (se confirma al salir del campo: focusout del contenedor; en minúsculas
     porque esta versión de Preact registraría "FocusOut" como nombre de evento). */
  function DeferredNumber({ onCommit, ...rest }) {
    const d = useDeferred(onCommit);
    return html`<span class="evm-defer" onfocusout=${d.flush}><${ui.NumberInput} ...${rest} onValue=${d.push} /></span>`;
  }

  /* Cronograma ganado para mostrar. PM.calc.evm mide el tiempo real (AT) hasta la fecha de corte aunque el trabajo ya
     esté completo (EV = BAC); entonces el SPI(t) cae y la fecha "pronosticada" pasa a ser la fecha de corte. Con el trabajo
     completo, AT llega hasta la terminación (fin del cronograma vigente, sin pasar de la fecha de corte) y ES = PD. */
  function earnedSchedule(evm, sched) {
    const done = evm.bac > 0 && evm.ev >= evm.bac - 0.5;
    const base = { done, actual: false, esWd: evm.esWd, atWd: evm.atWd, spiT: evm.spiT, finish: evm.forecastFinish };
    if (!done || !D.valid(evm.planStart) || !isNum(evm.pdWd)) return base;
    const end = D.valid(sched.finish) ? D.min(sched.finish, evm.statusDate) : evm.statusDate;
    const at = Math.max(1, sched.cal.countWork(evm.planStart, end));
    return { done, actual: true, esWd: evm.pdWd, atWd: at, spiT: evm.pdWd > 0 ? evm.pdWd / at : null, finish: end };
  }

  /* Plan de medición por actividad (igual que PM.calc.evm): línea base de costos si existe; si no, el cronograma actual. */
  function planOf(evm, sched, baselines) {
    const bl = baselines.cost;
    if (evm.fromBaseline && bl && bl.cost) return bl.cost.tasks.map((b) => ({ id: b.id, name: b.name, start: b.start, finish: b.finish, milestone: !!b.milestone, cost: num(b.cost) }));
    return sched.tasks.map((t) => ({ id: t.id, name: t.name, start: t.startDate, finish: t.finishDate, milestone: t.milestone, cost: num(t.cost) }));
  }
  function usePlan(model) {
    const { evm, sched, baselines } = model;
    return useMemo(() => planOf(evm, sched, baselines), [evm.fromBaseline, sched, baselines]);
  }

  /* ---------------------------------------------------------------- piezas comunes */
  function SectionCard({ title, subtitle, actions, children, pad = true, cls, attrs }) {
    return html`<section class=${cx('card', cls)} ...${attrs || {}}>
      <div class="card-head"><div class="stack-sm" style="gap:2px;min-width:0"><h3 class="h3">${title}</h3>${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}</div>${actions ? html`<div class="row">${actions}</div>` : null}</div>
      ${pad ? html`<div class="card-body">${children}</div>` : children}
    </section>`;
  }
  function Metric({ id, label, abbr, display, full, tone, formula, note, empty, children }) {
    return html`<div class="evm-metric" data-metric=${id} data-tone=${tone || undefined}>
      <div class="evm-metric-label">${abbr ? html`<span class="evm-abbr">${abbr}</span>` : null}<span>${label}</span></div>
      <div class=${cx('evm-metric-value', empty && 'is-empty')}>${display}</div>
      ${full ? html`<div class="evm-metric-full">${full}</div>` : null}
      ${children}
      ${formula ? html`<div class="evm-formula">${formula}</div>` : null}
      ${note ? html`<div class="evm-metric-note">${note}</div>` : null}
    </div>`;
  }
  function IndexGauge({ value, label }) {
    const lo = 0.5, hi = 1.5;
    const pos = (v) => ((PM.clamp(v, lo, hi) - lo) / (hi - lo)) * 100;
    return html`<div class="evm-gauge" role="meter" aria-label=${label} aria-valuemin=${lo} aria-valuemax=${hi} aria-valuenow=${isNum(value) ? Math.round(value * 100) / 100 : undefined} aria-valuetext=${isNum(value) ? fmt.idx(value) : 'Sin dato'}>
      <div class="evm-gauge-track" aria-hidden="true">
        <span class="evm-gauge-zone" style=${'flex:' + (0.9 - lo) + ' 1 0;background:var(--crit)'}></span>
        <span class="evm-gauge-zone" style=${'flex:' + (0.98 - 0.9) + ' 1 0;background:var(--warn)'}></span>
        <span class="evm-gauge-zone" style=${'flex:' + (hi - 0.98) + ' 1 0;background:var(--good)'}></span>
      </div>
      <span class="evm-gauge-one" style=${'left:' + pos(1) + '%'} aria-hidden="true"></span>
      ${isNum(value) ? html`<span class="evm-gauge-mark" style=${'left:' + pos(value) + '%'} aria-hidden="true"></span>` : null}
      <div class="evm-gauge-scale" aria-hidden="true"><span>0,50</span><span>1,00</span><span>1,50</span></div>
    </div>`;
  }
  const IdxChip = ({ value }) => (isNum(value) ? html`<${ui.Chip} tone=${idxTone(value)}>${fmt.idx(value)}</${ui.Chip}>` : html`<span class="faint">—</span>`);
  const MoneyCell = ({ value, currency, signed, tone, compact }) => {
    const t = tone === undefined ? (signed && isNum(value) && !zeroish(value, currency) && value < 0 ? 'crit' : null) : tone;
    const full = signed ? signedMoney(value, currency) : money(value, currency);
    return html`<span style=${t ? 'color:' + toneColor(t) : ''} title=${compact ? full : undefined}>${compact ? (signed ? signedShort(value, currency) : short(value, currency)) : full}</span>`;
  };

  function NoPlan({ hasTasks, canWrite }) {
    return html`<${ui.Empty} icon="scurve" title=${hasTasks ? 'Las actividades aún no tienen presupuesto' : 'Aún no hay actividades con presupuesto'}
      actions=${html`<${ui.Button} variant="primary" icon="gantt" onClick=${() => go('cronograma')}>${hasTasks && canWrite ? 'Asignar costos en el cronograma' : 'Ir al cronograma'}</${ui.Button}><${ui.Button} icon="layers" onClick=${() => go('lineas-base')}>Ir a líneas base</${ui.Button}>`}>
      ${hasTasks
        ? 'La curva S, los indicadores y el presupuesto se calculan con el costo de cada actividad. Asigna el presupuesto de las actividades en el Cronograma y luego establece la línea base de costos para medir el desempeño contra ella.'
        : 'El valor ganado se mide sobre las actividades del cronograma y su presupuesto. Crea las actividades en el Cronograma, asígnales costo y establece la línea base de costos.'}
    </${ui.Empty}>`;
  }

  /* ---------------------------------------------------------------- barra superior */
  function StatusDateControl({ project }) {
    const canWrite = PM.useCanWrite();
    const saved = D.valid(project.statusDate) ? project.statusDate : '';
    const effective = PM.statusDateOf(project);
    const [draft, setDraft] = useState(effective);
    const timer = useRef();
    const pending = useRef(null);
    useEffect(() => { setDraft(effective); if (pending.current === saved) pending.current = null; }, [effective, saved]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const today = D.today();
    /* soft: guardado automático mientras se escribe; una fecha incompleta (p. ej. el año a medio escribir) no se descarta */
    const commit = (v, soft) => {
      clearTimeout(timer.current);
      const y = D.valid(v) ? +v.slice(0, 4) : 0;
      if (!D.valid(v) || y < 1990 || y > 2100) { if (!soft) setDraft(effective); return; }
      if (v === saved || v === pending.current) return;
      pending.current = v;
      PM.projectOps.update(project.id, { statusDate: v }).catch(() => { pending.current = null; setDraft(effective); });
    };
    return html`<div class="evm-sd">
      ${canWrite ? html`<label class="label-caps" for="evm-status-date">Fecha de corte</label>`: html`<span class="label-caps">Fecha de corte</span>`}
      ${canWrite ? html`
        <input id="evm-status-date" type="date" class="input" value=${draft}
          onInput=${(e) => { const v = e.currentTarget.value; setDraft(v); clearTimeout(timer.current); if (D.valid(v)) timer.current = setTimeout(() => commit(v, true), 600); }}
          onBlur=${(e) => commit(e.currentTarget.value)}
          onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }} />
        <${ui.Button} size="sm" onClick=${() => { setDraft(today); commit(today); }} disabled=${saved === today} title="Fija la fecha de corte en la fecha de hoy">Usar hoy</${ui.Button}>`
      : html`<span class="mono" id="evm-status-date">${fmt.date(effective)}</span>`}
      ${!saved ? html`<span class="evm-sd-hint">Sin fijar: se usa la fecha de hoy.</span>` : null}
    </div>`;
  }
  function SourceChip({ model, canWrite }) {
    const bl = model.baselines.cost;
    if (model.evm.fromBaseline && bl) {
      return html`<div class="evm-source" data-source="baseline"><${ui.Chip} tone="info" icon="layers">Medido contra la línea base de costos ${blLabel(bl)}</${ui.Chip}>${D.valid(bl.date) ? html`<span class="xsmall faint">Establecida el ${fmt.date(bl.date)}</span>` : null}</div>`;
    }
    return html`<div class="evm-source" data-source="schedule"><${ui.Chip} tone="warn" icon="alert">Sin línea base de costos: el valor planificado usa el cronograma actual</${ui.Chip}>
      <${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => go('lineas-base')}>${canWrite ? 'Establecer línea base' : 'Ver líneas base'}</${ui.Button}></div>`;
  }

  /* ---------------------------------------------------------------- 1. curva S */
  function curveGeometry(evm, currency, width, H) {
    const series = evm.series || [];
    if (series.length < 2 || !(evm.bac > 0)) return null;
    const at = evm.statusDate;
    const first = series[0].date, lastS = series[series.length - 1].date;
    const hasEac = isNum(evm.eac) && evm.eac > 0 && evm.ac > 0;
    const target = hasEac ? (D.valid(evm.forecastFinish) ? evm.forecastFinish : evm.planFinish) : null;
    /* la proyección no estira el eje más allá del doble del plan: si se pasa, se recorta y se indica */
    const cap = D.add(first, Math.max(14, D.diff(first, lastS)) * 2);
    const eacDate = D.valid(target) ? (target > cap ? cap : target) : null;
    const end = eacDate && eacDate > lastS ? eacDate : lastS;
    let maxV = evm.bac;
    for (const p of series) maxV = Math.max(maxV, p.pv || 0, p.ev || 0, p.ac || 0);
    const eacShown = hasEac ? Math.min(evm.eac, maxV * 2) : null;
    const sc = niceScale(Math.max(maxV, eacShown || 0) * 1.04, 5);
    const yl = sc.ticks.map((v) => short(v, currency));
    const rightVals = [short(evm.bac, currency)]; if (hasEac) rightVals.push(short(evm.eac, currency));
    const CW = 6.4;
    const M = { l: PM.clamp(Math.ceil(Math.max(...yl.map((s) => s.length)) * CW) + 14, 44, 120), r: PM.clamp(Math.ceil(Math.max(...rightVals.map((s) => s.length)) * CW) + 16, 54, 120), t: 30, b: 28 };
    const iw = Math.max(160, width - M.l - M.r), ih = H - M.t - M.b, W = M.l + iw + M.r;
    const t0 = D.toMs(first), tspan = Math.max(1, D.toMs(end) - t0);
    const x = (d) => M.l + ((D.toMs(d) - t0) / tspan) * iw;
    const y = (v) => M.t + ih - (v / sc.top) * ih;
    const pathOf = (key) => { let d = ''; for (const p of series) { if (!isNum(p[key])) continue; d += (d ? 'L' : 'M') + x(p.date).toFixed(1) + ' ' + y(p[key]).toFixed(1); } return d; };
    const lastOf = (key) => { for (let i = series.length - 1; i >= 0; i--) if (isNum(series[i][key])) return series[i]; return null; };
    /* marcas del eje x: inicio de cada mes; si el plan cruza menos de tres meses, inicio de cada semana (lunes) */
    let ms = []; let m = D.startOfMonth(first); if (m < first) m = D.addMonths(m, 1);
    let g = 0; while (m <= end && g++ < 400) { ms.push(m); m = D.addMonths(m, 1); }
    let style = 'month', slot = 66;
    if (ms.length < 3) {
      const wk = []; let w = D.startOfWeek(first); if (w < first) w = D.add(w, 7);
      g = 0; while (w <= end && g++ < 60) { wk.push(w); w = D.add(w, 7); }
      if (wk.length >= ms.length) { ms = wk; style = 'dm'; slot = 52; }
    }
    const every = Math.max(1, Math.ceil(ms.length / Math.max(1, Math.floor(iw / slot))));
    const months = ms.map((mm, i) => {
      const xx = x(mm); const label = fmt.date(mm, style); const half = label.length * 3.2;
      /* el margen derecho queda para las etiquetas BAC y EAC: las del eje x no lo invaden */
      const lim = M.l + iw + 4;
      const anchor = xx + half > lim ? 'end' : xx - half < 2 ? 'start' : 'middle';
      return { key: mm, x: xx, label, show: i % every === 0, anchor, tx: anchor === 'end' ? lim : anchor === 'start' ? 2 : xx };
    });
    let status = null;
    if (D.valid(at) && at >= first && at <= end) {
      const sx = x(at); const label = 'Corte ' + fmt.date(at, 'dm');
      const anchor = sx + 6 + label.length * 6.4 > M.l + iw ? 'end' : 'start';
      status = { x: sx, label, anchor, tx: anchor === 'end' ? sx - 6 : sx + 6 };
    }
    let eac = null;
    if (hasEac) {
      const acEnd = lastOf('ac');
      const x0 = acEnd ? x(acEnd.date) : x(at), y0 = y(acEnd ? acEnd.ac : evm.ac);
      const x1 = eacDate && eacDate > (acEnd ? acEnd.date : at) ? x(eacDate) : x0;
      eac = { x0, y0, x1, y1: y(eacShown), line: x1 > x0 + 1, clipped: evm.eac > eacShown || (target && target > cap) };
    }
    const bacY = y(evm.bac);
    const labels = [{ id: 'bac', name: 'BAC', value: rightVals[0], my: bacY, y: bacY }];
    if (eac) labels.push({ id: 'eac', name: eac.clipped ? 'EAC ↗' : 'EAC', value: rightVals[1], my: eac.y1, y: eac.y1 });
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 28) { const mid = (labels[i].y + labels[i - 1].y) / 2; labels[i - 1].y = mid - 14; labels[i].y = mid + 14; }
    const lo = 14, hi = H - 18;
    if (labels[0].y < lo) { const dd = lo - labels[0].y; labels.forEach((l) => { l.y += dd; }); }
    if (labels[labels.length - 1].y > hi) { const dd = labels[labels.length - 1].y - hi; labels.forEach((l) => { l.y -= dd; }); }
    const ends = SERIES.map((s) => { const p = lastOf(s.key); return p ? { key: s.key, x: x(p.date), y: y(p[s.key]), color: s.color } : null; }).filter(Boolean);
    const aria = 'Curva S al ' + fmt.date(at, 'long') + ': valor planificado ' + short(evm.pv, currency) + ', valor ganado ' + short(evm.ev, currency) + ', costo real ' + short(evm.ac, currency) + ', BAC ' + short(evm.bac, currency) + (hasEac ? ', EAC ' + short(evm.eac, currency) : '') + '.';
    let atIdx = series.findIndex((p) => p.date === at); if (atIdx < 0) atIdx = series.length - 1;
    return { W, H, M, iw, ih, ticks: sc.ticks.map((v, i) => ({ v, y: y(v), label: yl[i] })), months, status, eac, bacY, labels, ends, aria, atIdx,
      paths: { pv: pathOf('pv'), ev: pathOf('ev'), ac: pathOf('ac') }, xs: series.map((p) => x(p.date)), y };
  }
  function CurveTip({ p, currency }) {
    const hasEv = isNum(p.ev), hasAc = isNum(p.ac);
    return html`<div class="evm-tip">
      <div class="evm-tip-date">${fmt.date(p.date, 'long')}</div>
      ${SERIES.map((s) => html`<div class="evm-tip-row" key=${s.key}><span class="legend-line" style=${'background:' + s.color}></span><span class="evm-tip-lbl">${s.label} (${s.abbr})</span><strong>${isNum(p[s.key]) ? short(p[s.key], currency) : '—'}</strong></div>`)}
      <div class="evm-tip-sep"></div>
      <div class="evm-tip-row"><span></span><span class="evm-tip-lbl">SV = EV − PV</span><strong>${hasEv ? signedShort(p.ev - p.pv, currency) : '—'}</strong></div>
      <div class="evm-tip-row"><span></span><span class="evm-tip-lbl">CV = EV − AC</span><strong>${hasEv && hasAc ? signedShort(p.ev - p.ac, currency) : '—'}</strong></div>
      ${!hasEv ? html`<div class="xsmall evm-tip-foot">Fecha posterior al corte: solo hay valor planificado.</div>` : null}
    </div>`;
  }
  function SCurveChart({ evm, currency, svgRef }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 680);
    const [hover, setHover] = useState(null);
    const clipId = useMemo(() => PM.uid('evmclip'), []);
    const H = width < 560 ? 290 : 350;
    const g = useMemo(() => curveGeometry(evm, currency, width, H), [evm, currency, width, H]);
    useEffect(() => { setHover(null); tip.hide(); }, [g]);
    if (!g) return html`<p class="small muted">No hay suficientes fechas en el plan para dibujar la curva.</p>`;
    const M = g.M;
    const series = evm.series;
    const showAt = (i, clientX) => {
      const svg = svgRef.current; if (!svg) return;
      const r = svg.getBoundingClientRect();
      setHover(i);
      tip.show({ clientX: clientX !== undefined ? clientX : r.left + g.xs[i], clientY: r.top + M.t + 4 }, html`<${CurveTip} p=${series[i]} currency=${currency} />`);
    };
    const nearest = (px) => { const xs = g.xs; let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] < px) lo = mid; else hi = mid; } return Math.abs(xs[lo] - px) <= Math.abs(xs[hi] - px) ? lo : hi; };
    const onMove = (e) => { const svg = svgRef.current; if (!svg) return; const r = svg.getBoundingClientRect(); showAt(nearest(e.clientX - r.left), e.clientX); };
    const leave = () => { setHover(null); tip.hide(); };
    const onKey = (e) => {
      const n = series.length; let i = hover;
      if (e.key === 'ArrowRight') i = i === null ? g.atIdx : Math.min(n - 1, i + 1);
      else if (e.key === 'ArrowLeft') i = i === null ? g.atIdx : Math.max(0, i - 1);
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      else if (e.key === 'Escape') { leave(); return; }
      else return;
      e.preventDefault(); showAt(i);
    };
    const hp = hover !== null ? series[hover] : null;
    const right = M.l + g.iw;
    return html`<div class="chart evm-chart" ref=${tip.ref} tabindex="0" role="group" aria-label=${g.aria + ' Usa las flechas izquierda y derecha para recorrer las fechas.'} onKeyDown=${onKey} onBlur=${leave}>
      <svg ref=${svgRef} width=${g.W} height=${H} viewBox=${'0 0 ' + g.W + ' ' + H} role="img" aria-label=${g.aria} data-chart="curva-s">
        <defs><clipPath id=${clipId}><rect x=${M.l} y=${M.t - 2} width=${g.iw + 1} height=${g.ih + 4} /></clipPath></defs>
        ${g.ticks.map((t) => html`<g key=${'y' + t.v}><line class="grid-line" x1=${M.l} x2=${right} y1=${t.y} y2=${t.y} /><text x=${M.l - 8} y=${t.y + 3.5} text-anchor="end">${t.label}</text></g>`)}
        <line class="axis-line" x1=${M.l} x2=${right} y1=${M.t + g.ih} y2=${M.t + g.ih} />
        ${g.months.map((m) => html`<g key=${m.key}><line class="axis-line" x1=${m.x} x2=${m.x} y1=${M.t + g.ih} y2=${M.t + g.ih + 4} />${m.show ? html`<text x=${m.tx} y=${H - 9} text-anchor=${m.anchor}>${m.label}</text>` : null}</g>`)}
        <line data-role="bac-line" x1=${M.l} x2=${right} y1=${g.bacY} y2=${g.bacY} style="stroke:var(--fg-3);stroke-width:1" />
        ${g.status ? html`<g data-role="status-line"><line x1=${g.status.x} x2=${g.status.x} y1=${M.t - 8} y2=${M.t + g.ih} style="stroke:var(--signal);stroke-width:1.5" /><text x=${g.status.tx} y=${M.t - 12} text-anchor=${g.status.anchor} style="fill:var(--fg);font-weight:600">${g.status.label}</text></g>` : null}
        <g clip-path=${'url(#' + clipId + ')'}>
          ${g.eac && g.eac.line ? html`<line data-role="eac-line" x1=${g.eac.x0} y1=${g.eac.y0} x2=${g.eac.x1} y2=${g.eac.y1} style="stroke:var(--s2);stroke-width:2;stroke-dasharray:6 5;stroke-linecap:round" />` : null}
          ${g.eac && g.eac.x1 < right - 2 ? html`<line x1=${g.eac.x1} x2=${right} y1=${g.eac.y1} y2=${g.eac.y1} style="stroke:var(--s2);stroke-width:1;stroke-dasharray:2 4" />` : null}
          ${['pv', 'ac', 'ev'].map((k) => { const s = SERIES.find((z) => z.key === k); return html`<path key=${k} data-series=${k} d=${g.paths[k]} style=${'fill:none;stroke:' + s.color + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round'} />`; })}
        </g>
        ${g.ends.map((p) => html`<circle key=${'end-' + p.key} cx=${p.x} cy=${p.y} r="4.5" style=${'fill:' + p.color + ';stroke:var(--surface);stroke-width:2'} />`)}
        ${g.eac && !g.eac.clipped ? html`<circle data-role="eac-point" cx=${g.eac.x1} cy=${g.eac.y1} r="4.5" style="fill:var(--surface);stroke:var(--s2);stroke-width:2" />` : null}
        ${g.labels.map((l) => html`<g key=${l.id} data-role=${'label-' + l.id}>
          ${Math.abs(l.my - (l.y + 4)) > 4 ? html`<line x1=${right + 1} y1=${l.my} x2=${right + 6} y2=${l.y + 4} style="stroke:var(--axis);stroke-width:1" />` : null}
          <text x=${right + 8} y=${l.y - 1} style="fill:var(--fg);font-weight:600">${l.name}</text>
          <text x=${right + 8} y=${l.y + 12}>${l.value}</text>
        </g>`)}
        ${hp ? html`<g pointer-events="none" data-role="crosshair">
          <line x1=${g.xs[hover]} x2=${g.xs[hover]} y1=${M.t} y2=${M.t + g.ih} style="stroke:var(--fg-3);stroke-width:1" />
          ${SERIES.filter((s) => isNum(hp[s.key])).map((s) => html`<circle key=${s.key} cx=${g.xs[hover]} cy=${g.y(hp[s.key])} r="4.5" style=${'fill:' + s.color + ';stroke:var(--surface);stroke-width:2'} />`)}
        </g>` : null}
        <rect class="evm-hit" data-role="hit" x=${M.l} y=${M.t} width=${g.iw} height=${g.ih} style="fill:transparent" onPointerMove=${onMove} onPointerDown=${onMove} onPointerLeave=${leave} />
      </svg>
      ${tip.node}
    </div>`;
  }
  function CurveLegend({ evm, currency, showEac }) {
    return html`<div class="legend" data-role="legend">
      ${SERIES.map((s) => html`<span class="legend-item" key=${s.key}><span class="legend-line" style=${'background:' + s.color}></span>${s.label} (${s.abbr})<span class="evm-legend-v">${short(evm[s.key], currency)}</span></span>`)}
      <span class="legend-item"><span class="legend-line" style="background:var(--fg-3)"></span>Presupuesto hasta la conclusión (BAC)<span class="evm-legend-v">${short(evm.bac, currency)}</span></span>
      ${showEac ? html`<span class="legend-item"><span class="evm-key-dash"></span>Proyección al EAC<span class="evm-legend-v">${short(evm.eac, currency)}</span></span>` : null}
      <span class="legend-item"><span class="evm-key-cut"></span>Fecha de corte<span class="evm-legend-v">${fmt.date(evm.statusDate, 'dm')}</span></span>
    </div>`;
  }
  function SeriesTable({ evm, currency, project, reveal }) {
    const rows = evm.series || [];
    const ref = useRef();
    useEffect(() => { if (reveal && reveal.current && ref.current && ref.current.scrollIntoView) { reveal.current = false; ref.current.scrollIntoView({ block: 'nearest' }); } }, []);
    const exportCsv = () => {
      const cols = [{ key: 'date', label: 'Fecha' }, { key: 'pv', label: 'PV (' + currency + ')' }, { key: 'ev', label: 'EV (' + currency + ')' }, { key: 'ac', label: 'AC (' + currency + ')' }, { key: 'sv', label: 'SV (' + currency + ')' }, { key: 'cv', label: 'CV (' + currency + ')' }];
      const r2 = (v) => (isNum(v) ? Math.round(v * 100) / 100 : '');
      PM.download('curva-s_' + fileBase(project) + '.csv', PM.toCSV(cols, rows.map((p) => ({ date: p.date, pv: r2(p.pv), ev: r2(p.ev), ac: r2(p.ac), sv: isNum(p.ev) ? r2(p.ev - p.pv) : '', cv: isNum(p.ev) && isNum(p.ac) ? r2(p.ev - p.ac) : '' }))));
    };
    return html`<section class="card" data-role="series-table" ref=${ref}>
      <div class="card-head"><div class="stack-sm" style="gap:2px;min-width:0"><h3 class="h3">Datos de la curva S</h3><div class="xsmall faint">${rows.length} fechas: semanales, más los cortes de avance, la fecha de corte y el fin planificado. Valores acumulados.</div></div><div class="row"><${ui.Button} size="sm" icon="download" onClick=${exportCsv}>Exportar CSV</${ui.Button}></div></div>
      <div class="card-body"><div class="table-wrap" style="max-height:420px;overflow:auto"><table class="table table-tight evm-table">
        <thead><tr><th>Fecha</th><th class="num">PV</th><th class="num">EV</th><th class="num">AC</th><th class="num">SV</th><th class="num">CV</th></tr></thead>
        <tbody>${rows.map((p) => html`<tr key=${p.date} class=${p.date > evm.statusDate ? 'evm-row-after' : ''}>
          <td class="mono nowrap">${fmt.date(p.date)}${p.date === evm.statusDate ? html` <${ui.Chip} tone="signal">Corte</${ui.Chip}>` : null}</td>
          <td class="num">${money(p.pv, currency)}</td>
          <td class="num">${isNum(p.ev) ? money(p.ev, currency) : '—'}</td>
          <td class="num">${isNum(p.ac) ? money(p.ac, currency) : '—'}</td>
          <td class="num">${isNum(p.ev) ? html`<${MoneyCell} value=${p.ev - p.pv} currency=${currency} signed />` : '—'}</td>
          <td class="num">${isNum(p.ev) && isNum(p.ac) ? html`<${MoneyCell} value=${p.ev - p.ac} currency=${currency} signed />` : '—'}</td>
        </tr>`)}</tbody>
      </table></div></div>
    </section>`;
  }

  /* Frases de interpretación a partir de los índices. */
  function interpret(evm, currency, sched) {
    const out = [];
    const cal = sched.cal;
    const nb = (s) => String(s).replace(/ /g, '\u00a0');
    const m = (v) => nb(short(v, currency));
    const sg = (v) => nb(signedShort(v, currency));
    const at = fmt.date(evm.statusDate, 'long');
    const { spi, cpi } = evm;
    const sw = spi === null ? null : spi > 1.02 ? 'adelantado' : spi >= 0.98 ? 'al día con el cronograma' : 'atrasado';
    const cw = cpi === null ? null : cpi > 1.02 ? 'por debajo del presupuesto' : cpi >= 0.98 ? 'dentro del presupuesto' : 'por encima del presupuesto';
    if (sw && cw) out.push({ id: 'estado', tone: worstTone(idxTone(spi), idxTone(cpi)), text: 'Al ' + at + ' el proyecto está ' + sw + ' (SPI ' + fmt.idx(spi) + ') y ' + cw + ' (CPI ' + fmt.idx(cpi) + ').' });
    else if (sw) out.push({ id: 'estado', tone: idxTone(spi), text: 'Al ' + at + ' el proyecto está ' + sw + ' (SPI ' + fmt.idx(spi) + '). No hay costos reales registrados hasta la fecha de corte, así que aún no se puede calcular el CPI.' });
    else if (cw) out.push({ id: 'estado', tone: idxTone(cpi), text: 'Al ' + at + ' todavía no hay valor planificado (el inicio planificado es el ' + fmt.date(evm.planStart, 'long') + ') y el proyecto está ' + cw + ' (CPI ' + fmt.idx(cpi) + ').' });
    else out.push({ id: 'estado', tone: null, text: 'Al ' + at + ' todavía no hay valor planificado ni costos reales: el corte es anterior al inicio planificado (' + fmt.date(evm.planStart, 'long') + ') o aún no se ha registrado trabajo.' });
    if (evm.pv > 0 || evm.ev > 0 || evm.ac > 0) {
      out.push({ id: 'valores', tone: null, text: 'Se ha ganado ' + m(evm.ev) + ' de trabajo frente a ' + m(evm.pv) + ' planificado (SV ' + sg(evm.sv) + ')' + (evm.ac > 0 ? ' y se han gastado ' + m(evm.ac) + ' (CV ' + sg(evm.cv) + ').' : '; no hay costos reales registrados hasta la fecha de corte.') });
    }
    if (isNum(evm.eac)) {
      const vac = evm.vac;
      const tail = zeroish(vac, currency) ? 'igual al presupuesto (BAC).' : vac < 0 ? m(-vac) + ' más que el presupuesto (VAC ' + sg(vac) + ').' : m(vac) + ' menos que el presupuesto (VAC ' + sg(vac) + ').';
      out.push({ id: 'eac', tone: zeroish(vac, currency) || vac > 0 ? 'good' : idxTone(cpi) === 'crit' ? 'crit' : 'warn', text: 'Si la eficiencia de costos se mantiene (EAC = BAC / CPI), el proyecto costará ' + m(evm.eac) + ' al concluir: ' + tail });
    }
    if (evm.ev < evm.bac - 0.5 && evm.ac > 0) {
      if (evm.bac - evm.ac <= 0) {
        out.push({ id: 'tcpi', tone: 'crit', text: 'El costo real (' + m(evm.ac) + ') ya alcanzó el BAC (' + m(evm.bac) + ') sin terminar el trabajo: el proyecto no puede concluir dentro del presupuesto. Controla el trabajo restante contra el EAC' + (isNum(evm.tcpiEac) ? ' (TCPI ' + fmt.idx(evm.tcpiEac) + ').' : '.') });
      } else if (isNum(evm.tcpi)) {
        const t = evm.tcpi;
        let cmp = '';
        if (cpi !== null) cmp = t > cpi + 0.005 ? ', más exigente que el desempeño actual (CPI ' + fmt.idx(cpi) + ')' : t < cpi - 0.005 ? ', alcanzable con el desempeño actual (CPI ' + fmt.idx(cpi) + ')' : ', igual al desempeño actual';
        out.push({ id: 'tcpi', tone: t > 1.1 ? 'crit' : t > 1 ? 'warn' : 'good', text: 'Para terminar con el BAC, el trabajo restante debe ejecutarse con un TCPI de ' + fmt.idx(t) + cmp + (t > 1.1 ? '. Un TCPI mayor que 1,10 rara vez se logra: revisa el EAC y evalúa una solicitud de cambio.' : '.') });
      }
    }
    const es = earnedSchedule(evm, sched);
    if (es.actual) {
      const wd = D.valid(evm.planFinish) ? wdDiff(cal, evm.planFinish, es.finish) : null;
      const tail = wd === null ? '.' : wd === 0 ? ', la misma fecha planificada.' : ', ' + wdText(wd) + (wd > 0 ? ' después' : ' antes') + ' de la planificada (' + fmt.date(evm.planFinish, 'long') + ').';
      out.push({ id: 'es', tone: idxTone(es.spiT), text: 'Todo el trabajo presupuestado está completo (EV = BAC). Según el cronograma vigente terminó el ' + fmt.date(es.finish, 'long') + tail + (isNum(es.spiT) ? ' SPI(t) ' + fmt.idx(es.spiT) + ' (duración planificada / duración real).' : '') });
    } else if (isNum(evm.spiT) && D.valid(evm.forecastFinish) && D.valid(evm.planFinish)) {
      const ff = evm.forecastFinish, pf = evm.planFinish;
      const wd = wdDiff(cal, pf, ff);
      const tail = wd === 0 ? ', igual a la planificada.' : wd > 0 ? ', ' + wdText(wd) + ' después de la planificada (' + fmt.date(pf, 'long') + ').' : ', ' + wdText(wd) + ' antes de la planificada (' + fmt.date(pf, 'long') + ').';
      out.push({ id: 'es', tone: idxTone(evm.spiT), text: 'Según el cronograma ganado, el trabajo hecho equivale a ' + fmt.num(evm.esWd, 1) + ' de los ' + fmt.num(evm.atWd, 0) + ' días hábiles transcurridos (SPI(t) ' + fmt.idx(evm.spiT) + '). La fecha de fin pronosticada por cronograma ganado es el ' + fmt.date(ff, 'long') + tail });
    }
    out.push({ id: 'avance', tone: null, text: 'Avance: ' + fmt.pct(evm.pctComplete, 1) + ' completado frente a ' + fmt.pct(evm.pctPlanned, 1) + ' planificado; se ha gastado el ' + fmt.pct(evm.pctSpent, 1) + ' del BAC.' });
    return out;
  }
  function Interpretation({ evm, currency, sched }) {
    const notes = useMemo(() => interpret(evm, currency, sched), [evm, currency, sched]);
    const icon = (t) => (t === 'good' ? 'check-circle' : t === 'warn' || t === 'crit' ? 'alert' : 'info');
    return html`<${SectionCard} title="Interpretación al corte" subtitle="Lectura de los índices del valor ganado" attrs=${{ 'data-role': 'interpretation' }}>
      <ul class="evm-notes">${notes.map((n) => html`<li key=${n.id} class="evm-note" data-note=${n.id} data-tone=${n.tone || undefined}><${ui.Icon} name=${icon(n.tone)} size=${16} /><span>${n.text.replace(/\b(SPI\(t\)|SPI|CPI|TCPI|SV|CV|VAC|EAC) (?=[−+\d$])/g, '$1\u00a0')}</span></li>`)}</ul>
    </${SectionCard}>`;
  }
  function CurveTab({ model, project, onTab }) {
    const { evm, currency, sched } = model;
    const [showTable, setShowTable] = useState(() => !!PM.prefs.get('evm.curveTable', false));
    const svgRef = useRef();
    const opened = useRef(false);
    const toggle = () => { const v = !showTable; opened.current = v; setShowTable(v); PM.prefs.set('evm.curveTable', v); };
    const showEac = isNum(evm.eac) && evm.ac > 0;
    const sub = 'Valores acumulados al ' + fmt.date(evm.statusDate, 'long') + ' · PV hasta el fin planificado, EV y AC hasta el corte';
    /* sin cortes de avance anteriores a la fecha de corte, PM.calc.evm traza el EV en línea recta desde el inicio */
    const straightEv = evm.ev > 0 && Array.isArray(evm.evPoints) && evm.evPoints.length <= 2;
    return html`<div class="stack" style="gap:16px"><div class="split">
      <${SectionCard} title="Curva S del proyecto" subtitle=${sub} attrs=${{ 'data-role': 'curve-card' }} actions=${html`
        <${ui.Button} size="sm" icon="table" aria-pressed=${showTable ? 'true' : 'false'} onClick=${toggle}>${showTable ? 'Ocultar tabla' : 'Ver tabla'}</${ui.Button}>
        <${ui.SvgDownload} getSvg=${() => svgRef.current} filename=${'curva-s_' + fileBase(project) + '.svg'} />`}>
        <div class="stack">
          <${CurveLegend} evm=${evm} currency=${currency} showEac=${showEac} />
          <${SCurveChart} evm=${evm} currency=${currency} svgRef=${svgRef} />
          ${straightEv ? html`<div class="evm-hint" data-role="no-cuts-hint"><${ui.Icon} name="info" size=${14} /><span>Sin cortes de avance hasta la fecha de corte: el valor ganado se traza en línea recta desde el inicio.</span>
            <${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => onTab('avance')}>Registrar cortes de avance</${ui.Button}></div>` : null}
        </div>
      </${SectionCard}>
      <${Interpretation} evm=${evm} currency=${currency} sched=${sched} />
    </div>
    ${showTable ? html`<${SeriesTable} evm=${evm} currency=${currency} project=${project} reveal=${opened} />` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- 2. indicadores */
  function Group({ title, subtitle, span, plain, children, id }) {
    return html`<section class=${cx('card', span && 'span-all')} data-group=${id}>
      <div class="card-head"><div class="stack-sm" style="gap:2px;min-width:0"><h3 class="h3">${title}</h3>${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}</div></div>
      <div class=${cx('evm-tiles', plain && 'is-plain')}>${children}</div>
    </section>`;
  }
  function IndicatorsTab({ model }) {
    const { evm, currency: cur, baselines, sched } = model;
    const S = (v) => (isNum(v) ? short(v, cur) : '—');
    const F = (v) => (isNum(v) ? money(v, cur) : null);
    const one = (PM.CURRENCIES[cur] || PM.CURRENCIES.COP).symbol + '\u00a01';
    const rAc = 'Sin costos reales hasta la fecha de corte (AC = 0).';
    const rPv = 'El corte es anterior al inicio planificado (PV = 0).';
    const src = evm.fromBaseline ? 'Según la línea base ' + blLabel(baselines.cost) : 'Según el cronograma actual (sin línea base de costos)';
    const svPct = evm.pv > 0 ? evm.sv / evm.pv : null;
    const cvPct = evm.ev > 0 ? evm.cv / evm.ev : null;
    /* TCPI: > 1 es más difícil de lograr; se compara además con el CPI actual */
    const cpiNow = isNum(evm.cpi) ? evm.cpi : null;
    const within = (v) => cpiNow !== null && v <= cpiNow + 0.005;
    const same = (v) => cpiNow !== null && Math.abs(v - cpiNow) < 0.005;
    const tTone = (v) => (!isNum(v) ? null : v < 0 ? 'crit' : same(v) ? null : within(v) ? 'good' : v > 1.1 ? 'crit' : v > 1 || cpiNow !== null ? 'warn' : 'good');
    const tNote = (v, base) => {
      if (!isNum(v)) return null;
      if (v < 0) return 'El costo real ya superó el ' + base + ': no es alcanzable.';
      const c = cpiNow !== null ? ' (CPI actual ' + fmt.idx(cpiNow) + ')' : '';
      if (same(v)) return 'Igual al CPI actual: la EAC típica supone que la eficiencia actual se mantiene.';
      if (within(v)) return v > 1 ? 'Mayor que 1, pero no supera el desempeño actual' + c + ': alcanzable si se mantiene.' : 'Menor o igual a 1 y al desempeño actual' + c + ': alcanzable.';
      if (v > 1.1) return 'Mayor que 1,10' + (c ? ' y que el desempeño actual' + c : '') + ': muy difícil de lograr.';
      if (v > 1) return 'Mayor que 1: más difícil de lograr; exige más eficiencia que la ' + (c ? 'actual' + c : 'planificada') + '.';
      return c ? 'Menor que 1, pero exige mejorar el desempeño actual' + c + '.' : 'Menor o igual a 1: alcanzable con la eficiencia planificada.';
    };
    const done = evm.ev >= evm.bac - 0.5;
    const money3 = (key, label, abbr, formula, note, reason, tone) => {
      const v = evm[key];
      return html`<${Metric} id=${key} label=${label} abbr=${abbr} display=${isNum(v) ? S(v) : '—'} full=${isNum(v) ? F(v) : null} empty=${!isNum(v)} tone=${isNum(v) ? tone : null} formula=${formula} note=${isNum(v) ? note : reason} />`;
    };
    const es = useMemo(() => earnedSchedule(evm, sched), [evm, sched]);
    const ff = es.finish, pf = evm.planFinish;
    const ffWd = D.valid(ff) && D.valid(pf) ? wdDiff(sched.cal, pf, ff) : null;
    const ffTone = ffWd === null ? null : ffWd <= 0 ? 'good' : idxTone(es.spiT) || 'warn';
    const pctMeter = (v, color, label) => html`<div class="evm-meter" role="meter" aria-label=${label} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(PM.clamp(v, 0, 1) * 100)}><span style=${'width:' + PM.clamp(v, 0, 1) * 100 + '%;background:' + color}></span></div>`;
    return html`<div class="evm-groups" data-role="indicators">
      <${Group} id="valores" span title="Valores" subtitle=${'Acumulados al ' + fmt.date(evm.statusDate, 'long') + ' · ' + src}>
        <${Metric} id="pv" abbr="PV" label="Valor planificado" display=${S(evm.pv)} full=${F(evm.pv)} formula="PV = Σ presupuesto × % planificado al corte" note=${evm.pv > 0 ? null : rPv} />
        <${Metric} id="ev" abbr="EV" label="Valor ganado" display=${S(evm.ev)} full=${F(evm.ev)} formula="EV = Σ presupuesto × % completado" />
        <${Metric} id="ac" abbr="AC" label="Costo real" display=${S(evm.ac)} full=${F(evm.ac)} formula="AC = Σ costos reales hasta el corte" note=${evm.ac > 0 ? (evm.actualsCount || 0) + ((evm.actualsCount || 0) === 1 ? ' registro de costo con fecha' : ' registros de costo con fecha') : rAc} />
        <${Metric} id="bac" abbr="BAC" label="Presupuesto hasta la conclusión" display=${S(evm.bac)} full=${F(evm.bac)} formula="BAC = Σ presupuesto de las actividades" note=${evm.fromBaseline ? 'Línea base ' + blLabel(baselines.cost) : 'Cronograma actual'} />
      </${Group}>
      <${Group} id="variaciones" title="Variaciones" subtitle="Positivo: favorable · negativo: desfavorable">
        <${Metric} id="sv" abbr="SV" label="Variación del cronograma" display=${signedShort(evm.sv, cur)} full=${signedMoney(evm.sv, cur)} tone=${idxTone(evm.spi)} formula="SV = EV − PV" note=${isNum(svPct) ? (zeroish(evm.sv, cur) ? 'Se ha ganado lo planificado.' : 'Equivale al ' + fmt.pct(Math.abs(svPct), 1) + ' del PV: se ha ganado ' + (evm.sv < 0 ? 'menos' : 'más') + ' de lo planificado.') : rPv} />
        <${Metric} id="cv" abbr="CV" label="Variación del costo" display=${evm.ac > 0 ? signedShort(evm.cv, cur) : '—'} empty=${!(evm.ac > 0)} full=${evm.ac > 0 ? signedMoney(evm.cv, cur) : null} tone=${idxTone(evm.cpi)} formula="CV = EV − AC" note=${evm.ac > 0 ? (isNum(cvPct) ? (zeroish(evm.cv, cur) ? 'El costo real es igual al valor ganado.' : (evm.cv < 0 ? 'Sobrecosto' : 'Ahorro') + ' equivalente al ' + fmt.pct(Math.abs(cvPct), 1) + ' del EV.') : null) : rAc} />
      </${Group}>
      <${Group} id="indices" title="Índices de desempeño" subtitle="≥ 0,98 en verde · 0,90–0,98 en amarillo · < 0,90 en rojo">
        <${Metric} id="spi" abbr="SPI" label="Índice de desempeño del cronograma" display=${isNum(evm.spi) ? fmt.idx(evm.spi) : '—'} empty=${!isNum(evm.spi)} tone=${idxTone(evm.spi)} formula="SPI = EV / PV" note=${isNum(evm.spi) ? (evm.spi >= 1 ? 'Se ha ganado al menos lo planificado.' : 'Por cada ' + one + ' planificado se ha ganado ' + fmt.fixed(evm.spi, 2) + '.') : rPv}>
          <${IndexGauge} value=${evm.spi} label="SPI" />
        </${Metric}>
        <${Metric} id="cpi" abbr="CPI" label="Índice de desempeño del costo" display=${isNum(evm.cpi) ? fmt.idx(evm.cpi) : '—'} empty=${!isNum(evm.cpi)} tone=${idxTone(evm.cpi)} formula="CPI = EV / AC" note=${isNum(evm.cpi) ? 'Por cada ' + one + ' gastado se ha ganado ' + fmt.fixed(evm.cpi, 2) + '.' : rAc}>
          <${IndexGauge} value=${evm.cpi} label="CPI" />
        </${Metric}>
      </${Group}>
      <${Group} id="pronosticos" span title="Pronósticos" subtitle="Estimaciones a la conclusión (EAC) y desempeño requerido">
        ${money3('eac', 'EAC típica', 'EAC', 'EAC = BAC / CPI', 'Supone que la eficiencia de costos actual continúa.', rAc, isNum(evm.vac) ? (evm.vac >= -0.5 ? 'good' : idxTone(evm.cpi)) : null)}
        ${money3('eacAtypical', 'EAC atípica', 'EAC', 'EAC = AC + (BAC − EV)', 'Supone que el trabajo restante se ejecuta según el presupuesto.', rAc)}
        ${money3('eacComposite', 'EAC con CPI y SPI', 'EAC', 'EAC = AC + (BAC − EV) / (CPI × SPI)', 'Útil cuando el cronograma restringe el costo.', !(evm.ac > 0) ? rAc : rPv)}
        ${money3('etc', 'Estimación hasta la conclusión', 'ETC', 'ETC = EAC − AC', 'Lo que falta por gastar según la EAC típica.', rAc)}
        <${Metric} id="vac" abbr="VAC" label="Variación a la conclusión" display=${isNum(evm.vac) ? signedShort(evm.vac, cur) : '—'} full=${isNum(evm.vac) ? signedMoney(evm.vac, cur) : null} empty=${!isNum(evm.vac)} tone=${isNum(evm.vac) ? (evm.vac >= -0.5 ? 'good' : idxTone(evm.cpi)) : null} formula="VAC = BAC − EAC" note=${isNum(evm.vac) ? (evm.vac < -0.5 ? 'Negativo: el proyecto terminaría por encima del presupuesto.' : 'Cero o positivo: terminaría dentro del presupuesto.') : rAc} />
        <${Metric} id="tcpi" abbr="TCPI" label="Índice de desempeño del trabajo por completar (BAC)" display=${done ? '—' : isNum(evm.tcpi) ? fmt.idx(evm.tcpi) : '—'} empty=${done || !isNum(evm.tcpi)} tone=${done ? null : tTone(evm.tcpi)} formula="TCPI = (BAC − EV) / (BAC − AC)" note=${done ? 'El trabajo está completo: no queda trabajo por ejecutar.' : isNum(evm.tcpi) ? tNote(evm.tcpi, 'BAC') : 'No queda presupuesto por ejecutar (BAC = AC).'} />
        <${Metric} id="tcpiEac" abbr="TCPI" label="Índice de desempeño del trabajo por completar (EAC)" display=${done ? '—' : isNum(evm.tcpiEac) ? fmt.idx(evm.tcpiEac) : '—'} empty=${done || !isNum(evm.tcpiEac)} tone=${done ? null : tTone(evm.tcpiEac)} formula="TCPI = (BAC − EV) / (EAC − AC)" note=${done ? 'El trabajo está completo: no queda trabajo por ejecutar.' : isNum(evm.tcpiEac) ? tNote(evm.tcpiEac, 'EAC') : rAc} />
      </${Group}>
      <${Group} id="cronograma-ganado" title="Cronograma ganado" subtitle="Medido en días hábiles del calendario del proyecto">
        <${Metric} id="es" abbr="ES" label="Cronograma ganado" display=${isNum(es.esWd) ? fmt.num(es.esWd, 1) : '—'} full=${isNum(es.esWd) ? 'días hábiles' : null} empty=${!isNum(es.esWd)} formula="ES = momento en que el PV igualaba el EV actual" note=${!isNum(es.esWd) ? 'Requiere fechas y presupuesto en el plan.' : es.actual ? 'Trabajo completo: ES = PD.' : null} />
        <${Metric} id="at" abbr="AT" label="Tiempo real transcurrido" display=${isNum(es.atWd) ? fmt.num(es.atWd, 0) : '—'} full=${isNum(es.atWd) ? 'días hábiles' : null} empty=${!isNum(es.atWd)} formula=${es.actual ? 'AT = días hábiles del inicio planificado a la terminación' : 'AT = días hábiles del inicio planificado al corte'} note=${es.actual ? 'Con el trabajo completo, el tiempo se mide hasta la terminación del ' + fmt.date(ff) + ', no hasta la fecha de corte.' : null} />
        <${Metric} id="spiT" abbr="SPI(t)" label="Índice del cronograma (tiempo)" display=${isNum(es.spiT) ? fmt.idx(es.spiT) : '—'} empty=${!isNum(es.spiT)} tone=${idxTone(es.spiT)} formula="SPI(t) = ES / AT" note=${es.actual ? 'Duración planificada frente a la duración real del trabajo.' : isNum(es.spiT) ? 'A diferencia del SPI, no tiende a 1,00 al final del proyecto.' : 'El corte es anterior al inicio planificado (AT = 0).'}>
          <${IndexGauge} value=${es.spiT} label="SPI(t)" />
        </${Metric}>
        <${Metric} id="forecastFinish" label=${es.actual ? 'Fin del trabajo' : 'Fin pronosticado por cronograma ganado'}display=${D.valid(ff) ? fmt.date(ff) : '—'} empty=${!D.valid(ff)} tone=${ffTone} full=${D.valid(pf) ? 'Planificado: ' + fmt.date(pf) : null} formula=${es.actual ? 'Terminación según el cronograma vigente' : 'IEAC(t) = PD / SPI(t)'} note=${ffWd === null ? 'Se calcula cuando hay SPI(t).' : ffWd === 0 ? 'Igual a la fecha planificada.' : ffWd > 0 ? wdText(ffWd) + ' de atraso.' : wdText(ffWd) + ' de adelanto.'} />
        <${Metric} id="pd" abbr="PD" label="Duración planificada" display=${isNum(evm.pdWd) ? fmt.num(evm.pdWd, 0) : '—'} full=${isNum(evm.pdWd) ? 'días hábiles' : null} empty=${!isNum(evm.pdWd)} formula="PD = días hábiles del inicio al fin planificados" />
      </${Group}>
      <${Group} id="porcentajes" plain title="Porcentajes" subtitle="Respecto al BAC">
        <${Metric} id="pctPlanned" label="Planificado" display=${fmt.pct(evm.pctPlanned, 1)} formula="% planificado = PV / BAC">${pctMeter(evm.pctPlanned, 'var(--s1)', 'Porcentaje planificado')}</${Metric}>
        <${Metric} id="pctComplete" label="Completado" display=${fmt.pct(evm.pctComplete, 1)} formula="% completado = EV / BAC">${pctMeter(evm.pctComplete, 'var(--s3)', 'Porcentaje completado')}</${Metric}>
        <${Metric} id="pctSpent" label="Gastado" display=${fmt.pct(evm.pctSpent, 1)} formula="% gastado = AC / BAC">${pctMeter(evm.pctSpent, 'var(--s2)', 'Porcentaje gastado')}</${Metric}>
      </${Group}>
    </div>`;
  }

  /* ---------------------------------------------------------------- 3. costos reales */
  const ACTUALS_PAGE = 200;
  const ACTUAL_KEYS = ['date', 'taskId', 'category', 'description', 'document', 'amount'];
  /* Celda de actividad: muestra la actividad elegida y solo crea la lista desplegable al editarla
     (cientos de opciones repetidas en cada fila harían lenta la tabla). */
  function TaskPicker({ value, ctx, label, onPick }) {
    const [editing, setEditing] = useState(null);
    const ref = useRef();
    useLayoutEffect(() => {
      const el = ref.current; if (!editing || !el) return;
      el.focus();
      if (editing === 'click' && typeof el.showPicker === 'function') { try { el.showPicker(); } catch (e) { /* el navegador no permite abrir la lista: queda enfocada */ } }
    }, [editing]);
    const t = value ? ctx.taskById.get(value) : null;
    const text = t ? taskLabel(t, ctx.tree) : value ? 'Actividad eliminada del cronograma' : 'Sin actividad';
    if (!editing) {
      return html`<button type="button" class="cell-input evm-cell-btn" data-role="task-btn" aria-label=${label + ': ' + text} title=${text}
        onMouseDown=${(e) => { e.preventDefault(); setEditing('click'); }} onFocus=${() => setEditing('focus')}><span class=${cx('truncate', !t && 'faint')}>${text}</span></button>`;
    }
    return html`<select ref=${ref} class="cell-input" data-field="taskId" aria-label=${label} value=${value || ''} onChange=${(e) => onPick(e.currentTarget.value || null)} onBlur=${() => setEditing(null)}>
      <option value="">Sin actividad</option>
      ${value && !t ? html`<option value=${value}>Actividad eliminada del cronograma</option>` : null}
      ${ctx.taskOptions.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
    </select>`;
  }
  /* Fila de costo real: solo se vuelve a dibujar cuando cambian sus datos (tablas de cientos de registros). */
  class ActualRow extends PM.lib.Component {
    shouldComponentUpdate(n) {
      const p = this.props;
      if (n.canWrite !== p.canWrite || n.statusDate !== p.statusDate || n.ctx !== p.ctx) return true;
      return ACTUAL_KEYS.some((k) => n.a[k] !== p.a[k]);
    }
    render() {
      const { a, ctx, canWrite, statusDate } = this.props;
      const { currency, tree, taskById, catOptions, api } = ctx;
      const t = taskById.get(a.taskId);
      const flag = !D.valid(a.date) ? html`<span class="evm-flag is-warn">Sin fecha: no cuenta en el AC</span>` : a.date > statusDate ? html`<span class="evm-flag is-info">Posterior al corte</span>` : null;
      if (!canWrite) {
        return html`<tr data-actual=${a.id}>
          <td class="mono nowrap">${D.valid(a.date) ? fmt.date(a.date) : '—'}${flag}</td>
          <td style="min-width:180px">${t ? taskLabel(t, tree) : a.taskId ? html`<span class="faint">Actividad eliminada del cronograma</span>` : html`<span class="faint">Sin actividad</span>`}</td>
          <td>${a.category || html`<span class="faint">—</span>`}</td>
          <td style="min-width:200px">${a.description || html`<span class="faint">—</span>`}</td>
          <td class="mono">${a.document || html`<span class="faint">—</span>`}</td>
          <td class="num" data-field="amount">${money(num(a.amount), currency)}</td>
        </tr>`;
      }
      const L = (s) => s + ' — registro del ' + (D.valid(a.date) ? fmt.date(a.date) : 'sin fecha');
      const up = (patch) => api.current.update(a.id, patch);
      return html`<tr data-actual=${a.id}>
        <td style="min-width:132px"><input type="date" class="cell-input" data-field="date" aria-label=${L('Fecha')} value=${a.date || ''} onFocus=${() => api.current.freeze()} onBlur=${() => api.current.unfreeze()} onInput=${(e) => up({ date: e.currentTarget.value || null })} />${flag}</td>
        <td style="min-width:160px;max-width:220px"><${TaskPicker} value=${a.taskId} ctx=${ctx} label=${L('Actividad')} onPick=${(id) => { const tk = id ? taskById.get(id) : null; up({ taskId: id, wbsId: tk ? tk.wbsId || null : null }); }} /></td>
        <td style="min-width:128px"><select class="cell-input" data-field="category" aria-label=${L('Categoría')} value=${a.category || ''} onChange=${(e) => up({ category: e.currentTarget.value })}>
          <option value="">Sin categoría</option>
          ${catOptions.map((c) => html`<option key=${c} value=${c}>${c}</option>`)}
        </select></td>
        <td style="min-width:160px"><${DraftInput} class="cell-input" data-field="description" aria-label=${L('Descripción')} placeholder="Qué se pagó" title=${a.description || undefined} value=${a.description || ''} onCommit=${(v) => up({ description: v })} /></td>
        <td style="min-width:100px"><${DraftInput} class="cell-input mono" data-field="document" aria-label=${L('Documento soporte')} placeholder="Factura, OC…" value=${a.document || ''} onCommit=${(v) => up({ document: v })} /></td>
        <td style="min-width:120px"><${DeferredNumber} class="cell-input" data-field="amount" aria-label=${L('Valor')} money currency=${currency} value=${a.amount} placeholder="0" onCommit=${(v) => up({ amount: v })} /></td>
        <td class="ctl"><${ui.IconButton} size="sm" icon="trash" label=${L('Eliminar')} onClick=${() => api.current.remove(this.props.a)} /></td>
      </tr>`;
    }
  }
  function ActualsTab({ model, canWrite, project }) {
    const { costs, saveCosts, sched, tree, statusDate, currency, evm } = model;
    const actuals = costs.actuals || EMPTY_ARR;
    const latest = useLatest(costs);
    const [fMonth, setFMonth] = useState('');
    const [fCat, setFCat] = useState('');
    const [q, setQ] = useState('');
    const [frozen, setFrozen] = useState(null);
    const [focusId, setFocusId] = useState(null);
    const [limit, setLimit] = useState(ACTUALS_PAGE);
    const filterSetter = (fn) => (v) => { fn(v); setLimit(ACTUALS_PAGE); };
    const taskById = useMemo(() => new Map(sched.tasks.map((t) => [t.id, t])), [sched]);
    const taskOptions = useMemo(() => sched.tasks.map((t) => ({ value: t.id, label: taskLabel(t, tree) })), [sched, tree]);
    const sorted = useMemo(() => { const idx = new Map(actuals.map((a, i) => [a.id, i])); return [...actuals].sort((a, b) => cmpDate(a.date, b.date) || idx.get(a.id) - idx.get(b.id)); }, [actuals]);
    /* mientras se edita una fecha, el orden se congela para que la fila no salte; se reordena al salir del campo */
    const ordered = useMemo(() => {
      if (!frozen) return sorted;
      const pos = new Map(frozen.map((id, i) => [id, i]));
      return [...actuals].sort((a, b) => (pos.has(a.id) ? pos.get(a.id) : 1e9) - (pos.has(b.id) ? pos.get(b.id) : 1e9));
    }, [sorted, frozen, actuals]);
    const ql = q.trim().toLowerCase();
    const shown = useMemo(() => ordered.filter((a) => (!fMonth || (D.valid(a.date) && a.date.slice(0, 7) === fMonth)) && (!fCat || (a.category || '') === fCat) && (!ql || (String(a.description || '') + ' ' + String(a.document || '') + ' ' + String((taskById.get(a.taskId) || {}).name || '')).toLowerCase().includes(ql))), [ordered, fMonth, fCat, ql, taskById]);
    useEffect(() => {
      if (!focusId) return;
      const el = document.querySelector('[data-actual="' + focusId + '"] [data-field="description"]');
      if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
      setFocusId(null);
    }, [focusId, shown]);

    /* latest se actualiza al escribir (no solo al dibujar): dos escrituras en el mismo evento no se pisan.
       Si el registro de costos no cabe en el documento, no se aplica nada (devuelve false). */
    const write = (next, edit) => saveCostsChecked((v) => { latest.current = v; saveCosts(v); }, { ...latest.current, actuals: next }, latest.current, edit);
    const update = (id, patch) => write((latest.current.actuals || []).map((a) => (a.id === id ? { ...a, ...patch } : a)), true);
    const add = () => {
      const id = PM.uid('ac');
      const lastCat = sorted.length ? sorted[sorted.length - 1].category || '' : '';
      if (!write([...(latest.current.actuals || []), { id, date: statusDate, taskId: null, wbsId: null, category: lastCat, description: '', document: '', amount: null }])) return;
      setFMonth(''); setFCat(''); setQ('');
      /* la fila nueva (con la fecha de corte) debe quedar dentro de la ventana visible, que muestra los registros más recientes */
      const later = sorted.filter((x) => !D.valid(x.date) || x.date > statusDate).length;
      setLimit((l) => Math.max(l, later + 1));
      setFocusId(id);
    };
    const remove = async (a) => {
      const meaningful = num(a.amount) !== 0 || String(a.description || '').trim() || String(a.document || '').trim();
      if (meaningful) {
        const ok = await PM.confirm({ title: 'Eliminar costo real', body: 'Se eliminará el registro' + (String(a.description || '').trim() ? ' «' + String(a.description).trim() + '»' : '') + ' por ' + money(num(a.amount), currency) + (D.valid(a.date) ? ' del ' + fmt.date(a.date, 'long') : '') + '. El costo real (AC) se recalculará.', confirmText: 'Eliminar registro', tone: 'danger' });
        if (!ok) return;
      }
      if (write((latest.current.actuals || []).filter((x) => x.id !== a.id))) PM.toast('Registro de costo eliminado.');
    };
    const freeze = () => setFrozen(ordered.map((a) => a.id));
    const unfreeze = () => setFrozen(null);

    /* totales */
    const valid = useMemo(() => actuals.filter((a) => D.valid(a.date)), [actuals]);
    const totalAll = PM.sum(actuals, (a) => a.amount);
    const undated = actuals.filter((a) => !D.valid(a.date));
    const after = valid.filter((a) => a.date > statusDate);
    const noTask = actuals.filter((a) => !a.taskId || !taskById.has(a.taskId));
    const byCat = useMemo(() => {
      const map = new Map(CATEGORIES.map((c) => [c, 0]));
      for (const a of actuals) { const k = CATEGORIES.includes(a.category) ? a.category : a.category ? a.category : 'Sin categoría'; map.set(k, (map.get(k) || 0) + num(a.amount)); }
      return [...map.entries()].map(([k, v]) => ({ k, v })).filter((r) => r.v !== 0 || CATEGORIES.includes(r.k));
    }, [actuals]);
    const byMonth = useMemo(() => {
      if (!valid.length) return [];
      const dates = valid.map((a) => a.date).sort();
      let cum = 0;
      return monthsBetween(dates[0], dates[dates.length - 1]).map((m) => {
        const key = m.slice(0, 7); const items = valid.filter((a) => a.date.slice(0, 7) === key);
        const v = PM.sum(items, (a) => a.amount); cum += v;
        return { m, key, v, cum, n: items.length, after: m > statusDate };
      });
    }, [valid, statusDate]);
    const monthOptions = useMemo(() => [...new Set(valid.map((a) => a.date.slice(0, 7)))].sort().map((k) => ({ value: k, label: fmt.date(k + '-01', 'month') })), [valid]);
    /* lista de categorías estable mientras no aparezca una categoría nueva (evita redibujar todas las filas al escribir) */
    const catExtra = useMemo(() => [...new Set(actuals.map((a) => a.category).filter((c) => c && !CATEGORIES.includes(c)))].sort().join('\u0001'), [actuals]);
    const catOptions = useMemo(() => [...CATEGORIES, ...(catExtra ? catExtra.split('\u0001') : [])], [catExtra]);
    const maxCat = Math.max(1, ...byCat.map((r) => Math.abs(r.v)));
    const maxMonth = Math.max(1, ...byMonth.map((r) => Math.abs(r.v)));

    const exportCsv = () => {
      const cols = [{ key: 'date', label: 'Fecha' }, { key: 'activity', label: 'Actividad' }, { key: 'wbs', label: 'Código EDT' }, { key: 'category', label: 'Categoría' }, { key: 'description', label: 'Descripción' }, { key: 'document', label: 'Documento soporte' }, { key: 'amount', label: 'Valor (' + currency + ')' }];
      const rows = sorted.map((a) => { const t = taskById.get(a.taskId); return { date: a.date || '', activity: t ? t.name || '' : a.taskId ? 'Actividad eliminada del cronograma' : '', wbs: t ? taskCode(t, tree) : '', category: a.category || '', description: a.description || '', document: a.document || '', amount: num(a.amount) }; });
      PM.download('costos-reales_' + fileBase(project) + '.csv', PM.toCSV(cols, rows));
    };
    const shownTotal = PM.sum(shown, (a) => a.amount);
    const filtered = !!(fMonth || fCat || ql);
    const api = useRef(null);
    api.current = { update, remove, freeze, unfreeze };
    const ctx = useMemo(() => ({ currency, tree, taskById, taskOptions, catOptions, api }), [currency, tree, taskById, taskOptions, catOptions]);
    const hiddenCount = Math.max(0, shown.length - limit);
    const visible = hiddenCount ? shown.slice(hiddenCount) : shown;
    const cols = canWrite ? 7 : 6;

    return html`<div class="evm-tabpanel" data-role="actuals">
      ${canWrite ? html`<${CapacityNote} costs=${costs} />` : null}
      <section class="card"><div class="evm-tiles is-flat">
        <${Metric} id="ac-total" label="Total registrado" display=${short(totalAll, currency)} full=${money(totalAll, currency)} note=${actuals.length + (actuals.length === 1 ? ' registro' : ' registros') + (undated.length ? ', ' + undated.length + ' sin fecha' : '')} />
        <${Metric} id="ac-cut" label=${'Costo real (AC) al ' + fmt.date(statusDate)} display=${short(evm.ac, currency)} full=${money(evm.ac, currency)} note=${after.length ? after.length + (after.length === 1 ? ' registro posterior al corte no cuenta.' : ' registros posteriores al corte no cuentan.') : 'Incluye todos los registros con fecha.'} />
        <${Metric} id="ac-notask" label="Sin actividad asignada" display=${short(PM.sum(noTask, (a) => a.amount), currency)} full=${noTask.length + (noTask.length === 1 ? ' registro' : ' registros')} note="Cuentan en el AC del proyecto, pero no en el desempeño por actividad." />
        ${undated.length ? html`<${Metric} id="ac-undated" label="Registros sin fecha" display=${String(undated.length)} tone="warn" note="No cuentan en el AC. Asígnales una fecha." />` : null}
      </div></section>

      <${SectionCard} title="Registro de costos reales" subtitle="Facturas, nómina, órdenes de compra y demás soportes del costo incurrido. Ordenado por fecha." pad=${false} actions=${html`
        <${ui.Button} size="sm" icon="download" onClick=${exportCsv} disabled=${!actuals.length}>Exportar CSV</${ui.Button}>
        ${canWrite ? html`<${ui.Button} size="sm" variant="primary" icon="plus" onClick=${add}>Agregar costo real</${ui.Button}>` : null}`}>
        <div class="card-body stack">
          ${actuals.length ? html`<div class="evm-filters">
            <${ui.Search} value=${q} onValue=${filterSetter(setQ)} placeholder="Buscar descripción, soporte o actividad" aria-label="Buscar costos reales" />
            <${ui.Select} value=${fMonth} onValue=${filterSetter(setFMonth)} placeholder="Todos los meses" options=${monthOptions} aria-label="Filtrar por mes" />
            <${ui.Select} value=${fCat} onValue=${filterSetter(setFCat)} placeholder="Todas las categorías" options=${catOptions} aria-label="Filtrar por categoría" />
            ${filtered ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => { setQ(''); setFMonth(''); setFCat(''); setLimit(ACTUALS_PAGE); }}>Quitar filtros</${ui.Button}>` : null}
          </div>` : null}
          ${!actuals.length ? html`<${ui.Empty} icon="money" title="Aún no hay costos reales registrados" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${add}>Agregar costo real</${ui.Button}>` : null}>
            Registra cada costo incurrido con su fecha, actividad y documento soporte. El costo real acumulado (AC) hasta la fecha de corte se compara con el valor ganado para obtener el CPI.
          </${ui.Empty}>` : html`<div class="table-wrap"><table class=${cx('table evm-actuals', canWrite && 'table-edit')}>
            <thead><tr><th>Fecha</th><th>Actividad</th><th>Categoría</th><th>Descripción</th><th title="Factura, orden de compra, nómina u otro soporte">Documento</th><th class="num">${'Valor (' + currency + ')'}</th>${canWrite ? html`<th><span class="sr-only">Acciones</span></th>` : null}</tr></thead>
            <tbody>
              ${shown.length === 0 ? html`<tr><td colspan=${cols} class="faint" style="padding:14px 12px">Ningún registro coincide con el filtro.</td></tr>` : null}
              ${hiddenCount ? html`<tr data-role="more-actuals"><td colspan=${cols} style="padding:8px 10px"><div class="row">
                <span class="xsmall faint">Se muestran los ${visible.length} registros más recientes; hay ${hiddenCount} anteriores.</span>
                <${ui.Button} size="sm" icon="chevron-up" onClick=${() => setLimit((l) => l + ACTUALS_PAGE)}>Mostrar ${Math.min(ACTUALS_PAGE, hiddenCount)} anteriores</${ui.Button}>
                <${ui.Button} size="sm" variant="ghost" onClick=${() => setLimit(Infinity)}>Mostrar todos</${ui.Button}>
              </div></td></tr>` : null}
              ${visible.map((a) => html`<${ActualRow} key=${a.id} a=${a} ctx=${ctx} canWrite=${canWrite} statusDate=${statusDate} />`)}
            </tbody>
            <tfoot><tr><td colspan="5" style="font-weight:650;background:var(--surface-2)">${filtered ? 'Total del filtro (' + shown.length + ' de ' + actuals.length + ')' : 'Total registrado (' + actuals.length + ')'}</td><td class="num" data-role="actuals-total" style="font-weight:650;background:var(--surface-2)">${money(shownTotal, currency)}</td>${canWrite ? html`<td style="background:var(--surface-2)"></td>` : null}</tr></tfoot>
          </table></div>`}
        </div>
      </${SectionCard}>

      ${actuals.length ? html`<div class="grid cols-2">
        <${SectionCard} title="Por categoría" subtitle="Total registrado por tipo de costo" attrs=${{ 'data-role': 'by-category' }}>
          <div class="evm-cats">${byCat.map((r) => html`<div class="evm-cat" key=${r.k}>
            <span class="truncate" title=${r.k}>${r.k}</span>
            <span class="evm-bar-track"><span class="evm-bar" style=${'display:block;width:' + (Math.max(0, r.v) / maxCat) * 100 + '%;background:var(--s2)'}></span></span>
            <span class="evm-cat-v">${short(r.v, currency)}<span>${totalAll ? fmt.pct(r.v / totalAll, 0) : '—'}</span></span>
          </div>`)}</div>
        </${SectionCard}>
        <${SectionCard} title="Por mes" subtitle="Costo del mes y acumulado" pad=${false} attrs=${{ 'data-role': 'by-month' }}>
          <div class="table-wrap" style="border:0;border-radius:0 0 var(--r-lg) var(--r-lg)"><table class="table table-tight evm-table">
            <thead><tr><th>Mes</th><th>Costo del mes</th><th class="num">Acumulado</th></tr></thead>
            <tbody>${byMonth.length ? null : html`<tr><td colspan="3" class="faint" style="padding:12px">Ningún registro tiene fecha todavía.</td></tr>`}${byMonth.map((r) => html`<tr key=${r.key} class=${r.after ? 'evm-row-after' : ''}>
              <td class="nowrap">${fmt.date(r.m, 'month')}${r.after ? html`<span class="evm-sub">Posterior al corte</span>` : null}</td>
              <td><div class="evm-bar-cell"><span class="evm-bar-track"><span class="evm-bar" style=${'display:block;width:' + (Math.max(0, r.v) / maxMonth) * 100 + '%;background:var(--s2)'}></span></span><span class="mono xsmall nowrap">${short(r.v, currency)}</span></div></td>
              <td class="num">${money(r.cum, currency)}</td>
            </tr>`)}</tbody>
          </table></div>
        </${SectionCard}>
      </div>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- 4. avance */
  function ProgressTab({ model, canWrite }) {
    const { costs, saveCosts, schedule, saveSchedule, sched, evm, statusDate, currency, tree } = model;
    const latest = useLatest({ costs, schedule });
    const writeCosts = (v) => saveCostsChecked((x) => { latest.current = { ...latest.current, costs: x }; saveCosts(x); }, v, latest.current.costs);
    const updates = costs.statusUpdates || EMPTY_ARR;
    const plan = usePlan(model);
    const [date, setDate] = useState(statusDate);
    const [touched, setTouched] = useState(false);
    const [note, setNote] = useState('');
    const [filter, setFilter] = useState('todas');
    const [q, setQ] = useState('');
    useEffect(() => { if (!touched) setDate(statusDate); }, [statusDate, touched]);
    const planById = useMemo(() => new Map(plan.map((p) => [p.id, p])), [plan]);
    /* estado completo de cada corte (los cortes guardan solo los cambios respecto al anterior) */
    const cuts = useMemo(() => {
      let prev = {};
      return cutStates(updates).map(({ u, full }) => {
        let ev = 0; for (const p of plan) ev += p.cost * PM.clamp(num(full[p.id]), 0, 100) / 100;
        const pv = evm.pvAt(u.date);
        const changed = Object.keys(cutDelta(prev, full)).length; prev = full;
        return { u, ev, pv, spi: pv > 0 ? ev / pv : null, pct: evm.bac ? ev / evm.bac : 0, changed, after: u.date > statusDate };
      });
    }, [updates, plan, evm, statusDate]);
    const rows = useMemo(() => sched.tasks.map((t, i) => {
      const p = planById.get(t.id);
      const planned = p ? PM.calc.plannedFraction(sched.cal, p.start, p.finish, p.milestone, statusDate) : PM.calc.plannedFraction(sched.cal, t.startDate, t.finishDate, t.milestone, statusDate);
      const budget = p ? p.cost : 0;
      return { t, i, planned, budget, ev: budget * t.progress / 100, code: taskCode(t, tree), inPlan: !!p };
    }), [sched, planById, statusDate, tree]);
    const ql = q.trim().toLowerCase();
    const shownRows = rows.filter((r) => (filter === 'todas' || (filter === 'curso' && ((r.t.progress > 0 && r.t.progress < 100) || (r.planned > 0 && r.planned < 1))) || (filter === 'atrasadas' && r.t.progress / 100 < r.planned - 0.005)) && (!ql || (r.code + ' ' + (r.t.name || '')).toLowerCase().includes(ql)));
    const lateCount = rows.filter((r) => r.t.progress / 100 < r.planned - 0.005).length;

    const register = async () => {
      if (!D.valid(date)) { PM.toast('Indica la fecha del corte de avance (día, mes y año).', { tone: 'crit' }); return; }
      const cur = latest.current.costs;
      const list = cur.statusUpdates || [];
      const existing = list.find((u) => u && u.date === date);
      if (existing) {
        const ok = await PM.confirm({ title: 'Reemplazar corte de avance', body: 'Ya hay un corte registrado el ' + fmt.date(date, 'long') + '. ¿Quieres reemplazarlo con el avance actual de las actividades?', confirmText: 'Reemplazar corte' });
        if (!ok) return;
      }
      /* avance vigente al momento de registrar (incluye un % recién confirmado al salir del campo). El corte se agrega como
         estado completo (lo anterior más el avance actual) y la lista se vuelve a codificar: cada corte guarda solo sus
         cambios y los cortes posteriores conservan exactamente lo que registraron. */
      const progress = {}; for (const t of latest.current.schedule.tasks || []) if (t && t.id) progress[t.id] = pctVal(t.progress);
      const now = latest.current.costs;
      const states = cutStates(now.statusUpdates).filter((s) => s.u.date !== date);
      const before = states.filter((s) => s.u.date < date).pop();
      states.push({ u: { id: PM.uid('su'), date, progress, note: note.trim() }, full: { ...(before ? before.full : {}), ...progress } });
      states.sort((a, b) => cmpDate(a.u.date, b.u.date));
      if (!writeCosts({ ...now, statusUpdates: encodeCuts(states, undatedCuts(now.statusUpdates)) })) return;
      setNote('');
      PM.toast('Corte de avance registrado al ' + fmt.date(date, 'long') + '.');
    };
    const removeCut = async (u) => {
      const ok = await PM.confirm({ title: 'Eliminar corte de avance', body: 'Se eliminará el corte del ' + fmt.date(u.date, 'long') + '. La curva del valor ganado se recalculará interpolando entre los cortes restantes.', confirmText: 'Eliminar corte', tone: 'danger' });
      if (!ok) return;
      const now = latest.current.costs;
      if (writeCosts({ ...now, statusUpdates: encodeCuts(cutStates(now.statusUpdates).filter((s) => s.u.id !== u.id), undatedCuts(now.statusUpdates)) })) PM.toast('Corte de avance eliminado.');
    };
    const setProgress = (id, v) => {
      const s = latest.current.schedule;
      const val = PM.clamp(Math.round(num(v) * 10) / 10, 0, 100);
      const next = { ...s, tasks: (s.tasks || []).map((t) => (t.id === id ? { ...t, progress: val } : t)) };
      latest.current = { ...latest.current, schedule: next };
      saveSchedule(next);
    };
    const dateAfter = D.valid(date) && date > statusDate;

    return html`<div class="evm-tabpanel" data-role="progress">
      ${canWrite ? html`<${CapacityNote} costs=${costs} />` : null}
      <${SectionCard} title="Cortes de avance" subtitle="Historial del % completado para la curva del valor ganado" attrs=${{ 'data-role': 'cuts' }}>
        <div class="stack">
          <p class="evm-explain">Un corte congela el % completado de cada actividad en una fecha. Con los cortes se dibuja la curva histórica del valor ganado (EV): entre dos cortes el EV se interpola y en la fecha de corte se usa el avance actual. Actualiza el % de avance de las actividades en la tabla de abajo y luego registra el corte.</p>
          ${canWrite ? html`<form class="evm-form" onSubmit=${(e) => { e.preventDefault(); register(); }}>
            <${ui.Field} label="Fecha del corte" for="evm-cut-date"><${ui.DateInput} id="evm-cut-date" value=${date} onValue=${(v) => { setTouched(true); setDate(v || ''); }} /></${ui.Field}>
            <${ui.Field} label="Nota (opcional)" for="evm-cut-note"><${ui.Input} id="evm-cut-note" value=${note} onValue=${setNote} placeholder="Ej.: montaje niveles 6 a 10 limitado por la grúa del cliente" maxlength="300" /></${ui.Field}>
            <${ui.Button} type="submit" variant="primary" icon="flag" disabled=${!sched.tasks.length}>Registrar corte de avance</${ui.Button}>
          </form>
          ${dateAfter ? html`<div class="evm-chip-row"><${ui.Chip} tone="warn" icon="alert">La fecha es posterior a la fecha de corte (${fmt.date(statusDate)}): el corte no se usará en la curva hasta que avances la fecha de corte.</${ui.Chip}></div>` : null}` : null}
          ${cuts.length ? html`<div class="table-wrap"><table class="table evm-table" data-role="cuts-table">
            <thead><tr><th>Fecha</th><th class="num">Avance físico</th><th class="num">PV a la fecha</th><th class="num">EV del corte</th><th class="num">SPI</th><th class="num" title="Actividades cuyo % de avance cambió respecto al corte anterior">Cambios</th><th>Nota</th>${canWrite ? html`<th><span class="sr-only">Acciones</span></th>` : null}</tr></thead>
            <tbody>${cuts.map((c) => html`<tr key=${c.u.id} data-cut=${c.u.id} class=${c.after ? 'evm-row-after' : ''}>
              <td class="mono nowrap">${fmt.date(c.u.date)}${c.after ? html`<span class="evm-sub">Posterior al corte: no se usa</span>` : null}</td>
              <td class="num">${fmt.pct(c.pct, 1)}</td>
              <td class="num">${money(c.pv, currency)}</td>
              <td class="num" data-role="cut-ev">${money(c.ev, currency)}</td>
              <td class="num"><${IdxChip} value=${c.spi} /></td>
              <td class="num" data-role="cut-changes">${c.changed}</td>
              <td style="min-width:220px">${c.u.note || html`<span class="faint">—</span>`}</td>
              ${canWrite ? html`<td class="ctl"><${ui.IconButton} size="sm" icon="trash" label=${'Eliminar corte del ' + fmt.date(c.u.date)} onClick=${() => removeCut(c.u)} /></td>` : null}
            </tr>`)}</tbody>
          </table></div>` : html`<p class="small faint" data-role="no-cuts">Aún no hay cortes registrados: la curva del valor ganado va en línea recta desde el inicio hasta el avance actual.</p>`}
        </div>
      </${SectionCard}>

      <${SectionCard} title="% de avance por actividad" subtitle=${'Avance físico actual frente al planificado al ' + fmt.date(statusDate, 'long') + (canWrite ? ' · los cambios se guardan en el cronograma' : '')} pad=${false} attrs=${{ 'data-role': 'progress-table' }}>
        <div class="card-body stack">
          <div class="evm-filters">
            <${ui.Segmented} label="Filtrar actividades" value=${filter} onChange=${setFilter} options=${[{ value: 'todas', label: 'Todas (' + rows.length + ')' }, { value: 'curso', label: 'En curso' }, { value: 'atrasadas', label: 'Atrasadas (' + lateCount + ')' }]} />
            <${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar actividad" aria-label="Buscar actividad" />
          </div>
          <div class="table-wrap"><table class=${cx('table evm-table', canWrite && 'table-edit')}>
            <thead><tr><th>Actividad</th><th class="num">% avance</th><th class="num">Planificado al corte</th><th class="num" title="Puntos porcentuales: avance real menos avance planificado">Diferencia</th><th>Fechas del plan</th><th class="num">Presupuesto</th><th class="num">EV</th></tr></thead>
            <tbody>
              ${shownRows.length === 0 ? html`<tr><td colspan="7" class="faint" style="padding:14px 12px">Ninguna actividad coincide con el filtro.</td></tr>` : null}
              ${shownRows.map((r) => {
                const diff = r.t.progress - r.planned * 100;
                const dTone = diff < -10 ? 'crit' : diff < -0.5 ? 'warn' : null;
                const p = planById.get(r.t.id);
                return html`<tr key=${r.t.id} data-task=${r.t.id}>
                  <td class="evm-name"><div>${r.t.name || html`<span class="faint">Actividad sin nombre</span>`}</div><div class="evm-name-sub">${r.code ? html`<span class="code-tag">${r.code}</span>` : null}${r.t.milestone ? html`<${ui.Chip} icon="milestone">Hito</${ui.Chip}>` : null}${!r.inPlan ? html`<${ui.Chip} tone="warn">Fuera de la línea base</${ui.Chip}>` : null}</div></td>
                  <td class="num">${canWrite ? html`<div class="row" style="gap:4px;flex-wrap:nowrap;justify-content:flex-end">
                    <div class="evm-pct-input"><${DeferredNumber} min=${0} max=${100} value=${r.t.progress} data-field="progress" aria-label=${'% de avance de ' + (r.t.name || 'la actividad')} onCommit=${(v) => setProgress(r.t.id, v === null ? 0 : v)} /></div>
                    <${ui.IconButton} size="sm" icon="check" label=${'Marcar «' + (r.t.name || 'actividad') + '» como terminada (100 %)'} disabled=${r.t.progress >= 100} onClick=${() => setProgress(r.t.id, 100)} />
                  </div>` : fmt.pct100(r.t.progress, 1)}</td>
                  <td class="num">${fmt.pct(r.planned, 0)}</td>
                  <td class="num"><span class="evm-diff" style=${dTone ? 'color:' + toneColor(dTone) : ''}>${Math.abs(diff) < 0.05 ? '0' : (diff > 0 ? '+' : '−') + fmt.num(Math.abs(diff), 1)} pp</span></td>
                  <td class="mono xsmall nowrap">${p ? fmt.date(p.start, 'dm') + (p.milestone ? '' : ' – ' + fmt.date(p.finish, 'dm')) : fmt.date(r.t.startDate, 'dm') + ' – ' + fmt.date(r.t.finishDate, 'dm')}</td>
                  <td class="num">${money(r.budget, currency)}</td>
                  <td class="num">${money(r.ev, currency)}</td>
                </tr>`;
              })}
            </tbody>
          </table></div>
        </div>
      </${SectionCard}>
    </div>`;
  }

  /* ---------------------------------------------------------------- 5. presupuesto */
  function controlAccounts(tree, rollup, sched, level) {
    const out = [];
    const direct = new Map();
    for (const t of sched.tasks) if (t.wbsId && tree.byId.has(t.wbsId)) { if (!direct.has(t.wbsId)) direct.set(t.wbsId, []); direct.get(t.wbsId).push(t); }
    for (const f of tree.flat) {
      const id = f.node.id; const r = rollup.get(id);
      if (f.depth === level || (f.depth < level && f.isLeaf)) out.push({ id, code: f.code, name: f.node.name || 'Elemento sin nombre', cost: r ? r.cost : 0, count: r ? r.count : 0 });
      else if (f.depth < level) { const dt = direct.get(id) || []; if (dt.length) out.push({ id: id + ':direct', code: f.code, name: (f.node.name || 'Elemento sin nombre') + ' (actividades asignadas directamente)', cost: PM.sum(dt, (t) => t.cost), count: dt.length }); }
    }
    const none = sched.tasks.filter((t) => !t.wbsId || !tree.byId.has(t.wbsId));
    if (none.length) out.push({ id: '__none', code: '', name: 'Actividades sin elemento de la EDT', cost: PM.sum(none, (t) => t.cost), count: none.length, none: true });
    return out;
  }
  function BudgetStack({ parts, approved, currency }) {
    const tip = PM.useChartTip();
    const total = PM.sum(parts, (p) => Math.max(0, p.value));
    const scaleMax = Math.max(total, approved || 0) || 1;
    const segs = parts.filter((p) => p.value > 0);
    const mPos = approved > 0 ? (approved / scaleMax) * 100 : null;
    return html`<div class="evm-stack" ref=${tip.ref} data-role="budget-stack">
      <div class="evm-stack-bar" style=${'width:' + (total / scaleMax) * 100 + '%'} role="img" aria-label=${'Composición del presupuesto del proyecto: ' + parts.map((p) => p.label + ' ' + short(p.value, currency)).join(', ') + (approved > 0 ? '. Presupuesto aprobado ' + short(approved, currency) : '')}>
        ${segs.map((p) => html`<div key=${p.id} class="evm-stack-seg" style=${'flex:' + p.value + ' 1 0;background:' + p.color}
          onPointerMove=${(e) => tip.show(e, html`<div class="evm-tip"><div class="evm-tip-row"><span class="evm-swatch" style=${'background:' + p.color}></span><span class="evm-tip-lbl">${p.label}</span><strong>${short(p.value, currency)}</strong></div><div class="xsmall evm-tip-foot">${total ? fmt.pct(p.value / total, 1) + ' del presupuesto del proyecto' : ''}</div></div>`)}
          onPointerLeave=${tip.hide}></div>`)}
      </div>
      ${mPos !== null ? html`<span class="evm-stack-mark" style=${'left:' + mPos + '%'} aria-hidden="true"></span>
        <span class="evm-stack-mlabel" style=${mPos > 55 ? 'right:' + (100 - mPos) + '%;margin-right:-1px' : 'left:' + mPos + '%;margin-left:-1px'}>Aprobado ${short(approved, currency)}</span>` : null}
      ${tip.node}
    </div>`;
  }
  function ColumnChart({ data, currency, color, height = 210, label }) {
    const tip = PM.useChartTip();
    const width = useWidth(tip.ref, 560);
    const [hi, setHi] = useState(null);
    const g = useMemo(() => {
      if (!data.length) return null;
      const maxV = Math.max(0, ...data.map((d) => d.value));
      const sc = niceScale(maxV * 1.05 || 1, 4);
      const labels = sc.ticks.map((v) => short(v, currency));
      const M = { l: PM.clamp(Math.ceil(Math.max(...labels.map((s) => s.length)) * 6.4) + 12, 44, 120), r: 8, t: 10, b: 26 };
      const iw = Math.max(data.length * 22, width - M.l - M.r);
      const ih = height - M.t - M.b;
      const band = iw / data.length;
      const bw = Math.min(24, Math.max(6, band * 0.6));
      const y = (v) => M.t + ih - (Math.max(0, v) / sc.top) * ih;
      const W = M.l + iw + M.r;
      /* etiquetas del eje x: el paso sale del ancho de la etiqueta frente al ancho de cada columna (pasos de calendario
         1, 2, 3, 4, 6 o 12); la forma corta («ene 25») solo se usa si permite un paso menor. Cada etiqueta va centrada
         bajo su columna, se ajusta a los bordes del gráfico y se omite si tocaría la anterior. */
      const tw = (s) => String(s || '').length * 6.5 + 10;
      const stepFor = (fn) => { const need = Math.max(...data.map((d) => tw(fn(d)))) / band; return [1, 2, 3, 4, 6, 12, 24, 36, 48, 60].find((n) => n >= need) || Math.ceil(need); };
      const longOf = (d) => d.label;
      const shortOf = (d) => d.short || d.label;
      const everyLong = stepFor(longOf);
      const everyShort = data.some((d) => d.short) ? stepFor(shortOf) : everyLong;
      const labelOf = everyShort < everyLong ? shortOf : longOf;
      const every = Math.min(everyLong, everyShort);
      const xLabels = new Map(); let lastRight = -Infinity;
      data.forEach((d, i) => {
        if (i % every) return;
        const text = labelOf(d); const w = tw(text) - 10; const cx = M.l + band * i + band / 2;
        let anchor = 'middle', tx = cx, x0 = cx - w / 2;
        if (x0 < 2) { anchor = 'start'; tx = 2; x0 = 2; } else if (cx + w / 2 > W - 2) { anchor = 'end'; tx = W - 2; x0 = W - 2 - w; }
        if (x0 < lastRight + 6) return;
        lastRight = x0 + w; xLabels.set(i, { text, anchor, tx });
      });
      return { M, iw, ih, W, band, bw, y, ticks: sc.ticks.map((v, i) => ({ v, y: y(v), label: labels[i] })), xLabels };
    }, [data, width, height, currency]);
    if (!g) return null;
    const M = g.M;
    const col = (x, yTop, w, h) => { const r = Math.min(4, w / 2, h); return 'M' + x + ' ' + (yTop + h) + 'V' + (yTop + r) + 'Q' + x + ' ' + yTop + ' ' + (x + r) + ' ' + yTop + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + yTop + ' ' + (x + w) + ' ' + (yTop + r) + 'V' + (yTop + h) + 'Z'; };
    return html`<div class="chart" ref=${tip.ref}>
      <svg width=${g.W} height=${height} viewBox=${'0 0 ' + g.W + ' ' + height} role="img" aria-label=${label}>
        ${g.ticks.map((t) => html`<g key=${'t' + t.v}><line class="grid-line" x1=${M.l} x2=${M.l + g.iw} y1=${t.y} y2=${t.y} /><text x=${M.l - 8} y=${t.y + 3.5} text-anchor="end">${t.label}</text></g>`)}
        ${data.map((d, i) => {
          const cxm = M.l + g.band * i + g.band / 2; const x0 = cxm - g.bw / 2; const yt = g.y(d.value); const h = M.t + g.ih - yt;
          const xl = g.xLabels.get(i);
          return html`<g key=${d.key}>
            ${h > 0.5 ? html`<path d=${col(x0, yt, g.bw, h)} style=${'fill:' + color + (hi === i ? ';opacity:0.78' : '')} />` : null}
            ${xl ? html`<text x=${xl.tx} y=${height - 9} text-anchor=${xl.anchor} data-role="x-label">${xl.text}</text>` : null}
            <rect class="evm-colhit" x=${M.l + g.band * i} y=${M.t} width=${g.band} height=${g.ih} style="fill:transparent"
              onPointerMove=${(e) => { setHi(i); tip.show(e, d.tip); }} onPointerLeave=${() => { setHi(null); tip.hide(); }} />
          </g>`;
        })}
        <line class="axis-line" x1=${M.l} x2=${M.l + g.iw} y1=${M.t + g.ih} y2=${M.t + g.ih} />
      </svg>
      ${tip.node}
    </div>`;
  }
  function BudgetTab({ model, canWrite, project }) {
    const { costs, saveCosts, sched, tree, rollup, evm, baselines, currency } = model;
    const latest = useLatest(costs);
    const [level, setLevel] = useState(() => PM.clamp(num(PM.prefs.get('evm.level', 1), 1), 1, 3));
    const maxDepth = useMemo(() => tree.flat.reduce((m, f) => Math.max(m, f.depth), 0), [tree]);
    const lv = Math.min(level, Math.max(1, maxDepth));
    const accounts = useMemo(() => controlAccounts(tree, rollup, sched, lv), [tree, rollup, sched, lv]);
    /* las actividades sin elemento de la EDT no forman una cuenta de control: se cuentan aparte */
    const nAccounts = accounts.filter((a) => !a.none).length;
    const noAccount = accounts.find((a) => a.none);
    const res = costs.reserves || {};
    const cur = { bac: PM.sum(sched.tasks, (t) => t.cost), contingency: num(res.contingency), management: num(res.management) };
    cur.baseline = cur.bac + cur.contingency; cur.total = cur.baseline + cur.management;
    const blDoc = baselines.cost;
    const bl = blDoc && blDoc.cost ? (() => { const b = { label: blLabel(blDoc), bac: isNum(blDoc.cost.bac) ? blDoc.cost.bac : PM.sum(blDoc.cost.tasks || [], (t) => t.cost), contingency: num(blDoc.cost.contingency), management: num(blDoc.cost.management) }; b.baseline = b.bac + b.contingency; b.total = b.baseline + b.management; return b; })() : null;
    const approved = num(project.budget, 0) > 0 ? num(project.budget) : null;
    const setReserve = (key, v) => { const c = latest.current; saveCostsChecked((x) => { latest.current = x; saveCosts(x); }, { ...c, reserves: { ...(c.reserves || {}), [key]: Math.max(0, num(v)) } }, c, true); };
    const totalCost = cur.bac;
    const funding = useMemo(() => {
      const ps = evm.planStart, pf = evm.planFinish;
      if (!D.valid(ps) || !D.valid(pf)) return [];
      let prev = 0;
      return monthsBetween(ps, pf).map((m) => { const cum = evm.pvAt(D.endOfMonth(m)); const inc = cum - prev; prev = cum; return { m, inc, cum }; });
    }, [evm]);
    const colData = useMemo(() => funding.map((f) => ({ key: f.m, value: f.inc, label: fmt.date(f.m, 'month'), short: PM.MONTHS[+f.m.slice(5, 7) - 1] + ' ' + f.m.slice(2, 4), tip: html`<div class="evm-tip"><div class="evm-tip-date">${fmt.date(f.m, 'monthLong')}</div><div class="evm-tip-row"><span class="legend-line" style="background:var(--s1)"></span><span class="evm-tip-lbl">Requerido en el mes</span><strong>${short(f.inc, currency)}</strong></div><div class="evm-tip-row"><span></span><span class="evm-tip-lbl">Acumulado</span><strong>${short(f.cum, currency)}</strong></div></div>` })), [funding, currency]);
    const cmp = approved !== null ? cur.total - approved : null;
    const cmpChip = cmp === null
      ? html`<${ui.Chip} tone="outline" icon="info">La ficha del proyecto no tiene presupuesto aprobado</${ui.Chip}><${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => go('ficha')}>Ir a la ficha</${ui.Button}>`
      : zeroish(cmp, currency) ? html`<${ui.Chip} tone="good" icon="check">Coincide con el presupuesto aprobado</${ui.Chip}>`
      : cmp > 0 ? html`<${ui.Chip} tone="crit" icon="alert">El presupuesto del proyecto supera el aprobado en ${money(cmp, currency)}</${ui.Chip}>`
      : html`<${ui.Chip} tone="info" icon="info">Quedan ${money(-cmp, currency)} del presupuesto aprobado sin asignar</${ui.Chip}>`;
    const blDiff = bl ? cur.bac - bl.bac : 0;
    const reserveInput = (key, label) => canWrite
      ? html`<${DeferredNumber} money currency=${currency} min=${0} value=${cur[key]} data-field=${key} aria-label=${label} onCommit=${(v) => setReserve(key, v === null ? 0 : v)} />`
      : money(cur[key], currency);
    const pctOf = (v) => (cur.total > 0 ? fmt.pct(v / cur.total, 1) : '—');
    const lrow = (id, op, label, sub, curCell, blVal, total) => html`<tr key=${id} data-row=${id} class=${total ? 'is-total' : ''}>
      <td class="evm-op">${op}</td>
      <td class="evm-ledger-name">${label}${sub ? html`<span class="evm-sub">${sub}</span>` : null}</td>
      <td class="num" data-col="cur">${curCell}</td>
      ${bl ? html`<td class="num" data-col="bl">${blVal === null ? html`<span class="faint">—</span>` : money(blVal, currency)}</td>` : null}
      <td class="num faint evm-pct">${id === 'approved' ? '' : pctOf(id === 'accounts' || id === 'activities' ? cur.bac : id === 'contingency' ? cur.contingency : id === 'management' ? cur.management : id === 'baseline' ? cur.baseline : cur.total)}</td>
    </tr>`;
    const parts = [
      { id: 'bac', label: 'Presupuesto de las actividades (BAC)', value: cur.bac, color: 'var(--s1)' },
      { id: 'cont', label: 'Reserva para contingencias', value: cur.contingency, color: 'var(--s4)' },
      { id: 'mgmt', label: 'Reserva de gestión', value: cur.management, color: 'var(--s7)' },
    ];
    const maxAcc = Math.max(1, ...accounts.map((a) => Math.abs(a.cost)));
    const exportFunding = () => PM.download('requisitos-financiamiento_' + fileBase(project) + '.csv', PM.toCSV([{ key: 'mes', label: 'Mes' }, { key: 'inc', label: 'Requerido en el mes (' + currency + ')' }, { key: 'cum', label: 'Acumulado (' + currency + ')' }, { key: 'pct', label: '% del BAC' }], funding.map((f) => ({ mes: fmt.date(f.m, 'month'), inc: Math.round(f.inc * 100) / 100, cum: Math.round(f.cum * 100) / 100, pct: evm.bac ? Math.round((f.cum / evm.bac) * 1000) / 10 : '' }))));
    const exportAccounts = () => PM.download('cuentas-de-control_' + fileBase(project) + '.csv', PM.toCSV([{ key: 'code', label: 'Código EDT' }, { key: 'name', label: 'Cuenta de control' }, { key: 'count', label: 'Actividades' }, { key: 'cost', label: 'Costo (' + currency + ')' }, { key: 'pct', label: '% del total' }], accounts.map((a) => ({ ...a, pct: totalCost ? Math.round((a.cost / totalCost) * 1000) / 10 : '' }))));
    const levelOpts = [1, 2, 3].filter((n) => n === 1 || n <= maxDepth).map((n) => ({ value: n, label: 'Nivel ' + n }));

    return html`<div class="evm-tabpanel" data-role="budget">
      <${SectionCard} title="Agregación de costos" subtitle="Componentes del presupuesto del proyecto (Guía del PMBOK®, gráfico 7-8)" pad=${false} attrs=${{ 'data-role': 'ledger' }}>
        <div class="card-body stack">
          <div class="table-wrap"><table class="table evm-ledger">
            <thead><tr><th class="evm-op"><span class="sr-only">Operación</span></th><th>Componente</th><th class="num">Plan vigente</th>${bl ? html`<th class="num">Línea base ${bl.label}</th>` : null}<th class="num evm-pct">% del total</th></tr></thead>
            <tbody>
              ${lrow('activities', '', 'Estimaciones de costos de las actividades', sched.tasks.length + (sched.tasks.length === 1 ? ' actividad del cronograma' : ' actividades del cronograma'), money(cur.bac, currency), bl ? bl.bac : null)}
              ${lrow('accounts', '→', 'Cuentas de control', nAccounts + (nAccounts === 1 ? ' cuenta' : ' cuentas') + ' (EDT nivel ' + lv + '): presupuesto de las actividades, BAC' + (noAccount ? ' · ' + noAccount.count + (noAccount.count === 1 ? ' actividad sin cuenta de control' : ' actividades sin cuenta de control') + (zeroish(noAccount.cost, currency) ? '' : ' (' + money(noAccount.cost, currency) + ')') : ''), money(cur.bac, currency), bl ? bl.bac : null)}
              ${lrow('contingency', '+', 'Reserva para contingencias', 'Para riesgos identificados (incógnitas conocidas)' + (cur.bac > 0 ? ' · ' + fmt.pct(cur.contingency / cur.bac, 1) + ' del BAC' : ''), reserveInput('contingency', 'Reserva para contingencias'), bl ? bl.contingency : null)}
              ${lrow('baseline', '=', 'Línea base de costos', 'BAC + reserva para contingencias', money(cur.baseline, currency), bl ? bl.baseline : null, true)}
              ${lrow('management', '+', 'Reserva de gestión', 'Para trabajo no previsto dentro del alcance (incógnitas desconocidas)' + (cur.bac > 0 ? ' · ' + fmt.pct(cur.management / cur.bac, 1) + ' del BAC' : ''), reserveInput('management', 'Reserva de gestión'), bl ? bl.management : null)}
              ${lrow('total', '=', 'Presupuesto del proyecto', 'Línea base de costos + reserva de gestión', money(cur.total, currency), bl ? bl.total : null, true)}
              ${lrow('approved', '', 'Presupuesto aprobado', 'Ficha del proyecto', approved !== null ? money(approved, currency) : html`<span class="faint">—</span>`, null)}
            </tbody>
          </table></div>
          <div class="evm-chip-row" data-role="budget-compare">${cmpChip}</div>
          ${bl ? html`<div class="evm-chip-row">
            ${zeroish(blDiff, currency) ? null : html`<${ui.Chip} tone="warn" icon="alert">El presupuesto vigente de las actividades difiere de la línea base ${bl.label} en ${signedMoney(blDiff, currency)}. Si el cambio está aprobado, establece una nueva línea base.</${ui.Chip}>`}
            <span class="xsmall faint">El valor ganado se mide contra la línea base ${bl.label}. Los cambios del plan vigente, incluidas las reservas, se incorporan al establecer una nueva línea base mediante el control de cambios.</span>
          </div>` : html`<p class="xsmall faint">Aún no hay línea base de costos: al establecerla se congelan el presupuesto de las actividades y las reservas del plan vigente.</p>`}
          <div class="stack-sm">
            <div class="label-caps">Composición del presupuesto vigente</div>
            <${BudgetStack} parts=${parts} approved=${approved} currency=${currency} />
            <div class="legend">${parts.map((p) => html`<span class="legend-item" key=${p.id}><span class="evm-swatch" style=${'background:' + p.color}></span>${p.label}<span class="evm-legend-v">${short(p.value, currency)}</span></span>`)}${approved !== null ? html`<span class="legend-item"><span class="evm-key-cut" style="background:var(--fg)"></span>Presupuesto aprobado<span class="evm-legend-v">${short(approved, currency)}</span></span>` : null}</div>
          </div>
        </div>
      </${SectionCard}>

      <${SectionCard} title="Cuentas de control" subtitle="Presupuesto vigente de las actividades consolidado por elemento de la EDT" pad=${false} attrs=${{ 'data-role': 'accounts' }} actions=${html`
        ${levelOpts.length > 1 ? html`<${ui.Segmented} label="Nivel de la EDT" value=${lv} onChange=${(v) => { setLevel(Number(v)); PM.prefs.set('evm.level', Number(v)); }} options=${levelOpts} />` : null}
        <${ui.Button} size="sm" icon="download" onClick=${exportAccounts}>Exportar CSV</${ui.Button}>`}>
        <div class="card-body stack">
          ${!tree.nodes.length ? html`<div class="evm-chip-row"><${ui.Chip} tone="outline" icon="info">La EDT está vacía: las actividades no se pueden agrupar en cuentas de control.</${ui.Chip}><${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => go('edt')}>Ir a la EDT</${ui.Button}></div>` : null}
          <div class="table-wrap"><table class="table evm-table">
            <thead><tr><th>Código</th><th>Cuenta de control</th><th class="num">Actividades</th><th class="num">Costo</th><th>% del total</th></tr></thead>
            <tbody>${accounts.map((a) => html`<tr key=${a.id} data-account=${a.id}>
              <td class="mono nowrap">${a.code || html`<span class="faint">—</span>`}</td>
              <td style="min-width:200px">${a.none ? html`<span class="muted">${a.name}</span>` : a.name}</td>
              <td class="num">${a.count}</td>
              <td class="num">${money(a.cost, currency)}</td>
              <td><div class="evm-bar-cell"><span class="evm-bar-track"><span class="evm-bar" style=${'display:block;width:' + (Math.max(0, a.cost) / maxAcc) * 100 + '%;background:var(--s1)'}></span></span><span class="mono xsmall nowrap">${totalCost ? fmt.pct(a.cost / totalCost, 1) : '—'}</span></div></td>
            </tr>`)}</tbody>
            <tfoot><tr><td></td><td>Total</td><td class="num">${sched.tasks.length}</td><td class="num">${money(totalCost, currency)}</td><td>${totalCost ? '100 %' : '—'}</td></tr></tfoot>
          </table></div>
        </div>
      </${SectionCard}>

      <${SectionCard} title="Requisitos de financiamiento" subtitle=${'Valor planificado por mes ' + (evm.fromBaseline ? 'según la línea base ' + blLabel(blDoc) : 'según el cronograma actual')} pad=${false} attrs=${{ 'data-role': 'funding' }} actions=${html`<${ui.Button} size="sm" icon="download" onClick=${exportFunding} disabled=${!funding.length}>Exportar CSV</${ui.Button}>`}>
        <div class="card-body stack">
          <div class="evm-chip-row">
            <${ui.Chip} tone="outline">Línea base de costos: ${money(evm.costBaseline, currency)}</${ui.Chip}>
            <${ui.Chip} tone="outline">Reserva de gestión: ${money(evm.reserves.management, currency)}</${ui.Chip}>
            <${ui.Chip} tone="accent">Financiamiento total: ${money(evm.totalBudget, currency)}</${ui.Chip}>
          </div>
          ${colData.length ? html`<${ColumnChart} data=${colData} currency=${currency} color="var(--s1)" label=${'Financiamiento requerido por mes, de ' + fmt.date(funding[0].m, 'month') + ' a ' + fmt.date(funding[funding.length - 1].m, 'month')} />` : null}
          <div class="table-wrap"><table class="table table-tight evm-table" data-role="funding-table">
            <thead><tr><th>Mes</th><th class="num">Requerido en el mes</th><th class="num">Acumulado</th><th class="num">% del BAC</th></tr></thead>
            <tbody>${funding.map((f) => html`<tr key=${f.m}><td class="nowrap">${fmt.date(f.m, 'month')}</td><td class="num">${money(f.inc, currency)}</td><td class="num">${money(f.cum, currency)}</td><td class="num">${evm.bac ? fmt.pct(f.cum / evm.bac, 1) : '—'}</td></tr>`)}</tbody>
          </table></div>
          <p class="xsmall faint">El flujo mensual cubre el presupuesto de las actividades (BAC). La reserva para contingencias (${money(evm.reserves.contingency, currency)}) y la reserva de gestión se desembolsan cuando se autoriza su uso.</p>
        </div>
      </${SectionCard}>
    </div>`;
  }

  /* ---------------------------------------------------------------- 6. por actividad */
  function activityRows(sched, evm, baselines, actuals, statusDate, tree) {
    const at = statusDate; const cal = sched.cal;
    const plan = planOf(evm, sched, baselines);
    const planById = new Map(plan.map((p) => [p.id, p]));
    const known = new Set([...sched.tasks.map((t) => t.id), ...plan.map((p) => p.id)]);
    const acBy = new Map(); let acNone = 0, acNoneCount = 0;
    for (const a of actuals) {
      if (!a || !D.valid(a.date) || a.date > at) continue;
      if (a.taskId && known.has(a.taskId)) acBy.set(a.taskId, (acBy.get(a.taskId) || 0) + num(a.amount));
      else { acNone += num(a.amount); acNoneCount++; }
    }
    const mk = (id, name, code, milestone, progress, p, flags) => {
      const budget = p ? p.cost : 0;
      const planned = p ? PM.calc.plannedFraction(cal, p.start, p.finish, p.milestone, at) : 0;
      const pv = budget * planned, ev = budget * PM.clamp(num(progress), 0, 100) / 100, ac = acBy.get(id) || 0;
      return { id, name, code, milestone, progress: PM.clamp(num(progress), 0, 100), planned, budget, pv, ev, ac, sv: ev - pv, cv: ev - ac, spi: pv > 0 ? ev / pv : null, cpi: ac > 0 ? ev / ac : null, ...flags };
    };
    const rows = sched.tasks.map((t) => mk(t.id, t.name || 'Actividad sin nombre', taskCode(t, tree), t.milestone, t.progress, planById.get(t.id), { outside: evm.fromBaseline && !planById.has(t.id) }));
    const cur = new Set(sched.tasks.map((t) => t.id));
    for (const p of plan) if (!cur.has(p.id)) rows.push(mk(p.id, p.name || 'Actividad sin nombre', '', p.milestone, 0, p, { deleted: true }));
    return { rows, acNone, acNoneCount };
  }
  const ACT_COLS = [
    { key: 'name', label: 'Actividad' },
    { key: 'budget', label: 'Presupuesto', num: true },
    { key: 'progress', label: '% avance', num: true },
    { key: 'planned', label: '% plan.', title: '% planificado al corte', num: true },
    { key: 'pv', label: 'PV', num: true },
    { key: 'ev', label: 'EV', num: true },
    { key: 'ac', label: 'AC', num: true },
    { key: 'sv', label: 'SV', num: true },
    { key: 'cv', label: 'CV', num: true },
    { key: 'spi', label: 'SPI', num: true },
    { key: 'cpi', label: 'CPI', num: true },
  ];
  function ActivityTab({ model, project }) {
    const { sched, evm, costs, statusDate, currency, tree, baselines } = model;
    const actuals = costs.actuals || EMPTY_ARR;
    const [q, setQ] = useState('');
    const [sort, setSort] = useState({ key: null, dir: 1 });
    const [full, setFull] = useState(() => !!PM.prefs.get('evm.fullValues', false));
    const data = useMemo(() => activityRows(sched, evm, baselines, actuals, statusDate, tree), [sched, evm, baselines, actuals, statusDate, tree]);
    const ql = q.trim().toLowerCase();
    const rows = useMemo(() => {
      let list = data.rows.filter((r) => !ql || (r.code + ' ' + r.name).toLowerCase().includes(ql));
      if (sort.key) {
        const k = sort.key, dir = sort.dir;
        list = [...list].sort((a, b) => {
          const x = a[k], y = b[k];
          if (k === 'name') return String(x).localeCompare(String(y), 'es') * dir;
          const xn = isNum(x), yn = isNum(y);
          if (!xn && !yn) return 0; if (!xn) return 1; if (!yn) return -1;
          return (x - y) * dir;
        });
      }
      return list;
    }, [data, ql, sort]);
    const toggle = (key) => setSort((s) => (s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 }));
    const exportCsv = () => {
      const r2 = (v) => (isNum(v) ? Math.round(v * 100) / 100 : '');
      const r3 = (v) => (isNum(v) ? Math.round(v * 1000) / 1000 : '');
      const cols = [{ key: 'code', label: 'Código EDT' }, { key: 'name', label: 'Actividad' }, { key: 'budget', label: 'Presupuesto (' + currency + ')' }, { key: 'progress', label: '% avance' }, { key: 'planned', label: '% planificado' }, { key: 'pv', label: 'PV' }, { key: 'ev', label: 'EV' }, { key: 'ac', label: 'AC' }, { key: 'sv', label: 'SV' }, { key: 'cv', label: 'CV' }, { key: 'spi', label: 'SPI' }, { key: 'cpi', label: 'CPI' }];
      const out = data.rows.map((r) => ({ code: r.code, name: r.name + (r.deleted ? ' (eliminada del cronograma)' : ''), budget: r2(r.budget), progress: r2(r.progress), planned: r2(r.planned * 100), pv: r2(r.pv), ev: r2(r.ev), ac: r2(r.ac), sv: r2(r.sv), cv: r2(r.cv), spi: r3(r.spi), cpi: r3(r.cpi) }));
      if (data.acNoneCount) out.push({ code: '', name: 'Costos reales sin actividad asignada', budget: '', progress: '', planned: '', pv: '', ev: '', ac: r2(data.acNone), sv: '', cv: '', spi: '', cpi: '' });
      out.push({ code: '', name: 'Total del proyecto', budget: r2(evm.bac), progress: r2(evm.pctComplete * 100), planned: r2(evm.pctPlanned * 100), pv: r2(evm.pv), ev: r2(evm.ev), ac: r2(evm.ac), sv: r2(evm.sv), cv: r2(evm.cv), spi: r3(evm.spi), cpi: r3(evm.cpi) });
      PM.download('desempeno-por-actividad_' + fileBase(project) + '.csv', PM.toCSV(cols, out));
    };
    const sortIcon = (k) => (sort.key === k ? html`<${ui.Icon} name=${sort.dir > 0 ? 'arrow-up' : 'arrow-down'} size=${12} />` : null);
    const m = (v) => (full ? money(v, currency) : html`<span title=${money(v, currency)}>${short(v, currency)}</span>`);
    const compact = !full;
    return html`<div class="evm-tabpanel" data-role="activities">
      <${SectionCard} title="Desempeño por actividad" subtitle=${'Al ' + fmt.date(statusDate, 'long') + ' · presupuesto ' + (evm.fromBaseline ? 'de la línea base ' + blLabel(baselines.cost) : 'del cronograma actual') + ' · AC con los costos reales asignados a cada actividad'} pad=${false} actions=${html`<${ui.Button} size="sm" icon="download" onClick=${exportCsv}>Exportar CSV</${ui.Button}>`}>
        <div class="card-body stack">
          <div class="evm-filters"><${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar actividad o código EDT" aria-label="Buscar actividad" />
            <${ui.Segmented} label="Formato de los valores" value=${full ? 'full' : 'short'} onChange=${(v) => { setFull(v === 'full'); PM.prefs.set('evm.fullValues', v === 'full'); }} options=${[{ value: 'short', label: 'En millones' }, { value: 'full', label: 'Valores completos' }]} />${sort.key ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => setSort({ key: null, dir: 1 })}>Orden del cronograma</${ui.Button}>` : null}</div>
          <div class="table-wrap"><table class="table table-tight evm-table evm-act-table" data-role="activity-table">
            <thead><tr>${ACT_COLS.map((c) => html`<th key=${c.key} class=${c.num ? 'num' : ''} aria-sort=${sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}><button type="button" class="evm-sort" onClick=${() => toggle(c.key)} title=${'Ordenar por ' + (c.title || c.label)}>${c.label}${sortIcon(c.key)}</button></th>`)}</tr></thead>
            <tbody>
              ${rows.length === 0 ? html`<tr><td colspan=${ACT_COLS.length} class="faint" style="padding:14px 12px">Ninguna actividad coincide con la búsqueda.</td></tr>` : null}
              ${rows.map((r) => html`<tr key=${r.id} data-activity=${r.id}>
                <td class="evm-name"><div>${r.name}</div>${r.code || r.milestone || r.outside || r.deleted ? html`<div class="evm-name-sub">${r.code ? html`<span class="code-tag">${r.code}</span>` : null}${r.milestone ? html`<${ui.Chip} icon="milestone">Hito</${ui.Chip}>` : null}${r.outside ? html`<${ui.Chip} tone="warn" title="Se agregó después de la línea base: no tiene presupuesto de línea base">Fuera de la línea base</${ui.Chip}>` : null}${r.deleted ? html`<${ui.Chip} tone="warn" title="Está en la línea base pero ya no en el cronograma: su avance cuenta como 0 %">Eliminada del cronograma</${ui.Chip}>` : null}</div>` : null}</td>
                <td class="num">${m(r.budget)}</td>
                <td class="num">${fmt.pct100(r.progress, 1)}</td>
                <td class="num">${fmt.pct(r.planned, 1)}</td>
                <td class="num">${m(r.pv)}</td>
                <td class="num">${m(r.ev)}</td>
                <td class="num">${m(r.ac)}</td>
                <td class="num"><${MoneyCell} value=${r.sv} currency=${currency} signed compact=${compact} /></td>
                <td class="num"><${MoneyCell} value=${r.cv} currency=${currency} signed compact=${compact} /></td>
                <td class="num"><${IdxChip} value=${r.spi} /></td>
                <td class="num"><${IdxChip} value=${r.cpi} /></td>
              </tr>`)}
              ${data.acNoneCount ? html`<tr data-activity="__none"><td class="evm-name"><span class="muted">Costos reales sin actividad asignada</span><div class="evm-name-sub"><span class="xsmall faint">${data.acNoneCount} ${data.acNoneCount === 1 ? 'registro' : 'registros'}</span></div></td><td class="num faint">—</td><td class="num faint">—</td><td class="num faint">—</td><td class="num faint">—</td><td class="num faint">—</td><td class="num">${m(data.acNone)}</td><td class="num faint">—</td><td class="num faint">—</td><td class="num faint">—</td><td class="num faint">—</td></tr>` : null}
            </tbody>
            <tfoot><tr data-role="totals">
              <td>Total del proyecto</td>
              <td class="num" data-col="budget">${m(evm.bac)}</td>
              <td class="num">${fmt.pct(evm.pctComplete, 1)}</td>
              <td class="num">${fmt.pct(evm.pctPlanned, 1)}</td>
              <td class="num" data-col="pv">${m(evm.pv)}</td>
              <td class="num" data-col="ev">${m(evm.ev)}</td>
              <td class="num" data-col="ac">${m(evm.ac)}</td>
              <td class="num"><${MoneyCell} value=${evm.sv} currency=${currency} signed compact=${compact} /></td>
              <td class="num"><${MoneyCell} value=${evm.cv} currency=${currency} signed compact=${compact} /></td>
              <td class="num"><${IdxChip} value=${evm.spi} /></td>
              <td class="num"><${IdxChip} value=${evm.cpi} /></td>
            </tr></tfoot>
          </table></div>
        </div>
      </${SectionCard}>
    </div>`;
  }

  /* ---------------------------------------------------------------- vista */
  function EvmView({ project, params }) {
    const model = PM.useProjectModel();
    const canWrite = PM.useCanWrite();
    const valid = (id) => TABS.some((t) => t.id === id);
    const [tab, setTab] = useState(() => (valid(params && params.tab) ? params.tab : valid(PM.prefs.get('evm.tab')) ? PM.prefs.get('evm.tab') : 'curva'));
    /* cada PM.navigate crea un objeto params nuevo: se reacciona a cada navegación, aunque repita la pestaña */
    useEffect(() => { if (params && valid(params.tab)) setTab(params.tab); }, [params]);
    const choose = (id) => { setTab(id); PM.prefs.set('evm.tab', id); };
    const p = model.project || project;
    const header = html`<${ui.PageHeader} eyebrow="7.3 Determinar el presupuesto · 7.4 Controlar los costos" title="Curva S y valor ganado"
      description="Mide el desempeño con la técnica del valor ganado: compara el valor planificado (PV), el valor ganado (EV) y el costo real (AC) a la fecha de corte y pronostica el costo y la fecha de terminación." />`;
    if (model.loading || !p) return html`<div class="page">${header}<${ui.Loading} rows=${5} /></div>`;
    const { evm, sched, costs } = model;
    const hasTasks = sched.tasks.length > 0;
    const hasPlan = evm.bac > 0;
    const nAct = (costs.actuals || []).length, nCut = (costs.statusUpdates || []).length;
    const tabs = TABS.map((t) => ({ ...t, count: t.id === 'reales' && nAct ? nAct : t.id === 'avance' && nCut ? nCut : undefined }));
    let body;
    if (['curva', 'indicadores', 'presupuesto', 'actividad'].includes(tab) && !hasPlan) body = html`<${NoPlan} hasTasks=${hasTasks} canWrite=${canWrite} />`;
    else if (tab === 'avance' && !hasTasks) {
      body = html`<${ui.Empty} icon="gantt" title="No hay actividades en el cronograma" actions=${html`<${ui.Button} variant="primary" icon="gantt" onClick=${() => go('cronograma')}>Ir al cronograma</${ui.Button}>`}>
        Los cortes de avance congelan el % completado de cada actividad para dibujar la curva del valor ganado. Crea primero las actividades en el Cronograma.
      </${ui.Empty}>`;
    } else if (tab === 'curva') body = html`<${CurveTab} model=${model} project=${p} onTab=${choose} />`;
    else if (tab === 'indicadores') body = html`<${IndicatorsTab} model=${model} />`;
    else if (tab === 'reales') body = html`<${ActualsTab} model=${model} canWrite=${canWrite} project=${p} />`;
    else if (tab === 'avance') body = html`<${ProgressTab} model=${model} canWrite=${canWrite} />`;
    else if (tab === 'presupuesto') body = html`<${BudgetTab} model=${model} canWrite=${canWrite} project=${p} />`;
    else body = html`<${ActivityTab} model=${model} project=${p} />`;
    return html`<div class="page" data-view="valor-ganado">
      ${header}
      <div class="toolbar evm-topbar">
        <${StatusDateControl} project=${p} />
        <span class="toolbar-sep" aria-hidden="true"></span>
        <${SourceChip} model=${model} canWrite=${canWrite} />
      </div>
      <div class="stack" style="gap:16px">
        <${ui.Tabs} tabs=${tabs} value=${tab} onChange=${choose} />
        <div role="tabpanel" aria-label=${(TABS.find((t) => t.id === tab) || TABS[0]).label} data-tab=${tab}>${body}</div>
      </div>
    </div>`;
  }

  PM.registerView({ id: 'valor-ganado', label: 'Curva S y valor ganado', group: 'costos', icon: 'scurve', order: 10, needsProject: true, component: EvmView, description: 'Curva S, indicadores del valor ganado, costos reales, cortes de avance, presupuesto y requisitos de financiamiento (7.3 / 7.4).' });
})();

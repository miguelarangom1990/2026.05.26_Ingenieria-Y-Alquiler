/* ==========================================================================
   45-agile-backlog.js — Capa ágil (§9.4): Backlog del producto y Tablero
   Kanban. El backlog es la lista priorizada de lo que el producto necesita
   (5.2 Recopilar requisitos / 5.3 Definir el alcance en el enfoque
   adaptativo): se reordena libremente, se refina (estimación y criterios de
   aceptación) y alimenta releases e iteraciones. El tablero visualiza el
   flujo (4.3 Dirigir y gestionar el trabajo), limita el trabajo en curso
   (WIP) y mide tiempo de ciclo, tiempo de entrega y rendimiento.
   Expone PM.agileSettingsDialog(model) y PM.agileItemDialog(model, item, valoresIniciales): ambos trabajan sobre
   el proyecto actual con sus propias suscripciones (model se acepta por compatibilidad).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib || !PM.agile || !PM.useAgileModel) return;
  const { html, useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;
  const A = PM.agile;
  const AG = PM.AGILE;
  const D = PM.date;
  const fmt = PM.fmt;
  const num = PM.num;
  const arr = (x) => (Array.isArray(x) ? x : []);
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const BACKLOG = AG.BACKLOG;
  const NONE = '__none';
  const DONE_LIMIT = 20;

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.agb-note { display: flex; gap: 10px; align-items: flex-start; padding: 9px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); color: var(--fg-2); font-size: var(--fs-sm); min-width: 0; }
.agb-note > .icon { flex: none; margin-top: 2px; color: var(--fg-3); }
.agb-note > .agb-note-body { min-width: 0; flex: 1; max-width: 120ch; }
.agb-note.is-warn { border-color: var(--warn); background: var(--warn-wash); color: var(--fg); }
.agb-note.is-warn > .icon { color: var(--warn); }
.agb-note.is-crit { border-color: var(--crit); background: var(--crit-wash); color: var(--fg); }
.agb-note.is-crit > .icon { color: var(--crit); }
.agb-note.is-info { border-color: var(--info); background: var(--info-wash); color: var(--fg); }
.agb-note.is-info > .icon { color: var(--info); }
.agb-head { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 16px; align-items: start; }
.agb-tiles-card { overflow: hidden; }
.agb-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.agb-tile { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px 13px; min-width: 0; box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.agb-tile-label { font-size: var(--fs-xs); color: var(--fg-2); font-weight: 500; line-height: 1.35; }
.agb-tile-value { font-family: var(--font-display); font-weight: 700; font-size: 1.45rem; line-height: 1.15; font-stretch: 105%; color: var(--fg); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.agb-tile[data-tone="warn"] .agb-tile-value { color: var(--warn); }
.agb-tile[data-tone="crit"] .agb-tile-value { color: var(--crit); }
.agb-tile[data-tone="good"] .agb-tile-value { color: var(--good); }
.agb-tile-sub { font-size: var(--fs-xs); color: var(--fg-3); line-height: 1.35; }
.agb-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.agb-list.is-scroll { max-height: 292px; overflow-y: auto; }
.agb-li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; padding: 8px 16px; border-bottom: 1px solid var(--line); align-items: center; }
.agb-li:last-child { border-bottom: 0; }
.agb-li > .meter, .agb-li > .agb-li-full { grid-column: 1 / -1; }
.agb-li-name { font-weight: 600; font-size: var(--fs-sm); }
.agb-li-num { text-align: right; font-family: var(--font-mono); font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
.agb-card-empty { padding: 14px 16px; font-size: var(--fs-sm); color: var(--fg-3); }
.agb-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.agb-toolbar .search { flex: 1 1 220px; min-width: 0; max-width: 340px; }
.agb-toolbar > .select { width: auto; max-width: 230px; flex: 0 1 auto; }
.agb-toolbar .agb-count { margin-left: auto; }
@media (max-width: 680px) {
  .agb-toolbar .search, .agb-toolbar > .select { flex: 1 1 100%; max-width: none; width: 100%; }
  .agb-toolbar .agb-count { margin-left: 0; }
}
.agb-quick { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.agb-quick .input { flex: 1 1 280px; min-width: 0; max-width: 680px; }
.agb-bulk { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 8px 10px; border: 1px solid var(--accent); background: var(--accent-wash); border-radius: var(--r-md); color: var(--fg); }
.agb-bulk > .select { width: auto; max-width: 240px; flex: 0 1 auto; background-color: var(--surface); }
@media (max-width: 680px) { .agb-bulk > .select { flex: 1 1 100%; max-width: none; width: 100%; } }
.agb-table td { vertical-align: middle; }
.agb-table td.agb-c-title { min-width: 240px; max-width: 460px; white-space: normal; }
.agb-table .agb-c-tight { width: 1%; white-space: nowrap; }
.agb-table td.agb-c-wbs { min-width: 150px; max-width: 240px; white-space: normal; font-size: var(--fs-xs); }
.agb-trunc { display: block; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agb-title { border: 0; background: transparent; padding: 0; margin: 0; text-align: left; color: var(--fg); font: inherit; font-weight: 500; cursor: pointer; line-height: 1.35; overflow-wrap: anywhere; }
.agb-title:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.agb-check { width: 16px; height: 16px; accent-color: var(--accent); margin: 0; vertical-align: middle; cursor: pointer; }
.agb-move { display: flex; gap: 0; flex-wrap: nowrap; align-items: center; }
.agb-grip { cursor: grab; touch-action: none; color: var(--fg-3); }
.agb-row.is-dragging > td { opacity: 0.45; }
.agb-row.agb-drop-before > td { box-shadow: inset 0 3px 0 var(--accent); }
.agb-row.agb-drop-after > td { box-shadow: inset 0 -3px 0 var(--accent); }
.agb-table tbody tr.agb-row.is-sel > td { background: var(--accent-wash); }
.agb-row.is-epic .agb-title { font-weight: 650; }
.agb-sub { font-size: var(--fs-xs); color: var(--fg-3); margin-top: 2px; }
.agb-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.agb-reason { font-size: var(--fs-xs); color: var(--fg-2); margin-top: 2px; max-width: 200px; white-space: normal; }
.agb-table tr.agb-group > th { position: static; background: var(--surface-3); color: var(--fg); font-size: var(--fs-sm); font-weight: 600; text-align: left; white-space: normal; padding: 8px 10px; }
.agb-table td.agb-none { padding: 14px 12px; color: var(--fg-3); }
.agb-est-input { width: 84px; min-height: 28px; padding: 3px 6px; text-align: right; }
body.agb-dragging, body.agb-dragging * { cursor: grabbing !important; user-select: none !important; }
.agb-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
.agb-form > .span-all { grid-column: 1 / -1; }
@media (max-width: 560px) { .agb-form { grid-template-columns: minmax(0, 1fr); } }
.agb-hist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-xs); color: var(--fg-2); }
.agb-hist li { display: flex; gap: 10px; }
.agb-hist .mono { color: var(--fg-3); min-width: 88px; }
.agb-pick { display: flex; flex-direction: column; gap: 2px; max-height: 48vh; overflow-y: auto; border: 1px solid var(--line); border-radius: var(--r-md); padding: 4px; }
.agb-pick-item { display: flex; gap: 10px; align-items: flex-start; padding: 6px 8px; border-radius: var(--r-sm); font-size: var(--fs-sm); cursor: pointer; min-width: 0; }
.agb-pick-item:hover { background: var(--surface-2); }
.agb-pick-item input { margin-top: 3px; }
.agb-pick-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.agk-filters { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: flex-end; }
.agk-filters > .field { flex: 0 1 240px; }
@media (max-width: 680px) { .agk-filters > .field { flex: 1 1 100%; } }
.agk-sprint { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; font-size: var(--fs-sm); color: var(--fg-2); }
.agk-board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr); gap: 12px; overflow-x: auto; padding-bottom: 6px; align-items: start; max-width: 100%; }
@media (max-width: 680px) { .agk-board { grid-auto-columns: minmax(250px, 82vw); } }
.agk-col { display: flex; flex-direction: column; min-width: 0; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-lg); }
.agk-col.is-over { border-color: var(--crit); }
.agk-col.is-drop { border-color: var(--accent); box-shadow: inset 0 0 0 2px var(--accent); }
.agk-col-head { padding: 10px 12px 9px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 3px; border-radius: var(--r-lg) var(--r-lg) 0 0; }
.agk-col.is-over .agk-col-head { background: var(--crit-wash); }
.agk-col-name { font-family: var(--font-body); font-size: var(--fs-sm); font-weight: 650; min-width: 0; overflow-wrap: anywhere; }
.agk-count { font-family: var(--font-mono); font-size: var(--fs-sm); font-weight: 600; color: var(--fg); white-space: nowrap; }
.agk-col.is-over .agk-count { color: var(--crit); }
.agk-wip-alert { display: inline-flex; gap: 6px; align-items: center; font-size: var(--fs-xs); font-weight: 650; color: var(--crit); }
.agk-wip-full { display: inline-flex; gap: 6px; align-items: center; font-size: var(--fs-xs); font-weight: 600; color: var(--warn); }
.agk-list { display: flex; flex-direction: column; gap: 8px; padding: 10px; min-height: 96px; }
@media (min-width: 901px) { .agk-list { max-height: max(420px, calc(100vh - 250px)); overflow-y: auto; } }
.agk-empty { font-size: var(--fs-xs); color: var(--fg-3); padding: 12px 10px; text-align: center; border: 1px dashed var(--line-strong); border-radius: var(--r-md); }
.agk-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 8px 10px 6px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow-card); min-width: 0; }
.agk-card:hover { border-color: var(--line-strong); }
@media (pointer: fine) { .agk-card.is-movable { cursor: grab; user-select: none; } }
.agk-card.is-blocked { border-left: 3px solid var(--crit); }
.agk-card.is-dragging { opacity: 0.45; }
.agk-card-top { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; min-width: 0; }
.agk-est { margin-left: auto; font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg-2); white-space: nowrap; }
.agk-card-title { border: 0; background: transparent; padding: 0; margin: 0; text-align: left; font: inherit; font-size: var(--fs-sm); font-weight: 550; color: var(--fg); cursor: pointer; line-height: 1.35; overflow-wrap: anywhere; }
.agk-card-title:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.agk-blocked { display: flex; gap: 6px; align-items: flex-start; font-size: var(--fs-xs); font-weight: 600; color: var(--crit); overflow-wrap: anywhere; }
.agk-blocked .icon { margin-top: 1px; }
.agk-card-meta { display: flex; justify-content: space-between; gap: 4px 10px; flex-wrap: wrap; font-size: var(--fs-xs); color: var(--fg-2); }
.agk-card-meta .icon { color: var(--fg-3); }
.agk-card-actions { display: flex; gap: 2px; align-items: center; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 4px; }
.agk-ghost { position: fixed; left: 0; top: 0; z-index: 70; pointer-events: none; width: 240px; padding: 8px 10px; background: var(--surface); color: var(--fg); border: 1px solid var(--accent); border-radius: var(--r-md); box-shadow: var(--shadow-pop); font-size: var(--fs-sm); line-height: 1.35; }
.agk-ghost .code-tag { margin-right: 6px; }
.agk-colrows { display: flex; flex-direction: column; }
.agk-colrow { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr) 112px auto auto; gap: 8px 10px; align-items: end; padding: 10px 0; border-bottom: 1px solid var(--line); }
.agk-colrow:first-child { padding-top: 0; }
.agk-colrow-n { padding-bottom: 7px; white-space: nowrap; }
.agk-colrow-act { padding-bottom: 2px; flex-wrap: nowrap; }
@media (max-width: 640px) {
  .agk-colrow { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .agk-colrow > .agk-colrow-name { grid-column: 1 / -1; }
}
`;
  if (!document.getElementById('css-agile-backlog')) {
    const st = document.createElement('style');
    st.id = 'css-agile-backlog';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  /* íconos para «al inicio» y «al final» del backlog */
  if (!PM.ICONS['agb-top']) {
    Object.assign(PM.ICONS, {
      'agb-top': '<path d="M5 4h14"/><path d="M12 20V9"/><path d="m7 13 5-5 5 5"/>',
      'agb-bottom': '<path d="M5 20h14"/><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/>',
    });
  }

  /* ---------------------------------------------------------------- utilidades */
  const TYPE_LABEL = Object.fromEntries(AG.ITEM_TYPES.map((t) => [t.value, t.label]));
  const TYPE_SHORT = { epica: 'Épica', historia: 'Historia', tarea: 'Tarea', defecto: 'Defecto', mejora: 'Mejora', investigacion: 'Investigación' };
  const TYPE_TONE = { epica: 'accent', historia: 'info', tarea: 'outline', defecto: 'crit', mejora: 'good', investigacion: 'signal' };
  const CAT_LABEL = { nuevo: 'Backlog del producto', pendiente: 'Pendiente', 'en-curso': 'En curso', terminado: 'Terminado' };
  const CAT_TONE = { nuevo: 'outline', pendiente: undefined, 'en-curso': 'accent', terminado: 'good' };
  const CAT_OPTIONS = [{ value: 'pendiente', label: 'Pendiente' }, { value: 'en-curso', label: 'En curso' }, { value: 'terminado', label: 'Terminado' }];
  const SPRINT_STATUS = Object.fromEntries(AG.SPRINT_STATUS.map((s) => [s.value, s.label]));
  const RELEASE_STATUS = Object.fromEntries(AG.RELEASE_STATUS.map((s) => [s.value, s.label]));
  const plural = (n, one, many) => fmt.num(n) + ' ' + (n === 1 ? one : many);
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  /* texto de un campo que puede venir con otro tipo en datos importados (n\u00famero, null\u2026) */
  const str = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
  /* etiquetas: arreglo, o texto separado por comas (datos importados) */
  const tagList = (t) => (Array.isArray(t) ? t : typeof t === 'string' ? t.split(',') : []).map((x) => str(x).trim()).filter(Boolean);
  /* l\u00edmite WIP v\u00e1lido (entero positivo) o null: los valores negativos, cero o no num\u00e9ricos de datos importados no limitan */
  const wipOf = (c) => { const n = c && PM.isNum(c.wip) ? Number(c.wip) : 0; return n > 0 ? Math.max(1, Math.round(n)) : null; };
  /* quita entradas consecutivas repetidas del historial (conserva la primera de cada tramo) */
  const collapseHistory = (h) => h.filter((e, i) => i === 0 || !isObj(e) || !isObj(h[i - 1]) || e.status !== h[i - 1].status);
  const hasEst = (it) => !!it && it.estimate !== null && it.estimate !== undefined && it.estimate !== '' && Number.isFinite(Number(it.estimate));
  const hasAcc = (it) => !!String((it && it.acceptance) || '').trim();
  /* refinamiento: trabajo pendiente (no terminado) sin estimación o sin criterios de aceptación */
  const needsRefine = (it, st) => A.countable(it) && !A.isDone(st, it) && (!hasEst(it) || !hasAcc(it));
  const fmtEst = (v, unit) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? '—' : fmt.num(Number(v), 1) + ' ' + unit);
  const statusName = (st, status) => {
    if (!status || status === BACKLOG) return 'Backlog del producto';
    const c = st.columns.find((x) => x.id === status);
    return c ? c.name : 'Backlog del producto';
  };
  const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&'));
  /* firma de un elemento sin el id ni el orden de las claves (para saber si el almacén ya refleja un cambio) */
  const sig = (it) => {
    if (!isObj(it)) return '';
    let s = '';
    for (const k of Object.keys(it).filter((x) => x !== 'id' && it[x] !== undefined).sort()) s += k + '=' + JSON.stringify(it[k]) + ';';
    return s;
  };
  /* texto de búsqueda de un elemento (memorizado por objeto) */
  const hayCache = new WeakMap();
  const hay = (it) => {
    let s = hayCache.get(it);
    if (s === undefined) { s = norm([it.code, it.title, it.description, it.acceptance, it.assignee, it.blockedReason, tagList(it.tags).join(' ')].map(str).join(' ')); hayCache.set(it, s); }
    return s;
  };
  /* fecha de entrada a la columna actual (último tramo continuo del historial en ese estado) */
  const enteredAt = (it) => {
    const h = arr(it.history);
    let d = null, found = false;
    for (let i = h.length - 1; i >= 0; i--) {
      const e = h[i];
      if (!isObj(e) || !D.valid(e.date)) continue;
      if (e.status === it.status) { d = e.date; found = true; } else if (found) break;
    }
    return d || (D.valid(it.createdAt) ? it.createdAt : null);
  };
  const daysIn = (it, today) => { const d = enteredAt(it); return d ? Math.max(0, D.diff(d, today)) : null; };
  /* primer paso a una columna «en curso» (inicio del tiempo de ciclo) */
  const firstStart = (st, it) => { for (const e of arr(it.history)) if (isObj(e) && D.valid(e.date) && A.category(st, e.status) === 'en-curso') return e.date; return null; };
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  /* ---------------------------------------------------------------- componentes pequeños */
  const Note = ({ icon = 'info', tone, children, role }) => html`<div class=${cx('agb-note', tone && 'is-' + tone)} role=${role}><${ui.Icon} name=${icon} size=${16} /><div class="agb-note-body">${children}</div></div>`;
  const Tile = ({ label, value, sub, tone, title, id }) => html`<div class="agb-tile" data-tone=${tone || undefined} title=${title} data-tile=${id}><div class="agb-tile-label">${label}</div><div class="agb-tile-value">${value}</div>${sub ? html`<div class="agb-tile-sub">${sub}</div>` : null}</div>`;
  const TypeChip = ({ type }) => html`<${ui.Chip} tone=${TYPE_TONE[type] || 'info'}>${TYPE_SHORT[type] || 'Historia'}</${ui.Chip}>`;

  /* ---------------------------------------------------------------- datos: actualización optimista y objetos estables */
  const EMPTY_MAP = new Map();
  /* Aplica en pantalla los cambios apenas se guardan (el almacén los confirma después); si la escritura falla,
     el cambio se descarta y el núcleo muestra el aviso de error. */
  function useOptimistic(items, saveItem, deleteItem) {
    const [ov, setOv] = useState(EMPTY_MAP);
    const merged = useMemo(() => {
      if (!ov.size) return items;
      const seen = new Set(); const out = [];
      for (const it of items) { const o = ov.get(it.id); if (o) { seen.add(it.id); if (!o.__deleted) out.push(o); } else out.push(it); }
      for (const [id, o] of ov) if (!seen.has(id) && !o.__deleted) out.push(o);
      return out;
    }, [items, ov]);
    useEffect(() => {
      if (!ov.size) return undefined;
      const byId = new Map(items.map((it) => [it.id, it]));
      let next = null;
      for (const [id, o] of ov) {
        const cur = byId.get(id);
        if (o.__deleted ? !cur : cur && sig(cur) === sig(o)) { if (!next) next = new Map(ov); next.delete(id); }
      }
      if (next) { setOv(next.size ? next : EMPTY_MAP); return undefined; }
      const t = setTimeout(() => setOv(EMPTY_MAP), 8000);
      return () => clearTimeout(t);
    }, [items, ov]);
    const api = useMemo(() => {
      const put = (list) => setOv((m) => { const n = new Map(m); for (const o of list) n.set(o.id, o); return n; });
      const drop = (ids) => setOv((m) => { const n = new Map(m); for (const id of ids) n.delete(id); return n.size ? n : EMPTY_MAP; });
      const saveMany = (list) => {
        const xs = arr(list).filter((x) => isObj(x) && x.id).map((x) => PM.clone(x));
        if (!xs.length) return Promise.resolve();
        put(xs);
        return Promise.all(xs.map((x) => Promise.resolve(saveItem(x)).catch(() => drop([x.id]))));
      };
      const removeMany = (ids) => {
        const xs = arr(ids).filter(Boolean);
        if (!xs.length) return Promise.resolve();
        put(xs.map((id) => ({ id, __deleted: true })));
        return Promise.all(xs.map((id) => Promise.resolve(deleteItem(id)).catch(() => drop([id]))));
      };
      return { saveMany, save: (x) => saveMany([x]), removeMany, remove: (id) => removeMany([id]) };
    }, [saveItem, deleteItem]);
    return { items: merged, ...api };
  }
  /* Conserva la identidad de los elementos que no cambiaron (las filas y tarjetas memorizadas no se vuelven a dibujar). */
  function useStableItems(items) {
    const cache = useRef(new Map());
    return useMemo(() => {
      const prev = cache.current, next = new Map();
      const out = items.map((it) => { const s = JSON.stringify(it); const p = prev.get(it.id); const o = p && p.s === s ? p.o : it; next.set(it.id, { s, o }); return o; });
      cache.current = next;
      return out;
    }, [items]);
  }
  /* Búsquedas por id para mostrar nombres (releases, iteraciones, EDT, épicas, columnas). */
  function useLookups(model, items) {
    const { releases, sprints, tree, approach, settings } = model;
    const epics = useMemo(() => A.sortByRank(items.filter((x) => x.type === 'epica')), [items]);
    const epicSig = epics.map((e) => e.id + '\u0001' + (e.code || '') + '\u0001' + (e.title || '')).join('\u0002');
    const epicMap = useMemo(() => new Map(epics.map((e) => [e.id, { id: e.id, code: e.code || '', title: e.title || '' }])), [epicSig]);
    const lk = useMemo(() => {
      const wbs = new Map();
      for (const f of (tree && tree.flat) || []) wbs.set(f.node.id, { code: f.code, name: f.node.name || 'Sin nombre', approach: (approach && approach.get(f.node.id)) || 'predictivo' });
      return { st: settings, unit: A.unitShort(settings), rel: new Map(releases.map((r) => [r.id, r])), spr: new Map(sprints.map((s) => [s.id, s])), wbs, epics: epicMap, cols: new Map(settings.columns.map((c) => [c.id, c])) };
    }, [settings, releases, sprints, tree, approach, epicMap]);
    return { lk, epics };
  }
  /* Modelo «vivo» para el editor abierto desde otras vistas (PM.agileItemDialog): se suscribe al proyecto actual con
     PM.useAgileModel(), de modo que el código consecutivo se calcula con todos los elementos y el guardado escribe en el
     almacén aunque la vista que lo abre no tenga saveItem (p. ej. si le pasa el resultado de useProjectModel). */
  function liveFromAgileModel(m, items) {
    const saveItem = m.saveItem, deleteItem = m.deleteItem;
    return {
      model: m, items, settings: m.settings, sprints: m.sprints, releases: m.releases,
      save: (x) => saveItem(x), saveMany: (l) => Promise.all(arr(l).map((x) => saveItem(x))),
      remove: (id) => deleteItem(id), removeMany: (ids) => Promise.all(arr(ids).map((id) => deleteItem(id))),
    };
  }
  /* Elimina elementos y limpia las referencias a las épicas eliminadas (sus hijos quedan sin épica). */
  const deleteItems = (L, ids) => {
    const del = new Set(ids);
    const fix = L.items.filter((x) => !del.has(x.id) && x.epicId && del.has(x.epicId)).map((x) => ({ ...x, epicId: null }));
    if (fix.length) L.saveMany(fix);
    L.removeMany([...del]);
    return fix.length;
  };

  /* ---------------------------------------------------------------- editor del elemento */
  const formOf = (it, defaults) => {
    const b = it || { type: 'historia', priority: 'Debería tener', status: BACKLOG, ...(defaults || {}) };
    /* los textos se convierten con str(): un título o responsable numérico (datos importados) no rompe el guardado */
    return {
      type: TYPE_LABEL[b.type] ? b.type : 'historia', code: str(b.code), title: str(b.title), description: str(b.description), acceptance: str(b.acceptance),
      estimate: hasEst(b) ? Number(b.estimate) : null, priority: AG.PRIORITIES.includes(b.priority) ? b.priority : 'Debería tener',
      value: PM.isNum(b.value) ? Number(b.value) : null, status: typeof b.status === 'string' && b.status ? b.status : BACKLOG, wbsId: str(b.wbsId), releaseId: str(b.releaseId),
      sprintId: str(b.sprintId), epicId: str(b.epicId), assignee: str(b.assignee), blocked: !!b.blocked, blockedReason: str(b.blockedReason),
      tags: tagList(b.tags).join(', '), createdAt: D.valid(b.createdAt) ? b.createdAt : D.today(), requirementId: str(b.requirementId),
    };
  };
  /* opción visible para una referencia que ya no existe: así se ve en el editor y se puede quitar eligiendo «Sin …» */
  const orphanOpt = (id, list, label) => (id && !list.some((o) => o.value === id) ? [{ value: id, label }] : []);

  function ItemEditor({ close, getLive, itemId, defaults }) {
    const L0 = useMemo(() => getLive(), []);
    const canWrite = PM.useCanWrite();
    const ro = !canWrite;
    const st = L0.settings;
    const unit = A.unitShort(st);
    const orig = itemId ? L0.items.find((x) => x.id === itemId) || null : null;
    const [f, setF] = useState(() => formOf(orig, defaults));
    const [codeTouched, setCodeTouched] = useState(!!orig);
    const [statusTouched, setStatusTouched] = useState(!orig);
    const [err, setErr] = useState({});
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const code = codeTouched ? f.code : orig ? orig.code || '' : A.nextCode(L0.items, f.type);
    const model = L0.model || {};
    const tree = model.tree, approach = model.approach;
    const wbsOpts = useMemo(() => {
      const ad = [], pr = [];
      for (const fl of (tree && tree.flat) || []) {
        const ap = (approach && approach.get(fl.node.id)) || 'predictivo';
        const o = { value: fl.node.id, label: fl.code + ' ' + (fl.node.name || 'Sin nombre') + (ap === 'adaptativo' ? ' · Ágil' : '') };
        (ap === 'adaptativo' ? ad : pr).push(o);
      }
      return { ad, pr };
    }, []);
    const epics = useMemo(() => A.sortByRank(L0.items.filter((x) => x.type === 'epica' && x.id !== itemId)), []);
    const people = useMemo(() => [...new Set(L0.items.map((x) => String(x.assignee || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), []);
    const releases = L0.releases || [];
    const sprints = L0.sprints || [];
    const relName = (id) => { const r = releases.find((x) => x.id === id); return r ? r.name : ''; };
    const sprint = f.sprintId ? sprints.find((s) => s.id === f.sprintId) : null;
    const wbsKnown = !!f.wbsId && [...wbsOpts.ad, ...wbsOpts.pr].some((o) => o.value === f.wbsId);
    const wbsAp = wbsKnown ? (approach && approach.get(f.wbsId)) || 'predictivo' : null;
    /* opciones de release, iteración y épica (con la referencia huérfana, si la hay, para poder verla y quitarla) */
    const relOpts = releases.map((r) => ({ value: r.id, label: r.name + ' · ' + (RELEASE_STATUS[r.status] || 'Planeado') }));
    const relOrphan = orphanOpt(f.releaseId, relOpts, 'Release no encontrado (' + f.releaseId + ')');
    const sprOpts = sprints.map((s) => ({ value: s.id, label: (s.name || 'Iteración') + ' · ' + (SPRINT_STATUS[s.status] || 'Planeado') + (s.releaseId && relName(s.releaseId) ? ' · ' + relName(s.releaseId) : '') }));
    const sprOrphan = orphanOpt(f.sprintId, sprOpts, 'Iteración no encontrada (' + f.sprintId + ')');
    const epicOpts = epics.map((e) => ({ value: e.id, label: str(e.code) + ' ' + (str(e.title) || 'Sin título') }));
    const epicRef = f.epicId ? L0.items.find((x) => x.id === f.epicId) : null;
    const epicOrphan = orphanOpt(f.epicId, epicOpts, epicRef && epicRef.id !== itemId ? str(epicRef.code) + ' ya no es una épica' : 'Épica no encontrada (' + f.epicId + ')');
    const kidsOf = (items, id) => items.filter((x) => x.id !== id && x.epicId === id);
    const statusOpts = [{ value: BACKLOG, label: 'Backlog del producto' }, ...st.columns.map((c) => ({ value: c.id, label: c.name + ' · ' + CAT_LABEL[c.category] }))];
    if (f.status !== BACKLOG && !st.columns.some((c) => c.id === f.status)) statusOpts.push({ value: f.status, label: 'Columna que ya no existe (' + f.status + ')' });
    const willBeDone = A.category(st, f.status) === 'terminado';

    const busy = useRef(false);
    const submit = async () => {
      if (ro || busy.current) return;
      let L = getLive();
      const title = str(f.title).trim();
      const codeV = str(codeTouched ? f.code : orig ? orig.code : A.nextCode(L.items, f.type)).trim();
      const e = {};
      if (!title) e.title = 'Escribe el título del elemento.';
      if (!codeV) e.code = 'Escribe un código (p. ej. HU-012).';
      else if (L.items.some((x) => x.id !== itemId && str(x.code).toLowerCase() === codeV.toLowerCase())) e.code = 'Ya existe otro elemento con el código ' + codeV + '.';
      if (f.value !== null && (f.value < 1 || f.value > 10)) e.value = 'El valor va de 1 a 10.';
      setErr(e);
      if (Object.keys(e).length) {
        const id = e.title ? 'agb-f-title' : e.code ? 'agb-f-code' : 'agb-f-value';
        setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 0);
        return;
      }
      /* una épica que pasa a otro tipo deja a sus elementos sin épica: se confirma, como al eliminarla */
      const leavesEpic = !!orig && orig.type === 'epica' && f.type !== 'epica';
      let kids = leavesEpic ? kidsOf(L.items, orig.id) : [];
      if (kids.length) {
        busy.current = true;
        const codes = kids.slice(0, 8).map((x) => str(x.code) || 'sin código').join(', ') + (kids.length > 8 ? '…' : '');
        const ok = await PM.confirm({
          title: 'Cambiar el tipo de ' + (str(orig.code) || 'la épica'),
          body: html`<div class="stack-sm"><p>«${str(orig.title) || 'Sin título'}» dejará de ser una épica. ${kids.length === 1 ? 'Su elemento' : 'Sus ' + plural(kids.length, 'elemento', 'elementos')} (${codes}) ${kids.length === 1 ? 'quedará' : 'quedarán'} sin épica; no se eliminan.</p></div>`,
          confirmText: 'Cambiar a ' + (TYPE_LABEL[f.type] || 'otro tipo'),
        });
        busy.current = false;
        if (!ok) return;
        L = getLive();
        kids = kidsOf(L.items, orig.id);
      }
      const items = L.items;
      const today = D.today();
      const cur = orig ? items.find((x) => x.id === orig.id) : null;
      if (orig && !cur) { PM.toast('El elemento se eliminó mientras lo editabas.', { tone: 'crit' }); close(); return; }
      const base = cur ? PM.clone(cur) : { ...A.newItem(items, { type: f.type }), id: PM.uid('bl') };
      const patch = {
        type: f.type, code: codeV, title, description: str(f.description).trim(), acceptance: str(f.acceptance).trim(),
        estimate: f.estimate === null || f.estimate === '' ? null : Math.max(0, Number(f.estimate)),
        priority: f.priority, value: f.value === null ? null : PM.clamp(Math.round(Number(f.value)), 1, 10),
        wbsId: f.wbsId || null, releaseId: f.releaseId || null, sprintId: f.sprintId || null, epicId: f.type === 'epica' ? null : f.epicId || null,
        assignee: str(f.assignee).trim(), blocked: !!f.blocked, blockedReason: f.blocked ? str(f.blockedReason).trim() : '',
        tags: tagList(f.tags), createdAt: D.valid(f.createdAt) ? f.createdAt : base.createdAt || today,
      };
      let next = { ...base, ...patch };
      const req = str(f.requirementId).trim();
      if (req) next.requirementId = req; else delete next.requirementId;
      /* ingreso a una iteración ya iniciada: se registra la fecha (burndown) */
      if ((base.sprintId || null) !== patch.sprintId) {
        const sp = (L.sprints || []).find((s) => s.id === patch.sprintId);
        next.sprintAddedDate = sp && sp.status === 'en-curso' ? today : null;
      }
      const target = statusTouched ? f.status : base.status;
      if (target !== base.status) next = A.withStatus(L.settings, { ...next, status: base.status, doneDate: base.doneDate || null }, target, today);
      if (kids.length) L.saveMany([next, ...kids.map((x) => ({ ...x, epicId: null }))]);
      else L.save(next);
      close();
      PM.toast((orig ? 'Elemento ' + codeV + ' actualizado.' : 'Elemento ' + codeV + ' agregado al backlog.') + (kids.length ? ' ' + plural(kids.length, 'elemento quedó', 'elementos quedaron') + ' sin épica.' : ''));
    };
    const del = async () => {
      const L = getLive();
      const cur = L.items.find((x) => x.id === itemId);
      if (!cur) { close(); return; }
      const kids = cur.type === 'epica' ? L.items.filter((x) => x.epicId === cur.id).length : 0;
      const ok = await PM.confirm({
        title: 'Eliminar ' + (cur.code || 'elemento'),
        body: html`<div class="stack-sm"><p>Se eliminará «${cur.title || 'sin título'}» del backlog del producto${A.isDone(L.settings, cur) ? ' (está terminado: dejará de contar en la velocidad y el avance del release)' : ''}.</p>${kids ? html`<p>Es una épica con ${plural(kids, 'elemento', 'elementos')}: quedarán sin épica, no se eliminan.</p>` : null}<p class="small muted">Esta acción no se puede deshacer.</p></div>`,
        confirmText: 'Eliminar elemento', tone: 'danger',
      });
      if (!ok) return;
      deleteItems(getLive(), [cur.id]);
      close();
      PM.toast('Elemento ' + (cur.code || '') + ' eliminado.');
    };

    if (itemId && !orig) {
      return html`<${ui.Modal} title="Elemento no encontrado" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}><p>El elemento ya no existe: puede que se haya eliminado.</p></${ui.Modal}>`;
    }
    const hist = orig ? arr(orig.history).filter(isObj).slice(-8).reverse() : [];
    const title = orig ? (ro ? 'Detalle de ' : 'Editar ') + (orig.code || 'elemento') : 'Nuevo elemento del backlog';
    const footer = html`
      ${orig && canWrite ? html`<${ui.Button} variant="danger" icon="trash" onClick=${del} style="margin-right:auto">Eliminar</${ui.Button}>` : null}
      <${ui.Button} onClick=${close}>${ro ? 'Cerrar' : 'Cancelar'}</${ui.Button}>
      ${ro ? null : html`<${ui.Button} variant="primary" icon="save" onClick=${submit}>${orig ? 'Guardar cambios' : 'Agregar elemento'}</${ui.Button}>`}`;
    return html`<${ui.Modal} title=${title} subtitle=${orig ? TYPE_LABEL[orig.type] + ' · ' + statusName(st, orig.status) : 'Se agrega al final del backlog; luego puedes reordenarlo.'} onClose=${close} size="wide" footer=${footer}>
      ${ro ? html`<${Note} icon="lock">Modo de solo lectura: puedes consultar el elemento, pero no modificarlo.</${Note}>` : null}
      <form class="agb-form" data-agb-editor="1" onSubmit=${(e) => { e.preventDefault(); submit(); }}>
        <${ui.Field} label="Tipo" for="agb-f-type">
          <${ui.Select} id="agb-f-type" value=${f.type} options=${AG.ITEM_TYPES} onValue=${set('type')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Código" for="agb-f-code" error=${err.code} hint=${orig ? null : 'Se asigna según el tipo; puedes cambiarlo.'}>
          <${ui.Input} id="agb-f-code" class="mono" value=${code} onValue=${(v) => { setCodeTouched(true); set('code')(v); }} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Título" for="agb-f-title" required class="span-all" error=${err.title}>
          <${ui.Input} id="agb-f-title" value=${f.title} onValue=${set('title')} placeholder=${f.type === 'historia' ? 'Como [rol] quiero [objetivo] para [beneficio]' : 'Describe el elemento en una línea'} disabled=${ro} autoFocus />
        </${ui.Field}>
        <${ui.Field} label="Descripción" for="agb-f-desc" class="span-all">
          <${ui.TextArea} id="agb-f-desc" value=${f.description} onValue=${set('description')} rows=${3} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Criterios de aceptación" for="agb-f-acc" class="span-all" hint="Condiciones verificables para darlo por terminado (una por línea; «Dado… cuando… entonces…» si aplica).">
          <${ui.TextArea} id="agb-f-acc" value=${f.acceptance} onValue=${set('acceptance')} rows=${3} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label=${'Estimación (' + unit + ')'} for="agb-f-est" hint=${f.type === 'epica' ? 'Las épicas agrupan: no cuentan en la velocidad ni en el avance.' : f.estimate === null ? 'Sin estimar: aparece en el modo «Refinamiento».' : null}>
          <${ui.NumberInput} id="agb-f-est" value=${f.estimate} min=${0} onValue=${set('estimate')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Prioridad (MoSCoW)" for="agb-f-prio">
          <${ui.Select} id="agb-f-prio" value=${f.priority} options=${AG.PRIORITIES} onValue=${set('priority')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Valor de negocio (1 a 10)" for="agb-f-value" error=${err.value} hint="Opcional; ayuda a ordenar el backlog por valor.">
          <${ui.NumberInput} id="agb-f-value" value=${f.value} min=${1} max=${10} onValue=${set('value')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Estado" for="agb-f-status" hint=${orig && orig.doneDate && A.isDone(st, orig) && f.status === orig.status ? 'Terminado el ' + fmt.date(orig.doneDate) + '.' : willBeDone && (!orig || !A.isDone(st, orig)) ? 'Al guardar se registra la fecha de terminación (hoy).' : null}>
          <${ui.Select} id="agb-f-status" value=${f.status} options=${statusOpts} onValue=${(v) => { setStatusTouched(true); set('status')(v); }} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Release" for="agb-f-rel" hint=${relOrphan.length ? 'El release asignado ya no existe: elige otro o «Sin release».' : !releases.length ? 'Aún no hay releases: créalos en «Releases e iteraciones».' : null}>
          <${ui.Select} id="agb-f-rel" value=${f.releaseId} placeholder="Sin release" options=${[...relOpts, ...relOrphan]} onValue=${set('releaseId')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Iteración" for="agb-f-sprint" hint=${sprOrphan.length ? 'La iteración asignada ya no existe: elige otra o «Sin iteración».' : sprint && sprint.releaseId && f.releaseId && sprint.releaseId !== f.releaseId ? 'Atención: la iteración pertenece a otro release (' + relName(sprint.releaseId) + ').' : sprint && sprint.status === 'en-curso' && (!orig || orig.sprintId !== sprint.id) ? 'La iteración ya inició: se registra como alcance agregado (burndown).' : null}>
          <${ui.Select} id="agb-f-sprint" value=${f.sprintId} placeholder="Sin iteración" options=${[...sprOpts, ...sprOrphan]}
            onValue=${(v) => setF((x) => { const sp = sprints.find((s) => s.id === v); return { ...x, sprintId: v, releaseId: !x.releaseId && sp && sp.releaseId ? sp.releaseId : x.releaseId }; })} disabled=${ro} />
        </${ui.Field}>
        ${f.type !== 'epica' ? html`<${ui.Field} label="Épica" for="agb-f-epic" hint=${epicOrphan.length ? 'La épica asignada ya no existe o cambió de tipo: elige otra o «Sin épica».' : !epics.length ? 'No hay épicas: crea una con el tipo «Épica» para agrupar elementos.' : null}>
          <${ui.Select} id="agb-f-epic" value=${f.epicId} placeholder="Sin épica" options=${[...epicOpts, ...epicOrphan]} onValue=${set('epicId')} disabled=${ro} />
        </${ui.Field}>` : html`<div></div>`}
        <${ui.Field} label="Entregable de la EDT" for="agb-f-wbs" hint=${f.wbsId && !wbsKnown ? 'El entregable asignado ya no existe en la EDT: elige otro o «Sin entregable».' : !wbsOpts.ad.length && !wbsOpts.pr.length ? 'La EDT no tiene entregables todavía.' : wbsAp === 'adaptativo' ? 'Entregable con enfoque adaptativo (ágil).' : wbsAp === 'predictivo' ? 'Entregable con enfoque predictivo: su avance se controla en el cronograma. El enfoque se cambia en la EDT.' : 'Los entregables con enfoque adaptativo aparecen primero.'}>
          <select id="agb-f-wbs" class="select" value=${f.wbsId} onChange=${(e) => set('wbsId')(e.currentTarget.value)} disabled=${ro}>
            <option value="">Sin entregable</option>
            ${wbsOpts.ad.length ? html`<optgroup label="Enfoque adaptativo (ágil)">${wbsOpts.ad.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</optgroup>` : null}
            ${wbsOpts.pr.length ? html`<optgroup label="Enfoque predictivo">${wbsOpts.pr.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</optgroup>` : null}
            ${f.wbsId && !wbsKnown ? html`<option value=${f.wbsId}>${'Entregable no encontrado (' + f.wbsId + ')'}</option>` : null}
          </select>
        </${ui.Field}>
        <${ui.Field} label="Responsable" for="agb-f-who">
          <${ui.Input} id="agb-f-who" value=${f.assignee} onValue=${set('assignee')} list="agb-people" placeholder="Rol o persona" disabled=${ro} />
          <datalist id="agb-people">${people.map((p) => html`<option key=${p} value=${p}></option>`)}</datalist>
        </${ui.Field}>
        <${ui.Field} label="Creado el" for="agb-f-created">
          <${ui.DateInput} id="agb-f-created" value=${f.createdAt} onValue=${set('createdAt')} disabled=${ro} />
        </${ui.Field}>
        <div class="field">
          <span class="field-label">Bloqueo</span>
          <${ui.Check} checked=${f.blocked} onValue=${set('blocked')} label="Elemento bloqueado" disabled=${ro} />
        </div>
        <${ui.Field} label="Motivo del bloqueo" for="agb-f-reason">
          <${ui.Input} id="agb-f-reason" value=${f.blockedReason} onValue=${set('blockedReason')} placeholder=${f.blocked ? 'Qué lo impide y quién lo resuelve' : 'Solo si está bloqueado'} disabled=${ro || !f.blocked} />
        </${ui.Field}>
        <${ui.Field} label="Etiquetas" for="agb-f-tags" hint="Separadas por comas.">
          <${ui.Input} id="agb-f-tags" value=${f.tags} onValue=${set('tags')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Requisito relacionado" for="agb-f-req" hint="Código en la documentación de requisitos o la matriz de trazabilidad (opcional).">
          <${ui.Input} id="agb-f-req" value=${f.requirementId} onValue=${set('requirementId')} placeholder="REQ-012" disabled=${ro} />
        </${ui.Field}>
        ${hist.length ? html`<div class="span-all stack-sm">
          <div class="h4">Historial de estados</div>
          <ul class="agb-hist">${hist.map((h, i) => html`<li key=${i}><span class="mono">${fmt.date(h.date)}</span><span>${statusName(st, h.status)}</span></li>`)}</ul>
        </div>` : null}
        <button type="submit" class="sr-only" tabindex="-1" aria-hidden="true">Guardar</button>
      </form>
    </${ui.Modal}>`;
  }
  const openItemEditor = (getLive, itemId, defaults) => PM.openModal((close) => html`<${ItemEditor} close=${close} getLive=${getLive} itemId=${itemId || null} defaults=${defaults || null} />`);
  /* Editor de un elemento del backlog para otras vistas: PM.agileItemDialog(model, item|null, valoresIniciales) */
  /* El editor externo se suscribe al proyecto actual (PM.useAgileModel) y espera a que cargue el backlog: el código se
     asigna con todos los elementos y el guardado escribe el documento del elemento. */
  function ExternalItemEditor({ close, itemId, defaults }) {
    const m = PM.useAgileModel();
    /* el backlog se lee directamente (la suscripción se comparte con el modelo): también en un proyecto predictivo */
    const { docs, loading } = PM.useCollection(m.pid ? PM.paths.backlog(m.pid) : null);
    const items = useMemo(() => docs.filter((d) => isObj(d.data)).map((d) => ({ ...d.data, id: d.id })), [docs]);
    const live = useRef(null);
    live.current = liveFromAgileModel(m, items);
    const getLive = useCallback(() => live.current, []);
    const ready = useRef(false);
    if (!m.loading && !loading) ready.current = true;
    const title = itemId ? 'Elemento del backlog' : 'Nuevo elemento del backlog';
    if (!ready.current) return html`<${ui.Modal} title=${title} onClose=${close}><${ui.Loading} /></${ui.Modal}>`;
    if (!m.pid) return html`<${ui.Modal} title=${title} onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}><p>Abre un proyecto para consultar o agregar elementos de su backlog.</p></${ui.Modal}>`;
    return html`<${ItemEditor} close=${close} getLive=${getLive} itemId=${itemId} defaults=${defaults} />`;
  }
  /* PM.agileItemDialog(model, item|null, valoresIniciales): trabaja sobre el proyecto actual; model se acepta por
     compatibilidad (puede ser el de useProjectModel o el de useAgileModel) y no se usa para guardar. */
  PM.agileItemDialog = (model, item, defaults) => PM.openModal((close) => html`<${ExternalItemEditor} close=${close} itemId=${item && item.id ? item.id : null} defaults=${defaults || null} />`);

  /* ---------------------------------------------------------------- configuración ágil */
  const FRAMEWORK_HINT = {
    scrum: 'Iteraciones de duración fija con planificación, revisión y retrospectiva. El tablero muestra por defecto la iteración en curso.',
    kanban: 'Flujo continuo con límites WIP. El tablero muestra todo el flujo; se miden tiempo de ciclo y rendimiento.',
    'scrum-kanban': 'Iteraciones de Scrum con tablero Kanban y límites WIP. El tablero muestra por defecto la iteración en curso.',
  };
  function SettingsDialog({ close }) {
    const canWrite = PM.useCanWrite();
    const pid = PM.useAppState().projectId;
    const [data, , meta] = PM.useToolData('agile', PM.EMPTY.agile);
    /* elementos del backlog del proyecto actual (para advertir cuántas estimaciones quedan en la unidad anterior) */
    const { docs, loading } = PM.useCollection(pid ? PM.paths.backlog(pid) : null);
    const items = useMemo(() => docs.filter((d) => isObj(d.data)).map((d) => d.data), [docs]);
    if (meta.loading || loading) return html`<${ui.Modal} title="Configuración ágil" onClose=${close}><${ui.Loading} /></${ui.Modal}>`;
    return html`<${SettingsForm} close=${close} items=${items} data=${data} saveNow=${meta.saveNow} canWrite=${canWrite} />`;
  }
  function SettingsForm({ close, items, data, saveNow, canWrite }) {
    const st = A.settings(data);
    const [f, setF] = useState(() => ({ framework: st.framework, estimationUnit: st.estimationUnit, sprintLength: st.sprintLength, scopeChangeThreshold: st.scopeChangeThreshold }));
    const [err, setErr] = useState({});
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const ro = !canWrite;
    const estimated = arr(items).filter((i) => A.countable(i) && hasEst(i)).length;
    const unitChanged = f.estimationUnit !== st.estimationUnit;
    const submit = () => {
      if (ro) return;
      const e = {};
      if (!PM.isNum(f.sprintLength) || f.sprintLength < 1 || f.sprintLength > 60) e.sprintLength = 'Escribe un número de 1 a 60 días hábiles.';
      if (!PM.isNum(f.scopeChangeThreshold) || f.scopeChangeThreshold < 0 || f.scopeChangeThreshold > 100) e.scopeChangeThreshold = 'Escribe un porcentaje de 0 a 100.';
      setErr(e);
      if (Object.keys(e).length) return;
      const base = isObj(data.settings) ? PM.clone(data.settings) : {};
      const settings = { ...base, framework: f.framework, estimationUnit: f.estimationUnit, sprintLength: Math.round(Number(f.sprintLength)), scopeChangeThreshold: Number(f.scopeChangeThreshold), columns: PM.clone(st.columns) };
      saveNow({ ...PM.clone(data), settings });
      close();
      PM.toast('Configuración ágil guardada.' + (unitChanged && estimated ? ' Las estimaciones existentes no se convirtieron.' : ''));
    };
    const footer = html`<${ui.Button} onClick=${close}>${ro ? 'Cerrar' : 'Cancelar'}</${ui.Button}>${ro ? null : html`<${ui.Button} variant="primary" icon="save" onClick=${submit}>Guardar configuración</${ui.Button}>`}`;
    return html`<${ui.Modal} title="Configuración ágil" subtitle="Se aplica al backlog, al tablero y a las iteraciones de este proyecto." onClose=${close} footer=${footer}>
      ${ro ? html`<${Note} icon="lock">Modo de solo lectura.</${Note}>` : null}
      <form class="stack" data-agb-settings="1" onSubmit=${(e) => { e.preventDefault(); submit(); }}>
        <${ui.Field} label="Marco de trabajo" for="agb-s-fw" hint=${FRAMEWORK_HINT[f.framework]}>
          <${ui.Select} id="agb-s-fw" value=${f.framework} options=${AG.FRAMEWORKS} onValue=${set('framework')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Unidad de estimación" for="agb-s-unit">
          <${ui.Select} id="agb-s-unit" value=${f.estimationUnit} options=${AG.UNITS} onValue=${set('estimationUnit')} disabled=${ro} />
        </${ui.Field}>
        ${unitChanged ? html`<${Note} tone="warn" icon="alert" role="status">Cambiar la unidad no convierte las estimaciones: ${estimated ? html`los <strong>${plural(estimated, 'elemento estimado', 'elementos estimados')}</strong> conservan sus números y se leerán en ${f.estimationUnit === 'horas' ? 'horas' : 'puntos de historia'}. Vuelve a estimarlos si hace falta; la velocidad y los pronósticos de iteraciones anteriores quedan en la unidad anterior.` : 'aún no hay elementos estimados, así que no hay nada que revisar.'}</${Note}>` : null}
        <${ui.Field} label="Duración de la iteración (días hábiles)" for="agb-s-len" error=${err.sprintLength} hint="Se usa para generar iteraciones y pronosticar la terminación (2 semanas = 10 días hábiles).">
          <${ui.NumberInput} id="agb-s-len" value=${f.sprintLength} min=${1} max=${60} onValue=${set('sprintLength')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Umbral de cambio de alcance (%)" for="agb-s-thr" error=${err.scopeChangeThreshold} hint="Si el alcance de un release comprometido varía más que este porcentaje frente a su línea base, o cambian su fecha o su presupuesto, se requiere solicitud de cambio (4.6).">
          <${ui.NumberInput} id="agb-s-thr" value=${f.scopeChangeThreshold} min=${0} max=${100} onValue=${set('scopeChangeThreshold')} disabled=${ro} />
        </${ui.Field}>
        <button type="submit" class="sr-only" tabindex="-1" aria-hidden="true">Guardar</button>
      </form>
    </${ui.Modal}>`;
  }
  /* Abre la configuración ágil (marco, unidad, duración de la iteración y umbral de cambio) desde cualquier vista. */
  PM.agileSettingsDialog = () => PM.openModal((close) => html`<${SettingsDialog} close=${close} />`);

  /* ---------------------------------------------------------------- vista: Backlog del producto */
  const NO_FILTERS = Object.freeze({ q: '', type: '', release: '', epic: '', status: '', wbs: '' });

  function EstInput({ it, unit, api }) {
    const cur = hasEst(it) ? Number(it.estimate) : null;
    const [v, setV] = useState(cur);
    useEffect(() => { setV(cur); }, [cur]);
    const commit = () => { if (v !== cur) api.setEstimate(it.id, v); };
    return html`<${ui.NumberInput} class="agb-est-input" value=${v} min=${0} onValue=${setV} onBlur=${commit} aria-label=${'Estimación de ' + (it.code || 'elemento') + ' (' + unit + ')'}
      onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />`;
  }

  const BacklogRow = PM.memo(function BacklogRow({ it, pos, lk, sel, canWrite, first, last, top, bottom, drop, dragging, refine, group, api }) {
    const unit = lk.unit;
    const rel = it.releaseId ? lk.rel.get(it.releaseId) : null;
    const spr = it.sprintId ? lk.spr.get(it.sprintId) : null;
    const wbs = it.wbsId ? lk.wbs.get(it.wbsId) : null;
    const epic = it.epicId ? lk.epics.get(it.epicId) : null;
    const cat = A.category(lk.st, it.status);
    const code = it.code || 'elemento';
    const missing = html`<span class="faint" title="La referencia ya no existe">No encontrado</span>`;
    return html`<tr data-agb-row=${it.id} data-group=${group} class=${cx('agb-row', drop && 'agb-drop-' + drop, dragging && 'is-dragging', it.type === 'epica' && 'is-epic', sel && 'is-sel')}>
      ${canWrite ? html`<td class="agb-c-tight"><input type="checkbox" class="agb-check" checked=${sel} aria-label=${'Seleccionar ' + code} onChange=${(e) => api.toggle(it.id, e.currentTarget.checked)} /></td>` : null}
      <td class="num mono agb-c-tight">${pos}</td>
      ${canWrite ? html`<td class="agb-c-tight"><div class="agb-move">
        <button type="button" class="btn btn-ghost btn-sm btn-icon agb-grip" data-act="grip" aria-label=${'Reordenar ' + code + ': arrastra o usa las flechas arriba y abajo (Inicio y Fin lo llevan a los extremos)'} title="Arrastra para reordenar o usa las flechas del teclado"
          onPointerDown=${(e) => api.dragStart(e, it.id)} onKeyDown=${(e) => api.gripKey(e, it.id)}><${ui.Icon} name="grip" size=${14} /></button>
        <${ui.IconButton} size="sm" icon="chevron-up" data-act="up" label=${'Subir ' + code} disabled=${first} onClick=${() => api.moveBy(it.id, -1, 'up')} />
        <${ui.IconButton} size="sm" icon="chevron-down" data-act="down" label=${'Bajar ' + code} disabled=${last} onClick=${() => api.moveBy(it.id, 1, 'down')} />
        <${ui.IconButton} size="sm" icon="agb-top" data-act="top" label=${'Mover ' + code + ' al inicio del backlog'} disabled=${top} onClick=${() => api.moveEdge(it.id, true, 'top')} />
        <${ui.IconButton} size="sm" icon="agb-bottom" data-act="bottom" label=${'Mover ' + code + ' al final del backlog'} disabled=${bottom} onClick=${() => api.moveEdge(it.id, false, 'bottom')} />
      </div></td>` : null}
      <td class="agb-c-tight"><span class="code-tag">${it.code || '—'}</span></td>
      <td class="agb-c-tight"><${TypeChip} type=${it.type} /></td>
      <td class="agb-c-title">
        <button type="button" class="agb-title" data-act="open" onClick=${() => api.open(it.id)}>${it.title || html`<span class="faint">Sin título</span>`}</button>
        ${epic ? html`<div class="agb-sub">Épica <span class="mono">${epic.code}</span> · ${epic.title}</div>` : null}
        ${refine && needsRefine(it, lk.st) ? html`<div class="agb-badges">${!hasEst(it) ? html`<${ui.Chip} tone="warn" icon="alert">Sin estimar</${ui.Chip}>` : null}${!hasAcc(it) ? html`<${ui.Chip} tone="warn" icon="alert">Sin criterios de aceptación</${ui.Chip}>` : null}</div>` : null}
      </td>
      <td class="num agb-c-tight">${refine && canWrite && needsRefine(it, lk.st) ? html`<${EstInput} it=${it} unit=${unit} api=${api} />` : fmtEst(it.estimate, unit)}</td>
      <td class="agb-c-tight">${it.priority || '—'}</td>
      <td class="num agb-c-tight">${PM.isNum(it.value) ? fmt.num(Number(it.value)) : '—'}</td>
      <td><span class="agb-trunc" title=${rel ? rel.name : ''}>${it.releaseId ? (rel ? rel.name : missing) : html`<span class="faint">—</span>`}</span></td>
      <td><span class="agb-trunc" title=${spr ? spr.name : ''}>${it.sprintId ? (spr ? spr.name : missing) : html`<span class="faint">—</span>`}</span></td>
      <td class="agb-c-wbs">${it.wbsId ? (wbs ? html`<span class="mono">${wbs.code}</span> ${wbs.name}${wbs.approach === 'adaptativo' ? html` <${ui.Chip} tone="accent">Ágil</${ui.Chip}>` : null}` : missing) : html`<span class="faint">—</span>`}</td>
      <td class="agb-c-tight"><${ui.Chip} tone=${CAT_TONE[cat]}>${statusName(lk.st, it.status)}</${ui.Chip}></td>
      <td><span class="agb-trunc" title=${it.assignee || ''}>${it.assignee || html`<span class="faint">—</span>`}</span></td>
      <td class="agb-c-tight">${it.blocked ? html`<${ui.Chip} tone="crit" icon="lock">Bloqueado</${ui.Chip}>${it.blockedReason ? html`<div class="agb-reason">${it.blockedReason}</div>` : null}` : html`<span class="faint">—</span>`}</td>
    </tr>`;
  });

  function BacklogView({ project }) {
    const model = PM.useAgileModel();
    const canWrite = PM.useCanWrite();
    const st = model.settings, unit = model.unit;
    const opt = useOptimistic(model.items, model.saveItem, model.deleteItem);
    const items = useStableItems(opt.items);
    const sorted = useMemo(() => A.sortByRank(items), [items]);
    const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
    const { lk, epics } = useLookups(model, items);
    const posMap = useMemo(() => new Map(sorted.map((it, i) => [it.id, i + 1])), [sorted]);
    const [f, setF] = useState(NO_FILTERS);
    const [refine, setRefine] = useState(false);
    const [grouped, setGroupedRaw] = useState(() => !!PM.prefs.get('agileBacklogGrouped', false));
    const setGrouped = (v) => { setGroupedRaw(v); PM.prefs.set('agileBacklogGrouped', v); };
    const [sel, setSel] = useState(() => new Set());
    const [dragId, setDragId] = useState(null);
    const [drop, setDrop] = useState(null);
    const [say, setSay] = useState('');
    const [quick, setQuick] = useState('');
    const pending = useRef(null);
    const drag = useRef(null);
    const allRef = useRef(null);
    const setFilter = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const anyFilter = refine || Object.keys(NO_FILTERS).some((k) => f[k]);

    /* filtros */
    const q = norm(f.q.trim());
    const visible = useMemo(() => sorted.filter((it) => {
      if (f.type && it.type !== f.type) return false;
      if (f.release === NONE) { if (it.releaseId && lk.rel.has(it.releaseId)) return false; } else if (f.release && it.releaseId !== f.release) return false;
      if (f.epic === NONE) { if (it.type === 'epica' || (it.epicId && lk.epics.has(it.epicId))) return false; } else if (f.epic && it.epicId !== f.epic && it.id !== f.epic) return false;
      if (f.status === BACKLOG) { if (A.category(st, it.status) !== 'nuevo') return false; } else if (f.status && it.status !== f.status) return false;
      if (f.wbs === NONE) { if (it.wbsId && lk.wbs.has(it.wbsId)) return false; } else if (f.wbs && it.wbsId !== f.wbs) return false;
      if (refine && !needsRefine(it, st)) return false;
      if (q && !hay(it).includes(q)) return false;
      return true;
    }), [sorted, f, refine, q, lk, st]);

    /* agrupación por épica */
    const groups = useMemo(() => {
      if (!grouped) return [{ key: 'all', epic: null, rows: visible }];
      const by = new Map(epics.map((e) => [e.id, []]));
      const none = [];
      const vis = new Set();
      for (const it of visible) { vis.add(it.id); if (it.type === 'epica') continue; if (it.epicId && by.has(it.epicId)) by.get(it.epicId).push(it); else none.push(it); }
      const out = [];
      for (const e of epics) { const rows = by.get(e.id); if (rows.length || vis.has(e.id)) out.push({ key: e.id, epic: e, rows }); }
      if (none.length) out.push({ key: NONE, epic: null, rows: none });
      return out;
    }, [grouped, visible, epics]);

    /* indicadores */
    const stats = useMemo(() => {
      const cnt = items.filter(A.countable);
      const sum = (l) => l.reduce((s, i) => s + A.estimate(i), 0);
      const done = cnt.filter((i) => A.isDone(st, i));
      const relIds = new Set(model.releases.map((r) => r.id));
      const perRel = model.releases.map((r) => { const l = cnt.filter((i) => i.releaseId === r.id); return { id: r.id, name: r.name || 'Release', status: r.status, count: l.length, total: sum(l), done: sum(l.filter((i) => A.isDone(st, i))) }; });
      const noRel = cnt.filter((i) => !i.releaseId || !relIds.has(i.releaseId));
      if (noRel.length) perRel.push({ id: NONE, name: 'Sin release', status: null, count: noRel.length, total: sum(noRel), done: sum(noRel.filter((i) => A.isDone(st, i))) });
      const open = cnt.filter((i) => !A.isDone(st, i));
      return { n: cnt.length, epics: items.length - cnt.length, done: done.length, total: sum(cnt), totalDone: sum(done), unest: open.filter((i) => !hasEst(i)).length, noAcc: open.filter((i) => !hasAcc(i)).length, blocked: open.filter((i) => i.blocked).length, refine: open.filter((i) => needsRefine(i, st)).length, perRel };
    }, [items, st, model.releases]);
    const epicStats = useMemo(() => {
      const m = new Map(epics.map((e) => [e.id, { n: 0, done: 0, est: 0, estDone: 0 }]));
      for (const it of items) {
        if (!A.countable(it) || !it.epicId) continue;
        const s = m.get(it.epicId); if (!s) continue;
        const e = A.estimate(it); s.n++; s.est += e;
        if (A.isDone(st, it)) { s.done++; s.estDone += e; }
      }
      return m;
    }, [items, epics, st]);

    /* selección (solo ids que siguen existiendo) */
    const selIds = useMemo(() => [...sel].filter((id) => byId.has(id)), [sel, byId]);
    /* filas realmente dibujadas (al agrupar por épica, las épicas son encabezados y no filas seleccionables) */
    const visIds = useMemo(() => groups.flatMap((g) => g.rows.map((x) => x.id)), [groups]);
    const nSelVis = useMemo(() => visIds.reduce((n, id) => n + (sel.has(id) ? 1 : 0), 0), [visIds, sel]);
    const nSelHidden = selIds.length - nSelVis;

    const live = useRef(null);
    live.current = { model, items, sorted, groups, byId, settings: st, sprints: model.sprints, releases: model.releases, save: opt.save, saveMany: opt.saveMany, remove: opt.remove, removeMany: opt.removeMany, canWrite, project, unit };
    const getLive = useCallback(() => live.current, []);

    /* reordenar: calcula el rango entre los vecinos y guarda solo el elemento movido */
    const api = useMemo(() => {
      const placeAt = (id, rest, idx) => {
        const L = live.current;
        const it = L.byId.get(id); if (!it) return false;
        const before = rest[idx - 1] || null, after = rest[idx] || null;
        const r = A.rankBetween(before, after);
        const ok = Number.isFinite(r) && (!before || r > num(before.rank, 0)) && (!after || r < num(after.rank, 0));
        if (ok) { if (num(it.rank, NaN) !== r) L.save({ ...it, rank: r }); }
        else {
          /* rangos repetidos o agotados (datos importados): se renumera el backlog completo una sola vez */
          const order = [...rest.slice(0, idx), it, ...rest.slice(idx)];
          const upd = [];
          order.forEach((x, k) => { const nr = (k + 1) * 1000; if (num(x.rank, NaN) !== nr) upd.push({ ...x, rank: nr }); });
          L.saveMany(upd);
        }
        return true;
      };
      const done = (id, act, idx, total) => {
        const it = live.current.byId.get(id);
        pending.current = { id, act, t: Date.now() };
        setSay((it ? it.code || 'El elemento' : 'El elemento') + ' quedó en la posición ' + (idx + 1) + ' de ' + total + '.');
      };
      const seqFor = (L, id) => { for (const g of L.groups) if (g.rows.some((r) => r.id === id)) return g.rows.map((r) => r.id); return []; };
      const o = {
        open: (id) => openItemEditor(getLive, id),
        toggle: (id, on) => setSel((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; }),
        setEstimate: (id, v) => { const L = live.current; const it = L.byId.get(id); if (!it || !L.canWrite) return; L.save({ ...it, estimate: v === null ? null : Math.max(0, Number(v)) }); setSay('Estimación de ' + (it.code || 'elemento') + ' guardada.'); },
        moveBy(id, dir, act) {
          const L = live.current; if (!L.canWrite) return;
          const seq = seqFor(L, id); const i = seq.indexOf(id); const j = i + dir;
          if (i < 0 || j < 0 || j >= seq.length) return;
          const rest = L.sorted.filter((x) => x.id !== id);
          const ti = rest.findIndex((x) => x.id === seq[j]); if (ti < 0) return;
          const idx = dir < 0 ? ti : ti + 1;
          if (placeAt(id, rest, idx)) done(id, act, idx, rest.length + 1);
        },
        moveEdge(id, top, act) {
          const L = live.current; if (!L.canWrite) return;
          const pos = L.sorted.findIndex((x) => x.id === id);
          if (pos < 0 || (top && pos === 0) || (!top && pos === L.sorted.length - 1)) return;
          const rest = L.sorted.filter((x) => x.id !== id);
          const idx = top ? 0 : rest.length;
          if (placeAt(id, rest, idx)) done(id, act, idx, rest.length + 1);
        },
        dropOn(id, targetId, where) {
          const L = live.current;
          const rest = L.sorted.filter((x) => x.id !== id);
          const ti = rest.findIndex((x) => x.id === targetId); if (ti < 0) return;
          const idx = where === 'before' ? ti : ti + 1;
          const cur = L.sorted.findIndex((x) => x.id === id);
          if (cur === idx) return;
          if (placeAt(id, rest, idx)) done(id, 'grip', idx, rest.length + 1);
        },
        gripKey(e, id) {
          const k = e.key;
          if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); o.moveBy(id, k === 'ArrowUp' ? -1 : 1, 'grip'); }
          else if (k === 'Home' || k === 'End') { e.preventDefault(); o.moveEdge(id, k === 'Home', 'grip'); }
        },
        /* arrastrar y soltar con el puntero (ratón, lápiz o táctil sobre el asa); se escribe una sola vez al soltar */
        dragStart(e, id) {
          if (!live.current.canWrite || e.button !== 0) return;
          e.preventDefault();
          const tr = e.currentTarget.closest('tr');
          const group = tr ? tr.dataset.group : null;
          const s = { id, x: e.clientX, y: e.clientY, moved: false, hint: null };
          drag.current = s;
          const hintAt = (x, y) => {
            const el = document.elementFromPoint(x, y);
            const row = el && el.closest ? el.closest('tr[data-agb-row]') : null;
            if (!row || row.dataset.agbRow === id || row.dataset.group !== group) return null;
            const r = row.getBoundingClientRect();
            return { id: row.dataset.agbRow, pos: y - r.top < r.height / 2 ? 'before' : 'after' };
          };
          const onMove = (ev) => {
            if (!s.moved) { if (Math.abs(ev.clientX - s.x) + Math.abs(ev.clientY - s.y) < 5) return; s.moved = true; document.body.classList.add('agb-dragging'); setDragId(id); }
            ev.preventDefault();
            const h = hintAt(ev.clientX, ev.clientY);
            if ((h && h.id) !== (s.hint && s.hint.id) || (h && h.pos) !== (s.hint && s.hint.pos)) { s.hint = h; setDrop(h); }
            const edge = 60;
            if (ev.clientY < edge) window.scrollBy(0, -16); else if (ev.clientY > window.innerHeight - edge) window.scrollBy(0, 16);
          };
          const end = (commit) => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel); window.removeEventListener('keydown', onKey, true);
            document.body.classList.remove('agb-dragging'); setDrop(null); setDragId(null);
            if (commit && s.moved && s.hint) o.dropOn(id, s.hint.id, s.hint.pos);
            setTimeout(() => { if (drag.current === s) drag.current = null; }, 0);
          };
          const onUp = () => end(true);
          const onCancel = () => end(false);
          const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); end(false); } };
          window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onCancel); window.addEventListener('keydown', onKey, true);
        },
      };
      return o;
    }, []);

    /* devuelve el foco al control usado después de reordenar (la fila cambió de lugar en el DOM) */
    useLayoutEffect(() => {
      const p = pending.current; if (!p) return;
      if (Date.now() - p.t > 2500) { pending.current = null; return; }
      const row = document.querySelector('tr[data-agb-row="' + cssEsc(p.id) + '"]'); if (!row) return;
      const ae = document.activeElement;
      if (ae && ae !== document.body && !row.contains(ae)) { pending.current = null; return; }
      let b = row.querySelector('[data-act="' + p.act + '"]');
      if (!b || b.disabled) b = row.querySelector('[data-act="grip"]');
      if (b && ae !== b) b.focus();
    });
    useLayoutEffect(() => { if (allRef.current) allRef.current.indeterminate = nSelVis > 0 && nSelVis < visIds.length; });

    /* alta rápida: una historia al final del backlog (con los filtros activos de release, épica y entregable) */
    const quickAdd = (e) => {
      e.preventDefault();
      const t = quick.trim(); if (!t || !canWrite) return;
      const L = live.current;
      const patch = { title: t, type: 'historia' };
      if (f.release && f.release !== NONE) patch.releaseId = f.release;
      if (f.epic && f.epic !== NONE && lk.epics.has(f.epic)) patch.epicId = f.epic;
      if (f.wbs && f.wbs !== NONE) patch.wbsId = f.wbs;
      const it = { ...A.newItem(L.items, patch), id: PM.uid('bl') };
      L.save(it);
      setQuick('');
      PM.toast('Historia ' + it.code + ' agregada al final del backlog.');
    };
    const defaultsFromFilters = () => {
      const d = {};
      if (f.type) d.type = f.type;
      if (f.release && f.release !== NONE) d.releaseId = f.release;
      if (f.epic && f.epic !== NONE && lk.epics.has(f.epic)) d.epicId = f.epic;
      if (f.wbs && f.wbs !== NONE) d.wbsId = f.wbs;
      if (f.status && f.status !== BACKLOG) d.status = f.status;
      return d;
    };

    /* acciones sobre la selección */
    const bulk = (fn, msg) => {
      const L = live.current; const upd = [];
      for (const id of selIds) { const it = L.byId.get(id); if (!it) continue; const n = fn(it); if (n) upd.push(n); }
      if (upd.length) L.saveMany(upd);
      PM.toast(msg(upd.length));
    };
    const bulkRelease = (v) => {
      if (!v) return;
      const r = v === NONE ? null : lk.rel.get(v);
      bulk((it) => ((it.releaseId || null) === (r ? r.id : null) ? null : { ...it, releaseId: r ? r.id : null }), (n) => (r ? plural(n, 'elemento asignado', 'elementos asignados') + ' a «' + r.name + '».' : 'Se quitó el release de ' + plural(n, 'elemento', 'elementos') + '.'));
    };
    const bulkSprint = (v) => {
      if (!v) return;
      const sp = v === NONE ? null : lk.spr.get(v);
      const today = D.today();
      bulk((it) => {
        if ((it.sprintId || null) === (sp ? sp.id : null)) return null;
        return { ...it, sprintId: sp ? sp.id : null, sprintAddedDate: sp && sp.status === 'en-curso' ? today : null, releaseId: it.releaseId || (sp && sp.releaseId) || null };
      }, (n) => (sp ? plural(n, 'elemento asignado', 'elementos asignados') + ' a «' + sp.name + '».' : 'Se quitó la iteración de ' + plural(n, 'elemento', 'elementos') + '.'));
    };
    const bulkPriority = (v) => { if (!v) return; bulk((it) => (it.priority === v ? null : { ...it, priority: v }), (n) => 'Prioridad «' + v + '» asignada a ' + plural(n, 'elemento', 'elementos') + '.'); };
    const bulkDelete = async () => {
      const L = live.current;
      const list = selIds.map((id) => L.byId.get(id)).filter(Boolean);
      if (!list.length) return;
      const kids = L.items.filter((x) => x.epicId && list.some((e) => e.id === x.epicId) && !list.some((d) => d.id === x.id)).length;
      const codes = list.slice(0, 8).map((x) => x.code).join(', ') + (list.length > 8 ? '…' : '');
      const ok = await PM.confirm({
        title: 'Eliminar ' + plural(list.length, 'elemento', 'elementos'),
        body: html`<div class="stack-sm"><p>Se eliminarán del backlog: ${codes}.</p>${kids ? html`<p>${plural(kids, 'elemento queda', 'elementos quedan')} sin épica (sus épicas se eliminan).</p>` : null}<p class="small muted">Esta acción no se puede deshacer.</p></div>`,
        confirmText: 'Eliminar ' + plural(list.length, 'elemento', 'elementos'), tone: 'danger',
      });
      if (!ok) return;
      deleteItems(live.current, list.map((x) => x.id));
      setSel(new Set());
      PM.toast(plural(list.length, 'elemento eliminado', 'elementos eliminados') + '.');
    };

    /* exportar CSV (lo visible, en el orden del backlog) */
    const exportCsv = () => {
      const rows = visible.map((it) => {
        const r = lk.rel.get(it.releaseId), s = lk.spr.get(it.sprintId), w = lk.wbs.get(it.wbsId), e = lk.epics.get(it.epicId);
        return { pos: posMap.get(it.id), code: it.code || '', type: TYPE_LABEL[it.type] || it.type || '', title: it.title || '', description: it.description || '', acceptance: it.acceptance || '', estimate: hasEst(it) ? Number(it.estimate) : '', priority: it.priority || '', value: PM.isNum(it.value) ? Number(it.value) : '', status: statusName(st, it.status), release: r ? r.name : '', sprint: s ? s.name : '', epic: e ? (e.code + ' ' + e.title).trim() : '', wbs: w ? w.code + ' ' + w.name : '', assignee: it.assignee || '', blocked: !!it.blocked, blockedReason: it.blockedReason || '', tags: tagList(it.tags).join(', '), createdAt: it.createdAt || '', doneDate: it.doneDate || '' };
      });
      const cols = [['pos', 'Posición'], ['code', 'Código'], ['type', 'Tipo'], ['title', 'Título'], ['description', 'Descripción'], ['acceptance', 'Criterios de aceptación'], ['estimate', 'Estimación (' + unit + ')'], ['priority', 'Prioridad (MoSCoW)'], ['value', 'Valor'], ['status', 'Estado'], ['release', 'Release'], ['sprint', 'Iteración'], ['epic', 'Épica'], ['wbs', 'Entregable EDT'], ['assignee', 'Responsable'], ['blocked', 'Bloqueado'], ['blockedReason', 'Motivo del bloqueo'], ['tags', 'Etiquetas'], ['createdAt', 'Creado'], ['doneDate', 'Terminado']].map(([key, label]) => ({ key, label }));
      PM.download('backlog-' + (PM.slug((project && (project.code || project.name)) || '') || 'proyecto') + '.csv', PM.toCSV(cols, rows));
    };

    const header = (actions) => html`<${ui.PageHeader} eyebrow="5.2 Recopilar requisitos · 5.3 Definir el alcance (enfoque adaptativo)" title="Backlog del producto"
      description="Lista priorizada de lo que el producto necesita: historias, defectos, mejoras y tareas ordenados por valor. Se refina de forma continua y alimenta los releases, las iteraciones y el tablero."
      actions=${actions} />`;
    if (model.loading && !items.length) return html`<div class="page">${header(null)}<${ui.Loading} rows=${6} /></div>`;

    const actions = html`
      <${ui.Button} icon="settings" onClick=${() => PM.agileSettingsDialog(live.current)}>Configuración ágil</${ui.Button}>
      <${ui.Button} icon="download" onClick=${exportCsv} disabled=${!visible.length}>Exportar CSV</${ui.Button}>
      ${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => openItemEditor(getLive, null, defaultsFromFilters())}>Nuevo elemento</${ui.Button}>` : null}`;
    const colCount = 13 + (canWrite ? 2 : 0);
    const relOpts = [{ value: NONE, label: 'Sin release' }, ...model.releases.map((r) => ({ value: r.id, label: r.name || 'Release' }))];
    const epicOpts = [{ value: NONE, label: 'Sin épica' }, ...epics.map((e) => ({ value: e.id, label: (e.code || '') + ' ' + (e.title || '') }))];
    const statusOpts = [{ value: BACKLOG, label: 'Backlog del producto' }, ...st.columns.map((c) => ({ value: c.id, label: c.name }))];
    const wbsOpts = [{ value: NONE, label: 'Sin entregable' }, ...[...lk.wbs].map(([id, w]) => ({ value: id, label: w.code + ' ' + w.name + (w.approach === 'adaptativo' ? ' · Ágil' : '') }))];
    const sprintOpts = model.sprints.map((s) => ({ value: s.id, label: (s.name || 'Iteración') + ' · ' + (SPRINT_STATUS[s.status] || 'Planeado') }));
    const groupHead = (g) => {
      if (!g.epic) return html`<div class="row"><span>Sin épica</span><span class="xsmall muted">${plural(g.rows.length, 'elemento visible', 'elementos visibles')}</span></div>`;
      const s = epicStats.get(g.epic.id) || { n: 0, done: 0, est: 0, estDone: 0 };
      return html`<div class="row"><span class="code-tag">${g.epic.code}</span><button type="button" class="agb-title" onClick=${() => api.open(g.epic.id)}>${g.epic.title || 'Épica sin título'}</button>
        <span class="xsmall muted">${s.n ? s.done + ' de ' + s.n + ' terminados' : 'Sin elementos'} · ${fmt.num(s.estDone, 1)} / ${fmt.num(s.est, 1)} ${unit}</span></div>`;
    };

    return html`<div class="page agb-page">
      ${header(actions)}
      <section class="card agb-tiles-card" aria-label="Indicadores del backlog">
        <div class="agb-tiles">
          <${Tile} id="items" label="Elementos (sin épicas)" value=${fmt.num(stats.n)} title="Historias, tareas, defectos, mejoras e investigaciones: las épicas agrupan y no se cuentan" sub=${plural(stats.done, 'terminado', 'terminados') + (stats.blocked ? ' · ' + plural(stats.blocked, 'bloqueado', 'bloqueados') : '') + (stats.epics ? ' · además ' + plural(stats.epics, 'épica', 'épicas') : '')} />
          <${Tile} id="total" label="Total estimado" value=${fmt.num(stats.total, 1) + ' ' + unit} sub=${fmt.num(stats.totalDone, 1) + ' ' + unit + ' terminados'} />
          <${Tile} id="unest" label="Sin estimar" value=${fmt.num(stats.unest)} tone=${stats.unest ? 'warn' : undefined} sub=${stats.unest ? 'Trabajo pendiente por refinar' : 'Todo el trabajo pendiente está estimado'} />
          <${Tile} id="noacc" label="Sin criterios de aceptación" value=${fmt.num(stats.noAcc)} tone=${stats.noAcc ? 'warn' : undefined} sub=${stats.noAcc ? 'Defínelos antes de llevarlos a una iteración' : 'Todos tienen criterios'} />
        </div>
      </section>
      <div class="agb-head">
        <${ui.Card} title="Total por release" subtitle=${'Estimado y terminado (' + unit + ')'} pad=${false}>
          ${stats.perRel.length ? html`<ul class="agb-list is-scroll" data-agb-releases="1">${stats.perRel.map((r) => html`<li key=${r.id} class="agb-li">
            <div class="stack-sm" style="gap:0;min-width:0"><span class="agb-li-name truncate">${r.name}</span><span class="xsmall faint">${r.status ? (RELEASE_STATUS[r.status] || 'Planeado') + ' · ' : ''}${plural(r.count, 'elemento', 'elementos')}</span></div>
            <div class="agb-li-num">${fmt.num(r.total, 1)} ${unit}<div class="xsmall faint">${fmt.num(r.done, 1)} terminados</div></div>
            <${ui.Meter} value=${r.total ? r.done / r.total : 0} tone=${r.total && r.done >= r.total ? 'good' : undefined} label=${'Avance de ' + r.name} />
          </li>`)}</ul>` : html`<div class="agb-card-empty">Sin elementos todavía.</div>`}
        </${ui.Card}>
        <${ui.Card} title="Épicas" subtitle="Avance: terminados / total de sus elementos" pad=${false}
          actions=${html`<${ui.Check} checked=${grouped} onValue=${setGrouped} label="Agrupar por épica" />`}>
          ${epics.length ? html`<ul class="agb-list is-scroll" data-agb-epics="1">${epics.map((e) => { const s = epicStats.get(e.id) || { n: 0, done: 0, est: 0, estDone: 0 }; const on = f.epic === e.id; return html`<li key=${e.id} class="agb-li">
            <div class="row" style="min-width:0;flex-wrap:nowrap"><span class="code-tag">${e.code}</span><button type="button" class="agb-title truncate" onClick=${() => api.open(e.id)}>${e.title || 'Épica sin título'}</button></div>
            <${ui.Button} size="sm" variant="ghost" icon="filter" aria-pressed=${on ? 'true' : 'false'} aria-label=${(on ? 'Quitar el filtro de ' : 'Filtrar por ') + e.code} onClick=${() => setF((x) => ({ ...x, epic: on ? '' : e.id }))}>${on ? 'Quitar filtro' : 'Filtrar'}</${ui.Button}>
            <${ui.Meter} value=${s.n ? s.done / s.n : 0} tone=${s.n && s.done === s.n ? 'good' : undefined} label=${'Avance de ' + e.code} />
            <div class="agb-li-full xsmall muted" data-epic-progress=${e.id}>${s.n ? s.done + ' de ' + s.n + ' terminados (' + fmt.pct(s.done / s.n) + ')' : 'Sin elementos todavía'} · ${fmt.num(s.estDone, 1)} / ${fmt.num(s.est, 1)} ${unit}</div>
          </li>`; })}</ul>` : html`<div class="agb-card-empty">No hay épicas. Crea un elemento de tipo «Épica» para agrupar historias relacionadas.${canWrite ? html` <button type="button" class="agb-title" style="color:var(--accent)" onClick=${() => openItemEditor(getLive, null, { type: 'epica' })}>Nueva épica</button>` : null}</div>`}
        </${ui.Card}>
      </div>

      <${Note} icon="info">Ordena el backlog por valor, riesgo y dependencias: subir, bajar o arrastrar cambia solo la posición del elemento y <strong>no requiere control de cambios</strong>. La solicitud de cambio aplica cuando el alcance de un release comprometido varía más del ${fmt.num(st.scopeChangeThreshold)} % frente a su línea base, o cambian su fecha o su presupuesto.</${Note}>

      <div class="agb-toolbar" role="search" aria-label="Filtros del backlog">
        <${ui.Search} value=${f.q} onValue=${setFilter('q')} placeholder="Buscar código, título, responsable…" aria-label="Buscar en el backlog" />
        <${ui.Select} value=${f.type} onValue=${setFilter('type')} placeholder="Todos los tipos" options=${AG.ITEM_TYPES} aria-label="Filtrar por tipo" />
        <${ui.Select} value=${f.release} onValue=${setFilter('release')} placeholder="Todos los releases" options=${relOpts} aria-label="Filtrar por release" />
        <${ui.Select} value=${f.epic} onValue=${setFilter('epic')} placeholder="Todas las épicas" options=${epicOpts} aria-label="Filtrar por épica" />
        <${ui.Select} value=${f.status} onValue=${setFilter('status')} placeholder="Todos los estados" options=${statusOpts} aria-label="Filtrar por estado" />
        <${ui.Select} value=${f.wbs} onValue=${setFilter('wbs')} placeholder="Todos los entregables" options=${wbsOpts} aria-label="Filtrar por entregable de la EDT" />
        <${ui.Button} size="sm" icon="checklist" aria-pressed=${refine ? 'true' : 'false'} onClick=${() => setRefine(!refine)} title="Muestra solo los elementos sin estimar o sin criterios de aceptación">Refinamiento${stats.refine ? ' (' + stats.refine + ')' : ''}</${ui.Button}>
        ${anyFilter ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => { setF(NO_FILTERS); setRefine(false); }}>Limpiar filtros</${ui.Button}>` : null}
        <span class="xsmall muted agb-count" aria-live="polite" data-agb-count="1">${anyFilter ? fmt.num(visible.length) + ' de ' + fmt.num(items.length) + ' elementos' : plural(items.length, 'elemento', 'elementos') + (stats.epics ? ' (incluye ' + plural(stats.epics, 'épica', 'épicas') + ')' : '')}</span>
      </div>
      ${refine ? html`<${Note} tone="info" icon="checklist">Modo «Refinamiento»: elementos pendientes (no terminados) sin estimar o sin criterios de aceptación. ${canWrite ? 'Escribe la estimación directamente en la tabla (Enter o salir del campo la guarda) y abre el elemento para completar sus criterios.' : ''}</${Note}>` : null}

      ${canWrite ? html`<form class="agb-quick" onSubmit=${quickAdd}>
        <${ui.Input} value=${quick} onValue=${setQuick} placeholder="Alta rápida: escribe el título de una historia y presiona Enter" aria-label="Título de la nueva historia (alta rápida)" />
        <${ui.Button} type="submit" icon="plus" disabled=${!quick.trim()}>Agregar historia</${ui.Button}>
      </form>` : html`<${Note} icon="lock">Modo de solo lectura: puedes consultar y exportar el backlog, pero no modificarlo.</${Note}>`}

      ${canWrite && selIds.length ? html`<div class="agb-bulk" role="region" aria-label="Acciones sobre los elementos seleccionados">
        <strong class="small" data-agb-selcount="1">${plural(selIds.length, 'seleccionado', 'seleccionados')}${nSelHidden > 0 ? ' (' + plural(nSelHidden, 'oculto', 'ocultos') + ' por los filtros o la agrupación)' : ''}</strong>
        <${ui.Select} value="" onValue=${bulkRelease} placeholder="Asignar release…" options=${[{ value: NONE, label: 'Quitar release' }, ...model.releases.map((r) => ({ value: r.id, label: r.name || 'Release' }))]} aria-label="Asignar release a la selección" />
        <${ui.Select} value="" onValue=${bulkSprint} placeholder="Asignar iteración…" options=${[{ value: NONE, label: 'Quitar iteración' }, ...sprintOpts]} aria-label="Asignar iteración a la selección" />
        <${ui.Select} value="" onValue=${bulkPriority} placeholder="Asignar prioridad…" options=${AG.PRIORITIES} aria-label="Asignar prioridad a la selección" />
        <${ui.Button} size="sm" variant="danger" icon="trash" onClick=${bulkDelete}>Eliminar</${ui.Button}>
        <${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => setSel(new Set())}>Quitar selección</${ui.Button}>
      </div>` : null}

      ${!items.length ? html`<${ui.Empty} icon="backlog" title="El backlog del producto está vacío"
          actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => openItemEditor(getLive, null, defaultsFromFilters())}>Nuevo elemento</${ui.Button}><${ui.Button} icon="layers" onClick=${() => openItemEditor(getLive, null, { type: 'epica' })}>Nueva épica</${ui.Button}>` : null}>
          Aquí aparecerán las historias de usuario, defectos, mejoras y tareas del producto, ordenados por prioridad. Empieza con las épicas o escribe una historia en el alta rápida.
        </${ui.Empty}>` : html`<div class="table-wrap">
        <table class="table agb-table" aria-label="Backlog del producto en orden de prioridad">
          <thead><tr>
            ${canWrite ? html`<th class="agb-c-tight"><input type="checkbox" ref=${allRef} class="agb-check" aria-label="Seleccionar todos los elementos visibles" disabled=${!visIds.length} checked=${visIds.length > 0 && nSelVis === visIds.length}
              onChange=${(e) => { const on = e.currentTarget.checked; setSel((prev) => { const n = new Set(prev); for (const id of visIds) { if (on) n.add(id); else n.delete(id); } return n; }); }} /></th>` : null}
            <th class="num" title="Posición en el backlog">#</th>
            ${canWrite ? html`<th><span class="sr-only">Reordenar</span></th>` : null}
            <th>Código</th><th>Tipo</th><th>Título</th><th class="num">Estimación</th><th>Prioridad</th><th class="num">Valor</th>
            <th>Release</th><th>Iteración</th><th>Entregable EDT</th><th>Estado</th><th>Responsable</th><th>Bloqueado</th>
          </tr></thead>
          ${groups.map((g) => html`<tbody key=${g.key}>
            ${grouped ? html`<tr class="agb-group"><th colspan=${colCount} scope="colgroup">${groupHead(g)}</th></tr>` : null}
            ${g.rows.map((it, i) => { const p = posMap.get(it.id); return html`<${BacklogRow} key=${it.id} it=${it} pos=${p} lk=${lk} sel=${sel.has(it.id)} canWrite=${canWrite} first=${i === 0} last=${i === g.rows.length - 1} top=${p === 1} bottom=${p === sorted.length} drop=${drop && drop.id === it.id ? drop.pos : null} dragging=${dragId === it.id} refine=${refine} group=${g.key} api=${api} />`; })}
            ${grouped && !g.rows.length ? html`<tr><td colspan=${colCount} class="agb-none small">Ningún elemento visible en esta épica.</td></tr>` : null}
          </tbody>`)}
          ${!visible.length ? html`<tbody><tr><td colspan=${colCount} class="agb-none">Ningún elemento coincide con los filtros. <button type="button" class="agb-title" style="color:var(--accent)" onClick=${() => { setF(NO_FILTERS); setRefine(false); }}>Limpiar filtros</button></td></tr></tbody>` : null}
        </table>
      </div>`}
      <div class="sr-only" aria-live="polite" data-agb-live="1">${say}</div>
    </div>`;
  }

  /* ---------------------------------------------------------------- tablero Kanban: diálogos */
  function ColumnsDialog({ close, getLive }) {
    const canWrite = PM.useCanWrite();
    const [data, , meta] = PM.useToolData('agile', PM.EMPTY.agile);
    if (meta.loading) return html`<${ui.Modal} title="Columnas del tablero" onClose=${close}><${ui.Loading} /></${ui.Modal}>`;
    return html`<${ColumnsForm} close=${close} getLive=${getLive} data=${data} saveNow=${meta.saveNow} canWrite=${canWrite} />`;
  }
  function ColumnsForm({ close, getLive, data, saveNow, canWrite }) {
    const st0 = useMemo(() => A.settings(data), []);
    const [cols, setCols] = useState(() => st0.columns.map((c) => ({ id: c.id, name: c.name, category: c.category, wip: wipOf(c), orig: true })));
    /* columnas originales eliminadas: { col, idx (posición al eliminarla), n (elementos actuales), h (elementos con esa columna en su historial), target } */
    const [removed, setRemoved] = useState([]);
    const ro = !canWrite;
    const { counts, hist } = useMemo(() => {
      const c = new Map(), h = new Map();
      for (const it of getLive().items) {
        c.set(it.status, (c.get(it.status) || 0) + 1);
        const seen = new Set();
        for (const e of arr(it.history)) if (isObj(e) && typeof e.status === 'string' && !seen.has(e.status)) { seen.add(e.status); h.set(e.status, (h.get(e.status) || 0) + 1); }
      }
      return { counts: c, hist: h };
    }, []);
    const origCat = (id) => { const c = st0.columns.find((x) => x.id === id); return c ? c.category : null; };
    /* a dónde pasan los pasos del historial por una columna eliminada: a la columna destino si es de la misma
       categoría; si no, a la primera de la misma categoría; si no queda ninguna, a la primera «pendiente» */
    const histTargetOf = (r, cs) => {
      const cat = origCat(r.col.id) || r.col.category;
      const t = r.n ? cs.find((c) => c.id === r.target) : null;
      if (t && t.category === cat) return t;
      return cs.find((c) => c.category === cat) || cs.find((c) => c.category === 'pendiente') || cs[0] || null;
    };
    const setCol = (i, k, v) => setCols((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
    const move = (i, d) => setCols((cs) => PM.moveItem(cs, i, i + d));
    const add = () => {
      const id = PM.uid('col');
      setCols((cs) => [...cs, { id, name: 'Nueva columna', category: 'en-curso', wip: null, orig: false }]);
      setTimeout(() => { const el = document.getElementById('agk-cn-' + id); if (el) { el.focus(); el.select(); } }, 30);
    };
    const del = (i) => {
      const c = cols[i];
      const rest = cols.filter((_, j) => j !== i);
      if (!rest.length) return;
      if (c.orig) {
        const n = counts.get(c.id) || 0;
        setRemoved((r) => [...r, { col: c, idx: i, n, h: hist.get(c.id) || 0, target: (rest[Math.max(0, i - 1)] || rest[0]).id }]);
      }
      setCols(rest);
    };
    /* restaurar la devuelve a su posición original (no al final: el orden define el flujo y las flechas) */
    const restore = (k) => {
      const r = removed[k];
      setRemoved((x) => x.filter((_, j) => j !== k));
      setCols((cs) => { const n = cs.slice(); n.splice(Math.min(Math.max(0, r.idx), n.length), 0, r.col); return n; });
    };
    const problems = useMemo(() => {
      const p = [];
      if (cols.some((c) => !String(c.name || '').trim())) p.push('Escribe el nombre de cada columna.');
      const names = cols.map((c) => norm(String(c.name || '').trim())).filter(Boolean);
      if (new Set(names).size !== names.length) p.push('Hay columnas con el mismo nombre: usa nombres distintos.');
      if (!cols.some((c) => c.category === 'pendiente')) p.push('Debe quedar al menos una columna en la categoría «Pendiente» (por ahí entran los elementos del backlog).');
      if (!cols.some((c) => c.category === 'terminado')) p.push('Debe quedar al menos una columna en la categoría «Terminado» (registra la fecha de terminación).');
      for (const r of removed) if (r.n && !cols.some((c) => c.id === r.target)) p.push('Elige a qué columna pasan los elementos de «' + r.col.name + '».');
      return p;
    }, [cols, removed]);
    const submit = () => {
      if (ro || problems.length) return;
      const columns = cols.map((c) => ({ id: c.id, name: String(c.name).trim(), category: c.category, wip: wipOf(c) }));
      const stOld = A.settings(data);
      const base = isObj(data.settings) ? PM.clone(data.settings) : {};
      const raw = { ...base, framework: stOld.framework, estimationUnit: stOld.estimationUnit, sprintLength: stOld.sprintLength, scopeChangeThreshold: stOld.scopeChangeThreshold, columns };
      saveNow({ ...PM.clone(data), settings: raw });
      /* elementos de columnas eliminadas → columna elegida; su historial (y el de todos los elementos que pasaron por
         ellas) se reescribe a una columna de la misma categoría, para que el tiempo de ciclo y el flujo acumulado no
         cambien hacia atrás; las columnas que cambian de categoría ajustan la fecha de terminación */
      const nst = A.settings({ settings: raw });
      const L = getLive();
      const today = D.today();
      const kept = new Set(columns.map((c) => c.id));
      const origCols = [...st0.columns, ...stOld.columns.filter((c) => !st0.columns.some((x) => x.id === c.id))];
      const gone = origCols.filter((c) => !kept.has(c.id));
      const curMap = new Map(removed.filter((r) => r.n && kept.has(r.target)).map((r) => [r.col.id, r.target]));
      const histMap = new Map();
      for (const c of gone) {
        const r = removed.find((x) => x.col.id === c.id) || { col: c, n: 0 };
        const t = histTargetOf(r, nst.columns);
        if (t) histMap.set(c.id, t.id);
      }
      const upd = [];
      for (const it of L.items) {
        let x = it, changed = false;
        const h = arr(it.history);
        if (h.some((e) => isObj(e) && histMap.has(e.status))) {
          x = { ...x, history: collapseHistory(h.map((e) => (isObj(e) && histMap.has(e.status) ? { ...e, status: histMap.get(e.status) } : e))) };
          changed = true;
        }
        if (histMap.has(it.status)) {
          const wasDone = A.isDone(stOld, it);
          x = A.withStatus(nst, x, curMap.get(it.status) || histMap.get(it.status), today);
          if (wasDone && A.isDone(nst, x) && D.valid(it.doneDate)) x = { ...x, doneDate: it.doneDate };
          changed = true;
        } else if (it.status && it.status !== BACKLOG && kept.has(it.status)) {
          const was = A.isDone(stOld, it), now = A.isDone(nst, it);
          if (was !== now) { x = { ...x, doneDate: now ? (D.valid(it.doneDate) ? it.doneDate : today) : null }; changed = true; }
        }
        if (changed) upd.push(x);
      }
      if (upd.length) L.saveMany(upd);
      close();
      const moved = removed.reduce((s, r) => s + r.n, 0);
      PM.toast('Columnas del tablero guardadas.' + (moved ? ' ' + plural(moved, 'elemento reasignado', 'elementos reasignados') + '.' : ''));
    };
    const footer = html`<${ui.Button} onClick=${close}>${ro ? 'Cerrar' : 'Cancelar'}</${ui.Button}>${ro ? null : html`<${ui.Button} variant="primary" icon="save" disabled=${!!problems.length} onClick=${submit}>Guardar columnas</${ui.Button}>`}`;
    const histNote = (r) => {
      if (!r.h) return null;
      const t = histTargetOf(r, cols);
      if (!t) return null;
      const cat = origCat(r.col.id) || r.col.category;
      const same = t.category === cat;
      return html`<span class="small">Historial: los pasos de ${plural(r.h, 'elemento', 'elementos')} por «${r.col.name}» quedan registrados en «${t.name || 'Sin nombre'}»${same ? ', de la misma categoría, para conservar el tiempo de ciclo y el flujo acumulado.' : ': no queda otra columna de la categoría «' + CAT_LABEL[cat] + '».'}</span>`;
    };
    return html`<${ui.Modal} title="Columnas del tablero" subtitle="Nombre, categoría y límite de trabajo en curso (WIP) de cada columna, en el orden del flujo." onClose=${close} size="wide" footer=${footer}>
      <div class="agk-colrows" data-agk-columns="1">
        ${cols.map((c, i) => html`<div class="agk-colrow" key=${c.id} data-col=${c.id}>
          <${ui.Field} label=${'Columna ' + (i + 1)} for=${'agk-cn-' + c.id} class="agk-colrow-name">
            <${ui.Input} id=${'agk-cn-' + c.id} value=${c.name} onValue=${(v) => setCol(i, 'name', v)} disabled=${ro} />
          </${ui.Field}>
          <${ui.Field} label="Categoría" for=${'agk-cc-' + c.id}>
            <${ui.Select} id=${'agk-cc-' + c.id} value=${c.category} options=${CAT_OPTIONS} onValue=${(v) => setCol(i, 'category', v)} disabled=${ro} />
          </${ui.Field}>
          <${ui.Field} label="Límite WIP" for=${'agk-cw-' + c.id}>
            <${ui.NumberInput} id=${'agk-cw-' + c.id} value=${c.wip} min=${1} max=${99} placeholder="Sin límite" onValue=${(v) => setCol(i, 'wip', v === null ? null : Math.max(1, Math.round(v)))} disabled=${ro} />
          </${ui.Field}>
          <div class="agk-colrow-n xsmall muted">${c.orig ? plural(counts.get(c.id) || 0, 'elemento', 'elementos') : 'Nueva'}</div>
          ${ro ? html`<div></div>` : html`<div class="row agk-colrow-act" style="gap:0">
            <${ui.IconButton} size="sm" icon="chevron-up" label=${'Subir la columna «' + c.name + '»'} disabled=${i === 0} onClick=${() => move(i, -1)} />
            <${ui.IconButton} size="sm" icon="chevron-down" label=${'Bajar la columna «' + c.name + '»'} disabled=${i === cols.length - 1} onClick=${() => move(i, 1)} />
            <${ui.IconButton} size="sm" icon="trash" label=${'Eliminar la columna «' + c.name + '»'} disabled=${cols.length <= 1} onClick=${() => del(i)} />
          </div>`}
        </div>`)}
      </div>
      ${ro ? null : html`<div><${ui.Button} size="sm" icon="plus" onClick=${add}>Agregar columna</${ui.Button}></div>`}
      ${removed.length ? html`<div class="stack-sm" data-agk-removed="1">
        <div class="h4">Columnas que se eliminarán</div>
        ${removed.map((r, k) => html`<${Note} key=${r.col.id} tone=${r.n ? 'warn' : undefined} icon="trash"><div class="stack-sm" data-agk-removed-col=${r.col.id}>
          ${r.n ? html`<span>«${r.col.name}» tiene ${plural(r.n, 'elemento', 'elementos')}. Al guardar pasan a la columna:</span>` : html`<span>«${r.col.name}» no tiene elementos${r.h ? ' actualmente' : ''}.</span>`}
          ${histNote(r)}
          <div class="row">${r.n ? html`<${ui.Select} value=${cols.some((c) => c.id === r.target) ? r.target : ''} placeholder=${cols.some((c) => c.id === r.target) ? undefined : 'Elige una columna'} options=${cols.map((c) => ({ value: c.id, label: c.name || 'Sin nombre' }))} aria-label=${'Columna destino de los elementos de «' + r.col.name + '»'} onValue=${(v) => setRemoved((x) => x.map((y, j) => (j === k ? { ...y, target: v } : y)))} style="width:auto" />` : null}
          <${ui.Button} size="sm" icon="undo" onClick=${() => restore(k)} aria-label=${'Restaurar la columna «' + r.col.name + '»'}>Restaurar columna</${ui.Button}></div>
        </div></${Note}>`)}
      </div>` : null}
      ${problems.length ? html`<${Note} tone="crit" icon="alert" role="alert"><div class="stack-sm">${problems.map((p, i) => html`<span key=${i}>${p}</span>`)}</div></${Note}>` : null}
      <p class="xsmall faint">Política WIP: cuando una columna llega a su límite, mover una tarjeta hacia ella pide confirmación. «Pendiente» es el punto de entrada desde el backlog; «Terminado» registra la fecha de terminación (velocidad, burndown y tiempo de ciclo).</p>
    </${ui.Modal}>`;
  }

  /* Traer del backlog: pasa elementos en estado «backlog del producto» a la primera columna del tablero. */
  function BringDialog({ close, getLive }) {
    const L0 = useMemo(() => getLive(), []);
    const st = L0.settings;
    const first = A.firstColumn(st);
    const sprintId = L0.sprintF || '', relId = L0.relF || '';
    const sprint = sprintId ? L0.sprints.find((s) => s.id === sprintId) : null;
    const rel = relId ? L0.releases.find((r) => r.id === relId) : null;
    const [inc, setInc] = useState(false);
    const pool = useMemo(() => A.sortByRank(L0.items.filter((it) => A.countable(it) && A.category(st, it.status) === 'nuevo'
      && (sprintId ? it.sprintId === sprintId || (inc && !it.sprintId && (!relId || it.releaseId === relId)) : !relId || it.releaseId === relId))), [inc]);
    const [picked, setPicked] = useState(() => new Set());
    const sel = pool.filter((it) => picked.has(it.id));
    const unit = A.unitShort(st);
    const toggle = (id, on) => setPicked((p) => { const n = new Set(p); if (on) n.add(id); else n.delete(id); return n; });
    const submit = async () => {
      if (!sel.length) return;
      const L = getLive();
      /* conteo WIP de todo el tablero (no solo de la iteración o el release filtrados) */
      const n0 = (L.wipCounts && L.wipCounts.get(first.id)) || 0;
      const fw = wipOf(first);
      if (fw && n0 + sel.length > fw) {
        const ok = await PM.confirm({ title: 'Se superará el límite WIP', body: '«' + first.name + '» tiene ' + n0 + ' de ' + fw + ' elementos en todo el tablero. Pasar ' + sel.length + ' más supera su límite WIP; la política del tablero es terminar antes de empezar. ¿Continuar de todas formas?', confirmText: 'Pasar de todas formas' });
        if (!ok) return;
      }
      const today = D.today();
      const sp = sprint ? L.sprints.find((s) => s.id === sprint.id) : null;
      const upd = sel.map((x) => L.items.find((y) => y.id === x.id)).filter(Boolean).map((it) => {
        let x = A.withStatus(L.settings, it, first.id, today);
        if (sp && !it.sprintId) x = { ...x, sprintId: sp.id, sprintAddedDate: sp.status === 'en-curso' ? today : null, releaseId: x.releaseId || sp.releaseId || null };
        return x;
      });
      L.saveMany(upd);
      close();
      PM.toast(plural(upd.length, 'elemento pasó', 'elementos pasaron') + ' a «' + first.name + '».');
    };
    const scope = sprint ? 'Elementos de «' + (sprint.name || 'la iteración') + '»' : rel ? 'Elementos del release «' + (rel.name || '') + '»' : 'Todo el backlog del producto';
    const allOn = pool.length > 0 && sel.length === pool.length;
    const footer = html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="arrow-right" disabled=${!sel.length} onClick=${submit}>${'Pasar ' + (sel.length || '') + ' a «' + first.name + '»'}</${ui.Button}>`;
    return html`<${ui.Modal} title="Traer del backlog" subtitle=${scope + ', en orden de prioridad.'} onClose=${close} size="wide" footer=${footer}>
      ${sprint ? html`<${ui.Check} checked=${inc} onValue=${(v) => { setInc(v); setPicked(new Set()); }} label=${'Incluir elementos sin iteración (se asignan a «' + (sprint.name || 'la iteración') + '»)'} />` : null}
      ${pool.length ? html`<div class="stack-sm">
        <${ui.Check} checked=${allOn} onValue=${(v) => setPicked(v ? new Set(pool.map((x) => x.id)) : new Set())} label=${'Seleccionar todos (' + pool.length + ')'} />
        <div class="agb-pick" role="group" aria-label="Elementos del backlog">${pool.map((it) => html`<label key=${it.id} class="agb-pick-item">
          <input type="checkbox" class="agb-check" checked=${picked.has(it.id)} onChange=${(e) => toggle(it.id, e.currentTarget.checked)} />
          <span class="agb-pick-main"><span><span class="code-tag">${it.code}</span> ${it.title || 'Sin título'}</span>
            <span class="row xsmall muted" style="gap:6px"><${TypeChip} type=${it.type} /><span>${fmtEst(it.estimate, unit)}</span><span>${it.priority || ''}</span>${it.blocked ? html`<${ui.Chip} tone="crit" icon="lock">Bloqueado</${ui.Chip}>` : null}</span></span>
        </label>`)}</div>
      </div>` : html`<${Note} icon="info">No hay elementos en el backlog del producto ${sprint ? 'asignados a esta iteración' : rel ? 'de este release' : ''}. ${sprint && !inc ? 'Marca «Incluir elementos sin iteración» o asígnalos desde el backlog.' : 'Agrégalos desde el backlog del producto.'}
        <div style="margin-top:6px"><${ui.Button} size="sm" icon="backlog" onClick=${() => { close(); PM.navigate('backlog'); }}>Ir al backlog</${ui.Button}></div></${Note}>`}
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- vista: Tablero Kanban */
  const KanbanCard = PM.memo(function KanbanCard({ it, ci, cols, days, canWrite, api, dragging, unit }) {
    const prev = cols[ci - 1], next = cols[ci + 1];
    const code = it.code || 'elemento';
    return html`<article class=${cx('agk-card', it.blocked && 'is-blocked', dragging && 'is-dragging', canWrite && 'is-movable')} data-agk-card=${it.id}
      onPointerDown=${canWrite ? (e) => api.dragStart(e, it.id) : undefined} onClick=${(e) => api.cardClick(e, it.id)}>
      <div class="agk-card-top"><span class="code-tag">${it.code || '—'}</span><${TypeChip} type=${it.type} />${hasEst(it) ? html`<span class="agk-est" title="Estimación">${fmtEst(it.estimate, unit)}</span>` : html`<span class="agk-est faint">Sin estimar</span>`}</div>
      <button type="button" class="agk-card-title" data-act="open" aria-label=${code + ': ' + (it.title || 'sin título')} aria-describedby="agk-kbd-hint"
        onKeyDown=${(e) => api.cardKey(e, it.id, ci)} onClick=${(e) => { e.stopPropagation(); api.open(it.id); }}>${it.title || 'Sin título'}</button>
      ${it.blocked ? html`<div class="agk-blocked"><${ui.Icon} name="lock" size=${13} /><span>Bloqueado${it.blockedReason ? ': ' + it.blockedReason : ''}</span></div>` : null}
      <div class="agk-card-meta">
        <span>${it.assignee ? html`<${ui.Icon} name="user" size=${12} /> ${it.assignee}` : html`<span class="faint">Sin responsable</span>`}</span>
        ${days !== null && days !== undefined ? html`<span title="Días en la columna actual (antigüedad, a hoy)">${days === 1 ? '1 día' : fmt.num(days) + ' días'} en la columna</span>` : null}
      </div>
      ${canWrite ? html`<div class="agk-card-actions">
        <${ui.IconButton} size="sm" icon="chevron-left" data-act="prev" label=${prev ? 'Mover ' + code + ' a «' + prev.name + '»' : code + ' está en la primera columna'} disabled=${!prev} onClick=${(e) => { e.stopPropagation(); api.move(it.id, prev.id, 'prev'); }} />
        <${ui.Dropdown} label=${'Mover ' + code + ' a otra columna'} buttonLabel="Mover a…" icon="arrow-right" align="left"
          items=${cols.filter((c) => c.id !== it.status).map((c) => ({ label: c.name + (c.full ? ' (límite WIP alcanzado)' : ''), onClick: () => api.move(it.id, c.id, 'open') }))} />
        <${ui.IconButton} size="sm" icon="chevron-right" data-act="next" label=${next ? 'Mover ' + code + ' a «' + next.name + '»' : code + ' está en la última columna'} disabled=${!next} onClick=${(e) => { e.stopPropagation(); api.move(it.id, next.id, 'next'); }} />
      </div>` : null}
    </article>`;
  });

  function KanbanView({ project }) {
    const model = PM.useAgileModel();
    const canWrite = PM.useCanWrite();
    const st = model.settings, unit = model.unit;
    /* columnas con el límite WIP normalizado (un valor negativo, cero o no numérico de datos importados no limita) */
    const cols = useMemo(() => st.columns.map((c) => ({ ...c, wip: wipOf(c) })), [st.columns]);
    const opt = useOptimistic(model.items, model.saveItem, model.deleteItem);
    const items = useStableItems(opt.items);
    const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
    const { lk } = useLookups(model, items);
    const [sprintSel, setSprintSel] = useState(null);
    const [relF, setRelF] = useState('');
    const [whoF, setWhoF] = useState('');
    const [allDone, setAllDone] = useState(false);
    const [dragId, setDragId] = useState(null);
    const [dropCol, setDropCol] = useState(null);
    const [say, setSay] = useState('');
    const pending = useRef(null);
    const drag = useRef(null);
    const boardRef = useRef(null);
    const cur = model.currentSprint;
    /* por defecto: la iteración en curso en Scrum (o Scrum con Kanban); todo el flujo en Kanban */
    const defSprint = st.framework !== 'kanban' && cur ? cur.id : '';
    let sprintF = sprintSel === null ? defSprint : sprintSel;
    if (sprintF && !lk.spr.has(sprintF)) sprintF = '';
    const relV = relF && lk.rel.has(relF) ? relF : '';
    const today = D.today();
    /* fecha de corte del proyecto (como en el tablero del proyecto y en Métricas ágiles): métricas de flujo y días restantes */
    const cut = D.valid(model.statusDate) ? model.statusDate : today;
    const scope = useMemo(() => items.filter((it) => A.countable(it) && (!sprintF || it.sprintId === sprintF) && (!relV || it.releaseId === relV)), [items, sprintF, relV]);
    const people = useMemo(() => [...new Set(items.filter(A.countable).map((x) => String(x.assignee || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [items]);
    /* conteo WIP de cada columna sobre todo el tablero: los filtros de iteración, release y responsable solo cambian
       qué tarjetas se ven, no el trabajo en curso real del equipo */
    const wipCounts = useMemo(() => {
      const m = new Map(cols.map((c) => [c.id, 0]));
      for (const it of items) if (A.countable(it) && m.has(it.status)) m.set(it.status, m.get(it.status) + 1);
      return m;
    }, [items, cols]);
    const board = useMemo(() => {
      const byCol = new Map(cols.map((c) => [c.id, []]));
      for (const it of scope) {
        const l = byCol.get(it.status); if (!l) continue;
        const who = str(it.assignee).trim();
        if (whoF && (whoF === NONE ? !!who : who !== whoF)) continue;
        l.push(it);
      }
      for (const c of cols) {
        const l = byCol.get(c.id);
        if (c.category === 'terminado') l.sort((a, b) => String(b.doneDate || '').localeCompare(String(a.doneDate || '')) || num(a.rank, 0) - num(b.rank, 0));
        else l.sort((a, b) => num(a.rank, 0) - num(b.rank, 0) || String(a.code || '').localeCompare(String(b.code || '')));
      }
      return { byCol };
    }, [scope, cols, whoF]);
    const colsInfo = useMemo(() => cols.map((c) => ({ id: c.id, name: c.name, category: c.category, wip: c.wip, full: !!(c.wip && wipCounts.get(c.id) >= c.wip) })), [cols, wipCounts]);
    /* antigüedad en la columna: a hoy (es la posición actual de la tarjeta) */
    const days = useMemo(() => { const m = new Map(); for (const it of items) m.set(it.id, daysIn(it, today)); return m; }, [items, today]);
    /* métricas de flujo del alcance filtrado (iteración y release) hasta la fecha de corte del proyecto */
    const flow = useMemo(() => {
      const from = D.add(cut, -27);
      const cyc = [], lead = [];
      let thr = 0, thrEst = 0, blocked = 0;
      for (const it of scope) {
        const cat = A.category(st, it.status);
        if (cat === 'terminado') {
          if (!D.valid(it.doneDate) || it.doneDate > cut) continue;
          const s = firstStart(st, it);
          if (s && s <= it.doneDate) cyc.push(D.diff(s, it.doneDate));
          if (D.valid(it.createdAt) && it.createdAt <= it.doneDate) lead.push(D.diff(it.createdAt, it.doneDate));
          if (it.doneDate >= from) { thr++; thrEst += A.estimate(it); }
        } else if (cat !== 'nuevo' && it.blocked) blocked++;
      }
      return { cycle: mean(cyc), nCycle: cyc.length, lead: mean(lead), nLead: lead.length, thr, thrEst, blocked };
    }, [scope, st, cut]);
    const bringCount = useMemo(() => items.filter((it) => A.countable(it) && A.category(st, it.status) === 'nuevo' && (sprintF ? it.sprintId === sprintF : !relV || it.releaseId === relV)).length, [items, st, sprintF, relV]);

    const live = useRef(null);
    live.current = { model, items, byId, settings: st, cols, sprints: model.sprints, releases: model.releases, save: opt.save, saveMany: opt.saveMany, remove: opt.remove, removeMany: opt.removeMany, canWrite, wipCounts, project, sprintF, relF: relV, unit };
    const getLive = useCallback(() => live.current, []);

    const api = useMemo(() => {
      const o = {
        open: (id) => openItemEditor(getLive, id),
        cardClick(e, id) {
          if (drag.current && drag.current.moved) return;
          const t = e.target;
          if (t && t.closest && t.closest('button, a, input, select, textarea, .menu')) return;
          o.open(id);
        },
        /* mueve a otra columna; si la columna está llena pide confirmación (política WIP) */
        async move(id, colId, act) {
          const L = live.current; if (!L.canWrite) return;
          const it = L.byId.get(id);
          const col = L.cols.find((c) => c.id === colId);
          if (!it || !col || it.status === colId) return;
          const n = L.wipCounts.get(colId) || 0;
          if (col.wip && n >= col.wip) {
            const ok = await PM.confirm({
              title: 'Límite WIP de «' + col.name + '»',
              body: html`<div class="stack-sm"><p>La columna «${col.name}» ya tiene ${n} de ${col.wip} elementos en todo el tablero (límite WIP). La política del tablero es terminar antes de empezar trabajo nuevo.</p><p class="small muted">Mueve ${it.code || 'la tarjeta'} solo si el equipo lo acordó; la columna quedará marcada como «Límite WIP superado».</p></div>`,
              confirmText: 'Mover de todas formas',
            });
            if (!ok) return;
          }
          const L2 = live.current;
          const fresh = L2.byId.get(id) || it;
          const next = A.withStatus(L2.settings, fresh, colId, D.today());
          pending.current = { id, act, t: Date.now() };
          L2.save(next);
          setSay((it.code || 'La tarjeta') + ' pasó a «' + col.name + '».' + (col.category === 'terminado' && next.doneDate ? ' Terminado el ' + fmt.date(next.doneDate) + '.' : ''));
        },
        cardKey(e, id, ci) {
          const k = e.key;
          if (k === 'ArrowLeft' || k === 'ArrowRight') {
            if (!live.current.canWrite) return;
            e.preventDefault();
            const cs = live.current.cols;
            const t = cs[ci + (k === 'ArrowRight' ? 1 : -1)];
            if (t) o.move(id, t.id, 'open');
          } else if (k === 'ArrowDown' || k === 'ArrowUp') {
            e.preventDefault();
            const list = e.currentTarget.closest('.agk-list');
            const btns = list ? [...list.querySelectorAll('.agk-card-title')] : [];
            const i = btns.indexOf(e.currentTarget);
            const n = btns[i + (k === 'ArrowDown' ? 1 : -1)];
            if (n) n.focus();
          }
        },
        /* arrastrar entre columnas con el ratón o lápiz (en pantallas táctiles: botones o «Mover a…») */
        dragStart(e, id) {
          if (!live.current.canWrite || e.button !== 0 || e.pointerType === 'touch') return;
          if (e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, .menu')) return;
          const it = live.current.byId.get(id); if (!it) return;
          const s = { id, x: e.clientX, y: e.clientY, moved: false, col: null, ghost: null };
          drag.current = s;
          const colAt = (x, y) => { const el = document.elementFromPoint(x, y); const c = el && el.closest ? el.closest('[data-agk-col]') : null; return c ? c.dataset.agkCol : null; };
          const onMove = (ev) => {
            if (!s.moved) {
              if (Math.abs(ev.clientX - s.x) + Math.abs(ev.clientY - s.y) < 6) return;
              s.moved = true; document.body.classList.add('agb-dragging'); setDragId(id);
              const g = document.createElement('div'); g.className = 'agk-ghost'; g.setAttribute('aria-hidden', 'true');
              const tag = document.createElement('span'); tag.className = 'code-tag'; tag.textContent = it.code || '';
              g.appendChild(tag); g.appendChild(document.createTextNode(it.title || 'Sin título'));
              document.body.appendChild(g); s.ghost = g;
            }
            ev.preventDefault();
            if (s.ghost) s.ghost.style.transform = 'translate(' + (ev.clientX + 12) + 'px,' + (ev.clientY + 10) + 'px)';
            const c = colAt(ev.clientX, ev.clientY);
            if (c !== s.col) { s.col = c; setDropCol(c); }
            const b = boardRef.current;
            if (b) { const r = b.getBoundingClientRect(); if (ev.clientX > r.right - 50) b.scrollLeft += 18; else if (ev.clientX < r.left + 50) b.scrollLeft -= 18; }
            if (ev.clientY < 60) window.scrollBy(0, -16); else if (ev.clientY > window.innerHeight - 60) window.scrollBy(0, 16);
          };
          const end = (commit) => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel); window.removeEventListener('keydown', onKey, true);
            document.body.classList.remove('agb-dragging');
            if (s.ghost) s.ghost.remove();
            setDropCol(null); setDragId(null);
            if (commit && s.moved && s.col) o.move(id, s.col, 'open');
            setTimeout(() => { if (drag.current === s) drag.current = null; }, 0);
          };
          const onUp = () => end(true);
          const onCancel = () => end(false);
          const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); end(false); } };
          window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onCancel); window.addEventListener('keydown', onKey, true);
        },
      };
      return o;
    }, []);
    /* el foco sigue a la tarjeta movida con el teclado o los botones */
    useLayoutEffect(() => {
      const p = pending.current; if (!p) return;
      if (Date.now() - p.t > 2500) { pending.current = null; return; }
      const card = document.querySelector('[data-agk-card="' + cssEsc(p.id) + '"]'); if (!card) return;
      const ae = document.activeElement;
      if (ae && ae !== document.body && !card.contains(ae)) { pending.current = null; return; }
      let b = card.querySelector('[data-act="' + p.act + '"]');
      if (!b || b.disabled) b = card.querySelector('[data-act="open"]');
      if (b && ae !== b) b.focus();
    });

    const header = (actions) => html`<${ui.PageHeader} eyebrow="4.3 Dirigir y gestionar el trabajo del proyecto · Kanban" title="Tablero Kanban"
      description="Visualiza el flujo de trabajo, limita el trabajo en curso (WIP) y detecta bloqueos. Mover una tarjeta a «Terminado» registra su fecha de terminación para la velocidad, el burndown y las métricas de flujo."
      actions=${actions} />`;
    if (model.loading && !items.length) return html`<div class="page">${header(null)}<${ui.Loading} rows=${6} /></div>`;

    const openBring = () => PM.openModal((close) => html`<${BringDialog} close=${close} getLive=${getLive} />`);
    const openCols = () => PM.openModal((close) => html`<${ColumnsDialog} close=${close} getLive=${getLive} />`);
    const actions = html`
      ${canWrite ? html`<${ui.Button} icon="backlog" onClick=${openBring}>Traer del backlog${bringCount ? ' (' + bringCount + ')' : ''}</${ui.Button}>` : null}
      ${canWrite ? html`<${ui.Button} icon="kanban" onClick=${openCols}>Editar columnas</${ui.Button}>` : null}
      <${ui.Button} icon="settings" onClick=${() => PM.agileSettingsDialog(live.current)}>Configuración ágil</${ui.Button}>
      <${ui.Button} variant="ghost" icon="backlog" onClick=${() => PM.navigate('backlog')}>Ir al backlog</${ui.Button}>`;
    const sp = sprintF ? lk.spr.get(sprintF) : null;
    const cal = model.sched && model.sched.cal;
    /* días hábiles restantes de la iteración desde la fecha de corte (igual que el tablero del proyecto) */
    let left = null;
    if (sp && sp.status === 'en-curso' && cal && D.valid(sp.end)) {
      const from = D.valid(sp.start) && sp.start > cut ? sp.start : D.add(cut, 1);
      left = cut >= sp.end ? 0 : cal.countWork(from, sp.end);
    }
    const atCut = cut !== today ? ' · al corte del ' + fmt.date(cut) : '';
    const sprintOpts = [{ value: '', label: 'Todo el flujo' }, ...model.sprints.map((s) => ({ value: s.id, label: (s.name || 'Iteración') + ' · ' + (SPRINT_STATUS[s.status] || 'Planeado') }))];
    const hasCountable = items.some(A.countable);
    const boardEmpty = ![...board.byCol.values()].some((l) => l.length > 0);
    /* alguna columna con límite WIP tiene tarjetas que el filtro oculta: su conteo WIP las incluye (se avisa) */
    const hiddenByFilter = cols.some((c) => c.wip && (board.byCol.get(c.id) || []).length !== (wipCounts.get(c.id) || 0));

    return html`<div class="page agk-page">
      ${header(actions)}
      <div class="agk-filters" role="group" aria-label="Filtros del tablero">
        <${ui.Field} label="Iteración" for="agk-f-sprint"><${ui.Select} id="agk-f-sprint" value=${sprintF} options=${sprintOpts} onValue=${(v) => setSprintSel(v)} /></${ui.Field}>
        <${ui.Field} label="Release" for="agk-f-rel"><${ui.Select} id="agk-f-rel" value=${relV} placeholder="Todos los releases" options=${model.releases.map((r) => ({ value: r.id, label: r.name || 'Release' }))} onValue=${setRelF} /></${ui.Field}>
        <${ui.Field} label="Responsable" for="agk-f-who"><${ui.Select} id="agk-f-who" value=${whoF} placeholder="Todo el equipo" options=${[{ value: NONE, label: 'Sin responsable' }, ...people.map((p) => ({ value: p, label: p }))]} onValue=${setWhoF} /></${ui.Field}>
      </div>
      ${sp ? html`<div class="agk-sprint" data-agk-sprint=${sp.id}><${ui.Icon} name="sprint" size=${15} /><strong style="color:var(--fg)">${sp.name}</strong>
        <span>${fmt.date(sp.start, 'dm')} – ${fmt.date(sp.end, 'dm')}</span><${ui.Chip} tone=${sp.status === 'en-curso' ? 'accent' : sp.status === 'cerrado' ? 'good' : 'outline'}>${SPRINT_STATUS[sp.status] || 'Planeado'}</${ui.Chip}>
        ${left !== null ? html`<span>${left === 1 ? 'Queda 1 día hábil' : 'Quedan ' + fmt.num(left) + ' días hábiles'}</span>` : null}${sp.goal ? html`<span>Objetivo: ${sp.goal}</span>` : null}</div>`
        : html`<div class="agk-sprint"><${ui.Icon} name="kanban" size=${15} /><span>${relV ? 'Flujo del release «' + ((lk.rel.get(relV) || {}).name || '') + '»' : 'Todo el flujo: todas las tarjetas del tablero, de cualquier iteración.'}</span></div>`}

      <section class="card agb-tiles-card" aria-label="Métricas de flujo" data-agk-metrics="1">
        <div class="agb-tiles">
          <${Tile} id="cycle" label="Tiempo de ciclo promedio" value=${flow.cycle === null ? '—' : fmt.days(flow.cycle)} sub=${(flow.nCycle ? 'De la primera entrada a «en curso» a terminado · ' + plural(flow.nCycle, 'elemento', 'elementos') : 'Aún no hay elementos terminados con historial') + atCut} />
          <${Tile} id="lead" label="Tiempo de entrega promedio" value=${flow.lead === null ? '—' : fmt.days(flow.lead)} sub=${(flow.nLead ? 'De la creación a terminado · ' + plural(flow.nLead, 'elemento', 'elementos') : 'Sin elementos terminados') + atCut} />
          <${Tile} id="thr" label="Rendimiento (últimas 4 semanas)" value=${plural(flow.thr, 'elemento', 'elementos')} sub=${fmt.num(flow.thrEst, 1) + ' ' + unit + ' · ' + fmt.num(flow.thr / 4, 1) + ' por semana' + atCut} title=${'Terminados entre el ' + fmt.date(D.add(cut, -27)) + ' y el ' + fmt.date(cut) + (cut !== today ? ' (fecha de corte del proyecto)' : '')} />
          <${Tile} id="blocked" label="Elementos bloqueados" value=${fmt.num(flow.blocked)} tone=${flow.blocked ? 'crit' : undefined} sub=${flow.blocked ? 'Resuélvelos antes de empezar trabajo nuevo' : 'Ningún bloqueo en el flujo'} />
        </div>
      </section>

      ${!canWrite ? html`<${Note} icon="lock">Modo de solo lectura: puedes consultar el tablero, pero no mover tarjetas ni editar columnas.</${Note}>` : null}
      ${hiddenByFilter ? html`<${Note} icon="filter"><span data-agk-wipnote="1">El conteo y el límite WIP de cada columna incluyen todas sus tarjetas, también las que el filtro oculta (otras iteraciones, otros releases o el resto del equipo): el WIP es el trabajo en curso real del equipo.</span></${Note}>` : null}
      ${!hasCountable ? html`<${Note} icon="info">El tablero está vacío: crea elementos en el backlog del producto y pásalos a «${A.firstColumn(st).name}» con «Traer del backlog».
        <div style="margin-top:6px"><${ui.Button} size="sm" icon="backlog" onClick=${() => PM.navigate('backlog')}>Ir al backlog</${ui.Button}></div></${Note}>`
        : boardEmpty ? html`<${Note} icon="info">No hay tarjetas en el tablero para este filtro.${canWrite && bringCount ? ' Usa «Traer del backlog» para pasar elementos a «' + A.firstColumn(st).name + '».' : ''}</${Note}>` : null}

      <div class="agk-board" ref=${boardRef} data-agk-board="1">
        ${cols.map((c, ci) => {
          const list = board.byCol.get(c.id) || [];
          const n = wipCounts.get(c.id) || 0;
          const over = !!(c.wip && n > c.wip);
          const full = !!(c.wip && n === c.wip);
          const doneCol = c.category === 'terminado';
          const shown = doneCol && !allDone && list.length > DONE_LIMIT ? list.slice(0, DONE_LIMIT) : list;
          return html`<section key=${c.id} class=${cx('agk-col', over && 'is-over', dropCol === c.id && 'is-drop')} data-agk-col=${c.id} aria-labelledby=${'agk-h-' + c.id}>
            <header class="agk-col-head">
              <div class="row-between" style="flex-wrap:nowrap"><h3 class="agk-col-name" id=${'agk-h-' + c.id}>${c.name}</h3>
                <span class="agk-count" data-agk-count=${c.id} aria-label=${plural(n, 'elemento', 'elementos') + ' en la columna' + (c.wip ? ', límite WIP ' + c.wip : ', sin límite WIP')}>${c.wip ? n + ' / ' + c.wip : n}</span></div>
              <div class="xsmall faint">${CAT_LABEL[c.category]} · ${c.wip ? 'límite WIP ' + c.wip : 'sin límite WIP'}${list.length !== n ? html` · <span data-agk-visible=${c.id}>${list.length === 1 ? '1 visible' : list.length + ' visibles'} con el filtro</span>` : ''}</div>
              ${over ? html`<div class="agk-wip-alert" data-agk-wip=${c.id}><${ui.Icon} name="alert" size=${14} />Límite WIP superado (${n} de ${c.wip})</div>` : full ? html`<div class="agk-wip-full"><${ui.Icon} name="info" size=${14} />Límite WIP alcanzado</div>` : null}
            </header>
            <div class="agk-list">
              ${shown.map((it) => html`<${KanbanCard} key=${it.id} it=${it} ci=${ci} cols=${colsInfo} days=${days.get(it.id)} canWrite=${canWrite} api=${api} dragging=${dragId === it.id} unit=${unit} />`)}
              ${!list.length ? html`<div class="agk-empty">Sin tarjetas${canWrite ? ': arrastra aquí o usa «Mover a…»' : ''}</div>` : null}
              ${shown.length < list.length ? html`<${ui.Button} size="sm" variant="ghost" icon="chevron-down" onClick=${() => setAllDone(true)}>Mostrar los ${list.length} terminados</${ui.Button}>` : null}
            </div>
          </section>`;
        })}
      </div>
      <p class="xsmall faint" id="agk-kbd-hint">${canWrite ? 'Teclado: en el título de una tarjeta, las flechas izquierda y derecha la mueven a la columna anterior o siguiente, arriba y abajo recorren la columna y Enter abre el editor. Mover a una columna en su límite WIP pide confirmación.' : 'Enter sobre el título de una tarjeta abre su detalle; arriba y abajo recorren la columna.'}</p>
      <div class="sr-only" aria-live="polite" data-agk-live="1">${say}</div>
    </div>`;
  }

  /* ---------------------------------------------------------------- registro de vistas */
  PM.registerView({ id: 'backlog', label: 'Backlog del producto', group: 'agil', icon: 'backlog', order: 10, component: BacklogView, needsProject: true, when: A.when, unavailable: PM.AgileUnavailable, description: 'Lista priorizada del producto: historias, épicas, refinamiento, releases e iteraciones (5.2 / 5.3, enfoque adaptativo).' });
  PM.registerView({ id: 'kanban', label: 'Tablero Kanban', group: 'agil', icon: 'kanban', order: 20, component: KanbanView, needsProject: true, when: A.when, unavailable: PM.AgileUnavailable, description: 'Flujo de trabajo con límites WIP, bloqueos y métricas de ciclo, entrega y rendimiento (4.3).' });
})();

/* ==========================================================================
   30-wbs.js — vista "EDT" (5.4 Crear la EDT/WBS): editor de esquema de la
   estructura de desglose del trabajo, diagrama jerárquico clásico y
   diccionario de la EDT. Datos: projects/{pid}/tools/wbs (ver SPEC §3).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, h, Component, useState, useEffect, useMemo, useRef, useLayoutEffect } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;
  const num = PM.num;
  const ROOT = '__root__';

  /* ---------------------------------------------------------------- estilos */
  const STYLE = `
.wbs-kpis { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 26px; padding: 12px 16px; }
.wbs-kpi { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.wbs-kpi-v { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl); font-stretch: 105%; line-height: 1.1; font-variant-numeric: tabular-nums; }
.wbs-kpi-l { font-size: var(--fs-xs); color: var(--fg-2); }
.wbs-bl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-left: auto; min-width: 0; }
.wbs-bl-changed { color: var(--warn); font-weight: 500; }
@media (max-width: 900px) { .wbs-bl { margin-left: 0; width: 100%; } }
.wbs-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
.wbs-layout.has-panel { grid-template-columns: minmax(0, 1fr) 360px; }
.wbs-main { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.wbs-panel { position: sticky; top: 16px; max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px); overflow-y: auto; }
.wbs-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--surface); z-index: 2; }
.wbs-panel-body { padding: 14px; }
.wbs-toolbar { gap: 6px; }
.wbs-keys { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-xs); color: var(--fg-3); }
.wbs-keys .kbd { margin-right: 2px; }
@media (max-width: 700px) { .wbs-keys { display: none; } }
.wbs-tb-right { margin-left: auto; display: inline-flex; gap: 4px; flex-wrap: nowrap; }
.wbs-table { font-size: var(--fs-sm); }
.wbs-table td { padding: 3px 6px; vertical-align: middle; }
.wbs-table th { padding: 7px 6px; }
.wbs-table .wbs-c-menu { width: 1%; padding-left: 4px; padding-right: 0; }
.wbs-table .wbs-c-code { width: 1%; white-space: nowrap; }
.wbs-table tbody tr.is-selected > td, .wbs-table tbody tr.is-selected:hover > td { background: var(--accent-wash); }
.wbs-table tbody tr.wbs-root > td { background: var(--surface-2); }
.wbs-table tbody tr.wbs-root.is-selected > td { background: var(--accent-wash); }
.wbs-code-btn { font-family: var(--font-mono); font-size: var(--fs-xs); line-height: 1.5; color: var(--fg-2); padding: 2px 5px; border: 0; background: transparent; border-radius: var(--r-sm); cursor: pointer; white-space: nowrap; display: inline-block; }
.wbs-code-btn:hover { background: var(--surface-3); color: var(--fg); }
.wbs-row .wbs-c-menu .btn { visibility: hidden; }
.wbs-row.is-selected .wbs-c-menu .btn, .wbs-row:hover .wbs-c-menu .btn, .wbs-row:focus-within .wbs-c-menu .btn, .wbs-row.wbs-root .wbs-c-menu .btn, .wbs-c-menu .btn[aria-expanded="true"] { visibility: visible; }
.wbs-namecell { display: flex; align-items: center; gap: 4px; min-width: 240px; }
.wbs-name-input { flex: 1 1 auto; min-width: 150px; font-weight: 500; }
.wbs-name-view { flex: 1 1 auto; min-width: 150px; padding: 4px 6px; border: 1px solid transparent; border-radius: var(--r-sm); min-height: 28px; line-height: 1.35; font-weight: 500; overflow-wrap: anywhere; }
.wbs-name-view.is-editable { cursor: text; }
.wbs-name-view.is-editable:hover { border-color: var(--line); background: var(--surface); }
.wbs-row.d1 .wbs-name-input, .wbs-row.d1 .wbs-name-view { font-weight: 650; }
.table-wrap.wbs-fit { overflow-x: clip; }
@media (pointer: fine) { .wbs-code-btn.is-draggable { cursor: grab; touch-action: none; } }
body.wbs-dragging, body.wbs-dragging * { cursor: grabbing !important; user-select: none !important; }
body.wbs-dragging .wbs-name-view.is-editable:hover { border-color: transparent; background: transparent; }
.wbs-table tbody tr.wbs-drop-before > td { box-shadow: inset 0 2px 0 var(--accent); }
.wbs-table tbody tr.wbs-drop-after > td { box-shadow: inset 0 -2px 0 var(--accent); }
.wbs-table tbody tr.wbs-drop-inside > td { background: var(--accent-wash); box-shadow: inset 0 1px 0 var(--accent), inset 0 -1px 0 var(--accent); }
.wbs-table tbody tr.wbs-drag-src > td { opacity: 0.55; }
.wbs-pager { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; font-size: var(--fs-xs); color: var(--fg-2); }
.wbs-root-name { font-family: var(--font-display); font-weight: 700; padding: 4px 6px; flex: 1; min-width: 0; }
.wbs-toggle { width: 22px; height: 22px; flex: none; border: 0; background: transparent; color: var(--fg-3); border-radius: var(--r-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.wbs-toggle:hover { background: var(--surface-3); color: var(--fg); }
.wbs-toggle-sp { width: 22px; flex: none; }
.wbs-hidden { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--fg-3); white-space: nowrap; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 0 4px; }
.wbs-new-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--signal); flex: none; display: inline-block; vertical-align: middle; margin-left: 6px; }
.wbs-c-money { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.wbs-c-date { white-space: nowrap; font-variant-numeric: tabular-nums; }
.wbs-sub { color: var(--fg-2); }
.wbs-prog { display: flex; align-items: center; gap: 6px; justify-content: flex-end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.wbs-prog-bar { width: 44px; height: 5px; border-radius: 3px; background: var(--surface-3); flex: none; }
.wbs-kind { appearance: none; -webkit-appearance: none; border: 1px solid transparent; border-radius: 999px; font-size: var(--fs-xs); font-weight: 500; line-height: 1.6; padding: 1px 22px 1px 9px; background-color: var(--surface-3); color: var(--fg-2); cursor: pointer; max-width: 100%;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position: calc(100% - 12px) 55%, calc(100% - 8px) 55%; background-size: 4px 4px; background-repeat: no-repeat; }
.wbs-kind:hover { border-color: var(--line-strong); }
.wbs-kind:focus { outline: none; box-shadow: var(--focus); }
.wbs-kind.k-paquete { background-color: var(--accent-wash); color: var(--accent); }
.wbs-kind.k-fase { background-color: var(--signal-wash); color: var(--signal); }
.wbs-kind.k-cuenta-control { background-color: transparent; border-color: var(--line-strong); }
.wbs-kind option { color: var(--fg); background: var(--surface); }
.wbs-rowmenu { position: fixed; z-index: 70; min-width: 230px; }
.wbs-notice { display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; border: 1px solid var(--line); border-left: 3px solid var(--warn); border-radius: var(--r-md); background: var(--surface); font-size: var(--fs-sm); color: var(--fg-2); }
.wbs-notice > .icon { color: var(--warn); margin-top: 3px; }
.wbs-notice ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.wbs-notice.info { border-left-color: var(--info); }
.wbs-notice.info > .icon { color: var(--info); }
.wbs-codes { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-left: 6px; vertical-align: middle; }
.wbs-codes button { font-family: var(--font-mono); font-size: 0.6875rem; border: 1px solid var(--line); background: var(--surface-2); color: var(--fg-2); border-radius: var(--r-sm); padding: 0 5px; cursor: pointer; line-height: 1.6; }
.wbs-codes button:hover { border-color: var(--accent); color: var(--accent); }
.wbs-ro { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wbs-ro-k { font-size: var(--fs-xs); font-weight: 600; color: var(--fg-2); }
.wbs-ro-v { white-space: pre-wrap; overflow-wrap: anywhere; }
.wbs-sumgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.wbs-acts { display: flex; flex-direction: column; gap: 6px; }
.wbs-act { border: 1px solid var(--line); border-radius: var(--r-md); padding: 7px 9px; display: flex; flex-direction: column; gap: 3px; background: var(--surface-2); }
.wbs-act-name { font-weight: 500; font-size: var(--fs-sm); overflow-wrap: anywhere; }
.wbs-sec-title { font-size: var(--fs-sm); font-weight: 600; display: flex; align-items: center; gap: 6px; }
.wbs-chart { padding: 4px 0 6px; }
.wbs-chart svg { margin: 0 auto; }
.wbs-zoom { display: inline-flex; align-items: center; gap: 2px; }
.wbs-zoom-v { min-width: 46px; text-align: center; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; color: var(--fg-2); }
.chart .wbs-dg-link { fill: none; stroke: var(--line-strong); stroke-width: 1.25; }
.chart .wbs-dg-rect { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }
.chart .wbs-dg-l1 .wbs-dg-rect { fill: var(--surface-3); }
.chart .wbs-dg-wp .wbs-dg-rect { fill: var(--accent-wash); stroke: var(--accent); stroke-width: 2; }
.chart .wbs-dg-root .wbs-dg-rect { fill: var(--accent); stroke: var(--accent); }
.chart text.wbs-dg-code { font-family: var(--font-mono); font-size: 10.5px; fill: var(--fg-2); }
.chart text.wbs-dg-more { font-family: var(--font-mono); font-size: 10px; fill: var(--fg-3); }
.chart text.wbs-dg-name { font-size: 12px; font-weight: 500; fill: var(--fg); }
.chart text.wbs-dg-name.is-empty { fill: var(--fg-3); font-style: italic; }
.chart .wbs-dg-root text.wbs-dg-code, .chart .wbs-dg-root text.wbs-dg-name { fill: var(--accent-fg); }
.chart .wbs-dg-root text.wbs-dg-name { font-size: 13px; font-weight: 600; }
.wbs-dg-box { cursor: pointer; outline: none; }
.wbs-dg-root { cursor: default; }
.chart .wbs-dg-box:not(.wbs-dg-root):hover .wbs-dg-rect { stroke: var(--fg-2); }
.chart .wbs-dg-box.wbs-dg-wp:not(.wbs-dg-root):hover .wbs-dg-rect { stroke: var(--accent); stroke-width: 3; }
.chart .wbs-dg-box:focus-visible .wbs-dg-rect { stroke: var(--fg); stroke-width: 2.5; }
.wbs-sw { width: 14px; height: 10px; border-radius: 2px; display: inline-block; border: 1px solid var(--line-strong); background: var(--surface); }
.wbs-sw.root { background: var(--accent); border-color: var(--accent); }
.wbs-sw.l1 { background: var(--surface-3); }
.wbs-sw.wp { background: var(--accent-wash); border: 2px solid var(--accent); }
.wbs-dict td { vertical-align: top; }
.wbs-dict .wbs-c-code { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--fg-2); white-space: nowrap; padding-top: 9px; }
.wbs-dict.table-edit .wbs-c-code { padding-left: 10px; }
.wbs-dict .wbs-dc-name { min-width: 140px; } .wbs-dict .wbs-dc-desc, .wbs-dict .wbs-dc-acc { min-width: 180px; }
.wbs-dict .wbs-dc-resp { min-width: 135px; }
.wbs-dict textarea.wbs-dc-name { resize: none; } .wbs-dict .wbs-dc-cost { min-width: 110px; } .wbs-dict .wbs-dc-deliv { min-width: 140px; }
.wbs-ta { resize: vertical; overflow: hidden; display: block; min-height: 28px; }
.wbs-dict tfoot td { font-weight: 600; background: var(--surface-2); border-top: 1px solid var(--line-strong); padding: 8px 10px; }
.wbs-dict-ro { white-space: pre-wrap; overflow-wrap: anywhere; padding: 4px 6px; }
.wbs-dict-kind { margin-top: 2px; padding-left: 6px; }
.wbs-tpls { display: grid; gap: 10px; }
.wbs-tpl { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; background: var(--surface); }
.wbs-tpl:hover { border-color: var(--line-strong); }
.wbs-tpl-l1 { display: flex; flex-wrap: wrap; gap: 4px; }
.wbs-tpl-l1 .chip { white-space: normal; }
`;
  if (!document.getElementById('css-wbs')) { const st = document.createElement('style'); st.id = 'css-wbs'; st.textContent = STYLE; document.head.appendChild(st); }

  /* ---------------------------------------------------------------- tipos de elemento */
  const KINDS = [
    { id: 'fase', label: 'Fase', tone: 'signal' },
    { id: 'entregable', label: 'Entregable', tone: null },
    { id: 'cuenta-control', label: 'Cuenta de control', tone: 'outline' },
    { id: 'paquete', label: 'Paquete de trabajo', tone: 'accent' },
  ];
  const KIND_BY_ID = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const normKind = (k) => {
    const s = PM.slug(k);
    if (!s) return null;
    if (s.includes('paquete') || s.includes('work')) return 'paquete';
    if (s.includes('cuenta') || s.includes('control')) return 'cuenta-control';
    if (s.includes('fase') || s.includes('phase')) return 'fase';
    if (s.includes('entregable') || s.includes('deliverable')) return 'entregable';
    return null;
  };
  /* Tipo efectivo: los elementos del nivel más bajo son paquetes de trabajo por defecto; un elemento con hijos no puede ser paquete. */
  const kindOf = (node, isLeaf) => { const k = normKind(node && node.kind); if (k === 'paquete' && !isLeaf) return 'entregable'; return k || (isLeaf ? 'paquete' : 'entregable'); };
  const KindChip = ({ kind }) => { const k = KIND_BY_ID[kind] || KIND_BY_ID.entregable; return html`<${ui.Chip} tone=${k.tone}>${k.label}</${ui.Chip}>`; };

  const DEFAULT_ROLES = ['Director de proyecto', 'Ingeniero de diseño', 'Residente de obra', 'Coordinador SST (HSE)', 'Coordinador logístico', 'Supervisor de montaje', 'Cuadrilla de montaje', 'Almacén', 'Facturación y cartera'];

  /* ---------------------------------------------------------------- utilidades */
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const txt = (v) => String(v == null ? '' : v).trim();
  const clip = (s, n) => { const t = txt(s); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
  const cssId = (id) => (window.CSS && window.CSS.escape ? window.CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&'));
  const focusInput = (id) => {
    const el = document.querySelector('[data-wbs-input="' + cssId(id) + '"]');
    if (!el) return false;
    try { el.focus({ preventScroll: false }); const n = el.value.length; el.setSelectionRange(n, n); } catch (e) { /* sin selección */ }
    return true;
  };
  /* Foco en el nombre (modo lectura de la fila); si la fila está en edición, en su campo. */
  const focusName = (id) => {
    const el = document.querySelector('[data-wbs-name="' + cssId(id) + '"]');
    if (!el) return focusInput(id);
    try { el.focus({ preventScroll: false }); } catch (e) { /* sin foco */ }
    return true;
  };
  function useMedia(query) {
    const get = () => { try { return window.matchMedia(query).matches; } catch (e) { return false; } };
    const [m, setM] = useState(get);
    useEffect(() => {
      let mq; try { mq = window.matchMedia(query); } catch (e) { return undefined; }
      const f = () => setM(mq.matches);
      if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f);
      f();
      return () => { if (mq.removeEventListener) mq.removeEventListener('change', f); else mq.removeListener(f); };
    }, [query]);
    return m;
  }
  /* Componente memorizado por firma: solo se vuelve a dibujar si cambia props.sig. */
  function memoBy(Impl) {
    return class extends Component {
      shouldComponentUpdate(next) { return next.sig !== this.props.sig; }
      render(props) { return h(Impl, props); }
    };
  }

  /* Contenedor de tabla que solo crea el área de desplazamiento horizontal cuando la tabla no cabe:
     un contenedor con desplazamiento encarece mucho el pintado de tablas grandes con controles. */
  function FitWrap({ children, class: cls }) {
    const ref = useRef(null);
    const [fits, setFits] = useState(false);
    useLayoutEffect(() => {
      const w = ref.current; if (!w) return undefined;
      const upd = () => { const t = w.firstElementChild; setFits(!!t && t.offsetWidth <= w.clientWidth + 1); };
      upd();
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }
      const ro = new ResizeObserver(upd); ro.observe(w); if (w.firstElementChild) ro.observe(w.firstElementChild);
      return () => ro.disconnect();
    }, []);
    return html`<div ref=${ref} class=${cx('table-wrap', fits && 'wbs-fit', cls)}>${children}</div>`;
  }

  /* ---------------------------------------------------------------- operaciones de árbol (puras) */
  function listsOf(nodes) {
    const tree = PM.calc.wbsTree(nodes);
    const lists = new Map([['root', tree.childrenOf(null).map((n) => n.id)]]);
    for (const n of tree.nodes) lists.set(n.id, tree.childrenOf(n.id).map((c) => c.id));
    /* elementos con padres en ciclo (datos importados dañados): pasan al primer nivel en la siguiente edición */
    if (tree.parentOf.size < tree.nodes.length) {
      const lost = new Set(tree.nodes.filter((n) => !tree.parentOf.has(n.id)).map((n) => n.id));
      for (const [k, ids] of lists) if (k !== 'root') lists.set(k, ids.filter((x) => !lost.has(x)));
      lists.set('root', [...lists.get('root'), ...lost]);
    }
    return { tree, lists };
  }
  function fromLists(nodes, lists) {
    const parent = new Map(), order = new Map();
    for (const [k, ids] of lists) ids.forEach((id, i) => { parent.set(id, k === 'root' ? null : k); order.set(id, i + 1); });
    return nodes.filter((n) => n && parent.has(n.id)).map((n) => ({ ...n, parentId: parent.get(n.id), order: order.get(n.id) }));
  }
  const renumber = (nodes) => fromLists(nodes, listsOf(nodes).lists);
  const blankNode = (parentId) => ({ id: PM.uid('w'), parentId: parentId || null, name: '', order: 0, kind: '', description: '', responsible: '', deliverable: '', acceptance: '', costEstimate: null, notes: '' });
  const treeOps = {
    addChild(nodes, parentId) {
      const { lists } = listsOf(nodes);
      const key = parentId && lists.has(parentId) ? parentId : 'root';
      const n = blankNode(key === 'root' ? null : key);
      lists.set(key, [...lists.get(key), n.id]); lists.set(n.id, []);
      return { nodes: fromLists([...nodes, n], lists), id: n.id, expand: key === 'root' ? null : key };
    },
    addSibling(nodes, id) {
      const { tree, lists } = listsOf(nodes);
      const key = tree.parentOf.get(id) || 'root';
      const arr = [...lists.get(key)]; const i = arr.indexOf(id);
      const n = blankNode(key === 'root' ? null : key);
      arr.splice(i < 0 ? arr.length : i + 1, 0, n.id); lists.set(key, arr); lists.set(n.id, []);
      return { nodes: fromLists([...nodes, n], lists), id: n.id };
    },
    indent(nodes, id) {
      const { tree, lists } = listsOf(nodes);
      const key = tree.parentOf.get(id) || 'root';
      const arr = [...lists.get(key)]; const i = arr.indexOf(id);
      if (i <= 0) return null;
      const prev = arr[i - 1];
      arr.splice(i, 1); lists.set(key, arr);
      lists.set(prev, [...(lists.get(prev) || []), id]);
      return { nodes: fromLists(nodes, lists), id, expand: prev };
    },
    outdent(nodes, id) {
      const { tree, lists } = listsOf(nodes);
      const p = tree.parentOf.get(id);
      if (!p) return null;
      const gp = tree.parentOf.get(p) || 'root';
      lists.set(p, lists.get(p).filter((x) => x !== id));
      const arr = [...lists.get(gp)]; arr.splice(arr.indexOf(p) + 1, 0, id); lists.set(gp, arr);
      return { nodes: fromLists(nodes, lists), id };
    },
    /* Arrastrar y soltar: pos = 'before' | 'after' | 'inside' (último hijo). No admite soltar dentro de su propia rama. */
    moveTo(nodes, id, targetId, pos) {
      const { tree, lists } = listsOf(nodes);
      if (!tree.byId.has(id) || id === targetId) return null;
      if (targetId !== ROOT && (!tree.byId.has(targetId) || tree.descendants(id).includes(targetId))) return null;
      if (targetId === ROOT && pos !== 'inside') return null;
      const from = tree.parentOf.get(id) || 'root';
      lists.set(from, lists.get(from).filter((x) => x !== id));
      if (pos === 'inside') {
        const key = targetId === ROOT ? 'root' : targetId;
        lists.set(key, [...(lists.get(key) || []), id]);
        return { nodes: fromLists(nodes, lists), id, expand: key === 'root' ? null : key };
      }
      const key = tree.parentOf.get(targetId) || 'root';
      const arr = [...lists.get(key)]; const i = arr.indexOf(targetId);
      arr.splice(pos === 'before' ? i : i + 1, 0, id); lists.set(key, arr);
      return { nodes: fromLists(nodes, lists), id };
    },
    move(nodes, id, d) {
      const { tree, lists } = listsOf(nodes);
      const key = tree.parentOf.get(id) || 'root';
      const arr = lists.get(key); const i = arr.indexOf(id); const j = i + d;
      if (i < 0 || j < 0 || j >= arr.length) return null;
      lists.set(key, PM.moveItem(arr, i, j));
      return { nodes: fromLists(nodes, lists), id };
    },
  };

  /* Costo estimado consolidado: paquete = su valor; elemento con hijos = suma de sus hijos. */
  function estimates(tree) {
    const est = new Map();
    const walk = (id, guard) => {
      const kids = tree.childrenOf(id);
      let v = 0;
      if (!kids.length) v = id ? Math.max(0, num(tree.byId.get(id).costEstimate)) : 0;
      else if (guard < 64) for (const c of kids) v += walk(c.id, guard + 1);
      if (id) est.set(id, v);
      return v;
    };
    const total = walk(null, 0);
    return { est, total };
  }
  /* Consolidado de un conjunto de actividades (misma fórmula que PM.calc.rollupWbs). */
  function aggregate(tasks) {
    const cost = PM.sum(tasks, (t) => num(t.cost));
    const weight = cost > 0 ? (t) => num(t.cost) : (t) => Math.max(1, t.duration);
    const wsum = PM.sum(tasks, weight);
    return {
      tasks, cost, count: tasks.length,
      progress: wsum > 0 ? PM.sum(tasks, (t) => weight(t) * t.progress) / wsum : 0,
      start: tasks.length ? PM.date.min(...tasks.map((t) => t.startDate)) : null,
      finish: tasks.length ? PM.date.max(...tasks.map((t) => t.finishDate)) : null,
    };
  }
  const newTask = (node, code) => ({
    id: PM.uid('t'), name: txt(node.name) || 'Paquete de trabajo ' + code, wbsId: node.id, duration: 5, milestone: false, start: null,
    deps: [], progress: 0, cost: Math.max(0, num(node.costEstimate)) || 0, resources: [], responsible: txt(node.responsible), actualStart: null, actualFinish: null, notes: '',
  });
  /* Inserta la actividad después de la última actividad vinculada a un elemento anterior o igual en el orden de la EDT. */
  function insertTask(tasks, task, wbsIndex) {
    const k = wbsIndex.get(task.wbsId);
    let pos = -1, firstAfter = -1;
    tasks.forEach((t, i) => { const w = wbsIndex.get(t.wbsId); if (w === undefined) return; if (w <= k) pos = i; else if (firstAfter < 0) firstAfter = i; });
    const at = pos >= 0 ? pos + 1 : firstAfter >= 0 ? firstAfter : tasks.length;
    const out = [...tasks]; out.splice(at, 0, task); return out;
  }

  /* ---------------------------------------------------------------- plantillas de EDT */
  const T = (n, d, e, a, r, c, k) => ({ n, d, e, a, r, c, k });
  const TEMPLATES = [
    {
      id: 'andamio', name: 'Montaje de andamio / equipo en obra',
      description: 'Suministro, montaje, certificación, operación y retiro de andamios o formaletas en obra, con la gestión del proyecto como primer entregable.',
      items: [
        T('Gestión del proyecto', 'Trabajo de dirección del proyecto durante todo el ciclo de vida.', '', '', 'Director de proyecto', [
          T('Inicio y planificación', 'Acta de constitución, plan para la dirección del proyecto, cronograma y presupuesto aprobados.', 'Plan para la dirección del proyecto aprobado', 'Aprobado por el patrocinador y aceptado por el director de obra del cliente.', 'Director de proyecto'),
          T('Seguimiento y control', 'Informes semanales de avance, control de cambios, gestión de riesgos e incidentes y reuniones de obra.', 'Informes de desempeño del trabajo', 'Informe semanal emitido y revisado por la interventoría del cliente.', 'Director de proyecto'),
          T('Cierre del proyecto', 'Acta de entrega, facturación final, registro de lecciones aprendidas y archivo del proyecto.', 'Acta de cierre y aceptación final', 'Acta firmada por el cliente y facturación final radicada.', 'Director de proyecto'),
        ]),
        T('Ingeniería', 'Diseño técnico del sistema de andamio y de los procedimientos de trabajo seguro.', '', '', 'Ingeniero de diseño', [
          T('Levantamiento en obra', 'Visita técnica, medición de fachadas y niveles, verificación de puntos de anclaje y condiciones del terreno.', 'Informe de levantamiento con planos de referencia', 'Medidas verificadas contra los planos arquitectónicos del cliente.', 'Ingeniero de diseño'),
          T('Diseño y memoria de cálculo', 'Configuración del andamio, verificación estructural de cargas y anclajes y planos de montaje.', 'Planos y memoria de cálculo firmados', 'Revisados y firmados por un ingeniero con matrícula profesional vigente.', 'Ingeniero de diseño'),
          T('Plan de montaje y plan de rescate', 'Secuencia de montaje, análisis de riesgos, permisos de trabajo en alturas y procedimiento de rescate.', 'Plan de montaje y plan de rescate aprobados', 'Aprobados por el coordinador SST y la interventoría del cliente (Resolución 4272 de 2021).', 'Coordinador SST (HSE)'),
        ]),
        T('Suministro y logística', 'Preparación, inspección y transporte del equipo desde la bodega hasta la obra.', '', '', 'Coordinador logístico', [
          T('Alistamiento en bodega', 'Separación del equipo según la lista de materiales del diseño, conteo y empaque por etapas de montaje.', 'Remisión de despacho', 'Cantidades conformes con la lista de materiales del diseño.', 'Almacén'),
          T('Inspección de salida', 'Revisión del estado de marcos, plataformas, tubería y accesorios; separación de piezas no conformes.', 'Lista de chequeo de inspección de salida', 'Ninguna pieza no conforme despachada.', 'Almacén'),
          T('Transporte a obra', 'Programación de vehículos, permisos de cargue y descargue y entrega en obra.', 'Remisiones firmadas en obra', 'Equipo recibido a satisfacción por el residente de obra.', 'Coordinador logístico'),
        ]),
        T('Montaje', 'Montaje del andamio por etapas con cuadrilla certificada en trabajo en alturas.', '', '', 'Supervisor de montaje', [
          T('Montaje niveles 1 a 5', 'Montaje de la primera etapa, incluidos anclajes, arriostramientos y plataformas.', 'Tramo montado e inspeccionado', 'Lista de verificación de montaje aprobada por el supervisor de montaje.', 'Supervisor de montaje'),
          T('Montaje niveles 6 a 10', 'Montaje de la segunda etapa, incluidos anclajes, arriostramientos y plataformas.', 'Tramo montado e inspeccionado', 'Lista de verificación de montaje aprobada por el supervisor de montaje.', 'Supervisor de montaje'),
          T('Montaje niveles 11 a 15', 'Montaje de la tercera etapa y cubierta de coronación.', 'Tramo montado e inspeccionado', 'Lista de verificación de montaje aprobada por el supervisor de montaje.', 'Supervisor de montaje'),
          T('Accesos y protecciones', 'Escaleras de acceso, barandas, rodapiés, mallas y plataformas de descargue.', 'Accesos y protecciones instalados', 'Cumplen el plan de montaje y la inspección de SST.', 'Supervisor de montaje'),
        ]),
        T('Certificación y operación', 'Certificación del andamio y soporte durante el periodo de alquiler.', '', '', 'Coordinador SST (HSE)', [
          T('Inspección y certificación', 'Inspección por persona competente y emisión del certificado de uso del andamio.', 'Certificado de inspección del andamio', 'Certificado emitido sin observaciones abiertas.', 'Coordinador SST (HSE)'),
          T('Alquiler y mantenimiento en obra', 'Control del equipo en obra, inspecciones periódicas, ajustes y reposición de piezas.', 'Informes de inspección periódica', 'Inspecciones al día según el plan de mantenimiento.', 'Residente de obra'),
        ]),
        T('Desmontaje y retiro', 'Retiro del equipo de la obra y conciliación de cantidades y novedades.', '', '', 'Supervisor de montaje', [
          T('Desmontaje', 'Desmontaje en orden inverso al montaje, con control de trabajo en alturas.', 'Frente de obra liberado', 'Acta de liberación firmada por el director de obra del cliente.', 'Supervisor de montaje'),
          T('Transporte de retorno', 'Cargue, transporte y descargue del equipo en bodega.', 'Remisiones de retorno', 'Cantidades devueltas conciliadas con lo despachado.', 'Coordinador logístico'),
          T('Inspección de retorno', 'Revisión del equipo devuelto y registro de daños y faltantes para cobro al cliente.', 'Informe de novedades del equipo', 'Novedades conciliadas con el cliente y enviadas a facturación.', 'Almacén'),
        ]),
      ],
    },
    {
      id: 'construccion', name: 'Proyecto de construcción',
      description: 'Estructura genérica de una obra: gestión, diseños y permisos, preliminares, estructura, instalaciones, acabados y entrega.',
      items: [
        T('Gestión del proyecto', 'Dirección, seguimiento y cierre del proyecto.', '', '', 'Director de proyecto', [
          T('Planificación del proyecto', 'Plan para la dirección del proyecto, cronograma, presupuesto y plan de calidad.', 'Plan para la dirección del proyecto aprobado', 'Aprobado por el patrocinador.', 'Director de proyecto'),
          T('Seguimiento y control', 'Comités de obra, informes de avance, control de cambios y de riesgos.', 'Informes de desempeño del trabajo', 'Emitidos según el plan de comunicaciones.', 'Director de proyecto'),
          T('Cierre y liquidación', 'Liquidación de contratos, informe final y lecciones aprendidas.', 'Acta de liquidación', 'Firmada por el cliente y los contratistas.', 'Director de proyecto'),
        ]),
        T('Estudios, diseños y permisos', 'Información técnica y autorizaciones necesarias para construir.', '', '', 'Ingeniero de diseño', [
          T('Estudios técnicos', 'Estudio de suelos, levantamiento topográfico y estudios complementarios.', 'Informes de estudios técnicos', 'Firmados por profesionales competentes.', 'Ingeniero de diseño'),
          T('Diseños arquitectónicos y técnicos', 'Diseño arquitectónico, estructural, hidrosanitario y eléctrico coordinados.', 'Planos y memorias de diseño', 'Diseños coordinados y aprobados por el cliente.', 'Ingeniero de diseño'),
          T('Licencias y permisos', 'Licencia de construcción y permisos de ocupación del espacio público y ambientales.', 'Licencia de construcción', 'Licencia ejecutoriada.', 'Director de proyecto'),
        ]),
        T('Obras preliminares', 'Adecuación del sitio antes de construir.', '', '', 'Residente de obra', [
          T('Campamento y cerramiento', 'Instalaciones provisionales, cerramiento y vallas.', 'Campamento instalado', 'Cumple el plan de SST y de manejo ambiental.', 'Residente de obra'),
          T('Localización y replanteo', 'Trazado de ejes y niveles de la obra.', 'Acta de replanteo', 'Verificado por la interventoría.', 'Residente de obra'),
          T('Movimiento de tierras', 'Descapote, excavaciones, rellenos y retiro de sobrantes.', 'Terreno a cota de cimentación', 'Cotas verificadas por topografía.', 'Residente de obra'),
        ]),
        T('Cimentación y estructura', 'Elementos estructurales de la edificación.', '', '', 'Residente de obra', [
          T('Cimentación', 'Pilotes, zapatas, vigas de cimentación y placa de contrapiso.', 'Cimentación construida', 'Ensayos de concreto conformes y recibo de la interventoría.', 'Residente de obra'),
          T('Estructura', 'Columnas, vigas, placas y escaleras.', 'Estructura construida', 'Ensayos de concreto conformes y recibo de la interventoría.', 'Residente de obra'),
        ]),
        T('Mampostería e instalaciones', 'Cerramientos y redes técnicas.', '', '', 'Residente de obra', [
          T('Mampostería', 'Muros de fachada y divisorios.', 'Mampostería terminada', 'Plomos y niveles dentro de tolerancia.', 'Residente de obra'),
          T('Instalaciones hidrosanitarias', 'Redes de suministro, desagües y aparatos.', 'Redes hidrosanitarias probadas', 'Pruebas de presión y estanqueidad aprobadas.', 'Residente de obra'),
          T('Instalaciones eléctricas', 'Acometida, redes, tableros y salidas.', 'Instalación eléctrica certificada', 'Certificación RETIE vigente.', 'Residente de obra'),
        ]),
        T('Acabados y entrega', 'Terminación y entrega de la obra.', '', '', 'Director de proyecto', [
          T('Acabados', 'Pisos, enchapes, pintura, carpintería y cubiertas.', 'Acabados terminados', 'Lista de pendientes cerrada con el cliente.', 'Residente de obra'),
          T('Pruebas y puesta en marcha', 'Pruebas de sistemas y equipos.', 'Protocolos de pruebas', 'Protocolos firmados sin observaciones abiertas.', 'Residente de obra'),
          T('Entrega al cliente', 'Entrega de la obra, manuales y planos récord.', 'Acta de entrega de obra', 'Firmada por el cliente.', 'Director de proyecto'),
        ]),
      ],
    },
    {
      id: 'fases', name: 'Por fases del ciclo de vida',
      description: 'Primer nivel organizado por fases (Inicio, Planificación, Ejecución y Cierre) con los entregables típicos de la dirección de proyectos.',
      items: [
        T('Inicio', 'Autorización formal del proyecto e identificación de los interesados.', '', '', 'Director de proyecto', [
          T('Acta de constitución del proyecto', 'Documento que autoriza el proyecto y asigna al director.', 'Acta de constitución firmada', 'Firmada por el patrocinador.', 'Director de proyecto'),
          T('Registro de interesados', 'Identificación y análisis de los interesados del proyecto.', 'Registro de interesados', 'Revisado por el patrocinador.', 'Director de proyecto'),
        ], 'fase'),
        T('Planificación', 'Definición del alcance, cronograma, costos y planes de gestión.', '', '', 'Director de proyecto', [
          T('Plan para la dirección del proyecto', 'Planes subsidiarios de gestión integrados en un solo plan.', 'Plan para la dirección del proyecto', 'Aprobado por el patrocinador.', 'Director de proyecto'),
          T('Línea base del alcance', 'Enunciado del alcance, EDT y diccionario de la EDT.', 'Línea base del alcance aprobada', 'Aprobada mediante el control integrado de cambios.', 'Director de proyecto'),
          T('Líneas base del cronograma y de costos', 'Cronograma con ruta crítica y presupuesto distribuido en el tiempo.', 'Cronograma y presupuesto aprobados', 'Aprobados por el patrocinador.', 'Director de proyecto'),
        ], 'fase'),
        T('Ejecución', 'Producción de los entregables del proyecto.', '', '', 'Director de proyecto', [
          T('Entregables del producto', 'Trabajo técnico que produce los entregables acordados con el cliente.', 'Entregables verificados', 'Cumplen los criterios de aceptación del enunciado del alcance.', 'Director de proyecto'),
          T('Gestión del equipo y de las comunicaciones', 'Dirección del equipo, reuniones e informes a los interesados.', 'Informes de desempeño del trabajo', 'Emitidos según el plan de comunicaciones.', 'Director de proyecto'),
          T('Adquisiciones', 'Selección de proveedores y administración de contratos.', 'Contratos y órdenes de compra', 'Firmados y registrados.', 'Director de proyecto'),
        ], 'fase'),
        T('Cierre', 'Aceptación final y cierre formal del proyecto.', '', '', 'Director de proyecto', [
          T('Aceptación final de entregables', 'Transferencia de los entregables aceptados al cliente.', 'Acta de cierre y aceptación final', 'Firmada por el cliente.', 'Director de proyecto'),
          T('Informe final del proyecto', 'Resumen del desempeño del alcance, cronograma, costos y calidad.', 'Informe final', 'Aprobado por el patrocinador.', 'Director de proyecto'),
          T('Lecciones aprendidas y archivo', 'Actualización del registro de lecciones aprendidas y archivo de la documentación.', 'Registro de lecciones aprendidas', 'Archivado en el repositorio de la organización.', 'Director de proyecto'),
        ], 'fase'),
      ],
    },
  ];
  function buildTemplate(tpl) {
    const nodes = [];
    const walk = (items, parentId) => items.forEach((it, i) => {
      const id = PM.uid('w');
      const leaf = !(it.c && it.c.length);
      nodes.push({ id, parentId, name: it.n, order: i + 1, kind: it.k || '', description: it.d || '', responsible: it.r || '', deliverable: it.e || '', acceptance: it.a || '', costEstimate: null, notes: '' });
      if (!leaf) walk(it.c, id);
    });
    walk(tpl.items, null);
    return nodes;
  }
  const templateStats = (tpl) => { let wp = 0; const walk = (items) => items.forEach((it) => { if (it.c && it.c.length) walk(it.c); else wp++; }); walk(tpl.items); return { l1: tpl.items.length, wp }; };

  function TemplatePicker({ close, count, onPick }) {
    return html`<${ui.Modal} title="Plantillas de EDT" subtitle="Punto de partida con entregables y paquetes de trabajo típicos, con su diccionario. Después puedes ajustar nombres, niveles y responsables." size="wide" onClose=${close}>
      ${count ? html`<div class="wbs-notice" role="note"><${ui.Icon} name="alert" size=${15} /><div>La EDT actual tiene ${plural(count, 'elemento', 'elementos')}. Al usar una plantilla se reemplaza por completo y las actividades del cronograma quedan sin vínculo con la EDT.</div></div>` : null}
      <div class="wbs-tpls">
        ${TEMPLATES.map((t) => { const s = templateStats(t); return html`<div class="wbs-tpl" key=${t.id} data-wbs-template=${t.id}>
          <div class="row-between" style="align-items:flex-start">
            <div class="stack-sm" style="gap:2px;min-width:0;flex:1 1 260px"><h3 class="h3">${t.name}</h3><div class="small muted">${t.description}</div></div>
            <${ui.Button} size="sm" variant=${count ? undefined : 'primary'} onClick=${() => onPick(t)}>${count ? 'Reemplazar con esta plantilla' : 'Usar esta plantilla'}</${ui.Button}>
          </div>
          <div class="wbs-tpl-l1">${t.items.map((it, i) => html`<span class="chip chip-outline" key=${i}><span class="mono">1.${i + 1}</span>${it.n}</span>`)}</div>
          <div class="xsmall faint">${plural(s.l1, 'elemento de primer nivel', 'elementos de primer nivel')} · ${plural(s.wp, 'paquete de trabajo', 'paquetes de trabajo')}</div>
        </div>`; })}
      </div>
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- menú de fila (posición fija: no lo recorta el contenedor con desplazamiento) */
  function RowMenu({ label, items }) {
    const [pos, setPos] = useState(null);
    const btn = useRef(null), menu = useRef(null);
    useEffect(() => {
      if (!pos) return undefined;
      const inside = (t) => (menu.current && menu.current.contains(t)) || (btn.current && btn.current.contains(t));
      const onDoc = (e) => { if (!inside(e.target)) setPos(null); };
      const onKey = (e) => { if (e.key === 'Escape') { setPos(null); if (btn.current) btn.current.focus(); } };
      const onScroll = (e) => { if (!(e && e.target && e.target.nodeType === 1 && inside(e.target))) setPos(null); };
      document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
      window.addEventListener('scroll', onScroll, true); window.addEventListener('resize', onScroll);
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
    }, [pos]);
    useLayoutEffect(() => {
      if (!pos || !menu.current) return;
      const r = menu.current.getBoundingClientRect(); const vh = window.innerHeight, vw = window.innerWidth;
      let top = pos.top, left = pos.left;
      if (r.bottom > vh - 8) top = Math.max(8, pos.anchorTop - r.height - 4);
      if (r.right > vw - 8) left = Math.max(8, vw - r.width - 8);
      if (top !== pos.top || left !== pos.left) { setPos({ ...pos, top, left }); return; }
      if (!pos.focused) { const first = menu.current.querySelector('button:not([disabled])'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } } pos.focused = true; }
    }, [pos]);
    const toggle = () => { if (pos) { setPos(null); return; } const r = btn.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: Math.max(8, r.left), anchorTop: r.top }); };
    const list = items.filter(Boolean);
    return html`<span class="wbs-menu-anchor">
      <button ref=${btn} type="button" class="btn btn-ghost btn-sm btn-icon" aria-haspopup="menu" aria-expanded=${pos ? 'true' : 'false'} aria-label=${label} title=${label} onClick=${toggle}><${ui.Icon} name="more" size=${14} /></button>
      ${pos ? html`<div ref=${menu} class="menu wbs-rowmenu" role="menu" aria-label=${label} style=${'top:' + pos.top + 'px;left:' + pos.left + 'px'}>
        ${list.map((it, i) => it === 'sep' ? html`<div class="menu-sep" key=${i}></div>` : html`<button key=${i} type="button" role="menuitem" class="menu-item" disabled=${it.disabled} style=${(it.danger ? 'color:var(--crit);' : '') + (it.disabled ? 'opacity:.45;cursor:not-allowed;' : '')} onClick=${() => { setPos(null); if (!it.disabled && it.onClick) it.onClick(); }}>${it.icon ? html`<${ui.Icon} name=${it.icon} size=${15} />` : null}<span style="flex:1">${it.label}</span>${it.hint ? html`<span class="kbd">${it.hint}</span>` : null}</button>`)}
      </div>` : null}
    </span>`;
  }

  /* ---------------------------------------------------------------- celdas */
  /* Barra de avance en un solo elemento (sin recorte): abarata el pintado de tablas largas. */
  const Prog = ({ v }) => { const p = Math.round(PM.clamp(num(v), 0, 100) * 10) / 10; return html`<div class="wbs-prog"><span class="wbs-prog-bar" aria-hidden="true" style=${'background:linear-gradient(to right, var(--accent) ' + p + '%, var(--surface-3) ' + p + '%)'}></span><span>${PM.fmt.pct100(v)}</span></div>`; };
  const Dash = () => html`<span class="faint">—</span>`;
  const moneyCell = (v, cur, muted, title) => html`<td class=${cx('wbs-c-money', muted && 'wbs-sub')} title=${title}>${v > 0 ? PM.fmt.money(v, cur) : html`<${Dash} />`}</td>`;
  const rollCells = (roll, cur) => roll && roll.count ? html`
    <td class="wbs-c-money" title=${plural(roll.count, 'actividad', 'actividades')}>${PM.fmt.money(roll.cost, cur)}</td>
    <td class="wbs-c-date">${PM.fmt.date(roll.start, 'short')}</td>
    <td class="wbs-c-date">${PM.fmt.date(roll.finish, 'short')}</td>
    <td><${Prog} v=${roll.progress} /></td>` : html`<td class="wbs-c-money"><${Dash} /></td><td><${Dash} /></td><td><${Dash} /></td><td class="wbs-c-money"><${Dash} /></td>`;

  /* ---------------------------------------------------------------- fila del árbol */
  function TreeRowImpl({ f, roll, estV, showRoll, collapsed, hiddenCount, selected, editing, canWrite, pos, added, currency, wide, actions, drop, dragging }) {
    const n = f.node, id = n.id;
    const kind = kindOf(n, f.isLeaf);
    const hasKids = !f.isLeaf;
    const menu = canWrite ? [
      { label: 'Agregar elemento hijo', icon: 'plus', onClick: () => actions.addChild(id) },
      { label: 'Agregar elemento hermano', icon: 'plus', hint: 'Enter', onClick: () => actions.addSibling(id) },
      'sep',
      { label: 'Aumentar sangría', icon: 'indent', hint: 'Tab', disabled: pos.i === 0, onClick: () => actions.indent(id) },
      { label: 'Disminuir sangría', icon: 'outdent', hint: 'Mayús+Tab', disabled: f.depth <= 1, onClick: () => actions.outdent(id) },
      { label: 'Subir', icon: 'arrow-up', hint: 'Alt+↑', disabled: pos.i === 0, onClick: () => actions.move(id, -1) },
      { label: 'Bajar', icon: 'arrow-down', hint: 'Alt+↓', disabled: pos.i >= pos.n - 1, onClick: () => actions.move(id, 1) },
      'sep',
      { label: 'Ver diccionario', icon: 'book', onClick: () => actions.openDict(id) },
      f.isLeaf ? { label: 'Crear actividad para este paquete', icon: 'gantt', onClick: () => actions.createTask(id) } : null,
      'sep',
      { label: hasKids ? 'Eliminar con sus elementos hijos' : 'Eliminar elemento', icon: 'trash', danger: true, onClick: () => actions.remove(id) },
    ] : [{ label: 'Ver diccionario', icon: 'book', onClick: () => actions.openDict(id) }];
    return html`<tr class=${cx('wbs-row', 'd' + Math.min(f.depth, 4), selected && 'is-selected', f.isLeaf && 'is-leaf', drop && 'wbs-drop-' + drop, dragging && 'wbs-drag-src')} data-wbs-row=${id} data-code=${f.code}
        onClick=${(e) => { if (e.target.closest('button, select, input, textarea, a, .menu, [data-wbs-name]')) return; actions.select(id); }}>
      <td class="wbs-c-menu"><${RowMenu} label=${'Acciones de ' + f.code} items=${menu} /></td>
      <td class="wbs-c-code"><button type="button" class=${cx('wbs-code-btn', canWrite && 'is-draggable')} data-wbs-code=${id} aria-label=${f.code + ': ver diccionario'} title=${(wide ? 'Mostrar en el diccionario' : 'Ver diccionario') + (canWrite ? ' · arrastra para mover el elemento' : '')}
        onPointerDown=${canWrite ? (e) => actions.dragStart(e, id) : undefined} onClick=${() => actions.codeClick(id)}>${f.code}</button></td>
      <td><div class="wbs-namecell" style=${'padding-left:' + (f.depth - 1) * 18 + 'px'}>
        ${hasKids ? html`<button type="button" class="wbs-toggle" aria-expanded=${collapsed ? 'false' : 'true'} aria-label=${(collapsed ? 'Expandir ' : 'Contraer ') + f.code} onClick=${() => actions.toggle(id)}><${ui.Icon} name=${collapsed ? 'chevron-right' : 'chevron-down'} size=${14} /></button>` : html`<span class="wbs-toggle-sp"></span>`}
        ${canWrite && editing ? html`<input class="cell-input wbs-name-input" data-wbs-input=${id} value=${n.name || ''} placeholder=${f.isLeaf ? 'Nombre del paquete de trabajo' : 'Nombre del entregable'} aria-label=${'Nombre del elemento ' + f.code}
            onInput=${(e) => actions.patch(id, { name: e.currentTarget.value })} onFocus=${() => actions.select(id)} onKeyDown=${(e) => actions.keyDown(e, id)} />`
          : html`<span class=${cx('wbs-name-view', canWrite && 'is-editable')} data-wbs-name=${id} tabindex=${canWrite ? '0' : undefined} role=${canWrite ? 'button' : undefined}
              aria-label=${canWrite ? 'Editar nombre de ' + f.code + ': ' + (txt(n.name) || 'sin nombre') : undefined}
              onFocus=${canWrite ? () => actions.select(id) : undefined} onClick=${canWrite ? () => actions.edit(id) : undefined} onKeyDown=${canWrite ? (e) => actions.viewKeyDown(e, id) : undefined}>${txt(n.name) ? n.name : html`<span class="faint">Sin nombre</span>`}${added ? html`<${NewDot} />` : null}</span>`}
        ${added && canWrite && editing ? html`<${NewDot} />` : null}
        ${collapsed && hiddenCount ? html`<span class="wbs-hidden" title=${plural(hiddenCount, 'elemento oculto', 'elementos ocultos')}>+${hiddenCount}</span>` : null}
      </div></td>
      <td>${canWrite && selected ? html`<select class=${'wbs-kind k-' + kind} value=${kind} aria-label=${'Tipo del elemento ' + f.code} onChange=${(e) => actions.patch(id, { kind: e.currentTarget.value })}>
          ${KINDS.filter((k) => f.isLeaf || k.id !== 'paquete').map((k) => html`<option key=${k.id} value=${k.id}>${k.label}</option>`)}
        </select>` : html`<${KindChip} kind=${kind} />`}</td>
      ${moneyCell(estV, currency, !f.isLeaf, f.isLeaf ? undefined : 'Suma de los paquetes de trabajo que lo componen')}
      ${showRoll ? rollCells(roll, currency) : null}
    </tr>`;
  }
  const TreeRow = memoBy(TreeRowImpl);
  const NewDot = () => html`<span class="wbs-new-dot" title="Agregado después de la línea base del alcance" role="img" aria-label="Agregado después de la línea base del alcance"></span>`;

  /* ---------------------------------------------------------------- avisos de validación */
  function Notices({ issues, onPick }) {
    if (!issues.length) return null;
    return html`<div class="wbs-notice" role="note" data-wbs-notices>
      <${ui.Icon} name="alert" size=${15} />
      <ul>${issues.map((it) => html`<li key=${it.id}>${it.text}${it.items && it.items.length ? html`<span class="wbs-codes">${it.items.slice(0, 8).map((x) => html`<button type="button" key=${x.id} title=${x.name ? 'Ir a ' + x.name : 'Ir al elemento'} onClick=${() => onPick(x.id)}>${x.code}</button>`)}${it.items.length > 8 ? html`<span class="xsmall faint">+${it.items.length - 8}</span>` : null}</span>` : null}</li>`)}</ul>
    </div>`;
  }

  /* ---------------------------------------------------------------- panel del diccionario */
  const RO = ({ label, value, mono }) => html`<div class="wbs-ro"><div class="wbs-ro-k">${label}</div><div class=${cx('wbs-ro-v', mono && 'mono')}>${value === '' || value === null || value === undefined ? html`<span class="faint">Sin registrar</span>` : value}</div></div>`;

  function DictBody({ id, d }) {
    const hasCron = !!PM.getView('cronograma');
    if (id === ROOT) {
      const p = d.project || {};
      const r = d.rootRoll;
      return html`<div class="stack" data-wbs-dict-panel="root">
        <div class="row" style="gap:6px"><span class="code-tag">1</span><${ui.Chip} tone="outline">Proyecto</${ui.Chip}></div>
        <${RO} label="Nombre" value=${p.name} />
        <div class="wbs-sumgrid">
          <${RO} label="Elementos de la EDT" value=${String(d.tree.nodes.length)} />
          <${RO} label="Paquetes de trabajo" value=${String(d.tree.leaves.size)} />
          <${RO} label="Costo estimado total" value=${PM.fmt.money(d.est.total, d.currency)} />
          <${RO} label="Actividades vinculadas" value=${String(r.count)} />
          ${r.count ? html`<${RO} label="Inicio – fin" value=${PM.fmt.date(r.start) + ' – ' + PM.fmt.date(r.finish)} /><${RO} label="Avance" value=${PM.fmt.pct100(r.progress)} />` : null}
        </div>
        ${d.unlinked ? html`<p class="small muted">${plural(d.unlinked, 'actividad del cronograma no está vinculada', 'actividades del cronograma no están vinculadas')} a la EDT. Vincúlalas en el cronograma para que la regla del 100 % se cumpla también en el trabajo programado.</p>` : null}
        <p class="small muted">El elemento raíz representa el alcance total del proyecto. Su nombre y código se editan en la ficha del proyecto.</p>
        ${PM.getView('ficha') ? html`<div><${ui.Button} size="sm" iconRight="arrow-right" onClick=${() => PM.navigate('ficha')}>Abrir ficha del proyecto</${ui.Button}></div>` : null}
      </div>`;
    }
    const n = d.tree.byId.get(id);
    if (!n) return html`<p class="small muted">Este elemento ya no existe en la EDT.</p>`;
    const code = d.tree.codes.get(id);
    const isLeaf = d.tree.leaves.has(id);
    const kind = kindOf(n, isLeaf);
    const w = d.canWrite;
    const sfx = d.suffix || '';
    const set = (k) => (v) => d.actions.patch(id, { [k]: v });
    const tasks = d.directTasks.get(id) || [];
    const roll = d.rollup.get(id);
    const estV = d.est.est.get(id) || 0;
    const fid = (k) => 'wbs-f-' + k + sfx;
    return html`<div class="stack" data-wbs-dict-panel=${id}>
      <div class="row" style="gap:6px"><span class="code-tag">${code}</span><${KindChip} kind=${kind} />${isLeaf ? null : html`<span class="xsmall faint">${plural(d.tree.descendants(id).length, 'elemento', 'elementos')} debajo</span>`}</div>
      ${w ? html`
        <${ui.Field} label="Nombre" for=${fid('name')}><${ui.Input} id=${fid('name')} value=${n.name || ''} onValue=${set('name')} placeholder="Nombre del elemento" /></${ui.Field}>
        <${ui.Field} label="Tipo" for=${fid('kind')} hint=${isLeaf ? 'Nivel más bajo de la EDT: es un paquete de trabajo, donde se estiman costos y duraciones.' : 'Tiene elementos hijos, por eso no puede ser paquete de trabajo.'}>
          <${ui.Select} id=${fid('kind')} value=${kind} onValue=${set('kind')} options=${KINDS.filter((k) => isLeaf || k.id !== 'paquete').map((k) => ({ value: k.id, label: k.label }))} />
        </${ui.Field}>
        <${ui.Field} label="Descripción del trabajo" for=${fid('description')}><${ui.TextArea} id=${fid('description')} rows=${3} value=${n.description || ''} onValue=${set('description')} placeholder="Qué trabajo incluye y qué queda por fuera" /></${ui.Field}>
        <${ui.Field} label="Entregable" for=${fid('deliverable')}><${ui.Input} id=${fid('deliverable')} value=${n.deliverable || ''} onValue=${set('deliverable')} placeholder="Resultado verificable que produce" /></${ui.Field}>
        <${ui.Field} label="Responsable" for=${fid('responsible')}><${ui.Input} id=${fid('responsible')} list="wbs-resp-options" value=${n.responsible || ''} onValue=${set('responsible')} placeholder="Rol o persona a cargo" /></${ui.Field}>
        <${ui.Field} label="Criterios de aceptación" for=${fid('acceptance')}><${ui.TextArea} id=${fid('acceptance')} rows=${2} value=${n.acceptance || ''} onValue=${set('acceptance')} placeholder="Cómo se verifica que el entregable está completo" /></${ui.Field}>
        ${isLeaf ? html`<${ui.Field} label="Costo estimado" for=${fid('cost')} hint="Estimación del paquete de trabajo; se consolida hacia arriba en la EDT.">
            <${ui.NumberInput} id=${fid('cost')} money currency=${d.currency} min=${0} value=${n.costEstimate} onValue=${set('costEstimate')} /></${ui.Field}>`
          : html`<div class="wbs-ro"><div class="wbs-ro-k">Costo estimado (consolidado)</div><div class="wbs-ro-v num">${PM.fmt.money(estV, d.currency)}</div><div class="field-hint">Suma de los paquetes de trabajo que lo componen.${num(n.costEstimate) > 0 ? ' Antes de descomponerlo tenía una estimación propia de ' + PM.fmt.money(n.costEstimate, d.currency) + ', que ya no se suma: distribúyela entre sus paquetes de trabajo.' : ''}</div></div>`}
        <${ui.Field} label="Notas" for=${fid('notes')}><${ui.TextArea} id=${fid('notes')} rows=${2} value=${n.notes || ''} onValue=${set('notes')} placeholder="Supuestos, restricciones, referencias" /></${ui.Field}>`
      : html`
        <${RO} label="Nombre" value=${n.name} />
        <${RO} label="Descripción del trabajo" value=${n.description} />
        <${RO} label="Entregable" value=${n.deliverable} />
        <${RO} label="Responsable" value=${n.responsible} />
        <${RO} label="Criterios de aceptación" value=${n.acceptance} />
        <${RO} label=${isLeaf ? 'Costo estimado' : 'Costo estimado (consolidado)'} value=${estV > 0 ? PM.fmt.money(estV, d.currency) : ''} />
        <${RO} label="Notas" value=${n.notes} />`}
      <hr class="divider" />
      <div class="stack-sm">
        <div class="wbs-sec-title"><${ui.Icon} name="gantt" size=${15} />Actividades vinculadas<span class="code-tag">${tasks.length}</span></div>
        ${!isLeaf && roll && roll.count > tasks.length ? html`<p class="small muted">${plural(roll.count - tasks.length, 'actividad vinculada', 'actividades vinculadas')} a los elementos que lo componen${roll.count ? ' · ' + PM.fmt.date(roll.start) + ' – ' + PM.fmt.date(roll.finish) + ' · avance ' + PM.fmt.pct100(roll.progress) : ''}.</p>` : null}
        <div class="wbs-acts">
          ${tasks.length ? tasks.map((t) => html`<div class="wbs-act" key=${t.id} data-wbs-task=${t.id}>
            <div class="wbs-act-name">${t.name || 'Actividad sin nombre'}</div>
            <div class="xsmall muted">${t.milestone ? 'Hito · ' + PM.fmt.date(t.startDate) : PM.fmt.date(t.startDate) + ' – ' + PM.fmt.date(t.finishDate) + ' · ' + PM.fmt.days(t.duration)} · avance ${PM.fmt.pct100(t.progress)}${num(t.cost) ? ' · ' + PM.fmt.money(t.cost, d.currency) : ''}</div>
            ${hasCron ? html`<div><${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => PM.navigate('cronograma', { taskId: t.id })}>Ver en el cronograma</${ui.Button}></div>` : null}
          </div>`) : html`<p class="small faint">${isLeaf ? 'Este paquete de trabajo aún no tiene actividades en el cronograma.' : 'Las actividades se vinculan a los paquetes de trabajo, el nivel más bajo de la EDT.'}</p>`}
        </div>
        ${w && isLeaf ? html`<div><${ui.Button} size="sm" icon="plus" onClick=${() => d.actions.createTask(id)}>Crear actividad para este paquete</${ui.Button}></div>` : null}
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- diagrama jerárquico */
  const DG = { BOX_W: 152, ROOT_W: 280, INDENT: 18, PAD_X: 9, PAD_Y: 8, CODE_H: 13, LINE_H: 15, GAP_X: 12, GAP_Y: 10, BUS: 20, M: 16 };
  const FONT_NAME = '500 12px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif';
  const FONT_ROOT = '600 13px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif';
  let measureCtx = null;
  const textWidth = (s, font) => {
    try { if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d'); if (measureCtx) { measureCtx.font = font; return measureCtx.measureText(s).width; } } catch (e) { /* sin canvas */ }
    return s.length * (font === FONT_ROOT ? 7.2 : 6.6);
  };
  function wrapText(text, maxW, maxLines, font) {
    const words = txt(text).split(/\s+/).filter(Boolean);
    const lines = []; let cur = '';
    for (let i = 0; i < words.length && lines.length <= maxLines; i++) {
      let wd = words[i];
      const test = cur ? cur + ' ' + wd : wd;
      if (textWidth(test, font) <= maxW) { cur = test; continue; }
      if (cur) { lines.push(cur); cur = ''; }
      while (textWidth(wd, font) > maxW && wd.length > 2 && lines.length <= maxLines) {
        let k = wd.length - 1; while (k > 1 && textWidth(wd.slice(0, k) + '-', font) > maxW) k--;
        lines.push(wd.slice(0, k) + '-'); wd = wd.slice(k);
      }
      cur = wd;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const keep = lines.slice(0, maxLines);
      let last = keep[maxLines - 1].replace(/-$/, '');
      while (last.length > 1 && textWidth(last + '…', font) > maxW) last = last.slice(0, -1);
      keep[maxLines - 1] = last.trimEnd() + '…';
      return keep;
    }
    return lines.length ? lines : [''];
  }
  const boxH = (nLines) => DG.PAD_Y * 2 + DG.CODE_H + nLines * DG.LINE_H - 2;

  /* Disposición clásica (horizontal): proyecto arriba, primer nivel en fila y niveles inferiores apilados bajo su elemento
     de primer nivel con sangría. Disposición vertical (pantallas angostas): todos los niveles apilados bajo el proyecto. */
  function layoutWbs(tree, project, limit, vertical) {
    const p = project || {};
    const rootW = vertical ? DG.BOX_W + 2 * DG.INDENT : DG.ROOT_W;
    const rootLines = wrapText(p.name || 'Proyecto', rootW - 2 * DG.PAD_X, 3, FONT_ROOT);
    const root = { id: ROOT, root: true, code: '1' + (p.code ? ' · ' + p.code : ''), lines: rootLines, w: rootW, h: boxH(rootLines.length), x: DG.M, y: DG.M, depth: 0, kids: [] };
    const all = [];
    const walk = (n, rel, sink) => {
      const depth = tree.depth.get(n.id) || 1;
      const kids = tree.childrenOf(n.id);
      const show = depth < limit;
      const name = txt(n.name);
      const lines = wrapText(name || 'Sin nombre', DG.BOX_W - 2 * DG.PAD_X, 3, FONT_NAME);
      const b = { id: n.id, node: n, code: tree.codes.get(n.id), lines, empty: !name, w: DG.BOX_W, h: boxH(lines.length), rel, depth, isLeaf: !kids.length, hidden: show ? 0 : tree.descendants(n.id).length, kids: [] };
      sink.items.push(b); all.push(b); sink.maxRel = Math.max(sink.maxRel, rel);
      if (show) for (const c of kids) b.kids.push(walk(c, rel + 1, sink));
      return b;
    };
    const r = (v) => Math.round(v) + 0.5;
    const d = [];
    let W, H;
    if (vertical) {
      const sink = { items: [], maxRel: 0 };
      for (const t of tree.childrenOf(null)) root.kids.push(walk(t, 1, sink));
      let y = root.y + root.h + DG.GAP_Y + 4;
      for (const b of sink.items) { b.x = DG.M + b.rel * DG.INDENT; b.y = y; y += b.h + DG.GAP_Y; }
      W = Math.ceil(Math.max(rootW, DG.BOX_W + sink.maxRel * DG.INDENT) + 2 * DG.M);
      H = (sink.items.length ? y - DG.GAP_Y : root.y + root.h) + DG.M;
    } else {
      const cols = [];
      let x = DG.M;
      for (const t of tree.childrenOf(null)) {
        const sink = { items: [], maxRel: 0 };
        const top = walk(t, 0, sink);
        const w = DG.BOX_W + sink.maxRel * DG.INDENT;
        cols.push({ top, items: sink.items, x, w });
        x += w + DG.GAP_X;
      }
      const contentW = cols.length ? x - DG.GAP_X - DG.M : 0;
      W = Math.ceil(Math.max(contentW, rootW) + 2 * DG.M);
      const off = Math.round((W - 2 * DG.M - contentW) / 2);
      root.x = Math.round((W - rootW) / 2);
      const busY = root.y + root.h + DG.BUS;
      const rowY = busY + DG.BUS;
      const rowH = cols.reduce((m, c) => Math.max(m, c.top.h), 0);
      H = cols.length ? rowY + rowH + DG.M : root.y + root.h + DG.M;
      for (const c of cols) {
        c.x += off; c.top.x = c.x; c.top.y = rowY;
        let y = rowY + rowH + DG.GAP_Y + 4;
        for (const b of c.items) { if (b === c.top) continue; b.x = c.x + b.rel * DG.INDENT; b.y = y; y += b.h + DG.GAP_Y; }
        H = Math.max(H, y - DG.GAP_Y + DG.M);
      }
      if (cols.length) {
        const rcx = root.x + root.w / 2;
        const cxs = cols.map((c) => c.top.x + DG.BOX_W / 2);
        d.push('M' + r(rcx) + ' ' + (root.y + root.h) + 'V' + r(busY));
        const x1 = Math.min(rcx, ...cxs), x2 = Math.max(rcx, ...cxs);
        if (x2 - x1 > 1) d.push('M' + r(x1) + ' ' + r(busY) + 'H' + r(x2));
        for (const cxv of cxs) d.push('M' + r(cxv) + ' ' + r(busY) + 'V' + rowY);
      }
    }
    /* conectores en codo: línea vertical a la izquierda del padre y tramo horizontal hasta cada hijo */
    for (const b of [root, ...all]) {
      if (!b.kids.length) continue;
      const vx = r(b.x + DG.INDENT / 2); const last = b.kids[b.kids.length - 1];
      d.push('M' + vx + ' ' + (b.y + b.h) + 'V' + r(last.y + last.h / 2));
      for (const k of b.kids) d.push('M' + vx + ' ' + r(k.y + k.h / 2) + 'H' + k.x);
    }
    return { W, H: Math.ceil(H), boxes: [root, ...all], path: d.join(' ') };
  }

  const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];
  function WbsDiagram({ tree, project, est, rollup, currency, onOpen }) {
    const tip = PM.useChartTip();
    const svgRef = useRef(null);
    const [zoom, setZoomRaw] = useState(() => { const z = PM.prefs.get('wbs.zoom', 'fit'); return z === 'fit' || ZOOMS.includes(Number(z)) ? z : 'fit'; });
    const setZoom = (z) => { setZoomRaw(z); PM.prefs.set('wbs.zoom', z); };
    const [level, setLevel] = useState('all');
    const [orient, setOrient] = useState(null);
    const [hostW, setHostW] = useState(0);
    const [fontTick, setFontTick] = useState(0);
    useEffect(() => { let live = true; try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) setFontTick(1); }); } catch (e) { /* sin API de fuentes */ } return () => { live = false; }; }, []);
    useLayoutEffect(() => {
      const el = tip.ref.current; if (!el) return undefined;
      const upd = () => setHostW(el.clientWidth);
      upd();
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }
      const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
    }, []);
    const maxDepth = useMemo(() => tree.flat.reduce((m, f) => Math.max(m, f.depth), 0), [tree]);
    const limit = level === 'all' ? Infinity : Number(level) - 1;
    const vertical = orient ? orient === 'v' : hostW > 0 && hostW < 640;
    const L = useMemo(() => layoutWbs(tree, project, limit, vertical), [tree, project && project.name, project && project.code, limit, vertical, fontTick]);
    const fit = hostW > 0 ? PM.clamp((hostW - 2) / L.W, 0.5, 1) : 1;
    const scale = zoom === 'fit' ? fit : Number(zoom);
    const stepZoom = (dir) => { const cur = scale; const next = dir > 0 ? ZOOMS.find((z) => z > cur + 0.01) : [...ZOOMS].reverse().find((z) => z < cur - 0.01); if (next) setZoom(next); };
    const levelOpts = [];
    for (let lv = 2; lv <= maxDepth; lv++) levelOpts.push({ value: String(lv), label: String(lv) });
    if (levelOpts.length) levelOpts.push({ value: 'all', label: 'Todos' });
    const tipFor = (b) => {
      if (b.root) return html`<div class="stack-sm" style="gap:3px"><strong>${(project && project.name) || 'Proyecto'}</strong><div class="faint">Proyecto · ${plural(tree.nodes.length, 'elemento', 'elementos')} · ${plural(tree.leaves.size, 'paquete de trabajo', 'paquetes de trabajo')}</div><div><span class="faint">Costo estimado:</span> ${PM.fmt.money(est.total, currency)}</div></div>`;
      const n = b.node; const roll = rollup.get(b.id); const ev = est.est.get(b.id) || 0;
      const k = KIND_BY_ID[kindOf(n, b.isLeaf)];
      return html`<div class="stack-sm" style="gap:3px">
        <div><span class="code-tag">${b.code}</span> <strong>${txt(n.name) || 'Sin nombre'}</strong></div>
        <div class="faint">${k.label}${b.hidden ? ' · ' + plural(b.hidden, 'elemento oculto', 'elementos ocultos') : ''}</div>
        ${txt(n.description) ? html`<div>${clip(n.description, 180)}</div>` : null}
        ${txt(n.deliverable) ? html`<div><span class="faint">Entregable:</span> ${clip(n.deliverable, 90)}</div>` : null}
        <div><span class="faint">Responsable:</span> ${txt(n.responsible) || 'Sin asignar'}</div>
        <div><span class="faint">Costo estimado:</span> ${ev > 0 ? PM.fmt.money(ev, currency) : 'Sin estimar'}</div>
        ${roll && roll.count ? html`<div><span class="faint">Actividades:</span> ${roll.count} · avance ${PM.fmt.pct100(roll.progress)}</div>` : null}
      </div>`;
    };
    const fileName = ((project && (project.code || PM.slug(project.name))) || 'proyecto') + '_EDT.svg';
    return html`<section class="card">
      <div class="card-head">
        <div class="stack-sm" style="gap:2px;min-width:0"><h3 class="h3">Diagrama de la EDT</h3><div class="xsmall faint">Haz clic en un elemento para ver su diccionario.</div></div>
        <div class="row" style="gap:10px">
          ${levelOpts.length ? html`<div class="row" style="gap:6px"><span class="xsmall muted">Niveles</span><${ui.Segmented} label="Niveles visibles" options=${levelOpts} value=${level} onChange=${setLevel} /></div>` : null}
          <${ui.Segmented} label="Disposición del diagrama" options=${[{ value: 'h', label: 'Horizontal' }, { value: 'v', label: 'Vertical' }]} value=${vertical ? 'v' : 'h'} onChange=${setOrient} />
          <div class="wbs-zoom" role="group" aria-label="Zoom del diagrama">
            <${ui.IconButton} size="sm" icon="zoom-out" label="Alejar" disabled=${scale <= ZOOMS[0] + 0.001} onClick=${() => stepZoom(-1)} />
            <span class="wbs-zoom-v" aria-live="polite">${Math.round(scale * 100)} %</span>
            <${ui.IconButton} size="sm" icon="zoom-in" label="Acercar" disabled=${scale >= ZOOMS[ZOOMS.length - 1] - 0.001} onClick=${() => stepZoom(1)} />
            <${ui.Button} size="sm" variant=${zoom === 'fit' ? 'ghost' : undefined} icon="expand" aria-pressed=${zoom === 'fit' ? 'true' : 'false'} onClick=${() => setZoom('fit')}>Ajustar</${ui.Button}>
          </div>
          <${ui.SvgDownload} getSvg=${() => svgRef.current} filename=${fileName} />
        </div>
      </div>
      <div class="card-body stack-sm">
        <div class="legend" aria-label="Convenciones">
          <span class="legend-item"><span class="wbs-sw root"></span>Proyecto</span>
          <span class="legend-item"><span class="wbs-sw l1"></span>Primer nivel</span>
          <span class="legend-item"><span class="wbs-sw"></span>Elemento intermedio</span>
          <span class="legend-item"><span class="wbs-sw wp"></span>Paquete de trabajo</span>
        </div>
        <div class="chart wbs-chart" ref=${tip.ref} onMouseLeave=${tip.hide}>
          <svg ref=${svgRef} xmlns="http://www.w3.org/2000/svg" width=${Math.round(L.W * scale)} height=${Math.round(L.H * scale)} viewBox=${'0 0 ' + L.W + ' ' + L.H} role="group" aria-label=${'Diagrama de la EDT: ' + plural(tree.nodes.length, 'elemento', 'elementos')}>
            <path class="wbs-dg-link" d=${L.path} />
            ${L.boxes.map((b) => html`<g key=${b.id} class=${cx('wbs-dg-box', b.root ? 'wbs-dg-root' : b.isLeaf ? 'wbs-dg-wp' : b.depth === 1 ? 'wbs-dg-l1' : 'wbs-dg-mid')} data-id=${b.id}
                transform=${'translate(' + b.x + ',' + b.y + ')'} tabindex=${b.root ? undefined : '0'} role=${b.root ? undefined : 'button'} aria-label=${b.root ? undefined : b.code + ' ' + (txt(b.node.name) || 'Sin nombre') + ': ver diccionario'}
                onMouseMove=${(e) => tip.show(e, tipFor(b))} onMouseLeave=${tip.hide}
                onClick=${b.root ? undefined : () => { tip.hide(); onOpen(b.id); }} onKeyDown=${b.root ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(b.id); } }}>
              <rect class="wbs-dg-rect" x="0.5" y="0.5" width=${b.w - 1} height=${b.h - 1} rx="4" />
              <text class="wbs-dg-code" x=${DG.PAD_X} y=${DG.PAD_Y + 10}>${b.code}</text>
              ${b.hidden ? html`<text class="wbs-dg-more" x=${b.w - DG.PAD_X} y=${DG.PAD_Y + 10} text-anchor="end">+${b.hidden}</text>` : null}
              <text class=${cx('wbs-dg-name', b.empty && 'is-empty')} x=${DG.PAD_X} y=${DG.PAD_Y + DG.CODE_H + 11}>${b.lines.map((l, i) => html`<tspan key=${i} x=${DG.PAD_X} dy=${i ? DG.LINE_H : 0}>${l}</tspan>`)}</text>
            </g>`)}
          </svg>
          ${tip.node}
        </div>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------- diccionario (tabla) */
  /* Área de texto que crece con su contenido; single: sin saltos de línea (nombres). */
  function AutoTA({ value, onValue, label, placeholder, cls, single }) {
    const ref = useRef(null);
    useLayoutEffect(() => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 320) + 'px'; }, [value]);
    return html`<textarea ref=${ref} rows="1" class=${cx('cell-input wbs-ta', cls)} aria-label=${label} placeholder=${placeholder} value=${value || ''}
      onKeyDown=${single ? (e) => { if (e.key === 'Enter') e.preventDefault(); } : undefined}
      onInput=${(e) => onValue(single ? e.currentTarget.value.replace(/\s*[\r\n]+\s*/g, ' ') : e.currentTarget.value)}></textarea>`;
  }
  function DictRowImpl({ f, estV, canWrite, currency, actions, showKind }) {
    const n = f.node, id = n.id;
    const set = (k) => (v) => actions.patch(id, { [k]: v });
    const kind = kindOf(n, f.isLeaf);
    const kindLine = showKind ? html`<div class="wbs-dict-kind xsmall faint">${KIND_BY_ID[kind].label}</div>` : null;
    if (!canWrite) {
      const t = (v) => (txt(v) ? html`<div class="wbs-dict-ro">${v}</div>` : html`<div class="wbs-dict-ro faint">—</div>`);
      return html`<tr data-wbs-dict=${id}>
        <td class="wbs-c-code">${f.code}</td>
        <td><div class="wbs-dc-name">${t(n.name)}</div>${kindLine}</td>
        <td><div class="wbs-dc-desc">${t(n.description)}</div></td>
        <td><div class="wbs-dc-resp">${t(n.responsible)}</div></td>
        <td><div class="wbs-dc-acc">${t(n.acceptance)}</div></td>
        <td class=${cx('num nowrap', !f.isLeaf && 'wbs-sub')}><div class="wbs-dc-cost">${estV > 0 ? PM.fmt.money(estV, currency) : '—'}</div></td>
        <td><div class="wbs-dc-deliv">${t(n.deliverable)}</div></td>
      </tr>`;
    }
    return html`<tr data-wbs-dict=${id}>
      <td class="wbs-c-code">${f.code}</td>
      <td><${AutoTA} single cls="wbs-dc-name" value=${n.name} label=${'Nombre de ' + f.code} placeholder="Nombre del elemento" onValue=${set('name')} />${kindLine}</td>
      <td><${AutoTA} cls="wbs-dc-desc" value=${n.description} label=${'Descripción del trabajo de ' + f.code} placeholder="Trabajo incluido" onValue=${set('description')} /></td>
      <td><input class="cell-input wbs-dc-resp" list="wbs-resp-options" value=${n.responsible || ''} placeholder="Responsable" aria-label=${'Responsable de ' + f.code} onInput=${(e) => actions.patch(id, { responsible: e.currentTarget.value })} /></td>
      <td><${AutoTA} cls="wbs-dc-acc" value=${n.acceptance} label=${'Criterios de aceptación de ' + f.code} placeholder="Cómo se acepta" onValue=${set('acceptance')} /></td>
      <td>${f.isLeaf ? html`<${ui.NumberInput} class="cell-input wbs-dc-cost" money currency=${currency} min=${0} value=${n.costEstimate} aria-label=${'Costo estimado de ' + f.code} onValue=${set('costEstimate')} />`
        : html`<div class="cell-calc num wbs-sub wbs-dc-cost" title="Suma de los paquetes de trabajo que lo componen">${estV > 0 ? PM.fmt.money(estV, currency) : '—'}</div>`}</td>
      <td><input class="cell-input wbs-dc-deliv" value=${n.deliverable || ''} placeholder="Entregable" aria-label=${'Entregable de ' + f.code} onInput=${(e) => actions.patch(id, { deliverable: e.currentTarget.value })} /></td>
    </tr>`;
  }
  const DictRow = memoBy(DictRowImpl);

  const DICT_PAGE = 50;
  function DictTab({ tree, est, directTasks, canWrite, currency, actions, project }) {
    const [mode, setModeRaw] = useState(() => (PM.prefs.get('wbs.dictMode', 'all') === 'wp' ? 'wp' : 'all'));
    const [page, setPage] = useState(0);
    const setMode = (m) => { setModeRaw(m); setPage(0); PM.prefs.set('wbs.dictMode', m); };
    const [q, setQRaw] = useState('');
    const setQ = (v) => { setQRaw(v); setPage(0); };
    const rows = useMemo(() => {
      const ql = q.trim().toLowerCase();
      return tree.flat.filter((f) => (mode === 'all' || f.isLeaf) && (!ql || [f.code, f.node.name, f.node.description, f.node.responsible, f.node.acceptance, f.node.deliverable].join(' ').toLowerCase().includes(ql)));
    }, [tree, mode, q]);
    const exportCsv = () => {
      const cols = [
        { key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'kind', label: 'Tipo' }, { key: 'level', label: 'Nivel' },
        { key: 'description', label: 'Descripción del trabajo' }, { key: 'deliverable', label: 'Entregable' }, { key: 'responsible', label: 'Responsable' },
        { key: 'acceptance', label: 'Criterios de aceptación' }, { key: 'costEstimate', label: 'Costo estimado' }, { key: 'activities', label: 'Actividades vinculadas' }, { key: 'notes', label: 'Notas' },
      ];
      const data = rows.map((f) => ({
        code: f.code, name: f.node.name || '', kind: KIND_BY_ID[kindOf(f.node, f.isLeaf)].label, level: f.depth + 1,
        description: f.node.description || '', deliverable: f.node.deliverable || '', responsible: f.node.responsible || '', acceptance: f.node.acceptance || '',
        costEstimate: est.est.get(f.node.id) || 0, activities: (directTasks.get(f.node.id) || []).length, notes: f.node.notes || '',
      }));
      const base = (project && (project.code || PM.slug(project.name))) || 'proyecto';
      PM.download(base + '_diccionario-EDT.csv', PM.toCSV(cols, data));
    };
    const pages = Math.max(1, Math.ceil(rows.length / DICT_PAGE));
    const pg = Math.min(page, pages - 1);
    const shown = pages > 1 ? rows.slice(pg * DICT_PAGE, (pg + 1) * DICT_PAGE) : rows;
    return html`<div class="stack">
      <div class="row-between">
        <div class="row">
          <${ui.Segmented} label="Elementos mostrados" options=${[{ value: 'all', label: 'Todos los elementos' }, { value: 'wp', label: 'Solo paquetes de trabajo' }]} value=${mode} onChange=${setMode} />
          <div style="width:min(260px, 100%)"><${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar en el diccionario…" aria-label="Buscar en el diccionario" /></div>
        </div>
        <${ui.Button} size="sm" icon="download" onClick=${exportCsv} disabled=${!rows.length}>Exportar CSV</${ui.Button}>
      </div>
      <${FitWrap}>
        <table class=${cx('table wbs-dict', canWrite && 'table-edit')}>
          <thead><tr><th>Código</th><th>Nombre</th><th>Descripción del trabajo</th><th>Responsable</th><th>Criterios de aceptación</th><th class="num">Costo estimado</th><th>Entregable</th></tr></thead>
          <tbody>
            ${shown.length ? shown.map((f) => {
              const estV = est.est.get(f.node.id) || 0;
              return html`<${DictRow} key=${f.node.id} sig=${JSON.stringify([f.node, f.code, f.isLeaf, estV, canWrite, currency, mode])} f=${f} estV=${estV} canWrite=${canWrite} currency=${currency} actions=${actions} showKind=${mode === 'all'} />`;
            }) : html`<tr><td colspan="7" class="faint" style="padding:14px 12px">${q ? 'Ningún elemento coincide con la búsqueda.' : 'No hay paquetes de trabajo todavía.'}</td></tr>`}
          </tbody>
          <tfoot><tr><td colspan="5">Total estimado (suma de los paquetes de trabajo)</td><td class="num nowrap" data-wbs-total>${PM.fmt.money(est.total, currency)}</td><td></td></tr></tfoot>
        </table>
      </${FitWrap}>
      ${pages > 1 ? html`<div class="wbs-pager" data-wbs-pager>
        <span>Mostrando ${pg * DICT_PAGE + 1}–${Math.min(rows.length, (pg + 1) * DICT_PAGE)} de ${rows.length}</span>
        <${ui.Button} size="sm" icon="chevron-left" disabled=${pg === 0} onClick=${() => setPage(pg - 1)}>Anterior</${ui.Button}>
        <${ui.Button} size="sm" iconRight="chevron-right" disabled=${pg >= pages - 1} onClick=${() => setPage(pg + 1)}>Siguiente</${ui.Button}>
      </div>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- vista */
  function WbsView({ project, params }) {
    params = params || {};
    const model = PM.useProjectModel();
    const canWrite = PM.useCanWrite();
    const [raci, saveRaci, raciMeta] = PM.useToolData('raci', PM.EMPTY.raci);
    const pid = project ? project.id : null;
    const wide = useMedia('(min-width: 1200px)');
    const TABS = ['arbol', 'diagrama', 'diccionario'];
    const [tab, setTabRaw] = useState(() => (TABS.includes(params.tab) ? params.tab : TABS.includes(PM.prefs.get('wbs.tab')) ? PM.prefs.get('wbs.tab') : 'arbol'));
    const setTab = (t) => { setTabRaw(t); setDictId(null); PM.prefs.set('wbs.tab', t); };
    const [selectedId, setSelectedId] = useState(params.nodeId || null);
    /* fila cuyo nombre se está editando (distinta de la selección: recorrer la tabla con Tab no modifica la EDT) */
    const [editingId, setEditingId] = useState(null);
    const [dictId, setDictId] = useState(null);
    const [collapsed, setCollapsed] = useState(() => { const v = PM.prefs.get('wbs.collapsed.' + pid, []); return new Set(Array.isArray(v) ? v : []); });
    const pendingFocus = useRef(null);
    const drag = useRef(null);
    const [dropHint, setDropHint] = useState(null);
    const [dragId, setDragId] = useState(null);
    useEffect(() => { if (params.nodeId) { setSelectedId(params.nodeId); if (!wide) setDictId(params.nodeId); } }, [params.nodeId]);

    const { wbs, schedule, sched, tree, rollup, baselines, costs, currency } = model;
    const nodes = Array.isArray(wbs.nodes) ? wbs.nodes : [];
    const est = useMemo(() => estimates(tree), [tree]);
    const pos = useMemo(() => { const m = new Map(); const put = (arr) => arr.forEach((n, i) => m.set(n.id, { i, n: arr.length })); put(tree.childrenOf(null)); for (const n of tree.nodes) put(tree.childrenOf(n.id)); return m; }, [tree]);
    const visible = useMemo(() => {
      const out = []; let hide = Infinity;
      for (const f of tree.flat) { if (f.depth > hide) continue; hide = Infinity; out.push(f); if (!f.isLeaf && collapsed.has(f.node.id)) hide = f.depth; }
      return out;
    }, [tree, collapsed]);
    const directTasks = useMemo(() => { const m = new Map(); for (const t of sched.tasks) { if (!t.wbsId) continue; if (!m.has(t.wbsId)) m.set(t.wbsId, []); m.get(t.wbsId).push(t); } return m; }, [sched]);
    const linked = useMemo(() => sched.tasks.filter((t) => t.wbsId && tree.byId.has(t.wbsId)), [sched, tree]);
    const rootRoll = useMemo(() => aggregate(linked), [linked]);
    const unlinked = sched.tasks.length - linked.length;
    const showRoll = linked.length > 0;
    const maxDepth = useMemo(() => tree.flat.reduce((m, f) => Math.max(m, f.depth), 0), [tree]);
    const todoCount = useMemo(() => tree.flat.filter((f) => f.isLeaf && !(directTasks.get(f.node.id) || []).length).length, [tree, directTasks]);
    const respOptions = useMemo(() => { const s = new Set(DEFAULT_ROLES); for (const n of tree.nodes) if (txt(n.responsible)) s.add(txt(n.responsible)); return [...s]; }, [tree]);
    const blInfo = useMemo(() => {
      const b = baselines.scope; if (!b) return null;
      const snap = b.scope && Array.isArray(b.scope.wbs) ? b.scope.wbs : [];
      const old = new Map(snap.filter((n) => n && n.id).map((n) => [n.id, n]));
      let added = 0, removed = 0, renamed = 0; const addedIds = new Set();
      for (const [id, n] of tree.byId) { const o = old.get(id); if (!o) { added++; addedIds.add(id); } else if (txt(o.name) !== txt(n.name)) renamed++; }
      for (const id of old.keys()) if (!tree.byId.has(id)) removed++;
      return { label: b.label || 'LB' + num(b.number), date: b.date, added, removed, renamed, addedIds };
    }, [baselines.scope, tree]);
    const issues = useMemo(() => {
      const out = []; const item = (f) => ({ id: f.node.id, code: f.code, name: f.node.name });
      const single = tree.flat.filter((f) => tree.childrenOf(f.node.id).length === 1).map(item);
      if (tree.nodes.length && tree.childrenOf(null).length === 1) single.unshift({ id: ROOT, code: '1', name: project && project.name });
      if (single.length) out.push({ id: 'single', text: (single.length === 1 ? '1 elemento tiene' : single.length + ' elementos tienen') + ' un solo componente. Según la regla del 100 %, descompón en dos o más elementos o elimina el nivel intermedio.', items: single });
      const leaves = tree.flat.filter((f) => f.isLeaf);
      const noResp = leaves.filter((f) => !txt(f.node.responsible)).map(item);
      if (noResp.length) out.push({ id: 'resp', text: plural(noResp.length, 'paquete de trabajo sin responsable.', 'paquetes de trabajo sin responsable.'), items: noResp });
      const noAcc = leaves.filter((f) => !txt(f.node.acceptance)).map(item);
      if (noAcc.length) out.push({ id: 'acc', text: plural(noAcc.length, 'paquete de trabajo sin criterios de aceptación.', 'paquetes de trabajo sin criterios de aceptación.'), items: noAcc });
      const unnamed = tree.flat.filter((f) => !txt(f.node.name)).map(item);
      if (unnamed.length) out.push({ id: 'name', text: plural(unnamed.length, 'elemento sin nombre.', 'elementos sin nombre.'), items: unnamed });
      if (unlinked > 0) out.push({ id: 'unlinked', text: plural(unlinked, 'actividad del cronograma no está vinculada', 'actividades del cronograma no están vinculadas') + ' a ningún elemento de la EDT.' });
      return out;
    }, [tree, unlinked, project && project.name]);

    const sel = selectedId === ROOT || (selectedId && tree.byId.has(selectedId)) ? selectedId : null;

    /* estado vivo para las acciones (identidad estable) */
    const live = useRef({});
    live.current = { wbs: { ...wbs, nodes }, schedule, costs, raci, raciExists: raciMeta.exists, tree, visible, collapsed, editingId, canWrite, wide, tab, pid, saveWbs: model.saveWbs, saveSchedule: model.saveSchedule, saveCosts: model.saveCosts, saveRaci };

    const actions = useMemo(() => {
      const L = () => live.current;
      const setColl = (s) => { live.current.collapsed = s; setCollapsed(s); PM.prefs.set('wbs.collapsed.' + L().pid, [...s]); };
      const setEditing = (id) => { live.current.editingId = id; setEditingId(id); };
      const expand = (ids) => { const c = L().collapsed; if (!ids.some((x) => c.has(x))) return; const s = new Set(c); ids.forEach((x) => s.delete(x)); setColl(s); };
      const commitNodes = (next) => { const cur = L(); const w = { ...cur.wbs, nodes: next }; cur.wbs = w; cur.saveWbs(w); };
      const commit = (res, focus = true) => {
        if (!res) return false;
        commitNodes(res.nodes);
        if (res.id) { if (focus) A.edit(res.id); else A.select(res.id); }
        if (res.expand) expand([res.expand]);
        return true;
      };
      const saveSched = (tasks) => { const cur = L(); const base = cur.schedule && cur.schedule.settings ? cur.schedule : { ...PM.EMPTY.schedule, ...(cur.schedule || {}) }; const next = { ...base, tasks }; cur.schedule = next; cur.saveSchedule(next); };
      const clearRefs = (gone) => {
        const cur = L();
        const tasks = (cur.schedule && cur.schedule.tasks) || [];
        if (tasks.some((t) => t.wbsId && gone.has(t.wbsId))) saveSched(tasks.map((t) => (t.wbsId && gone.has(t.wbsId) ? { ...t, wbsId: null } : t)));
        const acts = (cur.costs && cur.costs.actuals) || [];
        if (acts.some((a) => a && a.wbsId && gone.has(a.wbsId))) cur.saveCosts({ ...cur.costs, actuals: acts.map((a) => (a && a.wbsId && gone.has(a.wbsId) ? { ...a, wbsId: null } : a)) });
        const rows = (cur.raci && cur.raci.rows) || [];
        if (cur.raciExists && rows.some((r) => r && r.wbsId && gone.has(r.wbsId))) { cur.saveRaci({ ...cur.raci, rows: rows.map((r) => (r && r.wbsId && gone.has(r.wbsId) ? { ...r, wbsId: null } : r)) }); PM.touchProject(cur.pid); }
      };
      const wbsIndex = (tree) => new Map(tree.flat.map((f, i) => [f.node.id, i]));
      const A = {
        select(id) { setSelectedId(id); if (L().editingId && L().editingId !== id) setEditing(null); },
        codeClick(id) { if (drag.current && drag.current.moved) return; A.openDict(id); },
        /* arrastre con puntero (ratón o lápiz); se escribe una sola vez al soltar */
        dragStart(e, id) {
          if (!L().canWrite || e.button !== 0 || e.pointerType === 'touch') return;
          const st = { id, x: e.clientX, y: e.clientY, moved: false, hint: null };
          drag.current = st;
          const hintAt = (cx0, cy0) => {
            const el = document.elementFromPoint(cx0, cy0); const tr = el && el.closest ? el.closest('tr[data-wbs-row]') : null;
            if (!tr) return null;
            const tid = tr.dataset.wbsRow === 'root' ? ROOT : tr.dataset.wbsRow;
            const tree = L().tree;
            if (tid === id || (tid !== ROOT && tree.descendants(id).includes(tid))) return null;
            if (tid === ROOT) return { id: ROOT, pos: 'inside' };
            const r = tr.getBoundingClientRect(); const rel = (cy0 - r.top) / Math.max(1, r.height);
            return { id: tid, pos: rel < 0.3 ? 'before' : rel > 0.7 ? 'after' : 'inside' };
          };
          const onMove = (ev) => {
            if (!st.moved) { if (Math.abs(ev.clientX - st.x) + Math.abs(ev.clientY - st.y) < 6) return; st.moved = true; document.body.classList.add('wbs-dragging'); setDragId(id); }
            ev.preventDefault();
            const hnt = hintAt(ev.clientX, ev.clientY);
            if (JSON.stringify(hnt) !== JSON.stringify(st.hint)) { st.hint = hnt; setDropHint(hnt); }
          };
          const end = (ev, commitIt) => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel); window.removeEventListener('keydown', onKey, true);
            document.body.classList.remove('wbs-dragging'); setDropHint(null); setDragId(null);
            if (commitIt && st.moved && st.hint) {
              if (!commit(treeOps.moveTo(L().wbs.nodes, id, st.hint.id, st.hint.pos), false)) PM.toast('No se puede mover un elemento dentro de su propia rama.');
            }
            setTimeout(() => { if (drag.current === st) drag.current = null; }, 0);
          };
          const onUp = (ev) => end(ev, true);
          const onCancel = (ev) => end(ev, false);
          const onKey = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); end(ev, false); } };
          window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onCancel); window.addEventListener('keydown', onKey, true);
        },
        edit(id) { setSelectedId(id); setEditing(id); pendingFocus.current = { id, el: 'input' }; },
        /* termina la edición del nombre y deja el foco en la fila (Esc) */
        stopEdit(id) { setEditing(null); pendingFocus.current = { id, el: 'view' }; },
        /* teclado sobre el nombre en modo lectura: Enter, F2 o Espacio editan; ↑/↓ recorren las filas */
        viewKeyDown(e, id) {
          const k = e.key;
          if ((k === 'Enter' || k === 'F2' || k === ' ') && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); A.edit(id); return; }
          if ((k === 'ArrowUp' || k === 'ArrowDown') && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            const vis = L().visible; const i = vis.findIndex((f) => f.node.id === id); const t = vis[i + (k === 'ArrowUp' ? -1 : 1)];
            if (t) focusName(t.node.id);
          }
        },
        openDict(id) { const cur = L(); A.select(id); if (!(cur.wide && cur.tab === 'arbol')) setDictId(id); },
        toggle(id) { const s = new Set(L().collapsed); if (s.has(id)) s.delete(id); else s.add(id); setColl(s); },
        expandAll() { setColl(new Set()); },
        collapseAll() { setColl(new Set(L().tree.nodes.filter((n) => L().tree.childrenOf(n.id).length).map((n) => n.id))); },
        reveal(id) {
          if (id === ROOT) { setSelectedId(ROOT); return; }
          const cur = L(); const tree = cur.tree; if (!tree.byId.has(id)) return;
          expand(tree.ancestors(id));
          if (cur.canWrite) A.edit(id); else { A.select(id); if (!cur.wide) setDictId(id); }
          setTimeout(() => { const el = document.querySelector('[data-wbs-row="' + cssId(id) + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 40);
        },
        patch(id, patch) { if (!L().canWrite) return; commitNodes(L().wbs.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))); },
        addChild(parentId) { if (!L().canWrite) return; commit(treeOps.addChild(L().wbs.nodes, parentId === ROOT ? null : parentId)); },
        addSibling(id) { if (!L().canWrite) return; if (!id || id === ROOT) { commit(treeOps.addChild(L().wbs.nodes, null)); return; } commit(treeOps.addSibling(L().wbs.nodes, id)); },
        indent(id) { if (!L().canWrite || !id || id === ROOT) return; if (!commit(treeOps.indent(L().wbs.nodes, id))) PM.toast('Para aumentar la sangría, el elemento necesita otro elemento antes de él en el mismo nivel.'); },
        outdent(id) { if (!L().canWrite || !id || id === ROOT) return; if (!commit(treeOps.outdent(L().wbs.nodes, id))) PM.toast('El elemento ya está en el primer nivel de la EDT.'); },
        move(id, d) { if (!L().canWrite || !id || id === ROOT) return; commit(treeOps.move(L().wbs.nodes, id, d)); },
        focusNext(id, d) { const vis = L().visible; const i = vis.findIndex((f) => f.node.id === id); const t = vis[i + d]; if (t) A.edit(t.node.id); },
        removeIfBlank(id) {
          const cur = L(); if (!cur.canWrite) return false;
          const n = cur.tree.byId.get(id); if (!n || cur.tree.childrenOf(id).length) return false;
          if (['name', 'description', 'responsible', 'deliverable', 'acceptance', 'notes'].some((k) => txt(n[k])) || num(n.costEstimate) > 0) return false;
          if (((cur.schedule && cur.schedule.tasks) || []).some((t) => t.wbsId === id)) return false;
          const vis = cur.visible; const i = vis.findIndex((f) => f.node.id === id); const prev = vis[i - 1] || vis[i + 1];
          commitNodes(renumber(cur.wbs.nodes.filter((x) => x.id !== id)));
          if (prev) A.edit(prev.node.id); else { setSelectedId(null); setEditing(null); }
          return true;
        },
        keyDown(e, id) {
          const k = e.key;
          if (e.isComposing) return;
          const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
          if (k === 'Enter' && plain && !e.shiftKey) { e.preventDefault(); A.addSibling(id); return; }
          if (k === 'Tab' && plain) { e.preventDefault(); if (e.shiftKey) A.outdent(id); else A.indent(id); return; }
          if ((k === 'ArrowUp' || k === 'ArrowDown') && e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); A.move(id, k === 'ArrowUp' ? -1 : 1); return; }
          if ((k === 'ArrowUp' || k === 'ArrowDown') && plain && !e.shiftKey) { e.preventDefault(); A.focusNext(id, k === 'ArrowUp' ? -1 : 1); return; }
          if (k === 'Backspace' && plain && e.currentTarget.value === '') { if (A.removeIfBlank(id)) e.preventDefault(); return; }
          if (k === 'Escape') { e.preventDefault(); A.stopEdit(id); }
        },
        async remove(id) {
          const cur = L(); if (!cur.canWrite || !id || id === ROOT) return;
          const tree = cur.tree; const n = tree.byId.get(id); if (!n) return;
          const desc = tree.descendants(id);
          const gone = new Set([id, ...desc]);
          const nTasks = ((cur.schedule && cur.schedule.tasks) || []).filter((t) => t.wbsId && gone.has(t.wbsId)).length;
          const code = tree.codes.get(id);
          const ok = await PM.confirm({
            title: 'Eliminar elemento de la EDT',
            body: html`<div class="stack-sm">
              <p>Se eliminará <strong>${code} ${txt(n.name) || 'Sin nombre'}</strong>${desc.length ? html` junto con ${plural(desc.length, 'elemento que lo compone', 'elementos que lo componen')}` : ''}.</p>
              ${nTasks ? html`<p class="small muted">${plural(nTasks, 'actividad del cronograma quedará', 'actividades del cronograma quedarán')} sin vínculo con la EDT. Las actividades no se eliminan.</p>` : null}
              <p class="small muted">Esta acción no se puede deshacer.</p>
            </div>`,
            confirmText: desc.length ? 'Eliminar ' + (desc.length + 1) + ' elementos' : 'Eliminar elemento', tone: 'danger',
          });
          if (!ok) return;
          const c2 = L();
          const parent = c2.tree.parentOf.get(id) || null;
          const sibs = c2.tree.childrenOf(parent); const si = sibs.findIndex((x) => x.id === id);
          const nextSel = (sibs[si - 1] && sibs[si - 1].id) || (sibs[si + 1] && sibs[si + 1].id) || parent;
          commitNodes(renumber(c2.wbs.nodes.filter((x) => !gone.has(x.id))));
          clearRefs(gone);
          setSelectedId(nextSel); setEditing(null); setDictId((d) => (d && gone.has(d) ? null : d));
          PM.toast(desc.length ? 'Se eliminaron ' + (desc.length + 1) + ' elementos de la EDT.' : 'Elemento eliminado de la EDT.');
        },
        createTask(id) {
          const cur = L(); if (!cur.canWrite) return;
          const tree = cur.tree; const n = tree.byId.get(id); if (!n) return;
          const tasks = (cur.schedule && cur.schedule.tasks) || [];
          saveSched(insertTask(tasks, newTask(n, tree.codes.get(id)), wbsIndex(tree)));
          PM.toast('Actividad creada en el cronograma para ' + tree.codes.get(id) + '.');
        },
        async generate() {
          const cur = L(); if (!cur.canWrite) return;
          const tree = cur.tree;
          if (!tree.leaves.size) { PM.toast('La EDT aún no tiene paquetes de trabajo.'); return; }
          const has = new Set(((cur.schedule && cur.schedule.tasks) || []).map((t) => t.wbsId).filter(Boolean));
          const todo = tree.flat.filter((f) => f.isLeaf && !has.has(f.node.id));
          if (!todo.length) { PM.toast('Todos los paquetes de trabajo ya tienen actividades en el cronograma.'); return; }
          const ok = await PM.confirm({
            title: 'Generar actividades en el cronograma',
            body: html`<div class="stack-sm">
              <p>Se creará una actividad de 5 días hábiles por cada paquete de trabajo que aún no tiene actividades: <strong>${plural(todo.length, 'actividad', 'actividades')}</strong>.</p>
              <p class="small muted">Cada actividad queda vinculada a su paquete y toma su costo estimado como presupuesto. Después ajusta duraciones, dependencias y recursos en el cronograma.</p>
            </div>`,
            confirmText: todo.length === 1 ? 'Crear 1 actividad' : 'Crear ' + todo.length + ' actividades',
          });
          if (!ok) return;
          const c2 = L(); const t2 = c2.tree; const idx = wbsIndex(t2);
          const has2 = new Set(((c2.schedule && c2.schedule.tasks) || []).map((t) => t.wbsId).filter(Boolean));
          let tasks = [...((c2.schedule && c2.schedule.tasks) || [])]; let made = 0;
          for (const f of t2.flat) { if (!f.isLeaf || has2.has(f.node.id)) continue; tasks = insertTask(tasks, newTask(f.node, f.code), idx); made++; }
          saveSched(tasks);
          PM.toast(made === 1 ? 'Se creó 1 actividad en el cronograma.' : 'Se crearon ' + made + ' actividades en el cronograma.');
        },
        openTemplates() {
          if (!L().canWrite) return;
          const count = L().wbs.nodes.length;
          PM.openModal((close) => html`<${TemplatePicker} close=${close} count=${count} onPick=${(t) => { close(); A.applyTemplate(t); }} />`);
        },
        async applyTemplate(t) {
          const cur = L(); if (!cur.canWrite) return;
          const old = cur.wbs.nodes;
          if (old.length) {
            const ids = new Set(old.map((n) => n.id));
            const nTasks = ((cur.schedule && cur.schedule.tasks) || []).filter((x) => x.wbsId && ids.has(x.wbsId)).length;
            const ok = await PM.confirm({
              title: 'Reemplazar la EDT',
              body: html`<div class="stack-sm"><p>La EDT actual (${plural(old.length, 'elemento', 'elementos')}) se reemplazará por la plantilla <strong>${t.name}</strong>.</p>
                ${nTasks ? html`<p class="small muted">${plural(nTasks, 'actividad del cronograma quedará', 'actividades del cronograma quedarán')} sin vínculo con la EDT.</p>` : null}
                <p class="small muted">Esta acción no se puede deshacer.</p></div>`,
              confirmText: 'Reemplazar EDT', tone: 'danger',
            });
            if (!ok) return;
          }
          const prevIds = new Set(L().wbs.nodes.map((n) => n.id));
          commitNodes(buildTemplate(t));
          if (prevIds.size) clearRefs(prevIds);
          setColl(new Set()); setSelectedId(null); setEditing(null); setDictId(null); setTabRaw('arbol'); PM.prefs.set('wbs.tab', 'arbol');
          PM.toast('Se aplicó la plantilla «' + t.name + '». Ajusta nombres, responsables y costos en el diccionario.');
        },
        addFirst() { if (!L().canWrite) return; setTabRaw('arbol'); PM.prefs.set('wbs.tab', 'arbol'); commit(treeOps.addChild(L().wbs.nodes, null)); },
      };
      return A;
    }, []);

    /* foco pendiente tras crear o mover elementos; síncrono tras el render para que la fila anterior, que deja de
       tener campo, no devuelva el foco al documento entre dos teclas */
    useLayoutEffect(() => { const p = pendingFocus.current; if (!p) return; pendingFocus.current = null; if (p.el === 'view') focusName(p.id); else focusInput(p.id); });

    const hasLB = !!PM.getView('lineas-base');
    const changesText = blInfo ? (() => {
      const parts = [];
      if (blInfo.added) parts.push(plural(blInfo.added, 'agregado', 'agregados'));
      if (blInfo.removed) parts.push(plural(blInfo.removed, 'eliminado', 'eliminados'));
      if (blInfo.renamed) parts.push(plural(blInfo.renamed, 'renombrado', 'renombrados'));
      return parts.length ? parts.join(' · ') + ' desde ' + blInfo.label : 'Sin cambios desde ' + blInfo.label;
    })() : '';
    const changed = blInfo && (blInfo.added || blInfo.removed || blInfo.renamed);
    const blDate = blInfo && blInfo.date ? String(blInfo.date).slice(0, 10) : null;
    const baselineLine = blInfo
      ? html`<${ui.Chip} tone="info" icon="flag" title=${blDate && PM.date.valid(blDate) ? 'Aprobada el ' + PM.fmt.date(blDate, 'long') : undefined}>Línea base del alcance ${blInfo.label}</${ui.Chip}>
          <span class=${cx('small', changed ? 'wbs-bl-changed' : 'muted')} data-wbs-bl-changes>${changesText}</span>
          ${hasLB ? html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => PM.navigate('lineas-base')}>Ver líneas base</${ui.Button}>` : null}`
      : html`<${ui.Chip} tone="outline" icon="flag">Sin línea base del alcance</${ui.Chip}>
          ${hasLB && canWrite && nodes.length ? html`<${ui.Button} size="sm" variant="ghost" iconRight="arrow-right" onClick=${() => PM.navigate('lineas-base')}>Establecer línea base</${ui.Button}>` : null}`;

    const header = html`<${ui.PageHeader} eyebrow="5.4 Crear la EDT/WBS" title="Estructura de desglose del trabajo (EDT)"
      description="Descompone el alcance total del proyecto en entregables y paquetes de trabajo. Junto con el enunciado del alcance y el diccionario de la EDT forma la línea base del alcance."
      actions=${canWrite && nodes.length ? html`
        <${ui.Button} icon="layers" onClick=${actions.openTemplates}>Plantillas de EDT</${ui.Button}>
        <${ui.Button} icon="gantt" onClick=${actions.generate} title=${todoCount ? plural(todoCount, 'paquete de trabajo sin actividades', 'paquetes de trabajo sin actividades') : 'Todos los paquetes de trabajo tienen actividades'}>Generar actividades en el cronograma</${ui.Button}>` : null} />`;

    const datalist = html`<datalist id="wbs-resp-options">${respOptions.map((r) => html`<option key=${r} value=${r} />`)}</datalist>`;

    if (model.loading && !nodes.length) return html`<div class="page">${header}<${ui.Loading} rows=${6} /></div>`;

    if (!nodes.length) {
      return html`<div class="page" data-wbs-view>
        ${header}
        ${blInfo ? html`<div class="card wbs-kpis"><div class="wbs-bl" style="margin-left:0">${baselineLine}</div></div>` : null}
        <${ui.Empty} icon="wbs" title=${canWrite ? 'Crea la estructura de desglose del trabajo' : 'Este proyecto aún no tiene EDT'}
          actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${actions.addFirst}>Agregar primer entregable</${ui.Button}><${ui.Button} icon="layers" onClick=${actions.openTemplates}>Usar una plantilla</${ui.Button}>` : null}>
          La EDT descompone el alcance total del proyecto en entregables y, en el nivel más bajo, en paquetes de trabajo, donde se estiman costos y duraciones. Cumple la regla del 100 %: los elementos hijos suman exactamente el trabajo de su elemento padre, ni más ni menos.${canWrite ? '' : ' Quien tenga permiso de edición puede crearla.'}
        </${ui.Empty}>
      </div>`;
    }

    const d = { tree, est, rollup, rootRoll, directTasks, canWrite, actions, currency, project, unlinked };
    const panelOn = wide && tab === 'arbol' && !!sel;
    const selLabel = sel === ROOT ? '1 ' + ((project && project.name) || '') : sel ? tree.codes.get(sel) + ' ' + (txt(tree.byId.get(sel).name) || 'Sin nombre') : '';
    const selPos = sel && sel !== ROOT ? pos.get(sel) : null;
    const selDepth = sel && sel !== ROOT ? tree.depth.get(sel) : 0;

    const toolbar = html`<div class="toolbar wbs-toolbar" role="toolbar" aria-label="Edición de la EDT">
      ${canWrite ? html`
        <${ui.Button} size="sm" icon="plus" onClick=${() => actions.addChild(sel || null)} title=${sel && sel !== ROOT ? 'Agrega un elemento debajo de ' + selLabel : 'Agrega un elemento de primer nivel'}>Agregar hijo</${ui.Button}>
        <${ui.Button} size="sm" icon="plus" disabled=${!sel} onClick=${() => actions.addSibling(sel)} title="Agrega un elemento en el mismo nivel (Enter)">Agregar hermano</${ui.Button}>
        <span class="toolbar-sep"></span>
        <${ui.IconButton} size="sm" icon="outdent" label="Disminuir sangría (Mayús+Tab)" disabled=${!selPos || selDepth <= 1} onClick=${() => actions.outdent(sel)} />
        <${ui.IconButton} size="sm" icon="indent" label="Aumentar sangría (Tab)" disabled=${!selPos || selPos.i === 0} onClick=${() => actions.indent(sel)} />
        <${ui.IconButton} size="sm" icon="arrow-up" label="Subir (Alt+↑)" disabled=${!selPos || selPos.i === 0} onClick=${() => actions.move(sel, -1)} />
        <${ui.IconButton} size="sm" icon="arrow-down" label="Bajar (Alt+↓)" disabled=${!selPos || selPos.i >= selPos.n - 1} onClick=${() => actions.move(sel, 1)} />
        <span class="toolbar-sep"></span>
        <${ui.IconButton} size="sm" icon="trash" label="Eliminar elemento" disabled=${!selPos} onClick=${() => actions.remove(sel)} />` : null}
      ${!wide ? html`<${ui.Button} size="sm" icon="book" disabled=${!sel} onClick=${() => actions.openDict(sel)}>Diccionario</${ui.Button}>` : null}
      <span class="wbs-tb-right">
        <${ui.Button} size="sm" variant="ghost" icon="chevron-down" onClick=${actions.expandAll}>Expandir todo</${ui.Button}>
        <${ui.Button} size="sm" variant="ghost" icon="chevron-up" onClick=${actions.collapseAll}>Contraer todo</${ui.Button}>
      </span>
    </div>`;

    const rootMenu = canWrite
      ? [{ label: 'Agregar elemento de primer nivel', icon: 'plus', onClick: () => actions.addChild(null) }, { label: 'Ver resumen del proyecto', icon: 'book', onClick: () => actions.openDict(ROOT) }]
      : [{ label: 'Ver resumen del proyecto', icon: 'book', onClick: () => actions.openDict(ROOT) }];

    const treeTable = html`<${FitWrap}>
      <table class="table wbs-table" data-wbs-tree>
        <thead><tr>
          <th class="wbs-c-menu"><span class="sr-only">Acciones</span></th>
          <th>Código</th><th>Nombre</th><th>Tipo</th>
          <th class="num" title="Costo estimado de los paquetes de trabajo, consolidado hacia arriba">Costo estimado</th>
          ${showRoll ? html`<th class="num" title="Presupuesto de las actividades vinculadas del cronograma">Costo actividades</th><th>Inicio</th><th>Fin</th><th class="num">Avance</th>` : null}
        </tr></thead>
        <tbody>
          <tr class=${cx('wbs-row wbs-root', sel === ROOT && 'is-selected', dropHint && dropHint.id === ROOT && 'wbs-drop-inside')} data-wbs-row="root" data-code="1" onClick=${(e) => { if (e.target.closest('button, select, input, textarea, a, .menu')) return; actions.select(ROOT); }}>
            <td class="wbs-c-menu"><${RowMenu} label="Acciones del proyecto" items=${rootMenu} /></td>
            <td class="wbs-c-code"><button type="button" class="wbs-code-btn" data-wbs-code="root" aria-label="1: ver resumen del proyecto" title="Resumen del proyecto" onClick=${() => actions.openDict(ROOT)}>1</button></td>
            <td><div class="wbs-namecell"><span class="wbs-root-name">${(project && project.name) || 'Proyecto'}</span></div></td>
            <td><${ui.Chip} tone="outline">Proyecto</${ui.Chip}></td>
            ${moneyCell(est.total, currency, true, 'Suma de todos los paquetes de trabajo')}
            ${showRoll ? rollCells(rootRoll, currency) : null}
          </tr>
          ${visible.map((f) => {
            const id = f.node.id; const roll = rollup.get(id); const estV = est.est.get(id) || 0; const p = pos.get(id) || { i: 0, n: 1 };
            const isColl = !f.isLeaf && collapsed.has(id); const hidden = isColl ? tree.descendants(id).length : 0;
            const added = !!(blInfo && blInfo.addedIds.has(id));
            const drop = dropHint && dropHint.id === id ? dropHint.pos : null;
            const sig = JSON.stringify([f.node, f.code, f.depth, f.isLeaf, isColl, hidden, sel === id, editingId === id, canWrite, showRoll, estV, roll && roll.count ? [roll.cost, roll.start, roll.finish, Math.round(roll.progress * 10), roll.count] : 0, p.i, p.n, added, currency, wide, drop, dragId === id]);
            return html`<${TreeRow} key=${id} sig=${sig} f=${f} roll=${roll} estV=${estV} showRoll=${showRoll} collapsed=${isColl} hiddenCount=${hidden} selected=${sel === id} editing=${editingId === id} canWrite=${canWrite} pos=${p} added=${added} currency=${currency} wide=${wide} actions=${actions} drop=${drop} dragging=${dragId === id} />`;
          })}
        </tbody>
      </table>
    </${FitWrap}>`;

    const keysHint = canWrite ? html`<div class="wbs-keys" aria-label="Atajos de teclado">
      <span>Haz clic en un nombre o pulsa <span class="kbd">F2</span> para editarlo. Al editar:</span>
      <span><span class="kbd">Enter</span> nuevo elemento</span>
      <span><span class="kbd">Tab</span><span class="kbd">Mayús+Tab</span> sangría</span>
      <span><span class="kbd">Alt+↑</span><span class="kbd">Alt+↓</span> mover</span>
      <span><span class="kbd">↑</span><span class="kbd">↓</span> cambiar de fila</span>
      <span><span class="kbd">Esc</span> terminar</span>
      <span>Arrastra el código para mover un elemento.</span>
    </div>` : null;

    const panel = panelOn ? html`<aside class="card wbs-panel" aria-label="Diccionario de la EDT">
      <div class="wbs-panel-head">
        <div class="stack-sm" style="gap:2px;min-width:0"><div class="label-caps">${sel === ROOT ? 'Resumen del proyecto' : 'Diccionario de la EDT'}</div><h3 class="h3" style="overflow-wrap:anywhere">${selLabel}</h3></div>
        <${ui.IconButton} icon="x" label="Cerrar diccionario" onClick=${() => { setSelectedId(null); setEditingId(null); }} />
      </div>
      <div class="wbs-panel-body"><${DictBody} id=${sel} d=${d} /></div>
    </aside>` : null;

    const dictOpen = dictId && (dictId === ROOT || tree.byId.has(dictId)) && !(wide && tab === 'arbol');
    const dictTitle = dictOpen ? (dictId === ROOT ? 'Resumen del proyecto' : 'Diccionario de la EDT') : '';
    const dictSub = dictOpen ? (dictId === ROOT ? (project && project.name) : tree.codes.get(dictId) + ' ' + (txt(tree.byId.get(dictId).name) || 'Sin nombre')) : '';

    return html`<div class="page" data-wbs-view>
      ${header}
      ${datalist}
      <div class="card wbs-kpis" data-wbs-kpis>
        <div class="wbs-kpi"><span class="wbs-kpi-v">${tree.nodes.length}</span><span class="wbs-kpi-l">${tree.nodes.length === 1 ? 'elemento' : 'elementos'}</span></div>
        <div class="wbs-kpi"><span class="wbs-kpi-v">${tree.leaves.size}</span><span class="wbs-kpi-l">${tree.leaves.size === 1 ? 'paquete de trabajo' : 'paquetes de trabajo'}</span></div>
        <div class="wbs-kpi"><span class="wbs-kpi-v">${maxDepth + 1}</span><span class="wbs-kpi-l">niveles</span></div>
        <div class="wbs-kpi" title=${PM.fmt.money(est.total, currency)}><span class="wbs-kpi-v">${est.total > 0 ? PM.fmt.moneyShort(est.total, currency) : '—'}</span><span class="wbs-kpi-l">costo estimado</span></div>
        <div class="wbs-bl" data-wbs-baseline>${baselineLine}</div>
      </div>
      <${ui.Tabs} tabs=${[{ id: 'arbol', label: 'Árbol', icon: 'indent', count: tree.nodes.length }, { id: 'diagrama', label: 'Diagrama', icon: 'wbs' }, { id: 'diccionario', label: 'Diccionario', icon: 'book' }]} value=${tab} onChange=${setTab} />
      ${tab === 'arbol' ? html`<div class=${cx('wbs-layout', panelOn && 'has-panel')}>
          <div class="wbs-main">${toolbar}<${Notices} issues=${issues} onPick=${actions.reveal} />${treeTable}${keysHint}</div>
          ${panel}
        </div>`
      : tab === 'diagrama' ? html`<${WbsDiagram} tree=${tree} project=${project} est=${est} rollup=${rollup} currency=${currency} onOpen=${(id) => { setSelectedId(id); setDictId(id); }} />`
      : html`<${DictTab} tree=${tree} est=${est} directTasks=${directTasks} canWrite=${canWrite} currency=${currency} actions=${actions} project=${project} />`}
      ${dictOpen ? html`<${ui.Modal} title=${dictTitle} subtitle=${dictSub} size="wide" onClose=${() => setDictId(null)}
          footer=${html`<${ui.Button} variant="primary" onClick=${() => setDictId(null)}>Listo</${ui.Button}>`}>
          <${DictBody} id=${dictId} d=${{ ...d, suffix: '-m' }} />
        </${ui.Modal}>` : null}
    </div>`;
  }

  PM.registerView({ id: 'edt', label: 'EDT', group: 'planificacion', order: 10, icon: 'wbs', component: WbsView, needsProject: true, description: 'Estructura de desglose del trabajo y diccionario' });
})();

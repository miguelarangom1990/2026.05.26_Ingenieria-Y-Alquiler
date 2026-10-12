/* ==========================================================================
   42-resources.js — Catálogo de recursos del proyecto (§10.4). Personas,
   cuadrillas, equipos, materiales y servicios con su tipo, clase (trabajo o
   consumible), unidad, disponibilidad y costo (9.2 Estimar los recursos de
   las actividades; 9.3 Adquirir recursos); recursos no planificados con su
   motivo, consumo de la reserva para contingencias y solicitud de cambio
   cuando afectan la línea base (9.6 Controlar los recursos; 4.6 Realizar el
   control integrado de cambios); tipos del proyecto con presets; recursos
   «sin clasificar» que solo existen como nombres en el cronograma.
   No registra vistas: la vista «recursos» (40) muestra PM.ResourceCatalog en
   su pestaña «Catálogo». Expone:
     PM.ResourceCatalog(props)                         componente (se suscribe con PM.useResourceModel)
     PM.resourceDialog(model, item|null, initial)      → Promise<recurso guardado|null>
     PM.resourceTypesDialog(model)                     → Promise<boolean> (true si se guardaron los tipos)
     PM.unplannedResourceFlow(model, item, opts?)      → Promise<item con motivo|null> (no guarda)
     PM.resourceClassifyDialog(model)                  → Promise<number> (recursos clasificados)
   Los diálogos trabajan sobre el proyecto actual con sus propias suscripciones; model se acepta por
   compatibilidad y no se usa para guardar.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib || !PM.res || !PM.RES || !PM.useResourceModel) return;
  const { html, useState, useMemo, useRef, useCallback } = PM.lib;
  const ui = PM.ui;
  const cx = PM.cx;
  const D = PM.date;
  const fmt = PM.fmt;
  const R = PM.res;
  const RES = PM.RES;
  const num = PM.num;
  const isNum = PM.isNum;
  const arr = (x) => (Array.isArray(x) ? x : []);
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const str = (v) => (v === null || v === undefined ? '' : String(v));
  const plural = (n, one, many) => fmt.num(n) + ' ' + (n === 1 ? one : many);
  const norm = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const focusEl = (find) => setTimeout(() => { const el = find(); if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); } }, 0);
  const focusLater = (id) => focusEl(() => document.getElementById(id));
  const focusRadio = (name) => focusEl(() => document.querySelector('input[type="radio"][name="' + name + '"]'));

  /* ---------------------------------------------------------------- estilos del módulo */
  const CSS = `
.rcat { min-width: 0; }
.rcat-note { display: flex; gap: 10px; align-items: flex-start; padding: 9px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); color: var(--fg-2); font-size: var(--fs-sm); min-width: 0; }
.rcat-note > .icon { flex: none; margin-top: 2px; color: var(--fg-3); }
.rcat-note-body { min-width: 0; flex: 1; max-width: 120ch; }
.rcat-note.is-warn { border-color: var(--warn); background: var(--warn-wash); color: var(--fg); }
.rcat-note.is-warn > .icon { color: var(--warn); }
.rcat-note.is-info { border-color: var(--info); background: var(--info-wash); color: var(--fg); }
.rcat-note.is-info > .icon { color: var(--info); }
.rcat-note.is-good { border-color: var(--good); background: var(--good-wash); color: var(--fg); }
.rcat-note.is-good > .icon { color: var(--good); }
.rcat-note.is-crit { border-color: var(--crit); background: var(--crit-wash); color: var(--fg); }
.rcat-note.is-crit > .icon { color: var(--crit); }
.rcat-note-row { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; justify-content: space-between; }
.rcat-tiles-card { overflow: hidden; }
.rcat-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.rcat-tile { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px 13px; min-width: 0; box-shadow: 1px 0 0 var(--line), 0 1px 0 var(--line); }
.rcat-tile-label { font-size: var(--fs-xs); color: var(--fg-2); font-weight: 500; line-height: 1.35; }
.rcat-tile-value { font-family: var(--font-display); font-weight: 700; font-size: 1.45rem; line-height: 1.15; font-stretch: 105%; color: var(--fg); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.rcat-tile[data-tone="warn"] .rcat-tile-value { color: var(--warn); }
.rcat-tile-sub { font-size: var(--fs-xs); color: var(--fg-3); line-height: 1.35; overflow-wrap: anywhere; }
.rcat-tile-sub .icon { vertical-align: -2px; color: var(--warn); }
.rcat-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-width: 0; }
.rcat-bar .search { flex: 1 1 260px; min-width: 220px; max-width: 360px; }
.rcat-bar > .select { width: auto; max-width: 260px; flex: 0 1 auto; }
.rcat-count { font-size: var(--fs-xs); color: var(--fg-2); white-space: nowrap; }
.rcat-bar-acts { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto; }
@media (max-width: 680px) {
  .rcat-bar .search, .rcat-bar > .select { flex: 1 1 100%; max-width: none; width: 100%; min-width: 0; }
  .rcat-bar-acts { margin-left: 0; width: 100%; }
}
.rcat-twrap { max-height: none; }
.rcat-table td { vertical-align: top; }
.rcat-table th { vertical-align: bottom; }
.rcat-table .rcat-c-name { position: sticky; left: 0; z-index: 1; background: var(--surface); box-shadow: inset -1px 0 0 var(--line); min-width: 190px; max-width: 280px; white-space: normal; }
.rcat-table thead th.rcat-c-name { z-index: 3; background: var(--surface-2); }
.rcat-table tbody tr:hover td.rcat-c-name { background: var(--surface-2); }
.rcat-table td.rcat-none { padding: 16px 12px; color: var(--fg-2); position: static; }
@media (max-width: 680px) { .rcat-table .rcat-c-name { min-width: 148px; max-width: 168px; } }
.rcat-name { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; min-width: 0; }
.rcat-link { border: 0; background: transparent; padding: 0; margin: 0; color: var(--fg); font: inherit; font-weight: 600; text-align: left; cursor: pointer; line-height: 1.35; overflow-wrap: anywhere; }
.rcat-link:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.rcat-link:focus-visible, .rcat-sort:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
.rcat-link.is-ref { color: var(--accent); font-weight: 500; font-size: var(--fs-xs); text-decoration: underline; text-underline-offset: 2px; display: inline-flex; gap: 4px; align-items: center; }
.rcat-link.is-num { font-weight: 500; text-align: right; }
.rcat-sub { font-size: var(--fs-xs); color: var(--fg-2); line-height: 1.4; }
.rcat-faint { color: var(--fg-3); }
.rcat-crit { color: var(--crit); display: inline-flex; gap: 4px; align-items: center; font-weight: 500; }
.rcat-chip-wrap { white-space: normal; border-radius: var(--r-md); line-height: 1.35; padding-top: 2px; padding-bottom: 2px; max-width: 200px; }
.rcat-plan { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; min-width: 170px; max-width: 250px; white-space: normal; }
.rcat-wrap { white-space: normal; overflow-wrap: break-word; min-width: 110px; max-width: 220px; }
.rcat-table td.rcat-c-type { min-width: 120px; max-width: 210px; white-space: normal; overflow-wrap: break-word; }
.rcat-table td.rcat-c-avail { min-width: 110px; }
.rcat-table td.rcat-c-avail .rcat-sub { white-space: normal; }
.rcat-nowrap { white-space: nowrap; }
.rcat-acts { display: flex; gap: 2px; flex-wrap: nowrap; justify-content: flex-end; }
.rcat-sort { border: 0; background: transparent; padding: 0; margin: 0; font: inherit; color: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; }
.rcat-sort:hover { color: var(--accent); }
.rcat-sort .icon { color: var(--fg-3); }
.rcat-sort[data-active="1"] { color: var(--fg); text-decoration: underline; text-underline-offset: 3px; }
.rcat-th-sep { color: var(--fg-3); margin: 0 5px; }
.rcat-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
.rcat-form > .span-all { grid-column: 1 / -1; }
.rcat-form-h { grid-column: 1 / -1; font-family: var(--font-display); font-weight: 700; font-size: var(--fs-md); color: var(--fg); padding-top: 10px; border-top: 1px solid var(--line); margin: 2px 0 -4px; }
.rcat-form-h:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
@media (max-width: 560px) { .rcat-form { grid-template-columns: minmax(0, 1fr); } }
.rcat-box { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.rcat-box-row { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }
.rcat-box-h { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-md); color: var(--fg); margin: 0; }
.rcat-fs { border: 0; margin: 0; padding: 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.rcat-fs > legend { padding: 0; margin-bottom: 4px; }
.rcat-choice { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 3px 10px; padding: 9px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); cursor: pointer; align-items: start; }
.rcat-choice:hover { border-color: var(--line-strong); }
.rcat-choice:has(input:checked) { border-color: var(--accent); background: var(--accent-wash); box-shadow: inset 3px 0 0 var(--accent); }
.rcat-choice:focus-within { outline: 2px solid var(--accent); outline-offset: 1px; }
.rcat-choice > input { margin: 2px 0 0; width: 16px; height: 16px; accent-color: var(--accent); grid-row: 1 / span 3; }
.rcat-choice-t { font-weight: 600; font-size: var(--fs-sm); color: var(--fg); }
.rcat-choice-h { font-size: var(--fs-xs); color: var(--fg-2); line-height: 1.45; max-width: 92ch; }
.rcat-choice-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rcat-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.rcat-kv > div { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 8px 10px; min-width: 0; }
.rcat-kv-k { font-size: var(--fs-xs); color: var(--fg-2); }
.rcat-kv-v { font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--fg); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.rcat-kv > div[data-tone="crit"] .rcat-kv-v { color: var(--crit); }
.rcat-kv > div[data-tone="good"] .rcat-kv-v { color: var(--good); }
.rcat-abs { display: flex; flex-direction: column; gap: 8px; }
.rcat-abs-row { display: grid; grid-template-columns: 160px 160px minmax(0, 1fr) auto; gap: 8px; align-items: start; }
@media (max-width: 560px) {
  .rcat-abs-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; }
  .rcat-abs-row > .rcat-abs-note { grid-column: 1 / 3; grid-row: 2; }
  .rcat-abs-row > .rcat-abs-del { grid-column: 3; grid-row: 1; }
}
.rcat-dlist { margin: 0; padding-left: 20px; font-size: var(--fs-sm); max-height: 180px; overflow-y: auto; }
.rcat-types { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.rcat-trow { display: grid; grid-template-columns: auto minmax(160px, 1fr) minmax(170px, 200px) minmax(120px, 150px) 100px auto; gap: 6px 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.rcat-trow-move { display: flex; flex-wrap: nowrap; }
.rcat-trow-n { font-size: var(--fs-xs); color: var(--fg-2); }
.rcat-trow-panel { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--warn); background: var(--warn-wash); border-radius: var(--r-md); color: var(--fg); font-size: var(--fs-sm); }
.rcat-trow-panel > .select { width: auto; min-width: 200px; max-width: 100%; background-color: var(--surface); }
.rcat-trow .field-error { margin-top: 3px; }
@media (max-width: 760px) {
  .rcat-trow { grid-template-columns: auto minmax(0, 1fr) auto; }
  .rcat-trow > .rcat-trow-del { grid-column: 3; grid-row: 1; }
  .rcat-trow > .rcat-trow-kind, .rcat-trow > .rcat-trow-edr, .rcat-trow > .rcat-trow-n { grid-column: 2 / -1; }
}
.rcat-preset { display: grid; grid-template-columns: minmax(200px, 320px) auto auto; gap: 10px 12px; align-items: end; justify-content: start; }
@media (max-width: 640px) { .rcat-preset { grid-template-columns: minmax(0, 1fr); justify-content: stretch; } }
.rcat-ptypes { display: flex; flex-wrap: wrap; gap: 6px; }
.rcat-mtable td { vertical-align: middle; }
.rcat-mtable .select, .rcat-mtable .input { min-width: 140px; }
.rcat-mtable td.rcat-c-name { min-width: 170px; }
.rcat-all { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.rcat-all > .select { width: auto; min-width: 220px; max-width: 100%; }
`;
  if (!document.getElementById('css-resources')) {
    const st = document.createElement('style');
    st.id = 'css-resources';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- constantes y ayudantes */
  const KIND_LABEL = { trabajo: 'Trabajo', consumible: 'Consumible' };
  const KIND_SHORT = [{ value: 'trabajo', label: 'Trabajo (por día)' }, { value: 'consumible', label: 'Consumible (cantidad)' }];
  const STATUS_LABEL = Object.fromEntries(RES.STATUS.map((s) => [s.value, s.label]));
  const STATUS_TONE = { planificado: 'outline', solicitado: 'info', disponible: 'good', liberado: null };
  const STATUS_HINT = {
    planificado: 'Previsto en el plan; aún no se ha solicitado.',
    solicitado: 'Pedido al área, al proveedor o al arrendador; pendiente de llegar a la obra.',
    disponible: 'En el proyecto y listo para usarse.',
    liberado: 'Devuelto o retirado del proyecto: deja de contar en la capacidad del equipo.',
  };
  const REASON = new Map(RES.REASONS.map((r) => [r.value, r]));
  const EDR = ['Personal', 'Equipos', 'Materiales', 'Transporte', 'Servicios'];
  const UNCL = RES.UNCLASSIFIED.id;
  const AFFECTED = ['Línea base de costos', 'Línea base del cronograma', 'Línea base del alcance', 'Catálogo de recursos', 'Plan de gestión de los recursos'];
  const COST_MODE_LABEL = Object.fromEntries(RES.COST_MODES.map((c) => [c.value, c.label]));
  const PLAN_FILTERS = [
    { value: 'planificado', label: 'Planificados' },
    { value: 'no-planificado', label: 'No planificados' },
    { value: 'pendiente', label: 'Pendientes de solicitud de cambio' },
    { value: 'sin-clasificar', label: 'Sin clasificar' },
  ];

  const typeKnown = (types, id) => !!id && arr(types).some((t) => t.id === id);
  const isUnclassified = (cat, it) => !!it.virtual || !typeKnown(cat.types, it.typeId);
  /* línea base de costos o de cronograma vigente (la más reciente que incluya alguna de las dos) */
  const blInfo = (m) => {
    const b = m && m.baselines;
    const x = b && (b.cost || b.schedule);
    if (!x) return null;
    const parts = [b.cost ? 'costos' : null, b.schedule ? 'cronograma' : null].filter(Boolean).join(' y ');
    return { label: str(x.label) || 'LB' + num(x.number, 0), date: x.date, parts };
  };
  const needsChange = (it) => !!it && it.planned === false && !!(REASON.get(it.reason) || {}).baseline && !str(it.changeRef).trim();
  const openDoc = (docId) => (PM.openDocument ? PM.openDocument(docId) : PM.navigate('documento', { docId }));
  /* abre la solicitud de cambio de un recurso: por su documento, por el código en las solicitudes del proyecto o, si no
     se encuentra, el registro de cambios */
  async function openChange(pid, it) {
    if (it && it.changeDocId) return openDoc(it.changeDocId);
    const code = str(it && it.changeRef).trim().toLowerCase();
    if (pid && code) {
      try {
        const list = await PM.store.list(PM.paths.docs(pid));
        const hit = list.find((d) => isObj(d.data) && PM.docTemplateOf(d.id, d.data) === 'solicitud-cambio' && isObj(d.data.fields) && str(d.data.fields.codigoCambio).trim().toLowerCase() === code);
        if (hit) return openDoc(hit.id);
      } catch (e) { /* sin lectura: se abre el registro de cambios */ }
    }
    return openDoc('registro-cambios');
  }
  const fileBase = (project) => PM.slug((project && (project.code || project.name)) || 'proyecto') || 'proyecto';
  const rangeText = (from, to) => {
    const a = D.valid(from) ? fmt.date(from) : null, b = D.valid(to) ? fmt.date(to) : null;
    return a && b ? a + ' – ' + b : a ? 'Desde ' + a : b ? 'Hasta ' + b : null;
  };
  /* ¿la asignación corresponde al recurso? (misma regla del catálogo: resourceId y, si no, el nombre) */
  const belongs = (cat, a, item) => { const r = cat && cat.resolve(a); return !!r && !!item && r.id === item.id; };

  /* Uso planificado de cada recurso: actividades, cantidad (días-recurso o cantidad del consumible) y costo valorado
     con el costo unitario del catálogo (PM.res.assignment). Una pasada por las asignaciones del cronograma. */
  function usageOf(cat, tasks) {
    const out = new Map();
    if (!cat) return out;
    for (const t of arr(tasks)) {
      if (!isObj(t)) continue;
      for (const a of arr(t.resources)) {
        if (!isObj(a) || !str(a.name).trim()) continue;
        const l = R.assignment(cat, t, a);
        if (!l.item) continue;
        let u = out.get(l.item.id);
        if (!u) { u = { n: 0, qty: 0, cost: 0, lines: [], last: null }; out.set(l.item.id, u); }
        if (u.last !== t.id) { u.n++; u.last = t.id; }
        u.qty += l.qty; u.cost += l.cost;
        u.lines.push({ task: t, a, l });
      }
    }
    return out;
  }
  /* Reserva para contingencias (costos del proyecto) y lo que ya consumen otros recursos no planificados. */
  function reserveInfo(m, exceptId) {
    const total = Math.max(0, num(m && m.costs && m.costs.reserves && m.costs.reserves.contingency, 0));
    let used = 0;
    for (const x of arr(m && m.resources && m.resources.items)) {
      if (isObj(x) && x.id !== exceptId && x.planned === false && isNum(x.reserveAmount)) used += Math.max(0, Number(x.reserveAmount));
    }
    return { total, used, available: total - used };
  }
  /* Copia del cronograma con las asignaciones del recurso renombradas (y enlazadas por resourceId); null si no cambia. */
  function renameInSchedule(schedule, cat, item, newName, newId) {
    if (!schedule || !arr(schedule.tasks).length) return null;
    const s = PM.clone(schedule);
    let n = 0;
    s.tasks = s.tasks.map((t) => {
      if (!isObj(t) || !Array.isArray(t.resources)) return t;
      return { ...t, resources: t.resources.map((a) => { if (isObj(a) && belongs(cat, a, item)) { n++; return { ...a, name: newName, resourceId: newId }; } return a; }) };
    });
    return n ? s : null;
  }
  /* Copia del cronograma sin las asignaciones del recurso (mode 'quitar') o con ellas por nombre, sin resourceId
     (mode 'conservar': quedan como recurso «Sin clasificar»). */
  function removeFromSchedule(schedule, cat, item, mode) {
    const s = PM.clone(schedule);
    let n = 0;
    s.tasks = arr(s.tasks).map((t) => {
      if (!isObj(t) || !Array.isArray(t.resources)) return t;
      const out = [];
      for (const a of t.resources) {
        if (isObj(a) && belongs(cat, a, item)) {
          n++;
          if (mode === 'conservar') { const b = { ...a }; delete b.resourceId; out.push(b); }
        } else out.push(a);
      }
      return { ...t, resources: out };
    });
    return { s, n };
  }
  /* Tipo sugerido según el nombre (solo una sugerencia visible: la persona la confirma al guardar). */
  const GUESS = [
    { edr: 'Personal', kind: 'trabajo', re: /(cuadrilla|operari|ayudante|oficial|ingenier|residente|coordinador|supervisor|director|inspector|montador|almacenista|conductor|tecnico|analista|desarrollador|soldador|topografo|maestro de obra|profesional|auxiliar|arquitect|abogad|contador|vigilante|scrum|disenador|interventor|electricista|lider)/ },
    { edr: 'Transporte', kind: 'trabajo', re: /(camion|tractomula|volqueta|transporte|flete|acarreo|vehiculo|camioneta|furgon)/ },
    { edr: 'Equipos', kind: 'trabajo', re: /(grua|montacargas|andamio|formaleta|equipo|maquina|retroexcavadora|compresor|mezcladora|vibrador|izaje|elevador|herramienta|taladro|pulidora|servidor|computador|portatil|torre grua|malacate|diferencial)/ },
    { edr: 'Materiales', kind: 'consumible', re: /(concreto|cemento|acero|madera|tornill|pintura|material|insumo|repuesto|arena|grava|ladrillo|varilla|malla|tubo|cable|combustible|aceite|gasolina|acpm|diesel|perno|grapa|tabla)/ },
    { edr: 'Servicios', kind: null, re: /(servicio|subcontrat|consultoria|licencia|suscripcion|nube|hosting|certificacion|inspeccion|alquiler de|arrendamiento|poliza|seguro)/ },
  ];
  function guessType(types, name) {
    const n = norm(name);
    if (!n.trim()) return '';
    for (const g of GUESS) {
      if (!g.re.test(n)) continue;
      const list = arr(types).filter((t) => t.edr === g.edr);
      const t = (g.kind && list.find((x) => x.kind === g.kind)) || list[0];
      if (t) return t.id;
    }
    return '';
  }

  const Note = ({ icon = 'info', tone, children, role, data }) => html`<div class=${cx('rcat-note', tone && 'is-' + tone)} role=${role} data-rcat-note=${data}><${ui.Icon} name=${icon} size=${16} /><div class="rcat-note-body">${children}</div></div>`;
  const loadingModal = (title, onClose) => html`<${ui.Modal} title=${title} onClose=${onClose}><${ui.Loading} /></${ui.Modal}>`;
  const noProjectModal = (title, onClose) => html`<${ui.Modal} title=${title} onClose=${onClose} footer=${html`<${ui.Button} onClick=${onClose}>Cerrar</${ui.Button}>`}><p>Abre un proyecto para consultar o registrar sus recursos.</p></${ui.Modal}>`;
  /* Opción de radio con título, explicación y distintivos (el nombre accesible es solo el título). */
  function Choice({ name, value, checked, onPick, title, hint, tags, idp, disabled }) {
    const tid = idp + '-' + value + '-t', hid = idp + '-' + value + '-h', gid = idp + '-' + value + '-g';
    return html`<label class="rcat-choice" data-choice=${value}>
      <input type="radio" name=${name} value=${value} checked=${checked} disabled=${disabled} onChange=${() => onPick(value)} aria-labelledby=${tid} aria-describedby=${hint ? hid + (tags ? ' ' + gid : '') : undefined} />
      <span class="rcat-choice-t" id=${tid}>${title}</span>
      ${hint ? html`<span class="rcat-choice-h" id=${hid}>${hint}</span>` : null}
      ${tags ? html`<span class="rcat-choice-tags" id=${gid}>${tags}</span>` : null}
    </label>`;
  }

  /* ---------------------------------------------------------------- recurso no planificado (9.6, 4.6) */
  const defaultAffected = (reason) => (reason === 'cambio-alcance' ? ['Línea base del alcance', 'Línea base del cronograma', 'Línea base de costos', 'Catálogo de recursos'] : ['Línea base de costos', 'Catálogo de recursos']);
  const reasonTags = (r) => html`${r.baseline ? html`<${ui.Chip} tone="warn" icon="alert">Requiere solicitud de cambio</${ui.Chip}>` : html`<${ui.Chip} tone="good" icon="check">No cambia la línea base</${ui.Chip}>`}${r.reserve ? html`<${ui.Chip} tone="outline">${r.reserve === 'contingency' ? 'Usa la reserva para contingencias' : 'Usa la reserva de gestión'}</${ui.Chip}>` : null}`;

  function FlowHost({ item, finish }) {
    const m = PM.useResourceModel();
    const [risks, , rMeta] = PM.useDocTable('registro-riesgos', 'riesgos');
    const canWrite = PM.useCanWrite();
    const ready = useRef(false);
    if (!m.loading && !rMeta.loading) ready.current = true;
    const title = 'Recurso no planificado';
    const cancel = () => finish(null);
    if (!ready.current) return loadingModal(title, cancel);
    if (!m.pid) return noProjectModal(title, cancel);
    if (!canWrite) return html`<${ui.Modal} title=${title} onClose=${cancel} footer=${html`<${ui.Button} onClick=${cancel}>Cerrar</${ui.Button}>`}><p>Modo de solo lectura: no se puede registrar el motivo de un recurso no planificado.</p></${ui.Modal}>`;
    return html`<${FlowForm} m=${m} risks=${risks} item=${item || {}} finish=${finish} />`;
  }

  function FlowForm({ m, risks, item, finish }) {
    const it = item;
    const name = str(it.name).trim() || 'Recurso sin nombre';
    const cat = m.catalog;
    const type = cat ? cat.typeOf(it) : RES.UNCLASSIFIED;
    const typeName = typeKnown(cat && cat.types, it.typeId) ? type.name : 'Sin clasificar';
    const cur = m.currency;
    const bl = blInfo(m);
    const use = useMemo(() => (it.id ? usageOf(cat, m.schedule.tasks).get(it.id) || null : null), []);
    const [f, setF] = useState(() => {
      const reason = it.planned === false && REASON.has(it.reason) ? it.reason : '';
      return {
        reason, riskId: str(it.riskId), amount: isNum(it.reserveAmount) ? Number(it.reserveAmount) : null,
        changeRef: str(it.changeRef), changeDocId: it.changeDocId || null, docFor: str(it.changeRef),
        justification: '', scope: '', days: 0, cost: use && use.cost ? Math.round(use.cost) : null, affected: defaultAffected(reason),
      };
    });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [reg, setReg] = useState(null);
    const idp = useMemo(() => PM.uid('rcf'), []);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const rs = REASON.get(f.reason) || null;
    const res = reserveInfo(m, it.id);
    const risk = f.riskId ? risks.find((r) => str(r.id) === f.riskId) : null;
    const riskOpts = risks.filter((r) => str(r.id).trim()).map((r) => {
      const d = str(r.descripcion).trim();
      return { value: str(r.id), label: str(r.id) + ' · ' + (d.length > 90 ? d.slice(0, 88) + '…' : d || 'Sin descripción') + (r.estado && r.estado !== 'Abierto' ? ' (' + r.estado + ')' : '') };
    });
    if (f.riskId && !riskOpts.some((o) => o.value === f.riskId)) riskOpts.push({ value: f.riskId, label: f.riskId + ' (no está en el registro de riesgos)' });
    const pick = (v) => setF((x) => ({ ...x, reason: v, affected: defaultAffected(v) }));
    const describe = () => 'Incorporar el recurso no planificado «' + name + '» (' + typeName + (it.unit ? ', ' + it.unit : '') + '). Motivo: ' + (rs ? rs.label : '') + '.'
      + (use && use.n ? ' Asignado en ' + plural(use.n, 'actividad', 'actividades') + ' del cronograma.' : '');
    const toggleAffected = (a, on) => setF((x) => ({ ...x, affected: on ? [...x.affected.filter((y) => y !== a), a].sort((p, q) => AFFECTED.indexOf(p) - AFFECTED.indexOf(q)) : x.affected.filter((y) => y !== a) }));

    const register = async () => {
      if (busy || !rs || !rs.baseline) return;
      const e = {};
      if (!str(f.justification).trim()) e.justification = 'Escribe la justificación: por qué se necesita el recurso y qué pasa si el cambio no se aprueba.';
      if (!PM.templates['solicitud-cambio']) e.justification = 'La plantilla «Solicitud de cambio» no está disponible en esta página.';
      setErr(e);
      if (Object.keys(e).length) { focusLater('rcf-just'); return; }
      setBusy(true);
      try {
        const date = D.valid(it.addedDate) ? it.addedDate : m.statusDate;
        const r = await PM.changeControl.register({
          pid: m.pid, project: m.project, description: describe(), justification: str(f.justification).trim(), scope: str(f.scope).trim(),
          days: num(f.days, 0), cost: num(f.cost, 0), affected: f.affected, requester: 'Director de proyecto',
          type: f.reason === 'cambio-alcance' ? 'Actualización' : 'Acción correctiva', date,
        });
        setReg(r);
        setF((x) => ({ ...x, changeRef: r.code, changeDocId: r.docId, docFor: r.code }));
        PM.toast('Solicitud de cambio ' + r.code + ' registrada en el registro de cambios.');
      } catch (ex) {
        PM.toast('No se pudo registrar la solicitud de cambio. Revisa la conexión y vuelve a intentarlo.', { tone: 'crit' });
      } finally { setBusy(false); }
    };
    const build = () => {
      const e = {};
      if (!rs) e.reason = 'Elige el motivo del recurso no planificado.';
      if (rs && rs.value === 'riesgo') {
        if (riskOpts.length && !f.riskId) e.riskId = 'Elige el riesgo del registro al que responde este recurso.';
        if (!isNum(f.amount) || f.amount < 0) e.amount = 'Escribe el monto de la reserva para contingencias que consume (0 si no tiene costo).';
        else if (f.amount > res.available + 0.5) e.amount = 'El monto supera la reserva para contingencias disponible (' + fmt.money(Math.max(0, res.available), cur) + '). Ajusta el monto o elige «Imprevisto sin riesgo identificado (reserva de gestión)», que requiere solicitud de cambio.';
      }
      setErr(e);
      if (Object.keys(e).length) { if (e.reason) focusRadio(idp + '-reason'); else focusLater(e.riskId ? 'rcf-risk' : 'rcf-amount'); return null; }
      const ref = rs.baseline ? str(f.changeRef).trim() : '';
      return {
        ...it, planned: false, reason: rs.value,
        riskId: rs.value === 'riesgo' ? f.riskId || null : null,
        reserveAmount: rs.value === 'riesgo' ? Number(f.amount) : null,
        changeRef: ref || null,
        changeDocId: ref && ref === f.docFor ? f.changeDocId || null : null,
        addedDate: D.valid(it.addedDate) ? it.addedDate : m.statusDate,
      };
    };
    const docReady = rs && rs.baseline && f.changeDocId && str(f.changeRef).trim() === f.docFor;
    const footer = html`
      <${ui.Button} onClick=${() => finish(null)}>Cancelar</${ui.Button}>
      ${docReady ? html`<${ui.Button} icon="file" onClick=${() => { const r = build(); if (r) finish(r, f.changeDocId); }}>Confirmar y abrir la solicitud</${ui.Button}>` : null}
      <${ui.Button} variant="primary" icon="check" onClick=${() => { const r = build(); if (r) finish(r); }}>Confirmar motivo</${ui.Button}>`;
    const usedNow = res.used + (rs && rs.value === 'riesgo' && isNum(f.amount) ? Math.max(0, Number(f.amount)) : 0);
    return html`<${ui.Modal} title="Recurso no planificado" subtitle=${name + ' · ' + typeName} onClose=${() => finish(null)} size="wide" footer=${footer}>
      <div class="stack" data-rcat-flow="1">
        <p class="small" style="margin:0;max-width:90ch">Un recurso que no estaba en el plan se registra como <strong>no planificado</strong> con su motivo (9.6 Controlar los recursos). El motivo define si cambia la línea base: solo los cambios de alcance, diseño o método y el uso de la reserva de gestión requieren solicitud de cambio (4.6 Realizar el control integrado de cambios).</p>
        ${bl ? html`<${Note} tone="info" icon="flag">Línea base vigente: <strong>${bl.label}</strong>${D.valid(bl.date) ? ' del ' + fmt.date(bl.date) : ''} (${bl.parts}).</${Note}>` : html`<${Note} icon="info">El proyecto aún no tiene línea base de costos ni de cronograma: el motivo queda registrado para el control de los recursos.</${Note}>`}
        <fieldset class="rcat-fs">
          <legend class="field-label">Motivo<span class="req" aria-hidden="true">*</span></legend>
          ${RES.REASONS.map((r) => html`<${Choice} key=${r.value} name=${idp + '-reason'} value=${r.value} idp=${idp} checked=${f.reason === r.value} onPick=${pick} title=${r.label} hint=${r.hint} tags=${reasonTags(r)} />`)}
          ${err.reason ? html`<div class="field-error" role="alert">${err.reason}</div>` : null}
        </fieldset>
        ${rs && rs.value === 'riesgo' ? html`<section class="rcat-box" data-rcat-risk="1" aria-labelledby="rcf-risk-h">
          <h3 class="rcat-box-h" id="rcf-risk-h">Respuesta a un riesgo identificado</h3>
          <p class="small muted" style="margin:0">La respuesta ya planificada se paga con la reserva para contingencias, que está dentro de la línea base de costos: se registra el consumo de la reserva (11.6 Implementar la respuesta a los riesgos).</p>
          ${riskOpts.length ? html`<${ui.Field} label="Riesgo del registro" for="rcf-risk" required error=${err.riskId}>
            <${ui.Select} id="rcf-risk" value=${f.riskId} placeholder="Elige el riesgo" options=${riskOpts} onValue=${set('riskId')} />
          </${ui.Field}>` : html`<${Note} tone="warn" icon="alert">El registro de riesgos no tiene riesgos con código. Regístralo en el «Registro de riesgos» (11.2 Identificar los riesgos) o elige otro motivo; puedes continuar sin vincular el riesgo.</${Note}>`}
          ${risk ? html`<div class="small" data-rcat-riskinfo="1">${[risk.estrategia ? 'Estrategia: ' + risk.estrategia : null, str(risk.respuesta).trim() ? 'Respuesta: ' + str(risk.respuesta).trim() : null, isNum(risk.reserva) ? 'Reserva estimada del riesgo: ' + fmt.money(risk.reserva, cur) : null].filter(Boolean).join(' · ') || 'El riesgo no tiene respuesta ni reserva registradas.'}</div>` : null}
          <div class="rcat-kv" data-rcat-reserve="1">
            <div><div class="rcat-kv-k">Reserva para contingencias</div><div class="rcat-kv-v">${fmt.money(res.total, cur)}</div></div>
            <div><div class="rcat-kv-k">Consumida por otros recursos</div><div class="rcat-kv-v">${fmt.money(res.used, cur)}</div></div>
            <div data-tone=${res.available > 0 ? 'good' : 'crit'}><div class="rcat-kv-k">Disponible</div><div class="rcat-kv-v" data-rcat-available="1">${fmt.money(res.available, cur)}</div></div>
          </div>
          ${res.total > 0 ? html`<${ui.Meter} value=${usedNow / res.total} tone=${usedNow > res.total ? 'crit' : usedNow > res.total * 0.8 ? 'warn' : null} label="Consumo de la reserva para contingencias" />` : null}
          <${ui.Field} label="Monto de la reserva que consume" for="rcf-amount" required error=${err.amount} hint="Se registra como consumo de la reserva para contingencias; la línea base de costos no cambia.">
            <${ui.NumberInput} id="rcf-amount" money currency=${cur} value=${f.amount} min=${0} onValue=${set('amount')} />
          </${ui.Field}>
        </section>` : null}
        ${rs && rs.baseline ? html`<section class="rcat-box" data-rcat-cc="1" aria-labelledby="rcf-cc-h">
          <h3 class="rcat-box-h" id="rcf-cc-h">Control integrado de cambios (4.6)</h3>
          <p class="small muted" style="margin:0">Este motivo cambia la línea base: registra una solicitud de cambio para que el comité de control de cambios la decida. Aprobada, actualiza la línea base en «Líneas base». Si prefieres registrarla después, el catálogo mostrará el recurso como pendiente.</p>
          ${reg ? html`<${Note} tone="good" icon="check-circle" role="status" data="cc-ok">Solicitud <strong>${reg.code}</strong> registrada en el registro de cambios (estado «Registrada»).</${Note}>`
            : str(it.changeRef).trim() ? html`<${Note} icon="link">Solicitud vinculada: <strong>${str(it.changeRef)}</strong>.</${Note}>` : null}
          <div class="rcat-form">
            <${ui.Field} label="Justificación" for="rcf-just" required class="span-all" error=${err.justification} hint="Por qué se necesita el recurso, beneficio esperado y consecuencia de no hacerlo.">
              <${ui.TextArea} id="rcf-just" value=${f.justification} onValue=${set('justification')} rows=${3} disabled=${!!reg} />
            </${ui.Field}>
            <${ui.Field} label="Impacto en el alcance" for="rcf-scope" class="span-all" hint="Entregables o paquetes de la EDT que se agregan o modifican.">
              <${ui.Input} id="rcf-scope" value=${f.scope} onValue=${set('scope')} disabled=${!!reg} />
            </${ui.Field}>
            <${ui.Field} label="Impacto en el cronograma (días hábiles)" for="rcf-days">
              <${ui.NumberInput} id="rcf-days" value=${f.days} min=${-365} max=${365} onValue=${set('days')} disabled=${!!reg} />
            </${ui.Field}>
            <${ui.Field} label="Costo estimado" for="rcf-cost" hint=${use && use.cost ? 'Prellenado con el costo valorado de sus asignaciones.' : 'Costo adicional para el proyecto.'}>
              <${ui.NumberInput} id="rcf-cost" money currency=${cur} value=${f.cost} min=${0} onValue=${set('cost')} disabled=${!!reg} />
            </${ui.Field}>
            <fieldset class="rcat-fs span-all">
              <legend class="field-label">Elementos afectados</legend>
              <div class="rcat-box-row">${AFFECTED.map((a) => html`<${ui.Check} key=${a} checked=${f.affected.includes(a)} onValue=${(on) => toggleAffected(a, on)} label=${a} disabled=${!!reg} />`)}</div>
            </fieldset>
          </div>
          <div class="rcat-box-row">
            <${ui.Button} icon="file" onClick=${register} disabled=${busy || !!reg}>${reg ? 'Solicitud registrada' : busy ? 'Registrando…' : str(it.changeRef).trim() ? 'Registrar una nueva solicitud de cambio' : 'Registrar solicitud de cambio'}</${ui.Button}>
          </div>
          <${ui.Field} label="Solicitud de cambio relacionada" for="rcf-ref" hint="Código del registro de cambios (p. ej. CC-004). Se llena al registrar la solicitud; escríbelo si ya existe.">
            <${ui.Input} id="rcf-ref" class="mono" value=${f.changeRef} onValue=${set('changeRef')} placeholder="CC-000" style="max-width:200px" />
          </${ui.Field}>
        </section>` : null}
      </div>
    </${ui.Modal}>`;
  }

  /* Abre el flujo. opts.deferOpen: quien llama abre la solicitud después de guardar (propiedad no enumerable openDocId);
     sin él, la solicitud se abre al cerrar el diálogo. */
  const runFlow = (item, opts = {}) => new Promise((resolve) => {
    let done = false;
    const finish = (v, close, docId) => {
      if (done) return; done = true; close();
      if (v && docId) {
        if (opts.deferOpen) Object.defineProperty(v, 'openDocId', { value: docId, enumerable: false });
        else setTimeout(() => openDoc(docId), 0);
      }
      resolve(v);
    };
    PM.openModal((close) => html`<${FlowHost} item=${item} finish=${(v, docId) => finish(v, close, docId)} />`);
  });
  /* PM.unplannedResourceFlow(model, item, opts) → Promise<item con planned:false y su motivo | null>. No guarda. */
  PM.unplannedResourceFlow = (model, item, opts) => runFlow(isObj(item) ? { ...item } : {}, opts || {});

  /* ---------------------------------------------------------------- eliminar un recurso */
  function DeleteChoice({ choice }) {
    const [v, setV] = useState(choice.mode);
    const idp = useMemo(() => PM.uid('rcd'), []);
    const pickIt = (x) => { choice.mode = x; setV(x); };
    return html`<fieldset class="rcat-fs" data-rcat-delchoice="1">
      <legend class="field-label">¿Qué hacer con sus asignaciones?</legend>
      <${Choice} name=${idp} value="quitar" idp=${idp} checked=${v === 'quitar'} onPick=${pickIt} title="Quitar las asignaciones de las actividades" hint="Las actividades con costo calculado por recursos o mixto dejan de sumar este recurso. Las de precio global no cambian de valor." />
      <${Choice} name=${idp} value="conservar" idp=${idp} checked=${v === 'conservar'} onPick=${pickIt} title="Conservarlas por nombre" hint="Las asignaciones siguen en el cronograma con el mismo nombre y el recurso aparece como «Sin clasificar», sin costo unitario." />
    </fieldset>`;
  }
  /* Confirma, limpia las asignaciones (o las deja por nombre) y elimina el recurso del catálogo. → Promise<boolean> */
  async function deleteResource(getLive, item) {
    const m = getLive();
    const cat = m.catalog;
    const target = (cat && cat.byId.get(item.id)) || item;
    if (!target || target.virtual) return false;
    const hits = arr(m.schedule.tasks).filter((t) => isObj(t) && arr(t.resources).some((a) => isObj(a) && belongs(cat, a, target)));
    const choice = { mode: 'quitar' };
    const cur = m.currency;
    const body = html`<div class="stack-sm" data-rcat-delete="1">
      <p style="margin:0">Se eliminará «${target.name}»${target.code ? ' (' + target.code + ')' : ''} del catálogo de recursos.</p>
      ${hits.length ? html`<p style="margin:0">Está asignado en ${plural(hits.length, 'actividad', 'actividades')}:</p>
        <ul class="rcat-dlist">${hits.slice(0, 12).map((t) => html`<li key=${t.id}>${str(t.name).trim() || 'Actividad sin nombre'}</li>`)}${hits.length > 12 ? html`<li>y ${plural(hits.length - 12, 'actividad más', 'actividades más')}</li>` : null}</ul>
        <${DeleteChoice} choice=${choice} />` : html`<p class="small muted" style="margin:0">No está asignado a ninguna actividad.</p>`}
      ${target.planned === false && isNum(target.reserveAmount) && Number(target.reserveAmount) > 0 ? html`<p class="small" style="margin:0">Se libera el consumo registrado de la reserva para contingencias (${fmt.money(target.reserveAmount, cur)}).</p>` : null}
      ${str(target.changeRef).trim() ? html`<p class="small muted" style="margin:0">La solicitud de cambio ${target.changeRef} se conserva en el registro de cambios.</p>` : null}
      <p class="small muted" style="margin:0">Esta acción no se puede deshacer.</p>
    </div>`;
    const ok = await PM.confirm({ title: 'Eliminar ' + (target.code ? target.code + ' · ' : '') + target.name, body, confirmText: 'Eliminar recurso', tone: 'danger' });
    if (!ok) return false;
    const L = getLive();
    if (!arr(L.resources && L.resources.items).some((x) => isObj(x) && x.id === target.id)) { PM.toast('El recurso ya no está en el catálogo.'); return false; }
    let n = 0;
    if (hits.length) {
      const r = removeFromSchedule(L.schedule, L.catalog, target, choice.mode);
      n = r.n;
      if (n) L.saveSchedule(r.s);
    }
    L.removeItem(target.id);
    PM.toast('Recurso «' + target.name + '» eliminado.' + (n ? (choice.mode === 'quitar' ? ' Se ' + (n === 1 ? 'quitó 1 asignación' : 'quitaron ' + fmt.num(n) + ' asignaciones') + ' del cronograma.' : ' ' + plural(n, 'asignación queda', 'asignaciones quedan') + ' por nombre como «Sin clasificar».') : ''));
    return true;
  }

  /* ---------------------------------------------------------------- editor del recurso */
  const formOf = (b, cat) => ({
    code: str(b.code), name: str(b.name), typeId: typeKnown(cat.types, b.typeId) ? b.typeId : '', subtype: str(b.subtype),
    kind: b.kind === 'trabajo' || b.kind === 'consumible' ? b.kind : '', unit: str(b.unit) || 'unidad',
    availability: isNum(b.availability) ? Number(b.availability) : null,
    availableFrom: D.valid(b.availableFrom) ? b.availableFrom : null, availableTo: D.valid(b.availableTo) ? b.availableTo : null,
    unitCost: isNum(b.unitCost) ? Number(b.unitCost) : null, origin: str(b.origin) || 'Interno', supplier: str(b.supplier), contract: str(b.contract),
    responsible: str(b.responsible), status: STATUS_LABEL[b.status] ? b.status : 'planificado', notes: str(b.notes),
    agileTeam: !!b.agileTeam, dedication: isNum(b.dedication) ? Number(b.dedication) : 100, hoursPerDay: isNum(b.hoursPerDay) ? Number(b.hoursPerDay) : 8,
    absences: arr(b.absences).filter(isObj).map((a) => ({ id: str(a.id) || PM.uid('aus'), from: D.valid(a.from) ? a.from : null, to: D.valid(a.to) ? a.to : null, note: str(a.note) })),
  });
  const planOf = (b) => ({
    planned: !b || b.planned !== false, reason: b && b.planned === false && REASON.has(b.reason) ? b.reason : null,
    riskId: (b && b.riskId) || null, reserveAmount: b && isNum(b.reserveAmount) ? Number(b.reserveAmount) : null,
    changeRef: (b && str(b.changeRef).trim()) || null, changeDocId: (b && b.changeDocId) || null, addedDate: b && D.valid(b.addedDate) ? b.addedDate : null,
  });
  const planFields = (p, fallbackDate) => ({
    planned: !!p.planned, reason: p.planned ? null : p.reason || null,
    riskId: !p.planned && p.reason === 'riesgo' ? p.riskId || null : null,
    reserveAmount: !p.planned && p.reason === 'riesgo' && isNum(p.reserveAmount) ? Number(p.reserveAmount) : null,
    changeRef: p.changeRef || null, changeDocId: p.changeRef ? p.changeDocId || null : null,
    addedDate: p.addedDate || fallbackDate || D.today(),
  });

  function EditorHost({ close, onSaved, itemId, itemArg, initial }) {
    const m = PM.useResourceModel();
    const live = useRef(m); live.current = m;
    const ready = useRef(false);
    if (!m.loading) ready.current = true;
    const title = itemId ? 'Recurso' : 'Nuevo recurso';
    if (!ready.current) return loadingModal(title, close);
    if (!m.pid || !m.catalog) return noProjectModal(title, close);
    return html`<${EditorForm} live=${live} close=${close} onSaved=${onSaved} itemId=${itemId} itemArg=${itemArg} initial=${initial} />`;
  }

  function EditorForm({ live, close, onSaved, itemId, itemArg, initial }) {
    const m = live.current;
    const canWrite = PM.useCanWrite();
    const ro = !canWrite;
    const cat = m.catalog;
    const cur = m.currency;
    /* recurso del catálogo (guardado o virtual por id) o el virtual recibido (nombre usado solo en el cronograma) */
    const orig = useMemo(() => {
      const x = itemId ? cat.byId.get(itemId) : null;
      if (x) return x;
      if (itemArg && str(itemArg.name).trim() && (itemArg.virtual || String(itemArg.id || '').startsWith('v:'))) return { ...RES.DEFAULT_ITEM, ...itemArg, virtual: true };
      return null;
    }, []);
    const virtual = !!(orig && orig.virtual);
    const isNew = !orig || virtual;
    const missing = !!itemId && !orig;
    const [f, setF] = useState(() => {
      const x = formOf(orig || { ...RES.DEFAULT_ITEM, ...(isObj(initial) ? initial : {}) }, cat);
      if (!x.typeId && x.name && !ro) { const g = guessType(cat.types, x.name); if (g) { x.typeId = g; x.guessed = true; } }
      return x;
    });
    const [plan, setPlan] = useState(() => planOf(orig || (isObj(initial) ? initial : null)));
    const bl = blInfo(m);
    const askPlan = !orig && !!bl && !(isObj(initial) && initial.planned === false && REASON.has(initial.reason));
    const [ans, setAns] = useState(null);
    const [err, setErr] = useState({});
    const busy = useRef(false);
    const idp = useMemo(() => PM.uid('rce'), []);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v, ...(k === 'typeId' ? { guessed: false, typeTouched: true } : null) }));
    /* recurso nuevo: al salir del nombre, si aún no se eligió el tipo, se sugiere uno según el nombre */
    const suggestType = () => { if (ro || (orig && !virtual)) return; setF((x) => { if (x.typeTouched || (x.typeId && !x.guessed)) return x; const g = guessType(cat.types, x.name); return g ? { ...x, typeId: g, guessed: true } : x.guessed ? { ...x, typeId: '', guessed: false } : x; }); };
    const type = f.typeId ? cat.types.find((t) => t.id === f.typeId) || null : null;
    const typeKind = type ? type.kind : RES.UNCLASSIFIED.kind;
    const kind = f.kind || typeKind;
    const human = (!!type && type.edr === 'Personal' && kind === 'trabajo') || (f.agileTeam && kind === 'trabajo');
    const agileOn = !!(PM.agile && PM.agile.enabled && PM.agile.enabled(m.project));
    const use = useMemo(() => (orig ? usageOf(cat, m.schedule.tasks).get(orig.id) || null : null), []);
    const savedItems = useMemo(() => arr(m.resources && m.resources.items).filter(isObj), []);
    const lists = useMemo(() => {
      const sub = new Map(), people = new Set(), all = new Set();
      for (const x of savedItems) {
        const s = str(x.subtype).trim(); if (s) { all.add(s); if (!sub.has(x.typeId)) sub.set(x.typeId, new Set()); sub.get(x.typeId).add(s); }
        const p = str(x.responsible).trim(); if (p) people.add(p);
      }
      const sort = (s) => [...s].sort((a, b) => a.localeCompare(b, 'es'));
      return { sub: (tid) => { const own = sort(sub.get(tid) || []); return [...own, ...sort(all).filter((s) => !own.includes(s))]; }, people: sort(people) };
    }, []);
    const nextCode = useMemo(() => R.nextCode(savedItems), []);
    const typeOpts = cat.types.map((t) => ({ value: t.id, label: t.name + ' · ' + KIND_LABEL[t.kind] }));
    const kindOpts = [{ value: '', label: 'Según el tipo (' + KIND_LABEL[typeKind].toLowerCase() + ')' }, ...RES.KINDS.map((k) => ({ value: k.value, label: k.label }))];
    const originOpts = RES.ORIGINS.includes(f.origin) ? RES.ORIGINS : [...RES.ORIGINS, f.origin];
    const kindHint = (RES.KINDS.find((k) => k.value === kind) || {}).hint;

    const draftNow = () => ({ ...(orig || {}), id: orig && !virtual ? orig.id : (orig ? orig.id : null), name: str(f.name).trim(), typeId: f.typeId || null, unit: str(f.unit).trim() || 'unidad', unitCost: f.unitCost, ...planFields(plan, m.statusDate) });

    /* guardar: valida, pide el motivo si es no planificado, guarda el recurso y renombra sus asignaciones */
    const submit = async (over = {}) => {
      if (ro || busy.current) return;
      const L = live.current;
      const catNow = L.catalog;
      const saved = arr(L.resources && L.resources.items).filter(isObj);
      const ownId = orig && !virtual ? orig.id : null;
      const name = str(f.name).trim();
      const codeIn = str(f.code).trim();
      const e = {};
      if (!name) e.name = 'Escribe el nombre del recurso (p. ej. «Cuadrilla de montaje» o «Camión grúa de 30 t»).';
      else if (saved.some((x) => x.id !== ownId && R.key(x.name) === R.key(name))) e.name = 'Ya existe un recurso llamado «' + name + '» en el catálogo. Usa otro nombre o edita el existente.';
      if (!codeIn && !isNew) e.code = 'Escribe el código del recurso (p. ej. REC-012).';
      else if (codeIn && saved.some((x) => x.id !== ownId && str(x.code).trim().toLowerCase() === codeIn.toLowerCase())) e.code = 'Ya existe otro recurso con el código ' + codeIn + '.';
      if (f.availability !== null && f.availability < 0) e.availability = 'La disponibilidad no puede ser negativa.';
      if (f.unitCost !== null && f.unitCost < 0) e.unitCost = 'El costo unitario no puede ser negativo.';
      if (f.availableFrom && f.availableTo && f.availableTo < f.availableFrom) e.availableTo = 'La fecha final es anterior a la inicial.';
      if (human && (!isNum(f.dedication) || f.dedication < 0 || f.dedication > 100)) e.dedication = 'Escribe un porcentaje de 0 a 100.';
      if (human && (!isNum(f.hoursPerDay) || f.hoursPerDay < 0 || f.hoursPerDay > 24)) e.hoursPerDay = 'Escribe un número de horas de 0 a 24.';
      if (kind === 'trabajo') for (const a of f.absences) {
        if (!a.from) e['abs-' + a.id] = 'Escribe la fecha de inicio.';
        else if (a.to && a.to < a.from) e['abs-' + a.id] = 'La fecha final es anterior a la inicial.';
      }
      if (askPlan && !ans) e.plan = 'Indica si el recurso estaba en el plan.';
      setErr(e);
      const keys = Object.keys(e);
      if (keys.length) {
        const order = [['name', 'rce-name'], ['code', 'rce-code'], ['availability', 'rce-avail'], ['unitCost', 'rce-cost'], ['availableTo', 'rce-to'], ['dedication', 'rce-ded'], ['hoursPerDay', 'rce-hours']];
        const hit = order.find(([k]) => e[k]);
        const abs = keys.find((k) => k.startsWith('abs-'));
        if (hit) focusLater(hit[1]); else if (abs) focusLater('rce-' + abs + '-from'); else focusRadio(idp + '-ask');
        return;
      }
      const raw = ownId ? saved.find((x) => x.id === ownId) : null;
      if (ownId && !raw) { PM.toast('El recurso se eliminó mientras lo editabas.', { tone: 'crit' }); close(); return; }
      busy.current = true;
      try {
        const base = raw ? PM.clone(raw) : R.newItem(saved, { addedDate: L.statusDate || D.today() });
        const draft = {
          ...base, code: codeIn || (raw ? str(raw.code) : base.code), name, typeId: f.typeId || null, subtype: str(f.subtype).trim(), unit: str(f.unit).trim() || 'unidad',
          availability: f.availability, availableFrom: f.availableFrom || null, availableTo: f.availableTo || null, unitCost: f.unitCost,
          origin: f.origin || 'Interno', supplier: str(f.supplier).trim(), contract: str(f.contract).trim(), responsible: str(f.responsible).trim(),
          status: f.status, notes: str(f.notes).trim(),
          agileTeam: human ? !!f.agileTeam : false,
          dedication: human && isNum(f.dedication) ? Number(f.dedication) : isNum(base.dedication) ? base.dedication : 100,
          hoursPerDay: human && isNum(f.hoursPerDay) ? Number(f.hoursPerDay) : isNum(base.hoursPerDay) ? base.hoursPerDay : 8,
          absences: kind === 'trabajo' ? f.absences.map((a) => ({ id: a.id, from: a.from, to: a.to || null, note: str(a.note).trim() })) : arr(base.absences),
        };
        if (f.kind) draft.kind = f.kind; else delete draft.kind;
        let p = over.plan || plan;
        let openId = over.openDocId || null;
        if (askPlan && ans === 'si') p = { ...p, planned: true, reason: null, riskId: null, reserveAmount: null };
        if (askPlan && ans === 'no') {
          const r = await runFlow({ ...draft, ...planFields({ ...p, planned: false }, base.addedDate), planned: false }, { deferOpen: true });
          if (!r) return;
          openId = r.openDocId || null;
          p = planOf(r);
        }
        const next = { ...draft, ...planFields(p, base.addedDate) };
        const L2 = live.current;
        const savedItem = await L2.saveItem(next);
        if (orig && orig.name !== name) {
          const s = renameInSchedule(L2.schedule, catNow, orig, name, savedItem.id);
          if (s) L2.saveSchedule(s);
        }
        onSaved(savedItem);
        close();
        PM.toast(virtual ? 'Recurso «' + name + '» guardado en el catálogo como ' + savedItem.code + '.' : orig ? 'Recurso ' + savedItem.code + ' actualizado.' : 'Recurso ' + savedItem.code + ' agregado al catálogo' + (next.planned ? '.' : ' como no planificado.'));
        if (openId) setTimeout(() => openDoc(openId), 0);
      } finally { busy.current = false; }
    };
    const runPlanFlow = async () => {
      if (ro) return;
      const r = await runFlow(draftNow(), { deferOpen: true });
      if (!r) return;
      const p = planOf(r);
      setPlan(p);
      if (r.openDocId) submit({ plan: p, openDocId: r.openDocId });
    };
    const del = async () => { const okDel = await deleteResource(() => live.current, orig); if (okDel) close(); };
    const addAbs = () => { const id = PM.uid('aus'); setF((x) => ({ ...x, absences: [...x.absences, { id, from: null, to: null, note: '' }] })); focusLater('rce-abs-' + id + '-from'); };
    const setAbs = (id, k, v) => setF((x) => ({ ...x, absences: x.absences.map((a) => (a.id === id ? { ...a, [k]: v } : a)) }));
    const delAbs = (id) => setF((x) => ({ ...x, absences: x.absences.filter((a) => a.id !== id) }));

    if (missing) return html`<${ui.Modal} title="Recurso no encontrado" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}><p>El recurso ya no está en el catálogo: puede que se haya eliminado.</p></${ui.Modal}>`;

    const reason = plan.reason ? REASON.get(plan.reason) : null;
    const title = ro ? 'Detalle de ' + (orig ? orig.code || orig.name : 'recurso') : virtual ? 'Clasificar «' + orig.name + '»' : orig ? 'Editar ' + (orig.code || 'recurso') : 'Nuevo recurso';
    const subtitle = virtual
      ? 'Se usa en ' + plural(use ? use.n : 0, 'actividad', 'actividades') + ' del cronograma sin estar en el catálogo. Al guardarlo queda registrado con código.'
      : orig ? (typeKnown(cat.types, orig.typeId) ? cat.typeOf(orig).name : 'Sin clasificar') + ' · ' + KIND_LABEL[cat.kindOf(orig)] + (use ? ' · ' + plural(use.n, 'actividad', 'actividades') : ' · sin asignar')
        : 'Se agrega al catálogo de recursos del proyecto (9.2 Estimar los recursos de las actividades).';
    const primary = askPlan && ans === 'no' ? 'Continuar: motivo' : virtual ? 'Guardar en el catálogo' : orig ? 'Guardar cambios' : 'Agregar recurso';
    const footer = html`
      ${orig && !virtual && canWrite ? html`<${ui.Button} variant="danger" icon="trash" onClick=${del} style="margin-right:auto">Eliminar</${ui.Button}>` : null}
      <${ui.Button} onClick=${close}>${ro ? 'Cerrar' : 'Cancelar'}</${ui.Button}>
      ${ro ? null : html`<${ui.Button} variant="primary" icon=${askPlan && ans === 'no' ? 'arrow-right' : 'save'} onClick=${() => submit()}>${primary}</${ui.Button}>`}`;

    /* bloque de planificación: pregunta (recurso nuevo con línea base) o estado actual con sus acciones */
    const planBlock = askPlan ? html`<fieldset class="rcat-fs span-all" data-rcat-ask="1">
        <legend class="field-label">¿Este recurso estaba en el plan?<span class="req" aria-hidden="true">*</span></legend>
        <div class="field-hint" style="margin-bottom:2px">El proyecto tiene línea base ${bl.label}${D.valid(bl.date) ? ' del ' + fmt.date(bl.date) : ''} (${bl.parts}). Un recurso que no estaba previsto se registra como no planificado con su motivo (9.6 Controlar los recursos).</div>
        <${Choice} name=${idp + '-ask'} value="si" idp=${idp + '-ask'} checked=${ans === 'si'} onPick=${setAns} title="Sí, estaba en el plan" hint="Estaba previsto en la estimación de recursos; solo faltaba registrarlo en el catálogo." />
        <${Choice} name=${idp + '-ask'} value="no" idp=${idp + '-ask'} checked=${ans === 'no'} onPick=${setAns} title="No, es un recurso no planificado" hint="Aparece durante la ejecución. Al continuar se pide el motivo y se indica si cambia la línea base o requiere solicitud de cambio." />
        ${err.plan ? html`<div class="field-error" role="alert">${err.plan}</div>` : null}
      </fieldset>`
      : html`<div class="rcat-box span-all" data-rcat-plan=${plan.planned ? 'si' : 'no'}>
        ${plan.planned ? html`<div class="rcat-box-row"><${ui.Chip} tone="outline" icon="check">Planificado</${ui.Chip}><span class="small muted">${bl ? 'Previsto en la planificación del proyecto.' : 'El proyecto aún no tiene línea base fijada: los recursos se registran como planificados.'}</span></div>
            ${plan.changeRef ? html`<div class="small">Incorporado con la solicitud de cambio <strong class="mono">${plan.changeRef}</strong>.</div>` : null}`
          : html`<div class="rcat-box-row"><${ui.Chip} tone="warn" icon="alert">No planificado</${ui.Chip}><strong class="small">${reason ? reason.label : 'Motivo sin registrar'}</strong></div>
            ${reason ? html`<div class="small muted">${reason.hint}</div>` : null}
            ${plan.reason === 'riesgo' ? html`<div class="small">${plan.riskId ? 'Responde al riesgo ' + plan.riskId : 'Sin riesgo vinculado'} · consume ${fmt.money(plan.reserveAmount || 0, cur)} de la reserva para contingencias.</div>` : null}
            ${reason && reason.baseline ? (plan.changeRef ? html`<div class="small">Solicitud de cambio: <strong class="mono">${plan.changeRef}</strong>.</div>` : html`<div class="small rcat-crit"><${ui.Icon} name="alert" size=${14} />Requiere solicitud de cambio: aún no se ha registrado.</div>`) : null}
            ${plan.addedDate ? html`<div class="small muted">Fecha de alta: ${fmt.date(plan.addedDate)}.</div>` : null}`}
        ${ro ? null : html`<div class="rcat-box-row">
          ${plan.planned ? html`<${ui.Button} size="sm" icon="alert" onClick=${runPlanFlow}>Marcar como no planificado…</${ui.Button}>`
            : html`<${ui.Button} size="sm" icon="edit" onClick=${runPlanFlow}>${reason ? 'Cambiar el motivo…' : 'Registrar el motivo…'}</${ui.Button}>
              ${reason && reason.baseline && !plan.changeRef ? html`<${ui.Button} size="sm" icon="file" onClick=${runPlanFlow}>Registrar solicitud de cambio…</${ui.Button}>` : null}
              <${ui.Button} size="sm" variant="ghost" icon="check" onClick=${() => setPlan((p) => ({ ...p, planned: true, reason: null, riskId: null, reserveAmount: null }))}>Marcar como planificado</${ui.Button}>`}
        </div>`}
      </div>`;

    const absTitle = human ? 'Ausencias' : 'Periodos no disponibles';
    return html`<${ui.Modal} title=${title} subtitle=${subtitle} onClose=${close} size="wide" footer=${footer}>
      ${ro ? html`<${Note} icon="lock">Modo de solo lectura: puedes consultar el recurso, pero no modificarlo.</${Note}>` : null}
      <form class="rcat-form" data-rcat-editor="1" onSubmit=${(e) => { e.preventDefault(); submit(); }}>
        <div class="rcat-form-h">Identificación</div>
        <${ui.Field} label="Nombre" for="rce-name" required class="span-all" error=${err.name} hint=${orig && use ? (use.lines.length === 1 ? 'Si lo renombras, su asignación en el cronograma toma el nombre nuevo.' : 'Si lo renombras, sus ' + fmt.num(use.lines.length) + ' asignaciones en el cronograma toman el nombre nuevo.') : null}>
          <${ui.Input} id="rce-name" value=${f.name} onValue=${set('name')} onBlur=${suggestType} placeholder="p. ej. Cuadrilla de montaje, Camión grúa de 30 t, Concreto de 3.000 psi" disabled=${ro} autoFocus maxLength="140" />
        </${ui.Field}>
        <${ui.Field} label="Código" for="rce-code" error=${err.code} hint=${isNew ? 'Se asigna al guardar (' + nextCode + '); puedes escribir otro.' : null}>
          <${ui.Input} id="rce-code" class="mono" value=${f.code} onValue=${set('code')} placeholder=${isNew ? nextCode : ''} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Tipo" for="rce-type" hint=${f.guessed ? 'Sugerido según el nombre: revísalo.' : !f.typeId ? 'Sin tipo, el recurso queda como «Sin clasificar».' : null}>
          <${ui.Select} id="rce-type" value=${f.typeId} placeholder="Sin clasificar" options=${typeOpts} onValue=${set('typeId')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Subtipo" for="rce-subtype" hint="Nivel 2 de la estructura de desglose de recursos (p. ej. Montadores, Grúas, Concretos).">
          <${ui.Input} id="rce-subtype" list=${idp + '-sub'} value=${f.subtype} onValue=${set('subtype')} disabled=${ro} />
          <datalist id=${idp + '-sub'}>${lists.sub(f.typeId || null).map((s) => html`<option key=${s} value=${s}></option>`)}</datalist>
        </${ui.Field}>
        <${ui.Field} label="Clase" for="rce-kind" hint=${kindHint}>
          <${ui.Select} id="rce-kind" value=${f.kind} options=${kindOpts} onValue=${set('kind')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Unidad" for="rce-unit" hint=${kind === 'consumible' ? 'Unidad de medida de la cantidad (m³, kg, galón…).' : 'Cómo se cuenta: persona, cuadrilla, equipo…'}>
          <${ui.Input} id="rce-unit" list=${idp + '-units'} value=${f.unit} onValue=${set('unit')} disabled=${ro} />
          <datalist id=${idp + '-units'}>${RES.UNITS.map((u) => html`<option key=${u} value=${u}></option>`)}</datalist>
        </${ui.Field}>

        <div class="rcat-form-h">Disponibilidad y costo</div>
        <${ui.Field} label=${kind === 'consumible' ? 'Existencia disponible' : 'Disponibilidad (unidades por día hábil)'} for="rce-avail" error=${err.availability} hint=${kind === 'consumible' ? 'Opcional: cantidad en bodega o contratada.' : 'Límite del histograma de recursos; vacío = sin límite.'}>
          <${ui.NumberInput} id="rce-avail" value=${f.availability} min=${0} onValue=${set('availability')} placeholder=${kind === 'consumible' ? 'Opcional' : 'Sin límite'} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label=${kind === 'consumible' ? 'Costo por ' + (str(f.unit).trim() || 'unidad') : 'Costo por unidad y día hábil'} for="rce-cost" error=${err.unitCost} hint=${kind === 'consumible' ? 'Cantidad × costo unitario en las actividades calculadas por recursos.' : 'Unidades por día × días × costo en las actividades calculadas por recursos.'}>
          <${ui.NumberInput} id="rce-cost" money currency=${cur} value=${f.unitCost} min=${0} onValue=${set('unitCost')} placeholder="Sin costo" disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Disponible desde" for="rce-from">
          <${ui.DateInput} id="rce-from" value=${f.availableFrom} onValue=${set('availableFrom')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Disponible hasta" for="rce-to" error=${err.availableTo}>
          <${ui.DateInput} id="rce-to" value=${f.availableTo} onValue=${set('availableTo')} disabled=${ro} />
        </${ui.Field}>

        <div class="rcat-form-h">Origen y estado</div>
        <${ui.Field} label="Origen" for="rce-origin">
          <${ui.Select} id="rce-origin" value=${f.origin} options=${originOpts} onValue=${set('origin')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Estado" for="rce-status" hint=${STATUS_HINT[f.status]}>
          <${ui.Select} id="rce-status" value=${f.status} options=${RES.STATUS} onValue=${set('status')} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Proveedor" for="rce-supplier">
          <${ui.Input} id="rce-supplier" value=${f.supplier} onValue=${set('supplier')} placeholder=${f.origin === 'Interno' ? 'Opcional' : 'Empresa que lo suministra'} disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Contrato u orden" for="rce-contract">
          <${ui.Input} id="rce-contract" value=${f.contract} onValue=${set('contract')} placeholder="p. ej. OC-2026-118 o contrato de alquiler" disabled=${ro} />
        </${ui.Field}>
        <${ui.Field} label="Responsable" for="rce-resp" hint="Rol que lo gestiona o lo solicita.">
          <${ui.Input} id="rce-resp" list=${idp + '-people'} value=${f.responsible} onValue=${set('responsible')} placeholder="p. ej. Coordinador logístico" disabled=${ro} />
          <datalist id=${idp + '-people'}>${lists.people.map((p) => html`<option key=${p} value=${p}></option>`)}</datalist>
        </${ui.Field}>
        <${ui.Field} label="Notas" for="rce-notes">
          <${ui.TextArea} id="rce-notes" value=${f.notes} onValue=${set('notes')} rows=${2} disabled=${ro} />
        </${ui.Field}>

        ${kind === 'trabajo' ? html`
          <div class="rcat-form-h">${human ? 'Persona y equipo ágil' : 'Periodos no disponibles'}</div>
          ${human ? html`
            <div class="span-all field">
              <${ui.Check} id="rce-agile" checked=${f.agileTeam} onValue=${set('agileTeam')} label="Integra el equipo ágil" disabled=${ro} />
              <div class="field-hint">Sus días disponibles (dedicación, festivos, ausencias y rango de disponibilidad) alimentan la capacidad sugerida de las iteraciones.${agileOn ? '' : ' El ciclo de vida del proyecto es predictivo: se usa si adoptas un enfoque híbrido o ágil.'}</div>
            </div>
            <${ui.Field} label="Dedicación al proyecto (%)" for="rce-ded" error=${err.dedication}>
              <${ui.NumberInput} id="rce-ded" value=${f.dedication} min=${0} max=${100} onValue=${set('dedication')} disabled=${ro} />
            </${ui.Field}>
            <${ui.Field} label="Horas por día" for="rce-hours" error=${err.hoursPerDay} hint="Para la capacidad en horas.">
              <${ui.NumberInput} id="rce-hours" value=${f.hoursPerDay} min=${0} max=${24} onValue=${set('hoursPerDay')} disabled=${ro} />
            </${ui.Field}>` : null}
          <div class="span-all stack-sm" data-rcat-abs="1">
            <div class="field-label" id=${idp + '-abs'}>${absTitle}</div>
            <div class="field-hint">${human ? 'Vacaciones, incapacidades o capacitaciones: esos días el recurso no cuenta como disponible.' : 'Mantenimiento, reparación o traslado: esos días el recurso no está disponible.'}</div>
            ${f.absences.length ? html`<div class="rcat-abs" role="group" aria-labelledby=${idp + '-abs'}>
              ${f.absences.map((a, i) => html`<div class="rcat-abs-row" key=${a.id}>
                <div><${ui.DateInput} id=${'rce-abs-' + a.id + '-from'} aria-label=${'Desde (periodo ' + (i + 1) + ')'} value=${a.from} onValue=${(v) => setAbs(a.id, 'from', v)} disabled=${ro} />${err['abs-' + a.id] ? html`<div class="field-error">${err['abs-' + a.id]}</div>` : null}</div>
                <div><${ui.DateInput} aria-label=${'Hasta (periodo ' + (i + 1) + ')'} value=${a.to} onValue=${(v) => setAbs(a.id, 'to', v)} disabled=${ro} /></div>
                <div class="rcat-abs-note"><${ui.Input} aria-label=${'Nota (periodo ' + (i + 1) + ')'} value=${a.note} onValue=${(v) => setAbs(a.id, 'note', v)} placeholder="Motivo" disabled=${ro} /></div>
                <div class="rcat-abs-del">${ro ? null : html`<${ui.IconButton} icon="trash" label=${'Quitar el periodo ' + (i + 1)} onClick=${() => delAbs(a.id)} />`}</div>
              </div>`)}
            </div>` : html`<div class="small muted">${human ? 'Sin ausencias registradas.' : 'Sin periodos registrados.'}</div>`}
            ${ro ? null : html`<div><${ui.Button} size="sm" icon="plus" onClick=${addAbs}>${human ? 'Agregar ausencia' : 'Agregar periodo'}</${ui.Button}></div>`}
          </div>` : null}

        <div class="rcat-form-h">Planificación</div>
        ${planBlock}
        <button type="submit" class="sr-only" tabindex="-1" aria-hidden="true">Guardar</button>
      </form>
    </${ui.Modal}>`;
  }

  /* PM.resourceDialog(model, item|null, initial) → Promise<recurso guardado|null>. item puede ser un recurso del catálogo
     o uno virtual (sin clasificar); initial prellena un recurso nuevo (p. ej. {name, typeId, unit}). */
  PM.resourceDialog = (model, item, initial) => new Promise((resolve) => {
    let done = false;
    const end = (v) => { if (!done) { done = true; resolve(v); } };
    PM.openModal((close) => html`<${EditorHost} close=${() => { end(null); close(); }} onSaved=${end} itemId=${(item && item.id) || null} itemArg=${item || null} initial=${initial || null} />`);
  });

  /* ---------------------------------------------------------------- tipos de recurso del proyecto */
  function TypesHost({ close, onDone }) {
    const m = PM.useResourceModel();
    const live = useRef(m); live.current = m;
    const ready = useRef(false);
    if (!m.loading) ready.current = true;
    if (!ready.current) return loadingModal('Tipos de recurso', close);
    if (!m.pid) return noProjectModal('Tipos de recurso', close);
    return html`<${TypesForm} live=${live} close=${close} onDone=${onDone} />`;
  }
  function TypesForm({ live, close, onDone }) {
    const m0 = live.current;
    const canWrite = PM.useCanWrite();
    const ro = !canWrite;
    const data0 = m0.resources || PM.EMPTY.resources;
    const [list, setList] = useState(() => R.types(data0).map((t) => ({ id: t.id, name: t.name, kind: t.kind, edr: EDR.includes(t.edr) ? t.edr : 'Equipos' })));
    const [moves, setMoves] = useState({});
    const [preset, setPreset] = useState(data0.preset || null);
    const [pSel, setPSel] = useState(data0.preset && RES.PRESETS[data0.preset] ? data0.preset : 'general');
    const [pMode, setPMode] = useState('combinar');
    const [pMsg, setPMsg] = useState(null);
    const [pending, setPending] = useState(null);
    const [err, setErr] = useState({});
    const saved = useMemo(() => arr(data0.items).filter(isObj), []);
    const follow = (id, mv) => { let x = id || null, g = 0; while (x && mv[x] !== undefined && g++ < 64) x = mv[x] || null; return x; };
    const counts = useMemo(() => { const c = new Map(); for (const it of saved) { const t = follow(it.typeId, moves); if (t) c.set(t, (c.get(t) || 0) + 1); } return c; }, [moves]);
    const countOf = (id) => counts.get(id) || 0;
    const nameOf = (t) => str(t.name).trim() || 'Tipo sin nombre';
    const setT = (id, k, v) => setList((l) => l.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
    const move = (i, d) => setList((l) => PM.moveItem(l, i, i + d));
    const add = () => { const id = PM.uid('tipo'); setList((l) => [...l, { id, name: '', kind: 'trabajo', edr: 'Equipos' }]); focusLater('rct-n-' + id); };
    const askDelete = (t) => {
      if (countOf(t.id) === 0) { setList((l) => l.filter((x) => x.id !== t.id)); if (pending && pending.id === t.id) setPending(null); return; }
      const other = list.find((x) => x.id !== t.id);
      setPending({ id: t.id, target: other ? other.id : '' });
      focusLater('rct-move-to');
    };
    const confirmDelete = () => {
      if (!pending) return;
      const { id, target } = pending;
      setMoves((mv) => ({ ...mv, [id]: target || '' }));
      setList((l) => l.filter((x) => x.id !== id));
      setPending(null);
    };
    const applyPreset = () => {
      const p = RES.PRESETS[pSel]; if (!p) return;
      if (pMode === 'reemplazar') {
        const ids = new Set(p.types.map((t) => t.id));
        const kept = list.filter((t) => !ids.has(t.id) && countOf(t.id) > 0);
        setList([...p.types.map((t) => ({ id: t.id, name: t.name, kind: t.kind, edr: t.edr })), ...kept]);
        setPMsg('Se aplicó el preset «' + p.label + '» (' + plural(p.types.length, 'tipo', 'tipos') + ').' + (kept.length ? ' Se conservaron ' + plural(kept.length, 'tipo en uso', 'tipos en uso') + ': ' + kept.map(nameOf).join(', ') + '. Reasigna sus recursos y elimínalos si ya no los necesitas.' : ''));
      } else {
        const ids = new Set(list.map((t) => t.id)), names = new Set(list.map((t) => R.key(t.name)));
        const extra = p.types.filter((t) => !ids.has(t.id) && !names.has(R.key(t.name)));
        setList([...list, ...extra.map((t) => ({ id: t.id, name: t.name, kind: t.kind, edr: t.edr }))]);
        setPMsg(extra.length ? 'Se agregaron ' + plural(extra.length, 'tipo', 'tipos') + ' del preset «' + p.label + '»: ' + extra.map((t) => t.name).join(', ') + '.' : 'La lista ya tiene todos los tipos del preset «' + p.label + '».');
      }
      setPreset(pSel);
    };
    const save = () => {
      if (ro) return;
      const e = {};
      const seen = new Map();
      for (const t of list) {
        const k = R.key(t.name);
        if (!k) e['n-' + t.id] = 'Escribe el nombre del tipo.';
        else if (seen.has(k)) e['n-' + t.id] = 'Ya hay un tipo con ese nombre.';
        else seen.set(k, t.id);
      }
      if (!list.length) e.list = 'Agrega al menos un tipo de recurso.';
      if (pending) e.pending = 'Termina de eliminar el tipo «' + nameOf(list.find((t) => t.id === pending.id) || {}) + '» o cancela la eliminación.';
      setErr(e);
      const first = Object.keys(e)[0];
      if (first) { if (first.startsWith('n-')) focusLater('rct-' + first); return; }
      const L = live.current;
      const data = L.resources || PM.EMPTY.resources;
      const types = list.map((t) => ({ id: t.id, name: str(t.name).trim(), kind: t.kind === 'consumible' ? 'consumible' : 'trabajo', edr: EDR.includes(t.edr) ? t.edr : 'Equipos' }));
      const ids = new Set(types.map((t) => t.id));
      let moved = 0;
      const items = arr(data.items).map((it) => {
        if (!isObj(it) || moves[it.typeId] === undefined) return it;
        const t = follow(it.typeId, moves);
        moved++;
        return { ...it, typeId: t && ids.has(t) ? t : null };
      });
      L.saveResources({ ...data, preset: preset || data.preset || null, types, items });
      onDone();
      close();
      PM.toast('Tipos de recurso guardados.' + (moved ? ' ' + plural(moved, 'recurso reasignado', 'recursos reasignados') + '.' : ''));
    };
    const pendingType = pending ? list.find((t) => t.id === pending.id) : null;
    const targetOpts = pending ? [...list.filter((t) => t.id !== pending.id).map((t) => ({ value: t.id, label: nameOf(t) })), { value: '', label: 'Sin clasificar' }] : [];
    const p = RES.PRESETS[pSel];
    const footer = html`<${ui.Button} onClick=${close}>${ro ? 'Cerrar' : 'Cancelar'}</${ui.Button}>${ro ? null : html`<${ui.Button} variant="primary" icon="save" onClick=${save}>Guardar tipos</${ui.Button}>`}`;
    return html`<${ui.Modal} title="Tipos de recurso" subtitle="Clasifican el catálogo y forman el primer nivel de la estructura de desglose de recursos (9.2)." onClose=${close} size="wide" footer=${footer}>
      <div class="stack" data-rcat-types="1">
        ${ro ? html`<${Note} icon="lock">Modo de solo lectura.</${Note}>` : null}
        <p class="small muted" style="margin:0;max-width:90ch">La <strong>clase</strong> define cómo se asignan y costean sus recursos: <em>trabajo</em> en unidades por día hábil (personas, cuadrillas, equipos, servicios) y <em>consumible</em> por cantidad total (materiales, insumos, licencias). La <strong>categoría de la EDR</strong> agrupa los tipos en el documento «Estructura de desglose de recursos».</p>
        ${err.list ? html`<div class="field-error" role="alert">${err.list}</div>` : null}
        <ol class="rcat-types" aria-label="Tipos de recurso del proyecto">
          ${list.map((t, i) => html`<li key=${t.id} class="rcat-trow" data-type=${t.id}>
            <div class="rcat-trow-move">
              <${ui.IconButton} size="sm" icon="chevron-up" label=${'Subir «' + nameOf(t) + '»'} disabled=${ro || i === 0} onClick=${() => move(i, -1)} />
              <${ui.IconButton} size="sm" icon="chevron-down" label=${'Bajar «' + nameOf(t) + '»'} disabled=${ro || i === list.length - 1} onClick=${() => move(i, 1)} />
            </div>
            <div class="rcat-trow-name">
              <${ui.Input} id=${'rct-n-' + t.id} aria-label=${'Nombre del tipo ' + (i + 1)} value=${t.name} onValue=${(v) => setT(t.id, 'name', v)} placeholder="Nombre del tipo" disabled=${ro} />
              ${err['n-' + t.id] ? html`<div class="field-error">${err['n-' + t.id]}</div>` : null}
            </div>
            <div class="rcat-trow-kind"><${ui.Select} aria-label=${'Clase de «' + nameOf(t) + '»'} title=${(RES.KINDS.find((k) => k.value === t.kind) || {}).hint} value=${t.kind} options=${KIND_SHORT} onValue=${(v) => setT(t.id, 'kind', v)} disabled=${ro} /></div>
            <div class="rcat-trow-edr"><${ui.Select} aria-label=${'Categoría de la EDR de «' + nameOf(t) + '»'} value=${t.edr} options=${EDR} onValue=${(v) => setT(t.id, 'edr', v)} disabled=${ro} /></div>
            <div class="rcat-trow-n">${countOf(t.id) ? plural(countOf(t.id), 'recurso', 'recursos') : 'Sin recursos'}</div>
            <div class="rcat-trow-del">${ro ? null : html`<${ui.IconButton} size="sm" icon="trash" label=${'Eliminar el tipo «' + nameOf(t) + '»'} onClick=${() => askDelete(t)} />`}</div>
            ${pendingType && pendingType.id === t.id ? html`<div class="rcat-trow-panel" role="group" aria-label=${'Reasignar los recursos de «' + nameOf(t) + '»'} data-rcat-move="1">
              <span><${ui.Icon} name="alert" size=${15} /> «${nameOf(t)}» tiene ${plural(countOf(t.id), 'recurso', 'recursos')}. Reasígnalos a:</span>
              <select id="rct-move-to" class="select" aria-label="Tipo al que pasan sus recursos" value=${pending.target} onChange=${(e) => setPending({ ...pending, target: e.currentTarget.value })}>
                ${targetOpts.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
              </select>
              <${ui.Button} size="sm" variant="danger" icon="trash" onClick=${confirmDelete}>Eliminar y reasignar</${ui.Button}>
              <${ui.Button} size="sm" onClick=${() => setPending(null)}>Cancelar</${ui.Button}>
            </div>` : null}
          </li>`)}
        </ol>
        ${err.pending ? html`<div class="field-error" role="alert">${err.pending}</div>` : null}
        ${ro ? null : html`<div><${ui.Button} size="sm" icon="plus" onClick=${add}>Agregar tipo</${ui.Button}></div>`}
        ${ro ? null : html`<section class="rcat-box" aria-labelledby="rct-preset-h" data-rcat-preset="1">
          <h3 class="rcat-box-h" id="rct-preset-h">Aplicar un preset</h3>
          <p class="small muted" style="margin:0">Tipos sugeridos según la clase de proyecto. «Combinar» agrega los que falten; «Reemplazar» cambia la lista y conserva los tipos que tienen recursos. Se guarda al pulsar «Guardar tipos».</p>
          <div class="rcat-preset">
            <${ui.Field} label="Preset" for="rct-preset">
              <${ui.Select} id="rct-preset" value=${pSel} options=${Object.entries(RES.PRESETS).map(([k, v]) => ({ value: k, label: v.label + ' · ' + plural(v.types.length, 'tipo', 'tipos') }))} onValue=${setPSel} />
            </${ui.Field}>
            <div class="field"><span class="field-label">Modo</span><${ui.Segmented} label="Modo de aplicación del preset" value=${pMode} onChange=${setPMode} options=${[{ value: 'combinar', label: 'Combinar' }, { value: 'reemplazar', label: 'Reemplazar' }]} /></div>
            <div><${ui.Button} icon="refresh" onClick=${applyPreset}>Aplicar preset</${ui.Button}></div>
          </div>
          ${p ? html`<div class="rcat-ptypes" aria-label=${'Tipos del preset ' + p.label}>${p.types.map((t) => html`<${ui.Chip} key=${t.id} tone="outline">${t.name}</${ui.Chip}>`)}</div>` : null}
          ${pMsg ? html`<${Note} tone="info" icon="info" role="status" data="preset">${pMsg}</${Note}>` : null}
        </section>`}
      </div>
    </${ui.Modal}>`;
  }
  /* PM.resourceTypesDialog(model) → Promise<boolean>: tipos del proyecto (agregar, renombrar, reordenar, eliminar con
     reasignación, aplicar un preset). Guarda {preset, types} en el catálogo. */
  PM.resourceTypesDialog = () => new Promise((resolve) => {
    let done = false;
    const end = (v) => { if (!done) { done = true; resolve(v); } };
    PM.openModal((close) => html`<${TypesHost} close=${() => { end(false); close(); }} onDone=${() => end(true)} />`);
  });

  /* ---------------------------------------------------------------- clasificar los recursos sin clasificar */
  function ClassifyHost({ close, onDone }) {
    const m = PM.useResourceModel();
    const live = useRef(m); live.current = m;
    const ready = useRef(false);
    if (!m.loading) ready.current = true;
    if (!ready.current) return loadingModal('Clasificar recursos', close);
    if (!m.pid || !m.catalog) return noProjectModal('Clasificar recursos', close);
    return html`<${ClassifyForm} live=${live} close=${close} onDone=${onDone} />`;
  }
  function ClassifyForm({ live, close, onDone }) {
    const m0 = live.current;
    const cat = m0.catalog;
    const cur = m0.currency;
    const idp = useMemo(() => PM.uid('rcc'), []);
    const [rows, setRows] = useState(() => {
      const usage = usageOf(cat, m0.schedule.tasks);
      return cat.items.filter((it) => isUnclassified(cat, it)).map((it) => {
        const g = guessType(cat.types, it.name);
        return { id: it.id, name: it.name, virtual: !!it.virtual, code: str(it.code), typeId: g, guessed: !!g, unit: str(it.unit) || 'unidad', unitCost: isNum(it.unitCost) ? Number(it.unitCost) : null, availability: isNum(it.availability) ? Number(it.availability) : null, n: (usage.get(it.id) || {}).n || 0 };
      });
    });
    const [all, setAll] = useState('');
    const [err, setErr] = useState(null);
    const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, guessed: patch.typeId !== undefined ? false : r.guessed } : r)));
    const applyAll = () => { if (!all) return; setRows((rs) => rs.map((r) => (r.typeId ? r : { ...r, typeId: all, guessed: false }))); };
    const ready = rows.filter((r) => r.typeId).length;
    const typeOpts = cat.types.map((t) => ({ value: t.id, label: t.name }));
    const save = () => {
      const L = live.current;
      const data = L.resources || PM.EMPTY.resources;
      const items = [...arr(data.items)];
      let added = 0, updated = 0;
      for (const r of rows) {
        if (!r.typeId) continue;
        const unit = str(r.unit).trim() || 'unidad';
        if (r.virtual) {
          if (items.some((x) => isObj(x) && R.key(x.name) === R.key(r.name))) continue;
          items.push(R.newItem(items.filter(isObj), { name: r.name, typeId: r.typeId, unit, unitCost: r.unitCost, availability: r.availability, addedDate: L.statusDate || D.today(), planned: true }));
          added++;
        } else {
          const i = items.findIndex((x) => isObj(x) && x.id === r.id);
          if (i < 0) continue;
          items[i] = { ...items[i], typeId: r.typeId, unit, unitCost: r.unitCost };
          updated++;
        }
      }
      if (!added && !updated) { setErr('Elige el tipo de al menos un recurso.'); return; }
      L.saveResources({ ...data, items });
      onDone(added + updated);
      close();
      PM.toast((added ? plural(added, 'recurso agregado', 'recursos agregados') + ' al catálogo' : '') + (added && updated ? ' y ' : '') + (updated ? plural(updated, 'recurso clasificado', 'recursos clasificados') : '') + '.');
    };
    const footer = html`<${ui.Button} onClick=${close}>Cancelar</${ui.Button}><${ui.Button} variant="primary" icon="save" onClick=${save} disabled=${!ready}>${ready ? 'Clasificar ' + plural(ready, 'recurso', 'recursos') : 'Clasificar'}</${ui.Button}>`;
    return html`<${ui.Modal} title="Clasificar los recursos sin clasificar" subtitle="Nombres usados en el cronograma que aún no están en el catálogo, o recursos sin tipo." onClose=${close} size="xl" footer=${footer}>
      <div class="stack" data-rcat-classify="1">
        ${rows.length ? html`
          <p class="small muted" style="margin:0;max-width:90ch">Elige el tipo de cada recurso; se guardan en el catálogo con código, unidad y costo unitario y sus asignaciones siguen enlazadas por nombre. Los que dejes sin tipo siguen como «Sin clasificar». Los tipos marcados como sugeridos salen del nombre: revísalos.</p>
          <div class="rcat-all">
            <label class="field-label" for=${idp + '-all'}>Asignar a los que no tienen tipo</label>
            <select id=${idp + '-all'} class="select" value=${all} onChange=${(e) => setAll(e.currentTarget.value)}><option value="">Elige un tipo</option>${typeOpts.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</select>
            <${ui.Button} size="sm" onClick=${applyAll} disabled=${!all}>Aplicar</${ui.Button}>
          </div>
          ${err ? html`<div class="field-error" role="alert">${err}</div>` : null}
          <div class="table-wrap"><table class="table rcat-table rcat-mtable">
            <thead><tr><th class="rcat-c-name">Recurso</th><th>Tipo</th><th>Unidad</th><th class="num">Costo unitario</th></tr></thead>
            <tbody>${rows.map((r) => html`<tr key=${r.id} data-rcat-crow=${r.name}>
              <td class="rcat-c-name"><div class="rcat-name"><strong>${r.name}</strong><span class="rcat-sub">${r.virtual ? (r.n ? 'En ' + plural(r.n, 'actividad', 'actividades') : 'Sin asignar') : (r.code || 'En el catálogo') + ' · tipo no encontrado'}</span></div></td>
              <td><select class="select" aria-label=${'Tipo de «' + r.name + '»'} value=${r.typeId} onChange=${(e) => setRow(r.id, { typeId: e.currentTarget.value })}><option value="">Sin clasificar</option>${typeOpts.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</select>${r.guessed ? html`<div class="rcat-sub">Sugerido según el nombre</div>` : null}</td>
              <td><${ui.Input} aria-label=${'Unidad de «' + r.name + '»'} list=${idp + '-units'} value=${r.unit} onValue=${(v) => setRow(r.id, { unit: v })} /></td>
              <td class="num"><${ui.NumberInput} aria-label=${'Costo unitario de «' + r.name + '»'} money currency=${cur} value=${r.unitCost} min=${0} placeholder="Sin costo" onValue=${(v) => setRow(r.id, { unitCost: v })} /></td>
            </tr>`)}</tbody>
          </table></div>
          <datalist id=${idp + '-units'}>${RES.UNITS.map((u) => html`<option key=${u} value=${u}></option>`)}</datalist>`
        : html`<${Note} tone="good" icon="check-circle">Todos los recursos están clasificados.</${Note}>`}
      </div>
    </${ui.Modal}>`;
  }
  const openClassify = () => new Promise((resolve) => {
    let done = false;
    const end = (v) => { if (!done) { done = true; resolve(v); } };
    PM.openModal((close) => html`<${ClassifyHost} close=${() => { end(0); close(); }} onDone=${end} />`);
  });
  PM.resourceClassifyDialog = () => openClassify();

  /* ---------------------------------------------------------------- asignaciones de un recurso */
  function UsageHost({ close, itemId }) {
    const m = PM.useResourceModel();
    const ready = useRef(false);
    if (!m.loading) ready.current = true;
    if (!ready.current) return loadingModal('Asignaciones del recurso', close);
    const it = m.catalog && m.catalog.byId.get(itemId);
    if (!it) return html`<${ui.Modal} title="Recurso no encontrado" onClose=${close} footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}><p>El recurso ya no está en el catálogo.</p></${ui.Modal}>`;
    return html`<${UsageBody} m=${m} it=${it} close=${close} />`;
  }
  function UsageBody({ m, it, close }) {
    const cat = m.catalog;
    const kind = cat.kindOf(it);
    const cur = m.currency;
    const u = useMemo(() => usageOf(cat, m.schedule.tasks).get(it.id) || null, [cat, m.schedule]);
    const idx = useMemo(() => new Map(arr(m.schedule.tasks).map((t, i) => [t && t.id, i + 1])), [m.schedule]);
    const lines = u ? u.lines : [];
    const enters = (t) => { const md = ['recursos', 'mixto', 'unitario'].includes(t.costMode) ? t.costMode : 'global'; return md === 'recursos' || md === 'mixto' ? 'Sí' : md === 'unitario' ? 'No (precios unitarios)' : 'No (precio global)'; };
    const qtyTxt = (l) => (kind === 'consumible' ? fmt.num(l.qty, 2) + ' ' + (it.unit || 'u.') : fmt.num(l.qty, 1) + ' días-recurso');
    return html`<${ui.Modal} title=${'Asignaciones de «' + it.name + '»'} subtitle=${(it.code ? it.code + ' · ' : '') + KIND_LABEL[kind] + (isNum(it.unitCost) ? ' · ' + fmt.money(it.unitCost, cur) + (kind === 'consumible' ? ' por ' + (it.unit || 'unidad') : ' por unidad y día') : ' · sin costo unitario')} onClose=${close} size="wide" footer=${html`<${ui.Button} onClick=${close}>Cerrar</${ui.Button}>`}>
      ${lines.length ? html`<div class="table-wrap"><table class="table rcat-mtable" data-rcat-usage="1">
        <thead><tr><th class="num">#</th><th>Actividad</th><th>Forma de costeo</th><th class="num">${kind === 'consumible' ? 'Cantidad' : 'Unidades por día'}</th><th class="num">Días hábiles</th><th class="num">${kind === 'consumible' ? 'Consumo' : 'Días-recurso'}</th><th class="num">Costo valorado</th><th>¿Suma al costo de la actividad?</th></tr></thead>
        <tbody>${lines.map((x, i) => html`<tr key=${i}>
          <td class="num faint">${idx.get(x.task.id) || ''}</td>
          <td class="rcat-wrap">${str(x.task.name).trim() || 'Actividad sin nombre'}</td>
          <td class="rcat-wrap">${COST_MODE_LABEL[['recursos', 'mixto', 'unitario'].includes(x.task.costMode) ? x.task.costMode : 'global']}</td>
          <td class="num">${kind === 'consumible' ? fmt.num(x.l.qty, 2) : fmt.num(x.l.units, 2)}</td>
          <td class="num">${x.task.milestone ? 'Hito' : fmt.num(num(x.task.duration, 0), 1)}</td>
          <td class="num">${qtyTxt(x.l)}</td>
          <td class="num">${x.l.priced ? fmt.money(x.l.cost, cur) : html`<span class="rcat-faint">Sin valorar</span>`}</td>
          <td>${enters(x.task)}</td>
        </tr>`)}</tbody>
        <tfoot><tr><td></td><td colspan="4"><strong>Total</strong></td><td class="num"><strong>${kind === 'consumible' ? fmt.num(u.qty, 2) + ' ' + (it.unit || 'u.') : fmt.num(u.qty, 1) + ' días-recurso'}</strong></td><td class="num"><strong>${isNum(it.unitCost) ? fmt.money(u.cost, cur) : '—'}</strong></td><td></td></tr></tfoot>
      </table></div>` : html`<p>El recurso no está asignado a ninguna actividad del cronograma.</p>`}
      <${Note} icon="info">El costo valorado usa el costo unitario del catálogo. Solo entra al presupuesto de las actividades costeadas «Calculado por recursos» o «Mixto»; en las de precio global (a todo costo) y en las de precios unitarios el valor de la actividad no cambia al agregar recursos.</${Note}>
    </${ui.Modal}>`;
  }

  /* ---------------------------------------------------------------- catálogo (componente) */
  const CatalogRow = PM.memo(function CatalogRow({ d, showAgile, canWrite, currency, api }) {
    const it = d.it, u = d.use, kind = d.kind;
    const call = (fn) => () => api.current[fn](it.id);
    const reason = it.planned === false ? REASON.get(it.reason) || null : null;
    const range = rangeText(it.availableFrom, it.availableTo);
    const typeCell = d.uncl
      ? html`<${ui.Chip} tone="warn" icon="alert" class="rcat-chip-wrap">${it.virtual ? 'Sin clasificar' : it.typeId ? 'Tipo no encontrado' : 'Sin clasificar'}</${ui.Chip}>`
      : html`<${ui.Chip} class="rcat-chip-wrap">${d.type.name}</${ui.Chip}>`;
    const planCell = it.planned !== false
      ? html`<div class="rcat-plan"><span class="rcat-sub">${it.virtual ? 'Asignado en el cronograma' : 'Planificado'}</span>${str(it.changeRef).trim() ? html`<button type="button" class="rcat-link is-ref" onClick=${call('cc')}><${ui.Icon} name="link" size=${12} />Incorporado con ${it.changeRef}</button>` : null}</div>`
      : html`<div class="rcat-plan">
        <${ui.Chip} tone="warn" icon="alert">No planificado</${ui.Chip}>
        <span class="rcat-sub">${reason ? reason.label : 'Motivo sin registrar'}</span>
        ${it.reason === 'riesgo' ? html`<span class="rcat-sub">${it.riskId ? 'Riesgo ' + it.riskId : 'Sin riesgo vinculado'}${isNum(it.reserveAmount) ? ' · reserva ' + fmt.money(it.reserveAmount, currency) : ''}</span>` : null}
        ${str(it.changeRef).trim() ? html`<button type="button" class="rcat-link is-ref" onClick=${call('cc')} title="Abrir la solicitud de cambio"><${ui.Icon} name="file" size=${12} />Solicitud ${it.changeRef}</button>`
          : reason && reason.baseline ? html`<span class="rcat-sub rcat-crit"><${ui.Icon} name="alert" size=${12} />Sin solicitud de cambio</span>` : null}
        ${canWrite && ((reason && reason.baseline && !str(it.changeRef).trim()) || !reason) ? html`<${ui.Button} size="sm" icon=${reason ? 'file' : 'edit'} onClick=${call('flow')}>${reason ? 'Registrar solicitud' : 'Registrar motivo'}</${ui.Button}>` : null}
        ${D.valid(it.addedDate) ? html`<span class="rcat-sub">Alta: ${fmt.date(it.addedDate)}</span>` : null}
      </div>`;
    return html`<tr data-rcat-row=${it.name} class=${it.virtual ? 'is-virtual' : ''}>
      <td class="rcat-c-name"><div class="rcat-name">
        ${it.code ? html`<span class="code-tag">${it.code}</span>` : html`<span class="rcat-sub">Sin código</span>`}
        <button type="button" class="rcat-link" onClick=${call(it.virtual && canWrite ? 'classify' : 'edit')}>${it.name}</button>
        ${str(it.responsible).trim() ? html`<span class="rcat-sub">${it.responsible}</span>` : null}
      </div></td>
      <td class="rcat-c-type">${typeCell}${str(it.subtype).trim() ? html`<div class="rcat-sub" data-col="subtipo">${it.subtype}</div>` : null}</td>
      <td class="rcat-nowrap">${KIND_LABEL[kind]}<div class="rcat-sub" data-col="unidad">${str(it.unit).trim() || 'Sin unidad'}${it.kind === 'trabajo' || it.kind === 'consumible' ? ' · clase propia' : ''}</div></td>
      <td class="num rcat-c-avail">${kind === 'consumible'
        ? (isNum(it.availability) ? 'Existencia ' + fmt.num(it.availability, 2) : html`<span class="rcat-faint">—</span>`)
        : (isNum(it.availability) ? fmt.num(it.availability, 2) + ' por día' : html`<span class="rcat-faint">Sin límite</span>`)}
        ${range ? html`<div class="rcat-sub">${range}</div>` : null}</td>
      <td class="num rcat-nowrap">${isNum(it.unitCost) ? html`${fmt.money(it.unitCost, currency)}<div class="rcat-sub">${kind === 'consumible' ? 'por ' + (str(it.unit).trim() || 'unidad') : 'por unidad y día'}</div>` : html`<span class="rcat-faint">Sin costo</span>`}</td>
      <td class="rcat-wrap">${it.virtual || !it.origin ? html`<span class="rcat-faint">—</span>` : it.origin}${str(it.supplier).trim() ? html`<div class="rcat-sub" data-col="proveedor">${it.supplier}</div>` : null}${str(it.contract).trim() ? html`<div class="rcat-sub" data-col="contrato">Contrato: ${it.contract}</div>` : null}</td>
      <td>${it.virtual ? html`<span class="rcat-faint">No registrado</span>` : html`<${ui.Chip} tone=${STATUS_TONE[it.status]}>${STATUS_LABEL[it.status] || 'Planificado'}</${ui.Chip}>`}</td>
      <td>${planCell}</td>
      ${showAgile ? html`<td class="rcat-nowrap">${it.agileTeam ? html`Sí · ${fmt.num(isNum(it.dedication) ? it.dedication : 100)} %<div class="rcat-sub">${fmt.num(isNum(it.hoursPerDay) ? it.hoursPerDay : 8, 1)} h/día${arr(it.absences).length ? ' · ' + plural(arr(it.absences).length, 'ausencia', 'ausencias') : ''}</div>` : html`<span class="rcat-faint">—</span>`}</td>` : null}
      <td class="num rcat-nowrap">${u ? html`<button type="button" class="rcat-link is-num" onClick=${call('usage')} title="Ver las asignaciones">${plural(u.n, 'actividad', 'actividades')}</button>
          <div class="rcat-sub">${kind === 'consumible' ? fmt.num(u.qty, 2) + ' ' + (str(it.unit).trim() || 'u.') : fmt.num(u.qty, 1) + ' días-recurso'}</div>
          <div class="rcat-sub">${isNum(it.unitCost) ? fmt.money(u.cost, currency) : 'Sin valorar'}</div>`
        : html`<span class="rcat-faint">Sin asignar</span>`}</td>
      <td class="ctl">${canWrite
        ? (it.virtual ? html`<${ui.Button} size="sm" icon="checklist" onClick=${call('classify')} aria-label=${'Clasificar «' + it.name + '»'}>Clasificar</${ui.Button}>`
          : html`<div class="rcat-acts"><${ui.IconButton} size="sm" icon="edit" label=${'Editar «' + it.name + '»'} onClick=${call('edit')} /><${ui.IconButton} size="sm" icon="trash" label=${'Eliminar «' + it.name + '»'} onClick=${call('del')} /></div>`)
        : html`<${ui.IconButton} size="sm" icon="eye" label=${'Ver el detalle de «' + it.name + '»'} onClick=${call('edit')} />`}</td>
    </tr>`;
  }, (a, b) => a.d.sig === b.d.sig && a.showAgile === b.showAgile && a.canWrite === b.canWrite && a.currency === b.currency && a.api === b.api);

  function ResourceCatalog() {
    const m = PM.useResourceModel();
    const canWrite = PM.useCanWrite();
    const live = useRef(m); live.current = m;
    const getLive = useCallback(() => live.current, []);
    const [q, setQ] = useState('');
    const [typeF, setTypeF] = useState('');
    const [planF, setPlanF] = useState('');
    const [sort, setSort] = useState({ key: 'code', dir: 1 });
    const cat = m.catalog;
    const tasks = m.schedule.tasks;
    const currency = m.currency;
    const usage = useMemo(() => usageOf(cat, tasks), [cat, tasks]);
    /* filas: recurso del catálogo, su uso y una firma para no volver a dibujar las que no cambiaron */
    const descs = useMemo(() => (cat ? cat.items.map((it) => {
      const u = usage.get(it.id) || null;
      const type = cat.typeOf(it);
      const uncl = isUnclassified(cat, it);
      const kind = cat.kindOf(it);
      const reason = it.planned === false ? REASON.get(it.reason) : null;
      const d = { id: it.id, it, use: u, type, uncl, kind };
      d.search = norm([it.code, it.name, it.subtype, it.supplier, it.contract, it.responsible, it.notes, uncl ? 'sin clasificar' : type.name, reason ? reason.label : '', it.changeRef, it.riskId].filter(Boolean).join(' '));
      d.sig = JSON.stringify([it, u ? [u.n, u.qty, u.cost] : null, type.name, uncl, kind]);
      return d;
    }) : []), [cat, usage]);
    const stats = useMemo(() => {
      const s = { total: descs.length, saved: 0, virtual: 0, work: 0, cons: 0, unpl: 0, unplCost: 0, pending: 0, uncl: 0, noCost: 0, noCostUsed: 0 };
      for (const d of descs) {
        if (d.it.virtual) s.virtual++; else s.saved++;
        if (d.kind === 'consumible') s.cons++; else s.work++;
        if (d.it.planned === false) { s.unpl++; s.unplCost += d.use ? d.use.cost : 0; if (needsChange(d.it)) s.pending++; }
        if (d.uncl) s.uncl++;
        if (!isNum(d.it.unitCost)) { s.noCost++; if (d.use) s.noCostUsed++; }
      }
      return s;
    }, [descs]);
    const visible = useMemo(() => {
      const qq = norm(q).trim();
      const out = descs.filter((d) => {
        if (qq && !d.search.includes(qq)) return false;
        if (typeF && (typeF === UNCL ? !d.uncl : d.uncl || d.it.typeId !== typeF)) return false;
        if (planF === 'planificado' && d.it.planned === false) return false;
        if (planF === 'no-planificado' && d.it.planned !== false) return false;
        if (planF === 'pendiente' && !needsChange(d.it)) return false;
        if (planF === 'sin-clasificar' && !d.uncl) return false;
        return true;
      });
      const byName = (a, b) => a.it.name.localeCompare(b.it.name, 'es', { sensitivity: 'base' });
      const cmp = {
        code: (a, b) => (!!a.it.virtual - !!b.it.virtual) || str(a.it.code).localeCompare(str(b.it.code), 'es', { numeric: true }) || byName(a, b),
        name: byName,
        type: (a, b) => (a.uncl - b.uncl) || a.type.name.localeCompare(b.type.name, 'es') || byName(a, b),
        cost: (a, b) => (!isNum(a.it.unitCost) - !isNum(b.it.unitCost)) || num(a.it.unitCost) - num(b.it.unitCost) || byName(a, b),
        use: (a, b) => ((a.use ? a.use.cost : -1) - (b.use ? b.use.cost : -1)) || byName(a, b),
      }[sort.key] || byName;
      const nullsLast = sort.key === 'cost';
      return out.sort((a, b) => { if (nullsLast) { const na = !isNum(a.it.unitCost), nb = !isNum(b.it.unitCost); if (na !== nb) return na ? 1 : -1; } return cmp(a, b) * sort.dir; });
    }, [descs, q, typeF, planF, sort]);
    const agileOn = !!(PM.agile && PM.agile.enabled && PM.agile.enabled(m.project));
    const showAgile = agileOn || descs.some((d) => d.it.agileTeam);

    const add = () => PM.resourceDialog(live.current, null, typeF && typeF !== UNCL ? { typeId: typeF } : null);
    const openTypes = () => PM.resourceTypesDialog(live.current);
    const api = useRef({});
    api.current = {
      edit: (id) => { const it = live.current.catalog.byId.get(id); if (it) PM.resourceDialog(live.current, it); },
      classify: (id) => { const it = live.current.catalog.byId.get(id); if (it) PM.resourceDialog(live.current, it); },
      del: (id) => { const it = live.current.catalog.byId.get(id); if (it) deleteResource(getLive, it); },
      usage: (id) => PM.openModal((close) => html`<${UsageHost} close=${close} itemId=${id} />`),
      cc: (id) => { const it = live.current.catalog.byId.get(id); if (it) openChange(live.current.pid, it); },
      flow: async (id) => {
        const L = live.current;
        const raw = arr(L.resources && L.resources.items).find((x) => isObj(x) && x.id === id);
        if (!raw) return;
        const r = await runFlow({ ...raw }, { deferOpen: true });
        if (!r) return;
        const openId = r.openDocId || null;
        const saved = await live.current.saveItem({ ...r });
        PM.toast('Motivo de «' + saved.name + '» registrado' + (saved.changeRef ? ' con la solicitud ' + saved.changeRef : '') + '.');
        if (openId) setTimeout(() => openDoc(openId), 0);
      },
    };
    const exportCsv = () => {
      const cols = [['code', 'Código'], ['name', 'Nombre'], ['type', 'Tipo'], ['subtype', 'Subtipo'], ['kind', 'Clase'], ['unit', 'Unidad'], ['availability', 'Disponibilidad (por día o existencia)'], ['from', 'Disponible desde'], ['to', 'Disponible hasta'], ['unitCost', 'Costo unitario'], ['basis', 'Base del costo'], ['origin', 'Origen'], ['supplier', 'Proveedor'], ['contract', 'Contrato'], ['responsible', 'Responsable'], ['status', 'Estado'], ['planned', 'Planificado'], ['reason', 'Motivo'], ['riskId', 'Riesgo'], ['reserve', 'Reserva para contingencias consumida'], ['changeRef', 'Solicitud de cambio'], ['added', 'Fecha de alta'], ['agile', 'Equipo ágil'], ['dedication', 'Dedicación (%)'], ['tasks', 'Actividades'], ['qty', 'Cantidad planificada'], ['qtyUnit', 'Unidad de la cantidad'], ['cost', 'Costo planificado'], ['notes', 'Notas']].map(([key, label]) => ({ key, label }));
      const rows = visible.map((d) => {
        const it = d.it, u = d.use, reason = it.planned === false ? REASON.get(it.reason) : null;
        return {
          code: it.code || '', name: it.name, type: d.uncl ? 'Sin clasificar' : d.type.name, subtype: it.subtype || '', kind: KIND_LABEL[d.kind], unit: it.unit || '',
          availability: isNum(it.availability) ? Number(it.availability) : '', from: it.availableFrom || '', to: it.availableTo || '',
          unitCost: isNum(it.unitCost) ? Number(it.unitCost) : '', basis: d.kind === 'consumible' ? 'Por ' + (it.unit || 'unidad') : 'Por unidad y día hábil',
          origin: it.virtual ? '' : it.origin || '', supplier: it.supplier || '', contract: it.contract || '', responsible: it.responsible || '',
          status: it.virtual ? 'No registrado' : STATUS_LABEL[it.status] || '', planned: it.planned !== false, reason: reason ? reason.label : '', riskId: it.riskId || '',
          reserve: isNum(it.reserveAmount) ? Number(it.reserveAmount) : '', changeRef: it.changeRef || '', added: it.addedDate || '',
          agile: !!it.agileTeam, dedication: it.agileTeam && isNum(it.dedication) ? Number(it.dedication) : '',
          tasks: u ? u.n : 0, qty: u ? Math.round(u.qty * 100) / 100 : 0, qtyUnit: d.kind === 'consumible' ? it.unit || '' : 'días-recurso', cost: u && isNum(it.unitCost) ? Math.round(u.cost) : '', notes: it.notes || '',
        };
      });
      PM.download(fileBase(m.project) + '_catalogo-recursos.csv', PM.toCSV(cols, rows, currency));
    };

    if (m.loading && !descs.length) return html`<div class="rcat stack"><${ui.Loading} rows=${5} /></div>`;
    if (!m.pid) return html`<${ui.Empty} icon="resources" title="Abre un proyecto">Elige un proyecto para ver su catálogo de recursos.</${ui.Empty}>`;
    if (!descs.length) {
      return html`<div class="rcat stack" data-rcat="1">
        <${ui.Empty} icon="resources" title="Aún no hay recursos en el catálogo" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${add}>Agregar recurso</${ui.Button}><${ui.Button} icon="settings" onClick=${openTypes}>Tipos de recurso…</${ui.Button}>` : null}>
          Registra las personas, cuadrillas, equipos, materiales y servicios del proyecto con su tipo, unidad, disponibilidad y costo. Los recursos que ya asignaste en el cronograma aparecen aquí como «Sin clasificar» para que los completes.
        </${ui.Empty}>
      </div>`;
    }
    const typeOpts = [...cat.types.map((t) => ({ value: t.id, label: t.name })), { value: UNCL, label: 'Sin clasificar' }];
    const tiles = [
      { id: 'total', label: 'Recursos', value: fmt.num(stats.total), sub: fmt.num(stats.saved) + ' en el catálogo' + (stats.virtual ? ' · ' + fmt.num(stats.virtual) + ' solo en el cronograma' : '') },
      { id: 'trabajo', label: 'De trabajo', value: fmt.num(stats.work), sub: 'Unidades por día hábil' },
      { id: 'consumibles', label: 'Consumibles', value: fmt.num(stats.cons), sub: 'Por cantidad' },
      { id: 'no-planificados', label: 'No planificados', value: fmt.num(stats.unpl), tone: stats.unpl ? 'warn' : null, sub: stats.unpl ? 'Costo ' + fmt.money(stats.unplCost, currency) + (stats.pending ? ' · ' + plural(stats.pending, 'sin solicitud de cambio', 'sin solicitud de cambio') : '') : 'Todos estaban en el plan' },
      { id: 'sin-clasificar', label: 'Sin clasificar', value: fmt.num(stats.uncl), tone: stats.uncl ? 'warn' : null, sub: stats.uncl ? 'Sin tipo de recurso' : 'Todos tienen tipo' },
      { id: 'sin-costo', label: 'Sin costo unitario', value: fmt.num(stats.noCost), tone: stats.noCostUsed ? 'warn' : null, sub: stats.noCostUsed ? plural(stats.noCostUsed, 'asignado que no suma costo', 'asignados que no suman costo') : stats.noCost ? 'Ninguno está asignado' : 'Todos tienen tarifa' },
    ];
    const sortBtn = (key, label) => html`<button type="button" class="rcat-sort" data-sort=${key} data-active=${sort.key === key ? '1' : '0'} title=${'Ordenar por ' + label.toLowerCase()}
      onClick=${() => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'use' ? -1 : 1 }))}>${label}${sort.key === key ? html`<${ui.Icon} name=${sort.dir > 0 ? 'arrow-up' : 'arrow-down'} size=${12} />` : null}</button>`;
    const ariaSort = (...keys) => (keys.includes(sort.key) ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined);
    const colCount = 10 + (showAgile ? 1 : 0);
    const filtered = q || typeF || planF;
    return html`<div class="rcat stack" data-rcat="1">
      ${stats.pending ? html`<${Note} tone="warn" icon="alert" role="status" data="pending"><div class="rcat-note-row"><span><strong>${plural(stats.pending, 'recurso no planificado', 'recursos no planificados')}</strong> ${stats.pending === 1 ? 'cambia' : 'cambian'} la línea base y aún no ${stats.pending === 1 ? 'tiene' : 'tienen'} solicitud de cambio (4.6 Realizar el control integrado de cambios).</span>${planF !== 'pendiente' ? html`<${ui.Button} size="sm" onClick=${() => setPlanF('pendiente')}>Ver pendientes</${ui.Button}>` : null}</div></${Note}>` : null}
      <section class="card rcat-tiles-card" aria-label="Indicadores del catálogo de recursos"><div class="rcat-tiles">
        ${tiles.map((t) => html`<div key=${t.id} class="rcat-tile" data-tile=${t.id} data-tone=${t.tone || null}>
          <div class="rcat-tile-label">${t.label}</div><div class="rcat-tile-value">${t.value}</div><div class="rcat-tile-sub">${t.tone ? html`<${ui.Icon} name="alert" size=${12} /> ` : null}${t.sub}</div>
        </div>`)}
      </div></section>
      <div class="rcat-bar" data-rcat-bar="1">
        <${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar nombre, código, proveedor…" aria-label="Buscar recursos" />
        <${ui.Select} aria-label="Filtrar por tipo" value=${typeF} placeholder="Todos los tipos" options=${typeOpts} onValue=${setTypeF} />
        <${ui.Select} aria-label="Filtrar por planificación" value=${planF} placeholder="Planificados y no planificados" options=${PLAN_FILTERS} onValue=${setPlanF} />
        <span class="rcat-count" role="status" aria-live="polite">${visible.length === descs.length ? plural(descs.length, 'recurso', 'recursos') : fmt.num(visible.length) + ' de ' + plural(descs.length, 'recurso', 'recursos')}</span>
        <div class="rcat-bar-acts">
          ${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${add}>Agregar recurso</${ui.Button}>` : null}
          ${canWrite ? html`<${ui.Button} icon="settings" onClick=${openTypes}>Tipos de recurso…</${ui.Button}>` : null}
          ${canWrite && stats.uncl ? html`<${ui.Button} icon="checklist" onClick=${openClassify}>Clasificar los sin clasificar</${ui.Button}>` : null}
          <${ui.Button} icon="download" onClick=${exportCsv} disabled=${!visible.length}>Exportar CSV</${ui.Button}>
        </div>
      </div>
      <div class="table-wrap rcat-twrap"><table class="table rcat-table" aria-label="Catálogo de recursos">
        <thead><tr>
          <th class="rcat-c-name" aria-sort=${ariaSort('code', 'name')}>${sortBtn('code', 'Código')}<span class="rcat-th-sep" aria-hidden="true">·</span>${sortBtn('name', 'Nombre')}</th>
          <th aria-sort=${ariaSort('type')}>${sortBtn('type', 'Tipo')} <span class="rcat-faint">y subtipo</span></th>
          <th>Clase y unidad</th>
          <th class="num" title="Trabajo: unidades por día hábil. Consumible: existencia disponible.">Disponibilidad</th>
          <th class="num" aria-sort=${ariaSort('cost')}>${sortBtn('cost', 'Costo unitario')}</th>
          <th>Origen y proveedor</th>
          <th>Estado</th>
          <th>Planificación</th>
          ${showAgile ? html`<th>Equipo ágil</th>` : null}
          <th class="num" aria-sort=${ariaSort('use')}>${sortBtn('use', 'Uso planificado')}</th>
          <th class="ctl"><span class="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          ${visible.length ? visible.map((d) => html`<${CatalogRow} key=${d.id} d=${d} showAgile=${showAgile} canWrite=${canWrite} currency=${currency} api=${api} />`)
            : html`<tr><td colspan=${colCount} class="rcat-none">Ningún recurso coincide con la búsqueda o los filtros. ${filtered ? html`<${ui.Button} size="sm" variant="ghost" icon="x" onClick=${() => { setQ(''); setTypeF(''); setPlanF(''); }}>Quitar filtros</${ui.Button}>` : null}</td></tr>`}
        </tbody>
      </table></div>
    </div>`;
  }
  /* PM.ResourceCatalog(props): props.model se acepta por compatibilidad; el componente se suscribe por su cuenta. */
  PM.ResourceCatalog = ResourceCatalog;
})();

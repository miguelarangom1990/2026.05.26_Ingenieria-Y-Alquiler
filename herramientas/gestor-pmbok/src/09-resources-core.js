/* ==========================================================================
   09-resources-core.js — recursos del proyecto (núcleo): catálogo de
   recursos con tipo, unidad, disponibilidad y costo; recursos no planificados
   y su efecto en la línea base; formas de costeo de las actividades (precio
   global, por recursos, mixto, precios unitarios); capacidad del equipo ágil;
   árboles de las estructuras de desglose de costos, de riesgos y de recursos;
   registro de solicitudes de cambio desde cualquier vista.
   Referencia: Guía del PMBOK® 6.ª ed. (9.2, 9.3, 9.6, 7.2, 7.3, 11.2, 4.6).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib) return;
  const D = PM.date;
  const num = PM.num;
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const arr = (x) => (Array.isArray(x) ? x : []);
  const isNum = (v) => v !== null && v !== '' && v !== undefined && Number.isFinite(Number(v));

  /* ---------------------------------------------------------------- constantes */
  const T = (id, name, kind, edr) => ({ id, name, kind, edr });
  const PRESETS = {
    general: { label: 'General', types: [
      T('humano', 'Humano (personal)', 'trabajo', 'Personal'), T('maquinaria', 'Maquinaria y equipo', 'trabajo', 'Equipos'),
      T('herramienta', 'Herramienta', 'trabajo', 'Equipos'), T('material', 'Material', 'consumible', 'Materiales'),
      T('transporte', 'Transporte', 'trabajo', 'Transporte'), T('servicio', 'Servicio o subcontrato', 'trabajo', 'Servicios'),
      T('instalacion', 'Instalación o espacio', 'trabajo', 'Equipos'), T('software', 'Software y licencias', 'consumible', 'Servicios'),
    ] },
    construccion: { label: 'Construcción y obra', types: [
      T('mano-obra', 'Mano de obra', 'trabajo', 'Personal'), T('profesional', 'Personal profesional y administrativo', 'trabajo', 'Personal'),
      T('maquinaria', 'Maquinaria y equipo', 'trabajo', 'Equipos'), T('herramienta', 'Herramienta menor', 'trabajo', 'Equipos'),
      T('material', 'Materiales', 'consumible', 'Materiales'), T('subcontrato', 'Subcontratos', 'trabajo', 'Servicios'),
      T('transporte', 'Transporte y acarreos', 'trabajo', 'Transporte'),
    ] },
    alquiler: { label: 'Alquiler y montaje de equipos', types: [
      T('personal', 'Personal y cuadrillas', 'trabajo', 'Personal'), T('equipo-alquiler', 'Equipo de alquiler (andamios, formaletas)', 'trabajo', 'Equipos'),
      T('izaje', 'Izaje y transporte', 'trabajo', 'Transporte'), T('herramienta', 'Herramienta', 'trabajo', 'Equipos'),
      T('servicio', 'Inspección y servicios', 'trabajo', 'Servicios'), T('insumo', 'Insumos y repuestos', 'consumible', 'Materiales'),
    ] },
    ti: { label: 'Tecnología y sistemas', types: [
      T('personas', 'Personas del proyecto', 'trabajo', 'Personal'), T('consultoria', 'Consultoría y servicios', 'trabajo', 'Servicios'),
      T('licencias', 'Licencias y suscripciones', 'consumible', 'Servicios'), T('infraestructura', 'Infraestructura y nube', 'consumible', 'Servicios'),
      T('equipos', 'Equipos de cómputo', 'consumible', 'Equipos'),
    ] },
  };
  const UNCLASSIFIED = { id: 'sin-clasificar', name: 'Sin clasificar', kind: 'trabajo', edr: 'Personal', virtual: true };
  PM.RES = {
    PRESETS,
    UNCLASSIFIED,
    KINDS: [
      { value: 'trabajo', label: 'Trabajo (unidades por día)', hint: 'Personas, cuadrillas, máquinas, equipos o servicios: se asignan en unidades por día hábil y entran al histograma.' },
      { value: 'consumible', label: 'Consumible (cantidad)', hint: 'Materiales, insumos o licencias: se asignan por cantidad total y se controlan por consumo.' },
    ],
    UNITS: ['persona', 'cuadrilla', 'equipo', 'hora', 'día', 'mes', 'unidad', 'm', 'm²', 'm³', 'kg', 't', 'galón', 'licencia', 'global'],
    ORIGINS: ['Interno', 'Contratado', 'Alquilado', 'Compra', 'Suministro del cliente'],
    STATUS: [
      { value: 'planificado', label: 'Por solicitar' }, { value: 'solicitado', label: 'Solicitado' },
      { value: 'disponible', label: 'Disponible' }, { value: 'liberado', label: 'Liberado' },
    ],
    /* motivos de un recurso no planificado y su efecto en la línea base (Guía del PMBOK® 6.ª ed.: 9.6, 7.4, 11.6 y 4.6) */
    REASONS: [
      { value: 'sustitucion', label: 'Sustitución equivalente', baseline: false, hint: 'Reemplaza un recurso planificado con la misma capacidad y el mismo costo (p. ej. otra grúa a la misma tarifa). Costo y fechas no cambian.' },
      { value: 'todo-costo', label: 'Por cuenta del contratista (actividad a todo costo)', baseline: false, hint: 'El contratista lo aporta a su costo dentro de un precio global; el costo para el proyecto no cambia.' },
      { value: 'riesgo', label: 'Respuesta a un riesgo identificado', baseline: false, reserve: 'contingency', hint: 'Se paga con la reserva para contingencias, que ya está dentro de la línea base de costos: se registra el consumo de la reserva, no se cambia la línea base.' },
      { value: 'rendimiento', label: 'Menor rendimiento o atraso (acción correctiva)', baseline: false, hint: 'Refuerzo por desempeño: el mayor costo o plazo es una variación (CPI, SPI) y se registra como acción correctiva; la línea base no cambia.' },
      { value: 'cambio-alcance', label: 'Cambio de alcance, de diseño o de método', baseline: true, hint: 'Trabajo nuevo o distinto al aprobado: requiere solicitud de cambio (4.6) y, aprobada, una nueva línea base.' },
      { value: 'reserva-gestion', label: 'Imprevisto sin riesgo identificado (reserva de gestión)', baseline: true, reserve: 'management', hint: 'Usar la reserva de gestión requiere un cambio aprobado: solicitud de cambio y nueva línea base.' },
    ],
    COST_MODES: [
      { value: 'global', label: 'Precio global (a todo costo)', hint: 'El valor se escribe a mano y no cambia al agregar recursos; solo cambia si cambian las cantidades, con control de cambios.' },
      { value: 'recursos', label: 'Calculado por recursos', hint: 'Recursos de trabajo: unidades por día × días × costo por unidad-día. Consumibles: cantidad × costo unitario.' },
      { value: 'mixto', label: 'Mixto (fijo + recursos)', hint: 'Una parte fija más la parte que depende de los recursos asignados.' },
      { value: 'unitario', label: 'Precios unitarios', hint: 'Cantidad de obra × precio unitario (contratos a precios unitarios).' },
    ],
    COST_CATEGORIES: ['Mano de obra', 'Materiales', 'Equipos', 'Subcontratos', 'Transporte', 'Servicios', 'Indirectos', 'Otros'],
    DEFAULT_ITEM: { unit: 'unidad', availability: null, unitCost: null, origin: 'Interno', status: 'planificado', planned: true, dedication: 100, hoursPerDay: 8, agileTeam: false },
  };
  PM.deepFreeze(PM.RES);

  PM.EMPTY = PM.deepFreeze({ ...PM.EMPTY, resources: { preset: null, types: [], items: [] } });
  if (PM.TOOL_SHAPES) PM.TOOL_SHAPES.resources = { types: [{}], items: [{ absences: [{}] }] };

  /* ---------------------------------------------------------------- catálogo */
  const res = (PM.res = {});
  /* clave de un nombre de recurso (la misma del histograma: sin mayúsculas ni espacios en los extremos) */
  res.key = (name) => String(name || '').trim().toLowerCase();
  /* tipos del proyecto: los guardados, o los del preset (por defecto «general») */
  res.types = (data) => {
    const saved = arr(data && data.types).filter((t) => isObj(t) && t.id && t.name);
    const seen = new Set();
    const base = saved.length ? saved : PRESETS[(data && data.preset && PRESETS[data.preset]) ? data.preset : 'general'].types;
    return base.filter((t) => !seen.has(t.id) && seen.add(t.id)).map((t) => ({ ...t, kind: t.kind === 'consumible' ? 'consumible' : 'trabajo' }));
  };
  res.typeOf = (types, typeId) => arr(types).find((t) => t.id === typeId) || UNCLASSIFIED;
  res.kindOf = (types, item) => (item && (item.kind === 'consumible' || item.kind === 'trabajo') ? item.kind : res.typeOf(types, item && item.typeId).kind);
  /* siguiente código REC-001 */
  res.nextCode = (items) => {
    let max = 0; for (const it of arr(items)) { const m = /^REC-(\d+)$/.exec(String((it && it.code) || '')); if (m) max = Math.max(max, Number(m[1])); }
    return 'REC-' + String(max + 1).padStart(3, '0');
  };
  /* nuevo recurso con valores por defecto */
  res.newItem = (items, patch = {}) => ({ id: PM.uid('rec'), code: res.nextCode(items), name: '', typeId: null, subtype: '', ...PM.clone(PM.RES.DEFAULT_ITEM), availableFrom: null, availableTo: null, supplier: '', contract: '', responsible: '', addedDate: D.today(), reason: null, riskId: null, reserveAmount: null, changeRef: null, absences: [], notes: '', ...patch });

  /* Catálogo efectivo: recursos guardados + recursos «virtuales» que solo existen como nombres en las asignaciones del
     cronograma (de antes del catálogo); estos quedan como «Sin clasificar» con la disponibilidad de resourceLimits. */
  res.catalog = function (data, schedule) {
    const types = res.types(data);
    const limits = (schedule && isObj(schedule.settings) && isObj(schedule.settings.resourceLimits)) ? schedule.settings.resourceLimits : {};
    const limitOf = (name) => { for (const [k, v] of Object.entries(limits)) if (res.key(k) === res.key(name) && isNum(v)) return Number(v); return null; };
    const items = []; const byId = new Map(), byKey = new Map();
    for (const it of arr(data && data.items)) {
      if (!isObj(it) || !it.id || !String(it.name || '').trim()) continue;
      if (byId.has(it.id)) continue;
      const x = { ...PM.RES.DEFAULT_ITEM, ...it, name: String(it.name).trim(), absences: arr(it.absences).filter(isObj) };
      if (!isNum(x.availability)) x.availability = limitOf(x.name);
      items.push(x); byId.set(x.id, x); if (!byKey.has(res.key(x.name))) byKey.set(res.key(x.name), x);
    }
    for (const t of arr(schedule && schedule.tasks)) {
      if (!isObj(t)) continue;
      for (const a of arr(t.resources)) {
        if (!isObj(a)) continue;
        if (a.resourceId && byId.has(a.resourceId)) continue;
        const name = String(a.name || '').trim(); if (!name || byKey.has(res.key(name))) continue;
        const v = { ...PM.RES.DEFAULT_ITEM, id: 'v:' + res.key(name), code: '', name, typeId: UNCLASSIFIED.id, subtype: '', virtual: true, availability: limitOf(name), absences: [] };
        items.push(v); byId.set(v.id, v); byKey.set(res.key(name), v);
      }
    }
    const resolve = (a) => (!isObj(a) ? null : (a.resourceId && byId.get(a.resourceId)) || byKey.get(res.key(a.name)) || null);
    return { types, items, byId, byKey, resolve, kindOf: (item) => res.kindOf(types, item), typeOf: (item) => res.typeOf(types, item && item.typeId) };
  };

  /* ---------------------------------------------------------------- costos de las actividades */
  const durOf = (t) => (t && !t.milestone ? Math.max(0, num(t.duration, 0)) : 0);
  /* cantidad y costo de una asignación: trabajo → unidades/día × días × costo por unidad-día; consumible → cantidad × costo */
  res.assignment = function (cat, task, a) {
    const item = cat ? cat.resolve(a) : null;
    const kind = item ? cat.kindOf(item) : 'trabajo';
    const units = Math.max(0, num(a && a.units, 0));
    const qty = kind === 'consumible' ? (isNum(a && a.qty) ? Math.max(0, Number(a.qty)) : units * durOf(task)) : units * durOf(task);
    const unitCost = item && isNum(item.unitCost) ? Number(item.unitCost) : null;
    return { item, kind, name: item ? item.name : String((a && a.name) || ''), units, qty, unitCost, cost: unitCost !== null ? qty * unitCost : 0, priced: unitCost !== null };
  };
  /* costo de una actividad según su forma de costeo (task.costMode) */
  res.taskCost = function (task, cat) {
    const mode = ['recursos', 'mixto', 'unitario'].includes(task && task.costMode) ? task.costMode : 'global';
    const lines = arr(task && task.resources).filter((a) => isObj(a) && String(a.name || '').trim()).map((a) => res.assignment(cat, task, a));
    const resourcesTotal = lines.reduce((s, l) => s + l.cost, 0);
    const fixed = mode === 'mixto' ? Math.max(0, num(task.costFixed, 0)) : 0;
    const unitario = { qty: Math.max(0, num(task && task.quantity, 0)), price: Math.max(0, num(task && task.unitPrice, 0)), unit: (task && task.qtyUnit) || '' };
    const total = mode === 'global' ? Math.max(0, num(task && task.cost, 0)) : mode === 'recursos' ? resourcesTotal : mode === 'mixto' ? fixed + resourcesTotal : unitario.qty * unitario.price;
    return { mode, total, fixed, resourcesTotal, lines, unpriced: lines.filter((l) => !l.priced).length, unitario, manual: Math.max(0, num(task && task.cost, 0)) };
  };
  /* Aplica las formas de costeo al cronograma (solo para calcular: no se guarda). Las actividades «global» no cambian. */
  res.applyCosts = function (schedule, data) {
    if (!schedule || !arr(schedule.tasks).some((t) => isObj(t) && ['recursos', 'mixto', 'unitario'].includes(t.costMode))) return schedule;
    const cat = res.catalog(data, schedule);
    let changed = false;
    const tasks = schedule.tasks.map((t) => {
      if (!isObj(t) || !['recursos', 'mixto', 'unitario'].includes(t.costMode)) return t;
      const c = res.taskCost(t, cat);
      changed = true;
      return { ...t, cost: c.total, costManual: num(t.cost, 0), costComputed: true };
    });
    return changed ? { ...schedule, tasks } : schedule;
  };
  /* categoría de costo de cada parte del costo de una actividad (para la estructura de desglose de costos) */
  res.costSplit = function (task, cat, cost) {
    const c = res.taskCost(task, cat);
    const total = isNum(cost) ? Number(cost) : c.total;
    const own = (task && task.costCategory) || null;
    if (c.mode === 'global' || c.mode === 'unitario' || !c.lines.length) return [{ category: own || 'Sin categoría', value: total }];
    const out = new Map();
    const typeCat = (l) => (l.item ? cat.typeOf(l.item).name : UNCLASSIFIED.name);
    for (const l of c.lines) if (l.cost) out.set(typeCat(l), (out.get(typeCat(l)) || 0) + l.cost);
    if (c.fixed) out.set(own || 'Costo fijo', (out.get(own || 'Costo fijo') || 0) + c.fixed);
    const sum = [...out.values()].reduce((a, b) => a + b, 0);
    /* si el costo dado (p. ej. de la línea base) difiere del calculado, se reparte en la misma proporción */
    const f = sum > 0 ? total / sum : 0;
    return sum > 0 ? [...out.entries()].map(([category, v]) => ({ category, value: v * f })) : [{ category: own || 'Sin categoría', value: total }];
  };

  /* Uso de cada recurso en el cronograma: Map(id → {tasks:[{task, units, qty, cost}], count, qty, cost}) */
  res.usage = function (cat, tasks) {
    const out = new Map();
    for (const t of arr(tasks)) {
      if (!isObj(t)) continue;
      for (const a of arr(t.resources)) {
        if (!isObj(a)) continue;
        const l = res.assignment(cat, t, a); if (!l.item) continue;
        let u = out.get(l.item.id); if (!u) { u = { tasks: [], count: 0, qty: 0, cost: 0 }; out.set(l.item.id, u); }
        u.tasks.push({ task: t, units: l.units, qty: l.qty, cost: l.cost }); u.count++; u.qty += l.qty; u.cost += l.cost;
      }
    }
    return out;
  };

  /* ---------------------------------------------------------------- disponibilidad y capacidad */
  /* unidades disponibles de un recurso de trabajo en un día (fuera de su rango o en ausencia: 0; sin dato: null) */
  res.availableOn = function (item, day) {
    if (!isObj(item)) return null;
    if (D.valid(item.availableFrom) && day < item.availableFrom) return 0;
    if (D.valid(item.availableTo) && day > item.availableTo) return 0;
    if (arr(item.absences).some((a) => isObj(a) && D.valid(a.from) && day >= a.from && day <= (D.valid(a.to) ? a.to : a.from))) return 0;
    return isNum(item.availability) ? Number(item.availability) : null;
  };
  /* Capacidad del equipo ágil en una iteración: días-persona disponibles (dedicación, festivos, ausencias y rango de
     disponibilidad) frente a una referencia, y la capacidad sugerida en horas o en puntos (velocidad media × proporción).
     Referencia (reference.kind): «velocidad» = promedio de días-persona de las iteraciones cerradas de las que sale la
     velocidad media (las ≤ 3 últimas de velocity.rows, con sus fechas); así un miembro que entra o sale del equipo cambia la
     sugerida en proporción. «habitual» (sin iteraciones cerradas con fechas) = una iteración completa (settings.sprintLength)
     de cada miembro que esté disponible algún día de la iteración (availableFrom/To): quien está fuera de su rango en toda la
     iteración no cuenta; los días fuera de rango de quien entra o sale a mitad, como las ausencias, reducen la disponibilidad. */
  const workdaysOf = (cal, start, end) => { const days = [], holidays = []; for (let d = start, g = 0; d <= end && g < 400; d = D.add(d, 1), g++) { if (cal.isWork(d)) days.push(d); else if (cal.holidayName && cal.holidayName(d)) holidays.push({ date: d, name: cal.holidayName(d) }); } return { days, holidays }; };
  const inRange = (m, d) => !(D.valid(m.availableFrom) && d < m.availableFrom) && !(D.valid(m.availableTo) && d > m.availableTo);
  const memberDays = (m, days) => {
    const ded = Math.min(100, Math.max(0, num(m.dedication, 100))) / 100;
    const units = isNum(m.availability) && Number(m.availability) > 0 ? Number(m.availability) : 1;
    let avail = 0, absent = 0, within = 0;
    for (const d of days) { const a = res.availableOn(m, d); avail += a === null ? units : Math.min(units, a); if (inRange(m, d)) { within++; if (a === 0) absent++; } }
    return { ded, units, personDays: avail * ded, absent, within };
  };
  res.teamCapacity = function ({ data, schedule, sprint, cal, settings, velocity } = {}) {
    const cat = res.catalog(data, schedule);
    const isTeam = (it) => !it.virtual && it.agileTeam && cat.kindOf(it) === 'trabajo';
    const members = cat.items.filter((it) => isTeam(it) && it.status !== 'liberado');
    const out = { members: [], personDays: 0, normal: 0, hours: 0, ratio: null, suggested: null, unit: settings && settings.estimationUnit === 'horas' ? 'horas' : 'puntos', reference: null };
    if (!members.length || !sprint || !D.valid(sprint.start) || !D.valid(sprint.end) || !cal) return out;
    const { days, holidays } = workdaysOf(cal, sprint.start, sprint.end);
    out.workdays = days.length; out.holidays = holidays;
    const L = Math.max(1, Math.round(num(settings && settings.sprintLength, days.length || 10)));
    for (const m of members) {
      const r = memberDays(m, days);
      const normal = r.within > 0 ? r.units * r.ded * L : 0, hours = r.personDays * Math.max(0, num(m.hoursPerDay, 8));
      out.members.push({ id: m.id, name: m.name, dedication: r.ded * 100, personDays: r.personDays, normal, hours, absentDays: r.absent, inRangeDays: r.within });
      out.personDays += r.personDays; out.normal += normal; out.hours += hours;
    }
    /* referencia de la velocidad: las mismas iteraciones cerradas del promedio (≤ 3 últimas), con el equipo de entonces
       (también quienes ya fueron liberados, dentro de su rango de disponibilidad) */
    const closed = arr(velocity && velocity.rows).filter((r) => isObj(r) && r.status === 'cerrado').slice(-3);
    const refTeam = cat.items.filter(isTeam);
    const refRows = closed.every((r) => D.valid(r.start) && D.valid(r.end) && r.start <= r.end)
      ? closed.map((r) => ({ id: r.id, name: r.name || '', personDays: refTeam.reduce((s, m) => s + memberDays(m, workdaysOf(cal, r.start, r.end).days).personDays, 0) }))
      : [];
    const refPD = refRows.length ? refRows.reduce((s, r) => s + r.personDays, 0) / refRows.length : 0;
    out.reference = refRows.length && refPD > 0
      ? { kind: 'velocidad', personDays: refPD, sprints: refRows }
      : { kind: 'habitual', personDays: out.normal, sprints: [] };
    out.ratio = out.reference.personDays > 0 ? out.personDays / out.reference.personDays : null;
    const avg = velocity && isNum(velocity.avg3) ? Number(velocity.avg3) : null;
    out.suggested = out.unit === 'horas' ? Math.round(out.hours * 10) / 10 : avg !== null && out.ratio !== null ? Math.round(avg * out.ratio * 10) / 10 : null;
    return out;
  };

  /* ---------------------------------------------------------------- estructuras de desglose (árboles) */
  /* nodo: {id, label, code?, sub?, value, metric:'money'|'count'|'score', pct?, tone?, badge?, children:[]} */
  const node = (id, label, extra = {}) => ({ id, label, value: 0, children: [], ...extra });
  const finish = (root) => {
    const total = root.value || 0;
    const walk = (n) => { n.pct = total > 0 && root.metric === 'money' ? n.value / total : null; n.children.forEach(walk); };
    walk(root); return root;
  };

  /* Estructura de desglose de recursos: tipo → subtipo → recurso, con cantidad y costo planificados. */
  res.rbsTree = function ({ data, schedule, sched }) {
    const cat = res.catalog(data, schedule);
    const tasks = arr(sched && sched.tasks).length ? sched.tasks : arr(schedule && schedule.tasks);
    const use = new Map();
    for (const t of tasks) for (const a of arr(t && t.resources)) {
      if (!isObj(a)) continue; const l = res.assignment(cat, t, a); if (!l.item) continue;
      const u = use.get(l.item.id) || { qty: 0, cost: 0, tasks: 0 }; u.qty += l.qty; u.cost += l.cost; u.tasks++; use.set(l.item.id, u);
    }
    const root = node('rbs', 'Recursos del proyecto', { metric: 'money', kind: 'root' });
    const typeNodes = new Map();
    const typesAll = [...cat.types, UNCLASSIFIED];
    for (const it of cat.items) {
      const ty = typesAll.find((t) => t.id === it.typeId) || UNCLASSIFIED;
      let tn = typeNodes.get(ty.id); if (!tn) { tn = node('t:' + ty.id, ty.name, { kind: 'group', sub: ty.kind === 'consumible' ? 'Consumibles' : 'Recursos de trabajo', metric: 'money' }); typeNodes.set(ty.id, tn); }
      let parent = tn;
      const st = String(it.subtype || '').trim();
      if (st) { let sn = tn.children.find((c) => c.id === 't:' + ty.id + ':' + res.key(st)); if (!sn) { sn = node('t:' + ty.id + ':' + res.key(st), st, { kind: 'group', metric: 'money' }); tn.children.push(sn); } parent = sn; }
      const u = use.get(it.id) || { qty: 0, cost: 0, tasks: 0 };
      const kind = cat.kindOf(it);
      parent.children.push(node('r:' + it.id, it.name, {
        kind: 'leaf', code: it.code || '', metric: 'money', value: u.cost, qty: u.qty, unit: it.unit || '', resKind: kind, tasks: u.tasks,
        sub: (kind === 'consumible' ? PM.fmt.num(u.qty, 1) + ' ' + (it.unit || 'u.') : PM.fmt.num(u.qty, 1) + ' días-recurso') + (u.tasks ? ' · ' + u.tasks + (u.tasks === 1 ? ' actividad' : ' actividades') : ' · sin asignar'),
        badge: it.planned === false ? 'No planificado' : it.virtual ? 'Sin clasificar' : null, tone: it.planned === false ? 'warn' : null, planned: it.planned !== false,
      }));
    }
    const sum = (n) => { if (n.children.length) n.value = n.children.reduce((s, c) => s + sum(c), 0); return n.value || 0; };
    root.children = typesAll.map((t) => typeNodes.get(t.id)).filter(Boolean);
    sum(root);
    return finish(root);
  };

  /* Estructura de desglose de costos (componentes del presupuesto, Guía del PMBOK® 6.ª ed., gráfico 7-8):
     presupuesto = reserva de gestión + línea base de costos; línea base = reserva para contingencias + cuentas de control;
     cuenta de control (nivel de la EDT) → paquetes de trabajo → actividades. by:'categoria' agrupa por categoría de costo. */
  res.cbsTree = function ({ tree, sched, schedule, data, baseline, reserves, source = 'plan', controlDepth = 1, showActivities = false, by = 'edt' }) {
    const useBl = source === 'baseline' && baseline && isObj(baseline.cost) && Array.isArray(baseline.cost.tasks);
    const cat = res.catalog(data, schedule);
    const live = new Map(arr(sched && sched.tasks).filter(isObj).map((t) => [t.id, t]));
    const blWbs = new Map(arr(useBl && baseline.schedule && baseline.schedule.tasks).filter(isObj).map((t) => [t.id, t.wbsId || null]));
    const rows = useBl
      ? baseline.cost.tasks.filter(isObj).map((b) => ({ id: b.id, name: b.name || (live.get(b.id) || {}).name || b.id, cost: num(b.cost, 0), wbsId: blWbs.has(b.id) ? blWbs.get(b.id) : (live.get(b.id) || {}).wbsId || null, task: live.get(b.id) || { id: b.id } }))
      : [...live.values()].map((t) => ({ id: t.id, name: t.name || t.id, cost: num(t.cost, 0), wbsId: t.wbsId || null, task: t }));
    const rv = useBl ? { contingency: num(baseline.cost.contingency, 0), management: num(baseline.cost.management, 0) } : { contingency: num(reserves && reserves.contingency, 0), management: num(reserves && reserves.management, 0) };
    const bac = rows.reduce((s, r) => s + r.cost, 0);
    const root = node('cbs', 'Presupuesto del proyecto', { metric: 'money', kind: 'root', value: bac + rv.contingency + rv.management });
    const mgmt = node('cbs:gestion', 'Reserva de gestión', { metric: 'money', kind: 'reserve', value: rv.management, sub: 'Incógnitas desconocidas; fuera de la línea base' });
    const base = node('cbs:lb', 'Línea base de costos', { metric: 'money', kind: 'group', value: bac + rv.contingency, sub: useBl ? (baseline.label || 'Línea base') : 'Plan actual' });
    const cont = node('cbs:cont', 'Reserva para contingencias', { metric: 'money', kind: 'reserve', value: rv.contingency, sub: 'Riesgos identificados' });
    root.children = [mgmt, base]; base.children = [cont];
    const actNode = (r) => node('a:' + r.id, r.name, { metric: 'money', kind: 'leaf', value: r.cost, code: '', sub: (r.task && r.task.costMode && r.task.costMode !== 'global') ? (PM.RES.COST_MODES.find((m) => m.value === r.task.costMode) || {}).label : null });
    if (by === 'categoria') {
      const cats = new Map();
      for (const r of rows) for (const s of res.costSplit(r.task, cat, r.cost)) {
        let c = cats.get(s.category); if (!c) { c = node('c:' + res.key(s.category), s.category, { metric: 'money', kind: 'group' }); cats.set(s.category, c); }
        c.value += s.value;
        if (showActivities) c.children.push(node('a:' + r.id + ':' + res.key(s.category), r.name, { metric: 'money', kind: 'leaf', value: s.value }));
      }
      base.children.push(...[...cats.values()].sort((a, b) => b.value - a.value));
      return finish(root);
    }
    const t = tree || PM.calc.wbsTree([]);
    const depthOf = (id) => (t.depth && t.depth.get(id)) || 1;
    const minD = t.flat && t.flat.length ? Math.min(...t.flat.map((f) => f.depth)) : 1;
    const ctrlDepth = minD + Math.max(0, Math.round(num(controlDepth, 1)) - 1);
    const ancestorAt = (id, d) => { let x = id; let g = 0; while (x && depthOf(x) > d && g++ < 64) x = t.parentOf.get(x); return x && depthOf(x) <= d ? x : null; };
    const accounts = new Map(); const none = [];
    for (const r of rows) {
      if (!r.wbsId || !t.byId.has(r.wbsId)) { none.push(r); continue; }
      const ca = ancestorAt(r.wbsId, ctrlDepth) || r.wbsId;
      if (!accounts.has(ca)) accounts.set(ca, []);
      accounts.get(ca).push(r);
    }
    const label = (id) => { const n = t.byId.get(id); return n ? n.name || id : id; };
    const ordered = t.flat ? t.flat.map((f) => f.node.id).filter((id) => accounts.has(id)) : [...accounts.keys()];
    for (const ca of ordered) {
      const list = accounts.get(ca);
      const can = node('w:' + ca, label(ca), { metric: 'money', kind: 'group', code: t.codes.get(ca) || '', sub: 'Cuenta de control' });
      const pk = new Map();
      for (const r of list) { const key = r.wbsId; if (!pk.has(key)) pk.set(key, []); pk.get(key).push(r); }
      if (pk.size === 1 && pk.has(ca)) {
        can.value = list.reduce((s, r) => s + r.cost, 0);
        if (showActivities) can.children = list.map(actNode);
      } else {
        const pkOrder = t.flat ? t.flat.map((f) => f.node.id).filter((id) => pk.has(id)) : [...pk.keys()];
        for (const p of pkOrder) {
          const rs = pk.get(p);
          const pn = node('w:' + ca + ':' + p, p === ca ? 'Actividades de la cuenta de control' : label(p), { metric: 'money', kind: 'group', code: p === ca ? '' : t.codes.get(p) || '', sub: p === ca ? null : 'Paquete de trabajo', value: rs.reduce((s, r) => s + r.cost, 0) });
          if (showActivities) pn.children = rs.map(actNode);
          can.children.push(pn);
        }
        can.value = can.children.reduce((s, c) => s + c.value, 0);
      }
      base.children.push(can);
    }
    if (none.length) { const nn = node('w:none', 'Sin entregable de la EDT', { metric: 'money', kind: 'group', value: none.reduce((s, r) => s + r.cost, 0), tone: 'warn' }); if (showActivities) nn.children = none.map(actNode); base.children.push(nn); }
    return finish(root);
  };

  /* Estructura de desglose de los riesgos: categoría (nivel 1) → subcategoría (nivel 2) del plan de gestión de los
     riesgos (edrRiesgos) → riesgos del registro (subcategoria o, si falta, por la categoría del registro). */
  res.riskTree = function ({ planRows, risks }) {
    const rows = arr(planRows).filter((r) => isObj(r) && String(r.nivel1 || '').trim());
    const root = node('rbr', 'Riesgos del proyecto', { metric: 'count', kind: 'root' });
    const l1 = new Map(), l2 = new Map();
    const getL1 = (name) => { const k = res.key(name); let n = l1.get(k); if (!n) { n = node('n1:' + k, name, { metric: 'count', kind: 'group' }); l1.set(k, n); root.children.push(n); } return n; };
    const getL2 = (n1, name) => { const k = res.key(n1.label) + '|' + res.key(name); let n = l2.get(k); if (!n) { n = node('n2:' + k, name, { metric: 'count', kind: 'group' }); l2.set(k, n); n1.children.push(n); } return n; };
    for (const r of rows) getL2(getL1(String(r.nivel1).trim()), String(r.nivel2 || '').trim() || 'General');
    for (const k of arr(risks)) {
      if (!isObj(k)) continue;
      let parent = null;
      const sub = String(k.subcategoria || '').trim();
      if (sub) { const hit = rows.find((r) => res.key(r.nivel2) === res.key(sub)); if (hit) parent = getL2(getL1(String(hit.nivel1).trim()), String(hit.nivel2).trim()); }
      if (!parent) {
        const catName = String(k.categoria || '').trim();
        /* primero la categoría de nivel 1 con el mismo nombre; luego la primera fila con esa categoría del registro */
        const hit = rows.find((r) => catName && res.key(r.nivel1) === res.key(catName)) || rows.find((r) => catName && res.key(r.categoriaRegistro) === res.key(catName));
        const n1 = hit ? getL1(String(hit.nivel1).trim()) : getL1(catName || 'Sin categoría');
        parent = getL2(n1, sub || 'Sin subcategoría');
      }
      const score = PM.calc.riskScore(k.probabilidad, k.impacto);
      const lvl = PM.calc.riskLevel(score);
      const desc = String(k.descripcion || '').trim();
      parent.children.push(node('k:' + (k.id || PM.uid('k')), (k.id ? k.id + ' · ' : '') + (desc.length > 90 ? desc.slice(0, 88) + '…' : desc || 'Sin descripción'), {
        metric: 'score', kind: 'leaf', value: score, code: k.id || '', level: lvl.label, tone: lvl.tone,
        sub: (k.tipo || 'Amenaza') + ' · ' + (score ? 'P×I ' + score + ' (' + lvl.label + ')' : 'Sin evaluar') + (k.estado ? ' · ' + k.estado : ''), badge: k.tipo === 'Oportunidad' ? 'Oportunidad' : null,
      }));
    }
    const count = (n) => { if (n.kind === 'leaf') return 1; n.value = n.children.reduce((s, c) => s + count(c), 0); n.max = n.children.reduce((m, c) => Math.max(m, c.kind === 'leaf' ? c.value : c.max || 0), 0); if (n.max) { const lv = PM.calc.riskLevel(n.max); n.tone = lv.tone; n.level = lv.label; } return n.value; };
    count(root);
    root.children = root.children.filter((c) => c.value > 0 || rows.length);
    return root;
  };

  /* ---------------------------------------------------------------- control integrado de cambios (4.6) */
  /* Registra una solicitud de cambio (documento solicitud-cambio) y su fila en el registro de cambios. → {code, docId} */
  PM.changeControl = {
    async register({ pid, project, description, justification, scope, days, cost, affected, requester, type, date, quiet }) {
      const wopts = quiet ? { quiet: true } : undefined;
      if (!pid) throw new Error('Sin proyecto');
      const d = D.valid(date) ? date : D.today();
      const regPath = PM.paths.doc(pid, 'registro-cambios');
      const reg = await PM.store.get(regPath);
      const rows = arr(reg && reg.fields && reg.fields.cambios).filter(isObj);
      let max = 0; for (const r of rows) { const m = /^CC-(\d+)$/.exec(String(r.id || '')); if (m) max = Math.max(max, Number(m[1])); }
      const code = 'CC-' + String(max + 1).padStart(3, '0');
      const tpl = PM.templates['solicitud-cambio'];
      const docId = 'solicitud-cambio--' + PM.uid('sc');
      const body = PM.newDocBody(tpl, project, { template: 'solicitud-cambio' });
      body.title = (tpl ? tpl.name : 'Solicitud de cambio') + ' ' + code;
      Object.assign(body.fields, {
        codigoCambio: code, fechaSolicitud: d, solicitante: requester || 'Director de proyecto', tipoCambio: type || 'Actualización', prioridadCambio: body.fields.prioridadCambio || 'Media',
        elementosAfectados: arr(affected), descripcionCambio: description || '', justificacion: justification || '', impactoAlcance: scope || '',
        diasCronograma: num(days, 0), valorCosto: num(cost, 0), decision: 'Registrada',
      });
      await PM.store.set(PM.paths.doc(pid, docId), body, wopts);
      const row = { id: code, fecha: d, solicitante: requester || 'Director de proyecto', descripcion: description || '', tipo: type || 'Actualización', impactoAlcance: scope || '', impactoCronograma: num(days, 0), impactoCosto: num(cost, 0), estado: 'Registrada', fechaDecision: null, decisor: '' };
      const base = reg ? PM.clone(reg) : PM.newDocBody(PM.templates['registro-cambios'], project, { template: 'registro-cambios' });
      base.fields = { ...(base.fields || {}), cambios: [...rows, row] };
      base.updatedAt = PM.nowIso();
      await PM.store.set(regPath, base, wopts);
      PM.touchProject && PM.touchProject(pid);
      return { code, docId };
    },
  };

  /* ---------------------------------------------------------------- hook */
  /* Recursos del proyecto actual: el modelo del proyecto (resources, saveResources, catalog) más el ayudante saveItem
     (crea o actualiza un recurso del catálogo; un recurso virtual se guarda al editarlo) y removeItem. */
  PM.useResourceModel = function () {
    const m = PM.useProjectModel();
    const { useCallback, useRef } = PM.lib;
    const live = useRef(m); live.current = m;
    /* último valor escrito: varias escrituras seguidas en el mismo ciclo se encadenan sobre él (no sobre el valor pintado) */
    const latest = useRef({ src: null, data: null });
    const current = () => { const src = live.current.resources || PM.EMPTY.resources; if (latest.current.src !== src) latest.current = { src, data: src }; return latest.current.data; };
    const write = (data) => { latest.current = { src: live.current.resources || PM.EMPTY.resources, data }; return Promise.resolve(live.current.saveResources(data)); };
    const prepare = (data, item) => {
      const clean = { ...item }; delete clean.virtual;
      if (!clean.id || String(clean.id).startsWith('v:')) { clean.id = PM.uid('rec'); clean.code = clean.code || res.nextCode(data.items); }
      const items = arr(data.items).filter(isObj);
      const i = items.findIndex((x) => x.id === item.id || x.id === clean.id);
      return { clean, data: { ...data, items: i >= 0 ? items.map((x, j) => (j === i ? clean : x)) : [...items, clean] } };
    };
    const saveItem = useCallback((item) => { const p = prepare(current(), item); return write(p.data).then(() => p.clean); }, []);
    const saveItems = useCallback((list) => { let data = current(); const out = []; for (const it of arr(list)) { const p = prepare(data, it); data = p.data; out.push(p.clean); } return write(data).then(() => out); }, []);
    const removeItem = useCallback((id) => { const data = current(); return write({ ...data, items: arr(data.items).filter((x) => isObj(x) && x.id !== id) }); }, []);
    return { ...m, saveItem, saveItems, removeItem };
  };
})();

/* ==========================================================================
   07-agile-core.js — capa ágil del núcleo (Scrum y Kanban, enfoque híbrido):
   contratos de datos del backlog, releases, iteraciones y tablero; enfoque
   (predictivo / adaptativo) por entregable de la EDT; cálculos de burndown,
   burnup, velocidad, flujo acumulado, pronóstico y valor ganado ágil
   (AgileEVM); vinculación del avance de cada release con su actividad del
   cronograma para integrar la parte ágil a la curva S del proyecto.
   Referencia: Guía de prácticas ágiles (PMI y Agile Alliance) y PMBOK® 7.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  if (!PM || PM.failed || !PM.lib) return;
  const D = PM.date;
  const num = PM.num;
  const { useMemo, useCallback } = PM.lib;
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const arr = (x) => (Array.isArray(x) ? x : []);

  /* ---------------------------------------------------------------- rutas y colección */
  PM.registerProjectCollection('backlog');
  PM.paths.backlog = (pid) => 'projects/' + pid + '/backlog';
  PM.paths.backlogItem = (pid, id) => 'projects/' + pid + '/backlog/' + id;

  /* ---------------------------------------------------------------- constantes */
  const DEFAULT_COLUMNS = [
    { id: 'por-hacer', name: 'Por hacer', category: 'pendiente', wip: null },
    { id: 'en-curso', name: 'En curso', category: 'en-curso', wip: 3 },
    { id: 'en-revision', name: 'En revisión', category: 'en-curso', wip: 2 },
    { id: 'terminado', name: 'Terminado', category: 'terminado', wip: null },
  ];
  PM.AGILE = {
    FRAMEWORKS: [
      { value: 'scrum', label: 'Scrum (iteraciones de duración fija)' },
      { value: 'kanban', label: 'Kanban (flujo continuo)' },
      { value: 'scrum-kanban', label: 'Scrum con tablero Kanban' },
    ],
    UNITS: [{ value: 'puntos', label: 'Puntos de historia' }, { value: 'horas', label: 'Horas' }],
    UNIT_SHORT: { puntos: 'pts', horas: 'h' },
    ITEM_TYPES: [
      { value: 'epica', label: 'Épica' }, { value: 'historia', label: 'Historia de usuario' }, { value: 'tarea', label: 'Tarea' },
      { value: 'defecto', label: 'Defecto' }, { value: 'mejora', label: 'Mejora' }, { value: 'investigacion', label: 'Investigación (spike)' },
    ],
    CODE_PREFIX: { epica: 'EP', historia: 'HU', tarea: 'TA', defecto: 'DF', mejora: 'ME', investigacion: 'IN' },
    /* priorización MoSCoW (Guía de prácticas ágiles) */
    PRIORITIES: ['Debe tener', 'Debería tener', 'Podría tener', 'No en este release'],
    BACKLOG: 'backlog',
    CATEGORIES: [
      { value: 'nuevo', label: 'Backlog del producto' }, { value: 'pendiente', label: 'Por hacer' },
      { value: 'en-curso', label: 'En curso' }, { value: 'terminado', label: 'Terminado' },
    ],
    DEFAULT_COLUMNS,
    RELEASE_STATUS: [
      { value: 'planeado', label: 'Planeado' }, { value: 'comprometido', label: 'Comprometido (con línea base)' },
      { value: 'en-curso', label: 'En curso' }, { value: 'cerrado', label: 'Cerrado' },
    ],
    SPRINT_STATUS: [{ value: 'planeado', label: 'Planeado' }, { value: 'en-curso', label: 'En curso' }, { value: 'cerrado', label: 'Cerrado' }],
    APPROACHES: [{ value: 'predictivo', label: 'Predictivo' }, { value: 'adaptativo', label: 'Adaptativo (ágil)' }],
    ROLES: ['Dueño del producto', 'Scrum Master / facilitador', 'Equipo de desarrollo'],
    DEFAULT_SETTINGS: { framework: 'scrum-kanban', estimationUnit: 'puntos', sprintLength: 10, columns: DEFAULT_COLUMNS, scopeChangeThreshold: 10 },
  };
  PM.deepFreeze(PM.AGILE);

  PM.EMPTY = PM.deepFreeze({ ...PM.EMPTY, agile: { settings: PM.AGILE.DEFAULT_SETTINGS, releases: [], sprints: [] } });
  /* release.baseline puede ser null (sin línea base): no se le da forma de objeto para no convertir null en {} */
  if (PM.TOOL_SHAPES) PM.TOOL_SHAPES.agile = { settings: { columns: [{}] }, releases: [{}], sprints: [{}] };

  /* ---------------------------------------------------------------- menú e iconos */
  if (!PM.GROUPS.find((g) => g.id === 'agil')) {
    const i = PM.GROUPS.findIndex((g) => g.id === 'planificacion');
    PM.GROUPS.splice(i >= 0 ? i + 1 : PM.GROUPS.length, 0, { id: 'agil', label: 'Ágil (Scrum y Kanban)' });
  }
  Object.assign(PM.ICONS, {
    backlog: '<rect x="3" y="3.5" width="18" height="4" rx="1"/><rect x="3" y="10" width="14" height="4" rx="1"/><rect x="3" y="16.5" width="9" height="4" rx="1"/>',
    kanban: '<rect x="3" y="3" width="5" height="13" rx="1"/><rect x="9.5" y="3" width="5" height="8" rx="1"/><rect x="16" y="3" width="5" height="17" rx="1"/>',
    sprint: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3.5V8h-4.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    burndown: '<path d="M3 3v18h18"/><path d="M6.5 6.5 19 17" stroke-dasharray="2 2.2"/><path d="M6.5 6.5 9 10l3 .5 2.5 4 3.5 1"/>',
    release: '<path d="m12 2.8 8.5 4.7v9L12 21.2l-8.5-4.7v-9z"/><path d="m3.5 7.5 8.5 4.7 8.5-4.7M12 12.2v9"/>',
  });

  /* ---------------------------------------------------------------- utilidades del enfoque */
  const agile = (PM.agile = {});
  /* 'predictivo' | 'adaptativo' | 'hibrido' según el ciclo de vida del proyecto */
  agile.mode = (project) => {
    const lc = String((project && project.lifecycle) || 'Predictivo');
    if (/^Adaptativo/.test(lc)) return 'adaptativo';
    if (lc === 'Híbrido' || lc === 'Iterativo' || lc === 'Incremental') return 'hibrido';
    return 'predictivo';
  };
  agile.enabled = (project) => agile.mode(project) !== 'predictivo';
  /* configuración con valores por defecto y columnas válidas */
  agile.settings = (data) => {
    const s = isObj(data && data.settings) ? data.settings : {};
    const cols = arr(s.columns).filter((c) => isObj(c) && c.id && c.name && ['pendiente', 'en-curso', 'terminado'].includes(c.category));
    const columns = cols.length && cols.some((c) => c.category === 'terminado') && cols.some((c) => c.category === 'pendiente') ? cols : DEFAULT_COLUMNS;
    return {
      framework: ['scrum', 'kanban', 'scrum-kanban'].includes(s.framework) ? s.framework : 'scrum-kanban',
      estimationUnit: s.estimationUnit === 'horas' ? 'horas' : 'puntos',
      sprintLength: Math.max(1, Math.round(num(s.sprintLength, 10))),
      columns,
      scopeChangeThreshold: Math.max(0, num(s.scopeChangeThreshold, 10)),
    };
  };
  agile.unitShort = (settings) => PM.AGILE.UNIT_SHORT[(settings && settings.estimationUnit) || 'puntos'];
  /* categoría de un estado: 'nuevo' (backlog del producto), 'pendiente', 'en-curso', 'terminado' */
  agile.category = (settings, status) => {
    if (!status || status === PM.AGILE.BACKLOG) return 'nuevo';
    const c = settings.columns.find((x) => x.id === status);
    return c ? c.category : 'nuevo';
  };
  agile.isDone = (settings, item) => agile.category(settings, item && item.status) === 'terminado';
  agile.doneColumn = (settings) => settings.columns.find((c) => c.category === 'terminado');
  agile.firstColumn = (settings) => settings.columns.find((c) => c.category === 'pendiente') || settings.columns[0];
  /* elementos que cuentan para métricas (las épicas agrupan, no se estiman en el flujo) */
  agile.countable = (item) => isObj(item) && item.type !== 'epica';
  agile.estimate = (item) => Math.max(0, num(item && item.estimate, 0));
  /* siguiente código consecutivo por tipo: HU-001, DF-004… */
  agile.nextCode = (items, type) => {
    const pre = PM.AGILE.CODE_PREFIX[type] || 'HU';
    let max = 0; for (const it of arr(items)) { const m = new RegExp('^' + pre + '-(\\d+)$').exec(String(it.code || '')); if (m) max = Math.max(max, Number(m[1])); }
    return pre + '-' + String(max + 1).padStart(3, '0');
  };
  /* nuevo elemento del backlog con valores por defecto */
  agile.newItem = (items, patch = {}) => {
    const type = patch.type || 'historia';
    const ranks = arr(items).map((i) => num(i.rank, 0));
    return { code: agile.nextCode(items, type), type, title: '', description: '', acceptance: '', estimate: null, priority: 'Debería tener', rank: (ranks.length ? Math.max(...ranks) : 0) + 1000, status: PM.AGILE.BACKLOG, wbsId: null, releaseId: null, sprintId: null, epicId: null, assignee: '', blocked: false, tags: [], createdAt: D.today(), doneDate: null, history: [{ date: D.today(), status: PM.AGILE.BACKLOG }], ...patch };
  };
  /* cambia el estado registrando la transición (historial ≤ 60 entradas) y la fecha de terminación */
  agile.withStatus = (settings, item, status, date) => {
    const d = D.valid(date) ? date : D.today();
    const history = [...arr(item.history), { date: d, status }].slice(-60);
    const done = agile.category(settings, status) === 'terminado';
    return { ...item, status, history, doneDate: done ? (agile.isDone(settings, item) && item.doneDate ? item.doneDate : d) : null };
  };
  /* orden del backlog: rango ascendente, luego código */
  agile.sortByRank = (items) => [...arr(items)].sort((a, b) => num(a.rank, 0) - num(b.rank, 0) || String(a.code || '').localeCompare(String(b.code || '')));
  /* rango para colocar un elemento entre dos vecinos */
  agile.rankBetween = (before, after) => { const a = before ? num(before.rank, 0) : null, b = after ? num(after.rank, 0) : null; if (a === null && b === null) return 1000; if (a === null) return b - 1000; if (b === null) return a + 1000; return (a + b) / 2; };

  /* Tiempos de flujo de un elemento terminado (días calendario, contando el día inicial y el final):
     inicio = primer paso a «en curso» o «terminado» (si no, el primer estado fuera del backlog; si no, la terminación);
     cycle = inicio → terminación; lead = creación → terminación (null sin fecha de creación válida). null si no está terminado. */
  agile.flowTimes = function (item, settings) {
    const st = settings || agile.settings(null);
    if (!isObj(item) || !agile.isDone(st, item) || !D.valid(item.doneDate)) return null;
    const hist = arr(item.history).filter((h) => isObj(h) && D.valid(h.date));
    let start = null;
    for (const h of hist) { const c = agile.category(st, h.status); if (c === 'en-curso' || c === 'terminado') { start = h.date; break; } }
    if (!start) for (const h of hist) { if (agile.category(st, h.status) !== 'nuevo') { start = h.date; break; } }
    if (!start || start > item.doneDate) start = item.doneDate;
    const lead = D.valid(item.createdAt) && item.createdAt <= item.doneDate ? D.diff(item.createdAt, item.doneDate) + 1 : null;
    return { start, doneDate: item.doneDate, cycle: D.diff(start, item.doneDate) + 1, lead };
  };
  /* inverso de linksOf: Map(releaseId → taskId) */
  agile.releaseTasks = function (tasks, agileData) {
    const out = new Map();
    for (const [taskId, r] of agile.linksOf(tasks, agileData)) out.set(r.id, taskId);
    return out;
  };

  /* línea base del release con contenido (fecha, puntos o fin); un objeto vacío o mal formado no cuenta */
  agile.hasBaseline = (release) => { const b = isObj(release) ? release.baseline : null; return isObj(b) && (D.valid(b.date) || Number.isFinite(num(b.points, NaN)) || D.valid(b.end)); };
  /* release activo: el de la iteración en curso; si no, el primero en curso, comprometido o planeado (no cerrado) */
  agile.activeRelease = (releases, sprints) => {
    const rs = arr(releases).filter((r) => isObj(r) && r.id);
    const cur = arr(sprints).find((s) => isObj(s) && s.status === 'en-curso' && s.releaseId);
    return (cur && rs.find((r) => r.id === cur.releaseId)) || rs.find((r) => r.status === 'en-curso') || rs.find((r) => r.status === 'comprometido') || rs.find((r) => r.status !== 'cerrado') || null;
  };

  /* ---------------------------------------------------------------- cálculos */
  const calc = PM.calc;
  /* Enfoque efectivo de cada nodo de la EDT: el propio, o el heredado del padre, o el del proyecto. */
  calc.wbsApproach = function (tree, project) {
    const def = agile.mode(project) === 'adaptativo' ? 'adaptativo' : 'predictivo';
    const out = new Map();
    for (const { node } of (tree && tree.flat) || []) {
      const parent = tree.parentOf.get(node.id);
      const inherited = parent ? out.get(parent) || def : def;
      out.set(node.id, node.approach === 'adaptativo' || node.approach === 'predictivo' ? node.approach : inherited);
    }
    return out;
  };

  const sumEst = (list) => list.reduce((s, i) => s + agile.estimate(i), 0);
  const sortByStart = (agile.sortSprints = (sprints) => [...arr(sprints)].filter((s) => isObj(s) && s.id).sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')) || String(a.name || '').localeCompare(String(b.name || ''))));
  calc.sprintsOfRelease = (sprints, releaseId) => sortByStart(sprints).filter((s) => s.releaseId === releaseId);

  /* Burndown de una iteración: restante por día hábil; alcance = elementos asignados (fecha de ingreso o inicio). */
  calc.sprintBurndown = function ({ sprint, items, settings, cal, statusDate }) {
    const st = settings || agile.settings(null);
    const list = arr(items).filter((i) => agile.countable(i) && i.sprintId === sprint.id);
    const start = D.valid(sprint.start) ? sprint.start : null, end = D.valid(sprint.end) ? sprint.end : null;
    const total = sumEst(list);
    const done = sumEst(list.filter((i) => agile.isDone(st, i)));
    const committed = num(sprint.committed, NaN);
    const out = { total, done, remaining: total - done, committed: Number.isFinite(committed) ? committed : total, days: [] };
    if (!start || !end || end < start || !cal) return out;
    const cut = D.valid(statusDate) ? statusDate : D.today();
    const workdays = []; let d = start, guard = 0;
    while (d <= end && guard++ < 400) { if (cal.isWork(d)) workdays.push(d); d = D.add(d, 1); }
    const n = workdays.length || 1;
    const scopeAt = (day) => sumEst(list.filter((i) => (D.valid(i.sprintAddedDate) ? i.sprintAddedDate : start) <= day));
    const doneAt = (day) => sumEst(list.filter((i) => agile.isDone(st, i) && D.valid(i.doneDate) && i.doneDate <= day));
    const base = out.committed;
    /* día 0: día hábil anterior al inicio (compromiso al planificar la iteración) */
    let d0 = D.add(workdays[0] || start, -1); for (let g = 0; g < 14 && !cal.isWork(d0); g++) d0 = D.add(d0, -1);
    out.days.push({ date: d0, ideal: base, remaining: scopeAt(start), scope: scopeAt(start), done: 0 });
    workdays.forEach((day, k) => {
      const future = day > cut;
      const sc = scopeAt(day), dn = doneAt(day);
      out.days.push({ date: day, ideal: Math.max(0, base * (1 - (k + 1) / n)), remaining: future ? null : sc - dn, scope: future ? null : sc, done: future ? null : dn });
    });
    return out;
  };

  /* Velocidad por iteración: comprometido (al iniciar) y terminado (al cerrar, o lo terminado hasta hoy). */
  calc.velocity = function ({ sprints, items, settings }) {
    const st = settings || agile.settings(null);
    const rows = sortByStart(sprints).map((s) => {
      const list = arr(items).filter((i) => agile.countable(i) && i.sprintId === s.id);
      const doneNow = sumEst(list.filter((i) => agile.isDone(st, i)));
      const completed = s.status === 'cerrado' && Number.isFinite(num(s.completed, NaN)) ? num(s.completed) : doneNow;
      const committed = Number.isFinite(num(s.committed, NaN)) ? num(s.committed) : sumEst(list);
      return { id: s.id, name: s.name, start: s.start, end: s.end, status: s.status || 'planeado', releaseId: s.releaseId || null, committed, completed };
    });
    const closed = rows.filter((r) => r.status === 'cerrado');
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    return { rows, closed: closed.length, avg3: mean(closed.slice(-3).map((r) => r.completed)), avgAll: mean(closed.map((r) => r.completed)), min3: closed.length ? Math.min(...closed.slice(-3).map((r) => r.completed)) : null, max3: closed.length ? Math.max(...closed.slice(-3).map((r) => r.completed)) : null };
  };

  /* Avance de un release: terminado / alcance actual (0..1). */
  calc.releaseProgress = function ({ release, items, settings }) {
    const st = settings || agile.settings(null);
    const list = arr(items).filter((i) => agile.countable(i) && i.releaseId === release.id);
    const total = sumEst(list), done = sumEst(list.filter((i) => agile.isDone(st, i)));
    const doneDates = list.filter((i) => agile.isDone(st, i) && D.valid(i.doneDate)).map((i) => i.doneDate);
    return { total, done, remaining: total - done, pct: total > 0 ? done / total : 0, count: list.length, lastDone: doneDates.length ? D.max(...doneDates) : null, firstDone: doneDates.length ? D.min(...doneDates) : null };
  };

  /* Burnup de un release: alcance total y terminado acumulado al cierre de cada iteración (y al corte). */
  calc.releaseBurnup = function ({ release, sprints, items, settings, statusDate }) {
    const st = settings || agile.settings(null);
    const list = arr(items).filter((i) => agile.countable(i) && i.releaseId === release.id);
    const rs = calc.sprintsOfRelease(sprints, release.id);
    const cut = D.valid(statusDate) ? statusDate : D.today();
    const scopeAt = (day) => sumEst(list.filter((i) => !D.valid(i.createdAt) || i.createdAt <= day));
    const doneAt = (day) => sumEst(list.filter((i) => agile.isDone(st, i) && D.valid(i.doneDate) && i.doneDate <= day));
    const pts = [];
    const first = rs[0] && D.valid(rs[0].start) ? D.add(rs[0].start, -1) : D.valid(release.start) ? release.start : null;
    if (first) pts.push({ date: first, label: 'Inicio', scope: scopeAt(first), done: doneAt(first), future: first > cut });
    for (const s of rs) { if (!D.valid(s.end)) continue; const day = s.end > cut ? null : s.end; pts.push({ date: s.end, label: s.name, sprintId: s.id, scope: day ? scopeAt(day) : null, done: day ? doneAt(day) : null, future: !day }); }
    const prog = calc.releaseProgress({ release, items, settings: st });
    return { points: pts, ...prog, baselinePoints: agile.hasBaseline(release) ? num(release.baseline.points, null) : null };
  };

  /* Pronóstico de terminación por velocidad: iteraciones restantes y fecha estimada (optimista, probable, pesimista). */
  calc.releaseForecast = function ({ release, sprints, items, settings, cal, statusDate }) {
    const st = settings || agile.settings(null);
    const prog = calc.releaseProgress({ release, items, settings: st });
    const vel = calc.velocity({ sprints: arr(sprints).filter((s) => s.releaseId === release.id), items, settings: st });
    const velAll = vel.closed ? vel : calc.velocity({ sprints, items, settings: st });
    const avg = velAll.avg3;
    const out = { ...prog, velocity: avg, sprintsNeeded: null, finish: null, finishBest: null, finishWorst: null };
    if (!prog.remaining) { out.sprintsNeeded = 0; out.finish = prog.lastDone; return out; }
    if (!avg || avg <= 0 || !cal) return out;
    const cut = D.valid(statusDate) ? statusDate : D.today();
    const relSprints = calc.sprintsOfRelease(sprints, release.id);
    const closedRel = relSprints.filter((s) => s.status === 'cerrado' && D.valid(s.end) && s.end <= cut);
    /* sin iteraciones cerradas del release: desde lo más tarde entre el día siguiente al corte, el inicio del release y el
       inicio de su primera iteración (un release que aún no empieza no puede terminar antes de empezar) */
    const firstStart = relSprints.find((s) => D.valid(s.start));
    const from = closedRel.length ? D.add(closedRel[closedRel.length - 1].end, 1) : D.max(D.add(cut, 1), ...[release.start, firstStart && firstStart.start].filter((x) => D.valid(x)));
    const L = st.sprintLength;
    const at = (v) => { const n = Math.ceil(prog.remaining / v); return { n, date: cal.addWork(from, n * L - 1) }; };
    const mid = at(avg); out.sprintsNeeded = mid.n; out.finish = mid.date;
    if (velAll.max3 > 0) out.finishBest = at(velAll.max3).date;
    if (velAll.min3 > 0) out.finishWorst = at(velAll.min3).date;
    return out;
  };

  /* Valor ganado ágil (AgileEVM, Sulaiman, Smith y Gil 2006) de un release.
     PPC = iteraciones terminadas / planeadas; APC = terminado / alcance actual del release.
     PV = BAC × PPC; EV = BAC × APC; AC = costos reales del release. */
  calc.agileEvm = function ({ release, sprints, items, settings, actualCost, statusDate }) {
    const st = settings || agile.settings(null);
    const cut = D.valid(statusDate) ? statusDate : D.today();
    const rs = calc.sprintsOfRelease(sprints, release.id);
    /* con línea base del release, las iteraciones planeadas y el BAC salen de ella (AgileEVM): agregar iteraciones o
       presupuesto sin control de cambios no mejora el SPI ni el CPI */
    const b = agile.hasBaseline(release) ? release.baseline : null;
    const bSprints = b ? Math.round(num(b.sprints, 0)) : 0;
    const planned = bSprints > 0 ? bSprints : Math.max(rs.length, Math.round(num(release.plannedSprints, 0)));
    const elapsed = rs.filter((s) => D.valid(s.end) && s.end <= cut).length;
    const prog = calc.releaseProgress({ release, items, settings: st });
    const bac = b && Number.isFinite(num(b.budget, NaN)) && num(b.budget) > 0 ? num(b.budget) : num(release.budget, 0);
    const ppc = planned ? Math.min(1, elapsed / planned) : 0;
    const apc = prog.pct;
    const pv = bac * ppc, ev = bac * apc, ac = Math.max(0, num(actualCost, 0));
    const spi = pv > 0 ? ev / pv : null, cpi = ac > 0 ? ev / ac : null;
    const eac = cpi ? bac / cpi : null;
    return { bac, plannedSprints: planned, sprintsElapsed: elapsed, ppc, apc, pv, ev, ac, sv: ev - pv, cv: ev - ac, spi, cpi, eac, vac: eac !== null ? bac - eac : null, expectedSprints: spi ? planned / spi : null, fromBaseline: !!b, ...prog };
  };

  /* Costos reales de releases (para AgileEVM). Un registro de costs.actuals es de un release si:
     - trae releaseId de ese release (imputación explícita), o
     - no trae releaseId, el release no tiene ningún registro explícito, el registro es de su actividad del cronograma
       (taskId) o de su paquete de la EDT o descendientes (wbsId) y no es anterior al inicio del release.
     Así, en un paquete donde el release es solo una parte del gasto, basta marcar los registros del release.
     Solo cuenta hasta la fecha de corte.
     releaseCosts → { byRelease: Map(id → {ac, shared}), total (cada registro una sola vez), shared: [{actual, ids, amount}] }. */
  agile.releaseCosts = function (releases, costs, tree, statusDate) {
    const rels = arr(releases).filter((r) => isObj(r) && r.id);
    const cut = D.valid(statusDate) ? statusDate : null;
    const actuals = arr(costs && costs.actuals).filter((a) => isObj(a) && !(cut && D.valid(a.date) && a.date > cut));
    const explicit = new Set(actuals.filter((a) => a.releaseId).map((a) => a.releaseId));
    const wbsOf = rels.map((r) => {
      const ids = new Set();
      if (r.wbsId) { ids.add(r.wbsId); if (tree && tree.descendants) for (const id of tree.descendants(r.wbsId) || []) ids.add(id && typeof id === 'object' ? id.id : id); }
      return ids;
    });
    const byRelease = new Map(rels.map((r) => [r.id, { ac: 0, shared: 0 }]));
    const shared = [];
    let total = 0;
    for (const a of actuals) {
      const ids = [];
      rels.forEach((r, k) => {
        if (a.releaseId) { if (a.releaseId === r.id) ids.push(r.id); return; }
        if (explicit.has(r.id)) return;
        if (D.valid(r.start) && D.valid(a.date) && a.date < r.start) return;
        if ((r.taskId && a.taskId === r.taskId) || (a.wbsId && wbsOf[k].has(a.wbsId))) ids.push(r.id);
      });
      if (!ids.length) continue;
      const amount = num(a.amount, 0);
      total += amount;
      for (const id of ids) { const e = byRelease.get(id); e.ac += amount; if (ids.length > 1) e.shared += amount; }
      if (ids.length > 1) shared.push({ actual: a, ids, amount });
    }
    return { byRelease, total, shared };
  };
  /* costo real de un release (misma regla) */
  agile.releaseActualCost = function (release, costs, tree, statusDate) {
    if (!isObj(release) || !release.id) return 0;
    const r = agile.releaseCosts([release], costs, tree, statusDate).byRelease.get(release.id);
    return r ? r.ac : 0;
  };

  /* Límite WIP válido de una columna (entero ≥ 1) o null; conteo por columna sobre todo el tablero (sin filtros). */
  agile.wipLimit = (column) => { const n = column ? num(column.wip, 0) : 0; return n > 0 ? Math.max(1, Math.round(n)) : null; };
  agile.wipCounts = function (settings, items) {
    const st = settings && Array.isArray(settings.columns) ? settings : agile.settings(null);
    const m = new Map(st.columns.map((c) => [c.id, 0]));
    for (const it of arr(items)) if (agile.countable(it) && m.has(it.status)) m.set(it.status, m.get(it.status) + 1);
    return m;
  };
  /* estado WIP de cada columna: [{id, name, category, wip, count, over, full}] */
  agile.wipStatus = function (settings, items) {
    const st = settings && Array.isArray(settings.columns) ? settings : agile.settings(null);
    const counts = agile.wipCounts(st, items);
    return st.columns.map((c) => { const wip = agile.wipLimit(c), count = counts.get(c.id) || 0; return { id: c.id, name: c.name, category: c.category, wip, count, over: !!(wip && count > wip), full: !!(wip && count >= wip) }; });
  };

  /* Diagrama de flujo acumulado: elementos por categoría y día (muestreo semanal si el rango es largo). */
  calc.cfd = function ({ items, settings, from, to }) {
    const st = settings || agile.settings(null);
    const list = arr(items).filter(agile.countable);
    if (!D.valid(from) || !D.valid(to) || to < from) return [];
    const span = D.diff(from, to);
    const step = span > 180 ? 7 : 1;
    const statusAt = (it, day) => {
      if (D.valid(it.createdAt) && it.createdAt > day) return null;
      let s = PM.AGILE.BACKLOG;
      for (const h of arr(it.history)) { if (isObj(h) && D.valid(h.date) && h.date <= day) s = h.status; }
      if (!arr(it.history).length && it.status) s = agile.isDone(st, it) && D.valid(it.doneDate) && it.doneDate > day ? PM.AGILE.BACKLOG : it.status;
      return s;
    };
    const out = [];
    for (let k = 0, day = from; day <= to && k < 800; k++, day = D.add(day, step)) {
      const row = { date: day, nuevo: 0, pendiente: 0, 'en-curso': 0, terminado: 0 };
      for (const it of list) { const s = statusAt(it, day); if (s === null) continue; row[agile.category(st, s)]++; }
      out.push(row);
    }
    return out;
  };

  /* Cambios de alcance del release frente a su línea base (control integrado de cambios en dos niveles). */
  calc.releaseVariance = function ({ release, items, settings, sprints }) {
    const prog = calc.releaseProgress({ release, items, settings });
    const b = agile.hasBaseline(release) ? release.baseline : null;
    if (!b) return { hasBaseline: false, ...prog };
    const bp = num(b.points, 0);
    const scopePct = bp > 0 ? (prog.total - bp) / bp : 0;
    const thr = (settings ? settings.scopeChangeThreshold : 10) / 100;
    const dateChange = D.valid(b.end) && D.valid(release.end) ? D.diff(b.end, release.end) : 0;
    const budgetChange = num(release.budget, 0) - num(b.budget, 0);
    /* con las iteraciones (opcional): más o menos iteraciones que la línea base, o iteraciones que terminan después del fin */
    const rs = Array.isArray(sprints) ? calc.sprintsOfRelease(sprints, release.id) : null;
    const bs = Math.round(num(b.sprints, 0));
    const sprintChange = rs && bs > 0 ? rs.length - bs : 0;
    const endRef = D.valid(release.end) ? release.end : D.valid(b.end) ? b.end : null;
    const sprintsAfterEnd = rs && endRef ? rs.filter((s) => D.valid(s.end) && s.end > endRef).map((s) => s.id) : [];
    return { hasBaseline: true, ...prog, baselinePoints: bp, scopePct, dateChange, budgetChange, sprintChange, sprintsAfterEnd, needsChangeControl: Math.abs(scopePct) > thr + 1e-9 || dateChange !== 0 || Math.abs(budgetChange) > 0.5 || sprintChange !== 0 || sprintsAfterEnd.length > 0 };
  };

  /* Aplica el avance ágil a las actividades del cronograma vinculadas a releases (task.releaseId o release.taskId):
     avance = terminado / alcance; inicio real = inicio de la primera iteración iniciada; fin real al completar.
     No modifica datos guardados: el resultado solo se usa para calcular (CPM, valor ganado, tablero). */
  /* Vínculos actividad → release (una actividad por release y un release por actividad):
     primero release.taskId (si dos releases apuntan a la misma actividad, gana el último); luego task.releaseId, solo
     para releases que aún no tienen actividad (la primera actividad en el orden del cronograma). */
  agile.linksOf = function (tasks, agileData) {
    const releases = arr(agileData && agileData.releases).filter((r) => isObj(r) && r.id);
    const list = arr(tasks).filter((t) => isObj(t) && t.id);
    const ids = new Set(list.map((t) => t.id));
    const byTask = new Map();
    for (const r of releases) if (r.taskId && ids.has(r.taskId)) byTask.set(r.taskId, r);
    const used = new Set([...byTask.values()].map((r) => r.id));
    for (const t of list) {
      if (byTask.has(t.id) || !t.releaseId || used.has(t.releaseId)) continue;
      const r = releases.find((x) => x.id === t.releaseId);
      if (r) { byTask.set(t.id, r); used.add(r.id); }
    }
    return byTask;
  };

  agile.applyToSchedule = function (schedule, agileData, items, opts) {
    const statusDate = opts && D.valid(opts.statusDate) ? opts.statusDate : null;
    const releases = arr(agileData && agileData.releases).filter((r) => isObj(r) && r.id);
    if (!schedule || !releases.length || !arr(schedule.tasks).length) return schedule;
    const st = agile.settings(agileData);
    const byTask = agile.linksOf(schedule.tasks, agileData);
    if (!byTask.size) return schedule;
    let changed = false, cal = null;
    const tasks = schedule.tasks.map((t) => {
      if (!isObj(t)) return t;
      const r = byTask.get(t.id);
      if (!r) return t;
      const prog = calc.releaseProgress({ release: r, items, settings: st });
      if (!prog.total) return t;
      const rs = calc.sprintsOfRelease(agileData.sprints, r.id);
      const started = rs.find((s) => s.status === 'en-curso' || s.status === 'cerrado');
      const progress = Math.round(prog.pct * 1000) / 10;
      const next = { ...t, progress, releaseId: r.id, agileDerived: true };
      if (started && D.valid(started.start) && !D.valid(t.actualStart)) next.actualStart = started.start;
      if (progress >= 100 && prog.lastDone) next.actualFinish = prog.lastDone;
      else if (progress < 100 && t.actualFinish) next.actualFinish = null;
      /* con fecha de corte: fin pronosticado por velocidad (computeSchedule lo usa como duración restante al actualizar) */
      if (statusDate && progress < 100) {
        if (!cal) cal = PM.cal.make(schedule.settings || {}, statusDate);
        const fc = calc.releaseForecast({ release: r, sprints: agileData.sprints, items, settings: st, cal, statusDate });
        if (D.valid(fc.finish)) next.forecastFinish = fc.finish;
      }
      changed = true;
      return next;
    });
    return changed ? { ...schedule, tasks } : schedule;
  };

  /* ---------------------------------------------------------------- vistas ágiles */
  /* Las vistas ágiles se registran con when: PM.agile.when (visibles si el ciclo de vida es adaptativo o híbrido) y
     unavailable: PM.AgileUnavailable (mensaje del anfitrión de vistas cuando el proyecto es predictivo). */
  agile.when = (project) => agile.enabled(project);
  PM.AgileUnavailable = function AgileUnavailable({ project }) {
    const { html } = PM.lib; const ui = PM.ui;
    const canWrite = PM.useCanWrite();
    const enable = async () => {
      try { await PM.projectOps.update(project.id, { lifecycle: 'Híbrido' }); PM.toast('Ciclo de vida cambiado a «Híbrido»: las herramientas ágiles quedan disponibles.'); }
      catch (e) { /* PM.store informa el error */ }
    };
    return html`<div class="page"><${ui.Empty} icon="sprint" title="Herramientas ágiles no activas en este proyecto"
      actions=${html`${canWrite ? html`<${ui.Button} variant="primary" icon="sprint" onClick=${enable}>Usar ciclo de vida híbrido</${ui.Button}>` : null}<${ui.Button} icon="dashboard" onClick=${() => PM.navigate('tablero')}>Ir al tablero</${ui.Button}>`}>
      El ciclo de vida de «${project ? project.name : ''}» es ${(project && project.lifecycle) || 'Predictivo'}. El backlog, el tablero Kanban y las iteraciones
      se activan cuando el ciclo de vida es Adaptativo (ágil), Híbrido, Iterativo o Incremental (se cambia en la Ficha del proyecto).
    </${ui.Empty}></div>`;
  };

  /* ---------------------------------------------------------------- hook del modelo ágil */
  /* Modelo ágil del proyecto actual: datos del proyecto (useProjectModel) + backlog, releases e iteraciones con sus
     funciones de guardado. Los elementos del backlog son documentos independientes (projects/{pid}/backlog/{id}). */
  PM.useAgileModel = function () {
    const model = PM.useProjectModel();
    const { pid, project } = model;
    const data = model.agile;
    const saveAgile = model.saveAgile;
    const settings = useMemo(() => agile.settings(data), [data]);
    const items = model.agileItems;
    const releases = useMemo(() => arr(data.releases).filter((r) => isObj(r) && r.id), [data]);
    const sprints = useMemo(() => sortByStart(data.sprints), [data]);
    const saveItem = useCallback((item) => {
      if (!pid || !item || !item.id) return Promise.resolve();
      const { id, ...body } = item;
      PM.touchProject(pid);
      return PM.store.set(PM.paths.backlogItem(pid, id), PM.clone(body));
    }, [pid]);
    const deleteItem = useCallback((id) => { if (!pid || !id) return Promise.resolve(); PM.touchProject(pid); return PM.store.delete(PM.paths.backlogItem(pid, id)); }, [pid]);
    const setStatus = useCallback((item, status) => saveItem(agile.withStatus(settings, item, status, D.today())), [saveItem, settings]);
    const currentSprint = useMemo(() => sprints.find((s) => s.status === 'en-curso') || null, [sprints]);
    const velocity = useMemo(() => calc.velocity({ sprints, items, settings }), [sprints, items, settings]);
    const approach = useMemo(() => calc.wbsApproach(model.tree, project), [model.tree, project]);
    return { ...model, agileData: data, settings, releases, sprints, items, saveAgile, saveItem, deleteItem, setStatus, currentSprint, velocity, approach, agileLoading: model.loading, mode: agile.mode(project), enabled: agile.enabled(project), unit: agile.unitShort(settings) };
  };
})();

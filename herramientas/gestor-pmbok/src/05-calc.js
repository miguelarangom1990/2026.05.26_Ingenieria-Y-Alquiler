/* ==========================================================================
   05-calc.js — cálculos compartidos: EDT (códigos y consolidación), método de
   la ruta crítica (CPM) sobre calendario laboral, valor ganado (EVM),
   líneas base, riesgos y revisiones de documentos. Funciones puras.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const D = PM.date;
  const num = PM.num;
  const calc = (PM.calc = {});

  /* ---------------------------------------------------------------- EDT */
  /* nodes: [{id, parentId|null, name, order, ...}]. Raíz implícita = el proyecto (código "1"). */
  calc.wbsTree = function (nodes) {
    const list = (nodes || []).filter((n) => n && n.id);
    const byId = new Map(list.map((n) => [n.id, n]));
    const keyOf = (pid) => (pid && byId.has(pid) ? pid : 'root');
    const effParent = new Map(list.map((n) => [n.id, keyOf(n.parentId)]));
    let children, codes, depth, flat, leaves, parentOf, seen;
    const sortFn = (a, b) => num(a.order) - num(b.order) || String(a.name || '').localeCompare(String(b.name || ''));
    /* Recorre desde la raíz; los nodos atrapados en ciclos (datos importados corruptos) se cuelgan de la raíz. */
    for (let guard = 0; guard <= list.length; guard++) {
      children = new Map();
      for (const n of list) { const k = effParent.get(n.id); if (!children.has(k)) children.set(k, []); children.get(k).push(n); }
      for (const arr of children.values()) arr.sort(sortFn);
      codes = new Map(); depth = new Map(); flat = []; leaves = new Set(); parentOf = new Map(); seen = new Set();
      const walk = (key, prefix, d) => {
        (children.get(key) || []).forEach((n, i) => {
          if (seen.has(n.id)) return; seen.add(n.id);
          const code = prefix + '.' + (i + 1);
          codes.set(n.id, code); depth.set(n.id, d); parentOf.set(n.id, key === 'root' ? null : key);
          const isLeaf = !(children.get(n.id) || []).length;
          if (isLeaf) leaves.add(n.id);
          flat.push({ node: n, code, depth: d, isLeaf });
          walk(n.id, code, d + 1);
        });
      };
      walk('root', '1', 1);
      const lost = list.find((n) => !seen.has(n.id));
      if (!lost) break;
      effParent.set(lost.id, 'root');
    }
    const descendants = (id) => { const out = []; const done = new Set([id]); const st = [...(children.get(id) || [])]; while (st.length) { const x = st.pop(); if (done.has(x.id)) continue; done.add(x.id); out.push(x.id); st.push(...(children.get(x.id) || [])); } return out; };
    const ancestors = (id) => { const out = []; let p = parentOf.get(id); while (p && !out.includes(p)) { out.push(p); p = parentOf.get(p); } return out; };
    return { nodes: list, byId, children, codes, depth, flat, leaves, parentOf, descendants, ancestors, rootCode: '1', childrenOf: (id) => children.get(id || 'root') || [] };
  };


  /* ---------------------------------------------------------------- planificado vs fecha */
  /* Fracción planificada de una actividad al cierre del día `at`. */
  calc.plannedFraction = function (cal, start, finish, milestone, at) {
    if (!D.valid(start) || !D.valid(at)) return 0;
    if (milestone) return at >= start ? 1 : 0;
    if (!D.valid(finish) || finish < start) finish = start;
    if (at < start) return 0;
    if (at >= finish) return 1;
    const total = cal.countWork(start, finish);
    if (total <= 0) return at >= finish ? 1 : 0;
    return Math.min(1, cal.countWork(start, at) / total);
  };

  /* ---------------------------------------------------------------- CPM
     schedule = { settings:{workweek, holidaysCO, extraHolidays}, tasks:[{id,name,wbsId,duration,milestone,start,deps:[{id,type,lag}],progress,cost,resources,actualStart,actualFinish,...}] }
     Tiempo en "puntos" de días hábiles: la actividad ocupa [es, ef); ef = es + duración.
     Hito: duración 0; su fecha es el cierre del día hábil anterior a es (o el primer día si es = 0). */
  calc.computeSchedule = function (schedule, projectStart) {
    const settings = (schedule && schedule.settings) || {};
    const raw = ((schedule && schedule.tasks) || []).filter((t) => t && t.id);
    const anchor = D.valid(projectStart) ? projectStart : D.min(...raw.map((t) => t.start).filter(D.valid)) || D.today();
    const cal = PM.cal.make(settings, anchor);
    const byIdRaw = new Map(raw.map((t) => [t.id, t]));
    const preds = new Map(), succs = new Map(), errors = [];
    for (const t of raw) { preds.set(t.id, []); succs.set(t.id, []); }
    for (const t of raw) {
      for (const dep of t.deps || []) {
        if (!dep || !byIdRaw.has(dep.id) || dep.id === t.id) continue;
        if (preds.get(t.id).some((p) => p.id === dep.id)) continue;
        const type = ['FS', 'SS', 'FF', 'SF'].includes(dep.type) ? dep.type : 'FS';
        const lag = Math.round(num(dep.lag));
        preds.get(t.id).push({ id: dep.id, type, lag });
        succs.get(dep.id).push({ id: t.id, type, lag });
      }
    }
    /* orden topológico (Kahn) estable respecto al orden de la lista */
    const indeg = new Map(raw.map((t) => [t.id, preds.get(t.id).length]));
    const order = []; const queue = raw.filter((t) => indeg.get(t.id) === 0).map((t) => t.id); const done = new Set();
    while (queue.length) { const id = queue.shift(); if (done.has(id)) continue; done.add(id); order.push(id); for (const s of succs.get(id)) { indeg.set(s.id, indeg.get(s.id) - 1); if (indeg.get(s.id) === 0) queue.push(s.id); } }
    const cyclic = raw.filter((t) => !done.has(t.id)).map((t) => t.id);
    if (cyclic.length) { errors.push({ type: 'cycle', ids: cyclic, message: 'Hay dependencias circulares entre ' + cyclic.length + ' actividades; se ignoraron esos vínculos.' }); order.push(...cyclic); }
    const cycSet = new Set(cyclic);
    const R = new Map();
    for (const id of order) {
      const t = byIdRaw.get(id);
      const ms = !!t.milestone || num(t.duration, 0) <= 0;
      let d = ms ? 0 : Math.max(1, Math.round(num(t.duration, 1)));
      let es = 0;
      if (D.valid(t.start)) es = Math.max(es, cal.indexOf(t.start) + (ms ? 1 : 0));
      for (const p of preds.get(id)) {
        if (cycSet.has(id) && cycSet.has(p.id)) continue;
        const r = R.get(p.id); if (!r) continue;
        if (p.type === 'FS') es = Math.max(es, r.ef + p.lag);
        else if (p.type === 'SS') es = Math.max(es, r.es + p.lag);
        else if (p.type === 'FF') es = Math.max(es, r.ef + p.lag - d);
        else es = Math.max(es, r.es + p.lag - d);
      }
      let actual = false;
      if (D.valid(t.actualStart)) { es = cal.indexOf(t.actualStart) + (ms ? 1 : 0); actual = true; }
      let ef = es + d;
      if (D.valid(t.actualFinish) && num(t.progress) >= 100) { const f = cal.indexOf(t.actualFinish) + 1; if (ms) { es = f; ef = f; } else { ef = Math.max(es + 1, f); d = ef - es; } actual = true; }
      R.set(id, { es, ef, d, ms, actual });
    }
    let minES = Infinity, maxEF = -Infinity;
    for (const r of R.values()) { minES = Math.min(minES, r.es); maxEF = Math.max(maxEF, r.ef); }
    if (!R.size) { minES = 0; maxEF = 0; }
    for (let k = order.length - 1; k >= 0; k--) {
      const id = order[k]; const r = R.get(id);
      let lf = maxEF;
      for (const s of succs.get(id)) {
        if (cycSet.has(id) && cycSet.has(s.id)) continue;
        const q = R.get(s.id); if (!q || q.ls === undefined) continue;
        if (s.type === 'FS') lf = Math.min(lf, q.ls - s.lag);
        else if (s.type === 'SS') lf = Math.min(lf, q.ls - s.lag + r.d);
        else if (s.type === 'FF') lf = Math.min(lf, q.lf - s.lag);
        else lf = Math.min(lf, q.lf - s.lag + r.d);
      }
      r.lf = lf; r.ls = lf - r.d; r.tf = r.ls - r.es;
      let ff = Infinity, hasSucc = false;
      for (const s of succs.get(id)) {
        const q = R.get(s.id); if (!q) continue; hasSucc = true;
        if (s.type === 'FS') ff = Math.min(ff, q.es - s.lag - r.ef);
        else if (s.type === 'SS') ff = Math.min(ff, q.es - s.lag - r.es);
        else if (s.type === 'FF') ff = Math.min(ff, q.ef - s.lag - r.ef);
        else ff = Math.min(ff, q.ef - s.lag - r.es);
      }
      r.ff = hasSucc ? Math.max(0, Math.min(ff, r.tf)) : Math.max(0, maxEF - r.ef);
    }
    const msDate = (i) => cal.dateOf(i > 0 ? i - 1 : i);
    const tasks = raw.map((t) => {
      const r = R.get(t.id);
      const startDate = r.ms ? msDate(r.es) : cal.dateOf(r.es);
      const finishDate = r.ms ? startDate : cal.dateOf(r.ef - 1);
      const lateStart = r.ms ? msDate(r.ls) : cal.dateOf(r.ls);
      const lateFinish = r.ms ? lateStart : cal.dateOf(r.lf - 1);
      const progress = PM.clamp(num(t.progress), 0, 100);
      return { ...t, milestone: r.ms, duration: r.d, es: r.es, ef: r.ef, ls: r.ls, lf: r.lf, tf: r.tf, ff: r.ff, critical: r.tf <= 0 && progress < 100, actual: r.actual, startDate, finishDate, lateStart, lateFinish, progress, preds: preds.get(t.id), succs: succs.get(t.id) };
    });
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const start = tasks.length ? D.min(...tasks.map((t) => t.startDate)) : cal.anchor;
    const finish = tasks.length ? D.max(...tasks.map((t) => t.finishDate)) : cal.anchor;
    return { cal, tasks, byId, order, start, finish, startIdx: minES, finishIdx: maxEF, workdays: Math.max(0, maxEF - minES), criticalIds: new Set(tasks.filter((t) => t.critical).map((t) => t.id)), errors, settings: cal.settings };
  };

  /* Consolidado por nodo de la EDT: fechas, costo y avance (ponderado por costo; si no hay costo, por duración). */
  calc.rollupWbs = function (tree, sched) {
    const out = new Map();
    const direct = new Map();
    for (const t of (sched && sched.tasks) || []) { if (!t.wbsId) continue; if (!direct.has(t.wbsId)) direct.set(t.wbsId, []); direct.get(t.wbsId).push(t); }
    const visiting = new Set();
    const agg = (id) => {
      if (out.has(id)) return out.get(id);
      if (visiting.has(id)) return { tasks: [], cost: 0, progress: 0, count: 0, start: null, finish: null, critical: false };
      visiting.add(id);
      const tasks = [...(direct.get(id) || [])];
      for (const c of tree.childrenOf(id)) { const sub = agg(c.id); tasks.push(...sub.tasks); }
      const cost = PM.sum(tasks, (t) => num(t.cost));
      const weight = cost > 0 ? (t) => num(t.cost) : (t) => Math.max(1, t.duration);
      const wsum = PM.sum(tasks, weight);
      const progress = wsum > 0 ? PM.sum(tasks, (t) => weight(t) * t.progress) / wsum : 0;
      const r = { tasks, cost, progress, count: tasks.length, start: tasks.length ? D.min(...tasks.map((t) => t.startDate)) : null, finish: tasks.length ? D.max(...tasks.map((t) => t.finishDate)) : null, critical: tasks.some((t) => t.critical) };
      out.set(id, r); return r;
    };
    for (const n of tree.nodes) agg(n.id);
    return out;
  };

  /* ---------------------------------------------------------------- líneas base
     docs = [{id, data}] de projects/{pid}/baselines. data: {number, label, date, includes:['scope','schedule','cost'], note, changeRef, byId, scope, schedule, cost} */
  calc.activeBaselines = function (docs) {
    const list = (docs || []).filter((d) => d && d.data).map((d) => ({ id: d.id, ...d.data })).sort((a, b) => num(b.number) - num(a.number) || String(b.date).localeCompare(String(a.date)));
    const pick = (k) => list.find((b) => (b.includes || []).includes(k)) || null;
    return { list, scope: pick('scope'), schedule: pick('schedule'), cost: pick('cost'), latest: list[0] || null };
  };
  calc.nextBaselineNumber = (docs) => (docs || []).reduce((m, d) => Math.max(m, num(d.data && d.data.number, -1)), -1) + 1;
  /* Construye la instantánea de una línea base a partir del estado actual. */
  calc.makeBaselineSnapshot = function ({ includes, sched, wbs, costs, scopeStatement }) {
    const inc = includes && includes.length ? includes : ['scope', 'schedule', 'cost'];
    const tasks = ((sched && sched.tasks) || []).map((t) => ({ id: t.id, name: t.name || '', wbsId: t.wbsId || null, start: t.startDate, finish: t.finishDate, duration: t.duration, milestone: !!t.milestone, cost: num(t.cost) }));
    const out = { includes: inc };
    if (inc.includes('scope')) out.scope = { wbs: PM.clone((wbs && wbs.nodes) || []), scopeStatement: scopeStatement ? PM.clone(scopeStatement) : null };
    if (inc.includes('schedule')) out.schedule = { start: sched ? sched.start : null, finish: sched ? sched.finish : null, tasks };
    if (inc.includes('cost')) {
      const reserves = (costs && costs.reserves) || {};
      out.cost = { bac: PM.sum(tasks, (t) => t.cost), contingency: num(reserves.contingency), management: num(reserves.management), tasks: tasks.map(({ id, name, start, finish, milestone, cost }) => ({ id, name, start, finish, milestone, cost })) };
    }
    return out;
  };

  /* ---------------------------------------------------------------- valor ganado (EVM)
     sched: resultado de computeSchedule (actual). costBaseline: objeto de línea base (con .cost) o null.
     costs: { actuals:[{id,date,amount,taskId,description,category}], statusUpdates:[{id,date,progress:{taskId:pct},note}], reserves:{contingency,management} } */
  calc.evm = function ({ sched, costBaseline, costs, statusDate }) {
    const cal = sched.cal;
    const at = D.valid(statusDate) ? statusDate : D.today();
    const fromBaseline = !!(costBaseline && costBaseline.cost && Array.isArray(costBaseline.cost.tasks));
    const plan = fromBaseline
      ? costBaseline.cost.tasks.map((b) => ({ id: b.id, name: b.name, start: b.start, finish: b.finish, milestone: !!b.milestone, cost: num(b.cost) }))
      : sched.tasks.map((t) => ({ id: t.id, name: t.name, start: t.startDate, finish: t.finishDate, milestone: t.milestone, cost: num(t.cost) }));
    const budget = new Map(plan.map((p) => [p.id, p.cost]));
    const bac = PM.sum(plan, (p) => p.cost);
    /* PV acumulado: incrementos por día hábil (distribución lineal del presupuesto de cada actividad). */
    const inc = new Map();
    for (const p of plan) {
      if (!p.cost || !D.valid(p.start)) continue;
      if (p.milestone) { inc.set(p.start, (inc.get(p.start) || 0) + p.cost); continue; }
      const fin = D.valid(p.finish) && p.finish >= p.start ? p.finish : p.start;
      const a = cal.indexOf(p.start), b = cal.indexOf(D.add(fin, 1));
      const n = b - a;
      if (n <= 0) { inc.set(fin, (inc.get(fin) || 0) + p.cost); continue; }
      const daily = p.cost / n;
      for (let k = a; k < b; k++) { const d = cal.dateOf(k); inc.set(d, (inc.get(d) || 0) + daily); }
    }
    const pvDates = [...inc.keys()].sort(); const pvCum = []; { let acc = 0; for (const d of pvDates) { acc += inc.get(d); pvCum.push(acc); } }
    const pvAt = (date) => { if (!pvDates.length || date < pvDates[0]) return 0; let lo = 0, hi = pvDates.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (pvDates[mid] <= date) lo = mid; else hi = mid - 1; } return pvCum[lo]; };
    const evFrom = (prog) => { let s = 0; for (const [id, b] of budget) s += b * PM.clamp(num(prog[id]), 0, 100) / 100; return s; };
    const curProg = {}; for (const t of sched.tasks) curProg[t.id] = t.progress;
    const planStart = plan.length ? D.min(...plan.map((p) => p.start)) : sched.start;
    const planFinish = plan.length ? D.max(...plan.map((p) => p.finish)) : sched.finish;
    /* historial de avance */
    const updates = ((costs && costs.statusUpdates) || []).filter((u) => u && D.valid(u.date) && u.date <= at).sort((a, b) => (a.date < b.date ? -1 : 1));
    let carry = {}; const evPts = [];
    if (D.valid(planStart)) evPts.push({ date: D.add(planStart, -1), ev: 0 });
    for (const u of updates) { carry = { ...carry, ...(u.progress || {}) }; evPts.push({ date: u.date, ev: evFrom(carry) }); }
    const ev = evFrom(curProg);
    while (evPts.length && evPts[evPts.length - 1].date >= at) evPts.pop();
    evPts.push({ date: at, ev });
    const evAt = (date) => { if (date >= at) return ev; let prev = evPts[0]; if (!prev || date <= prev.date) return 0; for (const p of evPts) { if (p.date === date) return p.ev; if (p.date > date) { const span = D.diff(prev.date, p.date) || 1; return prev.ev + (p.ev - prev.ev) * (D.diff(prev.date, date) / span); } prev = p; } return prev.ev; };
    /* costos reales */
    const actuals = ((costs && costs.actuals) || []).filter((a) => a && D.valid(a.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
    const acAt = (date) => PM.sum(actuals.filter((a) => a.date <= date), (a) => num(a.amount));
    const ac = acAt(at);
    const pv = pvAt(at);
    /* serie semanal */
    const dates = new Set();
    if (D.valid(planStart)) {
      const end = D.max(planFinish, at);
      let d = D.add(planStart, -1); dates.add(d);
      let guard = 0; while (d < end && guard++ < 1200) { d = D.add(d, 7); dates.add(d < end ? d : end); }
      dates.add(planFinish); dates.add(at);
      for (const u of updates) dates.add(u.date);
    }
    const series = [...dates].filter(D.valid).sort().map((date) => ({ date, pv: pvAt(date), ev: date <= at ? evAt(date) : null, ac: date <= at ? acAt(date) : null }));
    const spi = pv > 0 ? ev / pv : null;
    const cpi = ac > 0 ? ev / ac : null;
    const eac = cpi ? bac / cpi : null;
    const eacAtypical = ac + (bac - ev);
    const eacComposite = cpi && spi ? ac + (bac - ev) / (cpi * spi) : null;
    /* cronograma ganado (earned schedule), en días hábiles */
    let esWd = null, atWd = null, spiT = null, forecastFinish = null, pdWd = null;
    if (D.valid(planStart) && D.valid(planFinish) && bac > 0) {
      pdWd = cal.countWork(planStart, planFinish);
      const complete = ev >= bac - 1e-6;
      /* concluido el trabajo, el tiempo transcurrido se mide hasta su terminación (no hasta la fecha de corte) */
      const atEnd = complete && D.valid(sched.finish) && sched.finish < at ? sched.finish : at;
      atWd = atEnd < planStart ? 0 : cal.countWork(planStart, atEnd);
      let found = null;
      if (complete) found = pdWd;
      else {
        const startIdx = cal.indexOf(planStart), endIdx = cal.indexOf(D.add(planFinish, 1));
        let prevPv = 0;
        for (let k = startIdx; k < endIdx; k++) { const p = pvAt(cal.dateOf(k)); if (p >= ev - 1e-6) { const frac = p - prevPv > 0 ? (ev - prevPv) / (p - prevPv) : 1; found = k - startIdx + PM.clamp(frac, 0, 1); break; } prevPv = p; }
      }
      esWd = found === null ? pdWd : found;
      spiT = atWd > 0 ? esWd / atWd : null;
      if (spiT && spiT > 0) { const ieac = pdWd / spiT; forecastFinish = cal.addWork(planStart, Math.max(0, Math.ceil(ieac) - 1)); }
    }
    const reserves = (costBaseline && costBaseline.cost) ? { contingency: num(costBaseline.cost.contingency), management: num(costBaseline.cost.management) } : { contingency: num(costs && costs.reserves && costs.reserves.contingency), management: num(costs && costs.reserves && costs.reserves.management) };
    return {
      statusDate: at, fromBaseline, bac, pv, ev, ac, sv: ev - pv, cv: ev - ac, spi, cpi, eac, eacAtypical, eacComposite,
      etc: eac !== null ? eac - ac : null, vac: eac !== null ? bac - eac : null,
      tcpi: bac - ac !== 0 ? (bac - ev) / (bac - ac) : null, tcpiEac: eac !== null && eac - ac !== 0 ? (bac - ev) / (eac - ac) : null,
      pctPlanned: bac ? pv / bac : 0, pctComplete: bac ? ev / bac : 0, pctSpent: bac ? ac / bac : 0,
      planStart, planFinish, series, pvAt, evAt, acAt, esWd, atWd, pdWd, spiT, forecastFinish,
      costBaseline: bac + reserves.contingency, totalBudget: bac + reserves.contingency + reserves.management, reserves,
      evPoints: evPts, actualsCount: actuals.length,
    };
  };
  /* Tono para índices de desempeño (CPI/SPI) */
  calc.indexTone = (v) => (v === null || v === undefined || !Number.isFinite(v) ? null : v >= 0.98 ? 'good' : v >= 0.9 ? 'warn' : 'crit');

  /* ---------------------------------------------------------------- riesgos (escala 1–5) */
  calc.riskScore = (p, i) => (num(p) && num(i) ? num(p) * num(i) : 0);
  calc.riskLevel = (score) => { const s = num(score); if (s >= 20) return { id: 'muy-alto', label: 'Muy alto', tone: 'crit' }; if (s >= 10) return { id: 'alto', label: 'Alto', tone: 'signal' }; if (s >= 5) return { id: 'medio', label: 'Medio', tone: 'warn' }; if (s >= 1) return { id: 'bajo', label: 'Bajo', tone: 'good' }; return { id: 'sin', label: 'Sin evaluar', tone: 'outline' }; };

  /* ---------------------------------------------------------------- documentos */
  PM.DOC_STATUS = [
    { id: 'borrador', label: 'Borrador', tone: 'outline' },
    { id: 'revision', label: 'En revisión', tone: 'info' },
    { id: 'aprobado', label: 'Aprobado', tone: 'good' },
    { id: 'obsoleto', label: 'Obsoleto', tone: 'warn' },
  ];
  PM.docStatus = (id) => PM.DOC_STATUS.find((s) => s.id === id) || { id: 'sin', label: 'Sin iniciar', tone: 'outline' };
  /* Convención de planos: borradores A, B, C…; emisiones aprobadas 0, 1, 2…; borradores sobre la emisión n → (n+1)A, (n+1)B… */
  calc.nextDraftRev = (cur) => { if (!cur) return 'A'; let m; if ((m = /^([A-Y])$/.exec(cur))) return String.fromCharCode(m[1].charCodeAt(0) + 1); if (/^Z$/.test(cur)) return 'Z'; if ((m = /^(\d+)$/.exec(cur))) return Number(m[1]) + 1 + 'A'; if ((m = /^(\d+)([A-Y])$/.exec(cur))) return m[1] + String.fromCharCode(m[2].charCodeAt(0) + 1); return 'A'; };
  calc.approvedRev = (cur) => { if (!cur || /^[A-Z]$/.test(cur)) return '0'; let m; if ((m = /^(\d+)$/.exec(cur))) return String(Number(m[1]) + 1); if ((m = /^(\d+)[A-Z]$/.exec(cur))) return m[1]; return '0'; };
  /* Valor por defecto de un campo de plantilla tomando datos del proyecto (field.from = 'project.<campo>') */
  calc.fieldDefault = (field, project) => { if (field && typeof field.from === 'string' && field.from.startsWith('project.') && project) { const v = project[field.from.slice(8)]; return v === undefined ? undefined : v; } return undefined; };
})();

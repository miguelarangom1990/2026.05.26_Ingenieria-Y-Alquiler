/* ==========================================================================
   00-core.js — núcleo: utilidades, fechas/calendario, almacenamiento (db del
   artefacto o navegador), sincronización, registros de vistas y kit de UI.
   Todo cuelga de window.PM. Ver SPEC.md para los contratos.
   ========================================================================== */
(function () {
  'use strict';
  const lib = window.htmPreact;
  if (!lib) {
    const el = document.getElementById('app');
    if (el) el.innerHTML = '<div style="max-width:520px;margin:15vh auto;padding:20px 22px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--fg);font-family:var(--font-body)"><strong>No se pudo cargar la interfaz.</strong><p style="margin-top:8px;color:var(--fg-2)">La librería de la aplicación no respondió. Revisa tu conexión y recarga la página; tus datos no se han perdido.</p></div>';
    window.PM = { failed: true };
    return;
  }
  const { h, html, render, createContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, useReducer, useErrorBoundary } = lib;
  const PM = (window.PM = window.PM || {});
  PM.lib = lib;
  PM.html = html;
  PM.h = h;

  /* ------------------------------------------------------------------ utils */
  const pad2 = (n) => String(n).padStart(2, '0');
  PM.uid = (prefix = 'id') => prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  PM.clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  PM.equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  PM.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  PM.sum = (arr, fn = (x) => x) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
  PM.num = (v, fallback = 0) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : fallback; };
  PM.groupBy = (arr, fn) => arr.reduce((m, x) => { const k = fn(x); (m[k] = m[k] || []).push(x); return m; }, {});
  PM.sortBy = (arr, fn, dir = 1) => [...arr].sort((a, b) => { const x = fn(a), y = fn(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
  PM.debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.cancel = () => clearTimeout(t); return d; };
  PM.escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PM.slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  PM.nowIso = () => new Date().toISOString();
  /* Copia compatible con JSON que reutiliza los subárboles ya congelados (datos de los hooks): conserva la
     identidad de lo que no cambió, de modo que las filas sin cambios no se vuelven a dibujar. */
  PM.cloneShared = function cloneShared(v) {
    if (v === null || v === undefined) return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v !== 'object') return typeof v === 'function' || typeof v === 'symbol' ? undefined : v;
    if (Object.isFrozen(v)) return v;
    if (typeof v.toJSON === 'function') return PM.clone(v);
    if (Array.isArray(v)) return v.map((x) => { const y = cloneShared(x); return y === undefined ? null : y; });
    const o = {};
    for (const k of Object.keys(v)) { const y = cloneShared(v[k]); if (y !== undefined) o[k] = y; }
    return o;
  };
  /* Reutiliza las partes de prev (inmutable) que son iguales en next (datos JSON): las filas que no cambiaron
     conservan su identidad aunque quien guarda haya clonado todo el documento. Las filas con id se emparejan por id. */
  PM.reconcile = function reconcile(prev, next) {
    if (prev === next) return prev;
    if (next === null || typeof next !== 'object' || prev === null || typeof prev !== 'object' || Array.isArray(prev) !== Array.isArray(next)) return next;
    if (Array.isArray(next)) {
      let byId = null;
      let same = prev.length === next.length; const out = new Array(next.length);
      for (let i = 0; i < next.length; i++) {
        const n = next[i]; let p = prev[i];
        if (n && typeof n === 'object' && n.id != null && !(p && p.id === n.id)) {
          if (!byId) { byId = new Map(); for (const x of prev) if (x && typeof x === 'object' && x.id != null) byId.set(x.id, x); }
          p = byId.get(n.id);
        }
        out[i] = reconcile(p, n); if (out[i] !== prev[i]) same = false;
      }
      return same ? prev : out;
    }
    const keys = Object.keys(next);
    let same = keys.length === Object.keys(prev).length; const out = {};
    for (const k of keys) { out[k] = reconcile(prev[k], next[k]); if (out[k] !== prev[k]) same = false; }
    return same ? prev : out;
  };
  PM.deepFreeze = function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };
  PM.moveItem = (arr, from, to) => { const a = [...arr]; if (to < 0 || to >= a.length) return a; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; };

  /* ------------------------------------------------------------------ formato */
  const nfCache = {};
  const nf = (min, max) => (nfCache[min + ':' + max] = nfCache[min + ':' + max] || new Intl.NumberFormat('es-CO', { minimumFractionDigits: min, maximumFractionDigits: max }));
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  PM.CURRENCIES = { COP: { symbol: '$', decimals: 0 }, USD: { symbol: 'US$', decimals: 2 }, EUR: { symbol: '€', decimals: 2 } };
  const minus = (t) => (t.charAt(0) !== '-' ? t : /^-[0.,]*$/.test(t) ? t.slice(1) : '\u2212' + t.slice(1));
  const isNum = (v) => v !== null && v !== undefined && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v));
  PM.isNum = isNum;
  PM.fmt = {
    /* el signo menos es U+2212 (igual que money/moneyShort) */
    num(n, d = 0) { if (n === null || n === undefined || n === '' || !Number.isFinite(Number(n))) return '—'; return minus(nf(0, d).format(Number(n))); },
    fixed(n, d = 2) { if (!isNum(n)) return '—'; return minus(nf(d, d).format(Number(n))); },
    money(n, cur = 'COP') {
      if (!isNum(n)) return '—';
      const c = PM.CURRENCIES[cur] || PM.CURRENCIES.COP; const v = Number(n);
      return (v < 0 ? '−' : '') + c.symbol + ' ' + nf(0, c.decimals).format(Math.abs(v));
    },
    /* valores grandes en millones: "$ 480,5 M" (M = millones) */
    moneyShort(n, cur = 'COP') {
      if (!isNum(n)) return '—';
      const c = PM.CURRENCIES[cur] || PM.CURRENCIES.COP; const v = Number(n), a = Math.abs(v), s = v < 0 ? '−' : '';
      if (a >= 1e6) return s + c.symbol + ' ' + nf(0, a >= 1e9 ? 0 : 1).format(a / 1e6) + ' M';
      if (a >= 1e4 && cur === 'COP') return s + c.symbol + ' ' + nf(0, 0).format(a / 1e3) + ' mil';
      return s + c.symbol + ' ' + nf(0, c.decimals).format(a);
    },
    pct(x, d = 0) { if (!isNum(x)) return '—'; return nf(0, d).format(Number(x) * 100) + ' %'; },
    pct100(x, d = 0) { if (!isNum(x)) return '—'; return nf(0, d).format(Number(x)) + ' %'; },
    idx(x) { if (!isNum(x)) return '—'; return nf(2, 2).format(Number(x)); },
    date(iso, style = 'medium') {
      if (!PM.date.valid(iso)) return '—';
      const y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1, d = +iso.slice(8, 10);
      if (style === 'short') return pad2(d) + '/' + pad2(m + 1) + '/' + y;
      if (style === 'dm') return pad2(d) + ' ' + MONTHS[m];
      if (style === 'month') return MONTHS[m] + ' ' + y;
      if (style === 'monthLong') return MONTHS_LONG[m] + ' de ' + y;
      if (style === 'long') return d + ' de ' + MONTHS_LONG[m] + ' de ' + y;
      if (style === 'dow') return DOW[PM.date.dow(iso)] + ' ' + pad2(d) + ' ' + MONTHS[m];
      return pad2(d) + ' ' + MONTHS[m] + ' ' + y;
    },
    datetime(isoTs) { if (!isoTs) return '—'; const d = new Date(isoTs); if (isNaN(d)) return '—'; return pad2(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); },
    days(n) { if (!isNum(n)) return '—'; const v = Number(n); return nf(0, 1).format(v) + (Math.abs(v) === 1 ? ' día' : ' días'); },
  };
  PM.MONTHS = MONTHS; PM.MONTHS_LONG = MONTHS_LONG; PM.DOW = DOW;

  /* ------------------------------------------------------------------ fechas (ISO YYYY-MM-DD, aritmética UTC) */
  const DAY = 86400000;
  const D = (PM.date = {
    valid: (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))),
    toMs: (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)),
    fromMs: (ms) => new Date(ms).toISOString().slice(0, 10),
    add: (iso, n) => D.fromMs(D.toMs(iso) + Math.round(n) * DAY),
    diff: (a, b) => Math.round((D.toMs(b) - D.toMs(a)) / DAY),
    dow: (iso) => new Date(D.toMs(iso)).getUTCDay(),
    today: () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); },
    min: (...a) => a.filter(D.valid).sort()[0] || null,
    max: (...a) => a.filter(D.valid).sort().slice(-1)[0] || null,
    startOfWeek: (iso) => D.add(iso, -((D.dow(iso) + 6) % 7)),
    startOfMonth: (iso) => iso.slice(0, 8) + '01',
    addMonths: (iso, n) => { let y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return y + '-' + pad2(m + 1) + '-' + pad2(Math.min(+iso.slice(8, 10), last)); },
    endOfMonth: (iso) => { const y = +iso.slice(0, 4), m = +iso.slice(5, 7); return y + '-' + pad2(m) + '-' + pad2(new Date(Date.UTC(y, m, 0)).getUTCDate()); },
    easter(y) {
      const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
      const hh = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7, m = Math.floor((a + 11 * hh + 22 * l) / 451);
      const month = Math.floor((hh + l - 7 * m + 114) / 31), day = ((hh + l - 7 * m + 114) % 31) + 1;
      return y + '-' + pad2(month) + '-' + pad2(day);
    },
  });
  /* Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani"): los trasladables pasan al lunes siguiente. */
  const holidayCache = {};
  D.holidaysCO = function (y) {
    if (holidayCache[y]) return holidayCache[y];
    const nextMonday = (iso) => { const w = D.dow(iso); return w === 1 ? iso : D.add(iso, (8 - w) % 7); };
    const e = D.easter(y), f = (m, d) => y + '-' + pad2(m) + '-' + pad2(d);
    const list = [
      [f(1, 1), 'Año Nuevo'], [nextMonday(f(1, 6)), 'Día de los Reyes Magos'], [nextMonday(f(3, 19)), 'Día de San José'],
      [D.add(e, -3), 'Jueves Santo'], [D.add(e, -2), 'Viernes Santo'], [f(5, 1), 'Día del Trabajo'],
      [D.add(e, 43), 'Ascensión del Señor'], [D.add(e, 64), 'Corpus Christi'], [D.add(e, 71), 'Sagrado Corazón'],
      [nextMonday(f(6, 29)), 'San Pedro y San Pablo'], [f(7, 20), 'Día de la Independencia'], [f(8, 7), 'Batalla de Boyacá'],
      [nextMonday(f(8, 15)), 'La Asunción de la Virgen'], [nextMonday(f(10, 12)), 'Día de la Diversidad Étnica y Cultural'],
      [nextMonday(f(11, 1)), 'Todos los Santos'], [nextMonday(f(11, 11)), 'Independencia de Cartagena'],
      [f(12, 8), 'Inmaculada Concepción'], [f(12, 25), 'Navidad'],
    ].map(([date, name]) => ({ date, name })).sort((a, b) => (a.date < b.date ? -1 : 1));
    return (holidayCache[y] = list);
  };

  /* Calendario laboral: workweek 5 (L-V), 6 (L-S) o 7 (todos); festivos CO opcionales; extra = ['YYYY-MM-DD'] no laborables.
     Índices de días hábiles relativos al ancla (primer día hábil >= anchorIso). */
  PM.cal = {
    make(settings, anchorIso) {
      if (!settings || typeof settings !== 'object') settings = {};
      const ww = [5, 6, 7].includes(Number(settings.workweek)) ? Number(settings.workweek) : 5;
      const useCO = settings.holidaysCO !== false;
      const extra = new Set((Array.isArray(settings.extraHolidays) ? settings.extraHolidays : [settings.extraHolidays]).filter(D.valid));
      const hol = {};
      const isHoliday = (iso) => {
        if (extra.has(iso)) return true;
        if (!useCO) return false;
        const y = +iso.slice(0, 4);
        if (!hol[y]) hol[y] = new Set(D.holidaysCO(y).map((x) => x.date));
        return hol[y].has(iso);
      };
      const isWork = (iso) => { const w = D.dow(iso); const okDay = ww === 7 ? true : ww === 6 ? w !== 0 : w !== 0 && w !== 6; return okDay && !isHoliday(iso); };
      let a = D.valid(anchorIso) ? anchorIso : D.today();
      let guard = 0; while (!isWork(a) && guard++ < 400) a = D.add(a, 1);
      const anchor = a;
      const fwd = [anchor], bwd = [];
      const LIMIT = 15000;
      const extendFwd = (n) => { let d = fwd[fwd.length - 1]; while (fwd.length <= n && fwd.length < LIMIT) { d = D.add(d, 1); if (isWork(d)) fwd.push(d); } };
      const extendFwdTo = (iso) => { let d = fwd[fwd.length - 1]; while (d < iso && fwd.length < LIMIT) { d = D.add(d, 1); if (isWork(d)) fwd.push(d); } };
      const extendBwdTo = (iso) => { let d = bwd.length ? bwd[bwd.length - 1] : anchor; while (d >= iso && bwd.length < LIMIT) { d = D.add(d, -1); if (isWork(d)) bwd.push(d); if (d < iso) break; } };
      const cal = {
        settings: { workweek: ww, holidaysCO: useCO }, anchor, isWork, isHoliday,
        holidayName(iso) { if (!useCO) return extra.has(iso) ? 'No laborable' : null; const x = D.holidaysCO(+iso.slice(0, 4)).find((hh) => hh.date === iso); return x ? x.name : extra.has(iso) ? 'No laborable' : null; },
        dateOf(i) {
          i = Math.round(i);
          if (i >= 0) { extendFwd(i); return fwd[Math.min(i, fwd.length - 1)]; }
          const n = -i; let d = bwd.length ? bwd[bwd.length - 1] : anchor;
          while (bwd.length < n && bwd.length < LIMIT) { d = D.add(d, -1); if (isWork(d)) bwd.push(d); }
          return bwd[Math.min(n, bwd.length) - 1];
        },
        /* índice del primer día hábil >= iso */
        indexOf(iso) {
          if (!D.valid(iso)) return 0;
          if (iso >= anchor) {
            extendFwdTo(iso);
            let lo = 0, hi = fwd.length - 1;
            while (lo < hi) { const mid = (lo + hi) >> 1; if (fwd[mid] >= iso) hi = mid; else lo = mid + 1; }
            return fwd[lo] >= iso ? lo : fwd.length;
          }
          extendBwdTo(iso);
          let c = 0; for (const d of bwd) { if (d >= iso) c++; else break; }
          return -c;
        },
        /* días hábiles en [a, b] inclusive */
        countWork(a, b) { if (!D.valid(a) || !D.valid(b) || b < a) return 0; return cal.indexOf(D.add(b, 1)) - cal.indexOf(a); },
        addWork(iso, n) { return cal.dateOf(cal.indexOf(iso) + n); },
      };
      return cal;
    },
  };

  /* ------------------------------------------------------------------ estado de la app (observable mínimo) */
  const appListeners = new Set();
  let appState = { projectId: null, view: 'portafolio', params: {}, navOpen: false, mode: 'loading', canWrite: true, meId: null, isOwner: false, saving: 0, lastSaved: null, storageWarning: null, syncIssues: 0 };
  PM.getState = () => appState;
  PM.setState = (patch) => { appState = { ...appState, ...(typeof patch === 'function' ? patch(appState) : patch) }; appListeners.forEach((fn) => fn(appState)); };
  PM.subscribeState = (fn) => { appListeners.add(fn); return () => appListeners.delete(fn); };
  /* Se suscribe antes del pintado y vuelve a renderizar si el estado cambió entre el render y la suscripción
     (p. ej. PM.boot() resuelve el modo en una microtarea antes de que existan oyentes). */
  PM.useAppState = () => {
    const [, force] = useReducer((x) => x + 1, 0);
    const seen = useRef(appState); seen.current = appState;
    useLayoutEffect(() => { const un = PM.subscribeState(force); if (seen.current !== appState) force(); return un; }, []);
    return appState;
  };

  const UI_KEY = 'pmbok-gestor.ui';
  PM.prefs = {
    get(k, d) { try { const o = JSON.parse(localStorage.getItem(UI_KEY) || '{}'); return k in o ? o[k] : d; } catch (e) { return d; } },
    set(k, v) { try { const o = JSON.parse(localStorage.getItem(UI_KEY) || '{}'); o[k] = v; localStorage.setItem(UI_KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } },
  };

  /* ------------------------------------------------------------------ registros */
  PM.GROUPS = [
    { id: 'portafolio', label: 'Portafolio' },
    { id: 'proyecto', label: 'Proyecto' },
    { id: 'planificacion', label: 'Alcance, tiempo y recursos' },
    { id: 'costos', label: 'Costos y desempeño' },
    { id: 'analisis', label: 'Matrices y análisis' },
  ];
  PM.views = [];
  PM.registerView = (v) => { const i = PM.views.findIndex((x) => x.id === v.id); const full = { needsProject: true, order: 100, group: 'analisis', icon: 'file', ...v }; if (i >= 0) PM.views[i] = full; else PM.views.push(full); PM.views.sort((a, b) => a.order - b.order); };
  PM.getView = (id) => PM.views.find((v) => v.id === id);
  PM.templates = {};
  PM.templateList = [];
  PM.registerTemplates = (list) => { for (const t of list) { PM.templates[t.id] = t; const i = PM.templateList.findIndex((x) => x.id === t.id); if (i >= 0) PM.templateList[i] = t; else PM.templateList.push(t); } };
  PM.PROJECT_COLLECTIONS = [{ name: 'docs', nested: ['revs'] }, { name: 'tools', nested: [] }, { name: 'baselines', nested: [] }, { name: 'flows', nested: [] }];
  PM.registerProjectCollection = (name, nested = []) => { if (!PM.PROJECT_COLLECTIONS.find((c) => c.name === name)) PM.PROJECT_COLLECTIONS.push({ name, nested }); };
  PM.exampleBuilders = [];
  PM.registerExample = (fn) => PM.exampleBuilders.push(fn);

  PM.paths = {
    projects: () => 'projects',
    project: (pid) => 'projects/' + pid,
    docs: (pid) => 'projects/' + pid + '/docs',
    doc: (pid, docId) => 'projects/' + pid + '/docs/' + docId,
    revs: (pid, docId) => 'projects/' + pid + '/docs/' + docId + '/revs',
    rev: (pid, docId, revId) => 'projects/' + pid + '/docs/' + docId + '/revs/' + revId,
    tools: (pid) => 'projects/' + pid + '/tools',
    tool: (pid, toolId) => 'projects/' + pid + '/tools/' + toolId,
    baselines: (pid) => 'projects/' + pid + '/baselines',
    baseline: (pid, bid) => 'projects/' + pid + '/baselines/' + bid,
    flows: (pid) => 'projects/' + pid + '/flows',
    flow: (pid, fid) => 'projects/' + pid + '/flows/' + fid,
  };

  /* ------------------------------------------------------------------ capacidades del visor */
  const use = (name) => { try { return window.claude && typeof window.claude.use === 'function' ? window.claude.use(name).catch(() => null) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };
  PM.caps = { db: use('db'), user: use('user'), downloads: use('downloads'), sample: use('sample') };

  /* ------------------------------------------------------------------ almacenamiento */
  class DbStore {
    constructor(db) { this.db = db; this.kind = 'db'; }
    async get(path) { const s = await this.db.doc(path).get(); return s.exists ? s.data() : null; }
    set(path, data) { return this.db.doc(path).set(data); }
    update(path, patch) { return this.db.doc(path).update(patch); }
    delete(path) { return this.db.doc(path).delete(); }
    async list(col) { const q = await this.db.collection(col).get(); return q.docs.map((d) => ({ id: d.id, data: d.data() })); }
    subDoc(path, next, err) { return this.db.doc(path).onSnapshot((s) => next(s.exists ? s.data() : null), err); }
    subCol(path, next, err) { return this.db.collection(path).onSnapshot((q) => next(q.docs.map((d) => ({ id: d.id, data: d.data() }))), err); }
  }
  /* Navegador: todo el mapa en una clave de localStorage. Varias pestañas pueden escribir a la vez, así que se
     fusiona por documento: las rutas que esta pestaña cambió desde su último guardado (dirty) se aplican sobre
     lo que otras pestañas hayan guardado, tanto al recibir el evento 'storage' como justo antes de escribir. */
  class LocalStore {
    constructor() {
      this.kind = 'local'; this.key = 'pmbok-gestor.data.v1'; this.map = {}; this.docL = new Map(); this.colL = new Map(); this.persistOk = true;
      this.dirty = new Set(); this.lastRaw = null;
      try { const raw = localStorage.getItem(this.key); this.lastRaw = raw; this.map = raw ? JSON.parse(raw) : {}; if (!this.map || typeof this.map !== 'object' || Array.isArray(this.map)) this.map = {}; } catch (e) { this.persistOk = false; this.map = {}; }
      this.persist = PM.debounce(() => this.persistNow(), 250);
      try {
        window.addEventListener('storage', (ev) => {
          if (ev.key !== this.key || ev.newValue === null) return;
          let incoming; try { incoming = JSON.parse(ev.newValue); } catch (e) { return; }
          if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return;
          this.lastRaw = ev.newValue;
          this.adopt(incoming);
        });
      } catch (e) { /* ignore */ }
      window.addEventListener('pagehide', () => this.persistNow());
    }
    /* Toma el mapa de otra pestaña, conserva los cambios propios aún no guardados y avisa solo las rutas que cambiaron. */
    adopt(incoming) {
      const next = { ...incoming };
      for (const p of this.dirty) { if (this.map[p] === undefined) delete next[p]; else next[p] = this.map[p]; }
      const changed = [];
      for (const k of new Set([...Object.keys(this.map), ...Object.keys(next)])) {
        if (this.dirty.has(k)) continue;
        const a = this.map[k], b = next[k];
        if (a === b) continue;
        if (a === undefined || b === undefined || JSON.stringify(a) !== JSON.stringify(b)) changed.push(k);
      }
      this.map = next;
      const cols = new Set();
      for (const p of changed) { this.notifyDoc(p); cols.add(p.slice(0, p.lastIndexOf('/'))); }
      cols.forEach((c) => this.notifyCol(c));
    }
    persistNow() {
      if (!this.persistOk) return;
      this.persist.cancel();
      try {
        /* si otra pestaña guardó desde nuestra última lectura, fusiona antes de escribir para no pisar sus cambios */
        const raw = localStorage.getItem(this.key);
        if (raw !== this.lastRaw && raw) { try { const cur = JSON.parse(raw); if (cur && typeof cur === 'object' && !Array.isArray(cur)) this.adopt(cur); } catch (e) { /* contenido ilegible: se reemplaza */ } }
      } catch (e) { /* lectura bloqueada */ }
      try { const out = JSON.stringify(this.map); localStorage.setItem(this.key, out); this.lastRaw = out; this.dirty.clear(); }
      catch (e) { PM.setState({ storageWarning: 'El navegador no permitió guardar (espacio lleno o almacenamiento bloqueado). Exporta tus proyectos para no perder cambios.' }); }
    }
    touchPath(path) { this.dirty.add(path); this.persist(); this.notify(path); }
    snap(path) { const v = this.map[path]; return v === undefined ? null : PM.deepFreeze(PM.clone(v)); }
    async get(path) { return this.snap(path); }
    async set(path, data) { if (!data || typeof data !== 'object' || Array.isArray(data)) throw { code: 'invalid_argument', message: 'body must be an object' }; this.map[path] = PM.clone(data); this.touchPath(path); }
    async update(path, patch) {
      if (this.map[path] === undefined) throw { code: 'invalid_argument', message: 'document does not exist' };
      const merge = (t, s) => { for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], s[k]); else t[k] = PM.clone(s[k]); } };
      /* copia antes de mezclar: el objeto anterior pudo compartirse con el mapa de otra pestaña (adopt) */
      const target = PM.clone(this.map[path]); merge(target, patch); this.map[path] = target; this.touchPath(path);
    }
    async delete(path) { delete this.map[path]; this.touchPath(path); }
    listSync(col) { const pre = col + '/'; return Object.keys(this.map).filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes('/')).sort().map((k) => ({ id: k.slice(pre.length), data: this.snap(k) })); }
    async list(col) { return this.listSync(col); }
    notify(path) { this.notifyDoc(path); const col = path.slice(0, path.lastIndexOf('/')); this.notifyCol(col); }
    notifyDoc(path) { const ls = this.docL.get(path); if (ls) { const v = this.snap(path); ls.forEach((fn) => fn(v)); } }
    notifyCol(col) { const ls = this.colL.get(col); if (ls) { const v = this.listSync(col); ls.forEach((fn) => fn(v)); } }
    subDoc(path, next) { if (!this.docL.has(path)) this.docL.set(path, new Set()); this.docL.get(path).add(next); setTimeout(() => next(this.snap(path)), 0); return () => this.docL.get(path)?.delete(next); }
    subCol(col, next) { if (!this.colL.has(col)) this.colL.set(col, new Set()); this.colL.get(col).add(next); setTimeout(() => next(this.listSync(col)), 0); return () => this.colL.get(col)?.delete(next); }
  }

  /* Fachada: espera a que se resuelva el modo y serializa escrituras por documento. */
  let resolveReady;
  PM.storeReady = new Promise((r) => (resolveReady = r));
  let backend = null;
  const writeChains = new Map();
  /* La limpieza usa then(ok, error) para no dejar una promesa derivada rechazada sin manejar. */
  const chain = (path, fn) => { const prev = writeChains.get(path) || Promise.resolve(); const p = prev.catch(() => {}).then(fn); writeChains.set(path, p); const clean = () => { if (writeChains.get(path) === p) writeChains.delete(path); }; p.then(clean, clean); return p; };
  const track = async (p) => { PM.setState((s) => ({ saving: s.saving + 1 })); try { const r = await p; PM.setState((s) => ({ saving: s.saving - 1, lastSaved: Date.now() })); return r; } catch (e) { PM.setState((s) => ({ saving: s.saving - 1 })); throw e; } };
  /* Reintenta una vez si la plataforma no está disponible y con espera creciente si se excede la cuota de llamadas. */
  const withRetry = async (fn) => {
    let busyTries = 0, unavailTries = 0;
    for (;;) {
      try { return await fn(); }
      catch (e) {
        const code = e && e.code;
        if (code === 'unavailable' && unavailTries++ < 1) { await new Promise((r) => setTimeout(r, 800 + Math.random() * 900)); continue; }
        if (code === 'resource_exhausted' && busyTries++ < 4) { await new Promise((r) => setTimeout(r, 1200 * Math.pow(2, busyTries - 1) + Math.random() * 400)); continue; }
        throw e;
      }
    }
  };
  /* Suscribe cuando el almacén está listo; un fallo síncrono (ruta inválida) llega al callback de error. */
  const subscribeWith = (method, path, next, err) => {
    let un = null, dead = false;
    const onErr = err || ((e) => console.warn(method, path, e));
    PM.storeReady.then(() => {
      if (dead) return;
      try { un = backend[method](path, next, onErr); }
      catch (e) { setTimeout(() => { if (!dead) onErr({ code: 'invalid_argument', message: String((e && e.message) || e) }); }, 0); }
    });
    return () => { dead = true; if (un) { const u = un; un = null; u(); } };
  };
  PM.store = {
    get kind() { return backend ? backend.kind : 'loading'; },
    async get(path) { await PM.storeReady; return backend.get(path); },
    async list(col) { await PM.storeReady; return backend.list(col); },
    /* opts.quiet: no muestra el aviso de error (quien llama decide); la promesa igual se rechaza. */
    set(path, data, opts) { return track(chain(path, async () => { await PM.storeReady; return withRetry(() => backend.set(path, data)); })).catch((e) => { if (!(opts && opts.quiet)) PM.reportWriteError(e); throw e; }); },
    update(path, patch, opts) { return track(chain(path, async () => { await PM.storeReady; return withRetry(() => backend.update(path, patch)); })).catch((e) => { if (!(opts && opts.quiet)) PM.reportWriteError(e); throw e; }); },
    delete(path, opts) { return track(chain(path, async () => { await PM.storeReady; return withRetry(() => backend.delete(path)); })).catch((e) => { if (!(opts && opts.quiet)) PM.reportWriteError(e); throw e; }); },
    subDoc(path, next, err) { return subscribeWith('subDoc', path, next, err); },
    subCol(path, next, err) { return subscribeWith('subCol', path, next, err); },
  };
  PM.reportWriteError = (e) => {
    const code = e && e.code;
    if (code === 'invalid_argument' && PM.getState().mode === 'db' && PM._writeUnknown) { PM.setState({ canWrite: false }); PM.toast('No tienes permiso para modificar los datos de este artefacto. Quedó en modo de solo lectura.', { tone: 'crit' }); return; }
    const msg = code === 'quota_exceeded' ? 'Se llenó el almacenamiento del artefacto. Elimina proyectos o registros que ya no uses.'
      : code === 'invalid_argument' ? 'No se pudo guardar: el registro es demasiado grande o tiene un formato no válido.'
      : code === 'revoked' ? 'Se retiró el acceso a los datos. Recarga la página.'
      : code === 'resource_exhausted' ? 'Demasiadas escrituras seguidas. Espera unos segundos y vuelve a intentarlo.'
      : 'No se pudo guardar el cambio. Revisa tu conexión y vuelve a intentarlo.';
    if (code === 'revoked') PM.setState({ canWrite: false });
    PM.toast(msg, { tone: 'crit' });
  };

  PM.boot = async function () {
    const db = await PM.caps.db;
    if (db) {
      backend = new DbStore(db);
      PM.setState({ mode: 'db' });
      const user = await PM.caps.user;
      if (user) {
        try {
          const [id, owner, can] = await Promise.all([user.id(), user.isOwner(), user.can('data.write')]);
          PM._writeUnknown = can === null;
          PM.setState({ meId: id, isOwner: owner, canWrite: can !== false });
        } catch (e) { PM._writeUnknown = true; }
      } else PM._writeUnknown = true;
    } else {
      backend = new LocalStore();
      PM.setState({ mode: 'local', canWrite: true, storageWarning: backend.persistOk ? null : 'Este navegador bloquea el almacenamiento local: los cambios se perderán al cerrar la página. Exporta tus proyectos antes de salir.' });
    }
    resolveReady();
  };

  /* ------------------------------------------------------------------ sincronización compartida (un solo listener por ruta)
     Un error de la suscripción NO significa "el documento no existe": se conserva el estado de carga (o los datos
     ya leídos), se reintenta con espera creciente y no se escribe sobre un documento que nunca se pudo leer.
     Las sincronizaciones sin oyentes se liberan a los 15 s, o antes si hay muchas suscripciones activas
     (la plataforma admite 64 por vista). */
  const docSyncs = new Map();
  const colSyncs = new Map();
  const NO_RETRY = ['invalid_argument', 'transform_error', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed'];
  const ACTIVE_LIMIT = 36;
  const syncIssues = new Set();
  const setIssue = (s, on) => { const had = syncIssues.has(s); if (on) syncIssues.add(s); else syncIssues.delete(s); if (had !== !!on) PM.setState({ syncIssues: syncIssues.size }); };
  let revokedShown = false;
  /* Libera primero las sincronizaciones inactivas más antiguas cuando hay demasiadas suscripciones abiertas. */
  const trimIdle = () => {
    const all = [...docSyncs.values(), ...colSyncs.values()];
    let active = all.filter((s) => s.unsub).length;
    if (active <= ACTIVE_LIMIT) return;
    const now = Date.now();
    const idle = all.filter((s) => s.unsub && !s.listeners.size && s.canRelease() && now - s.idleSince > 1500).sort((a, b) => a.idleSince - b.idleSince);
    for (const s of idle) { if (active <= ACTIVE_LIMIT) break; s.stop(); active--; }
  };
  class SyncBase {
    constructor(path, registry) { this.path = path; this.registry = registry; this.loading = true; this.loaded = false; this.error = null; this.fails = 0; this.listeners = new Set(); this.unsub = null; this.release = null; this.retryT = null; this.token = 0; this.version = 0; this.idleSince = 0; }
    attach(fn) {
      this.listeners.add(fn); clearTimeout(this.release); this.release = null;
      if (!this.registry.has(this.path)) this.registry.set(this.path, this);
      if (!this.unsub && !this.retryT) this.start();
      trimIdle();
      return () => {
        this.listeners.delete(fn);
        if (!this.listeners.size) { this.idleSince = Date.now(); clearTimeout(this.release); this.release = setTimeout(() => this.stop(), 15000); setTimeout(trimIdle, 1600); }
      };
    }
    start() {
      clearTimeout(this.retryT); this.retryT = null;
      const token = ++this.token;
      this.unsub = this.subscribe(
        (v) => { if (token !== this.token) return; this.fails = 0; if (this.error) { this.error = null; setIssue(this, false); } this.receive(v); },
        (e) => { if (token === this.token) this.fail(e); });
    }
    fail(e) {
      const err = e && typeof e === 'object' ? e : { code: 'unavailable', message: String(e) };
      console.warn('Suscripción con error:', this.path, err.code || '', err.message || '');
      this.error = err; this.token++;
      if (this.unsub) { const u = this.unsub; this.unsub = null; try { u(); } catch (x) { /* ya cerrada */ } }
      if (err.code === 'revoked') { PM.setState({ canWrite: false }); if (!revokedShown) { revokedShown = true; PM.toast('Se retiró el acceso a los datos. Recarga la página.', { tone: 'crit' }); } }
      if (!NO_RETRY.includes(err.code)) {
        this.fails++;
        const wait = Math.min(30000, 1000 * Math.pow(2, Math.min(this.fails - 1, 5))) + Math.random() * 600;
        this.retryT = setTimeout(() => { this.retryT = null; if (this.listeners.size) this.start(); else this.stop(); }, wait);
      } else if (!this.loaded) this.loading = false;
      setIssue(this, true);
      this.onFail();
      this.emit();
    }
    onFail() { /* DocSync: descarta un guardado que esperaba la primera lectura */ }
    canRelease() { return true; }
    stop() {
      if (this.listeners.size) return;
      if (!this.canRelease()) { clearTimeout(this.release); this.release = setTimeout(() => this.stop(), 3000); return; }
      clearTimeout(this.release); clearTimeout(this.retryT); this.release = null; this.retryT = null; this.token++;
      if (this.unsub) { const u = this.unsub; this.unsub = null; u(); }
      setIssue(this, false);
      if (this.registry.get(this.path) === this) this.registry.delete(this.path);
    }
    emit() { this.version++; this.listeners.forEach((fn) => fn()); }
  }
  let blockedToastAt = 0;
  const blockedToast = () => { if (Date.now() - blockedToastAt > 4000) { blockedToastAt = Date.now(); PM.toast('No se pudo leer este registro, así que el cambio no se guardó para no sobrescribir datos. Espera a que se recupere la conexión y vuelve a intentarlo.', { tone: 'crit' }); } };
  class DocSync extends SyncBase {
    constructor(path) { super(path, docSyncs); this.value = null; this.exists = false; this.dirty = false; this.inflight = false; this.timer = null; this.again = false; this.early = null; }
    subscribe(next, err) { return PM.store.subDoc(this.path, next, err); }
    receive(data) {
      const first = !this.loaded; this.loaded = true;
      if (first && this.early) {
        /* hubo un guardado antes de la primera lectura: se aplica solo si el documento no existía */
        const early = this.early; this.early = null;
        if (data == null) { this.set(early.value, early.immediate).then(early.resolve, early.resolve); return; }
        early.resolve();
        PM.toast('Se cargó la versión guardada de este registro. Vuelve a aplicar tu último cambio.');
      }
      if (this.dirty || this.inflight) return;
      /* se conserva la identidad de lo que no cambió; el eco de nuestra propia escritura no vuelve a dibujar nada */
      const next = data != null && this.value != null ? PM.deepFreeze(PM.reconcile(this.value, data)) : data;
      if (!first && this.exists && next != null && next === this.value && !this.loading) return;
      this.value = next; this.exists = data != null; this.loading = false; this.emit();
    }
    canRelease() { return !this.dirty && !this.inflight && !this.early; }
    onFail() { if (this.early && !this.loaded) { const e = this.early; this.early = null; e.resolve(); blockedToast(); } }
    set(value, immediate) {
      if (!this.loaded) {
        if (this.error) { blockedToast(); return Promise.resolve(); }
        /* aún no llega la primera lectura: el guardado espera a saber si el documento ya existe */
        if (!this.unsub && !this.retryT) { this.start(); if (!this.listeners.size) { clearTimeout(this.release); this.release = setTimeout(() => this.stop(), 15000); } }
        return new Promise((resolve) => { const prev = this.early; if (prev) prev.resolve(); this.early = { value: PM.deepFreeze(PM.clone(value)), immediate: immediate || (prev && prev.immediate), resolve }; });
      }
      this.value = PM.deepFreeze(PM.reconcile(this.value, PM.cloneShared(value))); this.exists = true; this.loading = false; this.dirty = true; this.emit(); clearTimeout(this.timer);
      if (immediate) return this.flush();
      this.timer = setTimeout(() => this.flush(), 650); return Promise.resolve();
    }
    async flush() {
      clearTimeout(this.timer);
      if (!this.dirty) return;
      if (this.inflight) { this.again = true; return; }
      this.inflight = true; this.dirty = false;
      try { await PM.store.set(this.path, PM.clone(this.value)); } catch (e) { /* ya notificado */ }
      finally { this.inflight = false; if (this.dirty || this.again) { this.again = false; this.flush(); } }
    }
  }
  const getDocSync = (path) => { let s = docSyncs.get(path); if (!s) { s = new DocSync(path); docSyncs.set(path, s); } return s; };
  PM.flushAll = () => Promise.all([...docSyncs.values()].map((s) => s.flush()));
  /* Descarta un guardado pendiente (antes de eliminar un documento). */
  PM.discardPending = (path) => { const s = docSyncs.get(path); if (s) { clearTimeout(s.timer); s.dirty = false; s.again = false; if (s.early) { const e = s.early; s.early = null; e.resolve(); } } };
  /* Moneda del proyecto actual (para formatos fuera de componentes). */
  PM.currentCurrency = () => { const pid = PM.getState().projectId; const s = pid && docSyncs.get(PM.paths.project(pid)); return (s && s.value && s.value.currency) || 'COP'; };
  window.addEventListener('pagehide', () => PM.flushAll());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') PM.flushAll(); });

  class ColSync extends SyncBase {
    constructor(path) { super(path, colSyncs); this.docs = []; }
    subscribe(next, err) { return PM.store.subCol(this.path, next, err); }
    receive(docs) { this.docs = docs; this.loading = false; this.loaded = true; this.emit(); }
  }
  const getColSync = (path) => { let s = colSyncs.get(path); if (!s) { s = new ColSync(path); colSyncs.set(path, s); } return s; };
  /* Diagnóstico (pruebas): suscripciones abiertas y con error. */
  PM.syncStats = () => ({ docs: docSyncs.size, cols: colSyncs.size, active: [...docSyncs.values(), ...colSyncs.values()].filter((s) => s.unsub).length, issues: syncIssues.size });

  /* Adjunta el componente a una sincronización; si llegaron datos entre el render y la suscripción, vuelve a renderizar. */
  const useSyncAttach = (sync) => {
    const [, force] = useReducer((x) => x + 1, 0);
    const ver = useRef(0); ver.current = sync ? sync.version : 0;
    useEffect(() => { if (!sync) return undefined; const un = sync.attach(force); if (sync.version !== ver.current) force(); return un; }, [sync]);
  };
  /* Hook de documento. data es inmutable (congelado): clonar antes de editar. save() escribe con antirrebote; saveNow() de inmediato.
     error: último error de la suscripción (se reintenta sola); mientras no se haya leído el documento, loading sigue en true. */
  PM.useDoc = function (path) {
    const sync = useMemo(() => (path ? getDocSync(path) : null), [path]);
    useSyncAttach(sync);
    const save = useCallback((v) => (sync ? sync.set(v, false) : Promise.resolve()), [sync]);
    const saveNow = useCallback((v) => (sync ? sync.set(v, true) : Promise.resolve()), [sync]);
    if (!sync) return { data: null, exists: false, loading: false, error: null, save, saveNow };
    return { data: sync.value, exists: sync.exists, loading: sync.loading, error: sync.error, save, saveNow };
  };
  /* Hook de colección: docs = [{id, data}] ordenados por id. */
  PM.useCollection = function (path) {
    const sync = useMemo(() => (path ? getColSync(path) : null), [path]);
    useSyncAttach(sync);
    if (!sync) return { docs: [], loading: false, error: null };
    return { docs: sync.docs, loading: sync.loading, error: sync.error };
  };
  PM.useProjects = function () {
    const { docs, loading } = PM.useCollection('projects');
    const projects = useMemo(() => docs.filter((d) => d.data).map((d) => ({ id: d.id, ...d.data })).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))), [docs]);
    return { projects, loading };
  };
  PM.useCurrentProject = function () {
    const st = PM.useAppState();
    const { data, loading, exists } = PM.useDoc(st.projectId ? PM.paths.project(st.projectId) : null);
    const project = useMemo(() => (st.projectId && exists && data ? { id: st.projectId, ...data } : null), [st.projectId, data, exists]);
    return { project, loading: !!st.projectId && loading };
  };
  /* Datos de una herramienta del proyecto actual: [data, save, {loading, exists, saveNow}] */
  PM.useToolData = function (toolId, defaultValue) {
    const st = PM.useAppState();
    const r = PM.useDoc(st.projectId ? PM.paths.tool(st.projectId, toolId) : null);
    const norm = useMemo(() => (r.exists && r.data ? PM.normalizeTool(toolId, r.data) : null), [toolId, r.exists, r.data]);
    const data = norm || defaultValue;
    const pid = st.projectId;
    const save = useCallback((v) => { PM.touchProject && PM.touchProject(pid); return r.save(v); }, [r.save, pid]);
    const saveNow = useCallback((v) => { PM.touchProject && PM.touchProject(pid); return r.saveNow(v); }, [r.saveNow, pid]);
    return [data, save, { loading: r.loading, exists: r.exists, error: r.error, saveNow }];
  };

  /* Forma esperada de los documentos de herramientas. Los datos importados o editados a mano pueden traer un
     objeto donde va un arreglo (o al revés); PM.normalizeTool lo corrige sin tocar lo que ya está bien
     (devuelve el mismo objeto si no hay nada que corregir). */
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const normArr = (v, item) => {
    if (v === undefined || v === null) return v;
    if (!Array.isArray(v)) return [];
    let changed = false; const out = [];
    for (const x of v) { const y = item(x); if (y === undefined) { changed = true; continue; } if (y !== x) changed = true; out.push(y); }
    return changed ? out : v;
  };
  const normObj = (v, shape, fill) => {
    const base = isObj(v) ? v : {};
    let out = base;
    for (const k of Object.keys(shape)) {
      const cur = base[k];
      if (cur === undefined && !fill) continue;
      const sh = shape[k];
      let nv;
      if (typeof sh === 'function') nv = sh(cur);
      else if (Array.isArray(sh)) { nv = normArr(cur, (x) => (isObj(x) ? normObj(x, sh[0], false) : undefined)); if (nv == null && fill) nv = []; }
      else nv = normObj(cur, sh, false);
      if (nv !== cur) { if (out === base) out = { ...base }; out[k] = nv; }
    }
    return out;
  };
  const strItems = (v) => (typeof v === 'string' ? (PM.date.valid(v) ? [v] : []) : normArr(v, (x) => (typeof x === 'string' ? x : undefined)));
  const depItems = (v) => normArr(isObj(v) ? [v] : v, (x) => (isObj(x) ? x : typeof x === 'string' && x ? { id: x, type: 'FS', lag: 0 } : undefined));
  const resItems = (v) => normArr(typeof v === 'string' ? (v.trim() ? [v] : []) : isObj(v) ? [v] : v, (x) => (isObj(x) ? x : typeof x === 'string' && x.trim() ? { name: x.trim(), units: 1 } : undefined));
  PM.TOOL_SHAPES = {
    wbs: { nodes: [{}] },
    schedule: { settings: { extraHolidays: strItems, resourceLimits: {} }, tasks: [{ deps: depItems, resources: resItems }] },
    costs: { actuals: [{}], statusUpdates: [{ progress: {} }], reserves: {} },
    raci: { roles: [{}], rows: [{ cells: {} }] },
    quality: { ishikawa: [{ categories: [{ causes: [{ sub: [{}] }] }] }], pareto: [{ items: [{}] }], control: [{ points: [{}] }] },
  };
  PM.normalizeTool = (toolId, data) => {
    const shape = PM.TOOL_SHAPES[toolId];
    if (!shape) return data;
    const out = normObj(data, shape, true);
    return out === data ? data : PM.deepFreeze(out);
  };
  PM.useCanWrite = () => PM.useAppState().canWrite;
  /* Lectura puntual (no reactiva) de datos de herramienta, p. ej. para exportar. */
  PM.readTool = async (pid, toolId) => (await PM.store.get(PM.paths.tool(pid, toolId)));

  /* ------------------------------------------------------------------ navegación */
  PM.navigate = (view, params = {}) => {
    PM.setState({ view, params, navOpen: false });
    try { if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view); } catch (e) { /* ignore */ }
    PM.prefs.set('view', view);
    try { document.querySelector('.view-host')?.scrollTo?.(0, 0); window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  };
  PM.selectProject = (pid, view) => { PM.setState({ projectId: pid }); PM.prefs.set('projectId', pid); PM.navigate(view || (pid ? 'tablero' : 'portafolio')); };

  /* ------------------------------------------------------------------ iconos (24×24, trazo) */
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    portfolio: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    map: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    files: '<path d="M15 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V6z"/><path d="M15 2v4h4"/><path d="M3 7v13a2 2 0 0 0 2 2h9"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    wbs: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="9" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v8M5 16v-4h14v4"/>',
    gantt: '<path d="M3 3v18h18"/><rect x="6" y="5" width="8" height="3" rx="1"/><rect x="10" y="10.5" width="9" height="3" rx="1"/><rect x="8" y="16" width="6" height="3" rx="1"/>',
    network: '<rect x="2" y="9" width="5" height="6" rx="1"/><rect x="10" y="3" width="5" height="6" rx="1"/><rect x="10" y="15" width="5" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><path d="M7 11l3-4M7 13l3 4M15 6l3 4M15 18l3-4"/>',
    resources: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    scurve: '<path d="M3 3v18h18"/><path d="M6 17c4 0 5-1 7-5s3-6 7-6"/>',
    flow: '<rect x="8" y="2" width="8" height="5" rx="2.5"/><path d="M12 7v3"/><path d="m12 10 4 3-4 3-4-3z"/><path d="M12 16v2"/><rect x="8" y="18" width="8" height="4" rx="1"/>',
    raci: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/><path d="m12.5 14.5 2 2 3.5-4"/>',
    risk: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    stakeholders: '<path d="M3 3v18h18"/><circle cx="9" cy="14" r="2"/><circle cx="15" cy="8" r="2"/><circle cx="17" cy="15" r="1.5"/>',
    quality: '<path d="M2 12h15"/><path d="m17 12 5-3.5v7z"/><path d="M6 12 4 7M10 12 8 7M14 12l-2-5M6 12l-2 5M10 12l-2 5M14 12l-2 5"/>',
    pareto: '<path d="M3 3v18h18"/><rect x="6" y="9" width="3" height="9"/><rect x="11" y="12" width="3" height="6"/><rect x="16" y="15" width="3" height="3"/><path d="M6 7l6-2 7-1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>', 'chevron-right': '<path d="m9 6 6 6-6 6"/>', 'chevron-left': '<path d="m15 6-6 6 6 6"/>', 'chevron-up': '<path d="m6 15 6-6 6 6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
    milestone: '<path d="m12 3 9 9-9 9-9-9z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    sparkles: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>', 'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>', 'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>', 'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'zoom-in': '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>', 'zoom-out': '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3M7 21v-7h10v7"/>',
    filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
    device: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 10v10"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    indent: '<path d="M3 5h18M11 12h10M11 19h10"/><path d="m3 9 4 3-4 3z"/>',
    outdent: '<path d="M3 5h18M11 12h10M11 19h10"/><path d="M7 9l-4 3 4 3z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    money: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    compare: '<path d="M6 3v18M18 3v18"/><path d="M6 8h5M13 16h5"/><path d="m9 5 2 3-2 3M15 13l-2 3 2 3"/>',
    process: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><path d="M7.5 12h9"/><path d="m14 9 3 3-3 3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    checklist: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  };
  PM.ICONS = ICONS;
  PM.iconSvg = (name, size = 16, stroke = 1.75) => '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.file) + '</svg>';

  /* memo(Componente, sonIguales?) — Preact estándar no lo incluye en el paquete htm/standalone. */
  PM.memo = function (Comp, areEqual) {
    const eq = areEqual || ((a, b) => { const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (const k of ka) if (a[k] !== b[k]) return false; return true; });
    class Memo extends lib.Component { shouldComponentUpdate(next) { return !eq(this.props, next); } render() { return h(Comp, this.props); } }
    Memo.displayName = 'Memo(' + (Comp.displayName || Comp.name || 'Componente') + ')';
    return Memo;
  };

  /* ------------------------------------------------------------------ kit de UI */
  const cx = (...a) => a.filter(Boolean).join(' ');
  PM.cx = cx;
  const ui = (PM.ui = {});

  ui.Icon = function Icon({ name, size = 16, stroke = 1.75, title, class: cls, style }) {
    return html`<svg class=${cx('icon', cls)} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden=${title ? undefined : 'true'} role=${title ? 'img' : undefined} style=${style} dangerouslySetInnerHTML=${{ __html: (title ? '<title>' + PM.escapeHtml(title) + '</title>' : '') + (ICONS[name] || ICONS.file) }}></svg>`;
  };
  ui.Button = function Button({ variant, size, icon, iconRight, children, class: cls, type = 'button', ...rest }) {
    const iconOnly = !children && icon;
    return html`<button type=${type} class=${cx('btn', variant && 'btn-' + variant, size === 'sm' && 'btn-sm', iconOnly && 'btn-icon', cls)} ...${rest}>
      ${icon ? html`<${ui.Icon} name=${icon} size=${size === 'sm' ? 14 : 16} />` : null}${children}${iconRight ? html`<${ui.Icon} name=${iconRight} size=${size === 'sm' ? 14 : 16} />` : null}
    </button>`;
  };
  ui.IconButton = function IconButton({ icon, label, size, variant = 'ghost', ...rest }) {
    return html`<${ui.Button} variant=${variant} size=${size} icon=${icon} aria-label=${label} title=${label} ...${rest} />`;
  };
  ui.Field = function Field({ label, hint, required, error, children, for: htmlFor, class: cls }) {
    return html`<div class=${cx('field', cls)}>
      ${label ? html`<label class="field-label" for=${htmlFor}>${label}${required ? html`<span class="req" aria-hidden="true">*</span>` : null}</label>` : null}
      ${children}
      ${error ? html`<div class="field-error">${error}</div>` : hint ? html`<div class="field-hint">${hint}</div>` : null}
    </div>`;
  };
  ui.Input = function Input({ class: cls, onValue, ...rest }) {
    return html`<input class=${cx('input', cls)} onInput=${onValue ? (e) => onValue(e.currentTarget.value) : rest.onInput} ...${rest} />`;
  };
  /* Ajuste de altura de textareas por lotes: primero se liberan todas las alturas, luego se leen todas y al final
     se escriben (un solo cálculo de diseño por lote, no uno por textarea). */
  const autoSizeQueue = new Map();
  let autoSizeScheduled = false;
  const runAutoSize = () => {
    autoSizeScheduled = false;
    const items = [...autoSizeQueue].filter(([el]) => el.isConnected); autoSizeQueue.clear();
    if (!items.length) return;
    for (const [el] of items) el.style.height = 'auto';
    const hs = items.map(([el]) => el.scrollHeight);
    items.forEach(([el, max], i) => { el.style.height = hs[i] ? Math.min(hs[i] + 2, max) + 'px' : ''; });
  };
  PM.autoSize = (el, max = 640) => {
    if (!el) return;
    autoSizeQueue.set(el, max);
    if (!autoSizeScheduled) { autoSizeScheduled = true; (window.queueMicrotask || ((f) => Promise.resolve().then(f)))(runAutoSize); }
  };
  ui.TextArea = function TextArea({ class: cls, onValue, autosize = true, value, rows = 3, ...rest }) {
    const ref = useRef();
    useLayoutEffect(() => { if (autosize) PM.autoSize(ref.current, 640); }, [value, autosize]);
    return html`<textarea ref=${ref} rows=${rows} class=${cx('textarea', cls)} value=${value ?? ''} onInput=${onValue ? (e) => onValue(e.currentTarget.value) : rest.onInput} ...${rest}></textarea>`;
  };
  const normOptions = (options) => (options || []).map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }));
  ui.Select = function Select({ options, value, onValue, placeholder, class: cls, ...rest }) {
    const opts = normOptions(options);
    return html`<select class=${cx('select', cls)} value=${value ?? ''} onChange=${(e) => onValue && onValue(e.currentTarget.value)} ...${rest}>
      ${placeholder !== undefined ? html`<option value="">${placeholder}</option>` : null}
      ${opts.map((o) => html`<option value=${o.value} key=${o.value}>${o.label}</option>`)}
    </select>`;
  };
  /* Número con edición libre; onValue(number|null) */
  ui.NumberInput = function NumberInput({ value, onValue, class: cls, money, currency = 'COP', min, max, step, onFocus: extFocus, onBlur: extBlur, ...rest }) {
    const [focus, setFocus] = useState(false);
    const [draft, setDraft] = useState('');
    const shown = focus ? draft : value === null || value === undefined || value === '' ? '' : money ? PM.fmt.num(value, (PM.CURRENCIES[currency] || {}).decimals || 0) : PM.fmt.num(value, 4);
    return html`<input class=${cx('input num', cls)} inputmode="decimal" value=${shown}
      onFocus=${(e) => { setDraft(value === null || value === undefined ? '' : String(value).replace('.', ',')); setFocus(true); extFocus && extFocus(e); }}
      onBlur=${(e) => { setFocus(false); extBlur && extBlur(e); }}
      onInput=${(e) => { const raw = e.currentTarget.value; setDraft(raw); const clean = raw.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); if (clean === '' || clean === '-') return onValue && onValue(null); let n = parseFloat(clean); if (!Number.isFinite(n)) return; if (min !== undefined && n < min) n = min; if (max !== undefined && n > max) n = max; onValue && onValue(n); }}
      ...${rest} />`;
  };
  ui.DateInput = function DateInput({ value, onValue, class: cls, ...rest }) {
    return html`<input type="date" class=${cx('input', cls)} value=${value || ''} onInput=${(e) => onValue && onValue(e.currentTarget.value || null)} ...${rest} />`;
  };
  ui.Check = function Check({ checked, onValue, label, ...rest }) {
    return html`<label class="check"><input type="checkbox" checked=${!!checked} onChange=${(e) => onValue && onValue(e.currentTarget.checked)} ...${rest} />${label}</label>`;
  };
  ui.Search = function Search({ value, onValue, placeholder = 'Buscar…', ...rest }) {
    return html`<div class="search"><${ui.Icon} name="search" size=${15} /><input class="input" type="search" value=${value} placeholder=${placeholder} onInput=${(e) => onValue(e.currentTarget.value)} ...${rest} /></div>`;
  };
  ui.Tabs = function Tabs({ tabs, value, onChange, class: cls }) {
    return html`<div class=${cx('tabs', cls)} role="tablist">
      ${tabs.map((t) => html`<button key=${t.id} type="button" role="tab" class="tab" aria-selected=${value === t.id ? 'true' : 'false'} onClick=${() => onChange(t.id)}>
        ${t.icon ? html`<${ui.Icon} name=${t.icon} size=${15} />` : null}${t.label}${t.count !== undefined ? html`<span class="count">${t.count}</span>` : null}
      </button>`)}
    </div>`;
  };
  ui.Segmented = function Segmented({ options, value, onChange, size = 'sm', label, disabled }) {
    const opts = normOptions(options);
    return html`<div class="btn-group" role="group" aria-label=${label}>
      ${opts.map((o) => html`<button key=${o.value} type="button" class=${cx('btn', size === 'sm' && 'btn-sm')} aria-pressed=${String(value) === String(o.value) ? 'true' : 'false'} disabled=${disabled || o.disabled} onClick=${() => onChange(o.value)} title=${o.title}>${o.icon ? html`<${ui.Icon} name=${o.icon} size=${14} />` : null}${o.label}</button>`)}
    </div>`;
  };
  ui.Chip = function Chip({ tone, icon, children, class: cls, title }) {
    return html`<span class=${cx('chip', tone && 'chip-' + tone, cls)} title=${title}>${icon ? html`<${ui.Icon} name=${icon} size=${12} />` : null}${children}</span>`;
  };
  ui.Empty = function Empty({ icon = 'folder', title, children, actions }) {
    return html`<div class="empty"><${ui.Icon} name=${icon} size=${30} stroke=${1.5} /><div class="empty-title">${title}</div>${children ? html`<p>${children}</p>` : null}${actions ? html`<div class="row" style="justify-content:center">${actions}</div>` : null}</div>`;
  };
  ui.Card = function Card({ title, subtitle, actions, children, pad = true, class: cls, bodyClass }) {
    return html`<section class=${cx('card', cls)}>
      ${title || actions ? html`<div class="card-head"><div class="stack-sm" style="gap:2px"><h3 class="h3">${title}</h3>${subtitle ? html`<div class="xsmall faint">${subtitle}</div>` : null}</div>${actions ? html`<div class="row">${actions}</div>` : null}</div>` : null}
      <div class=${cx(pad && 'card-body', bodyClass)}>${children}</div>
    </section>`;
  };
  ui.PageHeader = function PageHeader({ eyebrow, title, description, actions }) {
    return html`<header class="page-head">
      <div class="page-head-text">${eyebrow ? html`<div class="eyebrow">${eyebrow}</div>` : null}<h1 class="page-title">${title}</h1>${description ? html`<p class="page-desc">${description}</p>` : null}</div>
      ${actions ? html`<div class="page-actions">${actions}</div>` : null}
    </header>`;
  };
  ui.Stat = function Stat({ label, value, sub, tone, title }) {
    const color = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : tone === 'crit' ? 'var(--crit)' : undefined;
    return html`<div class="stat" title=${title}><div class="stat-label">${label}</div><div class="stat-value" style=${color ? 'color:' + color : ''}>${value}</div>${sub ? html`<div class="stat-sub">${sub}</div>` : null}</div>`;
  };
  ui.Meter = function Meter({ value, tone, label }) {
    const v = PM.clamp(PM.num(value), 0, 1);
    const bg = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : tone === 'crit' ? 'var(--crit)' : 'var(--accent)';
    return html`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(v * 100)} aria-label=${label}><span style=${'width:' + v * 100 + '%;background:' + bg}></span></div>`;
  };
  ui.Spinner = function Spinner({ label = 'Cargando…' }) { return html`<div class="row faint small" role="status"><${ui.Icon} name="clock" size=${15} />${label}</div>`; };
  ui.Loading = function Loading({ rows = 3 }) { return html`<div class="stack" aria-busy="true">${Array.from({ length: rows }, (_, i) => html`<div key=${i} class="skeleton" style=${'height:' + (i === 0 ? 28 : 16) + 'px;width:' + (90 - i * 12) + '%'}></div>`)}</div>`; };

  /* Menú desplegable: items = [{label, icon, onClick, danger, disabled} | 'sep' | {heading}] */
  ui.Dropdown = function Dropdown({ label, icon = 'more', items, align = 'right', variant = 'ghost', size = 'sm', buttonLabel, disabled }) {
    const [pos, setPos] = useState(null);
    const ref = useRef(); const menuRef = useRef();
    const open = !!pos;
    const place = () => {
      const btn = ref.current && ref.current.querySelector('button'); if (!btn) return null;
      const r = btn.getBoundingClientRect(); const vw = window.innerWidth;
      const width = Math.min(Math.max(200, r.width), vw - 16);
      let left = align === 'right' ? r.right - width : r.left;
      left = Math.max(8, Math.min(left, vw - width - 8));
      return { left, top: r.bottom + 4, width, anchorTop: r.top };
    };
    useLayoutEffect(() => {
      if (!open || !menuRef.current) return;
      const m = menuRef.current.getBoundingClientRect(); const vh = window.innerHeight;
      if (m.bottom > vh - 8 && pos.anchorTop - m.height - 4 > 8 && !pos.flipped) setPos({ ...pos, top: pos.anchorTop - m.height - 4, flipped: true });
    }, [open, pos && pos.top]);
    useEffect(() => {
      if (!open) return;
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) setPos(null); };
      const onKey = (e) => { if (e.key === 'Escape') { setPos(null); ref.current?.querySelector('button')?.focus(); } };
      const onMove = (e) => { if (menuRef.current && e && e.target instanceof Node && menuRef.current.contains(e.target)) return; setPos(null); };
      document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey); window.addEventListener('resize', onMove); window.addEventListener('scroll', onMove, true);
      setTimeout(() => menuRef.current?.querySelector('.menu-item:not([disabled])')?.focus(), 0);
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); };
    }, [open]);
    const onMenuKey = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = [...menuRef.current.querySelectorAll('.menu-item:not([disabled])')]; const i = list.indexOf(document.activeElement);
      const n = list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]; n && n.focus();
    };
    return html`<div class="switcher" ref=${ref} style="display:inline-block">
      <${ui.Button} variant=${variant} size=${size} icon=${icon} disabled=${disabled} aria-haspopup="menu" aria-expanded=${open ? 'true' : 'false'} aria-label=${label} title=${label} onClick=${() => setPos(open ? null : place())}>${buttonLabel}</${ui.Button}>
      ${open ? html`<div class="menu" role="menu" ref=${menuRef} onKeyDown=${onMenuKey} style=${'position:fixed;left:' + pos.left + 'px;top:' + pos.top + 'px;width:' + pos.width + 'px;min-width:0;max-width:calc(100vw - 16px);z-index:85'}>
        ${items.filter(Boolean).map((it, i) => it === 'sep' ? html`<div class="menu-sep" key=${i}></div>` : it.heading ? html`<div class="menu-label" key=${i}>${it.heading}</div>` : html`<button key=${i} type="button" role="menuitem" class="menu-item" disabled=${it.disabled} style=${it.danger ? 'color:var(--crit)' : ''} onClick=${() => { setPos(null); it.onClick && it.onClick(); }}>${it.icon ? html`<${ui.Icon} name=${it.icon} size=${15} />` : null}${it.label}</button>`)}
      </div>` : null}
    </div>`;
  };

  /* Tabla editable genérica.
     columns: [{key, label, type:'text'|'textarea'|'number'|'money'|'date'|'select'|'calc'|'check'|'pct', options, width, calc(row, rows), format(v,row), placeholder, min, max, hint}] */
  const numType = (c) => c.type === 'money' || c.type === 'number' || c.type === 'pct' || (c.type === 'calc' && c.align !== 'left');
  /* Fila de DataTable. En edición se memoriza: una tecla en una celda vuelve a dibujar solo su fila (las columnas
     calculadas se evalúan en la tabla y llegan ya resueltas en calcOut). En solo lectura se dibuja siempre. */
  const sameRow = (a, b) => {
    if (!a.canEdit || !b.canEdit) return false;
    if (a.r !== b.r || a.i !== b.i || a.n !== b.n || a.colsSig !== b.colsSig || a.tone !== b.tone || a.clickable !== b.clickable || a.currency !== b.currency || a.reorder !== b.reorder) return false;
    if (a.calcOut.length !== b.calcOut.length) return false;
    for (let k = 0; k < a.calcOut.length; k++) if (a.calcOut[k] !== b.calcOut[k]) return false;
    return true;
  };
  PM.uiStats = { rowRenders: 0 }; /* diagnóstico (pruebas): filas de DataTable dibujadas */
  const DataRow = PM.memo(function DataRow({ r, i, n, canEdit, reorder, calcOut, tone, clickable, currency, api, ops }) {
    PM.uiStats.rowRenders++;
    const { columns, rows } = api.current;
    let ci = 0;
    const renderCell = (c) => {
      const v = r[c.key];
      const ctx = { currency, rows, index: i };
      if (c.type === 'calc') return html`<div class="cell-calc">${calcOut[ci++]}</div>`;
      if (!canEdit) {
        const shown = c.format ? c.format(v, r, ctx) : c.type === 'money' ? PM.fmt.money(v, currency) : c.type === 'number' ? PM.fmt.num(v, 2) : c.type === 'pct' ? (v === null || v === undefined || v === '' ? '—' : PM.fmt.pct100(v)) : c.type === 'date' ? PM.fmt.date(v) : c.type === 'check' ? (v ? 'Sí' : 'No') : c.type === 'select' ? (normOptions(c.options).find((o) => String(o.value) === String(v))?.label ?? v ?? '') : v ?? '';
        const wrap = c.type === 'text' || c.type === 'textarea' || !c.type;
        return html`<div class=${cx('cell-calc', (c.type === 'money' || c.type === 'number' || c.type === 'pct') && 'num')} style=${'color:var(--fg);white-space:' + (wrap ? 'pre-wrap' : 'nowrap')}>${shown === '' || shown === null || shown === undefined ? html`<span class="faint">—</span>` : shown}</div>`;
      }
      const label = c.label + ' — fila ' + (i + 1);
      const setV = (x) => ops.setCell(i, c.key, x);
      if (c.type === 'textarea') return html`<${CellTextArea} value=${v} label=${label} placeholder=${c.placeholder} onValue=${setV} />`;
      if (c.type === 'select') return html`<select class="cell-input" aria-label=${label} value=${v ?? ''} onChange=${(e) => setV(e.currentTarget.value)}><option value=""></option>${normOptions(c.options).map((o) => html`<option value=${o.value}>${o.label}</option>`)}</select>`;
      if (c.type === 'check') return html`<input type="checkbox" aria-label=${label} checked=${!!v} onChange=${(e) => setV(e.currentTarget.checked)} style="accent-color:var(--accent);width:16px;height:16px;margin:6px" />`;
      if (c.type === 'date') return html`<input type="date" class="cell-input" aria-label=${label} value=${v || ''} onInput=${(e) => setV(e.currentTarget.value || null)} />`;
      if (c.type === 'number' || c.type === 'money' || c.type === 'pct') return html`<${ui.NumberInput} class="cell-input" aria-label=${label} value=${v} money=${c.type === 'money'} currency=${currency} min=${c.min ?? (c.type === 'pct' ? 0 : undefined)} max=${c.max ?? (c.type === 'pct' ? 100 : undefined)} onValue=${setV} />`;
      return html`<input class="cell-input" aria-label=${label} value=${v ?? ''} placeholder=${c.placeholder} onInput=${(e) => setV(e.currentTarget.value)} />`;
    };
    return html`<tr class=${clickable ? 'clickable' : ''} style=${tone || ''} onClick=${clickable ? () => api.current.onRowClick && api.current.onRowClick(r, i) : undefined}>
      ${columns.map((c) => html`<td key=${c.key} class=${cx(numType(c) && 'num', 'col-' + (c.type || 'text'))}>${renderCell(c)}</td>`)}
      ${canEdit ? html`<td class="ctl"><div class="row" style="gap:0;flex-wrap:nowrap">
        ${reorder ? html`<${ui.IconButton} size="sm" icon="chevron-up" label="Subir fila" disabled=${i === 0} onClick=${() => ops.move(i, -1)} /><${ui.IconButton} size="sm" icon="chevron-down" label="Bajar fila" disabled=${i === n - 1} onClick=${() => ops.move(i, 1)} />` : null}
        <${ui.IconButton} size="sm" icon="trash" label="Eliminar fila" onClick=${() => ops.del(i)} />
      </div></td>` : null}
    </tr>`;
  }, sameRow);
  ui.DataTable = function DataTable({ columns, rows, onChange, readOnly, addLabel = 'Agregar fila', newRow, emptyText = 'Sin registros todavía.', currency = 'COP', reorder = true, onRowClick, rowTone, footer, compact }) {
    /* filas nulas o que no son objetos (datos importados dañados) se omiten; al editar se guardan ya depuradas */
    rows = Array.isArray(rows) ? (rows.every(isObj) ? rows : rows.filter(isObj)) : [];
    const canEdit = !readOnly && !!onChange;
    const api = useRef({}); api.current = { columns, rows, onChange, onRowClick };
    const ops = useMemo(() => ({
      setCell: (i, key, v) => { const { rows: rs, onChange: ch } = api.current; ch(rs.map((r, j) => (j === i ? { ...r, [key]: v } : r))); },
      del: (i) => { const { rows: rs, onChange: ch } = api.current; ch(rs.filter((_, j) => j !== i)); },
      move: (i, d) => { const { rows: rs, onChange: ch } = api.current; ch(PM.moveItem(rs, i, i + d)); },
    }), []);
    const add = () => { const base = newRow ? newRow(rows) : {}; onChange([...rows, { id: PM.uid('r'), ...base }]); };
    const colsSig = JSON.stringify(columns.map((c) => [c.key, c.type, c.label, c.placeholder, c.min, c.max, c.align, c.options]));
    const calcCols = columns.filter((c) => c.type === 'calc');
    return html`<div class="stack-sm">
      <div class="table-wrap">
        <table class=${cx('table', canEdit && 'table-edit', compact && 'table-tight')}>
          <thead><tr>${columns.map((c) => html`<th key=${c.key} class=${cx(numType(c) && 'num', 'col-' + (c.type || 'text'))} style=${c.width ? 'min-width:' + c.width + (typeof c.width === 'number' ? 'px' : '') : ''} title=${c.hint}>${c.label}</th>`)}${canEdit ? html`<th class="ctl"><span class="sr-only">Acciones</span></th>` : null}</tr></thead>
          <tbody>
            ${rows.length === 0 ? html`<tr><td colspan=${columns.length + (canEdit ? 1 : 0)} class="faint" style="padding:14px 12px">${emptyText}</td></tr>` : null}
            ${rows.map((r, i) => {
              const ctx = { currency, rows, index: i };
              const calcOut = calcCols.map((c) => { const val = c.calc ? c.calc(r, rows, ctx) : r[c.key]; return c.format ? c.format(val, r, ctx) : val ?? '—'; });
              return html`<${DataRow} key=${r.id || i} r=${r} i=${i} n=${rows.length} canEdit=${canEdit} reorder=${reorder} calcOut=${calcOut} tone=${rowTone ? rowTone(r) : ''} clickable=${!!onRowClick} currency=${currency} colsSig=${colsSig} api=${api} ops=${ops} />`;
            })}
          </tbody>
          ${footer ? html`<tfoot>${footer}</tfoot>` : null}
        </table>
      </div>
      ${canEdit ? html`<div><${ui.Button} size="sm" icon="plus" onClick=${add}>${addLabel}</${ui.Button}></div>` : null}
    </div>`;
  };
  function CellTextArea({ value, onValue, label, placeholder }) {
    const ref = useRef();
    useLayoutEffect(() => { PM.autoSize(ref.current, 320); }, [value]);
    return html`<textarea ref=${ref} rows="1" class="cell-input" aria-label=${label} placeholder=${placeholder} value=${value ?? ''} onInput=${(e) => onValue(e.currentTarget.value)} style="min-width:180px"></textarea>`;
  }
  PM.toCSV = (columns, rows, currency) => {
    const esc = (v) => { const s = String(v ?? ''); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const head = columns.map((c) => esc(c.label)).join(';');
    const body = rows.map((r, i) => columns.map((c) => { let v = c.type === 'calc' && c.calc ? c.calc(r, rows, { currency, rows, index: i }) : r[c.key]; if (c.type === 'select') v = normOptions(c.options).find((o) => String(o.value) === String(v))?.label ?? v; if (typeof v === 'number') v = String(v).replace('.', ','); if (typeof v === 'boolean') v = v ? 'Sí' : 'No'; return esc(v); }).join(';')).join('\r\n');
    return '﻿' + head + '\r\n' + body;
  };

  /* Persona registrada (id del visor) → nombre, resuelto en cada render. */
  ui.Person = function Person({ id, fallback = 'Alguien' }) {
    const [name, setName] = useState('');
    useEffect(() => { let live = true; if (!id) return; PM.caps.user.then((u) => u && u.profiles([id])).then((ps) => { if (live && ps && ps[id]) setName(ps[id].name || ''); }).catch(() => {}); return () => { live = false; }; }, [id]);
    if (!id) return html`<span class="faint">—</span>`;
    return html`<span>${name || fallback}</span>`;
  };

  /* Límite de errores por vista */
  ui.ErrorBoundary = function ErrorBoundary({ children, label }) {
    const [error, reset] = useErrorBoundary((e) => console.error('Vista con error:', label, e));
    if (error) return html`<div class="error-card" role="alert"><strong>Esta sección encontró un error y se detuvo.</strong><div class="small">Los datos guardados no se perdieron. Puedes reintentar o abrir otra sección.</div><pre>${String(error && (error.stack || error.message || error)).slice(0, 1200)}</pre><div><${ui.Button} size="sm" icon="refresh" onClick=${reset}>Reintentar</${ui.Button}></div></div>`;
    return children;
  };

  /* Tooltip de gráficos: const tip = PM.useChartTip(); <div class="chart" ref=${tip.ref}> … onMouseMove=${(e)=>tip.show(e, contenido)} … ${tip.node}</div> */
  PM.useChartTip = function () {
    const ref = useRef(); const [state, setState] = useState(null);
    const show = useCallback((e, content) => {
      const host = ref.current; if (!host) return;
      const r = host.getBoundingClientRect();
      const px = e.clientX - r.left + host.scrollLeft, py = e.clientY - r.top + host.scrollTop;
      let x = px + 14, y = py + 14;
      if (x > host.scrollLeft + host.clientWidth - 210) x = Math.max(host.scrollLeft + 4, px - 224);
      const flipY = py - host.scrollTop > host.clientHeight * 0.55;
      setState({ x, y: flipY ? py - 12 : y, flipY, content });
    }, []);
    const hide = useCallback(() => setState(null), []);
    const setHost = useCallback((el) => { ref.current = el; }, []);
    const node = state ? html`<div class="chart-tip" role="status" style=${'left:' + state.x + 'px;top:' + state.y + 'px;' + (state.flipY ? 'transform:translateY(-100%)' : '')}>${state.content}</div>` : null;
    return { ref, setHost, show, hide, node };
  };

  /* ------------------------------------------------------------------ superposiciones: modales, confirmación, avisos */
  let overlays = { modals: [], toasts: [] };
  const ovListeners = new Set();
  const setOverlays = (fn) => { overlays = fn(overlays); ovListeners.forEach((f) => f()); };
  PM.openModal = (renderFn, opts = {}) => { const id = PM.uid('m'); const close = () => setOverlays((o) => ({ ...o, modals: o.modals.filter((m) => m.id !== id) })); setOverlays((o) => ({ ...o, modals: [...o.modals, { id, renderFn, close, opts }] })); return close; };
  PM.toast = (text, opts = {}) => { const id = PM.uid('t'); setOverlays((o) => ({ ...o, toasts: [...o.toasts.slice(-3), { id, text, tone: opts.tone }] })); setTimeout(() => setOverlays((o) => ({ ...o, toasts: o.toasts.filter((t) => t.id !== id) })), opts.timeout || (opts.tone === 'crit' ? 7000 : 3500)); };
  PM.confirm = ({ title = '¿Confirmas?', body, confirmText = 'Confirmar', cancelText = 'Cancelar', tone } = {}) => new Promise((resolve) => {
    let done = false; const finish = (v, close) => { if (done) return; done = true; close(); resolve(v); };
    PM.openModal((close) => html`<${ui.Modal} title=${title} onClose=${() => finish(false, close)} footer=${html`<${ui.Button} onClick=${() => finish(false, close)}>${cancelText}</${ui.Button}><${ui.Button} variant=${tone === 'danger' ? 'danger-solid' : 'primary'} onClick=${() => finish(true, close)} autoFocus>${confirmText}</${ui.Button}>`}>${typeof body === 'string' ? html`<p>${body}</p>` : body}</${ui.Modal}>`);
  });
  PM.promptText = ({ title, label, value = '', placeholder, confirmText = 'Aceptar', multiline, optional, hint } = {}) => new Promise((resolve) => {
    let done = false; const finish = (v, close) => { if (done) return; done = true; close(); resolve(v); };
    function PromptBody({ close }) {
      const [v, setV] = useState(value);
      const ok = optional || String(v).trim();
      const submit = () => { if (ok) finish(String(v).trim(), close); };
      return html`<${ui.Modal} title=${title} onClose=${() => finish(null, close)} footer=${html`<${ui.Button} onClick=${() => finish(null, close)}>Cancelar</${ui.Button}><${ui.Button} variant="primary" disabled=${!ok} onClick=${submit}>${confirmText}</${ui.Button}>`}>
        <form onSubmit=${(e) => { e.preventDefault(); submit(); }}>
          <${ui.Field} label=${label} for="pm-prompt" hint=${hint}>${multiline ? html`<${ui.TextArea} id="pm-prompt" value=${v} onValue=${setV} placeholder=${placeholder} autoFocus />` : html`<${ui.Input} id="pm-prompt" value=${v} onValue=${setV} placeholder=${placeholder} autoFocus />`}</${ui.Field}>
        </form>
      </${ui.Modal}>`;
    }
    PM.openModal((close) => html`<${PromptBody} close=${close} />`);
  });
  const modalStack = [];
  const focusables = (root) => [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')].filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  ui.Modal = function Modal({ title, onClose, children, footer, size, subtitle }) {
    const id = useMemo(() => PM.uid('dlg'), []);
    const boxRef = useRef(); const closeRef = useRef(onClose); closeRef.current = onClose;
    useLayoutEffect(() => {
      modalStack.push(id);
      const prev = document.activeElement;
      const box = boxRef.current;
      const k = (e) => {
        if (modalStack[modalStack.length - 1] !== id) return;
        if (e.key === 'Escape') { e.stopPropagation(); closeRef.current && closeRef.current(); return; }
        /* Tab y Mayús+Tab circulan solo dentro del diálogo superior */
        if (e.key === 'Tab' && box) {
          const list = focusables(box); if (!list.length) { e.preventDefault(); return; }
          const first = list[0], last = list[list.length - 1], ae = document.activeElement;
          if (!box.contains(ae)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
          else if (e.shiftKey && ae === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && ae === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown', k);
      /* foco inicial por prioridad: [autofocus] → primer campo del cuerpo → botón principal → cualquier botón */
      if (box && !box.contains(document.activeElement)) {
        const f = box.querySelector('[autofocus]') || box.querySelector('.modal-body input:not([type=hidden]):not([disabled]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled])') || box.querySelector('.modal-foot .btn-primary:not([disabled])') || box.querySelector('.modal-body button:not([disabled]), .modal-foot button:not([disabled])') || box.querySelector('button');
        f && f.focus({ preventScroll: true });
      }
      return () => { const i = modalStack.indexOf(id); if (i >= 0) modalStack.splice(i, 1); document.removeEventListener('keydown', k); const ae = document.activeElement; const focusLost = !ae || ae === document.body || (box && box.contains(ae)); if (focusLost && prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true }); };
    }, []);
    const titleId = id + '-t';
    return html`<div class="modal-backdrop" onMouseDown=${(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div ref=${boxRef} class=${cx('modal', size === 'wide' && 'modal-wide', size === 'xl' && 'modal-xl')} role="dialog" aria-modal="true" aria-labelledby=${titleId}>
        <div class="modal-head"><div class="stack-sm" style="gap:2px;min-width:0"><h2 class="modal-title" id=${titleId}>${title}</h2>${subtitle ? html`<div class="small muted">${subtitle}</div>` : null}</div><${ui.IconButton} icon="x" label="Cerrar" onClick=${onClose} /></div>
        <div class="modal-body">${children}</div>
        ${footer ? html`<div class="modal-foot">${footer}</div>` : null}
      </div>
    </div>`;
  };
  ui.OverlayHost = function OverlayHost() {
    const [, force] = useReducer((x) => x + 1, 0);
    useEffect(() => { ovListeners.add(force); return () => ovListeners.delete(force); }, []);
    return html`<div>
      ${overlays.modals.map((m) => html`<div key=${m.id}>${m.renderFn(m.close)}</div>`)}
      <div class="toasts" aria-live="polite">${overlays.toasts.map((t) => html`<div key=${t.id} class=${cx('toast', t.tone === 'crit' && 'crit')}>${t.text}</div>`)}</div>
    </div>`;
  };

  /* Ejecuta una tarea larga mostrando un diálogo de progreso no cancelable: fn(onProgress(done,total)). */
  let busyTask = false;
  PM.runWithProgress = async (title, fn) => {
    if (busyTask) { PM.toast('Espera a que termine la operación en curso.'); return undefined; }
    busyTask = true;
    let set = null; let state = { done: 0, total: 0 };
    function Progress() { const [st, setSt] = useState(state); set = setSt; const pct = st.total ? Math.round((st.done / st.total) * 100) : 0; return html`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label=${title} style="max-width:420px"><div class="modal-body"><div class="h3">${title}</div><${ui.Meter} value=${st.total ? st.done / st.total : 0} label=${title} /><div class="small muted num" role="status">${st.total ? 'Guardando ' + st.done + ' de ' + st.total + ' registros (' + pct + ' %)…' : 'Preparando…'}</div></div></div></div>`; }
    const close = PM.openModal(() => html`<${Progress} />`);
    try { return await fn((done, total) => { state = { done, total }; set && set(state); }); }
    finally { busyTask = false; close(); }
  };

  /* ------------------------------------------------------------------ descargas y portapapeles */
  PM.copyText = async (text) => { try { await navigator.clipboard.writeText(text); PM.toast('Copiado al portapapeles.'); return true; } catch (e) { return false; } };
  ui.CopyBlock = function CopyBlock({ text, rows = 12 }) {
    const ref = useRef();
    return html`<div class="stack-sm"><textarea ref=${ref} class="textarea mono" readonly rows=${rows} style="font-size:12px" value=${text}></textarea>
      <div><${ui.Button} size="sm" icon="copy" onClick=${async () => { const ok = await PM.copyText(text); if (!ok && ref.current) { ref.current.focus(); ref.current.select(); PM.toast('Selecciona y copia el texto con Ctrl+C.'); } }}>Copiar</${ui.Button}></div></div>`;
  };
  /* Ofrece un archivo al visor (capacidad downloads). Si no está disponible, muestra el contenido para copiarlo. */
  PM.download = async (filename, data) => {
    const dl = await PM.caps.downloads;
    if (dl) {
      try { await dl.save({ filename, data }); return true; }
      catch (e) {
        if (e && e.code === 'declined') return false;
        if (e && e.code === 'rate_limited') { PM.toast('Ya hay una descarga pendiente de confirmar.'); return false; }
        if (e && e.code === 'rejected_extension') { PM.toast('Ese tipo de archivo no se puede descargar aquí.', { tone: 'crit' }); return false; }
      }
    }
    if (typeof data === 'string') {
      PM.openModal((close) => html`<${ui.Modal} title="Copiar contenido" subtitle=${filename} onClose=${close} size="wide"><p class="small muted">Este visor no permite descargar archivos. Copia el contenido y pégalo en un archivo nuevo.</p><${ui.CopyBlock} text=${data} /></${ui.Modal}>`);
    } else PM.toast('Este visor no permite descargar archivos.', { tone: 'crit' });
    return false;
  };
  /* SVG → texto autónomo (resuelve variables CSS y estilos de texto) para descarga. */
  PM.svgToString = (svgEl) => {
    if (!svgEl) return '';
    const clone = svgEl.cloneNode(true);
    const rootCS = getComputedStyle(document.documentElement);
    const resolveVars = (str) => { let out = String(str); for (let k = 0; k < 4 && out.includes('var('); k++) out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (m, name, fb) => rootCS.getPropertyValue(name).trim() || (fb ? fb.trim() : '') || 'currentColor'); return out; };
    const src = [svgEl, ...svgEl.querySelectorAll('*')]; const dst = [clone, ...clone.querySelectorAll('*')];
    const props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'paint-order', 'visibility'];
    src.forEach((el, i) => {
      const d = dst[i]; if (!d) return;
      const cs = getComputedStyle(el);
      if (el !== svgEl) props.forEach((p) => { const v = cs.getPropertyValue(p); if ((v && v !== 'normal' && v !== 'auto') || p === 'fill' || p === 'stroke') d.setAttribute(p, v); });
      if (cs.display === 'none') d.setAttribute('display', 'none');
      for (const a of [...d.attributes]) if (a.value && a.value.includes('var(')) d.setAttribute(a.name, resolveVars(a.value));
      d.removeAttribute('class');
    });
    clone.querySelectorAll('style').forEach((st) => { st.textContent = resolveVars(st.textContent); });
    const bg = getComputedStyle(document.body).backgroundColor;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const w = svgEl.getAttribute('width') || svgEl.viewBox?.baseVal?.width; const hgt = svgEl.getAttribute('height') || svgEl.viewBox?.baseVal?.height;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%'); rect.setAttribute('fill', bg);
    clone.insertBefore(rect, clone.firstChild);
    if (w) clone.setAttribute('width', w); if (hgt) clone.setAttribute('height', hgt);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  };

  ui.SvgDownload = function SvgDownload({ getSvg, filename, label = 'Descargar SVG' }) {
    return html`<${ui.Button} size="sm" icon="image" onClick=${() => { const el = typeof getSvg === 'function' ? getSvg() : getSvg?.current; if (!el) return; PM.download(filename, PM.svgToString(el)); }}>${label}</${ui.Button}>`;
  };

  /* ------------------------------------------------------------------ Claude (capacidad sample) */
  PM.ai = {
    available: async () => !!(await PM.caps.sample),
    errorText(code) {
      return ({
        not_granted: 'No se autorizó usar Claude en esta página.', sampling_disabled: 'Claude no está disponible para esta cuenta.', rate_limited: 'Se alcanzó el límite de uso. Intenta de nuevo en unos minutos.',
        session_expired: 'La sesión expiró. Vuelve a iniciar sesión en claude.ai.', refused: 'Claude no pudo responder esta solicitud. Ajusta el contenido y vuelve a intentarlo.',
        invalid_json: 'La respuesta no tuvo el formato esperado. Intenta de nuevo.', prompt_too_large: 'El contenido es demasiado largo para enviarlo de una vez.', cancelled: 'Solicitud cancelada.',
        empty_completion: 'Claude no devolvió contenido. Intenta con una solicitud más concreta.',
      })[code] || 'No se pudo completar la solicitud a Claude. Intenta de nuevo.';
    },
    async json(prompt, opts = {}) { const s = await PM.caps.sample; if (!s) throw { code: 'not_granted', message: 'sample unavailable' }; return s.json(prompt, opts); },
    async text(prompt, opts = {}) { const s = await PM.caps.sample; if (!s) throw { code: 'not_granted', message: 'sample unavailable' }; return s(prompt, opts); },
  };

  /* ------------------------------------------------------------------ operaciones de proyecto */
  PM.PROJECT_STATUS = ['Propuesta', 'En planificación', 'En ejecución', 'En cierre', 'Cerrado', 'Suspendido'];
  PM.LIFECYCLES = ['Predictivo', 'Iterativo', 'Incremental', 'Adaptativo (ágil)', 'Híbrido'];
  PM.statusTone = (s) => ({ 'Propuesta': 'outline', 'En planificación': 'info', 'En ejecución': 'accent', 'En cierre': 'signal', 'Cerrado': 'good', 'Suspendido': 'warn' })[s] || 'outline';
  PM.projectOps = {
    async create(meta) {
      const id = PM.uid('p');
      const now = PM.nowIso();
      await PM.store.set(PM.paths.project(id), { ...meta, createdAt: now, updatedAt: now, createdBy: PM.getState().meId || null });
      return id;
    },
    async update(id, patch) { await PM.store.update(PM.paths.project(id), { ...patch, updatedAt: PM.nowIso() }); },
    /* Marca "actualizado" solo si el proyecto sigue existiendo (pudo eliminarse mientras corría el antirrebote). */
    touch(id) {
      if (!id) return Promise.resolve();
      const path = PM.paths.project(id);
      return PM.store.get(path).then((d) => (d ? PM.store.update(path, { updatedAt: PM.nowIso() }, { quiet: true }) : null)).catch(() => {});
    },
    async exportData(id) {
      const project = await PM.store.get(PM.paths.project(id));
      const out = { format: 'gestor-pmbok', version: 1, exportedAt: PM.nowIso(), project, collections: {} };
      for (const c of PM.PROJECT_COLLECTIONS) {
        const items = await PM.store.list(PM.paths.project(id) + '/' + c.name);
        out.collections[c.name] = [];
        for (const it of items) {
          const entry = { id: it.id, data: it.data };
          for (const n of c.nested) entry[n] = await PM.store.list(PM.paths.project(id) + '/' + c.name + '/' + it.id + '/' + n);
          out.collections[c.name].push(entry);
        }
      }
      return out;
    },
    async importData(obj, { rename, onProgress } = {}) {
      if (!obj || obj.format !== 'gestor-pmbok' || !obj.project || typeof obj.project !== 'object' || Array.isArray(obj.project)) throw Object.assign(new Error('El archivo no es una exportación válida del Gestor PMBOK.'), { user: true });
      const id = PM.uid('p'); const now = PM.nowIso();
      const meta = { ...obj.project, name: rename || obj.project.name, updatedAt: now, importedAt: now };
      const writes = [];
      for (const [name, items] of Object.entries(obj.collections || {})) {
        if (!/^[A-Za-z0-9_-]+$/.test(name)) continue;
        for (const it of Array.isArray(items) ? items : []) {
          if (!it || !it.id || !it.data || typeof it.data !== 'object' || Array.isArray(it.data)) continue;
          writes.push([PM.paths.project(id) + '/' + name + '/' + it.id, name === 'tools' ? PM.normalizeTool(it.id, it.data) : it.data]);
          for (const [k, v] of Object.entries(it)) { if (k === 'id' || k === 'data' || !Array.isArray(v)) continue; for (const sub of v) if (sub && sub.id && sub.data && typeof sub.data === 'object') writes.push([PM.paths.project(id) + '/' + name + '/' + it.id + '/' + k + '/' + sub.id, sub.data]); }
        }
      }
      const total = writes.length + 1; let done = 0;
      try {
        for (const [path, data] of writes) { await PM.store.set(path, data); done++; onProgress && onProgress(done, total); }
        /* el proyecto se escribe al final: solo aparece en el portafolio si todo lo demás quedó guardado */
        await PM.store.set(PM.paths.project(id), meta); onProgress && onProgress(total, total);
      } catch (e) {
        try { for (const [path] of writes.slice(0, done)) await PM.store.delete(path); } catch (e2) { /* limpieza parcial */ }
        throw e;
      }
      return id;
    },
    async remove(id) {
      if (PM.touchProject && PM.touchProject.cancel) PM.touchProject.cancel(id);
      for (const c of PM.PROJECT_COLLECTIONS) {
        const items = await PM.store.list(PM.paths.project(id) + '/' + c.name);
        for (const it of items) {
          for (const n of c.nested) { const subs = await PM.store.list(PM.paths.project(id) + '/' + c.name + '/' + it.id + '/' + n); for (const s of subs) await PM.store.delete(PM.paths.project(id) + '/' + c.name + '/' + it.id + '/' + n + '/' + s.id); }
          await PM.store.delete(PM.paths.project(id) + '/' + c.name + '/' + it.id);
        }
      }
      await PM.store.delete(PM.paths.project(id));
    },
    async duplicate(id, name, opts = {}) { const data = await PM.projectOps.exportData(id); return PM.projectOps.importData(data, { rename: name, onProgress: opts.onProgress }); },
  };
  PM.nextProjectCode = (projects) => { const y = new Date().getFullYear(); let n = 1; const codes = new Set(projects.map((p) => p.code)); while (codes.has('PRY-' + y + '-' + String(n).padStart(3, '0'))) n++; return 'PRY-' + y + '-' + String(n).padStart(3, '0'); };
})();

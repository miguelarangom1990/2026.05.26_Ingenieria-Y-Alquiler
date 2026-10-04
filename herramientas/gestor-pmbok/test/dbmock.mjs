// Simulación de window.claude (db, user, downloads, sample) para probar el modo "artefacto"
// sin el visor de claude.ai. Uso: await installClaudeMock(context, { canWrite: true })
// antes de page.goto(). Expone window.__mock con el almacén, las suscripciones activas y las descargas.
export async function installClaudeMock(context, opts = {}) {
  await context.addInitScript((opts) => {
    const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
    const freeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) freeze(o[k]); } return o; };
    const store = new Map();
    const docL = new Map(), colL = new Map();
    const mock = (window.__mock = { store, activeSubs: 0, maxSubs: 0, writes: 0, downloads: [], samples: [], errors: [] });
    const delay = () => new Promise((r) => setTimeout(r, 15 + Math.random() * 45));
    const segs = (p) => String(p).split('/');
    const checkPath = (p, even) => {
      const s = segs(p);
      if (s.some((x) => !x || x === '.' || x === '..' || !/^[A-Za-z0-9_\-.~:@+]+$/.test(x))) throw new TypeError('ruta inválida: ' + p);
      if ((s.length % 2 === 0) !== even) throw new TypeError((even ? 'documento' : 'colección') + ' con paridad incorrecta (' + s.length + ' segmentos): ' + p);
      if (s.length > 16) throw new TypeError('ruta demasiado profunda: ' + p);
    };
    const snapDoc = (path) => { const d = store.get(path); return { id: segs(path).pop(), exists: d !== undefined, data: () => (d === undefined ? undefined : freeze(clone(d))), metadata: { fromCache: false, hasPendingWrites: false } }; };
    const snapCol = (col) => { const pre = col + '/'; const docs = [...store.keys()].filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes('/')).sort().map(snapDoc); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
    const notify = (path) => setTimeout(() => {
      (docL.get(path) || new Set()).forEach((fn) => fn(snapDoc(path)));
      const col = path.slice(0, path.lastIndexOf('/'));
      (colL.get(col) || new Set()).forEach((fn) => fn(snapCol(col)));
    }, 5);
    const sub = (map, key, fn, err, snap) => {
      if (mock.activeSubs >= 64) { setTimeout(() => err && err({ code: 'resource_exhausted', message: 'más de 64 suscripciones' }), 0); mock.errors.push('64 suscripciones: ' + key); return () => {}; }
      mock.activeSubs++; mock.maxSubs = Math.max(mock.maxSubs, mock.activeSubs);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(fn); setTimeout(() => { if (map.get(key) && map.get(key).has(fn)) fn(snap()); }, 5);
      let live = true;
      return () => { if (!live) return; live = false; mock.activeSubs--; map.get(key).delete(fn); };
    };
    const canWrite = opts.canWrite !== false;
    const guardWrite = () => { if (!canWrite) throw { code: 'invalid_argument', message: 'below minimum level' }; };
    const db = {
      doc(path) {
        checkPath(path, true);
        return {
          id: segs(path).pop(), path,
          get: async () => { await delay(); return snapDoc(path); },
          set: async (d) => { await delay(); guardWrite(); if (!d || typeof d !== 'object' || Array.isArray(d)) throw { code: 'invalid_argument', message: 'body' }; const json = JSON.stringify(d); if (new TextEncoder().encode(json).length > 262144) throw { code: 'invalid_argument', message: 'document over 256 KiB' }; store.set(path, JSON.parse(json)); mock.writes++; notify(path); },
          update: async (p) => { await delay(); guardWrite(); if (!store.has(path)) throw { code: 'invalid_argument', message: 'missing' }; const t = store.get(path); const merge = (a, b) => { for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]); else a[k] = clone(b[k]); } }; merge(t, p); mock.writes++; notify(path); },
          delete: async () => { await delay(); guardWrite(); store.delete(path); mock.writes++; notify(path); },
          onSnapshot: (next, err) => sub(docL, path, next, err, () => snapDoc(path)),
          collection: (s) => db.collection(path + '/' + s),
          acquire: async () => ({ acquired: true }),
        };
      },
      collection(path) {
        checkPath(path, false);
        const q = {
          path,
          doc: (id) => db.doc(path + '/' + (id || 'm' + Math.random().toString(36).slice(2, 10))),
          add: async (d) => { const r = q.doc(); await r.set(d); return r; },
          get: async () => { await delay(); return snapCol(path); },
          onSnapshot: (next, err) => sub(colL, path, next, err, () => snapCol(path)),
          where: () => q, orderBy: () => q, limit: () => q,
        };
        return q;
      },
    };
    const profile = (id) => ({ id, name: 'Usuario de prueba', avatarUrl: '', color: '#6b7280', email: null, isMe: id === 'u_prueba', guest: false });
    const user = {
      id: async () => 'u_prueba', isOwner: async () => !!opts.owner, canEdit: async () => canWrite, can: async (n) => (n === 'data.write' ? (opts.unknownWrite ? null : canWrite) : false),
      me: async () => ({ ...profile('u_prueba'), isOwner: !!opts.owner, canEdit: canWrite }), name: async () => 'Usuario de prueba', avatarUrl: async () => null, email: async () => null,
      profiles: async (ids) => Object.fromEntries([].concat(ids).map((i) => [i, profile(i)])), search: async () => [],
    };
    const downloads = { save: async ({ filename, data }) => { mock.downloads.push({ filename, size: typeof data === 'string' ? data.length : data.size || data.byteLength }); return { status: 'saved' }; } };
    const sample = async (input, o = {}) => { mock.samples.push(input); const text = 'Texto de prueba'; o.onText && o.onText({ text, delta: text }); return { text, truncated: false, modelTierApplied: 'default' }; };
    sample.json = async (input) => { mock.samples.push(input); return {}; };
    sample.limits = async () => ({ maxPromptBytes: 262144 });
    const caps = { db, user, downloads, sample };
    window.claude = { use: (name) => new Promise((r) => setTimeout(() => r(opts.disable && opts.disable.includes(name) ? null : caps[name] || null), 20)) };
  }, opts);
}

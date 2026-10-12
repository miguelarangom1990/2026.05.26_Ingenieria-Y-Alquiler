/* ==========================================================================
   06-model.js — modelos compartidos entre vistas: cronograma/EDT/costos
   calculados (con el avance ágil de los releases vinculados), índice de
   documentos del proyecto y acceso a tablas de documentos (registro de
   riesgos, interesados, etc.).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { useMemo, useCallback } = PM.lib;

  const EMPTY_RESOURCES = Object.freeze({ preset: null, types: Object.freeze([]), items: Object.freeze([]) });
  const EMPTY_AGILE = Object.freeze({ settings: Object.freeze({}), releases: Object.freeze([]), sprints: Object.freeze([]) });
  PM.EMPTY = PM.deepFreeze({
    wbs: { nodes: [] },
    schedule: { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [] },
    costs: { actuals: [], statusUpdates: [], reserves: { contingency: 0, management: 0 } },
    raci: { roles: [], rows: [] },
    quality: { ishikawa: [], pareto: [], control: [] },
  });

  /* Fecha de corte del proyecto (project.statusDate) o, si no hay, hoy. */
  PM.statusDateOf = (project) => (project && PM.date.valid(project.statusDate) ? project.statusDate : PM.date.today());

  /* Marca el proyecto como actualizado (con antirrebote por proyecto). */
  const touchers = {};
  /* projectOps.touch comprueba que el proyecto siga existiendo; eliminarlo cancela el toque pendiente. */
  PM.touchProject = (pid) => { if (!pid || !PM.getState().canWrite) return; (touchers[pid] = touchers[pid] || PM.debounce(() => { delete touchers[pid]; PM.projectOps.touch(pid); }, 8000))(); };
  PM.touchProject.cancel = (pid) => { const t = touchers[pid]; if (t) { t.cancel(); delete touchers[pid]; } };

  /* Modelo integrado del proyecto actual: EDT, cronograma (CPM), costos, líneas base y valor ganado. */
  PM.useProjectModel = function () {
    const { project } = PM.useCurrentProject();
    const pid = project ? project.id : null;
    const [schedule, saveScheduleRaw, sMeta] = PM.useToolData('schedule', PM.EMPTY.schedule);
    const [wbs, saveWbsRaw, wMeta] = PM.useToolData('wbs', PM.EMPTY.wbs);
    const [costs, saveCostsRaw, cMeta] = PM.useToolData('costs', PM.EMPTY.costs);
    const { docs: baselineDocs, loading: blLoading } = PM.useCollection(pid ? PM.paths.baselines(pid) : null);
    /* capa ágil (07-agile-core): releases e iteraciones (herramienta «agile») y elementos del backlog; el backlog se lee
       si el ciclo de vida es adaptativo o híbrido, o si hay releases (p. ej. tras cambiar el ciclo a predictivo) */
    const [agile, saveAgileRaw, aMeta] = PM.useToolData('agile', PM.EMPTY.agile || EMPTY_AGILE);
    const agileOn = !!(PM.agile && (PM.agile.enabled(project) || (Array.isArray(agile.releases) && agile.releases.length)));
    const { docs: backlogDocs, loading: bLoading } = PM.useCollection(pid && agileOn && PM.paths.backlog ? PM.paths.backlog(pid) : null);
    const agileItems = useMemo(() => backlogDocs.filter((d) => d.data && typeof d.data === 'object' && !Array.isArray(d.data)).map((d) => ({ ...d.data, id: d.id })), [backlogDocs]);
    const saveAgile = useCallback((v) => { PM.touchProject(pid); return saveAgileRaw(v); }, [saveAgileRaw, pid]);
    /* catálogo de recursos (09-resources-core): tipos y recursos del proyecto; las formas de costeo de las actividades
       («recursos», «mixto», «unitario») calculan su costo con él */
    const [resources, saveResourcesRaw, rMeta] = PM.useToolData('resources', PM.EMPTY.resources || EMPTY_RESOURCES);
    const saveResources = useCallback((v) => { PM.touchProject(pid); return saveResourcesRaw(v); }, [saveResourcesRaw, pid]);
    const saveSchedule = useCallback((v) => { PM.touchProject(pid); return saveScheduleRaw(v); }, [saveScheduleRaw, pid]);
    const saveWbs = useCallback((v) => { PM.touchProject(pid); return saveWbsRaw(v); }, [saveWbsRaw, pid]);
    const saveCosts = useCallback((v) => { PM.touchProject(pid); return saveCostsRaw(v); }, [saveCostsRaw, pid]);
    const projectStart = project ? project.start : null;
    const statusDate = PM.statusDateOf(project);
    const tree = useMemo(() => PM.calc.wbsTree(wbs.nodes), [wbs]);
    /* sched: red según lo programado (las actividades atrasadas conservan sus fechas: así se detectan los vencidos).
       forecast: la misma red actualizada a la fecha de corte (6.6 Controlar el cronograma): el trabajo pendiente no
       queda antes del corte, de modo que fin, ruta crítica e hitos pronosticados reflejan el atraso. */
    /* las actividades vinculadas a un release toman su avance del backlog (terminado / alcance): así la parte ágil
       entra a la ruta crítica, la curva S y el valor ganado del proyecto sin modificar el cronograma guardado */
    const effSchedule = useMemo(() => {
      const s1 = PM.agile && agileOn ? PM.agile.applyToSchedule(schedule, agile, agileItems, { statusDate }) : schedule;
      return PM.res ? PM.res.applyCosts(s1, resources) : s1;
    }, [schedule, agile, agileItems, agileOn, statusDate, resources]);
    const catalog = useMemo(() => (PM.res ? PM.res.catalog(resources, schedule) : null), [resources, schedule]);
    const sched = useMemo(() => PM.calc.computeSchedule(effSchedule, projectStart), [effSchedule, projectStart]);
    const forecast = useMemo(() => PM.calc.computeSchedule(effSchedule, projectStart, statusDate), [effSchedule, projectStart, statusDate]);
    const baselines = useMemo(() => PM.calc.activeBaselines(baselineDocs), [baselineDocs]);
    /* reserva para contingencias del plan vigente (SPEC §10.3): sin línea base de costos, el valor ganado suma la reserva
       disponible más el consumo sin actividad (lo consumido en actividades por recursos ya está en el BAC) */
    const reserveUse = useMemo(() => (PM.res ? PM.res.reserveUse({ data: resources, schedule: effSchedule, contingency: costs && costs.reserves && costs.reserves.contingency }) : null), [resources, effSchedule, costs]);
    const evmCosts = useMemo(() => (!reserveUse || !(reserveUse.consumed > 0) || baselines.cost ? costs : { ...costs, reserves: { ...((costs && costs.reserves) || {}), contingency: Math.max(0, reserveUse.available) + reserveUse.unassigned } }), [costs, reserveUse, baselines.cost]);
    const evm = useMemo(() => PM.calc.evm({ sched, costBaseline: baselines.cost, costs: evmCosts, statusDate }), [sched, baselines.cost, evmCosts, statusDate]);
    const rollup = useMemo(() => PM.calc.rollupWbs(tree, sched), [tree, sched]);
    return { project, pid, schedule, effSchedule, saveSchedule, wbs, saveWbs, costs, saveCosts, tree, sched, forecast, baselines, baselineDocs, evm, rollup, statusDate, currency: (project && project.currency) || 'COP', agile, saveAgile, agileItems, agileOn, agileMeta: aMeta, resources, saveResources, catalog, reserveUse, loading: sMeta.loading || wMeta.loading || cMeta.loading || blLoading || aMeta.loading || bLoading || rMeta.loading };
  };

  /* Índice de documentos del proyecto actual. list: [{id, template, title, status, rev, fields, ...}] */
  PM.docTemplateOf = (docId, data) => (data && data.template) || String(docId).split('--')[0];
  PM.useProjectDocs = function () {
    const st = PM.useAppState();
    const { docs, loading } = PM.useCollection(st.projectId ? PM.paths.docs(st.projectId) : null);
    return useMemo(() => {
      const list = docs.filter((d) => d.data).map((d) => ({ id: d.id, ...d.data, template: PM.docTemplateOf(d.id, d.data) }));
      const byTemplate = {};
      for (const d of list) (byTemplate[d.template] = byTemplate[d.template] || []).push(d);
      return { list, byTemplate, get: (tid) => (byTemplate[tid] && byTemplate[tid][0]) || null, loading };
    }, [docs, loading]);
  };

  /* Cuerpo inicial de un documento a partir de su plantilla. */
  PM.newDocBody = (template, project, extra = {}) => {
    const fields = {};
    for (const s of (template && template.sections) || []) for (const f of s.fields || []) {
      const v = PM.calc.fieldDefault(f, project);
      if (v !== undefined && v !== null && v !== '') fields[f.key] = v;
      else if (f.type === 'table' && Array.isArray(f.defaultRows)) fields[f.key] = f.defaultRows.map((r) => ({ id: PM.uid('r'), ...r }));
      else if (f.default !== undefined) fields[f.key] = PM.clone(f.default);
    }
    const now = PM.nowIso();
    return { template: template ? template.id : extra.template, title: template ? template.name : '', status: 'borrador', rev: null, fields, titleBlock: { codigo: '', elaboro: '', reviso: '', aprobo: '', fechaAprobacion: null }, createdAt: now, updatedAt: now, createdBy: PM.getState().meId || null, updatedBy: PM.getState().meId || null, ...extra };
  };

  const EMPTY_ROWS = Object.freeze([]);
  /* Tabla de un documento (singleton) del proyecto actual: [rows, saveRows, {doc, exists, loading}].
     Crea el documento con su plantilla si no existe al guardar. Comparte la sincronización con el editor. */
  PM.useDocTable = function (templateId, fieldKey) {
    const { project } = PM.useCurrentProject();
    const pid = project ? project.id : null;
    const r = PM.useDoc(pid ? PM.paths.doc(pid, templateId) : null);
    const raw = (r.exists && r.data && r.data.fields && Array.isArray(r.data.fields[fieldKey])) ? r.data.fields[fieldKey] : EMPTY_ROWS;
    /* filas nulas o que no son objetos (datos importados dañados) se omiten */
    const rows = useMemo(() => (raw.every((x) => x && typeof x === 'object' && !Array.isArray(x)) ? raw : raw.filter((x) => x && typeof x === 'object' && !Array.isArray(x))), [raw]);
    const saveRows = useCallback((next) => {
      const base = r.exists && r.data ? PM.clone(r.data) : PM.newDocBody(PM.templates[templateId], project, { template: templateId });
      base.fields = { ...(base.fields || {}), [fieldKey]: next };
      base.updatedAt = PM.nowIso(); base.updatedBy = PM.getState().meId || null;
      PM.touchProject(pid);
      return r.save(base);
    }, [r.exists, r.data, r.save, templateId, fieldKey, pid, project]);
    return [rows, saveRows, { doc: r.exists ? r.data : null, exists: r.exists, loading: r.loading }];
  };
})();

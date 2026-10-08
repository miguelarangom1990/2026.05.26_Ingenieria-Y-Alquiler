/* ==========================================================================
   08-shell.js — armazón de la aplicación: riel de navegación, selector de
   proyecto, avisos de modo, anfitrión de vistas, portafolio y formulario de
   proyecto (PM.ProjectForm, reutilizable).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useRef, useMemo } = PM.lib;
  const ui = PM.ui;

  const BrandMark = () => html`<svg class="brand-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="27" height="27" rx="2.5" />
    <path d="M2.5 22h27M13 22v7.5M21 22v7.5" stroke-width="1.6" />
    <path d="M7 17.5c3.2 0 4.4-1 6-4.2s3-6.3 7.5-6.3H25" />
    <path d="m22.5 4.5 2.5 2.5-2.5 2.5" stroke-width="1.6" />
  </svg>`;

  /* ---------------------------------------------------------------- formulario de proyecto */
  PM.ProjectForm = function ProjectForm({ initial, projects, onSubmit, onCancel, submitText = 'Crear proyecto', autoFocus = true }) {
    const [f, setF] = useState(() => ({ name: '', code: PM.nextProjectCode(projects || []), client: '', sponsor: '', manager: '', start: PM.date.today(), end: '', budget: null, currency: 'COP', status: 'En planificación', lifecycle: 'Predictivo', description: '', location: '', ...(initial || {}) }));
    const [touched, setTouched] = useState(false);
    const [busy, setBusy] = useState(false);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const errors = {};
    if (!String(f.name || '').trim()) errors.name = 'Escribe el nombre del proyecto.';
    if (!PM.date.valid(f.start)) errors.start = 'Indica la fecha de inicio.';
    if (f.end && PM.date.valid(f.start) && f.end < f.start) errors.end = 'La fecha de fin debe ser posterior al inicio.';
    const ok = !Object.keys(errors).length;
    const submit = async (e) => { e && e.preventDefault(); setTouched(true); if (!ok || busy) return; setBusy(true); try { await onSubmit({ ...f, name: f.name.trim(), code: String(f.code || '').trim() }); } finally { setBusy(false); } };
    return html`<form class="stack" onSubmit=${submit}>
      <div class="grid cols-2">
        <${ui.Field} label="Nombre del proyecto" required for="pf-name" error=${touched && errors.name} class="span-all"><${ui.Input} id="pf-name" value=${f.name} onValue=${set('name')} placeholder="Ej.: Suministro y montaje de andamio — Torre 2" autoFocus=${autoFocus} /></${ui.Field}>
        <${ui.Field} label="Código" for="pf-code" hint="Identificador corto para documentos y reportes."><${ui.Input} id="pf-code" class="mono" value=${f.code} onValue=${set('code')} /></${ui.Field}>
        <${ui.Field} label="Cliente" for="pf-client"><${ui.Input} id="pf-client" value=${f.client} onValue=${set('client')} /></${ui.Field}>
        <${ui.Field} label="Patrocinador" for="pf-sponsor"><${ui.Input} id="pf-sponsor" value=${f.sponsor} onValue=${set('sponsor')} /></${ui.Field}>
        <${ui.Field} label="Director del proyecto" for="pf-manager"><${ui.Input} id="pf-manager" value=${f.manager} onValue=${set('manager')} /></${ui.Field}>
        <${ui.Field} label="Fecha de inicio" required for="pf-start" error=${touched && errors.start}><${ui.DateInput} id="pf-start" value=${f.start} onValue=${set('start')} /></${ui.Field}>
        <${ui.Field} label="Fecha de fin prevista" for="pf-end" error=${errors.end}><${ui.DateInput} id="pf-end" value=${f.end} onValue=${set('end')} /></${ui.Field}>
        <${ui.Field} label="Presupuesto aprobado" for="pf-budget"><${ui.NumberInput} id="pf-budget" money currency=${f.currency} value=${f.budget} onValue=${set('budget')} /></${ui.Field}>
        <${ui.Field} label="Moneda" for="pf-cur"><${ui.Select} id="pf-cur" value=${f.currency} onValue=${set('currency')} options=${[{ value: 'COP', label: 'Peso colombiano (COP)' }, { value: 'USD', label: 'Dólar (USD)' }, { value: 'EUR', label: 'Euro (EUR)' }]} /></${ui.Field}>
        <${ui.Field} label="Estado" for="pf-status"><${ui.Select} id="pf-status" value=${f.status} onValue=${set('status')} options=${PM.PROJECT_STATUS} /></${ui.Field}>
        <${ui.Field} label="Ciclo de vida" for="pf-lc" hint="Enfoque de desarrollo del proyecto."><${ui.Select} id="pf-lc" value=${f.lifecycle} onValue=${set('lifecycle')} options=${PM.LIFECYCLES} /></${ui.Field}>
        <${ui.Field} label="Ubicación / obra" for="pf-loc"><${ui.Input} id="pf-loc" value=${f.location} onValue=${set('location')} /></${ui.Field}>
      </div>
      <${ui.Field} label="Descripción" for="pf-desc" hint="Qué se va a entregar y por qué. Se usa como punto de partida del acta de constitución."><${ui.TextArea} id="pf-desc" value=${f.description} onValue=${set('description')} rows=${3} /></${ui.Field}>
      <div class="row" style="justify-content:flex-end">
        ${onCancel ? html`<${ui.Button} onClick=${onCancel}>Cancelar</${ui.Button}>` : null}
        <${ui.Button} type="submit" variant="primary" disabled=${busy}>${busy ? 'Guardando…' : submitText}</${ui.Button}>
      </div>
    </form>`;
  };
  PM.openNewProject = (projects) => {
    PM.openModal((close) => html`<${ui.Modal} title="Nuevo proyecto" subtitle="Datos básicos. Podrás completarlos después en la ficha del proyecto." size="wide" onClose=${close}>
      <${PM.ProjectForm} projects=${projects} onCancel=${close} onSubmit=${async (data) => { const id = await PM.projectOps.create(data); close(); PM.toast('Proyecto creado.'); PM.selectProject(id, 'tablero'); }} />
    </${ui.Modal}>`);
  };
  PM.importProjectFile = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files && input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        let obj;
        try { obj = JSON.parse(String(reader.result)); }
        catch (e) { PM.toast('El archivo no es un JSON válido. Usa un archivo exportado con «Exportar (.json)» del Gestor PMBOK.', { tone: 'crit' }); return; }
        try { const id = await PM.runWithProgress('Importando el proyecto', (onProgress) => PM.projectOps.importData(obj, { onProgress })); if (!id) return; PM.toast('Proyecto importado.'); PM.selectProject(id, 'tablero'); }
        catch (e) { PM.toast(e && e.user && e.message ? e.message : 'No se pudo importar el archivo. Verifica que sea una exportación del Gestor PMBOK.', { tone: 'crit' }); }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  PM.exportProjectFile = async (pid, project) => {
    try { const data = await PM.projectOps.exportData(pid); await PM.download((project && project.code ? project.code + '_' : '') + PM.slug(project && project.name || 'proyecto') + '.json', JSON.stringify(data, null, 1)); }
    catch (e) { PM.toast('No se pudo exportar el proyecto.', { tone: 'crit' }); }
  };
  PM.deleteProjectFlow = async (p) => {
    const ok = await PM.confirm({ title: 'Eliminar proyecto', body: html`<div class="stack-sm"><p>Se eliminará <strong>${p.name}</strong> con todos sus documentos, herramientas y líneas base. Esta acción no se puede deshacer.</p><p class="small muted">Si quieres conservar una copia, exporta el proyecto antes de eliminarlo.</p></div>`, confirmText: 'Eliminar proyecto', tone: 'danger' });
    if (!ok) return;
    try { await PM.projectOps.remove(p.id); if (PM.getState().projectId === p.id) { PM.setState({ projectId: null }); PM.prefs.set('projectId', null); PM.navigate('portafolio'); } PM.toast('Proyecto eliminado.'); }
    catch (e) { PM.toast('No se pudo eliminar por completo el proyecto. Intenta de nuevo.', { tone: 'crit' }); }
  };
  /* Crea un proyecto de ejemplo. Con un id lo crea directamente; sin id y con varios ejemplos, muestra el selector. */
  PM.createExampleProject = async (id) => {
    if (!PM.examples.length) return null;
    let ex = id ? PM.getExample(id) : PM.examples.length === 1 ? PM.examples[0] : null;
    if (!ex && id) return null;
    if (!ex) {
      ex = await new Promise((resolve) => {
        let done = false; const finish = (v, close) => { if (done) return; done = true; close(); resolve(v); };
        PM.openModal((close) => html`<${ui.Modal} title="Crear proyecto de ejemplo" subtitle="Los datos son ficticios y quedan marcados como ejemplo. Puedes eliminarlos cuando quieras." size="wide" onClose=${() => finish(null, close)}>
          <div class="example-grid">
            ${PM.examples.map((e) => html`<button key=${e.id} type="button" class="example-card" aria-label=${'Crear: ' + e.name} onClick=${() => finish(e, close)}>
              <div class="example-card-head"><${ui.Icon} name=${e.icon || 'portfolio'} size=${20} /><span class="h3">${e.name}</span></div>
              ${e.description ? html`<p class="small muted">${e.description}</p>` : null}
              ${e.summary && e.summary.length ? html`<div class="row" style="gap:6px">${e.summary.map((t) => html`<${ui.Chip} key=${t}>${t}</${ui.Chip}>`)}</div>` : null}
              <span class="example-card-cta">Crear este ejemplo <${ui.Icon} name="arrow-right" size=${14} /></span>
            </button>`)}
          </div>
        </${ui.Modal}>`);
      });
      if (!ex) return null;
    }
    try {
      const data = ex.build({ today: PM.date.today() });
      const pid = await PM.runWithProgress('Creando el proyecto de ejemplo', (onProgress) => PM.projectOps.importData(data, { onProgress }));
      if (!pid) return null;
      PM.toast('Proyecto de ejemplo creado.');
      PM.selectProject(pid, 'tablero');
      return pid;
    } catch (e) { console.error(e); PM.toast('No se pudo crear el proyecto de ejemplo.', { tone: 'crit' }); return null; }
  };

  /* ---------------------------------------------------------------- portafolio */
  function PortfolioView() {
    const { projects, loading } = PM.useProjects();
    const st = PM.useAppState();
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const shown = projects.filter((p) => (!status || p.status === status) && (!q || (p.name + ' ' + (p.code || '') + ' ' + (p.client || '') + ' ' + (p.manager || '')).toLowerCase().includes(q.toLowerCase())));
    const counts = PM.groupBy(projects, (p) => p.status || 'Sin estado');
    const totalBudget = PM.sum(projects.filter((p) => (p.currency || 'COP') === 'COP' && p.status !== 'Cerrado'), (p) => p.budget);
    const canWrite = st.canWrite;
    const actions = html`
      ${canWrite ? html`<${ui.Button} icon="upload" onClick=${PM.importProjectFile}>Importar</${ui.Button}>` : null}
      ${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => PM.openNewProject(projects)}>Nuevo proyecto</${ui.Button}>` : null}`;
    return html`<div class="page">
      <${ui.PageHeader} eyebrow="Portafolio" title="Proyectos" description="Crea un proyecto o selecciona uno para gestionar sus documentos, líneas base y herramientas según la Guía del PMBOK®." actions=${actions} />
      ${loading ? html`<${ui.Loading} rows=${4} />` : projects.length === 0 ? html`
        <${ui.Empty} icon="portfolio" title="Aún no hay proyectos" actions=${canWrite ? html`<${ui.Button} variant="primary" icon="plus" onClick=${() => PM.openNewProject(projects)}>Nuevo proyecto</${ui.Button}>${PM.examples.length ? html`<${ui.Button} icon="sparkles" onClick=${() => PM.createExampleProject()}>Crear proyecto de ejemplo</${ui.Button}>` : null}` : null}>
          Cada proyecto guarda su acta de constitución, planes, registros, EDT, cronograma, costos y líneas base. El proyecto de ejemplo muestra todas las herramientas con datos de muestra marcados como ejemplo.
        </${ui.Empty}>` : html`
        <div class="card"><div class="grid cols-4 port-stats" style="gap:0">
          <${ui.Stat} label="Proyectos" value=${projects.length} sub=${(counts['En ejecución'] || []).length + ' en ejecución'} />
          <${ui.Stat} label="En planificación" value=${(counts['En planificación'] || []).length} sub=${(counts['Propuesta'] || []).length + ' propuestas'} />
          <${ui.Stat} label="Cerrados" value=${(counts['Cerrado'] || []).length} sub=${(counts['Suspendido'] || []).length + ' suspendidos'} />
          <${ui.Stat} label="Presupuesto activo (COP)" value=${PM.fmt.moneyShort(totalBudget)} sub="Proyectos no cerrados" title=${PM.fmt.money(totalBudget)} />
        </div></div>
        <div class="row">
          <div style="flex:1;min-width:200px;max-width:360px"><${ui.Search} value=${q} onValue=${setQ} placeholder="Buscar por nombre, código, cliente…" aria-label="Buscar proyectos" /></div>
          <div style="width:200px"><${ui.Select} value=${status} onValue=${setStatus} placeholder="Todos los estados" options=${PM.PROJECT_STATUS} aria-label="Filtrar por estado" /></div>
          <div class="spacer"></div>
          ${PM.examples.length && canWrite ? html`<${ui.Button} variant="ghost" icon="sparkles" onClick=${() => PM.createExampleProject()}>Crear proyecto de ejemplo</${ui.Button}>` : null}
        </div>
        <div class="table-wrap port-wrap"><table class="table port-table">
          <thead><tr><th>Código</th><th>Proyecto</th><th>Director</th><th>Estado</th><th>Inicio</th><th>Fin previsto</th><th class="num">Presupuesto</th><th>Actualizado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            ${shown.length === 0 ? html`<tr class="port-none"><td colspan="9" class="faint">Ningún proyecto coincide con el filtro.</td></tr>` : null}
            ${shown.map((p) => html`<tr key=${p.id} class="clickable" onClick=${(e) => { if (e.target.closest('.no-row-click')) return; PM.selectProject(p.id, 'tablero'); }}>
              <td class="mono nowrap port-c-code">${p.code || '—'}</td>
              <td class="port-c-name"><div style="font-weight:600">${p.name}</div>${p.client ? html`<div class="xsmall faint">${p.client}</div>` : null}</td>
              <td class="port-c-mgr" data-label="Director">${p.manager || html`<span class="faint">—</span>`}</td>
              <td class="port-c-status"><${ui.Chip} tone=${PM.statusTone(p.status)}>${p.status || 'Sin estado'}</${ui.Chip}></td>
              <td class="nowrap num port-c-start" data-label="Inicio">${PM.fmt.date(p.start)}</td>
              <td class="nowrap num port-c-end" data-label="Fin">${PM.fmt.date(p.end)}</td>
              <td class="num nowrap port-c-budget">${PM.fmt.money(p.budget, p.currency)}</td>
              <td class="nowrap xsmall faint port-c-upd" data-label="Actualizado">${PM.fmt.datetime(p.updatedAt)}</td>
              <td class="no-row-click port-c-act"><${ui.Dropdown} label=${'Acciones de ' + p.name} items=${[
                { label: 'Abrir tablero', icon: 'dashboard', onClick: () => PM.selectProject(p.id, 'tablero') },
                canWrite && { label: 'Duplicar', icon: 'copy', onClick: async () => { try { const id = await PM.runWithProgress('Duplicando el proyecto', (onProgress) => PM.projectOps.duplicate(p.id, p.name + ' (copia)', { onProgress })); if (!id) return; PM.toast('Proyecto duplicado.'); PM.selectProject(id, 'tablero'); } catch (e) { PM.toast('No se pudo duplicar el proyecto.', { tone: 'crit' }); } } },
                { label: 'Exportar (.json)', icon: 'download', onClick: () => PM.exportProjectFile(p.id, p) },
                canWrite && 'sep',
                canWrite && { label: 'Eliminar', icon: 'trash', danger: true, onClick: () => PM.deleteProjectFlow(p) },
              ]} /></td>
            </tr>`)}
          </tbody>
        </table></div>`}
    </div>`;
  }
  PM.registerView({ id: 'portafolio', label: 'Portafolio', group: 'portafolio', icon: 'portfolio', order: 0, needsProject: false, component: PortfolioView });

  /* ---------------------------------------------------------------- selector de proyecto
     Menú con teclado: Flecha abajo/arriba abre y recorre, Inicio/Fin, Escape cierra y devuelve el foco al botón. */
  function ProjectSwitcher() {
    const st = PM.useAppState();
    const { projects } = PM.useProjects();
    const { project } = PM.useCurrentProject();
    const [open, setOpen] = useState(false);
    const ref = useRef(); const btnRef = useRef(); const menuRef = useRef();
    const items = () => (menuRef.current ? [...menuRef.current.querySelectorAll('.menu-item')] : []);
    const close = (refocus) => { setOpen(false); if (refocus && btnRef.current) btnRef.current.focus(); };
    useEffect(() => {
      if (!open) return undefined;
      const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      const k = (e) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', f); document.addEventListener('keydown', k);
      const t = setTimeout(() => { const list = items(); const cur = list.find((x) => x.getAttribute('aria-checked') === 'true') || list[0]; cur && cur.focus(); }, 0);
      return () => { clearTimeout(t); document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k); };
    }, [open]);
    const onBtnKey = (e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setOpen(true); } };
    const onMenuKey = (e) => {
      const list = items(); if (!list.length) return;
      const i = list.indexOf(document.activeElement);
      let n = null;
      if (e.key === 'ArrowDown') n = list[(i + 1) % list.length];
      else if (e.key === 'ArrowUp') n = list[(i - 1 + list.length) % list.length];
      else if (e.key === 'Home') n = list[0];
      else if (e.key === 'End') n = list[list.length - 1];
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
      else if (e.key === 'Tab') { setOpen(false); return; }
      if (n) { e.preventDefault(); n.focus(); }
    };
    return html`<div class="switcher" ref=${ref}>
      <button type="button" ref=${btnRef} class="switcher-btn" aria-haspopup="menu" aria-expanded=${open ? 'true' : 'false'} aria-label=${'Proyecto actual: ' + (project ? (project.code ? project.code + ' · ' : '') + project.name : 'ninguno') + '. Cambiar de proyecto'} onClick=${() => setOpen(!open)} onKeyDown=${onBtnKey}>
        <div style="flex:1;min-width:0" aria-hidden="true">
          <div class="switcher-code">${project ? project.code || 'Proyecto' : 'Sin proyecto'}</div>
          <div class="switcher-name">${project ? project.name : 'Selecciona un proyecto'}</div>
        </div>
        <${ui.Icon} name="chevron-down" size=${16} />
      </button>
      ${open ? html`<div class="menu" role="menu" aria-label="Proyectos" ref=${menuRef} onKeyDown=${onMenuKey} style="top:calc(100% + 4px);left:0;right:0">
        <div class="menu-label" aria-hidden="true">Proyectos</div>
        ${projects.length === 0 ? html`<div class="small faint" style="padding:6px 9px">No hay proyectos.</div>` : null}
        ${projects.map((p) => html`<button type="button" role="menuitemradio" key=${p.id} class="menu-item" aria-checked=${p.id === st.projectId ? 'true' : 'false'} onClick=${() => { setOpen(false); PM.selectProject(p.id, st.view && st.view !== 'portafolio' ? st.view : 'tablero'); }}>
          <div style="min-width:0;flex:1"><div class="switcher-code">${p.code || ''}</div><div class="truncate" style="font-weight:500">${p.name}</div></div>
          ${p.id === st.projectId ? html`<${ui.Icon} name="check" size=${15} />` : null}
        </button>`)}
        <div class="menu-sep" role="separator"></div>
        <button type="button" role="menuitem" class="menu-item" onClick=${() => { setOpen(false); PM.navigate('portafolio'); }}><${ui.Icon} name="portfolio" size=${15} />Ver portafolio</button>
        ${st.canWrite ? html`<button type="button" role="menuitem" class="menu-item" onClick=${() => { setOpen(false); PM.openNewProject(projects); }}><${ui.Icon} name="plus" size=${15} />Nuevo proyecto</button>` : null}
      </div>` : null}
    </div>`;
  }

  /* ---------------------------------------------------------------- riel
     En pantallas angostas es un panel lateral: cerrado queda fuera del orden de tabulación (visibility, ver head.html);
     al abrirlo recibe el foco, Escape lo cierra y el foco vuelve al botón «Abrir menú». */
  const NARROW = '(max-width: 900px)';
  const isNarrow = () => { try { return window.matchMedia(NARROW).matches; } catch (e) { return false; } };
  const focusMenuButton = () => { const b = document.querySelector('.topbar .topbar-menu'); if (b) b.focus(); };
  function Rail() {
    const st = PM.useAppState();
    const ref = useRef();
    const groups = PM.GROUPS.map((g) => ({ ...g, items: PM.views.filter((v) => v.group === g.id && !v.hidden) })).filter((g) => g.items.length);
    const savingLabel = st.saving > 0 ? 'Guardando…' : st.lastSaved ? 'Cambios guardados' : '';
    const wasOpen = useRef(st.navOpen);
    useEffect(() => {
      const el = ref.current;
      if (st.navOpen && !wasOpen.current && el && isNarrow()) {
        const t = setTimeout(() => { const f = el.querySelector('.switcher-btn, .nav-item:not([disabled])'); f && f.focus(); }, 0);
        wasOpen.current = true;
        return () => clearTimeout(t);
      }
      if (!st.navOpen && wasOpen.current) {
        wasOpen.current = false;
        const ae = document.activeElement;
        if (isNarrow() && (!ae || ae === document.body || (el && el.contains(ae)))) focusMenuButton();
      }
      return undefined;
    }, [st.navOpen]);
    useEffect(() => {
      if (!st.navOpen) return undefined;
      const k = (e) => { if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('.modal-backdrop, .rail .switcher .menu, .main .menu')) return; PM.setState({ navOpen: false }); };
      document.addEventListener('keydown', k);
      return () => document.removeEventListener('keydown', k);
    }, [st.navOpen]);
    return html`<aside class="rail" id="pm-rail" ref=${ref} aria-label="Navegación">
      <div class="rail-inner">
        <div class="brand"><${BrandMark} /><div><div class="brand-name">Gestor PMBOK</div><div class="brand-sub">Ingeniería y Alquiler</div></div></div>
        <${ProjectSwitcher} />
        <nav class="nav">
          ${groups.map((g) => html`<div key=${g.id}>
            ${g.id !== 'portafolio' ? html`<div class="nav-group-label">${g.label}</div>` : null}
            <div class="nav-list">
              ${g.items.map((v) => html`<button key=${v.id} type="button" class="nav-item" aria-current=${st.view === v.id ? 'page' : undefined} disabled=${v.needsProject && !st.projectId} title=${v.needsProject && !st.projectId ? 'Selecciona un proyecto primero' : v.description} onClick=${() => PM.navigate(v.id)}>
                <${ui.Icon} name=${v.icon} size=${17} /><span>${v.label}</span>
              </button>`)}
            </div>
          </div>`)}
        </nav>
      </div>
      <div class="rail-foot stack-sm">
        <div class="row" style="gap:6px;color:var(--fg-2)"><${ui.Icon} name=${st.mode === 'db' ? 'cloud' : 'device'} size=${14} />
          <span>${st.mode === 'db' ? 'Datos guardados en el artefacto' : st.mode === 'local' ? 'Datos solo en este navegador' : 'Conectando…'}</span></div>
        ${savingLabel ? html`<div class="faint" aria-live="polite">${savingLabel}</div>` : null}
        <div>PMBOK® es una marca registrada del Project Management Institute, Inc. Herramienta independiente basada en la Guía del PMBOK® (6.ª edición).</div>
      </div>
    </aside>`;
  }

  function Banners() {
    const st = PM.useAppState();
    return html`<div>
      ${st.mode === 'local' ? html`<div class="banner"><${ui.Icon} name="device" size=${15} /><div>Modo local: los proyectos se guardan solo en este navegador. Abre la página en claude.ai con tu sesión iniciada para guardarlos en el artefacto, o usa <strong>Exportar</strong> para respaldarlos.</div></div>` : null}
      ${st.mode === 'db' && !st.canWrite ? html`<div class="banner warn"><${ui.Icon} name="lock" size=${15} /><div>Solo lectura: puedes consultar los proyectos, pero tu nivel de acceso no permite modificarlos.</div></div>` : null}
      ${st.storageWarning ? html`<div class="banner warn"><${ui.Icon} name="alert" size=${15} /><div>${st.storageWarning}</div></div>` : null}
      ${st.syncIssues > 0 ? html`<div class="banner warn" role="status"><${ui.Icon} name="refresh" size=${15} /><div>No se pudo leer parte de los datos de esta vista. Se reintenta automáticamente; mientras tanto, los registros que no cargaron no se pueden modificar.</div></div>` : null}
    </div>`;
  }

  function NoProject() {
    const { projects, loading } = PM.useProjects();
    if (loading) return html`<${ui.Loading} />`;
    return html`<div class="page"><${ui.Empty} icon="folder" title="Selecciona un proyecto" actions=${html`<${ui.Button} variant="primary" icon="portfolio" onClick=${() => PM.navigate('portafolio')}>Ir al portafolio</${ui.Button}>`}>
      Esta sección trabaja sobre un proyecto. ${projects.length ? 'Elige uno en el selector de la izquierda o en el portafolio.' : 'Crea tu primer proyecto en el portafolio.'}
    </${ui.Empty}></div>`;
  }

  function ViewHost() {
    const st = PM.useAppState();
    const { project, loading } = PM.useCurrentProject();
    const view = PM.getView(st.view) || PM.getView('portafolio');
    useEffect(() => { document.title = (view ? view.label + ' · ' : '') + 'Gestor de Proyectos PMBOK'; }, [view && view.id]);
    if (st.mode === 'loading') return html`<div class="page"><${ui.Spinner} label="Conectando con el almacenamiento…" /><${ui.Loading} rows=${4} /></div>`;
    if (!view) return null;
    if (view.needsProject) {
      if (!st.projectId) return html`<${NoProject} />`;
      if (loading) return html`<div class="page"><${ui.Loading} rows=${5} /></div>`;
      if (!project) return html`<div class="page"><${ui.Empty} icon="folder" title="El proyecto ya no existe" actions=${html`<${ui.Button} variant="primary" onClick=${() => { PM.setState({ projectId: null }); PM.prefs.set('projectId', null); PM.navigate('portafolio'); }}>Ir al portafolio</${ui.Button}>`}>Puede que otra persona lo haya eliminado.</${ui.Empty}></div>`;
    }
    const C = view.component;
    return html`<${ui.ErrorBoundary} key=${view.id + ':' + st.projectId} label=${view.id}><${C} project=${project} params=${st.params || {}} /></${ui.ErrorBoundary}>`;
  }

  function TopBar() {
    const st = PM.useAppState();
    const { project } = PM.useCurrentProject();
    const view = PM.getView(st.view);
    return html`<div class="topbar">
      <${ui.IconButton} icon="menu" label="Abrir menú" class="topbar-menu" aria-expanded=${st.navOpen ? 'true' : 'false'} aria-controls="pm-rail" onClick=${() => PM.setState({ navOpen: !st.navOpen })} />
      <div style="min-width:0;flex:1"><div class="topbar-title">${view ? view.label : ''}</div>${project ? html`<div class="xsmall faint truncate">${project.code ? project.code + ' · ' : ''}${project.name}</div>` : null}</div>
    </div>`;
  }

  PM.App = function App() {
    const st = PM.useAppState();
    useEffect(() => {
      const onHash = () => { const v = location.hash.slice(1); if (v && PM.getView(v) && v !== PM.getState().view) PM.setState({ view: v, params: {} }); };
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return html`<div class=${'app' + (st.navOpen ? ' nav-open' : '')}>
      <${Rail} />
      ${st.navOpen ? html`<div class="scrim" onClick=${() => PM.setState({ navOpen: false })}></div>` : null}
      <main class="main">
        <${TopBar} />
        <${Banners} />
        <div class="view-host"><${ViewHost} /></div>
      </main>
      <${ui.OverlayHost} />
    </div>`;
  };
})();

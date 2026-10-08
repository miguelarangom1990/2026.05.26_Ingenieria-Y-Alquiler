/* ==========================================================================
   08-shell.js — armazón de la aplicación: riel de navegación, selector de
   proyecto, avisos de modo, anfitrión de vistas, portafolio y formulario de
   proyecto (PM.ProjectForm, reutilizable).
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  const { html, useState, useEffect, useRef, useMemo, useLayoutEffect } = PM.lib;
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
      <div class="grid pf-grid">
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
    } catch (e) {
      if (!(e && e.user)) console.error(e);
      PM.toast(e && e.user && e.message ? e.message : 'No se pudo crear el proyecto de ejemplo.', { tone: 'crit' });
      return null;
    }
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
                canWrite && { label: 'Duplicar', icon: 'copy', onClick: async () => { try { const id = await PM.runWithProgress('Duplicando el proyecto', (onProgress) => PM.projectOps.duplicate(p.id, p.name + ' (copia)', { onProgress })); if (!id) return; PM.toast('Proyecto duplicado.'); PM.selectProject(id, 'tablero'); } catch (e) { PM.toast(e && e.user && e.message ? e.message : 'No se pudo duplicar el proyecto.', { tone: 'crit' }); } } },
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
     Menú con teclado: Flecha abajo/arriba abre y recorre, Inicio/Fin, Escape cierra y devuelve el foco al botón.
     Con el riel plegado (`mini`) el botón es compacto (código del proyecto, o carpeta sin proyecto) y el menú se abre
     como panel flotante a la derecha del riel (position: fixed: no lo recorta el desplazamiento del riel). */
  const LETTERS = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+$/;
  const projectBadge = (p) => {
    if (!p) return null;
    const parts = String(p.code || '').split(/[^0-9A-Za-zÁÉÍÓÚÑáéíóúñ]+/).filter(Boolean);
    if (parts.length >= 2) return { pre: LETTERS.test(parts[0]) ? parts[0].slice(0, 3).toUpperCase() : '', num: parts[parts.length - 1].slice(-4).toUpperCase() };
    if (parts.length === 1) return { pre: '', num: parts[0].slice(0, 4).toUpperCase() };
    const words = String(p.name || '').split(/[^0-9A-Za-zÁÉÍÓÚÑáéíóúñ]+/).filter((w) => w.length > 2);
    return { pre: '', num: (words.slice(0, 2).map((w) => w[0]).join('') || 'P').toUpperCase() };
  };
  const projectTitle = (p) => (p ? (p.code ? p.code + ' · ' : '') + p.name : '');
  function ProjectSwitcher({ mini, onMenuClose }) {
    const st = PM.useAppState();
    const { projects } = PM.useProjects();
    const { project } = PM.useCurrentProject();
    const [open, setOpen] = useState(false);
    const [fly, setFly] = useState(null);
    const ref = useRef(); const btnRef = useRef(); const menuRef = useRef();
    const items = () => (menuRef.current ? [...menuRef.current.querySelectorAll('.menu-item')] : []);
    const close = (refocus) => { setOpen(false); if (refocus && btnRef.current) btnRef.current.focus(); };
    /* avisa al riel cuando el menú se cierra (por Escape, clic fuera, Tab o al elegir), para que retome su plegado automático */
    const wasOpen = useRef(false);
    useEffect(() => { if (wasOpen.current && !open && onMenuClose) onMenuClose(); wasOpen.current = open; }, [open]);
    const place = () => { const b = btnRef.current; if (!b) return null; const r = b.getBoundingClientRect(); return { left: Math.round(r.right + 10), top: Math.round(Math.max(8, Math.min(r.top, window.innerHeight - 340))) }; };
    useLayoutEffect(() => { if (open && mini) setFly(place()); else if (fly) setFly(null); }, [open, mini]);
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
    const badge = projectBadge(project);
    const menuStyle = mini && fly ? 'position:fixed;left:' + fly.left + 'px;top:' + fly.top + 'px;right:auto;width:300px;max-height:calc(100vh - ' + (fly.top + 16) + 'px);z-index:85' : 'top:calc(100% + 4px);left:0;right:0';
    return html`<div class="switcher" ref=${ref}>
      <button type="button" ref=${btnRef} class=${PM.cx('switcher-btn', mini && 'is-mini')} aria-haspopup="menu" aria-expanded=${open ? 'true' : 'false'} aria-label=${'Proyecto actual: ' + (project ? projectTitle(project) : 'ninguno') + '. Cambiar de proyecto'} data-tip=${mini ? (project ? projectTitle(project) : 'Sin proyecto: elige uno') : undefined} onClick=${() => setOpen(!open)} onKeyDown=${onBtnKey}>
        ${mini ? html`<span class="switcher-badge" aria-hidden="true">${badge ? html`${badge.pre ? html`<span class="switcher-badge-pre">${badge.pre}</span>` : null}<span class="switcher-badge-num">${badge.num}</span>` : html`<${ui.Icon} name="folder" size=${18} />`}</span><${ui.Icon} name="chevron-down" size=${12} />` : html`
        <div style="flex:1;min-width:0" aria-hidden="true">
          <div class="switcher-code">${project ? project.code || 'Proyecto' : 'Sin proyecto'}</div>
          <div class="switcher-name">${project ? project.name : 'Selecciona un proyecto'}</div>
        </div>
        <${ui.Icon} name="chevron-down" size=${16} />`}
      </button>
      ${open ? html`<div class="menu" role="menu" aria-label="Proyectos" ref=${menuRef} onKeyDown=${onMenuKey} style=${menuStyle}>
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
     Pantallas angostas (≤ 900 px): panel lateral. Cerrado queda fuera del orden de tabulación (visibility, ver head.html);
     al abrirlo recibe el foco, Escape lo cierra y el foco vuelve al botón «Abrir menú».
     Escritorio: riel plegable con tres modos que se alternan con un solo botón (preferencia 'railMode'):
       fijo  — sin automatismos: queda desplegado o plegado como lo deje la persona (botón «Plegar menú»,
               preferencia 'railCollapsed'); el riel es parte del diseño y al plegarlo el contenido gana el ancho;
       hover — plegado en reposo (el diseño reserva solo el riel angosto); al pasar el mouse (120 ms de intención) se
               despliega encima del contenido, sin mover el diseño, y se pliega 300 ms después de salir;
       clic  — plegado en reposo; un clic lo despliega encima del contenido (ese primer clic solo abre) y se pliega
               solo 3 s después de abrir o de salir el puntero si no está sobre el riel, al instante con un clic fuera.
     En los modos superpuestos el foco del teclado dentro del riel lo despliega y cuenta como puntero encima (solo si la
     persona está usando el teclado: Tab desde la última pulsación del puntero); Escape lo pliega; mientras el menú de
     proyectos está abierto no se pliega. La presencia del puntero se confirma también con eventos del documento, porque
     Chromium no envía pointerleave si el nodo bajo el puntero desaparece (p. ej. «Nuevo proyecto» abre un modal).
     Plegado y desplegado tienen el mismo ritmo vertical (head.html): al desplegarse, cada ícono queda donde estaba.
     Plegado, el riel muestra solo íconos con nombre accesible y una etiqueta emergente (data-tip) al apuntarlos o
     enfocarlos (salvo en el modo «al pasar el mouse», donde el propio despliegue muestra las etiquetas). */
  const NARROW = '(max-width: 900px)';
  const isNarrow = () => { try { return window.matchMedia(NARROW).matches; } catch (e) { return false; } };
  const useNarrow = () => {
    const [n, setN] = useState(isNarrow);
    useEffect(() => {
      let mq; try { mq = window.matchMedia(NARROW); } catch (e) { return undefined; }
      const f = () => setN(mq.matches);
      if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f);
      f();
      return () => { if (mq.removeEventListener) mq.removeEventListener('change', f); else if (mq.removeListener) mq.removeListener(f); };
    }, []);
    return n;
  };
  const focusMenuButton = () => { const b = document.querySelector('.topbar .topbar-menu'); if (b) b.focus(); };
  const RAIL_MODES = ['fijo', 'hover', 'clic'];
  const RAIL_MODE = {
    fijo: { icon: 'pin', name: 'fijo', short: 'Menú fijo', toast: 'Menú fijo: queda desplegado o plegado como lo dejes; usa el botón «Plegar menú» / «Desplegar menú».' },
    hover: { icon: 'hover', name: 'se abre al pasar el mouse', short: 'Menú al pasar el mouse', toast: 'Menú al pasar el mouse: se despliega al apuntarlo y se pliega cuando retiras el mouse.' },
    clic: { icon: 'click', name: 'se abre con clic', short: 'Menú con clic', toast: 'Menú con clic: se abre con un clic y se pliega solo 3 segundos después si el mouse no está sobre él, o al hacer clic fuera.' },
  };
  const RAIL_TIMING = { openDelay: 120, hoverGrace: 300, clickRetract: 3000 };
  const railNext = (m) => RAIL_MODES[(RAIL_MODES.indexOf(m) + 1) % RAIL_MODES.length];
  const railModeLabel = (m) => 'Menú: ' + RAIL_MODE[m].name + '. Cambiar a: ' + RAIL_MODE[railNext(m)].name;
  const readRailMode = () => { const m = PM.prefs.get('railMode', 'fijo'); return RAIL_MODES.includes(m) ? m : 'fijo'; };
  /* foco de teclado (no el que deja un clic del mouse en un botón) */
  const isKbFocus = (el) => { try { return !!el && el.matches(':focus-visible'); } catch (e) { return false; } };

  function Rail() {
    const st = PM.useAppState();
    const ref = useRef();
    const narrow = useNarrow();
    const [mode, setMode] = useState(readRailMode);
    const [collapsed, setCollapsed] = useState(() => PM.prefs.get('railCollapsed', false) === true);
    const [peek, setPeek] = useState(false);
    const [tip, setTip] = useState(null);
    const overlay = !narrow && mode !== 'fijo';
    const mini = !narrow && (mode === 'fijo' ? collapsed : !peek);
    const trackMini = !narrow && (mode === 'fijo' ? collapsed : true);
    const live = useRef({}); live.current = { mode, peek, overlay, mini };
    const hovering = useRef(false); const pointer = useRef('mouse'); const tipEl = useRef(null); const timers = useRef({});
    /* la persona navega con el teclado (Tab) desde la última pulsación del puntero: solo así el foco cuenta como presencia */
    const kbNav = useRef(false);
    const clearT = (k) => { if (timers.current[k]) { clearTimeout(timers.current[k]); timers.current[k] = 0; } };
    const menuOpen = () => !!(ref.current && ref.current.querySelector('.menu'));
    const kbInside = () => { const el = ref.current, ae = document.activeElement; return !!(kbNav.current && el && ae && ae !== el && el.contains(ae) && isKbFocus(ae)); };
    const expand = () => { clearT('open'); clearT('close'); setPeek(true); };
    const retract = () => { clearT('open'); clearT('close'); setPeek(false); };
    const tryClose = () => {
      timers.current.close = 0;
      const L = live.current; if (!L.overlay || !L.peek) return;
      if (hovering.current || kbInside()) return;
      if (menuOpen()) { timers.current.close = setTimeout(tryClose, 400); return; }
      setPeek(false);
    };
    const scheduleClose = (ms) => { clearT('close'); timers.current.close = setTimeout(tryClose, ms); };
    const grace = () => (live.current.mode === 'hover' ? RAIL_TIMING.hoverGrace : RAIL_TIMING.clickRetract);
    const hideTip = () => { if (tipEl.current) { tipEl.current = null; setTip(null); } };
    const showTip = (el) => {
      if (!el || !live.current.mini || menuOpen() || (live.current.overlay && live.current.mode === 'hover')) { hideTip(); return; }
      if (tipEl.current === el) return;
      const text = el.getAttribute('data-tip'); if (!text) { hideTip(); return; }
      const r = el.getBoundingClientRect();
      tipEl.current = el;
      setTip({ text, top: Math.round(r.top + r.height / 2), left: Math.round(r.right + 10) });
    };

    useEffect(() => () => { clearT('open'); clearT('close'); }, []);
    useEffect(() => { if (narrow) { retract(); hideTip(); } }, [narrow]);
    useEffect(() => { if (!mini) hideTip(); }, [mini]);
    /* Tab marca navegación con el teclado; cualquier pulsación del puntero la termina */
    useEffect(() => {
      const key = (e) => { if (e.key === 'Tab') kbNav.current = true; };
      const down = () => { kbNav.current = false; };
      document.addEventListener('keydown', key, true); document.addEventListener('pointerdown', down, true);
      return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', down, true); };
    }, []);
    /* desplegado encima: confirma con eventos del documento si el puntero está sobre el riel (pointerleave puede no llegar) */
    useEffect(() => {
      if (!overlay || !peek) return undefined;
      const track = (e) => {
        if (e.pointerType === 'touch') return;
        const el = ref.current; const inside = !!(el && e.target instanceof Node && el.contains(e.target));
        if (inside === hovering.current) return;
        hovering.current = inside;
        if (inside) clearT('close'); else { clearT('open'); hideTip(); scheduleClose(grace()); }
      };
      document.addEventListener('pointerover', track, true); document.addEventListener('pointermove', track, true);
      return () => { document.removeEventListener('pointerover', track, true); document.removeEventListener('pointermove', track, true); };
    }, [overlay, peek]);
    /* desplegado encima del contenido: un clic fuera o Escape lo pliegan */
    useEffect(() => {
      if (!overlay || !peek) return undefined;
      const down = (e) => { const el = ref.current; if (el && e.target instanceof Node && el.contains(e.target)) return; retract(); };
      const key = (e) => { if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('.modal-backdrop') || menuOpen()) return; retract(); };
      document.addEventListener('pointerdown', down, true); document.addEventListener('keydown', key);
      return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key); };
    }, [overlay, peek]);

    const onEnter = (e) => {
      if (e.pointerType === 'touch') return;
      hovering.current = true;
      const L = live.current; if (!L.overlay) return;
      clearT('close');
      if (L.mode === 'hover' && !L.peek && !timers.current.open) timers.current.open = setTimeout(expand, RAIL_TIMING.openDelay);
    };
    const onMove = (e) => { if (e.pointerType !== 'touch') hovering.current = true; };
    const onLeave = (e) => {
      if (e.pointerType === 'touch') return;
      hovering.current = false; clearT('open'); hideTip();
      const L = live.current; if (L.overlay && L.peek) scheduleClose(grace());
    };
    const onDown = (e) => {
      pointer.current = e.pointerType || 'mouse'; hideTip();
      const L = live.current;
      if (e.pointerType === 'touch' && L.overlay && L.peek) scheduleClose(RAIL_TIMING.clickRetract);
    };
    /* modo clic (y toque en modo hover): con el riel plegado, el primer clic solo lo abre; el botón de modo siempre actúa */
    const onClickCapture = (e) => {
      const L = live.current; if (!L.overlay || L.peek) return;
      const t = e.target; if (t && t.closest && t.closest('.rail-mode')) return;
      if (L.mode === 'clic' || pointer.current === 'touch') { e.preventDefault(); e.stopPropagation(); expand(); scheduleClose(RAIL_TIMING.clickRetract); return; }
      expand();
    };
    const onFocusIn = (e) => {
      const kb = isKbFocus(e.target); const L = live.current;
      if (kb && kbNav.current && L.overlay && !L.peek) expand();
      if (kb && L.mini) showTip(e.target.closest && e.target.closest('[data-tip]'));
    };
    const onFocusOut = (e) => {
      hideTip();
      const L = live.current; const el = ref.current; const to = e.relatedTarget;
      if (!L.overlay || !L.peek || (to && el && el.contains(to)) || hovering.current) return;
      if (to) retract(); /* el foco del teclado pasó al contenido */
      else scheduleClose(grace());
    };
    const onOver = (e) => { if (e.pointerType === 'touch' || !live.current.mini) return; const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); else hideTip(); };
    /* al cerrarse el menú de proyectos (Escape, clic fuera, Tab, elegir) sin el puntero encima, retoma el plegado automático */
    const onMenuClose = () => { const L = live.current; if (L.overlay && L.peek && !hovering.current && !timers.current.close) scheduleClose(grace()); };

    const cycleMode = () => {
      const next = railNext(mode);
      setMode(next); PM.prefs.set('railMode', next);
      hideTip(); clearT('open'); clearT('close');
      if (next === 'fijo') setPeek(false);
      else { setPeek(true); scheduleClose(next === 'hover' ? RAIL_TIMING.hoverGrace : RAIL_TIMING.clickRetract); }
      PM.toast(RAIL_MODE[next].toast);
    };
    const toggleFold = () => { const v = !collapsed; setCollapsed(v); PM.prefs.set('railCollapsed', v); hideTip(); };

    /* panel lateral en pantallas angostas */
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

    const groups = PM.GROUPS.map((g) => ({ ...g, items: PM.views.filter((v) => v.group === g.id && !v.hidden) })).filter((g) => g.items.length);
    /* una vista oculta (p. ej. «documento») marca como actual la sección de la que depende: su `parent` o, si no lo
       declara, la vista visible anterior de su grupo («Documentos») */
    const current = (() => {
      const v = PM.getView(st.view); if (!v || !v.hidden) return st.view;
      if (v.parent) return v.parent;
      const prev = PM.views.filter((x) => !x.hidden && x.group === v.group && x.order <= v.order);
      return prev.length ? prev[prev.length - 1].id : st.view;
    })();
    const savingLabel = st.persistFailed ? 'Cambios sin guardar' : st.saving > 0 ? 'Guardando…' : st.lastSaved ? 'Cambios guardados' : '';
    const storeText = st.mode === 'db' ? 'Datos guardados en el artefacto' : st.mode === 'local' ? 'Datos solo en este navegador' : 'Conectando…';
    const modeLabel = railModeLabel(mode);
    const foldLabel = collapsed ? 'Desplegar menú' : 'Plegar menú';
    return html`<aside class=${PM.cx('rail', mini && 'is-mini', overlay && peek && 'is-peek', trackMini && 'track-mini')} id="pm-rail" ref=${ref} aria-label="Navegación" data-mode=${narrow ? undefined : mode}
      onPointerEnter=${onEnter} onPointerLeave=${onLeave} onPointerMove=${onMove} onPointerDown=${onDown} onPointerOver=${onOver} onClickCapture=${onClickCapture} onfocusin=${onFocusIn} onfocusout=${onFocusOut} onScroll=${hideTip}>
      <div class="rail-inner">
        <div class="rail-head">
          <div class="brand"><${BrandMark} /><div class="brand-text"><div class="brand-name">Gestor PMBOK</div><div class="brand-sub">Ingeniería y Alquiler</div></div></div>
          ${narrow ? null : html`<div class="rail-ctl">
            <button type="button" class="rail-btn rail-mode" aria-label=${modeLabel} title=${mini ? undefined : modeLabel} data-tip=${mini ? modeLabel : undefined} onClick=${cycleMode}><${ui.Icon} name=${RAIL_MODE[mode].icon} size=${16} /><span class="rail-mode-text" aria-hidden="true">${RAIL_MODE[mode].short}</span></button>
            ${mode === 'fijo' ? html`<button type="button" class="rail-btn rail-fold" aria-label=${foldLabel} title=${mini ? undefined : foldLabel} data-tip=${mini ? foldLabel : undefined} aria-expanded=${collapsed ? 'false' : 'true'} onClick=${toggleFold}><${ui.Icon} name=${collapsed ? 'rail-expand' : 'rail-collapse'} size=${16} /></button>` : null}
          </div>`}
        </div>
        <${ProjectSwitcher} mini=${mini} onMenuClose=${onMenuClose} />
        <nav class="nav">
          ${groups.map((g) => html`<div key=${g.id} class="nav-group">
            ${g.id !== 'portafolio' ? html`<div class="nav-group-label"><span class="nav-group-text">${g.label}</span></div>` : null}
            <div class="nav-list">
              ${g.items.map((v) => { const off = v.needsProject && !st.projectId; return html`<button key=${v.id} type="button" class="nav-item" aria-current=${current === v.id ? 'page' : undefined} disabled=${off} aria-label=${mini ? v.label : undefined} title=${mini ? undefined : off ? 'Selecciona un proyecto primero' : v.description} data-tip=${mini ? v.label + (off ? ' · selecciona un proyecto primero' : '') : undefined} onClick=${() => PM.navigate(v.id)}>
                <${ui.Icon} name=${v.icon} size=${17} /><span class="nav-label">${v.label}</span>
              </button>`; })}
            </div>
          </div>`)}
        </nav>
      </div>
      <div class="rail-foot stack-sm">
        <div class=${PM.cx('row rail-store', st.persistFailed && 'is-unsaved')} style="gap:6px;color:var(--fg-2)" data-tip=${mini ? storeText + (st.persistFailed ? ' · cambios sin guardar' : '') : undefined}><${ui.Icon} name=${st.persistFailed ? 'alert' : st.mode === 'db' ? 'cloud' : 'device'} size=${mini ? 16 : 14} />
          <span class="rail-store-text">${storeText}</span></div>
        ${savingLabel ? html`<div class=${PM.cx('rail-saving', st.persistFailed ? 'is-unsaved' : 'faint')} aria-live="polite">${savingLabel}</div>` : null}
        <div class="rail-legal">PMBOK® es una marca registrada del Project Management Institute, Inc. Herramienta independiente basada en la Guía del PMBOK® (6.ª edición).</div>
      </div>
      ${mini && tip ? html`<div class="rail-tip" aria-hidden="true" style=${'top:' + tip.top + 'px;left:' + tip.left + 'px'}>${tip.text}</div>` : null}
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
